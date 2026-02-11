"use server"

import db from "@/_DB/db"

export async function obtenerDatosPlataforma() {
    let connection
    try {
        connection = await db.getConnection()

        const [plataformaRows] = await connection.execute(
            `SELECT 
                nombre_plataforma,
                logo_url
            FROM plataforma_config
            WHERE logo_url IS NOT NULL AND logo_url != ''
            LIMIT 1`
        )

        connection.release()

        return {
            success: true,
            plataforma: plataformaRows.length > 0 ? {
                nombre_plataforma: plataformaRows[0].nombre_plataforma,
                logo_url: plataformaRows[0].logo_url
            } : null
        }

    } catch (error) {
        console.error('Error al obtener datos de la plataforma:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos de la plataforma'
        }
    }
}