/**
 * Utilidades para el módulo de Conduces
 */

/**
 * Genera el siguiente número de conduce basado en el prefijo y número actual
 * @param {string} prefijo 
 * @param {number|string} numeroActual 
 * @returns {string}
 */
export function formatearNumeroConduce(prefijo, numeroActual) {
    const numero = parseInt(numeroActual);
    return `${prefijo}-${numero.toString().padStart(6, '0')}`;
}

/**
 * Valida si la cantidad a despachar es válida
 * @param {number} cantidadADespachar 
 * @param {number} cantidadPendiente 
 * @returns {boolean}
 */
export function validarCantidadDespacho(cantidadADespachar, cantidadPendiente) {
    const cant = parseFloat(cantidadADespachar);
    const pend = parseFloat(cantidadPendiente);

    if (isNaN(cant) || cant <= 0) return false;
    if (cant > pend) return false;

    return true;
}
