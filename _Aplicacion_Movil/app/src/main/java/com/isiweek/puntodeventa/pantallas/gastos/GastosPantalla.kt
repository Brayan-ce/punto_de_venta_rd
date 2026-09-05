package com.isiweek.puntodeventa.pantallas.gastos

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
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.Wallet
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
import com.isiweek.puntodeventa.offline.RepositorioOffline.GastoGeneralOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Pantalla Gastos. Réplica de _Pages/admin/gastos/gastos.js.
 * Lee los gastos del JSON offline (tabla "gastos"), con estadísticas, filtros
 * y tabla responsive. Solo permite registrar gastos si hay una caja abierta.
 */
@Composable
fun GastosPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevo: () -> Unit,
    onVer: (Int) -> Unit,
    onEditar: (Int) -> Unit
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
    val cajaAbierta = remember { RepositorioOffline.obtenerCajaAbierta() }

    var busqueda by remember { mutableStateOf("") }
    var categoriaFiltro by remember { mutableStateOf("") }
    var periodo by remember { mutableStateOf("todos") }
    var gastoEliminar by remember { mutableStateOf<GastoGeneralOffline?>(null) }

    var todos by remember { mutableStateOf(RepositorioOffline.obtenerGastosGenerales(context)) }

    val hoyStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    val cal = Calendar.getInstance()
    cal.add(Calendar.DAY_OF_YEAR, -7)
    val hace7Str = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)
    val mesStr = hoyStr.take(7)

    val filtradas = todos.filter { g ->
        val q = busqueda.trim().lowercase()
        val okBusqueda = q.isEmpty() || g.concepto.lowercase().contains(q) || g.comprobanteNumero.lowercase().contains(q)
        val okCategoria = categoriaFiltro.isEmpty() || g.categoria == categoriaFiltro
        val okPeriodo = when (periodo) {
            "hoy" -> g.fechaGasto.startsWith(hoyStr)
            "semana" -> {
                val f = g.fechaGasto.take(10)
                f >= hace7Str && f <= hoyStr
            }
            "mes" -> g.fechaGasto.startsWith(mesStr)
            else -> true
        }
        okBusqueda && okCategoria && okPeriodo
    }

    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }
    val montoTotal = todos.sumOf { it.monto }
    val mesTotal = todos.filter { it.fechaGasto.startsWith(mesStr) }.sumOf { it.monto }
    val catTop = todos.map { it.categoria }.filter { it.isNotBlank() }.groupingBy { it }.eachCount().maxByOrNull { it.value }?.key ?: "—"
    val categorias = listOf("Servicios Publicos", "Alquiler", "Nomina", "Mantenimiento", "Publicidad", "Transporte", "Suministros", "Impuestos", "Operativa", "Otros")

    val estadisticas = listOf(
        EstadGasto(Traducciones.texto("gastos.estadTotal", idioma), todos.size.toString(), Icons.Outlined.Wallet, Color(0xFF2563EB)),
        EstadGasto(Traducciones.texto("gastos.estadMonto", idioma), fmt(montoTotal), Icons.AutoMirrored.Outlined.TrendingUp, Color(0xFFEF4444)),
        EstadGasto(Traducciones.texto("gastos.estadMes", idioma), fmt(mesTotal), Icons.Outlined.LocalOffer, Color(0xFFF59E0B)),
        EstadGasto(Traducciones.texto("gastos.estadTop", idioma), catTop, Icons.Outlined.Wallet, Color(0xFF8B5CF6))
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header ──
        item {
            HeaderGastos(
                t,
                idioma,
                cajaAbierta?.numeroCaja,
                {
                    if (cajaAbierta != null) {
                        onNuevo()
                    } else {
                        Toast.makeText(context, Traducciones.texto("gastos.requiereCaja", idioma), Toast.LENGTH_SHORT).show()
                    }
                }
            )
        }

        // ── Estadísticas ──
        items(estadisticas.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { est ->
                    EstadGastoCard(est, t, Modifier.weight(1f))
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
                    placeholder = Traducciones.texto("gastos.buscar", idioma),
                    icono = Icons.Outlined.Search,
                    alto = 38
                )
                Spacer(Modifier.height(8.dp))
                SelectCategoriaGasto(categoriaFiltro, t, idioma, categorias) { categoriaFiltro = it }
                Spacer(Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ChipPeriodoGasto(Traducciones.texto("gastos.todasFechas", idioma), periodo == "todos", t, alClic = { periodo = "todos" })
                    ChipPeriodoGasto(Traducciones.texto("gastos.hoy", idioma), periodo == "hoy", t, Color(0xFF3B82F6), { periodo = if (periodo == "hoy") "todos" else "hoy" })
                    ChipPeriodoGasto(Traducciones.texto("gastos.semana", idioma), periodo == "semana", t, Color(0xFF8B5CF6), { periodo = if (periodo == "semana") "todos" else "semana" })
                    ChipPeriodoGasto(Traducciones.texto("gastos.mes", idioma), periodo == "mes", t, Color(0xFF10B981), { periodo = if (periodo == "mes") "todos" else "mes" })
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
                    Icon(Icons.Outlined.Wallet, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(Traducciones.texto("gastos.sinGastos", idioma), color = t.textoTerciario, fontSize = 14.sp)
                }
            }
        } else {
            // ── Tabla responsive (cabecera + filas con un mismo scroll) ──
            item {
                TablaGastos(
                    gastos = filtradas,
                    oscuro = oscuro,
                    idioma = idioma,
                    t = t,
                    fmt = fmt,
                    onVer = { onVer(it.id) },
                    onEditar = { onEditar(it.id) },
                    onEliminar = { gastoEliminar = it }
                )
            }
        }
    }

    // ── Confirmación de eliminación ──
    gastoEliminar?.let { gasto ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { gastoEliminar = null },
            title = { Text(Traducciones.texto("gastos.eliminar", idioma), fontWeight = FontWeight.Bold) },
            text = {
                Text(Traducciones.texto("gastos.confirmarEliminar", idioma) + " \"${gasto.concepto}\"?")
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    gastoEliminar = null
                    if (RepositorioOffline.eliminarGastoGeneral(context, gasto.id)) {
                        todos = RepositorioOffline.obtenerGastosGenerales(context)
                        Toast.makeText(context, Traducciones.texto("gastos.eliminado", idioma), Toast.LENGTH_SHORT).show()
                    }
                }) {
                    Text(Traducciones.texto("gastos.eliminar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { gastoEliminar = null }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

private data class EstadGasto(val etiqueta: String, val valor: String, val icono: ImageVector, val color: Color)

@Composable
private fun HeaderGastos(t: TokensWeb, idioma: Idioma, cajaNumero: Int?, onNuevo: () -> Unit) {
    val hayCaja = cajaNumero != null
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp)
    ) {
        Text(Traducciones.texto("gastos.titulo", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 10.dp)) {
            Icon(Icons.Outlined.Wallet, contentDescription = null, tint = if (hayCaja) t.exito else t.textoTerciario, modifier = Modifier.size(13.dp))
            Spacer(Modifier.width(5.dp))
            Text(
                text = if (hayCaja) Traducciones.texto("gastos.cajaAbierta", idioma) + " #$cajaNumero" else Traducciones.texto("gastos.sinCaja", idioma),
                fontSize = 13.sp,
                color = if (hayCaja) t.exito else t.textoTerciario,
                fontWeight = FontWeight.SemiBold
            )
        }
        Row(
            modifier = Modifier
                .background(if (hayCaja) t.primario else t.fondoTerciario, RoundedCornerShape(8.dp))
                .clickable(onClick = onNuevo)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = if (hayCaja) Color.White else t.textoTerciario, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                text = Traducciones.texto("gastos.nuevo", idioma),
                color = if (hayCaja) Color.White else t.textoTerciario,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun EstadGastoCard(est: EstadGasto, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(est.icono, contentDescription = null, tint = est.color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(text = est.etiqueta, fontSize = 10.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(text = est.valor, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun SelectCategoriaGasto(
    actual: String,
    t: TokensWeb,
    idioma: Idioma,
    categorias: List<String>,
    onSeleccion: (String) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }
    val opciones = listOf("" to Traducciones.texto("gastos.todasCategorias", idioma)) + categorias.map { it to it }
    Box(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(38.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .clickable { expandido = true }
                .padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = opciones.first { it.first == actual }.second,
                color = if (actual.isEmpty()) t.textoTerciario else t.textoPrimario,
                fontSize = 12.sp,
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Icon(Icons.Outlined.KeyboardArrowDown, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
        }
        androidx.compose.material3.DropdownMenu(
            expanded = expandido,
            onDismissRequest = { expandido = false },
            containerColor = t.fondoElevado
        ) {
            opciones.forEach { (valor, etiqueta) ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(etiqueta, color = t.textoPrimario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    onClick = { onSeleccion(valor); expandido = false }
                )
            }
        }
    }
}

@Composable
private fun ChipPeriodoGasto(
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

@Composable
private fun TablaGastos(
    gastos: List<GastoGeneralOffline>,
    oscuro: Boolean,
    idioma: Idioma,
    t: TokensWeb,
    fmt: (Double) -> String,
    onVer: (GastoGeneralOffline) -> Unit,
    onEditar: (GastoGeneralOffline) -> Unit,
    onEliminar: (GastoGeneralOffline) -> Unit
) {
    val scrollTabla = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(vertical = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(scrollTabla)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(t.fondoContenido, RoundedCornerShape(6.dp))
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(Traducciones.texto("gastos.concepto", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(150.dp))
                Text(Traducciones.texto("gastos.categoria", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(130.dp))
                Text(Traducciones.texto("gastos.caja", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(60.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text(Traducciones.texto("gastos.fecha", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text(Traducciones.texto("gastos.monto", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(110.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text("Acciones", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(96.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
            }
            gastos.forEach { gasto ->
                FilaGastoTabla(gasto, t, fmt, { onVer(gasto) }, { onEditar(gasto) }, { onEliminar(gasto) })
            }
        }
    }
}

@Composable
private fun FilaGastoTabla(
    gasto: GastoGeneralOffline,
    t: TokensWeb,
    fmt: (Double) -> String,
    onVer: () -> Unit,
    onEditar: () -> Unit,
    onEliminar: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 6.dp, vertical = 3.dp)
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(gasto.concepto, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.width(150.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(gasto.categoria.ifBlank { "—" }, color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.width(130.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(if (gasto.cajaNumero != null) "#${gasto.cajaNumero}" else "—", color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.width(60.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
        Text(fechaCorta(gasto.fechaGasto), color = t.textoTerciario, fontSize = 12.sp, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
        Text(fmt(gasto.monto), color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(110.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Row(modifier = Modifier.width(96.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            BotonGasto(Icons.Outlined.Visibility, t.primario, "gastos.ver", onVer)
            BotonGasto(Icons.Outlined.Create, Color(0xFFF59E0B), "gastos.editar", onEditar)
            BotonGasto(Icons.Outlined.DeleteOutline, Color(0xFFEF4444), "gastos.eliminar", onEliminar)
        }
    }
}

@Composable
private fun BotonGasto(icono: ImageVector, color: Color, descripcion: String, onClick: () -> Unit = {}) {
    Box(
        modifier = Modifier
            .size(28.dp)
            .background(color.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icono, contentDescription = Traducciones.texto(descripcion, Idioma.ESPANOL), tint = color, modifier = Modifier.size(16.dp))
    }
}

private fun fechaCorta(fecha: String): String {
    return try {
        val entrada = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
        val salida = SimpleDateFormat("d MMM", Locale("es", "DO"))
        salida.format(entrada.parse(fecha) ?: return fecha.take(10))
    } catch (e: Exception) {
        fecha.take(10)
    }
}