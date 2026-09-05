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
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CardGiftcard
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Wallet
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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

@Composable
fun DashboardFinancieroPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevoContrato: () -> Unit = {},
    onNuevoPlan: () -> Unit = {},
    onPlanes: () -> Unit = {},
    onPrestamos: () -> Unit = {},
    onCuotas: () -> Unit = {},
    onPagos: () -> Unit = {},
    onAlertas: () -> Unit = {}
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
    val planesOff = if (tieneOffline) RepositorioOffline.obtenerPlanes() else emptyList()
    val alertasOff = if (tieneOffline) RepositorioOffline.obtenerAlertas() else emptyList()
    val clientesOff = if (tieneOffline) RepositorioOffline.obtenerClientesFin() else emptyList()

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

    // Stats
    val activos = contratosOff.count { it.estado == "activo" }
    val saldoTotal = contratosOff.sumOf { it.saldoPendiente }
    val financiadoTotal = contratosOff.sumOf { it.montoFinanciado }
    val cobradoMes = RepositorioOffline.obtenerPagos().sumOf { it.monto }
    val intereses = RepositorioOffline.obtenerPagos().sumOf { it.montoInteres }
    val vencidas = RepositorioOffline.obtenerCuotas().count { it.estado == "vencida" }
    val pagados = contratosOff.count { it.estado == "pagado" }
    val incumplidos = contratosOff.count { it.estado == "incumplido" }
    val totalContratos = contratosOff.size
    val pctActivos = if (totalContratos > 0) Math.round(activos * 100.0 / totalContratos).toInt() else 0
    val pctPagados = if (totalContratos > 0) Math.round(pagados * 100.0 / totalContratos).toInt() else 0
    val pctIncumplidos = if (totalContratos > 0) Math.round(incumplidos * 100.0 / totalContratos).toInt() else 0
    val promedio = if (totalContratos > 0) RepositorioOffline.formatoMonto(financiadoTotal / totalContratos) else RepositorioOffline.simboloMoneda() + "0"

    val stats = listOf(
        StatFin("fin.contratosActivos", activos.toString(), "fin.enProceso", Icons.Outlined.Description, Color(0xFF2563EB)),
        StatFin("fin.cuotasVencidas", vencidas.toString(), "fin.requierenAtencion", Icons.Outlined.Warning, Color(0xFFEF4444)),
        StatFin("fin.saldoPendiente", RepositorioOffline.formatoMonto(saldoTotal), "fin.porCobrar", Icons.Outlined.Wallet, Color(0xFF8B5CF6)),
        StatFin("fin.cobradoEsteMes", RepositorioOffline.formatoMonto(cobradoMes), "fin.totalRecaudado", Icons.AutoMirrored.Outlined.TrendingUp, Color(0xFF10B981)),
        StatFin("fin.totalFinanciado", RepositorioOffline.formatoMonto(financiadoTotal), "fin.historialCompleto", Icons.Outlined.Payments, Color(0xFFF59E0B)),
        StatFin("fin.interesesCobrados", RepositorioOffline.formatoMonto(intereses), "fin.rendimiento", Icons.Outlined.BarChart, Color(0xFF0EA5E9))
    )

    // Módulos acceso rápido
    val modulos = listOf(
        ModuloFin("fin.planes", "fin.gestionarPlanes", Icons.Outlined.Description, Color(0xFF2563EB), onPlanes),
        ModuloFin("fin.prestamos", "fin.verCrearContratos", Icons.Outlined.Receipt, Color(0xFF8B5CF6), onPrestamos),
        ModuloFin("fin.cuotas", "fin.controlPagos", Icons.Outlined.CalendarMonth, Color(0xFF10B981), onCuotas),
        ModuloFin("fin.pagos", "fin.historialPagos", Icons.Outlined.Payments, Color(0xFFF59E0B), onPagos),
        ModuloFin("fin.alertas", "fin.cobranzaAlertas", Icons.Outlined.Notifications, Color(0xFFEF4444), onAlertas)
    )

    // Planes activos
    val planes = planesOff.filter { it.activo }.map { p ->
        Triple(p.nombre, "${p.tasaInteres}% · ${p.frecuencia}", p.id)
    }

    // Cuotas próximas
    val cuotas = RepositorioOffline.obtenerCuotas().filter { it.estado != "pagada" }.take(4).map { c ->
        val contrato = contratosOff.firstOrNull { it.id == c.contratoId }
        val cliente = clientesOff.firstOrNull { it.id == contrato?.clienteId }
        CuotaFin(
            cliente?.nombre ?: "Cliente",
            "${contrato?.numero ?: "FIN"} · Cuota #${c.numero}",
            RepositorioOffline.formatoMonto(c.monto),
            "pendiente",
            false
        )
    }

    // Alertas
    val alertas = alertasOff.filter { it.estado == "activa" }.take(4).map { a ->
        val contrato = contratosOff.firstOrNull { it.id == a.contratoId }
        Triple(a.mensaje, "${contrato?.numero ?: "FIN"} · ${a.fecha.take(10)}", a.contratoId.toString())
    }

    // Contratos recientes
    val contratos = contratosOff.take(6).map { c ->
        val cliente = clientesOff.firstOrNull { it.id == c.clienteId }
        val plan = planesOff.firstOrNull { it.id == c.planId }
        ContratoFin(
            c.numero,
            c.fechaInicio.take(10),
            "${cliente?.nombre ?: "Cliente"} ${cliente?.apellidos ?: ""}".trim(),
            plan?.nombre ?: "Plan",
            RepositorioOffline.formatoMonto(c.montoFinanciado),
            RepositorioOffline.formatoMonto(c.saldoPendiente),
            c.estado,
            cliente?.documento ?: "—"
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // â”€â”€ HERO â”€â”€
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        androidx.compose.ui.graphics.Brush.linearGradient(
                            if (oscuro) listOf(Color(0xFF1E293B), Color(0xFF0F172A))
                            else listOf(Color(0xFFFFFFFF), Color(0xFFF0F4FF))
                        )
                    )
                    .border(1.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE0E7FF), RoundedCornerShape(12.dp))
                    .padding(20.dp)
            ) {
                // Badge
                Row(
                    modifier = Modifier
                        .background(if (oscuro) Color(0xFF1E3A8A) else Color(0xFFDBEAFE), RoundedCornerShape(50))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.AutoAwesome, contentDescription = null, tint = if (oscuro) Color(0xFF93C5FD) else Color(0xFF1D4ED8), modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(Traducciones.texto("fin.heroBadge", idioma), color = if (oscuro) Color(0xFF93C5FD) else Color(0xFF1D4ED8), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(10.dp))
                Text(
                    text = Traducciones.texto("fin.titulo", idioma),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario
                )
                Text(
                    text = Traducciones.texto("fin.subtitulo", idioma),
                    fontSize = 13.sp,
                    color = t.textoSecundario,
                    modifier = Modifier.padding(top = 4.dp)
                )
                Spacer(Modifier.height(14.dp))
                // Acciones
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Nuevo Contrato
                    Row(
                        modifier = Modifier
                            .background(t.primario, RoundedCornerShape(8.dp))
                            .clickable(onClick = onNuevoContrato)
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(5.dp))
                        Text(Traducciones.texto("fin.nuevoContrato", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    // Nuevo Plan (btnHeroSecundario: borde azul, texto azul)
                    Row(
                        modifier = Modifier
                            .background(Color.Transparent, RoundedCornerShape(8.dp))
                            .border(1.dp, if (oscuro) Color(0xFF60A5FA) else Color(0xFF3B82F6), RoundedCornerShape(8.dp))
                            .clickable(onClick = onNuevoPlan)
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Description, contentDescription = null, tint = if (oscuro) Color(0xFF60A5FA) else Color(0xFF3B82F6), modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(5.dp))
                        Text(Traducciones.texto("fin.nuevoPlan", idioma), color = if (oscuro) Color(0xFF60A5FA) else Color(0xFF3B82F6), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        // â”€â”€ STATS â”€â”€
        items(stats.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { stat ->
                    StatCardFin(stat, t, idioma, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // â”€â”€ ACCESO RÃPIDO â”€â”€
        item {
            TituloSeccion(t, idioma, "fin.accesoRapido", "fin.navegaModulos")
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                modulos.forEach { m ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
                            .clickable { m.onClick() }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(m.color.copy(alpha = 0.12f), RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(m.icono, contentDescription = null, tint = m.color, modifier = Modifier.size(20.dp))
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(Traducciones.texto(m.nombre, idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                            Text(Traducciones.texto(m.desc, idioma), fontSize = 11.sp, color = t.textoSecundario)
                        }
                        Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }

        // â”€â”€ DISTRIBUCIÃ“N DE CONTRATOS â”€â”€
        item {
            TituloSeccion(t, idioma, "fin.distribucion", "fin.estadoActual")
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
                // Dona (simulada con barra circular simple)
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .background(t.fondoTerciario, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(84.dp)
                            .background(
                                androidx.compose.ui.graphics.Brush.sweepGradient(
                                    listOf(Color(0xFF10B981), Color(0xFF3B82F6), Color(0xFFEF4444), Color(0xFF10B981))
                                ),
                                CircleShape
                            )
                    )
                    Box(
                        modifier = Modifier
                            .size(70.dp)
                            .background(t.fondoPrincipal, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("$totalContratos", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                            Text(Traducciones.texto("fin.prestamos", idioma).lowercase(), fontSize = 9.sp, color = t.textoSecundario)
                        }
                    }
                }

                Spacer(Modifier.height(14.dp))

                // Leyenda
                LeyendaFin("fin.activos", "$activos", "$pctActivos%", Color(0xFF10B981), t)
                LeyendaFin("fin.pagados", "$pagados", "$pctPagados%", Color(0xFF3B82F6), t)
                LeyendaFin("fin.incumplidos", "$incumplidos", "$pctIncumplidos%", Color(0xFFEF4444), t)

                Spacer(Modifier.height(10.dp))

                // Promedio
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(Traducciones.texto("fin.promedioFinanciado", idioma), fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
                    Text(promedio, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                }
            }
        }

        // â”€â”€ PLANES ACTIVOS â”€â”€
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(Traducciones.texto("fin.planesActivos", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.weight(1f))
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { onPlanes() }) {
                    Text(Traducciones.texto("fin.verTodos", idioma), fontSize = 12.sp, color = t.primario)
                    Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                }
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(8.dp)
            ) {
                planes.forEach { plan ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onPlanes() }
                            .padding(horizontal = 8.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .background(t.fondoTerciario, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.CardGiftcard, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(plan.first, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(plan.second, fontSize = 11.sp, color = t.textoSecundario)
                        }
                        Text("${plan.third}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    }
                }
            }
        }

        // â”€â”€ VENCEN EN 7 DÃAS â”€â”€
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(Traducciones.texto("fin.vencen7Dias", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.weight(1f))
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { onCuotas() }) {
                    Text(Traducciones.texto("fin.verTodas", idioma), fontSize = 12.sp, color = t.primario)
                    Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                }
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(8.dp)
            ) {
                cuotas.forEach { cuota ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(
                                    if (cuota.urgente) Color(0xFFEF4444).copy(alpha = 0.15f) else t.fondoTerciario,
                                    CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("A", color = if (cuota.urgente) Color(0xFFEF4444) else t.textoSecundario, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(cuota.cliente, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario)
                            Text(cuota.meta, fontSize = 11.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(cuota.monto, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                            Text(
                                text = cuota.dias,
                                fontSize = 11.sp,
                                color = if (cuota.urgente) Color(0xFFEF4444) else Color(0xFFF59E0B),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // â”€â”€ ALERTAS ACTIVAS â”€â”€
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(Traducciones.texto("fin.alertasActivas", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444), modifier = Modifier.weight(1f))
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { onAlertas() }) {
                    Text(Traducciones.texto("fin.verTodas", idioma), fontSize = 12.sp, color = t.primario)
                    Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                }
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(8.dp)
            ) {
                alertas.forEach { alerta ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(alerta.first, fontSize = 12.sp, color = t.textoPrimario, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            Text(alerta.second, fontSize = 11.sp, color = t.textoTerciario)
                        }
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .background(t.exito.copy(alpha = 0.12f), RoundedCornerShape(6.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = t.exito, modifier = Modifier.size(14.dp))
                        }
                    }
                }
            }
        }

        // â”€â”€ CONTRATOS RECIENTES â”€â”€
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(Traducciones.texto("fin.contratosRecientes", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.weight(1f))
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { onPrestamos() }) {
                    Text(Traducciones.texto("fin.verTodos", idioma), fontSize = 12.sp, color = t.primario)
                    Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                }
            }
        }

        // Cabecera tabla contratos
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp)
                    .background(t.fondoElevado, RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
                    .padding(horizontal = 10.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CeldaHeaderFin(Traducciones.texto("fin.contrato", idioma), Modifier.weight(1.2f), t)
                CeldaHeaderFin(Traducciones.texto("fin.cliente", idioma), Modifier.weight(1f), t)
                CeldaHeaderFin(Traducciones.texto("fin.plan", idioma), Modifier.weight(1f), t)
                CeldaHeaderFin(Traducciones.texto("fin.financiado", idioma), Modifier.weight(0.9f), t, TextAlign.End)
                CeldaHeaderFin(Traducciones.texto("fin.saldo", idioma), Modifier.weight(0.8f), t, TextAlign.End)
                CeldaHeaderFin(Traducciones.texto("fin.estado", idioma), Modifier.weight(0.9f), t, TextAlign.End)
            }
        }

        items(contratos, key = { it.numero }) { contrato ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp)
                    .background(t.fondoPrincipal)
                    .padding(horizontal = 10.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1.2f)) {
                    Text(contrato.numero, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(contrato.fecha, fontSize = 9.sp, color = t.textoTerciario)
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(contrato.cliente, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(contrato.documento, fontSize = 9.sp, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Text(contrato.plan, fontSize = 10.sp, color = t.textoSecundario, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(contrato.financiado, fontSize = 10.sp, color = t.textoPrimario, modifier = Modifier.weight(0.9f), textAlign = TextAlign.End, maxLines = 1)
                Text(contrato.saldo, fontSize = 10.sp, color = t.textoPrimario, modifier = Modifier.weight(0.8f), textAlign = TextAlign.End, maxLines = 1)
                Box(
                    modifier = Modifier
                        .weight(0.9f)
                        .background(
                            when (contrato.estado) {
                                "activo" -> Color(0xFF10B981).copy(alpha = 0.15f)
                                "pagado" -> Color(0xFF3B82F6).copy(alpha = 0.15f)
                                "incumplido" -> Color(0xFFEF4444).copy(alpha = 0.15f)
                                else -> t.fondoTerciario
                            },
                            RoundedCornerShape(50)
                        )
                        .padding(horizontal = 6.dp, vertical = 3.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        when (contrato.estado) {
                            "activo" -> "Activo"
                            "pagado" -> "Pagado"
                            "incumplido" -> "Incumplido"
                            else -> contrato.estado
                        },
                        color = when (contrato.estado) {
                            "activo" -> Color(0xFF10B981)
                            "pagado" -> Color(0xFF3B82F6)
                            "incumplido" -> Color(0xFFEF4444)
                            else -> t.textoSecundario
                        },
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                }
            }
        }
    }
}

private data class StatFin(
    val label: String,
    val valor: String,
    val sub: String,
    val icono: ImageVector,
    val color: Color
)

private data class ModuloFin(
    val nombre: String,
    val desc: String,
    val icono: ImageVector,
    val color: Color,
    val onClick: () -> Unit = {}
)

private data class CuotaFin(
    val cliente: String,
    val meta: String,
    val monto: String,
    val dias: String,
    val urgente: Boolean
)

private data class ContratoFin(
    val numero: String,
    val fecha: String,
    val cliente: String,
    val plan: String,
    val financiado: String,
    val saldo: String,
    val estado: String,
    val documento: String
)

@Composable
private fun TituloSeccion(t: TokensWeb, idioma: Idioma, tituloClave: String, subClave: String) {
    Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
        Text(Traducciones.texto(tituloClave, idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        Text(Traducciones.texto(subClave, idioma), fontSize = 11.sp, color = t.textoSecundario)
    }
}

@Composable
private fun StatCardFin(stat: StatFin, t: TokensWeb, idioma: Idioma, modifier: Modifier = Modifier) {
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
            Text(stat.valor, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        }
        Spacer(Modifier.height(6.dp))
        Text(Traducciones.texto(stat.label, idioma), fontSize = 11.sp, color = t.textoSecundario)
        Text(Traducciones.texto(stat.sub, idioma), fontSize = 10.sp, color = t.textoTerciario)
    }
}

@Composable
private fun LeyendaFin(clave: String, valor: String, pct: String, color: Color, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .background(color, CircleShape)
        )
        Spacer(Modifier.width(8.dp))
        Text(Traducciones.texto(clave, Idioma.ESPANOL), fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
        Text(valor, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.width(24.dp))
        Text(pct, fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.width(52.dp), textAlign = TextAlign.End)
    }
}

@Composable
private fun CeldaHeaderFin(texto: String, modifier: Modifier, t: TokensWeb, textAlign: TextAlign = TextAlign.Start) {
    Text(
        text = texto,
        modifier = modifier,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        color = t.textoTerciario,
        textAlign = textAlign,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
}