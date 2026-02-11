"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerResumenDashboard() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // 1. Estadísticas Generales
        const [stats] = await connection.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'en_ejecucion' THEN 1 ELSE 0 END) as en_ejecucion,
                SUM(CASE WHEN estado = 'finalizado' THEN 1 ELSE 0 END) as finalizados,
                SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
                SUM(costo_estimado) as costo_total,
                SUM(presupuesto_asignado) as presupuesto_total
            FROM servicios 
            WHERE empresa_id = ?
        `, [empresaId])

        // 2. Servicios por Tipo
        const [porTipo] = await connection.query(`
            SELECT tipo_servicio, COUNT(*) as cantidad
            FROM servicios
            WHERE empresa_id = ?
            GROUP BY tipo_servicio
        `, [empresaId])

        // 3. Próximos Servicios (Agenda)
        const [proximos] = await connection.query(`
            SELECT s.*, c.nombre as cliente_nombre
            FROM servicios s
            LEFT JOIN clientes c ON s.cliente_id = c.id
            WHERE s.empresa_id = ? AND s.estado NOT IN ('finalizado', 'cancelado')
            AND s.fecha_programada >= CURDATE()
            ORDER BY s.fecha_programada ASC
            LIMIT 5
        `, [empresaId])

        // 4. Servicios Recientes
        const [recientes] = await connection.query(`
            SELECT s.*, c.nombre as cliente_nombre, u.nombre as responsable_nombre
            FROM servicios s
            LEFT JOIN clientes c ON s.cliente_id = c.id
            LEFT JOIN usuarios u ON s.usuario_responsable_id = u.id
            WHERE s.empresa_id = ?
            ORDER BY s.fecha_solicitud DESC
            LIMIT 10
        `, [empresaId])

        connection.release()

        return {
            success: true,
            resumen: {
                stats: stats[0],
                porTipo,
                proximos,
                recientes
            }
        }
    } catch (error) {
        if (connection) connection.release()
        console.error('Error dashboard servicios:', error)
        return { success: false, mensaje: 'Error al cargar datos del dashboard' }
    }
}
