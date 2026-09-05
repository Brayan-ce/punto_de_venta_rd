import { NextResponse } from 'next/server'
import db from '@/_DB/db'
import { cookies } from 'next/headers'

/**
 * GET /api/financiamiento/planes
 * Obtener planes de financiamiento disponibles
 */
export async function GET(request) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return NextResponse.json(
                { success: false, mensaje: 'Sesión inválida' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const activo = searchParams.get('activo')

        connection = await db.getConnection()

        let query = `
            SELECT p.*
            FROM planes_financiamiento p
            WHERE (p.empresa_id = ? OR p.empresa_id IS NULL)
        `
        const params = [empresaId]

        if (activo !== null) {
            query += ` AND p.activo = ?`
            params.push(activo === 'true' ? 1 : 0)
        }

        query += ` ORDER BY p.activo DESC, p.plazo_meses ASC`

        const [planes] = await connection.execute(query, params)

        connection.release()

        return NextResponse.json({
            success: true,
            planes
        })

    } catch (error) {
        console.error('Error al obtener planes:', error)
        if (connection) connection.release()
        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar planes' },
            { status: 500 }
        )
    }
}

















