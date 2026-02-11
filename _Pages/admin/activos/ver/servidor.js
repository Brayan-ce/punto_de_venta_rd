"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtiene un activo por su ID
 * @param {number} id - ID del activo
 * @returns {Object} { success: boolean, activo?: Object, mensaje?: string }
 */
export async function obtenerActivoPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [activos] = await connection.execute(
            `SELECT a.*,
                   p.nombre as producto_nombre,
                   p.sku as producto_sku,
                   p.tipo_activo,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   cl.email as cliente_email,
                   c.numero_contrato,
                   c.saldo_pendiente as contrato_saldo_pendiente,
                   u.nombre as creado_por_nombre,
                   u2.nombre as modificado_por_nombre
            FROM activos_productos a
            LEFT JOIN productos p ON a.producto_id = p.id
            LEFT JOIN clientes cl ON a.cliente_id = cl.id
            LEFT JOIN contratos_financiamiento c ON a.contrato_financiamiento_id = c.id
            LEFT JOIN usuarios u ON a.creado_por = u.id
            LEFT JOIN usuarios u2 ON a.modificado_por = u2.id
            WHERE a.id = ? AND a.empresa_id = ?`,
            [id, empresaId]
        )

        if (activos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Activo no encontrado' }
        }

        const activo = activos[0]

        // Parsear JSON si existe
        if (activo.especificaciones_tecnicas) {
            try {
                activo.especificaciones_tecnicas = typeof activo.especificaciones_tecnicas === 'string' 
                    ? JSON.parse(activo.especificaciones_tecnicas)
                    : activo.especificaciones_tecnicas
            } catch (e) {
                activo.especificaciones_tecnicas = {}
            }
        }

        if (activo.documentos_json) {
            try {
                activo.documentos_json = typeof activo.documentos_json === 'string'
                    ? JSON.parse(activo.documentos_json)
                    : activo.documentos_json
            } catch (e) {
                activo.documentos_json = []
            }
        }

        connection.release()

        return {
            success: true,
            activo
        }

    } catch (error) {
        console.error('Error al obtener activo:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar activo' }
    }
}

