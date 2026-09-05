package com.isiweek.puntodeventa.pantallas.gastos

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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.Refresh
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
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/**
 * Formulario Nuevo / Editar Gasto. Réplica de las pantallas nuevo/editar de la web.
 * Requiere caja abierta para registrar (tabla "gastos"). El Número de Comprobante
 * se genera automáticamente al escribir el concepto y en editar se puede regenerar.
 */
@Composable
fun GastoFormPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    esNuevo: Boolean,
    gastoId: Int?,
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
    val existente = remember(gastoId) {
        gastoId?.let { RepositorioOffline.obtenerGastoGeneralPorId(context, it) }
    }

    val categorias = listOf(
        "Servicios Publicos", "Alquiler", "Nomina", "Mantenimiento", "Publicidad",
        "Transporte", "Suministros", "Impuestos", "Operativa", "Otros"
    )

    var concepto by remember { mutableStateOf(existente?.concepto ?: "") }
    var monto by remember { mutableStateOf(existente?.monto?.toString() ?: "") }
    var categoriaIdx by remember { mutableStateOf(categorias.indexOf(existente?.categoria)) }
    var comprobante by remember {
        mutableStateOf(
            if (esNuevo) RepositorioOffline.proximoComprobanteGasto()
            else existente?.comprobanteNumero ?: ""
        )
    }
    var notas by remember { mutableStateOf(existente?.notas ?: "") }

    fun regenerarComprobante() {
        comprobante = RepositorioOffline.proximoComprobanteGasto()
    }

    fun guardar() {
        if (esNuevo) {
            val caja = RepositorioOffline.obtenerCajaAbierta()
            if (caja == null) {
                Toast.makeText(context, Traducciones.texto("gastos.requiereCaja", idioma), Toast.LENGTH_SHORT).show()
                return
            }
        }
        if (concepto.trim().isEmpty()) {
            Toast.makeText(context, Traducciones.texto("gastos.requiereConcepto", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        val montoVal = monto.toDoubleOrNull() ?: 0.0
        if (montoVal <= 0) {
            Toast.makeText(context, Traducciones.texto("gastos.requiereMonto", idioma), Toast.LENGTH_SHORT).show()
            return
        }
        val categoria = if (categoriaIdx in categorias.indices) categorias[categoriaIdx] else ""

        val ok = if (esNuevo) {
            RepositorioOffline.guardarGastoGeneral(
                context,
                RepositorioOffline.obtenerCajaAbierta()!!.id,
                concepto.trim(), montoVal, categoria, comprobante.trim(), notas.trim()
            )
        } else {
            gastoId != null && RepositorioOffline.actualizarGastoGeneral(
                context, gastoId, concepto.trim(), montoVal, categoria, comprobante.trim(), notas.trim()
            )
        }

        if (ok) {
            Toast.makeText(context, Traducciones.texto("gastos.guardado", idioma), Toast.LENGTH_SHORT).show()
            onCerrar()
        }
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
                    text = if (esNuevo) Traducciones.texto("gastos.nuevo", idioma) else Traducciones.texto("gastos.editar", idioma),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoPrimario
                )
                Text(
                    text = if (esNuevo) Traducciones.texto("gastos.nuevoSub", idioma) else Traducciones.texto("gastos.editarSub", idioma),
                    fontSize = 13.sp,
                    color = t.textoSecundario,
                    modifier = Modifier.padding(bottom = 10.dp)
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
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
                        Text(Traducciones.texto("gastos.volver", idioma), color = t.textoPrimario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        // ── Información del Gasto ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 6.dp)
                    .background(t.fondoPrincipal, RoundedCornerShape(12.dp))
                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text(Traducciones.texto("gastos.infoGasto", idioma), fontSize = 15.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.padding(bottom = 12.dp))

                EtiquetaGasto(Traducciones.texto("gastos.concepto", idioma) + " *", t)
                Spacer(Modifier.height(4.dp))
                CampoGasto(
                    concepto,
                    {
                        concepto = it
                        if (esNuevo) regenerarComprobante()
                    },
                    t,
                    "Ej: Pago de luz, compra de papelería..."
                )
                Spacer(Modifier.height(10.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        EtiquetaGasto(Traducciones.texto("gastos.monto", idioma) + " *", t)
                        Spacer(Modifier.height(4.dp))
                        CampoMonedaGasto(monto, { monto = it }, t)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        EtiquetaGasto(Traducciones.texto("gastos.categoria", idioma), t)
                        Spacer(Modifier.height(4.dp))
                        SelectCategoriaGastoForm(categoriaIdx, t, idioma, categorias) { categoriaIdx = it }
                    }
                }
                Spacer(Modifier.height(10.dp))

                EtiquetaGasto(Traducciones.texto("gastos.comprobante", idioma), t)
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Box(modifier = Modifier.weight(1f)) {
                        CampoGasto(comprobante, { comprobante = it }, t, "GAS-000001")
                    }
                    Icon(
                        Icons.Outlined.Refresh,
                        contentDescription = null,
                        tint = t.primario,
                        modifier = Modifier
                            .size(36.dp)
                            .background(t.primarioClaro, RoundedCornerShape(8.dp))
                            .padding(6.dp)
                            .clickable(onClick = { regenerarComprobante() })
                    )
                }
                Spacer(Modifier.height(10.dp))

                EtiquetaGasto(Traducciones.texto("gastos.notas", idioma), t)
                Spacer(Modifier.height(4.dp))
                CampoAreaGasto(notas, { notas = it }, t, "Detalles adicionales...")
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
                    Text(Traducciones.texto("gastos.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
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
                        text = if (esNuevo) Traducciones.texto("gastos.registrar", idioma) else Traducciones.texto("gastos.actualizar", idioma),
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
private fun EtiquetaGasto(texto: String, t: TokensWeb) {
    Text(texto, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
}

@Composable
private fun CampoGasto(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
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
private fun CampoMonedaGasto(valor: String, onValor: (String) -> Unit, t: TokensWeb) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
            .padding(vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(RepositorioOffline.simboloMoneda(), color = t.textoSecundario, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 10.dp, end = 6.dp))
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            textStyle = TextStyle(color = t.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
            cursorBrush = SolidColor(t.primario),
            modifier = Modifier
                .weight(1f)
                .padding(end = 10.dp)
        )
    }
}

@Composable
private fun CampoAreaGasto(valor: String, onValor: (String) -> Unit, t: TokensWeb, placeholder: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 80.dp)
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
private fun SelectCategoriaGastoForm(
    seleccionIdx: Int,
    t: TokensWeb,
    idioma: Idioma,
    opciones: List<String>,
    onSeleccion: (Int) -> Unit
) {
    var expandido by remember { mutableStateOf(false) }
    val lista = listOf(Traducciones.texto("gastos.sinCategoria", idioma)) + opciones
    Box(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(40.dp)
                .background(t.fondoPrincipal, RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .clickable { expandido = true }
                .padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (seleccionIdx in opciones.indices) opciones[seleccionIdx] else lista[0],
                color = if (seleccionIdx in opciones.indices) t.textoPrimario else t.textoTerciario,
                fontSize = 13.sp,
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
            lista.forEachIndexed { idx, etiqueta ->
                androidx.compose.material3.DropdownMenuItem(
                    text = { Text(etiqueta, color = t.textoPrimario, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    onClick = { onSeleccion(idx - 1); expandido = false }
                )
            }
        }
    }
}