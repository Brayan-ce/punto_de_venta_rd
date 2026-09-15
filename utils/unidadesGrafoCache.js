/**
 * Cache del grafo de conversiones para mejorar performance
 * FASE 7.3: Optimización de Performance
 */

// Cache separado por empresaId para evitar cruce de datos entre empresas
const grafoCacheMap = new Map()  // Map<empresaId, { grafo, timestamp }>
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Obtiene el grafo del cache o lo construye si está expirado
 * @param {object} connection - Conexión a BD
 * @param {number} empresaId - ID de empresa (opcional)
 * @returns {Promise<object>} Grafo de conversiones
 */
export async function obtenerGrafoCache(connection, empresaId = null) {
    const cacheKey = empresaId ?? '__global__'
    const ahora = Date.now()
    
    const cached = grafoCacheMap.get(cacheKey)
    if (cached && (ahora - cached.timestamp) < CACHE_DURATION) {
        return cached.grafo
    }
    
    // Construir nuevo grafo
    const { construirGrafoConversiones } = await import('./unidadesGrafoUtils')
    const grafo = await construirGrafoConversiones(connection, empresaId)
    grafoCacheMap.set(cacheKey, { grafo, timestamp: ahora })
    
    return grafo
}

/**
 * Invalida el cache (útil cuando se agregan/modifican conversiones)
 * @param {number} empresaId - Si se provee, solo invalida esa empresa. Si no, invalida todo.
 */
export function invalidarCache(empresaId = null) {
    if (empresaId !== null) {
        grafoCacheMap.delete(empresaId)
    } else {
        grafoCacheMap.clear()
    }
}

/**
 * Obtiene el timestamp del cache (útil para debugging)
 * @param {number} empresaId - ID de empresa
 * @returns {number|null} Timestamp del cache o null si no existe
 */
export function obtenerTimestampCache(empresaId = null) {
    const cacheKey = empresaId ?? '__global__'
    return grafoCacheMap.get(cacheKey)?.timestamp ?? null
}

