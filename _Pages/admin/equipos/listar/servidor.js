"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { eliminarImagenProducto } from '@/services/imageService'

export async function obtenerEquiposListado() {
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

        const [equipos] = await connection.execute(
            `SELECT 
                p.id,
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.descripcion,
                p.categoria_id,
                p.marca_id,
                p.precio_compra,
                p.precio_venta,
                p.precio_oferta,
                p.imagen_url,
                p.aplica_itbis,
                p.activo,
                p.tipo_activo,
                p.permite_financiamiento,
                p.meses_max_financiamiento,
                p.meses_garantia,
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre,
                um.abreviatura as unidad_medida_abreviatura,
                COUNT(CASE WHEN ap.estado = 'en_stock' THEN 1 END) as activos_disponibles,
                COUNT(CASE WHEN ap.estado = 'financiado' THEN 1 END) as activos_financiados,
                COUNT(CASE WHEN ap.estado = 'vendido' THEN 1 END) as activos_vendidos,
                COUNT(CASE WHEN ap.estado = 'asignado' THEN 1 END) as activos_asignados,
                COUNT(CASE WHEN ap.estado = 'mantenimiento' THEN 1 END) as activos_mantenimiento,
                COUNT(ap.id) as total_activos
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
            LEFT JOIN activos_productos ap ON p.id = ap.producto_id
            WHERE p.empresa_id = ? AND p.es_rastreable = TRUE
            GROUP BY p.id
            ORDER BY p.nombre ASC`,
            [empresaId]
        )

        const [categorias] = await connection.execute(
            `SELECT id, nombre
            FROM categorias
            WHERE empresa_id = ? AND activo = TRUE
            ORDER BY nombre ASC`,
            [empresaId]
        )

        const [marcas] = await connection.execute(
            `SELECT id, nombre
            FROM marcas
            WHERE empresa_id = ? AND activo = TRUE
            ORDER BY nombre ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            equipos: equipos,
            categorias: categorias,
            marcas: marcas,
            userTipo: userTipo
        }

    } catch (error) {
        console.error('Error al obtener equipos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar equipos'
        }
    }
}

export async function eliminarEquipo(equipoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar equipos'
            }
        }

        connection = await db.getConnection()

        // Verificar que el producto es rastreable
        const [producto] = await connection.execute(
            `SELECT id, imagen_url, es_rastreable FROM productos WHERE id = ? AND empresa_id = ?`,
            [equipoId, empresaId]
        )

        if (producto.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Equipo no encontrado'
            }
        }

        if (!producto[0].es_rastreable) {
            connection.release()
            return {
                success: false,
                mensaje: 'Este producto no es un equipo rastreable'
            }
        }

        // Verificar si tiene activos asociados con estados críticos
        const [activosCriticos] = await connection.execute(
            `SELECT COUNT(*) as total FROM activos_productos 
            WHERE producto_id = ? AND estado IN ('financiado', 'vendido')`,
            [equipoId]
        )

        if (activosCriticos[0].total > 0) {
            connection.release()
            return {
                success: false,
                mensaje: `No se puede eliminar el equipo porque tiene ${activosCriticos[0].total} activo(s) financiado(s) o vendido(s)`
            }
        }

        // Soft delete del producto
        await connection.execute(
            `UPDATE productos SET activo = FALSE WHERE id = ? AND empresa_id = ?`,
            [equipoId, empresaId]
        )

        connection.release()

        // Eliminar imagen física si es local
        const imagenUrl = producto[0].imagen_url
        if (imagenUrl && imagenUrl.startsWith('/images/productos/')) {
            await eliminarImagenProducto(imagenUrl)
        }

        return {
            success: true,
            mensaje: 'Equipo eliminado exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar equipo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar equipo'
        }
    }
}

