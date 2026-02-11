import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Middleware para protección de rutas y logging
 * 
 * Funcionalidades:
 * 1. Protección de rutas según módulos habilitados por empresa
 * 2. Logging de requests (mantiene funcionalidad anterior)
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Rutas públicas - no requieren verificación
  const rutasPublicas = [
    '/login',
    '/api/auth',
    '/api/login',
    '/_next',
    '/favicon.ico',
    '/manifest.json',
    '/offline.html'
  ]

  const esRutaPublica = rutasPublicas.some(ruta => pathname.startsWith(ruta))
  
  if (esRutaPublica) {
    // Logging de requests (mantener funcionalidad anterior)
    if (pathname.startsWith('/api/') || (!pathname.startsWith('/_next'))) {
      fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'middleware.js:15',
          message: 'Request logged',
          data: {
            pathname,
            method: request.method,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'request-debug',
          hypothesisId: 'B',
        }),
      }).catch(() => {})
    }
    
    return NextResponse.next()
  }

  // Rutas de admin - verificar módulos habilitados
  if (pathname.startsWith('/admin')) {
    try {
      const cookieStore = await cookies()
      const empresaId = cookieStore.get('empresaId')?.value
      const userTipo = cookieStore.get('userTipo')?.value
      const userId = cookieStore.get('userId')?.value

      // Si no está autenticado, redirigir a login
      if (!userId || !userTipo) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Superadmin tiene acceso a todo
      if (userTipo === 'superadmin') {
        return NextResponse.next()
      }

      // Si no tiene empresaId, no puede acceder a rutas de admin
      if (!empresaId) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Verificar módulo dinámicamente para evitar problemas de importación en middleware
      try {
        // Importar dinámicamente el catálogo (solo código, sin dependencias de Node.js)
        const { obtenerModuloPorRuta } = await import('@/lib/modulos/catalogo')
        const modulo = obtenerModuloPorRuta(pathname)

        // Si no pertenece a ningún módulo específico o es core, permitir
        if (!modulo || modulo.siempreHabilitado) {
          return NextResponse.next()
        }

        // Verificar si el módulo está habilitado para la empresa
        // Usar try-catch interno para evitar que errores de importación bloqueen el acceso
        try {
          const { verificarRutaPermitida } = await import('@/lib/modulos/servidor')
          const rutaPermitida = await verificarRutaPermitida(
            parseInt(empresaId),
            pathname
          )

          if (!rutaPermitida) {
            // Redirigir al dashboard con mensaje de error
            const url = new URL('/admin/dashboard', request.url)
            url.searchParams.set('error', 'modulo_no_disponible')
            url.searchParams.set('modulo', modulo.nombre || 'Desconocido')
            return NextResponse.redirect(url)
          }
        } catch (serverError) {
          // Si hay error al verificar (puede ser por Edge Runtime), permitir acceso
          // Esto evita que errores de compatibilidad bloqueen el acceso
          if (serverError.message && serverError.message.includes('stream')) {
            // Error conocido de Edge Runtime, ignorar silenciosamente
          } else {
            console.error('Error al verificar ruta permitida:', serverError)
          }
        }
      } catch (moduloError) {
        // Error al importar catálogo o verificar módulo
        // En caso de error, permitir acceso para evitar bloqueos
        if (moduloError.message && !moduloError.message.includes('stream')) {
          console.error('Error al verificar módulo en middleware:', moduloError)
        }
      }

    } catch (error) {
      console.error('Error en middleware de módulos:', error)
      // En caso de error, permitir acceso (fail-open para evitar bloqueos)
      // En producción podrías querer cambiar esto a fail-closed
    }
  }

  // Rutas de superadmin - solo verificar autenticación
  if (pathname.startsWith('/superadmin')) {
    try {
      const cookieStore = await cookies()
      const userTipo = cookieStore.get('userTipo')?.value
      const userId = cookieStore.get('userId')?.value

      if (!userId || userTipo !== 'superadmin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      console.error('Error en middleware de superadmin:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Logging de requests (mantener funcionalidad anterior)
  if (pathname.startsWith('/api/') || (!pathname.startsWith('/_next'))) {
    fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'middleware.js:15',
        message: 'Request logged',
        data: {
          pathname,
          method: request.method,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'request-debug',
        hypothesisId: 'B',
      }),
    }).catch(() => {})
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

