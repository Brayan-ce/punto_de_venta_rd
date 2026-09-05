package com.isiweek.puntodeventa.recibo

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Exporta el recibo a PNG, guarda en cacheDir y devuelve una Uri content://
 * lista para compartir. Los temporales se limpian con [limpiarTemporales].
 */
object ReceiptExportManager {

    private fun carpetaTemporal(context: Context): File {
        val dir = File(context.cacheDir, "recibos")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun uriDe(context: Context, archivo: File): Uri =
        FileProvider.getUriForFile(context, context.applicationContext.packageName + ".fileprovider", archivo)

    suspend fun exportAsPng(context: Context, data: ReceiptData): Uri = withContext(Dispatchers.IO) {
        val bmp = ReceiptBitmapRenderer.render(data)
        val archivo = File(carpetaTemporal(context), "recibo_${System.currentTimeMillis()}.png")
        archivo.outputStream().use { out ->
            bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
        }
        bmp.recycle()
        uriDe(context, archivo)
    }

    fun limpiarTemporales(context: Context) {
        try {
            carpetaTemporal(context).listFiles()?.forEach { it.delete() }
        } catch (_: Exception) {}
    }
}