"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerDashboardSimple } from './servidor'
import estilos from './manejo-simple.module.css'

export default function ManejoSimple() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [datos, setDatos] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [filtroObra, setFiltroObra] = useState('')

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
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando...</span>
                </div>
            </div>
        )
    }

    if (!datos) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.vacio}>No se pudieron cargar los datos</div>
            </div>
        )
    }

    const moneda = `${datos.codigo_moneda} ${datos.simbolo_moneda}` || 'DOP RD$'

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="hammer-outline"></ion-icon>
                        Manejo Simple de Obras
                    </h1>
                    <p className={estilos.subtitulo}>
                        Control simplificado de obras, trabajadores y gastos
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
                        <span>Nueva Obra</span>
                    </button>
                </div>
            </div>

            {datos.obras_activas?.length > 1 && (
                <div className={estilos.filtroObra}>
                    <label>
                        <ion-icon name="filter-outline"></ion-icon>
                        Filtrar por obra
                    </label>
                    <select
                        value={filtroObra}
                        onChange={(e) => setFiltroObra(e.target.value)}
                    >
                        <option value="">Todas las obras</option>
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
                        <span className={estilos.statLabel}>Obras Activas</span>
                        <span className={estilos.statValor}>{datos.resumen.total_obras_activas}</span>
                    </div>
                </div>

                <div className={estilos.statCard}>
                    <div className={estilos.statIcono} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <ion-icon name="people-outline"></ion-icon>
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>Trabajadores Activos</span>
                        <span className={estilos.statValor}>{datos.resumen.total_trabajadores}</span>
                    </div>
                </div>

                <div className={estilos.statCard}>
                    <div className={estilos.statIcono} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <ion-icon name="calendar-outline"></ion-icon>
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>Asistencias Hoy</span>
                        <span className={estilos.statValor}>{datos.resumen.asistencias_hoy}</span>
                    </div>
                </div>

                <div className={estilos.statCard}>
                    <div className={estilos.statIcono} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                        <ion-icon name="wallet-outline"></ion-icon>
                    </div>
                    <div className={estilos.statInfo}>
                        <span className={estilos.statLabel}>Gastos del Mes</span>
                        <span className={estilos.statValor}>{moneda} {datos.resumen.gastos_mes.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.grid}>
                <div className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <h2>
                            <ion-icon name="construct-outline"></ion-icon>
                            Obras en Progreso
                        </h2>
                        <button 
                            className={estilos.btnVer}
                            onClick={() => router.push('/admin/manejo-simple/obras')}
                        >
                            Ver Todas
                        </button>
                    </div>
                    <div className={estilos.listaObras}>
                        {datos.obras_activas?.length === 0 ? (
                            <div className={estilos.vacio}>
                                <ion-icon name="business-outline"></ion-icon>
                                <p>No hay obras activas</p>
                                <button 
                                    className={estilos.btnCrear}
                                    onClick={() => router.push('/admin/manejo-simple/obras')}
                                >
                                    Crear Primera Obra
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
                                                <span>{obra.total_trabajadores || 0} trabajadores</span>
                                            </div>
                                            <div className={estilos.obraStat}>
                                                <ion-icon name="cash-outline"></ion-icon>
                                                <span>{moneda} {(obra.presupuesto_total || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {obra.fecha_fin_estimada && (
                                            <div className={estilos.obraFecha}>
                                                <ion-icon name="calendar-outline"></ion-icon>
                                                <span>Fin estimado: {new Date(obra.fecha_fin_estimada).toLocaleDateString()}</span>
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
                                Acceso Rápido
                            </h2>
                        </div>
                        <div className={estilos.accionesRapidas}>
                            <button 
                                className={estilos.accionCard}
                                onClick={() => router.push('/admin/manejo-simple/asistencia')}
                            >
                                <ion-icon name="checkmark-done-outline"></ion-icon>
                                <span>Marcar Asistencia</span>
                            </button>
                            <button 
                                className={estilos.accionCard}
                                onClick={() => router.push('/admin/manejo-simple/gastos')}
                            >
                                <ion-icon name="wallet-outline"></ion-icon>
                                <span>Registrar Gasto</span>
                            </button>
                            <button 
                                className={estilos.accionCard}
                                onClick={() => router.push('/admin/manejo-simple/trabajadores')}
                            >
                                <ion-icon name="person-add-outline"></ion-icon>
                                <span>Nuevo Trabajador</span>
                            </button>
                            <button 
                                className={estilos.accionCard}
                                onClick={() => router.push('/admin/manejo-simple/reportes')}
                            >
                                <ion-icon name="document-text-outline"></ion-icon>
                                <span>Ver Reportes</span>
                            </button>
                        </div>
                    </div>

                    <div className={estilos.seccion}>
                        <div className={estilos.seccionHeader}>
                            <h2>
                                <ion-icon name="trending-up-outline"></ion-icon>
                                Resumen Semanal
                            </h2>
                        </div>
                        <div className={estilos.resumenSemanal}>
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Días trabajados</span>
                                <span className={estilos.resumenValor}>{datos.resumen.dias_trabajados_semana}</span>
                            </div>
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Horas totales</span>
                                <span className={estilos.resumenValor}>{datos.resumen.horas_semana}</span>
                            </div>
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Gastos semana</span>
                                <span className={estilos.resumenValor}>{moneda} {datos.resumen.gastos_semana.toLocaleString()}</span>
                            </div>
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Pagos pendientes</span>
                                <span className={estilos.resumenValor}>{moneda} {datos.resumen.pagos_pendientes.toLocaleString()}</span>
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
                            Últimos Gastos
                        </h2>
                        <button 
                            className={estilos.btnVer}
                            onClick={() => router.push('/admin/manejo-simple/gastos')}
                        >
                            Ver Todos
                        </button>
                    </div>
                    <div className={estilos.tablaGastos}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Obra</th>
                                    <th>Concepto</th>
                                    <th>Tipo</th>
                                    <th>Monto</th>
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