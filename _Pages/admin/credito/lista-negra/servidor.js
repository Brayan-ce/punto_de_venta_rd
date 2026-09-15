"use server"

import { cookies } from 'next/headers'
import db from '@/_DB/db'

export async function obtenerListaNegra({ busqueda = '', pagina = 0, limite = 30 } = {}) {
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
             LEFT JOIN fin_contratos    fc ON fc.cliente_id  = c.id AND fc.empresa_id = ?
             LEFT JOIN fin_cuotas       cu ON cu.contrato_id = fc.id AND cu.estado = 'vencida'
             LEFT JOIN credito_clientes cc ON cc.cliente_id  = c.id AND cc.empresa_id = ? AND cc.activo = TRUE
             WHERE c.empresa_id = ?
             AND (
                 cu.id IS NOT NULL
                 OR cc.clasificacion IN ('C','D')
                 OR cc.estado_credito IN ('atrasado','bloqueado')
             ) ${busquedaWhere}`,
            [empresaId, empresaId, empresaId, ...bParams]
        )

        const [filas] = await connection.execute(
            `SELECT
                c.id,
                CONCAT(c.nombre, IFNULL(CONCAT(' ', c.apellidos), '')) AS nombre_completo,
                c.numero_documento,
                c.telefono,
                COUNT(DISTINCT fc.id)                                                  AS total_contratos,
                COUNT(DISTINCT cu.id)                                                  AS cuotas_vencidas,
                COALESCE(SUM(DISTINCT CASE WHEN fc.estado='activo' THEN fc.saldo_pendiente END), 0) AS saldo_en_riesgo,
                cc.clasificacion,
                cc.score_crediticio,
                cc.estado_credito,
                MIN(cu.fecha_vencimiento)                                              AS primera_vencida,
                DATEDIFF(CURDATE(), MIN(cu.fecha_vencimiento))                         AS dias_mora
            FROM clientes c
            LEFT JOIN fin_contratos    fc ON fc.cliente_id  = c.id AND fc.empresa_id = ?
            LEFT JOIN fin_cuotas       cu ON cu.contrato_id = fc.id AND cu.estado = 'vencida'
            LEFT JOIN credito_clientes cc ON cc.cliente_id  = c.id AND cc.empresa_id = ? AND cc.activo = TRUE
            WHERE c.empresa_id = ?
            AND (
                cu.id IS NOT NULL
                OR cc.clasificacion IN ('C','D')
                OR cc.estado_credito IN ('atrasado','bloqueado')
            ) ${busquedaWhere}
            GROUP BY c.id, c.nombre, c.apellidos, c.numero_documento, c.telefono,
                     cc.clasificacion, cc.score_crediticio, cc.estado_credito
            ORDER BY cuotas_vencidas DESC, dias_mora DESC
            LIMIT ? OFFSET ?`,
            [empresaId, empresaId, empresaId, ...bParams, limite, offset]
        )

        connection.release()
        return { success: true, clientes: filas, total: parseInt(total) }
    } catch (error) {
        console.error('[obtenerListaNegra]', error)
        if (connection) connection.release()
        return { success: false, clientes: [], total: 0 }
    }
}
