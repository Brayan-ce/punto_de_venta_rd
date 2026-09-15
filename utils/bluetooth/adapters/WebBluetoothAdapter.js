import {
    PRINTER_UUIDS,
    SERVICE_UUID_LIST,
    WRITE_CHARACTERISTIC_LIST,
    BLUETOOTH_CONFIG,
    DEVICE_FILTERS
} from '../../bluetooth-config';

/**
 * Adaptador para Web Bluetooth API
 * Compatible con: Chrome/Edge en Android y Windows
 */
export class WebBluetoothAdapter {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
    }

    /**
     * Verificar si Web Bluetooth está disponible
     */
    async isSupported() {
        return (
            typeof navigator !== 'undefined' &&
            'bluetooth' in navigator &&
            typeof navigator.bluetooth.requestDevice === 'function'
        );
    }

    /**
     * Solicitar dispositivo al usuario (abre diálogo nativo)
     */
    async requestDevice() {
        try {
            console.log('🔍 Solicitando dispositivo Bluetooth...');

            this.device = await navigator.bluetooth.requestDevice({
                filters: DEVICE_FILTERS,
                optionalServices: SERVICE_UUID_LIST
            });

            console.log('✅ Dispositivo seleccionado:', this.device.name);

            // Listener para desconexión
            this.device.addEventListener('gattserverdisconnected', () => {
                console.log('❌ Dispositivo desconectado');
                this.isConnected = false;
            });

            return {
                id: this.device.id,
                name: this.device.name
            };

        } catch (error) {
            if (error.name === 'NotFoundError') {
                throw new Error('No se seleccionó ninguna impresora');
            }
            throw new Error('Error al solicitar dispositivo: ' + error.message);
        }
    }

    /**
     * Conectar al dispositivo y obtener característica de escritura
     */
    async connect(deviceInfo) {
        try {
            console.log('🔌 Conectando a', this.device?.name || deviceInfo?.name);

            if (!this.device) {
                throw new Error('Primero debes solicitar un dispositivo');
            }

            // Conectar al servidor GATT
            this.server = await this.device.gatt.connect();
            console.log('✅ Conectado al servidor GATT');

            // Intentar obtener servicio (probar múltiples UUIDs)
            this.service = await this._discoverService();
            console.log('✅ Servicio obtenido');

            // Obtener característica de escritura
            this.characteristic = await this._discoverCharacteristic();
            console.log('✅ Característica obtenida');

            this.isConnected = true;
            return true;

        } catch (error) {
            this.isConnected = false;
            throw new Error('Error al conectar: ' + error.message);
        }
    }

    /**
     * Descubrir servicio de impresora (prueba múltiples UUIDs)
     */
    async _discoverService() {
        for (const uuid of SERVICE_UUID_LIST) {
            try {
                const service = await this.server.getPrimaryService(uuid);
                console.log('✅ Servicio encontrado:', uuid);
                return service;
            } catch (error) {
                console.log('⏭️  Servicio no encontrado:', uuid);
                continue;
            }
        }

        throw new Error('No se encontró ningún servicio compatible');
    }

    /**
     * Descubrir característica de escritura
     */
    async _discoverCharacteristic() {
        // Intentar UUIDs conocidos
        for (const uuid of WRITE_CHARACTERISTIC_LIST) {
            try {
                const char = await this.service.getCharacteristic(uuid);
                console.log('✅ Característica encontrada:', uuid);
                return char;
            } catch (error) {
                console.log('⏭️  Característica no encontrada:', uuid);
                continue;
            }
        }

        // Si no funciona, obtener todas las características y buscar una con WRITE
        try {
            const characteristics = await this.service.getCharacteristics();
            console.log('📝 Características disponibles:', characteristics.length);

            for (const char of characteristics) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                    console.log('✅ Característica de escritura automática:', char.uuid);
                    return char;
                }
            }
        } catch (error) {
            console.error('Error al buscar características:', error);
        }

        throw new Error('No se encontró característica de escritura');
    }

    /**
     * Imprimir (enviar comandos ESC/POS)
     */
    async print(escposCommands) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('No hay dispositivo conectado');
        }

        try {
            console.log('🖨️  Imprimiendo...', escposCommands.length, 'caracteres');

            // Convertir a Uint8Array
            const encoder = new TextEncoder();
            const data = encoder.encode(escposCommands);

            // Enviar en chunks (BLE tiene límite de ~512 bytes por transmisión)
            const chunkSize = BLUETOOTH_CONFIG.CHUNK_SIZE;
            const totalChunks = Math.ceil(data.length / chunkSize);

            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                const chunkNumber = Math.floor(i / chunkSize) + 1;

                console.log(`📦 Enviando chunk ${chunkNumber}/${totalChunks}`);

                // Enviar chunk
                await this.characteristic.writeValue(chunk);

                // Pequeño delay para evitar sobrecarga
                await this._delay(BLUETOOTH_CONFIG.CHUNK_DELAY);
            }

            console.log('✅ Impresión completada');
            return true;

        } catch (error) {
            console.error('❌ Error al imprimir:', error);
            throw new Error('Error al imprimir: ' + error.message);
        }
    }

    /**
     * Desconectar
     */
    async disconnect() {
        try {
            if (this.device && this.device.gatt.connected) {
                await this.device.gatt.disconnect();
                console.log('✅ Desconectado');
            }
        } catch (error) {
            console.error('Error al desconectar:', error);
        } finally {
            this.device = null;
            this.server = null;
            this.service = null;
            this.characteristic = null;
            this.isConnected = false;
        }
    }

    /**
     * Verificar si está conectado
     */
    async isDeviceConnected() {
        return this.device && this.device.gatt.connected && this.isConnected;
    }

    /**
     * Utilidad: delay
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
