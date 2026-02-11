"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'

/**
 * Obtiene todas las cotizaciones con filtros
 */
export async function obtenerCotizaciones(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return {success: false, mensaje: 'Sesion invalida'}

        connection = await db.getConnection()

        let query = `
            SELECT c.*, cl.nombre as cliente_nombre, u.nombre as usuario_nombre
            FROM cotizaciones c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.empresa_id = ?
        `
        const params = [empresaId]

        // Filtrar cotizaciones eliminadas: usar estado != 'anulada' por defecto
        // Si existe la columna activa, se puede agregar ese filtro también
        query += " AND (c.estado != 'anulada' OR c.estado IS NULL)"

        if (filtros.estado && filtros.estado !== 'todos') {
            query += " AND c.estado = ?"
            params.push(filtros.estado)
        }

        if (filtros.buscar) {
            query += " AND (c.numero_cotizacion LIKE ? OR cl.nombre LIKE ?)"
            params.push(`%${filtros.buscar}%`, `%${filtros.buscar}%`)
        }

        query += " ORDER BY c.created_at DESC"

        const [rows] = await connection.execute(query, params)
        connection.release()

        return {success: true, cotizaciones: rows}

    } catch (error) {
        console.error('Error al obtener cotizaciones:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al cargar cotizaciones'}
    }
}

/**
 * Elimina una cotización (eliminación lógica)
 */
export async function eliminarCotizacion(cotizacionId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {success: false, mensaje: 'No tienes permisos para eliminar cotizaciones'}
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Verificar que la cotización existe y pertenece a la empresa
        const [cotizacion] = await connection.execute(
            `SELECT id, estado, numero_cotizacion
             FROM cotizaciones
             WHERE id = ? AND empresa_id = ? AND estado != 'anulada'`,
            [cotizacionId, empresaId]
        )

        if (cotizacion.length === 0) {
            await connection.rollback()
            connection.release()
            return {success: false, mensaje: 'Cotización no encontrada o ya eliminada'}
        }

        const cotizacionInfo = cotizacion[0]

        // Verificar si la cotización puede ser eliminada
        // No se puede eliminar si está convertida en venta
        if (cotizacionInfo.estado === 'convertida') {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar una cotización que ya fue convertida en venta'
            }
        }

        // Eliminación lógica: cambiar estado a 'anulada'
        // Si existe la columna activa, también se puede actualizar
        await connection.execute(
            `UPDATE cotizaciones
             SET estado = 'anulada'
             WHERE id = ? AND empresa_id = ?`,
            [cotizacionId, empresaId]
        )

        // Intentar actualizar columna activa si existe
        try {
            await connection.execute(
                `UPDATE cotizaciones
                 SET activa = FALSE
                 WHERE id = ? AND empresa_id = ?`,
                [cotizacionId, empresaId]
            )
        } catch (err) {
            // Si la columna activa no existe, ignorar el error
            if (err.code !== 'ER_BAD_FIELD_ERROR') {
                throw err
            }
        }

        // Registrar en historial
        try {
            const {registrarHistorial} = await import('@/_Pages/admin/cotizaciones/historial/servidor')
            await registrarHistorial(
                cotizacionId,
                'cancelada',
                'estado',
                cotizacionInfo.estado,
                'anulada',
                `Cotización eliminada por usuario ${userId}`
            )
        } catch (historialError) {
            // Si falla el historial, no es crítico, continuar con la eliminación
            console.warn('Error al registrar en historial:', historialError)
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Cotización eliminada exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar cotización:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return {success: false, mensaje: 'Error al eliminar la cotización'}
    }
}
