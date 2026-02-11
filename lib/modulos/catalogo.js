/**
 * ============================================
 * CATÁLOGO DE MÓDULOS DEL SISTEMA
 * ============================================
 * 
 * Este archivo define todos los módulos disponibles en el sistema,
 * sus rutas asociadas y metadatos.
 * 
 * Cada módulo tiene:
 * - codigo: Identificador único del módulo
 * - nombre: Nombre descriptivo
 * - categoria: Categoría del módulo
 * - rutas: Array de rutas que pertenecen a este módulo
 * - siempreHabilitado: Si es true, siempre está habilitado (ej: core)
 */

export const MODULOS = {
    // ============================================
    // CORE - Módulo base (siempre habilitado)
    // ============================================
    CORE: {
        codigo: 'core',
        nombre: 'Core',
        categoria: 'core',
        siempreHabilitado: true,
        rutas: [
            '/admin/dashboard',
            '/admin/configuracion',
            '/admin/perfil',
            '/admin/usuarios'
        ]
    },

    // ============================================
    // POS - Punto de Venta Básico
    // ============================================
    POS: {
        codigo: 'pos',
        nombre: 'Punto de Venta',
        categoria: 'pos',
        siempreHabilitado: false,
        rutas: [
            '/admin/ventas',
            '/admin/productos',
            '/admin/clientes',
            '/admin/inventario',
            '/admin/compras',
            '/admin/proveedores',
            '/admin/cotizaciones',
            '/admin/conduces',
            '/admin/categorias',
            '/admin/marcas',
            '/admin/cajas',
            '/admin/gastos'
        ]
    },

    // ============================================
    // CREDITO - Control de Crédito
    // ============================================
    CREDITO: {
        codigo: 'credito',
        nombre: 'Control de Crédito',
        categoria: 'credito',
        siempreHabilitado: false,
        rutas: [
            '/admin/credito',
            '/admin/finanzas/cxc',
            '/admin/depuracion'
        ]
    },

    // ============================================
    // FINANCIAMIENTO - Sistema de Financiamiento
    // ============================================
    FINANCIAMIENTO: {
        codigo: 'financiamiento',
        nombre: 'Financiamiento',
        categoria: 'financiamiento',
        siempreHabilitado: false,
        rutas: [
            '/admin/financiamiento',
            '/admin/planes',
            '/admin/contratos',
            '/admin/cuotas',
            '/admin/pagos',
            '/admin/alertas',
            '/admin/equipos',
            '/admin/activos'
        ]
    },

    // ============================================
    // CONSTRUCTORA - Control de Obras y Construcción
    // ============================================
    CONSTRUCTORA: {
        codigo: 'constructora',
        nombre: 'Construcción',
        categoria: 'constructora',
        siempreHabilitado: false,
        rutas: [
            '/admin/constructora',
            '/admin/obras',
            '/admin/proyectos',
            '/admin/proyectos/plantillas',
            '/admin/servicios',
            '/admin/bitacora',
            '/admin/personal',
            '/admin/presupuesto',
            '/admin/compras-obra',
            '/admin/conduces-obra'
        ]
    },

    // ============================================
    // CATALOGO - Catálogo Online y B2B
    // ============================================
    CATALOGO: {
        codigo: 'catalogo',
        nombre: 'Catálogo Online',
        categoria: 'catalogo',
        siempreHabilitado: false,
        rutas: [
            '/admin/catalogo',
            '/admin/catalogo/pedidos',
            '/admin/tienda-isiweek'
        ]
    }
}

/**
 * Obtener el módulo al que pertenece una ruta
 * @param {string} ruta - Ruta a verificar (ej: '/admin/ventas/nueva')
 * @returns {Object|null} - Objeto del módulo o null si no pertenece a ningún módulo
 */
export function obtenerModuloPorRuta(ruta) {
    if (!ruta || typeof ruta !== 'string') {
        return null
    }

    // Normalizar ruta (remover trailing slash)
    const rutaNormalizada = ruta.endsWith('/') ? ruta.slice(0, -1) : ruta

    // Buscar en todos los módulos
    for (const [key, modulo] of Object.entries(MODULOS)) {
        // Verificar si la ruta coincide con alguna ruta del módulo
        const coincide = modulo.rutas.some(rutaModulo => {
            // Coincidencia exacta
            if (rutaNormalizada === rutaModulo) {
                return true
            }
            // Coincidencia por prefijo (ej: /admin/ventas coincide con /admin/ventas/nueva)
            if (rutaNormalizada.startsWith(rutaModulo + '/')) {
                return true
            }
            return false
        })

        if (coincide) {
            return modulo
        }
    }

    // Si no coincide con ningún módulo específico, verificar si es una ruta de admin
    // Las rutas de admin sin módulo específico pertenecen al core
    if (rutaNormalizada.startsWith('/admin')) {
        return MODULOS.CORE
    }

    return null
}

/**
 * Obtener todas las rutas de un módulo
 * @param {string} codigoModulo - Código del módulo
 * @returns {Array<string>} - Array de rutas del módulo
 */
export function obtenerRutasModulo(codigoModulo) {
    const modulo = Object.values(MODULOS).find(m => m.codigo === codigoModulo)
    return modulo ? modulo.rutas : []
}

/**
 * Verificar si una ruta pertenece a un módulo específico
 * @param {string} ruta - Ruta a verificar
 * @param {string} codigoModulo - Código del módulo
 * @returns {boolean}
 */
export function rutaPerteneceAModulo(ruta, codigoModulo) {
    const modulo = obtenerModuloPorRuta(ruta)
    return modulo && modulo.codigo === codigoModulo
}

/**
 * Obtener todos los módulos de una categoría
 * @param {string} categoria - Categoría a filtrar
 * @returns {Array<Object>} - Array de módulos de la categoría
 */
export function obtenerModulosPorCategoria(categoria) {
    return Object.values(MODULOS).filter(m => m.categoria === categoria)
}

/**
 * Obtener todos los códigos de módulos
 * @returns {Array<string>} - Array de códigos de módulos
 */
export function obtenerTodosCodigosModulos() {
    return Object.values(MODULOS).map(m => m.codigo)
}

