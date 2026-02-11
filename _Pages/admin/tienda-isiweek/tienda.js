"use client"
import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {
    obtenerProductosTiendaIsiWeek,
    obtenerCategoriasTiendaIsiWeek,
    crearPedidoB2B
} from './servidor'

import estilos from './tienda.module.css'

const generarLinkWhatsApp = (telefono, mensaje) => {
    const numero = telefono.replace(/[^\d]/g, '')
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}

const mensajePedidoWhatsApp = ({ numeroPedido, total }) => `
📦 *Nuevo pedido B2B confirmado*

🧾 Pedido: ${numeroPedido}
💰 Total: RD$ ${total}

Ingresar al panel para gestionarlo.
`.trim()



export default function TiendaIsiWeek() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [carrito, setCarrito] = useState([])
    const [filtroCategoria, setFiltroCategoria] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [mostrarCarrito, setMostrarCarrito] = useState(false)
    const [productoDetalle, setProductoDetalle] = useState(null)
    const [imagenModal, setImagenModal] = useState(null)
    const [vistaActual, setVistaActual] = useState('grid') // 'grid' o 'lista'

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        // Cargar carrito desde localStorage
        const carritoGuardado = localStorage.getItem('carrito_isiweek')
        if (carritoGuardado) {
            try {
                setCarrito(JSON.parse(carritoGuardado))
            } catch (e) {
                console.error('Error al cargar carrito:', e)
            }
        }

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        cargarDatos()
    }, [])

    useEffect(() => {
        localStorage.setItem('carrito_isiweek', JSON.stringify(carrito))
    }, [carrito])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resultadoProductos, resultadoCategorias] = await Promise.all([
                obtenerProductosTiendaIsiWeek(filtroCategoria === 'todos' ? null : parseInt(filtroCategoria)),
                obtenerCategoriasTiendaIsiWeek()
            ])

            if (resultadoProductos.success) {
                setProductos(resultadoProductos.productos || [])
            }

            if (resultadoCategorias.success) {
                setCategorias(resultadoCategorias.categorias || [])
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos de la tienda')
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargarDatos()
    }, [filtroCategoria])

    const agregarAlCarrito = (producto, cantidad = 1) => {
        const existente = carrito.find(item => item.id === producto.id)
        if (existente) {
            setCarrito(carrito.map(item =>
                item.id === producto.id
                    ? {...item, cantidad: item.cantidad + cantidad}
                    : item
            ))
        } else {
            setCarrito([...carrito, {...producto, cantidad}])
        }
    }

    const actualizarCantidad = (productoId, nuevaCantidad) => {
        if (nuevaCantidad <= 0) {
            setCarrito(carrito.filter(item => item.id !== productoId))
        } else {
            setCarrito(carrito.map(item =>
                item.id === productoId
                    ? {...item, cantidad: nuevaCantidad}
                    : item
            ))
        }
    }

    const eliminarDelCarrito = (productoId) => {
        setCarrito(carrito.filter(item => item.id !== productoId))
    }

    const vaciarCarrito = () => {
        if (confirm('¿Estás seguro de vaciar el carrito?')) {
            setCarrito([])
        }
    }

    const calcularSubtotal = () => {
        return carrito.reduce((total, item) => {
            const precio = obtenerPrecioProducto(item, item.cantidad)
            return total + (precio * item.cantidad)
        }, 0)
    }

    const calcularAhorroTotal = () => {
        return carrito.reduce((total, item) => {
            if (item.precio_volumen && item.cantidad_volumen && item.cantidad >= item.cantidad_volumen) {
                const ahorro = (item.precio - item.precio_volumen) * item.cantidad
                return total + ahorro
            }
            return total
        }, 0)
    }

    const obtenerPrecioProducto = (producto, cantidad) => {
        if (producto.precio_volumen && producto.cantidad_volumen && cantidad >= producto.cantidad_volumen) {
            return producto.precio_volumen
        }
        return producto.precio
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const abrirImagenModal = (imagen, nombre) => {
        setImagenModal({url: imagen, nombre})
    }

    const abrirDetalleProducto = (producto) => {
        setProductoDetalle(producto)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.spinner}></div>
                    <span>Cargando tienda IsiWeek...</span>
                </div>
            </div>
        )
    }

    const productosFiltrados = productos.filter(p => {
        if (busqueda) {
            const busquedaLower = busqueda.toLowerCase()
            return p.nombre.toLowerCase().includes(busquedaLower) ||
                (p.sku && p.sku.toLowerCase().includes(busquedaLower)) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(busquedaLower))
        }
        return true
    })

    const cantidadItemsCarrito = carrito.reduce((total, item) => total + item.cantidad, 0)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Modal de imagen */}
            {imagenModal && (
                <div className={estilos.modalImagen} onClick={() => setImagenModal(null)}>
                    <div className={estilos.modalContenido} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={estilos.modalCerrar}
                            onClick={() => setImagenModal(null)}
                            aria-label="Cerrar"
                        >
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                        <img src={imagenModal.url} alt={imagenModal.nombre}/>
                        <p className={estilos.modalTitulo}>{imagenModal.nombre}</p>
                    </div>
                </div>
            )}

            {/* Header mejorado */}
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.logoContainer}>
                        <div className={estilos.logoCirculo}>
                            <ion-icon name="storefront"></ion-icon>
                        </div>
                        <div>
                            <h1 className={estilos.titulo}>Tienda IsiWeek</h1>
                            <p className={estilos.subtitulo}>Compra insumos, equipos y servicios para tu negocio</p>
                        </div>
                    </div>
                </div>

                <div className={estilos.headerAcciones}>
                    <button
                        className={estilos.btnHistorial}
                        onClick={() => router.push('/admin/tienda-isiweek')}
                        title="Ver historial de pedidos"
                    >
                        <ion-icon name="time-outline"></ion-icon>
                        <span>Historial</span>
                    </button>

                    <button
                        className={estilos.btnCarrito}
                        onClick={() => setMostrarCarrito(true)}
                    >
                        <ion-icon name="cart-outline"></ion-icon>
                        <div className={estilos.carritoInfo}>
                            <span className={estilos.carritoLabel}>Carrito</span>
                            <span className={estilos.carritoContador}>{cantidadItemsCarrito} items</span>
                        </div>
                        {carrito.length > 0 && (
                            <span className={estilos.carritoBadge}>{carrito.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Barra de categorías con scroll horizontal */}
            <div className={estilos.categoriasBar}>
                <button
                    className={`${estilos.categoriaChip} ${filtroCategoria === 'todos' ? estilos.activo : ''}`}
                    onClick={() => setFiltroCategoria('todos')}
                >
                    <ion-icon name="apps-outline"></ion-icon>
                    <span>Todos</span>
                </button>
                {categorias.map(cat => (
                    <button
                        key={cat.id}
                        className={`${estilos.categoriaChip} ${filtroCategoria === cat.id ? estilos.activo : ''}`}
                        onClick={() => setFiltroCategoria(cat.id)}
                    >
                        <span>{cat.nombre}</span>
                        {cat.cantidad_productos > 0 && (
                            <span className={estilos.cantidadBadge}>{cat.cantidad_productos}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Barra de búsqueda y controles */}
            <div className={estilos.controlesBar}>
                <div className={estilos.busquedaAvanzada}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        className={estilos.inputBusqueda}
                        placeholder="Buscar por nombre, SKU o descripción..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <button
                            className={estilos.btnLimpiarBusqueda}
                            onClick={() => setBusqueda('')}
                        >
                            <ion-icon name="close-circle"></ion-icon>
                        </button>
                    )}
                </div>

                <div className={estilos.vistaControles}>
                    <button
                        className={`${estilos.btnVista} ${vistaActual === 'grid' ? estilos.activo : ''}`}
                        onClick={() => setVistaActual('grid')}
                        title="Vista en cuadrícula"
                    >
                        <ion-icon name="grid-outline"></ion-icon>
                    </button>
                    <button
                        className={`${estilos.btnVista} ${vistaActual === 'lista' ? estilos.activo : ''}`}
                        onClick={() => setVistaActual('lista')}
                        title="Vista en lista"
                    >
                        <ion-icon name="list-outline"></ion-icon>
                    </button>
                </div>

                <div className={estilos.contador}>
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>{productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'}</span>
                </div>
            </div>

            {/* Alerta de ahorro si hay items con descuento por volumen */}
            {calcularAhorroTotal() > 0 && (
                <div className={estilos.alertaAhorro}>
                    <ion-icon name="pricetag"></ion-icon>
                    <div>
                        <strong>¡Estás ahorrando!</strong>
                        <span>Descuento por volumen aplicado: {formatearMoneda(calcularAhorroTotal())}</span>
                    </div>
                </div>
            )}

            {/* Productos */}
            {productosFiltrados.length === 0 ? (
                <div className={estilos.vacio}>
                    <div className={estilos.vacioIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <h3>No hay productos disponibles</h3>
                    <p>
                        {busqueda
                            ? 'No se encontraron productos que coincidan con tu búsqueda'
                            : 'No hay productos en esta categoría'}
                    </p>
                </div>
            ) : (
                <div className={vistaActual === 'grid' ? estilos.grid : estilos.lista}>
                    {productosFiltrados.map((producto) => {
                        const enCarrito = carrito.find(item => item.id === producto.id)
                        const cantidadCarrito = enCarrito ? enCarrito.cantidad : 0

                        return vistaActual === 'grid' ? (
                            <TarjetaProductoGrid
                                key={producto.id}
                                producto={producto}
                                cantidadCarrito={cantidadCarrito}
                                onAgregarCarrito={agregarAlCarrito}
                                onActualizarCantidad={actualizarCantidad}
                                onVerDetalle={abrirDetalleProducto}
                                onVerImagen={abrirImagenModal}
                                formatearMoneda={formatearMoneda}
                                obtenerPrecioProducto={obtenerPrecioProducto}
                                tema={tema}
                            />
                        ) : (
                            <TarjetaProductoLista
                                key={producto.id}
                                producto={producto}
                                cantidadCarrito={cantidadCarrito}
                                onAgregarCarrito={agregarAlCarrito}
                                onActualizarCantidad={actualizarCantidad}
                                onVerDetalle={abrirDetalleProducto}
                                onVerImagen={abrirImagenModal}
                                formatearMoneda={formatearMoneda}
                                obtenerPrecioProducto={obtenerPrecioProducto}
                                tema={tema}
                            />
                        )
                    })}
                </div>
            )}

            {/* Modal de carrito */}
            {mostrarCarrito && (
                <CarritoModal
                    carrito={carrito}
                    onCerrar={() => setMostrarCarrito(false)}
                    onActualizarCantidad={actualizarCantidad}
                    onEliminar={eliminarDelCarrito}
                    onVaciar={vaciarCarrito}
                    calcularSubtotal={calcularSubtotal}
                    calcularAhorroTotal={calcularAhorroTotal}
                    obtenerPrecioProducto={obtenerPrecioProducto}
                    formatearMoneda={formatearMoneda}
                    tema={tema}
                />
            )}

            {/* Modal de detalle del producto */}
            {productoDetalle && (
                <DetalleProductoModal
                    producto={productoDetalle}
                    onCerrar={() => setProductoDetalle(null)}
                    onAgregarCarrito={agregarAlCarrito}
                    cantidadEnCarrito={carrito.find(item => item.id === productoDetalle.id)?.cantidad || 0}
                    formatearMoneda={formatearMoneda}
                    obtenerPrecioProducto={obtenerPrecioProducto}
                    tema={tema}
                />
            )}
        </div>
    )
}

// Componente: Tarjeta de producto en vista grid
function TarjetaProductoGrid({
                                 producto,
                                 cantidadCarrito,
                                 onAgregarCarrito,
                                 onActualizarCantidad,
                                 onVerDetalle,
                                 onVerImagen,
                                 formatearMoneda,
                                 obtenerPrecioProducto,
                                 tema
                             }) {
    const precioActual = obtenerPrecioProducto(producto, cantidadCarrito || 1)
    const tieneDescuentoVolumen = producto.precio_volumen && producto.cantidad_volumen

    return (
        <div className={estilos.productoCard}>
            {/* Badges superiores */}
            <div className={estilos.badgesContainer}>
                {producto.destacado && (
                    <span className={estilos.badgeDestacado}>
                        <ion-icon name="star"></ion-icon>
                        Destacado
                    </span>
                )}
                {tieneDescuentoVolumen && (
                    <span className={estilos.badgeVolumen}>
                        <ion-icon name="pricetag"></ion-icon>
                        Precio por volumen
                    </span>
                )}
            </div>

            {/* Imagen */}
            <div className={estilos.imagenContainer}>
                {producto.imagen_url ? (
                    <>
                        <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className={estilos.imagen}
                            loading="lazy"
                        />
                        <button
                            className={estilos.btnZoom}
                            onClick={() => onVerImagen(producto.imagen_url, producto.nombre)}
                            aria-label="Ver imagen completa"
                        >
                            <ion-icon name="expand-outline"></ion-icon>
                        </button>
                    </>
                ) : (
                    <div className={estilos.imagenPlaceholder}>
                        <ion-icon name="image-outline"></ion-icon>
                        <span>Sin imagen</span>
                    </div>
                )}
            </div>

            <div className={estilos.productoInfo}>
                {/* Nombre y SKU */}
                <div className={estilos.productoHeader}>
                    <h3 className={estilos.productoNombre}>{producto.nombre}</h3>
                    {producto.sku && (
                        <span className={estilos.sku}>SKU: {producto.sku}</span>
                    )}
                </div>

                {/* Descripción */}
                {producto.descripcion && (
                    <p className={estilos.descripcion}>
                        {producto.descripcion.length > 100
                            ? `${producto.descripcion.substring(0, 100)}...`
                            : producto.descripcion}
                    </p>
                )}

                {/* Detalles */}
                <div className={estilos.detalles}>
                    <div className={estilos.detalleItem}>
                        <ion-icon name="layers-outline"></ion-icon>
                        <span className={estilos.detalleLabel}>Stock:</span>
                        <span className={`${estilos.detalleValor} ${
                            producto.stock > 10 ? estilos.stockBueno :
                                producto.stock > 0 ? estilos.stockBajo :
                                    estilos.stockAgotado
                        }`}>
                            {producto.stock} unidades
                        </span>
                    </div>

                    {producto.tiempo_entrega && (
                        <div className={estilos.detalleItem}>
                            <ion-icon name="time-outline"></ion-icon>
                            <span className={estilos.detalleLabel}>Entrega:</span>
                            <span className={estilos.detalleValor}>{producto.tiempo_entrega}</span>
                        </div>
                    )}

                    {producto.categoria_nombre && (
                        <div className={estilos.detalleItem}>
                            <ion-icon name="pricetag-outline"></ion-icon>
                            <span className={estilos.detalleLabel}>Categoría:</span>
                            <span className={estilos.detalleValor}>{producto.categoria_nombre}</span>
                        </div>
                    )}
                </div>

                {/* Precios */}
                <div className={estilos.precios}>
                    <div className={estilos.precioPrincipal}>
                        <span className={estilos.precioLabel}>Precio:</span>
                        <span className={estilos.precioValor}>{formatearMoneda(precioActual)}</span>
                    </div>

                    {tieneDescuentoVolumen && (
                        <div className={estilos.precioVolumen}>
                            <ion-icon name="people-outline"></ion-icon>
                            <div className={estilos.precioVolumenInfo}>
                                <span>Compra {producto.cantidad_volumen}+ unidades</span>
                                <strong>{formatearMoneda(producto.precio_volumen)} c/u</strong>
                            </div>
                            {cantidadCarrito >= producto.cantidad_volumen && (
                                <span className={estilos.descuentoAplicado}>
                                    <ion-icon name="checkmark-circle"></ion-icon>
                                    Descuento aplicado
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Acciones */}
                <div className={estilos.acciones}>
                    <button
                        className={estilos.btnVerMas}
                        onClick={() => onVerDetalle(producto)}
                    >
                        <ion-icon name="information-circle-outline"></ion-icon>
                        <span>Ver detalles</span>
                    </button>

                    {cantidadCarrito > 0 ? (
                        <div className={estilos.controlesCantidad}>
                            <button
                                className={estilos.btnCantidad}
                                onClick={() => onActualizarCantidad(producto.id, cantidadCarrito - 1)}
                            >
                                <ion-icon name="remove-outline"></ion-icon>
                            </button>
                            <span className={estilos.cantidad}>{cantidadCarrito}</span>
                            <button
                                className={estilos.btnCantidad}
                                onClick={() => onActualizarCantidad(producto.id, cantidadCarrito + 1)}
                                disabled={producto.stock <= cantidadCarrito}
                            >
                                <ion-icon name="add-outline"></ion-icon>
                            </button>
                        </div>
                    ) : (
                        <button
                            className={estilos.btnAgregar}
                            onClick={() => onAgregarCarrito(producto, 1)}
                            disabled={producto.stock <= 0}
                        >
                            <ion-icon name="cart-outline"></ion-icon>
                            <span>Agregar al carrito</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Componente: Tarjeta de producto en vista lista
function TarjetaProductoLista({
                                  producto,
                                  cantidadCarrito,
                                  onAgregarCarrito,
                                  onActualizarCantidad,
                                  onVerDetalle,
                                  onVerImagen,
                                  formatearMoneda,
                                  obtenerPrecioProducto,
                                  tema
                              }) {
    const precioActual = obtenerPrecioProducto(producto, cantidadCarrito || 1)
    const tieneDescuentoVolumen = producto.precio_volumen && producto.cantidad_volumen

    return (
        <div className={estilos.productoCardLista}>
            {/* Imagen */}
            <div className={estilos.imagenContainerLista}>
                {producto.imagen_url ? (
                    <>
                        <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className={estilos.imagenLista}
                            loading="lazy"
                            onClick={() => onVerImagen(producto.imagen_url, producto.nombre)}
                        />
                    </>
                ) : (
                    <div className={estilos.imagenPlaceholderLista}>
                        <ion-icon name="image-outline"></ion-icon>
                    </div>
                )}
            </div>

            {/* Información principal */}
            <div className={estilos.productoInfoLista}>
                <div className={estilos.productoHeaderLista}>
                    <div>
                        <h3 className={estilos.productoNombreLista}>{producto.nombre}</h3>
                        {producto.sku && <span className={estilos.skuLista}>SKU: {producto.sku}</span>}
                    </div>
                    <div className={estilos.badgesLista}>
                        {producto.destacado && (
                            <span className={estilos.badgeDestacadoLista}>
                                <ion-icon name="star"></ion-icon>
                            </span>
                        )}
                    </div>
                </div>

                {producto.descripcion && (
                    <p className={estilos.descripcionLista}>
                        {producto.descripcion.length > 150
                            ? `${producto.descripcion.substring(0, 150)}...`
                            : producto.descripcion}
                    </p>
                )}

                <div className={estilos.detallesLista}>
                    <span className={`${estilos.stockBadge} ${
                        producto.stock > 10 ? estilos.stockBueno :
                            producto.stock > 0 ? estilos.stockBajo :
                                estilos.stockAgotado
                    }`}>
                        <ion-icon name="layers-outline"></ion-icon>
                        {producto.stock} unidades
                    </span>

                    {producto.tiempo_entrega && (
                        <span className={estilos.entregaBadge}>
                            <ion-icon name="time-outline"></ion-icon>
                            {producto.tiempo_entrega}
                        </span>
                    )}

                    {producto.categoria_nombre && (
                        <span className={estilos.categoriaBadge}>
                            <ion-icon name="pricetag-outline"></ion-icon>
                            {producto.categoria_nombre}
                        </span>
                    )}
                </div>
            </div>

            {/* Precios y acciones */}
            <div className={estilos.accionesLista}>
                <div className={estilos.preciosLista}>
                    <div className={estilos.precioPrincipalLista}>
                        {formatearMoneda(precioActual)}
                    </div>
                    {tieneDescuentoVolumen && (
                        <div className={estilos.precioVolumenLista}>
                            <ion-icon name="people-outline"></ion-icon>
                            {producto.cantidad_volumen}+ por {formatearMoneda(producto.precio_volumen)}
                        </div>
                    )}
                </div>

                <div className={estilos.botonesLista}>
                    <button
                        className={estilos.btnVerMasLista}
                        onClick={() => onVerDetalle(producto)}
                        title="Ver detalles"
                    >
                        <ion-icon name="information-circle-outline"></ion-icon>
                    </button>

                    {cantidadCarrito > 0 ? (
                        <div className={estilos.controlesCantidadLista}>
                            <button
                                className={estilos.btnCantidadLista}
                                onClick={() => onActualizarCantidad(producto.id, cantidadCarrito - 1)}
                            >
                                <ion-icon name="remove-outline"></ion-icon>
                            </button>
                            <span className={estilos.cantidadLista}>{cantidadCarrito}</span>
                            <button
                                className={estilos.btnCantidadLista}
                                onClick={() => onActualizarCantidad(producto.id, cantidadCarrito + 1)}
                                disabled={producto.stock <= cantidadCarrito}
                            >
                                <ion-icon name="add-outline"></ion-icon>
                            </button>
                        </div>
                    ) : (
                        <button
                            className={estilos.btnAgregarLista}
                            onClick={() => onAgregarCarrito(producto, 1)}
                            disabled={producto.stock <= 0}
                        >
                            <ion-icon name="cart-outline"></ion-icon>
                            Agregar
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Componente: Modal de detalle del producto
function DetalleProductoModal({
                                  producto,
                                  onCerrar,
                                  onAgregarCarrito,
                                  cantidadEnCarrito,
                                  formatearMoneda,
                                  obtenerPrecioProducto,
                                  tema
                              }) {
    const [cantidad, setCantidad] = useState(1)
    const precioActual = obtenerPrecioProducto(producto, cantidad)
    const tieneDescuentoVolumen = producto.precio_volumen && producto.cantidad_volumen
    const descuentoPorcentaje = tieneDescuentoVolumen
        ? ((producto.precio - producto.precio_volumen) / producto.precio * 100).toFixed(0)
        : 0

    const manejarAgregar = () => {
        onAgregarCarrito(producto, cantidad)
        onCerrar()
    }

    return (
        <div className={estilos.modalOverlay} onClick={onCerrar}>
            <div className={`${estilos.modalDetalleContent} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                <button className={estilos.modalCerrarDetalle} onClick={onCerrar}>
                    <ion-icon name="close-outline"></ion-icon>
                </button>

                <div className={estilos.detalleLayout}>
                    {/* Columna izquierda - Imagen */}
                    <div className={estilos.detalleImagenSection}>
                        {producto.imagen_url ? (
                            <img src={producto.imagen_url} alt={producto.nombre} className={estilos.detalleImagen}/>
                        ) : (
                            <div className={estilos.detalleImagenPlaceholder}>
                                <ion-icon name="image-outline"></ion-icon>
                                <span>Sin imagen disponible</span>
                            </div>
                        )}

                        {producto.destacado && (
                            <div className={estilos.detalleDestacadoBadge}>
                                <ion-icon name="star"></ion-icon>
                                Producto Destacado
                            </div>
                        )}
                    </div>

                    {/* Columna derecha - Información */}
                    <div className={estilos.detalleInfoSection}>
                        <div className={estilos.detalleHeader}>
                            <h2 className={estilos.detalleTitulo}>{producto.nombre}</h2>
                            {producto.sku && (
                                <span className={estilos.detalleSku}>SKU: {producto.sku}</span>
                            )}
                        </div>

                        {producto.descripcion && (
                            <div className={estilos.detalleDescripcion}>
                                <h4>Descripción</h4>
                                <p>{producto.descripcion}</p>
                            </div>
                        )}

                        <div className={estilos.detalleEspecificaciones}>
                            <h4>Especificaciones</h4>
                            <div className={estilos.especificacionesGrid}>
                                <div className={estilos.especItem}>
                                    <ion-icon name="layers-outline"></ion-icon>
                                    <div>
                                        <span className={estilos.especLabel}>Stock disponible</span>
                                        <span className={`${estilos.especValor} ${
                                            producto.stock > 10 ? estilos.stockBueno :
                                                producto.stock > 0 ? estilos.stockBajo :
                                                    estilos.stockAgotado
                                        }`}>
                                            {producto.stock} unidades
                                        </span>
                                    </div>
                                </div>

                                {producto.tiempo_entrega && (
                                    <div className={estilos.especItem}>
                                        <ion-icon name="time-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.especLabel}>Tiempo de entrega</span>
                                            <span className={estilos.especValor}>{producto.tiempo_entrega}</span>
                                        </div>
                                    </div>
                                )}

                                {producto.categoria_nombre && (
                                    <div className={estilos.especItem}>
                                        <ion-icon name="pricetag-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.especLabel}>Categoría</span>
                                            <span className={estilos.especValor}>{producto.categoria_nombre}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Precios */}
                        <div className={estilos.detallePreciosCard}>
                            <div className={estilos.precioPrincipalDetalle}>
                                <span className={estilos.precioLabelDetalle}>Precio unitario</span>
                                <span className={estilos.precioValorDetalle}>{formatearMoneda(precioActual)}</span>
                            </div>

                            {tieneDescuentoVolumen && (
                                <div className={estilos.precioVolumenDetalle}>
                                    <div className={estilos.precioVolumenHeader}>
                                        <ion-icon name="pricetag"></ion-icon>
                                        <span>Descuento por volumen (-{descuentoPorcentaje}%)</span>
                                    </div>
                                    <div className={estilos.precioVolumenBody}>
                                        <div>
                                            <span>Compra {producto.cantidad_volumen}+ unidades</span>
                                            <strong>{formatearMoneda(producto.precio_volumen)} c/u</strong>
                                        </div>
                                        {cantidad >= producto.cantidad_volumen && (
                                            <span className={estilos.descuentoAplicadoDetalle}>
                                                <ion-icon name="checkmark-circle"></ion-icon>
                                                Aplicado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selector de cantidad y total */}
                        <div className={estilos.detalleAccionesCard}>
                            <div className={estilos.detalleCantidadSelector}>
                                <label>Cantidad</label>
                                <div className={estilos.cantidadControles}>
                                    <button
                                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                        className={estilos.btnCantidadDetalle}
                                    >
                                        <ion-icon name="remove-outline"></ion-icon>
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={producto.stock}
                                        value={cantidad}
                                        onChange={(e) => setCantidad(Math.max(1, Math.min(producto.stock, parseInt(e.target.value) || 1)))}
                                        className={estilos.inputCantidad}
                                    />
                                    <button
                                        onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                                        className={estilos.btnCantidadDetalle}
                                        disabled={cantidad >= producto.stock}
                                    >
                                        <ion-icon name="add-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>

                            <div className={estilos.detalleTotal}>
                                <span>Total:</span>
                                <strong>{formatearMoneda(precioActual * cantidad)}</strong>
                            </div>

                            <button
                                className={estilos.btnAgregarDetalle}
                                onClick={manejarAgregar}
                                disabled={producto.stock <= 0}
                            >
                                <ion-icon name="cart-outline"></ion-icon>
                                {cantidadEnCarrito > 0
                                    ? `Agregar más al carrito (${cantidadEnCarrito} ya agregados)`
                                    : 'Agregar al carrito'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Componente: Modal del carrito (continuará en el siguiente mensaje)
function CarritoModal({
                          carrito,
                          onCerrar,
                          onActualizarCantidad,
                          onEliminar,
                          onVaciar,
                          calcularSubtotal,
                          calcularAhorroTotal,
                          obtenerPrecioProducto,
                          formatearMoneda,
                          tema
                      }) {
    const [procesando, setProcesando] = useState(false)
    const [metodoPago, setMetodoPago] = useState('contra_entrega')
    const [notas, setNotas] = useState('')
    const router = useRouter()

    const manejarCrearPedido = async () => {
        if (carrito.length === 0) {
            alert('El carrito está vacío')
            return
        }

        if (!confirm('¿Confirmar pedido? Se enviará a IsiWeek para su procesamiento.')) {
            return
        }

        setProcesando(true)
        try {
            const items = carrito.map(item => ({
                producto_id: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                precio_volumen: item.precio_volumen,
                cantidad_volumen: item.cantidad_volumen
            }))

            const resultado = await crearPedidoB2B({
                items: items,
                metodo_pago: metodoPago,
                notas: notas
            })

            if (resultado.success) {
                alert(`¡Pedido creado exitosamente!\n\nNúmero de pedido: ${resultado.numeroPedido}\n\nPuedes hacer seguimiento en la sección de historial.`)
                localStorage.removeItem('carrito_isiweek')
                router.push('/admin/tienda-isiweek')
            } else {
                alert('Error al crear pedido: ' + resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al crear pedido:', error)
            alert('Error al procesar el pedido. Por favor intenta nuevamente.')
        } finally {
            setProcesando(false)
        }
    }

    const subtotal = calcularSubtotal()
    const ahorro = calcularAhorroTotal()

    return (
        <div className={estilos.modalOverlay} onClick={onCerrar}>
            <div className={`${estilos.modalCarritoContent} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={estilos.modalHeader}>
                    <div>
                        <h2 className={estilos.modalTitulo}>
                            <ion-icon name="cart"></ion-icon>
                            Carrito de Compras
                        </h2>
                        <p className={estilos.modalSubtitulo}>
                            {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'} •
                            {carrito.reduce((total, item) => total + item.cantidad, 0)} items totales
                        </p>
                    </div>
                    <div className={estilos.modalHeaderAcciones}>
                        {carrito.length > 0 && (
                            <button className={estilos.btnVaciarCarrito} onClick={onVaciar}>
                                <ion-icon name="trash-outline"></ion-icon>
                                Vaciar
                            </button>
                        )}
                        <button className={estilos.btnCerrar} onClick={onCerrar}>
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className={estilos.modalBody}>
                    {carrito.length === 0 ? (
                        <div className={estilos.carritoVacio}>
                            <div className={estilos.carritoVacioIcono}>
                                <ion-icon name="cart-outline"></ion-icon>
                            </div>
                            <h3>Tu carrito está vacío</h3>
                            <p>Agrega productos de la tienda para comenzar tu pedido</p>
                            <button className={estilos.btnSeguirComprando} onClick={onCerrar}>
                                <ion-icon name="storefront-outline"></ion-icon>
                                Seguir comprando
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Lista de items */}
                            <div className={estilos.listaCarrito}>
                                {carrito.map((item) => {
                                    const precioActual = obtenerPrecioProducto(item, item.cantidad)
                                    const tieneDescuento = item.precio_volumen && item.cantidad >= item.cantidad_volumen

                                    return (
                                        <div key={item.id} className={estilos.itemCarrito}>
                                            <div className={estilos.itemImagenContainer}>
                                                {item.imagen_url ? (
                                                    <img src={item.imagen_url} alt={item.nombre}/>
                                                ) : (
                                                    <div className={estilos.itemImagenPlaceholder}>
                                                        <ion-icon name="image-outline"></ion-icon>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={estilos.itemInfo}>
                                                <h4 className={estilos.itemNombre}>{item.nombre}</h4>
                                                {item.sku && (
                                                    <span className={estilos.itemSku}>SKU: {item.sku}</span>
                                                )}
                                                <div className={estilos.itemPrecioInfo}>
                                                    <span className={estilos.itemPrecio}>
                                                        {formatearMoneda(precioActual)} c/u
                                                    </span>
                                                    {tieneDescuento && (
                                                        <span className={estilos.itemDescuento}>
                                                            <ion-icon name="pricetag"></ion-icon>
                                                            Descuento por volumen aplicado
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={estilos.itemControles}>
                                                <div className={estilos.itemCantidad}>
                                                    <button
                                                        className={estilos.btnCantidadCarrito}
                                                        onClick={() => onActualizarCantidad(item.id, item.cantidad - 1)}
                                                    >
                                                        <ion-icon name="remove-outline"></ion-icon>
                                                    </button>
                                                    <span>{item.cantidad}</span>
                                                    <button
                                                        className={estilos.btnCantidadCarrito}
                                                        onClick={() => onActualizarCantidad(item.id, item.cantidad + 1)}
                                                        disabled={item.stock <= item.cantidad}
                                                    >
                                                        <ion-icon name="add-outline"></ion-icon>
                                                    </button>
                                                </div>

                                                <div className={estilos.itemSubtotal}>
                                                    {formatearMoneda(precioActual * item.cantidad)}
                                                </div>

                                                <button
                                                    className={estilos.btnEliminarItem}
                                                    onClick={() => onEliminar(item.id)}
                                                    title="Eliminar del carrito"
                                                >
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Configuración del pedido */}
                            <div className={estilos.pedidoConfig}>
                                <h3>Configuración del Pedido</h3>

                                <div className={estilos.configItem}>
                                    <label>Método de Pago</label>
                                    <select
                                        className={estilos.selectConfig}
                                        value={metodoPago}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                    >
                                        <option value="contra_entrega">Contra Entrega</option>
                                        <option value="transferencia">Transferencia Bancaria</option>
                                        <option value="credito">Crédito Empresarial</option>
                                    </select>
                                </div>

                                <div className={estilos.configItem}>
                                    <label>Notas adicionales (opcional)</label>
                                    <textarea
                                        className={estilos.textareaConfig}
                                        value={notas}
                                        onChange={(e) => setNotas(e.target.value)}
                                        placeholder="Ej: Horario preferido de entrega, instrucciones especiales, etc."
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {/* Resumen */}
                            <div className={estilos.carritoResumen}>
                                <h3>Resumen del Pedido</h3>

                                <div className={estilos.resumenLinea}>
                                    <span>Subtotal:</span>
                                    <span>{formatearMoneda(subtotal)}</span>
                                </div>

                                {ahorro > 0 && (
                                    <div className={estilos.resumenLineaDescuento}>
                                        <span>
                                            <ion-icon name="pricetag"></ion-icon>
                                            Ahorro por volumen:
                                        </span>
                                        <span>-{formatearMoneda(ahorro)}</span>
                                    </div>
                                )}

                                <div className={estilos.resumenLineaTotal}>
                                    <span>Total:</span>
                                    <span>{formatearMoneda(subtotal)}</span>
                                </div>

                                <button
                                    className={estilos.btnCrearPedido}
                                    onClick={manejarCrearPedido}
                                    disabled={procesando || carrito.length === 0}
                                >
                                    {procesando ? (
                                        <>
                                            <div className={estilos.spinner}></div>
                                            Procesando pedido...
                                        </>
                                    ) : (
                                        <>
                                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                                            Confirmar Pedido
                                        </>
                                    )}
                                </button>

                                <p className={estilos.notaPedido}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    El pedido será revisado por IsiWeek. Recibirás confirmación por correo.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}