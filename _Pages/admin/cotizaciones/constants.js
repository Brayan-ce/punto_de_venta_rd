/**
 * Constantes y configuraciones para cotizaciones
 */

/**
 * Filtros de estado disponibles
 */
export const FILTROS_ESTADO = [
    { label: "Todos", value: "todos", icon: null },
    { label: "Borrador", value: "borrador", icon: "document-outline", clase: "chipBorrador" },
    { label: "Enviada", value: "enviada", icon: "send-outline", clase: "chipEnviada" },
    { label: "Aprobada", value: "aprobada", icon: "checkmark-circle", clase: "chipAprobada" },
    { label: "Vencida", value: "vencida", icon: "time-outline", clase: "chipVencida" },
    { label: "Anulada", value: "anulada", icon: "close-circle", clase: "chipAnulada" },
]

/**
 * Obtiene la clase CSS para un badge de estado
 * @param {string} estado - Estado de la cotización
 * @param {object} estilos - Objeto de estilos CSS modules
 * @returns {string} Clase CSS correspondiente
 */
export function getEstadoBadge(estado, estilos) {
    const clases = {
        borrador: estilos.borrador,
        enviada: estilos.enviada,
        aprobada: estilos.aprobada,
        convertida: estilos.convertida,
        vencida: estilos.vencida,
        anulada: estilos.anulada,
        rechazada: estilos.anulada
    }
    return clases[estado?.toLowerCase()] || estilos.borrador
}

