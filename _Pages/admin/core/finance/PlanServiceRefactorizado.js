/**
 * Servicio de Dominio: Planes de Financiamiento (Refactorizado)
 * 
 * Versión refactorizada que separa planes comerciales de planes financieros.
 * 
 * Contiene la lógica de negocio para gestionar planes y sus plazos.
 * Separado del controlador para mantener responsabilidades claras.
 */

import { calcularPlanInverso } from './calculos.js'
import { 
  calcularPlanComercialInverso, 
  esPlanComercial,
  configurarVisualizacion 
} from './calculosComerciales.js'

export class PlanService {
  /**
   * Determina el tipo de plan según el plazo
   * @param {number} plazoMeses - Plazo en meses
   * @param {number} limiteComercial - Límite para considerar comercial (default: 4)
   * @returns {string} 'COMERCIAL' o 'FINANCIERO'
   */
  static determinarTipoPlan(plazoMeses, limiteComercial = 4) {
    return esPlanComercial(plazoMeses, limiteComercial) ? 'COMERCIAL' : 'FINANCIERO'
  }

  /**
   * Calcula la tasa o recargo para un plazo dado
   * Dispatcher principal que decide qué tipo de cálculo usar
   * 
   * @param {Object} datosPlazo - { plazo_meses, tipo_pago_inicial, pago_inicial_valor, cuota_mensual, recargo_tipo?, recargo_valor? }
   * @param {Object} politica - Política de financiamiento aplicable (opcional)
   * @returns {Object} { tipo_plan, tasa_anual_calculada?, tasa_mensual_calculada?, precio_financiado?, recargo?, valido, error }
   */
  static calcularPlazo(datosPlazo, politica = null) {
    try {
      // Validaciones básicas
      if (!datosPlazo.plazo_meses || datosPlazo.plazo_meses < 1 || datosPlazo.plazo_meses > 60) {
        return {
          valido: false,
          error: 'El plazo debe estar entre 1 y 60 meses'
        }
      }

      if (!datosPlazo.cuota_mensual || datosPlazo.cuota_mensual <= 0) {
        return {
          valido: false,
          error: 'La cuota mensual debe ser mayor a 0'
        }
      }

      if (!datosPlazo.pago_inicial_valor || datosPlazo.pago_inicial_valor <= 0) {
        return {
          valido: false,
          error: 'El valor del pago inicial debe ser mayor a 0'
        }
      }

      // Determinar tipo de plan
      const tipoPlan = politica?.tipo_calculo || this.determinarTipoPlan(datosPlazo.plazo_meses)

      // Calcular según el tipo
      if (tipoPlan === 'COMERCIAL') {
        return this.calcularPlazoComercial(datosPlazo, politica)
      } else {
        return this.calcularPlazoFinanciero(datosPlazo)
      }

    } catch (error) {
      console.error('Error en PlanService.calcularPlazo:', error)
      return {
        valido: false,
        error: 'Error inesperado al calcular: ' + error.message
      }
    }
  }

  /**
   * Calcula un plazo comercial (pago diferido con recargo)
   * @param {Object} datosPlazo - Datos del plazo
   * @param {Object} politica - Política aplicable
   * @returns {Object} Resultado del cálculo
   */
  static calcularPlazoComercial(datosPlazo, politica = null) {
    // Obtener recargo de la política o de los datos
    const recargoTipo = politica?.recargo_tipo || datosPlazo.recargo_tipo || 'FIJO'
    const recargoValor = politica?.recargo_valor || datosPlazo.recargo_valor || 0

    // Calcular usando función inversa (sin precio contado)
    const resultado = calcularPlanComercialInverso(
      datosPlazo.pago_inicial_valor,
      datosPlazo.cuota_mensual,
      datosPlazo.plazo_meses,
      recargoTipo,
      recargoValor
    )

    if (!resultado.valido) {
      return {
        valido: false,
        error: resultado.error || 'Error al calcular el plan comercial'
      }
    }

    // Configurar visualización
    const visualizacion = configurarVisualizacion('COMERCIAL', datosPlazo.plazo_meses)

    return {
      valido: true,
      tipo_plan: 'COMERCIAL',
      precio_financiado: resultado.precioFinanciado,
      monto_financiado: resultado.montoFinanciado,
      porcentaje_inicial: resultado.porcentajeInicial,
      recargo: resultado.recargo,
      recargo_tipo: recargoTipo,
      recargo_valor: recargoValor,
      // NO incluir tasas
      tasa_anual_calculada: null,
      tasa_mensual_calculada: null,
      mostrar_tasa: visualizacion.mostrarTasa,
      mostrar_tea: visualizacion.mostrarTEA
    }
  }

  /**
   * Calcula un plazo financiero (crédito con tasa de interés)
   * @param {Object} datosPlazo - Datos del plazo
   * @returns {Object} Resultado del cálculo
   */
  static calcularPlazoFinanciero(datosPlazo) {
    // Calcular pago inicial real según el tipo
    let pagoInicialReal = 0
    
    if (datosPlazo.tipo_pago_inicial === 'PORCENTAJE') {
      // Si es porcentaje, necesitamos un precio de producto para calcular
      // Si no viene precio_producto, estimamos desde cuota y plazo
      if (datosPlazo.precio_producto) {
        pagoInicialReal = datosPlazo.precio_producto * (datosPlazo.pago_inicial_valor / 100)
      } else {
        // Estimación: precio ≈ cuota * plazo * factor
        const precioEstimado = datosPlazo.cuota_mensual * datosPlazo.plazo_meses * 1.5
        pagoInicialReal = precioEstimado * (datosPlazo.pago_inicial_valor / 100)
      }
    } else {
      // Es monto fijo
      pagoInicialReal = datosPlazo.pago_inicial_valor
    }

    // Calcular tasa usando el flujo inverso
    const resultado = calcularPlanInverso(
      pagoInicialReal,
      datosPlazo.cuota_mensual,
      datosPlazo.plazo_meses
    )

    if (!resultado.valido) {
      return {
        valido: false,
        error: resultado.error || 'Error al calcular la tasa de interés'
      }
    }

    // Configurar visualización según plazo
    const visualizacion = configurarVisualizacion('FINANCIERO', datosPlazo.plazo_meses)

    return {
      valido: true,
      tipo_plan: 'FINANCIERO',
      tasa_anual_calculada: resultado.tasaAnualEfectiva,
      tasa_mensual_calculada: resultado.tasaMensual,
      montoFinanciado: resultado.montoFinanciado,
      precioTotal: resultado.precioTotal,
      porcentajeInicial: resultado.porcentajeInicial,
      totalIntereses: resultado.totalIntereses,
      mostrar_tasa: visualizacion.mostrarTasa,
      mostrar_tea: visualizacion.mostrarTEA
    }
  }

  /**
   * Valida la coherencia de un plazo comparado con otros plazos
   * Regla: plazo mayor → cuota menor (warning, no error)
   * @param {Object} plazo - Plazo a validar
   * @param {Array} otrosPlazos - Array de otros plazos para comparar
   * @returns {Object} { valido: boolean, warnings: string[] }
   */
  static validarCoherenciaPlazo(plazo, otrosPlazos) {
    const warnings = []

    if (!otrosPlazos || otrosPlazos.length === 0) {
      return { valido: true, warnings: [] }
    }

    // Solo validar coherencia para planes financieros
    if (plazo.tipo_plan !== 'FINANCIERO') {
      return { valido: true, warnings: [] }
    }

    // Buscar plazos menores
    const plazosMenores = otrosPlazos.filter(p => 
      p.plazo_meses < plazo.plazo_meses && 
      p.activo !== false &&
      p.tipo_plan === 'FINANCIERO'
    )

    for (const plazoMenor of plazosMenores) {
      if (plazo.cuota_mensual > plazoMenor.cuota_mensual) {
        warnings.push(
          `Advertencia: El plazo de ${plazo.plazo_meses} meses tiene una cuota mayor ` +
          `(${plazo.cuota_mensual}) que el plazo de ${plazoMenor.plazo_meses} meses ` +
          `(${plazoMenor.cuota_mensual}). Normalmente, plazos mayores deberían tener cuotas menores.`
        )
      }
    }

    // Buscar plazos mayores
    const plazosMayores = otrosPlazos.filter(p => 
      p.plazo_meses > plazo.plazo_meses && 
      p.activo !== false &&
      p.tipo_plan === 'FINANCIERO'
    )

    for (const plazoMayor of plazosMayores) {
      if (plazo.cuota_mensual < plazoMayor.cuota_mensual) {
        warnings.push(
          `Advertencia: El plazo de ${plazo.plazo_meses} meses tiene una cuota menor ` +
          `(${plazo.cuota_mensual}) que el plazo de ${plazoMayor.plazo_meses} meses ` +
          `(${plazoMayor.cuota_mensual}). Normalmente, plazos menores deberían tener cuotas mayores.`
        )
      }
    }

    return {
      valido: true, // Warnings no invalidan el plazo
      warnings
    }
  }

  /**
   * Valida que no haya plazos duplicados
   * @param {Object} plazo - Plazo a validar
   * @param {Array} otrosPlazos - Array de otros plazos
   * @param {number} excluirIndice - Índice a excluir de la validación (para edición)
   * @returns {Object} { valido: boolean, error?: string }
   */
  static validarDuplicados(plazo, otrosPlazos, excluirIndice = null) {
    if (!otrosPlazos || otrosPlazos.length === 0) {
      return { valido: true }
    }

    const duplicado = otrosPlazos.find((p, i) => 
      i !== excluirIndice && 
      p.plazo_meses === plazo.plazo_meses &&
      p.activo !== false
    )

    if (duplicado) {
      return {
        valido: false,
        error: `Ya existe un plazo de ${plazo.plazo_meses} meses en este plan`
      }
    }

    return { valido: true }
  }

  /**
   * Valida que un plazo tenga todos los datos requeridos
   * @param {Object} plazo - Plazo a validar
   * @returns {Object} { valido: boolean, errores: string[] }
   */
  static validarDatosPlazo(plazo) {
    const errores = []

    if (!plazo.plazo_meses || plazo.plazo_meses < 1 || plazo.plazo_meses > 60) {
      errores.push('El plazo debe estar entre 1 y 60 meses')
    }

    if (!plazo.tipo_pago_inicial || !['MONTO', 'PORCENTAJE'].includes(plazo.tipo_pago_inicial)) {
      errores.push('El tipo de pago inicial debe ser MONTO o PORCENTAJE')
    }

    if (!plazo.pago_inicial_valor || plazo.pago_inicial_valor <= 0) {
      errores.push('El valor del pago inicial debe ser mayor a 0')
    }

    if (plazo.tipo_pago_inicial === 'PORCENTAJE' && plazo.pago_inicial_valor > 100) {
      errores.push('El porcentaje de pago inicial no puede ser mayor a 100%')
    }

    if (!plazo.cuota_mensual || plazo.cuota_mensual <= 0) {
      errores.push('La cuota mensual debe ser mayor a 0')
    }

    // Validar según tipo de plan
    const tipoPlan = plazo.tipo_plan || this.determinarTipoPlan(plazo.plazo_meses)

    if (tipoPlan === 'COMERCIAL') {
      // Para planes comerciales, no se requiere tasa
      // Pero sí se requiere recargo si viene de política
      if (plazo.recargo_tipo && !plazo.recargo_valor) {
        errores.push('Si se especifica tipo de recargo, debe proporcionarse el valor')
      }
    } else {
      // Para planes financieros, se requiere tasa calculada
      if (!plazo.tasa_anual_calculada && !plazo.tasa_mensual_calculada) {
        errores.push('Debe calcular la tasa antes de guardar (planes financieros)')
      }
    }

    return {
      valido: errores.length === 0,
      errores
    }
  }

  /**
   * Obtiene la política de financiamiento aplicable para un plazo
   * @param {number} plazoMeses - Plazo en meses
   * @param {number} empresaId - ID de la empresa (opcional)
   * @param {Object} dbConnection - Conexión a la base de datos
   * @returns {Promise<Object|null>} Política aplicable o null
   */
  static async obtenerPolitica(plazoMeses, empresaId = null, dbConnection = null) {
    if (!dbConnection) {
      // Si no hay conexión, retornar política por defecto basada en plazo
      return {
        tipo_calculo: this.determinarTipoPlan(plazoMeses),
        plazo_min: plazoMeses,
        plazo_max: plazoMeses
      }
    }

    try {
      // Buscar política específica de la empresa primero
      let query = `
        SELECT * FROM politica_financiamiento 
        WHERE activo = 1 
          AND ? BETWEEN plazo_min AND plazo_max
          AND (empresa_id = ? OR empresa_id IS NULL)
        ORDER BY empresa_id DESC, id ASC
        LIMIT 1
      `
      
      const [politicas] = await dbConnection.execute(query, [plazoMeses, empresaId])
      
      if (politicas.length > 0) {
        return politicas[0]
      }

      // Si no hay política, retornar por defecto
      return {
        tipo_calculo: this.determinarTipoPlan(plazoMeses),
        plazo_min: plazoMeses,
        plazo_max: plazoMeses
      }
    } catch (error) {
      console.error('Error al obtener política:', error)
      // En caso de error, retornar política por defecto
      return {
        tipo_calculo: this.determinarTipoPlan(plazoMeses),
        plazo_min: plazoMeses,
        plazo_max: plazoMeses
      }
    }
  }
}

