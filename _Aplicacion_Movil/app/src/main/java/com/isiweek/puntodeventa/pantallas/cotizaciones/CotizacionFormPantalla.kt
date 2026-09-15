package com.isiweek.puntodeventa.pantallas.cotizaciones

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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.KeyboardArrowDown
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.ClienteVentaOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private data class ProductoCot(
    val id: Int?,
    val nombre: String,
    val descripcion: String,
    val precio: Double,
    val cantidad: Double
) {
    val subtotal: Double get() = precio * cantidad
    val itbis: Double get() = subtotal * 0.18
    val total: Double get() = subtotal + itbis
}

/**
 * Formulario Nueva / Editar Cotización. Réplica de las pantallas nuevo/editar de la web.
 * Guarda en el JSON offline (tablas "cotizaciones" y "cotizacion_detalle").
 */
@Composable
fun CotizacionFormPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    esNuevo: Boolean,
    cotizacionId: Int?,
    onCerrar: () -> Unit
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
    val clientes = remember { RepositorioOffline.obtenerClientesVenta() }
    val productosCatalogo = remember { RepositorioOffline.obtenerProductos().filter { it.activo } }
    val existente = remember(cotizacionId) {
        cotizacionId?.let { RepositorioOffline.obtenerCotizacionPorId(it) }
    }
    val detallesExistentes = remember(cotizacionId) {
        cotizacionId?.let { RepositorioOffline.obtenerCotizacionDetalles(it) } ?: emptyList<com.isiweek.puntodeventa.offline.RepositorioOffline.DetalleCotizacionOffline>()
    }

    val cal = Calendar.getInstance()
    val hoyStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    cal.add(Calendar.DAY_OF_YEAR, 15)
    val venceDef = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)

    var clienteIdx by remember { mutableStateOf(clientes.indexOfFirst { it.id == existente?.clienteId }) }
    var fechaEmision by remember { mutableStateOf(existente?.fechaEmision?.takeIf { it.isNotBlank() } ?: hoyStr) }
    var fechaVencimiento by remember { mutableStateOf(existente?.fechaVencimiento?.takeIf { it.isNotBlank() } ?: venceDef) }
    var observaciones by remember { mutableStateOf(existente?.observaciones ?: "") }
    var descuento by remember { mutableStateOf("0") }
    var busquedaProducto by remember { mutableStateOf("") }
    var mostrarListaProductos by remember { mutableStateOf(false) }

    var seleccionados by remember {
        mutableStateOf(
            if (detallesExistentes.isNotEmpty()) {
                detallesExistentes.map { ProductoCot(it.productoId, it.nombreProducto, it.descripcionProducto, it.precioUnitario, it.cantidad) }
            } else {
                emptyList<ProductoCot>()
            }
        )
    }

    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }
    val subtotal = seleccionados.sumOf { it.subtotal }
    val desc = descuento.toDoubleOrNull() ?: 0.0
    val montoGravado = (subtotal - desc).coerceAtLeast(0.0)
    val itbisTotal = montoGravado * 0.18
    val total = montoGravado + itbisTotal

    val productosFiltrados = productosCatalogo.filter { p ->
        p.nombre.lowercase().contains(busquedaProducto.trim().lowercase()) ||
                p.codigoBarras.lowercase().contains(busquedaProducto.trim().lowercase()) ||
                p.sku.lowercase().contains(busquedaProducto.trim().lowercase())
    }

    fun agregarProducto(p: com.isiweek.puntodeventa.offline.RepositorioOffline.ProductoOffline) {
        if (seleccionados.any { it.id == p.id }) {
            Toast.makeText(context, Traducciones.texto("cotizaciones.yaExisteProducto", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        seleccionados = seleccionados + ProductoCot(p.id, p.nombre, p.descripcion, p.precioVenta, 1.0)
        busquedaProducto = ""
        mostrarListaProductos = false
    }

    fun actualizarPrecio(idx: Int, precio: Double) {
        seleccionados = seleccionados.mapIndexed { i, p -> if (i == idx) p.copy(precio = precio) else p }
    }

    fun actualizarCantidad(idx: Int, cantidad: Double) {
        seleccionados = seleccionados.mapIndexed { i, p -> if (i == idx) p.copy(cantidad = cantidad) else p }
    }

    fun guardar() {
        if (clienteIdx !in clientes.indices) {
            Toast.makeText(context, Traducciones.texto("cotizaciones.requiereCliente", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        if (seleccionados.isEmpty()) {
            Toast.makeText(context, Traducciones.texto("cotizaciones.requiereProductos", idioma), Toast.LENGTH_SHORT).show()
            return
        }

        val cotizacion = JSONObject().apply {
            if (!esNuevo && cotizacionId != null) put("id", cotizacionId)
            put("cliente_id", clientes[clienteIdx].id)
            put("subtotal", subtotal)
            put("descuento", desc)
            put("itbis", itbisTotal)
            put("total", total)
            put("fecha_emision", fechaEmision.trim())
            put("fecha_vencimiento", fechaVencimiento.trim())
            put("observaciones", if (observaciones.trim().isEmpty()) JSONObject.NULL else observaciones.trim())
            if (esNuevo) put("estado", "borrador")
        }
        val detalles = JSONArray()
        seleccionados.forEach { p ->
            detalles.put(
                JSONObject().apply {
                    put("producto_id", if (p.id != null) p.id else JSONObject.NULL)
                    put("nombre_producto", p.nombre)
                    put("descripcion_producto", if (p.descripcion.isBlank()) JSONObject.NULL else p.descripcion)
                    put("cantidad", p.cantidad)
                    put("precio_unitario", p.precio)
                    put("subtotal", p.subtotal)
                    put("aplica_itbis", 1)
                    put("monto_gravado", p.subtotal)
                    put("itbis", p.itbis)
                    put("total", p.total)
                }
            )
        }

        if (RepositorioOffline.guardarCotizacionOffline(context, cotizacion, detalles)) {
            Toast.makeText(context, Traducciones.texto("cotizaciones.guardado", idioma), Toast.LENGTH_SHORT).show()
            onCerrar()
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // ── Header ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.AutoMirrored.Outlined.ArrowBack,
                        contentDescription = null,
                        tint = t.textoSecundario,
                        modifier = Modifier
                            .size(28.dp)
                            .clickable(onClick = onCerrar)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = if (esNuevo) Traducciones.texto("cotizaciones.nuevo", idioma) else Traducciones.texto("cotizaciones.editar", idioma),
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = t.textoPrimario
                    )
                }
            }
        }

        // ── Información del Cliente ──
        item {
            PanelCot(t, Traducciones.texto("cotizaciones.infoCliente", idioma)) {
                EtiquetaCot(Traducciones.texto("cotizaciones.cliente", idioma) + " *", t)
                Spacer(Modifier.height(4.dp))
                SelectClienteCot(clientes, clienteIdx, t, idioma) { clienteIdx = it }
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        EtiquetaCot(Traducciones.texto("cotizaciones.fechaEmision", idioma), t)
                        Spacer(Modifier.height(4.dp))
                        CampoInputCot(fechaEmision, { fechaEmision = it }, t, "yyyy-MM-dd")
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        EtiquetaCot(Traducciones.texto("cotizaciones.fechaVencimiento", idioma), t)
                        Spacer(Modifier.height(4.dp))
                        CampoInputCot(fechaVencimiento, { fechaVencimiento = it }, t, "yyyy-MM-dd")
                    }
                }
            }
        }

        // ── Productos ──
        item {
            PanelCot(t, Traducciones.texto("cotizaciones.productos", idioma)) {
                EtiquetaCot(Traducciones.texto("cotizaciones.agregarProducto", idioma), t)
                Spacer(Modifier.height(4.dp))
                Box(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Search, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        BasicTextField(
                            value = busquedaProducto,
                            onValueChange = { busquedaProducto = it; mostrarListaProductos = it.isNotEmpty() },
                            singleLine = true,
                            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp),
                            cursorBrush = SolidColor(t.primario),
                            modifier = Modifier.weight(1f)
                        )
                        if (busquedaProducto.isNotEmpty()) {
                            Icon(
                                Icons.Outlined.Close,
                                contentDescription = null,
                                tint = t.textoTerciario,
                                modifier = Modifier
                                    .size(16.dp)
                                    .clickable { busquedaProducto = ""; mostrarListaProductos = false }
                            )
                        }
                    }
                    if (mostrarListaProductos && productosFiltrados.isNotEmpty()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 4.dp)
                                .background(t.fondoElevado, RoundedCornerShape(8.dp))
                                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                        ) {
                            productosFiltrados.take(8).forEach { p ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { agregarProducto(p) }
                                        .padding(horizontal = 10.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(p.nombre, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(fmt(p.precioVenta), color = t.textoSecundario, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))

                if (seleccionados.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(24.dp))
                        Spacer(Modifier.height(6.dp))
                        Text(Traducciones.texto("cotizaciones.sinProductos", idioma), color = t.textoTerciario, fontSize = 13.sp)
                    }
                } else {
                    seleccionados.forEachIndexed { idx, p ->
                        FilaProductoCot(p, t, idioma, { actualizarPrecio(idx, it) }, { actualizarCantidad(idx, it) }, { seleccionados = seleccionados.filterIndexed { i, _ -> i != idx } })
                    }
                }
            }
        }

        // ── Observaciones ──
        item {
            PanelCot(t, Traducciones.texto("cotizaciones.observaciones", idioma)) {
                CampoAreaCot(observaciones, { observaciones = it }, t, "Notas internas o para el cliente...")
            }
        }

        // ── Resumen ──
        item {
            PanelCot(t, Traducciones.texto("cotizaciones.resumen", idioma)) {
                FilaResumenCot(Traducciones.texto("compras.subtotal", idioma), fmt(subtotal), t, false)
                FilaResumenCot(Traducciones.texto("cotizaciones.itbis", idioma), fmt(itbisTotal), t, false)
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
                    Text(Traducciones.texto("cotizaciones.descuento", idioma), color = t.textoSecundario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                    CampoMonedaCot(descuento, { descuento = it }, t, Modifier.width(110.dp))
                }
                FilaResumenCot(Traducciones.texto("compras.total", idioma), fmt(total), t, true)
                Spacer(Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.primario, RoundedCornerShape(8.dp))
                        .clickable(onClick = { guardar() })
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(Traducciones.texto("cotizaciones.guardar", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun PanelCot(t: TokensWeb, titulo: String, contenido: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(titulo, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 12.dp))
        contenido()
    }
}

@Composable
private fun EtiquetaCot(texto: String, t: TokensWeb) {
    Text(texto, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
}

@Composable
private fun CampoInputCot(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            singleLine = true,
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier.fillMaxWidth()
        )
        if (valor.isEmpty()) {
            Text(placeholder, color = t.textoTerciario, fontSize = 13.sp)
        }
    }
}

@Composable
private fun CampoAreaCot(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 80.dp)
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

@Composable
private fun CampoMonedaCot(valor: String, onValor: (String) -> Unit, t: TokensWeb, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .background(t.fondoContenido, RoundedCornerShape(6.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp)
    ) {
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun SelectClienteCot(
    clientes: List<ClienteVentaOffline>,
    seleccionIdx: Int,
    t: TokensWeb,
    idioma: Idioma,
    onSeleccion: (Int) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }
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
            Text(
                text = if (seleccionIdx in clientes.indices) clientes[seleccionIdx].nombreCompleto else Traducciones.texto("cotizaciones.seleccionarCliente", idioma),
                color = if (seleccionIdx in clientes.indices) t.textoPrimario else t.textoTerciario,
                fontSize = 14.sp,
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
            clientes.forEachIndexed { idx, c ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(c.nombreCompleto, color = t.textoPrimario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    onClick = { onSeleccion(idx); expandido = false }
                )
            }
        }
    }
}

@Composable
private fun FilaProductoCot(
    p: ProductoCot,
    t: TokensWeb,
    idioma: Idioma,
    onPrecio: (Double) -> Unit,
    onCantidad: (Double) -> Unit,
    onEliminar: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(8.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(p.nombre, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (p.descripcion.isNotBlank()) {
                    Text(p.descripcion, color = t.textoTerciario, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            Icon(
                Icons.Outlined.DeleteOutline,
                contentDescription = null,
                tint = Color(0xFFEF4444),
                modifier = Modifier
                    .size(20.dp)
                    .padding(start = 4.dp)
                    .clickable(onClick = onEliminar)
            )
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CampoNumeroCot(p.precio, onPrecio, t, Modifier.width(72.dp), decimales = true)
            Spacer(Modifier.width(6.dp))
            CampoNumeroCot(p.cantidad, onCantidad, t, Modifier.width(64.dp), decimales = true)
            Text(
                text = "${RepositorioOffline.simboloMoneda()} %.2f".format(p.subtotal),
                color = t.textoPrimario,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
                textAlign = androidx.compose.ui.text.style.TextAlign.End,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun CampoNumeroCot(
    valor: Double,
    onValor: (Double) -> Unit,
    t: TokensWeb,
    modifier: Modifier,
    decimales: Boolean
) {
    var texto by remember { mutableStateOf(if (valor == valor.toLong().toDouble()) valor.toLong().toString() else valor.toString()) }
    Box(
        modifier = modifier
            .background(t.fondoContenido, RoundedCornerShape(6.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp)
    ) {
        BasicTextField(
            value = texto,
            onValueChange = { nuevo ->
                texto = nuevo
                onValor(nuevo.toDoubleOrNull() ?: 0.0)
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = if (decimales) KeyboardType.Decimal else KeyboardType.Number),
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun FilaResumenCot(etiqueta: String, valor: String, t: TokensWeb, resaltado: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = etiqueta,
            color = t.textoSecundario,
            fontSize = if (resaltado) 15.sp else 13.sp,
            fontWeight = if (resaltado) FontWeight.Bold else FontWeight.SemiBold,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = valor,
            color = if (resaltado) t.primario else t.textoPrimario,
            fontSize = if (resaltado) 17.sp else 14.sp,
            fontWeight = FontWeight.Bold
        )
    }
}