/**
 * Utilidades para el módulo de financiamiento
 * 
 * ⚠️ NOTA DE REFACTORIZACIÓN:
 * Este archivo ahora actúa como wrapper de compatibilidad.
 * Las funciones reales están en _Pages/admin/core/finance/
 * 
 * Este wrapper se mantiene temporalmente para no romper código existente.
 * Se recomienda migrar los imports a usar directamente:
 * - _Pages/admin/core/finance/calculos.js
 * - _Pages/admin/core/finance/estados.js
 * - _Pages/admin/core/finance/reglas.js
 * - _Pages/admin/core/finance/validaciones.js
 */

// Re-exportar funciones de cálculo desde core/finance/calculos.js
export {
    calcularAmortizacionFrancesa,
    calcularMora,
    generarCronograma,
    calcularScoreCrediticio,
    tasaAnualAMensual,
    tasaMensualAAnual,
    calcularDiasAtraso,
    formatearNumeroContrato,
    formatearNumeroRecibo,
    distribuirPago
} from '../_Pages/admin/core/finance/calculos.js'

// Re-exportar funciones de formateo desde core/finance/estados.js
export {
    formatearEstadoContrato,
    formatearEstadoCuota,
    obtenerColorSeveridad
} from '../_Pages/admin/core/finance/estados.js'

// Re-exportar funciones de validación desde core/finance/reglas.js
export {
    validarPlanFinanciamiento,
    validarMontoInicial
} from '../_Pages/admin/core/finance/reglas.js'
