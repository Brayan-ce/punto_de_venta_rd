import { NextResponse } from 'next/server'
import db from '@/_DB/db'
import bcrypt from 'bcrypt'

export const runtime = 'nodejs'

export async function POST(request) {
    let connection
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ success: false, mensaje: 'Email y contrasena son requeridos' }, { status: 400 })
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
            return NextResponse.json({ success: false, mensaje: 'Solo los administradores pueden poner la empresa online' }, { status: 403 })
        }

        if (!usuario.empresa_id) {
            connection.release()
            return NextResponse.json({ success: false, mensaje: 'Este usuario no tiene una empresa asociada' }, { status: 403 })
        }

        // Poner la empresa ONLINE de nuevo: quitar modo_offline y modo_offline_confirmado.
        await connection.execute(
            `INSERT INTO settings (empresa_id, name, value, updated_at)
             VALUES (?, 'modo_offline', '0', NOW())
             ON DUPLICATE KEY UPDATE value = '0', updated_at = NOW()`,
            [usuario.empresa_id]
        )
        await connection.execute(
            `INSERT INTO settings (empresa_id, name, value, updated_at)
             VALUES (?, 'modo_offline_confirmado', '0', NOW())
             ON DUPLICATE KEY UPDATE value = '0', updated_at = NOW()`,
            [usuario.empresa_id]
        )

        const { invalidarCacheModoOffline } = await import('@/_DB/db')
        await invalidarCacheModoOffline(usuario.empresa_id)

        connection.release()
        return NextResponse.json({ success: true, mensaje: 'La empresa volvio a estar online' }, { status: 200 })

    } catch (error) {
        console.error('Error al poner online:', error)

        if (connection) {
            try { connection.release() } catch (_) {}
        }

        return NextResponse.json({ success: false, mensaje: 'Error al poner la empresa online' }, { status: 500 })
    }
}