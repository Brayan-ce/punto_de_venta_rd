/**
 * Validaciones manuales para Proyectos
 * 
 * Versión sin Zod para compatibilidad con el sistema actual.
 * Se puede migrar a Zod más adelante.
 */

import { ESTADOS_PROYECTO } from '../../core/construction/estados'

/**
 * Valida los datos de creación de un proyecto
 * @param {Object} datos - Datos del proyecto
 * @returns {Object} { valido: boolean, errores: Object }
 */
export function validarCrearProyecto(datos) {
  const errores = {}
  
  // Nombre
  if (!datos.nombre || typeof datos.nombre !== 'string' || datos.nombre.trim() === '') {
    errores.nombre = 'El nombre del proyecto es obligatorio'
  } else if (datos.nombre.length > 255) {
    errores.nombre = 'El nombre no puede exceder 255 caracteres'
  }
  
  // Descripción
  if (datos.descripcion && datos.descripcion.length > 5000) {
    errores.descripcion = 'La descripción no puede exceder 5000 caracteres'
  }
  
  // Fecha de inicio
  if (!datos.fecha_inicio) {
    errores.fecha_inicio = 'La fecha de inicio es obligatoria'
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_inicio)) {
    errores.fecha_inicio = 'La fecha debe estar en formato YYYY-MM-DD'
  }
  
  // Fecha de fin estimada
  if (!datos.fecha_fin_estimada) {
    errores.fecha_fin_estimada = 'La fecha de fin estimada es obligatoria'
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_fin_estimada)) {
    errores.fecha_fin_estimada = 'La fecha debe estar en formato YYYY-MM-DD'
  }
  
  // Validar que fecha_fin > fecha_inicio
  if (datos.fecha_inicio && datos.fecha_fin_estimada) {
    const inicio = new Date(datos.fecha_inicio)
    const fin = new Date(datos.fecha_fin_estimada)
    if (fin <= inicio) {
      errores.fecha_fin_estimada = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
  }
  
  // Presupuesto
  if (datos.presupuesto_total !== undefined && datos.presupuesto_total !== null) {
    const presupuesto = parseFloat(datos.presupuesto_total)
    if (isNaN(presupuesto) || presupuesto < 0) {
      errores.presupuesto_total = 'El presupuesto debe ser un número positivo'
    }
  }
  
  // Cliente ID
  if (datos.cliente_id !== undefined && datos.cliente_id !== null) {
    const clienteId = parseInt(datos.cliente_id)
    if (isNaN(clienteId) || clienteId <= 0) {
      errores.cliente_id = 'El ID del cliente debe ser un número positivo'
    }
  }
  
  // Responsable ID
  if (datos.usuario_responsable_id !== undefined && datos.usuario_responsable_id !== null) {
    const responsableId = parseInt(datos.usuario_responsable_id)
    if (isNaN(responsableId) || responsableId <= 0) {
      errores.usuario_responsable_id = 'El ID del responsable debe ser un número positivo'
    }
  }
  
  // Forma de pago
  if (datos.forma_pago && datos.forma_pago.length > 50) {
    errores.forma_pago = 'La forma de pago no puede exceder 50 caracteres'
  }
  
  // Tags
  if (datos.tags && !Array.isArray(datos.tags)) {
    errores.tags = 'Los tags deben ser un array'
  } else if (datos.tags && datos.tags.some(tag => typeof tag !== 'string' || tag.length > 50)) {
    errores.tags = 'Cada tag debe ser una cadena de máximo 50 caracteres'
  }
  
  // Ubicación
  if (datos.ubicacion && datos.ubicacion.length > 500) {
    errores.ubicacion = 'La ubicación no puede exceder 500 caracteres'
  }
  
  return {
    valido: Object.keys(errores).length === 0,
    errores: errores
  }
}

/**
 * Valida los datos de actualización de un proyecto
 * @param {Object} datos - Datos a actualizar
 * @returns {Object} { valido: boolean, errores: Object }
 */
export function validarActualizarProyecto(datos) {
  const errores = {}
  
  // ID es obligatorio
  if (!datos.id || isNaN(parseInt(datos.id))) {
    errores.id = 'El ID del proyecto es obligatorio'
  }
  
  // Aplicar validaciones de creación para campos presentes
  if (datos.nombre !== undefined) {
    const validacionNombre = validarCrearProyecto({ nombre: datos.nombre })
    if (validacionNombre.errores.nombre) {
      errores.nombre = validacionNombre.errores.nombre
    }
  }
  
  // Validar fechas si ambas están presentes
  if (datos.fecha_inicio || datos.fecha_fin_estimada) {
    const validacionFechas = validarCrearProyecto({
      fecha_inicio: datos.fecha_inicio || '',
      fecha_fin_estimada: datos.fecha_fin_estimada || ''
    })
    if (validacionFechas.errores.fecha_inicio) {
      errores.fecha_inicio = validacionFechas.errores.fecha_inicio
    }
    if (validacionFechas.errores.fecha_fin_estimada) {
      errores.fecha_fin_estimada = validacionFechas.errores.fecha_fin_estimada
    }
  }
  
  // Validar estado si está presente
  if (datos.estado !== undefined) {
    const estadosValidos = Object.values(ESTADOS_PROYECTO)
    if (!estadosValidos.includes(datos.estado)) {
      errores.estado = 'Estado inválido'
    }
  }
  
  // Validar prioridad si está presente
  if (datos.prioridad !== undefined) {
    const prioridadesValidas = ['baja', 'media', 'alta', 'urgente']
    if (!prioridadesValidas.includes(datos.prioridad)) {
      errores.prioridad = 'Prioridad inválida'
    }
  }
  
  return {
    valido: Object.keys(errores).length === 0,
    errores: errores
  }
}

