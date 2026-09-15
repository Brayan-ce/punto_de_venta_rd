package com.isiweek.puntodeventa.pantallas.financiamiento

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
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
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.recibo.ReceiptExportManager
import com.isiweek.puntodeventa.recibo.ReceiptFormatters
import com.isiweek.puntodeventa.recibo.ReceiptMapper
import com.isiweek.puntodeventa.recibo.ReceiptPreview
import com.isiweek.puntodeventa.recibo.ReceiptPrintManager
import com.isiweek.puntodeventa.recibo.ReceiptShareManager
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import com.isiweek.puntodeventa.utils.ImpresoraServicio
import kotlinx.coroutines.launch
import java.util.Calendar

data class CuotaRecibo(
    val numero: Int,
    val vencimiento: String,
    val mora: String,
    val aplicado: String
)

data class DatosReciboPago(
    val reciboNo: Int,
    val contratoNumero: String,
    val fecha: String,
    val cliente: String,
    val documento: String,
    val telefono: String,
    val recibidoPor: String,
    val cuotas: List<CuotaRecibo>,
    val capital: String,
    val interes: String,
    val mora: String,
    val totalPagado: String,
    val saldoRestante: String,
    val cuotasPendientes: Int,
    val metodoPago: String,
    val referencia: String,
    val notas: String
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

private const val PREFS_IMPRESION = "prefs_impresion_pago"
private const val PREF_TAMANO = "tamanoPapel"
private const val PREF_OPCIONES = "opcionesImpresion"

private fun opcionesPorDefecto(): Map<String, Boolean> = mapOf(
    "empresa" to true, "cliente" to true, "cuotas" to true, "metodo" to true,
    "saldo" to true, "notas" to true, "mensaje" to true
)

private fun leerPreferencias(context: Context): Pair<String, Map<String, Boolean>> {
    val prefs = context.getSharedPreferences(PREFS_IMPRESION, Context.MODE_PRIVATE)
    val tamano = prefs.getString(PREF_TAMANO, "80mm") ?: "80mm"
    val opcionesGuardadas = prefs.getString(PREF_OPCIONES, null)
    val opciones = if (opcionesGuardadas != null) {
        try {
            val mapa = opcionesPorDefecto().toMutableMap()
            opcionesGuardadas.split("|").forEach { kv ->
                val partes = kv.split("=")
                if (partes.size == 2) mapa[partes[0]] = partes[1] == "true"
            }
            mapa
        } catch (e: Exception) {
            opcionesPorDefecto()
        }
    } else {
        opcionesPorDefecto()
    }
    return tamano to opciones
}

private fun guardarPreferencias(context: Context, tamano: String, opciones: Map<String, Boolean>) {
    context.getSharedPreferences(PREFS_IMPRESION, Context.MODE_PRIVATE)
        .edit()
        .putString(PREF_TAMANO, tamano)
        .putString(PREF_OPCIONES, opciones.entries.joinToString("|") { "${it.key}=${it.value}" })
        .apply()
}

@Composable
fun ImprimirPagoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    recibo: DatosReciboPago,
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
    val empresa = remember { RepositorioOffline.obtenerEmpresa() }
    val prefsInicial = remember { leerPreferencias(context) }
    var tamano by remember { mutableStateOf(prefsInicial.first) }
    var opciones by remember { mutableStateOf(prefsInicial.second) }
    var banner by remember { mutableStateOf<String?>(null) }
    val ambito = rememberCoroutineScope()

    // "Recibido por": si el pago no trae el nombre (offline), usa el usuario de la sesión.
    val nombreSesion = remember {
        RepositorioOffline.cargarSesion(context)?.usuario?.optString("nombre", "")
            ?.takeIf { it.isNotBlank() && it != "null" }
            ?: ""
    }
    val reciboFinal = remember(recibo, nombreSesion) {
        if (nombreSesion.isNotBlank() && recibo.recibidoPor.isBlank()) {
            recibo.copy(recibidoPor = nombreSesion)
        } else {
            recibo
        }
    }

    val listaOpciones = listOf(
        "empresa" to Traducciones.texto("imprimir.opEmpresa", idioma),
        "cliente" to Traducciones.texto("imprimir.opCliente", idioma),
        "cuotas" to Traducciones.texto("imprimir.opCuotasAplicadas", idioma),
        "metodo" to Traducciones.texto("imprimir.opMetodoPago", idioma),
        "saldo" to Traducciones.texto("imprimir.opSaldoRestante", idioma),
        "notas" to Traducciones.texto("imprimir.opNotas", idioma),
        "mensaje" to Traducciones.texto("imprimir.opMensajeFinal", idioma)
    )

    val nombreEmpresa = empresa?.nombre?.takeIf { it.isNotBlank() && it != "null" }
        ?: Traducciones.texto("imprimir.empresaPredeterminada", idioma)
    val rncEmpresa = empresa?.rnc?.takeIf { it.isNotBlank() && it != "null" }.orEmpty()
    val direccionEmpresa = empresa?.direccion?.takeIf { it.isNotBlank() && it != "null" }.orEmpty()
    val telefonoEmpresa = empresa?.telefono?.takeIf { it.isNotBlank() && it != "null" }.orEmpty()
    val mensajeFactura = empresa?.mensajeFactura?.takeIf { it.isNotBlank() && it != "null" }.orEmpty()

    fun fechaCorta(): String {
        val c = Calendar.getInstance()
        val dia = c.get(Calendar.DAY_OF_MONTH).toString().padStart(2, '0')
        val mes = (c.get(Calendar.MONTH) + 1).toString().padStart(2, '0')
        return "$dia/$mes/${c.get(Calendar.YEAR)}"
    }

    fun anchoPx(): Int = when (tamano) {
        "58mm" -> 320
        "A4" -> 760
        else -> 520
    }

    fun textoTermico(): String {
        val sb = StringBuilder()
        if (opciones["empresa"] == true) {
            sb.append("*$nombreEmpresa*\n")
            if (rncEmpresa.isNotBlank()) sb.append("RNC: $rncEmpresa\n")
            if (direccionEmpresa.isNotBlank()) sb.append("$direccionEmpresa\n")
            if (telefonoEmpresa.isNotBlank()) sb.append("Tel: $telefonoEmpresa\n")
            sb.append("\n")
        }
        sb.append(if (recibo.notas.contains("adelantado", ignoreCase = true)) "RECIBO DE PAGO ADELANTADO\n" else "RECIBO DE PAGO\n")
        sb.append("No. ${recibo.reciboNo}\n\n")
        sb.append("Fecha: ${recibo.fecha}\n")
        sb.append("Contrato: ${recibo.contratoNumero}\n")
        if (opciones["cliente"] == true) {
            sb.append("Cliente: ${recibo.cliente}\n")
            if (recibo.documento.isNotBlank()) sb.append("Cedula: ${recibo.documento}\n")
            if (recibo.telefono.isNotBlank()) sb.append("Telefono: ${recibo.telefono}\n")
        }
        if (reciboFinal.recibidoPor.isNotBlank()) sb.append("Recibido por: ${reciboFinal.recibidoPor}\n")
        if (opciones["cuotas"] == true && recibo.cuotas.isNotEmpty()) {
            sb.append("\n*CUOTAS APLICADAS:*\n")
            recibo.cuotas.forEach { c ->
                sb.append("Cuota #${c.numero} (${c.vencimiento}): ${c.aplicado}\n")
            }
        }
        sb.append("\n*Total pagado: ${recibo.totalPagado}*\n")
        if (opciones["metodo"] == true && recibo.metodoPago.isNotBlank()) {
            sb.append("Metodo: ${recibo.metodoPago}\n")
        }
        if (recibo.referencia.isNotBlank()) {
            sb.append("Referencia: ${recibo.referencia}\n")
        }
        if (opciones["saldo"] == true && recibo.saldoRestante.isNotBlank()) {
            sb.append("Saldo restante: ${recibo.saldoRestante}\n")
            if (recibo.cuotasPendientes > 0) sb.append("Cuotas pendientes: ${recibo.cuotasPendientes}\n")
        }
        if (opciones["notas"] == true && recibo.notas.isNotBlank()) {
            sb.append("NOTA: ${recibo.notas}\n")
        }
        if (opciones["mensaje"] == true) {
            if (mensajeFactura.isNotBlank()) sb.append("\n$mensajeFactura\n")
            sb.append("\nGRACIAS POR SU PAGO!")
            sb.append("\n${fechaCorta()}")
        }
        return sb.toString()
    }

    /**
     * Construye el ticket en comandos ESC/POS (negrita, centrado, tabla, corte) para RawBT.
     * Réplica del diseño de la preview, adaptado al ancho del papel
     * (58mm = 32 columnas, 80mm = 42 columnas).
     */
    fun textoEscPos(): String {
        val ESC = "\u001B"
        val B_ON = ESC + "E\u0001"
        val B_OFF = ESC + "E\u0000"
        val ancho = if (tamano == "58mm") 32 else 42

        fun centro(s: String) = ESC + "a\u0001" + s + "\n"
        fun izquierda(s: String) = ESC + "a\u0000" + s + "\n"
        fun negritaCentro(s: String) = ESC + "a\u0001" + B_ON + s + B_OFF + "\n"
        fun negritaIzq(s: String) = ESC + "a\u0000" + B_ON + s + B_OFF + "\n"
        fun linea(ch: String) = ch.repeat(ancho)
        fun fila2(izq: String, der: String, negritaDer: Boolean = false): String {
            val esp = (ancho - izq.length - der.length).coerceAtLeast(1)
            return izq + " ".repeat(esp) + (if (negritaDer) B_ON + der + B_OFF else der)
        }
        fun celdaIzq(t: String, w: Int): String = t.padEnd(w).take(w)
        fun celdaDer(t: String, w: Int): String = t.padStart(w).take(w)

        val sb = StringBuilder()
        sb.append(ESC + "@") // Reset impresora

        // ── Encabezado empresa (switch mostrarDatosEmpresa) ──
        if (opciones["empresa"] == true) {
            sb.append(negritaCentro(nombreEmpresa))
            if (rncEmpresa.isNotBlank()) sb.append(centro("RNC: $rncEmpresa"))
            if (direccionEmpresa.isNotBlank()) sb.append(centro(direccionEmpresa))
            if (telefonoEmpresa.isNotBlank()) sb.append(centro("Tel: $telefonoEmpresa"))
            sb.append(izquierda(linea("=")))
        }

        // ── Comprobante (siempre visible) ──
        sb.append(negritaCentro(
            if (reciboFinal.notas.contains("adelantado", ignoreCase = true)) "RECIBO DE PAGO ADELANTADO" else "RECIBO DE PAGO"
        ))
        sb.append(centro("No. ${reciboFinal.reciboNo}"))
        sb.append(izquierda(fila2("Contrato:", reciboFinal.contratoNumero, negritaDer = true)))
        sb.append(izquierda(linea("=")))

        // ── Info cliente (Fecha siempre; resto con switch mostrarDatosCliente) ──
        sb.append(izquierda(fila2("Fecha:", reciboFinal.fecha)))
        if (opciones["cliente"] == true) {
            sb.append(izquierda(fila2("Cliente:", reciboFinal.cliente)))
            if (reciboFinal.documento.isNotBlank()) sb.append(izquierda(fila2("Cedula:", reciboFinal.documento)))
            if (reciboFinal.telefono.isNotBlank()) sb.append(izquierda(fila2("Telefono:", reciboFinal.telefono)))
        }
        if (reciboFinal.recibidoPor.isNotBlank()) sb.append(izquierda(fila2("Recibido por:", reciboFinal.recibidoPor)))
        sb.append(izquierda(linea("=")))

        // ── Tabla de cuotas + desglose (switch mostrarCasillasAplicadas) ──
        if (opciones["cuotas"] == true && reciboFinal.cuotas.isNotEmpty()) {
            val wv = if (tamano == "58mm") 13 else 17
            val wm = if (tamano == "58mm") 6 else 9
            val wa = ancho - 3 - wv - wm
            sb.append(negritaIzq("CUOTAS APLICADAS:"))
            sb.append(izquierda(
                celdaIzq("#", 3) + celdaIzq("VENCIMIENTO", wv) + celdaDer("MORA", wm) + celdaDer("APLICADO", wa)
            ))
            reciboFinal.cuotas.forEach { c ->
                val fecha = if (tamano == "58mm") {
                    ReceiptFormatters.formatDate(c.vencimiento, corto = true)
                } else {
                    ReceiptFormatters.formatDate(c.vencimiento)
                }
                sb.append(izquierda(
                    celdaIzq(c.numero.toString(), 3) + celdaIzq(fecha, wv) + celdaDer(c.mora, wm) + celdaDer(c.aplicado, wa)
                ))
            }
            sb.append(izquierda(linea("-")))
            sb.append(izquierda(fila2("Capital:", reciboFinal.capital, negritaDer = true)))
            sb.append(izquierda(fila2("Interes:", reciboFinal.interes, negritaDer = true)))
            if (reciboFinal.mora.isNotBlank() && reciboFinal.mora != "—") {
                sb.append(izquierda(fila2("Mora:", reciboFinal.mora, negritaDer = true)))
            }
            sb.append(izquierda(linea("=")))
            sb.append(izquierda(linea("="))) // línea doble (como la preview)
        }

        // ── TOTAL PAGADO (siempre visible) ──
        sb.append(negritaCentro("TOTAL PAGADO: ${reciboFinal.totalPagado}"))
        sb.append(izquierda(linea("-")))

        // ── Método de pago (switch mostrarMetodoPago) ──
        if (opciones["metodo"] == true && reciboFinal.metodoPago.isNotBlank()) {
            sb.append(izquierda(fila2("Metodo de Pago:", reciboFinal.metodoPago)))
            sb.append(izquierda(linea("-")))
        }

        // ── Referencia (si existe) ──
        if (reciboFinal.referencia.isNotBlank()) {
            sb.append(izquierda(fila2("Referencia:", reciboFinal.referencia)))
        }

        // ── Saldo restante / cuotas pendientes (switch mostrarSaldoRestante) ──
        if (opciones["saldo"] == true && reciboFinal.saldoRestante.isNotBlank()) {
            sb.append(izquierda(linea("-")))
            sb.append(izquierda(fila2("Saldo restante:", reciboFinal.saldoRestante, negritaDer = true)))
            if (reciboFinal.cuotasPendientes > 0) {
                sb.append(izquierda(fila2("Cuotas pendientes:", reciboFinal.cuotasPendientes.toString(), negritaDer = true)))
            }
        }

        // ── Notas (switch mostrarNotas) ──
        if (opciones["notas"] == true && reciboFinal.notas.isNotBlank()) {
            sb.append(izquierda(linea("=")))
            sb.append(izquierda(fila2("NOTA:", reciboFinal.notas, negritaDer = true)))
        }

        // ── Footer (switch mostrarMensajeFinal) ──
        if (opciones["mensaje"] == true) {
            sb.append(izquierda(linea("=")))
            if (mensajeFactura.isNotBlank()) sb.append(centro(mensajeFactura))
            sb.append(negritaCentro("GRACIAS POR SU PAGO!"))
            sb.append(centro(fechaCorta()))
        }

        sb.append("\n")
        sb.append(ESC + "i") // Corte de papel
        return sb.toString()
    }

    fun copiar() {
        val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText("recibo", textoTermico()))
        banner = Traducciones.texto("imprimir.copiadoTermica", idioma)
    }

    fun cambiarTamano(nuevo: String) {
        tamano = nuevo
        guardarPreferencias(context, nuevo, opciones)
    }

    fun toggleOpcion(clave: String) {
        val nuevas = opciones + (clave to (opciones[clave] != true))
        opciones = nuevas
        guardarPreferencias(context, tamano, nuevas)
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
                    Text(Traducciones.texto("imprimir.tituloPago", idioma), fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                    Text("${recibo.contratoNumero} · ${recibo.cliente}", fontSize = 12.sp, color = t.textoSecundario)
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
                    Text(msg, color = Color(0xFF065F46), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f).clickable {
                        if (msg.contains(Traducciones.texto("imprimir.rawbtNoInstalada", idioma).take(10))) {
                            try {
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=ru.a402d.rawbtprinter")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                            } catch (_: Exception) {
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                            }
                        }
                    })
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
                                    .clickable { cambiarTamano(s) }
                                    .padding(horizontal = 20.dp, vertical = 10.dp)
                            ) { Text(s, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = if (activo) Color.White else if (oscuro) Color(0xFF94A3B8) else Color(0xFF64748B)) }
                        }
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    BotonRecibo(Icons.Outlined.Print, Traducciones.texto("imprimir.termica", idioma), Color(0xFF10B981), t, Modifier.weight(1f)) {
                        val abierto = ImpresoraServicio.abrirRawBTFormateado(context, textoEscPos())
                        if (!abierto) {
                            banner = Traducciones.texto("imprimir.rawbtNoInstalada", idioma)
                        }
                    }
                    BotonRecibo(Icons.Outlined.Print, Traducciones.texto("imprimir.normal", idioma), Color(0xFF3B82F6), t, Modifier.weight(1f)) {
                        ReceiptPrintManager.print(context, ReceiptMapper.fromDatosRecibo(reciboFinal, opciones), tamano)
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    BotonRecibo(IconoWhatsApp, Traducciones.texto("imprimir.whatsApp", idioma), Color(0xFF25D366), t, Modifier.weight(1f)) {
                        ambito.launch {
                            try {
                                val uri = ReceiptExportManager.exportAsPng(context, ReceiptMapper.fromDatosRecibo(reciboFinal, opciones))
                                ReceiptShareManager.shareImage(context, uri)
                            } catch (e: Exception) {
                                ImpresoraServicio.enviarWhatsAppImagen(context, textoTermico(), reciboFinal.telefono, anchoPx())
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
                data = ReceiptMapper.fromDatosRecibo(reciboFinal, opciones),
                tamano = tamano,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp)
            )
        }
    }
}

@Composable
private fun BotonRecibo(icono: ImageVector, texto: String, color: Color, t: TokensWeb, modifier: Modifier = Modifier, onClick: () -> Unit) {
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