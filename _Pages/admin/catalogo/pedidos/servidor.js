"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtener lista de pedidos online
 */
export async function obtenerPedidosOnline(filtroEstado = 'todos') {
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

        let query = `
            SELECT 
                po.*,
                COUNT(poi.id) as cantidad_items
            FROM pedidos_online po
            LEFT JOIN pedidos_online_items poi ON po.id = poi.pedido_id
            WHERE po.empresa_id = ?
        `
        const params = [empresaId]

        if (filtroEstado !== 'todos') {
            query += ` AND po.estado = ?`
            params.push(filtroEstado)
        }

        query += ` GROUP BY po.id ORDER BY po.fecha_pedido DESC`

        const [pedidos] = await connection.execute(query, params)

        // Obtener items para cada pedido
        for (let pedido of pedidos) {
            const [items] = await connection.execute(
                `SELECT 
                    poi.*,
                    p.nombre as producto_nombre,
                    p.imagen_url
                FROM pedidos_online_items poi
                LEFT JOIN productos p ON poi.producto_id = p.id
                WHERE poi.pedido_id = ?`,
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
        console.error('Error al obtener pedidos online:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar pedidos online'
        }
    }
}

/**
 * Obtener detalle completo de un pedido online
 */
export async function obtenerDetallePedido(pedidoId) {
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

        const [pedidos] = await connection.execute(
            `SELECT * FROM pedidos_online WHERE id = ? AND empresa_id = ?`,
            [pedidoId, empresaId]
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
                poi.*,
                p.nombre as producto_nombre,
                p.imagen_url,
                p.sku
            FROM pedidos_online_items poi
            LEFT JOIN productos p ON poi.producto_id = p.id
            WHERE poi.pedido_id = ?`,
            [pedidoId]
        )

        pedido.items = items

        connection.release()

        return {
            success: true,
            pedido: pedido
        }

    } catch (error) {
        console.error('Error al obtener detalle pedido:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar detalle del pedido'
        }
    }
}

/**
 * Actualizar estado de un pedido online
 */
export async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
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

        // Verificar que el pedido pertenece a la empresa
        const [pedidos] = await connection.execute(
            `SELECT id FROM pedidos_online WHERE id = ? AND empresa_id = ?`,
            [pedidoId, empresaId]
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
            `UPDATE pedidos_online SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?`,
            [nuevoEstado, pedidoId]
        )

        // Si se confirma, establecer fecha de confirmación
        if (nuevoEstado === 'confirmado') {
            await connection.execute(
                `UPDATE pedidos_online SET fecha_confirmacion = NOW() WHERE id = ?`,
                [pedidoId]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Estado del pedido actualizado'
        }

    } catch (error) {
        console.error('Error al actualizar estado pedido:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar estado del pedido'
        }
    }
}

/**
 * Confirmar pedido y crear venta (opcional - se implementará después)
 */
export async function confirmarPedido(pedidoId) {
    // Esta función se implementará después cuando se integre con el módulo de ventas
    return {
        success: false,
        mensaje: 'Función en desarrollo'
    }
}

