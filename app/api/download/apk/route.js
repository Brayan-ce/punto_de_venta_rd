import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

export async function GET() {
    const apkPath = path.join(process.cwd(), '_Aplicacion_Movil', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')

    try {
        const apk = await readFile(apkPath)
        return new Response(apk, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Disposition': 'attachment; filename="isiweek-debug.apk"',
                'Content-Length': String(apk.length),
                'Cache-Control': 'no-store'
            }
        })
    } catch {
        return Response.json({ success: false, mensaje: 'APK no disponible' }, { status: 404 })
    }
}
