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

        // Obtener historial de ventas
        const [ventas] = await connection.execute(
            `SELECT 
                v.id,
                v.numero_interno as numero_comprobante,
                v.ncf,
                v.total as monto,
                v.fecha_venta as fecha,
                'venta' as tipo,
                tc.nombre as referencia
            FROM ventas v
            LEFT JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
            WHERE v.cliente_id = ? AND v.empresa_id = ?
            ORDER BY v.fecha_venta DESC
            LIMIT 50`,
            [clienteId, empresaId]
        )

        // Obtener historial de pagos desde pagos_credito
        let pagos = []
        try {
            const [pagosList] = await connection.execute(
                `SELECT 
                    pc.id,
                    pc.referencia_pago as numero_comprobante,
                    pc.monto_pagado as monto,
                    pc.fecha_pago as fecha,
                    'pago' as tipo,
                    pc.metodo_pago as referencia
                FROM pagos_credito pc
                WHERE pc.cliente_id = ? AND pc.empresa_id = ?
                ORDER BY pc.fecha_pago DESC
                LIMIT 50`,
                [clienteId, empresaId]
            )
            pagos = pagosList || []
        } catch (err) {
            console.log('Error al obtener pagos_credito:', err.message)
        }

        connection.release()

        const historial = [...ventas, ...pagos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

        return NextResponse.json({
            success: true,
            historial
        })
    } catch (error) {
        console.error('Error al obtener historial:', error)
        if (connection) connection.release()
        return NextResponse.json(
            { success: false, mensaje: 'Error al cargar historial' },
            { status: 500 }
        )
    }
}
