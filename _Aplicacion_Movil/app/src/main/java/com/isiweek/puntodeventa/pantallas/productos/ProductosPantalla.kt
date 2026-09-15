package com.isiweek.puntodeventa.pantallas.productos

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
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.PieChart
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.Wallet
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
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
import com.isiweek.puntodeventa.offline.RepositorioOffline.ProductoOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Pantalla Productos. Réplica de _Pages/admin/productos/productos.js.
 * Estadísticas reales, búsqueda, filtros (categoría/marca/estado) y acciones
 * Ver / Editar / Eliminar conectadas a la base de datos local.
 */

data class EstadCard(
    val etiqueta: String,
    val valor: String,
    val icono: ImageVector,
    val color: Color
)

@Composable
fun ProductosPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevo: () -> Unit,
    onVer: (Long) -> Unit,
    onEditar: (Long) -> Unit
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
    var categoriaFiltro by remember { mutableStateOf<Int?>(null) }
    var marcaFiltro by remember { mutableStateOf<Int?>(null) }
    var estadoFiltro by remember { mutableStateOf("todos") }
    var confirmarEliminar by remember { mutableStateOf<ProductoOffline?>(null) }
    var seleccionados by remember { mutableStateOf<Set<Int>>(emptySet()) }
    var confirmarBorrarTodos by remember { mutableStateOf(false) }
    var confirmarBorrarSeleccion by remember { mutableStateOf(false) }

    var productos by remember { mutableStateOf(RepositorioOffline.obtenerProductos()) }
    val categorias = remember { RepositorioOffline.obtenerCategorias() }
    val marcas = remember { RepositorioOffline.obtenerMarcas() }
    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }

    val filtrados = productos.filter { p ->
        val okBusqueda = busqueda.isBlank() ||
                p.nombre.lowercase().contains(busqueda.trim().lowercase()) ||
                p.sku.lowercase().contains(busqueda.trim().lowercase()) ||
                p.codigoBarras.lowercase().contains(busqueda.trim().lowercase())
        val okCategoria = categoriaFiltro == null || p.categoriaId == categoriaFiltro
        val okMarca = marcaFiltro == null || p.marcaId == marcaFiltro
        val okEstado = when (estadoFiltro) {
            "activo" -> p.activo
            "inactivo" -> !p.activo
            "bajo_stock" -> p.stock <= p.stockMinimo
            else -> true
        }
        okBusqueda && okCategoria && okMarca && okEstado
    }

    fun toggleSeleccion(id: Int) {
        seleccionados = if (id in seleccionados) seleccionados - id else seleccionados + id
    }

    fun toggleSeleccionarTodo() {
        val ids = filtrados.map { it.id }.toSet()
        seleccionados = if (ids.isNotEmpty() && seleccionados.containsAll(ids)) emptySet() else ids
    }

    val valorInventario = productos.sumOf { it.precioVenta * it.stock }
    val costoInventario = productos.sumOf { it.precioCompra * it.stock }
    val ganancia = valorInventario - costoInventario
    val margen = if (valorInventario > 0) ganancia / valorInventario * 100 else 0.0

    val stats = listOf(
        EstadCard(Traducciones.texto("productos.total", idioma), "${productos.size}", Icons.Outlined.Inventory2, Color(0xFF2563EB)),
        EstadCard(Traducciones.texto("productos.activos", idioma), "${productos.count { it.activo }}", Icons.Outlined.CheckCircle, Color(0xFF10B981)),
        EstadCard(Traducciones.texto("productos.bajoStock", idioma), "${productos.count { it.stock <= it.stockMinimo }}", Icons.Outlined.Warning, Color(0xFFF59E0B)),
        EstadCard(Traducciones.texto("productos.valorInventario", idioma), fmt(valorInventario), Icons.Outlined.Payments, Color(0xFF3B82F6)),
        EstadCard(Traducciones.texto("productos.costoInventario", idioma), fmt(costoInventario), Icons.Outlined.Wallet, Color(0xFF8B5CF6)),
        EstadCard(Traducciones.texto("productos.gananciaProyectada", idioma), fmt(ganancia), Icons.AutoMirrored.Outlined.TrendingUp, Color(0xFF10B981)),
        EstadCard(Traducciones.texto("productos.margenProyectado", idioma), "%.0f%%".format(margen), Icons.Outlined.PieChart, Color(0xFF10B981))
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(Traducciones.texto("productos.titulo", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Text(Traducciones.texto("productos.subtitulo", idioma), fontSize = 13.sp, color = t.textoSecundario)
                }
                Row(
                    modifier = Modifier
                        .background(t.primario, RoundedCornerShape(8.dp))
                        .clickable(onClick = onNuevo)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(Traducciones.texto("productos.nuevo", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // ── Estadísticas (.estadisticas) ──
        items(stats.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 3.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { stat -> EstadCardView(stat, t, Modifier.weight(1f)) }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // ── Buscador (.barraHerramientas) ──
        item {
            CampoWeb(
                valor = busqueda,
                onValor = { busqueda = it },
                tokens = t,
                placeholder = Traducciones.texto("productos.buscar", idioma),
                icono = Icons.Outlined.Search,
                alto = 38,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
            )
        }

        // ── Filtros (categoría / marca / estado) ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SelectFiltro(
                    etiqueta = Traducciones.texto("productos.todasCategorias", idioma),
                    opciones = categorias.map { it.nombre },
                    seleccion = categoriaFiltro?.let { id -> categorias.firstOrNull { it.id == id }?.nombre },
                    t = t,
                    modifier = Modifier.weight(1f),
                    onSeleccion = { idx -> categoriaFiltro = if (idx == -1) null else categorias.getOrNull(idx)?.id }
                )
                SelectFiltro(
                    etiqueta = Traducciones.texto("productos.todasMarcas", idioma),
                    opciones = marcas.map { it.nombre },
                    seleccion = marcaFiltro?.let { id -> marcas.firstOrNull { it.id == id }?.nombre },
                    t = t,
                    modifier = Modifier.weight(1f),
                    onSeleccion = { idx -> marcaFiltro = if (idx == -1) null else marcas.getOrNull(idx)?.id }
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SelectFiltro(
                    etiqueta = Traducciones.texto("productos.todosEstados", idioma),
                    opciones = listOf(
                        Traducciones.texto("productos.activo", idioma),
                        Traducciones.texto("productos.inactivo", idioma),
                        Traducciones.texto("productos.bajoStock", idioma)
                    ),
                    seleccion = when (estadoFiltro) {
                        "activo" -> Traducciones.texto("productos.activo", idioma)
                        "inactivo" -> Traducciones.texto("productos.inactivo", idioma)
                        "bajo_stock" -> Traducciones.texto("productos.bajoStock", idioma)
                        else -> null
                    },
                    t = t,
                    modifier = Modifier.weight(1f),
                    onSeleccion = { idx ->
                        estadoFiltro = when (idx) {
                            -1 -> "todos"
                            0 -> "activo"
                            1 -> "inactivo"
                            else -> "bajo_stock"
                        }
                    }
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.End
            ) {
                Box(
                    modifier = Modifier
                        .background(Color(0xFFEF4444).copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                        .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.35f), RoundedCornerShape(8.dp))
                        .clickable { confirmarBorrarTodos = true }
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(Traducciones.texto("productos.borrarTodos", idioma), color = Color(0xFFEF4444), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // ── Barra de selección ──
        if (seleccionados.isNotEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                        .background(t.primarioClaro, RoundedCornerShape(10.dp))
                        .border(1.dp, t.primario.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 10.dp, vertical = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "${seleccionados.size} ${Traducciones.texto("productos.seleccionados", idioma)}",
                            color = t.textoPrimario,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            text = if (filtrados.isNotEmpty() && seleccionados.containsAll(filtrados.map { it.id }.toSet()))
                                Traducciones.texto("productos.quitarSeleccion", idioma)
                            else Traducciones.texto("productos.seleccionarTodo", idioma),
                            color = t.primario,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier
                                .clickable { toggleSeleccionarTodo() }
                                .padding(horizontal = 6.dp, vertical = 4.dp)
                        )
                        Text(
                            text = Traducciones.texto("productos.cancelarSeleccion", idioma),
                            color = t.textoSecundario,
                            fontSize = 12.sp,
                            modifier = Modifier
                                .clickable { seleccionados = emptySet() }
                                .padding(start = 8.dp, top = 4.dp, bottom = 4.dp)
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFEF4444), RoundedCornerShape(8.dp))
                            .clickable { confirmarBorrarSeleccion = true }
                            .padding(vertical = 9.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("productos.eliminarSeleccionados", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // ── Lista de productos ──
        if (filtrados.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 40.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Outlined.Inventory2, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(Traducciones.texto("productos.sinProductos", idioma), color = t.textoTerciario, fontSize = 14.sp)
                }
            }
        } else {
            items(filtrados, key = { it.id }) { producto ->
                CardProducto(
                    producto = producto,
                    oscuro = oscuro,
                    idioma = idioma,
                    t = t,
                    seleccionado = producto.id in seleccionados,
                    toggleSeleccion = { toggleSeleccion(producto.id) },
                    onVer = { onVer(producto.id.toLong()) },
                    onEditar = { onEditar(producto.id.toLong()) },
                    onEliminar = { confirmarEliminar = producto }
                )
            }
        }
    }

    // ── Confirmación de eliminación ──
    confirmarEliminar?.let { prod ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { confirmarEliminar = null },
            title = { Text(Traducciones.texto("productos.eliminar", idioma), fontWeight = FontWeight.Bold) },
            text = { Text(Traducciones.texto("productos.confirmarEliminar", idioma) + " ${prod.nombre}?") },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    confirmarEliminar = null
                    RepositorioOffline.eliminarProducto(context, prod.id.toLong())
                    productos = RepositorioOffline.obtenerProductos()
                }) {
                    Text(Traducciones.texto("productos.eliminar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { confirmarEliminar = null }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }

    // ── Confirmación: borrar todos los productos ──
    if (confirmarBorrarTodos) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { confirmarBorrarTodos = false },
            title = { Text(Traducciones.texto("productos.borrarTodos", idioma), fontWeight = FontWeight.Bold, color = Color(0xFFEF4444)) },
            text = { Text(Traducciones.texto("productos.confirmarBorrarTodos", idioma)) },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    confirmarBorrarTodos = false
                    val total = RepositorioOffline.eliminarTodosProductos(context)
                    seleccionados = emptySet()
                    productos = RepositorioOffline.obtenerProductos()
                    android.widget.Toast.makeText(context, "$total ${Traducciones.texto("productos.eliminados", idioma)}", android.widget.Toast.LENGTH_SHORT).show()
                }) {
                    Text(Traducciones.texto("productos.siBorrar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { confirmarBorrarTodos = false }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }

    // ── Confirmación: eliminar seleccionados ──
    if (confirmarBorrarSeleccion) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { confirmarBorrarSeleccion = false },
            title = { Text(Traducciones.texto("productos.eliminarSeleccionados", idioma), fontWeight = FontWeight.Bold, color = Color(0xFFEF4444)) },
            text = { Text(Traducciones.texto("productos.confirmarBorrarSeleccion", idioma) + " ${seleccionados.size}.") },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    confirmarBorrarSeleccion = false
                    val total = RepositorioOffline.eliminarProductos(context, seleccionados.map { it.toLong() })
                    seleccionados = emptySet()
                    productos = RepositorioOffline.obtenerProductos()
                    android.widget.Toast.makeText(context, "$total ${Traducciones.texto("productos.eliminados", idioma)}", android.widget.Toast.LENGTH_SHORT).show()
                }) {
                    Text(Traducciones.texto("productos.siEliminar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { confirmarBorrarSeleccion = false }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }
}

@Composable
private fun EstadCardView(stat: EstadCard, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(stat.icono, contentDescription = null, tint = stat.color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(stat.etiqueta, fontSize = 11.sp, color = t.textoSecundario)
        Text(stat.valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
    }
}

@Composable
private fun SelectFiltro(
    etiqueta: String,
    opciones: List<String>,
    seleccion: String?,
    t: TokensWeb,
    modifier: Modifier = Modifier,
    onSeleccion: (Int) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }
    Box(modifier = modifier) {
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
                text = seleccion ?: etiqueta,
                color = if (seleccion != null) t.textoPrimario else t.textoTerciario,
                fontSize = 12.sp,
                fontWeight = if (seleccion != null) FontWeight.SemiBold else FontWeight.Normal,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
            Icon(Icons.Outlined.KeyboardArrowDown, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
        }
        androidx.compose.material3.DropdownMenu(
            expanded = expandido,
            onDismissRequest = { expandido = false },
            containerColor = t.fondoElevado
        ) {
            androidx.compose.material3.DropdownMenuItem(
                text = { Text(etiqueta, color = t.textoPrimario, fontSize = 13.sp) },
                onClick = { onSeleccion(-1); expandido = false }
            )
            opciones.forEachIndexed { idx, opc ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(opc, color = t.textoPrimario, fontSize = 13.sp) },
                    onClick = { onSeleccion(idx); expandido = false }
                )
            }
        }
    }
}

@Composable
private fun CardProducto(
    producto: ProductoOffline,
    oscuro: Boolean,
    idioma: Idioma,
    t: TokensWeb,
    seleccionado: Boolean = false,
    toggleSeleccion: (() -> Unit)? = null,
    onVer: () -> Unit,
    onEditar: () -> Unit,
    onEliminar: () -> Unit
) {
    val stockBajo = producto.stock <= producto.stockMinimo
    val unidad = RepositorioOffline.obtenerUnidadNombre(producto.unidadMedidaId)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 5.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = seleccionado,
                onCheckedChange = { toggleSeleccion?.invoke() },
                colors = CheckboxDefaults.colors(
                    checkedColor = t.primario,
                    checkmarkColor = Color.White,
                    uncheckedColor = t.bordeMedio
                )
            )
            Text(
                text = Traducciones.texto("productos.seleccionar", idioma),
                fontSize = 12.sp,
                color = t.textoSecundario,
                modifier = Modifier.weight(1f)
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(t.fondoTerciario, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Outlined.Inventory2, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(24.dp))
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(producto.nombre, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    "SKU: ${producto.sku.ifBlank { "—" }} · Código: ${producto.codigoBarras.ifBlank { "—" }}",
                    fontSize = 11.sp,
                    color = t.textoTerciario,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    "${Traducciones.texto("productos.stock", idioma)}: ${producto.stock} $unidad",
                    fontSize = 12.sp,
                    color = if (stockBajo) Color(0xFFEF4444) else if (oscuro) Color(0xFF4ADE80) else Color(0xFF16A34A),
                    fontWeight = if (stockBajo) FontWeight.Bold else FontWeight.Normal
                )
            }
            if (stockBajo) {
                Box(
                    modifier = Modifier
                        .background(Color(0xFFEF4444).copy(alpha = 0.15f), RoundedCornerShape(50))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(Traducciones.texto("productos.bajoStock", idioma), color = Color(0xFFEF4444), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ColumnaPrecio(Traducciones.texto("productos.compra", idioma), "${RepositorioOffline.simboloMoneda()} %.2f".format(producto.precioCompra), t, Modifier.weight(1f))
            ColumnaPrecio(Traducciones.texto("productos.precioVenta", idioma), "${RepositorioOffline.simboloMoneda()} %.2f".format(producto.precioVenta), t, Modifier.weight(1f), resaltado = true)
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${RepositorioOffline.obtenerCategoriaNombre(producto.categoriaId)} · ${RepositorioOffline.obtenerMarcaNombre(producto.marcaId)}",
                fontSize = 12.sp,
                color = t.textoSecundario,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
            val (etiquetaEstado, colorEstado) = if (producto.activo) {
                Traducciones.texto("productos.activo", idioma) to Color(0xFF10B981)
            } else {
                Traducciones.texto("productos.inactivo", idioma) to Color(0xFF64748B)
            }
            Box(
                modifier = Modifier
                    .background(colorEstado.copy(alpha = 0.15f), RoundedCornerShape(50))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                Text(etiquetaEstado, color = colorEstado, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            BotonProducto(Icons.Outlined.Visibility, t.primario, Traducciones.texto("productos.ver", idioma), t, onVer)
            BotonProducto(Icons.Outlined.Create, t.primario, Traducciones.texto("productos.editar", idioma), t, onEditar)
            BotonProducto(Icons.Outlined.Delete, Color(0xFFEF4444), Traducciones.texto("productos.eliminar", idioma), t, onEliminar)
        }
    }
}

@Composable
private fun ColumnaPrecio(
    etiqueta: String,
    valor: String,
    t: TokensWeb,
    modifier: Modifier = Modifier,
    resaltado: Boolean = false
) {
    Column(modifier = modifier) {
        Text(etiqueta, fontSize = 11.sp, color = t.textoSecundario)
        Text(valor, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = if (resaltado) t.primario else t.textoPrimario)
    }
}

@Composable
private fun BotonProducto(
    icono: ImageVector,
    color: Color,
    etiqueta: String,
    t: TokensWeb,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .background(color.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(5.dp))
        Text(etiqueta, color = color, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}