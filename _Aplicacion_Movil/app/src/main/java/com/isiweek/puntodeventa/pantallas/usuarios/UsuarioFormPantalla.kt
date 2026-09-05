package com.isiweek.puntodeventa.pantallas.usuarios

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
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Storefront
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import org.json.JSONObject

/**
 * Formulario Nuevo / Editar Usuario. Réplica de las pantallas nuevo/editar de la web.
 * Guarda el usuario en la base de datos local (tabla "usuarios").
 */
@Composable
fun UsuarioFormPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    esNuevo: Boolean,
    usuarioId: Int?,
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
    val existente = remember(usuarioId) { usuarioId?.let { RepositorioOffline.obtenerUsuarioPorId(it) } }

    val tipos = listOf(
        TipoUsuarioCard("vendedor", Traducciones.texto("usuarios.tipoVendedor", idioma), Traducciones.texto("usuarios.tipoVendedorDesc", idioma), Icons.Outlined.Storefront, Color(0xFF22C55E)),
        TipoUsuarioCard("financiamiento", Traducciones.texto("usuarios.tipoFinanciamiento", idioma), Traducciones.texto("usuarios.tipoFinDesc", idioma), Icons.Outlined.Payments, Color(0xFF8B5CF6)),
        TipoUsuarioCard("admin", Traducciones.texto("usuarios.tipoAdmin", idioma), Traducciones.texto("usuarios.tipoAdminDesc", idioma), Icons.Outlined.Shield, Color(0xFF3B82F6))
    )
    val rolesPorTipo = mapOf(
        "vendedor" to listOf("cajero", "inventario", "vendedor"),
        "financiamiento" to listOf("financiamiento"),
        "admin" to listOf("admin")
    )

    var nombre by remember { mutableStateOf(existente?.nombre ?: "") }
    var cedula by remember { mutableStateOf(existente?.cedula ?: "") }
    var email by remember { mutableStateOf(existente?.email ?: "") }
    var password by remember { mutableStateOf("") }
    var confirmar by remember { mutableStateOf("") }
    var tipoIdx by remember { mutableStateOf(tipos.indexOfFirst { it.valor == existente?.tipo }.coerceAtLeast(0)) }
    var rolIdx by remember { mutableStateOf(0) }
    var activo by remember { mutableStateOf(existente?.activo ?: true) }

    val tipo = tipos[tipoIdx].valor
    val roles = rolesPorTipo[tipo] ?: emptyList()

    fun guardar() {
        if (nombre.trim().isEmpty()) {
            Toast.makeText(context, Traducciones.texto("usuarios.requiereNombre", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        if (cedula.trim().isEmpty()) {
            Toast.makeText(context, Traducciones.texto("usuarios.requiereCedula", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        if (email.trim().isEmpty()) {
            Toast.makeText(context, Traducciones.texto("usuarios.requiereEmail", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        if (esNuevo) {
            if (password.length < 6) {
                Toast.makeText(context, Traducciones.texto("usuarios.passwordCorta", idioma), Toast.LENGTH_SHORT).show()
                return
            }
            if (password != confirmar) {
                Toast.makeText(context, Traducciones.texto("usuarios.passwordNoCoincide", idioma), Toast.LENGTH_SHORT).show()
                return
            }
        } else if (password.isNotBlank() && password != confirmar) {
            Toast.makeText(context, Traducciones.texto("usuarios.passwordNoCoincide", idioma), Toast.LENGTH_SHORT).show()
            return
        }

        val rolNombre = roles.getOrNull(rolIdx) ?: ""
        val u = JSONObject()
        if (!esNuevo && usuarioId != null) u.put("id", usuarioId)
        u.put("empresa_id", RepositorioOffline.obtenerEmpresa()?.id ?: 0)
        u.put("nombre", nombre.trim())
        u.put("cedula", cedula.trim())
        u.put("email", email.trim())
        u.put("tipo", tipo)
        if (esNuevo) u.put("password", password) else if (password.isNotBlank()) u.put("password", password)
        u.put("activo", if (activo) 1 else 0)
        val rolId = RepositorioOffline.obtenerRolIdPorNombre(rolNombre)
        u.put("rol_id", rolId ?: JSONObject.NULL)
        RepositorioOffline.guardarUsuario(context, u)
        Toast.makeText(context, Traducciones.texto("usuarios.guardado", idioma), Toast.LENGTH_SHORT).show()
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
                    text = if (esNuevo) Traducciones.texto("usuarios.nuevo", idioma) else Traducciones.texto("usuarios.editar", idioma),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario
                )
                Text(
                    text = if (esNuevo) Traducciones.texto("usuarios.nuevoSub", idioma) else Traducciones.texto("usuarios.editarSub", idioma),
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
                    Text(Traducciones.texto("usuarios.volver", idioma), color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // ── Preview ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 6.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(14.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(colorTipoUsuario(tipo), RoundedCornerShape(50)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(nombre.firstOrNull()?.uppercase() ?: "?", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(8.dp))
                Text(nombre.ifBlank { Traducciones.texto("usuarios.nombrePreview", idioma) }, color = t.textoPrimario, fontSize = 16.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(email.ifBlank { "correo@ejemplo.com" }, color = t.textoSecundario, fontSize = 12.sp)
                Spacer(Modifier.height(6.dp))
                BadgeTipoUsuario(tipo, t, idioma)
            }
        }

        // ── Información Personal ──
        item {
            PanelUsuario(t, Traducciones.texto("usuarios.infoPersonal", idioma)) {
                EtiquetaUsuario(Traducciones.texto("usuarios.nombreCompleto", idioma) + " *", t)
                Spacer(Modifier.height(4.dp))
                CampoUsuario(nombre, { nombre = it }, t, "Ej: Juan Pérez García")
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        EtiquetaUsuario(Traducciones.texto("usuarios.cedula", idioma) + " *", t)
                        Spacer(Modifier.height(4.dp))
                        CampoUsuario(cedula, { cedula = it }, t, "001-0000000-0")
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        EtiquetaUsuario(Traducciones.texto("usuarios.email", idioma) + " *", t)
                        Spacer(Modifier.height(4.dp))
                        CampoUsuario(email, { email = it }, t, "ejemplo@correo.com")
                    }
                }
            }
        }

        // ── Contraseña ──
        item {
            PanelUsuario(t, Traducciones.texto("usuarios.contrasena", idioma)) {
                if (!esNuevo) {
                    Text(Traducciones.texto("usuarios.passwordAyuda", idioma), color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.padding(bottom = 8.dp))
                }
                EtiquetaUsuario(if (esNuevo) Traducciones.texto("usuarios.password", idioma) + " *" else Traducciones.texto("usuarios.passwordNueva", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoUsuario(password, { password = it }, t, "Mínimo 6 caracteres")
                Spacer(Modifier.height(10.dp))
                EtiquetaUsuario(Traducciones.texto("usuarios.confirmarPassword", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoUsuario(confirmar, { confirmar = it }, t, "Repite la contraseña")
            }
        }

        // ── Tipo y Permisos ──
        item {
            PanelUsuario(t, Traducciones.texto("usuarios.tipoPermisos", idioma)) {
                EtiquetaUsuario(Traducciones.texto("usuarios.tipoUsuario", idioma), t)
                Spacer(Modifier.height(6.dp))
                tipos.forEachIndexed { idx, tc ->
                    TipoCardUsuario(tc, tipoIdx == idx, t, Modifier.padding(bottom = 8.dp)) { tipoIdx = idx; rolIdx = 0 }
                }
                if (roles.isNotEmpty()) {
                    Spacer(Modifier.height(4.dp))
                    EtiquetaUsuario(Traducciones.texto("usuarios.rolPara", idioma) + " " + tipos[tipoIdx].nombre, t)
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        roles.forEachIndexed { idx, rol ->
                            RolPillUsuario(rol, rolIdx == idx, t) { rolIdx = idx }
                        }
                    }
                }
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
                    Text(Traducciones.texto("usuarios.usuarioActivo", idioma), color = t.textoPrimario, fontSize = 13.sp)
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
                    Text(Traducciones.texto("usuarios.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
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
                        text = if (esNuevo) Traducciones.texto("usuarios.crear", idioma) else Traducciones.texto("usuarios.actualizar", idioma),
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

private data class TipoUsuarioCard(val valor: String, val nombre: String, val descripcion: String, val icono: ImageVector, val color: Color)

@Composable
private fun PanelUsuario(t: TokensWeb, titulo: String, contenido: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(titulo, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 12.dp))
        contenido()
    }
}

@Composable
private fun EtiquetaUsuario(texto: String, t: TokensWeb) {
    Text(texto, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
}

@Composable
private fun CampoUsuario(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
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
private fun TipoCardUsuario(tc: TipoUsuarioCard, activo: Boolean, t: TokensWeb, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(if (activo) tc.color.copy(alpha = 0.12f) else t.fondoContenido, RoundedCornerShape(10.dp))
            .border(1.dp, if (activo) tc.color.copy(alpha = 0.5f) else t.bordeClaro, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(tc.icono, contentDescription = null, tint = tc.color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(tc.nombre, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text(tc.descripcion, color = t.textoSecundario, fontSize = 11.sp)
        }
        if (activo) {
            Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = tc.color, modifier = Modifier.size(18.dp))
        }
    }
}

@Composable
private fun RolPillUsuario(rol: String, activo: Boolean, t: TokensWeb, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .background(if (activo) t.primario.copy(alpha = 0.15f) else t.fondoContenido, RoundedCornerShape(50))
            .border(1.dp, if (activo) t.primario.copy(alpha = 0.4f) else t.bordeClaro, RoundedCornerShape(50))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 7.dp)
    ) {
        Text(rol, color = if (activo) t.primario else t.textoPrimario, fontSize = 12.sp, fontWeight = if (activo) FontWeight.Bold else FontWeight.Medium)
    }
}