"use server"

/**
 * SERVER ACTIONS - CONSULTA DE AUDITORÍA
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
 * ACCIÓN: Obtener registros de auditoría filtrados
 */
export async function obtenerRegistrosAuditoria(filtros = {}) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        let query = `
      SELECT 
        a.*,
        u.nombre as usuario_nombre
      FROM auditoria_sistema a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
    `

        const params = []
        const condiciones = []

        if (filtros.modulo && filtros.modulo !== 'todos') {
            condiciones.push('a.modulo = ?')
            params.push(filtros.modulo)
        }

        if (filtros.accion && filtros.accion !== 'todas') {
            condiciones.push('a.tipo_accion = ?')
            params.push(filtros.accion)
        }

        if (filtros.empresaId) {
            condiciones.push('a.empresa_id = ?')
            params.push(filtros.empresaId)
        }

        if (filtros.usuarioId) {
            condiciones.push('a.usuario_id = ?')
            params.push(filtros.usuarioId)
        }

        if (filtros.fechaDesde) {
            condiciones.push('DATE(a.fecha_accion) >= ?')
            params.push(filtros.fechaDesde)
        }

        if (filtros.fechaHasta) {
            condiciones.push('DATE(a.fecha_accion) <= ?')
            params.push(filtros.fechaHasta)
        }

        if (condiciones.length > 0) {
            query += ` WHERE ` + condiciones.join(' AND ')
        }

        query += ` ORDER BY a.fecha_accion DESC LIMIT 100`

        const [registros] = await connection.execute(query, params)

        return {
            success: true,
            registros: registros
        }
    } catch (error) {
        console.error('Error al obtener auditoría:', error)
        return {
            success: false,
            mensaje: 'Error al cargar registros de auditoría'
        }
    } finally {
        connection.release()
    }
}
