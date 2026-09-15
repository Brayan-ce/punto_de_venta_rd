import { NextResponse } from 'next/server'
import { printInvoice } from '@/lib/printer/printerService'
import { requirePrinterSession } from '@/lib/printer/auth'

export const runtime = 'nodejs'

export async function POST(request) {
    try {
        await requirePrinterSession(request)
        const invoice = await request.json()
        const result = await printInvoice(invoice)
        return NextResponse.json(result)
    } catch (error) {
        console.error('Error de impresión LAN:', error)
        const status = error.message === 'Sesión no válida para imprimir' ? 401 : 503
        return NextResponse.json({
            success: false,
            error: error.message || 'No se pudo imprimir la factura'
        }, { status })
    }
}