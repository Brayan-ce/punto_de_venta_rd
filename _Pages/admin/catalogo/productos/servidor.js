"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtener productos con información del catálogo
 */
export async function obtenerProductosCatalogo() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        const [productos] = await connection.execute(
            `SELECT 
                p.id,
                p.nombre,
                p.descripcion,
                p.precio_venta,
                p.precio_oferta,
                p.imagen_url,
                p.stock,
                p.activo,
                c.nombre as categoria_nombre,
                pc.visible_catalogo,
                pc.precio_catalogo,
                pc.precio_oferta as precio_oferta_catalogo,
                pc.fecha_inicio_oferta,
                pc.fecha_fin_oferta,
                pc.destacado,
                pc.orden_visual,
                pc.descripcion_corta,
                pc.stock_visible,
                pc.activo as activo_catalogo
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN productos_catalogo pc ON p.id = pc.producto_id AND pc.empresa_id = ?
            WHERE p.empresa_id = ?
            ORDER BY p.nombre ASC`,
            [empresaId, empresaId]
        )

        connection.release()

        return {
            success: true,
            productos: productos
        }

    } catch (error) {
        console.error('Error al obtener productos catálogo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar productos del catálogo'
        }
    }
}

/**
 * Actualizar configuración de producto en catálogo
 */
export async function actualizarProductoCatalogo(productoId, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        // Verificar que el producto pertenece a la empresa
        const [productos] = await connection.execute(
            `SELECT id FROM productos WHERE id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (productos.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Producto no encontrado'
            }
        }

        // Verificar si ya existe registro en productos_catalogo
        const [existentes] = await connection.execute(
            `SELECT id FROM productos_catalogo WHERE producto_id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (existentes.length > 0) {
            // Actualizar
            await connection.execute(
                `UPDATE productos_catalogo SET
                    visible_catalogo = ?,
                    precio_catalogo = ?,
                    precio_oferta = ?,
                    fecha_inicio_oferta = ?,
                    fecha_fin_oferta = ?,
                    destacado = ?,
                    orden_visual = ?,
                    descripcion_corta = ?,
                    stock_visible = ?,
                    activo = ?
                WHERE producto_id = ? AND empresa_id = ?`,
                [
                    datos.visible_catalogo !== undefined ? datos.visible_catalogo : false,
                    datos.precio_catalogo || null,
                    datos.precio_oferta || null,
                    datos.fecha_inicio_oferta || null,
                    datos.fecha_fin_oferta || null,
                    datos.destacado !== undefined ? datos.destacado : false,
                    datos.orden_visual || 0,
                    datos.descripcion_corta || null,
                    datos.stock_visible !== undefined ? datos.stock_visible : true,
                    datos.activo !== undefined ? datos.activo : true,
                    productoId,
                    empresaId
                ]
            )
        } else {
            // Crear
            await connection.execute(
                `INSERT INTO productos_catalogo (
                    producto_id, empresa_id, visible_catalogo, precio_catalogo,
                    precio_oferta, fecha_inicio_oferta, fecha_fin_oferta,
                    destacado, orden_visual, descripcion_corta, stock_visible, activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    productoId,
                    empresaId,
                    datos.visible_catalogo !== undefined ? datos.visible_catalogo : false,
                    datos.precio_catalogo || null,
                    datos.precio_oferta || null,
                    datos.fecha_inicio_oferta || null,
                    datos.fecha_fin_oferta || null,
                    datos.destacado !== undefined ? datos.destacado : false,
                    datos.orden_visual || 0,
                    datos.descripcion_corta || null,
                    datos.stock_visible !== undefined ? datos.stock_visible : true,
                    datos.activo !== undefined ? datos.activo : true
                ]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Producto actualizado correctamente'
        }

    } catch (error) {
        console.error('Error al actualizar producto catálogo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar producto del catálogo'
        }
    }
}

/**
 * Toggle de visibilidad de producto en catálogo
 */
export async function toggleVisibilidadProducto(productoId, visible) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        // Verificar si existe registro
        const [existentes] = await connection.execute(
            `SELECT id FROM productos_catalogo WHERE producto_id = ? AND empresa_id = ?`,
            [productoId, empresaId]
        )

        if (existentes.length > 0) {
            await connection.execute(
                `UPDATE productos_catalogo SET visible_catalogo = ? WHERE producto_id = ? AND empresa_id = ?`,
                [visible, productoId, empresaId]
            )
        } else {
            // Crear registro con visibilidad
            await connection.execute(
                `INSERT INTO productos_catalogo (producto_id, empresa_id, visible_catalogo, activo)
                VALUES (?, ?, ?, TRUE)`,
                [productoId, empresaId, visible]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Visibilidad actualizada'
        }

    } catch (error) {
        console.error('Error al toggle visibilidad:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar visibilidad'
        }
    }
}

