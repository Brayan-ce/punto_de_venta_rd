"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerDashboardSimple } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './manejo-simple.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ManejoSimple() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [datos, setDatos] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [filtroObra, setFiltroObra] = useState('')
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

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
        cargarDatos()
    }, [filtroObra])

    async function cargarDatos() {
        setCargando(true)
        const res = await obtenerDashboardSimple({ obra_id: filtroObra })
        if (res.success) {
            setDatos(res.datos)
        }
        setCargando(false)
    }

    if (cargando) {
        return <LoadingScreen />
    }

    if (!datos) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.vacio}>{tr('No se pudieron cargar los datos', 'Could not load data')}</div>
            </div>
        )
    }

    const moneda = `${datos.codigo_moneda} ${datos.simbolo_moneda}` || 'DOP RD$'
    const resumen = datos.resumen || {}

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="hammer-outline"></ion-icon>
                        {tr('Manejo Simple de Obras', 'Simple Works Management')}
                    </h1>
                    <p className={estilos.subtitulo}>
                        {tr('Control simplificado de obras, trabajadores y gastos', 'Simplified control of projects, workers and expenses')}
                    </p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button 
                        className={estilos.btnAccion}
                        onClick={() => router.push('/admin/manejo-simple/asistencia')}
                    >
                        <ion-icon name="checkmark-done-outline"></ion-icon>
                        <span>Marcar Asistencia</span>
                    </button>
                    <button 
                        className={estilos.btnPrimary}
                        onClick={() => router.push('/admin/manejo-simple/obras')}
                    >
                        <ion-icon name="add-outline"></ion-icon>
                        <span>{tr('Nueva Obra', 'New Project')}</span>
                    </button>
                </div>
            </div>

            {datos.obras_activas?.length > 1 && (
                <div className={estilos.filtroObra}>
                    <label>
                        <ion-icon name="filter-outline"></ion-icon>
                        {tr('Filtrar por obra', 'Filter by project')}
                    </label>
                    <select
                        value={filtroObra}
                        onChange={(e) => setFiltroObra(e.target.value)}
                    >
                        <option value="">{tr('Todas las obras', 'All projects')}</option>
                        {datos.obras_activas.map(obra => (
                            <option key={obra.id} value={obra.id}>
                                {obra.codigo_obra} - {obra.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className={estilos.stats}>
                <div className={estilos.statCard}>
                    <div className={estilos.statIcono} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                        <ion-icon name="business-outline"></ion-icon>
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>{tr('Obras Activas', 'Active Projects')}</span>
                        <span className={estilos.statValor}>{resumen.total_obras_activas ?? 0}</span>
                    </div>
                </div>

                <div className={estilos.statCard}>
                    <div className={estilos.statIcono} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <ion-icon name="people-outline"></ion-icon>
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>{tr('Trabajadores Activos', 'Active Workers')}</span>
                        <span className={estilos.statValor}>{resumen.total_trabajadores ?? 0}</span>
                    </div>
                </div>

                <div className={estilos.statCard}>
                    <div className={estilos.statIcono} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <ion-icon name="calendar-outline"></ion-icon>
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>{tr('Asistencias Hoy', 'Attendance Today')}</span>
                        <span className={estilos.statValor}>{resumen.asistencias_hoy ?? 0}</span>
                    </div>
                </div>

                <div className={estilos.statCard}>
                    <div className={estilos.statIcono} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                        <ion-icon name="wallet-outline"></ion-icon>
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>{tr('Gastos del Mes', 'Monthly Expenses')}</span>
                        <span className={estilos.statValor}>{moneda} {(resumen.gastos_mes ?? 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.grid}>
                <div className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <h2>
                            <ion-icon name="construct-outline"></ion-icon>
                            {tr('Obras en Progreso', 'Projects in Progress')}
                        </h2>
                        <button 
                            className={estilos.btnVer}
                            onClick={() => router.push('/admin/manejo-simple/obras')}
                        >
                            {tr('Ver Todas', 'View All')}
                        </button>
                    </div>
                    <div className={estilos.listaObras}>
                        {datos.obras_activas?.length === 0 ? (
                            <div className={estilos.vacio}>
                                <ion-icon name="business-outline"></ion-icon>
                                <p>{tr('No hay obras activas', 'No active projects')}</p>
                                <button 
                                    className={estilos.btnCrear}
                                    onClick={() => router.push('/admin/manejo-simple/obras')}
                                >
                                    {tr('Crear Primera Obra', 'Create First Project')}
                                </button>
                            </div>
                        ) : (
                            datos.obras_activas?.slice(0, 5).map(obra => (
                                <div key={obra.id} className={estilos.obraCard}>
                                    <div 
                                        className={estilos.obraColor}
                                        style={{ background: obra.color_identificacion || '#3b82f6' }}
                                    ></div>
                                    <div className={estilos.obraInfo}>
                                        <div className={estilos.obraHeader}>
                                            <h3>{obra.nombre}</h3>
                                            <span className={estilos.obraCodigo}>{obra.codigo_obra}</span>
                                        </div>
                                        <div className={estilos.obraStats}>
                                            <div className={estilos.obraStat}>
                                                <ion-icon name="people-outline"></ion-icon>
                                                <span>{obra.total_trabajadores || 0} {tr('trabajadores', 'workers')}</span>
                                            </div>
                                            <div className={estilos.obraStat}>
                                                <ion-icon name="cash-outline"></ion-icon>
                                                <span>{moneda} {(obra.presupuesto_total || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {obra.fecha_fin_estimada && (
                                            <div className={estilos.obraFecha}>
                                                <ion-icon name="calendar-outline"></ion-icon>
                                                <span>{tr('Fin estimado:', 'Est. end:')} {new Date(obra.fecha_fin_estimada).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        className={estilos.btnDetalleObra}
                                        onClick={() => router.push(`/admin/manejo-simple/obras/${obra.id}`)}
                                    >
                                        <ion-icon name="arrow-forward-outline"></ion-icon>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={estilos.sidebar}>
                    <div className={estilos.seccion}>
                        <div className={estilos.seccionHeader}>
                            <h2>
                                <ion-icon name="time-outline"></ion-icon>
                                {tr('Acceso Rápido', 'Quick Access')}
                            </h2>
                        </div>
                        <div className={estilos.accionesRapidas}>
                            <button 
                                className={estilos.accionCard}
                                onClick={() => router.push('/admin/manejo-simple/asistencia')}
                            >
                                <ion-icon name="checkmark-done-outline"></ion-icon>
                                <span>{tr('Marcar Asistencia', 'Mark Attendance')}</span>
                            </button>
                            <button 
                                className={estilos.accionCard}
                                onClick={() => router.push('/admin/manejo-simple/gastos')}
                            >
                                <ion-icon name="wallet-outline"></ion-icon>
                                <span>{tr('Registrar Gasto', 'Record Expense')}</span>
                            </button>
                            <button 
                                className={estilos.accionCard}
                                onClick={() => router.push('/admin/manejo-simple/trabajadores')}
                            >
                                <ion-icon name="person-add-outline"></ion-icon>
                                <span>{tr('Nuevo Trabajador', 'New Worker')}</span>
                            </button>
                            <button 
                                className={estilos.accionCard}
                                onClick={() => router.push('/admin/manejo-simple/reportes')}
                            >
                                <ion-icon name="document-text-outline"></ion-icon>
                                <span>{tr('Ver Reportes', 'View Reports')}</span>
                            </button>
                        </div>
                    </div>

                    <div className={estilos.seccion}>
                        <div className={estilos.seccionHeader}>
                            <h2>
                                <ion-icon name="trending-up-outline"></ion-icon>
                                {tr('Resumen General', 'General Summary')}
                            </h2>
                        </div>
                        <div className={estilos.resumenSemanal}>
                            <div className={estilos.resumenItem}>
                                    <span className={estilos.resumenLabel}>{tr('Días con asistencia', 'Attendance days')}</span>
                                    <span className={estilos.resumenValor}>{resumen.dias_trabajados ?? 0}</span>
                            </div>
                            <div className={estilos.resumenItem}>
                                    <span className={estilos.resumenLabel}>{tr('Horas trabajadas', 'Worked hours')}</span>
                                    <span className={estilos.resumenValor}>{(resumen.horas_trabajadas ?? 0).toLocaleString()}</span>
                            </div>
                            <div className={estilos.resumenItem}>
                                    <span className={estilos.resumenLabel}>{tr('Gastos acumulados', 'Accumulated expenses')}</span>
                                    <span className={estilos.resumenValor}>{moneda} {(resumen.gastos_acumulados ?? 0).toLocaleString()}</span>
                            </div>
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>{tr('Pagos pendientes', 'Pending payments')}</span>
                                <span className={estilos.resumenValor}>{moneda} {(resumen.pagos_pendientes ?? 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {datos.gastos_recientes?.length > 0 && (
                <div className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <h2>
                            <ion-icon name="receipt-outline"></ion-icon>
                            {tr('Últimos Gastos', 'Recent Expenses')}
                        </h2>
                        <button 
                            className={estilos.btnVer}
                            onClick={() => router.push('/admin/manejo-simple/gastos')}
                        >
                            {tr('Ver Todos', 'View All')}
                        </button>
                    </div>
                    <div className={estilos.tablaGastos}>
                        <table>
                            <thead>
                                <tr>
                                    <th>{tr('Fecha', 'Date')}</th>
                                    <th>{tr('Obra', 'Project')}</th>
                                    <th>{tr('Concepto', 'Concept')}</th>
                                    <th>{tr('Tipo', 'Type')}</th>
                                    <th>{tr('Monto', 'Amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datos.gastos_recientes.slice(0, 10).map(gasto => (
                                    <tr key={gasto.id}>
                                        <td>{new Date(gasto.fecha).toLocaleDateString()}</td>
                                        <td>{gasto.obra_nombre}</td>
                                        <td>{gasto.concepto}</td>
                                        <td>
                                            <span className={`${estilos.badge} ${estilos[`badge_${gasto.tipo_gasto}`]}`}>
                                                {gasto.tipo_gasto}
                                            </span>
                                        </td>
                                        <td className={estilos.monto}>{moneda} {gasto.monto.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}