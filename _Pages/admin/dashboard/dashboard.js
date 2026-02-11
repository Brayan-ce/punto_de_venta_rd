"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerDatosDashboard } from './servidor'
import estilos from './dashboard.module.css'

export default function DashboardAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [datos, setDatos] = useState(null)
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

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

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
                alert(resultado.mensaje || 'Error al cargar dashboard')
            }
        } catch (error) {
            console.error('Error al cargar dashboard:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
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
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando dashboard...</span>
                </div>
            </div>
        )
    }

    if (!datos) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>Error al cargar los datos del dashboard</span>
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
                    <p className={estilos.subtitulo}>Resumen general del negocio</p>
                </div>
            </div>

            <div className={estilos.estadisticasPrincipales}>
                <div className={`${estilos.estadCard} ${estilos.ventas}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Ventas Hoy</span>
                        <span className={estilos.estadValor}>{formatearMoneda(datos.resumen.ventasHoy)}</span>
                        <span className={estilos.estadDetalle}>{datos.resumen.cantidadVentasHoy} ventas</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.productos}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Productos</span>
                        <span className={estilos.estadValor}>{datos.resumen.totalProductos}</span>
                        <span className={estilos.estadDetalle}>{datos.resumen.productosActivos} activos</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.clientes}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="people-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Clientes</span>
                        <span className={estilos.estadValor}>{datos.resumen.totalClientes}</span>
                        <span className={estilos.estadDetalle}>{datos.resumen.clientesActivos} activos</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.inventario}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="file-tray-stacked-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Inventario</span>
                        <span className={estilos.estadValor}>{formatearMoneda(datos.resumen.valorInventario)}</span>
                        <span className={estilos.estadDetalle}>{datos.resumen.productosBajoStock} bajo stock</span>
                    </div>
                </div>
            </div>

            <div className={estilos.fila}>
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="trending-up-outline"></ion-icon>
                            Ventas Recientes
                        </h2>
                        <div className={estilos.panelControles}>
                            <button
                                className={`${estilos.btnPeriodo} ${periodoVentas === 'hoy' ? estilos.activo : ''}`}
                                onClick={() => setPeriodoVentas('hoy')}
                            >
                                Hoy
                            </button>
                            <button
                                className={`${estilos.btnPeriodo} ${periodoVentas === 'semana' ? estilos.activo : ''}`}
                                onClick={() => setPeriodoVentas('semana')}
                            >
                                Semana
                            </button>
                            <button
                                className={`${estilos.btnPeriodo} ${periodoVentas === 'mes' ? estilos.activo : ''}`}
                                onClick={() => setPeriodoVentas('mes')}
                            >
                                Mes
                            </button>
                        </div>
                    </div>

                    <div className={estilos.panelBody}>
                        {ventasMostrar.length === 0 ? (
                            <div className={estilos.panelVacio}>
                                <ion-icon name="receipt-outline"></ion-icon>
                                <span>No hay ventas en este periodo</span>
                            </div>
                        ) : (
                            <div className={estilos.listaVentas}>
                                {ventasMostrar.map((venta) => (
                                    <Link 
                                        key={venta.id} 
                                        href={`/admin/ventas/ver/${venta.id}`}
                                        className={estilos.ventaItem}
                                    >
                                        <div className={estilos.ventaIcono}>
                                            <ion-icon name="receipt-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.ventaInfo}>
                                            <span className={estilos.ventaNcf}>{venta.ncf}</span>
                                            <span className={estilos.ventaCliente}>
                                                {venta.cliente_nombre || 'Consumidor Final'}
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
                        <Link href="/admin/ventas" className={estilos.btnVerTodo}>
                            Ver todas las ventas
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
                                Top
                            </button>
                            <button
                                className={`${estilos.btnPeriodo} ${periodoProductos === 'bajo' ? estilos.activo : ''}`}
                                onClick={() => setPeriodoProductos('bajo')}
                            >
                                Bajo Stock
                            </button>
                        </div>
                    </div>

                    <div className={estilos.panelBody}>
                        {productosMostrar.length === 0 ? (
                            <div className={estilos.panelVacio}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <span>No hay productos para mostrar</span>
                            </div>
                        ) : (
                            <div className={estilos.listaProductos}>
                                {productosMostrar.map((producto) => (
                                    <Link 
                                        key={producto.id} 
                                        href={`/admin/productos/ver/${producto.id}`}
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
                                                    <span className={estilos.productoVendido}>{producto.total_vendido} vendidos</span>
                                                    <span className={estilos.productoMonto}>{formatearMoneda(producto.monto_total)}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={`${estilos.productoStock} ${producto.stock <= producto.stock_minimo ? estilos.critico : ''}`}>
                                                        Stock: {producto.stock}
                                                    </span>
                                                    <span className={estilos.productoMinimo}>Min: {producto.stock_minimo}</span>
                                                </>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={estilos.panelFooter}>
                        <Link href="/admin/productos" className={estilos.btnVerTodo}>
                            Ver todos los productos
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
                            Resumen de Ventas
                        </h2>
                    </div>

                    <div className={estilos.panelBody}>
                        <div className={estilos.resumenVentas}>
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Ventas del Dia</span>
                                <span className={estilos.resumenValor}>{formatearMoneda(datos.resumen.ventasHoy)}</span>
                                <span className={estilos.resumenCantidad}>{datos.resumen.cantidadVentasHoy} ventas</span>
                            </div>

                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Ventas de la Semana</span>
                                <span className={estilos.resumenValor}>{formatearMoneda(datos.resumen.ventasSemana)}</span>
                                <span className={estilos.resumenCantidad}>{datos.resumen.cantidadVentasSemana} ventas</span>
                            </div>

                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Ventas del Mes</span>
                                <span className={estilos.resumenValor}>{formatearMoneda(datos.resumen.ventasMes)}</span>
                                <span className={estilos.resumenCantidad}>{datos.resumen.cantidadVentasMes} ventas</span>
                            </div>

                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Promedio por Venta</span>
                                <span className={estilos.resumenValor}>{formatearMoneda(datos.resumen.promedioVenta)}</span>
                                <span className={estilos.resumenCantidad}>Ticket promedio</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos.panelMedio} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                            Alertas
                        </h2>
                    </div>

                    <div className={estilos.panelBody}>
                        <div className={estilos.alertas}>
                            {datos.resumen.productosBajoStock > 0 && (
                                <Link href="/admin/productos?filtro=bajo_stock" className={`${estilos.alerta} ${estilos.warning}`}>
                                    <ion-icon name="warning-outline"></ion-icon>
                                    <div className={estilos.alertaInfo}>
                                        <span className={estilos.alertaTitulo}>Productos Bajo Stock</span>
                                        <span className={estilos.alertaDescripcion}>
                                            {datos.resumen.productosBajoStock} productos necesitan reabastecimiento
                                        </span>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </Link>
                            )}

                            {datos.alertas?.cajaAbierta && (
                                <div className={`${estilos.alerta} ${estilos.success}`}>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <div className={estilos.alertaInfo}>
                                        <span className={estilos.alertaTitulo}>Caja Abierta</span>
                                        <span className={estilos.alertaDescripcion}>
                                            Caja {datos.alertas.numeroCaja} - {formatearMoneda(datos.alertas.montoInicial)} inicial
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!datos.alertas?.cajaAbierta && (
                                <Link href="/admin/ventas" className={`${estilos.alerta} ${estilos.info}`}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <div className={estilos.alertaInfo}>
                                        <span className={estilos.alertaTitulo}>Caja Cerrada</span>
                                        <span className={estilos.alertaDescripcion}>
                                            Abre la caja para comenzar a vender
                                        </span>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </Link>
                            )}

                            {datos.resumen.productosActivos === 0 && (
                                <Link href="/admin/productos/nuevo" className={`${estilos.alerta} ${estilos.danger}`}>
                                    <ion-icon name="close-circle-outline"></ion-icon>
                                    <div className={estilos.alertaInfo}>
                                        <span className={estilos.alertaTitulo}>Sin Productos</span>
                                        <span className={estilos.alertaDescripcion}>
                                            Agrega productos para comenzar a vender
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
                        Clientes Recientes
                    </h2>
                </div>

                <div className={estilos.panelBody}>
                    {datos.clientesRecientes.length === 0 ? (
                        <div className={estilos.panelVacio}>
                            <ion-icon name="people-outline"></ion-icon>
                            <span>No hay clientes registrados</span>
                        </div>
                    ) : (
                        <div className={estilos.tablaClientes}>
                            <div className={estilos.tablaHeader}>
                                <div>Cliente</div>
                                <div>Documento</div>
                                <div>Total Compras</div>
                                <div>Puntos</div>
                                <div>Registrado</div>
                            </div>
                            <div className={estilos.tablaBody}>
                                {datos.clientesRecientes.map((cliente) => (
                                    <Link 
                                        key={cliente.id} 
                                        href={`/admin/clientes`}
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
                    <Link href="/admin/clientes" className={estilos.btnVerTodo}>
                        Ver todos los clientes
                        <ion-icon name="arrow-forward-outline"></ion-icon>
                    </Link>
                </div>
            </div>
        </div>
    )
}