/**
 * Factory para detectar y crear el adaptador correcto según la plataforma
 */
export class PrinterFactory {
    static async create() {
        // Verificar que estamos en cliente
        if (typeof window !== 'undefined' && window.qz) {
            const {QZTrayAdapter} = await import('../adapters/desktop/QZTrayAdapter');
            return new QZTrayAdapter();
        }

        console.log('🖨️ Detectando plataforma de impresión...');

        // 1. CAPACITOR (Android/iOS) - PRIORIDAD
        if (window.Capacitor?.isNativePlatform()) {
            console.log('✅ Plataforma: Capacitor (Android/iOS)');
            const {CapacitorThermalAdapter} = await import(
                '../adapters/capacitor/CapacitorThermalAdapter'
                );
            return new CapacitorThermalAdapter();
        }

        // 2. QZ TRAY (Desktop)
        if (typeof window.qz !== 'undefined') {
            console.log('✅ Plataforma: QZ Tray (Desktop)');
            const {QZTrayAdapter} = await import('../adapters/desktop/QZTrayAdapter');
            return new QZTrayAdapter();
        }

        // 3. WEB BLUETOOTH (PWA fallback)
        if ('bluetooth' in navigator) {
            console.log('⚠️ Plataforma: Web Bluetooth (limitado)');
            const {WebBluetoothAdapter} = await import('../adapters/web/WebBluetoothAdapter');
            return new WebBluetoothAdapter();
        }

        throw new Error('No hay sistema de impresión compatible en este dispositivo');
    }
}