'use client';

import { useEffect, useState } from 'react';
import { PrinterService } from '@/utils/printer/core/PrinterService';
import styles from './PrinterButton.module.css';

import {
    FaPrint,
    FaSpinner,
    FaCheckCircle,
    FaTimes,
    FaLink,
    FaPlug,
    FaExclamationTriangle,
    FaExclamationCircle,
} from 'react-icons/fa';

/**
 * ==========================================
 * COMPONENTE PRINTER BUTTON
 * ==========================================
 *
 * Botón inteligente para imprimir tickets POS
 *
 * CARACTERÍSTICAS:
 * - ✅ Compatible con Next.js App Router (SSR-safe)
 * - ✅ Detección automática de plataforma (Web/PWA/Capacitor/Desktop)
 * - ✅ Manejo robusto de estados y errores
 * - ✅ Modo compacto y normal
 * - ✅ Reconexión automática si aplica
 *
 * PROPS:
 * @param {string} ventaId - ID de la venta a imprimir
 * @param {boolean} compact - Modo compacto (solo íconos)
 * @param {function} onServiceReady - Callback cuando el servicio esté listo
 *
 * PLATAFORMAS SOPORTADAS:
 * - Android/iOS: Capacitor Thermal Printer
 * - Desktop: QZ Tray
 * - Web/PWA: Web Bluetooth API (limitado)
 */
export default function PrinterButton({ ventaId, compact = false, onServiceReady }) {

    // ==========================================
    // ESTADO DEL COMPONENTE
    // ==========================================

    const [printerService, setPrinterService] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('Inicializando sistema de impresión...');
    const [error, setError] = useState(null);

    // ==========================================
    // INICIALIZACIÓN DEL SERVICIO
    // ==========================================

    /**
     * Hook de inicialización
     *
     * IMPORTANTE: Solo se ejecuta en el cliente (nunca en SSR)
     * Esto evita errores de "window is not defined" en Next.js
     *
     * PROCESO:
     * 1. Detecta automáticamente la plataforma (Capacitor/QZ/Bluetooth)
     * 2. Crea el adaptador correcto
     * 3. Verifica si ya hay una conexión activa
     * 4. Actualiza el estado inicial
     */
    useEffect(() => {
        // Flag para evitar actualizaciones de estado si el componente se desmonta
        let mounted = true;

        (async () => {
            try {
                // ==========================================
                // PASO 1: Crear servicio según plataforma
                // ==========================================
                // PrinterService.create() detecta automáticamente:
                // - Si estamos en Capacitor (Android/iOS) → CapacitorThermalAdapter
                // - Si existe QZ Tray (Desktop) → QZTrayAdapter
                // - Si hay Bluetooth Web API → WebBluetoothAdapter
                // - Si nada está disponible → Lanza error
                const service = await PrinterService.create();

                // Verificar que el componente sigue montado antes de actualizar estado
                if (!mounted) return;

                setPrinterService(service);

                // ==========================================
                // PASO 2: Notificar al componente padre (opcional)
                // ==========================================
                // Útil si el padre necesita acceso directo al servicio
                // Por ejemplo: para ocultar otros controles de impresión
                if (onServiceReady) {
                    onServiceReady(service);
                }

                // ==========================================
                // PASO 3: Verificar estado inicial de conexión
                // ==========================================
                // Algunos adaptadores mantienen conexiones persistentes:
                // - QZ Tray: Se conecta al iniciar y mantiene conexión
                // - Capacitor: Requiere conexión manual cada vez
                // - Web Bluetooth: Requiere interacción del usuario
                const connected = await service.adapter?.isConnected?.();
                setIsConnected(!!connected);

                setStatus(
                    connected
                        ? '✅ Impresora lista para usar'
                        : '⚠️ Sistema listo. Debe conectar una impresora.'
                );

            } catch (err) {
                console.error('❌ Error inicializando PrinterService:', err);

                if (!mounted) return;

                setError(`No se pudo iniciar el sistema de impresión: ${err.message}`);
                setStatus('❌ Error de inicialización');
            }
        })();

        // Cleanup: evitar memory leaks
        return () => {
            mounted = false;
        };
    }, [onServiceReady]); // Solo re-ejecutar si cambia onServiceReady

    // ==========================================
    // FUNCIÓN: CONECTAR IMPRESORA
    // ==========================================

    /**
     * Maneja la conexión con una impresora
     *
     * FLUJO:
     * 1. Lista impresoras disponibles (si el adaptador lo soporta)
     * 2. Selecciona automáticamente la primera (mejora: mostrar modal)
     * 3. Establece conexión
     * 4. Actualiza estado
     *
     * CASOS ESPECIALES:
     * - Web Bluetooth: Abre selector nativo del navegador
     * - QZ Tray: Lista impresoras del sistema
     * - Capacitor: Lista impresoras Bluetooth emparejadas
     */
    async function handleConnect() {
        // Validación inicial
        if (!printerService) {
            setError('Servicio de impresión no disponible');
            return;
        }

        setIsLoading(true);
        setError(null);
        setStatus('🔍 Buscando impresoras disponibles...');

        try {
            let printerId = null;

            // ==========================================
            // PASO 1: Listar impresoras (si aplica)
            // ==========================================
            // NOTA: Web Bluetooth NO soporta listar, abre selector directamente
            if (printerService.adapter?.listPrinters) {
                const printers = await printerService.adapter.listPrinters();

                // Si encontramos impresoras, seleccionar la primera
                // TODO: MEJORA - Mostrar modal/dropdown para que el usuario elija
                if (Array.isArray(printers) && printers.length > 0) {
                    printerId = printers[0];
                    console.log(`📋 Impresoras encontradas: ${printers.join(', ')}`);
                    console.log(`✅ Seleccionada automáticamente: ${printerId}`);
                } else {
                    throw new Error('No se encontraron impresoras disponibles');
                }
            }

            // ==========================================
            // PASO 2: Establecer conexión
            // ==========================================
            setStatus('🔌 Conectando a impresora...');
            await printerService.adapter.connect(printerId);

            // ==========================================
            // PASO 3: Actualizar estado exitoso
            // ==========================================
            setIsConnected(true);
            setStatus('✅ Impresora conectada correctamente');

            console.log(`✅ Conectado a: ${printerId || 'Impresora Bluetooth/USB'}`);

        } catch (err) {
            console.error('❌ Error conectando impresora:', err);
            setError(`Error de conexión: ${err.message}`);
            setStatus('❌ Fallo en la conexión');
        } finally {
            setIsLoading(false);
        }
    }

    // ==========================================
    // FUNCIÓN: IMPRIMIR TICKET
    // ==========================================

    /**
     * Imprime el ticket de una venta
     *
     * FLUJO COMPLETO:
     * 1. Obtiene datos de la venta desde la API
     * 2. Normaliza el formato (API → TicketData esperado)
     * 3. Genera el ticket en formato ESC/POS o imagen
     * 4. Envía a la impresora
     *
     * FORMATO TICKET:
     * - Empresa (nombre, RNC, dirección)
     * - Fecha, vendedor, NCF
     * - Productos (cantidad, precio, subtotal)
     * - Totales (subtotal, ITBIS, total)
     * - Método de pago, recibido, cambio
     */
    async function handlePrint() {
        // ==========================================
        // VALIDACIONES INICIALES
        // ==========================================
        if (!ventaId) {
            setError('No hay venta seleccionada para imprimir');
            return;
        }

        if (!printerService) {
            setError('Servicio de impresión no disponible');
            return;
        }

        setIsLoading(true);
        setError(null);
        setStatus('📥 Obteniendo datos de la venta...');

        try {
            // ==========================================
            // PASO 1: Obtener datos de la venta
            // ==========================================
            const response = await fetch(`/api/ventas/${ventaId}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const { success, venta, empresa, error: apiError } = await response.json();

            if (!success) {
                throw new Error(apiError || 'Error desconocido al obtener la venta');
            }

            // ==========================================
            // PASO 2: Normalizar datos al formato esperado
            // ==========================================
            // La API devuelve un formato, pero ESCPOSEncoder espera otro
            // Esta es la capa de adaptación
            const ticketData = {
                // Información de la empresa
                empresa: {
                    nombre: empresa.nombre_empresa || empresa.razon_social,
                    direccion: empresa.direccion,
                    rnc: empresa.rnc,
                    telefono: empresa.telefono,
                },

                // Información de la venta
                fecha: new Date(venta.fecha_venta).toLocaleString('es-DO', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                }),
                vendedor: venta.usuario_nombre,
                ncf: venta.ncf || 'N/A',

                // Productos vendidos
                productos: venta.productos.map((p) => ({
                    nombre: p.nombre_producto,
                    cantidad: p.cantidad,
                    precio: parseFloat(p.precio_unitario),
                    subtotal: parseFloat(p.total),
                })),

                // Totales (asegurar que sean números)
                subtotal: parseFloat(venta.subtotal),
                itbis: parseFloat(venta.itbis),
                total: parseFloat(venta.total),

                // Información de pago
                metodoPago: venta.metodo_pago_texto || 'Efectivo',
                recibido: parseFloat(venta.monto_recibido || venta.total),
                cambio: parseFloat(venta.devuelta || 0),
            };

            // ==========================================
            // PASO 3: Enviar a imprimir
            // ==========================================
            setStatus('🖨️ Enviando a impresora...');

            // PrinterService.print() automáticamente:
            // 1. Detecta si el adaptador soporta ESC/POS
            // 2. Si sí: usa ESCPOSEncoder
            // 3. Si no: usa ImageEncoder (fallback)
            // 4. Envía los bytes generados al adaptador
            await printerService.print(ticketData);

            // ==========================================
            // PASO 4: Éxito
            // ==========================================
            setStatus('✅ Ticket impreso correctamente');

            // Volver al estado "Listo" después de 3 segundos
            setTimeout(() => {
                setStatus('✅ Sistema listo');
            }, 3000);

            console.log('✅ Impresión completada exitosamente');

        } catch (err) {
            console.error('❌ Error imprimiendo ticket:', err);
            setError(`Error al imprimir: ${err.message}`);
            setStatus('❌ Error en la impresión');
        } finally {
            setIsLoading(false);
        }
    }

    // ==========================================
    // FUNCIÓN: DESCONECTAR IMPRESORA
    // ==========================================

    /**
     * Desconecta la impresora actual
     *
     * IMPORTANTE:
     * - QZ Tray: Mantiene conexión, solo limpia estado local
     * - Capacitor: Desconecta Bluetooth físicamente
     * - Web Bluetooth: Cierra GATT connection
     */
    async function handleDisconnect() {
        try {
            setStatus('🔌 Desconectando impresora...');

            // Llamar al método disconnect del adaptador
            await printerService?.adapter?.disconnect?.();

            // Actualizar estado local
            setIsConnected(false);
            setStatus('⚠️ Impresora desconectada');

            console.log('✅ Impresora desconectada correctamente');

        } catch (err) {
            console.error('❌ Error desconectando:', err);
            // Aún así marcar como desconectado localmente
            setIsConnected(false);
        }
    }

    // ==========================================
    // RENDERIZADO: MODO COMPACTO
    // ==========================================

    /**
     * UI minimalista para espacios reducidos
     * Solo muestra:
     * - Botón de conectar (si no está conectado)
     * - Botón de desconectar (si está conectado)
     */
    if (compact) {
        return (
            <div className={styles.compactContainer}>
                {!isConnected ? (
                    <button
                        onClick={handleConnect}
                        disabled={isLoading || !printerService}
                        className={styles.btnCompact}
                        title="Conectar impresora"
                        aria-label="Conectar impresora"
                    >
                        {isLoading ? (
                            <FaSpinner className={styles.spin} />
                        ) : (
                            <FaPrint />
                        )}
                    </button>
                ) : (
                    <button
                        onClick={handleDisconnect}
                        className={styles.btnCompactDisconnect}
                        title="Desconectar impresora"
                        aria-label="Desconectar impresora"
                    >
                        <FaTimes />
                    </button>
                )}
            </div>
        );
    }

    // ==========================================
    // RENDERIZADO: MODO NORMAL (UI COMPLETA)
    // ==========================================

    return (
        <div className={styles.container}>

            {/* ==========================================
          BARRA DE ESTADO
          Muestra el estado actual del sistema
          ========================================== */}
            <div className={styles.statusBar}>
        <span className={styles.statusIcon}>
          {isConnected ? (
              <FaCheckCircle color="#4caf50" title="Conectado" />
          ) : (
              <FaExclamationCircle color="#ef5350" title="Desconectado" />
          )}
        </span>
                <span className={styles.statusText}>{status}</span>
            </div>

            {/* ==========================================
          BANNER DE ERROR
          Solo visible cuando hay error
          Incluye botón para cerrar
          ========================================== */}
            {error && (
                <div className={styles.error} role="alert">
                    <FaExclamationTriangle />
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        aria-label="Cerrar error"
                        className={styles.closeError}
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* ==========================================
          BOTONES DE ACCIÓN
          Cambian según el estado de conexión
          ========================================== */}
            <div className={styles.buttons}>
                {!isConnected ? (
                    // Estado: DESCONECTADO → Mostrar botón de conectar
                    <button
                        onClick={handleConnect}
                        disabled={isLoading || !printerService}
                        className={styles.btnConnect}
                    >
                        {isLoading ? (
                            <>
                                <FaSpinner className={styles.spin} /> Conectando...
                            </>
                        ) : (
                            <>
                                <FaLink /> Conectar Impresora
                            </>
                        )}
                    </button>
                ) : (
                    // Estado: CONECTADO → Mostrar botones de imprimir y desconectar
                    <>
                        <button
                            onClick={handlePrint}
                            disabled={isLoading || !ventaId}
                            className={styles.btnPrint}
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className={styles.spin} /> Imprimiendo...
                                </>
                            ) : (
                                <>
                                    <FaPrint /> Imprimir Ticket
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleDisconnect}
                            disabled={isLoading}
                            className={styles.btnDisconnect}
                        >
                            <FaPlug /> Desconectar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}