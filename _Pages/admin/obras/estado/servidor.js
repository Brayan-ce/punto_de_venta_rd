"use server"

import db from "@/_DB/db"
import { obtenerUsuarioActual, validarPermisoObras } from '../lib'
import { ESTADOS_OBRA } from '../../core/construction/estados'

/**
 * Cambiar estado de obra
 */
export async function cambiarEstadoObra(obraId, nuevoEstado, razon = null) {
    let connection
    try {
        const usuario = await obtenerUsuarioActual()
        validarPermisoObras(usuario)

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Verificar que la obra existe y pertenece a la empresa
        const [obraExistente] = await connection.execute(
            `SELECT * FROM obras WHERE id = ? AND empresa_id = ?`,
            [obraId, usuario.empresaId]
        )

        if (obraExistente.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Obra no encontrada'
            }
        }

        const obra = obraExistente[0]

        // Validar transición de estado básica
        const estadosValidos = Object.values(ESTADOS_OBRA)
        if (!estadosValidos.includes(nuevoEstado)) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: `Estado inválido: ${nuevoEstado}`
            }
        }

        // Preparar actualización
        const updates = {
            estado: nuevoEstado,
            modificado_por: usuario.id
        }

        // Si se finaliza, registrar fecha
        if (nuevoEstado === ESTADOS_OBRA.FINALIZADA) {
            updates.fecha_fin_real = new Date().toISOString().split('T')[0]
        }

        // Construir observaciones si hay razón
        let observaciones = obra.observaciones || ''
        if (razon) {
            const timestamp = new Date().toISOString()
            observaciones += `\n[${timestamp}] Estado cambiado a ${nuevoEstado}: ${razon}`
        } else {
            const timestamp = new Date().toISOString()
            observaciones += `\n[${timestamp}] Estado cambiado a ${nuevoEstado}`
        }

        // Actualizar estado
        await connection.execute(
            `UPDATE obras SET
                estado = ?,
                fecha_fin_real = ?,
                observaciones = ?,
                actualizado_por = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = ? AND empresa_id = ?`,
            [
                updates.estado,
                updates.fecha_fin_real || null,
                observaciones.trim(),
                updates.modificado_por,
                obraId,
                usuario.empresaId
            ]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: `Obra cambiada a estado: ${nuevoEstado}`
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return {
            success: false,
            mensaje: error.message || 'Error al cambiar estado'
        }
    }
}

