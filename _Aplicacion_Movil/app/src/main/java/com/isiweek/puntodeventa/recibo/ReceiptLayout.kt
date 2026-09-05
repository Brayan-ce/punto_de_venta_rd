package com.isiweek.puntodeventa.recibo

/**
 * Dimensiones centralizadas del recibo. NO usar números arbitrarios en el renderer.
 */
object ReceiptDimensions {
    const val RECEIPT_WIDTH = 576

    const val HORIZONTAL_PADDING = 30
    const val SECTION_SPACING = 28
    const val FIELD_SPACING = 8
    const val HEADER_SPACING = 10
    const val SEPARATOR_SPACING = 12
    const val FOOTER_SPACING = 12

    // Altura de línea de texto según jerarquía
    const val LINE_HEIGHT_SMALL = 16
    const val LINE_HEIGHT_NORMAL = 19
    const val LINE_HEIGHT_LARGE = 25
    const val LINE_HEIGHT_XLARGE = 30

    // Separadores
    const val SEPARATOR_MAIN_THICKNESS = 2
    const val SEPARATOR_SECONDARY_THICKNESS = 1
    const val SEPARATOR_DOTTED_GAP = 8
}

/** Anchos de columna de la tabla de cuotas (% del ancho útil). */
object ReceiptTableColumns {
    const val NUMBER = 0.08f
    const val DUE_DATE = 0.35f
    const val LATE_FEE = 0.17f
    const val APPLIED = 0.40f
}

/** Jerarquía tipográfica del recibo. */
enum class ReceiptTextStyle {
    BUSINESS_NAME,
    TITLE,
    SUBTITLE,
    NORMAL,
    LABEL_VALUE,
    TABLE_HEADER,
    TABLE_CONTENT,
    AMOUNT,
    TOTAL,
    FOOTER
}

/** Resultado de la medición del layout. */
data class ReceiptSize(val width: Int, val height: Int)

/**
 * Calcula la altura dinámica del recibo según el contenido y las opciones
 * "Mostrar en Recibo". Único responsable de las métricas:
 * Preview, PNG, PDF e impresión usan el mismo resultado.
 */
object ReceiptLayout {

    private val D = ReceiptDimensions

    private fun heightFor(style: ReceiptTextStyle): Int = when (style) {
        ReceiptTextStyle.BUSINESS_NAME -> D.LINE_HEIGHT_XLARGE
        ReceiptTextStyle.TITLE -> D.LINE_HEIGHT_LARGE
        ReceiptTextStyle.SUBTITLE -> D.LINE_HEIGHT_NORMAL
        ReceiptTextStyle.NORMAL -> D.LINE_HEIGHT_NORMAL
        ReceiptTextStyle.LABEL_VALUE -> D.LINE_HEIGHT_NORMAL
        ReceiptTextStyle.TABLE_HEADER -> D.LINE_HEIGHT_SMALL
        ReceiptTextStyle.TABLE_CONTENT -> D.LINE_HEIGHT_NORMAL
        ReceiptTextStyle.AMOUNT -> D.LINE_HEIGHT_NORMAL
        ReceiptTextStyle.TOTAL -> D.LINE_HEIGHT_LARGE
        ReceiptTextStyle.FOOTER -> D.LINE_HEIGHT_LARGE
    }

    fun measure(data: ReceiptData): ReceiptSize {
        val o = data.options
        var height = D.SECTION_SPACING // top padding

        // Encabezado empresa (switch mostrarDatosEmpresa)
        if (o.showEmpresa) {
            height += heightFor(ReceiptTextStyle.BUSINESS_NAME) + D.HEADER_SPACING
            if (data.razonSocial != null) height += heightFor(ReceiptTextStyle.NORMAL)
            if (data.rnc != null) height += heightFor(ReceiptTextStyle.NORMAL)
            if (data.address != null) height += heightFor(ReceiptTextStyle.NORMAL)
            if (data.phone != null) height += heightFor(ReceiptTextStyle.NORMAL)
            height += D.SEPARATOR_SPACING
            height += D.SEPARATOR_MAIN_THICKNESS
            height += D.SEPARATOR_SPACING
        }

        // Título recibo (siempre visible)
        height += heightFor(ReceiptTextStyle.TITLE) + D.HEADER_SPACING
        height += heightFor(ReceiptTextStyle.SUBTITLE) // Recibo No.
        height += heightFor(ReceiptTextStyle.NORMAL)   // Contrato
        height += D.SEPARATOR_SPACING + D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING

        // Información cliente (Fecha siempre; resto con switch mostrarDatosCliente)
        height += heightFor(ReceiptTextStyle.LABEL_VALUE) // Fecha
        if (o.showCliente) {
            height += heightFor(ReceiptTextStyle.LABEL_VALUE) // Cliente
            if (data.identification != null) height += heightFor(ReceiptTextStyle.LABEL_VALUE)
            if (data.clientPhone != null) height += heightFor(ReceiptTextStyle.LABEL_VALUE)
            if (data.clientAddress != null) height += heightFor(ReceiptTextStyle.LABEL_VALUE)
        }
        if (data.receivedBy != null) height += heightFor(ReceiptTextStyle.LABEL_VALUE)
        height += D.SEPARATOR_SPACING + D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING

        // Tabla de cuotas (switch mostrarCasillasAplicadas)
        if (o.showCuotas && data.installments.isNotEmpty()) {
            height += heightFor(ReceiptTextStyle.TABLE_HEADER)
            height += data.installments.size * heightFor(ReceiptTextStyle.TABLE_CONTENT)
            if (data.esVenta) height += data.installments.count { it.esExtra } * heightFor(ReceiptTextStyle.TABLE_HEADER)
            height += D.SEPARATOR_SPACING + D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING

            // Resumen financiero: capital + interés (+ mora si hay)
            height += heightFor(ReceiptTextStyle.LABEL_VALUE) // Capital
            height += heightFor(ReceiptTextStyle.LABEL_VALUE) // Interes
            if (data.lateFeeTotal?.isZero() == false) height += heightFor(ReceiptTextStyle.LABEL_VALUE)
            height += D.SEPARATOR_SPACING + D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING
        }

        // Total pagado (siempre visible)
        height += heightFor(ReceiptTextStyle.TOTAL)
        height += D.SEPARATOR_SPACING + D.SEPARATOR_SECONDARY_THICKNESS + D.SEPARATOR_SPACING

        // Recibido / Cambio (modo venta)
        if (data.esVenta) {
            if (data.efectivoRecibido != null) height += heightFor(ReceiptTextStyle.LABEL_VALUE)
            if (data.cambio != null) height += heightFor(ReceiptTextStyle.LABEL_VALUE)
        }

        // Método de pago (switch mostrarMetodoPago y existe método)
        if (o.showMetodo && data.paymentMethod.isNotBlank()) {
            height += heightFor(ReceiptTextStyle.LABEL_VALUE)
            height += D.SEPARATOR_SPACING + D.SEPARATOR_SECONDARY_THICKNESS + D.SEPARATOR_SPACING
        }

        // Referencia (si existe)
        if (data.reference != null) {
            height += heightFor(ReceiptTextStyle.LABEL_VALUE)
        }

        // Saldo restante + cuotas pendientes (switch mostrarSaldoRestante)
        if (o.showSaldo) {
            height += D.SEPARATOR_SPACING + D.SEPARATOR_SECONDARY_THICKNESS + D.SEPARATOR_SPACING
            height += heightFor(ReceiptTextStyle.LABEL_VALUE) // Saldo restante
            if (data.pendingInstallments > 0) height += heightFor(ReceiptTextStyle.LABEL_VALUE)
            height += D.SEPARATOR_SPACING + D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING
        }

        // Notas (switch mostrarNotas)
        if (o.showNotas && data.notes != null) {
            height += D.SEPARATOR_SPACING + D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING
            height += heightFor(ReceiptTextStyle.LABEL_VALUE)
        }

        // Footer (switch mostrarMensajeFinal)
        if (o.showMensaje) {
            height += D.SEPARATOR_SPACING + D.SEPARATOR_MAIN_THICKNESS + D.SEPARATOR_SPACING
            if (data.mensajeFactura != null) height += heightFor(ReceiptTextStyle.NORMAL)
            height += heightFor(ReceiptTextStyle.FOOTER) + D.FOOTER_SPACING
            height += heightFor(ReceiptTextStyle.NORMAL) // fecha impresión
        }

        height += D.SECTION_SPACING // bottom padding

        return ReceiptSize(D.RECEIPT_WIDTH, height)
    }

    /** Ancho útil del contenido (ancho total - padding horizontal). */
    fun contentWidth(): Int = D.RECEIPT_WIDTH - D.HORIZONTAL_PADDING * 2

    fun columnWidth(fraction: Float): Int = Math.round(contentWidth() * fraction)
}