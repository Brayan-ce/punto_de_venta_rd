package com.isiweek.puntodeventa.recibo

import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.pantallas.financiamiento.DatosReciboPago
import com.isiweek.puntodeventa.pantallas.ticket.TicketVenta
import java.util.Calendar

/**
 * Convierte los datos de la app (DatosReciboPago + empresa offline) en el modelo [ReceiptData].
 * Aquí vive la lógica de negocio (cálculo de cuotas, empresa), NO en el renderer.
 */
object ReceiptMapper {

    /**
     * @param opciones Mapa de switches "Mostrar en Recibo" (claves: empresa, cliente,
     * cuotas, metodo, saldo, notas, mensaje). Si una clave falta, se muestra (default true).
     */
    fun fromDatosRecibo(
        recibo: DatosReciboPago,
        opciones: Map<String, Boolean> = emptyMap()
    ): ReceiptData {
        val empresa = RepositorioOffline.obtenerEmpresa()
        val moneda = empresa?.moneda ?: RepositorioOffline.moneda()
        val simbolo = empresa?.simboloMoneda?.takeIf { it.isNotBlank() } ?: RepositorioOffline.simboloMoneda()
        val nombreEmpresa = empresa?.nombre?.takeIf { it.isNotBlank() && it != "null" } ?: "PRUEBA"
        val razonSocial = empresa?.razonSocial?.takeIf { it.isNotBlank() && it != "null" && it != nombreEmpresa }
        val rnc = empresa?.rnc?.takeIf { it.isNotBlank() && it != "null" } ?: "738-29292-9"
        val direccion = empresa?.direccion?.takeIf { it.isNotBlank() && it != "null" } ?: "Direccion pendiente"
        val telefono = empresa?.telefono?.takeIf { it.isNotBlank() && it != "null" } ?: "8295844245"
        val mensajeFactura = empresa?.mensajeFactura?.takeIf { it.isNotBlank() && it != "null" }

        val cuotas = recibo.cuotas.map {
            ReceiptInstallment(
                number = it.numero,
                dueDate = it.vencimiento,
                lateFee = Money.of(parseMonto(it.mora), moneda, simbolo),
                applied = Money.of(parseMonto(it.aplicado), moneda, simbolo)
            )
        }

        val options = ReceiptOptions(
            showEmpresa = opciones["empresa"] != false,
            showCliente = opciones["cliente"] != false,
            showCuotas = opciones["cuotas"] != false,
            showMetodo = opciones["metodo"] != false,
            showSaldo = opciones["saldo"] != false,
            showNotas = opciones["notas"] != false,
            showMensaje = opciones["mensaje"] != false
        )

        return ReceiptData(
            businessName = nombreEmpresa,
            razonSocial = razonSocial,
            rnc = rnc,
            address = direccion,
            phone = telefono,
            receiptNumber = recibo.reciboNo.toString(),
            contractNumber = recibo.contratoNumero,
            date = recibo.fecha,
            clientName = recibo.cliente,
            identification = recibo.documento.takeIf { it.isNotBlank() },
            clientPhone = recibo.telefono.takeIf { it.isNotBlank() },
            clientAddress = null,
            receivedBy = recibo.recibidoPor.takeIf { it.isNotBlank() },
            installments = cuotas,
            capital = Money.of(parseMonto(recibo.capital), moneda, simbolo),
            interest = Money.of(parseMonto(recibo.interes), moneda, simbolo),
            lateFeeTotal = Money.of(parseMonto(recibo.mora), moneda, simbolo).takeIf { !it.isZero() },
            totalPaid = Money.of(parseMonto(recibo.totalPagado), moneda, simbolo),
            paymentMethod = recibo.metodoPago,
            reference = recibo.referencia.takeIf { it.isNotBlank() },
            remainingBalance = Money.of(parseMonto(recibo.saldoRestante), moneda, simbolo),
            pendingInstallments = recibo.cuotasPendientes,
            issueDate = hoyISO(),
            notes = recibo.notas.takeIf { it.isNotBlank() },
            mensajeFactura = mensajeFactura,
            options = options
        )
    }

    /**
     * Convierte un [TicketVenta] (POS) en un [ReceiptData] de modo venta,
     * con el mismo diseño que el recibo de pago (esVenta = true).
     */
    fun fromTicketVenta(
        ticket: TicketVenta,
        opciones: Map<String, Boolean> = emptyMap()
    ): ReceiptData {
        val empresa = RepositorioOffline.obtenerEmpresa()
        val moneda = empresa?.moneda ?: RepositorioOffline.moneda()
        val simbolo = empresa?.simboloMoneda?.takeIf { it.isNotBlank() } ?: RepositorioOffline.simboloMoneda()
        val nombreEmpresa = empresa?.nombre?.takeIf { it.isNotBlank() && it != "null" } ?: "PRUEBA"
        val razonSocial = empresa?.razonSocial?.takeIf { it.isNotBlank() && it != "null" && it != nombreEmpresa }
        val rnc = empresa?.rnc?.takeIf { it.isNotBlank() && it != "null" } ?: "738-29292-9"
        val direccion = empresa?.direccion?.takeIf { it.isNotBlank() && it != "null" } ?: "Direccion pendiente"
        val telefono = empresa?.telefono?.takeIf { it.isNotBlank() && it != "null" } ?: "8295844245"
        val mensajeFactura = empresa?.mensajeFactura?.takeIf { it.isNotBlank() && it != "null" }

        val items = ticket.lineas.mapIndexed { i, l ->
            ReceiptInstallment(
                number = i + 1,
                dueDate = l.nombre,
                lateFee = Money.of(l.cantidad, moneda, simbolo),
                applied = Money.of(l.total, moneda, simbolo),
                unitPrice = Money.of(l.precio, moneda, simbolo),
                esExtra = l.esExtra
            )
        }

        val options = ReceiptOptions(
            showEmpresa = opciones["empresa"] != false,
            showCliente = opciones["cliente"] != false,
            showCuotas = opciones["cuotas"] != false,
            showMetodo = opciones["metodo"] != false,
            showSaldo = false,
            showNotas = opciones["notas"] != false,
            showMensaje = opciones["mensaje"] != false
        )

        return ReceiptData(
            businessName = nombreEmpresa,
            razonSocial = razonSocial,
            rnc = rnc,
            address = direccion,
            phone = telefono,
            receiptNumber = ticket.numeroInterno,
            contractNumber = ticket.ncf,
            date = ticket.fecha,
            clientName = ticket.clienteNombre ?: "Consumidor Final",
            identification = ticket.clienteDocumento?.takeIf { it.isNotBlank() },
            clientPhone = null,
            clientAddress = null,
            receivedBy = ticket.vendedorNombre.takeIf { it.isNotBlank() },
            installments = items,
            capital = Money.of(ticket.subtotal, moneda, simbolo),
            interest = Money.of(ticket.itbis, moneda, simbolo),
            lateFeeTotal = null,
            totalPaid = Money.of(ticket.total, moneda, simbolo),
            paymentMethod = ticket.metodoPago,
            reference = null,
            remainingBalance = Money.zero(moneda),
            pendingInstallments = 0,
            issueDate = hoyISO(),
            notes = null,
            mensajeFactura = mensajeFactura,
            options = options,
            esVenta = true,
            titulo = ticket.tipoComprobante.takeIf { it.isNotBlank() },
            impuestoPorcentaje = empresa?.impuestoPorcentaje?.toDoubleOrNull() ?: 0.0,
            efectivoRecibido = if (ticket.efectivoRecibido > 0) Money.of(ticket.efectivoRecibido, moneda, simbolo) else null,
            cambio = if (ticket.cambio > 0) Money.of(ticket.cambio, moneda, simbolo) else null
        )
    }

    private fun parseMonto(s: String): Double =
        s.replace(Regex("[^\\d.,-]"), "").replace(",", "").toDoubleOrNull() ?: 0.0

    private fun hoyISO(): String {
        val c = Calendar.getInstance()
        val y = c.get(Calendar.YEAR)
        val m = (c.get(Calendar.MONTH) + 1).toString().padStart(2, '0')
        val d = c.get(Calendar.DAY_OF_MONTH).toString().padStart(2, '0')
        return "$y-$m-$d"
    }
}