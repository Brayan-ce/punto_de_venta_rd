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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Call
import androidx.compose.material.icons.outlined.CardGiftcard
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material.icons.outlined.Star
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Detalle del Cliente. Réplica de _Pages/admin/clientes/ver/ver.js.
 * Header con nombre/badge/doc + acciones, tabs (Perfil/Cobros/Historial) y perfil.
 */
@Composable
fun VerClientePantalla(
    idioma: Idioma,
    oscuro: Boolean,
    clienteId: Long,
    onEditar: () -> Unit,
    onVender: (ClienteMovil) -> Unit,
    onCerrar: () -> Unit
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

    var tab by remember { mutableStateOf("perfil") }
    val detalle = remember(clienteId) { RepositorioOffline.obtenerClientePorId(clienteId) }
    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }

    val cliente = detalle ?: run {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(t.fondoContenido)
                .padding(40.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Cliente no encontrado", color = t.textoSecundario, fontSize = 14.sp)
        }
        return
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .background(if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9), RoundedCornerShape(10.dp))
                        .clickable(onClick = onCerrar),
                    contentAlignment = Alignment.Center
                ) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, tint = t.textoSecundario, modifier = Modifier.size(20.dp)) }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(cliente.nombreCompleto, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1)
                        BadgeVer(if (cliente.activo) "Activo" else "Inactivo", if (cliente.activo) Color(0xFF10B981) else Color(0xFF64748B), t)
                    }
                    Text("CED: ${cliente.documento.ifBlank { "—" }}", fontSize = 12.sp, color = t.textoSecundario)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    BotonIconoVer(Icons.Outlined.Create, t.primario, t, onEditar)
                    BotonIconoVer(Icons.Outlined.ShoppingCart, Color(0xFF059669), t, {
                        onVender(
                            ClienteMovil(
                                id = cliente.id.toLong(),
                                nombre = cliente.nombreCompleto,
                                tipoDocumento = "CED",
                                numeroDocumento = cliente.documento,
                                telefono = cliente.telefono,
                                estadoCredito = "normal",
                                tieneDeuda = false,
                                deudaTotal = 0.0,
                                porcentajeUso = 0,
                                utilizado = 0.0,
                                disponible = 0.0,
                                clasificacion = cliente.clasificacion,
                                score = cliente.score,
                                puedeVender = true
                            )
                        )
                    })
                }
            }
        }

        // ── Tabs ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                TabVer("Perfil", tab == "perfil", t) { tab = "perfil" }
                TabVer("Cobros", tab == "cobros", t) { tab = "cobros" }
                TabVer("Historial", tab == "historial", t) { tab = "historial" }
            }
        }

        if (tab == "perfil") {
            // ── Avatar + stats ──
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                        .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .background(t.fondoTerciario, RoundedCornerShape(50)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.PersonOutline, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(36.dp))
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                        StatVer("Compras Totales", fmt(0.0), t)
                        StatVer("Puntos", "0", t)
                        StatVer("Deuda Total", fmt(0.0), t, Color(0xFF10B981))
                    }
                }
            }

            // ── Contacto ──
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                        .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                        .padding(14.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Call, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Contacto", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    }
                    Spacer(Modifier.height(8.dp))
                    FilaContacto(Icons.Outlined.Call, "Teléfono", cliente.telefono.ifBlank { "—" }, t)
                    FilaContacto(Icons.Outlined.Star, "Clasificación", "Clase ${cliente.clasificacion}", t)
                    FilaContacto(Icons.Outlined.Payments, "Score", "${cliente.score}", t)
                }
            }

            // ── Sin perfil crediticio ──
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                        .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Outlined.CardGiftcard, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(32.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("Sin Perfil Crediticio", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Text("Este cliente no tiene crédito configurado.", fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.padding(top = 4.dp))
                }
            }
        } else {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 40.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Outlined.Receipt, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(36.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("Sin registros", color = t.textoTerciario, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
private fun BadgeVer(texto: String, color: Color, t: TokensWeb) {
    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(50))
            .border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(50))
            .padding(horizontal = 8.dp, vertical = 2.dp)
    ) {
        Text(texto, color = color, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun BotonIconoVer(icono: androidx.compose.ui.graphics.vector.ImageVector, color: Color, t: TokensWeb, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(38.dp)
            .background(color.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun TabVer(texto: String, activo: Boolean, t: TokensWeb, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .background(if (activo) t.primarioClaro else t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, if (activo) t.primario.copy(alpha = 0.5f) else t.bordeClaro, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(if (activo) Icons.Outlined.PersonOutline else Icons.Outlined.Wallet, contentDescription = null, tint = if (activo) t.primario else t.textoSecundario, modifier = Modifier.size(14.dp))
        Spacer(Modifier.width(5.dp))
        Text(texto, color = if (activo) t.primario else t.textoSecundario, fontSize = 13.sp, fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium)
    }
}

@Composable
private fun StatVer(etiqueta: String, valor: String, t: TokensWeb, color: Color = t.textoPrimario) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(etiqueta, fontSize = 11.sp, color = t.textoSecundario)
        Text(valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = color)
    }
}

@Composable
private fun FilaContacto(icono: androidx.compose.ui.graphics.vector.ImageVector, etiqueta: String, valor: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(8.dp))
        Text(etiqueta, fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
        Text(valor, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario)
    }
}