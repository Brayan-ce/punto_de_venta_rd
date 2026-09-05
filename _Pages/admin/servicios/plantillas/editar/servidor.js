"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtener una plantilla específica con sus recursos
 */
export async function obtenerPlantillaServicio(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        // Obtener plantilla
        const [plantillas] = await connection.query(
            'SELECT * FROM servicios_plantillas WHERE id = ? AND empresa_id = ? AND activa = 1',
            [id, empresaId]
        )
        
        if (plantillas.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Plantilla no encontrada' }
        }
        
        const plantilla = plantillas[0]
        
        // Obtener recursos de la plantilla
        const [recursos] = await connection.query(
            `SELECT * FROM servicios_plantillas_recursos 
             WHERE servicio_plantilla_id = ? 
             ORDER BY orden, nombre`,
            [id]
        )
        
        plantilla.recursos = recursos
        
        connection.release()
        
        return { success: true, plantilla }
    } catch (error) {
        console.error('Error al obtener plantilla:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar plantilla' }
    }
}

/**
 * Actualizar plantilla de servicio
 */
export async function actualizarPlantillaServicio(id, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        await connection.query(
            `UPDATE servicios_plantillas SET
                nombre = ?,
                descripcion = ?,
                tipo_servicio = ?,
                duracion_estimada_dias = ?,
                costo_base_estimado = ?,
                activa = ?
             WHERE id = ? AND empresa_id = ?`,
            [
                datos.nombre,
                datos.descripcion || null,
                datos.tipo_servicio,
                datos.duracion_estimada_dias || 1,
                datos.costo_base_estimado || 0,
                datos.activa !== undefined ? datos.activa : 1,
                id,
                empresaId
            ]
        )
        
        connection.release()
        
        return { success: true, mensaje: 'Plantilla actualizada exitosamente' }
    } catch (error) {
        console.error('Error al actualizar plantilla:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar plantilla' }
    }
}

