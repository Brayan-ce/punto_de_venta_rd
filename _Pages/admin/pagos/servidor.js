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

function serializarFila(obj) {
    if (!obj || typeof obj !== 'object') return obj
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
        if (v instanceof Date) out[k] = v.toISOString().split('T')[0]
        else if (v === null || v === undefined) out[k] = null
        else if (typeof v === 'object' && !Array.isArray(v)) out[k] = serializarFila(v)
        else out[k] = v
    }
    return out
}

function calcularMoraActual(cuota, moraPct, diasGracia) {
    if (!cuota.fecha_vencimiento) return 0
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const [y,m,d] = String(cuota.fecha_vencimiento).slice(0,10).split('-').map(Number)
    const venc = new Date(y,m-1,d)
    const diasRetraso = Math.floor((hoy - venc) / 86400000)
    if (diasRetraso <= diasGracia) return 0
    const diasConMora = diasRetraso - diasGracia
    const montoCuota = parseFloat(cuota.monto)
    const mora = (montoCuota * (moraPct / 100) / 30) * diasConMora
    return parseFloat(mora.toFixed(2))
}

export async function obtenerClientesConContratos(filtros = {}) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, clientes: [], total: 0 }

        connection = await db.getConnection()

        let where = `c.empresa_id = ? AND c.estado = 'activo'`
        const params = [empresaId]

        if (filtros.busqueda) {
            where += ` AND (
                CONCAT(cl.nombre, ' ', IFNULL(cl.apellidos,'')) LIKE ? OR
                cl.numero_documento LIKE ?
            )`
            const b = `%${filtros.busqueda}%`
            params.push(b, b)
        }

        const limit  = parseInt(filtros.limit  || 30)
        const offset = parseInt(filtros.offset || 0)

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(DISTINCT cl.id) AS total
             FROM fin_contratos c
             LEFT JOIN clientes cl ON c.cliente_id = cl.id
             WHERE ${where}`,
            params
        )

        const [clientes] = await connection.execute(
            `SELECT
                cl.id                                                            AS cliente_id,
                CONCAT(cl.nombre, IFNULL(CONCAT(' ', cl.apellidos), ''))        AS cliente_nombre,
                cl.numero_documento                                              AS cliente_documento,
                cl.telefono                                                      AS cliente_telefono,
                COUNT(c.id)                                                      AS total_contratos,
                COALESCE(SUM(c.saldo_pendiente), 0)                             AS total_pendiente,
                COALESCE(SUM(
                    (SELECT COUNT(*) FROM fin_cuotas fq
                     WHERE fq.contrato_id = c.id AND fq.estado = 'vencida')
                ), 0)                                                            AS total_cuotas_vencidas,
                COALESCE(SUM(
                    (SELECT COUNT(*) FROM fin_cuotas fq
                     WHERE fq.contrato_id = c.id AND fq.estado IN ('pendiente','vencida','parcial'))
                ), 0)                                                            AS total_cuotas_pendientes
             FROM clientes cl
             JOIN fin_contratos c ON c.cliente_id = cl.id
             WHERE ${where}
             GROUP BY cl.id, cl.nombre, cl.apellidos, cl.numero_documento, cl.telefono
             ORDER BY total_cuotas_vencidas DESC, total_pendiente DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )

        connection.release()
        return { success: true, clientes: clientes.map(serializarFila), total: parseInt(total) }
    } catch (error) {
        console.error('obtenerClientesConContratos:', error)
        if (connection) connection.release()
        return { success: false, clientes: [], total: 0 }
    }
}

export async function obtenerContratosConPago(filtros = {}) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, contratos: [], total: 0 }

        connection = await db.getConnection()

        let where = `c.empresa_id = ? AND c.estado = 'activo'`
        const params = [empresaId]

        if (filtros.busqueda) {
            where += ` AND (
                c.numero LIKE ? OR
                CONCAT(cl.nombre, ' ', IFNULL(cl.apellidos,'')) LIKE ? OR
                cl.numero_documento LIKE ?
            )`
            const b = `%${filtros.busqueda}%`
            params.push(b, b, b)
        }
        if (filtros.categoria_id) {
            if (filtros.categoria_id === 'sin') where += ` AND cc.categoria_id IS NULL`
            else { where += ` AND cc.categoria_id = ?`; params.push(filtros.categoria_id) }
        }
        if (filtros.cliente_id) {
            where += ` AND c.cliente_id = ?`
            params.push(filtros.cliente_id)
        }

        const limit  = parseInt(filtros.limit  || 20)
        const offset = parseInt(filtros.offset || 0)

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(*) AS total
             FROM fin_contratos c
             LEFT JOIN clientes cl ON c.cliente_id = cl.id
             LEFT JOIN fin_contrato_categorias cc ON c.id = cc.contrato_id
             WHERE ${where}`,
            params
        )

        const [contratos] = await connection.execute(
            `SELECT
                c.id, c.numero, c.saldo_pendiente, c.cuota_mensual, c.frecuencia,
                c.meses, c.fecha_inicio, c.fecha_fin, c.estado,
                c.monto_total AS monto_producto,
                c.notas AS contrato_notas,
                c.plan_id,
                CONCAT(cl.nombre, IFNULL(CONCAT(' ', cl.apellidos), '')) AS cliente_nombre,
                cl.numero_documento AS cliente_documento,
                cl.telefono         AS cliente_telefono,
                p.nombre            AS plan_nombre,
                p.mora_pct          AS mora_pct,
                p.dias_gracia       AS dias_gracia,
                cat.id              AS categoria_id,
                cat.nombre          AS categoria_nombre,
                cat.color           AS categoria_color,
                (SELECT COUNT(*) FROM fin_cuotas fq WHERE fq.contrato_id = c.id AND fq.estado IN ('pendiente','vencida','parcial')) AS cuotas_pendientes,
                (SELECT COUNT(*) FROM fin_cuotas fq WHERE fq.contrato_id = c.id AND fq.estado = 'vencida') AS cuotas_vencidas
            FROM fin_contratos c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN fin_planes p ON c.plan_id = p.id
            LEFT JOIN fin_contrato_categorias cc ON c.id = cc.contrato_id
            LEFT JOIN fin_categorias cat ON cc.categoria_id = cat.id
            WHERE ${where}
            ORDER BY cat.orden ASC, cat.nombre ASC, c.created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )

        const ids = contratos.map(c => c.id)
        let proximasCuotas = []
        if (ids.length > 0) {
            const ph = ids.map(() => '?').join(',')
            const [cuotas] = await connection.execute(
                `SELECT fc.* FROM fin_cuotas fc
                 INNER JOIN (
                     SELECT contrato_id, MIN(numero) AS min_numero
                     FROM fin_cuotas
                     WHERE contrato_id IN (${ph}) AND estado IN ('pendiente','vencida','parcial')
                     GROUP BY contrato_id
                 ) sub ON fc.contrato_id = sub.contrato_id AND fc.numero = sub.min_numero`,
                ids
            )
            proximasCuotas = cuotas.map(serializarFila)
        }

        const cuotaMap = {}
        const contratoInfoMap = {}
        for (const c of contratos) {
            contratoInfoMap[c.id] = { mora_pct: parseFloat(c.mora_pct||5), dias_gracia: parseInt(c.dias_gracia||5) }
        }
        for (const cu of proximasCuotas) {
            const info = contratoInfoMap[cu.contrato_id] || { mora_pct: 5, dias_gracia: 5 }
            const moraActual = calcularMoraActual(cu, info.mora_pct, info.dias_gracia)
            const montoPagado = parseFloat(cu.monto_pagado || 0)
            const montoRestante = parseFloat(cu.monto) - montoPagado
            cuotaMap[cu.contrato_id] = { ...cu, mora: moraActual, monto_restante: montoRestante > 0 ? montoRestante : parseFloat(cu.monto) }
        }

        const [categorias] = await connection.execute(
            `SELECT cat.*, COUNT(cc2.id) AS total_contratos
             FROM fin_categorias cat
             LEFT JOIN fin_contrato_categorias cc2 ON cat.id = cc2.categoria_id
             WHERE cat.empresa_id = ?
             GROUP BY cat.id ORDER BY cat.orden ASC, cat.nombre ASC`,
            [empresaId]
        )

        const [statsRow] = await connection.execute(
            `SELECT
                COUNT(*) AS total_activos,
                COALESCE(SUM(c.saldo_pendiente), 0) AS saldo_total,
                (SELECT COUNT(*) FROM fin_cuotas fc2
                 JOIN fin_contratos cc3 ON fc2.contrato_id = cc3.id
                 WHERE cc3.empresa_id = ? AND fc2.estado = 'vencida') AS cuotas_vencidas
            FROM fin_contratos c WHERE c.empresa_id = ? AND c.estado = 'activo'`,
            [empresaId, empresaId]
        )

        const [metodos] = await connection.execute(`SELECT id, nombre FROM metodos_pago ORDER BY nombre ASC`)

        connection.release()
        return {
            success: true,
            contratos: contratos.map(serializarFila),
            cuotaMap,
            categorias,
            stats: statsRow[0],
            total: parseInt(total),
            metodos
        }
    } catch (error) {
        console.error('obtenerContratosConPago:', error)
        if (connection) connection.release()
        return { success: false, contratos: [], cuotaMap: {}, categorias: [], stats: {}, total: 0, metodos: [] }
    }
}

export async function obtenerCuotasContrato(contratoId) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, cuotas: [] }

        connection = await db.getConnection()
        const [cuotas] = await connection.execute(
            `SELECT fc.* FROM fin_cuotas fc WHERE fc.contrato_id = ? AND fc.empresa_id = ? ORDER BY fc.numero ASC`,
            [contratoId, empresaId]
        )
        const [[contrato]] = await connection.execute(
            `SELECT c.mora_pct, c.dias_gracia FROM fin_contratos co JOIN fin_planes c ON co.plan_id = c.id WHERE co.id = ?`,
            [contratoId]
        )
        const moraPct = parseFloat(contrato?.mora_pct || 5)
        const diasGracia = parseInt(contrato?.dias_gracia || 5)

        const cuotaIds = cuotas.map(c => c.id)
        let ultimosPagos = {}
        let montosPagados = {}

        if (cuotaIds.length > 0) {
            const ph = cuotaIds.map(() => '?').join(',')
            const [pagosAplicados] = await connection.execute(
                `SELECT pc.cuota_id,
                        COALESCE(SUM(pc.monto), 0) AS total_pagado,
                        MAX(pc.pago_id) AS ultimo_pago_id
                 FROM fin_pago_cuotas pc
                 GROUP BY pc.cuota_id
                 HAVING pc.cuota_id IN (${ph})`,
                cuotaIds
            )
            for (const row of pagosAplicados) {
                montosPagados[row.cuota_id] = parseFloat(row.total_pagado)
                ultimosPagos[row.cuota_id] = row.ultimo_pago_id
            }
        }

        const cuotasConMora = cuotas.map(cu => {
            const serializado = serializarFila(cu)
            const montoPagado = montosPagados[cu.id] || 0
            const montoRestante = Math.max(0, parseFloat(cu.monto) - montoPagado)

            if (['pendiente','vencida','parcial'].includes(cu.estado)) {
                serializado.mora = calcularMoraActual(serializado, moraPct, diasGracia)
                serializado.monto_restante = montoRestante
                serializado.monto_pagado = montoPagado > 0 ? montoPagado : null
            } else {
                serializado.mora = parseFloat(cu.mora || 0)
                serializado.monto_restante = parseFloat(cu.monto)
                serializado.monto_pagado = null
            }

            if (['pagada', 'parcial'].includes(cu.estado) && montosPagados[cu.id] > 0) {
                serializado.ultimo_pago_id = ultimosPagos[cu.id] || null
            }

            return serializado
        })

        const [pagosContrato] = await connection.execute(
            `SELECT p.id, p.monto, p.fecha, p.notas, p.referencia, p.monto_capital, p.monto_interes
             FROM fin_pagos p
             WHERE p.contrato_id = ? AND p.empresa_id = ?
             ORDER BY p.fecha ASC, p.id ASC`,
            [contratoId, empresaId]
        )

        connection.release()
        return {
            success: true,
            cuotas: cuotasConMora,
            pagos: pagosContrato.map(serializarFila),
            mora_pct: moraPct,
            dias_gracia: diasGracia
        }
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

        const [cuotas] = await connection.execute(
            `SELECT fc.*, co.saldo_pendiente AS contrato_saldo, p.mora_pct, p.dias_gracia
             FROM fin_cuotas fc
             INNER JOIN fin_contratos co ON fc.contrato_id = co.id
             INNER JOIN fin_planes p ON co.plan_id = p.id
             WHERE fc.id = ? AND fc.empresa_id = ?`,
            [cuotaId, empresaId]
        )
        if (!cuotas.length) { connection.release(); return { success: false, mensaje: 'Cuota no encontrada' } }

        const cuota      = cuotas[0]
        const moraPct    = parseFloat(cuota.mora_pct || 5)
        const diasGracia = parseInt(cuota.dias_gracia || 5)
        const fechaPago  = datos.fecha || new Date().toISOString().split('T')[0]

        const [[montoYaPagadoRow]] = await connection.execute(
            `SELECT COALESCE(SUM(pc.monto), 0) AS total FROM fin_pago_cuotas pc WHERE pc.cuota_id = ?`,
            [cuotaId]
        )
        const montoYaPagado = parseFloat(montoYaPagadoRow.total)
        const montoRestanteCuota = Math.max(0, parseFloat(cuota.monto) - montoYaPagado)
        const moraActual = calcularMoraActual(serializarFila(cuota), moraPct, diasGracia)
        const totalCuota = montoRestanteCuota + moraActual

        await connection.beginTransaction()
        try {
            let montoRestante = monto
            let totalCapital  = 0
            let totalInteres  = 0
            let totalMora     = 0
            const cuotasAplicadas = []

            const [todasCuotas] = await connection.execute(
                `SELECT fc.*, p.mora_pct, p.dias_gracia
                 FROM fin_cuotas fc
                 JOIN fin_contratos co ON fc.contrato_id = co.id
                 JOIN fin_planes p ON co.plan_id = p.id
                 WHERE fc.contrato_id = ? AND fc.estado IN ('pendiente','vencida','parcial')
                 ORDER BY fc.numero ASC`,
                [cuota.contrato_id]
            )

            for (const c of todasCuotas) {
                if (montoRestante <= 0) break
                const cSer = serializarFila(c)
                const mora = calcularMoraActual(cSer, moraPct, diasGracia)

                const [[pagadoRow]] = await connection.execute(
                    `SELECT COALESCE(SUM(pc.monto), 0) AS total FROM fin_pago_cuotas pc WHERE pc.cuota_id = ?`,
                    [c.id]
                )
                const yaPagado = parseFloat(pagadoRow.total)
                const restanteEsta = Math.max(0, parseFloat(c.monto) - yaPagado)
                const totalC = restanteEsta + mora

                if (montoRestante >= totalC) {
                    totalCapital += parseFloat(c.capital)
                    totalInteres += parseFloat(c.interes)
                    totalMora    += mora
                    cuotasAplicadas.push({ id: c.id, monto: totalC, estado: 'pagada' })
                    montoRestante -= totalC
                    await connection.execute(
                        `UPDATE fin_cuotas SET estado = 'pagada', fecha_pago = ?, mora = ? WHERE id = ?`,
                        [fechaPago, mora, c.id]
                    )
                } else if (montoRestante > 0) {
                    const moraParc = Math.min(mora, montoRestante)
                    totalMora    += moraParc
                    totalCapital += Math.max(0, montoRestante - moraParc)
                    cuotasAplicadas.push({ id: c.id, monto: montoRestante, estado: 'parcial' })
                    await connection.execute(
                        `UPDATE fin_cuotas SET estado = 'parcial', mora = ? WHERE id = ?`,
                        [mora, c.id]
                    )
                    montoRestante = 0
                }
            }

            const [res] = await connection.execute(
                `INSERT INTO fin_pagos
                    (contrato_id, empresa_id, usuario_id, monto, monto_capital, monto_interes,
                     monto_mora, metodo_pago_id, referencia, notas, fecha)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    cuota.contrato_id, empresaId, userId, monto,
                    totalCapital, totalInteres, totalMora,
                    datos.metodo_pago_id || null,
                    datos.referencia?.trim() || null,
                    datos.notas?.trim()      || null,
                    fechaPago
                ]
            )

            for (const ca of cuotasAplicadas) {
                await connection.execute(
                    `INSERT INTO fin_pago_cuotas (pago_id, cuota_id, monto) VALUES (?,?,?)`,
                    [res.insertId, ca.id, ca.monto]
                )
            }

            const nuevoSaldo = Math.max(0, parseFloat(cuota.contrato_saldo) - monto)
            const [cuotasPendientes] = await connection.execute(
                `SELECT COUNT(*) AS cnt FROM fin_cuotas WHERE contrato_id = ? AND estado IN ('pendiente','vencida','parcial')`,
                [cuota.contrato_id]
            )
            const estadoContrato = cuotasPendientes[0].cnt === 0 ? 'pagado' : 'activo'
            await connection.execute(
                `UPDATE fin_contratos SET saldo_pendiente = ?, estado = ? WHERE id = ?`,
                [nuevoSaldo, estadoContrato, cuota.contrato_id]
            )

            await connection.commit()
            connection.release()
            return { success: true, mensaje: 'Pago registrado', pago_id: res.insertId }
        } catch (err) {
            await connection.rollback(); throw err
        }
    } catch (error) {
        console.error('registrarPagoCuota:', error)
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

export async function obtenerPagos(filtros = {}) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, pagos: [] }

        connection = await db.getConnection()

        let where = `p.empresa_id = ?`
        const params = [empresaId]

        if (filtros.busqueda) {
            where += ` AND (c.numero LIKE ? OR CONCAT(cl.nombre,' ',IFNULL(cl.apellidos,'')) LIKE ? OR cl.numero_documento LIKE ? OR p.referencia LIKE ?)`
            const b = `%${filtros.busqueda}%`
            params.push(b, b, b, b)
        }
        if (filtros.fecha_desde) { where += ` AND p.fecha >= ?`; params.push(filtros.fecha_desde) }
        if (filtros.fecha_hasta) { where += ` AND p.fecha <= ?`; params.push(filtros.fecha_hasta) }

        const limit  = parseInt(filtros.limit  || 50)
        const offset = parseInt(filtros.offset || 0)

        const [pagos] = await connection.execute(
            `SELECT p.id, p.monto, p.monto_capital, p.monto_interes, p.monto_mora,
                    p.referencia, p.notas, p.fecha, p.created_at, p.contrato_id,
                    c.numero AS contrato_numero,
                    c.monto_total AS monto_producto,
                    c.notas AS contrato_notas,
                    CONCAT(cl.nombre, IFNULL(CONCAT(' ', cl.apellidos),'')) AS cliente_nombre,
                    cl.numero_documento AS cliente_documento,
                    cl.telefono AS cliente_telefono,
                    mp.nombre AS metodo_pago,
                    u.nombre  AS usuario_nombre
             FROM fin_pagos p
             JOIN fin_contratos c  ON p.contrato_id = c.id
             JOIN clientes      cl ON c.cliente_id  = cl.id
             LEFT JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
             LEFT JOIN usuarios     u  ON p.usuario_id     = u.id
             WHERE ${where}
             ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )
        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(*) AS total FROM fin_pagos p
             JOIN fin_contratos c  ON p.contrato_id = c.id
             JOIN clientes      cl ON c.cliente_id  = cl.id
             WHERE ${where}`,
            params
        )
        const [statsRow] = await connection.execute(
            `SELECT COUNT(*) AS total_pagos,
                    COALESCE(SUM(p.monto),0)      AS total_monto,
                    COALESCE(SUM(p.monto_mora),0) AS total_mora,
                    COUNT(DISTINCT p.contrato_id) AS contratos_con_pago
             FROM fin_pagos p WHERE p.empresa_id = ?`,
            [empresaId]
        )
        connection.release()
        return { success: true, pagos: pagos.map(serializarFila), total: parseInt(total), stats: statsRow[0] }
    } catch (error) {
        console.error('obtenerPagos:', error)
        if (connection) connection.release()
        return { success: false, pagos: [], total: 0, stats: {} }
    }
}

export async function obtenerDetallePago(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false }
        connection = await db.getConnection()
        const [[pago]] = await connection.execute(
            `SELECT p.*, c.numero AS contrato_numero,
                    CONCAT(cl.nombre,IFNULL(CONCAT(' ',cl.apellidos),'')) AS cliente_nombre,
                    cl.numero_documento AS cliente_documento,
                    cl.telefono AS cliente_telefono,
                    mp.nombre AS metodo_pago, u.nombre AS usuario_nombre
             FROM fin_pagos p
             JOIN fin_contratos c  ON p.contrato_id = c.id
             JOIN clientes      cl ON c.cliente_id  = cl.id
             LEFT JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
             LEFT JOIN usuarios     u  ON p.usuario_id     = u.id
             WHERE p.id = ? AND p.empresa_id = ?`,
            [id, empresaId]
        )
        if (!pago) { connection.release(); return { success: false } }
        const [cuotasAplicadas] = await connection.execute(
            `SELECT pc.monto AS aplicado, cu.numero, cu.fecha_vencimiento, cu.estado
             FROM fin_pago_cuotas pc
             JOIN fin_cuotas cu ON pc.cuota_id = cu.id
             WHERE pc.pago_id = ? ORDER BY cu.numero ASC`,
            [id]
        )
        connection.release()
        return { success: true, pago: serializarFila(pago), cuotasAplicadas: cuotasAplicadas.map(serializarFila) }
    } catch (error) {
        if (connection) connection.release()
        return { success: false }
    }
}

export async function anularPago(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }
        connection = await db.getConnection()
        const [[pago]] = await connection.execute(
            `SELECT * FROM fin_pagos WHERE id = ? AND empresa_id = ?`, [id, empresaId]
        )
        if (!pago) { connection.release(); return { success: false, mensaje: 'Pago no encontrado' } }

        await connection.beginTransaction()
        try {
            const [cuotasAfectadas] = await connection.execute(
                `SELECT pc.cuota_id FROM fin_pago_cuotas pc WHERE pc.pago_id = ?`, [id]
            )
            for (const { cuota_id } of cuotasAfectadas) {
                const [[cu]] = await connection.execute(`SELECT fecha_vencimiento FROM fin_cuotas WHERE id = ?`, [cuota_id])
                const hoy  = new Date().toISOString().split('T')[0]
                const venc = cu.fecha_vencimiento instanceof Date ? cu.fecha_vencimiento.toISOString().split('T')[0] : String(cu.fecha_vencimiento).slice(0,10)

                await connection.execute(`DELETE FROM fin_pago_cuotas WHERE pago_id = ? AND cuota_id = ?`, [id, cuota_id])

                const [[restante]] = await connection.execute(
                    `SELECT COALESCE(SUM(pc2.monto), 0) AS total FROM fin_pago_cuotas pc2 WHERE pc2.cuota_id = ?`,
                    [cuota_id]
                )
                const [[cuotaInfo]] = await connection.execute(`SELECT monto FROM fin_cuotas WHERE id = ?`, [cuota_id])
                const totalPagado = parseFloat(restante.total)
                const montoCuota = parseFloat(cuotaInfo.monto)

                let nuevoEstado
                if (totalPagado <= 0) {
                    nuevoEstado = venc < hoy ? 'vencida' : 'pendiente'
                } else if (totalPagado >= montoCuota) {
                    nuevoEstado = 'pagada'
                } else {
                    nuevoEstado = 'parcial'
                }

                await connection.execute(
                    `UPDATE fin_cuotas SET estado = ?, fecha_pago = ? WHERE id = ?`,
                    [nuevoEstado, nuevoEstado === 'pagada' ? hoy : null, cuota_id]
                )
            }

            const [[c]] = await connection.execute(`SELECT saldo_pendiente FROM fin_contratos WHERE id = ?`, [pago.contrato_id])
            await connection.execute(
                `UPDATE fin_contratos SET saldo_pendiente = ?, estado = 'activo' WHERE id = ?`,
                [parseFloat(c.saldo_pendiente) + parseFloat(pago.monto_capital), pago.contrato_id]
            )
            await connection.execute(`DELETE FROM fin_pagos WHERE id = ?`, [id])
            await connection.commit()
            connection.release()
            return { success: true }
        } catch (err) { await connection.rollback(); throw err }
    } catch (error) {
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

export async function obtenerListaNegra(filtros = {}) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, contratos: [] }

        connection = await db.getConnection()

        let where = `c.empresa_id = ? AND c.estado = 'activo' AND EXISTS (
            SELECT 1 FROM fin_cuotas fq WHERE fq.contrato_id = c.id AND fq.estado = 'vencida'
        )`
        const params = [empresaId]

        if (filtros.busqueda) {
            where += ` AND (c.numero LIKE ? OR CONCAT(cl.nombre,' ',IFNULL(cl.apellidos,'')) LIKE ? OR cl.numero_documento LIKE ?)`
            const b = `%${filtros.busqueda}%`
            params.push(b, b, b)
        }

        const [contratos] = await connection.execute(
            `SELECT
                c.id, c.numero, c.saldo_pendiente, c.fecha_fin,
                CONCAT(cl.nombre, IFNULL(CONCAT(' ', cl.apellidos),'')) AS cliente_nombre,
                cl.numero_documento AS cliente_documento,
                cl.telefono AS cliente_telefono,
                p.nombre AS plan_nombre,
                p.mora_pct, p.dias_gracia,
                (SELECT COUNT(*) FROM fin_cuotas fq WHERE fq.contrato_id = c.id AND fq.estado = 'vencida') AS cuotas_vencidas,
                (SELECT MIN(fq2.fecha_vencimiento) FROM fin_cuotas fq2 WHERE fq2.contrato_id = c.id AND fq2.estado = 'vencida') AS primera_vencida,
                (SELECT SUM(fq3.monto) FROM fin_cuotas fq3 WHERE fq3.contrato_id = c.id AND fq3.estado = 'vencida') AS monto_vencido
            FROM fin_contratos c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN fin_planes p ON c.plan_id = p.id
            WHERE ${where}
            ORDER BY cuotas_vencidas DESC, primera_vencida ASC`,
            params
        )

        const hoy = new Date(); hoy.setHours(0,0,0,0)
        const resultado = contratos.map(c => {
            const ser = serializarFila(c)
            if (ser.primera_vencida) {
                const [y,m,d] = ser.primera_vencida.split('-').map(Number)
                ser.dias_mora = Math.floor((hoy - new Date(y,m-1,d)) / 86400000)
            } else {
                ser.dias_mora = 0
            }
            return ser
        })

        connection.release()
        return { success: true, contratos: resultado }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, contratos: [] }
    }
}

export async function obtenerDatosPagoParaImprimir(pagoId) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const [[pago]] = await connection.execute(
            `SELECT p.*, c.numero AS contrato_numero, c.meses, c.frecuencia,
                    CONCAT(cl.nombre,IFNULL(CONCAT(' ',cl.apellidos),'')) AS cliente_nombre,
                    cl.numero_documento AS cliente_documento,
                    cl.telefono AS cliente_telefono,
                    cl.direccion AS cliente_direccion,
                    mp.nombre AS metodo_pago_nombre,
                    u.nombre AS usuario_nombre
             FROM fin_pagos p
             JOIN fin_contratos c ON p.contrato_id = c.id
             JOIN clientes cl ON c.cliente_id = cl.id
             LEFT JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
             LEFT JOIN usuarios u ON p.usuario_id = u.id
             WHERE p.id = ? AND p.empresa_id = ?`,
            [pagoId, empresaId]
        )
        if (!pago) { connection.release(); return { success: false, mensaje: 'Pago no encontrado' } }

        const [cuotasAplicadas] = await connection.execute(
            `SELECT pc.monto AS aplicado, cu.numero, cu.fecha_vencimiento, cu.estado,
                    cu.capital, cu.interes, cu.mora
             FROM fin_pago_cuotas pc
             JOIN fin_cuotas cu ON pc.cuota_id = cu.id
             WHERE pc.pago_id = ? ORDER BY cu.numero ASC`,
            [pagoId]
        )

        const [[contrato]] = await connection.execute(
            `SELECT co.saldo_pendiente,
                    (SELECT COUNT(*) FROM fin_cuotas fq WHERE fq.contrato_id = co.id AND fq.estado IN ('pendiente','vencida','parcial')) AS cuotas_restantes
             FROM fin_contratos co WHERE co.id = ?`,
            [pago.contrato_id]
        )

        const [empresa] = await connection.execute(
            `SELECT id, nombre_empresa, rnc, razon_social, direccion, telefono, email,
                    impuesto_nombre, impuesto_porcentaje, moneda, locale, simbolo_moneda, mensaje_factura
             FROM empresas WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )

        connection.release()
        return {
            success: true,
            pago: serializarFila(pago),
            cuotasAplicadas: cuotasAplicadas.map(serializarFila),
            contrato: serializarFila(contrato),
            empresa: empresa[0]
        }
    } catch (error) {
        console.error('obtenerDatosPagoParaImprimir:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT moneda, simbolo_moneda, locale, impuesto_nombre, impuesto_porcentaje
             FROM empresas
             WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )

        connection.release()

        if (rows.length === 0) {
            return { success: false, mensaje: 'Empresa no encontrada' }
        }

        return { success: true, empresa: rows[0] }
    } catch (error) {
        console.error('Error al obtener datos empresa:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al obtener datos empresa' }
    }
}