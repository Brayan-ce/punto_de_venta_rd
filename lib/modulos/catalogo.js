export const MODULOS = {
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
            '/admin/conduces-obra',
            '/admin/manejo-simple',
            '/admin/manejo-simple/obras',
            '/admin/manejo-simple/trabajadores',
            '/admin/manejo-simple/asistencia',
            '/admin/manejo-simple/gastos',
            '/admin/manejo-simple/reportes'
        ]
    },

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

export function obtenerModuloPorRuta(ruta) {
    if (!ruta || typeof ruta !== 'string') {
        return null
    }

    const rutaNormalizada = ruta.endsWith('/') ? ruta.slice(0, -1) : ruta

    for (const [key, modulo] of Object.entries(MODULOS)) {
        const coincide = modulo.rutas.some(rutaModulo => {
            if (rutaNormalizada === rutaModulo) {
                return true
            }
            if (rutaNormalizada.startsWith(rutaModulo + '/')) {
                return true
            }
            return false
        })

        if (coincide) {
            return modulo
        }
    }

    if (rutaNormalizada.startsWith('/admin')) {
        return MODULOS.CORE
    }

    return null
}

export function obtenerRutasModulo(codigoModulo) {
    const modulo = Object.values(MODULOS).find(m => m.codigo === codigoModulo)
    return modulo ? modulo.rutas : []
}

export function rutaPerteneceAModulo(ruta, codigoModulo) {
    const modulo = obtenerModuloPorRuta(ruta)
    return modulo && modulo.codigo === codigoModulo
}

export function obtenerModulosPorCategoria(categoria) {
    return Object.values(MODULOS).filter(m => m.categoria === categoria)
}

export function obtenerTodosCodigosModulos() {
    return Object.values(MODULOS).map(m => m.codigo)
}