"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { puedeAnular } from "../lib"

/**
 * =====================================================
 * ANULAR/SERVIDOR.JS - ANULAR CONDUCE
 * =====================================================
 */

export async function anularConduce(id, motivo) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value
        if (!empresaId || !userId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Obtener el conduce
        const [conduce] = await connection.execute(
            `SELECT * FROM conduces WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        if (conduce.length === 0) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'Conduce no encontrado' }
        }

        const con = conduce[0]

        // Validar que se puede anular usando lib.js
        if (!puedeAnular(con)) {
            await connection.rollback()
            connection.release()
            return { 
                success: false, 
                mensaje: `No se puede anular un conduce con estado: ${con.estado}` 
            }
        }

        // Obtener detalle del conduce
        const [detalle] = await connection.execute(
            `SELECT * FROM conduce_detalle WHERE conduce_id = ?`,
            [id]
        )

        // Revertir saldos
        for (const item of detalle) {
            await connection.execute(
                `UPDATE saldo_despacho
                 SET cantidad_despachada = cantidad_despachada - ?,
                     cantidad_pendiente = cantidad_pendiente + ?
                 WHERE empresa_id = ? AND tipo_origen = ? AND origen_id = ? AND producto_id = ?`,
                [
                    item.cantidad_despachada,
                    item.cantidad_despachada,
                    empresaId,
                    con.tipo_origen,
                    con.origen_id,
                    item.producto_id
                ]
            )
        }

        // Marcar conduce como anulado
        await connection.execute(
            `UPDATE conduces 
             SET estado = 'anulado', observaciones = CONCAT(COALESCE(observaciones, ''), '\n\nANULADO: ', ?)
             WHERE id = ?`,
            [motivo || 'Sin motivo especificado', id]
        )

        await connection.commit()
        connection.release()
        return { success: true, mensaje: 'Conduce anulado exitosamente' }

    } catch (error) {
        console.error('Error al anular conduce:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return { success: false, mensaje: 'Error al anular el conduce: ' + error.message }
    }
}

