import { NextResponse } from 'next/server'
import db from '@/_DB/db'
import { cookies } from 'next/headers'

/**
 * POST /api/financiamiento/pagos
 * Registrar un pago de cuota
 */
export async function POST(request) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return NextResponse.json(
                { success: false, mensaje: 'Sesión inválida' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            cuota_id,
            monto_pago,
            metodo_pago,
            fecha_pago,
            numero_referencia,
            ultimos_digitos_tarjeta,
            nombre_banco,
            caja_id,
            notas
        } = body

        if (!cuota_id || !monto_pago || !metodo_pago) {
            return NextResponse.json(
                { success: false, mensaje: 'Datos incompletos' },
                { status: 400 }
            )
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Obtener cuota
            const [cuotas] = await connection.execute(
                `SELECT c.*, co.plan_id, co.cliente_id
                 FROM cuotas_financiamiento c
                 INNER JOIN contratos_financiamiento co ON c.contrato_id = co.id
                 WHERE c.id = ? AND c.empresa_id = ?`,
                [cuota_id, empresaId]
            )

            if (cuotas.length === 0) {
                throw new Error('Cuota no encontrada')
            }

            const cuota = cuotas[0]

            // Calcular mora si aplica
            const fechaVenc = new Date(cuota.fecha_vencimiento)
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)
            fechaVenc.setHours(0, 0, 0, 0)
            const diasAtraso = Math.max(0, Math.floor((hoy - fechaVenc) / (1000 * 60 * 60 * 24)))

            let montoMora = 0
            if (diasAtraso > 0) {
                const [planes] = await connection.execute(
                    `SELECT penalidad_mora_pct, dias_gracia FROM planes_financiamiento WHERE id = ?`,
                    [cuota.plan_id]
                )

                if (planes.length > 0) {
                    const plan = planes[0]
                    const diasGracia = plan.dias_gracia || 5
                    if (diasAtraso > diasGracia) {
                        const tasaMora = plan.penalidad_mora_pct / 100
                        const diasMora = diasAtraso - diasGracia
                        const moraDiaria = (cuota.monto_cuota * tasaMora) / 30
                        montoMora = Math.round(moraDiaria * diasMora * 100) / 100
                    }
                }
            }

            // Obtener siguiente número de recibo
            const [ultimoRecibo] = await connection.execute(
                `SELECT numero_recibo FROM pagos_financiamiento
                 WHERE empresa_id = ?
                 ORDER BY id DESC LIMIT 1`,
                [empresaId]
            )

            let secuencia = 1
            if (ultimoRecibo.length > 0) {
                const ultimoNum = ultimoRecibo[0].numero_recibo
                const match = ultimoNum.match(/REC-\d+-(\d+)/)
                if (match) {
                    secuencia = parseInt(match[1]) + 1
                }
            }

            const numeroRecibo = `REC-${new Date().getFullYear()}-${String(secuencia).padStart(5, '0')}`

            // Distribuir pago
            let aplicadoMora = Math.min(monto_pago, montoMora)
            let aplicadoInteres = 0
            let aplicadoCapital = 0
            let aplicadoFuturo = 0

            let montoRestante = monto_pago - aplicadoMora

            if (montoRestante > 0) {
                const interesPendiente = cuota.monto_interes - (cuota.monto_pagado || 0)
                aplicadoInteres = Math.min(montoRestante, interesPendiente)
                montoRestante -= aplicadoInteres
            }

            if (montoRestante > 0) {
                const capitalPendiente = cuota.monto_capital - (cuota.monto_pagado || 0)
                aplicadoCapital = Math.min(montoRestante, capitalPendiente)
                montoRestante -= aplicadoCapital
            }

            if (montoRestante > 0) {
                aplicadoFuturo = montoRestante
            }

            // Insertar pago
            const [resultPago] = await connection.execute(
                `INSERT INTO pagos_financiamiento (
                    cuota_id, contrato_id, empresa_id, cliente_id,
                    numero_recibo, monto_pago, aplicado_mora,
                    aplicado_interes, aplicado_capital, aplicado_futuro,
                    metodo_pago, ultimos_digitos_tarjeta, numero_referencia,
                    nombre_banco, fecha_pago, registrado_por, caja_id, estado, notas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    cuota_id,
                    cuota.contrato_id,
                    empresaId,
                    cuota.cliente_id,
                    numeroRecibo,
                    monto_pago,
                    aplicadoMora,
                    aplicadoInteres,
                    aplicadoCapital,
                    aplicadoFuturo,
                    metodo_pago,
                    ultimos_digitos_tarjeta || null,
                    numero_referencia || null,
                    nombre_banco || null,
                    fecha_pago || new Date().toISOString().split('T')[0],
                    userId,
                    caja_id || null,
                    'confirmado',
                    notas || null
                ]
            )

            // Actualizar cuota
            const nuevoMontoPagado = (cuota.monto_pagado || 0) + aplicadoCapital + aplicadoInteres + aplicadoMora
            const totalCuota = cuota.monto_cuota + montoMora
            let nuevoEstado = 'parcial'

            if (nuevoMontoPagado >= totalCuota) {
                nuevoEstado = 'pagada'
            }

            await connection.execute(
                `UPDATE cuotas_financiamiento
                 SET monto_pagado = ?,
                     monto_mora = ?,
                     total_a_pagar = ?,
                     estado = ?,
                     dias_atraso = ?,
                     fecha_pago = CASE WHEN ? >= total_a_pagar THEN NOW() ELSE fecha_pago END,
                     fecha_ultimo_pago = NOW()
                 WHERE id = ?`,
                [
                    nuevoMontoPagado,
                    montoMora,
                    totalCuota,
                    nuevoEstado,
                    diasAtraso,
                    nuevoMontoPagado,
                    cuota_id
                ]
            )

            // Actualizar contrato
            const [contratos] = await connection.execute(
                `SELECT monto_pagado, saldo_pendiente
                 FROM contratos_financiamiento WHERE id = ?`,
                [cuota.contrato_id]
            )

            if (contratos.length > 0) {
                const contrato = contratos[0]
                const nuevoMontoPagadoContrato = parseFloat(contrato.monto_pagado || 0) + monto_pago
                const nuevoSaldoPendiente = parseFloat(contrato.saldo_pendiente || 0) - (aplicadoCapital + aplicadoInteres)

                const [cuotasPagadas] = await connection.execute(
                    `SELECT COUNT(*) as total FROM cuotas_financiamiento
                     WHERE contrato_id = ? AND estado = 'pagada'`,
                    [cuota.contrato_id]
                )

                let nuevoEstadoContrato = contrato.estado
                if (nuevoSaldoPendiente <= 0) {
                    nuevoEstadoContrato = 'pagado'
                }

                await connection.execute(
                    `UPDATE contratos_financiamiento
                     SET monto_pagado = ?,
                         saldo_pendiente = ?,
                         cuotas_pagadas = ?,
                         estado = ?
                     WHERE id = ?`,
                    [
                        nuevoMontoPagadoContrato,
                        nuevoSaldoPendiente,
                        parseInt(cuotasPagadas[0].total),
                        nuevoEstadoContrato,
                        cuota.contrato_id
                    ]
                )
            }

            await connection.commit()
            connection.release()

            return NextResponse.json({
                success: true,
                pago_id: resultPago.insertId,
                numero_recibo: numeroRecibo,
                mensaje: 'Pago registrado exitosamente'
            })

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al registrar pago:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return NextResponse.json(
            { success: false, mensaje: 'Error al registrar pago: ' + error.message },
            { status: 500 }
        )
    }
}

















