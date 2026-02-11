// ============================================
// ESC/POS BUILDER - ISIWEEK POS
// Constructor de comandos para impresoras térmicas
// Basado en el sistema actual pero mejorado para Bluetooth
// ============================================

/**
 * Constructor de comandos ESC/POS
 * Genera comandos compatibles con impresoras térmicas estándar
 */
export class ESCPOSBuilder {
    constructor(paperWidth = 48) {
        this.commands = [];
        this.paperWidth = paperWidth; // 48 para 80mm, 32 para 58mm

        // Inicializar impresora
        this.init();
    }

    // ==========================================
    // COMANDOS BÁSICOS ESC/POS
    // ==========================================

    /**
     * Inicializar impresora (ESC @)
     */
    init() {
        this.commands.push('\x1B\x40');
        return this;
    }

    /**
     * Agregar texto
     */
    text(str) {
        this.commands.push(str);
        return this;
    }

    /**
     * Nueva línea
     */
    newLine(lines = 1) {
        this.commands.push('\n'.repeat(lines));
        return this;
    }

    /**
     * Texto en negrita (ESC E)
     */
    bold(enabled = true) {
        this.commands.push(enabled ? '\x1B\x45\x01' : '\x1B\x45\x00');
        return this;
    }

    /**
     * Subrayado (ESC -)
     */
    underline(enabled = true) {
        this.commands.push(enabled ? '\x1B\x2D\x01' : '\x1B\x2D\x00');
        return this;
    }

    /**
     * Alineación (ESC a)
     */
    align(alignment = 'left') {
        const alignments = {
            left: '\x1B\x61\x00',
            center: '\x1B\x61\x01',
            right: '\x1B\x61\x02'
        };
        this.commands.push(alignments[alignment] || alignments.left);
        return this;
    }

    /**
     * Tamaño de fuente (GS !)
     */
    fontSize(size = 'normal') {
        const sizes = {
            normal: '\x1D\x21\x00',          // Normal
            double: '\x1D\x21\x11',          // Doble ancho y alto
            doubleWidth: '\x1D\x21\x10',    // Doble ancho
            doubleHeight: '\x1D\x21\x01'    // Doble alto
        };
        this.commands.push(sizes[size] || sizes.normal);
        return this;
    }

    /**
     * Línea separadora
     */
    line(char = '-') {
        this.commands.push(char.repeat(this.paperWidth) + '\n');
        return this;
    }

    /**
     * Cortar papel (GS V)
     */
    cut(partial = false) {
        this.commands.push(partial ? '\x1D\x56\x01' : '\x1D\x56\x00');
        return this;
    }

    /**
     * Abrir cajón de dinero (ESC p)
     */
    openDrawer() {
        this.commands.push('\x1B\x70\x00\x19\xFA');
        return this;
    }

    // ==========================================
    // FUNCIONES DE UTILIDAD
    // ==========================================

    /**
     * Texto alineado izquierda-derecha
     */
    leftRight(left, right, spacer = ' ') {
        const totalSpace = this.paperWidth - left.length - right.length;
        if (totalSpace > 0) {
            this.commands.push(left + spacer.repeat(totalSpace) + right + '\n');
        } else {
            // Si no cabe, poner en líneas separadas
            this.commands.push(left + '\n' + right + '\n');
        }
        return this;
    }

    /**
     * Texto en columnas
     */
    columnText(columns, widths) {
        let line = '';
        columns.forEach((col, i) => {
            const width = widths[i] || Math.floor(this.paperWidth / columns.length);
            const text = (col || '').toString();

            if (text.length > width) {
                line += text.substring(0, width);
            } else {
                line += text + ' '.repeat(width - text.length);
            }
        });
        this.commands.push(line + '\n');
        return this;
    }

    /**
     * Generar string final
     */
    build() {
        return this.commands.join('');
    }

    /**
     * Generar buffer para Bluetooth (Uint8Array)
     */
    buildBuffer() {
        const text = this.build();
        const encoder = new TextEncoder();
        return encoder.encode(text);
    }
}

/**
 * Generador de ticket completo basado en datos de venta
 */
export function generateTicket(ventaData, empresaData, paperWidth = 48) {
    const builder = new ESCPOSBuilder(paperWidth);

    // === CABECERA ===
    builder
        .align('center')
        .bold(true)
        .fontSize('double')
        .text(empresaData.nombre || 'ISIWEEK POS')
        .newLine()
        .fontSize('normal')
        .bold(false)
        .text((empresaData.direccion || '').substring(0, paperWidth))
        .newLine()
        .text('RNC: ' + (empresaData.rnc || 'N/A'))
        .newLine()
        .text('Tel: ' + (empresaData.telefono || 'N/A'))
        .newLine()
        .line('=')
        .newLine();

    // === DATOS DE VENTA ===
    builder
        .align('left')
        .leftRight('Factura:', '#' + ventaData.id)
        .leftRight('Fecha:', new Date(ventaData.fecha_venta).toLocaleString('es-DO'));

    if (ventaData.vendedor_nombre) {
        builder.leftRight('Cajero:', ventaData.vendedor_nombre);
    }

    if (ventaData.cliente_nombre) {
        builder
            .leftRight('Cliente:', ventaData.cliente_nombre);

        if (ventaData.cliente_rnc) {
            builder.leftRight('RNC/Ced:', ventaData.cliente_rnc);
        }
    }

    if (ventaData.ncf) {
        builder.leftRight('NCF:', ventaData.ncf);
    }

    builder.line('-').newLine();

    // === PRODUCTOS ===
    builder
        .bold(true)
        .columnText(['CANT', 'DESCRIPCIÓN', 'PRECIO', 'TOTAL'], [4, 24, 10, 10])
        .bold(false)
        .line('-');

    (ventaData.detalles || []).forEach(detalle => {
        const cantidad = detalle.cantidad.toString();
        const nombre = (detalle.producto_nombre || 'Producto').substring(0, 24);
        const precio = 'RD$' + parseFloat(detalle.precio_unitario || 0).toFixed(2);
        const total = 'RD$' + parseFloat(detalle.subtotal || 0).toFixed(2);

        builder.columnText([cantidad, nombre, precio, total], [4, 24, 10, 10]);
    });

    builder.line('-').newLine();

    // === TOTALES ===
    const subtotal = parseFloat(ventaData.subtotal || 0);
    const descuento = parseFloat(ventaData.descuento || 0);
    const itbis = parseFloat(ventaData.itbis || 0);
    const total = parseFloat(ventaData.total || 0);

    builder
        .align('right')
        .text('Subtotal: RD$' + subtotal.toFixed(2))
        .newLine();

    if (descuento > 0) {
        builder.text('Descuento: -RD$' + descuento.toFixed(2)).newLine();
    }

    if (itbis > 0) {
        builder.text('ITBIS (18%): RD$' + itbis.toFixed(2)).newLine();
    }

    // Extras
    if (ventaData.extras && ventaData.extras.length > 0) {
        ventaData.extras.forEach(extra => {
            const monto = parseFloat(extra.monto || 0);
            const signo = monto >= 0 ? '+' : '';
            builder.text(`${extra.concepto}: ${signo}RD$${monto.toFixed(2)}`).newLine();
        });
    }

    builder
        .line('=')
        .bold(true)
        .fontSize('doubleWidth')
        .text('TOTAL: RD$' + total.toFixed(2))
        .fontSize('normal')
        .bold(false)
        .newLine()
        .line('=');

    // === MÉTODO DE PAGO ===
    builder
        .align('left')
        .newLine()
        .leftRight('Método Pago:', ventaData.metodo_pago || 'Efectivo');

    if (ventaData.metodo_pago === 'efectivo' && ventaData.monto_recibido) {
        const recibido = parseFloat(ventaData.monto_recibido);
        const cambio = recibido - total;

        builder
            .leftRight('Recibido:', 'RD$' + recibido.toFixed(2))
            .leftRight('Cambio:', 'RD$' + cambio.toFixed(2));
    }

    builder.newLine();

    // === MENSAJES ===
    if (empresaData.mensaje_ticket) {
        builder
            .align('center')
            .line('-')
            .text(empresaData.mensaje_ticket)
            .newLine();
    }

    if (empresaData.mensaje_fiscal) {
        builder
            .text(empresaData.mensaje_fiscal)
            .newLine();
    }

    builder
        .newLine()
        .text('Gracias por su compra')
        .newLine()
        .text('www.isiweek.com')
        .newLine(3);

    // Cortar papel
    builder.cut();

    return builder.build();
}
