"use server"

import { cookies } from 'next/headers'
import db from '@/_DB/db'

export async function obtenerListaRecomendada({ busqueda = '', pagina = 0, limite = 30 } = {}) {
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

        const busquedaWhere = busqueda
            ? `AND (c.nombre LIKE ? OR c.apellidos LIKE ? OR c.numero_documento LIKE ?)`
            : ''
        const bParams = busqueda ? [like, like, like] : []

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(DISTINCT c.id) AS total
             FROM clientes c
             INNER JOIN fin_contratos   fc ON fc.cliente_id = c.id AND fc.empresa_id = ? AND fc.estado IN ('activo','pagado')
             LEFT JOIN credito_clientes cc ON cc.cliente_id = c.id AND cc.empresa_id = ? AND cc.activo = TRUE
             LEFT JOIN fin_cuotas       cu ON cu.contrato_id = fc.id AND cu.estado = 'vencida'
             WHERE c.empresa_id = ?
               AND cu.id IS NULL
               AND (cc.clasificacion IN ('A','B') OR cc.estado_credito = 'normal' OR cc.id IS NULL)
               ${busquedaWhere}`,
            [empresaId, empresaId, empresaId, ...bParams]
        )

        const [filas] = await connection.execute(
            `SELECT
                c.id,
                CONCAT(c.nombre, IFNULL(CONCAT(' ', c.apellidos), '')) AS nombre_completo,
                c.numero_documento,
                c.telefono,
                COUNT(DISTINCT fc.id)                                                          AS total_contratos,
                COUNT(DISTINCT CASE WHEN fc.estado = 'pagado' THEN fc.id END)                  AS contratos_pagados,
                COUNT(DISTINCT CASE WHEN fc.estado = 'activo' THEN fc.id END)                  AS contratos_activos,
                COALESCE(SUM(CASE WHEN fc.estado='pagado' THEN fc.monto_total END), 0)          AS monto_historico,
                cc.clasificacion,
                cc.score_crediticio,
                cc.limite_credito,
                cc.estado_credito
            FROM clientes c
            INNER JOIN fin_contratos   fc ON fc.cliente_id  = c.id AND fc.empresa_id = ? AND fc.estado IN ('activo','pagado')
            LEFT JOIN fin_cuotas       cu ON cu.contrato_id = fc.id AND cu.estado = 'vencida'
            LEFT JOIN credito_clientes cc ON cc.cliente_id  = c.id AND cc.empresa_id = ? AND cc.activo = TRUE
            WHERE c.empresa_id = ?
              AND cu.id IS NULL
              AND (cc.clasificacion IN ('A','B') OR cc.estado_credito = 'normal' OR cc.id IS NULL)
              ${busquedaWhere}
            GROUP BY c.id, c.nombre, c.apellidos, c.numero_documento, c.telefono,
                     cc.clasificacion, cc.score_crediticio, cc.limite_credito, cc.estado_credito
            ORDER BY cc.score_crediticio DESC, contratos_pagados DESC
            LIMIT ? OFFSET ?`,
            [empresaId, empresaId, empresaId, ...bParams, limite, offset]
        )

        connection.release()
        return { success: true, clientes: filas, total: parseInt(total) }
    } catch (error) {
        console.error('[obtenerListaRecomendada]', error)
        if (connection) connection.release()
        return { success: false, clientes: [], total: 0 }
    }
}
