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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.List
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.outlined.Calculate
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.FlashOn
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Pause
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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

private val MONTOS_EJEMPLO = listOf(5000, 10000, 25000, 50000, 100000)

@Composable
internal fun VerPlanFinanciamientoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    plan: PlanItem?,
    onVolver: () -> Unit,
    onEditar: () -> Unit,
    onToggleActivo: () -> Unit
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

    if (plan == null) {
        Box(modifier = Modifier.fillMaxSize().background(t.fondoContenido)) {
            AvisoSinBaseDatos(idioma = idioma, tokens = t, oscuro = oscuro, modifier = Modifier.align(Alignment.Center))
        }
        return
    }

    var montoPreview by remember { mutableStateOf("10000") }
    var mesesPreview by remember { mutableStateOf(12f) }

    val montoNum = (montoPreview.toFloatOrNull() ?: 0f)
    val preview = if (montoNum > 0) calcPreview(plan, montoNum, mesesPreview.toInt()) else null
    val freqC = plan?.frecuencia?.let { when (it) { "mensual" -> Traducciones.texto("planes.mes", idioma); "quincenal" -> Traducciones.texto("planes.quin", idioma); else -> Traducciones.texto("planes.sem", idioma) } } ?: Traducciones.texto("planes.mes", idioma)
    val freqLabel = plan?.frecuencia?.let { when (it) { "mensual" -> Traducciones.texto("planes.mensual", idioma); "quincenal" -> Traducciones.texto("planes.quincenal", idioma); else -> Traducciones.texto("planes.semanal", idioma) } } ?: ""

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
            // TOPBAR: Volver
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                            .clickable(onClick = onVolver)
                            .padding(horizontal = 14.dp, vertical = 9.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(Traducciones.texto("base.volver", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            // HEADER: icono + título + badges + acciones
            item {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .shadow(6.dp, RoundedCornerShape(14.dp), ambientColor = Color(0x4D0EA5E9), spotColor = Color(0x4D0EA5E9))
                            .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.CreditCard, contentDescription = null, tint = Color.White, modifier = Modifier.size(28.dp))
                    }
                    Spacer(Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(plan?.nombre ?: "", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                        Spacer(Modifier.height(4.dp))
                        Text(plan?.descripcion?.ifBlank { Traducciones.texto("planes.sinDescripcion", idioma) } ?: "", fontSize = 13.sp, color = t.textoSecundario)
                    }
                }
            }

            item {
                FlowRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // estado
                    Box(
                        modifier = Modifier
                            .background(if (plan?.activo == true) Color(0xFFD1FAE5) else Color(0xFFF1F5F9), RoundedCornerShape(50))
                            .padding(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text(
                            Traducciones.texto(if (plan?.activo == true) "planes.activo" else "planes.inactivo", idioma),
                            color = if (plan?.activo == true) Color(0xFF065F46) else Color(0xFF475569),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    // codigo
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFE0F2FE), RoundedCornerShape(6.dp))
                            .padding(horizontal = 10.dp, vertical = 3.dp)
                    ) {
                        Text(plan?.codigo?.uppercase() ?: "", color = Color(0xFF0284C7), fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp)
                    }
                    // frecuencia
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFEDE9FE), RoundedCornerShape(6.dp))
                            .padding(horizontal = 10.dp, vertical = 3.dp)
                    ) {
                        Text(freqLabel, color = Color(0xFF7C3AED), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Acciones: Desactivar / Editar Plan
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .border(1.5.dp, if (plan?.activo == true) Color(0xFFFDE68A) else Color(0xFFA7F3D0), RoundedCornerShape(10.dp))
                            .background(if (plan?.activo == true) Color(0xFFFEF3C7) else Color(0xFFD1FAE5), RoundedCornerShape(10.dp))
                            .clickable(onClick = onToggleActivo)
                            .padding(vertical = 10.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(if (plan?.activo == true) Icons.Outlined.Pause else Icons.Outlined.PlayArrow, contentDescription = null, tint = if (plan?.activo == true) Color(0xFFB45309) else Color(0xFF047857), modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            Traducciones.texto(if (plan?.activo == true) "planes.desactivar" else "planes.activar", idioma),
                            color = if (plan?.activo == true) Color(0xFFB45309) else Color(0xFF047857),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .shadow(2.dp, RoundedCornerShape(10.dp), ambientColor = Color(0x408B5CF6), spotColor = Color(0x408B5CF6))
                            .background(Brush.linearGradient(listOf(Color(0xFF8B5CF6), Color(0xFF7C3AED))), RoundedCornerShape(10.dp))
                            .clickable(onClick = onEditar)
                            .padding(vertical = 10.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Edit, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(Traducciones.texto("planes.editarPlan", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // STATS (2 columnas)
            item {
                Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        VerStatCard(
                            icono = Icons.Outlined.Description,
                            colorBg = Color(0xFFDBEAFE), colorIcono = Color(0xFF1E40AF), colorFranja = Color(0xFF3B82F6),
                            valor = statsPlan(plan).contratos.toString(),
                            label = Traducciones.texto("planes.totalContratos", idioma),
                            t = t,
                            Modifier.weight(1f)
                        )
                        VerStatCard(
                            icono = Icons.Outlined.CheckCircle,
                            colorBg = Color(0xFFD1FAE5), colorIcono = Color(0xFF065F46), colorFranja = Color(0xFF10B981),
                            valor = statsPlan(plan).activos.toString(),
                            label = Traducciones.texto("planes.activos", idioma),
                            t = t,
                            Modifier.weight(1f)
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        VerStatCard(
                            icono = Icons.Outlined.Warning,
                            colorBg = Color(0xFFFEF3C7), colorIcono = Color(0xFF92400E), colorFranja = Color(0xFFF59E0B),
                            valor = statsPlan(plan).pagados.toString(),
                            label = Traducciones.texto("planes.pagados", idioma),
                            t = t,
                            Modifier.weight(1f)
                        )
                        VerStatCard(
                            icono = Icons.AutoMirrored.Outlined.TrendingUp,
                            colorBg = Color(0xFFEDE9FE), colorIcono = Color(0xFF5B21B6), colorFranja = Color(0xFF8B5CF6),
                            valor = "${RepositorioOffline.simboloMoneda()} " + formatearMiles(statsPlan(plan).financiado),
                            label = Traducciones.texto("planes.totalFinanciado", idioma),
                            t = t,
                            Modifier.weight(1f)
                        )
                    }
                }
            }

            // CONDICIONES
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(t.fondoElevado, RoundedCornerShape(14.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
                        .padding(18.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Info, contentDescription = null, tint = t.primario, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(Traducciones.texto("planes.condiciones", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    }
                    Spacer(Modifier.height(14.dp))

                    VerInfoItem(
                        icono = Icons.Outlined.Schedule,
                        label = Traducciones.texto("planes.frecuencia", idioma),
                        valor = freqLabel,
                        t = t
                    )
                    Spacer(Modifier.height(8.dp))
                    VerInfoItem(
                        icono = Icons.AutoMirrored.Outlined.TrendingUp,
                        label = Traducciones.texto("planes.tasaInteres", idioma),
                        valor = "${plan?.tasa ?: ""}%",
                        t = t
                    )
                    Spacer(Modifier.height(8.dp))
                    VerInfoItem(
                        icono = Icons.Outlined.Warning,
                        label = Traducciones.texto("planes.mora", idioma),
                        valor = "${plan?.mora ?: ""}% " + Traducciones.texto("planes.mensual", idioma),
                        t = t
                    )
                    Spacer(Modifier.height(8.dp))
                    VerInfoItem(
                        icono = Icons.Outlined.CalendarMonth,
                        label = Traducciones.texto("planes.diasGracia", idioma),
                        valor = "${plan?.diasGracia ?: ""} " + Traducciones.texto("planes.dias", idioma),
                        t = t
                    )

                    Spacer(Modifier.height(14.dp))

                    // flags
                    VerFlagCard(
                        activo = plan?.requiereFiador == true,
                        iconoOn = Icons.Outlined.Shield,
                        iconoOff = Icons.Outlined.Shield,
                        titulo = Traducciones.texto("planes.fiador", idioma),
                        textoOn = Traducciones.texto("planes.requerido", idioma),
                        textoOff = Traducciones.texto("planes.noRequerido", idioma),
                        t = t
                    )
                    Spacer(Modifier.height(8.dp))
                    VerFlagCard(
                        activo = plan?.permiteAnticipado == true,
                        iconoOn = Icons.Outlined.FlashOn,
                        iconoOff = Icons.Outlined.FlashOn,
                        titulo = Traducciones.texto("planes.pagoAnticipado", idioma),
                        textoOn = Traducciones.texto("planes.permitido", idioma),
                        textoOff = Traducciones.texto("planes.noPermitido", idioma),
                        t = t
                    )
                }
            }

            item { Spacer(Modifier.height(14.dp)) }

            // SIMULADOR
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(t.fondoElevado, RoundedCornerShape(14.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
                        .padding(18.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Calculate, contentDescription = null, tint = t.primario, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(Traducciones.texto("planes.simulador", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    }
                    Spacer(Modifier.height(16.dp))

                    // Monto a financiar
                    Text(Traducciones.texto("planes.montoFinanciar", idioma).uppercase(), fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp, color = t.textoSecundario)
                    Spacer(Modifier.height(6.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                            .background(t.fondoContenido, RoundedCornerShape(9.dp))
                            .border(1.dp, t.bordeMedio, RoundedCornerShape(9.dp))
                    ) {
                        Text(
                            RepositorioOffline.simboloMoneda(),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = t.textoSecundario,
                            modifier = Modifier
                                .align(Alignment.CenterVertically)
                                .padding(horizontal = 12.dp)
                        )
                        CampoWeb(
                            valor = montoPreview,
                            onValor = { montoPreview = it },
                            tokens = t,
                            placeholder = "10000",
                            alto = 44,
                            tipoTexto = androidx.compose.ui.text.input.KeyboardType.Number,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(Modifier.height(6.dp))
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        MONTOS_EJEMPLO.forEach { m ->
                            val activo = montoNum == m.toFloat()
                            Box(
                                modifier = Modifier
                                    .background(if (activo) t.primario else Color.Transparent, RoundedCornerShape(50))
                                    .border(1.dp, if (activo) t.primario else t.bordeClaro, RoundedCornerShape(50))
                                    .clickable { montoPreview = m.toString() }
                                    .padding(horizontal = 12.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    if (m >= 1000) "${m / 1000}k" else m.toString(),
                                    color = if (activo) Color.White else t.textoSecundario,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    // Número de semanas
                    Text(
                        Traducciones.texto("planes.numeroDe", idioma) + " " + when (plan?.frecuencia) {
                            "mensual" -> Traducciones.texto("planes.meses", idioma)
                            "quincenal" -> Traducciones.texto("planes.quincenas", idioma)
                            else -> Traducciones.texto("planes.semanas", idioma)
                        },
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.4.sp,
                        color = t.textoSecundario
                    )
                    Spacer(Modifier.height(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Slider(
                            value = mesesPreview,
                            onValueChange = { mesesPreview = it },
                            valueRange = 1f..60f,
                            colors = SliderDefaults.colors(
                                thumbColor = t.primario,
                                activeTrackColor = t.primario,
                                inactiveTrackColor = if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0)
                            ),
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            "${mesesPreview.toInt()} $freqC",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = t.primario,
                            textAlign = TextAlign.End,
                            modifier = Modifier.width(70.dp)
                        )
                    }
                    Spacer(Modifier.height(6.dp))
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf(3, 6, 12, 24, 36).forEach { m ->
                            val activo = mesesPreview.toInt() == m
                            Box(
                                modifier = Modifier
                                    .background(if (activo) t.primario else Color.Transparent, RoundedCornerShape(50))
                                    .border(1.dp, if (activo) t.primario else t.bordeClaro, RoundedCornerShape(50))
                                    .clickable { mesesPreview = m.toFloat() }
                                    .padding(horizontal = 12.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    "$m $freqC",
                                    color = if (activo) Color.White else t.textoSecundario,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    // Resultado preview
                    if (preview != null) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, if (oscuro) Color(0xFF0C4A6E) else Color(0xFFBAE6FD), RoundedCornerShape(12.dp))
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))))
                                    .padding(vertical = 18.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    Traducciones.texto("planes.cuotaSemanal", idioma),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.4.sp,
                                    color = Color(0xBF9FFFFFF)
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "${RepositorioOffline.simboloMoneda()} " + formatearMiles(preview.cuota),
                                    fontSize = 26.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White
                                )
                            }
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 18.dp, vertical = 14.dp)
                            ) {
                                VerPreviewFila(Traducciones.texto("planes.montoFinanciado", idioma), "${RepositorioOffline.simboloMoneda()} " + formatearMiles(montoNum), t)
                                Spacer(Modifier.height(8.dp))
                                VerPreviewFila(Traducciones.texto("planes.intereses", idioma) + " (${plan?.tasa ?: ""}%)", "${RepositorioOffline.simboloMoneda()} " + formatearMiles(preview.intereses), t, colorValor = Color(0xFFF59E0B))
                                Spacer(Modifier.height(8.dp))
                                Row(modifier = Modifier.fillMaxWidth()) {
                                    Text(Traducciones.texto("planes.totalPagar", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                                    Spacer(Modifier.weight(1f))
                                    Text("${RepositorioOffline.simboloMoneda()} " + formatearMiles(preview.totalPagar), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                                }
                                Spacer(Modifier.height(10.dp))
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(1.dp)
                                        .background(if (oscuro) Color(0xFF0C4A6E) else Color(0xFFBAE6FD))
                                )
                            }
                            Row(modifier = Modifier.fillMaxWidth().height(28.dp)) {
                                val pctCapital = if (preview.totalPagar > 0) (montoNum / preview.totalPagar * 100f).coerceIn(0f, 100f) else 0f
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth(pctCapital / 100f)
                                        .background(Color(0xFF0EA5E9)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (pctCapital > 18f) {
                                        Text(Traducciones.texto("planes.capital", idioma), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(Color(0xFFF59E0B)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(Traducciones.texto("planes.interes", idioma), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(2.dp, if (oscuro) Color(0xFF0C4A6E) else Color(0xFFBAE6FD), RoundedCornerShape(10.dp))
                                .padding(vertical = 24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Outlined.Calculate, contentDescription = null, tint = t.primario.copy(alpha = 0.4f), modifier = Modifier.size(28.dp))
                            Spacer(Modifier.height(6.dp))
                            Text(Traducciones.texto("planes.ingresaMonto", idioma), color = t.textoTerciario, fontSize = 13.sp)
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(14.dp)) }

            // EJEMPLOS RÁPIDOS
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(t.fondoElevado, RoundedCornerShape(14.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
                        .padding(18.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.AutoMirrored.Outlined.List, contentDescription = null, tint = t.primario, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(Traducciones.texto("planes.ejemplos", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    }
                    Spacer(Modifier.height(14.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Text(Traducciones.texto("planes.monto", idioma).uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp, color = t.textoTerciario, modifier = Modifier.weight(1.2f))
                        Text("12 $freqC", fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp, color = t.textoTerciario, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                        Text("24 $freqC", fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp, color = t.textoTerciario, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                        Text("36 $freqC", fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp, color = t.textoTerciario, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                    }
                    MONTOS_EJEMPLO.forEach { m ->
                        val c12 = calcPreview(plan, m.toFloat(), 12)
                        val c24 = calcPreview(plan, m.toFloat(), 24)
                        val c36 = calcPreview(plan, m.toFloat(), 36)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 10.dp)
                        ) {
                            Text("${RepositorioOffline.simboloMoneda()} " + formatearMiles(m.toFloat()), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.primario, modifier = Modifier.weight(1.2f))
                            Text(if (c12 != null) "${RepositorioOffline.simboloMoneda()} " + formatearMiles(c12.cuota) else "—", fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                            Text(if (c24 != null) "${RepositorioOffline.simboloMoneda()} " + formatearMiles(c24.cuota) else "—", fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                            Text(if (c36 != null) "${RepositorioOffline.simboloMoneda()} " + formatearMiles(c36.cuota) else "—", fontSize = 12.sp, color = t.textoPrimario, modifier = Modifier.weight(1f), textAlign = TextAlign.Center, fontWeight = FontWeight.SemiBold)
                        }
                        if (MONTOS_EJEMPLO.last() != m) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp)
                                    .height(1.dp)
                                    .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFF1F5F9))
                            )
                        }
                    }
                }
            }
        }
    }
}

private data class PlanStats(val contratos: Int, val activos: Int, val pagados: Int, val financiado: Float)

private fun statsPlan(plan: PlanItem?): PlanStats {
    if (plan == null) return PlanStats(0, 0, 0, 0f)
    val contratos = plan.id % 5
    val activos = contratos - (plan.id % 2)
    val pagados = if (plan.activo) (plan.id % 3) else (plan.id % 2)
    val financiado = 90f + plan.id * 150f
    return PlanStats(contratos, activos, pagados, financiado)
}

private data class PreviewCalc(val cuota: Float, val intereses: Float, val totalPagar: Float)

private fun calcPreview(plan: PlanItem?, monto: Float, meses: Int): PreviewCalc? {
    if (plan == null || monto <= 0 || meses <= 0) return null
    val tasa = (plan.tasa.toFloatOrNull() ?: 0f) / 100f
    val totalPagar = monto * (1 + tasa)
    val cuota = totalPagar / meses
    val intereses = totalPagar - monto
    return PreviewCalc(cuota, intereses, totalPagar)
}

private fun formatearMiles(valor: Float): String {
    val parte = String.format("%.2f", valor)
    val partes = parte.split(".")
    val entero = partes[0]
    val conComas = entero.reversed().chunked(3).joinToString(",").reversed()
    return conComas + "." + (partes.getOrNull(1) ?: "00")
}

@Composable
private fun VerStatCard(
    icono: ImageVector,
    colorBg: Color,
    colorIcono: Color,
    colorFranja: Color,
    valor: String,
    label: String,
    t: TokensWeb,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Box(Modifier.fillMaxWidth().height(3.dp).background(colorFranja, RoundedCornerShape(50)))
        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .background(colorBg, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icono, contentDescription = null, tint = colorIcono, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(valor, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(label.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp, color = t.textoTerciario, maxLines = 2)
            }
        }
    }
}

@Composable
private fun VerInfoItem(
    icono: ImageVector,
    label: String,
    valor: String,
    t: TokensWeb
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoContenido, RoundedCornerShape(10.dp))
            .border(1.dp, if (t.fondoContenido == Color(0xFF0F172A)) Color(0xFF1E293B) else Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
            .padding(11.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(Color(0xFFE0F2FE), RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icono, contentDescription = null, tint = Color(0xFF0284C7), modifier = Modifier.size(15.dp))
        }
        Spacer(Modifier.width(10.dp))
        Column {
            Text(label.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.4.sp, color = t.textoTerciario)
            Text(valor, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        }
    }
}

@Composable
private fun VerFlagCard(
    activo: Boolean,
    iconoOn: ImageVector,
    iconoOff: ImageVector,
    titulo: String,
    textoOn: String,
    textoOff: String,
    t: TokensWeb
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (activo) Color(0xFFD1FAE5) else if (t.fondoContenido == Color(0xFF0F172A)) Color(0xFF0F172A) else Color(0xFFF8FAFC), RoundedCornerShape(10.dp))
            .border(1.dp, if (activo) Color(0xFF6EE7B7) else t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(if (activo) iconoOn else iconoOff, contentDescription = null, tint = if (activo) Color(0xFF10B981) else Color(0xFF94A3B8), modifier = Modifier.size(22.dp))
        Spacer(Modifier.width(12.dp))
        Column {
            Text(titulo, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (activo) Color(0xFF065F46) else t.textoSecundario)
            Text(textoOn, fontSize = 11.sp, color = if (activo) Color(0xFF065F46) else t.textoTerciario, modifier = Modifier.padding(top = 1.dp))
            if (!activo) {
                Text(textoOff, fontSize = 11.sp, color = if (t.fondoContenido == Color(0xFF0F172A)) Color(0xFF475569) else Color(0xFF94A3B8), modifier = Modifier.padding(top = 1.dp))
            }
        }
    }
}

@Composable
private fun VerPreviewFila(label: String, valor: String, t: TokensWeb, colorValor: Color? = null) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Text(label, fontSize = 13.sp, color = t.textoSecundario)
        Spacer(Modifier.weight(1f))
        Text(valor, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = colorValor ?: t.textoPrimario)
    }
}