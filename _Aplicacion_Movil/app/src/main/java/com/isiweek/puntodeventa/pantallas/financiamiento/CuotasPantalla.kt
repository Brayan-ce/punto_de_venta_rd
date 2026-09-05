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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Print
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Warning
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.AvisoSinBaseDatos
import com.isiweek.puntodeventa.ui.componentes.CampoMoneda
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import kotlinx.coroutines.delay
import java.util.Calendar

private val PURPURA = Color(0xFF8B5CF6)
private val PURPURA_OSCURO = Color(0xFF7C3AED)

private data class CuotaMini(
    val numero: Int,
    val fechaVencimiento: String,
    val monto: String,
    val mora: String,
    val fechaPago: String?,
    val estado: String,
    val ultimoPagoId: Int?,
    val metodoPago: String? = null,
    val referencia: String? = null,
    val notas: String? = null
)

private data class CardCuota(
    val contratoId: Int,
    val numero: String,
    val cliente: String,
    val documento: String,
    val plan: String,
    val esProducto: Boolean,
    val producto: String?,
    val precio: String?,
    val cuotaNumero: Int,
    val monto: String,
    val fechaVencimiento: String,
    val estado: String,
    val saldo: String,
    val cuotas: List<CuotaMini>
)

private data class PagoTarget(
    val contratoId: Int,
    val numero: Int,
    val monto: Double,
    val mora: Double
)

private val MESES_CUOTA = listOf("ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic")

private fun parseMontoCuota(s: String): Double = s.filter { it.isDigit() || it == '.' }.toDoubleOrNull() ?: 0.0

private fun fmtMonto2(v: Double): String {
    val s = String.format("%.2f", v)
    val partes = s.split(".")
    val entero = partes[0]
    val conComas = entero.reversed().chunked(3).joinToString(",").reversed()
    return RepositorioOffline.simboloMoneda() + conComas + "." + (partes.getOrNull(1) ?: "00")
}

private fun diasDesde(fecha: String, hoy: Calendar): Int {
    val p = fecha.split(" ")
    if (p.size < 4) return Int.MAX_VALUE
    val d = p[0].toIntOrNull() ?: return Int.MAX_VALUE
    val mi = MESES_CUOTA.indexOf(p[1].lowercase())
    if (mi < 0) return Int.MAX_VALUE
    val anio = p[3].toIntOrNull() ?: return Int.MAX_VALUE
    val cal = Calendar.getInstance()
    cal.clear()
    cal.set(anio, mi, d, 0, 0, 0)
    val hoyC = hoy.clone() as Calendar
    hoyC.set(Calendar.HOUR_OF_DAY, 0); hoyC.set(Calendar.MINUTE, 0); hoyC.set(Calendar.SECOND, 0); hoyC.set(Calendar.MILLISECOND, 0)
    return ((cal.timeInMillis - hoyC.timeInMillis) / 86400000L).toInt()
}

private fun hoyStrCuota(): String {
    val c = Calendar.getInstance()
    return "${c.get(Calendar.DAY_OF_MONTH)} ${MESES_CUOTA[c.get(Calendar.MONTH)]} de ${c.get(Calendar.YEAR)}"
}

private fun hoyNum(): String {
    val c = Calendar.getInstance()
    val d = c.get(Calendar.DAY_OF_MONTH).toString().padStart(2, '0')
    val m = (c.get(Calendar.MONTH) + 1).toString().padStart(2, '0')
    return "$d/$m/${c.get(Calendar.YEAR)}"
}

private fun labelMetodoPago(clave: String, idioma: Idioma): String = when (clave) {
    "abono" -> Traducciones.texto("cuotas.abono", idioma)
    "cheque" -> Traducciones.texto("cuotas.cheque", idioma)
    "efectivo" -> Traducciones.texto("cuotas.efectivo", idioma)
    "tarjeta" -> Traducciones.texto("cuotas.tarjeta", idioma)
    "tranferencia" -> Traducciones.texto("cuotas.tranferencia", idioma)
    else -> ""
}

private fun construirRecibo(card: CardCuota, cu: CuotaMini, idioma: Idioma): DatosReciboPago {
    val monto = parseMontoCuota(cu.monto)
    val interes = Math.round(monto * 0.2308 * 100.0) / 100.0
    val capital = Math.round((monto - interes) * 100.0) / 100.0
    val pendientes = card.cuotas.count { it.estado != "pagada" }
    return DatosReciboPago(
        reciboNo = cu.ultimoPagoId ?: card.contratoId * 100 + cu.numero,
        contratoNumero = card.numero,
        fecha = cu.fechaPago ?: hoyStrCuota(),
        cliente = card.cliente,
        documento = card.documento,
        telefono = "",
        recibidoPor = "",
        cuotas = listOf(CuotaRecibo(cu.numero, cu.fechaVencimiento, cu.mora, cu.monto)),
        capital = fmtMonto2(capital),
        interes = fmtMonto2(interes),
        mora = cu.mora,
        totalPagado = cu.monto,
        saldoRestante = card.saldo,
        cuotasPendientes = pendientes,
        metodoPago = labelMetodoPago(cu.metodoPago.orEmpty(), idioma),
        referencia = cu.referencia.orEmpty(),
        notas = cu.notas.orEmpty()
    )
}

/** Cuotas: del JSON importado si existe, vacío si no. Una tarjeta por contrato/préstamo
 *  con el desglose de TODAS sus cuotas (por pagar y pagadas). */
private fun obtenerCuotasPantalla(): List<CardCuota> {
    if (!RepositorioOffline.hayDatosOffline()) {
        return emptyList()
    }
    val cuotasOff = RepositorioOffline.obtenerCuotas()
    val contratos = RepositorioOffline.obtenerContratos()
    val clientes = RepositorioOffline.obtenerClientesFin()
    val planes = RepositorioOffline.obtenerPlanes()
    return contratos.map { contrato ->
        val cliente = clientes.firstOrNull { it.id == contrato.clienteId }
        val plan = planes.firstOrNull { it.id == contrato.planId }
        val cuotasContrato = cuotasOff
            .filter { it.contratoId == contrato.id }
            .sortedBy { it.numero }
            .map { q ->
                val pagado = RepositorioOffline.montoPagadoCuota(q.id)
                val montoMostrar = if (q.estado == "parcial") {
                    RepositorioOffline.formatoMonto(Math.round((q.monto - pagado) * 100.0) / 100.0)
                } else {
                    RepositorioOffline.formatoMonto(q.monto)
                }
                CuotaMini(
                    numero = q.numero,
                    fechaVencimiento = q.fechaVencimiento.take(10),
                    monto = montoMostrar,
                    mora = RepositorioOffline.formatoMonto(q.mora),
                    fechaPago = q.fechaPago.takeIf { it.isNotBlank() }?.take(10),
                    estado = q.estado,
                    ultimoPagoId = null
                )
            }
        // Cuota a pagar (próxima pendiente/vencida/parcial)
        val prox = cuotasContrato.firstOrNull { it.estado in listOf("pendiente", "vencida", "parcial") }
        CardCuota(
            contratoId = contrato.id,
            numero = contrato.numero,
            cliente = "${cliente?.nombre ?: "Cliente"} ${cliente?.apellidos ?: ""}".trim(),
            documento = cliente?.documento ?: "",
            plan = plan?.nombre ?: "Plan",
            esProducto = false,
            producto = null,
            precio = null,
            cuotaNumero = prox?.numero ?: (cuotasContrato.lastOrNull()?.numero ?: 0),
            monto = prox?.monto ?: "—",
            fechaVencimiento = prox?.fechaVencimiento ?: "",
            estado = prox?.estado ?: "pagada",
            saldo = RepositorioOffline.formatoMonto(contrato.saldoPendiente),
            cuotas = cuotasContrato
        )
    }
}

private fun estadoBadgeColors(estado: String): Pair<Color, Color> = when (estado) {
    "pagada" -> Color(0xFFD1FAE5) to Color(0xFF065F46)
    "vencida" -> Color(0xFFFEE2E2) to Color(0xFF991B1B)
    "parcial" -> Color(0xFFE0F2FE) to Color(0xFF075985)
    else -> Color(0xFFFEF3C7) to Color(0xFF92400E)
}

private fun estadoLabel(estado: String, idioma: Idioma): String = when (estado) {
    "pagada" -> Traducciones.texto("cuotas.pagada", idioma)
    "vencida" -> Traducciones.texto("cuotas.vencida", idioma)
    "parcial" -> Traducciones.texto("cuotas.parcial", idioma)
    else -> Traducciones.texto("cuotas.pendiente", idioma)
}

private fun gradientePurpura() = Brush.linearGradient(listOf(PURPURA, PURPURA_OSCURO))

@Composable
fun CuotasPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onVerContrato: (Int) -> Unit = {},
    onImprimir: (DatosReciboPago) -> Unit = {}
) {
    val t = TokensWeb(
        fondoPrincipal = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoElevado = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoTerciario = if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9),
        fondoContenido = if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC),
        textoPrimario = if (oscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A),
        textoSecundario = if (oscuro) Color(0xFF94A3B8) else Color(0xFF64748B),
        textoTerciario = if (oscuro) Color(0xFF94A3B8) else Color(0xFF94A3B8),
        bordeClaro = if (oscuro) Color(0xFF334155) else Color(0xFFE5E7EB),
        bordeMedio = if (oscuro) Color(0xFF475569) else Color(0xFFD1D5DB),
        primario = if (oscuro) Color(0xFFA78BFA) else Color(0xFF8B5CF6),
        primarioClaro = if (oscuro) Color(0xFF8B5CF6).copy(alpha = 0.15f) else Color(0xFFEDE9FE),
        exito = Color(0xFF10B981)
    )

    val context = LocalContext.current

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

    val hoy = remember { Calendar.getInstance() }
    var cards by remember(RepositorioOffline.version) { mutableStateOf(obtenerCuotasPantalla()) }
    var busqueda by remember { mutableStateOf("") }
    var filtroEstado by remember { mutableStateOf("todos") }
    var proximas by remember { mutableStateOf(false) }
    var abiertos by remember { mutableStateOf<Set<Int>>(emptySet()) }
    var pagina by remember { mutableStateOf(0) }
    var modalPago by remember { mutableStateOf<PagoTarget?>(null) }
    var modalEliminar by remember { mutableStateOf<CardCuota?>(null) }
    var banner by remember { mutableStateOf<String?>(null) }
    var recalculando by remember { mutableStateOf(false) }

    val filtradas = cards.filter { c ->
        val okBus = busqueda.isBlank() || c.cliente.contains(busqueda, true) || c.documento.contains(busqueda, true) ||
                c.numero.contains(busqueda, true) || c.plan.contains(busqueda, true)
        val okEstado = if (filtroEstado == "todos") true else c.estado == filtroEstado
        val okProx = if (proximas) diasDesde(c.fechaVencimiento, hoy) in 0..7 else true
        okBus && okEstado && okProx
    }

    val totalPaginas = Math.ceil(filtradas.size / 20.0).toInt().coerceAtLeast(1)
    val paginadas = if (totalPaginas <= 1) filtradas else filtradas.drop(pagina * 20).take(20)

    if (recalculando) {
        LaunchedEffect(Unit) {
            delay(700)
            recalculando = false
            banner = Traducciones.texto("cuotas.recalcOk", idioma)
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            Column(Modifier.fillMaxWidth().padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(56.dp).background(gradientePurpura(), RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.CalendarMonth, null, tint = Color.White, modifier = Modifier.size(28.dp))
                    }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text(Traducciones.texto("item.cuotas", idioma), fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                        Text(
                            Traducciones.texto("cuotas.subtitulo", idioma) + " 11 " + Traducciones.texto("cuotas.contratos", idioma),
                            fontSize = 13.sp, color = t.textoSecundario
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier
                        .border(1.dp, if (oscuro) Color(0xFF2E1065) else Color(0xFFDDD6FE), RoundedCornerShape(11.dp))
                        .clickable(enabled = !recalculando) { recalculando = true }
                        .padding(horizontal = 16.dp, vertical = 11.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (recalculando) {
                        Text(Traducciones.texto("cuotas.calculando", idioma), color = if (oscuro) Color(0xFFA78BFA) else Color(0xFF7C3AED), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    } else {
                        Icon(Icons.Outlined.Refresh, null, tint = if (oscuro) Color(0xFFA78BFA) else Color(0xFF7C3AED), modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(7.dp))
                        Text(Traducciones.texto("cuotas.recalcular", idioma), color = if (oscuro) Color(0xFFA78BFA) else Color(0xFF7C3AED), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        banner?.let { msg ->
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp).background(if (oscuro) Color(0xFF022C22) else Color(0xFFD1FAE5), RoundedCornerShape(10.dp)).padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.CheckCircle, null, tint = if (oscuro) Color(0xFF34D399) else Color(0xFF065F46), modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(10.dp))
                    Text(msg, color = if (oscuro) Color(0xFF34D399) else Color(0xFF065F46), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                    Icon(Icons.Outlined.Close, null, tint = if (oscuro) Color(0xFF34D399) else Color(0xFF065F46), modifier = Modifier.size(17.dp).clickable { banner = null })
                }
            }
        }

        items(listOf(
            Triple("cuotas.estadActivos", if (RepositorioOffline.hayDatosOffline()) RepositorioOffline.obtenerContratos().count { it.estado == "activo" }.toString() else "0", Triple(Color(0xFF3B82F6), Color(0xFFDBEAFE), Color(0xFF1E40AF))),
            Triple("cuotas.estadVencidas", if (RepositorioOffline.hayDatosOffline()) RepositorioOffline.obtenerCuotas().count { it.estado == "vencida" }.toString() else "0", Triple(Color(0xFFEF4444), Color(0xFFFEE2E2), Color(0xFF991B1B))),
            Triple("cuotas.estadPendiente", if (RepositorioOffline.hayDatosOffline()) RepositorioOffline.formatoMonto(RepositorioOffline.obtenerContratos().sumOf { it.saldoPendiente }) else RepositorioOffline.simboloMoneda() + "0", Triple(Color(0xFFF59E0B), Color(0xFFFEF3C7), Color(0xFF92400E))),
            Triple("cuotas.estadMora", if (RepositorioOffline.hayDatosOffline()) RepositorioOffline.formatoMonto(RepositorioOffline.obtenerCuotas().filter { it.estado == "vencida" }.sumOf { it.mora }) else RepositorioOffline.simboloMoneda() + "0", Triple(Color(0xFF8B5CF6), Color(0xFFEDE9FE), Color(0xFF5B21B6)))
        ).chunked(2)) { fila ->
            Row(Modifier.fillMaxWidth().padding(horizontal = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                fila.forEach { (clave, valor, colores) ->
                    StatCuota(clave, valor, colores.first, colores.second, colores.third, t, idioma, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        item {
            CampoWeb(
                valor = busqueda,
                onValor = { busqueda = it; pagina = 0 },
                tokens = t,
                placeholder = Traducciones.texto("cuotas.buscar", idioma),
                icono = Icons.Outlined.Search,
                alto = 42,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
            )
        }

        item {
            Column(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 2.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                val filtros = listOf(
                    Triple("todos", Traducciones.texto("cuotas.todos", idioma), t.textoSecundario),
                    Triple("proximas", Traducciones.texto("cuotas.proximas7d", idioma), Color(0xFF0284C7)),
                    Triple("vencida", Traducciones.texto("cuotas.vencidas", idioma), Color(0xFFEF4444)),
                    Triple("pendiente", Traducciones.texto("cuotas.pendientes", idioma), Color(0xFFEA580C)),
                    Triple("parcial", Traducciones.texto("cuotas.parciales", idioma), Color(0xFF0284C7))
                )
                filtros.chunked(3).forEach { fila ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        fila.forEach { (key, label, color) ->
                            val activo = if (key == "proximas") proximas else filtroEstado == key
                            val bordeColor = when {
                                activo -> PURPURA
                                key == "todos" -> t.bordeClaro
                                else -> color.copy(alpha = 0.35f)
                            }
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(if (activo) PURPURA else Color.Transparent, RoundedCornerShape(9.dp))
                                    .border(1.dp, bordeColor, RoundedCornerShape(9.dp))
                                    .clickable {
                                        if (key == "proximas") {
                                            proximas = !proximas
                                            filtroEstado = "todos"
                                        } else {
                                            proximas = false
                                            filtroEstado = key
                                        }
                                        pagina = 0
                                    }
                                    .padding(horizontal = 10.dp, vertical = 9.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(label, color = if (activo) Color.White else color, fontSize = 12.sp, fontWeight = if (activo) FontWeight.Bold else FontWeight.SemiBold, textAlign = TextAlign.Center, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                        }
                        if (fila.size < 3) repeat(3 - fila.size) { Spacer(Modifier.weight(1f)) }
                    }
                }
            }
        }

        if (paginadas.isEmpty()) {
            item {
                if (!RepositorioOffline.hayDatosOffline()) {
                    AvisoSinBaseDatos(idioma = idioma, tokens = t, oscuro = oscuro)
                } else {
                    Column(Modifier.fillMaxWidth().padding(vertical = 44.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Outlined.CheckCircle, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(52.dp))
                        Spacer(Modifier.height(10.dp))
                        Text(Traducciones.texto("cuotas.sinCuotas", idioma), fontSize = 17.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                        Text(
                            if (busqueda.isNotBlank()) Traducciones.texto("cuotas.sinBusqueda", idioma) else Traducciones.texto("cuotas.sinCuotasDesc", idioma),
                            fontSize = 13.sp, color = t.textoSecundario
                        )
                    }
                }
            }
        } else {
            items(paginadas, key = { "${it.contratoId}-${it.cuotaNumero}" }) { card ->
                CardCuotaCuota(
                    card = card,
                    hoy = hoy,
                    t = t,
                    idioma = idioma,
                    oscuro = oscuro,
                    expandido = card.contratoId in abiertos,
                    onToggle = { abiertos = if (card.contratoId in abiertos) abiertos - card.contratoId else abiertos + card.contratoId },
                    onPagar = {
                        modalPago = PagoTarget(card.contratoId, card.cuotaNumero, parseMontoCuota(card.monto), 0.0)
                    },
                    onPagarMini = { mini ->
                        modalPago = PagoTarget(card.contratoId, mini.numero, parseMontoCuota(mini.monto), 0.0)
                    },
                    onEliminar = { modalEliminar = card },
                    onVerContrato = { onVerContrato(card.contratoId) },
                    onImprimir = { mini ->
                        onImprimir(construirRecibo(card, mini, idioma))
                    }
                )
            }
            if (totalPaginas > 1) {
                item {
                    Row(Modifier.fillMaxWidth().padding(top = 14.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                        BotonPagCuotas(habilitado = pagina > 0, icono = Icons.Outlined.ChevronLeft) { pagina-- }
                        Spacer(Modifier.width(12.dp))
                        Text("${pagina + 1} / $totalPaginas", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                        Spacer(Modifier.width(12.dp))
                        BotonPagCuotas(habilitado = pagina < totalPaginas - 1, icono = Icons.Outlined.ChevronRight) { pagina++ }
                    }
                }
            }
        }
    }

    modalPago?.let { target ->
        val card = cards.firstOrNull { it.contratoId == target.contratoId }
        if (card != null) {
            val total = target.monto + target.mora
            ModalPagoCuota(
                numero = target.numero,
                monto = fmtMonto2(target.monto),
                mora = if (target.mora > 0) fmtMonto2(target.mora) else null,
                total = fmtMonto2(total),
                idioma = idioma,
                t = t,
                oscuro = oscuro,
                onCerrar = { modalPago = null },
                onConfirmar = { montoRecibido, metodo, referencia, notas ->
                    val pagado = montoRecibido.coerceAtLeast(total)
                    RepositorioOffline.registrarPagoCuota(
                        context = context,
                        contratoId = card.contratoId,
                        cuotaNumero = target.numero,
                        monto = pagado,
                        notas = notas
                    )
                    val nuevasCuotas = card.cuotas.map { cu ->
                        if (cu.numero == target.numero) cu.copy(estado = "pagada", fechaPago = hoyStrCuota(), ultimoPagoId = card.contratoId * 100 + cu.numero, metodoPago = metodo, referencia = referencia, notas = notas) else cu
                    }
                    val prox = nuevasCuotas.firstOrNull { it.estado in listOf("pendiente", "vencida", "parcial") }
                    val saldoNuevo = (parseMontoCuota(card.saldo) - pagado).coerceAtLeast(0.0)
                    val cardNueva = if (prox != null) {
                        card.copy(cuotas = nuevasCuotas, cuotaNumero = prox.numero, monto = prox.monto, fechaVencimiento = prox.fechaVencimiento, estado = prox.estado, saldo = fmtMonto2(saldoNuevo))
                    } else {
                        card.copy(cuotas = nuevasCuotas, saldo = fmtMonto2(saldoNuevo))
                    }
                    cards = cards.toMutableList().also { it[cards.indexOfFirst { c -> c.contratoId == card.contratoId }] = cardNueva }
                    modalPago = null
                    // Ir directo al ticket/boleta de la cuota pagada
                    val cuPagada = nuevasCuotas.firstOrNull { it.numero == target.numero }
                    if (cuPagada != null) {
                        onImprimir(construirRecibo(cardNueva, cuPagada, idioma))
                    }
                }
            )
        }
    }

    modalEliminar?.let { card ->
        ModalEliminarFinanciamiento(
            card = card,
            idioma = idioma,
            t = t,
            oscuro = oscuro,
            onCerrar = { modalEliminar = null },
            onConfirmar = {
                cards = cards.filterNot { it.contratoId == card.contratoId }
                modalEliminar = null
            }
        )
    }
}

@Composable
private fun StatCuota(clave: String, valor: String, barra: Color, iconoBg: Color, iconoColor: Color, t: TokensWeb, idioma: Idioma, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Box(Modifier.fillMaxWidth().height(3.dp).background(barra, RoundedCornerShape(50)))
        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(42.dp).background(iconoBg, RoundedCornerShape(11.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (clave == "cuotas.estadVencidas") Icons.Outlined.Warning else Icons.Outlined.Description,
                    null, tint = iconoColor, modifier = Modifier.size(20.dp)
                )
            }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(valor, fontSize = 19.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(Traducciones.texto(clave, idioma).uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp, color = t.textoTerciario)
            }
        }
    }
}

@Composable
private fun BotonPagCuotas(habilitado: Boolean, icono: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .border(1.dp, if (habilitado) PURPURA else t_bordePag(), RoundedCornerShape(9.dp))
            .clickable(enabled = habilitado, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icono, null, tint = if (habilitado) PURPURA else t_bordePag(), modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun t_bordePag(): Color = Color(0xFFE2E8F0)

@Composable
private fun CardCuotaCuota(
    card: CardCuota,
    hoy: Calendar,
    t: TokensWeb,
    idioma: Idioma,
    oscuro: Boolean,
    expandido: Boolean,
    onToggle: () -> Unit,
    onPagar: () -> Unit,
    onPagarMini: (CuotaMini) -> Unit,
    onEliminar: () -> Unit,
    onVerContrato: () -> Unit,
    onImprimir: (CuotaMini) -> Unit
) {
    val vencidas = card.cuotas.count { it.estado == "vencida" }
    val dias = if (card.estado == "vencida") diasDesde(card.fechaVencimiento, hoy).coerceAtLeast(0) else 0
    val (bgEst, colorEst) = estadoBadgeColors(card.estado)

    val bordeCard = when {
        card.esProducto -> if (oscuro) Color(0xFF155E75) else Color(0xFF67E8F9)
        card.estado == "vencida" -> if (oscuro) Color(0xFF7F1D1D) else Color(0xFFFCA5A5)
        else -> t.bordeClaro
    }
    val fondoCard = when {
        card.esProducto -> if (oscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF)
        card.estado == "vencida" -> if (oscuro) Color(0xFF1A0A0A) else Color(0xFFFFF8F8)
        else -> t.fondoPrincipal
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 5.dp)
            .background(fondoCard, RoundedCornerShape(14.dp))
            .border(1.dp, bordeCard, RoundedCornerShape(14.dp))
            .clickable(onClick = onToggle)
    ) {
        // ══ CABECERA: avatar + cliente + contrato ══
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar + nombre / documento
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier.size(40.dp).background(gradientePurpura(), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(card.cliente.take(1).uppercase(), color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(card.cliente, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(card.documento, fontSize = 12.sp, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            // Contrato + plan
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = card.numero,
                    color = PURPURA,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable(onClick = onVerContrato),
                    maxLines = 1
                )
                Text(card.plan, fontSize = 11.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }

        if (card.esProducto) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 4.dp)
                    .background(if (oscuro) Color(0xFF082F49) else Color(0xFFECFEFF), RoundedCornerShape(8.dp))
                    .border(1.dp, if (oscuro) Color(0xFF155E75) else Color(0xFFA5F3FC), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 6.dp)
            ) {
                Text(Traducciones.texto("cuotas.prestamoProducto", idioma).uppercase(), fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 0.3.sp, color = Color(0xFF0891B2))
                if (!card.producto.isNullOrBlank()) Text(card.producto, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (!card.precio.isNullOrBlank()) Text(Traducciones.texto("cuotas.precio", idioma) + ": " + card.precio, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0E7490))
            }
        }

        // ══ PRÓXIMA CUOTA + ESTADO + ACCIÓN ══
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Próxima cuota
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    Traducciones.texto("cuotas.cuota", idioma) + " #" + card.cuotaNumero,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.4.sp,
                    color = t.textoTerciario
                )
                Text(card.monto, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(card.fechaVencimiento, fontSize = 12.sp, color = if (dias > 0) Color(0xFFEF4444) else t.textoSecundario, fontWeight = if (dias > 0) FontWeight.SemiBold else FontWeight.Normal)
                    if (dias > 0) {
                        Spacer(Modifier.width(6.dp))
                        Box(Modifier.background(Color(0xFFFEE2E2), RoundedCornerShape(20)).padding(horizontal = 6.dp, vertical = 1.dp)) {
                            Text("${dias}d", color = Color(0xFF991B1B), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            // Estado + Saldo
            Column(horizontalAlignment = Alignment.End) {
                Box(Modifier.background(bgEst, RoundedCornerShape(20)).padding(horizontal = 9.dp, vertical = 3.dp)) {
                    Text(estadoLabel(card.estado, idioma), color = colorEst, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(4.dp))
                Text(Traducciones.texto("cuotas.saldo", idioma) + " " + card.saldo, fontSize = 11.sp, color = t.textoTerciario)
            }
        }

        // ══ ACCIONES: vencidas + Pagar + chevron ══
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.End
        ) {
            if (vencidas > 0) {
                Box(Modifier.background(Color(0xFFFEE2E2), RoundedCornerShape(20)).padding(horizontal = 8.dp, vertical = 3.dp)) {
                    Text("$vencidas " + Traducciones.texto("cuotas.vencAbrev", idioma), color = Color(0xFF991B1B), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(8.dp))
            }
            Box(
                modifier = Modifier.background(gradientePurpura(), RoundedCornerShape(8.dp)).clickable(onClick = onPagar).padding(horizontal = 14.dp, vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Payments, null, tint = Color.White, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(5.dp))
                    Text(Traducciones.texto("cuotas.pagarSiguiente", idioma), color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
            if (card.esProducto) {
                Spacer(Modifier.width(8.dp))
                Box(
                    modifier = Modifier
                        .border(1.dp, if (oscuro) Color(0xFF7F1D1D) else Color(0xFFFECACA), RoundedCornerShape(8.dp))
                        .clickable(onClick = onEliminar)
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Delete, null, tint = if (oscuro) Color(0xFFFCA5A5) else Color(0xFFEF4444), modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(Traducciones.texto("cuotas.eliminar", idioma), color = if (oscuro) Color(0xFFFCA5A5) else Color(0xFFEF4444), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
            Spacer(Modifier.width(8.dp))
            Icon(
                Icons.Outlined.KeyboardArrowDown,
                null,
                tint = t.textoTerciario,
                modifier = Modifier.size(22.dp).graphicsLayer { rotationZ = if (expandido) 180f else 0f }
            )
        }

        // ══ PANEL EXPANDIDO: desglose de cuotas ══
        if (expandido) {
            PanelCuotas(
                cuotas = card.cuotas,
                t = t,
                idioma = idioma,
                oscuro = oscuro,
                onPagarMini = onPagarMini,
                onImprimir = onImprimir
            )
        }
    }
}

@Composable
private fun PanelCuotas(
    cuotas: List<CuotaMini>,
    t: TokensWeb,
    idioma: Idioma,
    oscuro: Boolean,
    onPagarMini: (CuotaMini) -> Unit,
    onImprimir: (CuotaMini) -> Unit
) {
    // Ordenar: las pendientes de pagar primero (por número), y las pagadas en una sección aparte.
    val porPagar = cuotas
        .filter { it.estado in listOf("pendiente", "vencida", "parcial") }
        .sortedBy { it.numero }
    val pagadas = cuotas
        .filter { it.estado == "pagada" }
        .sortedBy { it.numero }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC))
            .padding(vertical = 12.dp)
    ) {
        // ===== SECCIÓN: POR PAGAR =====
        if (porPagar.isNotEmpty()) {
            Column(Modifier.padding(start = 14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Warning, null, tint = Color(0xFFF59E0B), modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(
                        Traducciones.texto("cuotas.porPagar", idioma).uppercase(),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.4.sp,
                        color = Color(0xFFF59E0B)
                    )
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.background(if (oscuro) Color(0xFF451A03) else Color(0xFFFEF3C7), RoundedCornerShape(20)).padding(horizontal = 8.dp, vertical = 2.dp)) {
                        Text(porPagar.size.toString(), color = if (oscuro) Color(0xFFFBBF24) else Color(0xFF92400E), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Spacer(Modifier.height(8.dp))
                TablaCuotasScroll(t, idioma, porPagar, onPagarMini, onImprimir)
            }
            Spacer(Modifier.height(14.dp))
        } else {
            Column(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(Traducciones.texto("cuotas.sinPendientes", idioma), fontSize = 12.sp, color = t.textoTerciario)
            }
            Spacer(Modifier.height(10.dp))
        }

        // ===== SECCIÓN: PAGADAS =====
        if (pagadas.isNotEmpty()) {
            Column(Modifier.padding(start = 14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.CheckCircle, null, tint = Color(0xFF10B981), modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(
                        Traducciones.texto("cuotas.historialPagadas", idioma).uppercase(),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 0.4.sp,
                        color = Color(0xFF10B981)
                    )
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.background(if (oscuro) Color(0xFF022C22) else Color(0xFFD1FAE5), RoundedCornerShape(20)).padding(horizontal = 8.dp, vertical = 2.dp)) {
                        Text(pagadas.size.toString(), color = if (oscuro) Color(0xFF34D399) else Color(0xFF065F46), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Spacer(Modifier.height(8.dp))
                TablaCuotasScroll(t, idioma, pagadas, onPagarMini, onImprimir)
            }
        }
    }
}

/** Tabla de cuotas con scroll horizontal y ancho fijo para que cada columna se vea completa. */
@Composable
private fun TablaCuotasScroll(
    t: TokensWeb,
    idioma: Idioma,
    cuotas: List<CuotaMini>,
    onPagarMini: (CuotaMini) -> Unit,
    onImprimir: (CuotaMini) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
    ) {
        Column(Modifier.width(640.dp)) {
            FilaHeaderCuotas(t, idioma)
            cuotas.forEach { cu ->
                FilaCuotaDesglose(
                    cu = cu,
                    t = t,
                    idioma = idioma,
                    oscuro = t.fondoPrincipal == Color(0xFF1E293B),
                    onPagarMini = onPagarMini,
                    onImprimir = onImprimir
                )
            }
        }
    }
}

@Composable
private fun FilaHeaderCuotas(t: TokensWeb, idioma: Idioma) {
    Row(
        modifier = Modifier
            .width(640.dp)
            .background(if (t.fondoPrincipal == Color(0xFF1E293B)) Color(0xFF1E293B) else Color(0xFFE2E8F0))
            .padding(horizontal = 10.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("#", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario, modifier = Modifier.width(36.dp))
        Text(Traducciones.texto("cuotas.vencimiento", idioma).uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario, modifier = Modifier.width(112.dp))
        Text(Traducciones.texto("cuotas.monto", idioma).uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario, modifier = Modifier.width(110.dp), textAlign = TextAlign.End)
        Text(Traducciones.texto("cuotas.mora", idioma).uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario, modifier = Modifier.width(72.dp), textAlign = TextAlign.End)
        Text(Traducciones.texto("cuotas.fechaPago", idioma).uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario, modifier = Modifier.width(100.dp), textAlign = TextAlign.End)
        Text(Traducciones.texto("cuotas.estado", idioma).uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario, modifier = Modifier.width(90.dp), textAlign = TextAlign.Center)
        Text(Traducciones.texto("cuotas.accion", idioma).uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario, modifier = Modifier.width(120.dp), textAlign = TextAlign.Center)
    }
}

@Composable
private fun FilaCuotaDesglose(
    cu: CuotaMini,
    t: TokensWeb,
    idioma: Idioma,
    oscuro: Boolean,
    onPagarMini: (CuotaMini) -> Unit,
    onImprimir: (CuotaMini) -> Unit = {}
) {
    Row(
        modifier = Modifier
            .width(640.dp)
            .background(
                when {
                    cu.estado == "vencida" -> if (oscuro) Color(0xFF1A0808) else Color(0xFFFFF5F5)
                    cu.estado == "pagada" -> if (oscuro) Color(0xFF030F0A) else Color(0xFFF8FFFE)
                    else -> Color.Transparent
                }
            )
            .padding(horizontal = 10.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("#${cu.numero}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PURPURA, modifier = Modifier.width(36.dp))
        Text(cu.fechaVencimiento, fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.width(112.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(cu.monto, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.width(110.dp), maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.End)
        Text(
            if (cu.mora != "—") cu.mora else "—",
            fontSize = 12.sp,
            color = if (cu.mora != "—") Color(0xFFEF4444) else t.textoTerciario,
            fontWeight = if (cu.mora != "—") FontWeight.Bold else FontWeight.Normal,
            modifier = Modifier.width(72.dp),
            textAlign = TextAlign.End
        )
        Text(cu.fechaPago ?: "—", fontSize = 12.sp, color = t.textoTerciario, modifier = Modifier.width(100.dp), maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.End)
        Box(Modifier.width(90.dp), contentAlignment = Alignment.Center) {
            val (bgMini, colorMini) = estadoBadgeColors(cu.estado)
            Box(Modifier.background(bgMini, RoundedCornerShape(20)).padding(horizontal = 8.dp, vertical = 3.dp)) {
                Text(estadoLabel(cu.estado, idioma), color = colorMini, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
            }
        }
        Box(Modifier.width(120.dp), contentAlignment = Alignment.Center) {
            if (cu.estado == "pagada") {
                Box(
                    modifier = Modifier.size(30.dp).border(1.dp, if (oscuro) Color(0xFF065F46) else Color(0xFFA7F3D0), RoundedCornerShape(8.dp)).clickable { onImprimir(cu) },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Outlined.Print, null, tint = Color(0xFF10B981), modifier = Modifier.size(14.dp))
                }
            } else if (cu.estado in listOf("pendiente", "vencida", "parcial")) {
                Box(
                    modifier = Modifier.background(gradientePurpura(), RoundedCornerShape(7.dp)).clickable { onPagarMini(cu) }.padding(horizontal = 12.dp, vertical = 7.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Payments, null, tint = Color.White, modifier = Modifier.size(12.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(Traducciones.texto("cuotas.pagar", idioma), color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ModalPagoCuota(
    numero: Int,
    monto: String,
    mora: String?,
    total: String,
    idioma: Idioma,
    t: TokensWeb,
    oscuro: Boolean,
    onCerrar: () -> Unit,
    onConfirmar: (Double, String, String, String) -> Unit
) {
    var montoRecibido by remember { mutableStateOf(parseMontoCuota(total).toString()) }
    var fecha by remember { mutableStateOf(hoyNum()) }
    var metodo by remember { mutableStateOf("") }
    var referencia by remember { mutableStateOf("") }
    var notas by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    val metodos = listOf(
        "" to Traducciones.texto("cuotas.sinEspecificar", idioma),
        "abono" to Traducciones.texto("cuotas.abono", idioma),
        "cheque" to Traducciones.texto("cuotas.cheque", idioma),
        "efectivo" to Traducciones.texto("cuotas.efectivo", idioma),
        "tarjeta" to Traducciones.texto("cuotas.tarjeta", idioma),
        "tranferencia" to Traducciones.texto("cuotas.tranferencia", idioma)
    )

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCerrar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = false)
    ) {
        Box(
            modifier = Modifier.fillMaxSize().background(Color(0x80000000)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .heightIn(max = 660.dp)
                    .verticalScroll(rememberScrollState())
                    .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF), RoundedCornerShape(16.dp))
                    .border(1.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(16.dp))
            ) {
                // HEADER
                Row(
                    modifier = Modifier.fillMaxWidth().background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC)).padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Payments, null, tint = PURPURA, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        Traducciones.texto("cuotas.cuota", idioma) + " #" + numero,
                        fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = PURPURA, modifier = Modifier.weight(1f)
                    )
                    Icon(Icons.Outlined.Close, null, tint = t.textoTerciario, modifier = Modifier.size(22.dp).clickable(onClick = onCerrar))
                }

                // RESUMEN
                Row(Modifier.fillMaxWidth().background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC))) {
                    ColumnaResumenCuota(Traducciones.texto("cuotas.cuota", idioma), monto, t, Modifier.weight(1f))
                    mora?.let { m ->
                        ColumnaResumenCuota(Traducciones.texto("cuotas.mora", idioma), m, t, Modifier.weight(1f), colorValor = Color(0xFFEF4444))
                    }
                    ColumnaResumenCuota(
                        Traducciones.texto("cuotas.total", idioma), total, t, Modifier.weight(1f),
                        fondo = if (oscuro) Color(0xFF1E1040) else Color(0xFFF5F3FF)
                    )
                }

                // CUERPO
                Column(Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
                    Text(Traducciones.texto("cuotas.montoRecibido", idioma) + " *", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                    Spacer(Modifier.height(6.dp))
                    CampoMoneda(valor = montoRecibido, onValor = { montoRecibido = it; error = "" }, tokens = t)
                    Spacer(Modifier.height(14.dp))
                    Text(Traducciones.texto("cuotas.fecha", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                    Spacer(Modifier.height(6.dp))
                    CampoWeb(valor = fecha, onValor = { fecha = it }, tokens = t, placeholder = "15/08/2026", alto = 48)
                    Spacer(Modifier.height(14.dp))
                    Text(Traducciones.texto("cuotas.metodoPago", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                    Spacer(Modifier.height(6.dp))
                    SelectMetodo(metodo, metodos, t, oscuro) { metodo = it }
                    Spacer(Modifier.height(14.dp))
                    Text(Traducciones.texto("cuotas.referencia", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                    Spacer(Modifier.height(6.dp))
                    CampoWeb(valor = referencia, onValor = { referencia = it }, tokens = t, placeholder = Traducciones.texto("cuotas.referenciaPh", idioma), alto = 48)
                    Spacer(Modifier.height(14.dp))
                    Text(Traducciones.texto("cuotas.notas", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                    Spacer(Modifier.height(6.dp))
                    CampoWeb(valor = notas, onValor = { notas = it }, tokens = t, placeholder = Traducciones.texto("cuotas.notasPh", idioma), alto = 48)

                    if (error.isNotEmpty()) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 10.dp).background(if (oscuro) Color(0xFF450A0A) else Color(0xFFFEE2E2), RoundedCornerShape(9.dp)).padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.Warning, null, tint = if (oscuro) Color(0xFFFCA5A5) else Color(0xFF991B1B), modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(error, color = if (oscuro) Color(0xFFFCA5A5) else Color(0xFF991B1B), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                // FOOTER
                Row(
                    Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(9.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 13.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("cuotas.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(gradientePurpura(), RoundedCornerShape(9.dp))
                            .clickable {
                                val m = montoRecibido.toDoubleOrNull() ?: 0.0
                                if (m <= 0) error = Traducciones.texto("cuotas.montoError", idioma)
                                else onConfirmar(m, metodo, referencia, notas)
                            }
                            .padding(vertical = 13.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.CheckCircle, null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("cuotas.pagarTitulo", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ColumnaResumenCuota(label: String, valor: String, t: TokensWeb, modifier: Modifier = Modifier, colorValor: Color? = null, fondo: Color? = null) {
    Column(
        modifier = modifier
            .background(fondo ?: Color.Transparent)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Text(label.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario)
        Spacer(Modifier.height(2.dp))
        Text(valor, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = colorValor ?: t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun SelectMetodo(valor: String, opciones: List<Pair<String, String>>, t: TokensWeb, oscuro: Boolean, onValor: (String) -> Unit) {
    var abierto by remember { mutableStateOf(false) }
    val etiqueta = opciones.firstOrNull { it.first == valor }?.second ?: ""
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF), RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .clickable { abierto = !abierto }
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(etiqueta, color = if (valor.isEmpty()) t.textoTerciario else t.textoPrimario, fontSize = 13.sp, modifier = Modifier.weight(1f))
            Icon(Icons.Outlined.KeyboardArrowDown, null, tint = t.textoTerciario, modifier = Modifier.size(18.dp))
        }
        if (abierto) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 176.dp)
                    .verticalScroll(rememberScrollState())
                    .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF), RoundedCornerShape(8.dp))
                    .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                    .padding(vertical = 4.dp)
            ) {
                opciones.forEach { (k, label) ->
                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { onValor(k); abierto = false }.padding(horizontal = 12.dp, vertical = 11.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(label, color = if (k == valor) PURPURA else t.textoPrimario, fontSize = 13.sp, fontWeight = if (k == valor) FontWeight.Bold else FontWeight.Normal, modifier = Modifier.weight(1f))
                        if (k == valor) Icon(Icons.Outlined.Check, null, tint = PURPURA, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun ModalEliminarFinanciamiento(
    card: CardCuota,
    idioma: Idioma,
    t: TokensWeb,
    oscuro: Boolean,
    onCerrar: () -> Unit,
    onConfirmar: () -> Unit
) {
    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCerrar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = false)
    ) {
        Box(
            modifier = Modifier.fillMaxSize().background(Color(0x80000000)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .heightIn(max = 660.dp)
                    .verticalScroll(rememberScrollState())
                    .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF), RoundedCornerShape(16.dp))
                    .border(1.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC)).padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Delete, null, tint = Color(0xFFEF4444), modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(Traducciones.texto("cuotas.eliminarFinanciamiento", idioma), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFEF4444), modifier = Modifier.weight(1f))
                    Icon(Icons.Outlined.Close, null, tint = t.textoTerciario, modifier = Modifier.size(22.dp).clickable(onClick = onCerrar))
                }

                Column(Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
                    Text(Traducciones.texto("cuotas.textoEliminar", idioma), fontSize = 14.sp, lineHeight = 20.sp, color = t.textoSecundario)
                    Spacer(Modifier.height(14.dp))
                    Column(
                        modifier = Modifier.fillMaxWidth().background(if (oscuro) Color(0xFF450A0A) else Color(0xFFFEF2F2), RoundedCornerShape(10.dp)).border(1.dp, if (oscuro) Color(0xFF7F1D1D) else Color(0xFFFECACA), RoundedCornerShape(10.dp)).padding(horizontal = 14.dp, vertical = 12.dp)
                    ) {
                        FilaResumenEliminar(Traducciones.texto("cuotas.contratoLabel", idioma), card.numero, t)
                        Spacer(Modifier.height(8.dp))
                        FilaResumenEliminar(Traducciones.texto("cuotas.clienteLabel", idioma), card.cliente, t)
                        if (!card.producto.isNullOrBlank()) {
                            Spacer(Modifier.height(8.dp))
                            FilaResumenEliminar(Traducciones.texto("cuotas.productoLabel", idioma), card.producto, t)
                        }
                        Spacer(Modifier.height(8.dp))
                        FilaResumenEliminar(Traducciones.texto("cuotas.saldoPendienteLabel", idioma), card.saldo, t)
                    }
                }

                Row(
                    Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(9.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 13.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("cuotas.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(Color(0xFFEF4444), Color(0xFFDC2626))), RoundedCornerShape(9.dp))
                            .clickable(onClick = onConfirmar)
                            .padding(vertical = 13.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Delete, null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("cuotas.eliminarDefinitivo", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FilaResumenEliminar(label: String, valor: String, t: TokensWeb) {
    Row(Modifier.fillMaxWidth()) {
        Text(label, fontSize = 13.sp, color = t.textoTerciario)
        Spacer(Modifier.weight(1f))
        Text(valor, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, textAlign = TextAlign.End, maxLines = 2)
    }
}