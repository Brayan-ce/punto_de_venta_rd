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
        console.warn('Tabla usuarios_sucursales no encontrada en productos')
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
    const [sucursales] = await connection.execute(query, params)
    return sucursales
}

async function sucursalPermitida(connection, contexto, sucursalId) {
    const sucursalIdNum = Number(sucursalId)
    if (!sucursalIdNum) return false

    const sucursales = await obtenerSucursalesDisponibles(connection, contexto)
    return sucursales.some((s) => Number(s.id) === sucursalIdNum)
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

function generarPrefijoSku(nombre = '') {
    const limpio = String(nombre || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')

    if (!limpio) return 'PROD'
    return limpio.slice(0, 4).padEnd(4, 'X')
}

async function generarCodigoBarrasUnico(connection, empresaId, excluirId = null) {
    for (let intento = 0; intento < 40; intento += 1) {
        const fecha = Date.now().toString().slice(-10)
        const random = Math.floor(Math.random() * 900 + 100).toString()
        const candidato = `${fecha}${random}`.slice(0, 13)

        const whereExclusion = excluirId ? ' AND id != ?' : ''
        const params = excluirId
            ? [empresaId, candidato, Number(excluirId)]
            : [empresaId, candidato]

        const [rows] = await connection.execute(
            `SELECT id FROM productos WHERE empresa_id = ? AND codigo_barras = ?${whereExclusion} LIMIT 1`,
            params
        )

        if (rows.length === 0) return candidato
    }

    throw new Error('No se pudo generar un codigo de barras unico')
}

async function generarSkuUnico(connection, empresaId, nombre, excluirId = null) {
    const prefijo = generarPrefijoSku(nombre)

    for (let intento = 0; intento < 40; intento += 1) {
        const random = Math.floor(Math.random() * 9000 + 1000)
        const candidato = `${prefijo}-${random}`

        const whereExclusion = excluirId ? ' AND id != ?' : ''
        const params = excluirId
            ? [empresaId, candidato, Number(excluirId)]
            : [empresaId, candidato]

        const [rows] = await connection.execute(
            `SELECT id FROM productos WHERE empresa_id = ? AND sku = ?${whereExclusion} LIMIT 1`,
            params
        )

        if (rows.length === 0) return candidato
    }

    throw new Error('No se pudo generar un SKU unico')
}

export async function obtenerProductosSucursal(filtros = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const sucursalesAsignadas = await obtenerSucursalesAsignadas(connection, contexto.empresaId, contexto.userId)
        const sucursalesObjetivo = sucursalesAsignadas.length > 0 ? sucursalesAsignadas : []

        await sincronizarStockDesdeProductos(connection, contexto.empresaId, sucursalesObjetivo)

        let query = `
            SELECT
                p.id,
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.descripcion,
                p.precio_compra,
                p.precio_venta,
                COALESCE(SUM(ss.stock_actual), 0) AS stock,
                COALESCE(MIN(ss.stock_minimo), COALESCE(p.stock_minimo, 0)) AS stock_minimo,
                COALESCE(MAX(ss.stock_maximo), COALESCE(p.stock_maximo, 1000)) AS stock_maximo,
                p.aplica_itbis,
                p.activo,
                p.fecha_actualizacion
            FROM productos p
            LEFT JOIN stock_sucursal ss
                ON ss.empresa_id = p.empresa_id
               AND ss.producto_id = p.id
        `

        const params = []

        if (sucursalesAsignadas.length > 0) {
            const placeholders = sucursalesAsignadas.map(() => '?').join(',')
            query += ` AND ss.sucursal_id IN (${placeholders})`
            params.push(...sucursalesAsignadas)
        }

        query += `
            WHERE p.empresa_id = ?
        `
        params.push(contexto.empresaId)

        if (filtros.buscar) {
            query += ` AND (
                p.nombre LIKE ?
                OR COALESCE(p.codigo_barras, '') LIKE ?
                OR COALESCE(p.sku, '') LIKE ?
            )`
            const like = `%${filtros.buscar}%`
            params.push(like, like, like)
        }

        if (filtros.estado === 'activos') {
            query += ' AND p.activo = TRUE'
        } else if (filtros.estado === 'inactivos') {
            query += ' AND p.activo = FALSE'
        }

        query += `
            GROUP BY
                p.id,
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.descripcion,
                p.precio_compra,
                p.precio_venta,
                p.aplica_itbis,
                p.activo,
                p.fecha_actualizacion,
                p.stock_minimo,
                p.stock_maximo
        `

        if (filtros.estado === 'sin_stock') {
            query += ' HAVING COALESCE(SUM(ss.stock_actual), 0) = 0'
        } else if (filtros.estado === 'bajo') {
            query += ' HAVING COALESCE(SUM(ss.stock_actual), 0) > 0 AND COALESCE(SUM(ss.stock_actual), 0) <= COALESCE(MIN(ss.stock_minimo), COALESCE(p.stock_minimo, 0))'
        } else if (filtros.estado === 'ok') {
            query += ' HAVING COALESCE(SUM(ss.stock_actual), 0) > COALESCE(MIN(ss.stock_minimo), COALESCE(p.stock_minimo, 0))'
        }

        query += ' ORDER BY p.fecha_actualizacion DESC LIMIT 1000'

        const [productos] = await connection.execute(query, params)
        connection.release()

        return { success: true, productos }
    } catch (error) {
        console.error('Error en obtenerProductosSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar productos' }
    }
}

export async function obtenerProductoSucursalPorId(id) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT
                p.id,
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.descripcion,
                p.precio_compra,
                p.precio_venta,
                p.stock,
                p.stock_minimo,
                p.stock_maximo,
                p.aplica_itbis,
                p.activo,
                (
                    SELECT ss.sucursal_id
                    FROM stock_sucursal ss
                    WHERE ss.empresa_id = p.empresa_id AND ss.producto_id = p.id
                    ORDER BY ss.fecha_actualizacion DESC, ss.id DESC
                    LIMIT 1
                ) AS sucursal_id,
                (
                    SELECT s.nombre
                    FROM stock_sucursal ss
                    INNER JOIN sucursales s ON s.id = ss.sucursal_id
                    WHERE ss.empresa_id = p.empresa_id AND ss.producto_id = p.id
                    ORDER BY ss.fecha_actualizacion DESC, ss.id DESC
                    LIMIT 1
                ) AS sucursal_nombre,
                p.fecha_creacion,
                p.fecha_actualizacion
             FROM productos p
             WHERE p.id = ? AND p.empresa_id = ?
             LIMIT 1`,
            [Number(id), contexto.empresaId]
        )

        if (!rows.length) {
            connection.release()
            return { success: false, mensaje: 'Producto no encontrado' }
        }

        connection.release()
        return { success: true, producto: rows[0] }
    } catch (error) {
        console.error('Error en obtenerProductoSucursalPorId:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar producto' }
    }
}

export async function obtenerOpcionesSucursalesProducto() {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const sucursales = await obtenerSucursalesDisponibles(connection, contexto)
        connection.release()

        return { success: true, sucursales }
    } catch (error) {
        console.error('Error en obtenerOpcionesSucursalesProducto:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudieron cargar las sucursales' }
    }
}

export async function crearProductoSucursal(payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const nombre = String(payload.nombre || '').trim()
        const descripcion = String(payload.descripcion || '').trim()
        const precioCompra = Number(payload.precio_compra || 0)
        const precioVenta = Number(payload.precio_venta || 0)
        const stock = payload.stock === '' || payload.stock === null || payload.stock === undefined
            ? 1000
            : Number(payload.stock)
        const stockMinimo = Number(payload.stock_minimo || 0)
        const stockMaximo = payload.stock_maximo === '' || payload.stock_maximo === null || payload.stock_maximo === undefined
            ? 1000
            : Number(payload.stock_maximo)
        const aplicaItbis = payload.aplica_itbis !== false
        const activo = payload.activo !== false
        const sucursalId = payload.sucursal_id ? Number(payload.sucursal_id) : null

        if (!nombre) return { success: false, mensaje: 'El nombre es obligatorio' }
        if (precioVenta < 0 || precioCompra < 0 || stock < 0 || stockMinimo < 0) {
            return { success: false, mensaje: 'Valores numericos invalidos' }
        }

        connection = await db.getConnection()

        if (sucursalId && !(await sucursalPermitida(connection, contexto, sucursalId))) {
            connection.release()
            return { success: false, mensaje: 'Debes seleccionar una sucursal valida' }
        }

        const codigoBarras = await generarCodigoBarrasUnico(connection, contexto.empresaId)
        const sku = await generarSkuUnico(connection, contexto.empresaId, nombre)

        const [result] = await connection.execute(
            `INSERT INTO productos (
                empresa_id,
                codigo_barras,
                sku,
                nombre,
                descripcion,
                categoria_id,
                marca_id,
                unidad_medida_id,
                precio_compra,
                precio_venta,
                precio_por_unidad,
                permite_decimales,
                unidad_venta_default_id,
                precio_oferta,
                precio_mayorista,
                cantidad_mayorista,
                stock,
                stock_minimo,
                stock_maximo,
                imagen_url,
                aplica_itbis,
                activo,
                fecha_vencimiento,
                lote,
                ubicacion_bodega
            ) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, FALSE, NULL, NULL, NULL, 6, ?, ?, ?, NULL, ?, ?, NULL, NULL, NULL)`,
            [
                contexto.empresaId,
                codigoBarras,
                sku,
                nombre,
                descripcion || null,
                precioCompra,
                precioVenta,
                precioVenta,
                stock,
                stockMinimo,
                stockMaximo,
                aplicaItbis,
                activo
            ]
        )

        if (sucursalId) {
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    stock_actual = VALUES(stock_actual),
                    stock_minimo = VALUES(stock_minimo),
                    stock_maximo = VALUES(stock_maximo),
                    costo_promedio = VALUES(costo_promedio),
                    fecha_actualizacion = CURRENT_TIMESTAMP`,
                [
                    contexto.empresaId,
                    sucursalId,
                    result.insertId,
                    stock,
                    stockMinimo,
                    stockMaximo,
                    'General',
                    precioCompra > 0 ? precioCompra : precioVenta
                ]
            )
        }

        connection.release()
        return { success: true, mensaje: 'Producto creado correctamente', id: result.insertId }
    } catch (error) {
        console.error('Error en crearProductoSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo crear el producto' }
    }
}

export async function actualizarProductoSucursal(id, payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const productoId = Number(id)
        const nombre = String(payload.nombre || '').trim()
        const descripcion = String(payload.descripcion || '').trim()
        const precioCompra = Number(payload.precio_compra || 0)
        const precioVenta = Number(payload.precio_venta || 0)
        const stock = Number(payload.stock || 0)
        const stockMinimo = Number(payload.stock_minimo || 0)
        const stockMaximo = payload.stock_maximo === '' || payload.stock_maximo === null || payload.stock_maximo === undefined
            ? 1000
            : Number(payload.stock_maximo)
        const aplicaItbis = payload.aplica_itbis !== false
        const activo = payload.activo !== false
        const sucursalId = payload.sucursal_id ? Number(payload.sucursal_id) : null

        if (!productoId || !nombre) return { success: false, mensaje: 'Datos invalidos para actualizar' }

        connection = await db.getConnection()

        if (sucursalId && !(await sucursalPermitida(connection, contexto, sucursalId))) {
            connection.release()
            return { success: false, mensaje: 'Debes seleccionar una sucursal valida' }
        }

        const [existRows] = await connection.execute(
            `SELECT id, codigo_barras, sku FROM productos WHERE id = ? AND empresa_id = ? LIMIT 1`,
            [productoId, contexto.empresaId]
        )

        if (!existRows.length) {
            connection.release()
            return { success: false, mensaje: 'Producto no encontrado' }
        }

        const codigoBarras = String(existRows[0].codigo_barras || '').trim() || await generarCodigoBarrasUnico(connection, contexto.empresaId, productoId)
        const sku = String(existRows[0].sku || '').trim() || await generarSkuUnico(connection, contexto.empresaId, nombre, productoId)

        await connection.execute(
            `UPDATE productos
             SET codigo_barras = ?,
                 sku = ?,
                 nombre = ?,
                 descripcion = ?,
                 precio_compra = ?,
                 precio_venta = ?,
                 precio_por_unidad = ?,
                 stock = ?,
                 stock_minimo = ?,
                 stock_maximo = ?,
                 aplica_itbis = ?,
                 activo = ?,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = ? AND empresa_id = ?`,
            [
                codigoBarras,
                sku,
                nombre,
                descripcion || null,
                precioCompra,
                precioVenta,
                precioVenta,
                stock,
                stockMinimo,
                stockMaximo,
                aplicaItbis,
                activo,
                productoId,
                contexto.empresaId
            ]
        )

        if (sucursalId) {
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    stock_actual = VALUES(stock_actual),
                    stock_minimo = VALUES(stock_minimo),
                    stock_maximo = VALUES(stock_maximo),
                    costo_promedio = VALUES(costo_promedio),
                    fecha_actualizacion = CURRENT_TIMESTAMP`,
                [
                    contexto.empresaId,
                    sucursalId,
                    productoId,
                    stock,
                    stockMinimo,
                    stockMaximo,
                    'General',
                    precioCompra > 0 ? precioCompra : precioVenta
                ]
            )
        }

        connection.release()
        return { success: true, mensaje: 'Producto actualizado correctamente' }
    } catch (error) {
        console.error('Error en actualizarProductoSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo actualizar el producto' }
    }
}

export async function eliminarProductoSucursal(id) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const productoId = Number(id)
        if (!productoId) return { success: false, mensaje: 'Producto invalido' }

        connection = await db.getConnection()

        const [existRows] = await connection.execute(
            `SELECT id FROM productos WHERE id = ? AND empresa_id = ? LIMIT 1`,
            [productoId, contexto.empresaId]
        )

        if (!existRows.length) {
            connection.release()
            return { success: false, mensaje: 'Producto no encontrado' }
        }

        await connection.execute(
            `UPDATE productos SET activo = FALSE, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ? AND empresa_id = ?`,
            [productoId, contexto.empresaId]
        )

        connection.release()
        return { success: true, mensaje: 'Producto eliminado correctamente' }
    } catch (error) {
        console.error('Error en eliminarProductoSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo eliminar el producto' }
    }
}
