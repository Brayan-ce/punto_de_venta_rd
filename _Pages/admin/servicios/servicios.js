"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerServicios } from './servidor'
import { formatearEstadoServicio, formatearTipoServicio, formatearPrioridad } from '../core/construction/estados'
import { EstadisticasKPI, AlertasUrgentes, AgendaHoy, ListadoServicios, ControlesFiltros } from './components'
import DashboardServicios from './dashboard/dashboard'
import estilos from './servicios.module.css'

export default function ServiciosAdmin() {
    const router = useRouter()
    const [servicios, setServicios] = useState([])
    const [serviciosFiltrados, setServiciosFiltrados] = useState([])
    const [cargando, setCargando] = useState(true)
    const [tema, setTema] = useState('light')
    const [vista, setVista] = useState('dashboard') // dashboard, grid, lista
    const [filtros, setFiltros] = useState({
        busqueda: '',
        estado: 'todos',
        tipo_servicio: '',
        prioridad: ''
    })
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        pendientes: 0,
        programados: 0,
        en_ejecucion: 0,
        finalizados: 0,
        cancelados: 0,
        costo_total: 0,
        presupuesto_comprometido: 0
    })
    const [serviciosAlerta, setServiciosAlerta] = useState([])
    const [serviciosHoy, setServiciosHoy] = useState([])

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        cargarServicios()
    }, [])

    useEffect(() => {
        filtrarServicios()
        calcularServiciosAlerta()
        calcularServiciosHoy()
    }, [servicios, filtros])

    async function cargarServicios() {
        setCargando(true)
        const res = await obtenerServicios({})
        if (res.success) {
            setServicios(res.servicios)
            calcularEstadisticas(res.servicios)
        }
        setCargando(false)
    }

    function calcularEstadisticas(data) {
        const stats = {
            total: data.length,
            pendientes: data.filter(s => s.estado === 'pendiente').length,
            programados: data.filter(s => s.estado === 'programado').length,
            en_ejecucion: data.filter(s => s.estado === 'en_ejecucion').length,
            finalizados: data.filter(s => s.estado === 'finalizado').length,
            cancelados: data.filter(s => s.estado === 'cancelado').length,
            costo_total: data.reduce((sum, s) => sum + parseFloat(s.costo_estimado || 0), 0),
            presupuesto_comprometido: data
                .filter(s => ['pendiente', 'programado', 'en_ejecucion'].includes(s.estado))
                .reduce((sum, s) => sum + parseFloat(s.presupuesto_asignado || 0), 0)
        }
        setEstadisticas(stats)
    }

    function calcularServiciosAlerta() {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        const alertas = servicios.filter(s => {
            if (s.estado === 'finalizado' || s.estado === 'cancelado') return false
            if (s.prioridad === 'urgente') return true
            if (!s.usuario_responsable_id && s.estado !== 'finalizado') return true
            if (s.fecha_programada) {
                const fechaProgramada = new Date(s.fecha_programada)
                fechaProgramada.setHours(0, 0, 0, 0)
                if (fechaProgramada < hoy && s.estado !== 'en_ejecucion' && s.estado !== 'finalizado') {
                    return true
                }
            }
            if (s.fecha_fin_estimada) {
                const fechaFin = new Date(s.fecha_fin_estimada)
                fechaFin.setHours(0, 0, 0, 0)
                const tresDias = new Date(hoy)
                tresDias.setDate(tresDias.getDate() + 3)
                if (fechaFin <= tresDias && fechaFin >= hoy && s.estado === 'en_ejecucion') {
                    return true
                }
            }
            return false
        })

        setServiciosAlerta(alertas.slice(0, 5))
    }

    function calcularServiciosHoy() {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        const manana = new Date(hoy)
        manana.setDate(manana.getDate() + 1)

        const serviciosHoyFiltrados = servicios.filter(s => {
            if (!s.fecha_programada) return false
            const fechaProgramada = new Date(s.fecha_programada)
            fechaProgramada.setHours(0, 0, 0, 0)
            return fechaProgramada.getTime() === hoy.getTime() && s.estado !== 'finalizado' && s.estado !== 'cancelado'
        })

        setServiciosHoy(serviciosHoyFiltrados)
    }

    function filtrarServicios() {
        let filtrados = servicios
        if (filtros.estado !== 'todos') {
            filtrados = filtrados.filter(s => s.estado === filtros.estado)
        }
        if (filtros.tipo_servicio) {
            filtrados = filtrados.filter(s => s.tipo_servicio === filtros.tipo_servicio)
        }
        if (filtros.prioridad) {
            filtrados = filtrados.filter(s => s.prioridad === filtros.prioridad)
        }
        if (filtros.busqueda) {
            const busquedaLower = filtros.busqueda.toLowerCase()
            filtrados = filtrados.filter(s =>
                s.nombre?.toLowerCase().includes(busquedaLower) ||
                s.codigo_servicio?.toLowerCase().includes(busquedaLower) ||
                s.ubicacion?.toLowerCase().includes(busquedaLower) ||
                s.cliente_nombre?.toLowerCase().includes(busquedaLower)
            )
        }
        setServiciosFiltrados(filtrados)
    }

    const getIconoTipoServicio = (tipo) => {
        const iconos = {
            'electrico': '⚡',
            'plomeria': '🚰',
            'pintura': '🎨',
            'reparacion': '🔧',
            'instalacion': '🔌',
            'mantenimiento': '🛠️',
            'inspeccion': '🔍',
            'limpieza': '🧹',
            'carpinteria': '🪚',
            'albanileria': '🧱',
            'otro': '🔧'
        }
        return iconos[tipo] || '🔧'
    }

    const getTipoAlerta = (servicio) => {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        if (servicio.prioridad === 'urgente') return { tipo: 'Urgente', icono: 'alert-circle', color: 'danger' }
        if (!servicio.usuario_responsable_id) return { tipo: 'Sin responsable', icono: 'person-remove', color: 'warning' }
        if (servicio.fecha_programada) {
            const fechaProgramada = new Date(servicio.fecha_programada)
            fechaProgramada.setHours(0, 0, 0, 0)
            if (fechaProgramada < hoy) {
                const diasRetraso = Math.floor((hoy - fechaProgramada) / (1000 * 60 * 60 * 24))
                return { tipo: `Retrasado ${diasRetraso} día${diasRetraso > 1 ? 's' : ''}`, icono: 'time', color: 'danger' }
            }
        }
        if (servicio.fecha_fin_estimada) {
            const fechaFin = new Date(servicio.fecha_fin_estimada)
            fechaFin.setHours(0, 0, 0, 0)
            const tresDias = new Date(hoy)
            tresDias.setDate(tresDias.getDate() + 3)
            if (fechaFin <= tresDias && fechaFin >= hoy) return { tipo: 'Próximo a vencer', icono: 'alarm', color: 'warning' }
        }
        return { tipo: 'Requiere atención', icono: 'flag', color: 'info' }
    }

    const btnSecundarioClass = estilos.btnSecundario || ''
    const btnPrimarioClass = estilos.btnPrimario || ''

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header Principal */}
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="construct-outline"></ion-icon>
                        Servicios
                    </h1>
                    <p className={estilos.subtitulo}>Centro de control y ejecución de intervenciones operativas</p>
                </div>
                <div className={estilos.headerButtons}>
                    <button
                        className={`${btnSecundarioClass} ${vista === 'dashboard' ? estilos.activo : ''}`}
                        onClick={() => setVista('dashboard')}
                    >
                        <ion-icon name="pie-chart-outline"></ion-icon>
                        <span>Dashboard</span>
                    </button>
                    <button
                        className={`${btnSecundarioClass} ${vista !== 'dashboard' ? estilos.activo : ''}`}
                        onClick={() => setVista('grid')}
                    >
                        <ion-icon name="list-outline"></ion-icon>
                        <span>Explorador</span>
                    </button>
                    <button className={btnSecundarioClass} onClick={() => router.push('/admin/servicios/plantillas')}>
                        <ion-icon name="document-text-outline"></ion-icon>
                        <span>Plantillas</span>
                    </button>
                    <button className={btnPrimarioClass} onClick={() => router.push('/admin/servicios/nuevo')}>
                        <ion-icon name="add-outline"></ion-icon>
                        <span>Nuevo Servicio</span>
                    </button>
                </div>
            </div>

            {vista === 'dashboard' ? (
                <DashboardServicios tema={tema} />
            ) : (
                <>
                    {/* KPIs Principales */}
                    <EstadisticasKPI
                        tema={tema}
                        estadisticas={estadisticas}
                        serviciosAlerta={serviciosAlerta}
                        serviciosHoy={serviciosHoy}
                    />

                    {/* Sección de Alertas y Agenda */}
                    <div className={estilos.gridPrincipal}>
                        <AlertasUrgentes
                            tema={tema}
                            serviciosAlerta={serviciosAlerta}
                            getTipoAlerta={getTipoAlerta}
                        />
                        <AgendaHoy
                            tema={tema}
                            serviciosHoy={serviciosHoy}
                            getIconoTipoServicio={getIconoTipoServicio}
                        />
                    </div>

                    {/* Resumen de Estados */}
                    <div className={estilos.estadosResumen}>
                        {['todos', 'pendiente', 'programado', 'en_ejecucion', 'finalizado'].map(est => (
                            <div
                                key={est}
                                className={`${estilos.estadoCard} ${filtros.estado === est ? estilos.estadoActivo : ''}`}
                                onClick={() => setFiltros(prev => ({ ...prev, estado: est }))}
                            >
                                <div className={`${estilos.estadoValor} ${estilos[est === 'todos' ? 'total' : est]}`}>
                                    {est === 'todos' ? estadisticas.total : estadisticas[`${est}s` === 'en_ejecucions' ? 'en_ejecucion' : `${est}s`]}
                                </div>
                                <div className={estilos.estadoLabel}>{est === 'todos' ? 'Total' : est.charAt(0).toUpperCase() + est.slice(1).replace('_', ' ')}</div>
                            </div>
                        ))}
                    </div>

                    {/* Controles de Búsqueda y Filtros */}
                    <ControlesFiltros
                        tema={tema}
                        filtros={filtros}
                        setFiltros={setFiltros}
                        vista={vista}
                        setVista={setVista}
                    />

                    {/* Lista de Servicios */}
                    <ListadoServicios
                        tema={tema}
                        serviciosFiltrados={serviciosFiltrados}
                        vista={vista}
                        cargando={cargando}
                        filtros={filtros}
                        getIconoTipoServicio={getIconoTipoServicio}
                    />
                </>
            )}
        </div>
    )
}

