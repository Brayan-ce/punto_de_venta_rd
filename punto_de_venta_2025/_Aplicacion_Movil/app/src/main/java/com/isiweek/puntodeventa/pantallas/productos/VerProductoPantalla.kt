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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Settings
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Detalle del Producto. Réplica de _Pages/admin/productos/ver/ver.js.
 * Muestra toda la información del producto desde la base de datos local.
 */
@Composable
fun VerProductoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    productoId: Long,
    onEditar: () -> Unit,
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

    var producto by remember { mutableStateOf(RepositorioOffline.obtenerProductoPorId(productoId)) }

    val prod = producto ?: run {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(t.fondoContenido)
                .padding(40.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(Traducciones.texto("productos.noEncontrado", idioma), color = t.textoSecundario, fontSize = 14.sp)
        }
        return
    }

    val stockBajo = prod.stock <= prod.stockMinimo
    val unidad = RepositorioOffline.obtenerUnidadNombre(prod.unidadMedidaId)
    val fmt = { v: Double -> "${RepositorioOffline.simboloMoneda()} %.2f".format(v) }

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
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .background(if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9), RoundedCornerShape(10.dp))
                        .clickable(onClick = onCerrar),
                    contentAlignment = Alignment.Center
                ) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, tint = t.textoSecundario, modifier = Modifier.size(20.dp)) }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(Traducciones.texto("productos.verTitulo", idioma), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Text(Traducciones.texto("productos.verSubtitulo", idioma), fontSize = 12.sp, color = t.textoSecundario)
                }
                Row(
                    modifier = Modifier
                        .background(t.primario, RoundedCornerShape(8.dp))
                        .clickable(onClick = onEditar)
                        .padding(horizontal = 12.dp, vertical = 9.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Create, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(5.dp))
                    Text(Traducciones.texto("productos.editar", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // ── Imagen + estado ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .background(t.fondoTerciario, RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Outlined.Image, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(36.dp))
                        Spacer(Modifier.height(4.dp))
                        Text(Traducciones.texto("productos.sinImagen", idioma), color = t.textoTerciario, fontSize = 12.sp)
                    }
                }
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    BadgeDetalle(
                        Traducciones.texto(if (prod.activo) "productos.activo" else "productos.inactivo", idioma),
                        if (prod.activo) Color(0xFF10B981) else Color(0xFF64748B),
                        t
                    )
                    if (stockBajo) {
                        BadgeDetalle(Traducciones.texto("productos.bajoStock", idioma), Color(0xFFEF4444), t)
                    }
                }
            }
        }

        // ── Información general ──
        item {
            SeccionDetalle(Traducciones.texto("productos.infoGeneral", idioma), Icons.Outlined.Inventory2, t) {
                Text(prod.nombre, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                if (prod.descripcion.isNotBlank()) {
                    Text(prod.descripcion, fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.padding(top = 4.dp))
                }
                Spacer(Modifier.height(10.dp))
                CampoDetalle(Traducciones.texto("productos.codigoBarras", idioma), prod.codigoBarras.ifBlank { "—" }, t)
                CampoDetalle("SKU", prod.sku.ifBlank { "—" }, t)
                CampoDetalle(Traducciones.texto("productos.categoria", idioma), RepositorioOffline.obtenerCategoriaNombre(prod.categoriaId), t)
                CampoDetalle(Traducciones.texto("productos.marca", idioma), RepositorioOffline.obtenerMarcaNombre(prod.marcaId), t)
                CampoDetalle(Traducciones.texto("productos.unidadMedida", idioma), unidad, t)
            }
        }

        // ── Precios ──
        item {
            SeccionDetalle(Traducciones.texto("productos.precios", idioma), Icons.Outlined.Payments, t) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    BoxPrecio(Traducciones.texto("productos.precioCompra", idioma), fmt(prod.precioCompra), t, Modifier.weight(1f))
                    BoxPrecio(Traducciones.texto("productos.precioVenta", idioma), fmt(prod.precioVenta), t, Modifier.weight(1f), destacado = true)
                }
                if (prod.precioOferta > 0) {
                    CampoDetalle(Traducciones.texto("productos.precioOferta", idioma), fmt(prod.precioOferta), t)
                }
                if (prod.precioMayorista > 0) {
                    CampoDetalle(Traducciones.texto("productos.precioMayorista", idioma), fmt(prod.precioMayorista), t)
                }
            }
        }

        // ── Inventario ──
        item {
            SeccionDetalle(Traducciones.texto("productos.inventario", idioma), Icons.Outlined.Inventory2, t) {
                BoxPrecio(Traducciones.texto("productos.stockActual", idioma), "${prod.stock} $unidad", t, Modifier.fillMaxWidth(), colorStock = stockBajo)
                Spacer(Modifier.height(6.dp))
                CampoDetalle(Traducciones.texto("productos.stockMinimo", idioma), "${prod.stockMinimo} $unidad", t)
                CampoDetalle(Traducciones.texto("productos.stockMaximo", idioma), "${prod.stockMaximo} $unidad", t)
            }
        }

        // ── Configuración ──
        item {
            SeccionDetalle(Traducciones.texto("productos.configuracion", idioma), Icons.Outlined.Settings, t) {
                CampoDetalle(
                    Traducciones.texto("productos.aplicaItbis", idioma),
                    if (prod.aplicaItbis) Traducciones.texto("general.si", idioma) else Traducciones.texto("general.no", idioma),
                    t
                )
                CampoDetalle(
                    Traducciones.texto("productos.activo", idioma),
                    if (prod.activo) Traducciones.texto("general.si", idioma) else Traducciones.texto("general.no", idioma),
                    t
                )
            }
        }
    }
}

@Composable
private fun BadgeDetalle(texto: String, color: Color, t: TokensWeb) {
    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(50))
            .border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(texto, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun SeccionDetalle(
    titulo: String,
    icono: androidx.compose.ui.graphics.vector.ImageVector,
    t: TokensWeb,
    contenido: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icono, contentDescription = null, tint = t.primario, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text(titulo, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        }
        Spacer(Modifier.height(10.dp))
        Column(modifier = Modifier.fillMaxWidth(), content = contenido)
    }
}

@Composable
private fun CampoDetalle(label: String, valor: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 12.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
        Text(valor, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario, textAlign = TextAlign.End)
    }
}

@Composable
private fun BoxPrecio(
    etiqueta: String,
    valor: String,
    t: TokensWeb,
    modifier: Modifier = Modifier,
    destacado: Boolean = false,
    colorStock: Boolean = false
) {
    Column(
        modifier = modifier
            .background(if (destacado) t.primarioClaro else t.fondoContenido, RoundedCornerShape(8.dp))
            .padding(10.dp)
    ) {
        Text(etiqueta, fontSize = 11.sp, color = t.textoSecundario)
        Text(
            valor,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = if (colorStock) Color(0xFFEF4444) else if (destacado) t.primario else t.textoPrimario
        )
    }
}