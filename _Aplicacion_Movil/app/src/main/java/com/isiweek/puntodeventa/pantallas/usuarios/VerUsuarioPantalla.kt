package com.isiweek.puntodeventa.pantallas.usuarios

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
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.PeopleAlt
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
 * Pantalla Detalles del Usuario. Réplica de _Pages/admin/usuarios/ver.
 * Muestra el perfil y permisos del usuario desde la base de datos local.
 */
@Composable
fun VerUsuarioPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    usuarioId: Int?,
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

    val usuario = remember(usuarioId) { usuarioId?.let { RepositorioOffline.obtenerUsuarioPorId(it) } }

    if (usuario == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(t.fondoContenido)
                .padding(40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(Icons.Outlined.PeopleAlt, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
            Spacer(Modifier.height(8.dp))
            Text(Traducciones.texto("usuarios.noEncontrado", idioma), color = t.textoTerciario, fontSize = 14.sp)
        }
        return
    }

    val colorTipo = colorTipoUsuario(usuario.tipo)
    val colorEstado = if (usuario.activo) Color(0xFF10B981) else Color(0xFF64748B)

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
                Text(Traducciones.texto("usuarios.detalles", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(Traducciones.texto("usuarios.detallesSub", idioma), fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.padding(bottom = 10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    BotonHeaderUsuario(Icons.Outlined.Create, Color(0xFFF59E0B), Traducciones.texto("usuarios.editarBtn", idioma), onEditar)
                    BotonHeaderUsuario(Icons.Outlined.DeleteOutline, Color(0xFFEF4444), Traducciones.texto("usuarios.eliminar", idioma), { confirmarEliminar = true })
                    BotonHeaderUsuario(Icons.AutoMirrored.Outlined.ArrowBack, t.textoSecundario, Traducciones.texto("usuarios.volver", idioma), onCerrar)
                }
            }
        }

        // ── Perfil ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 6.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(colorTipo, RoundedCornerShape(50)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(usuario.nombre.firstOrNull()?.uppercase() ?: "?", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(10.dp))
                Text(usuario.nombre, color = t.textoPrimario, fontSize = 18.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(usuario.email, color = t.textoSecundario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    BadgeTipoUsuario(usuario.tipo, t, idioma)
                    Box(
                        modifier = Modifier
                            .background(colorEstado.copy(alpha = 0.12f), RoundedCornerShape(50))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = if (usuario.activo) Traducciones.texto("usuarios.activoBadge", idioma) else Traducciones.texto("usuarios.inactivoBadge", idioma),
                            color = colorEstado,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // ── Información Personal ──
        item {
            PanelVerUsuario(t, Traducciones.texto("usuarios.infoPersonal", idioma)) {
                FilaInfoUsuario(Traducciones.texto("usuarios.nombre", idioma), usuario.nombre.ifBlank { "—" }, t)
                FilaInfoUsuario(Traducciones.texto("usuarios.cedula", idioma), usuario.cedula.ifBlank { "—" }, t)
                FilaInfoUsuario(Traducciones.texto("usuarios.email", idioma), usuario.email.ifBlank { "—" }, t)
                FilaInfoUsuario(Traducciones.texto("usuarios.miembroDesde", idioma), formatearFecha(usuario.fechaCreacion, idioma), t)
            }
        }

        // ── Permisos y Acceso ──
        item {
            PanelVerUsuario(t, Traducciones.texto("usuarios.permisosAcceso", idioma)) {
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(Traducciones.texto("usuarios.tipoUsuario", idioma), color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
                    BadgeTipoUsuario(usuario.tipo, t, idioma)
                }
                FilaInfoUsuario(Traducciones.texto("usuarios.rolAsignado", idioma), usuario.rolNombre.ifBlank { Traducciones.texto("usuarios.sinRol", idioma) }, t)
            }
        }
    }

    // ── Confirmación de eliminación ──
    if (confirmarEliminar) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { confirmarEliminar = false },
            title = { Text(Traducciones.texto("usuarios.eliminar", idioma), fontWeight = FontWeight.Bold) },
            text = {
                Text(Traducciones.texto("usuarios.confirmarEliminar", idioma) + " \"${usuario.nombre}\"?")
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    confirmarEliminar = false
                    if (RepositorioOffline.eliminarUsuario(context, usuario.id)) {
                        onEliminar()
                    }
                }) {
                    Text(Traducciones.texto("usuarios.eliminar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
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
private fun BotonHeaderUsuario(icono: ImageVector, color: Color, texto: String, onClick: () -> Unit) {
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
private fun PanelVerUsuario(t: TokensWeb, titulo: String, contenido: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(titulo, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 10.dp))
        contenido()
    }
}

@Composable
private fun FilaInfoUsuario(etiqueta: String, valor: String, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = etiqueta, color = t.textoSecundario, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(text = valor, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1.2f))
    }
}

private fun formatearFecha(fecha: String, idioma: Idioma): String {
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