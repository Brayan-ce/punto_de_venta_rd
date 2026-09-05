"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtener todas las plantillas de servicios activas para una empresa
 */
export async function obtenerPlantillasServicio() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        const [plantillas] = await connection.query(
            `SELECT sp.*,
                    COUNT(spr.id) AS cantidad_recursos
             FROM servicios_plantillas sp
             LEFT JOIN servicios_plantillas_recursos spr ON sp.id = spr.servicio_plantilla_id
             WHERE sp.empresa_id = ? AND sp.activa = 1
             GROUP BY sp.id
             ORDER BY sp.nombre`,
            [empresaId]
        )
        
        connection.release()
        
        return { success: true, plantillas }
    } catch (error) {
        console.error('Error al obtener plantillas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar plantillas' }
    }
}

/**
 * Eliminar (desactivar) plantilla de servicio
 */
export async function eliminarPlantillaServicio(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        // Desactivar en lugar de eliminar
        await connection.query(
            'UPDATE servicios_plantillas SET activa = 0 WHERE id = ? AND empresa_id = ?',
            [id, empresaId]
        )
        
        connection.release()
        
        return { success: true, mensaje: 'Plantilla desactivada exitosamente' }
    } catch (error) {
        console.error('Error al eliminar plantilla:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al eliminar plantilla' }
    }
}

