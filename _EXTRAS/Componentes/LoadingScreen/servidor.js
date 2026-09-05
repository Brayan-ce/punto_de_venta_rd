"use server"

import db from "@/_DB/db"

export async function obtenerDatosPlataforma() {
    let connection
    try {
        connection = await db.getConnection()
        const [config] = await connection.execute(
            `SELECT nombre_plataforma, logo_url FROM plataforma_config LIMIT 1`
        )
        connection.release()
        if (config.length > 0) {
            return {
                success: true,
                nombre_plataforma: config[0].nombre_plataforma || 'IZIWEEK',
                logo_url: config[0].logo_url || null
            }
        }
        return { success: true, nombre_plataforma: 'IZIWEEK', logo_url: null }
    } catch (error) {
        console.error('Error al obtener datos plataforma:', error)
        if (connection) connection.release()
        return { success: false, nombre_plataforma: 'IZIWEEK', logo_url: null }
    }
}
