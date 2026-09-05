package com.isiweek.puntodeventa.pantallas.compras

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
import androidx.compose.material.icons.outlined.HighlightOff
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.ShoppingBag
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
import com.isiweek.puntodeventa.offline.RepositorioOffline.CompraOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Pantalla Compras. Réplica de _Pages/admin/compras/compras.js.
 * Lee las compras del JSON offline (tabla "compras") con sus proveedores,
 * estadísticas, filtros por proveedor/estado/método y acciones Ver/Anular.
 */
@Composable
fun ComprasPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevaCompra: () -> Unit
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
    var proveedorFiltro by remember { mutableStateOf<Int?>(null) }
    var estadoFiltro by remember { mutableStateOf("") }
    var metodoFiltro by remember { mutableStateOf("") }

    var todas by remember { mutableStateOf(RepositorioOffline.obtenerCompras()) }
    var compraVer by remember { mutableStateOf<CompraOffline?>(null) }
    var compraAnular by remember { mutableStateOf<CompraOffline?>(null) }

    val proveedores = remember { RepositorioOffline.obtenerProveedores().filter { it.activo } }

    val filtradas = todas.filter { c ->
        val q = busqueda.trim().lowercase()
        val okBusqueda = q.isEmpty() ||
                c.ncf.lowercase().contains(q) ||
                c.proveedor.lowercase().contains(q) ||
                c.numero.lowercase().contains(q)
        val okProveedor = proveedorFiltro == null || c.proveedorId == proveedorFiltro
        val okEstado = estadoFiltro.isEmpty() || c.estado == estadoFiltro
        val okMetodo = metodoFiltro.isEmpty() || c.metodoPago == metodoFiltro
        okBusqueda && okProveedor && okEstado && okMetodo
    }

    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }
    val estadisticas = listOf(
        TarjetaCompra(Traducciones.texto("compras.estadTotal", idioma), todas.size.toString(), Icons.Outlined.ShoppingBag, Color(0xFF2563EB)),
        TarjetaCompra(Traducciones.texto("compras.estadRecibidas", idioma), todas.count { it.estado == "recibida" }.toString(), Icons.Outlined.CheckCircle, Color(0xFF10B981)),
        TarjetaCompra(Traducciones.texto("compras.estadAnuladas", idioma), todas.count { it.estado == "anulada" }.toString(), Icons.Outlined.HighlightOff, Color(0xFFEF4444)),
        TarjetaCompra(Traducciones.texto("compras.estadMonto", idioma), fmt(todas.filter { it.estado != "anulada" }.sumOf { it.total }), Icons.AutoMirrored.Outlined.TrendingUp, Color(0xFF8B5CF6))
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header (.header) ──
        item { HeaderCompras(t, idioma, onNuevaCompra) }

        // ── Estadísticas (.estadisticas) ──
        items(estadisticas.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { tarjeta ->
                    TarjetaCompraCard(tarjeta, t, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // ── Controles (.controles) ──
        item {
            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                CampoWeb(
                    valor = busqueda,
                    onValor = { busqueda = it },
                    tokens = t,
                    placeholder = Traducciones.texto("compras.buscar", idioma),
                    icono = Icons.Outlined.Search,
                    alto = 38
                )
                Spacer(Modifier.height(8.dp))
                SelectProveedorFiltro(
                    proveedores = proveedores,
                    seleccionado = proveedorFiltro,
                    t = t,
                    idioma = idioma,
                    onSeleccion = { proveedorFiltro = it }
                )
                Spacer(Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ChipCompra(Traducciones.texto("compras.todosEstados", idioma), estadoFiltro.isEmpty(), t, alClic = { estadoFiltro = "" })
                    ChipCompra(Traducciones.texto("compras.recibida", idioma), estadoFiltro == "recibida", t, Color(0xFF10B981), { estadoFiltro = if (estadoFiltro == "recibida") "" else "recibida" })
                    ChipCompra(Traducciones.texto("compras.pendiente", idioma), estadoFiltro == "pendiente", t, Color(0xFFF59E0B), { estadoFiltro = if (estadoFiltro == "pendiente") "" else "pendiente" })
                    ChipCompra(Traducciones.texto("compras.anulada", idioma), estadoFiltro == "anulada", t, Color(0xFFEF4444), { estadoFiltro = if (estadoFiltro == "anulada") "" else "anulada" })
                }
                Spacer(Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ChipCompra(Traducciones.texto("compras.todosMetodos", idioma), metodoFiltro.isEmpty(), t, alClic = { metodoFiltro = "" })
                    listOf(
                        "efectivo" to Traducciones.texto("metodo.efectivo", idioma),
                        "tarjeta_debito" to Traducciones.texto("metodo.debito", idioma),
                        "tarjeta_credito" to Traducciones.texto("metodo.tCredito", idioma),
                        "transferencia" to Traducciones.texto("metodo.transferencia", idioma),
                        "cheque" to Traducciones.texto("metodo.cheque", idioma),
                        "mixto" to Traducciones.texto("metodo.mixto", idioma)
                    ).forEach { (valor, etiqueta) ->
                        ChipCompra(etiqueta, metodoFiltro == valor, t, alClic = { metodoFiltro = if (metodoFiltro == valor) "" else valor })
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
                    Icon(Icons.Outlined.LocalShipping, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(Traducciones.texto("compras.sinCompras", idioma), color = t.textoTerciario, fontSize = 14.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                }
            }
        } else {
            // ── Tabla responsive estilo web (cabecera + filas con un mismo scroll) ──
            item {
                TablaCompras(
                    compras = filtradas,
                    oscuro = oscuro,
                    idioma = idioma,
                    t = t,
                    onVer = { compraVer = it },
                    onAnular = { compraAnular = it }
                )
            }
        }
    }

    // ── Diálogo Ver compra ──
    compraVer?.let { compra ->
        val detalle = remember(compra.id) { RepositorioOffline.obtenerCompraDetalles(compra.id) }
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { compraVer = null },
            title = { Text("${compra.ncf} · ${compra.proveedor}", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    FilaVer(Traducciones.texto("compras.ncf", idioma), compra.ncf, t)
                    FilaVer(Traducciones.texto("compras.tipoComprobante", idioma), compra.tipoComprobanteNombre, t)
                    FilaVer(Traducciones.texto("compras.metodoPago", idioma), metodoPagoTraduccion(compra.metodoPago, idioma), t)
                    FilaVer(Traducciones.texto("compras.total", idioma), fmt(compra.total), t)
                    if (compra.notas.isNotBlank()) {
                        FilaVer(Traducciones.texto("compras.notas", idioma), compra.notas, t)
                    }
                    Spacer(Modifier.height(4.dp))
                    detalle.forEach { d ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("• ${d.productoNombre}", color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("${d.cantidad} × ${fmt(d.precioUnitario)}", color = t.textoSecundario, fontSize = 12.sp)
                        }
                    }
                }
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = { compraVer = null }) {
                    Text(Traducciones.texto("compras.ver", idioma), color = t.primario, fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    // ── Diálogo de confirmación de anulación ──
    compraAnular?.let { compra ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { compraAnular = null },
            title = { Text(Traducciones.texto("compras.anular", idioma), fontWeight = FontWeight.Bold) },
            text = {
                Text(Traducciones.texto("compras.confirmarAnular", idioma) + " ${compra.numero}?")
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    compraAnular = null
                    if (RepositorioOffline.anularCompra(context, compra.id)) {
                        todas = RepositorioOffline.obtenerCompras()
                    }
                }) {
                    Text(Traducciones.texto("compras.anular", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { compraAnular = null }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun HeaderCompras(t: TokensWeb, idioma: Idioma, onNuevaCompra: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp)
    ) {
        Text(
            text = Traducciones.texto("compras.titulo", idioma),
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = t.textoPrimario
        )
        Text(
            text = Traducciones.texto("compras.subtitulo", idioma),
            fontSize = 13.sp,
            color = t.textoSecundario,
            modifier = Modifier.padding(bottom = 10.dp)
        )
        Row(
            modifier = Modifier
                .background(t.primario, RoundedCornerShape(8.dp))
                .clickable(onClick = onNuevaCompra)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                text = Traducciones.texto("compras.nuevo", idioma),
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun SelectProveedorFiltro(
    proveedores: List<RepositorioOffline.ProveedorOffline>,
    seleccionado: Int?,
    t: TokensWeb,
    idioma: Idioma,
    onSeleccion: (Int?) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }
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
                text = proveedores.firstOrNull { it.id == seleccionado }?.nombreComercial
                    ?: Traducciones.texto("compras.todosProveedores", idioma),
                color = if (seleccionado != null) t.textoPrimario else t.textoTerciario,
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
                text = { Text(Traducciones.texto("compras.todosProveedores", idioma), color = t.textoPrimario, fontSize = 13.sp) },
                onClick = { onSeleccion(null); expandido = false }
            )
            proveedores.forEach { prov ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(prov.nombreComercial, color = t.textoPrimario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    onClick = { onSeleccion(prov.id); expandido = false }
                )
            }
        }
    }
}

@Composable
private fun ChipCompra(
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

private data class TarjetaCompra(val etiqueta: String, val valor: String, val icono: ImageVector, val color: Color)

@Composable
private fun TarjetaCompraCard(tarjeta: TarjetaCompra, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(tarjeta.icono, contentDescription = null, tint = tarjeta.color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(text = tarjeta.etiqueta, fontSize = 11.sp, color = t.textoSecundario)
        Text(text = tarjeta.valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
    }
}

@Composable
private fun TablaCompras(
    compras: List<CompraOffline>,
    oscuro: Boolean,
    idioma: Idioma,
    t: TokensWeb,
    onVer: (CompraOffline) -> Unit,
    onAnular: (CompraOffline) -> Unit
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
            // Cabecera (se mueve junto con las filas)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(t.fondoContenido, RoundedCornerShape(6.dp))
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("NCF", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(120.dp))
                Text(Traducciones.texto("compras.proveedor", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(130.dp))
                Text(Traducciones.texto("compras.metodoPago", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text(Traducciones.texto("compras.subtotal", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text("ITBIS", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text(Traducciones.texto("compras.total", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text("Estado", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text("Fecha", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(150.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text("Acciones", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(76.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
            }
            compras.forEach { compra ->
                FilaCompraTabla(
                    compra = compra,
                    oscuro = oscuro,
                    idioma = idioma,
                    t = t,
                    onVer = { onVer(compra) },
onAnular = { onAnular(compra) }
                )
            }
            }
        }
    }

@Composable
private fun FilaCompraTabla(
    compra: CompraOffline,
    oscuro: Boolean,
    idioma: Idioma,
    t: TokensWeb,
    onVer: () -> Unit,
    onAnular: () -> Unit
) {
    val metodoBadge = badgeMetodoCompra(compra.metodoPago, oscuro)
    val estadoBadge = badgeEstadoCompra(compra.estado)
    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 6.dp, vertical = 3.dp)
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(compra.ncf, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(120.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(compra.proveedor, color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.width(130.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
        BadgeCompra(metodoBadge.primero, metodoBadge.colorFondo, metodoBadge.colorTexto, Modifier.width(90.dp))
        Text(fmt(compra.subtotal), color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(fmt(compra.itbis), color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(
            text = fmt(compra.total),
            color = if (compra.estado == "anulada") t.textoTerciario else t.primario,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(90.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.End,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        BadgeCompra(estadoBadge.primero, estadoBadge.colorFondo, estadoBadge.colorTexto, Modifier.width(90.dp))
        Text(formatearFechaCompra(compra.fecha, idioma), color = t.textoTerciario, fontSize = 11.sp, modifier = Modifier.width(150.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End, maxLines = 2)
        Row(modifier = Modifier.width(76.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            BotonCompra(Icons.Outlined.Visibility, t.primario, "compras.ver", onVer)
            if (compra.estado != "anulada") {
                BotonCompra(Icons.Outlined.HighlightOff, Color(0xFFEF4444), "compras.anular", onAnular)
            }
        }
    }
}

private fun formatearFechaCompra(fecha: String, idioma: Idioma): String {
    return try {
        val entrada = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US)
        val patron = if (idioma == Idioma.ESPANOL) "d 'de' MMM 'de' yyyy, h:mm a" else "MMM d, yyyy, h:mm a"
        val salida = java.text.SimpleDateFormat(patron, if (idioma == Idioma.ESPANOL) java.util.Locale("es", "DO") else java.util.Locale.US)
        salida.format(entrada.parse(fecha) ?: return fecha)
    } catch (e: Exception) {
        fecha
    }
}

@Composable
private fun FilaVer(etiqueta: String, valor: String, t: TokensWeb) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(text = etiqueta, color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(text = valor, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun BadgeCompra(texto: String, colorFondo: Color, colorTexto: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .background(colorFondo, RoundedCornerShape(50))
            .border(1.dp, colorTexto.copy(alpha = 0.3f), RoundedCornerShape(50))
            .padding(horizontal = 4.dp, vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(text = texto, color = colorTexto, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun BotonCompra(icono: ImageVector, color: Color, descripcion: String, onClick: () -> Unit = {}) {
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

private fun metodoPagoTraduccion(metodo: String, idioma: Idioma): String {
    return when (metodo) {
        "efectivo" -> Traducciones.texto("metodo.efectivo", idioma)
        "tarjeta_debito" -> Traducciones.texto("metodo.debito", idioma)
        "tarjeta_credito" -> Traducciones.texto("metodo.tCredito", idioma)
        "transferencia" -> Traducciones.texto("metodo.transferencia", idioma)
        "cheque" -> Traducciones.texto("metodo.cheque", idioma)
        "mixto" -> Traducciones.texto("metodo.mixto", idioma)
        else -> metodo
    }
}

// ─────────────────────── BADGES ───────────────────────

private data class BadgeCompraInfo(val primero: String, val colorFondo: Color, val colorTexto: Color)

private fun badgeMetodoCompra(metodo: String, oscuro: Boolean): BadgeCompraInfo {
    return when (metodo) {
        "efectivo" -> BadgeCompraInfo("Efectivo", Color(0xFF22C55E).copy(alpha = 0.12f), if (oscuro) Color(0xFF4ADE80) else Color(0xFF16A34A))
        "tarjeta_debito" -> BadgeCompraInfo("Débito", Color(0xFF3B82F6).copy(alpha = 0.12f), if (oscuro) Color(0xFF60A5FA) else Color(0xFF2563EB))
        "tarjeta_credito" -> BadgeCompraInfo("T. Crédito", Color(0xFF9333EA).copy(alpha = 0.12f), if (oscuro) Color(0xFFA855F7) else Color(0xFF7C3AED))
        "transferencia" -> BadgeCompraInfo("Transfer.", Color(0xFFF59E0B).copy(alpha = 0.12f), if (oscuro) Color(0xFFFBBF24) else Color(0xFFD97706))
        "cheque" -> BadgeCompraInfo("Cheque", Color(0xFF64748B).copy(alpha = 0.12f), if (oscuro) Color(0xFF94A3B8) else Color(0xFF475569))
        "mixto" -> BadgeCompraInfo("Mixto", Color(0xFF6366F1).copy(alpha = 0.12f), if (oscuro) Color(0xFFA5B4FC) else Color(0xFF4F46E5))
        else -> BadgeCompraInfo("Otro", Color(0xFF64748B).copy(alpha = 0.12f), if (oscuro) Color(0xFF94A3B8) else Color(0xFF475569))
    }
}

private fun badgeEstadoCompra(estado: String): BadgeCompraInfo {
    return when (estado) {
        "recibida" -> BadgeCompraInfo("Recibida", Color(0xFF10B981).copy(alpha = 0.15f), Color(0xFF10B981))
        "pendiente" -> BadgeCompraInfo("Pendiente", Color(0xFFF59E0B).copy(alpha = 0.15f), Color(0xFFF59E0B))
        else -> BadgeCompraInfo("Anulada", Color(0xFFEF4444).copy(alpha = 0.15f), Color(0xFFEF4444))
    }
}