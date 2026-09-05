package com.isiweek.puntodeventa.pantallas.marcas

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
import androidx.compose.material.icons.outlined.Category
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.Public
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * Pantalla Detalles de la Marca. Muestra la información de la marca y sus
 * estadísticas calculadas desde la base de datos local.
 */
@Composable
fun VerMarcaPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    marcaId: Int?,
    onEditar: () -> Unit,
    onEliminar: () -> Unit,
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
    var confirmarEliminar by remember { mutableStateOf(false) }

    val marca = remember(marcaId) { marcaId?.let { RepositorioOffline.obtenerMarcaPorId(it) } }
    val totalProductos = remember(marcaId) { marcaId?.let { RepositorioOffline.contarProductosMarca(it) } ?: 0 }

    if (marca == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(t.fondoContenido)
                .padding(40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(Icons.Outlined.LocalOffer, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
            Spacer(Modifier.height(8.dp))
            Text(Traducciones.texto("marcas.noEncontrada", idioma), color = t.textoTerciario, fontSize = 14.sp)
        }
        return
    }

    val colorEstado = if (marca.activo) Color(0xFF10B981) else Color(0xFF64748B)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // ── Header + acciones ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp)
            ) {
                Text(Traducciones.texto("marcas.detalles", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(Traducciones.texto("marcas.detallesSub", idioma), fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.padding(bottom = 10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    BotonHeaderMarca(Icons.Outlined.Create, Color(0xFFF59E0B), Traducciones.texto("marcas.editarBtn", idioma), onEditar)
                    BotonHeaderMarca(Icons.Outlined.DeleteOutline, Color(0xFFEF4444), Traducciones.texto("marcas.eliminar", idioma), { confirmarEliminar = true })
                    BotonHeaderMarca(Icons.AutoMirrored.Outlined.ArrowBack, t.textoSecundario, Traducciones.texto("marcas.volver", idioma), onCerrar)
                }
            }
        }

        // ── Información General ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 6.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(Traducciones.texto("marcas.infoGeneral", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.weight(1f))
                    Box(
                        modifier = Modifier
                            .background(colorEstado.copy(alpha = 0.15f), RoundedCornerShape(50))
                            .border(1.dp, colorEstado.copy(alpha = 0.3f), RoundedCornerShape(50))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = if (marca.activo) Traducciones.texto("marcas.activoBadge", idioma) else Traducciones.texto("marcas.inactivoBadge", idioma),
                            color = colorEstado,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                FilaInfoMarca(Traducciones.texto("marcas.nombre", idioma), marca.nombre.ifBlank { "—" }, t)
                FilaInfoMarca(Traducciones.texto("marcas.paisOrigen", idioma), marca.paisOrigen.ifBlank { "—" }, t)
                FilaInfoMarca(Traducciones.texto("marcas.fechaCreacion", idioma), formatearFechaCreacion(marca.fechaCreacion, idioma), t)
                FilaInfoMarca(Traducciones.texto("marcas.descripcion", idioma), marca.descripcion.ifBlank { "—" }, t)
            }
        }

        // ── Estadísticas ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 6.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text(Traducciones.texto("marcas.estadisticas", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 10.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoContenido, RoundedCornerShape(10.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Category, contentDescription = null, tint = Color(0xFF8B5CF6), modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text(Traducciones.texto("marcas.estadProductos", idioma), fontSize = 11.sp, color = t.textoSecundario)
                        Text(totalProductos.toString(), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    }
                }
            }
        }
    }

    // ── Confirmación de eliminación ──
    if (confirmarEliminar) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { confirmarEliminar = false },
            title = { Text(Traducciones.texto("marcas.eliminar", idioma), fontWeight = FontWeight.Bold) },
            text = {
                Text(Traducciones.texto("marcas.confirmarEliminar", idioma) + " \"${marca.nombre}\"?")
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    confirmarEliminar = false
                    if (RepositorioOffline.eliminarMarca(context, marca.id)) {
                        onEliminar()
                    }
                }) {
                    Text(Traducciones.texto("marcas.eliminar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { confirmarEliminar = false }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun BotonHeaderMarca(icono: ImageVector, color: Color, texto: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .background(color.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .border(1.dp, color.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(5.dp))
        Text(texto, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun FilaInfoMarca(etiqueta: String, valor: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = etiqueta, color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(text = valor, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 3, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1.2f))
    }
}

private fun formatearFechaCreacion(fecha: String, idioma: Idioma): String {
    return try {
        val entrada = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
        val salida = SimpleDateFormat(
            if (idioma == Idioma.ESPANOL) "d 'de' MMMM 'de' yyyy" else "MMMM d, yyyy",
            if (idioma == Idioma.ESPANOL) Locale("es", "DO") else Locale.US
        )
        salida.format(entrada.parse(fecha) ?: return fecha.substringBefore(" "))
    } catch (e: Exception) {
        fecha.substringBefore(" ")
    }
}