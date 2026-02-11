"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import {
    calcularDiasAtraso,
    calcularMora,
    distribuirPago,
    formatearNumeroRecibo
} from '../core/finance/calculos.js'
import { ESTADOS_PAGO, METODOS_PAGO } from '../core/finance/estados.js'
import { validarDatosPago } from '../core/finance/validaciones.js'

/**
 * Obtiene la lista de pagos con filtros (vista global)
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Object} { success: boolean, pagos: Array, paginacion: Object, mensaje?: string }
 */
export async function obtenerPagos(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const pagina = filtros.pagina || 1
        const limite = filtros.limite || 50
        const offset = (pagina - 1) * limite

        let query = `
            SELECT p.*,
                   c.numero_cuota,
                   c.fecha_vencimiento,
                   co.numero_contrato,
                   cl.nombre as cliente_nombre,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   u.nombre as registrado_por_nombre
            FROM pagos_financiamiento p
            INNER JOIN cuotas_financiamiento c ON p.cuota_id = c.id
            INNER JOIN contratos_financiamiento co ON p.contrato_id = co.id
            LEFT JOIN clientes cl ON p.cliente_id = cl.id
            LEFT JOIN usuarios u ON p.registrado_por = u.id
            WHERE p.empresa_id = ?
        `
        const params = [empresaId]

        // Filtro por estado
        if (filtros.estado) {
            query += ` AND p.estado = ?`
            params.push(filtros.estado)
        }

        // Filtro por método de pago
        if (filtros.metodo_pago) {
            query += ` AND p.metodo_pago = ?`
            params.push(filtros.metodo_pago)
        }

        // Filtro por contrato
        if (filtros.contrato_id) {
            query += ` AND p.contrato_id = ?`
            params.push(filtros.contrato_id)
        }

        // Filtro por cliente
        if (filtros.cliente_id) {
            query += ` AND p.cliente_id = ?`
            params.push(filtros.cliente_id)
        }

        // Filtro por fecha
        if (filtros.fecha_desde) {
            query += ` AND p.fecha_pago >= ?`
            params.push(filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
            query += ` AND p.fecha_pago <= ?`
            params.push(filtros.fecha_hasta)
        }

        // Búsqueda por número de recibo, contrato o cliente
        if (filtros.buscar) {
            query += ` AND (p.numero_recibo LIKE ? OR co.numero_contrato LIKE ? OR cl.nombre LIKE ? OR cl.numero_documento LIKE ?)`
            const busqueda = `%${filtros.buscar}%`
            params.push(busqueda, busqueda, busqueda, busqueda)
        }

        // Contar total (sin LIMIT y OFFSET)
        let countQuery = `
            SELECT COUNT(*) as total
            FROM pagos_financiamiento p
            INNER JOIN cuotas_financiamiento c ON p.cuota_id = c.id
            INNER JOIN contratos_financiamiento co ON p.contrato_id = co.id
            LEFT JOIN clientes cl ON p.cliente_id = cl.id
            LEFT JOIN usuarios u ON p.registrado_por = u.id
            WHERE p.empresa_id = ?
        `
        const countParams = [empresaId]

        // Aplicar los mismos filtros que la consulta principal
        if (filtros.estado) {
            countQuery += ` AND p.estado = ?`
            countParams.push(filtros.estado)
        }

        if (filtros.metodo_pago) {
            countQuery += ` AND p.metodo_pago = ?`
            countParams.push(filtros.metodo_pago)
        }

        if (filtros.contrato_id) {
            countQuery += ` AND p.contrato_id = ?`
            countParams.push(filtros.contrato_id)
        }

        if (filtros.cliente_id) {
            countQuery += ` AND p.cliente_id = ?`
            countParams.push(filtros.cliente_id)
        }

        if (filtros.fecha_desde) {
            countQuery += ` AND p.fecha_pago >= ?`
            countParams.push(filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
            countQuery += ` AND p.fecha_pago <= ?`
            countParams.push(filtros.fecha_hasta)
        }

        if (filtros.buscar) {
            countQuery += ` AND (p.numero_recibo LIKE ? OR co.numero_contrato LIKE ? OR cl.nombre LIKE ? OR cl.numero_documento LIKE ?)`
            const busqueda = `%${filtros.buscar}%`
            countParams.push(busqueda, busqueda, busqueda, busqueda)
        }

        const [countResult] = await connection.execute(countQuery, countParams)
        const total = countResult && countResult[0] ? parseInt(countResult[0].total) : 0

        // Ordenar por fecha de pago (más recientes primero)
        query += ` ORDER BY p.fecha_pago DESC, p.id DESC LIMIT ? OFFSET ?`
        params.push(limite, offset)

        const [pagos] = await connection.execute(query, params)

        connection.release()

        return {
            success: true,
            pagos,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite)
            }
        }

    } catch (error) {
        console.error('Error al obtener pagos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar pagos', pagos: [] }
    }
}

/**
 * Obtiene un pago por su ID
 * @param {number} id - ID del pago
 * @returns {Object} { success: boolean, pago?: Object, mensaje?: string }
 */
export async function obtenerPagoPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [pagos] = await connection.execute(
            `SELECT p.*,
                   c.numero_cuota,
                   c.fecha_vencimiento,
                   c.monto_cuota,
                   c.monto_capital,
                   c.monto_interes,
                   co.numero_contrato,
                   co.fecha_contrato,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   cl.email as cliente_email,
                   u.nombre as registrado_por_nombre,
                   u2.nombre as revertido_por_nombre
            FROM pagos_financiamiento p
            INNER JOIN cuotas_financiamiento c ON p.cuota_id = c.id
            INNER JOIN contratos_financiamiento co ON p.contrato_id = co.id
            LEFT JOIN clientes cl ON p.cliente_id = cl.id
            LEFT JOIN usuarios u ON p.registrado_por = u.id
            LEFT JOIN usuarios u2 ON p.revertido_por = u2.id
            WHERE p.id = ? AND p.empresa_id = ?`,
            [id, empresaId]
        )

        if (pagos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Pago no encontrado' }
        }

        connection.release()

        return {
            success: true,
            pago: pagos[0]
        }

    } catch (error) {
        console.error('Error al obtener pago:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar pago' }
    }
}

/**
 * Registra un pago de cuota
 * @param {Object} datos - Datos del pago
 * @returns {Object} { success: boolean, pago_id?: number, numero_recibo?: string, mensaje?: string }
 */
export async function registrarPagoCuota(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validar datos del pago
        const validacion = validarDatosPago(datos)
        if (!validacion.valido) {
            return { success: false, mensaje: validacion.errores.join(', ') }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Obtener cuota con información del plan
            const [cuotas] = await connection.execute(
                `SELECT c.*, co.plan_id, co.cliente_id, p.penalidad_mora_pct, p.dias_gracia
                 FROM cuotas_financiamiento c
                 INNER JOIN contratos_financiamiento co ON c.contrato_id = co.id
                 LEFT JOIN planes_financiamiento p ON co.plan_id = p.id
                 WHERE c.id = ? AND c.empresa_id = ?`,
                [datos.cuota_id, empresaId]
            )

            if (cuotas.length === 0) {
                throw new Error('Cuota no encontrada')
            }

            const cuota = cuotas[0]

            // Calcular mora si aplica
            const diasAtraso = calcularDiasAtraso(cuota.fecha_vencimiento)
            let montoMora = 0

            if (diasAtraso > 0 && cuota.estado !== 'pagada') {
                const tasaMora = (cuota.penalidad_mora_pct || 0) / 100
                const diasGracia = cuota.dias_gracia || 5
                montoMora = calcularMora(
                    cuota.monto_cuota,
                    diasAtraso,
                    tasaMora,
                    diasGracia
                )
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

            const numeroRecibo = formatearNumeroRecibo(empresaId, secuencia)

            // Calcular montos pendientes
            const montoMoraPendiente = montoMora - parseFloat(cuota.monto_mora || 0)
            const montoInteresPendiente = parseFloat(cuota.monto_interes) - (parseFloat(cuota.monto_pagado || 0) - parseFloat(cuota.monto_mora || 0))
            const montoCapitalPendiente = parseFloat(cuota.monto_capital) - (parseFloat(cuota.monto_pagado || 0) - parseFloat(cuota.monto_interes) - parseFloat(cuota.monto_mora || 0))

            // Distribuir pago usando la función del core
            const distribucion = distribuirPago(
                parseFloat(datos.monto_pago),
                montoMoraPendiente,
                montoInteresPendiente,
                montoCapitalPendiente
            )

            // Si hay mora nueva, actualizar el monto de mora de la cuota
            if (montoMora > parseFloat(cuota.monto_mora || 0)) {
                await connection.execute(
                    `UPDATE cuotas_financiamiento
                     SET monto_mora = ?,
                         dias_atraso = ?
                     WHERE id = ?`,
                    [montoMora, diasAtraso, datos.cuota_id]
                )
            }

            // Insertar pago
            const [resultPago] = await connection.execute(
                `INSERT INTO pagos_financiamiento (
                    cuota_id, contrato_id, empresa_id, cliente_id,
                    numero_recibo, monto_pago, aplicado_mora,
                    aplicado_interes, aplicado_capital, aplicado_futuro,
                    metodo_pago, ultimos_digitos_tarjeta, numero_referencia,
                    nombre_banco, fecha_pago, registrado_por,
                    caja_id, estado, notas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.cuota_id,
                    cuota.contrato_id,
                    empresaId,
                    cuota.cliente_id,
                    numeroRecibo,
                    datos.monto_pago,
                    distribucion.aplicado_mora,
                    distribucion.aplicado_interes,
                    distribucion.aplicado_capital,
                    distribucion.aplicado_futuro,
                    datos.metodo_pago,
                    datos.ultimos_digitos_tarjeta || null,
                    datos.numero_referencia || null,
                    datos.nombre_banco || null,
                    datos.fecha_pago || new Date().toISOString().split('T')[0],
                    userId,
                    datos.caja_id || null,
                    ESTADOS_PAGO.CONFIRMADO,
                    datos.notas || null
                ]
            )

            const pagoId = resultPago.insertId

            // Actualizar cuota
            const nuevoMontoPagado = parseFloat(cuota.monto_pagado || 0) + 
                                    distribucion.aplicado_capital + 
                                    distribucion.aplicado_interes + 
                                    distribucion.aplicado_mora
            const totalCuota = parseFloat(cuota.monto_cuota) + montoMora
            let nuevoEstado = 'parcial'

            if (nuevoMontoPagado >= totalCuota) {
                nuevoEstado = 'pagada'
            } else if (nuevoMontoPagado > 0) {
                nuevoEstado = 'parcial'
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
                    datos.cuota_id
                ]
            )

            // Actualizar contrato
            const [contratos] = await connection.execute(
                `SELECT monto_pagado, cuotas_pagadas, saldo_pendiente, estado
                 FROM contratos_financiamiento WHERE id = ?`,
                [cuota.contrato_id]
            )

            if (contratos.length > 0) {
                const contrato = contratos[0]
                const nuevoMontoPagadoContrato = parseFloat(contrato.monto_pagado || 0) + 
                                                 distribucion.aplicado_capital + 
                                                 distribucion.aplicado_interes
                const nuevoSaldoPendiente = parseFloat(contrato.saldo_pendiente || 0) - 
                                           (distribucion.aplicado_capital + distribucion.aplicado_interes)

                // Contar cuotas pagadas
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
                         estado = ?,
                         fecha_ultimo_pago = NOW()
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

            // Si hay excedente, aplicar a siguiente cuota
            if (distribucion.aplicado_futuro > 0) {
                const [siguienteCuota] = await connection.execute(
                    `SELECT id FROM cuotas_financiamiento
                     WHERE contrato_id = ? AND estado IN ('pendiente', 'vencida', 'parcial')
                     ORDER BY numero_cuota ASC LIMIT 1`,
                    [cuota.contrato_id]
                )

                if (siguienteCuota.length > 0) {
                    await connection.execute(
                        `UPDATE cuotas_financiamiento
                         SET monto_pagado = monto_pagado + ?
                         WHERE id = ?`,
                        [distribucion.aplicado_futuro, siguienteCuota[0].id]
                    )
                }
            }

            // Registrar en historial
            await connection.execute(
                `INSERT INTO historial_financiamiento (
                    empresa_id, contrato_id, cuota_id, tipo_cambio,
                    campo_modificado, valor_anterior, valor_nuevo,
                    usuario_id, comentario
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    cuota.contrato_id,
                    datos.cuota_id,
                    'pago_registrado',
                    'monto_pagado',
                    cuota.monto_pagado || 0,
                    nuevoMontoPagado,
                    userId,
                    `Pago registrado: ${numeroRecibo}`
                ]
            )

            await connection.commit()
            connection.release()

            return {
                success: true,
                pago_id: pagoId,
                numero_recibo: numeroRecibo,
                mensaje: 'Pago registrado exitosamente'
            }

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
        return { success: false, mensaje: 'Error al registrar pago: ' + error.message }
    }
}

/**
 * Revierte un pago registrado
 * @param {number} id - ID del pago
 * @param {string} razon - Razón de la reversión
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function revertirPago(id, razon) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        if (!razon || razon.trim().length === 0) {
            return { success: false, mensaje: 'La razón de reversión es requerida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Obtener pago
            const [pagos] = await connection.execute(
                `SELECT p.*, c.contrato_id, c.monto_pagado as cuota_monto_pagado
                 FROM pagos_financiamiento p
                 INNER JOIN cuotas_financiamiento c ON p.cuota_id = c.id
                 WHERE p.id = ? AND p.empresa_id = ? AND p.estado != ?`,
                [id, empresaId, ESTADOS_PAGO.REVERTIDO]
            )

            if (pagos.length === 0) {
                throw new Error('Pago no encontrado o ya revertido')
            }

            const pago = pagos[0]

            // Revertir pago: actualizar estado
            await connection.execute(
                `UPDATE pagos_financiamiento
                 SET estado = ?,
                     fecha_reversion = NOW(),
                     revertido_por = ?,
                     razon_reversion = ?
                 WHERE id = ?`,
                [ESTADOS_PAGO.REVERTIDO, userId, razon, id]
            )

            // Revertir en cuota: restar montos
            const nuevoMontoPagado = parseFloat(pago.cuota_monto_pagado || 0) - 
                                    (parseFloat(pago.aplicado_capital || 0) + 
                                     parseFloat(pago.aplicado_interes || 0) + 
                                     parseFloat(pago.aplicado_mora || 0))

            let nuevoEstado = 'pendiente'
            if (nuevoMontoPagado > 0) {
                nuevoEstado = 'parcial'
            }

            await connection.execute(
                `UPDATE cuotas_financiamiento
                 SET monto_pagado = ?,
                     estado = ?
                 WHERE id = ?`,
                [nuevoMontoPagado, nuevoEstado, pago.cuota_id]
            )

            // Revertir en contrato: restar montos
            const [contratos] = await connection.execute(
                `SELECT monto_pagado, saldo_pendiente, estado
                 FROM contratos_financiamiento WHERE id = ?`,
                [pago.contrato_id]
            )

            if (contratos.length > 0) {
                const contrato = contratos[0]
                const nuevoMontoPagadoContrato = parseFloat(contrato.monto_pagado || 0) - 
                                                 (parseFloat(pago.aplicado_capital || 0) + 
                                                  parseFloat(pago.aplicado_interes || 0))
                const nuevoSaldoPendiente = parseFloat(contrato.saldo_pendiente || 0) + 
                                           (parseFloat(pago.aplicado_capital || 0) + 
                                            parseFloat(pago.aplicado_interes || 0))

                let nuevoEstadoContrato = contrato.estado
                if (nuevoSaldoPendiente > 0 && contrato.estado === 'pagado') {
                    nuevoEstadoContrato = 'activo'
                }

                await connection.execute(
                    `UPDATE contratos_financiamiento
                     SET monto_pagado = ?,
                         saldo_pendiente = ?,
                         estado = ?
                     WHERE id = ?`,
                    [
                        nuevoMontoPagadoContrato,
                        nuevoSaldoPendiente,
                        nuevoEstadoContrato,
                        pago.contrato_id
                    ]
                )
            }

            // Registrar en historial
            await connection.execute(
                `INSERT INTO historial_financiamiento (
                    empresa_id, contrato_id, cuota_id, tipo_cambio,
                    campo_modificado, valor_anterior, valor_nuevo,
                    usuario_id, comentario
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    pago.contrato_id,
                    pago.cuota_id,
                    'pago_revertido',
                    'estado',
                    'confirmado',
                    ESTADOS_PAGO.REVERTIDO,
                    userId,
                    `Pago revertido: ${pago.numero_recibo}. Razón: ${razon}`
                ]
            )

            await connection.commit()
            connection.release()

            return {
                success: true,
                mensaje: 'Pago revertido exitosamente'
            }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al revertir pago:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al revertir pago: ' + error.message }
    }
}

/**
 * Obtiene estadísticas de pagos
 * @param {Object} filtros - Filtros opcionales
 * @returns {Object} { success: boolean, estadisticas?: Object, mensaje?: string }
 */
export async function obtenerEstadisticasPagos(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        let whereClause = 'WHERE p.empresa_id = ?'
        const params = [empresaId]

        if (filtros.fecha_desde) {
            whereClause += ' AND p.fecha_pago >= ?'
            params.push(filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
            whereClause += ' AND p.fecha_pago <= ?'
            params.push(filtros.fecha_hasta)
        }

        // Estadísticas generales
        const [estadisticas] = await connection.execute(
            `SELECT 
                COUNT(*) as total_pagos,
                SUM(CASE WHEN p.estado = 'confirmado' THEN 1 ELSE 0 END) as pagos_confirmados,
                SUM(CASE WHEN p.estado = 'revertido' THEN 1 ELSE 0 END) as pagos_revertidos,
                SUM(p.monto_pago) as total_monto_pagado,
                SUM(p.aplicado_mora) as total_mora_pagada,
                SUM(p.aplicado_interes) as total_interes_pagado,
                SUM(p.aplicado_capital) as total_capital_pagado,
                SUM(CASE WHEN p.metodo_pago = 'efectivo' THEN p.monto_pago ELSE 0 END) as total_efectivo,
                SUM(CASE WHEN p.metodo_pago = 'transferencia' THEN p.monto_pago ELSE 0 END) as total_transferencia,
                SUM(CASE WHEN p.metodo_pago IN ('tarjeta_debito', 'tarjeta_credito') THEN p.monto_pago ELSE 0 END) as total_tarjeta
             FROM pagos_financiamiento p
             ${whereClause}`,
            params
        )

        connection.release()

        return {
            success: true,
            estadisticas: estadisticas[0]
        }

    } catch (error) {
        console.error('Error al obtener estadísticas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar estadísticas' }
    }
}

