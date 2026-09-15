import { NextResponse } from 'next/server'
import { cutPaper } from '@/lib/printer/printerService'
import { requirePrinterSession } from '@/lib/printer/auth'

export const runtime = 'nodejs'

export async function POST(request) {
    try {
        await requirePrinterSession(request)
        return NextResponse.json(await cutPaper())
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.message === 'Sesión no válida para imprimir' ? 401 : 503 })
    }
}