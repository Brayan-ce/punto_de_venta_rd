/**
 * ============================================
 * API ENDPOINTS PARA MÓDULOS
 * ============================================
 * 
 * GET /api/modulos - Obtener módulos habilitados para la empresa del usuario
 * GET /api/modulos/todos - Obtener todos los módulos (solo superadmin)
 * POST /api/modulos/toggle - Habilitar/deshabilitar módulo (solo superadmin)
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
    obtenerModulosEmpresa,
    obtenerTodosModulos,
    toggleModuloEmpresa,
    verificarModuloHabilitado
} from '@/lib/modulos/servidor'

/**
 * GET /api/modulos
 * Obtener módulos habilitados para la empresa del usuario autenticado
 */
export async function GET(request) {
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        // Verificar autenticación
        if (!empresaId) {
            return NextResponse.json({
                success: false,
                mensaje: 'No autenticado'
            }, { status: 401 })
        }

        // Si es superadmin, puede obtener todos los módulos
        const { searchParams } = new URL(request.url)
        const todos = searchParams.get('todos') === 'true'

        if (todos && userTipo === 'superadmin') {
            const modulos = await obtenerTodosModulos()
            return NextResponse.json({
                success: true,
                modulos
            })
        }

        // Obtener módulos de la empresa del usuario
        const modulos = await obtenerModulosEmpresa(parseInt(empresaId))

        return NextResponse.json({
            success: true,
            modulos
        })

    } catch (error) {
        console.error('Error en GET /api/modulos:', error)
        return NextResponse.json({
            success: false,
            mensaje: 'Error al obtener módulos'
        }, { status: 500 })
    }
}

/**
 * POST /api/modulos/toggle
 * Habilitar/deshabilitar módulo para una empresa (solo superadmin)
 */
export async function POST(request) {
    try {
        const cookieStore = await cookies()
        const userTipo = cookieStore.get('userTipo')?.value

        // Solo superadmin puede habilitar/deshabilitar módulos
        if (userTipo !== 'superadmin') {
            return NextResponse.json({
                success: false,
                mensaje: 'No autorizado. Solo superadmin puede gestionar módulos'
            }, { status: 403 })
        }

        const body = await request.json()
        const { empresaId, moduloId, habilitado } = body

        if (!empresaId || !moduloId || typeof habilitado !== 'boolean') {
            return NextResponse.json({
                success: false,
                mensaje: 'Parámetros inválidos. Se requiere empresaId, moduloId y habilitado'
            }, { status: 400 })
        }

        const resultado = await toggleModuloEmpresa(
            parseInt(empresaId),
            parseInt(moduloId),
            habilitado
        )

        if (!resultado.success) {
            return NextResponse.json(resultado, { status: 400 })
        }

        return NextResponse.json(resultado)

    } catch (error) {
        console.error('Error en POST /api/modulos/toggle:', error)
        return NextResponse.json({
            success: false,
            mensaje: 'Error al actualizar módulo'
        }, { status: 500 })
    }
}

