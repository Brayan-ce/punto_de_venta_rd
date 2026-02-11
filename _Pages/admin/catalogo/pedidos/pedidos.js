"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerPedidosOnline, actualizarEstadoPedido } from './servidor'
import estilos from './pedidos.module.css'

export default function PedidosCatalogo() {
    const router = useRouter()
    const [pedidos, setPedidos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [tema, setTema] = useState('light')
    const [actualizandoEstado, setActualizandoEstado] = useState(null)

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
        cargarPedidos()
    }, [filtroEstado])

    const cargarPedidos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerPedidosOnline(filtroEstado)
            if (resultado.success) {
                setPedidos(resultado.pedidos || [])
            } else {
                console.error('Error al cargar pedidos:', resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al cargar pedidos:', error)
        } finally {
            setCargando(false)
        }
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            pendiente: '#f59e0b',
            confirmado: '#3b82f6',
            en_proceso: '#8b5cf6',
            listo: '#10b981',
            entregado: '#059669',
            cancelado: '#ef4444'
        }
        return colores[estado] || '#6b7280'
    }

    const obtenerTextoEstado = (estado) => {
        const textos = {
            pendiente: 'Pendiente',
            confirmado: 'Confirmado',
            en_proceso: 'En Proceso',
            listo: 'Listo',
            entregado: 'Entregado',
            cancelado: 'Cancelado'
        }
        return textos[estado] || estado
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return '-'
        const date = new Date(fecha)
        return date.toLocaleString('es-DO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    // Calcular estadísticas
    const contarPorEstado = (estado) => {
        return pedidos.filter(p => p.estado === estado).length
    }

    const calcularTotalVentas = () => {
        return pedidos
            .filter(p => p.estado === 'entregado')
            .reduce((sum, p) => sum + parseFloat(p.total || 0), 0)
    }

    // Filtrar pedidos por búsqueda
    const pedidosFiltrados = pedidos.filter(pedido => {
        const matchEstado = filtroEstado === 'todos' || pedido.estado === filtroEstado
        const matchBusqueda = busqueda === '' || 
            pedido.numero_pedido?.toLowerCase().includes(busqueda.toLowerCase()) ||
            pedido.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            pedido.cliente_telefono?.includes(busqueda)
        return matchEstado && matchBusqueda
    })

    // Manejar cambio de estado
    const cambiarEstado = async (pedidoId, nuevoEstado) => {
        setActualizandoEstado(pedidoId)
        try {
            const resultado = await actualizarEstadoPedido(pedidoId, nuevoEstado)
            if (resultado.success) {
                await cargarPedidos()
            } else {
                alert('Error al actualizar estado: ' + resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error)
            alert('Error al actualizar el estado del pedido')
        } finally {
            setActualizandoEstado(null)
        }
    }

    const obtenerIconoEstado = (estado) => {
        const iconos = {
            pendiente: 'time-outline',
            confirmado: 'checkmark-circle-outline',
            en_proceso: 'cube-outline',
            listo: 'checkmark-done-outline',
            entregado: 'checkmark-done-circle-outline',
            cancelado: 'close-circle-outline'
        }
        return iconos[estado] || 'help-circle-outline'
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div className={estilos.headerContenedor}>
                    <div className={estilos.tituloSection}>
                        <h1 className={estilos.titulo}>Pedidos Online</h1>
                        <p className={estilos.subtitulo}>Gestiona todos los pedidos del catálogo</p>
                    </div>
                    <div className={estilos.badgePedidosNuevos}>
                        <div className={estilos.badgePedidosNuevosLabel}>Pedidos Nuevos</div>
                        <div className={estilos.badgePedidosNuevosValor}>{contarPorEstado('pendiente')}</div>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className={estilos.estadisticas}>
                <div className={estilos.estadisticaCard} style={{ borderColor: '#fbbf24' }}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIcono} style={{ backgroundColor: '#fef3c7' }}>
                            <ion-icon name="time-outline" style={{ color: '#d97706' }}></ion-icon>
                        </div>
                        <span className={estilos.estadisticaNumero}>{contarPorEstado('pendiente')}</span>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>Pendientes</h3>
                    <p className={estilos.estadisticaDescripcion}>Requieren atención</p>
                </div>

                <div className={estilos.estadisticaCard} style={{ borderColor: '#8b5cf6' }}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIcono} style={{ backgroundColor: '#ede9fe' }}>
                            <ion-icon name="cube-outline" style={{ color: '#7c3aed' }}></ion-icon>
                        </div>
                        <span className={estilos.estadisticaNumero}>{contarPorEstado('en_proceso')}</span>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>En Proceso</h3>
                    <p className={estilos.estadisticaDescripcion}>Siendo preparados</p>
                </div>

                <div className={estilos.estadisticaCard} style={{ borderColor: '#10b981' }}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIcono} style={{ backgroundColor: '#d1fae5' }}>
                            <ion-icon name="checkmark-done-circle-outline" style={{ color: '#059669' }}></ion-icon>
                        </div>
                        <span className={estilos.estadisticaNumero}>{contarPorEstado('entregado')}</span>
                    </div>
                    <h3 className={estilos.estadisticaTitulo}>Entregados</h3>
                    <p className={estilos.estadisticaDescripcion}>Completados hoy</p>
                </div>

                <div className={estilos.estadisticaCardDestacada}>
                    <div className={estilos.estadisticaHeader}>
                        <div className={estilos.estadisticaIconoDestacada}>
                            <ion-icon name="trending-up-outline"></ion-icon>
                        </div>
                        <span className={estilos.estadisticaNumeroDestacada}>
                            RD$ {(calcularTotalVentas() / 1000).toFixed(0)}K
                        </span>
                    </div>
                    <h3 className={estilos.estadisticaTituloDestacada}>Ventas Totales</h3>
                    <p className={estilos.estadisticaDescripcionDestacada}>Pedidos entregados</p>
                </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div className={estilos.filtrosCard}>
                <div className={estilos.busquedaContainer}>
                    <div className={estilos.busquedaInput}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            placeholder="Buscar por número o cliente..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>

                <div className={estilos.filtrosBotones}>
                    <button
                        onClick={() => setFiltroEstado('todos')}
                        className={`${estilos.filtroBoton} ${filtroEstado === 'todos' ? estilos.filtroBotonActivo : ''}`}
                    >
                        Todos
                    </button>
                    {[
                        { estado: 'pendiente', color: '#f59e0b' },
                        { estado: 'confirmado', color: '#3b82f6' },
                        { estado: 'en_proceso', color: '#8b5cf6' },
                        { estado: 'listo', color: '#10b981' },
                        { estado: 'entregado', color: '#059669' },
                        { estado: 'cancelado', color: '#ef4444' }
                    ].map(({ estado, color }) => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            className={`${estilos.filtroBoton} ${filtroEstado === estado ? estilos.filtroBotonActivo : ''}`}
                            style={filtroEstado === estado ? { backgroundColor: color, color: '#ffffff' } : {}}
                        >
                            {obtenerTextoEstado(estado)}
                        </button>
                    ))}
                </div>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <p>Cargando pedidos...</p>
                </div>
            ) : pedidosFiltrados.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="receipt-outline"></ion-icon>
                    <h3>No hay pedidos</h3>
                    <p>No se encontraron pedidos con los filtros seleccionados</p>
                </div>
            ) : (
                <div className={estilos.listaPedidos}>
                    {pedidosFiltrados.map((pedido) => (
                        <div key={pedido.id} className={estilos.pedidoCard}>
                            <div className={estilos.pedidoCardContenido}>
                                <div className={estilos.pedidoHeader}>
                                    <div className={estilos.pedidoHeaderIzq}>
                                        <div className={estilos.pedidoNumeroBadge}>
                                            <h3 className={estilos.numeroPedido}>{pedido.numero_pedido}</h3>
                                            <span
                                                className={estilos.badgeEstado}
                                                style={{ backgroundColor: obtenerColorEstado(pedido.estado) }}
                                            >
                                                <ion-icon name={obtenerIconoEstado(pedido.estado)}></ion-icon>
                                                {obtenerTextoEstado(pedido.estado)}
                                            </span>
                                        </div>
                                        <div className={estilos.pedidoMetadatos}>
                                            <div className={estilos.metadatoItem}>
                                                <ion-icon name="calendar-outline"></ion-icon>
                                                <span>{formatearFecha(pedido.fecha_pedido)}</span>
                                            </div>
                                            <div className={estilos.metadatoItem}>
                                                <ion-icon name={pedido.metodo_entrega === 'delivery' ? 'car-outline' : 'cube-outline'}></ion-icon>
                                                <span>{pedido.metodo_entrega === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={estilos.pedidoHeaderDer}>
                                        <div className={estilos.pedidoTotal}>{formatearMoneda(pedido.total)}</div>
                                        <div className={estilos.pedidoProductos}>
                                            {pedido.cantidad_items || 0} producto{(pedido.cantidad_items || 0) !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                <div className={estilos.pedidoInfoCliente}>
                                    <div className={estilos.clienteCard}>
                                        <div className={estilos.clienteIcono}>
                                            <ion-icon name="call-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.clienteInfo}>
                                            <div className={estilos.clienteLabel}>Cliente</div>
                                            <div className={estilos.clienteNombre}>{pedido.cliente_nombre}</div>
                                            <div className={estilos.clienteTelefono}>{pedido.cliente_telefono}</div>
                                        </div>
                                    </div>

                                    {pedido.metodo_entrega === 'delivery' && pedido.cliente_direccion && (
                                        <div className={estilos.direccionCard}>
                                            <div className={estilos.direccionIcono}>
                                                <ion-icon name="location-outline"></ion-icon>
                                            </div>
                                            <div className={estilos.direccionInfo}>
                                                <div className={estilos.direccionLabel}>Dirección</div>
                                                <div className={estilos.direccionTexto}>{pedido.cliente_direccion}</div>
                                            </div>
                                        </div>
                                    )}

                                    {pedido.notas && (
                                        <div className={estilos.notasCard}>
                                            <div className={estilos.notasIcono}>
                                                <ion-icon name="document-text-outline"></ion-icon>
                                            </div>
                                            <div className={estilos.notasInfo}>
                                                <div className={estilos.notasLabel}>Notas</div>
                                                <div className={estilos.notasTexto}>{pedido.notas}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Productos */}
                                {pedido.items && pedido.items.length > 0 && (
                                    <div className={estilos.productosContainer}>
                                        <div className={estilos.productosLabel}>Productos</div>
                                        <div className={estilos.productosLista}>
                                            {pedido.items.map((item, idx) => (
                                                <div key={idx} className={estilos.productoItem}>
                                                    <div className={estilos.productoImagen}>
                                                        {item.imagen_url ? (
                                                            <img src={item.imagen_url} alt={item.producto_nombre} />
                                                        ) : (
                                                            <ion-icon name="cube-outline"></ion-icon>
                                                        )}
                                                    </div>
                                                    <div className={estilos.productoInfo}>
                                                        <div className={estilos.productoNombre}>{item.producto_nombre}</div>
                                                        <div className={estilos.productoCantidad}>
                                                            {item.cantidad} x {formatearMoneda(item.precio || item.precio_unitario || 0)}
                                                        </div>
                                                    </div>
                                                    <div className={estilos.productoTotal}>
                                                        {formatearMoneda((item.precio || item.precio_unitario || 0) * item.cantidad)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Acciones */}
                                <div className={estilos.pedidoAcciones}>
                                    <Link
                                        href={`/admin/catalogo/pedidos/ver/${pedido.id}`}
                                        className={estilos.botonVerDetalle}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                        <span>Ver Detalle</span>
                                    </Link>
                                    
                                    {pedido.estado === 'pendiente' && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                cambiarEstado(pedido.id, 'confirmado')
                                            }}
                                            className={estilos.botonAccion}
                                            style={{ backgroundColor: '#10b981' }}
                                            disabled={actualizandoEstado === pedido.id}
                                        >
                                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                                            <span>{actualizandoEstado === pedido.id ? 'Actualizando...' : 'Confirmar Pedido'}</span>
                                        </button>
                                    )}
                                    
                                    {pedido.estado === 'confirmado' && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                cambiarEstado(pedido.id, 'en_proceso')
                                            }}
                                            className={estilos.botonAccion}
                                            style={{ backgroundColor: '#8b5cf6' }}
                                            disabled={actualizandoEstado === pedido.id}
                                        >
                                            <ion-icon name="cube-outline"></ion-icon>
                                            <span>{actualizandoEstado === pedido.id ? 'Actualizando...' : 'Iniciar Preparación'}</span>
                                        </button>
                                    )}
                                    
                                    {pedido.estado === 'en_proceso' && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                cambiarEstado(pedido.id, 'listo')
                                            }}
                                            className={estilos.botonAccion}
                                            style={{ backgroundColor: '#10b981' }}
                                            disabled={actualizandoEstado === pedido.id}
                                        >
                                            <ion-icon name="checkmark-done-outline"></ion-icon>
                                            <span>{actualizandoEstado === pedido.id ? 'Actualizando...' : 'Marcar como Listo'}</span>
                                        </button>
                                    )}
                                    
                                    {pedido.estado === 'listo' && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                cambiarEstado(pedido.id, 'entregado')
                                            }}
                                            className={estilos.botonAccion}
                                            style={{ backgroundColor: '#059669' }}
                                            disabled={actualizandoEstado === pedido.id}
                                        >
                                            <ion-icon name="checkmark-done-circle-outline"></ion-icon>
                                            <span>{actualizandoEstado === pedido.id ? 'Actualizando...' : 'Marcar como Entregado'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

