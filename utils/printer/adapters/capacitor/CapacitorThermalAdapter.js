import {PrinterAdapter} from "@/utils/types/PrinterAdapter.interface";

/**
 * Adaptador Mock para Capacitor
 * Solo funciona cuando Capacitor está disponible (Android/iOS)
 * En web, lanza error informativo
 */
export class CapacitorThermalAdapter extends PrinterAdapter {
    constructor() {
        super();
        this.connected = false;
    }

    supportsESCPOS() {
        return true;
    }

    async listPrinters() {
        if (typeof window === 'undefined' || !window.Capacitor) {
            throw new Error('Capacitor no disponible. Esta función solo funciona en Android/iOS.');
        }

        // Acceder directamente al plugin inyectado
        const plugin = window.Capacitor?.Plugins?.CapacitorThermalPrinter;

        if (!plugin) {
            throw new Error('Plugin CapacitorThermalPrinter no instalado');
        }

        const result = await plugin.listPrinters();
        return result.printers || [];
    }

    async connect(printerAddress) {
        if (typeof window === 'undefined' || !window.Capacitor) {
            throw new Error('Capacitor no disponible');
        }

        const plugin = window.Capacitor?.Plugins?.CapacitorThermalPrinter;

        if (!plugin) {
            throw new Error('Plugin CapacitorThermalPrinter no instalado');
        }

        await plugin.connect({ address: printerAddress });
        this.connected = true;

        return true;
    }

    async print(escposData) {
        if (!this.connected) {
            throw new Error('Impresora no conectada');
        }

        if (typeof window === 'undefined' || !window.Capacitor) {
            throw new Error('Capacitor no disponible');
        }

        const plugin = window.Capacitor?.Plugins?.CapacitorThermalPrinter;

        if (!plugin) {
            throw new Error('Plugin no disponible');
        }

        await plugin.printRaw({ data: Array.from(escposData) });
        return true;
    }

    async disconnect() {
        if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.CapacitorThermalPrinter) {
            await window.Capacitor.Plugins.CapacitorThermalPrinter.disconnect();
        }

        this.connected = false;
        return true;
    }

    async isConnected() {
        return this.connected;
    }
}