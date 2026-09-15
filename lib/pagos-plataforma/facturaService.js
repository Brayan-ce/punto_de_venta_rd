import { jsPDF } from 'jspdf'
import fs from 'fs/promises'
import path from 'path'
import QRCode from 'qrcode'

const FACTURAS_DIR = process.env.PAYMENT_INVOICES_DIR || '/var/data/pdv_invoices'
const LOGO_PATH = path.join(process.cwd(), 'public', 'logo.png')
const NAVY = [20, 42, 76]
const GREEN = [0, 113, 96]
const PALE_GREEN = [229, 245, 241]
const INK = [29, 42, 60]
const MUTED = [92, 111, 133]

function moneda(valor, codigo) {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: codigo || 'DOP' }).format(Number(valor || 0))
}

export async function generarFacturaPdf(pago, factura) {
    const documento = new jsPDF({ unit: 'mm', format: 'a4' })
    const total = Number(pago.monto) - Number(pago.descuento || 0) + Number(pago.impuestos || 0)
    const fechaPago = new Date(pago.fecha_pago).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })
    const fechaEmision = new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })
    const [logo, qr] = await Promise.all([
        fs.readFile(LOGO_PATH),
        QRCode.toDataURL(`IZIWEEK|FACTURA:${factura.numero_factura}|PAGO:${pago.id}|TOTAL:${total.toFixed(2)}|MONEDA:${pago.moneda || 'DOP'}`, {
            width: 360,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#142A4C', light: '#FFFFFF' }
        })
    ])

    documento.setFillColor(...NAVY); documento.rect(0, 0, 210, 52, 'F')
    documento.setFillColor(...GREEN); documento.rect(0, 48, 210, 4, 'F')
    documento.setFillColor(255, 255, 255); documento.roundedRect(16, 12, 31, 31, 4, 4, 'F')
    documento.addImage(`data:image/png;base64,${logo.toString('base64')}`, 'PNG', 20, 16, 23, 23)
    documento.setTextColor(255, 255, 255); documento.setFont('helvetica', 'bold'); documento.setFontSize(22); documento.text('IZIWEEK', 54, 23)
    documento.setFont('helvetica', 'normal'); documento.setFontSize(8.5); documento.text('SISTEMA DE GESTION TOTAL', 54, 30)
    documento.setFont('helvetica', 'bold'); documento.setFontSize(9); documento.text('COMPROBANTE DE PAGO', 194, 19, { align: 'right' })
    documento.setFont('helvetica', 'normal'); documento.setFontSize(8); documento.text('Pago confirmado', 194, 26, { align: 'right' })
    documento.setFont('helvetica', 'bold'); documento.setFontSize(12); documento.text(factura.numero_factura, 194, 36, { align: 'right' })

    documento.setTextColor(...INK); documento.setFont('helvetica', 'bold'); documento.setFontSize(18); documento.text('Factura de pago', 18, 68)
    documento.setFont('helvetica', 'normal'); documento.setFontSize(9); documento.setTextColor(...MUTED); documento.text(`Emitida el ${fechaEmision}`, 18, 75)
    documento.setFillColor(...PALE_GREEN); documento.roundedRect(139, 61, 53, 18, 3, 3, 'F')
    documento.setTextColor(...GREEN); documento.setFont('helvetica', 'bold'); documento.setFontSize(9); documento.text('PAGO CONFIRMADO', 165.5, 72, { align: 'center' })

    documento.setFillColor(246, 248, 251); documento.roundedRect(18, 87, 115, 68, 3, 3, 'F')
    documento.setTextColor(...GREEN); documento.setFont('helvetica', 'bold'); documento.setFontSize(8); documento.text('FACTURADO A', 25, 99)
    const detalleCliente = [
        [pago.cliente_nombre, 12, 'bold'],
        [pago.negocio_nombre, 9, 'normal'],
        [pago.cliente_email || 'Correo no registrado', 9, 'normal'],
        [pago.cliente_telefono || 'Teléfono no registrado', 9, 'normal']
    ]
    let yCliente = 108
    for (const [valor, tamano, estilo] of detalleCliente) {
        documento.setTextColor(...INK); documento.setFont('helvetica', estilo); documento.setFontSize(tamano)
        const lineas = documento.splitTextToSize(String(valor), 98)
        documento.text(lineas, 25, yCliente); yCliente += lineas.length * (tamano === 12 ? 5.5 : 4.5) + 2
    }

    documento.setFillColor(...NAVY); documento.roundedRect(141, 87, 51, 68, 3, 3, 'F')
    documento.addImage(qr, 'PNG', 148, 94, 37, 37)
    documento.setTextColor(255, 255, 255); documento.setFont('helvetica', 'bold'); documento.setFontSize(8); documento.text('VERIFICACION DIGITAL', 166.5, 139, { align: 'center' })
    documento.setFont('helvetica', 'normal'); documento.setFontSize(7); documento.text('Escanea para validar', 166.5, 145, { align: 'center' })

    documento.setTextColor(...GREEN); documento.setFont('helvetica', 'bold'); documento.setFontSize(9); documento.text('DETALLE DEL PAGO', 18, 170)
    documento.setDrawColor(207, 216, 227); documento.line(18, 175, 192, 175)
    const concepto = documento.splitTextToSize(pago.concepto, 94)
    const descripcion = documento.splitTextToSize(pago.descripcion || 'Pago registrado en la plataforma IsiWeek.', 94)
    documento.setTextColor(...INK); documento.setFont('helvetica', 'bold'); documento.setFontSize(10); documento.text(concepto, 18, 184)
    documento.setFont('helvetica', 'normal'); documento.setFontSize(8.5); documento.setTextColor(...MUTED); documento.text(descripcion, 18, 191 + (concepto.length - 1) * 5)
    const yInfo = 184
    documento.setTextColor(...MUTED); documento.setFontSize(8); documento.text('Método', 118, yInfo); documento.text('Fecha de pago', 118, yInfo + 10); documento.text('Referencia', 118, yInfo + 20)
    documento.setTextColor(...INK); documento.setFont('helvetica', 'bold'); documento.text(String(pago.metodo_pago).toUpperCase(), 192, yInfo, { align: 'right' }); documento.text(fechaPago, 192, yInfo + 10, { align: 'right' }); documento.text(pago.referencia || 'No registrada', 192, yInfo + 20, { align: 'right' })

    documento.setFillColor(246, 248, 251); documento.roundedRect(18, 218, 174, 34, 3, 3, 'F')
    const importes = [['Subtotal', pago.monto], ['Descuento', -Number(pago.descuento || 0)], ['Impuestos', pago.impuestos || 0]]
    let yImporte = 227
    for (const [etiqueta, valor] of importes) {
        documento.setTextColor(...MUTED); documento.setFont('helvetica', 'normal'); documento.setFontSize(8.5); documento.text(etiqueta, 25, yImporte); documento.text(moneda(valor, pago.moneda), 104, yImporte, { align: 'right' }); yImporte += 7
    }
    documento.setFillColor(...GREEN); documento.roundedRect(120, 223, 65, 24, 3, 3, 'F')
    documento.setTextColor(218, 246, 239); documento.setFont('helvetica', 'bold'); documento.setFontSize(8); documento.text('TOTAL PAGADO', 127, 232)
    documento.setTextColor(255, 255, 255); documento.setFontSize(14); documento.text(moneda(total, pago.moneda), 178, 241, { align: 'right' })

    documento.setDrawColor(207, 216, 227); documento.line(18, 270, 192, 270)
    documento.setTextColor(...MUTED); documento.setFont('helvetica', 'normal'); documento.setFontSize(8); documento.text('Gracias por confiar en IsiWeek. Este comprobante acredita la confirmación del pago indicado.', 105, 278, { align: 'center' })
    documento.setFontSize(7); documento.text(`Factura ${factura.numero_factura}  |  Documento generado electrónicamente`, 105, 285, { align: 'center' })
    const buffer = Buffer.from(documento.output('arraybuffer'))
    await fs.mkdir(FACTURAS_DIR, { recursive: true })
    const nombreArchivo = `${factura.numero_factura}.pdf`
    const archivo = path.join(FACTURAS_DIR, nombreArchivo)
    await fs.writeFile(archivo, buffer)
    return { archivo, nombreArchivo, buffer }
}