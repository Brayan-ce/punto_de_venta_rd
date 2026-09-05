package com.isiweek.puntodeventa.pantallas.financiamiento

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.FolderOpen
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.Search
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
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
fun PrestamosListarPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onVolver: () -> Unit,
    onNuevo: () -> Unit,
    onVer: (Int) -> Unit,
    onEditar: (Int) -> Unit,
    onImprimir: (Int) -> Unit
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

    val contratos = remember(RepositorioOffline.version) { obtenerContratosFin() }
    var buscar by remember { mutableStateOf("") }
    var filtroEstado by remember { mutableStateOf("") }
    var filtroCategoria by remember { mutableStateOf("") }
    var colapsados by remember { mutableStateOf<Set<String>>(emptySet()) }

    val todosEstados = listOf("activo", "pagado", "incumplido", "reestructurado", "cancelado")

    val filtrados = contratos.filter { c ->
        val q = buscar.trim().lowercase()
        val nombre = (c.clienteNombre + " " + c.clienteApellidos).lowercase()
        val coincideBusqueda = q.isEmpty() || c.numero.lowercase().contains(q) || nombre.contains(q)
        val coincideEstado = filtroEstado.isEmpty() || c.estado == filtroEstado
        val catOk = when (filtroCategoria) {
            "" -> true
            "sin" -> c.categoriaId == null
            else -> c.categoriaId?.toString() == filtroCategoria
        }
        coincideBusqueda && coincideEstado && catOk
    }

    val agrupados = obtenerCategoriasFinPantalla().mapNotNull { cat ->
        val lista = filtrados.filter { it.categoriaId == cat.id }
        if (lista.isEmpty()) null else Triple(cat, lista, "cat-${cat.id}")
    } + run {
        val lista = filtrados.filter { it.categoriaId == null }
        if (lista.isEmpty()) emptyList() else listOf(Triple(null, lista, "sin-cat"))
    }

    fun colorHex(hex: String): Color = runCatching { Color(android.graphics.Color.parseColor(hex)) }.getOrDefault(Color(0xFF94A3B8))

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                            .clickable(onClick = onVolver),
                        contentAlignment = Alignment.Center
                    ) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, tint = t.textoSecundario, modifier = Modifier.size(18.dp)) }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text(Traducciones.texto("prestamos.titulo", idioma), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                        Text(
                            "${filtrados.size} " + Traducciones.texto(
                                if (filtrados.size != 1) "prestamos.contarEncontrados" else "prestamos.contarEncontrado", idioma
                            ),
                            fontSize = 12.sp, color = t.textoSecundario
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.primario, RoundedCornerShape(8.dp))
                        .clickable(onClick = onNuevo)
                        .padding(vertical = 9.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Add, null, tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(Traducciones.texto("prestamos.nuevo", idioma), color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        item {
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                        .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp)),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Search, null, tint = t.textoTerciario, modifier = Modifier.padding(start = 10.dp).size(16.dp))
                    CampoWeb(
                        valor = buscar,
                        onValor = { buscar = it },
                        tokens = t,
                        placeholder = Traducciones.texto("prestamos.buscarContrato", idioma),
                        alto = 40
                    )
                    if (buscar.isNotEmpty()) {
                        Box(Modifier.padding(end = 6.dp).clickable { buscar = "" }) { Icon(Icons.Outlined.Close, null, tint = t.textoTerciario, modifier = Modifier.size(16.dp)) }
                    }
                }
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SelectorFiltro(
                    opciones = listOf("") + todosEstados,
                    etiqueta = Traducciones.texto("prestamos.todosEstados", idioma),
                    seleccion = filtroEstado,
                    onSeleccion = { filtroEstado = it },
                    t = t,
                    modifier = Modifier.weight(1f)
                )
                SelectorFiltro(
                    opciones = listOf("") + obtenerCategoriasFinPantalla().map { it.id.toString() } + listOf("sin"),
                    etiqueta = Traducciones.texto("prestamos.todasCategorias", idioma),
                    seleccion = filtroCategoria,
                    onSeleccion = { filtroCategoria = it },
                    t = t,
                    mostrarTexto = { v ->
                        when (v) {
                            "" -> Traducciones.texto("prestamos.todasCategorias", idioma)
                            "sin" -> Traducciones.texto("prestamos.sinCategoria", idioma)
                            else -> obtenerCategoriasFinPantalla().firstOrNull { it.id.toString() == v }?.nombre ?: v
                        }
                    },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                obtenerCategoriasFinPantalla().forEach { cat ->
                    val activo = filtroCategoria == cat.id.toString()
                    val col = colorHex(cat.color)
                    Row(
                        modifier = Modifier
                            .background(if (activo) col else Color.Transparent, RoundedCornerShape(50))
                            .border(1.dp, col, RoundedCornerShape(50))
                            .clickable { filtroCategoria = if (activo) "" else cat.id.toString() }
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(Modifier.size(8.dp).background(col, CircleShape))
                        Spacer(Modifier.width(6.dp))
                        Text(cat.nombre, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = if (activo) Color.White else col)
                        Spacer(Modifier.width(6.dp))
                        Text("${cat.totalContratos}", fontSize = 10.sp, color = if (activo) Color.White.copy(alpha = 0.8f) else t.textoTerciario)
                    }
                }
            }
        }

        if (filtrados.isEmpty()) {
            item {
                if (!RepositorioOffline.hayDatosOffline()) {
                    AvisoSinBaseDatos(idioma = idioma, tokens = t, oscuro = oscuro)
                } else {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(40.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Outlined.FolderOpen, null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                        Spacer(Modifier.height(8.dp))
                        Text(Traducciones.texto("prestamos.sinResultados", idioma), fontSize = 14.sp, color = t.textoSecundario)
                    }
                }
            }
        } else {
            items(agrupados, key = { it.third }) { (cat, lista, key) ->
                val colapsado = colapsados.contains(key)
                val col = if (cat != null) colorHex(cat.color) else Color(0xFF94A3B8)
                Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp)) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
                            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
                            .clickable {
                                colapsados = if (colapsado) colapsados - key else colapsados + key
                            }
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(Modifier.size(10.dp).background(col, CircleShape))
                        Spacer(Modifier.width(8.dp))
                        Text(cat?.nombre ?: Traducciones.texto("prestamos.sinCategoria", idioma), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = col, modifier = Modifier.weight(1f))
                        Box(
                            Modifier
                                .background(col.copy(alpha = 0.15f), RoundedCornerShape(50))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) { Text("${lista.size}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = col) }
                        Icon(Icons.Outlined.KeyboardArrowDown, null, tint = t.textoTerciario, modifier = Modifier.size(18.dp))
                    }
                    if (!colapsado) {
                        Column(modifier = Modifier.fillMaxWidth().padding(top = 6.dp)) {
                            lista.forEach { c ->
                                CardContratoLista(c, t, idioma, onVer, onEditar)
                                Spacer(Modifier.height(8.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CardContratoLista(
    c: ContratoLista,
    t: TokensWeb,
    idioma: Idioma,
    onVer: (Int) -> Unit,
    onEditar: (Int) -> Unit
) {
    fun colorEstado(e: String): Color = when (e) {
        "activo" -> Color(0xFF10B981)
        "pagado" -> Color(0xFF3B82F6)
        "incumplido" -> Color(0xFFEF4444)
        "reestructurado" -> Color(0xFFF59E0B)
        else -> Color(0xFF6B7280)
    }
    val nombre = (c.clienteNombre + " " + c.clienteApellidos).trim()
    val color = colorEstado(c.estado)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(36.dp)
                    .background(t.fondoTerciario, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) { Text(nombre.take(1), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = t.primario) }
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(c.numero, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(c.fechaInicio, fontSize = 10.sp, color = t.textoTerciario)
            }
            Box(
                Modifier
                    .background(color.copy(alpha = 0.15f), RoundedCornerShape(50))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) { Text(c.estado, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = color) }
        }

        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(nombre, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario)
                Text(c.documento, fontSize = 11.sp, color = t.textoSecundario)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (c.cuotasVencidas > 0) {
                    Icon(Icons.Outlined.Warning, null, tint = Color(0xFFEF4444), modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(2.dp))
                    Text("${c.cuotasVencidas}", fontSize = 11.sp, color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(6.dp))
                }
                Text("${c.cuotasPendientes} ${Traducciones.texto("prestamos.pendAbrev", idioma)}", fontSize = 11.sp, color = t.textoTerciario)
            }
        }

        Spacer(Modifier.height(10.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            InfoContratoCard(Traducciones.texto("editarPrestamo.plan", idioma), c.plan, t, Modifier.weight(1f))
            InfoContratoCard(Traducciones.texto("editarPrestamo.financiado", idioma), c.financiado, t, Modifier.weight(1f))
            InfoContratoCard(Traducciones.texto("editarPrestamo.cuota", idioma), c.cuota, t, Modifier.weight(1f))
            InfoContratoCard(Traducciones.texto("editarPrestamo.saldo", idioma), c.saldo, t, Modifier.weight(1f))
        }

        Spacer(Modifier.height(10.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier
                    .weight(1f)
                    .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                    .clickable { onEditar(c.id) }
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Edit, null, tint = t.primario, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(5.dp))
                Text(Traducciones.texto("editarPrestamo.estadoNotas", idioma).take(4), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = t.primario)
            }
            Row(
                modifier = Modifier
                    .weight(1f)
                    .background(t.primario, RoundedCornerShape(8.dp))
                    .clickable { onVer(c.id) }
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(Traducciones.texto("prestamos.ver", idioma), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }
        }
    }
}

@Composable
private fun InfoContratoCard(label: String, valor: String, t: TokensWeb, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(t.fondoContenido, RoundedCornerShape(8.dp))
            .padding(vertical = 8.dp, horizontal = 6.dp)
    ) {
        Text(label, fontSize = 9.sp, color = t.textoTerciario)
        Spacer(Modifier.height(2.dp))
        Text(valor, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario, maxLines = 1)
    }
}

@Composable
private fun SelectorFiltro(
    opciones: List<String>,
    etiqueta: String,
    seleccion: String,
    onSeleccion: (String) -> Unit,
    t: TokensWeb,
    mostrarTexto: (String) -> String = { it },
    modifier: Modifier = Modifier
) {
    var abierto by remember { mutableStateOf(false) }
    Box(modifier = modifier) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                    .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                    .clickable { abierto = !abierto }
                    .padding(horizontal = 10.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(mostrarTexto(seleccion).ifEmpty { etiqueta }, fontSize = 12.sp, color = t.textoPrimario, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Icon(Icons.Outlined.KeyboardArrowDown, null, tint = t.textoTerciario, modifier = Modifier.size(16.dp))
            }
            if (abierto) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(t.fondoElevado, RoundedCornerShape(8.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(8.dp))
                        .padding(4.dp)
                ) {
                    opciones.forEach { op ->
                        val texto = mostrarTexto(op).ifEmpty { etiqueta }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(if (op == seleccion) t.primarioClaro else Color.Transparent, RoundedCornerShape(6.dp))
                                .clickable { onSeleccion(op); abierto = false }
                                .padding(horizontal = 10.dp, vertical = 8.dp)
                        ) { Text(texto, fontSize = 12.sp, color = if (op == seleccion) t.primario else t.textoPrimario) }
                    }
                }
            }
        }
    }
}