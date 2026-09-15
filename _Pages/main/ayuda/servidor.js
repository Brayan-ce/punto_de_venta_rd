"use server"

import db from "@/_DB/db"

export async function obtenerWhatsappSoporte() {
    let connection
    try {
        connection = await db.getConnection()

        const [config] = await connection.execute(
            `SELECT telefono_whatsapp FROM plataforma_config LIMIT 1`
        )

        connection.release()

        const telefonoWhatsapp = config[0]?.telefono_whatsapp

        if (!telefonoWhatsapp) {
            return {
                success: false,
                mensaje: 'No hay WhatsApp de soporte configurado'
            }
        }

        const mensaje = 'Hola, estoy interesado en *ISIWEEK, el Sistema de Gestión Total*. Me gustaría conocer cómo funciona y solicitar una demostración.'

        const mensajeEncoded = encodeURIComponent(mensaje)
        const whatsappUrl = `https://wa.me/${telefonoWhatsapp}?text=${mensajeEncoded}`

        return {
            success: true,
            whatsappUrl: whatsappUrl
        }

    } catch (error) {
        console.error('Error al obtener WhatsApp de soporte:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al obtener informacion de contacto'
        }
    }
}