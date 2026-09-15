"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function sesion() {
    const c = await cookies()
    const userId = c.get('userId')?.value
    const empresaId = c.get('empresaId')?.value
    const userTipo = c.get('userTipo')?.value
    if (!userId || !empresaId || !['admin', 'vendedor', 'delivery'].includes(userTipo)) throw new Error('Sesion invalida')
    return { userId: Number(userId), empresaId: Number(empresaId), userTipo }
}

export async function listarEntregas({ busqueda = '', estado = 'todos' } = {}) {
    let connection
    try {
        const { empresaId, userId, userTipo } = await sesion()
        connection = await db.getConnection()
        const params = [empresaId]
        let where = `WHERE po.empresa_id = ? AND po.metodo_entrega = 'delivery' AND po.estado IN ('listo','entregado')`
        // Todos los delivery pueden ver pedidos listos; cada uno puede tomarlos.
        if (estado !== 'todos') { where += ` AND po.estado = ?`; params.push(estado) }
        if (busqueda.trim()) {
            where += ` AND (po.numero_pedido LIKE ? OR po.cliente_nombre LIKE ? OR po.cliente_telefono LIKE ?)`
            const like = `%${busqueda.trim()}%`
            params.push(like, like, like)
        }
        const [pedidos] = await connection.execute(
            `SELECT po.id, po.numero_pedido, po.cliente_id, po.cliente_nombre, po.cliente_telefono,
                    po.cliente_direccion, po.referencia_entrega, po.latitud_entrega, po.longitud_entrega,
                    po.total, po.estado, po.fecha_pedido, po.delivery_id,
                    c.foto_url AS cliente_foto,
                    COALESCE(cc.score_crediticio, c.score_crediticio, 100) AS score_crediticio,
                    d.alias AS direccion_alias, d.latitud AS direccion_latitud, d.longitud AS direccion_longitud
             FROM pedidos_online po
             LEFT JOIN clientes c ON c.id = po.cliente_id AND c.empresa_id = po.empresa_id
             LEFT JOIN credito_clientes cc ON cc.cliente_id = c.id AND cc.empresa_id = po.empresa_id AND cc.activo = TRUE
             LEFT JOIN direcciones_clientes d ON d.id = (
                 SELECT d2.id FROM direcciones_clientes d2
                 WHERE d2.cliente_id = po.cliente_id AND d2.empresa_id = po.empresa_id
                 ORDER BY d2.es_principal DESC, d2.fecha_ultima_entrega DESC LIMIT 1
             )
             ${where}
             ORDER BY po.estado = 'listo' DESC, po.fecha_pedido ASC`, params)
        connection.release()
        return { success: true, pedidos }
    } catch (error) {
        if (connection) connection.release()
        console.error('listarEntregas:', error)
        return { success: false, pedidos: [], mensaje: error.message }
    }
}

export async function buscarClientesDelivery(busqueda = '') {
    let connection
    try {
        const { empresaId } = await sesion()
        connection = await db.getConnection()
        const like = `%${busqueda.trim()}%`
        const [clientes] = await connection.execute(
            `SELECT c.id, CONCAT(c.nombre, ' ', COALESCE(c.apellidos, '')) AS nombre,
                    c.telefono, c.foto_url, COALESCE(cc.score_crediticio, c.score_crediticio, 100) AS score,
                    d.direccion, d.referencia, d.latitud, d.longitud, d.alias
             FROM clientes c
             LEFT JOIN credito_clientes cc ON cc.cliente_id = c.id AND cc.empresa_id = c.empresa_id AND cc.activo = TRUE
             LEFT JOIN direcciones_clientes d ON d.id = (
                 SELECT d2.id FROM direcciones_clientes d2
                 WHERE d2.cliente_id = c.id AND d2.empresa_id = c.empresa_id
                 ORDER BY d2.es_principal DESC, d2.fecha_ultima_entrega DESC LIMIT 1
             )
             WHERE c.empresa_id = ? AND c.activo = TRUE
               AND (c.nombre LIKE ? OR c.apellidos LIKE ? OR c.telefono LIKE ?)
             ORDER BY c.nombre ASC LIMIT 30`, [empresaId, like, like, like])
        connection.release()
        return { success: true, clientes }
    } catch (error) {
        if (connection) connection.release()
        console.error('buscarClientesDelivery:', error)
        return { success: false, clientes: [], mensaje: error.message }
    }
}

export async function asignarEntrega(pedidoId) {
    let connection
    try {
        const { empresaId, userId, userTipo } = await sesion()
        if (!['admin', 'vendedor'].includes(userTipo)) return { success: false, mensaje: 'Sin permisos para asignar delivery' }
        connection = await db.getConnection()
        await connection.beginTransaction()
        await connection.execute(`UPDATE pedidos_online SET delivery_id = ?, fecha_asignacion_delivery = NOW() WHERE id = ? AND empresa_id = ? AND estado = 'listo'`, [userId, pedidoId, empresaId])
        await connection.execute(`INSERT INTO entregas_delivery (empresa_id, pedido_id, delivery_id, estado) VALUES (?, ?, ?, 'asignada') ON DUPLICATE KEY UPDATE delivery_id = VALUES(delivery_id)`, [empresaId, pedidoId, userId])
        await connection.commit(); connection.release()
        return { success: true }
    } catch (error) {
        if (connection) { await connection.rollback(); connection.release() }
        return { success: false, mensaje: error.message }
    }
}

export async function tomarPedidoDelivery(pedidoId) {
    let connection
    try {
        const { empresaId, userId, userTipo } = await sesion()
        if (userTipo !== 'delivery') return { success: false, mensaje: 'Solo un usuario delivery puede tomar pedidos' }
        connection = await db.getConnection()
        const [pedido] = await connection.execute(`SELECT id FROM pedidos_online WHERE id = ? AND empresa_id = ? AND estado = 'listo'`, [pedidoId, empresaId])
        if (!pedido.length) return { success: false, mensaje: 'El pedido ya no esta disponible' }
        await connection.execute(`UPDATE pedidos_online SET delivery_id = ?, fecha_asignacion_delivery = COALESCE(fecha_asignacion_delivery, NOW()) WHERE id = ? AND empresa_id = ?`, [userId, pedidoId, empresaId])
        await connection.execute(`INSERT INTO entregas_delivery (empresa_id, pedido_id, delivery_id, estado) VALUES (?, ?, ?, 'asignada')`, [empresaId, pedidoId, userId])
        connection.release()
        return { success: true, mensaje: 'Pedido tomado correctamente' }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function registrarEntrega({ pedidoId, latitud, longitud, notas = '' }) {
    let connection
    try {
        const { empresaId, userId } = await sesion()
        if (!Number.isFinite(Number(latitud)) || !Number.isFinite(Number(longitud))) return { success: false, mensaje: 'La ubicación GPS no es válida' }
        connection = await db.getConnection()
        await connection.beginTransaction()
        const [pedidos] = await connection.execute(`SELECT cliente_id, cliente_direccion, referencia_entrega FROM pedidos_online WHERE id = ? AND empresa_id = ?`, [pedidoId, empresaId])
        if (!pedidos.length) throw new Error('Pedido no encontrado')
        const pedido = pedidos[0]
        let direccionId = null
        if (pedido.cliente_id) {
            const [dir] = await connection.execute(
                `INSERT INTO direcciones_clientes (empresa_id, cliente_id, alias, direccion, referencia, latitud, longitud, es_principal, fecha_ultima_entrega)
                 VALUES (?, ?, 'Última entrega', ?, ?, ?, ?, TRUE, NOW())`,
                [empresaId, pedido.cliente_id, pedido.cliente_direccion || 'Ubicación GPS', pedido.referencia_entrega || null, latitud, longitud])
            direccionId = dir.insertId
        }
        await connection.execute(`UPDATE pedidos_online SET latitud_entrega = ?, longitud_entrega = ?, estado = 'entregado' WHERE id = ? AND empresa_id = ?`, [latitud, longitud, pedidoId, empresaId])
        await connection.execute(`UPDATE entregas_delivery SET latitud_entrega = ?, longitud_entrega = ?, direccion_id = ?, notas = ?, estado = 'entregada', fecha_entrega = NOW() WHERE pedido_id = ? AND delivery_id = ? AND empresa_id = ?`, [latitud, longitud, direccionId, notas || null, pedidoId, userId, empresaId])
        await connection.commit(); connection.release()
        return { success: true, mensaje: 'Entrega registrada con ubicación GPS' }
    } catch (error) {
        if (connection) { await connection.rollback(); connection.release() }
        return { success: false, mensaje: error.message }
    }
}
