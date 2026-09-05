// ============================================
// API ADAPTER - ISIWEEK POS
// Versión simplificada - Solo online (sin IndexedDB)
// ============================================

class APIAdapter {
    // ==========================================
    // PRODUCTOS
    // ==========================================

    async getProductos(empresaId) {
        try {
            const response = await fetch(`/api/productos?empresa_id=${empresaId}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            if (response.ok) {
                const productos = await response.json();
                return {
                    data: productos,
                    source: 'server',
                    offline: false,
                };
            }
            return { data: [], source: 'server', offline: false };
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            return { data: [], source: 'server', offline: false };
        }
    }

    async getProductoById(id) {
        try {
            const response = await fetch(`/api/productos/${id}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error obteniendo producto:', error);
            return null;
        }
    }

    async searchProductos(termino, empresaId) {
        try {
            const response = await fetch(`/api/productos/search?termino=${encodeURIComponent(termino)}&empresa_id=${empresaId}`);
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error buscando productos:', error);
            return [];
        }
    }

    // ==========================================
    // VENTAS
    // ==========================================

    async createVenta(ventaData) {
        try {
            const response = await fetch('/api/ventas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ventaData),
            });

            if (response.ok) {
                const result = await response.json();
                return {
                    ...result,
                    offline: false,
                    source: 'server',
                };
            }
            return null;
        } catch (error) {
            console.error('Error creando venta:', error);
            return null;
        }
    }

    async getVentas(empresaId, limit = 100) {
        try {
            const response = await fetch(
                `/api/ventas?empresa_id=${empresaId}&limit=${limit}`
            );

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error obteniendo ventas:', error);
            return [];
        }
    }

    async getVentaById(ventaId) {
        try {
            const response = await fetch(`/api/ventas/${ventaId}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error obteniendo venta:', error);
            return null;
        }
    }

    // ==========================================
    // CLIENTES
    // ==========================================

    async getClientes(empresaId) {
        try {
            const response = await fetch(`/api/clientes?empresa_id=${empresaId}`);

            if (response.ok) {
                const clientes = await response.json();
                return clientes;
            }
            return [];
        } catch (error) {
            console.error('Error obteniendo clientes:', error);
            return [];
        }
    }

    async searchClientes(termino, empresaId) {
        try {
            const response = await fetch(`/api/clientes/search?termino=${encodeURIComponent(termino)}&empresa_id=${empresaId}`);
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error buscando clientes:', error);
            return [];
        }
    }

    async saveCliente(cliente) {
        try {
            const response = await fetch('/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cliente),
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error guardando cliente:', error);
            return null;
        }
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    getConnectionStatus() {
        return {
            online: typeof navigator !== 'undefined' ? navigator.onLine : true,
            type: 'server',
        };
    }
}

// Exportar instancia única
export const apiAdapter = new APIAdapter();
