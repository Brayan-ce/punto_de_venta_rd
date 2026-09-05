/**
 * Validaciones compartidas del dominio Construction
 * 
 * Este archivo contiene funciones de validación que son compartidas
 * por todos los módulos de construcción.
 */

import { REGLAS_NEGOCIO } from './reglas'

/**
 * Valida los datos de una obra
 * @param {Object} datos - Datos de la obra a validar
 * @returns {Object} { valido: boolean, errores: Object }
 */
export function validarObra(datos) {
  const errores = {}
  
  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.nombre = 'El nombre de la obra es obligatorio'
  }
  
  if (!datos.ubicacion || datos.ubicacion.trim() === '') {
    errores.ubicacion = 'La ubicación es obligatoria'
  }
  
  if (!datos.presupuesto_aprobado || datos.presupuesto_aprobado <= 0) {
    errores.presupuesto_aprobado = 'El presupuesto debe ser mayor a 0'
  }
  
  if (!datos.fecha_inicio) {
    errores.fecha_inicio = 'La fecha de inicio es obligatoria'
  }
  
  if (!datos.fecha_fin_estimada) {
    errores.fecha_fin_estimada = 'La fecha de fin estimada es obligatoria'
  }
  
  if (datos.fecha_inicio && datos.fecha_fin_estimada) {
    if (new Date(datos.fecha_fin_estimada) <= new Date(datos.fecha_inicio)) {
      errores.fecha_fin_estimada = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
  }
  
  return {
    valido: Object.keys(errores).length === 0,
    errores
  }
}

/**
 * Valida los datos de una bitácora
 * @deprecated Usar validarBitacora de core/construction/bitacora.js
 * Se mantiene por compatibilidad temporal
 * @param {Object} datos - Datos de la bitácora a validar
 * @returns {Object} { valido: boolean, errores: Object }
 */
export function validarBitacora(datos) {
  // Importación dinámica para usar la nueva validación polimórfica
  const { validarBitacora: validarBitacoraPolimorfica } = require('./bitacora')
  return validarBitacoraPolimorfica(datos)
}

/**
 * Valida los datos de un servicio
 * @param {Object} datos - Datos del servicio a validar
 * @returns {Object} { valido: boolean, errores: Object }
 */
export function validarServicio(datos) {
  const errores = {}
  
  // Validar plantilla (requerida según nueva metodología)
  if (!datos.servicio_plantilla_id) {
    errores.servicio_plantilla_id = 'Debe seleccionar una plantilla de servicio'
  }
  
  // Validar fechas
  if (!datos.fecha_inicio) {
    errores.fecha_inicio = 'La fecha de inicio es obligatoria'
  }
  
  if (!datos.fecha_fin_estimada) {
    errores.fecha_fin_estimada = 'La fecha de fin estimada es obligatoria'
  }
  
  if (datos.fecha_inicio && datos.fecha_fin_estimada) {
    if (new Date(datos.fecha_fin_estimada) <= new Date(datos.fecha_inicio)) {
      errores.fecha_fin_estimada = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
  }
  
  // Validar presupuesto asignado si se proporciona
  if (datos.presupuesto_asignado !== undefined && datos.presupuesto_asignado !== null) {
    if (datos.presupuesto_asignado < 0) {
      errores.presupuesto_asignado = 'El presupuesto asignado no puede ser negativo'
    }
  }
  
  return {
    valido: Object.keys(errores).length === 0,
    errores
  }
}

/**
 * Valida los datos de un proyecto
 * @param {Object} datos - Datos del proyecto a validar
 * @returns {Object} { valido: boolean, errores: Object }
 */
export function validarProyecto(datos) {
  const errores = {}
  
  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.nombre = 'El nombre del proyecto es obligatorio'
  }
  
  if (!datos.fecha_inicio) {
    errores.fecha_inicio = 'La fecha de inicio es obligatoria'
  }
  
  if (!datos.fecha_fin_estimada) {
    errores.fecha_fin_estimada = 'La fecha de fin estimada es obligatoria'
  }
  
  if (datos.fecha_inicio && datos.fecha_fin_estimada) {
    if (new Date(datos.fecha_fin_estimada) <= new Date(datos.fecha_inicio)) {
      errores.fecha_fin_estimada = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
  }
  
  return {
    valido: Object.keys(errores).length === 0,
    errores
  }
}

/**
 * Valida los datos de una orden de trabajo
 * @param {Object} datos - Datos de la orden a validar
 * @returns {Object} { valido: boolean, errores: Object }
 */
export function validarOrdenTrabajo(datos) {
  const errores = {}
  
  if (!datos.descripcion || datos.descripcion.trim() === '') {
    errores.descripcion = 'La descripción de la orden es obligatoria'
  }
  
  if (!datos.obra_id && !datos.servicio_id) {
    errores.obra_id = 'Debe seleccionar una obra o servicio'
  }
  
  return {
    valido: Object.keys(errores).length === 0,
    errores
  }
}

