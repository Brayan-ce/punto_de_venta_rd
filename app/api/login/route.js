import { NextResponse } from 'next/server'
import db from '@/_DB/db'
import bcrypt from 'bcrypt'

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
                e.nombre_empresa
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

        if (usuario.tipo === 'superadmin') {
            connection.release()
            return NextResponse.json({
                success: false,
                mensaje: 'Acceso denegado. Los superadmins solo pueden acceder desde la web'
            }, { status: 403 })
        }

        if (usuario.tipo !== 'admin' && usuario.tipo !== 'vendedor') {
            connection.release()
            return NextResponse.json({
                success: false,
                mensaje: 'Tipo de usuario no permitido en la app movil'
            }, { status: 403 })
        }

        connection.release()

        return NextResponse.json({
            success: true,
            mensaje: 'Inicio de sesion exitoso',
            tipo: usuario.tipo,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                tipo: usuario.tipo,
                empresa_id: usuario.empresa_id,
                nombre_empresa: usuario.nombre_empresa
            }
        }, { status: 200 })

    } catch (error) {
        console.error('Error al iniciar sesion:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json({
            success: false,
            mensaje: 'Error al procesar la solicitud'
        }, { status: 500 })
    }
}