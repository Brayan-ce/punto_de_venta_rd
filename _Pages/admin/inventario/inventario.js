"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerInventario, registrarMovimiento, obtenerDatosEmpresa } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './inventario.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

// Tipos para productos y movimientos
/**
 * @typedef {Object} Producto
 * @property {number} id
 * @property {string} codigo_barras
 * @property {string} sku
 * @property {string} nombre
 * @property {number} stock
 * @property {number} stock_minimo
 * @property {number} stock_maximo
 * @property {number} precio_venta
 * @property {string} imagen_url
 * @property {number} categoria_id
 * @property {boolean} permite_decimales
 * @property {string} categoria_nombre
 * @property {string} unidad_medida_abreviatura
 */
/**
 * @typedef {Object} Movimiento
 * @property {number} id
 * @property {string} tipo
 * @property {number} cantidad
 * @property {number} stock_anterior
 * @property {number} stock_nuevo
 * @property {string} referencia
 * @property {string} notas
 * @property {string} fecha_movimiento
 * @property {string} producto_nombre
 * @property {string} usuario_nombre
 */

export default function InventarioAdmin() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [productos, setProductos] = useState([]) // Producto[]
    const [movimientos, setMovimientos] = useState([]) // Movimiento[]

    // Paginación productos
    const [paginaProd, setPaginaProd] = useState(1)
    const [prodPorPagina] = useState(20)
    // Paginación movimientos
    const [paginaMov, setPaginaMov] = useState(1)
    const [movPorPagina] = useState(15)
    const [categorias, setCategorias] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('todos')
    const [filtroTipo, setFiltroTipo] = useState('todos')
    const [mostrarModal, setMostrarModal] = useState(false)
    const [productoSeleccionado, setProductoSeleccionado] = useState(null)
    const [tipoMovimiento, setTipoMovimiento] = useState('entrada')
    const [cantidad, setCantidad] = useState('')
    const [notas, setNotas] = useState('')
    const [referencia, setReferencia] = useState('')
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

        cargarEmpresa()

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        cargarInventario()
    }, [])

    const cargarInventario = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerInventario()
            if (resultado.success) {
                setProductos(resultado.productos)
                setMovimientos(resultado.movimientos)
                setCategorias(resultado.categorias)
            } else {
                alert(resultado.mensaje || tr('Error al cargar inventario', 'Error loading inventory'))
            }
        } catch (error) {
            console.error('Error al cargar inventario:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
        } finally {
            setCargando(false)
        }
    }

    const abrirModalMovimiento = (producto) => {
        setProductoSeleccionado(producto)
        setTipoMovimiento('entrada')
        setCantidad('')
        setNotas('')
        setReferencia('')
        setMostrarModal(true)
    }

    const cerrarModal = () => {
        setMostrarModal(false)
        setProductoSeleccionado(null)
    }

    const validarFormulario = () => {
        const cantidadNum = parseFloat(cantidad)
        if (!cantidad || isNaN(cantidadNum) || cantidadNum <= 0) {
            alert(tr('Ingresa una cantidad valida', 'Enter a valid quantity'))
            return false
        }

        const stockDisponible = parseFloat(productoSeleccionado.stock) || 0
        if (tipoMovimiento === 'salida' && cantidadNum > stockDisponible) {
            alert(tr(`La cantidad no puede ser mayor al stock disponible (${stockDisponible})`, `Quantity cannot be greater than available stock (${stockDisponible})`))
            return false
        }

        return true
    }

    const manejarRegistrarMovimiento = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) return

        setProcesando(true)
        try {
            const datosMovimiento = {
                producto_id: productoSeleccionado.id,
                tipo: tipoMovimiento,
                cantidad: parseFloat(cantidad), // Usar parseFloat para soportar decimales
                referencia: referencia.trim() || null,
                notas: notas.trim() || null
            }

            const resultado = await registrarMovimiento(datosMovimiento)
            if (resultado.success) {
                await cargarInventario()
                cerrarModal()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || tr('Error al registrar movimiento', 'Error registering movement'))
            }
        } catch (error) {
            console.error('Error al registrar movimiento:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    const productosFiltrados = productos.filter(producto => {
        const cumpleBusqueda = busqueda === '' ||
            producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.codigo_barras?.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.sku?.toLowerCase().includes(busqueda.toLowerCase())
        const cumpleCategoria = filtroCategoria === 'todos' || producto.categoria_id === parseInt(filtroCategoria)
        return cumpleBusqueda && cumpleCategoria
    })
    // Paginación productos
    const totalPaginasProd = Math.ceil(productosFiltrados.length / prodPorPagina)
    const productosPagina = productosFiltrados.slice(
        (paginaProd - 1) * prodPorPagina,
        paginaProd * prodPorPagina
    )

    const movimientosFiltrados = movimientos.filter(movimiento => {
        return filtroTipo === 'todos' || movimiento.tipo === filtroTipo
    })
    // Paginación movimientos
    const totalPaginasMov = Math.ceil(movimientosFiltrados.length / movPorPagina)
    const movimientosPagina = movimientosFiltrados.slice(
        (paginaMov - 1) * movPorPagina,
        paginaMov * movPorPagina
    )

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const calcularEstadisticas = () => {
        const total = productos.length
        const bajoStock = productos.filter(p => p.stock <= p.stock_minimo).length
        const sinStock = productos.filter(p => p.stock === 0).length
        const valorTotal = productos.reduce((sum, p) => sum + (p.precio_venta * p.stock), 0)

        return { total, bajoStock, sinStock, valorTotal }
    }

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const localeEmpresa = empresa?.locale || 'es-DO'
    const monedaEmpresa = empresa?.moneda || 'DOP'

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat(localeEmpresa, {
            style: 'currency',
            currency: monedaEmpresa,
            minimumFractionDigits: 2
        }).format(monto)
    }

    const obtenerIconoTipo = (tipo) => {
        const iconos = {
            entrada: { icono: 'arrow-down-outline', color: 'success' },
            salida: { icono: 'arrow-up-outline', color: 'danger' },
            ajuste: { icono: 'create-outline', color: 'warning' },
            devolucion: { icono: 'return-down-back-outline', color: 'info' },
            merma: { icono: 'trash-outline', color: 'danger' }
        }
        return iconos[tipo] || iconos.entrada
    }

    const obtenerTextoTipo = (tipo) => {
        const textos = {
            entrada: tr('Entrada', 'Input'),
            salida: tr('Salida', 'Output'),
            ajuste: tr('Ajuste', 'Adjustment'),
            devolucion: tr('Devolucion', 'Return'),
            merma: tr('Merma', 'Shrinkage')
        }
        return textos[tipo] || tipo
    }

    const stats = calcularEstadisticas()

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Inventario', 'Inventory')}</h1>
                    <p className={estilos.subtitulo}>{tr('Control de stock y movimientos', 'Stock and movement control')}</p>
                </div>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Total Productos', 'Total Products')}</span>
                        <span className={estilos.estadValor}>{stats.total}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Bajo Stock', 'Low Stock')}</span>
                        <span className={estilos.estadValor}>{stats.bajoStock}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Sin Stock', 'Out of Stock')}</span>
                        <span className={estilos.estadValor}>{stats.sinStock}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Valor Total', 'Total Value')}</span>
                        <span className={estilos.estadValor}>{formatearMoneda(stats.valorTotal)}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.paneles}>
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>{tr('Stock de Productos', 'Product Stock')}</h2>
                        <div className={estilos.controles}>
                            <div className={estilos.busqueda}>
                                <ion-icon name="search-outline"></ion-icon>
                                <input
                                    type="text"
                                    placeholder={tr('Buscar productos...', 'Search products...')}
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className={estilos.inputBusqueda}
                                />
                            </div>
                            <select
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className={estilos.selectFiltro}
                            >
                                <option value="todos">{tr('Todas', 'All')}</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={estilos.panelBody}>
                        {cargando ? <LoadingScreen /> : productosFiltrados.length === 0 ? (
                            <div className={estilos.vacio}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <span>{tr('No hay productos que coincidan', 'No matching products')}</span>
                            </div>
                        ) : (
                            <div className={estilos.tabla}>
                                <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                                    <div>{tr('Producto', 'Product')}</div>
                                    <div>{tr('Categoria', 'Category')}</div>
                                    <div>{tr('Stock Actual', 'Current Stock')}</div>
                                    <div>{tr('Stock Minimo', 'Minimum Stock')}</div>
                                    <div>{tr('Stock Maximo', 'Maximum Stock')}</div>
                                    <div>{tr('Estado', 'Status')}</div>
                                    <div>{tr('Acciones', 'Actions')}</div>
                                </div>
                                <div className={estilos.tablaBody}>
                                    {productosPagina.map((producto) => (
                                        <div key={producto.id} className={`${estilos.fila} ${estilos[tema]}`}>
                                            <div className={estilos.productoInfo}>
                                                <span className={estilos.productoNombre}>{producto.nombre}</span>
                                                {producto.codigo_barras && (
                                                    <span className={estilos.productoCodigo}>
                                                        <ion-icon name="barcode-outline"></ion-icon>
                                                        {producto.codigo_barras}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <span className={estilos.categoria}>{producto.categoria_nombre || tr('Sin categoria', 'No category')}</span>
                                            </div>
                                            <div>
                                                <span className={`${estilos.stock} ${producto.stock <= producto.stock_minimo ? estilos.bajo : producto.stock === 0 ? estilos.agotado : ''}`}>
                                                    {producto.stock} {producto.unidad_medida_abreviatura}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={estilos.stockMinimo}>{producto.stock_minimo}</span>
                                            </div>
                                            <div>
                                                <span className={estilos.stockMaximo}>{producto.stock_maximo}</span>
                                            </div>
                                            <div>
                                                {producto.stock === 0 ? (
                                                    <span className={`${estilos.badge} ${estilos.agotado}`}>{tr('Agotado', 'Out')}</span>
                                                ) : producto.stock <= producto.stock_minimo ? (
                                                    <span className={`${estilos.badge} ${estilos.bajo}`}>{tr('Bajo', 'Low')}</span>
                                                ) : (
                                                    <span className={`${estilos.badge} ${estilos.normal}`}>{tr('Normal', 'Normal')}</span>
                                                )}
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => abrirModalMovimiento(producto)}
                                                    className={estilos.btnMovimiento}
                                                    title={tr('Registrar movimiento', 'Register movement')}
                                                >
                                                    <ion-icon name="swap-horizontal-outline"></ion-icon>
                                                    <span>{tr('Movimiento', 'Movement')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Controles de paginación productos */}
                                {totalPaginasProd > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '18px 0' }}>
                                        <button
                                            className={estilos.btnMovimiento}
                                            onClick={() => setPaginaProd(p => Math.max(1, p - 1))}
                                            disabled={paginaProd === 1}
                                            style={{ minWidth: 40 }}
                                        >
                                            &lt;
                                        </button>
                                        <span style={{ alignSelf: 'center', fontWeight: 600 }}>
                                            {tr('Página', 'Page')} {paginaProd} {tr('de', 'of')} {totalPaginasProd}
                                        </span>
                                        <button
                                            className={estilos.btnMovimiento}
                                            onClick={() => setPaginaProd(p => Math.min(totalPaginasProd, p + 1))}
                                            disabled={paginaProd === totalPaginasProd}
                                            style={{ minWidth: 40 }}
                                        >
                                            &gt;
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>{tr('Movimientos Recientes', 'Recent Movements')}</h2>
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className={estilos.selectFiltro}
                        >
                            <option value="todos">{tr('Todos', 'All')}</option>
                            <option value="entrada">{tr('Entradas', 'Inputs')}</option>
                            <option value="salida">{tr('Salidas', 'Outputs')}</option>
                            <option value="ajuste">{tr('Ajustes', 'Adjustments')}</option>
                            <option value="devolucion">{tr('Devoluciones', 'Returns')}</option>
                            <option value="merma">{tr('Mermas', 'Shrinkage')}</option>
                        </select>
                    </div>

                    <div className={estilos.panelBody}>
                        {movimientosFiltrados.length === 0 ? (
                            <div className={estilos.vacio}>
                                <ion-icon name="swap-horizontal-outline"></ion-icon>
                                <span>{tr('No hay movimientos registrados', 'No recorded movements')}</span>
                            </div>
                        ) : (
                            <div className={estilos.listaMovimientos}>
                                {movimientosPagina.map((movimiento) => {
                                    const tipoInfo = obtenerIconoTipo(movimiento.tipo)
                                    return (
                                        <div key={movimiento.id} className={`${estilos.movimientoItem} ${estilos[tema]}`}>
                                            <div className={`${estilos.movimientoIcono} ${estilos[tipoInfo.color]}`}>
                                                <ion-icon name={tipoInfo.icono}></ion-icon>
                                            </div>
                                            <div className={estilos.movimientoInfo}>
                                                <span className={estilos.movimientoProducto}>{movimiento.producto_nombre}</span>
                                                <div className={estilos.movimientoDetalles}>
                                                    <span className={estilos.movimientoTipo}>{obtenerTextoTipo(movimiento.tipo)}</span>
                                                    {movimiento.referencia && (
                                                        <span className={estilos.movimientoReferencia}>{tr('Ref:', 'Ref:')} {movimiento.referencia}</span>
                                                    )}
                                                </div>
                                                {movimiento.notas && (
                                                    <span className={estilos.movimientoNotas}>{movimiento.notas}</span>
                                                )}
                                            </div>
                                            <div className={estilos.movimientoCantidad}>
                                                <span className={estilos.cantidad}>
                                                    {movimiento.tipo === 'entrada' ? '+' : '-'}{movimiento.cantidad}
                                                </span>
                                                <span className={estilos.stockInfo}>
                                                    {movimiento.stock_anterior} → {movimiento.stock_nuevo}
                                                </span>
                                            </div>
                                            <div className={estilos.movimientoMeta}>
                                                <span className={estilos.movimientoUsuario}>{movimiento.usuario_nombre}</span>
                                                <span className={estilos.movimientoFecha}>{formatearFecha(movimiento.fecha_movimiento)}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                                {/* Controles de paginación movimientos */}
                                {totalPaginasMov > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '18px 0' }}>
                                        <button
                                            className={estilos.btnMovimiento}
                                            onClick={() => setPaginaMov(p => Math.max(1, p - 1))}
                                            disabled={paginaMov === 1}
                                            style={{ minWidth: 40 }}
                                        >
                                            &lt;
                                        </button>
                                        <span style={{ alignSelf: 'center', fontWeight: 600 }}>
                                            {tr('Página', 'Page')} {paginaMov} {tr('de', 'of')} {totalPaginasMov}
                                        </span>
                                        <button
                                            className={estilos.btnMovimiento}
                                            onClick={() => setPaginaMov(p => Math.min(totalPaginasMov, p + 1))}
                                            disabled={paginaMov === totalPaginasMov}
                                            style={{ minWidth: 40 }}
                                        >
                                            &gt;
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {mostrarModal && productoSeleccionado && (
                <div className={estilos.modalOverlay} onClick={cerrarModal}>
                    <div className={`${estilos.modal} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>{tr('Registrar Movimiento', 'Register Movement')}</h2>
                            <button className={estilos.btnCerrar} onClick={cerrarModal} disabled={procesando}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <form onSubmit={manejarRegistrarMovimiento} className={estilos.modalBody}>
                            <div className={estilos.productoSeleccionado}>
                                <div className={estilos.productoIcono}>
                                    {productoSeleccionado.imagen_url ? (
                                        <img src={productoSeleccionado.imagen_url} alt={productoSeleccionado.nombre} />
                                    ) : (
                                        <ion-icon name="cube-outline"></ion-icon>
                                    )}
                                </div>
                                <div className={estilos.productoDetalle}>
                                    <span className={estilos.productoNombreModal}>{productoSeleccionado.nombre}</span>
                                    <span className={estilos.productoStockModal}>
                                        {tr('Stock actual:', 'Current stock:')} {productoSeleccionado.stock} {productoSeleccionado.unidad_medida_abreviatura}
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Tipo de Movimiento *', 'Movement Type *')}</label>
                                <select
                                    value={tipoMovimiento}
                                    onChange={(e) => setTipoMovimiento(e.target.value)}
                                    className={estilos.select}
                                    required
                                    disabled={procesando}
                                >
                                    <option value="entrada">{tr('Entrada', 'Input')}</option>
                                    <option value="salida">{tr('Salida', 'Output')}</option>
                                    <option value="ajuste">{tr('Ajuste', 'Adjustment')}</option>
                                    <option value="devolucion">{tr('Devolucion', 'Return')}</option>
                                    <option value="merma">{tr('Merma', 'Shrinkage')}</option>
                                </select>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Cantidad *', 'Quantity *')}</label>
                                <input
                                    type="number"
                                    step={productoSeleccionado?.permite_decimales ? "0.001" : "1"}
                                    min="0.001"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(e.target.value)}
                                    className={estilos.input}
                                    required
                                    disabled={procesando}
                                    placeholder={productoSeleccionado?.permite_decimales ? "0.000" : "1"}
                                />
                                {productoSeleccionado?.unidad_medida_abreviatura && (
                                    <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
                                        {tr('Unidad:', 'Unit:')} {productoSeleccionado.unidad_medida_abreviatura}
                                    </small>
                                )}
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Referencia', 'Reference')}</label>
                                <input
                                    type="text"
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    className={estilos.input}
                                    disabled={procesando}
                                    placeholder={tr('Numero de documento, orden, etc.', 'Document number, order, etc.')}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Notas', 'Notes')}</label>
                                <textarea
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                    className={estilos.textarea}
                                    disabled={procesando}
                                    placeholder={tr('Observaciones adicionales...', 'Additional notes...')}
                                    rows="3"
                                />
                            </div>

                            <div className={estilos.modalFooter}>
                                <button type="button" className={estilos.btnCancelar} onClick={cerrarModal} disabled={procesando}>
                                    {tr('Cancelar', 'Cancel')}
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                    {procesando ? tr('Procesando...', 'Processing...') : tr('Registrar Movimiento', 'Register Movement')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}