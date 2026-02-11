import { NextResponse } from 'next/server'
import db from '@/_DB/db'

export async function POST(request) {
    let connection
    try {
        const body = await request.json()
        const { userId, empresaId, userTipo } = body

        if (!userId || !empresaId) {
            return NextResponse.json({
                success: false,
                mensaje: 'Sesion invalida'
            }, { status: 400 })
        }

        if (userTipo !== 'admin' && userTipo !== 'vendedor') {
            return NextResponse.json({
                success: false,
                mensaje: 'Acceso no autorizado'
            }, { status: 403 })
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT 
                id,
                nombre,
                email,
                avatar_url,
                tipo
            FROM usuarios
            WHERE id = ? AND empresa_id = ? AND activo = TRUE`,
            [userId, empresaId]
        )

        if (usuarios.length === 0) {
            connection.release()
            return NextResponse.json({
                success: false,
                mensaje: 'Usuario no encontrado'
            }, { status: 404 })
        }

        const [empresas] = await connection.execute(
            `SELECT 
                id,
                nombre_empresa,
                rnc,
                logo_url
            FROM empresas
            WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )

        const [plataforma] = await connection.execute(
            `SELECT logo_url FROM plataforma_config WHERE logo_url IS NOT NULL AND logo_url != '' LIMIT 1`
        )

        connection.release()

        const logoPlataformaSistema = plataforma.length > 0 && plataforma[0].logo_url ? plataforma[0].logo_url : null

        return NextResponse.json({
            success: true,
            usuario: usuarios[0],
            empresa: empresas.length > 0 ? empresas[0] : null,
            logoPlataforma: logoPlataformaSistema
        }, { status: 200 })

    } catch (error) {
        console.error('Error al obtener datos del admin:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json({
            success: false,
            mensaje: 'Error al cargar datos'
        }, { status: 500 })
    }
}