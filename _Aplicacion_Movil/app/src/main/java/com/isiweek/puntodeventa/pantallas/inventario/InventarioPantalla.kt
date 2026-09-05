package com.isiweek.puntodeventa.pantallas.inventario

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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Search
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.MovimientoOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.ProductoOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Pantalla Inventario. Réplica de _Pages/admin/inventario/inventario.js.
 * Estadísticas reales, stock de productos, movimientos recientes y
 * registro de movimientos conectado a la base de datos local.
 */
@Composable
fun InventarioPantalla(
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

    val context = LocalContext.current
    var busqueda by remember { mutableStateOf("") }
    var categoriaFiltro by remember { mutableStateOf<Int?>(null) }
    var productos by remember { mutableStateOf(RepositorioOffline.obtenerProductos()) }
    var movimientos by remember { mutableStateOf(RepositorioOffline.obtenerMovimientos()) }
    var mostrarMovimiento by remember { mutableStateOf(false) }
    var productoMovimiento by remember { mutableStateOf<ProductoOffline?>(null) }
    var filtroMovimiento by remember { mutableStateOf("todos") }

    val categorias = remember { RepositorioOffline.obtenerCategorias() }
    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }

    val filtrados = productos.filter { p ->
        val okBusqueda = busqueda.isBlank() ||
                p.nombre.lowercase().contains(busqueda.trim().lowercase()) ||
                p.codigoBarras.lowercase().contains(busqueda.trim().lowercase()) ||
                p.sku.lowercase().contains(busqueda.trim().lowercase())
        val okCategoria = categoriaFiltro == null || p.categoriaId == categoriaFiltro
        okBusqueda && okCategoria
    }

    val movimientosFiltrados = if (filtroMovimiento == "todos") movimientos else movimientos.filter { it.tipo == filtroMovimiento }
    val valorTotal = productos.sumOf { it.precioVenta * it.stock }

    val stats = listOf(
        Triple("Total Productos", "${productos.size}", Color(0xFF2563EB)),
        Triple("Bajo Stock", "${productos.count { it.stock <= it.stockMinimo }}", Color(0xFFF59E0B)),
        Triple("Sin Stock", "${productos.count { it.stock <= 0 }}", Color(0xFFEF4444)),
        Triple("Valor Total", fmt(valorTotal), Color(0xFF3B82F6))
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header ──
        item {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("Inventario", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text("Control de stock y movimientos", fontSize = 13.sp, color = t.textoSecundario)
            }
        }

        // ── Estadísticas ──
        items(stats.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 3.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { (etiqueta, valor, color) ->
                    EstadInventario(etiqueta, valor, color, t, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // ── Panel Stock de Productos ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text("Stock de Productos", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Spacer(Modifier.height(8.dp))
                CampoWeb(
                    valor = busqueda,
                    onValor = { busqueda = it },
                    tokens = t,
                    placeholder = "Buscar productos...",
                    icono = Icons.Outlined.Search,
                    alto = 36
                )
                Spacer(Modifier.height(8.dp))
                SelectCategoriaFiltro(categorias.map { it.nombre }, categoriaFiltro?.let { id -> categorias.firstOrNull { it.id == id }?.nombre }, t) { idx ->
                    categoriaFiltro = if (idx == -1) null else categorias.getOrNull(idx)?.id
                }
                Spacer(Modifier.height(10.dp))

                // Tabla completa (cabecera + filas) con UN solo scroll horizontal
                val scrollTabla = rememberScrollState()
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(scrollTabla)
                ) {
                    // Cabecera de la tabla
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(t.fondoContenido, RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Producto", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(150.dp))
                        Text("Stock", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(90.dp), textAlign = TextAlign.End)
                        Text("Min", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(70.dp), textAlign = TextAlign.End)
                        Text("Estado", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(70.dp), textAlign = TextAlign.End)
                        Text("Acciones", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(90.dp), textAlign = TextAlign.End)
                    }

                    if (filtrados.isEmpty()) {
                        Text("No hay productos", fontSize = 13.sp, color = t.textoTerciario, modifier = Modifier.padding(vertical = 16.dp))
                } else {
                    filtrados.forEach { p ->
                        FilaProductoInventario(p, t) { productoMovimiento = p; mostrarMovimiento = true }
                    }
                }
                }
            }
        }

        // ── Panel Movimientos Recientes ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 6.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text("Movimientos Recientes", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Spacer(Modifier.height(8.dp))
                SelectTipoMovimiento(filtroMovimiento, t) { filtroMovimiento = it }
                Spacer(Modifier.height(8.dp))
                if (movimientosFiltrados.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Outlined.SwapHoriz, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(28.dp))
                        Spacer(Modifier.height(6.dp))
                        Text("No hay movimientos registrados", fontSize = 13.sp, color = t.textoTerciario)
                    }
                } else {
                    movimientosFiltrados.forEach { m ->
                        FilaMovimiento(m, t)
                    }
                }
            }
        }
    }

    // ── Modal Registrar Movimiento ──
    if (mostrarMovimiento) {
        val prod = productoMovimiento
        if (prod != null) {
            ModalMovimiento(t, context, prod, onCerrar = { mostrarMovimiento = false }) {
                mostrarMovimiento = false
                productos = RepositorioOffline.obtenerProductos()
                movimientos = RepositorioOffline.obtenerMovimientos()
            }
        }
    }
}

@Composable
private fun EstadInventario(etiqueta: String, valor: String, color: Color, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(
            when (etiqueta) {
                "Bajo Stock" -> Icons.Outlined.Warning
                "Sin Stock" -> Icons.Outlined.Inventory2
                "Valor Total" -> Icons.Outlined.Payments
                else -> Icons.Outlined.Inventory2
            },
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(18.dp)
        )
        Spacer(Modifier.height(4.dp))
        Text(etiqueta, fontSize = 10.sp, color = t.textoSecundario)
        Text(valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
    }
}

@Composable
private fun SelectCategoriaFiltro(opciones: List<String>, seleccion: String?, t: TokensWeb, onSeleccion: (Int) -> Unit) {
    var expandido by remember { mutableStateOf(false) }
    Box(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(36.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .clickable { expandido = true }
                .padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = seleccion ?: "Todas",
                color = if (seleccion != null) t.textoPrimario else t.textoTerciario,
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
            androidx.compose.material3.DropdownMenuItem(
                text = { Text("Todas", color = t.textoPrimario, fontSize = 13.sp) },
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
private fun SelectTipoMovimiento(actual: String, t: TokensWeb, onSeleccion: (String) -> Unit) {
    var expandido by remember { mutableStateOf(false) }
    val opciones = listOf("todos" to "Todos", "entrada" to "Entradas", "salida" to "Salidas", "ajuste" to "Ajustes", "devolucion" to "Devoluciones", "merma" to "Mermas")
    Box(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(36.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .clickable { expandido = true }
                .padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(opciones.first { it.first == actual }.second, color = t.textoPrimario, fontSize = 12.sp, modifier = Modifier.weight(1f))
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
private fun FilaProductoInventario(p: ProductoOffline, t: TokensWeb, onMovimiento: () -> Unit) {
    val stockBajo = p.stock <= p.stockMinimo
    val sinStock = p.stock <= 0
    val colorStock = when {
        sinStock -> Color(0xFFEF4444)
        stockBajo -> Color(0xFFF59E0B)
        else -> t.exito
    }
    val unidad = RepositorioOffline.obtenerUnidadNombre(p.unidadMedidaId).substringBefore(" (")

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.width(150.dp)) {
            Text(p.nombre, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(p.codigoBarras.ifBlank { p.sku.ifBlank { "—" } }, fontSize = 10.sp, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Text("${p.stock} $unidad", fontSize = 12.sp, color = colorStock, fontWeight = FontWeight.Bold, modifier = Modifier.width(90.dp), textAlign = TextAlign.End)
        Text("${p.stockMinimo}", fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.width(70.dp), textAlign = TextAlign.End)
        Box(
            modifier = Modifier
                .width(70.dp)
                .background(colorStock.copy(alpha = 0.15f), RoundedCornerShape(50))
                .padding(horizontal = 6.dp, vertical = 2.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(if (sinStock) "Sin" else if (stockBajo) "Bajo" else "OK", color = colorStock, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        }
        Box(
            modifier = Modifier
                .width(90.dp)
                .background(t.primarioClaro, RoundedCornerShape(6.dp))
                .clickable(onClick = onMovimiento)
                .padding(vertical = 6.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.SwapHoriz, contentDescription = null, tint = t.primario, modifier = Modifier.size(12.dp))
                Spacer(Modifier.width(3.dp))
                Text("Movimiento", color = t.primario, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun FilaMovimiento(m: MovimientoOffline, t: TokensWeb) {
    val color = when (m.tipo) {
        "entrada" -> Color(0xFF10B981)
        "salida" -> Color(0xFFEF4444)
        "merma" -> Color(0xFFEF4444)
        "ajuste" -> Color(0xFFF59E0B)
        else -> Color(0xFF3B82F6)
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .background(color.copy(alpha = 0.12f), RoundedCornerShape(50))
                .padding(horizontal = 8.dp, vertical = 3.dp)
        ) {
            Text(m.tipo.uppercase(), color = color, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(m.productoNombre, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text("±${m.cantidad} · ${m.stockAnterior} → ${m.stockNuevo}", fontSize = 10.sp, color = t.textoTerciario)
        }
        Text(m.fecha.take(10), fontSize = 10.sp, color = t.textoSecundario)
    }
}

@Composable
private fun ModalMovimiento(
    t: TokensWeb,
    context: android.content.Context,
    prod: ProductoOffline,
    onCerrar: () -> Unit,
    onGuardar: () -> Unit
) {
    var tipo by remember { mutableStateOf("entrada") }
    var cantidad by remember { mutableStateOf("") }
    var referencia by remember { mutableStateOf("") }
    var notas by remember { mutableStateOf("") }
    val unidad = RepositorioOffline.obtenerUnidadNombre(prod.unidadMedidaId)

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCerrar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = true)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .background(t.fondoElevado, RoundedCornerShape(16.dp))
                .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                .padding(16.dp)
        ) {
            Text("Registrar Movimiento", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
            Spacer(Modifier.height(12.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(t.fondoContenido, RoundedCornerShape(8.dp))
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .background(t.fondoTerciario, RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) { Icon(Icons.Outlined.Inventory2, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp)) }
                Spacer(Modifier.width(8.dp))
                Column {
                    Text(prod.nombre, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("Stock actual: ${prod.stock} $unidad", fontSize = 11.sp, color = t.textoSecundario)
                }
            }
            Spacer(Modifier.height(12.dp))

            CampoEtiquetaInv("Tipo de Movimiento *", t) {
                SelectTipoMovForm(tipo, t) { tipo = it }
            }
            CampoEtiquetaInv("Cantidad *", t) {
                CampoMonedaInv(cantidad, { cantidad = it }, t)
                Text("Unidad: $unidad", fontSize = 11.sp, color = t.textoTerciario, modifier = Modifier.padding(top = 4.dp))
            }
            CampoEtiquetaInv("Referencia", t) {
                CampoWeb(valor = referencia, onValor = { referencia = it }, tokens = t, placeholder = "Número de documento, orden, etc.", alto = 40)
            }
            CampoEtiquetaInv("Notas", t) {
                CampoAreaInv(notas, { notas = it }, t, "Observaciones adicionales...")
            }
            Spacer(Modifier.height(14.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                        .clickable(onClick = onCerrar)
                        .padding(vertical = 11.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Cancelar", color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(t.exito, RoundedCornerShape(8.dp))
                        .clickable(enabled = cantidad.toDoubleOrNull() != null) {
                            val cant = cantidad.toDoubleOrNull() ?: 0.0
                            if (cant > 0) {
                                RepositorioOffline.registrarMovimiento(context, prod.id, tipo, cant, referencia.trim(), notas.trim())
                                onGuardar()
                            }
                        }
                        .padding(vertical = 11.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Registrar Movimiento", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun SelectTipoMovForm(actual: String, t: TokensWeb, onSeleccion: (String) -> Unit) {
    var expandido by remember { mutableStateOf(false) }
    val opciones = listOf("entrada" to "Entrada", "salida" to "Salida", "ajuste" to "Ajuste", "devolucion" to "Devolución", "merma" to "Merma")
    Box(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(40.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .clickable { expandido = true }
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(opciones.first { it.first == actual }.second, color = t.textoPrimario, fontSize = 14.sp, modifier = Modifier.weight(1f))
            Icon(Icons.Outlined.KeyboardArrowDown, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
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
private fun CampoEtiquetaInv(etiqueta: String, t: TokensWeb, contenido: @Composable () -> Unit) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(etiqueta, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(bottom = 5.dp))
        contenido()
    }
}

@Composable
private fun CampoMonedaInv(valor: String, onValor: (String) -> Unit, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            singleLine = true,
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 12.dp)
        )
    }
}

@Composable
private fun CampoAreaInv(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 56.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier.fillMaxWidth()
        )
        if (valor.isEmpty()) {
            Text(placeholder, color = t.textoTerciario, fontSize = 13.sp)
        }
    }
}