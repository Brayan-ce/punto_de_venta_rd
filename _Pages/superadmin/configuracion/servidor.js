"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'

const VPS_UPLOAD_URL = process.env.VPS_UPLOAD_URL
const VPS_IMAGE_BASE_URL = process.env.VPS_IMAGE_BASE_URL

export async function obtenerConfiguracion() {
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

        const [plataforma] = await connection.execute(
            `SELECT 
                nombre_plataforma,
                logo_url,
                email_contacto,
                telefono_contacto,
                telefono_whatsapp,
                direccion,
                copyright
            FROM plataforma_config
            LIMIT 1`
        )

        const [superAdmin] = await connection.execute(
            `SELECT 
                nombre,
                cedula,
                email,
                avatar_url
            FROM usuarios
            WHERE tipo = 'superadmin'
            LIMIT 1`
        )

        connection.release()

        return {
            success: true,
            plataforma: plataforma.length > 0 ? plataforma[0] : null,
            superAdmin: superAdmin.length > 0 ? superAdmin[0] : null
        }

    } catch (error) {
        console.error('Error al obtener configuracion:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar configuracion'
        }
    }
}

export async function actualizarPlataforma(datos) {
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

        const [existente] = await connection.execute(
            `SELECT id FROM plataforma_config LIMIT 1`
        )

        if (existente.length > 0) {
            await connection.execute(
                `UPDATE plataforma_config SET
                    nombre_plataforma = ?,
                    email_contacto = ?,
                    telefono_contacto = ?,
                    telefono_whatsapp = ?,
                    direccion = ?,
                    copyright = ?,
                    logo_url = ?
                WHERE id = ?`,
                [
                    datos.nombre_plataforma,
                    datos.email_contacto,
                    datos.telefono_contacto || null,
                    datos.telefono_whatsapp || null,
                    datos.direccion || null,
                    datos.copyright || null,
                    datos.logo_url || null,
                    existente[0].id
                ]
            )
        } else {
            await connection.execute(
                `INSERT INTO plataforma_config (
                    nombre_plataforma,
                    email_contacto,
                    telefono_contacto,
                    telefono_whatsapp,
                    direccion,
                    copyright,
                    logo_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.nombre_plataforma,
                    datos.email_contacto,
                    datos.telefono_contacto || null,
                    datos.telefono_whatsapp || null,
                    datos.direccion || null,
                    datos.copyright || null,
                    datos.logo_url || null
                ]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Configuracion de plataforma actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar plataforma:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la configuracion'
        }
    }
}

export async function actualizarSuperAdmin(datos) {
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

        const [cedulaDuplicada] = await connection.execute(
            `SELECT id FROM usuarios WHERE cedula = ? AND id != ? AND tipo = 'superadmin'`,
            [datos.cedula, userId]
        )

        if (cedulaDuplicada.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otro usuario con esta cedula'
            }
        }

        const [emailDuplicado] = await connection.execute(
            `SELECT id FROM usuarios WHERE email = ? AND id != ? AND tipo = 'superadmin'`,
            [datos.email, userId]
        )

        if (emailDuplicado.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otro usuario con este email'
            }
        }

        if (datos.password && datos.password.trim() !== '') {
            const passwordHash = await bcrypt.hash(datos.password, 10)
            
            await connection.execute(
                `UPDATE usuarios SET
                    nombre = ?,
                    cedula = ?,
                    email = ?,
                    password = ?,
                    avatar_url = ?
                WHERE id = ? AND tipo = 'superadmin'`,
                [
                    datos.nombre,
                    datos.cedula,
                    datos.email,
                    passwordHash,
                    datos.avatar_url || null,
                    userId
                ]
            )
        } else {
            await connection.execute(
                `UPDATE usuarios SET
                    nombre = ?,
                    cedula = ?,
                    email = ?,
                    avatar_url = ?
                WHERE id = ? AND tipo = 'superadmin'`,
                [
                    datos.nombre,
                    datos.cedula,
                    datos.email,
                    datos.avatar_url || null,
                    userId
                ]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Perfil actualizado exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar super admin:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el perfil'
        }
    }
}

export async function subirImagen(formData) {
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

        const imagen = formData.get('imagen')
        const tipo = formData.get('tipo')

        if (!imagen) {
            return {
                success: false,
                mensaje: 'No se proporciono ninguna imagen'
            }
        }

        const vpsFormData = new FormData()
        vpsFormData.append('file', imagen)
        vpsFormData.append('folder', tipo === 'logo' ? 'logos' : 'avatars')

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
                mensaje: resultado.mensaje || 'Error al subir imagen al VPS'
            }
        }

        const urlCompleta = `${VPS_IMAGE_BASE_URL}/${resultado.filename}`

        return {
            success: true,
            url: urlCompleta
        }

    } catch (error) {
        console.error('Error al subir imagen:', error)

        return {
            success: false,
            mensaje: 'Error al subir la imagen'
        }
    }
}