package com.isiweek.puntodeventa.pantallas.financiamiento

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
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Inventory
import androidx.compose.material.icons.outlined.Save
import androidx.compose.material.icons.outlined.Shield
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

private data class ActivoEditar(val id: Int?, val nombre: String, val descripcion: String, val serial: String, val valor: String)

@Composable
fun EditarPrestamoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    contratoId: Int,
    onVolver: () -> Unit,
    onGuardado: () -> Unit
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

    val contrato = remember { obtenerContratoVer(contratoId) ?: obtenerContratoVerCompartido(contratoId) }
    val estados = listOf("activo", "pagado", "incumplido", "reestructurado", "cancelado")
    var estado by remember { mutableStateOf(contrato?.estado ?: "activo") }
    var notas by remember { mutableStateOf("") }
    var nombreFiador by remember { mutableStateOf("") }
    var cedulaFiador by remember { mutableStateOf("") }
    var telefonoFiador by remember { mutableStateOf("") }
    var activos by remember { mutableStateOf(listOf<ActivoEditar>()) }

    fun colorEstado(e: String): Color = when (e) {
        "activo" -> Color(0xFF10B981)
        "pagado" -> Color(0xFF3B82F6)
        "incumplido" -> Color(0xFFEF4444)
        "reestructurado" -> Color(0xFFF59E0B)
        else -> Color(0xFF6B7280)
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.size(32.dp).background(t.fondoTerciario, RoundedCornerShape(8.dp)).clickable(onClick = onVolver),
                    contentAlignment = Alignment.Center
                ) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, tint = t.textoSecundario, modifier = Modifier.size(18.dp)) }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(Traducciones.texto("editarPrestamo.titulo", idioma) + " — ${contrato?.numero ?: ""}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Text(contrato?.cliente ?: "", fontSize = 12.sp, color = t.textoSecundario)
                }
            }
        }

        if (contrato == null) {
            item { Text(Traducciones.texto("editarPrestamo.noEncontrado", idioma), fontSize = 14.sp, color = t.textoSecundario, modifier = Modifier.padding(20.dp)) }
            return@LazyColumn
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp).background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                InfoEditar(Traducciones.texto("editarPrestamo.plan", idioma), contrato.plan, t, Modifier.weight(1f))
                InfoEditar(Traducciones.texto("editarPrestamo.financiado", idioma), contrato.financiado, t, Modifier.weight(1f))
                InfoEditar(Traducciones.texto("editarPrestamo.cuota", idioma), contrato.cuotaMensual, t, Modifier.weight(1f))
                InfoEditar(Traducciones.texto("editarPrestamo.saldo", idioma), contrato.saldoPendiente, t, Modifier.weight(1f))
            }
        }

        item {
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp).background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp)
            ) {
                Text(Traducciones.texto("editarPrestamo.estadoNotas", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Spacer(Modifier.height(4.dp))
                Text(Traducciones.texto("editarPrestamo.estadoLabel", idioma), fontSize = 11.sp, color = t.textoSecundario)
                Spacer(Modifier.height(6.dp))
                estados.chunked(3).forEach { fila ->
                    Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        fila.forEach { e ->
                            val activo = estado == e
                            Row(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(if (activo) colorEstado(e) else t.fondoTerciario, RoundedCornerShape(6.dp))
                                    .clickable { estado = e }
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                if (activo) { Icon(Icons.Outlined.Check, null, tint = Color.White, modifier = Modifier.size(14.dp)); Spacer(Modifier.width(3.dp)) }
                                Text(e, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = if (activo) Color.White else t.textoSecundario)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
                Text(Traducciones.texto("nuevoPrestamo.notas", idioma), fontSize = 11.sp, color = t.textoSecundario)
                Spacer(Modifier.height(5.dp))
                CampoWeb(valor = notas, onValor = { notas = it }, tokens = t, placeholder = Traducciones.texto("editarPrestamo.notasPlaceholder", idioma), alto = 52)
            }
        }

        item {
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp).background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Shield, null, tint = t.primario, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(Traducciones.texto("editarPrestamo.fiador", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                }
                Spacer(Modifier.height(8.dp))
                EtiquetaCampoEditar(Traducciones.texto("nuevoPrestamo.nombreCompleto", idioma), t)
                CampoWeb(valor = nombreFiador, onValor = { nombreFiador = it }, tokens = t, placeholder = "", alto = 40)
                Spacer(Modifier.height(8.dp))
                EtiquetaCampoEditar(Traducciones.texto("nuevoPrestamo.cedula", idioma), t)
                CampoWeb(valor = cedulaFiador, onValor = { cedulaFiador = it }, tokens = t, placeholder = "000-0000000-0", alto = 40)
                Spacer(Modifier.height(8.dp))
                EtiquetaCampoEditar(Traducciones.texto("nuevoPrestamo.telefono", idioma), t)
                CampoWeb(valor = telefonoFiador, onValor = { telefonoFiador = it }, tokens = t, placeholder = "809-000-0000", alto = 40)
            }
        }

        item {
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp).background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Inventory, null, tint = t.primario, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(Traducciones.texto("editarPrestamo.activos", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                }
                    Row(
                        modifier = Modifier.background(t.fondoTerciario, RoundedCornerShape(6.dp)).clickable { activos = activos + ActivoEditar(null, "", "", "", "") }.padding(horizontal = 8.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Add, null, tint = t.primario, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(3.dp))
                        Text(Traducciones.texto("editarPrestamo.agregar", idioma), fontSize = 11.sp, color = t.primario, fontWeight = FontWeight.SemiBold)
                    }
                }
                Spacer(Modifier.height(8.dp))
                if (activos.isEmpty()) {
                    Text(Traducciones.texto("editarPrestamo.sinActivos", idioma), fontSize = 12.sp, color = t.textoSecundario)
                } else {
                    activos.forEachIndexed { i, a ->
                        Column(modifier = Modifier.fillMaxWidth().background(t.fondoTerciario, RoundedCornerShape(8.dp)).padding(8.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("${Traducciones.texto("nuevoPrestamo.activo", idioma)} #${i + 1}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.weight(1f))
                                Box(Modifier.clickable { activos = activos.filterIndexed { ix, _ -> ix != i } }.padding(4.dp)) {
                                    Icon(Icons.Outlined.Delete, null, tint = Color(0xFFEF4444), modifier = Modifier.size(15.dp))
                                }
                            }
                            Spacer(Modifier.height(6.dp))
                            CampoWeb(valor = a.nombre, onValor = { v -> activos = activos.mapIndexed { ix, x -> if (ix == i) x.copy(nombre = v) else x } }, tokens = t, placeholder = "Nombre", alto = 38)
                            Spacer(Modifier.height(6.dp))
                            CampoWeb(valor = a.serial, onValor = { v -> activos = activos.mapIndexed { ix, x -> if (ix == i) x.copy(serial = v) else x } }, tokens = t, placeholder = "Serial", alto = 38)
                        }
                        Spacer(Modifier.height(8.dp))
                    }
                }
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier.weight(1f).background(t.fondoTerciario, RoundedCornerShape(8.dp)).clickable(onClick = onVolver).padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) { Text(Traducciones.texto("editarPrestamo.cancelar", idioma), color = t.textoSecundario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold) }
                Box(
                    modifier = Modifier.weight(1f).background(t.exito, RoundedCornerShape(8.dp)).clickable {
                        if (contrato != null && RepositorioOffline.hayDatosOffline()) {
                            val c = RepositorioOffline.obtenerContratos().firstOrNull { it.id == contratoId }
                            if (c != null) {
                                RepositorioOffline.guardarContrato(c.copy(estado = estado))
                            }
                        }
                        onGuardado()
                    }.padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Save, null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(5.dp))
                        Text(Traducciones.texto("editarPrestamo.guardar", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun EtiquetaCampoEditar(texto: String, t: TokensWeb) {
    Text(texto, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
    Spacer(Modifier.height(4.dp))
}

@Composable
private fun InfoEditar(label: String, valor: String, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        Text(label, fontSize = 9.sp, color = t.textoTerciario)
        Text(valor, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario, maxLines = 1)
    }
}