"use server"

import db from '@/_DB/db'
import { cookies } from 'next/headers'
import fs from 'fs/promises'
import { generarFacturaPdf } from '@/lib/pagos-plataforma/facturaService'
import { enviarFacturaPorCorreo } from '@/lib/pagos-plataforma/resendService'

async function superAdminActual() {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const userTipo = cookieStore.get('userTipo')?.value
    if (!userId || userTipo !== 'superadmin') throw new Error('Acceso no autorizado')
    return Number(userId)
}

function serializar(row) {
    return JSON.parse(JSON.stringify(row, (_, value) => value instanceof Date ? value.toISOString() : value))
}

export async function obtenerPagosPlataforma(filtros = {}) {
    try {
        await superAdminActual()
        const condiciones = ['1 = 1']
        const params = []
        if (filtros.estado && filtros.estado !== 'todos') { condiciones.push('p.estado = ?'); params.push(filtros.estado) }
        if (filtros.metodo) { condiciones.push('p.metodo_pago = ?'); params.push(filtros.metodo) }
        if (filtros.desde) { condiciones.push('DATE(p.fecha_pago) >= ?'); params.push(filtros.desde) }
        if (filtros.hasta) { condiciones.push('DATE(p.fecha_pago) <= ?'); params.push(filtros.hasta) }
        if (filtros.buscar) {
            condiciones.push('(p.cliente_nombre LIKE ? OR p.negocio_nombre LIKE ? OR p.referencia LIKE ? OR CAST(p.id AS CHAR) LIKE ?)')
            const texto = `%${filtros.buscar.trim()}%`; params.push(texto, texto, texto, texto)
        }
        const connection = await db.getConnection()
        const [pagos] = await connection.execute(
            `SELECT p.*, f.id AS factura_id, f.numero_factura, f.archivo_pdf,
                    u.nombre AS confirmado_por_nombre, r.nombre AS rechazado_por_nombre
             FROM pagos_plataforma p
             LEFT JOIN facturas_plataforma f ON f.pago_id = p.id
             LEFT JOIN usuarios u ON u.id = p.confirmado_por
             LEFT JOIN usuarios r ON r.id = p.rechazado_por
             WHERE ${condiciones.join(' AND ')} ORDER BY FIELD(p.estado, 'pending', 'rejected', 'confirmed'), p.fecha_pago DESC, p.id DESC`, params
        )
        connection.release()
        return { success: true, pagos: pagos.map(serializar) }
    } catch (error) {
        return { success: false, mensaje: error.message, pagos: [] }
    }
}

export async function obtenerClientesAdministradoresPago() {
    let connection
    try {
        await superAdminActual()
        connection = await db.getConnection()
        const [empresas] = await connection.execute(
            `SELECT id, nombre_empresa FROM empresas WHERE activo = 1 ORDER BY nombre_empresa ASC`
        )
        const [administradores] = await connection.execute(
                `SELECT u.id, u.empresa_id, u.nombre, u.email, NULL AS telefono, u.tipo, e.nombre_empresa,
                          p.id AS ultimo_pago_id, p.fecha_confirmacion AS ultima_fecha_pago,
                          p.email_status AS ultimo_correo_estado, f.numero_factura AS ultima_factura
             FROM usuarios u
             INNER JOIN empresas e ON e.id = u.empresa_id
                 LEFT JOIN pagos_plataforma p ON p.id = (
                     SELECT p2.id FROM pagos_plataforma p2
                     WHERE p2.empresa_id = u.empresa_id AND p2.cliente_email = u.email AND p2.estado = 'confirmed'
                     ORDER BY p2.fecha_confirmacion DESC, p2.id DESC LIMIT 1
                 )
                 LEFT JOIN facturas_plataforma f ON f.pago_id = p.id
             WHERE u.activo = 1 AND e.activo = 1 AND u.tipo = 'admin'
             ORDER BY e.nombre_empresa ASC, u.nombre ASC`
        )
        connection.release(); connection = null
        return { success: true, empresas: empresas.map(serializar), administradores: administradores.map(serializar) }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: error.message, empresas: [], administradores: [] }
    }
}

export async function crearPagosSuscripcionMasivos(datos) {
    let connection
    try {
        const adminId = await superAdminActual()
        const monto = Number(datos.monto)
        if (!Number.isFinite(monto) || monto <= 0) return { success: false, mensaje: 'Indica un monto de suscripción válido' }
        const frecuencia = datos.frecuencia === 'daily' ? 'daily' : 'monthly'
        const ahora = new Date()
        const periodo = frecuencia === 'daily' ? ahora.toISOString().slice(0, 10) : ahora.toISOString().slice(0, 7)
        const referencia = `SUSCRIPCION-${periodo}`
        const proximaFecha = new Date(ahora)
        proximaFecha.setDate(proximaFecha.getDate() + (frecuencia === 'daily' ? 1 : 31))
        const proximaFechaTexto = proximaFecha.toISOString().slice(0, 10)
        connection = await db.getConnection()
        await connection.beginTransaction()
        const [usuarios] = await connection.execute(
            `SELECT u.id, u.empresa_id, u.nombre, u.email, e.nombre_empresa
             FROM usuarios u
             INNER JOIN empresas e ON e.id = u.empresa_id
                         WHERE u.activo = 1 AND e.activo = 1 AND u.tipo = 'admin'
                             AND u.email IS NOT NULL AND TRIM(u.email) <> ''
               AND NOT EXISTS (
                 SELECT 1 FROM pagos_plataforma p
                 WHERE p.empresa_id = u.empresa_id AND p.cliente_email = u.email
                   AND p.concepto = 'Suscripción IsiWeek' AND p.referencia = ?
                   AND p.estado IN ('pending', 'confirmed')
               )
             ORDER BY e.nombre_empresa ASC, u.nombre ASC`, [referencia]
        )
        for (const usuario of usuarios) {
            await connection.execute(
                `INSERT INTO suscripciones_plataforma (usuario_id, empresa_id, cliente_nombre, cliente_email, negocio_nombre, moneda, monto, frecuencia, proxima_fecha, creado_por)
                 VALUES (?, ?, ?, ?, ?, 'DOP', ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE empresa_id = VALUES(empresa_id), cliente_nombre = VALUES(cliente_nombre), cliente_email = VALUES(cliente_email), negocio_nombre = VALUES(negocio_nombre), monto = VALUES(monto), frecuencia = VALUES(frecuencia), proxima_fecha = VALUES(proxima_fecha), activo = 1`,
                [usuario.id, usuario.empresa_id, usuario.nombre, usuario.email, usuario.nombre_empresa, monto, frecuencia, proximaFechaTexto, adminId]
            )
            const [resultado] = await connection.execute(
                `INSERT INTO pagos_plataforma (empresa_id, cliente_nombre, cliente_email, negocio_nombre, concepto, moneda, monto, descuento, impuestos, metodo_pago, referencia, fecha_pago, creado_por)
                 VALUES (?, ?, ?, ?, 'Suscripción IsiWeek', 'DOP', ?, 0, 0, 'transferencia', ?, NOW(), ?)`,
                [usuario.empresa_id, usuario.nombre, usuario.email, usuario.nombre_empresa, monto, referencia, adminId]
            )
            await connection.execute(
                `INSERT INTO pagos_plataforma_auditoria (pago_id, admin_user_id, accion, estado_nuevo, motivo) VALUES (?, ?, 'CREATE_SUBSCRIPTION_BATCH', 'pending', ?)`,
                [resultado.insertId, adminId, periodo]
            )
        }
        await connection.commit(); connection.release(); connection = null
        return { success: true, creados: usuarios.length, mensaje: usuarios.length ? `${usuarios.length} pagos de suscripción pendientes fueron creados` : 'No hay usuarios nuevos para cargar en este período' }
    } catch (error) {
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

export async function crearPagoPendiente(datos) {
    let connection
    try {
        const adminId = await superAdminActual()
        if (!datos.cliente_nombre?.trim() || !datos.negocio_nombre?.trim() || !datos.concepto?.trim() || Number(datos.monto) <= 0) {
            return { success: false, mensaje: 'Completa cliente, negocio, concepto y un monto válido' }
        }
        connection = await db.getConnection()
        const [resultado] = await connection.execute(
            `INSERT INTO pagos_plataforma (empresa_id, cliente_nombre, cliente_email, cliente_telefono, negocio_nombre, concepto, descripcion, moneda, monto, descuento, impuestos, metodo_pago, referencia, fecha_pago, creado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [datos.empresa_id || null, datos.cliente_nombre.trim(), datos.cliente_email?.trim() || null, datos.cliente_telefono?.trim() || null, datos.negocio_nombre.trim(), datos.concepto.trim(), datos.descripcion?.trim() || null, datos.moneda || 'DOP', Number(datos.monto), Number(datos.descuento || 0), Number(datos.impuestos || 0), datos.metodo_pago || 'transferencia', datos.referencia?.trim() || null, datos.fecha_pago || new Date().toISOString().slice(0, 19).replace('T', ' '), adminId]
        )
        await connection.execute(`INSERT INTO pagos_plataforma_auditoria (pago_id, admin_user_id, accion, estado_nuevo) VALUES (?, ?, 'CREATE_PAYMENT', 'pending')`, [resultado.insertId, adminId])
        connection.release(); connection = null
        return { success: true, pagoId: resultado.insertId, mensaje: 'Pago pendiente registrado' }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

async function generarFacturaExistente(pagoId) {
    let connection
    try {
        connection = await db.getConnection()
        const [[pago]] = await connection.execute('SELECT * FROM pagos_plataforma WHERE id = ?', [pagoId])
        const [[factura]] = await connection.execute('SELECT * FROM facturas_plataforma WHERE pago_id = ?', [pagoId])
        connection.release(); connection = null
        if (!pago || !factura) throw new Error('No se encontró el pago o su factura')
        const pdf = await generarFacturaPdf(pago, factura)
        connection = await db.getConnection()
        await connection.execute(`UPDATE facturas_plataforma SET archivo_pdf = ?, estado = 'generated', error_generacion = NULL, fecha_emision = NOW() WHERE id = ?`, [pdf.archivo, factura.id])
        await connection.execute(`UPDATE pagos_plataforma SET invoice_status = 'generated', invoice_error = NULL WHERE id = ?`, [factura.id ? pagoId : pagoId])
        connection.release(); connection = null
        return { pago, factura: { ...factura, archivo_pdf: pdf.archivo }, pdf }
    } catch (error) {
        if (connection) connection.release()
        const fallback = await db.getConnection()
        await fallback.execute(`UPDATE pagos_plataforma SET invoice_status = 'failed', invoice_error = ? WHERE id = ?`, [error.message, pagoId])
        await fallback.execute(`UPDATE facturas_plataforma SET estado = 'failed', error_generacion = ? WHERE pago_id = ?`, [error.message, pagoId])
        fallback.release()
        throw error
    }
}

async function enviarCorreoFactura(pagoId) {
    let connection
    try {
        connection = await db.getConnection()
        const [[pago]] = await connection.execute('SELECT * FROM pagos_plataforma WHERE id = ?', [pagoId])
        const [[factura]] = await connection.execute('SELECT * FROM facturas_plataforma WHERE pago_id = ?', [pagoId])
        connection.release(); connection = null
        if (!pago || !factura?.archivo_pdf) throw new Error('La factura PDF no está disponible')
        const pdf = await fs.readFile(factura.archivo_pdf)
        await enviarFacturaPorCorreo(pago, factura, pdf)
        connection = await db.getConnection()
        await connection.execute(`UPDATE pagos_plataforma SET email_status = 'sent', email_error = NULL, fecha_ultimo_email = NOW() WHERE id = ?`, [pagoId])
        connection.release()
        return { success: true }
    } catch (error) {
        if (connection) connection.release()
        const fallback = await db.getConnection()
        await fallback.execute(`UPDATE pagos_plataforma SET email_status = 'failed', email_error = ?, fecha_ultimo_email = NOW() WHERE id = ?`, [error.message, pagoId])
        fallback.release()
        return { success: false, mensaje: error.message }
    }
}

export async function confirmarPagoPlataforma(pagoId) {
    let connection
    try {
        const adminId = await superAdminActual()
        connection = await db.getConnection()
        await connection.beginTransaction()
        const [[pago]] = await connection.execute('SELECT * FROM pagos_plataforma WHERE id = ? FOR UPDATE', [pagoId])
        if (!pago) throw new Error('Pago no encontrado')
        if (pago.estado !== 'pending') throw new Error('Este pago ya fue procesado y no puede confirmarse nuevamente')
        await connection.execute(`UPDATE pagos_plataforma SET estado = 'confirmed', confirmado_por = ?, fecha_confirmacion = NOW(), invoice_status = 'pending', email_status = 'pending' WHERE id = ?`, [adminId, pagoId])
        const [factura] = await connection.execute(`INSERT INTO facturas_plataforma (pago_id, numero_factura, estado) VALUES (?, CONCAT('TMP-', UUID_SHORT()), 'pending')`, [pagoId])
        await connection.execute(`UPDATE facturas_plataforma SET numero_factura = CONCAT('ISW-', LPAD(id, 6, '0')) WHERE id = ?`, [factura.insertId])
        await connection.execute(`INSERT INTO pagos_plataforma_auditoria (pago_id, admin_user_id, accion, estado_anterior, estado_nuevo) VALUES (?, ?, 'CONFIRM_PAYMENT', 'pending', 'confirmed')`, [pagoId, adminId])
        await connection.commit(); connection.release(); connection = null
        try {
            await generarFacturaExistente(pagoId)
        } catch (error) {
            console.error('Pago confirmado, pero no se pudo generar la factura:', error.message)
            return { success: true, mensaje: `Pago confirmado, pero no se pudo generar la factura: ${error.message}` }
        }
        const correo = await enviarCorreoFactura(pagoId)
        if (!correo.success) return { success: true, mensaje: `Pago confirmado y factura generada, pero el correo no pudo enviarse: ${correo.mensaje}` }
        return { success: true, mensaje: 'Pago confirmado. La factura y el correo se procesaron de forma independiente.' }
    } catch (error) {
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

export async function confirmarPagosPendientesMasivos() {
    let connection
    try {
        await superAdminActual()
        connection = await db.getConnection()
        const [pagos] = await connection.execute(`SELECT id FROM pagos_plataforma WHERE estado = 'pending' ORDER BY id ASC`)
        connection.release(); connection = null
        let confirmados = 0
        let fallidos = 0
        for (const pago of pagos) {
            const resultado = await confirmarPagoPlataforma(pago.id)
            if (resultado.success) confirmados += 1
            else fallidos += 1
        }
        return {
            success: fallidos === 0,
            confirmados,
            fallidos,
            mensaje: pagos.length === 0
                ? 'No hay pagos pendientes para confirmar'
                : fallidos === 0
                    ? `${confirmados} pagos confirmados correctamente`
                    : `${confirmados} pagos confirmados; ${fallidos} no pudieron procesarse`
        }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function rechazarPagoPlataforma(pagoId, motivo) {
    let connection
    try {
        const adminId = await superAdminActual()
        if (!motivo?.trim()) return { success: false, mensaje: 'Indica el motivo del rechazo' }
        connection = await db.getConnection(); await connection.beginTransaction()
        const [[pago]] = await connection.execute('SELECT estado FROM pagos_plataforma WHERE id = ? FOR UPDATE', [pagoId])
        if (!pago || pago.estado !== 'pending') throw new Error('Solo se pueden rechazar pagos pendientes')
        await connection.execute(`UPDATE pagos_plataforma SET estado = 'rejected', rechazado_por = ?, fecha_rechazo = NOW(), motivo_rechazo = ? WHERE id = ?`, [adminId, motivo.trim(), pagoId])
        await connection.execute(`INSERT INTO pagos_plataforma_auditoria (pago_id, admin_user_id, accion, estado_anterior, estado_nuevo, motivo) VALUES (?, ?, 'REJECT_PAYMENT', 'pending', 'rejected', ?)`, [pagoId, adminId, motivo.trim()])
        await connection.commit(); connection.release(); connection = null
        return { success: true, mensaje: 'Pago rechazado' }
    } catch (error) {
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

export async function regenerarFacturaPlataforma(pagoId) {
    try { await superAdminActual(); const resultado = await generarFacturaExistente(pagoId); return { success: true, numeroFactura: resultado.factura.numero_factura } }
    catch (error) { return { success: false, mensaje: error.message } }
}

export async function reenviarFacturaPorCorreo(pagoId) {
    try { await superAdminActual(); return await enviarCorreoFactura(pagoId) }
    catch (error) { return { success: false, mensaje: error.message } }
}