"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerServicioPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        // Obtener servicio con datos relacionados
        const [servicios] = await connection.query(
            `SELECT s.*,
                    c.nombre AS cliente_nombre,
                    o.nombre AS obra_nombre,
                    o.codigo_obra,
                    u.nombre AS responsable_nombre,
                    sp.nombre AS plantilla_nombre,
                    sp.codigo_plantilla
             FROM servicios s
             LEFT JOIN clientes c ON s.cliente_id = c.id
             LEFT JOIN obras o ON s.obra_id = o.id
             LEFT JOIN usuarios u ON s.usuario_responsable_id = u.id
             LEFT JOIN servicios_plantillas sp ON s.servicio_plantilla_id = sp.id
             WHERE s.id = ? AND s.empresa_id = ?`,
            [id, empresaId]
        )
        
        if (servicios.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Servicio no encontrado' }
        }
        
        const servicio = servicios[0]
        
        // Obtener recursos del servicio
        const [recursos] = await connection.query(
            `SELECT * FROM servicios_recursos 
             WHERE servicio_id = ? 
             ORDER BY tipo_recurso, nombre`,
            [id]
        )
        servicio.recursos = recursos || []
        
        // Obtener eventos recientes (últimos 20)
        const [eventos] = await connection.query(
            `SELECT se.*, u.nombre AS usuario_nombre
             FROM servicios_eventos se
             LEFT JOIN usuarios u ON se.usuario_id = u.id
             WHERE se.servicio_id = ?
             ORDER BY se.fecha_evento DESC
             LIMIT 20`,
            [id]
        )
        servicio.eventos = eventos || []
        
        connection.release()
        
        return { success: true, servicio }
    } catch (error) {
        console.error('Error al obtener servicio:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar servicio' }
    }
}

