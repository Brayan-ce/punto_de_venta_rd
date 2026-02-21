"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { SEVERIDAD_ALERTA } from '../core/finance/estados.js'

/**
 * Obtiene la lista de alertas con filtros
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Object} { success: boolean, alertas: Array, mensaje?: string }
 */
export async function obtenerAlertas(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        let query = `
            SELECT a.*,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.telefono as cliente_telefono,
                   cl.numero_documento as cliente_documento,
                   cl.email as cliente_email,
                   co.numero_contrato,
                   co.saldo_pendiente as contrato_saldo_pendiente,
                   u.nombre as asignado_a_nombre,
                   u2.nombre as resuelta_por_nombre
            FROM alertas_financiamiento a
            LEFT JOIN clientes cl ON a.cliente_id = cl.id
            LEFT JOIN contratos_financiamiento co ON a.contrato_id = co.id
            LEFT JOIN usuarios u ON a.asignado_a = u.id
            LEFT JOIN usuarios u2 ON a.resuelta_por = u2.id
            WHERE a.empresa_id = ?
        `
        const params = [empresaId]

        // Filtro por estado
        if (filtros.estado) {
            query += ` AND a.estado = ?`
            params.push(filtros.estado)
        }

        // Filtro por severidad
        if (filtros.severidad) {
            query += ` AND a.severidad = ?`
            params.push(filtros.severidad)
        }

        // Filtro por tipo
        if (filtros.tipo_alerta) {
            query += ` AND a.tipo_alerta = ?`
            params.push(filtros.tipo_alerta)
        }

        // Filtro por cliente
        if (filtros.cliente_id) {
            query += ` AND a.cliente_id = ?`
            params.push(filtros.cliente_id)
        }

        // Filtro por contrato
        if (filtros.contrato_id) {
            query += ` AND a.contrato_id = ?`
            params.push(filtros.contrato_id)
        }

        // Filtro por asignado
        if (filtros.asignado_a) {
            query += ` AND a.asignado_a = ?`
            params.push(filtros.asignado_a)
        }

        // Búsqueda por texto
        if (filtros.buscar) {
            query += ` AND (a.titulo LIKE ? OR a.mensaje LIKE ? OR cl.nombre LIKE ? OR cl.numero_documento LIKE ? OR co.numero_contrato LIKE ?)`
            const busqueda = `%${filtros.buscar}%`
            params.push(busqueda, busqueda, busqueda, busqueda, busqueda)
        }

        // Ordenar por severidad y fecha
        query += ` ORDER BY 
            CASE a.severidad
                WHEN 'critica' THEN 1
                WHEN 'alta' THEN 2
                WHEN 'media' THEN 3
                WHEN 'baja' THEN 4
            END,
            a.fecha_creacion DESC`

        // Límite opcional
        if (filtros.limite) {
            query += ` LIMIT ?`
            params.push(filtros.limite)
        } else {
            query += ` LIMIT 100`
        }

        const [alertas] = await connection.execute(query, params)

        connection.release()

        return { success: true, alertas }

    } catch (error) {
        console.error('Error al obtener alertas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar alertas', alertas: [] }
    }
}

/**
 * Obtiene una alerta por su ID
 * @param {number} id - ID de la alerta
 * @returns {Object} { success: boolean, alerta?: Object, mensaje?: string }
 */
export async function obtenerAlertaPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [alertas] = await connection.execute(
            `SELECT a.*,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.telefono as cliente_telefono,
                   cl.numero_documento as cliente_documento,
                   cl.email as cliente_email,
                   co.numero_contrato,
                   co.saldo_pendiente as contrato_saldo_pendiente,
                   u.nombre as asignado_a_nombre,
                   u2.nombre as resuelta_por_nombre
            FROM alertas_financiamiento a
            LEFT JOIN clientes cl ON a.cliente_id = cl.id
            LEFT JOIN contratos_financiamiento co ON a.contrato_id = co.id
            LEFT JOIN usuarios u ON a.asignado_a = u.id
            LEFT JOIN usuarios u2 ON a.resuelta_por = u2.id
            WHERE a.id = ? AND a.empresa_id = ?`,
            [id, empresaId]
        )

        if (alertas.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Alerta no encontrada' }
        }

        connection.release()

        return {
            success: true,
            alerta: alertas[0]
        }

    } catch (error) {
        console.error('Error al obtener alerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar alerta' }
    }
}

/**
 * Crea una nueva alerta
 * @param {Object} datos - Datos de la alerta
 * @returns {Object} { success: boolean, alerta_id?: number, mensaje?: string }
 */
export async function crearAlerta(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validaciones básicas
        if (!datos.cliente_id) {
            return { success: false, mensaje: 'El cliente es requerido' }
        }

        if (!datos.tipo_alerta) {
            return { success: false, mensaje: 'El tipo de alerta es requerido' }
        }

        if (!datos.titulo || datos.titulo.trim().length === 0) {
            return { success: false, mensaje: 'El título es requerido' }
        }

        if (!datos.mensaje || datos.mensaje.trim().length === 0) {
            return { success: false, mensaje: 'El mensaje es requerido' }
        }

        connection = await db.getConnection()

        const [result] = await connection.execute(
            `INSERT INTO alertas_financiamiento (
                empresa_id, cliente_id, contrato_id, cuota_id,
                tipo_alerta, severidad, titulo, mensaje,
                datos_contexto, estado, asignado_a
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                datos.cliente_id,
                datos.contrato_id || null,
                datos.cuota_id || null,
                datos.tipo_alerta,
                datos.severidad || SEVERIDAD_ALERTA.MEDIA,
                datos.titulo,
                datos.mensaje,
                datos.datos_contexto ? JSON.stringify(datos.datos_contexto) : null,
                datos.estado || 'activa',
                datos.asignado_a || null
            ]
        )

        connection.release()

        return {
            success: true,
            alerta_id: result.insertId,
            mensaje: 'Alerta creada exitosamente'
        }

    } catch (error) {
        console.error('Error al crear alerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al crear alerta: ' + error.message }
    }
}

/**
 * Marca una alerta como resuelta
 * @param {number} id - ID de la alerta
 * @param {string} accionRealizada - Descripción de la acción realizada
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function marcarAlertaResuelta(id, accionRealizada) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Verificar que la alerta existe
        const [alertas] = await connection.execute(
            `SELECT id, estado FROM alertas_financiamiento 
             WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        if (alertas.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Alerta no encontrada' }
        }

        // Actualizar alerta
        await connection.execute(
            `UPDATE alertas_financiamiento
             SET estado = 'resuelta',
                 accion_realizada = ?,
                 resuelta_por = ?,
                 fecha_resolucion = NOW()
             WHERE id = ?`,
            [accionRealizada || null, userId, id]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Alerta marcada como resuelta'
        }

    } catch (error) {
        console.error('Error al marcar alerta como resuelta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar alerta: ' + error.message }
    }
}

/**
 * Marca una alerta como vista
 * @param {number} id - ID de la alerta
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function marcarAlertaVista(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE alertas_financiamiento
             SET estado = 'vista'
             WHERE id = ? AND empresa_id = ? AND estado = 'activa'`,
            [id, empresaId]
        )

        connection.release()

        return { success: true }

    } catch (error) {
        console.error('Error al marcar alerta como vista:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar alerta' }
    }
}

/**
 * Descarta una alerta
 * @param {number} id - ID de la alerta
 * @param {string} motivo - Motivo del descarte
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function descartarAlerta(id, motivo) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE alertas_financiamiento
             SET estado = 'descartada',
                 accion_realizada = ?,
                 resuelta_por = ?,
                 fecha_resolucion = NOW()
             WHERE id = ? AND empresa_id = ?`,
            [motivo || 'Alerta descartada', userId, id, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Alerta descartada'
        }

    } catch (error) {
        console.error('Error al descartar alerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al descartar alerta: ' + error.message }
    }
}

/**
 * Asigna una alerta a un usuario
 * @param {number} id - ID de la alerta
 * @param {number} usuarioId - ID del usuario asignado
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function asignarAlerta(id, usuarioId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE alertas_financiamiento
             SET asignado_a = ?,
                 fecha_asignacion = NOW()
             WHERE id = ? AND empresa_id = ?`,
            [usuarioId, id, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Alerta asignada exitosamente'
        }

    } catch (error) {
        console.error('Error al asignar alerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al asignar alerta: ' + error.message }
    }
}

/**
 * Obtiene estadísticas de alertas
 * @param {Object} filtros - Filtros opcionales
 * @returns {Object} { success: boolean, estadisticas?: Object, mensaje?: string }
 */
export async function obtenerEstadisticasAlertas(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        let whereClause = 'WHERE a.empresa_id = ?'
        const params = [empresaId]

        if (filtros.fecha_desde) {
            whereClause += ' AND a.fecha_creacion >= ?'
            params.push(filtros.fecha_desde)
        }

        if (filtros.fecha_hasta) {
            whereClause += ' AND a.fecha_creacion <= ?'
            params.push(filtros.fecha_hasta)
        }

        // Estadísticas generales
        const [estadisticas] = await connection.execute(
            `SELECT 
                COUNT(*) as total_alertas,
                SUM(CASE WHEN a.estado = 'activa' THEN 1 ELSE 0 END) as alertas_activas,
                SUM(CASE WHEN a.estado = 'vista' THEN 1 ELSE 0 END) as alertas_vistas,
                SUM(CASE WHEN a.estado = 'resuelta' THEN 1 ELSE 0 END) as alertas_resueltas,
                SUM(CASE WHEN a.estado = 'descartada' THEN 1 ELSE 0 END) as alertas_descartadas,
                SUM(CASE WHEN a.severidad = 'critica' THEN 1 ELSE 0 END) as alertas_criticas,
                SUM(CASE WHEN a.severidad = 'alta' THEN 1 ELSE 0 END) as alertas_altas,
                SUM(CASE WHEN a.severidad = 'media' THEN 1 ELSE 0 END) as alertas_medias,
                SUM(CASE WHEN a.severidad = 'baja' THEN 1 ELSE 0 END) as alertas_bajas
             FROM alertas_financiamiento a
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
 * Verifica y crea alertas automáticas para cuotas próximas a vencer
 * @returns {Object} { success: boolean, alertas_creadas?: number, mensaje?: string }
 */
export async function verificarYCrearAlertasCuotas() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida', alertas_creadas: 0 }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        let alertasCreadas = 0

        // ALERTAS POR VENCIMIENTO PRÓXIMO (10, 5, 3 días y hoy)
        const cuotasVencimiento = [
            { dias: 10, tipo: 'vence_10_dias', severidad: 'baja', titulo: 'Cuota vence en 10 días' },
            { dias: 5, tipo: 'vence_5_dias', severidad: 'media', titulo: 'Cuota vence en 5 días' },
            { dias: 3, tipo: 'vence_3_dias', severidad: 'alta', titulo: 'Cuota vence en 3 días' },
            { dias: 0, tipo: 'vence_hoy', severidad: 'critica', titulo: 'Cuota vence hoy' }
        ]

        for (const config of cuotasVencimiento) {
            const [cuotas] = await connection.execute(
                `SELECT cf.id, cf.numero_cuota, cf.fecha_vencimiento, cf.monto_cuota,
                        cf.monto_pagado, (cf.monto_cuota - cf.monto_pagado) as saldo_pendiente, 
                        c.id as cliente_id, c.nombre, c.apellidos, cof.id as contrato_id,
                        cof.numero_contrato
                 FROM cuotas_financiamiento cf
                 JOIN contratos_financiamiento cof ON cf.contrato_id = cof.id
                 JOIN clientes c ON cof.cliente_id = c.id
                 WHERE cf.empresa_id = ? AND cf.estado IN ('pendiente', 'parcial')
                   AND DATE(cf.fecha_vencimiento) = DATE(DATE_ADD(NOW(), INTERVAL ? DAY))
                   AND NOT EXISTS (
                       SELECT 1 FROM alertas_financiamiento a
                       WHERE a.cuota_id = cf.id AND a.tipo_alerta = ?
                         AND a.estado IN ('activa', 'vista')
                   )`,
                [empresaId, config.dias, config.tipo]
            )

            // Crear alerta por cada cuota
            for (const cuota of cuotas) {
                const mensaje = `La cuota #${cuota.numero_cuota} de ${cuota.nombre} ${cuota.apellidos} vence el ${new Date(cuota.fecha_vencimiento).toLocaleDateString('es-DO')} con saldo de RD$${parseFloat(cuota.saldo_pendiente).toFixed(2)}`

                await connection.execute(
                    `INSERT INTO alertas_financiamiento (
                        empresa_id, cliente_id, contrato_id, cuota_id,
                        tipo_alerta, severidad, titulo, mensaje,
                        estado, fecha_creacion
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        empresaId,
                        cuota.cliente_id,
                        cuota.contrato_id,
                        cuota.id,
                        config.tipo,
                        config.severidad,
                        config.titulo,
                        mensaje,
                        'activa'
                    ]
                )
                alertasCreadas++
            }
        }

        // ALERTAS POR CUOTAS VENCIDAS
        const [cuotasVencidas] = await connection.execute(
            `SELECT cf.id, cf.numero_cuota, cf.fecha_vencimiento, 
                    (cf.monto_cuota - cf.monto_pagado) as saldo_pendiente,
                    cf.monto_pagado, cf.monto_cuota,
                    c.id as cliente_id, c.nombre, c.apellidos,
                    cof.id as contrato_id, cof.numero_contrato
             FROM cuotas_financiamiento cf
             JOIN contratos_financiamiento cof ON cf.contrato_id = cof.id
             JOIN clientes c ON cof.cliente_id = c.id
             WHERE cf.empresa_id = ? AND cf.estado IN ('pendiente', 'parcial')
               AND DATE(cf.fecha_vencimiento) < DATE(NOW())
               AND NOT EXISTS (
                   SELECT 1 FROM alertas_financiamiento a
                   WHERE a.cuota_id = cf.id AND a.tipo_alerta = 'vencida'
                     AND a.estado IN ('activa', 'vista')
               )`,
            [empresaId]
        )

        for (const cuota of cuotasVencidas) {
            const diasVencimiento = Math.floor((new Date() - new Date(cuota.fecha_vencimiento)) / (1000 * 60 * 60 * 24))
            const severidad = diasVencimiento > 30 ? 'critica' : diasVencimiento > 15 ? 'alta' : 'media'
            const mensaje = `⚠️ CUOTA VENCIDA: #${cuota.numero_cuota} de ${cuota.nombre} ${cuota.apellidos}\n` +
                          `Vencida hace ${diasVencimiento} días\n` +
                          `Monto original: RD$${parseFloat(cuota.monto_cuota).toFixed(2)}\n` +
                          `Pagado: RD$${parseFloat(cuota.monto_pagado || 0).toFixed(2)}\n` +
                          `Saldo: RD$${parseFloat(cuota.saldo_pendiente).toFixed(2)}`

            await connection.execute(
                `INSERT INTO alertas_financiamiento (
                    empresa_id, cliente_id, contrato_id, cuota_id,
                    tipo_alerta, severidad, titulo, mensaje,
                    estado, fecha_creacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    empresaId,
                    cuota.cliente_id,
                    cuota.contrato_id,
                    cuota.id,
                    'vencida',
                    severidad,
                    'Cuota vencida',
                    mensaje,
                    'activa'
                ]
            )
            alertasCreadas++
        }

        // ALERTAS POR CLIENTES DE ALTO RIESGO
        const [clientesAltoRiesgo] = await connection.execute(
            `SELECT DISTINCT c.id as cliente_id, c.nombre, c.apellidos,
                    SUM(cf.monto_cuota - cf.monto_pagado) as saldo_total,
                    COUNT(DISTINCT cof.id) as contratos_activos,
                    COUNT(CASE WHEN cf.fecha_vencimiento < NOW() AND cf.estado IN ('pendiente', 'parcial') THEN 1 END) as cuotas_vencidas
             FROM clientes c
             JOIN contratos_financiamiento cof ON c.id = cof.cliente_id
             JOIN cuotas_financiamiento cf ON cof.id = cf.contrato_id
             WHERE c.empresa_id = ? AND cof.estado IN ('vigente', 'en_mora')
               AND cf.estado IN ('pendiente', 'parcial')
               AND cf.fecha_vencimiento < NOW()
             GROUP BY c.id
             HAVING cuotas_vencidas > 0
               AND NOT EXISTS (
                   SELECT 1 FROM alertas_financiamiento a
                   WHERE a.cliente_id = c.id AND a.tipo_alerta = 'cliente_alto_riesgo'
                     AND a.estado IN ('activa', 'vista')
               )`,
            [empresaId]
        )

        for (const cliente of clientesAltoRiesgo) {
            const mensaje = `🚨 CLIENTE DE ALTO RIESGO:\n` +
                          `${cliente.nombre} ${cliente.apellidos}\n` +
                          `Cuotas vencidas: ${cliente.cuotas_vencidas}\n` +
                          `Contratos activos: ${cliente.contratos_activos}\n` +
                          `Saldo total vencido: RD$${parseFloat(cliente.saldo_total).toFixed(2)}`

            await connection.execute(
                `INSERT INTO alertas_financiamiento (
                    empresa_id, cliente_id,
                    tipo_alerta, severidad, titulo, mensaje,
                    estado, fecha_creacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    empresaId,
                    cliente.cliente_id,
                    'cliente_alto_riesgo',
                    'critica',
                    'Cliente de alto riesgo',
                    mensaje,
                    'activa'
                ]
            )
            alertasCreadas++
        }

        // ALERTAS POR PAGOS REGISTRADOS RECIENTEMENTE (últimas 24h)
        const [pagosRecientes] = await connection.execute(
            `SELECT DISTINCT 
                    pf.id as pago_id,
                    pf.numero_recibo,
                    pf.monto_pago,
                    pf.fecha_pago,
                    cf.id as cuota_id,
                    cf.numero_cuota,
                    c.id as cliente_id,
                    c.nombre, c.apellidos,
                    cof.id as contrato_id,
                    cof.numero_contrato
             FROM pagos_financiamiento pf
             JOIN cuotas_financiamiento cf ON pf.cuota_id = cf.id
             JOIN contratos_financiamiento cof ON pf.contrato_id = cof.id
             JOIN clientes c ON cof.cliente_id = c.id
             WHERE pf.empresa_id = ? 
               AND pf.estado = 'confirmado'
               AND pf.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
               AND NOT EXISTS (
                   SELECT 1 FROM alertas_financiamiento a
                   WHERE a.cuota_id = cf.id AND a.tipo_alerta = 'pago_registrado'
                     AND a.estado = 'activa'
                     AND DATE(a.fecha_creacion) = CURDATE()
               )`,
            [empresaId]
        )

        for (const pago of pagosRecientes) {
            const mensaje = `✅ PAGO REGISTRADO:\n` +
                          `Recibo: ${pago.numero_recibo}\n` +
                          `Cliente: ${pago.nombre} ${pago.apellidos}\n` +
                          `Cuota: #${pago.numero_cuota}\n` +
                          `Monto: RD$${parseFloat(pago.monto_pago).toFixed(2)}\n` +
                          `Fecha: ${new Date(pago.fecha_pago).toLocaleDateString('es-DO')}`

            await connection.execute(
                `INSERT INTO alertas_financiamiento (
                    empresa_id, cliente_id, contrato_id, cuota_id,
                    tipo_alerta, severidad, titulo, mensaje,
                    estado, fecha_creacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    empresaId,
                    pago.cliente_id,
                    pago.contrato_id,
                    pago.cuota_id,
                    'pago_registrado',
                    'baja',
                    'Pago registrado',
                    mensaje,
                    'activa'
                ]
            )
            alertasCreadas++
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            alertas_creadas: alertasCreadas,
            mensaje: alertasCreadas > 0 ? `${alertasCreadas} alerta(s) procesada(s)` : 'Sistema de alertas actualizado'
        }

    } catch (error) {
        console.error('Error al verificar alertas:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al procesar alertas: ' + error.message, alertas_creadas: 0 }
    }
}

/**
 * Resuelve automáticamente alertas cuando se registra un pago
 * @param {number} cuotaId - ID de la cuota pagada
 * @param {number} usuarioId - ID del usuario que registró el pago
 * @returns {Object} { success: boolean, alertas_resueltas?: number }
 */
export async function resolverAlertasPorPago(cuotaId, usuarioId) {
    let connection
    try {
        connection = await db.getConnection()

        const [result] = await connection.execute(
            `UPDATE alertas_financiamiento
             SET estado = 'resuelta',
                 accion_realizada = 'Pago registrado - Alerta auto-resuelta',
                 resuelta_por = ?,
                 fecha_resolucion = NOW()
             WHERE cuota_id = ? AND estado IN ('activa', 'vista')
               AND tipo_alerta IN ('vence_10_dias', 'vence_5_dias', 'vence_3_dias', 'vence_hoy')`,
            [usuarioId, cuotaId]
        )

        connection.release()

        return {
            success: true,
            alertas_resueltas: result.affectedRows
        }

    } catch (error) {
        console.error('Error al resolver alertas:', error)
        if (connection) connection.release()
        return { success: false, alertas_resueltas: 0 }
    }
}

