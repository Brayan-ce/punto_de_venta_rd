/**
 * =====================================================
 * LIB.JS - REGLAS DE NEGOCIO Y HELPERS PARA CONDUCES
 * =====================================================
 * 
 * Este archivo contiene:
 * - Constantes de estados
 * - Funciones de validación
 * - Helpers de negocio
 * - Reglas de negocio reutilizables
 */

// =====================================================
// ESTADOS DEL CONDUCE
// =====================================================

export const ESTADOS_CONDUCE = {
    EMITIDO: 'emitido',
    ENTREGADO: 'entregado',
    ANULADO: 'anulado'
}

// =====================================================
// TIPOS DE ORIGEN
// =====================================================

export const TIPOS_ORIGEN = {
    VENTA: 'venta',
    COTIZACION: 'cotizacion'
}

// =====================================================
// VALIDACIONES DE NEGOCIO
// =====================================================

/**
 * Verifica si un conduce puede ser editado
 * @param {object} conduce - Objeto conduce con estado
 * @returns {boolean}
 */
export function puedeEditar(conduce) {
    if (!conduce) return false
    return conduce.estado === ESTADOS_CONDUCE.EMITIDO
}

/**
 * Verifica si un conduce puede ser anulado
 * @param {object} conduce - Objeto conduce con estado
 * @returns {boolean}
 */
export function puedeAnular(conduce) {
    if (!conduce) return false
    return conduce.estado === ESTADOS_CONDUCE.EMITIDO
}

/**
 * Verifica si un conduce puede ser marcado como entregado
 * @param {object} conduce - Objeto conduce con estado
 * @returns {boolean}
 */
export function puedeMarcarEntregado(conduce) {
    if (!conduce) return false
    return conduce.estado === ESTADOS_CONDUCE.EMITIDO
}

/**
 * Verifica si un conduce puede ser impreso
 * @param {object} conduce - Objeto conduce con estado
 * @returns {boolean}
 */
export function puedeImprimir(conduce) {
    if (!conduce) return false
    return conduce.estado !== ESTADOS_CONDUCE.ANULADO
}

// =====================================================
// HELPERS DE FORMATO
// =====================================================

/**
 * Obtiene el color del badge según el estado
 * @param {string} estado - Estado del conduce
 * @returns {string} Clase CSS para el badge
 */
export function obtenerColorBadge(estado) {
    const colores = {
        [ESTADOS_CONDUCE.EMITIDO]: 'emitido',
        [ESTADOS_CONDUCE.ENTREGADO]: 'entregado',
        [ESTADOS_CONDUCE.ANULADO]: 'anulado'
    }
    return colores[estado] || 'emitido'
}

/**
 * Obtiene el texto legible del estado
 * @param {string} estado - Estado del conduce
 * @returns {string} Texto legible
 */
export function obtenerTextoEstado(estado) {
    const textos = {
        [ESTADOS_CONDUCE.EMITIDO]: 'Emitido',
        [ESTADOS_CONDUCE.ENTREGADO]: 'Entregado',
        [ESTADOS_CONDUCE.ANULADO]: 'Anulado'
    }
    return textos[estado] || estado
}

/**
 * Obtiene el texto legible del tipo de origen
 * @param {string} tipoOrigen - Tipo de origen (venta/cotizacion)
 * @returns {string} Texto legible
 */
export function obtenerTextoTipoOrigen(tipoOrigen) {
    const textos = {
        [TIPOS_ORIGEN.VENTA]: 'Venta',
        [TIPOS_ORIGEN.COTIZACION]: 'Cotización'
    }
    return textos[tipoOrigen] || tipoOrigen
}

// =====================================================
// VALIDACIONES DE DATOS
// =====================================================

/**
 * Valida los datos básicos de un conduce antes de crear
 * @param {object} datos - Datos del conduce
 * @returns {object} { valido: boolean, errores: string[] }
 */
export function validarDatosConduce(datos) {
    const errores = []

    if (!datos.tipo_origen || !Object.values(TIPOS_ORIGEN).includes(datos.tipo_origen)) {
        errores.push('Tipo de origen inválido')
    }

    if (!datos.origen_id || datos.origen_id <= 0) {
        errores.push('ID de origen inválido')
    }

    if (!datos.numero_origen || datos.numero_origen.trim() === '') {
        errores.push('Número de origen es requerido')
    }

    if (!datos.fecha_conduce) {
        errores.push('Fecha del conduce es requerida')
    }

    if (!datos.productos || !Array.isArray(datos.productos) || datos.productos.length === 0) {
        errores.push('Debe seleccionar al menos un producto para despachar')
    } else {
        datos.productos.forEach((item, idx) => {
            if (!item.producto_id || item.producto_id <= 0) {
                errores.push(`Producto ${idx + 1}: ID de producto inválido`)
            }
            if (!item.cantidad_a_despachar || parseFloat(item.cantidad_a_despachar) <= 0) {
                errores.push(`Producto ${idx + 1}: La cantidad a despachar debe ser mayor a cero`)
            }
        })
    }

    return {
        valido: errores.length === 0,
        errores
    }
}

// =====================================================
// HELPERS DE SALDOS
// =====================================================

/**
 * Verifica si hay saldo disponible para despachar
 * @param {number} cantidadPendiente - Cantidad pendiente
 * @param {number} cantidadADespachar - Cantidad a despachar
 * @returns {object} { valido: boolean, mensaje: string }
 */
export function validarSaldoDisponible(cantidadPendiente, cantidadADespachar) {
    if (cantidadADespachar <= 0) {
        return {
            valido: false,
            mensaje: 'La cantidad a despachar debe ser mayor a cero'
        }
    }

    if (cantidadADespachar > cantidadPendiente) {
        return {
            valido: false,
            mensaje: `No puede despachar ${cantidadADespachar}, solo quedan ${cantidadPendiente} pendientes`
        }
    }

    return {
        valido: true,
        mensaje: ''
    }
}

