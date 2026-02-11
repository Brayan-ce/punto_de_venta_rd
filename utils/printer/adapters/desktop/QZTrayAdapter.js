import {PrinterAdapter} from "@/utils/types/PrinterAdapter.interface";

export class QZTrayAdapter extends PrinterAdapter {
    constructor() {
        super();
        this.printerName = null;
    }

    supportsESCPOS() {
        return true;
    }

    async listPrinters() {
        if (typeof window === 'undefined') {
            throw new Error('QZ Tray solo funciona en navegador');
        }

        if (!window.qz) {
            throw new Error('QZ Tray no está instalado o cargado');
        }

        if (!window.qz.websocket.isActive()) {
            await window.qz.websocket.connect();
        }

        return window.qz.printers.find();
    }

    async connect(printerName) {
        this.printerName = printerName;
        console.log(`✅ Impresora seleccionada: ${printerName}`);
        return true;
    }

    async print(escposData) {
        if (!this.printerName) {
            throw new Error('Impresora no seleccionada');
        }

        if (typeof window === 'undefined' || !window.qz) {
            throw new Error('QZ Tray no disponible');
        }

        const config = window.qz.configs.create(this.printerName);
        return window.qz.print(config, escposData);
    }

    async disconnect() {
        // QZ mantiene conexión persistente
        this.printerName = null;
        return true;
    }

    async isConnected() {
        return (
            typeof window !== 'undefined' &&
            window.qz?.websocket?.isActive() &&
            !!this.printerName
        );
    }
}