/**
 * Dominio Compartido: Finance
 * 
 * Este módulo centraliza toda la lógica de negocio compartida
 * del sistema de financiamiento. No contiene lógica de UI ni DB,
 * solo reglas puras de negocio, cálculos y validaciones.
 * 
 * Uso recomendado:
 * ```javascript
 * import { calcularAmortizacionFrancesa, REGLAS_NEGOCIO } from '@/Pages/admin/core/finance'
 * ```
 */

// Exportar reglas de negocio
export * from './reglas.js'

// Exportar estados y constantes
export * from './estados.js'

// Exportar validaciones
export * from './validaciones.js'

// Exportar cálculos
export * from './calculos.js'

