"use client"
import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {obtenerPedidosB2B, obtenerEstadisticasPedidosB2B, actualizarEstadoPedidoB2B} from './servidor'
import estilos from './pedidos.module.css'

export default function PedidosTiendaB2B() {
    const router = useRouter()
    const [pedidos, setPedidos] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [tema, setTema] = useState('light')
    const [procesando, setProcesando] = useState(null)

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
    }, [filtroEstado])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resultadoPedidos, resultadoEstadisticas] = await Promise.all([
                obtenerPedidosB2B(filtroEstado === 'todos' ? 'todos' : filtroEstado, null),
                obtenerEstadisticasPedidosB2B()
            ])

            if (resultadoPedidos.success) {
                setPedidos(resultadoPedidos.pedidos || [])
            }

            if (resultadoEstadisticas.success) {
                setEstadisticas(resultadoEstadisticas.estadisticas)
            }
        } catch (error) {
            console.error('Error al cargar pedidos:', error)
            alert('Error al cargar pedidos')
        } finally {
            setCargando(false)
        }
    }

    const cambiarEstadoPedido = async (pedidoId, nuevoEstado, e) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm(`¿Estás seguro de cambiar el estado a "${obtenerTextoEstado(nuevoEstado)}"?`)) {
            return
        }

        setProcesando(pedidoId)
        try {
            const resultado = await actualizarEstadoPedidoB2B(pedidoId, nuevoEstado)

            if (resultado.success) {
                alert('Estado actualizado correctamente')
                await cargarDatos()
            } else {
                alert(resultado.mensaje || 'Error al actualizar el estado')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al actualizar el estado')
        } finally {
            setProcesando(null)
        }
    }

    const compartirWhatsApp = (pedido, e) => {
        e.preventDefault()
        e.stopPropagation()

        const mensaje = `
¡Hola! 🎉

Tu pedido *${pedido.numero_pedido}* ha sido *CONFIRMADO* y está en proceso de preparación.

📦 *Detalles del pedido:*
• Total: RD$ ${formatearMoneda(pedido.total)}
• Productos: ${pedido.cantidad_items} ${pedido.cantidad_items === 1 ? 'producto' : 'productos'}
• Método de pago: ${obtenerTextoMetodoPago(pedido.metodo_pago)}

¡Pronto recibirás tu pedido! 🚚

Gracias por confiar en nosotros.
        `.trim()

        const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
        window.open(url, '_blank')
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            pendiente: '#f59e0b',
            entregado: '#10b981',
            cancelado: '#ef4444'
        }
        return colores[estado] || '#6b7280'
    }

    const obtenerIconoEstado = (estado) => {
        const iconos = {
            pendiente: 'time-outline',
            entregado: 'checkmark-circle-outline',
            cancelado: 'close-circle-outline'
        }
        return iconos[estado] || 'help-circle-outline'
    }

    const obtenerTextoEstado = (estado) => {
        const textos = {
            pendiente: 'Pendiente',
            entregado: 'Entregado',
            cancelado: 'Cancelado'
        }
        return textos[estado] || estado
    }

    const obtenerTextoMetodoPago = (metodo) => {
        const metodos = {
            contra_entrega: 'Contra Entrega',
            transferencia: 'Transferencia',
            credito: 'Crédito'
        }
        return metodos[metodo] || metodo
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return '-'
        const date = new Date(fecha)
        return date.toLocaleString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(monto || 0)
    }

    const pedidosFiltrados = pedidos.filter(pedido => {
        if (!busqueda) return true
        const busquedaLower = busqueda.toLowerCase()
        return (
            pedido.numero_pedido.toLowerCase().includes(busquedaLower) ||
            (pedido.nombre_comercial || pedido.nombre_empresa).toLowerCase().includes(busquedaLower) ||
            pedido.usuario_nombre.toLowerCase().includes(busquedaLower)
        )
    })

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.tituloContainer}>
                        <div className={estilos.iconoTitulo}>
                            <ion-icon name="storefront"></ion-icon>
                        </div>
                        <div>
                            <h1 className={estilos.titulo}>Pedidos B2B</h1>
                            <p className={estilos.subtitulo}>Gestiona los pedidos de la tienda IsiWeek</p>
                        </div>
                    </div>
                </div>

                <div className={estilos.headerAcciones}>
                    <button
                        className={estilos.btnActualizar}
                        onClick={cargarDatos}
                        disabled={cargando}
                        title="Actualizar datos"
                    >
                        <ion-icon name="refresh-outline"></ion-icon>
                        <span>Actualizar</span>
                    </button>
                    <button
                        className={estilos.btnTienda}
                        onClick={() => router.push('/superadmin/tienda-b2b/productos')}
                        title="Gestionar productos"
                    >
                        <ion-icon name="cube-outline"></ion-icon>
                        <span>Productos</span>
                    </button>
                </div>
            </div>

            {/* Estadísticas */}
            {estadisticas && (
                <div className={estilos.estadisticas}>
                    <div className={estilos.estadCard}>
                        <div className={estilos.estadIcono}
                             style={{background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}}>
                            <ion-icon name="receipt-outline"></ion-icon>
                        </div>
                        <div className={estilos.estadInfo}>
                            <div className={estilos.estadLabel}>Total Pedidos</div>
                            <div className={estilos.estadValor}>{estadisticas.total_pedidos || 0}</div>
                        </div>
                    </div>

                    <div className={estilos.estadCard}>
                        <div className={estilos.estadIcono}
                             style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
                            <ion-icon name="time-outline"></ion-icon>
                        </div>
                        <div className={estilos.estadInfo}>
                            <div className={estilos.estadLabel}>Pendientes</div>
                            <div className={estilos.estadValor}>{estadisticas.pendientes || 0}</div>
                        </div>
                    </div>

                    <div className={estilos.estadCard}>
                        <div className={estilos.estadIcono}
                             style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                        </div>
                        <div className={estilos.estadInfo}>
                            <div className={estilos.estadLabel}>Entregados</div>
                            <div className={estilos.estadValor}>{estadisticas.entregados || 0}</div>
                        </div>
                    </div>

                    <div className={estilos.estadCard}>
                        <div className={estilos.estadIcono}
                             style={{background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'}}>
                            <ion-icon name="cash-outline"></ion-icon>
                        </div>
                        <div className={estilos.estadInfo}>
                            <div className={estilos.estadLabel}>Total Ventas</div>
                            <div
                                className={estilos.estadValor}>RD$ {formatearMoneda(estadisticas.total_ventas || 0)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros y búsqueda */}
            <div className={estilos.controlesBar}>
                <div className={estilos.busquedaContainer}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        className={estilos.inputBusqueda}
                        placeholder="Buscar por número, empresa o usuario..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <button
                            className={estilos.btnLimpiar}
                            onClick={() => setBusqueda('')}
                        >
                            <ion-icon name="close-circle"></ion-icon>
                        </button>
                    )}
                </div>

                <div className={estilos.filtroEstado}>
                    <label>
                        <ion-icon name="funnel-outline"></ion-icon>
                        Estado:
                    </label>
                    <select
                        className={estilos.select}
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="todos">Todos</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="entregado">Entregados</option>
                        <option value="cancelado">Cancelados</option>
                    </select>
                </div>

                <div className={estilos.contador}>
                    <ion-icon name="document-text-outline"></ion-icon>
                    <span>
                        {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
                    </span>
                </div>
            </div>

            {/* Lista de pedidos */}
            {cargando ? (
                <div className={estilos.cargando}>
                    <div className={estilos.spinner}></div>
                    <p>Cargando pedidos...</p>
                </div>
            ) : pedidosFiltrados.length === 0 ? (
                <div className={estilos.vacio}>
                    <div className={estilos.vacioIcono}>
                        <ion-icon name="receipt-outline"></ion-icon>
                    </div>
                    <h3>No hay pedidos</h3>
                    <p>
                        {busqueda
                            ? 'No se encontraron pedidos que coincidan con tu búsqueda'
                            : filtroEstado !== 'todos'
                                ? `No hay pedidos con estado "${obtenerTextoEstado(filtroEstado)}"`
                                : 'Aún no se han realizado pedidos en la tienda B2B'}
                    </p>
                </div>
            ) : (
                <div className={estilos.listaPedidos}>
                    {pedidosFiltrados.map((pedido) => (
                        <div key={pedido.id} className={estilos.pedidoCard}>
                            {/* Header del pedido */}
                            <div className={estilos.pedidoHeader}>
                                <div className={estilos.pedidoNumero}>
                                    <ion-icon name="receipt"></ion-icon>
                                    <span>{pedido.numero_pedido}</span>
                                </div>

                                <span
                                    className={estilos.badgeEstado}
                                    style={{backgroundColor: obtenerColorEstado(pedido.estado)}}
                                >
                                    <ion-icon name={obtenerIconoEstado(pedido.estado)}></ion-icon>
                                    {obtenerTextoEstado(pedido.estado)}
                                </span>
                            </div>

                            {/* Información principal */}
                            <div className={estilos.pedidoContenido}>
                                <div className={estilos.empresaSection}>
                                    <div className={estilos.empresaIcono}>
                                        <ion-icon name="business"></ion-icon>
                                    </div>
                                    <div className={estilos.empresaInfo}>
                                        <h3 className={estilos.empresaNombre}>
                                            {pedido.nombre_comercial || pedido.nombre_empresa}
                                        </h3>
                                        <p className={estilos.usuarioInfo}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            {pedido.usuario_nombre}
                                        </p>
                                    </div>
                                </div>

                                {/* Productos del pedido */}
                                {pedido.items && pedido.items.length > 0 && (
                                    <div className={estilos.productosPreview}>
                                        <div className={estilos.productosHeader}>
                                            <div className={estilos.productosHeaderInfo}>
                                                <ion-icon name="cube-outline"></ion-icon>
                                                <span>Productos del pedido</span>
                                            </div>
                                            <span className={estilos.productosCantidad}>
                {pedido.items.length} items
            </span>
                                        </div>

                                        <div className={estilos.productosLista}>
                                            {pedido.items.slice(0, 3).map((item) => (
                                                <div key={item.id} className={estilos.productoMini}>
                                                    <div className={estilos.productoMiniImagen}>
                                                        {item.imagen_url ? (
                                                            <img
                                                                src={item.imagen_url}
                                                                alt={item.producto_nombre}
                                                            />
                                                        ) : (
                                                            <ion-icon name="image-outline"></ion-icon>
                                                        )}
                                                    </div>

                                                    <div className={estilos.productoMiniInfo}>
                                                        <p className={estilos.productoMiniNombre}>
                                                            {item.producto_nombre}
                                                        </p>
                                                        <p className={estilos.productoMiniDetalle}>
                                                            {item.cantidad} × {formatearMoneda(item.precio_aplicado)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}

                                            {pedido.items.length > 3 && (
                                                <div className={estilos.masProductos}>
                                                    +{pedido.items.length - 3} productos adicionales
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Detalles del pedido */}
                                <div className={estilos.pedidoDetalles}>
                                    <div className={estilos.detalleItem}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.detalleLabel}>Fecha</span>
                                            <span
                                                className={estilos.detalleValor}>{formatearFecha(pedido.fecha_pedido)}</span>
                                        </div>
                                    </div>

                                    <div className={estilos.detalleItem}>
                                        <ion-icon name="card-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.detalleLabel}>Pago</span>
                                            <span className={estilos.detalleValor}>
                                                {obtenerTextoMetodoPago(pedido.metodo_pago)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={estilos.detalleItem}>
                                        <ion-icon name="cash-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.detalleLabel}>Total</span>
                                            <span className={estilos.detalleValorDestacado}>
                                                RD$ {formatearMoneda(pedido.total)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notas si existen */}
                                {pedido.notas && (
                                    <div className={estilos.notasSection}>
                                        <ion-icon name="document-text-outline"></ion-icon>
                                        <span>{pedido.notas}</span>
                                    </div>
                                )}

                                {/* Acciones rápidas */}
                                <div className={estilos.accionesRapidas}>
                                    <Link
                                        href={`/superadmin/tienda-b2b/pedidos/ver/${pedido.id}`}
                                        className={estilos.btnVerDetalle}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                        <span>Ver detalles</span>
                                    </Link>

                                    {/* WhatsApp siempre disponible */}
                                    <button
                                        className={estilos.btnWhatsApp}
                                        onClick={(e) => compartirWhatsApp(pedido, e)}
                                    >
                                        <ion-icon name="logo-whatsapp"></ion-icon>
                                        <span>WhatsApp</span>
                                    </button>

                                    {/* Acciones solo si está pendiente */}
                                    {pedido.estado === 'pendiente' && (
                                        <>
                                            <button
                                                className={estilos.btnEntregar}
                                                onClick={(e) => cambiarEstadoPedido(pedido.id, 'entregado', e)}
                                                disabled={procesando === pedido.id}
                                            >
                                                {procesando === pedido.id ? (
                                                    <div className={estilos.spinnerSmall}></div>
                                                ) : (
                                                    <>
                                                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                                                        <span>Entregar</span>
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                className={estilos.btnCancelar}
                                                onClick={(e) => cambiarEstadoPedido(pedido.id, 'cancelado', e)}
                                                disabled={procesando === pedido.id}
                                            >
                                                <ion-icon name="close-circle-outline"></ion-icon>
                                                <span>Cancelar</span>
                                            </button>
                                        </>
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