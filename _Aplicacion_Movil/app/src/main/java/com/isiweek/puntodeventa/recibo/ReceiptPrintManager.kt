package com.isiweek.puntodeventa.recibo

import android.content.Context
import android.graphics.pdf.PdfDocument
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.print.PrintManager
import java.io.FileOutputStream
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Imprime el recibo a través del diálogo de impresión del sistema Android
 * (equivalente a "Imprimir Normal" de la web). Genera un PDF a la medida del
 * papel elegido (58mm / 80mm / A4) dibujando el mismo layout que el preview.
 */
object ReceiptPrintManager {

    private const val JOB_NAME = "Recibo de Pago"

    /** mm → puntos PDF (72 pt = 1 in, 25.4 mm = 1 in). */
    private fun papelEnPt(papel: String): Pair<Float, Float> = when (papel) {
        "58mm" -> (58f / 25.4f * 72f) to (120f / 25.4f * 72f)
        "A4" -> 595f to 842f
        else -> (80f / 25.4f * 72f) to (160f / 25.4f * 72f)
    }

    fun print(context: Context, data: ReceiptData, papel: String) {
        val printManager = context.getSystemService(Context.PRINT_SERVICE) as PrintManager
        val adapter = object : PrintDocumentAdapter() {

            override fun onLayout(
                oldAttributes: PrintAttributes?,
                newAttributes: PrintAttributes?,
                cancellationSignal: CancellationSignal?,
                callback: LayoutResultCallback,
                extras: Bundle?
            ) {
                val info = PrintDocumentInfo.Builder(JOB_NAME)
                    .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                    .setPageCount(1)
                    .build()
                callback.onLayoutFinished(info, oldAttributes?.equals(newAttributes) != true)
            }

            override fun onWrite(
                pages: Array<out PageRange>,
                destination: ParcelFileDescriptor,
                cancellationSignal: CancellationSignal?,
                callback: WriteResultCallback
            ) {
                try {
                    FileOutputStream(destination.fileDescriptor).use { out ->
                        renderPdf(data, papel, out)
                    }
                    callback.onWriteFinished(arrayOf(PageRange(0, 0)))
                } catch (e: Exception) {
                    callback.onWriteFailed(e.message)
                }
            }
        }
        printManager.print(JOB_NAME, adapter, null)
    }

    /**
     * Genera el PDF del recibo escalado al ancho del papel en puntos.
     * Para A4 limita la altura a la página; para térmica el alto es dinámico.
     */
    private fun renderPdf(data: ReceiptData, papel: String, output: java.io.OutputStream) {
        val size = ReceiptLayout.measure(data)
        val (papelAnchoPt, papelAltoPt) = papelEnPt(papel)

        var scale = papelAnchoPt / size.width
        if (papel == "A4") {
            val altoFit = papelAltoPt / size.height
            scale = min(scale, altoFit)
        }
        val pageW = (size.width * scale).roundToInt()
        val pageH = (size.height * scale).roundToInt()

        val document = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(pageW, pageH, 1).create()
        val page = document.startPage(pageInfo)
        page.canvas.scale(scale, scale)
        ReceiptCanvasRenderer.draw(page.canvas, data)
        document.finishPage(page)
        document.writeTo(output)
        document.close()
    }
}