"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { crearConduce } from './nuevo/servidor'
import { obtenerSaldoPendiente, buscarOrigenPorNumero } from './servidor'
import { ArrowLeft, Search, Package, Truck, User, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react'
import estilos from './conduces.module.css'

export default function FormConduce() {
    const router = useRouter()
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
            setErrores({ busqueda: 'Ingrese un número de documento' })
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
                            busqueda: 'Esta venta/cotización ya fue totalmente despachada' 
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
                        busqueda: 'No hay productos pendientes de despacho para este documento' 
                    })
                }
            } else {
                setErrores({ busqueda: res.mensaje || 'No se encontró el documento especificado' })
            }
        } catch (error) {
            console.error(error)
            setErrores({ busqueda: 'Error al buscar el documento' })
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
                [`cantidad_${idx}`]: 'La cantidad debe ser mayor o igual a cero'
            }))
            return
        }

        if (cant > pendiente) {
            setErrores(prev => ({
                ...prev,
                [`cantidad_${idx}`]: `No puede despachar más de ${pendiente} ${nuevos[idx].unidad_medida || ''}`
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
            nuevosErrores.productos = 'Seleccione al menos un producto para despachar'
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
                setErrores({ general: res.mensaje || 'Error al crear el conduce' })
            }
        } catch (error) {
            console.error(error)
            setErrores({ general: 'Error al guardar el conduce' })
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
                        Volver a Conduces
                    </Link>
                    <h1 className={estilos.titulo}>Nuevo Conduce</h1>
                    <p className={estilos.subtitulo}>Despacho de mercancía para clientes</p>
                </div>
                {origenSeleccionado && (
                    <button type="submit" disabled={cargando} className={estilos.btnPrimario}>
                        <CheckCircle className="w-5 h-5" />
                        <span>{cargando ? 'Generando...' : 'Crear Conduce'}</span>
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
                        Buscar Venta o Cotización
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                        Ingrese el número del documento para cargar los productos pendientes de despacho
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
                                <option value="venta">Venta / Factura</option>
                                <option value="cotizacion">Cotización</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Ej: V-2026-0001 o COT-000001"
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
                                {cargando ? 'Buscando...' : 'Buscar'}
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
                                Información del Origen
                            </h3>
                            <div className={estilos.filtrosGrid}>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>Documento</label>
                                    <div style={{ 
                                        padding: '0.625rem 1rem',
                                        background: '#f9fafb',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        textTransform: 'uppercase',
                                        fontWeight: 600
                                    }}>
                                        {tipoOrigen} #{origenSeleccionado.numero}
                                    </div>
                                </div>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>Cliente</label>
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
                                Cambiar origen
                            </button>
                        </div>

                        {/* Datos Logísticos */}
                        <div className={estilos.card}>
                            <h3 className={estilos.sectionTitle}>
                                <Truck className="w-5 h-5" style={{ color: '#2563eb' }} />
                                Datos de Transporte
                            </h3>
                            <div className={estilos.filtrosGrid}>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>
                                        <Calendar className="w-4 h-4" style={{ display: 'inline', marginRight: '0.25rem' }} />
                                        Fecha del Conduce
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
                                    <label className={estilos.label}>Chofer (opcional)</label>
                                    <input 
                                        type="text" 
                                        value={chofer} 
                                        onChange={e => setChofer(e.target.value)} 
                                        placeholder="Nombre del chofer"
                                        className={estilos.input}
                                    />
                                </div>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>Vehículo (opcional)</label>
                                    <input 
                                        type="text" 
                                        value={vehiculo} 
                                        onChange={e => setVehiculo(e.target.value)} 
                                        placeholder="Ej: Camión Daihatsu"
                                        className={estilos.input}
                                    />
                                </div>
                                <div className={estilos.inputGroup}>
                                    <label className={estilos.label}>Placa (opcional)</label>
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
                                <label className={estilos.label}>Observaciones</label>
                                <textarea
                                    value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                    placeholder="Notas de entrega, condiciones o instrucciones especiales..."
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
                                Productos a Despachar
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
                                            <th>Producto</th>
                                            <th style={{ textAlign: 'center' }}>Pendiente</th>
                                            <th style={{ textAlign: 'right' }}>A Despachar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsADespachar.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{item.nombre_producto}</div>
                                                    {item.unidad_medida && (
                                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                            Unidad: {item.unidad_medida}
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
                                    <span>{cargando ? 'Creando Conduce...' : 'Crear Conduce'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}

