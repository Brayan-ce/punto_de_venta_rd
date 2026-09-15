/**
 * Helpers y utilidades para cotizaciones
 */

/**
 * Mapeo de estados de cotización
 */
export const ESTADOS_MAP = {
    borrador: { es: "Borrador", en: "Draft" },
    enviada: { es: "Enviada", en: "Sent" },
    aprobada: { es: "Aprobada", en: "Approved" },
    convertida: { es: "Convertida", en: "Converted" },
    vencida: { es: "Vencida", en: "Expired" },
    anulada: { es: "Anulada", en: "Canceled" },
    rechazada: { es: "Rechazada", en: "Rejected" }
}

/**
 * Obtiene el texto legible de un estado
 * @param {string} estado - Estado de la cotización
 * @returns {string} Texto del estado
 */
export function obtenerTextoEstado(estado, language = "es") {
    const estadoInfo = ESTADOS_MAP[estado?.toLowerCase()]
    if (!estadoInfo) return estado
    return language === "en" ? estadoInfo.en : estadoInfo.es
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
export function crearFormateadorMoneda(language = "es", moneda = "DOP", locale = null) {
    const loc = locale || (language === "en" ? "en-US" : "es-DO")
    return new Intl.NumberFormat(loc, {
        style: "currency",
        currency: moneda
    })
}

/**
 * Formatea un valor como moneda dominicana
 * @param {number} valor - Valor a formatear
 * @param {Intl.NumberFormat} formateador - Formateador (opcional, se crea uno si no se proporciona)
 * @returns {string} Valor formateado
 */
export function formatearMoneda(valor, formateador = null, moneda = "DOP", locale = null) {
    const formatter = formateador || crearFormateadorMoneda("es", moneda, locale)
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

