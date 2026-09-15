package com.isiweek.puntodeventa.recibo

import android.graphics.Bitmap
import android.graphics.Canvas

/**
 * Convierte [ReceiptData] en un Bitmap ARGB_8888 de alta resolución.
 * El documento siempre es blanco+negro, independiente del tema/dispositivo.
 */
object ReceiptBitmapRenderer {

    fun render(data: ReceiptData): Bitmap {
        val size = ReceiptLayout.measure(data)
        val bmp = Bitmap.createBitmap(size.width, size.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        ReceiptCanvasRenderer.draw(canvas, data)
        return bmp
    }
}