// ============================================
// CONFIGURACIÓN BLUETOOTH - ISIWEEK POS
// UUIDs de impresoras térmicas comunes
// ============================================

/**
 * UUIDs de servicios y características Bluetooth
 * para impresoras térmicas ESC/POS
 */
export const PRINTER_UUIDS = {
    // Servicio genérico (más común)
    GENERIC_SERVICE: '000018f0-0000-1000-8000-00805f9b34fb',
    GENERIC_WRITE: '00002af1-0000-1000-8000-00805f9b34fb',

    // Puerto serial SPP (Serial Port Profile)
    SERIAL_PORT_SERVICE: '00001101-0000-1000-8000-00805f9b34fb',

    // Xprinter (muy común en República Dominicana)
    XPRINTER_SERVICE: '0000ffe0-0000-1000-8000-00805f9b34fb',
    XPRINTER_WRITE: '0000ffe1-0000-1000-8000-00805f9b34fb',

    // Epson TM series
    EPSON_SERVICE: '000018f0-0000-1000-8000-00805f9b34fb',
    EPSON_WRITE: '00002af1-0000-1000-8000-00805f9b34fb',

    // Rongta
    RONGTA_SERVICE: '0000ffe0-0000-1000-8000-00805f9b34fb',
    RONGTA_WRITE: '0000ffe1-0000-1000-8000-00805f9b34fb',
};

/**
 * Lista de UUIDs de servicios a intentar (en orden de prioridad)
 * Se prueban uno por uno hasta encontrar uno compatible
 */
export const SERVICE_UUID_LIST = [
    PRINTER_UUIDS.XPRINTER_SERVICE,      // Prioridad 1: Xprinter (más común en RD)
    PRINTER_UUIDS.GENERIC_SERVICE,       // Prioridad 2: Genérico
    PRINTER_UUIDS.SERIAL_PORT_SERVICE,   // Prioridad 3: SPP
    PRINTER_UUIDS.RONGTA_SERVICE,        // Prioridad 4: Rongta
];

/**
 * Lista de UUIDs de características de escritura
 */
export const WRITE_CHARACTERISTIC_LIST = [
    PRINTER_UUIDS.XPRINTER_WRITE,
    PRINTER_UUIDS.GENERIC_WRITE,
    PRINTER_UUIDS.RONGTA_WRITE,
];

/**
 * Configuración de conexión y transmisión
 */
export const BLUETOOTH_CONFIG = {
    // Tamaño de chunk para envío BLE (bytes)
    // BLE tiene límite de ~512 bytes por transmisión
    CHUNK_SIZE: 512,

    // Delay entre chunks (ms)
    // Evita sobrecarga de la impresora
    CHUNK_DELAY: 50,

    // Intentos de reconexión
    RECONNECT_ATTEMPTS: 3,

    // Delay entre intentos de reconexión (ms)
    RECONNECT_DELAY: 2000,

    // Timeout de conexión (ms)
    CONNECTION_TIMEOUT: 10000,

    // Tiempo de caché de última impresora (días)
    CACHE_DAYS: 7,
};

/**
 * Filtros para el diálogo de selección de dispositivos
 * Ayuda a mostrar solo impresoras relevantes
 */
export const DEVICE_FILTERS = [
    { namePrefix: 'RP' },        // Rongta
    { namePrefix: 'XP' },        // Xprinter
    { namePrefix: 'TM' },        // Epson TM
    { namePrefix: 'BT-' },       // Genéricas
    { namePrefix: 'Printer' },   // Genéricas
    { namePrefix: 'POS' },       // Point of Sale
    { services: SERVICE_UUID_LIST }
];

/**
 * Anchos de papel soportados (caracteres por línea)
 */
export const PAPER_WIDTHS = {
    MM_58: 32,  // 58mm = 32 caracteres
    MM_80: 48,  // 80mm = 48 caracteres
};
