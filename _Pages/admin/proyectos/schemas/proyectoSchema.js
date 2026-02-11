/**
 * Esquemas de validación Zod para Proyectos
 * 
 * Define la estructura y validaciones de datos para proyectos,
 * obras y presupuestos siguiendo las reglas de negocio del sistema.
 */

import { z } from 'zod'
import { ESTADOS_PROYECTO } from '../../core/construction/estados'

/**
 * Esquema base para validación de fechas
 */
const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'La fecha debe estar en formato YYYY-MM-DD'
})

/**
 * Esquema para validar que fecha_fin > fecha_inicio
 */
const validarFechas = (fechaInicio, fechaFin) => {
  if (fechaInicio && fechaFin) {
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    if (fin <= inicio) {
      return false
    }
  }
  return true
}

/**
 * Esquema de validación para crear un proyecto
 */
export const crearProyectoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre del proyecto es obligatorio')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),
  
  descripcion: z
    .string()
    .max(5000, 'La descripción no puede exceder 5000 caracteres')
    .optional()
    .nullable(),
  
  fecha_inicio: fechaSchema
    .refine((val) => val, {
      message: 'La fecha de inicio es obligatoria'
    }),
  
  fecha_fin_estimada: fechaSchema
    .refine((val) => val, {
      message: 'La fecha de fin estimada es obligatoria'
    }),
  
  presupuesto_total: z
    .number()
    .min(0, 'El presupuesto no puede ser negativo')
    .optional()
    .nullable(),
  
  cliente_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  
  usuario_responsable_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  
  forma_pago: z
    .string()
    .max(50)
    .optional()
    .nullable(),
  
  tags: z
    .array(z.string().max(50))
    .optional()
    .default([]),
  
  ubicacion: z
    .string()
    .max(500)
    .optional()
    .nullable()
}).refine(
  (data) => validarFechas(data.fecha_inicio, data.fecha_fin_estimada),
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fecha_fin_estimada']
  }
)

/**
 * Esquema para actualizar un proyecto
 */
export const actualizarProyectoSchema = crearProyectoSchema.partial().extend({
  id: z.number().int().positive(),
  estado: z.enum([
    ESTADOS_PROYECTO.PLANIFICACION,
    ESTADOS_PROYECTO.ACTIVO,
    ESTADOS_PROYECTO.SUSPENDIDO,
    ESTADOS_PROYECTO.FINALIZADO,
    ESTADOS_PROYECTO.CANCELADO
  ]).optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional()
})

/**
 * Esquema para filtros de búsqueda de proyectos
 */
export const filtrarProyectosSchema = z.object({
  busqueda: z.string().optional(),
  estado: z.string().optional(),
  cliente_id: z.number().int().positive().optional(),
  responsable_id: z.number().int().positive().optional(),
  fecha_inicio_desde: fechaSchema.optional(),
  fecha_inicio_hasta: fechaSchema.optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0)
})

/**
 * Esquema para crear una obra dentro de un proyecto
 */
export const crearObraEnProyectoSchema = z.object({
  proyecto_id: z.number().int().positive(),
  nombre: z
    .string()
    .min(1, 'El nombre de la obra es obligatorio')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),
  
  descripcion: z
    .string()
    .max(5000)
    .optional()
    .nullable(),
  
  ubicacion: z
    .string()
    .min(1, 'La ubicación es obligatoria')
    .max(255),
  
  tipo_obra: z.enum([
    'construccion',
    'remodelacion',
    'reparacion',
    'mantenimiento',
    'servicio',
    'otro'
  ]).default('construccion'),
  
  presupuesto_aprobado: z
    .number()
    .min(0, 'El presupuesto no puede ser negativo')
    .optional()
    .nullable(),
  
  fecha_inicio: fechaSchema,
  fecha_fin_estimada: fechaSchema,
  
  cliente_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  
  usuario_responsable_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  
  max_trabajadores: z
    .number()
    .int()
    .positive()
    .max(1000)
    .default(50)
}).refine(
  (data) => validarFechas(data.fecha_inicio, data.fecha_fin_estimada),
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fecha_fin_estimada']
  }
)

/**
 * Tipos inferidos del esquema (solo para referencia con TypeScript)
 * 
 * Si usas TypeScript, puedes importar estos tipos así:
 * import type { CrearProyectoInput } from './proyectoSchema'
 * 
 * En JavaScript, estos tipos no son necesarios.
 */
// export type CrearProyectoInput = z.infer<typeof crearProyectoSchema>
// export type ActualizarProyectoInput = z.infer<typeof actualizarProyectoSchema>
// export type FiltrarProyectosInput = z.infer<typeof filtrarProyectosSchema>
// export type CrearObraEnProyectoInput = z.infer<typeof crearObraEnProyectoSchema>

