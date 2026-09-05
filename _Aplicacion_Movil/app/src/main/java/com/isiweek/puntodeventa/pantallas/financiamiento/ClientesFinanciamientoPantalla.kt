package com.isiweek.puntodeventa.pantallas.financiamiento

import android.util.Log
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.HelpOutline
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.People
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.AvisoSinBaseDatos
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

@Composable
fun ClientesFinanciamientoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onNuevoCliente: () -> Unit,
    onVerCliente: (Int) -> Unit
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

    if (!RepositorioOffline.hayDatosOffline()) {
        return Box(
            modifier = Modifier
                .fillMaxSize()
                .background(t.fondoContenido),
            contentAlignment = Alignment.Center
        ) {
            AvisoSinBaseDatos(idioma = idioma, tokens = t, oscuro = oscuro)
        }
    }

    var clientes by remember(RepositorioOffline.version) { mutableStateOf(obtenerClientesFinItemLista()) }
    Log.d("PV_OFFLINE", "CLIENTES PANTALLA: version=${RepositorioOffline.version}, hayDatosOffline=${RepositorioOffline.hayDatosOffline()}, clientesEnRepo=${RepositorioOffline.obtenerClientesFin().size}, clientesMostrados=${clientes.size}")
    var busqueda by remember { mutableStateOf("") }
    var pagina by remember { mutableStateOf(0) }
    var mostrarModalRapido by remember { mutableStateOf(false) }
    var clienteAEliminar by remember { mutableStateOf<ClienteFinItem?>(null) }

    val filtrados = clientes.filter {
        busqueda.isBlank() ||
                it.nombre.contains(busqueda, ignoreCase = true) ||
                it.documento.contains(busqueda, ignoreCase = true) ||
                it.telefono.contains(busqueda, ignoreCase = true)
    }

    val PAGE_SIZE = 17
    val totalPaginas = if (filtrados.isEmpty()) 0 else (filtrados.size + PAGE_SIZE - 1) / PAGE_SIZE
    val paginaSegura = if (totalPaginas == 0) 0 else pagina.coerceIn(0, totalPaginas - 1)
    val listaPagina = filtrados.drop(paginaSegura * PAGE_SIZE).take(PAGE_SIZE)

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
            // ══ HERO (hace scroll junto al contenido, como el web) ══
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .shadow(6.dp, RoundedCornerShape(14.dp), ambientColor = Color(0x4D0EA5E9), spotColor = Color(0x4D0EA5E9))
                                .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(14.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.People, contentDescription = null, tint = Color.White, modifier = Modifier.size(28.dp))
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = Traducciones.texto("clientesFin.titulo", idioma),
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = t.textoPrimario
                            )
                            Text(
                                text = Traducciones.texto("clientesFin.subtitulo", idioma),
                                fontSize = 13.sp,
                                color = t.textoSecundario
                            )
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        // Cliente Rápido (outline sky como el web .btnRapido)
                        Row(
                            modifier = Modifier
                                .weight(1f)
                                .background(
                                    if (oscuro) Color(0xFF0EA5E9).copy(alpha = 0.1f) else Color(0xFFF1F5F9),
                                    RoundedCornerShape(11.dp)
                                )
                                .border(
                                    1.dp,
                                    if (oscuro) Color(0xFF0EA5E9).copy(alpha = 0.25f) else Color(0xFFBAE6FD),
                                    RoundedCornerShape(11.dp)
                                )
                                .clickable { mostrarModalRapido = true }
                                .padding(horizontal = 8.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Outlined.Bolt, contentDescription = null, tint = if (oscuro) Color(0xFF38BDF8) else Color(0xFF0EA5E9), modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("clientesFin.clienteRapido", idioma), color = if (oscuro) Color(0xFF38BDF8) else Color(0xFF0EA5E9), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                        // Nuevo Cliente (gradiente sky como el web .btnBuscar)
                        Row(
                            modifier = Modifier
                                .weight(1f)
                                .shadow(2.dp, RoundedCornerShape(11.dp), ambientColor = Color(0x400EA5E9), spotColor = Color(0x400EA5E9))
                                .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(11.dp))
                                .clickable { onNuevoCliente() }
                                .padding(horizontal = 8.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Outlined.PersonAdd, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("clientesFin.nuevoCliente", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Buscador con botón Buscar (como el web)
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        CampoWeb(
                            valor = busqueda,
                            onValor = { busqueda = it; pagina = 0 },
                            tokens = t,
                            placeholder = Traducciones.texto("clientesFin.buscar", idioma),
                            icono = Icons.Outlined.Search,
                            alto = 40
                        )
                        if (busqueda.isNotEmpty()) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.CenterEnd)
                                    .padding(end = 8.dp)
                                    .size(26.dp)
                                    .background(t.fondoTerciario, CircleShape)
                                    .clickable { busqueda = ""; pagina = 0 },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .shadow(2.dp, RoundedCornerShape(10.dp), ambientColor = Color(0x400EA5E9), spotColor = Color(0x400EA5E9))
                            .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), RoundedCornerShape(10.dp))
                            .clickable { pagina = 0 }
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Search, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(Traducciones.texto("clientesFin.buscarBtn", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Contador "N clientes encontrados"
            item {
                Text(
                    text = "${filtrados.size} " + Traducciones.texto("clientesFin.encontrados", idioma),
                    fontSize = 13.sp,
                    color = t.textoSecundario,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                )
            }

            // Estado vacío (dashed como el web)
            if (listaPagina.isEmpty()) {
                item {
                    if (!RepositorioOffline.hayDatosOffline()) {
                        AvisoSinBaseDatos(idioma = idioma, tokens = t, oscuro = oscuro)
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 28.dp)
                                .border(2.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(16.dp))
                                .padding(vertical = 48.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Outlined.People, contentDescription = null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(48.dp))
                            Spacer(Modifier.height(10.dp))
                            Text(
                                if (busqueda.isNotEmpty()) Traducciones.texto("clientesFin.sinResultados", idioma)
                                else Traducciones.texto("clientesFin.sinClientes", idioma),
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = t.textoPrimario,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            } else {
                // Cards de clientes (paginadas)
                items(listaPagina, key = { it.id }) { cliente ->
                    CardClienteFin(
                        cliente = cliente,
                        t = t,
                        idioma = idioma,
                        oscuro = oscuro,
                        onVer = { onVerCliente(cliente.id) },
                        onEliminar = { clienteAEliminar = cliente }
                    )
                }
            }

            // Paginación
            if (totalPaginas > 1) {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 14.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                                .alpha(if (paginaSegura > 0) 1f else 0.35f)
                                .clickable(enabled = paginaSegura > 0) { pagina-- }
                                .padding(2.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.ChevronLeft, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
                        }
                        Text(
                            text = "${paginaSegura + 1} / $totalPaginas",
                            color = t.textoSecundario,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 12.dp)
                        )
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .border(1.dp, t.bordeClaro, RoundedCornerShape(9.dp))
                                .alpha(if (paginaSegura < totalPaginas - 1) 1f else 0.35f)
                                .clickable(enabled = paginaSegura < totalPaginas - 1) { pagina++ }
                                .padding(2.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }

    // Modal Cliente Rápido (funcional)
    if (mostrarModalRapido) {
        ModalClienteRapido(
            idioma = idioma,
            t = t,
            oscuro = oscuro,
            onCerrar = { mostrarModalRapido = false },
            onCrear = { nombre, apellidos, documento ->
                val nuevoId = (clientes.maxOfOrNull { it.id } ?: 0) + 1
                clientes = listOf(
                    ClienteFinItem(
                        id = nuevoId,
                        nombre = (nombre + " " + apellidos).trim(),
                        documento = documento,
                        telefono = "—",
                        totalContratos = 0,
                        contratosActivos = 0,
                        cuotasVencidas = 0,
                        clasificacion = null,
                        saldo = "${RepositorioOffline.simboloMoneda()} 0.00"
                    )
                ) + clientes
                if (RepositorioOffline.hayDatosOffline()) {
                    RepositorioOffline.guardarCliente(
                        RepositorioOffline.ClienteOffline(
                            id = nuevoId,
                            nombre = nombre.trim(),
                            apellidos = apellidos.trim(),
                            documento = documento.trim(),
                            telefono = "",
                            email = "",
                            direccion = "",
                            cedula = documento.trim()
                        )
                    )
                }
                mostrarModalRapido = false
            }
        )
    }

    // Modal confirmar eliminar cliente
    clienteAEliminar?.let { cliente ->
        ModalConfirmarEliminarCliente(
            cliente = cliente,
            idioma = idioma,
            t = t,
            onCancelar = { clienteAEliminar = null },
            onConfirmar = {
                clientes = clientes.filterNot { it.id == cliente.id }
                if (RepositorioOffline.hayDatosOffline()) RepositorioOffline.eliminarCliente(cliente.id)
                clienteAEliminar = null
            }
        )
    }
}

@Composable
private fun ModalConfirmarEliminarCliente(
    cliente: ClienteFinItem,
    idioma: Idioma,
    t: TokensWeb,
    onCancelar: () -> Unit,
    onConfirmar: () -> Unit
) {
    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCancelar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = true)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000))
                .clickable(onClick = onCancelar),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                    .padding(horizontal = 24.dp, vertical = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .background(Color(0xFFFEE2E2), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(28.dp))
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    text = Traducciones.texto("clientesFin.eliminarTitulo", idioma),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = t.textoPrimario
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = Traducciones.texto("clientesFin.eliminarTexto", idioma).replace("{nombre}", cliente.nombre),
                    fontSize = 14.sp,
                    color = t.textoSecundario,
                    lineHeight = 20.sp,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(22.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.fondoTerciario, RoundedCornerShape(9.dp))
                            .clickable(onClick = onCancelar)
                            .padding(vertical = 11.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("base.cancelar", idioma), color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(Color(0xFFEF4444), Color(0xFFDC2626))), RoundedCornerShape(9.dp))
                            .clickable(onClick = onConfirmar)
                            .padding(vertical = 11.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("clientesFin.eliminar", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

private data class ClienteFinItem(
    val id: Int,
    val nombre: String,
    val documento: String,
    val telefono: String,
    val totalContratos: Int,
    val contratosActivos: Int,
    val cuotasVencidas: Int,
    val clasificacion: String?,
    val saldo: String
)

private fun cf(
    id: Int,
    nombre: String,
    documento: String,
    telefono: String,
    total: Int,
    activos: Int,
    vencidas: Int,
    clase: String?
) = ClienteFinItem(id, nombre, documento, telefono, total, activos, vencidas, clase, "${RepositorioOffline.simboloMoneda()} 0.00")

/** Clientes para el listado: del JSON importado si existe, vacío si no. */
private fun obtenerClientesFinItemLista(): List<ClienteFinItem> {
    if (!RepositorioOffline.hayDatosOffline()) {
        return emptyList()
    }
    return obtenerClientesFinPantalla().map { c ->
        val cuentas = RepositorioOffline.obtenerContratos().count { it.clienteId == c.id }
        val saldo = RepositorioOffline.obtenerContratos()
            .filter { it.clienteId == c.id }
            .sumOf { it.saldoPendiente }
        ClienteFinItem(
            id = c.id,
            nombre = "${c.nombre} ${c.apellidos}".trim().ifBlank { "—" },
            documento = c.documento.ifBlank { "—" },
            telefono = c.telefono.ifBlank { "—" },
            totalContratos = cuentas,
            contratosActivos = cuentas,
            cuotasVencidas = 0,
            clasificacion = null,
            saldo = RepositorioOffline.formatoMonto(saldo)
        )
    }
}

private fun badgeEstadoCliente(c: ClienteFinItem): Triple<String, Color, ImageVector> {
    return when {
        c.cuotasVencidas > 0 || c.clasificacion == "D" -> Triple("clientesFin.enMora", Color(0xFFEF4444), Icons.Outlined.Warning)
        c.clasificacion == "A" || c.clasificacion == "B" -> Triple("clientesFin.buenPagador", Color(0xFF10B981), Icons.Outlined.CheckCircle)
        c.contratosActivos > 0 -> Triple("clientesFin.activo", Color(0xFF3B82F6), Icons.Outlined.PersonOutline)
        else -> Triple("clientesFin.sinContrato", Color(0xFF6B7280), Icons.AutoMirrored.Outlined.HelpOutline)
    }
}

private fun claseColor(c: String?): Color? = when (c) {
    "A" -> Color(0xFF10B981)
    "B" -> Color(0xFF3B82F6)
    "C" -> Color(0xFFF59E0B)
    "D" -> Color(0xFFEF4444)
    else -> null
}

@Composable
private fun CardClienteFin(
    cliente: ClienteFinItem,
    t: TokensWeb,
    idioma: Idioma,
    oscuro: Boolean,
    onVer: () -> Unit,
    onEliminar: () -> Unit
) {
    val (estadoClave, estadoColor, estadoIcono) = badgeEstadoCliente(cliente)
    val clase = claseColor(cliente.clasificacion)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 5.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(14.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        // Header: avatar + nombre + doc + estado
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(Brush.linearGradient(listOf(Color(0xFF0EA5E9), Color(0xFF0284C7))), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(cliente.nombre.take(1).uppercase(), color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(cliente.nombre, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(cliente.documento, fontSize = 11.sp, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Spacer(Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .background(estadoColor.copy(alpha = 0.12f), RoundedCornerShape(50))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(estadoIcono, contentDescription = null, tint = estadoColor, modifier = Modifier.size(11.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(Traducciones.texto(estadoClave, idioma), color = estadoColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Contacto
        DatoClienteFin(Traducciones.texto("clientesFin.contacto", idioma), cliente.telefono, t)

        // Contratos
        DatoClienteFin(
            Traducciones.texto("clientesFin.contratos", idioma),
            "${cliente.totalContratos} (${cliente.contratosActivos} ${Traducciones.texto("clientesFin.activos", idioma)})",
            t
        )

        // Cuotas vencidas + Clasificación (2 columnas)
        Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Column(modifier = Modifier.weight(1f)) {
                LabelClienteFin(Traducciones.texto("clientesFin.cuotasVencidas", idioma), t)
                Spacer(Modifier.height(4.dp))
                if (cliente.cuotasVencidas > 0) {
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFEF4444).copy(alpha = 0.12f), RoundedCornerShape(50))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text("${cliente.cuotasVencidas} ${Traducciones.texto("clientesFin.vencidas", idioma)}", color = Color(0xFFEF4444), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                } else {
                    Text("—", color = t.textoTerciario, fontSize = 13.sp)
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                LabelClienteFin(Traducciones.texto("clientesFin.clasificacion", idioma), t)
                Spacer(Modifier.height(4.dp))
                if (clase != null) {
                    Text(cliente.clasificacion ?: "—", color = clase, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold)
                } else {
                    Text("—", color = t.textoTerciario, fontSize = 13.sp)
                }
            }
        }

        // Saldo usado
        DatoClienteFin(Traducciones.texto("clientesFin.saldoUsado", idioma), cliente.saldo, t)

        Spacer(Modifier.height(12.dp))

        // Ver (outline sky como el web .btnVer)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.5.dp, if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0), RoundedCornerShape(9.dp))
                .clickable(onClick = onVer)
                .padding(vertical = 9.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.Visibility, contentDescription = null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(15.dp))
            Spacer(Modifier.width(6.dp))
            Text(Traducciones.texto("clientesFin.ver", idioma), color = Color(0xFF0EA5E9), fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(Modifier.height(8.dp))

        // Eliminar (rojo)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.5.dp, if (oscuro) Color(0xFF7F1D1D) else Color(0xFFFECACA), RoundedCornerShape(9.dp))
                .background(if (oscuro) Color(0xFF450A0A) else Color(0xFFFEF2F2), RoundedCornerShape(9.dp))
                .clickable(onClick = onEliminar)
                .padding(vertical = 9.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(15.dp))
            Spacer(Modifier.width(6.dp))
            Text(Traducciones.texto("clientesFin.eliminar", idioma), color = Color(0xFFEF4444), fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun LabelClienteFin(texto: String, t: TokensWeb) {
    Text(
        texto.uppercase(),
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.4.sp,
        color = t.textoTerciario,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
}

@Composable
private fun DatoClienteFin(label: String, valor: String, t: TokensWeb) {
    Column(modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
        LabelClienteFin(label, t)
        Spacer(Modifier.height(4.dp))
        Text(
            valor,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = t.textoPrimario,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun ModalClienteRapido(
    idioma: Idioma,
    t: TokensWeb,
    oscuro: Boolean,
    onCerrar: () -> Unit,
    onCrear: (String, String, String) -> Unit
) {
    var nombre by remember { mutableStateOf("") }
    var apellidos by remember { mutableStateOf("") }
    var documento by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCerrar,
        properties = androidx.compose.ui.window.DialogProperties(dismissOnClickOutside = true)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8C000000))
                .clickable(onClick = onCerrar),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .background(t.fondoElevado, RoundedCornerShape(16.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .background(Brush.linearGradient(listOf(Color(0xFFF59E0B), Color(0xFFF97316))), RoundedCornerShape(11.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Bolt, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = Traducciones.texto("clientesFin.clienteRapido", idioma),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = t.textoPrimario
                        )
                        Text(
                            text = Traducciones.texto("clientesFin.soloNombre", idioma),
                            fontSize = 12.sp,
                            color = t.textoTerciario
                        )
                    }
                    Box(modifier = Modifier.clickable(onClick = onCerrar).padding(6.dp)) {
                        Icon(Icons.Outlined.Close, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                    }
                }

                Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                    if (error.isNotEmpty()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(if (oscuro) Color(0xFF450A0A) else Color(0xFFFEE2E2), RoundedCornerShape(9.dp))
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.Warning, contentDescription = null, tint = if (oscuro) Color(0xFFFCA5A5) else Color(0xFF991B1B), modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(error, color = if (oscuro) Color(0xFFFCA5A5) else Color(0xFF991B1B), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    // Nombre + Apellidos
                    Row(modifier = Modifier.padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(Traducciones.texto("clientesFin.nombre", idioma), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                            CampoWeb(
                                valor = nombre,
                                onValor = { nombre = it; error = "" },
                                tokens = t,
                                placeholder = "Nombre",
                                alto = 42,
                                modifier = Modifier.padding(top = 5.dp)
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(Traducciones.texto("clientesFin.apellidos", idioma), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                            CampoWeb(
                                valor = apellidos,
                                onValor = { apellidos = it },
                                tokens = t,
                                placeholder = "Apellidos",
                                alto = 42,
                                modifier = Modifier.padding(top = 5.dp)
                            )
                        }
                    }

                    // Número de documento
                    Text(
                        Traducciones.texto("clientesFin.documento", idioma),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = t.textoSecundario,
                        modifier = Modifier.padding(top = 12.dp)
                    )
                    CampoWeb(
                        valor = documento,
                        onValor = { documento = it; error = "" },
                        tokens = t,
                        placeholder = "000-0000000-0",
                        alto = 42,
                        modifier = Modifier.padding(top = 5.dp)
                    )
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.fondoTerciario, RoundedCornerShape(10.dp))
                            .clickable(onClick = onCerrar)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(Traducciones.texto("base.cancelar", idioma), color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(Brush.linearGradient(listOf(Color(0xFFF59E0B), Color(0xFFF97316))), RoundedCornerShape(10.dp))
                            .clickable {
                                if (nombre.trim().isEmpty()) {
                                    error = Traducciones.texto("clientesFin.nombreRequerido", idioma)
                                } else if (documento.trim().isEmpty()) {
                                    error = Traducciones.texto("clientesFin.documentoRequerido", idioma)
                                } else {
                                    onCrear(nombre.trim(), apellidos.trim(), documento.trim())
                                }
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Bolt, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(Traducciones.texto("clientesFin.crearRapido", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
