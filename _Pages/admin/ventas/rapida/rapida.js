"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerProductosPOS, actualizarStockProducto, crearVentaRapida } from './servidor'
import { buscarClientes, crearClienteRapido } from '../nueva/servidor'
import { formatCurrency } from '@/utils/monedaUtils'
import styles from './rapida.module.css'

function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debounced
}

export default function VentaRapida({ returnPath = '/admin/ventas' }) {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [empresa, setEmpresa] = useState(null)
    const [tiposComprobante, setTiposComprobante] = useState([])

    // Catálogo
    const [categorias, setCategorias] = useState([])
    const [productos, setProductos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [categoriaActiva, setCategoriaActiva] = useState(null)
    const [busquedaProd, setBusquedaProd] = useState('')
    const [pagina, setPagina] = useState(1)
    const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 1 })

    const [aplicarItbis, setAplicarItbis] = useState(true)
    const [efectivoRecibido, setEfectivoRecibido] = useState('')
    const [descuentoGlobal, setDescuentoGlobal] = useState('')

    // Carrito
    const [carrito, setCarrito] = useState([])
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Cliente
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
    const [busquedaCliente, setBusquedaCliente] = useState('')
    const [clientes, setClientes] = useState([])
    const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false)
    const [inputClienteFocused, setInputClienteFocused] = useState(false)
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
    const [nombreClienteRapido, setNombreClienteRapido] = useState('')
    const busquedaClienteRef = useRef(null)

    // Modal stock
    const [productoEditar, setProductoEditar] = useState(null)
    const [nuevoStock, setNuevoStock] = useState('')
    const [guardandoStock, setGuardandoStock] = useState(false)

    // Estado general
    const [procesando, setProcesando] = useState(false)
    const [toast, setToast] = useState(null)

    // ─── Tema (dark / light) ──────────────────────────────────────────────────
    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        const fn = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', fn)
        window.addEventListener('storage', fn)
        return () => { window.removeEventListener('temaChange', fn); window.removeEventListener('storage', fn) }
    }, [])

    // Debounce
    const debouncedBusquedaProd = useDebounce(busquedaProd, 350)
    const debouncedBusquedaCliente = useDebounce(busquedaCliente, 300)

    // ─── Formato moneda ───────────────────────────────────────────────────────
    const formatearMonto = useCallback((monto) => {
        return formatCurrency(monto, {
            currency: empresa?.moneda || 'DOP',
            locale: empresa?.locale || 'es-DO',
            symbol: empresa?.simbolo_moneda || 'RD$'
        })
    }, [empresa])

    // ─── Totales ──────────────────────────────────────────────────────────────
    const porcentajeItbis = parseFloat(empresa?.impuesto_porcentaje || 18)

    const subtotal = useMemo(() =>
        carrito.reduce((acc, item) => acc + parseFloat(item.precio_venta || 0) * item.cantidad, 0),
        [carrito]
    )

    const itbis = useMemo(() => {
        if (!aplicarItbis) return 0
        return carrito.reduce((acc, item) => {
            if (!item.aplica_itbis) return acc
            return acc + parseFloat(item.precio_venta || 0) * item.cantidad * porcentajeItbis / 100
        }, 0)
    }, [carrito, porcentajeItbis, aplicarItbis])

    const montoGravado = useMemo(() => {
        if (!aplicarItbis) return 0
        return carrito.reduce((acc, item) => {
            if (!item.aplica_itbis) return acc
            return acc + parseFloat(item.precio_venta || 0) * item.cantidad
        }, 0)
    }, [carrito, aplicarItbis])

    const descuento = parseFloat(descuentoGlobal) || 0
    const total = Math.max(0, subtotal + itbis - descuento)
    const efectivoVal = parseFloat(efectivoRecibido)
    const efectivoIngresado = efectivoRecibido !== ''
    const efectivoInsuficiente = efectivoIngresado && efectivoVal < total
    const cambio = efectivoIngresado && efectivoVal >= total
        ? (efectivoVal - total).toFixed(2)
        : null

    // ─── Notificaciones ───────────────────────────────────────────────────────
    const notificar = useCallback((tipo, mensaje) => {
        setToast({ tipo, mensaje })
        setTimeout(() => setToast(null), 3500)
    }, [])

    // ─── Cargar productos ─────────────────────────────────────────────────────
    useEffect(() => {
        let active = true
        setCargando(true)
        obtenerProductosPOS({ pagina, categoriaId: categoriaActiva, busqueda: debouncedBusquedaProd })
            .then(res => {
                if (!active) return
                setCargando(false)
                if (res.success) {
                    setProductos(res.productos)
                    setCategorias(res.categorias)
                    setPaginacion(res.paginacion)
                    setEmpresa(prev => prev || res.empresa)
                    setTiposComprobante(prev => prev.length ? prev : (res.tiposComprobante || []))
                } else {
                    notificar('error', res.mensaje || 'Error al cargar productos')
                }
            })
        return () => { active = false }
    }, [pagina, categoriaActiva, debouncedBusquedaProd, notificar])

    // ─── Buscar clientes ──────────────────────────────────────────────────────
    useEffect(() => {
        if (clienteSeleccionado) return
        let active = true
        buscarClientes(debouncedBusquedaCliente).then(res => {
            if (!active) return
            if (res.success) {
                setClientes(res.clientes)
                setMostrarDropdownClientes(inputClienteFocused && res.clientes.length > 0)
            }
        })
        return () => { active = false }
    }, [debouncedBusquedaCliente, inputClienteFocused, clienteSeleccionado])

    // ─── Click fuera del dropdown ─────────────────────────────────────────────
    useEffect(() => {
        const handle = (e) => {
            if (busquedaClienteRef.current && !busquedaClienteRef.current.contains(e.target)) {
                setMostrarDropdownClientes(false)
                setInputClienteFocused(false)
            }
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    // ─── Carrito ──────────────────────────────────────────────────────────────
    function agregarAlCarrito(producto) {
        if (producto.stock <= 0) return
        setCarrito(prev => {
            const existe = prev.find(i => i.id === producto.id)
            if (existe) {
                if (existe.cantidad >= producto.stock) return prev
                return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
            }
            return [...prev, { ...producto, cantidad: 1 }]
        })
    }

    function cambiarCantidad(id, delta) {
        setCarrito(prev => {
            const item = prev.find(i => i.id === id)
            if (!item) return prev
            const nc = item.cantidad + delta
            if (nc <= 0) return prev.filter(i => i.id !== id)
            if (nc > item.stock) return prev
            return prev.map(i => i.id === id ? { ...i, cantidad: nc } : i)
        })
    }

    function quitarDelCarrito(id) {
        setCarrito(prev => prev.filter(i => i.id !== id))
    }

    // ─── Cliente ──────────────────────────────────────────────────────────────
    function seleccionarCliente(c) {
        setClienteSeleccionado(c)
        setBusquedaCliente(c.nombre_completo)
        setMostrarDropdownClientes(false)
        setInputClienteFocused(false)
    }

    function limpiarCliente() {
        setClienteSeleccionado(null)
        setBusquedaCliente('')
        setClientes([])
        setMostrarDropdownClientes(false)
    }

    async function crearClienteRapidoHandler(e) {
        e.preventDefault()
        const nombre = nombreClienteRapido.trim()
        if (!nombre) return
        setProcesando(true)
        const res = await crearClienteRapido(nombre)
        setProcesando(false)
        if (res.success) {
            seleccionarCliente({
                id: res.cliente?.id,
                nombre_completo: res.cliente?.nombre || nombre,
                tipo_documento: res.cliente?.tipo_documento || '',
                numero_documento: res.cliente?.numero_documento || '',
            })
            setMostrarModalCliente(false)
            notificar('success', `Cliente "${nombre}" creado`)
        } else {
            notificar('error', res.mensaje || 'Error al crear cliente')
        }
    }

    // ─── Stock ────────────────────────────────────────────────────────────────
    function abrirEditarStock(prod, e) {
        e.stopPropagation()
        setProductoEditar(prod)
        setNuevoStock(String(prod.stock))
    }

    async function guardarStock(e) {
        e.preventDefault()
        if (!productoEditar) return
        setGuardandoStock(true)
        const res = await actualizarStockProducto(productoEditar.id, nuevoStock)
        setGuardandoStock(false)
        if (res.success) {
            setProductos(prev => prev.map(p =>
                p.id === productoEditar.id ? { ...p, stock: parseFloat(nuevoStock) } : p
            ))
            setProductoEditar(null)
            notificar('success', 'Stock actualizado')
        } else {
            notificar('error', res.mensaje || 'Error al actualizar stock')
        }
    }

    // ─── Procesar venta ───────────────────────────────────────────────────────
    async function handleProcesarVenta() {
        if (carrito.length === 0 || procesando) return
        setProcesando(true)

        const efectivoVal = parseFloat(efectivoRecibido) || parseFloat(total.toFixed(2))
        const cambioVal   = Math.max(0, efectivoVal - parseFloat(total.toFixed(2)))

        const datosVenta = {
            productos: carrito.map(item => ({
                producto_id: item.id,
                cantidad: item.cantidad,
                precio_unitario: parseFloat(item.precio_venta || 0),
                cantidad_despachar: item.cantidad,
            })),
            cliente_id: clienteSeleccionado?.id || null,
            metodo_pago: 'efectivo',
            efectivo_recibido: efectivoVal,
            cambio: cambioVal,
            tipo_comprobante_id: tiposComprobante[0]?.id || null,
            subtotal: parseFloat(subtotal.toFixed(2)),
            descuento: parseFloat(descuento.toFixed(2)),
            monto_gravado: parseFloat(montoGravado.toFixed(2)),
            itbis: parseFloat(itbis.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            tipo_entrega: 'completa',
            notas: '',
            extras: [],
        }

        const res = await crearVentaRapida(datosVenta)
        setProcesando(false)

        if (res.success) {
            router.push(`${returnPath.replace('/ventas', '')}/ventas/imprimir/${res.venta.id}`)
        } else {
            notificar('error', res.mensaje || 'Error al procesar venta')
        }
    }

    // ─── Cambio de categoría ──────────────────────────────────────────────────
    function cambiarCategoria(catId) {
        setCategoriaActiva(catId)
        setPagina(1)
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className={`${styles.container} ${styles[tema]}`}>
            {sidebarOpen && (
                <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Contenido principal ── */}
            <main className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        <ion-icon name="flash-outline" />
                        <h1>Venta Rápida</h1>
                    </div>
                    <button className={styles.cartToggle} type="button" onClick={() => setSidebarOpen(true)}>
                        <ion-icon name="cart-outline" />
                        {carrito.length > 0 && <span className={styles.cartBadge}>{carrito.length}</span>}
                    </button>
                </div>

                {/* Categorías */}
                <div className={styles.categories}>
                    <button
                        className={`${styles.catBtn} ${categoriaActiva === null ? styles.catActive : ''}`}
                        onClick={() => cambiarCategoria(null)}
                        type="button"
                    >
                        <ion-icon name="grid-outline" />
                        Todas
                    </button>
                    {categorias.map(cat => (
                        <button
                            key={cat.id}
                            className={`${styles.catBtn} ${categoriaActiva === cat.id ? styles.catActive : ''}`}
                            onClick={() => cambiarCategoria(cat.id)}
                            type="button"
                        >
                            {cat.nombre}
                        </button>
                    ))}
                </div>

                {/* Búsqueda de producto */}
                <div className={styles.searchRow}>
                    <div className={styles.searchWrap}>
                        <ion-icon name="search-outline" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={busquedaProd}
                            onChange={e => { setBusquedaProd(e.target.value); setPagina(1) }}
                            className={styles.searchInput}
                        />
                        {busquedaProd && (
                            <button
                                className={styles.clearSearch}
                                type="button"
                                onClick={() => { setBusquedaProd(''); setPagina(1) }}
                            >
                                <ion-icon name="close-outline" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Productos */}
                <div className={styles.productsWrap}>
                    {cargando ? (
                        <div className={styles.grid}>
                            <div className={styles.stateBox}>
                                <ion-icon name="sync-outline" />
                                <span>Cargando productos...</span>
                            </div>
                        </div>
                    ) : productos.length === 0 ? (
                        <div className={styles.grid}>
                            <div className={styles.stateBox}>
                                <ion-icon name="search-outline" />
                                <span>No se encontraron productos</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.grid}>
                                {productos.map(prod => (
                                    <div
                                        key={prod.id}
                                        className={`${styles.card} ${prod.stock <= 0 ? styles.cardEmpty : ''}`}
                                        onClick={() => agregarAlCarrito(prod)}
                                        tabIndex={prod.stock > 0 ? 0 : -1}
                                        onKeyDown={e => e.key === 'Enter' && agregarAlCarrito(prod)}
                                    >
                                        <div className={styles.cardImg}>
                                            {prod.imagen_url ? (
                                                <img src={prod.imagen_url} alt={prod.nombre} />
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                    <ion-icon name="cube-outline" style={{ fontSize: '2.5rem', color: 'var(--text-tertiary)' }} />
                                                </div>
                                            )}
                                            {prod.stock <= 0 && <span className={styles.sinStock}>Sin stock</span>}
                                            {prod.stock > 0 && (
                                                <div className={styles.addOverlay}>
                                                    <ion-icon name="add-outline" />
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.cardBody}>
                                            <p className={styles.cardName}>{prod.nombre}</p>
                                            <p className={styles.cardPrice}>{formatearMonto(prod.precio_venta)}</p>
                                            <div className={styles.cardFooter}>
                                                <span className={styles.cardStock}>Stock: {prod.stock}</span>
                                                <button
                                                    className={styles.editStockBtn}
                                                    type="button"
                                                    onClick={e => abrirEditarStock(prod, e)}
                                                >
                                                    <ion-icon name="create-outline" />
                                                    Editar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {paginacion.totalPaginas > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.pageBtn}
                                        type="button"
                                        onClick={() => setPagina(p => Math.max(1, p - 1))}
                                        disabled={pagina <= 1}
                                    >
                                        <ion-icon name="chevron-back-outline" />
                                    </button>
                                    <span className={styles.pageInfo}>Pág. {pagina} / {paginacion.totalPaginas}</span>
                                    <button
                                        className={styles.pageBtn}
                                        type="button"
                                        onClick={() => setPagina(p => Math.min(paginacion.totalPaginas, p + 1))}
                                        disabled={pagina >= paginacion.totalPaginas}
                                    >
                                        <ion-icon name="chevron-forward-outline" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* ── Sidebar ── */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHead}>
                    <div className={styles.sidebarTitle}>
                        <ion-icon name="cart-outline" />
                        <h2>Carrito ({carrito.length})</h2>
                    </div>
                    <button className={styles.closeSidebar} type="button" onClick={() => setSidebarOpen(false)}>
                        <ion-icon name="close-outline" />
                    </button>
                </div>

                <div className={styles.cartBody}>
                    {carrito.length === 0 ? (
                        <div className={styles.emptyCart}>
                            <ion-icon name="cart-outline" />
                            <p>El carrito está vacío</p>
                        </div>
                    ) : (
                        carrito.map(item => (
                            <div key={item.id} className={styles.cartItem}>
                                <div className={styles.cartItemInfo}>
                                    <p className={styles.cartItemName}>{item.nombre}</p>
                                    <p className={styles.cartItemPrice}>{formatearMonto(item.precio_venta)} c/u</p>
                                </div>
                                <div className={styles.qtyControl}>
                                    <button type="button" onClick={() => cambiarCantidad(item.id, -1)}>
                                        <ion-icon name="remove-outline" />
                                    </button>
                                    <span>{item.cantidad}</span>
                                    <button type="button" onClick={() => cambiarCantidad(item.id, 1)}>
                                        <ion-icon name="add-outline" />
                                    </button>
                                </div>
                                <span className={styles.cartItemSub}>
                                    {formatearMonto(parseFloat(item.precio_venta || 0) * item.cantidad)}
                                </span>
                                <button className={styles.removeBtn} type="button" onClick={() => quitarDelCarrito(item.id)}>
                                    <ion-icon name="trash-outline" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* ── Cliente ── */}
                <div className={styles.customerSection}>
                    <span className={styles.sectionLabel}>Cliente (opcional)</span>
                    <div className={styles.clienteControles} ref={busquedaClienteRef}>
                        <div className={styles.busquedaClienteContainer}>
                            <div className={styles.busquedaCliente}>
                                <ion-icon name="search-outline" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    value={busquedaCliente}
                                    className={styles.inputBusquedaCliente}
                                    onFocus={() => setInputClienteFocused(true)}
                                    onChange={e => { if (clienteSeleccionado) return; setBusquedaCliente(e.target.value) }}
                                    readOnly={!!clienteSeleccionado}
                                />
                                {clienteSeleccionado && (
                                    <button
                                        type="button"
                                        className={styles.btnLimpiarCliente}
                                        onClick={e => { e.preventDefault(); e.stopPropagation(); limpiarCliente() }}
                                    >
                                        <ion-icon name="close-circle" />
                                    </button>
                                )}
                            </div>
                            {mostrarDropdownClientes && clientes.length > 0 && !clienteSeleccionado && (
                                <div className={styles.dropdownClientes}>
                                    {clientes.map(c => (
                                        <div
                                            key={c.id}
                                            className={styles.dropdownItemCliente}
                                            onClick={() => seleccionarCliente(c)}
                                        >
                                            <div className={styles.clienteInfo}>
                                                <span className={styles.clienteNombre}>{c.nombre_completo}</span>
                                                <span className={styles.clienteDoc}>{c.tipo_documento}: {c.numero_documento}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className={styles.btnClienteRapido}
                            onClick={() => { setNombreClienteRapido(''); setMostrarModalCliente(true) }}
                        >
                            <ion-icon name="person-add-outline" />
                            <span>Rápido</span>
                        </button>
                    </div>
                </div>

                {/* ── Totales ── */}
                <div className={styles.summarySection}>
                    <div className={styles.camposVenta}>
                        <div className={styles.campoCompacto}>
                            <label>Efectivo Recibido</label>
                            <div className={styles.inputConIcono}>
                                <span className={styles.iconoMoneda}>{empresa?.simbolo_moneda || 'RD$'}</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={efectivoRecibido}
                                    onChange={e => setEfectivoRecibido(e.target.value)}
                                    placeholder="0.00"
                                    className={`${styles.inputMoneda} ${
                                        !efectivoIngresado ? '' :
                                        efectivoInsuficiente ? styles.inputMonedaError :
                                        styles.inputMonedaOk
                                    }`}
                                />
                            </div>
                            {efectivoInsuficiente && (
                                <span className={styles.textoInsuficiente}>
                                    <ion-icon name="alert-circle-outline" />
                                    Monto insuficiente (faltan {formatearMonto(total - efectivoVal)})
                                </span>
                            )}
                        </div>
                        {cambio !== null && (
                            <div className={styles.cambioInfo}>
                                <span>Cambio:</span>
                                <strong>{formatearMonto(parseFloat(cambio))}</strong>
                            </div>
                        )}
                        <div className={styles.campoCompacto}>
                            <label>Descuento Global</label>
                            <div className={styles.inputConIcono}>
                                <span className={styles.iconoMoneda}>{empresa?.simbolo_moneda || 'RD$'}</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={descuentoGlobal}
                                    onChange={e => setDescuentoGlobal(e.target.value)}
                                    placeholder="0.00"
                                    className={styles.inputMoneda}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.desgloseTotales}>
                        <div className={styles.lineaTotalCompacta}>
                            <span>Subtotal:</span>
                            <span>{formatearMonto(subtotal)}</span>
                        </div>
                        {descuento > 0 && (
                            <div className={`${styles.lineaTotalCompacta} ${styles.lineaDescuento}`}>
                                <span>Descuento:</span>
                                <span>- {formatearMonto(descuento)}</span>
                            </div>
                        )}
                        <div className={styles.lineaTotalCompacta}>
                            <label className={styles.itbisToggle}>
                                <input
                                    type="checkbox"
                                    checked={aplicarItbis}
                                    onChange={e => setAplicarItbis(e.target.checked)}
                                    className={styles.itbisCheck}
                                />
                                <span>{empresa?.impuesto_nombre || 'ITBIS'} ({aplicarItbis ? porcentajeItbis : 0}%):</span>
                            </label>
                            <span>{formatearMonto(itbis)}</span>
                        </div>
                        <div className={styles.separadorTotal} />
                        <div className={styles.totalFinal}>
                            <span>Total:</span>
                            <span>{formatearMonto(total)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Acciones ── */}
                <div className={styles.sidebarActions}>
                    <button
                        className={styles.chargeBtn}
                        type="button"
                        onClick={handleProcesarVenta}
                        disabled={carrito.length === 0 || procesando || !efectivoIngresado || efectivoInsuficiente}
                    >
                        {procesando ? (
                            <><ion-icon name="hourglass-outline" /><span>Procesando...</span></>
                        ) : (
                            <><ion-icon name="card-outline" /><span>Cobrar {formatearMonto(total)}</span></>
                        )}
                    </button>
                    <button
                        className={styles.clearBtn}
                        type="button"
                        onClick={() => setCarrito([])}
                        disabled={carrito.length === 0}
                    >
                        Vaciar carrito
                    </button>
                </div>
            </aside>

            {/* ── Modal: Editar stock ── */}
            {productoEditar && (
                <div className={styles.modalBg} onClick={() => !guardandoStock && setProductoEditar(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHead}>
                            <h3>Editar Stock</h3>
                            <button type="button" onClick={() => setProductoEditar(null)} disabled={guardandoStock}>
                                <ion-icon name="close-outline" />
                            </button>
                        </div>
                        <form onSubmit={guardarStock}>
                            <div className={styles.modalBody}>
                                <div className={styles.infoChip}>
                                    <ion-icon name="cube-outline" />
                                    <div>
                                        <label>Producto</label>
                                        <p>{productoEditar.nombre}</p>
                                    </div>
                                </div>
                                <div className={styles.infoChip}>
                                    <ion-icon name="layers-outline" />
                                    <div>
                                        <label>Stock actual</label>
                                        <p>{productoEditar.stock}</p>
                                    </div>
                                </div>
                                <div className={styles.stockField}>
                                    <label>Nuevo stock</label>
                                    <div className={styles.stockInputWrap}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={nuevoStock}
                                            onChange={e => setNuevoStock(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                        <span>unidades</span>
                                    </div>
                                </div>
                                {nuevoStock !== '' && parseFloat(nuevoStock) < parseFloat(productoEditar.stock) && (
                                    <div className={styles.warningBox}>
                                        <ion-icon name="warning-outline" />
                                        <span>El stock se reducirá</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.modalFoot}>
                                <button
                                    type="button"
                                    className={styles.cancelBtn}
                                    onClick={() => setProductoEditar(null)}
                                    disabled={guardandoStock}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={styles.confirmBtn}
                                    disabled={guardandoStock || !nuevoStock}
                                >
                                    {guardandoStock ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal: Crear cliente rápido ── */}
            {mostrarModalCliente && (
                <div className={styles.modalBg} onClick={() => !procesando && setMostrarModalCliente(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHead}>
                            <h3>Cliente Rápido</h3>
                            <button type="button" onClick={() => setMostrarModalCliente(false)} disabled={procesando}>
                                <ion-icon name="close-outline" />
                            </button>
                        </div>
                        <form onSubmit={crearClienteRapidoHandler}>
                            <div className={styles.modalBody}>
                                <p className={styles.infoModal}>
                                    Crea un cliente rápido con solo el nombre. Podrás completar sus datos más tarde.
                                </p>
                                <div className={styles.grupoInput}>
                                    <label>Nombre del Cliente *</label>
                                    <input
                                        type="text"
                                        value={nombreClienteRapido}
                                        onChange={e => setNombreClienteRapido(e.target.value)}
                                        placeholder="Ej: Juan Pérez"
                                        className={styles.inputField}
                                        required
                                        disabled={procesando}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFoot}>
                                <button
                                    type="button"
                                    className={styles.cancelBtn}
                                    onClick={() => setMostrarModalCliente(false)}
                                    disabled={procesando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={styles.confirmBtn}
                                    disabled={procesando || !nombreClienteRapido.trim()}
                                >
                                    {procesando ? 'Creando...' : 'Crear Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Toast ── */}
            {toast && (
                <div className={`${styles.toast} ${styles[toast.tipo]}`}>
                    <ion-icon name={
                        toast.tipo === 'success' ? 'checkmark-circle-outline' :
                        toast.tipo === 'warning' ? 'warning-outline' :
                        'alert-circle-outline'
                    } />
                    <span>{toast.mensaje}</span>
                </div>
            )}
        </div>
    )
}
