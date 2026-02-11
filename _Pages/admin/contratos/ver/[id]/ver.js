"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    obtenerContratoPorId
} from '../../servidor'
import {
    obtenerPlanesActivos,
    actualizarPlanContrato,
    actualizarMontosContrato,
    actualizarFiadorContrato
} from '../../editar/servidor'
import {
    imprimirContrato,
    descargarPDF,
    compartirWhatsApp,
    enviarNotificacion,
    enviarPorEmail
} from './acciones'
import { calcularDiasAtraso, calcularAmortizacionFrancesa, tasaAnualAMensual } from '@/_Pages/admin/core/finance/calculos'
import { formatearEstadoCuota } from '@/_Pages/admin/core/finance/estados'
import { validarMontoInicial, validarMontoFinanciable } from '@/_Pages/admin/core/finance/reglas'
import { ESTADOS_CONTRATO } from '@/_Pages/admin/core/finance/estados'
import estilos from './ver.module.css'

// Función para formatear moneda
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor || 0)
}

// Función para formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

// Función para formatear fecha corta
function formatearFechaCorta(fecha) {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}

export default function VerContratoFinanciamiento() {
    const router = useRouter()
    const params = useParams()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [contrato, setContrato] = useState(null)
    const [cuotas, setCuotas] = useState([])
    const [pagos, setPagos] = useState([])
    const [activos, setActivos] = useState([])
    const [tabActivo, setTabActivo] = useState('detalles')
    const [mostrarModalPago, setMostrarModalPago] = useState(false)
    const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null)
    const [procesando, setProcesando] = useState(false)
    const [mostrarAcciones, setMostrarAcciones] = useState(false)
    const [mostrarModalCompartir, setMostrarModalCompartir] = useState(false)
    const [mostrarModalNotificacion, setMostrarModalNotificacion] = useState(false)
    const [procesandoAccion, setProcesandoAccion] = useState(false)
    
    // Modales de edición
    const [mostrarModalPlan, setMostrarModalPlan] = useState(false)
    const [mostrarModalMontos, setMostrarModalMontos] = useState(false)
    const [mostrarModalFiador, setMostrarModalFiador] = useState(false)
    const [planes, setPlanes] = useState([])
    const [planSeleccionado, setPlanSeleccionado] = useState(null)
    const [vistaPreviaPlan, setVistaPreviaPlan] = useState(null)

    const [formPago, setFormPago] = useState({
        monto_pago: '',
        metodo_pago: 'efectivo',
        fecha_pago: new Date().toISOString().split('T')[0],
        numero_referencia: '',
        notas: ''
    })

    const [formPlan, setFormPlan] = useState({
        plan_id: ''
    })

    const [formMontos, setFormMontos] = useState({
        precio_producto: '',
        pago_inicial: '',
        ncf: ''
    })

    const [formFiador, setFormFiador] = useState({
        nombre_fiador: '',
        documento_fiador: '',
        telefono_fiador: ''
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
        if (params.id) {
            cargarContrato()
        }
    }, [params.id])

    const cargarContrato = async () => {
        setCargando(true)
        try {
            // Cargar planes activos
            const resultadoPlanes = await obtenerPlanesActivos()
            if (resultadoPlanes.success) {
                setPlanes(resultadoPlanes.planes || [])
            }

            // Cargar contrato
            const resultado = await obtenerContratoPorId(params.id)
            if (resultado.success) {
                setContrato(resultado.contrato)
                setCuotas(resultado.cuotas || [])
                setPagos(resultado.pagos || [])
                setActivos(resultado.activos || [])
                
                // Inicializar formularios con datos del contrato
                const planActual = resultadoPlanes.planes?.find(p => p.id === resultado.contrato.plan_id)
                if (planActual) {
                    setPlanSeleccionado(planActual)
                    setFormPlan({ plan_id: planActual.id.toString() })
                }
                
                setFormMontos({
                    precio_producto: resultado.contrato.precio_producto || '',
                    pago_inicial: resultado.contrato.pago_inicial || '',
                    ncf: resultado.contrato.ncf || ''
                })
                
                setFormFiador({
                    nombre_fiador: resultado.contrato.nombre_fiador || '',
                    documento_fiador: resultado.contrato.documento_fiador || '',
                    telefono_fiador: resultado.contrato.telefono_fiador || ''
                })
            } else {
                alert(resultado.mensaje || 'No se pudo cargar el contrato')
                router.push('/admin/contratos')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al cargar contrato')
            router.push('/admin/contratos')
        } finally {
            setCargando(false)
        }
    }

    const abrirModalPago = (cuota) => {
        setCuotaSeleccionada(cuota)
        const montoTotal = parseFloat(cuota.monto_cuota) + parseFloat(cuota.monto_mora || 0)
        const montoPendiente = montoTotal - parseFloat(cuota.monto_pagado || 0)

        setFormPago({
            monto_pago: montoPendiente.toFixed(2),
            metodo_pago: 'efectivo',
            fecha_pago: new Date().toISOString().split('T')[0],
            numero_referencia: '',
            notas: ''
        })
        setMostrarModalPago(true)
    }

    const cerrarModalPago = () => {
        setMostrarModalPago(false)
        setCuotaSeleccionada(null)
    }

    const manejarCambioPago = (e) => {
        const { name, value } = e.target
        setFormPago(prev => ({ ...prev, [name]: value }))
    }

    const procesarPago = async () => {
        alert('La funcionalidad de pagos se implementará en el módulo pagos')
        cerrarModalPago()
    }

    // ===== FUNCIONES DE ACCIONES DEL CONTRATO =====
    
    const manejarImprimir = async () => {
        setProcesandoAccion(true)
        setMostrarAcciones(false)
        try {
            const resultado = await imprimirContrato(params.id)
            if (!resultado.success) {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al imprimir:', error)
            alert('Error al imprimir contrato')
        } finally {
            setProcesandoAccion(false)
        }
    }

    const manejarDescargarPDF = async () => {
        setProcesandoAccion(true)
        setMostrarAcciones(false)
        try {
            const resultado = await descargarPDF(params.id, contrato.numero_contrato)
            if (resultado.success) {
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al descargar PDF:', error)
            alert('Error al descargar PDF')
        } finally {
            setProcesandoAccion(false)
        }
    }

    const manejarCompartirWhatsApp = () => {
        setMostrarAcciones(false)
        try {
            const resultado = compartirWhatsApp(contrato)
            if (!resultado.success) {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al compartir:', error)
            alert('Error al compartir por WhatsApp')
        }
    }

    const manejarAbrirModalCompartir = () => {
        setMostrarAcciones(false)
        setMostrarModalCompartir(true)
    }

    const manejarAbrirModalNotificacion = () => {
        setMostrarAcciones(false)
        setMostrarModalNotificacion(true)
    }

    const manejarEnviarNotificacion = async (tipo = 'creacion') => {
        setProcesandoAccion(true)
        try {
            const resultado = await enviarNotificacion(params.id, tipo)
            if (resultado.success) {
                alert(resultado.mensaje)
                setMostrarModalNotificacion(false)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al enviar notificación:', error)
            alert('Error al enviar notificación')
        } finally {
            setProcesandoAccion(false)
        }
    }

    const manejarEnviarEmail = async () => {
        if (!contrato.cliente_email) {
            alert('El cliente no tiene un email registrado')
            return
        }

        setProcesandoAccion(true)
        try {
            const resultado = await enviarPorEmail(params.id, contrato.cliente_email)
            if (resultado.success) {
                alert(resultado.mensaje)
                setMostrarModalCompartir(false)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al enviar email:', error)
            alert('Error al enviar email')
        } finally {
            setProcesandoAccion(false)
        }
    }

    // Funciones para modales de edición
    const abrirModalPlan = () => {
        if (contrato.estado === ESTADOS_CONTRATO.PAGADO || contrato.estado === ESTADOS_CONTRATO.CANCELADO) {
            alert('No se puede editar un contrato pagado o cancelado')
            return
        }
        setMostrarModalPlan(true)
    }

    const cerrarModalPlan = () => {
        setMostrarModalPlan(false)
        setPlanSeleccionado(planes.find(p => p.id === contrato.plan_id) || null)
        setFormPlan({ plan_id: contrato.plan_id.toString() })
        setVistaPreviaPlan(null)
    }

    const abrirModalMontos = () => {
        if (contrato.estado === ESTADOS_CONTRATO.PAGADO || contrato.estado === ESTADOS_CONTRATO.CANCELADO) {
            alert('No se puede editar un contrato pagado o cancelado')
            return
        }
        setMostrarModalMontos(true)
    }

    const cerrarModalMontos = () => {
        setMostrarModalMontos(false)
        setFormMontos({
            precio_producto: contrato.precio_producto || '',
            pago_inicial: contrato.pago_inicial || '',
            ncf: contrato.ncf || ''
        })
    }

    const abrirModalFiador = () => {
        if (contrato.estado === ESTADOS_CONTRATO.PAGADO || contrato.estado === ESTADOS_CONTRATO.CANCELADO) {
            alert('No se puede editar un contrato pagado o cancelado')
            return
        }
        setMostrarModalFiador(true)
    }

    const cerrarModalFiador = () => {
        setMostrarModalFiador(false)
        setFormFiador({
            nombre_fiador: contrato.nombre_fiador || '',
            documento_fiador: contrato.documento_fiador || '',
            telefono_fiador: contrato.telefono_fiador || ''
        })
    }

    const seleccionarPlan = (plan) => {
        setPlanSeleccionado(plan)
        setFormPlan({ plan_id: plan.id.toString() })
        
        // Calcular vista previa
        if (contrato) {
            const montoFinanciado = parseFloat(contrato.monto_financiado || 0)
            const tasaMensual = tasaAnualAMensual(plan.tasa_interes_anual)
            const amortizacion = calcularAmortizacionFrancesa(montoFinanciado, tasaMensual, plan.plazo_meses)
            
            setVistaPreviaPlan({
                numero_cuotas: plan.plazo_meses,
                tasa_interes_anual: plan.tasa_interes_anual,
                tasa_interes_mensual: tasaMensual * 100,
                cuota_mensual: amortizacion.cuotaMensual,
                total_intereses: amortizacion.totalIntereses,
                total_a_pagar: amortizacion.totalPagar
            })
        }
    }

    const guardarPlan = async () => {
        if (!planSeleccionado || planSeleccionado.id === contrato.plan_id) {
            alert('Seleccione un plan diferente al actual')
            return
        }

        setProcesando(true)
        try {
            const resultado = await actualizarPlanContrato(params.id, planSeleccionado.id)
            if (resultado.success) {
                alert(resultado.mensaje || 'Plan actualizado exitosamente')
                cerrarModalPlan()
                cargarContrato()
            } else {
                alert(resultado.mensaje || 'Error al actualizar plan')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al actualizar plan')
        } finally {
            setProcesando(false)
        }
    }

    const guardarMontos = async () => {
        const precioProducto = parseFloat(formMontos.precio_producto)
        const pagoInicial = parseFloat(formMontos.pago_inicial)
        const montoFinanciado = precioProducto - pagoInicial

        // Validaciones
        if (!precioProducto || precioProducto <= 0) {
            alert('El precio del producto debe ser mayor a 0')
            return
        }

        if (pagoInicial < 0) {
            alert('El pago inicial no puede ser negativo')
            return
        }

        if (montoFinanciado <= 0) {
            alert('El monto financiado debe ser mayor a 0')
            return
        }

        // Obtener plan actual para validar pago inicial mínimo
        const planActual = planes.find(p => p.id === contrato.plan_id)
        if (planActual) {
            const validacion = validarMontoInicial(
                precioProducto,
                pagoInicial,
                planActual.pago_inicial_minimo_pct || 0
            )
            if (!validacion.valido) {
                alert(validacion.error)
                return
            }
        }

        const validacionMonto = validarMontoFinanciable(montoFinanciado)
        if (!validacionMonto.valido) {
            alert(validacionMonto.error)
            return
        }

        setProcesando(true)
        try {
            const resultado = await actualizarMontosContrato(params.id, {
                precio_producto: precioProducto,
                pago_inicial: pagoInicial,
                ncf: formMontos.ncf || null
            })
            if (resultado.success) {
                alert(resultado.mensaje || 'Montos actualizados exitosamente')
                cerrarModalMontos()
                cargarContrato()
            } else {
                alert(resultado.mensaje || 'Error al actualizar montos')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al actualizar montos')
        } finally {
            setProcesando(false)
        }
    }

    const guardarFiador = async () => {
        // Validar si el plan requiere fiador
        const planActual = planes.find(p => p.id === contrato.plan_id)
        if (planActual && planActual.requiere_fiador === 1) {
            if (!formFiador.nombre_fiador || !formFiador.documento_fiador) {
                alert('Este plan requiere un fiador. Complete nombre y documento.')
                return
            }
        }

        setProcesando(true)
        try {
            const resultado = await actualizarFiadorContrato(params.id, formFiador)
            if (resultado.success) {
                alert(resultado.mensaje || 'Fiador actualizado exitosamente')
                cerrarModalFiador()
                cargarContrato()
            } else {
                alert(resultado.mensaje || 'Error al actualizar fiador')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al actualizar fiador')
        } finally {
            setProcesando(false)
        }
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            activo: 'success',
            pagado: 'info',
            incumplido: 'danger',
            reestructurado: 'warning',
            cancelado: 'secondary'
        }
        return colores[estado] || 'secondary'
    }

    // Calcular progreso de pago
    const calcularProgreso = () => {
        if (!contrato) return 0
        const totalAPagar = parseFloat(contrato.total_a_pagar) || 0
        const montoPagado = parseFloat(contrato.monto_pagado) || 0
        return totalAPagar > 0 ? Math.min((montoPagado / totalAPagar) * 100, 100) : 0
    }

    // Calcular días restantes del contrato
    const calcularDiasRestantes = () => {
        if (!contrato?.fecha_ultimo_pago) return 0
        const hoy = new Date()
        const fechaFin = new Date(contrato.fecha_ultimo_pago)
        const diff = fechaFin - hoy
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    // Calcular cuotas stats
    const cuotasStats = {
        pagadas: cuotas.filter(c => c.estado === 'pagada').length,
        pendientes: cuotas.filter(c => c.estado === 'pendiente').length,
        vencidas: cuotas.filter(c => c.estado === 'vencida').length,
        total: cuotas.length
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.spinner}></div>
                    <span>Cargando contrato...</span>
                </div>
            </div>
        )
    }

    if (!contrato) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>Contrato no encontrado</span>
                    <Link href="/admin/contratos" className={estilos.btnVolver}>
                        Volver a contratos
                    </Link>
                </div>
            </div>
        )
    }

    const diasAtrasoContrato = cuotas.length > 0 
        ? Math.max(...cuotas.filter(c => c.estado !== 'pagada').map(c => calcularDiasAtraso(c.fecha_vencimiento)))
        : 0

    const progreso = calcularProgreso()
    const diasRestantes = calcularDiasRestantes()

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Breadcrumb */}
            <nav className={estilos.breadcrumb}>
                <Link href="/admin">Administración</Link>
                <span>/</span>
                <Link href="/admin/contratos">Contratos</Link>
                <span>/</span>
                <span className={estilos.breadcrumbActivo}>{contrato.numero_contrato}</span>
            </nav>

            {/* Header Principal - Estilo tiimi */}
            <header className={estilos.headerPrincipal}>
                {/* Fila superior: Botón volver + Cliente + Acciones */}
                <div className={estilos.headerTop}>
                    <Link href="/admin/contratos" className={estilos.btnBack}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                    </Link>
                    
                    <div className={estilos.clienteInfo}>
                        <div className={estilos.clienteAvatar}>
                            {contrato.cliente_foto ? (
                                <img src={contrato.cliente_foto} alt={contrato.cliente_nombre} />
                            ) : (
                                <span>{contrato.cliente_nombre?.charAt(0) || 'C'}</span>
                            )}
                        </div>
                        <div className={estilos.clienteDatos}>
                            <h1 className={estilos.clienteNombre}>
                                {contrato.cliente_nombre} {contrato.cliente_apellidos || ''}
                            </h1>
                            <div className={estilos.clienteBadges}>
                                <span className={`${estilos.estadoBadge} ${estilos[obtenerColorEstado(contrato.estado)]}`}>
                                    <span className={estilos.badgeDot}></span>
                                    {contrato.estado}
                                </span>
                                {diasAtrasoContrato > 0 && (
                                    <span className={estilos.atrasoBadge}>
                                        {diasAtrasoContrato} días de atraso
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={estilos.headerActions}>
                        <div className={estilos.accionesDropdown}>
                            <button 
                                className={estilos.btnMas}
                                onClick={() => setMostrarAcciones(!mostrarAcciones)}
                            >
                                <ion-icon name="ellipsis-vertical"></ion-icon>
                            </button>
                            {mostrarAcciones && (
                                <>
                                    <div className={estilos.dropdownOverlay} onClick={() => setMostrarAcciones(false)}></div>
                                    <div className={estilos.dropdownMenu}>
                                        <div className={estilos.dropdownHeader}>
                                            <span>Acciones</span>
                                            <button onClick={() => setMostrarAcciones(false)}>
                                                <ion-icon name="close-outline"></ion-icon>
                                            </button>
                                        </div>
                                        <Link href={`/admin/contratos/editar/${params.id}`} className={estilos.dropdownItem}>
                                            <ion-icon name="create-outline"></ion-icon>
                                            Editar Contrato
                                        </Link>
                                        <button 
                                            className={estilos.dropdownItem}
                                            onClick={manejarImprimir}
                                            disabled={procesandoAccion}
                                        >
                                            <ion-icon name="print-outline"></ion-icon>
                                            Imprimir
                                        </button>
                                        <button 
                                            className={estilos.dropdownItem}
                                            onClick={manejarDescargarPDF}
                                            disabled={procesandoAccion}
                                        >
                                            <ion-icon name="download-outline"></ion-icon>
                                            Descargar PDF
                                        </button>
                                        <button 
                                            className={estilos.dropdownItem}
                                            onClick={manejarAbrirModalCompartir}
                                        >
                                            <ion-icon name="share-social-outline"></ion-icon>
                                            Compartir
                                        </button>
                                        <button 
                                            className={estilos.dropdownItem}
                                            onClick={manejarCompartirWhatsApp}
                                        >
                                            <ion-icon name="logo-whatsapp"></ion-icon>
                                            Enviar por WhatsApp
                                        </button>
                                        <button 
                                            className={estilos.dropdownItem}
                                            onClick={manejarAbrirModalNotificacion}
                                        >
                                            <ion-icon name="notifications-outline"></ion-icon>
                                            Enviar Notificación
                                        </button>
                                        <div className={estilos.dropdownSeparator}></div>
                                        <Link 
                                            href={`/admin/contratos/refinanciar/${params.id}`}
                                            className={estilos.dropdownItem}
                                        >
                                            <ion-icon name="repeat-outline"></ion-icon>
                                            Refinanciar
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                        <button className={estilos.btnPrimario}>
                            <ion-icon name="mail-outline"></ion-icon>
                            <span>Enviar Notificación</span>
                        </button>
                    </div>
                </div>

                {/* Fila de metadatos */}
                <div className={estilos.headerMetas}>
                    <div className={estilos.metaItem}>
                        <span className={estilos.metaLabel}>Contrato ID</span>
                        <span className={estilos.metaValue}>{contrato.numero_contrato}</span>
                    </div>
                    <div className={estilos.metaItem}>
                        <span className={estilos.metaLabel}>Fecha Inicio</span>
                        <span className={estilos.metaValue}>{formatearFechaCorta(contrato.fecha_contrato)}</span>
                    </div>
                    <div className={estilos.metaItem}>
                        <span className={estilos.metaLabel}>Vendedor</span>
                        <span className={estilos.metaValue}>{contrato.vendedor_nombre || 'N/A'}</span>
                    </div>
                </div>
            </header>

            {/* Tabs de Navegación - Estilo tiimi */}
            <div className={estilos.tabsNav}>
                <button
                    className={`${estilos.tabBtn} ${tabActivo === 'detalles' ? estilos.tabActivo : ''}`}
                    onClick={() => setTabActivo('detalles')}
                >
                    <ion-icon name="document-text-outline"></ion-icon>
                    Detalles del Contrato
                </button>
                <button
                    className={`${estilos.tabBtn} ${tabActivo === 'cronograma' ? estilos.tabActivo : ''}`}
                    onClick={() => setTabActivo('cronograma')}
                >
                    <ion-icon name="calendar-outline"></ion-icon>
                    Cronograma
                    <span className={estilos.tabCount}>{cuotas.length}</span>
                </button>
                <button
                    className={`${estilos.tabBtn} ${tabActivo === 'pagos' ? estilos.tabActivo : ''}`}
                    onClick={() => setTabActivo('pagos')}
                >
                    <ion-icon name="receipt-outline"></ion-icon>
                    Historial de Pagos
                    <span className={estilos.tabCount}>{pagos.length}</span>
                </button>
                <button
                    className={`${estilos.tabBtn} ${tabActivo === 'activos' ? estilos.tabActivo : ''}`}
                    onClick={() => setTabActivo('activos')}
                >
                    <ion-icon name="cube-outline"></ion-icon>
                    Activos
                    <span className={estilos.tabCount}>{activos.length}</span>
                </button>
            </div>

            {/* Contenido Principal */}
            <div className={estilos.mainContent}>
                {/* Tab Detalles */}
                {tabActivo === 'detalles' && (
                    <div className={estilos.detallesLayout}>
                        {/* Columna Izquierda */}
                        <div className={estilos.columnaIzquierda}>
                            {/* Duración del Contrato */}
                            <section className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <div className={estilos.seccionTitulo}>
                                        <ion-icon name="time-outline"></ion-icon>
                                        <h2>Duración del Contrato</h2>
                                    </div>
                                    <div className={estilos.seccionAcciones}>
                                        {contrato.estado === 'activo' && (
                                            <>
                                                <button className={estilos.btnOutline}>Terminar</button>
                                                <Link href={`/admin/contratos/refinanciar/${params.id}`} className={estilos.btnSuccess}>
                                                    Extender Contrato
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className={estilos.duracionContent}>
                                    <div className={estilos.duracionFechas}>
                                        <div className={estilos.fechaItem}>
                                            <span className={estilos.fechaLabel}>Inicio del Contrato</span>
                                            <span className={estilos.fechaValor}>{formatearFecha(contrato.fecha_contrato)}</span>
                                        </div>
                                        <div className={estilos.fechaFlecha}>
                                            <ion-icon name="arrow-forward-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.fechaItem}>
                                            <span className={estilos.fechaLabel}>Fin del Contrato</span>
                                            <span className={estilos.fechaValor}>{formatearFecha(contrato.fecha_ultimo_pago)}</span>
                                        </div>
                                    </div>
                                    <div className={estilos.duracionBarra}>
                                        <div 
                                            className={estilos.duracionProgreso}
                                            style={{ width: `${progreso}%` }}
                                        ></div>
                                    </div>
                                    <div className={estilos.duracionInfo}>
                                        <ion-icon name="time-outline"></ion-icon>
                                        <span>{diasRestantes} días hasta vencimiento</span>
                                    </div>
                                </div>
                            </section>

                            {/* Detalles del Plan */}
                            <section className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <div className={estilos.seccionTitulo}>
                                        <ion-icon name="document-text-outline"></ion-icon>
                                        <h2>Detalles del Plan</h2>
                                    </div>
                                    <button className={estilos.btnEditar} onClick={abrirModalPlan}>
                                        <ion-icon name="create-outline"></ion-icon>
                                        Editar
                                    </button>
                                </div>
                                <div className={estilos.detallesGrid}>
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Plan de Financiamiento</span>
                                        <span className={estilos.detalleValor}>{contrato.plan_nombre || 'N/A'}</span>
                                    </div>
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Plazo</span>
                                        <span className={estilos.detalleValor}>{contrato.numero_cuotas} meses</span>
                                    </div>
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Tasa de Interés</span>
                                        <span className={estilos.detalleValor}>{(parseFloat(contrato.tasa_interes_mensual) * 100).toFixed(2)}% mensual</span>
                                    </div>
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>NCF</span>
                                        <span className={estilos.detalleValor}>{contrato.ncf || 'No asignado'}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Montos y Compensación */}
                            <section className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <div className={estilos.seccionTitulo}>
                                        <ion-icon name="cash-outline"></ion-icon>
                                        <h2>Compensación y Montos</h2>
                                    </div>
                                    <button className={estilos.btnEditar} onClick={abrirModalMontos}>
                                        <ion-icon name="create-outline"></ion-icon>
                                        Editar
                                    </button>
                                </div>
                                <div className={estilos.detallesGrid}>
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Precio del Producto</span>
                                        <span className={estilos.detalleValor}>{formatearMoneda(contrato.precio_producto)}</span>
                                    </div>
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Pago Inicial</span>
                                        <span className={`${estilos.detalleValor} ${estilos.success}`}>{formatearMoneda(contrato.pago_inicial)}</span>
                                    </div>
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Monto Financiado</span>
                                        <span className={estilos.detalleValor}>{formatearMoneda(contrato.monto_financiado)}</span>
                                    </div>
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Total Intereses</span>
                                        <span className={estilos.detalleValor}>{formatearMoneda(contrato.total_intereses)}</span>
                                    </div>
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Total a Pagar</span>
                                        <span className={`${estilos.detalleValor} ${estilos.destacado}`}>{formatearMoneda(contrato.total_a_pagar)}</span>
                                    </div>
                                    <div className={estilos.detalleItem}>
                                        <span className={estilos.detalleLabel}>Cuota Mensual</span>
                                        <span className={`${estilos.detalleValor} ${estilos.primary}`}>{formatearMoneda(contrato.monto_cuota)}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Información del Fiador */}
                            {contrato.nombre_fiador && (
                                <section className={estilos.seccion}>
                                    <div className={estilos.seccionHeader}>
                                        <div className={estilos.seccionTitulo}>
                                            <ion-icon name="people-outline"></ion-icon>
                                            <h2>Fiador / Garante</h2>
                                        </div>
                                        <button className={estilos.btnEditar} onClick={abrirModalFiador}>
                                            <ion-icon name="create-outline"></ion-icon>
                                            Editar
                                        </button>
                                    </div>
                                    <div className={estilos.detallesGrid}>
                                        <div className={estilos.detalleItem}>
                                            <span className={estilos.detalleLabel}>Nombre Completo</span>
                                            <span className={estilos.detalleValor}>{contrato.nombre_fiador}</span>
                                        </div>
                                        <div className={estilos.detalleItem}>
                                            <span className={estilos.detalleLabel}>Documento</span>
                                            <span className={estilos.detalleValor}>{contrato.documento_fiador || 'N/A'}</span>
                                        </div>
                                        <div className={estilos.detalleItem}>
                                            <span className={estilos.detalleLabel}>Teléfono</span>
                                            <span className={estilos.detalleValor}>{contrato.telefono_fiador || 'N/A'}</span>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Notas */}
                            {contrato.notas && (
                                <section className={estilos.seccion}>
                                    <div className={estilos.seccionHeader}>
                                        <div className={estilos.seccionTitulo}>
                                            <ion-icon name="document-attach-outline"></ion-icon>
                                            <h2>Notas</h2>
                                        </div>
                                    </div>
                                    <p className={estilos.notas}>{contrato.notas}</p>
                                </section>
                            )}
                        </div>

                        {/* Columna Derecha - Panel de Información */}
                        <div className={estilos.columnaDerecha}>
                            {/* Tarjeta Visual */}
                            <div className={estilos.tarjetaCard}>
                                <div className={estilos.tarjetaVisual}>
                                    <Image 
                                        src="/financias/tarjetas/MC with Silver Chip & Embossing.svg" 
                                        alt="Tarjeta de financiamiento"
                                        width={320}
                                        height={200}
                                        className={estilos.tarjetaImg}
                                    />
                                </div>
                            </div>

                            {/* Resumen de Estado */}
                            <div className={estilos.panelInfo}>
                                <h3 className={estilos.panelTitulo}>
                                    <ion-icon name="bar-chart-outline"></ion-icon>
                                    Estado del Contrato
                                </h3>
                                <div className={estilos.estadoResumen}>
                                    <div className={estilos.progresoCircular}>
                                        <svg viewBox="0 0 36 36" className={estilos.circularChart}>
                                            <path
                                                className={estilos.circleBg}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <path
                                                className={estilos.circle}
                                                strokeDasharray={`${progreso}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <text x="18" y="20.35" className={estilos.porcentaje}>
                                                {progreso.toFixed(0)}%
                                            </text>
                                        </svg>
                                        <span className={estilos.progresoLabel}>Pagado</span>
                                    </div>
                                    <div className={estilos.estadoDetalles}>
                                        <div className={estilos.estadoItem}>
                                            <span className={estilos.estadoLabel}>Monto Pagado</span>
                                            <span className={`${estilos.estadoValor} ${estilos.success}`}>
                                                {formatearMoneda(contrato.monto_pagado)}
                                            </span>
                                        </div>
                                        <div className={estilos.estadoItem}>
                                            <span className={estilos.estadoLabel}>Saldo Pendiente</span>
                                            <span className={`${estilos.estadoValor} ${estilos.danger}`}>
                                                {formatearMoneda(contrato.saldo_pendiente)}
                                            </span>
                                        </div>
                                        <div className={estilos.estadoItem}>
                                            <span className={estilos.estadoLabel}>Cuotas Pagadas</span>
                                            <span className={estilos.estadoValor}>
                                                {cuotasStats.pagadas} de {cuotasStats.total}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Información del Cliente */}
                            <div className={estilos.panelInfo}>
                                <h3 className={estilos.panelTitulo}>
                                    <ion-icon name="person-outline"></ion-icon>
                                    Información del Cliente
                                </h3>
                                <div className={estilos.infoLista}>
                                    <div className={estilos.infoItem}>
                                        <ion-icon name="mail-outline"></ion-icon>
                                        <div className={estilos.infoContent}>
                                            <span className={estilos.infoLabel}>Email</span>
                                            <span className={estilos.infoValor}>
                                                {contrato.cliente_email || 'No registrado'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={estilos.infoItem}>
                                        <ion-icon name="call-outline"></ion-icon>
                                        <div className={estilos.infoContent}>
                                            <span className={estilos.infoLabel}>Teléfono</span>
                                            <span className={estilos.infoValor}>
                                                {contrato.cliente_telefono || 'No registrado'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={estilos.infoItem}>
                                        <ion-icon name="card-outline"></ion-icon>
                                        <div className={estilos.infoContent}>
                                            <span className={estilos.infoLabel}>Documento</span>
                                            <span className={estilos.infoValor}>
                                                {contrato.cliente_documento || 'No registrado'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={estilos.infoItem}>
                                        <ion-icon name="location-outline"></ion-icon>
                                        <div className={estilos.infoContent}>
                                            <span className={estilos.infoLabel}>Dirección</span>
                                            <span className={estilos.infoValor}>
                                                {contrato.cliente_direccion || 'No registrada'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Acciones Rápidas */}
                            <div className={estilos.panelAcciones}>
                                <h3 className={estilos.panelTitulo}>
                                    <ion-icon name="flash-outline"></ion-icon>
                                    Acciones Rápidas
                                </h3>
                                <div className={estilos.accionesLista}>
                                    <button 
                                        className={estilos.accionBtn}
                                        onClick={() => {
                                            const cuotaPendiente = cuotas.find(c => c.estado !== 'pagada')
                                            if (cuotaPendiente) abrirModalPago(cuotaPendiente)
                                        }}
                                    >
                                        <ion-icon name="cash-outline"></ion-icon>
                                        Registrar Pago
                                    </button>
                                    <button className={estilos.accionBtn}>
                                        <ion-icon name="print-outline"></ion-icon>
                                        Imprimir Contrato
                                    </button>
                                    <button className={estilos.accionBtn}>
                                        <ion-icon name="share-social-outline"></ion-icon>
                                        Compartir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Cronograma */}
                {tabActivo === 'cronograma' && (
                    <div className={estilos.cronogramaContent}>
                        <div className={estilos.cronogramaHeader}>
                            <h2>Cronograma de Cuotas</h2>
                            <div className={estilos.cronogramaStats}>
                                <span className={`${estilos.statBadge} ${estilos.success}`}>
                                    <ion-icon name="checkmark-circle"></ion-icon>
                                    {cuotasStats.pagadas} Pagadas
                                </span>
                                <span className={`${estilos.statBadge} ${estilos.warning}`}>
                                    <ion-icon name="time"></ion-icon>
                                    {cuotasStats.pendientes} Pendientes
                                </span>
                                {cuotasStats.vencidas > 0 && (
                                    <span className={`${estilos.statBadge} ${estilos.danger}`}>
                                        <ion-icon name="alert-circle"></ion-icon>
                                        {cuotasStats.vencidas} Vencidas
                                    </span>
                                )}
                            </div>
                        </div>

                        {cuotas.length === 0 ? (
                            <div className={estilos.sinDatos}>
                                <ion-icon name="calendar-outline"></ion-icon>
                                <p>No hay cuotas registradas</p>
                            </div>
                        ) : (
                            <div className={estilos.tablaCuotas}>
                                <div className={estilos.tablaHeader}>
                                    <span>#</span>
                                    <span>Fecha Vencimiento</span>
                                    <span>Capital</span>
                                    <span>Interés</span>
                                    <span>Mora</span>
                                    <span>Total</span>
                                    <span>Estado</span>
                                    <span>Acción</span>
                                </div>
                                {cuotas.map((cuota, index) => {
                                    const diasAtraso = calcularDiasAtraso(cuota.fecha_vencimiento)
                                    const montoTotal = parseFloat(cuota.monto_cuota) + parseFloat(cuota.monto_mora || 0)
                                    const estadoCuota = formatearEstadoCuota(cuota.estado)

                                    return (
                                        <div 
                                            key={cuota.id} 
                                            className={`${estilos.tablaFila} ${estilos[cuota.estado]}`}
                                        >
                                            <span className={estilos.cuotaNum}>{cuota.numero_cuota}</span>
                                            <span>{formatearFechaCorta(cuota.fecha_vencimiento)}</span>
                                            <span>{formatearMoneda(cuota.monto_capital)}</span>
                                            <span>{formatearMoneda(cuota.monto_interes)}</span>
                                            <span className={estilos.mora}>
                                                {parseFloat(cuota.monto_mora || 0) > 0 ? formatearMoneda(cuota.monto_mora) : '-'}
                                            </span>
                                            <span className={estilos.montoTotal}>{formatearMoneda(montoTotal)}</span>
                                            <span>
                                                <span className={`${estilos.estadoChip} ${estilos[estadoCuota.color]}`}>
                                                    {estadoCuota.texto}
                                                </span>
                                            </span>
                                            <span>
                                                {cuota.estado !== 'pagada' && (
                                                    <button 
                                                        className={estilos.btnPagar}
                                                        onClick={() => abrirModalPago(cuota)}
                                                    >
                                                        Pagar
                                                    </button>
                                                )}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Pagos */}
                {tabActivo === 'pagos' && (
                    <div className={estilos.pagosContent}>
                        <div className={estilos.pagosHeader}>
                            <h2>Historial de Pagos</h2>
                            <button className={estilos.btnAgregarPago}>
                                <ion-icon name="add-circle-outline"></ion-icon>
                                Agregar Pago
                            </button>
                        </div>

                        {pagos.length === 0 ? (
                            <div className={estilos.sinDatos}>
                                <ion-icon name="receipt-outline"></ion-icon>
                                <p>No hay pagos registrados</p>
                            </div>
                        ) : (
                            <div className={estilos.pagosLista}>
                                {pagos.map((pago, index) => (
                                    <div key={pago.id} className={estilos.pagoItem}>
                                        <div className={estilos.pagoFecha}>
                                            <span className={estilos.pagoDia}>
                                                {new Date(pago.fecha_pago).getDate().toString().padStart(2, '0')}
                                            </span>
                                            <span className={estilos.pagoMes}>
                                                {new Date(pago.fecha_pago).toLocaleDateString('es-DO', { month: 'short' })}
                                            </span>
                                        </div>
                                        <div className={estilos.pagoInfo}>
                                            <strong>{pago.numero_recibo || `Pago #${pago.id}`}</strong>
                                            <span>con {pago.registrado_por_nombre || 'Sistema'}</span>
                                        </div>
                                        <div className={estilos.pagoDetalles}>
                                            <span className={estilos.pagoMetodo}>
                                                {pago.metodo_pago}
                                            </span>
                                            <span className={`${estilos.pagoEstado} ${estilos.completado}`}>
                                                <span className={estilos.dot}></span>
                                                Completado
                                            </span>
                                        </div>
                                        <div className={estilos.pagoMonto}>
                                            {formatearMoneda(pago.monto_pago)}
                                        </div>
                                        <button className={estilos.btnVerDetalle}>
                                            Ver Detalles
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Activos */}
                {tabActivo === 'activos' && (
                    <div className={estilos.activosContent}>
                        <div className={estilos.activosHeader}>
                            <h2>Activos del Contrato</h2>
                        </div>

                        {activos.length === 0 ? (
                            <div className={estilos.sinDatos}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <p>No hay activos asociados a este contrato</p>
                            </div>
                        ) : (
                            <div className={estilos.activosGrid}>
                                {activos.map((activo, index) => (
                                    <div key={activo.id} className={estilos.activoCard}>
                                        <div className={estilos.activoImagen}>
                                            {activo.imagen_url ? (
                                                <img src={activo.imagen_url} alt={activo.producto_nombre} />
                                            ) : (
                                                <div className={estilos.activoPlaceholder}>
                                                    <ion-icon name="cube"></ion-icon>
                                                </div>
                                            )}
                                        </div>
                                        <div className={estilos.activoInfo}>
                                            <h4>{activo.producto_nombre}</h4>
                                            <div className={estilos.activoDetalles}>
                                                <div className={estilos.activoDetalle}>
                                                    <span className={estilos.detalleLabel}>Código</span>
                                                    <span className={estilos.detalleValor}>{activo.codigo_activo}</span>
                                                </div>
                                                {activo.numero_serie && (
                                                    <div className={estilos.activoDetalle}>
                                                        <span className={estilos.detalleLabel}>Serie</span>
                                                        <span className={estilos.detalleValor}>{activo.numero_serie}</span>
                                                    </div>
                                                )}
                                                {activo.vin && (
                                                    <div className={estilos.activoDetalle}>
                                                        <span className={estilos.detalleLabel}>VIN</span>
                                                        <span className={estilos.detalleValor}>{activo.vin}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`${estilos.activoEstado} ${estilos.info}`}>
                                                {activo.estado || 'Financiado'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Pago */}
            {mostrarModalPago && cuotaSeleccionada && (
                <div className={estilos.modalOverlay} onClick={cerrarModalPago}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Registrar Pago</h2>
                            <p>Cuota #{cuotaSeleccionada.numero_cuota}</p>
                            <button className={estilos.modalCerrar} onClick={cerrarModalPago}>
                                <ion-icon name="close"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.modalBody}>
                            <div className={estilos.resumenPago}>
                                <div className={estilos.resumenFila}>
                                    <span>Monto Cuota</span>
                                    <strong>{formatearMoneda(cuotaSeleccionada.monto_cuota)}</strong>
                                </div>
                                {parseFloat(cuotaSeleccionada.monto_mora || 0) > 0 && (
                                    <div className={estilos.resumenFila}>
                                        <span>Mora</span>
                                        <strong className={estilos.mora}>{formatearMoneda(cuotaSeleccionada.monto_mora)}</strong>
                                    </div>
                                )}
                                <div className={`${estilos.resumenFila} ${estilos.total}`}>
                                    <span>Total a Pagar</span>
                                    <strong>
                                        {formatearMoneda(
                                            parseFloat(cuotaSeleccionada.monto_cuota) +
                                            parseFloat(cuotaSeleccionada.monto_mora || 0) -
                                            parseFloat(cuotaSeleccionada.monto_pagado || 0)
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className={estilos.formPago}>
                                <div className={estilos.formGroup}>
                                    <label>Monto a Pagar</label>
                                    <input
                                        type="number"
                                        name="monto_pago"
                                        value={formPago.monto_pago}
                                        onChange={manejarCambioPago}
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                <div className={estilos.formGroup}>
                                    <label>Método de Pago</label>
                                    <select name="metodo_pago" value={formPago.metodo_pago} onChange={manejarCambioPago}>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta_debito">Tarjeta Débito</option>
                                        <option value="tarjeta_credito">Tarjeta Crédito</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>
                                <div className={estilos.formGroup}>
                                    <label>Fecha de Pago</label>
                                    <input
                                        type="date"
                                        name="fecha_pago"
                                        value={formPago.fecha_pago}
                                        onChange={manejarCambioPago}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnCancelar} onClick={cerrarModalPago}>
                                Cancelar
                            </button>
                            <button className={estilos.btnConfirmar} onClick={procesarPago}>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                Confirmar Pago
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Editar Plan */}
            {mostrarModalPlan && (
                <div className={estilos.modalOverlay} onClick={cerrarModalPlan}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <div>
                                <h2>Editar Plan de Financiamiento</h2>
                                <p>Seleccione un nuevo plan para el contrato</p>
                            </div>
                            <button className={estilos.modalCerrar} onClick={cerrarModalPlan}>
                                <ion-icon name="close"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.modalBody}>
                            <div className={estilos.planesGridModal}>
                                {planes.map(plan => (
                                    <div 
                                        key={plan.id}
                                        className={`${estilos.planCardModal} ${planSeleccionado?.id === plan.id ? estilos.planActivo : ''} ${plan.id === contrato.plan_id ? estilos.planActual : ''}`}
                                        onClick={() => seleccionarPlan(plan)}
                                    >
                                        <div className={estilos.planIconoModal}>
                                            <ion-icon name="trending-up-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.planContenidoModal}>
                                            <h4>{plan.nombre}</h4>
                                            {plan.id === contrato.plan_id && (
                                                <span className={estilos.planBadgeActual}>Plan Actual</span>
                                            )}
                                            <div className={estilos.planDetallesModal}>
                                                <div className={estilos.planDetalleModal}>
                                                    <ion-icon name="calendar-outline"></ion-icon>
                                                    <span>{plan.plazo_meses} meses</span>
                                                </div>
                                                <div className={estilos.planDetalleModal}>
                                                    <ion-icon name="analytics-outline"></ion-icon>
                                                    <span>{plan.tasa_interes_anual}% anual</span>
                                                </div>
                                                <div className={estilos.planDetalleModal}>
                                                    <ion-icon name="cash-outline"></ion-icon>
                                                    <span>{plan.pago_inicial_minimo_pct}% inicial</span>
                                                </div>
                                                {plan.requiere_fiador && (
                                                    <div className={`${estilos.planDetalleModal} ${estilos.requiereFiador}`}>
                                                        <ion-icon name="shield-checkmark-outline"></ion-icon>
                                                        <span>Requiere fiador</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {planSeleccionado?.id === plan.id && (
                                            <div className={estilos.planCheckModal}>
                                                <ion-icon name="checkmark-circle"></ion-icon>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {planSeleccionado && planSeleccionado.id !== contrato.plan_id && vistaPreviaPlan && (
                                <div className={estilos.vistaPreviaPlanModal}>
                                    <h4>
                                        <ion-icon name="eye-outline"></ion-icon>
                                        Vista Previa del Nuevo Plan
                                    </h4>
                                    <div className={estilos.vistaPreviaGridModal}>
                                        <div className={estilos.vistaPreviaItemModal}>
                                            <span>Cuotas</span>
                                            <strong>{vistaPreviaPlan.numero_cuotas} meses</strong>
                                        </div>
                                        <div className={estilos.vistaPreviaItemModal}>
                                            <span>Tasa Mensual</span>
                                            <strong>{vistaPreviaPlan.tasa_interes_mensual.toFixed(2)}%</strong>
                                        </div>
                                        <div className={estilos.vistaPreviaItemModal}>
                                            <span>Cuota Mensual</span>
                                            <strong className={estilos.destacado}>{formatearMoneda(vistaPreviaPlan.cuota_mensual)}</strong>
                                        </div>
                                        <div className={estilos.vistaPreviaItemModal}>
                                            <span>Total Intereses</span>
                                            <strong>{formatearMoneda(vistaPreviaPlan.total_intereses)}</strong>
                                        </div>
                                    </div>
                                    <div className={estilos.alertaCambioPlanModal}>
                                        <ion-icon name="information-circle-outline"></ion-icon>
                                        <span>Al cambiar el plan, se recalcularán las cuotas pendientes del contrato</span>
                                    </div>
                                </div>
                            )}

                            <div className={estilos.modalFooter}>
                                <button className={estilos.btnCancelarModal} onClick={cerrarModalPlan}>
                                    Cancelar
                                </button>
                                <button 
                                    className={estilos.btnGuardarModal} 
                                    onClick={guardarPlan}
                                    disabled={procesando || !planSeleccionado || planSeleccionado.id === contrato.plan_id}
                                >
                                    {procesando ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Editar Montos */}
            {mostrarModalMontos && (
                <div className={estilos.modalOverlay} onClick={cerrarModalMontos}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <div>
                                <h2>Editar Compensación y Montos</h2>
                                <p>Actualice los montos del contrato</p>
                            </div>
                            <button className={estilos.modalCerrar} onClick={cerrarModalMontos}>
                                <ion-icon name="close"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.modalBody}>
                            <div className={estilos.formGroupModal}>
                                <label>
                                    <ion-icon name="cash-outline"></ion-icon>
                                    Precio del Producto *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formMontos.precio_producto}
                                    onChange={(e) => {
                                        const valor = parseFloat(e.target.value) || 0
                                        setFormMontos(prev => ({ ...prev, precio_producto: valor }))
                                    }}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className={estilos.formGroupModal}>
                                <label>
                                    <ion-icon name="wallet-outline"></ion-icon>
                                    Pago Inicial *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formMontos.pago_inicial}
                                    onChange={(e) => {
                                        const valor = parseFloat(e.target.value) || 0
                                        setFormMontos(prev => ({ ...prev, pago_inicial: valor }))
                                    }}
                                    placeholder="0.00"
                                />
                                {planes.find(p => p.id === contrato.plan_id) && (
                                    <span className={estilos.helperTextModal}>
                                        Mínimo: {formatearMoneda(
                                            (parseFloat(formMontos.precio_producto) || 0) * 
                                            (planes.find(p => p.id === contrato.plan_id).pago_inicial_minimo_pct / 100)
                                        )}
                                    </span>
                                )}
                            </div>

                            <div className={estilos.formGroupModal}>
                                <label>
                                    <ion-icon name="document-text-outline"></ion-icon>
                                    NCF (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={formMontos.ncf}
                                    onChange={(e) => setFormMontos(prev => ({ ...prev, ncf: e.target.value }))}
                                    placeholder="Número de Comprobante Fiscal"
                                />
                            </div>

                            <div className={estilos.resumenMontosModal}>
                                <h4>Resumen</h4>
                                <div className={estilos.resumenFilaModal}>
                                    <span>Monto Financiado</span>
                                    <strong>
                                        {formatearMoneda(
                                            (parseFloat(formMontos.precio_producto) || 0) - 
                                            (parseFloat(formMontos.pago_inicial) || 0)
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className={estilos.modalFooter}>
                                <button className={estilos.btnCancelarModal} onClick={cerrarModalMontos}>
                                    Cancelar
                                </button>
                                <button 
                                    className={estilos.btnGuardarModal} 
                                    onClick={guardarMontos}
                                    disabled={procesando}
                                >
                                    {procesando ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Editar Fiador */}
            {mostrarModalFiador && (
                <div className={estilos.modalOverlay} onClick={cerrarModalFiador}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <div>
                                <h2>Editar Fiador / Garante</h2>
                                <p>Actualice los datos del fiador del contrato</p>
                            </div>
                            <button className={estilos.modalCerrar} onClick={cerrarModalFiador}>
                                <ion-icon name="close"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.modalBody}>
                            {planes.find(p => p.id === contrato.plan_id)?.requiere_fiador && (
                                <div className={estilos.alertaFiadorModal}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <span>Este plan requiere un fiador. Complete todos los campos obligatorios.</span>
                                </div>
                            )}

                            <div className={estilos.formGroupModal}>
                                <label>
                                    <ion-icon name="person-outline"></ion-icon>
                                    Nombre Completo {planes.find(p => p.id === contrato.plan_id)?.requiere_fiador ? '*' : ''}
                                </label>
                                <input
                                    type="text"
                                    value={formFiador.nombre_fiador}
                                    onChange={(e) => setFormFiador(prev => ({ ...prev, nombre_fiador: e.target.value }))}
                                    placeholder="Nombre completo del fiador"
                                />
                            </div>

                            <div className={estilos.formGroupModal}>
                                <label>
                                    <ion-icon name="card-outline"></ion-icon>
                                    Documento {planes.find(p => p.id === contrato.plan_id)?.requiere_fiador ? '*' : ''}
                                </label>
                                <input
                                    type="text"
                                    value={formFiador.documento_fiador}
                                    onChange={(e) => setFormFiador(prev => ({ ...prev, documento_fiador: e.target.value }))}
                                    placeholder="Cédula del fiador"
                                />
                            </div>

                            <div className={estilos.formGroupModal}>
                                <label>
                                    <ion-icon name="call-outline"></ion-icon>
                                    Teléfono {planes.find(p => p.id === contrato.plan_id)?.requiere_fiador ? '*' : ''}
                                </label>
                                <input
                                    type="tel"
                                    value={formFiador.telefono_fiador}
                                    onChange={(e) => setFormFiador(prev => ({ ...prev, telefono_fiador: e.target.value }))}
                                    placeholder="Teléfono del fiador"
                                />
                            </div>

                            <div className={estilos.modalFooter}>
                                <button className={estilos.btnCancelarModal} onClick={cerrarModalFiador}>
                                    Cancelar
                                </button>
                                <button 
                                    className={estilos.btnGuardarModal} 
                                    onClick={guardarFiador}
                                    disabled={procesando}
                                >
                                    {procesando ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Compartir */}
            {mostrarModalCompartir && (
                <div className={estilos.modalOverlay} onClick={() => setMostrarModalCompartir(false)}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>
                                <ion-icon name="share-social-outline"></ion-icon>
                                Compartir Contrato
                            </h3>
                            <button onClick={() => setMostrarModalCompartir(false)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <div className={estilos.compartirOpciones}>
                                <button 
                                    className={estilos.opcionCompartir}
                                    onClick={manejarCompartirWhatsApp}
                                >
                                    <div className={estilos.iconoOpcion} style={{background: '#25D366'}}>
                                        <ion-icon name="logo-whatsapp"></ion-icon>
                                    </div>
                                    <div className={estilos.textoOpcion}>
                                        <h4>WhatsApp</h4>
                                        <p>Enviar contrato por WhatsApp</p>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </button>

                                <button 
                                    className={estilos.opcionCompartir}
                                    onClick={manejarEnviarEmail}
                                    disabled={!contrato?.cliente_email || procesandoAccion}
                                >
                                    <div className={estilos.iconoOpcion} style={{background: '#0ea5e9'}}>
                                        <ion-icon name="mail-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.textoOpcion}>
                                        <h4>Email</h4>
                                        <p>
                                            {contrato?.cliente_email 
                                                ? `Enviar a ${contrato.cliente_email}` 
                                                : 'Cliente sin email registrado'}
                                        </p>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </button>

                                <button 
                                    className={estilos.opcionCompartir}
                                    onClick={manejarDescargarPDF}
                                    disabled={procesandoAccion}
                                >
                                    <div className={estilos.iconoOpcion} style={{background: '#ef4444'}}>
                                        <ion-icon name="download-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.textoOpcion}>
                                        <h4>Descargar PDF</h4>
                                        <p>Guardar contrato en tu dispositivo</p>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </button>

                                <button 
                                    className={estilos.opcionCompartir}
                                    onClick={manejarImprimir}
                                    disabled={procesandoAccion}
                                >
                                    <div className={estilos.iconoOpcion} style={{background: '#8b5cf6'}}>
                                        <ion-icon name="print-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.textoOpcion}>
                                        <h4>Imprimir</h4>
                                        <p>Imprimir contrato físico</p>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Notificación */}
            {mostrarModalNotificacion && (
                <div className={estilos.modalOverlay} onClick={() => setMostrarModalNotificacion(false)}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>
                                <ion-icon name="notifications-outline"></ion-icon>
                                Enviar Notificación
                            </h3>
                            <button onClick={() => setMostrarModalNotificacion(false)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <p className={estilos.descripcionModal}>
                                Selecciona el tipo de notificación que deseas enviar al cliente:
                            </p>

                            <div className={estilos.compartirOpciones}>
                                <button 
                                    className={estilos.opcionCompartir}
                                    onClick={() => manejarEnviarNotificacion('creacion')}
                                    disabled={procesandoAccion}
                                >
                                    <div className={estilos.iconoOpcion} style={{background: '#10b981'}}>
                                        <ion-icon name="document-text-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.textoOpcion}>
                                        <h4>Contrato Creado</h4>
                                        <p>Notificar sobre la creación del contrato</p>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </button>

                                <button 
                                    className={estilos.opcionCompartir}
                                    onClick={() => manejarEnviarNotificacion('recordatorio')}
                                    disabled={procesandoAccion}
                                >
                                    <div className={estilos.iconoOpcion} style={{background: '#f59e0b'}}>
                                        <ion-icon name="alarm-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.textoOpcion}>
                                        <h4>Recordatorio de Pago</h4>
                                        <p>Recordar próximo pago pendiente</p>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </button>

                                <button 
                                    className={estilos.opcionCompartir}
                                    onClick={() => manejarEnviarNotificacion('vencimiento')}
                                    disabled={procesandoAccion}
                                >
                                    <div className={estilos.iconoOpcion} style={{background: '#ef4444'}}>
                                        <ion-icon name="warning-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.textoOpcion}>
                                        <h4>Cuota Vencida</h4>
                                        <p>Notificar sobre cuotas vencidas</p>
                                    </div>
                                    <ion-icon name="chevron-forward-outline"></ion-icon>
                                </button>
                            </div>

                            {procesandoAccion && (
                                <div className={estilos.loadingNotificacion}>
                                    <div className={estilos.spinner}></div>
                                    <p>Enviando notificación...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
