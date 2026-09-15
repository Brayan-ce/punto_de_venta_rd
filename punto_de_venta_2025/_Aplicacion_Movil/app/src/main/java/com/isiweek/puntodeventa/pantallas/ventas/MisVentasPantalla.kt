package com.isiweek.puntodeventa.pantallas.ventas

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
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.CardGiftcard
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.HighlightOff
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Print
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.VentaOffline
import com.isiweek.puntodeventa.pantallas.ticket.TicketVenta
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Pantalla Mis Ventas. Réplica de _Pages/admin/ventas/ventas.js.
 * Lee las ventas del JSON offline (tabla "ventas") con sus clientes/vendedores,
 * resumen calculado, filtros por período/método/búsqueda e imprimir el boucher.
 */

data class TarjetaResumen(
    val etiqueta: String,
    val valor: String,
    val icono: ImageVector,
    val color: Color
)

@Composable
fun MisVentasPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevaVenta: () -> Unit,
    onAbrirCaja: () -> Unit = {},
    onCerrarCaja: () -> Unit = {},
    onImprimir: (TicketVenta) -> Unit = {}
) {
    val t = TokensWeb(
        fondoPrincipal = if (oscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF),
        fondoElevado = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoTerciario = if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9),
        fondoContenido = if (oscuro) Color(0xFF0F172A) else Color(0xFFF1F5F9),
        textoPrimario = if (oscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A),
        textoSecundario = if (oscuro) Color(0xFFCBD5E1) else Color(0xFF475569),
        textoTerciario = if (oscuro) Color(0xFF94A3B8) else Color(0xFF94A3B8),
        bordeClaro = if (oscuro) Color(0xFF334155) else Color(0xFFE5E7EB),
        bordeMedio = if (oscuro) Color(0xFF475569) else Color(0xFFD1D5DB),
        primario = if (oscuro) Color(0xFF3B82F6) else Color(0xFF2563EB),
        primarioClaro = if (oscuro) Color(0xFF3B82F6).copy(alpha = 0.15f) else Color(0xFFDBEAFE),
        exito = Color(0xFF10B981)
    )

    val context = LocalContext.current
    var periodo by remember { mutableStateOf("hoy") }
    var metodoFiltro by remember { mutableStateOf("") }
    var busqueda by remember { mutableStateOf("") }
    var confirmarAnular by remember { mutableStateOf<VentaOffline?>(null) }

    var todas by remember { mutableStateOf(RepositorioOffline.obtenerVentas(context)) }

    val cal = Calendar.getInstance()
    val hoyStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    cal.add(Calendar.DAY_OF_YEAR, -7)
    val hace7Str = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(cal.time)
    val mesStr = hoyStr.take(7)

    val filtradas = todas.filter { v ->
        val okPeriodo = when (periodo) {
            "hoy" -> v.fecha.startsWith(hoyStr)
            "semana" -> {
                val f = v.fecha.take(10)
                f >= hace7Str && f <= hoyStr
            }
            "mes" -> v.fecha.startsWith(mesStr)
            else -> true
        }
        val okMetodo = metodoFiltro.isEmpty() || v.metodoPago == metodoFiltro
        val q = busqueda.trim().lowercase()
        val okBusqueda = q.isEmpty() ||
                v.numeroInterno.lowercase().contains(q) ||
                v.cliente.lowercase().contains(q) ||
                v.vendedor.lowercase().contains(q)
        okPeriodo && okMetodo && okBusqueda
    }

    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }
    val ventasDia = todas.filter { it.fecha.startsWith(hoyStr) }.sumOf { it.total }
    val efectivoList = filtradas.filter { it.metodoPago == "efectivo" }
    val creditoList = filtradas.filter { it.metodoPago == "credito" }

    val resumen = listOf(
        TarjetaResumen(Traducciones.texto("ventas.totalVentas", idioma), fmt(filtradas.sumOf { it.total }), Icons.AutoMirrored.Outlined.TrendingUp, Color(0xFF2563EB)),
        TarjetaResumen(Traducciones.texto("ventas.emitidas", idioma), filtradas.count { it.estado == "emitida" }.toString(), Icons.Outlined.CheckCircle, Color(0xFF10B981)),
        TarjetaResumen(Traducciones.texto("ventas.anuladas", idioma), filtradas.count { it.estado == "anulada" }.toString(), Icons.Outlined.HighlightOff, Color(0xFFEF4444)),
        TarjetaResumen(Traducciones.texto("ventas.pendientes", idioma), filtradas.count { it.estado == "pendiente" }.toString(), Icons.Outlined.Schedule, Color(0xFFF59E0B)),
        TarjetaResumen("${Traducciones.texto("ventas.efectivo", idioma)} (${efectivoList.size})", fmt(efectivoList.sumOf { it.total }), Icons.Outlined.Payments, Color(0xFF22C55E)),
        TarjetaResumen("${Traducciones.texto("ventas.credito", idioma)} (${creditoList.size})", fmt(creditoList.sumOf { it.total }), Icons.Outlined.CardGiftcard, Color(0xFFEC4899))
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header (.header) ──
        item { HeaderVentas(t, idioma, onNuevaVenta, RepositorioOffline.obtenerCajaAbierta() != null, onAbrirCaja, onCerrarCaja) }

        // ── Alerta caja (.alertaCaja) ──
        item { AlertaCaja(t, idioma, ventasDia) }

        // ── Resumen (.resumen) ──
        items(resumen.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { tarjeta ->
                    TarjetaResumenCard(tarjeta, t, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // ── Chips de período (.chipsPeriodo) ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                listOf("ventas.hoy" to "hoy", "ventas.semana" to "semana", "ventas.mes" to "mes").forEach { (clave, valor) ->
                    ChipWeb(
                        etiqueta = Traducciones.texto(clave, idioma),
                        activo = periodo == valor,
                        t = t,
                        alClic = { periodo = valor }
                    )
                }
            }
        }

        // ── Chips de método (.chipsMetodo) ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                ChipWeb(Traducciones.texto("ventas.todosMetodos", idioma), metodoFiltro.isEmpty(), t, alClic = { metodoFiltro = "" })
                ChipWeb(Traducciones.texto("metodo.efectivo", idioma), metodoFiltro == "efectivo", t, Color(0xFF22C55E), { metodoFiltro = if (metodoFiltro == "efectivo") "" else "efectivo" })
                ChipWeb(Traducciones.texto("metodo.credito", idioma), metodoFiltro == "credito", t, Color(0xFFEC4899), { metodoFiltro = if (metodoFiltro == "credito") "" else "credito" })
            }
        }

        // ── Buscador (.barraBusqueda) ──
        item {
            CampoWeb(
                valor = busqueda,
                onValor = { busqueda = it },
                tokens = t,
                placeholder = Traducciones.texto("ventas.buscar", idioma),
                icono = Icons.Outlined.Search,
                alto = 38,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
            )
        }

        // ── Resultados (.infoFiltrosActivos) ──
        item {
            Text(
                text = Traducciones.texto("ventas.resultados", idioma) + ": ${filtradas.size}",
                fontSize = 12.sp,
                color = t.textoSecundario,
                modifier = Modifier.padding(start = 14.dp, end = 14.dp, bottom = 6.dp)
            )
        }

        if (filtradas.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 40.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Outlined.Receipt, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(Traducciones.texto("ventas.sinVentas", idioma), color = t.textoTerciario, fontSize = 14.sp)
                }
            }
        } else {
            items(filtradas, key = { it.id }) { venta ->
                CardVenta(
                    venta = venta,
                    oscuro = oscuro,
                    idioma = idioma,
                    t = t,
                    onAbrir = {
                        RepositorioOffline.obtenerVentaTicket(context, venta.id)?.let { onImprimir(it) }
                    },
                    onAnular = { confirmarAnular = venta }
                )
            }
        }
    }

    // ── Diálogo de confirmación de anulación ──
    confirmarAnular?.let { venta ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { confirmarAnular = null },
            title = { Text(Traducciones.texto("ventas.anular", idioma), fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    Traducciones.texto("ventas.confirmarAnular", idioma) + " ${venta.numeroInterno}?"
                )
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    confirmarAnular = null
                    if (RepositorioOffline.eliminarVenta(context, venta.id)) {
                        todas = todas.filter { it.id != venta.id }
                    }
                }) {
                    Text(Traducciones.texto("ventas.anular", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { confirmarAnular = null }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun HeaderVentas(
    t: TokensWeb,
    idioma: Idioma,
    onNuevaVenta: () -> Unit,
    hayCaja: Boolean,
    onAbrirCaja: () -> Unit,
    onCerrarCaja: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp)
    ) {
        Text(
            text = Traducciones.texto("ventas.titulo", idioma),
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = t.textoPrimario
        )
        Text(
            text = Traducciones.texto("ventas.subtituloTodas", idioma),
            fontSize = 13.sp,
            color = t.textoSecundario,
            modifier = Modifier.padding(bottom = 10.dp)
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            // Abrir/Cerrar Caja (verde si no hay caja, rojo si hay)
            Row(
                modifier = Modifier
                    .background(if (hayCaja) Color(0xFFEF4444) else t.exito, RoundedCornerShape(8.dp))
                    .clickable { if (hayCaja) onCerrarCaja() else onAbrirCaja() }
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Lock, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text(
                    text = if (hayCaja) Traducciones.texto("ventas.cerrarCaja", idioma) else Traducciones.texto("ventas.abrirCaja", idioma),
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            // Nueva Venta (.btnNuevo)
            Row(
                modifier = Modifier
                    .background(t.primario, RoundedCornerShape(8.dp))
                    .clickable(onClick = onNuevaVenta)
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text(
                    text = Traducciones.texto("ventas.nuevaVenta", idioma),
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun AlertaCaja(t: TokensWeb, idioma: Idioma, ventasDia: Double) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(Color(0xFF22C55E).copy(alpha = 0.12f), RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Outlined.Payments, contentDescription = null, tint = Color(0xFF22C55E), modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.width(10.dp))
        Column {
            Text(
                text = Traducciones.texto("ventas.cajaAbierta", idioma) + " #1",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = t.textoPrimario
            )
            Text(
                text = Traducciones.texto("ventas.ventasDelDia", idioma) + ": ${RepositorioOffline.simboloMoneda()} %.2f".format(ventasDia),
                fontSize = 12.sp,
                color = t.textoSecundario
            )
        }
    }
}

@Composable
private fun TarjetaResumenCard(
    tarjeta: TarjetaResumen,
    t: TokensWeb,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(tarjeta.icono, contentDescription = null, tint = tarjeta.color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(
            text = tarjeta.etiqueta,
            fontSize = 11.sp,
            color = t.textoSecundario
        )
        Text(
            text = tarjeta.valor,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = t.textoPrimario
        )
    }
}

@Composable
private fun ChipWeb(
    etiqueta: String,
    activo: Boolean,
    t: TokensWeb,
    colorActivo: Color? = null,
    alClic: () -> Unit
) {
    val color = colorActivo ?: t.primario
    Box(
        modifier = Modifier
            .background(
                if (activo) color.copy(alpha = 0.15f) else t.fondoPrincipal,
                RoundedCornerShape(50)
            )
            .border(1.dp, if (activo) color.copy(alpha = 0.4f) else t.bordeClaro, RoundedCornerShape(50))
            .clickable(onClick = alClic)
            .padding(horizontal = 14.dp, vertical = 8.dp)
    ) {
        Text(
            text = etiqueta,
            color = if (activo) color else t.textoPrimario,
            fontSize = 12.sp,
            fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
private fun CardVenta(
    venta: VentaOffline,
    oscuro: Boolean,
    idioma: Idioma,
    t: TokensWeb,
    onAbrir: () -> Unit,
    onAnular: () -> Unit
) {
    val metodoBadge = badgeMetodoPago(venta.metodoPago, oscuro)
    val estadoBadge = badgeEstado(venta.estado)
    val dgiiBadge = badgeDgii(venta.estadoDgii)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 5.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = venta.numeroInterno,
                    color = t.textoPrimario,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = venta.ncf,
                    color = t.textoTerciario,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Text(
                text = "${RepositorioOffline.simboloMoneda()} %.2f".format(venta.total),
                color = t.exito,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Column(
            modifier = Modifier.padding(vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            FilaCard(Traducciones.texto("ventas.cliente", idioma), venta.cliente, t)
            FilaCard(Traducciones.texto("ventas.vendedor", idioma), venta.vendedor, t)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                BadgeEtiqueta(metodoBadge.primero, metodoBadge.colorFondo, metodoBadge.colorTexto)
                BadgeEtiqueta(dgiiBadge.primero, dgiiBadge.colorFondo, dgiiBadge.colorTexto)
                BadgeEtiqueta(estadoBadge.primero, estadoBadge.colorFondo, estadoBadge.colorTexto)
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            BotonAccion(Icons.Outlined.Visibility, t.primario, "ventas.ver", onAbrir)
            BotonAccion(Icons.Outlined.Print, t.primario, "ventas.imprimir", onAbrir)
            BotonAccion(Icons.Outlined.HighlightOff, Color(0xFFEF4444), "ventas.anular", onAnular)
        }
    }
}

@Composable
private fun FilaCard(etiqueta: String, valor: String, t: TokensWeb) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = etiqueta,
            color = t.textoSecundario,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = valor,
            color = t.textoPrimario,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun BadgeEtiqueta(texto: String, colorFondo: Color, colorTexto: Color) {
    Box(
        modifier = Modifier
            .background(colorFondo, RoundedCornerShape(50))
            .border(1.dp, colorTexto.copy(alpha = 0.3f), RoundedCornerShape(50))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(text = texto, color = colorTexto, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun BotonAccion(icono: ImageVector, color: Color, descripcion: String, onClick: () -> Unit = {}) {
    Box(
        modifier = Modifier
            .size(34.dp)
            .background(color.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icono, contentDescription = Traducciones.texto(descripcion, Idioma.ESPANOL), tint = color, modifier = Modifier.size(18.dp))
    }
}

// ─────────────────────── BADGES ───────────────────────

private data class BadgeInfo(val primero: String, val colorFondo: Color, val colorTexto: Color)

private fun badgeMetodoPago(metodo: String, oscuro: Boolean): BadgeInfo {
    return when (metodo) {
        "efectivo" -> BadgeInfo("Efectivo", Color(0xFF22C55E).copy(alpha = 0.12f), if (oscuro) Color(0xFF4ADE80) else Color(0xFF16A34A))
        "credito" -> BadgeInfo("Crédito", Color(0xFFEC4899).copy(alpha = 0.12f), if (oscuro) Color(0xFFF472B6) else Color(0xFFDB2777))
        "tarjeta_debito" -> BadgeInfo("Débito", Color(0xFF3B82F6).copy(alpha = 0.12f), if (oscuro) Color(0xFF60A5FA) else Color(0xFF2563EB))
        "tarjeta_credito" -> BadgeInfo("T. Crédito", Color(0xFF9333EA).copy(alpha = 0.12f), if (oscuro) Color(0xFFA855F7) else Color(0xFF7C3AED))
        "transferencia" -> BadgeInfo("Transfer.", Color(0xFFF59E0B).copy(alpha = 0.12f), if (oscuro) Color(0xFFFBBF24) else Color(0xFFD97706))
        "cheque" -> BadgeInfo("Cheque", Color(0xFF64748B).copy(alpha = 0.12f), if (oscuro) Color(0xFF94A3B8) else Color(0xFF475569))
        "mixto" -> BadgeInfo("Mixto", Color(0xFF6366F1).copy(alpha = 0.12f), if (oscuro) Color(0xFFA5B4FC) else Color(0xFF4F46E5))
        else -> BadgeInfo("Otro", Color(0xFF64748B).copy(alpha = 0.12f), if (oscuro) Color(0xFF94A3B8) else Color(0xFF475569))
    }
}

private fun badgeEstado(estado: String): BadgeInfo {
    return when (estado) {
        "emitida" -> BadgeInfo("Emitida", Color(0xFF10B981).copy(alpha = 0.15f), Color(0xFF10B981))
        "anulada" -> BadgeInfo("Anulada", Color(0xFFEF4444).copy(alpha = 0.15f), Color(0xFFEF4444))
        else -> BadgeInfo("Pendiente", Color(0xFFF59E0B).copy(alpha = 0.15f), Color(0xFFF59E0B))
    }
}

private fun badgeDgii(estado: String): BadgeInfo {
    return when (estado) {
        "aceptado" -> BadgeInfo("Aceptado", Color(0xFF10B981).copy(alpha = 0.15f), Color(0xFF10B981))
        "rechazado" -> BadgeInfo("Rechazado", Color(0xFFEF4444).copy(alpha = 0.15f), Color(0xFFEF4444))
        else -> BadgeInfo("No Enviado", Color(0xFFF59E0B).copy(alpha = 0.15f), Color(0xFFF59E0B))
    }
}