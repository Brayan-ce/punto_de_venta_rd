import { NextResponse } from 'next/server'
import db from '@/_DB/db'
import { cookies } from 'next/headers'

/**
 * GET /api/financiamiento/contratos
 * Obtener lista de contratos
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
        const pagina = parseInt(searchParams.get('pagina') || '1')
        const limite = parseInt(searchParams.get('limite') || '20')
        const offset = (pagina - 1) * limite
        const estado = searchParams.get('estado')
        const cliente_id = searchParams.get('cliente_id')
        const buscar = searchParams.get('buscar')

        connection = await db.getConnection()

        let query = `
            SELECT c.*,
                   cl.nombre as cliente_nombre,
                   cl.numero_documento as cliente_documento,
                   p.nombre as plan_nombre
            FROM contratos_financiamiento c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
            WHERE c.empresa_id = ?
        `
        const params = [empresaId]

        if (estado) {
            query += ` AND c.estado = ?`
            params.push(estado)
        }

        if (cliente_id) {
            query += ` AND c.cliente_id = ?`
            params.push(cliente_id)
        }

        if (buscar) {
            query += ` AND (c.numero_contrato LIKE ? OR cl.nombre LIKE ? OR c.ncf LIKE ?)`
            const busqueda = `%${buscar}%`
            params.push(busqueda, busqueda, busqueda)
        }

        // Contar total
        const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM')
        const [countResult] = await connection.execute(countQuery, params)
        const total = countResult[0].total

        query += ` ORDER BY c.fecha_creacion DESC LIMIT ? OFFSET ?`
        params.push(limite, offset)

        const [contratos] = await connection.execute(query, params)

        connection.release()

        return NextResponse.json({
            success: true,
            contratos,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite)
            }
        })

    } catch (error) {
        console.error('Error al obtener contratos:', error)
        if (connection) connection.release()
        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar contratos' },
            { status: 500 }
        )
    }
}

















