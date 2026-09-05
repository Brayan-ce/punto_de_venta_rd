"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Barcode from 'react-barcode'
import { obtenerProductos, obtenerFiltros, obtenerEstadisticas, eliminarProducto, eliminarProductos, eliminarTodosProductos, obtenerDatosEmpresa } from './servidor'
import { ImagenProducto } from '@/utils/imageUtils'
import { useServerActionRetry } from '@/hooks/useServerActionRetry'
import { useLanguage } from '@/_Pages/admin/i18n'
import ImportarProductos from './ImportarProductos'
import estilos from './productos.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ProductosAdmin() {
    const router = useRouter()
    const { executeWithRetry } = useServerActionRetry()
    const { t, language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargandoInicial, setCargandoInicial] = useState(true) // Solo para la carga inicial
    const [cargandoProductos, setCargandoProductos] = useState(false) // Para búsquedas y filtros
    const [productos, setProductos] = useState([])
    const primeraCarga = useRef(true) // Para evitar que el useEffect de filtros se ejecute en la carga inicial
    const [busqueda, setBusqueda] = useState('')
    const [busquedaInput, setBusquedaInput] = useState('') // Para debounce
    const [filtroCategoria, setFiltroCategoria] = useState('todos')
    const [filtroMarca, setFiltroMarca] = useState('todos')
    const [filtroEstado, setFiltroEstado] = useState('activo')
    const [categorias, setCategorias] = useState([])
    const [marcas, setMarcas] = useState([])
    const [procesando, setProcesando] = useState(false)
    const [seleccionados, setSeleccionados] = useState([])
    const [modalBorrarTodos, setModalBorrarTodos] = useState(false)
    const [modalBorrarSeleccion, setModalBorrarSeleccion] = useState(false)
    const [empresa, setEmpresa] = useState(null)
    
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
        valorInventario: 0,
        costoInventario: 0,
        gananciaProyectada: 0,
        margenProyectado: 0
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
                await Promise.all([cargarFiltros(), cargarEstadisticas(), cargarProductos(), cargarEmpresa()])
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
                alert(resultado.mensaje || tr('Error al cargar productos', 'Error loading products'))
            }
        } catch (error) {
            console.error('Error al cargar productos:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
        } finally {
            setCargandoProductos(false)
        }
    }

    const manejarEliminar = async (productoId, nombreProducto) => {
        if (!confirm(tr(
            `¿Estas seguro de eliminar el producto "${nombreProducto}"? Esta accion no se puede deshacer.`,
            `Are you sure you want to delete product "${nombreProducto}"? This action cannot be undone.`
        ))) {
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
                alert(resultado.mensaje || tr('Error al eliminar producto', 'Error deleting product'))
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    // Los productos ya vienen filtrados del backend, no necesitamos filtrar en frontend
    const productosFiltrados = productos

    // -------------------------------
    // Selección múltiple y borrado masivo
    // -------------------------------
    const toggleSeleccion = (id) => {
        setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const toggleSeleccionarTodo = () => {
        const ids = productosFiltrados.map(p => p.id)
        setSeleccionados(prev => prev.length > 0 && productosFiltrados.every(p => prev.includes(p.id)) ? [] : ids)
    }

    const manejarEliminarSeleccionados = async () => {
        if (seleccionados.length === 0) return
        setProcesando(true)
        try {
            const resultado = await executeWithRetry(() => eliminarProductos(seleccionados))
            if (resultado?.success) {
                setSeleccionados([])
                setModalBorrarSeleccion(false)
                await cargarProductos()
                await cargarEstadisticas()
                alert(resultado.mensaje)
            } else if (resultado) {
                alert(resultado.mensaje || tr('Error al eliminar productos', 'Error deleting products'))
            }
        } catch (error) {
            console.error('Error al eliminar productos:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    const manejarBorrarTodos = async () => {
        setProcesando(true)
        try {
            const resultado = await executeWithRetry(() => eliminarTodosProductos())
            if (resultado?.success) {
                setSeleccionados([])
                setModalBorrarTodos(false)
                await cargarProductos()
                await cargarEstadisticas()
                alert(resultado.mensaje)
            } else if (resultado) {
                alert(resultado.mensaje || tr('Error al eliminar productos', 'Error deleting products'))
            }
        } catch (error) {
            console.error('Error al eliminar todos los productos:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const localeEmpresa = empresa?.locale || 'es-DO'

    // Memoizar formatearMoneda para evitar re-renders innecesarios
    const formatearMoneda = useCallback((monto) => {
        try {
            const numero = new Intl.NumberFormat(localeEmpresa, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto || 0)
            return `${simboloMoneda} ${numero}`
        } catch {
            return `${simboloMoneda} ${Number(monto || 0).toFixed(2)}`
        }
    }, [simboloMoneda, localeEmpresa])
    
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
            return <LoadingScreen />
        }

        // Carga de productos (búsqueda/filtro): mostrar spinner pequeño sin ocultar layout
        if (cargandoProductos) {
            return (
                <div style={{ position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className={estilos.cargandoProductos}>
                        <ion-icon name="hourglass-outline" className={estilos.iconoCargandoProductos}></ion-icon>
                        <span>{t('pages.buscandoProductos')}</span>
                    </div>
                </div>
            )
        }

        if (productosFiltrados.length === 0) {
            return (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="cube-outline"></ion-icon>
                    <span>{t('pages.sinProductos')}</span>
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
                    t={t}
                    tr={tr}
                    seleccionados={seleccionados}
                    toggleSeleccion={toggleSeleccion}
                    toggleSeleccionarTodo={toggleSeleccionarTodo}
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
                        t={t}
                        tr={tr}
                        seleccionado={seleccionados.includes(producto.id)}
                        toggleSeleccion={toggleSeleccion}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{t('header.productos')}</h1>
                    <p className={estilos.subtitulo}>{t('pages.gestionarCatalogo')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <ImportarProductos onImportarCompleto={() => {
                        cargarProductos()
                        cargarEstadisticas()
                    }} />
                    <Link href="/admin/productos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>{t('pages.nuevoProducto')}</span>
                    </Link>
                </div>
            </div>

            <div className={`${estilos.estadisticas} ${estilos[tema]}`}>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{t('pages.totalProductos')}</span>
                        <span className={estilos.estadValor}>{stats.total}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{t('pages.activos')}</span>
                        <span className={estilos.estadValor}>{stats.activos}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{t('pages.bajoStock')}</span>
                        <span className={estilos.estadValor}>{stats.bajoStock}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{t('pages.valorInventario')}</span>
                        <span className={estilos.estadValor}>{formatearMoneda(stats.valorInventario)}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.info}`}>
                        <ion-icon name="wallet-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{t('pages.costoInventario')}</span>
                        <span className={estilos.estadValor}>{formatearMoneda(stats.costoInventario)}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="trending-up-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{t('pages.gananciaProyectada')}</span>
                        <span className={estilos.estadValor}>{formatearMoneda(stats.gananciaProyectada)}</span>
                    </div>
                </div>

                <div className={estilos.estadCard}>
                    <div className={`${estilos.estadIcono} ${stats.margenProyectado >= 0 ? estilos.success : estilos.warning}`}>
                        <ion-icon name="pie-chart-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{t('pages.margenProyectado')}</span>
                        <span className={estilos.estadValor}>{stats.margenProyectado}%</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.barraHerramientas}>
                    <div className={estilos.busqueda}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            placeholder={tr('Buscar por nombre, código o SKU...', 'Search by name, code or SKU...')}
                            value={busquedaInput}
                            onChange={(e) => setBusquedaInput(e.target.value)}
                            className={estilos.inputBusqueda}
                        />
                    </div>

                    <div className={estilos.selectoresVista}>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'tabla' ? estilos.vistaActiva : ''}`}
                            onClick={() => setVistaActual('tabla')}
                            title={tr('Vista de Lista', 'List View')}
                            aria-label={tr('Vista de Lista', 'List View')}
                        >
                            <ion-icon name="list-outline"></ion-icon>
                        </button>
                        <button
                            className={`${estilos.btnVista} ${vistaActual === 'cards' ? estilos.vistaActiva : ''}`}
                            onClick={() => setVistaActual('cards')}
                            title={tr('Vista de Tarjetas', 'Card View')}
                            aria-label={tr('Vista de Tarjetas', 'Card View')}
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
                        <option value="todos">{t('pages.todasCategorias')}</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={filtroMarca}
                        onChange={(e) => manejarCambioFiltro('marca', e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">{t('pages.todasMarcas')}</option>
                        {marcas.map(marca => (
                            <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={filtroEstado}
                        onChange={(e) => manejarCambioFiltro('estado', e.target.value)}
                        className={estilos.selectFiltro}
                    >
                        <option value="todos">{t('pages.todosEstados')}</option>
                        <option value="activo">{t('status.activo')}</option>
                        <option value="inactivo">{t('status.inactivo')}</option>
                        <option value="bajo_stock">{t('pages.bajoStock')}</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setModalBorrarTodos(true)}
                        disabled={procesando}
                        title={tr('Borrar todos los productos', 'Delete all products')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 8, border: '1.5px solid rgba(239,68,68,0.35)',
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap'
                        }}
                    >
                        <ion-icon name="trash-outline"></ion-icon>
                        <span>{tr('Borrar todos', 'Delete all')}</span>
                    </button>
                </div>
            </div>

            {/* Barra de selección múltiple */}
            {seleccionados.length > 0 && (
                <div
                    style={{
                        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                        padding: '10px 14px', margin: '12px 0', borderRadius: 10,
                        background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.3)'
                    }}
                >
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                        {seleccionados.length} {tr('seleccionado(s)', 'selected')}
                    </span>
                    <button
                        type="button"
                        onClick={toggleSeleccionarTodo}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                    >
                        {productosFiltrados.length > 0 && productosFiltrados.every(p => seleccionados.includes(p.id))
                            ? tr('Quitar selección', 'Clear selection')
                            : tr('Seleccionar todo', 'Select all')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setModalBorrarSeleccion(true)}
                        disabled={procesando}
                        style={{
                            marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8, border: '1.5px solid rgba(239,68,68,0.35)',
                            background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13
                        }}
                    >
                        <ion-icon name="trash-outline"></ion-icon>
                        {tr('Eliminar seleccionados', 'Delete selected')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSeleccionados([])}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                    >
                        {tr('Cancelar', 'Cancel')}
                    </button>
                </div>
            )}

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
                        {t('pages.anterior')}
                    </button>
                    
                    <div className={estilos.infoPaginacion}>
                        <span>{t('pages.pagina')} {page} {t('pages.de')} {paginacion.totalPages}</span>
                        <span className={estilos.totalProductos}>
                            ({paginacion.total.toLocaleString()} {t('pages.productosCount')})
                        </span>
                    </div>
                    
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={!paginacion.hasNext || cargandoProductos}
                        className={estilos.btnPaginacion}
                    >
                        {t('pages.siguiente')}
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </button>
                </div>
            )}

            {/* Modal: Borrar todos los productos */}
            {modalBorrarTodos && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: 22, maxWidth: 420, width: '100%' }}>
                        <h3 style={{ margin: '0 0 8px', color: '#ef4444', fontSize: 17 }}>{tr('Borrar todos los productos', 'Delete all products')}</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                            {tr('Se eliminarán TODOS los productos de esta empresa. Esta acción no se puede deshacer. ¿Continuar?', 'All products of this company will be deleted. This action cannot be undone. Continue?')}
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setModalBorrarTodos(false)}
                                disabled={procesando}
                                style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid var(--border-medium)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {tr('Cancelar', 'Cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={manejarBorrarTodos}
                                disabled={procesando}
                                style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {procesando ? tr('Eliminando...', 'Deleting...') : tr('Sí, borrar todos', 'Yes, delete all')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Eliminar seleccionados */}
            {modalBorrarSeleccion && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: 22, maxWidth: 420, width: '100%' }}>
                        <h3 style={{ margin: '0 0 8px', color: '#ef4444', fontSize: 17 }}>{tr('Eliminar productos seleccionados', 'Delete selected products')}</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                            {tr(`Se eliminarán ${seleccionados.length} producto(s) seleccionados. Esta acción no se puede deshacer. ¿Continuar?`, `Are you sure you want to delete ${seleccionados.length} selected product(s)? This cannot be undone.`)}
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setModalBorrarSeleccion(false)}
                                disabled={procesando}
                                style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid var(--border-medium)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {tr('Cancelar', 'Cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={manejarEliminarSeleccionados}
                                disabled={procesando}
                                style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {procesando ? tr('Eliminando...', 'Deleting...') : tr('Sí, eliminar', 'Yes, delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ===============================================================
// COMPONENTE: BarcodeProducto (Código de barras visual)
// ===============================================================
function BarcodeProducto({ codigo, sku, tema, estilos, tr, size = 'normal' }) {
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
                    <span className={estilos.barcodeLabel}>{tr('Código', 'Code')}: {codigo}</span>
                    <span className={estilos.barcodeLabel}>SKU: {sku}</span>
                </div>
            )}
        </div>
    )
}

// ===============================================================
// COMPONENTE: ProductoCard (con React.memo para evitar re-renders)
// ===============================================================
const ProductoCard = React.memo(function ProductoCard({ producto, tema, formatearMoneda, manejarEliminar, procesando, estilos, t, tr, seleccionado, toggleSeleccion }) {
    return (
        <div className={`${estilos.card} ${estilos[tema]}`}>
            <label
                style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    fontSize: 13, color: 'var(--text-secondary)', padding: '8px 8px 0', userSelect: 'none'
                }}
            >
                <input
                    type="checkbox"
                    checked={!!seleccionado}
                    onChange={() => toggleSeleccion(producto.id)}
                    style={{ width: 22, height: 22, accentColor: '#2563eb', cursor: 'pointer' }}
                />
                {tr('Seleccionar', 'Select')}
            </label>
            <div className={estilos.cardHeader}>
                <ImagenProducto
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className={estilos.imagen}
                    placeholder={true}
                    placeholderClassName={estilos.imagenPlaceholder}
                    placeholderText={tr('Sin imagen', 'No image')}
                />
                {producto.stock <= producto.stock_minimo && (
                    <span className={estilos.badgeBajoStock}>{t('pages.bajoStock')}</span>
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
                        tr={tr}
                        size="normal"
                    />
                </div>

                {producto.categoria_nombre && (
                    <span className={estilos.categoria}>{producto.categoria_nombre}</span>
                )}

                <div className={estilos.precios}>
                    <div className={estilos.precioItem}>
                        <span className={estilos.precioLabel}>{t('pages.compra')}:</span>
                        <span className={estilos.precioValor}>
                            {formatearMoneda(producto.precio_compra)}
                        </span>
                    </div>
                    <div className={estilos.precioItem}>
                        <span className={estilos.precioLabel}>{t('pages.precioVenta')}:</span>
                        <span className={estilos.precioVenta}>
                            {formatearMoneda(producto.precio_venta)}
                        </span>
                    </div>
                </div>

                <div className={estilos.stock}>
                    <div className={estilos.stockInfo}>
                        <span className={estilos.stockLabel}>{t('pages.stock')}:</span>
                        <span className={`${estilos.stockValor} ${producto.stock <= producto.stock_minimo ? estilos.stockBajo : ''}`}>
                            {producto.stock} {producto.unidad_medida_abreviatura}
                        </span>
                    </div>
                    <span className={estilos.stockMinimo}>
                        {t('pages.minimo')} {producto.stock_minimo}
                    </span>
                </div>

                <div className={estilos.estado}>
                    <span className={`${estilos.badgeEstado} ${producto.activo ? estilos.activo : estilos.inactivo}`}>
                        {producto.activo ? t('status.activo') : t('status.inactivo')}
                    </span>
                </div>
            </div>

            <div className={estilos.cardFooter}>
                <Link
                    href={`/admin/productos/ver/${producto.id}`}
                    className={estilos.btnIcono}
                    title={t('pages.verPerfil')}
                >
                    <ion-icon name="eye-outline"></ion-icon>
                </Link>
                <Link
                    href={`/admin/productos/editar/${producto.id}`}
                    className={`${estilos.btnIcono} ${estilos.editar}`}
                    title={t('buttons.editar')}
                >
                    <ion-icon name="create-outline"></ion-icon>
                </Link>
                <button
                    onClick={() => manejarEliminar(producto.id, producto.nombre)}
                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                    disabled={procesando}
                    title={t('buttons.eliminar')}
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
const TablaProductos = React.memo(function TablaProductos({ productos, tema, router, formatearMoneda, manejarEliminar, procesando, estilos, t, tr, seleccionados, toggleSeleccion, toggleSeleccionarTodo }) {
    const todosSeleccionados = productos.length > 0 && productos.every(p => seleccionados.includes(p.id))
    return (
        <div className={estilos.tablaContenedor}>
            <table className={estilos.tabla}>
                <thead>
                    <tr className={estilos[tema]}>
                        <th style={{ width: 46 }}>
                            <input
                                type="checkbox"
                                checked={todosSeleccionados}
                                onChange={toggleSeleccionarTodo}
                                style={{ width: 22, height: 22, accentColor: '#2563eb', cursor: 'pointer' }}
                            />
                        </th>
                        <th>{t('pages.productosTitle')}</th>
                        <th>{t('pages.codigoBarras')}/{t('pages.sku')}</th>
                        <th>{t('pages.categoria')}</th>
                        <th>{t('pages.precios')}</th>
                        <th>{t('pages.stock')}</th>
                        <th>{t('status.activo') || tr('Estado', 'Status')}</th>
                        <th>{tr('Acciones', 'Actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {productos.map((producto) => (
                        <tr key={producto.id} className={`${estilos.filaTabla} ${estilos[tema]}`}>
                            <td style={{ width: 46 }}>
                                <input
                                    type="checkbox"
                                    checked={seleccionados.includes(producto.id)}
                                    onChange={() => toggleSeleccion(producto.id)}
                                    style={{ width: 22, height: 22, accentColor: '#2563eb', cursor: 'pointer' }}
                                />
                            </td>
                            <td className={estilos.tdInfoPrincipal}>
                                <div className={estilos.imagenTabla}>
                                    <ImagenProducto
                                        src={producto.imagen_url}
                                        alt={producto.nombre}
                                        className={estilos.imagenTablaImg}
                                        placeholder={true}
                                        placeholderClassName={estilos.imagenTablaPlaceholder}
                                        placeholderText={tr('Sin imagen', 'No image')}
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
                                        tr={tr}
                                        size="small"
                                    />
                                </div>
                            </td>
                            <td>
                                <span className={estilos.categoriaTabla}>
                                    {producto.categoria_nombre || t('pages.sinCategoria')}
                                </span>
                            </td>
                            <td>
                                <div className={estilos.preciosTabla}>
                                    <div className={estilos.precioTablaItem}>
                                        <span className={estilos.precioTablaLabel}>{t('pages.compra')}:</span>
                                        <span className={estilos.precioTablaValor}>
                                            {formatearMoneda(producto.precio_compra)}
                                        </span>
                                    </div>
                                    <div className={estilos.precioTablaItem}>
                                        <span className={estilos.precioTablaLabel}>{t('pages.precioVenta')}:</span>
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
                                        <span className={estilos.badgeBajoStockTabla}>{t('pages.bajoStock')}</span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <span className={`${estilos.badgeTabla} ${producto.activo ? estilos.activo : estilos.inactivo}`}>
                                    {producto.activo ? t('status.activo') : t('status.inactivo')}
                                </span>
                            </td>
                            <td>
                                <div className={estilos.accionesTabla}>
                                    <Link
                                        href={`/admin/productos/ver/${producto.id}`}
                                        className={estilos.btnTablaVer}
                                        title={t('buttons.ver')}
                                        aria-label={t('buttons.ver')}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </Link>
                                    <Link
                                        href={`/admin/productos/editar/${producto.id}`}
                                        className={estilos.btnTablaEditar}
                                        title={t('buttons.editar')}
                                        aria-label={t('pages.editarProducto')}
                                    >
                                        <ion-icon name="create-outline"></ion-icon>
                                    </Link>
                                    <button
                                        onClick={() => manejarEliminar(producto.id, producto.nombre)}
                                        className={estilos.btnTablaEliminar}
                                        disabled={procesando}
                                        title={t('buttons.eliminar')}
                                        aria-label={t('pages.eliminarProducto')}
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