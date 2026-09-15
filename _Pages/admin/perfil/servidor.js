"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'

const VPS_UPLOAD_URL = process.env.VPS_UPLOAD_URL
const VPS_IMAGE_BASE_URL = process.env.VPS_IMAGE_BASE_URL

export async function obtenerPerfil() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT 
                id,
                nombre,
                cedula,
                email,
                avatar_url,
                tipo
            FROM usuarios
            WHERE id = ? AND empresa_id = ?`,
            [userId, empresaId]
        )

        if (usuarios.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        connection.release()

        return {
            success: true,
            usuario: usuarios[0]
        }

    } catch (error) {
        console.error('Error al obtener perfil:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar perfil'
        }
    }
}

export async function actualizarPerfil(datosPerfil) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [usuarioExiste] = await connection.execute(
            `SELECT id FROM usuarios WHERE id = ? AND empresa_id = ?`,
            [userId, empresaId]
        )

        if (usuarioExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        const [existeEmail] = await connection.execute(
            `SELECT id FROM usuarios WHERE email = ? AND id != ?`,
            [datosPerfil.email.trim(), userId]
        )

        if (existeEmail.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otro usuario con ese email'
            }
        }

        if (datosPerfil.password && datosPerfil.password.trim() !== '') {
            const passwordHash = await bcrypt.hash(datosPerfil.password, 10)
            
            await connection.execute(
                `UPDATE usuarios SET
                    nombre = ?,
                    email = ?,
                    password = ?,
                    avatar_url = ?
                WHERE id = ? AND empresa_id = ?`,
                [
                    datosPerfil.nombre.trim(),
                    datosPerfil.email.trim(),
                    passwordHash,
                    datosPerfil.avatar_url || null,
                    userId,
                    empresaId
                ]
            )
        } else {
            await connection.execute(
                `UPDATE usuarios SET
                    nombre = ?,
                    email = ?,
                    avatar_url = ?
                WHERE id = ? AND empresa_id = ?`,
                [
                    datosPerfil.nombre.trim(),
                    datosPerfil.email.trim(),
                    datosPerfil.avatar_url || null,
                    userId,
                    empresaId
                ]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Perfil actualizado exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar perfil:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el perfil'
        }
    }
}

export async function subirAvatar(formData) {
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        const avatar = formData.get('avatar')
        
        if (!avatar) {
            return {
                success: false,
                mensaje: 'No se recibio ningun archivo'
            }
        }

        const vpsFormData = new FormData()
        vpsFormData.append('file', avatar)
        vpsFormData.append('folder', 'avatars')

        const response = await fetch(VPS_UPLOAD_URL, {
            method: 'POST',
            body: vpsFormData
        })

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor VPS')
        }

        const resultado = await response.json()

        if (!resultado.success) {
            return {
                success: false,
                mensaje: resultado.mensaje || 'Error al subir avatar al VPS'
            }
        }

        const urlCompleta = `${VPS_IMAGE_BASE_URL}/${resultado.filename}`

        return {
            success: true,
            url: urlCompleta
        }

    } catch (error) {
        console.error('Error al subir avatar:', error)
        return {
            success: false,
            mensaje: 'Error al subir el archivo'
        }
    }
}