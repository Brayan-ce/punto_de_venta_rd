// ============================================
// SCRIPT DE TESTING - API ADAPTER
// ============================================
// Ejecutar en consola del navegador

import { apiAdapter } from './lib/api/apiAdapter.js';
import { db } from './lib/db/indexedDB.js';

class APIAdapterTester {
    constructor() {
        this.testResults = [];
    }

    log(message, type = 'info') {
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
        };
        console.log(`${emoji[type]} ${message}`);
    }

    async test(name, fn) {
        this.log(`\n🧪 Test: ${name}`, 'info');
        try {
            await fn();
            this.testResults.push({ name, status: 'passed' });
            this.log(`Test pasado: ${name}`, 'success');
        } catch (error) {
            this.testResults.push({ name, status: 'failed', error: error.message });
            this.log(`Test fallido: ${name} - ${error.message}`, 'error');
        }
    }

    // ==========================================
    // TEST 1: Verificar Estado de Conexión
    // ==========================================
    async testConnectionStatus() {
        await this.test('Verificar estado de conexión', async () => {
            const status = apiAdapter.getConnectionStatus();
            console.log('Estado de conexión:', status);

            if (!status.hasOwnProperty('online')) {
                throw new Error('Estado de conexión no tiene propiedad "online"');
            }

            console.log(`Modo actual: ${status.online ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
        });
    }

    // ==========================================
    // TEST 2: Guardar Productos de Prueba
    // ==========================================
    async testSaveTestProducts() {
        await this.test('Guardar productos de prueba en IndexedDB', async () => {
            const productosTest = [
                {
                    id: 1,
                    empresa_id: 1,
                    nombre: 'Coca Cola 2L',
                    codigo_barras: '7501055300006',
                    precio_venta: 50,
                    stock: 100,
                    activo: true,
                    categoria_id: 1,
                },
                {
                    id: 2,
                    empresa_id: 1,
                    nombre: 'Pepsi 2L',
                    codigo_barras: '7501055300013',
                    precio_venta: 45,
                    stock: 80,
                    activo: true,
                    categoria_id: 1,
                },
                {
                    id: 3,
                    empresa_id: 1,
                    nombre: 'Agua Mineral 1L',
                    codigo_barras: '7501055300020',
                    precio_venta: 20,
                    stock: 200,
                    activo: true,
                    categoria_id: 2,
                },
            ];

            for (const producto of productosTest) {
                await db.productos.put(producto);
            }

            console.log(`✅ ${productosTest.length} productos guardados en IndexedDB`);
        });
    }

    // ==========================================
    // TEST 3: Obtener Productos (Online/Offline)
    // ==========================================
    async testGetProductos() {
        await this.test('Obtener productos con API Adapter', async () => {
            const result = await apiAdapter.getProductos(1);

            console.log('Resultado:', {
                cantidad: result.data?.length || 0,
                source: result.source,
                offline: result.offline,
            });

            if (!result.data) {
                throw new Error('No se obtuvieron productos');
            }

            console.log('Productos obtenidos:', result.data);
        });
    }

    // ==========================================
    // TEST 4: Buscar Productos
    // ==========================================
    async testSearchProductos() {
        await this.test('Buscar productos por término', async () => {
            console.time('Búsqueda');
            const resultados = await apiAdapter.searchProductos('coca', 1);
            console.timeEnd('Búsqueda');

            console.log(`Resultados encontrados: ${resultados.length}`);
            console.log('Productos:', resultados);

            if (resultados.length === 0) {
                throw new Error('No se encontraron productos (asegúrate de tener datos en IndexedDB)');
            }
        });
    }

    // ==========================================
    // TEST 5: Crear Venta Offline
    // ==========================================
    async testCreateVentaOffline() {
        await this.test('Crear venta (modo actual)', async () => {
            const ventaData = {
                empresa_id: 1,
                cliente_id: null,
                numero_interno: `TEST-${Date.now()}`,
                fecha_venta: new Date().toISOString(),
                subtotal: 100,
                itbis: 18,
                total: 118,
                metodo_pago: 'efectivo',
                estado: 'completada',
                productos: [
                    {
                        producto_id: 1,
                        cantidad: 2,
                        precio_unitario: 50,
                        subtotal: 100,
                        descuento: 0,
                    },
                ],
            };

            const result = await apiAdapter.createVenta(ventaData);

            console.log('Resultado de venta:', {
                success: result.success,
                offline: result.offline,
                source: result.source,
                venta_id: result.venta?.id,
            });

            if (!result.success && !result.venta) {
                throw new Error('No se pudo crear la venta');
            }

            console.log('Venta creada:', result);
        });
    }

    // ==========================================
    // TEST 6: Obtener Venta por ID
    // ==========================================
    async testGetVentaById() {
        await this.test('Obtener venta por ID', async () => {
            // Primero obtener todas las ventas
            const ventas = await db.ventas.toArray();

            if (ventas.length === 0) {
                console.log('⚠️ No hay ventas en IndexedDB, saltando test');
                return;
            }

            const ventaId = ventas[0].id;
            console.log(`Buscando venta: ${ventaId}`);

            const venta = await apiAdapter.getVentaById(ventaId);

            if (!venta) {
                throw new Error('No se encontró la venta');
            }

            console.log('Venta encontrada:', venta);
        });
    }

    // ==========================================
    // TEST 7: Verificar IndexedDB
    // ==========================================
    async testVerifyIndexedDB() {
        await this.test('Verificar datos en IndexedDB', async () => {
            const stats = {
                productos: await db.productos.count(),
                ventas: await db.ventas.count(),
                clientes: await db.clientes.count(),
                sync_queue: await db.sync_queue.count(),
            };

            console.table(stats);

            if (stats.productos === 0) {
                console.log('⚠️ No hay productos en IndexedDB');
            }
        });
    }

    // ==========================================
    // TEST 8: Simular Cambio de Conexión
    // ==========================================
    async testConnectionChange() {
        await this.test('Simular cambio de conexión', async () => {
            console.log('Estado actual:', apiAdapter.getConnectionStatus());

            console.log('\n📝 Para probar cambios de conexión:');
            console.log('1. Abre DevTools → Network');
            console.log('2. Cambia entre "Online" y "Offline"');
            console.log('3. Observa los mensajes en consola:');
            console.log('   - 🟢 Conexión restaurada');
            console.log('   - 🔴 Sin conexión - Modo offline');
        });
    }

    // ==========================================
    // EJECUTAR TODOS LOS TESTS
    // ==========================================
    async runAll() {
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║   TEST SUITE - API ADAPTER            ║');
        console.log('╚════════════════════════════════════════╝\n');

        await this.testConnectionStatus();
        await this.testSaveTestProducts();
        await this.testVerifyIndexedDB();
        await this.testGetProductos();
        await this.testSearchProductos();
        await this.testCreateVentaOffline();
        await this.testGetVentaById();
        await this.testConnectionChange();

        // Resumen
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║   RESUMEN DE TESTS                    ║');
        console.log('╚════════════════════════════════════════╝\n');

        const passed = this.testResults.filter((t) => t.status === 'passed').length;
        const failed = this.testResults.filter((t) => t.status === 'failed').length;

        console.log(`✅ Tests pasados: ${passed}`);
        console.log(`❌ Tests fallidos: ${failed}`);
        console.log(`📊 Total: ${this.testResults.length}`);

        if (failed > 0) {
            console.log('\n❌ Tests fallidos:');
            this.testResults
                .filter((t) => t.status === 'failed')
                .forEach((t) => {
                    console.log(`  - ${t.name}: ${t.error}`);
                });
        }

        return {
            passed,
            failed,
            total: this.testResults.length,
            results: this.testResults,
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.APIAdapterTester = APIAdapterTester;
}

export default APIAdapterTester;
