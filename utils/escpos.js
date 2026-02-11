export class ESCPOSBuilder {
    constructor() {
        this.commands = [];
    }

    ESC = '\x1B';
    GS = '\x1D';
    LF = '\x0A';

    init() {
        this.commands.push(this.ESC + '@');
        return this;
    }

    alignLeft() {
        this.commands.push(this.ESC + 'a\x00');
        return this;
    }

    alignCenter() {
        this.commands.push(this.ESC + 'a\x01');
        return this;
    }

    alignRight() {
        this.commands.push(this.ESC + 'a\x02');
        return this;
    }

    bold(enable = true) {
        this.commands.push(this.ESC + 'E' + (enable ? '\x01' : '\x00'));
        return this;
    }

    textSize(width = 1, height = 1) {
        const size = ((width - 1) << 4) | (height - 1);
        this.commands.push(this.GS + '!' + String.fromCharCode(size));
        return this;
    }

    text(str) {
        this.commands.push(str);
        return this;
    }

    newLine(lines = 1) {
        for (let i = 0; i < lines; i++) {
            this.commands.push(this.LF);
        }
        return this;
    }

    line(char = '-', width = 32) {
        this.commands.push(char.repeat(width) + this.LF);
        return this;
    }

    doubleLine(char = '=', width = 32) {
        this.line(char, width);
        return this;
    }

    cut() {
        this.commands.push(this.GS + 'V\x41');
        return this;
    }

    build() {
        return this.commands.join('');
    }
}

export function generarTicketESCPOS(venta, empresa, anchoLinea = 32) {
    const builder = new ESCPOSBuilder();
    
    builder.init();
    builder.alignCenter();
    
    builder.bold(true).textSize(2, 2);
    builder.text(empresa.nombre_empresa).newLine();
    
    builder.textSize(1, 1).bold(false);
    builder.text(empresa.razon_social).newLine();
    builder.text('RNC: ' + empresa.rnc).newLine();
    builder.text(empresa.direccion).newLine();
    if (empresa.telefono) {
        builder.text('Tel: ' + empresa.telefono).newLine();
    }
    
    builder.alignLeft();
    builder.line('-', anchoLinea);
    
    builder.alignCenter().bold(true);
    builder.text(venta.tipo_comprobante_nombre).newLine();
    builder.text('NCF: ' + venta.ncf).newLine();
    builder.text('No. ' + venta.numero_interno).newLine();
    builder.bold(false);
    
    builder.alignLeft();
    builder.line('-', anchoLinea);
    
    const fecha = new Date(venta.fecha_venta);
    const fechaStr = String(fecha.getDate()).padStart(2, '0') + '/' + 
                     String(fecha.getMonth() + 1).padStart(2, '0') + '/' + 
                     fecha.getFullYear() + ' ' + 
                     String(fecha.getHours()).padStart(2, '0') + ':' + 
                     String(fecha.getMinutes()).padStart(2, '0');
    
    builder.text('Fecha: ' + fechaStr).newLine();
    builder.text('Vendedor: ' + venta.usuario_nombre).newLine();
    
    if (venta.cliente_id) {
        builder.text('Cliente: ' + venta.cliente_nombre).newLine();
        builder.text(venta.cliente_tipo_documento + ': ' + venta.cliente_numero_documento).newLine();
    } else {
        builder.text('Cliente: Consumidor Final').newLine();
    }
    
    builder.line('-', anchoLinea);
    
    builder.text('Cant  Descripcion    Total').newLine();
    builder.line('-', anchoLinea);
    
    venta.productos.forEach(producto => {
        // Determinar unidad de medida
        const unidadVenta = producto.unidad_venta_abreviatura || producto.unidad_base_abreviatura || '';
        const unidadBase = producto.unidad_base_abreviatura || '';
        const hayConversion = producto.cantidad_base && 
                             producto.cantidad_base !== producto.cantidad &&
                             unidadVenta !== unidadBase &&
                             producto.unidad_medida_id !== producto.producto_unidad_base_id;
        
        // Formatear cantidad con unidad
        const cantidadFormateada = parseFloat(producto.cantidad).toFixed(3).replace(/\.?0+$/, '');
        let cantidadTexto = cantidadFormateada + ' ' + unidadVenta;
        
        if (hayConversion && producto.cantidad_base) {
            const cantidadBaseFormateada = parseFloat(producto.cantidad_base).toFixed(2).replace(/\.?0+$/, '');
            cantidadTexto = cantidadFormateada + ' ' + unidadVenta + ' (' + cantidadBaseFormateada + ' ' + unidadBase + ')';
        }
        
        const totalFormateado = formatearMonto(producto.total);
        const nombreMax = anchoLinea - cantidadTexto.length - totalFormateado.length - 2;
        let nombre = producto.nombre_producto;
        
        if (nombre.length > nombreMax) {
            nombre = nombre.substring(0, nombreMax);
        } else {
            nombre = nombre.padEnd(nombreMax, ' ');
        }
        
        builder.text(cantidadTexto + ' ' + nombre + ' ' + totalFormateado).newLine();
        
        const precio = formatearMonto(producto.precio_unitario);
        const unidadPrecio = unidadBase || unidadVenta;
        builder.text('      @' + precio + ' / ' + unidadPrecio).newLine();
        
        if (producto.cantidad_despachada < producto.cantidad) {
            const pendiente = parseFloat(producto.cantidad - producto.cantidad_despachada).toFixed(3).replace(/\.?0+$/, '');
            builder.text('      Pendiente: ' + pendiente + ' ' + unidadVenta).newLine();
        }
    });
    
    if (venta.extras && venta.extras.length > 0) {
        builder.line('-', anchoLinea);
        builder.bold(true).text('EXTRAS').newLine().bold(false);
        
        venta.extras.forEach(extra => {
            const cant = String(extra.cantidad).padStart(4, ' ');
            const totalFormateado = formatearMonto(extra.monto_total);
            const totalPadded = totalFormateado.padStart(10, ' ');
            const nombreMax = anchoLinea - 16;
            let nombre = extra.nombre;
            
            if (nombre.length > nombreMax) {
                nombre = nombre.substring(0, nombreMax);
            } else {
                nombre = nombre.padEnd(nombreMax, ' ');
            }
            
            builder.text(cant + ' ' + nombre + totalPadded).newLine();
            builder.text('      @' + formatearMonto(extra.precio_unitario)).newLine();
        });
    }
    
    builder.line('-', anchoLinea);
    
    const labelSubtotal = 'Subtotal:';
    const subtotalFormateado = formatearMonto(venta.subtotal);
    const espaciosSubtotal = anchoLinea - labelSubtotal.length - subtotalFormateado.length;
    builder.text(labelSubtotal + ' '.repeat(espaciosSubtotal) + subtotalFormateado).newLine();
    
    if (parseFloat(venta.descuento) > 0) {
        const labelDesc = 'Descuento:';
        const descFormateado = formatearMonto(venta.descuento);
        const espaciosDesc = anchoLinea - labelDesc.length - descFormateado.length;
        builder.text(labelDesc + ' '.repeat(espaciosDesc) + descFormateado).newLine();
    }
    
    const labelItbis = empresa.impuesto_nombre + ' (' + empresa.impuesto_porcentaje + '%):';
    const itbisFormateado = formatearMonto(venta.itbis);
    const espaciosItbis = anchoLinea - labelItbis.length - itbisFormateado.length;
    builder.text(labelItbis + ' '.repeat(espaciosItbis) + itbisFormateado).newLine();
    
    builder.doubleLine('=', anchoLinea);
    
    builder.bold(true).textSize(2, 2);
    const labelTotal = 'TOTAL:';
    const totalFormateado = formatearMonto(venta.total);
    const espaciosTotal = Math.floor((anchoLinea - labelTotal.length - totalFormateado.length) / 2);
    builder.text(labelTotal + ' '.repeat(espaciosTotal) + totalFormateado).newLine();
    builder.textSize(1, 1).bold(false);
    
    if (venta.metodo_pago === 'efectivo' && venta.efectivo_recibido) {
        builder.line('-', anchoLinea);
        
        const labelRecibido = 'Recibido:';
        const recibidoFormateado = formatearMonto(venta.efectivo_recibido);
        const espaciosRecibido = anchoLinea - labelRecibido.length - recibidoFormateado.length;
        builder.text(labelRecibido + ' '.repeat(espaciosRecibido) + recibidoFormateado).newLine();
        
        const labelCambio = 'Cambio:';
        const cambioFormateado = formatearMonto(venta.cambio);
        const espaciosCambio = anchoLinea - labelCambio.length - cambioFormateado.length;
        builder.text(labelCambio + ' '.repeat(espaciosCambio) + cambioFormateado).newLine();
    }
    
    builder.line('-', anchoLinea);
    builder.text('Metodo: ' + venta.metodo_pago_texto).newLine();
    
    if (venta.notas) {
        builder.line('-', anchoLinea);
        builder.text('NOTA: ' + venta.notas).newLine();
    }
    
    builder.line('-', anchoLinea);
    
    builder.alignCenter();
    if (empresa.mensaje_factura) {
        builder.text(empresa.mensaje_factura).newLine();
    }
    builder.text('Comprobante fiscal autorizado DGII').newLine();
    builder.text(new Date().toLocaleDateString('es-DO')).newLine();
    builder.newLine();
    builder.bold(true).text('GRACIAS POR SU COMPRA').newLine().bold(false);
    
    builder.newLine(3);
    builder.cut();
    
    return builder.build();
}

function formatearMonto(monto) {
    const numero = parseFloat(monto);
    return numero.toLocaleString('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}