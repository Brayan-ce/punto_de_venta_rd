package com.isiweek.puntodeventa.pantallas.clientes

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.Wallet
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Pantalla Clientes. Réplica de _Pages/admin/clientes/cliente.js (vista móvil cards).
 * Header (Depuración + Nuevo Cliente) → 4 estadísticas → buscador → chips de estado →
 * cards con 4 botones: Ver, Vender, Cobrar, Editar.
 */

// ─────────────────────── MODELO ───────────────────────

data class ClienteMovil(
    val id: Long,
    val nombre: String,
    val tipoDocumento: String,
    val numeroDocumento: String,
    val telefono: String,
    val estadoCredito: String, // normal / atrasado / bloqueado
    val tieneDeuda: Boolean,
    val deudaTotal: Double,
    val porcentajeUso: Int,
    val utilizado: Double,
    val disponible: Double,
    val clasificacion: String,
    val score: Int,
    val puedeVender: Boolean
)

data class StatCliente(
    val claveEtiqueta: String,
    val valor: String,
    val detalle: String,
    val icono: ImageVector,
    val color: Color
)

// ─────────────────────── PANTALLA ───────────────────────

@Composable
fun ClientesPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevo: () -> Unit = {},
    onVer: (Long) -> Unit = {},
    onVender: (ClienteMovil) -> Unit = {},
    onEditar: (Long) -> Unit = {}
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

    var busqueda by remember { mutableStateOf("") }
    var filtroEstado by remember { mutableStateOf("todos") }
    var clientes by remember {
        mutableStateOf(
            RepositorioOffline.obtenerClientesDetalle().map { c ->
                ClienteMovil(
                    id = c.id.toLong(),
                    nombre = c.nombreCompleto,
                    tipoDocumento = "CED",
                    numeroDocumento = c.documento,
                    telefono = c.telefono.ifBlank { "N/A" },
                    estadoCredito = "normal",
                    tieneDeuda = false,
                    deudaTotal = 0.0,
                    porcentajeUso = 0,
                    utilizado = 0.0,
                    disponible = 0.0,
                    clasificacion = c.clasificacion,
                    score = c.score,
                    puedeVender = c.activo
                )
            }
        )
    }

    val stats = listOf(
        StatCliente("clientes.total", "${clientes.size}", "${clientes.count { it.estadoCredito != "bloqueado" }} activos", Icons.Outlined.PersonOutline, Color(0xFF2563EB)),
        StatCliente("clientes.creditoNormal", "${clientes.count { it.estadoCredito == "normal" }}", Traducciones.texto("clientes.alDia", idioma), Icons.Outlined.CheckCircle, Color(0xFF10B981)),
        StatCliente("clientes.atrasados", "${clientes.count { it.estadoCredito == "atrasado" }}", Traducciones.texto("clientes.requierenAtencion", idioma), Icons.Outlined.Schedule, Color(0xFFF59E0B)),
        StatCliente("clientes.deudaVencida", "${RepositorioOffline.simboloMoneda()} 0.00", "De ${RepositorioOffline.simboloMoneda()} 0.00 total", Icons.Outlined.Warning, Color(0xFFEF4444))
    )

    val clientesFiltrados = clientes.filter { cliente ->
        val coincideBusqueda = busqueda.isBlank() ||
                cliente.nombre.contains(busqueda, ignoreCase = true) ||
                cliente.numeroDocumento.contains(busqueda, ignoreCase = true) ||
                cliente.telefono.contains(busqueda, ignoreCase = true)
        val coincideEstado = filtroEstado == "todos" || cliente.estadoCredito == filtroEstado
        coincideBusqueda && coincideEstado
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header (.header) ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = Traducciones.texto("clientes.titulo", idioma),
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = t.textoPrimario
                    )
                    Text(
                        text = Traducciones.texto("clientes.subtitulo", idioma),
                        fontSize = 13.sp,
                        color = t.textoSecundario
                    )
                }
            }
        }

        // ── Botones Depuración + Nuevo Cliente (.headerButtons) ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Depuración (.btnDepuracion)
                Row(
                    modifier = Modifier
                        .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                        .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                        .clickable { }
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Analytics, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(Traducciones.texto("clientes.depuracion", idioma), color = t.primario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
                // Nuevo Cliente (.btnNuevo)
                Row(
                    modifier = Modifier
                        .background(t.primario, RoundedCornerShape(8.dp))
                        .clickable(onClick = onNuevo)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.PersonAdd, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(Traducciones.texto("clientes.nuevo", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // ── Estadísticas (.stats) ──
        items(stats.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { stat ->
                    StatClienteCard(stat, t, idioma, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // ── Buscador (.busqueda) ──
        item {
            CampoWeb(
                valor = busqueda,
                onValor = { busqueda = it },
                tokens = t,
                placeholder = Traducciones.texto("clientes.buscar", idioma),
                icono = Icons.Outlined.Search,
                alto = 38,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
            )
        }

        // ── Chips de estado (.chips) ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                ChipCliente(Traducciones.texto("clientes.todos", idioma), filtroEstado == "todos", t, null, { filtroEstado = "todos" })
                ChipCliente(Traducciones.texto("clientes.normal", idioma), filtroEstado == "normal", t, Color(0xFF10B981), { filtroEstado = "normal" })
                ChipCliente(Traducciones.texto("clientes.atrasados", idioma), filtroEstado == "atrasado", t, Color(0xFFF59E0B), { filtroEstado = "atrasado" })
                ChipCliente(Traducciones.texto("clientes.bloqueados", idioma), filtroEstado == "bloqueado", t, Color(0xFFEF4444), { filtroEstado = "bloqueado" })
            }
        }

        // ── Lista de clientes (.listaClientes) ──
        if (clientesFiltrados.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 40.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Outlined.PersonOutline, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(Traducciones.texto("clientes.sinClientes", idioma), color = t.textoTerciario, fontSize = 14.sp)
                }
            }
        } else {
            items(clientesFiltrados, key = { it.id }) { cliente ->
                CardCliente(
                    cliente = cliente,
                    oscuro = oscuro,
                    idioma = idioma,
                    t = t,
                    onVer = { onVer(cliente.id) },
                    onVender = { onVender(cliente) },
                    onEditar = { onEditar(cliente.id) }
                )
            }
        }
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun StatClienteCard(
    stat: StatCliente,
    t: TokensWeb,
    idioma: Idioma,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(stat.icono, contentDescription = null, tint = stat.color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(
            text = Traducciones.texto(stat.claveEtiqueta, idioma),
            fontSize = 11.sp,
            color = t.textoSecundario
        )
        Text(
            text = stat.valor,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = t.textoPrimario
        )
        Text(
            text = stat.detalle,
            fontSize = 10.sp,
            color = t.textoTerciario
        )
    }
}

@Composable
private fun ChipCliente(
    etiqueta: String,
    activo: Boolean,
    t: TokensWeb,
    colorActivo: Color?,
    alClic: () -> Unit
) {
    val color = colorActivo ?: t.primario
    Box(
        modifier = Modifier
            .background(
                if (activo) color.copy(alpha = 0.15f) else t.fondoPrincipal,
                RoundedCornerShape(50)
            )
            .border(1.dp, if (activo) color.copy(alpha = 0.4f) else t.bordeClaro, RoundedCornerShape(50))
            .clickable(onClick = alClic)
            .padding(horizontal = 14.dp, vertical = 8.dp)
    ) {
        Text(
            text = etiqueta,
            color = if (activo) color else t.textoPrimario,
            fontSize = 12.sp,
            fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
private fun CardCliente(
    cliente: ClienteMovil,
    oscuro: Boolean,
    idioma: Idioma,
    t: TokensWeb,
    onVer: () -> Unit,
    onVender: () -> Unit,
    onEditar: () -> Unit
) {
    // Estado de crédito
    val (etiquetaEstado, colorEstado, iconoEstado) = when (cliente.estadoCredito) {
        "normal" -> Triple(Traducciones.texto("clientes.normal", idioma), Color(0xFF10B981), Icons.Outlined.CheckCircle)
        "atrasado" -> Triple(Traducciones.texto("clientes.atrasados", idioma), Color(0xFFF59E0B), Icons.Outlined.Schedule)
        else -> Triple(Traducciones.texto("clientes.bloqueados", idioma), Color(0xFFEF4444), Icons.Outlined.Warning)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 5.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        // Header: avatar + nombre + doc + badge estado
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(t.fondoTerciario, RoundedCornerShape(50)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Outlined.PersonOutline, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = cliente.nombre,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${cliente.tipoDocumento}: ${cliente.numeroDocumento}",
                    fontSize = 12.sp,
                    color = t.textoSecundario
                )
            }
            // Badge estado de crédito
            Box(
                modifier = Modifier
                    .background(colorEstado.copy(alpha = 0.15f), RoundedCornerShape(50))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(iconoEstado, contentDescription = null, tint = colorEstado, modifier = Modifier.size(12.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(etiquetaEstado, color = colorEstado, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Info grid: teléfono, deuda, clase, score
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ItemInfo(Icons.Outlined.Search, cliente.telefono, t, Modifier.weight(1f))
            ItemInfo(Icons.Outlined.Payments, "${RepositorioOffline.simboloMoneda()} %.2f".format(cliente.deudaTotal), t, Modifier.weight(1f))
            ItemInfo(Icons.Outlined.AddCircle, "Clase ${cliente.clasificacion}", t, Modifier.weight(1f))
            ItemInfo(Icons.Outlined.Analytics, "Score: ${cliente.score}", t, Modifier.weight(1f))
        }

        // Uso de crédito con barra de progreso
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = Traducciones.texto("clientes.usoCredito", idioma),
                    fontSize = 12.sp,
                    color = t.textoSecundario,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = "${cliente.porcentajeUso}%",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = colorBarra(cliente.porcentajeUso)
                )
            }
            // Barra de progreso
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .background(t.fondoTerciario, RoundedCornerShape(50))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(cliente.porcentajeUso / 100f)
                        .height(8.dp)
                        .background(colorBarra(cliente.porcentajeUso), RoundedCornerShape(50))
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = Traducciones.texto("clientes.utilizado", idioma) + ": ${RepositorioOffline.simboloMoneda()} %.2f".format(cliente.utilizado),
                    fontSize = 11.sp,
                    color = t.textoSecundario
                )
                Text(
                    text = Traducciones.texto("clientes.disponible", idioma) + ": ${RepositorioOffline.simboloMoneda()} %.2f".format(cliente.disponible),
                    fontSize = 11.sp,
                    color = t.textoSecundario
                )
            }
        }

        // Footer: 4 botones (Ver, Vender, Cobrar, Editar)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            BotonClienteAccion(Icons.Outlined.Visibility, "clientes.ver", t.primario, t, Modifier.weight(1f), onVer)
            BotonClienteAccion(Icons.Outlined.ShoppingCart, "clientes.vender", Color(0xFF059669), t, Modifier.weight(1f), onVender)
            BotonClienteAccion(Icons.Outlined.Wallet, "clientes.cobrar", Color(0xFFD97706), t, Modifier.weight(1f)) { }
            BotonClienteAccion(Icons.Outlined.Create, "clientes.editar", Color(0xFF0284C7), t, Modifier.weight(1f), onEditar)
        }
    }
}

private fun colorBarra(porcentaje: Int): Color {
    return when {
        porcentaje < 50 -> Color(0xFF10B981)
        porcentaje < 80 -> Color(0xFFF59E0B)
        else -> Color(0xFFEF4444)
    }
}

@Composable
private fun ItemInfo(icono: ImageVector, texto: String, t: TokensWeb, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(14.dp))
        Spacer(Modifier.width(4.dp))
        Text(
            text = texto,
            fontSize = 11.sp,
            color = t.textoSecundario,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun BotonClienteAccion(
    icono: ImageVector,
    claveEtiqueta: String,
    color: Color,
    t: TokensWeb,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    Row(
        modifier = modifier
            .background(color.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 9.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(4.dp))
        Text(
            text = Traducciones.texto(claveEtiqueta, Idioma.ESPANOL),
            color = color,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

// ─────────────────────── DATOS DE EJEMPLO ───────────────────────

private fun clientesEjemplo(): List<ClienteMovil> {
    return listOf(
        ClienteMovil(1, "Juan Pérez", "CED", "001-1234567-8", "809-555-1234", "normal", true, 2500.0, 30, 2500.0, 7500.0, "A", 85, true),
        ClienteMovil(2, "María Gómez", "CED", "002-2345678-9", "809-555-5678", "atrasado", true, 8000.0, 85, 8000.0, 2000.0, "C", 45, true),
        ClienteMovil(3, "Pedro Martínez", "RNC", "131-234567", "829-555-9012", "normal", false, 0.0, 10, 0.0, 5000.0, "A", 90, true),
        ClienteMovil(4, "Ana Rodríguez", "CED", "001-3456789-0", "849-555-3456", "bloqueado", true, 12000.0, 100, 12000.0, 0.0, "D", 20, false)
    )
}