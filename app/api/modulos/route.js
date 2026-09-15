import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import db from '@/_DB/db'
import {
    obtenerModulosEmpresa,
    obtenerTodosModulos,
    toggleModuloEmpresa
} from '@/lib/modulos/servidor'

export async function GET(request) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || !userId) {
            return NextResponse.json({
                success: false,
                mensaje: 'No autenticado'
            }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const todos = searchParams.get('todos') === 'true'

        if (todos && userTipo === 'superadmin') {
            const modulos = await obtenerTodosModulos()
            return NextResponse.json({
                success: true,
                modulos
            })
        }

        connection = await db.getConnection()

        const [usuario] = await connection.execute(
            'SELECT email, system_mode FROM usuarios WHERE id = ? AND empresa_id = ?',
            [userId, empresaId]
        )

        connection.release()

        if (usuario.length === 0) {
            return NextResponse.json({
                success: false,
                mensaje: 'Usuario no encontrado'
            }, { status: 404 })
        }

        const userEmail = usuario[0].email
        const systemMode = usuario[0].system_mode

        let modulos = await obtenerModulosEmpresa(parseInt(empresaId))

        if (systemMode === 'OBRAS') {
            modulos = modulos.filter(m => {
                if (m.codigo === 'core') return true
                if (m.codigo === 'constructora') return true
                return false
            })
        }

        return NextResponse.json({
            success: true,
            modulos,
            systemMode
        })

    } catch (error) {
        console.error('Error en GET /api/modulos:', error)

        if (connection) {
            connection.release()
        }

        return NextResponse.json({
            success: false,
            mensaje: 'Error al obtener módulos'
        }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const cookieStore = await cookies()
        const userTipo = cookieStore.get('userTipo')?.value

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