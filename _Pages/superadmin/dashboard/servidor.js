"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerEstadisticasDashboard() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [totalEmpresas] = await connection.execute(
            'SELECT COUNT(*) as total FROM empresas'
        )

        const [empresasActivas] = await connection.execute(
            'SELECT COUNT(*) as total FROM empresas WHERE activo = true'
        )

        const [solicitudesPendientes] = await connection.execute(
            'SELECT COUNT(*) as total FROM solicitudes_registro WHERE estado = "pendiente"'
        )

        const [totalUsuarios] = await connection.execute(
            'SELECT COUNT(*) as total FROM usuarios WHERE activo = true'
        )

        const [usuariosSuperAdmin] = await connection.execute(
            'SELECT COUNT(*) as total FROM usuarios WHERE tipo = "superadmin" AND activo = true'
        )

        const [usuariosAdmin] = await connection.execute(
            'SELECT COUNT(*) as total FROM usuarios WHERE tipo = "admin" AND activo = true'
        )

        const [usuariosVendedor] = await connection.execute(
            'SELECT COUNT(*) as total FROM usuarios WHERE tipo = "vendedor" AND activo = true'
        )

        const [ultimasEmpresas] = await connection.execute(
            `SELECT id, nombre_empresa, rnc, activo 
            FROM empresas 
            ORDER BY fecha_creacion DESC 
            LIMIT 5`
        )

        const [solicitudesRecientes] = await connection.execute(
            `SELECT id, nombre, nombre_empresa, estado 
            FROM solicitudes_registro 
            ORDER BY fecha_solicitud DESC 
            LIMIT 5`
        )

        connection.release()

        return {
            success: true,
            estadisticas: {
                totalEmpresas: totalEmpresas[0].total,
                empresasActivas: empresasActivas[0].total,
                solicitudesPendientes: solicitudesPendientes[0].total,
                totalUsuarios: totalUsuarios[0].total,
                usuariosSuperAdmin: usuariosSuperAdmin[0].total,
                usuariosAdmin: usuariosAdmin[0].total,
                usuariosVendedor: usuariosVendedor[0].total,
                ultimasEmpresas: ultimasEmpresas,
                solicitudesRecientes: solicitudesRecientes
            }
        }

    } catch (error) {
        console.error('Error al obtener estadisticas:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar estadisticas'
        }
    }
}