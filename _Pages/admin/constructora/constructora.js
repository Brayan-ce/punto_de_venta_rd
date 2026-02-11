"use client"
import { useState, useEffect, Suspense, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerDashboardConstructora } from './servidor'
import { formatearEstadoObra, formatearPrioridad } from '../core/construction/estados'
import { calcularPorcentajeEjecutado, calcularDiasRestantes } from '../core/construction/calculos'
import { obtenerSeveridadAlerta } from '../core/construction/reglas'
import { EstadisticasCards, NavVistas, AlertasPresupuesto, GraficaDistribucion } from './components'
import estilos from './constructora.module.css'

// Dynamic imports para vistas pesadas (lazy loading)
const VistaGantt = dynamic(() => import('./components/VistaGantt'), {
    loading: () => (
        <div className={estilos.cargando}>
            <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
            <p>Cargando timeline...</p>
        </div>
    ),
    ssr: false
})

const VistaHorarios = dynamic(() => import('./components/VistaHorarios'), {
    loading: () => (
        <div className={estilos.cargando}>
            <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
            <p>Cargando horarios...</p>
        </div>
    ),
    ssr: false
})

export default function ConstructoraAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [dashboard, setDashboard] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [vistaActiva, setVistaActiva] = useState('resumen') // resumen, gantt, horarios

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
        cargarDashboard()
    }, [])

    async function cargarDashboard() {
        setCargando(true)
        const res = await obtenerDashboardConstructora()
        if (res.success) {
            setDashboard(res.dashboard)
        }
        setCargando(false)
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 0
        }).format(monto || 0)
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Memoizar cálculos pesados
    const porcentajes = useMemo(() => {
        if (!dashboard) return { obras: 0, servicios: 0, personal: 0 }
        
        const total = dashboard.estadisticas.obras_activas + 
                      dashboard.estadisticas.servicios_pendientes + 
                      dashboard.estadisticas.personal_campo
        
        if (total === 0) return { obras: 33, servicios: 33, personal: 34 }
        
        return {
            obras: ((dashboard.estadisticas.obras_activas / total) * 100).toFixed(1),
            servicios: ((dashboard.estadisticas.servicios_pendientes / total) * 100).toFixed(1),
            personal: ((dashboard.estadisticas.personal_campo / total) * 100).toFixed(1)
        }
    }, [dashboard?.estadisticas])

    // Memoizar datos de Gantt
    const ganttData = useMemo(() => {
        if (!dashboard || !dashboard.obras_activas) return []
        
        return dashboard.obras_activas.map(obra => {
            const inicio = obra.fecha_inicio ? new Date(obra.fecha_inicio) : new Date()
            const fin = obra.fecha_fin_estimada ? new Date(obra.fecha_fin_estimada) : new Date()
            const hoy = new Date()
            
            const totalDias = Math.max(1, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)))
            const diasTranscurridos = Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))
            const progreso = Math.min(100, Math.max(0, (diasTranscurridos / totalDias) * 100))
            
            return {
                id: obra.id,
                nombre: obra.nombre,
                codigo: obra.codigo_obra,
                inicio: formatearFecha(obra.fecha_inicio),
                fin: formatearFecha(obra.fecha_fin_estimada),
                progreso: progreso.toFixed(0),
                estado: obra.estado
            }
        }).slice(0, 6) // Mostrar solo 6 para no saturar
    }, [dashboard?.obras_activas])

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <h3>Cargando dashboard...</h3>
                    <p>Obteniendo información actualizada</p>
                </div>
            </div>
        )
    }

    if (!dashboard) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.vacio}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h3>Error al cargar el dashboard</h3>
                    <p>No se pudo obtener la información. Intenta recargar la página.</p>
                    <button className={estilos.btnNuevo} onClick={() => window.location.reload()}>
                        <ion-icon name="refresh-outline"></ion-icon>
                        <span>Recargar</span>
                    </button>
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
                        <ion-icon name="hammer-outline"></ion-icon>
                        Control de Obras y Costos
                    </h1>
                    <p className={estilos.subtitulo}>
                        {new Date().toLocaleDateString('es-DO', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/admin/servicios/nuevo" className={estilos.btnSecundario}>
                        <ion-icon name="flash-outline"></ion-icon>
                        <span>Nuevo Servicio</span>
                    </Link>
                    <Link href="/admin/obras/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nueva Obra</span>
                    </Link>
                </div>
            </div>

            {/* Tarjetas de Estadísticas Principales */}
            <EstadisticasCards 
                dashboard={dashboard} 
                tema={tema} 
                formatearMoneda={formatearMoneda} 
            />

            {/* Navegación de Vistas */}
            <NavVistas 
                vistaActiva={vistaActiva} 
                setVistaActiva={setVistaActiva} 
            />

            {/* Vista: Resumen */}
            {vistaActiva === 'resumen' && (
                <>
                    {/* Alertas de Presupuesto */}
                    <AlertasPresupuesto dashboard={dashboard} tema={tema} />

                    {/* Grid Principal: Distribución y Obras */}
                    <div className={estilos.gridPrincipal}>
                        {/* Gráfica de Distribución */}
                        <GraficaDistribucion 
                            dashboard={dashboard} 
                            porcentajes={porcentajes} 
                            tema={tema} 
                        />

                        {/* Obras Activas */}
                        <div className={`${estilos.cardObrasActivas} ${estilos[tema]}`}>
                            <div className={estilos.cardObrasHeader}>
                                <div>
                                    <h3 className={estilos.cardObrasTitulo}>
                                        <ion-icon name="business-outline"></ion-icon>
                                        Obras Activas
                                    </h3>
                                    <p className={estilos.cardObrasSubtitulo}>Proyectos en construcción</p>
                                </div>
                                <Link href="/admin/obras" className={estilos.verTodosLink}>
                                    Ver todas
                                    <ion-icon name="arrow-forward-outline"></ion-icon>
                                </Link>
                            </div>

                            {!dashboard.obras_activas || dashboard.obras_activas.length === 0 ? (
                                <div className={estilos.obrasVacio}>
                                    <img
                                        src="/illustrations3D/_0001.svg"
                                        alt="Sin obras"
                                        width={200}
                                        height={200}
                                        className={estilos.ilustracionVacio}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <h4>No hay obras activas</h4>
                                    <p>Crea tu primera obra para comenzar</p>
                                    <Link href="/admin/obras/nuevo" className={estilos.btnNuevoVacio}>
                                        <ion-icon name="add-outline"></ion-icon>
                                        <span>Nueva Obra</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className={estilos.listaObras}>
                                    {dashboard.obras_activas.slice(0, 4).map(obra => {
                                        const porcentajeEjecutado = calcularPorcentajeEjecutado(
                                            obra.costo_ejecutado || 0,
                                            obra.presupuesto_aprobado || 0
                                        )
                                        const diasRestantes = obra.fecha_fin_estimada 
                                            ? calcularDiasRestantes(obra.fecha_fin_estimada)
                                            : null
                                        
                                        return (
                                            <Link 
                                                key={obra.id} 
                                                href={`/admin/obras/ver/${obra.id}`}
                                                className={estilos.tarjetaObra}
                                            >
                                                <div className={estilos.obraHeader}>
                                                    <div className={estilos.obraTitulo}>
                                                        <span className={estilos.codigoObra}>{obra.codigo_obra}</span>
                                                        <h4>{obra.nombre}</h4>
                                                        <p className={estilos.ubicacion}>
                                                            <ion-icon name="location-outline"></ion-icon>
                                                            <span>{obra.ubicacion}</span>
                                                        </p>
                                                    </div>
                                                    {porcentajeEjecutado > 0 && (
                                                        <div className={`${estilos.badgeProgreso} ${
                                                            porcentajeEjecutado >= 90 ? estilos.critico :
                                                            porcentajeEjecutado >= 70 ? estilos.atencion :
                                                            estilos.normal
                                                        }`}>
                                                            {porcentajeEjecutado.toFixed(0)}%
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={estilos.obraBody}>
                                                    <div className={estilos.infoObra}>
                                                        <div className={estilos.infoItem}>
                                                            <ion-icon name="cash-outline"></ion-icon>
                                                            <div>
                                                                <span>Presupuesto</span>
                                                                <strong>{formatearMoneda(obra.presupuesto_aprobado)}</strong>
                                                            </div>
                                                        </div>
                                                        {obra.costo_ejecutado > 0 && (
                                                            <div className={estilos.infoItem}>
                                                                <ion-icon name="trending-up-outline"></ion-icon>
                                                                <div>
                                                                    <span>Ejecutado</span>
                                                                    <strong>{formatearMoneda(obra.costo_ejecutado)}</strong>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {porcentajeEjecutado > 0 && (
                                                        <div className={estilos.progresoObra}>
                                                            <div className={estilos.barraProgreso}>
                                                                <div 
                                                                    className={`${estilos.progresoFill} ${
                                                                        porcentajeEjecutado >= 90 ? estilos.critico :
                                                                        porcentajeEjecutado >= 70 ? estilos.atencion :
                                                                        estilos.normal
                                                                    }`}
                                                                    style={{ width: `${Math.min(porcentajeEjecutado, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {diasRestantes !== null && (
                                                    <div className={estilos.obraFooter}>
                                                        <ion-icon name="calendar-outline"></ion-icon>
                                                        <span className={diasRestantes < 0 ? estilos.diasVencidos : ''}>
                                                            {diasRestantes > 0 ? `${diasRestantes} días restantes` : 'Vencida'}
                                                        </span>
                                                    </div>
                                                )}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sección de Personal y Servicios */}
                    <div className={estilos.gridSecundario}>
                        {/* Personal en Campo */}
                        <div className={`${estilos.cardPersonal} ${estilos[tema]}`}>
                            <div className={estilos.cardPersonalHeader}>
                                <h3>
                                    <ion-icon name="people-outline"></ion-icon>
                                    Personal en Campo
                                </h3>
                                <Link href="/admin/personal" className={estilos.verTodosLink}>
                                    Ver todos
                                    <ion-icon name="arrow-forward-outline"></ion-icon>
                                </Link>
                            </div>

                            {!dashboard.personal_campo || dashboard.personal_campo.length === 0 ? (
                                <div className={estilos.personalVacio}>
                                    <img
                                        src="/illustrations3D/_0008.svg"
                                        alt="Sin personal"
                                        width={150}
                                        height={150}
                                        className={estilos.ilustracionVacio}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <p>No hay personal activo hoy</p>
                                </div>
                            ) : (
                                <div className={estilos.listaPersonal}>
                                    {dashboard.personal_campo.slice(0, 5).map(persona => (
                                        <div key={persona.id} className={estilos.itemPersonal}>
                                            <div className={estilos.avatarPersonal}>
                                                {persona.nombre?.charAt(0)}{persona.apellidos?.charAt(0)}
                                            </div>
                                            <div className={estilos.personalInfo}>
                                                <h5>{persona.nombre} {persona.apellidos}</h5>
                                                <p className={estilos.rolPersonal}>
                                                    <ion-icon name="construct-outline"></ion-icon>
                                                    {persona.rol}
                                                </p>
                                                <p className={estilos.asignacion}>
                                                    <ion-icon name="location-outline"></ion-icon>
                                                    {persona.obra_nombre || persona.servicio_nombre}
                                                </p>
                                            </div>
                                            <div className={estilos.estadoPersonal}>
                                                <div className={estilos.indicadorActivo}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Servicios del Día */}
                        <div className={`${estilos.cardServicios} ${estilos[tema]}`}>
                            <div className={estilos.cardServiciosHeader}>
                                <h3>
                                    <ion-icon name="flash-outline"></ion-icon>
                                    Servicios del Día
                                </h3>
                                <Link href="/admin/servicios" className={estilos.verTodosLink}>
                                    Ver todos
                                    <ion-icon name="arrow-forward-outline"></ion-icon>
                                </Link>
                            </div>

                            {!dashboard.servicios_hoy || dashboard.servicios_hoy.length === 0 ? (
                                <div className={estilos.serviciosVacio}>
                                    <img
                                        src="/lustracion_reparaciones/Electric drill_3D.svg"
                                        alt="Sin servicios"
                                        width={120}
                                        height={120}
                                        className={estilos.ilustracionVacio}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <p>No hay servicios programados hoy</p>
                                </div>
                            ) : (
                                <div className={estilos.listaServicios}>
                                    {dashboard.servicios_hoy.slice(0, 4).map(servicio => {
                                        const prioridadFormateada = formatearPrioridad(servicio.prioridad)
                                        return (
                                            <Link
                                                key={servicio.id}
                                                href={`/admin/servicios/ver/${servicio.id}`}
                                                className={estilos.itemServicio}
                                            >
                                                <div className={estilos.servicioIcono}>
                                                    <ion-icon name="flash-outline"></ion-icon>
                                                </div>
                                                <div className={estilos.servicioInfo}>
                                                    <h5>{servicio.nombre}</h5>
                                                    <p>
                                                        <ion-icon name="person-outline"></ion-icon>
                                                        {servicio.cliente_nombre || 'Sin cliente'}
                                                    </p>
                                                </div>
                                                <div className={`${estilos.prioridadBadge} ${estilos[`prioridad_${prioridadFormateada.color}`]}`}>
                                                    {prioridadFormateada.texto}
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
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

            {/* Vista: Horarios */}
            {vistaActiva === 'horarios' && (
                <Suspense fallback={
                    <div className={estilos.cargando}>
                        <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                        <p>Cargando horarios...</p>
                    </div>
                }>
                    <VistaHorarios dashboard={dashboard} tema={tema} />
                </Suspense>
            )}
        </div>
    )
}
