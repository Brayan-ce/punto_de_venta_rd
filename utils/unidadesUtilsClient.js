/**
 * Utilidades de conversión para el cliente (Frontend)
 * FASE 2: Motor de Conversión - Frontend
 */

/**
 * Valida si un número es válido para cantidad
 * @param {string|number} valor - Valor a validar
 * @param {boolean} permiteDecimales - Si permite decimales
 * @returns {boolean} Es válido
 */
export function validarCantidad(valor, permiteDecimales = true) {
    if (!valor && valor !== 0) return false
    
    const num = parseFloat(valor)
    if (isNaN(num) || num <= 0) return false
    
    if (!permiteDecimales && !Number.isInteger(num)) {
        return false
    }
    
    // Máximo 3 decimales
    const partes = String(valor).split('.')
    if (partes.length > 1 && partes[1].length > 3) {
        return false
    }
    
    return true
}

/**
 * Formatea cantidad según permite decimales
 * @param {string|number} valor - Valor a formatear
 * @param {boolean} permiteDecimales - Si permite decimales
 * @returns {string} Valor formateado
 */
export function formatearCantidad(valor, permiteDecimales = true) {
    if (!valor && valor !== 0) return ''
    
    const num = parseFloat(valor)
    if (isNaN(num)) return ''
    
    if (!permiteDecimales) {
        return Math.floor(num).toString()
    }
    
    // Máximo 3 decimales
    return num.toFixed(3).replace(/\.?0+$/, '')
}

/**
 * Calcula precio total en el cliente
 * @param {number} cantidad - Cantidad
 * @param {number} precioUnitario - Precio unitario
 * @returns {number} Total
 */
export function calcularTotal(cantidad, precioUnitario) {
    const total = cantidad * precioUnitario
    return Number(total.toFixed(2))
}

/**
 * Limpia y valida input de cantidad
 * @param {string} valor - Valor del input
 * @param {boolean} permiteDecimales - Si permite decimales
 * @returns {string} Valor limpio
 */
export function limpiarInputCantidad(valor, permiteDecimales = true) {
    // Permitir solo números y punto
    let limpio = valor.replace(/[^0-9.]/g, '')
    
    // Solo un punto
    const partes = limpio.split('.')
    if (partes.length > 2) {
        limpio = partes[0] + '.' + partes.slice(1).join('')
    }
    
    // Máximo 3 decimales
    if (partes.length === 2 && partes[1].length > 3) {
        limpio = partes[0] + '.' + partes[1].substring(0, 3)
    }
    
    // Si no permite decimales, eliminar punto
    if (!permiteDecimales && limpio.includes('.')) {
        limpio = limpio.split('.')[0]
    }
    
    return limpio
}

