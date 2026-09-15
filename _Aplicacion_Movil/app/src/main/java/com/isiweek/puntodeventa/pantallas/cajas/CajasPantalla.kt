package com.isiweek.puntodeventa.pantallas.cajas

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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.Calculate
import androidx.compose.material.icons.outlined.CardGiftcard
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.RemoveCircle
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material.icons.outlined.TrendingUp
import androidx.compose.material.icons.outlined.Wallet
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.CajaOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Pantalla Caja. Réplica de _Pages/admin/cajas/cajas.js.
 * Tabs "Mi Caja" / "Historial", apertura/cierre de turno, registro de gastos,
 * desglose por método de pago y ventas del turno, conectado a la BD local.
 */
@Composable
fun CajasPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    abrirCierre: Boolean = false,
    onConsumirCierre: () -> Unit = {}
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
    var tab by remember { mutableStateOf("miCaja") }
    var cajaAbierta by remember { mutableStateOf(RepositorioOffline.obtenerCajaAbierta()) }
    var historial by remember { mutableStateOf(RepositorioOffline.obtenerHistorialCajas()) }
    var mostrarGasto by remember { mutableStateOf(false) }
    var mostrarCerrar by remember { mutableStateOf(false) }
    var mostrarAbrir by remember { mutableStateOf(false) }

    LaunchedEffect(abrirCierre) {
        if (abrirCierre && cajaAbierta != null) {
            mostrarCerrar = true
            onConsumirCierre()
        }
    }

    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header ──
        item {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("Caja", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text("Gestiona tus cajas y turnos", fontSize = 13.sp, color = t.textoSecundario)
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TabCaja("Mi Caja", tab == "miCaja", t) { tab = "miCaja" }
                    TabCaja("Historial", tab == "historial", t) { tab = "historial" }
                }
            }
        }

        if (tab == "miCaja") {
            val caja = cajaAbierta
            if (caja != null) {
                val calculada = RepositorioOffline.calcularTotalesCaja(caja, context)
                val ventasTurno = RepositorioOffline.ventasDeCaja(context, caja)
                val gastos = RepositorioOffline.obtenerGastos(caja.id)
                val esperado = caja.montoInicial + calculada.totalVentas - calculada.totalGastos

                // ── Header caja activa ──
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp)
                            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Payments, contentDescription = null, tint = t.exito, modifier = Modifier.size(28.dp))
                        Spacer(Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Caja ${caja.numeroCaja}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                            Text("Abierta", fontSize = 12.sp, color = t.exito, fontWeight = FontWeight.SemiBold)
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            BotonCaja(Icons.Outlined.RemoveCircle, Color(0xFFF59E0B), "Gasto", t) { mostrarGasto = true }
                            BotonCaja(Icons.Outlined.Lock, Color(0xFFEF4444), "Cerrar", t) { mostrarCerrar = true }
                        }
                    }
                }

                // ── Estadísticas ──
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        EstadCaja(Icons.Outlined.Wallet, "Monto Inicial", fmt(caja.montoInicial), t, Modifier.weight(1f))
                        EstadCaja(Icons.Outlined.TrendingUp, "Ventas del Día", fmt(calculada.totalVentas), t, Modifier.weight(1f))
                    }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        EstadCaja(Icons.Outlined.ArrowDownward, "Gastos", fmt(calculada.totalGastos), t, Modifier.weight(1f), Color(0xFFEF4444))
                        EstadCaja(Icons.Outlined.Payments, "Total en Caja", fmt(esperado), t, Modifier.weight(1f), t.primario)
                    }
                }

                // ── Desglose por método ──
                item {
                    PanelCaja("Desglose por Método de Pago", t) {
                        FilaMetodo(Icons.Outlined.Payments, "Efectivo", fmt(calculada.totalEfectivo), t)
                        FilaMetodo(Icons.Outlined.CardGiftcard, "Tarjeta Débito", fmt(calculada.totalDebito), t)
                        FilaMetodo(Icons.Outlined.CardGiftcard, "Tarjeta Crédito", fmt(calculada.totalCredito), t)
                        FilaMetodo(Icons.Outlined.SwapHoriz, "Transferencia", fmt(calculada.totalTransferencia), t)
                    }
                }

                // ── Información del turno ──
                item {
                    PanelCaja("Información del Turno", t) {
                        FilaInfo("Fecha", caja.fechaCaja, t)
                        FilaInfo("Hora Apertura", caja.fechaApertura.takeIf { it.length >= 16 }?.substring(11, 16) ?: "—", t)
                        FilaInfo("Ventas Realizadas", "${ventasTurno.size}", t)
                        FilaInfo("Gastos", "${gastos.size}", t)
                    }
                }

                // ── Ventas del turno ──
                item {
                    PanelCaja("Ventas del Turno (${ventasTurno.size})", t) {
                        if (ventasTurno.isEmpty()) {
                            Text("Sin ventas en este turno", fontSize = 13.sp, color = t.textoTerciario, modifier = Modifier.padding(vertical = 6.dp))
                        } else {
                            ventasTurno.forEach { v ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(v.ncf, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                                        Text(v.fecha.takeIf { it.length >= 16 }?.substring(11, 16) ?: "—", fontSize = 11.sp, color = t.textoTerciario)
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(v.metodoPago, fontSize = 11.sp, color = t.textoSecundario)
                                        Text(fmt(v.total), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.exito)
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // ── Sin caja abierta ──
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 40.dp)
                            .border(2.dp, t.bordeMedio, RoundedCornerShape(16.dp))
                            .padding(vertical = 40.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Outlined.Lock, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("No tienes una caja abierta", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                        Text("Abre una caja para comenzar a registrar ventas", fontSize = 13.sp, color = t.textoSecundario, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp))
                        Spacer(Modifier.height(16.dp))
                        Row(
                            modifier = Modifier
                                .background(t.exito, RoundedCornerShape(8.dp))
                                .clickable { mostrarAbrir = true }
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Abrir Caja", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        } else {
            // ── Historial ──
            item { Text("Historial de Cajas", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)) }
            if (historial.isEmpty()) {
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 40.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Outlined.Schedule, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(36.dp))
                        Spacer(Modifier.height(8.dp))
                        Text("Sin cajas cerradas", color = t.textoTerciario, fontSize = 14.sp)
                    }
                }
            } else {
                items(historial, key = { it.id }) { cajaCerrada ->
                    PanelCaja("Caja ${cajaCerrada.numeroCaja} · ${cajaCerrada.fechaCaja}", t) {
                        FilaInfo("Estado", cajaCerrada.estado, t)
                        FilaInfo("Monto Inicial", fmt(cajaCerrada.montoInicial), t)
                        FilaInfo("Ventas", fmt(cajaCerrada.totalVentas), t)
                        FilaInfo("Gastos", fmt(cajaCerrada.totalGastos), t)
                        FilaInfo("Esperado", fmt(cajaCerrada.montoInicial + cajaCerrada.totalVentas - cajaCerrada.totalGastos), t)
                        FilaInfo("Real", fmt(cajaCerrada.montoFinal), t)
                        FilaInfo("Diferencia", fmt(cajaCerrada.diferencia), t, if (cajaCerrada.diferencia != 0.0) Color(0xFFEF4444) else t.exito)
                        FilaInfo("Método de Pago Cierre", "efectivo", t)
                    }
                }
            }
        }
    }

    // ── Modal Abrir Caja ──
    if (mostrarAbrir) {
        ModalAbrirCaja(t, context, onCerrar = { mostrarAbrir = false }) {
            mostrarAbrir = false
            cajaAbierta = RepositorioOffline.obtenerCajaAbierta()
        }
    }

    // ── Modal Registrar Gasto ──
    if (mostrarGasto) {
        ModalGasto(t, context, cajaAbierta?.id ?: 0, onCerrar = { mostrarGasto = false }) {
            mostrarGasto = false
            cajaAbierta = RepositorioOffline.obtenerCajaAbierta()
        }
    }

    // ── Modal Cerrar Caja ──
    if (mostrarCerrar) {
        val caja = cajaAbierta
        if (caja != null) {
            ModalCerrarCaja(t, context, caja, onCerrar = { mostrarCerrar = false }) {
                mostrarCerrar = false
                cajaAbierta = RepositorioOffline.obtenerCajaAbierta()
                historial = RepositorioOffline.obtenerHistorialCajas()
                tab = "historial"
            }
        }
    }
}

@Composable
private fun TabCaja(texto: String, activo: Boolean, t: TokensWeb, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .background(if (activo) t.primarioClaro else t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, if (activo) t.primario.copy(alpha = 0.5f) else t.bordeClaro, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(if (activo) Icons.Outlined.Calculate else Icons.Outlined.Schedule, contentDescription = null, tint = if (activo) t.primario else t.textoSecundario, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(texto, color = if (activo) t.primario else t.textoSecundario, fontSize = 13.sp, fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium)
    }
}

@Composable
private fun BotonCaja(icono: androidx.compose.ui.graphics.vector.ImageVector, color: Color, texto: String, t: TokensWeb, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .background(color.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(4.dp))
        Text(texto, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun EstadCaja(icono: androidx.compose.ui.graphics.vector.ImageVector, etiqueta: String, valor: String, t: TokensWeb, modifier: Modifier = Modifier, color: Color = t.textoSecundario) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(18.dp))
        Spacer(Modifier.height(4.dp))
        Text(etiqueta, fontSize = 10.sp, color = t.textoSecundario)
        Text(valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
    }
}

@Composable
private fun PanelCaja(titulo: String, t: TokensWeb, contenido: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(titulo, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        Spacer(Modifier.height(6.dp))
        Column(modifier = Modifier.fillMaxWidth()) {
            contenido()
        }
    }
}

@Composable
private fun FilaMetodo(icono: androidx.compose.ui.graphics.vector.ImageVector, etiqueta: String, valor: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(8.dp))
        Text(etiqueta, fontSize = 13.sp, color = t.textoPrimario, modifier = Modifier.weight(1f))
        Text(valor, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
    }
}

@Composable
private fun FilaInfo(etiqueta: String, valor: String, t: TokensWeb, colorValor: Color = t.textoPrimario) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(etiqueta, fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
        Text(valor, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colorValor)
    }
}

// ─────────────────────── MODALES ───────────────────────

@Composable
private fun ModalAbrirCaja(t: TokensWeb, context: android.content.Context, onCerrar: () -> Unit, onAbrir: () -> Unit) {
    var montoInicial by remember { mutableStateOf("") }
    val numeros = remember { (1..3).toList() }
    val abiertas = remember { RepositorioOffline.obtenerCajas().filter { it.estado == "abierta" }.map { it.numeroCaja }.toSet() }
    val disponibles = numeros.filter { it !in abiertas }
    var idx by remember { mutableStateOf(if (disponibles.isNotEmpty()) 0 else 0) }
    val numero = disponibles.getOrElse(idx) { 1 }

    AlertCaja(
        titulo = "Abrir Caja",
        t = t,
        onCerrar = onCerrar,
        contenido = {
            Text("Número de Caja Disponible *", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
            SelectNumeroCaja("Caja $numero", (1..3).map { "Caja $it" }, disponibles.indexOf(numero).coerceAtLeast(0), t) { idx = it }
            Spacer(Modifier.height(12.dp))
            Text("Monto Inicial *", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
            CampoMonedaCaja(montoInicial, { montoInicial = it }, t)
        },
        onConfirmar = {
            if (montoInicial.toDoubleOrNull() != null) {
                RepositorioOffline.abrirCaja(context, numero, montoInicial.toDoubleOrNull() ?: 0.0)
                onAbrir()
            }
        },
        textoConfirmar = "Abrir Caja"
    )
}

@Composable
private fun ModalGasto(t: TokensWeb, context: android.content.Context, cajaId: Int, onCerrar: () -> Unit, onGuardar: () -> Unit) {
    var concepto by remember { mutableStateOf("") }
    var monto by remember { mutableStateOf("") }
    var categoria by remember { mutableStateOf("") }
    var comprobante by remember { mutableStateOf("") }
    var notas by remember { mutableStateOf("") }

    AlertCaja(
        titulo = "Registrar Gasto",
        t = t,
        onCerrar = onCerrar,
        contenido = {
            CampoEtiqueta("Concepto *", t) { CampoWeb(valor = concepto, onValor = { concepto = it }, tokens = t, placeholder = "Ej: Compra de insumos", alto = 40) }
            CampoEtiqueta("Monto *", t) { CampoMonedaCaja(monto, { monto = it }, t) }
            CampoEtiqueta("Categoría", t) { CampoWeb(valor = categoria, onValor = { categoria = it }, tokens = t, placeholder = "Ej: Operativo", alto = 40) }
            CampoEtiqueta("Número de Comprobante", t) { CampoWeb(valor = comprobante, onValor = { comprobante = it }, tokens = t, placeholder = "Ej: FAC-001", alto = 40) }
            CampoEtiqueta("Notas", t) { CampoAreaCaja(notas, { notas = it }, t, "Detalles adicionales...") }
        },
        onConfirmar = {
            val m = monto.toDoubleOrNull()
            if (concepto.isNotBlank() && m != null && m > 0) {
                RepositorioOffline.registrarGasto(context, cajaId, concepto.trim(), m, categoria.trim(), comprobante.trim(), notas.trim())
                onGuardar()
            }
        },
        textoConfirmar = "Registrar Gasto"
    )
}

@Composable
private fun ModalCerrarCaja(t: TokensWeb, context: android.content.Context, caja: CajaOffline, onCerrar: () -> Unit, onCerrada: () -> Unit) {
    val calculada = remember(caja.id) { RepositorioOffline.calcularTotalesCaja(caja, context) }
    val esperado = caja.montoInicial + calculada.totalVentas - calculada.totalGastos
    var montoFinal by remember { mutableStateOf("") }
    var notas by remember { mutableStateOf("") }
    val montoNum = montoFinal.toDoubleOrNull() ?: 0.0
    val diferencia = if (montoFinal.isNotBlank()) montoNum - esperado else 0.0

    AlertCaja(
        titulo = "Cerrar Caja",
        t = t,
        onCerrar = onCerrar,
        contenido = {
            Text("Cuenta el dinero físico en caja e ingresa el monto total", fontSize = 13.sp, color = t.textoSecundario)
            Spacer(Modifier.height(10.dp))
            FilaInfo("Monto Inicial:", "${RepositorioOffline.simboloMoneda()} %.2f".format(caja.montoInicial), t)
            FilaInfo("Ventas:", "${RepositorioOffline.simboloMoneda()} %.2f".format(calculada.totalVentas), t, Color(0xFF10B981))
            FilaInfo("Gastos:", "-${RepositorioOffline.simboloMoneda()} %.2f".format(calculada.totalGastos), t, Color(0xFFEF4444))
            FilaInfo("Esperado en Caja:", "${RepositorioOffline.simboloMoneda()} %.2f".format(esperado), t, t.primario)
            Spacer(Modifier.height(10.dp))
            CampoEtiqueta("Monto Final en Caja *", t) { CampoMonedaCaja(montoFinal, { montoFinal = it }, t) }
            if (montoFinal.isNotBlank()) {
                FilaInfo(
                    "Diferencia:",
                    "${RepositorioOffline.simboloMoneda()} %.2f".format(diferencia),
                    t,
                    if (diferencia < 0) Color(0xFFEF4444) else Color(0xFF10B981)
                )
            }
            CampoEtiqueta("Notas", t) { CampoAreaCaja(notas, { notas = it }, t, "Observaciones del cierre...") }
        },
        onConfirmar = {
            if (montoFinal.toDoubleOrNull() != null) {
                RepositorioOffline.cerrarCaja(context, caja.id, montoFinal.toDoubleOrNull() ?: 0.0, notas.trim())
                onCerrada()
            }
        },
        textoConfirmar = "Cerrar Caja"
    )
}

@Composable
private fun AlertCaja(
    titulo: String,
    t: TokensWeb,
    onCerrar: () -> Unit,
    contenido: @androidx.compose.runtime.Composable () -> Unit,
    onConfirmar: () -> Unit,
    textoConfirmar: String
) {
    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCerrar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = true)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .background(t.fondoElevado, RoundedCornerShape(16.dp))
                .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                .padding(16.dp)
        ) {
            Text(titulo, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
            Spacer(Modifier.height(12.dp))
            Column(modifier = Modifier.fillMaxWidth().heightIn(max = 500.dp)) {
                contenido()
            }
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                        .clickable(onClick = onCerrar)
                        .padding(vertical = 11.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Cancelar", color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(t.exito, RoundedCornerShape(8.dp))
                        .clickable(onClick = onConfirmar)
                        .padding(vertical = 11.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(textoConfirmar, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun CampoEtiqueta(etiqueta: String, t: TokensWeb, contenido: @androidx.compose.runtime.Composable () -> Unit) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(etiqueta, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(bottom = 5.dp))
        contenido()
    }
}

@Composable
private fun CampoMonedaCaja(valor: String, onValor: (String) -> Unit, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(RepositorioOffline.simboloMoneda(), color = t.textoSecundario, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 10.dp, end = 6.dp))
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            singleLine = true,
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier
                .weight(1f)
                .padding(end = 10.dp)
        )
    }
}

@Composable
private fun CampoAreaCaja(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 60.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier.fillMaxWidth()
        )
        if (valor.isEmpty()) {
            Text(placeholder, color = t.textoTerciario, fontSize = 13.sp)
        }
    }
}

@Composable
private fun SelectNumeroCaja(actual: String, opciones: List<String>, idx: Int, t: TokensWeb, onSeleccion: (Int) -> Unit) {
    var expandido by remember { mutableStateOf(false) }
    Box(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(40.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .clickable { expandido = true }
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(actual, color = t.textoPrimario, fontSize = 14.sp, modifier = Modifier.weight(1f))
            Icon(Icons.Outlined.KeyboardArrowDown, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
        }
        androidx.compose.material3.DropdownMenu(
            expanded = expandido,
            onDismissRequest = { expandido = false },
            containerColor = t.fondoElevado
        ) {
            opciones.forEachIndexed { i, opc ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(opc, color = t.textoPrimario, fontSize = 13.sp) },
                    onClick = { onSeleccion(i); expandido = false }
                )
            }
        }
    }
}