/**
 * Interfaz base para todos los adaptadores de impresora
 */
export class PrinterAdapter {
    supportsESCPOS() {
        return false;
    }

    async listPrinters() {
        throw new Error('listPrinters() no implementado');
    }

    async connect(printerId) {
        throw new Error('connect() no implementado');
    }

    async print(data) {
        throw new Error('print() no implementado');
    }

    async disconnect() {
        return true;
    }

    async isConnected() {
        return false;
    }
}