package com.isiweek.puntodeventa.pantallas.compras

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
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import org.json.JSONArray
import org.json.JSONObject

private data class ProductoCompra(
    val id: Int?,
    val nombre: String,
    val esNuevo: Boolean,
    val precio: Double,
    val cantidad: Double
) {
    val subtotal: Double get() = precio * cantidad
}

/**
 * Pantalla Nueva Compra. Réplica de _Pages/admin/compras/nuevo/nuevo.js.
 * Registra la compra en el JSON offline (compras + detalle_compras) y
 * actualiza el stock e inventario.
 */
@Composable
fun NuevaCompraPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onVolver: () -> Unit,
    onGuardada: () -> Unit
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

    val tiposComprobante = remember { RepositorioOffline.obtenerTiposComprobante() }
    val productosCatalogo = remember { RepositorioOffline.obtenerProductos().filter { it.activo } }
    val proveedores = remember { RepositorioOffline.obtenerProveedores().filter { it.activo } }

    var tipoCompIdx by remember { mutableStateOf(-1) }
    var ncf by remember { mutableStateOf("") }
    var proveedorId by remember { mutableStateOf<Int?>(null) }
    var mostrarNuevoProveedor by remember { mutableStateOf(false) }
    var nuevoProveedorNombre by remember { mutableStateOf("") }
    var metodoPago by remember { mutableStateOf("efectivo") }
    var notas by remember { mutableStateOf("") }

    var busquedaProducto by remember { mutableStateOf("") }
    var mostrarListaProductos by remember { mutableStateOf(false) }
    var nombreProductoNuevo by remember { mutableStateOf("") }
    var cantidadProductoNuevo by remember { mutableStateOf("") }
    var precioProductoNuevo by remember { mutableStateOf("") }

    var seleccionados by remember { mutableStateOf(listOf<ProductoCompra>()) }

    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }
    val subtotal = seleccionados.sumOf { it.subtotal }
    val itbis = subtotal * 0.18
    val total = subtotal + itbis

    val productosFiltrados = productosCatalogo.filter { p ->
        p.nombre.lowercase().contains(busquedaProducto.trim().lowercase()) ||
                p.codigoBarras.lowercase().contains(busquedaProducto.trim().lowercase())
    }

    fun agregarExistente(p: com.isiweek.puntodeventa.offline.RepositorioOffline.ProductoOffline) {
        if (seleccionados.any { it.id == p.id }) {
            Toast.makeText(context, Traducciones.texto("compras.yaExisteProducto", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        seleccionados = seleccionados + ProductoCompra(p.id, p.nombre, false, p.precioCompra, 1.0)
        busquedaProducto = ""
        mostrarListaProductos = false
    }

    fun agregarNuevo() {
        val nombre = nombreProductoNuevo.trim()
        if (nombre.isEmpty()) {
            Toast.makeText(context, Traducciones.texto("compras.nombreObligatorio", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        val cantidad = cantidadProductoNuevo.toDoubleOrNull() ?: 0.0
        if (cantidad <= 0) {
            Toast.makeText(context, Traducciones.texto("compras.cantidadValida", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        val precio = precioProductoNuevo.toDoubleOrNull() ?: 0.0
        if (precio <= 0) {
            Toast.makeText(context, Traducciones.texto("compras.precioValido", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        if (seleccionados.any { it.nombre.equals(nombre, ignoreCase = true) }) {
            Toast.makeText(context, Traducciones.texto("compras.yaExisteProducto", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        val enCatalogo = productosCatalogo.firstOrNull { it.nombre.equals(nombre, ignoreCase = true) }
        if (enCatalogo != null) {
            seleccionados = seleccionados + ProductoCompra(enCatalogo.id, enCatalogo.nombre, false, precio, cantidad)
        } else {
            seleccionados = seleccionados + ProductoCompra(null, nombre, true, precio, cantidad)
        }
        nombreProductoNuevo = ""
        cantidadProductoNuevo = ""
        precioProductoNuevo = ""
    }

    fun actualizarPrecio(idx: Int, precio: Double) {
        seleccionados = seleccionados.mapIndexed { i, p -> if (i == idx) p.copy(precio = precio) else p }
    }

    fun actualizarCantidad(idx: Int, cantidad: Double) {
        seleccionados = seleccionados.mapIndexed { i, p -> if (i == idx) p.copy(cantidad = cantidad) else p }
    }

    fun eliminar(idx: Int) {
        seleccionados = seleccionados.filterIndexed { i, _ -> i != idx }
    }

    fun guardar() {
        if (tipoCompIdx !in tiposComprobante.indices) {
            Toast.makeText(context, Traducciones.texto("compras.requiereComprobante", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        if (ncf.trim().isEmpty()) {
            Toast.makeText(context, Traducciones.texto("compras.requiereNcf", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        if (proveedorId == null && nuevoProveedorNombre.trim().isEmpty()) {
            Toast.makeText(context, Traducciones.texto("compras.requiereProveedor", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        if (seleccionados.isEmpty()) {
            Toast.makeText(context, Traducciones.texto("compras.requiereProductos", idioma), Toast.LENGTH_SHORT).show()
            return
        }

        val proveedorIdFinal = proveedorId ?: RepositorioOffline.guardarProveedor(
            context,
            JSONObject().apply {
                put("nombre_comercial", nuevoProveedorNombre.trim())
                put("razon_social", nuevoProveedorNombre.trim())
            }
        )

        val compra = JSONObject().apply {
            put("tipo_comprobante_id", tiposComprobante[tipoCompIdx].id)
            put("ncf", ncf.trim())
            put("proveedor_id", proveedorIdFinal)
            put("subtotal", subtotal)
            put("itbis", itbis)
            put("total", total)
            put("metodo_pago", metodoPago)
            put("notas", if (notas.trim().isEmpty()) JSONObject.NULL else notas.trim())
        }
        val detalles = JSONArray()
        seleccionados.forEach { p ->
            detalles.put(
                JSONObject().apply {
                    put("producto_id", if (p.id != null) p.id else JSONObject.NULL)
                    put("nombre", p.nombre)
                    put("cantidad", p.cantidad)
                    put("precio_unitario", p.precio)
                    put("subtotal", p.subtotal)
                    put("es_nuevo", p.esNuevo)
                }
            )
        }

        if (RepositorioOffline.guardarCompraOffline(context, compra, detalles)) {
            Toast.makeText(context, Traducciones.texto("compras.compraGuardada", idioma), Toast.LENGTH_SHORT).show()
            onGuardada()
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
                Text(
                    text = Traducciones.texto("compras.nuevo", idioma),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario
                )
                Text(
                    text = Traducciones.texto("compras.nuevoSub", idioma),
                    fontSize = 13.sp,
                    color = t.textoSecundario,
                    modifier = Modifier.padding(bottom = 10.dp)
                )
                Row(
                    modifier = Modifier
                        .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                        .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                        .clickable(onClick = onVolver)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = Traducciones.texto("compras.volver", idioma),
                        color = t.textoPrimario,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        // ── Panel Información de la Compra ──
        item {
            PanelCompra(t) {
                Text(Traducciones.texto("compras.tituloItem", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 12.dp))

                EtiquetaInput(Traducciones.texto("compras.tipoComprobante", idioma) + " *", t)
                Spacer(Modifier.height(4.dp))
                SelectInput(
                    opciones = tiposComprobante.map { it.nombre },
                    seleccionIdx = tipoCompIdx,
                    placeholder = Traducciones.texto("compras.tipoComprobante", idioma),
                    t = t
                ) { idx ->
                    tipoCompIdx = idx
                    ncf = RepositorioOffline.proximoNcf(tiposComprobante[idx].prefijoNcf)
                }
                Spacer(Modifier.height(10.dp))

                EtiquetaInput("NCF *", t)
                Spacer(Modifier.height(4.dp))
                CampoInputConX(ncf, { ncf = it }, t, "B0100000001", onLimpiar = { ncf = "" })
                Spacer(Modifier.height(10.dp))

                EtiquetaInput(Traducciones.texto("compras.proveedor", idioma) + " *", t)
                Spacer(Modifier.height(4.dp))
                SelectProveedor(
                    proveedores = proveedores,
                    seleccionado = proveedorId,
                    t = t,
                    idioma = idioma,
                    onSeleccion = { id, esNuevo ->
                        proveedorId = id
                        mostrarNuevoProveedor = esNuevo
                    }
                )
                if (mostrarNuevoProveedor) {
                    Spacer(Modifier.height(6.dp))
                    CampoInput(nuevoProveedorNombre, { nuevoProveedorNombre = it }, t, Traducciones.texto("compras.nuevoProveedor", idioma))
                }
                Spacer(Modifier.height(10.dp))

                EtiquetaInput(Traducciones.texto("compras.metodoPago", idioma) + " *", t)
                Spacer(Modifier.height(4.dp))
                SelectInput(
                    opciones = listOf(
                        Traducciones.texto("metodo.efectivo", idioma),
                        Traducciones.texto("metodo.debito", idioma),
                        Traducciones.texto("metodo.tCredito", idioma),
                        Traducciones.texto("metodo.transferencia", idioma),
                        Traducciones.texto("metodo.cheque", idioma),
                        Traducciones.texto("metodo.mixto", idioma)
                    ),
                    seleccionIdx = listOf("efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia", "cheque", "mixto").indexOf(metodoPago),
                    placeholder = Traducciones.texto("compras.metodoPago", idioma),
                    t = t
                ) { idx ->
                    metodoPago = listOf("efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia", "cheque", "mixto")[idx]
                }
                Spacer(Modifier.height(10.dp))

                EtiquetaInput(Traducciones.texto("compras.notas", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoArea(notas, { notas = it }, t, Traducciones.texto("compras.notas", idioma))
            }
        }

        // ── Panel Totales ──
        item {
            PanelCompra(t) {
                Text(Traducciones.texto("compras.total", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 10.dp))
                FilaTotal(Traducciones.texto("compras.subtotal", idioma), fmt(subtotal), t, false)
                FilaTotal(Traducciones.texto("compras.itbis", idioma), fmt(itbis), t, false)
                FilaTotal(Traducciones.texto("compras.total", idioma), fmt(total), t, true)
                Spacer(Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.primario, RoundedCornerShape(8.dp))
                        .clickable(onClick = { guardar() })
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(Traducciones.texto("compras.registrar", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // ── Panel Agregar Productos ──
        item {
            PanelCompra(t) {
                Text(Traducciones.texto("compras.agregarProductos", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 12.dp))

                Text(Traducciones.texto("compras.buscarCatalogo", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
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
                                        .clickable { agregarExistente(p) }
                                        .padding(horizontal = 10.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(p.nombre, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(fmt(p.precioCompra), color = t.textoSecundario, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }

                // Divisor O
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.weight(1f).height(1.dp).background(t.bordeClaro))
                    Text(Traducciones.texto("compras.separador", idioma), color = t.textoTerciario, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp))
                    Box(modifier = Modifier.weight(1f).height(1.dp).background(t.bordeClaro))
                }

                Text(Traducciones.texto("compras.agregarNuevo", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                Spacer(Modifier.height(4.dp))
                EtiquetaInput(Traducciones.texto("compras.nombreProducto", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoInput(nombreProductoNuevo, { nombreProductoNuevo = it }, t, Traducciones.texto("compras.nombreProducto", idioma))
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        EtiquetaInput(Traducciones.texto("compras.cantidad", idioma), t)
                        Spacer(Modifier.height(4.dp))
                        CampoMoneda(cantidadProductoNuevo, { cantidadProductoNuevo = it }, t, decimales = false)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        EtiquetaInput(Traducciones.texto("compras.precio", idioma), t)
                        Spacer(Modifier.height(4.dp))
                        CampoMoneda(precioProductoNuevo, { precioProductoNuevo = it }, t, decimales = true)
                    }
                }
                Spacer(Modifier.height(10.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.primarioClaro, RoundedCornerShape(8.dp))
                        .clickable(onClick = { agregarNuevo() })
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(Traducciones.texto("compras.agregar", idioma), color = t.primario, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(Modifier.height(14.dp))

                if (seleccionados.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 18.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(26.dp))
                        Spacer(Modifier.height(6.dp))
                        Text(Traducciones.texto("compras.sinProductos", idioma), color = t.textoTerciario, fontSize = 13.sp)
                    }
                } else {
                    // Cabecera de la tabla de productos
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(t.fondoContenido, RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(Traducciones.texto("compras.nombre", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.weight(1.2f))
                        Text(Traducciones.texto("compras.precio", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(72.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                        Text(Traducciones.texto("compras.cantidad", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(64.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                        Text(Traducciones.texto("compras.subtotal", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(84.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                        Spacer(Modifier.width(26.dp))
                    }
                    seleccionados.forEachIndexed { idx, p ->
                        FilaProductoCompra(
                            p = p,
                            t = t,
                            idioma = idioma,
                            onPrecio = { actualizarPrecio(idx, it) },
                            onCantidad = { actualizarCantidad(idx, it) },
                            onEliminar = { eliminar(idx) }
                        )
                    }
                }
            }
        }
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun PanelCompra(t: TokensWeb, contenido: @Composable () -> Unit) {
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
private fun EtiquetaInput(texto: String, t: TokensWeb) {
    Text(texto, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
}

@Composable
private fun CampoInput(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
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
private fun CampoInputConX(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String, onLimpiar: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(start = 12.dp, end = 6.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
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
            if (valor.isNotEmpty()) {
                Icon(
                    Icons.Outlined.Close,
                    contentDescription = null,
                    tint = t.textoTerciario,
                    modifier = Modifier
                        .size(28.dp)
                        .padding(5.dp)
                        .clickable(onClick = onLimpiar)
                )
            }
        }
    }
}

@Composable
private fun CampoArea(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 72.dp)
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
private fun CampoMoneda(valor: String, onValor: (String) -> Unit, t: TokensWeb, decimales: Boolean) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 9.dp)
    ) {
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = if (decimales) KeyboardType.Decimal else KeyboardType.Number),
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier.fillMaxWidth()
        )
        if (valor.isEmpty()) {
            Text(if (decimales) "0.00" else "0", color = t.textoTerciario, fontSize = 13.sp)
        }
    }
}

@Composable
private fun SelectInput(
    opciones: List<String>,
    seleccionIdx: Int,
    placeholder: String,
    t: TokensWeb,
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
                text = if (seleccionIdx in opciones.indices) opciones[seleccionIdx] else placeholder,
                color = if (seleccionIdx in opciones.indices) t.textoPrimario else t.textoTerciario,
                fontSize = 14.sp,
                modifier = Modifier.weight(1f)
            )
            Icon(Icons.Outlined.KeyboardArrowDown, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
        }
        androidx.compose.material3.DropdownMenu(
            expanded = expandido,
            onDismissRequest = { expandido = false },
            containerColor = t.fondoElevado
        ) {
            opciones.forEachIndexed { idx, opc ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(opc, color = t.textoPrimario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    onClick = { onSeleccion(idx); expandido = false }
                )
            }
        }
    }
}

@Composable
private fun SelectProveedor(
    proveedores: List<RepositorioOffline.ProveedorOffline>,
    seleccionado: Int?,
    t: TokensWeb,
    idioma: Idioma,
    onSeleccion: (Int?, Boolean) -> Unit
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
                text = proveedores.firstOrNull { it.id == seleccionado }?.nombreComercial
                    ?: Traducciones.texto("compras.todosProveedores", idioma),
                color = if (seleccionado != null) t.textoPrimario else t.textoTerciario,
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
            proveedores.forEach { prov ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(prov.nombreComercial, color = t.textoPrimario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    onClick = { onSeleccion(prov.id, false); expandido = false }
                )
            }
            androidx.compose.material3.DropdownMenuItem(
                text = { Text("+ ${Traducciones.texto("compras.nuevoProveedor", idioma)}", color = t.primario, fontSize = 13.sp, fontWeight = FontWeight.Bold) },
                onClick = { onSeleccion(null, true); expandido = false }
            )
        }
    }
}

@Composable
private fun FilaTotal(etiqueta: String, valor: String, t: TokensWeb, resaltado: Boolean) {
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

@Composable
private fun FilaProductoCompra(
    p: ProductoCompra,
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
            Text(p.nombre, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (p.esNuevo) {
                Box(
                    modifier = Modifier
                        .background(t.primarioClaro, RoundedCornerShape(50))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(Traducciones.texto("compras.agregarNuevo", idioma).substringBefore(" "), color = t.primario, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CampoNumero(p.precio, onPrecio, t, Modifier.width(72.dp), decimales = true)
            Spacer(Modifier.width(6.dp))
            CampoNumero(p.cantidad, onCantidad, t, Modifier.width(64.dp), decimales = false)
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
    }
}

@Composable
private fun CampoNumero(
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