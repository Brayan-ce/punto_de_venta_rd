"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerInventario, registrarMovimiento } from './servidor'
import estilos from './inventario.module.css'

export default function InventarioAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [productos, setProductos] = useState([])
    const [movimientos, setMovimientos] = useState([])
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
                alert(resultado.mensaje || 'Error al cargar inventario')
            }
        } catch (error) {
            console.error('Error al cargar inventario:', error)
            alert('Error al cargar datos')
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
            alert('Ingresa una cantidad valida')
            return false
        }

        const stockDisponible = parseFloat(productoSeleccionado.stock) || 0
        if (tipoMovimiento === 'salida' && cantidadNum > stockDisponible) {
            alert(`La cantidad no puede ser mayor al stock disponible (${stockDisponible})`)
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
                alert(resultado.mensaje || 'Error al registrar movimiento')
            }
        } catch (error) {
            console.error('Error al registrar movimiento:', error)
            alert('Error al procesar la solicitud')
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

    const movimientosFiltrados = movimientos.filter(movimiento => {
        return filtroTipo === 'todos' || movimiento.tipo === filtroTipo
    })

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
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

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
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
            entrada: 'Entrada',
            salida: 'Salida',
            ajuste: 'Ajuste',
            devolucion: 'Devolucion',
            merma: 'Merma'
        }
        return textos[tipo] || tipo
    }

    const stats = calcularEstadisticas()

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Inventario</h1>
                    <p className={estilos.subtitulo}>Control de stock y movimientos</p>
                </div>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Productos</span>
                        <span className={estilos.estadValor}>{stats.total}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Bajo Stock</span>
                        <span className={estilos.estadValor}>{stats.bajoStock}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Sin Stock</span>
                        <span className={estilos.estadValor}>{stats.sinStock}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Valor Total</span>
                        <span className={estilos.estadValor}>{formatearMoneda(stats.valorTotal)}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.paneles}>
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>Stock de Productos</h2>
                        <div className={estilos.controles}>
                            <div className={estilos.busqueda}>
                                <ion-icon name="search-outline"></ion-icon>
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
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
                                <option value="todos">Todas</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={estilos.panelBody}>
                        {cargando ? (
                            <div className={estilos.cargando}>
                                <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                                <span>Cargando productos...</span>
                            </div>
                        ) : productosFiltrados.length === 0 ? (
                            <div className={estilos.vacio}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <span>No hay productos que coincidan</span>
                            </div>
                        ) : (
                            <div className={estilos.tabla}>
                                <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                                    <div>Producto</div>
                                    <div>Categoria</div>
                                    <div>Stock Actual</div>
                                    <div>Stock Minimo</div>
                                    <div>Stock Maximo</div>
                                    <div>Estado</div>
                                    <div>Acciones</div>
                                </div>
                                <div className={estilos.tablaBody}>
                                    {productosFiltrados.map((producto) => (
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
                                                <span className={estilos.categoria}>{producto.categoria_nombre || 'Sin categoria'}</span>
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
                                                    <span className={`${estilos.badge} ${estilos.agotado}`}>Agotado</span>
                                                ) : producto.stock <= producto.stock_minimo ? (
                                                    <span className={`${estilos.badge} ${estilos.bajo}`}>Bajo</span>
                                                ) : (
                                                    <span className={`${estilos.badge} ${estilos.normal}`}>Normal</span>
                                                )}
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => abrirModalMovimiento(producto)}
                                                    className={estilos.btnMovimiento}
                                                    title="Registrar movimiento"
                                                >
                                                    <ion-icon name="swap-horizontal-outline"></ion-icon>
                                                    <span>Movimiento</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>Movimientos Recientes</h2>
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className={estilos.selectFiltro}
                        >
                            <option value="todos">Todos</option>
                            <option value="entrada">Entradas</option>
                            <option value="salida">Salidas</option>
                            <option value="ajuste">Ajustes</option>
                            <option value="devolucion">Devoluciones</option>
                            <option value="merma">Mermas</option>
                        </select>
                    </div>

                    <div className={estilos.panelBody}>
                        {movimientosFiltrados.length === 0 ? (
                            <div className={estilos.vacio}>
                                <ion-icon name="swap-horizontal-outline"></ion-icon>
                                <span>No hay movimientos registrados</span>
                            </div>
                        ) : (
                            <div className={estilos.listaMovimientos}>
                                {movimientosFiltrados.map((movimiento) => {
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
                                                        <span className={estilos.movimientoReferencia}>Ref: {movimiento.referencia}</span>
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
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {mostrarModal && productoSeleccionado && (
                <div className={estilos.modalOverlay} onClick={cerrarModal}>
                    <div className={`${estilos.modal} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Registrar Movimiento</h2>
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
                                        Stock actual: {productoSeleccionado.stock} {productoSeleccionado.unidad_medida_abreviatura}
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Tipo de Movimiento *</label>
                                <select
                                    value={tipoMovimiento}
                                    onChange={(e) => setTipoMovimiento(e.target.value)}
                                    className={estilos.select}
                                    required
                                    disabled={procesando}
                                >
                                    <option value="entrada">Entrada</option>
                                    <option value="salida">Salida</option>
                                    <option value="ajuste">Ajuste</option>
                                    <option value="devolucion">Devolucion</option>
                                    <option value="merma">Merma</option>
                                </select>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Cantidad *</label>
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
                                        Unidad: {productoSeleccionado.unidad_medida_abreviatura}
                                    </small>
                                )}
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Referencia</label>
                                <input
                                    type="text"
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    className={estilos.input}
                                    disabled={procesando}
                                    placeholder="Numero de documento, orden, etc."
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Notas</label>
                                <textarea
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                    className={estilos.textarea}
                                    disabled={procesando}
                                    placeholder="Observaciones adicionales..."
                                    rows="3"
                                />
                            </div>

                            <div className={estilos.modalFooter}>
                                <button type="button" className={estilos.btnCancelar} onClick={cerrarModal} disabled={procesando}>
                                    Cancelar
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                    {procesando ? 'Procesando...' : 'Registrar Movimiento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}