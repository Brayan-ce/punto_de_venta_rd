"use server"

import db from "@/_DB/db"
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'

export async function obtenerSolicitudes(filtro = 'pendiente') {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        let query = `SELECT * FROM solicitudes_registro`
        let params = []

        if (filtro !== 'todas') {
            query += ` WHERE estado = ?`
            params.push(filtro)
        }

        query += ` ORDER BY fecha_solicitud DESC`

        const [solicitudes] = await connection.execute(query, params)

        connection.release()

        return {
            success: true,
            solicitudes: solicitudes
        }

    } catch (error) {
        console.error('Error al obtener solicitudes:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar solicitudes'
        }
    }
}

export async function aprobarSolicitud(solicitudId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        await connection.beginTransaction()

        const [solicitudes] = await connection.execute(
            `SELECT * FROM solicitudes_registro WHERE id = ? AND estado = 'pendiente'`,
            [solicitudId]
        )

        if (solicitudes.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Solicitud no encontrada o ya procesada'
            }
        }

        const solicitud = solicitudes[0]

        const [empresaResult] = await connection.execute(
            `INSERT INTO empresas (
                nombre_empresa,
                rnc,
                razon_social,
                nombre_comercial,
                actividad_economica,
                direccion,
                sector,
                municipio,
                provincia,
                telefono,
                email,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
            [
                solicitud.nombre_empresa,
                solicitud.rnc,
                solicitud.razon_social,
                solicitud.nombre_empresa,
                'Comercio',
                'Por definir',
                'Por definir',
                'Por definir',
                'Por definir',
                solicitud.telefono,
                solicitud.email
            ]
        )

        const empresaId = empresaResult.insertId

        await connection.execute(
            `INSERT INTO usuarios (
                empresa_id,
                nombre,
                cedula,
                email,
                password,
                tipo,
                activo
            ) VALUES (?, ?, ?, ?, ?, 'admin', true)`,
            [
                empresaId,
                solicitud.nombre,
                solicitud.cedula,
                solicitud.email,
                solicitud.password
            ]
        )

        await connection.execute(
            `UPDATE solicitudes_registro 
            SET estado = 'aprobada', fecha_respuesta = NOW() 
            WHERE id = ?`,
            [solicitudId]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Solicitud aprobada exitosamente'
        }

    } catch (error) {
        console.error('Error al aprobar solicitud:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al aprobar solicitud'
        }
    }
}

export async function rechazarSolicitud(solicitudId, notas) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [solicitudes] = await connection.execute(
            `SELECT * FROM solicitudes_registro WHERE id = ? AND estado = 'pendiente'`,
            [solicitudId]
        )

        if (solicitudes.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Solicitud no encontrada o ya procesada'
            }
        }

        await connection.execute(
            `UPDATE solicitudes_registro 
            SET estado = 'rechazada', fecha_respuesta = NOW(), notas = ? 
            WHERE id = ?`,
            [notas, solicitudId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Solicitud rechazada exitosamente'
        }

    } catch (error) {
        console.error('Error al rechazar solicitud:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al rechazar solicitud'
        }
    }
}