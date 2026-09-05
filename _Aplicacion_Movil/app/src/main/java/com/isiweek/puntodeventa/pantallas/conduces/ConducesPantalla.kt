package com.isiweek.puntodeventa.pantallas.conduces

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.pantallas.base.CampoFormulario
import com.isiweek.puntodeventa.pantallas.base.CrudPantalla
import com.isiweek.puntodeventa.pantallas.base.DetalleCampo
import com.isiweek.puntodeventa.pantallas.base.FilaCrud

@Composable
fun ConducesPantalla(
    idioma: Idioma,
    oscuro: Boolean
) {
    val filas = listOf(
        FilaCrud(1, "CON-0001", "Vehículo: SD-1234 · Chofer: Luis", "En tránsito", Color(0xFF3B82F6)),
        FilaCrud(2, "CON-0002", "Vehículo: SD-5678 · Chofer: Carlos", "Entregado", Color(0xFF10B981)),
        FilaCrud(3, "CON-0003", "Vehículo: SD-9012 · Chofer: Pedro", "Pendiente", Color(0xFFF59E0B))
    )

    CrudPantalla(
        idioma = idioma,
        oscuro = oscuro,
        tituloListadoClave = "item.conduces",
        subtituloListadoClave = "conduces.subtitulo",
        tituloNuevoClave = "conduces.nuevo",
        tituloEditarClave = "base.editar",
        tituloDetallesClave = "conduces.detalles",
        subtituloDetallesClave = "conduces.detallesSub",
        buscarClave = "conduces.buscar",
        icono = Icons.Outlined.LocalShipping,
        campos = listOf(
            CampoFormulario("titulo", "conduces.nombre")
        ),
        camposDetalle = listOf(
            DetalleCampo("conduces.vehiculo", "SD-1234"),
            DetalleCampo("conduces.chofer", "Luis")
        ),
        filas = filas,
        stats = listOf(
            Triple("conduces.estadTotal", "3", Color(0xFF2563EB)),
            Triple("conduces.estadEnTransito", "1", Color(0xFF3B82F6)),
            Triple("conduces.estadEntregados", "1", Color(0xFF10B981)),
            Triple("conduces.estadPendientes", "1", Color(0xFFF59E0B))
        )
    )
}