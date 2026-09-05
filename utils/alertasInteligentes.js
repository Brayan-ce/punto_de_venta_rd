/**
 * Alertas inteligentes para prevenir errores comunes
 * FASE 7.6: Inteligencia Mínima
 */

/**
 * Detecta cantidades inusuales comparando con historial
 * @param {number} cantidad - Cantidad a validar
 * @param {object} producto - Objeto producto
 * @param {Array} historialVentas - Array de ventas históricas del producto
 * @returns {Array<object>} Array de alertas
 */
export function detectarCantidadInusual(cantidad, producto, historialVentas = []) {
    const alertas = []
    
    if (!cantidad || cantidad <= 0) return alertas
    
    // Calcular promedio de ventas históricas
    if (historialVentas.length > 0) {
        const promedio = historialVentas.reduce((sum, v) => sum + parseFloat(v.cantidad || 0), 0) / historialVentas.length
        
        if (promedio > 0) {
            const desviacion = Math.abs(cantidad - promedio) / promedio
            
            // Si la cantidad es más del 200% del promedio, alertar
            if (desviacion > 2.0) {
                alertas.push({
                    tipo: 'cantidad_inusual',
                    mensaje: `Esta cantidad (${cantidad}) es ${(desviacion * 100).toFixed(0)}% mayor que el promedio histórico (${promedio.toFixed(2)}). ¿Confirmar?`,
                    severidad: 'media'
                })
            }
        }
    }
    
    // Detectar cantidades muy grandes según tipo de medida
    if (producto?.unidad_medida?.tipo_medida === 'peso' && cantidad > 50) {
        alertas.push({
            tipo: 'cantidad_grande',
            mensaje: `¿Estás seguro de vender ${cantidad} ${producto?.unidad_medida?.abreviatura || ''}? Esta es una cantidad muy grande.`,
            severidad: 'baja'
        })
    }
    
    // Detectar cantidades muy pequeñas (posible error de tipeo)
    if (cantidad > 0 && cantidad < 0.01 && producto?.permite_decimales) {
        alertas.push({
            tipo: 'cantidad_muy_pequena',
            mensaje: `La cantidad ${cantidad} es muy pequeña. ¿Es correcta?`,
            severidad: 'media'
        })
    }
    
    return alertas
}

/**
 * Detecta si el usuario escribió decimal pero el producto no los permite
 * @param {number} cantidad - Cantidad ingresada
 * @param {object} producto - Objeto producto
 * @returns {object|null} Alerta o null
 */
export function detectarDecimalInvalido(cantidad, producto) {
    if (!producto?.permite_decimales && cantidad % 1 !== 0) {
        return {
            tipo: 'decimal_invalido',
            mensaje: `Este producto solo acepta cantidades enteras. Se redondeará a ${Math.round(cantidad)}.`,
            severidad: 'alta'
        }
    }
    return null
}

/**
 * Detecta si hay stock suficiente pero muy bajo
 * @param {number} cantidad - Cantidad solicitada
 * @param {number} stockDisponible - Stock disponible
 * @param {number} stockMinimo - Stock mínimo configurado
 * @returns {object|null} Alerta o null
 */
export function detectarStockBajo(cantidad, stockDisponible, stockMinimo) {
    if (stockDisponible <= stockMinimo && stockDisponible > 0) {
        return {
            tipo: 'stock_bajo',
            mensaje: `Stock bajo: ${stockDisponible}. Después de esta venta quedará ${stockDisponible - cantidad}.`,
            severidad: 'media'
        }
    }
    return null
}

/**
 * Detecta si la cantidad excede el stock máximo
 * @param {number} cantidad - Cantidad solicitada
 * @param {number} stockDisponible - Stock disponible
 * @param {number} stockMaximo - Stock máximo configurado
 * @returns {object|null} Alerta o null
 */
export function detectarExcesoStock(cantidad, stockDisponible, stockMaximo) {
    if (stockDisponible > stockMaximo) {
        return {
            tipo: 'exceso_stock',
            mensaje: `El stock actual (${stockDisponible}) excede el máximo configurado (${stockMaximo}).`,
            severidad: 'baja'
        }
    }
    return null
}

