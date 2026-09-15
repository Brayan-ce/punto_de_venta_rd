package com.isiweek.puntodeventa.pantallas.proveedores

import android.widget.Toast
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
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.CorporateFare
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.HighlightOff
import androidx.compose.material.icons.outlined.KeyboardArrowDown
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
import com.isiweek.puntodeventa.offline.RepositorioOffline.ProveedorOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Pantalla Proveedores. Réplica de _Pages/admin/proveedores/proveedores.js.
 * Lee los proveedores del JSON offline (tabla "proveedores"), con estadísticas,
 * búsqueda y filtro por estado, tarjetas con Ver/Editar/Eliminar.
 */
@Composable
fun ProveedoresPantalla(
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
    var busqueda by remember { mutableStateOf("") }
    var estadoFiltro by remember { mutableStateOf("") }
    var proveedorEliminar by remember { mutableStateOf<ProveedorOffline?>(null) }

    var todos by remember { mutableStateOf(RepositorioOffline.obtenerProveedores()) }

    val filtrados = todos.filter { p ->
        val q = busqueda.trim().lowercase()
        val okBusqueda = q.isEmpty() ||
                p.nombreComercial.lowercase().contains(q) ||
                p.razonSocial.lowercase().contains(q) ||
                p.rnc.lowercase().contains(q)
        val okEstado = when (estadoFiltro) {
            "activos" -> p.activo
            "inactivos" -> !p.activo
            else -> true
        }
        okBusqueda && okEstado
    }

    val estadisticas = listOf(
        EstadProveedor(Traducciones.texto("proveedores.estadTotal", idioma), todos.size.toString(), Icons.Outlined.CorporateFare, Color(0xFF2563EB)),
        EstadProveedor(Traducciones.texto("proveedores.estadActivos", idioma), todos.count { it.activo }.toString(), Icons.Outlined.CheckCircle, Color(0xFF10B981)),
        EstadProveedor(Traducciones.texto("proveedores.estadInactivos", idioma), todos.count { !it.activo }.toString(), Icons.Outlined.HighlightOff, Color(0xFFEF4444))
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header (.header) ──
        item { HeaderProveedores(t, idioma, onNuevo) }

        // ── Estadísticas (.estadisticas) ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                estadisticas.forEach { estad ->
                    TarjetaEstadProveedor(estad.etiqueta, estad.valor, estad.icono, estad.color, t, Modifier.weight(1f))
                }
            }
        }

        // ── Controles (.controles) ──
        item {
            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                CampoWeb(
                    valor = busqueda,
                    onValor = { busqueda = it },
                    tokens = t,
                    placeholder = Traducciones.texto("proveedores.buscar", idioma),
                    icono = Icons.Outlined.Search,
                    alto = 38
                )
                Spacer(Modifier.height(8.dp))
                SelectEstadoProveedor(estadoFiltro, t, idioma) { estadoFiltro = it }
            }
        }

        // ── Resultados ──
        item {
            Text(
                text = Traducciones.texto("compras.resultados", idioma) + ": ${filtrados.size}",
                fontSize = 12.sp,
                color = t.textoSecundario,
                modifier = Modifier.padding(start = 14.dp, end = 14.dp, bottom = 6.dp)
            )
        }

        if (filtrados.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 40.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Outlined.CorporateFare, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(Traducciones.texto("proveedores.sinProveedores", idioma), color = t.textoTerciario, fontSize = 14.sp)
                }
            }
        } else {
            items(filtrados, key = { it.id }) { prov ->
                CardProveedor(
                    prov = prov,
                    oscuro = oscuro,
                    idioma = idioma,
                    t = t,
                    onVer = { onVer(prov.id) },
                    onEditar = { onEditar(prov.id) },
                    onEliminar = { proveedorEliminar = prov }
                )
            }
        }
    }

    // ── Confirmación de eliminación ──
    proveedorEliminar?.let { prov ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { proveedorEliminar = null },
            title = { Text(Traducciones.texto("proveedores.eliminar", idioma), fontWeight = FontWeight.Bold) },
            text = {
                Text(Traducciones.texto("proveedores.confirmarEliminar", idioma) + " \"${prov.nombreComercial}\"?")
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    proveedorEliminar = null
                    if (RepositorioOffline.eliminarProveedor(context, prov.id)) {
                        todos = RepositorioOffline.obtenerProveedores()
                        Toast.makeText(
                            context,
                            Traducciones.texto("proveedores.eliminado", idioma),
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }) {
                    Text(Traducciones.texto("proveedores.eliminar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { proveedorEliminar = null }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

private data class EstadProveedor(val etiqueta: String, val valor: String, val icono: ImageVector, val color: Color)

@Composable
private fun HeaderProveedores(t: TokensWeb, idioma: Idioma, onNuevo: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp)
    ) {
        Text(
            text = Traducciones.texto("item.proveedores", idioma),
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = t.textoPrimario
        )
        Text(
            text = Traducciones.texto("proveedores.subtitulo", idioma),
            fontSize = 13.sp,
            color = t.textoSecundario,
            modifier = Modifier.padding(bottom = 10.dp)
        )
        Row(
            modifier = Modifier
                .background(t.primario, RoundedCornerShape(8.dp))
                .clickable(onClick = onNuevo)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                text = Traducciones.texto("proveedores.nuevo", idioma),
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun TarjetaEstadProveedor(
    etiqueta: String,
    valor: String,
    icono: ImageVector,
    color: Color,
    t: TokensWeb,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(text = etiqueta, fontSize = 10.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(text = valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
    }
}

@Composable
private fun SelectEstadoProveedor(
    actual: String,
    t: TokensWeb,
    idioma: Idioma,
    onSeleccion: (String) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }
    val opciones = listOf(
        "" to Traducciones.texto("proveedores.todosEstados", idioma),
        "activos" to Traducciones.texto("proveedores.activos", idioma),
        "inactivos" to Traducciones.texto("proveedores.inactivos", idioma)
    )
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
                modifier = Modifier.weight(1f)
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
                    text = { Text(etiqueta, color = t.textoPrimario, fontSize = 13.sp) },
                    onClick = { onSeleccion(valor); expandido = false }
                )
            }
        }
    }
}

@Composable
private fun CardProveedor(
    prov: ProveedorOffline,
    oscuro: Boolean,
    idioma: Idioma,
    t: TokensWeb,
    onVer: () -> Unit,
    onEditar: () -> Unit,
    onEliminar: () -> Unit
) {
    val colorEstado = if (prov.activo) Color(0xFF10B981) else Color(0xFF64748B)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 5.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        // Card header: nombre + badge estado
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = prov.nombreComercial,
                color = t.textoPrimario,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Box(
                modifier = Modifier
                    .background(colorEstado.copy(alpha = 0.15f), RoundedCornerShape(50))
                    .border(1.dp, colorEstado.copy(alpha = 0.3f), RoundedCornerShape(50))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                Text(
                    text = if (prov.activo) Traducciones.texto("proveedores.activoBadge", idioma) else Traducciones.texto("proveedores.inactivoBadge", idioma),
                    color = colorEstado,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Card body: razon social + RNC
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            FilaInfoProveedor(Icons.Outlined.Description, Traducciones.texto("proveedores.razonSocial", idioma), prov.razonSocial, t)
            FilaInfoProveedor(Icons.Outlined.CreditCard, "RNC", prov.rnc, t)
        }

        // Card footer: acciones
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            BotonProveedor(Icons.Outlined.Visibility, t.primario, "proveedores.ver", onVer)
            BotonProveedor(Icons.Outlined.Create, Color(0xFFF59E0B), "proveedores.editar", onEditar)
            BotonProveedor(Icons.Outlined.DeleteOutline, Color(0xFFEF4444), "proveedores.eliminar", onEliminar)
        }
    }
}

@Composable
private fun FilaInfoProveedor(icono: ImageVector, etiqueta: String, valor: String, t: TokensWeb) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icono, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(8.dp))
        Column {
            Text(etiqueta, fontSize = 11.sp, color = t.textoTerciario)
            Text(
                text = valor.ifBlank { "—" },
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = t.textoPrimario,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun BotonProveedor(icono: ImageVector, color: Color, descripcion: String, onClick: () -> Unit = {}) {
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