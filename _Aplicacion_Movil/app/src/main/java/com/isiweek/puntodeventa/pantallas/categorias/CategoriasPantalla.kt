package com.isiweek.puntodeventa.pantallas.categorias

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
import androidx.compose.material.icons.outlined.Apps
import androidx.compose.material.icons.outlined.Category
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.DeleteOutline
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
import com.isiweek.puntodeventa.offline.RepositorioOffline.CategoriaOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Pantalla Categorías. Réplica de _Pages/admin/categorias/categorias.js.
 * Lee las categorías del JSON offline con estadísticas, búsqueda, filtro
 * por estado y tarjetas con Ver/Editar/Eliminar.
 */
@Composable
fun CategoriasPantalla(
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
    var categoriaEliminar by remember { mutableStateOf<CategoriaOffline?>(null) }

    var todas by remember { mutableStateOf(RepositorioOffline.obtenerCategorias()) }
    val productos = remember { RepositorioOffline.obtenerProductos() }

    fun contar(catId: Int): Int = productos.count { it.categoriaId == catId }

    val filtradas = todas.filter { c ->
        val q = busqueda.trim().lowercase()
        val okBusqueda = q.isEmpty() || c.nombre.lowercase().contains(q) || c.descripcion.lowercase().contains(q)
        val okEstado = when (estadoFiltro) {
            "activos" -> c.activo
            "inactivos" -> !c.activo
            else -> true
        }
        okBusqueda && okEstado
    }

    val estadisticas = listOf(
        EstadCategoria(Traducciones.texto("categorias.estadTotal", idioma), todas.size.toString(), Icons.Outlined.Apps, Color(0xFF2563EB)),
        EstadCategoria(Traducciones.texto("categorias.estadActivas", idioma), todas.count { it.activo }.toString(), Icons.Outlined.CheckCircle, Color(0xFF10B981)),
        EstadCategoria(Traducciones.texto("categorias.estadInactivas", idioma), todas.count { !it.activo }.toString(), Icons.Outlined.HighlightOff, Color(0xFFEF4444)),
        EstadCategoria(Traducciones.texto("categorias.estadProductos", idioma), productos.size.toString(), Icons.Outlined.Category, Color(0xFF8B5CF6))
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header ──
        item { HeaderCategorias(t, idioma, onNuevo) }

        // ── Estadísticas ──
        items(estadisticas.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { est ->
                    EstadCategoriaCard(est, t, Modifier.weight(1f))
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
                    placeholder = Traducciones.texto("categorias.buscar", idioma),
                    icono = Icons.Outlined.Search,
                    alto = 38
                )
                Spacer(Modifier.height(8.dp))
                SelectEstadoCategoria(estadoFiltro, t, idioma) { estadoFiltro = it }
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
                    Icon(Icons.Outlined.Apps, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(Traducciones.texto("categorias.sinCategorias", idioma), color = t.textoTerciario, fontSize = 14.sp)
                }
            }
        } else {
            items(filtradas, key = { it.id }) { cat ->
                CardCategoria(
                    cat = cat,
                    totalProductos = contar(cat.id),
                    oscuro = oscuro,
                    idioma = idioma,
                    t = t,
                    onVer = { onVer(cat.id) },
                    onEditar = { onEditar(cat.id) },
                    onEliminar = { categoriaEliminar = cat }
                )
            }
        }
    }

    // ── Confirmación de eliminación ──
    categoriaEliminar?.let { cat ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { categoriaEliminar = null },
            title = { Text(Traducciones.texto("categorias.eliminar", idioma), fontWeight = FontWeight.Bold) },
            text = {
                Text(Traducciones.texto("categorias.confirmarEliminar", idioma) + " \"${cat.nombre}\"?")
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    categoriaEliminar = null
                    if (RepositorioOffline.eliminarCategoria(context, cat.id)) {
                        todas = RepositorioOffline.obtenerCategorias()
                        Toast.makeText(context, Traducciones.texto("categorias.eliminado", idioma), Toast.LENGTH_SHORT).show()
                    }
                }) {
                    Text(Traducciones.texto("categorias.eliminar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { categoriaEliminar = null }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

private data class EstadCategoria(val etiqueta: String, val valor: String, val icono: ImageVector, val color: Color)

@Composable
private fun HeaderCategorias(t: TokensWeb, idioma: Idioma, onNuevo: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp)
    ) {
        Text(Traducciones.texto("categorias.titulo", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        Text(Traducciones.texto("categorias.subtitulo", idioma), fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.padding(bottom = 10.dp))
        Row(
            modifier = Modifier
                .background(t.primario, RoundedCornerShape(8.dp))
                .clickable(onClick = onNuevo)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text(Traducciones.texto("categorias.nuevo", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun EstadCategoriaCard(est: EstadCategoria, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(est.icono, contentDescription = null, tint = est.color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(text = est.etiqueta, fontSize = 10.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(text = est.valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
    }
}

@Composable
private fun SelectEstadoCategoria(
    actual: String,
    t: TokensWeb,
    idioma: Idioma,
    onSeleccion: (String) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }
    val opciones = listOf(
        "" to Traducciones.texto("categorias.todosEstados", idioma),
        "activos" to Traducciones.texto("categorias.activos", idioma),
        "inactivos" to Traducciones.texto("categorias.inactivos", idioma)
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
private fun CardCategoria(
    cat: CategoriaOffline,
    totalProductos: Int,
    oscuro: Boolean,
    idioma: Idioma,
    t: TokensWeb,
    onVer: () -> Unit,
    onEditar: () -> Unit,
    onEliminar: () -> Unit
) {
    val colorEstado = if (cat.activo) Color(0xFF10B981) else Color(0xFF64748B)

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
                .padding(bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .background(t.primarioClaro, RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) { Icon(Icons.Outlined.Apps, contentDescription = null, tint = t.primario, modifier = Modifier.size(20.dp)) }
            Spacer(Modifier.width(10.dp))
            Text(
                text = cat.nombre,
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
                    text = if (cat.activo) Traducciones.texto("categorias.activoBadge", idioma) else Traducciones.texto("categorias.inactivoBadge", idioma),
                    color = colorEstado,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        if (cat.descripcion.isNotBlank()) {
            Text(
                text = cat.descripcion,
                color = t.textoSecundario,
                fontSize = 13.sp,
                modifier = Modifier.padding(bottom = 6.dp),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.Category, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(6.dp))
            Text("$totalProductos ${Traducciones.texto("categorias.productos", idioma)}", color = t.textoSecundario, fontSize = 12.sp)
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            BotonCategoria(Icons.Outlined.Visibility, t.primario, "categorias.ver", onVer)
            BotonCategoria(Icons.Outlined.Create, Color(0xFFF59E0B), "categorias.editarBtn", onEditar)
            BotonCategoria(Icons.Outlined.DeleteOutline, Color(0xFFEF4444), "categorias.eliminar", onEliminar)
        }
    }
}

@Composable
private fun BotonCategoria(icono: ImageVector, color: Color, descripcion: String, onClick: () -> Unit = {}) {
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