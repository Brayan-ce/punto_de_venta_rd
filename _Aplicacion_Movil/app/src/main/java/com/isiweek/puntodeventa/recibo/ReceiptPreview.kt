package com.isiweek.puntodeventa.recibo

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Preview del recibo = réplica EXACTA del voucher de la web ISIWEEK
 * (imprimir.module.css + switches "Mostrar en Recibo" de imprimir.js).
 * Misma estructura, tipografía Courier, separadores, tabla y alineaciones.
 * Es reactivo: respeta [ReceiptOptions] y el tamaño de papel elegido.
 */
@Composable
fun ReceiptPreview(
    data: ReceiptData,
    tamano: String = "80mm",
    modifier: Modifier = Modifier
) {
    val F = ReceiptFormatters
    val o = data.options

    val maxAncho = when (tamano) {
        "58mm" -> 340.dp
        "A4" -> 640.dp
        else -> 440.dp
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .shadow(12.dp, RoundedCornerShape(4.dp))
                .fillMaxWidth()
                .widthIn(max = maxAncho),
            shape = RoundedCornerShape(4.dp),
            color = Color.White
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 22.dp, vertical = 26.dp)
            ) {
                // ── Encabezado empresa (switch mostrarDatosEmpresa) ──
                if (o.showEmpresa) {
                    EncabezadoVoucher(data)
                    LineaVoucher()
                }

                // ── Comprobante (siempre visible) ──
                val tituloRecibo = data.titulo ?: when {
                    data.esVenta -> "RECIBO DE VENTA"
                    data.notes?.contains("adelantado", ignoreCase = true) == true -> "RECIBO DE PAGO ADELANTADO"
                    else -> "RECIBO DE PAGO"
                }
                Text(
                    text = tituloRecibo,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF0F172A),
                    fontFamily = FontFamily.Monospace,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp)
                )
                Text(
                    text = if (data.esVenta) "No. ${data.receiptNumber}" else "Recibo No. ${data.receiptNumber}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF555555),
                    fontFamily = FontFamily.Monospace,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    Text(if (data.esVenta) "NCF: " else "Contrato: ", fontSize = 12.sp, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace)
                    Text(data.contractNumber, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace)
                }

                LineaVoucher()

                // ── Info cliente (Fecha siempre; resto con switch mostrarDatosCliente) ──
                InfoVoucher("Fecha:", F.formatDate(data.date))
                if (o.showCliente) {
                    InfoVoucher("Cliente:", data.clientName)
                    data.identification?.let { InfoVoucher(if (data.esVenta) "CED:" else "Cédula:", F.formatIdentification(it)) }
                    data.clientPhone?.let { InfoVoucher("Teléfono:", F.formatPhone(it)) }
                    data.clientAddress?.let { InfoVoucher("Dirección:", it) }
                }
                data.receivedBy?.let { InfoVoucher("Recibido por:", it) }

                LineaVoucher()

                // ── Tabla de cuotas/items + resumen (switch mostrarCasillasAplicadas) ──
                if (o.showCuotas && data.installments.isNotEmpty()) {
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        if (data.esVenta) {
                            Text("Cant.", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(40.dp), textAlign = TextAlign.End)
                            Text("Descripción", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.weight(1f))
                            Text("Precio", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(58.dp), textAlign = TextAlign.End)
                            Text("Total", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(94.dp), textAlign = TextAlign.End)
                        } else {
                            Text("#", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(34.dp), textAlign = TextAlign.Center)
                            Text("Vencimiento", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.weight(1f))
                            Text("Mora", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(58.dp), textAlign = TextAlign.End)
                            Text("Aplicado", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(94.dp), textAlign = TextAlign.End)
                        }
                    }
                    data.installments.forEach { c ->
                        if (data.esVenta && c.esExtra) {
                            Text("EXTRAS", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.fillMaxWidth().padding(top = 6.dp))
                        }
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                            if (data.esVenta) {
                                Text(fmtCantidad(c.lateFee), fontSize = 11.sp, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(40.dp), textAlign = TextAlign.End)
                                Text(c.dueDate, fontSize = 11.sp, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.weight(1f), maxLines = 2)
                                Text(F.formatMoney(c.unitPrice ?: c.applied), fontSize = 11.sp, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(58.dp), textAlign = TextAlign.End)
                                Text(F.formatMoney(c.applied), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(94.dp), textAlign = TextAlign.End)
                            } else {
                                Text(c.number.toString(), fontSize = 11.sp, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(34.dp), textAlign = TextAlign.Center)
                                Text(F.formatDate(c.dueDate), fontSize = 11.sp, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.weight(1f))
                                Text(if (c.lateFee.isZero()) "—" else F.formatMoney(c.lateFee), fontSize = 11.sp, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(58.dp), textAlign = TextAlign.End)
                                Text(F.formatMoney(c.applied), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(94.dp), textAlign = TextAlign.End)
                            }
                        }
                    }
                    LineaVoucher()

                    FilaTotalVoucher(if (data.esVenta) "Subtotal:" else "Capital:", F.formatMoney(data.capital))
                    FilaTotalVoucher(
                        if (data.esVenta) "ITBIS (%.2f%%):".format(data.impuestoPorcentaje ?: 0.0) else "Interés:",
                        F.formatMoney(data.interest)
                    )
                    if (data.lateFeeTotal?.isZero() == false) {
                        FilaTotalVoucher("Mora:", F.formatMoney(data.lateFeeTotal!!))
                    }
                    LineaDobleVoucher()
                    FilaTotalVoucher(if (data.esVenta) "TOTAL:" else "TOTAL PAGADO:", F.formatMoney(data.totalPaid), resaltado = true)
                    LineaSencillaVoucher()

                    // Recibido / Cambio (modo venta)
                    if (data.esVenta) {
                        data.efectivoRecibido?.let { FilaTotalVoucher("Recibido:", F.formatMoney(it)) }
                        data.cambio?.let { FilaTotalVoucher("Cambio:", F.formatMoney(it)) }
                        if (data.efectivoRecibido != null || data.cambio != null) {
                            LineaSencillaVoucher()
                        }
                    }
                } else {
                    FilaTotalVoucher(if (data.esVenta) "TOTAL:" else "TOTAL PAGADO:", F.formatMoney(data.totalPaid), resaltado = true)
                    LineaSencillaVoucher()
                }

                // ── Método de pago (switch mostrarMetodoPago) ──
                if (o.showMetodo && data.paymentMethod.isNotBlank()) {
                    FilaTotalVoucher("Método de Pago:", data.paymentMethod)
                    LineaSencillaVoucher()
                }

                // ── Referencia (si existe) ──
                data.reference?.let { FilaTotalVoucher("Referencia:", it) }

                // ── Saldo restante / cuotas pendientes (switch mostrarSaldoRestante) ──
                if (o.showSaldo) {
                    LineaSencillaVoucher()
                    FilaTotalVoucher("Saldo restante:", F.formatMoney(data.remainingBalance))
                    if (data.pendingInstallments > 0) {
                        FilaTotalVoucher("Cuotas pendientes:", data.pendingInstallments.toString())
                    }
                }

                // ── Notas (switch mostrarNotas) ──
                if (o.showNotas && data.notes != null) {
                    LineaVoucher()
                    InfoVoucher("NOTA:", data.notes)
                }

                // ── Footer (switch mostrarMensajeFinal) ──
                if (o.showMensaje) {
                    LineaVoucher()
                    data.mensajeFactura?.let { m ->
                        Text(m, fontSize = 11.sp, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                    }
                    Text(
                        text = if (data.esVenta) "¡GRACIAS POR SU COMPRA!" else "¡GRACIAS POR SU PAGO!",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0F172A),
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(top = 14.dp)
                    )
                    Text(
                        text = F.formatDate(data.issueDate, corto = true),
                        fontSize = 11.sp,
                        color = Color(0xFF555555),
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(top = 5.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun EncabezadoVoucher(data: ReceiptData) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = data.businessName,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF0F172A),
            fontFamily = FontFamily.Monospace,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)
        )
        data.razonSocial?.let { Text(it, fontSize = 11.sp, color = Color(0xFF475569), fontFamily = FontFamily.Monospace, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(vertical = 1.dp)) }
        data.rnc?.let { Text(it, fontSize = 11.sp, color = Color(0xFF475569), fontFamily = FontFamily.Monospace, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(vertical = 1.dp)) }
        data.address?.let { Text(it, fontSize = 11.sp, color = Color(0xFF475569), fontFamily = FontFamily.Monospace, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(vertical = 1.dp)) }
        data.phone?.let { Text("Tel: $it", fontSize = 11.sp, color = Color(0xFF475569), fontFamily = FontFamily.Monospace, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(vertical = 1.dp)) }
    }
}

@Composable
private fun InfoVoucher(label: String, valor: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace, modifier = Modifier.width(108.dp))
        Text(valor, fontSize = 12.sp, color = Color(0xFF0F172A), fontFamily = FontFamily.Monospace)
    }
}

@Composable
private fun FilaTotalVoucher(label: String, valor: String, resaltado: Boolean = false) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
        Text(
            label,
            fontSize = if (resaltado) 15.sp else 12.sp,
            fontWeight = if (resaltado) FontWeight.ExtraBold else FontWeight.SemiBold,
            color = Color(0xFF0F172A),
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.weight(1f)
        )
        Text(
            valor,
            fontSize = if (resaltado) 15.sp else 12.sp,
            fontWeight = if (resaltado) FontWeight.ExtraBold else FontWeight.Bold,
            color = Color(0xFF0F172A),
            fontFamily = FontFamily.Monospace,
            textAlign = TextAlign.End
        )
    }
}

@Composable
private fun LineaVoucher() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 9.dp)
            .height(2.dp)
            .background(Color.Black)
    )
}

/** Formatea una cantidad (columna "Cant." del modo venta), 2 decimales. */
private fun fmtCantidad(m: Money): String {
    if (m.isZero()) return "—"
    return "%.2f".format(m.amountInMinorUnits / 100.0)
}

@Composable
private fun LineaDobleVoucher() {
    Column(Modifier.fillMaxWidth().padding(vertical = 7.dp)) {
        Box(Modifier.fillMaxWidth().height(2.dp).background(Color.Black))
        Spacer(Modifier.height(2.dp))
        Box(Modifier.fillMaxWidth().height(2.dp).background(Color.Black))
    }
}

@Composable
private fun LineaSencillaVoucher() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 7.dp)
            .height(1.dp)
            .background(Color(0xFF666666))
    )
}