"use server"

import db from "@/_DB/db"
import bcrypt from 'bcrypt'
import { headers } from 'next/headers'

export async function registrarUsuario(formData) {
    let connection
    try {
        const {
            nombre,
            cedula,
            email,
            telefono,
            password,
            nombreEmpresa,
            rnc,
            razonSocial,
            aceptoTerminos // ✅ NUEVO CAMPO
        } = formData

        // ✅ VALIDACIÓN DE CAMPOS OBLIGATORIOS
        if (!nombre || !cedula || !email || !telefono || !password || !nombreEmpresa || !rnc || !razonSocial) {
            return {
                success: false,
                mensaje: 'Todos los campos son requeridos'
            }
        }

        // ✅ VALIDACIÓN DE TÉRMINOS (CRÍTICO - NIVEL BACKEND)
        if (!aceptoTerminos) {
            return {
                success: false,
                mensaje: 'Debe aceptar los Términos y Condiciones para continuar'
            }
        }

        connection = await db.getConnection()

        // Verificar si el email ya existe
        const [emailExiste] = await connection.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        )

        if (emailExiste.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El email ya esta registrado'
            }
        }

        // Verificar si existe solicitud pendiente con el mismo RNC
        const [rncExiste] = await connection.execute(
            'SELECT id FROM solicitudes_registro WHERE rnc = ? AND estado = "pendiente"',
            [rnc]
        )

        if (rncExiste.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe una solicitud pendiente con este RNC'
            }
        }

        // ✅ OBTENER TÉRMINOS ACTIVOS
        const [terminosActivos] = await connection.execute(
            'SELECT id, version FROM terminos_condiciones WHERE activo = TRUE LIMIT 1'
        )

        if (terminosActivos.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No hay términos y condiciones activos. Contacte al administrador.'
            }
        }

        const terminosId = terminosActivos[0].id
        const terminosVersion = terminosActivos[0].version

        // ✅ OBTENER IP DEL USUARIO (para auditoría legal - headers() debe ser await)
        const headersList = await headers()
        const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            headersList.get('x-real-ip') ||
            'IP no disponible'

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 12)

        // ✅ INSERTAR SOLICITUD CON INFORMACIÓN DE TÉRMINOS
        const [resultado] = await connection.execute(
            `INSERT INTO solicitudes_registro (
                nombre,
                cedula,
                email,
                password,
                telefono,
                nombre_empresa,
                rnc,
                razon_social,
                acepto_terminos,
                terminos_version,
                ip_registro,
                estado,
                fecha_solicitud
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW())`,
            [
                nombre,
                cedula,
                email,
                passwordHash,
                telefono,
                nombreEmpresa,
                rnc,
                razonSocial,
                true, // ✅ acepto_terminos
                terminosVersion, // ✅ versión aceptada
                ipAddress // ✅ IP para auditoría
            ]
        )

        const solicitudId = resultado.insertId

        // Obtener configuración de WhatsApp del superadmin
        const [configSuperAdmin] = await connection.execute(
            `SELECT telefono_whatsapp FROM plataforma_config LIMIT 1`
        )

        connection.release()

        const telefonoSuperAdmin = configSuperAdmin[0]?.telefono_whatsapp

        let whatsappUrl = null

        if (telefonoSuperAdmin) {
            const mensaje = `
Hola, soy *${nombre}* y acabo de registrarme en *IziWeek*.

*Mis datos personales:*
- Nombre: ${nombre}
- Cedula: ${cedula}
- Email: ${email}
- Telefono: ${telefono}

*Datos de mi empresa:*
- Nombre: ${nombreEmpresa}
- RNC: ${rnc}
- Razon Social: ${razonSocial}

✅ He aceptado los Términos y Condiciones (v${terminosVersion})

Por favor, podrian activar mi cuenta para empezar a usar el sistema?

Gracias!
            `.trim()

            const mensajeEncoded = encodeURIComponent(mensaje)
            whatsappUrl = `https://wa.me/${telefonoSuperAdmin}?text=${mensajeEncoded}`
        }

        return {
            success: true,
            mensaje: 'Solicitud enviada exitosamente',
            solicitudId: solicitudId,
            whatsappUrl: whatsappUrl
        }

    } catch (error) {
        console.error('Error al registrar usuario:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al procesar la solicitud'
        }
    }
}

// ✅ FUNCIÓN AUXILIAR: Obtener términos activos (para uso público)
export async function obtenerTerminosActivos() {
    let connection
    try {
        connection = await db.getConnection()

        const [terminos] = await connection.execute(
            'SELECT id, version, titulo, contenido, creado_en FROM terminos_condiciones WHERE activo = TRUE LIMIT 1'
        )

        connection.release()

        if (terminos.length === 0) {
            return {
                success: false,
                mensaje: 'No hay términos disponibles'
            }
        }

        // ✅ NORMALIZAR MARKDOWN
        const termino = terminos[0]
        termino.contenido = termino.contenido
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .trim()

        return {
            success: true,
            datos: termino
        }

    } catch (error) {
        console.error('Error al obtener términos:', error)

        if (connection) connection.release()

        return {
            success: false,
            mensaje: 'Error al obtener términos'
        }
    }
}