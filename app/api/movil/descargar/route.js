import { NextResponse } from 'next/server'
import db from '@/_DB/db'
import bcrypt from 'bcrypt'
import { descargarDatosEmpresa } from '@/lib/offline/offlineServidor'

export const runtime = 'nodejs'

export async function POST(request) {
    let connection
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({
                success: false,
                mensaje: 'Email y contrasena son requeridos'
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
            return NextResponse.json({
                success: false,
                mensaje: 'Solo los administradores pueden importar los datos de la empresa a la aplicacion movil'
            }, { status: 403 })
        }

        if (!usuario.empresa_id) {
            connection.release()
            return NextResponse.json({ success: false, mensaje: 'Este usuario no tiene una empresa asociada' }, { status: 403 })
        }

        // Reusar la descarga de la web, permitiendo que el admin descargue
        // aunque el modo offline no este habilitado en la web.
        const resultado = await descargarDatosEmpresa(
            connection,
            usuario.id,
            usuario.empresa_id,
            { verificarOfflineHabilitado: false }
        )

        if (!resultado.success) {
            return NextResponse.json(resultado, { status: 400 })
        }

        // La empresa queda en modo offline total: nadie podrá modificarla desde la web
        // hasta que el móvil suba los cambios (api/movil/subir), que la vuelve online.
        try {
            await connection.execute(
                `INSERT INTO settings (empresa_id, name, value, updated_at)
                 VALUES (?, 'modo_offline', '1', NOW())
                 ON DUPLICATE KEY UPDATE value = '1', updated_at = NOW()`,
                [usuario.empresa_id]
            )
            const { invalidarCacheModoOffline } = await import('@/_DB/db')
            await invalidarCacheModoOffline(usuario.empresa_id)
        } catch (e) {
            console.error('Error al poner la empresa en modo offline:', e.message)
        }

        const datosJson = {
            version: 3,
            exportado: new Date().toISOString(),
            empresa_id: resultado.empresa_id,
            usuario: resultado.usuario || null,
            empresa: resultado.empresa || null,
            errores_descarga: resultado.errores_descarga || [],
            tablas: resultado.tablas || {},
        }

        return NextResponse.json({
            success: true,
            mensaje: 'Base de datos descargada',
            datos: datosJson
        }, { status: 200 })

    } catch (error) {
        console.error('Error al descargar datos movil:', error)

        if (connection) {
            try { connection.release() } catch (_) {}
        }

        return NextResponse.json({
            success: false,
            mensaje: 'Error al descargar los datos'
        }, { status: 500 })
    }
}
