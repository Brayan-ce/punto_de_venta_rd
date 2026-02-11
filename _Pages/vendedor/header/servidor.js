"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerDatosUsuario() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'vendedor' && userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT 
                u.id,
                u.nombre,
                u.email,
                u.avatar_url,
                u.tipo,
                u.rol_id,
                r.nombre as rol_nombre
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE u.id = ? AND u.empresa_id = ? AND u.activo = TRUE`,
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
            `SELECT 
                id,
                nombre_empresa,
                rnc,
                logo_url
            FROM empresas
            WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )

        const [plataforma] = await connection.execute(
            `SELECT logo_url FROM plataforma_config WHERE logo_url IS NOT NULL AND logo_url != '' LIMIT 1`
        )

        let permisos = []

        if (usuarios[0].tipo === 'vendedor' && usuarios[0].rol_id) {
            const [permisosRol] = await connection.execute(
                `SELECT DISTINCT p.clave
                FROM roles_permisos rp
                INNER JOIN permisos p ON rp.permiso_id = p.id
                WHERE rp.rol_id = ? AND p.activo = TRUE`,
                [usuarios[0].rol_id]
            )

            permisos = permisosRol.map(p => p.clave)
        } else if (usuarios[0].tipo === 'admin') {
            const [todosPermisos] = await connection.execute(
                `SELECT clave FROM permisos WHERE activo = TRUE`
            )

            permisos = todosPermisos.map(p => p.clave)
        }

        connection.release()

        const logoPlataformaSistema = plataforma.length > 0 && plataforma[0].logo_url ? plataforma[0].logo_url : null

        return {
            success: true,
            usuario: usuarios[0],
            empresa: empresas.length > 0 ? empresas[0] : null,
            logoPlataforma: logoPlataformaSistema,
            permisos: permisos
        }

    } catch (error) {
        console.error('Error al obtener datos del usuario:', error)
        
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