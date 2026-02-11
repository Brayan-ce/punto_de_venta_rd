"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtiene la lista de planes de financiamiento con filtros
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Object} { success: boolean, planes: Array, mensaje?: string }
 */
export async function obtenerPlanesFinanciamiento(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        let query = `
            SELECT 
                p.*,
                u.nombre as creado_por_nombre,
                u2.nombre as modificado_por_nombre,
                COALESCE(
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', pp.id,
                            'plazo_meses', pp.plazo_meses,
                            'tipo_pago_inicial', pp.tipo_pago_inicial,
                            'pago_inicial_valor', pp.pago_inicial_valor,
                            'cuota_mensual', pp.cuota_mensual,
                            'tasa_anual_calculada', pp.tasa_anual_calculada,
                            'tasa_mensual_calculada', pp.tasa_mensual_calculada,
                            'es_sugerido', pp.es_sugerido,
                            'activo', pp.activo,
                            'orden', pp.orden
                        )
                    ),
                    JSON_ARRAY()
                ) as plazos
            FROM planes_financiamiento p
            LEFT JOIN usuarios u ON p.creado_por = u.id
            LEFT JOIN usuarios u2 ON p.modificado_por = u2.id
            LEFT JOIN planes_plazos pp ON p.id = pp.plan_id AND pp.activo = 1
            WHERE (p.empresa_id = ? OR p.empresa_id IS NULL)
        `
        const params = [empresaId]

        // Filtro por estado activo
        if (filtros.activo !== undefined) {
            query += ` AND p.activo = ?`
            params.push(filtros.activo ? 1 : 0)
        }

        // Búsqueda por nombre o código
        if (filtros.buscar) {
            query += ` AND (p.nombre LIKE ? OR p.codigo LIKE ?)`
            const busqueda = `%${filtros.buscar}%`
            params.push(busqueda, busqueda)
        }

        query += ` GROUP BY p.id ORDER BY p.activo DESC, p.fecha_creacion DESC`

        const [planes] = await connection.execute(query, params)

        // Procesar resultados: parsear JSON de plazos y aplicar lógica de fallback
        const planesProcesados = planes.map(plan => {
            let plazos = []
            
            try {
                // Intentar parsear el JSON de plazos
                if (plan.plazos && typeof plan.plazos === 'string') {
                    plazos = JSON.parse(plan.plazos)
                } else if (Array.isArray(plan.plazos)) {
                    plazos = plan.plazos
                }
            } catch (e) {
                console.warn('Error al parsear plazos del plan', plan.id, e)
                plazos = []
            }

            // Filtrar plazos nulos (pueden venir del LEFT JOIN)
            plazos = plazos.filter(p => p && p.id !== null)

            // Si no hay plazos, usar valores legacy como fallback
            if (plazos.length === 0 && plan.plazo_meses) {
                // Crear un plazo "virtual" desde los campos legacy
                plazos = [{
                    id: null, // No tiene ID porque es legacy
                    plazo_meses: plan.plazo_meses,
                    tipo_pago_inicial: 'PORCENTAJE',
                    pago_inicial_valor: plan.pago_inicial_minimo_pct || 15.00,
                    cuota_mensual: null, // No se puede calcular sin más datos
                    tasa_anual_calculada: plan.tasa_interes_anual,
                    tasa_mensual_calculada: plan.tasa_interes_mensual || (plan.tasa_interes_anual / 12 / 100),
                    es_sugerido: true,
                    activo: 1,
                    orden: 0,
                    es_legacy: true // Marcar como legacy
                }]
            }

            return {
                ...plan,
                plazos: plazos,
                tiene_plazos: plazos.length > 0 && !plazos[0]?.es_legacy
            }
        })

        connection.release()

        return { success: true, planes: planesProcesados }

    } catch (error) {
        console.error('Error al obtener planes de financiamiento:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar planes', planes: [] }
    }
}

/**
 * Elimina (desactiva) un plan de financiamiento
 * @param {number} id - ID del plan
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function eliminarPlanFinanciamiento(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Verificar que el plan existe y pertenece a la empresa
        const [planes] = await connection.execute(
            `SELECT id FROM planes_financiamiento 
             WHERE id = ? AND (empresa_id = ? OR empresa_id IS NULL)`,
            [id, empresaId]
        )

        if (planes.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Plan no encontrado' }
        }

        // Verificar si hay contratos usando este plan
        const [contratos] = await connection.execute(
            `SELECT COUNT(*) as total FROM contratos_financiamiento WHERE plan_id = ?`,
            [id]
        )

        if (contratos[0].total > 0) {
            // En lugar de eliminar, desactivar el plan
            await connection.execute(
                `UPDATE planes_financiamiento 
                 SET activo = 0, modificado_por = ?
                 WHERE id = ?`,
                [userId, id]
            )
            connection.release()
            return { success: true, mensaje: 'Plan desactivado (tiene contratos asociados)' }
        }

        // Si no tiene contratos, eliminar físicamente
        await connection.execute(
            `DELETE FROM planes_financiamiento WHERE id = ?`,
            [id]
        )

        connection.release()

        return { success: true, mensaje: 'Plan eliminado exitosamente' }

    } catch (error) {
        console.error('Error al eliminar plan de financiamiento:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al eliminar plan: ' + error.message }
    }
}

