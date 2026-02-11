/**
 * Reglas de negocio compartidas del dominio Financiamiento
 * 
 * Este archivo contiene las reglas de negocio centrales que aplican
 * a todos los módulos de financiamiento. No contiene lógica de UI ni DB,
 * solo reglas puras de negocio.
 */

/**
 * Constantes de reglas de negocio
 */
export const REGLAS_NEGOCIO = {
  // Tasas de interés
  TASA_INTERES_MINIMA: 0,
  TASA_INTERES_MAXIMA: 100,
  
  // Plazos
  PLAZO_MINIMO_MESES: 1,
  PLAZO_MAXIMO_MESES: 60,
  
  // Pagos iniciales
  PAGO_INICIAL_MINIMO_PCT: 0,
  PAGO_INICIAL_MAXIMO_PCT: 100,
  
  // Mora y penalidades
  TASA_MORA_MINIMA: 0,
  TASA_MORA_MAXIMA: 100,
  DIAS_GRACIA_MINIMOS: 0,
  DIAS_GRACIA_MAXIMOS: 30,
  
  // Montos
  MONTO_MINIMO_FINANCIABLE: 100,
  MONTO_MAXIMO_FINANCIABLE: 10000000,
  
  // Scoring crediticio
  SCORE_MINIMO: 0,
  SCORE_MAXIMO: 100,
  SCORE_CLASIFICACION_A: 90,
  SCORE_CLASIFICACION_B: 75,
  SCORE_CLASIFICACION_C: 50,
  
  // Contratos
  MAX_CONTRATOS_ACTIVOS_POR_CLIENTE: 20,
  
  // Descuentos
  DESCUENTO_PAGO_ANTICIPADO_MINIMO: 0,
  DESCUENTO_PAGO_ANTICIPADO_MAXIMO: 50,
  CUOTAS_MINIMAS_PARA_DESCUENTO: 3,
}

/**
 * Valida una tasa de interés
 * @param {number} tasa - Tasa de interés anual (0-100)
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarTasaInteres(tasa) {
  if (typeof tasa !== 'number' || isNaN(tasa)) {
    return { valido: false, error: 'La tasa de interés debe ser un número válido' }
  }
  
  if (tasa < REGLAS_NEGOCIO.TASA_INTERES_MINIMA) {
    return { valido: false, error: 'La tasa de interés no puede ser negativa' }
  }
  
  if (tasa > REGLAS_NEGOCIO.TASA_INTERES_MAXIMA) {
    return { valido: false, error: `La tasa de interés no puede ser mayor a ${REGLAS_NEGOCIO.TASA_INTERES_MAXIMA}%` }
  }
  
  return { valido: true }
}

/**
 * Valida un plazo en meses
 * @param {number} plazo - Plazo en meses
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarPlazo(plazo) {
  if (typeof plazo !== 'number' || isNaN(plazo)) {
    return { valido: false, error: 'El plazo debe ser un número válido' }
  }
  
  if (plazo < REGLAS_NEGOCIO.PLAZO_MINIMO_MESES) {
    return { valido: false, error: `El plazo mínimo es ${REGLAS_NEGOCIO.PLAZO_MINIMO_MESES} mes` }
  }
  
  if (plazo > REGLAS_NEGOCIO.PLAZO_MAXIMO_MESES) {
    return { valido: false, error: `El plazo máximo es ${REGLAS_NEGOCIO.PLAZO_MAXIMO_MESES} meses` }
  }
  
  if (!Number.isInteger(plazo)) {
    return { valido: false, error: 'El plazo debe ser un número entero de meses' }
  }
  
  return { valido: true }
}

/**
 * Valida un porcentaje de pago inicial
 * @param {number} porcentaje - Porcentaje de pago inicial (0-100)
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarPagoInicialPct(porcentaje) {
  if (typeof porcentaje !== 'number' || isNaN(porcentaje)) {
    return { valido: false, error: 'El porcentaje de pago inicial debe ser un número válido' }
  }
  
  if (porcentaje < REGLAS_NEGOCIO.PAGO_INICIAL_MINIMO_PCT) {
    return { valido: false, error: `El porcentaje de pago inicial no puede ser menor a ${REGLAS_NEGOCIO.PAGO_INICIAL_MINIMO_PCT}%` }
  }
  
  if (porcentaje > REGLAS_NEGOCIO.PAGO_INICIAL_MAXIMO_PCT) {
    return { valido: false, error: `El porcentaje de pago inicial no puede ser mayor a ${REGLAS_NEGOCIO.PAGO_INICIAL_MAXIMO_PCT}%` }
  }
  
  return { valido: true }
}

/**
 * Valida una tasa de mora
 * @param {number} tasaMora - Tasa de mora mensual (0-100)
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarTasaMora(tasaMora) {
  if (typeof tasaMora !== 'number' || isNaN(tasaMora)) {
    return { valido: false, error: 'La tasa de mora debe ser un número válido' }
  }
  
  if (tasaMora < REGLAS_NEGOCIO.TASA_MORA_MINIMA) {
    return { valido: false, error: 'La tasa de mora no puede ser negativa' }
  }
  
  if (tasaMora > REGLAS_NEGOCIO.TASA_MORA_MAXIMA) {
    return { valido: false, error: `La tasa de mora no puede ser mayor a ${REGLAS_NEGOCIO.TASA_MORA_MAXIMA}%` }
  }
  
  return { valido: true }
}

/**
 * Valida días de gracia
 * @param {number} diasGracia - Días de gracia
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarDiasGracia(diasGracia) {
  if (typeof diasGracia !== 'number' || isNaN(diasGracia)) {
    return { valido: false, error: 'Los días de gracia deben ser un número válido' }
  }
  
  if (diasGracia < REGLAS_NEGOCIO.DIAS_GRACIA_MINIMOS) {
    return { valido: false, error: `Los días de gracia no pueden ser menores a ${REGLAS_NEGOCIO.DIAS_GRACIA_MINIMOS}` }
  }
  
  if (diasGracia > REGLAS_NEGOCIO.DIAS_GRACIA_MAXIMOS) {
    return { valido: false, error: `Los días de gracia no pueden ser mayores a ${REGLAS_NEGOCIO.DIAS_GRACIA_MAXIMOS}` }
  }
  
  if (!Number.isInteger(diasGracia)) {
    return { valido: false, error: 'Los días de gracia deben ser un número entero' }
  }
  
  return { valido: true }
}

/**
 * Valida un monto financiable
 * @param {number} monto - Monto a financiar
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarMontoFinanciable(monto) {
  if (typeof monto !== 'number' || isNaN(monto)) {
    return { valido: false, error: 'El monto debe ser un número válido' }
  }
  
  if (monto <= 0) {
    return { valido: false, error: 'El monto debe ser mayor a cero' }
  }
  
  if (monto < REGLAS_NEGOCIO.MONTO_MINIMO_FINANCIABLE) {
    return { valido: false, error: `El monto mínimo financiable es ${REGLAS_NEGOCIO.MONTO_MINIMO_FINANCIABLE}` }
  }
  
  if (monto > REGLAS_NEGOCIO.MONTO_MAXIMO_FINANCIABLE) {
    return { valido: false, error: `El monto máximo financiable es ${REGLAS_NEGOCIO.MONTO_MAXIMO_FINANCIABLE}` }
  }
  
  return { valido: true }
}

/**
 * Valida un monto inicial contra un monto total y porcentaje mínimo
 * @param {number} montoTotal - Monto total del producto
 * @param {number} montoInicial - Monto inicial a validar
 * @param {number} porcentajeMinimo - Porcentaje mínimo requerido
 * @returns {Object} { valido: boolean, error?: string, minimoRequerido?: number }
 */
export function validarMontoInicial(montoTotal, montoInicial, porcentajeMinimo) {
  if (typeof montoTotal !== 'number' || isNaN(montoTotal) || montoTotal <= 0) {
    return { valido: false, error: 'El monto total debe ser un número válido mayor a cero' }
  }
  
  if (typeof montoInicial !== 'number' || isNaN(montoInicial)) {
    return { valido: false, error: 'El monto inicial debe ser un número válido' }
  }
  
  if (montoInicial < 0) {
    return { valido: false, error: 'El monto inicial no puede ser negativo' }
  }
  
  if (montoInicial > montoTotal) {
    return { valido: false, error: 'El monto inicial no puede ser mayor al monto total' }
  }
  
  const minimoRequerido = (montoTotal * porcentajeMinimo) / 100
  const porcentajeActual = (montoInicial / montoTotal) * 100
  
  if (montoInicial < minimoRequerido) {
    return {
      valido: false,
      error: `El pago inicial mínimo es ${minimoRequerido.toFixed(2)} (${porcentajeMinimo}%)`,
      minimoRequerido
    }
  }
  
  return { valido: true, minimoRequerido }
}

/**
 * Valida un plan de financiamiento completo
 * @param {Object} plan - Plan a validar
 * @param {number} monto - Monto a financiar
 * @param {number} inicial - Monto inicial
 * @returns {Object} { valido: boolean, errores: string[] }
 */
export function validarPlanFinanciamiento(plan, monto, inicial) {
  const errores = []
  
  // Validar monto mínimo
  if (plan.monto_minimo && monto < plan.monto_minimo) {
    errores.push(`El monto mínimo financiable es ${plan.monto_minimo}`)
  }
  
  // Validar monto máximo
  if (plan.monto_maximo && monto > plan.monto_maximo) {
    errores.push(`El monto máximo financiable es ${plan.monto_maximo}`)
  }
  
  // Validar pago inicial mínimo
  const validacionInicial = validarMontoInicial(monto, inicial, plan.pago_inicial_minimo_pct || 0)
  if (!validacionInicial.valido) {
    errores.push(validacionInicial.error)
  }
  
  return {
    valido: errores.length === 0,
    errores
  }
}

/**
 * Valida un score crediticio
 * @param {number} score - Score crediticio (0-100)
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarScoreCrediticio(score) {
  if (typeof score !== 'number' || isNaN(score)) {
    return { valido: false, error: 'El score crediticio debe ser un número válido' }
  }
  
  if (score < REGLAS_NEGOCIO.SCORE_MINIMO) {
    return { valido: false, error: `El score no puede ser menor a ${REGLAS_NEGOCIO.SCORE_MINIMO}` }
  }
  
  if (score > REGLAS_NEGOCIO.SCORE_MAXIMO) {
    return { valido: false, error: `El score no puede ser mayor a ${REGLAS_NEGOCIO.SCORE_MAXIMO}` }
  }
  
  return { valido: true }
}

