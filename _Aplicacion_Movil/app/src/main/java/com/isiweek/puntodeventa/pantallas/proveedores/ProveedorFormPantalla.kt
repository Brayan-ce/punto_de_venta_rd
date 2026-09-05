package com.isiweek.puntodeventa.pantallas.proveedores

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
 * Formulario Nuevo / Editar Proveedor. Réplica de _Pages/admin/proveedores/nuevo y editar.
 * Guarda el proveedor en la base de datos local (tabla "proveedores").
 */
@Composable
fun ProveedorFormPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    esNuevo: Boolean,
    proveedorId: Int?,
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
    val existente = remember(proveedorId) { proveedorId?.let { RepositorioOffline.obtenerProveedorPorId(it) } }

    var rnc by remember { mutableStateOf(existente?.rnc ?: "") }
    var nombreComercial by remember { mutableStateOf(existente?.nombreComercial ?: "") }
    var razonSocial by remember { mutableStateOf(existente?.razonSocial ?: "") }
    var actividadEconomica by remember { mutableStateOf(existente?.actividadEconomica ?: "") }
    var activo by remember { mutableStateOf(existente?.activo ?: true) }
    var contacto by remember { mutableStateOf(existente?.contacto ?: "") }
    var telefono by remember { mutableStateOf(existente?.telefono ?: "") }
    var email by remember { mutableStateOf(existente?.email ?: "") }
    var sitioWeb by remember { mutableStateOf(existente?.sitioWeb ?: "") }
    var direccion by remember { mutableStateOf(existente?.direccion ?: "") }
    var sector by remember { mutableStateOf(existente?.sector ?: "") }
    var municipio by remember { mutableStateOf(existente?.municipio ?: "") }
    var provincia by remember { mutableStateOf(existente?.provincia ?: "") }
    var condicionesPago by remember { mutableStateOf(existente?.condicionesPago ?: "") }

    fun guardar() {
        if (rnc.trim().isEmpty()) {
            Toast.makeText(context, Traducciones.texto("proveedores.requiereRnc", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        if (nombreComercial.trim().isEmpty()) {
            Toast.makeText(context, Traducciones.texto("proveedores.requiereNombre", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        if (razonSocial.trim().isEmpty()) {
            Toast.makeText(context, Traducciones.texto("proveedores.requiereRazonSocial", idioma), Toast.LENGTH_SHORT).show()
            return
        }

        val c = JSONObject()
        if (!esNuevo && proveedorId != null) c.put("id", proveedorId)
        c.put("empresa_id", RepositorioOffline.obtenerEmpresa()?.id ?: 0)
        c.put("rnc", rnc.trim())
        c.put("nombre_comercial", nombreComercial.trim())
        c.put("razon_social", razonSocial.trim())
        c.put("actividad_economica", actividadEconomica.trim())
        c.put("activo", if (activo) 1 else 0)
        c.put("contacto", contacto.trim())
        c.put("telefono", telefono.trim())
        c.put("email", email.trim())
        c.put("sitio_web", sitioWeb.trim())
        c.put("direccion", direccion.trim())
        c.put("sector", sector.trim())
        c.put("municipio", municipio.trim())
        c.put("provincia", provincia.trim())
        c.put("condiciones_pago", condicionesPago.trim())
        RepositorioOffline.guardarProveedor(context, c)
        Toast.makeText(
            context,
            Traducciones.texto("proveedores.guardado", idioma),
            Toast.LENGTH_SHORT
        ).show()
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
                    text = if (esNuevo) Traducciones.texto("proveedores.nuevo", idioma) else Traducciones.texto("proveedores.editar", idioma),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario
                )
                Text(
                    text = if (esNuevo) Traducciones.texto("proveedores.nuevoSub", idioma) else Traducciones.texto("proveedores.editarSub", idioma),
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
                    Text(Traducciones.texto("proveedores.volver", idioma), color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // ── Información Básica ──
        item {
            PanelProveedor(t, Traducciones.texto("proveedores.infoBasica", idioma)) {
                EtiquetaProveedor("RNC *", t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(rnc, { rnc = it }, t, "000000000")
                Spacer(Modifier.height(10.dp))
                EtiquetaProveedor(Traducciones.texto("proveedores.nombreComercial", idioma) + " *", t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(nombreComercial, { nombreComercial = it }, t, "Ej: Distribuidora XYZ")
                Spacer(Modifier.height(10.dp))
                EtiquetaProveedor(Traducciones.texto("proveedores.razonSocial", idioma) + " *", t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(razonSocial, { razonSocial = it }, t, "Ej: Distribuidora XYZ SRL")
                Spacer(Modifier.height(10.dp))
                EtiquetaProveedor(Traducciones.texto("proveedores.actividadEconomica", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(actividadEconomica, { actividadEconomica = it }, t, "Ej: Distribución de alimentos")
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
                    Text(Traducciones.texto("proveedores.proveedorActivo", idioma), color = t.textoPrimario, fontSize = 13.sp)
                }
            }
        }

        // ── Información de Contacto ──
        item {
            PanelProveedor(t, Traducciones.texto("proveedores.infoContacto", idioma)) {
                EtiquetaProveedor(Traducciones.texto("proveedores.personaContacto", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(contacto, { contacto = it }, t, "Ej: Juan Pérez")
                Spacer(Modifier.height(10.dp))
                EtiquetaProveedor(Traducciones.texto("proveedores.telefono", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(telefono, { telefono = it }, t, "809-000-0000")
                Spacer(Modifier.height(10.dp))
                EtiquetaProveedor(Traducciones.texto("proveedores.email", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(email, { email = it }, t, "contacto@ejemplo.com")
                Spacer(Modifier.height(10.dp))
                EtiquetaProveedor(Traducciones.texto("proveedores.sitioWeb", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(sitioWeb, { sitioWeb = it }, t, "https://ejemplo.com")
            }
        }

        // ── Ubicación ──
        item {
            PanelProveedor(t, Traducciones.texto("proveedores.ubicacion", idioma)) {
                EtiquetaProveedor(Traducciones.texto("proveedores.direccion", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(direccion, { direccion = it }, t, "Calle, número, edificio...")
                Spacer(Modifier.height(10.dp))
                EtiquetaProveedor(Traducciones.texto("proveedores.sector", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(sector, { sector = it }, t, "Ej: Naco")
                Spacer(Modifier.height(10.dp))
                EtiquetaProveedor(Traducciones.texto("proveedores.municipio", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(municipio, { municipio = it }, t, "Ej: Santo Domingo")
                Spacer(Modifier.height(10.dp))
                EtiquetaProveedor(Traducciones.texto("proveedores.provincia", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoProveedor(provincia, { provincia = it }, t, "Ej: Distrito Nacional")
            }
        }

        // ── Condiciones Comerciales ──
        item {
            PanelProveedor(t, Traducciones.texto("proveedores.condiciones", idioma)) {
                EtiquetaProveedor(Traducciones.texto("proveedores.condicionesPago", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoAreaProveedor(condicionesPago, { condicionesPago = it }, t, "Ej: Pago a 30 días, descuento por pronto pago...")
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
                    Text(Traducciones.texto("proveedores.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
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
                        text = if (esNuevo) Traducciones.texto("proveedores.crear", idioma) else Traducciones.texto("proveedores.actualizar", idioma),
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
private fun PanelProveedor(t: TokensWeb, titulo: String, contenido: @Composable () -> Unit) {
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
private fun EtiquetaProveedor(texto: String, t: TokensWeb) {
    Text(texto, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
}

@Composable
private fun CampoProveedor(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
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
private fun CampoAreaProveedor(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
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