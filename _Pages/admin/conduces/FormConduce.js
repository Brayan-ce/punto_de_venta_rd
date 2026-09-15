"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { crearConduce } from './nuevo/servidor'
import { obtenerSaldoPendiente, buscarOrigenPorNumero } from './servidor'
import { ArrowLeft, Search, Package, Truck, User, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useLanguage } from '@/_Pages/admin/i18n'
import { obtenerTextoTipoOrigen } from './lib'
import estilos from './conduces.module.css'

export default function FormConduce() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(false)
    const [errores, setErrores] = useState({})

    // Búsqueda de origen
    const [tipoOrigen, setTipoOrigen] = useState('venta')
    const [numeroOrigen, setNumeroOrigen] = useState('')
    const [origenSeleccionado, setOrigenSeleccionado] = useState(null)
    const [saldos, setSaldos] = useState([])

    // Datos del conduce
    const [fechaConduce, setFechaConduce] = useState(new Date().toISOString().split('T')[0])
    const [chofer, setChofer] = useState('')
    const [vehiculo, setVehiculo] = useState('')
    const [placa, setPlaca] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [itemsADespachar, setItemsADespachar] = useState([])

    useEffect(() => {
        setTema(localStorage.getItem('tema') || 'light')

        // Manejar parámetros de URL para auto-búsqueda
        const params = new URLSearchParams(window.location.search)
        const autoTipo = params.get('origen')
        const autoNumero = params.get('numero')

        if (autoTipo && autoNumero) {
            setTipoOrigen(autoTipo)
            setNumeroOrigen(autoNumero)
            setTimeout(() => {
                buscarOrigen()
            }, 500)
        }
    }, [])

    const buscarOrigen = async () => {
        if (!numeroOrigen.trim()) {
            setErrores({ busqueda: tr('Ingrese un numero de documento', 'Enter a document number') })
            return
        }

        setCargando(true)
        setErrores({})
        try {
            const res = await buscarOrigenPorNumero(tipoOrigen, numeroOrigen.trim())

            if (res.success && res.origen) {
                const origen = res.origen
                
                // Consultar saldos
                const resSaldo = await obtenerSaldoPendiente(tipoOrigen, origen.id)

                if (resSaldo.success && resSaldo.saldos && resSaldo.saldos.length > 0) {
                    const saldosConPendiente = resSaldo.saldos.filter(s => parseFloat(s.cantidad_pendiente) > 0)
                    
                    if (saldosConPendiente.length === 0) {
                        setErrores({ 
                            busqueda: tr('Esta venta/cotizacion ya fue totalmente despachada', 'This sale/quote has already been fully dispatched')
                        })
                        return
                    }

                    setSaldos(saldosConPendiente)
                    setOrigenSeleccionado({
                        id: origen.id,
                        numero: origen.numero,
                        cliente_id: origen.cliente_id,
                        cliente_nombre: origen.cliente_nombre
                    })
                    setItemsADespachar(saldosConPendiente.map(item => ({
                        producto_id: item.producto_id,
                        nombre_producto: item.nombre_producto,
                        unidad_medida: item.unidad_medida || '',
                        cantidad_total: parseFloat(item.cantidad_total),
                        cantidad_despachada: parseFloat(item.cantidad_despachada || 0),
                        cantidad_pendiente: parseFloat(item.cantidad_pendiente),
                        cantidad_a_despachar: 0
                    })))
                } else {
                    setErrores({ 
                        busqueda: tr('No hay productos pendientes de despacho para este documento', 'There are no pending items for dispatch in this document')
                    })
                }
            } else {
                setErrores({ busqueda: res.mensaje || tr('No se encontro el documento especificado', 'The specified document was not found') })
            }
        } catch (error) {
            console.error(error)
            setErrores({ busqueda: tr('Error al buscar el documento', 'Error searching the document') })
        } finally {
            setCargando(false)
        }
    }

    const actualizarCantidadDespacho = (idx, valor) => {
        const nuevos = [...itemsADespachar]
        const cant = parseFloat(valor) || 0
        const pendiente = nuevos[idx].cantidad_pendiente

        if (cant < 0) {
            setErrores(prev => ({
                ...prev,
                [`cantidad_${idx}`]: tr('La cantidad debe ser mayor o igual a cero', 'Quantity must be greater than or equal to zero')
            }))
            return
        }

        if (cant > pendiente) {
            setErrores(prev => ({
                ...prev,
                [`cantidad_${idx}`]: tr(`No puede despachar mas de ${pendiente} ${nuevos[idx].unidad_medida || ''}`, `You cannot dispatch more than ${pendiente} ${nuevos[idx].unidad_medida || ''}`)
            }))
            return
        }

        nuevos[idx].cantidad_a_despachar = cant
        setItemsADespachar(nuevos)
        setErrores(prev => {
            const nuevosErrores = { ...prev }
            delete nuevosErrores[`cantidad_${idx}`]
            return nuevosErrores
        })
    }

    const validarFormulario = () => {
        const nuevosErrores = {}
        const itemsValidos = itemsADespachar.filter(i => i.cantidad_a_despachar > 0)

        if (itemsValidos.length === 0) {
            nuevosErrores.productos = tr('Seleccione al menos un producto para despachar', 'Select at least one product to dispatch')
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const manejarGuardar = async (e) => {
        e.preventDefault()
        
        if (!validarFormulario()) {
            return
        }

        const itemsValidos = itemsADespachar
            .filter(i => i.cantidad_a_despachar > 0)
            .map(i => ({
                producto_id: i.producto_id,
                nombre_producto: i.nombre_producto,
                cantidad_a_despachar: i.cantidad_a_despachar
            }))

        setCargando(true)
        setErrores({})
        try {
            const res = await crearConduce({
                tipo_origen: tipoOrigen,
                origen_id: origenSeleccionado.id,
                numero_origen: origenSeleccionado.numero,
                cliente_id: origenSeleccionado.cliente_id,
                fecha_conduce: fechaConduce,
                chofer: chofer.trim() || null,
                vehiculo: vehiculo.trim() || null,
                placa: placa.trim() || null,
                observaciones: observaciones.trim() || null,
                productos: itemsValidos
            })

            if (res.success) {
                router.push(`/admin/conduces/${res.id}/imprimir`)
            } else {
                setErrores({ general: res.mensaje || tr('Error al crear el conduce', 'Error creating delivery note') })
            }
        } catch (error) {
            console.error(error)
            setErrores({ general: tr('Error al guardar el conduce', 'Error saving delivery note') })
        } finally {
            setCargando(false)
        }
    }

    return (
        <form onSubmit={manejarGuardar} className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div style={{ width: '100%' }}>
                    <Link 
                        href="/admin/conduces" 
                        style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            marginBottom: '0.75rem',
                            fontWeight: 500
                        }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {tr('Volver a Conduces', 'Back to Delivery Notes')}
                    </Link>
                    <h1 className={estilos.titulo}>{tr('Nuevo Conduce', 'New Delivery Note')}</h1>
                    <p className={estilos.subtitulo}>{tr('Despacho de mercancia para clientes', 'Merchandise dispatch for customers')}</p>
                </div>
                {origenSeleccionado && (
                    <button type="submit" disabled={cargando} className={estilos.btnPrimario}>
                        <CheckCircle className="w-5 h-5" />
                        <span>{cargando ? tr('Generando...', 'Generating...') : tr('Crear Conduce', 'Create Delivery Note')}</span>
                    </button>
                )}
            </div>

            {!origenSeleccionado ? (
                <div className={estilos.card} style={{ 
                    textAlign: 'center', 
                    padding: '3rem 2rem',
                    maxWidth: '600px',
                    margin: '2rem auto'
                }}>
                    <Search className="w-16 h-16" style={{ 
                        margin: '0 auto 1.5rem', 
                        color: '#2563eb' 
                    }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        {tr('Buscar Venta o Cotizacion', 'Search Sale or Quote')}
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                        {tr('Ingrese el numero del documento para cargar los productos pendientes de despacho', 'Enter the document number to load pending products for dispatch')}
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <select 
                                value={tipoOrigen} 
                                onChange={e => {
                                    setTipoOrigen(e.target.value)
                                    setErrores({})
                                }}
                                className={estilos.select}
                                style={{ minWidth: '150px' }}
                            >
                                <option value="venta">{tr('Venta / Factura', 'Sale / Invoice')}</option>
                                <option value="cotizacion">{tr('Cotizacion', 'Quote')}</option>
                            </select>
                            <input
                                type="text"
                                placeholder={tr('Ej: V-2026-0001 o COT-000001', 'Ex: V-2026-0001 or COT-000001')}
                                value={numeroOrigen}
                                onChange={e => {
                                    setNumeroOrigen(e.target.value)
                                    setErrores({})
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        buscarOrigen()
                                    }
                                }}
                                className={estilos.input}
                                style={{ flex: 1, minWidth: '200px' }}
                            />
                            <button 
                                type="button" 
                                onClick={buscarOrigen} 
                                disabled={cargando || !numeroOrigen.trim()} 
                                className={estilos.btnPrimario}
                            >
                                {cargando ? tr('Buscando...', 'Searching...') : tr('Buscar', 'Search')}
                            </button>
                        </div>
                        
                        {errores.busqueda && (
                            <div style={{
                                padding: '0.75rem',
                                background: '#fee2e2',
                                border: '1px solid #fca5a5',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#991b1b',
                                fontSize: '0.875rem'
                            }}>
                                <AlertCircle className="w-5 h-5" />
                                <span>{errores.busqueda}</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className={estilos.formGrid}>
                    {/* Columna Izquierda */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Información del Origen */}
                        <div className={estilos.card}>
                            <h3 className={estilos.sectionTitle}>
                                <Package className="w-5 h-5" style={{ color: '#2563eb' }} />
                                {tr('Informacion del Origen', 'Source Information')}
                            </h3>
                            <div className={estilos.filtrosGrid}>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>{tr('Documento', 'Document')}</label>
                                    <div style={{ 
                                        padding: '0.625rem 1rem',
                                        background: '#f9fafb',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        textTransform: 'uppercase',
                                        fontWeight: 600
                                    }}>
                                        {obtenerTextoTipoOrigen(tipoOrigen, language)} #{origenSeleccionado.numero}
                                    </div>
                                </div>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>{tr('Cliente', 'Customer')}</label>
                                    <div style={{ 
                                        padding: '0.625rem 1rem',
                                        background: '#f9fafb',
                                        borderRadius: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <User className="w-4 h-4" style={{ color: '#6b7280' }} />
                                        <span>{origenSeleccionado.cliente_nombre}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setOrigenSeleccionado(null)
                                    setSaldos([])
                                    setItemsADespachar([])
                                    setErrores({})
                                }} 
                                className={estilos.btnSecundario}
                                style={{ marginTop: '1rem' }}
                            >
                                <X className="w-4 h-4" />
                                {tr('Cambiar origen', 'Change source')}
                            </button>
                        </div>

                        {/* Datos Logísticos */}
                        <div className={estilos.card}>
                            <h3 className={estilos.sectionTitle}>
                                <Truck className="w-5 h-5" style={{ color: '#2563eb' }} />
                                {tr('Datos de Transporte', 'Transport Information')}
                            </h3>
                            <div className={estilos.filtrosGrid}>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>
                                        <Calendar className="w-4 h-4" style={{ display: 'inline', marginRight: '0.25rem' }} />
                                        {tr('Fecha del Conduce', 'Delivery Note Date')}
                                    </label>
                                    <input 
                                        type="date" 
                                        value={fechaConduce} 
                                        onChange={e => setFechaConduce(e.target.value)} 
                                        required 
                                        className={estilos.input}
                                    />
                                </div>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>{tr('Chofer (opcional)', 'Driver (optional)')}</label>
                                    <input 
                                        type="text" 
                                        value={chofer} 
                                        onChange={e => setChofer(e.target.value)} 
                                        placeholder={tr('Nombre del chofer', 'Driver name')}
                                        className={estilos.input}
                                    />
                                </div>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>{tr('Vehiculo (opcional)', 'Vehicle (optional)')}</label>
                                    <input 
                                        type="text" 
                                        value={vehiculo} 
                                        onChange={e => setVehiculo(e.target.value)} 
                                        placeholder={tr('Ej: Camion Daihatsu', 'Ex: Daihatsu truck')}
                                        className={estilos.input}
                                    />
                                </div>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>{tr('Placa (opcional)', 'Plate (optional)')}</label>
                                    <input 
                                        type="text" 
                                        value={placa} 
                                        onChange={e => setPlaca(e.target.value)} 
                                        placeholder="L-123456"
                                        className={estilos.input}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Observaciones */}
                        <div className={estilos.card}>
                            <div className={estilos.inputGroup}>
                                <label className={estilos.label}>{tr('Observaciones', 'Notes')}</label>
                                <textarea
                                    value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                    placeholder={tr('Notas de entrega, condiciones o instrucciones especiales...', 'Delivery notes, conditions or special instructions...')}
                                    rows="4"
                                    className={estilos.textarea}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Productos */}
                    <div>
                        <div className={estilos.card}>
                            <h3 className={estilos.sectionTitle}>
                                <Package className="w-5 h-5" style={{ color: '#2563eb' }} />
                                {tr('Productos a Despachar', 'Products to Dispatch')}
                            </h3>
                            
                            {errores.productos && (
                                <div style={{
                                    marginBottom: '1rem',
                                    padding: '0.75rem',
                                    background: '#fee2e2',
                                    border: '1px solid #fca5a5',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: '#991b1b',
                                    fontSize: '0.875rem'
                                }}>
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{errores.productos}</span>
                                </div>
                            )}

                            <div className={estilos.tablaContenedor}>
                                <table className={estilos.tabla}>
                                    <thead>
                                        <tr>
                                            <th>{tr('Producto', 'Product')}</th>
                                            <th style={{ textAlign: 'center' }}>{tr('Pendiente', 'Pending')}</th>
                                            <th style={{ textAlign: 'right' }}>{tr('A Despachar', 'To Dispatch')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsADespachar.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{item.nombre_producto}</div>
                                                    {item.unidad_medida && (
                                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                            {tr('Unidad', 'Unit')}: {item.unidad_medida}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '0.25rem 0.75rem',
                                                        background: '#fef3c7',
                                                        color: '#92400e',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600
                                                    }}>
                                                        {item.cantidad_pendiente} {item.unidad_medida || ''}
                                                    </span>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={item.cantidad_a_despachar || ''}
                                                        onChange={e => actualizarCantidadDespacho(idx, e.target.value)}
                                                        min="0"
                                                        max={item.cantidad_pendiente}
                                                        step="0.01"
                                                        className={estilos.input}
                                                        style={{ 
                                                            width: '120px',
                                                            textAlign: 'right',
                                                            borderColor: errores[`cantidad_${idx}`] ? '#dc2626' : undefined
                                                        }}
                                                        placeholder="0.00"
                                                    />
                                                    {errores[`cantidad_${idx}`] && (
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            color: '#dc2626',
                                                            marginTop: '0.25rem'
                                                        }}>
                                                            {errores[`cantidad_${idx}`]}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {errores.general && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    background: '#fee2e2',
                                    border: '1px solid #fca5a5',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: '#991b1b',
                                    fontSize: '0.875rem'
                                }}>
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{errores.general}</span>
                                </div>
                            )}

                            <div style={{ marginTop: '1.5rem' }}>
                                <button 
                                    type="submit" 
                                    disabled={cargando} 
                                    className={estilos.btnPrimario}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    <span>{cargando ? tr('Creando Conduce...', 'Creating Delivery Note...') : tr('Crear Conduce', 'Create Delivery Note')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}

