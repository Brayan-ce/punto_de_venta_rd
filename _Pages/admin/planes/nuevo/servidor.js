"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { 
    validarTasaMora,
    validarDiasGracia,
    validarMontoFinanciable
} from '../../core/finance/reglas.js'
import { PlanService } from '../../core/finance/PlanService.js'

/**
 * Crea un nuevo plan de financiamiento con múltiples opciones de plazo
 * El usuario ingresa: array de plazos con pago inicial, cuota mensual, plazo
 * El sistema calcula: tasa de interés para cada plazo
 * 
 * @param {Object} datos - Datos del plan con array de plazos
 * @param {Array} datos.plazos - Array de plazos: [{ plazo_meses, tipo_pago_inicial, pago_inicial_valor, cuota_mensual, es_sugerido }]
 * @returns {Object} { success: boolean, id?: number, codigo?: string, plazos_creados?: Array, mensaje?: string }
 */
export async function crearPlanFinanciamiento(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validaciones básicas
        if (!datos.nombre) {
            return { success: false, mensaje: 'El nombre del plan es obligatorio' }
        }

        // Validar que haya al menos un plazo configurado
        if (!datos.plazos || !Array.isArray(datos.plazos) || datos.plazos.length === 0) {
            return { success: false, mensaje: 'Debe configurar al menos una opción de plazo' }
        }

        // Validar plazos duplicados
        const plazosMeses = datos.plazos.map(p => p.plazo_meses)
        if (new Set(plazosMeses).size !== plazosMeses.length) {
            return { success: false, mensaje: 'No puede haber plazos duplicados (mismo número de meses)' }
        }

        // Validar cada plazo antes de procesar
        for (let i = 0; i < datos.plazos.length; i++) {
            const plazo = datos.plazos[i]
            const validacion = PlanService.validarDatosPlazo(plazo)
            if (!validacion.valido) {
                return { 
                    success: false, 
                    mensaje: `Error en plazo ${i + 1}: ${validacion.errores.join(', ')}` 
                }
            }

            // Validar duplicados
            const validacionDuplicados = PlanService.validarDuplicados(plazo, datos.plazos, i)
            if (!validacionDuplicados.valido) {
                return { success: false, mensaje: validacionDuplicados.error }
            }
        }

        // Validar penalidades
        if (datos.penalidad_mora_pct !== undefined) {
            const validacionMora = validarTasaMora(datos.penalidad_mora_pct)
            if (!validacionMora.valido) {
                return { success: false, mensaje: validacionMora.error }
            }
        }

        if (datos.dias_gracia !== undefined) {
            const validacionGracia = validarDiasGracia(datos.dias_gracia)
            if (!validacionGracia.valido) {
                return { success: false, mensaje: validacionGracia.error }
            }
        }

        // Validar montos si se proporcionan
        if (datos.monto_minimo !== undefined && datos.monto_minimo > 0) {
            const validacionMinimo = validarMontoFinanciable(datos.monto_minimo)
            if (!validacionMinimo.valido) {
                return { success: false, mensaje: validacionMinimo.error }
            }
        }

        if (datos.monto_maximo !== undefined && datos.monto_maximo !== null) {
            const validacionMaximo = validarMontoFinanciable(datos.monto_maximo)
            if (!validacionMaximo.valido) {
                return { success: false, mensaje: validacionMaximo.error }
            }

            // Validar que máximo sea mayor que mínimo
            if (datos.monto_minimo && datos.monto_maximo < datos.monto_minimo) {
                return { success: false, mensaje: 'El monto máximo debe ser mayor al monto mínimo' }
            }
        }

        // Validar fecha de primer pago si viene
        if (datos.fecha_primer_pago) {
            const fechaPrimerPago = new Date(datos.fecha_primer_pago)
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)
            fechaPrimerPago.setHours(0, 0, 0, 0)

            if (fechaPrimerPago < hoy) {
                connection?.release()
                return { success: false, mensaje: 'La fecha del primer pago no puede ser en el pasado' }
            }

            // Validar que la fecha sea válida
            if (isNaN(fechaPrimerPago.getTime())) {
                connection?.release()
                return { success: false, mensaje: 'La fecha del primer pago no es válida' }
            }
        }

        // Validaciones adicionales según metodología
        if (datos.pago_inicial !== undefined && datos.pago_inicial <= 0) {
            connection?.release()
            return { success: false, mensaje: 'El pago inicial debe ser mayor a 0' }
        }

        if (datos.cuota_mensual !== undefined && datos.cuota_mensual <= 0) {
            connection?.release()
            return { success: false, mensaje: 'La cuota mensual debe ser mayor a 0' }
        }

        if (datos.plazo_meses !== undefined && (datos.plazo_meses < 1 || datos.plazo_meses > 60)) {
            connection?.release()
            return { success: false, mensaje: 'El plazo debe estar entre 1 y 60 meses' }
        }

        connection = await db.getConnection()

        // Generar código único si no viene o si ya existe
        let codigoFinal = datos.codigo || ''
        
        // Si no viene código, generarlo automáticamente desde el nombre
        if (!codigoFinal && datos.nombre) {
            const nombreNormalizado = datos.nombre
                .toUpperCase()
                .replace(/\s+/g, '_')
                .replace(/[^A-Z0-9_]/g, '')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '')
                .slice(0, 15)
            codigoFinal = `PLAN_${nombreNormalizado}`.slice(0, 20)
        }

        // Validar y ajustar código si ya existe (agregar sufijo numérico)
        let codigoUnico = codigoFinal
        let contador = 1
        
        while (true) {
            const [codigoExistente] = await connection.execute(
                `SELECT id FROM planes_financiamiento WHERE codigo = ?`,
                [codigoUnico]
            )

            if (codigoExistente.length === 0) {
                // Código único encontrado
                break
            }

            // Generar nuevo código con sufijo numérico
            const codigoBase = codigoFinal.slice(0, 18) // Dejar espacio para _2, _3, etc.
            codigoUnico = `${codigoBase}_${contador}`
            contador++

            // Protección contra loops infinitos
            if (contador > 100) {
                connection.release()
                return { 
                    success: false, 
                    mensaje: 'No se pudo generar un código único. Por favor, intente con un nombre diferente.' 
                }
            }
        }

        // Usar el código único generado
        const codigoParaGuardar = codigoUnico

        // ⚠️ CRÍTICO: Iniciar transacción
        await connection.beginTransaction()

        try {
            // 1. Crear plan base (sin datos de plazo - campos legacy se dejan NULL o valores por defecto)
            // NOTA: Si la tabla aún tiene campos legacy como NOT NULL, incluimos valores por defecto
            // Estos campos serán deprecated una vez que se ejecute la migración completa
            const [resultPlan] = await connection.execute(
                `INSERT INTO planes_financiamiento (
                    empresa_id, codigo, nombre, descripcion,
                    penalidad_mora_pct, dias_gracia, descuento_pago_anticipado_pct,
                    cuotas_minimas_anticipadas, monto_minimo, monto_maximo,
                    activo, permite_pago_anticipado, requiere_fiador, creado_por,
                    plazo_meses, tasa_interes_anual, tasa_interes_mensual, pago_inicial_minimo_pct
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.empresa_id || empresaId,
                    codigoParaGuardar,
                    datos.nombre,
                    datos.descripcion || null,
                    datos.penalidad_mora_pct || 5.00,
                    datos.dias_gracia || 5,
                    datos.descuento_pago_anticipado_pct || 0.00,
                    datos.cuotas_minimas_anticipadas || 3.00,
                    datos.monto_minimo || 0.00,
                    datos.monto_maximo || null,
                    datos.activo !== undefined ? (datos.activo ? 1 : 0) : 1,
                    datos.permite_pago_anticipado !== undefined ? (datos.permite_pago_anticipado ? 1 : 0) : 1,
                    datos.requiere_fiador !== undefined ? (datos.requiere_fiador ? 1 : 0) : 0,
                    userId,
                    // Campos legacy: valores por defecto temporales (serán NULL después de la migración)
                    null, // plazo_meses - ahora se usa planes_plazos
                    null, // tasa_interes_anual - ahora se usa planes_plazos.tasa_anual_calculada
                    null, // tasa_interes_mensual - ahora se usa planes_plazos.tasa_mensual_calculada
                    null  // pago_inicial_minimo_pct - ahora se usa planes_plazos.pago_inicial_valor
                ]
            )

            const planId = resultPlan.insertId
            const plazosCreados = []

            // 2. Crear cada plazo
            for (let i = 0; i < datos.plazos.length; i++) {
                const plazo = datos.plazos[i]
                
                // Obtener política aplicable (opcional, para futuras mejoras)
                // Por ahora, PlanService determina el tipo automáticamente
                const politica = await PlanService.obtenerPolitica(plazo.plazo_meses, empresaId, connection)
                
                // Calcular usando PlanService (dispatcher automático)
                // Asegurar que para planes comerciales siempre haya recargo
                const tipoPlanCalculado = politica?.tipo_calculo || PlanService.determinarTipoPlan(plazo.plazo_meses)
                const recargoTipo = plazo.recargo_tipo || politica?.recargo_tipo || null
                const recargoValor = plazo.recargo_valor !== null && plazo.recargo_valor !== undefined
                    ? plazo.recargo_valor
                    : (politica?.recargo_valor !== null && politica?.recargo_valor !== undefined
                        ? politica.recargo_valor
                        : null)
                
                const calculo = PlanService.calcularPlazo({
                    plazo_meses: plazo.plazo_meses,
                    tipo_pago_inicial: plazo.tipo_pago_inicial,
                    pago_inicial_valor: plazo.pago_inicial_valor,
                    cuota_mensual: plazo.cuota_mensual,
                    recargo_tipo: recargoTipo,
                    recargo_valor: recargoValor,
                    precio_producto: datos.precio_producto_ejemplo // Opcional, para cálculo más preciso
                }, politica)

                if (!calculo.valido) {
                    throw new Error(`Error en plazo ${plazo.plazo_meses} meses: ${calculo.error}`)
                }

                // Validación de coherencia (solo para planes financieros)
                if (i > 0 && calculo.tipo_plan === 'FINANCIERO') {
                    const plazoAnterior = datos.plazos[i - 1]
                    if (plazo.plazo_meses > plazoAnterior.plazo_meses && 
                        plazo.cuota_mensual > plazoAnterior.cuota_mensual) {
                        console.warn(
                            `Advertencia: Plazo mayor (${plazo.plazo_meses}) tiene cuota mayor ` +
                            `(${plazo.cuota_mensual}) que plazo anterior (${plazoAnterior.cuota_mensual})`
                        )
                    }
                }

                // Asegurar recargo válido para planes comerciales
                const tipoPlanFinal = calculo.tipo_plan || (plazo.tipo_plan || PlanService.determinarTipoPlan(plazo.plazo_meses))
                let recargoTipoFinal = calculo.recargo_tipo || plazo.recargo_tipo || politica?.recargo_tipo || null
                let recargoValorFinal = calculo.recargo_valor !== null && calculo.recargo_valor !== undefined
                    ? calculo.recargo_valor
                    : (plazo.recargo_valor !== null && plazo.recargo_valor !== undefined
                        ? plazo.recargo_valor
                        : (politica?.recargo_valor !== null && politica?.recargo_valor !== undefined
                            ? politica.recargo_valor
                            : null))
                
                // Si es comercial y no hay recargo, asignar valores por defecto
                if (tipoPlanFinal === 'COMERCIAL' && (!recargoTipoFinal || recargoValorFinal === null || recargoValorFinal <= 0)) {
                    const plazoMeses = plazo.plazo_meses
                    if (plazoMeses <= 2) {
                        recargoTipoFinal = 'FIJO'
                        recargoValorFinal = 800
                    } else if (plazoMeses === 3) {
                        recargoTipoFinal = 'FIJO'
                        recargoValorFinal = 1500
                    } else if (plazoMeses === 4) {
                        recargoTipoFinal = 'PORCENTAJE'
                        recargoValorFinal = 5
                    } else {
                        recargoTipoFinal = 'FIJO'
                        recargoValorFinal = 1000
                    }
                }

                // Insertar plazo con todos los campos nuevos
                const [resultPlazo] = await connection.execute(
                    `INSERT INTO planes_plazos (
                        plan_id, plazo_meses, tipo_pago_inicial, pago_inicial_valor,
                        cuota_mensual, tipo_plan, recargo_tipo, recargo_valor, precio_financiado,
                        tasa_anual_calculada, tasa_mensual_calculada,
                        mostrar_tasa, mostrar_tea,
                        es_sugerido, activo, orden, creado_por
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        planId,
                        plazo.plazo_meses,
                        plazo.tipo_pago_inicial,
                        plazo.pago_inicial_valor,
                        plazo.cuota_mensual,
                        tipoPlanFinal,
                        tipoPlanFinal === 'COMERCIAL' ? recargoTipoFinal : null,
                        tipoPlanFinal === 'COMERCIAL' ? recargoValorFinal : null,
                        calculo.precio_financiado || calculo.precioTotal || null,
                        calculo.tasa_anual_calculada || null,
                        calculo.tasa_mensual_calculada || null,
                        calculo.mostrar_tasa !== false ? 1 : 0,
                        calculo.mostrar_tea !== false ? 1 : 0,
                        plazo.es_sugerido ? 1 : 0,
                        1, // activo
                        i, // orden
                        userId
                    ]
                )

                plazosCreados.push({
                    id: resultPlazo.insertId,
                    plazo_meses: plazo.plazo_meses,
                    cuota_mensual: plazo.cuota_mensual,
                    tasa_anual_calculada: calculo.tasa_anual_calculada
                })
            }

            // ⚠️ CRÍTICO: Commit solo si todo salió bien
            await connection.commit()

            return {
                success: true,
                id: planId,
                codigo: codigoParaGuardar,
                plazos_creados: plazosCreados,
                mensaje: codigoFinal !== codigoParaGuardar 
                    ? `Plan creado exitosamente con ${plazosCreados.length} opciones de plazo. Código ajustado a: ${codigoParaGuardar}`
                    : `Plan creado exitosamente con ${plazosCreados.length} opciones de plazo`
            }

        } catch (error) {
            // ⚠️ CRÍTICO: Rollback si algo falla
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }

    } catch (error) {
        console.error('Error al crear plan de financiamiento:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al crear plan: ' + error.message }
    }
}

