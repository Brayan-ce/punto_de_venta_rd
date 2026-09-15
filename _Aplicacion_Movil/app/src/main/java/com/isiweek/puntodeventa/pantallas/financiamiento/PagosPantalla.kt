package com.isiweek.puntodeventa.pantallas.financiamiento

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.ArrowDropDown
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Print
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Search
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.AvisoSinBaseDatos
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import java.util.Calendar

private val COLOR_PENDIENTE_BG = Color(0xFFFEF3C7)
private val COLOR_PENDIENTE_FG = Color(0xFF92400E)
private val COLOR_PAGADA_BG = Color(0xFFD1FAE5)
private val COLOR_PAGADA_FG = Color(0xFF065F46)
private val COLOR_VENCIDA_BG = Color(0xFFFEE2E2)
private val COLOR_VENCIDA_FG = Color(0xFF991B1B)
private val COLOR_PARCIAL_BG = Color(0xFFE0F2FE)
private val COLOR_PARCIAL_FG = Color(0xFF075985)
private val VERDE = Color(0xFF10B981)
private val VERDE_OSCURO = Color(0xFF059669)
private val ROJO = Color(0xFFEF4444)

private val MESES_PAGO = listOf("ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic")

private data class CategoriaPago(val id: String, val nombre: String, val color: Color)

private data class CuotaAplicada(val numero: Int, val fechaVencimiento: String, val estado: String, val aplicado: Double)

private data class CuotaPago(
    val numero: Int,
    val fechaVencimiento: String,
    val monto: Double,
    val capital: Double,
    val interes: Double,
    val mora: Double,
    val montoRestante: Double,
    val montoPagado: Double?,
    val estado: String,
    val fechaPago: String?,
    val ultimoPagoId: Int?
) {
    val total: Double get() = if (estado == "pagada") monto else montoRestante + mora
}

private data class PagoRegistrado(
    val id: Int,
    val contratoId: String,
    val numero: String,
    val cliente: String,
    val documento: String,
    val telefono: String,
    val producto: String?,
    val precioProducto: Double?,
    val monto: Double,
    val capital: Double,
    val interes: Double,
    val mora: Double,
    val metodo: String,
    val referencia: String,
    val registradoPor: String,
    val notas: String?,
    val fecha: String,
    val cuotasAplicadas: List<CuotaAplicada>
)

private data class ContratoPago(
    val id: String,
    val numero: String,
    val cliente: String,
    val documento: String,
    val telefono: String,
    val plan: String,
    val categoriaId: String?,
    val producto: String?,
    val precioProducto: Double?,
    val cuotas: List<CuotaPago>,
    val pagos: List<PagoRegistrado>
) {
    val esProducto: Boolean get() = !producto.isNullOrBlank()
    val cuotasVencidas: Int get() = cuotas.count { it.estado == "vencida" }
    val saldoPendiente: Double get() = cuotas.filter { it.estado != "pagada" }.sumOf { it.montoRestante + it.mora }
    val proxima: CuotaPago? get() = cuotas.firstOrNull { it.estado == "pendiente" || it.estado == "vencida" }
    val maxDiasMora: Int get() = cuotas.filter { it.estado == "vencida" }.maxOfOrNull { diasVencPago(it.fechaVencimiento) } ?: 0
    val montoVencido: Double get() = cuotas.filter { it.estado == "vencida" }.sumOf { it.montoRestante + it.mora }
}

private data class ClienteResumen(
    val nombre: String,
    val documento: String,
    val contratos: List<ContratoPago>
) {
    val totalContratos: Int get() = contratos.size
    val totalCuotasVencidas: Int get() = contratos.sumOf { it.cuotasVencidas }
    val totalPendiente: Double get() = contratos.sumOf { it.saldoPendiente }
}

private data class MetodoPagoDemo(val id: Int, val nombre: String, val totalPagos: Int)

private fun fmtM(v: Double): String {
    val s = String.format("%.2f", v)
    val partes = s.split(".")
    val entero = partes[0].reversed().chunked(3).joinToString(",").reversed()
    return RepositorioOffline.simboloMoneda() + entero + "." + (partes.getOrNull(1) ?: "00")
}

private fun fmtNum(v: Double): String {
    val s = String.format("%.2f", v)
    val partes = s.split(".")
    val entero = partes[0].reversed().chunked(3).joinToString(",").reversed()
    return entero + "." + (partes.getOrNull(1) ?: "00")
}

private fun diasVencPago(fecha: String): Int {
    val p = fecha.split(" ")
    if (p.size < 4) return 0
    val d = p[0].toIntOrNull() ?: return 0
    val mi = MESES_PAGO.indexOf(p[1].lowercase())
    if (mi < 0) return 0
    val anio = p[3].toIntOrNull() ?: return 0
    val cal = Calendar.getInstance()
    cal.clear()
    cal.set(anio, mi, d, 0, 0, 0)
    val hoy = Calendar.getInstance()
    hoy.set(Calendar.HOUR_OF_DAY, 0); hoy.set(Calendar.MINUTE, 0); hoy.set(Calendar.SECOND, 0); hoy.set(Calendar.MILLISECOND, 0)
    val diff = ((hoy.timeInMillis - cal.timeInMillis) / 86400000L).toInt()
    return if (diff > 0) diff else 0
}

private fun hoyNumPago(): String {
    val c = Calendar.getInstance()
    val d = c.get(Calendar.DAY_OF_MONTH).toString().padStart(2, '0')
    val m = (c.get(Calendar.MONTH) + 1).toString().padStart(2, '0')
    return "$d/$m/${c.get(Calendar.YEAR)}"
}

private fun estadoEstilo(estado: String): Pair<Color, Color> = when (estado) {
    "pagada" -> Pair(COLOR_PAGADA_BG, COLOR_PAGADA_FG)
    "parcial" -> Pair(COLOR_PARCIAL_BG, COLOR_PARCIAL_FG)
    "vencida" -> Pair(COLOR_VENCIDA_BG, COLOR_VENCIDA_FG)
    else -> Pair(COLOR_PENDIENTE_BG, COLOR_PENDIENTE_FG)
}

private fun estadoLabel(estado: String, idioma: Idioma): String = when (estado) {
    "pagada" -> Traducciones.texto("cuotas.pagada", idioma)
    "parcial" -> Traducciones.texto("cuotas.parcial", idioma)
    "vencida" -> Traducciones.texto("cuotas.vencida", idioma)
    else -> Traducciones.texto("cuotas.pendiente", idioma)
}

private fun labelMetodo(m: String, idioma: Idioma): String = when (m.lowercase()) {
    "abono" -> Traducciones.texto("cuotas.abono", idioma)
    "cheque" -> Traducciones.texto("cuotas.cheque", idioma)
    "efectivo" -> Traducciones.texto("cuotas.efectivo", idioma)
    "tarjeta" -> Traducciones.texto("cuotas.tarjeta", idioma)
    "tranferencia" -> Traducciones.texto("cuotas.tranferencia", idioma)
    else -> Traducciones.texto("cuotas.sinEspecificar", idioma)
}

private fun isoAFechaLegible(iso: String): String {
    val d = iso.trim().take(10).split("-")
    if (d.size < 3) return iso
    val mes = d[1].toIntOrNull() ?: return iso
    if (mes !in 1..12) return iso
    return "${d[2].toIntOrNull() ?: d[2]} ${MESES_PAGO[mes - 1]} de ${d[0]}"
}

private fun generarContratos(): List<ContratoPago> {
    if (!RepositorioOffline.hayDatosOffline()) return emptyList()
    val contratosOff = RepositorioOffline.obtenerContratos()
    val clientesOff = RepositorioOffline.obtenerClientesFin()
    val planesOff = RepositorioOffline.obtenerPlanes()
    val cuotasOff = RepositorioOffline.obtenerCuotas()
    val pagosOff = RepositorioOffline.obtenerPagos()
    val contratosCat = RepositorioOffline.obtenerTabla("fin_contrato_categorias")
    val catPorContrato = mutableMapOf<Int, Int?>()
    for (i in 0 until contratosCat.length()) {
        val o = contratosCat.optJSONObject(i) ?: continue
        catPorContrato[o.optInt("contrato_id")] = o.optInt("categoria_id").takeIf { it > 0 }
    }
    return contratosOff.map { c ->
        val cli = clientesOff.firstOrNull { it.id == c.clienteId }
        val plan = planesOff.firstOrNull { it.id == c.planId }
        val nombreCliente = "${cli?.nombre ?: "Cliente"} ${cli?.apellidos ?: ""}".trim()
        val cuotas = cuotasOff.filter { it.contratoId == c.id }.sortedBy { it.numero }.map { q ->
            val pagado = RepositorioOffline.montoPagadoCuota(q.id)
            val montoPagado = if (q.estado == "pagada" || q.estado == "parcial") pagado else null
            val montoRestante = when (q.estado) {
                "pagada" -> 0.0
                "parcial" -> Math.round((q.monto - pagado) * 100.0) / 100.0
                else -> q.monto
            }
            CuotaPago(
                numero = q.numero,
                fechaVencimiento = isoAFechaLegible(q.fechaVencimiento),
                monto = q.monto,
                capital = q.capital,
                interes = q.interes,
                mora = q.mora,
                montoRestante = montoRestante,
                montoPagado = montoPagado,
                estado = q.estado,
                fechaPago = q.fechaPago.takeIf { it.isNotBlank() }?.let { isoAFechaLegible(it) },
                ultimoPagoId = null
            )
        }
        val pagos = pagosOff.filter { it.contratoId == c.id }.sortedBy { it.id }.map { p ->
            PagoRegistrado(
                id = p.id,
                contratoId = c.id.toString(),
                numero = c.numero,
                cliente = nombreCliente,
                documento = cli?.documento ?: "",
                telefono = cli?.telefono ?: "",
                producto = null,
                precioProducto = null,
                monto = p.monto,
                capital = p.montoCapital,
                interes = p.montoInteres,
                mora = p.montoMora,
                metodo = "efectivo",
                referencia = "",
                registradoPor = "",
                notas = p.notas,
                fecha = isoAFechaLegible(p.fecha),
                cuotasAplicadas = emptyList()
            )
        }
        ContratoPago(
            id = c.id.toString(),
            numero = c.numero,
            cliente = nombreCliente,
            documento = cli?.documento ?: "",
            telefono = cli?.telefono ?: "",
            plan = plan?.nombre ?: "Plan",
            categoriaId = catPorContrato[c.id]?.toString(),
            producto = null,
            precioProducto = null,
            cuotas = cuotas,
            pagos = pagos
        )
    }
}

private fun generarHistorial(): List<PagoRegistrado> =
    generarContratos().flatMap { c -> c.pagos }.sortedByDescending { it.id }

@Composable
fun PagosPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onImprimir: ((DatosReciboPago) -> Unit)? = null
) {
    val t = TokensWeb(
        fondoPrincipal = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoElevado = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoTerciario = if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9),
        fondoContenido = if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC),
        textoPrimario = if (oscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A),
        textoSecundario = if (oscuro) Color(0xFFCBD5E1) else Color(0xFF475569),
        textoTerciario = if (oscuro) Color(0xFF94A3B8) else Color(0xFF94A3B8),
        bordeClaro = if (oscuro) Color(0xFF334155) else Color(0xFFE5E7EB),
        bordeMedio = if (oscuro) Color(0xFF475569) else Color(0xFFD1D5DB),
        primario = VERDE,
        primarioClaro = if (oscuro) Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFD1FAE5),
        exito = VERDE
    )

    val context = LocalContext.current

    var tab by remember { mutableStateOf("contratos") }
    var busqueda by remember { mutableStateOf("") }
    var busquedaPago by remember { mutableStateOf("") }
    var busquedaNegra by remember { mutableStateOf("") }
    var filtroCategoria by remember { mutableStateOf("") }
    var vistaCliente by remember { mutableStateOf(false) }
    var contratoAbierto by remember { mutableStateOf<String?>(null) }
    var clienteExpandido by remember { mutableStateOf<String?>(null) }
    var gruposColapsados by remember { mutableStateOf(setOf<String>()) }
    var mostrarMetodos by remember { mutableStateOf(false) }
    var modalPagoCuota by remember { mutableStateOf<CuotaPago?>(null) }
    var modalPagoContrato by remember { mutableStateOf<ContratoPago?>(null) }
    var modalDetalle by remember { mutableStateOf<PagoRegistrado?>(null) }
    var modalAnular by remember { mutableStateOf<PagoRegistrado?>(null) }

    val contratos = remember(RepositorioOffline.version) { generarContratos() }
    val historial = remember(RepositorioOffline.version) { generarHistorial() }

    val clientes = remember(contratos) {
        contratos.groupBy { it.cliente to it.documento }
            .map { (k, lista) -> ClienteResumen(k.first, k.second, lista.sortedBy { it.numero }) }
            .sortedByDescending { it.totalPendiente }
    }

    val contratosFiltrados = contratos.filter {
        (busqueda.isBlank() ||
            it.cliente.contains(busqueda, ignoreCase = true) ||
            it.documento.contains(busqueda, ignoreCase = true) ||
            it.numero.contains(busqueda, ignoreCase = true)) &&
            (filtroCategoria.isBlank() ||
                it.categoriaId == filtroCategoria ||
                (filtroCategoria == "sin" && it.categoriaId == null))
    }

    val clientesFiltrados = clientes.filter {
        busqueda.isBlank() ||
            it.nombre.contains(busqueda, ignoreCase = true) ||
            it.documento.contains(busqueda, ignoreCase = true) ||
            it.contratos.any { c -> c.numero.contains(busqueda, ignoreCase = true) }
    }

    val pagosFiltrados = historial.filter {
        (busquedaPago.isBlank() ||
            it.cliente.contains(busquedaPago, ignoreCase = true) ||
            it.documento.contains(busquedaPago, ignoreCase = true) ||
            it.numero.contains(busquedaPago, ignoreCase = true) ||
            it.referencia.contains(busquedaPago, ignoreCase = true)) &&
            (busquedaPago.isBlank() || it.cliente.contains(busquedaPago, ignoreCase = true))
    }

    val listaNegra = contratos.filter { it.cuotasVencidas > 0 }.filter {
        busquedaNegra.isBlank() ||
            it.cliente.contains(busquedaNegra, ignoreCase = true) ||
            it.documento.contains(busquedaNegra, ignoreCase = true) ||
            it.numero.contains(busquedaNegra, ignoreCase = true)
    }

    val totalActivos = contratos.size
    val saldoTotal = contratos.sumOf { it.saldoPendiente }
    val cuotasVencidas = contratos.sumOf { it.cuotasVencidas }

    val categorias = if (RepositorioOffline.hayDatosOffline()) {
        RepositorioOffline.obtenerCategoriasFin().map { c ->
            val col = c.color.removePrefix("#").toLongOrNull(16)
            CategoriaPago(c.id.toString(), c.nombre, col?.let { Color(0xFF000000L or it) } ?: Color(0xFF94A3B8))
        }
    } else emptyList()
    val countSin = contratos.count { it.categoriaId == null }

    val grupos = categorias.map { cat ->
        Triple(cat.id, cat.nombre, cat.color)
    }.plus(Triple("sin", Traducciones.texto("pagos.sinCategoria", idioma), Color(0xFF94A3B8)))
        .mapNotNull { (key, nombre, color) ->
            val items = contratosFiltrados.filter { c ->
                when (key) {
                    "sin" -> c.categoriaId == null
                    else -> c.categoriaId == key
                }
            }
            if (items.isEmpty()) null else GrupoPago(key, nombre, color, items)
        }

    if (!RepositorioOffline.hayDatosOffline()) {
        return Box(
            modifier = Modifier
                .fillMaxSize()
                .background(t.fondoContenido),
            contentAlignment = Alignment.Center
        ) {
            AvisoSinBaseDatos(idioma = idioma, tokens = t, oscuro = oscuro)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            item { CabeceraPagos(t, idioma, onMetodos = { mostrarMetodos = true }) }

            item {
                TabsPagos(
                    tab = tab,
                    onTab = { tab = it },
                    badgeContratos = cuotasVencidas,
                    badgeNegra = listaNegra.size,
                    t = t,
                    idioma = idioma
                )
            }

            if (tab == "contratos") {
                item {
                    StatsGridPagos(
                        stats = listOf(
                            StatPago(Traducciones.texto("pagos.estadActivos", idioma), totalActivos.toString(), Icons.Outlined.Description, Color(0xFF3B82F6)),
                            StatPago(Traducciones.texto("pagos.estadSaldo", idioma), fmtM(saldoTotal), Icons.Outlined.Payments, VERDE),
                            StatPago(Traducciones.texto("pagos.estadVencidas", idioma), cuotasVencidas.toString(), Icons.Outlined.Warning, ROJO)
                        ),
                        t = t
                    )
                }

                item {
                    ToolbarContratos(
                        busqueda = busqueda,
                        onBusqueda = { busqueda = it },
                        vistaCliente = vistaCliente,
                        onVista = { vistaCliente = it },
                        filtroCategoria = filtroCategoria,
                        onFiltro = { filtroCategoria = it },
                        categorias = categorias,
                        t = t,
                        idioma = idioma
                    )
                }

                if (!vistaCliente) {
                    item {
                        ChipsCategorias(
                            activa = filtroCategoria,
                            onSelect = { filtroCategoria = it },
                            categorias = categorias,
                            countSin = countSin,
                            t = t,
                            idioma = idioma
                        )
                    }
                }

                if (vistaCliente) {
                    if (clientesFiltrados.isEmpty()) {
                        item { VacioPagos(Icons.Outlined.Person, Traducciones.texto("pagos.sinClientes", idioma), t) }
                    } else {
                        items(clientesFiltrados.size) { i ->
                            val cli = clientesFiltrados[i]
                            val abierto = clienteExpandido == cli.nombre
                            Column(
                                modifier = Modifier
                                    .padding(horizontal = 12.dp, vertical = 5.dp)
                                    .background(
                                        if (cli.totalCuotasVencidas > 0) {
                                            if (oscuro) Color(0xFF1C0F0F) else Color(0xFFFFF7F7)
                                        } else t.fondoPrincipal,
                                        RoundedCornerShape(14.dp)
                                    )
                                    .border(
                                        1.dp,
                                        if (cli.totalCuotasVencidas > 0) {
                                            if (oscuro) Color(0xFF7F1D1D) else Color(0xFFFCA5A5)
                                        } else t.bordeClaro,
                                        RoundedCornerShape(14.dp)
                                    )
                            ) {
                                ClienteHeader(
                                    cli = cli,
                                    abierto = abierto,
                                    onToggle = { clienteExpandido = if (abierto) null else cli.nombre },
                                    t = t,
                                    idioma = idioma
                                )
                                if (abierto) {
                                    Column(Modifier.fillMaxWidth()) {
                                        cli.contratos.forEach { c ->
                                            FilaContratoPago(
                                                contrato = c,
                                                abierto = contratoAbierto == c.id,
                                                onToggle = { contratoAbierto = if (contratoAbierto == c.id) null else c.id },
                                                onPagar = { cu -> modalPagoCuota = cu; modalPagoContrato = c },
                                                onImprimir = { cu -> onImprimir?.invoke(construirReciboCuota(c, cu, idioma)) },
                                                onImprimirPago = { p -> onImprimir?.invoke(construirReciboPago(p, c, idioma)) },
                                                t = t,
                                                oscuro = oscuro,
                                                idioma = idioma,
                                                enGrupo = true
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (grupos.isEmpty()) {
                        item {
                            VacioPagos(
                                Icons.Outlined.Description,
                                Traducciones.texto("pagos.sinContratos", idioma) +
                                    if (busqueda.isNotBlank()) " · " + Traducciones.texto("pagos.intentaOtro", idioma) else "",
                                t
                            )
                        }
                    } else {
                        items(grupos.size) { i ->
                            val g = grupos[i]
                            val colapsado = g.key in gruposColapsados
                            Column(
                                modifier = Modifier
                                    .padding(horizontal = 12.dp, vertical = 5.dp)
                                    .background(t.fondoPrincipal, RoundedCornerShape(14.dp))
                                    .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { gruposColapsados = if (colapsado) gruposColapsados - g.key else gruposColapsados + g.key }
                                        .padding(horizontal = 16.dp, vertical = 14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(Modifier.size(12.dp).background(g.color, RoundedCornerShape(3.dp)))
                                    Spacer(Modifier.width(10.dp))
                                    Text(g.nombre, color = g.color, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.weight(1f))
                                    Box(
                                        modifier = Modifier
                                            .background(g.color.copy(alpha = 0.13f), RoundedCornerShape(20.dp))
                                            .padding(horizontal = 10.dp, vertical = 2.dp)
                                    ) {
                                        Text(g.contratos.size.toString(), color = g.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Icon(
                                        Icons.Outlined.ArrowDropDown,
                                        contentDescription = null,
                                        tint = t.textoTerciario,
                                        modifier = Modifier
                                            .size(22.dp)
                                            .graphicsLayer { rotationZ = if (colapsado) 180f else 0f }
                                    )
                                }
                                if (!colapsado) {
                                    Column(Modifier.fillMaxWidth()) {
                                        g.contratos.forEach { c ->
                                            FilaContratoPago(
                                                contrato = c,
                                                abierto = contratoAbierto == c.id,
                                                onToggle = { contratoAbierto = if (contratoAbierto == c.id) null else c.id },
                                                onPagar = { cu -> modalPagoCuota = cu; modalPagoContrato = c },
                                                onImprimir = { cu -> onImprimir?.invoke(construirReciboCuota(c, cu, idioma)) },
                                                onImprimirPago = { p -> onImprimir?.invoke(construirReciboPago(p, c, idioma)) },
                                                t = t,
                                                oscuro = oscuro,
                                                idioma = idioma,
                                                enGrupo = false
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (tab == "historial") {
                item {
                    StatsGridPagos(
                        stats = listOf(
                            StatPago(Traducciones.texto("pagos.totalPagos", idioma), pagosFiltrados.size.toString(), Icons.Outlined.Receipt, Color(0xFF3B82F6)),
                            StatPago(Traducciones.texto("pagos.montoCobrado", idioma), fmtM(pagosFiltrados.sumOf { it.monto }), Icons.Outlined.Payments, VERDE),
                            StatPago(Traducciones.texto("pagos.moraCobrada", idioma), fmtM(pagosFiltrados.sumOf { it.mora }), Icons.Outlined.Warning, ROJO),
                            StatPago(Traducciones.texto("pagos.contratosLabel", idioma), pagosFiltrados.map { it.contratoId }.distinct().size.toString(), Icons.Outlined.Description, Color(0xFFF59E0B))
                        ),
                        t = t
                    )
                }
                item {
                    ToolbarHistorial(
                        busqueda = busquedaPago,
                        onBusqueda = { busquedaPago = it },
                        t = t,
                        idioma = idioma
                    )
                }
                if (pagosFiltrados.isEmpty()) {
                    item { VacioPagos(Icons.Outlined.Receipt, Traducciones.texto("pagos.sinPagos", idioma), t) }
                } else {
                    item {
                        TablaHistorialPagos(
                            pagos = pagosFiltrados,
                            onVer = { modalDetalle = it },
                            onImprimir = { p ->
                                val c = contratos.firstOrNull { it.id == p.contratoId }
                                onImprimir?.invoke(construirReciboPago(p, c, idioma))
                            },
                            onAnular = { modalAnular = it },
                            t = t,
                            idioma = idioma
                        )
                    }
                }
            } else {
                item { BannerListaNegra(t, idioma) }
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CampoWeb(
                            valor = busquedaNegra,
                            onValor = { busquedaNegra = it },
                            tokens = t,
                            placeholder = Traducciones.texto("pagos.buscarNegra", idioma),
                            icono = Icons.Outlined.Search,
                            alto = 40,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                if (listaNegra.isEmpty()) {
                    item {
                        VacioPagos(
                            Icons.Outlined.CheckCircle,
                            Traducciones.texto("pagos.sinDeudas", idioma) + "\n" + Traducciones.texto("pagos.sinDeudasDesc", idioma),
                            t
                        )
                    }
                } else {
                    item {
                        TablaListaNegra(
                            contratos = listaNegra,
                            onVer = { c -> contratoAbierto = if (contratoAbierto == c.id) null else c.id },
                            t = t,
                            oscuro = oscuro,
                            idioma = idioma
                        )
                    }
                }
            }
        }
    }

    if (mostrarMetodos) {
        ModalMetodosPago(idioma = idioma, t = t, onCerrar = { mostrarMetodos = false })
    }

    val cuotaModal = modalPagoCuota
    val contratoModal = modalPagoContrato
    if (cuotaModal != null && contratoModal != null) {
        ModalRegistrarPago(
            contrato = contratoModal,
            cuota = cuotaModal,
            idioma = idioma,
            t = t,
            oscuro = oscuro,
            onCerrar = { modalPagoCuota = null; modalPagoContrato = null },
            onConfirmar = { recibo, montoValor ->
                val contratoId = contratoModal.id.toIntOrNull() ?: 0
                RepositorioOffline.registrarPagoCuota(
                    context = context,
                    contratoId = contratoId,
                    cuotaNumero = cuotaModal.numero,
                    monto = montoValor,
                    notas = recibo.notas
                )
                modalPagoCuota = null
                modalPagoContrato = null
                onImprimir?.invoke(recibo)
            }
        )
    }

    modalDetalle?.let { pago ->
        val c = contratos.firstOrNull { it.id == pago.contratoId }
        ModalDetallePago(
            pago = pago,
            contrato = c,
            idioma = idioma,
            t = t,
            onCerrar = { modalDetalle = null },
            onImprimir = { onImprimir?.invoke(construirReciboPago(pago, c, idioma)) },
            onAnular = { modalDetalle = null; modalAnular = pago }
        )
    }

    modalAnular?.let { pago ->
        ModalAnularPago(
            pago = pago,
            idioma = idioma,
            t = t,
            onCerrar = { modalAnular = null },
            onConfirmar = {
                modalAnular = null
                modalDetalle = null
            }
        )
    }
}

private data class GrupoPago(
    val key: String,
    val nombre: String,
    val color: Color,
    val contratos: List<ContratoPago>
)

// ───────────────────────── HEADER ─────────────────────────
@Composable
private fun CabeceraPagos(t: TokensWeb, idioma: Idioma, onMetodos: () -> Unit) {
    Column(Modifier.fillMaxWidth().padding(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .shadow(6.dp, RoundedCornerShape(14.dp), ambientColor = Color(0x4D10B981), spotColor = Color(0x4D10B981))
                    .background(Brush.linearGradient(listOf(VERDE, VERDE_OSCURO)), RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Outlined.Payments, contentDescription = null, tint = Color.White, modifier = Modifier.size(28.dp))
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = Traducciones.texto("item.pagos", idioma),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = t.textoPrimario
                )
                Text(
                    text = Traducciones.texto("pagos.subtitulo", idioma),
                    fontSize = 13.sp,
                    color = t.textoSecundario
                )
            }
        }
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier
                .border(1.dp, if (oscuroTema(t)) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
                .clickable(onClick = onMetodos)
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.CreditCard, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(7.dp))
            Text(Traducciones.texto("pagos.metodos", idioma), color = t.textoSecundario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

private fun oscuroTema(t: TokensWeb): Boolean = t.fondoPrincipal == Color(0xFF1E293B)

// ───────────────────────── TABS ─────────────────────────
@Composable
private fun TabsPagos(
    tab: String,
    onTab: (String) -> Unit,
    badgeContratos: Int,
    badgeNegra: Int,
    t: TokensWeb,
    idioma: Idioma
) {
    Column(Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            val lista = listOf(
                Triple("contratos", Traducciones.texto("pagos.tabContratos", idioma), Icons.Outlined.Description),
                Triple("historial", Traducciones.texto("pagos.tabHistorial", idioma), Icons.Outlined.Receipt),
                Triple("lista_negra", Traducciones.texto("pagos.tabListaNegra", idioma), Icons.Outlined.Warning)
            )
            lista.forEach { (key, label, icono) ->
                val activo = tab == key
                val colorTab = if (key == "lista_negra") ROJO else VERDE
                Column(modifier = Modifier.clickable { onTab(key) }) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            icono,
                            contentDescription = null,
                            tint = if (activo) colorTab else t.textoSecundario,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            label,
                            color = if (activo) colorTab else t.textoSecundario,
                            fontSize = 13.sp,
                            fontWeight = if (activo) FontWeight.Bold else FontWeight.SemiBold
                        )
                        if (key == "contratos" && badgeContratos > 0) {
                            Box(
                                modifier = Modifier
                                    .background(Color(0xFFEF4444), CircleShape)
                                    .padding(horizontal = 6.dp, vertical = 1.dp)
                            ) {
                                Text(badgeContratos.toString(), color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                            }
                        }
                        if (key == "lista_negra" && badgeNegra > 0) {
                            Box(
                                modifier = Modifier
                                    .background(ROJO, CircleShape)
                                    .padding(horizontal = 6.dp, vertical = 1.dp)
                            ) {
                                Text(badgeNegra.toString(), color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                            }
                        }
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(2.dp)
                            .background(if (activo) colorTab else Color.Transparent)
                    )
                }
            }
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(t.bordeClaro))
    }
}

// ───────────────────────── STATS ─────────────────────────
private data class StatPago(
    val label: String,
    val valor: String,
    val icono: ImageVector,
    val color: Color
)

@Composable
private fun StatsGridPagos(
    stats: List<StatPago>,
    t: TokensWeb
) {
    stats.chunked(2).forEach { fila ->
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 5.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            fila.forEach { (label, valor, icono, color) ->
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                        .padding(10.dp)
                ) {
                    Box(Modifier.fillMaxWidth().height(3.dp).background(color, RoundedCornerShape(50)))
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .background(
                                    when (color) {
                                        Color(0xFF3B82F6) -> Color(0xFFDBEAFE)
                                        VERDE -> Color(0xFFD1FAE5)
                                        ROJO -> Color(0xFFFEE2E2)
                                        Color(0xFFF59E0B) -> Color(0xFFFEF3C7)
                                        else -> color.copy(alpha = 0.12f)
                                    },
                                    RoundedCornerShape(9.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(17.dp))
                        }
                        Spacer(Modifier.width(8.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                valor,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = t.textoPrimario,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                label,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = t.textoTerciario,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
            if (fila.size == 1) Spacer(Modifier.weight(1f))
        }
    }
}

// ───────────────────────── TOOLBAR ─────────────────────────
@Composable
private fun ToolbarContratos(
    busqueda: String,
    onBusqueda: (String) -> Unit,
    vistaCliente: Boolean,
    onVista: (Boolean) -> Unit,
    filtroCategoria: String,
    onFiltro: (String) -> Unit,
    categorias: List<CategoriaPago>,
    t: TokensWeb,
    idioma: Idioma
) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp)) {
        CampoWeb(
            valor = busqueda,
            onValor = onBusqueda,
            tokens = t,
            placeholder = Traducciones.texto("pagos.buscar", idioma),
            icono = Icons.Outlined.Search,
            alto = 40,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (!vistaCliente && categorias.isNotEmpty()) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
                            .clickable {
                                val opciones = listOf("" to Traducciones.texto("pagos.todasCategorias", idioma)) +
                                    categorias.map { it.id to it.nombre } +
                                    listOf("sin" to Traducciones.texto("pagos.sinCategoria", idioma))
                                val actual = opciones.indexOfFirst { it.first == filtroCategoria }
                                val siguiente = opciones[(actual + 1) % opciones.size]
                                onFiltro(siguiente.first)
                            }
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val opciones = listOf("" to Traducciones.texto("pagos.todasCategorias", idioma)) +
                            categorias.map { it.id to it.nombre } +
                            listOf("sin" to Traducciones.texto("pagos.sinCategoria", idioma))
                        Text(
                            opciones.firstOrNull { it.first == filtroCategoria }?.second ?: Traducciones.texto("pagos.todasCategorias", idioma),
                            color = t.textoSecundario,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f)
                        )
                        Icon(Icons.Outlined.ArrowDropDown, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(20.dp))
                    }
                }
                Spacer(Modifier.width(10.dp))
            }
            VistaTogglePagos(vistaCliente = vistaCliente, onVista = onVista, t = t, idioma = idioma)
        }
    }
}

@Composable
private fun VistaTogglePagos(vistaCliente: Boolean, onVista: (Boolean) -> Unit, t: TokensWeb, idioma: Idioma) {
    Row(
        modifier = Modifier
            .background(if (oscuroTema(t)) Color(0xFF1E293B) else Color(0xFFF1F5F9), RoundedCornerShape(10.dp))
            .padding(4.dp)
    ) {
        listOf(
            false to Traducciones.texto("pagos.contratos", idioma),
            true to Traducciones.texto("pagos.porCliente", idioma)
        ).forEach { (esCliente, label) ->
            val activo = vistaCliente == esCliente
            Row(
                modifier = Modifier
                    .background(if (activo) {
                        if (oscuroTema(t)) Color(0xFF0F172A) else Color.White
                    } else Color.Transparent, RoundedCornerShape(8.dp))
                    .clickable { onVista(esCliente) }
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    if (esCliente) Icons.Outlined.Person else Icons.Outlined.Description,
                    contentDescription = null,
                    tint = if (activo) Color(0xFF3B82F6) else t.textoSecundario,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(Modifier.width(5.dp))
                Text(
                    label,
                    color = if (activo) Color(0xFF3B82F6) else t.textoSecundario,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

// ───────────────────────── CHIPS ─────────────────────────
@Composable
private fun ChipsCategorias(
    activa: String,
    onSelect: (String) -> Unit,
    categorias: List<CategoriaPago>,
    countSin: Int,
    t: TokensWeb,
    idioma: Idioma
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 12.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        ChipCategoria(
            nombre = Traducciones.texto("pagos.todas", idioma),
            color = null,
            activo = activa.isBlank(),
            onSelect = { onSelect("") },
            t = t
        )
        categorias.forEach { cat ->
            ChipCategoria(
                cat.nombre,
                cat.color,
                activa == cat.id,
                { onSelect(if (activa == cat.id) "" else cat.id) },
                t,
                null
            )
        }
        ChipCategoria(
            Traducciones.texto("pagos.sinCategoria", idioma),
            Color(0xFF94A3B8),
            activa == "sin",
            { onSelect(if (activa == "sin") "" else "sin") },
            t,
            countSin
        )
    }
}

@Composable
private fun ChipCategoria(
    nombre: String,
    color: Color?,
    activo: Boolean,
    onSelect: () -> Unit,
    t: TokensWeb,
    count: Int? = null
) {
    Row(
        modifier = Modifier
            .background(if (activo) Color(0xFF0EA5E9) else t.fondoPrincipal, RoundedCornerShape(50))
            .border(1.5.dp, if (activo) Color(0xFF0EA5E9) else (color ?: t.bordeClaro), RoundedCornerShape(50))
            .clickable(onClick = onSelect)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (color != null) {
            Box(Modifier.size(8.dp).background(if (activo) Color.White else color, CircleShape))
            Spacer(Modifier.width(5.dp))
        }
        Text(nombre, color = if (activo) Color.White else (color ?: t.textoSecundario), fontSize = 11.sp, fontWeight = FontWeight.Medium)
        if (count != null) {
            Spacer(Modifier.width(5.dp))
            Box(
                modifier = Modifier
                    .background(if (activo) Color.White.copy(alpha = 0.25f) else Color(0x1F000000), RoundedCornerShape(10.dp))
                    .padding(horizontal = 6.dp, vertical = 0.dp)
            ) {
                Text(count.toString(), color = if (activo) Color.White else (color ?: t.textoTerciario), fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ───────────────────────── CLIENTE HEADER ─────────────────────────
@Composable
private fun ClienteHeader(
    cli: ClienteResumen,
    abierto: Boolean,
    onToggle: () -> Unit,
    t: TokensWeb,
    idioma: Idioma
) {
    val tieneVenc = cli.totalCuotasVencidas > 0
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggle)
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .background(
                        if (tieneVenc) Brush.linearGradient(listOf(ROJO, Color(0xFFDC2626)))
                        else Brush.linearGradient(listOf(VERDE, VERDE_OSCURO)),
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(cli.nombre.take(1).uppercase(), color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(cli.nombre, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                Text(cli.documento, fontSize = 11.sp, color = t.textoSecundario)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .background(if (oscuroTema(t)) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(20.dp))
                        .padding(horizontal = 10.dp, vertical = 2.dp)
                ) {
                    Text(
                        cli.totalContratos.toString() + " " + Traducciones.texto("pagos.contratosLabel", idioma),
                        color = if (oscuroTema(t)) Color(0xFFE2E8F0) else Color(0xFF334155),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                if (tieneVenc) {
                    Spacer(Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFFEE2E2), RoundedCornerShape(20.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            cli.totalCuotasVencidas.toString() + " " + Traducciones.texto("pagos.venc", idioma),
                            color = Color(0xFF991B1B),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(horizontalAlignment = Alignment.Start) {
                Text(Traducciones.texto("pagos.totalPendiente", idioma), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario)
                Text(
                    fmtM(cli.totalPendiente),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (tieneVenc) ROJO else t.textoPrimario
                )
            }
            Spacer(Modifier.weight(1f))
            Icon(
                Icons.Outlined.ArrowDropDown,
                contentDescription = null,
                tint = t.textoTerciario,
                modifier = Modifier
                    .size(22.dp)
                    .graphicsLayer { rotationZ = if (abierto) 180f else 0f }
            )
        }
    }
}

// ───────────────────────── FILA CONTRATO ─────────────────────────
@Composable
private fun FilaContratoPago(
    contrato: ContratoPago,
    abierto: Boolean,
    onToggle: () -> Unit,
    onPagar: (CuotaPago) -> Unit,
    onImprimir: (CuotaPago) -> Unit,
    onImprimirPago: (PagoRegistrado) -> Unit,
    t: TokensWeb,
    oscuro: Boolean,
    idioma: Idioma,
    enGrupo: Boolean
) {
    val tieneVenc = contrato.cuotasVencidas > 0
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (contrato.esProducto) {
                    if (oscuro) Color(0xFF082F49) else Color(0xFFF0FDFF)
                } else if (tieneVenc) {
                    if (oscuro) Color(0xFF1A120A) else Color(0xFFFFFBF5)
                } else Color.Transparent
            )
            .border(if (enGrupo) 0.dp else 1.dp, t.bordeClaro)
            .clickable(onClick = onToggle)
    ) {
        if (contrato.esProducto) {
            Box(Modifier.fillMaxWidth().height(3.dp).background(if (oscuro) Color(0xFF0891B2) else Color(0xFF06B6D4)))
        }
        Column(Modifier.fillMaxWidth().padding(12.dp)) {
            // Fila 1: cliente | próximo pago
            Row(verticalAlignment = Alignment.Top) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .background(
                                    if (tieneVenc) Brush.linearGradient(listOf(ROJO, Color(0xFFDC2626)))
                                    else Brush.linearGradient(listOf(VERDE, VERDE_OSCURO)),
                                    CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(contrato.cliente.take(1).uppercase(), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.width(9.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(contrato.cliente, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(contrato.documento, fontSize = 11.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(contrato.numero, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = VERDE)
                    Text(contrato.plan, fontSize = 11.sp, color = t.textoSecundario)
                    if (contrato.esProducto) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp)
                                .background(if (oscuro) Color(0xFF083344) else Color(0xFFECFEFF), RoundedCornerShape(8.dp))
                                .border(1.dp, if (oscuro) Color(0xFF155E75) else Color(0xFFA5F3FC), RoundedCornerShape(8.dp))
                                .padding(8.dp)
                        ) {
                            Text(
                                Traducciones.texto("pagos.prestamoProducto", idioma),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color(0xFF0891B2)
                            )
                            Text(contrato.producto.orEmpty(), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                            Text(
                                Traducciones.texto("pagos.precio", idioma) + ": " + fmtM(contrato.precioProducto ?: 0.0),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF0E7490)
                            )
                        }
                    }
                }
                Column(horizontalAlignment = Alignment.End) {
                    val prox = contrato.proxima
                    if (prox != null) {
                        Text(Traducciones.texto("pagos.proximoPago", idioma), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario)
                        Text(
                            fmtM(prox.montoRestante + prox.mora),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = t.textoPrimario
                        )
                        Text(
                            if (prox.estado == "vencida") {
                                prox.fechaVencimiento + " · " + diasVencPago(prox.fechaVencimiento) + Traducciones.texto("pagos.dVencida", idioma)
                            } else prox.fechaVencimiento,
                            fontSize = 11.sp,
                            color = if (prox.estado == "vencida") ROJO else t.textoSecundario,
                            fontWeight = if (prox.estado == "vencida") FontWeight.Bold else FontWeight.Normal,
                            textAlign = TextAlign.End
                        )
                    } else {
                        Text(Traducciones.texto("pagos.sinCuotas", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario)
                    }
                    Spacer(Modifier.height(10.dp))
                    Text(Traducciones.texto("pagos.saldo", idioma), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario)
                    Text(
                        fmtM(contrato.saldoPendiente),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = t.textoPrimario
                    )
                    if (tieneVenc) {
                        Box(
                            modifier = Modifier
                                .padding(top = 4.dp)
                                .background(Color(0xFFFEE2E2), RoundedCornerShape(20.dp))
                                .padding(horizontal = 8.dp, vertical = 1.dp)
                        ) {
                            Text(
                                contrato.cuotasVencidas.toString() + " " + Traducciones.texto("pagos.venc", idioma),
                                color = Color(0xFF991B1B),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
            // Fila 2: acciones (ojito + chevron)
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 10.dp),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .border(1.dp, Color(0xFFBAE6FD), RoundedCornerShape(8.dp))
                        .clickable(onClick = onToggle),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Outlined.Visibility, contentDescription = null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(16.dp))
                }
                Spacer(Modifier.width(8.dp))
                Icon(
                    Icons.Outlined.ArrowDropDown,
                    contentDescription = null,
                    tint = t.textoTerciario,
                    modifier = Modifier
                        .size(24.dp)
                        .graphicsLayer { rotationZ = if (abierto) 180f else 0f }
                )
            }
        }

        if (abierto) {
            PanelCuotasContrato(
                contrato = contrato,
                onPagar = onPagar,
                onImprimir = onImprimir,
                onImprimirPago = onImprimirPago,
                t = t,
                oscuro = oscuro,
                idioma = idioma
            )
        }
    }
}

// ───────────────────────── PANEL CUOTAS ─────────────────────────
@Composable
private fun PanelCuotasContrato(
    contrato: ContratoPago,
    onPagar: (CuotaPago) -> Unit,
    onImprimir: (CuotaPago) -> Unit,
    onImprimirPago: (PagoRegistrado) -> Unit,
    t: TokensWeb,
    oscuro: Boolean,
    idioma: Idioma
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC))
            .border(1.dp, t.bordeClaro)
    ) {
        // Pagos registrados
        if (contrato.pagos.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp)
                    .background(if (oscuro) Color(0xFF052E16) else Color(0xFFF0FDF4), RoundedCornerShape(10.dp))
                    .border(1.dp, if (oscuro) Color(0xFF166534) else Color(0xFFBBF7D0), RoundedCornerShape(10.dp))
                    .padding(12.dp)
            ) {
                Text(
                    Traducciones.texto("pagos.pagosRegistradosBox", idioma),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (oscuro) Color(0xFF86EFAC) else Color(0xFF166534)
                )
                contrato.pagos.forEach { p ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(fmtM(p.monto), fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                                Spacer(Modifier.width(8.dp))
                                Text(p.fecha, fontSize = 12.sp, color = t.textoSecundario)
                            }
                            if (p.notas?.contains("adelantado", ignoreCase = true) == true) {
                                Box(
                                    modifier = Modifier
                                        .padding(top = 4.dp)
                                        .background(if (oscuro) Color(0xFF14532D) else Color(0xFFDCFCE7), RoundedCornerShape(20.dp))
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        Traducciones.texto("pagos.pagoAdelantado", idioma),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (oscuro) Color(0xFFBBF7D0) else Color(0xFF166534)
                                    )
                                }
                            }
                        }
                        Box(
                            modifier = Modifier
                                .border(1.dp, if (oscuro) Color(0xFF065F46) else Color(0xFFA7F3D0), RoundedCornerShape(8.dp))
                                .clickable { onImprimirPago(p) }
                                .padding(horizontal = 12.dp, vertical = 7.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Outlined.Print, contentDescription = null, tint = VERDE, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(5.dp))
                                Text(Traducciones.texto("pagos.imprimir", idioma), color = VERDE, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }
        }

        // Tabla cuotas
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
        ) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp)) {
                CeldaTabla("#", 26.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.vencimiento", idioma), 92.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.cuota", idioma), 84.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.capital", idioma), 78.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.interes", idioma), 78.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.mora", idioma), 60.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.total", idioma), 78.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.estado", idioma), 66.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.fechaPagoCol", idioma), 88.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla("", 80.dp, Color.Transparent, FontWeight.Normal, 10.sp, TextAlign.Start)
            }
            contrato.cuotas.forEach { cu ->
                val esVencida = cu.estado == "vencida"
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (esVencida) (if (oscuro) Color(0xFF1A0A0A) else Color(0xFFFFF5F5)) else Color.Transparent)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CeldaTabla(cu.numero.toString(), 26.dp, VERDE, FontWeight.Bold, 11.sp, TextAlign.Start)
                    Row(Modifier.width(92.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(cu.fechaVencimiento, fontSize = 11.sp, color = t.textoTerciario)
                        if (esVencida) {
                            Box(
                                modifier = Modifier
                                    .padding(start = 4.dp)
                                    .background(Color(0xFFFEE2E2), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 4.dp, vertical = 1.dp)
                            ) {
                                Text(diasVencPago(cu.fechaVencimiento).toString() + "d", color = Color(0xFF991B1B), fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                            }
                        }
                    }
                    if (cu.estado == "parcial") {
                        Column(Modifier.width(84.dp)) {
                            Text(fmtM(cu.montoRestante), fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                            Text(
                                Traducciones.texto("pagos.pagado", idioma) + " " + fmtM(cu.montoPagado ?: 0.0),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = t.textoTerciario
                            )
                        }
                    } else {
                        CeldaTabla(fmtM(cu.monto), 84.dp, t.textoPrimario, FontWeight.Bold, 11.sp, TextAlign.Start)
                    }
                    CeldaTabla(fmtM(cu.capital), 78.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    CeldaTabla(fmtM(cu.interes), 78.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    if (cu.mora > 0) {
                        CeldaTabla(fmtM(cu.mora), 60.dp, ROJO, FontWeight.Bold, 11.sp, TextAlign.Start)
                    } else {
                        CeldaTabla("—", 60.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    }
                    CeldaTabla(fmtM(cu.total), 78.dp, t.textoPrimario, FontWeight.Bold, 11.sp, TextAlign.Start)
                    val (bg, fg) = estadoEstilo(cu.estado)
                    Box(
                        modifier = Modifier
                            .width(66.dp)
                            .background(bg, RoundedCornerShape(20.dp))
                            .padding(horizontal = 7.dp, vertical = 2.dp)
                    ) {
                        Text(estadoLabel(cu.estado, idioma), color = fg, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                    CeldaTabla(cu.fechaPago ?: "—", 88.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    Column(
                        modifier = Modifier.width(80.dp),
                        horizontalAlignment = Alignment.End
                    ) {
                        if ((cu.estado == "pagada" || cu.estado == "parcial") && cu.ultimoPagoId != null) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .border(1.dp, if (oscuro) Color(0xFF065F46) else Color(0xFFA7F3D0), RoundedCornerShape(7.dp))
                                    .clickable { onImprimir(cu) },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Outlined.Print, contentDescription = null, tint = VERDE, modifier = Modifier.size(13.dp))
                            }
                        }
                        if (cu.estado == "pendiente" || cu.estado == "vencida" || cu.estado == "parcial") {
                            Spacer(Modifier.height(4.dp))
                            Box(
                                modifier = Modifier
                                    .background(Brush.linearGradient(listOf(VERDE, VERDE_OSCURO)), RoundedCornerShape(8.dp))
                                    .clickable { onPagar(cu) }
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Outlined.Payments, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text(Traducciones.texto("pagos.pagar", idioma), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Resumen
        val pend = contrato.cuotas.filter { it.estado == "pendiente" || it.estado == "vencida" || it.estado == "parcial" }
        val sumaCuotas = contrato.cuotas.sumOf { it.monto }
        val sumaCapital = contrato.cuotas.sumOf { it.capital }
        val sumaInteres = contrato.cuotas.sumOf { it.interes }
        val sumaMora = pend.sumOf { it.mora }
        val balanceRestante = pend.sumOf { it.montoRestante + it.mora }
        val pagadas = contrato.cuotas.count { it.estado == "pagada" }
        val itemsResumen = mutableListOf<Pair<String, Pair<String, Color>>>()
        itemsResumen.add(Traducciones.texto("pagos.cuotasPagadas", idioma) to ((pagadas.toString() + " / " + contrato.cuotas.size) to t.textoPrimario))
        itemsResumen.add(Traducciones.texto("pagos.totalContrato", idioma) to (fmtM(sumaCuotas) to t.textoPrimario))
        itemsResumen.add(Traducciones.texto("pagos.capital", idioma) to (fmtM(sumaCapital) to t.textoPrimario))
        itemsResumen.add(Traducciones.texto("pagos.interes", idioma) to (fmtM(sumaInteres) to t.textoPrimario))
        if (sumaMora > 0) {
            itemsResumen.add(Traducciones.texto("pagos.moraAcumulada", idioma) to (fmtM(sumaMora) to ROJO))
        }
        itemsResumen.add(Traducciones.texto("pagos.balanceRestante", idioma) to (fmtM(balanceRestante) to if (oscuro) Color(0xFF34D399) else Color(0xFF059669)))
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(if (oscuro) Color(0xFF111827) else Color(0xFFF8FAFC))
                .border(1.dp, t.bordeClaro)
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            itemsResumen.chunked(2).forEach { fila ->
                Row(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    fila.forEach { (label, valorColor) ->
                        Column(Modifier.weight(1f)) {
                            Text(label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario)
                            Text(valorColor.first, fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = valorColor.second)
                        }
                    }
                    if (fila.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

// ───────────────────────── CELDA ─────────────────────────
@Composable
private fun CeldaTabla(
    texto: String,
    ancho: androidx.compose.ui.unit.Dp,
    color: Color,
    peso: FontWeight,
    size: androidx.compose.ui.unit.TextUnit,
    align: TextAlign
) {
    Text(
        texto,
        modifier = Modifier.width(ancho),
        color = color,
        fontSize = size,
        fontWeight = peso,
        textAlign = align,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
}

// ───────────────────────── HISTORIAL ─────────────────────────
@Composable
private fun ToolbarHistorial(busqueda: String, onBusqueda: (String) -> Unit, t: TokensWeb, idioma: Idioma) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp)) {
        CampoWeb(
            valor = busqueda,
            onValor = onBusqueda,
            tokens = t,
            placeholder = Traducciones.texto("pagos.buscarHistorial", idioma),
            icono = Icons.Outlined.Search,
            alto = 40,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.DateRange, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(Traducciones.texto("pagos.desde", idioma), color = t.textoSecundario, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.DateRange, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(Traducciones.texto("pagos.hasta", idioma), color = t.textoSecundario, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun TablaHistorialPagos(
    pagos: List<PagoRegistrado>,
    onVer: (PagoRegistrado) -> Unit,
    onImprimir: (PagoRegistrado) -> Unit,
    onAnular: (PagoRegistrado) -> Unit,
    t: TokensWeb,
    idioma: Idioma
) {
    Column(
        modifier = Modifier
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(14.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
        ) {
            Row(Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                CeldaTabla(Traducciones.texto("pagos.fecha", idioma), 92.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.contratoLabel", idioma), 106.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.cliente", idioma), 130.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.cedula", idioma), 116.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.producto", idioma), 128.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.monto", idioma), 82.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.capital", idioma), 80.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.interes", idioma), 80.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.mora", idioma), 66.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.metodoPago", idioma), 92.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.referencia", idioma), 100.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.registradoPor", idioma), 96.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla("", 90.dp, Color.Transparent, FontWeight.Normal, 10.sp, TextAlign.Start)
            }
            pagos.forEach { p ->
                val esProducto = !p.producto.isNullOrBlank()
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (esProducto) (if (oscuroTema(t)) Color(0xFF082F49) else Color(0xFFF0FDFF)) else Color.Transparent)
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CeldaTabla(p.fecha, 92.dp, t.textoSecundario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    CeldaTabla(p.numero, 106.dp, VERDE, FontWeight.Bold, 11.sp, TextAlign.Start)
                    Row(Modifier.width(130.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(26.dp)
                                .background(Brush.linearGradient(listOf(VERDE, VERDE_OSCURO)), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(p.cliente.take(1).uppercase(), color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.width(6.dp))
                        Text(p.cliente, fontSize = 11.sp, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    CeldaTabla(p.documento.ifBlank { "—" }, 116.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    if (esProducto) {
                        Column(Modifier.width(128.dp)) {
                            Text(p.producto.orEmpty(), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(fmtM(p.precioProducto ?: 0.0), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0E7490))
                        }
                    } else {
                        CeldaTabla("—", 128.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    }
                    CeldaTabla(fmtM(p.monto), 82.dp, t.textoPrimario, FontWeight.Bold, 11.sp, TextAlign.Start)
                    CeldaTabla(fmtM(p.capital), 80.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    CeldaTabla(fmtM(p.interes), 80.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    if (p.mora > 0) {
                        Box(
                            modifier = Modifier
                                .width(66.dp)
                                .background(Color(0xFFFEE2E2), RoundedCornerShape(8.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(fmtM(p.mora), color = Color(0xFF991B1B), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        CeldaTabla("—", 66.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    }
                    CeldaTabla(labelMetodo(p.metodo, idioma), 92.dp, t.textoSecundario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    CeldaTabla(p.referencia.ifBlank { "—" }, 100.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    CeldaTabla(p.registradoPor, 96.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    Row(Modifier.width(90.dp), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
                        IconoAccion(Icons.Outlined.Visibility, Color(0xFF0EA5E9), if (oscuroTema(t)) Color(0xFF0C4A6E) else Color(0xFFBAE6FD)) { onVer(p) }
                        Spacer(Modifier.width(6.dp))
                        IconoAccion(Icons.Outlined.Print, VERDE, if (oscuroTema(t)) Color(0xFF065F46) else Color(0xFFA7F3D0)) { onImprimir(p) }
                        Spacer(Modifier.width(6.dp))
                        IconoAccion(Icons.Outlined.Delete, ROJO, if (oscuroTema(t)) Color(0xFF450A0A) else Color(0xFFFECACA)) { onAnular(p) }
                    }
                }
            }
        }
    }
}

@Composable
private fun IconoAccion(icono: ImageVector, color: Color, borde: Color, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(30.dp)
            .border(1.dp, borde, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(14.dp))
    }
}

// ───────────────────────── LISTA NEGRA ─────────────────────────
@Composable
private fun BannerListaNegra(t: TokensWeb, idioma: Idioma) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(
                Brush.linearGradient(
                    if (oscuroTema(t)) listOf(Color(0xFF1F2937), Color(0xFF111827)) else listOf(Color(0xFFFEE2E2), Color(0xFFFECACA))
                ),
                RoundedCornerShape(12.dp)
            )
            .border(1.dp, if (oscuroTema(t)) Color(0xFF7F1D1D) else Color(0xFFFCA5A5), RoundedCornerShape(12.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            Icons.Outlined.Warning,
            contentDescription = null,
            tint = if (oscuroTema(t)) Color(0xFFFCA5A5) else Color(0xFF991B1B),
            modifier = Modifier.size(26.dp)
        )
        Spacer(Modifier.width(12.dp))
        Column {
            Text(
                Traducciones.texto("pagos.bannerNegraTitulo", idioma),
                fontSize = 15.sp,
                fontWeight = FontWeight.ExtraBold,
                color = if (oscuroTema(t)) Color(0xFFFCA5A5) else Color(0xFF991B1B)
            )
            Text(
                Traducciones.texto("pagos.bannerNegraDesc", idioma),
                fontSize = 12.sp,
                color = if (oscuroTema(t)) Color(0xFFFCA5A5) else Color(0xFF991B1B)
            )
        }
    }
}

@Composable
private fun TablaListaNegra(
    contratos: List<ContratoPago>,
    onVer: (ContratoPago) -> Unit,
    t: TokensWeb,
    oscuro: Boolean,
    idioma: Idioma
) {
    Column(
        modifier = Modifier
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(14.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
        ) {
            Row(Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                CeldaTabla(Traducciones.texto("pagos.cliente", idioma), 150.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.cedula", idioma), 120.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.telefono", idioma), 110.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.contratoLabel", idioma), 100.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.plan", idioma), 110.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.cuotasVencidasCol", idioma), 96.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.diasMora", idioma), 82.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.montoVencido", idioma), 100.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla(Traducciones.texto("pagos.saldoTotal", idioma), 100.dp, t.textoTerciario, FontWeight.Bold, 10.sp, TextAlign.Start)
                CeldaTabla("", 40.dp, Color.Transparent, FontWeight.Normal, 10.sp, TextAlign.Start)
            }
            contratos.forEach { c ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (oscuro) Color(0x1A7F1D1D) else Color(0xFFFFF5F5))
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(Modifier.width(150.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(26.dp)
                                .background(Brush.linearGradient(listOf(Color(0xFF7F1D1D), Color(0xFF991B1B))), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(c.cliente.take(1).uppercase(), color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.width(6.dp))
                        Text(c.cliente, fontSize = 11.sp, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    CeldaTabla(c.documento.ifBlank { "—" }, 120.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    CeldaTabla(c.telefono.ifBlank { "—" }, 110.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    CeldaTabla(c.numero, 100.dp, VERDE, FontWeight.Bold, 11.sp, TextAlign.Start)
                    CeldaTabla(c.plan, 110.dp, t.textoTerciario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    Box(
                        modifier = Modifier
                            .width(96.dp)
                            .background(Color(0xFFFEE2E2), RoundedCornerShape(20.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            c.cuotasVencidas.toString() + " " + Traducciones.texto("pagos.cuotasLabel", idioma),
                            color = Color(0xFF991B1B),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    val dias = c.maxDiasMora
                    Box(
                        modifier = Modifier
                            .width(82.dp)
                            .background(
                                when {
                                    dias > 30 -> Color(0xFF7F1D1D)
                                    dias > 15 -> Color(0xFFFEE2E2)
                                    else -> Color(0xFFFEF3C7)
                                },
                                RoundedCornerShape(20.dp)
                            )
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            dias.toString() + " " + Traducciones.texto("pagos.dias", idioma),
                            color = when {
                                dias > 30 -> Color.White
                                dias > 15 -> Color(0xFF991B1B)
                                else -> Color(0xFF92400E)
                            },
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                    CeldaTabla(fmtM(c.montoVencido), 100.dp, ROJO, FontWeight.ExtraBold, 11.sp, TextAlign.Start)
                    CeldaTabla(fmtM(c.saldoPendiente), 100.dp, t.textoPrimario, FontWeight.Normal, 11.sp, TextAlign.Start)
                    IconoAccion(Icons.Outlined.Visibility, Color(0xFF0EA5E9), if (oscuroTema(t)) Color(0xFF0C4A6E) else Color(0xFFBAE6FD)) { onVer(c) }
                }
            }
        }
    }
}

// ───────────────────────── VACIO ─────────────────────────
@Composable
private fun VacioPagos(icono: ImageVector, texto: String, t: TokensWeb) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 20.dp)
            .border(2.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            .padding(vertical = 40.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(icono, contentDescription = null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(44.dp))
        Spacer(Modifier.height(8.dp))
        Text(texto, color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
    }
}

// ───────────────────────── MODAL REGISTRAR PAGO ─────────────────────────
@Composable
private fun ModalRegistrarPago(
    contrato: ContratoPago,
    cuota: CuotaPago,
    idioma: Idioma,
    t: TokensWeb,
    oscuro: Boolean,
    onCerrar: () -> Unit,
    onConfirmar: (DatosReciboPago, Double) -> Unit
) {
    val metodos = listOf(
        "", "efectivo", "cheque", "tarjeta", "tranferencia", "abono"
    )
    var monto by remember(cuota) { mutableStateOf(fmtNum(cuota.montoRestante + cuota.mora)) }
    var fecha by remember(cuota) { mutableStateOf(hoyNumPago()) }
    var metodo by remember(cuota) { mutableStateOf("") }
    var referencia by remember(cuota) { mutableStateOf("") }
    var notas by remember(cuota) { mutableStateOf("") }
    var error by remember(cuota) { mutableStateOf("") }
    var selectAbierto by remember(cuota) { mutableStateOf(false) }

    val totalAPagar = cuota.montoRestante + cuota.mora
    val montoValor = monto.toDoubleOrNull() ?: 0.0

    val simulacion = remember(montoValor, cuota) {
        if (montoValor > totalAPagar) {
            val pendientes = contrato.cuotas.filter { it.estado == "pendiente" || it.estado == "vencida" || it.estado == "parcial" }
            val inicio = pendientes.indexOfFirst { it.numero == cuota.numero }.takeIf { it >= 0 } ?: 0
            val resto = mutableListOf<Pair<Int, Double>>()
            var restante = montoValor
            for (c in pendientes.drop(inicio)) {
                if (restante <= 0) break
                val totalC = c.montoRestante + c.mora
                if (restante >= totalC) {
                    resto.add(c.numero to totalC)
                    restante -= totalC
                } else {
                    resto.add(c.numero to restante)
                    restante = 0.0
                }
            }
            resto
        } else emptyList()
    }

    Dialog(
        onDismissRequest = onCerrar,
        properties = DialogProperties(dismissOnClickOutside = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoContenido)
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Payments, contentDescription = null, tint = VERDE, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = Traducciones.texto("pagos.registrarPago", idioma) + " — " +
                            Traducciones.texto("pagos.cuota", idioma) + " #" + cuota.numero,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = VERDE,
                        modifier = Modifier.weight(1f)
                    )
                    Box(modifier = Modifier.clickable(onClick = onCerrar).padding(6.dp)) {
                        Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    }
                }

                // Resumen
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC))
                        .border(1.dp, t.bordeClaro)
                ) {
                    ColumnaResumen(Traducciones.texto("pagos.cuota", idioma), fmtM(cuota.montoRestante), t, Modifier.weight(1f))
                    ColumnaResumen(
                        Traducciones.texto("pagos.moraAcumulada", idioma),
                        if (cuota.mora > 0) fmtM(cuota.mora) else "—",
                        t,
                        Modifier.weight(1f),
                        valorColor = if (cuota.mora > 0) ROJO else t.textoPrimario
                    )
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .background(if (oscuro) Color(0xFF0C1A2E) else Color(0xFFEFF6FF))
                            .padding(12.dp)
                    ) {
                        Text(
                            Traducciones.texto("pagos.totalAPagar", idioma),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = t.textoTerciario
                        )
                        Text(fmtM(totalAPagar), fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                    }
                }

                if (cuota.estado == "vencida") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                            .background(Color(0xFFFEF3C7), RoundedCornerShape(9.dp))
                            .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(9.dp))
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFF92400E), modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            Traducciones.texto("pagos.alertaMora", idioma)
                                .replace("{dias}", diasVencPago(cuota.fechaVencimiento).toString()),
                            color = Color(0xFF92400E),
                            fontSize = 12.sp
                        )
                    }
                }

                Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    Text(Traducciones.texto("pagos.montoRecibido", idioma) + " *", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp)
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                    ) {
                        Box(
                            modifier = Modifier
                                .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFF8FAFC))
                                .padding(horizontal = 12.dp, vertical = 11.dp)
                        ) {
                            Text(RepositorioOffline.simboloMoneda(), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario)
                        }
                        Text(
                            text = monto,
                            color = t.textoPrimario,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier
                                .weight(1f)
                                .padding(vertical = 11.dp)
                        )
                    }
                    Text(Traducciones.texto("pagos.fechaPagoCol", idioma), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(top = 10.dp))
                    CampoWeb(
                        valor = fecha,
                        onValor = { fecha = it },
                        tokens = t,
                        placeholder = hoyNumPago(),
                        alto = 40,
                        modifier = Modifier.padding(top = 6.dp).fillMaxWidth()
                    )
                    Text(Traducciones.texto("pagos.metodoPago", idioma), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(top = 10.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp)
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectAbierto = !selectAbierto }
                                .padding(horizontal = 12.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                if (metodo.isBlank()) Traducciones.texto("cuotas.sinEspecificar", idioma) else labelMetodo(metodo, idioma),
                                color = t.textoPrimario,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.weight(1f)
                            )
                            Icon(Icons.Outlined.ArrowDropDown, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(20.dp))
                        }
                        if (selectAbierto) {
                            metodos.forEach { m ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { metodo = m; selectAbierto = false }
                                        .padding(horizontal = 12.dp, vertical = 9.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (m.isBlank()) {
                                        Text(Traducciones.texto("cuotas.sinEspecificar", idioma), color = t.textoSecundario, fontSize = 13.sp)
                                    } else {
                                        Text(labelMetodo(m, idioma), color = t.textoPrimario, fontSize = 13.sp)
                                    }
                                }
                            }
                        }
                    }
                    Text(Traducciones.texto("pagos.referencia", idioma), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(top = 10.dp))
                    CampoWeb(
                        valor = referencia,
                        onValor = { referencia = it },
                        tokens = t,
                        placeholder = Traducciones.texto("pagos.referenciaPh", idioma),
                        alto = 40,
                        modifier = Modifier.padding(top = 6.dp).fillMaxWidth()
                    )
                    Text(Traducciones.texto("pagos.notas", idioma), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(top = 10.dp))
                    CampoWeb(
                        valor = notas,
                        onValor = { notas = it },
                        tokens = t,
                        placeholder = Traducciones.texto("pagos.notasPh", idioma),
                        alto = 40,
                        modifier = Modifier.padding(top = 6.dp).fillMaxWidth()
                    )

                    if (simulacion.isNotEmpty()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 10.dp)
                                .background(if (oscuro) Color(0xFF0C1A2E) else Color(0xFFEFF6FF), RoundedCornerShape(10.dp))
                                .border(1.dp, if (oscuro) Color(0xFF1E3A5F) else Color(0xFFBFDBFE), RoundedCornerShape(10.dp))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, if (oscuro) Color(0xFF1E3A5F) else Color(0xFFBFDBFE))
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    Traducciones.texto("pagos.distribucion", idioma),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (oscuro) Color(0xFF93C5FD) else Color(0xFF1E40AF)
                                )
                            }
                            simulacion.forEach { (nro, montoAplicado) ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        Traducciones.texto("pagos.cuota", idioma) + " #" + nro,
                                        fontSize = 11.sp,
                                        color = t.textoPrimario,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Box(
                                        modifier = Modifier
                                            .background(Color(0xFFD1FAE5), RoundedCornerShape(20.dp))
                                            .padding(horizontal = 7.dp, vertical = 2.dp)
                                    ) {
                                        Text(Traducciones.texto("pagos.pagada", idioma), color = Color(0xFF065F46), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(Modifier.width(8.dp))
                                    Text(fmtM(montoAplicado), fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                                }
                            }
                        }
                    }

                    if (error.isNotBlank()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp)
                                .background(Color(0xFFFEE2E2), RoundedCornerShape(9.dp))
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFF991B1B), modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(error, color = Color(0xFF991B1B), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("cuotas.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(VERDE, VERDE_OSCURO)), RoundedCornerShape(9.dp))
                            .clickable {
                                if (montoValor <= 0) {
                                    error = Traducciones.texto("cuotas.montoError", idioma)
                                } else {
                                    val recibo = DatosReciboPago(
                                        reciboNo = cuota.ultimoPagoId ?: (contrato.id.toIntOrNull() ?: 0) * 100 + cuota.numero,
                                        contratoNumero = contrato.numero,
                                        fecha = fecha,
                                        cliente = contrato.cliente,
                                        documento = contrato.documento,
                                        telefono = contrato.telefono,
                                        recibidoPor = "",
                                        cuotas = listOf(
                                            CuotaRecibo(
                                                cuota.numero,
                                                cuota.fechaVencimiento,
                                                if (cuota.mora > 0) fmtM(cuota.mora) else "—",
                                                fmtM(montoValor)
                                            )
                                        ),
                                        capital = fmtM(cuota.capital),
                                        interes = fmtM(cuota.interes),
                                        mora = if (cuota.mora > 0) fmtM(cuota.mora) else "—",
                                        totalPagado = fmtM(montoValor),
                                        saldoRestante = fmtM((contrato.saldoPendiente - montoValor).coerceAtLeast(0.0)),
                                        cuotasPendientes = contrato.cuotas.count { it.estado != "pagada" },
                                        metodoPago = labelMetodo(metodo, idioma),
                                        referencia = referencia,
                                        notas = notas
                                    )
                                    onConfirmar(recibo, montoValor)
                                }
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("pagos.confirmarPago", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ColumnaResumen(
    label: String,
    valor: String,
    t: TokensWeb,
    modifier: Modifier,
    valorColor: Color? = null
) {
    Column(
        modifier = modifier
            .border(1.dp, t.bordeClaro)
            .padding(12.dp)
    ) {
        Text(label, fontSize = 9.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario)
        Text(valor, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = valorColor ?: t.textoPrimario)
    }
}

// ───────────────────────── MODAL MÉTODOS DE PAGO ─────────────────────────
@Composable
private fun ModalMetodosPago(idioma: Idioma, t: TokensWeb, onCerrar: () -> Unit) {
    var metodos by remember { mutableStateOf(listOf(
        MetodoPagoDemo(1, "Abono", 1),
        MetodoPagoDemo(2, "Cheque", 7),
        MetodoPagoDemo(3, "Efectivo", 28),
        MetodoPagoDemo(4, "Tarjeta de crédito", 1),
        MetodoPagoDemo(5, "Tranferencia", 0)
    )) }
    var mostrarNuevo by remember { mutableStateOf(false) }
    var editar by remember { mutableStateOf<MetodoPagoDemo?>(null) }
    var eliminar by remember { mutableStateOf<MetodoPagoDemo?>(null) }
    var nombre by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    Dialog(
        onDismissRequest = onCerrar,
        properties = DialogProperties(dismissOnClickOutside = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoContenido)
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.CreditCard, contentDescription = null, tint = VERDE, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            Traducciones.texto("pagos.metodos", idioma),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = t.textoPrimario
                        )
                        Text(
                            metodos.size.toString() + " " + Traducciones.texto("pagos.metodosRegistrados", idioma),
                            fontSize = 11.sp,
                            color = t.textoSecundario
                        )
                    }
                    Box(modifier = Modifier.clickable(onClick = onCerrar).padding(6.dp)) {
                        Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.End
                ) {
                    Row(
                        modifier = Modifier
                            .background(Brush.linearGradient(listOf(VERDE, VERDE_OSCURO)), RoundedCornerShape(9.dp))
                            .clickable { editar = null; nombre = ""; error = ""; mostrarNuevo = true }
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(Traducciones.texto("pagos.nuevoMetodo", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }

                if (metodos.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 30.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Outlined.CreditCard, contentDescription = null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(40.dp))
                        Spacer(Modifier.height(8.dp))
                        Text(Traducciones.texto("pagos.sinMetodos", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                } else {
                    Column(Modifier.padding(horizontal = 16.dp)) {
                        metodos.chunked(2).forEach { fila ->
                            Row(
                                Modifier.fillMaxWidth().padding(vertical = 5.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                fila.forEach { m ->
                                    CardMetodoPago(
                                        metodo = m,
                                        t = t,
                                        idioma = idioma,
                                        modifier = Modifier.weight(1f),
                                        onEditar = { editar = m; nombre = m.nombre; error = ""; mostrarNuevo = true },
                                        onEliminar = { eliminar = m }
                                    )
                                }
                                if (fila.size == 1) Spacer(Modifier.weight(1f))
                            }
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
            }
        }
    }

    if (mostrarNuevo) {
        ModalNuevoMetodo(
            editando = editar,
            nombreInicial = nombre,
            idioma = idioma,
            t = t,
            onCerrar = { mostrarNuevo = false; error = "" },
            onGuardar = { nuevoNombre ->
                if (editar != null) {
                    metodos = metodos.map { if (it.id == editar!!.id) it.copy(nombre = nuevoNombre) else it }
                } else {
                    val nuevoId = (metodos.maxOfOrNull { it.id } ?: 0) + 1
                    metodos = metodos + MetodoPagoDemo(nuevoId, nuevoNombre, 0)
                }
                mostrarNuevo = false
                error = ""
            },
            error = error,
            onError = { error = it }
        )
    }

    eliminar?.let { m ->
        ModalEliminarMetodo(
            metodo = m,
            idioma = idioma,
            t = t,
            onCerrar = { eliminar = null },
            onConfirmar = {
                metodos = metodos.filter { it.id != m.id }
                eliminar = null
            }
        )
    }
}

@Composable
private fun CardMetodoPago(
    metodo: MetodoPagoDemo,
    t: TokensWeb,
    idioma: Idioma,
    modifier: Modifier,
    onEditar: () -> Unit,
    onEliminar: () -> Unit
) {
    Column(
        modifier = modifier
            .background(t.fondoContenido, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .background(VERDE.copy(alpha = 0.12f), RoundedCornerShape(9.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Outlined.CreditCard, contentDescription = null, tint = VERDE, modifier = Modifier.size(17.dp))
            }
            Spacer(Modifier.width(9.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(metodo.nombre, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    if (metodo.totalPagos > 0) {
                        metodo.totalPagos.toString() + " " + Traducciones.texto("pagos.pagosRegistrados", idioma)
                    } else Traducciones.texto("pagos.sinPagosAun", idioma),
                    fontSize = 10.sp,
                    color = t.textoSecundario
                )
            }
        }
        Row(Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.End) {
            IconoAccion(Icons.Outlined.Edit, VERDE, if (oscuroTema(t)) Color(0xFF065F46) else Color(0xFFA7F3D0), onEditar)
            Spacer(Modifier.width(6.dp))
            IconoAccion(Icons.Outlined.Delete, ROJO, if (oscuroTema(t)) Color(0xFF450A0A) else Color(0xFFFECACA), onEliminar)
        }
    }
}

@Composable
private fun ModalNuevoMetodo(
    editando: MetodoPagoDemo?,
    nombreInicial: String,
    idioma: Idioma,
    t: TokensWeb,
    onCerrar: () -> Unit,
    onGuardar: (String) -> Unit,
    error: String,
    onError: (String) -> Unit
) {
    var nombre by remember { mutableStateOf(nombreInicial) }
    Dialog(
        onDismissRequest = onCerrar,
        properties = DialogProperties(dismissOnClickOutside = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoContenido)
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.CreditCard, contentDescription = null, tint = VERDE, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        if (editando != null) Traducciones.texto("pagos.editarMetodo", idioma)
                        else Traducciones.texto("pagos.nuevoMetodoTitulo", idioma),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = VERDE,
                        modifier = Modifier.weight(1f)
                    )
                    Box(modifier = Modifier.clickable(onClick = onCerrar).padding(6.dp)) {
                        Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    }
                }
                Column(Modifier.padding(16.dp)) {
                    Text(Traducciones.texto("pagos.nombre", idioma) + " *", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                    CampoWeb(
                        valor = nombre,
                        onValor = { nombre = it },
                        tokens = t,
                        placeholder = Traducciones.texto("pagos.nombrePh", idioma),
                        alto = 42,
                        modifier = Modifier.padding(top = 6.dp).fillMaxWidth()
                    )
                    if (error.isNotBlank()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp)
                                .background(Color(0xFFFEE2E2), RoundedCornerShape(9.dp))
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFF991B1B), modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(error, color = Color(0xFF991B1B), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("cuotas.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(VERDE, VERDE_OSCURO)), RoundedCornerShape(9.dp))
                            .clickable {
                                if (nombre.isBlank()) {
                                    onError(Traducciones.texto("pagos.nombreRequerido", idioma))
                                } else {
                                    onGuardar(nombre.trim())
                                }
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            if (editando != null) Traducciones.texto("pagos.guardarCambios", idioma)
                            else Traducciones.texto("pagos.crearMetodo", idioma),
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
private fun ModalEliminarMetodo(
    metodo: MetodoPagoDemo,
    idioma: Idioma,
    t: TokensWeb,
    onCerrar: () -> Unit,
    onConfirmar: () -> Unit
) {
    Dialog(
        onDismissRequest = onCerrar,
        properties = DialogProperties(dismissOnClickOutside = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .background(Color(0xFFFEE2E2), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(28.dp))
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    Traducciones.texto("pagos.eliminarMetodo", idioma),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = t.textoPrimario,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    Traducciones.texto("pagos.confirmarEliminarMetodo", idioma).replace("{nombre}", metodo.nombre),
                    fontSize = 14.sp,
                    color = t.textoSecundario,
                    lineHeight = 20.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("cuotas.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(Color(0xFFEF4444), Color(0xFFDC2626))), RoundedCornerShape(9.dp))
                            .clickable(onClick = onConfirmar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(Traducciones.texto("pagos.eliminar", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// ───────────────────────── MODAL DETALLE PAGO ─────────────────────────
@Composable
private fun ModalDetallePago(
    pago: PagoRegistrado,
    contrato: ContratoPago?,
    idioma: Idioma,
    t: TokensWeb,
    onCerrar: () -> Unit,
    onImprimir: () -> Unit,
    onAnular: () -> Unit
) {
    Dialog(
        onDismissRequest = onCerrar,
        properties = DialogProperties(dismissOnClickOutside = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoContenido)
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Receipt, contentDescription = null, tint = VERDE, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        Traducciones.texto("pagos.detallePago", idioma),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = VERDE,
                        modifier = Modifier.weight(1f)
                    )
                    Box(modifier = Modifier.clickable(onClick = onCerrar).padding(6.dp)) {
                        Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    }
                }

                Column(Modifier.padding(16.dp)) {
                    ItemDetalle(Traducciones.texto("pagos.contratoLabel", idioma), pago.numero, t)
                    ItemDetalle(Traducciones.texto("pagos.cliente", idioma), pago.cliente, t)
                    ItemDetalle(Traducciones.texto("pagos.cedula", idioma), pago.documento.ifBlank { "—" }, t)
                    ItemDetalle(Traducciones.texto("pagos.fecha", idioma), pago.fecha, t)
                    ItemDetalle(Traducciones.texto("pagos.metodoPago", idioma), labelMetodo(pago.metodo, idioma), t)
                    ItemDetalle(Traducciones.texto("pagos.referencia", idioma), pago.referencia.ifBlank { "—" }, t)
                    ItemDetalle(Traducciones.texto("pagos.registradoPor", idioma), pago.registradoPor, t)
                    Spacer(Modifier.height(6.dp))
                    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text(Traducciones.texto("pagos.montoTotal", idioma), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario)
                            Text(fmtM(pago.monto), fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = VERDE)
                        }
                    }
                    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text(Traducciones.texto("pagos.capital", idioma), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario)
                            Text(fmtM(pago.capital), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario)
                        }
                        Column(Modifier.weight(1f)) {
                            Text(Traducciones.texto("pagos.interes", idioma), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario)
                            Text(fmtM(pago.interes), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario)
                        }
                        Column(Modifier.weight(1f)) {
                            Text(Traducciones.texto("pagos.mora", idioma), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario)
                            Text(fmtM(pago.mora), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = if (pago.mora > 0) ROJO else t.textoPrimario)
                        }
                    }

                    if (pago.cuotasAplicadas.isNotEmpty()) {
                        Spacer(Modifier.height(10.dp))
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
                        ) {
                            Text(
                                Traducciones.texto("pagos.cuotasAplicadas", idioma),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = t.textoSecundario,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(t.fondoContenido)
                                    .border(1.dp, t.bordeClaro)
                                    .padding(10.dp)
                            )
                            pago.cuotasAplicadas.forEach { c ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .border(1.dp, t.bordeClaro)
                                        .padding(horizontal = 10.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        Traducciones.texto("pagos.cuota", idioma) + " #" + c.numero,
                                        fontSize = 12.sp,
                                        color = t.textoPrimario,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Box(
                                        modifier = Modifier
                                            .background(Color(0xFFD1FAE5), RoundedCornerShape(20.dp))
                                            .padding(horizontal = 7.dp, vertical = 2.dp)
                                    ) {
                                        Text(estadoLabel(c.estado, idioma), color = Color(0xFF065F46), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(Modifier.width(10.dp))
                                    Text(fmtM(c.aplicado), fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                                }
                            }
                        }
                    }

                    if (!pago.notas.isNullOrBlank()) {
                        Spacer(Modifier.height(10.dp))
                        Text(Traducciones.texto("pagos.notas", idioma), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario)
                        Spacer(Modifier.height(3.dp))
                        Text(pago.notas.orEmpty(), fontSize = 13.sp, color = t.textoSecundario)
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("pagos.cerrar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, if (oscuroTema(t)) Color(0xFF065F46) else Color(0xFFA7F3D0), RoundedCornerShape(9.dp))
                            .clickable(onClick = onImprimir)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Print, contentDescription = null, tint = VERDE, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(Traducciones.texto("pagos.imprimir", idioma), color = VERDE, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, if (oscuroTema(t)) Color(0xFF450A0A) else Color(0xFFFECACA), RoundedCornerShape(9.dp))
                            .clickable(onClick = onAnular)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Delete, contentDescription = null, tint = ROJO, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(Traducciones.texto("pagos.anular", idioma), color = ROJO, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ItemDetalle(label: String, valor: String, t: TokensWeb) {
    Row(Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario, modifier = Modifier.width(120.dp))
        Text(valor, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = t.textoPrimario, modifier = Modifier.weight(1f))
    }
}

// ───────────────────────── MODAL ANULAR PAGO ─────────────────────────
@Composable
private fun ModalAnularPago(
    pago: PagoRegistrado,
    idioma: Idioma,
    t: TokensWeb,
    onCerrar: () -> Unit,
    onConfirmar: () -> Unit
) {
    Dialog(
        onDismissRequest = onCerrar,
        properties = DialogProperties(dismissOnClickOutside = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .background(Color(0xFFFEE2E2), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(28.dp))
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    Traducciones.texto("pagos.anularPago", idioma),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = t.textoPrimario,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    Traducciones.texto("pagos.anularTexto", idioma),
                    fontSize = 14.sp,
                    color = t.textoSecundario,
                    lineHeight = 20.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("cuotas.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(Color(0xFFEF4444), Color(0xFFDC2626))), RoundedCornerShape(9.dp))
                            .clickable(onClick = onConfirmar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(Traducciones.texto("pagos.anular", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// ───────────────────────── RECIBO (helpers) ─────────────────────────
private fun construirReciboCuota(contrato: ContratoPago, cu: CuotaPago, idioma: Idioma): DatosReciboPago {
    val pago = contrato.pagos.firstOrNull { p -> p.cuotasAplicadas.any { it.numero == cu.numero } }
    val pendientes = contrato.cuotas.count { it.estado != "pagada" }
    return DatosReciboPago(
        reciboNo = cu.ultimoPagoId ?: (contrato.id.toIntOrNull() ?: 0) * 100 + cu.numero,
        contratoNumero = contrato.numero,
        fecha = cu.fechaPago ?: pago?.fecha ?: hoyNumPago(),
        cliente = contrato.cliente,
        documento = contrato.documento,
        telefono = contrato.telefono,
        recibidoPor = "",
        cuotas = listOf(
            CuotaRecibo(
                cu.numero,
                cu.fechaVencimiento,
                if (cu.mora > 0) fmtM(cu.mora) else "—",
                if (pago != null) fmtM(pago.monto) else fmtM(cu.montoRestante)
            )
        ),
        capital = fmtM(pago?.capital ?: cu.capital),
        interes = fmtM(pago?.interes ?: cu.interes),
        mora = if (cu.mora > 0) fmtM(cu.mora) else "—",
        totalPagado = if (pago != null) fmtM(pago.monto) else fmtM(cu.monto),
        saldoRestante = fmtM(contrato.saldoPendiente),
        cuotasPendientes = pendientes,
        metodoPago = if (pago != null) labelMetodo(pago.metodo, idioma) else Traducciones.texto("cuotas.sinEspecificar", idioma),
        referencia = pago?.referencia.orEmpty(),
        notas = pago?.notas.orEmpty()
    )
}

private fun construirReciboPago(pago: PagoRegistrado, contrato: ContratoPago?, idioma: Idioma): DatosReciboPago {
    val pendientes = contrato?.cuotas?.count { it.estado != "pagada" } ?: 0
    return DatosReciboPago(
        reciboNo = pago.id,
        contratoNumero = pago.numero,
        fecha = pago.fecha,
        cliente = pago.cliente,
        documento = pago.documento,
        telefono = pago.telefono,
        recibidoPor = pago.registradoPor,
        cuotas = pago.cuotasAplicadas.map {
            CuotaRecibo(it.numero, it.fechaVencimiento, "—", fmtM(it.aplicado))
        },
        capital = fmtM(pago.capital),
        interes = fmtM(pago.interes),
        mora = if (pago.mora > 0) fmtM(pago.mora) else "—",
        totalPagado = fmtM(pago.monto),
        saldoRestante = fmtM(contrato?.saldoPendiente ?: 0.0),
        cuotasPendientes = pendientes,
        metodoPago = labelMetodo(pago.metodo, idioma),
        referencia = pago.referencia,
        notas = pago.notas.orEmpty()
    )
}