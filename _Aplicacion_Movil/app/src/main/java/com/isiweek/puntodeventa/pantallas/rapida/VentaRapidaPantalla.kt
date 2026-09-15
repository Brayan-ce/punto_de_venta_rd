package com.isiweek.puntodeventa.pantallas.rapida

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items as gridItems
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.Remove
import androidx.compose.material.icons.outlined.Search
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.pantallas.ticket.LineaTicket
import com.isiweek.puntodeventa.pantallas.ticket.TicketVenta
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Pantalla Venta Rápida. Réplica de _Pages/admin/ventas/rapida/rapida.js.
 * Grid de productos por categoría, carrito y botón Cobrar que genera el ticket.
 */

data class ProductoRapido(
    val id: Long,
    val nombre: String,
    val precio: Double,
    val stock: Double,
    val aplicaItbis: Boolean,
    val categoria: String
)

@Composable
fun VentaRapidaPantalla(
    idioma: Idioma,
    oscuro: Boolean,
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

    var categoriaActiva by remember { mutableStateOf<String?>(null) }
    var busqueda by remember { mutableStateOf("") }
    var carrito by remember { mutableStateOf(listOf<Pair<ProductoRapido, Int>>()) }
    val contexto = androidx.compose.ui.platform.LocalContext.current

    val productos = productosRapidos()
    val categorias = productos.map { it.categoria }.distinct()

    val productosFiltrados = productos.filter { prod ->
        val coincideCat = categoriaActiva == null || prod.categoria == categoriaActiva
        val coincideBusqueda = busqueda.isBlank() || prod.nombre.contains(busqueda, ignoreCase = true)
        coincideCat && coincideBusqueda
    }

    val tasaItbisVenta = RepositorioOffline.obtenerEmpresa()?.impuestoPorcentaje?.toDoubleOrNull() ?: 0.0
    val subtotal = carrito.sumOf { it.first.precio * it.second }
    val itbis = carrito.sumOf { if (it.first.aplicaItbis) it.first.precio * it.second * tasaItbisVenta / 100 else 0.0 }
    val total = subtotal + itbis
    val numeroVenta = "VENTA${String.format("%06d", 100000 + carrito.size)}"

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(t.fondoElevado)
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = Traducciones.texto("rapida.titulo", idioma),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario,
                    modifier = Modifier.weight(1f)
                )
                // Badge carrito
                if (carrito.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .background(t.primario, RoundedCornerShape(50))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text("${carrito.sumOf { it.second }}", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Categorías (.categories)
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(t.fondoElevado)
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                item {
                    ChipCategoria(Traducciones.texto("rapida.todas", idioma), categoriaActiva == null, t, { categoriaActiva = null })
                }
                items(categorias, key = { it }) { cat ->
                    ChipCategoria(cat, categoriaActiva == cat, t, { categoriaActiva = cat })
                }
            }

            // Búsqueda
            CampoWeb(
                valor = busqueda,
                onValor = { busqueda = it },
                tokens = t,
                placeholder = Traducciones.texto("rapida.buscar", idioma),
                icono = Icons.Outlined.Search,
                alto = 38,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
            )

            // Grid de productos (.grid)
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                gridItems(productosFiltrados, key = { it.id }) { prod ->
                    CardProductoRapido(
                        producto = prod,
                        oscuro = oscuro,
                        t = t,
                        onAgregar = {
                            val existe = carrito.firstOrNull { it.first.id == prod.id }
                            if (existe != null) {
                                if (existe.second < prod.stock.toInt()) {
                                    carrito = carrito.map { if (it.first.id == prod.id) it.first to (it.second + 1) else it }
                                }
                            } else if (prod.stock > 0) {
                                carrito = listOf(prod to 1) + carrito
                            }
                        }
                    )
                }
            }

            // Panel carrito (.sidebar compacto)
            if (carrito.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoElevado)
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
                        .padding(12.dp)
                ) {
                    // Items del carrito
                    carrito.forEach { (prod, cant) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(prod.nombre, color = t.textoPrimario, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                            // Stepper
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .background(t.fondoTerciario, RoundedCornerShape(6.dp))
                                        .clickable {
                                            carrito = carrito.map { if (it.first.id == prod.id) it.first to (it.second - 1) else it }.filter { it.second > 0 }
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Outlined.Remove, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(14.dp))
                                }
                                Text("$cant", color = t.textoPrimario, fontSize = 12.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, modifier = Modifier.width(30.dp))
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .background(t.fondoTerciario, RoundedCornerShape(6.dp))
                                        .clickable {
                                            carrito = carrito.map { if (it.first.id == prod.id) it.first to (it.second + 1) else it }
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Outlined.Add, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(14.dp))
                                }
                            }
                            Spacer(Modifier.width(8.dp))
                            Text("${RepositorioOffline.simboloMoneda()} %.2f".format(prod.precio * cant), color = t.textoPrimario, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(Modifier.height(6.dp))

                    // Totales
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text(Traducciones.texto("rapida.total", idioma), color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
                        Text("${RepositorioOffline.simboloMoneda()} %.2f".format(total), color = t.primario, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }

                    Spacer(Modifier.height(8.dp))

                    // Botón Cobrar (.chargeBtn)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(t.exito, RoundedCornerShape(8.dp))
                            .clickable {
                                val cajaAbierta = RepositorioOffline.obtenerCajaAbierta()
                                if (cajaAbierta == null) {
                                    android.widget.Toast.makeText(contexto, Traducciones.texto("vender.requiereCaja", idioma), android.widget.Toast.LENGTH_SHORT).show()
                                    return@clickable
                                }
                                onImprimir(
                                    TicketVenta(
                                        numeroInterno = numeroVenta,
                                        ncf = "B0200000001",
                                        tipoComprobante = RepositorioOffline.obtenerTiposComprobante().firstOrNull { it.id == 2 }?.nombre ?: "Comprobante Consumidor Final",
                                        fecha = "12/08/2026 05:50",
                                        clienteNombre = null,
                                        vendedorNombre = "Admin",
                                        metodoPago = Traducciones.texto("metodo.efectivo", idioma),
                                        lineas = carrito.map { (prod, cant) ->
                                            LineaTicket(prod.nombre, cant.toDouble(), prod.precio, prod.precio * cant * (if (prod.aplicaItbis) 1 + tasaItbisVenta / 100 else 1.0))
                                        },
                                        subtotal = subtotal,
                                        itbis = itbis,
                                        total = total,
                                        efectivoRecibido = total,
                                        cambio = 0.0
                                    )
                                )
                                carrito = emptyList()
                            }
                            .padding(vertical = 13.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = Traducciones.texto("rapida.cobrar", idioma) + " ${RepositorioOffline.simboloMoneda()} %.2f".format(total),
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ChipCategoria(
    etiqueta: String,
    activo: Boolean,
    t: TokensWeb,
    alClic: () -> Unit
) {
    Box(
        modifier = Modifier
            .background(if (activo) t.primario.copy(alpha = 0.15f) else t.fondoContenido, RoundedCornerShape(50))
            .border(1.dp, if (activo) t.primario.copy(alpha = 0.4f) else t.bordeClaro, RoundedCornerShape(50))
            .clickable(onClick = alClic)
            .padding(horizontal = 14.dp, vertical = 7.dp)
    ) {
        Text(etiqueta, color = if (activo) t.primario else t.textoPrimario, fontSize = 12.sp, fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium)
    }
}

@Composable
private fun CardProductoRapido(
    producto: ProductoRapido,
    oscuro: Boolean,
    t: TokensWeb,
    onAgregar: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .clickable(onClick = onAgregar)
            .padding(10.dp)
    ) {
        // Imagen placeholder
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .background(t.fondoTerciario, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Outlined.Inventory2, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(32.dp))
        }
        Spacer(Modifier.height(8.dp))
        Text(
            text = producto.nombre,
            color = t.textoPrimario,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = "${RepositorioOffline.simboloMoneda()} %.2f".format(producto.precio),
            color = t.primario,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = 4.dp)
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = Traducciones.texto("productos.stock", Idioma.ESPANOL) + ": ${producto.stock.toInt()}",
                color = if (producto.stock <= 0) Color(0xFFEF4444) else t.textoSecundario,
                fontSize = 11.sp,
                fontWeight = if (producto.stock <= 0) FontWeight.Bold else FontWeight.Normal,
                modifier = Modifier.weight(1f)
            )
            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = t.primario, modifier = Modifier.size(20.dp))
        }
    }
}

private fun productosRapidos(): List<ProductoRapido> {
    return RepositorioOffline.obtenerProductos().map {
        ProductoRapido(
            id = it.id.toLong(),
            nombre = it.nombre,
            precio = it.precioVenta,
            stock = it.stock,
            aplicaItbis = it.aplicaItbis,
            categoria = RepositorioOffline.obtenerCategoriaNombre(it.categoriaId)
        )
    }
}