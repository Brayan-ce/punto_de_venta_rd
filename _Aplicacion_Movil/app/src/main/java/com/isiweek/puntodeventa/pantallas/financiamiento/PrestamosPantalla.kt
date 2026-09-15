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
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.PeopleAlt
import androidx.compose.material.icons.outlined.PieChart
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Timelapse
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
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import java.util.Calendar

@Composable
fun PrestamosPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevo: () -> Unit = {},
    onVerTodos: () -> Unit = {}
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

    val tieneOffline = RepositorioOffline.hayDatosOffline()
    val contratosOff = if (tieneOffline) RepositorioOffline.obtenerContratos() else emptyList()
    val clientesOff = if (tieneOffline) RepositorioOffline.obtenerClientesFin() else emptyList()
    val planesOff = if (tieneOffline) RepositorioOffline.obtenerPlanes() else emptyList()
    val pagosOff = if (tieneOffline) RepositorioOffline.obtenerPagos() else emptyList()

    if (!tieneOffline) {
        return Box(
            modifier = Modifier
                .fillMaxSize()
                .background(t.fondoContenido),
            contentAlignment = Alignment.Center
        ) {
            AvisoSinBaseDatos(idioma = idioma, tokens = t, oscuro = oscuro)
        }
    }

    // Stats principales
    val totalFinanciado = contratosOff.sumOf { it.montoFinanciado }
    val totalCobrado = pagosOff.sumOf { it.monto }
    val porCobrar = contratosOff.sumOf { it.saldoPendiente }
    val cuotasVencidas = RepositorioOffline.obtenerCuotas().count { it.estado == "vencida" }
    val activos = contratosOff.count { it.estado == "activo" }
    val pagados = contratosOff.count { it.estado == "pagado" }
    val incumplidos = contratosOff.count { it.estado == "incumplido" }
    val reestructurados = contratosOff.count { it.estado == "reestructurado" }
    val totalContratos = contratosOff.size
    val totalIntereses = pagosOff.sumOf { it.montoInteres }
    val promedio = if (totalContratos > 0) totalFinanciado / totalContratos else 0.0
    val pctTotal = if (totalContratos > 0) totalContratos else 1

    val stats = listOf(
        PrestamoStat("prestamos.totalFinanciado", RepositorioOffline.formatoMonto(totalFinanciado), "$totalContratos préstamos", Icons.Outlined.BarChart, Color(0xFF2563EB)),
        PrestamoStat("prestamos.totalCobrado", RepositorioOffline.formatoMonto(totalCobrado), "${if (totalFinanciado > 0) Math.round(totalCobrado * 100.0 / totalFinanciado) else 0}% recuperado", Icons.Outlined.Receipt, Color(0xFF10B981)),
        PrestamoStat("prestamos.porCobrar", RepositorioOffline.formatoMonto(porCobrar), "$cuotasVencidas cuotas vencidas", Icons.Outlined.Warning, Color(0xFFF59E0B)),
        PrestamoStat("prestamos.incumplidos", "$incumplidos", "$cuotasVencidas cuotas vencidas", Icons.Outlined.Warning, Color(0xFFEF4444))
    )

    // MÃ©tricas secundarias
    val metricas = listOf(
        Triple("prestamos.activos", "$activos", Color(0xFF10B981)),
        Triple("prestamos.pagados", "$pagados", Color(0xFF3B82F6)),
        Triple("prestamos.totalIntereses", RepositorioOffline.formatoMonto(totalIntereses), Color(0xFFF59E0B)),
        Triple("prestamos.promedioFinanciado", RepositorioOffline.formatoMonto(promedio), Color(0xFF3B82F6))
    )

    // DistribuciÃ³n
    val distribucion = listOf(
        DistribucionEstado("prestamos.activosLabel", "$activos", "${Math.round(activos * 100.0 / pctTotal)}%", Color(0xFF10B981)),
        DistribucionEstado("prestamos.pagadosLabel", "$pagados", "${Math.round(pagados * 100.0 / pctTotal)}%", Color(0xFF3B82F6)),
        DistribucionEstado("prestamos.incumplidosLabel", "$incumplidos", "${Math.round(incumplidos * 100.0 / pctTotal)}%", Color(0xFFEF4444)),
        DistribucionEstado("prestamos.reestructurados", "$reestructurados", "${Math.round(reestructurados * 100.0 / pctTotal)}%", Color(0xFFF59E0B))
    )

    // Préstamos recientes (estado mutable para poder eliminar)
    var prestamos by remember { mutableStateOf(
        contratosOff.sortedByDescending { it.id }.take(6).map { c ->
            val cliente = clientesOff.firstOrNull { it.id == c.clienteId }
            val plan = planesOff.firstOrNull { it.id == c.planId }
            PrestamoReciente(
                "${cliente?.nombre ?: "Cliente"} ${cliente?.apellidos ?: ""}".trim(),
                "${c.numero} · ${plan?.nombre ?: "Plan"}",
                RepositorioOffline.formatoMonto(c.saldoPendiente),
                c.estado
            )
        }
    ) }

    // Top clientes (estado mutable para poder eliminar)
    var topClientes by remember { mutableStateOf(
        clientesOff.map { cli ->
            val cs = contratosOff.filter { it.clienteId == cli.id }
            Triple(
                "${cli.nombre} ${cli.apellidos}".trim(),
                "${cs.size} préstamo${if (cs.size == 1) "" else "s"} activo${if (cs.size == 1) "" else "s"}",
                RepositorioOffline.formatoMonto(cs.sumOf { it.montoFinanciado })
            )
        }.filter { it.first.isNotBlank() }.sortedByDescending { it.third }.take(5)
    ) }

    // Evolución mensual desde datos reales (mes numérico -> contratos, financiado, cobrado)
    val mesesNombres = listOf("Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sept", "Oct", "Nov", "Dic")
    val evolucion = buildMap<Int, Triple<Int, Double, Double>> {
        contratosOff.forEach { c ->
            val m = c.fechaInicio.take(10).substring(5, 7).toIntOrNull()
            if (m != null && m in 1..12) {
                val prev = this[m] ?: Triple(0, 0.0, 0.0)
                this[m] = Triple(prev.first + 1, prev.second + c.montoFinanciado, prev.third)
            }
        }
        pagosOff.forEach { p ->
            val m = p.fecha.take(10).substring(5, 7).toIntOrNull()
            if (m != null && m in 1..12) {
                val prev = this[m] ?: Triple(0, 0.0, 0.0)
                this[m] = Triple(prev.first, prev.second, prev.third + p.monto)
            }
        }
    }.toList().sortedBy { it.first }.takeLast(4).map { (mes, datos) ->
        mesesNombres[mes - 1] to datos
    }

    var prestamoAEliminar by remember { mutableStateOf<PrestamoReciente?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // Header: título + subtítulo arriba, botones debajo (responsive web)
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp)
            ) {
                Text(
                    text = Traducciones.texto("prestamos.titulo", idioma),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario
                )
                Text(
                    text = Traducciones.texto("prestamos.subtitulo", idioma),
                    fontSize = 13.sp,
                    color = t.textoSecundario,
                    modifier = Modifier.padding(top = 2.dp)
                )
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Nuevo Préstamo
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.primario, RoundedCornerShape(8.dp))
                            .clickable(onClick = onNuevo)
                            .padding(horizontal = 10.dp, vertical = 9.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(Traducciones.texto("prestamos.nuevo", idioma), color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    // Ver todos (btnSecundario: borde gris, texto gris)
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .background(Color.Transparent, RoundedCornerShape(8.dp))
                            .border(1.dp, if (oscuro) Color(0xFF475569) else Color(0xFFCBD5E1), RoundedCornerShape(8.dp))
                            .clickable(onClick = onVerTodos)
                            .padding(horizontal = 10.dp, vertical = 9.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(Traducciones.texto("prestamos.verTodos", idioma), color = if (oscuro) Color(0xFF94A3B8) else Color(0xFF475569), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

// Cuotas que vencen en los próximos 7 días
    val calHoy = Calendar.getInstance()
    val hoyIso = String.format("%04d-%02d-%02d", calHoy.get(Calendar.YEAR), calHoy.get(Calendar.MONTH) + 1, calHoy.get(Calendar.DAY_OF_MONTH))
    calHoy.add(Calendar.DAY_OF_YEAR, 7)
    val hoy7Iso = String.format("%04d-%02d-%02d", calHoy.get(Calendar.YEAR), calHoy.get(Calendar.MONTH) + 1, calHoy.get(Calendar.DAY_OF_MONTH))
    val cuotasProximas = RepositorioOffline.obtenerCuotas().count {
        it.estado != "pagada" && it.fechaVencimiento.take(10) >= hoyIso && it.fechaVencimiento.take(10) <= hoy7Iso
    }
    val textoCuotasProximas = "$cuotasProximas cuotas vencen en los próximos 7 días"

    // Stats principales
        items(stats.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { stat ->
                    PrestamoStatCard(stat, t, idioma, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // Métricas secundarias (grid 2 columnas en móvil)
        items(metricas.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { m ->
                    MetricaCard(m.first, m.second, m.third, t, idioma, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // Alerta cuotas próximas (clickeable → Cuotas)
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp)
                    .background(Color(0xFFF59E0B).copy(alpha = 0.12f), RoundedCornerShape(10.dp))
                    .border(1.dp, Color(0xFFF59E0B).copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                    .clickable(onClick = onVerTodos)
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Notifications, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(Traducciones.texto("prestamos.alertas", idioma), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Text(textoCuotasProximas, fontSize = 11.sp, color = t.textoSecundario)
                }
                Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(16.dp))
            }
        }

        // DistribuciÃ³n por estado
        item {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                Text(Traducciones.texto("prestamos.distribucion", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(Traducciones.texto("prestamos.distribucionSub", idioma), fontSize = 11.sp, color = t.textoSecundario)
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(16.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Dona
                    Box(
                        modifier = Modifier
                            .size(110.dp)
                            .background(t.fondoTerciario, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(78.dp)
                                .background(
                                    androidx.compose.ui.graphics.Brush.sweepGradient(
                                        listOf(Color(0xFF10B981), Color(0xFF3B82F6), Color(0xFFEF4444), Color(0xFFF59E0B), Color(0xFF10B981))
                                    ),
                                    CircleShape
                                )
                        )
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .background(t.fondoPrincipal, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("$totalContratos", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                                Text(Traducciones.texto("prestamos.total", idioma), fontSize = 8.sp, color = t.textoSecundario)
                            }
                        }
                    }
                    Spacer(Modifier.width(16.dp))
                    // Leyenda
                    Column(modifier = Modifier.weight(1f)) {
                        distribucion.forEach { d ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 3.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .background(d.color, CircleShape)
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(Traducciones.texto(d.clave, idioma), fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
                                Text(d.valor, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.width(24.dp))
                                Text(d.pct, fontSize = 11.sp, color = t.textoTerciario, modifier = Modifier.width(48.dp), textAlign = TextAlign.End)
                            }
                        }
                    }
                }
            }
        }

        // PrÃ©stamos recientes
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = Traducciones.texto("prestamos.recientes", idioma),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario,
                    modifier = Modifier.weight(1f)
                )
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable(onClick = onVerTodos)) {
                    Text(Traducciones.texto("prestamos.verTodos", idioma), fontSize = 12.sp, color = t.primario)
                    Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                }
            }
        }

        // Préstamos recientes: cada uno es una card separada (.itemContrato)
        items(prestamos, key = { it.meta }) { p ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 5.dp)
                    .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .clickable(onClick = onVerTodos)
                    .padding(12.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .background(t.fondoTerciario, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(p.nombre.take(1), color = t.textoSecundario, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(p.nombre, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(p.meta, fontSize = 11.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Box(
                        modifier = Modifier
                            .size(30.dp)
                            .background(Color(0xFFEF4444).copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                            .clickable { prestamoAEliminar = p },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(15.dp))
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(p.monto, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1)
                        Text(Traducciones.texto("prestamos.pendiente", idioma).uppercase(), fontSize = 9.sp, color = t.textoTerciario)
                    }
                    Spacer(Modifier.weight(1f))
                    Box(
                        modifier = Modifier
                            .background(Color(0xFF10B981).copy(alpha = 0.15f), RoundedCornerShape(50))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(p.estado, color = Color(0xFF10B981), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // EvoluciÃ³n mensual (simulada con barras)
        item {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                Text(Traducciones.texto("prestamos.evolucion", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(Traducciones.texto("prestamos.evolucionSub", idioma), fontSize = 11.sp, color = t.textoSecundario)
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(16.dp)
            ) {
                // Leyenda
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    LeyendaBarra("prestamos.contratos", Color(0xFF3B82F6), t)
                    LeyendaBarra("prestamos.montoFinanciado", Color(0xFF10B981), t)
                    LeyendaBarra("prestamos.pagosRecibidos", Color(0xFFF59E0B), t)
                }
                Spacer(Modifier.height(12.dp))
                // Barras por mes
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (evolucion.isEmpty()) {
                        Text(Traducciones.texto("prestamos.sinResultados", idioma), fontSize = 11.sp, color = t.textoTerciario)
                    } else {
                        val maxVal = evolucion.maxOf { maxOf(it.second.second, it.second.third) }.coerceAtLeast(1.0)
                        evolucion.forEach { (mes, datos) ->
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.Bottom) {
                                    Box(modifier = Modifier.width(10.dp).height((28 + (datos.first * 30f).toInt()).dp).background(Color(0xFF3B82F6), RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)))
                                    Spacer(Modifier.width(2.dp))
                                    Box(modifier = Modifier.width(10.dp).height((20 + (datos.second / maxVal * 70f).toInt()).dp).background(Color(0xFF10B981), RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)))
                                    Spacer(Modifier.width(2.dp))
                                    Box(modifier = Modifier.width(10.dp).height((20 + (datos.third / maxVal * 70f).toInt()).dp).background(Color(0xFFF59E0B), RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)))
                                }
                                Spacer(Modifier.height(6.dp))
                                Text(mes, fontSize = 10.sp, color = t.textoSecundario)
                            }
                        }
                    }
                }
            }
        }

        // Top clientes
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.PeopleAlt, contentDescription = null, tint = t.textoPrimario, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text(Traducciones.texto("prestamos.topClientes", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
            }
        }

        items(topClientes, key = { it.third + it.second }) { cliente ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 5.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .clickable(onClick = onVerTodos)
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Rango
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .background(
                            when (topClientes.indexOf(cliente)) {
                                0 -> Color(0xFFF59E0B)
                                1 -> Color(0xFF94A3B8)
                                else -> Color(0xFFB45309)
                            }.copy(alpha = 0.2f),
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text("${topClientes.indexOf(cliente) + 1}", color = when (topClientes.indexOf(cliente)) {
                        0 -> Color(0xFFF59E0B)
                        1 -> Color(0xFF94A3B8)
                        else -> Color(0xFFB45309)
                    }, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(cliente.first, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario)
                    Text(cliente.second, fontSize = 11.sp, color = t.textoSecundario)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(cliente.third, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                    Text(Traducciones.texto("prestamos.financiado", idioma), fontSize = 10.sp, color = t.textoTerciario)
                }
            }
        }
    }

    // Modal confirmación eliminar
    prestamoAEliminar?.let { prestamo ->
        ModalConfirmarEliminar(
            nombre = prestamo.nombre,
            meta = prestamo.meta,
            idioma = idioma,
            t = t,
            onCerrar = { prestamoAEliminar = null },
            onConfirmar = {
                prestamos = prestamos.filter { it.meta != prestamo.meta }
                prestamoAEliminar = null
            }
        )
    }
}

@Composable
private fun ModalConfirmarEliminar(
    nombre: String,
    meta: String,
    idioma: Idioma,
    t: TokensWeb,
    onCerrar: () -> Unit,
    onConfirmar: () -> Unit
) {
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
                // Icono + título
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .background(Color(0xFFEF4444).copy(alpha = 0.12f), RoundedCornerShape(50)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(26.dp))
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = "¿Eliminar préstamo?",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = t.textoPrimario
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = nombre + " · " + meta,
                        fontSize = 12.sp,
                        color = t.textoSecundario,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Se eliminarán sus cuotas, pagos y registros asociados. Esta acción no se puede deshacer.",
                        fontSize = 12.sp,
                        color = t.textoTerciario,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }

                // Botones
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
                            .background(Color(0xFFEF4444), RoundedCornerShape(10.dp))
                            .clickable(onClick = onConfirmar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(Traducciones.texto("prestamos.eliminar", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

private data class PrestamoStat(
    val label: String,
    val valor: String,
    val sub: String,
    val icono: ImageVector,
    val color: Color
)

private data class DistribucionEstado(
    val clave: String,
    val valor: String,
    val pct: String,
    val color: Color
)

private data class PrestamoReciente(
    val nombre: String,
    val meta: String,
    val monto: String,
    val estado: String
)

@Composable
private fun PrestamoStatCard(stat: PrestamoStat, t: TokensWeb, idioma: Idioma, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .background(stat.color.copy(alpha = 0.12f), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(stat.icono, contentDescription = null, tint = stat.color, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(8.dp))
            Text(Traducciones.texto(stat.label, idioma), fontSize = 11.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        Text(stat.valor, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        Text(stat.sub, fontSize = 11.sp, color = stat.color)
    }
}

@Composable
private fun MetricaCard(clave: String, valor: String, color: Color, t: TokensWeb, idioma: Idioma, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Text(Traducciones.texto(clave, idioma), fontSize = 9.sp, color = t.textoSecundario, maxLines = 2)
        Spacer(Modifier.height(4.dp))
        Text(valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = color)
    }
}

@Composable
private fun LeyendaBarra(clave: String, color: Color, t: TokensWeb) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(10.dp).background(color, RoundedCornerShape(2.dp)))
        Spacer(Modifier.width(4.dp))
        Text(Traducciones.texto(clave, Idioma.ESPANOL), fontSize = 10.sp, color = t.textoSecundario)
    }
}