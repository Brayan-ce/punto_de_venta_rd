package com.isiweek.puntodeventa.pantallas.financiamiento

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FlashOn
import androidx.compose.material.icons.outlined.Shield
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb

/** Etiqueta de campo estilo .label del CSS (uppercase, bold, terciario) */
@Composable
internal fun LabelPlanForm(texto: String, t: TokensWeb, opcional: Boolean = false) {
    Text(
        text = texto,
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.4.sp,
        color = if (opcional) t.textoTerciario else t.textoSecundario
    )
}

/** Hint debajo del campo, estilo .hint del CSS */
@Composable
internal fun HintPlanForm(texto: String, t: TokensWeb) {
    Text(
        text = texto,
        fontSize = 11.sp,
        color = t.textoTerciario,
        modifier = Modifier.padding(top = 2.dp)
    )
}

/** Input con sufijo (%): estilo .inputSufijo del CSS */
@Composable
internal fun CampoSufijoPlan(
    valor: String,
    onValor: (String) -> Unit,
    t: TokensWeb,
    sufijo: String,
    placeholder: String = "0.00",
    acento: Color
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(44.dp)
            .border(1.dp, t.bordeMedio, RoundedCornerShape(9.dp))
            .background(t.fondoContenido, RoundedCornerShape(9.dp))
    ) {
        CampoWeb(
            valor = valor,
            onValor = onValor,
            tokens = t,
            placeholder = placeholder,
            alto = 44,
            tipoTexto = KeyboardType.Number,
            modifier = Modifier.padding(end = 40.dp)
        )
        Text(
            text = sufijo,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = t.textoSecundario,
            modifier = Modifier.align(Alignment.CenterEnd).padding(end = 12.dp)
        )
    }
}

/** Botones de frecuencia: .frecBtn / .frecActivo del CSS */
@Composable
internal fun SelectorFrecuenciaPlan(
    frecuencia: String,
    onCambio: (String) -> Unit,
    t: TokensWeb,
    idioma: Idioma,
    acento: Color,
    oscuro: Boolean
) {
    val opciones = listOf(
        "semanal" to Traducciones.texto("planes.semanal", idioma),
        "quincenal" to Traducciones.texto("planes.quincenal", idioma),
        "mensual" to Traducciones.texto("planes.mensual", idioma)
    )
    Column(modifier = Modifier.fillMaxWidth()) {
        opciones.forEach { (clave, etiqueta) ->
            val activo = frecuencia == clave
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 3.dp)
                    .height(44.dp)
                    .background(
                        if (activo) {
                            if (oscuro) Color(0xFF022C22) else Color(0xFFF0FDF4)
                        } else t.fondoContenido,
                        RoundedCornerShape(10.dp)
                    )
                    .border(
                        1.5.dp,
                        if (activo) acento else t.bordeClaro,
                        RoundedCornerShape(10.dp)
                    )
                    .clickable { onCambio(clave) }
                    .padding(horizontal = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(16.dp)
                        .background(
                            if (activo) acento else Color.Transparent,
                            RoundedCornerShape(50)
                        )
                        .border(1.5.dp, if (activo) acento else t.bordeMedio, RoundedCornerShape(50)),
                    contentAlignment = Alignment.Center
                ) {
                    if (activo) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(Color.White, RoundedCornerShape(50))
                        )
                    }
                }
                Spacer(Modifier.width(10.dp))
                Text(
                    text = etiqueta,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (activo) {
                        if (oscuro) Color(0xFF34D399) else Color(0xFF047857)
                    } else t.textoSecundario
                )
            }
        }
    }
}

/** Tarjeta de condición (toggle): .toggleCard del CSS */
@Composable
internal fun ToggleCondicionPlan(
    titulo: String,
    descripcion: String,
    activo: Boolean,
    onToggle: () -> Unit,
    t: TokensWeb,
    oscuro: Boolean,
    acento: Color,
    iconoOn: ImageVector,
    colorOn: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
            .border(1.dp, if (oscuro) Color(0xFF1E293B) else t.bordeClaro, RoundedCornerShape(12.dp))
            .clickable { onToggle() }
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(
                    if (activo) {
                        if (oscuro) Color(0xFF022C22) else Color(0xFFD1FAE5)
                    } else if (oscuro) Color(0xFF1E293B) else Color(0xFFF1F5F9),
                    RoundedCornerShape(10.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                iconoOn,
                contentDescription = null,
                tint = if (activo) colorOn else if (oscuro) Color(0xFF475569) else Color(0xFF94A3B8),
                modifier = Modifier.size(20.dp)
            )
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(titulo, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
            Text(descripcion, fontSize = 11.sp, color = t.textoSecundario, modifier = Modifier.padding(top = 2.dp))
        }
        Spacer(Modifier.width(10.dp))
        Box(
            modifier = Modifier
                .width(42.dp)
                .height(23.dp)
                .background(if (activo) acento else Color(0xFFCBD5E1), RoundedCornerShape(50))
                .padding(horizontal = 2.5.dp),
            contentAlignment = if (activo) Alignment.CenterEnd else Alignment.CenterStart
        ) {
            Box(
                modifier = Modifier
                    .size(18.dp)
                    .background(Color.White, RoundedCornerShape(50))
            )
        }
    }
}

/** Mensaje de error: .errorMsg del CSS */
@Composable
internal fun ErrorMsgPlan(error: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(Color(0xFFFEE2E2), RoundedCornerShape(10.dp))
            .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(10.dp))
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(8.dp))
        Text(error, color = Color(0xFFDC2626), fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
    }
}