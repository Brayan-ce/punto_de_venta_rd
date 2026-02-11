"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { SEVERIDAD_ALERTA } from '../core/finance/estados.js'

/**
 * Obtiene la lista de alertas con filtros
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Object} { success: boolean, alertas: Array, mensaje?: string }
 */
export async function obtenerAlertas(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        let query = `
            SELECT a.*,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.telefono as cliente_telefono,
                   cl.numero_documento as cliente_documento,
                   cl.email as cliente_email,
                   co.numero_contrato,
                   co.saldo_pendiente as contrato_saldo_pendiente,
                   u.nombre as asignado_a_nombre,
                   u2.nombre as resuelta_por_nombre
            FROM alertas_financiamiento a
            LEFT JOIN clientes cl ON a.cliente_id = cl.id
            LEFT JOIN contratos_financiamiento co ON a.contrato_id = co.id
            LEFT JOIN usuarios u ON a.asignado_a = u.id
            LEFT JOIN usuarios u2 ON a.resuelta_por = u2.id
            WHERE a.empresa_id = ?
        `
        const params = [empresaId]

        // Filtro por estado
        if (filtros.estado) {
            query += ` AND a.estado = ?`
            params.push(filtros.estado)
        }

        // Filtro por severidad
        if (filtros.severidad) {
            query += ` AND a.severidad = ?`
            params.push(filtros.severidad)
        }

        // Filtro por tipo
        if (filtros.tipo_alerta) {
            query += ` AND a.tipo_alerta = ?`
            params.push(filtros.tipo_alerta)
        }

        // Filtro por cliente
        if (filtros.cliente_id) {
            query += ` AND a.cliente_id = ?`
            params.push(filtros.cliente_id)
        }

        // Filtro por contrato
        if (filtros.contrato_id) {
            query += ` AND a.contrato_id = ?`
            params.push(filtros.contrato_id)
        }

        // Filtro por asignado
        if (filtros.asignado_a) {
            query += ` AND a.asignado_a = ?`
            params.push(filtros.asignado_a)
        }

        // Búsqueda por texto
        if (filtros.buscar) {
            query += ` AND (a.titulo LIKE ? OR a.mensaje LIKE ? OR cl.nombre LIKE ? OR cl.numero_documento LIKE ? OR co.numero_contrato LIKE ?)`
            const busqueda = `%${filtros.buscar}%`
            params.push(busqueda, busqueda, busqueda, busqueda, busqueda)
        }

        // Ordenar por severidad y fecha
        query += ` ORDER BY 
            CASE a.severidad
                WHEN 'critica' THEN 1
                WHEN 'alta' THEN 2
                WHEN 'media' THEN 3
                WHEN 'baja' THEN 4
            END,
            a.fecha_creacion DESC`

        // Límite opcional
        if (filtros.limite) {
            query += ` LIMIT ?`
            params.push(filtros.limite)
        } else {
            query += ` LIMIT 100`
        }

        const [alertas] = await connection.execute(query, params)

        connection.release()

        return { success: true, alertas }

    } catch (error) {
        console.error('Error al obtener alertas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar alertas', alertas: [] }
    }
}

/**
 * Obtiene una alerta por su ID
 * @param {number} id - ID de la alerta
 * @returns {Object} { success: boolean, alerta?: Object, mensaje?: string }
 */
export async function obtenerAlertaPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [alertas] = await connection.execute(
            `SELECT a.*,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.telefono as cliente_telefono,
                   cl.numero_documento as cliente_documento,
                   cl.email as cliente_email,
                   co.numero_contrato,
                   co.saldo_pendiente as contrato_saldo_pendiente,
                   u.nombre as asignado_a_nombre,
                   u2.nombre as resuelta_por_nombre
            FROM alertas_financiamiento a
            LEFT JOIN clientes cl ON a.cliente_id = cl.id
            LEFT JOIN contratos_financiamiento co ON a.contrato_id = co.id
            LEFT JOIN usuarios u ON a.asignado_a = u.id
            LEFT JOIN usuarios u2 ON a.resuelta_por = u2.id
            WHERE a.id = ? AND a.empresa_id = ?`,
            [id, empresaId]
        )

        if (alertas.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Alerta no encontrada' }
        }

        connection.release()

        return {
            success: true,
            alerta: alertas[0]
        }

    } catch (error) {
        console.error('Error al obtener alerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar alerta' }
    }
}

/**
 * Crea una nueva alerta
 * @param {Object} datos - Datos de la alerta
 * @returns {Object} { success: boolean, alerta_id?: number, mensaje?: string }
 */
export async function crearAlerta(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validaciones básicas
        if (!datos.cliente_id) {
            return { success: false, mensaje: 'El cliente es requerido' }
        }

        if (!datos.tipo_alerta) {
            return { success: false, mensaje: 'El tipo de alerta es requerido' }
        }

        if (!datos.titulo || datos.titulo.trim().length === 0) {
            return { success: false, mensaje: 'El título es requerido' }
        }

        if (!datos.mensaje || datos.mensaje.trim().length === 0) {
            return { success: false, mensaje: 'El mensaje es requerido' }
        }

        connection = await db.getConnection()

        const [result] = await connection.execute(
            `INSERT INTO alertas_financiamiento (
                empresa_id, cliente_id, contrato_id, cuota_id,
                tipo_alerta, severidad, titulo, mensaje,
                datos_contexto, estado, asignado_a
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                datos.cliente_id,
                datos.contrato_id || null,
                datos.cuota_id || null,
                datos.tipo_alerta,
                datos.severidad || SEVERIDAD_ALERTA.MEDIA,
                datos.titulo,
                datos.mensaje,
                datos.datos_contexto ? JSON.stringify(datos.datos_contexto) : null,
                datos.estado || 'activa',
                datos.asignado_a || null
            ]
        )

        connection.release()

        return {
            success: true,
            alerta_id: result.insertId,
            mensaje: 'Alerta creada exitosamente'
        }

    } catch (error) {
        console.error('Error al crear alerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al crear alerta: ' + error.message }
    }
}

/**
 * Marca una alerta como resuelta
 * @param {number} id - ID de la alerta
 * @param {string} accionRealizada - Descripción de la acción realizada
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function marcarAlertaResuelta(id, accionRealizada) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Verificar que la alerta existe
        const [alertas] = await connection.execute(
            `SELECT id, estado FROM alertas_financiamiento 
             WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        if (alertas.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Alerta no encontrada' }
        }

        // Actualizar alerta
        await connection.execute(
            `UPDATE alertas_financiamiento
             SET estado = 'resuelta',
                 accion_realizada = ?,
                 resuelta_por = ?,
                 fecha_resolucion = NOW()
             WHERE id = ?`,
            [accionRealizada || null, userId, id]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Alerta marcada como resuelta'
        }

    } catch (error) {
        console.error('Error al marcar alerta como resuelta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar alerta: ' + error.message }
    }
}

/**
 * Marca una alerta como vista
 * @param {number} id - ID de la alerta
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function marcarAlertaVista(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE alertas_financiamiento
             SET estado = 'vista'
             WHERE id = ? AND empresa_id = ? AND estado = 'activa'`,
            [id, empresaId]
        )

        connection.release()

        return { success: true }

    } catch (error) {
        console.error('Error al marcar alerta como vista:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar alerta' }
    }
}

/**
 * Descarta una alerta
 * @param {number} id - ID de la alerta
 * @param {string} motivo - Motivo del descarte
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function descartarAlerta(id, motivo) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE alertas_financiamiento
             SET estado = 'descartada',
                 accion_realizada = ?,
                 resuelta_por = ?,
                 fecha_resolucion = NOW()
             WHERE id = ? AND empresa_id = ?`,
            [motivo || 'Alerta descartada', userId, id, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Alerta descartada'
        }

    } catch (error) {
        console.error('Error al descartar alerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al descartar alerta: ' + error.message }
    }
}

/**
 * Asigna una alerta a un usuario
 * @param {number} id - ID de la alerta
 * @param {number} usuarioId - ID del usuario asignado
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function asignarAlerta(id, usuarioId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE alertas_financiamiento
             SET asignado_a = ?,
                 fecha_asignacion = NOW()
             WHERE id = ? AND empresa_id = ?`,
            [usuarioId, id, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Alerta asignada exitosamente'
        }

    } catch (error) {
        console.error('Error al asignar alerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al asignar alerta: ' + error.message }
    }
}

/**
 * Obtiene estadísticas de alertas
 * @param {Object} filtros - Filtros opcionales
 * @returns {Object} { success: boolean, estadisticas?: Object, mensaje?: string }
 */
export async function obtenerEstadisticasAlertas(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        let whereClause = 'WHERE a.empresa_id = ?'
        const params = [empresaId]

        if (filtros.fecha_desde) {
            whereClause += ' AND a.fecha_creacion >= ?'
            params.push(filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
            whereClause += ' AND a.fecha_creacion <= ?'
            params.push(filtros.fecha_hasta)
        }

        // Estadísticas generales
        const [estadisticas] = await connection.execute(
            `SELECT 
                COUNT(*) as total_alertas,
                SUM(CASE WHEN a.estado = 'activa' THEN 1 ELSE 0 END) as alertas_activas,
                SUM(CASE WHEN a.estado = 'vista' THEN 1 ELSE 0 END) as alertas_vistas,
                SUM(CASE WHEN a.estado = 'resuelta' THEN 1 ELSE 0 END) as alertas_resueltas,
                SUM(CASE WHEN a.estado = 'descartada' THEN 1 ELSE 0 END) as alertas_descartadas,
                SUM(CASE WHEN a.severidad = 'critica' THEN 1 ELSE 0 END) as alertas_criticas,
                SUM(CASE WHEN a.severidad = 'alta' THEN 1 ELSE 0 END) as alertas_altas,
                SUM(CASE WHEN a.severidad = 'media' THEN 1 ELSE 0 END) as alertas_medias,
                SUM(CASE WHEN a.severidad = 'baja' THEN 1 ELSE 0 END) as alertas_bajas
             FROM alertas_financiamiento a
             ${whereClause}`,
            params
        )

        connection.release()

        return {
            success: true,
            estadisticas: estadisticas[0]
        }

    } catch (error) {
        console.error('Error al obtener estadísticas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar estadísticas' }
    }
}

