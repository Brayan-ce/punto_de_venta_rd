"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtener configuración general de la tienda B2B
 */
export async function obtenerConfigTiendaB2B() {
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

        // Obtener estadísticas generales
        const [productosStats] = await connection.execute(
            `SELECT 
                COUNT(*) as total_productos,
                COUNT(CASE WHEN activo = TRUE THEN 1 END) as productos_activos
            FROM isiweek_productos`
        )

        const [pedidosStats] = await connection.execute(
            `SELECT 
                COUNT(*) as total_pedidos,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pedidos_pendientes,
                COALESCE(SUM(CASE WHEN estado = 'entregado' THEN total ELSE 0 END), 0) as total_ventas
            FROM pedidos_b2b`
        )

        connection.release()

        const productos = productosStats[0] || { total_productos: 0, productos_activos: 0 }
        const pedidos = pedidosStats[0] || { total_pedidos: 0, pedidos_pendientes: 0, total_ventas: 0 }

        return {
            success: true,
            estadisticas: {
                total_productos: productos.total_productos,
                productos_activos: productos.productos_activos,
                total_pedidos: pedidos.total_pedidos,
                pedidos_pendientes: pedidos.pedidos_pendientes,
                total_ventas: pedidos.total_ventas
            }
        }

    } catch (error) {
        console.error('Error al obtener config tienda B2B:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar configuración de la tienda B2B'
        }
    }
}

