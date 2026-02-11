"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerGastos() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [gastos] = await connection.execute(
            `SELECT 
                g.id,
                g.concepto,
                g.monto,
                g.categoria,
                g.comprobante_numero,
                g.notas,
                g.fecha_gasto,
                u.nombre as usuario_nombre
            FROM gastos g
            INNER JOIN usuarios u ON g.usuario_id = u.id
            WHERE g.empresa_id = ?
            ORDER BY g.fecha_gasto DESC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            gastos: gastos
        }

    } catch (error) {
        console.error('Error al obtener gastos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar gastos'
        }
    }
}

export async function obtenerGasto(gastoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [gastos] = await connection.execute(
            `SELECT 
                g.id,
                g.concepto,
                g.monto,
                g.categoria,
                g.comprobante_numero,
                g.notas,
                g.fecha_gasto,
                u.nombre as usuario_nombre
            FROM gastos g
            INNER JOIN usuarios u ON g.usuario_id = u.id
            WHERE g.id = ? AND g.empresa_id = ?`,
            [gastoId, empresaId]
        )

        if (gastos.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Gasto no encontrado'
            }
        }

        connection.release()

        return {
            success: true,
            gasto: gastos[0]
        }

    } catch (error) {
        console.error('Error al obtener gasto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar gasto'
        }
    }
}

export async function crearGasto(datosGasto) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear gastos'
            }
        }

        connection = await db.getConnection()

        const [resultado] = await connection.execute(
            `INSERT INTO gastos (
                empresa_id,
                usuario_id,
                concepto,
                monto,
                categoria,
                comprobante_numero,
                notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                userId,
                datosGasto.concepto.trim(),
                parseFloat(datosGasto.monto),
                datosGasto.categoria?.trim() || null,
                datosGasto.comprobante_numero?.trim() || null,
                datosGasto.notas?.trim() || null
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Gasto registrado exitosamente',
            gastoId: resultado.insertId
        }

    } catch (error) {
        console.error('Error al crear gasto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al registrar el gasto'
        }
    }
}

export async function actualizarGasto(gastoId, datosGasto) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar gastos'
            }
        }

        connection = await db.getConnection()

        const [gastoExiste] = await connection.execute(
            `SELECT id FROM gastos WHERE id = ? AND empresa_id = ?`,
            [gastoId, empresaId]
        )

        if (gastoExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Gasto no encontrado'
            }
        }

        await connection.execute(
            `UPDATE gastos SET
                concepto = ?,
                monto = ?,
                categoria = ?,
                comprobante_numero = ?,
                notas = ?
            WHERE id = ? AND empresa_id = ?`,
            [
                datosGasto.concepto.trim(),
                parseFloat(datosGasto.monto),
                datosGasto.categoria?.trim() || null,
                datosGasto.comprobante_numero?.trim() || null,
                datosGasto.notas?.trim() || null,
                gastoId,
                empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Gasto actualizado exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar gasto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el gasto'
        }
    }
}

export async function eliminarGasto(gastoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar gastos'
            }
        }

        connection = await db.getConnection()

        const [gastoExiste] = await connection.execute(
            `SELECT id FROM gastos WHERE id = ? AND empresa_id = ?`,
            [gastoId, empresaId]
        )

        if (gastoExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Gasto no encontrado'
            }
        }

        await connection.execute(
            `DELETE FROM gastos WHERE id = ? AND empresa_id = ?`,
            [gastoId, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Gasto eliminado exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar gasto:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar el gasto'
        }
    }
}