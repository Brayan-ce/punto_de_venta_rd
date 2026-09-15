package com.isiweek.puntodeventa.pantallas.proveedores

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
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.Payments
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
import com.isiweek.puntodeventa.offline.RepositorioOffline.CompraOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.ProveedorOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * Pantalla Detalles del Proveedor. Réplica de _Pages/admin/proveedores/ver.
 * Muestra la información del proveedor y sus estadísticas/últimas compras
 * calculadas desde la base de datos local.
 */
@Composable
fun VerProveedorPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    proveedorId: Int?,
    onEditar: () -> Unit,
    onEliminar: () -> Unit,
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

    val context = LocalContext.current
    var confirmarEliminar by remember { mutableStateOf(false) }

    val prov = remember(proveedorId) { proveedorId?.let { RepositorioOffline.obtenerProveedorPorId(it) } }
    val compras = remember(proveedorId) { RepositorioOffline.obtenerCompras().filter { it.proveedorId == proveedorId } }
    val totalCompras = compras.size
    val montoTotal = compras.filter { it.estado == "recibida" }.sumOf { it.total }
    val ultimasCompras = compras.take(5)

    if (prov == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(t.fondoContenido)
                .padding(40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(Icons.Outlined.LocalShipping, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
            Spacer(Modifier.height(8.dp))
            Text(Traducciones.texto("proveedores.noEncontrado", idioma), color = t.textoTerciario, fontSize = 14.sp)
        }
        return
    }

    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }
    val colorEstado = if (prov.activo) Color(0xFF10B981) else Color(0xFF64748B)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // ── Header + acciones ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp)
            ) {
                Text(Traducciones.texto("proveedores.detalles", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(Traducciones.texto("proveedores.detallesSub", idioma), fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.padding(bottom = 10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    BotonHeaderProveedor(Icons.Outlined.Create, Color(0xFFF59E0B), Traducciones.texto("proveedores.editarBtn", idioma), onEditar)
                    BotonHeaderProveedor(Icons.Outlined.DeleteOutline, Color(0xFFEF4444), Traducciones.texto("proveedores.eliminar", idioma), { confirmarEliminar = true })
                    BotonHeaderProveedor(Icons.AutoMirrored.Outlined.ArrowBack, t.textoSecundario, Traducciones.texto("proveedores.volver", idioma), onCerrar)
                }
            }
        }

        // ── Información General ──
        item {
            PanelDetalleProveedor(t) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(Traducciones.texto("proveedores.infoGeneral", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.weight(1f))
                    Box(
                        modifier = Modifier
                            .background(colorEstado.copy(alpha = 0.15f), RoundedCornerShape(50))
                            .border(1.dp, colorEstado.copy(alpha = 0.3f), RoundedCornerShape(50))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = if (prov.activo) Traducciones.texto("proveedores.activoBadge", idioma) else Traducciones.texto("proveedores.inactivoBadge", idioma),
                            color = colorEstado,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                FilaDetalle("RNC", prov.rnc.ifBlank { "—" }, t)
                FilaDetalle(Traducciones.texto("proveedores.nombreComercial", idioma), prov.nombreComercial.ifBlank { "—" }, t)
                FilaDetalle(Traducciones.texto("proveedores.razonSocial", idioma), prov.razonSocial.ifBlank { "—" }, t)
                FilaDetalle(Traducciones.texto("proveedores.actividadEconomica", idioma), prov.actividadEconomica.ifBlank { "—" }, t)
                FilaDetalle(Traducciones.texto("proveedores.contacto", idioma), prov.contacto.ifBlank { "—" }, t)
                FilaDetalle(Traducciones.texto("proveedores.telefono", idioma), prov.telefono.ifBlank { "—" }, t)
                FilaDetalle(Traducciones.texto("proveedores.email", idioma), prov.email.ifBlank { "—" }, t)
                FilaDetalle(Traducciones.texto("proveedores.direccion", idioma), listOf(prov.direccion, prov.sector, prov.municipio, prov.provincia).filter { it.isNotBlank() }.joinToString(", ").ifBlank { "—" }, t)
                FilaDetalle(Traducciones.texto("proveedores.condicionesPago", idioma), prov.condicionesPago.ifBlank { "—" }, t)
            }
        }

        // ── Estadísticas de Compras ──
        item {
            PanelDetalleProveedor(t) {
                Text(Traducciones.texto("proveedores.estadComprasPanel", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    EstadCompraProveedor(Icons.Outlined.LocalShipping, Traducciones.texto("proveedores.estadCompras", idioma), totalCompras.toString(), Color(0xFF2563EB), t, Modifier.weight(1f))
                    EstadCompraProveedor(Icons.Outlined.Payments, Traducciones.texto("proveedores.estadMonto", idioma), fmt(montoTotal), Color(0xFF8B5CF6), t, Modifier.weight(1f))
                }
            }
        }

        // ── Últimas Compras ──
        item {
            PanelDetalleProveedor(t) {
                Text(Traducciones.texto("proveedores.ultimasCompras", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 8.dp))
                if (ultimasCompras.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Outlined.LocalShipping, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(24.dp))
                        Spacer(Modifier.height(6.dp))
                        Text(Traducciones.texto("proveedores.sinCompras", idioma), color = t.textoTerciario, fontSize = 13.sp)
                    }
                } else {
                    ultimasCompras.forEach { compra ->
                        FilaCompraProveedor(compra, t, idioma, fmt)
                    }
                }
            }
        }
    }

    // ── Confirmación de eliminación ──
    if (confirmarEliminar) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { confirmarEliminar = false },
            title = { Text(Traducciones.texto("proveedores.eliminar", idioma), fontWeight = FontWeight.Bold) },
            text = {
                Text(Traducciones.texto("proveedores.confirmarEliminar", idioma) + " \"${prov.nombreComercial}\"?")
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    confirmarEliminar = false
                    if (RepositorioOffline.eliminarProveedor(context, prov.id)) {
                        onEliminar()
                    }
                }) {
                    Text(Traducciones.texto("proveedores.eliminar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { confirmarEliminar = false }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun BotonHeaderProveedor(icono: ImageVector, color: Color, texto: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .background(color.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .border(1.dp, color.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(5.dp))
        Text(texto, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun PanelDetalleProveedor(t: TokensWeb, contenido: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        contenido()
    }
}

@Composable
private fun FilaDetalle(etiqueta: String, valor: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = etiqueta, color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(text = valor, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1.2f))
    }
}

@Composable
private fun EstadCompraProveedor(
    icono: ImageVector,
    etiqueta: String,
    valor: String,
    color: Color,
    t: TokensWeb,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(t.fondoContenido, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(text = etiqueta, fontSize = 11.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(text = valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun FilaCompraProveedor(
    compra: CompraOffline,
    t: TokensWeb,
    idioma: Idioma,
    fmt: (Double) -> String
) {
    val estadoColor = when (compra.estado) {
        "recibida" -> Color(0xFF10B981)
        "pendiente" -> Color(0xFFF59E0B)
        else -> Color(0xFFEF4444)
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(compra.ncf.ifBlank { "—" }, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(formatearFechaCompraProv(compra.fecha), color = t.textoTerciario, fontSize = 11.sp)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(fmt(compra.total), color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Box(
                modifier = Modifier
                    .background(estadoColor.copy(alpha = 0.15f), RoundedCornerShape(50))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = when (compra.estado) {
                        "recibida" -> Traducciones.texto("compras.recibida", idioma)
                        "pendiente" -> Traducciones.texto("compras.pendiente", idioma)
                        else -> Traducciones.texto("compras.anulada", idioma)
                    },
                    color = estadoColor,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

private fun formatearFechaCompraProv(fecha: String): String {
    return try {
        val entrada = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
        val salida = SimpleDateFormat("d 'de' MMM 'de' yyyy", Locale("es", "DO"))
        salida.format(entrada.parse(fecha) ?: return fecha)
    } catch (e: Exception) {
        fecha
    }
}