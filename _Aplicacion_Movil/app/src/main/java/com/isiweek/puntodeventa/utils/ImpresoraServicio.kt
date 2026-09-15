package com.isiweek.puntodeventa.utils

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.widget.Toast
import java.io.File
import java.io.OutputStream
import java.util.UUID

/**
 * Impresión térmica por Bluetooth (impresoras ESC/POS).
 * Busca impresoras emparejadas y envía el ticket como bytes crudos.
 */
object ImpresoraServicio {

    private const val UUID_SPP = "00001101-0000-1000-8000-00805F9B34FB"

    /** Paquete oficial de RawBT (aplicación de impresión ESC/POS). */
    private const val PAQUETE_RAWBT = "ru.a402d.rawbtprinter"

    data class Impresora(val nombre: String, val address: String)

    /** Lista impresoras emparejadas (por clase de impresora). */
    fun obtenerImpresoras(contexto: Context): List<Impresora> {
        if (!tienePermiso(contexto)) return emptyList()

        val adaptador = BluetoothAdapter.getDefaultAdapter() ?: return emptyList()
        if (!adaptador.isEnabled) return emptyList()

        return adaptador.bondedDevices
            .filter { esImpresora(it) }
            .map { Impresora(it.name ?: it.address, it.address) }
            .ifEmpty {
                // Fallback: mostrar todas las emparejadas si no se detectó la clase
                adaptador.bondedDevices.map { Impresora(it.name ?: it.address, it.address) }
            }
    }

    private fun esImpresora(device: BluetoothDevice): Boolean {
        // Major device class de periféricos (impresoras suelen ser PERIPHERAL o IMAGING)
        val major = device.bluetoothClass?.majorDeviceClass ?: return false
        return major == 0x0500 || major == 0x0600 || major == 0x0100
    }

    fun tienePermiso(contexto: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        return contexto.checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED
    }

    fun solicitarPermiso(): Intent? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return null
        val intent = Intent("android.bluetooth.adapter.action.REQUEST_ENABLE_BT")
        return intent
    }

    /**
     * Imprime el ticket en la impresora indicada.
     * @return true si se envió correctamente.
     */
    suspend fun imprimir(
        contexto: Context,
        direccion: String,
        datos: ByteArray
    ): Boolean {
        val adaptador = BluetoothAdapter.getDefaultAdapter() ?: return false
        val device = adaptador.getRemoteDevice(direccion)

        var socket: BluetoothSocket? = null
        return try {
            socket = device.createRfcommSocketToServiceRecord(UUID.fromString(UUID_SPP))
            socket.connect()
            val out: OutputStream = socket.outputStream
            out.write(datos)
            out.flush()
            true
        } catch (e: Exception) {
            // Intentar socket inseguro alternativo
            try {
                socket?.close()
                val fallback = device.javaClass.getMethod("createRfcommSocket", Int::class.java)
                socket = fallback.invoke(device, 1) as BluetoothSocket
                socket!!.connect()
                val out: OutputStream = socket!!.outputStream
                out.write(datos)
                out.flush()
                true
            } catch (e2: Exception) {
                false
            }
        } finally {
            try { socket?.close() } catch (_: Exception) {}
        }
    }

    /** Comparte el texto del ticket vía share sheet (para RawBT / ESC/POS apps). */
    fun compartirTexto(contexto: Context, textoPlano: String) {
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, textoPlano)
        }
        val chooser = Intent.createChooser(send, "Enviar ticket")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        contexto.startActivity(chooser)
    }

    fun toast(contexto: Context, mensaje: String) {
        Toast.makeText(contexto, mensaje, Toast.LENGTH_SHORT).show()
    }

    /** ¿Está instalada la app RawBT? */
    fun rawBTInstalada(contexto: Context): Boolean = try {
        contexto.packageManager.getPackageInfo(PAQUETE_RAWBT, 0)
        true
    } catch (_: Exception) {
        false
    }

    /** Abre la app RawBT y le envía el ticket directamente (abre con el texto ya cargado). */
    fun abrirRawBT(contexto: Context, textoPlano: String): Boolean {
        if (!rawBTInstalada(contexto)) return false
        try {
            // Intento directo: acción propia de RawBT con el texto en EXTRA_DATA
            val intent = Intent("ru.a402d.rawbtprinter.action.PRINT_RAWBT").apply {
                putExtra("ru.a402d.rawbtprinter.extra.DATA", textoPlano)
                setPackage(PAQUETE_RAWBT)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            contexto.startActivity(intent)
            return true
        } catch (_: Exception) {
            // Respaldo: ACTION_SEND de texto hacia RawBT
            return try {
                val send = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    `package` = PAQUETE_RAWBT
                    putExtra(Intent.EXTRA_TEXT, textoPlano)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                contexto.startActivity(send)
                true
            } catch (_: Exception) {
                false
            }
        }
    }

    /** Abre RawBT con el ticket ya formateado en comandos ESC/POS (negrita, centrado, corte). */
    fun abrirRawBTFormateado(contexto: Context, textoEscPos: String): Boolean {
        if (!rawBTInstalada(contexto)) return false
        return try {
            val intent = Intent("ru.a402d.rawbtprinter.action.PRINT_RAWBT").apply {
                putExtra("ru.a402d.rawbtprinter.extra.DATA", textoEscPos)
                setPackage(PAQUETE_RAWBT)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            contexto.startActivity(intent)
            true
        } catch (_: Exception) {
            try {
                val send = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    `package` = PAQUETE_RAWBT
                    putExtra(Intent.EXTRA_TEXT, textoEscPos)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                contexto.startActivity(send)
                true
            } catch (_: Exception) {
                false
            }
        }
    }

    /** Abre WhatsApp con el texto del ticket. */
    fun abrirWhatsApp(contexto: Context, textoPlano: String, telefono: String = "") {
        val numero = telefono.replace(Regex("[^\\d]"), "")
        val url = if (numero.isNotEmpty()) {
            "https://wa.me/$numero?text=${android.net.Uri.encode(textoPlano)}"
        } else {
            "https://wa.me/?text=${android.net.Uri.encode(textoPlano)}"
        }
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        contexto.startActivity(intent)
    }

    /** Línea estructurada de un ticket térmico (para dibujar la boleta como imagen). */
    data class LineaTicketImagen(
        val texto: String = "",
        val centrada: Boolean = false,
        val negrita: Boolean = false,
        val grande: Boolean = false,
        val etiquetaValor: Pair<String, String>? = null,
        val separadorGrueso: Boolean = false,
        val separadorPunteado: Boolean = false,
        val espacioAntes: Int = 0,
        val espacioDespues: Int = 0
    )

    /** Genera la imagen del ticket (boleta térmica) y la comparte por WhatsApp. */
    fun enviarWhatsAppTicket(
        contexto: Context,
        lineas: List<LineaTicketImagen>,
        telefono: String = "",
        anchoPx: Int = 520
    ) {
        try {
            val bmp = dibujarTicket(lineas, anchoPx)
            compartirBitmapWhatsApp(contexto, bmp, telefono, "ticket")
        } catch (e: Exception) {
            abrirWhatsApp(contexto, lineas.joinToString("\n") { it.texto }, telefono)
        }
    }

    /** Comparte un Bitmap ya generado por WhatsApp (imagen PNG). */
    fun compartirBitmapWhatsApp(contexto: Context, bmp: Bitmap, telefono: String = "", prefijo: String = "recibo") {
        try {
            val archivo = File(contexto.cacheDir, "${prefijo}_${System.currentTimeMillis()}.png")
            archivo.outputStream().use { out ->
                bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
            }
            val uri = androidx.core.content.FileProvider.getUriForFile(
                contexto,
                contexto.applicationContext.packageName + ".fileprovider",
                archivo
            )
            val numero = telefono.replace(Regex("[^\\d]"), "")
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "image/png"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                if (numero.isNotEmpty()) {
                    `package` = "com.whatsapp"
                    putExtra("jid", "$numero@s.whatsapp.net")
                }
            }
            contexto.startActivity(Intent.createChooser(intent, "Enviar por WhatsApp"))
        } catch (e: Exception) {
            throw e
        }
    }

    /** Dibuja el ticket como imagen térmica (fondo blanco, texto negro, fuente monoespaciada). */
    private fun dibujarTicket(lineas: List<LineaTicketImagen>, anchoPx: Int): Bitmap {
        val paintBase = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
            color = android.graphics.Color.BLACK
            typeface = android.graphics.Typeface.MONOSPACE
        }
        val paintGrande = android.graphics.Paint(paintBase).apply { textSize = 44f }
        val paintNormal = android.graphics.Paint(paintBase).apply { textSize = 34f }

        val margen = 36
        val anchoTexto = anchoPx - margen * 2

        // Primera pasada: medir altura total por línea
        fun altoLinea(l: LineaTicketImagen): Int {
            var alto = l.espacioAntes * 12
            alto += when {
                l.separadorGrueso -> 18
                l.separadorPunteado -> 16
                else -> {
                    if (l.grande) 56 else 46
                }
            }
            alto += l.espacioDespues * 12
            return alto
        }

        var altoTotal = 20
        for (l in lineas) altoTotal += altoLinea(l)
        altoTotal += 20

        val bmp = Bitmap.createBitmap(anchoPx, altoTotal, Bitmap.Config.ARGB_8888)
        val canvas = android.graphics.Canvas(bmp)
        canvas.drawColor(android.graphics.Color.WHITE)

        var y = 20f
        for (l in lineas) {
            y += l.espacioAntes * 12
            val paint = if (l.grande) paintGrande else paintNormal
            paint.setTypeface(
                if (l.negrita) android.graphics.Typeface.create(android.graphics.Typeface.MONOSPACE, android.graphics.Typeface.BOLD)
                else android.graphics.Typeface.MONOSPACE
            )
            val par = l.etiquetaValor
            when {
                l.separadorGrueso -> {
                    canvas.drawRect(margen.toFloat(), y, (anchoPx - margen).toFloat(), y + 7f, android.graphics.Paint().apply { color = android.graphics.Color.BLACK })
                    y += 18
                }
                l.separadorPunteado -> {
                    val p = android.graphics.Paint().apply { color = android.graphics.Color.DKGRAY; strokeWidth = 3f }
                    var x = margen.toFloat()
                    while (x < anchoPx - margen) {
                        canvas.drawPoint(x, y + 3f, p)
                        x += 12f
                    }
                    y += 16
                }
                par != null -> {
                    val (etiqueta, valor) = par
                    // Etiqueta a la izquierda (mismo origen)
                    canvas.drawText(etiqueta, margen.toFloat(), y + 30f, paint)
                    // Valor alineado al extremo derecho
                    val valorPaint = android.graphics.Paint(paint).apply {
                        setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.MONOSPACE, android.graphics.Typeface.BOLD))
                    }
                    val anchoValor = valorPaint.measureText(valor)
                    canvas.drawText(valor, (anchoPx - margen - anchoValor).coerceAtLeast(margen.toFloat()), y + 30f, valorPaint)
                    y += 46
                }
                else -> {
                    val ancho = paint.measureText(l.texto)
                    val offsetX = if (l.centrada) ((anchoTexto - ancho) / 2f).coerceAtLeast(0f) else 0f
                    canvas.drawText(l.texto, margen + offsetX, y + 30f, paint)
                    y += if (l.grande) 56 else 46
                }
            }
            y += l.espacioDespues * 12
        }
        return bmp
    }

    /** Genera una imagen (Bitmap) con el texto del recibo y la comparte por WhatsApp. */
    fun enviarWhatsAppImagen(contexto: Context, textoPlano: String, telefono: String = "", anchoPx: Int = 400) {
        try {
            val bmp = generarBitmapTexto(textoPlano, anchoPx)
            val archivo = File(contexto.cacheDir, "recibo_${System.currentTimeMillis()}.png")
            archivo.outputStream().use { out ->
                bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
            }
            val uri = androidx.core.content.FileProvider.getUriForFile(
                contexto,
                contexto.applicationContext.packageName + ".fileprovider",
                archivo
            )
            val numero = telefono.replace(Regex("[^\\d]"), "")
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "image/png"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                if (numero.isNotEmpty()) {
                    `package` = "com.whatsapp"
                    putExtra("jid", "$numero@s.whatsapp.net")
                }
            }
            contexto.startActivity(Intent.createChooser(intent, "Enviar recibo por WhatsApp"))
        } catch (e: Exception) {
            abrirWhatsApp(contexto, textoPlano, telefono)
        }
    }

    /** Dibuja el texto como una imagen PNG (fondo blanco, texto negro). */
    private fun generarBitmapTexto(texto: String, anchoPx: Int): Bitmap {
        val paint = android.text.TextPaint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
            color = android.graphics.Color.BLACK
            textSize = 22f
            typeface = android.graphics.Typeface.MONOSPACE
        }
        val layout = android.text.StaticLayout.Builder
            .obtain(texto, 0, texto.length, paint, anchoPx)
            .build()
        val bmp = Bitmap.createBitmap(anchoPx, layout.height + 40, Bitmap.Config.ARGB_8888)
        val canvas = android.graphics.Canvas(bmp)
        canvas.drawColor(android.graphics.Color.WHITE)
        canvas.save()
        canvas.translate(10f, 20f)
        layout.draw(canvas)
        canvas.restore()
        return bmp
    }
}