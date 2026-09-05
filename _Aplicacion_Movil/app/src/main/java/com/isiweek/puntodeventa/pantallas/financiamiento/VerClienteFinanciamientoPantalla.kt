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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Call
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

internal data class ContratoDetalle(
    val numero: String,
    val plan: String,
    val estado: String,
    val financiado: String,
    val cuota: String,
    val pendiente: String,
    val cuotasPagadas: Int,
    val totalCuotas: Int,
    val cuotasVencidas: Int,
    val fechaInicio: String,
    val fechaFin: String
)

@Composable
internal fun VerClienteFinanciamientoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    cliente: ClienteFin? = null,
    contratosParam: List<ContratoDetalle> = emptyList(),
    onVolver: () -> Unit,
    onEditar: () -> Unit,
    onNuevoContrato: () -> Unit
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

    val contratos = contratosParam
    val totalActivos = contratos.count { it.estado == "activo" }
    val totalVencidas = contratos.sumOf { it.cuotasVencidas }
    val saldoTotal = if (contratos.isEmpty()) "${RepositorioOffline.simboloMoneda()} 0" else {
        RepositorioOffline.formatoMonto(contratos.sumOf { it.pendiente.replace(",", "").replace(RepositorioOffline.simboloMoneda(), "").replace(" ", "").toDoubleOrNull() ?: 0.0 })
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
            // TOPBAR: Volver + Editar + Nuevo Contrato
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
                    Spacer(Modifier.weight(1f))
                    Row(
                        modifier = Modifier
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                            .clickable(onClick = onEditar)
                            .padding(horizontal = 14.dp, vertical = 9.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Create, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(5.dp))
                        Text(Traducciones.texto("base.editar", idioma), color = t.textoSecundario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(Modifier.width(8.dp))
                    Row(
                        modifier = Modifier
                            .shadow(2.dp, RoundedCornerShape(9.dp), ambientColor = Color(0x400EA5E9), spotColor = Color(0x400EA5E9))
                            .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(9.dp))
                            .clickable(onClick = onNuevoContrato)
                            .padding(horizontal = 14.dp, vertical = 9.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(5.dp))
                        Text(Traducciones.texto("clientesFin.nuevoContrato", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // PERFIL CARD
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(t.fondoElevado, RoundedCornerShape(16.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(3.dp)
                            .background(Brush.horizontalGradient(listOf(Color(0xFF0EA5E9), Color(0xFF6366F1), Color(0xFF10B981))))
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .shadow(4.dp, CircleShape, ambientColor = Color(0x400EA5E9), spotColor = Color(0x400EA5E9))
                                .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("A", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
                        }
                        Spacer(Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("${cliente?.nombre ?: "—"} ${cliente?.apellidos ?: ""}".trim().ifBlank { "—" }, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(cliente?.documento?.ifBlank { "—" } ?: "—", fontSize = 14.sp, color = t.textoSecundario)
                            Spacer(Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Outlined.Call, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(13.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text(cliente?.telefono?.ifBlank { "—" } ?: "—", fontSize = 13.sp, color = t.textoSecundario)
                                }
                                Spacer(Modifier.width(14.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Outlined.Email, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(13.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text(cliente?.email?.ifBlank { "—" } ?: "—", fontSize = 13.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                }
                            }
                        }
                        Spacer(Modifier.width(8.dp))
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("C", fontSize = 32.sp, fontWeight = FontWeight.Black, color = Color(0xFFF59E0B))
                            Text(Traducciones.texto("clientesFin.clasificacion", idioma).uppercase(), fontSize = 9.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario)
                        }
                    }
                }
            }

            // STATS (2 columnas)
            items(
                listOf(
                    VerClienteStat("${contratos.size}", "clientesFin.contratos", Color(0xFF3B82F6), Color(0xFFDBEAFE)),
                    VerClienteStat("$totalActivos", "clientesFin.activos", Color(0xFF10B981), Color(0xFFD1FAE5)),
                    VerClienteStat("$totalVencidas", "clientesFin.cuotasVencidas", Color(0xFFEF4444), Color(0xFFFEE2E2)),
                    VerClienteStat(saldoTotal, "clientesFin.saldoPendiente", Color(0xFFF59E0B), Color(0xFFFEF3C7))
                ).chunked(2)
            ) { fila ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 7.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    fila.forEach { stat ->
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .background(t.fondoElevado, RoundedCornerShape(12.dp))
                                .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .background(stat.colorIconoBg, RoundedCornerShape(10.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(stat.icono, contentDescription = null, tint = stat.colorIcono, modifier = Modifier.size(18.dp))
                                }
                                Spacer(Modifier.width(10.dp))
                                Column {
                                    Text(stat.valor, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(Traducciones.texto(stat.label, idioma), fontSize = 10.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                }
                            }
                        }
                    }
                }
            }

            // Sección contratos
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Description, contentDescription = null, tint = t.textoPrimario, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(Traducciones.texto("clientesFin.contratos", idioma), fontSize = 17.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                }
            }

            // Cards de contratos
            items(contratos, key = { it.numero }) { contrato ->
                ContratoDetalleCard(contrato = contrato, t = t, idioma = idioma)
            }
        }
    }
}

private data class VerClienteStat(
    val valor: String,
    val label: String,
    val colorIcono: Color,
    val colorIconoBg: Color
) {
    val icono = when (label) {
        "clientesFin.contratos" -> Icons.Outlined.Description
        "clientesFin.activos" -> Icons.Outlined.CheckCircle
        "clientesFin.cuotasVencidas" -> Icons.Outlined.Warning
        else -> Icons.Outlined.Payments
    }
}

@Composable
private fun ContratoDetalleCard(
    contrato: ContratoDetalle,
    t: TokensWeb,
    idioma: Idioma
) {
    val (badgeBg, badgeColor, badgeLabel) = when (contrato.estado) {
        "pagado" -> Triple(Color(0xFFD1FAE5), Color(0xFF065F46), Traducciones.texto("clientesFin.pagado", idioma))
        "vencido" -> Triple(Color(0xFFFEE2E2), Color(0xFF991B1B), Traducciones.texto("clientesFin.vencido", idioma))
        "cancelado" -> Triple(Color(0xFFF1F5F9), Color(0xFF64748B), Traducciones.texto("clientesFin.cancelado", idioma))
        else -> Triple(Color(0xFFDBEAFE), Color(0xFF1E40AF), Traducciones.texto("clientesFin.activo", idioma))
    }

    val progreso = if (contrato.totalCuotas > 0) (contrato.cuotasPagadas * 100) / contrato.totalCuotas else 0
    val anchoProgreso = ((progreso.coerceIn(0, 100)).toFloat() / 100f)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 6.dp)
            .background(t.fondoElevado, RoundedCornerShape(14.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
            .padding(16.dp)
    ) {
        // Header: número + plan + estado
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(contrato.numero, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(contrato.plan, fontSize = 12.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Spacer(Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .background(badgeBg, RoundedCornerShape(50))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(badgeLabel, color = badgeColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(Modifier.height(12.dp))

        // Montos: Financiado / Cuota / Pendiente
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(if (t.fondoContenido == Color(0xFF0F172A)) Color(0x08000000) else Color(0xFFF8FAFC), RoundedCornerShape(10.dp))
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MontoContrato(Traducciones.texto("clientesFin.financiado", idioma), contrato.financiado, t, Modifier.weight(1f))
            MontoContrato(Traducciones.texto("clientesFin.cuotaLabel", idioma), contrato.cuota, t, Modifier.weight(1f))
            MontoContrato(
                Traducciones.texto("clientesFin.pendiente", idioma),
                contrato.pendiente,
                t,
                Modifier.weight(1f),
                rojo = true
            )
        }

        Spacer(Modifier.height(12.dp))

        // Progreso
        Row(modifier = Modifier.fillMaxWidth()) {
            Text("${contrato.cuotasPagadas}/${contrato.totalCuotas} " + Traducciones.texto("clientesFin.cuotas", idioma), fontSize = 11.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
            Text("$progreso%", fontSize = 11.sp, color = t.textoSecundario)
        }
        Spacer(Modifier.height(5.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .background(if (t.fondoContenido == Color(0xFF0F172A)) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(anchoProgreso)
                    .height(6.dp)
                    .background(Brush.horizontalGradient(listOf(Color(0xFF0EA5E9), Color(0xFF10B981))), RoundedCornerShape(10.dp))
            )
        }

        // Alerta vencidas
        if (contrato.cuotasVencidas > 0) {
            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier
                    .background(Color(0xFFEF4444).copy(alpha = 0.1f), RoundedCornerShape(50))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(12.dp))
                Spacer(Modifier.width(4.dp))
                Text(
                    "${contrato.cuotasVencidas} ${Traducciones.texto("clientesFin.vencidas", idioma)}",
                    color = Color(0xFFEF4444),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(Modifier.height(10.dp))

        // Fechas
        Row(modifier = Modifier.fillMaxWidth()) {
            Text(Traducciones.texto("clientesFin.inicio", idioma) + ": " + contrato.fechaInicio, fontSize = 11.sp, color = t.textoTerciario, modifier = Modifier.weight(1f))
            Text(Traducciones.texto("clientesFin.fin", idioma) + ": " + contrato.fechaFin, fontSize = 11.sp, color = t.textoTerciario, textAlign = TextAlign.End)
        }
    }
}

@Composable
private fun MontoContrato(
    label: String,
    valor: String,
    t: TokensWeb,
    modifier: Modifier = Modifier,
    rojo: Boolean = false
) {
    Column(modifier = modifier) {
        Text(label.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.4.sp, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(valor, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (rojo) Color(0xFFEF4444) else t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/** Contratos de un cliente desde el JSON importado, vacío si no hay datos. */
internal fun obtenerContratosDetalleCliente(clienteId: Int): List<ContratoDetalle> {
    if (!RepositorioOffline.hayDatosOffline()) return emptyList()
    val contratos = RepositorioOffline.obtenerContratos().filter { it.clienteId == clienteId }
    if (contratos.isEmpty()) return emptyList()
    val planes = RepositorioOffline.obtenerPlanes()
    return contratos.map { c ->
        val plan = planes.firstOrNull { it.id == c.planId }
        ContratoDetalle(
            numero = c.numero,
            plan = plan?.nombre ?: "Plan",
            estado = c.estado,
            financiado = RepositorioOffline.formatoMonto(c.montoFinanciado),
            cuota = RepositorioOffline.formatoMonto(c.cuotaMensual),
            pendiente = RepositorioOffline.formatoMonto(c.saldoPendiente),
            cuotasPagadas = 0,
            totalCuotas = c.meses,
            cuotasVencidas = 0,
            fechaInicio = c.fechaInicio.take(10),
            fechaFin = c.fechaFin.take(10)
        )
    }
}
