"use server"

/**
 * SERVER ACTIONS - DEPURACIÓN DE VENTAS
 * Módulo del Superadministrador
 */

import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function validarSuperadmin() {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const userTipo = cookieStore.get('userTipo')?.value

    if (!userId || userTipo !== 'superadmin') {
        return { success: false, mensaje: 'Acceso no autorizado' }
    }

    return { success: true, userId: parseInt(userId) }
}

/**
 * ACCIÓN: Obtener ventas anómalas (monto 0, sin items, etc.)
 */
export async function obtenerVentasAnomalas(empresaId = null) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        const query = `
      SELECT 
        v.id,
        v.empresa_id,
        e.nombre_empresa,
        v.ncf,
        v.numero_interno,
        v.total,
        v.fecha_venta,
        v.estado,
        u.nombre as usuario_nombre,
        CASE 
          WHEN v.total = 0 THEN 'Monto Cero'
          WHEN (SELECT COUNT(*) FROM detalle_ventas WHERE venta_id = v.id) = 0 THEN 'Sin Detalles'
          ELSE 'Otra Anomalía'
        END as tipo_anomalia
      FROM ventas v
      INNER JOIN empresas e ON v.empresa_id = e.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE (v.total = 0 OR NOT EXISTS (SELECT 1 FROM detalle_ventas WHERE venta_id = v.id))
      AND v.estado != 'cancelada'
      ${empresaId ? 'AND v.empresa_id = ?' : ''}
      ORDER BY v.fecha_venta DESC
    `

        const params = empresaId ? [empresaId] : []
        const [ventas] = await connection.execute(query, params)

        return {
            success: true,
            ventas: ventas
        }
    } catch (error) {
        console.error('Error al obtener ventas anómalas:', error)
        return {
            success: false,
            mensaje: 'Error al cargar ventas anómalas'
        }
    } finally {
        connection.release()
    }
}
