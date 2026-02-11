/**
 * Constantes, validaciones y utilidades específicas del módulo de Bitácora
 * 
 * Este archivo centraliza toda la lógica de dominio relacionada con bitácoras diarias.
 */

/**
 * Tipos de destino para bitácoras
 */
export const TIPOS_DESTINO = {
  OBRA: 'obra',
  SERVICIO: 'servicio',
}

/**
 * Condiciones climáticas
 */
export const CONDICIONES_CLIMA = {
  SOLEADO: 'soleado',
  NUBLADO: 'nublado',
  LLUVIOSO: 'lluvioso',
  TORMENTA: 'tormenta',
}

/**
 * Actividades comunes en construcción
 * Lista predefinida para agilizar el registro
 */
export const ACTIVIDADES_COMUNES = [
  'Instalación eléctrica',
  'Mezcla de cemento',
  'Remodelación',
  'Reparación',
  'Plomería',
  'Pintura',
  'Estructura',
  'Excavación',
  'Cimentación',
  'Encofrado',
  'Desencofrado',
  'Instalación de tuberías',
  'Instalación de cableado',
  'Acabados',
  'Limpieza',
]

/**
 * Configuración de fotos
 */
export const CONFIG_FOTOS = {
  MAX_FOTOS: 5,
  MAX_SIZE_MB: 5,
  FORMATOS_PERMITIDOS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}

/**
 * Formatea las condiciones climáticas para mostrar en UI
 * @param {string} clima - Condición climática
 * @returns {Object} { texto: string, emoji: string, color: string }
 */
export function formatearClima(clima) {
  const climas = {
    [CONDICIONES_CLIMA.SOLEADO]: { 
      texto: 'Soleado', 
      emoji: '☀️',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300' 
    },
    [CONDICIONES_CLIMA.NUBLADO]: { 
      texto: 'Nublado', 
      emoji: '☁️',
      color: 'bg-gray-100 text-gray-800 border-gray-300' 
    },
    [CONDICIONES_CLIMA.LLUVIOSO]: { 
      texto: 'Lluvioso', 
      emoji: '🌧️',
      color: 'bg-blue-100 text-blue-800 border-blue-300' 
    },
    [CONDICIONES_CLIMA.TORMENTA]: { 
      texto: 'Tormenta', 
      emoji: '⛈️',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300' 
    },
  }
  
  return climas[clima] || climas[CONDICIONES_CLIMA.SOLEADO]
}

/**
 * Formatea el tipo de destino para mostrar en UI
 * @param {string} tipoDestino - Tipo de destino
 * @returns {Object} { texto: string, emoji: string, color: string }
 */
export function formatearTipoDestino(tipoDestino) {
  const tipos = {
    [TIPOS_DESTINO.OBRA]: {
      texto: 'Obra',
      emoji: '🏗️',
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    [TIPOS_DESTINO.SERVICIO]: {
      texto: 'Servicio',
      emoji: '⚡',
      color: 'bg-purple-100 text-purple-800 border-purple-300'
    },
  }
  
  return tipos[tipoDestino] || tipos[TIPOS_DESTINO.OBRA]
}

/**
 * Valida los datos de una bitácora
 * @param {Object} datos - Datos de la bitácora a validar
 * @returns {Object} { valido: boolean, errores: Object }
 */
export function validarBitacora(datos) {
  const errores = {}
  
  // Validar tipo de destino (polimórfico)
  if (!datos.tipo_destino) {
    errores.tipo_destino = 'Debe seleccionar el tipo de destino (Obra o Servicio)'
  } else if (!Object.values(TIPOS_DESTINO).includes(datos.tipo_destino)) {
    errores.tipo_destino = 'Tipo de destino inválido'
  }
  
  // Validar destino
  if (!datos.destino_id) {
    const textoDestino = datos.tipo_destino === TIPOS_DESTINO.OBRA ? 'una obra' : 'un servicio'
    errores.destino_id = `Debe seleccionar ${textoDestino}`
  }
  
  // Validar fecha
  if (!datos.fecha_bitacora) {
    errores.fecha_bitacora = 'La fecha de la bitácora es obligatoria'
  } else {
    const fechaBitacora = new Date(datos.fecha_bitacora)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    // Validar que la fecha no sea futura
    if (fechaBitacora > hoy) {
      errores.fecha_bitacora = 'No puede registrar una bitácora de fecha futura'
    }
  }
  
  // Validar trabajo realizado (obligatorio)
  if (!datos.trabajo_realizado || datos.trabajo_realizado.trim() === '') {
    errores.trabajo_realizado = 'Debe describir el trabajo realizado'
  } else if (datos.trabajo_realizado.trim().length < 10) {
    errores.trabajo_realizado = 'La descripción debe tener al menos 10 caracteres'
  }
  
  // Validar trabajadores presentes (obligatorio al menos 1)
  if (!datos.trabajadores_presentes || datos.trabajadores_presentes.length === 0) {
    errores.trabajadores = 'Debe seleccionar al menos un trabajador presente'
  }
  
  // Validar zona/sitio (opcional pero con límite)
  if (datos.zona_sitio && datos.zona_sitio.length > 100) {
    errores.zona_sitio = 'La zona/sitio no puede exceder 100 caracteres'
  }
  
  // Validar observaciones (opcional pero con límite)
  if (datos.observaciones && datos.observaciones.length > 1000) {
    errores.observaciones = 'Las observaciones no pueden exceder 1000 caracteres'
  }
  
  // Validar clima (opcional pero debe ser válido si se proporciona)
  if (datos.condiciones_clima && !Object.values(CONDICIONES_CLIMA).includes(datos.condiciones_clima)) {
    errores.condiciones_clima = 'Condición climática inválida'
  }
  
  // Validar fotos (opcional pero con límites)
  if (datos.fotos && Array.isArray(datos.fotos)) {
    if (datos.fotos.length > CONFIG_FOTOS.MAX_FOTOS) {
      errores.fotos = `No puede subir más de ${CONFIG_FOTOS.MAX_FOTOS} fotos`
    }
    
    // Validar cada foto
    datos.fotos.forEach((foto, index) => {
      if (foto.size && foto.size > CONFIG_FOTOS.MAX_SIZE_MB * 1024 * 1024) {
        errores[`foto_${index}`] = `La foto ${index + 1} excede el tamaño máximo de ${CONFIG_FOTOS.MAX_SIZE_MB}MB`
      }
      
      if (foto.type && !CONFIG_FOTOS.FORMATOS_PERMITIDOS.includes(foto.type)) {
        errores[`foto_${index}`] = `La foto ${index + 1} no tiene un formato permitido`
      }
    })
  }
  
  return {
    valido: Object.keys(errores).length === 0,
    errores
  }
}

/**
 * Valida si una bitácora ya existe para una fecha y destino específicos
 * Útil para evitar duplicados antes de insertar
 * @param {Object} datos - { tipo_destino, destino_id, fecha_bitacora }
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export function validarUnicidadBitacora(datos) {
  const { tipo_destino, destino_id, fecha_bitacora } = datos
  
  if (!tipo_destino || !destino_id || !fecha_bitacora) {
    return {
      valido: false,
      mensaje: 'Faltan datos para validar unicidad'
    }
  }
  
  // Esta validación se ejecuta en el servidor contra la BD
  // Esta función solo valida que los datos necesarios estén presentes
  return {
    valido: true,
    mensaje: 'Datos suficientes para validar unicidad'
  }
}

/**
 * Prepara los datos de la bitácora para ser enviados al servidor
 * Limpia y normaliza los datos
 * @param {Object} datos - Datos del formulario
 * @returns {Object} Datos limpios y normalizados
 */
export function prepararDatosBitacora(datos) {
  return {
    tipo_destino: datos.tipo_destino,
    destino_id: parseInt(datos.destino_id),
    fecha_bitacora: datos.fecha_bitacora,
    zona_sitio: datos.zona_sitio ? datos.zona_sitio.trim() : null,
    trabajo_realizado: datos.trabajo_realizado.trim(),
    observaciones: datos.observaciones ? datos.observaciones.trim() : null,
    condiciones_clima: datos.condiciones_clima || null,
    trabajadores_presentes: datos.trabajadores_presentes.map(id => parseInt(id)),
    fotos: datos.fotos || []
  }
}

/**
 * Genera un resumen corto del trabajo realizado
 * Útil para listados y previews
 * @param {string} trabajoRealizado - Texto completo del trabajo
 * @param {number} maxLength - Longitud máxima (default: 150)
 * @returns {string} Resumen truncado
 */
export function generarResumenTrabajo(trabajoRealizado, maxLength = 150) {
  if (!trabajoRealizado) return ''
  
  if (trabajoRealizado.length <= maxLength) {
    return trabajoRealizado
  }
  
  return trabajoRealizado.substring(0, maxLength).trim() + '...'
}

/**
 * Cuenta el número de actividades en una bitácora
 * Asume que las actividades están separadas por viñetas (•) o saltos de línea
 * @param {string} trabajoRealizado - Texto del trabajo realizado
 * @returns {number} Número de actividades
 */
export function contarActividades(trabajoRealizado) {
  if (!trabajoRealizado) return 0
  
  // Contar por viñetas
  const porVinetas = (trabajoRealizado.match(/•/g) || []).length
  if (porVinetas > 0) return porVinetas
  
  // Contar por saltos de línea
  const porLineas = trabajoRealizado.split('\n').filter(linea => linea.trim() !== '').length
  return porLineas
}

/**
 * Extrae palabras clave del trabajo realizado
 * Útil para búsquedas y análisis
 * @param {string} trabajoRealizado - Texto del trabajo realizado
 * @returns {string[]} Array de palabras clave
 */
export function extraerPalabrasClave(trabajoRealizado) {
  if (!trabajoRealizado) return []
  
  const palabrasComunes = ['de', 'la', 'el', 'en', 'y', 'a', 'para', 'con', 'por', 'del', 'al']
  
  const palabras = trabajoRealizado
    .toLowerCase()
    .split(/\s+/)
    .filter(palabra => 
      palabra.length > 3 && 
      !palabrasComunes.includes(palabra)
    )
  
  // Eliminar duplicados y devolver
  return [...new Set(palabras)]
}

