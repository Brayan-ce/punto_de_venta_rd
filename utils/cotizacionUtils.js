import { formatCurrency } from './monedaUtils'

/**
 * Utilidades para el módulo de Cotizaciones
 */

/**
 * Genera el siguiente número de cotización basado en el prefijo y número actual
 * @param {string} prefijo 
 * @param {number|string} numeroActual 
 * @returns {string}
 */
export function formatearNumeroCotizacion(prefijo, numeroActual) {
    const numero = parseInt(numeroActual);
    return `${prefijo}-${numero.toString().padStart(6, '0')}`;
}

/**
 * Formatea un valor como moneda
 * @param {number} valor - Valor a formatear
 * @param {Object} options
 * @param {string} options.currency
 * @param {string} options.locale
 * @param {string} options.symbol
 * @returns {string} Valor formateado
 */
export function formatearMoneda(valor, options = {}) {
    const {
        currency = 'DOP',
        locale = 'es-DO',
        symbol
    } = options

    return formatCurrency(valor || 0, { currency, locale, symbol })
}

/**
 * Calcula los totales de una cotización
 * @param {Array} productos 
 * @returns {Object}
 */
export function calcularTotalesCotizacion(productos) {
    let subtotal = 0;
    let montoGravado = 0;
    let itbis = 0;

    productos.forEach(p => {
        const cant = parseFloat(p.cantidad) || 0;
        const precio = parseFloat(p.precio_unitario) || 0;
        const lineSubtotal = cant * precio;

        subtotal += lineSubtotal;

        if (p.aplica_itbis) {
            const lineItbis = lineSubtotal * 0.18; // ITBIS 18% por defecto
            montoGravado += lineSubtotal;
            itbis += lineItbis;
        }
    });

    const total = subtotal + itbis;

    return {
        subtotal,
        monto_gravado: montoGravado,
        itbis,
        total
    };
}
