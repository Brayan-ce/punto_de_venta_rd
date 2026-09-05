/**
 * Estados y constantes del dominio Financiamiento
 * 
 * Este archivo centraliza todos los estados, constantes y funciones
 * de formateo relacionadas con estados del sistema de financiamiento.
 */

/**
 * Estados de contrato de financiamiento
 */
export const ESTADOS_CONTRATO = {
  ACTIVO: 'activo',
  PAGADO: 'pagado',
  INCUMPLIDO: 'incumplido',
  REESTRUCTURADO: 'reestructurado',
  CANCELADO: 'cancelado',
}

/**
 * Estados de cuota de financiamiento
 */
export const ESTADOS_CUOTA = {
  PENDIENTE: 'pendiente',
  PAGADA: 'pagada',
  PARCIAL: 'parcial',
  VENCIDA: 'vencida',
  CONDONADA: 'condonada',
}

/**
 * Estados de pago
 */
export const ESTADOS_PAGO = {
  REGISTRADO: 'registrado',
  CONFIRMADO: 'confirmado',
  REVERTIDO: 'revertido',
  RECHAZADO: 'rechazado',
}

/**
 * Severidad de alertas
 */
export const SEVERIDAD_ALERTA = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
  CRITICA: 'critica',
}

/**
 * Métodos de pago disponibles
 */
export const METODOS_PAGO = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
  TARJETA_DEBITO: 'tarjeta_debito',
  TARJETA_CREDITO: 'tarjeta_credito',
  CHEQUE: 'cheque',
  MIXTO: 'mixto',
}

/**
 * Tipos de alertas de financiamiento
 */
export const TIPOS_ALERTA = {
  VENCE_10_DIAS: 'vence_10_dias',
  VENCE_5_DIAS: 'vence_5_dias',
  VENCE_3_DIAS: 'vence_3_dias',
  VENCE_HOY: 'vence_hoy',
  VENCIDA: 'vencida',
  CLIENTE_ALTO_RIESGO: 'cliente_alto_riesgo',
  LIMITE_EXCEDIDO: 'limite_excedido',
  CLASIFICACION_BAJO: 'clasificacion_bajo',
}

/**
 * Estados de alertas
 */
export const ESTADOS_ALERTA = {
  ACTIVA: 'activa',
  VISTA: 'vista',
  RESUELTA: 'resuelta',
  DESCARTADA: 'descartada',
}

/**
 * Clasificaciones crediticias
 */
export const CLASIFICACION_CREDITO = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
}

/**
 * Formatea el estado del contrato para mostrar en UI
 * @param {string} estado - Estado del contrato
 * @returns {Object} { texto: string, color: string }
 */
export function formatearEstadoContrato(estado) {
  const estados = {
    [ESTADOS_CONTRATO.ACTIVO]: { texto: 'Activo', color: 'success' },
    [ESTADOS_CONTRATO.PAGADO]: { texto: 'Pagado', color: 'info' },
    [ESTADOS_CONTRATO.INCUMPLIDO]: { texto: 'Incumplido', color: 'danger' },
    [ESTADOS_CONTRATO.REESTRUCTURADO]: { texto: 'Reestructurado', color: 'warning' },
    [ESTADOS_CONTRATO.CANCELADO]: { texto: 'Cancelado', color: 'secondary' },
  }
  
  return estados[estado] || estados[ESTADOS_CONTRATO.ACTIVO]
}

/**
 * Formatea el estado de la cuota para mostrar en UI
 * @param {string} estado - Estado de la cuota
 * @returns {Object} { texto: string, color: string }
 */
export function formatearEstadoCuota(estado) {
  const estados = {
    [ESTADOS_CUOTA.PENDIENTE]: { texto: 'Pendiente', color: 'warning' },
    [ESTADOS_CUOTA.PAGADA]: { texto: 'Pagada', color: 'success' },
    [ESTADOS_CUOTA.PARCIAL]: { texto: 'Parcial', color: 'info' },
    [ESTADOS_CUOTA.VENCIDA]: { texto: 'Vencida', color: 'danger' },
    [ESTADOS_CUOTA.CONDONADA]: { texto: 'Condonada', color: 'secondary' },
  }
  
  return estados[estado] || estados[ESTADOS_CUOTA.PENDIENTE]
}

/**
 * Formatea el estado del pago para mostrar en UI
 * @param {string} estado - Estado del pago
 * @returns {Object} { texto: string, color: string }
 */
export function formatearEstadoPago(estado) {
  const estados = {
    [ESTADOS_PAGO.REGISTRADO]: { texto: 'Registrado', color: 'info' },
    [ESTADOS_PAGO.CONFIRMADO]: { texto: 'Confirmado', color: 'success' },
    [ESTADOS_PAGO.REVERTIDO]: { texto: 'Revertido', color: 'warning' },
    [ESTADOS_PAGO.RECHAZADO]: { texto: 'Rechazado', color: 'danger' },
  }
  
  return estados[estado] || estados[ESTADOS_PAGO.REGISTRADO]
}

/**
 * Obtiene el color según la severidad de la alerta
 * @param {string} severidad - Severidad de la alerta
 * @returns {string} Clase CSS de color (Bootstrap)
 */
export function obtenerColorSeveridad(severidad) {
  const colores = {
    [SEVERIDAD_ALERTA.CRITICA]: 'danger',
    [SEVERIDAD_ALERTA.ALTA]: 'warning',
    [SEVERIDAD_ALERTA.MEDIA]: 'info',
    [SEVERIDAD_ALERTA.BAJA]: 'secondary',
  }
  
  return colores[severidad] || 'secondary'
}

/**
 * Formatea el método de pago para mostrar en UI
 * @param {string} metodo - Método de pago
 * @returns {string} Texto formateado
 */
export function formatearMetodoPago(metodo) {
  const metodos = {
    [METODOS_PAGO.EFECTIVO]: 'Efectivo',
    [METODOS_PAGO.TRANSFERENCIA]: 'Transferencia',
    [METODOS_PAGO.TARJETA_DEBITO]: 'Tarjeta Débito',
    [METODOS_PAGO.TARJETA_CREDITO]: 'Tarjeta Crédito',
    [METODOS_PAGO.CHEQUE]: 'Cheque',
    [METODOS_PAGO.MIXTO]: 'Mixto',
  }
  
  return metodos[metodo] || metodo
}

/**
 * Formatea la clasificación crediticia para mostrar en UI
 * @param {string} clasificacion - Clasificación (A, B, C, D)
 * @returns {Object} { texto: string, color: string, descripcion: string }
 */
export function formatearClasificacionCredito(clasificacion) {
  const clasificaciones = {
    [CLASIFICACION_CREDITO.A]: {
      texto: 'A - Excelente',
      color: 'success',
      descripcion: 'Cliente con excelente historial crediticio'
    },
    [CLASIFICACION_CREDITO.B]: {
      texto: 'B - Bueno',
      color: 'info',
      descripcion: 'Cliente con buen historial crediticio'
    },
    [CLASIFICACION_CREDITO.C]: {
      texto: 'C - Regular',
      color: 'warning',
      descripcion: 'Cliente con historial crediticio regular'
    },
    [CLASIFICACION_CREDITO.D]: {
      texto: 'D - Moroso',
      color: 'danger',
      descripcion: 'Cliente con historial crediticio deficiente'
    },
  }
  
  return clasificaciones[clasificacion] || clasificaciones[CLASIFICACION_CREDITO.D]
}

/**
 * Determina la clasificación crediticia basada en el score
 * @param {number} score - Score crediticio (0-100)
 * @returns {string} Clasificación (A, B, C, D)
 */
export function obtenerClasificacionPorScore(score) {
  if (score >= 90) return CLASIFICACION_CREDITO.A
  if (score >= 75) return CLASIFICACION_CREDITO.B
  if (score >= 50) return CLASIFICACION_CREDITO.C
  return CLASIFICACION_CREDITO.D
}

