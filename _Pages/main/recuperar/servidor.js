"use server"

import db from "@/_DB/db"

export async function solicitarRecuperacion(email) {
    let connection
    try {
        if (!email) {
            return {
                success: false,
                mensaje: 'El correo electronico es requerido'
            }
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT 
                u.id,
                u.nombre,
                u.email,
                u.cedula,
                u.tipo,
                e.nombre_empresa
            FROM usuarios u
            LEFT JOIN empresas e ON u.empresa_id = e.id
            WHERE u.email = ? AND u.activo = true`,
            [email]
        )

        if (usuarios.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se encontro una cuenta activa con este correo'
            }
        }

        const usuario = usuarios[0]

        const [configSuperAdmin] = await connection.execute(
            `SELECT telefono_whatsapp FROM plataforma_config LIMIT 1`
        )

        connection.release()

        const telefonoSuperAdmin = configSuperAdmin[0]?.telefono_whatsapp

        let whatsappUrl = null

        if (telefonoSuperAdmin) {
            const mensaje = `
Hola, necesito ayuda para *recuperar mi contraseña* en IziWeek.

*Mis datos:*
- Nombre: ${usuario.nombre}
- Email: ${email}
- Cedula: ${usuario.cedula}
${usuario.nombre_empresa ? `- Empresa: ${usuario.nombre_empresa}` : ''}
- Tipo de cuenta: ${usuario.tipo}

Por favor, ayudenme a restablecer mi contraseña.

Gracias!
            `.trim()

            const mensajeEncoded = encodeURIComponent(mensaje)
            whatsappUrl = `https://wa.me/${telefonoSuperAdmin}?text=${mensajeEncoded}`
        }

        return {
            success: true,
            mensaje: 'Solicitud enviada exitosamente',
            whatsappUrl: whatsappUrl
        }

    } catch (error) {
        console.error('Error al procesar recuperacion:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al procesar la solicitud'
        }
    }
}