package com.isiweek.puntodeventa.pantallas.base

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Create
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Search
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * CRUD base con 3 vistas (listado / formulario / detalles) replicando el patrÃ³n
 * de las pÃ¡ginas de IsiWeek (categorias.js, marcas.js, gastos.js, etc.).
 */

enum class VistaCrud { LISTADO, FORMULARIO, DETALLES }

data class CampoFormulario(
    val clave: String,
    val etiquetaClave: String,
    val esMoneda: Boolean = false,
    val esSelect: Boolean = false,
    val opciones: List<String> = emptyList()
)

data class DetalleCampo(
    val etiquetaClave: String,
    val valor: String
)

data class FilaCrud(
    val id: Long,
    val titulo: String,
    val subtitulo: String = "",
    val etiqueta: String? = null,
    val colorEtiqueta: Color = Color(0xFF10B981),
    val monto: Double? = null
)

@Composable
fun CrudPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    tituloListadoClave: String,
    subtituloListadoClave: String,
    tituloNuevoClave: String,
    tituloEditarClave: String,
    tituloDetallesClave: String,
    subtituloDetallesClave: String,
    buscarClave: String,
    campos: List<CampoFormulario>,
    camposDetalle: List<DetalleCampo>,
    icono: ImageVector,
    filas: List<FilaCrud>,
    stats: List<Triple<String, String, Color>>,
    onGuardar: (Map<String, String>, Boolean) -> Unit = { _, _ -> }
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

    var vista by remember { mutableStateOf(VistaCrud.LISTADO) }
    var busqueda by remember { mutableStateOf("") }
    var editarId by remember { mutableStateOf<Long?>(null) }
    var detallesId by remember { mutableStateOf<Long?>(null) }
    var valoresForm by remember { mutableStateOf(mutableMapOf<String, String>()) }

    val filtradas = filas.filter {
        busqueda.isBlank() || it.titulo.contains(busqueda, ignoreCase = true) || it.subtitulo.contains(busqueda, ignoreCase = true)
    }

    fun limpiarForm() {
        valoresForm = mutableMapOf()
        editarId = null
    }

    when (vista) {
        VistaCrud.LISTADO -> {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(t.fondoContenido),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 24.dp)
            ) {
                // Header
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = Traducciones.texto(tituloListadoClave, idioma),
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = t.textoPrimario
                            )
                            Text(
                                text = Traducciones.texto(subtituloListadoClave, idioma),
                                fontSize = 13.sp,
                                color = t.textoSecundario
                            )
                        }
                        Row(
                            modifier = Modifier
                                .background(t.primario, RoundedCornerShape(8.dp))
                                .clickable {
                                    limpiarForm()
                                    vista = VistaCrud.FORMULARIO
                                }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(Traducciones.texto(tituloNuevoClave, idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // EstadÃ­sticas
                items(stats.chunked(2)) { fila ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        fila.forEach { stat ->
                            TarjetaStatCrud(stat.first, stat.second, stat.third, t, idioma, Modifier.weight(1f))
                        }
                        if (fila.size == 1) Spacer(Modifier.weight(1f))
                    }
                }

                // Buscador
                item {
                    CampoWeb(
                        valor = busqueda,
                        onValor = { busqueda = it },
                        tokens = t,
                        placeholder = Traducciones.texto(buscarClave, idioma),
                        icono = Icons.Outlined.Search,
                        alto = 38,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
                    )
                }

                // Lista de cards
                if (filtradas.isEmpty()) {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 40.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(icono, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(40.dp))
                            Spacer(Modifier.height(8.dp))
                            Text(Traducciones.texto("base.sinResultados", idioma), color = t.textoTerciario, fontSize = 14.sp)
                        }
                    }
                } else {
                    items(filtradas, key = { it.id }) { fila ->
                        CardCrud(
                            fila = fila,
                            t = t,
                            idioma = idioma,
                            onVer = {
                                detallesId = fila.id
                                vista = VistaCrud.DETALLES
                            },
                            onEditar = {
                                valoresForm = mutableMapOf("titulo" to fila.titulo, "subtitulo" to fila.subtitulo)
                                editarId = fila.id
                                vista = VistaCrud.FORMULARIO
                            }
                        )
                    }
                }
            }
        }

        VistaCrud.FORMULARIO -> {
            VistaFormularioCrud(
                titulo = if (editarId != null) Traducciones.texto(tituloEditarClave, idioma) else Traducciones.texto(tituloNuevoClave, idioma),
                campos = campos,
                valores = valoresForm,
                onValores = { valoresForm = it },
                idioma = idioma,
                t = t,
                onVolver = {
                    limpiarForm()
                    vista = VistaCrud.LISTADO
                },
                onGuardar = {
                    onGuardar(valoresForm, editarId != null)
                    limpiarForm()
                    vista = VistaCrud.LISTADO
                }
            )
        }

        VistaCrud.DETALLES -> {
            val filaSel = filas.firstOrNull { it.id == detallesId }
            VistaDetallesCrud(
                titulo = Traducciones.texto(tituloDetallesClave, idioma),
                subtitulo = Traducciones.texto(subtituloDetallesClave, idioma),
                campos = camposDetalle,
                tituloItem = filaSel?.titulo ?: "",
                idioma = idioma,
                t = t,
                onVolver = { vista = VistaCrud.LISTADO },
                onEditar = {
                    if (filaSel != null) {
                        valoresForm = mutableMapOf("titulo" to filaSel.titulo, "subtitulo" to filaSel.subtitulo)
                        editarId = filaSel.id
                        vista = VistaCrud.FORMULARIO
                    }
                }
            )
        }
    }
}

@Composable
private fun TarjetaStatCrud(
    etiqueta: String,
    valor: String,
    color: Color,
    t: TokensWeb,
    idioma: Idioma,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(t.fondoPrincipal, RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(color, RoundedCornerShape(50))
            )
            Spacer(Modifier.width(6.dp))
            Text(etiqueta, fontSize = 11.sp, color = t.textoSecundario)
        }
        Spacer(Modifier.height(6.dp))
        Text(valor, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
    }
}

@Composable
private fun CardCrud(
    fila: FilaCrud,
    t: TokensWeb,
    idioma: Idioma,
    onVer: () -> Unit,
    onEditar: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 5.dp)
            .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(fila.titulo, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (fila.subtitulo.isNotEmpty()) {
                Text(fila.subtitulo, fontSize = 12.sp, color = t.textoSecundario, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (fila.etiqueta != null) {
                Box(
                    modifier = Modifier
                        .padding(top = 4.dp)
                        .background(fila.colorEtiqueta.copy(alpha = 0.15f), RoundedCornerShape(50))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(fila.etiqueta, color = fila.colorEtiqueta, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        if (fila.monto != null) {
            Text("${RepositorioOffline.simboloMoneda()} %.2f".format(fila.monto), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(start = 8.dp))
        }
        BotonIconoCrud(Icons.Outlined.Visibility, t.primario, onVer)
        BotonIconoCrud(Icons.Outlined.Create, t.primario, onEditar)
        BotonIconoCrud(Icons.Outlined.Delete, Color(0xFFEF4444)) {}
    }
}

@Composable
private fun BotonIconoCrud(icono: ImageVector, color: Color, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .padding(start = 4.dp)
            .size(32.dp)
            .background(color.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icono, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
    }
}

@Composable
private fun VistaFormularioCrud(
    titulo: String,
    campos: List<CampoFormulario>,
    valores: Map<String, String>,
    onValores: (MutableMap<String, String>) -> Unit,
    idioma: Idioma,
    t: TokensWeb,
    onVolver: () -> Unit,
    onGuardar: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido)
    ) {
        // Header con volver
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(t.fondoElevado)
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                    .clickable(onClick = onVolver),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(titulo, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(Traducciones.texto("base.formSubtitulo", idioma), fontSize = 12.sp, color = t.textoSecundario)
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            campos.forEach { campo ->
                Text(
                    text = Traducciones.texto(campo.etiquetaClave, idioma) + (if (campo.esMoneda) "" else ""),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = t.textoSecundario,
                    modifier = Modifier.padding(top = 8.dp, bottom = 6.dp)
                )
                CampoWeb(
                    valor = valores[campo.clave] ?: "",
                    onValor = { nuevo ->
                        val m = valores.toMutableMap()
                        m[campo.clave] = nuevo
                        onValores(m)
                    },
                    tokens = t,
                    placeholder = Traducciones.texto(campo.etiquetaClave, idioma),
                    alto = 40,
                    tipoTexto = if (campo.esMoneda) androidx.compose.ui.text.input.KeyboardType.Decimal else androidx.compose.ui.text.input.KeyboardType.Text
                )
            }
        }

        Spacer(Modifier.weight(1f))

        // Botones
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(t.fondoTerciario, RoundedCornerShape(10.dp))
                    .clickable(onClick = onVolver)
                    .padding(vertical = 13.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(Traducciones.texto("base.cancelar", idioma), color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(t.primario, RoundedCornerShape(10.dp))
                    .clickable(onClick = onGuardar)
                    .padding(vertical = 13.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(Traducciones.texto("base.guardar", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun VistaDetallesCrud(
    titulo: String,
    subtitulo: String,
    campos: List<DetalleCampo>,
    tituloItem: String,
    idioma: Idioma,
    t: TokensWeb,
    onVolver: () -> Unit,
    onEditar: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(t.fondoElevado)
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                    .clickable(onClick = onVolver),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = null, tint = t.textoSecundario, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(titulo, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(subtitulo, fontSize = 12.sp, color = t.textoSecundario)
            }
            Row(
                modifier = Modifier
                    .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                    .clickable(onClick = onEditar)
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Create, contentDescription = null, tint = t.primario, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(4.dp))
                Text(Traducciones.texto("base.editar", idioma), color = t.primario, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Text(tituloItem, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
            Spacer(Modifier.height(12.dp))
            campos.forEach { campo ->
                Column(modifier = Modifier.padding(vertical = 4.dp)) {
                    Text(Traducciones.texto(campo.etiquetaClave, idioma), fontSize = 11.sp, color = t.textoTerciario)
                    Text(campo.valor, fontSize = 14.sp, color = t.textoPrimario, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}