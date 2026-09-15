package com.isiweek.puntodeventa.pantallas.ticket

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
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Print
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.recibo.ReceiptEscPos
import com.isiweek.puntodeventa.recibo.ReceiptExportManager
import com.isiweek.puntodeventa.recibo.ReceiptMapper
import com.isiweek.puntodeventa.recibo.ReceiptPreview
import com.isiweek.puntodeventa.recibo.ReceiptPrintManager
import com.isiweek.puntodeventa.recibo.ReceiptShareManager
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import com.isiweek.puntodeventa.utils.ImpresoraServicio
import kotlinx.coroutines.launch

/**
 * Página Boucher/Ticket de Venta. Réplica del recibo de pago de financiamiento
 * (mismo diseño de preview, switches y acciones de impresión) con los datos de la venta.
 */

// ─────────────────────── MODELO ───────────────────────

data class LineaTicket(
    val nombre: String,
    val cantidad: Double,
    val precio: Double,
    val total: Double,
    val esExtra: Boolean = false
)

data class TicketVenta(
    val numeroInterno: String,
    val ncf: String,
    val tipoComprobante: String,
    val fecha: String,
    val clienteNombre: String?,
    val clienteDocumento: String? = null,
    val vendedorNombre: String,
    val metodoPago: String,
    val lineas: List<LineaTicket>,
    val subtotal: Double,
    val itbis: Double,
    val descuento: Double = 0.0,
    val total: Double,
    val efectivoRecibido: Double = 0.0,
    val cambio: Double = 0.0
)

private val IconoWhatsApp: ImageVector by lazy {
    val nodos = PathParser().parsePathString(
        "M12,2A10,10 0 0,0 2,12C2,13.89 2.54,15.68 3.58,17.23L2.29,22L7.08,20.77C8.63,21.74 10.28,22 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20C10.5,20 9.05,19.65 7.73,18.97L7.3,18.75L4.6,19.53L5.38,16.89L5.13,16.44C4.39,15.1 4,13.59 4,12A8,8 0 0,1 12,4M8.5,8.28C8.33,8.32 8.07,8.4 7.84,8.64C7.61,8.88 7.2,9.27 7.2,10C7.2,10.73 7.85,11.86 7.97,12C8.09,12.14 8.84,13.87 10.23,14.83C11.62,15.79 12.79,16.12 13.31,16.22C13.83,16.32 14.44,16.19 14.75,15.9C15.06,15.61 15.5,15 15.61,14.76C15.72,14.52 15.75,14.27 15.66,14.13C15.57,13.99 15.45,13.92 15.34,13.86C15.23,13.8 14.06,13.23 13.9,13.17C13.74,13.11 13.62,13.11 13.52,13.27C13.42,13.43 13.14,13.83 13.04,13.99C12.94,14.15 12.84,14.17 12.72,14.12C12.6,14.07 11.88,13.78 11.05,13.12C10.38,12.61 9.91,11.98 9.73,11.74C9.55,11.5 9.73,11.36 9.85,11.25C9.93,11.18 10.04,11.05 10.12,10.93C10.2,10.81 10.24,10.72 10.24,10.6C10.24,10.48 10.12,9.93 10.1,9.73C10.08,9.53 10.06,9.47 9.9,9.43C9.74,9.39 9.4,9.34 9.1,9.4C8.8,9.46 8.5,9.62 8.5,9.86C8.5,10.1 8.55,10.33 8.57,10.4C8.59,10.47 8.68,10.62 8.83,10.76C9.14,11.12 9.47,11.46 9.74,11.7C9.67,11.8 9.62,11.91 9.55,12.04C9.29,12.34 8.5,11.69 8.45,11.62C8.4,11.55 7.88,10.84 7.88,10C7.88,9.16 8.5,8.64 8.5,8.28Z"
    ).toNodes()
    ImageVector.Builder(
        name = "WhatsApp",
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f
    ).apply {
        addPath(
            pathData = nodos,
            pathFillType = PathFillType.NonZero,
            fill = SolidColor(Color.Black)
        )
    }.build()
}

// ─────────────────────── PANTALLA ───────────────────────

@Composable
fun TicketPantalla(
    ticket: TicketVenta,
    idioma: Idioma,
    oscuro: Boolean,
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
    val ambito = rememberCoroutineScope()

    var tamano by remember { mutableStateOf("80mm") }
    var opciones by remember {
        mutableStateOf(
            mapOf(
                "empresa" to true, "cliente" to true, "cuotas" to true, "metodo" to true,
                "saldo" to false, "notas" to true, "mensaje" to true
            )
        )
    }
    var banner by remember { mutableStateOf<String?>(null) }

    val data = remember(ticket, opciones) { ReceiptMapper.fromTicketVenta(ticket, opciones) }

    val listaOpciones = listOf(
        "empresa" to Traducciones.texto("imprimir.opEmpresa", idioma),
        "cliente" to Traducciones.texto("imprimir.opCliente", idioma),
        "cuotas" to Traducciones.texto("imprimir.opCuotasAplicadas", idioma),
        "metodo" to Traducciones.texto("imprimir.opMetodoPago", idioma),
        "saldo" to Traducciones.texto("imprimir.opSaldoRestante", idioma),
        "notas" to Traducciones.texto("imprimir.opNotas", idioma),
        "mensaje" to Traducciones.texto("imprimir.opMensajeFinal", idioma)
    )

    fun textoEscPos(): String = ReceiptEscPos.generar(data, tamano)

    fun toggleOpcion(clave: String) {
        opciones = opciones + (clave to (opciones[clave] != true))
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(14.dp).background(t.fondoPrincipal, RoundedCornerShape(12.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp)).padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.size(38.dp).background(if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9), RoundedCornerShape(10.dp)).clickable(onClick = onCerrar),
                    contentAlignment = Alignment.Center
                ) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, tint = t.textoSecundario, modifier = Modifier.size(20.dp)) }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(Traducciones.texto("ticket.titulo", idioma), fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                    Text("${ticket.numeroInterno} · ${ticket.clienteNombre ?: Traducciones.texto("vender.consumidorFinal", idioma)}", fontSize = 12.sp, color = t.textoSecundario)
                }
            }
        }

        banner?.let { msg ->
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp).background(if (oscuro) Color(0xFF022C22) else Color(0xFFD1FAE5), RoundedCornerShape(10.dp)).padding(horizontal = 14.dp, vertical = 11.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Check, null, tint = Color(0xFF10B981), modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(msg, color = Color(0xFF065F46), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                    Icon(Icons.Outlined.Close, null, tint = Color(0xFF065F46), modifier = Modifier.size(16.dp).clickable { banner = null })
                }
            }
        }

        item {
            Column(
                modifier = Modifier.fillMaxWidth().padding(14.dp).background(t.fondoPrincipal, RoundedCornerShape(12.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp)).padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column {
                    Text(Traducciones.texto("imprimir.tamanoPapel", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        listOf("58mm", "80mm", "A4").forEach { s ->
                            val activo = tamano == s
                            Box(
                                modifier = Modifier
                                    .border(2.dp, if (activo) Color(0xFF0EA5E9) else if (oscuro) Color(0xFF475569) else Color(0xFFCBD5E1), RoundedCornerShape(8.dp))
                                    .background(if (activo) Color(0xFF0EA5E9) else Color.Transparent, RoundedCornerShape(8.dp))
                                    .clickable { tamano = s }
                                    .padding(horizontal = 20.dp, vertical = 10.dp)
                            ) { Text(s, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = if (activo) Color.White else if (oscuro) Color(0xFF94A3B8) else Color(0xFF64748B)) }
                        }
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    BotonReciboVenta(Icons.Outlined.Print, Traducciones.texto("imprimir.termica", idioma), Color(0xFF10B981), t, Modifier.weight(1f)) {
                        val abierto = ImpresoraServicio.abrirRawBTFormateado(context, textoEscPos())
                        if (!abierto) {
                            banner = Traducciones.texto("imprimir.rawbtNoInstalada", idioma)
                        }
                    }
                    BotonReciboVenta(Icons.Outlined.Print, Traducciones.texto("imprimir.normal", idioma), Color(0xFF3B82F6), t, Modifier.weight(1f)) {
                        ReceiptPrintManager.print(context, data, tamano)
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    BotonReciboVenta(IconoWhatsApp, Traducciones.texto("imprimir.whatsApp", idioma), Color(0xFF25D366), t, Modifier.weight(1f)) {
                        ambito.launch {
                            try {
                                val uri = ReceiptExportManager.exportAsPng(context, data)
                                ReceiptShareManager.shareImage(context, uri)
                            } catch (e: Exception) {
                                banner = Traducciones.texto("imprimir.copiadoTermica", idioma)
                            }
                        }
                    }
                }
            }
        }

        item {
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp).background(t.fondoPrincipal, RoundedCornerShape(12.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp)).padding(16.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Check, null, tint = Color(0xFF10B981), modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(Traducciones.texto("imprimir.mostrarEnRecibo", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                }
                Spacer(Modifier.height(6.dp))
                listaOpciones.forEachIndexed { i, (clave, etiqueta) ->
                    val activo = opciones[clave] == true
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth().clickable { toggleOpcion(clave) }.padding(vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(etiqueta, fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
                            Box(
                                Modifier.width(44.dp).height(24.dp).background(if (activo) Color(0xFF10B981) else if (oscuro) Color(0xFF475569) else Color(0xFFCBD5E1), RoundedCornerShape(50)).padding(2.dp),
                                contentAlignment = if (activo) Alignment.CenterEnd else Alignment.CenterStart
                            ) { Box(Modifier.size(20.dp).background(Color.White, RoundedCornerShape(50))) }
                        }
                        if (i < listaOpciones.size - 1) {
                            Box(Modifier.fillMaxWidth().height(1.dp).background(if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9)))
                        }
                    }
                }
            }
        }

        item {
            Spacer(Modifier.height(12.dp))
            ReceiptPreview(
                data = data,
                tamano = tamano,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp)
            )
        }
    }
}

@Composable
private fun BotonReciboVenta(icono: ImageVector, texto: String, color: Color, t: TokensWeb, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Row(
        modifier = modifier
            .background(color, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 11.dp, horizontal = 6.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, null, tint = Color.White, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(5.dp))
        Text(
            texto,
            color = Color.White,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
    }
}