"use server"

import db from '@/_DB/db'
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'
import { obtenerDatosSucursales } from '../../sedes/servidor'

async function obtenerContextoSesion() {
    const cookieStore = await cookies()
    const empresaId = cookieStore.get('empresaId')?.value

    if (!empresaId) return null
    return { empresaId: Number(empresaId) }
}

async function obtenerUsuarioPosPorSucursal(connection, empresaId, sucursalId) {
    const [rows] = await connection.execute(
        `SELECT
            u.id,
            u.nombre,
            u.email,
            u.cedula,
            s.id AS sucursal_id,
            s.nombre AS sucursal_nombre,
            s.codigo AS sucursal_codigo
         FROM usuarios_sucursales us
         INNER JOIN usuarios u ON u.id = us.usuario_id
         INNER JOIN sucursales s ON s.id = us.sucursal_id
         WHERE us.empresa_id = ?
           AND us.sucursal_id = ?
           AND us.rol_sucursal = 'admin'
           AND us.activo = TRUE
           AND u.system_mode = 'POS'
           AND u.activo = TRUE
           AND u.cedula LIKE 'SUC%'
         ORDER BY us.id ASC
         LIMIT 1`,
        [empresaId, sucursalId]
    )

    return rows[0] || null
}

export async function obtenerCredencialesEditable(id) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const sucursalId = Number(id)
        if (!sucursalId) return { success: false, mensaje: 'Sucursal invalida' }

        const datosSucursales = await obtenerDatosSucursales({})
        if (!datosSucursales.success) return datosSucursales

        const sucursal = (datosSucursales.sucursales || []).find((s) => Number(s.id) === sucursalId)
        if (!sucursal) return { success: false, mensaje: 'No tienes permiso para ver esta sucursal' }

        connection = await db.getConnection()
        const usuarioPos = await obtenerUsuarioPosPorSucursal(connection, contexto.empresaId, sucursalId)

        connection.release()

        return {
            success: true,
            sucursal,
            usuarioPos
        }
    } catch (error) {
        console.error('Error en obtenerCredencialesEditable:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo cargar las credenciales' }
    }
}

export async function actualizarCredencialesPos(payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const sucursalId = Number(payload.sucursalId)
        const email = String(payload.email || '').trim().toLowerCase()
        const password = String(payload.password || '')

        if (!sucursalId) return { success: false, mensaje: 'Sucursal invalida' }
        if (!email) return { success: false, mensaje: 'El email es obligatorio' }

        connection = await db.getConnection()

        const usuarioPos = await obtenerUsuarioPosPorSucursal(connection, contexto.empresaId, sucursalId)
        if (!usuarioPos?.id) {
            connection.release()
            return { success: false, mensaje: 'No se encontro usuario POS admin para esta sucursal' }
        }

        const [duplicado] = await connection.execute(
            `SELECT id
             FROM usuarios
             WHERE empresa_id = ?
               AND email = ?
               AND id <> ?
             LIMIT 1`,
            [contexto.empresaId, email, Number(usuarioPos.id)]
        )

        if (duplicado.length > 0) {
            connection.release()
            return { success: false, mensaje: 'Ese email ya esta en uso por otro usuario' }
        }

        if (password && password.length < 6) {
            connection.release()
            return { success: false, mensaje: 'La contrasena debe tener al menos 6 caracteres' }
        }

        if (password) {
            const hash = await bcrypt.hash(password, 10)
            await connection.execute(
                `UPDATE usuarios
                 SET email = ?, password = ?, fecha_actualizacion = CURRENT_TIMESTAMP
                 WHERE id = ? AND empresa_id = ?`,
                [email, hash, Number(usuarioPos.id), contexto.empresaId]
            )
        } else {
            await connection.execute(
                `UPDATE usuarios
                 SET email = ?, fecha_actualizacion = CURRENT_TIMESTAMP
                 WHERE id = ? AND empresa_id = ?`,
                [email, Number(usuarioPos.id), contexto.empresaId]
            )
        }

        connection.release()
        return {
            success: true,
            mensaje: 'Credenciales actualizadas correctamente',
            passwordTemporal: password || ''
        }
    } catch (error) {
        console.error('Error en actualizarCredencialesPos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo actualizar las credenciales' }
    }
}