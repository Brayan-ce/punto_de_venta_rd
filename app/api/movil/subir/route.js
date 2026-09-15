import { NextResponse } from 'next/server'
import db from '@/_DB/db'
import bcrypt from 'bcrypt'
import { subirBaseDatos } from '@/lib/offline/offlineServidor'

export const runtime = 'nodejs'

export async function POST(request) {
    let connection
    try {
        const body = await request.json()
        const { email, password, baseDatos } = body

        if (!email || !password || !baseDatos || typeof baseDatos !== 'object' || !baseDatos.tablas) {
            return NextResponse.json({
                success: false,
                mensaje: 'Se requieren email, contrasena y la base de datos modificada'
            }, { status: 400 })
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT u.id, u.empresa_id, u.email, u.password, u.tipo, u.activo
             FROM usuarios u
             WHERE u.email = ?`,
            [email]
        )

        if (usuarios.length === 0) {
            connection.release()
            return NextResponse.json({ success: false, mensaje: 'Credenciales invalidas' }, { status: 401 })
        }

        const usuario = usuarios[0]

        if (!usuario.activo) {
            connection.release()
            return NextResponse.json({ success: false, mensaje: 'Usuario inactivo' }, { status: 403 })
        }

        const passwordValida = await bcrypt.compare(password, usuario.password)

        if (!passwordValida) {
            connection.release()
            return NextResponse.json({ success: false, mensaje: 'Credenciales invalidas' }, { status: 401 })
        }

        if (usuario.tipo !== 'admin') {
            connection.release()
            return NextResponse.json({ success: false, mensaje: 'Solo los administradores pueden subir datos' }, { status: 403 })
        }

        if (!usuario.empresa_id) {
            connection.release()
            return NextResponse.json({ success: false, mensaje: 'Este usuario no tiene una empresa asociada' }, { status: 403 })
        }

        connection.release()

        // La subida valida que la BD pertenezca a esta empresa y, al terminar bien,
        // vuelve a poner la empresa ONLINE (quita modo_offline).
        const resultado = await subirBaseDatos(baseDatos, {
            userId: usuario.id,
            empresaId: usuario.empresa_id,
            userTipo: usuario.tipo
        })

        if (!resultado.success) {
            return NextResponse.json(resultado, { status: 400 })
        }

        return NextResponse.json({ success: true, mensaje: resultado.mensaje, tablas: resultado.tablas }, { status: 200 })

    } catch (error) {
        console.error('Error al subir datos movil:', error)

        if (connection) {
            try { connection.release() } catch (_) {}
        }

        return NextResponse.json({
            success: false,
            mensaje: 'Error al subir los datos'
        }, { status: 500 })
    }
}
