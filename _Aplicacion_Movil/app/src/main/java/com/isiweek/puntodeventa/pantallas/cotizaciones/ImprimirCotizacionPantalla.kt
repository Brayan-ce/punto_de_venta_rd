package com.isiweek.puntodeventa.pantallas.cotizaciones

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color as AColor
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.print.PrintManager
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
import androidx.compose.material.icons.outlined.Print
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.recibo.ReceiptShareManager
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import com.isiweek.puntodeventa.utils.ImpresoraServicio
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Locale

private data class LineaBoucher(
    val cantidad: Double,
    val descripcion: String,
    val precio: Double,
    val itbis: Double,
    val total: Double
)

private data class CotizacionBoucher(
    val numero: String,
    val cliente: String,
    val documento: String,
    val telefono: String,
    val fechaEmision: String,
    val fechaVencimiento: String,
    val lineas: List<LineaBoucher>,
    val observaciones: String,
    val subtotal: Double,
    val itbis: Double,
    val total: Double
)

/**
 * Pantalla Boucher de Cotización. Muestra el formato exacto de la cotización
 * (título COTIZACION, No., cliente, fechas, tabla CANT/DESCRIPCION/PRECIO/ITBIS/TOTAL,
 * observaciones y totales) con impresión Térmica, Normal (sistema) y WhatsApp.
 */
@Composable
fun ImprimirCotizacionPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    cotizacionId: Int?,
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
    var tamano by remember { mutableStateOf("80mm") }
    var banner by remember { mutableStateOf<String?>(null) }

    val boucher = remember(cotizacionId) {
        val cot = cotizacionId?.let { RepositorioOffline.obtenerCotizacionPorId(it) } ?: return@remember null
        val detalles = RepositorioOffline.obtenerCotizacionDetalles(cot.id)
        val cliente = cot.clienteId?.let { RepositorioOffline.obtenerClientesVenta().firstOrNull { c -> c.id == it } }
        CotizacionBoucher(
            numero = cot.numero,
            cliente = cot.cliente,
            documento = cliente?.documento?.ifBlank { "N/A" } ?: "N/A",
            telefono = cliente?.telefono?.ifBlank { "N/A" } ?: "N/A",
            fechaEmision = formatearFechaCorta(cot.fechaEmision),
            fechaVencimiento = formatearFechaCorta(cot.fechaVencimiento),
            lineas = detalles.map {
                LineaBoucher(it.cantidad, it.nombreProducto, it.precioUnitario, it.itbis, it.total)
            },
            observaciones = cot.observaciones.ifBlank { "Gracias por su preferencia." },
            subtotal = cot.subtotal,
            itbis = cot.itbis,
            total = cot.total
        )
    }

    if (boucher == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(t.fondoContenido)
                .padding(40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(Traducciones.texto("cotizaciones.noEncontrada", idioma), color = t.textoTerciario, fontSize = 14.sp)
        }
        return
    }

    val textoBoucher = remember(boucher, tamano) { generarTextoBoucher(boucher, tamano, RepositorioOffline.simboloMoneda()) }

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
                    .padding(14.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .background(t.fondoTerciario, RoundedCornerShape(10.dp))
                        .clickable(onClick = onCerrar),
                    contentAlignment = Alignment.Center
                ) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, tint = t.textoSecundario, modifier = Modifier.size(20.dp)) }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(Traducciones.texto("cotizaciones.imprimir", idioma), fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                    Text("${boucher.numero} · ${boucher.cliente}", fontSize = 12.sp, color = t.textoSecundario)
                }
            }
        }

        banner?.let { msg ->
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(if (oscuro) Color(0xFF422006) else Color(0xFFFEF3C7), RoundedCornerShape(10.dp))
                        .padding(horizontal = 14.dp, vertical = 11.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(msg, color = Color(0xFF92400E), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // ── Tamaño de papel ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(14.dp)
            ) {
                Text(Traducciones.texto("imprimir.tamanoPapel", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf("58mm", "80mm").forEach { s ->
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
        }

        // ── Preview ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp)
                    .background(Color.White, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                textoBoucher.split("\n").forEach { linea ->
                    Text(
                        text = linea,
                        color = Color.Black,
                        fontSize = if (tamano == "58mm") 10.sp else 11.sp,
                        fontFamily = FontFamily.Monospace,
                        lineHeight = if (tamano == "58mm") 13.sp else 14.sp
                    )
                }
            }
        }

        // ── Acciones ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                BotonImprimirCot(Icons.Outlined.Print, Color(0xFF10B981), Traducciones.texto("imprimir.termica", idioma), Modifier.weight(1f)) {
                    val escPos = generarEscPos(boucher, tamano, RepositorioOffline.simboloMoneda())
                    if (!ImpresoraServicio.abrirRawBTFormateado(context, escPos)) {
                        banner = Traducciones.texto("imprimir.rawbtNoInstalada", idioma)
                    }
                }
                BotonImprimirCot(Icons.Outlined.Print, Color(0xFF3B82F6), Traducciones.texto("imprimir.normal", idioma), Modifier.weight(1f)) {
                    imprimirNormal(context, boucher, tamano, RepositorioOffline.simboloMoneda())
                }
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                BotonImprimirCot(Icons.Outlined.Print, Color(0xFF25D366), Traducciones.texto("imprimir.whatsApp", idioma), Modifier.weight(1f)) {
                    ImpresoraServicio.abrirWhatsApp(context, generarTextoBoucher(boucher, "80mm", RepositorioOffline.simboloMoneda()))
                }
                BotonImprimirCot(Icons.Outlined.Print, Color(0xFF8B5CF6), Traducciones.texto("imprimir.compartirImagen", idioma), Modifier.weight(1f)) {
                    val uri = exportarPng(context, boucher, tamano, RepositorioOffline.simboloMoneda())
                    if (uri != null) ReceiptShareManager.shareImage(context, uri)
                }
            }
        }
    }
}

// ─────────────────────── GENERACIÓN DE TEXTO ───────────────────────

private fun generarTextoBoucher(b: CotizacionBoucher, tamano: String, simbolo: String): String {
    val ancho = if (tamano == "58mm") 32 else 42
    val wDesc = (ancho - 5 - 9 - 9 - 9).coerceAtLeast(8)
    val s = StringBuilder()

    fun celdaIzq(x: String, w: Int) = x.take(w).padEnd(w)
    fun celdaDer(x: String, w: Int) = x.take(w).padStart(w)
    fun dinero(v: Double) = "$simbolo" + String.format(Locale.US, "%,.2f", v)
    fun linea(ch: String) = ch.repeat(ancho)

    s.append("COTIZACION").append("\n")
    s.append("No. ${b.numero}").append("\n")
    s.append(linea("=")).append("\n")
    s.append("CLIENTE:").append("\n")
    s.append(b.cliente).append("\n")
    s.append("Doc: ${b.documento}").append("\n")
    s.append("Tel: ${b.telefono}").append("\n")
    s.append("FECHA EMISION:").append("\n")
    s.append(b.fechaEmision).append("\n")
    s.append("VENCE:").append("\n")
    s.append(b.fechaVencimiento).append("\n")
    s.append(linea("=")).append("\n")
    s.append(celdaIzq("CANT.", 5) + celdaIzq("DESCRIPCION", wDesc) + celdaDer("PRECIO", 9) + celdaDer("ITBIS", 9) + celdaDer("TOTAL", 9)).append("\n")
    b.lineas.forEach { l ->
        s.append(celdaIzq("%.2f".format(l.cantidad), 5))
        s.append(celdaIzq(l.descripcion, wDesc))
        s.append(celdaDer("%.2f".format(l.precio), 9))
        s.append(celdaDer("%.2f".format(l.itbis), 9))
        s.append(celdaDer("%.2f".format(l.total), 9))
        s.append("\n")
    }
    s.append(linea("=")).append("\n")
    s.append("Observaciones:").append("\n")
    s.append(b.observaciones).append("\n")
    s.append(linea("=")).append("\n")
    s.append("SUBTOTAL:".padEnd(10) + dinero(b.subtotal)).append("\n")
    s.append("ITBIS:".padEnd(10) + dinero(b.itbis)).append("\n")
    s.append("TOTAL:".padEnd(10) + dinero(b.total)).append("\n")
    return s.toString().trimEnd('\n')
}

private fun generarEscPos(b: CotizacionBoucher, tamano: String, simbolo: String): String {
    val ESC = "\u001B"
    val B_ON = ESC + "E\u0001"
    val B_OFF = ESC + "E\u0000"
    val texto = generarTextoBoucher(b, tamano, simbolo)
    val ancho = if (tamano == "58mm") 32 else 42
    val sb = StringBuilder()
    sb.append(ESC + "@")
    sb.append(ESC + "a\u0001" + B_ON + "COTIZACION" + B_OFF + "\n")
    sb.append(ESC + "a\u0001" + "No. ${b.numero}" + "\n")
    sb.append(ESC + "a\u0000")
    sb.append(ESC + "a\u0000")
    // cuerpo: primera línea es "COTIZACION" (omitida, ya impresa centrada)
    val lineas = texto.split("\n").drop(1)
    lineas.forEach { linea ->
        if (linea.startsWith("TOTAL:") || linea == "COTIZACION") {
            sb.append(ESC + "a\u0000" + B_ON + linea + B_OFF + "\n")
        } else if (linea.contains("CANT.")) {
            sb.append(ESC + "a\u0000" + B_ON + linea + B_OFF + "\n")
        } else {
            sb.append(ESC + "a\u0000" + linea + "\n")
        }
    }
    sb.append("\n")
    sb.append(ESC + "i")
    return sb.toString()
}

// ─────────────────────── BITMAP / PNG / PRINT ───────────────────────

private fun generarBitmap(b: CotizacionBoucher, tamano: String, simbolo: String): Bitmap {
    val textoPng = generarTextoBoucher(b, tamano, simbolo)
    val textLines = textoPng.split("\n")
    val tamFuente = 24f
    val padding = 30
    val paint = Paint(AColor.BLACK).apply { textSize = tamFuente; isAntiAlias = true }
    val fm = paint.fontMetrics
    val lineHeight = (fm.descent - fm.ascent).toInt()
    val maxLen = textLines.maxOf { it.length }
    val ancho = (maxLen * tamFuente * 0.6f).toInt() + padding * 2
    val alto = padding * 2 + lineHeight * textLines.size + 20
    val bmp = Bitmap.createBitmap(ancho, alto, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bmp)
    canvas.drawColor(AColor.WHITE)
    var y = padding - fm.ascent.toInt()
    textLines.forEach { linea ->
        canvas.drawText(linea, padding.toFloat(), y.toFloat(), paint)
        y += lineHeight
    }
    return bmp
}

private fun exportarPng(context: Context, b: CotizacionBoucher, tamano: String, simbolo: String): Uri? {
    return try {
        val bitmap = generarBitmap(b, tamano, simbolo)
        val archivo = File(context.cacheDir, "cotizacion_${b.numero}.png")
        FileOutputStream(archivo).use { out -> bitmap.compress(Bitmap.CompressFormat.PNG, 100, out) }
        androidx.core.content.FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", archivo)
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}

private fun imprimirNormal(context: Context, b: CotizacionBoucher, tamano: String, simbolo: String) {
    try {
        val bitmap = generarBitmap(b, tamano, simbolo)
        val printManager = context.getSystemService(Context.PRINT_SERVICE) as PrintManager
        val adapter = object : PrintDocumentAdapter() {
            override fun onLayout(
                oldAttributes: PrintAttributes?,
                newAttributes: PrintAttributes?,
                cancellationSignal: CancellationSignal?,
                callback: LayoutResultCallback,
                extras: Bundle?
            ) {
                callback.onLayoutFinished(
                    PrintDocumentInfo.Builder("Cotizacion").setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).setPageCount(1).build(),
                    oldAttributes?.equals(newAttributes) != true
                )
            }

            override fun onWrite(
                pages: Array<out PageRange>,
                destination: ParcelFileDescriptor,
                cancellationSignal: CancellationSignal?,
                callback: WriteResultCallback
            ) {
                try {
                    FileOutputStream(destination.fileDescriptor).use { out ->
                        val doc = PdfDocument()
                        val pageInfo = PdfDocument.PageInfo.Builder(bitmap.width, bitmap.height, 1).create()
                        val page = doc.startPage(pageInfo)
                        page.canvas.drawBitmap(bitmap, 0f, 0f, null)
                        doc.finishPage(page)
                        doc.writeTo(out)
                        doc.close()
                    }
                    callback.onWriteFinished(arrayOf(PageRange(0, 0)))
                } catch (e: Exception) {
                    callback.onWriteFailed(e.message)
                }
            }
        }
        printManager.print("Cotizacion", adapter, null)
    } catch (e: Exception) {
        Toast.makeText(context, "Error al imprimir: ${e.message}", Toast.LENGTH_LONG).show()
    }
}

private fun formatearFechaCorta(fecha: String): String {
    return try {
        val entrada = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val salida = SimpleDateFormat("d/M/yyyy", Locale.US)
        salida.format(entrada.parse(fecha) ?: return fecha)
    } catch (e: Exception) {
        fecha
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun BotonImprimirCot(icono: androidx.compose.ui.graphics.vector.ImageVector, color: Color, texto: String, modifier: Modifier, onClick: () -> Unit = {}) {
    Row(
        modifier = modifier
            .background(color.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .border(1.dp, color.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(texto, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}