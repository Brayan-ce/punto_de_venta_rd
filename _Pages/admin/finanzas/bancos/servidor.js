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

/**
 * Proveedores con cuentas por pagar pendientes + detalle de facturas.
 */
export async function obtenerPendientesProveedores() {
    let connection
    try {
        const { userId, empresaId } = await credenciales()
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesion invalida' }
        connection = await db.getConnection()

        const [proveedores] = await connection.execute(
            `SELECT p.id,
                    COALESCE(NULLIF(p.razon_social, ''), NULLIF(p.nombre_comercial, ''), CONCAT('Proveedor #', p.id)) AS nombre,
                    COALESCE(SUM(cxp.saldo_pendiente), 0) AS total_pendiente,
                    COUNT(*) AS facturas
             FROM cuentas_por_pagar cxp
             INNER JOIN proveedores p ON p.id = cxp.proveedor_id
             WHERE cxp.empresa_id = ?
               AND cxp.estado IN ('pendiente', 'parcial')
               AND cxp.saldo_pendiente > 0
             GROUP BY p.id
             ORDER BY nombre`,
            [empresaId]
        )

        const [facturas] = await connection.execute(
            `SELECT cxp.id,
                    cxp.compra_id,
                    cxp.proveedor_id,
                    cxp.monto_total,
                    cxp.monto_pagado,
                    cxp.saldo_pendiente,
                    cxp.fecha_emision,
                    cxp.fecha_vencimiento,
                    c.ncf,
                    c.fecha_compra
             FROM cuentas_por_pagar cxp
             INNER JOIN compras c ON c.id = cxp.compra_id
             WHERE cxp.empresa_id = ?
               AND cxp.estado IN ('pendiente', 'parcial')
               AND cxp.saldo_pendiente > 0
             ORDER BY cxp.fecha_emision ASC, cxp.id ASC`,
            [empresaId]
        )

        connection.release()

        const serial = (f) => ({
            ...f,
            monto_total: Number(f.monto_total || 0),
            monto_pagado: Number(f.monto_pagado || 0),
            saldo_pendiente: Number(f.saldo_pendiente || 0),
            fecha_emision: f.fecha_emision instanceof Date ? f.fecha_emision.toISOString().slice(0, 10) : String(f.fecha_emision || ''),
            fecha_vencimiento: f.fecha_vencimiento instanceof Date ? f.fecha_vencimiento.toISOString().slice(0, 10) : (f.fecha_vencimiento ? String(f.fecha_vencimiento).slice(0, 10) : null),
        })

        return {
            success: true,
            proveedores: proveedores.map(p => ({ ...p, total_pendiente: Number(p.total_pendiente || 0), facturas: Number(p.facturas || 0) })),
            facturas: facturas.map(serial)
        }
    } catch (error) {
        console.error('Error al obtener pendientes de proveedores:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudieron cargar las cuentas por pagar' }
    }
}

/**
 * Registra el pago (total o parcial) de una o varias facturas de proveedor.
 * datos: { cuenta_bancaria_id, proveedor_id, proveedor_nombre, metodo_pago,
 *          referencia, nota, fecha_pago, pagos: [{ cxp_id, monto }] }
 */
export async function registrarPagoProveedor(datos) {
    let connection
    try {
        const { userId, empresaId } = await credenciales()
        if (!userId || !empresaId) return { success: false, mensaje: 'Sesion invalida' }

        const pagos = Array.isArray(datos?.pagos)
            ? datos.pagos.filter(p => Number(p.monto) > 0)
            : []
        if (!datos?.cuenta_bancaria_id) return { success: false, mensaje: 'Selecciona la cuenta bancaria' }
        if (pagos.length === 0) return { success: false, mensaje: 'Ingresa al menos un monto a pagar' }

        connection = await db.getConnection()
        await connection.beginTransaction()

        let totalPagado = 0

        for (const pago of pagos) {
            const [rows] = await connection.execute(
                `SELECT id, compra_id, proveedor_id, monto_pagado, saldo_pendiente
                 FROM cuentas_por_pagar
                 WHERE id = ? AND empresa_id = ?
                 FOR UPDATE`,
                [pago.cxp_id, empresaId]
            )
            const cxp = rows[0]
            if (!cxp) continue

            const saldo = Number(cxp.saldo_pendiente || 0)
            const aplicar = Math.min(Number(pago.monto), saldo)
            if (!(aplicar > 0)) continue

            const concepto = `Pago a proveedor${datos.proveedor_nombre ? ' - ' + datos.proveedor_nombre : ''}`

            const [mov] = await connection.execute(
                `INSERT INTO movimientos_bancarios
                    (empresa_id, cuenta_bancaria_id, tipo, concepto, referencia, monto, fecha_movimiento, notas, creado_por)
                 VALUES (?, ?, 'pago_proveedor', ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    datos.cuenta_bancaria_id,
                    concepto,
                    datos.referencia?.trim() || null,
                    aplicar,
                    datos.fecha_pago || new Date().toISOString().slice(0, 10),
                    datos.nota?.trim() || null,
                    userId
                ]
            )

            await connection.execute(
                `INSERT INTO pagos_proveedor
                    (empresa_id, cxp_id, compra_id, proveedor_id, monto, metodo_pago,
                     cuenta_bancaria_id, movimiento_bancario_id, referencia, fecha_pago, usuario_id, nota)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    cxp.id,
                    cxp.compra_id,
                    cxp.proveedor_id,
                    aplicar,
                    datos.metodo_pago || 'transferencia',
                    datos.cuenta_bancaria_id,
                    mov.insertId,
                    datos.referencia?.trim() || null,
                    datos.fecha_pago || new Date().toISOString().slice(0, 10),
                    userId,
                    datos.nota?.trim() || null
                ]
            )

            await connection.execute(
                `UPDATE cuentas_por_pagar
                 SET monto_pagado = monto_pagado + ?,
                     saldo_pendiente = GREATEST(saldo_pendiente - ?, 0),
                     estado = CASE WHEN GREATEST(saldo_pendiente - ?, 0) <= 0 THEN 'pagada' ELSE 'parcial' END
                 WHERE id = ?`,
                [aplicar, aplicar, aplicar, cxp.id]
            )

            await connection.execute(
                `UPDATE compras
                 SET monto_pagado = monto_pagado + ?,
                     saldo_pendiente = GREATEST(saldo_pendiente - ?, 0)
                 WHERE id = ? AND empresa_id = ?`,
                [aplicar, aplicar, cxp.compra_id, empresaId]
            )

            totalPagado += aplicar
        }

        await connection.commit()
        connection.release()

        if (totalPagado <= 0) {
            return { success: false, mensaje: 'No se aplicó ningún pago' }
        }

        return {
            success: true,
            mensaje: `Pago registrado por ${new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(totalPagado)}`,
            totalPagado
        }
    } catch (error) {
        console.error('Error al registrar pago a proveedor:', error)
        if (connection) { await connection.rollback(); connection.release() }
        return { success: false, mensaje: 'No se pudo registrar el pago al proveedor' }
    }
}
