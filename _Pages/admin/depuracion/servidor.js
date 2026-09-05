"use server"
import { cookies } from "next/headers"
import db from "@/_DB/db";

/**
 * Obtener información de sesión del usuario
 */
async function obtenerSesion() {
    const cookieStore = await cookies()
    const usuarioId = cookieStore.get("userId")?.value
    const empresaId = cookieStore.get("empresaId")?.value

    if (!usuarioId || !empresaId) {
        throw new Error("No hay sesión activa")
    }

    return { usuarioId: parseInt(usuarioId), empresaId: parseInt(empresaId) }
}

async function obtenerExpresionMontoCuotaVencida(connection, alias = 'cu') {
    const [cols] = await connection.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'fin_cuotas'
    `)

    const nombres = new Set(cols.map(c => c.COLUMN_NAME))

    if (nombres.has('saldo_pendiente')) return `${alias}.saldo_pendiente`
    if (nombres.has('total_a_pagar') && nombres.has('monto_pagado')) return `(${alias}.total_a_pagar - IFNULL(${alias}.monto_pagado, 0))`
    if (nombres.has('monto_cuota')) return `${alias}.monto_cuota`
    if (nombres.has('monto')) return `${alias}.monto`

    return '0'
}

async function obtenerSetColumnas(connection, tabla) {
    const [cols] = await connection.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [tabla]
    )
    return new Set(cols.map(c => c.COLUMN_NAME))
}

async function existeTabla(connection, tabla) {
    const [[row]] = await connection.query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [tabla]
    )
    return Number(row?.total || 0) > 0
}

/**
 * 1. Obtener todos los clientes con información de crédito
 */
export async function obtenerClientesConCredito({ busqueda = '', pagina = 0, limite = 30 } = {}) {
    let connection
    try {
        const { empresaId } = await obtenerSesion()
        connection = await db.getConnection()
        const exprMontoVencido = await obtenerExpresionMontoCuotaVencida(connection, 'cu')
        const offset = pagina * limite

        const like = `%${busqueda}%`
        const params = busqueda ? [empresaId, like, like, like] : [empresaId]
        const busquedaWhere = busqueda
            ? `AND (c.nombre LIKE ? OR c.apellidos LIKE ? OR c.numero_documento LIKE ?)`
            : ''

        const [[{ total }]] = await connection.query(
            `SELECT COUNT(*) AS total
             FROM clientes c
             WHERE c.empresa_id = ? ${busquedaWhere}`,
            params
        )

        const [clientes] = await connection.query(`
            SELECT
                c.id,
                CONCAT(c.nombre, ' ', COALESCE(c.apellidos, '')) AS nombreCompleto,
                c.numero_documento                               AS numeroDocumento,
                c.telefono,
                COALESCE(cc.limite_credito,   0)  AS limiteCredito,
                COALESCE(cc.saldo_utilizado,  0)  AS saldoUtilizado,
                COALESCE(cc.saldo_disponible, 0)  AS saldoDisponible,
                COALESCE(cc.clasificacion,   'A') AS clasificacion,
                COALESCE(cc.score_crediticio, 100) AS scoreCrediticio,
                COALESCE(cc.estado_credito,  'normal') AS estadoCredito,
                cc.fecha_ultimo_pago                             AS fechaUltimoPago,
                COALESCE(cv.cuotasVencidas, 0)   AS cuotasVencidas,
                COALESCE(cv.montoVencido,   0)   AS montoVencido
            FROM clientes c
            LEFT JOIN (
                SELECT cliente_id, limite_credito, saldo_utilizado, saldo_disponible,
                       clasificacion, score_crediticio, estado_credito, fecha_ultimo_pago
                FROM credito_clientes
                WHERE activo = TRUE AND empresa_id = ?
            ) cc ON cc.cliente_id = c.id
            LEFT JOIN (
                SELECT fc.cliente_id,
                       COUNT(*)          AS cuotasVencidas,
                       SUM(${exprMontoVencido}) AS montoVencido
                FROM fin_cuotas cu
                JOIN fin_contratos fc ON cu.contrato_id = fc.id
                WHERE cu.estado = 'vencida' AND fc.empresa_id = ?
                GROUP BY fc.cliente_id
            ) cv ON cv.cliente_id = c.id
            WHERE c.empresa_id = ?
              ${busquedaWhere}
            ORDER BY
                CASE cc.clasificacion
                    WHEN 'D' THEN 1 WHEN 'C' THEN 2 WHEN 'B' THEN 3 WHEN 'A' THEN 4 ELSE 5
                END,
                c.nombre ASC
            LIMIT ? OFFSET ?
        `, [empresaId, empresaId, empresaId, ...( busqueda ? [like, like, like] : []), limite, offset])

        connection.release()
        return {
            success: true,
            total: parseInt(total) || 0,
            clientes: clientes.map(c => ({
                ...c,
                porcentajeUso: c.limiteCredito > 0 ? Math.round((c.saldoUtilizado / c.limiteCredito) * 100) : 0
            }))
        }

    } catch (error) {
        console.error("[obtenerClientesConCredito]", error)
        if (connection) connection.release()
        return { success: false, clientes: [], total: 0, mensaje: error.message }
    }
}

/**
 * 2. Obtener estadísticas globales de crédito
 */
export async function obtenerEstadisticasCredito() {
    let connection
    try {
        const { empresaId } = await obtenerSesion()
        connection = await db.getConnection()
        const exprMontoVencido = await obtenerExpresionMontoCuotaVencida(connection, 'cu')

        const [[stats]] = await connection.query(`
            SELECT
                COUNT(DISTINCT cc.cliente_id)                                          AS totalClientes,
                COALESCE(SUM(cc.limite_credito),   0)                                  AS creditoOtorgado,
                COALESCE(SUM(cc.saldo_disponible), 0)                                  AS creditoDisponible,
                COUNT(CASE WHEN cc.estado_credito = 'normal'    THEN 1 END)             AS clientesNormales,
                COUNT(CASE WHEN cc.estado_credito = 'atrasado'  THEN 1 END)             AS clientesAtrasados,
                COUNT(CASE WHEN cc.estado_credito = 'bloqueado' THEN 1 END)             AS clientesBloqueados,
                COUNT(CASE WHEN cc.estado_credito = 'suspendido' THEN 1 END)            AS clientesSuspendidos,
                COUNT(CASE WHEN cc.clasificacion = 'A' THEN 1 END)                     AS clasificacionA,
                COUNT(CASE WHEN cc.clasificacion = 'B' THEN 1 END)                     AS clasificacionB,
                COUNT(CASE WHEN cc.clasificacion = 'C' THEN 1 END)                     AS clasificacionC,
                COUNT(CASE WHEN cc.clasificacion = 'D' THEN 1 END)                     AS clasificacionD
            FROM credito_clientes cc
            INNER JOIN clientes c ON cc.cliente_id = c.id
            WHERE cc.activo = TRUE AND cc.empresa_id = ? AND c.estado IN ('activo', 'inactivo')
        `, [empresaId])

        const [[{ deudaVencida }]] = await connection.query(`
            SELECT COALESCE(SUM(${exprMontoVencido}), 0) AS deudaVencida
            FROM fin_cuotas cu
            JOIN fin_contratos fc ON cu.contrato_id = fc.id
            WHERE cu.estado = 'vencida' AND fc.empresa_id = ?
        `, [empresaId])

        connection.release()
        return {
            success: true,
            estadisticas: {
                totalClientes:      stats.totalClientes || 0,
                creditoOtorgado:    parseFloat(stats.creditoOtorgado)   || 0,
                creditoDisponible:  parseFloat(stats.creditoDisponible) || 0,
                deudaVencida:       parseFloat(deudaVencida)            || 0,
                clientesNormales:   stats.clientesNormales   || 0,
                clientesAtrasados:  stats.clientesAtrasados  || 0,
                clientesBloqueados: stats.clientesBloqueados || 0,
                clientesSuspendidos:stats.clientesSuspendidos|| 0,
                clasificacionA:     stats.clasificacionA || 0,
                clasificacionB:     stats.clasificacionB || 0,
                clasificacionC:     stats.clasificacionC || 0,
                clasificacionD:     stats.clasificacionD || 0
            }
        }

    } catch (error) {
        console.error("[obtenerEstadisticasCredito]", error)
        if (connection) connection.release()
        return { success: false, estadisticas: null, mensaje: error.message }
    }
}

/**
 * 3. Obtener detalle completo de crédito de un cliente
 */
export async function obtenerDetalleCredito(clienteId) {
    try {
        const connection = await db.getConnection()

        try {
            // Información del cliente y crédito
            const [cliente] = await connection.query(`
                SELECT 
                    c.id,
                    CONCAT(c.nombre, ' ', COALESCE(c.apellidos, '')) AS nombreCompleto,
                    c.numero_documento AS numeroDocumento,
                    c.telefono,
                    c.email,
                    c.foto_url AS fotoUrl,
                    td.codigo AS tipoDocumentoCodigo,
                    
                    cc.limite_credito AS limiteCredito,
                    cc.saldo_utilizado AS saldoUtilizado,
                    cc.saldo_disponible AS saldoDisponible,
                    cc.clasificacion,
                    cc.score_crediticio AS scoreCrediticio,
                    cc.estado_credito AS estadoCredito,
                    cc.razon_estado AS razonEstado,
                    cc.frecuencia_pago AS frecuenciaPago,
                    cc.dias_plazo AS diasPlazo,
                    cc.fecha_proximo_vencimiento AS fechaProximoVencimiento,
                    cc.fecha_ultimo_pago AS fechaUltimoPago,
                    cc.promedio_dias_pago AS promedioDiasPago,
                    cc.total_creditos_otorgados AS totalCreditosOtorgados,
                    cc.total_creditos_pagados AS totalCreditosPagados,
                    cc.total_creditos_vencidos AS totalCreditosVencidos
                    
                FROM clientes c
                LEFT JOIN tipos_documento td ON c.tipo_documento_id = td.id
                LEFT JOIN credito_clientes cc ON cc.id = (
                    SELECT MAX(cc2.id)
                    FROM credito_clientes cc2
                    WHERE cc2.cliente_id = c.id AND cc2.activo = TRUE
                )
                WHERE c.id = ?
            `, [clienteId])

            if (cliente.length === 0) {
                return {
                    success: false,
                    mensaje: "Cliente no encontrado"
                }
            }

            let deudas = []
            let contratos = []
            let historial = []

            // Deudas activas (CxC) - tolerante a variaciones de esquema.
            try {
                if (await existeTabla(connection, 'cuentas_por_cobrar')) {
                    const colsCxC = await obtenerSetColumnas(connection, 'cuentas_por_cobrar')
                    const colNumeroDoc = colsCxC.has('numero_documento') ? 'numero_documento' : 'NULL'
                    const colFechaEmision = colsCxC.has('fecha_emision') ? 'fecha_emision' : 'NULL'
                    const colFechaVenc = colsCxC.has('fecha_vencimiento') ? 'fecha_vencimiento' : 'NULL'
                    const colMontoTotal = colsCxC.has('monto_total') ? 'monto_total' : '0'
                    const colMontoPagado = colsCxC.has('monto_pagado') ? 'monto_pagado' : '0'
                    const colSaldoPend = colsCxC.has('saldo_pendiente') ? 'saldo_pendiente' : '0'
                    const colEstadoCxC = colsCxC.has('estado_cxc') ? 'estado_cxc' : "'activa'"
                    const colDiasAtraso = colsCxC.has('dias_atraso') ? 'dias_atraso' : '0'
                    const colNumeroAbonos = colsCxC.has('numero_abonos') ? 'numero_abonos' : '0'
                    const filtroNoPagadas = colsCxC.has('estado_cxc') ? "AND estado_cxc != 'pagada'" : ''

                    const [rowsDeudas] = await connection.query(`
                        SELECT
                            id,
                            ${colNumeroDoc} AS numeroDocumento,
                            ${colFechaEmision} AS fechaEmision,
                            ${colFechaVenc} AS fechaVencimiento,
                            ${colMontoTotal} AS montoTotal,
                            ${colMontoPagado} AS montoPagado,
                            ${colSaldoPend} AS saldoPendiente,
                            ${colEstadoCxC} AS estadoCxc,
                            ${colDiasAtraso} AS diasAtraso,
                            ${colNumeroAbonos} AS numeroAbonos
                        FROM cuentas_por_cobrar
                        WHERE cliente_id = ?
                          ${filtroNoPagadas}
                        ORDER BY ${colsCxC.has('fecha_vencimiento') ? 'fecha_vencimiento' : 'id'} ASC
                    `, [clienteId])
                    deudas = rowsDeudas
                }
            } catch (errDeudas) {
                console.warn('[obtenerDetalleCredito][deudas]', errDeudas?.message)
            }

            // Contratos del cliente - tolerante a columnas faltantes.
            try {
                if (await existeTabla(connection, 'fin_contratos')) {
                    const colsContratos = await obtenerSetColumnas(connection, 'fin_contratos')
                    if (colsContratos.has('cliente_id')) {
                        const colNumeroContrato = colsContratos.has('numero')
                            ? 'c.numero'
                            : colsContratos.has('numero_contrato')
                                ? 'c.numero_contrato'
                                : 'CAST(c.id AS CHAR)'
                        const colMontoFinanciado = colsContratos.has('monto_financiado') ? 'c.monto_financiado' : '0'
                        const colSaldoPendiente = colsContratos.has('saldo_pendiente') ? 'c.saldo_pendiente' : '0'
                        const colCuotaMensual = colsContratos.has('cuota_mensual') ? 'c.cuota_mensual' : (colsContratos.has('monto_cuota') ? 'c.monto_cuota' : '0')
                        const colFrecuencia = colsContratos.has('frecuencia') ? 'c.frecuencia' : "'mensual'"
                        const colFechaInicio = colsContratos.has('fecha_inicio') ? 'c.fecha_inicio' : (colsContratos.has('created_at') ? 'c.created_at' : 'NULL')
                        const colFechaFin = colsContratos.has('fecha_fin') ? 'c.fecha_fin' : 'NULL'
                        const colEstado = colsContratos.has('estado') ? 'c.estado' : "'activo'"

                        let qSubCuotas = 'SELECT NULL AS contrato_id, 0 AS total_cuotas, 0 AS cuotas_pagadas, 0 AS cuotas_vencidas'
                        if (await existeTabla(connection, 'fin_cuotas')) {
                            const colsCuotas = await obtenerSetColumnas(connection, 'fin_cuotas')
                            if (colsCuotas.has('contrato_id')) {
                                qSubCuotas = `
                                    SELECT
                                        contrato_id,
                                        COUNT(*) AS total_cuotas,
                                        SUM(CASE WHEN estado = 'pagada' THEN 1 ELSE 0 END) AS cuotas_pagadas,
                                        SUM(CASE WHEN estado = 'vencida' THEN 1 ELSE 0 END) AS cuotas_vencidas
                                    FROM fin_cuotas
                                    GROUP BY contrato_id
                                `
                            }
                        }

                        const [rowsContratos] = await connection.query(`
                            SELECT
                                c.id,
                                ${colNumeroContrato} AS numero,
                                ${colEstado} AS estado,
                                ${colMontoFinanciado} AS montoFinanciado,
                                ${colSaldoPendiente} AS saldoPendiente,
                                ${colCuotaMensual} AS cuotaMensual,
                                ${colFrecuencia} AS frecuencia,
                                ${colFechaInicio} AS fechaInicio,
                                ${colFechaFin} AS fechaFin,
                                COALESCE(q.total_cuotas, 0) AS totalCuotas,
                                COALESCE(q.cuotas_pagadas, 0) AS cuotasPagadas,
                                COALESCE(q.cuotas_vencidas, 0) AS cuotasVencidas
                            FROM fin_contratos c
                            LEFT JOIN (${qSubCuotas}) q ON q.contrato_id = c.id
                            WHERE c.cliente_id = ?
                            ORDER BY c.id DESC
                        `, [clienteId])
                        contratos = rowsContratos
                    }
                }
            } catch (errContratos) {
                console.warn('[obtenerDetalleCredito][contratos]', errContratos?.message)
            }

            // Historial de eventos - tolerante a tabla/columna.
            try {
                if (await existeTabla(connection, 'historial_credito')) {
                    const colsHist = await obtenerSetColumnas(connection, 'historial_credito')
                    if (colsHist.has('cliente_id')) {
                        const [rowsHist] = await connection.query(`
                            SELECT
                                id,
                                ${colsHist.has('tipo_evento') ? 'tipo_evento' : "'evento'"} AS tipoEvento,
                                ${colsHist.has('descripcion') ? 'descripcion' : "'Sin descripción'"} AS descripcion,
                                ${colsHist.has('clasificacion_momento') ? 'clasificacion_momento' : 'NULL'} AS clasificacionMomento,
                                ${colsHist.has('score_momento') ? 'score_momento' : 'NULL'} AS scoreMomento,
                                ${colsHist.has('generado_por') ? 'generado_por' : 'NULL'} AS generadoPor,
                                ${colsHist.has('fecha_evento') ? 'fecha_evento' : (colsHist.has('fecha_creacion') ? 'fecha_creacion' : 'NULL')} AS fechaEvento
                            FROM historial_credito
                            WHERE cliente_id = ?
                            ORDER BY ${colsHist.has('fecha_evento') ? 'fecha_evento' : (colsHist.has('fecha_creacion') ? 'fecha_creacion' : 'id')} DESC
                            LIMIT 50
                        `, [clienteId])
                        historial = rowsHist
                    }
                }
            } catch (errHist) {
                console.warn('[obtenerDetalleCredito][historial]', errHist?.message)
            }

            return {
                success: true,
                cliente: cliente[0],
                contratos,
                deudas,
                historial
            }

        } finally {
            connection.release()
        }

    } catch (error) {
        console.error("Error en obtenerDetalleCredito:", error)
        return {
            success: false,
            mensaje: "Error al obtener detalle de crédito",
            error: error.message
        }
    }
}

/**
 * 5. Obtener historial completo de eventos crediticios del cliente
 */
export async function obtenerHistorialCredito(clienteId) {
    try {
        const connection = await db.getConnection()

        try {
            if (!(await existeTabla(connection, 'historial_credito'))) {
                return { success: true, historial: [] }
            }

            const colsHist = await obtenerSetColumnas(connection, 'historial_credito')
            if (!colsHist.has('cliente_id')) {
                return { success: true, historial: [] }
            }

            const puedeJoinUsuarios = await existeTabla(connection, 'usuarios') && colsHist.has('usuario_id')

            const [historial] = await connection.query(`
                SELECT
                    hc.id,
                    ${colsHist.has('tipo_evento') ? 'hc.tipo_evento' : "'evento'"} AS tipoEvento,
                    ${colsHist.has('descripcion') ? 'hc.descripcion' : "'Sin descripción'"} AS descripcion,
                    ${colsHist.has('datos_anteriores') ? 'hc.datos_anteriores' : 'NULL'} AS datosAnteriores,
                    ${colsHist.has('datos_nuevos') ? 'hc.datos_nuevos' : 'NULL'} AS datosNuevos,
                    ${colsHist.has('clasificacion_momento') ? 'hc.clasificacion_momento' : 'NULL'} AS clasificacionMomento,
                    ${colsHist.has('score_momento') ? 'hc.score_momento' : 'NULL'} AS scoreMomento,
                    ${colsHist.has('generado_por') ? 'hc.generado_por' : 'NULL'} AS generadoPor,
                    ${colsHist.has('fecha_evento') ? 'hc.fecha_evento' : (colsHist.has('fecha_creacion') ? 'hc.fecha_creacion' : 'NULL')} AS fechaEvento,
                    ${puedeJoinUsuarios ? 'u.nombre' : 'NULL'} AS usuarioNombre
                FROM historial_credito hc
                ${puedeJoinUsuarios ? 'LEFT JOIN usuarios u ON hc.usuario_id = u.id' : ''}
                WHERE hc.cliente_id = ?
                ORDER BY ${colsHist.has('fecha_evento') ? 'hc.fecha_evento' : (colsHist.has('fecha_creacion') ? 'hc.fecha_creacion' : 'hc.id')} DESC
            `, [clienteId])

            return {
                success: true,
                historial
            }

        } finally {
            connection.release()
        }

    } catch (error) {
        console.error("Error en obtenerHistorialCredito:", error)
        return {
            success: true,
            historial: []
        }
    }
}

/**
 * 6. Actualizar configuración de crédito de un cliente
 */
export async function actualizarConfiguracionCredito(clienteId, datos) {
    try {
        const { usuarioId, empresaId } = await obtenerSesion()
        const connection = await db.getConnection()

        try {
            await connection.beginTransaction()

            const {
                limiteCredito,
                frecuenciaPago,
                diasPlazo,
                estadoCredito,
                observaciones
            } = datos

            // Actualizar crédito del cliente
            await connection.query(`
                UPDATE credito_clientes
                SET 
                    limite_credito = ?,
                    frecuencia_pago = ?,
                    dias_plazo = ?,
                    estado_credito = ?,
                    razon_estado = ?,
                    modificado_por = ?
                WHERE cliente_id = ? AND empresa_id = ?
            `, [
                limiteCredito,
                frecuenciaPago,
                diasPlazo || 30,
                estadoCredito,
                observaciones,
                usuarioId,
                clienteId,
                empresaId
            ])

            // Registrar en historial
            await connection.query(`
                INSERT INTO historial_credito 
                (credito_cliente_id, empresa_id, cliente_id, tipo_evento, descripcion, generado_por, usuario_id)
                SELECT 
                    cc.id,
                    ?,
                    ?,
                    'ajuste_limite',
                    ?,
                    'usuario',
                    ?
                FROM credito_clientes cc
                WHERE cc.cliente_id = ? AND cc.empresa_id = ?
            `, [
                empresaId,
                clienteId,
                observaciones || 'Ajuste manual de configuración de crédito',
                usuarioId,
                clienteId,
                empresaId
            ])

            await connection.commit()

            return {
                success: true,
                mensaje: "Configuración de crédito actualizada correctamente"
            }

        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }

    } catch (error) {
        console.error("Error en actualizarConfiguracionCredito:", error)
        return {
            success: false,
            mensaje: "Error al actualizar configuración de crédito",
            error: error.message
        }
    }
}

export async function obtenerDatosEmpresa() {
    try {
        const sesion = await obtenerSesion()
        const connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT moneda, simbolo_moneda, locale, impuesto_nombre, impuesto_porcentaje
             FROM empresas
             WHERE id = ? AND activo = TRUE`,
            [sesion.empresaId]
        )
        connection.release()

        if (rows.length === 0) {
            return { success: false, mensaje: 'Empresa no encontrada' }
        }

        return { success: true, empresa: rows[0] }
    } catch (error) {
        return { success: false, mensaje: 'Error al obtener datos empresa' }
    }
}
