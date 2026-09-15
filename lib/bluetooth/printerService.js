export class BluetoothPrinterService {
    constructor() {
        this.device = null;
        this.server = null;
        this.characteristic = null;
        this.isConnected = false;
    }

    // Solicitar dispositivo Bluetooth
    async requestDevice() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Serial Port Profile
                ],
                optionalServices: [
                    '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile
                ],
            });

            this.device = device;
            this.device.addEventListener('gattserverdisconnected', () => {
                this.isConnected = false;
                this.onDisconnected();
            });

            return device;
        } catch (error) {
            if (error.name === 'NotFoundError') {
                throw new Error('No se encontró impresora Bluetooth');
            } else if (error.name === 'SecurityError') {
                throw new Error('Permiso Bluetooth denegado');
            } else {
                throw new Error(`Error Bluetooth: ${error.message}`);
            }
        }
    }

    // Conectar a dispositivo
    async connect() {
        if (!this.device) {
            throw new Error('Dispositivo no seleccionado');
        }

        try {
            this.server = await this.device.gatt.connect();

            // Buscar servicio Serial Port
            const service = await this.server.getPrimaryService(
                '000018f0-0000-1000-8000-00805f9b34fb'
            );

            // Buscar característica de escritura
            this.characteristic = await service.getCharacteristic(
                '00002af1-0000-1000-8000-00805f9b34fb'
            );

            this.isConnected = true;
            return true;
        } catch (error) {
            throw new Error(`Error conectando: ${error.message}`);
        }
    }

    // Desconectar
    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.characteristic = null;
    }

    // Enviar datos ESC/POS
    async print(data) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('Impresora no conectada');
        }

        try {
            // Convertir string a ArrayBuffer
            const encoder = new TextEncoder();
            const buffer = encoder.encode(data);

            // Enviar en chunks de 20 bytes (límite BLE)
            const chunkSize = 20;
            for (let i = 0; i < buffer.length; i += chunkSize) {
                const chunk = buffer.slice(i, i + chunkSize);
                await this.characteristic.writeValue(chunk);

                // Pequeña pausa entre chunks
                await new Promise((resolve) => setTimeout(resolve, 10));
            }

            return { success: true };
        } catch (error) {
            throw new Error(`Error imprimiendo: ${error.message}`);
        }
    }

    // Callback de desconexión
    onDisconnected() {
        console.log('Impresora desconectada');
        // Emitir evento o notificar a la app
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('bluetooth-disconnected'));
        }
    }

    // Verificar soporte Bluetooth
    static isSupported() {
        return (
            typeof navigator !== 'undefined' &&
            'bluetooth' in navigator &&
            navigator.bluetooth !== undefined
        );
    }
}