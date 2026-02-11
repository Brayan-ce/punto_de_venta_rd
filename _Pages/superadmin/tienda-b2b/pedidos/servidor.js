"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtener lista de pedidos B2B con filtros
 */
export async function obtenerPedidosB2B(filtroEstado = 'todos', empresaId = null) {
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
            SELECT 
                pb.*,
                e.nombre_empresa,
                e.nombre_comercial,
                u.nombre as usuario_nombre,
                u.email as usuario_email,
                COUNT(pbi.id) as cantidad_items
            FROM pedidos_b2b pb
            LEFT JOIN empresas e ON pb.empresa_id = e.id
            LEFT JOIN usuarios u ON pb.usuario_id = u.id
            LEFT JOIN pedidos_b2b_items pbi ON pb.id = pbi.pedido_id
            WHERE 1=1
        `
        const params = []

        if (filtroEstado !== 'todos') {
            query += ` AND pb.estado = ?`
            params.push(filtroEstado)
        }

        if (empresaId) {
            query += ` AND pb.empresa_id = ?`
            params.push(empresaId)
        }

        query += ` GROUP BY pb.id ORDER BY pb.fecha_pedido DESC`

        const [pedidos] = await connection.execute(query, params)

        // Obtener items para cada pedido
        for (let pedido of pedidos) {
            const [items] = await connection.execute(
                `SELECT 
                    pbi.*,
                    ip.nombre as producto_nombre,
                    ip.sku,
                    ip.imagen_url
                FROM pedidos_b2b_items pbi
                LEFT JOIN isiweek_productos ip ON pbi.producto_id = ip.id
                WHERE pbi.pedido_id = ?`,
                [pedido.id]
            )
            pedido.items = items
        }

        connection.release()

        return {
            success: true,
            pedidos: pedidos
        }

    } catch (error) {
        console.error('Error al obtener pedidos B2B:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar pedidos B2B'
        }
    }
}

/**
 * Obtener detalle completo de un pedido B2B
 */
export async function obtenerDetallePedidoB2B(pedidoId) {
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

        const [pedidos] = await connection.execute(
            `SELECT 
                pb.*,
                e.nombre_empresa,
                e.nombre_comercial,
                e.telefono as empresa_telefono,
                e.email as empresa_email,
                e.direccion as empresa_direccion,
                u.nombre as usuario_nombre,
                u.email as usuario_email
            FROM pedidos_b2b pb
            LEFT JOIN empresas e ON pb.empresa_id = e.id
            LEFT JOIN usuarios u ON pb.usuario_id = u.id
            WHERE pb.id = ?`,
            [pedidoId]
        )

        if (pedidos.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Pedido no encontrado'
            }
        }

        const pedido = pedidos[0]

        // Obtener items
        const [items] = await connection.execute(
            `SELECT 
                pbi.*,
                ip.nombre as producto_nombre,
                ip.sku,
                ip.imagen_url
            FROM pedidos_b2b_items pbi
            LEFT JOIN isiweek_productos ip ON pbi.producto_id = ip.id
            WHERE pbi.pedido_id = ?`,
            [pedidoId]
        )

        pedido.items = items

        connection.release()

        return {
            success: true,
            pedido: pedido
        }

    } catch (error) {
        console.error('Error al obtener detalle pedido B2B:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar detalle del pedido B2B'
        }
    }
}

/**
 * Actualizar estado de un pedido B2B
 */
export async function actualizarEstadoPedidoB2B(pedidoId, nuevoEstado) {
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

        // Verificar que el pedido existe
        const [pedidos] = await connection.execute(
            `SELECT id FROM pedidos_b2b WHERE id = ?`,
            [pedidoId]
        )

        if (pedidos.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Pedido no encontrado'
            }
        }

        // Actualizar estado
        await connection.execute(
            `UPDATE pedidos_b2b SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?`,
            [nuevoEstado, pedidoId]
        )

        // Si se confirma, establecer fecha de confirmación
        if (nuevoEstado === 'confirmado') {
            await connection.execute(
                `UPDATE pedidos_b2b SET fecha_confirmacion = NOW() WHERE id = ?`,
                [pedidoId]
            )
        }

        // Si se entrega, actualizar stock de productos
        if (nuevoEstado === 'entregado') {
            const [items] = await connection.execute(
                `SELECT producto_id, cantidad FROM pedidos_b2b_items WHERE pedido_id = ?`,
                [pedidoId]
            )

            for (const item of items) {
                await connection.execute(
                    `UPDATE isiweek_productos SET stock = stock - ? WHERE id = ?`,
                    [item.cantidad, item.producto_id]
                )
            }
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Estado del pedido actualizado correctamente'
        }

    } catch (error) {
        console.error('Error al actualizar estado pedido B2B:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar estado del pedido B2B'
        }
    }
}

/**
 * Obtener estadísticas de pedidos B2B
 */
export async function obtenerEstadisticasPedidosB2B() {
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

        const [stats] = await connection.execute(
            `SELECT 
                COUNT(*) as total_pedidos,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'confirmado' THEN 1 END) as confirmados,
                COUNT(CASE WHEN estado = 'en_proceso' THEN 1 END) as en_proceso,
                COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as enviados,
                COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as entregados,
                COALESCE(SUM(CASE WHEN estado = 'entregado' THEN total ELSE 0 END), 0) as total_ventas,
                COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN total ELSE 0 END), 0) as total_pendiente
            FROM pedidos_b2b`
        )

        connection.release()

        return {
            success: true,
            estadisticas: stats[0] || {
                total_pedidos: 0,
                pendientes: 0,
                confirmados: 0,
                en_proceso: 0,
                enviados: 0,
                entregados: 0,
                total_ventas: 0,
                total_pendiente: 0
            }
        }

    } catch (error) {
        console.error('Error al obtener estadísticas pedidos B2B:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar estadísticas'
        }
    }
}

