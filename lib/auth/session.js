import crypto from 'node:crypto'
import { cookies } from 'next/headers'

const MAX_AGE = 60 * 60 * 24 * 7

function secretoSesion() {
    const secreto = process.env.SESSION_COOKIE_SECRET
    if (!secreto) throw new Error('No hay una clave de sesión configurada')
    return secreto
}

function contenidoFirma({ id, tipo, empresaId }) {
    return `${id}.${tipo}.${empresaId || ''}`
}

export function firmarSesion(usuario) {
    return crypto.createHmac('sha256', secretoSesion())
        .update(contenidoFirma({ id: usuario.id, tipo: usuario.tipo, empresaId: usuario.empresa_id }))
        .digest('base64url')
}

export async function obtenerSesionFirmada() {
    const cookieStore = await cookies()
    const id = cookieStore.get('userId')?.value
    const tipo = cookieStore.get('userTipo')?.value
    const empresaId = cookieStore.get('empresaId')?.value
    const firma = cookieStore.get('sessionSignature')?.value
    if (!id || !tipo || !firma) return null

    const esperada = crypto.createHmac('sha256', secretoSesion())
        .update(contenidoFirma({ id, tipo, empresaId }))
        .digest('base64url')
    const recibida = Buffer.from(firma)
    const firmaEsperada = Buffer.from(esperada)
    if (recibida.length !== firmaEsperada.length || !crypto.timingSafeEqual(recibida, firmaEsperada)) return null

    return { id, tipo, empresaId }
}

export const opcionesCookieSesion = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development' || process.env.HTTPS === 'true',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/'
}