package com.isiweek.puntodeventa.pantallas.marcas

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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import org.json.JSONObject

/**
 * Formulario Nueva / Editar Marca. Réplica de las pantallas nuevo/editar de la web.
 * Guarda la marca en la base de datos local (tabla "marcas").
 */
@Composable
fun MarcaFormPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    esNuevo: Boolean,
    marcaId: Int?,
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
    val existente = remember(marcaId) { marcaId?.let { RepositorioOffline.obtenerMarcaPorId(it) } }

    var nombre by remember { mutableStateOf(existente?.nombre ?: "") }
    var paisOrigen by remember { mutableStateOf(existente?.paisOrigen ?: "") }
    var descripcion by remember { mutableStateOf(existente?.descripcion ?: "") }
    var activo by remember { mutableStateOf(existente?.activo ?: true) }

    fun guardar() {
        if (nombre.trim().isEmpty()) {
            Toast.makeText(context, Traducciones.texto("marcas.requiereNombre", idioma), Toast.LENGTH_SHORT).show()
            return
        }

        val m = JSONObject()
        if (!esNuevo && marcaId != null) m.put("id", marcaId)
        m.put("empresa_id", RepositorioOffline.obtenerEmpresa()?.id ?: 0)
        m.put("nombre", nombre.trim())
        m.put("pais_origen", paisOrigen.trim())
        m.put("descripcion", descripcion.trim())
        m.put("activo", if (activo) 1 else 0)
        RepositorioOffline.guardarMarca(context, m)
        Toast.makeText(context, Traducciones.texto("marcas.guardado", idioma), Toast.LENGTH_SHORT).show()
        onCerrar()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // ── Header ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp)
            ) {
                Text(
                    text = if (esNuevo) Traducciones.texto("marcas.nuevo", idioma) else Traducciones.texto("marcas.editar", idioma),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario
                )
                Text(
                    text = if (esNuevo) Traducciones.texto("marcas.nuevoSub", idioma) else Traducciones.texto("marcas.editarSub", idioma),
                    fontSize = 13.sp,
                    color = t.textoSecundario,
                    modifier = Modifier.padding(bottom = 10.dp)
                )
                Row(
                    modifier = Modifier
                        .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                        .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                        .clickable(onClick = onCerrar)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(Traducciones.texto("marcas.volver", idioma), color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // ── Información de la Marca ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 6.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text(Traducciones.texto("marcas.infoMarca", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 12.dp))

                Text(Traducciones.texto("marcas.nombre", idioma) + " *", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                Spacer(Modifier.height(4.dp))
                CampoMarca(nombre, { nombre = it }, t, "Ej: Coca Cola, Samsung, Nike...")
                Spacer(Modifier.height(10.dp))

                Text(Traducciones.texto("marcas.paisOrigen", idioma), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                Spacer(Modifier.height(4.dp))
                CampoMarca(paisOrigen, { paisOrigen = it }, t, "Ej: Estados Unidos, China, Alemania...")
                Spacer(Modifier.height(10.dp))

                Text(Traducciones.texto("marcas.descripcion", idioma), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                Spacer(Modifier.height(4.dp))
                CampoAreaMarca(descripcion, { descripcion = it }, t, "Describe brevemente esta marca...")
                Spacer(Modifier.height(6.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = activo,
                        onCheckedChange = { activo = it },
                        colors = CheckboxDefaults.colors(
                            checkedColor = t.primario,
                            checkmarkColor = Color.White,
                            uncheckedColor = t.bordeMedio
                        )
                    )
                    Text(Traducciones.texto("marcas.marcaActiva", idioma), color = t.textoPrimario, fontSize = 13.sp)
                }
            }
        }

        // ── Botones ──
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                        .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                        .clickable(onClick = onCerrar)
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(Traducciones.texto("marcas.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
                Box(
                    modifier = Modifier
                        .weight(1.4f)
                        .background(t.primario, RoundedCornerShape(8.dp))
                        .clickable(onClick = { guardar() })
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (esNuevo) Traducciones.texto("marcas.crear", idioma) else Traducciones.texto("marcas.actualizar", idioma),
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

@Composable
private fun CampoMarca(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
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
        if (valor.isEmpty()) {
            Text(placeholder, color = t.textoTerciario, fontSize = 13.sp)
        }
    }
}

@Composable
private fun CampoAreaMarca(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 90.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
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