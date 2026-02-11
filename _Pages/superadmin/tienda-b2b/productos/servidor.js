"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'
import {guardarImagenProducto, eliminarImagenProducto} from '@/services/imageService'

/**
 * Obtener todas las categorías B2B
 */
export async function obtenerCategoriasB2B() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [categorias] = await connection.execute(
            `SELECT *
             FROM isiweek_categorias
             ORDER BY orden ASC, nombre ASC`
        )

        connection.release()

        return {
            success: true,
            categorias: categorias
        }

    } catch (error) {
        console.error('Error al obtener categorías B2B:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar categorías'
        }
    }
}

/**

 /**
 * Obtener todos los productos B2B con información de categoría
 */
export async function obtenerProductosB2B(filtroCategoria = null, filtroActivo = null) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        let query = `
            SELECT ip.*,
                   ic.nombre as categoria_nombre
            FROM isiweek_productos ip
                     LEFT JOIN isiweek_categorias ic ON ip.categoria_id = ic.id
            WHERE 1 = 1
        `
        const params = []

        if (filtroCategoria) {
            query += ` AND ip.categoria_id = ?`
            params.push(filtroCategoria)
        }

        if (filtroActivo !== null) {
            query += ` AND ip.activo = ?`
            params.push(filtroActivo)
        }

        query += ` ORDER BY ip.destacado DESC, ip.nombre ASC`

        const [productos] = await connection.execute(query, params)

        connection.release()

        return {
            success: true,
            productos: productos
        }

    } catch (error) {
        console.error('Error al obtener productos B2B:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar productos B2B'
        }
    }
}

/**
 * Crear nuevo producto B2B
 */
export async function crearProductoB2B(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {success: false, mensaje: 'Acceso no autorizado'}
        }

        if (!datos.nombre || !datos.precio) {
            return {success: false, mensaje: 'Nombre y precio son obligatorios'}
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // 1️⃣ Crear producto SIN imagen (para obtener ID)
            const [resultado] = await connection.execute(
                `INSERT INTO isiweek_productos (nombre, descripcion, categoria_id, precio, precio_volumen,
                                                cantidad_volumen, stock, imagen_url, sku,
                                                tiempo_entrega, activo, destacado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.nombre,
                    datos.descripcion || null,
                    datos.categoria_id || null,
                    parseFloat(datos.precio),
                    datos.precio_volumen ? parseFloat(datos.precio_volumen) : null,
                    datos.cantidad_volumen || null,
                    parseInt(datos.stock || 0),
                    datos.imagen_url || null, // URL externa
                    datos.sku || null,
                    datos.tiempo_entrega || null,
                    datos.activo ?? true,
                    datos.destacado ?? false
                ]
            )

            const productoId = resultado.insertId
            let imagenFinal = datos.imagen_url || null

            // 2️⃣ Guardar imagen local si viene en base64
            if (datos.imagen_base64 && !datos.imagen_url) {
                imagenFinal = await guardarImagenProducto(datos.imagen_base64, productoId)

                await connection.execute(
                    `UPDATE isiweek_productos
                     SET imagen_url = ?
                     WHERE id = ?`,
                    [imagenFinal, productoId]
                )
            }

            await connection.commit()
            connection.release()

            return {
                success: true,
                mensaje: 'Producto B2B creado correctamente',
                productoId
            }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al crear producto B2B:', error)
        if (connection) connection.release()

        return {
            success: false,
            mensaje: 'Error al crear producto B2B'
        }
    }
}

/**
 * Actualizar producto B2B
 */
export async function actualizarProductoB2B(productoId, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {success: false, mensaje: 'Acceso no autorizado'}
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // 1️⃣ Obtener imagen actual
            const [existente] = await connection.execute(
                `SELECT imagen_url
                 FROM isiweek_productos
                 WHERE id = ?`,
                [productoId]
            )

            if (existente.length === 0) {
                await connection.rollback()
                return {success: false, mensaje: 'Producto no encontrado'}
            }

            const imagenAnterior = existente[0].imagen_url
            let imagenFinal = datos.imagen_url || imagenAnterior || null

            // 2️⃣ Guardar nueva imagen base64
            if (datos.imagen_base64 && !datos.imagen_url) {
                imagenFinal = await guardarImagenProducto(datos.imagen_base64, productoId)

                if (imagenAnterior?.startsWith('/images/productos/')) {
                    await eliminarImagenProducto(imagenAnterior)
                }
            }

            // 3️⃣ Actualizar producto
            await connection.execute(
                `UPDATE isiweek_productos
                 SET nombre              = ?,
                     descripcion         = ?,
                     categoria_id        = ?,
                     precio              = ?,
                     precio_volumen      = ?,
                     cantidad_volumen    = ?,
                     stock               = ?,
                     imagen_url          = ?,
                     sku                 = ?,
                     tiempo_entrega      = ?,
                     activo              = ?,
                     destacado           = ?,
                     fecha_actualizacion = NOW()
                 WHERE id = ?`,
                [
                    datos.nombre,
                    datos.descripcion || null,
                    datos.categoria_id || null,
                    parseFloat(datos.precio),
                    datos.precio_volumen ? parseFloat(datos.precio_volumen) : null,
                    datos.cantidad_volumen || null,
                    parseInt(datos.stock || 0),
                    imagenFinal,
                    datos.sku || null,
                    datos.tiempo_entrega || null,
                    datos.activo ?? true,
                    datos.destacado ?? false,
                    productoId
                ]
            )

            await connection.commit()
            connection.release()

            return {success: true, mensaje: 'Producto B2B actualizado correctamente'}

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al actualizar producto B2B:', error)
        if (connection) connection.release()

        return {
            success: false,
            mensaje: 'Error al actualizar producto B2B'
        }
    }
}

/**
 * Eliminar producto B2B
 */
export async function eliminarProductoB2B(productoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {success: false, mensaje: 'Acceso no autorizado'}
        }

        connection = await db.getConnection()

        const [producto] = await connection.execute(
            `SELECT imagen_url
             FROM isiweek_productos
             WHERE id = ?`,
            [productoId]
        )

        await connection.execute(
            `DELETE
             FROM isiweek_productos
             WHERE id = ?`,
            [productoId]
        )

        connection.release()

        // Eliminar imagen local si existe
        if (producto.length && producto[0].imagen_url?.startsWith('/images/productos/')) {
            await eliminarImagenProducto(producto[0].imagen_url)
        }

        return {success: true, mensaje: 'Producto eliminado correctamente'}

    } catch (error) {
        console.error('Error al eliminar producto B2B:', error)
        if (connection) connection.release()

        return {
            success: false,
            mensaje: 'Error al eliminar producto B2B'
        }
    }
}

/**
 * Obtener detalle de un producto B2B
 */
export async function obtenerProductoB2B(productoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [productos] = await connection.execute(
            `SELECT ip.*,
                    ic.nombre as categoria_nombre
             FROM isiweek_productos ip
                      LEFT JOIN isiweek_categorias ic ON ip.categoria_id = ic.id
             WHERE ip.id = ?`,
            [productoId]
        )

        connection.release()

        if (productos.length === 0) {
            return {
                success: false,
                mensaje: 'Producto no encontrado'
            }
        }

        return {
            success: true,
            producto: productos[0]
        }

    } catch (error) {
        console.error('Error al obtener producto B2B:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar producto B2B'
        }
    }
}

