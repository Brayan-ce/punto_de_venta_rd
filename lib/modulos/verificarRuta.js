/**
 * ============================================
 * VERIFICACIÓN DE RUTA (Server Component)
 * ============================================
 * 
 * Función para verificar si una ruta está permitida para una empresa
 * Compatible con Server Components (no Edge Runtime)
 */

import { verificarModuloHabilitado } from './servidor'
import { obtenerModuloPorRuta } from './catalogo'

/**
 * Verificar si una ruta está permitida para una empresa
 * @param {number} empresaId - ID de la empresa
 * @param {string} ruta - Ruta a verificar (ej: '/admin/ventas/nueva')
 * @returns {Promise<boolean>} - true si la ruta está permitida
 */
export async function verificarRutaPermitida(empresaId, ruta) {
    try {
        const modulo = obtenerModuloPorRuta(ruta)
        
        // Si no pertenece a ningún módulo específico, permitir (puede ser ruta pública o core)
        if (!modulo) {
            return true
        }

        // Si el módulo siempre está habilitado, permitir
        if (modulo.siempreHabilitado) {
            return true
        }

        // Verificar si el módulo está habilitado para la empresa
        return await verificarModuloHabilitado(empresaId, modulo.codigo)

    } catch (error) {
        console.error('Error al verificar ruta permitida:', error)
        // En caso de error, denegar acceso por seguridad
        return false
    }
}

