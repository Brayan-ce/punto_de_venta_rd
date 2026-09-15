export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request) {
    try {
        const { obtenerSesionFirmada } = await import('@/lib/auth/session')
        const sesion = await obtenerSesionFirmada()
        if (!sesion || !['admin', 'superadmin'].includes(sesion.tipo)) {
            return Response.json({ success: false, mensaje: 'Acceso no autorizado' }, { status: 403 })
        }
        const formData = await request.formData()
        const file = formData.get('video')

        if (!(file instanceof File) || !file.type.startsWith('video/') || file.size > 100 * 1024 * 1024) {
            return Response.json({ success: false, mensaje: 'El archivo debe ser un video de hasta 100 MB' }, { status: 400 })
        }

        // Reenviar al Flask en loopback (server-to-server, sin CORS)
        const fd = new FormData()
        fd.append('video', file)

        const uploadUrl = process.env.VPS_UPLOAD_URL || 'http://127.0.0.1:5000/upload'
        const res = await fetch(uploadUrl, { method: 'POST', body: fd })

        if (!res.ok) {
            return Response.json({ success: false, mensaje: `Error del servidor de uploads: ${res.status}` }, { status: 500 })
        }

        const data = await res.json()
        return Response.json(data)

    } catch (error) {
        console.error('Error en upload-video:', error)
        return Response.json({ success: false, mensaje: 'No se pudo procesar el video' }, { status: 500 })
    }
}