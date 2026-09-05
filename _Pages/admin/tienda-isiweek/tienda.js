"use client"
import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {
    obtenerProductosTiendaIsiWeek,
    obtenerCategoriasTiendaIsiWeek,
    crearPedidoB2B,
    obtenerDatosEmpresa
} from './servidor'
import {useLanguage} from '@/_Pages/admin/i18n'

import estilos from './tienda.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const generarLinkWhatsApp = (telefono, mensaje) => {
    const numero = telefono.replace(/[^\d]/g, '')
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}

const mensajePedidoWhatsApp = ({ numeroPedido, total, simbolo = 'RD$' }) => `
📦 *Nuevo pedido B2B confirmado*

🧾 Pedido: ${numeroPedido}
💰 Total: ${simbolo} ${total}

Ingresar al panel para gestionarlo.
`.trim()



export default function TiendaIsiWeek() {
    const router = useRouter()
    const {language, t} = useLanguage()
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
    const [empresa, setEmpresa] = useState(null)

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
            const resultadoEmpresa = await obtenerDatosEmpresa()
            if (resultadoEmpresa.success) setEmpresa(resultadoEmpresa.empresa)

            const resultadoProductos = await obtenerProductosTiendaIsiWeek(
                filtroCategoria === 'todos' ? null : parseInt(filtroCategoria)
            )

            if (resultadoProductos.success) {
                setProductos(resultadoProductos.productos || [])
            }

            const resultadoCategorias = await obtenerCategoriasTiendaIsiWeek()

            if (resultadoCategorias.success) {
                setCategorias(resultadoCategorias.categorias || [])
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert(language === 'en' ? 'Error loading store data' : 'Error al cargar datos de la tienda')
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
        if (confirm(language === 'en' ? 'Are you sure you want to clear the cart?' : '¿Estás seguro de vaciar el carrito?')) {
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
        const locale = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
        const simbolo = empresa?.simbolo_moneda || 'RD$'
        try {
            const numero = new Intl.NumberFormat(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(monto || 0)
            return `${simbolo} ${numero}`
        } catch {
            return `${simbolo} ${Number(monto || 0).toFixed(2)}`
        }
    }

    const traducirCategoria = (categoria) => {
        const m = {
            'Suministros': language === 'en' ? 'Supplies' : 'Suministros',
            'Equipos': language === 'en' ? 'Equipment' : 'Equipos',
            'Licencias': language === 'en' ? 'Licenses' : 'Licencias',
            'Accesorios': language === 'en' ? 'Accessories' : 'Accesorios',
            'Servicios': language === 'en' ? 'Services' : 'Servicios'
        }
        return m[categoria] || categoria
    }

    const abrirImagenModal = (imagen, nombre) => {
        setImagenModal({url: imagen, nombre})
    }

    const abrirDetalleProducto = (producto) => {
        setProductoDetalle(producto)
    }

    if (cargando) { return <LoadingScreen /> }

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
                            aria-label={language === 'en' ? 'Close' : 'Cerrar'}
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
                            <h1 className={estilos.titulo}>{t('pages.tiendaIsiweekTitle')}</h1>
                            <p className={estilos.subtitulo}>{t('pages.tiendaIsiweekSubtitle')}</p>
                        </div>
                    </div>
                </div>

                <div className={estilos.headerAcciones}>
                    <button
                        className={estilos.btnHistorial}
                        onClick={() => router.push('/admin/tienda-isiweek')}
                        title={t('pages.historial')}
                    >
                        <ion-icon name="time-outline"></ion-icon>
                        <span>{t('pages.historial')}</span>
                    </button>

                    <button
                        className={estilos.btnCarrito}
                        onClick={() => setMostrarCarrito(true)}
                    >
                        <ion-icon name="cart-outline"></ion-icon>
                        <div className={estilos.carritoInfo}>
                            <span className={estilos.carritoLabel}>{t('pages.carrito')}</span>
                            <span className={estilos.carritoContador}>{cantidadItemsCarrito} {t('pages.items')}</span>
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
                    <span>{t('pages.todos')}</span>
                </button>
                {categorias.map(cat => (
                    <button
                        key={cat.id}
                        className={`${estilos.categoriaChip} ${filtroCategoria === cat.id ? estilos.activo : ''}`}
                        onClick={() => setFiltroCategoria(cat.id)}
                    >
                        <span>{traducirCategoria(cat.nombre)}</span>
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
                        placeholder={t('pages.buscarProductoSkuDescripcion')}
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
                        title={language === 'en' ? 'Grid view' : 'Vista en cuadrícula'}
                    >
                        <ion-icon name="grid-outline"></ion-icon>
                    </button>
                    <button
                        className={`${estilos.btnVista} ${vistaActual === 'lista' ? estilos.activo : ''}`}
                        onClick={() => setVistaActual('lista')}
                        title={language === 'en' ? 'List view' : 'Vista en lista'}
                    >
                        <ion-icon name="list-outline"></ion-icon>
                    </button>
                </div>

                <div className={estilos.contador}>
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>{productosFiltrados.length} {productosFiltrados.length === 1 ? t('pages.productoCount') : t('pages.productosCantidad')}</span>
                </div>
            </div>

            {/* Alerta de ahorro si hay items con descuento por volumen */}
            {calcularAhorroTotal() > 0 && (
                <div className={estilos.alertaAhorro}>
                    <ion-icon name="pricetag"></ion-icon>
                    <div>
                        <strong>{language === 'en' ? 'You are saving!' : '¡Estás ahorrando!'}</strong>
                        <span>{t('pages.ahorroVolumen')} {formatearMoneda(calcularAhorroTotal())}</span>
                    </div>
                </div>
            )}

            {/* Productos */}
            {productosFiltrados.length === 0 ? (
                <div className={estilos.vacio}>
                    <div className={estilos.vacioIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <h3>{language === 'en' ? 'No products available' : 'No hay productos disponibles'}</h3>
                    <p>
                        {busqueda
                            ? (language === 'en' ? 'No products matched your search' : 'No se encontraron productos que coincidan con tu búsqueda')
                            : (language === 'en' ? 'No products in this category' : 'No hay productos en esta categoría')}
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
                                t={t}
                                language={language}
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
                                t={t}
                                language={language}
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
                    t={t}
                    language={language}
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
                    t={t}
                    language={language}
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
                                 tema,
                                 t,
                                 language
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
                        {t('pages.destacado')}
                    </span>
                )}
                {tieneDescuentoVolumen && (
                    <span className={estilos.badgeVolumen}>
                        <ion-icon name="pricetag"></ion-icon>
                        {t('pages.precioPorVolumen')}
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
                        <span>{language === 'en' ? 'No image' : 'Sin imagen'}</span>
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
                        <span className={estilos.detalleLabel}>{t('pages.stockLabel')}</span>
                        <span className={`${estilos.detalleValor} ${
                            producto.stock > 10 ? estilos.stockBueno :
                                producto.stock > 0 ? estilos.stockBajo :
                                    estilos.stockAgotado
                        }`}>
                            {producto.stock} {t('pages.unidades')}
                        </span>
                    </div>

                    {producto.tiempo_entrega && (
                        <div className={estilos.detalleItem}>
                            <ion-icon name="time-outline"></ion-icon>
                            <span className={estilos.detalleLabel}>{t('pages.entregaLabel')}</span>
                            <span className={estilos.detalleValor}>{producto.tiempo_entrega}</span>
                        </div>
                    )}

                    {producto.categoria_nombre && (
                        <div className={estilos.detalleItem}>
                            <ion-icon name="pricetag-outline"></ion-icon>
                            <span className={estilos.detalleLabel}>{t('pages.categoriaLabel')}</span>
                            <span className={estilos.detalleValor}>{producto.categoria_nombre}</span>
                        </div>
                    )}
                </div>

                {/* Precios */}
                <div className={estilos.precios}>
                    <div className={estilos.precioPrincipal}>
                        <span className={estilos.precioLabel}>{t('pages.precioLabel')}</span>
                        <span className={estilos.precioValor}>{formatearMoneda(precioActual)}</span>
                    </div>

                    {tieneDescuentoVolumen && (
                        <div className={estilos.precioVolumen}>
                            <ion-icon name="people-outline"></ion-icon>
                            <div className={estilos.precioVolumenInfo}>
                                <span>{t('pages.compraVolumen')} {producto.cantidad_volumen}+ {t('pages.unidades')}</span>
                                <strong>{formatearMoneda(producto.precio_volumen)} c/u</strong>
                            </div>
                            {cantidadCarrito >= producto.cantidad_volumen && (
                                <span className={estilos.descuentoAplicado}>
                                    <ion-icon name="checkmark-circle"></ion-icon>
                                    {language === 'en' ? 'Discount applied' : 'Descuento aplicado'}
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
                        <span>{t('pages.verDetalles')}</span>
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
                            <span>{t('pages.agregarAlCarrito')}</span>
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
                                  tema,
                                  t,
                                  language
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
                        {producto.stock} {t('pages.unidades')}
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
                        title={t('pages.verDetalles')}
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
                            {language === 'en' ? 'Add' : 'Agregar'}
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
                                  tema,
                                  t,
                                  language
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
                                <span>{t('pages.sinImagenDisponible')}</span>
                            </div>
                        )}

                        {producto.destacado && (
                            <div className={estilos.detalleDestacadoBadge}>
                                <ion-icon name="star"></ion-icon>
                                {language === 'en' ? 'Featured Product' : 'Producto Destacado'}
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
                                <h4>{t('pages.descripcion')}</h4>
                                <p>{producto.descripcion}</p>
                            </div>
                        )}

                        <div className={estilos.detalleEspecificaciones}>
                            <h4>{t('pages.especificaciones')}</h4>
                            <div className={estilos.especificacionesGrid}>
                                <div className={estilos.especItem}>
                                    <ion-icon name="layers-outline"></ion-icon>
                                    <div>
                                        <span className={estilos.especLabel}>{t('pages.stockDisponible')}</span>
                                        <span className={`${estilos.especValor} ${
                                            producto.stock > 10 ? estilos.stockBueno :
                                                producto.stock > 0 ? estilos.stockBajo :
                                                    estilos.stockAgotado
                                        }`}>
                                            {producto.stock} {t('pages.unidades')}
                                        </span>
                                    </div>
                                </div>

                                {producto.tiempo_entrega && (
                                    <div className={estilos.especItem}>
                                        <ion-icon name="time-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.especLabel}>{t('pages.tiempoEntrega')}</span>
                                            <span className={estilos.especValor}>{producto.tiempo_entrega}</span>
                                        </div>
                                    </div>
                                )}

                                {producto.categoria_nombre && (
                                    <div className={estilos.especItem}>
                                        <ion-icon name="pricetag-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.especLabel}>{t('pages.categoria')}</span>
                                            <span className={estilos.especValor}>{producto.categoria_nombre}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Precios */}
                        <div className={estilos.detallePreciosCard}>
                            <div className={estilos.precioPrincipalDetalle}>
                                <span className={estilos.precioLabelDetalle}>{t('pages.precioUnitario')}</span>
                                <span className={estilos.precioValorDetalle}>{formatearMoneda(precioActual)}</span>
                            </div>

                            {tieneDescuentoVolumen && (
                                <div className={estilos.precioVolumenDetalle}>
                                    <div className={estilos.precioVolumenHeader}>
                                        <ion-icon name="pricetag"></ion-icon>
                                        <span>{t('pages.descuentoPorVolumen')} (-{descuentoPorcentaje}%)</span>
                                    </div>
                                    <div className={estilos.precioVolumenBody}>
                                        <div>
                                            <span>{t('pages.compraVolumen')} {producto.cantidad_volumen}+ {t('pages.unidades')}</span>
                                            <strong>{formatearMoneda(producto.precio_volumen)} c/u</strong>
                                        </div>
                                        {cantidad >= producto.cantidad_volumen && (
                                            <span className={estilos.descuentoAplicadoDetalle}>
                                                <ion-icon name="checkmark-circle"></ion-icon>
                                                {language === 'en' ? 'Applied' : 'Aplicado'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selector de cantidad y total */}
                        <div className={estilos.detalleAccionesCard}>
                            <div className={estilos.detalleCantidadSelector}>
                                <label>{t('pages.cantidad')}</label>
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
                                <span>{t('pages.totalLabel')}</span>
                                <strong>{formatearMoneda(precioActual * cantidad)}</strong>
                            </div>

                            <button
                                className={estilos.btnAgregarDetalle}
                                onClick={manejarAgregar}
                                disabled={producto.stock <= 0}
                            >
                                <ion-icon name="cart-outline"></ion-icon>
                                {cantidadEnCarrito > 0
                                    ? `${t('pages.agregarMasCarrito')} (${cantidadEnCarrito} ${t('pages.yaAgregados')})`
                                    : t('pages.agregarAlCarrito')}
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
                          tema,
                          t,
                          language
                      }) {
    const [procesando, setProcesando] = useState(false)
    const [metodoPago, setMetodoPago] = useState('contra_entrega')
    const [notas, setNotas] = useState('')
    const router = useRouter()

    const manejarCrearPedido = async () => {
        if (carrito.length === 0) {
            alert(t('pages.carritoVacioTitulo'))
            return
        }

        if (!confirm(language === 'en' ? 'Confirm order? It will be sent to IsiWeek for processing.' : '¿Confirmar pedido? Se enviará a IsiWeek para su procesamiento.')) {
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
                alert(language === 'en'
                    ? `Order created successfully!\n\nOrder number: ${resultado.numeroPedido}\n\nYou can track it in history.`
                    : `¡Pedido creado exitosamente!\n\nNúmero de pedido: ${resultado.numeroPedido}\n\nPuedes hacer seguimiento en la sección de historial.`)
                localStorage.removeItem('carrito_isiweek')
                router.push('/admin/tienda-isiweek')
            } else {
                alert((language === 'en' ? 'Error creating order: ' : 'Error al crear pedido: ') + resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al crear pedido:', error)
            alert(language === 'en' ? 'Error processing order. Please try again.' : 'Error al procesar el pedido. Por favor intenta nuevamente.')
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
                            {t('pages.carritoCompras')}
                        </h2>
                        <p className={estilos.modalSubtitulo}>
                            {carrito.length} {carrito.length === 1 ? t('pages.productoCount') : t('pages.productosCantidad')} •
                            {carrito.reduce((total, item) => total + item.cantidad, 0)} {t('pages.itemsTotales')}
                        </p>
                    </div>
                    <div className={estilos.modalHeaderAcciones}>
                        {carrito.length > 0 && (
                            <button className={estilos.btnVaciarCarrito} onClick={onVaciar}>
                                <ion-icon name="trash-outline"></ion-icon>
                                {t('pages.vaciar')}
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
                            <h3>{t('pages.carritoVacioTitulo')}</h3>
                            <p>{t('pages.carritoVacioTexto')}</p>
                            <button className={estilos.btnSeguirComprando} onClick={onCerrar}>
                                <ion-icon name="storefront-outline"></ion-icon>
                                {t('pages.seguirComprando')}
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
                                                            {t('pages.descuentoVolumenAplicado')}
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
                                                    title={t('buttons.eliminar')}
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
                                <h3>{t('pages.configuracionPedido')}</h3>

                                <div className={estilos.configItem}>
                                    <label>{t('pages.metodoPagoLabel')}</label>
                                    <select
                                        className={estilos.selectConfig}
                                        value={metodoPago}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                    >
                                        <option value="contra_entrega">{t('pages.contraEntrega')}</option>
                                        <option value="transferencia">{t('pages.transferenciaBancaria')}</option>
                                        <option value="credito">{t('pages.creditoEmpresarial')}</option>
                                    </select>
                                </div>

                                <div className={estilos.configItem}>
                                    <label>{t('pages.notasAdicionales')}</label>
                                    <textarea
                                        className={estilos.textareaConfig}
                                        value={notas}
                                        onChange={(e) => setNotas(e.target.value)}
                                        placeholder={t('pages.notasPlaceholder')}
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {/* Resumen */}
                            <div className={estilos.carritoResumen}>
                                <h3>{t('pages.resumenPedido')}</h3>

                                <div className={estilos.resumenLinea}>
                                    <span>{t('pages.subtotalLabel')}</span>
                                    <span>{formatearMoneda(subtotal)}</span>
                                </div>

                                {ahorro > 0 && (
                                    <div className={estilos.resumenLineaDescuento}>
                                        <span>
                                            <ion-icon name="pricetag"></ion-icon>
                                            {t('pages.ahorroVolumen')}
                                        </span>
                                        <span>-{formatearMoneda(ahorro)}</span>
                                    </div>
                                )}

                                <div className={estilos.resumenLineaTotal}>
                                    <span>{t('pages.totalLabel')}</span>
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
                                            {t('pages.procesandoPedido')}
                                        </>
                                    ) : (
                                        <>
                                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                                            {t('pages.confirmarPedido')}
                                        </>
                                    )}
                                </button>

                                <p className={estilos.notaPedido}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    {t('pages.pedidoNotaRevision')}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}