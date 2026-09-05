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

        const unidadesDefecto = [
            [empresaId, 'UN', 'Unidad', 'UN', 1],
            [empresaId, 'LB', 'LIBRA', 'LB', 1],
            [empresaId, 'KG', 'Kilogramo', 'kg', 1],
            [empresaId, 'GR', 'Gramo', 'gr', 1],
            [empresaId, 'MG', 'Miligramo', 'mg', 1],
            [empresaId, 'TON', 'Tonelada', 't', 1],
            [empresaId, 'LIBRA', 'Libra', 'libra', 1],
            [empresaId, 'OZ', 'Onza', 'oz', 1],
            [empresaId, 'ONZA', 'Onza', 'onza', 1],
            [empresaId, 'TON_US', 'Tonelada US', 'ton US', 1],
            [empresaId, 'QQ', 'Quintal', 'qq', 1],
            [empresaId, 'L', 'Litro', 'L', 1],
            [empresaId, 'LT', 'Litro', 'lt', 1],
            [empresaId, 'LITRO', 'Litro', 'litro', 1],
            [empresaId, 'ML', 'Mililitro', 'ml', 1],
            [empresaId, 'M3', 'Metro cúbico', 'm³', 1],
            [empresaId, 'PT', 'Pinta', 'pt', 1],
            [empresaId, 'FL_OZ', 'Onza fluida', 'fl oz', 1],
            [empresaId, 'M', 'Metro', 'm', 1],
            [empresaId, 'MT', 'Metro', 'mt', 1],
            [empresaId, 'METRO', 'Metro', 'metro', 1],
            [empresaId, 'MM', 'Milímetro', 'mm', 1],
            [empresaId, 'KM', 'Kilómetro', 'km', 1],
            [empresaId, 'FT', 'Pie', 'ft', 1],
            [empresaId, 'PIE', 'Pie', 'pie', 1],
            [empresaId, 'IN', 'Pulgada', 'in', 1],
            [empresaId, 'PULGADA', 'Pulgada', 'pulgada', 1],
            [empresaId, 'YD', 'Yarda', 'yd', 1],
            [empresaId, 'MI', 'Milla', 'mi', 1],
            [empresaId, 'M2', 'Metro cuadrado', 'm²', 1],
            [empresaId, 'KM2', 'Kilómetro cuadrado', 'km²', 1],
            [empresaId, 'HA', 'Hectárea', 'ha', 1],
            [empresaId, 'FT2', 'Pie cuadrado', 'ft²', 1],
            [empresaId, 'IN2', 'Pulgada cuadrada', 'in²', 1],
            [empresaId, 'TAREA', 'Tarea', 'tarea', 1],
            [empresaId, 'UND', 'Unidad', 'und', 1],
            [empresaId, 'UNIDAD', 'Unidad', 'unidad', 1],
            [empresaId, 'PZ', 'Pieza', 'pz', 1],
            [empresaId, 'PIEZA', 'Pieza', 'pieza', 1],
            [empresaId, 'MIL', 'Millar', 'millar', 1],
            [empresaId, 'PAR', 'Par', 'par', 1],
            [empresaId, 'SAC', 'Saco', 'saco', 1],
            [empresaId, 'PAQ', 'Paquete', 'paq', 1],
            [empresaId, 'FRA', 'Frasco', 'frasco', 1],
            [empresaId, 'LAT', 'Lata', 'lata', 1],
            [empresaId, 'TUB', 'Tubo', 'tubo', 1],
            [empresaId, 'ROL', 'Rollo', 'rollo', 1],
            [empresaId, 'H', 'Hora', 'h', 1],
            [empresaId, 'MIN', 'Minuto', 'min', 1],
            [empresaId, 'SEM', 'Semana', 'sem', 1],
            [empresaId, 'MES', 'Mes', 'mes', 1]
        ]

        for (const unidad of unidadesDefecto) {
            await connection.execute(
                `INSERT INTO unidades_medida (empresa_id, codigo, nombre, abreviatura, activo) VALUES (?, ?, ?, ?, ?)`,
                unidad
            )
        }

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