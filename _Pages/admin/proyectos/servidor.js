"use server"

/**
 * Server Actions para Proyectos
 * 
 * Capa de controladores que recibe peticiones del cliente
 * y delega a la capa de servicios.
 * 
 * Responsabilidades:
 * - Validación de sesión
 * - Extracción de parámetros de cookies
 * - Delegación a servicios
 * - Formateo de respuestas
 */

import { cookies } from 'next/headers'
import { ProyectoService } from './services/ProyectoService'

/**
 * Obtiene la sesión del usuario desde cookies
 * @returns {Object|null} { userId, empresaId } o null
 */
async function obtenerSesion() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const empresaId = cookieStore.get('empresaId')?.value
    
    if (!userId || !empresaId) {
      return null
    }
    
    return {
      userId: parseInt(userId),
      empresaId: parseInt(empresaId)
    }
  } catch (error) {
    console.error('Error al obtener sesión:', error)
    return null
  }
}

/**
 * Obtiene proyectos con filtros
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Promise<Object>} Resultado con proyectos
 */
export async function obtenerProyectos(filtros = {}) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.obtenerProyectos(sesion.empresaId, filtros)
}

/**
 * Crea un nuevo proyecto
 * @param {Object} datos - Datos del proyecto
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function crearProyecto(datos) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.crearProyecto(
    datos,
    sesion.empresaId,
    sesion.userId
  )
}

/**
 * Obtiene un proyecto por ID
 * @param {number} id - ID del proyecto
 * @returns {Promise<Object>} Resultado con proyecto
 */
export async function obtenerProyectoPorId(id) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.obtenerProyectoPorId(
    parseInt(id),
    sesion.empresaId
  )
}

/**
 * Actualiza un proyecto
 * @param {number} id - ID del proyecto
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function actualizarProyecto(id, datos) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.actualizarProyecto(
    parseInt(id),
    sesion.empresaId,
    datos
  )
}

/**
 * Cambia el estado de un proyecto
 * @param {number} id - ID del proyecto
 * @param {string} nuevoEstado - Nuevo estado
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function cambiarEstadoProyecto(id, nuevoEstado) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.cambiarEstado(
    parseInt(id),
    sesion.empresaId,
    nuevoEstado
  )
}

/**
 * Elimina un proyecto
 * @param {number} id - ID del proyecto
 * @param {boolean} hardDelete - Si es true, elimina físicamente
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function eliminarProyecto(id, hardDelete = false) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.eliminarProyecto(
    parseInt(id),
    sesion.empresaId,
    hardDelete
  )
}

/**
 * Obtiene estadísticas de proyectos para predicciones
 * @returns {Promise<Object>} Estadísticas (duración promedio, presupuesto promedio, etc.)
 */
export async function obtenerEstadisticasProyectos() {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.obtenerEstadisticasParaPredicciones(sesion.empresaId)
}

/**
 * Obtiene usuarios responsables disponibles
 * @returns {Promise<Object>} Lista de usuarios
 */
export async function obtenerUsuariosResponsables() {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.obtenerUsuariosResponsables(sesion.empresaId)
}

/**
 * Obtiene etiquetas existentes de proyectos
 * @returns {Promise<Object>} Lista de etiquetas únicas
 */
export async function obtenerEtiquetasExistentes() {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.obtenerEtiquetasExistentes(sesion.empresaId)
}

/**
 * Obtiene plantillas de proyectos disponibles
 * @returns {Promise<Object>} Lista de plantillas activas
 */
export async function obtenerPlantillasProyectos() {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida', plantillas: [] }
  }
  
  return await ProyectoService.obtenerPlantillas(sesion.empresaId)
}

/**
 * Obtiene una plantilla por ID
 * @param {number} id - ID de la plantilla
 * @returns {Promise<Object>} Plantilla encontrada
 */
export async function obtenerPlantillaPorId(id) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.obtenerPlantillaPorId(parseInt(id), sesion.empresaId)
}

/**
 * Crea una nueva plantilla
 * @param {Object} datos - Datos de la plantilla
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function crearPlantilla(datos) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.crearPlantilla(
    datos,
    sesion.empresaId,
    sesion.userId
  )
}

/**
 * Actualiza una plantilla existente
 * @param {number} id - ID de la plantilla
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function actualizarPlantilla(id, datos) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.actualizarPlantilla(
    parseInt(id),
    sesion.empresaId,
    datos
  )
}

/**
 * Elimina una plantilla
 * @param {number} id - ID de la plantilla
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function eliminarPlantilla(id) {
  const sesion = await obtenerSesion()
  
  if (!sesion) {
    return { success: false, mensaje: 'Sesión inválida' }
  }
  
  return await ProyectoService.eliminarPlantilla(
    parseInt(id),
    sesion.empresaId
  )
}
