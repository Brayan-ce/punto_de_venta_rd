"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

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

async function validarAccesoAjustes() {
    const cookieStore = await cookies()
    const userTipo = cookieStore.get('userTipo')?.value

    if (!userTipo || !['admin', 'sucursales'].includes(userTipo)) {
        return { success: false, mensaje: 'No tienes permisos para esta seccion' }
    }

    return { success: true }
}

export async function obtenerAjustesSucursal() {
    let connection

    try {
        const acceso = await validarAccesoAjustes()
        if (!acceso.success) return acceso

        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const [[usuario]] = await connection.execute(
            `SELECT id, nombre, cedula, email, avatar_url, system_mode
             FROM usuarios
             WHERE id = ? AND empresa_id = ? AND activo = TRUE
             LIMIT 1`,
            [contexto.userId, contexto.empresaId]
        )

        const [[empresa]] = await connection.execute(
            `SELECT
                id,
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
                simbolo_moneda,
                     moneda
             FROM empresas
             WHERE id = ?
             LIMIT 1`,
            [contexto.empresaId]
        )

        const [resumen] = await connection.execute(
            `SELECT
                (SELECT COUNT(*) FROM sucursales WHERE empresa_id = ? AND activa = TRUE) AS total_sucursales,
                (SELECT COUNT(*) FROM usuarios_sucursales WHERE empresa_id = ? AND activo = TRUE) AS asignaciones,
                (SELECT COUNT(*) FROM transferencias_stock WHERE empresa_id = ? AND estado IN ('pendiente', 'en_transito')) AS transferencias_abiertas`,
            [contexto.empresaId, contexto.empresaId, contexto.empresaId]
        )

        connection.release()

        return {
            success: true,
            perfil: {
                nombre: usuario?.nombre || '',
                cedula: usuario?.cedula || '',
                email: usuario?.email || '',
                avatar_url: usuario?.avatar_url || '',
                system_mode: usuario?.system_mode || 'POS'
            },
            sistema: {
                nombre_empresa: empresa?.nombre_empresa || '',
                rnc: empresa?.rnc || '',
                razon_social: empresa?.razon_social || '',
                nombre_comercial: empresa?.nombre_comercial || '',
                actividad_economica: empresa?.actividad_economica || '',
                direccion: empresa?.direccion || '',
                sector: empresa?.sector || '',
                municipio: empresa?.municipio || '',
                provincia: empresa?.provincia || '',
                telefono: empresa?.telefono || '',
                email: empresa?.email || '',
                simbolo_moneda: empresa?.simbolo_moneda || 'RD$'
            },
            resumen: {
                totalSucursales: Number(resumen[0]?.total_sucursales || 0),
                asignaciones: Number(resumen[0]?.asignaciones || 0),
                transferenciasAbiertas: Number(resumen[0]?.transferencias_abiertas || 0)
            }
        }
    } catch (error) {
        console.error('Error en obtenerAjustesSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar ajustes de sucursales' }
    }
}

export async function actualizarPerfilAdminSucursal(payload = {}) {
    let connection

    try {
        const acceso = await validarAccesoAjustes()
        if (!acceso.success) return acceso

        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const nombre = String(payload.nombre || '').trim()
        const cedula = String(payload.cedula || '').trim()
        const email = String(payload.email || '').trim()
        const avatarUrl = String(payload.avatar_url || '').trim()
        const systemMode = payload.system_mode === 'OBRAS' ? 'OBRAS' : 'POS'

        if (!nombre || !cedula || !email) {
            return { success: false, mensaje: 'Nombre, cedula y email son requeridos' }
        }

        connection = await db.getConnection()

        const [emailExiste] = await connection.execute(
            `SELECT id
             FROM usuarios
             WHERE email = ? AND id <> ?
             LIMIT 1`,
            [email, contexto.userId]
        )

        if (emailExiste.length > 0) {
            connection.release()
            return { success: false, mensaje: 'El correo ya esta en uso por otro usuario' }
        }

        await connection.execute(
            `UPDATE usuarios
             SET nombre = ?, cedula = ?, email = ?, avatar_url = ?, system_mode = ?
             WHERE id = ? AND empresa_id = ?`,
            [nombre, cedula, email, avatarUrl || null, systemMode, contexto.userId, contexto.empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Perfil del administrador actualizado'
        }
    } catch (error) {
        console.error('Error en actualizarPerfilAdminSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo actualizar el perfil' }
    }
}

export async function actualizarSistemaSucursal(payload = {}) {
    let connection

    try {
        const acceso = await validarAccesoAjustes()
        if (!acceso.success) return acceso

        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const nombreEmpresa = String(payload.nombre_empresa || '').trim()
        const rnc = String(payload.rnc || '').trim()
        const razonSocial = String(payload.razon_social || '').trim()
        const nombreComercial = String(payload.nombre_comercial || '').trim()

        if (!nombreEmpresa || !rnc || !razonSocial || !nombreComercial) {
            return { success: false, mensaje: 'Completa los campos obligatorios de empresa' }
        }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE empresas SET
                nombre_empresa = ?,
                rnc = ?,
                razon_social = ?,
                nombre_comercial = ?,
                actividad_economica = ?,
                direccion = ?,
                sector = ?,
                municipio = ?,
                provincia = ?,
                telefono = ?,
                email = ?,
                simbolo_moneda = ?,
                moneda = moneda
             WHERE id = ?`,
            [
                nombreEmpresa,
                rnc,
                razonSocial,
                nombreComercial,
                String(payload.actividad_economica || '').trim() || null,
                String(payload.direccion || '').trim() || null,
                String(payload.sector || '').trim() || null,
                String(payload.municipio || '').trim() || null,
                String(payload.provincia || '').trim() || null,
                String(payload.telefono || '').trim() || null,
                String(payload.email || '').trim() || null,
                String(payload.simbolo_moneda || 'RD$').trim(),
                contexto.empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Configuracion del sistema actualizada'
        }
    } catch (error) {
        console.error('Error en actualizarSistemaSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo actualizar la configuracion del sistema' }
    }
}
