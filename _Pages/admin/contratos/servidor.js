"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

// ─── HELPERS ────────────────────────────────────────────────────────────────

function calcularCuotaFrancesa(monto, tasaMensual, cuotas) {
    if (tasaMensual === 0) return monto / cuotas
    const r = tasaMensual / 100
    return (monto * r * Math.pow(1 + r, cuotas)) / (Math.pow(1 + r, cuotas) - 1)
}

function sumarMeses(fechaStr, meses) {
    const d = new Date(fechaStr)
    d.setMonth(d.getMonth() + meses)
    return d.toISOString().split('T')[0]
}

function sumarDias(fechaStr, dias) {
    const d = new Date(fechaStr)
    d.setDate(d.getDate() + dias)
    return d.toISOString().split('T')[0]
}

function generarNumeroContrato(empresaId, secuencia) {
    return `FIN-${empresaId}-${String(secuencia).padStart(6, '0')}`
}

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}

async function getUserId() {
    const cookieStore = await cookies()
    return cookieStore.get('userId')?.value
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export async function obtenerDashboardContratos() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [stats] = await connection.execute(
            `SELECT
                COUNT(*) as total_contratos,
                SUM(estado = 'activo') as contratos_activos,
                SUM(estado = 'pagado') as contratos_pagados,
                SUM(estado = 'incumplido') as contratos_incumplidos,
                SUM(estado = 'reestructurado') as contratos_reestructurados,
                SUM(estado = 'cancelado') as contratos_cancelados,
                COALESCE(SUM(monto_financiado), 0) as total_financiado,
                COALESCE(SUM(saldo_pendiente), 0) as total_por_cobrar,
                COALESCE(SUM(monto_total - saldo_pendiente), 0) as total_cobrado,
                COALESCE(SUM(total_intereses), 0) as total_intereses,
                COALESCE(AVG(monto_financiado), 0) as promedio_financiado
            FROM fin_contratos
            WHERE empresa_id = ?
            AND estado <> 'cancelado'`,
            [empresaId]
        )

        const [statsCuotas] = await connection.execute(
            `SELECT
                SUM(cu.estado = 'pendiente') as cuotas_pendientes,
                SUM(cu.estado = 'vencida') as cuotas_vencidas,
                COALESCE(SUM(CASE WHEN cu.estado = 'vencida' THEN cu.mora ELSE 0 END), 0) as total_mora
            FROM fin_cuotas cu
            INNER JOIN fin_contratos c ON cu.contrato_id = c.id
            WHERE cu.empresa_id = ?
            AND c.estado <> 'cancelado'`,
            [empresaId]
        )

        const [cuotasProximas] = await connection.execute(
            `SELECT COUNT(*) as cantidad
            FROM fin_cuotas cu
            INNER JOIN fin_contratos c ON cu.contrato_id = c.id
            WHERE cu.empresa_id = ?
            AND cu.estado = 'pendiente'
            AND cu.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            AND c.estado <> 'cancelado'`,
            [empresaId]
        )

        const [contratosRecientes] = await connection.execute(
            `SELECT c.id, c.numero, c.monto_financiado, c.saldo_pendiente,
                    c.estado, c.fecha_inicio, c.meses, c.frecuencia,
                    cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos,
                    p.nombre as plan_nombre
            FROM fin_contratos c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN fin_planes p ON c.plan_id = p.id
            WHERE c.empresa_id = ?
            AND c.estado <> 'cancelado'
            ORDER BY c.created_at DESC
            LIMIT 10`,
            [empresaId]
        )

        const [evolucionMensual] = await connection.execute(
            `SELECT
                DATE_FORMAT(fecha_inicio, '%Y-%m') as mes,
                DATE_FORMAT(fecha_inicio, '%b') as mes_nombre,
                COUNT(*) as contratos,
                COALESCE(SUM(monto_financiado), 0) as monto_financiado
            FROM fin_contratos
            WHERE empresa_id = ?
            AND estado <> 'cancelado'
            AND fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(fecha_inicio, '%Y-%m'), DATE_FORMAT(fecha_inicio, '%b')
            ORDER BY mes ASC`,
            [empresaId]
        )

        const [pagosMensuales] = await connection.execute(
            `SELECT
                DATE_FORMAT(p.fecha, '%Y-%m') as mes,
                COALESCE(SUM(p.monto), 0) as total_pagado
            FROM fin_pagos p
            INNER JOIN fin_contratos c ON p.contrato_id = c.id
            WHERE p.empresa_id = ?
            AND p.fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            AND c.estado <> 'cancelado'
            GROUP BY DATE_FORMAT(p.fecha, '%Y-%m')`,
            [empresaId]
        )

        const evolucionCompleta = evolucionMensual.map(m => {
            const pago = pagosMensuales.find(p => p.mes === m.mes)
            return { ...m, pagos_recibidos: pago ? parseFloat(pago.total_pagado) : 0 }
        })

        const s = stats[0]
        const distribucionEstados = [
            { nombre: 'Activos',        valor: parseInt(s.contratos_activos || 0),        color: '#10b981' },
            { nombre: 'Pagados',        valor: parseInt(s.contratos_pagados || 0),        color: '#3b82f6' },
            { nombre: 'Incumplidos',    valor: parseInt(s.contratos_incumplidos || 0),    color: '#ef4444' },
            { nombre: 'Reestructurados',valor: parseInt(s.contratos_reestructurados || 0),color: '#f59e0b' }
        ]

        const alertas = []
        if (parseInt(statsCuotas[0]?.cuotas_vencidas || 0) > 0)
            alertas.push({ tipo: 'danger', icono: 'alert-circle-outline', titulo: 'Cuotas Vencidas', mensaje: `${statsCuotas[0].cuotas_vencidas} cuotas requieren atención inmediata`, enlace: '/admin/notificaciones' })
        if (parseInt(cuotasProximas[0]?.cantidad || 0) > 0)
            alertas.push({ tipo: 'warning', icono: 'time-outline', titulo: 'Cuotas Próximas', mensaje: `${cuotasProximas[0].cantidad} cuotas vencen en los próximos 7 días`, enlace: '/admin/notificaciones' })
        if (parseInt(s.contratos_incumplidos || 0) > 0)
            alertas.push({ tipo: 'danger', icono: 'warning-outline', titulo: 'Contratos en Incumplimiento', mensaje: `${s.contratos_incumplidos} contratos en incumplimiento`, enlace: '/admin/contratos/listar?estado=incumplido' })

        const [topClientes] = await connection.execute(
            `SELECT cl.id, cl.nombre,
                COUNT(c.id) as total_contratos,
                COALESCE(SUM(c.monto_financiado), 0) as total_financiado,
                COALESCE(SUM(c.saldo_pendiente), 0) as saldo_pendiente
            FROM fin_contratos c
            INNER JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.empresa_id = ? AND c.estado = 'activo'
            GROUP BY cl.id, cl.nombre
            ORDER BY total_financiado DESC
            LIMIT 5`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            estadisticas: {
                total_contratos:         parseInt(s.total_contratos || 0),
                contratos_activos:       parseInt(s.contratos_activos || 0),
                contratos_pagados:       parseInt(s.contratos_pagados || 0),
                contratos_incumplidos:   parseInt(s.contratos_incumplidos || 0),
                total_financiado:        parseFloat(s.total_financiado || 0),
                total_por_cobrar:        parseFloat(s.total_por_cobrar || 0),
                total_cobrado:           parseFloat(s.total_cobrado || 0),
                total_intereses:         parseFloat(s.total_intereses || 0),
                promedio_financiado:     parseFloat(s.promedio_financiado || 0),
                cuotas_pendientes:       parseInt(statsCuotas[0]?.cuotas_pendientes || 0),
                cuotas_vencidas:         parseInt(statsCuotas[0]?.cuotas_vencidas || 0),
                total_mora:              parseFloat(statsCuotas[0]?.total_mora || 0),
                cuotas_proximas:         parseInt(cuotasProximas[0]?.cantidad || 0),
                contratos_cancelados:    parseInt(s.contratos_cancelados || 0)
            },
            contratosRecientes,
            distribucionEstados,
            evolucionMensual: evolucionCompleta,
            alertas,
            topClientes
        }

    } catch (error) {
        console.error('obtenerDashboardContratos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message, estadisticas: {}, contratosRecientes: [], distribucionEstados: [], evolucionMensual: [], alertas: [], topClientes: [] }
    }
}

// ─── LISTAR CONTRATOS ────────────────────────────────────────────────────────

export async function obtenerContratos(filtros = {}) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const pagina = filtros.pagina || 1
        const limite = filtros.limite || 20
        const offset = (pagina - 1) * limite

        let where = 'c.empresa_id = ?'
        const params = [empresaId]

        if (filtros.estado) { where += ' AND c.estado = ?'; params.push(filtros.estado) }
        if (filtros.buscar) {
            where += ' AND (c.numero LIKE ? OR cl.nombre LIKE ? OR cl.apellidos LIKE ?)'
            const b = `%${filtros.buscar}%`
            params.push(b, b, b)
        }
        if (filtros.cliente_id) { where += ' AND c.cliente_id = ?'; params.push(filtros.cliente_id) }

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(*) as total
            FROM fin_contratos c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            WHERE ${where}`,
            params
        )

        const [contratos] = await connection.execute(
            `SELECT c.id, c.numero, c.monto_total, c.monto_inicial, c.monto_financiado,
                    c.total_intereses, c.total_pagar, c.saldo_pendiente,
                    c.meses, c.frecuencia, c.tasa_interes, c.cuota_mensual,
                    c.fecha_inicio, c.fecha_fin, c.estado, c.notas,
                    cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos,
                    cl.numero_documento as cliente_documento, cl.telefono as cliente_telefono,
                    p.nombre as plan_nombre, p.codigo as plan_codigo,
                    u.nombre as vendedor_nombre
            FROM fin_contratos c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN fin_planes p ON c.plan_id = p.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE ${where}
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, limite, offset]
        )

        connection.release()

        return {
            success: true,
            contratos,
            paginacion: { pagina, limite, total: parseInt(total), totalPaginas: Math.ceil(total / limite) }
        }

    } catch (error) {
        console.error('obtenerContratos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message, contratos: [] }
    }
}

// ─── DETALLE DE CONTRATO ─────────────────────────────────────────────────────

export async function obtenerContratoPorId(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [contratos] = await connection.execute(
            `SELECT c.*,
                    cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos,
                    cl.numero_documento as cliente_documento, cl.telefono as cliente_telefono,
                    cl.email as cliente_email, cl.direccion as cliente_direccion,
                    p.nombre as plan_nombre, p.codigo as plan_codigo,
                    p.mora_pct, p.dias_gracia,
                    u.nombre as vendedor_nombre
            FROM fin_contratos c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN fin_planes p ON c.plan_id = p.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.id = ? AND c.empresa_id = ?`,
            [id, empresaId]
        )

        if (!contratos.length) { connection.release(); return { success: false, mensaje: 'Contrato no encontrado' } }

        const [cuotas] = await connection.execute(
            `SELECT * FROM fin_cuotas WHERE contrato_id = ? ORDER BY numero ASC`,
            [id]
        )

        const [pagos] = await connection.execute(
            `SELECT p.*, u.nombre as registrado_por_nombre, mp.nombre as metodo_nombre
            FROM fin_pagos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
            WHERE p.contrato_id = ?
            ORDER BY p.fecha DESC`,
            [id]
        )

        const [activos] = await connection.execute(
            `SELECT * FROM fin_contrato_activos WHERE contrato_id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        const [fiadores] = await connection.execute(
            `SELECT * FROM fin_fiadores WHERE contrato_id = ?`,
            [id]
        )

        connection.release()

        return { success: true, contrato: contratos[0], cuotas, pagos, activos, fiadores }

    } catch (error) {
        console.error('obtenerContratoPorId:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

// ─── CREAR CONTRATO ───────────────────────────────────────────────────────────

export async function crearContratoFinanciamiento(datos) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        const userId = await getUserId()
        if (!empresaId || !userId) return { success: false, mensaje: 'Sesión inválida' }

        const montoTotal     = parseFloat(datos.monto_total)
        const montoInicial   = parseFloat(datos.monto_inicial || 0)
        const montoFinanciado = montoTotal - montoInicial

        if (montoFinanciado <= 0) return { success: false, mensaje: 'El inicial no puede ser mayor o igual al monto total' }

        connection = await db.getConnection()

        // Validar plan y opción
        const [planes] = await connection.execute(
            `SELECT * FROM fin_planes WHERE id = ? AND empresa_id = ? AND activo = 1`,
            [datos.plan_id, empresaId]
        )
        if (!planes.length) { connection.release(); return { success: false, mensaje: 'Plan no encontrado o inactivo' } }
        const plan = planes[0]

        const [opciones] = await connection.execute(
            `SELECT * FROM fin_plan_opciones WHERE id = ? AND plan_id = ?`,
            [datos.opcion_id, datos.plan_id]
        )
        if (!opciones.length) { connection.release(); return { success: false, mensaje: 'Opción de plazo no encontrada' } }
        const opcion = opciones[0]

        // Validar monto mínimo/máximo del plan
        if (plan.monto_minimo && montoFinanciado < parseFloat(plan.monto_minimo))
            return { success: false, mensaje: `El monto mínimo a financiar es ${plan.monto_minimo}` }
        if (plan.monto_maximo && montoFinanciado > parseFloat(plan.monto_maximo))
            return { success: false, mensaje: `El monto máximo a financiar es ${plan.monto_maximo}` }

        // Calcular cuota usando tasa del plan (mensual)
        const meses = opcion.meses
        const tasaMensual = parseFloat(plan.tasa_interes || 0)
        const cuotaMensual = calcularCuotaFrancesa(montoFinanciado, tasaMensual, meses)
        const totalPagar = cuotaMensual * meses
        const totalIntereses = totalPagar - montoFinanciado

        // Fechas
        const fechaInicio = datos.fecha_inicio || new Date().toISOString().split('T')[0]
        const fechaFin = sumarMeses(fechaInicio, meses)

        // Número de contrato (verificar duplicado antes de insertar)
        await connection.beginTransaction()
        try {
            const [[{ ultimo }]] = await connection.execute(
                `SELECT MAX(id) as ultimo FROM fin_contratos WHERE empresa_id = ?`,
                [empresaId]
            )
            let secuencia = (ultimo || 0)
            let numero
            while (true) {
                secuencia++
                numero = generarNumeroContrato(empresaId, secuencia)
                const [[{ cnt }]] = await connection.execute(
                    `SELECT COUNT(*) as cnt FROM fin_contratos WHERE numero = ?`,
                    [numero]
                )
                if (cnt === 0) break
            }

            const [res] = await connection.execute(
                `INSERT INTO fin_contratos
                    (empresa_id, usuario_id, cliente_id, plan_id, opcion_id, numero,
                     monto_total, monto_inicial, monto_financiado, total_intereses, total_pagar,
                     saldo_pendiente, meses, frecuencia, tasa_interes, cuota_mensual,
                     fecha_inicio, fecha_fin, notas, estado)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'activo')`,
                [
                    empresaId, userId, datos.cliente_id, datos.plan_id, datos.opcion_id, numero,
                    montoTotal, montoInicial, montoFinanciado, totalIntereses, totalPagar,
                    montoFinanciado, meses, plan.frecuencia, tasaMensual, cuotaMensual,
                    fechaInicio, fechaFin, datos.notas || null
                ]
            )

            const contratoId = res.insertId

            // Generar cuotas (amortización francesa)
            let saldo = montoFinanciado
            const r = tasaMensual / 100
            for (let i = 1; i <= meses; i++) {
                const interes = r > 0 ? saldo * r : 0
                const capital = cuotaMensual - interes
                saldo -= capital
                const fechaVenc = sumarMeses(fechaInicio, i)

                await connection.execute(
                    `INSERT INTO fin_cuotas
                        (contrato_id, empresa_id, numero, monto, capital, interes, mora, fecha_vencimiento, estado)
                    VALUES (?,?,?,?,?,?,0,?,'pendiente')`,
                    [contratoId, empresaId, i, cuotaMensual, Math.max(0, capital), interes, fechaVenc]
                )
            }

            // Fiador si aplica
            if (datos.fiador_nombre) {
                await connection.execute(
                    `INSERT INTO fin_fiadores (contrato_id, nombre, cedula, telefono, email, direccion)
                    VALUES (?,?,?,?,?,?)`,
                    [contratoId, datos.fiador_nombre, datos.fiador_cedula || null, datos.fiador_telefono || null, datos.fiador_email || null, datos.fiador_direccion || null]
                )
            }

            // Activos si vienen
            if (datos.activos?.length) {
                for (const a of datos.activos) {
                    await connection.execute(
                        `INSERT INTO fin_contrato_activos (contrato_id, empresa_id, nombre, descripcion, serial, valor, imagen)
                        VALUES (?,?,?,?,?,?,?)`,
                        [contratoId, empresaId, a.nombre, a.descripcion || null, a.serial || null, a.valor || 0, a.imagen || null]
                    )
                }
            }

            await connection.commit()
            connection.release()

            return { success: true, contrato_id: contratoId, numero, mensaje: 'Contrato creado exitosamente' }

        } catch (err) {
            await connection.rollback()
            throw err
        }

    } catch (error) {
        console.error('crearContratoFinanciamiento:', error)
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

// ─── REGISTRAR PAGO ───────────────────────────────────────────────────────────

export async function registrarPagoCuota(cuotaId, datos) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        const userId = await getUserId()
        if (!empresaId || !userId) return { success: false, mensaje: 'Sesión inválida' }

        const monto = parseFloat(datos.monto)
        if (!monto || monto <= 0) return { success: false, mensaje: 'Monto inválido' }

        connection = await db.getConnection()

        const [cuotas] = await connection.execute(
            `SELECT fc.*, c.saldo_pendiente as contrato_saldo, c.cliente_id
            FROM fin_cuotas fc
            INNER JOIN fin_contratos c ON fc.contrato_id = c.id
            WHERE fc.id = ? AND fc.empresa_id = ?`,
            [cuotaId, empresaId]
        )
        if (!cuotas.length) { connection.release(); return { success: false, mensaje: 'Cuota no encontrada' } }

        const cuota = cuotas[0]
        const montoMora = parseFloat(cuota.mora || 0)
        const montoBase = parseFloat(cuota.monto)
        const totalCuota = montoBase + montoMora

        await connection.beginTransaction()
        try {
            const montoCapital = parseFloat(cuota.capital)
            const montoInteres = parseFloat(cuota.interes)

            // Insertar pago
            await connection.execute(
                `INSERT INTO fin_pagos
                    (contrato_id, empresa_id, usuario_id, monto, monto_capital, monto_interes, monto_mora, metodo_pago_id, referencia, notas, fecha)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    cuota.contrato_id, empresaId, userId,
                    monto, montoCapital, montoInteres, monto >= totalCuota ? montoMora : 0,
                    datos.metodo_pago_id || null, datos.referencia || null, datos.notas || null,
                    datos.fecha || new Date().toISOString().split('T')[0]
                ]
            )

            // Insertar relación pago-cuota
            const [[pagoInsertado]] = await connection.execute(
                `SELECT id FROM fin_pagos WHERE contrato_id = ? AND empresa_id = ? ORDER BY id DESC LIMIT 1`,
                [cuota.contrato_id, empresaId]
            )
            await connection.execute(
                `INSERT INTO fin_pago_cuotas (pago_id, cuota_id, monto) VALUES (?,?,?)`,
                [pagoInsertado.id, cuotaId, monto]
            )

            // Actualizar cuota
            const nuevoEstado = monto >= totalCuota ? 'pagada' : 'parcial'
            await connection.execute(
                `UPDATE fin_cuotas SET estado = ?, fecha_pago = ? WHERE id = ?`,
                [nuevoEstado, datos.fecha || new Date().toISOString().split('T')[0], cuotaId]
            )

            // Actualizar saldo del contrato
            const nuevoSaldo = Math.max(0, parseFloat(cuota.contrato_saldo) - monto)
            const estadoContrato = nuevoSaldo <= 0 ? 'pagado' : 'activo'
            await connection.execute(
                `UPDATE fin_contratos SET saldo_pendiente = ?, estado = ? WHERE id = ?`,
                [nuevoSaldo, estadoContrato, cuota.contrato_id]
            )

            await connection.commit()
            connection.release()

            return { success: true, mensaje: 'Pago registrado exitosamente' }

        } catch (err) {
            await connection.rollback()
            throw err
        }

    } catch (error) {
        console.error('registrarPagoCuota:', error)
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

// ─── ACTUALIZAR ESTADO ────────────────────────────────────────────────────────

export async function actualizarEstadoContrato(id, estado, notas = null) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        const estadosValidos = ['activo', 'pagado', 'incumplido', 'reestructurado', 'cancelado']
        if (!estadosValidos.includes(estado)) return { success: false, mensaje: 'Estado inválido' }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE fin_contratos SET estado = ?, notas = COALESCE(?, notas) WHERE id = ? AND empresa_id = ?`,
            [estado, notas, id, empresaId]
        )

        connection.release()
        return { success: true, mensaje: 'Estado actualizado' }

    } catch (error) {
        console.error('actualizarEstadoContrato:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

// ─── ELIMINAR CONTRATOS ───────────────────────────────────────────────────────

export async function eliminarContrato(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [contratos] = await connection.execute(
            `SELECT id, numero FROM fin_contratos WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )
        if (!contratos.length) { connection.release(); return { success: false, mensaje: 'Contrato no encontrado' } }

        await connection.beginTransaction()
        try {
            await connection.execute(
                `DELETE FROM fin_pago_cuotas WHERE pago_id IN (SELECT id FROM fin_pagos WHERE contrato_id = ?)`,
                [id]
            )
            await connection.execute(`DELETE FROM fin_pagos WHERE contrato_id = ?`, [id])
            await connection.execute(`DELETE FROM fin_cuotas WHERE contrato_id = ?`, [id])
            await connection.execute(`DELETE FROM fin_alertas WHERE contrato_id = ?`, [id])
            await connection.execute(`DELETE FROM fin_contrato_activos WHERE contrato_id = ?`, [id])
            await connection.execute(`DELETE FROM fin_fiadores WHERE contrato_id = ?`, [id])
            await connection.execute(`DELETE FROM fin_contrato_categorias WHERE contrato_id = ?`, [id])
            await connection.execute(`DELETE FROM fin_contratos WHERE id = ?`, [id])
            await connection.commit()
            connection.release()
            return { success: true, mensaje: `Contrato ${contratos[0].numero} eliminado correctamente` }
        } catch (err) {
            await connection.rollback()
            throw err
        }
    } catch (error) {
        console.error('eliminarContrato:', error)
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

export async function eliminarContratosCancelados() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [ids] = await connection.execute(
            `SELECT id FROM fin_contratos WHERE empresa_id = ? AND estado = 'cancelado'`,
            [empresaId]
        )
        if (ids.length === 0) {
            connection.release()
            return { success: true, eliminados: 0, mensaje: 'No hay contratos cancelados' }
        }

        const ph = ids.map(() => '?').join(',')

        await connection.beginTransaction()
        try {
            await connection.execute(
                `DELETE FROM fin_pago_cuotas WHERE pago_id IN (SELECT id FROM fin_pagos WHERE contrato_id IN (${ph}))`,
                ids.map(i => i.id)
            )
            await connection.execute(`DELETE FROM fin_pagos WHERE contrato_id IN (${ph})`, ids.map(i => i.id))
            await connection.execute(`DELETE FROM fin_cuotas WHERE contrato_id IN (${ph})`, ids.map(i => i.id))
            await connection.execute(`DELETE FROM fin_alertas WHERE contrato_id IN (${ph})`, ids.map(i => i.id))
            await connection.execute(`DELETE FROM fin_contrato_activos WHERE contrato_id IN (${ph})`, ids.map(i => i.id))
            await connection.execute(`DELETE FROM fin_fiadores WHERE contrato_id IN (${ph})`, ids.map(i => i.id))
            await connection.execute(`DELETE FROM fin_contrato_categorias WHERE contrato_id IN (${ph})`, ids.map(i => i.id))
            const [res] = await connection.execute(`DELETE FROM fin_contratos WHERE id IN (${ph})`, ids.map(i => i.id))
            await connection.commit()
            connection.release()
            return { success: true, eliminados: res.affectedRows, mensaje: `${res.affectedRows} contrato(s) cancelado(s) eliminado(s)` }
        } catch (err) {
            await connection.rollback()
            throw err
        }
    } catch (error) {
        console.error('eliminarContratosCancelados:', error)
        if (connection) { try { await connection.rollback() } catch {} connection.release() }
        return { success: false, mensaje: error.message }
    }
}

// ─── OBTENER PLANES ───────────────────────────────────────────────────────────

export async function obtenerPlanes() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [planes] = await connection.execute(
            `SELECT p.*, 
                JSON_ARRAYAGG(JSON_OBJECT(
                    'id', o.id, 'meses', o.meses,
                    'tasa_anual_pct', o.tasa_anual_pct,
                    'inicial_pct', o.inicial_pct,
                    'tipo', o.tipo
                )) as opciones
            FROM fin_planes p
            LEFT JOIN fin_plan_opciones o ON o.plan_id = p.id
            WHERE p.empresa_id = ? AND p.activo = 1
            GROUP BY p.id
            ORDER BY p.nombre ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            planes: planes.map(p => ({
                ...p,
                opciones: typeof p.opciones === 'string' ? JSON.parse(p.opciones) : p.opciones
            }))
        }

    } catch (error) {
        console.error('obtenerPlanes:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message, planes: [] }
    }
}

// ─── HISTORIAL DE PAGOS DE UN CLIENTE (fin_pagos) ────────────────────────────
export async function obtenerHistorialPagosCliente(clienteId) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [pagos] = await connection.execute(
            `SELECT fp.id, fp.monto, fp.monto_capital, fp.monto_interes, fp.monto_mora,
                    fp.metodo_pago_id, fp.referencia, fp.notas, fp.fecha,
                    fc.numero AS contrato_numero, fc.id AS contrato_id,
                    u.nombre AS registrado_por
             FROM fin_pagos fp
             INNER JOIN fin_contratos fc ON fp.contrato_id = fc.id
             LEFT JOIN usuarios u ON fp.usuario_id = u.id
             WHERE fc.cliente_id = ? AND fc.empresa_id = ?
             ORDER BY fp.fecha DESC, fp.id DESC`,
            [clienteId, empresaId]
        )

        connection.release()
        return { success: true, pagos }
    } catch (error) {
        console.error('obtenerHistorialPagosCliente:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

// ─── CUOTAS PENDIENTES DE UN CLIENTE (para tab Cobrar en financiamiento) ────
export async function obtenerDatosEmpresa() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }
        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT moneda, simbolo_moneda, impuesto_porcentaje, nombre_empresa, direccion, telefono, email, rnc FROM empresas WHERE id = ?`,
            [empresaId]
        )
        connection.release()
        const e = rows[0]
        return {
            success: true,
            empresa: {
                moneda: e?.moneda || 'DOP',
                simbolo_moneda: e?.simbolo_moneda || 'RD$',
                locale: e?.moneda === 'USD' ? 'en-US' : 'es-DO',
                itbis_incluido: true,
                nombre: e?.nombre_empresa || '',
                direccion: e?.direccion || '',
                telefono: e?.telefono || '',
                email: e?.email || '',
                rnc: e?.rnc || ''
            }
        }
    } catch (error) {
        console.error('obtenerDatosEmpresa:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function obtenerCuotasPendientesCliente(clienteId) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [cuotas] = await connection.execute(
            `SELECT fq.id, fq.numero, fq.monto, fq.capital, fq.interes, fq.mora,
                    fq.estado, fq.fecha_vencimiento, fq.fecha_pago,
                    fc.numero AS contrato_numero, fc.id AS contrato_id, fc.saldo_pendiente AS contrato_saldo
             FROM fin_cuotas fq
             INNER JOIN fin_contratos fc ON fq.contrato_id = fc.id
             WHERE fc.cliente_id = ? AND fc.empresa_id = ?
               AND fq.estado IN ('pendiente','vencida')
             ORDER BY fq.fecha_vencimiento ASC`,
            [clienteId, empresaId]
        )

        const [totales] = await connection.execute(
            `SELECT COALESCE(SUM(fc.saldo_pendiente),0) AS total_pendiente,
                    COUNT(DISTINCT fc.id)               AS contratos_activos
             FROM fin_contratos fc
             WHERE fc.cliente_id = ? AND fc.empresa_id = ? AND fc.estado = 'activo'`,
            [clienteId, empresaId]
        )

        connection.release()
        return {
            success: true,
            cuotas,
            totalPendiente: Number(totales[0]?.total_pendiente) || 0,
            contratosActivos: Number(totales[0]?.contratos_activos) || 0
        }
    } catch (error) {
        console.error('obtenerCuotasPendientesCliente:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}