package com.isiweek.puntodeventa.pantallas.financiamiento

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Print
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.CampoMoneda
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

internal data class CuotaContrato(
    val numero: Int,
    val fechaVencimiento: String,
    val diasRetraso: Int,
    val cuota: String,
    val capital: String,
    val interes: String,
    val mora: String,
    val total: String,
    val estado: String,
    val fechaPago: String?
)

internal data class PagoContrato(
    val fecha: String,
    val monto: String,
    val capital: String,
    val interes: String,
    val mora: String,
    val metodo: String,
    val referencia: String,
    val registradoPor: String
)

internal data class ContratoVer(
    val id: Int,
    val numero: String,
    val cliente: String,
    val documento: String,
    val telefono: String,
    val email: String,
    val direccion: String,
    val estado: String,
    val financiado: String,
    val pagoAdelantado: String,
    val totalPagar: String,
    val intereses: String,
    val saldoPendiente: String,
    val cuotaMensual: String,
    val frecuencia: String,
    val meses: Int,
    val tasa: String,
    val plan: String,
    val fechaInicio: String,
    val fechaFin: String,
    val vendedor: String,
    val cuotasPagadas: Int,
    val cobrado: String,
    val cuotas: List<CuotaContrato>,
    val pagos: List<PagoContrato>
)

internal fun obtenerContratoVer(id: Int): ContratoVer? {
    if (!RepositorioOffline.hayDatosOffline()) {
        return null
    }
    val c = RepositorioOffline.obtenerContratos().firstOrNull { it.id == id }
    return c?.let { construirContratoVerOffline(it) }
}

/** Construye un ContratoVer desde un contrato del JSON importado. */
private fun construirContratoVerOffline(c: RepositorioOffline.ContratoOffline): ContratoVer {
    val clientes = RepositorioOffline.obtenerClientesFin()
    val planes = RepositorioOffline.obtenerPlanes()
    val cliente = clientes.firstOrNull { it.id == c.clienteId }
    val plan = planes.firstOrNull { it.id == c.planId }
    val cuotasOff = RepositorioOffline.obtenerCuotas().filter { it.contratoId == c.id }
    val pagosOff = RepositorioOffline.obtenerPagos().filter { it.contratoId == c.id }
    val cuotasContrato = cuotasOff.map { q ->
        val pagado = RepositorioOffline.montoPagadoCuota(q.id)
        val montoCuota = if (q.estado == "parcial") {
            Math.round((q.monto - pagado) * 100.0) / 100.0
        } else {
            q.monto
        }
        CuotaContrato(
            numero = q.numero,
            fechaVencimiento = q.fechaVencimiento.take(10),
            diasRetraso = 0,
            cuota = RepositorioOffline.formatoMonto(montoCuota),
            capital = RepositorioOffline.formatoMonto(q.capital),
            interes = RepositorioOffline.formatoMonto(q.interes),
            mora = RepositorioOffline.formatoMonto(q.mora),
            total = RepositorioOffline.formatoMonto(montoCuota + q.mora),
            estado = q.estado,
            fechaPago = q.fechaPago.takeIf { it.isNotBlank() }?.take(10)
        )
    }
    val pagosContrato = pagosOff.map { p ->
        PagoContrato(
            fecha = p.fecha.take(10),
            monto = RepositorioOffline.formatoMonto(p.monto),
            capital = RepositorioOffline.formatoMonto(p.montoCapital),
            interes = RepositorioOffline.formatoMonto(p.montoInteres),
            mora = RepositorioOffline.formatoMonto(p.montoMora),
            metodo = "Efectivo",
            referencia = "",
            registradoPor = "offline"
        )
    }
    return ContratoVer(
        id = c.id,
        numero = c.numero,
        cliente = "${cliente?.nombre ?: "Cliente"} ${cliente?.apellidos ?: ""}".trim(),
        documento = cliente?.documento ?: "",
        telefono = cliente?.telefono ?: "",
        email = cliente?.email ?: "",
        direccion = cliente?.direccion ?: "",
        estado = c.estado,
        financiado = RepositorioOffline.formatoMonto(c.montoFinanciado),
        pagoAdelantado = RepositorioOffline.formatoMonto(c.montoInicial),
        totalPagar = RepositorioOffline.formatoMonto(c.totalPagar),
        intereses = RepositorioOffline.formatoMonto(c.totalIntereses),
        saldoPendiente = RepositorioOffline.formatoMonto(c.saldoPendiente),
        cuotaMensual = RepositorioOffline.formatoMonto(c.cuotaMensual),
        frecuencia = c.frecuencia,
        meses = c.meses,
        tasa = c.tasaInteres.toString(),
        plan = plan?.nombre ?: "Plan",
        fechaInicio = c.fechaInicio.take(10),
        fechaFin = c.fechaFin.take(10),
        vendedor = "",
        cuotasPagadas = cuotasOff.count { it.estado == "pagada" },
        cobrado = RepositorioOffline.formatoMonto(pagosOff.sumOf { it.monto }),
        cuotas = cuotasContrato,
        pagos = pagosContrato
    )
}

private fun parseMonto(s: String): Double =
    s.filter { it.isDigit() || it == '.' }.toDoubleOrNull() ?: 0.0

/** Formatea un número con miles y 2 decimales, SIN símbolo de moneda (para inputs que ya muestran el símbolo). */
private fun fmtNumVer(v: Double): String {
    val s = String.format("%.2f", v)
    val partes = s.split(".")
    val entero = partes[0].reversed().chunked(3).joinToString(",").reversed()
    return entero + "." + (partes.getOrNull(1) ?: "00")
}

private fun pct(v: Double, total: Double): String =
    if (total <= 0) "0.0" else ((v / total) * 100).let { String.format("%.1f", it.coerceAtMost(100.0)) }

private fun estadoStyleVer(estado: String): Triple<Color, Color, String> = when (estado) {
    "pagado" -> Triple(Color(0xFFDBEAFE), Color(0xFF1E40AF), "verContrato.pagado")
    "incumplido" -> Triple(Color(0xFFFEE2E2), Color(0xFF991B1B), "verContrato.incumplido")
    "reestructurado" -> Triple(Color(0xFFFEF3C7), Color(0xFF92400E), "verContrato.reestructurado")
    "cancelado" -> Triple(Color(0xFFF1F5F9), Color(0xFF475569), "verContrato.cancelado")
    else -> Triple(Color(0xFFD1FAE5), Color(0xFF065F46), "verContrato.activo")
}

private fun cuotaStyleVer(estado: String): Pair<Color, Color> = when (estado) {
    "pagada" -> Color(0xFFD1FAE5) to Color(0xFF065F46)
    "vencida" -> Color(0xFFFEE2E2) to Color(0xFF991B1B)
    "parcial" -> Color(0xFFE0F2FE) to Color(0xFF075985)
    else -> Color(0xFFFEF3C7) to Color(0xFF92400E)
}

private fun textoVer(clave: String, idioma: Idioma): String = Traducciones.texto(clave, idioma)

@Composable
internal fun VerContratoFinanciamientoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    contrato: ContratoVer,
    onVolver: () -> Unit,
    onEditar: () -> Unit
) {
    val t = TokensWeb(
        fondoPrincipal = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoElevado = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoTerciario = if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9),
        fondoContenido = if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC),
        textoPrimario = if (oscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A),
        textoSecundario = if (oscuro) Color(0xFFCBD5E1) else Color(0xFF475569),
        textoTerciario = if (oscuro) Color(0xFF94A3B8) else Color(0xFF94A3B8),
        bordeClaro = if (oscuro) Color(0xFF334155) else Color(0xFFE5E7EB),
        bordeMedio = if (oscuro) Color(0xFF475569) else Color(0xFFD1D5DB),
        primario = Color(0xFF0EA5E9),
        primarioClaro = if (oscuro) Color(0xFF0EA5E9).copy(alpha = 0.15f) else Color(0xFFE0F2FE),
        exito = Color(0xFF10B981)
    )

    val context = LocalContext.current

    var estado by remember { mutableStateOf(contrato.estado) }
    var cuotas by remember { mutableStateOf(contrato.cuotas) }
    var tabActiva by remember { mutableStateOf("cuotas") }
    var mostrarModalPago by remember { mutableStateOf<CuotaContrato?>(null) }
    var mostrarModalEstado by remember { mutableStateOf(false) }
    var nuevoEstado by remember { mutableStateOf(estado) }

    val badgeEstado = estadoStyleVer(estado)
    val cobradoN = parseMonto(contrato.cobrado)
    val totalPagarN = parseMonto(contrato.totalPagar)
    val progreso = pct(cobradoN, totalPagarN)
    val cuotasPagadas = cuotas.count { it.estado == "pagada" }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            // ================= HEADER (igual que el web) =================
            item {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Row(
                            modifier = Modifier
                                .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
                                .clickable(onClick = onVolver)
                                .padding(horizontal = 14.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(textoVer("verContrato.volverPrestamos", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    Spacer(Modifier.height(14.dp))

                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(contrato.numero, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Spacer(Modifier.height(2.dp))
                            Text(contrato.cliente, fontSize = 14.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        Spacer(Modifier.width(10.dp))
                        Box(
                            modifier = Modifier
                                .background(badgeEstado.first, RoundedCornerShape(20))
                                .padding(horizontal = 14.dp, vertical = 6.dp)
                        ) {
                            Text(textoVer(badgeEstado.third, idioma), color = badgeEstado.second, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
                                .clickable { mostrarModalEstado = true }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Outlined.SwapHoriz, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(7.dp))
                                Text(textoVer("verContrato.cambiarEstado", idioma), color = t.textoSecundario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .shadow(2.dp, RoundedCornerShape(10.dp), ambientColor = Color(0x406366F1), spotColor = Color(0x406366F1))
                                .background(Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF4F46E5))), RoundedCornerShape(10.dp))
                                .clickable { }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Outlined.Print, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(7.dp))
                                Text(textoVer("verContrato.imprimir", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .shadow(2.dp, RoundedCornerShape(10.dp), ambientColor = Color(0x400EA5E9), spotColor = Color(0x400EA5E9))
                                .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(10.dp))
                                .clickable(onClick = onEditar)
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Outlined.Edit, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(7.dp))
                                Text(textoVer("base.editar", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            // ================= RESUMEN (4 cards, 2x2) =================
            items(listOf(
                Triple("resumenCard1", contrato.financiado, Traducciones.texto("verContrato.pagoAdelantado", idioma) + ": " + contrato.pagoAdelantado),
                Triple("resumenCard2", contrato.totalPagar, Traducciones.texto("verContrato.intereses", idioma) + ": " + contrato.intereses),
                Triple("resumenCard3", contrato.saldoPendiente, "${contrato.cuotasPagadas} ${Traducciones.texto("verContrato.de", idioma)} ${contrato.meses} ${Traducciones.texto("verContrato.cuotas", idioma)}"),
                Triple("resumenCard4", contrato.cuotaMensual, "${contrato.meses} ${Traducciones.texto("verContrato.cuotas", idioma)} · ${contrato.tasa}% ${Traducciones.texto("verContrato.interes", idioma)}")
            ).chunked(2)) { fila ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 7.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    fila.forEach { (clave, valor, sub) ->
                        val label = when (clave) {
                            "resumenCard1" -> Traducciones.texto("verContrato.totalFinanciado", idioma)
                            "resumenCard2" -> Traducciones.texto("verContrato.totalPagar", idioma)
                            "resumenCard3" -> Traducciones.texto("verContrato.saldoPendiente", idioma)
                            else -> Traducciones.texto("verContrato.cuota", idioma) + " " + contrato.frecuencia
                        }
                        val colorValor = when (clave) {
                            "resumenCard3" -> Color(0xFFEF4444)
                            "resumenCard4" -> Color(0xFF0EA5E9)
                            else -> t.textoPrimario
                        }
                        val valorPrimero = clave == "resumenCard3" || clave == "resumenCard4"
                        ResumenCardVer(
                            label = label,
                            valor = valor,
                            sub = sub,
                            colorValor = colorValor,
                            valorPrimero = valorPrimero,
                            t = t,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // ================= PROGRESO DE PAGO =================
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                        .background(t.fondoElevado, RoundedCornerShape(12.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                        .padding(18.dp)
                ) {
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text(textoVer("verContrato.progreso", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.weight(1f))
                        Text("$progreso%", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF10B981))
                    }
                    Spacer(Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp)
                            .background(if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth((progreso.toDoubleOrNull() ?: 0.0).coerceIn(0.0, 100.0).toFloat() / 100f)
                                .height(10.dp)
                                .background(Brush.horizontalGradient(listOf(Color(0xFF10B981), Color(0xFF059669))), RoundedCornerShape(10.dp))
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            "${cuotasPagadas} ${Traducciones.texto("verContrato.de", idioma)} ${contrato.meses} ${Traducciones.texto("verContrato.cuotasPagadas", idioma)}",
                            fontSize = 12.sp,
                            color = t.textoTerciario,
                            modifier = Modifier.weight(1f)
                        )
                        Text("${contrato.cobrado} ${Traducciones.texto("verContrato.cobrado", idioma)}", fontSize = 12.sp, color = t.textoTerciario)
                    }
                }
            }

            // ================= INFO: Cliente + Préstamo =================
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 6.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    InfoCardVer(
                        titulo = textoVer("verContrato.cliente", idioma),
                        icono = Icons.Outlined.Person,
                        filas = listOf(
                            textoVer("verContrato.nombre", idioma) to contrato.cliente,
                            textoVer("verContrato.documento", idioma) to contrato.documento.ifBlank { "—" },
                            textoVer("verContrato.telefono", idioma) to contrato.telefono.ifBlank { "—" },
                            "Email" to contrato.email.ifBlank { "—" },
                            textoVer("verContrato.direccion", idioma) to contrato.direccion.ifBlank { "—" }
                        ),
                        t = t
                    )
                    InfoCardVer(
                        titulo = textoVer("verContrato.prestamo", idioma),
                        icono = Icons.Outlined.Description,
                        filas = listOf(
                            textoVer("verContrato.plan", idioma) to contrato.plan,
                            textoVer("verContrato.frecuencia", idioma) to contrato.frecuencia,
                            textoVer("verContrato.inicio", idioma) to contrato.fechaInicio,
                            textoVer("verContrato.fin", idioma) to contrato.fechaFin,
                            textoVer("verContrato.vendedor", idioma) to contrato.vendedor
                        ),
                        t = t
                    )
                }
            }

            // ================= TABS =================
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                        .border(0.dp, Color.Transparent),
                    horizontalArrangement = Arrangement.spacedBy(0.dp)
                ) {
                    val tabs = listOf(
                        Triple("cuotas", "verContrato.cuotas", Icons.Outlined.CalendarMonth) to cuotas.size,
                        Triple("pagos", "verContrato.pagos", Icons.Outlined.Payments) to contrato.pagos.size,
                        Triple("extras", "verContrato.extras", Icons.Outlined.Shield) to 0
                    )
                    tabs.forEach { (tab, count) ->
                        val (clave, labelClave, icono) = tab
                        val activo = tabActiva == clave
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { tabActiva = clave }
                                .padding(vertical = 10.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(icono, contentDescription = null, tint = if (activo) t.primario else t.textoSecundario, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    textoVer(labelClave, idioma),
                                    color = if (activo) t.primario else t.textoSecundario,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                if (count > 0) {
                                    Spacer(Modifier.width(6.dp))
                                    Box(
                                        modifier = Modifier
                                            .background(Color(0xFFE0F2FE), RoundedCornerShape(20))
                                            .padding(horizontal = 7.dp, vertical = 1.dp)
                                    ) {
                                        Text("$count", color = Color(0xFF0284C7), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .height(2.dp)
                        .background(if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0))
                )
            }

            // ================= CONTENIDO TABS =================
            when (tabActiva) {
                "pagos" -> {
                    item {
                        TablaPagosVer(pagos = contrato.pagos, t = t, idioma = idioma, oscuro = oscuro)
                    }
                }
                "extras" -> {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp)
                                .border(1.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
                                .padding(vertical = 36.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Outlined.Shield, contentDescription = null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(40.dp))
                            Spacer(Modifier.height(10.dp))
                            Text(textoVer("verContrato.sinExtras", idioma), color = t.textoSecundario, fontSize = 14.sp)
                        }
                    }
                }
                else -> {
                    if (cuotas.isEmpty()) {
                        item {
                            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 36.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(textoVer("base.sinResultados", idioma), color = t.textoSecundario, fontSize = 14.sp)
                            }
                        }
                    } else {
                        item {
                            TablaCuotasVer(
                                cuotas = cuotas,
                                contratoActivo = estado == "activo",
                                t = t,
                                idioma = idioma,
                                oscuro = oscuro,
                                onPagar = { cuota ->
                                    if (cuota.estado != "pagada") mostrarModalPago = cuota
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    // Modal Registrar Pago
    mostrarModalPago?.let { cuota ->
        ModalPagarCuota(
            cuota = cuota,
            idioma = idioma,
            t = t,
            oscuro = oscuro,
            onCerrar = { mostrarModalPago = null },
            onConfirmar = { monto ->
                RepositorioOffline.registrarPagoCuota(
                    context = context,
                    contratoId = contrato.id,
                    cuotaNumero = cuota.numero,
                    monto = monto
                )
                cuotas = cuotas.map { if (it.numero == cuota.numero) it.copy(estado = "pagada", fechaPago = RepositorioOffline.fechaIsoHoy()) else it }
                mostrarModalPago = null
            }
        )
    }

    // Modal Cambiar estado
    if (mostrarModalEstado) {
        ModalCambiarEstado(
            estadoActual = estado,
            idioma = idioma,
            t = t,
            oscuro = oscuro,
            onCerrar = { mostrarModalEstado = false },
            onConfirmar = { nuevo ->
                estado = nuevo
                mostrarModalEstado = false
            }
        )
    }
}

@Composable
private fun ResumenCardVer(
    label: String,
    valor: String,
    sub: String,
    colorValor: Color,
    valorPrimero: Boolean,
    t: TokensWeb,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(t.fondoElevado, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        if (valorPrimero) {
            Text(valor, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = colorValor, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.height(4.dp))
            Text(label.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
        } else {
            Text(label.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.height(4.dp))
            Text(valor, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = colorValor, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Spacer(Modifier.height(3.dp))
        Text(sub, fontSize = 11.sp, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun InfoCardVer(
    titulo: String,
    icono: androidx.compose.ui.graphics.vector.ImageVector,
    filas: List<Pair<String, String>>,
    t: TokensWeb
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoElevado, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(18.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icono, contentDescription = null, tint = t.primario, modifier = Modifier.size(15.dp))
            Spacer(Modifier.width(7.dp))
            Text(titulo.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.primario)
        }
        Spacer(Modifier.height(10.dp))
        filas.forEach { (label, valor) ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(0.dp, Color.Transparent)
                    .padding(vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario, modifier = Modifier.weight(1f))
                Text(valor, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario, textAlign = TextAlign.End, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.width(150.dp))
            }
        }
    }
}

// ================= TABLA DE CUOTAS (como el web) =================

private val anchoNum = 30.dp
private val anchoVenc = 100.dp
private val anchoMonto = 86.dp
private val anchoGris = 82.dp
private val anchoEstado = 84.dp
private val anchoPago = 96.dp
private val anchoAccion = 78.dp

@Composable
private fun TablaCuotasVer(
    cuotas: List<CuotaContrato>,
    contratoActivo: Boolean,
    t: TokensWeb,
    idioma: Idioma,
    oscuro: Boolean,
    onPagar: (CuotaContrato) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp)
            .border(1.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE5E7EB), RoundedCornerShape(12.dp))
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC))
                .padding(horizontal = 12.dp, vertical = 11.dp)
        ) {
            CeldaTablaVer("#", anchoNum, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
            CeldaTablaVer(textoVer("verContrato.vencimiento", idioma), anchoVenc, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
            CeldaTablaVer(textoVer("verContrato.cuotaCol", idioma), anchoMonto, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
            CeldaTablaVer(textoVer("verContrato.capital", idioma), anchoGris, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
            CeldaTablaVer(textoVer("verContrato.interes", idioma), anchoGris, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
            CeldaTablaVer(textoVer("verContrato.mora", idioma), anchoGris, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
            CeldaTablaVer(textoVer("verContrato.totalCol", idioma), anchoMonto, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
            CeldaTablaVer(textoVer("verContrato.estado", idioma), anchoEstado, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
            CeldaTablaVer(textoVer("verContrato.pagoCol", idioma), anchoPago, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
            Spacer(Modifier.width(anchoAccion))
        }

        // Filas
        cuotas.forEach { cuota ->
            val cs = cuotaStyleVer(cuota.estado)
            val esVencida = cuota.estado == "vencida"
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .background(if (esVencida) (if (oscuro) Color(0xFF1A0A0A) else Color(0xFFFFF5F5)) else Color.Transparent)
                    .border(0.dp, Color.Transparent)
                    .padding(horizontal = 12.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CeldaTablaVer("#${cuota.numero}", anchoNum, 13.sp, Color(0xFF0EA5E9), FontWeight.Bold, TextAlign.Start)
                Row(modifier = Modifier.width(anchoVenc), verticalAlignment = Alignment.CenterVertically) {
                    Text(cuota.fechaVencimiento, color = t.textoTerciario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    if (cuota.diasRetraso > 0) {
                        Spacer(Modifier.width(6.dp))
                        Box(
                            modifier = Modifier
                                .background(Color(0xFFFEE2E2), RoundedCornerShape(8))
                                .padding(horizontal = 6.dp, vertical = 1.dp)
                        ) {
                            Text("${cuota.diasRetraso}d", color = Color(0xFF991B1B), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
                        }
                    }
                }
                CeldaTablaVer(cuota.cuota, anchoMonto, 13.sp, t.textoPrimario, FontWeight.Bold, TextAlign.Start)
                CeldaTablaVer(cuota.capital, anchoGris, 13.sp, t.textoTerciario, FontWeight.Normal, TextAlign.Start)
                CeldaTablaVer(cuota.interes, anchoGris, 13.sp, t.textoTerciario, FontWeight.Normal, TextAlign.Start)
                CeldaTablaVer(cuota.mora, anchoGris, 13.sp, if (cuota.mora != "—") Color(0xFFEF4444) else t.textoTerciario, if (cuota.mora != "—") FontWeight.Bold else FontWeight.Normal, TextAlign.Start)
                CeldaTablaVer(cuota.total, anchoMonto, 13.sp, t.textoPrimario, FontWeight.Bold, TextAlign.Start)
                Box(modifier = Modifier.width(anchoEstado), contentAlignment = Alignment.CenterStart) {
                    Box(
                        modifier = Modifier
                            .background(cs.first, RoundedCornerShape(20))
                            .padding(horizontal = 9.dp, vertical = 3.dp)
                    ) {
                        Text(textoVer(estadoCuotaClave(cuota.estado), idioma), color = cs.second, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
                CeldaTablaVer(cuota.fechaPago ?: "—", anchoPago, 13.sp, t.textoTerciario, FontWeight.Normal, TextAlign.Start)
                Box(modifier = Modifier.width(anchoAccion), contentAlignment = Alignment.CenterStart) {
                    if (cuota.estado == "pagada") {
                        Box(
                            modifier = Modifier
                                .size(30.dp)
                                .border(1.dp, if (oscuro) Color(0xFF065F46) else Color(0xFFA7F3D0), RoundedCornerShape(7.dp))
                                .clickable { },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.Print, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(14.dp))
                        }
                    } else if (contratoActivo && cuota.estado in listOf("pendiente", "vencida", "parcial")) {
                        Row(
                            modifier = Modifier
                                .shadow(2.dp, RoundedCornerShape(8.dp), ambientColor = Color(0x4010B981), spotColor = Color(0x4010B981))
                                .background(Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF059669))), RoundedCornerShape(8.dp))
                                .clickable { onPagar(cuota) }
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.Payments, contentDescription = null, tint = Color.White, modifier = Modifier.size(13.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(textoVer("verContrato.pagar", idioma), color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

private fun estadoCuotaClave(estado: String): String = when (estado) {
    "pagada" -> "verContrato.pagada"
    "vencida" -> "verContrato.vencida"
    "parcial" -> "verContrato.parcial"
    else -> "verContrato.pendiente"
}

@Composable
private fun CeldaTablaVer(
    texto: String,
    ancho: Dp,
    fontSize: TextUnit,
    color: Color,
    peso: FontWeight,
    alineacion: TextAlign
) {
    Text(
        text = texto,
        modifier = Modifier.width(ancho),
        fontSize = fontSize,
        color = color,
        fontWeight = peso,
        textAlign = alineacion,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
}

// ================= TABLA DE PAGOS (como el web) =================

private val anchoPagoFecha = 104.dp
private val anchoPagoMonto = 86.dp
private val anchoPagoGris = 84.dp
private val anchoPagoMetodo = 90.dp
private val anchoPagoRef = 96.dp
private val anchoPagoReg = 90.dp

@Composable
private fun TablaPagosVer(
    pagos: List<PagoContrato>,
    t: TokensWeb,
    idioma: Idioma,
    oscuro: Boolean
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp)
            .border(1.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE5E7EB), RoundedCornerShape(12.dp))
    ) {
        if (pagos.isEmpty()) {
            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 36.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Outlined.Payments, contentDescription = null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(38.dp))
                Spacer(Modifier.height(8.dp))
                Text(textoVer("verContrato.sinPagos", idioma), color = t.textoSecundario, fontSize = 14.sp)
            }
        } else {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC))
                    .padding(horizontal = 12.dp, vertical = 11.dp)
            ) {
                CeldaTablaVer(textoVer("verContrato.fecha", idioma), anchoPagoFecha, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
                CeldaTablaVer(textoVer("verContrato.monto", idioma), anchoPagoMonto, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
                CeldaTablaVer(textoVer("verContrato.capital", idioma), anchoPagoGris, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
                CeldaTablaVer(textoVer("verContrato.interes", idioma), anchoPagoGris, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
                CeldaTablaVer(textoVer("verContrato.mora", idioma), anchoPagoGris, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
                CeldaTablaVer(textoVer("verContrato.metodo", idioma), anchoPagoMetodo, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
                CeldaTablaVer(textoVer("verContrato.referencia", idioma), anchoPagoRef, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
                CeldaTablaVer(textoVer("verContrato.registradoPor", idioma), anchoPagoReg, 11.sp, t.textoTerciario, FontWeight.Bold, TextAlign.Start)
            }
            pagos.forEach { p ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .border(0.dp, Color.Transparent)
                        .padding(horizontal = 12.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CeldaTablaVer(p.fecha, anchoPagoFecha, 13.sp, t.textoTerciario, FontWeight.Normal, TextAlign.Start)
                    CeldaTablaVer(p.monto, anchoPagoMonto, 13.sp, t.textoPrimario, FontWeight.Bold, TextAlign.Start)
                    CeldaTablaVer(p.capital, anchoPagoGris, 13.sp, t.textoTerciario, FontWeight.Normal, TextAlign.Start)
                    CeldaTablaVer(p.interes, anchoPagoGris, 13.sp, t.textoTerciario, FontWeight.Normal, TextAlign.Start)
                    CeldaTablaVer(p.mora, anchoPagoGris, 13.sp, if (p.mora != "—") Color(0xFFEF4444) else t.textoTerciario, if (p.mora != "—") FontWeight.Bold else FontWeight.Normal, TextAlign.Start)
                    CeldaTablaVer(p.metodo, anchoPagoMetodo, 13.sp, t.textoTerciario, FontWeight.Normal, TextAlign.Start)
                    CeldaTablaVer(p.referencia, anchoPagoRef, 13.sp, t.textoTerciario, FontWeight.Normal, TextAlign.Start)
                    CeldaTablaVer(p.registradoPor, anchoPagoReg, 13.sp, t.textoTerciario, FontWeight.Normal, TextAlign.Start)
                }
            }
        }
    }
}

// ================= MODALES (como el web) =================

@Composable
private fun ModalPagarCuota(
    cuota: CuotaContrato,
    idioma: Idioma,
    t: TokensWeb,
    oscuro: Boolean,
    onCerrar: () -> Unit,
    onConfirmar: (Double) -> Unit
) {
    var monto by remember { mutableStateOf(fmtNumVer(parseMonto(cuota.total))) }
    var referencia by remember { mutableStateOf("") }
    var notas by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    val baseN = parseMonto(cuota.cuota)
    val moraN = parseMonto(cuota.mora)
    val totalN = baseN + moraN

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCerrar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = true)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000))
                .clickable(onClick = onCerrar),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoContenido)
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Payments, contentDescription = null, tint = t.primario, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = textoVer("verContrato.registrarPago", idioma) + " — " + textoVer("verContrato.cuota", idioma) + " #" + cuota.numero,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = t.textoPrimario,
                        modifier = Modifier.weight(1f)
                    )
                    Box(modifier = Modifier.clickable(onClick = onCerrar).padding(6.dp)) {
                        Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    }
                }

                // Resumen de la cuota (como el web)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC))
                        .border(0.dp, Color.Transparent)
                        .padding(horizontal = 20.dp, vertical = 14.dp)
                ) {
                    ColumnaResumenModal(textoVer("verContrato.cuota", idioma), cuota.cuota, t, Modifier.weight(1f))
                    if (moraN > 0) {
                        ColumnaResumenModal(textoVer("verContrato.mora", idioma), cuota.mora, t, Modifier.weight(1f), colorValor = Color(0xFFEF4444))
                    }
                    ColumnaResumenModal(
                        textoVer("verContrato.totalCol", idioma),
                        "${RepositorioOffline.simboloMoneda()}%.2f".format(totalN),
                        t,
                        Modifier.weight(1f),
                        fondo = if (oscuro) Color(0xFF0C1A2E) else Color(0xFFEFF6FF),
                        colorValor = t.textoPrimario
                    )
                }

                if (cuota.estado == "vencida") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 8.dp)
                            .background(Color(0xFFFEF3C7), RoundedCornerShape(9.dp))
                            .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(9.dp))
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFF92400E), modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(10.dp))
                        Text(
                            textoVer("verContrato.alertaMora", idioma) + " " + cuota.diasRetraso + " " + textoVer("verContrato.dias", idioma),
                            color = Color(0xFF92400E),
                            fontSize = 13.sp
                        )
                    }
                }

                Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Text(textoVer("verContrato.montoRecibido", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                    CampoMoneda(valor = monto, onValor = { monto = it; error = "" }, tokens = t, modifier = Modifier.padding(top = 6.dp))
                    Text(textoVer("verContrato.fechaPago", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(top = 12.dp))
                    CampoWeb(valor = "", onValor = { }, tokens = t, placeholder = "", alto = 40, modifier = Modifier.padding(top = 6.dp))
                    Text(textoVer("verContrato.referencia", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(top = 12.dp))
                    CampoWeb(valor = referencia, onValor = { referencia = it }, tokens = t, placeholder = textoVer("verContrato.referenciaPh", idioma), alto = 40, modifier = Modifier.padding(top = 6.dp))
                    Text(textoVer("verContrato.notas", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(top = 12.dp))
                    CampoWeb(valor = notas, onValor = { notas = it }, tokens = t, placeholder = textoVer("verContrato.notasPh", idioma), alto = 60, modifier = Modifier.padding(top = 6.dp))

                    if (error.isNotEmpty()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 10.dp)
                                .background(if (oscuro) Color(0xFF450A0A) else Color(0xFFFEE2E2), RoundedCornerShape(9.dp))
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.Warning, contentDescription = null, tint = if (oscuro) Color(0xFFFCA5A5) else Color(0xFF991B1B), modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(error, color = if (oscuro) Color(0xFFFCA5A5) else Color(0xFF991B1B), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.fondoTerciario, RoundedCornerShape(10.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(textoVer("base.cancelar", idioma), color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF059669))), RoundedCornerShape(10.dp))
                            .clickable {
                                val montoN = monto.replace(",", "").toDoubleOrNull() ?: 0.0
                                if (montoN <= 0) {
                                    error = textoVer("verContrato.montoError", idioma)
                                } else onConfirmar(montoN)
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(textoVer("verContrato.confirmarPago", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ColumnaResumenModal(
    label: String,
    valor: String,
    t: TokensWeb,
    modifier: Modifier = Modifier,
    fondo: Color? = null,
    colorValor: Color = t.textoPrimario
) {
    Column(
        modifier = modifier
            .background(fondo ?: Color.Transparent)
            .padding(vertical = 2.dp)
    ) {
        Text(label.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Spacer(Modifier.height(3.dp))
        Text(valor, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = colorValor, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun ModalCambiarEstado(
    estadoActual: String,
    idioma: Idioma,
    t: TokensWeb,
    oscuro: Boolean,
    onCerrar: () -> Unit,
    onConfirmar: (String) -> Unit
) {
    var nuevoEstado by remember { mutableStateOf(estadoActual) }
    var notas by remember { mutableStateOf("") }

    val opciones = listOf(
        "activo" to "verContrato.activo",
        "pagado" to "verContrato.pagado",
        "incumplido" to "verContrato.incumplido",
        "reestructurado" to "verContrato.reestructurado",
        "cancelado" to "verContrato.cancelado"
    )

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCerrar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = true)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000))
                .clickable(onClick = onCerrar),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoContenido)
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.SwapHoriz, contentDescription = null, tint = t.primario, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = textoVer("verContrato.cambiarEstadoTitulo", idioma),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = t.textoPrimario,
                        modifier = Modifier.weight(1f)
                    )
                    Box(modifier = Modifier.clickable(onClick = onCerrar).padding(6.dp)) {
                        Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    }
                }

                Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                    Text(textoVer("verContrato.nuevoEstado", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                    Spacer(Modifier.height(6.dp))
                    opciones.forEach { (clave, labelClave) ->
                        val activo = nuevoEstado == clave
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .background(if (activo) t.primarioClaro else t.fondoContenido, RoundedCornerShape(9.dp))
                                .border(1.dp, if (activo) t.primario else t.bordeClaro, RoundedCornerShape(9.dp))
                                .clickable { nuevoEstado = clave }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = if (activo) t.primario else t.textoTerciario, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(textoVer(labelClave, idioma), color = if (activo) t.primario else t.textoSecundario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        }
                    }
                    Text(textoVer("verContrato.notasOpcional", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(top = 10.dp))
                    CampoWeb(valor = notas, onValor = { notas = it }, tokens = t, placeholder = textoVer("verContrato.notasEstadoPh", idioma), alto = 60, modifier = Modifier.padding(top = 6.dp))
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.fondoTerciario, RoundedCornerShape(10.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(textoVer("base.cancelar", idioma), color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(10.dp))
                            .clickable { onConfirmar(nuevoEstado) }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(textoVer("verContrato.confirmar", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
