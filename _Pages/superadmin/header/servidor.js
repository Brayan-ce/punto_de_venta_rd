"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerDatosSuperAdmin() {
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

        const [usuarioRows] = await connection.execute(
            `SELECT 
                id,
                nombre,
                email,
                avatar_url,
                tipo
            FROM usuarios
            WHERE id = ? AND tipo = 'superadmin' AND activo = true`,
            [userId]
        )

        if (usuarioRows.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        const [plataformaRows] = await connection.execute(
            `SELECT nombre_plataforma, logo_url FROM plataforma_config WHERE logo_url IS NOT NULL AND logo_url != '' LIMIT 1`
        )

        let logoUrl = null
        let nombrePlataforma = 'IziWeek'

        if (plataformaRows.length > 0) {
            logoUrl = plataformaRows[0].logo_url
            nombrePlataforma = plataformaRows[0].nombre_plataforma || 'IziWeek'
        }

        connection.release()

        console.log('Logo desde BD:', logoUrl)
        console.log('Nombre plataforma:', nombrePlataforma)

        return {
            success: true,
            usuario: {
                id: usuarioRows[0].id,
                nombre: usuarioRows[0].nombre,
                email: usuarioRows[0].email,
                avatar_url: usuarioRows[0].avatar_url,
                tipo: usuarioRows[0].tipo
            },
            logoPlataforma: logoUrl,
            nombrePlataforma: nombrePlataforma
        }

    } catch (error) {
        console.error('Error al obtener datos del super admin:', error)
        
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
        cookieStore.delete('userTipo')
        cookieStore.delete('empresaId')

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