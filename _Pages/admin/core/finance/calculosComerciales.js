/**
 * Cálculos para Planes Comerciales (Cash / Pago Diferido)
 * 
 * Estos planes NO tienen tasa de interés, solo recargos comerciales.
 * Aplican para plazos cortos (típicamente 1-4 meses).
 * 
 * Características:
 * - No se calcula tasa mensual ni anual
 * - No se usa amortización francesa
 * - Solo se aplica un recargo (fijo o porcentaje)
 * - El precio final es: precio_contado + recargo
 */

/**
 * Calcula un plan comercial (pago diferido con recargo)
 * 
 * @param {number} precioContado - Precio del producto al contado
 * @param {number} pagoInicial - Monto del pago inicial
 * @param {number} plazoMeses - Plazo en meses (típicamente 1-4)
 * @param {string} recargoTipo - 'FIJO' o 'PORCENTAJE'
 * @param {number} recargoValor - Valor del recargo (fijo en RD$ o porcentaje)
 * @returns {Object} Resultado del cálculo comercial
 */
export function calcularPlanComercial(precioContado, pagoInicial, plazoMeses, recargoTipo, recargoValor) {
  // Validaciones básicas
  if (precioContado <= 0 || plazoMeses <= 0) {
    return {
      valido: false,
      error: 'El precio contado y el plazo deben ser mayores a 0'
    }
  }

  if (pagoInicial < 0 || pagoInicial >= precioContado) {
    return {
      valido: false,
      error: 'El pago inicial debe ser mayor o igual a 0 y menor al precio contado'
    }
  }

  if (!recargoTipo || !['FIJO', 'PORCENTAJE'].includes(recargoTipo)) {
    return {
      valido: false,
      error: 'El tipo de recargo debe ser FIJO o PORCENTAJE'
    }
  }

  if (!recargoValor || recargoValor <= 0) {
    return {
      valido: false,
      error: 'El valor del recargo debe ser mayor a 0'
    }
  }

  // Calcular recargo
  let recargo = 0
  if (recargoTipo === 'FIJO') {
    recargo = recargoValor
  } else if (recargoTipo === 'PORCENTAJE') {
    recargo = precioContado * (recargoValor / 100)
  }

  // Calcular precio financiado
  const precioFinanciado = precioContado + recargo

  // Calcular monto financiado (lo que se paga en cuotas)
  const montoFinanciado = precioFinanciado - pagoInicial

  // Calcular cuota mensual (simple división)
  const cuotaMensual = montoFinanciado / plazoMeses

  // Calcular total a pagar
  const totalPagado = pagoInicial + (cuotaMensual * plazoMeses)

  // Calcular porcentaje inicial
  const porcentajeInicial = precioFinanciado > 0 
    ? (pagoInicial / precioFinanciado) * 100 
    : 0

  return {
    valido: true,
    tipoPlan: 'COMERCIAL',
    precioContado: Math.round(precioContado * 100) / 100,
    pagoInicial: Math.round(pagoInicial * 100) / 100,
    recargo: Math.round(recargo * 100) / 100,
    precioFinanciado: Math.round(precioFinanciado * 100) / 100,
    montoFinanciado: Math.round(montoFinanciado * 100) / 100,
    cuotaMensual: Math.round(cuotaMensual * 100) / 100,
    plazoMeses,
    totalPagado: Math.round(totalPagado * 100) / 100,
    porcentajeInicial: Math.round(porcentajeInicial * 100) / 100,
    recargoTipo,
    recargoValor,
    // NO incluir tasa (no aplica para planes comerciales)
    tasaMensual: null,
    tasaAnual: null,
    totalIntereses: null,
    mostrarTasa: false,
    mostrarTEA: false
  }
}

/**
 * Calcula un plan comercial cuando NO se conoce el precio contado
 * (caso de creación de planes sin producto específico)
 * 
 * En este caso, el usuario define:
 * - Pago inicial
 * - Cuota mensual
 * - Plazo
 * 
 * Y el sistema calcula:
 * - Precio financiado
 * - Recargo implícito
 * 
 * @param {number} pagoInicial - Monto del pago inicial
 * @param {number} cuotaMensual - Cuota mensual
 * @param {number} plazoMeses - Plazo en meses
 * @param {string} recargoTipo - 'FIJO' o 'PORCENTAJE' (opcional, para mostrar)
 * @param {number} recargoValor - Valor del recargo (opcional, para mostrar)
 * @returns {Object} Resultado del cálculo comercial
 */
export function calcularPlanComercialInverso(pagoInicial, cuotaMensual, plazoMeses, recargoTipo = null, recargoValor = null) {
  // Validaciones básicas
  if (pagoInicial < 0 || cuotaMensual <= 0 || plazoMeses <= 0) {
    return {
      valido: false,
      error: 'Parámetros inválidos'
    }
  }

  // Calcular total de cuotas
  const totalCuotas = cuotaMensual * plazoMeses

  // Calcular precio financiado
  const precioFinanciado = pagoInicial + totalCuotas

  // Calcular monto financiado
  const montoFinanciado = totalCuotas

  // Calcular porcentaje inicial
  const porcentajeInicial = precioFinanciado > 0 
    ? (pagoInicial / precioFinanciado) * 100 
    : 0

  // Si se proporciona recargo, calcular precio contado estimado
  let precioContado = null
  let recargo = null

  if (recargoTipo && recargoValor) {
    if (recargoTipo === 'FIJO') {
      recargo = recargoValor
      precioContado = precioFinanciado - recargo
    } else if (recargoTipo === 'PORCENTAJE') {
      precioContado = precioFinanciado / (1 + recargoValor / 100)
      recargo = precioFinanciado - precioContado
    }
  }

  return {
    valido: true,
    tipoPlan: 'COMERCIAL',
    precioContado: precioContado ? Math.round(precioContado * 100) / 100 : null,
    pagoInicial: Math.round(pagoInicial * 100) / 100,
    recargo: recargo ? Math.round(recargo * 100) / 100 : null,
    precioFinanciado: Math.round(precioFinanciado * 100) / 100,
    montoFinanciado: Math.round(montoFinanciado * 100) / 100,
    cuotaMensual: Math.round(cuotaMensual * 100) / 100,
    plazoMeses,
    totalPagado: Math.round(precioFinanciado * 100) / 100,
    porcentajeInicial: Math.round(porcentajeInicial * 100) / 100,
    recargoTipo,
    recargoValor,
    // NO incluir tasa
    tasaMensual: null,
    tasaAnual: null,
    totalIntereses: null,
    mostrarTasa: false,
    mostrarTEA: false
  }
}

/**
 * Determina si un plazo corresponde a un plan comercial
 * 
 * @param {number} plazoMeses - Plazo en meses
 * @param {number} limiteComercial - Límite para considerar comercial (default: 4)
 * @returns {boolean}
 */
export function esPlanComercial(plazoMeses, limiteComercial = 4) {
  return plazoMeses <= limiteComercial
}

/**
 * Determina qué métricas mostrar según el tipo de plan y plazo
 * 
 * @param {string} tipoPlan - 'COMERCIAL' o 'FINANCIERO'
 * @param {number} plazoMeses - Plazo en meses
 * @returns {Object} Configuración de visualización
 */
export function configurarVisualizacion(tipoPlan, plazoMeses) {
  if (tipoPlan === 'COMERCIAL') {
    return {
      mostrarTasa: false,
      mostrarTEA: false,
      mostrarIntereses: false,
      mostrarRecargo: true,
      mostrarPrecioFinanciado: true
    }
  }

  // Plan financiero
  if (plazoMeses <= 8) {
    // Plazo corto: mostrar tasa mensual, NO TEA
    return {
      mostrarTasa: true,
      mostrarTEA: false,
      mostrarIntereses: true,
      mostrarRecargo: false,
      mostrarPrecioFinanciado: true
    }
  }

  // Plazo largo: mostrar todo
  return {
    mostrarTasa: true,
    mostrarTEA: true,
    mostrarIntereses: true,
    mostrarRecargo: false,
    mostrarPrecioFinanciado: true
  }
}

