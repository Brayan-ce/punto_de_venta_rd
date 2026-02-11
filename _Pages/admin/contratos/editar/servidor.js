"use server"

import { 
    obtenerContratoPorId, 
    actualizarContratoFinanciamiento,
    actualizarPlanContrato,
    actualizarMontosContrato,
    actualizarFiadorContrato
} from '../servidor.js'
import { obtenerPlanesFinanciamiento } from '../../planes/servidor.js'

// Re-exportar funciones desde el servidor principal
export { 
    obtenerContratoPorId, 
    actualizarContratoFinanciamiento,
    actualizarPlanContrato,
    actualizarMontosContrato,
    actualizarFiadorContrato
}

/**
 * Obtiene los planes de financiamiento activos
 * @returns {Object} { success: boolean, planes?: Array, mensaje?: string }
 */
export async function obtenerPlanesActivos() {
    try {
        const resultado = await obtenerPlanesFinanciamiento({ activo: true })
        return resultado
    } catch (error) {
        console.error('Error al obtener planes activos:', error)
        return { success: false, mensaje: 'Error al cargar planes', planes: [] }
    }
}
