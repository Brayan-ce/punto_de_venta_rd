'use server'

import { cookies } from 'next/headers'
import db from '@/_DB/db'

/**
 * Obtener el usuario actual con sus permisos
 * Incluye el campo permite_impresion para controlar acceso al botón de impresión
 */
export async function obtenerUsuarioActual() {
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'No hay sesión activa',
                usuario: null
            }
        }

        const connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT 
                u.id,
                u.nombre,
                u.email,
                u.tipo,
                u.permite_impresion,
                u.empresa_id,
                e.nombre_empresa
            FROM usuarios u
            INNER JOIN empresas e ON u.empresa_id = e.id
            WHERE u.id = ? AND u.activo = TRUE
            LIMIT 1`,
            [userId]
        )

        connection.release()

        if (rows.length === 0) {
            return {
                success: false,
                mensaje: 'Usuario no encontrado o inactivo',
                usuario: null
            }
        }

        const usuario = rows[0]

        return {
            success: true,
            mensaje: 'Usuario obtenido correctamente',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                tipo: usuario.tipo,
                permite_impresion: usuario.permite_impresion === 1 || usuario.permite_impresion === true,
                empresa_id: usuario.empresa_id,
                empresa_nombre: usuario.nombre_empresa
            }
        }

    } catch (error) {
        console.error('Error al obtener usuario actual:', error)
        return {
            success: false,
            mensaje: 'Error al obtener información del usuario',
            usuario: null
        }
    }
}

/**
 * Verificar si el usuario actual tiene permiso de impresión
 * Retorna true/false directamente
 */
export async function verificarPermisoFirma() {
    const resultado = await obtenerUsuarioActual()
    
    if (!resultado.success || !resultado.usuario) {
        return false
    }

    return resultado.usuario.permite_impresion === true
}
