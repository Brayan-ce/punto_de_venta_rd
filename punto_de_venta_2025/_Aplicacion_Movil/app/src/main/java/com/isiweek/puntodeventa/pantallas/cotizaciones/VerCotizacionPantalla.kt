package com.isiweek.puntodeventa.pantallas.cotizaciones

import android.widget.Toast
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
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Print
import androidx.compose.material.icons.outlined.Send
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
import com.isiweek.puntodeventa.offline.RepositorioOffline.CotizacionOffline
import com.isiweek.puntodeventa.offline.RepositorioOffline.DetalleCotizacionOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Pantalla Ver Cotización. Réplica de _Pages/admin/cotizaciones/ver.
 * Muestra la información del cliente, productos y resumen, con acciones
 * de Enviar/Aprobar/Editar/Imprimir sobre la base de datos local.
 */
@Composable
fun VerCotizacionPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    cotizacionId: Int?,
    onEditar: () -> Unit,
    onImprimir: () -> Unit,
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
    var cot by remember(cotizacionId) { mutableStateOf(cotizacionId?.let { RepositorioOffline.obtenerCotizacionPorId(it) }) }
    val detalles = remember(cotizacionId) { cotizacionId?.let { RepositorioOffline.obtenerCotizacionDetalles(it) } ?: emptyList<com.isiweek.puntodeventa.offline.RepositorioOffline.DetalleCotizacionOffline>() }
    val cliente = remember(cot?.clienteId) {
        cot?.clienteId?.let { RepositorioOffline.obtenerClientesVenta().firstOrNull { c -> c.id == it } }
    }

    if (cot == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(t.fondoContenido)
                .padding(40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(Icons.Outlined.Description, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
            Spacer(Modifier.height(8.dp))
            Text(Traducciones.texto("cotizaciones.noEncontrada", idioma), color = t.textoTerciario, fontSize = 14.sp)
        }
        return
    }

    val c = cot!!
    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }
    val colorEstado = colorEstadoCotizacion(c.estado)

    fun cambiarEstado(nuevo: String) {
        if (RepositorioOffline.cambiarEstadoCotizacion(context, c.id, nuevo)) {
            cot = RepositorioOffline.obtenerCotizacionPorId(c.id)
            Toast.makeText(context, Traducciones.texto("cotizaciones.estadoCambiado", idioma), Toast.LENGTH_SHORT).show()
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // ── Header ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.AutoMirrored.Outlined.ArrowBack,
                        contentDescription = null,
                        tint = t.textoSecundario,
                        modifier = Modifier
                            .size(28.dp)
                            .clickable(onClick = onCerrar)
                    )
                    Spacer(Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("${Traducciones.texto("cotizaciones.titulo", idioma)} ${c.numero}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(c.cliente, fontSize = 12.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Icon(
                        Icons.Outlined.Print,
                        contentDescription = null,
                        tint = Color(0xFF8B5CF6),
                        modifier = Modifier
                            .size(30.dp)
                            .clickable(onClick = onImprimir)
                    )
                }
                Spacer(Modifier.height(10.dp))
                Box(
                    modifier = Modifier
                        .background(colorEstado.copy(alpha = 0.15f), RoundedCornerShape(50))
                        .border(1.dp, colorEstado.copy(alpha = 0.3f), RoundedCornerShape(50))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(Traducciones.texto("cotizaciones.${c.estado}", idioma), color = colorEstado, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // ── Acciones Enviar / Aprobar / Editar ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (c.estado == "borrador") {
                    BotonAccionVer(Icons.Outlined.Send, Color(0xFF3B82F6), Traducciones.texto("cotizaciones.enviar", idioma), Modifier.weight(1f)) { cambiarEstado("enviada") }
                }
                if (c.estado == "enviada") {
                    BotonAccionVer(Icons.Outlined.CheckCircle, Color(0xFF10B981), Traducciones.texto("cotizaciones.aprobar", idioma), Modifier.weight(1f)) { cambiarEstado("aprobada") }
                }
                BotonAccionVer(Icons.Outlined.Create, Color(0xFFF59E0B), Traducciones.texto("cotizaciones.editar", idioma), Modifier.weight(1f), onEditar)
            }
        }

        // ── Información del Cliente ──
        item {
            PanelVerCot(t, Traducciones.texto("cotizaciones.infoCliente", idioma)) {
                FilaInfoCot(Traducciones.texto("cotizaciones.cliente", idioma), c.cliente, t)
                FilaInfoCot(Traducciones.texto("cotizaciones.documento", idioma), cliente?.documento?.ifBlank { "N/A" } ?: "N/A", t)
                FilaInfoCot(Traducciones.texto("cotizaciones.telefono", idioma), cliente?.telefono?.ifBlank { "N/A" } ?: "N/A", t)
                FilaInfoCot(Traducciones.texto("cotizaciones.fechaEmision", idioma), c.fechaEmision, t)
                FilaInfoCot(Traducciones.texto("cotizaciones.fechaVencimiento", idioma), c.fechaVencimiento, t)
            }
        }

        // ── Productos ──
        item {
            PanelVerCot(t, "${Traducciones.texto("cotizaciones.productos", idioma)} (${detalles.size})") {
                if (detalles.isEmpty()) {
                    Text(Traducciones.texto("cotizaciones.sinProductos", idioma), color = t.textoTerciario, fontSize = 13.sp, modifier = Modifier.padding(vertical = 12.dp))
                } else {
                    // Cabecera de la tabla
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(t.fondoContenido, RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(Traducciones.texto("cotizaciones.producto", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.weight(1.4f))
                        Text("Cant.", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(54.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                        Text("Precio", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(84.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                        Text("Total", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                    }
                    detalles.forEach { d ->
                        FilaProductoVer(d, t, fmt)
                    }
                }
            }
        }

        // ── Resumen ──
        item {
            PanelVerCot(t, Traducciones.texto("cotizaciones.resumenEconomico", idioma)) {
                FilaResumenVer(Traducciones.texto("compras.subtotal", idioma), fmt(c.subtotal), t, false)
                FilaResumenVer(Traducciones.texto("cotizaciones.itbis", idioma), fmt(c.itbis), t, false)
                if (c.descuento > 0) {
                    FilaResumenVer(Traducciones.texto("cotizaciones.descuento", idioma), "- " + fmt(c.descuento), t, false)
                }
                FilaResumenVer(Traducciones.texto("compras.total", idioma), fmt(c.total), t, true)
            }
        }
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun BotonAccionVer(icono: ImageVector, color: Color, texto: String, modifier: Modifier, onClick: () -> Unit = {}) {
    Row(
        modifier = modifier
            .background(color.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .border(1.dp, color.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(texto, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun PanelVerCot(t: TokensWeb, titulo: String, contenido: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(titulo, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 10.dp))
        contenido()
    }
}

@Composable
private fun FilaInfoCot(etiqueta: String, valor: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = etiqueta, color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(text = valor, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1.2f))
    }
}

@Composable
private fun FilaProductoVer(d: DetalleCotizacionOffline, t: TokensWeb, fmt: (Double) -> String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1.4f)) {
            Text(d.nombreProducto, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (d.descripcionProducto.isNotBlank()) {
                Text(d.descripcionProducto, color = t.textoTerciario, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        Text("%.2f".format(d.cantidad), color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.width(54.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
        Text(fmt(d.precioUnitario), color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.width(84.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(fmt(d.total), color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun FilaResumenVer(etiqueta: String, valor: String, t: TokensWeb, resaltado: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = etiqueta,
            color = t.textoSecundario,
            fontSize = if (resaltado) 15.sp else 13.sp,
            fontWeight = if (resaltado) FontWeight.Bold else FontWeight.SemiBold,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = valor,
            color = if (resaltado) t.primario else t.textoPrimario,
            fontSize = if (resaltado) 17.sp else 14.sp,
            fontWeight = FontWeight.Bold
        )
    }
}