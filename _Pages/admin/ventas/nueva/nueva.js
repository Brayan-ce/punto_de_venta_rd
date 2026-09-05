"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { obtenerDatosVenta, buscarProductos, buscarClientes, crearClienteRapido, crearVenta, obtenerCreditoCliente, obtenerFactorConversionCliente, obtenerClientePorId, obtenerPlanesFinanciamientoVenta } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './nueva.module.css'
import { formatCurrency } from '@/utils/monedaUtils'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

function formatearStock(valor) {
    const n = parseFloat(valor)
    if (isNaN(n)) return '0'
    return Number(n.toFixed(3)).toString()
}

function normalizarEntradaDecimal(valor, maxDecimales = 2) {
    if (valor === '' || valor == null) return ''
    let v = String(valor).replace(',', '.')
    v = v.replace(/[^0-9.]/g, '')
    const partes = v.split('.')
    if (partes.length > 2) v = partes[0] + '.' + partes.slice(1).join('')
    if (v.startsWith('.')) v = '0' + v
    if (v.includes('.')) {
        const [entero, dec = ''] = v.split('.')
        v = dec.length ? `${entero}.${dec.slice(0, maxDecimales)}` : `${entero}.`
    }
    return v
}

const CORRESPONDENCIA_ECF = [
    { b: 'B01', e: 'E32', es: 'Consumidor Final', en: 'Final Consumer' },
    { b: 'B02', e: 'E31', es: 'Crédito Fiscal', en: 'Fiscal Credit' },
    { b: 'B03', e: 'E33', es: 'Nota de Débito', en: 'Debit Note' },
    { b: 'B04', e: 'E34', es: 'Nota de Crédito', en: 'Credit Note' },
    { b: 'B14', e: 'E44', es: 'Regímenes Especiales', en: 'Special Regimes' },
    { b: 'B15', e: 'E45', es: 'Gubernamental', en: 'Government' },
    { b: 'B16', e: 'E46', es: 'Exportaciones', en: 'Exports' },
]

function claveTipoComprobante(tipo) {
    return String(tipo?.codigo || tipo?.prefijo_ncf || '').trim().toUpperCase()
}

function etiquetaComprobanteECF(tipo, language = 'es') {
    const key = claveTipoComprobante(tipo)
    const item = CORRESPONDENCIA_ECF.find((x) => x.b === key)
    if (item) {
        const nombre = language === 'en' ? item.en : item.es
        return `${item.e} - ${nombre}`
    }
    return `${tipo?.codigo || ''} - ${tipo?.nombre || ''}`
}

function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debounced
}

function distribuirAdelantoPreview(numeroCuotas, cuotaMensual, adelanto) {
    const cuotas = []
    let restante = Math.max(0, parseFloat(adelanto || 0))
    let pagadas = 0

    for (let i = 1; i <= numeroCuotas; i++) {
        if (restante <= 0) {
            cuotas.push({ numero: i, estado: 'pendiente', pendiente: cuotaMensual })
            continue
        }
        if (restante >= cuotaMensual) {
            cuotas.push({ numero: i, estado: 'pagada', pendiente: 0 })
            pagadas++
            restante -= cuotaMensual
        } else {
            cuotas.push({ numero: i, estado: 'parcial', pendiente: cuotaMensual - restante, pagado: restante })
            restante = 0
        }
    }

    const primeraPendiente = cuotas.find(c => c.estado === 'pendiente' || c.estado === 'parcial')
    return { cuotas, pagadas, primeraPendiente }
}

const getMetodosPago = (tr, incluirFinanciamiento = true) => [
    { value: 'efectivo',        label: tr('Efectivo', 'Cash'),          icono: 'cash-outline' },
    { value: 'tarjeta_debito',  label: tr('Débito', 'Debit'),           icono: 'card-outline' },
    { value: 'tarjeta_credito', label: tr('T. Crédito', 'C. Card'),     icono: 'card-outline' },
    { value: 'transferencia',   label: tr('Transfer.', 'Transfer'),      icono: 'swap-horizontal-outline' },
    { value: 'cheque',          label: tr('Cheque', 'Check'),           icono: 'receipt-outline' },
    { value: 'credito',         label: tr('Crédito', 'Credit'),         icono: 'time-outline' },
    ...(incluirFinanciamiento
        ? [{ value: 'financiamiento', label: tr('Financiamiento', 'Financing'), icono: 'wallet-outline' }]
        : []),
]

function ModalPagoMixto({ total, formatearMonto, onConfirmar, onCerrar, tr, metodosPago }) {
    const metodosDisponibles = metodosPago

    const mitad = (total / 2).toFixed(2)
    const [filas, setFilas] = useState([
        { metodo_pago: 'efectivo',       monto: mitad },
        { metodo_pago: 'tarjeta_debito', monto: mitad },
    ])

    const suma = filas.reduce((acc, f) => acc + (parseFloat(f.monto) || 0), 0)
    const restante = parseFloat((total - suma).toFixed(2))
    const valido = filas.length >= 2 && filas.every(f => f.metodo_pago && parseFloat(f.monto) > 0)

    function agregar() {
        setFilas(prev => [...prev, { metodo_pago: 'efectivo', monto: restante > 0 ? restante.toFixed(2) : '' }])
    }

    function eliminar(i) {
        if (filas.length <= 2) return
        setFilas(prev => prev.filter((_, idx) => idx !== i))
    }

    function actualizar(i, campo, valor) {
        setFilas(prev => prev.map((f, idx) => idx === i ? { ...f, [campo]: valor } : f))
    }

    function asignarRestante(i) {
        if (restante <= 0) return
        const nuevo = ((parseFloat(filas[i].monto) || 0) + restante).toFixed(2)
        actualizar(i, 'monto', nuevo)
    }

    function confirmar() {
        if (!valido) return
        onConfirmar(filas.map(f => ({ metodo_pago: f.metodo_pago, monto: parseFloat(f.monto) })))
    }

    return (
        <div className={estilos.modalOverlay} onClick={e => e.target === e.currentTarget && onCerrar()}>
            <div className={estilos.modal} style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                <div className={estilos.modalHeader}>
                    <h2>{tr('Pago Mixto', 'Mixed Payment')}</h2>
                    <button className={estilos.btnCerrarModal} onClick={onCerrar} type="button">
                        <ion-icon name="close-outline" />
                    </button>
                </div>

                <div className={estilos.modalBody}>
                    <div className={estilos.pagoMixtoResumen}>
                        <div className={estilos.pagoMixtoTotal}>
                            <span>{tr('Total a cobrar', 'Total to collect')}</span>
                            <strong>{formatearMonto(total)}</strong>
                        </div>
                        <div className={`${estilos.pagoMixtoRestante} ${restante > 0 ? estilos.pagoMixtoFalta : estilos.pagoMixtoOk}`}>
                            <span>{restante > 0 ? tr('Falta', 'Missing') : restante === 0 ? tr('Cuadrado', 'Balanced') : tr('Vuelto', 'Change')}</span>
                            <strong>{formatearMonto(Math.abs(restante))}</strong>
                        </div>
                    </div>

                    <div className={estilos.pagoMixtoFilas}>
                        {filas.map((fila, i) => (
                            <div key={i} className={estilos.pagoMixtoFila}>
                                <select
                                    className={estilos.pagoMixtoSelect}
                                    value={fila.metodo_pago}
                                    onChange={e => actualizar(i, 'metodo_pago', e.target.value)}
                                >
                                    {metodosDisponibles.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>

                                <div className={estilos.pagoMixtoInputWrap}>
                                    <span className={estilos.pagoMixtoSimbolo}>RD$</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        value={fila.monto}
                                        onChange={e => actualizar(i, 'monto', normalizarEntradaDecimal(e.target.value))}
                                        className={estilos.pagoMixtoInput}
                                    />
                                </div>

                                {restante > 0 && (
                                    <button
                                        type="button"
                                        className={estilos.pagoMixtoDistribuir}
                                        onClick={() => asignarRestante(i)}
                                        title={tr('Asignar restante aquí', 'Assign remaining here')}
                                    >
                                        <ion-icon name="arrow-down-circle-outline" />
                                    </button>
                                )}

                                {filas.length > 2 && (
                                    <button
                                        type="button"
                                        className={estilos.pagoMixtoEliminar}
                                        onClick={() => eliminar(i)}
                                    >
                                        <ion-icon name="trash-outline" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button type="button" className={estilos.pagoMixtoAgregar} onClick={agregar}>
                        <ion-icon name="add-circle-outline" />
                        {tr('Agregar método de pago', 'Add payment method')}
                    </button>
                </div>

                <div className={estilos.modalFooter}>
                    <button type="button" className={estilos.btnCancelarModal} onClick={onCerrar}>{tr('Cancelar', 'Cancel')}</button>
                    <button
                        type="button"
                        className={estilos.btnGuardarModal}
                        onClick={confirmar}
                        disabled={!valido}
                    >
                        <ion-icon name="checkmark-circle-outline" />
                        {tr('Confirmar Pago Mixto', 'Confirm Mixed Payment')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function NuevaVenta({ returnPath = '/admin/ventas', rapidaPath = '/admin/ventas/rapida' }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [datosEmpresa, setDatosEmpresa] = useState(null)
    const [tiposComprobante, setTiposComprobante] = useState([])
    const [tiposDocumento, setTiposDocumento] = useState([])
    const [unidadesMedida, setUnidadesMedida] = useState([])
    const [permisosModulos, setPermisosModulos] = useState({ pos: false, financiamiento: false, puedeUsarFinanciamientoEnVenta: false })
    const [factoresConversionCache, setFactoresConversionCache] = useState({})

    const [busquedaProducto, setBusquedaProducto] = useState('')
    const busquedaProductoDebounced = useDebounce(busquedaProducto, 300)
    const [productos, setProductos] = useState([])
    const [buscandoProductos, setBuscandoProductos] = useState(false)
    const [mostrarDropdownProductos, setMostrarDropdownProductos] = useState(false)
    const [productosVenta, setProductosVenta] = useState([])

    const [busquedaCliente, setBusquedaCliente] = useState('')
    const [inputClienteFocused, setInputClienteFocused] = useState(false)
    const busquedaClienteDebounced = useDebounce(busquedaCliente, 300)
    const [clientes, setClientes] = useState([])
    const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false)
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
    const [nombreClienteRapido, setNombreClienteRapido] = useState('')

    const [tipoComprobanteId, setTipoComprobanteId] = useState('')
    const [metodoPago, setMetodoPago] = useState('efectivo')
    const [efectivoRecibido, setEfectivoRecibido] = useState('')
    const [descuentoGlobal, setDescuentoGlobal] = useState('')

    const [mostrarModalExtra, setMostrarModalExtra] = useState(false)
    const [productosExtra, setProductosExtra] = useState([])
    const [mostrarExtras, setMostrarExtras] = useState(false)
    const [formExtra, setFormExtra] = useState({
        nombre: '', tipo: 'otro', cantidad: 1, precioUnitario: '', aplicaItbis: true, notas: ''
    })

    const [infoCredito, setInfoCredito] = useState(null)
    const [cargandoCredito, setCargandoCredito] = useState(false)
    const [clienteConCredito, setClienteConCredito] = useState(false)
    const clienteCargadoDesdeUrlRef = useRef(false)

    const [mostrarModalPagoMixto, setMostrarModalPagoMixto] = useState(false)
    const [pagosMixtos, setPagosMixtos] = useState([])

    const [planesFinanciamiento, setPlanesFinanciamiento] = useState([])
    const [cargandoPlanesFinanciamiento, setCargandoPlanesFinanciamiento] = useState(false)
    const [financiamiento, setFinanciamiento] = useState({
        plan_id: '',
        opcion_id: '',
        meses_manual: '',
        monto_adelantado: '',
        fecha_primer_pago: '',
        notas: ''
    })

    const [horaActual, setHoraActual] = useState('')
    const [filaSeleccionada, setFilaSeleccionada] = useState(null)
    const inputProductoRef = useRef(null)
    const inputClienteRef = useRef(null)
    const latestCantidadIdRef = useRef({})

    const tiposExtra = [
        { valor: 'ingrediente', nombre: tr('Ingrediente Extra', 'Extra Ingredient') },
        { valor: 'delivery',    nombre: tr('Delivery', 'Delivery') },
        { valor: 'propina',     nombre: tr('Propina', 'Tip') },
        { valor: 'otro',        nombre: tr('Otro', 'Other') }
    ]

    const puedeUsarFinanciamientoEnVenta = Boolean(permisosModulos?.puedeUsarFinanciamientoEnVenta)
    const metodosPago = getMetodosPago(tr, puedeUsarFinanciamientoEnVenta)

    const monedaEmpresa  = datosEmpresa?.moneda        || 'DOP'
    const localeEmpresa  = datosEmpresa?.locale         || 'es-DO'
    const simboloEmpresa = datosEmpresa?.simbolo_moneda || 'RD$'
    const formatearMonto = (valor) => formatCurrency(valor, {
        currency: monedaEmpresa,
        locale:   localeEmpresa,
        symbol:   simboloEmpresa
    })

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        const fn = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', fn)
        window.addEventListener('storage', fn)
        return () => { window.removeEventListener('temaChange', fn); window.removeEventListener('storage', fn) }
    }, [])

    useEffect(() => { cargarDatosIniciales() }, [])

    useEffect(() => {
        const clienteId = searchParams.get('cliente')
        if (clienteId && !clienteSeleccionado && !cargando && !clienteCargadoDesdeUrlRef.current) {
            clienteCargadoDesdeUrlRef.current = true
            const cargar = async () => {
                try {
                    const res = await obtenerClientePorId(clienteId)
                    if (res.success) {
                        setClienteSeleccionado(res.cliente)
                        setBusquedaCliente(res.cliente.nombre_completo)
                        setMostrarDropdownClientes(false)
                        const resCredito = await obtenerCreditoCliente(clienteId)
                        if (resCredito.success && resCredito.credito) {
                            setClienteConCredito(true)
                            setInfoCredito(resCredito.credito)
                            setMetodoPago('credito')
                        } else {
                            setClienteConCredito(false)
                        }
                        const nueva = new URL(window.location.href)
                        nueva.searchParams.delete('cliente')
                        window.history.replaceState({}, '', nueva.pathname + nueva.search)
                    }
                } catch (e) { console.error(e) }
            }
            cargar()
        }
    }, [searchParams, cargando, clienteSeleccionado])

    useEffect(() => {
        const fn = (e) => {
            if (!e.target.closest(`.${estilos.busquedaProductoContainer}`)) setMostrarDropdownProductos(false)
            if (!e.target.closest(`.${estilos.busquedaClienteContainer}`))  setMostrarDropdownClientes(false)
        }
        document.addEventListener('mousedown', fn)
        return () => document.removeEventListener('mousedown', fn)
    }, [])

    useEffect(() => {
        const termino = busquedaProductoDebounced.trim()
        if (termino.length < 2) {
            setProductos([])
            setBuscandoProductos(false)
            if (busquedaProducto.trim().length < 2) setMostrarDropdownProductos(false)
            return
        }

        let cancelado = false
        setBuscandoProductos(true)
        setMostrarDropdownProductos(true)

        ;(async () => {
            try {
                const res = await buscarProductos(termino)
                if (cancelado) return
                if (res.success) {
                    setProductos(res.productos || [])
                    setMostrarDropdownProductos(true)
                } else {
                    setProductos([])
                }
            } catch (e) {
                console.error(e)
                if (!cancelado) setProductos([])
            } finally {
                if (!cancelado) setBuscandoProductos(false)
            }
        })()

        return () => { cancelado = true }
    }, [busquedaProductoDebounced, busquedaProducto])

    useEffect(() => {
        if (clienteSeleccionado) {
            const verificar = async () => {
                try {
                    const res = await obtenerCreditoCliente(clienteSeleccionado.id)
                    if (res.success && res.credito) {
                        setClienteConCredito(true)
                        if (metodoPago === 'credito') setInfoCredito(res.credito)
                    } else {
                        setClienteConCredito(false)
                        if (metodoPago === 'credito') setInfoCredito(null)
                    }
                } catch (e) { console.error(e); setClienteConCredito(false); setInfoCredito(null) }
            }
            verificar()
        } else { setClienteConCredito(false); setInfoCredito(null) }
    }, [clienteSeleccionado, metodoPago])

    useEffect(() => {
        if (metodoPago === 'credito' && clienteSeleccionado && clienteConCredito) {
            cargarInfoCredito(clienteSeleccionado.id)
        } else if (metodoPago !== 'credito') {
            setInfoCredito(null)
        }
    }, [metodoPago, clienteSeleccionado, clienteConCredito])

    useEffect(() => {
        if (!puedeUsarFinanciamientoEnVenta && metodoPago === 'financiamiento') {
            setMetodoPago('efectivo')
        }
    }, [puedeUsarFinanciamientoEnVenta, metodoPago])

    useEffect(() => {
        if (metodoPago === 'mixto') return
        setPagosMixtos([])
    }, [metodoPago])

    useEffect(() => {
        const fecha = new Date()
        fecha.setDate(fecha.getDate() + 30)
        const iso = fecha.toISOString().split('T')[0]
        setFinanciamiento(prev => prev.fecha_primer_pago ? prev : { ...prev, fecha_primer_pago: iso })
    }, [])

    useEffect(() => {
        const tick = () => {
            setHoraActual(new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'es-DO', {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }))
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [language])

    const cargarDatosIniciales = async () => {
        try {
            const res = await obtenerDatosVenta()
            if (res.success) {
                setDatosEmpresa(res.empresa)
                setTiposComprobante(res.tiposComprobante)
                setTiposDocumento(res.tiposDocumento)
                setUnidadesMedida(res.unidadesMedida || [])
                setPermisosModulos(res.permisosModulos || { pos: false, financiamiento: false, puedeUsarFinanciamientoEnVenta: false })
                if (res.tiposComprobante.length > 0) setTipoComprobanteId(res.tiposComprobante[0].id)
            } else {
                alert(res.mensaje || tr('Error al cargar datos', 'Error loading data'))
                router.push(returnPath)
            }
        } catch (e) {
            console.error(e)
            alert(tr('Error al cargar datos iniciales', 'Error loading initial data'))
            router.push(returnPath)
        } finally {
            setCargando(false)
        }
    }

    const cargarInfoCredito = async (clienteId) => {
        setCargandoCredito(true)
        try {
            const res = await obtenerCreditoCliente(clienteId)
            setInfoCredito(res.success ? res.credito : null)
        } catch (e) { console.error(e); setInfoCredito(null) }
        finally { setCargandoCredito(false) }
    }

    const cargarPlanesFinanciamiento = async () => {
        setCargandoPlanesFinanciamiento(true)
        try {
            const res = await obtenerPlanesFinanciamientoVenta()
            if (res.success) {
                setPlanesFinanciamiento(res.planes || [])
            } else {
                alert(res.mensaje || tr('No se pudieron cargar los planes de financiamiento', 'Could not load financing plans'))
            }
        } catch (e) {
            console.error(e)
            alert(tr('Error cargando planes de financiamiento', 'Error loading financing plans'))
        } finally {
            setCargandoPlanesFinanciamiento(false)
        }
    }

    const manejarBusquedaProducto = (e) => {
        setBusquedaProducto(e.target.value)
        if (e.target.value.trim().length >= 2) setMostrarDropdownProductos(true)
    }

    const manejarTeclaBusquedaProducto = (e) => {
        if (e.key === 'Escape') {
            setMostrarDropdownProductos(false)
            return
        }
        if (e.key === 'Enter' && mostrarDropdownProductos && productos.length > 0) {
            e.preventDefault()
            agregarProducto(productos[0])
        }
    }

    const CANTIDAD_MINIMA = 0.001
    const PASO_CANTIDAD = 0.1

    const redondearCantidad = (valor) => {
        const n = parseFloat(valor)
        if (!Number.isFinite(n)) return null
        return Math.round(n * 1000) / 1000
    }

    const resolverPrecioMayorista = (producto, cantidad) => {
        const precioPorUnidad = parseFloat(producto.precio_por_unidad) || parseFloat(producto.precio_venta) || 0
        const precioMayorista = parseFloat(producto.precio_mayorista) || 0
        const cantidadMayorista = parseInt(producto.cantidad_mayorista) || 0
        if (precioMayorista > 0 && cantidadMayorista > 0 && parseFloat(cantidad) >= cantidadMayorista) {
            return precioMayorista
        }
        return precioPorUnidad
    }

    const agregarProducto = async (producto) => {
        const existe = productosVenta.find(p => p.id === producto.id)
        const unidadDefault = producto.unidad_venta_default_id || producto.unidad_medida_id
        const cantidadInicial = 1

        if (existe) {
            const paso = PASO_CANTIDAD
            const actual = parseFloat(existe.cantidad) || 0
            const nuevaCantidad = redondearCantidad(actual + paso)
            const precio = resolverPrecioMayorista(producto, nuevaCantidad)
            const upd = productosVenta.map(p => p.id === producto.id ? {
                ...p,
                cantidad: nuevaCantidad,
                cantidadDespachar: redondearCantidad(parseFloat(p.cantidadDespachar || p.cantidad) + paso),
                precio_venta_usado: precio,
                precio_por_unidad: parseFloat(producto.precio_por_unidad) || parseFloat(producto.precio_venta)
            } : p)
            const prod = upd.find(p => p.id === producto.id)
            if (prod) {
                const sub = await calcularSubtotalProducto(prod)
                setProductosVenta(upd.map(p => p.id === producto.id ? { ...p, subtotal_calculado: sub } : p))
            } else { setProductosVenta(upd) }
        } else {
            const precioPorUnidad = parseFloat(producto.precio_por_unidad) || parseFloat(producto.precio_venta)
            const precio = resolverPrecioMayorista(producto, cantidadInicial)
            const nuevo = {
                ...producto,
                cantidad: cantidadInicial,
                precio_venta_usado: precio,
                precio_por_unidad: precioPorUnidad,
                despacho_parcial: false,
                cantidadDespachar: cantidadInicial,
                aplica_itbis: producto.aplica_itbis !== undefined ? producto.aplica_itbis : true,
                unidad_medida_usada_id: unidadDefault
            }
            const precioFinal = await calcularPrecioPorUnidad(nuevo)
            const sub = await calcularSubtotalProducto({ ...nuevo, precio_venta_usado: precioFinal })
            nuevo.precio_venta_usado = precioFinal
            nuevo.subtotal_calculado = sub
            setProductosVenta([...productosVenta, nuevo])
        }
        setBusquedaProducto('')
        setMostrarDropdownProductos(false)
    }

    const validarYNormalizarCantidad = (valor) => {
        if (!valor || valor === '') return { valido: false, valor: '', valorNumerico: null }
        let v = valor.toString().replace(',', '.')
        const partes = v.split('.')
        if (partes.length > 2) v = partes[0] + '.' + partes.slice(1).join('')
        v = v.replace(/[^0-9.]/g, '')
        if (v.startsWith('.')) v = '0' + v
        const num = parseFloat(v)
        const esValido = !isNaN(num) && num > 0
        if (v.includes('.')) {
            const p = v.split('.')
            if (p[1] && p[1].length > 3) v = p[0] + '.' + p[1].substring(0, 3)
        }
        const esTemporal = v === '.' || v.endsWith('.') || v === '0'
        return { valido: esValido || esTemporal, valor: v, valorNumerico: esValido ? num : null, esTemporal }
    }

    const actualizarCantidad = async (productoId, nuevaCantidad, { validarStock = false } = {}) => {
        let productoParaSubtotal = null
        const seq = Date.now()
        if (latestCantidadIdRef.current) latestCantidadIdRef.current[productoId] = seq

        setProductosVenta(prev => {
            const producto = prev.find(p => p.id === productoId)
            if (!producto) return prev

            const minCant = CANTIDAD_MINIMA
            const val = validarYNormalizarCantidad(nuevaCantidad)

            if (!val.valido && !val.esTemporal) {
                if (val.valor === '' || val.valor === '0') {
                    return prev.map(p => p.id === productoId ? { ...p, cantidad: val.valor, cantidadTemporal: true } : p)
                }
                return prev
            }

            if (val.esTemporal) {
                const next = prev.map(p => {
                    if (p.id !== productoId) return p
                    const cfNum = parseFloat(val.valor) || 0
                    const nd = p.despacho_parcial ? p.cantidadDespachar : cfNum
                    return {
                        ...p,
                        cantidad: val.valor,
                        cantidadTemporal: true,
                        cantidadDespachar: nd > cfNum ? cfNum : nd,
                        subtotal_calculado: cfNum * (p.precio_venta_usado || p.precio_por_unidad || 0)
                    }
                })
                productoParaSubtotal = next.find(p => p.id === productoId) || null
                return next
            }

            let valorNumerico = val.valorNumerico
            let valorTexto = val.valor

            const stockMax = parseFloat(producto.stock)
            if (validarStock && valorNumerico && valorNumerico > stockMax) {
                alert(tr(`Stock disponible: ${formatearStock(producto.stock)} ${producto.unidad_medida_nombre || ''}`, `Available stock: ${formatearStock(producto.stock)} ${producto.unidad_medida_nombre || ''}`))
                valorNumerico = redondearCantidad(stockMax)
                valorTexto = String(valorNumerico)
            }

            if (valorNumerico && valorNumerico <= 0) {
                return prev.map(p => p.id === productoId ? { ...p, cantidad: valorTexto, cantidadTemporal: true } : p)
            }

            const nuevoPrecio = valorNumerico
                ? resolverPrecioMayorista(producto, valorNumerico)
                : (producto.precio_venta_usado || parseFloat(producto.precio_por_unidad) || parseFloat(producto.precio_venta))

            const next = prev.map(p => {
                if (p.id !== productoId) return p
                const cf = valorTexto || String(minCant)
                const cfNum = parseFloat(cf) || 0
                const nd = p.despacho_parcial ? p.cantidadDespachar : cfNum
                return {
                    ...p,
                    cantidad: cf,
                    cantidadTemporal: false,
                    cantidadDespachar: nd > cfNum ? cfNum : nd,
                    precio_venta_usado: nuevoPrecio,
                    subtotal_calculado: cfNum * nuevoPrecio
                }
            })

            productoParaSubtotal = next.find(p => p.id === productoId) || null
            return next
        })

        if (productoParaSubtotal) {
            const cant = parseFloat(productoParaSubtotal.cantidad)
            if (Number.isFinite(cant) && cant > 0) {
                const sub = await calcularSubtotalProducto(productoParaSubtotal)
                if (latestCantidadIdRef.current?.[productoId] !== seq) return
                setProductosVenta(prev => prev.map(p => p.id === productoId ? { ...p, subtotal_calculado: sub } : p))
            }
        }
    }

    const ajustarCantidadProducto = async (productoId, delta) => {
        const producto = productosVenta.find(p => p.id === productoId)
        if (!producto) return
        const minCant = CANTIDAD_MINIMA
        const paso = PASO_CANTIDAD * delta
        const actual = parseFloat(producto.cantidad)
        const base = Number.isFinite(actual) && actual > 0 ? actual : minCant

        if (delta < 0 && base <= minCant) {
            eliminarProducto(productoId)
            return
        }

        const siguiente = redondearCantidad(Math.max(minCant, base + paso))
        await actualizarCantidad(productoId, String(siguiente), { validarStock: true })
    }

    const normalizarCantidadEnBlur = async (productoId, valorInput) => {
        const producto = productosVenta.find(p => p.id === productoId)
        if (!producto) return
        const minCant = CANTIDAD_MINIMA
        const v = validarYNormalizarCantidad(valorInput)

        if (v.valor?.endsWith('.')) {
            await actualizarCantidad(productoId, v.valor, { validarStock: true })
            return
        }
        if (!v.valido || v.valor === '' || !v.valorNumerico || v.valorNumerico <= 0) {
            await actualizarCantidad(productoId, String(minCant), { validarStock: true })
            return
        }
        const normalizada = redondearCantidad(v.valorNumerico)
        await actualizarCantidad(productoId, String(normalizada), { validarStock: true })
    }

    const obtenerFactor = async (origenId, destinoId) => {
        const key = `${origenId}_${destinoId}`
        if (factoresConversionCache[key] !== undefined) return factoresConversionCache[key]
        if (parseInt(origenId) === parseInt(destinoId)) return 1.0
        const res = await obtenerFactorConversionCliente(origenId, destinoId)
        if (res.success && res.factor !== null) {
            setFactoresConversionCache(prev => ({ ...prev, [key]: res.factor }))
            return res.factor
        }
        return null
    }

    const calcularPrecioPorUnidad = async (producto) => {
        const baseId = producto.unidad_medida_id
        const selId  = producto.unidad_medida_usada_id || baseId
        const precioBase = producto.precio_venta_usado || parseFloat(producto.precio_por_unidad) || parseFloat(producto.precio_venta) || 0
        if (parseInt(selId) === parseInt(baseId)) return precioBase
        const factor = await obtenerFactor(selId, baseId)
        return factor === null ? precioBase : precioBase * factor
    }

    const calcularSubtotalProducto = async (producto) => {
        let cantidad = parseFloat(producto.cantidad) || 0
        if (producto.cantidadTemporal && typeof producto.cantidad === 'string' && producto.cantidad.endsWith('.')) cantidad = 0
        const precio = await calcularPrecioPorUnidad(producto)
        return cantidad * precio
    }

    const actualizarUnidad = async (productoId, unidadId) => {
        const upd = productosVenta.map(p => p.id === productoId ? { ...p, unidad_medida_usada_id: parseInt(unidadId) } : p)
        setProductosVenta(upd)
        const prod = upd.find(p => p.id === productoId)
        const precio = await calcularPrecioPorUnidad(prod)
        const sub    = await calcularSubtotalProducto(prod)
        setProductosVenta(upd.map(p => p.id === productoId ? { ...p, precio_venta_usado: precio, subtotal_calculado: sub } : p))
    }

    const actualizarPrecio = (productoId, nuevoPrecio) => {
        setProductosVenta(productosVenta.map(p => p.id === productoId ? { ...p, precio_venta_usado: parseFloat(nuevoPrecio) || 0 } : p))
    }

    const toggleDespachoParcial = (id) => {
        setProductosVenta(productosVenta.map(p => {
            if (p.id === id) {
                const nuevo = !p.despacho_parcial
                return { ...p, despacho_parcial: nuevo, cantidadDespachar: nuevo ? Math.min(p.cantidad, p.cantidadDespachar) : p.cantidad }
            }
            return p
        }))
    }

    const toggleAplicaItbis = (id) => {
        setProductosVenta(productosVenta.map(p => p.id === id ? { ...p, aplica_itbis: !p.aplica_itbis } : p))
    }

    const actualizarCantidadDespachar = (productoId, nuevaCantidad) => {
        const producto = productosVenta.find(p => p.id === productoId)
        if (!producto) return
        const val = validarYNormalizarCantidad(nuevaCantidad)
        if (!val.valido && !val.esTemporal) return
        setProductosVenta(productosVenta.map(p => {
            if (p.id === productoId) {
                let cv
                if (val.esTemporal) { cv = val.valor }
                else {
                    const min = CANTIDAD_MINIMA
                    const num = val.valorNumerico
                        ? Math.min(Math.max(min, val.valorNumerico), parseFloat(p.cantidad) || 0)
                        : min
                    cv = num
                }
                return { ...p, cantidadDespachar: cv, cantidadDespacharTemporal: val.esTemporal || false }
            }
            return p
        }))
    }

    const eliminarProducto = (id) => setProductosVenta(productosVenta.filter(p => p.id !== id))

    useEffect(() => {
        if (clienteSeleccionado) { setClientes([]); setMostrarDropdownClientes(false); return }
        if (inputClienteFocused && busquedaClienteDebounced.trim() === '') {
            buscarClientes('').then(res => { if (res.success) { setClientes(res.clientes); setMostrarDropdownClientes(true) } })
            return
        }
        if (busquedaClienteDebounced.trim().length >= 2) {
            buscarClientes(busquedaClienteDebounced).then(res => { if (res.success) { setClientes(res.clientes); setMostrarDropdownClientes(true) } })
            return
        }
        setClientes([]); setMostrarDropdownClientes(false)
    }, [busquedaClienteDebounced, clienteSeleccionado, inputClienteFocused])

    useEffect(() => {
        if (unidadesMedida.length === 0 || productosVenta.length === 0) return
        const necesita = productosVenta.some(p => p.precio_venta_usado === undefined || p.subtotal_calculado === undefined)
        if (!necesita) return
        const recalcular = async () => {
            const upd = await Promise.all(productosVenta.map(async (p) => {
                if (p.precio_venta_usado !== undefined && p.subtotal_calculado !== undefined) return p
                const precio = await calcularPrecioPorUnidad(p)
                const sub    = await calcularSubtotalProducto({ ...p, precio_venta_usado: precio })
                return { ...p, precio_venta_usado: precio, subtotal_calculado: sub }
            }))
            setProductosVenta(upd)
        }
        recalcular()
    }, [unidadesMedida.length])

    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente)
        setBusquedaCliente(cliente.nombre_completo)
        setMostrarDropdownClientes(false)
    }

    const limpiarCliente = () => {
        setClienteSeleccionado(null)
        setBusquedaCliente('')
        setInfoCredito(null)
        setClienteConCredito(false)
        setInputClienteFocused(false)
        if (metodoPago === 'credito' || metodoPago === 'mixto' || metodoPago === 'financiamiento') setMetodoPago('efectivo')
        setPagosMixtos([])
    }

    const crearClienteRapidoHandler = async (e) => {
        e.preventDefault()
        if (!nombreClienteRapido.trim()) { alert(tr('Ingresa el nombre del cliente', 'Enter customer name')); return }
        setProcesando(true)
        try {
            const res = await crearClienteRapido(nombreClienteRapido.trim())
            if (res.success) {
                setClienteSeleccionado(res.cliente)
                setBusquedaCliente(res.cliente.nombre_completo || res.cliente.nombre || '')
                setMostrarModalCliente(false)
            } else { alert(res.mensaje || tr('Error al crear cliente', 'Error creating customer')) }
        } catch (e) { console.error(e); alert(tr('Error al crear cliente', 'Error creating customer')) }
        finally { setProcesando(false) }
    }

    const calcularTotalExtra = () => {
        const precio = parseFloat(formExtra.precioUnitario) || 0
        const cant   = parseFloat(formExtra.cantidad) || 1
        const base   = precio * cant
        const imp    = formExtra.aplicaItbis ? (base * parseFloat(datosEmpresa?.impuesto_porcentaje || 18)) / 100 : 0
        return base + imp
    }

    const agregarProductoExtra = (e) => {
        e.preventDefault()
        if (!formExtra.nombre.trim()) { alert(tr('Ingresa el nombre del producto extra', 'Enter extra product name')); return }
        const precio = parseFloat(formExtra.precioUnitario) || 0
        if (precio <= 0) { alert(tr('El precio debe ser mayor a cero', 'Price must be greater than zero')); return }
        setProductosExtra([...productosExtra, {
            id: Date.now(), nombre: formExtra.nombre.trim(), tipo: formExtra.tipo,
            cantidad: parseFloat(formExtra.cantidad) || 1, precio_unitario: precio,
            aplica_itbis: formExtra.aplicaItbis, notas: formExtra.notas.trim() || null
        }])
        setMostrarModalExtra(false)
    }

    const calcularTotales = () => {
        let subtotal = 0
        let descuento = parseFloat(descuentoGlobal) || 0
        productosVenta.forEach(p => {
            if (p.subtotal_calculado !== undefined) subtotal += parseFloat(p.subtotal_calculado) || 0
            else subtotal += (p.precio_venta_usado || p.precio_por_unidad || 0) * (parseFloat(p.cantidad) || 0)
        })
        let subtotalExtras = 0
        productosExtra.forEach(e => { subtotalExtras += e.precio_unitario * e.cantidad })
        let itbisProductos = 0
        productosVenta.forEach(p => {
            if (p.aplica_itbis) {
                const sub = p.subtotal_calculado !== undefined ? p.subtotal_calculado : (p.precio_venta_usado || p.precio_por_unidad || 0) * p.cantidad
                itbisProductos += (sub * parseFloat(datosEmpresa?.impuesto_porcentaje || 18)) / 100
            }
        })
        let itbisExtras = 0
        productosExtra.forEach(e => {
            if (e.aplica_itbis) itbisExtras += (e.precio_unitario * e.cantidad * parseFloat(datosEmpresa?.impuesto_porcentaje || 18)) / 100
        })
        const itbis = itbisProductos + itbisExtras
        const total = subtotal + subtotalExtras + itbis - descuento
        return {
            subtotal: subtotal.toFixed(2),
            subtotalExtras: subtotalExtras.toFixed(2),
            descuento: descuento.toFixed(2),
            montoGravado: (subtotal + subtotalExtras).toFixed(2),
            itbis: itbis.toFixed(2),
            total: total.toFixed(2)
        }
    }

    const totales = calcularTotales()
    const totalNum = parseFloat(totales.total)
    const planFinSeleccionado = planesFinanciamiento.find(p => String(p.id) === String(financiamiento.plan_id)) || null
    const opcionFinSeleccionada = planFinSeleccionado?.opciones?.find(o => String(o.id) === String(financiamiento.opcion_id)) || null
    const cuotasFinanciamiento = parseInt(financiamiento.meses_manual) || (opcionFinSeleccionada?.meses || 0)
    const tasaFinanciamiento = parseFloat(planFinSeleccionado?.tasa_interes || 0)
    const montoFinanciado = totalNum > 0 ? totalNum : 0
    const totalFinanciamiento = montoFinanciado > 0 ? montoFinanciado * (1 + tasaFinanciamiento / 100) : 0
    const cuotaEstimadaFinanciamiento = cuotasFinanciamiento > 0 ? (totalFinanciamiento / cuotasFinanciamiento) : 0
    const adelantoFin = parseFloat(financiamiento.monto_adelantado || 0)
    const saldoFinRestante = totalFinanciamiento - adelantoFin
    const adelantoFinInfo = adelantoFin > 0 && cuotasFinanciamiento > 0
        ? distribuirAdelantoPreview(cuotasFinanciamiento, cuotaEstimadaFinanciamiento, adelantoFin)
        : null

    const validarVenta = (metodoOverride = null) => {
        const mp = metodoOverride || metodoPago
        if (productosVenta.length === 0 && productosExtra.length === 0) { alert(tr('Agrega al menos un producto o extra a la venta', 'Add at least one product or extra to the sale')); return false }
        if (!tipoComprobanteId) { alert(tr('Selecciona un tipo de comprobante', 'Select a receipt type')); return false }
        const tipoComp = tiposComprobante.find(t => t.id === parseInt(tipoComprobanteId))

        if (mp === 'financiamiento') {
            if (!puedeUsarFinanciamientoEnVenta) {
                alert(tr('Financiamiento no está habilitado para esta empresa', 'Financing is not enabled for this company'))
                return false
            }
            if (!clienteSeleccionado) { alert(tr('El financiamiento requiere un cliente', 'Financing requires a customer')); return false }
            if (!financiamiento.plan_id) { alert(tr('Selecciona un plan de financiamiento', 'Select a financing plan')); return false }
            if (!cuotasFinanciamiento || cuotasFinanciamiento <= 0) { alert(tr('Define el número de cuotas del financiamiento', 'Set the number of financing installments')); return false }
            if (adelantoFin < 0 || (adelantoFin > 0 && adelantoFin >= totalFinanciamiento)) {
                alert(tr('El pago adelantado debe ser menor al total a pagar', 'Advance payment must be less than total to pay'))
                return false
            }
        }

        if (mp === 'mixto') {
            if (pagosMixtos.length < 2) { alert(tr('El pago mixto requiere al menos 2 métodos', 'Mixed payment requires at least 2 methods')); return false }
            const sumaMixto = pagosMixtos.reduce((a, p) => a + p.monto, 0)
            if (sumaMixto < totalNum) { alert(tr('El monto pagado es menor al total de la venta', 'Paid amount is lower than sale total')); return false }
            const tieneCreditoEnMixto = pagosMixtos.some(p => p.metodo_pago === 'credito')
            if (tieneCreditoEnMixto) {
                if (!clienteSeleccionado) { alert(tr('La venta con crédito requiere un cliente', 'Credit sale requires a customer')); return false }
            }
        } else if (mp === 'credito') {
            if (!clienteSeleccionado) { alert(tr('La venta a crédito requiere un cliente', 'Credit sale requires a customer')); return false }
        }

        if (tipoComp?.requiere_rnc && !clienteSeleccionado) { alert(tr('Este comprobante requiere cliente', 'This receipt type requires a customer')); return false }

        for (const p of productosVenta) {
            if (p.despacho_parcial && p.cantidadDespachar < CANTIDAD_MINIMA) { alert(language === 'en' ? `"${p.nombre}" must dispatch at least the minimum quantity` : `"${p.nombre}" debe despachar al menos la cantidad mínima`); return false }
            if (p.despacho_parcial && p.cantidadDespachar > p.cantidad) { alert(language === 'en' ? `"${p.nombre}" cannot dispatch more than purchased` : `"${p.nombre}" no puede despachar más de lo comprado`); return false }
        }

        if (mp === 'efectivo') {
            const recibido = parseFloat(efectivoRecibido) || 0
            if (recibido < totalNum) { alert(tr('El efectivo recibido debe ser mayor o igual al total', 'Cash received must be greater than or equal to total')); return false }
        }

        return true
    }

    const procesarVenta = async (metodoOverride = null) => {
        const mp = metodoOverride || metodoPago
        if (!validarVenta(mp)) return
        setProcesando(true)
        try {
            const totalesActuales = calcularTotales()
            let efectivoRecibidoFinal = null
            let cambioFinal = null

            if (mp === 'efectivo' && efectivoRecibido) {
                efectivoRecibidoFinal = parseFloat(efectivoRecibido)
                cambioFinal = efectivoRecibidoFinal - parseFloat(totalesActuales.total)
            }

            const hayDespachoParcial = productosVenta.some(p => p.despacho_parcial)

            const datosVenta = {
                tipo_comprobante_id: parseInt(tipoComprobanteId),
                cliente_id: clienteSeleccionado?.id || null,
                productos: productosVenta.map(p => ({
                    producto_id: p.id,
                    nombre_producto: p.nombre,
                    cantidad: parseFloat(p.cantidad),
                    unidad_medida_id: p.unidad_medida_usada_id || p.unidad_medida_id,
                    precio_unitario: p.precio_por_unidad || p.precio_venta || 0,
                    precio_unitario_usado: p.precio_venta_usado || p.precio_por_unidad || p.precio_venta || 0,
                    despacho_parcial: p.despacho_parcial,
                    cantidad_despachar: p.despacho_parcial ? parseFloat(p.cantidadDespachar) : parseFloat(p.cantidad)
                })),
                extras: productosExtra.map(e => ({
                    nombre: e.nombre, tipo: e.tipo, cantidad: e.cantidad,
                    precio_unitario: e.precio_unitario, aplica_itbis: e.aplica_itbis, notas: e.notas
                })),
                subtotal: parseFloat(totalesActuales.subtotal) + parseFloat(totalesActuales.subtotalExtras),
                descuento: parseFloat(totalesActuales.descuento),
                monto_gravado: parseFloat(totalesActuales.montoGravado),
                itbis: parseFloat(totalesActuales.itbis),
                total: parseFloat(totalesActuales.total),
                metodo_pago: mp === 'financiamiento' ? 'credito' : mp,
                pagos_mixtos: mp === 'mixto' ? pagosMixtos : null,
                financiamiento: mp === 'financiamiento' ? {
                    plan_id: parseInt(financiamiento.plan_id),
                    opcion_id: financiamiento.opcion_id ? parseInt(financiamiento.opcion_id) : null,
                    meses_manual: financiamiento.meses_manual ? parseInt(financiamiento.meses_manual) : null,
                    monto_adelantado: parseFloat(financiamiento.monto_adelantado || 0),
                    fecha_primer_pago: financiamiento.fecha_primer_pago || null,
                    notas: financiamiento.notas?.trim() || null
                } : null,
                efectivo_recibido: efectivoRecibidoFinal,
                cambio: cambioFinal,
                notas: null,
                tipo_entrega: hayDespachoParcial ? 'parcial' : 'completa'
            }

            const res = await crearVenta(datosVenta)
            if (res.success) {
                const base = returnPath.replace('/ventas', '')
                router.push(`${base}/ventas/imprimir/${res.venta.id}`)
            } else {
                alert(res.mensaje || tr('Error al crear la venta', 'Error creating sale'))
            }
        } catch (e) {
            console.error(e)
            alert(tr('Error al procesar la venta', 'Error processing sale'))
        } finally {
            setProcesando(false)
        }
    }

    const cambioNum = metodoPago === 'efectivo' && efectivoRecibido !== ''
        ? parseFloat(efectivoRecibido) - totalNum
        : null

    const claseMontoTotal = totalNum < 0
        ? estilos.montoNegativo
        : (cambioNum !== null && Math.abs(cambioNum) < 0.005 ? estilos.montoExacto : estilos.montoNormal)

    const claseCambioResumen = cambioNum === null
        ? ''
        : cambioNum < -0.005
            ? estilos.montoNegativo
            : Math.abs(cambioNum) < 0.005
                ? estilos.montoExacto
                : estilos.montoVuelto

    const getLabelMontoRecibido = () => {
        const labels = {
            efectivo:        tr('Efectivo Recibido', 'Cash Received'),
            tarjeta_debito:  tr('Monto T. Débito', 'Debit Amount'),
            tarjeta_credito: tr('Monto T. Crédito', 'Credit Card Amount'),
            transferencia:   tr('Monto Transferencia', 'Transfer Amount'),
            cheque:          tr('Monto Cheque', 'Check Amount'),
            credito:         tr('Monto a Crédito', 'Credit Amount'),
            financiamiento:  tr('Monto Financiado', 'Financed Amount'),
            mixto:           tr('Pago Mixto', 'Mixed Payment')
        }
        return labels[metodoPago] || tr('Monto Recibido', 'Amount Received')
    }

    const seleccionarMetodoPago = (metodo) => {
        if (metodo === 'credito') {
            if (!clienteSeleccionado) { alert(tr('Debes seleccionar un cliente para realizar una venta a crédito', 'You must select a customer to create a credit sale')); return }
        }
        if (metodo === 'financiamiento') {
            if (!puedeUsarFinanciamientoEnVenta) {
                alert(tr('Financiamiento no está habilitado para esta empresa', 'Financing is not enabled for this company'))
                return
            }
            if (!clienteSeleccionado) {
                alert(tr('Debes seleccionar un cliente para financiar', 'You must select a customer to finance'))
                return
            }
            if (planesFinanciamiento.length === 0 && !cargandoPlanesFinanciamiento) {
                cargarPlanesFinanciamiento()
            }
        }
        if (metodo === 'mixto') {
            setPagosMixtos([])
            setMostrarModalPagoMixto(true)
        }
        setMetodoPago(metodo)
    }

    const confirmarPagoMixto = (pagos) => {
        setPagosMixtos(pagos)
        setMetodoPago('mixto')
        setMostrarModalPagoMixto(false)
    }

    const limpiarVenta = () => {
        if (procesando) return
        if ((productosVenta.length > 0 || productosExtra.length > 0) && !confirm(tr('¿Limpiar venta actual?', 'Clear current sale?'))) return
        setProductosVenta([])
        setProductosExtra([])
        setClienteSeleccionado(null)
        setBusquedaCliente('')
        setEfectivoRecibido('')
        setDescuentoGlobal('')
        setMetodoPago('efectivo')
        setPagosMixtos([])
        setFilaSeleccionada(null)
        setFinanciamiento({
            plan_id: '', opcion_id: '', meses_manual: '',
            monto_adelantado: '', fecha_primer_pago: financiamiento.fecha_primer_pago || '', notas: ''
        })
    }

    const puedeCobrar = !procesando && (productosVenta.length > 0 || productosExtra.length > 0)

    const procesarConMetodo = async (metodo) => {
        if (metodo !== metodoPago) setMetodoPago(metodo)
        await procesarVenta(metodo)
    }

    const calcularLineaProducto = (producto) => {
        const pct = parseFloat(datosEmpresa?.impuesto_porcentaje || 18)
        let importe = 0
        if (producto.subtotal_calculado !== undefined) importe = parseFloat(producto.subtotal_calculado) || 0
        else importe = (producto.precio_venta_usado || producto.precio_por_unidad || 0) * (parseFloat(producto.cantidad) || 0)
        const itbisLinea = producto.aplica_itbis !== false ? (importe * pct) / 100 : 0
        return { importe, itbisLinea, totalLinea: importe + itbisLinea }
    }

    const formatearMontoLed = (valor) => (
        (parseFloat(valor) || 0).toLocaleString(localeEmpresa, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    )

    const fechaActual = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    })

    useEffect(() => {
        const onKey = (e) => {
            if (procesando) return
            if (e.key === 'F2') { e.preventDefault(); inputProductoRef.current?.focus() }
            if (e.key === 'F6') { e.preventDefault(); inputClienteRef.current?.focus() }
            if (e.key === 'F7') { e.preventDefault(); limpiarVenta() }
            if (e.key === 'F9') { e.preventDefault(); setMetodoPago('efectivo'); procesarVenta('efectivo') }
            if (e.key === 'F12') { e.preventDefault(); procesarConMetodo('credito') }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [procesando, productosVenta, productosExtra, clienteSeleccionado, efectivoRecibido, tipoComprobanteId, metodoPago, pagosMixtos, financiamiento])

    if (cargando) {
        return <LoadingScreen />
    }

    return (
        <div className={`${estilos.contenedorOptimizado} ${estilos[tema]}`}>
            <header className={estilos.barraHerramientas}>
                <div className={estilos.barraHerramientasIzq}>
                    <h1 className={estilos.tituloVenta}>{tr('Nueva venta', 'New sale')}</h1>
                    {datosEmpresa?.nombre_comercial && (
                        <span className={estilos.empresaBadge}>{datosEmpresa.nombre_comercial}</span>
                    )}
                </div>

                <div className={estilos.barraMeta}>
                    <span className={estilos.metaChip}>
                        <ion-icon name="calendar-outline" />
                        {fechaActual}
                    </span>
                    <span className={estilos.metaChip}>
                        <ion-icon name="time-outline" />
                        {horaActual}
                    </span>
                    <span className={estilos.metaChip}>
                        <ion-icon name="storefront-outline" />
                        {tr('Caja', 'Register')} 01
                    </span>
                </div>

                <div className={estilos.barraHerramientasDer}>
                    <button type="button" className={`${estilos.btnBarra} ${estilos.btnBarraRapida}`} onClick={() => router.push(rapidaPath)}>
                        <ion-icon name="flash-outline" />
                        {tr('Venta rápida', 'Quick sale')}
                    </button>
                    <button type="button" className={estilos.btnBarra} onClick={() => router.push(returnPath)}>
                        <ion-icon name="arrow-back-outline" />
                        {tr('Salir', 'Exit')}
                    </button>
                </div>
            </header>

            <div className={estilos.cuerpoVenta}>
                <div className={estilos.bloqueCliente}>
                    <span className={estilos.etiquetaBloque}>{tr('Cliente', 'Customer')}</span>
                    <div className={`${estilos.campoGrupo} ${estilos.campoGrupoCliente}`}>
                        <span className={estilos.etiquetaCampo}>
                            {tr('Cliente', 'Customer')} <span className={estilos.etiquetaAtajo}>(F6)</span>
                        </span>
                        <div className={`${estilos.filaClienteBusqueda} ${estilos.busquedaClienteContainer}`}>
                            <input
                                ref={inputClienteRef}
                                type="text"
                                className={`${estilos.campoInput} ${clienteSeleccionado ? estilos.campoClienteActivo : ''}`}
                                placeholder={tr('Buscar por nombre o documento...', 'Search by name or tax ID...')}
                                value={clienteSeleccionado ? (clienteSeleccionado.nombre_completo || clienteSeleccionado.nombre || '') : (busquedaCliente || '')}
                                onFocus={() => setInputClienteFocused(true)}
                                onBlur={() => setTimeout(() => setInputClienteFocused(false), 180)}
                                onChange={e => {
                                    if (clienteSeleccionado) limpiarCliente()
                                    setBusquedaCliente(e.target.value)
                                }}
                            />
                            <button type="button" className={estilos.btnIcono} onClick={() => inputClienteRef.current?.focus()} title={tr('Buscar cliente', 'Search customer')}>
                                <ion-icon name="search-outline" />
                            </button>
                            {clienteSeleccionado && (
                                <button type="button" className={estilos.btnIcono} onClick={limpiarCliente} title={tr('Quitar cliente', 'Remove customer')}>
                                    <ion-icon name="close-circle" />
                                </button>
                            )}
                            <button type="button" className={estilos.btnIcono} onClick={() => { setNombreClienteRapido(''); setMostrarModalCliente(true) }} title={tr('Cliente rápido', 'Quick customer')}>
                                <ion-icon name="person-add-outline" />
                            </button>
                            {mostrarDropdownClientes && clientes.length > 0 && !clienteSeleccionado && (
                                <div className={estilos.dropdownClientes}>
                                    {clientes.map(c => (
                                        <div key={c.id} className={estilos.dropdownItemCliente} onClick={() => seleccionarCliente(c)}>
                                            <span className={estilos.clienteNombre}>{c.nombre_completo}</span>
                                            <span className={estilos.clienteDoc}>{c.tipo_documento}: {c.numero_documento}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {clienteSeleccionado ? (
                            <div className={estilos.clienteMeta}>
                                <span>{clienteSeleccionado.tipo_documento}: {clienteSeleccionado.numero_documento}</span>
                                {clienteConCredito && (
                                    <span className={estilos.badgeCredito}>{tr('Con crédito', 'Has credit')}</span>
                                )}
                            </div>
                        ) : (
                            <span className={estilos.clienteMetaContado}>{tr('Sin cliente — venta al contado', 'No customer — walk-in sale')}</span>
                        )}
                    </div>
                </div>

                <div className={estilos.columnaProductos}>
                {metodoPago === 'credito' && !clienteSeleccionado && (
                    <div className={`${estilos.alertaBanner} ${estilos.alertaWarning}`}>
                        <ion-icon name="warning-outline" />
                        <span>{tr('Debes seleccionar un cliente para una venta a crédito', 'You must select a customer for a credit sale')}</span>
                    </div>
                )}
                {metodoPago === 'credito' && clienteSeleccionado && !cargandoCredito && !infoCredito && (
                    <div className={`${estilos.alertaBanner} ${estilos.alertaWarning}`}>
                        <ion-icon name="information-circle-outline" />
                        <span>{tr('Se creará un perfil de crédito automáticamente al procesar la venta.', 'A credit profile will be created automatically when processing the sale.')}</span>
                    </div>
                )}
                <section className={estilos.seccionProductos}>
                    <header className={estilos.seccionProductosCabecera}>
                        <div className={estilos.seccionProductosTitulo}>
                            <ion-icon name="cube-outline" />
                            <h2>{tr('Productos', 'Products')}</h2>
                        </div>
                        <span className={estilos.seccionProductosContador}>
                            {productosVenta.length + productosExtra.length} {tr('en la venta', 'in sale')}
                        </span>
                    </header>

                    <div className={estilos.seccionProductosBusqueda}>
                        <div className={estilos.filaAgregarProductos}>
                            <div className={estilos.colBusquedaProducto}>
                                <label className={estilos.etiquetaBusquedaProducto} htmlFor="busqueda-producto-pos">
                                    {tr('Agregar producto', 'Add product')} <span className={estilos.etiquetaAtajo}>(F2)</span>
                                </label>
                                <div className={estilos.busquedaProductoContainer}>
                                    <div className={estilos.busquedaProducto}>
                                        <ion-icon name="barcode-outline" />
                                        <input
                                            id="busqueda-producto-pos"
                                            ref={inputProductoRef}
                                            type="text"
                                            className={estilos.inputBusquedaProducto}
                                            placeholder={tr('Nombre, código o SKU...', 'Name, code or SKU...')}
                                            value={busquedaProducto}
                                            onChange={manejarBusquedaProducto}
                                            onKeyDown={manejarTeclaBusquedaProducto}
                                            onFocus={() => {
                                                if (busquedaProducto.trim().length >= 2) setMostrarDropdownProductos(true)
                                            }}
                                            autoComplete="off"
                                        />
                                        {busquedaProducto && (
                                            <button
                                                type="button"
                                                className={estilos.btnLimpiarBusqueda}
                                                onClick={() => {
                                                    setBusquedaProducto('')
                                                    setProductos([])
                                                    setMostrarDropdownProductos(false)
                                                    inputProductoRef.current?.focus()
                                                }}
                                                title={tr('Limpiar', 'Clear')}
                                            >
                                                <ion-icon name="close-circle" />
                                            </button>
                                        )}
                                    </div>

                                    {mostrarDropdownProductos && busquedaProducto.trim().length >= 2 && (
                                        <div className={estilos.dropdownProductos}>
                                            {buscandoProductos ? (
                                                <div className={estilos.dropdownEstado}>
                                                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando} />
                                                    {tr('Buscando...', 'Searching...')}
                                                </div>
                                            ) : productos.length > 0 ? (
                                                productos.map(p => (
                                                    <div
                                                        key={p.id}
                                                        className={estilos.dropdownItem}
                                                        onMouseDown={e => e.preventDefault()}
                                                        onClick={() => agregarProducto(p)}
                                                    >
                                                        <div className={estilos.productoInfo}>
                                                            <span className={estilos.productoNombre}>{p.nombre}</span>
                                                            <span className={estilos.productoCodigo}>{p.codigo_barras || p.sku || `ID ${p.id}`}</span>
                                                        </div>
                                                        <div className={estilos.productoDatos}>
                                                            <span>{tr('Stock', 'Stock')}: {formatearStock(p.stock)}</span>
                                                            <span className={estilos.productoPrecio}>{formatearMonto(p.precio_venta)}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={estilos.dropdownEstado}>
                                                    {tr('Sin coincidencias', 'No matches')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                className={estilos.btnAgregarExtra}
                                onClick={() => {
                                    setFormExtra({ nombre: '', tipo: 'otro', cantidad: 1, precioUnitario: '', aplicaItbis: true, notas: '' })
                                    setMostrarModalExtra(true)
                                }}
                            >
                                <ion-icon name="add-circle-outline" />
                                {tr('Agregar extra', 'Add extra')}
                            </button>
                        </div>
                    </div>

                    <div className={estilos.tablaScroll}>
                    <table className={estilos.tablaPos}>
                    <thead>
                        <tr>
                            <th className={estilos.colItbis}>{datosEmpresa?.impuesto_nombre || 'ITBIS'}</th>
                            <th className={estilos.colCodigo}>{tr('Código', 'Code')}</th>
                            <th className={estilos.colCant}>{tr('Cant.', 'Qty')}</th>
                            <th>{tr('Descripción', 'Description')}</th>
                            <th className={estilos.colPrecio}>{tr('Precio', 'Price')}</th>
                            <th className={estilos.colImporte}>{tr('Importe', 'Amount')}</th>
                            <th className={estilos.colTotal}>{tr('Total', 'Total')}</th>
                            <th className={estilos.colAccion}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosVenta.length === 0 && productosExtra.length === 0 && busquedaProducto.trim().length < 2 && (
                            <tr>
                                <td colSpan={8} className={estilos.estadoVacioTabla}>
                                    <ion-icon name="arrow-up-outline" />
                                    <span>{tr('Use el buscador de arriba para agregar productos', 'Use the search above to add products')}</span>
                                </td>
                            </tr>
                        )}

                        {productosVenta.map((producto, idx) => {
                            const { importe, itbisLinea, totalLinea } = calcularLineaProducto(producto)
                            const uSel = unidadesMedida.find(u => u.id === (producto.unidad_medida_usada_id || producto.unidad_medida_id))
                            const precio = producto.precio_venta_usado || producto.precio_por_unidad || 0
                            return (
                                <tr
                                    key={producto.id}
                                    className={filaSeleccionada === idx ? estilos.filaSeleccionada : ''}
                                    onClick={() => setFilaSeleccionada(idx)}
                                >
                                    <td className={estilos.celdaItbis} onClick={e => e.stopPropagation()}>
                                        <div className={estilos.celdaItbisContenido}>
                                            <label className={estilos.switchItbis} title={tr('Aplicar ITBIS', 'Apply tax')}>
                                                <input
                                                    type="checkbox"
                                                    checked={producto.aplica_itbis !== false}
                                                    onChange={() => toggleAplicaItbis(producto.id)}
                                                />
                                                <span className={estilos.switchItbisSlider} aria-hidden="true" />
                                            </label>
                                            <span className={`${estilos.montoItbisLinea} ${producto.aplica_itbis === false ? estilos.montoItbisApagado : ''}`}>
                                                {formatearMontoLed(itbisLinea)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{producto.codigo_barras || producto.sku || producto.id}</td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div className={estilos.cantidadStepper}>
                                            <button
                                                type="button"
                                                className={estilos.btnCantStep}
                                                onClick={() => ajustarCantidadProducto(producto.id, -1)}
                                                title={tr('Disminuir cantidad', 'Decrease quantity')}
                                                aria-label={tr('Disminuir cantidad', 'Decrease quantity')}
                                            >
                                                <ion-icon name="remove-outline" />
                                            </button>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className={estilos.inputCantTabla}
                                                value={producto.cantidad ?? ''}
                                                onChange={e => actualizarCantidad(producto.id, e.target.value)}
                                                onBlur={e => normalizarCantidadEnBlur(producto.id, e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className={estilos.btnCantStep}
                                                onClick={() => ajustarCantidadProducto(producto.id, 1)}
                                                title={tr('Aumentar cantidad', 'Increase quantity')}
                                                aria-label={tr('Aumentar cantidad', 'Increase quantity')}
                                            >
                                                <ion-icon name="add-outline" />
                                            </button>
                                        </div>
                                        {producto.unidad_medida_id && unidadesMedida.length > 0 && (
                                            <select
                                                className={estilos.selectUnidadTabla}
                                                value={producto.unidad_medida_usada_id || producto.unidad_medida_id}
                                                onChange={e => actualizarUnidad(producto.id, e.target.value)}
                                            >
                                                {unidadesMedida.filter(u => u.tipo_medida === producto.tipo_medida || u.id === producto.unidad_medida_id).map(u => (
                                                    <option key={u.id} value={u.id}>{u.abreviatura}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td title={producto.nombre}>{producto.nombre}</td>
                                    <td className={estilos.celdaDerecha}>{formatearMonto(precio)} / {uSel?.abreviatura || 'und'}</td>
                                    <td className={estilos.celdaDerecha}>{formatearMontoLed(importe)}</td>
                                    <td className={estilos.celdaDerecha}>{formatearMontoLed(totalLinea)}</td>
                                    <td>
                                        <button type="button" className={estilos.btnEliminarFila} onClick={e => { e.stopPropagation(); eliminarProducto(producto.id) }}>
                                            <ion-icon name="trash-outline" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}

                        {productosExtra.map((extra, i) => {
                            const base = extra.precio_unitario * extra.cantidad
                            const pct = parseFloat(datosEmpresa?.impuesto_porcentaje || 18)
                            const itbisE = extra.aplica_itbis ? (base * pct) / 100 : 0
                            const idxExtra = productosVenta.length + i
                            return (
                                <tr key={`extra-${extra.id}`} className={`${estilos.filaItemExtra} ${filaSeleccionada === idxExtra ? estilos.filaSeleccionada : ''}`} onClick={() => setFilaSeleccionada(idxExtra)}>
                                    <td className={estilos.celdaItbis}>
                                        <div className={estilos.celdaItbisContenido}>
                                            <label className={`${estilos.switchItbis} ${estilos.switchItbisSolo}`}>
                                                <input type="checkbox" checked={extra.aplica_itbis} readOnly disabled />
                                                <span className={estilos.switchItbisSlider} aria-hidden="true" />
                                            </label>
                                            <span className={`${estilos.montoItbisLinea} ${!extra.aplica_itbis ? estilos.montoItbisApagado : ''}`}>
                                                {formatearMontoLed(itbisE)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>EXTRA</td>
                                    <td className={estilos.celdaCentro}>{extra.cantidad}</td>
                                    <td>{extra.nombre}</td>
                                    <td className={estilos.celdaDerecha}>{formatearMonto(extra.precio_unitario)}</td>
                                    <td className={estilos.celdaDerecha}>{formatearMontoLed(base)}</td>
                                    <td className={estilos.celdaDerecha}>{formatearMontoLed(base + itbisE)}</td>
                                    <td>
                                        <button type="button" className={estilos.btnEliminarFila} onClick={e => { e.stopPropagation(); setProductosExtra(productosExtra.filter(x => x.id !== extra.id)) }}>
                                            <ion-icon name="close-circle" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                </div>
                </section>
                </div>

                <div className={estilos.barraFormaPago}>
                    <div className={estilos.barraFormaPagoEncabezado}>
                        <span className={estilos.barraFormaPagoEtiqueta}>{tr('Forma de pago', 'Payment')}</span>
                    </div>
                    <div className={estilos.metodosPagoFila}>
                        {[
                            { value: 'efectivo', label: tr('Efectivo', 'Cash'), icono: 'cash-outline', cls: estilos.efectivo },
                            { value: 'tarjeta_debito', label: tr('Débito', 'Debit'), icono: 'card-outline', cls: estilos.debito },
                            { value: 'tarjeta_credito', label: tr('T.Crédito', 'C.Card'), icono: 'card-outline', cls: estilos.tarjetaCredito },
                            { value: 'transferencia', label: tr('Transfer.', 'Transfer'), icono: 'swap-horizontal-outline', cls: estilos.transferencia },
                            { value: 'cheque', label: tr('Cheque', 'Check'), icono: 'receipt-outline', cls: estilos.cheque },
                            { value: 'credito', label: tr('Crédito', 'Credit'), icono: 'time-outline', cls: estilos.credito },
                            ...(puedeUsarFinanciamientoEnVenta ? [{ value: 'financiamiento', label: tr('Financ.', 'Financ.'), icono: 'wallet-outline', cls: estilos.financiamiento }] : []),
                            { value: 'mixto', label: tr('Mixto', 'Mixed'), icono: 'git-merge-outline', cls: estilos.mixto },
                        ].map(m => (
                            <div
                                key={m.value}
                                className={`${estilos.metodoPagoCelda} ${metodoPago === m.value ? estilos.metodoPagoCeldaActiva : ''}`}
                            >
                                {metodoPago === m.value && (
                                    <span className={estilos.chipMetodoActivo}>{tr('Seleccionado', 'Selected')}</span>
                                )}
                                <button
                                    type="button"
                                    className={`${estilos.metodoPagoBtn} ${m.cls} ${metodoPago === m.value ? estilos.activo : ''}`}
                                    onClick={() => seleccionarMetodoPago(m.value)}
                                    disabled={m.value === 'credito' && !clienteSeleccionado}
                                    aria-pressed={metodoPago === m.value}
                                >
                                    <ion-icon name={m.icono} />
                                    <span>{m.label}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className={estilos.barraFormaPagoAcciones}>
                        <button type="button" className={estilos.btnIconoPie} onClick={limpiarVenta} disabled={procesando} title={tr('Nueva venta (F7)', 'New sale (F7)')}>
                            <ion-icon name="add-circle-outline" />
                        </button>
                        <button type="button" className={estilos.btnIconoPie} onClick={() => router.push(returnPath)} disabled={procesando} title={tr('Historial de ventas', 'Sales history')}>
                            <ion-icon name="time-outline" />
                        </button>
                    </div>

                    {metodoPago === 'mixto' && pagosMixtos.length > 0 && (
                        <div className={estilos.pagoMixtoResumenInline}>
                            {pagosMixtos.map((p, i) => (
                                <span key={i} className={estilos.pagoMixtoChipInline}>
                                    {metodosPago.find(x => x.value === p.metodo_pago)?.label}: {formatearMonto(p.monto)}
                                </span>
                            ))}
                            <button type="button" className={estilos.btnEditarMixto} onClick={() => setMostrarModalPagoMixto(true)}>{tr('Editar', 'Edit')}</button>
                        </div>
                    )}

                    {metodoPago === 'financiamiento' && (
                        <div className={estilos.panelFinanciamiento}>
                            <div className={estilos.finGrid}>
                                <div className={estilos.campoFin}>
                                    <label>{tr('Plan', 'Plan')}</label>
                                    <select className={estilos.campoSelect} value={financiamiento.plan_id} onChange={e => setFinanciamiento(prev => ({ ...prev, plan_id: e.target.value, opcion_id: '', meses_manual: '' }))} disabled={cargandoPlanesFinanciamiento}>
                                        <option value="">{cargandoPlanesFinanciamiento ? tr('Cargando...', 'Loading...') : tr('Seleccionar...', 'Select...')}</option>
                                        {planesFinanciamiento.map(plan => <option key={plan.id} value={plan.id}>{plan.nombre}</option>)}
                                    </select>
                                </div>
                                <div className={estilos.campoFin}>
                                    <label>{tr('Cuotas', 'Installments')}</label>
                                    <input type="number" min="1" value={financiamiento.meses_manual} onChange={e => setFinanciamiento(prev => ({ ...prev, meses_manual: e.target.value }))} placeholder={opcionFinSeleccionada?.meses ? String(opcionFinSeleccionada.meses) : '12'} />
                                </div>
                                <div className={estilos.campoFin}>
                                    <label>{tr('Adelanto', 'Advance')}</label>
                                    <input type="number" min="0" step="0.01" value={financiamiento.monto_adelantado} onChange={e => setFinanciamiento(prev => ({ ...prev, monto_adelantado: e.target.value }))} />
                                </div>
                            </div>
                            <div className={estilos.finResumen}>
                                <span>{tr('Cuota est.', 'Est. inst.')}: {formatearMonto(cuotaEstimadaFinanciamiento)}</span>
                                <span>{tr('Total fin.', 'Fin. total')}: {formatearMonto(totalFinanciamiento)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={estilos.bloqueComprobante}>
                    <span className={estilos.etiquetaBloque}>{tr('Comprobante', 'Receipt')}</span>
                    <div className={estilos.campoGrupo}>
                        <span className={estilos.etiquetaCampo}>{tr('Tipo', 'Type')}</span>
                        <select className={estilos.campoSelect} value={tipoComprobanteId} onChange={e => setTipoComprobanteId(e.target.value)}>
                            {tiposComprobante.map(t => (
                                <option key={t.id} value={t.id}>{etiquetaComprobanteECF(t, language)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                    <aside className={estilos.panelCobro}>
                        <div className={estilos.resumenVenta}>
                        <h3 className={estilos.tituloResumen}>{tr('Resumen de Venta', 'Sale Summary')}</h3>

                        <div className={estilos.grupoResumen}>
                            <label>{getLabelMontoRecibido()}</label>
                            <div className={`${estilos.inputMonedaResumen} ${metodoPago === 'efectivo' ? estilos.inputMonedaResumenEfectivo : ''} ${metodoPago === 'efectivo' && efectivoRecibido !== '' ? claseCambioResumen : ''}`}>
                                <span>{simboloEmpresa || monedaEmpresa}</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={efectivoRecibido}
                                    onChange={e => setEfectivoRecibido(normalizarEntradaDecimal(e.target.value))}
                                    placeholder="0.00"
                                    className={metodoPago === 'efectivo' ? estilos.inputMontoEfectivo : ''}
                                />
                            </div>
                            {metodoPago === 'efectivo' && efectivoRecibido !== '' && cambioNum !== null && (
                                <div className={estilos.cambioResumen}>
                                    <span>
                                        {cambioNum < -0.005
                                            ? tr('Falta', 'Short')
                                            : Math.abs(cambioNum) < 0.005
                                                ? tr('Exacto', 'Exact')
                                                : tr('Cambio', 'Change')}:
                                    </span>
                                    <strong className={`${estilos.montoDestacado} ${claseCambioResumen || estilos.montoNormal}`}>
                                        {formatearMonto(Math.abs(cambioNum))}
                                    </strong>
                                </div>
                            )}
                        </div>

                        <div className={estilos.grupoResumen}>
                            <label>{tr('Descuento Global', 'Global Discount')}</label>
                            <div className={estilos.inputMonedaResumen}>
                                <span>{simboloEmpresa || monedaEmpresa}</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={descuentoGlobal}
                                    onChange={e => setDescuentoGlobal(normalizarEntradaDecimal(e.target.value))}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className={estilos.lineaResumen}>
                            <span>{tr('Subtotal', 'Subtotal')}:</span>
                            <span>{formatearMonto(parseFloat(totales.subtotal) + parseFloat(totales.subtotalExtras))}</span>
                        </div>
                        <div className={estilos.lineaResumen}>
                            <span>{datosEmpresa?.impuesto_nombre || 'ITBIS'}:</span>
                            <span>{formatearMonto(totales.itbis)}</span>
                        </div>

                        <div className={estilos.separadorResumen} />

                        <div className={estilos.lineaTotal}>
                            <span>{tr('Total a Pagar', 'Total to Pay')}:</span>
                            <span className={`${estilos.montoDestacado} ${claseMontoTotal || estilos.montoNormal}`}>{formatearMonto(totales.total)}</span>
                        </div>

                        <button
                            type="button"
                            className={estilos.btnProcesar}
                            onClick={() => procesarVenta()}
                            disabled={!puedeCobrar}
                        >
                            {procesando ? (
                                <>
                                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando} />
                                    {tr('Procesando...', 'Processing...')}
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-circle-outline" />
                                    {tr('Procesar Venta', 'Process Sale')}
                                </>
                            )}
                        </button>
                        </div>
                    </aside>
            </div>

            {mostrarModalCliente && (
                <div className={estilos.modalOverlay} onClick={() => !procesando && setMostrarModalCliente(false)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`} onClick={e => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>{tr('Cliente Rápido', 'Quick Customer')}</h2>
                            <button className={estilos.btnCerrarModal} onClick={() => setMostrarModalCliente(false)} disabled={procesando} type="button"><ion-icon name="close-outline"></ion-icon></button>
                        </div>
                        <form onSubmit={crearClienteRapidoHandler} className={estilos.modalBody}>
                            <p className={estilos.infoModal}>{tr('Crea un cliente rápido con solo el nombre. Podrás completar sus datos más tarde.', 'Create a quick customer with only a name. You can complete the data later.')}</p>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Nombre del Cliente *', 'Customer Name *')}</label>
                                <input type="text" value={nombreClienteRapido} onChange={e => setNombreClienteRapido(e.target.value)} placeholder={tr('Ej: Juan Pérez', 'Ex: John Smith')} className={estilos.input} required disabled={procesando} autoFocus />
                            </div>
                            <div className={estilos.modalFooter}>
                                <button type="button" className={estilos.btnCancelarModal} onClick={() => setMostrarModalCliente(false)} disabled={procesando}>{tr('Cancelar', 'Cancel')}</button>
                                <button type="submit" className={estilos.btnGuardarModal} disabled={procesando}>{procesando ? tr('Creando...', 'Creating...') : tr('Crear Cliente', 'Create Customer')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {mostrarModalExtra && (
                <div className={estilos.modalOverlay} onClick={() => setMostrarModalExtra(false)}>
                    <div className={`${estilos.modalExtra} ${estilos[tema]}`} onClick={e => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>{tr('Agregar Producto Extra', 'Add Extra Product')}</h3>
                            <button onClick={() => setMostrarModalExtra(false)} className={estilos.btnCerrarModal} type="button"><ion-icon name="close-outline"></ion-icon></button>
                        </div>
                        <form onSubmit={agregarProductoExtra} className={estilos.formularioExtra}>
                            <div className={estilos.grupoExtra}>
                                <label className={estilos.etiquetaExtra}>{tr('Nombre del Extra', 'Extra Name')} <span className={estilos.requeridoExtra}>*</span></label>
                                <input type="text" value={formExtra.nombre} onChange={e => setFormExtra({ ...formExtra, nombre: e.target.value })} className={estilos.inputExtra} placeholder={tr('Ej: Pepperoni extra, Delivery...', 'Ex: Extra pepperoni, Delivery...')} required autoFocus />
                            </div>
                            <div className={estilos.grupoExtra}>
                                <label className={estilos.etiquetaExtra}>{tr('Tipo', 'Type')}</label>
                                <select value={formExtra.tipo} onChange={e => setFormExtra({ ...formExtra, tipo: e.target.value })} className={estilos.selectExtra}>
                                    {tiposExtra.map(t => <option key={t.valor} value={t.valor}>{t.nombre}</option>)}
                                </select>
                            </div>
                            <div className={estilos.filaFormularioExtra}>
                                <div className={estilos.grupoExtra}>
                                    <label className={estilos.etiquetaExtra}>{tr('Cantidad', 'Quantity')} <span className={estilos.requeridoExtra}>*</span></label>
                                    <input type="number" value={formExtra.cantidad} onChange={e => setFormExtra({ ...formExtra, cantidad: parseFloat(e.target.value) || 1 })} className={estilos.inputExtra} min="0.01" step="0.01" required />
                                </div>
                                <div className={estilos.grupoExtra}>
                                    <label className={estilos.etiquetaExtra}>{tr('Precio Unitario', 'Unit Price')} <span className={estilos.requeridoExtra}>*</span></label>
                                    <div className={estilos.inputWrapperExtra}>
                                        <span className={estilos.prefijoExtra}>{simboloEmpresa || monedaEmpresa}</span>
                                        <input type="number" value={formExtra.precioUnitario} onChange={e => setFormExtra({ ...formExtra, precioUnitario: e.target.value })} className={estilos.inputExtraPrecio} placeholder="0.00" min="0" step="0.01" required />
                                    </div>
                                </div>
                            </div>
                            <div className={estilos.grupoExtra}>
                                <label className={estilos.checkboxLabelExtra}>
                                    <input type="checkbox" checked={formExtra.aplicaItbis} onChange={e => setFormExtra({ ...formExtra, aplicaItbis: e.target.checked })} className={estilos.checkboxExtra} />
                                    <span>{tr('Aplica', 'Apply')} {datosEmpresa?.impuesto_porcentaje || 18}% {tr('de impuesto', 'tax')}</span>
                                </label>
                            </div>
                            {formExtra.precioUnitario && (
                                <div className={estilos.resumenExtra}>
                                    <div className={estilos.lineaResumenExtra}><span>{tr('Subtotal:', 'Subtotal:')}</span><span>{formatearMonto((parseFloat(formExtra.precioUnitario) || 0) * (parseFloat(formExtra.cantidad) || 1))}</span></div>
                                    {formExtra.aplicaItbis && <div className={estilos.lineaResumenExtra}><span>{tr('Impuesto', 'Tax')} ({datosEmpresa?.impuesto_porcentaje || 18}%):</span><span>{formatearMonto(((parseFloat(formExtra.precioUnitario) || 0) * (parseFloat(formExtra.cantidad) || 1)) * (datosEmpresa?.impuesto_porcentaje || 18) / 100)}</span></div>}
                                    <div className={estilos.lineaResumenTotalExtra}><span>{tr('Total:', 'Total:')}</span><span>{formatearMonto(calcularTotalExtra())}</span></div>
                                </div>
                            )}
                            <div className={estilos.grupoExtra}>
                                <label className={estilos.etiquetaExtra}>{tr('Notas (Opcional)', 'Notes (Optional)')}</label>
                                <textarea value={formExtra.notas} onChange={e => setFormExtra({ ...formExtra, notas: e.target.value })} className={estilos.textareaExtra} placeholder={tr('Observaciones adicionales...', 'Additional notes...')} rows="2" />
                            </div>
                            <div className={estilos.accionesExtra}>
                                <button type="button" onClick={() => setMostrarModalExtra(false)} className={estilos.botonCancelarExtra}>{tr('Cancelar', 'Cancel')}</button>
                                <button type="submit" className={estilos.botonAgregarExtraModal} disabled={!formExtra.nombre.trim() || !formExtra.precioUnitario || parseFloat(formExtra.precioUnitario) <= 0}>
                                    <ion-icon name="add-circle-outline"></ion-icon>{tr('Agregar Extra', 'Add Extra')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {mostrarModalPagoMixto && (
                <ModalPagoMixto
                    total={totalNum}
                    formatearMonto={formatearMonto}
                    onConfirmar={confirmarPagoMixto}
                    tr={tr}
                    metodosPago={metodosPago}
                    onCerrar={() => {
                        setMostrarModalPagoMixto(false)
                        if (pagosMixtos.length === 0) setMetodoPago('efectivo')
                    }}
                />
            )}
        </div>
    )
}