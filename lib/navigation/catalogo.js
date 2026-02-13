export const NAVIGATION_CATALOG = {
    manejo_simple: {
        label: 'Manejo Simple',
        icon: 'hand-right-outline',
        modulo: 'constructora',
        items: [
            { 
                href: '/admin/manejo-simple', 
                icon: 'speedometer-outline', 
                label: 'Dashboard Simple', 
                modulo: 'constructora',
                top: false,
                score: 7,
                tipo: 'consulta'
            },
            { 
                href: '/admin/manejo-simple/obras', 
                icon: 'business-outline', 
                label: 'Mis Obras', 
                modulo: 'constructora',
                top: false,
                score: 6,
                tipo: 'accion'
            },
            { 
                href: '/admin/manejo-simple/trabajadores', 
                icon: 'people-outline', 
                label: 'Trabajadores', 
                modulo: 'constructora',
                top: false,
                score: 6,
                tipo: 'configuracion'
            },
            { 
                href: '/admin/manejo-simple/asistencia', 
                icon: 'checkmark-done-outline', 
                label: 'Asistencia Diaria', 
                modulo: 'constructora',
                top: false,
                score: 6,
                tipo: 'accion'
            },
            { 
                href: '/admin/manejo-simple/gastos', 
                icon: 'wallet-outline', 
                label: 'Gastos de Obra', 
                modulo: 'constructora',
                top: false,
                score: 6,
                tipo: 'accion'
            },
            { 
                href: '/admin/manejo-simple/reportes', 
                icon: 'document-text-outline', 
                label: 'Reportes Simples', 
                modulo: 'constructora',
                top: false,
                score: 5,
                tipo: 'consulta'
            }
        ]
    },

    pos: {
        label: 'Punto de Venta',
        icon: 'cash-outline',
        modulo: 'pos',
        items: [
            { 
                href: '/admin/ventas/nueva', 
                icon: 'cash-outline', 
                label: 'Vender', 
                modulo: 'pos',
                top: true,
                score: 10,
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

export function obtenerItemsTop(tieneModulo, maxItems = 5) {
    const itemsTop = []
    
    Object.values(NAVIGATION_CATALOG).forEach(categoria => {
        if (categoria.modulo === 'core' || tieneModulo(categoria.modulo)) {
            categoria.items
                .filter(item => item.top === true)
                .forEach(item => {
                    itemsTop.push(item)
                })
        }
    })
    
    return itemsTop
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, maxItems)
}

export function obtenerItemsModulo(codigoModulo) {
    const categoria = Object.values(NAVIGATION_CATALOG).find(
        cat => cat.modulo === codigoModulo
    )
    return categoria ? categoria.items : []
}

export function obtenerCategoriasNavegacion(tieneModulo) {
    return Object.values(NAVIGATION_CATALOG)
        .filter(categoria => {
            return categoria.modulo === 'core' || tieneModulo(categoria.modulo)
        })
        .map((categoria, index) => ({
            ...categoria,
            uniqueKey: `${categoria.label}-${index}`,
            items: categoria.items.filter(item => {
                if (!item.modulo) return true
                return item.modulo === 'core' || tieneModulo(item.modulo)
            })
        }))
        .filter(categoria => categoria.items.length > 0)
}

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
        .slice(0, 4)
}

export function obtenerItemPorHref(href) {
    for (const categoria of Object.values(NAVIGATION_CATALOG)) {
        const item = categoria.items.find(i => i.href === href)
        if (item) return item
    }
    return null
}