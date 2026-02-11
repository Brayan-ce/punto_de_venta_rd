"use client"
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
    Info,
    Loader2,
    Edit,
    Plus,
    X
} from 'lucide-react'
import { 
    actualizarPlanFinanciamiento, 
    obtenerPlanPorId,
    agregarPlazoPlan,
    actualizarPlazoPlan,
    eliminarPlazoPlan
} from './servidor'
import { calcularPlanInverso, calcularAmortizacionFrancesa } from '../../core/finance/calculos'
import estilos from './editar.module.css'

export default function EditarPlan({ planId }) {
    const router = useRouter()
    const params = useParams()
    const id = planId || params?.id
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [error, setError] = useState(null)
    
    // ⚠️ SEPARACIÓN DE ESTADO: Formulario del plan (separado del modal)
    const [planForm, setPlanForm] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        // Reglas generales (no dependen de plazos)
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

    // Estado de plazos (array) - cargados desde el servidor
    const [plazos, setPlazos] = useState([])
    const [plazosOriginales, setPlazosOriginales] = useState([]) // Para tracking de cambios

    // Estado del modal (temporal, no se guarda hasta confirmar)
    const [modalPlazoAbierto, setModalPlazoAbierto] = useState(false)
    const [modalPlazoEditando, setModalPlazoEditando] = useState(null) // null = crear, plazoId = editar
    const [modalPlazoDraft, setModalPlazoDraft] = useState({
        plazo_meses: 12,
        tipo_pago_inicial: 'PORCENTAJE',
        pago_inicial_valor: 15.00,
        cuota_mensual: '',
        es_sugerido: false
    })

    // Resultados calculados del modal (temporal)
    const [resultadoCalculoModal, setResultadoCalculoModal] = useState(null)
    const [calculandoModal, setCalculandoModal] = useState(false)

    // Plazos predefinidos para presets rápidos
    const plazosComunes = [6, 12, 18, 24, 36]

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

    // Cargar plan existente con plazos
    useEffect(() => {
        const cargarPlan = async () => {
            if (!id) return

            setCargando(true)
            setError(null)
            try {
                const resultado = await obtenerPlanPorId(id)

                if (resultado.success && resultado.plan) {
                    const plan = resultado.plan
                    
                    // Cargar información general del plan
                    setPlanForm({
                        codigo: plan.codigo,
                        nombre: plan.nombre,
                        descripcion: plan.descripcion || '',
                        monto_minimo: plan.monto_minimo || 0,
                        monto_maximo: plan.monto_maximo || null,
                        penalidad_mora_pct: plan.penalidad_mora_pct || 5.00,
                        dias_gracia: plan.dias_gracia || 5,
                        descuento_pago_anticipado_pct: plan.descuento_pago_anticipado_pct || 0,
                        cuotas_minimas_anticipadas: plan.cuotas_minimas_anticipadas || 3,
                        activo: plan.activo === 1,
                        permite_pago_anticipado: plan.permite_pago_anticipado === 1,
                        requiere_fiador: plan.requiere_fiador === 1
                    })

                    // Cargar plazos (si tiene plazos)
                    if (plan.plazos && Array.isArray(plan.plazos) && plan.plazos.length > 0) {
                        const plazosCargados = plan.plazos.map(p => ({
                            id: p.id,
                            plazo_meses: p.plazo_meses,
                            tipo_pago_inicial: p.tipo_pago_inicial,
                            pago_inicial_valor: p.pago_inicial_valor,
                            cuota_mensual: p.cuota_mensual,
                            tasa_anual_calculada: p.tasa_anual_calculada,
                            tasa_mensual_calculada: p.tasa_mensual_calculada,
                            es_sugerido: p.es_sugerido === 1 || p.es_sugerido === true,
                            activo: p.activo === 1 || p.activo === true
                        }))
                        setPlazos(plazosCargados)
                        setPlazosOriginales(plazosCargados)
                    } else {
                        setPlazos([])
                        setPlazosOriginales([])
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

    // Calcular tasa en el modal cuando cambian los datos (con debounce)
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
                    let pagoInicialReal = 0
                    let precioTotal = 0
                    
                    if (draft.tipo_pago_inicial === 'PORCENTAJE') {
                        const precioEstimadoInicial = cuotaMensual * plazoMeses * 1.3
                        pagoInicialReal = precioEstimadoInicial * (pagoInicialValor / 100)
                    } else {
                        pagoInicialReal = pagoInicialValor
                    }

                    const resultado = calcularPlanInverso(
                        pagoInicialReal,
                        cuotaMensual,
                        plazoMeses
                    )

                    if (resultado.valido) {
                        const tasaMensual = resultado.tasaMensual
                        const factor = Math.pow(1 + tasaMensual, plazoMeses)
                        const valorPresente = cuotaMensual * ((factor - 1) / (tasaMensual * factor))
                        const montoFinanciado = valorPresente
                        
                        if (draft.tipo_pago_inicial === 'PORCENTAJE') {
                            precioTotal = montoFinanciado / (1 - (pagoInicialValor / 100))
                            pagoInicialReal = precioTotal * (pagoInicialValor / 100)
                        } else {
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
                        
                        const tasaAnual = resultado.tasaAnualEfectiva
                        const tasaEnRango = tasaAnual >= 20 && tasaAnual <= 50
                        
                        setResultadoCalculoModal({
                            valido: true,
                            tasa_anual_calculada: resultado.tasaAnualEfectiva,
                            tasa_mensual_calculada: resultado.tasaMensual,
                            precio_total: precioTotal,
                            monto_financiado: montoFinanciado,
                            total_intereses: amortizacion.totalIntereses,
                            porcentaje_inicial: porcentajeInicial,
                            tasa_en_rango: tasaEnRango,
                            mensaje_rango: tasaEnRango 
                                ? `Este plan tiene una tasa dentro del rango esperado (${tasaAnual.toFixed(2)}%).`
                                : `Advertencia: La tasa calculada (${tasaAnual.toFixed(2)}%) está fuera del rango típico (20-50%).`
                        })
                    } else {
                        setResultadoCalculoModal({ valido: false, error: resultado.error })
                    }
                } catch (error) {
                    console.error('Error al calcular:', error)
                    setResultadoCalculoModal({ valido: false, error: 'Error al calcular la tasa' })
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

    const manejarCambio = (e) => {
        const { name, value, type, checked } = e.target
        
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

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    // ============================================
    // FUNCIONES DEL MODAL DE PLAZOS
    // ============================================

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
        
        if (meses <= 6) {
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

    const abrirModalEditarPlazo = (plazo) => {
        setModalPlazoEditando(plazo.id) // Guardar ID del plazo para actualizar
        setModalPlazoDraft({
            plazo_meses: plazo.plazo_meses || '',
            tipo_pago_inicial: plazo.tipo_pago_inicial || 'PORCENTAJE',
            pago_inicial_valor: plazo.pago_inicial_valor || '',
            cuota_mensual: plazo.cuota_mensual || '',
            es_sugerido: plazo.es_sugerido || false
        })
        
        // Calcular todos los valores cuando se carga un plazo existente
        if (plazo.tasa_anual_calculada && plazo.tasa_mensual_calculada && plazo.cuota_mensual && plazo.plazo_meses) {
            try {
                const tasaMensual = plazo.tasa_mensual_calculada
                const plazoMeses = plazo.plazo_meses
                const cuotaMensual = plazo.cuota_mensual
                
                // Calcular monto financiado usando valor presente de las cuotas
                const factor = Math.pow(1 + tasaMensual, plazoMeses)
                const valorPresente = cuotaMensual * ((factor - 1) / (tasaMensual * factor))
                const montoFinanciado = valorPresente
                
                // Calcular precio total y pago inicial
                let precioTotal = 0
                let pagoInicialReal = 0
                
                if (plazo.tipo_pago_inicial === 'PORCENTAJE') {
                    precioTotal = montoFinanciado / (1 - (plazo.pago_inicial_valor / 100))
                    pagoInicialReal = precioTotal * (plazo.pago_inicial_valor / 100)
                } else {
                    pagoInicialReal = plazo.pago_inicial_valor
                    precioTotal = pagoInicialReal + montoFinanciado
                }
                
                // Calcular total de intereses
                const amortizacion = calcularAmortizacionFrancesa(
                    montoFinanciado,
                    tasaMensual,
                    plazoMeses
                )
                
                // Calcular % inicial
                const porcentajeInicial = precioTotal > 0 
                    ? (pagoInicialReal / precioTotal) * 100 
                    : 0
                
                setResultadoCalculoModal({
                    valido: true,
                    tasa_anual_calculada: plazo.tasa_anual_calculada,
                    tasa_mensual_calculada: plazo.tasa_mensual_calculada,
                    precio_total: precioTotal,
                    monto_financiado: montoFinanciado,
                    total_intereses: amortizacion.totalIntereses,
                    porcentaje_inicial: porcentajeInicial
                })
            } catch (error) {
                console.error('Error al calcular valores del plazo:', error)
                // Si hay error, al menos mostrar las tasas
                setResultadoCalculoModal({
                    valido: true,
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

        // Validar duplicados (excepto si está editando el mismo plazo)
        if (!isNaN(plazoMeses)) {
            const existeDuplicado = plazos.some(p => 
                p.id !== modalPlazoEditando && 
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

    const guardarPlazoModal = async () => {
        const validacion = validarPlazoModal()
        if (!validacion.valido) {
            alert(validacion.errores.join('\n'))
            return
        }

        if (!resultadoCalculoModal?.valido) {
            alert('Debe calcular la tasa antes de guardar. Verifique que todos los campos estén completos.')
            return
        }

        setProcesando(true)
        try {
            const datosPlazo = {
                plazo_meses: Number(modalPlazoDraft.plazo_meses),
                tipo_pago_inicial: modalPlazoDraft.tipo_pago_inicial,
                pago_inicial_valor: Number(modalPlazoDraft.pago_inicial_valor),
                cuota_mensual: Number(modalPlazoDraft.cuota_mensual),
                es_sugerido: modalPlazoDraft.es_sugerido,
                tasa_anual_calculada: resultadoCalculoModal.tasa_anual_calculada,
                tasa_mensual_calculada: resultadoCalculoModal.tasa_mensual_calculada
            }

            if (modalPlazoEditando !== null) {
                // Actualizar plazo existente
                const resultado = await actualizarPlazoPlan(modalPlazoEditando, datosPlazo)
                if (resultado.success) {
                    // Actualizar en el estado local
                    setPlazos(prev => prev.map(p => 
                        p.id === modalPlazoEditando 
                            ? { ...p, ...datosPlazo, id: modalPlazoEditando }
                            : p
                    ))
                    alert('Plazo actualizado exitosamente')
                    cerrarModalPlazo()
                } else {
                    alert(resultado.mensaje || 'Error al actualizar plazo')
                }
            } else {
                // Agregar nuevo plazo
                const resultado = await agregarPlazoPlan(id, datosPlazo)
                if (resultado.success) {
                    // Agregar al estado local con el ID retornado
                    setPlazos(prev => [...prev, { ...datosPlazo, id: resultado.plazo_id }])
                    alert('Plazo agregado exitosamente')
                    cerrarModalPlazo()
                } else {
                    alert(resultado.mensaje || 'Error al agregar plazo')
                }
            }
        } catch (error) {
            console.error('Error al guardar plazo:', error)
            alert('Error al guardar plazo')
        } finally {
            setProcesando(false)
        }
    }

    const eliminarPlazo = async (plazoId) => {
        if (!confirm('¿Está seguro de eliminar esta opción de plazo?')) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarPlazoPlan(plazoId)
            if (resultado.success) {
                setPlazos(prev => prev.filter(p => p.id !== plazoId))
                alert('Plazo eliminado exitosamente')
            } else {
                alert(resultado.mensaje || 'Error al eliminar plazo')
            }
        } catch (error) {
            console.error('Error al eliminar plazo:', error)
            alert('Error al eliminar plazo')
        } finally {
            setProcesando(false)
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

    // ============================================
    // FUNCIÓN PARA GUARDAR EL PLAN
    // ============================================

    const guardarPlan = async () => {
        if (!planForm.nombre) {
            alert('El nombre del plan es obligatorio')
            return
        }

        setProcesando(true)
        try {
            // Actualizar información general del plan
            const datosPlan = {
                nombre: planForm.nombre,
                descripcion: planForm.descripcion,
                penalidad_mora_pct: planForm.penalidad_mora_pct === '' ? 5.00 : Number(planForm.penalidad_mora_pct) || 5.00,
                dias_gracia: planForm.dias_gracia === '' ? 5 : Number(planForm.dias_gracia) || 5,
                descuento_pago_anticipado_pct: planForm.descuento_pago_anticipado_pct === '' ? 0 : Number(planForm.descuento_pago_anticipado_pct) || 0,
                cuotas_minimas_anticipadas: planForm.cuotas_minimas_anticipadas === '' ? 3 : Number(planForm.cuotas_minimas_anticipadas) || 3,
                monto_minimo: planForm.monto_minimo === '' ? 0 : Number(planForm.monto_minimo) || 0,
                monto_maximo: planForm.monto_maximo === '' || planForm.monto_maximo === null ? null : Number(planForm.monto_maximo),
                activo: planForm.activo,
                permite_pago_anticipado: planForm.permite_pago_anticipado,
                requiere_fiador: planForm.requiere_fiador
            }

            const resultado = await actualizarPlanFinanciamiento(id, datosPlan)

            if (resultado.success) {
                alert('Plan actualizado exitosamente')
                router.push('/admin/planes')
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

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <Loader2 className={estilos.iconoCargando} />
                    <span>Cargando plan...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <AlertCircle size={64} />
                    <p>{error}</p>
                    <button className={estilos.btnVolver} onClick={() => router.push('/admin/planes')}>
                        Volver a Planes
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <CreditCard className={estilos.iconoTitulo} />
                    <div>
                        <h1 className={estilos.titulo}>Editar Plan de Financiamiento</h1>
                        <p className={estilos.subtitulo}>
                            Modifique la información del plan y gestione las opciones de plazo
                        </p>
                    </div>
                </div>
            </div>

            <div className={estilos.contenedorPrincipal}>
                {/* Columna Izquierda - Formulario */}
                <div className={estilos.columnaFormulario}>
                    {/* Sección 1: Información Básica */}
                    <div className={estilos.seccion}>
                        <div className={estilos.seccionHeader}>
                            <FileText className={estilos.seccionIcono} />
                            <h2 className={estilos.seccionTitulo}>Información Básica</h2>
                        </div>
                        <div className={estilos.formGrid}>
                            <div className={estilos.formGroup}>
                                <label>
                                    <FileText size={16} />
                                    Código
                                </label>
                                <input
                                    type="text"
                                    name="codigo"
                                    value={planForm.codigo}
                                    disabled
                                    className={estilos.inputDeshabilitado}
                                />
                                <small className={estilos.helperText}>
                                    El código no se puede modificar
                                </small>
                            </div>

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

                    {/* Sección 2: Opciones de Plazo */}
                    <div className={estilos.seccion}>
                        <div className={estilos.seccionHeader}>
                            <Calculator className={estilos.seccionIcono} />
                            <h2 className={estilos.seccionTitulo}>Opciones de Plazo</h2>
                            <div className={estilos.badgeInfo}>
                                <Info size={14} />
                                <span>Gestionar opciones de plazo para este plan</span>
                            </div>
                        </div>
                        
                        {/* Lista de plazos agregados */}
                        {plazos.length === 0 ? (
                            <div className={estilos.sinPlazos}>
                                <Calculator size={48} />
                                <p>No hay opciones de plazo registradas</p>
                                <small>Agregue al menos una opción de plazo</small>
                            </div>
                        ) : (
                            <div className={estilos.listaPlazos}>
                                {plazos
                                    .sort((a, b) => a.plazo_meses - b.plazo_meses)
                                    .map((plazo) => (
                                        <div key={plazo.id} className={estilos.plazoCard}>
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
                                                <div className={estilos.plazoDetalleItem}>
                                                    <TrendingUp size={14} />
                                                    <span>Tasa: {plazo.tasa_anual_calculada?.toFixed(2) || 'N/A'}% anual</span>
                                                </div>
                                            </div>
                                            <div className={estilos.plazoAcciones}>
                                                <button
                                                    type="button"
                                                    onClick={() => abrirModalEditarPlazo(plazo)}
                                                    className={estilos.btnEditar}
                                                >
                                                    <Edit size={16} />
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarPlazo(plazo.id)}
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

                        {/* Presets rápidos */}
                        <div className={estilos.presetsRapidos}>
                            <span className={estilos.presetsLabel}>Plazos sugeridos:</span>
                            <div className={estilos.presetsButtons}>
                                {plazosComunes.map(meses => (
                                    <button
                                        key={meses}
                                        type="button"
                                        onClick={() => abrirModalConPreset(meses)}
                                        className={estilos.btnPreset}
                                    >
                                        {meses}
                                    </button>
                                ))}
                            </div>
                            <span className={estilos.presetsLabel}>o ingrese uno personalizado</span>
                        </div>

                        {/* Botón principal */}
                        <button
                            type="button"
                            onClick={abrirModalNuevoPlazo}
                            className={estilos.btnAgregarPlazo}
                        >
                            <Plus size={18} />
                            Agregar opción de plazo
                        </button>
                    </div>

                    {/* Sección 3: Penalidades y Descuentos */}
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

                    {/* Sección 4: Configuración Adicional */}
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

                    {/* Botones de acción */}
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
                            disabled={procesando}
                        >
                            {procesando ? 'Actualizando...' : 'Actualizar Plan'}
                            <CheckCircle2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Columna Derecha - Vista Previa */}
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
                                        .map((plazo) => (
                                            <div key={plazo.id} className={estilos.plazoCardVista}>
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
                                                    <div>
                                                        <TrendingUp size={14} />
                                                        <span>{plazo.tasa_anual_calculada?.toFixed(2) || 'N/A'}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {/* Información Adicional */}
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
                                <p>Agregue opciones de plazo para ver el resumen</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Plazo */}
            {modalPlazoAbierto && (
                <div className={estilos.modalOverlay} onClick={cerrarModalPlazo}>
                    <div className={estilos.modalPlazo} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>
                                {modalPlazoEditando !== null ? 'Editar' : 'Agregar'} Opción de Plazo
                            </h3>
                            <button
                                type="button"
                                onClick={cerrarModalPlazo}
                                className={estilos.btnCerrarModal}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className={estilos.modalBody}>
                            {/* Plazo en meses */}
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
                                />
                            </div>

                            {/* Tipo de pago inicial */}
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

                            {/* Valor del pago inicial */}
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

                            {/* Cuota mensual */}
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
                                />
                            </div>

                            {/* Resultado calculado */}
                            {calculandoModal && (
                                <div className={estilos.calculandoModal}>
                                    <Loader2 className={estilos.iconoCargando} size={20} />
                                    <span>Calculando tasa...</span>
                                </div>
                            )}

                            {/* Resultados Calculados */}
                            {resultadoCalculoModal && resultadoCalculoModal.valido && (
                                <div className={estilos.resultadosCalculadosModal}>
                                    <div className={estilos.resultadosHeader}>
                                        <CheckCircle2 className={estilos.resultadosIcono} size={20} />
                                        <h4>Resultados Calculados</h4>
                                    </div>
                                    
                                    {resultadoCalculoModal.mensaje_rango && (
                                        <div className={`${estilos.mensajeRango} ${resultadoCalculoModal.tasa_en_rango ? estilos.mensajeRangoExito : estilos.mensajeRangoAdvertencia}`}>
                                            <CheckCircle2 size={16} />
                                            <span>{resultadoCalculoModal.mensaje_rango}</span>
                                        </div>
                                    )}
                                    
                                    <div className={estilos.metricasGrid}>
                                        {resultadoCalculoModal.monto_financiado !== undefined && (
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
                                        
                                        {resultadoCalculoModal.precio_total !== undefined && (
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
                                        
                                        {resultadoCalculoModal.porcentaje_inicial !== undefined && (
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
                                        
                                        {resultadoCalculoModal.total_intereses !== undefined && (
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

                            {/* Marcar como sugerido */}
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
                                    <Sparkles size={14} />
                                    Marcar como plazo sugerido
                                </label>
                            </div>

                            {/* Validaciones */}
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
                                onClick={cerrarModalPlazo}
                                className={estilos.btnCancelar}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={guardarPlazoModal}
                                disabled={!validarPlazoModal().valido || !resultadoCalculoModal?.valido || procesando}
                                className={estilos.btnGuardar}
                            >
                                {procesando ? 'Guardando...' : (modalPlazoEditando !== null ? 'Actualizar' : 'Guardar')} opción
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
