package com.isiweek.puntodeventa

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import com.isiweek.puntodeventa.header.HeaderLateral
import com.isiweek.puntodeventa.header.HeaderTop
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.navegacion.CatalogoNavegacion
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.pantallas.cajas.CajasPantalla
import com.isiweek.puntodeventa.pantallas.categorias.CategoriasPantalla
import com.isiweek.puntodeventa.pantallas.categorias.CategoriaFormPantalla
import com.isiweek.puntodeventa.pantallas.categorias.VerCategoriaPantalla
import com.isiweek.puntodeventa.pantallas.clientes.ClientesPantalla
import com.isiweek.puntodeventa.pantallas.clientes.ClienteFormPantalla
import com.isiweek.puntodeventa.pantallas.clientes.VerClientePantalla
import com.isiweek.puntodeventa.pantallas.compras.ComprasPantalla
import com.isiweek.puntodeventa.pantallas.compras.NuevaCompraPantalla
import com.isiweek.puntodeventa.pantallas.configuracion.ConfiguracionPantalla
import com.isiweek.puntodeventa.pantallas.conduces.ConducesPantalla
import com.isiweek.puntodeventa.pantallas.cotizaciones.CotizacionesPantalla
import com.isiweek.puntodeventa.pantallas.cotizaciones.CotizacionFormPantalla
import com.isiweek.puntodeventa.pantallas.cotizaciones.ImprimirCotizacionPantalla
import com.isiweek.puntodeventa.pantallas.cotizaciones.VerCotizacionPantalla
import com.isiweek.puntodeventa.pantallas.dashboard.DashboardPantalla
import com.isiweek.puntodeventa.pantallas.isicrub.IsicrubPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.AlertasPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.ClientesFinanciamientoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.CrearClienteFinanciamientoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.CuotasPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.DashboardFinancieroPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.EditarClienteFinanciamientoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.EditarPlanFinanciamientoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.NuevoPlanFinanciamientoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.PagosPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.PlanesPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.PrestamosPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.PrestamosListarPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.NuevoPrestamoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.EditarPrestamoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.ImprimirContratoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.ImprimirPagoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.DatosReciboPago
import com.isiweek.puntodeventa.pantallas.financiamiento.VerClienteFinanciamientoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.VerContratoFinanciamientoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.VerPlanFinanciamientoPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.obtenerClientesFinPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.obtenerContratosDetalleCliente
import com.isiweek.puntodeventa.pantallas.financiamiento.obtenerPlanesPantalla
import com.isiweek.puntodeventa.pantallas.financiamiento.aPlanOffline
import com.isiweek.puntodeventa.pantallas.financiamiento.obtenerContratoVer
import com.isiweek.puntodeventa.pantallas.financiamiento.obtenerContratoVerCompartido
import com.isiweek.puntodeventa.pantallas.gastos.GastosPantalla
import com.isiweek.puntodeventa.pantallas.gastos.GastoFormPantalla
import com.isiweek.puntodeventa.pantallas.gastos.VerGastoPantalla
import com.isiweek.puntodeventa.pantallas.usuarios.UsuariosPantalla
import com.isiweek.puntodeventa.pantallas.usuarios.UsuarioFormPantalla
import com.isiweek.puntodeventa.pantallas.usuarios.VerUsuarioPantalla
import com.isiweek.puntodeventa.pantallas.inventario.InventarioPantalla
import com.isiweek.puntodeventa.pantallas.marcas.MarcasPantalla
import com.isiweek.puntodeventa.pantallas.marcas.MarcaFormPantalla
import com.isiweek.puntodeventa.pantallas.marcas.VerMarcaPantalla
import com.isiweek.puntodeventa.pantallas.productos.ProductosPantalla
import com.isiweek.puntodeventa.pantallas.productos.VerProductoPantalla
import com.isiweek.puntodeventa.pantallas.productos.ProductoFormPantalla
import com.isiweek.puntodeventa.pantallas.proveedores.ProveedoresPantalla
import com.isiweek.puntodeventa.pantallas.proveedores.ProveedorFormPantalla
import com.isiweek.puntodeventa.pantallas.proveedores.VerProveedorPantalla
import com.isiweek.puntodeventa.pantallas.rapida.VentaRapidaPantalla
import com.isiweek.puntodeventa.pantallas.reportes.ReportesPantalla
import com.isiweek.puntodeventa.pantallas.ticket.TicketPantalla
import com.isiweek.puntodeventa.ui.componentes.AvisoSinBaseDatos
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import androidx.compose.foundation.background
import androidx.compose.ui.graphics.Color
import com.isiweek.puntodeventa.pantallas.ticket.TicketVenta
import com.isiweek.puntodeventa.pantallas.vender.VenderPantalla
import com.isiweek.puntodeventa.pantallas.vender.ClienteVenta
import com.isiweek.puntodeventa.pantallas.ventas.MisVentasPantalla
import com.isiweek.puntodeventa.ui.tema.TemaPuntoDeVenta
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        RepositorioOffline.cargar(applicationContext)
        setContent {
            ShellPrincipal()
        }
    }
}

/**
 * Shell principal: replica la estructura del layout web
 * (HeaderTop + HeaderLateral + zona de contenido). La web no maneja footer.
 * En móvil la web oculta el sidebar desktop y usa un drawer lateral móvil.
 */
@Composable
fun ShellPrincipal() {
    val estadoDrawer = rememberDrawerState(DrawerValue.Closed)
    val ambitoCoroutines = rememberCoroutineScope()
    val sistemaOscuro = isSystemInDarkTheme()
    var temaOscuro by remember { mutableStateOf(sistemaOscuro) }
    var idioma by remember { mutableStateOf(Idioma.ESPANOL) }
    var pilaRutas by remember { mutableStateOf(listOf(CatalogoNavegacion.Ruta.VENDER)) }
    var ticketActual by remember { mutableStateOf<TicketVenta?>(null) }
    var clienteFinId by remember { mutableStateOf(1) }
    var planId by remember { mutableStateOf(1) }
    var contratoId by remember { mutableStateOf(343) }
    var reciboPago by remember { mutableStateOf<DatosReciboPago?>(null) }
    var productoId by remember { mutableStateOf(1L) }
    var abrirCierreCaja by remember { mutableStateOf(false) }
    var clienteVender by remember { mutableStateOf<ClienteVenta?>(null) }
    var clienteEditarId by remember { mutableStateOf<Long?>(null) }
    var clienteVerId by remember { mutableStateOf<Long?>(null) }
    var proveedorVerId by remember { mutableStateOf<Int?>(null) }
    var proveedorEditarId by remember { mutableStateOf<Int?>(null) }
    var cotizacionVerId by remember { mutableStateOf<Int?>(null) }
    var cotizacionEditarId by remember { mutableStateOf<Int?>(null) }
    var cotizacionImprimirId by remember { mutableStateOf<Int?>(null) }
    var categoriaVerId by remember { mutableStateOf<Int?>(null) }
    var categoriaEditarId by remember { mutableStateOf<Int?>(null) }
    var marcaVerId by remember { mutableStateOf<Int?>(null) }
    var marcaEditarId by remember { mutableStateOf<Int?>(null) }
    var gastoVerId by remember { mutableStateOf<Int?>(null) }
    var gastoEditarId by remember { mutableStateOf<Int?>(null) }
    var usuarioVerId by remember { mutableStateOf<Int?>(null) }
    var usuarioEditarId by remember { mutableStateOf<Int?>(null) }
    var planes by remember { mutableStateOf(obtenerPlanesPantalla()) }

    fun navegar(ruta: String) {
        if (pilaRutas.last() != ruta) {
            pilaRutas = pilaRutas + ruta
        }
    }

    fun retroceder() {
        if (pilaRutas.size > 1) {
            pilaRutas = pilaRutas.dropLast(1)
        }
    }

    BackHandler(enabled = pilaRutas.size > 1) {
        retroceder()
    }

    fun cerrarDrawer() {
        ambitoCoroutines.launch { estadoDrawer.close() }
    }

    TemaPuntoDeVenta(oscuro = temaOscuro) {
        ModalNavigationDrawer(
            drawerState = estadoDrawer,
            drawerContent = {
                HeaderLateral(
                    rutaActual = pilaRutas.last(),
                    idioma = idioma,
                    oscuro = temaOscuro,
                    alSeleccionar = { ruta ->
                        navegar(ruta)
                        cerrarDrawer()
                    }
                )
            }
        ) {
            Scaffold(
                topBar = {
                    HeaderTop(
                        idioma = idioma,
                        oscuro = temaOscuro,
                        totalNotificaciones = 0,
                        alAlternarTema = { temaOscuro = !temaOscuro },
                        alAlternarIdioma = { idioma = if (idioma == Idioma.ESPANOL) Idioma.INGLES else Idioma.ESPANOL },
                        alAbrirMenu = { ambitoCoroutines.launch { estadoDrawer.open() } }
                    )
                }
            ) { paddingInterno ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingInterno)
                ) {
                    when (pilaRutas.last()) {
                        CatalogoNavegacion.Ruta.VENDER -> VenderPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onVentaRapida = { navegar(CatalogoNavegacion.Ruta.VENTA_RAPIDA) },
                            onImprimir = { ticket ->
                                ticketActual = ticket
                                navegar(CatalogoNavegacion.Ruta.IMPRIMIR)
                            },
                            clienteInicial = clienteVender,
                            metodoInicial = if (clienteVender != null) "credito" else null
                        )
                        CatalogoNavegacion.Ruta.VENTA_RAPIDA -> VentaRapidaPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onImprimir = { ticket ->
                                ticketActual = ticket
                                navegar(CatalogoNavegacion.Ruta.IMPRIMIR)
                            }
                        )
                        CatalogoNavegacion.Ruta.IMPRIMIR -> {
                            val ticket = ticketActual
                            if (ticket != null) {
                                TicketPantalla(
                                    ticket = ticket,
                                    idioma = idioma,
                                    oscuro = temaOscuro,
                                    onCerrar = { retroceder() }
                                )
                            } else {
                                PantallaEnConstruccion(pilaRutas.last())
                            }
                        }
                        CatalogoNavegacion.Ruta.MIS_VENTAS -> MisVentasPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevaVenta = { navegar(CatalogoNavegacion.Ruta.VENDER) },
                            onAbrirCaja = { navegar(CatalogoNavegacion.Ruta.CAJAS) },
                            onCerrarCaja = {
                                abrirCierreCaja = true
                                navegar(CatalogoNavegacion.Ruta.CAJAS)
                            },
                            onImprimir = { ticket ->
                                ticketActual = ticket
                                navegar(CatalogoNavegacion.Ruta.IMPRIMIR)
                            }
                        )
                        CatalogoNavegacion.Ruta.PRODUCTOS -> ProductosPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevo = { navegar(CatalogoNavegacion.Ruta.PRODUCTOS_NUEVO) },
                            onVer = { id ->
                                productoId = id
                                navegar(CatalogoNavegacion.Ruta.PRODUCTOS_VER)
                            },
                            onEditar = { id ->
                                productoId = id
                                navegar(CatalogoNavegacion.Ruta.PRODUCTOS_EDITAR)
                            }
                        )
                        CatalogoNavegacion.Ruta.PRODUCTOS_NUEVO -> ProductoFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = true,
                            productoId = null,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.PRODUCTOS_VER -> VerProductoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            productoId = productoId,
                            onEditar = {
                                navegar(CatalogoNavegacion.Ruta.PRODUCTOS_EDITAR)
                            },
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.PRODUCTOS_EDITAR -> ProductoFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = false,
                            productoId = productoId,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CLIENTES -> ClientesPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevo = { navegar(CatalogoNavegacion.Ruta.CLIENTES_NUEVO) },
                            onVer = { id ->
                                clienteVerId = id
                                navegar(CatalogoNavegacion.Ruta.CLIENTES_VER)
                            },
                            onVender = { cliente ->
                                clienteVender = ClienteVenta(
                                    id = cliente.id,
                                    nombreCompleto = cliente.nombre,
                                    numeroDocumento = cliente.numeroDocumento
                                )
                                navegar(CatalogoNavegacion.Ruta.VENDER)
                            },
                            onEditar = { id ->
                                clienteEditarId = id
                                navegar(CatalogoNavegacion.Ruta.CLIENTES_EDITAR)
                            }
                        )
                        CatalogoNavegacion.Ruta.CLIENTES_NUEVO -> ClienteFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = true,
                            clienteId = null,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CLIENTES_EDITAR -> ClienteFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = false,
                            clienteId = clienteEditarId,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CLIENTES_VER -> {
                            val cid = clienteVerId
                            if (cid != null) {
                                VerClientePantalla(
                                    idioma = idioma,
                                    oscuro = temaOscuro,
                                    clienteId = cid,
                                    onEditar = { navegar(CatalogoNavegacion.Ruta.CLIENTES_EDITAR) },
                                    onVender = { cliente ->
                                        clienteVender = ClienteVenta(
                                            id = cliente.id,
                                            nombreCompleto = cliente.nombre,
                                            numeroDocumento = cliente.numeroDocumento
                                        )
                                        navegar(CatalogoNavegacion.Ruta.VENDER)
                                    },
                                    onCerrar = { retroceder() }
                                )
                            } else {
                                PantallaEnConstruccion(pilaRutas.last())
                            }
                        }
                        CatalogoNavegacion.Ruta.INVENTARIO -> InventarioPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro
                        )
                        CatalogoNavegacion.Ruta.COMPRAS -> ComprasPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevaCompra = { navegar(CatalogoNavegacion.Ruta.COMPRAS_NUEVO) }
                        )
                        CatalogoNavegacion.Ruta.COMPRAS_NUEVO -> NuevaCompraPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onVolver = { retroceder() },
                            onGuardada = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.PROVEEDORES -> ProveedoresPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevo = { navegar(CatalogoNavegacion.Ruta.PROVEEDORES_NUEVO) },
                            onVer = { id ->
                                proveedorVerId = id
                                navegar(CatalogoNavegacion.Ruta.PROVEEDORES_VER)
                            },
                            onEditar = { id ->
                                proveedorEditarId = id
                                navegar(CatalogoNavegacion.Ruta.PROVEEDORES_EDITAR)
                            }
                        )
                        CatalogoNavegacion.Ruta.PROVEEDORES_NUEVO -> ProveedorFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = true,
                            proveedorId = null,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.PROVEEDORES_EDITAR -> ProveedorFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = false,
                            proveedorId = proveedorEditarId,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.PROVEEDORES_VER -> {
                            val pid = proveedorVerId
                            if (pid != null) {
                                VerProveedorPantalla(
                                    idioma = idioma,
                                    oscuro = temaOscuro,
                                    proveedorId = pid,
                                    onEditar = { navegar(CatalogoNavegacion.Ruta.PROVEEDORES_EDITAR) },
                                    onEliminar = { retroceder() },
                                    onCerrar = { retroceder() }
                                )
                            } else {
                                PantallaEnConstruccion(pilaRutas.last())
                            }
                        }
                        CatalogoNavegacion.Ruta.COTIZACIONES -> CotizacionesPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevo = { navegar(CatalogoNavegacion.Ruta.COTIZACIONES_NUEVO) },
                            onVer = { id ->
                                cotizacionVerId = id
                                navegar(CatalogoNavegacion.Ruta.COTIZACIONES_VER)
                            },
                            onEditar = { id ->
                                cotizacionEditarId = id
                                navegar(CatalogoNavegacion.Ruta.COTIZACIONES_EDITAR)
                            },
                            onImprimir = { id ->
                                cotizacionImprimirId = id
                                navegar(CatalogoNavegacion.Ruta.COTIZACIONES_IMPRIMIR)
                            }
                        )
                        CatalogoNavegacion.Ruta.COTIZACIONES_NUEVO -> CotizacionFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = true,
                            cotizacionId = null,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.COTIZACIONES_EDITAR -> CotizacionFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = false,
                            cotizacionId = cotizacionEditarId,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.COTIZACIONES_VER -> {
                            val cid = cotizacionVerId
                            if (cid != null) {
                                VerCotizacionPantalla(
                                    idioma = idioma,
                                    oscuro = temaOscuro,
                                    cotizacionId = cid,
                                    onEditar = { navegar(CatalogoNavegacion.Ruta.COTIZACIONES_EDITAR) },
                                    onImprimir = {
                                        cotizacionImprimirId = cid
                                        navegar(CatalogoNavegacion.Ruta.COTIZACIONES_IMPRIMIR)
                                    },
                                    onCerrar = { retroceder() }
                                )
                            } else {
                                PantallaEnConstruccion(pilaRutas.last())
                            }
                        }
                        CatalogoNavegacion.Ruta.COTIZACIONES_IMPRIMIR -> ImprimirCotizacionPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            cotizacionId = cotizacionImprimirId,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CONDUCES -> ConducesPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro
                        )
                        CatalogoNavegacion.Ruta.CATEGORIAS -> CategoriasPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevo = { navegar(CatalogoNavegacion.Ruta.CATEGORIAS_NUEVO) },
                            onVer = { id ->
                                categoriaVerId = id
                                navegar(CatalogoNavegacion.Ruta.CATEGORIAS_VER)
                            },
                            onEditar = { id ->
                                categoriaEditarId = id
                                navegar(CatalogoNavegacion.Ruta.CATEGORIAS_EDITAR)
                            }
                        )
                        CatalogoNavegacion.Ruta.CATEGORIAS_NUEVO -> CategoriaFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = true,
                            categoriaId = null,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CATEGORIAS_EDITAR -> CategoriaFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = false,
                            categoriaId = categoriaEditarId,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CATEGORIAS_VER -> {
                            val cid = categoriaVerId
                            if (cid != null) {
                                VerCategoriaPantalla(
                                    idioma = idioma,
                                    oscuro = temaOscuro,
                                    categoriaId = cid,
                                    onEditar = { navegar(CatalogoNavegacion.Ruta.CATEGORIAS_EDITAR) },
                                    onEliminar = { retroceder() },
                                    onCerrar = { retroceder() }
                                )
                            } else {
                                PantallaEnConstruccion(pilaRutas.last())
                            }
                        }
                        CatalogoNavegacion.Ruta.MARCAS -> MarcasPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevo = { navegar(CatalogoNavegacion.Ruta.MARCAS_NUEVO) },
                            onVer = { id ->
                                marcaVerId = id
                                navegar(CatalogoNavegacion.Ruta.MARCAS_VER)
                            },
                            onEditar = { id ->
                                marcaEditarId = id
                                navegar(CatalogoNavegacion.Ruta.MARCAS_EDITAR)
                            }
                        )
                        CatalogoNavegacion.Ruta.MARCAS_NUEVO -> MarcaFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = true,
                            marcaId = null,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.MARCAS_EDITAR -> MarcaFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = false,
                            marcaId = marcaEditarId,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.MARCAS_VER -> {
                            val mid = marcaVerId
                            if (mid != null) {
                                VerMarcaPantalla(
                                    idioma = idioma,
                                    oscuro = temaOscuro,
                                    marcaId = mid,
                                    onEditar = { navegar(CatalogoNavegacion.Ruta.MARCAS_EDITAR) },
                                    onEliminar = { retroceder() },
                                    onCerrar = { retroceder() }
                                )
                            } else {
                                PantallaEnConstruccion(pilaRutas.last())
                            }
                        }
                        CatalogoNavegacion.Ruta.CAJAS -> CajasPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            abrirCierre = abrirCierreCaja,
                            onConsumirCierre = { abrirCierreCaja = false }
                        )
                        CatalogoNavegacion.Ruta.GASTOS -> GastosPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevo = { navegar(CatalogoNavegacion.Ruta.GASTOS_NUEVO) },
                            onVer = { id ->
                                gastoVerId = id
                                navegar(CatalogoNavegacion.Ruta.GASTOS_VER)
                            },
                            onEditar = { id ->
                                gastoEditarId = id
                                navegar(CatalogoNavegacion.Ruta.GASTOS_EDITAR)
                            }
                        )
                        CatalogoNavegacion.Ruta.GASTOS_NUEVO -> GastoFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = true,
                            gastoId = null,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.GASTOS_EDITAR -> GastoFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = false,
                            gastoId = gastoEditarId,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.GASTOS_VER -> {
                            val gid = gastoVerId
                            if (gid != null) {
                                VerGastoPantalla(
                                    idioma = idioma,
                                    oscuro = temaOscuro,
                                    gastoId = gid,
                                    onEditar = { navegar(CatalogoNavegacion.Ruta.GASTOS_EDITAR) },
                                    onEliminar = { retroceder() },
                                    onCerrar = { retroceder() }
                                )
                            } else {
                                PantallaEnConstruccion(pilaRutas.last())
                            }
                        }
                        CatalogoNavegacion.Ruta.DASHBOARD -> DashboardPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onVerVentas = { navegar(CatalogoNavegacion.Ruta.MIS_VENTAS) },
                            onVerProductos = { navegar(CatalogoNavegacion.Ruta.PRODUCTOS) },
                            onVerClientes = { navegar(CatalogoNavegacion.Ruta.CLIENTES) }
                        )
                        CatalogoNavegacion.Ruta.REPORTES -> ReportesPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro
                        )
                        CatalogoNavegacion.Ruta.FINANCIAMIENTO -> DashboardFinancieroPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevoContrato = { navegar(CatalogoNavegacion.Ruta.PRESTAMOS) },
                            onNuevoPlan = { navegar(CatalogoNavegacion.Ruta.PLANES) },
                            onPlanes = { navegar(CatalogoNavegacion.Ruta.PLANES) },
                            onPrestamos = { navegar(CatalogoNavegacion.Ruta.PRESTAMOS) },
                            onCuotas = { navegar(CatalogoNavegacion.Ruta.CUOTAS) },
                            onPagos = { navegar(CatalogoNavegacion.Ruta.PAGOS_FIN) },
                            onAlertas = { navegar(CatalogoNavegacion.Ruta.ALERTAS) }
                        )
                        CatalogoNavegacion.Ruta.PRESTAMOS -> PrestamosPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevo = { navegar(CatalogoNavegacion.Ruta.PRESTAMOS_NUEVO) },
                            onVerTodos = { navegar(CatalogoNavegacion.Ruta.PRESTAMOS_LISTAR) }
                        )
                        CatalogoNavegacion.Ruta.PRESTAMOS_LISTAR -> PrestamosListarPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onVolver = { retroceder() },
                            onNuevo = { navegar(CatalogoNavegacion.Ruta.PRESTAMOS_NUEVO) },
                            onVer = { id ->
                                contratoId = id
                                navegar(CatalogoNavegacion.Ruta.CONTRATO_VER)
                            },
                            onEditar = { id ->
                                contratoId = id
                                navegar(CatalogoNavegacion.Ruta.CONTRATO_EDITAR)
                            },
                            onImprimir = { id ->
                                contratoId = id
                                navegar(CatalogoNavegacion.Ruta.CONTRATO_IMPRIMIR)
                            }
                        )
                        CatalogoNavegacion.Ruta.PRESTAMOS_NUEVO -> NuevoPrestamoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onVolver = { retroceder() },
                            onCreado = { id ->
                                contratoId = id
                                navegar(CatalogoNavegacion.Ruta.CONTRATO_VER)
                            }
                        )
                        CatalogoNavegacion.Ruta.CONTRATO_EDITAR -> EditarPrestamoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            contratoId = contratoId,
                            onVolver = { retroceder() },
                            onGuardado = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CONTRATO_IMPRIMIR -> ImprimirContratoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            contratoId = contratoId,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CUOTAS -> CuotasPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onVerContrato = { id ->
                                contratoId = id
                                navegar(CatalogoNavegacion.Ruta.CONTRATO_VER)
                            },
                            onImprimir = { recibo ->
                                reciboPago = recibo
                                navegar(CatalogoNavegacion.Ruta.PAGO_IMPRIMIR)
                            }
                        )
                        CatalogoNavegacion.Ruta.PAGO_IMPRIMIR -> {
                            val recibo = reciboPago
                            if (recibo != null) {
                                ImprimirPagoPantalla(
                                    idioma = idioma,
                                    oscuro = temaOscuro,
                                    recibo = recibo,
                                    onCerrar = { retroceder() }
                                )
                            } else {
                                PantallaEnConstruccion(pilaRutas.last())
                            }
                        }
                        CatalogoNavegacion.Ruta.PAGOS_FIN -> PagosPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onImprimir = { recibo ->
                                reciboPago = recibo
                                navegar(CatalogoNavegacion.Ruta.PAGO_IMPRIMIR)
                            }
                        )
                        CatalogoNavegacion.Ruta.ALERTAS -> AlertasPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onVerContrato = { id ->
                                contratoId = id
                                navegar(CatalogoNavegacion.Ruta.CONTRATO_VER)
                            }
                        )
                        CatalogoNavegacion.Ruta.CONTRATO_VER -> {
                            val contrato = obtenerContratoVer(contratoId)
                                ?: obtenerContratoVerCompartido(contratoId)
                            if (contrato != null) {
                                VerContratoFinanciamientoPantalla(
                                    idioma = idioma,
                                    oscuro = temaOscuro,
                                    contrato = contrato,
                                    onVolver = { retroceder() },
                                    onEditar = { retroceder() }
                                )
                            } else {
                                PantallaEnConstruccion(pilaRutas.last())
                            }
                        }
                        CatalogoNavegacion.Ruta.PLANES -> PlanesPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevoPlan = { navegar(CatalogoNavegacion.Ruta.PLANES_NUEVO) },
                            onVerPlan = { id ->
                                planId = id
                                navegar(CatalogoNavegacion.Ruta.PLANES_VER)
                            },
                            onEditarPlan = { id ->
                                planId = id
                                navegar(CatalogoNavegacion.Ruta.PLANES_EDITAR)
                            }
                        )
                        CatalogoNavegacion.Ruta.PLANES_NUEVO -> NuevoPlanFinanciamientoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onVolver = { retroceder() },
                            onCreado = { nuevo ->
                                planes = listOf(nuevo) + planes
                                retroceder()
                            }
                        )
                        CatalogoNavegacion.Ruta.PLANES_VER -> VerPlanFinanciamientoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            plan = obtenerPlanesPantalla().firstOrNull { it.id == planId },
                            onVolver = { retroceder() },
                            onEditar = { navegar(CatalogoNavegacion.Ruta.PLANES_EDITAR) },
                            onToggleActivo = {
                                val p = obtenerPlanesPantalla().firstOrNull { it.id == planId }
                                if (p != null && RepositorioOffline.hayDatosOffline()) {
                                    RepositorioOffline.guardarPlan(p.copy(activo = !p.activo).aPlanOffline())
                                }
                                planes = obtenerPlanesPantalla()
                            }
                        )
                        CatalogoNavegacion.Ruta.PLANES_EDITAR -> EditarPlanFinanciamientoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            plan = obtenerPlanesPantalla().firstOrNull { it.id == planId },
                            onVolver = { retroceder() },
                            onGuardado = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CLIENTES_FIN -> ClientesFinanciamientoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevoCliente = { navegar(CatalogoNavegacion.Ruta.CLIENTES_FIN_CREAR) },
                            onVerCliente = { id ->
                                clienteFinId = id
                                navegar(CatalogoNavegacion.Ruta.CLIENTES_FIN_VER)
                            }
                        )
                        CatalogoNavegacion.Ruta.CLIENTES_FIN_CREAR -> CrearClienteFinanciamientoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onVolver = { retroceder() },
                            onCreado = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CLIENTES_FIN_VER -> VerClienteFinanciamientoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            cliente = obtenerClientesFinPantalla().firstOrNull { it.id == clienteFinId },
                            contratosParam = obtenerContratosDetalleCliente(clienteFinId),
                            onVolver = { retroceder() },
                            onEditar = { navegar(CatalogoNavegacion.Ruta.CLIENTES_FIN_EDITAR) },
                            onNuevoContrato = { navegar(CatalogoNavegacion.Ruta.PRESTAMOS) }
                        )
                        CatalogoNavegacion.Ruta.CLIENTES_FIN_EDITAR -> EditarClienteFinanciamientoPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            cliente = obtenerClientesFinPantalla().firstOrNull { it.id == clienteFinId },
                            onVolver = { retroceder() },
                            onGuardado = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.CONFIGURACION -> ConfiguracionPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onVolver = { retroceder() }
                        )
                        "isicrub" -> IsicrubPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro
                        )
                        CatalogoNavegacion.Ruta.USUARIOS -> UsuariosPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            onNuevo = { navegar(CatalogoNavegacion.Ruta.USUARIOS_NUEVO) },
                            onVer = { id ->
                                usuarioVerId = id
                                navegar(CatalogoNavegacion.Ruta.USUARIOS_VER)
                            },
                            onEditar = { id ->
                                usuarioEditarId = id
                                navegar(CatalogoNavegacion.Ruta.USUARIOS_EDITAR)
                            }
                        )
                        CatalogoNavegacion.Ruta.USUARIOS_NUEVO -> UsuarioFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = true,
                            usuarioId = null,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.USUARIOS_EDITAR -> UsuarioFormPantalla(
                            idioma = idioma,
                            oscuro = temaOscuro,
                            esNuevo = false,
                            usuarioId = usuarioEditarId,
                            onCerrar = { retroceder() }
                        )
                        CatalogoNavegacion.Ruta.USUARIOS_VER -> {
                            val uid = usuarioVerId
                            if (uid != null) {
                                VerUsuarioPantalla(
                                    idioma = idioma,
                                    oscuro = temaOscuro,
                                    usuarioId = uid,
                                    onEditar = { navegar(CatalogoNavegacion.Ruta.USUARIOS_EDITAR) },
                                    onEliminar = { retroceder() },
                                    onCerrar = { retroceder() }
                                )
                            } else {
                                PantallaEnConstruccion(pilaRutas.last())
                            }
                        }
                        else -> PantallaEnConstruccion(pilaRutas.last())
                    }

                    // Aviso global cuando no hay datos offline (todas las secciones)
                    if (!RepositorioOffline.hayDatosOffline() && pilaRutas.last() != CatalogoNavegacion.Ruta.CONFIGURACION) {
                        AvisoSinBaseDatos(
                            idioma = idioma,
                            tokens = TokensWeb(
                                fondoPrincipal = if (temaOscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF),
                                fondoElevado = if (temaOscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
                                fondoTerciario = if (temaOscuro) Color(0xFF334155) else Color(0xFFF1F5F9),
                                fondoContenido = if (temaOscuro) Color(0xFF0F172A) else Color(0xFFF1F5F9),
                                textoPrimario = if (temaOscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A),
                                textoSecundario = if (temaOscuro) Color(0xFFCBD5E1) else Color(0xFF475569),
                                textoTerciario = if (temaOscuro) Color(0xFF94A3B8) else Color(0xFF94A3B8),
                                bordeClaro = if (temaOscuro) Color(0xFF334155) else Color(0xFFE5E7EB),
                                bordeMedio = if (temaOscuro) Color(0xFF475569) else Color(0xFFD1D5DB),
                                primario = if (temaOscuro) Color(0xFF3B82F6) else Color(0xFF2563EB),
                                primarioClaro = if (temaOscuro) Color(0xFF3B82F6).copy(alpha = 0.15f) else Color(0xFFDBEAFE),
                                exito = Color(0xFF10B981)
                            ),
                            oscuro = temaOscuro,
                            modifier = Modifier
                                .fillMaxSize()
                                .background(if (temaOscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF)),
                            onConfigurar = { navegar(CatalogoNavegacion.Ruta.CONFIGURACION) }
                        )
                    }
                }
            }
        }
    }
}

/** Pantalla temporal para rutas aún no construidas */
@Composable
private fun PantallaEnConstruccion(
    rutaActual: String
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "Pantalla: $rutaActual (en construcción)",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center
        )
    }
}