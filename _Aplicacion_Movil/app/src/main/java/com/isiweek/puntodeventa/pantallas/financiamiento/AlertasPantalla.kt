package com.isiweek.puntodeventa.pantallas.financiamiento

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.KeyboardArrowUp
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.NotificationsOff
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Timelapse
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.AvisoSinBaseDatos
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

@Composable
fun AlertasPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onVerContrato: (Int) -> Unit = {}
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
        primario = Color(0xFFF59E0B),
        primarioClaro = if (oscuro) Color(0xFFF59E0B).copy(alpha = 0.15f) else Color(0xFFFEF3C7),
        exito = Color(0xFF10B981)
    )

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

    var alertas by remember(RepositorioOffline.version) { mutableStateOf(obtenerAlertasPantalla()) }
    var busqueda by remember { mutableStateOf("") }
    var filtroEstado by remember { mutableStateOf("todos") }
    var filtroTipo by remember { mutableStateOf("todos") }
    var pagina by remember { mutableStateOf(0) }
    var msgGenerando by remember { mutableStateOf<String?>(null) }
    var mostrarModalNueva by remember { mutableStateOf(false) }
    var modalEliminar by remember { mutableStateOf<AlertaItem?>(null) }

    val stats = listOf(
        AlertaStat("alertas.estadTotal", alertas.size.toString(), Icons.Outlined.Notifications, Color(0xFF3B82F6), Color(0xFFDBEAFE), Color(0xFF1E40AF)),
        AlertaStat("alertas.estadActivas", alertas.count { it.estado == "activa" }.toString(), Icons.Outlined.Warning, Color(0xFFEF4444), Color(0xFFFEE2E2), Color(0xFF991B1B)),
        AlertaStat("alertas.estadResueltas", alertas.count { it.estado == "resuelta" }.toString(), Icons.Outlined.CheckCircle, Color(0xFF10B981), Color(0xFFD1FAE5), Color(0xFF065F46)),
        AlertaStat("alertas.estadIncumplimientos", alertas.count { it.tipo == "incumplimiento" }.toString(), Icons.Outlined.Info, Color(0xFF8B5CF6), Color(0xFFEDE9FE), Color(0xFF5B21B6))
    )

    val filtradas = alertas.filter {
        (busqueda.isBlank() ||
                it.contrato.contains(busqueda, ignoreCase = true) ||
                it.cliente.contains(busqueda, ignoreCase = true) ||
                it.mensaje.contains(busqueda, ignoreCase = true)) &&
                (filtroEstado == "todos" || it.estado == filtroEstado) &&
                (filtroTipo == "todos" || it.tipo == filtroTipo)
    }

    val PAGE_SIZE = 8
    val totalPaginas = if (filtradas.isEmpty()) 0 else (filtradas.size + PAGE_SIZE - 1) / PAGE_SIZE
    val paginaSegura = if (totalPaginas == 0) 0 else pagina.coerceIn(0, totalPaginas - 1)
    val listaPagina = filtradas.drop(paginaSegura * PAGE_SIZE).take(PAGE_SIZE)

    fun cambiarEstado(id: Int, estado: String) {
        alertas = alertas.map { if (it.id == id) it.copy(estado = estado) else it }
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
            // ══ HERO (hace scroll junto al contenido, como el web) ══
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .shadow(6.dp, RoundedCornerShape(14.dp), ambientColor = Color(0x4DF59E0B), spotColor = Color(0x4DF59E0B))
                                .background(Brush.linearGradient(listOf(Color(0xFFF59E0B), Color(0xFFD97706))), RoundedCornerShape(14.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.Notifications, contentDescription = null, tint = Color.White, modifier = Modifier.size(28.dp))
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = Traducciones.texto("alertas.titulo", idioma),
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = t.textoPrimario
                            )
                            Text(
                                text = Traducciones.texto("alertas.subtitulo", idioma),
                                fontSize = 13.sp,
                                color = t.textoSecundario
                            )
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        // Generar alertas (outline ámbar/sky como el web)
                        Row(
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, if (oscuro) Color(0xFF0C4A6E) else Color(0xFFBAE6FD), RoundedCornerShape(11.dp))
                                .clickable { msgGenerando = Traducciones.texto("alertas.msgGenerado", idioma) }
                                .padding(horizontal = 8.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Outlined.Refresh, contentDescription = null, tint = if (oscuro) Color(0xFF38BDF8) else Color(0xFF0EA5E9), modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("alertas.generar", idioma), color = if (oscuro) Color(0xFF38BDF8) else Color(0xFF0EA5E9), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                        // Nueva alerta (verde gradiente)
                        Row(
                            modifier = Modifier
                                .weight(1f)
                                .shadow(2.dp, RoundedCornerShape(11.dp), ambientColor = Color(0x4010B981), spotColor = Color(0x4010B981))
                                .background(Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF059669))), RoundedCornerShape(11.dp))
                                .clickable { mostrarModalNueva = true }
                                .padding(horizontal = 8.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("alertas.nueva", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // ══ BANNER "Procesando/Generado" (verde como el web) ══
            if (msgGenerando != null) {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 4.dp)
                            .background(if (oscuro) Color(0xFF022C22) else Color(0xFFD1FAE5), RoundedCornerShape(10.dp))
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = if (oscuro) Color(0xFF34D399) else Color(0xFF065F46), modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(10.dp))
                        Text(
                            text = msgGenerando ?: "",
                            color = if (oscuro) Color(0xFF34D399) else Color(0xFF065F46),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f)
                        )
                        Box(modifier = Modifier.clickable { msgGenerando = null }.padding(4.dp)) {
                            Icon(Icons.Outlined.Close, contentDescription = null, tint = if (oscuro) Color(0xFF34D399) else Color(0xFF065F46), modifier = Modifier.size(17.dp))
                        }
                    }
                }
            }

            // ══ STATS (2 columnas, franja superior de color) ══
            items(stats.chunked(2)) { fila ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    fila.forEach { stat ->
                        AlertaStatCard(stat, t, idioma, Modifier.weight(1f))
                    }
                    if (fila.size == 1) Spacer(Modifier.weight(1f))
                }
            }

            // Buscador con botón limpiar
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        CampoWeb(
                            valor = busqueda,
                            onValor = { busqueda = it; pagina = 0 },
                            tokens = t,
                            placeholder = Traducciones.texto("alertas.buscar", idioma),
                            icono = Icons.Outlined.Search,
                            alto = 40
                        )
                        if (busqueda.isNotEmpty()) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.CenterEnd)
                                    .padding(end = 8.dp)
                                    .size(26.dp)
                                    .background(t.fondoTerciario, CircleShape)
                                    .clickable { busqueda = ""; pagina = 0 },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                }
            }

            // Chips estado (activo ámbar #F59E0B)
            item {
                FlowRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("todos" to "alertas.todos", "activa" to "alertas.activa", "resuelta" to "alertas.resuelta", "descartada" to "alertas.descartada").forEach { (key, labelClave) ->
                        val activo = filtroEstado == key
                        Box(
                            modifier = Modifier
                                .background(if (activo) Color(0xFFF59E0B) else t.fondoPrincipal, RoundedCornerShape(9.dp))
                                .border(1.dp, if (activo) Color(0xFFF59E0B) else t.bordeClaro, RoundedCornerShape(9.dp))
                                .clickable { filtroEstado = key; pagina = 0 }
                                .padding(horizontal = 12.dp, vertical = 7.dp)
                        ) {
                            Text(
                                Traducciones.texto(labelClave, idioma),
                                color = if (activo) Color.White else if (oscuro) Color(0xFF64748B) else Color(0xFF64748B),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // Chips tipo (activo ámbar #F59E0B)
            item {
                FlowRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf(
                        "todos" to "alertas.todosTipos",
                        "vencimiento" to "alertas.vencimiento",
                        "mora" to "alertas.mora",
                        "incumplimiento" to "alertas.incumplimiento",
                        "otro" to "alertas.otro"
                    ).forEach { (key, labelClave) ->
                        val activo = filtroTipo == key
                        Box(
                            modifier = Modifier
                                .background(if (activo) Color(0xFFF59E0B) else t.fondoPrincipal, RoundedCornerShape(9.dp))
                                .border(1.dp, if (activo) Color(0xFFF59E0B) else t.bordeClaro, RoundedCornerShape(9.dp))
                                .clickable { filtroTipo = key; pagina = 0 }
                                .padding(horizontal = 12.dp, vertical = 7.dp)
                        ) {
                            Text(
                                Traducciones.texto(labelClave, idioma),
                                color = if (activo) Color.White else Color(0xFF64748B),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // Estado vacío (dashed como el web)
            if (listaPagina.isEmpty()) {
                item {
                    if (!RepositorioOffline.hayDatosOffline()) {
                        AvisoSinBaseDatos(idioma = idioma, tokens = t, oscuro = oscuro)
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 28.dp)
                                .border(2.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(16.dp))
                                .padding(vertical = 48.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Outlined.NotificationsOff, contentDescription = null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(48.dp))
                            Spacer(Modifier.height(10.dp))
                            Text(Traducciones.texto("alertas.sinAlertas", idioma), fontSize = 17.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                            Spacer(Modifier.height(4.dp))
                            Text(
                                if (busqueda.isNotEmpty()) Traducciones.texto("alertas.intentaOtro", idioma)
                                else Traducciones.texto("alertas.sinAlertasDesc", idioma),
                                fontSize = 13.sp,
                                color = t.textoSecundario,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            } else {
                // Filas (tarjetas con todas las columnas del web)
                items(listaPagina, key = { it.id }) { alerta ->
                    FilaAlerta(
                        alerta = alerta,
                        t = t,
                        idioma = idioma,
                        oscuro = oscuro,
                        onResolver = { cambiarEstado(alerta.id, "resuelta") },
                        onDescartar = { cambiarEstado(alerta.id, "descartada") },
                        onReactivar = { cambiarEstado(alerta.id, "activa") },
                        onVer = { alerta.contratoId?.let(onVerContrato) },
                        onEliminar = { modalEliminar = alerta }
                    )
                }
            }

            // Paginación
            if (totalPaginas > 1) {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 14.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                                .alpha(if (paginaSegura > 0) 1f else 0.35f)
                                .clickable(enabled = paginaSegura > 0) { pagina-- }
                                .padding(2.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.ChevronLeft, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
                        }
                        Text(
                            text = "${paginaSegura + 1} / $totalPaginas",
                            color = t.textoSecundario,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 12.dp)
                        )
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                                .alpha(if (paginaSegura < totalPaginas - 1) 1f else 0.35f)
                                .clickable(enabled = paginaSegura < totalPaginas - 1) { pagina++ }
                                .padding(2.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }

    // Modal nueva alerta (funcional)
    if (mostrarModalNueva) {
        ModalNuevaAlerta(
            idioma = idioma,
            t = t,
            oscuro = oscuro,
            onCerrar = { mostrarModalNueva = false },
            onCrear = { tipo, contratoId, mensaje ->
                val contrato = obtenerAlertasPantalla().firstOrNull { it.contratoId == contratoId }
                alertas = listOf(
                    AlertaItem(
                        id = (alertas.maxOfOrNull { it.id } ?: 0) + 1,
                        tipo = tipo,
                        mensaje = mensaje,
                        estado = "activa",
                        contrato = contrato?.contrato ?: "Sin contrato",
                        contratoId = contratoId,
                        cliente = contrato?.cliente ?: "",
                        cuotaNumero = null,
                        cuotaMonto = null,
                        fechaVencimiento = "",
                        cuotaVencida = false,
                        fecha = ""
                    )
                ) + alertas
                mostrarModalNueva = false
            }
        )
    }

    // Modal confirmar eliminar
    modalEliminar?.let { alerta ->
        ModalConfirmarEliminarAlerta(
            alerta = alerta,
            idioma = idioma,
            t = t,
            onCancelar = { modalEliminar = null },
            onConfirmar = {
                alertas = alertas.filter { it.id != alerta.id }
                modalEliminar = null
            }
        )
    }
}

private data class AlertaStat(
    val label: String,
    val valor: String,
    val icono: ImageVector,
    val colorFranja: Color,
    val colorIconoBg: Color,
    val colorIcono: Color
)

private data class AlertaItem(
    val id: Int,
    val tipo: String,
    val mensaje: String,
    val estado: String,
    val contrato: String,
    val contratoId: Int?,
    val cliente: String,
    val cuotaNumero: String?,
    val cuotaMonto: String?,
    val fechaVencimiento: String,
    val cuotaVencida: Boolean,
    val fecha: String
)

/** Alertas: del JSON importado si existe, vacío si no. */
private fun obtenerAlertasPantalla(): List<AlertaItem> {
    if (!RepositorioOffline.hayDatosOffline()) {
        return emptyList()
    }
    val alertas = RepositorioOffline.obtenerAlertas()
    val contratos = RepositorioOffline.obtenerContratos()
    val clientes = RepositorioOffline.obtenerClientesFin()
    return alertas.map { a ->
        val contrato = contratos.firstOrNull { it.id == a.contratoId }
        val cliente = clientes.firstOrNull { it.id == contrato?.clienteId }
        AlertaItem(
            id = a.id,
            tipo = a.tipo,
            mensaje = a.mensaje,
            estado = a.estado,
            contrato = contrato?.numero ?: "FIN",
            contratoId = a.contratoId.takeIf { it > 0 },
            cliente = "${cliente?.nombre ?: "Cliente"} ${cliente?.apellidos ?: ""}".trim(),
            cuotaNumero = null,
            cuotaMonto = null,
            fechaVencimiento = "",
            cuotaVencida = false,
            fecha = a.fecha.take(10)
        )
    }
}

@Composable
private fun AlertaStatCard(stat: AlertaStat, t: TokensWeb, idioma: Idioma, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Box(Modifier.fillMaxWidth().height(3.dp).background(stat.colorFranja, RoundedCornerShape(50)))
        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .background(stat.colorIconoBg, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(stat.icono, contentDescription = null, tint = stat.colorIcono, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(stat.valor, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    Traducciones.texto(stat.label, idioma).uppercase(),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.4.sp,
                    color = t.textoTerciario,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun FilaAlerta(
    alerta: AlertaItem,
    t: TokensWeb,
    idioma: Idioma,
    oscuro: Boolean,
    onResolver: () -> Unit,
    onDescartar: () -> Unit,
    onReactivar: () -> Unit,
    onVer: () -> Unit,
    onEliminar: () -> Unit
) {
    val (tipoBg, tipoColor, tipoIcono, tipoLabel) = when (alerta.tipo) {
        "mora" -> Quadruple(Color(0xFFFEE2E2), Color(0xFF991B1B), Icons.Outlined.Warning, Traducciones.texto("alertas.mora", idioma))
        "incumplimiento" -> Quadruple(Color(0xFFEDE9FE), Color(0xFF5B21B6), Icons.Outlined.ErrorOutline, Traducciones.texto("alertas.incumplimiento", idioma))
        "otro" -> Quadruple(Color(0xFFDBEAFE), Color(0xFF1E40AF), Icons.Outlined.Info, Traducciones.texto("alertas.otro", idioma))
        else -> Quadruple(Color(0xFFFEF3C7), Color(0xFF92400E), Icons.Outlined.Timelapse, Traducciones.texto("alertas.vencimiento", idioma))
    }

    val (estadoBg, estadoColor, estadoLabel) = when (alerta.estado) {
        "resuelta" -> Triple(Color(0xFFD1FAE5), Color(0xFF065F46), Traducciones.texto("alertas.resuelta", idioma))
        "descartada" -> Triple(Color(0xFFF1F5F9), Color(0xFF64748B), Traducciones.texto("alertas.descartada", idioma))
        else -> Triple(Color(0xFFFEE2E2), Color(0xFF991B1B), Traducciones.texto("alertas.activa", idioma))
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 5.dp)
            .alpha(if (alerta.estado == "activa") 1f else 0.55f)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        // Tipo badge + estado badge
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Row(
                modifier = Modifier
                    .background(tipoBg, RoundedCornerShape(50))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(tipoIcono, contentDescription = null, tint = tipoColor, modifier = Modifier.size(11.dp))
                Spacer(Modifier.width(4.dp))
                Text(tipoLabel, color = tipoColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.weight(1f))
            Box(
                modifier = Modifier
                    .background(estadoBg, RoundedCornerShape(50))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(estadoLabel, color = estadoColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Mensaje
        Spacer(Modifier.height(8.dp))
        Text(
            text = alerta.mensaje,
            color = t.textoSecundario,
            fontSize = 13.sp,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.fillMaxWidth()
        )

        // Contrato (link sky) + Cliente (avatar gradiente)
        Spacer(Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(Traducciones.texto("alertas.contrato", idioma), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario)
                Text(alerta.contrato, color = Color(0xFF0EA5E9), fontSize = 13.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Spacer(Modifier.width(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(alerta.cliente.take(1), color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(6.dp))
                Text(alerta.cliente, color = t.textoPrimario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }

        // Cuota + Vencimiento + Fecha
        Spacer(Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            // Cuota
            Column(modifier = Modifier.weight(1f)) {
                Text(Traducciones.texto("alertas.cuota", idioma), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario)
                if (alerta.cuotaNumero != null) {
                    Text("#${alerta.cuotaNumero}", color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    if (alerta.cuotaMonto != null) {
                        Text(alerta.cuotaMonto, color = t.textoTerciario, fontSize = 11.sp)
                    }
                } else {
                    Text("—", color = t.textoTerciario, fontSize = 13.sp)
                }
            }
            // Vencimiento
            Column(modifier = Modifier.weight(1f)) {
                Text(Traducciones.texto("alertas.vencimientoCol", idioma), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario)
                if (alerta.fechaVencimiento.isNotEmpty()) {
                    Text(
                        alerta.fechaVencimiento,
                        color = if (alerta.cuotaVencida) Color(0xFFEF4444) else t.textoPrimario,
                        fontSize = 13.sp,
                        fontWeight = if (alerta.cuotaVencida) FontWeight.Bold else FontWeight.SemiBold
                    )
                } else {
                    Text("—", color = t.textoTerciario, fontSize = 13.sp)
                }
            }
            // Fecha
            Column(horizontalAlignment = Alignment.End) {
                Text(Traducciones.texto("alertas.fecha", idioma), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = t.textoTerciario)
                Text(if (alerta.fecha.isNotEmpty()) alerta.fecha else "—", color = t.textoSecundario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }

        // Acciones (como el web: 32dp cuadrados con borde; 4 botones, sin calendario)
        Spacer(Modifier.height(10.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            if (alerta.estado == "activa") {
                BotonAccionAlerta(Icons.Outlined.Check, Color(0xFF10B981), if (oscuro) Color(0xFF022C22) else Color(0xFFA7F3D0), onResolver)
                BotonAccionAlerta(Icons.Outlined.Block, Color(0xFF94A3B8), if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0), onDescartar)
            } else {
                BotonAccionAlerta(Icons.Outlined.Refresh, Color(0xFFF59E0B), if (oscuro) Color(0xFF451A03) else Color(0xFFFDE68A), onReactivar)
            }
            if (alerta.contrato.isNotEmpty()) {
                BotonAccionAlerta(Icons.Outlined.Visibility, Color(0xFF0EA5E9), if (oscuro) Color(0xFF0C4A6E) else Color(0xFFBAE6FD), onVer)
            }
            BotonAccionAlerta(Icons.Outlined.Delete, Color(0xFFEF4444), if (oscuro) Color(0xFF450A0A) else Color(0xFFFECACA), onEliminar)
        }
    }
}

@Composable
private fun BotonAccionAlerta(icono: ImageVector, color: Color, borde: Color, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(32.dp)
            .border(1.dp, borde, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(15.dp))
    }
}

@Composable
private fun ModalNuevaAlerta(
    idioma: Idioma,
    t: TokensWeb,
    oscuro: Boolean,
    onCerrar: () -> Unit,
    onCrear: (String, Int?, String) -> Unit
) {
    var tipo by remember { mutableStateOf("vencimiento") }
    var contratoId by remember { mutableStateOf<Int?>(null) }
    var mensaje by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    val contratosDisponibles = obtenerAlertasPantalla().filter { it.contratoId != null }.distinctBy { it.contratoId }

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
                    Text(
                        text = Traducciones.texto("alertas.nuevaManual", idioma),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = t.textoPrimario,
                        modifier = Modifier.weight(1f)
                    )
                    Box(modifier = Modifier.clickable(onClick = onCerrar).padding(6.dp)) {
                        Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    }
                }

                Column(
                    modifier = Modifier
                        .padding(horizontal = 20.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    // Tipo (select)
                    Text(Traducciones.texto("alertas.tipoObligatorio", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                    Spacer(Modifier.height(6.dp))
                    SelectorModalAlerta(
                        seleccionado = tipo,
                        opciones = listOf(
                            "vencimiento" to Traducciones.texto("alertas.vencimiento", idioma),
                            "mora" to Traducciones.texto("alertas.mora", idioma),
                            "incumplimiento" to Traducciones.texto("alertas.incumplimiento", idioma),
                            "otro" to Traducciones.texto("alertas.otro", idioma)
                        ),
                        t = t,
                        onSeleccionar = { tipo = it; error = "" }
                    )

                    // Contrato asociado (select)
                    Text(Traducciones.texto("alertas.contratoAsociado", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(top = 12.dp))
                    Spacer(Modifier.height(6.dp))
                    SelectorModalAlerta(
                        seleccionado = contratoId?.toString() ?: "",
                        opciones = listOf("" to Traducciones.texto("alertas.sinContrato", idioma)) +
                                contratosDisponibles.map { it.contratoId.toString() to "${it.contrato} — ${it.cliente}" },
                        t = t,
                        onSeleccionar = { contratoId = it.toIntOrNull() }
                    )

                    // Mensaje (textarea)
                    Text(Traducciones.texto("alertas.mensajeObligatorio", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(top = 12.dp))
                    Spacer(Modifier.height(6.dp))
                    CampoWeb(valor = mensaje, onValor = { mensaje = it; error = "" }, tokens = t, placeholder = Traducciones.texto("alertas.describe", idioma), alto = 80, modifier = Modifier.fillMaxWidth())

                    if (error.isNotEmpty()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 10.dp)
                                .background(if (oscuro) Color(0xFF450A0A) else Color(0xFFFEE2E2), RoundedCornerShape(9.dp))
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.Warning, contentDescription = null, tint = if (oscuro) Color(0xFFFCA5A5) else Color(0xFF991B1B), modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(error, color = if (oscuro) Color(0xFFFCA5A5) else Color(0xFF991B1B), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

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
                        Text(Traducciones.texto("base.cancelar", idioma), color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF059669))), RoundedCornerShape(10.dp))
                            .clickable {
                                if (mensaje.trim().isEmpty()) error = Traducciones.texto("alertas.mensajeRequerido", idioma)
                                else onCrear(tipo, contratoId, mensaje.trim())
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("alertas.crear", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun SelectorModalAlerta(
    seleccionado: String,
    opciones: List<Pair<String, String>>,
    t: TokensWeb,
    onSeleccionar: (String) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(t.fondoContenido, RoundedCornerShape(9.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(9.dp))
                .clickable { expandido = !expandido }
                .padding(horizontal = 12.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                opciones.firstOrNull { it.first == seleccionado }?.second ?: seleccionado,
                color = t.textoPrimario,
                fontSize = 14.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
            Icon(
                if (expandido) Icons.Outlined.KeyboardArrowUp else Icons.Outlined.KeyboardArrowDown,
                contentDescription = null,
                tint = t.textoSecundario,
                modifier = Modifier.size(18.dp)
            )
        }

        if (expandido) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 160.dp)
                    .padding(top = 4.dp)
                    .background(t.fondoContenido, RoundedCornerShape(9.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                    .verticalScroll(rememberScrollState())
            ) {
                opciones.forEach { (valor, etiqueta) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(if (valor == seleccionado) t.primarioClaro else Color.Transparent, RoundedCornerShape(8.dp))
                            .clickable {
                                onSeleccionar(valor)
                                expandido = false
                            }
                            .padding(horizontal = 12.dp, vertical = 11.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(etiqueta, color = if (valor == seleccionado) t.primario else t.textoSecundario, fontSize = 13.sp, fontWeight = if (valor == seleccionado) FontWeight.Bold else FontWeight.Normal, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                        if (valor == seleccionado) {
                            Icon(Icons.Outlined.Check, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ModalConfirmarEliminarAlerta(
    alerta: AlertaItem,
    idioma: Idioma,
    t: TokensWeb,
    onCancelar: () -> Unit,
    onConfirmar: () -> Unit
) {
    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCancelar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = true)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000))
                .clickable(onClick = onCancelar),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                    .padding(horizontal = 24.dp, vertical = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
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
                    text = Traducciones.texto("alertas.eliminarTitulo", idioma),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = t.textoPrimario
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = Traducciones.texto("alertas.eliminarTexto", idioma),
                    fontSize = 14.sp,
                    color = t.textoSecundario,
                    lineHeight = 20.sp,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(22.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.fondoTerciario, RoundedCornerShape(9.dp))
                            .clickable(onClick = onCancelar)
                            .padding(vertical = 11.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("base.cancelar", idioma), color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(Color(0xFFEF4444), Color(0xFFDC2626))), RoundedCornerShape(9.dp))
                            .clickable(onClick = onConfirmar)
                            .padding(vertical = 11.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("alertas.eliminar", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
