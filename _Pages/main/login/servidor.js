"use server"

import db, { conPermisoEscrituraOffline } from "@/_DB/db"
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'
import { enviarCorreo, generarPlantillaOtp } from '@/lib/smtp/enviarCorreo'
import { OAuth2Client } from 'google-auth-library'
import { firmarSesion, opcionesCookieSesion } from '@/lib/auth/session'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

function generarCodigoOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

async function establecerCookiesSesion(usuario) {
    const cookieStore = await cookies()

    cookieStore.set('userId', usuario.id.toString(), {
        ...opcionesCookieSesion
    })
    cookieStore.set('userTipo', usuario.tipo, {
        ...opcionesCookieSesion
    })
    if (usuario.empresa_id) {
        cookieStore.set('empresaId', usuario.empresa_id.toString(), {
            ...opcionesCookieSesion
        })
    }
    cookieStore.set('sessionSignature', firmarSesion(usuario), opcionesCookieSesion)
}

async function guardarOtp(usuarioId, codigo) {
    let connection
    try {
        await conPermisoEscrituraOffline(async () => {
            connection = await db.getConnection()
            await connection.execute(
                `DELETE FROM superadmin_otp WHERE usuario_id = ?`,
                [usuarioId]
            )
            const expiraEn = new Date(Date.now() + 5 * 60 * 1000)
                .toISOString().slice(0, 19).replace('T', ' ')
            await connection.execute(
                `INSERT INTO superadmin_otp (usuario_id, codigo, expira_en) VALUES (?, ?, ?)`,
                [usuarioId, codigo, expiraEn]
            )
            connection.release()
            connection = null
        })
    } catch (error) {
        console.error('Error al guardar OTP:', error)
        if (connection) connection.release()
        throw error
    }
}

export async function obtenerPlataforma() {
    let connection
    try {
        connection = await db.getConnection()
        const [config] = await connection.execute(
            `SELECT nombre_plataforma, logo_url, copyright FROM plataforma_config LIMIT 1`
        )
        connection.release()
        if (config.length > 0) {
            return {
                success: true,
                nombre_plataforma: config[0].nombre_plataforma || null,
                logo_url: config[0].logo_url || null,
                copyright: config[0].copyright || null
            }
        }
        return { success: true, nombre_plataforma: null, logo_url: null, copyright: null }
    } catch (error) {
        console.error('Error al obtener plataforma:', error)
        if (connection) connection.release()
        return { success: false, nombre_plataforma: null, logo_url: null, copyright: null }
    }
}

export async function obtenerCopyright() {
    let connection
    try {
        connection = await db.getConnection()
        const [config] = await connection.execute(
            `SELECT copyright FROM plataforma_config LIMIT 1`
        )
        connection.release()
        return { success: true, copyright: config[0]?.copyright || null }
    } catch (error) {
        console.error('Error al obtener copyright:', error)
        if (connection) connection.release()
        return { success: false, copyright: null }
    }
}

export async function iniciarSesion(email, password) {
    let connection
    try {
        if (!email || !password) {
            return { success: false, mensaje: 'Email y contrasena son requeridos' }
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
                e.nombre_empresa,
                e.otp_habilitado
            FROM usuarios u
            LEFT JOIN empresas e ON u.empresa_id = e.id
            WHERE u.email = ?`,
            [email]
        )

        if (usuarios.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Credenciales invalidas' }
        }

        const usuario = usuarios[0]

        if (!usuario.activo) {
            connection.release()
            return { success: false, mensaje: 'Usuario inactivo. Contacta al administrador' }
        }

        const passwordValida = await bcrypt.compare(password, usuario.password)

        if (!passwordValida) {
            connection.release()
            return { success: false, mensaje: 'Credenciales invalidas' }
        }

        connection.release()

        const otpRequerido = usuario.tipo === 'superadmin' || !!usuario.otp_habilitado

        if (otpRequerido) {
            const codigo = generarCodigoOtp()
            await guardarOtp(usuario.id, codigo)
            const nombreOrigen = usuario.nombre_empresa || process.env.SMTP_FROM_NAME || 'IsiWeek'
            try {
                await enviarCorreo({
                    para: usuario.email,
                    asunto: `Código de verificación - ${nombreOrigen}`,
                    html: generarPlantillaOtp(codigo, nombreOrigen)
                })
            } catch (error) {
                console.error('Error al enviar OTP:', error)
                return { success: false, mensaje: 'Error al enviar el código de verificación. Revisa la configuración SMTP.' }
            }

            return {
                success: true,
                otp_required: true,
                usuarioId: usuario.id,
                email: usuario.email,
                tipo: usuario.tipo
            }
        }

        await establecerCookiesSesion(usuario)

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
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al procesar la solicitud' }
    }
}

export async function iniciarSesionGoogle(credential) {
    let connection
    try {
        if (!credential) {
            return { success: false, mensaje: 'No se recibió la credencial de Google' }
        }

        if (!GOOGLE_CLIENT_ID) {
            return { success: false, mensaje: 'El inicio de sesión con Google no está configurado' }
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        })
        const cuentaGoogle = ticket.getPayload()

        if (!cuentaGoogle?.email || !cuentaGoogle.email_verified) {
            return { success: false, mensaje: 'Google no confirmó el correo electrónico de esta cuenta' }
        }

        connection = await db.getConnection()
        const [usuarios] = await connection.execute(
            `SELECT
                u.id,
                u.empresa_id,
                u.nombre,
                u.email,
                u.tipo,
                u.activo,
                u.system_mode,
                e.nombre_empresa,
                e.otp_habilitado
            FROM usuarios u
            LEFT JOIN empresas e ON u.empresa_id = e.id
            WHERE u.email = ?`,
            [cuentaGoogle.email]
        )
        connection.release()
        connection = null

        if (usuarios.length === 0) {
            return { success: false, mensaje: 'No existe una cuenta registrada para este correo de Google' }
        }

        const usuario = usuarios[0]
        if (!usuario.activo) {
            return { success: false, mensaje: 'Usuario inactivo. Contacta al administrador' }
        }

        const otpRequerido = usuario.tipo === 'superadmin' || !!usuario.otp_habilitado
        if (otpRequerido) {
            const codigo = generarCodigoOtp()
            await guardarOtp(usuario.id, codigo)
            const nombreOrigen = usuario.nombre_empresa || process.env.SMTP_FROM_NAME || 'IsiWeek'
            try {
                await enviarCorreo({
                    para: usuario.email,
                    asunto: `Código de verificación - ${nombreOrigen}`,
                    html: generarPlantillaOtp(codigo, nombreOrigen)
                })
            } catch (error) {
                console.error('Error al enviar OTP de Google:', error)
                return { success: false, mensaje: 'Error al enviar el código de verificación. Revisa la configuración SMTP.' }
            }

            return {
                success: true,
                otp_required: true,
                usuarioId: usuario.id,
                email: usuario.email,
                tipo: usuario.tipo
            }
        }

        await establecerCookiesSesion(usuario)

        return {
            success: true,
            mensaje: 'Inicio de sesión exitoso',
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
        console.error('Error al iniciar sesión con Google:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo verificar el inicio de sesión con Google' }
    }
}

export async function obtenerGuia() {
    let connection
    try {
        connection = await db.getConnection()
        const [items] = await connection.execute(
            `SELECT id, titulo, descripcion, tipo, contenido, nombre_archivo
             FROM guia_contenido
             WHERE activo = 1
             ORDER BY orden ASC`
        )
        connection.release()
        return { success: true, items }
    } catch (error) {
        console.error('Error al obtener guía:', error)
        if (connection) connection.release()
        return { success: false, items: [] }
    }
}

export async function completarSesionSuperAdmin(usuarioId, codigo) {
    if (!usuarioId || !codigo) {
        return { success: false, mensaje: 'Datos incompletos' }
    }

    let connection
    try {
        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT id FROM superadmin_otp
             WHERE usuario_id = ? AND codigo = ? AND usado = 0 AND expira_en > NOW()
             ORDER BY id DESC LIMIT 1`,
            [usuarioId, codigo]
        )

        if (rows.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Código inválido o expirado' }
        }

        await conPermisoEscrituraOffline(() => connection.execute(
            `UPDATE superadmin_otp SET usado = 1 WHERE id = ?`,
            [rows[0].id]
        ))

        const [usuarios] = await connection.execute(
            `SELECT 
                u.id,
                u.empresa_id,
                u.nombre,
                u.email,
                u.tipo,
                u.system_mode,
                e.nombre_empresa
             FROM usuarios u
             LEFT JOIN empresas e ON u.empresa_id = e.id
             WHERE u.id = ?`,
            [usuarioId]
        )

        connection.release()

        if (usuarios.length === 0) {
            return { success: false, mensaje: 'Usuario no encontrado' }
        }

        const usuario = usuarios[0]

        await establecerCookiesSesion(usuario)

        return {
            success: true,
            mensaje: 'Inicio de sesion exitoso',
            tipo: usuario.tipo,
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
        console.error('Error al completar sesión superadmin:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al procesar la solicitud' }
    }
}