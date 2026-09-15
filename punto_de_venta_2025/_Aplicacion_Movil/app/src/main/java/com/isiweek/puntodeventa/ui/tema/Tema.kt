package com.isiweek.puntodeventa.ui.tema

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val EsquemaClaro = lightColorScheme(
    primary = AzulPrimario,
    onPrimary = ColorBlanco,
    primaryContainer = AzulPrimarioClaro,
    onPrimaryContainer = AzulPrimarioOscuro,
    secondary = AzulPrimarioOscuro,
    onSecondary = ColorBlanco,
    background = FondoContenido_Claro,
    onBackground = HeaderTexto_Claro,
    surface = HeaderFondo_Claro,
    onSurface = HeaderTexto_Claro,
    surfaceVariant = HeaderHover_Claro,
    onSurfaceVariant = HeaderTextoSub_Claro,
    outline = HeaderBorde_Claro,
    outlineVariant = HeaderBorde_Claro,
    error = Peligro
)

private val EsquemaOscuro = darkColorScheme(
    primary = AzulPrimarioClaro,
    onPrimary = HeaderTexto_Oscuro,
    primaryContainer = HeaderActivo_Oscuro,
    onPrimaryContainer = HeaderActivoTexto_Oscuro,
    secondary = HeaderActivoTexto_Oscuro,
    onSecondary = HeaderTexto_Oscuro,
    background = FondoContenido_Oscuro,
    onBackground = HeaderTexto_Oscuro,
    surface = SidebarFondo_Oscuro,
    onSurface = HeaderTexto_Oscuro,
    surfaceVariant = SidebarHover_Oscuro,
    onSurfaceVariant = HeaderTextoSub_Oscuro,
    outline = HeaderBorde_Oscuro,
    outlineVariant = SidebarBorde_Oscuro,
    error = Peligro
)

@Composable
fun TemaPuntoDeVenta(
    oscuro: Boolean = isSystemInDarkTheme(),
    colorDinamico: Boolean = false,
    contenido: @Composable () -> Unit
) {
    val esquema = when {
        colorDinamico && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val contexto = LocalContext.current
            if (oscuro) dynamicDarkColorScheme(contexto) else dynamicLightColorScheme(contexto)
        }
        oscuro -> EsquemaOscuro
        else -> EsquemaClaro
    }

    MaterialTheme(
        colorScheme = esquema,
        typography = Tipografia,
        content = contenido
    )
}