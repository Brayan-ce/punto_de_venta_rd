/**
 * Estados y constantes del dominio Construction
 *
 * Este archivo centraliza todos los estados, constantes y funciones
 * de formateo relacionadas con estados del sistema de construcción.
 */

/**
 * Estados de obra
 */
export const ESTADOS_OBRA = {
    PLANIFICACION: 'planificacion',
    ACTIVA: 'activa',
    SUSPENDIDA: 'suspendida',
    FINALIZADA: 'finalizada',
    CANCELADA: 'cancelada',
}

/**
 * Estados de servicio
 */
export const ESTADOS_SERVICIO = {
    PENDIENTE: 'pendiente',
    PROGRAMADO: 'programado',
    EN_EJECUCION: 'en_ejecucion',
    FINALIZADO: 'finalizado',
    CANCELADO: 'cancelado',
}

/**
 * Estados de proyecto
 */
export const ESTADOS_PROYECTO = {
    PLANIFICACION: 'planificacion',
    ACTIVO: 'activo',
    SUSPENDIDO: 'suspendido',
    FINALIZADO: 'finalizado',
    CANCELADO: 'cancelado',
}

/**
 * Estados de bitácora
 */
export const ESTADOS_BITACORA = {
    BORRADOR: 'borrador',
    REGISTRADA: 'registrada',
    REVISADA: 'revisada',
}

/**
 * Estados de orden de trabajo
 */
export const ESTADOS_ORDEN_TRABAJO = {
    PENDIENTE: 'pendiente',
    APROBADA: 'aprobada',
    EN_EJECUCION: 'en_ejecucion',
    COMPLETADA: 'completada',
    CANCELADA: 'cancelada',
}

/**
 * Tipos de obra
 */
export const TIPOS_OBRA = {
    CONSTRUCCION: 'construccion',
    REMODELACION: 'remodelacion',
    REPARACION: 'reparacion',
    MANTENIMIENTO: 'mantenimiento',
    SERVICIO: 'servicio',
    OTRO: 'otro',
}

/**
 * Tipos de servicio
 */
export const TIPOS_SERVICIO = {
    ELECTRICO: 'electrico',
    PLOMERIA: 'plomeria',
    PINTURA: 'pintura',
    REPARACION: 'reparacion',
    INSTALACION: 'instalacion',
    MANTENIMIENTO: 'mantenimiento',
    OTRO: 'otro',
}

/**
 * Prioridades
 */
export const PRIORIDADES = {
    BAJA: 'baja',
    MEDIA: 'media',
    ALTA: 'alta',
    URGENTE: 'urgente',
}

/**
 * Severidad de alertas
 */
export const SEVERIDAD_ALERTA = {
    INFORMATIVA: 'informativa',
    PREVENTIVA: 'preventiva',
    CRITICA: 'critica',
}

/**
 * Formatea el estado de la obra para mostrar en UI
 * @param {string} estado - Estado de la obra
 * @returns {Object} { texto: string, color: string}
 */
export function formatearEstadoObra(estado) {
    const estados = {
        [ESTADOS_OBRA.PLANIFICACION]: {texto: 'Planificación', color: 'info'},
        [ESTADOS_OBRA.ACTIVA]: {texto: 'Activa', color: 'success'},
        [ESTADOS_OBRA.SUSPENDIDA]: {texto: 'Suspendida', color: 'warning'},
        [ESTADOS_OBRA.FINALIZADA]: {texto: 'Finalizada', color: 'info'},
        [ESTADOS_OBRA.CANCELADA]: {texto: 'Cancelada', color: 'danger'},
    }

    return estados[estado] || estados[ESTADOS_OBRA.PLANIFICACION]
}

/**
 * Formatea el estado del servicio para mostrar en UI
 * @param {string} estado - Estado del servicio
 * @returns {Object} { texto: string, color: string}
 */
export function formatearEstadoServicio(estado) {
    const estados = {
        [ESTADOS_SERVICIO.PENDIENTE]: {texto: 'Pendiente', color: 'warning'},
        [ESTADOS_SERVICIO.PROGRAMADO]: {texto: 'Programado', color: 'info'},
        [ESTADOS_SERVICIO.EN_EJECUCION]: {texto: 'En Ejecución', color: 'success'},
        [ESTADOS_SERVICIO.FINALIZADO]: {texto: 'Finalizado', color: 'info'},
        [ESTADOS_SERVICIO.CANCELADO]: {texto: 'Cancelado', color: 'danger'},
    }

    return estados[estado] || estados[ESTADOS_SERVICIO.PENDIENTE]
}

/**
 * Formatea el estado del proyecto para mostrar en UI
 * @param {string} estado - Estado del proyecto
 * @returns {Object} { texto: string, color: string}
 */
export function formatearEstadoProyecto(estado) {
    const estados = {
        [ESTADOS_PROYECTO.PLANIFICACION]: {texto: 'Planificación', color: 'info'},
        [ESTADOS_PROYECTO.ACTIVO]: {texto: 'Activo', color: 'success'},
        [ESTADOS_PROYECTO.SUSPENDIDO]: {texto: 'Suspendido', color: 'warning'},
        [ESTADOS_PROYECTO.FINALIZADO]: {texto: 'Finalizado', color: 'info'},
        [ESTADOS_PROYECTO.CANCELADO]: {texto: 'Cancelado', color: 'danger'},
    }

    return estados[estado] || estados[ESTADOS_PROYECTO.PLANIFICACION]
}

/**
 * Formatea el estado de la bitácora para mostrar en UI
 * @param {string} estado - Estado de la bitácora
 * @returns {Object} { texto: string, color: string}
 */
export function formatearEstadoBitacora(estado) {
    const estados = {
        [ESTADOS_BITACORA.BORRADOR]: {texto: 'Borrador', color: 'secondary'},
        [ESTADOS_BITACORA.REGISTRADA]: {texto: 'Registrada', color: 'info'},
        [ESTADOS_BITACORA.REVISADA]: {texto: 'Revisada', color: 'success'},
    }

    return estados[estado] || estados[ESTADOS_BITACORA.BORRADOR]
}

/**
 * Formatea el estado de la orden de trabajo para mostrar en UI
 * @param {string} estado - Estado de la orden
 * @returns {Object} { texto: string, color: string }
 */
export function formatearEstadoOrdenTrabajo(estado) {
    const estados = {
        [ESTADOS_ORDEN_TRABAJO.PENDIENTE]: {texto: 'Pendiente', color: 'warning'},
        [ESTADOS_ORDEN_TRABAJO.APROBADA]: {texto: 'Aprobada', color: 'info'},
        [ESTADOS_ORDEN_TRABAJO.EN_EJECUCION]: {texto: 'En Ejecución', color: 'success'},
        [ESTADOS_ORDEN_TRABAJO.COMPLETADA]: {texto: 'Completada', color: 'success'},
        [ESTADOS_ORDEN_TRABAJO.CANCELADA]: {texto: 'Cancelada', color: 'danger'},
    }

    return estados[estado] || estados[ESTADOS_ORDEN_TRABAJO.PENDIENTE]
}

/**
 * Formatea la prioridad para mostrar en UI
 * @param {string} prioridad - Prioridad
 * @returns {Object} { texto: string, color: string }
 */
export function formatearPrioridad(prioridad) {
    const prioridades = {
        [PRIORIDADES.BAJA]: {texto: 'Baja', color: 'secondary'},
        [PRIORIDADES.MEDIA]: {texto: 'Media', color: 'info'},
        [PRIORIDADES.ALTA]: {texto: 'Alta', color: 'warning'},
        [PRIORIDADES.URGENTE]: {texto: 'Urgente', color: 'danger'},
    }

    return prioridades[prioridad] || prioridades[PRIORIDADES.MEDIA]
}

/**
 * Formatea el tipo de obra para mostrar en UI
 * @param {string} tipo - Tipo de obra
 * @returns {string} Texto formateado
 */
export function formatearTipoObra(tipo) {
    const tipos = {
        [TIPOS_OBRA.CONSTRUCCION]: 'Construcción',
        [TIPOS_OBRA.REMODELACION]: 'Remodelación',
        [TIPOS_OBRA.REPARACION]: 'Reparación',
        [TIPOS_OBRA.MANTENIMIENTO]: 'Mantenimiento',
        [TIPOS_OBRA.OTRO]: 'Otro',
    }

    return tipos[tipo] || tipo
}

/**
 * Formatea el tipo de servicio para mostrar en UI
 * @param {string} tipo - Tipo de servicio
 * @returns {string} Texto formateado
 */
export function formatearTipoServicio(tipo) {
    const tipos = {
        [TIPOS_SERVICIO.ELECTRICO]: 'Eléctrico',
        [TIPOS_SERVICIO.PLOMERIA]: 'Plomería',
        [TIPOS_SERVICIO.PINTURA]: 'Pintura',
        [TIPOS_SERVICIO.REPARACION]: 'Reparación',
        [TIPOS_SERVICIO.INSTALACION]: 'Instalación',
        [TIPOS_SERVICIO.MANTENIMIENTO]: 'Mantenimiento',
        [TIPOS_SERVICIO.OTRO]: 'Otro',
    }

    return tipos[tipo] || tipo
}

/**
 * Obtiene el color según la severidad de la alerta
 * @param {string} severidad - Severidad de la alerta
 * @returns {string} Clase CSS de color
 */
export function obtenerColorSeveridad(severidad) {
    const colores = {
        [SEVERIDAD_ALERTA.CRITICA]: 'danger',
        [SEVERIDAD_ALERTA.PREVENTIVA]: 'warning',
        [SEVERIDAD_ALERTA.INFORMATIVA]: 'info',
    }

    return colores[severidad] || 'secondary'
}

