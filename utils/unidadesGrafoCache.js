/**
 * Cache del grafo de conversiones para mejorar performance
 * FASE 7.3: Optimización de Performance
 */

let grafoCache = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Obtiene el grafo del cache o lo construye si está expirado
 * @param {object} connection - Conexión a BD
 * @param {number} empresaId - ID de empresa (opcional)
 * @returns {Promise<object>} Grafo de conversiones
 */
export async function obtenerGrafoCache(connection, empresaId = null) {
    const ahora = Date.now()
    
    // Si el cache existe y no está expirado, retornarlo
    if (grafoCache && cacheTimestamp && (ahora - cacheTimestamp) < CACHE_DURATION) {
        return grafoCache
    }
    
    // Construir nuevo grafo
    const { construirGrafoConversiones } = await import('./unidadesGrafoUtils')
    grafoCache = await construirGrafoConversiones(connection, empresaId)
    cacheTimestamp = ahora
    
    return grafoCache
}

/**
 * Invalida el cache (útil cuando se agregan/modifican conversiones)
 */
export function invalidarCache() {
    grafoCache = null
    cacheTimestamp = null
}

/**
 * Obtiene el timestamp del cache (útil para debugging)
 * @returns {number|null} Timestamp del cache o null si no existe
 */
export function obtenerTimestampCache() {
    return cacheTimestamp
}

