"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function credenciales() {
    const c = await cookies()
    return { userId: c.get('userId')?.value, empresaId: c.get('empresaId')?.value }
}

export async function obtenerLibroBanco() {
    let connection
    try {
        const { userId, empresaId } = await credenciales()
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesion invalida' }
        connection = await db.getConnection()
        const [bancos] = await connection.execute('SELECT id, nombre FROM bancos WHERE empresa_id = ? AND activo = TRUE ORDER BY nombre', [empresaId])
        const [cuentas] = await connection.execute(`SELECT cb.id, cb.nombre, cb.numero, cb.tipo, cb.moneda, cb.saldo_inicial, b.nombre banco_nombre,
            cb.saldo_inicial + COALESCE(SUM(CASE WHEN mb.tipo IN ('deposito','transferencia_recibida','cobro_tarjeta_credito','cobro_tarjeta_debito','nota_credito','prestamo_banco') THEN mb.monto ELSE -mb.monto END), 0) saldo_actual
            FROM cuentas_bancarias cb INNER JOIN bancos b ON b.id = cb.banco_id LEFT JOIN movimientos_bancarios mb ON mb.cuenta_bancaria_id = cb.id
            WHERE cb.empresa_id = ? AND cb.activo = TRUE GROUP BY cb.id, b.nombre ORDER BY cb.nombre`, [empresaId])
        const [movimientos] = await connection.execute(`SELECT mb.*, cb.nombre cuenta_nombre FROM movimientos_bancarios mb INNER JOIN cuentas_bancarias cb ON cb.id = mb.cuenta_bancaria_id WHERE mb.empresa_id = ? ORDER BY mb.fecha_movimiento DESC, mb.id DESC LIMIT 100`, [empresaId])
        connection.release()
        const movimientosSerializados = movimientos.map(movimiento => ({
            ...movimiento,
            fecha_movimiento: movimiento.fecha_movimiento instanceof Date
                ? movimiento.fecha_movimiento.toISOString().slice(0, 10)
                : String(movimiento.fecha_movimiento || '')
        }))

        return { success: true, bancos, cuentas, movimientos: movimientosSerializados }
    } catch (error) {
        console.error('Error libro banco:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo cargar el libro de banco' }
    }
}

export async function crearBanco(nombre) {
    let connection
    try {
        const { empresaId } = await credenciales()
        if (!empresaId || !nombre?.trim()) return { success: false, mensaje: 'Nombre requerido' }
        connection = await db.getConnection()
        await connection.execute('INSERT INTO bancos (empresa_id, nombre) VALUES (?, ?)', [empresaId, nombre.trim()])
        connection.release()
        return { success: true, mensaje: 'Banco creado' }
    } catch (error) { if (connection) connection.release(); return { success: false, mensaje: 'No se pudo crear el banco' } }
}

export async function crearCuentaBancaria(datos) {
    let connection
    try {
        const { userId, empresaId } = await credenciales()
        if (!userId || !empresaId || !datos.nombre || !datos.banco_id) return { success: false, mensaje: 'Completa banco y nombre de cuenta' }
        connection = await db.getConnection()
        await connection.execute(`INSERT INTO cuentas_bancarias (empresa_id, banco_id, nombre, numero, tipo, moneda, saldo_inicial, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [empresaId, datos.banco_id, datos.nombre.trim(), datos.numero?.trim() || null, datos.tipo || 'corriente', datos.moneda || 'DOP', Number(datos.saldo_inicial) || 0, userId])
        connection.release()
        return { success: true, mensaje: 'Cuenta bancaria creada' }
    } catch (error) { if (connection) connection.release(); return { success: false, mensaje: 'No se pudo crear la cuenta bancaria' } }
}

export async function registrarMovimientoBancario(datos) {
    let connection
    try {
        const { userId, empresaId } = await credenciales()
        if (!userId || !empresaId || !datos.cuenta_bancaria_id || !datos.tipo || !datos.concepto || Number(datos.monto) <= 0) return { success: false, mensaje: 'Completa los datos del movimiento' }
        connection = await db.getConnection()
        await connection.execute(`INSERT INTO movimientos_bancarios (empresa_id, cuenta_bancaria_id, tipo, concepto, referencia, monto, fecha_movimiento, notas, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [empresaId, datos.cuenta_bancaria_id, datos.tipo, datos.concepto.trim(), datos.referencia?.trim() || null, Number(datos.monto), datos.fecha_movimiento || new Date().toISOString().slice(0, 10), datos.notas?.trim() || null, userId])
        connection.release()
        return { success: true, mensaje: 'Movimiento registrado' }
    } catch (error) { if (connection) connection.release(); return { success: false, mensaje: 'No se pudo registrar el movimiento' } }
    }
