"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function obtenerContextoSesion() {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const empresaId = cookieStore.get('empresaId')?.value

    if (!userId || !empresaId) return null

    return {
        userId: Number(userId),
        empresaId: Number(empresaId)
    }
}

async function obtenerSucursalesAsignadas(connection, empresaId, userId) {
    try {
        const [asignaciones] = await connection.execute(
            `SELECT DISTINCT sucursal_id
             FROM usuarios_sucursales
             WHERE usuario_id = ? AND empresa_id = ? AND activo = TRUE`,
            [userId, empresaId]
        )

        return asignaciones.map((item) => Number(item.sucursal_id))
    } catch (error) {
        console.warn('Tabla usuarios_sucursales no encontrada en transferencias')
        return []
    }
}

async function obtenerSucursalesDisponibles(connection, contexto) {
    const sucursalesAsignadas = await obtenerSucursalesAsignadas(connection, contexto.empresaId, contexto.userId)

    let query = `
        SELECT id, nombre
        FROM sucursales
        WHERE empresa_id = ? AND activa = TRUE
    `
    const params = [contexto.empresaId]

    if (sucursalesAsignadas.length > 0) {
        const placeholders = sucursalesAsignadas.map(() => '?').join(',')
        query += ` AND id IN (${placeholders})`
        params.push(...sucursalesAsignadas)
    }

    query += ' ORDER BY nombre ASC'
    const [rows] = await connection.execute(query, params)
    return rows
}

function formatearNumeroTransferencia(correlativo) {
    const ahora = new Date()
    const y = ahora.getFullYear()
    const m = String(ahora.getMonth() + 1).padStart(2, '0')
    const d = String(ahora.getDate()).padStart(2, '0')
    return `TRF-${y}${m}${d}-${String(correlativo).padStart(4, '0')}`
}

async function generarNumeroTransferencia(connection, empresaId) {
    const hoy = new Date()
    const yyyy = hoy.getFullYear()
    const mm = String(hoy.getMonth() + 1).padStart(2, '0')
    const dd = String(hoy.getDate()).padStart(2, '0')
    const prefijo = `TRF-${yyyy}${mm}${dd}-`

    const [rows] = await connection.execute(
        `SELECT numero_transferencia
         FROM transferencias_stock
         WHERE empresa_id = ? AND numero_transferencia LIKE ?
         ORDER BY id DESC
         LIMIT 1`,
        [empresaId, `${prefijo}%`]
    )

    if (!rows.length) return `${prefijo}0001`

    const ultimo = String(rows[0].numero_transferencia || '')
    const correlativo = Number(ultimo.split('-').pop() || 0) + 1
    return formatearNumeroTransferencia(correlativo)
}

async function sincronizarStockDesdeProductos(connection, empresaId, sucursalesObjetivo = []) {
    let query = `
        INSERT IGNORE INTO stock_sucursal (
            empresa_id,
            sucursal_id,
            producto_id,
            stock_actual,
            stock_minimo,
            stock_maximo,
            ubicacion,
            costo_promedio
        )
        SELECT
            p.empresa_id,
            s.id AS sucursal_id,
            p.id AS producto_id,
            COALESCE(p.stock, 0) AS stock_actual,
            COALESCE(p.stock_minimo, 0) AS stock_minimo,
            COALESCE(p.stock_maximo, 1000) AS stock_maximo,
            'General' AS ubicacion,
            COALESCE(p.precio_compra, p.precio_venta, 0) AS costo_promedio
        FROM productos p
        INNER JOIN sucursales s ON s.empresa_id = p.empresa_id AND s.activa = TRUE
        WHERE p.empresa_id = ? AND p.activo = TRUE
    `
    const params = [empresaId]

    if (sucursalesObjetivo.length > 0) {
        const placeholders = sucursalesObjetivo.map(() => '?').join(',')
        query += ` AND s.id IN (${placeholders})`
        params.push(...sucursalesObjetivo)
    }

    await connection.execute(query, params)
}

export async function obtenerTransferencias(filtros = {}) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const sucursalesAsignadas = await obtenerSucursalesAsignadas(connection, contexto.empresaId, contexto.userId)

        let query = `
            SELECT t.id,
                   t.numero_transferencia,
                   t.sucursal_origen_id,
                   t.sucursal_destino_id,
                   t.fecha_solicitud,
                   t.estado,
                   t.prioridad,
                   t.observacion_origen,
                   so.nombre AS sucursal_origen,
                   sd.nombre AS sucursal_destino,
                   COUNT(td.id) as items
            FROM transferencias_stock t
            LEFT JOIN sucursales so ON t.sucursal_origen_id = so.id
            LEFT JOIN sucursales sd ON t.sucursal_destino_id = sd.id
            LEFT JOIN transferencias_stock_detalle td ON t.id = td.transferencia_id
            WHERE t.empresa_id = ?
        `
        const params = [contexto.empresaId]

        if (sucursalesAsignadas.length > 0) {
            const placeholders = sucursalesAsignadas.map(() => '?').join(',')
            query += ` AND (t.sucursal_origen_id IN (${placeholders}) OR t.sucursal_destino_id IN (${placeholders}))`
            params.push(...sucursalesAsignadas, ...sucursalesAsignadas)
        }

        if (filtros.buscar) {
            query += " AND (t.numero_transferencia LIKE ? OR so.nombre LIKE ? OR sd.nombre LIKE ?)"
            const like = `%${filtros.buscar}%`
            params.push(like, like, like)
        }

        if (filtros.estado) {
            query += " AND t.estado = ?"
            params.push(filtros.estado)
        }

        query += " GROUP BY t.id ORDER BY t.fecha_solicitud DESC"
        const [rows] = await connection.execute(query, params)
        connection.release()

        return { success: true, transferencias: rows }
    } catch (error) {
        console.error('Error al listar transferencias:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar transferencias' }
    }
}

export async function obtenerOpcionesTransferencia() {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const sucursales = await obtenerSucursalesDisponibles(connection, contexto)
        connection.release()

        return { success: true, sucursales }
    } catch (error) {
        console.error('Error en obtenerOpcionesTransferencia:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudieron cargar las sucursales' }
    }
}

export async function obtenerProductosPorSucursal(sucursalId) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const sucursalIdNum = Number(sucursalId)
        if (!sucursalIdNum) return { success: true, productos: [] }

        connection = await db.getConnection()
        const sucursales = await obtenerSucursalesDisponibles(connection, contexto)
        const permitido = sucursales.some((s) => Number(s.id) === sucursalIdNum)
        if (!permitido) {
            connection.release()
            return { success: false, mensaje: 'No tienes acceso a esa sucursal' }
        }

        await sincronizarStockDesdeProductos(connection, contexto.empresaId, [sucursalIdNum])

        const [productos] = await connection.execute(
            `SELECT
                p.id,
                p.nombre,
                COALESCE(p.codigo_barras, p.sku, CONCAT('PROD-', p.id)) AS codigo,
                COALESCE(ss.stock_actual, 0) AS stock_disponible,
                COALESCE(ss.costo_promedio, p.precio_compra, 0) AS costo_unitario
             FROM stock_sucursal ss
             INNER JOIN productos p ON p.id = ss.producto_id
             WHERE ss.empresa_id = ? AND ss.sucursal_id = ? AND p.activo = TRUE
             ORDER BY p.nombre ASC`,
            [contexto.empresaId, sucursalIdNum]
        )

        connection.release()
        return { success: true, productos }
    } catch (error) {
        console.error('Error en obtenerProductosPorSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar productos por sucursal' }
    }
}

export async function crearTransferencia(payload = {}) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const sucursalOrigenId = Number(payload.sucursal_origen_id)
        const sucursalDestinoId = Number(payload.sucursal_destino_id)
        const tipoOperacion = String(payload.tipo_operacion || 'mover').toLowerCase() === 'compartir' ? 'compartir' : 'mover'
        const prioridad = String(payload.prioridad || 'normal')
        const observacionOrigen = String(payload.observacion_origen || '').trim() || null
        const detalle = Array.isArray(payload.detalle) ? payload.detalle : []

        if (!sucursalOrigenId || !sucursalDestinoId) {
            return { success: false, mensaje: 'Debes seleccionar sucursal origen y destino' }
        }

        if (sucursalOrigenId === sucursalDestinoId) {
            return { success: false, mensaje: 'Origen y destino deben ser distintos' }
        }

        const detalleLimpio = detalle
            .map((item) => ({
                producto_id: Number(item.producto_id),
                cantidad: Number(item.cantidad || 0)
            }))
            .filter((item) => item.producto_id > 0 && item.cantidad > 0)

        if (detalleLimpio.length === 0) {
            return { success: false, mensaje: 'Agrega al menos un producto con cantidad valida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const sucursales = await obtenerSucursalesDisponibles(connection, contexto)
        const idsDisponibles = new Set(sucursales.map((s) => Number(s.id)))
        if (!idsDisponibles.has(sucursalOrigenId) || !idsDisponibles.has(sucursalDestinoId)) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'No tienes acceso a una de las sucursales seleccionadas' }
        }

        await sincronizarStockDesdeProductos(connection, contexto.empresaId, [sucursalOrigenId, sucursalDestinoId])

        const numeroTransferencia = await generarNumeroTransferencia(connection, contexto.empresaId)

        const [result] = await connection.execute(
            `INSERT INTO transferencias_stock (
                empresa_id,
                numero_transferencia,
                sucursal_origen_id,
                sucursal_destino_id,
                fecha_salida,
                fecha_recepcion,
                estado,
                prioridad,
                observacion_origen,
                creado_por
            ) VALUES (?, ?, ?, ?, NOW(), NOW(), 'recibida', ?, ?, ?)`,
            [
                contexto.empresaId,
                numeroTransferencia,
                sucursalOrigenId,
                sucursalDestinoId,
                prioridad,
                observacionOrigen
                    ? `[${tipoOperacion.toUpperCase()}] ${observacionOrigen}`
                    : `[${tipoOperacion.toUpperCase()}]`,
                contexto.userId
            ]
        )

        const transferenciaId = result.insertId

        for (const item of detalleLimpio) {
            const [stockRows] = await connection.execute(
                `SELECT id,
                        COALESCE(stock_actual, 0) AS stock_actual,
                        COALESCE(stock_minimo, 0) AS stock_minimo,
                        COALESCE(stock_maximo, 1000) AS stock_maximo,
                        COALESCE(costo_promedio, 0) AS costo_promedio
                 FROM stock_sucursal
                 WHERE empresa_id = ? AND sucursal_id = ? AND producto_id = ?
                 LIMIT 1
                 FOR UPDATE`,
                [contexto.empresaId, sucursalOrigenId, item.producto_id]
            )

            if (!stockRows.length) {
                await connection.rollback()
                connection.release()
                return { success: false, mensaje: 'Uno de los productos no existe en la sucursal origen' }
            }

            const stockOrigenActual = Number(stockRows[0].stock_actual || 0)
            const stockMinimoOrigen = Number(stockRows[0].stock_minimo || 0)
            const stockMaximoOrigen = Number(stockRows[0].stock_maximo || 1000)
            const costoUnitario = Number(stockRows[0]?.costo_promedio || 0)

            if (tipoOperacion === 'mover' && stockOrigenActual < item.cantidad) {
                await connection.rollback()
                connection.release()
                return { success: false, mensaje: `Stock insuficiente en origen para producto ${item.producto_id}` }
            }

            await connection.execute(
                `INSERT INTO transferencias_stock_detalle (
                    transferencia_id,
                    producto_id,
                    cantidad_solicitada,
                    cantidad_enviada,
                    cantidad_recibida,
                    costo_unitario
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [transferenciaId, item.producto_id, item.cantidad, item.cantidad, item.cantidad, costoUnitario]
            )

            if (tipoOperacion === 'mover') {
                const stockOrigenNuevo = stockOrigenActual - item.cantidad

                await connection.execute(
                    `UPDATE stock_sucursal
                     SET stock_actual = ?, fecha_actualizacion = CURRENT_TIMESTAMP
                     WHERE empresa_id = ? AND sucursal_id = ? AND producto_id = ?`,
                    [stockOrigenNuevo, contexto.empresaId, sucursalOrigenId, item.producto_id]
                )

                await connection.execute(
                    `INSERT INTO movimientos_stock_sucursal (
                        empresa_id,
                        sucursal_id,
                        producto_id,
                        transferencia_id,
                        tipo_movimiento,
                        origen,
                        cantidad,
                        stock_anterior,
                        stock_nuevo,
                        costo_unitario,
                        referencia,
                        observaciones,
                        creado_por
                    ) VALUES (?, ?, ?, ?, 'salida', 'transferencia', ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        contexto.empresaId,
                        sucursalOrigenId,
                        item.producto_id,
                        transferenciaId,
                        item.cantidad,
                        stockOrigenActual,
                        stockOrigenNuevo,
                        costoUnitario,
                        numeroTransferencia,
                        'Salida por transferencia (mover)',
                        contexto.userId
                    ]
                )
            }

            const [stockDestinoRows] = await connection.execute(
                `SELECT COALESCE(stock_actual, 0) AS stock_actual
                 FROM stock_sucursal
                 WHERE empresa_id = ? AND sucursal_id = ? AND producto_id = ?
                 LIMIT 1
                 FOR UPDATE`,
                [contexto.empresaId, sucursalDestinoId, item.producto_id]
            )

            const stockDestinoActual = Number(stockDestinoRows[0]?.stock_actual || 0)
            const stockDestinoNuevo = stockDestinoActual + item.cantidad

            await connection.execute(
                `INSERT INTO stock_sucursal (
                    empresa_id,
                    sucursal_id,
                    producto_id,
                    stock_actual,
                    stock_minimo,
                    stock_maximo,
                    ubicacion,
                    costo_promedio
                ) VALUES (?, ?, ?, ?, ?, ?, 'General', ?)
                ON DUPLICATE KEY UPDATE
                    stock_actual = VALUES(stock_actual),
                    costo_promedio = VALUES(costo_promedio),
                    fecha_actualizacion = CURRENT_TIMESTAMP`,
                [
                    contexto.empresaId,
                    sucursalDestinoId,
                    item.producto_id,
                    stockDestinoNuevo,
                    stockMinimoOrigen,
                    stockMaximoOrigen,
                    costoUnitario
                ]
            )

            await connection.execute(
                `INSERT INTO movimientos_stock_sucursal (
                    empresa_id,
                    sucursal_id,
                    producto_id,
                    transferencia_id,
                    tipo_movimiento,
                    origen,
                    cantidad,
                    stock_anterior,
                    stock_nuevo,
                    costo_unitario,
                    referencia,
                    observaciones,
                    creado_por
                ) VALUES (?, ?, ?, ?, 'entrada', 'transferencia', ?, ?, ?, ?, ?, ?, ?)`,
                [
                    contexto.empresaId,
                    sucursalDestinoId,
                    item.producto_id,
                    transferenciaId,
                    item.cantidad,
                    stockDestinoActual,
                    stockDestinoNuevo,
                    costoUnitario,
                    numeroTransferencia,
                    tipoOperacion === 'compartir'
                        ? 'Entrada por compartir desde otra sucursal'
                        : 'Entrada por transferencia (mover)',
                    contexto.userId
                ]
            )
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Transferencia creada correctamente',
            id: transferenciaId
        }
    } catch (error) {
        console.error('Error en crearTransferencia:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback crearTransferencia:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'No se pudo crear la transferencia' }
    }
}

export async function obtenerTransferenciaPorId(id) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const transferenciaId = Number(id)
        if (!transferenciaId) return { success: false, mensaje: 'Transferencia invalida' }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT
                t.id,
                t.numero_transferencia,
                t.sucursal_origen_id,
                t.sucursal_destino_id,
                t.estado,
                t.prioridad,
                t.observacion_origen,
                t.observacion_destino,
                t.fecha_solicitud,
                so.nombre AS sucursal_origen,
                sd.nombre AS sucursal_destino
             FROM transferencias_stock t
             LEFT JOIN sucursales so ON so.id = t.sucursal_origen_id
             LEFT JOIN sucursales sd ON sd.id = t.sucursal_destino_id
             WHERE t.id = ? AND t.empresa_id = ?
             LIMIT 1`,
            [transferenciaId, contexto.empresaId]
        )

        if (!rows.length) {
            connection.release()
            return { success: false, mensaje: 'Transferencia no encontrada' }
        }

        const transferencia = rows[0]

        const sucursales = await obtenerSucursalesDisponibles(connection, contexto)
        const idsDisponibles = new Set(sucursales.map((s) => Number(s.id)))
        const puedeVer = idsDisponibles.size === 0 || idsDisponibles.has(Number(transferencia.sucursal_origen_id)) || idsDisponibles.has(Number(transferencia.sucursal_destino_id))
        if (!puedeVer) {
            connection.release()
            return { success: false, mensaje: 'No tienes acceso a esta transferencia' }
        }

        const [detalle] = await connection.execute(
            `SELECT
                td.id,
                td.producto_id,
                td.cantidad_solicitada,
                td.cantidad_enviada,
                td.cantidad_recibida,
                td.costo_unitario,
                p.nombre AS producto_nombre,
                COALESCE(p.codigo_barras, p.sku, CONCAT('PROD-', p.id)) AS producto_codigo
             FROM transferencias_stock_detalle td
             INNER JOIN productos p ON p.id = td.producto_id
             WHERE td.transferencia_id = ?
             ORDER BY p.nombre ASC`,
            [transferenciaId]
        )

        connection.release()
        return { success: true, transferencia, detalle }
    } catch (error) {
        console.error('Error en obtenerTransferenciaPorId:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo cargar la transferencia' }
    }
}

export async function actualizarTransferencia(id, payload = {}) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const transferenciaId = Number(id)
        const sucursalOrigenId = Number(payload.sucursal_origen_id)
        const sucursalDestinoId = Number(payload.sucursal_destino_id)
        const prioridad = String(payload.prioridad || 'normal')
        const observacionOrigen = String(payload.observacion_origen || '').trim() || null
        const detalle = Array.isArray(payload.detalle) ? payload.detalle : []

        if (!transferenciaId || !sucursalOrigenId || !sucursalDestinoId) {
            return { success: false, mensaje: 'Datos invalidos para actualizar' }
        }

        if (sucursalOrigenId === sucursalDestinoId) {
            return { success: false, mensaje: 'Origen y destino deben ser distintos' }
        }

        const detalleLimpio = detalle
            .map((item) => ({
                producto_id: Number(item.producto_id),
                cantidad: Number(item.cantidad || 0)
            }))
            .filter((item) => item.producto_id > 0 && item.cantidad > 0)

        if (detalleLimpio.length === 0) {
            return { success: false, mensaje: 'Agrega al menos un producto con cantidad valida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const sucursales = await obtenerSucursalesDisponibles(connection, contexto)
        const idsDisponibles = new Set(sucursales.map((s) => Number(s.id)))
        if (!idsDisponibles.has(sucursalOrigenId) || !idsDisponibles.has(sucursalDestinoId)) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'No tienes acceso a una de las sucursales seleccionadas' }
        }

        const [actualRows] = await connection.execute(
            `SELECT id, estado
             FROM transferencias_stock
             WHERE id = ? AND empresa_id = ?
             LIMIT 1`,
            [transferenciaId, contexto.empresaId]
        )

        if (!actualRows.length) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'Transferencia no encontrada' }
        }

        if (actualRows[0].estado !== 'pendiente') {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'Solo se pueden editar transferencias pendientes' }
        }

        await connection.execute(
            `UPDATE transferencias_stock
             SET sucursal_origen_id = ?,
                 sucursal_destino_id = ?,
                 prioridad = ?,
                 observacion_origen = ?,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = ? AND empresa_id = ?`,
            [
                sucursalOrigenId,
                sucursalDestinoId,
                prioridad,
                observacionOrigen,
                transferenciaId,
                contexto.empresaId
            ]
        )

        await connection.execute(
            `DELETE FROM transferencias_stock_detalle WHERE transferencia_id = ?`,
            [transferenciaId]
        )

        for (const item of detalleLimpio) {
            const [stockRows] = await connection.execute(
                `SELECT COALESCE(costo_promedio, 0) AS costo_promedio
                 FROM stock_sucursal
                 WHERE empresa_id = ? AND sucursal_id = ? AND producto_id = ?
                 LIMIT 1`,
                [contexto.empresaId, sucursalOrigenId, item.producto_id]
            )

            const costoUnitario = Number(stockRows[0]?.costo_promedio || 0)

            await connection.execute(
                `INSERT INTO transferencias_stock_detalle (
                    transferencia_id,
                    producto_id,
                    cantidad_solicitada,
                    cantidad_enviada,
                    cantidad_recibida,
                    costo_unitario
                ) VALUES (?, ?, ?, 0, 0, ?)`,
                [transferenciaId, item.producto_id, item.cantidad, costoUnitario]
            )
        }

        await connection.commit()
        connection.release()
        return { success: true, mensaje: 'Transferencia actualizada correctamente' }
    } catch (error) {
        console.error('Error en actualizarTransferencia:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback actualizarTransferencia:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'No se pudo actualizar la transferencia' }
    }
}
