"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerDatosEmpresa() {
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        const connection = await db.getConnection()
        const [rows] = await connection.query(
            'SELECT moneda, simbolo_moneda, impuesto_porcentaje, nombre_empresa FROM empresas WHERE id = ? LIMIT 1',
            [empresaId]
        )
        connection.release()

        const e = rows[0]
        return {
            success: true,
            empresa: {
                moneda: e?.moneda || 'DOP',
                simbolo_moneda: e?.simbolo_moneda || 'RD$',
                locale: e?.moneda === 'USD' ? 'en-US' : 'es-DO',
                itbis_incluido: true,
                nombre: e?.nombre_empresa || '',
            }
        }
    } catch (error) {
        console.error('Error al obtener datos empresa:', error)
        return { success: false, mensaje: 'Error al obtener datos de la empresa' }
    }
}
