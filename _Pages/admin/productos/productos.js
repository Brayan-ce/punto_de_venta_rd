"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Barcode from 'react-barcode'
import { obtenerProductos, obtenerFiltros, obtenerEstadisticas, eliminarProducto } from './servidor'
import { ImagenProducto } from '@/utils/imageUtils'
import { useServerActionRetry } from '@/hooks/useServerActionRetry'
import ImportarProductos from './ImportarProductos'
import estilos from './productos.module.css'

export default function ProductosAdmin() {
    const router = useRouter()
    const { executeWithRetry } = useServerActionRetry()
    const [tema, setTema] = useState('light')
    const [cargandoInicial, setCargandoInicial] = useState(true) // Solo para la carga inicial
    const [cargandoProductos, setCargandoProductos] = useState(false) // Para búsquedas y filtros
    const [productos, setProductos] = useState([])
    const primeraCarga = useRef(true) // Para evitar que el useEffect de filtros se ejecute en la carga inicial
    const [busqueda, setBusqueda] = useState('')
    const [busquedaInput, setBusquedaInput] = useState('') // Para debounce
    const [filtroCategoria, setFiltroCategoria] = useState('todos')
    const [filtroMarca, setFiltroMarca] = useState('todos')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [categorias, setCategorias] = useState([])
    const [marcas, setMarcas] = useState([])
    const [procesando, setProcesando] = useState(false)
    
    // Vista: lista por defecto en desktop, tarjetas en móvil
    const [vistaActual, setVistaActual] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768 ? 'tabla' : 'cards'
        }
        return 'tabla' // Default desktop
    })
    
    // Paginación
    const [page, setPage] = useState(1)
    const [limit] = useState(50) // Productos por página
    const [paginacion, setPaginacion] = useState({
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    })
    
    // Estadísticas
    const [stats, setStats] = useState({
        total: 0,
        activos: 0,
        bajoStock: 0,
        valorInventario: 0
    })

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        // Detectar cambio de tamaño de ventana para ajustar vista
        const manejarResize = () => {
            if (window.innerWidth >= 768 && vistaActual === 'cards') {
                setVistaActual('tabla')
            } else if (window.innerWidth < 768 && vistaActual === 'tabla') {
                setVistaActual('cards')
            }
        }

        window.addEventListener('resize', manejarResize)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
            window.removeEventListener('resize', manejarResize)
        }
    }, [vistaActual])

    // Cargar filtros una sola vez al inicio
    useEffect(() => {
        const cargarInicial = async () => {
            setCargandoInicial(true)
            try {
                await Promise.all([cargarFiltros(), cargarEstadisticas(), cargarProductos()])
            } finally {
                setCargandoInicial(false)
                primeraCarga.current = false
            }
        }
        cargarInicial()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    
    // Cargar productos cuando cambian filtros o página (sin bloquear UI)
    useEffect(() => {
        // No ejecutar en la primera carga (ya se ejecuta en el useEffect anterior)
        if (!primeraCarga.current) {
            cargarProductos()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, busqueda, filtroCategoria, filtroMarca, filtroEstado])
    
    // Debounce para búsqueda (espera 500ms después de que el usuario deja de escribir)
    useEffect(() => {
        const timer = setTimeout(() => {
            setBusqueda(busquedaInput)
            setPage(1) // Resetear a página 1 cuando cambia la búsqueda
        }, 500)
        
        return () => clearTimeout(timer)
    }, [busquedaInput])

    const cargarFiltros = async () => {
        try {
            const resultado = await executeWithRetry(() => obtenerFiltros())
            if (resultado?.success) {
                setCategorias(resultado.categorias)
                setMarcas(resultado.marcas)
            }
        } catch (error) {
            console.error('Error al cargar filtros:', error)
        }
    }
    
    const cargarEstadisticas = async () => {
        try {
            const resultado = await executeWithRetry(() => obtenerEstadisticas())
            if (resultado?.success) {
                setStats(resultado.estadisticas)
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error)
        }
    }
    
    const cargarProductos = async () => {
        setCargandoProductos(true)
        try {
            const resultado = await executeWithRetry(() => obtenerProductos({
                page,
                limit,
                search: busqueda,
                categoriaId: filtroCategoria !== 'todos' ? filtroCategoria : null,
                marcaId: filtroMarca !== 'todos' ? filtroMarca : null,
                estado: filtroEstado
            }))
            
            if (resultado?.success) {
                setProductos(resultado.productos)
                setPaginacion(resultado.paginacion || {})
            } else if (resultado) {
                alert(resultado.mensaje || 'Error al cargar productos')
            }
        } catch (error) {
            console.error('Error al cargar productos:', error)
            alert('Error al cargar datos')
        } finally {
            setCargandoProductos(false)
        }
    }

    const manejarEliminar = async (productoId, nombreProducto) => {
        if (!confirm(`¿Estas seguro de eliminar el producto "${nombreProducto}"? Esta accion no se puede deshacer.`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await executeWithRetry(() => eliminarProducto(productoId))
            if (resultado?.success) {
                await cargarProductos()
                await cargarEstadisticas() // Actualizar estadísticas
                alert(resultado.mensaje)
            } else if (resultado) {
                alert(resultado.mensaje || 'Error al eliminar producto')
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    // Los productos ya vienen filtrados del backend, no necesitamos filtrar en frontend
    const productosFiltrados = productos

    // Memoizar formatearMoneda para evitar re-renders innecesarios
    const formatearMoneda = useCallback((monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }, [])
    
    const manejarCambioFiltro = (tipo, valor) => {
        if (tipo === 'categoria') {
            setFiltroCategoria(valor)
        } else if (tipo === 'marca') {
            setFiltroMarca(valor)
        } else if (tipo === 'estado') {
            setFiltroEstado(valor)
        }
        setPage(1) // Resetear a página 1 cuando cambia un filtro
    }

    // Función para renderizar contenido según vista
    const renderizarProductos = () => {
        // Carga inicial: mostrar spinner completo
        if (cargandoInicial) {
            return (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando productos...</span>
                </div>
            )
        }

        // Carga de productos (búsqueda/filtro): mostrar spinner pequeño sin ocultar layout
        if (cargandoProductos) {
            return (
                <div style={{ position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className={estilos.cargandoProductos}>
                        <ion-icon name="hourglass-outline" className={estilos.iconoCargandoProductos}></ion-icon>
                        <span>Buscando productos...</span>
                    </div>
                </div>
            )
        }

        if (productosFiltrados.length === 0) {
            return (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>No hay productos que coincidan con tu búsqueda</span>
                </div>
            )
        }

        if (vistaActual === 'tabla') {
            return (
                <TablaProductosMemo
                    productos={productosFiltrados}
                    tema={tema}
                    router={router}
                    formatearMoneda={formatearMoneda}
                    manejarEliminar={manejarEliminar}
                    procesando={procesando}
                    estilos={estilos}
                />
            )
        }

        return (
            <div className={estilos.grid}>
                {productosFiltrados.map((producto) => (
                    <ProductoCardMemo
                        key={producto.id}
                        producto={producto}
                        tema={tema}
                        formatearMoneda={formatearMoneda}
                        manejarEliminar={manejarEliminar}
                        procesando={procesando}
                        estilos={estilos}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Productos</h1>
                    <p className={estilos.subtitulo}>Gestiona el catálogo de productos</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <ImportarProductos onImportarCompleto={() => {
                        cargarProductos()
                        cargarEstadisticas()
                    }} />
                    <Link href="/admin/productos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nuevo Producto</span>
                    </Link>
                </div>
            </div>

            <div className={`${estilos.estadisticas} ${estilos[tema]}`}>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Productos</span>
                        <span className={estilos.estadValor}>{stats.total}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Activos</span>
                        <span className={estilos.estadValor}>{stats.activos}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Bajo Stock</span>
                        <span className={estilos.estadValor}>{stats.bajoStock}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Valor Inventario</span>
                        <span className={estilos.estadValor}>{formatearMoneda(stats.valorInventario)}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.barraHerramientas}>
                    <div className={estilos.busqueda}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, código o SKU..."
                            value={busquedaInput}
                            onChange={(e) => setBusquedaInput(e.target.value)}
                            className={estilos.inputBusqueda}
                        />
                    </div>

                    <div className={estilos.selectoresVista}>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'tabla' ? estilos.vistaActiva : ''}`}
                            onClick={() => setVistaActual('tabla')}
                            title="Vista de Lista"
                            aria-label="Vista de Lista"
                        >
                            <ion-icon name="list-outline"></ion-icon>
                        </button>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'cards' ? estilos.vistaActiva : ''}`}
                            onClick={() => setVistaActual('cards')}
                            title="Vista de Tarjetas"
                            aria-label="Vista de Tarjetas"
                        >
                            <ion-icon name="grid-outline"></ion-icon>
                        </button>
                    </div>
                </div>

                <div className={estilos.filtros}>
                    <select
                        value={filtroCategoria}
                        onChange={(e) => manejarCambioFiltro('categoria', e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={filtroMarca}
                        onChange={(e) => manejarCambioFiltro('marca', e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todas las marcas</option>
                        {marcas.map(marca => (
                            <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={filtroEstado}
                        onChange={(e) => manejarCambioFiltro('estado', e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                        <option value="bajo_stock">Bajo Stock</option>
                    </select>
                </div>
            </div>

            {renderizarProductos()}
            
            {/* Controles de Paginación */}
            {!cargandoInicial && !cargandoProductos && paginacion.totalPages > 1 && (
                <div className={estilos.paginacion}>
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={!paginacion.hasPrev || cargandoProductos}
                        className={estilos.btnPaginacion}
                    >
                        <ion-icon name="chevron-back-outline"></ion-icon>
                        Anterior
                    </button>
                    
                    <div className={estilos.infoPaginacion}>
                        <span>Página {page} de {paginacion.totalPages}</span>
                        <span className={estilos.totalProductos}>
                            ({paginacion.total.toLocaleString()} productos)
                        </span>
                    </div>
                    
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={!paginacion.hasNext || cargandoProductos}
                        className={estilos.btnPaginacion}
                    >
                        Siguiente
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </button>
                </div>
            )}
        </div>
    )
}

// ===============================================================
// COMPONENTE: BarcodeProducto (Código de barras visual)
// ===============================================================
function BarcodeProducto({ codigo, sku, tema, estilos, size = 'normal' }) {
    // Usar código de barras si existe, sino usar SKU
    const codigoParaBarcode = codigo || sku
    
    if (!codigoParaBarcode) return null

    const isSmall = size === 'small'
    const width = isSmall ? 1.2 : 2
    const height = isSmall ? 35 : 50

    return (
        <div className={`${estilos.barcodeContainer} ${isSmall ? estilos.small : ''}`}>
            <Barcode
                value={String(codigoParaBarcode)}
                format="CODE128"
                width={width}
                height={height}
                displayValue={true}
                fontSize={isSmall ? 10 : 12}
                background={tema === 'dark' ? '#1e293b' : '#ffffff'}
                lineColor={tema === 'dark' ? '#f1f5f9' : '#0f172a'}
                margin={isSmall ? 4 : 8}
            />
            {codigo && sku && (
                <div className={estilos.barcodeLabels}>
                    <span className={estilos.barcodeLabel}>Código: {codigo}</span>
                    <span className={estilos.barcodeLabel}>SKU: {sku}</span>
                </div>
            )}
        </div>
    )
}

// ===============================================================
// COMPONENTE: ProductoCard (con React.memo para evitar re-renders)
// ===============================================================
const ProductoCard = React.memo(function ProductoCard({ producto, tema, formatearMoneda, manejarEliminar, procesando, estilos }) {
    return (
        <div className={`${estilos.card} ${estilos[tema]}`}>
            <div className={estilos.cardHeader}>
                <ImagenProducto
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className={estilos.imagen}
                    placeholder={true}
                    placeholderClassName={estilos.imagenPlaceholder}
                />
                {producto.stock <= producto.stock_minimo && (
                    <span className={estilos.badgeBajoStock}>Bajo Stock</span>
                )}
            </div>

            <div className={estilos.cardBody}>
                <h3 className={estilos.nombreProducto}>{producto.nombre}</h3>
                
                {/* Código de barras visual */}
                <div className={estilos.codigoInfo}>
                    <BarcodeProducto
                        codigo={producto.codigo_barras}
                        sku={producto.sku}
                        tema={tema}
                        estilos={estilos}
                        size="normal"
                    />
                </div>

                {producto.categoria_nombre && (
                    <span className={estilos.categoria}>{producto.categoria_nombre}</span>
                )}

                <div className={estilos.precios}>
                    <div className={estilos.precioItem}>
                        <span className={estilos.precioLabel}>Compra:</span>
                        <span className={estilos.precioValor}>
                            {formatearMoneda(producto.precio_compra)}
                        </span>
                    </div>
                    <div className={estilos.precioItem}>
                        <span className={estilos.precioLabel}>Venta:</span>
                        <span className={estilos.precioVenta}>
                            {formatearMoneda(producto.precio_venta)}
                        </span>
                    </div>
                </div>

                <div className={estilos.stock}>
                    <div className={estilos.stockInfo}>
                        <span className={estilos.stockLabel}>Stock:</span>
                        <span className={`${estilos.stockValor} ${producto.stock <= producto.stock_minimo ? estilos.stockBajo : ''}`}>
                            {producto.stock} {producto.unidad_medida_abreviatura}
                        </span>
                    </div>
                    <span className={estilos.stockMinimo}>
                        Mín: {producto.stock_minimo}
                    </span>
                </div>

                <div className={estilos.estado}>
                    <span className={`${estilos.badgeEstado} ${producto.activo ? estilos.activo : estilos.inactivo}`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            </div>

            <div className={estilos.cardFooter}>
                <Link
                    href={`/admin/productos/ver/${producto.id}`}
                    className={estilos.btnIcono}
                    title="Ver detalles"
                >
                    <ion-icon name="eye-outline"></ion-icon>
                </Link>
                <Link
                    href={`/admin/productos/editar/${producto.id}`}
                    className={`${estilos.btnIcono} ${estilos.editar}`}
                    title="Editar"
                >
                    <ion-icon name="create-outline"></ion-icon>
                </Link>
                <button
                    onClick={() => manejarEliminar(producto.id, producto.nombre)}
                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                    disabled={procesando}
                    title="Eliminar"
                >
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </div>
        </div>
    )
})

// Crear versión memoizada
const ProductoCardMemo = ProductoCard

// ===============================================================
// COMPONENTE: TablaProductos (con React.memo para evitar re-renders)
// ===============================================================
const TablaProductos = React.memo(function TablaProductos({ productos, tema, router, formatearMoneda, manejarEliminar, procesando, estilos }) {
    return (
        <div className={estilos.tablaContenedor}>
            <table className={estilos.tabla}>
                <thead>
                    <tr className={estilos[tema]}>
                        <th>Producto</th>
                        <th>Código/SKU</th>
                        <th>Categoría</th>
                        <th>Precios</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {productos.map((producto) => (
                        <tr key={producto.id} className={`${estilos.filaTabla} ${estilos[tema]}`}>
                            <td className={estilos.tdInfoPrincipal}>
                                <div className={estilos.imagenTabla}>
                                    <ImagenProducto
                                        src={producto.imagen_url}
                                        alt={producto.nombre}
                                        className={estilos.imagenTablaImg}
                                        placeholder={true}
                                        placeholderClassName={estilos.imagenTablaPlaceholder}
                                    />
                                </div>
                                <div className={estilos.nombreProductoTabla}>
                                    <strong>{producto.nombre}</strong>
                                    {producto.marca_nombre && (
                                        <span className={estilos.marcaTabla}>{producto.marca_nombre}</span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div className={estilos.codigoTabla}>
                                    <BarcodeProducto
                                        codigo={producto.codigo_barras}
                                        sku={producto.sku}
                                        tema={tema}
                                        estilos={estilos}
                                        size="small"
                                    />
                                </div>
                            </td>
                            <td>
                                <span className={estilos.categoriaTabla}>
                                    {producto.categoria_nombre || 'Sin categoría'}
                                </span>
                            </td>
                            <td>
                                <div className={estilos.preciosTabla}>
                                    <div className={estilos.precioTablaItem}>
                                        <span className={estilos.precioTablaLabel}>Compra:</span>
                                        <span className={estilos.precioTablaValor}>
                                            {formatearMoneda(producto.precio_compra)}
                                        </span>
                                    </div>
                                    <div className={estilos.precioTablaItem}>
                                        <span className={estilos.precioTablaLabel}>Venta:</span>
                                        <span className={estilos.precioTablaVenta}>
                                            {formatearMoneda(producto.precio_venta)}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={estilos.stockTabla}>
                                    <span className={`${estilos.stockTablaValor} ${producto.stock <= producto.stock_minimo ? estilos.stockBajo : ''}`}>
                                        {producto.stock} {producto.unidad_medida_abreviatura}
                                    </span>
                                    {producto.stock <= producto.stock_minimo && (
                                        <span className={estilos.badgeBajoStockTabla}>Bajo Stock</span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <span className={`${estilos.badgeTabla} ${producto.activo ? estilos.activo : estilos.inactivo}`}>
                                    {producto.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td>
                                <div className={estilos.accionesTabla}>
                                    <Link
                                        href={`/admin/productos/ver/${producto.id}`}
                                        className={estilos.btnTablaVer}
                                        title="Ver Perfil"
                                        aria-label="Ver Perfil"
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </Link>
                                    <Link
                                        href={`/admin/productos/editar/${producto.id}`}
                                        className={estilos.btnTablaEditar}
                                        title="Editar"
                                        aria-label="Editar Producto"
                                    >
                                        <ion-icon name="create-outline"></ion-icon>
                                    </Link>
                                    <button
                                        onClick={() => manejarEliminar(producto.id, producto.nombre)}
                                        className={estilos.btnTablaEliminar}
                                        disabled={procesando}
                                        title="Eliminar"
                                        aria-label="Eliminar Producto"
                                    >
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
})

// Crear versión memoizada
const TablaProductosMemo = TablaProductos