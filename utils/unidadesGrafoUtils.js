/**
 * Sistema de conversión basado en grafos
 * FASE 7.3: Resuelve conversiones indirectas automáticamente
 */

import { convertirCantidad } from './unidadesUtils'

/**
 * Construye el grafo de conversiones desde la BD
 * @param {object} connection - Conexión a BD
 * @param {number} empresaId - ID de empresa (opcional)
 * @returns {Promise<object>} Grafo de conversiones
 */
export async function construirGrafoConversiones(connection, empresaId = null) {
    try {
        let query = `
            SELECT 
                uo.id as origen_id,
                uo.codigo as origen_codigo,
                ud.id as destino_id,
                ud.codigo as destino_codigo,
                c.factor
            FROM conversiones_unidad c
            INNER JOIN unidades_medida uo ON c.unidad_origen_id = uo.id
            INNER JOIN unidades_medida ud ON c.unidad_destino_id = ud.id
            WHERE c.activo = TRUE
        `
        
        const params = []
        if (empresaId) {
            query += ` AND (c.empresa_id = ? OR c.empresa_id IS NULL)`
            params.push(empresaId)
        } else {
            query += ` AND c.empresa_id IS NULL`
        }
        
        const [conversiones] = await connection.execute(query, params)
        
        // Construir grafo como objeto anidado
        // Estructura: { origen_id: { destino_id: factor } }
        const grafo = {}
        
        for (const conv of conversiones) {
            if (!grafo[conv.origen_id]) {
                grafo[conv.origen_id] = {}
            }
            grafo[conv.origen_id][conv.destino_id] = parseFloat(conv.factor)
            
            // Agregar conversión inversa automáticamente
            if (!grafo[conv.destino_id]) {
                grafo[conv.destino_id] = {}
            }
            grafo[conv.destino_id][conv.origen_id] = 1.0 / parseFloat(conv.factor)
        }
        
        return grafo
    } catch (error) {
        console.error('Error al construir grafo:', error)
        return {}
    }
}

/**
 * Busca el camino más corto entre dos nodos usando BFS (Breadth-First Search)
 * @param {object} grafo - Grafo de conversiones
 * @param {number} origenId - ID unidad origen
 * @param {number} destinoId - ID unidad destino
 * @returns {Array|null} Array de IDs del camino o null si no existe
 */
export function buscarCaminoGrafo(grafo, origenId, destinoId) {
    // Si son la misma unidad
    if (origenId === destinoId) {
        return [origenId]
    }
    
    // Si existe conversión directa
    if (grafo[origenId] && grafo[origenId][destinoId]) {
        return [origenId, destinoId]
    }
    
    // BFS para encontrar camino
    const cola = [[origenId]] // Cola de caminos
    const visitados = new Set([origenId])
    
    while (cola.length > 0) {
        const camino = cola.shift()
        const nodoActual = camino[camino.length - 1]
        
        // Explorar vecinos
        if (grafo[nodoActual]) {
            for (const vecinoId of Object.keys(grafo[nodoActual]).map(Number)) {
                if (vecinoId === destinoId) {
                    // ¡Camino encontrado!
                    return [...camino, vecinoId]
                }
                
                if (!visitados.has(vecinoId)) {
                    visitados.add(vecinoId)
                    cola.push([...camino, vecinoId])
                }
            }
        }
    }
    
    return null // No existe camino
}

/**
 * Calcula el factor de conversión total a lo largo de un camino
 * @param {object} grafo - Grafo de conversiones
 * @param {Array} camino - Array de IDs del camino
 * @returns {number} Factor total
 */
export function calcularFactorCamino(grafo, camino) {
    if (camino.length < 2) return 1.0
    
    let factorTotal = 1.0
    
    for (let i = 0; i < camino.length - 1; i++) {
        const origen = camino[i]
        const destino = camino[i + 1]
        
        if (grafo[origen] && grafo[origen][destino]) {
            factorTotal *= grafo[origen][destino]
        } else {
            throw new Error(`No existe conversión entre ${origen} y ${destino}`)
        }
    }
    
    return factorTotal
}

/**
 * Obtiene factor de conversión usando grafo (convierte rutas indirectas)
 * @param {number} unidadOrigenId - ID unidad origen
 * @param {number} unidadDestinoId - ID unidad destino
 * @param {object} connection - Conexión a BD
 * @param {number} empresaId - ID empresa
 * @param {object} grafoCache - Cache del grafo (opcional)
 * @returns {Promise<number|null>} Factor de conversión o null
 */
export async function obtenerFactorConversionGrafo(
    unidadOrigenId, 
    unidadDestinoId, 
    connection, 
    empresaId = null,
    grafoCache = null
) {
    try {
        // Si son la misma unidad
        if (unidadOrigenId === unidadDestinoId) {
            return 1.0
        }
        
        // Construir o usar grafo del cache
        let grafo = grafoCache
        if (!grafo) {
            grafo = await construirGrafoConversiones(connection, empresaId)
        }
        
        // Buscar camino en el grafo
        const camino = buscarCaminoGrafo(grafo, unidadOrigenId, unidadDestinoId)
        
        if (!camino) {
            console.warn(`No existe ruta de conversión entre ${unidadOrigenId} y ${unidadDestinoId}`)
            return null
        }
        
        // Calcular factor total del camino
        const factor = calcularFactorCamino(grafo, camino)
        
        return Number(factor.toFixed(6))
        
    } catch (error) {
        console.error('Error en conversión por grafo:', error)
        return null
    }
}

/**
 * Convierte cantidad usando grafo (soporta rutas indirectas)
 * @param {number} cantidad - Cantidad a convertir
 * @param {number} unidadOrigenId - ID unidad origen
 * @param {number} unidadDestinoId - ID unidad destino
 * @param {object} connection - Conexión a BD
 * @param {number} empresaId - ID empresa
 * @param {object} grafoCache - Cache del grafo (opcional)
 * @returns {Promise<number>} Cantidad convertida
 */
export async function convertirCantidadGrafo(
    cantidad,
    unidadOrigenId,
    unidadDestinoId,
    connection,
    empresaId,
    grafoCache = null
) {
    const factor = await obtenerFactorConversionGrafo(
        unidadOrigenId,
        unidadDestinoId,
        connection,
        empresaId,
        grafoCache
    )
    
    if (!factor) {
        throw new Error(`No se puede convertir entre las unidades especificadas`)
    }
    
    return convertirCantidad(cantidad, factor)
}

