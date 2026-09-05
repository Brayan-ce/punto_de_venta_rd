import {PrinterAdapter} from "@/utils/types/PrinterAdapter.interface";

const SPP_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';
const SPP_CHAR_UUID = '00001101-0000-1000-8000-00805f9b34fb';

export class WebBluetoothAdapter extends PrinterAdapter {
    constructor() {
        super();
        this.device = null;
        this.characteristic = null;
    }

    supportsESCPOS() {
        return true;
    }

    async listPrinters() {
        // Web Bluetooth API no permite listar dispositivos
        // Solo puede buscar mediante requestDevice()
        return [];
    }

    async connect() {
        if (typeof navigator === 'undefined' || !navigator.bluetooth) {
            throw new Error('Web Bluetooth no soportado en este navegador');
        }

        try {
            // Solicitar dispositivo Bluetooth
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [SPP_SERVICE_UUID] }],
            });

            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(SPP_SERVICE_UUID);
            this.characteristic = await service.getCharacteristic(SPP_CHAR_UUID);

            console.log('✅ Conectado vía Bluetooth');
            return true;
        } catch (error) {
            console.error('Error conectando Bluetooth:', error);
            throw new Error(`Error de conexión Bluetooth: ${error.message}`);
        }
    }

    async print(escposData) {
        if (!this.characteristic) {
            throw new Error('Bluetooth no conectado');
        }

        try {
            // Dividir en chunks (BLE tiene límite ~20 bytes)
            const chunkSize = 20;

            for (let i = 0; i < escposData.length; i += chunkSize) {
                const chunk = escposData.slice(i, i + chunkSize);
                await this.characteristic.writeValue(chunk);
                await new Promise((resolve) => setTimeout(resolve, 10));
            }

            return true;
        } catch (error) {
            console.error('Error imprimiendo vía Bluetooth:', error);
            throw new Error(`Error al imprimir: ${error.message}`);
        }
    }

    async disconnect() {
        if (this.device?.gatt?.connected) {
            await this.device.gatt.disconnect();
        }

        this.device = null;
        this.characteristic = null;

        console.log('✅ Bluetooth desconectado');
        return true;
    }

    async isConnected() {
        return this.device && this.device.gatt?.connected;
    }
}