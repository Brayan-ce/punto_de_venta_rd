import { generarTicketESCPOS } from '@/utils/escpos';
import { BluetoothPrinterService } from './printerService';

export class BluetoothESCPOS {
    constructor() {
        this.printer = new BluetoothPrinterService();
    }

    // Imprimir ticket de venta
    async imprimirTicket(venta, empresa, anchoLinea = 32) {
        try {
            // Conectar si no está conectado
            if (!this.printer.isConnected) {
                await this.printer.requestDevice();
                await this.printer.connect();
            }

            // Generar comando ESC/POS
            const ticketData = generarTicketESCPOS(venta, empresa, anchoLinea);

            // Imprimir
            await this.printer.print(ticketData);

            return { success: true, message: 'Ticket impreso correctamente' };
        } catch (error) {
            throw error;
        }
    }

    // Desconectar
    async desconectar() {
        await this.printer.disconnect();
    }

    // Verificar si está conectado
    isConnected() {
        return this.printer.isConnected;
    }
}