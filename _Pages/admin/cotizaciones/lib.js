/**
 * Helpers y utilidades para cotizaciones
 */

/**
 * Mapeo de estados de cotización
 */
export const ESTADOS_MAP = {
    borrador: "Borrador",
    enviada: "Enviada",
    aprobada: "Aprobada",
    convertida: "Convertida",
    vencida: "Vencida",
    anulada: "Anulada",
    rechazada: "Rechazada"
}

/**
 * Obtiene el texto legible de un estado
 * @param {string} estado - Estado de la cotización
 * @returns {string} Texto del estado
 */
export function obtenerTextoEstado(estado) {
    return ESTADOS_MAP[estado?.toLowerCase()] || estado
}

/**
 * Verifica si una cotización está vencida
 * @param {string|Date} fechaVencimiento - Fecha de vencimiento
 * @returns {boolean} true si está vencida
 */
export function esVencida(fechaVencimiento) {
    if (!fechaVencimiento) return false
    const hoy = new Date()
    const fecha = new Date(fechaVencimiento)
    return fecha < hoy && fecha.toDateString() !== hoy.toDateString()
}

/**
 * Crea un formateador de moneda reutilizable
 * @returns {Intl.NumberFormat} Formateador de moneda
 */
export function crearFormateadorMoneda() {
    return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "DOP"
    })
}

/**
 * Formatea un valor como moneda dominicana
 * @param {number} valor - Valor a formatear
 * @param {Intl.NumberFormat} formateador - Formateador (opcional, se crea uno si no se proporciona)
 * @returns {string} Valor formateado
 */
export function formatearMoneda(valor, formateador = null) {
    const formatter = formateador || crearFormateadorMoneda()
    return formatter.format(valor || 0)
}

/**
 * Verifica si una cotización puede ser editada
 * @param {string} estado - Estado de la cotización
 * @returns {boolean} true si puede ser editada
 */
export function puedeEditar(estado) {
    const estadosNoEditables = ['convertida', 'anulada', 'vencida']
    return !estadosNoEditables.includes(estado?.toLowerCase())
}

/**
 * Verifica si una cotización puede ser convertida a venta
 * @param {string} estado - Estado de la cotización
 * @returns {boolean} true si puede ser convertida
 */
export function puedeConvertir(estado) {
    return estado?.toLowerCase() === 'aprobada'
}

