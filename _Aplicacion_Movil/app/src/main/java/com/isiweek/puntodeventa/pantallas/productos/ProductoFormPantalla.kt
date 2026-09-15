package com.isiweek.puntodeventa.pantallas.productos

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.Refresh
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import org.json.JSONObject

/**
 * Formulario Nuevo / Editar Producto. Réplica de _Pages/admin/productos/nuevo y editar.
 * Guarda el producto en la base de datos local (tabla "productos").
 */
@Composable
fun ProductoFormPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    esNuevo: Boolean,
    productoId: Long?,
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
    val categorias = remember { RepositorioOffline.obtenerCategorias() }
    val marcas = remember { RepositorioOffline.obtenerMarcas() }
    val unidades = remember { RepositorioOffline.obtenerUnidadesMedida() }
    val existente = remember(productoId) { productoId?.let { RepositorioOffline.obtenerProductoPorId(it) } }

    var nombre by remember { mutableStateOf(existente?.nombre ?: "") }
    var descripcion by remember { mutableStateOf(existente?.descripcion ?: "") }
    var codigoBarras by remember { mutableStateOf(existente?.codigoBarras ?: if (esNuevo) RepositorioOffline.generarCodigoBarrasUnico() else "") }
    var sku by remember { mutableStateOf(existente?.sku ?: if (esNuevo) RepositorioOffline.generarSkuUnico() else "") }
    var categoriaIdx by remember { mutableStateOf(existente?.categoriaId?.let { id -> categorias.indexOfFirst { it.id == id } } ?: -1) }
    var marcaIdx by remember { mutableStateOf(existente?.marcaId?.let { id -> marcas.indexOfFirst { it.id == id } } ?: -1) }
    var unidadIdx by remember { mutableStateOf(existente?.unidadMedidaId?.let { id -> unidades.indexOfFirst { it.id == id } } ?: -1) }
    var precioCompra by remember { mutableStateOf(if (existente != null) "%.2f".format(existente.precioCompra) else "") }
    var precioUnidad by remember { mutableStateOf(if (existente != null) "%.2f".format(existente.precioVenta) else "") }
    var precioOferta by remember { mutableStateOf(if (existente != null && existente.precioOferta > 0) "%.2f".format(existente.precioOferta) else "") }
    var precioMayorista by remember { mutableStateOf(if (existente != null && existente.precioMayorista > 0) "%.2f".format(existente.precioMayorista) else "") }
    var cantidadMayorista by remember { mutableStateOf((existente?.cantidadMayorista ?: 6).toString()) }
    var stock by remember { mutableStateOf(if (existente != null) "%.3f".format(existente.stock) else "0") }
    var stockMinimo by remember { mutableStateOf(if (existente != null) "%.3f".format(existente.stockMinimo) else "5") }
    var stockMaximo by remember { mutableStateOf(if (existente != null) "%.3f".format(existente.stockMaximo) else "100") }
    var aplicaItbis by remember { mutableStateOf(existente?.aplicaItbis ?: true) }
    var activo by remember { mutableStateOf(existente?.activo ?: true) }

    val titulo = if (esNuevo) Traducciones.texto("productos.nuevoTitulo", idioma) else Traducciones.texto("productos.editarTitulo", idioma)
    val subtitulo = if (esNuevo) Traducciones.texto("productos.nuevoSubtitulo", idioma) else Traducciones.texto("productos.editarSubtitulo", idioma)

    fun guardar() {
        val id = if (esNuevo) RepositorioOffline.proximoIdTabla("productos") else (productoId ?: 1L).toInt()
        val prod = JSONObject()
        prod.put("id", id)
        prod.put("empresa_id", RepositorioOffline.obtenerEmpresa()?.id ?: 0)
        prod.put("nombre", nombre.trim())
        prod.put("descripcion", descripcion.trim())
        prod.put("codigo_barras", codigoBarras.trim().ifBlank { RepositorioOffline.generarCodigoBarrasUnico() })
        prod.put("sku", sku.trim().ifBlank { RepositorioOffline.generarSkuUnico() })
        prod.put("categoria_id", categorias.getOrNull(categoriaIdx)?.id ?: JSONObject.NULL)
        prod.put("marca_id", marcas.getOrNull(marcaIdx)?.id ?: JSONObject.NULL)
        prod.put("unidad_medida_id", unidades.getOrNull(unidadIdx)?.id ?: JSONObject.NULL)
        prod.put("precio_compra", precioCompra.toDoubleOrNull() ?: 0.0)
        prod.put("precio_venta", precioUnidad.toDoubleOrNull() ?: 0.0)
        prod.put("precio_oferta", precioOferta.toDoubleOrNull() ?: 0.0)
        prod.put("precio_mayorista", precioMayorista.toDoubleOrNull() ?: 0.0)
        prod.put("cantidad_mayorista", cantidadMayorista.toIntOrNull() ?: 6)
        prod.put("stock", stock.toDoubleOrNull() ?: 0.0)
        prod.put("stock_minimo", stockMinimo.toDoubleOrNull() ?: 5.0)
        prod.put("stock_maximo", stockMaximo.toDoubleOrNull() ?: 100.0)
        prod.put("aplica_itbis", if (aplicaItbis) 1 else 0)
        prod.put("activo", if (activo) 1 else 0)
        RepositorioOffline.guardarProducto(context, prod)
        onCerrar()
    }

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
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(titulo, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Text(subtitulo, fontSize = 12.sp, color = t.textoSecundario)
                }
                Row(
                    modifier = Modifier
                        .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                        .clickable(onClick = onCerrar)
                        .padding(horizontal = 12.dp, vertical = 9.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(5.dp))
                    Text(Traducciones.texto("vender.cancelar", idioma), color = t.textoSecundario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // ── Información General ──
        item {
            SeccionForm(Traducciones.texto("productos.infoGeneral", idioma), t) {
                CampoForm(Traducciones.texto("productos.nombreProducto", idioma), t) {
                    CampoWeb(valor = nombre, onValor = { nombre = it }, tokens = t, placeholder = Traducciones.texto("productos.nombrePlaceholder", idioma), alto = 40)
                }
                CampoForm(Traducciones.texto("productos.descripcion", idioma), t) {
                    CampoArea(descripcion, { descripcion = it }, t, Traducciones.texto("productos.descripcionPlaceholder", idioma))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CampoForm(Traducciones.texto("productos.codigoBarras", idioma), t, Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            CampoWeb(valor = codigoBarras, onValor = { codigoBarras = it }, tokens = t, placeholder = Traducciones.texto("productos.autoGenerado", idioma), alto = 40, modifier = Modifier.weight(1f))
                            BotonGenerar(t) { codigoBarras = RepositorioOffline.generarCodigoBarrasUnico() }
                        }
                    }
                    CampoForm("SKU", t, Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            CampoWeb(valor = sku, onValor = { sku = it }, tokens = t, placeholder = Traducciones.texto("productos.autoGenerado", idioma), alto = 40, modifier = Modifier.weight(1f))
                            BotonGenerar(t) { sku = RepositorioOffline.generarSkuUnico() }
                        }
                    }
                }
                CampoForm(Traducciones.texto("productos.categoria", idioma), t) {
                    SelectForm(Traducciones.texto("productos.sinCategoria", idioma), categorias.map { it.nombre }, categoriaIdx, t) { categoriaIdx = it }
                }
                CampoForm(Traducciones.texto("productos.marca", idioma), t) {
                    SelectForm(Traducciones.texto("productos.sinMarca", idioma), marcas.map { it.nombre }, marcaIdx, t) { marcaIdx = it }
                }
                CampoForm(Traducciones.texto("productos.unidadMedida", idioma), t) {
                    SelectForm(Traducciones.texto("productos.seleccionar", idioma), unidades.map { "${it.nombre} (${it.abreviatura})" }, unidadIdx, t) { unidadIdx = it }
                }
            }
        }

        // ── Precios ──
        item {
            SeccionForm(Traducciones.texto("productos.precios", idioma), t) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CampoForm(Traducciones.texto("productos.precioCompra", idioma), t, Modifier.weight(1f)) {
                        CampoMonedaForm(precioCompra, { precioCompra = it }, t)
                    }
                    CampoForm(Traducciones.texto("productos.precioVenta", idioma), t, Modifier.weight(1f)) {
                        CampoMonedaForm(precioUnidad, { precioUnidad = it }, t)
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CampoForm(Traducciones.texto("productos.precioOferta", idioma), t, Modifier.weight(1f)) {
                        CampoMonedaForm(precioOferta, { precioOferta = it }, t)
                    }
                    CampoForm(Traducciones.texto("productos.precioMayorista", idioma), t, Modifier.weight(1f)) {
                        CampoMonedaForm(precioMayorista, { precioMayorista = it }, t)
                    }
                }
                CampoForm(Traducciones.texto("productos.cantidadMayorista", idioma), t) {
                    CampoWeb(valor = cantidadMayorista, onValor = { cantidadMayorista = it }, tokens = t, placeholder = "6", alto = 40, tipoTexto = KeyboardType.Number)
                }
            }
        }

        // ── Control de Inventario ──
        item {
            SeccionForm(Traducciones.texto("productos.inventario", idioma), t) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CampoForm(Traducciones.texto("productos.stock", idioma), t, Modifier.weight(1f)) {
                        CampoWeb(valor = stock, onValor = { stock = it }, tokens = t, placeholder = "0", alto = 40, tipoTexto = KeyboardType.Decimal)
                    }
                    CampoForm(Traducciones.texto("productos.stockMinimo", idioma), t, Modifier.weight(1f)) {
                        CampoWeb(valor = stockMinimo, onValor = { stockMinimo = it }, tokens = t, placeholder = "5", alto = 40, tipoTexto = KeyboardType.Decimal)
                    }
                    CampoForm(Traducciones.texto("productos.stockMaximo", idioma), t, Modifier.weight(1f)) {
                        CampoWeb(valor = stockMaximo, onValor = { stockMaximo = it }, tokens = t, placeholder = "100", alto = 40, tipoTexto = KeyboardType.Decimal)
                    }
                }
            }
        }

        // ── Configuración ──
        item {
            SeccionForm(Traducciones.texto("productos.configuracion", idioma), t) {
                SwitchForm(Traducciones.texto("productos.aplicaItbis", idioma), aplicaItbis, { aplicaItbis = it }, t)
                SwitchForm(Traducciones.texto("productos.activo", idioma), activo, { activo = it }, t)
            }
        }

        // ── Footer ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                        .clickable(onClick = onCerrar)
                        .padding(vertical = 13.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(Traducciones.texto("vender.cancelar", idioma), color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(t.exito, RoundedCornerShape(8.dp))
                        .clickable(enabled = nombre.isNotBlank()) { guardar() }
                        .padding(vertical = 13.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(5.dp))
                        Text(
                            if (esNuevo) Traducciones.texto("productos.guardar", idioma) else Traducciones.texto("productos.actualizar", idioma),
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SeccionForm(
    titulo: String,
    t: TokensWeb,
    contenido: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(titulo, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp), content = contenido)
    }
}

@Composable
private fun CampoForm(
    etiqueta: String,
    t: TokensWeb,
    modifier: Modifier = Modifier,
    contenido: @Composable () -> Unit
) {
    Column(modifier = modifier) {
        Text(etiqueta, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(bottom = 6.dp))
        contenido()
    }
}

@Composable
private fun BotonGenerar(t: TokensWeb, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(40.dp)
            .background(t.primarioClaro, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(Icons.Outlined.Refresh, contentDescription = null, tint = t.primario, modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun CampoArea(
    valor: String,
    onValor: (String) -> Unit,
    t: TokensWeb,
    placeholder: String
) {
    var enfocado by remember { mutableStateOf(false) }
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 72.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(if (enfocado) 2.dp else 1.dp, if (enfocado) t.primario else t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier.fillMaxWidth()
        )
        if (valor.isEmpty()) {
            Text(placeholder, color = t.textoTerciario, fontSize = 13.sp)
        }
    }
}

@Composable
private fun CampoMonedaForm(valor: String, onValor: (String) -> Unit, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(RepositorioOffline.simboloMoneda(), color = t.textoSecundario, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 10.dp, end = 6.dp))
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            singleLine = true,
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier
                .weight(1f)
                .padding(end = 10.dp)
        )
    }
}

@Composable
private fun SelectForm(
    etiqueta: String,
    opciones: List<String>,
    seleccionIdx: Int,
    t: TokensWeb,
    onSeleccion: (Int) -> Unit
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
                text = if (seleccionIdx in opciones.indices) opciones[seleccionIdx] else etiqueta,
                color = if (seleccionIdx in opciones.indices) t.textoPrimario else t.textoTerciario,
                fontSize = 14.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
            Icon(Icons.Outlined.KeyboardArrowDown, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
        }
        androidx.compose.material3.DropdownMenu(
            expanded = expandido,
            onDismissRequest = { expandido = false },
            containerColor = t.fondoElevado
        ) {
            androidx.compose.material3.DropdownMenuItem(
                text = { Text(etiqueta, color = t.textoPrimario, fontSize = 13.sp) },
                onClick = { onSeleccion(-1); expandido = false }
            )
            opciones.forEachIndexed { idx, opc ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(opc, color = t.textoPrimario, fontSize = 13.sp) },
                    onClick = { onSeleccion(idx); expandido = false }
                )
            }
        }
    }
}

@Composable
private fun SwitchForm(
    etiqueta: String,
    activo: Boolean,
    onCambio: (Boolean) -> Unit,
    t: TokensWeb
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCambio(!activo) }
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            Modifier.width(44.dp).height(24.dp).background(if (activo) Color(0xFF10B981) else if (t.fondoContenido == Color(0xFF0F172A)) Color(0xFF475569) else Color(0xFFCBD5E1), RoundedCornerShape(50)).padding(2.dp),
            contentAlignment = if (activo) Alignment.CenterEnd else Alignment.CenterStart
        ) { Box(Modifier.size(20.dp).background(Color.White, RoundedCornerShape(50))) }
        Spacer(Modifier.width(10.dp))
        Text(etiqueta, fontSize = 14.sp, color = t.textoPrimario)
    }
}