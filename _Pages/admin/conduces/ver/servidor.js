"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * =====================================================
 * VER/SERVIDOR.JS - OBTENER DETALLE DE CONDUCE
 * =====================================================
 */

export async function obtenerDetalleConduce(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const [con] = await connection.execute(
            `SELECT c.*, cl.nombre as cliente_nombre
             FROM conduces c
             LEFT JOIN clientes cl ON c.cliente_id = cl.id
             WHERE c.id = ? AND c.empresa_id = ?`,
            [id, empresaId]
        )

        if (con.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Conduce no encontrado' }
        }

        const [detalle] = await connection.execute(
            `SELECT cd.*, p.codigo_barras
             FROM conduce_detalle cd
             LEFT JOIN productos p ON cd.producto_id = p.id
             WHERE cd.conduce_id = ?`,
            [id]
        )

        connection.release()
        return { success: true, conduce: con[0], detalle }
    } catch (error) {
        console.error('Error al obtener detalle de conduce:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar el conduce' }
    }
}

