"use server"

import db from '@/_DB/db'
import { cookies } from 'next/headers'

export async function obtenerDatosSucursal() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'sucursales') {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT id, nombre, email, avatar_url, tipo
             FROM usuarios
             WHERE id = ? AND empresa_id = ? AND activo = TRUE`,
            [userId, empresaId]
        )

        const [empresas] = await connection.execute(
            `SELECT id, nombre_empresa, logo_url
             FROM empresas
             WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )

        connection.release()

        if (usuarios.length === 0) {
            return { success: false, mensaje: 'Usuario no encontrado' }
        }

        return {
            success: true,
            usuario: usuarios[0],
            empresa: empresas[0] || null
        }
    } catch (error) {
        console.error('Error al obtener datos de sucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar datos' }
    }
}

export async function cerrarSesionSucursal() {
    const cookieStore = await cookies()
    cookieStore.delete('userId')
    cookieStore.delete('empresaId')
    cookieStore.delete('userTipo')
    return { success: true }
}
