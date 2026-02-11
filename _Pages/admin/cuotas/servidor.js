"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { 
    calcularDiasAtraso,
    calcularMora
} from '../core/finance/calculos.js'
import { ESTADOS_CUOTA } from '../core/finance/estados.js'

/**
 * Obtiene la lista de cuotas con filtros (vista global)
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Object} { success: boolean, cuotas: Array, paginacion: Object, mensaje?: string }
 */
export async function obtenerCuotas(filtros = {}) {
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
            SELECT c.*,
                   co.numero_contrato,
                   co.fecha_contrato,
                   cl.nombre as cliente_nombre,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   p.nombre as plan_nombre
            FROM cuotas_financiamiento c
            INNER JOIN contratos_financiamiento co ON c.contrato_id = co.id
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON co.plan_id = p.id
            WHERE c.empresa_id = ?
        `
        const params = [empresaId]

        // Filtro por estado
        if (filtros.estado) {
            query += ` AND c.estado = ?`
            params.push(filtros.estado)
        }

        // Filtro por contrato
        if (filtros.contrato_id) {
            query += ` AND c.contrato_id = ?`
            params.push(filtros.contrato_id)
        }

        // Filtro por cliente
        if (filtros.cliente_id) {
            query += ` AND c.cliente_id = ?`
            params.push(filtros.cliente_id)
        }

        // Filtro por fecha de vencimiento
        if (filtros.fecha_desde) {
            query += ` AND c.fecha_vencimiento >= ?`
            params.push(filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
            query += ` AND c.fecha_vencimiento <= ?`
            params.push(filtros.fecha_hasta)
        }

        // Filtro por vencidas
        if (filtros.vencidas === true) {
            query += ` AND c.fecha_vencimiento < CURDATE() AND c.estado != 'pagada'`
        }

        // Búsqueda por número de contrato o cliente
        if (filtros.buscar) {
            query += ` AND (co.numero_contrato LIKE ? OR cl.nombre LIKE ? OR cl.numero_documento LIKE ?)`
            const busqueda = `%${filtros.buscar}%`
            params.push(busqueda, busqueda, busqueda)
        }

        // Contar total (sin LIMIT y OFFSET)
        let countQuery = `
            SELECT COUNT(*) as total
            FROM cuotas_financiamiento c
            INNER JOIN contratos_financiamiento co ON c.contrato_id = co.id
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON co.plan_id = p.id
            WHERE c.empresa_id = ?
        `
        const countParams = [empresaId]

        // Aplicar los mismos filtros que la consulta principal
        if (filtros.estado) {
            countQuery += ` AND c.estado = ?`
            countParams.push(filtros.estado)
        }

        if (filtros.contrato_id) {
            countQuery += ` AND c.contrato_id = ?`
            countParams.push(filtros.contrato_id)
        }

        if (filtros.cliente_id) {
            countQuery += ` AND c.cliente_id = ?`
            countParams.push(filtros.cliente_id)
        }

        if (filtros.fecha_desde) {
            countQuery += ` AND c.fecha_vencimiento >= ?`
            countParams.push(filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
            countQuery += ` AND c.fecha_vencimiento <= ?`
            countParams.push(filtros.fecha_hasta)
        }

        if (filtros.vencidas === true) {
            countQuery += ` AND c.fecha_vencimiento < CURDATE() AND c.estado != 'pagada'`
        }

        if (filtros.buscar) {
            countQuery += ` AND (co.numero_contrato LIKE ? OR cl.nombre LIKE ? OR cl.numero_documento LIKE ?)`
            const busqueda = `%${filtros.buscar}%`
            countParams.push(busqueda, busqueda, busqueda)
        }

        const [countResult] = await connection.execute(countQuery, countParams)
        const total = countResult && countResult[0] ? parseInt(countResult[0].total) : 0

        // Ordenar por fecha de vencimiento (más próximas primero)
        query += ` ORDER BY c.fecha_vencimiento ASC, c.numero_cuota ASC LIMIT ? OFFSET ?`
        params.push(limite, offset)

        const [cuotas] = await connection.execute(query, params)

        // Calcular días de atraso y mora para cada cuota
        const cuotasConCalculos = cuotas.map(cuota => {
            const diasAtraso = calcularDiasAtraso(cuota.fecha_vencimiento)
            
            // Si la cuota está vencida y no está pagada, calcular mora
            let montoMoraCalculado = parseFloat(cuota.monto_mora || 0)
            if (diasAtraso > 0 && cuota.estado !== ESTADOS_CUOTA.PAGADA) {
                // Obtener tasa de mora del plan (si no está en la cuota)
                // Nota: La mora debería calcularse dinámicamente, pero por ahora usamos la almacenada
                // En producción, esto debería recalcularse usando el plan
            }

            return {
                ...cuota,
                dias_atraso_calculado: diasAtraso,
                monto_mora_calculado: montoMoraCalculado,
                total_a_pagar_calculado: parseFloat(cuota.monto_cuota) + montoMoraCalculado - parseFloat(cuota.monto_pagado || 0)
            }
        })

        connection.release()

        return {
            success: true,
            cuotas: cuotasConCalculos,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite)
            }
        }

    } catch (error) {
        console.error('Error al obtener cuotas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar cuotas', cuotas: [] }
    }
}

/**
 * Obtiene una cuota por su ID
 * @param {number} id - ID de la cuota
 * @returns {Object} { success: boolean, cuota?: Object, mensaje?: string }
 */
export async function obtenerCuotaPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [cuotas] = await connection.execute(
            `SELECT c.*,
                   co.numero_contrato,
                   co.fecha_contrato,
                   co.plan_id,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   cl.email as cliente_email,
                   p.nombre as plan_nombre,
                   p.penalidad_mora_pct,
                   p.dias_gracia
            FROM cuotas_financiamiento c
            INNER JOIN contratos_financiamiento co ON c.contrato_id = co.id
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON co.plan_id = p.id
            WHERE c.id = ? AND c.empresa_id = ?`,
            [id, empresaId]
        )

        if (cuotas.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Cuota no encontrada' }
        }

        const cuota = cuotas[0]

        // Calcular días de atraso y mora
        const diasAtraso = calcularDiasAtraso(cuota.fecha_vencimiento)
        let montoMoraCalculado = parseFloat(cuota.monto_mora || 0)

        if (diasAtraso > 0 && cuota.estado !== ESTADOS_CUOTA.PAGADA) {
            const tasaMora = (cuota.penalidad_mora_pct || 0) / 100
            const diasGracia = cuota.dias_gracia || 5
            montoMoraCalculado = calcularMora(
                cuota.monto_cuota,
                diasAtraso,
                tasaMora,
                diasGracia
            )
        }

        // Obtener pagos de esta cuota
        const [pagos] = await connection.execute(
            `SELECT p.*, u.nombre as registrado_por_nombre
             FROM pagos_financiamiento p
             LEFT JOIN usuarios u ON p.registrado_por = u.id
             WHERE p.cuota_id = ?
             ORDER BY p.fecha_pago DESC`,
            [id]
        )

        connection.release()

        return {
            success: true,
            cuota: {
                ...cuota,
                dias_atraso_calculado: diasAtraso,
                monto_mora_calculado: montoMoraCalculado,
                total_a_pagar_calculado: parseFloat(cuota.monto_cuota) + montoMoraCalculado - parseFloat(cuota.monto_pagado || 0),
                pagos
            }
        }

    } catch (error) {
        console.error('Error al obtener cuota:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar cuota' }
    }
}

/**
 * Actualiza una cuota (principalmente para condonar mora o cambiar estado)
 * @param {number} id - ID de la cuota
 * @param {Object} datos - Datos a actualizar
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function actualizarCuota(id, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Verificar que la cuota existe y pertenece a la empresa
        const [cuotas] = await connection.execute(
            `SELECT id, estado FROM cuotas_financiamiento 
             WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        if (cuotas.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Cuota no encontrada' }
        }

        const cuota = cuotas[0]

        // Construir query de actualización dinámicamente
        const campos = []
        const valores = []

        if (datos.monto_mora !== undefined) {
            campos.push('monto_mora = ?')
            valores.push(datos.monto_mora)
        }

        if (datos.estado !== undefined) {
            campos.push('estado = ?')
            valores.push(datos.estado)
        }

        if (datos.notas !== undefined) {
            campos.push('notas = ?')
            valores.push(datos.notas)
        }

        if (datos.dias_atraso !== undefined) {
            campos.push('dias_atraso = ?')
            valores.push(datos.dias_atraso)
        }

        if (campos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'No hay campos para actualizar' }
        }

        valores.push(id)

        await connection.execute(
            `UPDATE cuotas_financiamiento 
             SET ${campos.join(', ')}
             WHERE id = ?`,
            valores
        )

        connection.release()

        return { success: true, mensaje: 'Cuota actualizada exitosamente' }

    } catch (error) {
        console.error('Error al actualizar cuota:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar cuota: ' + error.message }
    }
}

/**
 * Calcula y actualiza la mora de una cuota
 * @param {number} id - ID de la cuota
 * @returns {Object} { success: boolean, monto_mora?: number, dias_atraso?: number, mensaje?: string }
 */
export async function calcularMoraCuota(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        // Obtener cuota con información del plan
        const [cuotas] = await connection.execute(
            `SELECT c.*, p.penalidad_mora_pct, p.dias_gracia
             FROM cuotas_financiamiento c
             INNER JOIN contratos_financiamiento co ON c.contrato_id = co.id
             LEFT JOIN planes_financiamiento p ON co.plan_id = p.id
             WHERE c.id = ? AND c.empresa_id = ?`,
            [id, empresaId]
        )

        if (cuotas.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Cuota no encontrada' }
        }

        const cuota = cuotas[0]

        // Si la cuota ya está pagada, no calcular mora
        if (cuota.estado === ESTADOS_CUOTA.PAGADA) {
            connection.release()
            return { 
                success: true, 
                monto_mora: 0, 
                dias_atraso: 0,
                mensaje: 'La cuota ya está pagada' 
            }
        }

        // Calcular días de atraso
        const diasAtraso = calcularDiasAtraso(cuota.fecha_vencimiento)

        // Calcular mora
        const tasaMora = (cuota.penalidad_mora_pct || 0) / 100
        const diasGracia = cuota.dias_gracia || 5
        const montoMora = calcularMora(
            cuota.monto_cuota,
            diasAtraso,
            tasaMora,
            diasGracia
        )

        // Actualizar cuota con la mora calculada
        await connection.execute(
            `UPDATE cuotas_financiamiento
             SET monto_mora = ?,
                 dias_atraso = ?,
                 total_a_pagar = monto_cuota + ?
             WHERE id = ?`,
            [montoMora, diasAtraso, montoMora, id]
        )

        connection.release()

        return {
            success: true,
            monto_mora: montoMora,
            dias_atraso: diasAtraso,
            mensaje: 'Mora calculada exitosamente'
        }

    } catch (error) {
        console.error('Error al calcular mora:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al calcular mora: ' + error.message }
    }
}

/**
 * Obtiene estadísticas de cuotas
 * @param {Object} filtros - Filtros opcionales
 * @returns {Object} { success: boolean, estadisticas?: Object, mensaje?: string }
 */
export async function obtenerEstadisticasCuotas(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        let whereClause = 'WHERE c.empresa_id = ?'
        const params = [empresaId]

        if (filtros.fecha_desde) {
            whereClause += ' AND c.fecha_vencimiento >= ?'
            params.push(filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
            whereClause += ' AND c.fecha_vencimiento <= ?'
            params.push(filtros.fecha_hasta)
        }

        // Estadísticas generales
        const [estadisticas] = await connection.execute(
            `SELECT 
                COUNT(*) as total_cuotas,
                SUM(CASE WHEN c.estado = 'pagada' THEN 1 ELSE 0 END) as cuotas_pagadas,
                SUM(CASE WHEN c.estado = 'pendiente' THEN 1 ELSE 0 END) as cuotas_pendientes,
                SUM(CASE WHEN c.estado = 'vencida' THEN 1 ELSE 0 END) as cuotas_vencidas,
                SUM(CASE WHEN c.estado = 'parcial' THEN 1 ELSE 0 END) as cuotas_parciales,
                SUM(c.monto_cuota) as total_monto_cuotas,
                SUM(c.monto_pagado) as total_monto_pagado,
                SUM(c.monto_mora) as total_mora,
                SUM(CASE WHEN c.fecha_vencimiento < CURDATE() AND c.estado != 'pagada' THEN 1 ELSE 0 END) as cuotas_vencidas_activas
             FROM cuotas_financiamiento c
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

/**
 * Obtiene cuotas por contrato
 * @param {number} contratoId - ID del contrato
 * @returns {Object} { success: boolean, cuotas?: Array, contrato?: Object, mensaje?: string }
 */
export async function obtenerCuotasPorContrato(contratoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        // Obtener información del contrato
        const [contratos] = await connection.execute(
            `SELECT co.*,
                    cl.nombre as cliente_nombre,
                    cl.apellidos as cliente_apellidos,
                    cl.numero_documento as cliente_documento,
                    cl.telefono as cliente_telefono,
                    p.nombre as plan_nombre,
                    p.tasa_interes_mensual,
                    p.penalidad_mora_pct,
                    p.dias_gracia
             FROM contratos_financiamiento co
             LEFT JOIN clientes cl ON co.cliente_id = cl.id
             LEFT JOIN planes_financiamiento p ON co.plan_id = p.id
             WHERE co.id = ? AND co.empresa_id = ?`,
            [contratoId, empresaId]
        )

        if (contratos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Contrato no encontrado' }
        }

        const contrato = contratos[0]

        // Obtener cuotas del contrato
        const [cuotas] = await connection.execute(
            `SELECT c.*
             FROM cuotas_financiamiento c
             WHERE c.contrato_id = ? AND c.empresa_id = ?
             ORDER BY c.numero_cuota ASC`,
            [contratoId, empresaId]
        )

        // Calcular mora para cada cuota
        const cuotasConMora = cuotas.map(cuota => {
            const diasAtraso = calcularDiasAtraso(cuota.fecha_vencimiento)
            let montoMoraCalculado = parseFloat(cuota.monto_mora || 0)

            if (diasAtraso > 0 && cuota.estado !== ESTADOS_CUOTA.PAGADA) {
                const tasaMora = (contrato.penalidad_mora_pct || 0) / 100
                const diasGracia = contrato.dias_gracia || 5
                montoMoraCalculado = calcularMora(
                    cuota.monto_cuota,
                    diasAtraso,
                    tasaMora,
                    diasGracia
                )
            }

            return {
                ...cuota,
                dias_atraso_calculado: diasAtraso,
                monto_mora_calculado: montoMoraCalculado,
                total_a_pagar_calculado: parseFloat(cuota.monto_cuota) + montoMoraCalculado - parseFloat(cuota.monto_pagado || 0)
            }
        })

        connection.release()

        return {
            success: true,
            contrato,
            cuotas: cuotasConMora
        }

    } catch (error) {
        console.error('Error al obtener cuotas por contrato:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar cuotas del contrato' }
    }
}

/**
 * Obtiene las próximas cuotas a vencer
 * @param {number} dias - Número de días para considerar como "próximas"
 * @param {number} limite - Cantidad máxima de cuotas a retornar
 * @returns {Object} { success: boolean, cuotas?: Array, mensaje?: string }
 */
export async function obtenerCuotasProximasVencer(dias = 7, limite = 20) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [cuotas] = await connection.execute(
            `SELECT c.*,
                    co.numero_contrato,
                    co.fecha_contrato,
                    cl.nombre as cliente_nombre,
                    cl.numero_documento as cliente_documento,
                    cl.telefono as cliente_telefono,
                    p.nombre as plan_nombre
             FROM cuotas_financiamiento c
             INNER JOIN contratos_financiamiento co ON c.contrato_id = co.id
             LEFT JOIN clientes cl ON c.cliente_id = cl.id
             LEFT JOIN planes_financiamiento p ON co.plan_id = p.id
             WHERE c.empresa_id = ?
               AND c.estado IN ('pendiente', 'parcial')
               AND c.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
             ORDER BY c.fecha_vencimiento ASC
             LIMIT ?`,
            [empresaId, dias, limite]
        )

        connection.release()

        return {
            success: true,
            cuotas
        }

    } catch (error) {
        console.error('Error al obtener próximas cuotas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar próximas cuotas' }
    }
}

/**
 * Obtiene cuotas vencidas (con atraso)
 * @param {number} limite - Cantidad máxima de cuotas a retornar
 * @returns {Object} { success: boolean, cuotas?: Array, mensaje?: string }
 */
export async function obtenerCuotasVencidas(limite = 50) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [cuotas] = await connection.execute(
            `SELECT c.*,
                    co.numero_contrato,
                    co.fecha_contrato,
                    cl.nombre as cliente_nombre,
                    cl.numero_documento as cliente_documento,
                    cl.telefono as cliente_telefono,
                    p.nombre as plan_nombre,
                    p.penalidad_mora_pct,
                    p.dias_gracia,
                    DATEDIFF(CURDATE(), c.fecha_vencimiento) as dias_vencida
             FROM cuotas_financiamiento c
             INNER JOIN contratos_financiamiento co ON c.contrato_id = co.id
             LEFT JOIN clientes cl ON c.cliente_id = cl.id
             LEFT JOIN planes_financiamiento p ON co.plan_id = p.id
             WHERE c.empresa_id = ?
               AND c.estado != 'pagada'
               AND c.fecha_vencimiento < CURDATE()
             ORDER BY c.fecha_vencimiento ASC
             LIMIT ?`,
            [empresaId, limite]
        )

        // Calcular mora para cada cuota vencida
        const cuotasConMora = cuotas.map(cuota => {
            const diasAtraso = cuota.dias_vencida || 0
            const tasaMora = (cuota.penalidad_mora_pct || 0) / 100
            const diasGracia = cuota.dias_gracia || 5
            
            const montoMoraCalculado = calcularMora(
                cuota.monto_cuota,
                diasAtraso,
                tasaMora,
                diasGracia
            )

            return {
                ...cuota,
                dias_atraso_calculado: diasAtraso,
                monto_mora_calculado: montoMoraCalculado,
                total_a_pagar_calculado: parseFloat(cuota.monto_cuota) + montoMoraCalculado - parseFloat(cuota.monto_pagado || 0)
            }
        })

        connection.release()

        return {
            success: true,
            cuotas: cuotasConMora
        }

    } catch (error) {
        console.error('Error al obtener cuotas vencidas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar cuotas vencidas' }
    }
}

/**
 * Obtiene resumen de cuotas por plan de financiamiento
 * @returns {Object} { success: boolean, resumen?: Array, mensaje?: string }
 */
export async function obtenerResumenPorPlan() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [resumen] = await connection.execute(
            `SELECT 
                p.id as plan_id,
                p.nombre as plan_nombre,
                p.tasa_interes_mensual,
                COUNT(DISTINCT co.id) as total_contratos,
                COUNT(c.id) as total_cuotas,
                SUM(CASE WHEN c.estado = 'pagada' THEN 1 ELSE 0 END) as cuotas_pagadas,
                SUM(CASE WHEN c.estado != 'pagada' AND c.fecha_vencimiento < CURDATE() THEN 1 ELSE 0 END) as cuotas_vencidas,
                SUM(c.monto_cuota) as monto_total,
                SUM(c.monto_pagado) as monto_cobrado,
                SUM(c.monto_mora) as mora_acumulada
             FROM planes_financiamiento p
             LEFT JOIN contratos_financiamiento co ON p.id = co.plan_id AND co.empresa_id = ?
             LEFT JOIN cuotas_financiamiento c ON co.id = c.contrato_id
             WHERE p.empresa_id = ? AND p.estado = 'activo'
             GROUP BY p.id, p.nombre, p.tasa_interes_mensual
             ORDER BY total_contratos DESC`,
            [empresaId, empresaId]
        )

        connection.release()

        return {
            success: true,
            resumen
        }

    } catch (error) {
        console.error('Error al obtener resumen por plan:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar resumen por plan' }
    }
}

/**
 * Actualiza masivamente el estado de cuotas vencidas
 * @returns {Object} { success: boolean, actualizadas?: number, mensaje?: string }
 */
export async function actualizarCuotasVencidas() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        // Actualizar estado a 'vencida' para cuotas pendientes que pasaron su fecha
        const [resultado] = await connection.execute(
            `UPDATE cuotas_financiamiento c
             SET c.estado = 'vencida'
             WHERE c.empresa_id = ?
               AND c.estado = 'pendiente'
               AND c.fecha_vencimiento < CURDATE()`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            actualizadas: resultado.affectedRows,
            mensaje: `Se actualizaron ${resultado.affectedRows} cuotas a estado vencida`
        }

    } catch (error) {
        console.error('Error al actualizar cuotas vencidas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar cuotas vencidas' }
    }
}

