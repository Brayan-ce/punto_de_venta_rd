"use server"
import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}

export async function obtenerDashboard() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const [[{ contratos_activos }]] = await connection.execute(
            `SELECT COUNT(*) as contratos_activos FROM fin_contratos WHERE empresa_id = ? AND estado = 'activo'`,
            [empresaId]
        )
        const [[{ cuotas_vencidas }]] = await connection.execute(
            `SELECT COUNT(*) as cuotas_vencidas FROM fin_cuotas cu
             INNER JOIN fin_contratos c ON cu.contrato_id = c.id
             WHERE cu.empresa_id = ? AND cu.estado = 'vencida' AND c.estado <> 'cancelado'`,
            [empresaId]
        )
        const [[{ saldo_pendiente }]] = await connection.execute(
            `SELECT COALESCE(SUM(saldo_pendiente), 0) as saldo_pendiente FROM fin_contratos WHERE empresa_id = ? AND estado = 'activo'`,
            [empresaId]
        )
        const fechaInicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        const [[{ cobrado_mes }]] = await connection.execute(
            `SELECT COALESCE(SUM(p.monto), 0) as cobrado_mes
             FROM fin_pagos p
             INNER JOIN fin_contratos c ON p.contrato_id = c.id
             WHERE p.empresa_id = ? AND p.fecha >= ? AND c.estado <> 'cancelado'`,
            [empresaId, fechaInicioMes]
        )
        const [[{ contratos_pagados }]] = await connection.execute(
            `SELECT COUNT(*) as contratos_pagados FROM fin_contratos WHERE empresa_id = ? AND estado = 'pagado'`,
            [empresaId]
        )
        const [[{ contratos_incumplidos }]] = await connection.execute(
            `SELECT COUNT(*) as contratos_incumplidos FROM fin_contratos WHERE empresa_id = ? AND estado = 'incumplido'`,
            [empresaId]
        )
        const [[{ contratos_cancelados }]] = await connection.execute(
            `SELECT COUNT(*) as contratos_cancelados FROM fin_contratos WHERE empresa_id = ? AND estado = 'cancelado'`,
            [empresaId]
        )
        const [[{ total_financiado }]] = await connection.execute(
            `SELECT COALESCE(SUM(monto_financiado), 0) as total_financiado FROM fin_contratos WHERE empresa_id = ? AND estado <> 'cancelado'`,
            [empresaId]
        )
        const [[{ total_intereses_cobrados }]] = await connection.execute(
            `SELECT COALESCE(SUM(p.monto_interes), 0) as total_intereses_cobrados
             FROM fin_pagos p
             INNER JOIN fin_contratos c ON p.contrato_id = c.id
             WHERE p.empresa_id = ? AND c.estado <> 'cancelado'`,
            [empresaId]
        )

        // Cuotas proximas a vencer (7 dias)
        const [cuotas_proximas] = await connection.execute(
            `SELECT q.*, c.numero as numero_contrato, cl.nombre as cliente_nombre, cl.telefono as cliente_telefono
             FROM fin_cuotas q
             JOIN fin_contratos c ON q.contrato_id = c.id
             JOIN clientes cl ON c.cliente_id = cl.id
             WHERE q.empresa_id = ? AND q.estado = 'pendiente'
               AND q.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
               AND c.estado <> 'cancelado'
             ORDER BY q.fecha_vencimiento ASC
             LIMIT 5`,
            [empresaId]
        )

        // Alertas activas
        const [alertas] = await connection.execute(
            `SELECT a.*, c.numero as numero_contrato, cl.nombre as cliente_nombre, cl.telefono as cliente_telefono
             FROM fin_alertas a
             LEFT JOIN fin_contratos c ON a.contrato_id = c.id
             LEFT JOIN clientes cl ON c.cliente_id = cl.id
             WHERE a.empresa_id = ? AND a.estado = 'activa'
             ORDER BY a.fecha DESC
             LIMIT 5`,
            [empresaId]
        )

        // Contratos recientes
        const [contratos_recientes] = await connection.execute(
            `SELECT c.*, cl.nombre as cliente_nombre, cl.numero_documento,
                    p.nombre as plan_nombre
             FROM fin_contratos c
             JOIN clientes cl ON c.cliente_id = cl.id
             JOIN fin_planes p ON c.plan_id = p.id
             WHERE c.empresa_id = ? AND c.estado <> 'cancelado'
             ORDER BY c.created_at DESC
             LIMIT 8`,
            [empresaId]
        )

        // Planes activos
        const [planes] = await connection.execute(
            `SELECT p.*, COUNT(o.id) as total_opciones,
                    COUNT(c.id) as total_contratos
             FROM fin_planes p
             LEFT JOIN fin_plan_opciones o ON o.plan_id = p.id
             LEFT JOIN fin_contratos c ON c.plan_id = p.id AND c.empresa_id = p.empresa_id AND c.estado <> 'cancelado'
             WHERE p.empresa_id = ? AND p.activo = 1
             GROUP BY p.id
             ORDER BY total_contratos DESC
             LIMIT 4`,
            [empresaId]
        )

        connection.release()
        return {
            success: true,
            stats: {
                contratos_activos:        parseInt(contratos_activos),
                cuotas_vencidas:          parseInt(cuotas_vencidas),
                saldo_pendiente:          parseFloat(saldo_pendiente),
                cobrado_mes:              parseFloat(cobrado_mes),
                contratos_pagados:        parseInt(contratos_pagados),
                contratos_incumplidos:    parseInt(contratos_incumplidos),
                contratos_cancelados:     parseInt(contratos_cancelados),
                total_financiado:         parseFloat(total_financiado),
                total_intereses_cobrados: parseFloat(total_intereses_cobrados),
            },
            cuotas_proximas,
            alertas,
            contratos_recientes,
            planes,
        }
    } catch (error) {
        console.error('obtenerDashboard:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function marcarAlertaResuelta(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }
        connection = await db.getConnection()
        await connection.execute(
            `UPDATE fin_alertas SET estado = 'resuelta' WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )
        connection.release()
        return { success: true }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

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
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al obtener datos empresa' }
    }
}