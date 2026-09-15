package com.isiweek.puntodeventa.utils

import com.isiweek.puntodeventa.pantallas.ticket.TicketVenta
import java.nio.charset.Charset
import java.util.Locale

/**
 * Réplica de utils/escpos.js de la web.
 * Genera el ticket en formato ESC/POS para impresoras térmicas (58mm=32 chars, 80mm=42 chars).
 */
object ESCPOS {
    private val ENCODING = Charset.forName("Cp437")

    /** Builder con comandos ESC/POS (métodos encadenables). */
    private class Builder {
        private val bytes = ArrayList<Byte>()

        private fun cmd(vararg b: Byte): Builder {
            for (x in b) bytes.add(x)
            return this
        }

        fun init(): Builder = cmd(0x1B, 0x40)

        fun alignLeft(): Builder = cmd(0x1B, 0x61, 0x00)

        fun alignCenter(): Builder = cmd(0x1B, 0x61, 0x01)

        fun alignRight(): Builder = cmd(0x1B, 0x61, 0x02)

        fun bold(on: Boolean): Builder = cmd(0x1B, 0x45, if (on) 0x01 else 0x00)

        fun textSize(w: Int, h: Int): Builder = cmd(0x1D, 0x21, (((w - 1) shl 4) or (h - 1)).toByte())

        fun text(texto: String): Builder {
            val limpio = acentos(texto)
            val raw = limpio.toByteArray(ENCODING)
            for (b in raw) bytes.add(b)
            return this
        }

        fun newLine(n: Int = 1): Builder {
            repeat(n) { bytes.add(0x0A) }
            return this
        }

        fun line(char: Char = '-', width: Int = 32): Builder = text(char.toString().repeat(width)).newLine()

        fun doubleLine(char: Char = '=', width: Int = 32): Builder = line(char, width)

        fun cut(): Builder = cmd(0x1D, 0x56, 0x41)

        fun build(): ByteArray = bytes.toByteArray()
    }

    private fun acentos(texto: String): String {
        return texto
            .replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
            .replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U")
            .replace("ñ", "n").replace("Ñ", "N")
            .replace("¡", "").replace("¿", "")
            .replace("º", "o").replace("ª", "a")
    }

    private fun formatearMonto(monto: Double): String {
        return String.format(Locale.US, "%,.2f", monto).replace(',', '\u00A0')
    }

    private fun elegirTamanoTexto(texto: String, anchoLinea: Int): Pair<Int, Int> {
        val opciones = listOf(2 to 2, 2 to 1, 1 to 2, 1 to 1)
        for ((w, h) in opciones) {
            if (texto.length * w <= anchoLinea) return w to h
        }
        return 1 to 1
    }

    private fun filaEtiquetaValor(b: Builder, etiqueta: String, valor: String, ancho: Int) {
        val esp = ancho - etiqueta.length - valor.length
        if (esp >= 1) {
            b.text(etiqueta + " ".repeat(esp) + valor).newLine()
        } else {
            b.text(etiqueta).newLine()
            b.alignRight().text(valor).newLine().alignLeft()
        }
    }

    private fun imprimirTotalTicket(b: Builder, total: Double, ancho: Int) {
        val montoStr = String.format(Locale.US, "%.2f", total)
        val (w, h) = elegirTamanoTexto(montoStr, ancho)

        b.doubleLine('=', ancho)
        b.alignCenter().bold(true).textSize(1, 1)
        b.text("TOTAL").newLine()
        b.textSize(w, h)
        b.text(montoStr).newLine()
        b.textSize(1, 1).bold(false).alignLeft()
    }

    /** Genera el ticket ESC/POS. anchoLinea: 32 para 58mm, 42 para 80mm. */
    fun generarTicket(ticket: TicketVenta, anchoLinea: Int = 42, idioma: String = "es"): ByteArray {
        val t = { clave: String -> when (clave) {
            "fecha" -> if (idioma == "en") "Date" else "Fecha"
            "vendedor" -> if (idioma == "en") "Seller" else "Vendedor"
            "cliente" -> if (idioma == "en") "Customer" else "Cliente"
            "consumidorFinal" -> if (idioma == "en") "Final Consumer" else "Consumidor Final"
            "cantidad" -> if (idioma == "en") "Qty" else "Cant"
            "descripcion" -> if (idioma == "en") "Description" else "Descripcion"
            "total" -> if (idioma == "en") "Total" else "Total"
            "subtotal" -> if (idioma == "en") "Subtotal" else "Subtotal"
            "descuento" -> if (idioma == "en") "Discount" else "Descuento"
            "recibido" -> if (idioma == "en") "Received" else "Recibido"
            "cambio" -> if (idioma == "en") "Change" else "Cambio"
            "metodo" -> if (idioma == "en") "Method" else "Metodo"
            "nota" -> if (idioma == "en") "NOTE" else "NOTA"
            "gracias" -> if (idioma == "en") "THANK YOU FOR YOUR PURCHASE" else "GRACIAS POR SU COMPRA"
            "comprobante" -> if (idioma == "en") "Authorized fiscal receipt DGII" else "Comprobante fiscal autorizado DGII"
            else -> clave
        } }

        val b = Builder()
        b.init().alignCenter()

        // Empresa (datos reales de la base importada, con fallback)
        val empresa = com.isiweek.puntodeventa.offline.RepositorioOffline.obtenerEmpresa()
        val nombreEmpresa = empresa?.nombre?.takeIf { it.isNotBlank() } ?: "PRUEBA"
        val rncEmpresa = empresa?.rnc?.takeIf { it.isNotBlank() } ?: "RNC: 738-29292-9"
        val direccionEmpresa = empresa?.direccion?.takeIf { it.isNotBlank() } ?: "Direccion pendiente"
        val telefonoEmpresa = empresa?.telefono?.takeIf { it.isNotBlank() } ?: "Tel: 8295844245"
        b.bold(true).textSize(2, 2)
        b.text(nombreEmpresa).newLine()
        b.textSize(1, 1).bold(false)
        b.text(rncEmpresa).newLine()
        b.text(direccionEmpresa).newLine()
        b.text(telefonoEmpresa).newLine()
        b.alignLeft()
        b.line('-', anchoLinea)

        // Comprobante
        b.alignCenter().bold(true)
        b.text(ticket.tipoComprobante).newLine()
        b.text("NCF: " + ticket.ncf).newLine()
        b.text("No. " + ticket.numeroInterno).newLine()
        b.bold(false)
        b.alignLeft()
        b.line('-', anchoLinea)

        // Info
        b.text(t("fecha") + ": " + ticket.fecha).newLine()
        b.text(t("vendedor") + ": " + ticket.vendedorNombre).newLine()
        b.text(t("cliente") + ": " + (ticket.clienteNombre ?: t("consumidorFinal"))).newLine()
        b.line('-', anchoLinea)

        // Cabecera productos
        b.text(t("cantidad") + "  " + t("descripcion") + "    " + t("total")).newLine()
        b.line('-', anchoLinea)

        // Productos
        ticket.lineas.forEach { linea ->
            val cantidadTexto = formatearCantidad(linea.cantidad)
            val totalFormateado = String.format(Locale.US, "%.2f", linea.total)
            val nombreMax = anchoLinea - cantidadTexto.length - totalFormateado.length - 2
            var nombre = linea.nombre
            if (nombre.length > nombreMax) {
                nombre = nombre.substring(0, nombreMax)
            } else {
                nombre = nombre.padEnd(nombreMax, ' ')
            }
            b.text(cantidadTexto + " " + nombre + " " + totalFormateado).newLine()
            b.text("      @" + String.format(Locale.US, "%.2f", linea.precio)).newLine()
        }

        b.line('-', anchoLinea)

        // Totales
        filaEtiquetaValor(b, t("subtotal") + ":", formatearMonto(ticket.subtotal), anchoLinea)
        if (ticket.descuento > 0) {
            filaEtiquetaValor(b, t("descuento") + ":", formatearMonto(ticket.descuento), anchoLinea)
        }
        filaEtiquetaValor(b, "ITBIS (18%):", formatearMonto(ticket.itbis), anchoLinea)

        imprimirTotalTicket(b, ticket.total, anchoLinea)

        if (ticket.efectivoRecibido > 0) {
            b.line('-', anchoLinea)
            filaEtiquetaValor(b, t("recibido") + ":", formatearMonto(ticket.efectivoRecibido), anchoLinea)
            filaEtiquetaValor(b, t("cambio") + ":", formatearMonto(ticket.cambio), anchoLinea)
        }

        b.line('-', anchoLinea)
        b.text(t("metodo") + ": " + ticket.metodoPago).newLine()

        b.line('-', anchoLinea)
        b.alignCenter()
        b.text(t("comprobante")).newLine()
        b.bold(true).text(t("gracias")).newLine().bold(false)

        b.newLine(1)
        b.cut()

        return b.build()
    }

    /** Texto plano del ticket (para compartir/copiar a RawBT). */
    fun generarTextoPlano(ticket: TicketVenta, anchoLinea: Int = 42, idioma: String = "es"): String {
        return String(generarTicket(ticket, anchoLinea, idioma), ENCODING)
            .replace('\u0000', ' ')
            .trim()
    }

    private fun formatearCantidad(cantidad: Double): String {
        return if (cantidad == cantidad.toLong().toDouble()) {
            cantidad.toLong().toString()
        } else {
            String.format(Locale.US, "%.3f", cantidad).trimEnd('0').trimEnd('.')
        }
    }

    fun anchoPorTamaño(tamaño: String): Int = if (tamaño == "58mm") 32 else 42
}