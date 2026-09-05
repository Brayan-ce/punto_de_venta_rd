"use server"

import { cookies } from 'next/headers'
import db from '@/_DB/db'

// ============================================
// CLIENTES DE LA EMPRESA - filtrado por empresa_id
// ============================================

export async function obtenerClientesCredito({ busqueda = '', pagina = 0, limite = 30 } = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, clientes: [], total: 0, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const offset = pagina * limite
        const like   = `%${busqueda}%`

        const whereExtra = busqueda
            ? `AND (c.nombre LIKE ? OR c.apellidos LIKE ? OR c.numero_documento LIKE ? OR c.telefono LIKE ?)`
            : ''
        const params = busqueda ? [empresaId, like, like, like, like] : [empresaId]

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(DISTINCT c.id) AS total FROM clientes c WHERE c.empresa_id = ? ${whereExtra}`,
            params
        )

        const [filas] = await connection.execute(
            `SELECT
                c.id,
                CONCAT(c.nombre, IFNULL(CONCAT(' ', c.apellidos), '')) AS nombre_completo,
                c.numero_documento,
                c.telefono,
                c.email,
                COUNT(DISTINCT fc.id)                                                    AS total_contratos,
                COUNT(DISTINCT CASE WHEN fc.estado = 'activo' THEN fc.id END)            AS contratos_activos,
                COUNT(DISTINCT CASE WHEN fc.estado = 'pagado' THEN fc.id END)            AS contratos_pagados,
                COUNT(DISTINCT CASE WHEN cu.estado = 'vencida' THEN cu.id END)           AS cuotas_vencidas,
                cc.clasificacion,
                cc.score_crediticio,
                cc.estado_credito,
                cc.limite_credito,
                cc.saldo_utilizado
            FROM clientes c
            LEFT JOIN fin_contratos    fc ON fc.cliente_id  = c.id AND fc.empresa_id = ?
            LEFT JOIN fin_cuotas       cu ON cu.contrato_id = fc.id
            LEFT JOIN credito_clientes cc ON cc.cliente_id  = c.id AND cc.empresa_id = ? AND cc.activo = TRUE
            WHERE c.empresa_id = ? ${whereExtra}
            GROUP BY c.id, c.nombre, c.apellidos, c.numero_documento, c.telefono, c.email,
                     cc.clasificacion, cc.score_crediticio, cc.estado_credito,
                     cc.limite_credito, cc.saldo_utilizado
            ORDER BY cuotas_vencidas DESC, c.nombre ASC
            LIMIT ? OFFSET ?`,
            [...(busqueda ? [empresaId, empresaId, empresaId, like, like, like, like] : [empresaId, empresaId, empresaId]), limite, offset]
        )

        connection.release()
        return { success: true, clientes: filas, total: parseInt(total) }
    } catch (error) {
        console.error('[obtenerClientesCredito]', error)
        if (connection) connection.release()
        return { success: false, clientes: [], total: 0 }
    }
}
