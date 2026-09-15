import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import db from '@/_DB/db'
import fs from 'fs/promises'

export async function GET(_request, { params }) {
    let connection
    try {
        const cookieStore = await cookies()
        if (!cookieStore.get('userId')?.value || cookieStore.get('userTipo')?.value !== 'superadmin') {
            return NextResponse.json({ success: false, mensaje: 'Acceso no autorizado' }, { status: 403 })
        }
        const { id } = await params
        connection = await db.getConnection()
        const [[factura]] = await connection.execute(
            `SELECT f.numero_factura, f.archivo_pdf FROM facturas_plataforma f
             INNER JOIN pagos_plataforma p ON p.id = f.pago_id
             WHERE p.id = ? AND p.estado = 'confirmed' AND f.estado = 'generated'`, [id]
        )
        connection.release(); connection = null
        if (!factura?.archivo_pdf) return NextResponse.json({ success: false, mensaje: 'Factura no disponible' }, { status: 404 })
        const pdf = await fs.readFile(factura.archivo_pdf)
        return new NextResponse(pdf, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Length': String(pdf.length),
                'Content-Disposition': `attachment; filename="${factura.numero_factura}.pdf"`,
                'Cache-Control': 'no-store'
            }
        })
    } catch (error) {
        if (connection) connection.release()
        return NextResponse.json({ success: false, mensaje: 'No se pudo obtener la factura' }, { status: 500 })
    }
}