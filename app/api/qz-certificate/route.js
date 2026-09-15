import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

export async function GET() {
    const certificatePath = path.join(process.cwd(), 'public', 'certificates', 'isiweek-qz.cer')
    const certificate = await readFile(certificatePath, 'utf8')

    return new Response(certificate, {
        headers: {
            'Content-Type': 'application/x-x509-ca-cert',
            'Content-Disposition': 'attachment; filename="isiweek-qz.cer"',
            'Cache-Control': 'no-store'
        }
    })
}