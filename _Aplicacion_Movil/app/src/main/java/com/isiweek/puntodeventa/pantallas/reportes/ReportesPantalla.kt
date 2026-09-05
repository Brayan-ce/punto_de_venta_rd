package com.isiweek.puntodeventa.pantallas.reportes

import android.content.Context
import android.net.Uri
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
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.Category
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.PeopleAlt
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Wallet
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.recibo.ReceiptShareManager
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * Pantalla Reportes. Réplica de _Pages/admin/reportes/reportes.js.
 * Genera reportes (Ventas/Productos/Gastos/Clientes) desde la BD local
 * con fecha inicial/final y permite exportarlos a CSV (Excel).
 */
@Composable
fun ReportesPantalla(
    idioma: Idioma,
    oscuro: Boolean
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
    val cal = Calendar.getInstance()
    val hoy = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    cal.add(Calendar.DAY_OF_YEAR, -30)
    val hace30 = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)

    var tipo by remember { mutableStateOf("ventas") }
    var fechaInicio by remember { mutableStateOf(hace30) }
    var fechaFin by remember { mutableStateOf(hoy) }
    var generado by remember { mutableStateOf(false) }

    val tipos = listOf(
        "ventas" to Traducciones.texto("reportes.ventas", idioma),
        "productos" to Traducciones.texto("reportes.productos", idioma),
        "gastos" to Traducciones.texto("reportes.gastos", idioma),
        "clientes" to Traducciones.texto("reportes.clientes", idioma)
    )

    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }

    fun exportarExcel() {
            try {
                val filas = construirFilasExcel(tipo, context, fechaInicio, fechaFin)
                val bytes = generarXlsx(filas)
                val archivo = File(context.cacheDir, "Reporte_${tipo}_${fechaInicio}_${fechaFin}.xlsx")
                FileOutputStream(archivo).use { out -> out.write(bytes) }
                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", archivo)
                ReceiptShareManager.share(context, uri, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Traducciones.texto("reportes.exportar", idioma))
            } catch (e: Exception) {
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_LONG).show()
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
            Column(modifier = Modifier.padding(14.dp)) {
                Text(Traducciones.texto("reportes.titulo", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(Traducciones.texto("reportes.subtitulo", idioma), fontSize = 13.sp, color = t.textoSecundario)
            }
        }

        // ── Configurar Reporte ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 6.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text(Traducciones.texto("reportes.configurar", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 12.dp))

                EtiquetaReporte(Traducciones.texto("reportes.tipo", idioma), t)
                Spacer(Modifier.height(4.dp))
                SelectTipoReporte(tipo, tipos, t) { tipo = it; generado = false }
                Spacer(Modifier.height(10.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        EtiquetaReporte(Traducciones.texto("reportes.fechaInicial", idioma), t)
                        Spacer(Modifier.height(4.dp))
                        CampoFechaReporte(fechaInicio, { fechaInicio = it; generado = false }, t)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        EtiquetaReporte(Traducciones.texto("reportes.fechaFinal", idioma), t)
                        Spacer(Modifier.height(4.dp))
                        CampoFechaReporte(fechaFin, { fechaFin = it; generado = false }, t)
                    }
                }
                Spacer(Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(
                        modifier = Modifier
                            .weight(if (generado) 1f else 1f)
                            .background(t.primario, RoundedCornerShape(8.dp))
                            .clickable { generado = true }
                            .padding(vertical = 11.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Analytics, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("reportes.generar", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    if (generado) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .background(t.primarioClaro, RoundedCornerShape(8.dp))
                                .clickable(onClick = { exportarExcel() })
                                .padding(vertical = 11.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Outlined.Download, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(Traducciones.texto("reportes.exportar", idioma), color = t.primario, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // ── Resultado del reporte ──
        if (generado) {
            item {
                when (tipo) {
                    "ventas" -> PanelReporteVentas(context, t, idioma, fechaInicio, fechaFin, fmt)
                    "productos" -> PanelReporteProductos(context, t, idioma, fechaInicio, fechaFin, fmt)
                    "gastos" -> PanelReporteGastos(context, t, idioma, fechaInicio, fechaFin, fmt)
                    else -> PanelReporteClientes(context, t, idioma, fechaInicio, fechaFin, fmt)
                }
            }
        }
    }
}

// ─────────────────────── GENERADOR XLSX ───────────────────────

private enum class EstiloCelda { TITULO, PERIODO, HEADER, DATO, RESUMEN, RESUMEN_LABEL, RESUMEN_VALOR }

private data class CeldaX(val valor: Any, val estilo: EstiloCelda)

private fun colLetra(i: Int): String {
    val sb = StringBuilder()
    var n = i
    while (n > 0) {
        n--
        sb.append('A' + (n % 26))
        n /= 26
    }
    return sb.toString().reversed()
}

private fun escXml(s: String): String = s
    .replace("&", "&amp;")
    .replace("<", "&lt;")
    .replace(">", "&gt;")

/** Construye las filas del reporte con estilos (título, encabezados, resumen). */
private fun construirFilasExcel(tipo: String, context: android.content.Context, desde: String, hasta: String): List<List<CeldaX>> {
    val titulo = when (tipo) {
        "ventas" -> "REPORTE DE VENTAS"
        "productos" -> "REPORTE DE PRODUCTOS"
        "gastos" -> "REPORTE DE GASTOS"
        else -> "REPORTE DE CLIENTES"
    }
    val headers: List<String>
    val cuerpo: List<List<Any>>
    val resumen: List<Pair<String, Any>>

    when (tipo) {
        "ventas" -> {
            headers = listOf("Fecha", "NCF", "Cliente", "Total", "Metodo Pago", "Usuario")
            val ventas = RepositorioOffline.obtenerVentas(context).filter { it.estado == "emitida" }
                .filter { v -> val f = v.fecha.take(10); f >= desde && f <= hasta }
            cuerpo = ventas.map { listOf(it.fecha.take(10), it.ncf, it.cliente, it.total, it.metodoPago, it.vendedor) }
            val total = ventas.sumOf { it.total }
            resumen = listOf(
                "Total Ventas:" to ventas.size,
                "Monto Total:" to total,
                "Promedio por Venta:" to (if (ventas.isNotEmpty()) total / ventas.size else 0.0)
            )
        }
        "productos" -> {
            headers = listOf("Producto", "Codigo", "Categoria", "Stock Actual", "Cantidad Vendida", "Ingresos")
            val categorias = RepositorioOffline.obtenerCategorias().associateBy { it.id }
            val prods = RepositorioOffline.productosVendidosRango(context, desde, hasta)
            cuerpo = prods.map {
                listOf(
                    it.producto.nombre,
                    it.producto.codigoBarras.ifBlank { it.producto.sku.ifBlank { "N/A" } },
                    it.producto.categoriaId?.let { id -> categorias[id]?.nombre } ?: "Sin categoria",
                    it.producto.stock.toInt(),
                    it.cantidad,
                    it.monto
                )
            }
            resumen = listOf(
                "Total Productos:" to prods.size,
                "Productos Vendidos:" to prods.count { it.cantidad > 0 },
                "Unidades Vendidas:" to prods.sumOf { it.cantidad },
                "Ingresos Totales:" to prods.sumOf { it.monto }
            )
        }
        "gastos" -> {
            headers = listOf("Fecha", "Concepto", "Categoria", "Monto", "Comprobante")
            val gastos = RepositorioOffline.obtenerGastosGenerales(context)
                .filter { g -> val f = g.fechaGasto.take(10); f >= desde && f <= hasta }
            cuerpo = gastos.map { listOf(it.fechaGasto.take(10), it.concepto, it.categoria.ifBlank { "Sin categoria" }, it.monto, it.comprobanteNumero.ifBlank { "N/A" }) }
            val total = gastos.sumOf { it.monto }
            resumen = listOf(
                "Total Gastos:" to gastos.size,
                "Monto Total:" to total,
                "Promedio por Gasto:" to (if (gastos.isNotEmpty()) total / gastos.size else 0.0)
            )
        }
        else -> {
            headers = listOf("Cliente", "Documento", "Telefono", "Total Compras", "Ultima Compra")
            val clientes = reporteClientes(context, desde, hasta)
            cuerpo = clientes.map { listOf(it.nombre, it.documento, it.telefono, it.totalCompras, it.ultimaCompra.ifBlank { "N/A" }) }
            resumen = listOf(
                "Total Clientes:" to clientes.size,
                "Compras Totales:" to clientes.sumOf { it.totalCompras }
            )
        }
    }

    val filas = mutableListOf<List<CeldaX>>()
    filas.add(listOf(CeldaX(titulo, EstiloCelda.TITULO)))
    filas.add(listOf(CeldaX("Periodo: $desde al $hasta", EstiloCelda.PERIODO)))
    filas.add(listOf(CeldaX("", EstiloCelda.DATO)))
    filas.add(headers.map { CeldaX(it, EstiloCelda.HEADER) })
    cuerpo.forEach { fila -> filas.add(fila.map { CeldaX(it, EstiloCelda.DATO) }) }
    filas.add(listOf(CeldaX("", EstiloCelda.DATO)))
    filas.add(listOf(CeldaX("RESUMEN", EstiloCelda.RESUMEN)))
    resumen.forEach { (label, valor) ->
        filas.add(listOf(CeldaX(label, EstiloCelda.RESUMEN_LABEL), CeldaX(valor, EstiloCelda.RESUMEN_VALOR)))
    }
    return filas
}

/** Genera un archivo .xlsx real (ZIP+XML) a partir de las filas con estilos. */
private fun generarXlsx(filas: List<List<CeldaX>>): ByteArray {
    val cols = filas.maxOf { it.size }.coerceAtLeast(1)
    val ultimaCol = colLetra(cols)

    fun celdaXml(ref: String, c: CeldaX): String {
        val s = when (c.estilo) {
            EstiloCelda.TITULO -> 1
            EstiloCelda.PERIODO -> 0
            EstiloCelda.HEADER -> 2
            EstiloCelda.RESUMEN -> 3
            EstiloCelda.RESUMEN_LABEL -> 3
            EstiloCelda.RESUMEN_VALOR -> 1
            EstiloCelda.DATO -> 0
        }
        val valor = c.valor
        return if (valor is Number) {
            "<c r=\"$ref\" s=\"$s\"><v>${valor}</v></c>"
        } else {
            "<c r=\"$ref\" s=\"$s\" t=\"inlineStr\"><is><t>${escXml(valor.toString())}</t></is></c>"
        }
    }

    val mergeRefs = mutableListOf<String>()
    val sheet = StringBuilder()
    sheet.append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n")
    sheet.append("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">")
    sheet.append("<sheetViews><sheetView workbookViewId=\"0\"/></sheetViews>")
    sheet.append("<cols>")
    for (i in 1..cols) sheet.append("<col min=\"$i\" max=\"$i\" width=\"20\" customWidth=\"1\"/>")
    sheet.append("</cols>")
    sheet.append("<sheetData>")

    filas.forEachIndexed { idx, fila ->
        val rowNum = idx + 1
        val mergeable = fila.isNotEmpty() && (fila[0].estilo == EstiloCelda.TITULO || fila[0].estilo == EstiloCelda.PERIODO || fila[0].estilo == EstiloCelda.RESUMEN)
        if (mergeable) {
            mergeRefs.add("A$rowNum:$ultimaCol$rowNum")
        }
        sheet.append("<row r=\"$rowNum\">")
        if (mergeable && fila.isNotEmpty()) {
            sheet.append(celdaXml("A$rowNum", fila[0]))
        } else {
            fila.forEachIndexed { ci, celda ->
                sheet.append(celdaXml("${colLetra(ci + 1)}$rowNum", celda))
            }
        }
        sheet.append("</row>")
    }
    sheet.append("</sheetData>")
    if (mergeRefs.isNotEmpty()) {
        sheet.append("<mergeCells count=\"${mergeRefs.size}\">")
        mergeRefs.forEach { sheet.append("<mergeCell ref=\"$it\"/>") }
        sheet.append("</mergeCells>")
    }
    sheet.append("</worksheet>")

    val styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="4">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><name val="Calibri"/></font>
<font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><name val="Calibri"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>"""

    val contentTypes = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>"""

    val baos = ByteArrayOutputStream()
    ZipOutputStream(baos).use { zip ->
        zip.putNextEntry(ZipEntry("[Content_Types].xml")); zip.write(contentTypes.toByteArray(Charsets.UTF_8)); zip.closeEntry()
        zip.putNextEntry(ZipEntry("_rels/.rels")); zip.write(
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""".trimIndent().toByteArray(Charsets.UTF_8)
        ); zip.closeEntry()
        zip.putNextEntry(ZipEntry("xl/workbook.xml")); zip.write(
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Reporte" sheetId="1" r:id="rId1"/></sheets>
</workbook>""".trimIndent().toByteArray(Charsets.UTF_8)
        ); zip.closeEntry()
        zip.putNextEntry(ZipEntry("xl/_rels/workbook.xml.rels")); zip.write(
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>""".trimIndent().toByteArray(Charsets.UTF_8)
        ); zip.closeEntry()
        zip.putNextEntry(ZipEntry("xl/styles.xml")); zip.write(styles.toByteArray(Charsets.UTF_8)); zip.closeEntry()
        zip.putNextEntry(ZipEntry("xl/worksheets/sheet1.xml")); zip.write(sheet.toString().toByteArray(Charsets.UTF_8)); zip.closeEntry()
    }
    return baos.toByteArray()
}

// ─────────────────────── DATOS CLIENTES ───────────────────────

private data class ClienteReporteRow(
    val nombre: String,
    val documento: String,
    val telefono: String,
    val totalCompras: Double,
    val ultimaCompra: String
)

private fun reporteClientes(context: Context, desde: String, hasta: String): List<ClienteReporteRow> {
    val clientes = RepositorioOffline.obtenerClientesVenta()
    val ventas = RepositorioOffline.obtenerVentas(context)
        .filter { it.estado == "emitida" }
        .filter { v -> val f = v.fecha.take(10); f >= desde && f <= hasta }
    return clientes.map { c ->
        val compras = ventas.filter { it.cliente.equals(c.nombreCompleto, ignoreCase = true) }
        ClienteReporteRow(
            nombre = c.nombreCompleto,
            documento = c.documento,
            telefono = c.telefono.ifBlank { "N/A" },
            totalCompras = compras.sumOf { it.total },
            ultimaCompra = compras.maxOfOrNull { it.fecha.take(10) } ?: ""
        )
    }.sortedByDescending { it.totalCompras }
}

// ─────────────────────── PANELES ───────────────────────

@Composable
private fun PanelReporteVentas(
    context: android.content.Context,
    t: TokensWeb,
    idioma: Idioma,
    desde: String,
    hasta: String,
    fmt: (Double) -> String
) {
    val ventas = remember(desde, hasta) {
        RepositorioOffline.obtenerVentas(context).filter { it.estado == "emitida" }
            .filter { v -> val f = v.fecha.take(10); f >= desde && f <= hasta }
    }
    val total = ventas.sumOf { it.total }

    PanelReporte(
        t,
        Traducciones.texto("reportes.reporteVentas", idioma),
        desde,
        hasta,
        Icons.Outlined.Receipt,
        Color(0xFF2563EB)
    ) {
        FilaResumenReporte(Traducciones.texto("reportes.totalVentas", idioma), ventas.size.toString(), t)
        FilaResumenReporte(Traducciones.texto("reportes.montoTotal", idioma), fmt(total), t)
        FilaResumenReporte(Traducciones.texto("reportes.promedio", idioma), fmt(if (ventas.isNotEmpty()) total / ventas.size else 0.0), t)

        if (ventas.isEmpty()) {
            VacioReporte(t, idioma)
        } else {
            CabeceraReporte(listOf("NCF", Traducciones.texto("reportes.cliente", idioma), Traducciones.texto("reportes.fecha", idioma), Traducciones.texto("reportes.total", idioma)), t)
            ventas.forEach { v ->
                FilaReporte(listOf(v.ncf.ifBlank { "—" }, v.cliente, v.fecha.take(10), fmt(v.total)), t)
            }
        }
    }
}

@Composable
private fun PanelReporteProductos(
    context: android.content.Context,
    t: TokensWeb,
    idioma: Idioma,
    desde: String,
    hasta: String,
    fmt: (Double) -> String
) {
    val productos = remember(desde, hasta) { RepositorioOffline.productosVendidosRango(context, desde, hasta) }
    val vendidos = productos.filter { it.cantidad > 0 }
    val unidades = productos.sumOf { it.cantidad }
    val ingresos = productos.sumOf { it.monto }

    PanelReporte(
        t,
        Traducciones.texto("reportes.reporteProductos", idioma),
        desde,
        hasta,
        Icons.Outlined.Category,
        Color(0xFF8B5CF6)
    ) {
        FilaResumenReporte(Traducciones.texto("reportes.totalProductos", idioma), productos.size.toString(), t)
        FilaResumenReporte(Traducciones.texto("reportes.productosVendidos", idioma), vendidos.size.toString(), t)
        FilaResumenReporte(Traducciones.texto("reportes.unidadesVendidas", idioma), "%.2f".format(unidades), t)
        FilaResumenReporte(Traducciones.texto("reportes.ingresos", idioma), fmt(ingresos), t)

        if (productos.isEmpty()) {
            VacioReporte(t, idioma)
        } else {
            CabeceraReporte(listOf(Traducciones.texto("reportes.producto", idioma), Traducciones.texto("reportes.vendido", idioma), Traducciones.texto("reportes.ingresos", idioma)), t)
            productos.forEach { p ->
                FilaReporte(listOf(p.producto.nombre, "%.2f".format(p.cantidad), fmt(p.monto)), t)
            }
        }
    }
}

@Composable
private fun PanelReporteGastos(
    context: android.content.Context,
    t: TokensWeb,
    idioma: Idioma,
    desde: String,
    hasta: String,
    fmt: (Double) -> String
) {
    val gastos = remember(desde, hasta) {
        RepositorioOffline.obtenerGastosGenerales(context)
            .filter { g -> val f = g.fechaGasto.take(10); f >= desde && f <= hasta }
    }
    val total = gastos.sumOf { it.monto }

    PanelReporte(
        t,
        Traducciones.texto("reportes.reporteGastos", idioma),
        desde,
        hasta,
        Icons.Outlined.Wallet,
        Color(0xFFEF4444)
    ) {
        FilaResumenReporte(Traducciones.texto("reportes.totalGastos", idioma), gastos.size.toString(), t)
        FilaResumenReporte(Traducciones.texto("reportes.montoTotal", idioma), fmt(total), t)
        FilaResumenReporte(Traducciones.texto("reportes.promedio", idioma), fmt(if (gastos.isNotEmpty()) total / gastos.size else 0.0), t)

        if (gastos.isEmpty()) {
            VacioReporte(t, idioma)
        } else {
            CabeceraReporte(listOf(Traducciones.texto("reportes.concepto", idioma), Traducciones.texto("reportes.categoria", idioma), Traducciones.texto("reportes.fecha", idioma), Traducciones.texto("reportes.monto", idioma)), t)
            gastos.forEach { g ->
                FilaReporte(listOf(g.concepto, g.categoria.ifBlank { "—" }, g.fechaGasto.take(10), fmt(g.monto)), t)
            }
        }
    }
}

@Composable
private fun PanelReporteClientes(
    context: android.content.Context,
    t: TokensWeb,
    idioma: Idioma,
    desde: String,
    hasta: String,
    fmt: (Double) -> String
) {
    val filas = remember(desde, hasta) { reporteClientes(context, desde, hasta) }
    val total = filas.sumOf { it.totalCompras }

    PanelReporte(
        t,
        Traducciones.texto("reportes.reporteClientes", idioma),
        desde,
        hasta,
        Icons.Outlined.PeopleAlt,
        Color(0xFF10B981)
    ) {
        FilaResumenReporte(Traducciones.texto("reportes.totalClientes", idioma), filas.size.toString(), t)
        FilaResumenReporte(Traducciones.texto("reportes.comprasTotales", idioma), fmt(total), t)

        if (filas.isEmpty()) {
            VacioReporte(t, idioma)
        } else {
            CabeceraReporte(listOf(Traducciones.texto("reportes.cliente", idioma), Traducciones.texto("reportes.documento", idioma), Traducciones.texto("reportes.total", idioma), Traducciones.texto("reportes.ultimaCompra", idioma)), t)
            filas.forEach { c ->
                FilaReporte(listOf(c.nombre, c.documento.ifBlank { "—" }, fmt(c.totalCompras), c.ultimaCompra.ifBlank { "N/A" }), t)
            }
        }
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun EtiquetaReporte(texto: String, t: TokensWeb) {
    Text(texto, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
}

@Composable
private fun CampoFechaReporte(valor: String, onValor: (String) -> Unit, t: TokensWeb) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            singleLine = true,
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun SelectTipoReporte(
    actual: String,
    opciones: List<Pair<String, String>>,
    t: TokensWeb,
    onSeleccion: (String) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }
    Box(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(40.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .clickable { expandido = true }
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = opciones.first { it.first == actual }.second,
                color = t.textoPrimario,
                fontSize = 14.sp,
                modifier = Modifier.weight(1f)
            )
            Icon(Icons.Outlined.KeyboardArrowDown, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
        }
        androidx.compose.material3.DropdownMenu(
            expanded = expandido,
            onDismissRequest = { expandido = false },
            containerColor = t.fondoElevado
        ) {
            opciones.forEach { (valor, etiqueta) ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(etiqueta, color = t.textoPrimario, fontSize = 13.sp) },
                    onClick = { onSeleccion(valor); expandido = false }
                )
            }
        }
    }
}

@Composable
private fun PanelReporte(
    t: TokensWeb,
    titulo: String,
    desde: String,
    hasta: String,
    icono: ImageVector,
    color: Color,
    contenido: @Composable () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 10.dp)) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(color.copy(alpha = 0.12f), RoundedCornerShape(9.dp)),
                contentAlignment = Alignment.Center
            ) { Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(19.dp)) }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(titulo, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text("${formatearRango(desde)} - ${formatearRango(hasta)}", fontSize = 12.sp, color = t.textoSecundario)
            }
        }
        contenido()
    }
}

@Composable
private fun FilaResumenReporte(etiqueta: String, valor: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(etiqueta, color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(valor, color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun CabeceraReporte(columnas: List<String>, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoContenido, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        columnas.forEachIndexed { i, col ->
            Text(
                text = col,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = t.textoSecundario,
                modifier = Modifier.weight(if (i == 0) 1.4f else 1f),
                textAlign = if (i == 0) androidx.compose.ui.text.style.TextAlign.Start else androidx.compose.ui.text.style.TextAlign.End,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun FilaReporte(celdas: List<String>, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        celdas.forEachIndexed { i, celda ->
            Text(
                text = celda,
                fontSize = 12.sp,
                color = if (i == 0) t.textoPrimario else t.textoSecundario,
                fontWeight = if (i == 0) FontWeight.SemiBold else FontWeight.Normal,
                modifier = Modifier.weight(if (i == 0) 1.4f else 1f),
                textAlign = if (i == 0) androidx.compose.ui.text.style.TextAlign.Start else androidx.compose.ui.text.style.TextAlign.End,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun VacioReporte(t: TokensWeb, idioma: Idioma) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 18.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(Icons.Outlined.Analytics, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(24.dp))
        Spacer(Modifier.height(6.dp))
        Text(Traducciones.texto("reportes.sinDatos", idioma), color = t.textoTerciario, fontSize = 13.sp)
    }
}

private fun formatearRango(fecha: String): String {
    return try {
        val entrada = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val salida = SimpleDateFormat("d 'de' MMM 'de' yyyy", Locale("es", "DO"))
        salida.format(entrada.parse(fecha) ?: return fecha)
    } catch (e: Exception) {
        fecha
    }
}