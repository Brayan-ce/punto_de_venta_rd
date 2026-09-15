import {PrinterFactory} from "@/utils/printer/core/PrinterFactory";

/**
 * Servicio central de impresión
 * Usa el adaptador correcto automáticamente
 */
export class PrinterService {
    /**
     * Crear servicio (detecta plataforma automáticamente)
     */
    static async create() {
        const adapter = await PrinterFactory.create();
        return new PrinterService(adapter);
    }

    constructor(adapter) {
        this.adapter = adapter;
    }

    async listPrinters() {
        return this.adapter.listPrinters();
    }

    async connect(printerId) {
        console.log(`🔌 Conectando a impresora: ${printerId}`);
        return this.adapter.connect(printerId);
    }

    async isConnected() {
        return this.adapter.isConnected?.() ?? false;
    }

    /**
     * Imprimir ticket
     */
    async print(ticketData) {
        console.log('🖨️ Preparando impresión...');

        if (this.adapter.printsFromTicketData?.()) {
            await this.adapter.print(ticketData)
            console.log('✅ Impresión completada')
            return
        }

        // Renderizar según capacidades
        const printable = await this.renderTicket(ticketData);

        // Enviar a impresora
        await this.adapter.print(printable);

        console.log('✅ Impresión completada');
    }

    /**
     * Renderizar ticket según adaptador
     */
    async renderTicket(ticketData) {
        const supportsESCPOS = this.adapter.supportsESCPOS?.() ?? false;

        if (supportsESCPOS) {
            const { ESCPOSEncoder } = await import('../encoders/escpos/ESCPOSEncoder');
            return ESCPOSEncoder.encode(ticketData);
        } else {
            const { ImageEncoder } = await import('../encoders/image/ImageEncoder');
            return ImageEncoder.encode(ticketData);
        }
    }

    async disconnect() {
        console.log('🔌 Desconectando impresora...');
        return this.adapter.disconnect();
    }

    /**
     * Test de impresión
     */
    async printTest() {
        const testTicket = {
            empresa: {
                nombre: 'Test Empresa RD',
                direccion: 'Calle Duarte #123, Santo Domingo',
                rnc: '130-12345-6',
                telefono: '809-555-0123',
            },
            fecha: new Date().toLocaleDateString('es-DO'),
            vendedor: 'Usuario Test',
            ncf: 'B0100000001',
            productos: [
                { nombre: 'Producto Test 1', cantidad: 2, precio: 100, subtotal: 200 },
                { nombre: 'Producto Test 2', cantidad: 1, precio: 50, subtotal: 50 },
            ],
            subtotal: 250,
            itbis: 45,
            total: 295,
            metodoPago: 'Efectivo',
            recibido: 300,
            cambio: 5,
        };

        await this.print(testTicket);
    }
}