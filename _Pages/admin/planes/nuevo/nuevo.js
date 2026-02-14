"use client"
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    CreditCard,
    FileText,
    Calendar,
    Percent,
    DollarSign,
    AlertCircle,
    Clock,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    TrendingUp,
    Shield,
    User,
    Wallet,
    Calculator,
    CalendarDays,
    Info,
    Loader2,
    Edit,
    Lock,
    Plus,
    X
} from 'lucide-react'
import { crearPlanFinanciamiento } from './servidor'
import { calcularPlanInverso, generarCronogramaFechas, calcularAmortizacionFrancesa } from '../../core/finance/calculos'
import { PlanService } from '../../core/finance/PlanService'
import { configurarVisualizacion } from '../../core/finance/calculosComerciales'
import estilos from './nuevo.module.css'

export default function NuevoPlan() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [procesando, setProcesando] = useState(false)
    
    const [planForm, setPlanForm] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        monto_minimo: 0,
        monto_maximo: null,
        penalidad_mora_pct: 5.00,
        dias_gracia: 5,
        descuento_pago_anticipado_pct: 0,
        cuotas_minimas_anticipadas: 3,
        activo: true,
        permite_pago_anticipado: true,
        requiere_fiador: false
    })

    const [plazos, setPlazos] = useState([])

    const [modalPlazoAbierto, setModalPlazoAbierto] = useState(false)
    const [modalPlazoEditando, setModalPlazoEditando] = useState(null)
    const [modalPlazoDraft, setModalPlazoDraft] = useState({
        plazo_meses: 12,
        tipo_pago_inicial: 'PORCENTAJE',
        pago_inicial_valor: 15.00,
        cuota_mensual: '',
        es_sugerido: false
    })

    const [resultadoCalculoModal, setResultadoCalculoModal] = useState(null)
    const [calculandoModal, setCalculandoModal] = useState(false)

    const [codigoEditadoManualmente, setCodigoEditadoManualmente] = useState(false)
    const [codigoEditable, setCodigoEditable] = useState(false)

    const plazosComunes = [3, 6, 12, 18, 24, 36]

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
        if (!modalPlazoAbierto) return

        const draft = modalPlazoDraft
        const plazoMeses = Number(draft.plazo_meses)
        const cuotaMensual = Number(draft.cuota_mensual)
        const pagoInicialValor = Number(draft.pago_inicial_valor)

        if (!isNaN(plazoMeses) && plazoMeses > 0 && 
            !isNaN(cuotaMensual) && cuotaMensual > 0 && 
            !isNaN(pagoInicialValor) && pagoInicialValor > 0) {
            setCalculandoModal(true)
            
            const timeoutId = setTimeout(() => {
                try {
                    const tipoPlan = PlanService.determinarTipoPlan(plazoMeses)
                    
                    const datosPlazo = {
                        plazo_meses: plazoMeses,
                        tipo_pago_inicial: draft.tipo_pago_inicial,
                        pago_inicial_valor: pagoInicialValor,
                        cuota_mensual: cuotaMensual,
                        recargo_tipo: draft.recargo_tipo || null,
                        recargo_valor: draft.recargo_valor || null
                    }

                    const resultado = PlanService.calcularPlazo(datosPlazo)

                    if (resultado.valido) {
                        const visualizacion = configurarVisualizacion(tipoPlan, plazoMeses)
                        
                        const resultadoModal = {
                            valido: true,
                            tipo_plan: tipoPlan,
                            precio_total: resultado.precio_financiado || resultado.precioTotal || null,
                            monto_financiado: resultado.monto_financiado || resultado.montoFinanciado || null,
                            porcentaje_inicial: resultado.porcentaje_inicial || resultado.porcentajeInicial || 0,
                            mostrar_tasa: visualizacion.mostrarTasa,
                            mostrar_tea: visualizacion.mostrarTEA,
                            mostrar_intereses: visualizacion.mostrarIntereses,
                            mostrar_recargo: visualizacion.mostrarRecargo
                        }

                        if (tipoPlan === 'COMERCIAL') {
                            resultadoModal.recargo = resultado.recargo || null
                            resultadoModal.recargo_tipo = resultado.recargo_tipo || 'FIJO'
                            resultadoModal.recargo_valor = resultado.recargo_valor !== null && resultado.recargo_valor !== undefined 
                                ? resultado.recargo_valor 
                                : (resultado.recargo_tipo === 'PORCENTAJE' ? 5 : 1000)
                            resultadoModal.tasa_anual_calculada = null
                            resultadoModal.tasa_mensual_calculada = null
                            resultadoModal.total_intereses = null
                            resultadoModal.mensaje_tipo = 'Este plan corresponde a una venta cash diferida, donde el margen comercial está incorporado en el precio total. No se aplican intereses financieros.'
                        } else {
                            resultadoModal.tasa_anual_calculada = resultado.tasa_anual_calculada
                            resultadoModal.tasa_mensual_calculada = resultado.tasa_mensual_calculada
                            resultadoModal.total_intereses = resultado.totalIntereses || null
                            
                            if (plazoMeses <= 8) {
                                resultadoModal.mensaje_tipo = `Este plan tiene un plazo corto (${plazoMeses} meses). La tasa anual es solo informativa. El costo real del crédito se muestra en intereses totales.`
                            } else {
                                const tasaAnual = resultado.tasa_anual_calculada
                                const tasaEnRango = tasaAnual >= 20 && tasaAnual <= 50
                                resultadoModal.tasa_en_rango = tasaEnRango
                                resultadoModal.mensaje_rango = tasaEnRango 
                                    ? `Este plan tiene una tasa dentro del rango esperado (${tasaAnual.toFixed(2)}%).`
                                    : `Advertencia: La tasa calculada (${tasaAnual.toFixed(2)}%) está fuera del rango típico (20-50%).`
                            }
                        }
                        
                        setResultadoCalculoModal(resultadoModal)
                    } else {
                        setResultadoCalculoModal({ valido: false, error: resultado.error })
                    }
                } catch (error) {
                    console.error('Error al calcular:', error)
                    setResultadoCalculoModal({ valido: false, error: 'Error al calcular el plan' })
                } finally {
                    setCalculandoModal(false)
                }
            }, 400)

            return () => clearTimeout(timeoutId)
        } else {
            setResultadoCalculoModal(null)
            setCalculandoModal(false)
        }
    }, [modalPlazoDraft, modalPlazoAbierto])

    useEffect(() => {
        if (!codigoEditadoManualmente && planForm.nombre) {
            const nombreNormalizado = planForm.nombre
                .toUpperCase()
                .replace(/\s+/g, '_')
                .replace(/[^A-Z0-9_]/g, '')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '')
                .slice(0, 15)
            const codigoGenerado = `PLAN_${nombreNormalizado}`.slice(0, 20)
            if (codigoGenerado) {
                setPlanForm(prev => ({
                    ...prev,
                    codigo: codigoGenerado
                }))
            }
        }
    }, [planForm.nombre, codigoEditadoManualmente])

    const manejarCambio = (e) => {
        const { name, value, type, checked } = e.target
        
        if (name === 'codigo') {
            return
        }
        
        const camposNumericos = ['monto_minimo', 'monto_maximo', 'penalidad_mora_pct', 'dias_gracia', 
                                 'descuento_pago_anticipado_pct', 'cuotas_minimas_anticipadas']
        
        if (type === 'number' && camposNumericos.includes(name)) {
            setPlanForm(prev => ({
            ...prev,
                [name]: value === '' ? '' : value
            }))
        } else {
            setPlanForm(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }))
        }
    }

    const fechaMinima = useMemo(() => {
        const hoy = new Date()
        return hoy.toISOString().split('T')[0]
    }, [])

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return ''
        return new Date(fecha).toLocaleDateString('es-DO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const obtenerColorTasa = (tasa) => {
        if (!tasa) return 'normal'
        if (tasa > 150) return 'critico'
        if (tasa > 100) return 'alto'
        if (tasa > 50) return 'medio'
        return 'normal'
    }

    const validarPorcentajeInicial = (porcentaje) => {
        if (!porcentaje) return { valido: true, advertencia: null }
        if (porcentaje < 5) {
            return {
                valido: true,
                advertencia: 'El porcentaje inicial es muy bajo comercialmente (< 5%). Considere aumentar el pago inicial.'
            }
        }
        return { valido: true, advertencia: null }
    }

    const abrirModalNuevoPlazo = () => {
        setModalPlazoEditando(null)
        setModalPlazoDraft({
            plazo_meses: 12,
            tipo_pago_inicial: 'PORCENTAJE',
            pago_inicial_valor: 15.00,
            cuota_mensual: '',
            es_sugerido: false
        })
        setResultadoCalculoModal(null)
        setModalPlazoAbierto(true)
    }

    const abrirModalConPreset = (meses) => {
        setModalPlazoEditando(null)
        
        let pagoInicialPct = 15.00
        let cuotaMensualSugerida = ''
        
        if (meses === 3) {
            pagoInicialPct = 35.00
            cuotaMensualSugerida = 11000
        } else if (meses === 6) {
            pagoInicialPct = 25.00
            cuotaMensualSugerida = 6500
        } else if (meses <= 12) {
            pagoInicialPct = 20.00
            cuotaMensualSugerida = 3800
        } else if (meses <= 18) {
            pagoInicialPct = 18.00
            cuotaMensualSugerida = 2600
        } else if (meses <= 24) {
            pagoInicialPct = 15.00
            cuotaMensualSugerida = 2000
        } else if (meses <= 36) {
            pagoInicialPct = 12.00
            cuotaMensualSugerida = 1500
        } else {
            pagoInicialPct = 10.00
            cuotaMensualSugerida = 1200
        }
        
        setModalPlazoDraft({
            plazo_meses: meses,
            tipo_pago_inicial: 'PORCENTAJE',
            pago_inicial_valor: pagoInicialPct,
            cuota_mensual: cuotaMensualSugerida,
            es_sugerido: false
        })
        setResultadoCalculoModal(null)
        setModalPlazoAbierto(true)
    }

    const abrirModalEditarPlazo = (plazo, index) => {
        setModalPlazoEditando(index)
        setModalPlazoDraft({
            plazo_meses: plazo.plazo_meses || '',
            tipo_pago_inicial: plazo.tipo_pago_inicial || 'PORCENTAJE',
            pago_inicial_valor: plazo.pago_inicial_valor || '',
            cuota_mensual: plazo.cuota_mensual || '',
            es_sugerido: plazo.es_sugerido || false
        })
        
        if (plazo.tasa_anual_calculada && plazo.tasa_mensual_calculada && plazo.cuota_mensual && plazo.plazo_meses) {
            try {
                const tasaMensual = plazo.tasa_mensual_calculada
                const plazoMeses = plazo.plazo_meses
                const cuotaMensual = plazo.cuota_mensual
                
                const factor = Math.pow(1 + tasaMensual, plazoMeses)
                const valorPresente = cuotaMensual * ((factor - 1) / (tasaMensual * factor))
                const montoFinanciado = valorPresente
                
                let precioTotal = 0
                let pagoInicialReal = 0
                
                if (plazo.tipo_pago_inicial === 'PORCENTAJE') {
                    precioTotal = montoFinanciado / (1 - (plazo.pago_inicial_valor / 100))
                    pagoInicialReal = precioTotal * (plazo.pago_inicial_valor / 100)
                } else {
                    pagoInicialReal = plazo.pago_inicial_valor
                    precioTotal = pagoInicialReal + montoFinanciado
                }
                
                const amortizacion = calcularAmortizacionFrancesa(
                    montoFinanciado,
                    tasaMensual,
                    plazoMeses
                )
                
                const porcentajeInicial = precioTotal > 0 
                    ? (pagoInicialReal / precioTotal) * 100 
                    : 0
                
                const tipoPlan = plazo.tipo_plan || PlanService.determinarTipoPlan(plazoMeses)
                
                setResultadoCalculoModal({
                    valido: true,
                    tipo_plan: tipoPlan,
                    tasa_anual_calculada: plazo.tasa_anual_calculada,
                    tasa_mensual_calculada: plazo.tasa_mensual_calculada,
                    precio_total: precioTotal,
                    monto_financiado: montoFinanciado,
                    total_intereses: amortizacion.totalIntereses,
                    porcentaje_inicial: porcentajeInicial,
                    recargo_tipo: plazo.recargo_tipo || null,
                    recargo_valor: plazo.recargo_valor || null,
                    recargo: plazo.recargo_valor || null,
                    mostrar_tasa: plazo.mostrar_tasa !== false,
                    mostrar_tea: plazo.mostrar_tea !== false,
                    mostrar_intereses: tipoPlan === 'FINANCIERO',
                    mostrar_recargo: tipoPlan === 'COMERCIAL'
                })
            } catch (error) {
                console.error('Error al calcular valores del plazo:', error)
                setResultadoCalculoModal({
                    valido: true,
                    tipo_plan: plazo.tipo_plan || 'FINANCIERO',
                    tasa_anual_calculada: plazo.tasa_anual_calculada,
                    tasa_mensual_calculada: plazo.tasa_mensual_calculada
                })
            }
        }
        setModalPlazoAbierto(true)
    }

    const validarPlazoModal = () => {
        const errores = []

        const plazoMeses = Number(modalPlazoDraft.plazo_meses)
        const pagoInicialValor = Number(modalPlazoDraft.pago_inicial_valor)
        const cuotaMensual = Number(modalPlazoDraft.cuota_mensual)

        if (!modalPlazoDraft.plazo_meses || isNaN(plazoMeses) || plazoMeses < 1 || plazoMeses > 60) {
            errores.push('El plazo debe estar entre 1 y 60 meses')
        }

        if (!modalPlazoDraft.pago_inicial_valor || isNaN(pagoInicialValor) || pagoInicialValor <= 0) {
            errores.push('El valor del pago inicial debe ser mayor a 0')
        }

        if (modalPlazoDraft.tipo_pago_inicial === 'PORCENTAJE' && !isNaN(pagoInicialValor) && pagoInicialValor > 100) {
            errores.push('El porcentaje de pago inicial no puede ser mayor a 100%')
        }

        if (!modalPlazoDraft.cuota_mensual || isNaN(cuotaMensual) || cuotaMensual <= 0) {
            errores.push('La cuota mensual debe ser mayor a 0')
        }

        if (!isNaN(plazoMeses)) {
            const existeDuplicado = plazos.some((p, i) => 
                i !== modalPlazoEditando && 
                Number(p.plazo_meses) === plazoMeses
            )
            if (existeDuplicado) {
                errores.push(`Ya existe un plazo de ${plazoMeses} meses`)
            }
        }
        
        return { 
            valido: errores.length === 0,
            errores
        }
    }

    const guardarPlazoModal = () => {
        const validacion = validarPlazoModal()
        if (!validacion.valido) {
            alert(validacion.errores.join('\n'))
            return
        }

        if (!resultadoCalculoModal?.valido) {
            alert('Debe calcular el plan antes de guardar. Verifique que todos los campos estén completos.')
            return
        }
        
        const tipoPlan = resultadoCalculoModal.tipo_plan || PlanService.determinarTipoPlan(Number(modalPlazoDraft.plazo_meses))
        
        if (tipoPlan === 'FINANCIERO' && !resultadoCalculoModal.tasa_anual_calculada) {
            alert('Debe calcular la tasa antes de guardar un plan financiero.')
            return
        }
        
        const nuevoPlazo = {
            plazo_meses: Number(modalPlazoDraft.plazo_meses),
            tipo_pago_inicial: modalPlazoDraft.tipo_pago_inicial,
            pago_inicial_valor: Number(modalPlazoDraft.pago_inicial_valor),
            cuota_mensual: Number(modalPlazoDraft.cuota_mensual),
            es_sugerido: modalPlazoDraft.es_sugerido,
            tipo_plan: tipoPlan,
            recargo_tipo: tipoPlan === 'COMERCIAL' 
                ? (resultadoCalculoModal.recargo_tipo || 'FIJO')
                : null,
            recargo_valor: tipoPlan === 'COMERCIAL' 
                ? (resultadoCalculoModal.recargo_valor !== null && resultadoCalculoModal.recargo_valor !== undefined 
                    ? resultadoCalculoModal.recargo_valor 
                    : (resultadoCalculoModal.recargo_tipo === 'PORCENTAJE' ? 5 : 1000))
                : null,
            precio_financiado: resultadoCalculoModal.precio_total || null,
            tasa_anual_calculada: resultadoCalculoModal.tasa_anual_calculada || null,
            tasa_mensual_calculada: resultadoCalculoModal.tasa_mensual_calculada || null,
            mostrar_tasa: resultadoCalculoModal.mostrar_tasa !== false,
            mostrar_tea: resultadoCalculoModal.mostrar_tea !== false
        }

        if (modalPlazoEditando !== null) {
            setPlazos(prev => {
                const nuevo = [...prev]
                nuevo[modalPlazoEditando] = nuevoPlazo
                return nuevo
            })
        } else {
            setPlazos(prev => [...prev, nuevoPlazo])
        }

        cerrarModalPlazo()
    }

    const eliminarPlazo = (index) => {
        if (confirm('¿Está seguro de eliminar esta opción de plazo?')) {
            setPlazos(prev => prev.filter((_, i) => i !== index))
        }
    }

    const cerrarModalPlazo = () => {
        setModalPlazoAbierto(false)
        setModalPlazoEditando(null)
        setModalPlazoDraft({
            plazo_meses: 12,
            tipo_pago_inicial: 'PORCENTAJE',
            pago_inicial_valor: 15.00,
            cuota_mensual: '',
            es_sugerido: false
        })
        setResultadoCalculoModal(null)
    }

    const guardarPlan = async () => {
        if (!planForm.nombre) {
            alert('El nombre del plan es obligatorio')
            return
        }

        if (plazos.length === 0) {
            alert('Debe configurar al menos una opción de plazo')
            return
        }

        if (!planForm.codigo && planForm.nombre) {
            const nombreNormalizado = planForm.nombre
                .toUpperCase()
                .replace(/\s+/g, '_')
                .replace(/[^A-Z0-9_]/g, '')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '')
                .slice(0, 15)
            const codigoGenerado = `PLAN_${nombreNormalizado}`.slice(0, 20)
            setPlanForm(prev => ({ ...prev, codigo: codigoGenerado }))
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        if (!planForm.codigo) {
            alert('No se pudo generar el código automáticamente. Por favor, ingrese un código manualmente.')
            return
        }

        setProcesando(true)
        try {
            const datosParaEnviar = {
                ...planForm,
                penalidad_mora_pct: planForm.penalidad_mora_pct === '' ? 5.00 : Number(planForm.penalidad_mora_pct) || 5.00,
                dias_gracia: planForm.dias_gracia === '' ? 5 : Number(planForm.dias_gracia) || 5,
                descuento_pago_anticipado_pct: planForm.descuento_pago_anticipado_pct === '' ? 0 : Number(planForm.descuento_pago_anticipado_pct) || 0,
                cuotas_minimas_anticipadas: planForm.cuotas_minimas_anticipadas === '' ? 3 : Number(planForm.cuotas_minimas_anticipadas) || 3,
                monto_minimo: planForm.monto_minimo === '' ? 0 : Number(planForm.monto_minimo) || 0,
                monto_maximo: planForm.monto_maximo === '' || planForm.monto_maximo === null ? null : Number(planForm.monto_maximo),
                plazos: plazos
            }

            const resultado = await crearPlanFinanciamiento(datosParaEnviar)

            if (resultado.success) {
                if (resultado.codigo && resultado.codigo !== planForm.codigo) {
                    alert(`Plan creado exitosamente con ${resultado.plazos_creados?.length || plazos.length} opciones de plazo.\n\nEl código fue ajustado automáticamente a:\n${resultado.codigo}\n\n(El código original ya existía en el sistema)`)
                } else {
                    alert(resultado.mensaje || `Plan creado exitosamente con ${resultado.plazos_creados?.length || plazos.length} opciones de plazo`)
                }
                router.push('/admin/planes')
            } else {
                alert(resultado.mensaje || 'Error al crear plan')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al crear plan')
        } finally {
            setProcesando(false)
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <CreditCard className={estilos.iconoTitulo} />
                    <div>
                        <h1 className={estilos.titulo}>Nuevo Plan de Financiamiento</h1>
                        <p className={estilos.subtitulo}>
                            Ingrese los montos concretos y el sistema calculará automáticamente la tasa de interés
                        </p>
                    </div>
                </div>
            </div>

            <div className={estilos.contenedorPrincipal}>
                <div className={estilos.columnaFormulario}>
                    <div className={estilos.seccion}>
                        <div className={estilos.seccionHeader}>
                            <FileText className={estilos.seccionIcono} />
                            <h2 className={estilos.seccionTitulo}>Información Básica</h2>
                        </div>
                        <div className={estilos.formGrid}>
                                <input
                                type="hidden"
                                    name="codigo"
                                value={planForm.codigo}
                                />

                            <div className={estilos.formGroup}>
                                <label>
                                    <CreditCard size={16} />
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={planForm.nombre}
                                    onChange={manejarCambio}
                                    placeholder="Ej: Plan Crédito Flexible"
                                    required
                                />
                            </div>

                            <div className={`${estilos.formGroup} ${estilos.fullWidth}`}>
                                <label>
                                    <FileText size={16} />
                                    Descripción
                                </label>
                                <textarea
                                    name="descripcion"
                                    value={planForm.descripcion}
                                    onChange={manejarCambio}
                                    placeholder="Descripción opcional del plan..."
                                    rows="3"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={estilos.seccion}>
                        <div className={estilos.seccionHeader}>
                            <Calculator className={estilos.seccionIcono} />
                            <h2 className={estilos.seccionTitulo}>Opciones de Plazo</h2>
                            <div className={estilos.badgeInfo}>
                                <Info size={14} />
                                <span>Configure múltiples opciones de plazo para este plan</span>
                            </div>
                        </div>
                        
                        <div className={estilos.bannerTipoPlan}>
                            <div className={estilos.bannerTipoPlanHeader}>
                                <Info size={16} />
                                <span>Tipo de plan (detectado automáticamente)</span>
                            </div>
                            <div className={estilos.bannerTipoPlanContent}>
                                <div className={estilos.bannerTipoPlanItem}>
                                    <div className={`${estilos.badgeTipoPlan} ${estilos.badgeComercial}`}>
                                        <CheckCircle2 size={14} />
                                        <span>Plan Comercial (Cash / Pago diferido)</span>
                                    </div>
                                    <p className={estilos.bannerTipoPlanDescripcion}>
                                        Plazos de 1-4 meses. Sin intereses financieros. El margen está incluido en el precio.
                                    </p>
                                </div>
                                <div className={estilos.bannerTipoPlanItem}>
                                    <div className={`${estilos.badgeTipoPlan} ${estilos.badgeFinanciero}`}>
                                        <TrendingUp size={14} />
                                        <span>Plan Financiero</span>
                                    </div>
                                    <p className={estilos.bannerTipoPlanDescripcion}>
                                        Plazos de 5+ meses. Aplica intereses según plazo y cuota. Incluye cálculo de tasa y total de intereses.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {plazos.length === 0 ? (
                            <div className={estilos.sinPlazos}>
                                <Calculator size={48} />
                                <p>No hay opciones de plazo registradas</p>
                                <small>Agregue al menos una opción de plazo para continuar</small>
                                    </div>
                        ) : (
                            <div className={estilos.listaPlazos}>
                                {plazos
                                    .sort((a, b) => a.plazo_meses - b.plazo_meses)
                                    .map((plazo, index) => (
                                        <div key={index} className={estilos.plazoCard}>
                                            <div className={estilos.plazoHeader}>
                                                <span className={estilos.plazoMeses}>
                                                    {plazo.plazo_meses} meses
                                                    </span>
                                                {plazo.es_sugerido && (
                                                    <span className={estilos.badgeSugerido}>
                                                        <Sparkles size={14} />
                                                        Sugerido
                                                    </span>
                                                )}
                                                </div>
                                            <div className={estilos.plazoDetalles}>
                                                <div className={estilos.plazoDetalleItem}>
                                                    <Wallet size={14} />
                                                    <span>
                                                        Inicial: {plazo.tipo_pago_inicial === 'PORCENTAJE' 
                                                            ? `${plazo.pago_inicial_valor}%`
                                                            : formatearMoneda(plazo.pago_inicial_valor)}
                                                    </span>
                                                </div>
                                                <div className={estilos.plazoDetalleItem}>
                                                    <CreditCard size={14} />
                                                    <span>Cuota: {formatearMoneda(plazo.cuota_mensual)}</span>
                            </div>
                                                {plazo.tipo_plan === 'FINANCIERO' && plazo.mostrar_tasa && (
                                                    <div className={estilos.plazoDetalleItem}>
                                                        <TrendingUp size={14} />
                                                        <span>
                                                            Tasa: {plazo.tasa_anual_calculada?.toFixed(2) || 'N/A'}% anual
                                                            {!plazo.mostrar_tea && ' (corto plazo)'}
                                                        </span>
                                                    </div>
                                                )}
                                                {plazo.tipo_plan === 'COMERCIAL' && (
                                                    <div className={estilos.plazoDetalleItem}>
                                                        <Sparkles size={14} />
                                                        <span>
                                                            {plazo.recargo_tipo === 'FIJO' 
                                                                ? `Recargo: ${formatearMoneda(plazo.recargo_valor)}`
                                                                : `Recargo: ${plazo.recargo_valor}%`}
                                                        </span>
                                                    </div>
                                                )}
                                                </div>
                                            <div className={estilos.plazoAcciones}>
                                                <button
                                                    type="button"
                                                    onClick={() => abrirModalEditarPlazo(plazo, index)}
                                                    className={estilos.btnEditar}
                                                >
                                                    <Edit size={16} />
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarPlazo(index)}
                                                    className={estilos.btnEliminar}
                                                >
                                                    <X size={16} />
                                                    Eliminar
                                                </button>
                                            </div>
                                                    </div>
                                                ))}
                                    </div>
                                )}

                        <div className={estilos.presetsRapidos}>
                            <span className={estilos.presetsLabel}>Plazos sugeridos:</span>
                            <div className={estilos.presetsButtons}>
                                {plazosComunes.map(meses => {
                                    const tipoPlan = PlanService.determinarTipoPlan(meses)
                                    const esComercial = tipoPlan === 'COMERCIAL'
                                    return (
                                        <button
                                            key={meses}
                                            type="button"
                                            onClick={() => abrirModalConPreset(meses)}
                                            className={`${estilos.btnPreset} ${esComercial ? estilos.btnPresetComercial : estilos.btnPresetFinanciero}`}
                                            title={esComercial ? 'Plan Comercial (Cash)' : 'Plan Financiero'}
                                        >
                                            <span className={estilos.btnPresetMeses}>{meses}</span>
                                            <span className={`${estilos.btnPresetBadge} ${esComercial ? estilos.btnPresetBadgeComercial : estilos.btnPresetBadgeFinanciero}`}>
                                                {esComercial ? '🟢 Cash' : '🔵 Crédito'}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                            <small className={estilos.presetsHelper}>
                                Estos plazos cargan valores iniciales y cuotas sugeridas automáticamente.
                            </small>
                        </div>

                        <div className={estilos.agregarPlazoContainer}>
                            <button
                                type="button"
                                onClick={abrirModalNuevoPlazo}
                                className={estilos.btnAgregarPlazo}
                            >
                                <Plus size={18} />
                                Agregar opción de plazo
                            </button>
                            <small className={estilos.agregarPlazoHelper}>
                                El sistema detectará automáticamente si es cash (≤4 meses) o crédito (≥5 meses) según los meses ingresados.
                            </small>
                        </div>
                    </div>

                    <div className={estilos.seccion}>
                        <div className={estilos.seccionHeader}>
                            <AlertCircle className={estilos.seccionIcono} />
                            <h2 className={estilos.seccionTitulo}>Penalidades y Descuentos</h2>
                        </div>
                        <div className={estilos.formGrid}>
                            <div className={estilos.formGroup}>
                                <label>
                                    <AlertCircle size={16} />
                                    Penalidad por Mora (%) *
                                </label>
                                <div className={estilos.inputConIcono}>
                                    <Percent className={estilos.iconoInput} size={18} />
                                    <input
                                        type="number"
                                        name="penalidad_mora_pct"
                                        value={planForm.penalidad_mora_pct}
                                        onChange={manejarCambio}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="5.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={estilos.formGroup}>
                                <label>
                                    <Clock size={16} />
                                    Días de Gracia *
                                </label>
                                <div className={estilos.inputConIcono}>
                                    <Calendar className={estilos.iconoInput} size={18} />
                                    <input
                                        type="number"
                                        name="dias_gracia"
                                        value={planForm.dias_gracia}
                                        onChange={manejarCambio}
                                        min="0"
                                        placeholder="5"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={estilos.formGroup}>
                                <label>
                                    <Sparkles size={16} />
                                    Descuento Pago Anticipado (%)
                                </label>
                                <div className={estilos.inputConIcono}>
                                    <Percent className={estilos.iconoInput} size={18} />
                                    <input
                                        type="number"
                                        name="descuento_pago_anticipado_pct"
                                        value={planForm.descuento_pago_anticipado_pct}
                                        onChange={manejarCambio}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className={estilos.formGroup}>
                                <label>
                                    <Calendar size={16} />
                                    Cuotas Mínimas Anticipadas
                                </label>
                                <input
                                    type="number"
                                    name="cuotas_minimas_anticipadas"
                                    value={planForm.cuotas_minimas_anticipadas}
                                    onChange={manejarCambio}
                                    min="1"
                                    placeholder="3"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={estilos.seccion}>
                        <div className={estilos.seccionHeader}>
                            <Shield className={estilos.seccionIcono} />
                            <h2 className={estilos.seccionTitulo}>Configuración Adicional</h2>
                        </div>
                        <div className={estilos.formGrid}>
                            <div className={estilos.formGroup}>
                                <label>
                                    <DollarSign size={16} />
                                    Monto Mínimo Financiable
                                </label>
                                <div className={estilos.inputConIcono}>
                                    <DollarSign className={estilos.iconoInput} size={18} />
                                    <input
                                        type="number"
                                        name="monto_minimo"
                                        value={planForm.monto_minimo}
                                        onChange={manejarCambio}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                                <small className={estilos.helperText}>
                                    Monto mínimo requerido para aplicar este plan. Dejar en 0 para sin límite mínimo.
                                </small>
                            </div>

                            <div className={estilos.formGroup}>
                                <label>
                                    <DollarSign size={16} />
                                    Monto Máximo
                                </label>
                                <div className={estilos.inputConIcono}>
                                    <DollarSign className={estilos.iconoInput} size={18} />
                                    <input
                                        type="number"
                                        name="monto_maximo"
                                        value={planForm.monto_maximo || ''}
                                        onChange={manejarCambio}
                                        min="0"
                                        step="0.01"
                                        placeholder="Sin límite"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={estilos.togglesContainer}>
                            <div className={estilos.toggleItem}>
                                <div className={estilos.toggleInfo}>
                                    <CheckCircle2 size={20} />
                                    <div>
                                        <strong>Plan Activo</strong>
                                        <span>El plan estará disponible para usar inmediatamente</span>
                                    </div>
                                </div>
                                <label className={estilos.toggle}>
                                    <input
                                        type="checkbox"
                                        name="activo"
                                        checked={planForm.activo}
                                        onChange={manejarCambio}
                                    />
                                    <span className={estilos.toggleSlider}></span>
                                </label>
                            </div>

                            <div className={estilos.toggleItem}>
                                <div className={estilos.toggleInfo}>
                                    <Sparkles size={20} />
                                    <div>
                                        <strong>Permite Pago Anticipado</strong>
                                        <span>Los clientes pueden pagar cuotas por adelantado</span>
                                    </div>
                                </div>
                                <label className={estilos.toggle}>
                                    <input
                                        type="checkbox"
                                        name="permite_pago_anticipado"
                                        checked={planForm.permite_pago_anticipado}
                                        onChange={manejarCambio}
                                    />
                                    <span className={estilos.toggleSlider}></span>
                                </label>
                            </div>

                            <div className={estilos.toggleItem}>
                                <div className={estilos.toggleInfo}>
                                    <User size={20} />
                                    <div>
                                        <strong>Requiere Fiador</strong>
                                        <span>Se necesitará un fiador para aprobar el financiamiento</span>
                                    </div>
                                </div>
                                <label className={estilos.toggle}>
                                    <input
                                        type="checkbox"
                                        name="requiere_fiador"
                                        checked={planForm.requiere_fiador}
                                        onChange={manejarCambio}
                                    />
                                    <span className={estilos.toggleSlider}></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.footer}>
                        <button 
                            className={estilos.btnCancelar} 
                            onClick={() => router.push('/admin/planes')}
                            disabled={procesando}
                        >
                            Cancelar
                        </button>
                        <button 
                            className={estilos.btnGuardar} 
                            onClick={guardarPlan}
                            disabled={procesando || plazos.length === 0}
                        >
                            {procesando ? 'Creando...' : 'Crear Plan'}
                            <CheckCircle2 size={18} />
                        </button>
                    </div>
                </div>

                <div className={estilos.columnaVista}>
                    <div className={estilos.vistaPrevia}>
                        <div className={estilos.vistaPreviaHeader}>
                            <Calculator size={24} />
                            <h3>Resumen del Plan</h3>
                        </div>

                        {plazos.length > 0 ? (
                            <div className={estilos.pasosPlan}>
                                        <div className={estilos.pasoHeader}>
                                    <Calculator size={18} />
                                    <h4>Opciones de Plazo Configuradas</h4>
                                        </div>
                                <div className={estilos.listaPlazosVista}>
                                    {plazos
                                        .sort((a, b) => a.plazo_meses - b.plazo_meses)
                                        .map((plazo, index) => (
                                            <div key={index} className={estilos.plazoCardVista}>
                                                <div className={estilos.plazoHeaderVista}>
                                                    <span className={estilos.plazoMesesVista}>
                                                        {plazo.plazo_meses} meses
                                                    </span>
                                                    {plazo.es_sugerido && (
                                                        <Sparkles size={14} className={estilos.iconoSugerido} />
                                                    )}
                                        </div>
                                                <div className={estilos.plazoDetallesVista}>
                                                    <div>
                                                        <Wallet size={14} />
                                                        <span>
                                                            {plazo.tipo_pago_inicial === 'PORCENTAJE' 
                                                                ? `${plazo.pago_inicial_valor}%`
                                                                : formatearMoneda(plazo.pago_inicial_valor)}
                                                        </span>
                                    </div>
                                                    <div>
                                                        <CreditCard size={14} />
                                                        <span>{formatearMoneda(plazo.cuota_mensual)}</span>
                                </div>
                                                    {plazo.tipo_plan === 'FINANCIERO' && plazo.mostrar_tasa && (
                                                        <div>
                                                            <TrendingUp size={14} />
                                                            <span>{plazo.tasa_anual_calculada?.toFixed(2) || 'N/A'}%</span>
                                                        </div>
                                                    )}
                                                    {plazo.tipo_plan === 'COMERCIAL' && (
                                                        <div>
                                                            <Sparkles size={14} />
                                                            <span>
                                                                {plazo.recargo_tipo === 'FIJO' 
                                                                    ? formatearMoneda(plazo.recargo_valor)
                                                                    : `${plazo.recargo_valor}%`}
                                                            </span>
                                                        </div>
                                                    )}
                                    </div>
                                </div>
                                        ))}
                                </div>

                                <div className={estilos.infoAdicional}>
                                    <div className={estilos.infoItem}>
                                        <Clock size={16} />
                                        <span>{planForm.dias_gracia || 5} días de gracia</span>
                                    </div>
                                    <div className={estilos.infoItem}>
                                        <AlertCircle size={16} />
                                        <span>{planForm.penalidad_mora_pct || 5.00}% penalidad por mora</span>
                                    </div>
                                    {planForm.permite_pago_anticipado && (
                                        <div className={estilos.infoItem}>
                                            <Sparkles size={16} />
                                            <span>Permite pago anticipado</span>
                                        </div>
                                    )}
                                    {planForm.requiere_fiador && (
                                        <div className={estilos.infoItem}>
                                            <User size={16} />
                                            <span>Requiere fiador</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className={estilos.sinCalculo}>
                                <Calculator size={48} />
                                <p>👈 Agregue al menos un plazo para ver cómo se ofrecerá este plan a sus clientes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {modalPlazoAbierto && (
                <div className={estilos.modalOverlay} onClick={cerrarModalPlazo}>
                    <div className={estilos.modalPlazo} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <button
                                type="button"
                                onClick={cerrarModalPlazo}
                                className={estilos.btnCerrarModal}
                                aria-label="Cerrar"
                            >
                                <ArrowRight size={24} style={{ transform: 'rotate(180deg)' }} />
                            </button>
                            <h3>
                                {modalPlazoEditando !== null ? 'Editar' : 'Agregar'} opción plazo
                                {modalPlazoDraft.plazo_meses && (
                                    <span style={{ 
                                        display: 'block', 
                                        fontSize: '14px', 
                                        fontWeight: '400', 
                                        color: '#64748b',
                                        marginTop: '4px'
                                    }}>
                                        {modalPlazoDraft.plazo_meses} {modalPlazoDraft.plazo_meses === 1 ? 'mes' : 'meses'}
                                    </span>
                                )}
                            </h3>
                        </div>

                        <div className={estilos.modalBody}>
                            {modalPlazoDraft.plazo_meses && (
                                <div className={`${estilos.bannerTipoPlanModal} ${
                                    PlanService.determinarTipoPlan(Number(modalPlazoDraft.plazo_meses)) === 'COMERCIAL' 
                                        ? estilos.bannerTipoPlanModalComercial 
                                        : estilos.bannerTipoPlanModalFinanciero
                                }`}>
                                    {PlanService.determinarTipoPlan(Number(modalPlazoDraft.plazo_meses)) === 'COMERCIAL' ? (
                                        <>
                                            <CheckCircle2 size={20} />
                                            <div>
                                                <strong>🟢 Plan Comercial (Cash)</strong>
                                                <span>Pago diferido sin intereses financieros</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp size={20} />
                                            <div>
                                                <strong>🔵 Plan Financiero</strong>
                                                <span>Aplica intereses según plazo y cuota</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className={estilos.modalSeccion}>
                                <h4 className={estilos.modalSeccionTitulo}>
                                    <CalendarDays size={16} />
                                    Configuración del Plazo
                                </h4>
                                <div className={estilos.formGroup}>
                                    <label>Plazo en meses *</label>
                                    <input
                                        type="number"
                                        value={modalPlazoDraft.plazo_meses}
                                        onChange={(e) => {
                                            const valor = e.target.value
                                            setModalPlazoDraft({ ...modalPlazoDraft, plazo_meses: valor === '' ? '' : Number(valor) || '' })
                                        }}
                                        min="1"
                                        max="60"
                                        required
                                        placeholder="Ej: 12"
                                        inputMode="numeric"
                                    />
                                    <small className={estilos.helperText}>
                                        {modalPlazoDraft.plazo_meses ? (
                                            PlanService.determinarTipoPlan(Number(modalPlazoDraft.plazo_meses)) === 'COMERCIAL' 
                                                ? '≤ 4 meses → Cash diferido'
                                                : '≥ 5 meses → Crédito con interés'
                                        ) : 'Ingrese el número de meses'}
                                    </small>
                                </div>
                            </div>

                            <div className={estilos.modalSeccion}>
                                <h4 className={estilos.modalSeccionTitulo}>
                                    <Wallet size={16} />
                                    Datos de Pago Inicial
                                </h4>
                                <div className={estilos.formGroup}>
                                    <label>Tipo de pago inicial *</label>
                                    <div className={estilos.radioGroup}>
                                        <label>
                                            <input
                                                type="radio"
                                                value="PORCENTAJE"
                                                checked={modalPlazoDraft.tipo_pago_inicial === 'PORCENTAJE'}
                                                onChange={(e) => {
                                                    setModalPlazoDraft({ ...modalPlazoDraft, tipo_pago_inicial: e.target.value })
                                                }}
                                            />
                                            Porcentaje (%)
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                value="MONTO"
                                                checked={modalPlazoDraft.tipo_pago_inicial === 'MONTO'}
                                                onChange={(e) => {
                                                    setModalPlazoDraft({ ...modalPlazoDraft, tipo_pago_inicial: e.target.value })
                                                }}
                                            />
                                            Monto fijo (RD$)
                                        </label>
                                    </div>
                                </div>

                                <div className={estilos.formGroup}>
                                    <label>
                                        Valor del pago inicial * 
                                        ({modalPlazoDraft.tipo_pago_inicial === 'PORCENTAJE' ? '%' : 'RD$'})
                                    </label>
                                    <input
                                        type="number"
                                        value={modalPlazoDraft.pago_inicial_valor}
                                        onChange={(e) => {
                                            const valor = e.target.value
                                            setModalPlazoDraft({ ...modalPlazoDraft, pago_inicial_valor: valor === '' ? '' : Number(valor) || '' })
                                        }}
                                        min="0"
                                        step="0.01"
                                        required
                                        placeholder={modalPlazoDraft.tipo_pago_inicial === 'PORCENTAJE' ? 'Ej: 15' : 'Ej: 5000'}
                                    />
                                </div>
                            </div>

                            <div className={estilos.modalSeccion}>
                                <h4 className={estilos.modalSeccionTitulo}>
                                    <CreditCard size={16} />
                                    Cuota Mensual
                                </h4>
                                <div className={estilos.formGroup}>
                                    <label>Cuota mensual (RD$) *</label>
                                    <input
                                        type="number"
                                        value={modalPlazoDraft.cuota_mensual}
                                        onChange={(e) => {
                                            const valor = e.target.value
                                            setModalPlazoDraft({ ...modalPlazoDraft, cuota_mensual: valor === '' ? '' : Number(valor) || '' })
                                        }}
                                        min="0"
                                        step="0.01"
                                        required
                                        placeholder="Ej: 5000"
                                        inputMode="decimal"
                                    />
                                    <small className={estilos.helperText}>
                                        Ajusta la cuota para ver el resultado en tiempo real
                                    </small>
                                </div>
                            </div>

                            {calculandoModal && (
                                <div className={estilos.calculandoModal}>
                                    <Loader2 className={estilos.iconoCargando} size={20} />
                                    <span>Calculando plan...</span>
                                </div>
                            )}

                            {resultadoCalculoModal && resultadoCalculoModal.valido && (
                                <div className={`${estilos.resultadosCalculadosModal} ${estilos.modalSeccion}`}>
                                    <div className={estilos.resultadosHeader}>
                                        <CheckCircle2 className={estilos.resultadosIcono} size={20} />
                                        <h4>
                                            {resultadoCalculoModal.tipo_plan === 'COMERCIAL' 
                                                ? 'Resultados del Plan Cash' 
                                                : 'Resultados Calculados'}
                                        </h4>
                                    </div>
                                    
                                    {resultadoCalculoModal.mensaje_tipo && resultadoCalculoModal.tipo_plan === 'COMERCIAL' && (
                                        <div className={`${estilos.mensajeRango} ${estilos.mensajeRangoExito}`}>
                                            <Info size={16} />
                                            <span>Este plan es cash diferido. La ganancia está incluida en el precio.</span>
                                        </div>
                                    )}
                                    
                                    {resultadoCalculoModal.mensaje_rango && resultadoCalculoModal.tipo_plan === 'FINANCIERO' && (
                                        <div className={`${estilos.mensajeRango} ${resultadoCalculoModal.tasa_en_rango ? estilos.mensajeRangoExito : estilos.mensajeRangoAdvertencia}`}>
                                            <Info size={16} />
                                            <span>
                                                {resultadoCalculoModal.tasa_en_rango 
                                                    ? resultadoCalculoModal.mensaje_rango
                                                    : 'La tasa anual es alta debido al plazo corto.'}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className={estilos.metricasGrid}>
                                        {resultadoCalculoModal.monto_financiado && (
                                            <div className={estilos.metricaCard}>
                                                <div className={estilos.metricaIcono}>
                                                    <DollarSign size={18} />
                                                </div>
                                                <div className={estilos.metricaContent}>
                                                    <span className={estilos.metricaLabel}>Monto Financiado</span>
                                                    <strong className={estilos.metricaValor}>
                                                        {formatearMoneda(resultadoCalculoModal.monto_financiado)}
                                                    </strong>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {resultadoCalculoModal.precio_total && (
                                            <div className={estilos.metricaCard}>
                                                <div className={estilos.metricaIcono}>
                                                    <CreditCard size={18} />
                                                </div>
                                                <div className={estilos.metricaContent}>
                                                    <span className={estilos.metricaLabel}>Precio Total</span>
                                                    <strong className={estilos.metricaValor}>
                                                        {formatearMoneda(resultadoCalculoModal.precio_total)}
                                                    </strong>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {resultadoCalculoModal.mostrar_recargo && resultadoCalculoModal.recargo && (
                                            <div className={estilos.metricaCard}>
                                                <div className={estilos.metricaIcono}>
                                                    <Sparkles size={18} />
                                                </div>
                                                <div className={estilos.metricaContent}>
                                                    <span className={estilos.metricaLabel}>
                                                        Recargo {resultadoCalculoModal.recargo_tipo === 'FIJO' ? '(Fijo)' : '(%)'}
                                                    </span>
                                                    <strong className={estilos.metricaValor}>
                                                        {resultadoCalculoModal.recargo_tipo === 'FIJO' 
                                                            ? formatearMoneda(resultadoCalculoModal.recargo)
                                                            : `${resultadoCalculoModal.recargo_valor}%`}
                                                    </strong>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {resultadoCalculoModal.mostrar_tea && resultadoCalculoModal.tasa_anual_calculada !== null && (
                                            <div className={estilos.metricaCard}>
                                                <div className={estilos.metricaIcono}>
                                                    <TrendingUp size={18} />
                                                </div>
                                                <div className={estilos.metricaContent}>
                                                    <span className={estilos.metricaLabel}>Tasa Anual</span>
                                                    <strong className={`${estilos.metricaValor} ${estilos.tasaAnual}`}>
                                                        {resultadoCalculoModal.tasa_anual_calculada.toFixed(2)}%
                                                    </strong>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {resultadoCalculoModal.mostrar_tasa && resultadoCalculoModal.tasa_mensual_calculada !== null && (
                                            <div className={estilos.metricaCard}>
                                                <div className={estilos.metricaIcono}>
                                                    <Percent size={18} />
                                                </div>
                                                <div className={estilos.metricaContent}>
                                                    <span className={estilos.metricaLabel}>Tasa Mensual</span>
                                                    <strong className={estilos.metricaValor}>
                                                        {(resultadoCalculoModal.tasa_mensual_calculada * 100).toFixed(4)}%
                                                    </strong>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {resultadoCalculoModal.porcentaje_inicial !== null && (
                                            <div className={estilos.metricaCard}>
                                                <div className={estilos.metricaIcono}>
                                                    <Wallet size={18} />
                                                </div>
                                                <div className={estilos.metricaContent}>
                                                    <span className={estilos.metricaLabel}>% Inicial</span>
                                                    <strong className={estilos.metricaValor}>
                                                        {resultadoCalculoModal.porcentaje_inicial.toFixed(2)}%
                                                    </strong>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {resultadoCalculoModal.mostrar_intereses && resultadoCalculoModal.total_intereses !== null && (
                                            <div className={estilos.metricaCard}>
                                                <div className={estilos.metricaIcono}>
                                                    <Calculator size={18} />
                                                </div>
                                                <div className={estilos.metricaContent}>
                                                    <span className={estilos.metricaLabel}>Total Intereses</span>
                                                    <strong className={estilos.metricaValor}>
                                                        {formatearMoneda(resultadoCalculoModal.total_intereses)}
                                                    </strong>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {resultadoCalculoModal && !resultadoCalculoModal.valido && (
                                <div className={estilos.errorCalculoModal}>
                                    <AlertCircle size={16} />
                                    <span>{resultadoCalculoModal.error || 'Error al calcular'}</span>
                                </div>
                            )}

                            <div className={estilos.modalSeccion}>
                                <h4 className={estilos.modalSeccionTitulo}>
                                    <Sparkles size={16} />
                                    Configuración Adicional
                                </h4>
                                <div className={estilos.formGroup}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={modalPlazoDraft.es_sugerido}
                                            onChange={(e) => setModalPlazoDraft({
                                                ...modalPlazoDraft,
                                                es_sugerido: e.target.checked
                                            })}
                                        />
                                        <Sparkles size={18} />
                                        Marcar como plazo sugerido
                                    </label>
                                    <small className={estilos.helperText}>
                                        Se mostrará como opción rápida al vender
                                    </small>
                                </div>
                            </div>

                            {validarPlazoModal().errores.length > 0 && (
                                <div className={estilos.erroresModal}>
                                    {validarPlazoModal().errores.map((error, i) => (
                                        <div key={i} className={estilos.errorItem}>
                                            <AlertCircle size={14} />
                                            {error}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={estilos.modalFooter}>
                            <button
                                type="button"
                                onClick={guardarPlazoModal}
                                disabled={!validarPlazoModal().valido || !resultadoCalculoModal?.valido}
                                className={estilos.btnGuardar}
                            >
                                {modalPlazoEditando !== null ? 'Actualizar' : 'Guardar'} plazo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}