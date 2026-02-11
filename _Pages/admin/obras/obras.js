"use client"
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { obtenerObras } from './servidor'
import { ESTADOS_OBRA, formatearEstadoObra, formatearTipoObra } from '../core/construction/estados'
import { calcularPorcentajeEjecutado, calcularDiasRestantes } from '../core/construction/calculos'
import estilos from './obras.module.css'

// Dynamic imports para vistas pesadas
const VistaKanban = dynamic(() => import('./components/VistaKanban'), {
    loading: () => (
        <div className={estilos.cargando}>
            <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
            <p>Cargando vista Kanban...</p>
        </div>
    ),
    ssr: false
})

const VistaGantt = dynamic(() => import('./components/VistaGantt'), {
    loading: () => (
        <div className={estilos.cargando}>
            <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
            <p>Cargando timeline...</p>
        </div>
    ),
    ssr: false
})

const VistaTimeline = dynamic(() => import('./components/VistaTimeline'), {
    loading: () => (
        <div className={estilos.cargando}>
            <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
            <p>Cargando línea de tiempo...</p>
        </div>
    ),
    ssr: false
})

export default function ObrasDashboard() {
    const router = useRouter()
    const [obras, setObras] = useState([])
    const [obrasFiltradas, setObrasFiltradas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [tema, setTema] = useState('light')
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todas')
    const [filtroTipo, setFiltroTipo] = useState('todas')
    const [vistaActiva, setVistaActiva] = useState('grid') // grid, kanban, gantt, timeline
    const [incluirPlantillas, setIncluirPlantillas] = useState(false) // Toggle para ver plantillas

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        cargarObras()

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
        filtrarObras()
    }, [obras, busqueda, filtroEstado, filtroTipo])

    async function cargarObras() {
        setCargando(true)
        try {
            const res = await obtenerObras({
                incluir_plantillas: incluirPlantillas,
                solo_plantillas: false
            })
            if (res.success) {
                setObras(res.obras || [])
            }
        } catch (error) {
            console.error('Error cargando obras:', error)
        } finally {
            setCargando(false)
        }
    }
    
    useEffect(() => {
        cargarObras()
    }, [incluirPlantillas])

    function filtrarObras() {
        let filtradas = [...obras]

        // Filtro por estado
        if (filtroEstado !== 'todas') {
            filtradas = filtradas.filter(o => o.estado === filtroEstado)
        }

        // Filtro por tipo
        if (filtroTipo !== 'todas') {
            filtradas = filtradas.filter(o => (o.tipo || o.tipo_obra) === filtroTipo)
        }

        // Filtro por búsqueda
        if (busqueda) {
            const busquedaLower = busqueda.toLowerCase()
            filtradas = filtradas.filter(o => 
                o.nombre?.toLowerCase().includes(busquedaLower) ||
                (o.codigo || o.codigo_obra)?.toLowerCase().includes(busquedaLower) ||
                o.ubicacion?.toLowerCase().includes(busquedaLower) ||
                o.cliente_nombre?.toLowerCase().includes(busquedaLower)
            )
        }

        setObrasFiltradas(filtradas)
    }

    // Calcular KPIs
    const kpis = useMemo(() => {
        const total = obras.length
        const activas = obras.filter(o => o.estado === 'activa').length
        const finalizadas = obras.filter(o => o.estado === 'finalizada').length
        const suspendidas = obras.filter(o => o.estado === 'suspendida').length
        const canceladas = obras.filter(o => o.estado === 'cancelada').length

        const presupuestoTotal = obras.reduce((sum, o) => 
            sum + parseFloat(o.presupuesto_aprobado || 0), 0
        )
        const presupuestoEjecutado = obras.reduce((sum, o) => 
            sum + parseFloat(o.costo_real || o.costo_ejecutado || 0), 0
        )

        const alertasCriticas = obras.filter(o => {
            const porcentaje = calcularPorcentajeEjecutado(
                o.costo_real || o.costo_ejecutado || 0,
                o.presupuesto_aprobado || 0
            )
            return porcentaje >= 90 && o.estado === 'activa'
        }).length

        return {
            total,
            activas,
            finalizadas,
            suspendidas,
            canceladas,
            presupuestoTotal,
            presupuestoEjecutado,
            alertasCriticas
        }
    }, [obras])

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 0
        }).format(monto || 0)
    }

    // Datos para Gantt
    const ganttData = useMemo(() => {
        return obrasFiltradas.map(obra => {
            const inicio = obra.fecha_inicio ? new Date(obra.fecha_inicio) : new Date()
            const fin = obra.fecha_fin_estimada ? new Date(obra.fecha_fin_estimada) : new Date()
            const hoy = new Date()
            
            const totalDias = Math.max(1, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)))
            const diasTranscurridos = Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))
            const progreso = Math.min(100, Math.max(0, (diasTranscurridos / totalDias) * 100))
            
            return {
                id: obra.id,
                nombre: obra.nombre,
                codigo: obra.codigo || obra.codigo_obra,
                inicio: obra.fecha_inicio,
                fin: obra.fecha_fin_estimada,
                progreso: progreso.toFixed(0),
                estado: obra.estado
            }
        })
    }, [obrasFiltradas])

    // Datos para Kanban (agrupados por estado)
    const kanbanData = useMemo(() => {
        const estados = ['activa', 'suspendida', 'finalizada', 'cancelada']
        return estados.map(estado => ({
            estado,
            obras: obrasFiltradas.filter(o => o.estado === estado)
        }))
    }, [obrasFiltradas])

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <h3>Cargando obras...</h3>
                    <p>Obteniendo información actualizada</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header Principal */}
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="business-outline"></ion-icon>
                        Obras y Proyectos
                    </h1>
                    <p className={estilos.subtitulo}>
                        Control completo de obras activas, presupuestos y cronogramas
                    </p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button 
                        className={estilos.btnExportar}
                        onClick={() => {
                            // TODO: Implementar exportación
                            alert('Función de exportación próximamente')
                        }}
                    >
                        <ion-icon name="download-outline"></ion-icon>
                        <span>Exportar</span>
                    </button>
                    <button 
                        className={estilos.btnNuevo}
                        onClick={() => router.push('/admin/obras/nuevo')}
                    >
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nueva Obra</span>
                    </button>
                </div>
            </div>

            {/* Panel de KPIs */}
            <div className={estilos.kpisContainer}>
                <div className={`${estilos.kpiCard} ${estilos.primary}`}>
                    <div className={estilos.kpiIcono}>
                        <ion-icon name="business-outline"></ion-icon>
                    </div>
                    <div className={estilos.kpiInfo}>
                        <span className={estilos.kpiLabel}>Total Obras</span>
                        <span className={estilos.kpiValor}>{kpis.total}</span>
                    </div>
                </div>

                <div className={`${estilos.kpiCard} ${estilos.success}`}>
                    <div className={estilos.kpiIcono}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.kpiInfo}>
                        <span className={estilos.kpiLabel}>Activas</span>
                        <span className={estilos.kpiValor}>{kpis.activas}</span>
                    </div>
                </div>

                <div className={`${estilos.kpiCard} ${estilos.info}`}>
                    <div className={estilos.kpiIcono}>
                        <ion-icon name="checkmark-done-outline"></ion-icon>
                    </div>
                    <div className={estilos.kpiInfo}>
                        <span className={estilos.kpiLabel}>Finalizadas</span>
                        <span className={estilos.kpiValor}>{kpis.finalizadas}</span>
                    </div>
                </div>

                <div className={`${estilos.kpiCard} ${estilos.warning}`}>
                    <div className={estilos.kpiIcono}>
                        <ion-icon name="time-outline"></ion-icon>
                    </div>
                    <div className={estilos.kpiInfo}>
                        <span className={estilos.kpiLabel}>Suspendidas</span>
                        <span className={estilos.kpiValor}>{kpis.suspendidas}</span>
                    </div>
                </div>

                <div className={`${estilos.kpiCard} ${estilos.secondary}`}>
                    <div className={estilos.kpiIcono}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.kpiInfo}>
                        <span className={estilos.kpiLabel}>Presupuesto Total</span>
                        <span className={estilos.kpiValor}>{formatearMoneda(kpis.presupuestoTotal)}</span>
                    </div>
                </div>

                <div className={`${estilos.kpiCard} ${kpis.alertasCriticas > 0 ? estilos.danger : estilos.secondary}`}>
                    <div className={estilos.kpiIcono}>
                        <ion-icon name="warning-outline"></ion-icon>
                    </div>
                    <div className={estilos.kpiInfo}>
                        <span className={estilos.kpiLabel}>Alertas Críticas</span>
                        <span className={estilos.kpiValor}>{kpis.alertasCriticas}</span>
                    </div>
                </div>
            </div>

            {/* Controles de Búsqueda y Filtros */}
            <div className={estilos.controles}>
                <div className={estilos.barraHerramientas}>
                    <div className={estilos.busqueda}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            className={estilos.inputBusqueda}
                            placeholder="Buscar por nombre, código, ubicación o cliente..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    
                    {/* Toggle para incluir plantillas */}
                    <label className={estilos.togglePlantillas}>
                        <input
                            type="checkbox"
                            checked={incluirPlantillas}
                            onChange={(e) => setIncluirPlantillas(e.target.checked)}
                        />
                        <span className={estilos.toggleLabel}>
                            <ion-icon name="layers-outline"></ion-icon>
                            Ver plantillas
                        </span>
                    </label>
                </div>

                {/* Chips de Filtro por Estado */}
                <div className={estilos.chips}>
                    <button
                        className={`${estilos.chip} ${filtroEstado === 'todas' ? estilos.chipActivo : ''}`}
                        onClick={() => setFiltroEstado('todas')}
                    >
                        <ion-icon name="apps-outline"></ion-icon>
                        <span>Todas</span>
                        <span className={estilos.chipCount}>({obras.length})</span>
                    </button>
                    <button
                        className={`${estilos.chip} ${estilos.chipSuccess} ${filtroEstado === 'activa' ? estilos.chipActivo : ''}`}
                        onClick={() => setFiltroEstado('activa')}
                    >
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                        <span>Activas</span>
                        <span className={estilos.chipCount}>({kpis.activas})</span>
                    </button>
                    <button
                        className={`${estilos.chip} ${estilos.chipWarning} ${filtroEstado === 'suspendida' ? estilos.chipActivo : ''}`}
                        onClick={() => setFiltroEstado('suspendida')}
                    >
                        <ion-icon name="time-outline"></ion-icon>
                        <span>Suspendidas</span>
                        <span className={estilos.chipCount}>({kpis.suspendidas})</span>
                    </button>
                    <button
                        className={`${estilos.chip} ${estilos.chipInfo} ${filtroEstado === 'finalizada' ? estilos.chipActivo : ''}`}
                        onClick={() => setFiltroEstado('finalizada')}
                    >
                        <ion-icon name="checkmark-done-outline"></ion-icon>
                        <span>Finalizadas</span>
                        <span className={estilos.chipCount}>({kpis.finalizadas})</span>
                    </button>
                    <button
                        className={`${estilos.chip} ${estilos.chipDanger} ${filtroEstado === 'cancelada' ? estilos.chipActivo : ''}`}
                        onClick={() => setFiltroEstado('cancelada')}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>Canceladas</span>
                        <span className={estilos.chipCount}>({kpis.canceladas})</span>
                    </button>
                </div>
            </div>

            {/* Navegación de Vistas */}
            <div className={estilos.navVistas}>
                <button 
                    className={`${estilos.btnVista} ${vistaActiva === 'grid' ? estilos.vistaActiva : ''}`}
                    onClick={() => setVistaActiva('grid')}
                >
                    <ion-icon name="grid-outline"></ion-icon>
                    <span>Grid</span>
                </button>
                <button 
                    className={`${estilos.btnVista} ${vistaActiva === 'kanban' ? estilos.vistaActiva : ''}`}
                    onClick={() => setVistaActiva('kanban')}
                >
                    <ion-icon name="albums-outline"></ion-icon>
                    <span>Kanban</span>
                </button>
                <button 
                    className={`${estilos.btnVista} ${vistaActiva === 'gantt' ? estilos.vistaActiva : ''}`}
                    onClick={() => setVistaActiva('gantt')}
                >
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>Gantt</span>
                </button>
                <button 
                    className={`${estilos.btnVista} ${vistaActiva === 'timeline' ? estilos.vistaActiva : ''}`}
                    onClick={() => setVistaActiva('timeline')}
                >
                    <ion-icon name="time-outline"></ion-icon>
                    <span>Timeline</span>
                </button>
            </div>

            {/* Vista: Grid */}
            {vistaActiva === 'grid' && (
                obrasFiltradas.length === 0 ? (
                    <div className={estilos.vacio}>
                        <ion-icon name="business-outline"></ion-icon>
                        <h3>No se encontraron obras</h3>
                        <p>
                            {busqueda || filtroEstado !== 'todas' 
                                ? 'No hay obras que coincidan con los filtros seleccionados'
                                : 'No hay obras registradas. Crea tu primera obra para comenzar.'}
                        </p>
                        {!busqueda && filtroEstado === 'todas' && (
                            <button className={estilos.btnNuevo} onClick={() => router.push('/admin/obras/nuevo')}>
                                <ion-icon name="add-outline"></ion-icon>
                                <span>Crear Nueva Obra</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={estilos.grid}>
                        {obrasFiltradas.map(o => {
                            const estadoFormateado = formatearEstadoObra(o.estado || ESTADOS_OBRA.ACTIVA)
                            const porcentajeEjecutado = calcularPorcentajeEjecutado(
                                o.costo_real || o.costo_ejecutado || 0,
                                o.presupuesto_aprobado || 0
                            )
                            const diasRestantes = o.fecha_fin_estimada 
                                ? calcularDiasRestantes(o.fecha_fin_estimada)
                                : null
                            
                            const getProgresoColor = () => {
                                if (porcentajeEjecutado >= 90) return 'critico'
                                if (porcentajeEjecutado >= 70) return 'atencion'
                                return 'normal'
                            }

                            const getIconoEstado = () => {
                                const iconos = {
                                    activa: 'checkmark-circle-outline',
                                    suspendida: 'time-outline',
                                    finalizada: 'checkmark-done-outline',
                                    cancelada: 'close-circle-outline'
                                }
                                return iconos[o.estado] || 'ellipse-outline'
                            }

                            return (
                                <div key={o.id} className={estilos.tarjeta}>
                                    <div className={estilos.tarjetaHeader}>
                                        <div>
                                            {(o.codigo || o.codigo_obra) && (
                                                <span className={estilos.codigoObra}>{o.codigo || o.codigo_obra}</span>
                                            )}
                                            <h3>{o.nombre}</h3>
                                        </div>
                                        <div className={`${estilos.estado} ${estilos[estadoFormateado.color]}`}>
                                            <ion-icon name={getIconoEstado()}></ion-icon>
                                            <span>{estadoFormateado.texto}</span>
                                        </div>
                                    </div>
                                    
                                    <div className={estilos.info}>
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="location-outline"></ion-icon>
                                            <span>{o.ubicacion || 'Sin ubicación'}</span>
                                        </div>
                                        {(o.tipo || o.tipo_obra) && (
                                            <div className={estilos.itemInfo}>
                                                <ion-icon name="construct-outline"></ion-icon>
                                                <span>{formatearTipoObra(o.tipo || o.tipo_obra)}</span>
                                            </div>
                                        )}
                                        {o.cliente_nombre && (
                                            <div className={estilos.itemInfo}>
                                                <ion-icon name="person-outline"></ion-icon>
                                                <span>{o.cliente_nombre}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Barra de Progreso Presupuestario */}
                                    {porcentajeEjecutado > 0 && (
                                        <div className={estilos.progresoPresupuesto}>
                                            <div className={estilos.progresoHeader}>
                                                <span className={estilos.progresoLabel}>Ejecución Presupuestaria</span>
                                                <span className={`${estilos.progresoPorcentaje} ${estilos[getProgresoColor()]}`}>
                                                    {porcentajeEjecutado.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className={estilos.barraProgreso}>
                                                <div 
                                                    className={`${estilos.progresoFill} ${estilos[getProgresoColor()]}`}
                                                    style={{ width: `${Math.min(porcentajeEjecutado, 100)}%` }}
                                                />
                                            </div>
                                            <div className={estilos.progresoDetalles}>
                                                <span>
                                                    Ejecutado: <strong>RD$ {parseFloat(o.costo_real || o.costo_ejecutado || 0).toLocaleString()}</strong>
                                                </span>
                                                <span>
                                                    Presupuesto: <strong>RD$ {parseFloat(o.presupuesto_aprobado || 0).toLocaleString()}</strong>
                                                </span>
                                                <span>
                                                    Restante: <strong>RD$ {parseFloat((o.presupuesto_aprobado || 0) - (o.costo_real || o.costo_ejecutado || 0)).toLocaleString()}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Alerta de Presupuesto */}
                                    {porcentajeEjecutado > 90 && o.estado === 'activa' && (
                                        <div className={`${estilos.alertaPresupuesto} ${estilos.critico}`}>
                                            <ion-icon name="warning-outline"></ion-icon>
                                            <p>Alerta: Esta obra ha superado el 90% del presupuesto</p>
                                        </div>
                                    )}

                                    <div className={estilos.footerCards}>
                                        <div className={estilos.fechas}>
                                            {o.fecha_inicio && (
                                                <small>
                                                    <ion-icon name="calendar-outline"></ion-icon>
                                                    Inicio: {new Date(o.fecha_inicio).toLocaleDateString()}
                                                </small>
                                            )}
                                            {diasRestantes !== null && (
                                                <small className={diasRestantes < 0 ? estilos.diasVencidos : ''}>
                                                    <ion-icon name="time-outline"></ion-icon>
                                                    {diasRestantes > 0 ? `${diasRestantes} días restantes` : 'Vencido'}
                                                </small>
                                            )}
                                        </div>
                                        <button 
                                            className={estilos.btnVer} 
                                            onClick={() => router.push(`/admin/obras/ver/${o.id}`)}
                                        >
                                            <ion-icon name="eye-outline"></ion-icon>
                                            <span>Ver Detalle</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            )}

            {/* Vista: Kanban */}
            {vistaActiva === 'kanban' && (
                <Suspense fallback={
                    <div className={estilos.cargando}>
                        <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                        <p>Cargando vista Kanban...</p>
                    </div>
                }>
                    <VistaKanban obras={obrasFiltradas} tema={tema} router={router} />
                </Suspense>
            )}

            {/* Vista: Gantt */}
            {vistaActiva === 'gantt' && (
                <Suspense fallback={
                    <div className={estilos.cargando}>
                        <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                        <p>Cargando timeline...</p>
                    </div>
                }>
                    <VistaGantt ganttData={ganttData} tema={tema} />
                </Suspense>
            )}

            {/* Vista: Timeline */}
            {vistaActiva === 'timeline' && (
                <Suspense fallback={
                    <div className={estilos.cargando}>
                        <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                        <p>Cargando línea de tiempo...</p>
                    </div>
                }>
                    <VistaTimeline obras={obrasFiltradas} tema={tema} router={router} />
                </Suspense>
            )}
        </div>
    )
}

