"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { obtenerDatosVenta, buscarProductos, buscarClientes, crearClienteRapido, crearVenta, obtenerCreditoCliente, obtenerFactorConversionCliente, obtenerClientePorId } from './servidor'
import estilos from './nueva.module.css'
import { formatCurrency } from '@/utils/monedaUtils'

function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debounced
}

export default function NuevaVenta() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [datosEmpresa, setDatosEmpresa] = useState(null)
    const [tiposComprobante, setTiposComprobante] = useState([])
    const [tiposDocumento, setTiposDocumento] = useState([])
    const [unidadesMedida, setUnidadesMedida] = useState([])
    const [factoresConversionCache, setFactoresConversionCache] = useState({}) // Cache de factores de conversión

    const [busquedaProducto, setBusquedaProducto] = useState('')
    const [productos, setProductos] = useState([])
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

    // 🔹 NUEVO: Estado para información del crédito del cliente
    const [infoCredito, setInfoCredito] = useState(null)
    const [cargandoCredito, setCargandoCredito] = useState(false)
    const [clienteTieneCredito, setClienteTieneCredito] = useState(false)
    const clienteCargadoDesdeUrlRef = useRef(false)

    const tiposExtra = [
        { valor: 'ingrediente', nombre: 'Ingrediente Extra' },
        { valor: 'delivery', nombre: 'Delivery' },
        { valor: 'propina', nombre: 'Propina' },
        { valor: 'otro', nombre: 'Otro' }
    ]

    const monedaEmpresa = datosEmpresa?.moneda || 'DOP'
    const localeEmpresa = datosEmpresa?.locale || 'es-DO'
    const simboloEmpresa = datosEmpresa?.simbolo_moneda || ''
    const formatearMonto = (valor) => formatCurrency(valor, {
        currency: monedaEmpresa,
        locale: localeEmpresa,
        symbol: simboloEmpresa
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
        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        cargarDatosIniciales()
    }, [])

    // 🔹 NUEVO: Cargar cliente automáticamente desde parámetro de URL
    useEffect(() => {
        const clienteId = searchParams.get('cliente')
        if (clienteId && !clienteSeleccionado && !cargando && !clienteCargadoDesdeUrlRef.current) {
            clienteCargadoDesdeUrlRef.current = true
            const cargarCliente = async () => {
                try {
                    const resultado = await obtenerClientePorId(clienteId)
                    if (resultado.success) {
                        setClienteSeleccionado(resultado.cliente)
                        setBusquedaCliente(resultado.cliente.nombre_completo)
                        setMostrarDropdownClientes(false)
                        
                        // 🔹 NUEVO: Verificar si el cliente tiene crédito y seleccionar automáticamente
                        const resultadoCredito = await obtenerCreditoCliente(clienteId)
                        if (resultadoCredito.success && resultadoCredito.credito) {
                            // Verificar que el crédito esté activo y tenga saldo disponible
                            const credito = resultadoCredito.credito
                            const tieneCreditoValido = credito.activo && 
                                credito.estado_credito !== 'bloqueado' && 
                                credito.estado_credito !== 'suspendido' &&
                                credito.clasificacion !== 'D' &&
                                parseFloat(credito.saldo_disponible) > 0
                            
                            setClienteTieneCredito(tieneCreditoValido)
                            
                            if (tieneCreditoValido) {
                                // Seleccionar automáticamente el método de pago "crédito"
                                setMetodoPago('credito')
                                setInfoCredito(credito)
                            } else {
                                setClienteTieneCredito(false)
                            }
                        } else {
                            setClienteTieneCredito(false)
                        }
                        
                        // Limpiar el parámetro de la URL después de cargar el cliente
                        const nuevaUrl = new URL(window.location.href)
                        nuevaUrl.searchParams.delete('cliente')
                        window.history.replaceState({}, '', nuevaUrl.pathname + nuevaUrl.search)
                    } else {
                        console.warn('No se pudo cargar el cliente:', resultado.mensaje)
                    }
                } catch (error) {
                    console.error('Error al cargar cliente desde URL:', error)
                }
            }
            cargarCliente()
        }
    }, [searchParams, cargando, clienteSeleccionado])

    useEffect(() => {
        const manejarClickFuera = (e) => {
            if (!e.target.closest(`.${estilos.busquedaProductoContainer}`)) {
                setMostrarDropdownProductos(false)
            }
            if (!e.target.closest(`.${estilos.busquedaClienteContainer}`)) {
                setMostrarDropdownClientes(false)
            }
        }
        document.addEventListener('click', manejarClickFuera)
        return () => document.removeEventListener('click', manejarClickFuera)
    }, [])

    // 🔹 NUEVO: Verificar crédito del cliente cuando se selecciona un cliente
    useEffect(() => {
        if (clienteSeleccionado) {
            const verificarCredito = async () => {
                try {
                    const resultado = await obtenerCreditoCliente(clienteSeleccionado.id)
                    if (resultado.success && resultado.credito) {
                        const credito = resultado.credito
                        const tieneCreditoValido = credito.activo && 
                            credito.estado_credito !== 'bloqueado' && 
                            credito.estado_credito !== 'suspendido' &&
                            credito.clasificacion !== 'D' &&
                            parseFloat(credito.saldo_disponible) > 0
                        setClienteTieneCredito(tieneCreditoValido)
                        // Si el método de pago ya es crédito, cargar la info
                        if (metodoPago === 'credito' && tieneCreditoValido) {
                            setInfoCredito(credito)
                        }
                    } else {
                        setClienteTieneCredito(false)
                    }
                } catch (error) {
                    console.error('Error al verificar crédito:', error)
                    setClienteTieneCredito(false)
                }
            }
            verificarCredito()
        } else {
            setClienteTieneCredito(false)
            setInfoCredito(null)
        }
    }, [clienteSeleccionado, metodoPago])

    // 🔹 NUEVO: Cargar información de crédito cuando cambia el método de pago a crédito
    useEffect(() => {
        if (metodoPago === 'credito' && clienteSeleccionado && clienteTieneCredito) {
            cargarInfoCredito(clienteSeleccionado.id)
        } else if (metodoPago !== 'credito') {
            setInfoCredito(null)
        }
    }, [metodoPago, clienteSeleccionado, clienteTieneCredito])

    const cargarDatosIniciales = async () => {
        try {
            const resultado = await obtenerDatosVenta()
            if (resultado.success) {
                setDatosEmpresa(resultado.empresa)
                setTiposComprobante(resultado.tiposComprobante)
                setTiposDocumento(resultado.tiposDocumento)
                setUnidadesMedida(resultado.unidadesMedida || [])
                if (resultado.tiposComprobante.length > 0) {
                    setTipoComprobanteId(resultado.tiposComprobante[0].id)
                }
            } else {
                alert(resultado.mensaje || 'Error al cargar datos')
                router.push('/admin/ventas')
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos iniciales')
            router.push('/admin/ventas')
        } finally {
            setCargando(false)
        }
    }

    // 🔹 NUEVO: Función para cargar información de crédito del cliente
    const cargarInfoCredito = async (clienteId) => {
        setCargandoCredito(true)
        try {
            const resultado = await obtenerCreditoCliente(clienteId)

            if (resultado.success) {
                setInfoCredito(resultado.credito)
            } else {
                setInfoCredito(null)
                // Opcional: Mostrar advertencia si el cliente no tiene crédito
                if (resultado.mensaje === 'Cliente sin crédito configurado') {
                    // console.warn('Cliente sin crédito')
                }
            }
        } catch (error) {
            console.error('Error al cargar crédito:', error)
            setInfoCredito(null)
        } finally {
            setCargandoCredito(false)
        }
    }

    const manejarBusquedaProducto = async (e) => {
        const valor = e.target.value
        setBusquedaProducto(valor)
        if (valor.length >= 2) {
            try {
                const resultado = await buscarProductos(valor)
                if (resultado.success) {
                    setProductos(resultado.productos)
                    setMostrarDropdownProductos(true)
                }
            } catch (error) {
                console.error('Error al buscar productos:', error)
            }
        } else {
            setProductos([])
            setMostrarDropdownProductos(false)
        }
    }

    const agregarProducto = async (producto) => {
        const existe = productosVenta.find(p => p.id === producto.id)
        const unidadDefault = producto.unidad_venta_default_id || producto.unidad_medida_id
        const precioPorUnidad = parseFloat(producto.precio_por_unidad) || parseFloat(producto.precio_venta)
        const cantidadInicial = producto.permite_decimales ? 0.001 : 1
        
        if (existe) {
            const productosActualizados = productosVenta.map(p => p.id === producto.id ? {
                ...p,
                cantidad: parseFloat(p.cantidad) + cantidadInicial,
                cantidadDespachar: parseFloat(p.cantidadDespachar || p.cantidad) + cantidadInicial
            } : p)
            
            // Recalcular subtotal
            const productoActualizado = productosActualizados.find(p => p.id === producto.id)
            if (productoActualizado) {
                const nuevoSubtotal = await calcularSubtotalProducto(productoActualizado)
                setProductosVenta(productosActualizados.map(p => {
                    if (p.id === producto.id) {
                        return {
                            ...p,
                            subtotal_calculado: nuevoSubtotal
                        }
                    }
                    return p
                }))
            } else {
                setProductosVenta(productosActualizados)
            }
        } else {
            const nuevoProducto = {
                ...producto,
                cantidad: cantidadInicial,
                precio_venta_usado: precioPorUnidad,
                precio_por_unidad: precioPorUnidad,
                despacho_parcial: false,
                cantidadDespachar: cantidadInicial,
                aplica_itbis: producto.aplica_itbis !== undefined ? producto.aplica_itbis : true,
                unidad_medida_usada_id: unidadDefault
            }
            
            // Calcular precio y subtotal inicial
            const precioInicial = await calcularPrecioPorUnidad(nuevoProducto)
            const subtotalInicial = await calcularSubtotalProducto({
                ...nuevoProducto,
                precio_venta_usado: precioInicial
            })
            
            nuevoProducto.precio_venta_usado = precioInicial
            nuevoProducto.subtotal_calculado = subtotalInicial
            
            setProductosVenta([...productosVenta, nuevoProducto])
        }
        setBusquedaProducto('')
        setMostrarDropdownProductos(false)
    }

    // RF-004: Función de validación y normalización de cantidad
    const validarYNormalizarCantidad = (valor, permiteDecimales = true) => {
        if (!valor || valor === '') return { valido: false, valor: '', valorNumerico: null }
        
        // RF-004.2: Convertir "," a "." automáticamente
        let valorNormalizado = valor.toString().replace(',', '.')
        
        // RF-004.2: No permitir múltiples puntos decimales
        const partes = valorNormalizado.split('.')
        if (partes.length > 2) {
            // Si hay más de un punto, tomar solo el primero
            valorNormalizado = partes[0] + '.' + partes.slice(1).join('')
        }
        
        // RF-004.2: Bloquear letras y caracteres especiales (solo números y un punto)
        valorNormalizado = valorNormalizado.replace(/[^0-9.]/g, '')
        
        // RF-004.3: Autocompletado - ".5" → "0.5"
        if (valorNormalizado.startsWith('.')) {
            valorNormalizado = '0' + valorNormalizado
        }
        
        // RF-004.3: Autocompletado - "2." → mantener "2." (permitir escritura temporal)
        // Permitir valores temporales como ".", "0.", "2." mientras se escribe
        
        // Validar si es un número válido
        const valorNumerico = parseFloat(valorNormalizado)
        const esValido = !isNaN(valorNumerico) && valorNumerico > 0
        
        // RF-004.1: Limitar a 3 decimales máximo
        if (valorNormalizado.includes('.')) {
            const partesDecimales = valorNormalizado.split('.')
            if (partesDecimales[1] && partesDecimales[1].length > 3) {
                valorNormalizado = partesDecimales[0] + '.' + partesDecimales[1].substring(0, 3)
            }
        }
        
        // Permitir valores temporales durante escritura (".", "0.", "2.", etc.)
        const esValorTemporal = valorNormalizado === '.' || 
                                valorNormalizado.endsWith('.') || 
                                (valorNormalizado === '0' && permiteDecimales)
        
        return {
            valido: esValido || esValorTemporal,
            valor: valorNormalizado,
            valorNumerico: esValido ? valorNumerico : null,
            esTemporal: esValorTemporal
        }
    }

    const actualizarCantidad = async (productoId, nuevaCantidad) => {
        const producto = productosVenta.find(p => p.id === productoId)
        if (!producto) return
        
        const permiteDecimales = producto.permite_decimales !== false
        const validacion = validarYNormalizarCantidad(nuevaCantidad, permiteDecimales)
        
        // RF-004: Permitir valores temporales durante escritura sin eliminar producto
        if (!validacion.valido && !validacion.esTemporal) {
            // Solo eliminar si es un valor inválido y no es temporal
            if (validacion.valor === '' || validacion.valor === '0') {
                eliminarProducto(productoId)
                return
            }
            // Si hay caracteres inválidos pero el valor normalizado está vacío, no hacer nada
            return
        }
        
        // Si es un valor temporal (ej: "2.", "0."), guardar el string temporalmente
        if (validacion.esTemporal) {
            const productosActualizados = productosVenta.map(p => {
                if (p.id === productoId) {
                    return {
                        ...p,
                        cantidad: validacion.valor, // Guardar string temporal
                        cantidadTemporal: true // Marcar como temporal
                    }
                }
                return p
            })
            setProductosVenta(productosActualizados)
            return
        }
        
        // Validar stock solo cuando tenemos un valor numérico válido
        if (validacion.valorNumerico && validacion.valorNumerico > parseFloat(producto.stock)) {
            alert(`Stock disponible: ${producto.stock} ${producto.unidad_medida_nombre || ''}`)
            // Restaurar cantidad anterior válida
            const cantidadAnterior = parseFloat(producto.cantidad) || (permiteDecimales ? 0.001 : 1)
            const productosRestaurados = productosVenta.map(p => {
                if (p.id === productoId) {
                    return {
                        ...p,
                        cantidad: cantidadAnterior,
                        cantidadTemporal: false
                    }
                }
                return p
            })
            setProductosVenta(productosRestaurados)
            return
        }
        
        // RF-004.1: Validar que sea > 0 cuando es un valor final
        if (validacion.valorNumerico && validacion.valorNumerico <= 0) {
            eliminarProducto(productoId)
            return
        }
        
        const productosActualizados = productosVenta.map(p => {
            if (p.id === productoId) {
                const cantidadFinal = validacion.valorNumerico || parseFloat(validacion.valor) || (permiteDecimales ? 0.001 : 1)
                const nuevaCantidadDespachar = p.despacho_parcial ? p.cantidadDespachar : cantidadFinal
                return {
                    ...p,
                    cantidad: cantidadFinal,
                    cantidadTemporal: false,
                    cantidadDespachar: nuevaCantidadDespachar > cantidadFinal ? cantidadFinal : nuevaCantidadDespachar
                }
            }
            return p
        })

        setProductosVenta(productosActualizados)

        // Recalcular subtotal solo si tenemos un valor numérico válido
        if (validacion.valorNumerico) {
            const productoActualizado = productosActualizados.find(p => p.id === productoId)
            if (productoActualizado) {
                const nuevoSubtotal = await calcularSubtotalProducto(productoActualizado)
                setProductosVenta(productosActualizados.map(p => {
                    if (p.id === productoId) {
                        return {
                            ...p,
                            subtotal_calculado: nuevoSubtotal
                        }
                    }
                    return p
                }))
            }
        }
    }

    /**
     * Obtiene factor de conversión (usa cache si está disponible)
     */
    const obtenerFactor = async (unidadOrigenId, unidadDestinoId) => {
        const cacheKey = `${unidadOrigenId}_${unidadDestinoId}`
        
        // Si está en cache, retornarlo
        if (factoresConversionCache[cacheKey] !== undefined) {
            return factoresConversionCache[cacheKey]
        }

        // Si son la misma unidad, factor = 1
        if (parseInt(unidadOrigenId) === parseInt(unidadDestinoId)) {
            return 1.0
        }

        // Obtener factor del servidor
        const resultado = await obtenerFactorConversionCliente(unidadOrigenId, unidadDestinoId)
        
        if (resultado.success && resultado.factor !== null) {
            // Guardar en cache
            setFactoresConversionCache(prev => ({
                ...prev,
                [cacheKey]: resultado.factor
            }))
            return resultado.factor
        }

        return null
    }

    /**
     * Calcula el precio por unidad según la unidad seleccionada
     * Si la unidad seleccionada es diferente a la base, convierte el precio
     */
    const calcularPrecioPorUnidad = async (producto) => {
        const unidadBaseId = producto.unidad_medida_id
        const unidadSeleccionadaId = producto.unidad_medida_usada_id || unidadBaseId
        const precioBase = parseFloat(producto.precio_por_unidad) || parseFloat(producto.precio_venta) || 0

        // Si es la unidad base, retornar precio base
        if (parseInt(unidadSeleccionadaId) === parseInt(unidadBaseId)) {
            return precioBase
        }

        // Obtener factor de conversión (de unidad seleccionada a unidad base)
        // Ejemplo: Si vendemos en KG y la base es LB
        // factor = KG -> LB = 2.20462
        // precio en KG = precio_base * factor = 60 * 2.20462 = 132.28/kg
        const factor = await obtenerFactor(unidadSeleccionadaId, unidadBaseId)
        
        if (factor === null) {
            return precioBase // Si no hay conversión, usar precio base
        }

        // Precio convertido = precio_base * factor
        // Esto significa: si vendes 1 unidad de la seleccionada, equivale a factor unidades base
        return precioBase * factor
    }

    /**
     * Calcula el subtotal de un producto considerando conversión
     */
    const calcularSubtotalProducto = async (producto) => {
        // RF-004: Si la cantidad es temporal, usar el último valor numérico válido o 0
        let cantidad = parseFloat(producto.cantidad) || 0
        
        // Si es un valor temporal (string que termina en punto), usar 0 para no calcular subtotal incorrecto
        if (producto.cantidadTemporal && typeof producto.cantidad === 'string' && producto.cantidad.endsWith('.')) {
            cantidad = 0
        }
        
        const precioPorUnidad = await calcularPrecioPorUnidad(producto)
        return cantidad * precioPorUnidad
    }

    const actualizarUnidad = async (productoId, unidadId) => {
        const producto = productosVenta.find(p => p.id === productoId)
        if (!producto) return

        // Actualizar unidad
        const productosActualizados = productosVenta.map(p => {
            if (p.id === productoId) {
                return {
                    ...p,
                    unidad_medida_usada_id: parseInt(unidadId)
                }
            }
            return p
        })

        setProductosVenta(productosActualizados)

        // Recalcular precio y subtotal
        const productoActualizado = productosActualizados.find(p => p.id === productoId)
        const nuevoPrecio = await calcularPrecioPorUnidad(productoActualizado)
        const nuevoSubtotal = await calcularSubtotalProducto(productoActualizado)

        // Actualizar con precio y subtotal calculados
        setProductosVenta(productosActualizados.map(p => {
            if (p.id === productoId) {
                return {
                    ...p,
                    precio_venta_usado: nuevoPrecio,
                    subtotal_calculado: nuevoSubtotal
                }
            }
            return p
        }))
    }

    const actualizarPrecio = (productoId, nuevoPrecio) => {
        setProductosVenta(productosVenta.map(p => p.id === productoId ? {
            ...p,
            precio_venta_usado: parseFloat(nuevoPrecio) || 0
        } : p))
    }

    const toggleDespachoParcial = (productoId) => {
        setProductosVenta(productosVenta.map(p => {
            if (p.id === productoId) {
                const nuevoEstado = !p.despacho_parcial
                return {
                    ...p,
                    despacho_parcial: nuevoEstado,
                    cantidadDespachar: nuevoEstado ? Math.min(p.cantidad, p.cantidadDespachar) : p.cantidad
                }
            }
            return p
        }))
    }

    const toggleAplicaItbis = (productoId) => {
        setProductosVenta(productosVenta.map(p => p.id === productoId ? { ...p, aplica_itbis: !p.aplica_itbis } : p))
    }

    const actualizarCantidadDespachar = (productoId, nuevaCantidad) => {
        const producto = productosVenta.find(p => p.id === productoId)
        if (!producto) return
        
        const permiteDecimales = producto.permite_decimales !== false
        const validacion = validarYNormalizarCantidad(nuevaCantidad, permiteDecimales)
        
        // RF-004: Permitir valores temporales durante escritura
        if (!validacion.valido && !validacion.esTemporal) {
            return // No actualizar si es inválido y no es temporal
        }
        
        const productosActualizados = productosVenta.map(p => {
            if (p.id === productoId) {
                let cantidadValida
                if (validacion.esTemporal) {
                    // Mantener valor temporal
                    cantidadValida = validacion.valor
                } else {
                    // Validar rango: mínimo 0.001 (si permite decimales) o 1, máximo la cantidad del producto
                    const cantidadMinima = permiteDecimales ? 0.001 : 1
                    const cantidadMaxima = parseFloat(p.cantidad) || 0
                    cantidadValida = validacion.valorNumerico 
                        ? Math.min(Math.max(cantidadMinima, validacion.valorNumerico), cantidadMaxima)
                        : cantidadMinima
                }
                return { 
                    ...p, 
                    cantidadDespachar: cantidadValida,
                    cantidadDespacharTemporal: validacion.esTemporal || false
                }
            }
            return p
        })
        setProductosVenta(productosActualizados)
    }

    const eliminarProducto = (productoId) => {
        setProductosVenta(productosVenta.filter(p => p.id !== productoId))
    }

    useEffect(() => {
        if (clienteSeleccionado) {
            setClientes([])
            setMostrarDropdownClientes(false)
            return
        }

        if (inputClienteFocused && busquedaClienteDebounced.trim() === '') {
            buscarClientes('').then(res => {
                if (res.success) {
                    setClientes(res.clientes)
                    setMostrarDropdownClientes(true)
                }
            })
            return
        }

        if (busquedaClienteDebounced.trim().length >= 2) {
            buscarClientes(busquedaClienteDebounced).then(res => {
                if (res.success) {
                    setClientes(res.clientes)
                    setMostrarDropdownClientes(true)
                }
            })
            return
        }

        setClientes([])
        setMostrarDropdownClientes(false)

    }, [busquedaClienteDebounced, clienteSeleccionado, inputClienteFocused])

    // Recalcular precios cuando se cargan las unidades de medida por primera vez
    useEffect(() => {
        if (unidadesMedida.length === 0 || productosVenta.length === 0) return

        // Solo recalcular si los productos no tienen precio_venta_usado calculado aún
        const necesitaRecalculo = productosVenta.some(p => p.precio_venta_usado === undefined || p.subtotal_calculado === undefined)
        if (!necesitaRecalculo) return

        const recalcularPrecios = async () => {
            const productosActualizados = await Promise.all(
                productosVenta.map(async (producto) => {
                    // Solo recalcular si no tiene precio calculado
                    if (producto.precio_venta_usado !== undefined && producto.subtotal_calculado !== undefined) {
                        return producto
                    }
                    
                    const precioCalculado = await calcularPrecioPorUnidad(producto)
                    const subtotalCalculado = await calcularSubtotalProducto({
                        ...producto,
                        precio_venta_usado: precioCalculado
                    })
                    return {
                        ...producto,
                        precio_venta_usado: precioCalculado,
                        subtotal_calculado: subtotalCalculado
                    }
                })
            )

            setProductosVenta(productosActualizados)
        }

        recalcularPrecios()
    }, [unidadesMedida.length]) // Solo cuando se cargan las unidades inicialmente

    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente)
        setBusquedaCliente(cliente.nombre_completo)
        setMostrarDropdownClientes(false)
    }

    const limpiarCliente = () => {
        setClienteSeleccionado(null)
        setBusquedaCliente('')
        setInfoCredito(null)
        setClienteTieneCredito(false)
        setInputClienteFocused(false) // 🔴 IMPORTANTE
        // Si el método de pago es crédito, cambiar a efectivo
        if (metodoPago === 'credito') {
            setMetodoPago('efectivo')
        }
    }

    const abrirModalClienteRapido = () => {
        setNombreClienteRapido('')
        setMostrarModalCliente(true)
    }

    const crearClienteRapidoHandler = async (e) => {
        e.preventDefault()
        if (!nombreClienteRapido.trim()) {
            alert('Ingresa el nombre del cliente')
            return
        }
        setProcesando(true)
        try {
            const resultado = await crearClienteRapido(nombreClienteRapido.trim())
            if (resultado.success) {
                setClienteSeleccionado(resultado.cliente)
                setBusquedaCliente(resultado.cliente.nombre)
                setMostrarModalCliente(false)
            } else {
                alert(resultado.mensaje || 'Error al crear cliente')
            }
        } catch (error) {
            console.error('Error al crear cliente:', error)
            alert('Error al crear cliente')
        } finally {
            setProcesando(false)
        }
    }

    const abrirModalExtra = () => {
        setFormExtra({
            nombre: '', tipo: 'otro', cantidad: 1, precioUnitario: '', aplicaItbis: true, notas: ''
        })
        setMostrarModalExtra(true)
    }

    const cerrarModalExtra = () => {
        setMostrarModalExtra(false)
    }

    const calcularTotalExtra = () => {
        const precio = parseFloat(formExtra.precioUnitario) || 0
        const cant = parseFloat(formExtra.cantidad) || 1
        const base = precio * cant
        const impuesto = formExtra.aplicaItbis ? (base * parseFloat(datosEmpresa?.impuesto_porcentaje || 18)) / 100 : 0
        return base + impuesto
    }

    const agregarProductoExtra = (e) => {
        e.preventDefault()
        if (!formExtra.nombre.trim()) {
            alert('Ingresa el nombre del producto extra')
            return
        }
        const precio = parseFloat(formExtra.precioUnitario) || 0
        if (precio <= 0) {
            alert('El precio debe ser mayor a cero')
            return
        }
        const nuevoExtra = {
            id: Date.now(),
            nombre: formExtra.nombre.trim(),
            tipo: formExtra.tipo,
            cantidad: parseFloat(formExtra.cantidad) || 1,
            precio_unitario: precio,
            aplica_itbis: formExtra.aplicaItbis,
            notas: formExtra.notas.trim() || null
        }
        setProductosExtra([...productosExtra, nuevoExtra])
        cerrarModalExtra()
    }

    const eliminarProductoExtra = (id) => {
        setProductosExtra(productosExtra.filter(e => e.id !== id))
    }

    const calcularTotales = () => {
        let subtotal = 0
        let descuento = parseFloat(descuentoGlobal) || 0

        productosVenta.forEach(producto => {
            // Usar subtotal_calculado si existe (con conversión), sino calcular normalmente
            if (producto.subtotal_calculado !== undefined) {
                subtotal += parseFloat(producto.subtotal_calculado) || 0
            } else {
                // Usar precio_por_unidad si está disponible, sino precio_venta_usado
                const precio = producto.precio_por_unidad || producto.precio_venta_usado || 0
                const cantidad = parseFloat(producto.cantidad) || 0
                subtotal += precio * cantidad
            }
        })

        let subtotalExtras = 0
        productosExtra.forEach(extra => {
            subtotalExtras += extra.precio_unitario * extra.cantidad
        })

        let itbisProductos = 0
        productosVenta.forEach(producto => {
            if (producto.aplica_itbis) {
                // Usar subtotal_calculado si existe (con conversión), sino calcular normalmente
                const subtotalProd = producto.subtotal_calculado !== undefined 
                    ? producto.subtotal_calculado 
                    : (producto.precio_venta_usado || producto.precio_por_unidad || 0) * producto.cantidad
                itbisProductos += (subtotalProd * parseFloat(datosEmpresa?.impuesto_porcentaje || 18)) / 100
            }
        })

        let itbisExtras = 0
        productosExtra.forEach(extra => {
            if (extra.aplica_itbis) {
                const subtotalExtra = extra.precio_unitario * extra.cantidad
                itbisExtras += (subtotalExtra * parseFloat(datosEmpresa?.impuesto_porcentaje || 18)) / 100
            }
        })

        const itbis = itbisProductos + itbisExtras
        const subtotalConImpuesto = subtotal + subtotalExtras + itbis
        const total = subtotalConImpuesto - descuento
        const montoGravado = subtotal + subtotalExtras

        return {
            subtotal: subtotal.toFixed(2),
            subtotalExtras: subtotalExtras.toFixed(2),
            descuento: descuento.toFixed(2),
            montoGravado: montoGravado.toFixed(2),
            itbis: itbis.toFixed(2),
            total: total.toFixed(2)
        }
    }

    const validarVenta = () => {
        if (productosVenta.length === 0 && productosExtra.length === 0) {
            alert('Agrega al menos un producto o extra a la venta')
            return false
        }
        if (!tipoComprobanteId) {
            alert('Selecciona un tipo de comprobante')
            return false
        }

        const tipoComprobante = tiposComprobante.find(t => t.id === parseInt(tipoComprobanteId))

        // 🔹 NUEVO: Validar que si es crédito, debe tener cliente
        if (metodoPago === 'credito') {
            if (!clienteSeleccionado) {
                alert('La venta a crédito requiere seleccionar un cliente')
                return false
            }

            // Validar que el cliente tenga crédito configurado
            if (!infoCredito) {
                alert('El cliente seleccionado no tiene configuración de crédito')
                return false
            }

            // Validar saldo disponible
            const total = parseFloat(calcularTotales().total)
            if (total > parseFloat(infoCredito.saldo_disponible)) {
                alert(`El monto de la venta (${formatearMonto(total)}) excede el saldo disponible del cliente (${formatearMonto(infoCredito.saldo_disponible)})`)
                return false
            }
        }

        if (tipoComprobante?.requiere_rnc && !clienteSeleccionado) {
            alert('Este tipo de comprobante requiere seleccionar un cliente')
            return false
        }

        for (const producto of productosVenta) {
            if (producto.despacho_parcial && producto.cantidadDespachar < 1) {
                alert(`El producto "${producto.nombre}" debe despachar al menos 1 unidad`)
                return false
            }
            if (producto.despacho_parcial && producto.cantidadDespachar > producto.cantidad) {
                alert(`El producto "${producto.nombre}" no puede despachar más de lo comprado`)
                return false
            }
        }

        // 🔹 NUEVO: Para crédito NO validar efectivo recibido
        if (metodoPago !== 'credito' && metodoPago === 'efectivo') {
            const recibido = parseFloat(efectivoRecibido) || 0
            const total = parseFloat(calcularTotales().total)
            if (recibido < total) {
                alert('El efectivo recibido debe ser mayor o igual al total')
                return false
            }
        }

        return true
    }

    const procesarVenta = async () => {
        if (!validarVenta()) return
        setProcesando(true)
        try {
            const totales = calcularTotales()
            let efectivoRecibidoFinal = null
            let cambioFinal = null

            // 🔹 NUEVO: Para crédito, no se envía efectivo recibido ni cambio
            if (metodoPago !== 'credito') {
                if (efectivoRecibido) {
                    const recibido = parseFloat(efectivoRecibido)
                    efectivoRecibidoFinal = recibido
                    if (metodoPago === 'efectivo') {
                        const total = parseFloat(totales.total)
                        cambioFinal = recibido - total
                    }
                }
            }

            const hayDespachoParcial = productosVenta.some(p => p.despacho_parcial)

            const datosVenta = {
                tipo_comprobante_id: parseInt(tipoComprobanteId),
                cliente_id: clienteSeleccionado?.id || null,
                productos: productosVenta.map(p => ({
                    producto_id: p.id,
                    cantidad: parseFloat(p.cantidad),
                    unidad_medida_id: p.unidad_medida_usada_id || p.unidad_medida_id,
                    precio_unitario: p.precio_por_unidad || p.precio_venta || 0, // Siempre enviar precio base, el backend hace la conversión
                    despacho_parcial: p.despacho_parcial,
                    cantidad_despachar: p.despacho_parcial ? parseFloat(p.cantidadDespachar) : parseFloat(p.cantidad)
                })),
                extras: productosExtra.map(e => ({
                    nombre: e.nombre,
                    tipo: e.tipo,
                    cantidad: e.cantidad,
                    precio_unitario: e.precio_unitario,
                    aplica_itbis: e.aplica_itbis,
                    notas: e.notas
                })),
                subtotal: parseFloat(totales.subtotal) + parseFloat(totales.subtotalExtras),
                descuento: parseFloat(totales.descuento),
                monto_gravado: parseFloat(totales.montoGravado),
                itbis: parseFloat(totales.itbis),
                total: parseFloat(totales.total),
                metodo_pago: metodoPago,
                efectivo_recibido: efectivoRecibidoFinal,
                cambio: cambioFinal,
                notas: null,
                tipo_entrega: hayDespachoParcial ? 'parcial' : 'completa'
            }

            const resultado = await crearVenta(datosVenta)

            if (resultado.success) {
                router.push(`/admin/ventas/imprimir/${resultado.venta.id}`)
            } else {
                alert(resultado.mensaje || 'Error al crear la venta')
            }
        } catch (error) {
            console.error('Error al procesar venta:', error)
            alert('Error al procesar la venta')
        } finally {
            setProcesando(false)
        }
    }

    const totales = calcularTotales()
    const cambio = metodoPago === 'efectivo' && efectivoRecibido ? (parseFloat(efectivoRecibido) - parseFloat(totales.total)).toFixed(2) : '0.00'

    const getLabelMontoRecibido = () => {
        const labels = {
            efectivo: 'Efectivo Recibido',
            tarjeta_debito: 'Monto T. Débito',
            tarjeta_credito: 'Monto T. Crédito',
            transferencia: 'Monto Transferencia',
            cheque: 'Monto Cheque',
            credito: 'Monto a Crédito'
        }
        return labels[metodoPago] || 'Monto Recibido'
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando datos...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedorOptimizado} ${estilos[tema]}`}>
            {/* HEADER STICKY */}
            <div className={`${estilos.headerSticky} ${estilos[tema]}`}>
                <div className={estilos.headerLeft}>
                    <div style={{fontSize: '16px', fontWeight: 600, color: 'var(--primary)', margin: 0, padding: 0}}>Punto de Venta</div>
                    <div className={estilos.infoHeader}>
                        <span className={estilos.labelTotal}>Total:</span>
                        <strong className={estilos.montoTotal}>{formatearMonto(totales.total)}</strong>
                        {productosVenta.length > 0 && (
                            <span className={estilos.cantidadItems}>
                                ({productosVenta.length} {productosVenta.length === 1 ? 'producto' : 'productos'})
                            </span>
                        )}
                    </div>
                </div>

                <div className={estilos.headerActions}>
                    <button
                        onClick={() => router.push('/admin/ventas')}
                        className={estilos.btnCancelarHeader}
                        disabled={procesando}
                    >
                        <ion-icon name="close-outline"></ion-icon>
                        <span>Cancelar</span>
                    </button>

                    <button
                        onClick={procesarVenta}
                        disabled={procesando || (productosVenta.length === 0 && productosExtra.length === 0)}
                        className={estilos.btnProcesarHeader}
                    >
                        {procesando ? (
                            <>
                                <ion-icon name="hourglass-outline" className={estilos.iconRotate}></ion-icon>
                                <span>Procesando...</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>Procesar Venta</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className={estilos.layoutPrincipal}>
                {/* COLUMNA IZQUIERDA */}
                <div className={estilos.colProductos}>
                    {/* Barra de configuración vertical */}
                    <div className={`${estilos.barraConfig} ${estilos[tema]}`}>
                        {/* Comprobante */}
                        <div className={estilos.grupoConfig}>
                            <label className={estilos.labelConfig}>
                                <ion-icon name="document-text-outline"></ion-icon>
                                <span>Comprobante</span>
                            </label>
                            <select
                                value={tipoComprobanteId}
                                onChange={(e) => setTipoComprobanteId(e.target.value)}
                                className={estilos.selectConfig}
                            >
                                {tiposComprobante.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.codigo} - {tipo.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Cliente */}
                        <div className={estilos.grupoConfig}>
                            <label className={estilos.labelConfig}>
                                <ion-icon name="person-outline"></ion-icon>
                                <span>Cliente</span>
                            </label>
                            <div className={estilos.clienteControles}>
                                <div className={estilos.busquedaClienteContainer}>
                                    <div className={estilos.busquedaCliente}>
                                        <ion-icon name="search-outline" />
                                        <input
                                            type="text"
                                            placeholder="Buscar cliente..."
                                            value={busquedaCliente}
                                            className={estilos.inputBusquedaCliente}
                                            onFocus={() => setInputClienteFocused(true)}
                                            onChange={(e) => {
                                                if (clienteSeleccionado) return
                                                setBusquedaCliente(e.target.value)
                                            }}
                                        />
                                        {clienteSeleccionado && (
                                            <button
                                                type="button"
                                                className={estilos.btnLimpiarCliente}
                                                title="Cambiar cliente"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    limpiarCliente()
                                                }}
                                            >
                                                <ion-icon name="close-circle" />
                                            </button>
                                        )}
                                    </div>
                                    {mostrarDropdownClientes && clientes.length > 0 && !clienteSeleccionado && (
                                        <div className={`${estilos.dropdownClientes} ${estilos[tema]}`}>
                                            {clientes.map(cliente => (
                                                <div
                                                    key={cliente.id}
                                                    className={estilos.dropdownItemCliente}
                                                    onClick={() => seleccionarCliente(cliente)}
                                                >
                                                    <div className={estilos.clienteInfo}>
                                                        <span className={estilos.clienteNombre}>{cliente.nombre_completo}</span>
                                                        <span className={estilos.clienteDoc}>{cliente.tipo_documento}: {cliente.numero_documento}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className={estilos.btnClienteRapido}
                                    onClick={abrirModalClienteRapido}
                                >
                                    <ion-icon name="person-add-outline" />
                                    <span>Rápido</span>
                                </button>
                            </div>
                        </div>
                        {/* Métodos de Pago */}
                        <div className={estilos.grupoConfig}>
                            <label className={estilos.labelConfig}>
                                <ion-icon name="wallet-outline"></ion-icon>
                                <span>Método de Pago</span>
                            </label>
                            <div className={estilos.metodosPagoGrid}>
                                {/* Botones de métodos de pago */}
                                <button type="button" className={`${estilos.metodoPagoBtn} ${estilos.efectivo} ${metodoPago === 'efectivo' ? estilos.activo : ''}`} onClick={() => setMetodoPago('efectivo')} title="Efectivo">
                                    <ion-icon name="cash-outline"></ion-icon>
                                    <span>Efectivo</span>
                                </button>
                                <button type="button" className={`${estilos.metodoPagoBtn} ${estilos.debito} ${metodoPago === 'tarjeta_debito' ? estilos.activo : ''}`} onClick={() => setMetodoPago('tarjeta_debito')} title="Tarjeta de Débito">
                                    <ion-icon name="card-outline"></ion-icon>
                                    <span>Débito</span>
                                </button>
                                <button type="button" className={`${estilos.metodoPagoBtn} ${estilos.tarjetaCredito} ${metodoPago === 'tarjeta_credito' ? estilos.activo : ''}`} onClick={() => setMetodoPago('tarjeta_credito')} title="Tarjeta de Crédito">
                                    <ion-icon name="card-outline"></ion-icon>
                                    <span>T. Crédito</span>
                                </button>
                                <button type="button" className={`${estilos.metodoPagoBtn} ${estilos.transferencia} ${metodoPago === 'transferencia' ? estilos.activo : ''}`} onClick={() => setMetodoPago('transferencia')} title="Transferencia">
                                    <ion-icon name="swap-horizontal-outline"></ion-icon>
                                    <span>Transfer.</span>
                                </button>
                                <button type="button" className={`${estilos.metodoPagoBtn} ${estilos.cheque} ${metodoPago === 'cheque' ? estilos.activo : ''}`} onClick={() => setMetodoPago('cheque')} title="Cheque">
                                    <ion-icon name="receipt-outline"></ion-icon>
                                    <span>Cheque</span>
                                </button>
                                <button type="button" className={`${estilos.metodoPagoBtn} ${estilos.credito} ${metodoPago === 'credito' ? estilos.activo : ''}`} onClick={() => {
                                    if (!clienteSeleccionado) {
                                        alert('Debes seleccionar un cliente para realizar una venta a crédito')
                                        return
                                    }
                                    if (!clienteTieneCredito) {
                                        alert('El cliente seleccionado no tiene crédito disponible')
                                        return
                                    }
                                    setMetodoPago('credito')
                                }} disabled={!clienteSeleccionado || !clienteTieneCredito} title={!clienteSeleccionado 
                                    ? "Selecciona un cliente primero" 
                                    : !clienteTieneCredito 
                                    ? "El cliente no tiene crédito disponible" 
                                    : "Venta a Crédito"}>
                                    <ion-icon name="time-outline"></ion-icon>
                                    <span>Crédito</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Alerta de crédito */}
                    {metodoPago === 'credito' && (
                        <div className={`${estilos.alertaCredito} ${estilos[tema]}`}>
                            {!clienteSeleccionado ? (
                                <div className={estilos.alertaWarning}>
                                    <ion-icon name="warning-outline"></ion-icon>
                                    <span>Debes seleccionar un cliente para realizar una venta a crédito</span>
                                </div>
                            ) : cargandoCredito ? (
                                <div className={estilos.alertaInfo}>
                                    <ion-icon name="hourglass-outline" className={estilos.iconRotate}></ion-icon>
                                    <span>Verificando crédito del cliente...</span>
                                </div>
                            ) : !infoCredito ? (
                                <div className={estilos.alertaDanger}>
                                    <ion-icon name="close-circle-outline"></ion-icon>
                                    <span>El cliente no tiene configuración de crédito. No se puede procesar la venta.</span>
                                </div>
                            ) : infoCredito && parseFloat(infoCredito.saldo_disponible) <= 0 ? (
                                <div className={estilos.alertaDanger}>
                                    <ion-icon name="close-circle-outline"></ion-icon>
                                    <span>El cliente no tiene saldo disponible de crédito. Saldo disponible: {formatearMonto(infoCredito.saldo_disponible)}</span>
                                </div>
                            ) : infoCredito && parseFloat(infoCredito.saldo_disponible) > 0 ? (
                                <div className={estilos.alertaSuccess}>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                        <span><strong>Crédito disponible:</strong> {formatearMonto(infoCredito.saldo_disponible)}</span>
                                        <span style={{ fontSize: '0.9em', opacity: 0.8 }}>
                                            Límite: {formatearMonto(infoCredito.limite_credito || 0)} | 
                                            Utilizado: {formatearMonto(infoCredito.saldo_utilizado || 0)} | 
                                            Clasificación: {infoCredito.clasificacion || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Buscador de productos */}
                    <div className={`${estilos.seccionBusqueda} ${estilos[tema]}`}>
                        <div className={estilos.busquedaProductoContainer}>
                            <div className={estilos.busquedaProducto}>
                                <ion-icon name="search-outline"></ion-icon>
                                <input
                                    type="text"
                                    placeholder="Buscar producto por nombre, código o SKU..."
                                    value={busquedaProducto}
                                    onChange={manejarBusquedaProducto}
                                    className={estilos.inputBusquedaProducto}
                                />
                            </div>
                            {mostrarDropdownProductos && productos.length > 0 && (
                                <div className={`${estilos.dropdownProductos} ${estilos[tema]}`}>
                                    {productos.map(producto => (
                                        <div
                                            key={producto.id}
                                            className={estilos.dropdownItem}
                                            onClick={() => agregarProducto(producto)}
                                        >
                                            <div className={estilos.productoInfo}>
                                                <span className={estilos.productoNombre}>{producto.nombre}</span>
                                                <span className={estilos.productoCodigo}>{producto.codigo_barras || producto.sku}</span>
                                            </div>
                                            <div className={estilos.productoDatos}>
                                                <span className={estilos.productoStock}>Stock: {producto.stock}</span>
                                                <span className={estilos.productoPrecio}>{formatearMonto(producto.precio_venta)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabla de productos */}
                    <div className={`${estilos.tablaProductos} ${estilos[tema]}`}>
                        {productosVenta.length === 0 ? (
                            <div className={estilos.estadoVacio}>
                                <ion-icon name="cart-outline"></ion-icon>
                                <p>No hay productos agregados</p>
                                <span>Busca y agrega productos para iniciar la venta</span>
                            </div>
                        ) : (
                            <>
                                <div className={estilos.tablaHeader}>
                                    <span>Producto</span>
                                    <span>Cantidad / Unidad</span>
                                    <span>Precio / Unidad</span>
                                    <span>Subtotal</span>
                                    <span></span>
                                </div>
                                <div className={estilos.tablaBody}>
                                    {productosVenta.map(producto => (
                                        <div key={producto.id}>
                                            <div className={`${estilos.filaProducto} ${estilos[tema]}`}>
                                                <div className={estilos.infoProductoFila}>
                                                    <span className={estilos.nombreProductoFila}>{producto.nombre}</span>
                                                    <span className={estilos.detalleProductoFila}>
                                                        Stock: {producto.stock} | {producto.codigo_barras || producto.sku}
                                                    </span>
                                                </div>

                                                <div className={estilos.controlCantidadCompacto}>
                                                    <button
                                                        onClick={() => {
                                                            const cantidadActual = parseFloat(producto.cantidad) || (producto.permite_decimales ? 0.001 : 1)
                                                            const incremento = producto.permite_decimales ? 0.001 : 1
                                                            const nuevaCantidad = Math.max(0.001, cantidadActual - incremento)
                                                            actualizarCantidad(producto.id, nuevaCantidad.toString())
                                                        }}
                                                        className={estilos.btnMenos}
                                                        type="button"
                                                        disabled={parseFloat(producto.cantidad || 0) <= (producto.permite_decimales ? 0.001 : 1)}
                                                    >
                                                        <ion-icon name="remove"></ion-icon>
                                                    </button>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={producto.cantidad || ''}
                                                        onChange={(e) => {
                                                            // RF-004.2: Validación en tiempo real
                                                            const valor = e.target.value
                                                            actualizarCantidad(producto.id, valor)
                                                        }}
                                                        onBlur={(e) => {
                                                            // RF-004.3: Autocompletado al perder foco
                                                            const productoActual = productosVenta.find(p => p.id === producto.id)
                                                            if (!productoActual) return
                                                            
                                                            const validacion = validarYNormalizarCantidad(e.target.value, productoActual.permite_decimales)
                                                            
                                                            // Si termina en punto, completar con 0
                                                            if (validacion.valor.endsWith('.')) {
                                                                const valorCompletado = validacion.valor + '0'
                                                                actualizarCantidad(producto.id, valorCompletado)
                                                            } else if (!validacion.valido && validacion.valor === '') {
                                                                // Si está vacío, restaurar cantidad mínima
                                                                const cantidadMinima = productoActual.permite_decimales ? 0.001 : 1
                                                                actualizarCantidad(producto.id, cantidadMinima.toString())
                                                            } else if (validacion.valorNumerico) {
                                                                // Asegurar que tenga el formato correcto
                                                                actualizarCantidad(producto.id, validacion.valorNumerico.toString())
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            // RF-004.2: Prevenir múltiples puntos
                                                            if (e.key === '.' || e.key === ',') {
                                                                const valorActual = e.target.value
                                                                if (valorActual.includes('.') || valorActual.includes(',')) {
                                                                    e.preventDefault()
                                                                    return
                                                                }
                                                            }
                                                            // RF-004.2: Bloquear letras (permitir números, punto, coma, backspace, delete, arrow keys)
                                                            if (!/[0-9.,]/.test(e.key) && 
                                                                !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(e.key)) {
                                                                e.preventDefault()
                                                            }
                                                        }}
                                                        className={estilos.inputCantidadCompacto}
                                                        placeholder={producto.permite_decimales ? "0.000" : "1"}
                                                        maxLength={10}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const cantidadActual = parseFloat(producto.cantidad) || (producto.permite_decimales ? 0.001 : 1)
                                                            const incremento = producto.permite_decimales ? 0.001 : 1
                                                            const nuevaCantidad = cantidadActual + incremento
                                                            actualizarCantidad(producto.id, nuevaCantidad.toString())
                                                        }}
                                                        className={estilos.btnMas}
                                                        disabled={parseFloat(producto.cantidad || 0) >= parseFloat(producto.stock)}
                                                        type="button"
                                                    >
                                                        <ion-icon name="add"></ion-icon>
                                                    </button>
                                                    
                                                    {/* Selector de unidades visible */}
                                                    {producto.unidad_medida_id && unidadesMedida.length > 0 && (() => {
                                                        const unidadSeleccionada = unidadesMedida.find(um => um.id === (producto.unidad_medida_usada_id || producto.unidad_medida_id))
                                                        const unidadesDisponibles = unidadesMedida.filter(um => 
                                                            um.tipo_medida === producto.tipo_medida || um.id === producto.unidad_medida_id
                                                        )
                                                        return (
                                                            <select
                                                                value={producto.unidad_medida_usada_id || producto.unidad_medida_id}
                                                                onChange={(e) => actualizarUnidad(producto.id, e.target.value)}
                                                                className={estilos.selectUnidadVisible}
                                                                title="Cambiar unidad de medida"
                                                            >
                                                                {unidadesDisponibles.map(um => (
                                                                    <option key={um.id} value={um.id}>
                                                                        {um.abreviatura}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )
                                                    })()}
                                                </div>

                                                <div className={estilos.controlPrecioCompacto}>
                                                    {(() => {
                                                        const unidadSeleccionada = unidadesMedida.find(um => um.id === (producto.unidad_medida_usada_id || producto.unidad_medida_id))
                                                        const unidadBase = unidadesMedida.find(um => um.id === producto.unidad_medida_id)
                                                        const precioMostrado = producto.precio_venta_usado || producto.precio_por_unidad || 0
                                                        const esUnidadBase = parseInt(producto.unidad_medida_usada_id || producto.unidad_medida_id) === parseInt(producto.unidad_medida_id)
                                                        
                                                        return (
                                                            <div className={estilos.precioPorUnidadContainer}>
                                                                <div className={estilos.precioPorUnidad}>
                                                                    <span className={estilos.simboloMoneda}>{simboloEmpresa || monedaEmpresa}</span>
                                                                    <span className={estilos.precioValor}>{formatearMonto(precioMostrado)}</span>
                                                                    <span className={estilos.unidadPrecio}>/ {unidadSeleccionada?.abreviatura || unidadBase?.abreviatura || 'unidad'}</span>
                                                                </div>
                                                                {!esUnidadBase && unidadBase && (
                                                                    <div className={estilos.equivalenciaPrecio}>
                                                                        (equiv. {formatearMonto(producto.precio_por_unidad || 0)} / {unidadBase.abreviatura})
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })()}
                                                </div>

                                                <span className={estilos.subtotalProducto}>
                                                    {(() => {
                                                        // RF-004: Si la cantidad es temporal, mostrar subtotal basado en valor numérico o 0
                                                        let cantidadParaSubtotal = parseFloat(producto.cantidad) || 0
                                                        if (producto.cantidadTemporal && typeof producto.cantidad === 'string' && producto.cantidad.endsWith('.')) {
                                                            cantidadParaSubtotal = 0
                                                        }
                                                        const subtotal = producto.subtotal_calculado !== undefined 
                                                            ? producto.subtotal_calculado 
                                                            : (cantidadParaSubtotal * (producto.precio_venta_usado || producto.precio_por_unidad || 0))
                                                        return formatearMonto(subtotal)
                                                    })()}
                                                </span>

                                                <button
                                                    onClick={() => eliminarProducto(producto.id)}
                                                    className={estilos.btnEliminarCompacto}
                                                    type="button"
                                                    title="Eliminar producto"
                                                >
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                </button>
                                            </div>

                                            {/* Opciones adicionales */}
                                            <details className={estilos.opcionesAdicionales}>
                                                <summary className={estilos.summaryOpciones}>
                                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                                    Opciones adicionales
                                                </summary>
                                                <div className={estilos.contenidoOpciones}>
                                                    <label className={estilos.checkboxOpcion}>
                                                        <input
                                                            type="checkbox"
                                                            checked={producto.despacho_parcial}
                                                            onChange={() => toggleDespachoParcial(producto.id)}
                                                        />
                                                        <span>Despacho Parcial</span>
                                                    </label>

                                                    <label className={estilos.checkboxOpcion}>
                                                        <input
                                                            type="checkbox"
                                                            checked={producto.aplica_itbis !== false}
                                                            onChange={() => toggleAplicaItbis(producto.id)}
                                                        />
                                                        <span>
                                                            Aplicar {datosEmpresa?.impuesto_nombre || 'ITBIS'}
                                                            ({datosEmpresa?.impuesto_porcentaje || 18}%)
                                                        </span>
                                                    </label>

                                                    {producto.unidad_medida_id && unidadesMedida.length > 0 && (
                                                        <div className={estilos.grupoInput}>
                                                            <label>Unidad de Medida:</label>
                                                            <select
                                                                value={producto.unidad_medida_usada_id || producto.unidad_medida_id}
                                                                onChange={(e) => actualizarUnidad(producto.id, e.target.value)}
                                                                className={estilos.select}
                                                            >
                                                                {unidadesMedida
                                                                    .filter(um => um.tipo_medida === producto.tipo_medida || um.id === producto.unidad_medida_id)
                                                                    .map(um => (
                                                                        <option key={um.id} value={um.id}>
                                                                            {um.nombre} ({um.abreviatura})
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {producto.despacho_parcial && (
                                                        <div className={estilos.controlDespachoCompacto}>
                                                            <label>Entregar ahora:</label>
                                                            <div className={estilos.inputGroupDespacho}>
                                                                <button
                                                                    onClick={() => {
                                                                        const cantidadActual = parseFloat(producto.cantidadDespachar) || (producto.permite_decimales ? 0.001 : 1)
                                                                        const incremento = producto.permite_decimales ? 0.001 : 1
                                                                        const nuevaCantidad = Math.max(producto.permite_decimales ? 0.001 : 1, cantidadActual - incremento)
                                                                        actualizarCantidadDespachar(producto.id, nuevaCantidad.toString())
                                                                    }}
                                                                    disabled={parseFloat(producto.cantidadDespachar || 0) <= (producto.permite_decimales ? 0.001 : 1)}
                                                                    type="button"
                                                                >
                                                                    <ion-icon name="remove"></ion-icon>
                                                                </button>
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    value={producto.cantidadDespachar || (producto.permite_decimales ? '0.001' : '1')}
                                                                    onChange={(e) => {
                                                                        actualizarCantidadDespachar(producto.id, e.target.value)
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        const productoActual = productosVenta.find(p => p.id === producto.id)
                                                                        if (!productoActual) return
                                                                        
                                                                        const validacion = validarYNormalizarCantidad(e.target.value, productoActual.permite_decimales)
                                                                        
                                                                        // Si termina en punto, completar con 0
                                                                        if (validacion.valor.endsWith('.')) {
                                                                            const valorCompletado = validacion.valor + '0'
                                                                            actualizarCantidadDespachar(producto.id, valorCompletado)
                                                                        } else if (!validacion.valido && validacion.valor === '') {
                                                                            // Si está vacío, restaurar cantidad mínima
                                                                            const cantidadMinima = productoActual.permite_decimales ? 0.001 : 1
                                                                            actualizarCantidadDespachar(producto.id, cantidadMinima.toString())
                                                                        } else if (validacion.valorNumerico) {
                                                                            // Asegurar que esté en el rango válido
                                                                            const cantidadMinima = productoActual.permite_decimales ? 0.001 : 1
                                                                            const cantidadMaxima = parseFloat(productoActual.cantidad) || 0
                                                                            const cantidadValida = Math.min(Math.max(cantidadMinima, validacion.valorNumerico), cantidadMaxima)
                                                                            actualizarCantidadDespachar(producto.id, cantidadValida.toString())
                                                                        }
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        // RF-004.2: Prevenir múltiples puntos
                                                                        if (e.key === '.' || e.key === ',') {
                                                                            const valorActual = e.target.value
                                                                            if (valorActual.includes('.') || valorActual.includes(',')) {
                                                                                e.preventDefault()
                                                                                return
                                                                            }
                                                                        }
                                                                        // RF-004.2: Bloquear letras
                                                                        if (!/[0-9.,]/.test(e.key) && 
                                                                            !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(e.key)) {
                                                                            e.preventDefault()
                                                                        }
                                                                    }}
                                                                    maxLength={10}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const cantidadActual = parseFloat(producto.cantidadDespachar) || (producto.permite_decimales ? 0.001 : 1)
                                                                        const incremento = producto.permite_decimales ? 0.001 : 1
                                                                        const nuevaCantidad = cantidadActual + incremento
                                                                        actualizarCantidadDespachar(producto.id, nuevaCantidad.toString())
                                                                    }}
                                                                    disabled={parseFloat(producto.cantidadDespachar || 0) >= parseFloat(producto.cantidad || 0)}
                                                                    type="button"
                                                                >
                                                                    <ion-icon name="add"></ion-icon>
                                                                </button>
                                                                <span>de {producto.cantidad}</span>
                                                            </div>
                                                            <span className={estilos.textoPendiente}>
                                                                Pendiente: {(parseFloat(producto.cantidad) - parseFloat(producto.cantidadDespachar || producto.cantidad)).toFixed(3)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </details>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sección Extras */}
                    <details
                        className={`${estilos.seccionExtras} ${estilos[tema]}`}
                        open={mostrarExtras}
                        onToggle={(e) => setMostrarExtras(e.target.open)}
                    >
                        <summary className={estilos.summaryExtras}>
                            <div className={estilos.summaryLeft}>
                                <ion-icon name="chevron-forward-outline"></ion-icon>
                                <ion-icon name="add-circle-outline"></ion-icon>
                                <span>Productos Extra</span>
                                {productosExtra.length > 0 && (
                                    <span className={estilos.badgeExtras}>{productosExtra.length}</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault()
                                    abrirModalExtra()
                                }}
                                className={estilos.btnAgregarExtraCompacto}
                            >
                                <ion-icon name="add"></ion-icon>
                                Agregar
                            </button>
                        </summary>

                        <div className={estilos.contenidoExtras}>
                            {productosExtra.length === 0 ? (
                                <p className={estilos.textoSinExtras}>No hay productos extra agregados</p>
                            ) : (
                                <div className={estilos.listaExtrasCompacta}>
                                    {productosExtra.map((extra) => (
                                        <div key={extra.id} className={`${estilos.itemExtraCompacto} ${estilos[tema]}`}>
                                            <div className={estilos.infoExtraCompacto}>
                                                <span className={estilos.nombreExtraCompacto}>{extra.nombre}</span>
                                                <span className={estilos.detalleExtraCompacto}>
                                                    {cantidad} x {formatearMonto(precio)}
                                                    {extra.aplica_itbis && ` + ${datosEmpresa?.impuesto_porcentaje || 18}%`}
                                                </span>
                                            </div>
                                            <span className={estilos.totalExtraCompacto}>{formatearMonto(total)}</span>
                                            <button
                                                type="button"
                                                onClick={() => eliminarProductoExtra(extra.id)}
                                                className={estilos.btnEliminarExtraCompacto}
                                            >
                                                <ion-icon name="close-circle"></ion-icon>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </details>
                </div>

                {/* COLUMNA DERECHA - RESUMEN DE VENTA */}
                <aside className={`${estilos.colResumen} ${estilos[tema]}`}>
                    <div className={estilos.resumenSticky}>
                        <h3 className={estilos.tituloResumen}>
                            <ion-icon name="receipt-outline"></ion-icon>
                            Resumen de Venta
                        </h3>
                        {metodoPago !== 'credito' && (
                            <div className={estilos.camposVenta}>
                                <div className={estilos.campoCompacto}>
                                    <label>{getLabelMontoRecibido()}</label>
                                    <div className={estilos.inputConIcono}>
                                        <span className={estilos.iconoMoneda}>{simboloEmpresa || monedaEmpresa}</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={efectivoRecibido}
                                            onChange={(e) => setEfectivoRecibido(e.target.value)}
                                            placeholder="0.00"
                                            className={estilos.inputMoneda}
                                        />
                                    </div>
                                </div>
                                {metodoPago === 'efectivo' && efectivoRecibido && parseFloat(cambio) >= 0 && (
                                    <div className={`${estilos.cambioInfo} ${estilos[tema]}`}>
                                        <span>Cambio:</span>
                                        <strong>{formatearMonto(cambio)}</strong>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className={estilos.camposVenta}>
                            <div className={estilos.campoCompacto}>
                                <label>Descuento Global</label>
                                <div className={estilos.inputConIcono}>
                                    <span className={estilos.iconoMoneda}>{simboloEmpresa || monedaEmpresa}</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={descuentoGlobal}
                                        onChange={(e) => setDescuentoGlobal(e.target.value)}
                                        placeholder="0.00"
                                        className={estilos.inputMoneda}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={estilos.desgloseTotales}>
                            <div className={estilos.lineaTotalCompacta}>
                                <span>Subtotal:</span>
                                <span>{formatearMonto(totales.subtotal)}</span>
                            </div>
                            {parseFloat(totales.subtotalExtras) > 0 && (
                                <div className={estilos.lineaTotalCompacta}>
                                    <span>Extras:</span>
                                    <span>{formatearMonto(totales.subtotalExtras)}</span>
                                </div>
                            )}
                            <div className={estilos.lineaTotalCompacta}>
                                <span>{datosEmpresa?.impuesto_nombre || 'ITBIS'}:</span>
                                <span>{formatearMonto(totales.itbis)}</span>
                            </div>
                            {parseFloat(totales.descuento) > 0 && (
                                <div className={`${estilos.lineaTotalCompacta} ${estilos.descuento}`}>
                                    <span>Descuento:</span>
                                    <span>- {formatearMonto(totales.descuento)}</span>
                                </div>
                            )}
                            <div className={estilos.separadorTotal}></div>
                            <div className={estilos.totalFinal}>
                                <span>Total a Pagar:</span>
                                <span>{formatearMonto(totales.total)}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* MODALES */}
            {mostrarModalCliente && (
                <div className={estilos.modalOverlay} onClick={() => !procesando && setMostrarModalCliente(false)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Cliente Rápido</h2>
                            <button
                                className={estilos.btnCerrarModal}
                                onClick={() => setMostrarModalCliente(false)}
                                disabled={procesando}
                                type="button"
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <form onSubmit={crearClienteRapidoHandler} className={estilos.modalBody}>
                            <p className={estilos.infoModal}>
                                Crea un cliente rápido con solo el nombre. Podrás completar sus datos más tarde.
                            </p>

                            <div className={estilos.grupoInput}>
                                <label>Nombre del Cliente *</label>
                                <input
                                    type="text"
                                    value={nombreClienteRapido}
                                    onChange={(e) => setNombreClienteRapido(e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                    className={estilos.input}
                                    required
                                    disabled={procesando}
                                    autoFocus
                                />
                            </div>

                            <div className={estilos.modalFooter}>
                                <button
                                    type="button"
                                    className={estilos.btnCancelarModal}
                                    onClick={() => setMostrarModalCliente(false)}
                                    disabled={procesando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={estilos.btnGuardarModal}
                                    disabled={procesando}
                                >
                                    {procesando ? 'Creando...' : 'Crear Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {mostrarModalExtra && (
                <div className={estilos.modalOverlay} onClick={cerrarModalExtra}>
                    <div className={`${estilos.modalExtra} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>Agregar Producto Extra</h3>
                            <button onClick={cerrarModalExtra} className={estilos.btnCerrarModal} type="button">
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <form onSubmit={agregarProductoExtra} className={estilos.formularioExtra}>
                            <div className={estilos.grupoExtra}>
                                <label className={estilos.etiquetaExtra}>
                                    Nombre del Extra <span className={estilos.requeridoExtra}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formExtra.nombre}
                                    onChange={(e) => setFormExtra({ ...formExtra, nombre: e.target.value })}
                                    className={estilos.inputExtra}
                                    placeholder="Ej: Pepperoni extra, Delivery, Propina..."
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className={estilos.grupoExtra}>
                                <label className={estilos.etiquetaExtra}>Tipo</label>
                                <select
                                    value={formExtra.tipo}
                                    onChange={(e) => setFormExtra({ ...formExtra, tipo: e.target.value })}
                                    className={estilos.selectExtra}
                                >
                                    {tiposExtra.map(t => (
                                        <option key={t.valor} value={t.valor}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={estilos.filaExtra}>
                                <div className={estilos.grupoExtra}>
                                    <label className={estilos.etiquetaExtra}>
                                        Cantidad <span className={estilos.requeridoExtra}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formExtra.cantidad}
                                        onChange={(e) => setFormExtra({
                                            ...formExtra,
                                            cantidad: parseFloat(e.target.value) || 1
                                        })}
                                        className={estilos.inputExtra}
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div className={estilos.grupoExtra}>
                                    <label className={estilos.etiquetaExtra}>
                                        Precio Unitario <span className={estilos.requeridoExtra}>*</span>
                                    </label>
                                    <div className={estilos.inputWrapperExtra}>
                                        <span className={estilos.prefijoExtra}>{simboloEmpresa || monedaEmpresa}</span>
                                        <input
                                            type="number"
                                            value={formExtra.precioUnitario}
                                            onChange={(e) => setFormExtra({
                                                ...formExtra,
                                                precioUnitario: e.target.value
                                            })}
                                            className={estilos.inputExtraPrecio}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.grupoExtra}>
                                <label className={estilos.checkboxLabelExtra}>
                                    <input
                                        type="checkbox"
                                        checked={formExtra.aplicaItbis}
                                        onChange={(e) => setFormExtra({ ...formExtra, aplicaItbis: e.target.checked })}
                                        className={estilos.checkboxExtra}
                                    />
                                    <span>Aplica {datosEmpresa?.impuesto_porcentaje || 18}% de impuesto</span>
                                </label>
                            </div>

                            {formExtra.precioUnitario && (
                                <div className={estilos.resumenExtra}>
                                    <div className={estilos.lineaResumenExtra}>
                                        <span>Subtotal:</span>
                                        <span>{formatearMonto((parseFloat(formExtra.precioUnitario) || 0) * (parseFloat(formExtra.cantidad) || 1))}</span>
                                    </div>
                                    {formExtra.aplicaItbis && (
                                        <div className={estilos.lineaResumenExtra}>
                                            <span>Impuesto ({datosEmpresa?.impuesto_porcentaje || 18}%):</span>
                                            <span>{formatearMonto(((parseFloat(formExtra.precioUnitario) || 0) * (parseFloat(formExtra.cantidad) || 1)) * (datosEmpresa?.impuesto_porcentaje || 18) / 100)}</span>
                                        </div>
                                    )}
                                    <div className={estilos.lineaResumenTotalExtra}>
                                        <span>Total:</span>
                                        <span>{formatearMonto(calcularTotalExtra())}</span>
                                    </div>
                                </div>
                            )}

                            <div className={estilos.grupoExtra}>
                                <label className={estilos.etiquetaExtra}>Notas (Opcional)</label>
                                <textarea
                                    value={formExtra.notas}
                                    onChange={(e) => setFormExtra({ ...formExtra, notas: e.target.value })}
                                    className={estilos.textareaExtra}
                                    placeholder="Observaciones adicionales..."
                                    rows="2"
                                />
                            </div>

                            <div className={estilos.accionesExtra}>
                                <button
                                    type="button"
                                    onClick={cerrarModalExtra}
                                    className={estilos.botonCancelarExtra}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={estilos.botonAgregarExtraModal}
                                    disabled={!formExtra.nombre.trim() || !formExtra.precioUnitario || parseFloat(formExtra.precioUnitario) <= 0}
                                >
                                    <ion-icon name="add-circle-outline"></ion-icon>
                                    Agregar Extra
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}