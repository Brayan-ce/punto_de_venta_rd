import { NextResponse } from 'next/server'
import db from '@/_DB/db'
import { cookies } from 'next/headers'

/**
 * GET /api/financiamiento/contratos/[id]
 * Obtener detalle completo de un contrato
 */
export async function GET(request, { params }) {
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

        const { id } = await params

        connection = await db.getConnection()

        // Obtener contrato
        const [contratos] = await connection.execute(
            `SELECT c.*,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   cl.email as cliente_email,
                   p.nombre as plan_nombre,
                   u.nombre as vendedor_nombre
            FROM contratos_financiamiento c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.id = ? AND c.empresa_id = ?`,
            [id, empresaId]
        )

        if (contratos.length === 0) {
            connection.release()
            return NextResponse.json(
                { success: false, mensaje: 'Contrato no encontrado' },
                { status: 404 }
            )
        }

        const contrato = contratos[0]

        // Obtener cuotas
        const [cuotas] = await connection.execute(
            `SELECT * FROM cuotas_financiamiento
             WHERE contrato_id = ?
             ORDER BY numero_cuota ASC`,
            [id]
        )

        // Obtener pagos
        const [pagos] = await connection.execute(
            `SELECT p.*, u.nombre as registrado_por_nombre
             FROM pagos_financiamiento p
             LEFT JOIN usuarios u ON p.registrado_por = u.id
             WHERE p.contrato_id = ?
             ORDER BY p.fecha_pago DESC`,
            [id]
        )

        // Obtener activos
        const [activos] = await connection.execute(
            `SELECT a.*, pr.nombre as producto_nombre
             FROM activos_productos a
             LEFT JOIN productos pr ON a.producto_id = pr.id
             WHERE a.contrato_financiamiento_id = ?`,
            [id]
        )

        connection.release()

        return NextResponse.json({
            success: true,
            contrato,
            cuotas,
            pagos,
            activos
        })

    } catch (error) {
        console.error('Error al obtener contrato:', error)
        if (connection) connection.release()
        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar contrato' },
            { status: 500 }
        )
    }
}

















