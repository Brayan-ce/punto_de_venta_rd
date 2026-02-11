"use client"
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import {
    CreditCard,
    Calendar,
    TrendingUp,
    DollarSign,
    AlertCircle,
    Clock,
    Sparkles,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Edit,
    Wallet,
    Calculator,
    Percent,
    Shield,
    ArrowRight,
    Loader2,
    Star,
    Info
} from 'lucide-react'
import { obtenerPlanPorId } from './servidor'
import { tasaAnualAMensual, calcularAmortizacionFrancesa } from '../../core/finance/calculos'
import estilos from './ver.module.css'

export default function VerPlan({ planId }) {
    const router = useRouter()
    const params = useParams()
    const id = planId || params?.id
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    const [plan, setPlan] = useState(null)
    const [plazoSeleccionadoSimulador, setPlazoSeleccionadoSimulador] = useState(null)

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
        const cargarPlan = async () => {
            if (!id) return

            setCargando(true)
            setError(null)
            try {
                const resultado = await obtenerPlanPorId(id)

                if (resultado.success && resultado.plan) {
                    const planCargado = resultado.plan
                    setPlan(planCargado)
                    
                    // Seleccionar el primer plazo sugerido o el primero disponible para el simulador
                    if (planCargado.plazos && planCargado.plazos.length > 0) {
                        const plazoSugerido = planCargado.plazos.find(p => p.es_sugerido) || planCargado.plazos[0]
                        setPlazoSeleccionadoSimulador(plazoSugerido)
                    }
                } else {
                    setError(resultado.mensaje || 'Plan no encontrado')
                }
            } catch (error) {
                console.error('Error al cargar plan:', error)
                setError('Error al cargar plan')
            } finally {
                setCargando(false)
            }
        }

        cargarPlan()
    }, [id])

    const calcularEjemploCuota = (plazo) => {
        if (!plazo) return null

        const montoEjemplo = 100000
        let pagoInicial = 0
        let montoFinanciado = 0

        // Calcular pago inicial según el tipo
        if (plazo.tipo_pago_inicial === 'PORCENTAJE') {
            pagoInicial = montoEjemplo * (plazo.pago_inicial_valor / 100)
        } else {
            // Monto fijo
            pagoInicial = Math.min(plazo.pago_inicial_valor, montoEjemplo)
        }

        montoFinanciado = montoEjemplo - pagoInicial

        // Si el plazo tiene cuota mensual fija, usarla
        let cuotaMensual = 0
        let totalIntereses = 0
        let totalPagar = 0

        if (plazo.cuota_mensual && plazo.cuota_mensual > 0) {
            cuotaMensual = plazo.cuota_mensual
            totalPagar = cuotaMensual * plazo.plazo_meses
            totalIntereses = totalPagar - montoFinanciado
        } else {
            // Calcular usando amortización francesa
            const tasaMensual = plazo.tasa_mensual_calculada || tasaAnualAMensual(plazo.tasa_anual_calculada || plan?.tasa_interes_anual || 18)
            const amortizacion = calcularAmortizacionFrancesa(montoFinanciado, tasaMensual, plazo.plazo_meses)
            cuotaMensual = amortizacion.cuotaMensual
            totalIntereses = amortizacion.totalIntereses
            totalPagar = amortizacion.totalPagar
        }

        return {
            precioProducto: montoEjemplo,
            pagoInicial: Math.round(pagoInicial * 100) / 100,
            montoFinanciado: Math.round(montoFinanciado * 100) / 100,
            cuotaMensual: Math.round(cuotaMensual * 100) / 100,
            totalIntereses: Math.round(totalIntereses * 100) / 100,
            totalPagar: Math.round(totalPagar * 100) / 100,
            totalConInicial: Math.round((totalPagar + pagoInicial) * 100) / 100
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const ejemploCuota = useMemo(() => {
        return calcularEjemploCuota(plazoSeleccionadoSimulador)
    }, [plazoSeleccionadoSimulador, plan])

    // Obtener plazos ordenados
    const plazosOrdenados = useMemo(() => {
        if (!plan || !plan.plazos || plan.plazos.length === 0) return []
        
        return [...plan.plazos]
            .filter(p => p.activo !== 0 && p.activo !== false)
            .sort((a, b) => {
                // Sugeridos primero
                if (a.es_sugerido && !b.es_sugerido) return -1
                if (!a.es_sugerido && b.es_sugerido) return 1
                // Luego por meses
                return a.plazo_meses - b.plazo_meses
            })
    }, [plan])

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <Loader2 className={estilos.iconoCargando} />
                    <span>Cargando plan de financiamiento...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <div className={estilos.errorIcono}>
                        <AlertCircle size={64} />
                    </div>
                    <h2>Error al cargar el plan</h2>
                    <p>{error}</p>
                    <button className={estilos.btnVolver} onClick={() => router.push('/admin/planes')}>
                        <ArrowLeft size={20} />
                        Volver a Planes
                    </button>
                </div>
            </div>
        )
    }

    if (!plan) return null

    const tienePlazos = plan.tiene_plazos && plazosOrdenados.length > 0
    const esPlanLegacy = !tienePlazos

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Hero Section */}
            <div className={estilos.hero}>
                <div className={estilos.heroContent}>
                    <div className={estilos.heroIcono}>
                        <Image 
                            src="/financias/credit-card.svg" 
                            alt="Plan de Financiamiento"
                            width={80}
                            height={80}
                        />
                    </div>
                    <div className={estilos.heroInfo}>
                        <div className={estilos.heroCodigoWrapper}>
                            <span className={estilos.heroCodigo}>{plan.codigo}</span>
                            {plan.activo === 1 ? (
                                <span className={`${estilos.badge} ${estilos.success}`}>
                                    <CheckCircle2 size={16} />
                                    Activo
                                </span>
                            ) : (
                                <span className={`${estilos.badge} ${estilos.inactive}`}>
                                    <XCircle size={16} />
                                    Inactivo
                                </span>
                            )}
                            {esPlanLegacy && (
                                <span className={`${estilos.badge} ${estilos.warning}`}>
                                    <Info size={16} />
                                    Plan Tradicional
                                </span>
                            )}
                        </div>
                        <h1 className={estilos.heroTitulo}>{plan.nombre}</h1>
                        {plan.descripcion && (
                            <p className={estilos.heroDescripcion}>{plan.descripcion}</p>
                        )}
                    </div>
                </div>
                
                <div className={estilos.heroAcciones}>
                    <button 
                        className={estilos.btnSecundario} 
                        onClick={() => router.push('/admin/planes')}
                    >
                        <ArrowLeft size={20} />
                        Volver
                    </button>
                    <button 
                        className={estilos.btnPrimario} 
                        onClick={() => router.push(`/admin/planes/editar/${id}`)}
                    >
                        <Edit size={20} />
                        Editar Plan
                    </button>
                </div>
            </div>

            {/* Stats Cards - Mostrar información general del plan */}
            <div className={estilos.statsGrid}>
                <div className={`${estilos.statCard} ${estilos.purple}`}>
                    <div className={estilos.statIcono}>
                        <Calendar size={28} />
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>Opciones de Plazo</span>
                        <span className={estilos.statValor}>
                            {tienePlazos ? plazosOrdenados.length : plan.plazo_meses || 'N/A'}
                        </span>
                        <span className={estilos.statUnidad}>
                            {tienePlazos ? 'plazos' : 'meses'}
                        </span>
                    </div>
                    <div className={estilos.statIlustracion}>
                        <Image 
                            src="/financias/bill-receipt.svg" 
                            alt="Plazo"
                            width={60}
                            height={60}
                        />
                    </div>
                </div>

                <div className={`${estilos.statCard} ${estilos.blue}`}>
                    <div className={estilos.statIcono}>
                        <TrendingUp size={28} />
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>Pago Inicial Mínimo</span>
                        <span className={estilos.statValor}>
                            {tienePlazos 
                                ? 'Variable' 
                                : `${plan.pago_inicial_minimo_pct || 15}%`
                            }
                        </span>
                        <span className={estilos.statUnidad}>
                            {tienePlazos ? 'por plazo' : 'del precio'}
                        </span>
                    </div>
                    <div className={estilos.statIlustracion}>
                        <Image 
                            src="/financias/transaction 1.svg" 
                            alt="Tasa"
                            width={60}
                            height={60}
                        />
                    </div>
                </div>

                <div className={`${estilos.statCard} ${estilos.green}`}>
                    <div className={estilos.statIcono}>
                        <Wallet size={28} />
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>Penalidad Mora</span>
                        <span className={estilos.statValor}>{plan.penalidad_mora_pct}%</span>
                        <span className={estilos.statUnidad}>por atraso</span>
                    </div>
                    <div className={estilos.statIlustracion}>
                        <Image 
                            src="/financias/wallet 2.svg" 
                            alt="Pago Inicial"
                            width={60}
                            height={60}
                        />
                    </div>
                </div>

                <div className={`${estilos.statCard} ${estilos.orange}`}>
                    <div className={estilos.statIcono}>
                        <Clock size={28} />
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>Días de Gracia</span>
                        <span className={estilos.statValor}>{plan.dias_gracia || 5}</span>
                        <span className={estilos.statUnidad}>días</span>
                    </div>
                    <div className={estilos.statIlustracion}>
                        <Image 
                            src="/financias/atm.svg" 
                            alt="Mora"
                            width={60}
                            height={60}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className={estilos.contentGrid}>
                {/* Columna Izquierda - Detalles y Plazos */}
                <div className={estilos.detallesColumna}>
                    {/* Plazos Disponibles (si tiene plazos) */}
                    {tienePlazos && (
                        <div className={estilos.card}>
                            <div className={estilos.cardHeader}>
                                <div className={estilos.cardHeaderIcono}>
                                    <Calendar size={24} />
                                </div>
                                <h2 className={estilos.cardTitulo}>Opciones de Plazo</h2>
                            </div>
                            <div className={estilos.cardBody}>
                                <div className={estilos.plazosGrid}>
                                    {plazosOrdenados.map((plazo, index) => (
                                        <div
                                            key={plazo.id || index}
                                            className={`${estilos.plazoCard} ${plazoSeleccionadoSimulador?.id === plazo.id ? estilos.plazoSeleccionado : ''} ${plazo.es_sugerido ? estilos.plazoSugerido : ''}`}
                                            onClick={() => setPlazoSeleccionadoSimulador(plazo)}
                                        >
                                            {plazo.es_sugerido && (
                                                <div className={estilos.plazoSugeridoBadge}>
                                                    <Star size={14} />
                                                    <span>Sugerido</span>
                                                </div>
                                            )}
                                            <div className={estilos.plazoCardHeader}>
                                                <h4>{plazo.plazo_meses} meses</h4>
                                                {plazo.cuota_mensual && (
                                                    <div className={estilos.plazoCuota}>
                                                        Cuota: {formatearMoneda(plazo.cuota_mensual)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={estilos.plazoCardDetalles}>
                                                <div className={estilos.plazoDetalleItem}>
                                                    <span>Pago inicial:</span>
                                                    <strong>
                                                        {plazo.tipo_pago_inicial === 'PORCENTAJE' 
                                                            ? `${plazo.pago_inicial_valor}%`
                                                            : formatearMoneda(plazo.pago_inicial_valor)}
                                                    </strong>
                                                </div>
                                                <div className={estilos.plazoDetalleItem}>
                                                    <span>Tasa anual:</span>
                                                    <strong>{plazo.tasa_anual_calculada?.toFixed(2) || 'N/A'}%</strong>
                                                </div>
                                            </div>
                                            {plazoSeleccionadoSimulador?.id === plazo.id && (
                                                <div className={estilos.plazoCheck}>
                                                    <CheckCircle2 size={20} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Términos Financieros */}
                    <div className={estilos.card}>
                        <div className={estilos.cardHeader}>
                            <div className={estilos.cardHeaderIcono}>
                                <DollarSign size={24} />
                            </div>
                            <h2 className={estilos.cardTitulo}>Términos Financieros</h2>
                        </div>
                        <div className={estilos.cardBody}>
                            {esPlanLegacy && plan.tasa_interes_anual && (
                                <div className={estilos.detalleRow}>
                                    <div className={estilos.detalleIcono}>
                                        <Percent size={20} />
                                    </div>
                                    <div className={estilos.detalleInfo}>
                                        <span className={estilos.detalleLabel}>Tasa Anual</span>
                                        <span className={estilos.detalleValor}>
                                            {plan.tasa_interes_anual}%
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className={estilos.detalleRow}>
                                <div className={estilos.detalleIcono}>
                                    <DollarSign size={20} />
                                </div>
                                <div className={estilos.detalleInfo}>
                                    <span className={estilos.detalleLabel}>Monto Mínimo</span>
                                    <span className={estilos.detalleValor}>
                                        {plan.monto_minimo ? formatearMoneda(plan.monto_minimo) : 'Sin límite'}
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.detalleRow}>
                                <div className={estilos.detalleIcono}>
                                    <DollarSign size={20} />
                                </div>
                                <div className={estilos.detalleInfo}>
                                    <span className={estilos.detalleLabel}>Monto Máximo</span>
                                    <span className={estilos.detalleValor}>
                                        {plan.monto_maximo ? formatearMoneda(plan.monto_maximo) : 'Sin límite'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Penalidades y Beneficios */}
                    <div className={estilos.card}>
                        <div className={estilos.cardHeader}>
                            <div className={estilos.cardHeaderIcono}>
                                <Shield size={24} />
                            </div>
                            <h2 className={estilos.cardTitulo}>Penalidades y Beneficios</h2>
                        </div>
                        <div className={estilos.cardBody}>
                            <div className={estilos.detalleRow}>
                                <div className={estilos.detalleIcono}>
                                    <Clock size={20} />
                                </div>
                                <div className={estilos.detalleInfo}>
                                    <span className={estilos.detalleLabel}>Días de Gracia</span>
                                    <span className={estilos.detalleValor}>{plan.dias_gracia} días</span>
                                </div>
                            </div>

                            <div className={estilos.detalleRow}>
                                <div className={estilos.detalleIcono}>
                                    <Sparkles size={20} />
                                </div>
                                <div className={estilos.detalleInfo}>
                                    <span className={estilos.detalleLabel}>Descuento Pago Anticipado</span>
                                    <span className={estilos.detalleValor}>{plan.descuento_pago_anticipado_pct || 0}%</span>
                                </div>
                            </div>

                            <div className={estilos.detalleRow}>
                                <div className={estilos.detalleIcono}>
                                    <Calendar size={20} />
                                </div>
                                <div className={estilos.detalleInfo}>
                                    <span className={estilos.detalleLabel}>Cuotas Mínimas Anticipadas</span>
                                    <span className={estilos.detalleValor}>{plan.cuotas_minimas_anticipadas || 3}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuración */}
                    <div className={estilos.card}>
                        <div className={estilos.cardHeader}>
                            <div className={estilos.cardHeaderIcono}>
                                <Shield size={24} />
                            </div>
                            <h2 className={estilos.cardTitulo}>Configuración</h2>
                        </div>
                        <div className={estilos.cardBody}>
                            <div className={estilos.configGrid}>
                                <div className={estilos.configItem}>
                                    <div className={estilos.configIcono}>
                                        {plan.permite_pago_anticipado === 1 ? (
                                            <CheckCircle2 size={20} className={estilos.iconoSuccess} />
                                        ) : (
                                            <XCircle size={20} className={estilos.iconoError} />
                                        )}
                                    </div>
                                    <div className={estilos.configInfo}>
                                        <strong>Pago Anticipado</strong>
                                        <span>{plan.permite_pago_anticipado === 1 ? 'Permitido' : 'No permitido'}</span>
                                    </div>
                                </div>

                                <div className={estilos.configItem}>
                                    <div className={estilos.configIcono}>
                                        {plan.requiere_fiador === 1 ? (
                                            <CheckCircle2 size={20} className={estilos.iconoWarning} />
                                        ) : (
                                            <XCircle size={20} className={estilos.iconoSuccess} />
                                        )}
                                    </div>
                                    <div className={estilos.configInfo}>
                                        <strong>Fiador</strong>
                                        <span>{plan.requiere_fiador === 1 ? 'Requerido' : 'No requerido'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha - Simulador */}
                <div className={estilos.ejemploColumna}>
                    <div className={estilos.ejemploCard}>
                        <div className={estilos.ejemploHeader}>
                            <div className={estilos.ejemploIlustracion}>
                                <Image 
                                    src="/financias/pos-machine.svg" 
                                    alt="Calculadora"
                                    width={100}
                                    height={100}
                                />
                            </div>
                            <h3>Simulador de Financiamiento</h3>
                            <p>Ejemplo con producto de {formatearMoneda(100000)}</p>
                            {tienePlazos && !plazoSeleccionadoSimulador && (
                                <p className={estilos.ayudaSeleccion}>
                                    <Info size={16} />
                                    Seleccione un plazo para ver el simulador
                                </p>
                            )}
                        </div>

                        {ejemploCuota && (tienePlazos ? plazoSeleccionadoSimulador : true) && (
                            <div className={estilos.ejemploPasos}>
                                {/* Paso 1 */}
                                <div className={estilos.paso}>
                                    <div className={estilos.pasoNumero}>1</div>
                                    <div className={estilos.pasoInfo}>
                                        <div className={estilos.pasoHeader}>
                                            <DollarSign size={18} />
                                            <h4>Precio del Producto</h4>
                                        </div>
                                        <p className={estilos.pasoValor}>{formatearMoneda(ejemploCuota.precioProducto)}</p>
                                    </div>
                                </div>

                                <ArrowRight className={estilos.flechaPaso} />

                                {/* Paso 2 */}
                                <div className={estilos.paso}>
                                    <div className={estilos.pasoNumero}>2</div>
                                    <div className={estilos.pasoInfo}>
                                        <div className={estilos.pasoHeader}>
                                            <Wallet size={18} />
                                            <h4>Pago Inicial</h4>
                                        </div>
                                        <p className={estilos.pasoValor}>{formatearMoneda(ejemploCuota.pagoInicial)}</p>
                                        <span className={estilos.pasoDescripcion}>
                                            {tienePlazos && plazoSeleccionadoSimulador
                                                ? (plazoSeleccionadoSimulador.tipo_pago_inicial === 'PORCENTAJE'
                                                    ? `${plazoSeleccionadoSimulador.pago_inicial_valor}% del precio`
                                                    : 'Monto fijo')
                                                : `${plan.pago_inicial_minimo_pct || 15}% del precio`}
                                        </span>
                                    </div>
                                </div>

                                <ArrowRight className={estilos.flechaPaso} />

                                {/* Paso 3 */}
                                <div className={estilos.paso}>
                                    <div className={estilos.pasoNumero}>3</div>
                                    <div className={estilos.pasoInfo}>
                                        <div className={estilos.pasoHeader}>
                                            <CreditCard size={18} />
                                            <h4>Monto a Financiar</h4>
                                        </div>
                                        <p className={estilos.pasoValor}>{formatearMoneda(ejemploCuota.montoFinanciado)}</p>
                                    </div>
                                </div>

                                <ArrowRight className={estilos.flechaPaso} />

                                {/* Paso 4 */}
                                <div className={`${estilos.paso} ${estilos.pasoDestacado}`}>
                                    <div className={estilos.pasoNumero}>4</div>
                                    <div className={estilos.pasoInfo}>
                                        <div className={estilos.pasoHeader}>
                                            <Calendar size={18} />
                                            <h4>Cuota Mensual</h4>
                                        </div>
                                        <p className={estilos.pasoValor}>{formatearMoneda(ejemploCuota.cuotaMensual)}</p>
                                        <span className={estilos.pasoDescripcion}>
                                            Durante {tienePlazos && plazoSeleccionadoSimulador 
                                                ? plazoSeleccionadoSimulador.plazo_meses 
                                                : plan.plazo_meses || 12} meses
                                        </span>
                                    </div>
                                </div>

                                {/* Resumen Final */}
                                <div className={estilos.resumenFinal}>
                                    <div className={estilos.resumenHeader}>
                                        <Calculator size={24} />
                                        <h4>Resumen Total</h4>
                                    </div>
                                    <div className={estilos.resumenBody}>
                                        <div className={estilos.resumenItem}>
                                            <span>Pago inicial</span>
                                            <strong>{formatearMoneda(ejemploCuota.pagoInicial)}</strong>
                                        </div>
                                        <div className={estilos.resumenItem}>
                                            <span>
                                                {tienePlazos && plazoSeleccionadoSimulador
                                                    ? plazoSeleccionadoSimulador.plazo_meses
                                                    : plan.plazo_meses || 12} cuotas mensuales
                                            </span>
                                            <strong>{formatearMoneda(ejemploCuota.totalPagar)}</strong>
                                        </div>
                                        <div className={estilos.resumenSeparador}></div>
                                        <div className={estilos.resumenItem}>
                                            <span>Intereses totales</span>
                                            <strong className={estilos.intereses}>
                                                {formatearMoneda(ejemploCuota.totalIntereses)}
                                            </strong>
                                        </div>
                                        <div className={estilos.resumenSeparador}></div>
                                        <div className={estilos.resumenTotal}>
                                            <span>Total a pagar</span>
                                            <strong>{formatearMoneda(ejemploCuota.totalConInicial)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Adicional */}
                                <div className={estilos.infoAdicional}>
                                    <div className={estilos.infoItem}>
                                        <Clock size={16} />
                                        <span>{plan.dias_gracia} días de gracia</span>
                                    </div>
                                    <div className={estilos.infoItem}>
                                        <AlertCircle size={16} />
                                        <span>{plan.penalidad_mora_pct}% penalidad por mora</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
