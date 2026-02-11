"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerProductos } from '@/_Pages/admin/productos/servidor'
import { ImagenProducto } from '@/utils/imageUtils'
import { 
    obtenerEtiquetaStockOperativo, 
    obtenerIconoStockOperativo,
    obtenerClaseStockOperativo 
} from '@/utils/stockUtils'
import estilos from '@/_Pages/admin/productos/productos.module.css'

export default function ProductosVendedor() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [productos, setProductos] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('todos')
    const [filtroMarca, setFiltroMarca] = useState('todos')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [categorias, setCategorias] = useState([])
    const [marcas, setMarcas] = useState([])

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
        cargarProductos()
    }, [])

    const cargarProductos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerProductos()
            if (resultado.success) {
                setProductos(resultado.productos)
                setCategorias(resultado.categorias)
                setMarcas(resultado.marcas)
            } else {
                alert(resultado.mensaje || 'Error al cargar productos')
            }
        } catch (error) {
            console.error('Error al cargar productos:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const productosFiltrados = productos.filter(producto => {
        const cumpleBusqueda = busqueda === '' ||
            producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.codigo_barras?.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.sku?.toLowerCase().includes(busqueda.toLowerCase())

        const cumpleCategoria = filtroCategoria === 'todos' || producto.categoria_id === parseInt(filtroCategoria)
        const cumpleMarca = filtroMarca === 'todos' || producto.marca_id === parseInt(filtroMarca)
        const cumpleEstado = filtroEstado === 'todos' ||
            (filtroEstado === 'activo' && producto.activo) ||
            (filtroEstado === 'inactivo' && !producto.activo) ||
            (filtroEstado === 'bajo_stock' && producto.estado_stock === 'bajo')

        return cumpleBusqueda && cumpleCategoria && cumpleMarca && cumpleEstado
    })

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Productos</h1>
                    <p className={estilos.subtitulo}>Gestiona el catálogo de productos</p>
                </div>
                <Link href="/vendedor/productos/nuevo" className={estilos.btnNuevo}>
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nuevo Producto</span>
                </Link>
            </div>

            {/* ❌ NO mostrar estadísticas (Total Productos, Activos, Bajo Stock, Valor Inventario) */}

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o SKU..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

                <div className={estilos.filtros}>
                    <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={filtroMarca}
                        onChange={(e) => setFiltroMarca(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todas las marcas</option>
                        {marcas.map(marca => (
                            <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                        <option value="bajo_stock">Últimas unidades</option>
                    </select>
                </div>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando productos...</span>
                </div>
            ) : productosFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>No hay productos que coincidan con tu búsqueda</span>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {productosFiltrados.map((producto) => {
                        const estadoStock = producto.estado_stock || 'disponible'
                        const etiquetaStock = obtenerEtiquetaStockOperativo(estadoStock)
                        const iconoStock = obtenerIconoStockOperativo(estadoStock)
                        const claseStock = obtenerClaseStockOperativo(estadoStock)
                        
                        return (
                            <div key={producto.id} className={`${estilos.card} ${estilos[tema]}`}>
                                <div className={estilos.cardHeader}>
                                    <ImagenProducto
                                        src={producto.imagen_url}
                                        alt={producto.nombre}
                                        className={estilos.imagen}
                                        placeholder={true}
                                        placeholderClassName={estilos.imagenPlaceholder}
                                    />
                                    {estadoStock === 'bajo' && (
                                        <span className={estilos.badgeBajoStock}>Últimas unidades</span>
                                    )}
                                    {estadoStock === 'agotado' && (
                                        <span className={estilos.badgeBajoStock}>Agotado</span>
                                    )}
                                </div>

                                <div className={estilos.cardBody}>
                                    <h3 className={estilos.nombreProducto}>{producto.nombre}</h3>
                                    
                                    <div className={estilos.codigoInfo}>
                                        {producto.codigo_barras && (
                                            <span className={estilos.codigo}>
                                                <ion-icon name="barcode-outline"></ion-icon>
                                                {producto.codigo_barras}
                                            </span>
                                        )}
                                        {producto.sku && (
                                            <span className={estilos.codigo}>
                                                <ion-icon name="pricetag-outline"></ion-icon>
                                                {producto.sku}
                                            </span>
                                        )}
                                    </div>

                                    {producto.categoria_nombre && (
                                        <span className={estilos.categoria}>{producto.categoria_nombre}</span>
                                    )}

                                    {/* ❌ NO mostrar precio de compra */}
                                    <div className={estilos.precios}>
                                        <div className={estilos.precioItem}>
                                            <span className={estilos.precioLabel}>Precio:</span>
                                            <span className={estilos.precioVenta}>
                                                {formatearMoneda(producto.precio_venta)}
                                            </span>
                                        </div>
                                        {producto.precio_oferta && producto.precio_oferta < producto.precio_venta && (
                                            <div className={estilos.precioItem}>
                                                <span className={estilos.precioLabel}>Oferta:</span>
                                                <span className={estilos.precioVenta}>
                                                    {formatearMoneda(producto.precio_oferta)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ✅ Mostrar estado de stock operativo (sin números) */}
                                    <div className={estilos.stock}>
                                        <div className={estilos.stockInfo}>
                                            <span className={estilos.stockLabel}>Estado:</span>
                                            <span className={`${estilos.stockValor} ${claseStock === 'stockBajo' ? estilos.stockBajo : claseStock === 'stockAgotado' ? estilos.inactivo : ''}`}>
                                                <ion-icon name={iconoStock}></ion-icon>
                                                {etiquetaStock}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={estilos.estado}>
                                        <span className={`${estilos.badgeEstado} ${producto.activo ? estilos.activo : estilos.inactivo}`}>
                                            {producto.activo ? 'Disponible' : 'No disponible'}
                                        </span>
                                    </div>
                                </div>

                                <div className={estilos.cardFooter}>
                                    <Link
                                        href={`/vendedor/productos/ver/${producto.id}`}
                                        className={estilos.btnIcono}
                                        title="Ver detalles"
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </Link>
                                    <Link
                                        href={`/vendedor/productos/editar/${producto.id}`}
                                        className={`${estilos.btnIcono} ${estilos.editar}`}
                                        title="Editar"
                                    >
                                        <ion-icon name="create-outline"></ion-icon>
                                    </Link>
                                    {/* ❌ NO mostrar botón eliminar */}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

