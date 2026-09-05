package com.isiweek.puntodeventa.pantallas.cotizaciones

import android.widget.Toast
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
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Print
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
import com.isiweek.puntodeventa.offline.RepositorioOffline.CotizacionOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * Pantalla Cotizaciones. Réplica de _Pages/admin/cotizaciones/cotizaciones.js.
 * Lee las cotizaciones del JSON offline con KPIs, búsqueda, filtro por estado
 * y tarjetas con acciones Ver/Editar/Imprimir/Eliminar.
 */
@Composable
fun CotizacionesPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevo: () -> Unit,
    onVer: (Int) -> Unit,
    onEditar: (Int) -> Unit,
    onImprimir: (Int) -> Unit
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
    var busqueda by remember { mutableStateOf("") }
    var estadoFiltro by remember { mutableStateOf("") }
    var cotizacionEliminar by remember { mutableStateOf<CotizacionOffline?>(null) }

    var todas by remember { mutableStateOf(RepositorioOffline.obtenerCotizaciones()) }

    val filtradas = todas.filter { c ->
        val q = busqueda.trim().lowercase()
        val okBusqueda = q.isEmpty() ||
                c.numero.lowercase().contains(q) ||
                c.cliente.lowercase().contains(q)
        val okEstado = estadoFiltro.isEmpty() || c.estado == estadoFiltro
        okBusqueda && okEstado
    }

    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }
    val kpis = listOf(
        KpiCotizacion(Traducciones.texto("cotizaciones.kpiTotal", idioma), todas.size.toString(), Icons.Outlined.Description, Color(0xFF2563EB)),
        KpiCotizacion(Traducciones.texto("cotizaciones.kpiPendientes", idioma), todas.count { it.estado == "borrador" || it.estado == "enviada" }.toString(), Icons.Outlined.Schedule, Color(0xFFF59E0B)),
        KpiCotizacion(Traducciones.texto("cotizaciones.kpiAprobadas", idioma), todas.count { it.estado == "aprobada" }.toString(), Icons.Outlined.CheckCircle, Color(0xFF10B981)),
        KpiCotizacion(Traducciones.texto("cotizaciones.kpiMonto", idioma), fmt(todas.sumOf { it.total }), Icons.AutoMirrored.Outlined.TrendingUp, Color(0xFF8B5CF6))
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header ──
        item { HeaderCotizaciones(t, idioma, onNuevo) }

        // ── KPIs ──
        items(kpis.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { kpi ->
                    KpiCardCotizacion(kpi, t, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // ── Controles ──
        item {
            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                CampoWeb(
                    valor = busqueda,
                    onValor = { busqueda = it },
                    tokens = t,
                    placeholder = Traducciones.texto("cotizaciones.buscar", idioma),
                    icono = Icons.Outlined.Search,
                    alto = 38
                )
                Spacer(Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ChipEstadoCotizacion(Traducciones.texto("cotizaciones.todos", idioma), estadoFiltro.isEmpty(), t, alClic = { estadoFiltro = "" })
                    listOf(
                        "borrador" to Traducciones.texto("cotizaciones.borrador", idioma),
                        "enviada" to Traducciones.texto("cotizaciones.enviada", idioma),
                        "aprobada" to Traducciones.texto("cotizaciones.aprobada", idioma),
                        "vencida" to Traducciones.texto("cotizaciones.vencida", idioma),
                        "anulada" to Traducciones.texto("cotizaciones.anulada", idioma)
                    ).forEach { (valor, etiqueta) ->
                        ChipEstadoCotizacion(
                            etiqueta,
                            estadoFiltro == valor,
                            t,
                            colorEstadoCotizacion(valor),
                            alClic = { estadoFiltro = if (estadoFiltro == valor) "" else valor }
                        )
                    }
                }
            }
        }

        // ── Resultados ──
        item {
            Text(
                text = Traducciones.texto("compras.resultados", idioma) + ": ${filtradas.size}",
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
                    Icon(Icons.Outlined.Description, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(Traducciones.texto("cotizaciones.sinCotizaciones", idioma), color = t.textoTerciario, fontSize = 14.sp)
                }
            }
        } else {
            items(filtradas, key = { it.id }) { cot ->
                CardCotizacion(
                    cot = cot,
                    oscuro = oscuro,
                    idioma = idioma,
                    t = t,
                    onVer = { onVer(cot.id) },
                    onEditar = { onEditar(cot.id) },
                    onImprimir = { onImprimir(cot.id) },
                    onEliminar = { cotizacionEliminar = cot }
                )
            }
        }
    }

    // ── Confirmación de eliminación ──
    cotizacionEliminar?.let { cot ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { cotizacionEliminar = null },
            title = { Text(Traducciones.texto("cotizaciones.eliminar", idioma), fontWeight = FontWeight.Bold) },
            text = {
                Text(Traducciones.texto("cotizaciones.confirmarEliminar", idioma) + " ${cot.numero}?")
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    cotizacionEliminar = null
                    if (RepositorioOffline.eliminarCotizacion(context, cot.id)) {
                        todas = RepositorioOffline.obtenerCotizaciones()
                        Toast.makeText(context, Traducciones.texto("cotizaciones.eliminado", idioma), Toast.LENGTH_SHORT).show()
                    }
                }) {
                    Text(Traducciones.texto("cotizaciones.eliminar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { cotizacionEliminar = null }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

private data class KpiCotizacion(val etiqueta: String, val valor: String, val icono: ImageVector, val color: Color)

@Composable
private fun HeaderCotizaciones(t: TokensWeb, idioma: Idioma, onNuevo: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp)
    ) {
        Text(Traducciones.texto("cotizaciones.titulo", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        Text(Traducciones.texto("cotizaciones.subtitulo", idioma), fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.padding(bottom = 10.dp))
        Row(
            modifier = Modifier
                .background(t.primario, RoundedCornerShape(8.dp))
                .clickable(onClick = onNuevo)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text(Traducciones.texto("cotizaciones.nuevo", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun KpiCardCotizacion(kpi: KpiCotizacion, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(kpi.icono, contentDescription = null, tint = kpi.color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(text = kpi.etiqueta, fontSize = 11.sp, color = t.textoSecundario)
        Text(text = kpi.valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun ChipEstadoCotizacion(
    etiqueta: String,
    activo: Boolean,
    t: TokensWeb,
    colorActivo: Color? = null,
    alClic: () -> Unit
) {
    val color = colorActivo ?: t.primario
    Box(
        modifier = Modifier
            .background(if (activo) color.copy(alpha = 0.15f) else t.fondoPrincipal, RoundedCornerShape(50))
            .border(1.dp, if (activo) color.copy(alpha = 0.4f) else t.bordeClaro, RoundedCornerShape(50))
            .clickable(onClick = alClic)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Text(text = etiqueta, color = if (activo) color else t.textoPrimario, fontSize = 12.sp, fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium)
    }
}

internal fun colorEstadoCotizacion(estado: String): Color = when (estado) {
    "borrador" -> Color(0xFF64748B)
    "enviada" -> Color(0xFF3B82F6)
    "aprobada" -> Color(0xFF10B981)
    "vencida" -> Color(0xFFF59E0B)
    else -> Color(0xFFEF4444)
}

@Composable
private fun CardCotizacion(
    cot: CotizacionOffline,
    oscuro: Boolean,
    idioma: Idioma,
    t: TokensWeb,
    onVer: () -> Unit,
    onEditar: () -> Unit,
    onImprimir: () -> Unit,
    onEliminar: () -> Unit
) {
    val colorEstado = colorEstadoCotizacion(cot.estado)

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
                .padding(bottom = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(cot.numero, color = t.textoTerciario, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Text(cot.cliente, color = t.textoPrimario, fontSize = 16.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Box(
                modifier = Modifier
                    .background(colorEstado.copy(alpha = 0.15f), RoundedCornerShape(50))
                    .border(1.dp, colorEstado.copy(alpha = 0.3f), RoundedCornerShape(50))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                Text(Traducciones.texto("cotizaciones.${cot.estado}", idioma), color = colorEstado, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }

        Text(
            text = "${RepositorioOffline.simboloMoneda()} %.2f".format(cot.total),
            color = t.primario,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = Traducciones.texto("cotizaciones.emitida", idioma) + ": ${diasParaVencer(cot.fechaVencimiento)}",
                color = t.textoSecundario,
                fontSize = 12.sp
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 2.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            BotonAccionCot(Icons.Outlined.Visibility, t.primario, "cotizaciones.ver", onVer)
            BotonAccionCot(Icons.Outlined.Create, Color(0xFFF59E0B), "cotizaciones.editar", onEditar)
            BotonAccionCot(Icons.Outlined.Print, Color(0xFF8B5CF6), "cotizaciones.imprimir", onImprimir)
            BotonAccionCot(Icons.Outlined.DeleteOutline, Color(0xFFEF4444), "cotizaciones.eliminar", onEliminar)
        }
    }
}

@Composable
private fun BotonAccionCot(icono: ImageVector, color: Color, descripcion: String, onClick: () -> Unit = {}) {
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

private fun diasParaVencer(fechaVencimiento: String): String {
    return try {
        val f = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(fechaVencimiento) ?: return fechaVencimiento
        val hoy = Calendar.getInstance()
        hoy.set(Calendar.HOUR_OF_DAY, 0); hoy.set(Calendar.MINUTE, 0); hoy.set(Calendar.SECOND, 0); hoy.set(Calendar.MILLISECOND, 0)
        val dias = TimeUnit.MILLISECONDS.toDays(f.time - hoy.timeInMillis)
        if (dias < 0) "Vencida" else "Vence en ${dias} dias"
    } catch (e: Exception) {
        fechaVencimiento
    }
}