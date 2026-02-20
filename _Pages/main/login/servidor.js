"use server"

import db from "@/_DB/db"
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'

export async function obtenerCopyright() {
    let connection
    try {
        connection = await db.getConnection()

        const [config] = await connection.execute(
            `SELECT copyright FROM plataforma_config LIMIT 1`
        )

        connection.release()

        return {
            success: true,
            copyright: config[0]?.copyright || null
        }

    } catch (error) {
        console.error('Error al obtener copyright:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            copyright: null
        }
    }
}

export async function iniciarSesion(email, password) {
    let connection
    try {
        if (!email || !password) {
            return {
                success: false,
                mensaje: 'Email y contrasena son requeridos'
            }
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT 
                u.id,
                u.empresa_id,
                u.nombre,
                u.email,
                u.password,
                u.tipo,
                u.activo,
                u.system_mode,
                e.nombre_empresa
            FROM usuarios u
            LEFT JOIN empresas e ON u.empresa_id = e.id
            WHERE u.email = ?`,
            [email]
        )

        if (usuarios.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Credenciales invalidas'
            }
        }

        const usuario = usuarios[0]

        if (!usuario.activo) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario inactivo. Contacta al administrador'
            }
        }

        const passwordValida = await bcrypt.compare(password, usuario.password)

        if (!passwordValida) {
            connection.release()
            return {
                success: false,
                mensaje: 'Credenciales invalidas'
            }
        }

        connection.release()

        const cookieStore = await cookies()
        
        // Detectar si estamos en HTTPS (producción)
        // En producción con HTTPS, SIEMPRE usar secure: true
        // En desarrollo local (HTTP), usar secure: false
        // Si HTTPS está explícitamente configurado, usarlo
        // Por defecto, asumir producción = secure: true
        const isDevelopment = process.env.NODE_ENV === 'development'
        const isHTTPS = process.env.HTTPS === 'true'
        const isSecure = !isDevelopment || isHTTPS

        cookieStore.set('userId', usuario.id.toString(), {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        })

        cookieStore.set('userTipo', usuario.tipo, {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        })

        if (usuario.empresa_id) {
            cookieStore.set('empresaId', usuario.empresa_id.toString(), {
                httpOnly: true,
                secure: isSecure,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/'
            })
        }

        return {
            success: true,
            mensaje: 'Inicio de sesion exitoso',
            tipo: usuario.tipo,
            systemMode: usuario.system_mode || 'POS',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                tipo: usuario.tipo,
                empresa_id: usuario.empresa_id,
                nombre_empresa: usuario.nombre_empresa,
                system_mode: usuario.system_mode
            }
        }

    } catch (error) {
        console.error('Error al iniciar sesion:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al procesar la solicitud'
        }
    }
}