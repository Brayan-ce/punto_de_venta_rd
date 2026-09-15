package com.isiweek.puntodeventa.pantallas.financiamiento

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.FlashOn
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

@Composable
internal fun NuevoPlanFinanciamientoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onVolver: () -> Unit,
    onCreado: (PlanItem) -> Unit
) {
    val acento = Color(0xFF10B981)
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
        primario = acento,
        primarioClaro = if (oscuro) acento.copy(alpha = 0.15f) else Color(0xFFD1FAE5),
        exito = acento
    )

    var nombre by remember { mutableStateOf("") }
    var frecuencia by remember { mutableStateOf("mensual") }
    var descripcion by remember { mutableStateOf("") }
    var tasa by remember { mutableStateOf("") }
    var mora by remember { mutableStateOf("5") }
    var diasGracia by remember { mutableStateOf("5") }
    var requiereFiador by remember { mutableStateOf(false) }
    var permiteAnticipado by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }

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

            // HEADER: icono verde + título + subtítulo
            item {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .shadow(6.dp, RoundedCornerShape(14.dp), ambientColor = Color(0x4D10B981), spotColor = Color(0x4D10B981))
                            .background(Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF059669))), RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(26.dp))
                    }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text(Traducciones.texto("planes.nuevoPlanTitulo", idioma), fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                        Text(Traducciones.texto("planes.nuevoPlanSubtitulo", idioma), fontSize = 13.sp, color = t.textoSecundario)
                    }
                }
            }

            // ══ INFORMACIÓN GENERAL ══
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                        .background(t.fondoElevado, RoundedCornerShape(14.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
                        .padding(18.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Info, contentDescription = null, tint = acento, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(Traducciones.texto("planes.informacionGeneral", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    }
                    Spacer(Modifier.height(16.dp))

                    // Nombre del Plan *
                    LabelPlanForm(Traducciones.texto("planes.nombrePlan", idioma), t)
                    CampoWeb(
                        valor = nombre,
                        onValor = { nombre = it; error = "" },
                        tokens = t,
                        placeholder = Traducciones.texto("planes.placeholderNombre", idioma),
                        alto = 44,
                        modifier = Modifier.padding(top = 6.dp)
                    )

                    Spacer(Modifier.height(14.dp))

                    // Frecuencia de cobro *
                    LabelPlanForm(Traducciones.texto("planes.frecuenciaCobro", idioma), t)
                    Spacer(Modifier.height(4.dp))
                    SelectorFrecuenciaPlan(
                        frecuencia = frecuencia,
                        onCambio = { frecuencia = it },
                        t = t,
                        idioma = idioma,
                        acento = acento,
                        oscuro = oscuro
                    )

                    Spacer(Modifier.height(14.dp))

                    // Descripción (opcional)
                    LabelPlanForm(Traducciones.texto("planes.descripcion", idioma), t, opcional = true)
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp)
                            .background(t.fondoContenido, RoundedCornerShape(9.dp))
                            .border(1.dp, t.bordeMedio, RoundedCornerShape(9.dp))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        CampoWeb(
                            valor = descripcion,
                            onValor = { descripcion = it },
                            tokens = t,
                            placeholder = Traducciones.texto("planes.placeholderDescripcion", idioma),
                            alto = 60
                        )
                    }
                }
            }

            item { Spacer(Modifier.height(10.dp)) }

            // ══ TASAS Y MORA ══
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                        .background(t.fondoElevado, RoundedCornerShape(14.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
                        .padding(18.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.AutoMirrored.Outlined.TrendingUp, contentDescription = null, tint = acento, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(Traducciones.texto("planes.tasasMora", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    }
                    Spacer(Modifier.height(16.dp))

                    // Tasa de interés
                    LabelPlanForm(Traducciones.texto("planes.tasaInteres", idioma), t)
                    CampoSufijoPlan(
                        valor = tasa,
                        onValor = { tasa = it },
                        t = t,
                        sufijo = "%",
                        placeholder = "0.00",
                        acento = acento
                    )
                    HintPlanForm(Traducciones.texto("planes.hintTasa", idioma), t)

                    Spacer(Modifier.height(14.dp))

                    // Mora por atraso
                    LabelPlanForm(Traducciones.texto("planes.moraAtraso", idioma), t)
                    CampoSufijoPlan(
                        valor = mora,
                        onValor = { mora = it },
                        t = t,
                        sufijo = "%",
                        placeholder = "5.00",
                        acento = acento
                    )
                    HintPlanForm(Traducciones.texto("planes.hintMora", idioma), t)

                    Spacer(Modifier.height(14.dp))

                    // Días de gracia
                    LabelPlanForm(Traducciones.texto("planes.diasGracia", idioma), t)
                    CampoWeb(
                        valor = diasGracia,
                        onValor = { diasGracia = it },
                        tokens = t,
                        placeholder = "5",
                        alto = 44,
                        tipoTexto = KeyboardType.Number,
                        modifier = Modifier.padding(top = 6.dp).width(180.dp)
                    )
                    HintPlanForm(Traducciones.texto("planes.hintGracia", idioma), t)
                }
            }

            item { Spacer(Modifier.height(10.dp)) }

            // ══ CONDICIONES DEL PLAN ══
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                        .background(t.fondoElevado, RoundedCornerShape(14.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
                        .padding(18.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Shield, contentDescription = null, tint = acento, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(Traducciones.texto("planes.condicionesPlan", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    }
                    Spacer(Modifier.height(14.dp))

                    ToggleCondicionPlan(
                        titulo = Traducciones.texto("planes.requiereFiador", idioma),
                        descripcion = Traducciones.texto("planes.hintFiador", idioma),
                        activo = requiereFiador,
                        onToggle = { requiereFiador = !requiereFiador },
                        t = t,
                        oscuro = oscuro,
                        acento = acento,
                        iconoOn = Icons.Outlined.Shield,
                        colorOn = Color(0xFF059669)
                    )
                    Spacer(Modifier.height(10.dp))
                    ToggleCondicionPlan(
                        titulo = Traducciones.texto("planes.permiteAnticipado", idioma),
                        descripcion = Traducciones.texto("planes.hintAnticipado", idioma),
                        activo = permiteAnticipado,
                        onToggle = { permiteAnticipado = !permiteAnticipado },
                        t = t,
                        oscuro = oscuro,
                        acento = acento,
                        iconoOn = Icons.Outlined.FlashOn,
                        colorOn = Color(0xFF059669)
                    )
                }
            }

            // Error
            if (error.isNotEmpty()) {
                item {
                    ErrorMsgPlan(error, Modifier.padding(horizontal = 14.dp, vertical = 10.dp))
                }
            }

            // ══ ACCIONES ══
            item {
                Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp)) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(t.bordeClaro)
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 18.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                                .clickable(onClick = onVolver)
                                .padding(vertical = 11.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(Traducciones.texto("base.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        }
                        Row(
                            modifier = Modifier
                                .weight(1f)
                                .shadow(2.dp, RoundedCornerShape(9.dp), ambientColor = Color(0x4010B981), spotColor = Color(0x4010B981))
                                .background(Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF059669))), RoundedCornerShape(9.dp))
                                .clickable {
                                    if (nombre.trim().isEmpty()) {
                                        error = Traducciones.texto("planes.nombreRequerido", idioma)
                                    } else if (parseFloatSeguro(tasa) > 999.99f) {
                                        error = Traducciones.texto("planes.tasaMax", idioma)
                                    } else if (parseFloatSeguro(mora) > 999.99f) {
                                        error = Traducciones.texto("planes.moraMax", idioma)
                                    } else {
                                        val nuevoPlan = PlanItem(
                                            id = if (RepositorioOffline.hayDatosOffline()) RepositorioOffline.siguientePlanId() else 999,
                                            nombre = nombre.trim(),
                                            codigo = "PLAN-NUEVO",
                                            tasa = tasa.ifBlank { "0" },
                                            frecuencia = frecuencia,
                                            mora = mora.ifBlank { "5" },
                                            diasGracia = diasGracia.ifBlank { "5" },
                                            activo = true,
                                            opciones = emptyList(),
                                            requiereFiador = requiereFiador,
                                            permiteAnticipado = permiteAnticipado,
                                            descripcion = descripcion.trim()
                                        )
                                        if (RepositorioOffline.hayDatosOffline()) {
                                            RepositorioOffline.guardarPlan(nuevoPlan.aPlanOffline())
                                        }
                                        onCreado(nuevoPlan)
                                    }
                                }
                                .padding(vertical = 11.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("planes.crearPlan", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

private fun parseFloatSeguro(valor: String): Float {
    return valor.toFloatOrNull() ?: 0f
}