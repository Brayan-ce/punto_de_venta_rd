"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'

/**
 * Registra una acción en el historial de cotización
 */
export async function registrarHistorial(
    cotizacionId,
    accion,
    campoModificado = null,
    valorAnterior = null,
    valorNuevo = null,
    comentario = null
) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {success: false, mensaje: 'Sesión inválida'}
        }

        connection = await db.getConnection()

        await connection.execute(
            `INSERT INTO cotizacion_historial
             (cotizacion_id, usuario_id, accion, campo_modificado,
              valor_anterior, valor_nuevo, comentario)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [cotizacionId, userId, accion, campoModificado,
                valorAnterior, valorNuevo, comentario]
        )

        connection.release()
        return {success: true}

    } catch (error) {
        console.error('Error al registrar historial:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al registrar en historial'}
    }
}

/**
 * Obtiene el historial completo de una cotización
 */
export async function obtenerHistorial(cotizacionId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesión inválida'}

        connection = await db.getConnection()

        const [historial] = await connection.execute(
            `SELECT h.*,
                    u.nombre as usuario_nombre,
                    u.email  as usuario_email
             FROM cotizacion_historial h
                      LEFT JOIN usuarios u ON h.usuario_id = u.id
             WHERE h.cotizacion_id = ?
             ORDER BY h.fecha_accion DESC`,
            [cotizacionId]
        )

        connection.release()
        return {success: true, historial}

    } catch (error) {
        console.error('Error al obtener historial:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al cargar historial'}
    }
}

/**
 * Obtiene el historial de cambios de un campo específico
 */
export async function obtenerHistorialCampo(cotizacionId, campo) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesión inválida'}

        connection = await db.getConnection()

        const [historial] = await connection.execute(
            `SELECT h.*,
                    u.nombre as usuario_nombre
             FROM cotizacion_historial h
                      LEFT JOIN usuarios u ON h.usuario_id = u.id
             WHERE h.cotizacion_id = ?
               AND h.campo_modificado = ?
             ORDER BY h.fecha_accion DESC`,
            [cotizacionId, campo]
        )

        connection.release()
        return {success: true, historial}

    } catch (error) {
        console.error('Error al obtener historial de campo:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al cargar historial'}
    }
}

