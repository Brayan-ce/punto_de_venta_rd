import { NextResponse } from 'next/server'
import { printTest } from '@/lib/printer/printerService'
import { requirePrinterSession } from '@/lib/printer/auth'

export const runtime = 'nodejs'

export async function POST(request) {
    try {
        await requirePrinterSession(request)
        const result = await printTest()
        return NextResponse.json(result)
    } catch (error) {
        console.error('Error en prueba de impresora:', error)
        const status = error.message === 'Sesión no válida para imprimir' ? 401 : 503
        return NextResponse.json({
            success: false,
            error: error.message || 'No se pudo ejecutar la prueba de impresora'
        }, { status })
    }
}