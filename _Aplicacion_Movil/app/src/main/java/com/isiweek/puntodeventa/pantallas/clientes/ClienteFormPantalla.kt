package com.isiweek.puntodeventa.pantallas.clientes

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
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.KeyboardArrowDown
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
 * Formulario Nuevo / Editar Cliente. Réplica de _Pages/admin/clientes/nuevo y editar.
 * Guarda el cliente en la base de datos local (tabla "clientes").
 */
@Composable
fun ClienteFormPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    esNuevo: Boolean,
    clienteId: Long?,
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
    val existente = remember(clienteId) { clienteId?.let { RepositorioOffline.obtenerClientePorId(it) } }

    var nombre by remember { mutableStateOf(existente?.nombreCompleto?.substringBeforeLast(' ') ?: "") }
    var apellidos by remember { mutableStateOf(existente?.nombreCompleto?.substringAfterLast(' ', "") ?: "") }
    var documento by remember { mutableStateOf(existente?.documento ?: "") }
    var tipoDocIdx by remember { mutableStateOf(0) }
    var telefono by remember { mutableStateOf(existente?.telefono ?: "") }
    var email by remember { mutableStateOf("") }
    var direccion by remember { mutableStateOf("") }
    var activo by remember { mutableStateOf(existente?.activo ?: true) }

    val tiposDoc = listOf("Cedula de Identidad (CED)", "Registro Nacional de Contribuyentes (RNC)", "Pasaporte (PAS)")

    fun guardar() {
        val id = if (esNuevo) RepositorioOffline.proximoIdTabla("clientes") else (clienteId ?: 1L).toInt()
        val c = JSONObject()
        c.put("id", id)
        c.put("empresa_id", RepositorioOffline.obtenerEmpresa()?.id ?: 0)
        c.put("nombre", nombre.trim())
        c.put("apellidos", apellidos.trim())
        c.put("numero_documento", documento.trim())
        c.put("tipo_documento_id", tipoDocIdx + 1)
        c.put("telefono", telefono.trim())
        c.put("email", email.trim())
        c.put("direccion", direccion.trim())
        c.put("activo", if (activo) 1 else 0)
        RepositorioOffline.guardarCliente(context, c)
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
                    Text(if (esNuevo) "Nuevo Cliente" else "Editar Cliente", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Text(if (esNuevo) "Registro con perfil crediticio opcional" else "Actualiza la información del cliente", fontSize = 12.sp, color = t.textoSecundario)
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
                    Text("Volver", color = t.textoSecundario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // ── Información Personal ──
        item {
            SeccionCliente("Información Personal", t) {
                CampoEtiquetaCliente("Tipo de Documento *", t) {
                    SelectTipoDoc(tiposDoc, tipoDocIdx, t) { tipoDocIdx = it }
                }
                CampoEtiquetaCliente("Número de Documento *", t) {
                    CampoWeb(valor = documento, onValor = { documento = it }, tokens = t, placeholder = "001-0000000-0", alto = 40)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CampoEtiquetaCliente("Nombre *", t, Modifier.weight(1f)) {
                        CampoWeb(valor = nombre, onValor = { nombre = it }, tokens = t, placeholder = "Nombre del cliente", alto = 40)
                    }
                    CampoEtiquetaCliente("Apellidos", t, Modifier.weight(1f)) {
                        CampoWeb(valor = apellidos, onValor = { apellidos = it }, tokens = t, placeholder = "Apellidos", alto = 40)
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CampoEtiquetaCliente("Teléfono", t, Modifier.weight(1f)) {
                        CampoWeb(valor = telefono, onValor = { telefono = it }, tokens = t, placeholder = "809-000-0000", alto = 40, tipoTexto = KeyboardType.Phone)
                    }
                    CampoEtiquetaCliente("Email", t, Modifier.weight(1f)) {
                        CampoWeb(valor = email, onValor = { email = it }, tokens = t, placeholder = "ejemplo@correo.com", alto = 40)
                    }
                }
                CampoEtiquetaCliente("Dirección", t) {
                    CampoAreaCliente(direccion, { direccion = it }, t, "Dirección física completa...")
                }
                // Estado activo
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { activo = !activo }
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        Modifier.width(44.dp).height(24.dp).background(if (activo) Color(0xFF10B981) else if (oscuro) Color(0xFF475569) else Color(0xFFCBD5E1), RoundedCornerShape(50)).padding(2.dp),
                        contentAlignment = if (activo) Alignment.CenterEnd else Alignment.CenterStart
                    ) { Box(Modifier.size(20.dp).background(Color.White, RoundedCornerShape(50))) }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Estado del cliente", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario)
                        Text(if (activo) "Cliente activo en el sistema" else "Cliente inactivo", fontSize = 11.sp, color = t.textoSecundario)
                    }
                }
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
                    Text("Cancelar", color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
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
                        Text(if (esNuevo) "Crear Cliente" else "Guardar Cambios", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun SeccionCliente(titulo: String, t: TokensWeb, contenido: @Composable () -> Unit) {
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
        Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            contenido()
        }
    }
}

@Composable
private fun CampoEtiquetaCliente(etiqueta: String, t: TokensWeb, modifier: Modifier = Modifier, contenido: @Composable () -> Unit) {
    Column(modifier = modifier) {
        Text(etiqueta, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario, modifier = Modifier.padding(bottom = 6.dp))
        contenido()
    }
}

@Composable
private fun CampoAreaCliente(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 60.dp)
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

@Composable
private fun SelectTipoDoc(opciones: List<String>, seleccionIdx: Int, t: TokensWeb, onSeleccion: (Int) -> Unit) {
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
                text = opciones.getOrElse(seleccionIdx) { opciones[0] },
                color = t.textoPrimario,
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
            opciones.forEachIndexed { idx, opc ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(opc, color = t.textoPrimario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    onClick = { onSeleccion(idx); expandido = false }
                )
            }
        }
    }
}