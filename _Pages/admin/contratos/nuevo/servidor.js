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

function sumarPeriodos(fechaStr, cantidad, frecuencia) {
    const d = new Date(fechaStr)
    if (frecuencia === 'mensual')   d.setMonth(d.getMonth() + cantidad)
    if (frecuencia === 'quincenal') d.setDate(d.getDate() + cantidad * 15)
    if (frecuencia === 'semanal')   d.setDate(d.getDate() + cantidad * 7)
    return d.toISOString().split('T')[0]
}

function distribuirAdelanto(numeroCuotas, cuotaMensual, capitalPorCuota, interesPorCuota, adelanto) {
    const cuotas = []
    let restante = Math.max(0, parseFloat(adelanto || 0))
    let totalCapital = 0
    let totalInteres = 0

    for (let i = 1; i <= numeroCuotas; i++) {
        if (restante <= 0) {
            cuotas.push({ numero: i, estado: 'pendiente', montoPagado: 0 })
            continue
        }
        if (restante >= cuotaMensual) {
            cuotas.push({ numero: i, estado: 'pagada', montoPagado: cuotaMensual })
            totalCapital += capitalPorCuota
            totalInteres += interesPorCuota
            restante -= cuotaMensual
        } else {
            const ratio = restante / cuotaMensual
            cuotas.push({ numero: i, estado: 'parcial', montoPagado: restante })
            totalCapital += capitalPorCuota * ratio
            totalInteres += interesPorCuota * ratio
            restante = 0
        }
    }

    return { cuotas, totalCapital, totalInteres }
}

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const empresaId = await getEmpresaId()
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

export async function obtenerClientePorId(clienteId) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, cliente: null }
        connection = await db.getConnection()
        const [[cliente]] = await connection.execute(
            `SELECT id, nombre, apellidos, numero_documento, telefono, email, direccion
             FROM clientes WHERE id = ? AND empresa_id = ? LIMIT 1`,
            [clienteId, empresaId]
        )
        connection.release()
        return { success: !!cliente, cliente: cliente || null }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, cliente: null }
    }
}

export async function buscarClientes(q) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, clientes: [] }

        connection = await db.getConnection()
        const [clientes] = await connection.execute(
            `SELECT id, nombre, apellidos, numero_documento, telefono, email, direccion
             FROM clientes
             WHERE empresa_id = ?
               AND (nombre LIKE ? OR apellidos LIKE ? OR numero_documento LIKE ? OR telefono LIKE ?)
             ORDER BY nombre ASC
             LIMIT 200`,
            [empresaId, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
        )
        connection.release()
        return { success: true, clientes }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, clientes: [] }
    }
}

export async function obtenerPlanesConOpciones() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, planes: [] }

        connection = await db.getConnection()
        const [planes] = await connection.execute(
            `SELECT * FROM fin_planes WHERE empresa_id = ? AND activo = 1 ORDER BY nombre ASC`,
            [empresaId]
        )
        for (const plan of planes) {
            const [opciones] = await connection.execute(
                `SELECT * FROM fin_plan_opciones WHERE plan_id = ? ORDER BY meses ASC`,
                [plan.id]
            )
            plan.opciones = opciones
        }
        connection.release()
        return { success: true, planes }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, planes: [] }
    }
}

export async function crearContratoFinanciamiento(datos) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        const userId    = await getUserId()
        if (!empresaId || !userId) return { success: false, mensaje: 'Sesion invalida' }

        if (!datos.cliente_id) return { success: false, mensaje: 'Selecciona un cliente' }
        if (!datos.plan_id)    return { success: false, mensaje: 'Selecciona un plan' }
        if (!datos.monto_total || parseFloat(datos.monto_total) <= 0)
            return { success: false, mensaje: 'El monto debe ser mayor a 0' }

        connection = await db.getConnection()

        const [[plan]] = await connection.execute(
            `SELECT * FROM fin_planes WHERE id = ? AND empresa_id = ? AND activo = 1`,
            [datos.plan_id, empresaId]
        )
        if (!plan) { connection.release(); return { success: false, mensaje: 'Plan no encontrado' } }

        let numeroCuotas = null
        let opcionId     = null

        if (datos.meses_manual && parseInt(datos.meses_manual) > 0) {
            numeroCuotas = parseInt(datos.meses_manual)
            opcionId     = datos.opcion_id || null
        } else if (datos.opcion_id) {
            const [[opcion]] = await connection.execute(
                `SELECT * FROM fin_plan_opciones WHERE id = ? AND plan_id = ?`,
                [datos.opcion_id, datos.plan_id]
            )
            if (!opcion) { connection.release(); return { success: false, mensaje: 'Opcion de plazo no encontrada' } }
            numeroCuotas = opcion.meses
            opcionId     = opcion.id
        } else {
            connection.release()
            return { success: false, mensaje: 'Define el numero de cuotas' }
        }

        const montoTotal      = parseFloat(datos.monto_total)
        const montoAdelantado = parseFloat(datos.monto_adelantado || 0)
        const montoFinanciado = montoTotal
        const montoInicial    = montoAdelantado

        if (montoFinanciado <= 0) {
            connection.release()
            return { success: false, mensaje: 'El monto debe ser mayor a 0' }
        }

        const tasaInteres     = parseFloat(plan.tasa_interes || 0)
        const totalPagar      = montoFinanciado * (1 + tasaInteres / 100)
        const totalIntereses  = totalPagar - montoFinanciado
        const cuotaMensual    = totalPagar / numeroCuotas
        const interesPorCuota = totalIntereses / numeroCuotas
        const capitalPorCuota = montoFinanciado / numeroCuotas

        if (montoAdelantado < 0) {
            connection.release()
            return { success: false, mensaje: 'El adelanto no puede ser negativo' }
        }
        if (montoAdelantado >= totalPagar) {
            connection.release()
            return { success: false, mensaje: 'El adelanto debe ser menor al total a pagar' }
        }

        const { cuotas: cuotasAdelanto, totalCapital: adelantoCapital, totalInteres: adelantoInteres } =
            distribuirAdelanto(numeroCuotas, cuotaMensual, capitalPorCuota, interesPorCuota, montoAdelantado)

        const saldoPendiente = totalPagar - montoAdelantado

        const fechaInicio = datos.fecha_inicio || new Date().toISOString().split('T')[0]
        const fechaFin    = sumarPeriodos(fechaInicio, numeroCuotas, plan.frecuencia)

        await connection.beginTransaction()
        try {
            let secuencia = 0
            let numero
            while (true) {
                secuencia++
                numero = `FIN-${empresaId}-${String(secuencia).padStart(6, '0')}`
                const [[{ cnt }]] = await connection.execute(
                    `SELECT COUNT(*) as cnt FROM fin_contratos WHERE numero = ?`,
                    [numero]
                )
                if (cnt === 0) break
            }

            let sql, params

            if (opcionId) {
                sql = `INSERT INTO fin_contratos
                    (empresa_id, usuario_id, cliente_id, plan_id, opcion_id, numero,
                     monto_total, monto_inicial, monto_financiado, total_intereses, total_pagar,
                     saldo_pendiente, meses, frecuencia, tasa_interes, cuota_mensual,
                     fecha_inicio, fecha_fin, notas, estado)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
                params = [
                    empresaId, userId, datos.cliente_id, datos.plan_id, opcionId,
                    numero,
                    montoTotal, montoInicial, montoFinanciado, totalIntereses, totalPagar,
                    saldoPendiente, numeroCuotas, plan.frecuencia, tasaInteres, cuotaMensual,
                    fechaInicio, fechaFin, datos.notas || null, 'activo'
                ]
            } else {
                sql = `INSERT INTO fin_contratos
                    (empresa_id, usuario_id, cliente_id, plan_id, numero,
                     monto_total, monto_inicial, monto_financiado, total_intereses, total_pagar,
                     saldo_pendiente, meses, frecuencia, tasa_interes, cuota_mensual,
                     fecha_inicio, fecha_fin, notas, estado)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
                params = [
                    empresaId, userId, datos.cliente_id, datos.plan_id,
                    numero,
                    montoTotal, montoInicial, montoFinanciado, totalIntereses, totalPagar,
                    saldoPendiente, numeroCuotas, plan.frecuencia, tasaInteres, cuotaMensual,
                    fechaInicio, fechaFin, datos.notas || null, 'activo'
                ]
            }

            const [res] = await connection.execute(sql, params)
            const contratoId = res.insertId

            const cuotasInsertadas = []
            for (let i = 1; i <= numeroCuotas; i++) {
                const fechaVenc = sumarPeriodos(fechaInicio, i, plan.frecuencia)
                const infoAdelanto = cuotasAdelanto[i - 1]
                const estadoCuota  = infoAdelanto.estado
                const fechaPago    = estadoCuota !== 'pendiente' ? fechaInicio : null

                const [cuotaRes] = await connection.execute(
                    `INSERT INTO fin_cuotas
                        (contrato_id, empresa_id, numero, monto, capital, interes, mora, fecha_vencimiento, fecha_pago, estado)
                     VALUES (?,?,?,?,?,?,0,?,?,?)`,
                    [contratoId, empresaId, i, cuotaMensual, capitalPorCuota, interesPorCuota, fechaVenc, fechaPago, estadoCuota]
                )
                cuotasInsertadas.push({ id: cuotaRes.insertId, ...infoAdelanto })
            }

            if (montoAdelantado > 0) {
                const [pagoRes] = await connection.execute(
                    `INSERT INTO fin_pagos
                        (contrato_id, empresa_id, usuario_id, monto, monto_capital, monto_interes, monto_mora, metodo_pago_id, referencia, notas, fecha)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        contratoId, empresaId, userId,
                        montoAdelantado, adelantoCapital, adelantoInteres, 0,
                        null, null,
                        'Pago adelantado al crear el contrato',
                        fechaInicio
                    ]
                )
                const pagoId = pagoRes.insertId
                for (const c of cuotasInsertadas) {
                    if (c.montoPagado > 0) {
                        await connection.execute(
                            `INSERT INTO fin_pago_cuotas (pago_id, cuota_id, monto) VALUES (?,?,?)`,
                            [pagoId, c.id, c.montoPagado]
                        )
                    }
                }
            }

            if (datos.fiador_nombre?.trim()) {
                await connection.execute(
                    `INSERT INTO fin_fiadores (contrato_id, nombre, cedula, telefono, email, direccion)
                     VALUES (?,?,?,?,?,?)`,
                    [contratoId, datos.fiador_nombre, datos.fiador_cedula || null, datos.fiador_telefono || null, datos.fiador_email || null, datos.fiador_direccion || null]
                )
            }

            if (datos.activos?.length) {
                for (const a of datos.activos) {
                    if (!a.nombre?.trim()) continue
                    await connection.execute(
                        `INSERT INTO fin_contrato_activos
                            (contrato_id, empresa_id, nombre, descripcion, serial, valor, imagen)
                         VALUES (?,?,?,?,?,?,?)`,
                        [contratoId, empresaId, a.nombre, a.descripcion || null, a.serial || null, parseFloat(a.valor || 0), null]
                    )
                }
            }

            await connection.execute(
                `INSERT INTO fin_alertas (empresa_id, contrato_id, tipo, mensaje, estado)
                 VALUES (?,?,?,?,?)`,
                [empresaId, contratoId, 'vencimiento', `Contrato ${numero} creado. Primera cuota vence el ${sumarPeriodos(fechaInicio, 1, plan.frecuencia)}.`, 'activa']
            )

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