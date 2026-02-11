/**
 * Encoder ESC/POS con fallback
 * Intenta usar esc-pos-encoder si está disponible
 * Si no, genera un formato básico manual
 */
export class ESCPOSEncoder {
    static async encode(ticketData) {
        if (typeof window === 'undefined') {
            throw new Error('ESC/POS encoder solo disponible en cliente');
        }

        try {
            // Intentar importar esc-pos-encoder
            const { default: EscPosEncoder } = await import('esc-pos-encoder');
            return this.encodeWithLibrary(ticketData, EscPosEncoder);
        } catch (error) {
            console.warn('esc-pos-encoder no disponible, usando encoder básico');
            return this.encodeBasic(ticketData);
        }
    }

    /**
     * Codificar usando librería esc-pos-encoder
     */
    static encodeWithLibrary(ticketData, EscPosEncoder) {
        const encoder = new EscPosEncoder();

        encoder.initialize();

        // HEADER
        encoder
            .align('center')
            .bold(true)
            .size('normal')
            .text(ticketData.empresa.nombre)
            .newline()
            .size('small')
            .bold(false)
            .text(ticketData.empresa.direccion)
            .newline()
            .text(`RNC: ${ticketData.empresa.rnc}`)
            .newline()
            .text(`Tel: ${ticketData.empresa.telefono}`)
            .newline()
            .newline();

        // INFORMACIÓN VENTA
        encoder
            .align('left')
            .text(`Fecha: ${ticketData.fecha}`)
            .newline()
            .text(`Vendedor: ${ticketData.vendedor}`)
            .newline()
            .text(`NCF: ${ticketData.ncf || 'N/A'}`)
            .newline()
            .text(''.padEnd(32, '-'))
            .newline();

        // PRODUCTOS
        ticketData.productos.forEach((item) => {
            const nombre = this.truncate(item.nombre, 32);
            const detalle = `${item.cantidad}x @${this.formatMoney(item.precio)} = ${this.formatMoney(item.subtotal)}`;

            encoder.text(nombre).newline().text(detalle).newline();
        });

        // TOTALES
        encoder
            .text(''.padEnd(32, '-'))
            .newline()
            .align('right')
            .bold(true)
            .text(`SUBTOTAL: ${this.formatMoney(ticketData.subtotal)}`)
            .newline()
            .text(`ITBIS 18%: ${this.formatMoney(ticketData.itbis)}`)
            .newline()
            .size('normal')
            .text(`TOTAL: ${this.formatMoney(ticketData.total)}`)
            .size('small')
            .bold(false)
            .newline()
            .align('left')
            .text(''.padEnd(32, '-'))
            .newline();

        // PAGO
        encoder
            .text(`Método: ${ticketData.metodoPago}`)
            .newline()
            .text(`Recibido: ${this.formatMoney(ticketData.recibido || ticketData.total)}`)
            .newline()
            .text(`Cambio: ${this.formatMoney(ticketData.cambio || 0)}`)
            .newline();

        // FOOTER
        encoder
            .align('center')
            .text('¡Gracias por su compra!')
            .newline()
            .text('Vuelva pronto')
            .newline()
            .newline()
            .newline();

        encoder.cut();

        return encoder.encode();
    }

    /**
     * Encoder básico sin dependencias
     * Genera comandos ESC/POS manualmente
     */
    static encodeBasic(ticketData) {
        const ESC = '\x1B';
        const commands = [];

        // Inicializar
        commands.push(`${ESC}@`);

        // Centrar
        commands.push(`${ESC}a1`);

        // Bold
        commands.push(`${ESC}E1`);
        commands.push(ticketData.empresa.nombre + '\n');
        commands.push(`${ESC}E0`);

        // Info empresa
        commands.push(ticketData.empresa.direccion + '\n');
        commands.push(`RNC: ${ticketData.empresa.rnc}\n`);
        commands.push(`Tel: ${ticketData.empresa.telefono}\n\n`);

        // Alinear izquierda
        commands.push(`${ESC}a0`);
        commands.push(`Fecha: ${ticketData.fecha}\n`);
        commands.push(`Vendedor: ${ticketData.vendedor}\n`);
        commands.push(`NCF: ${ticketData.ncf || 'N/A'}\n`);
        commands.push('-'.repeat(32) + '\n');

        // Productos
        ticketData.productos.forEach(p => {
            commands.push(`${p.cantidad}x ${this.truncate(p.nombre, 25)}\n`);
            commands.push(`   ${this.formatMoney(p.subtotal)}\n`);
        });

        commands.push('-'.repeat(32) + '\n');

        // Totales
        commands.push(`SUBTOTAL: ${this.formatMoney(ticketData.subtotal)}\n`);
        commands.push(`ITBIS 18%: ${this.formatMoney(ticketData.itbis)}\n`);
        commands.push(`${ESC}E1TOTAL: ${this.formatMoney(ticketData.total)}${ESC}E0\n`);
        commands.push('-'.repeat(32) + '\n');

        // Pago
        commands.push(`Método: ${ticketData.metodoPago}\n`);
        commands.push(`Recibido: ${this.formatMoney(ticketData.recibido || ticketData.total)}\n`);
        commands.push(`Cambio: ${this.formatMoney(ticketData.cambio || 0)}\n\n`);

        // Footer centrado
        commands.push(`${ESC}a1`);
        commands.push('¡Gracias por su compra!\n');
        commands.push('Vuelva pronto\n\n\n');

        // Cortar papel
        commands.push(`${ESC}i`);

        // Convertir a Uint8Array
        const text = commands.join('');
        const bytes = new Uint8Array(text.length);

        for (let i = 0; i < text.length; i++) {
            bytes[i] = text.charCodeAt(i);
        }

        return bytes;
    }

    static formatMoney(amount) {
        return `RD$${parseFloat(amount).toFixed(2)}`;
    }

    static truncate(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}
