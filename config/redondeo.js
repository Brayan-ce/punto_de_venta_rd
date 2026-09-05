/**
 * Configuración global de redondeo
 * FASE 7.4: Política de Redondeo Explícita
 */

export const ROUNDING_MODES = {
    HALF_UP: 'HALF_UP',      // Redondeo comercial (0.5 → 1)
    HALF_DOWN: 'HALF_DOWN',  // Redondeo hacia abajo (0.5 → 0)
    CEIL: 'CEIL',            // Siempre hacia arriba
    FLOOR: 'FLOOR',          // Siempre hacia abajo
    TRUNCATE: 'TRUNCATE'     // Truncar (cortar decimales)
}

export const ROUNDING_CONFIG = {
    // Modo de redondeo por defecto
    MODO: ROUNDING_MODES.HALF_UP,
    
    // Precisión por tipo de dato
    PRECISION: {
        CANTIDAD: 3,      // 3 decimales para cantidades
        PRECIO: 2,        // 2 decimales para precios
        FACTOR: 6,        // 6 decimales para factores de conversión
        PORCENTAJE: 2     // 2 decimales para porcentajes
    }
}

/**
 * Redondea un número según la política configurada
 * @param {number} valor - Valor a redondear
 * @param {number} decimales - Número de decimales
 * @param {string} modo - Modo de redondeo
 * @returns {number} Valor redondeado
 */
export function redondear(valor, decimales = 2, modo = ROUNDING_CONFIG.MODO) {
    if (isNaN(valor) || valor === null || valor === undefined) {
        return 0
    }
    
    const factor = Math.pow(10, decimales)
    
    switch(modo) {
        case ROUNDING_MODES.HALF_UP:
            return Math.round(valor * factor) / factor
            
        case ROUNDING_MODES.HALF_DOWN:
            const valorAbs = Math.abs(valor)
            const signo = valor < 0 ? -1 : 1
            const redondeado = Math.floor(valorAbs * factor + 0.4) / factor
            return redondeado * signo
            
        case ROUNDING_MODES.CEIL:
            return Math.ceil(valor * factor) / factor
            
        case ROUNDING_MODES.FLOOR:
            return Math.floor(valor * factor) / factor
            
        case ROUNDING_MODES.TRUNCATE:
            return Math.trunc(valor * factor) / factor
            
        default:
            return Math.round(valor * factor) / factor
    }
}

/**
 * Redondea cantidad según política
 * @param {number} cantidad - Cantidad a redondear
 * @returns {number} Cantidad redondeada
 */
export function redondearCantidad(cantidad) {
    return redondear(cantidad, ROUNDING_CONFIG.PRECISION.CANTIDAD)
}

/**
 * Redondea precio según política
 * @param {number} precio - Precio a redondear
 * @returns {number} Precio redondeado
 */
export function redondearPrecio(precio) {
    return redondear(precio, ROUNDING_CONFIG.PRECISION.PRECIO)
}

/**
 * Redondea factor de conversión según política
 * @param {number} factor - Factor a redondear
 * @returns {number} Factor redondeado
 */
export function redondearFactor(factor) {
    return redondear(factor, ROUNDING_CONFIG.PRECISION.FACTOR)
}

