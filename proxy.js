import { NextResponse } from 'next/server'

const encoder = new TextEncoder()

function contenidoFirma(id, tipo, empresaId) {
  return `${id}.${tipo}.${empresaId || ''}`
}

async function firmaEsperada(id, tipo, empresaId) {
  const secreto = process.env.SESSION_COOKIE_SECRET
  if (!secreto) return null

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(contenidoFirma(id, tipo, empresaId))))
  let binario = ''
  for (const byte of bytes) binario += String.fromCharCode(byte)
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function proxy(request) {
  const { pathname } = request.nextUrl
  const userId = request.cookies.get('userId')?.value
  const userTipo = request.cookies.get('userTipo')?.value
  const empresaId = request.cookies.get('empresaId')?.value
  const firma = request.cookies.get('sessionSignature')?.value
  const tieneSesion = Boolean(userId || userTipo || empresaId || firma)

  if (tieneSesion) {
    const esperada = userId && userTipo ? await firmaEsperada(userId, userTipo, empresaId) : null
    if (!firma || !esperada || firma !== esperada) {
      const respuesta = pathname.startsWith('/api/')
        ? NextResponse.json({ success: false, mensaje: 'Sesión no válida' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url))
      for (const nombre of ['userId', 'userTipo', 'empresaId', 'sessionSignature']) respuesta.cookies.delete(nombre)
      return respuesta
    }
  }

  const rutasPublicas = [
    '/login',
    '/api/auth',
    '/api/login',
    '/_next',
    '/favicon.ico',
    '/manifest.json',
    '/offline.html',
    '/upload',
  ]

  const esRutaPublica = rutasPublicas.some(ruta => pathname.startsWith(ruta))

  if (esRutaPublica) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    try {
      if (!userId || !userTipo) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (userTipo === 'superadmin') {
        return NextResponse.next()
      }

      if (!empresaId) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      try {
        const { obtenerModuloPorRuta } = await import('@/lib/modulos/catalogo')
        const modulo = obtenerModuloPorRuta(pathname)

        if (!modulo || modulo.siempreHabilitado) {
          return NextResponse.next()
        }

        try {
          const { verificarRutaPermitida } = await import('@/lib/modulos/servidor')
          const rutaPermitida = await verificarRutaPermitida(parseInt(empresaId), pathname)

          if (!rutaPermitida) {
            const url = new URL('/admin/dashboard', request.url)
            url.searchParams.set('error', 'modulo_no_disponible')
            url.searchParams.set('modulo', modulo.nombre || 'Desconocido')
            return NextResponse.redirect(url)
          }
        } catch (serverError) {
          if (serverError.message && serverError.message.includes('stream')) {
          } else {
            console.error('Error al verificar ruta permitida:', serverError)
          }
        }
      } catch (moduloError) {
        if (moduloError.message && !moduloError.message.includes('stream')) {
          console.error('Error al verificar módulo en middleware:', moduloError)
        }
      }

    } catch (error) {
      console.error('Error en middleware de módulos:', error)
    }
  }

  if (pathname.startsWith('/superadmin')) {
    try {
      if (!userId || userTipo !== 'superadmin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      console.error('Error en middleware de superadmin:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname.startsWith('/sucursales')) {
    try {
      if (!userId || !empresaId || userTipo !== 'sucursales') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      console.error('Error en middleware de sucursales:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}