/**
 * ============================================
 * API ENDPOINT PARA VERIFICAR MÓDULO
 * ============================================
 * 
 * GET /api/modulos/verificar?codigo=pos
 * Verificar si un módulo está habilitado para la empresa del usuario
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verificarModuloHabilitado } from '@/lib/modulos/servidor'

export async function GET(request) {
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const { searchParams } = new URL(request.url)
        const codigoModulo = searchParams.get('codigo')

        if (!empresaId) {
            return NextResponse.json({
                success: false,
                mensaje: 'No autenticado'
            }, { status: 401 })
        }

        if (!codigoModulo) {
            return NextResponse.json({
                success: false,
                mensaje: 'Parámetro codigo es requerido'
            }, { status: 400 })
        }

        const habilitado = await verificarModuloHabilitado(
            parseInt(empresaId),
            codigoModulo
        )

        return NextResponse.json({
            success: true,
            codigo: codigoModulo,
            habilitado
        })

    } catch (error) {
        console.error('Error en GET /api/modulos/verificar:', error)
        return NextResponse.json({
            success: false,
            mensaje: 'Error al verificar módulo'
        }, { status: 500 })
    }
}

