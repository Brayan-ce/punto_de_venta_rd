"use server"
import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}
async function getUserId() {
    const cookieStore = await cookies()
    return cookieStore.get('userId')?.value
}

export async function obtenerCuotaPorId(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const [[cuota]] = await connection.execute(
            `SELECT
                cu.*,
                c.numero            AS contrato_numero,
                c.estado            AS contrato_estado,
                c.frecuencia,
                c.mora_pct,
                c.dias_gracia,
                c.meses             AS contrato_meses,
                c.tasa_interes,
                c.saldo_pendiente,
                c.fecha_inicio,
                c.fecha_fin,
                c.cuota_mensual,
                c.total_pagar,
                c.monto_financiado,
                CONCAT(cl.nombre, IFNULL(CONCAT(' ', cl.apellidos),'')) AS cliente_nombre,
                cl.telefono         AS cliente_telefono,
                cl.email            AS cliente_email,
                cl.numero_documento AS cliente_documento,
                cl.id               AS cliente_id,
                p.nombre            AS plan_nombre,
                p.id                AS plan_id
            FROM fin_cuotas cu
            JOIN fin_contratos c  ON cu.contrato_id = c.id
            JOIN clientes      cl ON c.cliente_id   = cl.id
            JOIN fin_planes    p  ON c.plan_id      = p.id
            WHERE cu.id = ? AND c.empresa_id = ?`,
            [id, empresaId]
        )
        if (!cuota) { connection.release(); return { success: false, mensaje: 'Cuota no encontrada' } }

        const [pagosAplicados] = await connection.execute(
            `SELECT
                pg.id, pg.monto AS pago_total, pg.fecha, pg.referencia, pg.notas,
                pc.monto        AS aplicado,
                mp.nombre       AS metodo_pago,
                u.nombre        AS usuario_nombre
            FROM fin_pago_cuotas pc
            JOIN fin_pagos     pg ON pc.pago_id        = pg.id
            LEFT JOIN metodos_pago mp ON pg.metodo_pago_id = mp.id
            LEFT JOIN usuarios     u  ON pg.usuario_id    = u.id
            WHERE pc.cuota_id = ?
            ORDER BY pg.fecha DESC`,
            [id]
        )

        const [todasCuotas] = await connection.execute(
            `SELECT id, numero, monto, mora, estado, fecha_vencimiento, fecha_pago
             FROM fin_cuotas
             WHERE contrato_id = ?
             ORDER BY numero ASC`,
            [cuota.contrato_id]
        )

        connection.release()
        return { success: true, cuota, pagosAplicados, todasCuotas }
    } catch (error) {
        console.error('obtenerCuotaPorId:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function actualizarMoraCuota(id, mora) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        await connection.execute(
            `UPDATE fin_cuotas cu
             JOIN fin_contratos c ON cu.contrato_id = c.id
             SET cu.mora = ?
             WHERE cu.id = ? AND c.empresa_id = ?`,
            [parseFloat(mora || 0), id, empresaId]
        )
        connection.release()
        return { success: true }
    } catch (error) {
        console.error('actualizarMoraCuota:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}