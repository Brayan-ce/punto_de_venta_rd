/**
 * Validaciones para unidades de medida
 * FASE 4: Validaciones y UX
 */

import { validarCantidad } from './unidadesUtilsClient'

/**
 * Valida cantidad para venta
 * @param {string|number} cantidad - Cantidad a validar
 * @param {object} producto - Objeto producto con permite_decimales
 * @returns {Array<string>} Array de errores (vacío si no hay errores)
 */
export function validarCantidadVenta(cantidad, producto) {
    const errores = []
    
    if (!cantidad || cantidad <= 0) {
        errores.push('La cantidad debe ser mayor a 0')
        return errores
    }
    
    if (!validarCantidad(cantidad, producto?.permite_decimales)) {
        if (!producto?.permite_decimales) {
            errores.push('Este producto solo acepta cantidades enteras')
        } else {
            errores.push('Cantidad inválida. Verifique el formato.')
        }
    }
    
    const partes = String(cantidad).split('.')
    if (partes.length > 1 && partes[1].length > 3) {
        errores.push('Máximo 3 decimales permitidos')
    }
    
    return errores
}

/**
 * Valida stock disponible
 * @param {string|number} cantidad - Cantidad solicitada
 * @param {string|number} stockDisponible - Stock disponible
 * @param {boolean} permiteDecimales - Si permite decimales
 * @returns {Array<string>} Array de errores (vacío si no hay errores)
 */
export function validarStock(cantidad, stockDisponible, permiteDecimales) {
    const errores = []
    
    const cantidadNum = parseFloat(cantidad)
    const stockNum = parseFloat(stockDisponible)
    
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
        errores.push('Cantidad inválida')
        return errores
    }
    
    if (isNaN(stockNum)) {
        errores.push('Stock no disponible')
        return errores
    }
    
    if (cantidadNum > stockNum) {
        errores.push(`Stock insuficiente. Disponible: ${formatearCantidad(stockNum, permiteDecimales)}`)
    }
    
    return errores
}

/**
 * Formatea cantidad para mostrar
 * @param {number} cantidad - Cantidad
 * @param {boolean} permiteDecimales - Si permite decimales
 * @returns {string} Cantidad formateada
 */
function formatearCantidad(cantidad, permiteDecimales) {
    if (!permiteDecimales) {
        return Math.floor(cantidad).toString()
    }
    return cantidad.toFixed(3).replace(/\.?0+$/, '')
}

/**
 * Valida conversión entre unidades
 * @param {number} unidadOrigenId - ID unidad origen
 * @param {number} unidadDestinoId - ID unidad destino
 * @returns {Array<string>} Array de errores (vacío si no hay errores)
 */
export function validarConversion(unidadOrigenId, unidadDestinoId) {
    const errores = []
    
    if (!unidadOrigenId || !unidadDestinoId) {
        errores.push('Debe seleccionar unidades de medida válidas')
    }
    
    if (unidadOrigenId === unidadDestinoId) {
        // No es un error, pero no necesita conversión
        return []
    }
    
    return errores
}

