"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtiene un plan por su ID
 * @param {number} id - ID del plan
 * @returns {Object} { success: boolean, plan?: Object, mensaje?: string }
 */
export async function obtenerPlanPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [planes] = await connection.execute(
            `SELECT p.*, 
                    u.nombre as creado_por_nombre,
                    u2.nombre as modificado_por_nombre
             FROM planes_financiamiento p
             LEFT JOIN usuarios u ON p.creado_por = u.id
             LEFT JOIN usuarios u2 ON p.modificado_por = u2.id
             WHERE p.id = ? AND (p.empresa_id = ? OR p.empresa_id IS NULL)`,
            [id, empresaId]
        )

        connection.release()

        if (planes.length === 0) {
            return { success: false, mensaje: 'Plan no encontrado' }
        }

        return { success: true, plan: planes[0] }

    } catch (error) {
        console.error('Error al obtener plan:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar plan' }
    }
}

