"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function getCreds() {
    const cookieStore = await cookies()
    return {
        userId: cookieStore.get('userId')?.value,
        empresaId: cookieStore.get('empresaId')?.value,
        userTipo: cookieStore.get('userTipo')?.value
    }
}

export async function obtenerCajaActivaParaGastos() {
    let connection
    try {
        const { userId, empresaId } = await getCreds()
        if (!userId || !empresaId) return { success: false, caja: null }

        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT id, numero_caja, DATE_FORMAT(fecha_caja, '%Y-%m-%d') as fecha_caja
             FROM cajas
             WHERE empresa_id = ? AND usuario_id = ? AND estado = 'abierta'
             ORDER BY fecha_apertura DESC LIMIT 1`,
            [empresaId, userId]
        )
        connection.release()
        return { success: true, caja: rows[0] || null }
    } catch (e) {
        if (connection) connection.release()
        return { success: false, caja: null }
    }
}

export async function obtenerGastos() {
    let connection
    try {
        const { userId, empresaId } = await getCreds()
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()
        const [gastos] = await connection.execute(
            `SELECT g.id, g.concepto, g.monto, g.categoria, g.comprobante_numero,
                    g.notas, g.fecha_gasto, g.caja_id,
                    u.nombre as usuario_nombre,
                    c.numero_caja as caja_numero
             FROM gastos g
             INNER JOIN usuarios u ON g.usuario_id = u.id
             LEFT JOIN cajas c ON g.caja_id = c.id
             WHERE g.empresa_id = ?
             ORDER BY g.fecha_gasto DESC`,
            [empresaId]
        )
        connection.release()
        return { success: true, gastos }
    } catch (e) {
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar gastos' }
    }
}

export async function obtenerGasto(gastoId) {
    let connection
    try {
        const { userId, empresaId } = await getCreds()
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT g.id, g.concepto, g.monto, g.categoria, g.comprobante_numero,
                    g.notas, g.fecha_gasto, g.caja_id,
                    u.nombre as usuario_nombre,
                    c.numero_caja as caja_numero
             FROM gastos g
             INNER JOIN usuarios u ON g.usuario_id = u.id
             LEFT JOIN cajas c ON g.caja_id = c.id
             WHERE g.id = ? AND g.empresa_id = ?`,
            [gastoId, empresaId]
        )
        connection.release()
        if (!rows.length) return { success: false, mensaje: 'Gasto no encontrado' }
        return { success: true, gasto: rows[0] }
    } catch (e) {
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar gasto' }
    }
}

export async function crearGasto(datosGasto) {
    let connection
    try {
        const { userId, empresaId } = await getCreds()
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        // Verificar caja activa obligatoriamente
        const [cajas] = await connection.execute(
            `SELECT id, numero_caja FROM cajas
             WHERE empresa_id = ? AND usuario_id = ? AND estado = 'abierta'
             ORDER BY fecha_apertura DESC LIMIT 1`,
            [empresaId, userId]
        )

        if (!cajas.length) {
            connection.release()
            return { success: false, mensaje: 'Debes tener una caja abierta para registrar gastos.' }
        }

        const cajaId = cajas[0].id

        const [res] = await connection.execute(
            `INSERT INTO gastos (empresa_id, usuario_id, caja_id, concepto, monto, categoria, comprobante_numero, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId, userId, cajaId,
                datosGasto.concepto.trim(),
                parseFloat(datosGasto.monto),
                datosGasto.categoria?.trim() || null,
                datosGasto.comprobante_numero?.trim() || null,
                datosGasto.notas?.trim() || null
            ]
        )

        // Actualizar total_gastos en la caja
        await connection.execute(
            `UPDATE cajas SET total_gastos = (
                SELECT COALESCE(SUM(monto), 0) FROM gastos WHERE caja_id = ?
             ) WHERE id = ?`,
            [cajaId, cajaId]
        )

        connection.release()
        return { success: true, mensaje: 'Gasto registrado exitosamente', gastoId: res.insertId, cajaNumero: cajas[0].numero_caja }
    } catch (e) {
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al registrar el gasto' }
    }
}

export async function actualizarGasto(gastoId, datosGasto) {
    let connection
    try {
        const { userId, empresaId, userTipo } = await getCreds()
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesión inválida' }
        if (userTipo !== 'admin') return { success: false, mensaje: 'Sin permisos' }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id, caja_id FROM gastos WHERE id = ? AND empresa_id = ?`,
            [gastoId, empresaId]
        )
        if (!existe.length) { connection.release(); return { success: false, mensaje: 'Gasto no encontrado' } }

        await connection.execute(
            `UPDATE gastos SET concepto=?, monto=?, categoria=?, comprobante_numero=?, notas=?
             WHERE id = ? AND empresa_id = ?`,
            [
                datosGasto.concepto.trim(),
                parseFloat(datosGasto.monto),
                datosGasto.categoria?.trim() || null,
                datosGasto.comprobante_numero?.trim() || null,
                datosGasto.notas?.trim() || null,
                gastoId, empresaId
            ]
        )

        // Recalcular total_gastos de la caja asociada
        if (existe[0].caja_id) {
            await connection.execute(
                `UPDATE cajas SET total_gastos = (
                    SELECT COALESCE(SUM(monto), 0) FROM gastos WHERE caja_id = ?
                 ) WHERE id = ?`,
                [existe[0].caja_id, existe[0].caja_id]
            )
        }

        connection.release()
        return { success: true, mensaje: 'Gasto actualizado exitosamente' }
    } catch (e) {
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar el gasto' }
    }
}

export async function eliminarGasto(gastoId) {
    let connection
    try {
        const { userId, empresaId, userTipo } = await getCreds()
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesión inválida' }
        if (userTipo !== 'admin') return { success: false, mensaje: 'Sin permisos' }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id, caja_id FROM gastos WHERE id = ? AND empresa_id = ?`,
            [gastoId, empresaId]
        )
        if (!existe.length) { connection.release(); return { success: false, mensaje: 'Gasto no encontrado' } }

        const cajaId = existe[0].caja_id

        await connection.execute(`DELETE FROM gastos WHERE id = ? AND empresa_id = ?`, [gastoId, empresaId])

        if (cajaId) {
            await connection.execute(
                `UPDATE cajas SET total_gastos = (
                    SELECT COALESCE(SUM(monto), 0) FROM gastos WHERE caja_id = ?
                 ) WHERE id = ?`,
                [cajaId, cajaId]
            )
        }

        connection.release()
        return { success: true, mensaje: 'Gasto eliminado exitosamente' }
    } catch (e) {
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al eliminar el gasto' }
    }
}

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const { userId, empresaId } = await getCreds()
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT moneda, simbolo_moneda, locale, impuesto_nombre, impuesto_porcentaje
             FROM empresas
             WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )
        connection.release()

        if (rows.length === 0) return { success: false, mensaje: 'Empresa no encontrada' }
        return { success: true, empresa: rows[0] }
    } catch (e) {
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al obtener datos empresa' }
    }
}