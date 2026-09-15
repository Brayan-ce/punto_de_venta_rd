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

// Diccionario de traducciones para boucher
const boucherTranslations = {
    es: {
        fecha: 'Fecha',
        vendedor: 'Vendedor',
        cliente: 'Cliente',
        consumidorFinal: 'Consumidor Final',
        cantidad: 'Cant',
        descripcion: 'Descripcion',
        total: 'Total',
        subtotal: 'Subtotal',
        descuento: 'Descuento',
        impuesto: 'Impuesto',
        metodo: 'Metodo',
        recibido: 'Recibido',
        cambio: 'Cambio',
        nota: 'NOTA',
        gracias: 'GRACIAS POR SU COMPRA',
        comprobante: 'Comprobante fiscal autorizado DGII',
        extras: 'EXTRAS',
        financiamiento: 'Financiamiento',
        tipoVenta: 'Tipo de venta',
        contrato: 'Contrato',
        plan: 'Plan',
        totalPagar: 'Total a pagar',
        pagoAdelantado: 'Pago adelantado',
        saldoPendiente: 'Saldo pendiente',
        montoAtraso: 'Monto en atraso',
        cuotas: 'Cuotas',
        proximaCuota: 'Proxima cuota'
    },
    en: {
        fecha: 'Date',
        vendedor: 'Seller',
        cliente: 'Customer',
        consumidorFinal: 'Final Consumer',
        cantidad: 'Qty',
        descripcion: 'Description',
        total: 'Total',
        subtotal: 'Subtotal',
        descuento: 'Discount',
        impuesto: 'Tax',
        metodo: 'Method',
        recibido: 'Received',
        cambio: 'Change',
        nota: 'NOTE',
        gracias: 'THANK YOU FOR YOUR PURCHASE',
        comprobante: 'Authorized fiscal receipt DGII',
        extras: 'EXTRAS',
        financiamiento: 'Financing',
        tipoVenta: 'Sale type',
        contrato: 'Contract',
        plan: 'Plan',
        totalPagar: 'Total to pay',
        pagoAdelantado: 'Advance payment',
        saldoPendiente: 'Balance due',
        montoAtraso: 'Overdue amount',
        cuotas: 'Installments',
        proximaCuota: 'Next installment'
    }
};

function getTranslation(key, language = 'es') {
    return boucherTranslations[language]?.[key] || boucherTranslations['es'][key] || key;
}

export function esCampoEmpresaValido(valor) {
    if (valor == null) return false
    const v = String(valor).trim()
    if (!v) return false
    if (/^\.+$/.test(v) || v === '-' || v === '—') return false
    const lower = v.toLowerCase()
    const invalidos = [
        'por definir',
        'direccion pendiente',
        'dirección pendiente',
        'sector pendiente',
        'municipio pendiente',
        'provincia pendiente',
        'n/a',
        'na',
        'null',
        'undefined',
        '0'
    ]
    if (invalidos.includes(lower)) return false
    if (/^(direccion|dirección|sector|municipio|provincia)\s+pendiente$/i.test(v)) return false
    return true
}

export function esMismoTextoEmpresa(a, b) {
    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()
}

function textoEmpresa(valor) {
    return esCampoEmpresaValido(valor) ? String(valor).trim() : null
}

function elegirTamanoTexto(texto, anchoLinea) {
    const s = String(texto)
    const opciones = [[2, 2], [2, 1], [1, 2], [1, 1]]
    for (const [w, h] of opciones) {
        if (s.length * w <= anchoLinea) return [w, h]
    }
    return [1, 1]
}

function filaEtiquetaValor(builder, etiqueta, valor, anchoLinea) {
    const v = String(valor)
    const esp = anchoLinea - etiqueta.length - v.length
    if (esp >= 1) {
        builder.text(etiqueta + ' '.repeat(esp) + v).newLine()
    } else {
        builder.text(etiqueta).newLine()
        builder.alignRight().text(v).newLine().alignLeft()
    }
}

function imprimirTotalTicket(builder, venta, anchoLinea, t) {
    const montoStr = formatearMontoTicket(venta.total)
    const [w, h] = elegirTamanoTexto(montoStr, anchoLinea)

    builder.doubleLine('=', anchoLinea)
    builder.alignCenter().bold(true).textSize(1, 1)
    builder.text(t('total').toUpperCase()).newLine()
    builder.textSize(w, h)
    builder.text(montoStr).newLine()
    builder.textSize(1, 1).bold(false).alignLeft()
}

export function generarTicketESCPOS(venta, empresa, anchoLinea = 32, language = 'es') {
    const t = (key) => getTranslation(key, language);
    const builder = new ESCPOSBuilder();
    
    builder.init();
    builder.alignCenter();
    
    builder.bold(true).textSize(2, 2);
    builder.text(empresa.nombre_empresa).newLine();
    
    builder.textSize(1, 1).bold(false);
    const razon = textoEmpresa(empresa.razon_social);
    if (razon && !esMismoTextoEmpresa(razon, empresa.nombre_empresa)) {
        builder.text(razon).newLine();
    }
    if (empresa.rnc) {
        builder.text('RNC: ' + empresa.rnc).newLine();
    }
    const direccion = textoEmpresa(empresa.direccion);
    if (direccion) {
        builder.text(direccion).newLine();
    }
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
    const localeFormat = language === 'en' ? 'en-US' : 'es-DO';
    const fechaStr = String(fecha.getDate()).padStart(2, '0') + '/' + 
                     String(fecha.getMonth() + 1).padStart(2, '0') + '/' + 
                     fecha.getFullYear() + ' ' + 
                     String(fecha.getHours()).padStart(2, '0') + ':' + 
                     String(fecha.getMinutes()).padStart(2, '0');
    
    builder.text(t('fecha') + ': ' + fechaStr).newLine();
    builder.text(t('vendedor') + ': ' + venta.usuario_nombre).newLine();
    
    if (venta.cliente_id) {
        builder.text(t('cliente') + ': ' + venta.cliente_nombre).newLine();
        builder.text(venta.cliente_tipo_documento + ': ' + venta.cliente_numero_documento).newLine();
    } else {
        builder.text(t('cliente') + ': ' + t('consumidorFinal')).newLine();
    }
    
    builder.line('-', anchoLinea);
    
    builder.text(t('cantidad') + '  ' + t('descripcion') + '    ' + t('total')).newLine();
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
        builder.bold(true).text(t('extras')).newLine().bold(false);
        
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
    
    filaEtiquetaValor(builder, t('subtotal') + ':', formatearMonto(venta.subtotal), anchoLinea)

    if (parseFloat(venta.descuento) > 0) {
        filaEtiquetaValor(builder, t('descuento') + ':', formatearMonto(venta.descuento), anchoLinea)
    }

    const labelItbis = empresa.impuesto_nombre + ' (' + empresa.impuesto_porcentaje + '%):'
    filaEtiquetaValor(builder, labelItbis, formatearMonto(venta.itbis), anchoLinea)

    imprimirTotalTicket(builder, venta, anchoLinea, t)

    if (venta.metodo_pago === 'efectivo' && venta.efectivo_recibido) {
        builder.line('-', anchoLinea)
        filaEtiquetaValor(builder, t('recibido') + ':', formatearMonto(venta.efectivo_recibido), anchoLinea)
        filaEtiquetaValor(builder, t('cambio') + ':', formatearMonto(venta.cambio), anchoLinea)
    }
    
    builder.line('-', anchoLinea);
    const metodoTexto = venta.financiamiento
        ? t('financiamiento')
        : (venta.metodo_pago_texto || venta.metodo_pago || '');
    builder.text(t('metodo') + ': ' + metodoTexto).newLine();

    if (venta.financiamiento) {
        const fin = venta.financiamiento;
        builder.line('-', anchoLinea);
        builder.bold(true).text(t('financiamiento').toUpperCase()).newLine().bold(false);
        const filaFin = (label, valor) => filaEtiquetaValor(builder, label, valor, anchoLinea)
        filaFin(t('tipoVenta') + ':', t('financiamiento'));
        filaFin(t('contrato') + ':', fin.numero_contrato);
        filaFin(t('plan') + ':', fin.plan_nombre);
        filaFin(t('totalPagar') + ':', formatearMonto(fin.total_pagar));
        if (parseFloat(fin.pago_adelantado) > 0) {
            filaFin(t('pagoAdelantado') + ':', formatearMonto(fin.pago_adelantado));
        }
        filaFin(t('saldoPendiente') + ':', formatearMonto(fin.saldo_pendiente));
        if (parseFloat(fin.monto_atraso) > 0) {
            filaFin(t('montoAtraso') + ':', formatearMonto(fin.monto_atraso));
        }
        filaFin(t('cuotas') + ':', `${fin.cuotas} x ${formatearMonto(fin.cuota_mensual)}`);
        if (fin.proxima_cuota_monto != null && fin.proxima_cuota_numero != null) {
            filaFin(t('proximaCuota') + ':', `${formatearMonto(fin.proxima_cuota_monto)} (#${fin.proxima_cuota_numero})`);
        }
    }
    
    if (venta.notas) {
        builder.line('-', anchoLinea);
        builder.text(t('nota') + ': ' + venta.notas).newLine();
    }
    
    builder.line('-', anchoLinea);

    builder.alignCenter();
    const mensajeFactura = textoEmpresa(empresa.mensaje_factura);
    if (mensajeFactura) {
        builder.text(mensajeFactura).newLine();
    }
    builder.bold(true).text(t('gracias')).newLine().bold(false);

    builder.newLine(1);
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

function formatearMontoTicket(monto) {
    const numero = parseFloat(monto);
    if (isNaN(numero)) return '0.00';
    return numero.toFixed(2);
}