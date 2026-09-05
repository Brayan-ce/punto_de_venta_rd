"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerDatosDashboard, obtenerDatosEmpresa } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './dashboard.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function DashboardAdmin({ basePath = '/admin' }) {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [datos, setDatos] = useState(null)
    const [empresa, setEmpresa] = useState(null)
    const [periodoVentas, setPeriodoVentas] = useState('hoy')
    const [periodoProductos, setPeriodoProductos] = useState('top')

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)
        cargarEmpresa()

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerDatosDashboard()
            if (resultado.success) {
                setDatos(resultado.datos)
            } else {
                alert(resultado.mensaje || tr('Error al cargar dashboard', 'Error loading dashboard'))
            }
        } catch (error) {
            console.error('Error al cargar dashboard:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
        } finally {
            setCargando(false)
        }
    }

    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat(localeEmpresa, {
            style: 'currency',
            currency: monedaEmpresa,
            minimumFractionDigits: 2
        }).format(monto)
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const obtenerVentasPorPeriodo = () => {
        if (!datos) return []
        
        switch(periodoVentas) {
            case 'hoy':
                return datos.ventasHoy
            case 'semana':
                return datos.ventasSemana
            case 'mes':
                return datos.ventasMes
            default:
                return datos.ventasHoy
        }
    }

    const obtenerProductosPorTipo = () => {
        if (!datos) return []
        
        switch(periodoProductos) {
            case 'top':
                return datos.topProductos
            case 'bajo':
                return datos.productosBajoStock
            default:
                return datos.topProductos
        }
    }

    if (cargando) {
        return <LoadingScreen />
    }

    if (!datos) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>{tr('Error al cargar los datos del dashboard', 'Error loading dashboard data')}</span>
                </div>
            </div>
        )
    }

    const ventasMostrar = obtenerVentasPorPeriodo()
    const productosMostrar = obtenerProductosPorTipo()

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Dashboard</h1>
                    <p className={estilos.subtitulo}>{tr('Resumen general del negocio', 'General business summary')}</p>
                </div>
            </div>

            <div className={estilos.estadisticasPrincipales}>
                <div className={`${estilos.estadCard} ${estilos.ventas}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Ventas Hoy', 'Sales Today')}</span>
                        <span className={estilos.estadValor}>{formatearMoneda(datos.resumen.ventasHoy)}</span>
                        <span className={estilos.estadDetalle}>{datos.resumen.cantidadVentasHoy} {tr('ventas', 'sales')}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.productos}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Productos</span>
                        <span className={estilos.estadValor}>{datos.resumen.totalProductos}</span>
                        <span className={estilos.estadDetalle}>{datos.resumen.productosActivos} {tr('activos', 'active')}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.clientes}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="people-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Clientes</span>
                        <span className={estilos.estadValor}>{datos.resumen.totalClientes}</span>
                        <span className={estilos.estadDetalle}>{datos.resumen.clientesActivos} {tr('activos', 'active')}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.inventario}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="file-tray-stacked-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Inventario', 'Inventory')}</span>
                        <span className={estilos.estadValor}>{formatearMoneda(datos.resumen.valorInventario)}</span>
                        <span className={estilos.estadDetalle}>{datos.resumen.productosBajoStock} {tr('bajo stock', 'low stock')}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.fila}>
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="trending-up-outline"></ion-icon>
                            {tr('Ventas Recientes', 'Recent Sales')}
                        </h2>
                        <div className={estilos.panelControles}>
                            <button
                                className={`${estilos.btnPeriodo} ${periodoVentas === 'hoy' ? estilos.activo : ''}`}
                                onClick={() => setPeriodoVentas('hoy')}
                            >
                                {tr('Hoy', 'Today')}
                            </button>
                            <button
                                className={`${estilos.btnPeriodo} ${periodoVentas === 'semana' ? estilos.activo : ''}`}
                                onClick={() => setPeriodoVentas('semana')}
                            >
                                {tr('Semana', 'Week')}
                            </button>
                            <button
                                className={`${estilos.btnPeriodo} ${periodoVentas === 'mes' ? estilos.activo : ''}`}
                                onClick={() => setPeriodoVentas('mes')}
                            >
                                {tr('Mes', 'Month')}
                            </button>
                        </div>
                    </div>

                    <div className={estilos.panelBody}>
                        {ventasMostrar.length === 0 ? (
                            <div className={estilos.panelVacio}>
                                <ion-icon name="receipt-outline"></ion-icon>
                                <span>{tr('No hay ventas en este periodo', 'No sales in this period')}</span>
                            </div>
                        ) : (
                            <div className={estilos.listaVentas}>
                                {ventasMostrar.map((venta) => (
                                    <Link 
                                        key={venta.id} 
                                        href={`${basePath}/ventas/ver/${venta.id}`}
                                        className={estilos.ventaItem}
                                    >
                                        <div className={estilos.ventaIcono}>
                                            <ion-icon name="receipt-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.ventaInfo}>
                                            <span className={estilos.ventaNcf}>{venta.ncf}</span>
                                            <span className={estilos.ventaCliente}>
                                                {venta.cliente_nombre || tr('Consumidor Final', 'Final Consumer')}
                                            </span>
                                        </div>
                                        <div className={estilos.ventaDetalles}>
                                            <span className={estilos.ventaMonto}>{formatearMoneda(venta.total)}</span>
                                            <span className={estilos.ventaFecha}>{formatearFecha(venta.fecha_venta)}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={estilos.panelFooter}>
                        <Link href={`${basePath}/ventas`} className={estilos.btnVerTodo}>
                            {tr('Ver todas las ventas', 'View all sales')}
                            <ion-icon name="arrow-forward-outline"></ion-icon>
                        </Link>
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="cube-outline"></ion-icon>
                            Productos
                        </h2>
                        <div className={estilos.panelControles}>
                            <button
                                className={`${estilos.btnPeriodo} ${periodoProductos === 'top' ? estilos.activo : ''}`}
                                onClick={() => setPeriodoProductos('top')}
                            >
                                {tr('Top', 'Top')}
                            </button>
                            <button
                                className={`${estilos.btnPeriodo} ${periodoProductos === 'bajo' ? estilos.activo : ''}`}
                                onClick={() => setPeriodoProductos('bajo')}
                            >
                                {tr('Bajo Stock', 'Low Stock')}
                            </button>
                        </div>
                    </div>

                    <div className={estilos.panelBody}>
                        {productosMostrar.length === 0 ? (
                            <div className={estilos.panelVacio}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <span>{tr('No hay productos para mostrar', 'No products to display')}</span>
                            </div>
                        ) : (
                            <div className={estilos.listaProductos}>
                                {productosMostrar.map((producto) => (
                                    <Link 
                                        key={producto.id} 
                                        href={`${basePath}/productos/ver/${producto.id}`}
                                        className={estilos.productoItem}
                                    >
                                        <div className={estilos.productoIcono}>
                                            {producto.imagen_url ? (
                                                <img src={producto.imagen_url} alt={producto.nombre} />
                                            ) : (
                                                <ion-icon name="image-outline"></ion-icon>
                                            )}
                                        </div>
                                        <div className={estilos.productoInfo}>
                                            <span className={estilos.productoNombre}>{producto.nombre}</span>
                                            <span className={estilos.productoCategoria}>{producto.categoria_nombre}</span>
                                        </div>
                                        <div className={estilos.productoDetalles}>
                                            {periodoProductos === 'top' ? (
                                                <>
                                                    <span className={estilos.productoVendido}>{producto.total_vendido} {tr('vendidos', 'sold')}</span>
                                                    <span className={estilos.productoMonto}>{formatearMoneda(producto.monto_total)}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={`${estilos.productoStock} ${producto.stock <= producto.stock_minimo ? estilos.critico : ''}`}>
                                                        {tr('Stock', 'Stock')}: {producto.stock}
                                                    </span>
                                                    <span className={estilos.productoMinimo}>{tr('Min', 'Min')}: {producto.stock_minimo}</span>
                                                </>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={estilos.panelFooter}>
                        <Link href={`${basePath}/productos`} className={estilos.btnVerTodo}>
                            {tr('Ver todos los productos', 'View all products')}
                            <ion-icon name="arrow-forward-outline"></ion-icon>
                        </Link>
                    </div>
                </div>
            </div>

            <div className={estilos.fila}>
                <div className={`${estilos.panel} ${estilos.panelMedio} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="stats-chart-outline"></ion-icon>
                            {tr('Resumen de Ventas', 'Sales Summary')}
                        </h2>
                    </div>

                    <div className={estilos.panelBody}>
                        <div className={estilos.resumenVentas}>
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>{tr('Ventas del Dia', 'Today Sales')}</span>
                                <span className={estilos.resumenValor}>{formatearMoneda(datos.resumen.ventasHoy)}</span>
                                <span className={estilos.resumenCantidad}>{datos.resumen.cantidadVentasHoy} {tr('ventas', 'sales')}</span>
                            </div>

                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>{tr('Ventas de la Semana', 'Week Sales')}</span>
                                <span className={estilos.resumenValor}>{formatearMoneda(datos.resumen.ventasSemana)}</span>
                                <span className={estilos.resumenCantidad}>{datos.resumen.cantidadVentasSemana} {tr('ventas', 'sales')}</span>
                            </div>

                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>{tr('Ventas del Mes', 'Month Sales')}</span>
                                <span className={estilos.resumenValor}>{formatearMoneda(datos.resumen.ventasMes)}</span>
                                <span className={estilos.resumenCantidad}>{datos.resumen.cantidadVentasMes} {tr('ventas', 'sales')}</span>
                            </div>

                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>{tr('Promedio por Venta', 'Average per Sale')}</span>
                                <span className={estilos.resumenValor}>{formatearMoneda(datos.resumen.promedioVenta)}</span>
                                <span className={estilos.resumenCantidad}>{tr('Ticket promedio', 'Average ticket')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos.panelMedio} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                            {tr('Alertas', 'Alerts')}
                        </h2>
                    </div>

                    <div className={estilos.panelBody}>
                        <div className={estilos.alertas}>
                            {datos.resumen.productosBajoStock > 0 && (
                                <Link href={`${basePath}/productos?filtro=bajo_stock`} className={`${estilos.alerta} ${estilos.warning}`}>
                                    <ion-icon name="warning-outline"></ion-icon>
                                    <div className={estilos.alertaInfo}>
                                        <span className={estilos.alertaTitulo}>{tr('Productos Bajo Stock', 'Low Stock Products')}</span>
                                        <span className={estilos.alertaDescripcion}>
                                            {datos.resumen.productosBajoStock} {tr('productos necesitan reabastecimiento', 'products need restock')}
                                        </span>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </Link>
                            )}

                            {datos.alertas?.cajaAbierta && (
                                <div className={`${estilos.alerta} ${estilos.success}`}>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <div className={estilos.alertaInfo}>
                                        <span className={estilos.alertaTitulo}>{tr('Caja Abierta', 'Open Register')}</span>
                                        <span className={estilos.alertaDescripcion}>
                                            {tr('Caja', 'Register')} {datos.alertas.numeroCaja} - {formatearMoneda(datos.alertas.montoInicial)} {tr('inicial', 'initial')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!datos.alertas?.cajaAbierta && (
                                <Link href={`${basePath}/ventas`} className={`${estilos.alerta} ${estilos.info}`}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <div className={estilos.alertaInfo}>
                                        <span className={estilos.alertaTitulo}>{tr('Caja Cerrada', 'Closed Register')}</span>
                                        <span className={estilos.alertaDescripcion}>
                                            {tr('Abre la caja para comenzar a vender', 'Open the register to start selling')}
                                        </span>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </Link>
                            )}

                            {datos.resumen.productosActivos === 0 && (
                                <Link href={`${basePath}/productos/nuevo`} className={`${estilos.alerta} ${estilos.danger}`}>
                                    <ion-icon name="close-circle-outline"></ion-icon>
                                    <div className={estilos.alertaInfo}>
                                        <span className={estilos.alertaTitulo}>{tr('Sin Productos', 'No Products')}</span>
                                        <span className={estilos.alertaDescripcion}>
                                            {tr('Agrega productos para comenzar a vender', 'Add products to start selling')}
                                        </span>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${estilos.panel} ${estilos[tema]}`}>
                <div className={estilos.panelHeader}>
                    <h2 className={estilos.panelTitulo}>
                        <ion-icon name="people-outline"></ion-icon>
                        {tr('Clientes Recientes', 'Recent Customers')}
                    </h2>
                </div>

                <div className={estilos.panelBody}>
                    {datos.clientesRecientes.length === 0 ? (
                        <div className={estilos.panelVacio}>
                            <ion-icon name="people-outline"></ion-icon>
                            <span>{tr('No hay clientes registrados', 'No customers registered')}</span>
                        </div>
                    ) : (
                        <div className={estilos.tablaClientes}>
                            <div className={estilos.tablaHeader}>
                                <div>{tr('Cliente', 'Customer')}</div>
                                <div>{tr('Documento', 'Document')}</div>
                                <div>{tr('Total Compras', 'Total Purchases')}</div>
                                <div>{tr('Puntos', 'Points')}</div>
                                <div>{tr('Registrado', 'Registered')}</div>
                            </div>
                            <div className={estilos.tablaBody}>
                                {datos.clientesRecientes.map((cliente) => (
                                    <Link 
                                        key={cliente.id} 
                                        href={`${basePath}/clientes`}
                                        className={estilos.tablaFila}
                                    >
                                        <div className={estilos.clienteNombre}>
                                            <span>{cliente.nombre} {cliente.apellidos}</span>
                                            {cliente.email && <span className={estilos.clienteEmail}>{cliente.email}</span>}
                                        </div>
                                        <div>
                                            <span className={estilos.clienteDocumento}>
                                                {cliente.tipo_documento_codigo}: {cliente.numero_documento}
                                            </span>
                                        </div>
                                        <div>
                                            <span className={estilos.clienteMonto}>{formatearMoneda(cliente.total_compras)}</span>
                                        </div>
                                        <div>
                                            <span className={estilos.clientePuntos}>{cliente.puntos_fidelidad}</span>
                                        </div>
                                        <div>
                                            <span className={estilos.clienteFecha}>{formatearFecha(cliente.fecha_creacion)}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={estilos.panelFooter}>
                    <Link href={`${basePath}/clientes`} className={estilos.btnVerTodo}>
                        {tr('Ver todos los clientes', 'View all customers')}
                        <ion-icon name="arrow-forward-outline"></ion-icon>
                    </Link>
                </div>
            </div>
        </div>
    )
}