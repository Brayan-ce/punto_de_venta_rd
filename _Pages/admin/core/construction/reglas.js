/**
 * Reglas de negocio compartidas del dominio Construction
 * 
 * Este archivo contiene las reglas de negocio centrales que aplican
 * a todos los módulos de construcción. No contiene lógica de UI ni DB,
 * solo reglas puras de negocio.
 */

/**
 * Constantes de reglas de negocio
 */
export const REGLAS_NEGOCIO = {
  // Presupuesto
  UMBRAL_ALERTA_70: 70,
  UMBRAL_ALERTA_90: 90,
  UMBRAL_ALERTA_100: 100,
  
  // Trabajadores
  MAX_TRABAJADORES_POR_OBRA: 50,
  MIN_TRABAJADORES_POR_OBRA: 1,
  
  // Bitácora
  REQUIERE_BITACORA_DIARIA: true,
  MAX_FOTOS_POR_BITACORA: 10,
  
  // Costos
  COSTO_MINIMO: 0,
  COSTO_MAXIMO: 999999999.99,
  
  // Porcentajes
  PORCENTAJE_MINIMO: 0,
  PORCENTAJE_MAXIMO: 100,
  
  // Fechas
  DIAS_MAXIMOS_PROYECTO: 3650, // 10 años
  DIAS_MINIMOS_PROYECTO: 1,
}

/**
 * Valida un presupuesto
 * @param {number} presupuesto - Presupuesto a validar
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarPresupuesto(presupuesto) {
  if (typeof presupuesto !== 'number' || isNaN(presupuesto)) {
    return { valido: false, error: 'El presupuesto debe ser un número válido' }
  }
  
  if (presupuesto < REGLAS_NEGOCIO.COSTO_MINIMO) {
    return { valido: false, error: 'El presupuesto no puede ser negativo' }
  }
  
  if (presupuesto > REGLAS_NEGOCIO.COSTO_MAXIMO) {
    return { valido: false, error: 'El presupuesto excede el máximo permitido' }
  }
  
  return { valido: true }
}

/**
 * Valida un porcentaje de avance
 * @param {number} porcentaje - Porcentaje de avance (0-100)
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarPorcentajeAvance(porcentaje) {
  if (typeof porcentaje !== 'number' || isNaN(porcentaje)) {
    return { valido: false, error: 'El porcentaje debe ser un número válido' }
  }
  
  if (porcentaje < REGLAS_NEGOCIO.PORCENTAJE_MINIMO) {
    return { valido: false, error: 'El porcentaje no puede ser negativo' }
  }
  
  if (porcentaje > REGLAS_NEGOCIO.PORCENTAJE_MAXIMO) {
    return { valido: false, error: 'El porcentaje no puede ser mayor a 100%' }
  }
  
  return { valido: true }
}

/**
 * Calcula el porcentaje ejecutado basado en costo ejecutado y presupuesto
 * @param {number} costoEjecutado - Costo ejecutado hasta la fecha
 * @param {number} presupuesto - Presupuesto aprobado
 * @returns {number} Porcentaje ejecutado (0-100)
 */
export function calcularPorcentajeEjecutado(costoEjecutado, presupuesto) {
  if (!presupuesto || presupuesto === 0) return 0
  return Math.min((costoEjecutado / presupuesto) * 100, 100)
}

/**
 * Obtiene la severidad de alerta basada en el porcentaje ejecutado
 * @param {number} porcentaje - Porcentaje ejecutado del presupuesto
 * @returns {string} Severidad: 'informativa', 'preventiva', 'critica'
 */
export function obtenerSeveridadAlerta(porcentaje) {
  if (porcentaje >= REGLAS_NEGOCIO.UMBRAL_ALERTA_100) {
    return 'critica'
  }
  if (porcentaje >= REGLAS_NEGOCIO.UMBRAL_ALERTA_90) {
    return 'critica'
  }
  if (porcentaje >= REGLAS_NEGOCIO.UMBRAL_ALERTA_70) {
    return 'preventiva'
  }
  return 'informativa'
}

/**
 * Valida el número de trabajadores
 * @param {number} cantidad - Cantidad de trabajadores
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarCantidadTrabajadores(cantidad) {
  if (typeof cantidad !== 'number' || isNaN(cantidad)) {
    return { valido: false, error: 'La cantidad de trabajadores debe ser un número válido' }
  }
  
  if (cantidad < REGLAS_NEGOCIO.MIN_TRABAJADORES_POR_OBRA) {
    return { valido: false, error: `El mínimo de trabajadores es ${REGLAS_NEGOCIO.MIN_TRABAJADORES_POR_OBRA}` }
  }
  
  if (cantidad > REGLAS_NEGOCIO.MAX_TRABAJADORES_POR_OBRA) {
    return { valido: false, error: `El máximo de trabajadores es ${REGLAS_NEGOCIO.MAX_TRABAJADORES_POR_OBRA}` }
  }
  
  if (!Number.isInteger(cantidad)) {
    return { valido: false, error: 'La cantidad de trabajadores debe ser un número entero' }
  }
  
  return { valido: true }
}

