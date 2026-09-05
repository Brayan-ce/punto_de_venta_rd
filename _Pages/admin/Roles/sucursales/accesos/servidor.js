"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

const ROLES_VALIDOS = ['admin', 'encargado', 'cajero', 'consulta']

async function obtenerContextoSesion() {
    const cookieStore = await cookies()
    const empresaId = cookieStore.get('empresaId')?.value
    const userId = cookieStore.get('userId')?.value

    if (!empresaId || !userId) return null

    return {
        empresaId: Number(empresaId),
        userId: Number(userId)
    }
}

async function validarPermisoSucursal(connection, empresaId, userId, sucursalId) {
    const [rows] = await connection.execute(
        `SELECT rol_sucursal
         FROM usuarios_sucursales
         WHERE empresa_id = ? AND usuario_id = ? AND sucursal_id = ? AND activo = TRUE
         LIMIT 1`,
        [empresaId, userId, sucursalId]
    )

    if (!rows.length) return false

    const rol = rows[0].rol_sucursal
    return rol === 'admin' || rol === 'encargado'
}

export async function obtenerDatosAccesos(filtros = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        let sucursalesAsignadas = []
        try {
            const [asignaciones] = await connection.execute(
                `SELECT DISTINCT sucursal_id
                 FROM usuarios_sucursales
                 WHERE empresa_id = ? AND usuario_id = ? AND activo = TRUE`,
                [contexto.empresaId, contexto.userId]
            )
            sucursalesAsignadas = asignaciones.map((a) => Number(a.sucursal_id))
        } catch (error) {
            console.warn('usuarios_sucursales no disponible en accesos')
        }

        let querySucursales = `
            SELECT id, nombre
            FROM sucursales
            WHERE empresa_id = ? AND activa = TRUE
        `
        const paramsSucursales = [contexto.empresaId]

        if (sucursalesAsignadas.length > 0) {
            const placeholders = sucursalesAsignadas.map(() => '?').join(',')
            querySucursales += ` AND id IN (${placeholders})`
            paramsSucursales.push(...sucursalesAsignadas)
        }

        querySucursales += ' ORDER BY nombre ASC'
        const [sucursales] = await connection.execute(querySucursales, paramsSucursales)

        const [usuarios] = await connection.execute(
            `SELECT id, nombre, email, tipo, activo
             FROM usuarios
             WHERE empresa_id = ? AND activo = TRUE
             ORDER BY nombre ASC
             LIMIT 500`,
            [contexto.empresaId]
        )

        let queryAccesos = `
            SELECT
                us.id,
                us.usuario_id,
                us.sucursal_id,
                us.rol_sucursal,
                us.activo,
                us.fecha_actualizacion,
                u.nombre AS usuario_nombre,
                u.email AS usuario_email,
                s.nombre AS sucursal_nombre
            FROM usuarios_sucursales us
            INNER JOIN usuarios u ON u.id = us.usuario_id
            INNER JOIN sucursales s ON s.id = us.sucursal_id
            WHERE us.empresa_id = ?
        `
        const paramsAccesos = [contexto.empresaId]

        if (sucursalesAsignadas.length > 0) {
            const placeholders = sucursalesAsignadas.map(() => '?').join(',')
            queryAccesos += ` AND us.sucursal_id IN (${placeholders})`
            paramsAccesos.push(...sucursalesAsignadas)
        }

        if (filtros.sucursalId) {
            queryAccesos += ' AND us.sucursal_id = ?'
            paramsAccesos.push(Number(filtros.sucursalId))
        }

        if (typeof filtros.activo === 'boolean') {
            queryAccesos += ' AND us.activo = ?'
            paramsAccesos.push(filtros.activo)
        }

        if (filtros.buscar) {
            queryAccesos += ' AND (u.nombre LIKE ? OR u.email LIKE ? OR s.nombre LIKE ?)'
            const like = `%${filtros.buscar}%`
            paramsAccesos.push(like, like, like)
        }

        queryAccesos += ' ORDER BY us.fecha_actualizacion DESC LIMIT 500'
        const [accesos] = await connection.execute(queryAccesos, paramsAccesos)

        connection.release()

        return {
            success: true,
            sucursales,
            usuarios,
            accesos
        }
    } catch (error) {
        console.error('Error en obtenerDatosAccesos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar accesos' }
    }
}

export async function obtenerAccesoPorId(accesoId) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const accesoIdNum = Number(accesoId)
        if (!accesoIdNum) return { success: false, mensaje: 'Acceso invalido' }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT
                us.id,
                us.usuario_id,
                us.sucursal_id,
                us.rol_sucursal,
                us.activo,
                us.fecha_creacion,
                us.fecha_actualizacion,
                u.nombre AS usuario_nombre,
                u.email AS usuario_email,
                s.nombre AS sucursal_nombre
             FROM usuarios_sucursales us
             INNER JOIN usuarios u ON u.id = us.usuario_id
             INNER JOIN sucursales s ON s.id = us.sucursal_id
             WHERE us.id = ? AND us.empresa_id = ?
             LIMIT 1`,
            [accesoIdNum, contexto.empresaId]
        )

        if (!rows.length) {
            connection.release()
            return { success: false, mensaje: 'Acceso no encontrado' }
        }

        const acceso = rows[0]
        const permitido = await validarPermisoSucursal(connection, contexto.empresaId, contexto.userId, Number(acceso.sucursal_id))
        if (!permitido) {
            connection.release()
            return { success: false, mensaje: 'No tienes permiso para ver este acceso' }
        }

        connection.release()
        return { success: true, acceso }
    } catch (error) {
        console.error('Error en obtenerAccesoPorId:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo cargar el acceso' }
    }
}

export async function guardarAccesoSucursal(payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const usuarioId = Number(payload.usuarioId)
        const sucursalId = Number(payload.sucursalId)
        const rolSucursal = String(payload.rolSucursal || 'consulta')
        const activo = payload.activo !== false

        if (!usuarioId || !sucursalId || !ROLES_VALIDOS.includes(rolSucursal)) {
            return { success: false, mensaje: 'Datos invalidos del acceso' }
        }

        connection = await db.getConnection()

        const permitido = await validarPermisoSucursal(connection, contexto.empresaId, contexto.userId, sucursalId)
        if (!permitido) {
            connection.release()
            return { success: false, mensaje: 'No tienes permiso para gestionar esa sucursal' }
        }

        await connection.execute(
            `INSERT INTO usuarios_sucursales (empresa_id, usuario_id, sucursal_id, rol_sucursal, activo)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                rol_sucursal = VALUES(rol_sucursal),
                activo = VALUES(activo),
                fecha_actualizacion = CURRENT_TIMESTAMP`,
            [contexto.empresaId, usuarioId, sucursalId, rolSucursal, activo]
        )

        connection.release()
        return { success: true, mensaje: 'Acceso guardado correctamente' }
    } catch (error) {
        console.error('Error en guardarAccesoSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo guardar el acceso' }
    }
}

export async function actualizarRolAcceso(payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const accesoId = Number(payload.accesoId)
        const rolSucursal = String(payload.rolSucursal || '')

        if (!accesoId || !ROLES_VALIDOS.includes(rolSucursal)) {
            return { success: false, mensaje: 'Datos invalidos para actualizar rol' }
        }

        connection = await db.getConnection()

        const [accesoRows] = await connection.execute(
            `SELECT sucursal_id
             FROM usuarios_sucursales
             WHERE id = ? AND empresa_id = ?
             LIMIT 1`,
            [accesoId, contexto.empresaId]
        )

        if (!accesoRows.length) {
            connection.release()
            return { success: false, mensaje: 'Acceso no encontrado' }
        }

        const sucursalId = Number(accesoRows[0].sucursal_id)
        const permitido = await validarPermisoSucursal(connection, contexto.empresaId, contexto.userId, sucursalId)
        if (!permitido) {
            connection.release()
            return { success: false, mensaje: 'No tienes permiso para editar este acceso' }
        }

        await connection.execute(
            `UPDATE usuarios_sucursales
             SET rol_sucursal = ?, fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = ? AND empresa_id = ?`,
            [rolSucursal, accesoId, contexto.empresaId]
        )

        connection.release()
        return { success: true, mensaje: 'Rol actualizado' }
    } catch (error) {
        console.error('Error en actualizarRolAcceso:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo actualizar el rol' }
    }
}

export async function cambiarEstadoAcceso(payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const accesoId = Number(payload.accesoId)
        const activo = Boolean(payload.activo)

        if (!accesoId) return { success: false, mensaje: 'Acceso invalido' }

        connection = await db.getConnection()

        const [accesoRows] = await connection.execute(
            `SELECT sucursal_id
             FROM usuarios_sucursales
             WHERE id = ? AND empresa_id = ?
             LIMIT 1`,
            [accesoId, contexto.empresaId]
        )

        if (!accesoRows.length) {
            connection.release()
            return { success: false, mensaje: 'Acceso no encontrado' }
        }

        const sucursalId = Number(accesoRows[0].sucursal_id)
        const permitido = await validarPermisoSucursal(connection, contexto.empresaId, contexto.userId, sucursalId)
        if (!permitido) {
            connection.release()
            return { success: false, mensaje: 'No tienes permiso para cambiar este acceso' }
        }

        await connection.execute(
            `UPDATE usuarios_sucursales
             SET activo = ?, fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = ? AND empresa_id = ?`,
            [activo, accesoId, contexto.empresaId]
        )

        connection.release()
        return { success: true, mensaje: activo ? 'Acceso activado' : 'Acceso desactivado' }
    } catch (error) {
        console.error('Error en cambiarEstadoAcceso:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo cambiar el estado' }
    }
}

export async function eliminarAcceso(payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const accesoId = Number(payload.accesoId)
        if (!accesoId) return { success: false, mensaje: 'Acceso invalido' }

        connection = await db.getConnection()

        const [accesoRows] = await connection.execute(
            `SELECT sucursal_id
             FROM usuarios_sucursales
             WHERE id = ? AND empresa_id = ?
             LIMIT 1`,
            [accesoId, contexto.empresaId]
        )

        if (!accesoRows.length) {
            connection.release()
            return { success: false, mensaje: 'Acceso no encontrado' }
        }

        const sucursalId = Number(accesoRows[0].sucursal_id)
        const permitido = await validarPermisoSucursal(connection, contexto.empresaId, contexto.userId, sucursalId)
        if (!permitido) {
            connection.release()
            return { success: false, mensaje: 'No tienes permiso para eliminar este acceso' }
        }

        await connection.execute(
            `DELETE FROM usuarios_sucursales
             WHERE id = ? AND empresa_id = ?`,
            [accesoId, contexto.empresaId]
        )

        connection.release()
        return { success: true, mensaje: 'Acceso eliminado' }
    } catch (error) {
        console.error('Error en eliminarAcceso:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo eliminar el acceso' }
    }
}
