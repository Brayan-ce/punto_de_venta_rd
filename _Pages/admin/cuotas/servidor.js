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

function serial(obj) {
    if (!obj || typeof obj !== 'object') return obj
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
        if (v instanceof Date) out[k] = v.toISOString().split('T')[0]
        else if (v === null || v === undefined) out[k] = null
        else if (typeof v === 'object' && !Array.isArray(v)) out[k] = serial(v)
        else out[k] = v
    }
    return out
}

export async function obtenerClientesConCuotas(filtros = {}) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, clientes: [], stats: {}, total: 0 }

        connection = await db.getConnection()

        let where = `c.empresa_id = ? AND c.estado = 'activo' AND cu_next.estado IN ('pendiente','vencida','parcial')`
        const params = [empresaId]

        if (filtros.busqueda) {
            where += ` AND (
                c.numero LIKE ? OR
                CONCAT(cl.nombre, ' ', IFNULL(cl.apellidos,'')) LIKE ? OR
                cl.numero_documento LIKE ? OR
                cl.telefono LIKE ?
            )`
            const b = `%${filtros.busqueda}%`
            params.push(b, b, b, b)
        }
        if (filtros.estado && filtros.estado !== 'todos') {
            where += ` AND cu_next.estado = ?`
            params.push(filtros.estado)
        }
        if (filtros.proximas) {
            where += ` AND cu_next.estado = 'pendiente'
                       AND cu_next.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`
        }

        const limit  = parseInt(filtros.limit  || 20)
        const offset = parseInt(filtros.offset || 0)

        // Contrato con su proxima cuota pendiente
        const baseQuery = `
            FROM fin_contratos c
            JOIN clientes cl ON c.cliente_id = cl.id
            JOIN fin_planes p ON c.plan_id = p.id
            JOIN fin_cuotas cu_next ON cu_next.id = (
                SELECT id FROM fin_cuotas
                WHERE contrato_id = c.id AND estado IN ('pendiente','vencida','parcial')
                ORDER BY numero ASC LIMIT 1
            )
            LEFT JOIN fin_contrato_categorias cc ON c.id = cc.contrato_id
            LEFT JOIN fin_categorias cat ON cc.categoria_id = cat.id
            WHERE ${where}
        `

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(*) AS total ${baseQuery}`, params
        )

        const [contratos] = await connection.execute(
            `SELECT
                c.id, c.numero, c.saldo_pendiente, c.frecuencia, c.meses,
                c.monto_total AS monto_producto,
                c.notas AS contrato_notas,
                p.nombre AS plan_nombre, p.mora_pct, p.dias_gracia,
                CONCAT(cl.nombre, IFNULL(CONCAT(' ', cl.apellidos),'')) AS cliente_nombre,
                cl.numero_documento AS cliente_documento,
                cl.telefono AS cliente_telefono,
                cl.id AS cliente_id,
                cat.nombre AS categoria_nombre, cat.color AS categoria_color,
                cu_next.id AS cuota_id, cu_next.numero AS cuota_numero,
                cu_next.monto, cu_next.capital, cu_next.interes, cu_next.mora,
                cu_next.fecha_vencimiento, cu_next.estado AS cuota_estado,
                COALESCE((SELECT SUM(pc.monto) FROM fin_pago_cuotas pc WHERE pc.cuota_id = cu_next.id), 0) AS cuota_monto_pagado,
                (cu_next.monto - COALESCE((SELECT SUM(pc.monto) FROM fin_pago_cuotas pc WHERE pc.cuota_id = cu_next.id), 0)) AS cuota_monto_pendiente,
                (SELECT COUNT(*) FROM fin_cuotas WHERE contrato_id = c.id AND estado IN ('pendiente','vencida','parcial')) AS cuotas_pendientes,
                (SELECT COUNT(*) FROM fin_cuotas WHERE contrato_id = c.id AND estado = 'vencida') AS cuotas_vencidas
            ${baseQuery}
            ORDER BY
                CASE cu_next.estado WHEN 'vencida' THEN 0 WHEN 'parcial' THEN 1 ELSE 2 END,
                cu_next.fecha_vencimiento ASC
            LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )

        const [statsRow] = await connection.execute(
            `SELECT
                COUNT(DISTINCT c.id)                                        AS contratos_activos,
                SUM(CASE WHEN cu.estado = 'vencida' THEN 1 ELSE 0 END)    AS cuotas_vencidas,
                SUM(CASE WHEN cu.estado = 'pendiente' THEN 1 ELSE 0 END)  AS cuotas_pendientes,
                COALESCE(SUM(CASE WHEN cu.estado IN ('pendiente','vencida','parcial') THEN cu.monto ELSE 0 END), 0) AS monto_pendiente,
                COALESCE(SUM(cu.mora), 0)                                  AS mora_total
            FROM fin_cuotas cu
            JOIN fin_contratos c ON cu.contrato_id = c.id
            WHERE c.empresa_id = ? AND c.estado = 'activo'`,
            [empresaId]
        )

        const [metodos] = await connection.execute(`SELECT id, nombre FROM metodos_pago ORDER BY nombre ASC`)

        connection.release()
        return {
            success: true,
            clientes: contratos.map(serial),
            stats: statsRow[0],
            total: parseInt(total),
            metodos
        }
    } catch (error) {
        console.error('obtenerClientesConCuotas:', error)
        if (connection) connection.release()
        return { success: false, clientes: [], stats: {}, total: 0, metodos: [] }
    }
}

export async function obtenerCuotasContrato(contratoId) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, cuotas: [] }
        connection = await db.getConnection()
        const [cuotas] = await connection.execute(
            `SELECT * FROM fin_cuotas WHERE contrato_id = ? AND empresa_id = ? ORDER BY numero ASC`,
            [contratoId, empresaId]
        )

        const cuotaIds = cuotas.map(c => c.id)
        const ultimosPagos = {}
        const pagadoPorCuota = {}
        if (cuotaIds.length > 0) {
            const ph = cuotaIds.map(() => '?').join(',')
            const [pagosAplicados] = await connection.execute(
                `SELECT pc.cuota_id, MAX(pc.pago_id) AS ultimo_pago_id
                 FROM fin_pago_cuotas pc
                 WHERE pc.cuota_id IN (${ph})
                 GROUP BY pc.cuota_id`,
                cuotaIds
            )
            for (const row of pagosAplicados) {
                ultimosPagos[row.cuota_id] = row.ultimo_pago_id
            }
            const [montosAplicados] = await connection.execute(
                `SELECT pc.cuota_id, COALESCE(SUM(pc.monto), 0) AS total_pagado
                 FROM fin_pago_cuotas pc
                 WHERE pc.cuota_id IN (${ph})
                 GROUP BY pc.cuota_id`,
                cuotaIds
            )
            for (const row of montosAplicados) {
                pagadoPorCuota[row.cuota_id] = parseFloat(row.total_pagado) || 0
            }
        }

        const cuotasSerializadas = cuotas.map((cu) => {
            const fila = serial(cu)
            const pagado = pagadoPorCuota[cu.id] || 0
            fila.monto_pagado = Math.round(pagado * 100) / 100
            fila.monto_pendiente = Math.round((parseFloat(cu.monto) - pagado) * 100) / 100
            if (fila.estado === 'pagada') {
                fila.ultimo_pago_id = ultimosPagos[cu.id] || null
            }
            return fila
        })

        connection.release()
        return { success: true, cuotas: cuotasSerializadas }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, cuotas: [] }
    }
}

export async function registrarPagoCuota(cuotaId, datos) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        const userId    = await getUserId()
        if (!empresaId || !userId) return { success: false, mensaje: 'Sesion invalida' }

        const monto = parseFloat(datos.monto)
        if (!monto || monto <= 0) return { success: false, mensaje: 'Monto invalido' }

        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT fc.*, c.saldo_pendiente AS contrato_saldo
             FROM fin_cuotas fc
             JOIN fin_contratos c ON fc.contrato_id = c.id
             WHERE fc.id = ? AND fc.empresa_id = ?`,
            [cuotaId, empresaId]
        )
        if (!rows.length) { connection.release(); return { success: false, mensaje: 'Cuota no encontrada' } }

        const cuota     = rows[0]
        const mora      = parseFloat(cuota.mora || 0)
        const total     = parseFloat(cuota.monto) + mora
        const fechaPago = datos.fecha || new Date().toISOString().split('T')[0]

        await connection.beginTransaction()
        try {
            const [res] = await connection.execute(
                `INSERT INTO fin_pagos
                    (contrato_id, empresa_id, usuario_id, monto, monto_capital, monto_interes,
                     monto_mora, metodo_pago_id, referencia, notas, fecha)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    cuota.contrato_id, empresaId, userId, monto,
                    parseFloat(cuota.capital), parseFloat(cuota.interes),
                    monto >= total ? mora : 0,
                    datos.metodo_pago_id || null,
                    datos.referencia?.trim() || null,
                    datos.notas?.trim()      || null,
                    fechaPago
                ]
            )
            await connection.execute(
                `INSERT INTO fin_pago_cuotas (pago_id, cuota_id, monto) VALUES (?,?,?)`,
                [res.insertId, cuotaId, monto]
            )
            const nuevoEstado = monto >= total ? 'pagada' : 'parcial'
            await connection.execute(
                `UPDATE fin_cuotas SET estado = ?, fecha_pago = ? WHERE id = ?`,
                [nuevoEstado, nuevoEstado === 'pagada' ? fechaPago : null, cuotaId]
            )
            const nuevoSaldo = Math.max(0, parseFloat(cuota.contrato_saldo) - monto)
            await connection.execute(
                `UPDATE fin_contratos SET saldo_pendiente = ?, estado = ? WHERE id = ?`,
                [nuevoSaldo, nuevoSaldo <= 0 ? 'pagado' : 'activo', cuota.contrato_id]
            )
            await connection.commit()
            connection.release()
            return { success: true, pago_id: res.insertId }
        } catch (err) { await connection.rollback(); throw err }
    } catch (error) {
        console.error('registrarPagoCuota:', error)
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

export async function recalcularMorasVencidas() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const hoy = new Date().toISOString().split('T')[0]

        const [rows] = await connection.execute(
            `SELECT cu.id, cu.monto, cu.fecha_vencimiento, p.mora_pct, p.dias_gracia
             FROM fin_cuotas cu
             JOIN fin_contratos c ON cu.contrato_id = c.id
             JOIN fin_planes    p ON c.plan_id      = p.id
             WHERE c.empresa_id = ?
               AND cu.estado IN ('vencida','parcial','pendiente')
               AND cu.fecha_vencimiento < ?`,
            [empresaId, hoy]
        )

        let actualizadas = 0
        for (const cu of rows) {
            const [y,m,d] = String(cu.fecha_vencimiento instanceof Date ? cu.fecha_vencimiento.toISOString() : cu.fecha_vencimiento).slice(0,10).split('-').map(Number)
            const dias   = Math.floor((new Date(hoy) - new Date(y,m-1,d)) / 86400000)
            const gracia = parseInt(cu.dias_gracia || 0)
            if (dias <= gracia) continue
            const mora = (parseFloat(cu.monto) * (parseFloat(cu.mora_pct) / 100) / 30) * (dias - gracia)
            await connection.execute(
                `UPDATE fin_cuotas SET mora = ?, estado = 'vencida' WHERE id = ?`,
                [mora.toFixed(2), cu.id]
            )
            actualizadas++
        }

        connection.release()
        return { success: true, mensaje: `${actualizadas} cuota(s) actualizadas con mora` }
    } catch (error) {
        console.error('recalcularMorasVencidas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

function esFinanciamientoPorProducto(notas) {
    const texto = String(notas || '')
    return /Productos:/i.test(texto) || /Generado desde venta/i.test(texto)
}

export async function eliminarFinanciamientoProducto(contratoId) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        const userId = await getUserId()
        if (!empresaId || !userId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT id, numero, notas FROM fin_contratos WHERE id = ? AND empresa_id = ? LIMIT 1`,
            [contratoId, empresaId]
        )
        if (!rows.length) {
            connection.release()
            return { success: false, mensaje: 'Contrato no encontrado' }
        }

        const contrato = rows[0]
        if (!esFinanciamientoPorProducto(contrato.notas)) {
            connection.release()
            return {
                success: false,
                mensaje: 'Solo se pueden eliminar financiamientos creados desde venta de productos'
            }
        }

        await connection.beginTransaction()
        try {
            await connection.execute(
                `DELETE FROM fin_contratos WHERE id = ? AND empresa_id = ?`,
                [contratoId, empresaId]
            )
            await connection.commit()
            connection.release()
            return {
                success: true,
                mensaje: `Financiamiento ${contrato.numero} eliminado correctamente`
            }
        } catch (err) {
            await connection.rollback()
            throw err
        }
    } catch (error) {
        console.error('eliminarFinanciamientoProducto:', error)
        if (connection) {
            try { await connection.rollback() } catch {}
            connection.release()
        }
        return { success: false, mensaje: error.message || 'Error al eliminar financiamiento' }
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