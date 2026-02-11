"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerClientes } from '@/_Pages/admin/clientes/servidor'
import { obtenerProductos } from '@/_Pages/admin/productos/servidor'
import { calcularTotalesCotizacion } from '@/utils/cotizacionUtils'
import { Save, User, Package, Trash2, ArrowLeft, Search, AlertCircle, X } from 'lucide-react'
import { formatearMoneda } from '@/utils/cotizacionUtils'
import estilos from './nuevo.module.css'
import Link from 'next/link'
import { crearCotizacion } from './servidor'

export default function NuevaCotizacion() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(false)

    // Datos de la cotización
    const [clienteId, setClienteId] = useState('')
    const [productosCotizacion, setProductosCotizacion] = useState([])
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0])
    const [fechaVencimiento, setFechaVencimiento] = useState('')
    const [descuento, setDescuento] = useState(0)
    const [observaciones, setObservaciones] = useState('')

    // Listas para selección
    const [clientes, setClientes] = useState([])
    const [productosDisponibles, setProductosDisponibles] = useState([])

    // Totales calculados
    const [totales, setTotales] = useState({ subtotal: 0, itbis: 0, total: 0 })
    
    // Estados adicionales
    const [errores, setErrores] = useState({})
    const [busquedaProducto, setBusquedaProducto] = useState('')
    const [productosFiltrados, setProductosFiltrados] = useState([])

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        // Cargar 15 días después para vencimiento por defecto
        const hoy = new Date()
        hoy.setDate(hoy.getDate() + 15)
        setFechaVencimiento(hoy.toISOString().split('T')[0])

        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        try {
            const [resCli, resProd] = await Promise.all([
                obtenerClientes(),
                obtenerProductos()
            ])
            if (resCli.success) setClientes(resCli.clientes)
            if (resProd.success) setProductosDisponibles(resProd.productos)
        } catch (error) {
            console.error('Error al cargar datos:', error)
        }
    }

    useEffect(() => {
        const nuevosTotales = calcularTotalesCotizacion(productosCotizacion)
        setTotales(nuevosTotales)
    }, [productosCotizacion, descuento])

    useEffect(() => {
        if (busquedaProducto) {
            const filtrados = productosDisponibles.filter(p => 
                p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
                (p.codigo_barras && p.codigo_barras.includes(busquedaProducto)) ||
                (p.sku && p.sku.toLowerCase().includes(busquedaProducto.toLowerCase()))
            )
            setProductosFiltrados(filtrados.slice(0, 10))
        } else {
            setProductosFiltrados([])
        }
    }, [busquedaProducto, productosDisponibles])

    const agregarProducto = (e) => {
        const pid = e.target.value
        if (!pid) return

        const prod = productosDisponibles.find(p => p.id == pid)
        if (!prod) return

        if (productosCotizacion.some(p => p.producto_id == pid)) {
            setErrores({ productos: 'El producto ya está en la lista' })
            setTimeout(() => setErrores(prev => ({ ...prev, productos: undefined })), 3000)
            return
        }

        const nuevoItem = {
            producto_id: prod.id,
            nombre_producto: prod.nombre,
            descripcion_producto: prod.descripcion || '',
            cantidad: 1,
            precio_unitario: prod.precio_venta,
            aplica_itbis: prod.aplica_itbis !== false
        }

        setProductosCotizacion([...productosCotizacion, nuevoItem])
        e.target.value = ''
    }

    const actualizarCantidad = (index, valor) => {
        const nuevos = [...productosCotizacion]
        nuevos[index].cantidad = parseFloat(valor) || 0
        setProductosCotizacion(nuevos)
    }

    const eliminarProducto = (index) => {
        setProductosCotizacion(productosCotizacion.filter((_, i) => i !== index))
    }

    const validarFormulario = () => {
        const nuevosErrores = {}
        
        if (!clienteId) {
            nuevosErrores.cliente = 'Seleccione un cliente'
        }
        if (productosCotizacion.length === 0) {
            nuevosErrores.productos = 'Agregue al menos un producto'
        }
        if (new Date(fechaVencimiento) < new Date(fechaEmision)) {
            nuevosErrores.fechaVencimiento = 'La fecha de vencimiento debe ser posterior a la fecha de emisión'
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const manejarGuardar = async (e) => {
        e.preventDefault()
        
        if (!validarFormulario()) {
            return
        }

        setCargando(true)
        try {
            const res = await crearCotizacion({
                cliente_id: clienteId,
                productos: productosCotizacion,
                fecha_emision: fechaEmision,
                fecha_vencimiento: fechaVencimiento,
                descuento: descuento,
                observaciones: observaciones
            })

            if (res.success) {
                router.push(`/admin/cotizaciones/${res.id}`)
            } else {
                const nuevosErrores = { general: res.mensaje || 'Error al crear la cotización' }
                if (res.productosSinStock && res.productosSinStock.length > 0) {
                    nuevosErrores.stock = `Productos sin stock: ${res.productosSinStock.map(p => p.nombre).join(', ')}`
                }
                setErrores(nuevosErrores)
            }
        } catch (error) {
            setErrores({ general: 'Error al guardar la cotización' })
        } finally {
            setCargando(false)
        }
    }

    const agregarProductoDesdeBusqueda = (producto) => {
        if (productosCotizacion.some(p => p.producto_id == producto.id)) {
            setErrores({ productos: 'El producto ya está en la lista' })
            setTimeout(() => setErrores(prev => ({ ...prev, productos: undefined })), 3000)
            return
        }

        const nuevoItem = {
            producto_id: producto.id,
            nombre_producto: producto.nombre,
            descripcion_producto: producto.descripcion || '',
            cantidad: 1,
            precio_unitario: producto.precio_venta,
            aplica_itbis: producto.aplica_itbis !== false
        }

        setProductosCotizacion([...productosCotizacion, nuevoItem])
        setBusquedaProducto('')
        setProductosFiltrados([])
    }

    const actualizarPrecio = (index, nuevoPrecio) => {
        const nuevos = [...productosCotizacion]
        nuevos[index].precio_unitario = parseFloat(nuevoPrecio) || 0
        setProductosCotizacion(nuevos)
    }

    return (
        <form onSubmit={manejarGuardar} className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div>
                    <Link href="/admin/cotizaciones" className={estilos.linkVolver}>
                        <ArrowLeft className={estilos.iconoLink} />
                        Volver a Cotizaciones
                    </Link>
                    <h1 className={estilos.titulo}>Nueva Cotización</h1>
                </div>
                <div className={`${estilos.acciones} ${estilos.accionesHeader}`}>
                    <button type="submit" disabled={cargando} className={estilos.btnPrimario}>
                        <Save className={estilos.iconoBtn} />
                        <span>{cargando ? 'Guardando...' : 'Guardar Cotización'}</span>
                    </button>
                </div>
            </div>

            <div className={estilos.formGrid}>
                {/* Columna Izquierda: Datos y Productos */}
                <div className={estilos.columnaIzquierda}>
                    {/* Datos del Cliente */}
                    <div className={estilos.card}>
                        <h2 className={estilos.sectionTitle}>
                            <User className={estilos.iconoSection} />
                            Información del Cliente
                        </h2>
                        <div className={estilos.inputGroup}>
                            <label className={estilos.label}>
                                Cliente <span className={estilos.required}>*</span>
                            </label>
                            <select 
                                value={clienteId} 
                                onChange={e => {
                                    setClienteId(e.target.value)
                                    setErrores(prev => ({ ...prev, cliente: undefined }))
                                }}
                                required
                                className={`${estilos.select} ${errores.cliente ? estilos.inputError : ''}`}
                            >
                                <option value="">Seleccione un cliente...</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre} {c.numero_documento ? `- ${c.numero_documento}` : ''}
                                    </option>
                                ))}
                            </select>
                            {errores.cliente && (
                                <div className={estilos.errorMessage}>
                                    <AlertCircle className={estilos.iconoError} />
                                    {errores.cliente}
                                </div>
                            )}
                        </div>
                        <div className={`${estilos.filtrosGrid} ${estilos.filtrosGridMargin}`}>
                            <div className={estilos.inputGroup}>
                                <label className={estilos.label}>Fecha Emisión</label>
                                <input 
                                    type="date" 
                                    value={fechaEmision} 
                                    onChange={e => setFechaEmision(e.target.value)} 
                                    required 
                                    className={estilos.input}
                                />
                            </div>
                            <div className={estilos.inputGroup}>
                                <label className={estilos.label}>Fecha Vencimiento</label>
                                <input 
                                    type="date" 
                                    value={fechaVencimiento} 
                                    onChange={e => {
                                        setFechaVencimiento(e.target.value)
                                        setErrores(prev => ({ ...prev, fechaVencimiento: undefined }))
                                    }}
                                    min={fechaEmision}
                                    required 
                                    className={`${estilos.input} ${errores.fechaVencimiento ? estilos.inputError : ''}`}
                                />
                                {errores.fechaVencimiento && (
                                    <div className={estilos.errorMessage}>
                                        <AlertCircle className={estilos.iconoError} />
                                        {errores.fechaVencimiento}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Productos */}
                    <div className={estilos.card}>
                        <h2 className={estilos.sectionTitle}>
                            <Package className={estilos.iconoSection} />
                            Productos
                        </h2>
                        
                        <div className={`${estilos.inputGroup} ${estilos.busquedaProducto}`}>
                            <label className={estilos.label}>Agregar Producto</label>
                            <div className={estilos.searchContainer}>
                                <Search className={estilos.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, código de barras o SKU..."
                                    value={busquedaProducto}
                                    onChange={(e) => setBusquedaProducto(e.target.value)}
                                    className={estilos.searchInput}
                                    onFocus={() => setProductosFiltrados(productosDisponibles.slice(0, 10))}
                                />
                                {busquedaProducto && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBusquedaProducto('')
                                            setProductosFiltrados([])
                                        }}
                                        className={estilos.btnLimpiarBusqueda}
                                    >
                                        <X className={estilos.iconoLimpiar} />
                                    </button>
                                )}
                            </div>
                            {productosFiltrados.length > 0 && (
                                <div className={estilos.dropdownProductos}>
                                    {productosFiltrados.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => agregarProductoDesdeBusqueda(p)}
                                            className={estilos.itemDropdown}
                                        >
                                            <div>
                                                <div className={estilos.nombreProducto}>{p.nombre}</div>
                                                <div className={estilos.infoProducto}>
                                                    {p.codigo_barras && `Cód: ${p.codigo_barras}`}
                                                    {p.stock !== undefined && ` • Stock: ${p.stock}`}
                                                </div>
                                            </div>
                                            <div className={estilos.precioProducto}>
                                                {formatearMoneda(p.precio_venta)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {errores.productos && (
                                <div className={estilos.errorMessage}>
                                    <AlertCircle className={estilos.iconoError} />
                                    {errores.productos}
                                </div>
                            )}
                        </div>

                        {/* Tabla para desktop */}
                        <div className={estilos.tablaContenedor}>
                            <table className={estilos.tabla}>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th width="100">Cant.</th>
                                        <th style={{ textAlign: 'right' }}>Precio</th>
                                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                                        <th width="50"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productosCotizacion.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className={estilos.tdEmpty}>
                                                No hay productos agregados
                                            </td>
                                        </tr>
                                    ) : (
                                        productosCotizacion.map((p, i) => {
                                            const subtotal = (p.cantidad || 0) * (p.precio_unitario || 0)
                                            return (
                                                <tr key={i}>
                                                    <td>
                                                        <div className={estilos.nombreProductoTabla}>{p.nombre_producto}</div>
                                                        {p.descripcion_producto && (
                                                            <div className={estilos.descripcionProductoTabla}>
                                                                {p.descripcion_producto}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={p.cantidad}
                                                            onChange={e => actualizarCantidad(i, e.target.value)}
                                                            min="0.01"
                                                            step="0.01"
                                                            className={estilos.inputCantidad}
                                                        />
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <input
                                                            type="number"
                                                            value={p.precio_unitario}
                                                            onChange={e => actualizarPrecio(i, e.target.value)}
                                                            min="0"
                                                            step="0.01"
                                                            className={estilos.inputPrecio}
                                                        />
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                        {formatearMoneda(subtotal)}
                                                    </td>
                                                    <td>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => eliminarProducto(i)} 
                                                            className={estilos.btnEliminar}
                                                            title="Eliminar producto"
                                                        >
                                                            <Trash2 className={estilos.iconoEliminar} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Cards para móviles */}
                        <div className={estilos.productosCards}>
                            {productosCotizacion.length === 0 ? (
                                <div className={estilos.productoCardEmpty}>
                                    No hay productos agregados
                                </div>
                            ) : (
                                productosCotizacion.map((p, i) => {
                                    const subtotal = (p.cantidad || 0) * (p.precio_unitario || 0)
                                    return (
                                        <div key={i} className={estilos.productoCard}>
                                            <div className={estilos.productoCardHeader}>
                                                <div style={{ flex: 1 }}>
                                                    <div className={estilos.productoCardNombre}>{p.nombre_producto}</div>
                                                    {p.descripcion_producto && (
                                                        <div className={estilos.productoCardDescripcion}>
                                                            {p.descripcion_producto}
                                                        </div>
                                                    )}
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => eliminarProducto(i)} 
                                                    className={estilos.productoCardEliminar}
                                                    title="Eliminar producto"
                                                >
                                                    <Trash2 className={estilos.iconoEliminar} />
                                                </button>
                                            </div>
                                            <div className={estilos.productoCardBody}>
                                                <div className={estilos.productoCardField}>
                                                    <label>Cantidad</label>
                                                    <input
                                                        type="number"
                                                        value={p.cantidad}
                                                        onChange={e => actualizarCantidad(i, e.target.value)}
                                                        min="0.01"
                                                        step="0.01"
                                                        className={estilos.productoCardInput}
                                                    />
                                                </div>
                                                <div className={estilos.productoCardField}>
                                                    <label>Precio Unitario</label>
                                                    <input
                                                        type="number"
                                                        value={p.precio_unitario}
                                                        onChange={e => actualizarPrecio(i, e.target.value)}
                                                        min="0"
                                                        step="0.01"
                                                        className={estilos.productoCardInput}
                                                    />
                                                </div>
                                            </div>
                                            <div className={estilos.productoCardSubtotal}>
                                                <span>Subtotal:</span>
                                                <span>{formatearMoneda(subtotal)}</span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className={estilos.card}>
                        <div className={estilos.inputGroup}>
                            <label className={estilos.label}>Observaciones</label>
                            <textarea
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                placeholder="Notas internas o para el cliente..."
                                className={estilos.textarea}
                                rows="3"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Resumen */}
                <div>
                    <div className={`${estilos.card} ${estilos.cardSticky}`}>
                        <h2 className={estilos.sectionTitle}>Resumen</h2>
                        <div className={estilos.resumenPanel}>
                            <div className={estilos.resumenRow}>
                                <span>Subtotal</span>
                                <span>{formatearMoneda(totales.subtotal)}</span>
                            </div>
                            {descuento > 0 && (
                                <div className={estilos.resumenRow}>
                                    <span>Descuento</span>
                                    <span className={estilos.descuento}>-{formatearMoneda(descuento)}</span>
                                </div>
                            )}
                            <div className={estilos.resumenRow}>
                                <span>ITBIS (18%)</span>
                                <span>{formatearMoneda(totales.itbis)}</span>
                            </div>
                            <div className={estilos.resumenTotal}>
                                <span>Total</span>
                                <span>{formatearMoneda(totales.total - descuento)}</span>
                            </div>
                        </div>
                        
                        <div className={estilos.descuentoSection}>
                            <div className={estilos.inputGroup}>
                                <label className={estilos.label}>Descuento General</label>
                                <input
                                    type="number"
                                    value={descuento}
                                    onChange={e => setDescuento(parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    className={estilos.input}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        
                        {errores.general && (
                            <div className={estilos.alertError}>
                                <AlertCircle className={estilos.iconoAlert} />
                                <span>{errores.general}</span>
                            </div>
                        )}
                        
                        {errores.stock && (
                            <div className={estilos.alertWarning}>
                                <AlertCircle className={estilos.iconoAlert} />
                                <span>{errores.stock}</span>
                            </div>
                        )}
                        
                        <div className={estilos.btnSubmitContainer}>
                             <button type="submit" disabled={cargando} className={`${estilos.btnPrimario} ${estilos.btnFullWidth}`}>
                                <Save className={estilos.iconoBtn} />
                                <span>{cargando ? 'Guardando...' : 'Guardar Cotización'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}

