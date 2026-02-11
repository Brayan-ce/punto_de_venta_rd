"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { guardarImagenProducto } from '@/services/imageService'

/**
 * Crear producto nuevo para el catálogo del superadmin
 */
export async function crearProductoCatalogoSuperAdmin(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        if (!datos.nombre || !datos.precio_venta) {
            return {
                success: false,
                mensaje: 'Nombre y precio son requeridos'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Crear producto primero (sin imagen) para obtener el ID
            const [resultado] = await connection.execute(
                `INSERT INTO superadmin_productos_catalogo (
                    nombre, descripcion, categoria_id,
                    precio_venta, precio_oferta,
                    stock, imagen_url, sku, destacado,
                    visible_catalogo, activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.nombre,
                    datos.descripcion || null,
                    datos.categoria_id || null,
                    parseFloat(datos.precio_venta),
                    datos.precio_oferta ? parseFloat(datos.precio_oferta) : null,
                    parseInt(datos.stock || 0),
                    datos.imagen_url || null, // URL externa si existe, si no null
                    datos.sku || null,
                    datos.destacado ? true : false,
                    datos.visible_catalogo !== undefined ? datos.visible_catalogo : true,
                    datos.activo !== undefined ? datos.activo : true
                ]
            )

            const productoId = resultado.insertId

            // Guardar imagen local si existe imagen_base64
            if (datos.imagen_base64 && !datos.imagen_url) {
                try {
                    const imagenFinal = await guardarImagenProducto(datos.imagen_base64, productoId)
                    
                    // Actualizar producto con la ruta de la imagen
                    await connection.execute(
                        `UPDATE superadmin_productos_catalogo SET imagen_url = ? WHERE id = ?`,
                        [imagenFinal, productoId]
                    )
                } catch (error) {
                    await connection.rollback()
                    connection.release()
                    return {
                        success: false,
                        mensaje: 'Error al guardar la imagen del producto: ' + error.message
                    }
                }
            }

            await connection.commit()
            connection.release()

            return {
                success: true,
                mensaje: 'Producto creado correctamente',
                producto_id: productoId
            }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al crear producto:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear producto'
        }
    }
}

/**
 * Actualizar producto del catálogo del superadmin
 */
export async function actualizarProductoCatalogoSuperAdmin(productoId, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Obtener imagen anterior
            const [productoExistente] = await connection.execute(
                `SELECT imagen_url FROM superadmin_productos_catalogo WHERE id = ?`,
                [productoId]
            )

            if (productoExistente.length === 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'Producto no encontrado'
                }
            }

            const imagenAnterior = productoExistente[0].imagen_url
            let imagenFinal = datos.imagen_url || imagenAnterior || null

            // Si hay una nueva imagen base64, guardarla localmente
            if (datos.imagen_base64 && !datos.imagen_url) {
                try {
                    // Guardar nueva imagen
                    imagenFinal = await guardarImagenProducto(datos.imagen_base64, productoId)
                    
                    // Eliminar imagen anterior si existe y es local
                    if (imagenAnterior && imagenAnterior.startsWith('/images/productos/')) {
                        const { eliminarImagenProducto } = await import('@/services/imageService')
                        await eliminarImagenProducto(imagenAnterior)
                    }
                } catch (error) {
                    await connection.rollback()
                    connection.release()
                    return {
                        success: false,
                        mensaje: 'Error al guardar la imagen del producto: ' + error.message
                    }
                }
            }

            await connection.execute(
                `UPDATE superadmin_productos_catalogo SET
                    nombre = ?,
                    descripcion = ?,
                    categoria_id = ?,
                    precio_venta = ?,
                    precio_oferta = ?,
                    stock = ?,
                    imagen_url = ?,
                    sku = ?,
                    destacado = ?,
                    visible_catalogo = ?,
                    activo = ?
                WHERE id = ?`,
                [
                    datos.nombre,
                    datos.descripcion || null,
                    datos.categoria_id || null,
                    parseFloat(datos.precio_venta),
                    datos.precio_oferta ? parseFloat(datos.precio_oferta) : null,
                    parseInt(datos.stock || 0),
                    imagenFinal,
                    datos.sku || null,
                    datos.destacado ? true : false,
                    datos.visible_catalogo !== undefined ? datos.visible_catalogo : true,
                    datos.activo !== undefined ? datos.activo : true,
                    productoId
                ]
            )

            await connection.commit()
            connection.release()

            return {
                success: true,
                mensaje: 'Producto actualizado correctamente'
            }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al actualizar producto:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar producto'
        }
    }
}

/**
 * Eliminar producto del catálogo del superadmin
 */
export async function eliminarProductoCatalogoSuperAdmin(productoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        // Obtener imagen antes de eliminar
        const [producto] = await connection.execute(
            `SELECT imagen_url FROM superadmin_productos_catalogo WHERE id = ?`,
            [productoId]
        )

        // Eliminar producto
        await connection.execute(
            `DELETE FROM superadmin_productos_catalogo WHERE id = ?`,
            [productoId]
        )

        connection.release()

        // Eliminar imagen física (si es local)
        if (producto.length > 0) {
            const imagenUrl = producto[0].imagen_url
            if (imagenUrl && imagenUrl.startsWith('/images/productos/')) {
                const { eliminarImagenProducto } = await import('@/services/imageService')
                await eliminarImagenProducto(imagenUrl)
            }
        }

        return {
            success: true,
            mensaje: 'Producto eliminado correctamente'
        }

    } catch (error) {
        console.error('Error al eliminar producto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar producto'
        }
    }
}

/**
 * Toggle visibilidad del producto en el catálogo
 */
export async function toggleVisibilidadProductoSuperAdmin(productoId, visible) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE superadmin_productos_catalogo SET visible_catalogo = ? WHERE id = ?`,
            [visible, productoId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Visibilidad actualizada correctamente'
        }

    } catch (error) {
        console.error('Error al actualizar visibilidad:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar visibilidad'
        }
    }
}

/**
 * Obtener todos los productos del catálogo del superadmin
 */
export async function obtenerProductosCatalogoSuperAdmin() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        const [productos] = await connection.execute(
            `SELECT 
                sp.id,
                sp.nombre,
                sp.descripcion,
                sp.imagen_url,
                sp.precio_venta,
                sp.precio_venta as precio,
                sp.precio_oferta,
                sp.stock,
                sp.sku,
                sp.destacado,
                sp.visible_catalogo,
                sp.activo,
                c.nombre as categoria_nombre,
                c.id as categoria_id
            FROM superadmin_productos_catalogo sp
            LEFT JOIN categorias c ON sp.categoria_id = c.id
            ORDER BY sp.destacado DESC, sp.nombre ASC`
        )

        connection.release()

        return {
            success: true,
            productos: productos
        }

    } catch (error) {
        console.error('Error al obtener productos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar productos'
        }
    }
}

/**
 * Obtener categorías disponibles para productos del superadmin
 */
export async function obtenerCategoriasSuperAdmin() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        const [categorias] = await connection.execute(
            `SELECT id, nombre FROM categorias WHERE activo = TRUE ORDER BY nombre ASC`
        )

        connection.release()

        return {
            success: true,
            categorias: categorias
        }

    } catch (error) {
        console.error('Error al obtener categorías:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar categorías'
        }
    }
}

