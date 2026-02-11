"use client"
import { useState, useEffect } from 'react'
import { obtenerResumenDashboard } from './servidor'
import estilos from './dashboard.module.css'

export default function DashboardServicios({ tema = 'light' }) {
    const [datos, setDatos] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarDatos()
    }, [])

    async function cargarDatos() {
        setCargando(true)
        const res = await obtenerResumenDashboard()
        if (res.success) {
            setDatos(res.resumen)
        }
        setCargando(false)
    }

    if (cargando) {
        return <div className={estilos.cargando}>Cargando dashboard...</div>
    }

    if (!datos) return null

    const { stats, porTipo, proximos, recientes } = datos

    return (
        <div className={`${estilos.contenedorDashboard} ${estilos[tema]}`}>
            {/* Header */}
            <header className={estilos.header}>
                <div className={estilos.tituloSec}>
                    <h1 className={estilos.titulo}>Resumen Operativo</h1>
                    <p className={estilos.subtitulo}><ion-icon name="calendar-outline"></ion-icon> Vista general de todos los servicios</p>
                </div>
            </header>

            {/* KPIs */}
            <div className={estilos.kpiGrid}>
                <div className={estilos.kpiCard}>
                    <div className={`${estilos.kpiIcono} ${estilos.bgBlue}`}>
                        <ion-icon name="construct-outline"></ion-icon>
                    </div>
                    <div className={estilos.kpiInfo}>
                        <span className={estilos.kpiValor}>{stats.total}</span>
                        <span className={estilos.kpiLabel}>Total Servicios</span>
                    </div>
                </div>
                <div className={estilos.kpiCard}>
                    <div className={`${estilos.kpiIcono} ${estilos.bgAmber}`}>
                        <ion-icon name="reload-outline"></ion-icon>
                    </div>
                    <div className={estilos.kpiInfo}>
                        <span className={estilos.kpiValor}>{stats.en_ejecucion}</span>
                        <span className={estilos.kpiLabel}>En Ejecución</span>
                    </div>
                </div>
                <div className={estilos.kpiCard}>
                    <div className={`${estilos.kpiIcono} ${estilos.bgGreen}`}>
                        <ion-icon name="checkmark-done-outline"></ion-icon>
                    </div>
                    <div className={estilos.kpiInfo}>
                        <span className={estilos.kpiValor}>{stats.finalizados}</span>
                        <span className={estilos.kpiLabel}>Finalizados</span>
                    </div>
                </div>
                <div className={estilos.kpiCard}>
                    <div className={`${estilos.kpiIcono} ${estilos.bgRose}`}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.kpiInfo}>
                        <span className={estilos.kpiValor}>{stats.pendientes}</span>
                        <span className={estilos.kpiLabel}>Pendientes</span>
                    </div>
                </div>
            </div>

            {/* Grid Principal */}
            <div className={estilos.mainGrid}>
                {/* Servicios Recientes */}
                <div className={estilos.panel}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="time-outline"></ion-icon> Actividad Reciente
                        </h2>
                    </div>
                    <div className={estilos.tablaContainer}>
                        <table className={estilos.tabla}>
                            <thead>
                                <tr>
                                    <th>CÓDIGO</th>
                                    <th>SERVICIO</th>
                                    <th>CLIENTE</th>
                                    <th>ESTADO</th>
                                    <th>RESPONSABLE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recientes.map(s => (
                                    <tr key={s.id} className={estilos.fila}>
                                        <td><strong>#{s.codigo_servicio}</strong></td>
                                        <td>{s.nombre}</td>
                                        <td>{s.cliente_nombre}</td>
                                        <td>
                                            <span className={`${estilos.badge} ${s.estado === 'pendiente' ? estilos.badgePendiente :
                                                    s.estado === 'en_ejecucion' ? estilos.badgeEjecucion :
                                                        estilos.badgeFinalizado
                                                }`}>
                                                {s.estado.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{s.responsable_nombre || 'No asignado'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Agenda / Próximos */}
                <div className={estilos.panel}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="flash-outline"></ion-icon> Próximos a Vencer
                        </h2>
                    </div>
                    <div className={estilos.agendaLista}>
                        {proximos.map(p => (
                            <div key={p.id} className={estilos.agendaItem}>
                                <div className={estilos.agendaTop}>
                                    <span className={estilos.agendaFecha}>
                                        {new Date(p.fecha_programada).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span style={{ fontSize: '20px' }}>⚡</span>
                                </div>
                                <span className={estilos.agendaNombre}>{p.nombre}</span>
                                <span className={estilos.agendaCliente}>{p.cliente_nombre}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
