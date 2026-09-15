export const runtime = 'nodejs'
export const maxDuration = 300

const LIMITE_BYTES = 200 * 1024 * 1024

export async function POST(request) {
    try {
        const { obtenerSesionFirmada } = await import('@/lib/auth/session')
        const sesion = await obtenerSesionFirmada()
        if (!sesion || sesion.tipo !== 'superadmin') {
            return Response.json({ success: false, mensaje: 'Acceso no autorizado' }, { status: 403 })
        }
        const formData = await request.formData()
        const file = formData.get('file')

        if (!(file instanceof File) || file.size === 0) {
            return Response.json({ success: false, mensaje: 'Selecciona un archivo válido' }, { status: 400 })
        }
        if (file.size > LIMITE_BYTES) {
            return Response.json({ success: false, mensaje: 'El archivo no puede superar los 200 MB' }, { status: 400 })
        }

        const fd = new FormData()
        fd.append('file', file, file.name)
        fd.append('folder', 'guia_archivos')

        const uploadUrl = process.env.VPS_UPLOAD_URL || 'http://127.0.0.1:5000/upload'
        const res = await fetch(uploadUrl, { method: 'POST', body: fd })

        if (!res.ok) {
            return Response.json({ success: false, mensaje: `Error del servidor de uploads: ${res.status}` }, { status: 500 })
        }

        const data = await res.json()
        if (!data.success) {
            return Response.json({ success: false, mensaje: data.mensaje || 'Error al subir el archivo' }, { status: 400 })
        }

        const baseUrl = process.env.VPS_IMAGE_BASE_URL || ''
        const url = data.ruta || (data.filename ? `${baseUrl}/${data.filename}` : null)
        if (!url) {
            return Response.json({ success: false, mensaje: 'El servidor de uploads no devolvió una ruta válida' }, { status: 500 })
        }

        return Response.json({ success: true, url, nombre_original: file.name })

    } catch (error) {
        console.error('Error en upload-guia-archivo:', error)
        return Response.json({ success: false, mensaje: 'No se pudo procesar el archivo' }, { status: 500 })
    }
}
