"use server"

import { cookies } from 'next/headers'
import db from '@/_DB/db'

// ============================================
// OBTENER CLIENTES CON CRÉDITO
// ============================================

export async function obtenerClientesConCredito(filtros = {}) {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        let sql = `
            SELECT 
                cc.id as credito_id,
                c.id as cliente_id,
                CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) as nombre_completo,
                c.numero_documento,
                c.telefono,
                c.email,
                cc.limite_credito,
                cc.saldo_utilizado,
                cc.saldo_disponible,
                cc.clasificacion,
                cc.score_crediticio,
                cc.estado_credito,
                cc.frecuencia_pago,
                cc.fecha_proximo_vencimiento,
                cc.total_creditos_otorgados,
                cc.total_creditos_pagados,
                cc.total_creditos_vencidos,
                cc.promedio_dias_pago
            FROM credito_clientes cc
            INNER JOIN clientes c ON c.id = cc.cliente_id
            WHERE cc.empresa_id = ? AND cc.activo = TRUE
        `

        const params = [empresaId]

        // Aplicar filtros
        if (filtros.busqueda) {
            const like = `%${filtros.busqueda}%`
            sql += ` AND (c.nombre LIKE ? OR c.apellidos LIKE ? OR c.numero_documento LIKE ? OR c.telefono LIKE ?)`
            params.push(like, like, like, like)
        }

        if (filtros.clasificacion) {
            sql += ` AND cc.clasificacion = ?`
            params.push(filtros.clasificacion)
        }

        if (filtros.estado) {
            sql += ` AND cc.estado_credito = ?`
            params.push(filtros.estado)
        }

        sql += ` ORDER BY cc.clasificacion ASC, c.nombre ASC`

        const [clientes] = await connection.execute(sql, params)

        return {
            success: true,
            clientes
        }

    } catch (error) {
        console.error('[obtenerClientesConCredito]', error)
        return { success: false, mensaje: 'Error al obtener clientes' }
    } finally {
        if (connection) connection.release()
    }
}
