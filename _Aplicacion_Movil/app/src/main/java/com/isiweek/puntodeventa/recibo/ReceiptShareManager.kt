package com.isiweek.puntodeventa.recibo

import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * Comparte el recibo mediante el Android Sharesheet estándar.
 * WhatsApp (y otras apps) aparecen como destinos compatibles según el MIME.
 */
object ReceiptShareManager {

    fun share(context: Context, uri: Uri, mimeType: String, titulo: String = "Compartir recibo") {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = mimeType
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, titulo))
    }

    fun shareImage(context: Context, uri: Uri) = share(context, uri, "image/png", "Compartir recibo (imagen)")
}