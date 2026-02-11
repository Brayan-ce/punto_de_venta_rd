"use client"
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
    CreditCard, 
    TrendingUp, 
    Calendar, 
    DollarSign, 
    AlertCircle, 
    Clock, 
    Plus, 
    Search, 
    Eye, 
    Edit, 
    FileText,
    Sparkles,
    Loader2
} from 'lucide-react'
import { obtenerPlanesFinanciamiento } from './servidor'
import estilos from './planes.module.css'

export default function PlanesFinanciamiento() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [planes, setPlanes] = useState([])
    const [filtroActivo, setFiltroActivo] = useState('')
    const [buscar, setBuscar] = useState('')

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

    // ✅ Cargar planes UNA SOLA VEZ al montar (sin filtros)
    useEffect(() => {
        const cargar = async () => {
            setCargando(true)
            try {
                const resultado = await obtenerPlanesFinanciamiento() // Sin filtros

                if (resultado.success) {
                    setPlanes(resultado.planes)
                } else {
                    alert(resultado.mensaje || 'Error al cargar planes')
                }
            } catch (error) {
                console.error('Error al cargar planes:', error)
                alert('Error al cargar planes')
            } finally {
                setCargando(false)
            }
        }

        cargar()
    }, []) // ✅ Array vacío = solo al montar

    const navegarANuevo = () => {
        router.push('/admin/planes/nuevo')
    }

    const navegarAEditar = (planId) => {
        router.push(`/admin/planes/editar/${planId}`)
    }

    const navegarAVer = (planId) => {
        router.push(`/admin/planes/ver/${planId}`)
    }

    // ✅ Filtrar en memoria (instantáneo, sin llamadas al backend)
    const planesFiltrados = useMemo(() => {
        return planes.filter(plan => {
            if (filtroActivo === 'activo' && plan.activo !== 1) return false
            if (filtroActivo === 'inactivo' && plan.activo !== 0) return false
            if (buscar && 
                !plan.nombre.toLowerCase().includes(buscar.toLowerCase()) &&
                !plan.codigo.toLowerCase().includes(buscar.toLowerCase())) return false
            return true
        })
    }, [planes, filtroActivo, buscar]) // ✅ Solo recalcula si cambian estos valores

    // ✅ Calcular estadísticas sobre TODOS los planes (no filtrados)
    // Esto muestra el total real, independientemente de los filtros aplicados
    const estadisticas = useMemo(() => {
        // Calcular tasa promedio desde plazos o valores legacy
        let sumaTasas = 0
        let contadorTasas = 0

        planes.forEach(plan => {
            const plazosActivos = plan.plazos?.filter(p => p.activo !== 0 && !p.es_legacy && p.tasa_anual_calculada) || []
            
            if (plazosActivos.length > 0) {
                // Usar tasas de los plazos
                plazosActivos.forEach(plazo => {
                    const tasa = parseFloat(plazo.tasa_anual_calculada)
                    if (!isNaN(tasa)) {
                        sumaTasas += tasa
                        contadorTasas++
                    }
                })
            } else if (plan.tasa_interes_anual) {
                // Fallback a valor legacy
                const tasa = parseFloat(plan.tasa_interes_anual)
                if (!isNaN(tasa)) {
                    sumaTasas += tasa
                    contadorTasas++
                }
            }
        })

        const tasaPromedio = contadorTasas > 0 
            ? (sumaTasas / contadorTasas).toFixed(2)
            : 0

        return {
            total: planes.length,
            activos: planes.filter(p => p.activo === 1).length,
            inactivos: planes.filter(p => p.activo === 0).length,
            tasaPromedio
        }
    }, [planes]) // ✅ Solo recalcula si cambian los planes

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <Loader2 className={estilos.iconoCargando} />
                    <span>Cargando planes...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div className={estilos.headerTitulo}>
                    <div className={estilos.tituloWrapper}>
                        <CreditCard className={estilos.tituloIcono} />
                        <div>
                            <h1 className={estilos.titulo}>Planes de Financiamiento</h1>
                            <p className={estilos.subtitulo}>Gestiona los planes disponibles para financiamiento</p>
                        </div>
                    </div>
                </div>
                <button className={estilos.btnPrimario} onClick={navegarANuevo}>
                    <Plus className={estilos.btnIcono} />
                    <span>Nuevo Plan</span>
                </button>
            </div>

            {/* Estadísticas */}
            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos.primary}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                            <FileText className={estilos.estadIconoSvg} />
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Planes</span>
                        <span className={estilos.estadValor}>{estadisticas.total}</span>
                        <span className={estilos.estadTendencia}>
                            <TrendingUp className={estilos.tendenciaIcono} />
                            Planes disponibles
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.success}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.success}`}>
                            <Sparkles className={estilos.estadIconoSvg} />
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Planes Activos</span>
                        <span className={estilos.estadValor}>{estadisticas.activos}</span>
                        <span className={estilos.estadTendencia}>
                            <TrendingUp className={estilos.tendenciaIcono} />
                            En uso
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.info}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.info}`}>
                            <TrendingUp className={estilos.estadIconoSvg} />
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Tasa Promedio</span>
                        <span className={estilos.estadValor}>{estadisticas.tasaPromedio}%</span>
                        <span className={estilos.estadTendencia}>
                            <DollarSign className={estilos.tendenciaIcono} />
                            Interés anual
                        </span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos.warning}`}>
                    <div className={estilos.estadIconoWrapper}>
                        <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                            <AlertCircle className={estilos.estadIconoSvg} />
                        </div>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Inactivos</span>
                        <span className={estilos.estadValor}>{estadisticas.inactivos}</span>
                        <span className={estilos.estadTendencia}>
                            <Clock className={estilos.tendenciaIcono} />
                            Deshabilitados
                        </span>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className={estilos.filtros}>
                <div className={estilos.buscarWrapper}>
                    <Search className={estilos.buscarIcono} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        className={estilos.inputBuscar}
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                    />
                </div>
                <select
                    className={estilos.selectFiltro}
                    value={filtroActivo}
                    onChange={(e) => setFiltroActivo(e.target.value)}
                >
                    <option value="">Todos los planes</option>
                    <option value="activo">Solo activos</option>
                    <option value="inactivo">Solo inactivos</option>
                </select>
            </div>

            {/* Lista de planes */}
            <div className={estilos.listaPlanes}>
                {planesFiltrados.length === 0 ? (
                    <div className={estilos.sinDatos}>
                        <FileText className={estilos.sinDatosIcono} />
                        <p>No hay planes de financiamiento aún</p>
                        <p className={estilos.sinDatosSubtexto}>Crea un plan para empezar a ofrecer créditos</p>
                        <button className={estilos.btnPrimario} onClick={navegarANuevo}>
                            <Plus className={estilos.btnIcono} />
                            <span>Crear primer plan</span>
                        </button>
                    </div>
                ) : (
                    planesFiltrados.map(plan => {
                        // Calcular rangos de tasas e inicial mínimo
                        const plazosActivos = plan.plazos?.filter(p => p.activo !== 0 && !p.es_legacy) || []
                        const tasasAnuales = plazosActivos
                            .map(p => p.tasa_anual_calculada)
                            .filter(t => t != null)
                            .map(t => parseFloat(t))
                        
                        const tasasMin = tasasAnuales.length > 0 ? Math.min(...tasasAnuales) : null
                        const tasasMax = tasasAnuales.length > 0 ? Math.max(...tasasAnuales) : null
                        const rangoTasas = tasasMin && tasasMax 
                            ? (tasasMin === tasasMax ? `${tasasMin.toFixed(0)}%` : `${tasasMin.toFixed(0)}% – ${tasasMax.toFixed(0)}%`)
                            : plan.tasa_interes_anual ? `${plan.tasa_interes_anual}%` : 'N/A'
                        
                        const inicialesMinimos = plazosActivos
                            .map(p => {
                                if (p.tipo_pago_inicial === 'PORCENTAJE') {
                                    return parseFloat(p.pago_inicial_valor)
                                }
                                return null
                            })
                            .filter(v => v != null)
                        
                        const inicialMinimo = inicialesMinimos.length > 0 
                            ? Math.min(...inicialesMinimos)
                            : plan.pago_inicial_minimo_pct || null
                        
                        const inicialMinimoTexto = inicialMinimo 
                            ? `desde ${inicialMinimo.toFixed(0)}%`
                            : plan.pago_inicial_minimo_pct 
                                ? `${plan.pago_inicial_minimo_pct}%`
                                : 'N/A'

                        return (
                            <div key={plan.id} className={`${estilos.planCard} ${plan.activo === 0 ? estilos.inactivo : ''}`}>
                                {/* Header */}
                                <div className={estilos.planCardHeader}>
                                    <div className={estilos.planHeader}>
                                        <div className={estilos.planHeaderInfo}>
                                            <h3 className={estilos.planNombre}>{plan.nombre}</h3>
                                            <span className={estilos.planCodigo}>{plan.codigo}</span>
                                        </div>
                                        <div className={estilos.planEstado}>
                                            <span className={`${estilos.estadoPunto} ${plan.activo === 1 ? estilos.activo : estilos.inactivo}`}>
                                                ●
                                            </span>
                                            <span className={estilos.estadoTexto}>
                                                {plan.activo === 1 ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Opciones de plazo */}
                                {plazosActivos.length > 0 ? (
                                    <div className={estilos.planSeccion}>
                                        <span className={estilos.seccionLabel}>Opciones de plazo</span>
                                        <div className={estilos.plazosLista}>
                                            {plazosActivos
                                                .sort((a, b) => a.plazo_meses - b.plazo_meses)
                                                .slice(0, 3)
                                                .map((plazo, idx) => (
                                                    <span key={plazo.id || idx} className={estilos.plazoBadge}>
                                                        {plazo.plazo_meses}m
                                                        {plazo.es_sugerido && <Sparkles size={12} className={estilos.plazoSugerido} />}
                                                    </span>
                                                ))}
                                            {plazosActivos.length > 3 && (
                                                <span className={estilos.plazoBadge}>
                                                    +{plazosActivos.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : plan.plazo_meses ? (
                                    <div className={estilos.planSeccion}>
                                        <span className={estilos.seccionLabel}>Plazo</span>
                                        <div className={estilos.plazosLista}>
                                            <span className={estilos.plazoBadge}>
                                                {plan.plazo_meses}m
                                            </span>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Métricas clave */}
                                <div className={estilos.metricasGrid}>
                                    <div className={estilos.metricaCard}>
                                        <span className={estilos.metricaLabel}>Tasa anual</span>
                                        <span className={estilos.metricaValor}>{rangoTasas}</span>
                                    </div>
                                    <div className={estilos.metricaCard}>
                                        <span className={estilos.metricaLabel}>Inicial mín.</span>
                                        <span className={estilos.metricaValor}>{inicialMinimoTexto}</span>
                                    </div>
                                </div>

                                {/* Info secundaria */}
                                <div className={estilos.infoSecundaria}>
                                    Mora: {plan.penalidad_mora_pct}% mensual · Gracia: {plan.dias_gracia} días
                                </div>

                                {/* Acciones */}
                                <div className={estilos.planAcciones}>
                                    <button
                                        className={estilos.btnVer}
                                        onClick={() => navegarAVer(plan.id)}
                                    >
                                        <Eye className={estilos.btnAccionIcono} />
                                        <span>Ver</span>
                                    </button>
                                    <button
                                        className={estilos.btnEditar}
                                        onClick={() => navegarAEditar(plan.id)}
                                    >
                                        <Edit className={estilos.btnAccionIcono} />
                                        <span>Editar</span>
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

