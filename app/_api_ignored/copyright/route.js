import { NextResponse } from 'next/server'
import db from '@/_DB/db'

export async function GET() {
    let connection
    try {
        connection = await db.getConnection()

        const [config] = await connection.execute(
            `SELECT copyright FROM plataforma_config LIMIT 1`
        )

        connection.release()

        return NextResponse.json({
            success: true,
            copyright: config[0]?.copyright || '© 2025 IziWeek. Todos los derechos reservados.'
        }, { status: 200 })

    } catch (error) {
        console.error('Error al obtener copyright:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json({
            success: false,
            copyright: '© 2025 IziWeek. Todos los derechos reservados.'
        }, { status: 500 })
    }
}