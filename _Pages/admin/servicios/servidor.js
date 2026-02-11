"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerServicios(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: '_Pages/admin/servicios/servidor.js:16',
            message: 'Starting servicios query',
            data: { empresaId, filtros },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'servicios-debug',
            hypothesisId: 'B',
          }),
        }).catch(() => {})
        // #endregion agent log
        
        let query = `
            SELECT s.*,
                   c.nombre AS cliente_nombre,
                   o.nombre AS obra_nombre,
                   o.codigo_obra,
                   sp.nombre AS plantilla_nombre
            FROM servicios s
            LEFT JOIN clientes c ON s.cliente_id = c.id
            LEFT JOIN obras o ON s.obra_id = o.id
            LEFT JOIN servicios_plantillas sp ON s.servicio_plantilla_id = sp.id
            WHERE s.empresa_id = ?
        `
        const params = [empresaId]
        
        if (filtros.estado) {
            query += ' AND s.estado = ?'
            params.push(filtros.estado)
        }
        
        if (filtros.tipo_servicio) {
            query += ' AND s.tipo_servicio = ?'
            params.push(filtros.tipo_servicio)
        }
        
        if (filtros.prioridad) {
            query += ' AND s.prioridad = ?'
            params.push(filtros.prioridad)
        }
        
        if (filtros.busqueda) {
            query += ' AND (s.nombre LIKE ? OR s.codigo_servicio LIKE ?)'
            const busqueda = `%${filtros.busqueda}%`
            params.push(busqueda, busqueda)
        }
        
        query += ' ORDER BY s.fecha_solicitud DESC'
        
        const [servicios] = await connection.query(query, params)
        connection.release()
        
        return { success: true, servicios }
    } catch (error) {
        console.error('Error al obtener servicios:', error)
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: '_Pages/admin/servicios/servidor.js:60',
            message: 'Servicios query error',
            data: {
              error: error.message,
              code: error.code,
              errno: error.errno,
              sqlState: error.sqlState,
              sql: error.sql?.substring(0, 200),
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'servicios-debug',
            hypothesisId: 'B',
          }),
        }).catch(() => {})
        // #endregion agent log
        
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar servicios' }
    }
}

export async function obtenerObrasParaServicio() {
    const { obtenerObras } = await import('../obras/servidor')
    return await obtenerObras({ estado: 'activa' })
}
