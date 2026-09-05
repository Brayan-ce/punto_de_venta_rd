/**
 * Utilidades para manejo de stock operativo
 * Implementa el concepto de stock operativo vs stock estratégico
 * 
 * Stock Operativo: Estado de disponibilidad (disponible/bajo/agotado)
 * Stock Estratégico: Cantidades exactas y valores monetarios
 */

/**
 * Calcula el estado operativo del stock (sin números exactos)
 * @param {number} stock - Cantidad actual de stock
 * @param {number} stockMinimo - Stock mínimo del producto
 * @returns {string} - Estado operativo: "disponible" | "bajo" | "agotado"
 */
export function calcularEstadoStockOperativo(stock, stockMinimo = 0) {
    if (stock <= 0) {
        return 'agotado'
    }
    
    // Si el stock está por debajo o igual al mínimo, es "bajo"
    // También consideramos bajo stock si hay 5 unidades o menos (umbral operativo)
    if (stock <= stockMinimo || stock <= 5) {
        return 'bajo'
    }
    
    return 'disponible'
}

/**
 * Obtiene la etiqueta legible del estado de stock
 * @param {string} estado - Estado del stock ("disponible" | "bajo" | "agotado")
 * @returns {string} - Etiqueta legible
 */
export function obtenerEtiquetaStockOperativo(estado) {
    const etiquetas = {
        'disponible': 'Disponible',
        'bajo': 'Últimas unidades',
        'agotado': 'Agotado'
    }
    
    return etiquetas[estado] || 'Desconocido'
}

/**
 * Obtiene el icono correspondiente al estado de stock
 * @param {string} estado - Estado del stock
 * @returns {string} - Nombre del icono de Ionicons
 */
export function obtenerIconoStockOperativo(estado) {
    const iconos = {
        'disponible': 'checkmark-circle-outline',
        'bajo': 'warning-outline',
        'agotado': 'close-circle-outline'
    }
    
    return iconos[estado] || 'help-circle-outline'
}

/**
 * Obtiene la clase CSS correspondiente al estado de stock
 * @param {string} estado - Estado del stock
 * @returns {string} - Clase CSS
 */
export function obtenerClaseStockOperativo(estado) {
    const clases = {
        'disponible': 'stockDisponible',
        'bajo': 'stockBajo',
        'agotado': 'stockAgotado'
    }
    
    return clases[estado] || 'stockDesconocido'
}

