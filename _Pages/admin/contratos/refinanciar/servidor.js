"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { 
    validarPlazo,
    validarMontoFinanciable
} from '../../core/finance/reglas.js'
import { validarDatosRefinanciacion } from '../../core/finance/validaciones.js'
import { 
    calcularAmortizacionFrancesa,
    generarCronograma,
    formatearNumeroContrato,
    tasaAnualAMensual
} from '../../core/finance/calculos.js'
import { ESTADOS_CONTRATO } from '../../core/finance/estados.js'

/**
 * Obtiene la información necesaria para refinanciar un contrato
 * @param {number} contratoId - ID del contrato a refinanciar
 * @returns {Object} { success: boolean, contrato?: Object, plan?: Object, planes?: Array, mensaje?: string }
 */
export async function obtenerDatosRefinanciacion(contratoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        // Obtener contrato con información completa
        const [contratos] = await connection.execute(
            `SELECT c.*,
                   cl.nombre as cliente_nombre,
                   p.nombre as plan_nombre,
                   p.codigo as plan_codigo
            FROM contratos_financiamiento c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
            WHERE c.id = ? AND c.empresa_id = ?`,
            [contratoId, empresaId]
        )

        if (contratos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Contrato no encontrado' }
        }

        const contrato = contratos[0]

        // Validar que el contrato puede ser refinanciado
        if (contrato.estado === ESTADOS_CONTRATO.PAGADO) {
            connection.release()
            return { success: false, mensaje: 'No se puede refinanciar un contrato ya pagado' }
        }

        if (contrato.estado === ESTADOS_CONTRATO.CANCELADO) {
            connection.release()
            return { success: false, mensaje: 'No se puede refinanciar un contrato cancelado' }
        }

        // Obtener planes activos disponibles
        const [planes] = await connection.execute(
            `SELECT * FROM planes_financiamiento
             WHERE (empresa_id = ? OR empresa_id IS NULL)
             AND activo = 1
             ORDER BY plazo_meses ASC`,
            [empresaId]
        )

        // Calcular saldo pendiente real (sumando mora pendiente)
        const [cuotasPendientes] = await connection.execute(
            `SELECT 
                SUM(monto_cuota - monto_pagado) as capital_pendiente,
                SUM(monto_mora) as mora_pendiente
             FROM cuotas_financiamiento
             WHERE contrato_id = ? AND estado != 'pagada'`,
            [contratoId]
        )

        const capitalPendiente = parseFloat(cuotasPendientes[0].capital_pendiente || 0)
        const moraPendiente = parseFloat(cuotasPendientes[0].mora_pendiente || 0)
        const saldoTotal = capitalPendiente + moraPendiente

        connection.release()

        return {
            success: true,
            contrato: {
                ...contrato,
                saldo_pendiente_real: saldoTotal,
                capital_pendiente: capitalPendiente,
                mora_pendiente: moraPendiente
            },
            planes
        }

    } catch (error) {
        console.error('Error al obtener datos de refinanciación:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar datos de refinanciación' }
    }
}

/**
 * Refinancia un contrato existente
 * @param {Object} datos - Datos de la refinanciación
 * @returns {Object} { success: boolean, nuevo_contrato_id?: number, numero_contrato?: string, mensaje?: string }
 */
export async function refinanciarContrato(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validar datos usando el dominio compartido
        const validacion = validarDatosRefinanciacion(datos)
        if (!validacion.valido) {
            return { success: false, mensaje: validacion.errores.join(', ') }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Obtener contrato original
            const [contratos] = await connection.execute(
                `SELECT c.*, p.tasa_interes_anual, p.dias_gracia
                 FROM contratos_financiamiento c
                 LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
                 WHERE c.id = ? AND c.empresa_id = ?`,
                [datos.contrato_id, empresaId]
            )

            if (contratos.length === 0) {
                throw new Error('Contrato no encontrado')
            }

            const contratoOriginal = contratos[0]

            // Validar que el contrato puede ser refinanciado
            if (contratoOriginal.estado === ESTADOS_CONTRATO.PAGADO) {
                throw new Error('No se puede refinanciar un contrato ya pagado')
            }

            if (contratoOriginal.estado === ESTADOS_CONTRATO.CANCELADO) {
                throw new Error('No se puede refinanciar un contrato cancelado')
            }

            // Obtener nuevo plan
            const [planes] = await connection.execute(
                `SELECT * FROM planes_financiamiento WHERE id = ?`,
                [datos.nuevo_plan_id]
            )

            if (planes.length === 0) {
                throw new Error('Plan de financiamiento no encontrado')
            }

            const nuevoPlan = planes[0]

            // Validar nuevo plazo
            const validacionPlazo = validarPlazo(datos.nuevo_plazo_meses)
            if (!validacionPlazo.valido) {
                throw new Error(validacionPlazo.error)
            }

            // Calcular saldo pendiente real (capital + mora)
            const [cuotasPendientes] = await connection.execute(
                `SELECT 
                    SUM(monto_cuota - monto_pagado) as capital_pendiente,
                    SUM(monto_mora) as mora_pendiente,
                    COUNT(*) as cuotas_pendientes
                 FROM cuotas_financiamiento
                 WHERE contrato_id = ? AND estado != 'pagada'`,
                [datos.contrato_id]
            )

            const capitalPendiente = parseFloat(cuotasPendientes[0].capital_pendiente || 0)
            const moraPendiente = parseFloat(cuotasPendientes[0].mora_pendiente || 0)
            const saldoTotal = capitalPendiente + moraPendiente

            if (saldoTotal <= 0) {
                throw new Error('El contrato no tiene saldo pendiente para refinanciar')
            }

            // Validar monto financiable
            const validacionMonto = validarMontoFinanciable(saldoTotal)
            if (!validacionMonto.valido) {
                throw new Error(validacionMonto.error)
            }

            // Calcular tasa mensual del nuevo plan
            const tasaMensual = tasaAnualAMensual(nuevoPlan.tasa_interes_anual)

            // Obtener siguiente número de contrato
            const [ultimoContrato] = await connection.execute(
                `SELECT numero_contrato FROM contratos_financiamiento
                 WHERE empresa_id = ?
                 ORDER BY id DESC LIMIT 1`,
                [empresaId]
            )

            let secuencia = 1
            if (ultimoContrato.length > 0) {
                const ultimoNum = ultimoContrato[0].numero_contrato
                const match = ultimoNum.match(/FIN-\d+-(\d+)/)
                if (match) {
                    secuencia = parseInt(match[1]) + 1
                }
            }

            const numeroContrato = formatearNumeroContrato(empresaId, secuencia)

            // Calcular amortización del nuevo contrato
            const amortizacion = calcularAmortizacionFrancesa(
                saldoTotal,
                tasaMensual,
                datos.nuevo_plazo_meses
            )

            // Calcular fecha del primer pago (próximo mes)
            const fechaPrimerPago = new Date()
            fechaPrimerPago.setMonth(fechaPrimerPago.getMonth() + 1)
            fechaPrimerPago.setDate(1) // Primer día del mes

            // Calcular fecha del último pago
            const fechaUltimoPago = new Date(fechaPrimerPago)
            fechaUltimoPago.setMonth(fechaUltimoPago.getMonth() + datos.nuevo_plazo_meses - 1)

            // Insertar nuevo contrato refinanciado
            const [resultContrato] = await connection.execute(
                `INSERT INTO contratos_financiamiento (
                    empresa_id, cliente_id, plan_id, usuario_id, numero_contrato,
                    numero_referencia, venta_id, ncf, precio_producto,
                    pago_inicial, monto_financiado, total_intereses,
                    total_a_pagar, numero_cuotas, monto_cuota,
                    tasa_interes_mensual, fecha_contrato, fecha_primer_pago,
                    fecha_ultimo_pago, monto_pagado, saldo_pendiente,
                    cuotas_pagadas, estado, notas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    contratoOriginal.cliente_id,
                    datos.nuevo_plan_id,
                    userId,
                    numeroContrato,
                    `REF-${contratoOriginal.numero_contrato}`,
                    contratoOriginal.venta_id,
                    contratoOriginal.ncf,
                    saldoTotal, // El precio del producto refinanciado es el saldo pendiente
                    0, // No hay pago inicial en refinanciación
                    saldoTotal,
                    amortizacion.totalIntereses,
                    amortizacion.totalPagar,
                    datos.nuevo_plazo_meses,
                    amortizacion.cuotaMensual,
                    tasaMensual,
                    new Date().toISOString().split('T')[0],
                    fechaPrimerPago.toISOString().split('T')[0],
                    fechaUltimoPago.toISOString().split('T')[0],
                    0,
                    saldoTotal,
                    0,
                    ESTADOS_CONTRATO.ACTIVO,
                    `Refinanciación del contrato ${contratoOriginal.numero_contrato}. Motivo: ${datos.motivo}`
                ]
            )

            const nuevoContratoId = resultContrato.insertId

            // Generar cuotas del nuevo contrato
            const cronograma = generarCronograma({
                monto_financiado: saldoTotal,
                numero_cuotas: datos.nuevo_plazo_meses,
                fecha_primer_pago: fechaPrimerPago.toISOString().split('T')[0],
                tasa_interes_mensual: tasaMensual,
                dias_gracia: nuevoPlan.dias_gracia || 5
            })

            // Insertar cuotas del nuevo contrato
            for (const cuota of cronograma) {
                await connection.execute(
                    `INSERT INTO cuotas_financiamiento (
                        contrato_id, empresa_id, cliente_id, numero_cuota,
                        fecha_vencimiento, fecha_fin_gracia, monto_capital,
                        monto_interes, monto_cuota, saldo_restante,
                        monto_pagado, monto_mora, total_a_pagar, estado, dias_atraso
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        nuevoContratoId,
                        empresaId,
                        contratoOriginal.cliente_id,
                        cuota.numero_cuota,
                        cuota.fecha_vencimiento,
                        cuota.fecha_fin_gracia,
                        cuota.monto_capital,
                        cuota.monto_interes,
                        cuota.monto_cuota,
                        cuota.saldo_restante,
                        0,
                        0,
                        cuota.monto_cuota,
                        'pendiente',
                        0
                    ]
                )
            }

            // Marcar contrato original como reestructurado
            await connection.execute(
                `UPDATE contratos_financiamiento
                 SET estado = ?,
                     razon_estado = ?,
                     notas_internas = CONCAT(COALESCE(notas_internas, ''), '\n', ?)
                 WHERE id = ?`,
                [
                    ESTADOS_CONTRATO.REESTRUCTURADO,
                    `Refinanciado. Nuevo contrato: ${numeroContrato}`,
                    `Refinanciado el ${new Date().toISOString().split('T')[0]}. Nuevo contrato: ${numeroContrato}. Motivo: ${datos.motivo}`,
                    datos.contrato_id
                ]
            )

            // Actualizar activos para que apunten al nuevo contrato
            await connection.execute(
                `UPDATE activos_productos
                 SET contrato_financiamiento_id = ?
                 WHERE contrato_financiamiento_id = ?`,
                [nuevoContratoId, datos.contrato_id]
            )

            await connection.commit()
            connection.release()

            return {
                success: true,
                nuevo_contrato_id: nuevoContratoId,
                numero_contrato: numeroContrato,
                mensaje: 'Contrato refinanciado exitosamente'
            }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al refinanciar contrato:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al refinanciar contrato: ' + error.message }
    }
}

