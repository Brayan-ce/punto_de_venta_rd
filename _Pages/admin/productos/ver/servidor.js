"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { existeImagenLocal } from '@/services/imageService'

export async function obtenerDetalleProducto(productoId) {
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

        const [producto] = await connection.execute(
            `SELECT 
                p.*,
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre,
                um.nombre as unidad_medida_nombre,
                um.abreviatura as unidad_medida_abreviatura
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
            WHERE p.id = ? AND p.empresa_id = ?`,
            [productoId, empresaId]
        )

        if (producto.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Producto no encontrado'
            }
        }

        connection.release()

        // ✅ VALIDACIÓN DE IMAGEN EN SERVIDOR
        const productoData = producto[0]
        
        // Validar que la imagen existe si es local
        if (productoData.imagen_url && productoData.imagen_url.startsWith('/images/')) {
            const existe = await existeImagenLocal(productoData.imagen_url)
            if (!existe) {
                console.warn(`Imagen no encontrada físicamente: ${productoData.imagen_url}`)
                productoData.imagen_url = null // Limpiar referencia rota
            }
        }

        return {
            success: true,
            producto: productoData
        }

    } catch (error) {
        console.error('Error al obtener detalle del producto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos del producto'
        }
    }
}