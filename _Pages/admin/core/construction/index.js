/**
 * Dominio Compartido: Construction
 * 
 * Este módulo centraliza toda la lógica de negocio compartida
 * del sistema de construcción. No contiene lógica de UI ni DB,
 * solo reglas puras de negocio, cálculos y validaciones.
 * 
 * Uso recomendado:
 * ```javascript
 * import { calcularPorcentajeEjecutado, REGLAS_NEGOCIO, ESTADOS_OBRA } from '@/Pages/admin/core/construction'
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

