/**
 * ============================================
 * CATÁLOGO ÚNICO DE NAVEGACIÓN
 * ============================================
 * 
 * Este archivo centraliza TODA la navegación del sistema.
 * Es la única fuente de verdad para menús y navegación.
 * 
 * PRINCIPIOS:
 * 1. El header NO decide qué mostrar, solo renderiza lo que dice este catálogo
 * 2. Los items TOP son los más usados diariamente (máx 5-6)
 * 3. El sidebar muestra TODO organizado por módulos
 * 4. Cada item puede tener: top, score, modulo, permisos
 * 
 * ESTRUCTURA:
 * - Cada módulo tiene items
 * - Cada item puede ser TOP (aparece en header)
 * - Score determina prioridad si hay más de 5-6 TOP
 */

/**
 * Catálogo completo de navegación organizado por módulos
 */
export const NAVIGATION_CATALOG = {
    // ============================================
    // POS - Punto de Venta
    // ============================================
    pos: {
        label: 'Punto de Venta',
        icon: 'cash-outline',
        modulo: 'pos',
        items: [
            // TOP - Acciones diarias
            { 
                href: '/admin/ventas/nueva', 
                icon: 'cash-outline', 
                label: 'Vender', 
                modulo: 'pos',
                top: true,
                score: 10, // Máxima prioridad
                tipo: 'accion'
            },
            { 
                href: '/admin/ventas', 
                icon: 'list-outline', 
                label: 'Mis Ventas', 
                modulo: 'pos',
                top: true,
                score: 9,
                tipo: 'consulta'
            },
            { 
                href: '/admin/productos', 
                icon: 'cube-outline', 
                label: 'Productos', 
                modulo: 'pos',
                top: true,
                score: 9,
                tipo: 'consulta'
            },
            { 
                href: '/admin/clientes', 
                icon: 'people-outline', 
                label: 'Clientes', 
                modulo: 'pos',
                top: true,
                score: 8,
                tipo: 'consulta'
            },
            // Lateral - Gestión
            { 
                href: '/admin/inventario', 
                icon: 'file-tray-stacked-outline', 
                label: 'Inventario', 
                modulo: 'pos',
                top: false,
                score: 7,
                tipo: 'consulta'
            },
            { 
                href: '/admin/compras', 
                icon: 'bag-handle-outline', 
                label: 'Compras', 
                modulo: 'pos',
                top: false,
                score: 6,
                tipo: 'accion'
            },
            { 
                href: '/admin/proveedores', 
                icon: 'business-outline', 
                label: 'Proveedores', 
                modulo: 'pos',
                top: false,
                score: 5,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/cotizaciones', 
                icon: 'document-text-outline', 
                label: 'Cotizaciones', 
                modulo: 'pos',
                top: false,
                score: 5,
                tipo: 'accion'
            },
            { 
                href: '/admin/conduces', 
                icon: 'basket-outline', 
                label: 'Conduces', 
                modulo: 'pos',
                top: false,
                score: 4,
                tipo: 'accion'
            },
            { 
                href: '/admin/categorias', 
                icon: 'apps-outline', 
                label: 'Categorias', 
                modulo: 'pos',
                top: false,
                score: 3,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/marcas', 
                icon: 'pricetag-outline', 
                label: 'Marcas', 
                modulo: 'pos',
                top: false,
                score: 3,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/cajas', 
                icon: 'cash-outline', 
                label: 'Cajas', 
                modulo: 'pos',
                top: false,
                score: 4,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/gastos', 
                icon: 'wallet-outline', 
                label: 'Gastos', 
                modulo: 'pos',
                top: false,
                score: 5,
                tipo: 'accion'
            }
        ]
    },

    // ============================================
    // CREDITO - Control de Crédito
    // ============================================
    credito: {
        label: 'Crédito',
        icon: 'card-outline',
        modulo: 'credito',
        items: [
            { 
                href: '/admin/credito', 
                icon: 'card-outline', 
                label: 'Control de Crédito', 
                modulo: 'credito',
                top: false,
                score: 7,
                tipo: 'consulta'
            },
            { 
                href: '/admin/finanzas/cxc', 
                icon: 'calculator-outline', 
                label: 'Cuentas por Cobrar', 
                modulo: 'credito',
                top: false,
                score: 6,
                tipo: 'consulta'
            },
            { 
                href: '/admin/depuracion', 
                icon: 'analytics-outline', 
                label: 'Depuración de Crédito', 
                modulo: 'credito',
                top: false,
                score: 4,
                tipo: 'configuracion'
            }
        ]
    },

    // ============================================
    // FINANCIAMIENTO - Sistema de Financiamiento
    // ============================================
    financiamiento: {
        label: 'Financiamiento',
        icon: 'card-outline',
        modulo: 'financiamiento',
        items: [
            { 
                href: '/admin/financiamiento', 
                icon: 'speedometer-outline', 
                label: 'Dashboard Financiamiento', 
                modulo: 'financiamiento',
                top: true,
                score: 8,
                tipo: 'consulta'
            },
            { 
                href: '/admin/contratos', 
                icon: 'document-text-outline', 
                label: 'Contratos', 
                modulo: 'financiamiento',
                top: false,
                score: 7,
                tipo: 'accion'
            },
            { 
                href: '/admin/cuotas', 
                icon: 'calendar-outline', 
                label: 'Cuotas', 
                modulo: 'financiamiento',
                top: false,
                score: 7,
                tipo: 'consulta'
            },
            { 
                href: '/admin/pagos', 
                icon: 'cash-outline', 
                label: 'Pagos', 
                modulo: 'financiamiento',
                top: false,
                score: 7,
                tipo: 'accion'
            },
            { 
                href: '/admin/alertas', 
                icon: 'warning-outline', 
                label: 'Alertas', 
                modulo: 'financiamiento',
                top: false,
                score: 6,
                tipo: 'consulta'
            },
            { 
                href: '/admin/planes', 
                icon: 'document-text-outline', 
                label: 'Planes', 
                modulo: 'financiamiento',
                top: false,
                score: 4,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/equipos', 
                icon: 'hardware-chip-outline', 
                label: 'Equipos', 
                modulo: 'financiamiento',
                top: false,
                score: 5,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/activos', 
                icon: 'cube-outline', 
                label: 'Activos', 
                modulo: 'financiamiento',
                top: false,
                score: 5,
                tipo: 'configuracion'
            }
        ]
    },

    // ============================================
    // CONSTRUCTORA - Control de Obras y Construcción
    // ============================================
    constructora: {
        label: 'Construcción',
        icon: 'build-outline',
        modulo: 'constructora',
        items: [
            { 
                href: '/admin/constructora', 
                icon: 'speedometer-outline', 
                label: 'Dashboard Construcción', 
                modulo: 'constructora',
                top: true,
                score: 8,
                tipo: 'consulta'
            },
            { 
                href: '/admin/obras', 
                icon: 'business-outline', 
                label: 'Obras', 
                modulo: 'constructora',
                top: true,
                score: 9,
                tipo: 'accion'
            },
            { 
                href: '/admin/proyectos', 
                icon: 'folder-outline', 
                label: 'Proyectos', 
                modulo: 'constructora',
                top: true,
                score: 8,
                tipo: 'accion'
            },
            { 
                href: '/admin/proyectos/plantillas', 
                icon: 'layers-outline', 
                label: 'Plantillas de Proyectos', 
                modulo: 'constructora',
                top: false,
                score: 7,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/presupuesto', 
                icon: 'calculator-outline', 
                label: 'Presupuesto', 
                modulo: 'constructora',
                top: false,
                score: 7,
                tipo: 'accion'
            },
            { 
                href: '/admin/bitacora', 
                icon: 'document-text-outline', 
                label: 'Bitácora', 
                modulo: 'constructora',
                top: false,
                score: 6,
                tipo: 'accion'
            },
            { 
                href: '/admin/servicios', 
                icon: 'build-outline', 
                label: 'Servicios', 
                modulo: 'constructora',
                top: false,
                score: 5,
                tipo: 'accion'
            },
            { 
                href: '/admin/personal', 
                icon: 'people-outline', 
                label: 'Personal', 
                modulo: 'constructora',
                top: false,
                score: 5,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/compras-obra', 
                icon: 'bag-handle-outline', 
                label: 'Compras Obra', 
                modulo: 'constructora',
                top: false,
                score: 6,
                tipo: 'accion'
            },
            { 
                href: '/admin/conduces-obra', 
                icon: 'basket-outline', 
                label: 'Conduces Obra', 
                modulo: 'constructora',
                top: false,
                score: 5,
                tipo: 'accion'
            }
        ]
    },

    // ============================================
    // CATALOGO - Catálogo Online y B2B
    // ============================================
    catalogo: {
        label: 'Catálogo Online',
        icon: 'albums-outline',
        modulo: 'catalogo',
        items: [
            { 
                href: '/admin/catalogo/pedidos', 
                icon: 'receipt-outline', 
                label: 'Pedidos', 
                modulo: 'catalogo',
                top: true,
                score: 8,
                tipo: 'consulta'
            },
            { 
                href: '/admin/catalogo', 
                icon: 'albums-outline', 
                label: 'Catálogo Online', 
                modulo: 'catalogo',
                top: false,
                score: 6,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/tienda-isiweek', 
                icon: 'storefront-outline', 
                label: 'Tienda IsiWeek', 
                modulo: 'catalogo',
                top: false,
                score: 5,
                tipo: 'consulta'
            }
        ]
    },

    // ============================================
    // CORE - Sistema Base
    // ============================================
    core: {
        label: 'Sistema',
        icon: 'settings-outline',
        modulo: 'core',
        items: [
            { 
                href: '/admin/dashboard', 
                icon: 'speedometer-outline', 
                label: 'Dashboard', 
                modulo: 'core',
                top: true,
                score: 7,
                tipo: 'consulta'
            },
            { 
                href: '/admin/reportes', 
                icon: 'stats-chart-outline', 
                label: 'Reportes', 
                modulo: 'core',
                top: false,
                score: 6,
                tipo: 'consulta'
            },
            { 
                href: '/admin/usuarios', 
                icon: 'person-outline', 
                label: 'Usuarios', 
                modulo: 'core',
                top: false,
                score: 4,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/configuracion', 
                icon: 'settings-outline', 
                label: 'Configuracion', 
                modulo: 'core',
                top: false,
                score: 3,
                tipo: 'configuracion'
            }
        ]
    }
}

/**
 * Obtener todos los items TOP ordenados por score
 * @param {Function} tieneModulo - Función para verificar si un módulo está habilitado
 * @param {number} maxItems - Máximo de items a retornar (default: 5)
 * @returns {Array} - Array de items TOP ordenados por score
 */
export function obtenerItemsTop(tieneModulo, maxItems = 5) {
    const itemsTop = []
    
    // Recorrer todos los módulos
    Object.values(NAVIGATION_CATALOG).forEach(categoria => {
        // Verificar si el módulo está habilitado
        if (categoria.modulo === 'core' || tieneModulo(categoria.modulo)) {
            // Agregar items TOP de este módulo
            categoria.items
                .filter(item => item.top === true)
                .forEach(item => {
                    itemsTop.push(item)
                })
        }
    })
    
    // Ordenar por score (mayor a menor) y limitar
    return itemsTop
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, maxItems)
}

/**
 * Obtener todos los items de un módulo específico
 * @param {string} codigoModulo - Código del módulo
 * @returns {Array} - Array de items del módulo
 */
export function obtenerItemsModulo(codigoModulo) {
    const categoria = Object.values(NAVIGATION_CATALOG).find(
        cat => cat.modulo === codigoModulo
    )
    return categoria ? categoria.items : []
}

/**
 * Obtener todas las categorías de navegación filtradas por módulos habilitados
 * @param {Function} tieneModulo - Función para verificar si un módulo está habilitado
 * @returns {Array} - Array de categorías con sus items
 */
export function obtenerCategoriasNavegacion(tieneModulo) {
    return Object.values(NAVIGATION_CATALOG)
        .filter(categoria => {
            // Core siempre está habilitado, otros módulos se verifican
            return categoria.modulo === 'core' || tieneModulo(categoria.modulo)
        })
        .map(categoria => ({
            ...categoria,
            items: categoria.items.filter(item => {
                // Filtrar items según módulo habilitado
                if (!item.modulo) return true
                return item.modulo === 'core' || tieneModulo(item.modulo)
            })
        }))
        .filter(categoria => categoria.items.length > 0) // Solo categorías con items
}

/**
 * Obtener items de acciones diarias (para sidebar)
 * @param {Function} tieneModulo - Función para verificar si un módulo está habilitado
 * @returns {Array} - Array de items de acciones diarias
 */
export function obtenerAccionesDiarias(tieneModulo) {
    const acciones = []
    
    Object.values(NAVIGATION_CATALOG).forEach(categoria => {
        if (categoria.modulo === 'core' || tieneModulo(categoria.modulo)) {
            categoria.items
                .filter(item => item.top === true && item.tipo === 'accion')
                .forEach(item => {
                    acciones.push(item)
                })
        }
    })
    
    return acciones
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 4) // Máximo 4 acciones diarias
}

/**
 * Buscar item por href
 * @param {string} href - Ruta a buscar
 * @returns {Object|null} - Item encontrado o null
 */
export function obtenerItemPorHref(href) {
    for (const categoria of Object.values(NAVIGATION_CATALOG)) {
        const item = categoria.items.find(i => i.href === href)
        if (item) return item
    }
    return null
}

