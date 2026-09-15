package com.isiweek.puntodeventa.recibo

/**
 * Genera el ticket ESC/POS para RawBT a partir de un [ReceiptData].
 * Replica el diseño de la preview (empresa, título, tabla, totales, gracias)
 * adaptado al ancho del papel (58mm = 32 columnas, 80mm = 42 columnas).
 * Funciona tanto para recibo de pago (esVenta=false) como para venta (esVenta=true).
 */
object ReceiptEscPos {

    fun generar(data: ReceiptData, tamano: String = "80mm"): String {
        val ESC = "\u001B"
        val B_ON = ESC + "E\u0001"
        val B_OFF = ESC + "E\u0000"
        val ancho = if (tamano == "58mm") 32 else 42
        val F = ReceiptFormatters

        fun centro(s: String) = ESC + "a\u0001" + s + "\n"
        fun izquierda(s: String) = ESC + "a\u0000" + s + "\n"
        fun negritaCentro(s: String) = ESC + "a\u0001" + B_ON + s + B_OFF + "\n"
        fun negritaIzq(s: String) = ESC + "a\u0000" + B_ON + s + B_OFF + "\n"
        fun linea(ch: String) = ch.repeat(ancho)
        fun fila2(izq: String, der: String, negritaDer: Boolean = false): String {
            val esp = (ancho - izq.length - der.length).coerceAtLeast(1)
            return izq + " ".repeat(esp) + (if (negritaDer) B_ON + der + B_OFF else der)
        }
        fun celdaIzq(t: String, w: Int): String = t.padEnd(w).take(w)
        fun celdaDer(t: String, w: Int): String = t.padStart(w).take(w)
        fun fmtCantidad(v: Double): String = "%.2f".format(v)

        val o = data.options
        val sb = StringBuilder()
        sb.append(ESC + "@") // Reset impresora

        // ── Encabezado empresa ──
        if (o.showEmpresa) {
            sb.append(negritaCentro(data.businessName))
            data.rnc?.let { sb.append(centro("RNC: $it")) }
            data.address?.let { sb.append(centro(it)) }
            data.phone?.let { sb.append(centro("Tel: $it")) }
            sb.append(izquierda(linea("=")))
        }

        // ── Título ──
        val titulo = data.titulo ?: when {
            data.esVenta -> "RECIBO DE VENTA"
            data.notes?.contains("adelantado", ignoreCase = true) == true -> "RECIBO DE PAGO ADELANTADO"
            else -> "RECIBO DE PAGO"
        }
        sb.append(negritaCentro(titulo))
        sb.append(centro(if (data.esVenta) "No. ${data.receiptNumber}" else "Recibo No. ${data.receiptNumber}"))
        sb.append(izquierda(fila2(if (data.esVenta) "NCF:" else "Contrato:", data.contractNumber, negritaDer = true)))
        sb.append(izquierda(linea("=")))

        // ── Info cliente ──
        sb.append(izquierda(fila2("Fecha:", F.formatDate(data.date))))
        if (o.showCliente) {
            sb.append(izquierda(fila2("Cliente:", data.clientName)))
            data.identification?.let { sb.append(izquierda(fila2(if (data.esVenta) "CED:" else "Cedula:", it))) }
            data.clientPhone?.let { sb.append(izquierda(fila2("Telefono:", it))) }
        }
        data.receivedBy?.let { sb.append(izquierda(fila2(if (data.esVenta) "Vendedor:" else "Recibido por:", it))) }
        sb.append(izquierda(linea("=")))

        // ── Tabla (cuotas o productos) + desglose ──
        if (o.showCuotas && data.installments.isNotEmpty()) {
            val wv = if (tamano == "58mm") 13 else 17
            val wm = if (tamano == "58mm") 6 else 9
            val wa = ancho - 3 - wv - wm
            sb.append(negritaIzq(if (data.esVenta) "PRODUCTOS:" else "CUOTAS APLICADAS:"))
            if (data.esVenta) {
                sb.append(izquierda(
                    celdaIzq("CANT", 3) + celdaIzq("DESCRIPCION", wv) + celdaDer("PRECIO", wm) + celdaDer("TOTAL", wa)
                ))
            } else {
                sb.append(izquierda(
                    celdaIzq("#", 3) + celdaIzq("VENCIMIENTO", wv) + celdaDer("MORA", wm) + celdaDer("APLICADO", wa)
                ))
            }
            data.installments.forEach { c ->
                if (data.esVenta && c.esExtra) {
                    sb.append(izquierda(celdaIzq("EXTRAS", 3) + celdaIzq("", wv) + celdaDer("", wm) + celdaDer("", wa)))
                }
                if (data.esVenta) {
                    sb.append(izquierda(
                        celdaIzq(fmtCantidad(c.lateFee.amountInMinorUnits / 100.0), 3) +
                                celdaIzq(c.dueDate, wv) +
                                celdaDer(F.formatMoney(c.unitPrice ?: c.applied), wm) +
                                celdaDer(F.formatMoney(c.applied), wa)
                    ))
                } else {
                    val nombre = F.formatDate(c.dueDate)
                    val cant = if (c.lateFee.isZero()) "—" else F.formatMoney(c.lateFee)
                    sb.append(izquierda(
                        celdaIzq(c.number.toString(), 3) + celdaIzq(nombre, wv) + celdaDer(cant, wm) + celdaDer(F.formatMoney(c.applied), wa)
                    ))
                }
            }
            sb.append(izquierda(linea("-")))
            sb.append(izquierda(fila2(if (data.esVenta) "Subtotal:" else "Capital:", F.formatMoney(data.capital), negritaDer = true)))
            sb.append(izquierda(fila2(if (data.esVenta) "ITBIS (%.2f%%):".format(data.impuestoPorcentaje ?: 0.0) else "Interes:", F.formatMoney(data.interest), negritaDer = true)))
            if (data.lateFeeTotal?.isZero() == false) {
                sb.append(izquierda(fila2("Mora:", F.formatMoney(data.lateFeeTotal!!), negritaDer = true)))
            }
            sb.append(izquierda(linea("=")))
            sb.append(izquierda(linea("="))) // línea doble
        }

        // ── TOTAL ──
        sb.append(negritaCentro(if (data.esVenta) "TOTAL: ${F.formatMoney(data.totalPaid)}" else "TOTAL PAGADO: ${F.formatMoney(data.totalPaid)}"))
        sb.append(izquierda(linea("-")))

        // ── Recibido / Cambio (modo venta) ──
        if (data.esVenta) {
            data.efectivoRecibido?.let { sb.append(izquierda(fila2("Recibido:", F.formatMoney(it)))) }
            data.cambio?.let { sb.append(izquierda(fila2("Cambio:", F.formatMoney(it)))) }
        }

        // ── Método de pago ──
        if (o.showMetodo && data.paymentMethod.isNotBlank()) {
            sb.append(izquierda(fila2("Metodo de Pago:", data.paymentMethod)))
            sb.append(izquierda(linea("-")))
        }

        // ── Referencia ──
        data.reference?.let { sb.append(izquierda(fila2("Referencia:", it))) }

        // ── Saldo (solo recibo de pago) ──
        if (o.showSaldo) {
            sb.append(izquierda(linea("-")))
            sb.append(izquierda(fila2("Saldo restante:", F.formatMoney(data.remainingBalance), negritaDer = true)))
            if (data.pendingInstallments > 0) {
                sb.append(izquierda(fila2("Cuotas pendientes:", data.pendingInstallments.toString(), negritaDer = true)))
            }
        }

        // ── Notas ──
        if (o.showNotas && data.notes != null) {
            sb.append(izquierda(linea("=")))
            sb.append(izquierda(fila2("NOTA:", data.notes, negritaDer = true)))
        }

        // ── Footer ──
        if (o.showMensaje) {
            sb.append(izquierda(linea("=")))
            data.mensajeFactura?.let { sb.append(centro(it)) }
            sb.append(negritaCentro(if (data.esVenta) "GRACIAS POR SU COMPRA!" else "GRACIAS POR SU PAGO!"))
            sb.append(centro(F.formatDate(data.issueDate, corto = true)))
        }

        sb.append("\n")
        sb.append(ESC + "i") // Corte de papel
        return sb.toString()
    }
}