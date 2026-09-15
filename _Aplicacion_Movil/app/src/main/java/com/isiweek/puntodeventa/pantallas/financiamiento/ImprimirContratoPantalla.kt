package com.isiweek.puntodeventa.pantallas.financiamiento

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.Print
import androidx.compose.material.icons.outlined.Share
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

private data class OpcionBoucher(val clave: String, val etiqueta: String)

@Composable
fun ImprimirContratoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    contratoId: Int,
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
    val contrato = remember { obtenerContratoVer(contratoId) ?: obtenerContratoVerCompartido(contratoId) }
    var tamano by remember { mutableStateOf("80mm") }
    var opciones by remember {
        mutableStateOf(
            mapOf(
                "empresa" to true, "cliente" to true, "cobrador" to true,
                "cuotas" to true, "balance" to true, "fechas" to true, "mensaje" to true
            )
        )
    }

    val listaOpciones = listOf(
        OpcionBoucher("empresa", Traducciones.texto("imprimir.opEmpresa", idioma)),
        OpcionBoucher("cliente", Traducciones.texto("imprimir.opCliente", idioma)),
        OpcionBoucher("cobrador", Traducciones.texto("imprimir.opCobrador", idioma)),
        OpcionBoucher("cuotas", Traducciones.texto("imprimir.opCuotas", idioma)),
        OpcionBoucher("balance", Traducciones.texto("imprimir.opBalance", idioma)),
        OpcionBoucher("fechas", Traducciones.texto("imprimir.opFechas", idioma)),
        OpcionBoucher("mensaje", Traducciones.texto("imprimir.opMensaje", idioma))
    )

    fun textoPlano(): String {
        val c = contrato ?: return ""
        val ancho = if (tamano == "58mm") 32 else 42
        val linea = "-".repeat(ancho)
        fun centro(txt: String) = txt.padStart((ancho + txt.length) / 2)
        fun fila2(izq: String, der: String): String {
            val espacios = (ancho - izq.length - der.length).coerceAtLeast(1)
            return izq + " ".repeat(espacios) + der
        }
        val sb = StringBuilder()
        if (opciones["empresa"] == true) {
            sb.append(centro("PUNTO DE VENTA RD")).append('\n')
            sb.append(centro("Av. Independencia")).append('\n')
            sb.append(linea).append('\n')
        }
        sb.append(centro("COMPROBANTE DE PAGO")).append('\n')
        sb.append(linea).append('\n')
        if (opciones["cobrador"] == true) {
            sb.append("Cobrador: Negocio de prueba").append('\n')
            sb.append("Fecha: 28/08/2026 10:30").append('\n')
            sb.append(linea).append('\n')
        }
        sb.append("Contrato Id: ").append(c.numero).append('\n')
        sb.append(linea).append('\n')
        sb.append(centro(c.cliente.uppercase())).append('\n')
        sb.append(linea).append('\n')
        if (opciones["cliente"] == true) {
            sb.append("Documento: ").append(c.documento.ifBlank { "—" }).append('\n')
            sb.append("Telefono: ").append(c.telefono.ifBlank { "—" }).append('\n')
        }
        if (opciones["cuotas"] == true) {
            sb.append(linea).append('\n')
            sb.append(fila2("No.", fila2("Estado", "Monto"))).append('\n')
            sb.append(fila2("1/${c.meses}", fila2("pendiente", c.cuotaMensual))).append('\n')
            sb.append(linea).append('\n')
            sb.append(centro("Efectivo")).append('\n')
            sb.append(centro("TOTAL: " + c.cuotaMensual)).append('\n')
        }
        if (opciones["balance"] == true) {
            sb.append(linea).append('\n')
            sb.append("PENDIENTE: $").append(c.saldoPendiente).append('\n')
            sb.append("ATRASOS PENDIENTE: $0").append('\n')
            sb.append("MORA PENDIENTE: $0").append('\n')
            sb.append(linea).append('\n')
            sb.append("BALANCE: ").append(c.saldoPendiente).append('\n')
        }
        if (opciones["fechas"] == true) {
            sb.append(linea).append('\n')
            sb.append(centro("E:${c.fechaInicio} ==> Ven:${c.fechaFin}")).append('\n')
        }
        if (opciones["mensaje"] == true) {
            sb.append(linea).append('\n')
            sb.append(centro("GUARDE Y REVISE SU TICKET")).append('\n')
            sb.append(centro("!!Gracias!!Por preferirnos!!")).append('\n')
        }
        return sb.toString()
    }

    fun copiar() {
        val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText("ticket", textoPlano()))
    }

    fun compartir() {
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, textoPlano())
        }
        context.startActivity(Intent.createChooser(send, "Compartir ticket"))
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.size(32.dp).background(t.fondoTerciario, RoundedCornerShape(8.dp)).clickable(onClick = onCerrar),
                    contentAlignment = Alignment.Center
                ) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, tint = t.textoSecundario, modifier = Modifier.size(18.dp)) }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(Traducciones.texto("imprimir.titulo", idioma), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Text("${contrato?.numero ?: ""} · ${contrato?.cliente ?: ""}", fontSize = 11.sp, color = t.textoSecundario)
                }
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(Traducciones.texto("imprimir.papel", idioma), fontSize = 12.sp, color = t.textoSecundario)
                Spacer(Modifier.width(8.dp))
                listOf("58mm", "80mm").forEach { s ->
                    val activo = tamano == s
                    Box(
                        modifier = Modifier
                            .background(if (activo) t.primario else t.fondoTerciario, RoundedCornerShape(6.dp))
                            .clickable { tamano = s }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) { Text(s, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (activo) Color.White else t.textoSecundario) }
                    Spacer(Modifier.width(6.dp))
                }
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                BotonBoucher(Icons.Outlined.ContentCopy, Traducciones.texto("imprimir.copiar", idioma), t.primario, t, Modifier.weight(1f)) { copiar() }
                BotonBoucher(Icons.Outlined.Share, Traducciones.texto("imprimir.compartir", idioma), Color(0xFF10B981), t, Modifier.weight(1f)) { compartir() }
            }
        }

        item {
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp).background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp)) {
                Text(Traducciones.texto("imprimir.mostrarEnBoucher", idioma), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Spacer(Modifier.height(8.dp))
                listaOpciones.forEach { op ->
                    val activo = opciones[op.clave] == true
                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { opciones = opciones + (op.clave to !activo) }.padding(vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(op.etiqueta, fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
                        Box(
                            Modifier.width(40.dp).height(22.dp).background(if (activo) t.primario else Color(0xFFCBD5E1), RoundedCornerShape(50)).padding(2.dp),
                            contentAlignment = if (activo) Alignment.CenterEnd else Alignment.CenterStart
                        ) { Box(Modifier.size(18.dp).background(Color.White, RoundedCornerShape(50))) }
                    }
                }
            }
        }

        item {
            Spacer(Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp).horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.Center) {
                val ancho = if (tamano == "58mm") 200.dp else 260.dp
                Column(
                    modifier = Modifier
                        .width(ancho)
                        .background(Color.White, RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 12.dp)
                ) {
                    if (opciones["empresa"] == true) {
                        Text("PUNTO DE VENTA RD", fontSize = if (tamano == "58mm") 11.sp else 13.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                        Text("Av. Independencia", fontSize = 9.sp, color = Color(0xFF475569), textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                        LineaTicket(ancho)
                    }
                    Text("COMPROBANTE DE PAGO", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                    LineaTicket(ancho)
                    if (opciones["cobrador"] == true) {
                        Text("Cobrador: Negocio de prueba", fontSize = 9.sp, color = Color.Black)
                        Text("Fecha: 28/08/2026 10:30", fontSize = 9.sp, color = Color.Black)
                        LineaTicket(ancho)
                    }
                    Text("Contrato Id: ${contrato?.numero ?: ""}", fontSize = 9.sp, color = Color.Black)
                    LineaTicket(ancho)
                    Text((contrato?.cliente ?: "").uppercase(), fontSize = if (tamano == "58mm") 12.sp else 15.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                    LineaTicket(ancho)
                    if (opciones["cliente"] == true) {
                        Text("Documento: ${contrato?.documento ?: ""}", fontSize = 9.sp, color = Color.Black)
                        Text("Telefono: ${contrato?.telefono ?: ""}", fontSize = 9.sp, color = Color.Black)
                    }
                    if (opciones["cuotas"] == true) {
                        LineaTicket(ancho)
                        FilaTicket("1/${contrato?.meses ?: ""}", "pendiente", contrato?.cuotaMensual ?: "", ancho)
                        LineaTicket(ancho)
                        Text("Efectivo", fontSize = 9.sp, color = Color.Black, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                        Text("TOTAL: ${contrato?.cuotaMensual ?: ""}", fontSize = if (tamano == "58mm") 12.sp else 15.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                    }
                    if (opciones["balance"] == true) {
                        LineaTicket(ancho)
                        Text("PENDIENTE: $${contrato?.saldoPendiente ?: ""}", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        Text("ATRASOS PENDIENTE: $0", fontSize = 9.sp, color = Color.Black)
                        Text("MORA PENDIENTE: $0", fontSize = 9.sp, color = Color.Black)
                        LineaTicket(ancho)
                        Text("BALANCE: ${contrato?.saldoPendiente ?: ""}", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                    if (opciones["fechas"] == true) {
                        LineaTicket(ancho)
                        Text("E:${contrato?.fechaInicio ?: ""} ==> Ven:${contrato?.fechaFin ?: ""}", fontSize = 8.sp, color = Color.Black, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                    }
                    if (opciones["mensaje"] == true) {
                        LineaTicket(ancho)
                        Text("GUARDE Y REVISE SU TICKET", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                        Text("!!Gracias!!Por preferirnos!!", fontSize = 8.sp, color = Color(0xFF475569), textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                    }
                }
            }
        }
    }
}

@Composable
private fun LineaTicket(ancho: androidx.compose.ui.unit.Dp) {
    Box(Modifier.fillMaxWidth().padding(vertical = 4.dp).height(1.dp).background(Color(0xFF000000)))
}

@Composable
private fun FilaTicket(no: String, estado: String, monto: String, ancho: androidx.compose.ui.unit.Dp) {
    Row(Modifier.fillMaxWidth()) {
        Text(no, fontSize = 9.sp, color = Color.Black, modifier = Modifier.weight(1f))
        Text(estado, fontSize = 9.sp, color = Color.Black, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
        Text(monto, fontSize = 9.sp, color = Color.Black, modifier = Modifier.weight(1f), textAlign = TextAlign.End)
    }
}

@Composable
private fun BotonBoucher(icono: androidx.compose.ui.graphics.vector.ImageVector, texto: String, color: Color, t: TokensWeb, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Row(
        modifier = modifier.background(color.copy(alpha = 0.12f), RoundedCornerShape(8.dp)).border(1.dp, color, RoundedCornerShape(8.dp)).clickable(onClick = onClick).padding(vertical = 10.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, null, tint = color, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(5.dp))
        Text(texto, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}