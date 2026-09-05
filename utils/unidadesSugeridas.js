/**
 * Sugiere unidad de venta según contexto
 * FASE 7.5: Unidad Sugerida Automática
 */

/**
 * Sugiere unidad de venta según tipo de medida y país
 * @param {object} producto - Objeto producto con unidad_medida
 * @param {string} paisId - ID del país (opcional, default: 'DO' para República Dominicana)
 * @returns {number|null} ID de unidad sugerida o null
 */
export function sugerirUnidadVenta(producto, paisId = null) {
    // Si el producto tiene unidad_venta_default, usarla
    if (producto?.unidad_venta_default_id) {
        return producto.unidad_venta_default_id
    }
    
    // Sugerir según tipo de medida y país
    const tipoMedida = producto?.unidad_medida?.tipo_medida
    
    if (tipoMedida === 'peso') {
        // En República Dominicana, sugerir Libra
        if (paisId === 'DO' || !paisId) {
            // Intentar obtener unidad LB del localStorage o usar unidad base
            const unidadRecordada = obtenerUnidadRecordada(producto.id)
            if (unidadRecordada) {
                return unidadRecordada
            }
            // Por defecto, usar unidad base del producto
            return producto?.unidad_medida_id || null
        }
        // En otros países, sugerir Kilo
        return producto?.unidad_medida_id || null
    }
    
    // Para otros tipos, usar unidad base
    return producto?.unidad_medida_id || null
}

/**
 * Recuerda última unidad usada por producto
 * @param {number} productoId - ID del producto
 * @param {number} unidadId - ID de la unidad usada
 */
export function recordarUnidadUsada(productoId, unidadId) {
    if (!productoId || !unidadId) return
    
    try {
        const key = `unidad_venta_${productoId}`
        localStorage.setItem(key, unidadId.toString())
    } catch (error) {
        console.warn('Error al guardar unidad en localStorage:', error)
    }
}

/**
 * Obtiene unidad recordada para un producto
 * @param {number} productoId - ID del producto
 * @returns {number|null} ID de unidad recordada o null
 */
export function obtenerUnidadRecordada(productoId) {
    if (!productoId) return null
    
    try {
        const key = `unidad_venta_${productoId}`
        const unidadId = localStorage.getItem(key)
        return unidadId ? parseInt(unidadId) : null
    } catch (error) {
        console.warn('Error al leer unidad de localStorage:', error)
        return null
    }
}

/**
 * Limpia unidades recordadas (útil para testing o reset)
 */
export function limpiarUnidadesRecordadas() {
    try {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
            if (key.startsWith('unidad_venta_')) {
                localStorage.removeItem(key)
            }
        })
    } catch (error) {
        console.warn('Error al limpiar unidades de localStorage:', error)
    }
}

