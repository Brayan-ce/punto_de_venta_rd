/**
 * Utilidades para conversión de unidades de medida (Backend)
 * FASE 2: Motor de Conversión
 */

import { redondearCantidad, redondearPrecio, redondearFactor } from '@/config/redondeo'

/**
 * Convierte una cantidad de una unidad a otra
 * @param {number} cantidad - Cantidad a convertir
 * @param {number} factor - Factor de conversión
 * @param {number} precision - Decimales de precisión (default: 6)
 * @returns {number} Cantidad convertida
 */
export function convertirCantidad(cantidad, factor, precision = 6) {
    if (!cantidad || cantidad <= 0) return 0
    if (!factor || factor <= 0) return cantidad
    
    const resultado = cantidad * factor
    return redondearFactor(resultado)
}

/**
 * Obtiene el factor de conversión entre dos unidades
 * @param {number} unidadOrigenId - ID de unidad origen
 * @param {number} unidadDestinoId - ID de unidad destino
 * @param {number} empresaId - ID de empresa (opcional, para conversiones específicas)
 * @param {object} connection - Conexión a BD
 * @returns {Promise<number|null>} Factor de conversión o null si no existe
 */
export async function obtenerFactorConversion(unidadOrigenId, unidadDestinoId, empresaId = null, connection) {
    try {
        // Si son la misma unidad, factor = 1
        if (unidadOrigenId === unidadDestinoId) {
            return 1.0
        }

        // Buscar conversión directa
        let query = `
            SELECT factor 
            FROM conversiones_unidad 
            WHERE unidad_origen_id = ? 
            AND unidad_destino_id = ?
            AND activo = TRUE
        `
        const params = [unidadOrigenId, unidadDestinoId]

        // Priorizar conversiones específicas de empresa
        if (empresaId) {
            query += ` AND (empresa_id = ? OR empresa_id IS NULL) ORDER BY empresa_id DESC LIMIT 1`
            params.push(empresaId)
        } else {
            query += ` AND empresa_id IS NULL LIMIT 1`
        }

        const [rows] = await connection.execute(query, params)
        
        if (rows.length > 0) {
            return parseFloat(rows[0].factor)
        }

        // Buscar conversión inversa
        query = `
            SELECT (1.0 / factor) as factor 
            FROM conversiones_unidad 
            WHERE unidad_origen_id = ? 
            AND unidad_destino_id = ?
            AND activo = TRUE
        `
        const paramsInverso = [unidadDestinoId, unidadOrigenId]

        if (empresaId) {
            query += ` AND (empresa_id = ? OR empresa_id IS NULL) ORDER BY empresa_id DESC LIMIT 1`
            paramsInverso.push(empresaId)
        } else {
            query += ` AND empresa_id IS NULL LIMIT 1`
        }

        const [rowsInverso] = await connection.execute(query, paramsInverso)
        
        if (rowsInverso.length > 0) {
            return parseFloat(rowsInverso[0].factor)
        }

        return null
    } catch (error) {
        console.error('Error al obtener factor de conversión:', error)
        return null
    }
}

/**
 * Convierte cantidad a unidad base del producto
 * @param {number} cantidad - Cantidad ingresada
 * @param {number} unidadIngresadaId - ID de unidad ingresada
 * @param {number} unidadBaseId - ID de unidad base del producto
 * @param {number} empresaId - ID de empresa
 * @param {object} connection - Conexión a BD
 * @returns {Promise<number>} Cantidad en unidad base
 */
export async function convertirAUndidadBase(cantidad, unidadIngresadaId, unidadBaseId, empresaId, connection) {
    if (unidadIngresadaId === unidadBaseId) {
        return redondearCantidad(cantidad)
    }

    const factor = await obtenerFactorConversion(unidadIngresadaId, unidadBaseId, empresaId, connection)
    
    if (!factor) {
        throw new Error(`No existe conversión entre las unidades especificadas`)
    }

    return redondearCantidad(convertirCantidad(cantidad, factor))
}

/**
 * Calcula el precio total de una venta
 * @param {number} cantidad - Cantidad en unidad base
 * @param {number} precioPorUnidad - Precio por unidad base
 * @returns {number} Precio total
 */
export function calcularPrecioTotal(cantidad, precioPorUnidad) {
    const total = cantidad * precioPorUnidad
    return redondearPrecio(total)
}

