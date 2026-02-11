"use server"

import { cookies } from 'next/headers'
import db from '@/_DB/db'

// ============================================
// OBTENER ALERTAS DE CRÉDITO
// ============================================

export async function obtenerAlertas(filtros = {}) {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        let sql = `
            SELECT 
                a.id,
                a.tipo_alerta,
                a.severidad,
                a.titulo,
                a.mensaje,
                a.estado,
                a.fecha_generacion,
                CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) as cliente_nombre,
                c.numero_documento as cliente_documento
            FROM alertas_credito a
            LEFT JOIN clientes c ON c.id = a.cliente_id
            WHERE a.empresa_id = ?
        `

        const params = [empresaId]

        if (filtros.estado) {
            sql += ` AND a.estado = ?`
            params.push(filtros.estado)
        } else {
            sql += ` AND a.estado IN ('activa', 'vista')`
        }

        if (filtros.tipo) {
            sql += ` AND a.tipo_alerta = ?`
            params.push(filtros.tipo)
        }

        if (filtros.severidad) {
            sql += ` AND a.severidad = ?`
            params.push(filtros.severidad)
        }

        sql += ` ORDER BY 
            FIELD(a.severidad, 'critica', 'alta', 'media', 'baja'),
            a.fecha_generacion DESC
            LIMIT 100
        `

        const [alertas] = await connection.execute(sql, params)

        return {
            success: true,
            alertas
        }

    } catch (error) {
        console.error('[obtenerAlertas]', error)
        return { success: false, mensaje: 'Error al obtener alertas' }
    } finally {
        if (connection) connection.release()
    }
}

// ============================================
// ACTUALIZAR ESTADO DE ALERTA
// ============================================

export async function actualizarEstadoAlerta(alertaId, nuevoEstado, accion = '') {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const updateFields = ['estado = ?']
        const params = [nuevoEstado]

        if (nuevoEstado === 'vista') {
            updateFields.push('fecha_vista = NOW()')
        } else if (nuevoEstado === 'resuelta') {
            updateFields.push('fecha_resolucion = NOW()', 'resuelta_por = ?')
            params.push(userId)
        }

        if (accion) {
            updateFields.push('accion_tomada = ?')
            params.push(accion)
        }

        params.push(alertaId)

        await connection.execute(
            `UPDATE alertas_credito SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        )

        return {
            success: true,
            mensaje: 'Alerta actualizada correctamente'
        }

    } catch (error) {
        console.error('[actualizarEstadoAlerta]', error)
        return { success: false, mensaje: 'Error al actualizar alerta' }
    } finally {
        if (connection) connection.release()
    }
}
