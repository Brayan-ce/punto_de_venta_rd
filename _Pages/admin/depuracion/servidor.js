"use server"
import { cookies } from "next/headers"
import db from "@/_DB/db";

/**
 * Obtener información de sesión del usuario
 */
async function obtenerSesion() {
    const cookieStore = await cookies()
    const usuarioId = cookieStore.get("usuario_id")?.value
    const empresaId = cookieStore.get("empresa_id")?.value

    if (!usuarioId || !empresaId) {
        throw new Error("No hay sesión activa")
    }

    return { usuarioId: parseInt(usuarioId), empresaId: parseInt(empresaId) }
}

/**
 * 1. Obtener todos los clientes con información de crédito
 */
export async function obtenerClientesConCredito() {
    try {
        const { empresaId } = await obtenerSesion()
        const connection = await db.getConnection()

        try {
            const query = `
                SELECT 
                    c.id,
                    CONCAT(c.nombre, ' ', COALESCE(c.apellidos, '')) AS nombreCompleto,
                    c.nombre,
                    c.apellidos,
                    c.numero_documento AS numeroDocumento,
                    c.telefono,
                    c.email,
                    c.foto_url AS fotoUrl,
                    td.codigo AS tipoDocumentoCodigo,
                    td.nombre AS tipoDocumentoNombre,
                    
                    -- Información de Crédito
                    COALESCE(cc.limite_credito, 0) AS limiteCredito,
                    COALESCE(cc.saldo_utilizado, 0) AS saldoUtilizado,
                    COALESCE(cc.saldo_disponible, 0) AS saldoDisponible,
                    COALESCE(cc.clasificacion, 'A') AS clasificacion,
                    COALESCE(cc.score_crediticio, 100) AS scoreCrediticio,
                    COALESCE(cc.estado_credito, 'normal') AS estadoCredito,
                    cc.fecha_proximo_vencimiento AS fechaProximoVencimiento,
                    COALESCE(cc.promedio_dias_pago, 0) AS promedioDiasPago,
                    COALESCE(cc.frecuencia_pago, 'mensual') AS frecuenciaPago,
                    cc.fecha_ultimo_pago AS fechaUltimoPago,
                    
                    -- Estadísticas de deudas
                    COUNT(DISTINCT cxc.id) AS totalDeudas,
                    SUM(CASE WHEN cxc.estado_cxc = 'vencida' THEN 1 ELSE 0 END) AS deudasVencidas,
                    COALESCE(SUM(CASE WHEN cxc.estado_cxc IN ('activa', 'vencida', 'parcial') THEN cxc.saldo_pendiente ELSE 0 END), 0) AS totalDeudaPendiente,
                    COALESCE(SUM(CASE WHEN cxc.estado_cxc = 'vencida' THEN cxc.saldo_pendiente ELSE 0 END), 0) AS montoVencido,
                    MAX(cxc.dias_atraso) AS diasAtrasoMaximo
                    
                FROM clientes c
                LEFT JOIN tipos_documento td ON c.tipo_documento_id = td.id
                LEFT JOIN credito_clientes cc ON c.id = cc.cliente_id AND cc.empresa_id = ?
                LEFT JOIN cuentas_por_cobrar cxc ON c.id = cxc.cliente_id AND cxc.empresa_id = ? AND cxc.estado_cxc != 'pagada'
                WHERE c.empresa_id = ? 
                    AND c.estado IN ('activo', 'inactivo')
                    AND cc.id IS NOT NULL
                GROUP BY c.id, cc.id, td.codigo, td.nombre
                ORDER BY 
                    CASE cc.clasificacion 
                        WHEN 'D' THEN 1 
                        WHEN 'C' THEN 2 
                        WHEN 'B' THEN 3 
                        WHEN 'A' THEN 4 
                        ELSE 5 
                    END,
                    c.nombre ASC
            `

            const [clientes] = await connection.query(query, [empresaId, empresaId, empresaId])

            // Calcular información adicional para cada cliente
            const clientesConInfo = clientes.map(cliente => {
                const porcentajeUso = cliente.limiteCredito > 0
                    ? Math.round((cliente.saldoUtilizado / cliente.limiteCredito) * 100)
                    : 0

                return {
                    ...cliente,
                    porcentajeUso,
                    tieneDeuda: cliente.totalDeudaPendiente > 0,
                    tieneDeudaVencida: cliente.montoVencido > 0,
                    puedeVender: cliente.estadoCredito === 'normal' && cliente.saldoDisponible > 0
                }
            })

            return {
                success: true,
                clientes: clientesConInfo
            }

        } finally {
            connection.release()
        }

    } catch (error) {
        console.error("Error en obtenerClientesConCredito:", error)
        return {
            success: false,
            mensaje: "Error al obtener clientes con crédito",
            error: error.message
        }
    }
}

/**
 * 2. Obtener estadísticas globales de crédito
 */
export async function obtenerEstadisticasCredito() {
    try {
        const { empresaId } = await obtenerSesion()
        const connection = await db.getConnection()

        try {
            const query = `
                SELECT 
                    COUNT(DISTINCT cc.cliente_id) AS totalClientes,
                    COUNT(DISTINCT CASE WHEN c.activo = 1 THEN cc.cliente_id END) AS clientesActivos,
                    
                    SUM(cc.limite_credito) AS creditoOtorgado,
                    SUM(cc.saldo_utilizado) AS creditoUtilizado,
                    SUM(cc.saldo_disponible) AS creditoDisponible,
                    
                    COUNT(CASE WHEN cc.estado_credito = 'normal' THEN 1 END) AS clientesNormales,
                    COUNT(CASE WHEN cc.estado_credito = 'atrasado' THEN 1 END) AS clientesAtrasados,
                    COUNT(CASE WHEN cc.estado_credito = 'bloqueado' THEN 1 END) AS clientesBloqueados,
                    COUNT(CASE WHEN cc.estado_credito = 'suspendido' THEN 1 END) AS clientesSuspendidos,
                    
                    COUNT(CASE WHEN cc.clasificacion = 'A' THEN 1 END) AS clasificacionA,
                    COUNT(CASE WHEN cc.clasificacion = 'B' THEN 1 END) AS clasificacionB,
                    COUNT(CASE WHEN cc.clasificacion = 'C' THEN 1 END) AS clasificacionC,
                    COUNT(CASE WHEN cc.clasificacion = 'D' THEN 1 END) AS clasificacionD,
                    
                    (SELECT COUNT(*) FROM alertas_credito WHERE empresa_id = ? AND estado = 'activa') AS alertasActivas,
                    (SELECT COUNT(*) FROM alertas_credito WHERE empresa_id = ? AND estado = 'activa' AND severidad = 'critica') AS alertasCriticas
                    
                FROM credito_clientes cc
                INNER JOIN clientes c ON cc.cliente_id = c.id
                WHERE cc.empresa_id = ?
                    AND c.estado IN ('activo', 'inactivo')
            `

            const [rows] = await connection.query(query, [empresaId, empresaId, empresaId])
            const stats = rows[0]

            // Obtener deuda vencida total
            const [deudaVencida] = await connection.query(`
                SELECT COALESCE(SUM(saldo_pendiente), 0) AS deudaVencida
                FROM cuentas_por_cobrar
                WHERE empresa_id = ? AND estado_cxc = 'vencida'
            `, [empresaId])

            return {
                success: true,
                estadisticas: {
                    totalClientes: stats.totalClientes || 0,
                    clientesActivos: stats.clientesActivos || 0,
                    clientesBloqueados: stats.clientesBloqueados || 0,
                    creditoOtorgado: parseFloat(stats.creditoOtorgado) || 0,
                    creditoUtilizado: parseFloat(stats.creditoUtilizado) || 0,
                    creditoDisponible: parseFloat(stats.creditoDisponible) || 0,
                    deudaVencida: parseFloat(deudaVencida[0].deudaVencida) || 0,
                    clientesNormales: stats.clientesNormales || 0,
                    clientesAtrasados: stats.clientesAtrasados || 0,
                    clientesSuspendidos: stats.clientesSuspendidos || 0,
                    clasificacionA: stats.clasificacionA || 0,
                    clasificacionB: stats.clasificacionB || 0,
                    clasificacionC: stats.clasificacionC || 0,
                    clasificacionD: stats.clasificacionD || 0,
                    alertasActivas: stats.alertasActivas || 0,
                    alertasCriticas: stats.alertasCriticas || 0
                }
            }

        } finally {
            connection.release()
        }

    } catch (error) {
        console.error("Error en obtenerEstadisticasCredito:", error)
        return {
            success: false,
            mensaje: "Error al obtener estadísticas de crédito",
            error: error.message
        }
    }
}

/**
 * 3. Obtener alertas activas del sistema de crédito
 */
export async function obtenerAlertasCredito() {
    try {
        const { empresaId } = await obtenerSesion()
        const connection = await db.getConnection()

        try {
            const query = `
                SELECT 
                    ac.id,
                    ac.tipo_alerta AS tipoAlerta,
                    ac.severidad,
                    ac.titulo,
                    ac.mensaje,
                    ac.estado,
                    ac.fecha_generacion AS fechaGeneracion,
                    
                    c.id AS clienteId,
                    CONCAT(c.nombre, ' ', COALESCE(c.apellidos, '')) AS clienteNombre,
                    c.numero_documento AS clienteDocumento,
                    c.telefono AS clienteTelefono,
                    
                    cc.clasificacion AS clienteClasificacion,
                    cc.estado_credito AS clienteEstadoCredito,
                    
                    cxc.monto_total AS montoRelacionado,
                    cxc.dias_atraso AS diasAtraso
                    
                FROM alertas_credito ac
                INNER JOIN clientes c ON ac.cliente_id = c.id
                LEFT JOIN credito_clientes cc ON ac.credito_cliente_id = cc.id
                LEFT JOIN cuentas_por_cobrar cxc ON ac.cxc_id = cxc.id
                WHERE ac.empresa_id = ?
                    AND ac.estado = 'activa'
                ORDER BY 
                    CASE ac.severidad 
                        WHEN 'critica' THEN 1 
                        WHEN 'alta' THEN 2 
                        WHEN 'media' THEN 3 
                        WHEN 'baja' THEN 4 
                    END,
                    ac.fecha_generacion DESC
                LIMIT 100
            `

            const [alertas] = await connection.query(query, [empresaId])

            return {
                success: true,
                alertas
            }

        } finally {
            connection.release()
        }

    } catch (error) {
        console.error("Error en obtenerAlertasCredito:", error)
        return {
            success: false,
            mensaje: "Error al obtener alertas de crédito",
            error: error.message
        }
    }
}

/**
 * 4. Obtener detalle completo de crédito de un cliente
 */
export async function obtenerDetalleCredito(clienteId) {
    try {
        const { empresaId } = await obtenerSesion()
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
                LEFT JOIN credito_clientes cc ON c.id = cc.cliente_id AND cc.empresa_id = ?
                WHERE c.id = ? AND c.empresa_id = ?
            `, [empresaId, clienteId, empresaId])

            if (cliente.length === 0) {
                return {
                    success: false,
                    mensaje: "Cliente no encontrado"
                }
            }

            // Deudas activas (CxC)
            const [deudas] = await connection.query(`
                SELECT 
                    id,
                    numero_documento AS numeroDocumento,
                    fecha_emision AS fechaEmision,
                    fecha_vencimiento AS fechaVencimiento,
                    monto_total AS montoTotal,
                    monto_pagado AS montoPagado,
                    saldo_pendiente AS saldoPendiente,
                    estado_cxc AS estadoCxc,
                    dias_atraso AS diasAtraso,
                    numero_abonos AS numeroAbonos
                FROM cuentas_por_cobrar
                WHERE cliente_id = ? AND empresa_id = ? AND estado_cxc != 'pagada'
                ORDER BY fecha_vencimiento ASC
            `, [clienteId, empresaId])

            // Historial de eventos
            const [historial] = await connection.query(`
                SELECT 
                    id,
                    tipo_evento AS tipoEvento,
                    descripcion,
                    clasificacion_momento AS clasificacionMomento,
                    score_momento AS scoreMomento,
                    generado_por AS generadoPor,
                    fecha_evento AS fechaEvento
                FROM historial_credito
                WHERE cliente_id = ? AND empresa_id = ?
                ORDER BY fecha_evento DESC
                LIMIT 50
            `, [clienteId, empresaId])

            return {
                success: true,
                cliente: cliente[0],
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
        const { empresaId } = await obtenerSesion()
        const connection = await db.getConnection()

        try {
            const [historial] = await connection.query(`
                SELECT 
                    hc.id,
                    hc.tipo_evento AS tipoEvento,
                    hc.descripcion,
                    hc.datos_anteriores AS datosAnteriores,
                    hc.datos_nuevos AS datosNuevos,
                    hc.clasificacion_momento AS clasificacionMomento,
                    hc.score_momento AS scoreMomento,
                    hc.generado_por AS generadoPor,
                    hc.fecha_evento AS fechaEvento,
                    u.nombre AS usuarioNombre
                FROM historial_credito hc
                LEFT JOIN usuarios u ON hc.usuario_id = u.id
                WHERE hc.cliente_id = ? AND hc.empresa_id = ?
                ORDER BY hc.fecha_evento DESC
            `, [clienteId, empresaId])

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
            success: false,
            mensaje: "Error al obtener historial de crédito",
            error: error.message
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
