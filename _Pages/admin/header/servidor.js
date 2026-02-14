"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'

export async function obtenerDatosAdmin() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !userTipo) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo === 'superadmin') {
            return {
                success: false,
                mensaje: 'Los superadmins deben acceder desde /superadmin',
                redirectTo: '/superadmin'
            }
        }

        if (userTipo !== 'admin' && userTipo !== 'vendedor') {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (!empresaId) {
            return {
                success: false,
                mensaje: 'Empresa no asignada'
            }
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT id,
                    nombre,
                    email,
                    avatar_url,
                    tipo,
                    system_mode
             FROM usuarios
             WHERE id = ?
               AND empresa_id = ?
               AND activo = TRUE`,
            [userId, empresaId]
        )

        if (usuarios.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        const [empresas] = await connection.execute(
            `SELECT id,
                    nombre_empresa,
                    rnc,
                    logo_url
             FROM empresas
             WHERE id = ?
               AND activo = TRUE`,
            [empresaId]
        )

        const [plataforma] = await connection.execute(
            `SELECT logo_url
             FROM plataforma_config
             WHERE logo_url IS NOT NULL
               AND logo_url != '' LIMIT 1`
        )

        connection.release()

        const logoPlataformaSistema = plataforma.length > 0 && plataforma[0].logo_url ? plataforma[0].logo_url : null

        return {
            success: true,
            usuario: usuarios[0],
            empresa: empresas.length > 0 ? empresas[0] : null,
            logoPlataforma: logoPlataformaSistema,
            systemMode: usuarios[0].system_mode || 'POS'
        }

    } catch (error) {
        console.error('Error al obtener datos del admin:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos'
        }
    }
}

export async function cerrarSesion() {
    try {
        const cookieStore = await cookies()

        cookieStore.delete('userId')
        cookieStore.delete('empresaId')
        cookieStore.delete('userTipo')

        return {
            success: true,
            mensaje: 'Sesion cerrada exitosamente'
        }

    } catch (error) {
        console.error('Error al cerrar sesion:', error)

        return {
            success: false,
            mensaje: 'Error al cerrar sesion'
        }
    }
}