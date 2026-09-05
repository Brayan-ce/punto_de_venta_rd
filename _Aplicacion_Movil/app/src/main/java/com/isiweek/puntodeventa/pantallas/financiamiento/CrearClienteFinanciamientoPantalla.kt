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
import androidx.compose.material.icons.outlined.ArrowDropDown
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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

@Composable
fun CrearClienteFinanciamientoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onVolver: () -> Unit,
    onCreado: () -> Unit
) {
    val t = TokensWeb(
        fondoPrincipal = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoElevado = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoTerciario = if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9),
        fondoContenido = if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC),
        textoPrimario = if (oscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A),
        textoSecundario = if (oscuro) Color(0xFFCBD5E1) else Color(0xFF475569),
        textoTerciario = if (oscuro) Color(0xFF94A3B8) else Color(0xFF94A3B8),
        bordeClaro = if (oscuro) Color(0xFF334155) else Color(0xFFE5E7EB),
        bordeMedio = if (oscuro) Color(0xFF475569) else Color(0xFFD1D5DB),
        primario = Color(0xFF0EA5E9),
        primarioClaro = if (oscuro) Color(0xFF0EA5E9).copy(alpha = 0.15f) else Color(0xFFE0F2FE),
        exito = Color(0xFF10B981)
    )

    var nombre by remember { mutableStateOf("") }
    var apellidos by remember { mutableStateOf("") }
    var numeroDocumento by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var direccion by remember { mutableStateOf("") }
    var sector by remember { mutableStateOf("") }
    var municipio by remember { mutableStateOf("") }
    var provincia by remember { mutableStateOf("") }
    var fechaNacimiento by remember { mutableStateOf("") }
    var tipoDocumentoId by remember { mutableIntStateOf(1) }
    var error by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            // TOPBAR: Volver
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                            .clickable(onClick = onVolver)
                            .padding(horizontal = 14.dp, vertical = 9.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(Traducciones.texto("base.volver", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            // CARD
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(t.fondoElevado, RoundedCornerShape(16.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(3.dp)
                            .background(Brush.horizontalGradient(listOf(Color(0xFF0EA5E9), Color(0xFF6366F1), Color(0xFF10B981))))
                    )

                    Column(modifier = Modifier.padding(20.dp)) {
                        // Card header
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .shadow(4.dp, RoundedCornerShape(12.dp), ambientColor = Color(0x400EA5E9), spotColor = Color(0x400EA5E9))
                                    .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(12.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Outlined.PersonAdd, contentDescription = null, tint = Color.White, modifier = Modifier.size(22.dp))
                            }
                            Spacer(Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(Traducciones.texto("clientesFin.crearTitulo", idioma), fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                                Text(Traducciones.texto("clientesFin.crearSubtitulo", idioma), fontSize = 13.sp, color = t.textoSecundario)
                            }
                        }

                        // Error
                        if (error.isNotEmpty()) {
                            Spacer(Modifier.height(16.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFFEF4444).copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                                    .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(error, color = Color(0xFFEF4444), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            }
                        }

                        Spacer(Modifier.height(20.dp))

                        // Nombre + Apellidos
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Column(modifier = Modifier.weight(1f)) {
                                LabelCampoClienteFin(Traducciones.texto("clientesFin.nombre", idioma), t)
                                CampoWeb(
                                    valor = nombre,
                                    onValor = { nombre = it; error = "" },
                                    tokens = t,
                                    placeholder = "Nombre",
                                    alto = 48,
                                    modifier = Modifier.padding(top = 6.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                LabelCampoClienteFin(Traducciones.texto("clientesFin.apellidos", idioma), t)
                                CampoWeb(
                                    valor = apellidos,
                                    onValor = { apellidos = it },
                                    tokens = t,
                                    placeholder = "Apellidos",
                                    alto = 48,
                                    modifier = Modifier.padding(top = 6.dp)
                                )
                            }
                        }

                        Spacer(Modifier.height(14.dp))

                        // Tipo de documento + NÃºmero de documento
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Column(modifier = Modifier.weight(1f)) {
                                LabelCampoClienteFin(Traducciones.texto("clientesFin.tipoDocumento", idioma), t)
                                SelectorTipoDocumento(
                                    seleccionado = tipoDocumentoId,
                                    onSeleccionar = { tipoDocumentoId = it },
                                    t = t,
                                    oscuro = oscuro,
                                    idioma = idioma
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                LabelCampoClienteFin(Traducciones.texto("clientesFin.documento", idioma), t)
                                CampoWeb(
                                    valor = numeroDocumento,
                                    onValor = { numeroDocumento = it; error = "" },
                                    tokens = t,
                                    placeholder = "000-0000000-0",
                                    alto = 48,
                                    tipoTexto = KeyboardType.Number,
                                    modifier = Modifier.padding(top = 6.dp)
                                )
                            }
                        }

                        Spacer(Modifier.height(14.dp))

                        // TelÃ©fono + Email
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Column(modifier = Modifier.weight(1f)) {
                                LabelCampoClienteFin(Traducciones.texto("clientesFin.telefono", idioma), t)
                                CampoWeb(
                                    valor = telefono,
                                    onValor = { telefono = it },
                                    tokens = t,
                                    placeholder = "809-000-0000",
                                    alto = 48,
                                    tipoTexto = KeyboardType.Number,
                                    modifier = Modifier.padding(top = 6.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                LabelCampoClienteFin(Traducciones.texto("clientesFin.email", idioma), t)
                                CampoWeb(
                                    valor = email,
                                    onValor = { email = it },
                                    tokens = t,
                                    placeholder = "correo@ejemplo.com",
                                    alto = 48,
                                    tipoTexto = KeyboardType.Email,
                                    modifier = Modifier.padding(top = 6.dp)
                                )
                            }
                        }

                        Spacer(Modifier.height(14.dp))

                        // DirecciÃ³n
                        LabelCampoClienteFin(Traducciones.texto("clientesFin.direccion", idioma), t)
                        CampoWeb(
                            valor = direccion,
                            onValor = { direccion = it },
                            tokens = t,
                            placeholder = "Calle, nÃºmero, sector...",
                            alto = 48,
                            modifier = Modifier.padding(top = 6.dp)
                        )

                        Spacer(Modifier.height(14.dp))

                        // Sector + Municipio + Provincia
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Column(modifier = Modifier.weight(1f)) {
                                LabelCampoClienteFin(Traducciones.texto("clientesFin.sector", idioma), t)
                                CampoWeb(
                                    valor = sector,
                                    onValor = { sector = it },
                                    tokens = t,
                                    placeholder = "Sector",
                                    alto = 48,
                                    modifier = Modifier.padding(top = 6.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                LabelCampoClienteFin(Traducciones.texto("clientesFin.municipio", idioma), t)
                                CampoWeb(
                                    valor = municipio,
                                    onValor = { municipio = it },
                                    tokens = t,
                                    placeholder = "Municipio",
                                    alto = 48,
                                    modifier = Modifier.padding(top = 6.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                LabelCampoClienteFin(Traducciones.texto("clientesFin.provincia", idioma), t)
                                CampoWeb(
                                    valor = provincia,
                                    onValor = { provincia = it },
                                    tokens = t,
                                    placeholder = "Provincia",
                                    alto = 48,
                                    modifier = Modifier.padding(top = 6.dp)
                                )
                            }
                        }

                        Spacer(Modifier.height(14.dp))

                        // Fecha de nacimiento
                        LabelCampoClienteFin(Traducciones.texto("clientesFin.fechaNacimiento", idioma), t)
                        CampoWeb(
                            valor = fechaNacimiento,
                            onValor = { fechaNacimiento = it },
                            tokens = t,
                            placeholder = "dd/mm/aaaa",
                            alto = 48,
                            modifier = Modifier.padding(top = 6.dp)
                        )

                        Spacer(Modifier.height(20.dp))

                        // Acciones
                        Column(
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(1.dp)
                                    .background(t.bordeClaro)
                            )
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 18.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .weight(1f)
                                        .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                                        .clickable(onClick = onVolver)
                                        .padding(vertical = 11.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(Traducciones.texto("base.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                }
                                Row(
                                    modifier = Modifier
                                        .weight(1f)
                                        .shadow(2.dp, RoundedCornerShape(9.dp), ambientColor = Color(0x400EA5E9), spotColor = Color(0x400EA5E9))
                                        .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(9.dp))
                                        .clickable {
                                            if (nombre.trim().isEmpty()) {
error = Traducciones.texto("clientesFin.nombreRequerido", idioma)
                                            } else if (numeroDocumento.trim().isEmpty()) {
                                                error = Traducciones.texto("clientesFin.numDocRequerido", idioma)
                                            } else if (email.trim().isNotEmpty() && !esEmailValido(email.trim())) {
                                                error = Traducciones.texto("clientesFin.emailInvalido", idioma)
                                            } else {
                                                if (RepositorioOffline.hayDatosOffline()) {
                                                    RepositorioOffline.guardarCliente(
                                                        com.isiweek.puntodeventa.offline.RepositorioOffline.ClienteOffline(
                                                            id = RepositorioOffline.siguienteClienteId(),
                                                            nombre = nombre.trim(),
                                                            apellidos = apellidos.trim(),
                                                            documento = numeroDocumento.trim(),
                                                            telefono = telefono.trim(),
                                                            email = email.trim(),
                                                            direccion = direccion.trim(),
                                                            cedula = numeroDocumento.trim(),
                                                            tipoDocumentoId = tipoDocumentoId,
                                                            sector = sector.trim(),
                                                            municipio = municipio.trim(),
                                                            provincia = provincia.trim(),
                                                            fechaNacimiento = fechaNacimiento.trim()
                                                        )
                                                    )
                                                }
                                                onCreado()
                                            }
                                        }
                                        .padding(vertical = 11.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Outlined.PersonAdd, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text(Traducciones.texto("clientesFin.crearCliente", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
internal fun LabelCampoClienteFin(texto: String, t: TokensWeb) {
    Text(
        texto,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        color = if (t.fondoContenido == Color(0xFF0F172A)) Color(0xFFCBD5E1) else Color(0xFF374151)
    )
}

/** Selector flotante de tipo de documento (Cédula/RNC/Pasaporte). El menú sale encima
 *  del campo (DropdownMenu) sin cambiar el tamaño de la sección, como en la web. */
@Composable
internal fun SelectorTipoDocumento(
    seleccionado: Int,
    onSeleccionar: (Int) -> Unit,
    t: TokensWeb,
    oscuro: Boolean,
    idioma: Idioma
) {
    var abierto by remember { mutableStateOf(false) }
    val opciones = listOf(
        1 to Traducciones.texto("clientesFin.cedula", idioma),
        2 to Traducciones.texto("clientesFin.tipoRnc", idioma),
        3 to Traducciones.texto("clientesFin.tipoPasaporte", idioma)
    )
    Box {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp)
                .height(48.dp)
                .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC), RoundedCornerShape(9.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(9.dp))
                .clickable { abierto = true }
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = opciones.firstOrNull { it.first == seleccionado }?.second
                    ?: Traducciones.texto("clientesFin.cedula", idioma),
                color = t.textoPrimario,
                fontSize = 14.sp,
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Icon(Icons.Outlined.ArrowDropDown, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(22.dp))
        }
        DropdownMenu(
            expanded = abierto,
            onDismissRequest = { abierto = false },
            modifier = Modifier
                .background(t.fondoElevado)
                .width(240.dp)
        ) {
            opciones.forEach { (id, nombre) ->
                DropdownMenuItem(
                    text = { Text(nombre, fontSize = 14.sp, color = t.textoPrimario) },
                    onClick = {
                        onSeleccionar(id)
                        abierto = false
                    }
                )
            }
        }
    }
}

/** Valida un email simple (igual que type="email" de la web). */
internal fun esEmailValido(email: String): Boolean {
    return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
}

