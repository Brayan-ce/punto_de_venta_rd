import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import db from '@/_DB/db'

export async function GET(request, { params }) {
    let connection
    try {
        const { clienteId } = await params
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId || !clienteId) {
            return NextResponse.json(
                { success: false, mensaje: 'Parámetros inválidos' },
                { status: 400 }
            )
        }

        connection = await db.getConnection()

        // Obtener pagos del cliente desde pagos_credito
        let pagos = []
        
        try {
            const [pagosList] = await connection.execute(
                `SELECT 
                    pc.id,
                    pc.referencia_pago as numero_referencia,
                    pc.monto_pagado as monto,
                    pc.fecha_pago as fecha,
                    'completado' as estado,
                    pc.metodo_pago,
                    pc.notas
                FROM pagos_credito pc
                WHERE pc.cliente_id = ? AND pc.empresa_id = ?
                ORDER BY pc.fecha_pago DESC`,
                [clienteId, empresaId]
            )
            pagos = pagosList || []
        } catch (err) {
            console.log('Error al obtener pagos_credito:', err.message)
        }

        connection.release()

        return NextResponse.json({
            success: true,
            pagos
        })
    } catch (error) {
        console.error('Error al obtener pagos:', error)
        if (connection) connection.release()
        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar pagos' },
            { status: 500 }
        )
    }
}
