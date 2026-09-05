package com.isiweek.puntodeventa.navegacion

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Ballot
import androidx.compose.material.icons.outlined.Category
import androidx.compose.material.icons.outlined.CorporateFare
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Handshake
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.PointOfSale
import androidx.compose.material.icons.outlined.PeopleAlt
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material.icons.outlined.Wallet
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.ui.graphics.vector.ImageVector

/**
 * Catálogo de navegación del móvil.
 * Replica la estructura de lib/navigation/catalogo.js del sistema web.
 * Cada etiqueta es una clave de Traducciones (ES/EN).
 */
object CatalogoNavegacion {

    /** Rutas (equivalencia a los href de la web) */
    object Ruta {
        const val VENDER = "vender"
        const val VENTA_RAPIDA = "venta-rapida"
        const val IMPRIMIR = "imprimir"
        const val MIS_VENTAS = "mis-ventas"
        const val PRODUCTOS = "productos"
        const val PRODUCTOS_NUEVO = "productos-nuevo"
        const val PRODUCTOS_VER = "productos-ver"
        const val PRODUCTOS_EDITAR = "productos-editar"
        const val CLIENTES = "clientes"
        const val CLIENTES_NUEVO = "clientes-nuevo"
        const val CLIENTES_EDITAR = "clientes-editar"
        const val CLIENTES_VER = "clientes-ver"
        const val INVENTARIO = "inventario"
        const val COMPRAS = "compras"
        const val COMPRAS_NUEVO = "compras-nuevo"
        const val PROVEEDORES = "proveedores"
        const val PROVEEDORES_NUEVO = "proveedores-nuevo"
        const val PROVEEDORES_EDITAR = "proveedores-editar"
        const val PROVEEDORES_VER = "proveedores-ver"
        const val COTIZACIONES = "cotizaciones"
        const val COTIZACIONES_NUEVO = "cotizaciones-nuevo"
        const val COTIZACIONES_EDITAR = "cotizaciones-editar"
        const val COTIZACIONES_VER = "cotizaciones-ver"
        const val COTIZACIONES_IMPRIMIR = "cotizaciones-imprimir"
        const val CONDUCES = "conduces"
        const val CATEGORIAS = "categorias"
        const val CATEGORIAS_NUEVO = "categorias-nuevo"
        const val CATEGORIAS_EDITAR = "categorias-editar"
        const val CATEGORIAS_VER = "categorias-ver"
        const val MARCAS = "marcas"
        const val MARCAS_NUEVO = "marcas-nuevo"
        const val MARCAS_EDITAR = "marcas-editar"
        const val MARCAS_VER = "marcas-ver"
        const val CAJAS = "cajas"
        const val GASTOS = "gastos"
        const val GASTOS_NUEVO = "gastos-nuevo"
        const val GASTOS_EDITAR = "gastos-editar"
        const val GASTOS_VER = "gastos-ver"
        const val REPORTES = "reportes"
        const val DASHBOARD = "dashboard"
        const val FINANCIAMIENTO = "dashboard-financiamiento"
        const val PRESTAMOS = "prestamos"
        const val CUOTAS = "cuotas"
        const val PAGOS_FIN = "pagos-fin"
        const val ALERTAS = "alertas"
        const val PLANES = "planes"
        const val PLANES_NUEVO = "planes-nuevo"
        const val PLANES_VER = "planes-ver"
        const val PLANES_EDITAR = "planes-editar"
        const val CONTRATO_VER = "contrato-ver"
        const val PRESTAMOS_LISTAR = "prestamos-listar"
        const val PRESTAMOS_NUEVO = "prestamos-nuevo"
        const val CONTRATO_EDITAR = "contrato-editar"
        const val CONTRATO_IMPRIMIR = "contrato-imprimir"
        const val PAGO_IMPRIMIR = "pago-imprimir"
        const val CLIENTES_FIN = "clientes-fin"
        const val CLIENTES_FIN_CREAR = "clientes-fin-crear"
        const val CLIENTES_FIN_VER = "clientes-fin-ver"
        const val CLIENTES_FIN_EDITAR = "clientes-fin-editar"
        const val CONFIGURACION = "configuracion"
        const val USUARIOS = "usuarios"
        const val USUARIOS_NUEVO = "usuarios-nuevo"
        const val USUARIOS_EDITAR = "usuarios-editar"
        const val USUARIOS_VER = "usuarios-ver"
    }

    data class ItemNavegacion(
        val ruta: String,
        val claveEtiqueta: String,
        val icono: ImageVector,
        val tipo: TipoItem = TipoItem.CONSULTA
    ) {
        enum class TipoItem { ACCION, CONSULTA, CONFIGURACION }
    }

    data class SeccionNavegacion(
        val codigo: String,
        val claveEtiqueta: String,
        val icono: ImageVector,
        val items: List<ItemNavegacion>
    )

    /**
     * Módulo principal: Punto de Venta.
     * Los íconos usan los equivalentes de los ion-icon del header web.
     */
    val PUNTO_DE_VENTA = SeccionNavegacion(
        codigo = "pos",
        claveEtiqueta = "seccion.pos",
        icono = Icons.Outlined.PointOfSale,
        items = listOf(
            ItemNavegacion(Ruta.VENDER, "item.vender", Icons.Outlined.ShoppingCart, ItemNavegacion.TipoItem.ACCION),
            ItemNavegacion(Ruta.MIS_VENTAS, "item.misVentas", Icons.Outlined.Receipt),
            ItemNavegacion(Ruta.PRODUCTOS, "item.productos", Icons.Outlined.Inventory2),
            ItemNavegacion(Ruta.CLIENTES, "item.clientes", Icons.Outlined.PeopleAlt),
            ItemNavegacion(Ruta.INVENTARIO, "item.inventario", Icons.Outlined.Category),
            ItemNavegacion(Ruta.COMPRAS, "item.compras", Icons.Outlined.ShoppingBag),
            ItemNavegacion(Ruta.PROVEEDORES, "item.proveedores", Icons.Outlined.CorporateFare),
            ItemNavegacion(Ruta.COTIZACIONES, "item.cotizaciones", Icons.Outlined.Description),
            ItemNavegacion(Ruta.CONDUCES, "item.conduces", Icons.Outlined.LocalShipping),
            ItemNavegacion(Ruta.CATEGORIAS, "item.categorias", Icons.Outlined.Category),
            ItemNavegacion(Ruta.MARCAS, "item.marcas", Icons.Outlined.LocalOffer),
            ItemNavegacion(Ruta.CAJAS, "item.cajas", Icons.Outlined.Payments),
            ItemNavegacion(Ruta.GASTOS, "item.gastos", Icons.Outlined.Wallet),
            ItemNavegacion(Ruta.DASHBOARD, "item.dashboard", Icons.Outlined.Dashboard),
            ItemNavegacion(Ruta.REPORTES, "item.reportes", Icons.Outlined.Ballot)
        )
    )

    /** Módulo de crédito (por ahora solo el acceso al sistema web Isicrub) */
    val CREDITO = SeccionNavegacion(
        codigo = "credito",
        claveEtiqueta = "seccion.credito",
        icono = Icons.Outlined.CreditCard,
        items = listOf(
            ItemNavegacion("isicrub", "item.isicrub", Icons.Outlined.Description, ItemNavegacion.TipoItem.CONFIGURACION)
        )
    )

    /** Módulo de financiamiento */
    val FINANCIAMIENTO = SeccionNavegacion(
        codigo = "financiamiento",
        claveEtiqueta = "seccion.financiamiento",
        icono = Icons.Outlined.CorporateFare,
        items = listOf(
            ItemNavegacion(Ruta.FINANCIAMIENTO, "item.dashboardFinanciamiento", Icons.Outlined.Dashboard, ItemNavegacion.TipoItem.CONSULTA),
            ItemNavegacion(Ruta.PRESTAMOS, "item.prestamos", Icons.Outlined.Handshake, ItemNavegacion.TipoItem.ACCION),
            ItemNavegacion(Ruta.CUOTAS, "item.cuotas", Icons.Outlined.Receipt),
            ItemNavegacion(Ruta.PAGOS_FIN, "item.pagos", Icons.Outlined.Payments, ItemNavegacion.TipoItem.ACCION),
            ItemNavegacion(Ruta.ALERTAS, "item.alertas", Icons.Outlined.Warning, ItemNavegacion.TipoItem.CONSULTA),
            ItemNavegacion(Ruta.PLANES, "item.planes", Icons.Outlined.Handshake, ItemNavegacion.TipoItem.CONFIGURACION),
            ItemNavegacion(Ruta.CLIENTES_FIN, "item.clientes", Icons.Outlined.PeopleAlt, ItemNavegacion.TipoItem.CONSULTA)
        )
    )

    /** Módulo de sistema */
    val SISTEMA = SeccionNavegacion(
        codigo = "core",
        claveEtiqueta = "seccion.sistema",
        icono = Icons.Outlined.Settings,
        items = listOf(
            ItemNavegacion(Ruta.USUARIOS, "item.usuarios", Icons.Outlined.PeopleAlt, ItemNavegacion.TipoItem.CONFIGURACION),
            ItemNavegacion(Ruta.CONFIGURACION, "item.configuracion", Icons.Outlined.Settings, ItemNavegacion.TipoItem.CONFIGURACION)
        )
    )

    /** Todos los módulos en orden de navegación */
    val SECCIONES: List<SeccionNavegacion> = listOf(
        PUNTO_DE_VENTA,
        CREDITO,
        FINANCIAMIENTO,
        SISTEMA
    )

    /** Ítems marcados como top en la web (para el menú superior del header) */
    val ITEMS_TOP: List<ItemNavegacion> = listOf(
        PUNTO_DE_VENTA.items.first { it.ruta == Ruta.VENDER },
        PUNTO_DE_VENTA.items.first { it.ruta == Ruta.MIS_VENTAS },
        PUNTO_DE_VENTA.items.first { it.ruta == Ruta.PRODUCTOS },
        PUNTO_DE_VENTA.items.first { it.ruta == Ruta.CLIENTES },
        PUNTO_DE_VENTA.items.first { it.ruta == Ruta.DASHBOARD }
    )

    fun obtenerItemsModulo(codigo: String): List<ItemNavegacion> {
        return SECCIONES.firstOrNull { it.codigo == codigo }?.items ?: emptyList()
    }

    fun obtenerSeccionPorRuta(ruta: String): SeccionNavegacion? {
        return SECCIONES.firstOrNull { seccion -> seccion.items.any { it.ruta == ruta } }
    }
}