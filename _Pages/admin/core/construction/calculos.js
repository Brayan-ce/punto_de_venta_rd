/**
 * Cálculos compartidos del dominio Construction
 * 
 * Este archivo contiene funciones de cálculo que son compartidas
 * por todos los módulos de construcción.
 */

import { REGLAS_NEGOCIO } from './reglas'

/**
 * Calcula el costo total de una obra sumando todos los componentes
 * @param {Object} obra - Objeto obra con costos
 * @returns {number} Costo total
 */
export function calcularCostoTotalObra(obra) {
  const costoManoObra = obra.costo_mano_obra || 0
  const costoMateriales = obra.costo_materiales || 0
  const costoServicios = obra.costo_servicios || 0
  const costoImprevistos = obra.costo_imprevistos || 0
  
  return costoManoObra + costoMateriales + costoServicios + costoImprevistos
}

/**
 * Calcula el porcentaje ejecutado basado en costo ejecutado y presupuesto
 * @param {number} costoEjecutado - Costo ejecutado hasta la fecha
 * @param {number} presupuesto - Presupuesto aprobado
 * @returns {number} Porcentaje ejecutado (0-100)
 */
export function calcularPorcentajeEjecutado(costoEjecutado, presupuesto) {
  if (!presupuesto || presupuesto === 0) return 0
  return Math.min((costoEjecutado / presupuesto) * 100, 100)
}

/**
 * Calcula los días restantes hasta la fecha de fin estimada
 * @param {string|Date} fechaFinEstimada - Fecha de fin estimada
 * @returns {number} Días restantes (puede ser negativo si ya pasó)
 */
export function calcularDiasRestantes(fechaFinEstimada) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  
  const fin = new Date(fechaFinEstimada)
  fin.setHours(0, 0, 0, 0)
  
  const diff = fin - hoy
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Calcula las horas trabajadas entre dos horas
 * @param {string} horaInicio - Hora de inicio (formato HH:mm)
 * @param {string} horaFin - Hora de fin (formato HH:mm)
 * @returns {number} Horas trabajadas
 */
export function calcularHorasTrabajadas(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) return 0
  
  try {
    const [hInicio, mInicio] = horaInicio.split(':').map(Number)
    const [hFin, mFin] = horaFin.split(':').map(Number)
    
    const inicio = hInicio + mInicio / 60
    const fin = hFin + mFin / 60
    
    let horas = fin - inicio
    
    // Si la hora fin es menor que inicio, asumimos que pasó medianoche
    if (horas < 0) {
      horas = 24 + horas
    }
    
    return Math.max(0, horas)
  } catch (error) {
    console.error('Error al calcular horas trabajadas:', error)
    return 0
  }
}

/**
 * Calcula el costo de un trabajador basado en horas trabajadas y tarifa
 * @param {number} horasTrabajadas - Horas trabajadas
 * @param {number} tarifaPorHora - Tarifa por hora
 * @returns {number} Costo total del trabajador
 */
export function calcularCostoTrabajador(horasTrabajadas, tarifaPorHora) {
  if (!horasTrabajadas || !tarifaPorHora) return 0
  return horasTrabajadas * tarifaPorHora
}

/**
 * Calcula el costo total de mano de obra para una lista de trabajadores
 * @param {Array} trabajadores - Array de trabajadores con horas y tarifa
 * @returns {number} Costo total de mano de obra
 */
export function calcularCostoTotalManoObra(trabajadores) {
  if (!Array.isArray(trabajadores)) return 0
  
  return trabajadores.reduce((total, trabajador) => {
    const horas = trabajador.horas_trabajadas || 0
    const tarifa = trabajador.tarifa_por_hora || 0
    return total + calcularCostoTrabajador(horas, tarifa)
  }, 0)
}

/**
 * Calcula el saldo restante del presupuesto
 * @param {number} presupuesto - Presupuesto aprobado
 * @param {number} costoEjecutado - Costo ejecutado hasta la fecha
 * @returns {number} Saldo restante
 */
export function calcularSaldoPresupuesto(presupuesto, costoEjecutado) {
  return Math.max(0, presupuesto - costoEjecutado)
}

/**
 * Calcula el porcentaje de avance físico basado en días transcurridos
 * @param {string|Date} fechaInicio - Fecha de inicio
 * @param {string|Date} fechaFinEstimada - Fecha de fin estimada
 * @param {string|Date} fechaActual - Fecha actual (opcional, usa hoy si no se proporciona)
 * @returns {number} Porcentaje de avance físico (0-100)
 */
export function calcularPorcentajeAvanceFisico(fechaInicio, fechaFinEstimada, fechaActual = null) {
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFinEstimada)
  const actual = fechaActual ? new Date(fechaActual) : new Date()
  
  const totalDias = (fin - inicio) / (1000 * 60 * 60 * 24)
  const diasTranscurridos = (actual - inicio) / (1000 * 60 * 60 * 24)
  
  if (totalDias <= 0) return 0
  if (diasTranscurridos <= 0) return 0
  if (diasTranscurridos >= totalDias) return 100
  
  return Math.min((diasTranscurridos / totalDias) * 100, 100)
}

