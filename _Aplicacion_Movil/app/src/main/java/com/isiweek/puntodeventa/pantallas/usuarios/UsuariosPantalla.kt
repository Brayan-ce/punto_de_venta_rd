package com.isiweek.puntodeventa.pantallas.usuarios

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.CorporateFare
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.HighlightOff
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.PeopleAlt
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Visibility
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
import com.isiweek.puntodeventa.offline.RepositorioOffline.UsuarioOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Pantalla Usuarios. Réplica de _Pages/admin/usuarios/usuarios.js.
 * Lee los usuarios del JSON offline con estadísticas, filtros y tabla.
 */
@Composable
fun UsuariosPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevo: () -> Unit,
    onVer: (Int) -> Unit,
    onEditar: (Int) -> Unit
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
    var busqueda by remember { mutableStateOf("") }
    var tipoFiltro by remember { mutableStateOf("") }
    var estadoFiltro by remember { mutableStateOf("") }
    var usuarioEliminar by remember { mutableStateOf<UsuarioOffline?>(null) }

    var todos by remember { mutableStateOf(RepositorioOffline.obtenerUsuarios()) }

    val filtrados = todos.filter { u ->
        val q = busqueda.trim().lowercase()
        val okBusqueda = q.isEmpty() ||
                u.nombre.lowercase().contains(q) ||
                u.cedula.lowercase().contains(q) ||
                u.email.lowercase().contains(q)
        val okTipo = tipoFiltro.isEmpty() || u.tipo == tipoFiltro
        val okEstado = when (estadoFiltro) {
            "activos" -> u.activo
            "inactivos" -> !u.activo
            else -> true
        }
        okBusqueda && okTipo && okEstado
    }

    val stats = listOf(
        EstadUsuario(Traducciones.texto("usuarios.estadTotal", idioma), todos.size.toString(), Icons.Outlined.PeopleAlt, Color(0xFF2563EB)),
        EstadUsuario(Traducciones.texto("usuarios.estadActivos", idioma), todos.count { it.activo }.toString(), Icons.Outlined.CheckCircle, Color(0xFF10B981)),
        EstadUsuario(Traducciones.texto("usuarios.estadAdmin", idioma), todos.count { it.tipo == "admin" || it.tipo == "superadmin" }.toString(), Icons.Outlined.Shield, Color(0xFF3B82F6)),
        EstadUsuario(Traducciones.texto("usuarios.estadVendedores", idioma), todos.count { it.tipo == "vendedor" }.toString(), Icons.Outlined.Person, Color(0xFF22C55E)),
        EstadUsuario(Traducciones.texto("usuarios.estadFinanciamiento", idioma), todos.count { it.tipo == "financiamiento" }.toString(), Icons.Outlined.Payments, Color(0xFF8B5CF6)),
        EstadUsuario(Traducciones.texto("usuarios.estadSucursales", idioma), todos.count { it.tipo == "sucursales" }.toString(), Icons.Outlined.CorporateFare, Color(0xFF14B8A6))
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // ── Header ──
        item { HeaderUsuarios(t, idioma, onNuevo) }

        // ── Estadísticas ──
        items(stats.chunked(2)) { fila ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { est ->
                    EstadUsuarioCard(est, t, Modifier.weight(1f))
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        // ── Controles ──
        item {
            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                CampoWeb(
                    valor = busqueda,
                    onValor = { busqueda = it },
                    tokens = t,
                    placeholder = Traducciones.texto("usuarios.buscar", idioma),
                    icono = Icons.Outlined.Search,
                    alto = 38
                )
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    SelectTipoUsuario(tipoFiltro, t, idioma, Modifier.weight(1f)) { tipoFiltro = it }
                    SelectEstadoUsuario(estadoFiltro, t, idioma, Modifier.weight(1f)) { estadoFiltro = it }
                }
            }
        }

        // ── Resultados ──
        item {
            Text(
                text = Traducciones.texto("compras.resultados", idioma) + ": ${filtrados.size}",
                fontSize = 12.sp,
                color = t.textoSecundario,
                modifier = Modifier.padding(start = 14.dp, end = 14.dp, bottom = 6.dp)
            )
        }

        if (filtrados.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 40.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Outlined.PeopleAlt, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(Traducciones.texto("usuarios.sinUsuarios", idioma), color = t.textoTerciario, fontSize = 14.sp)
                }
            }
        } else {
            item {
                TablaUsuarios(
                    usuarios = filtrados,
                    oscuro = oscuro,
                    idioma = idioma,
                    t = t,
                    onVer = { onVer(it.id) },
                    onEditar = { onEditar(it.id) },
                    onEliminar = { usuarioEliminar = it }
                )
            }
        }
    }

    // ── Confirmación de eliminación ──
    usuarioEliminar?.let { u ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { usuarioEliminar = null },
            title = { Text(Traducciones.texto("usuarios.eliminar", idioma), fontWeight = FontWeight.Bold) },
            text = {
                Text(Traducciones.texto("usuarios.confirmarEliminar", idioma) + " \"${u.nombre}\"?")
            },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    usuarioEliminar = null
                    if (RepositorioOffline.eliminarUsuario(context, u.id)) {
                        todos = RepositorioOffline.obtenerUsuarios()
                        Toast.makeText(context, Traducciones.texto("usuarios.eliminado", idioma), Toast.LENGTH_SHORT).show()
                    }
                }) {
                    Text(Traducciones.texto("usuarios.eliminar", idioma), color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { usuarioEliminar = null }) {
                    Text(Traducciones.texto("vender.cancelar", idioma))
                }
            }
        )
    }
}

// ─────────────────────── COMPONENTES ───────────────────────

private data class EstadUsuario(val etiqueta: String, val valor: String, val icono: ImageVector, val color: Color)

internal fun colorTipoUsuario(tipo: String): Color = when (tipo) {
    "admin", "superadmin" -> Color(0xFF3B82F6)
    "vendedor" -> Color(0xFF22C55E)
    "financiamiento" -> Color(0xFF8B5CF6)
    "sucursales" -> Color(0xFF14B8A6)
    else -> Color(0xFF64748B)
}

internal fun nombreTipoUsuario(tipo: String, idioma: Idioma): String = when (tipo) {
    "admin", "superadmin" -> Traducciones.texto("usuarios.tipoAdmin", idioma)
    "vendedor" -> Traducciones.texto("usuarios.tipoVendedor", idioma)
    "financiamiento" -> Traducciones.texto("usuarios.tipoFinanciamiento", idioma)
    "sucursales" -> Traducciones.texto("usuarios.tipoSucursales", idioma)
    else -> tipo
}

@Composable
private fun HeaderUsuarios(t: TokensWeb, idioma: Idioma, onNuevo: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp)
    ) {
        Text(Traducciones.texto("usuarios.titulo", idioma), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
        Text(Traducciones.texto("usuarios.subtitulo", idioma), fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.padding(bottom = 10.dp))
        Row(
            modifier = Modifier
                .background(t.primario, RoundedCornerShape(8.dp))
                .clickable(onClick = onNuevo)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.AddCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text(Traducciones.texto("usuarios.nuevo", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun EstadUsuarioCard(est: EstadUsuario, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(10.dp)
    ) {
        Icon(est.icono, contentDescription = null, tint = est.color, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(6.dp))
        Text(est.etiqueta, fontSize = 10.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(est.valor, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
    }
}

@Composable
private fun SelectTipoUsuario(
    actual: String,
    t: TokensWeb,
    idioma: Idioma,
    modifier: Modifier,
    onSeleccion: (String) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }
    val opciones = listOf(
        "" to Traducciones.texto("usuarios.todosTipos", idioma),
        "admin" to Traducciones.texto("usuarios.tipoAdmin", idioma),
        "vendedor" to Traducciones.texto("usuarios.tipoVendedor", idioma),
        "financiamiento" to Traducciones.texto("usuarios.tipoFinanciamiento", idioma),
        "sucursales" to Traducciones.texto("usuarios.tipoSucursales", idioma)
    )
    Box(modifier = modifier) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(38.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .clickable { expandido = true }
                .padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = opciones.first { it.first == actual }.second,
                color = if (actual.isEmpty()) t.textoTerciario else t.textoPrimario,
                fontSize = 12.sp,
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
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
private fun SelectEstadoUsuario(
    actual: String,
    t: TokensWeb,
    idioma: Idioma,
    modifier: Modifier,
    onSeleccion: (String) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }
    val opciones = listOf(
        "" to Traducciones.texto("usuarios.todosEstados", idioma),
        "activos" to Traducciones.texto("usuarios.activos", idioma),
        "inactivos" to Traducciones.texto("usuarios.inactivos", idioma)
    )
    Box(modifier = modifier) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(38.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .clickable { expandido = true }
                .padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = opciones.first { it.first == actual }.second,
                color = if (actual.isEmpty()) t.textoTerciario else t.textoPrimario,
                fontSize = 12.sp,
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
private fun TablaUsuarios(
    usuarios: List<UsuarioOffline>,
    oscuro: Boolean,
    idioma: Idioma,
    t: TokensWeb,
    onVer: (UsuarioOffline) -> Unit,
    onEditar: (UsuarioOffline) -> Unit,
    onEliminar: (UsuarioOffline) -> Unit
) {
    val scrollTabla = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(vertical = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(scrollTabla)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(t.fondoContenido, RoundedCornerShape(6.dp))
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(Traducciones.texto("usuarios.usuario", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(150.dp))
                Text(Traducciones.texto("usuarios.cedula", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(120.dp))
                Text(Traducciones.texto("usuarios.email", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(150.dp))
                Text(Traducciones.texto("usuarios.tipo", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(100.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text(Traducciones.texto("usuarios.rol", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text(Traducciones.texto("usuarios.estado", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(70.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                Text("Acciones", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(96.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End)
            }
            usuarios.forEach { u ->
                FilaUsuarioTabla(u, t, idioma, { onVer(u) }, { onEditar(u) }, { onEliminar(u) })
            }
        }
    }
}

@Composable
private fun FilaUsuarioTabla(
    u: UsuarioOffline,
    t: TokensWeb,
    idioma: Idioma,
    onVer: () -> Unit,
    onEditar: () -> Unit,
    onEliminar: () -> Unit
) {
    val colorTipo = colorTipoUsuario(u.tipo)
    val colorEstado = if (u.activo) Color(0xFF10B981) else Color(0xFF64748B)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 6.dp, vertical = 3.dp)
            .border(androidx.compose.foundation.BorderStroke(1.dp, t.bordeClaro), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(modifier = Modifier.width(150.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(30.dp)
                    .background(colorTipo, RoundedCornerShape(50)),
                contentAlignment = Alignment.Center
            ) { Text(u.nombre.firstOrNull()?.uppercase() ?: "?", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold) }
            Spacer(Modifier.width(6.dp))
            Text(u.nombre, color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
        }
        Text(u.cedula.ifBlank { "—" }, color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.width(120.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(u.email, color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.width(150.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
        BadgeTipoUsuario(u.tipo, t, idioma, Modifier.width(100.dp))
        Text(u.rolNombre.ifBlank { Traducciones.texto("usuarios.sinRol", idioma) }, color = t.textoSecundario, fontSize = 12.sp, modifier = Modifier.width(90.dp), textAlign = androidx.compose.ui.text.style.TextAlign.End, maxLines = 1, overflow = TextOverflow.Ellipsis)
        BadgeEstadoUsuario(u.activo, t, idioma, Modifier.width(70.dp))
        Row(modifier = Modifier.width(96.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            BotonUsuario(Icons.Outlined.Visibility, t.primario, "usuarios.ver", onVer)
            BotonUsuario(Icons.Outlined.Create, Color(0xFFF59E0B), "usuarios.editarBtn", onEditar)
            BotonUsuario(Icons.Outlined.DeleteOutline, Color(0xFFEF4444), "usuarios.eliminar", onEliminar)
        }
    }
}

@Composable
internal fun BadgeTipoUsuario(tipo: String, t: TokensWeb, idioma: Idioma, modifier: Modifier = Modifier) {
    val color = colorTipoUsuario(tipo)
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.12f), RoundedCornerShape(50))
            .padding(horizontal = 6.dp, vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(nombreTipoUsuario(tipo, idioma), color = color, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun BadgeEstadoUsuario(activo: Boolean, t: TokensWeb, idioma: Idioma, modifier: Modifier = Modifier) {
    val color = if (activo) Color(0xFF10B981) else Color(0xFF64748B)
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.12f), RoundedCornerShape(50))
            .padding(horizontal = 6.dp, vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = if (activo) Traducciones.texto("usuarios.activoBadge", idioma) else Traducciones.texto("usuarios.inactivoBadge", idioma),
            color = color,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun BotonUsuario(icono: ImageVector, color: Color, descripcion: String, onClick: () -> Unit = {}) {
    Box(
        modifier = Modifier
            .size(28.dp)
            .background(color.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icono, contentDescription = Traducciones.texto(descripcion, Idioma.ESPANOL), tint = color, modifier = Modifier.size(16.dp))
    }
}