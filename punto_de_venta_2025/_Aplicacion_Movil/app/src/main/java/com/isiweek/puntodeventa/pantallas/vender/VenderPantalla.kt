package com.isiweek.puntodeventa.pantallas.vender

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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ExitToApp
import androidx.compose.material.icons.automirrored.outlined.MergeType
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CardGiftcard
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.ProductoOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.ClienteVentaOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.TipoComprobanteOffline
import com.isiweek.puntodeventa.pantallas.ticket.LineaTicket
import com.isiweek.puntodeventa.pantallas.ticket.TicketVenta
import com.isiweek.puntodeventa.ui.componentes.BotonAgregarExtra
import com.isiweek.puntodeventa.ui.componentes.BotonMetodoPago
import com.isiweek.puntodeventa.ui.componentes.BotonProcesar
import com.isiweek.puntodeventa.ui.componentes.CampoMoneda
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TarjetaWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Pantalla Nueva Venta (POS). Réplica EXACTA de _Pages/admin/ventas/nueva/nueva.js
 * usando el design system web (bordes, radios, fondos, grids y colores del CSS).
 * Es la pantalla inicial de la app.
 */

// ─────────────────────── MODELO ───────────────────────

data class MetodoPagoInfo(
    val valor: String,
    val claveEtiqueta: String,
    val icono: ImageVector,
    val colorBorde: Color,
    val colorFondo: Color,
    val colorTextoClaro: Color,
    val colorTextoOscuro: Color
)

data class ItemVenta(
    val id: Long,
    val codigo: String,
    val nombre: String,
    val precio: Double,
    val cantidad: Int,
    val aplicaItbis: Boolean = true,
    val orden: Long = System.currentTimeMillis()
)

data class ClienteVenta(
    val id: Long,
    val nombreCompleto: String,
    val tipoDocumento: String = "CED",
    val numeroDocumento: String = "",
    val conCredito: Boolean = false
)

data class ItemExtra(
    val id: Long,
    val nombre: String,
    val tipo: String,
    val cantidad: Double,
    val precioUnitario: Double,
    val aplicaItbis: Boolean = true,
    val notas: String? = null,
    val orden: Long = System.currentTimeMillis()
)

/** Fila unificada de la lista de venta (producto o extra), ordenada por recencia. */
private data class LineaVenta(
    val esProducto: Boolean,
    val itemVenta: ItemVenta?,
    val itemExtra: ItemExtra?,
    val orden: Long
)

/** Tasa de impuesto (%) configurada por la empresa importada; 0 si no aplica ITBIS. */
private fun tasaItbis(): Double =
    RepositorioOffline.obtenerEmpresa()?.impuestoPorcentaje?.toDoubleOrNull() ?: 0.0

/** Etiquetas ECF (igual que la web: B01→E31, B02→E32, B03→E33, B04→E34, B14→E44, B15→E45, B16→E46). */
private val ECF_ETIQUETA: Map<String, String> = mapOf(
    "B01" to "E31 - Crédito Fiscal",
    "B02" to "E32 - Consumidor Final",
    "B03" to "E33 - Nota de Débito",
    "B04" to "E34 - Nota de Crédito",
    "B14" to "E44 - Regímenes Especiales",
    "B15" to "E45 - Gubernamental",
    "B16" to "E46 - Exportaciones"
)

private fun etiquetaComprobante(tipo: TipoComprobanteOffline): String =
    ECF_ETIQUETA[tipo.codigo.ifBlank { tipo.prefijoNcf }] ?: "${tipo.codigo} - ${tipo.nombre}"

// ─────────────────────── PANTALLA ───────────────────────

@Composable
fun VenderPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onVentaRapida: () -> Unit = {},
    onImprimir: (TicketVenta) -> Unit = {},
    clienteInicial: ClienteVenta? = null,
    metodoInicial: String? = null
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

    var metodoPago by remember { mutableStateOf(metodoInicial ?: "efectivo") }
    var efectivoRecibido by remember { mutableStateOf("") }
    var descuentoGlobal by remember { mutableStateOf("") }
    var busquedaProducto by remember { mutableStateOf("") }
    var busquedaCliente by remember { mutableStateOf(clienteInicial?.nombreCompleto ?: "") }
    var clienteSeleccionado by remember { mutableStateOf(clienteInicial) }
    var mostrarModalCliente by remember { mutableStateOf(false) }
    var mostrarModalExtra by remember { mutableStateOf(false) }

    val metodos = metodosPago(oscuro)

    // ── Tipos de comprobante (tabla global del JSON offline) ──
    val tiposComprobante = remember { RepositorioOffline.obtenerTiposComprobante() }
    var tipoComprobanteId by remember {
        mutableStateOf(tiposComprobante.firstOrNull { it.id == 2 }?.id ?: tiposComprobante.firstOrNull()?.id ?: 2)
    }
    val tipoComprobanteActual = tiposComprobante.firstOrNull { it.id == tipoComprobanteId }

    // ── Datos reales del JSON offline (productos y clientes) ──
    val context = LocalContext.current
    val todosProductos = remember { RepositorioOffline.obtenerProductos() }
    val todosClientes = remember { RepositorioOffline.obtenerClientesVenta() }
    var productosFiltrados by remember { mutableStateOf(listOf<ProductoOffline>()) }
    var mostrarDropdownProductos by remember { mutableStateOf(false) }
    var clientesFiltrados by remember { mutableStateOf(listOf<ClienteVentaOffline>()) }
    var mostrarDropdownClientes by remember { mutableStateOf(false) }

    LaunchedEffect(busquedaProducto) {
        val q = busquedaProducto.trim().lowercase()
        if (q.isEmpty()) {
            productosFiltrados = emptyList()
            mostrarDropdownProductos = false
        } else {
            productosFiltrados = todosProductos
                .filter { it.nombre.lowercase().contains(q) || it.sku.lowercase().contains(q) || it.codigoBarras.lowercase().contains(q) }
                .take(12)
            mostrarDropdownProductos = true
        }
    }

    LaunchedEffect(busquedaCliente, clienteSeleccionado) {
        if (clienteSeleccionado != null) {
            clientesFiltrados = emptyList()
            mostrarDropdownClientes = false
        } else {
            val q = busquedaCliente.trim().lowercase()
            if (q.isEmpty()) {
                clientesFiltrados = emptyList()
                mostrarDropdownClientes = false
            } else {
                clientesFiltrados = todosClientes
                    .filter { it.nombreCompleto.lowercase().contains(q) || it.documento.lowercase().contains(q) }
                    .take(12)
                mostrarDropdownClientes = true
            }
        }
    }

    var carrito by remember { mutableStateOf(listOf<ItemVenta>()) }
    var extras by remember { mutableStateOf(listOf<ItemExtra>()) }
    var formExtraNombre by remember { mutableStateOf("") }
    var formExtraTipo by remember { mutableStateOf("ingrediente") }
    var formExtraCantidad by remember { mutableStateOf("1") }
    var formExtraPrecio by remember { mutableStateOf("") }
    var formExtraItbis by remember { mutableStateOf(true) }
    var formExtraNotas by remember { mutableStateOf("") }

    val subtotal = carrito.sumOf { it.precio * it.cantidad } + extras.sumOf { it.precioUnitario * it.cantidad }
    val impuesto = tasaItbis()
    val itbis = carrito.filter { it.aplicaItbis }.sumOf { it.precio * it.cantidad * impuesto / 100 } +
            extras.filter { it.aplicaItbis }.sumOf { it.precioUnitario * it.cantidad * impuesto / 100 }
    val descuento = descuentoGlobal.toDoubleOrNull() ?: 0.0
    val total = subtotal + itbis - descuento
    val cambio = (efectivoRecibido.toDoubleOrNull() ?: 0.0) - total

    fun agregarProducto(prod: ProductoOffline) {
        val existente = carrito.find { it.id == prod.id.toLong() }
        carrito = if (existente != null) {
            carrito.map { if (it.id == prod.id.toLong()) it.copy(cantidad = it.cantidad + 1) else it }
        } else {
            listOf(
                ItemVenta(
                    id = prod.id.toLong(),
                    codigo = prod.sku.ifBlank { prod.codigoBarras.ifBlank { prod.id.toString() } },
                    nombre = prod.nombre,
                    precio = prod.precioVenta,
                    cantidad = 1,
                    aplicaItbis = prod.aplicaItbis
                )
            ) + carrito
        }
        busquedaProducto = ""
        mostrarDropdownProductos = false
    }

    fun seleccionarCliente(cl: ClienteVentaOffline) {
        clienteSeleccionado = ClienteVenta(cl.id.toLong(), cl.nombreCompleto, numeroDocumento = cl.documento)
        busquedaCliente = cl.nombreCompleto
        mostrarDropdownClientes = false
    }

    /** Guarda la venta en el JSON offline (ventas, detalle_ventas, venta_extras) y descuenta stock. */
    fun procesarVenta() {
        if (carrito.isEmpty() && extras.isEmpty()) return
        val cajaAbierta = RepositorioOffline.obtenerCajaAbierta()
        if (cajaAbierta == null) {
            android.widget.Toast.makeText(context, Traducciones.texto("vender.requiereCaja", idioma), android.widget.Toast.LENGTH_SHORT).show()
            return
        }
        val ventaId = RepositorioOffline.proximoIdTabla("ventas")
        val numeroInterno = "VENTA${String.format("%06d", 100000 + ventaId)}"
        val prefijoNcf = tipoComprobanteActual?.prefijoNcf?.takeIf { it.isNotBlank() } ?: "B02"
        val ncf = prefijoNcf + String.format("%010d", 100000000 + ventaId)
        val empresaId = RepositorioOffline.obtenerEmpresa()?.id ?: 0
        val usuarioId = RepositorioOffline.usuarioId()
        val fechaVenta = RepositorioOffline.fechaHoraIsoActual()

        val venta = JSONObject()
        venta.put("id", ventaId)
        venta.put("empresa_id", empresaId)
        venta.put("tipo_comprobante_id", tipoComprobanteId)
        venta.put("ncf", ncf)
        venta.put("numero_interno", numeroInterno)
        venta.put("usuario_id", usuarioId)
        venta.put("caja_id", cajaAbierta.id)
        venta.put("cliente_id", clienteSeleccionado?.id ?: JSONObject.NULL)
        venta.put("subtotal", subtotal)
        venta.put("descuento", descuento)
        venta.put("monto_gravado", subtotal)
        venta.put("itbis", itbis)
        venta.put("total", total)
        venta.put("metodo_pago", metodoPago)
        venta.put("tipo_entrega", "completa")
        venta.put("despacho_completo", 1)
        venta.put(
            "efectivo_recibido",
            if (metodoPago == "efectivo" && efectivoRecibido.isNotBlank()) (efectivoRecibido.toDoubleOrNull() ?: total) else JSONObject.NULL
        )
        venta.put(
            "cambio",
            if (metodoPago == "efectivo" && efectivoRecibido.isNotBlank()) cambio.coerceAtLeast(0.0) else JSONObject.NULL
        )
        venta.put("estado", "emitida")
        venta.put("notas", JSONObject.NULL)
        venta.put("fecha_venta", fechaVenta)

        val detalles = JSONArray()
        val stockMap = mutableMapOf<Int, Double>()
        var detId = RepositorioOffline.proximoIdTabla("detalle_ventas")
        carrito.forEach { item ->
            val base = item.precio * item.cantidad
            val itbisLinea = if (item.aplicaItbis) base * impuesto / 100 else 0.0
            val det = JSONObject()
            det.put("id", detId++)
            det.put("venta_id", ventaId)
            det.put("producto_id", item.id)
            det.put("unidad_medida_id", JSONObject.NULL)
            det.put("cantidad", item.cantidad)
            det.put("cantidad_base", item.cantidad)
            det.put("cantidad_despachada", item.cantidad)
            det.put("cantidad_pendiente", 0)
            det.put("precio_unitario", item.precio)
            det.put("subtotal", base)
            det.put("descuento", 0)
            det.put("monto_gravado", base)
            det.put("itbis", itbisLinea)
            det.put("total", base + itbisLinea)
            detalles.put(det)
            stockMap[item.id.toInt()] = (stockMap[item.id.toInt()] ?: 0.0) + item.cantidad
        }

        val extrasArr = JSONArray()
        var extraId = RepositorioOffline.proximoIdTabla("venta_extras")
        extras.forEach { e ->
            val base = e.precioUnitario * e.cantidad
            val imp = if (e.aplicaItbis) base * impuesto / 100 else 0.0
            val ex = JSONObject()
            ex.put("id", extraId++)
            ex.put("venta_id", ventaId)
            ex.put("empresa_id", empresaId)
            ex.put("usuario_id", usuarioId)
            ex.put("tipo", e.tipo)
            ex.put("nombre", e.nombre)
            ex.put("cantidad", e.cantidad)
            ex.put("precio_unitario", e.precioUnitario)
            ex.put("aplica_itbis", if (e.aplicaItbis) 1 else 0)
            ex.put("impuesto_porcentaje", impuesto)
            ex.put("monto_base", base)
            ex.put("monto_impuesto", imp)
            ex.put("monto_total", base + imp)
            ex.put("notas", e.notas ?: JSONObject.NULL)
            extrasArr.put(ex)
        }

        RepositorioOffline.guardarVentaOffline(context, venta, detalles, extrasArr, stockMap)

        val ticket = TicketVenta(
            numeroInterno = numeroInterno,
            ncf = ncf,
            tipoComprobante = tipoComprobanteActual?.nombre?.takeIf { it.isNotBlank() } ?: "Comprobante Consumidor Final",
            fecha = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date()),
            clienteNombre = clienteSeleccionado?.nombreCompleto,
            clienteDocumento = clienteSeleccionado?.numeroDocumento,
            vendedorNombre = RepositorioOffline.cargarSesion(context)?.usuario?.optString("nombre", "")
                ?.takeIf { it.isNotBlank() && it != "null" } ?: "Admin",
            metodoPago = metodos.first { it.valor == metodoPago }.let { m -> Traducciones.texto(m.claveEtiqueta, idioma) },
            lineas = carrito.map { item ->
                LineaTicket(
                    nombre = item.nombre,
                    cantidad = item.cantidad.toDouble(),
                    precio = item.precio,
                    total = item.precio * item.cantidad * (if (item.aplicaItbis) 1 + impuesto / 100 else 1.0)
                )
            } + extras.map { extra ->
                LineaTicket(
                    nombre = extra.nombre,
                    cantidad = extra.cantidad,
                    precio = extra.precioUnitario,
                    total = extra.precioUnitario * extra.cantidad * (if (extra.aplicaItbis) 1 + impuesto / 100 else 1.0),
                    esExtra = true
                )
            },
            subtotal = subtotal,
            itbis = itbis,
            descuento = descuento,
            total = total,
            efectivoRecibido = (efectivoRecibido.toDoubleOrNull() ?: total),
            cambio = if (cambio < 0) 0.0 else cambio
        )

        carrito = emptyList()
        extras = emptyList()
        efectivoRecibido = ""
        descuentoGlobal = ""
        clienteSeleccionado = null
        busquedaCliente = ""
        onImprimir(ticket)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 24.dp)
        ) {
        // ── Barra de herramientas (.barraHerramientas) ──
        item { BarraHerramientas(idioma, t, onVentaRapida) }
        // ── Bloque cliente (.bloqueCliente) ──
        item {
            BloqueCliente(
                idioma = idioma,
                busquedaCliente = busquedaCliente,
                onBusquedaCliente = { busquedaCliente = it },
                clienteSeleccionado = clienteSeleccionado,
                onQuitarCliente = {
                    clienteSeleccionado = null
                    busquedaCliente = ""
                },
                onClienteRapido = { mostrarModalCliente = true },
                clientesFiltrados = clientesFiltrados,
                mostrarDropdownClientes = mostrarDropdownClientes,
                onSeleccionarCliente = ::seleccionarCliente,
                t = t
            )
        }

        // ── Sección productos (.seccionProductos) ──
        item {
            SeccionProductos(
                idioma = idioma,
                carrito = carrito,
                extras = extras,
                busqueda = busquedaProducto,
                onBusqueda = { busquedaProducto = it },
                onAgregarExtra = { mostrarModalExtra = true },
                onEliminarExtra = { extraId ->
                    extras = extras.filter { it.id != extraId }
                },
                productosFiltrados = productosFiltrados,
                mostrarDropdownProductos = mostrarDropdownProductos,
                onAgregarProducto = ::agregarProducto,
                t = t
            )
        }

        // ── Barra forma de pago (.barraFormaPago) ──
        item {
            FormaPago(
                idioma = idioma,
                oscuro = oscuro,
                metodos = metodos,
                metodoPago = metodoPago,
                onSeleccionar = { metodoPago = it },
                t = t
            )
        }

        // ── Bloque comprobante (.bloqueComprobante) ──
        item {
            BloqueComprobante(
                idioma = idioma,
                t = t,
                tipos = tiposComprobante,
                seleccionadoId = tipoComprobanteId,
                onSeleccionar = { tipoComprobanteId = it }
            )
        }

        // ── Panel de cobro (.panelCobro) ──
        item {
            PanelCobro(
                idioma = idioma,
                oscuro = oscuro,
                metodoPago = metodoPago,
                efectivoRecibido = efectivoRecibido,
                onEfectivoRecibido = { efectivoRecibido = it },
                descuentoGlobal = descuentoGlobal,
                onDescuentoGlobal = { descuentoGlobal = it },
                subtotal = subtotal,
                itbis = itbis,
                total = total,
                cambio = cambio,
                onProcesar = { procesarVenta() },
                t = t
            )
        }
        }

        // ── Modal Cliente Rápido (overlay fuera de la lista) ──
        if (mostrarModalCliente) {
            ModalClienteRapido(
                idioma = idioma,
                oscuro = oscuro,
                onCerrar = { mostrarModalCliente = false },
                onCrear = { nombre ->
                    clienteSeleccionado = ClienteVenta(
                        id = 9999,
                        nombreCompleto = nombre,
                        conCredito = false
                    )
                    busquedaCliente = ""
                    mostrarModalCliente = false
                },
                t = t
            )
        }

        // ── Modal Agregar Extra (overlay fuera de la lista) ──
        if (mostrarModalExtra) {
            ModalAgregarExtra(
                idioma = idioma,
                oscuro = oscuro,
                nombre = formExtraNombre,
                onNombre = { formExtraNombre = it },
                tipo = formExtraTipo,
                onTipo = { formExtraTipo = it },
                cantidad = formExtraCantidad,
                onCantidad = { formExtraCantidad = it },
                precio = formExtraPrecio,
                onPrecio = { formExtraPrecio = it },
                aplicaItbis = formExtraItbis,
                onAplicaItbis = { formExtraItbis = it },
                notas = formExtraNotas,
                onNotas = { formExtraNotas = it },
                onCerrar = { mostrarModalExtra = false },
                onAgregar = { extra ->
                    extras = listOf(extra) + extras
                    formExtraNombre = ""
                    formExtraPrecio = ""
                    formExtraNotas = ""
                    mostrarModalExtra = false
                },
                t = t
            )
        }
    }
}

// ─────────────────────── MÉTODOS DE PAGO ───────────────────────

private fun metodosPago(oscuro: Boolean): List<MetodoPagoInfo> = listOf(
    MetodoPagoInfo("efectivo", "metodo.efectivo", Icons.Outlined.Payments, Color(0xFF22C55E), Color(0xFF22C55E).copy(alpha = if (oscuro) 0.15f else 0.12f), Color(0xFF16A34A), Color(0xFF4ADE80)),
    MetodoPagoInfo("tarjeta_debito", "metodo.debito", Icons.Outlined.CreditCard, Color(0xFF3B82F6), Color(0xFF3B82F6).copy(alpha = if (oscuro) 0.15f else 0.12f), Color(0xFF2563EB), Color(0xFF60A5FA)),
    MetodoPagoInfo("tarjeta_credito", "metodo.tCredito", Icons.Outlined.CardGiftcard, Color(0xFF9333EA), Color(0xFF9333EA).copy(alpha = if (oscuro) 0.15f else 0.12f), Color(0xFF7C3AED), Color(0xFFA855F7)),
    MetodoPagoInfo("transferencia", "metodo.transferencia", Icons.Outlined.SwapHoriz, Color(0xFFF59E0B), Color(0xFFF59E0B).copy(alpha = if (oscuro) 0.15f else 0.12f), Color(0xFFD97706), Color(0xFFFBBF24)),
    MetodoPagoInfo("cheque", "metodo.cheque", Icons.Outlined.Receipt, Color(0xFF64748B), Color(0xFF64748B).copy(alpha = if (oscuro) 0.15f else 0.12f), Color(0xFF475569), Color(0xFF94A3B8)),
    MetodoPagoInfo("credito", "metodo.credito", Icons.Outlined.Schedule, Color(0xFFEC4899), Color(0xFFEC4899).copy(alpha = if (oscuro) 0.15f else 0.12f), Color(0xFFDB2777), Color(0xFFF472B6)),
    MetodoPagoInfo("financiamiento", "metodo.financiamiento", Icons.Outlined.AccountBalanceWallet, Color(0xFF0EA5E9), Color(0xFF0EA5E9).copy(alpha = if (oscuro) 0.15f else 0.12f), Color(0xFF0284C7), Color(0xFF7DD3FC)),
    MetodoPagoInfo("mixto", "metodo.mixto", Icons.AutoMirrored.Outlined.MergeType, Color(0xFF6366F1), Color(0xFF6366F1).copy(alpha = if (oscuro) 0.15f else 0.12f), Color(0xFF4F46E5), Color(0xFFA5B4FC))
)

// ─────────────────────── BARRA DE HERRAMIENTAS ───────────────────────

@Composable
private fun BarraHerramientas(
    idioma: Idioma,
    t: TokensWeb,
    onVentaRapida: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoElevado)
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = Traducciones.texto("vender.titulo", idioma),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = t.textoPrimario,
                modifier = Modifier.weight(1f)
            )

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                // Venta rápida (.btnBarraRapida)
                Row(
                    modifier = Modifier
                        .background(Color(0xFF059669).copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                        .border(1.dp, Color(0xFF059669), RoundedCornerShape(8.dp))
                        .clickable { onVentaRapida() }
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Bolt, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(Traducciones.texto("vender.ventaRapida", idioma), color = Color(0xFF059669), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
                // Salir (.btnBarra)
                Row(
                    modifier = Modifier
                        .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                        .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                        .clickable { }
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.AutoMirrored.Outlined.ExitToApp, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(Traducciones.texto("header.salir", idioma), color = t.textoSecundario, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            MetaChip("12/08/2026", Icons.Outlined.Event, t)
            MetaChip("05:05:35 a. m.", null, t)
            MetaChip("Caja 01", Icons.Outlined.Payments, t)
        }
    }
}

@Composable
private fun MetaChip(texto: String, icono: ImageVector?, t: TokensWeb) {
    Row(
        modifier = Modifier
            .background(t.fondoPrincipal, RoundedCornerShape(6.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (icono != null) {
            Icon(icono, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(13.dp))
            Spacer(Modifier.width(4.dp))
        }
        Text(texto, color = t.textoSecundario, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}

// ─────────────────────── BLOQUE CLIENTE ───────────────────────

@Composable
private fun BloqueCliente(
    idioma: Idioma,
    busquedaCliente: String,
    onBusquedaCliente: (String) -> Unit,
    clienteSeleccionado: ClienteVenta?,
    onQuitarCliente: () -> Unit,
    onClienteRapido: () -> Unit,
    clientesFiltrados: List<ClienteVentaOffline>,
    mostrarDropdownClientes: Boolean,
    onSeleccionarCliente: (ClienteVentaOffline) -> Unit,
    t: TokensWeb
) {
    TarjetaWeb(
        tokens = t,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 6.dp)
            .padding(4.dp)
    ) {
        Column(modifier = Modifier.padding(horizontal = 4.dp, vertical = 6.dp)) {
            Text(
                text = Traducciones.texto("vender.cliente", idioma).uppercase(),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = t.textoTerciario,
                modifier = Modifier.padding(bottom = 6.dp)
            )

            // Fila: campo + botones (.filaClienteBusqueda)
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                CampoWeb(
                    valor = busquedaCliente,
                    onValor = onBusquedaCliente,
                    tokens = t,
                    placeholder = Traducciones.texto("vender.buscarCliente", idioma),
                    icono = Icons.Outlined.Search,
                    alto = 36,
                    modifier = Modifier.weight(1f)
                )
                // Botón quitar cliente (si hay seleccionado)
                if (clienteSeleccionado != null) {
                    BotonIcono(
                        icono = Icons.Outlined.Close,
                        color = Color(0xFFEF4444),
                        descripcion = Traducciones.texto("vender.quitarCliente", idioma),
                        t = t,
                        onClick = onQuitarCliente
                    )
                }
                // Botón cliente rápido (.btnIcono)
                BotonIcono(
                    icono = Icons.Outlined.PersonAdd,
                    color = t.primario,
                    descripcion = Traducciones.texto("vender.clienteRapido", idioma),
                    t = t,
                    onClick = onClienteRapido
                )
            }

            // Dropdown de clientes del JSON offline (.dropdownClientes)
            if (mostrarDropdownClientes && clientesFiltrados.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp)
                        .background(t.fondoElevado, RoundedCornerShape(8.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(8.dp))
                ) {
                    clientesFiltrados.forEach { cl ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSeleccionarCliente(cl) }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(cl.nombreCompleto, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(
                                    if (cl.documento.isNotBlank()) "Cédula: ${cl.documento}" else Traducciones.texto("vender.consumidorFinal", idioma),
                                    color = t.textoTerciario, fontSize = 11.sp
                                )
                            }
                        }
                        Box(Modifier.fillMaxWidth().height(1.dp).background(t.bordeClaro))
                    }
                }
            }

            // Meta (.clienteMeta / .clienteMetaContado)
            if (clienteSeleccionado != null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = clienteSeleccionado.nombreCompleto,
                        fontSize = 12.sp,
                        color = t.textoSecundario,
                        modifier = Modifier.weight(1f)
                    )
                    // Badge "Con crédito" (.badgeCredito)
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFEC4899).copy(alpha = 0.12f), RoundedCornerShape(50))
                            .border(1.dp, Color(0xFFEC4899), RoundedCornerShape(50))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = Traducciones.texto("vender.conCredito", idioma),
                            color = if (oscuro() ) Color(0xFFF472B6) else Color(0xFFDB2777),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            } else {
                Text(
                    text = Traducciones.texto("vender.sinCliente", idioma),
                    fontSize = 12.sp,
                    color = t.textoSecundario,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }
}

@Composable
private fun oscuro(): Boolean = androidx.compose.foundation.isSystemInDarkTheme()

/** Botón cuadrado estilo .btnIcono (2rem, borde --border-medium) */
@Composable
private fun BotonIcono(
    icono: ImageVector,
    color: Color,
    descripcion: String,
    t: TokensWeb,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icono, contentDescription = descripcion, tint = color, modifier = Modifier.size(16.dp))
    }
}

/** Modal Cliente Rápido (.modalOverlay + .modal de nueva.js) */
@Composable
private fun ModalClienteRapido(
    idioma: Idioma,
    oscuro: Boolean,
    onCerrar: () -> Unit,
    onCrear: (String) -> Unit,
    t: TokensWeb
) {
    var nombre by remember { mutableStateOf("") }

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCerrar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = true)
    ) {
        // Overlay oscuro (.modalOverlay)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000))
                .clickable(onClick = onCerrar),
            contentAlignment = Alignment.Center
        ) {
            // Tarjeta modal (.modal)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                    .clickable(enabled = false) { }
            ) {
                // Header (.modalHeader)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoContenido)
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = Traducciones.texto("vender.clienteRapidoTitulo", idioma),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = t.textoPrimario,
                        modifier = Modifier.weight(1f)
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable(onClick = onCerrar)
                            .padding(6.dp)
                    ) {
                        Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
                    }
                }

                // Body (.modalBody)
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = Traducciones.texto("vender.clienteRapidoInfo", idioma),
                        fontSize = 13.sp,
                        color = t.textoSecundario,
                        modifier = Modifier.padding(bottom = 14.dp)
                    )

                    // Nombre del Cliente (.grupoInput)
                    Text(
                        text = Traducciones.texto("vender.nombreCliente", idioma),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = t.textoSecundario,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                    CampoWeb(
                        valor = nombre,
                        onValor = { nombre = it },
                        tokens = t,
                        placeholder = Traducciones.texto("vender.nombreEjemplo", idioma),
                        alto = 40
                    )
                }

                // Footer (.modalFooter)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Cancelar (.btnCancelarModal)
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.fondoTerciario, RoundedCornerShape(10.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = Traducciones.texto("vender.cancelar", idioma),
                            color = t.textoPrimario,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    // Crear (.btnGuardarModal)
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(if (nombre.isBlank()) t.exito.copy(alpha = 0.5f) else t.exito, RoundedCornerShape(10.dp))
                            .clickable(enabled = nombre.isNotBlank()) { onCrear(nombre.trim()) }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = Traducciones.texto("vender.crearCliente", idioma),
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

/** Dropdown de tipo de extra (.selectExtra con <option>) */
@Composable
private fun SelectTipoExtra(
    tipo: String,
    onTipo: (String) -> Unit,
    idioma: Idioma,
    t: TokensWeb
) {
    var expandido by remember { mutableStateOf(false) }

    val opciones = listOf("ingrediente", "delivery", "propina", "otro")
    val etiquetaActual = when (tipo) {
        "ingrediente" -> Traducciones.texto("vender.tipoIngrediente", idioma)
        "delivery" -> Traducciones.texto("vender.tipoDelivery", idioma)
        "propina" -> Traducciones.texto("vender.tipoPropina", idioma)
        else -> Traducciones.texto("vender.tipoOtro", idioma)
    }

    Box(modifier = Modifier.fillMaxWidth()) {
        // Campo select (.selectExtra)
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
                text = etiquetaActual,
                color = t.textoPrimario,
                fontSize = 14.sp,
                modifier = Modifier.weight(1f)
            )
            Icon(
                imageVector = Icons.Outlined.KeyboardArrowDown,
                contentDescription = null,
                tint = t.textoSecundario,
                modifier = Modifier.size(18.dp)
            )
        }

        // Menú desplegable con las options (.selectExtra > option)
        androidx.compose.material3.DropdownMenu(
            expanded = expandido,
            onDismissRequest = { expandido = false },
            containerColor = t.fondoElevado
        ) {
            opciones.forEach { valor ->
                val etiqueta = when (valor) {
                    "ingrediente" -> Traducciones.texto("vender.tipoIngrediente", idioma)
                    "delivery" -> Traducciones.texto("vender.tipoDelivery", idioma)
                    "propina" -> Traducciones.texto("vender.tipoPropina", idioma)
                    else -> Traducciones.texto("vender.tipoOtro", idioma)
                }
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(etiqueta, color = t.textoPrimario, fontSize = 14.sp) },
                    onClick = {
                        onTipo(valor)
                        expandido = false
                    }
                )
            }
        }
    }
}

/** Modal Agregar Producto Extra (.modalExtra de nueva.js) */
@Composable
private fun ModalAgregarExtra(
    idioma: Idioma,
    oscuro: Boolean,
    nombre: String,
    onNombre: (String) -> Unit,
    tipo: String,
    onTipo: (String) -> Unit,
    cantidad: String,
    onCantidad: (String) -> Unit,
    precio: String,
    onPrecio: (String) -> Unit,
    aplicaItbis: Boolean,
    onAplicaItbis: (Boolean) -> Unit,
    notas: String,
    onNotas: (String) -> Unit,
    onCerrar: () -> Unit,
    onAgregar: (ItemExtra) -> Unit,
    t: TokensWeb
) {
    val precioNum = precio.toDoubleOrNull() ?: 0.0
    val cantNum = cantidad.toDoubleOrNull() ?: 1.0
    val base = precioNum * cantNum
    val imp = tasaItbis()
    val impuesto = if (aplicaItbis) base * imp / 100 else 0.0
    val totalExtra = base + impuesto
    val valido = nombre.isNotBlank() && precioNum > 0

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCerrar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = true)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000))
                .clickable(onClick = onCerrar),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 640.dp)
                    .padding(20.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                    .clickable(enabled = false) { }
            ) {
                // Header (.modalHeader)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoContenido)
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = Traducciones.texto("vender.extraTitulo", idioma),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = t.textoPrimario,
                        modifier = Modifier.weight(1f)
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable(onClick = onCerrar)
                            .padding(6.dp)
                    ) {
                        Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
                    }
                }

                // Body (.formularioExtra)
                Column(
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .verticalScroll(rememberScrollState())
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Nombre del extra
                    Text(
                        text = Traducciones.texto("vender.extraNombre", idioma) + " *",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = t.textoSecundario
                    )
                    CampoWeb(
                        valor = nombre,
                        onValor = onNombre,
                        tokens = t,
                        placeholder = Traducciones.texto("vender.extraNombrePlaceholder", idioma),
                        alto = 40
                    )

                    // Tipo
                    Text(
                        text = Traducciones.texto("vender.extraTipo", idioma),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = t.textoSecundario
                    )
                    // Select de tipo (.selectExtra - dropdown con options)
                    SelectTipoExtra(
                        tipo = tipo,
                        onTipo = onTipo,
                        idioma = idioma,
                        t = t
                    )

                    // Cantidad + Precio
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = Traducciones.texto("vender.extraCantidad", idioma) + " *",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = t.textoSecundario,
                                modifier = Modifier.padding(bottom = 6.dp)
                            )
                            CampoWeb(
                                valor = cantidad,
                                onValor = onCantidad,
                                tokens = t,
                                placeholder = "1",
                                alto = 40,
                                tipoTexto = androidx.compose.ui.text.input.KeyboardType.Decimal
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = Traducciones.texto("vender.extraPrecioUnitario", idioma) + " *",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = t.textoSecundario,
                                modifier = Modifier.padding(bottom = 6.dp)
                            )
                            CampoMoneda(
                                valor = precio,
                                onValor = onPrecio,
                                tokens = t
                            )
                        }
                    }

                    // Checkbox aplica ITBIS
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onAplicaItbis(!aplicaItbis) }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .background(
                                    if (aplicaItbis) t.primario else t.fondoContenido,
                                    RoundedCornerShape(4.dp)
                                )
                                .border(1.dp, if (aplicaItbis) t.primario else t.bordeMedio, RoundedCornerShape(4.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (aplicaItbis) {
                                Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                            }
                        }
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = Traducciones.texto("vender.extraAplicaItbis", idioma) + " ${imp.toInt()}% " + Traducciones.texto("vender.extraDeImpuesto", idioma),
                            fontSize = 13.sp,
                            color = t.textoSecundario
                        )
                    }

                    // Resumen del extra
                    if (precioNum > 0) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(t.fondoContenido, RoundedCornerShape(8.dp))
                                .padding(10.dp)
                        ) {
                            FilaExtraResumen(
                                Traducciones.texto("vender.extraSubtotal", idioma),
                                "${RepositorioOffline.simboloMoneda()} %.2f".format(base),
                                t
                            )
                            if (aplicaItbis) {
                                FilaExtraResumen(
                                    Traducciones.texto("vender.extraImpuesto", idioma) + " (${imp.toInt()}%)",
                                    "${RepositorioOffline.simboloMoneda()} %.2f".format(impuesto),
                                    t
                                )
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = Traducciones.texto("vender.extraTotal", idioma),
                                    color = t.textoPrimario,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = "${RepositorioOffline.simboloMoneda()} %.2f".format(totalExtra),
                                    color = t.primario,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    // Notas
                    Text(
                        text = Traducciones.texto("vender.extraNotas", idioma),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = t.textoSecundario
                    )
                    var notasEnfocado by remember { mutableStateOf(false) }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 72.dp)
                            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                            .border(
                                if (notasEnfocado) 2.dp else 1.dp,
                                if (notasEnfocado) t.primario else t.bordeMedio,
                                RoundedCornerShape(8.dp)
                            )
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        androidx.compose.foundation.text.BasicTextField(
                            value = notas,
                            onValueChange = onNotas,
                            textStyle = androidx.compose.ui.text.TextStyle(color = t.textoPrimario, fontSize = 14.sp),
                            cursorBrush = androidx.compose.ui.graphics.SolidColor(t.primario),
                            modifier = Modifier.fillMaxWidth()
                        )
                        if (notas.isEmpty()) {
                            Text(
                                text = Traducciones.texto("vender.extraNotasPlaceholder", idioma),
                                color = t.textoTerciario,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                // Footer (.accionesExtra)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.fondoTerciario, RoundedCornerShape(10.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = Traducciones.texto("vender.extraCancelar", idioma),
                            color = t.textoPrimario,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(if (valido) t.exito else t.fondoTerciario, RoundedCornerShape(10.dp))
                            .clickable(enabled = valido) {
                                onAgregar(
                                    ItemExtra(
                                        id = System.currentTimeMillis(),
                                        nombre = nombre.trim(),
                                        tipo = tipo,
                                        cantidad = cantNum,
                                        precioUnitario = precioNum,
                                        aplicaItbis = aplicaItbis,
                                        notas = notas.trim().ifBlank { null }
                                    )
                                )
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = Traducciones.texto("vender.extraAgregar", idioma),
                            color = if (valido) Color.White else t.textoTerciario,
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
private fun FilaExtraResumen(etiqueta: String, valor: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(etiqueta, color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.weight(1f))
        Text(valor, color = t.textoPrimario, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

// ─────────────────────── SECCIÓN PRODUCTOS ───────────────────────

@Composable
private fun SeccionProductos(
    idioma: Idioma,
    carrito: List<ItemVenta>,
    extras: List<ItemExtra>,
    busqueda: String,
    onBusqueda: (String) -> Unit,
    onAgregarExtra: () -> Unit,
    onEliminarExtra: (Long) -> Unit,
    productosFiltrados: List<ProductoOffline>,
    mostrarDropdownProductos: Boolean,
    onAgregarProducto: (ProductoOffline) -> Unit,
    t: TokensWeb
) {
    TarjetaWeb(
        tokens = t,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 6.dp)
    ) {
        Column {
            // Cabecera (.seccionProductosCabecera)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(t.fondoTerciario)
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Receipt, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text(
                    text = Traducciones.texto("vender.productos", idioma),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario,
                    modifier = Modifier.weight(1f)
                )
                Text("${carrito.size + extras.size} en la venta", fontSize = 12.sp, color = t.textoSecundario)
            }

            // Búsqueda de producto (.seccionProductosBusqueda)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(t.fondoContenido)
                    .padding(horizontal = 10.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CampoWeb(
                    valor = busqueda,
                    onValor = onBusqueda,
                    tokens = t,
                    placeholder = Traducciones.texto("vender.agregarProducto", idioma),
                    icono = Icons.Outlined.Search,
                    alto = 36,
                    modifier = Modifier.weight(1f)
                )
                Spacer(Modifier.width(8.dp))
                BotonAgregarExtra(
                    texto = Traducciones.texto("vender.agregarExtra", idioma),
                    icono = Icons.Outlined.AddCircle,
                    tokens = t,
                    colorAmbar = Color(0xFFF59E0B),
                    colorAmbarFondo = Color(0xFFF59E0B).copy(alpha = 0.15f),
                    onClick = onAgregarExtra
                )
            }

            // Dropdown de productos del JSON offline (.dropdownProductos)
            if (mostrarDropdownProductos && productosFiltrados.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp)
                        .background(t.fondoElevado, RoundedCornerShape(8.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(8.dp))
                ) {
                    productosFiltrados.forEach { prod ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onAgregarProducto(prod) }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(prod.nombre, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(
                                    "${prod.sku.ifBlank { prod.codigoBarras.ifBlank { prod.id.toString() } }} · ${Traducciones.texto("productos.stock", idioma)} ${prod.stock.toInt()}",
                                    color = t.textoTerciario, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis
                                )
                            }
                            Text(
                                "${RepositorioOffline.simboloMoneda()} %.2f".format(prod.precioVenta),
                                color = t.primario, fontSize = 13.sp, fontWeight = FontWeight.Bold
                            )
                        }
                        Box(Modifier.fillMaxWidth().height(1.dp).background(t.bordeClaro))
                    }
                }
            }

            // Cabecera de tabla (.tablaPos thead)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CeldaTabla("ITBIS", Modifier.width(46.dp), t.textoTerciario)
                CeldaTabla(Traducciones.texto("vender.codigo", idioma), Modifier.width(44.dp), t.textoTerciario)
                CeldaTabla(Traducciones.texto("vender.cant", idioma), Modifier.width(36.dp), t.textoTerciario, TextAlign.Center)
                CeldaTabla(Traducciones.texto("vender.descripcion", idioma), Modifier.weight(1f), t.textoTerciario)
                CeldaTabla(Traducciones.texto("vender.precio", idioma), Modifier.width(46.dp), t.textoTerciario, TextAlign.End)
                CeldaTabla(Traducciones.texto("vender.importe", idioma), Modifier.width(48.dp), t.textoTerciario, TextAlign.End)
                CeldaTabla(Traducciones.texto("vender.total", idioma), Modifier.width(48.dp), t.textoTerciario, TextAlign.End)
            }

            // Filas o vacío
            // Lista unificada: productos + extras, el más reciente arriba
            val lineasVenta = (
                    carrito.map { LineaVenta(true, it, null, it.orden) } +
                            extras.map { LineaVenta(false, null, it, it.orden) }
                    ).sortedByDescending { it.orden }

            if (lineasVenta.isEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Outlined.Add, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(28.dp))
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = Traducciones.texto("vender.vacio", idioma),
                        color = t.textoTerciario,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
            } else {
                lineasVenta.forEach { linea ->
                    if (linea.esProducto) {
                        linea.itemVenta?.let { FilaCarrito(it, t) }
                    } else {
                        linea.itemExtra?.let { extra ->
                            FilaExtra(extra, t, idioma) { onEliminarExtra(extra.id) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FilaExtra(
    extra: ItemExtra,
    t: TokensWeb,
    idioma: Idioma,
    onEliminar: () -> Unit
) {
    val base = extra.precioUnitario * extra.cantidad
    val itbisLinea = if (extra.aplicaItbis) base * tasaItbis() / 100 else 0.0
    val totalLinea = base + itbisLinea

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoContenido)
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // ITBIS
        Box(modifier = Modifier.width(46.dp), contentAlignment = Alignment.CenterStart) {
            Icon(
                imageVector = if (extra.aplicaItbis) Icons.Outlined.CheckCircle else Icons.Outlined.Add,
                contentDescription = null,
                tint = if (extra.aplicaItbis) Color(0xFF10B981) else t.textoTerciario,
                modifier = Modifier.size(15.dp)
            )
        }
        Text("EXTRA", modifier = Modifier.width(44.dp), color = t.primario, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Text(
            text = if (extra.cantidad == extra.cantidad.toLong().toDouble()) "${extra.cantidad.toInt()}" else "%.2f".format(extra.cantidad),
            modifier = Modifier.width(36.dp),
            color = t.textoPrimario,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Text(extra.nombre, modifier = Modifier.weight(1f), color = t.textoPrimario, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text("${RepositorioOffline.simboloMoneda()} %.2f".format(extra.precioUnitario), modifier = Modifier.width(46.dp), color = t.textoSecundario, fontSize = 10.sp, textAlign = TextAlign.End, maxLines = 1)
        Text("${RepositorioOffline.simboloMoneda()} %.2f".format(base), modifier = Modifier.width(48.dp), color = t.textoPrimario, fontSize = 10.sp, textAlign = TextAlign.End, maxLines = 1)
        Text("${RepositorioOffline.simboloMoneda()} %.2f".format(totalLinea), modifier = Modifier.width(48.dp), color = t.textoPrimario, fontSize = 10.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, maxLines = 1)
        Spacer(Modifier.width(4.dp))
        Box(
            modifier = Modifier
                .size(24.dp)
                .clickable(onClick = onEliminar),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Outlined.Close, contentDescription = Traducciones.texto("vender.quitarCliente", idioma), tint = t.textoTerciario, modifier = Modifier.size(14.dp))
        }
    }
}

@Composable
private fun CeldaTabla(
    texto: String,
    modifier: Modifier,
    color: Color,
    textAlign: TextAlign = TextAlign.Start
) {
    Text(
        text = texto,
        modifier = modifier,
        color = color,
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold,
        textAlign = textAlign,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
}

@Composable
private fun FilaCarrito(item: ItemVenta, t: TokensWeb) {
    val imp = tasaItbis()
    val totalLinea = item.precio * item.cantidad * (if (item.aplicaItbis) 1 + imp / 100 else 1.0)
    val importe = item.precio * item.cantidad

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // ITBIS toggle
        Box(modifier = Modifier.width(46.dp), contentAlignment = Alignment.CenterStart) {
            Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(15.dp))
        }
        Text(item.codigo, modifier = Modifier.width(44.dp), color = t.textoSecundario, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text("${item.cantidad}", modifier = Modifier.width(36.dp), color = t.textoPrimario, fontSize = 12.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
        Text(item.nombre, modifier = Modifier.weight(1f), color = t.textoPrimario, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text("${RepositorioOffline.simboloMoneda()} %.2f".format(item.precio), modifier = Modifier.width(46.dp), color = t.textoSecundario, fontSize = 10.sp, textAlign = TextAlign.End, maxLines = 1)
        Text("${RepositorioOffline.simboloMoneda()} %.2f".format(importe), modifier = Modifier.width(48.dp), color = t.textoPrimario, fontSize = 10.sp, textAlign = TextAlign.End, maxLines = 1)
        Text("${RepositorioOffline.simboloMoneda()} %.2f".format(totalLinea), modifier = Modifier.width(48.dp), color = t.textoPrimario, fontSize = 10.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, maxLines = 1)
    }
}

// ─────────────────────── FORMA DE PAGO ───────────────────────

@Composable
private fun FormaPago(
    idioma: Idioma,
    oscuro: Boolean,
    metodos: List<MetodoPagoInfo>,
    metodoPago: String,
    onSeleccionar: (String) -> Unit,
    t: TokensWeb
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 6.dp)
            .background(t.fondoElevado, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        Text(
            text = Traducciones.texto("vender.formaPago", idioma).uppercase(),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = t.textoTerciario,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        // Grid 4 columnas (.metodosPagoFila móvil: repeat(4, 1fr))
        metodos.chunked(4).forEach { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                fila.forEach { m ->
                    BotonMetodoPago(
                        icono = m.icono,
                        etiqueta = Traducciones.texto(m.claveEtiqueta, idioma),
                        colorMetodoBorde = m.colorBorde,
                        colorMetodoFondo = m.colorFondo,
                        colorMetodoTexto = if (oscuro) m.colorTextoOscuro else m.colorTextoClaro,
                        seleccionado = metodoPago == m.valor,
                        onClick = { onSeleccionar(m.valor) },
                        modifier = Modifier.weight(1f)
                    )
                }
                repeat(4 - fila.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}

// ─────────────────────── BLOQUE COMPROBANTE ───────────────────────

@Composable
private fun BloqueComprobante(
    idioma: Idioma,
    t: TokensWeb,
    tipos: List<TipoComprobanteOffline>,
    seleccionadoId: Int,
    onSeleccionar: (Int) -> Unit
) {
    TarjetaWeb(
        tokens = t,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 6.dp)
            .padding(4.dp)
    ) {
        Column(modifier = Modifier.padding(horizontal = 4.dp, vertical = 8.dp)) {
            Text(
                text = Traducciones.texto("vender.comprobante", idioma).uppercase(),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = t.textoTerciario,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Text(
                text = Traducciones.texto("vender.tipo", idioma),
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = t.textoSecundario,
                modifier = Modifier.padding(bottom = 6.dp)
            )
            SelectComprobante(
                tipos = tipos,
                seleccionadoId = seleccionadoId,
                onSeleccionar = onSeleccionar,
                t = t
            )
        }
    }
}

/** Selector de tipo de comprobante (.campoSelect con <option> de la web). */
@Composable
private fun SelectComprobante(
    tipos: List<TipoComprobanteOffline>,
    seleccionadoId: Int,
    onSeleccionar: (Int) -> Unit,
    t: TokensWeb
) {
    var expandido by remember { mutableStateOf(false) }
    val actual = tipos.firstOrNull { it.id == seleccionadoId }

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
                text = if (actual != null) etiquetaComprobante(actual) else "—",
                color = t.textoPrimario,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Icon(
                imageVector = Icons.Outlined.KeyboardArrowDown,
                contentDescription = null,
                tint = t.textoSecundario,
                modifier = Modifier.size(18.dp)
            )
        }

        androidx.compose.material3.DropdownMenu(
            expanded = expandido,
            onDismissRequest = { expandido = false },
            containerColor = t.fondoElevado
        ) {
            tipos.forEach { tipo ->
                androidx.compose.material3.DropdownMenuItem(
                    text = {
                        Text(
                            text = etiquetaComprobante(tipo),
                            color = t.textoPrimario,
                            fontSize = 13.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    },
                    onClick = {
                        onSeleccionar(tipo.id)
                        expandido = false
                    }
                )
            }
        }
    }
}

// ─────────────────────── PANEL DE COBRO ───────────────────────

@Composable
private fun PanelCobro(
    idioma: Idioma,
    oscuro: Boolean,
    metodoPago: String,
    efectivoRecibido: String,
    onEfectivoRecibido: (String) -> Unit,
    descuentoGlobal: String,
    onDescuentoGlobal: (String) -> Unit,
    subtotal: Double,
    itbis: Double,
    total: Double,
    cambio: Double,
    onProcesar: () -> Unit,
    t: TokensWeb
) {
    TarjetaWeb(
        tokens = t,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 6.dp)
            .padding(6.dp)
    ) {
        Column(modifier = Modifier.padding(horizontal = 6.dp, vertical = 4.dp)) {
            // Título (.tituloResumen)
            Text(
                text = Traducciones.texto("vender.resumenVenta", idioma).uppercase(),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = t.textoPrimario
            )

            Spacer(Modifier.height(10.dp))

            // Efectivo Recibido (.grupoResumen)
            Text(
                text = Traducciones.texto("vender.efectivoRecibido", idioma),
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = t.textoSecundario,
                modifier = Modifier.padding(bottom = 4.dp)
            )
            CampoMoneda(
                valor = efectivoRecibido,
                onValor = onEfectivoRecibido,
                tokens = t
            )

            // Cambio / Falta / Exacto (.cambioResumen)
            if (metodoPago == "efectivo" && efectivoRecibido.isNotBlank()) {
                val (etiqueta, colorCambio) = when {
                    cambio < -0.005 -> Traducciones.texto("vender.falta", idioma) to Color(0xFFEF4444)
                    kotlin.math.abs(cambio) < 0.005 -> Traducciones.texto("vender.exacto", idioma) to Color(0xFFF59E0B)
                    else -> Traducciones.texto("vender.cambio", idioma) to Color(0xFF10B981)
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(etiqueta, color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.weight(1f))
                    Text(
                        text = "${RepositorioOffline.simboloMoneda()} %.2f".format(kotlin.math.abs(cambio)),
                        color = colorCambio,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            // Descuento Global (.grupoResumen)
            Text(
                text = Traducciones.texto("vender.descuentoGlobal", idioma),
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = t.textoSecundario,
                modifier = Modifier.padding(bottom = 4.dp)
            )
            CampoMoneda(
                valor = descuentoGlobal,
                onValor = onDescuentoGlobal,
                tokens = t
            )

            Spacer(Modifier.height(10.dp))

            // Líneas de resumen (.lineaResumen)
            LineaResumen("Subtotal:", "${RepositorioOffline.simboloMoneda()} %.2f".format(subtotal), t)
            LineaResumen("ITBIS:", "${RepositorioOffline.simboloMoneda()} %.2f".format(itbis), t)

            // Separador (.separadorResumen)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
                    .height(1.dp)
                    .background(t.bordeClaro)
            )

            // Total a Pagar (.lineaTotal)
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = Traducciones.texto("vender.totalPagar", idioma),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = "${RepositorioOffline.simboloMoneda()} %.2f".format(total),
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario
                )
            }

            Spacer(Modifier.height(12.dp))

            // Botón Procesar Venta (.btnProcesar)
            BotonProcesar(
                texto = Traducciones.texto("vender.procesarVenta", idioma),
                icono = Icons.Outlined.CheckCircle,
                tokens = t,
                onClick = onProcesar
            )
        }
    }
}

@Composable
private fun LineaResumen(etiqueta: String, valor: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(etiqueta, color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(valor, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}