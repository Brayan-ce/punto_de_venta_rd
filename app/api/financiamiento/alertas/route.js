import { NextResponse } from 'next/server'
import db from '@/_DB/db'
import { cookies } from 'next/headers'

/**
 * GET /api/financiamiento/alertas
 * Obtener alertas de financiamiento
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
        const estado = searchParams.get('estado')
        const severidad = searchParams.get('severidad')
        const tipo_alerta = searchParams.get('tipo_alerta')

        connection = await db.getConnection()

        let query = `
            SELECT a.*,
                   cl.nombre as cliente_nombre,
                   cl.telefono as cliente_telefono,
                   c.numero_contrato,
                   u.nombre as asignado_a_nombre
            FROM alertas_financiamiento a
            LEFT JOIN clientes cl ON a.cliente_id = cl.id
            LEFT JOIN contratos_financiamiento c ON a.contrato_id = c.id
            LEFT JOIN usuarios u ON a.asignado_a = u.id
            WHERE a.empresa_id = ?
        `
        const params = [empresaId]

        if (estado) {
            query += ` AND a.estado = ?`
            params.push(estado)
        }

        if (severidad) {
            query += ` AND a.severidad = ?`
            params.push(severidad)
        }

        if (tipo_alerta) {
            query += ` AND a.tipo_alerta = ?`
            params.push(tipo_alerta)
        }

        query += ` ORDER BY 
            CASE a.severidad
                WHEN 'critica' THEN 1
                WHEN 'alta' THEN 2
                WHEN 'media' THEN 3
                WHEN 'baja' THEN 4
            END,
            a.fecha_creacion DESC
            LIMIT 100`

        const [alertas] = await connection.execute(query, params)

        connection.release()

        return NextResponse.json({
            success: true,
            alertas
        })

    } catch (error) {
        console.error('Error al obtener alertas:', error)
        if (connection) connection.release()
        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar alertas' },
            { status: 500 }
        )
    }
}

















