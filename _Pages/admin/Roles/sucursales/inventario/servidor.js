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
        console.warn('Tabla usuarios_sucursales no encontrada en inventario')
        return []
    }
}

async function validarAccesoSucursal(connection, empresaId, userId, sucursalId) {
    const [rows] = await connection.execute(
        `SELECT 1
         FROM usuarios_sucursales
         WHERE empresa_id = ? AND usuario_id = ? AND sucursal_id = ? AND activo = TRUE
         LIMIT 1`,
        [empresaId, userId, sucursalId]
    )

    return rows.length > 0
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
        WHERE p.empresa_id = ?
    `
    const params = [empresaId]

    if (sucursalesObjetivo.length > 0) {
        const placeholders = sucursalesObjetivo.map(() => '?').join(',')
        query += ` AND s.id IN (${placeholders})`
        params.push(...sucursalesObjetivo)
    }

    await connection.execute(query, params)
}

export async function obtenerInventarioSucursales(filtros = {}) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()
        const sucursalesAsignadas = await obtenerSucursalesAsignadas(connection, contexto.empresaId, contexto.userId)

        if (filtros.sucursalId && sucursalesAsignadas.length > 0) {
            const sucursalFiltro = Number(filtros.sucursalId)
            if (!sucursalesAsignadas.includes(sucursalFiltro)) {
                connection.release()
                return { success: false, mensaje: 'No tienes acceso a esa sucursal' }
            }
        }

        const sucursalesObjetivo = filtros.sucursalId
            ? [Number(filtros.sucursalId)]
            : (sucursalesAsignadas.length > 0 ? sucursalesAsignadas : [])

        await sincronizarStockDesdeProductos(connection, contexto.empresaId, sucursalesObjetivo)

        let query = `
            SELECT
                ss.id,
                ss.empresa_id,
                ss.sucursal_id,
                ss.producto_id,
                ss.stock_actual AS stock,
                ss.stock_minimo,
                ss.stock_maximo,
                ss.ubicacion,
                ss.costo_promedio,
                ss.fecha_actualizacion,
                e.nombre_empresa AS empresa_nombre,
                CONCAT(e.nombre_empresa, ' / ', s.nombre) AS sucursal_nombre,
                p.nombre,
                COALESCE(p.codigo_barras, p.sku, CONCAT('PROD-', p.id)) AS codigo,
                COALESCE(um.abreviatura, 'UN') AS unidad_medida
            FROM stock_sucursal ss
            INNER JOIN sucursales s ON s.id = ss.sucursal_id
            INNER JOIN empresas e ON e.id = ss.empresa_id
            INNER JOIN productos p ON p.id = ss.producto_id
            LEFT JOIN unidades_medida um ON um.id = p.unidad_medida_id
            WHERE ss.empresa_id = ?
        `
        const params = [contexto.empresaId]

        if (sucursalesAsignadas.length > 0) {
            const placeholders = sucursalesAsignadas.map(() => '?').join(',')
            query += ` AND ss.sucursal_id IN (${placeholders})`
            params.push(...sucursalesAsignadas)
        }

        if (filtros.buscar) {
            query += ` AND (
                p.nombre LIKE ?
                OR COALESCE(p.codigo_barras, p.sku, CONCAT('PROD-', p.id)) LIKE ?
                OR s.nombre LIKE ?
            )`
            const like = `%${filtros.buscar}%`
            params.push(like, like, like)
        }

        if (filtros.sucursalId) {
            query += ' AND ss.sucursal_id = ?'
            params.push(Number(filtros.sucursalId))
        }

        if (filtros.estado) {
            if (filtros.estado === 'sin_stock') {
                query += ' AND ss.stock_actual = 0'
            } else if (filtros.estado === 'bajo') {
                query += ' AND ss.stock_actual > 0 AND ss.stock_actual <= ss.stock_minimo'
            } else if (filtros.estado === 'ok') {
                query += ' AND ss.stock_actual > ss.stock_minimo'
            }
        }

        query += ' ORDER BY s.nombre ASC, p.nombre ASC'
        const [stockConSucursal] = await connection.execute(query, params)

        const stock = [...stockConSucursal]
        const fuenteDatos = 'stock_sucursal'

        let querySucursales = `
            SELECT s.id, CONCAT(e.nombre_empresa, ' / ', s.nombre) AS nombre
            FROM sucursales s
            INNER JOIN empresas e ON e.id = s.empresa_id
            WHERE s.empresa_id = ? AND s.activa = TRUE
        `
        const paramsSucursales = [contexto.empresaId]

        if (sucursalesAsignadas.length > 0) {
            const placeholders = sucursalesAsignadas.map(() => '?').join(',')
            querySucursales += ` AND s.id IN (${placeholders})`
            paramsSucursales.push(...sucursalesAsignadas)
        }

        querySucursales += ' ORDER BY nombre ASC'
        const [sucursales] = await connection.execute(querySucursales, paramsSucursales)

        connection.release()

        return {
            success: true,
            stock,
            sucursales,
            fuenteDatos,
            resumen: {
                total: stock.length,
                bajo: stock.filter((i) => Number(i.stock || 0) > 0 && Number(i.stock || 0) <= Number(i.stock_minimo || 0)).length,
                sin_stock: stock.filter((i) => Number(i.stock || 0) === 0).length
            }
        }
    } catch (error) {
        console.error('Error al obtener inventario:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar inventario' }
    }
}

export async function obtenerOpcionesInventario() {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const sucursalesAsignadas = await obtenerSucursalesAsignadas(connection, contexto.empresaId, contexto.userId)

        let querySucursales = `
            SELECT s.id, CONCAT(e.nombre_empresa, ' / ', s.nombre) AS nombre
            FROM sucursales s
            INNER JOIN empresas e ON e.id = s.empresa_id
            WHERE s.empresa_id = ? AND s.activa = TRUE
        `
        const paramsSucursales = [contexto.empresaId]

        if (sucursalesAsignadas.length > 0) {
            const placeholders = sucursalesAsignadas.map(() => '?').join(',')
            querySucursales += ` AND s.id IN (${placeholders})`
            paramsSucursales.push(...sucursalesAsignadas)
        }

        querySucursales += ' ORDER BY nombre ASC'

        const [sucursales] = await connection.execute(querySucursales, paramsSucursales)
        const [productos] = await connection.execute(
            `SELECT p.id, CONCAT(e.nombre_empresa, ' / ', p.nombre) AS nombre,
                    COALESCE(p.codigo_barras, p.sku, CONCAT('PROD-', p.id)) AS codigo
             FROM productos p
             INNER JOIN empresas e ON e.id = p.empresa_id
             WHERE p.empresa_id = ? AND p.activo = TRUE
             ORDER BY nombre ASC
             LIMIT 1000`,
            [contexto.empresaId]
        )

        connection.release()
        return { success: true, sucursales, productos }
    } catch (error) {
        console.error('Error en obtenerOpcionesInventario:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar opciones de inventario' }
    }
}

export async function obtenerInventarioPorId(id) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT
                ss.id,
                ss.empresa_id,
                ss.sucursal_id,
                ss.producto_id,
                ss.stock_actual,
                ss.stock_minimo,
                ss.stock_maximo,
                ss.ubicacion,
                ss.costo_promedio,
                ss.fecha_creacion,
                ss.fecha_actualizacion,
                s.nombre AS sucursal_nombre,
                p.nombre AS producto_nombre,
                COALESCE(p.codigo_barras, p.sku, CONCAT('PROD-', p.id)) AS producto_codigo,
                COALESCE(um.abreviatura, 'UN') AS unidad_medida
             FROM stock_sucursal ss
             INNER JOIN sucursales s ON s.id = ss.sucursal_id
             INNER JOIN productos p ON p.id = ss.producto_id
             LEFT JOIN unidades_medida um ON um.id = p.unidad_medida_id
             WHERE ss.id = ? AND ss.empresa_id = ?
             LIMIT 1`,
            [Number(id), contexto.empresaId]
        )

        if (!rows.length) {
            connection.release()
            return { success: false, mensaje: 'Registro de inventario no encontrado' }
        }

        const inventario = rows[0]
        const tieneAcceso = await validarAccesoSucursal(connection, contexto.empresaId, contexto.userId, Number(inventario.sucursal_id))
        if (!tieneAcceso) {
            connection.release()
            return { success: false, mensaje: 'No tienes acceso a esta sucursal' }
        }

        const [movimientos] = await connection.execute(
            `SELECT id, tipo_movimiento, origen, cantidad, stock_anterior, stock_nuevo, referencia, observaciones, fecha_creacion
             FROM movimientos_stock_sucursal
             WHERE empresa_id = ? AND sucursal_id = ? AND producto_id = ?
             ORDER BY fecha_creacion DESC
             LIMIT 50`,
            [contexto.empresaId, inventario.sucursal_id, inventario.producto_id]
        )

        connection.release()
        return { success: true, inventario, movimientos }
    } catch (error) {
        console.error('Error en obtenerInventarioPorId:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar detalle de inventario' }
    }
}

export async function crearInventarioSucursal(payload = {}) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const sucursalId = Number(payload.sucursalId)
        const productoId = Number(payload.productoId)
        const stockActual = Number(payload.stockActual || 0)
        const stockMinimo = Number(payload.stockMinimo || 0)
        const stockMaximo = payload.stockMaximo === '' || payload.stockMaximo === null || payload.stockMaximo === undefined ? null : Number(payload.stockMaximo)
        const ubicacion = String(payload.ubicacion || '').trim()
        const costoPromedio = Number(payload.costoPromedio || 0)

        if (!sucursalId || !productoId) {
            return { success: false, mensaje: 'Sucursal y producto son obligatorios' }
        }

        connection = await db.getConnection()
        const tieneAcceso = await validarAccesoSucursal(connection, contexto.empresaId, contexto.userId, sucursalId)
        if (!tieneAcceso) {
            connection.release()
            return { success: false, mensaje: 'No tienes acceso a esta sucursal' }
        }

        const [duplicado] = await connection.execute(
            `SELECT id FROM stock_sucursal WHERE empresa_id = ? AND sucursal_id = ? AND producto_id = ? LIMIT 1`,
            [contexto.empresaId, sucursalId, productoId]
        )

        if (duplicado.length > 0) {
            connection.release()
            return { success: false, mensaje: 'Ese producto ya existe en el inventario de la sucursal' }
        }

        const [result] = await connection.execute(
            `INSERT INTO stock_sucursal (
                empresa_id, sucursal_id, producto_id, stock_actual, stock_minimo, stock_maximo, ubicacion, costo_promedio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [contexto.empresaId, sucursalId, productoId, stockActual, stockMinimo, stockMaximo, ubicacion || null, costoPromedio]
        )

        if (stockActual > 0) {
            await connection.execute(
                `INSERT INTO movimientos_stock_sucursal (
                    empresa_id, sucursal_id, producto_id, tipo_movimiento, origen, cantidad,
                    stock_anterior, stock_nuevo, costo_unitario, referencia, observaciones, creado_por
                ) VALUES (?, ?, ?, 'entrada', 'ajuste_manual', ?, 0, ?, ?, ?, ?, ?)`,
                [
                    contexto.empresaId,
                    sucursalId,
                    productoId,
                    stockActual,
                    stockActual,
                    costoPromedio,
                    `INV-INI-${result.insertId}`,
                    'Inventario inicial creado manualmente',
                    contexto.userId
                ]
            )
        }

        connection.release()
        return { success: true, mensaje: 'Inventario creado correctamente', id: result.insertId }
    } catch (error) {
        console.error('Error en crearInventarioSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo crear el inventario' }
    }
}

export async function actualizarInventarioSucursal(id, payload = {}) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const inventarioId = Number(id)
        const stockActual = Number(payload.stockActual || 0)
        const stockMinimo = Number(payload.stockMinimo || 0)
        const stockMaximo = payload.stockMaximo === '' || payload.stockMaximo === null || payload.stockMaximo === undefined ? null : Number(payload.stockMaximo)
        const ubicacion = String(payload.ubicacion || '').trim()
        const costoPromedio = Number(payload.costoPromedio || 0)

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT id, sucursal_id, producto_id, stock_actual
             FROM stock_sucursal
             WHERE id = ? AND empresa_id = ?
             LIMIT 1`,
            [inventarioId, contexto.empresaId]
        )

        if (!rows.length) {
            connection.release()
            return { success: false, mensaje: 'Inventario no encontrado' }
        }

        const actual = rows[0]
        const tieneAcceso = await validarAccesoSucursal(connection, contexto.empresaId, contexto.userId, Number(actual.sucursal_id))
        if (!tieneAcceso) {
            connection.release()
            return { success: false, mensaje: 'No tienes acceso a esta sucursal' }
        }

        await connection.execute(
            `UPDATE stock_sucursal
             SET stock_actual = ?, stock_minimo = ?, stock_maximo = ?, ubicacion = ?, costo_promedio = ?
             WHERE id = ? AND empresa_id = ?`,
            [stockActual, stockMinimo, stockMaximo, ubicacion || null, costoPromedio, inventarioId, contexto.empresaId]
        )

        const anterior = Number(actual.stock_actual || 0)
        if (anterior !== stockActual) {
            await connection.execute(
                `INSERT INTO movimientos_stock_sucursal (
                    empresa_id, sucursal_id, producto_id, tipo_movimiento, origen, cantidad,
                    stock_anterior, stock_nuevo, costo_unitario, referencia, observaciones, creado_por
                ) VALUES (?, ?, ?, 'ajuste', 'ajuste_manual', ?, ?, ?, ?, ?, ?, ?)`,
                [
                    contexto.empresaId,
                    actual.sucursal_id,
                    actual.producto_id,
                    Math.abs(stockActual - anterior),
                    anterior,
                    stockActual,
                    costoPromedio,
                    `INV-EDIT-${inventarioId}`,
                    'Ajuste por edicion de inventario',
                    contexto.userId
                ]
            )
        }

        connection.release()
        return { success: true, mensaje: 'Inventario actualizado correctamente' }
    } catch (error) {
        console.error('Error en actualizarInventarioSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo actualizar el inventario' }
    }
}

export async function eliminarInventarioSucursal(id) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const inventarioId = Number(id)
        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT id, sucursal_id
             FROM stock_sucursal
             WHERE id = ? AND empresa_id = ?
             LIMIT 1`,
            [inventarioId, contexto.empresaId]
        )

        if (!rows.length) {
            connection.release()
            return { success: false, mensaje: 'Inventario no encontrado' }
        }

        const tieneAcceso = await validarAccesoSucursal(connection, contexto.empresaId, contexto.userId, Number(rows[0].sucursal_id))
        if (!tieneAcceso) {
            connection.release()
            return { success: false, mensaje: 'No tienes acceso a esta sucursal' }
        }

        await connection.execute(
            `DELETE FROM stock_sucursal WHERE id = ? AND empresa_id = ?`,
            [inventarioId, contexto.empresaId]
        )

        connection.release()
        return { success: true, mensaje: 'Inventario eliminado correctamente' }
    } catch (error) {
        console.error('Error en eliminarInventarioSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo eliminar el inventario' }
    }
}

export async function mezclarInventarioSucursales(payload = {}) {
    let connection
    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const sucursalOrigenId = Number(payload.sucursalOrigenId)
        const sucursalDestinoId = Number(payload.sucursalDestinoId)
        const estrategia = String(payload.estrategia || 'sumar')

        if (!sucursalOrigenId || !sucursalDestinoId || sucursalOrigenId === sucursalDestinoId) {
            return { success: false, mensaje: 'Debes seleccionar sucursales distintas' }
        }

        connection = await db.getConnection()
        const accesoOrigen = await validarAccesoSucursal(connection, contexto.empresaId, contexto.userId, sucursalOrigenId)
        const accesoDestino = await validarAccesoSucursal(connection, contexto.empresaId, contexto.userId, sucursalDestinoId)
        if (!accesoOrigen || !accesoDestino) {
            connection.release()
            return { success: false, mensaje: 'No tienes acceso a una de las sucursales' }
        }

        await connection.beginTransaction()

        const [origenRows] = await connection.execute(
            `SELECT producto_id, stock_actual, stock_minimo, stock_maximo, ubicacion, costo_promedio
             FROM stock_sucursal
             WHERE empresa_id = ? AND sucursal_id = ?`,
            [contexto.empresaId, sucursalOrigenId]
        )

        for (const item of origenRows) {
            const [destinoRows] = await connection.execute(
                `SELECT id, stock_actual, stock_minimo, stock_maximo, costo_promedio
                 FROM stock_sucursal
                 WHERE empresa_id = ? AND sucursal_id = ? AND producto_id = ?
                 LIMIT 1`,
                [contexto.empresaId, sucursalDestinoId, item.producto_id]
            )

            if (destinoRows.length > 0) {
                const destino = destinoRows[0]
                const stockAnterior = Number(destino.stock_actual || 0)
                const stockNuevo = estrategia === 'reemplazar'
                    ? Number(item.stock_actual || 0)
                    : stockAnterior + Number(item.stock_actual || 0)

                await connection.execute(
                    `UPDATE stock_sucursal
                     SET stock_actual = ?,
                         stock_minimo = GREATEST(COALESCE(stock_minimo, 0), ?),
                         stock_maximo = CASE
                             WHEN ? IS NULL THEN stock_maximo
                             WHEN stock_maximo IS NULL THEN ?
                             ELSE GREATEST(stock_maximo, ?)
                         END,
                         costo_promedio = CASE WHEN ? > 0 THEN ? ELSE costo_promedio END
                     WHERE id = ?`,
                    [
                        stockNuevo,
                        Number(item.stock_minimo || 0),
                        item.stock_maximo,
                        item.stock_maximo,
                        item.stock_maximo,
                        Number(item.costo_promedio || 0),
                        Number(item.costo_promedio || 0),
                        destino.id
                    ]
                )

                if (stockNuevo !== stockAnterior) {
                    await connection.execute(
                        `INSERT INTO movimientos_stock_sucursal (
                            empresa_id, sucursal_id, producto_id, tipo_movimiento, origen, cantidad,
                            stock_anterior, stock_nuevo, costo_unitario, referencia, observaciones, creado_por
                        ) VALUES (?, ?, ?, 'ajuste', 'ajuste_manual', ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            contexto.empresaId,
                            sucursalDestinoId,
                            item.producto_id,
                            Math.abs(stockNuevo - stockAnterior),
                            stockAnterior,
                            stockNuevo,
                            Number(item.costo_promedio || 0),
                            `MEZCLA-${sucursalOrigenId}-${sucursalDestinoId}`,
                            'Mezcla de inventario entre sucursales',
                            contexto.userId
                        ]
                    )
                }
            } else {
                const [insertResult] = await connection.execute(
                    `INSERT INTO stock_sucursal (
                        empresa_id, sucursal_id, producto_id, stock_actual, stock_minimo, stock_maximo, ubicacion, costo_promedio
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        contexto.empresaId,
                        sucursalDestinoId,
                        item.producto_id,
                        Number(item.stock_actual || 0),
                        Number(item.stock_minimo || 0),
                        item.stock_maximo,
                        item.ubicacion || null,
                        Number(item.costo_promedio || 0)
                    ]
                )

                if (Number(item.stock_actual || 0) > 0) {
                    await connection.execute(
                        `INSERT INTO movimientos_stock_sucursal (
                            empresa_id, sucursal_id, producto_id, tipo_movimiento, origen, cantidad,
                            stock_anterior, stock_nuevo, costo_unitario, referencia, observaciones, creado_por
                        ) VALUES (?, ?, ?, 'entrada', 'ajuste_manual', ?, 0, ?, ?, ?, ?, ?)`,
                        [
                            contexto.empresaId,
                            sucursalDestinoId,
                            item.producto_id,
                            Number(item.stock_actual || 0),
                            Number(item.stock_actual || 0),
                            Number(item.costo_promedio || 0),
                            `MEZCLA-${insertResult.insertId}`,
                            'Inventario compartido desde otra sucursal',
                            contexto.userId
                        ]
                    )
                }
            }
        }

        await connection.commit()
        connection.release()
        return { success: true, mensaje: 'Inventario mezclado correctamente entre sucursales' }
    } catch (error) {
        console.error('Error en mezclarInventarioSucursales:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return { success: false, mensaje: 'No se pudo mezclar el inventario' }
    }
}
