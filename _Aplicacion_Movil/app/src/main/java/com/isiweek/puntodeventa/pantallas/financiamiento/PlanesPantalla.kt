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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Pause
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material.icons.outlined.Schedule
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
fun PlanesPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevoPlan: () -> Unit,
    onVerPlan: (Int) -> Unit,
    onEditarPlan: (Int) -> Unit
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
        primario = Color(0xFF0EA5E9),
        primarioClaro = if (oscuro) Color(0xFF0EA5E9).copy(alpha = 0.15f) else Color(0xFFE0F2FE),
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

    var planes by remember(RepositorioOffline.version) { mutableStateOf(obtenerPlanesPantalla()) }
    var busqueda by remember { mutableStateOf("") }
    var filtroActivo by remember { mutableStateOf("activos") }
    var pagina by remember { mutableStateOf(0) }
    var planAEliminar by remember { mutableStateOf<PlanItem?>(null) }

    val filtrados = planes.filter {
        (busqueda.isBlank() || it.nombre.contains(busqueda, ignoreCase = true) || it.codigo.contains(busqueda, ignoreCase = true)) &&
                (filtroActivo == "todos" || (filtroActivo == "activos" && it.activo) || (filtroActivo == "inactivos" && !it.activo))
    }

    val stats = listOf(
        PlanStat("planes.estadTotal", planes.size.toString(), Icons.Outlined.Description, Color(0xFF3B82F6), Color(0xFFDBEAFE), Color(0xFF1E40AF)),
        PlanStat("planes.estadActivos", planes.count { it.activo }.toString(), Icons.Outlined.CheckCircle, Color(0xFF10B981), Color(0xFFD1FAE5), Color(0xFF065F46)),
        PlanStat("planes.estadInactivos", planes.count { !it.activo }.toString(), Icons.Outlined.Pause, Color(0xFF94A3B8), Color(0xFFF1F5F9), Color(0xFF475569)),
        PlanStat("planes.estadPlazos", planes.sumOf { it.opciones.size }.toString(), Icons.Outlined.Timelapse, Color(0xFFF59E0B), Color(0xFFFEF3C7), Color(0xFF92400E))
    )

    val PAGE_SIZE = 8
    val totalPaginas = if (filtrados.isEmpty()) 0 else (filtrados.size + PAGE_SIZE - 1) / PAGE_SIZE
    val paginaSegura = if (totalPaginas == 0) 0 else pagina.coerceIn(0, totalPaginas - 1)
    val listaPagina = filtrados.drop(paginaSegura * PAGE_SIZE).take(PAGE_SIZE)

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
            // -- HERO (hace scroll junto al contenido, como el web) --
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
                                .shadow(6.dp, RoundedCornerShape(14.dp), ambientColor = Color(0x4D0EA5E9), spotColor = Color(0x4D0EA5E9))
                                .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(14.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.Description, contentDescription = null, tint = Color.White, modifier = Modifier.size(28.dp))
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = Traducciones.texto("planes.titulo", idioma),
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = t.textoPrimario
                            )
                            Text(
                                text = Traducciones.texto("planes.subtitulo", idioma),
                                fontSize = 13.sp,
                                color = t.textoSecundario
                            )
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    // Nuevo Plan (verde gradiente, ancho completo en m�vil como el web)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .shadow(2.dp, RoundedCornerShape(11.dp), ambientColor = Color(0x4010B981), spotColor = Color(0x4010B981))
                            .background(Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF059669))), RoundedCornerShape(11.dp))
                            .clickable { onNuevoPlan() }
                            .padding(vertical = 11.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(Traducciones.texto("planes.nuevo", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // -- STATS (2 columnas, franja superior de color) --
            items(stats.chunked(2)) { fila ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    fila.forEach { stat ->
                        PlanStatCard(stat, t, idioma, Modifier.weight(1f))
                    }
                    if (fila.size == 1) Spacer(Modifier.weight(1f))
                }
            }

            // Buscador con bot�n limpiar
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
                            placeholder = Traducciones.texto("planes.buscar", idioma),
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

            // Filtros (activo sky #0EA5E9)
            item {
                FlowRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("todos" to "planes.todos", "activos" to "planes.activos", "inactivos" to "planes.inactivos").forEach { (key, labelClave) ->
                        val activo = filtroActivo == key
                        Box(
                            modifier = Modifier
                                .background(if (activo) Color(0xFF0EA5E9) else t.fondoPrincipal, RoundedCornerShape(9.dp))
                                .border(1.dp, if (activo) Color(0xFF0EA5E9) else t.bordeClaro, RoundedCornerShape(9.dp))
                                .clickable { filtroActivo = key; pagina = 0 }
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(
                                Traducciones.texto(labelClave, idioma),
                                color = if (activo) Color.White else Color(0xFF64748B),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // Estado vac�o (dashed como el web)
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
                            Icon(Icons.Outlined.Description, contentDescription = null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(48.dp))
                            Spacer(Modifier.height(10.dp))
                            Text(Traducciones.texto("planes.sinPlanes", idioma), fontSize = 17.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                            Spacer(Modifier.height(4.dp))
                            Text(
                                if (busqueda.isNotEmpty()) Traducciones.texto("planes.intentaOtro", idioma)
                                else Traducciones.texto("planes.primerPlan", idioma),
                                fontSize = 13.sp,
                                color = t.textoSecundario,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            } else {
                // Cards de planes (paginadas)
                items(listaPagina, key = { it.id }) { plan ->
                    CardPlan(
                        plan = plan,
                        t = t,
                        idioma = idioma,
                        oscuro = oscuro,
                        onVer = { onVerPlan(plan.id) },
                        onEditar = { onEditarPlan(plan.id) },
                        onToggle = {
                            val nuevo = planes.map { if (it.id == plan.id) it.copy(activo = !it.activo) else it }
                            planes = nuevo
                            if (RepositorioOffline.hayDatosOffline()) {
                                val p = nuevo.firstOrNull { it.id == plan.id }
                                if (p != null) RepositorioOffline.guardarPlan(p.aPlanOffline())
                            }
                        },
                        onEliminar = { planAEliminar = plan }
                    )
                }
            }

            // Paginaci�n
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

    planAEliminar?.let { plan ->
        ModalConfirmarEliminarPlan(
            plan = plan,
            idioma = idioma,
            t = t,
            onCancelar = { planAEliminar = null },
            onConfirmar = {
                planes = planes.filterNot { it.id == plan.id }
                if (RepositorioOffline.hayDatosOffline()) RepositorioOffline.eliminarPlan(plan.id)
                planAEliminar = null
            }
        )
    }
}

@Composable
private fun ModalConfirmarEliminarPlan(
    plan: PlanItem,
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
                    text = Traducciones.texto("planes.eliminarTitulo", idioma),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = t.textoPrimario
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = Traducciones.texto("planes.eliminarTexto", idioma).replace("{nombre}", plan.nombre),
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
                            Text(Traducciones.texto("planes.eliminar", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

private data class PlanStat(
    val label: String,
    val valor: String,
    val icono: ImageVector,
    val colorFranja: Color,
    val colorIconoBg: Color,
    val colorIcono: Color
)

internal data class PlanItem(
    val id: Int,
    val nombre: String,
    val codigo: String,
    val tasa: String,
    val frecuencia: String,
    val mora: String,
    val diasGracia: String,
    val activo: Boolean,
    val opciones: List<Int>,
    val requiereFiador: Boolean = false,
    val permiteAnticipado: Boolean = true,
    val descripcion: String = ""
)

internal val listaPlanesInicial = emptyList<PlanItem>()

@Composable
private fun PlanStatCard(stat: PlanStat, t: TokensWeb, idioma: Idioma, modifier: Modifier = Modifier) {
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
private fun CardPlan(
    plan: PlanItem,
    t: TokensWeb,
    idioma: Idioma,
    oscuro: Boolean,
    onVer: () -> Unit,
    onEditar: () -> Unit,
    onToggle: () -> Unit,
    onEliminar: () -> Unit
) {
    val frecuenciaLabel = when (plan.frecuencia) {
        "mensual" -> Traducciones.texto("planes.mensual", idioma)
        "quincenal" -> Traducciones.texto("planes.quincenal", idioma)
        else -> Traducciones.texto("planes.semanal", idioma)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 5.dp)
            .alpha(if (plan.activo) 1f else 0.6f)
            .background(t.fondoPrincipal, RoundedCornerShape(14.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
            .padding(16.dp)
    ) {
        // Header: icono + nombre + c�digo + estado
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(Brush.linearGradient(listOf(Color(0xFFE0F2FE), Color(0xFFBAE6FD))), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Outlined.CreditCard, contentDescription = null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(plan.nombre, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(plan.codigo.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF0EA5E9), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Spacer(Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .background(if (plan.activo) Color(0xFFD1FAE5) else Color(0xFFF1F5F9), RoundedCornerShape(50))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(
                    text = Traducciones.texto(if (plan.activo) "planes.activo" else "planes.inactivo", idioma),
                    color = if (plan.activo) Color(0xFF065F46) else Color(0xFF475569),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(Modifier.height(14.dp))

        // Meta: inter�s / frecuencia / mora / gracia
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            MetaPlanPill(Icons.AutoMirrored.Outlined.TrendingUp, "${plan.tasa}% " + Traducciones.texto("planes.interes", idioma), oscuro)
            MetaPlanPill(Icons.Outlined.CalendarMonth, frecuenciaLabel, oscuro)
            MetaPlanPill(Icons.Outlined.Warning, "${plan.mora}% " + Traducciones.texto("planes.mora", idioma), oscuro)
            MetaPlanPill(Icons.Outlined.Schedule, "${plan.diasGracia}" + Traducciones.texto("planes.dGracia", idioma), oscuro)
        }

        Spacer(Modifier.height(14.dp))

        // Plazos disponibles
        Column(modifier = Modifier.fillMaxWidth()) {
            Text(Traducciones.texto("planes.plazosDisponibles", idioma).uppercase(), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.4.sp, color = t.textoTerciario)
            Spacer(Modifier.height(8.dp))
            if (plan.opciones.isEmpty()) {
                Text(Traducciones.texto("planes.sinPlazos", idioma), fontSize = 12.sp, color = t.textoTerciario)
            } else {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    plan.opciones.forEach { meses ->
                        val unidad = when (plan.frecuencia) {
                            "semanal" -> Traducciones.texto("planes.sem", idioma)
                            "quincenal" -> Traducciones.texto("planes.quin", idioma)
                            else -> Traducciones.texto("planes.mes", idioma)
                        }
                        Box(
                            modifier = Modifier
                                .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(50))
                                .padding(horizontal = 12.dp, vertical = 4.dp)
                        ) {
                            Text("$meses $unidad", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        // Flags: fiador / pago anticipado
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            if (plan.requiereFiador) {
                FlagPlan(Icons.Outlined.CheckCircle, "planes.fiadorRequerido", on = true, oscuro = oscuro, idioma)
            } else {
                FlagPlan(Icons.Outlined.PersonOutline, "planes.sinFiador", on = false, oscuro = oscuro, idioma)
            }
            if (plan.permiteAnticipado) {
                FlagPlan(Icons.Outlined.Bolt, "planes.pagoAnticipado", on = true, oscuro = oscuro, idioma)
            } else {
                FlagPlan(Icons.Outlined.Bolt, "planes.sinAnticipado", on = false, oscuro = oscuro, idioma)
            }
        }

        Spacer(Modifier.height(14.dp))

        // Acciones: Ver / Editar / Desactivar (grid 2 cols, toggle full width)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            BotonPlanAccion(Icons.Outlined.Visibility, "planes.ver", sky = true, idioma = idioma, oscuro = oscuro, Modifier.weight(1f), onClick = onVer)
            BotonPlanAccion(Icons.Outlined.Create, "planes.editar", sky = false, idioma = idioma, oscuro = oscuro, Modifier.weight(1f), onClick = onEditar)
        }
        Spacer(Modifier.height(8.dp))
        BotonPlanAccion(
            if (plan.activo) Icons.Outlined.Pause else Icons.Outlined.PlayArrow,
            if (plan.activo) "planes.desactivar" else "planes.activar",
            sky = null,
            idioma = idioma,
            oscuro = oscuro,
            Modifier.fillMaxWidth(),
            activo = plan.activo,
            onClick = onToggle
        )
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.5.dp, if (oscuro) Color(0xFF7F1D1D) else Color(0xFFFECACA), RoundedCornerShape(8.dp))
                .background(if (oscuro) Color(0xFF450A0A) else Color(0xFFFEF2F2), RoundedCornerShape(8.dp))
                .clickable(onClick = onEliminar)
                .padding(vertical = 10.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(15.dp))
            Spacer(Modifier.width(6.dp))
            Text(Traducciones.texto("planes.eliminar", idioma), color = Color(0xFFEF4444), fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun MetaPlanPill(icono: ImageVector, texto: String, oscuro: Boolean) {
    Row(
        modifier = Modifier
            .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF1F5F9), RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(13.dp))
        Spacer(Modifier.width(5.dp))
        Text(texto, color = if (oscuro) Color(0xFF94A3B8) else Color(0xFF475569), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun FlagPlan(icono: ImageVector, clave: String, on: Boolean, oscuro: Boolean, idioma: Idioma) {
    Row(
        modifier = Modifier
            .background(
                when {
                    on -> Color(0xFFD1FAE5)
                    oscuro -> Color(0xFF0F172A)
                    else -> Color(0xFFF1F5F9)
                },
                RoundedCornerShape(50)
            )
            .padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icono,
            contentDescription = null,
            tint = when {
                on -> Color(0xFF065F46)
                oscuro -> Color(0xFF475569)
                else -> Color(0xFF94A3B8)
            },
            modifier = Modifier.size(12.dp)
        )
        Spacer(Modifier.width(4.dp))
        Text(
            Traducciones.texto(clave, idioma),
            color = when {
                on -> Color(0xFF065F46)
                oscuro -> Color(0xFF475569)
                else -> Color(0xFF94A3B8)
            },
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun BotonPlanAccion(
    icono: ImageVector,
    clave: String,
    sky: Boolean?,
    idioma: Idioma,
    oscuro: Boolean,
    modifier: Modifier,
    activo: Boolean = true,
    onClick: () -> Unit = {}
) {
    val (bg, color, borde) = when {
        sky == true -> Triple(if (oscuro) Color(0xFF0C2D48) else Color(0xFFE0F2FE), if (oscuro) Color(0xFF38BDF8) else Color(0xFF0284C7), if (oscuro) Color(0xFF0369A1) else Color(0xFF7DD3FC))
        sky == false -> Triple(if (oscuro) Color(0xFF1E1040) else Color(0xFFEDE9FE), if (oscuro) Color(0xFFA78BFA) else Color(0xFF6D28D9), if (oscuro) Color(0xFF5B21B6) else Color(0xFFA78BFA))
        activo -> Triple(if (oscuro) Color(0xFF2D1A00) else Color(0xFFFEF3C7), if (oscuro) Color(0xFFFBBF24) else Color(0xFFB45309), if (oscuro) Color(0xFF92400E) else Color(0xFFFCD34D))
        else -> Triple(if (oscuro) Color(0xFF001F14) else Color(0xFFD1FAE5), if (oscuro) Color(0xFF34D399) else Color(0xFF047857), if (oscuro) Color(0xFF065F46) else Color(0xFF6EE7B7))
    }
    Row(
        modifier = modifier
            .border(1.5.dp, borde, RoundedCornerShape(8.dp))
            .background(bg, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(6.dp))
        Text(Traducciones.texto(clave, idioma), color = color, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

