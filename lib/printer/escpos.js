import { encodePrinterText, selectCodePage, getPrinterCodePage } from './codePages'

const ESC = 0x1b
const GS = 0x1d

function bytes(...values) {
    return Buffer.from(values)
}

function text(value, codePage) {
    return encodePrinterText(value, codePage)
}

function line(value = '', codePage) {
    return Buffer.concat([text(value, codePage), bytes(0x0a)])
}

function money(value, symbol = 'RD$') {
    const amount = Number(value || 0)
    return `${symbol}${amount.toFixed(2)}`
}

function fitLine(left, right, width = 48, codePage) {
    const leftText = String(left ?? '')
    const rightText = String(right ?? '')
    const available = width - rightText.length
    const clippedLeft = available > 1 ? leftText.slice(0, available - 1) : ''
    return line(clippedLeft + ' '.repeat(Math.max(1, width - clippedLeft.length - rightText.length)) + rightText, codePage)
}

function divider(width, codePage) {
    return line('-'.repeat(width), codePage)
}

function normalizeProduct(product) {
    return {
        name: product.nombre_producto || product.nombre || product.descripcion || '',
        quantity: product.cantidad ?? 0,
        price: product.precio_unitario ?? product.precio ?? 0,
        discount: product.descuento ?? product.descuento_total ?? 0,
        total: product.total ?? product.subtotal ?? 0
    }
}

export function buildEscPos(data, options = {}) {
    const codePage = getPrinterCodePage(options.codePage)
    const configuredWidth = Number(options.width || 80)
    const width = configuredWidth <= 58 ? 32 : 48
    const symbol = options.currencySymbol || data.empresa?.simbolo_moneda || 'RD$'
    const chunks = [
        bytes(ESC, 0x40),
        selectCodePage(codePage),
        bytes(ESC, 0x61, 0x01),
        bytes(ESC, 0x45, 0x01),
        bytes(GS, 0x21, 0x11),
        line(data.empresa?.nombre_empresa || data.empresa?.nombre || data.empresa?.razon_social || '', codePage),
        bytes(GS, 0x21, 0x00, ESC, 0x45, 0x00)
    ]

    const companyLines = [
        data.empresa?.razon_social,
        data.empresa?.rnc ? `RNC: ${data.empresa.rnc}` : null,
        data.empresa?.direccion,
        data.empresa?.telefono ? `Tel: ${data.empresa.telefono}` : null
    ].filter(Boolean)
    companyLines.forEach(value => chunks.push(line(value, codePage)))

    chunks.push(
        line('', codePage),
        bytes(ESC, 0x61, 0x00),
        divider(width, codePage),
        line(data.tipo_comprobante_nombre || data.tipoComprobante || 'FACTURA', codePage),
        line(`NCF: ${data.ncf || 'N/A'}`, codePage),
        line(`No. ${data.numero_interno || data.numeroFactura || ''}`, codePage),
        line(`Fecha: ${data.fecha || ''}`, codePage)
    )

    if (data.vendedor || data.usuario_nombre) chunks.push(line(`Vendedor: ${data.vendedor || data.usuario_nombre}`, codePage))
    chunks.push(line(`Cliente: ${data.cliente_nombre || data.cliente || 'Consumidor Final'}`, codePage))
    if (data.cliente_direccion || data.direccion_cliente) chunks.push(line(`Dirección: ${data.cliente_direccion || data.direccion_cliente}`, codePage))
    chunks.push(divider(width, codePage))

    for (const rawProduct of data.productos || []) {
        const product = normalizeProduct(rawProduct)
        chunks.push(line(product.name, codePage))
        chunks.push(fitLine(`${product.quantity} x ${money(product.price, symbol)}`, money(product.total, symbol), width, codePage))
        if (Number(product.discount)) chunks.push(fitLine('Descuento', money(product.discount, symbol), width, codePage))
    }

    chunks.push(
        divider(width, codePage),
        fitLine('Subtotal', money(data.subtotal, symbol), width, codePage)
    )
    if (Number(data.descuento || data.discount)) chunks.push(fitLine('Descuento', money(data.descuento || data.discount, symbol), width, codePage))
    chunks.push(
        fitLine(data.itbis_label || 'ITBIS', money(data.itbis, symbol), width, codePage),
        bytes(ESC, 0x45, 0x01),
        fitLine('TOTAL', money(data.total, symbol), width, codePage),
        bytes(ESC, 0x45, 0x00)
    )

    if (data.metodoPago || data.metodo_pago_texto) chunks.push(line(`Método de pago: ${data.metodoPago || data.metodo_pago_texto}`, codePage))
    if (data.recibido != null || data.monto_recibido != null) chunks.push(fitLine('Efectivo recibido', money(data.recibido ?? data.monto_recibido, symbol), width, codePage))
    if (data.cambio != null || data.devuelta != null) chunks.push(fitLine('Cambio', money(data.cambio ?? data.devuelta, symbol), width, codePage))
    if (data.mensajeFinal) chunks.push(line(data.mensajeFinal, codePage))

    chunks.push(
        line('', codePage),
        bytes(ESC, 0x61, 0x01),
        line(data.mensaje || '¡Gracias por su compra!', codePage),
        line('Vuelva pronto', codePage),
        line('', codePage)
    )

    if (options.cashDrawer) chunks.push(bytes(ESC, 0x70, 0x00, 0x19, 0xfa))
    if (options.cut !== false) chunks.push(bytes(GS, 0x56, 0x41, 0x03))

    return Buffer.concat(chunks)
}

export function buildPrinterTest(options = {}) {
    return buildEscPos({
        empresa: { nombre: 'PRUEBA DE IMPRESORA' },
        fecha: new Date().toLocaleString('es-DO'),
        cliente: 'José Pérez',
        productos: [
            { nombre: 'Café pequeña', cantidad: 1, precio: 100, total: 100 },
            { nombre: 'Artículo electrónico', cantidad: 1, precio: 250, total: 250 },
            { nombre: 'Compra válida', cantidad: 1, precio: 50, total: 50 }
        ],
        subtotal: 400,
        itbis: 72,
        total: 472,
        metodoPago: 'Efectivo',
        recibido: 500,
        cambio: 28,
        mensajeFinal: 'Dirección: Nagua | ¿Todo correcto? ¡Sí!'
    }, options)
}