import { NextResponse } from 'next/server'
import { getPrinterConfig } from '@/lib/printer/printerService'

export const runtime = 'nodejs'

export async function GET() {
    return NextResponse.json({ success: true, config: getPrinterConfig() })
}