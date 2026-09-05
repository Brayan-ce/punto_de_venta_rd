export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request) {
    try {
        const formData = await request.formData()
        const file = formData.get('video')

        if (!file) {
            return Response.json({ success: false, mensaje: 'No se envió archivo' }, { status: 400 })
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
        return Response.json({ success: false, mensaje: error.message }, { status: 500 })
    }
}