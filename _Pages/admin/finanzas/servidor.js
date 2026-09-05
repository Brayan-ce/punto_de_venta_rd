"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT moneda, simbolo_moneda, locale, impuesto_nombre, impuesto_porcentaje
             FROM empresas
             WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )

        connection.release()

        if (rows.length === 0) {
            return { success: false, mensaje: 'Empresa no encontrada' }
        }

        return { success: true, empresa: rows[0] }
    } catch (error) {
        console.error('Error al obtener datos empresa:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al obtener datos empresa' }
    }
}
