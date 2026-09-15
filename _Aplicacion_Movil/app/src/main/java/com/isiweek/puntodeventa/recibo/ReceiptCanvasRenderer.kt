package com.isiweek.puntodeventa.recibo

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface

/**
 * Renderer determinista del recibo. Dibuja sobre un [Canvas] de Android:
 * el mismo código produce Preview (Compose), PNG, PDF e impresión con idénticas métricas.
 * Respeta las opciones "Mostrar en Recibo" ([ReceiptOptions]).
 *
 * NO depende de la densidad, tamaño de pantalla ni tema de la app.
 */
interface ReceiptRenderer {

    fun measure(data: ReceiptData): ReceiptSize

    /** Dibuja el recibo en el canvas (se asume altura ya medida con [measure]). */
    fun draw(canvas: Canvas, data: ReceiptData)
}

object ReceiptCanvasRenderer : ReceiptRenderer {

    private val D = ReceiptDimensions
    private val F = ReceiptFormatters

    override fun measure(data: ReceiptData): ReceiptSize = ReceiptLayout.measure(data)

    override fun draw(canvas: Canvas, data: ReceiptData) {
        canvas.drawColor(android.graphics.Color.WHITE)

        val o = data.options

        val normalPaint = basePaint(16f, Typeface.MONOSPACE)
        val boldPaint = basePaint(16f, Typeface.create(Typeface.MONOSPACE, Typeface.BOLD))
        val smallPaint = basePaint(14f, Typeface.MONOSPACE)
        val smallBoldPaint = basePaint(14f, Typeface.create(Typeface.MONOSPACE, Typeface.BOLD))
        val titlePaint = basePaint(22f, Typeface.create(Typeface.MONOSPACE, Typeface.BOLD))
        val totalPaint = basePaint(20f, Typeface.create(Typeface.MONOSPACE, Typeface.BOLD))
        val graciasPaint = basePaint(21f, Typeface.create(Typeface.MONOSPACE, Typeface.BOLD))
        val xlPaint = basePaint(26f, Typeface.create(Typeface.MONOSPACE, Typeface.BOLD))

        val linePaint = Paint().apply {
            color = android.graphics.Color.BLACK
            strokeWidth = D.SEPARATOR_MAIN_THICKNESS.toFloat()
        }
        val dottedPaint = Paint().apply {
            color = android.graphics.Color.DKGRAY
            strokeWidth = D.SEPARATOR_SECONDARY_THICKNESS.toFloat()
        }

        val left = D.HORIZONTAL_PADDING.toFloat()
        val right = (D.RECEIPT_WIDTH - D.HORIZONTAL_PADDING).toFloat()
        var y = D.SECTION_SPACING.toFloat()

        // ============ ENCABEZADO EMPRESA (switch mostrarDatosEmpresa) ============
        if (o.showEmpresa) {
            drawCentered(canvas, data.businessName, left, right, y, xlPaint)
            y += D.LINE_HEIGHT_XLARGE + D.HEADER_SPACING
            data.razonSocial?.let { rs ->
                drawCentered(canvas, rs, left, right, y, smallPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
            data.rnc?.let { r ->
                drawCentered(canvas, "RNC: $r", left, right, y, smallPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
            data.address?.let { a ->
                drawCentered(canvas, a, left, right, y, smallPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
            data.phone?.let { p ->
                drawCentered(canvas, "Tel: $p", left, right, y, smallPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
            y += D.SEPARATOR_SPACING
            canvas.drawLine(left, y, right, y, linePaint)
            y += D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING
        }

        // ============ TÍTULO RECIBO (siempre visible) ============
        val tituloRecibo = data.titulo ?: when {
            data.esVenta -> "RECIBO DE VENTA"
            data.notes?.contains("adelantado", ignoreCase = true) == true -> "RECIBO DE PAGO ADELANTADO"
            else -> "RECIBO DE PAGO"
        }
        drawCentered(canvas, tituloRecibo, left, right, y, titlePaint)
        y += D.LINE_HEIGHT_LARGE + D.HEADER_SPACING
        drawCentered(canvas, if (data.esVenta) "No. ${data.receiptNumber}" else "Recibo No. ${data.receiptNumber}", left, right, y, smallPaint)
        y += D.LINE_HEIGHT_NORMAL
        drawCentered(canvas, if (data.esVenta) "NCF: ${data.contractNumber}" else "Contrato: ${data.contractNumber}", left, right, y, boldPaint)
        y += D.LINE_HEIGHT_NORMAL
        y += D.SEPARATOR_SPACING
        canvas.drawLine(left, y, right, y, linePaint)
        y += D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING

        // ============ INFORMACIÓN CLIENTE ============
        drawLabelValue(canvas, "Fecha:", F.formatDate(data.date), left, right, y, normalPaint, boldPaint)
        y += D.LINE_HEIGHT_NORMAL
        if (o.showCliente) {
            drawLabelValue(canvas, "Cliente:", data.clientName, left, right, y, normalPaint, boldPaint)
            y += D.LINE_HEIGHT_NORMAL
data.identification?.let { id ->
            drawLabelValue(canvas, if (data.esVenta) "CED:" else "Cedula:", F.formatIdentification(id), left, right, y, normalPaint, boldPaint)
            y += D.LINE_HEIGHT_NORMAL
        }
            data.clientPhone?.let { ph ->
                drawLabelValue(canvas, "Telefono:", F.formatPhone(ph), left, right, y, normalPaint, boldPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
            data.clientAddress?.let { addr ->
                drawLabelValue(canvas, "Direccion:", addr, left, right, y, normalPaint, boldPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
        }
        data.receivedBy?.let { rb ->
            drawLabelValue(canvas, "Recibido por:", rb, left, right, y, normalPaint, boldPaint)
            y += D.LINE_HEIGHT_NORMAL
        }
        y += D.SEPARATOR_SPACING
        canvas.drawLine(left, y, right, y, linePaint)
        y += D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING

        // ============ TABLA DE CUOTAS (switch mostrarCasillasAplicadas) ============
        if (o.showCuotas && data.installments.isNotEmpty()) {
            drawTableHeader(canvas, left, right, y, smallBoldPaint, data.esVenta)
            y += D.LINE_HEIGHT_SMALL
            data.installments.forEach { c ->
                if (data.esVenta && c.esExtra) {
                    drawLeft(canvas, "EXTRAS", left, right, y, smallBoldPaint)
                    y += D.LINE_HEIGHT_SMALL
                }
                drawInstallmentRow(canvas, c, left, right, y, smallPaint, smallBoldPaint, data.esVenta)
                y += D.LINE_HEIGHT_NORMAL
            }
            y += D.SEPARATOR_SPACING
            canvas.drawLine(left, y, right, y, linePaint)
            y += D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING

            // Resumen financiero: subtotal/capital + itbis/interés (+ mora si hay)
            drawLabelValue(canvas, if (data.esVenta) "Subtotal:" else "Capital:", F.formatMoney(data.capital), left, right, y, normalPaint, boldPaint)
            y += D.LINE_HEIGHT_NORMAL
            drawLabelValue(canvas, if (data.esVenta) "ITBIS (%.2f%%):".format(data.impuestoPorcentaje ?: 0.0) else "Interes:", F.formatMoney(data.interest), left, right, y, normalPaint, boldPaint)
            y += D.LINE_HEIGHT_NORMAL
            if (data.lateFeeTotal?.isZero() == false) {
                drawLabelValue(canvas, "Mora:", F.formatMoney(data.lateFeeTotal!!), left, right, y, normalPaint, boldPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
            y += D.SEPARATOR_SPACING
            canvas.drawLine(left, y, right, y, linePaint)
            y += D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING
        }

        // ============ TOTAL PAGADO (siempre visible) ============
        drawLabelValue(canvas, if (data.esVenta) "TOTAL:" else "TOTAL PAGADO:", F.formatMoney(data.totalPaid), left, right, y, totalPaint, totalPaint)
        y += D.LINE_HEIGHT_LARGE
        y += D.SEPARATOR_SPACING
        drawDotted(canvas, left, right, y, dottedPaint)
        y += D.SEPARATOR_SECONDARY_THICKNESS + D.SEPARATOR_SPACING

        // ============ RECIBIDO / CAMBIO (modo venta) ============
        if (data.esVenta) {
            data.efectivoRecibido?.let {
                drawLabelValue(canvas, "Recibido:", F.formatMoney(it), left, right, y, normalPaint, boldPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
            data.cambio?.let {
                drawLabelValue(canvas, "Cambio:", F.formatMoney(it), left, right, y, normalPaint, boldPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
        }

        // ============ MÉTODO DE PAGO (switch mostrarMetodoPago) ============
        if (o.showMetodo && data.paymentMethod.isNotBlank()) {
            drawLabelValue(canvas, "Metodo de Pago:", data.paymentMethod, left, right, y, normalPaint, boldPaint)
            y += D.LINE_HEIGHT_NORMAL
            y += D.SEPARATOR_SPACING
            drawDotted(canvas, left, right, y, dottedPaint)
            y += D.SEPARATOR_SECONDARY_THICKNESS + D.SEPARATOR_SPACING
        }

        // ============ REFERENCIA (si existe) ============
        data.reference?.let { ref ->
            drawLabelValue(canvas, "Referencia:", ref, left, right, y, normalPaint, boldPaint)
            y += D.LINE_HEIGHT_NORMAL
        }

        // ============ SALDO RESTANTE / CUOTAS PENDIENTES (switch mostrarSaldoRestante) ============
        if (o.showSaldo) {
            y += D.SEPARATOR_SPACING
            drawDotted(canvas, left, right, y, dottedPaint)
            y += D.SEPARATOR_SECONDARY_THICKNESS + D.SEPARATOR_SPACING
            drawLabelValue(canvas, "Saldo restante:", F.formatMoney(data.remainingBalance), left, right, y, normalPaint, boldPaint)
            y += D.LINE_HEIGHT_NORMAL
            if (data.pendingInstallments > 0) {
                drawLabelValue(canvas, "Cuotas pendientes:", data.pendingInstallments.toString(), left, right, y, normalPaint, boldPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
            y += D.SEPARATOR_SPACING
            canvas.drawLine(left, y, right, y, linePaint)
            y += D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING
        }

        // ============ NOTAS (switch mostrarNotas) ============
        if (o.showNotas && data.notes != null) {
            y += D.SEPARATOR_SPACING
            canvas.drawLine(left, y, right, y, linePaint)
            y += D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING
            drawLabelValue(canvas, "NOTA:", data.notes!!, left, right, y, boldPaint, normalPaint)
            y += D.LINE_HEIGHT_NORMAL
        }

        // ============ FOOTER (switch mostrarMensajeFinal) ============
        if (o.showMensaje) {
            y += D.SEPARATOR_SPACING
            canvas.drawLine(left, y, right, y, linePaint)
            y += D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING
            data.mensajeFactura?.let { m ->
                drawCentered(canvas, m, left, right, y, smallPaint)
                y += D.LINE_HEIGHT_NORMAL
            }
            drawCentered(canvas, if (data.esVenta) "GRACIAS POR SU COMPRA" else "GRACIAS POR SU PAGO", left, right, y, graciasPaint)
            y += D.LINE_HEIGHT_LARGE + D.FOOTER_SPACING
            drawCentered(canvas, F.formatDate(data.issueDate, corto = true), left, right, y, smallPaint)
            y += D.LINE_HEIGHT_NORMAL
        }
    }

    private fun basePaint(size: Float, typeface: Typeface): Paint =
        Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = android.graphics.Color.BLACK
            textSize = size
            this.typeface = typeface
        }

    private fun drawCentered(canvas: Canvas, text: String, left: Float, right: Float, y: Float, paint: Paint) {
        val ancho = paint.measureText(text)
        val x = left + ((right - left - ancho) / 2f).coerceAtLeast(0f)
        canvas.drawText(text, x, y + paint.textSize * 0.72f, paint)
    }

    private fun drawLabelValue(canvas: Canvas, label: String, value: String, left: Float, right: Float, y: Float, labelPaint: Paint, valuePaint: Paint) {
        // Etiqueta a la izquierda, valor alineado a la derecha (sin espacios manuales)
        canvas.drawText(label, left, y + labelPaint.textSize * 0.72f, labelPaint)
        val anchoValor = valuePaint.measureText(value)
        canvas.drawText(value, (right - anchoValor).coerceAtLeast(left), y + valuePaint.textSize * 0.72f, valuePaint)
    }

    private fun drawTableHeader(canvas: Canvas, left: Float, right: Float, y: Float, paint: Paint, esVenta: Boolean) {
        val n = ReceiptLayout.columnWidth(ReceiptTableColumns.NUMBER)
        val d = ReceiptLayout.columnWidth(ReceiptTableColumns.DUE_DATE)
        val m = ReceiptLayout.columnWidth(ReceiptTableColumns.LATE_FEE)
        if (esVenta) {
            drawRight(canvas, "Cant.", left, left + n, y, paint)
            drawLeft(canvas, "Descripcion", left + n, left + n + d, y, paint)
            drawRight(canvas, "Precio", left + n + d, left + n + d + m, y, paint)
            drawRight(canvas, "Total", left + n + d + m, right, y, paint)
        } else {
            drawRight(canvas, "#", left, left + n, y, paint)
            drawLeft(canvas, "Vencimiento", left + n, left + n + d, y, paint)
            drawRight(canvas, "Mora", left + n + d, left + n + d + m, y, paint)
            drawRight(canvas, "Aplicado", left + n + d + m, right, y, paint)
        }
    }

    private fun drawInstallmentRow(canvas: Canvas, c: ReceiptInstallment, left: Float, right: Float, y: Float, normal: Paint, bold: Paint, esVenta: Boolean) {
        val n = ReceiptLayout.columnWidth(ReceiptTableColumns.NUMBER)
        val d = ReceiptLayout.columnWidth(ReceiptTableColumns.DUE_DATE)
        val m = ReceiptLayout.columnWidth(ReceiptTableColumns.LATE_FEE)
        if (esVenta) {
            drawRight(canvas, fmtCantidad(c.lateFee), left, left + n, y, bold)
            drawLeft(canvas, c.dueDate, left + n, left + n + d, y, normal)
            drawRight(canvas, F.formatMoney(c.unitPrice ?: c.applied), left + n + d, left + n + d + m, y, normal)
            drawRight(canvas, F.formatMoney(c.applied), left + n + d + m, right, y, bold)
        } else {
            drawRight(canvas, c.number.toString(), left, left + n, y, bold)
            drawLeft(canvas, F.formatDate(c.dueDate), left + n, left + n + d, y, normal)
            drawRight(canvas, if (c.lateFee.isZero()) "—" else F.formatMoney(c.lateFee), left + n + d, left + n + d + m, y, normal)
            drawRight(canvas, F.formatMoney(c.applied), left + n + d + m, right, y, bold)
        }
    }

    /** Formatea una cantidad (columna "Cant." del modo venta), 2 decimales. */
    private fun fmtCantidad(m: Money): String {
        if (m.isZero()) return "—"
        return "%.2f".format(m.amountInMinorUnits / 100.0)
    }

    private fun drawLeft(canvas: Canvas, text: String, xLeft: Float, xRight: Float, y: Float, paint: Paint) {
        canvas.drawText(text, xLeft, y + paint.textSize * 0.72f, paint)
    }

    private fun drawRight(canvas: Canvas, text: String, xLeft: Float, xRight: Float, y: Float, paint: Paint) {
        val ancho = paint.measureText(text)
        canvas.drawText(text, (xRight - ancho).coerceAtLeast(xLeft), y + paint.textSize * 0.72f, paint)
    }

    private fun drawDotted(canvas: Canvas, left: Float, right: Float, y: Float, paint: Paint) {
        var x = left
        while (x < right) {
            canvas.drawPoint(x, y + 1f, paint)
            x += D.SEPARATOR_DOTTED_GAP
        }
    }
}