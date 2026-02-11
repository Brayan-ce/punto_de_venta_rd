"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { obtenerObras } from '../obras/servidor'
import { obtenerPersonalEnCampo } from '../personal/servidor'
import { obtenerAlertasPresupuesto } from '../presupuesto/servidor'
import { obtenerServicios } from '../servicios/servidor'

export async function obtenerDashboardConstructora() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Cargar estadísticas críticas primero (para FCP)
        connection = await db.getConnection()
        const fechaHoy = new Date().toISOString().split('T')[0]
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: '_Pages/admin/constructora/servidor.js:25',
            message: 'Starting dashboard queries',
            data: { empresaId },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'dashboard-debug',
            hypothesisId: 'A',
          }),
        }).catch(() => {})
        // #endregion agent log

        // Estadísticas críticas en paralelo (más rápido)
        const [totalObras, totalPersonal, totalServicios, totalAlertas] = await Promise.all([
            connection.query(
                'SELECT COUNT(*) as total FROM obras WHERE empresa_id = ? AND estado = "activa"',
                [empresaId]
            ),
            connection.query(
                `SELECT COUNT(DISTINCT trabajador_id) as total 
                 FROM asignaciones_trabajadores 
                 WHERE empresa_id = ? 
                   AND fecha_asignacion = ? 
                   AND estado = 'activo'`,
                [empresaId, fechaHoy]
            ),
            connection.query(
                `SELECT COUNT(*) as total 
                 FROM servicios 
                 WHERE empresa_id = ? 
                   AND estado IN ('pendiente', 'programado', 'en_ejecucion')`,
                [empresaId]
            ),
            connection.query(
                `SELECT COUNT(*) as total 
                 FROM presupuesto_alertas 
                 WHERE empresa_id = ? 
                   AND estado = 'activa'`,
                [empresaId]
            )
        ])
        
        connection.release()

        // Datos secundarios (para interacción) - cargar después de estadísticas
        const [resObras, resPersonal, resAlertas, resServicios] = await Promise.all([
            obtenerObras({ estado: 'activa' }),
            obtenerPersonalEnCampo(),
            obtenerAlertasPresupuesto({ estado: 'activa' }),
            obtenerServicios({ estado: 'en_ejecucion' })
        ])

        // Calcular datos secundarios
        const obrasActivas = resObras.success ? resObras.obras : []
        const personalActivo = resPersonal.success ? resPersonal.personal : []
        const alertasActivas = resAlertas.success ? resAlertas.alertas : []
        const serviciosHoy = resServicios.success ? resServicios.servicios : []
        
        return {
            success: true,
            dashboard: {
                estadisticas: {
                    obras_activas: totalObras[0].total || 0,
                    personal_campo: totalPersonal[0].total || 0,
                    servicios_pendientes: totalServicios[0].total || 0,
                    alertas_activas: totalAlertas[0].total || 0
                },
                obras_activas: obrasActivas.slice(0, 5), // Top 5
                personal_campo: personalActivo.slice(0, 5), // Top 5
                alertas_presupuesto: alertasActivas.slice(0, 5), // Top 5
                servicios_hoy: serviciosHoy.slice(0, 5) // Top 5
            }
        }
    } catch (error) {
        console.error('Error al obtener dashboard:', error)
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: '_Pages/admin/constructora/servidor.js:86',
            message: 'Dashboard query error',
            data: {
              error: error.message,
              code: error.code,
              errno: error.errno,
              sqlState: error.sqlState,
              sql: error.sql?.substring(0, 200),
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'dashboard-debug',
            hypothesisId: 'A',
          }),
        }).catch(() => {})
        // #endregion agent log
        
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar dashboard' }
    }
}

