"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

function formatearFechaLocal(fecha) {
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export async function obtenerDatosCaja() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [cajas] = await connection.execute(
            `SELECT id,
                    numero_caja,
                    fecha_caja,
                    monto_inicial,
                    monto_final,
                    total_ventas,
                    total_efectivo,
                    total_tarjeta_debito,
                    total_tarjeta_credito,
                    total_transferencia,
                    total_cheque,
                    total_gastos,
                    diferencia,
                    estado,
                    fecha_apertura,
                    fecha_cierre
             FROM cajas
             WHERE empresa_id = ?
               AND usuario_id = ?
               AND estado = 'abierta'
             ORDER BY fecha_apertura DESC LIMIT 1`,
            [empresaId, userId]
        )

        connection.release()

        if (cajas.length > 0) {
            return {
                success: true,
                cajaAbierta: true,
                caja: cajas[0]
            }
        } else {
            return {
                success: true,
                cajaAbierta: false
            }
        }

    } catch (error) {
        console.error('Error al obtener datos de caja:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al verificar estado de caja'
        }
    }
}

export async function abrirCaja(montoInicial) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const fechaHoy = new Date().toISOString().split('T')[0]

        const [cajaExistente] = await connection.execute(
            `SELECT id
             FROM cajas
             WHERE empresa_id = ?
               AND usuario_id = ?
               AND fecha_caja = ?
               AND estado = 'abierta'`,
            [empresaId, userId, fechaHoy]
        )

        if (cajaExistente.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe una caja abierta para hoy'
            }
        }

        const [ultimaCaja] = await connection.execute(
            `SELECT MAX(numero_caja) as ultimo_numero
             FROM cajas
             WHERE empresa_id = ?`,
            [empresaId]
        )

        const numeroCaja = (ultimaCaja[0].ultimo_numero || 0) + 1

        const [resultado] = await connection.execute(
            `INSERT INTO cajas (empresa_id,
                                usuario_id,
                                numero_caja,
                                fecha_caja,
                                monto_inicial,
                                estado)
             VALUES (?, ?, ?, ?, ?, 'abierta')`,
            [empresaId, userId, numeroCaja, fechaHoy, montoInicial]
        )

        const [nuevaCaja] = await connection.execute(
            `SELECT id,
                    numero_caja,
                    fecha_caja,
                    monto_inicial,
                    monto_final,
                    total_ventas,
                    estado,
                    fecha_apertura
             FROM cajas
             WHERE id = ?`,
            [resultado.insertId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Caja abierta exitosamente',
            caja: nuevaCaja[0]
        }

    } catch (error) {
        console.error('Error al abrir caja:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al abrir la caja'
        }
    }
}

export async function cerrarCaja(montoFinal, desglose = null) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        // 1. Obtener caja abierta
        const [caja] = await connection.execute(
            `SELECT id, monto_inicial
             FROM cajas
             WHERE empresa_id = ?
               AND usuario_id = ?
               AND estado = 'abierta' LIMIT 1`,
            [empresaId, userId]
        )

        if (caja.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No hay caja abierta para cerrar'
            }
        }

        const cajaId = caja[0].id

        // 2. Calcular totales reales del sistema
        const [totales] = await connection.execute(
            `SELECT SUM(total)                                                               as total_ventas,
                    SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END)            as total_efectivo,
                    SUM(CASE WHEN metodo_pago = 'tarjeta_debito' THEN total ELSE 0 END)      as total_debito,
                    SUM(CASE WHEN metodo_pago = 'tarjeta_credito' THEN total ELSE 0 END)     as total_credito,
                    SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END)       as total_transferencia,
                    SUM(CASE WHEN metodo_pago = 'cheque' THEN total ELSE 0 END)              as total_cheque
             FROM ventas
             WHERE caja_id = ?
               AND estado = 'emitida'`,
            [cajaId]
        )

        const t = totales[0]
        const totalVentas = parseFloat(t.total_ventas || 0)
        const sistemaEfectivo = parseFloat(t.total_efectivo || 0)

        // Diferencia = (Monto Inicial + Ventas Efectivo) - Monto Final en Caja (Efectivo contado) 
        // Nota: A veces se calcula diferencia sobre el total, pero usualmente cuadre de caja es sobre efectivo.
        // Asumiremos que el montoFinal enviado es el efectivo contado por el usuario.

        const efectivoEsperado = parseFloat(caja[0].monto_inicial) + sistemaEfectivo
        const diferencia = parseFloat(montoFinal) - efectivoEsperado

        // 3. Cerrar caja
        await connection.execute(
            `UPDATE cajas
             SET estado                = 'cerrada',
                 fecha_cierre          = NOW(),
                 monto_final           = ?,
                 total_ventas          = ?,
                 total_efectivo        = ?,
                 total_tarjeta_debito  = ?,
                 total_tarjeta_credito = ?,
                 total_transferencia   = ?,
                 total_cheque          = ?,
                 diferencia            = ?,
                 notas                 = ?
             WHERE id = ?`,
            [
                parseFloat(montoFinal), // Dinero contado (generalmente efectivo)
                totalVentas,
                sistemaEfectivo,
                parseFloat(t.total_debito || 0),
                parseFloat(t.total_credito || 0),
                parseFloat(t.total_transferencia || 0),
                parseFloat(t.total_cheque || 0),
                diferencia,
                desglose ? JSON.stringify(desglose) : null,
                cajaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Caja cerrada exitosamente',
            resumen: {
                esperado: efectivoEsperado,
                contado: montoFinal,
                diferencia: diferencia
            }
        }

    } catch (error) {
        console.error('Error al cerrar caja:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al cerrar la caja'
        }
    }
}

export async function obtenerCajaAbierta(connection, empresaId, userId) {
    const [rows] = await connection.execute(
        `SELECT id
         FROM cajas
         WHERE empresa_id = ?
           AND usuario_id = ?
           AND estado = 'abierta' ORDER BY fecha_apertura DESC LIMIT 1`,
        [empresaId, userId]
    )

    return rows.length ? rows[0].id : null
}

/**
 * 🎯 FUNCIÓN MEJORADA: obtenerVentas
 *
 * ✅ Devuelve TODAS las ventas de la empresa por defecto
 * ✅ Permite filtrar por caja abierta (opcional)
 * ✅ Filtros por período: hoy, semana, mes
 * ✅ Paginación completa
 * ✅ Filtros adicionales: vendedor, cliente, tipo, estado, monto
 */
export async function obtenerVentas({
    pagina = 1,
    limite = 20,
    // Filtros de período
    periodo = null, // 'hoy', 'semana', 'mes', null (para rango personalizado)
    fechaInicio = null,
    fechaFin = null,
    // Filtro de caja
    soloCajaAbierta = false, // 👈 NUEVO: opcional, no forzado
    cajaId = null, // 👈 NUEVO: filtrar por caja específica
    // Filtros adicionales
    vendedorId = null,
    clienteId = null,
    // tipo = null, // ELIMINADO: No existe en nueva estructura
    estado = null, // 'emitida', 'anulada', 'pendiente'
    metodo = null, // 'efectivo', 'tarjeta_debito', etc.
    minTotal = null,
    maxTotal = null,
    busqueda = null // Búsqueda por número interno, cliente, vendedor
} = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        // Validar y normalizar parámetros de paginación
        const paginaNum = Math.max(1, parseInt(pagina) || 1)
        const limiteNum = Math.max(1, Math.min(100, parseInt(limite) || 20))
        const offset = (paginaNum - 1) * limiteNum

        connection = await db.getConnection()

        // 🔹 Construir fechas según el período seleccionado
        let fechaInicioFinal = fechaInicio
        let fechaFinFinal = fechaFin
        const periodoNormalizado = typeof periodo === 'string'
            ? periodo.trim().toLowerCase()
            : null

        if (periodoNormalizado) {
            const ahora = new Date()

            switch (periodoNormalizado) {
                case 'hoy':
                    fechaInicioFinal = formatearFechaLocal(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()))
                    fechaFinFinal = fechaInicioFinal
                    break

                case 'semana':
                    // Inicio de la semana (domingo)
                    const inicioSemana = new Date(ahora)
                    inicioSemana.setDate(ahora.getDate() - ahora.getDay())
                    fechaInicioFinal = formatearFechaLocal(inicioSemana)

                    // Fin de la semana (sábado)
                    const finSemana = new Date(inicioSemana)
                    finSemana.setDate(inicioSemana.getDate() + 6)
                    fechaFinFinal = formatearFechaLocal(finSemana)
                    break

                case 'mes':
                    // Primer día del mes
                    fechaInicioFinal = formatearFechaLocal(new Date(ahora.getFullYear(), ahora.getMonth(), 1))

                    // Último día del mes
                    fechaFinFinal = formatearFechaLocal(new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0))
                    break
            }
        }

        // 🔹 Construir condiciones WHERE dinámicamente
        const condiciones = ['v.empresa_id = ?']
        const parametros = [empresaId]

        // 🔹 NUEVO: Solo filtrar por caja si se solicita explícitamente
        if (soloCajaAbierta) {
            const cajaAbiertaId = await obtenerCajaAbierta(connection, empresaId, userId)
            if (cajaAbiertaId) {
                condiciones.push('v.caja_id = ?')
                parametros.push(cajaAbiertaId)
            }
        } else if (cajaId) {
            // Filtrar por una caja específica
            condiciones.push('v.caja_id = ?')
            parametros.push(cajaId)
        }

        // Filtro por fechas
        if (fechaInicioFinal) {
            condiciones.push('DATE(v.fecha_venta) >= ?')
            parametros.push(fechaInicioFinal)
        }

        if (fechaFinFinal) {
            condiciones.push('DATE(v.fecha_venta) <= ?')
            parametros.push(fechaFinFinal)
        }

        // Filtro por vendedor
        if (vendedorId) {
            condiciones.push('v.usuario_id = ?')
            parametros.push(vendedorId)
        }

        // Filtro por cliente
        if (clienteId) {
            condiciones.push('v.cliente_id = ?')
            parametros.push(clienteId)
        }

        /*
        // Filtro por tipo (contado/crédito) - ELIMINADO
        if (tipo) {
            condiciones.push('v.tipo_venta = ?')
            parametros.push(tipo)
        }
        */

        // Filtro por estado
        if (estado) {
            condiciones.push('v.estado = ?')
            parametros.push(estado)
        }

        // Filtro por método de pago
        if (metodo) {
            condiciones.push('v.metodo_pago = ?')
            parametros.push(metodo)
        }

        // Filtro por monto mínimo
        if (minTotal !== null && minTotal !== undefined) {
            condiciones.push('v.total >= ?')
            parametros.push(parseFloat(minTotal))
        }

        // Filtro por monto máximo
        if (maxTotal !== null && maxTotal !== undefined) {
            condiciones.push('v.total <= ?')
            parametros.push(parseFloat(maxTotal))
        }

        // Búsqueda general
        if (busqueda && busqueda.trim()) {
            condiciones.push(
                '(v.numero_interno LIKE ? OR c.nombre LIKE ? OR u.nombre LIKE ? OR v.ncf LIKE ?)'
            )
            const terminoBusqueda = `%${busqueda.trim()}%`
            parametros.push(terminoBusqueda, terminoBusqueda, terminoBusqueda, terminoBusqueda)
        }

        const whereClause = `WHERE ${condiciones.join(' AND ')}`

        // 🔹 Obtener total de ventas para paginación
        const [totalResult] = await connection.execute(
            `SELECT COUNT(*) as total
             FROM ventas v
                      LEFT JOIN clientes c ON v.cliente_id = c.id
                      LEFT JOIN usuarios u ON v.usuario_id = u.id
                      LEFT JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
                 ${whereClause}`,
            parametros
        )

        const totalVentas = totalResult[0].total
        const totalPaginas = Math.ceil(totalVentas / limiteNum)

        // 🔹 Obtener ventas paginadas
        const [ventas] = await connection.execute(
            `SELECT v.id,
                    v.ncf,
                    v.numero_interno,
                    v.subtotal,
                    v.descuento,
                    v.monto_gravado,
                    v.itbis,
                    v.total,
                    v.metodo_pago,
                    v.efectivo_recibido,
                    v.cambio,
                    v.estado,
                    v.tipo_entrega,
                    v.despacho_completo,
                    v.razon_anulacion,
                    v.fecha_venta,
                    v.caja_id,
                    v.tipo_ingreso,
                    v.estado_dgii,
                    v.fecha_envio_dgii,
                    c.nombre           as cliente_nombre,
                    c.numero_documento as cliente_documento,
                    u.nombre           as vendedor_nombre,
                    tc.nombre          as tipo_comprobante,
                    cj.numero_caja
             FROM ventas v
                      LEFT JOIN clientes c ON v.cliente_id = c.id
                      LEFT JOIN usuarios u ON v.usuario_id = u.id
                      LEFT JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
                      LEFT JOIN cajas cj ON v.caja_id = cj.id
                 ${whereClause}
             ORDER BY v.fecha_venta DESC
                 LIMIT ?
             OFFSET ?`,
            [...parametros, limiteNum, offset]
        )

        // 🔹 Calcular totales para resumen
        const [totalesResult] = await connection.execute(
            `SELECT SUM(CASE WHEN v.estado = 'emitida' THEN v.total ELSE 0 END)                                        as total_ventas,
                    COUNT(CASE WHEN v.estado = 'emitida' THEN 1 END)                                                    as cantidad_emitidas,
                    COUNT(CASE WHEN v.estado = 'anulada' THEN 1 END)                                                    as cantidad_anuladas,
                    COUNT(CASE WHEN v.estado = 'pendiente' THEN 1 END)                                                  as cantidad_pendientes,
                    SUM(CASE WHEN v.metodo_pago = 'efectivo' AND v.estado = 'emitida' THEN v.total ELSE 0 END)          as total_efectivo,
                    SUM(CASE WHEN v.metodo_pago = 'credito'  AND v.estado = 'emitida' THEN v.total ELSE 0 END)          as total_credito,
                    COUNT(CASE WHEN v.metodo_pago = 'efectivo' AND v.estado = 'emitida' THEN 1 END)                     as cantidad_efectivo,
                    COUNT(CASE WHEN v.metodo_pago = 'credito'  AND v.estado = 'emitida' THEN 1 END)                     as cantidad_credito
             FROM ventas v
                      LEFT JOIN clientes c ON v.cliente_id = c.id
                      LEFT JOIN usuarios u ON v.usuario_id = u.id
                 ${whereClause}`,
            parametros
        )

        connection.release()

        return {
            success: true,
            ventas: ventas,
            paginacion: {
                pagina: paginaNum,
                limite: limiteNum,
                total: totalVentas,
                totalPaginas: totalPaginas
            },
            resumen: {
                totalVentas:       parseFloat(totalesResult[0].total_ventas        || 0),
                cantidadEmitidas:  parseInt(totalesResult[0].cantidad_emitidas     || 0),
                cantidadAnuladas:  parseInt(totalesResult[0].cantidad_anuladas     || 0),
                cantidadPendientes:parseInt(totalesResult[0].cantidad_pendientes   || 0),
                totalEfectivo:     parseFloat(totalesResult[0].total_efectivo      || 0),
                totalCredito:      parseFloat(totalesResult[0].total_credito       || 0),
                cantidadEfectivo:  parseInt(totalesResult[0].cantidad_efectivo     || 0),
                cantidadCredito:   parseInt(totalesResult[0].cantidad_credito      || 0),
            }
        }

    } catch (error) {
        console.error('Error al obtener ventas:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar ventas'
        }
    }
}

export async function anularVenta(ventaId, razonAnulacion) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const [venta] = await connection.execute(
            `SELECT id, estado, empresa_id, caja_id, total, metodo_pago
             FROM ventas
             WHERE id = ?
               AND empresa_id = ?`,
            [ventaId, empresaId]
        )

        if (venta.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Venta no encontrada'
            }
        }

        if (venta[0].estado === 'anulada') {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Esta venta ya esta anulada'
            }
        }

        const ventaData = venta[0]

        // Revertir stock
        const [detalles] = await connection.execute(
            `SELECT producto_id, cantidad
             FROM detalle_ventas
             WHERE venta_id = ?`,
            [ventaId]
        )

        for (const detalle of detalles) {
            await connection.execute(
                `UPDATE productos
                 SET stock = stock + ?
                 WHERE id = ?
                   AND empresa_id = ?`,
                [detalle.cantidad, detalle.producto_id, empresaId]
            )

            const [producto] = await connection.execute(
                `SELECT stock
                 FROM productos
                 WHERE id = ?`,
                [detalle.producto_id]
            )

            await connection.execute(
                `INSERT INTO movimientos_inventario (empresa_id,
                                                     producto_id,
                                                     tipo,
                                                     cantidad,
                                                     stock_anterior,
                                                     stock_nuevo,
                                                     referencia,
                                                     usuario_id,
                                                     notas)
                 VALUES (?, ?, 'devolucion', ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    detalle.producto_id,
                    detalle.cantidad,
                    producto[0].stock - detalle.cantidad,
                    producto[0].stock,
                    `Venta anulada #${ventaId}`,
                    userId,
                    razonAnulacion
                ]
            )
        }

        // ACTUALIZAR CAJA: Revertir montos
        if (ventaData.caja_id) {
            await connection.execute(
                `UPDATE cajas
                 SET total_ventas          = total_ventas - ?,
                     total_efectivo        = total_efectivo - IF(? = 'efectivo', ?, 0),
                     total_tarjeta_debito  = total_tarjeta_debito - IF(? = 'tarjeta_debito', ?, 0),
                     total_tarjeta_credito = total_tarjeta_credito - IF(? = 'tarjeta_credito', ?, 0),
                     total_transferencia   = total_transferencia - IF(? = 'transferencia', ?, 0),
                     total_cheque          = total_cheque - IF(? = 'cheque', ?, 0)
                 WHERE id = ?`,
                [
                    ventaData.total,
                    ventaData.metodo_pago, ventaData.total,
                    ventaData.metodo_pago, ventaData.total,
                    ventaData.metodo_pago, ventaData.total,
                    ventaData.metodo_pago, ventaData.total,
                    ventaData.metodo_pago, ventaData.total,
                    ventaData.caja_id
                ]
            )
        }

        await connection.execute(
            `UPDATE ventas
             SET estado = 'anulada',
                 razon_anulacion = ?
             WHERE id = ?
               AND empresa_id = ?`,
            [razonAnulacion, ventaId, empresaId]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Venta anulada exitosamente'
        }

    } catch (error) {
        console.error('Error al anular venta:', error)

        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al anular la venta'
        }
    }
}

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || !userId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()
        const [empresa] = await connection.execute(
            `SELECT moneda, simbolo_moneda, impuesto_nombre, impuesto_porcentaje, locale
             FROM empresas WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )
        connection.release()

        if (!empresa.length) return { success: false, mensaje: 'Empresa no encontrada' }
        return { success: true, empresa: empresa[0] }
    } catch (error) {
        console.error('Error al obtener empresa:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al obtener empresa' }
    }
}