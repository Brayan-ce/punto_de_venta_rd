"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerPlanes, toggleActivoPlan, eliminarPlan, obtenerDatosEmpresa } from './servidor'
import { useLanguage } from '../i18n/LanguageProvider'
import estilos from './planes.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function Planes() {
    const { language } = useLanguage()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [planes, setPlanes] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroActivo, setFiltroActivo] = useState('activos')
    const [empresa, setEmpresa] = useState(null)

    const tr = (es, en) => language === 'en' ? en : es
    const FRECUENCIA_LABEL = {
        mensual: tr('Mensual', 'Monthly'),
        quincenal: tr('Quincenal', 'Biweekly'),
        semanal: tr('Semanal', 'Weekly')
    }


    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const onChange = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', onChange)
        window.addEventListener('storage', onChange)
        return () => {
            window.removeEventListener('temaChange', onChange)
            window.removeEventListener('storage', onChange)
        }
    }, [])

    useEffect(() => { cargar(); cargarEmpresa() }, [])

    const cargar = async () => {
        setCargando(true)
        const r = await obtenerPlanes()
        if (r.success) setPlanes(r.planes)
        setCargando(false)
    }

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const localeEmpresa = empresa?.locale || 'es-DO'
    const formatearMoneda = (v) => {
        try {
            return new Intl.NumberFormat(localeEmpresa, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0)
        } catch {
            return Number(v || 0).toFixed(0)
        }
    }

    const handleToggle = async (id, activo) => {
        await toggleActivoPlan(id, !activo)
        cargar()
    }


    // uso formatearMoneda + simboloMoneda manualmente

    const planesFiltrados = planes.filter(p => {
        const matchBusqueda = !busqueda ||
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
        const matchActivo =
            filtroActivo === 'todos' ||
            (filtroActivo === 'activos' && p.activo) ||
            (filtroActivo === 'inactivos' && !p.activo)
        return matchBusqueda && matchActivo
    })

    const stats = {
        total:    planes.length,
        activos:  planes.filter(p => p.activo).length,
        inactivos: planes.filter(p => !p.activo).length,
        opciones: planes.reduce((acc, p) => acc + (p.opciones?.length || 0), 0),
    }

    if (cargando) { return <LoadingScreen /> }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}>
                        <ion-icon name="documents-outline"></ion-icon>
                    </div>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Planes de Financiamiento', 'Financing Plans')}</h1>
                        <p className={estilos.subtitulo}>{tr('Gestiona los planes y plazos disponibles', 'Manage available plans and terms')}</p>
                    </div>
                </div>
                <Link href="/admin/planes/nuevo" className={estilos.btnNuevo}>
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>{tr('Nuevo Plan', 'New Plan')}</span>
                </Link>
            </div>

            <div className={estilos.statsGrid}>
                {[
                    { label: tr('Total Planes', 'Total Plans'),    valor: stats.total,    color: 'blue',   icon: 'documents-outline' },
                    { label: tr('Activos', 'Active'),          valor: stats.activos,  color: 'green',  icon: 'checkmark-circle-outline' },
                    { label: tr('Inactivos', 'Inactive'),        valor: stats.inactivos,color: 'gray',   icon: 'pause-circle-outline' },
                    { label: tr('Plazos Totales', 'Total Terms'),   valor: stats.opciones, color: 'orange', icon: 'time-outline' },
                ].map((s, i) => (
                    <div key={i} className={`${estilos.statCard} ${estilos[s.color]}`}>
                        <div className={`${estilos.statIcono} ${estilos[s.color]}`}>
                            <ion-icon name={s.icon}></ion-icon>
                        </div>
                        <div>
                            <span className={estilos.statValor}>{s.valor}</span>
                            <span className={estilos.statLabel}>{s.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={estilos.toolbar}>
                <div className={estilos.buscadorWrapper}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        className={estilos.inputBuscador}
                        placeholder={tr('Buscar por nombre o codigo...', 'Search by name or code...')}
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <button className={estilos.btnLimpiar} onClick={() => setBusqueda('')}>
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    )}
                </div>
                <div className={estilos.filtros}>
                    {['todos', 'activos', 'inactivos'].map(f => (
                        <button
                            key={f}
                            className={`${estilos.filtroBtn} ${filtroActivo === f ? estilos.filtroActivo : ''}`}
                            onClick={() => setFiltroActivo(f)}
                        >
                            {f === 'todos' ? tr('Todos', 'All') : f === 'activos' ? tr('Activos', 'Active') : tr('Inactivos', 'Inactive')}
                        </button>
                    ))}
                </div>
            </div>

            {planesFiltrados.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="documents-outline"></ion-icon>
                    <h3>{tr('No se encontraron planes', 'No plans found')}</h3>
                    <p>{busqueda ? tr('Intenta con otro termino de busqueda', 'Try another search term') : tr('Crea tu primer plan de financiamiento', 'Create your first financing plan')}</p>
                    {!busqueda && (
                        <Link href="/admin/planes/nuevo" className={estilos.btnNuevo}>
                            <ion-icon name="add-circle-outline"></ion-icon>
                            <span>{tr('Crear Plan', 'Create Plan')}</span>
                        </Link>
                    )}
                </div>
            ) : (
                <div className={estilos.planesGrid}>
                    {planesFiltrados.map(plan => (
                        <div key={plan.id} className={`${estilos.planCard} ${!plan.activo ? estilos.planInactivo : ''}`}>

                            <div className={estilos.planHeader}>
                                <div className={estilos.planIconoWrapper}>
                                    <ion-icon name="card-outline"></ion-icon>
                                </div>
                                <div className={estilos.planHeaderInfo}>
                                    <span className={estilos.planNombre}>{plan.nombre}</span>
                                    {plan.codigo && <span className={estilos.planCodigo}>{plan.codigo}</span>}
                                </div>
                                <span className={`${estilos.planEstado} ${plan.activo ? estilos.planEstadoActivo : estilos.planEstadoInactivo}`}>
                                    {plan.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                                </span>
                            </div>

                            {plan.descripcion && (
                                <p className={estilos.planDesc}>{plan.descripcion}</p>
                            )}

                            <div className={estilos.planMeta}>
                                <div className={estilos.planMetaItem}>
                                    <ion-icon name="trending-up-outline"></ion-icon>
                                    <span>{plan.tasa_interes}% {tr('interes', 'interest')}</span>
                                </div>
                                <div className={estilos.planMetaItem}>
                                    <ion-icon name="time-outline"></ion-icon>
                                    <span>{FRECUENCIA_LABEL[plan.frecuencia] || plan.frecuencia}</span>
                                </div>
                                <div className={estilos.planMetaItem}>
                                    <ion-icon name="warning-outline"></ion-icon>
                                    <span>{plan.mora_pct}% {tr('mora', 'late fee')}</span>
                                </div>
                                <div className={estilos.planMetaItem}>
                                    <ion-icon name="calendar-outline"></ion-icon>
                                    <span>{plan.dias_gracia}{tr('d gracia', 'd grace')}</span>
                                </div>
                            </div>

                            {(plan.monto_minimo > 0 || plan.monto_maximo) && (
                                <div className={estilos.planLimites}>
                                    {plan.monto_minimo > 0 && (
                                        <span>{tr('Min:', 'Min:')} {simboloMoneda} {formatearMoneda(plan.monto_minimo)}</span>
                                    )}
                                    {plan.monto_maximo && (
                                        <span>{tr('Max:', 'Max:')} {simboloMoneda} {formatearMoneda(plan.monto_maximo)}</span>
                                    )}
                                </div>
                            )}

                            <div className={estilos.planOpciones}>
                                <span className={estilos.planOpcionesLabel}>{tr('Plazos disponibles', 'Available terms')}</span>
                                <div className={estilos.planOpcionesGrid}>
                                    {plan.opciones?.length > 0 ? plan.opciones.map(op => (
                                        <span key={op.id} className={estilos.planOpcionPill}>
                                            {op.meses} {plan.frecuencia === 'semanal' ? tr('sem', 'wk') : plan.frecuencia === 'quincenal' ? tr('quin', 'biw') : tr('mes', 'mo')}
                                        </span>
                                    )) : (
                                        <span className={estilos.planSinOpciones}>{tr('Sin plazos', 'No terms')}</span>
                                    )}
                                </div>
                            </div>

                            <div className={estilos.planFlags}>
                                {plan.requiere_fiador ? (
                                    <span className={estilos.flagOn}><ion-icon name="shield-checkmark-outline"></ion-icon> {tr('Fiador requerido', 'Guarantor required')}</span>
                                ) : (
                                    <span className={estilos.flagOff}><ion-icon name="shield-outline"></ion-icon> {tr('Sin fiador', 'No guarantor')}</span>
                                )}
                                {plan.permite_anticipado ? (
                                    <span className={estilos.flagOn}><ion-icon name="flash-outline"></ion-icon> {tr('Pago anticipado', 'Early payment')}</span>
                                ) : (
                                    <span className={estilos.flagOff}><ion-icon name="flash-off-outline"></ion-icon> {tr('Sin anticipado', 'No early payment')}</span>
                                )}
                            </div>

                            <div className={estilos.planAcciones}>
                                <Link href={`/admin/planes/ver/${plan.id}`} className={estilos.btnVer}>
                                    <ion-icon name="eye-outline"></ion-icon>
                                    <span>{tr('Ver', 'View')}</span>
                                </Link>
                                <Link href={`/admin/planes/editar/${plan.id}`} className={estilos.btnEditar}>
                                    <ion-icon name="pencil-outline"></ion-icon>
                                    <span>{tr('Editar', 'Edit')}</span>
                                </Link>
                                <button
                                    className={`${estilos.btnToggle} ${plan.activo ? estilos.btnDesactivar : estilos.btnActivar}`}
                                    onClick={() => handleToggle(plan.id, plan.activo)}
                                >
                                    <ion-icon name={plan.activo ? 'pause-outline' : 'play-outline'}></ion-icon>
                                    <span>{plan.activo ? tr('Desactivar', 'Deactivate') : tr('Activar', 'Activate')}</span>
                                </button>

                            </div>
                        </div>
                    ))}
                </div>
            )}


        </div>
    )
}