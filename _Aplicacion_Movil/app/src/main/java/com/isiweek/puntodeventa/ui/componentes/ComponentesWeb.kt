package com.isiweek.puntodeventa.ui.componentes

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
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.outlined.FileUpload
import androidx.compose.material.icons.outlined.Settings
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
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones

/**
 * Design system que replica el CSS de la web (nueva.module.css).
 * Comparte los tokens de color de cada pantalla.
 */

/** Tokens de una tarjeta web (.bloqueCliente, .seccionProductos, .panelCobro) */
data class TokensWeb(
    val fondoPrincipal: Color,     // --bg-primary
    val fondoElevado: Color,       // --bg-elevated / --bg-primary
    val fondoTerciario: Color,     // --bg-tertiary
    val fondoContenido: Color,     // --bg-secondary (fondo de la página)
    val textoPrimario: Color,      // --text-primary
    val textoSecundario: Color,    // --text-secondary
    val textoTerciario: Color,     // --text-tertiary
    val bordeClaro: Color,         // --border-light
    val bordeMedio: Color,         // --border-medium
    val primario: Color,           // --primary
    val primarioClaro: Color,      // --primary-light
    val exito: Color,              // --success
)

/** Tarjeta con borde 1px y radio 12dp (.bloqueCliente / .seccionProductos / .panelCobro) */
@Composable
fun TarjetaWeb(
    tokens: TokensWeb,
    modifier: Modifier = Modifier,
    contenido: @Composable () -> Unit
) {
    Box(
        modifier = modifier
            .background(tokens.fondoElevado, RoundedCornerShape(12.dp))
            .border(1.dp, tokens.bordeClaro, RoundedCornerShape(12.dp))
    ) {
        contenido()
    }
}

/**
 * Campo de texto estilo .inputBusquedaProducto / .campoInput:
 * borde 1px --border-medium, radio 8dp, icono a la izquierda color --primary,
 * foco: border-color --primary + glow 3dp --primary-light.
 */
@Composable
fun CampoWeb(
    valor: String,
    onValor: (String) -> Unit,
    tokens: TokensWeb,
    placeholder: String,
    modifier: Modifier = Modifier,
    icono: ImageVector? = null,
    alto: Int = 32,
    tipoTexto: KeyboardType = KeyboardType.Text
) {
    var enfocado by remember { mutableStateOf(false) }

    val bordeColor = if (enfocado) tokens.primario else tokens.bordeMedio

    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(alto.dp)
            .background(tokens.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(if (enfocado) 2.dp else 1.dp, bordeColor, RoundedCornerShape(8.dp))
            .clickable { enfocado = true }
            .padding(start = if (icono != null) 12.dp else 10.dp, end = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (icono != null) {
            Icon(
                imageVector = icono,
                contentDescription = null,
                tint = tokens.primario,
                modifier = Modifier.size(16.dp)
            )
            Spacer(Modifier.width(8.dp))
        }
        Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
            BasicTextField(
                value = valor,
                onValueChange = onValor,
                singleLine = true,
                textStyle = TextStyle(color = tokens.textoPrimario, fontSize = 14.sp),
                cursorBrush = androidx.compose.ui.graphics.SolidColor(tokens.primario),
                keyboardOptions = KeyboardOptions(keyboardType = tipoTexto),
                modifier = Modifier.fillMaxWidth()
            )
            if (valor.isEmpty()) {
                Text(
                    text = placeholder,
                    color = tokens.textoTerciario,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
            }
        }
    }
}

/** Botón estilo .btnAgregarExtra (borde dashed ámbar + fondo warning-light) */
@Composable
fun BotonAgregarExtra(
    texto: String,
    icono: ImageVector,
    tokens: TokensWeb,
    colorAmbar: Color,
    colorAmbarFondo: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .background(colorAmbarFondo, RoundedCornerShape(8.dp))
            .border(1.dp, colorAmbar, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = colorAmbar, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(text = texto, color = colorAmbar, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

/** Botón método de pago estilo .metodoPagoBtn con colores de cada método */
@Composable
fun BotonMetodoPago(
    icono: ImageVector,
    etiqueta: String,
    colorMetodoBorde: Color,
    colorMetodoFondo: Color,
    colorMetodoTexto: Color,
    seleccionado: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val borde = if (seleccionado) 2.dp else 1.dp

    Column(
        modifier = modifier
            .height(56.dp)
            .background(colorMetodoFondo, RoundedCornerShape(8.dp))
            .border(borde, colorMetodoBorde, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center
    ) {
        Icon(icono, contentDescription = null, tint = colorMetodoTexto, modifier = Modifier.size(18.dp))
        Spacer(Modifier.height(4.dp))
        Text(
            text = etiqueta,
            color = colorMetodoTexto,
            fontSize = 10.sp,
            fontWeight = if (seleccionado) FontWeight.Bold else FontWeight.SemiBold,
            maxLines = 1
        )
    }
}

/** Campo moneda estilo .inputMonedaResumen (span RD$ + input) */
@Composable
fun CampoMoneda(
    valor: String,
    onValor: (String) -> Unit,
    tokens: TokensWeb,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(tokens.fondoPrincipal, RoundedCornerShape(8.dp))
            .border(1.dp, tokens.bordeMedio, RoundedCornerShape(8.dp))
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = RepositorioOffline.simboloMoneda(),
            color = tokens.textoSecundario,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(start = 10.dp, end = 6.dp)
        )
        BasicTextField(
            value = valor,
            onValueChange = onValor,
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            textStyle = TextStyle(color = tokens.textoPrimario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
            cursorBrush = androidx.compose.ui.graphics.SolidColor(tokens.primario),
            modifier = Modifier
                .weight(1f)
                .padding(end = 10.dp)
        )
    }
}

/** Botón .btnProcesar (fondo --success, blanco, radius 8) */
@Composable
fun BotonProcesar(
    texto: String,
    icono: ImageVector,
    tokens: TokensWeb,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(tokens.exito, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(6.dp))
        Text(text = texto, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

/** Aviso cuando no se ha iniciado sesión / importado datos para trabajar offline. */
@Composable
fun AvisoSinBaseDatos(
    idioma: Idioma,
    tokens: TokensWeb,
    oscuro: Boolean,
    modifier: Modifier = Modifier,
    onConfigurar: (() -> Unit)? = null
) {
    val hayDatos = RepositorioOffline.hayDatosOffline()
    val estadoColor = if (hayDatos) Color(0xFF10B981) else Color(0xFFF59E0B)
    val estadoTexto = if (hayDatos) Traducciones.texto("config.modoOffline", idioma) else Traducciones.texto("offline.sinDatos", idioma)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 28.dp)
            .border(2.dp, if (oscuro) Color(0xFF475569) else Color(0xFFE2E8F0), RoundedCornerShape(16.dp))
            .padding(horizontal = 20.dp, vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(Icons.Outlined.CloudOff, contentDescription = null, tint = tokens.primario, modifier = Modifier.size(44.dp))
        Spacer(Modifier.height(12.dp))

        Row(
            modifier = Modifier
                .background(estadoColor.copy(alpha = 0.15f), RoundedCornerShape(50))
                .padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(estadoColor, RoundedCornerShape(50))
            )
            Spacer(Modifier.width(6.dp))
            Text(estadoTexto, color = estadoColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(Modifier.height(12.dp))
        Text(
            Traducciones.texto("offline.iniciaSesion", idioma),
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = tokens.textoPrimario,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(6.dp))
        Text(
            Traducciones.texto("offline.iniciaSesionDetalle", idioma),
            fontSize = 12.sp,
            color = tokens.textoSecundario,
            textAlign = TextAlign.Center
        )
        if (onConfigurar != null) {
            Spacer(Modifier.height(16.dp))
            Row(
                modifier = Modifier
                    .background(tokens.primario, RoundedCornerShape(10.dp))
                    .clickable(onClick = onConfigurar)
                    .padding(horizontal = 18.dp, vertical = 11.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Settings, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text(Traducciones.texto("offline.irConfiguracion", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}