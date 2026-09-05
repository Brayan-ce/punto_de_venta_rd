package com.isiweek.puntodeventa.header

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.R
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.navegacion.CatalogoNavegacion

/**
 * HeaderLateral: sidebar izquierdo equivalente al .sidebarDesktop de la web.
 * Ocupa el 70% del ancho de la pantalla y replica los colores exactos del CSS.
 */
@Composable
fun HeaderLateral(
    rutaActual: String,
    idioma: Idioma,
    oscuro: Boolean,
    alSeleccionar: (String) -> Unit,
    datosEmpresa: DatosEmpresaMovil? = null
) {
    val anchoPantalla = LocalConfiguration.current.screenWidthDp
    val anchoSidebar = with(LocalDensity.current) { (anchoPantalla * 0.70f).dp }

    val colorFondo = if (oscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF)      // .sidebarDesktop.dark/.light
    val colorBorde = if (oscuro) Color(0xFF1E293B) else Color(0xFFE5E7EB)      // border-right

    Column(
        modifier = Modifier
            .width(anchoSidebar)
            .fillMaxHeight()
            .statusBarsPadding()
            .background(colorFondo)
    ) {
        EncabezadoSidebar(datosEmpresa, idioma, oscuro)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(colorBorde)
                .padding(vertical = 0.5.dp)
        )
        ListaNavegacion(rutaActual, idioma, oscuro, alSeleccionar)
    }
}

/** Encabezado: logo + nombre + RNC (equivale a .sidebarHeader / .sidebarLogo) */
@Composable
private fun EncabezadoSidebar(
    datosEmpresa: DatosEmpresaMovil?,
    idioma: Idioma,
    oscuro: Boolean
) {
    val colorFondoLogo = if (oscuro) Color(0xFF1E3A8A) else Color(0xFFE0F2FE)   // .sidebarLogoDefault
    val colorLogo = if (oscuro) Color(0xFF60A5FA) else Color(0xFF0284C7)       // color ion-icon
    val colorNombre = if (oscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A)     // .sidebarNombreSistema
    val colorRnc = if (oscuro) Color(0xFF94A3B8) else Color(0xFF64748B)        // .sidebarRnc

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 16.dp, end = 12.dp, top = 16.dp, bottom = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(colorFondoLogo),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                painter = painterResource(R.drawable.logo),
                contentDescription = datosEmpresa?.nombre ?: Traducciones.texto("header.puntoDeVenta", idioma),
                tint = colorLogo,
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(Modifier.width(12.dp))
        Column {
            Text(
                text = datosEmpresa?.nombre ?: Traducciones.texto("header.puntoDeVenta", idioma),
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = colorNombre,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (datosEmpresa?.rnc != null) {
                Text(
                    text = "${Traducciones.texto("sidebar.rnc", idioma)}: ${datosEmpresa.rnc}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = colorRnc,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

/** Lista de secciones con sus ítems (equivale a .sidebarNav) */
@Composable
private fun androidx.compose.foundation.layout.ColumnScope.ListaNavegacion(
    rutaActual: String,
    idioma: Idioma,
    oscuro: Boolean,
    alSeleccionar: (String) -> Unit
) {
    val colorTituloSeccion = if (oscuro) Color(0xFF64748B) else Color(0xFF94A3B8) // .sidebarSeccionTitulo

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .weight(1f)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        CatalogoNavegacion.SECCIONES.forEach { seccion ->
            Text(
                text = Traducciones.texto(seccion.claveEtiqueta, idioma).uppercase(),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp,
                color = colorTituloSeccion,
                modifier = Modifier.padding(start = 4.dp, end = 4.dp, top = 8.dp, bottom = 4.dp)
            )

            seccion.items.forEach { item ->
                val activo = rutaActual == item.ruta
                ItemLateral(
                    icono = item.icono,
                    etiqueta = Traducciones.texto(item.claveEtiqueta, idioma),
                    activo = activo,
                    oscuro = oscuro,
                    alClic = { alSeleccionar(item.ruta) }
                )
            }
        }
        Spacer(Modifier.size(16.dp))
    }
}

/** Ítem individual (equivale a .sidebarItem / .sidebarItemActivo) */
@Composable
private fun ItemLateral(
    icono: ImageVector,
    etiqueta: String,
    activo: Boolean,
    oscuro: Boolean,
    alClic: () -> Unit
) {
    val colorTexto = if (oscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A)         // .sidebarItem
    val colorHover = if (oscuro) Color(0xFF1E293B) else Color(0xFFF1F5F9)        // hover bg
    val colorActivoFondo = if (oscuro) Color(0xFF1E3A8A) else Color(0xFFE0F2FE)  // .sidebarItemActivo bg
    val colorActivoTexto = if (oscuro) Color(0xFF60A5FA) else Color(0xFF0284C7)  // .sidebarItemActivo color
    val colorActivoBorde = colorActivoTexto                                        // border-left

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(if (activo) colorActivoFondo else colorHover.copy(alpha = 0f))
            .clickable(onClick = alClic)
            .padding(start = 14.dp, end = 14.dp, top = 12.dp, bottom = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (activo) {
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .height(20.dp)
                    .background(colorActivoBorde)
            )
        }
        Spacer(Modifier.width(if (activo) 9.dp else 0.dp))
        Icon(
            imageVector = icono,
            contentDescription = etiqueta,
            tint = if (activo) colorActivoTexto else colorTexto,
            modifier = Modifier.size(20.dp)
        )
        Spacer(Modifier.width(12.dp))
        Text(
            text = etiqueta,
            fontSize = 14.sp,
            fontWeight = if (activo) FontWeight.SemiBold else FontWeight.Medium,
            color = if (activo) colorActivoTexto else colorTexto,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

/** Datos mínimos de la empresa que el sidebar necesita mostrar */
data class DatosEmpresaMovil(
    val nombre: String,
    val rnc: String? = null,
    val logoUrl: String? = null
)