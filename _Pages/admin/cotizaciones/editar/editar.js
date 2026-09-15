"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerClientes } from '@/_Pages/admin/clientes/servidor'
import { obtenerProductos } from '@/_Pages/admin/productos/servidor'
import { calcularTotalesCotizacion } from '@/utils/cotizacionUtils'
import { Save, User, Package, Trash2, ArrowLeft, Search, AlertCircle, X } from 'lucide-react'
import { formatearMoneda } from '@/utils/cotizacionUtils'
import estilos from './editar.module.css'
import Link from 'next/link'
import { obtenerCotizacionEditar, actualizarCotizacion } from './servidor'
import { obtenerDatosEmpresa } from '../servidor'
import { useLanguage } from '@/_Pages/admin/i18n'

export default function EditarCotizacion({ id: propId }) {
    const router = useRouter()
    const params = useParams()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    // Obtener ID desde props o params
    const cotizacionId = propId || params?.id

    // Datos de la cotización
    const [clienteId, setClienteId] = useState('')
    const [productosCotizacion, setProductosCotizacion] = useState([])
    const [fechaEmision, setFechaEmision] = useState('')
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
    const [empresa, setEmpresa] = useState(null)

    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'
    const fmt = (v) => formatearMoneda(v, { currency: monedaEmpresa, locale: localeEmpresa })

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            setTema(localStorage.getItem('tema') || 'light')
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)
        cargarEmpresa()

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    useEffect(() => {
        if (cotizacionId) {
            cargarDatos()
        }
    }, [cotizacionId])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resCli, resProd, resCot] = await Promise.all([
                obtenerClientes(),
                obtenerProductos(),
                obtenerCotizacionEditar(cotizacionId)
            ])
            
            if (resCli.success) setClientes(resCli.clientes)
            if (resProd.success) setProductosDisponibles(resProd.productos)
            
            if (resCot.success) {
                const cot = resCot.cotizacion
                const det = resCot.detalle
                
                setClienteId(cot.cliente_id || '')
                setFechaEmision(cot.fecha_emision ? new Date(cot.fecha_emision).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
                setFechaVencimiento(cot.fecha_vencimiento ? new Date(cot.fecha_vencimiento).toISOString().split('T')[0] : '')
                setDescuento(parseFloat(cot.descuento) || 0)
                setObservaciones(cot.observaciones || '')
                
                // Convertir detalle a formato de productos
                const productosFormateados = det.map(item => ({
                    producto_id: item.producto_id,
                    nombre_producto: item.nombre_producto,
                    descripcion_producto: item.descripcion_producto || '',
                    cantidad: parseFloat(item.cantidad) || 1,
                    precio_unitario: parseFloat(item.precio_unitario) || 0,
                    aplica_itbis: item.aplica_itbis !== 0
                }))
                
                setProductosCotizacion(productosFormateados)
            } else {
                alert(resCot.mensaje || tr('Error al cargar la cotizacion', 'Error loading quote'))
                router.push('/admin/cotizaciones')
            }
        } catch (error) {
            console.error('Error loading data:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
            router.push('/admin/cotizaciones')
        } finally {
            setCargando(false)
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

    const agregarProductoDesdeBusqueda = (producto) => {
        if (productosCotizacion.some(p => p.producto_id === producto.id)) {
            setErrores({ productos: tr('El producto ya esta en la lista', 'The product is already in the list') })
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

    const actualizarCantidad = (index, valor) => {
        const nuevos = [...productosCotizacion]
        nuevos[index].cantidad = parseFloat(valor) || 0
        setProductosCotizacion(nuevos)
    }

    const actualizarPrecio = (index, nuevoPrecio) => {
        const nuevos = [...productosCotizacion]
        nuevos[index].precio_unitario = parseFloat(nuevoPrecio) || 0
        setProductosCotizacion(nuevos)
    }

    const eliminarProducto = (index) => {
        setProductosCotizacion(productosCotizacion.filter((_, i) => i !== index))
    }

    const validarFormulario = () => {
        const nuevosErrores = {}
        
        if (!clienteId) {
            nuevosErrores.cliente = tr('Seleccione un cliente', 'Select a customer')
        }
        if (productosCotizacion.length === 0) {
            nuevosErrores.productos = tr('Agregue al menos un producto', 'Add at least one product')
        }
        if (new Date(fechaVencimiento) < new Date(fechaEmision)) {
            nuevosErrores.fechaVencimiento = tr('La fecha de vencimiento debe ser posterior a la fecha de emision', 'Due date must be after issue date')
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const manejarGuardar = async (e) => {
        e.preventDefault()
        
        if (!validarFormulario()) {
            return
        }

        setProcesando(true)
        try {
            const res = await actualizarCotizacion(cotizacionId, {
                cliente_id: clienteId,
                productos: productosCotizacion,
                fecha_emision: fechaEmision,
                fecha_vencimiento: fechaVencimiento,
                descuento: descuento,
                observaciones: observaciones
            })

            if (res.success) {
                alert(tr('Cotizacion actualizada exitosamente', 'Quote updated successfully'))
                router.push(`/admin/cotizaciones/${cotizacionId}`)
            } else {
                setErrores({ general: res.mensaje || tr('Error al actualizar la cotizacion', 'Error updating quote') })
            }
        } catch (error) {
            setErrores({ general: tr('Error al guardar la cotizacion', 'Error saving quote') })
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <p>{tr('Cargando cotizacion...', 'Loading quote...')}</p>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={manejarGuardar} className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div>
                    <Link href={`/admin/cotizaciones/${cotizacionId}`} className={estilos.linkVolver}>
                        <ArrowLeft className={estilos.iconoLink} />
                        {tr('Volver a Cotizacion', 'Back to Quote')}
                    </Link>
                    <h1 className={estilos.titulo}>{tr('Editar Cotizacion', 'Edit Quote')}</h1>
                </div>
                <div className={estilos.acciones}>
                    <div className={estilos.accionesHeader}>
                        <button type="submit" disabled={procesando} className={estilos.btnPrimario}>
                            <Save className={estilos.iconoBtn} />
                            <span>{procesando ? tr('Guardando...', 'Saving...') : tr('Guardar Cambios', 'Save Changes')}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={estilos.formGrid}>
                {/* Columna Izquierda: Datos y Productos */}
                <div className={estilos.columnaIzquierda}>
                    {/* Datos del Cliente */}
                    <div className={estilos.card}>
                        <h2 className={estilos.sectionTitle}>
                            <User className={estilos.iconoSection} />
                            {tr('Informacion del Cliente', 'Customer Information')}
                        </h2>
                        <div className={estilos.inputGroup}>
                            <label className={estilos.label}>
                                {tr('Cliente', 'Customer')} <span className={estilos.required}>*</span>
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
                                <option value="">{tr('Seleccione un cliente...', 'Select a customer...')}</option>
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
                                <label className={estilos.label}>{tr('Fecha Emision', 'Issue Date')}</label>
                                <input 
                                    type="date" 
                                    value={fechaEmision} 
                                    onChange={e => setFechaEmision(e.target.value)} 
                                    required 
                                    className={estilos.input}
                                />
                            </div>
                            <div className={estilos.inputGroup}>
                                <label className={estilos.label}>{tr('Fecha Vencimiento', 'Due Date')}</label>
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
                            {tr('Productos', 'Products')}
                        </h2>
                        
                        <div className={`${estilos.inputGroup} ${estilos.busquedaProducto}`}>
                            <label className={estilos.label}>{tr('Agregar Producto', 'Add Product')}</label>
                            <div className={estilos.searchContainer}>
                                <Search className={estilos.searchIcon} />
                                <input
                                    type="text"
                                    placeholder={tr('Buscar por nombre, codigo de barras o SKU...', 'Search by name, barcode or SKU...')}
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
                                                    {p.codigo_barras && tr(`Cod: ${p.codigo_barras}`, `Code: ${p.codigo_barras}`)}
                                                    {p.stock !== undefined && tr(` • Stock: ${p.stock}`, ` • Stock: ${p.stock}`)}
                                                </div>
                                            </div>
                                            <div className={estilos.precioProducto}>
                                                {fmt(p.precio_venta)}
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

                        <div className={estilos.tablaContenedor}>
                            <table className={estilos.tabla}>
                                <thead>
                                    <tr>
                                        <th>{tr('Producto', 'Product')}</th>
                                        <th width="100">{tr('Cant.', 'Qty.')}</th>
                                        <th style={{ textAlign: 'right' }}>{tr('Precio', 'Price')}</th>
                                        <th style={{ textAlign: 'right' }}>{tr('Subtotal', 'Subtotal')}</th>
                                        <th width="50"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productosCotizacion.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className={estilos.tdEmpty}>
                                                {tr('No hay productos agregados', 'No products added')}
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
                                                        {fmt(subtotal)}
                                                    </td>
                                                    <td>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => eliminarProducto(i)} 
                                                            className={estilos.btnEliminar}
                                                            title={tr('Eliminar producto', 'Delete product')}
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
                                    {tr('No hay productos agregados', 'No products added')}
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
                                                    title={tr('Eliminar producto', 'Delete product')}
                                                >
                                                    <Trash2 className={estilos.iconoEliminar} />
                                                </button>
                                            </div>
                                            <div className={estilos.productoCardBody}>
                                                <div className={estilos.productoCardField}>
                                                    <label>{tr('Cantidad', 'Quantity')}</label>
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
                                                    <label>{tr('Precio Unitario', 'Unit Price')}</label>
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
                                                <span>{tr('Subtotal:', 'Subtotal:')}</span>
                                                <span>{fmt(subtotal)}</span>
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
                            <label className={estilos.label}>{tr('Observaciones', 'Notes')}</label>
                            <textarea
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                placeholder={tr('Notas internas o para el cliente...', 'Internal notes or customer notes...')}
                                className={estilos.textarea}
                                rows="3"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Resumen */}
                <div>
                    <div className={`${estilos.card} ${estilos.cardSticky}`}>
                        <h2 className={estilos.sectionTitle}>{tr('Resumen', 'Summary')}</h2>
                        <div className={estilos.resumenPanel}>
                            <div className={estilos.resumenRow}>
                                <span>{tr('Subtotal', 'Subtotal')}</span>
                                <span>{fmt(totales.subtotal)}</span>
                            </div>
                            {descuento > 0 && (
                                <div className={estilos.resumenRow}>
                                    <span>{tr('Descuento', 'Discount')}</span>
                                    <span className={estilos.descuento}>-{fmt(descuento)}</span>
                                </div>
                            )}
                            <div className={estilos.resumenRow}>
                                <span>{tr('ITBIS (18%)', 'Tax (18%)')}</span>
                                <span>{fmt(totales.itbis)}</span>
                            </div>
                            <div className={estilos.resumenTotal}>
                                <span>{tr('Total', 'Total')}</span>
                                <span>{fmt(totales.total - descuento)}</span>
                            </div>
                        </div>
                        
                        <div className={estilos.descuentoSection}>
                            <div className={estilos.inputGroup}>
                                <label className={estilos.label}>{tr('Descuento General', 'General Discount')}</label>
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
                        
                        <div className={estilos.btnSubmitContainer}>
                             <button type="submit" disabled={procesando} className={`${estilos.btnPrimario} ${estilos.btnFullWidth}`}>
                                <Save className={estilos.iconoBtn} />
                                    <span>{procesando ? tr('Guardando...', 'Saving...') : tr('Guardar Cambios', 'Save Changes')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}

