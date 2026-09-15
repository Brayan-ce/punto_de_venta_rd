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
            return NextResponse.json({
                success: false,
                mensaje: 'Email y contrasena son requeridos'
            }, { status: 400 })
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT 
                u.id,
                u.empresa_id,
                u.nombre,
                u.email,
                u.password,
                u.tipo,
                u.activo,
                u.system_mode,
                u.offline_habilitado,
                e.nombre_empresa,
                e.rnc,
                e.razon_social,
                e.nombre_comercial,
                e.actividad_economica,
                e.direccion,
                e.sector,
                e.municipio,
                e.provincia,
                e.telefono,
                e.email AS empresa_email,
                e.moneda,
                e.simbolo_moneda,
                e.logo_url,
                e.impuesto_nombre,
                e.impuesto_porcentaje
            FROM usuarios u
            LEFT JOIN empresas e ON u.empresa_id = e.id
            WHERE u.email = ?`,
            [email]
        )

        if (usuarios.length === 0) {
            connection.release()
            return NextResponse.json({
                success: false,
                mensaje: 'Credenciales invalidas'
            }, { status: 401 })
        }

        const usuario = usuarios[0]

        if (!usuario.activo) {
            connection.release()
            return NextResponse.json({
                success: false,
                mensaje: 'Usuario inactivo. Contacta al administrador'
            }, { status: 403 })
        }

        const passwordValida = await bcrypt.compare(password, usuario.password)

        if (!passwordValida) {
            connection.release()
            return NextResponse.json({
                success: false,
                mensaje: 'Credenciales invalidas'
            }, { status: 401 })
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
            return NextResponse.json({
                success: false,
                mensaje: 'Este usuario no tiene una empresa asociada'
            }, { status: 403 })
        }

        connection.release()

        return NextResponse.json({
            success: true,
            mensaje: 'Inicio de sesion exitoso',
            esAdmin: true,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                tipo: usuario.tipo,
                empresa_id: usuario.empresa_id,
                system_mode: usuario.system_mode,
                offline_habilitado: !!usuario.offline_habilitado
            },
            empresa: {
                id: usuario.empresa_id,
                nombre_empresa: usuario.nombre_empresa,
                rnc: usuario.rnc,
                razon_social: usuario.razon_social,
                nombre_comercial: usuario.nombre_comercial,
                actividad_economica: usuario.actividad_economica,
                direccion: usuario.direccion,
                sector: usuario.sector,
                municipio: usuario.municipio,
                provincia: usuario.provincia,
                telefono: usuario.telefono,
                email: usuario.empresa_email,
                moneda: usuario.moneda,
                simbolo_moneda: usuario.simbolo_moneda,
                logo_url: usuario.logo_url,
                impuesto_nombre: usuario.impuesto_nombre,
                impuesto_porcentaje: usuario.impuesto_porcentaje
            }
        }, { status: 200 })

    } catch (error) {
        console.error('Error al iniciar sesion movil:', error)

        if (connection) {
            connection.release()
        }

        return NextResponse.json({
            success: false,
            mensaje: 'Error al procesar la solicitud'
        }, { status: 500 })
    }
}
