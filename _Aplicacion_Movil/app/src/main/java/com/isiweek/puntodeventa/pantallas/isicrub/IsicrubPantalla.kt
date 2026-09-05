package com.isiweek.puntodeventa.pantallas.isicrub

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.PeopleAlt
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Visibility
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.ClienteDetalleOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import kotlin.math.ceil

/**
 * Pantalla Isicrub (crédito comercial). Réplica de _Pages/admin/depuracion.
 * Con tabs de navegación (Dashboard, Clientes, Lista Negra, Recomendados),
 * stats en grid y paginación por tab para muchos clientes.
 */
@Composable
fun IsicrubPantalla(
    idioma: Idioma,
    oscuro: Boolean
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

    var clientes by remember { mutableStateOf(RepositorioOffline.obtenerClientesDetalle()) }
    var tab by remember { mutableStateOf("dashboard") }
    var busqueda by remember { mutableStateOf("") }
    var pagina by remember { mutableStateOf(0) }
    var clienteVer by remember { mutableStateOf<ClienteDetalleOffline?>(null) }

    val PAGE = 8

    val clasifA = clientes.filter { it.clasificacion == "A" }
    val clasifB = clientes.filter { it.clasificacion == "B" }
    val clasifC = clientes.filter { it.clasificacion == "C" }
    val clasifD = clientes.filter { it.clasificacion == "D" }
    val enRiesgo = clasifC + clasifD
    val recomendados = clasifA + clasifB
    val scorePromedio = if (clientes.isNotEmpty()) clientes.sumOf { it.score } / clientes.size else 0

    val q = busqueda.trim().lowercase()
    val clientesFiltrados = clientes.filter { c ->
        q.isEmpty() || c.nombreCompleto.lowercase().contains(q) || c.documento.lowercase().contains(q) || c.telefono.lowercase().contains(q)
    }
    val negraFiltrados = enRiesgo.filter { c ->
        q.isEmpty() || c.nombreCompleto.lowercase().contains(q) || c.documento.lowercase().contains(q)
    }
    val recomendadosFiltrados = recomendados.filter { c ->
        q.isEmpty() || c.nombreCompleto.lowercase().contains(q) || c.documento.lowercase().contains(q)
    }

    val listaActiva = when (tab) {
        "clientes" -> clientesFiltrados
        "negra" -> negraFiltrados
        "recomendados" -> recomendadosFiltrados
        else -> emptyList()
    }
    val totalPaginas = ceil(listaActiva.size.toDouble() / PAGE).toInt().coerceAtLeast(1)
    val paginaSegura = pagina.coerceIn(0, totalPaginas - 1)
    val paginaItems = listaActiva.drop(paginaSegura * PAGE).take(PAGE)

    fun cambiarTab(nuevo: String) {
        tab = nuevo
        pagina = 0
    }

    val stats = listOf(
        StatIsicrub(Traducciones.texto("isicrub.totalClientes", idioma), clientes.size.toString(), Traducciones.texto("isicrub.conPerfil", idioma), Icons.Outlined.PeopleAlt, Color(0xFF2563EB)),
        StatIsicrub(Traducciones.texto("isicrub.deudaVencida", idioma), enRiesgo.size.toString(), Traducciones.texto("isicrub.requiereAtencion", idioma), Icons.Outlined.Warning, Color(0xFFEF4444)),
        StatIsicrub(Traducciones.texto("isicrub.bloqueados", idioma), clasifD.size.toString(), Traducciones.texto("isicrub.porMorosidad", idioma), Icons.Outlined.Shield, Color(0xFFF59E0B)),
        StatIsicrub(Traducciones.texto("isicrub.scorePromedio", idioma), scorePromedio.toString(), Traducciones.texto("isicrub.promedio", idioma), Icons.Outlined.Analytics, Color(0xFF8B5CF6))
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // ── Header ──
        item {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(Traducciones.texto("isicrub.titulo", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(Traducciones.texto("isicrub.subtitulo", idioma), fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.padding(bottom = 10.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CampoWeb(
                        valor = busqueda,
                        onValor = { busqueda = it; pagina = 0 },
                        tokens = t,
                        placeholder = Traducciones.texto("isicrub.buscar", idioma),
                        icono = Icons.Outlined.Search,
                        alto = 38,
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        Icons.Outlined.Refresh,
                        contentDescription = null,
                        tint = t.primario,
                        modifier = Modifier
                            .size(38.dp)
                            .background(t.primarioClaro, RoundedCornerShape(8.dp))
                            .padding(7.dp)
                            .clickable { clientes = RepositorioOffline.obtenerClientesDetalle() }
                    )
                }
            }
        }

        // ── Stats (grid 2x2) ──
        items(stats.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { stat ->
                    StatCardIsicrub(stat, t, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // ── Tabs de navegación ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                TabIsicrub(Traducciones.texto("isicrub.tabDashboard", idioma), tab == "dashboard", t, Modifier.weight(1f)) { cambiarTab("dashboard") }
                TabIsicrub(Traducciones.texto("isicrub.tabClientes", idioma), tab == "clientes", t, Modifier.weight(1f)) { cambiarTab("clientes") }
                TabIsicrub(Traducciones.texto("isicrub.tabNegra", idioma), tab == "negra", t, Modifier.weight(1f)) { cambiarTab("negra") }
                TabIsicrub(Traducciones.texto("isicrub.tabRecomendados", idioma), tab == "recomendados", t, Modifier.weight(1f)) { cambiarTab("recomendados") }
            }
        }

        // ── Contenido según tab ──
        when (tab) {
            "clientes" -> {
                item {
                    PanelIsicrub(t) {
                        CabeceraTablaIsicrub(listOf(Traducciones.texto("isicrub.cliente", idioma), Traducciones.texto("isicrub.clasificacion", idioma), Traducciones.texto("isicrub.estado", idioma), Traducciones.texto("isicrub.score", idioma), ""), t)
                        if (paginaItems.isEmpty()) {
                            VacioIsicrub(t, Traducciones.texto("isicrub.sinClientes", idioma))
                        } else {
                            paginaItems.forEach { c -> FilaClienteIsicrub(c, t, idioma, onVer = { clienteVer = c }) }
                            PaginacionIsicrub(paginaSegura, totalPaginas, t, { pagina-- }, { pagina++ })
                        }
                    }
                }
            }
            "negra" -> {
                item { BannerIsicrub(Traducciones.texto("isicrub.bannerNegraTitulo", idioma), Traducciones.texto("isicrub.bannerNegraDesc", idioma), Color(0xFFEF4444), t) }
                item {
                    PanelIsicrub(t) {
                        CabeceraTablaIsicrub(listOf(Traducciones.texto("isicrub.cliente", idioma), Traducciones.texto("isicrub.clasificacion", idioma), Traducciones.texto("isicrub.diasMora", idioma), Traducciones.texto("isicrub.estado", idioma), ""), t)
                        if (paginaItems.isEmpty()) {
                            VacioIsicrub(t, Traducciones.texto("isicrub.sinNegra", idioma))
                        } else {
                            paginaItems.forEach { c -> FilaClienteIsicrub(c, t, idioma, onVer = { clienteVer = c }) }
                            PaginacionIsicrub(paginaSegura, totalPaginas, t, { pagina-- }, { pagina++ })
                        }
                    }
                }
            }
            "recomendados" -> {
                item { BannerIsicrub(Traducciones.texto("isicrub.bannerRecomTitulo", idioma), Traducciones.texto("isicrub.bannerRecomDesc", idioma), Color(0xFF10B981), t) }
                item {
                    PanelIsicrub(t) {
                        CabeceraTablaIsicrub(listOf(Traducciones.texto("isicrub.cliente", idioma), Traducciones.texto("isicrub.clasificacion", idioma), Traducciones.texto("isicrub.score", idioma), Traducciones.texto("isicrub.estado", idioma), ""), t)
                        if (paginaItems.isEmpty()) {
                            VacioIsicrub(t, Traducciones.texto("isicrub.sinRecomendados", idioma))
                        } else {
                            paginaItems.forEach { c -> FilaClienteIsicrub(c, t, idioma, onVer = { clienteVer = c }) }
                            PaginacionIsicrub(paginaSegura, totalPaginas, t, { pagina-- }, { pagina++ })
                        }
                    }
                }
            }
            else -> {
                // ── Dashboard ──
                item {
                    PanelIsicrub(t) {
                        Text(Traducciones.texto("isicrub.distribucion", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 8.dp))
                        BarraClasificacion("A", Traducciones.texto("isicrub.clasifA", idioma), clasifA.size, clientes.size, Color(0xFF10B981), t)
                        BarraClasificacion("B", Traducciones.texto("isicrub.clasifB", idioma), clasifB.size, clientes.size, Color(0xFF3B82F6), t)
                        BarraClasificacion("C", Traducciones.texto("isicrub.clasifC", idioma), clasifC.size, clientes.size, Color(0xFFF59E0B), t)
                        BarraClasificacion("D", Traducciones.texto("isicrub.clasifD", idioma), clasifD.size, clientes.size, Color(0xFFEF4444), t)
                        Spacer(Modifier.height(12.dp))
                        Text(Traducciones.texto("isicrub.topDeudores", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 8.dp))
                        if (enRiesgo.isEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 14.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = t.exito, modifier = Modifier.size(24.dp))
                                Spacer(Modifier.height(6.dp))
                                Text(Traducciones.texto("isicrub.sinDeudas", idioma), color = t.textoTerciario, fontSize = 13.sp)
                            }
                        } else {
                            enRiesgo.forEach { c -> FilaDeudor(c, t) }
                        }
                    }
                }
            }
        }
    }

    // ── Diálogo detalle del cliente ──
    clienteVer?.let { c ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { clienteVer = null },
            title = { Text(c.nombreCompleto, fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilaDetalleIsicrub(Traducciones.texto("isicrub.documento", idioma), c.documento.ifBlank { "N/A" }, t)
                    FilaDetalleIsicrub(Traducciones.texto("isicrub.telefono", idioma), c.telefono.ifBlank { "N/A" }, t)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(Traducciones.texto("isicrub.clasificacion", idioma), color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
                        BadgeClasificacion(c.clasificacion, t)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(Traducciones.texto("isicrub.estado", idioma), color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
                        BadgeEstado(c.clasificacion, t, idioma)
                    }
                    FilaDetalleIsicrub(Traducciones.texto("isicrub.score", idioma), c.score.toString(), t)
                }
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = { clienteVer = null }) {
                    Text(Traducciones.texto("isicrub.ver", idioma), color = t.primario, fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

private data class StatIsicrub(val etiqueta: String, val valor: String, val detalle: String, val icono: ImageVector, val color: Color)

internal fun colorClasificacion(c: String): Color = when (c) {
    "A" -> Color(0xFF10B981)
    "B" -> Color(0xFF3B82F6)
    "C" -> Color(0xFFF59E0B)
    else -> Color(0xFFEF4444)
}

private fun estadoDe(clasificacion: String): String = when (clasificacion) {
    "D" -> "bloqueado"
    "C" -> "atrasado"
    else -> "normal"
}

@Composable
private fun StatCardIsicrub(stat: StatIsicrub, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 8.dp)) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .background(stat.color.copy(alpha = 0.12f), RoundedCornerShape(9.dp)),
                contentAlignment = Alignment.Center
            ) { Icon(stat.icono, contentDescription = null, tint = stat.color, modifier = Modifier.size(18.dp)) }
            Spacer(Modifier.width(8.dp))
            Text(stat.etiqueta, fontSize = 12.sp, color = t.textoSecundario, fontWeight = FontWeight.SemiBold)
        }
        Text(stat.valor, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
        Text(stat.detalle, fontSize = 11.sp, color = t.textoTerciario)
    }
}

@Composable
private fun TabIsicrub(etiqueta: String, activo: Boolean, t: TokensWeb, modifier: Modifier, alClic: () -> Unit) {
    Box(
        modifier = modifier
            .background(if (activo) t.primario else t.fondoContenido, RoundedCornerShape(8.dp))
            .clickable(onClick = alClic)
            .padding(vertical = 9.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = etiqueta,
            color = if (activo) Color.White else t.textoSecundario,
            fontSize = 12.sp,
            fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
private fun PanelIsicrub(t: TokensWeb, contenido: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        contenido()
    }
}

@Composable
private fun PaginacionIsicrub(pagina: Int, totalPaginas: Int, t: TokensWeb, onPrev: () -> Unit, onNext: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        BotonPagina("‹", pagina <= 0, t, onPrev)
        Text(
            text = "${pagina + 1} / $totalPaginas",
            color = t.textoSecundario,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 14.dp)
        )
        BotonPagina("›", pagina >= totalPaginas - 1, t, onNext)
    }
}

@Composable
private fun BotonPagina(simbolo: String, deshabilitado: Boolean, t: TokensWeb, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(34.dp)
            .background(if (deshabilitado) t.fondoTerciario else t.primarioClaro, RoundedCornerShape(9.dp))
            .border(1.dp, if (deshabilitado) t.bordeClaro else t.primario.copy(alpha = 0.4f), RoundedCornerShape(9.dp))
            .clickable(enabled = !deshabilitado, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(simbolo, color = if (deshabilitado) t.textoTerciario else t.primario, fontSize = 20.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun BarraClasificacion(letra: String, nombre: String, cantidad: Int, total: Int, color: Color, t: TokensWeb) {
    val pct = if (total > 0) (cantidad * 100 / total) else 0
    Column(modifier = Modifier.padding(vertical = 5.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .background(color, RoundedCornerShape(6.dp)),
                contentAlignment = Alignment.Center
            ) { Text(letra, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
            Spacer(Modifier.width(8.dp))
            Text(nombre, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            Text("$cantidad ($pct%)", color = t.textoSecundario, fontSize = 12.sp)
        }
        Spacer(Modifier.height(4.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .background(t.fondoTerciario, RoundedCornerShape(50))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(pct / 100f)
                    .height(8.dp)
                    .background(color, RoundedCornerShape(50))
            )
        }
    }
}

@Composable
private fun FilaDeudor(c: ClienteDetalleOffline, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .background(colorClasificacion(c.clasificacion).copy(alpha = 0.12f), RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) { Text(c.clasificacion, color = colorClasificacion(c.clasificacion), fontSize = 14.sp, fontWeight = FontWeight.Bold) }
        Spacer(Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(c.nombreCompleto, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(c.documento.ifBlank { "—" }, color = t.textoTerciario, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        BadgeClasificacion(c.clasificacion, t)
    }
}

@Composable
private fun CabeceraTablaIsicrub(columnas: List<String>, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoContenido, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        columnas.forEachIndexed { i, col ->
            Text(
                text = col,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = t.textoSecundario,
                modifier = Modifier.weight(if (i == 0) 1.5f else 1f),
                textAlign = if (i == 0) androidx.compose.ui.text.style.TextAlign.Start else androidx.compose.ui.text.style.TextAlign.End,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun FilaClienteIsicrub(
    c: ClienteDetalleOffline,
    t: TokensWeb,
    idioma: Idioma,
    onVer: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1.5f)) {
            Text(c.nombreCompleto, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(c.documento.ifBlank { "—" }, color = t.textoTerciario, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        BadgeClasificacion(c.clasificacion, t, Modifier.weight(1f))
        BadgeEstado(c.clasificacion, t, idioma, Modifier.weight(1f))
        Text(c.score.toString(), color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), textAlign = androidx.compose.ui.text.style.TextAlign.End)
        Icon(
            Icons.Outlined.Visibility,
            contentDescription = Traducciones.texto("isicrub.ver", Idioma.ESPANOL),
            tint = t.primario,
            modifier = Modifier
                .size(28.dp)
                .padding(5.dp)
                .clickable(onClick = onVer)
        )
    }
}

@Composable
private fun BadgeClasificacion(clasificacion: String, t: TokensWeb, modifier: Modifier = Modifier) {
    val color = colorClasificacion(clasificacion)
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
            .border(1.dp, color.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(clasificacion, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun BadgeEstado(clasificacion: String, t: TokensWeb, idioma: Idioma, modifier: Modifier = Modifier) {
    val estado = estadoDe(clasificacion)
    val color = when (estado) {
        "bloqueado" -> Color(0xFFEF4444)
        "atrasado" -> Color(0xFFF59E0B)
        else -> Color(0xFF10B981)
    }
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.12f), RoundedCornerShape(50))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = Traducciones.texto("isicrub.estado$estado", idioma),
            color = color,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun BannerIsicrub(titulo: String, descripcion: String, color: Color, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(color.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
            .border(1.dp, color.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Outlined.Shield, contentDescription = null, tint = color, modifier = Modifier.size(26.dp))
        Spacer(Modifier.width(10.dp))
        Column {
            Text(titulo, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text(descripcion, color = color, fontSize = 11.sp)
        }
    }
}

@Composable
private fun VacioIsicrub(t: TokensWeb, mensaje: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 18.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = t.exito, modifier = Modifier.size(24.dp))
        Spacer(Modifier.height(6.dp))
        Text(mensaje, color = t.textoTerciario, fontSize = 13.sp)
    }
}

@Composable
private fun FilaDetalleIsicrub(etiqueta: String, valor: String, t: TokensWeb) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(etiqueta, color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(valor, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}