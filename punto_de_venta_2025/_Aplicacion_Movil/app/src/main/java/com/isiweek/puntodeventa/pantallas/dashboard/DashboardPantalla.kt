package com.isiweek.puntodeventa.pantallas.dashboard

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material.icons.outlined.Category
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.PeopleAlt
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Star
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.ProductoOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.VentaOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Pantalla Dashboard. Réplica de _Pages/admin/dashboard/dashboard.js.
 * Calcula los resúmenes (ventas, productos, clientes, inventario, alertas)
 * a partir de la base de datos local.
 */
@Composable
fun DashboardPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onVerVentas: () -> Unit = {},
    onVerProductos: () -> Unit = {},
    onVerClientes: () -> Unit = {}
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

    val context = LocalContext.current
    var periodo by remember { mutableStateOf("hoy") }
    var vistaProductos by remember { mutableStateOf("top") }

    val ventas = remember { RepositorioOffline.obtenerVentas(context).filter { it.estado == "emitida" } }
    val productos = remember { RepositorioOffline.obtenerProductos() }
    val clientes = remember { RepositorioOffline.obtenerClientesVenta() }
    val clientesRecientes = remember { RepositorioOffline.obtenerClientesRecientes(5) }
    val topProductos = remember { RepositorioOffline.productosTopVendidos(context, mesInicio()) }
    val bajoStock = remember { RepositorioOffline.productosBajoStock() }
    val cajaAbierta = remember { RepositorioOffline.obtenerCajaAbierta() }

    val hoyStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    val cal = Calendar.getInstance()
    cal.add(Calendar.DAY_OF_YEAR, -7)
    val hace7Str = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)
    val mesStr = hoyStr.take(7)

    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }
    val ventasHoy = ventas.filter { it.fecha.startsWith(hoyStr) }
    val ventasSemana = ventas.filter { v -> val f = v.fecha.take(10); f >= hace7Str && f <= hoyStr }
    val ventasMes = ventas.filter { it.fecha.startsWith(mesStr) }

    fun ventasPeriodo(p: String): List<VentaOffline> = when (p) {
        "hoy" -> ventasHoy
        "semana" -> ventasSemana
        else -> ventasMes
    }

    val productosActivos = productos.count { it.activo }
    val valorInventario = productos.sumOf { it.precioVenta * it.stock }
    val bajoStockCount = productos.count { it.activo && it.stock <= it.stockMinimo }

    val estadisticas = listOf(
        EstadDashboard(Traducciones.texto("dashboard.ventasHoy", idioma), fmt(ventasHoy.sumOf { it.total }), "${ventasHoy.size} ${Traducciones.texto("dashboard.ventas", idioma)}", Icons.Outlined.Payments, Color(0xFF2563EB)),
        EstadDashboard(Traducciones.texto("dashboard.productos", idioma), productos.size.toString(), "$productosActivos ${Traducciones.texto("dashboard.activos", idioma)}", Icons.Outlined.Inventory2, Color(0xFF8B5CF6)),
        EstadDashboard(Traducciones.texto("dashboard.clientes", idioma), clientes.size.toString(), "${clientes.count { it.nombreCompleto.isNotBlank() }} ${Traducciones.texto("dashboard.activos", idioma)}", Icons.Outlined.PeopleAlt, Color(0xFF10B981)),
        EstadDashboard(Traducciones.texto("dashboard.inventario", idioma), fmt(valorInventario), "$bajoStockCount ${Traducciones.texto("dashboard.bajoStock", idioma)}", Icons.Outlined.Category, Color(0xFFF59E0B))
    )

    val ventasPeriodoActual = ventasPeriodo(periodo)
    val listaVentasMes = ventasPeriodo("mes")

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // ── Header ──
        item {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(Traducciones.texto("dashboard.titulo", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(Traducciones.texto("dashboard.subtitulo", idioma), fontSize = 13.sp, color = t.textoSecundario)
            }
        }

        // ── Estadísticas principales ──
        items(estadisticas.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { est ->
                    EstadDashboardCard(est, t, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // ── Panel Ventas Recientes ──
        item {
            PanelDashboard(t, Traducciones.texto("dashboard.ventasRecientes", idioma), Icons.Outlined.Receipt) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(bottom = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ChipPeriodoDash(Traducciones.texto("dashboard.hoy", idioma), periodo == "hoy", t, { periodo = "hoy" })
                    ChipPeriodoDash(Traducciones.texto("dashboard.semana", idioma), periodo == "semana", t, { periodo = "semana" })
                    ChipPeriodoDash(Traducciones.texto("dashboard.mes", idioma), periodo == "mes", t, { periodo = "mes" })
                }
                if (ventasPeriodoActual.isEmpty()) {
                    VacioDashboard(Icons.Outlined.Receipt, Traducciones.texto("dashboard.sinVentas", idioma), t)
                } else {
                    ventasPeriodoActual.take(5).forEach { v ->
                        FilaVentaDash(v, t, idioma)
                    }
                }
            }
            FilaVerTodo(t, Traducciones.texto("dashboard.verTodasVentas", idioma), onVerVentas)
        }

        // ── Panel Productos (Top / Bajo Stock) ──
        item {
            PanelDashboard(t, Traducciones.texto("dashboard.productos", idioma), Icons.Outlined.Inventory2) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(bottom = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ChipPeriodoDash(Traducciones.texto("dashboard.top", idioma), vistaProductos == "top", t, { vistaProductos = "top" })
                    ChipPeriodoDash(Traducciones.texto("dashboard.bajoStockBtn", idioma), vistaProductos == "bajo", t, { vistaProductos = "bajo" })
                }
                if (vistaProductos == "top") {
                    if (topProductos.isEmpty()) {
                        VacioDashboard(Icons.Outlined.Inventory2, Traducciones.texto("dashboard.sinVentas", idioma), t)
                    } else {
                        topProductos.forEach { item ->
                            FilaProductoVendido(item.producto, item.cantidad, item.monto, t, idioma)
                        }
                    }
                } else {
                    if (bajoStock.isEmpty()) {
                        VacioDashboard(Icons.Outlined.CheckCircle, Traducciones.texto("dashboard.sinBajoStock", idioma), t)
                    } else {
                        bajoStock.forEach { p ->
                            FilaBajoStock(p, t)
                        }
                    }
                }
            }
            FilaVerTodo(t, Traducciones.texto("dashboard.verTodosProductos", idioma), onVerProductos)
        }

        // ── Panel Resumen de Ventas ──
        item {
            PanelDashboard(t, Traducciones.texto("dashboard.resumenVentas", idioma), Icons.AutoMirrored.Outlined.TrendingUp) {
                FilaResumenDash(Traducciones.texto("dashboard.ventasDelDia", idioma), fmt(ventasHoy.sumOf { it.total }), "${ventasHoy.size} ${Traducciones.texto("dashboard.ventas", idioma)}", t)
                FilaResumenDash(Traducciones.texto("dashboard.ventasSemana", idioma), fmt(ventasSemana.sumOf { it.total }), "${ventasSemana.size} ${Traducciones.texto("dashboard.ventas", idioma)}", t)
                FilaResumenDash(Traducciones.texto("dashboard.ventasMes", idioma), fmt(ventasMes.sumOf { it.total }), "${ventasMes.size} ${Traducciones.texto("dashboard.ventas", idioma)}", t)
                val prom = if (ventasMes.isNotEmpty()) ventasMes.sumOf { it.total } / ventasMes.size else 0.0
                FilaResumenDash(Traducciones.texto("dashboard.promedioVenta", idioma), fmt(prom), Traducciones.texto("dashboard.ticketPromedio", idioma), t)
            }
        }

        // ── Panel Alertas ──
        item {
            PanelDashboard(t, Traducciones.texto("dashboard.alertas", idioma), Icons.Outlined.Warning) {
                if (cajaAbierta == null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF3B82F6).copy(alpha = 0.10f), RoundedCornerShape(8.dp))
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFF3B82F6), modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Column {
                            Text(Traducciones.texto("dashboard.cajaCerrada", idioma), color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Text(Traducciones.texto("dashboard.abrirCajaParaVender", idioma), color = t.textoSecundario, fontSize = 12.sp)
                        }
                    }
                } else {
                    VacioDashboard(Icons.Outlined.CheckCircle, Traducciones.texto("dashboard.sinAlertas", idioma), t)
                }
            }
        }

        // ── Panel Clientes Recientes ──
        item {
            PanelDashboard(t, Traducciones.texto("dashboard.clientesRecientes", idioma), Icons.Outlined.PeopleAlt) {
                if (clientesRecientes.isEmpty()) {
                    VacioDashboard(Icons.Outlined.PeopleAlt, Traducciones.texto("dashboard.sinClientes", idioma), t)
                } else {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(t.fondoContenido, RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(Traducciones.texto("dashboard.cliente", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.weight(1.4f))
                        Text(Traducciones.texto("dashboard.documento", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.weight(1.2f))
                        Text(Traducciones.texto("dashboard.registrado", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(86.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                    }
                    clientesRecientes.forEach { c ->
                        FilaClienteReciente(c, t, idioma)
                    }
                }
            }
            FilaVerTodo(t, Traducciones.texto("dashboard.verTodosClientes", idioma), onVerClientes)
        }
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

private data class EstadDashboard(val etiqueta: String, val valor: String, val detalle: String, val icono: ImageVector, val color: Color)

@Composable
private fun EstadDashboardCard(est: EstadDashboard, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(est.icono, contentDescription = null, tint = est.color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(est.etiqueta, fontSize = 11.sp, color = t.textoSecundario)
        Text(est.valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(est.detalle, fontSize = 10.sp, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun PanelDashboard(
    t: TokensWeb,
    titulo: String,
    icono: ImageVector,
    contenido: @Composable () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 12.dp)) {
            Icon(icono, contentDescription = null, tint = t.primario, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text(titulo, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        }
        contenido()
    }
}

@Composable
private fun ChipPeriodoDash(etiqueta: String, activo: Boolean, t: TokensWeb, alClic: () -> Unit) {
    Box(
        modifier = Modifier
            .background(if (activo) t.primario.copy(alpha = 0.15f) else t.fondoContenido, RoundedCornerShape(50))
            .border(1.dp, if (activo) t.primario.copy(alpha = 0.4f) else t.bordeClaro, RoundedCornerShape(50))
            .clickable(onClick = alClic)
            .padding(horizontal = 14.dp, vertical = 8.dp)
    ) {
        Text(etiqueta, color = if (activo) t.primario else t.textoPrimario, fontSize = 12.sp, fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium)
    }
}

@Composable
private fun VacioDashboard(icono: ImageVector, mensaje: String, t: TokensWeb) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 18.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(icono, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(24.dp))
        Spacer(Modifier.height(6.dp))
        Text(mensaje, color = t.textoTerciario, fontSize = 13.sp)
    }
}

@Composable
private fun FilaVerTodo(t: TokensWeb, texto: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable(onClick = onClick),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.End
    ) {
        Text(texto, color = t.primario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        Icon(Icons.AutoMirrored.Outlined.KeyboardArrowRight, contentDescription = null, tint = t.primario, modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun FilaVentaDash(v: VentaOffline, t: TokensWeb, idioma: Idioma) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .background(t.primarioClaro, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) { Icon(Icons.Outlined.Receipt, contentDescription = null, tint = t.primario, modifier = Modifier.size(18.dp)) }
        Spacer(Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(v.numeroInterno, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(v.cliente, color = t.textoSecundario, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Text("${RepositorioOffline.simboloMoneda()} %.2f".format(v.total), color = t.exito, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun FilaProductoVendido(p: ProductoOffline, cantidad: Double, monto: Double, t: TokensWeb, idioma: Idioma) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .background(t.primarioClaro, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) { Icon(Icons.Outlined.Star, contentDescription = null, tint = t.primario, modifier = Modifier.size(18.dp)) }
        Spacer(Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(p.nombre, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text("%.2f ${Traducciones.texto("dashboard.vendidos", idioma)}".format(cantidad), color = t.textoSecundario, fontSize = 12.sp)
        }
        Text("${RepositorioOffline.simboloMoneda()} %.2f".format(monto), color = t.exito, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun FilaBajoStock(p: ProductoOffline, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .background(Color(0xFFF59E0B).copy(alpha = 0.15f), RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) { Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(18.dp)) }
        Spacer(Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(p.nombre, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text("${RepositorioOffline.simboloMoneda()} %.2f".format(p.precioVenta), color = t.textoSecundario, fontSize = 12.sp)
        }
        Text("${p.stock.toLong()}/${p.stockMinimo.toLong()}", color = Color(0xFFF59E0B), fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun FilaResumenDash(etiqueta: String, valor: String, detalle: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(etiqueta, color = t.textoSecundario, fontSize = 13.sp)
            Text(detalle, color = t.textoTerciario, fontSize = 11.sp)
        }
        Text(valor, color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun FilaClienteReciente(c: com.isiweek.puntodeventa.offline.RepositorioOffline.ClienteRecienteOffline, t: TokensWeb, idioma: Idioma) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(c.nombreCompleto, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1.4f), maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(c.documento.ifBlank { "—" }, color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.weight(1.2f), maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(fechaRegistro(c.fechaCreacion), color = t.textoTerciario, fontSize = 11.sp, modifier = Modifier.width(86.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

private fun fechaRegistro(fecha: String): String {
    return try {
        val entrada = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
        val salida = SimpleDateFormat("dd-MMM, h:mm a", Locale("es", "DO"))
        salida.format(entrada.parse(fecha) ?: return fecha.take(10))
    } catch (e: Exception) {
        fecha.take(10)
    }
}

private fun mesInicio(): String = SimpleDateFormat("yyyy-MM", Locale.US).format(Date()) + "-01"