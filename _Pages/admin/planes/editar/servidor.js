"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { 
    validarTasaInteres, 
    validarPlazo, 
    validarPagoInicialPct,
    validarTasaMora,
    validarDiasGracia,
    validarMontoFinanciable
} from '../../core/finance/reglas.js'
import { tasaAnualAMensual } from '../../core/finance/calculos.js'
import { PlanService } from '../../core/finance/PlanService.js'

/**
 * Obtiene un plan por su ID
 * @param {number} id - ID del plan
 * @returns {Object} { success: boolean, plan?: Object, mensaje?: string }
 */
export async function obtenerPlanPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [planes] = await connection.execute(
            `SELECT 
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
             WHERE p.id = ? AND (p.empresa_id = ? OR p.empresa_id IS NULL)
             GROUP BY p.id`,
            [id, empresaId]
        )

        connection.release()

        if (planes.length === 0) {
            return { success: false, mensaje: 'Plan no encontrado' }
        }

        const plan = planes[0]

        // Procesar plazos
        let plazos = []
        try {
            if (plan.plazos && typeof plan.plazos === 'string') {
                plazos = JSON.parse(plan.plazos)
            } else if (Array.isArray(plan.plazos)) {
                plazos = plan.plazos
            }
        } catch (e) {
            console.warn('Error al parsear plazos:', e)
            plazos = []
        }

        // Filtrar plazos nulos
        plazos = plazos.filter(p => p && p.id !== null)

        // Si no hay plazos, usar valores legacy como fallback
        if (plazos.length === 0 && plan.plazo_meses) {
            plazos = [{
                id: null,
                plazo_meses: plan.plazo_meses,
                tipo_pago_inicial: 'PORCENTAJE',
                pago_inicial_valor: plan.pago_inicial_minimo_pct || 15.00,
                cuota_mensual: null,
                tasa_anual_calculada: plan.tasa_interes_anual,
                tasa_mensual_calculada: plan.tasa_interes_mensual || (plan.tasa_interes_anual / 12 / 100),
                es_sugerido: true,
                activo: 1,
                orden: 0,
                es_legacy: true
            }]
        }

        return { 
            success: true, 
            plan: {
                ...plan,
                plazos: plazos,
                tiene_plazos: plazos.length > 0 && !plazos[0]?.es_legacy
            }
        }

    } catch (error) {
        console.error('Error al obtener plan:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar plan' }
    }
}

/**
 * Actualiza un plan de financiamiento
 * @param {number} id - ID del plan
 * @param {Object} datos - Datos a actualizar
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function actualizarPlanFinanciamiento(id, datos) {
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

        // Validaciones usando el dominio compartido
        if (datos.tasa_interes_anual !== undefined) {
            const validacionTasa = validarTasaInteres(datos.tasa_interes_anual)
            if (!validacionTasa.valido) {
                connection.release()
                return { success: false, mensaje: validacionTasa.error }
            }
        }

        if (datos.plazo_meses !== undefined) {
            const validacionPlazo = validarPlazo(datos.plazo_meses)
            if (!validacionPlazo.valido) {
                connection.release()
                return { success: false, mensaje: validacionPlazo.error }
            }
        }

        if (datos.pago_inicial_minimo_pct !== undefined) {
            const validacionInicial = validarPagoInicialPct(datos.pago_inicial_minimo_pct)
            if (!validacionInicial.valido) {
                connection.release()
                return { success: false, mensaje: validacionInicial.error }
            }
        }

        if (datos.penalidad_mora_pct !== undefined) {
            const validacionMora = validarTasaMora(datos.penalidad_mora_pct)
            if (!validacionMora.valido) {
                connection.release()
                return { success: false, mensaje: validacionMora.error }
            }
        }

        if (datos.dias_gracia !== undefined) {
            const validacionGracia = validarDiasGracia(datos.dias_gracia)
            if (!validacionGracia.valido) {
                connection.release()
                return { success: false, mensaje: validacionGracia.error }
            }
        }

        // Si se cambia el código, validar que sea único
        if (datos.codigo) {
            const [codigoExistente] = await connection.execute(
                `SELECT id FROM planes_financiamiento WHERE codigo = ? AND id != ?`,
                [datos.codigo, id]
            )

            if (codigoExistente.length > 0) {
                connection.release()
                return { success: false, mensaje: 'El código del plan ya existe' }
            }
        }

        // Construir query de actualización dinámicamente
        const campos = []
        const valores = []

        if (datos.nombre !== undefined) {
            campos.push('nombre = ?')
            valores.push(datos.nombre)
        }
        if (datos.descripcion !== undefined) {
            campos.push('descripcion = ?')
            valores.push(datos.descripcion)
        }
        if (datos.codigo !== undefined) {
            campos.push('codigo = ?')
            valores.push(datos.codigo)
        }
        if (datos.plazo_meses !== undefined) {
            campos.push('plazo_meses = ?')
            valores.push(datos.plazo_meses)
        }
        if (datos.tasa_interes_anual !== undefined) {
            campos.push('tasa_interes_anual = ?')
            valores.push(datos.tasa_interes_anual)
            // Recalcular tasa mensual si cambia la anual
            const tasaMensual = tasaAnualAMensual(datos.tasa_interes_anual)
            campos.push('tasa_interes_mensual = ?')
            valores.push(tasaMensual)
        }
        if (datos.pago_inicial_minimo_pct !== undefined) {
            campos.push('pago_inicial_minimo_pct = ?')
            valores.push(datos.pago_inicial_minimo_pct)
        }
        if (datos.monto_minimo !== undefined) {
            campos.push('monto_minimo = ?')
            valores.push(datos.monto_minimo)
        }
        if (datos.monto_maximo !== undefined) {
            campos.push('monto_maximo = ?')
            valores.push(datos.monto_maximo === '' ? null : datos.monto_maximo)
        }
        if (datos.penalidad_mora_pct !== undefined) {
            campos.push('penalidad_mora_pct = ?')
            valores.push(datos.penalidad_mora_pct)
        }
        if (datos.dias_gracia !== undefined) {
            campos.push('dias_gracia = ?')
            valores.push(datos.dias_gracia)
        }
        if (datos.descuento_pago_anticipado_pct !== undefined) {
            campos.push('descuento_pago_anticipado_pct = ?')
            valores.push(datos.descuento_pago_anticipado_pct)
        }
        if (datos.cuotas_minimas_anticipadas !== undefined) {
            campos.push('cuotas_minimas_anticipadas = ?')
            valores.push(datos.cuotas_minimas_anticipadas)
        }
        if (datos.activo !== undefined) {
            campos.push('activo = ?')
            valores.push(datos.activo ? 1 : 0)
        }
        if (datos.permite_pago_anticipado !== undefined) {
            campos.push('permite_pago_anticipado = ?')
            valores.push(datos.permite_pago_anticipado ? 1 : 0)
        }
        if (datos.requiere_fiador !== undefined) {
            campos.push('requiere_fiador = ?')
            valores.push(datos.requiere_fiador ? 1 : 0)
        }

        campos.push('modificado_por = ?')
        valores.push(userId)

        valores.push(id)

        await connection.execute(
            `UPDATE planes_financiamiento 
             SET ${campos.join(', ')}
             WHERE id = ?`,
            valores
        )

        connection.release()

        return { success: true, mensaje: 'Plan actualizado exitosamente' }

    } catch (error) {
        console.error('Error al actualizar plan de financiamiento:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar plan: ' + error.message }
    }
}

/**
 * Agrega un nuevo plazo a un plan existente
 * @param {number} planId - ID del plan
 * @param {Object} datosPlazo - Datos del plazo a agregar
 * @returns {Object} { success: boolean, plazo_id?: number, mensaje?: string }
 */
export async function agregarPlazoPlan(planId, datosPlazo) {
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
            [planId, empresaId]
        )

        if (planes.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Plan no encontrado' }
        }

        // Validar datos del plazo
        const validacion = PlanService.validarDatosPlazo(datosPlazo)
        if (!validacion.valido) {
            connection.release()
            return { success: false, mensaje: validacion.errores.join(', ') }
        }

        // Verificar duplicados
        const [plazosExistentes] = await connection.execute(
            `SELECT plazo_meses FROM planes_plazos 
             WHERE plan_id = ? AND activo = 1`,
            [planId]
        )

        const validacionDuplicados = PlanService.validarDuplicados(
            datosPlazo,
            plazosExistentes.map(p => ({ plazo_meses: p.plazo_meses, activo: true }))
        )

        if (!validacionDuplicados.valido) {
            connection.release()
            return { success: false, mensaje: validacionDuplicados.error }
        }

        // Calcular tasa usando PlanService
        const calculo = PlanService.calcularPlazo({
            plazo_meses: datosPlazo.plazo_meses,
            tipo_pago_inicial: datosPlazo.tipo_pago_inicial,
            pago_inicial_valor: datosPlazo.pago_inicial_valor,
            cuota_mensual: datosPlazo.cuota_mensual
        })

        if (!calculo.valido) {
            connection.release()
            return { success: false, mensaje: calculo.error }
        }

        // Obtener el siguiente orden
        const [maxOrden] = await connection.execute(
            `SELECT COALESCE(MAX(orden), -1) as max_orden FROM planes_plazos WHERE plan_id = ?`,
            [planId]
        )
        const siguienteOrden = maxOrden[0].max_orden + 1

        // Insertar plazo
        const [result] = await connection.execute(
            `INSERT INTO planes_plazos (
                plan_id, plazo_meses, tipo_pago_inicial, pago_inicial_valor,
                cuota_mensual, tasa_anual_calculada, tasa_mensual_calculada,
                es_sugerido, activo, orden, creado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                planId,
                datosPlazo.plazo_meses,
                datosPlazo.tipo_pago_inicial,
                datosPlazo.pago_inicial_valor,
                datosPlazo.cuota_mensual,
                calculo.tasa_anual_calculada,
                calculo.tasa_mensual_calculada,
                datosPlazo.es_sugerido ? 1 : 0,
                1,
                siguienteOrden,
                userId
            ]
        )

        connection.release()

        return {
            success: true,
            plazo_id: result.insertId,
            mensaje: 'Plazo agregado exitosamente'
        }

    } catch (error) {
        console.error('Error al agregar plazo:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al agregar plazo: ' + error.message }
    }
}

/**
 * Actualiza un plazo existente
 * @param {number} plazoId - ID del plazo
 * @param {Object} datosPlazo - Datos a actualizar
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function actualizarPlazoPlan(plazoId, datosPlazo) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Verificar que el plazo existe y pertenece a un plan de la empresa
        const [plazos] = await connection.execute(
            `SELECT pp.*, p.empresa_id 
             FROM planes_plazos pp
             INNER JOIN planes_financiamiento p ON pp.plan_id = p.id
             WHERE pp.id = ? AND (p.empresa_id = ? OR p.empresa_id IS NULL)`,
            [plazoId, empresaId]
        )

        if (plazos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Plazo no encontrado' }
        }

        const plazoActual = plazos[0]

        // Validar datos del plazo
        const validacion = PlanService.validarDatosPlazo(datosPlazo)
        if (!validacion.valido) {
            connection.release()
            return { success: false, mensaje: validacion.errores.join(', ') }
        }

        // Verificar duplicados (excluyendo el plazo actual)
        const [plazosExistentes] = await connection.execute(
            `SELECT plazo_meses FROM planes_plazos 
             WHERE plan_id = ? AND id != ? AND activo = 1`,
            [plazoActual.plan_id, plazoId]
        )

        const validacionDuplicados = PlanService.validarDuplicados(
            datosPlazo,
            plazosExistentes.map(p => ({ plazo_meses: p.plazo_meses, activo: true }))
        )

        if (!validacionDuplicados.valido) {
            connection.release()
            return { success: false, mensaje: validacionDuplicados.error }
        }

        // Recalcular tasa si cambió cuota, pago o plazo
        const necesitaRecalcular = 
            datosPlazo.cuota_mensual !== undefined && datosPlazo.cuota_mensual !== plazoActual.cuota_mensual ||
            datosPlazo.pago_inicial_valor !== undefined && datosPlazo.pago_inicial_valor !== plazoActual.pago_inicial_valor ||
            datosPlazo.plazo_meses !== undefined && datosPlazo.plazo_meses !== plazoActual.plazo_meses ||
            datosPlazo.tipo_pago_inicial !== undefined && datosPlazo.tipo_pago_inicial !== plazoActual.tipo_pago_inicial

        let tasaAnual = datosPlazo.tasa_anual_calculada || plazoActual.tasa_anual_calculada
        let tasaMensual = datosPlazo.tasa_mensual_calculada || plazoActual.tasa_mensual_calculada

        if (necesitaRecalcular) {
            const calculo = PlanService.calcularPlazo({
                plazo_meses: datosPlazo.plazo_meses !== undefined ? datosPlazo.plazo_meses : plazoActual.plazo_meses,
                tipo_pago_inicial: datosPlazo.tipo_pago_inicial !== undefined ? datosPlazo.tipo_pago_inicial : plazoActual.tipo_pago_inicial,
                pago_inicial_valor: datosPlazo.pago_inicial_valor !== undefined ? datosPlazo.pago_inicial_valor : plazoActual.pago_inicial_valor,
                cuota_mensual: datosPlazo.cuota_mensual !== undefined ? datosPlazo.cuota_mensual : plazoActual.cuota_mensual
            })

            if (!calculo.valido) {
                connection.release()
                return { success: false, mensaje: calculo.error }
            }

            tasaAnual = calculo.tasa_anual_calculada
            tasaMensual = calculo.tasa_mensual_calculada
        }

        // Construir query de actualización
        const campos = []
        const valores = []

        if (datosPlazo.plazo_meses !== undefined) {
            campos.push('plazo_meses = ?')
            valores.push(datosPlazo.plazo_meses)
        }
        if (datosPlazo.tipo_pago_inicial !== undefined) {
            campos.push('tipo_pago_inicial = ?')
            valores.push(datosPlazo.tipo_pago_inicial)
        }
        if (datosPlazo.pago_inicial_valor !== undefined) {
            campos.push('pago_inicial_valor = ?')
            valores.push(datosPlazo.pago_inicial_valor)
        }
        if (datosPlazo.cuota_mensual !== undefined) {
            campos.push('cuota_mensual = ?')
            valores.push(datosPlazo.cuota_mensual)
        }
        if (necesitaRecalcular || datosPlazo.tasa_anual_calculada !== undefined) {
            campos.push('tasa_anual_calculada = ?')
            valores.push(tasaAnual)
        }
        if (necesitaRecalcular || datosPlazo.tasa_mensual_calculada !== undefined) {
            campos.push('tasa_mensual_calculada = ?')
            valores.push(tasaMensual)
        }
        if (datosPlazo.es_sugerido !== undefined) {
            campos.push('es_sugerido = ?')
            valores.push(datosPlazo.es_sugerido ? 1 : 0)
        }
        if (datosPlazo.orden !== undefined) {
            campos.push('orden = ?')
            valores.push(datosPlazo.orden)
        }

        campos.push('modificado_por = ?')
        valores.push(userId)
        valores.push(plazoId)

        await connection.execute(
            `UPDATE planes_plazos SET ${campos.join(', ')} WHERE id = ?`,
            valores
        )

        connection.release()

        return { success: true, mensaje: 'Plazo actualizado exitosamente' }

    } catch (error) {
        console.error('Error al actualizar plazo:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar plazo: ' + error.message }
    }
}

/**
 * Elimina un plazo (soft delete)
 * @param {number} plazoId - ID del plazo
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function eliminarPlazoPlan(plazoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Verificar que el plazo existe y pertenece a un plan de la empresa
        const [plazos] = await connection.execute(
            `SELECT pp.*, p.empresa_id 
             FROM planes_plazos pp
             INNER JOIN planes_financiamiento p ON pp.plan_id = p.id
             WHERE pp.id = ? AND (p.empresa_id = ? OR p.empresa_id IS NULL)`,
            [plazoId, empresaId]
        )

        if (plazos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Plazo no encontrado' }
        }

        // Validar que no esté en uso en contratos activos
        const [contratos] = await connection.execute(
            `SELECT COUNT(*) as total FROM contratos_financiamiento 
             WHERE plazo_id = ? AND estado IN ('activo', 'pagado')`,
            [plazoId]
        )

        if (contratos[0].total > 0) {
            connection.release()
            return { 
                success: false, 
                mensaje: `No se puede eliminar este plazo porque está en uso en ${contratos[0].total} contrato(s) activo(s)` 
            }
        }

        // Soft delete: marcar como inactivo
        await connection.execute(
            `UPDATE planes_plazos SET activo = 0, modificado_por = ? WHERE id = ?`,
            [userId, plazoId]
        )

        connection.release()

        return { success: true, mensaje: 'Plazo eliminado exitosamente' }

    } catch (error) {
        console.error('Error al eliminar plazo:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al eliminar plazo: ' + error.message }
    }
}

