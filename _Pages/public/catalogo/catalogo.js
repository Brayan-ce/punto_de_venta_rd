"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import estilos from './catalogo.module.css'

export default function CatalogoPublico() {
    const router = useRouter()
    const params = useParams()
    // Manejar slug que puede ser string o array en Next.js
    const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug || '')

    const [cargando, setCargando] = useState(true)
    const [config, setConfig] = useState(null)
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [carrito, setCarrito] = useState([])
    const [mostrarCarrito, setMostrarCarrito] = useState(false)
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
    const [busqueda, setBusqueda] = useState('')
    const [favoritos, setFavoritos] = useState([])
    const [productoSeleccionado, setProductoSeleccionado] = useState(null)

    useEffect(() => {
        if (!slug || typeof slug !== 'string' || slug.trim() === '') {
            setCargando(false)
            return
        }
        cargarConfig()
        cargarProductos()
        cargarCarritoDesdeStorage()
    }, [slug])

    useEffect(() => {
        // Solo recargar productos cuando cambien los filtros, pero solo si el slug ya está disponible
        if (!slug || typeof slug !== 'string' || slug.trim() === '' || !config) {
            return
        }
        cargarProductos()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoriaSeleccionada, busqueda, slug])

    const cargarCarritoDesdeStorage = () => {
        if (!slug || typeof slug !== 'string') return
        const carritoGuardado = localStorage.getItem(`carrito_catalogo_${slug}`)
        if (carritoGuardado) {
            try {
                setCarrito(JSON.parse(carritoGuardado))
            } catch (e) {
                console.error('Error al cargar carrito:', e)
            }
        }
    }

    const guardarCarritoEnStorage = (nuevoCarrito) => {
        if (!slug || typeof slug !== 'string') return
        localStorage.setItem(`carrito_catalogo_${slug}`, JSON.stringify(nuevoCarrito))
    }

    const cargarConfig = async () => {
        if (!slug || typeof slug !== 'string' || slug.trim() === '') {
            return
        }
        try {
            const respuesta = await fetch(`/api/catalogo/${slug}/config`)
            const resultado = await respuesta.json()
            if (resultado.success) {
                setConfig(resultado.config)
            } else {
                // Solo loguear errores si no es por slug inválido (que ya está validado en el cliente)
                if (resultado.mensaje !== 'Slug requerido') {
                    console.error('Error al cargar config:', resultado.mensaje)
                }
            }
        } catch (error) {
            console.error('Error al cargar configuración:', error)
        }
    }

    const cargarProductos = async () => {
        if (!slug || typeof slug !== 'string' || slug.trim() === '') {
            setCargando(false)
            return
        }
        try {
            const params = new URLSearchParams()
            if (categoriaSeleccionada) {
                params.append('categoria', categoriaSeleccionada)
            }
            if (busqueda) {
                params.append('busqueda', busqueda)
            }

            const respuesta = await fetch(`/api/catalogo/${slug}/productos?${params.toString()}`)
            const resultado = await respuesta.json()
            if (resultado.success) {
                setProductos(resultado.productos || [])
                
                // Extraer categorías únicas
                const categoriasUnicas = [...new Set(resultado.productos.map(p => p.categoria_id).filter(Boolean))]
                if (categoriasUnicas.length > 0) {
                    const nombresCategorias = [...new Set(resultado.productos.map(p => p.categoria_nombre).filter(Boolean))]
                    setCategorias(nombresCategorias.map((nombre, idx) => ({
                        id: categoriasUnicas[idx],
                        nombre: nombre
                    })))
                }
            } else {
                // Solo loguear errores si no es por slug inválido (que ya está validado en el cliente)
                if (resultado.mensaje !== 'Slug requerido') {
                    console.error('Error al cargar productos:', resultado.mensaje)
                }
            }
        } catch (error) {
            console.error('Error al cargar productos:', error)
        } finally {
            setCargando(false)
        }
    }

    const agregarAlCarrito = (producto) => {
        const existe = carrito.find(item => item.id === producto.id)
        let nuevoCarrito
        if (existe) {
            nuevoCarrito = carrito.map(item =>
                item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
            )
        } else {
            nuevoCarrito = [...carrito, { ...producto, cantidad: 1 }]
        }
        setCarrito(nuevoCarrito)
        guardarCarritoEnStorage(nuevoCarrito)
    }

    const actualizarCantidad = (id, nuevaCantidad) => {
        let nuevoCarrito
        if (nuevaCantidad === 0) {
            nuevoCarrito = carrito.filter(item => item.id !== id)
        } else {
            nuevoCarrito = carrito.map(item =>
                item.id === id ? { ...item, cantidad: nuevaCantidad } : item
            )
        }
        setCarrito(nuevoCarrito)
        guardarCarritoEnStorage(nuevoCarrito)
    }

    const eliminarDelCarrito = (id) => {
        const nuevoCarrito = carrito.filter(item => item.id !== id)
        setCarrito(nuevoCarrito)
        guardarCarritoEnStorage(nuevoCarrito)
    }

    const calcularTotal = () => {
        return carrito.reduce((total, item) => {
            const precio = item.precio_oferta > 0 ? item.precio_oferta : item.precio
            return total + (precio * item.cantidad)
        }, 0)
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const toggleFavorito = (productoId) => {
        if (!slug || typeof slug !== 'string') return
        let nuevosFavoritos
        if (favoritos.includes(productoId)) {
            nuevosFavoritos = favoritos.filter(id => id !== productoId)
        } else {
            nuevosFavoritos = [...favoritos, productoId]
        }
        setFavoritos(nuevosFavoritos)
        localStorage.setItem(`favoritos_catalogo_${slug}`, JSON.stringify(nuevosFavoritos))
    }

    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0)
    
    // Función para calcular si un producto está en oferta
    const calcularEnOferta = (producto) => {
        try {
            // Verificar que tenga precio oferta válido y sea un número
            const precioOferta = parseFloat(producto.precio_oferta)
            const precio = parseFloat(producto.precio)
            
            if (!precioOferta || isNaN(precioOferta) || precioOferta <= 0) {
                return false
            }
            
            if (!precio || isNaN(precio) || precio <= 0) {
                return false
            }
            
            // Verificar que el precio oferta sea menor que el precio regular
            if (precioOferta >= precio) {
                return false
            }
            
            // Verificar que tenga stock disponible (solo si stock_visible es true o no está definido)
            const stock = producto.stock !== null && producto.stock !== undefined ? parseInt(producto.stock) : null
            if (stock !== null && stock <= 0) {
                return false
            }
            
            // Verificar que esté activo (puede ser boolean o 1/0, o undefined que asumimos como activo)
            const estaActivo = producto.activo === undefined || producto.activo === true || producto.activo === 1
            if (estaActivo === false || estaActivo === 0) {
                return false
            }
            
            return true
        } catch (error) {
            console.error('Error al calcular enOferta:', error, producto)
            return false
        }
    }

    // Función para calcular si un producto es destacado
    const calcularDestacado = (producto) => {
        try {
            // Si ya está marcado como destacado en la BD, usarlo directamente
            if (producto.destacado === true || producto.destacado === 1) {
                return true
            }
            
            // Calcular destacado automático: en oferta + buen stock + activo
            const enOferta = calcularEnOferta(producto)
            if (!enOferta) {
                return false
            }
            
            // Verificar que tenga buen stock (mayor que stock mínimo o mayor que 5 por defecto)
            const stock = producto.stock !== null && producto.stock !== undefined ? parseInt(producto.stock) : null
            const stockMinimo = producto.stock_minimo ? parseInt(producto.stock_minimo) : 5
            
            if (stock !== null && stock <= stockMinimo) {
                return false
            }
            
            // Verificar que esté activo (puede ser boolean o 1/0, o undefined que asumimos como activo)
            const estaActivo = producto.activo === undefined || producto.activo === true || producto.activo === 1
            if (estaActivo === false || estaActivo === 0) {
                return false
            }
            
            return true
        } catch (error) {
            console.error('Error al calcular destacado:', error, producto)
            return false
        }
    }

    // Función para calcular el ahorro en dinero y porcentaje
    const calcularAhorro = (precioVenta, precioOferta) => {
        // Si no hay precio oferta o el precio oferta es mayor o igual al precio venta, no hay ahorro
        if (!precioOferta || precioOferta === null || precioOferta >= precioVenta) {
            return {
                ahorro: 0,
                porcentaje: 0
            }
        }

        const precioVentaNum = parseFloat(precioVenta)
        const precioOfertaNum = parseFloat(precioOferta)

        if (isNaN(precioVentaNum) || isNaN(precioOfertaNum) || precioVentaNum <= 0 || precioOfertaNum <= 0) {
            return {
                ahorro: 0,
                porcentaje: 0
            }
        }

        const ahorro = precioVentaNum - precioOfertaNum
        const porcentaje = (ahorro / precioVentaNum) * 100

        return {
            ahorro: parseFloat(ahorro.toFixed(2)),
            porcentaje: parseFloat(porcentaje.toFixed(1))
        }
    }

    const productosDestacados = productos.filter(p => calcularDestacado(p)).length

    // Función para compartir producto
    const compartirProducto = async (producto) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: producto.nombre,
                    text: `Mira este producto: ${producto.nombre}`,
                    url: window.location.href
                })
            } catch (error) {
                console.log('Error al compartir:', error)
            }
        } else {
            // Fallback: copiar al portapapeles
            const url = window.location.href
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copiado al portapapeles')
            })
        }
    }

    if (cargando) {
        return (
            <div className={estilos.cargando}>
                <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                <span>Cargando catálogo...</span>
            </div>
        )
    }

    if (!config) {
        return (
            <div className={estilos.error}>
                <ion-icon name="alert-circle-outline"></ion-icon>
                <h2>Catálogo no encontrado</h2>
                <p>El catálogo que buscas no existe o está inactivo.</p>
            </div>
        )
    }

    return (
        <div className={estilos.contenedor}>
            {/* Header */}
            <header className={estilos.header}>
                <div className={estilos.headerContenedor}>
                    <div className={estilos.logoSection}>
                        {config.logo_url && (
                            <img src={config.logo_url} alt={config.nombre_catalogo || config.empresa?.nombre_comercial} className={estilos.logo} />
                        )}
                        <div>
                            <h1 className={estilos.tituloCatalogo}>
                                {config.nombre_catalogo || config.empresa?.nombre_comercial || config.empresa?.nombre || 'Catálogo'}
                            </h1>
                            {config.descripcion && (
                                <p className={estilos.descripcionCatalogo}>{config.descripcion}</p>
                            )}
                            {!config.descripcion && config.empresa?.nombre_comercial && (
                                <p className={estilos.descripcionCatalogo}>
                                    {config.empresa.nombre_comercial !== config.empresa.nombre ? config.empresa.nombre : 'Los mejores productos para tu hogar'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={estilos.accionesHeader}>
                        <button
                            className={estilos.btnFavoritos}
                            title="Favoritos"
                        >
                            <ion-icon name={favoritos.length > 0 ? "heart" : "heart-outline"}></ion-icon>
                            {favoritos.length > 0 && (
                                <span className={estilos.badgeFavoritos}>{favoritos.length}</span>
                            )}
                        </button>
                        <button
                            onClick={() => setMostrarCarrito(true)}
                            className={estilos.btnCarrito}
                            style={{ backgroundColor: config.color_primario || '#f97316' }}
                        >
                            <ion-icon name="cart-outline"></ion-icon>
                            <span>Carrito</span>
                            {totalItems > 0 && (
                                <span className={estilos.badgeCarrito}>{totalItems}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Barra de búsqueda */}
                <div className={estilos.busquedaSection}>
                    <div className={estilos.busquedaInput}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    {/* Categorías */}
                    {categorias.length > 0 && (
                        <div className={estilos.categorias}>
                            <button
                                onClick={() => setCategoriaSeleccionada(null)}
                                className={`${estilos.btnCategoria} ${!categoriaSeleccionada ? estilos.btnCategoriaActivo : ''}`}
                                style={!categoriaSeleccionada ? { backgroundColor: config.color_primario || '#f97316' } : {}}
                            >
                                Todas
                            </button>
                            {categorias.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategoriaSeleccionada(cat.id)}
                                    className={`${estilos.btnCategoria} ${categoriaSeleccionada === cat.id ? estilos.btnCategoriaActivo : ''}`}
                                    style={categoriaSeleccionada === cat.id ? { backgroundColor: config.color_primario || '#f97316' } : {}}
                                >
                                    {cat.nombre}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {/* Banner Productos Destacados */}
            {productosDestacados > 0 && (
                <div className={estilos.bannerDestacados} style={{ 
                    background: `linear-gradient(to right, ${config.color_primario || '#f97316'}, ${config.color_secundario || '#004E89'})` 
                }}>
                    <div className={estilos.bannerContenido}>
                        <div>
                            <h2 className={estilos.bannerTitulo}>🔥 Productos Destacados</h2>
                            <p className={estilos.bannerSubtitulo}>Las mejores ofertas de la semana</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid de Productos */}
            <main className={estilos.main}>
                {productos.length === 0 ? (
                    <div className={estilos.vacio}>
                        <ion-icon name="cube-outline"></ion-icon>
                        <h3>No hay productos disponibles</h3>
                        <p>Intenta con otra búsqueda o categoría</p>
                    </div>
                ) : (
                    <div className={estilos.grid}>
                        {productos.map((producto) => {
                            const enOferta = calcularEnOferta(producto)
                            const esDestacado = calcularDestacado(producto)
                            const infoAhorro = calcularAhorro(producto.precio, producto.precio_oferta)
                            const rating = 4.5 // Valor por defecto
                            
                            // Debug: Descomentar para ver qué productos tienen oferta/destacado
                            // if (enOferta || esDestacado) {
                            //     console.log('Producto:', producto.nombre, {
                            //         enOferta,
                            //         esDestacado,
                            //         precio: producto.precio,
                            //         precio_oferta: producto.precio_oferta,
                            //         destacado: producto.destacado,
                            //         stock: producto.stock,
                            //         activo: producto.activo
                            //     })
                            // }
                            
                            return (
                                <div key={producto.id} className={estilos.productoCard}>
                                    <div className={estilos.imagenContainer}>
                                        {producto.imagen_url ? (
                                            <img src={producto.imagen_url} alt={producto.nombre} className={estilos.imagen} />
                                        ) : (
                                            <div className={estilos.imagenPlaceholder}>
                                                <ion-icon name="image-outline"></ion-icon>
                                                <span>Sin imagen</span>
                                            </div>
                                        )}
                                        {(esDestacado || enOferta) && (
                                            <div className={estilos.badgesContainer}>
                                                {esDestacado && (
                                                    <span className={estilos.badgeDestacado}>⭐ DESTACADO</span>
                                                )}
                                                {enOferta && (
                                                    <span className={estilos.badgeOferta}>🔥 OFERTA</span>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => toggleFavorito(producto.id)}
                                            className={estilos.btnFavoritoCard}
                                            title={favoritos.includes(producto.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                                        >
                                            <ion-icon name={favoritos.includes(producto.id) ? "heart" : "heart-outline"}></ion-icon>
                                        </button>
                                        {producto.stock !== null && producto.stock < 10 && producto.stock > 0 && (
                                            <div className={estilos.badgeStockBajo}>
                                                ¡Solo {producto.stock} disponibles!
                                            </div>
                                        )}
                                    </div>
                                    <div className={estilos.productoInfo}>
                                        {producto.categoria_nombre && (
                                            <span className={estilos.productoCategoria}>{producto.categoria_nombre.toUpperCase()}</span>
                                        )}
                                        <h3 className={estilos.productoNombre}>{producto.nombre}</h3>
                                        {producto.descripcion_corta && (
                                            <p className={estilos.productoDescripcion}>{producto.descripcion_corta}</p>
                                        )}
                                        {/* Rating */}
                                        <div className={estilos.rating}>
                                            {[...Array(5)].map((_, i) => (
                                                <ion-icon 
                                                    key={i} 
                                                    name={i < Math.floor(rating) ? "star" : "star-outline"}
                                                    className={i < Math.floor(rating) ? estilos.starFilled : estilos.starEmpty}
                                                ></ion-icon>
                                            ))}
                                            <span className={estilos.ratingNumero}>{rating}</span>
                                        </div>
                                        <div className={estilos.precios}>
                                            {enOferta && infoAhorro.ahorro > 0 ? (
                                                <div className={estilos.precioContainer}>
                                                    <span className={estilos.precioAnterior}>{formatearMoneda(producto.precio)}</span>
                                                    <span className={estilos.precioActual}>{formatearMoneda(producto.precio_oferta)}</span>
                                                    <div className={estilos.ahorroContainer}>
                                                        <span className={estilos.ahorro}>
                                                            💸 Ahorras {formatearMoneda(infoAhorro.ahorro)}
                                                        </span>
                                                        <span className={estilos.ahorroPorcentaje}>
                                                            🔥 -{infoAhorro.porcentaje}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className={estilos.precioActual}>{formatearMoneda(producto.precio)}</span>
                                            )}
                                        </div>
                                        {producto.stock !== null && producto.stock > 0 && (
                                            <div className={estilos.stockInfo}>
                                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                                <span>{producto.stock} en stock</span>
                                            </div>
                                        )}
                                        <div className={estilos.accionesProducto}>
                                            <button
                                                onClick={() => agregarAlCarrito(producto)}
                                                className={estilos.btnAgregar}
                                                style={{ backgroundColor: config.color_primario || '#f97316' }}
                                                disabled={producto.stock === 0 || producto.stock === null}
                                            >
                                                <ion-icon name="cart-outline"></ion-icon>
                                                <span>Agregar</span>
                                            </button>
                                            <button
                                                onClick={() => setProductoSeleccionado(producto)}
                                                className={estilos.btnVerProducto}
                                                title="Ver detalles del producto"
                                            >
                                                <ion-icon name="chevron-forward-outline"></ion-icon>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Modal Carrito */}
            {mostrarCarrito && (
                <div className={estilos.modalOverlay} onClick={() => setMostrarCarrito(false)}>
                    <div className={estilos.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Tu Carrito</h2>
                            <button onClick={() => setMostrarCarrito(false)} className={estilos.btnCerrar}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            {carrito.length === 0 ? (
                                <div className={estilos.carritoVacio}>
                                    <ion-icon name="cart-outline"></ion-icon>
                                    <p>Tu carrito está vacío</p>
                                </div>
                            ) : (
                                <>
                                    <div className={estilos.listaCarrito}>
                                        {carrito.map(item => (
                                            <div key={item.id} className={estilos.itemCarrito}>
                                                <div className={estilos.itemInfo}>
                                                    <h4>{item.nombre}</h4>
                                                    <p>{formatearMoneda(item.precio_oferta > 0 ? item.precio_oferta : item.precio)} c/u</p>
                                                </div>
                                                <div className={estilos.itemCantidad}>
                                                    <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}>
                                                        <ion-icon name="remove-outline"></ion-icon>
                                                    </button>
                                                    <span>{item.cantidad}</span>
                                                    <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}>
                                                        <ion-icon name="add-outline"></ion-icon>
                                                    </button>
                                                </div>
                                                <div className={estilos.itemSubtotal}>
                                                    {formatearMoneda((item.precio_oferta > 0 ? item.precio_oferta : item.precio) * item.cantidad)}
                                                </div>
                                                <button onClick={() => eliminarDelCarrito(item.id)} className={estilos.btnEliminar}>
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={estilos.carritoTotales}>
                                        <div className={estilos.totalLine}>
                                            <span>Total:</span>
                                            <span className={estilos.totalFinal}>{formatearMoneda(calcularTotal())}</span>
                                        </div>
                                        <Link
                                            href={`/catalogo/${slug}/checkout`}
                                            className={estilos.btnCheckout}
                                            style={{ backgroundColor: config.color_primario || '#f97316' }}
                                            onClick={() => setMostrarCarrito(false)}
                                        >
                                            Finalizar Pedido
                                            <ion-icon name="arrow-forward-outline"></ion-icon>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detalle Producto */}
            {productoSeleccionado && (
                <div className={estilos.modalOverlay} onClick={() => setProductoSeleccionado(null)}>
                    <div className={estilos.modalProducto} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setProductoSeleccionado(null)}
                            className={estilos.btnCerrarProducto}
                        >
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                        
                        <div className={estilos.modalProductoImagen}>
                            {productoSeleccionado.imagen_url ? (
                                <img src={productoSeleccionado.imagen_url} alt={productoSeleccionado.nombre} />
                            ) : (
                                <div className={estilos.imagenPlaceholder}>
                                    <ion-icon name="image-outline"></ion-icon>
                                    <span>Sin imagen</span>
                                </div>
                            )}
                        </div>
                        
                        <div className={estilos.modalProductoContenido}>
                            <div className={estilos.modalProductoHeader}>
                                <div>
                                    {productoSeleccionado.categoria_nombre && (
                                        <span className={estilos.modalProductoCategoria}>
                                            {productoSeleccionado.categoria_nombre.toUpperCase()}
                                        </span>
                                    )}
                                    <h2 className={estilos.modalProductoTitulo}>{productoSeleccionado.nombre}</h2>
                                </div>
                                <button
                                    onClick={() => toggleFavorito(productoSeleccionado.id)}
                                    className={estilos.btnFavoritoModal}
                                >
                                    <ion-icon name={favoritos.includes(productoSeleccionado.id) ? "heart" : "heart-outline"}></ion-icon>
                                </button>
                            </div>

                            <div className={estilos.modalRating}>
                                {[...Array(5)].map((_, i) => {
                                    const rating = 4.5
                                    return (
                                        <ion-icon 
                                            key={i} 
                                            name={i < Math.floor(rating) ? "star" : "star-outline"}
                                            className={i < Math.floor(rating) ? estilos.starFilled : estilos.starEmpty}
                                        ></ion-icon>
                                    )
                                })}
                                <span className={estilos.ratingNumero}>4.5</span>
                            </div>

                            {productoSeleccionado.descripcion && (
                                <p className={estilos.modalProductoDescripcion}>{productoSeleccionado.descripcion}</p>
                            )}

                            <div className={estilos.modalProductoPrecio}>
                                <div>
                                    {(() => {
                                        const modalEnOferta = calcularEnOferta(productoSeleccionado)
                                        const modalAhorro = calcularAhorro(productoSeleccionado.precio, productoSeleccionado.precio_oferta)
                                        
                                        return modalEnOferta && modalAhorro.ahorro > 0 ? (
                                            <>
                                                <div className={estilos.modalPrecioAnterior}>
                                                    {formatearMoneda(productoSeleccionado.precio)}
                                                </div>
                                                <div className={estilos.modalPrecioActual}>
                                                    {formatearMoneda(productoSeleccionado.precio_oferta)}
                                                </div>
                                                <div className={estilos.modalAhorroContainer}>
                                                    <div className={estilos.modalAhorro}>
                                                        💸 Ahorras {formatearMoneda(modalAhorro.ahorro)}
                                                    </div>
                                                    <div className={estilos.modalAhorroPorcentaje}>
                                                        🔥 -{modalAhorro.porcentaje}%
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={estilos.modalPrecioActual}>
                                                {formatearMoneda(productoSeleccionado.precio)}
                                            </div>
                                        )
                                    })()}
                                </div>
                                {productoSeleccionado.stock !== null && productoSeleccionado.stock > 0 && (
                                    <div className={estilos.modalStock}>
                                        <div className={estilos.modalStockLabel}>Disponibilidad</div>
                                        <div className={estilos.modalStockValor}>
                                            {productoSeleccionado.stock} en stock
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={estilos.modalProductoAcciones}>
                                <button
                                    onClick={() => {
                                        agregarAlCarrito(productoSeleccionado)
                                        setProductoSeleccionado(null)
                                        setMostrarCarrito(true)
                                    }}
                                    className={estilos.btnAgregarModal}
                                    style={{ backgroundColor: config.color_primario || '#f97316' }}
                                    disabled={productoSeleccionado.stock === 0 || productoSeleccionado.stock === null}
                                >
                                    <ion-icon name="cart-outline"></ion-icon>
                                    <span>Agregar al Carrito</span>
                                </button>
                                <button
                                    onClick={() => compartirProducto(productoSeleccionado)}
                                    className={estilos.btnCompartir}
                                    title="Compartir producto"
                                >
                                    <ion-icon name="share-social-outline"></ion-icon>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            {config && (
                <footer className={estilos.footer}>
                    <div className={estilos.footerContenedor}>
                        <div className={estilos.footerColumna}>
                            <h3 className={estilos.footerTitulo}>{config.nombre_catalogo}</h3>
                            <p className={estilos.footerDescripcion}>
                                {config.descripcion || 'Los mejores productos con entrega rápida y segura.'}
                            </p>
                        </div>
                        <div className={estilos.footerColumna}>
                            <h4 className={estilos.footerSubtitulo}>Contacto</h4>
                            {config.whatsapp && (
                                <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={estilos.footerInfo}>
                                    <ion-icon name="logo-whatsapp"></ion-icon>
                                    <span>{config.whatsapp}</span>
                                </a>
                            )}
                            {config.empresa?.telefono && (
                                <div className={estilos.footerInfo}>
                                    <ion-icon name="call-outline"></ion-icon>
                                    <span>{config.empresa.telefono}</span>
                                </div>
                            )}
                            {config.direccion && (
                                <div className={estilos.footerInfo}>
                                    <ion-icon name="location-outline"></ion-icon>
                                    <span>{config.direccion}</span>
                                </div>
                            )}
                            {config.empresa?.email && (
                                <div className={estilos.footerInfo}>
                                    <ion-icon name="mail-outline"></ion-icon>
                                    <span>{config.empresa.email}</span>
                                </div>
                            )}
                        </div>
                        <div className={estilos.footerColumna}>
                            <h4 className={estilos.footerSubtitulo}>Horarios</h4>
                            {config.horario ? (
                                <p className={estilos.footerHorario}>{config.horario}</p>
                            ) : (
                                <div className={estilos.footerHorario}>
                                    <p>Lun - Vie: 9:00 AM - 6:00 PM</p>
                                    <p>Sábados: 9:00 AM - 2:00 PM</p>
                                    <p>Domingos: Cerrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={estilos.footerCopy}>
                        <p>© {new Date().getFullYear()} {config.nombre_catalogo} - Powered by IsiWeek POS</p>
                    </div>
                </footer>
            )}
        </div>
    )
}

