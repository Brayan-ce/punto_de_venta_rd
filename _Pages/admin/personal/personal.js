"use client"
import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {obtenerTrabajadores, obtenerPersonalEnCampo, obtenerEstadisticasPersonal} from './servidor'
import estilos from './personal.module.css'
import Image from 'next/image'

export default function PersonalAdmin() {
    const router = useRouter()
    const [trabajadores, setTrabajadores] = useState([])
    const [personalEnCampo, setPersonalEnCampo] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [vista, setVista] = useState('dashboard') // 'dashboard', 'todos', 'en_campo'
    const [filtros, setFiltros] = useState({
        busqueda: '',
        rol: '',
        estado: 'activo'
    })
    const [cargando, setCargando] = useState(true)
    const [tema, setTema] = useState('light')

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        cargarDatos()

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
    }, [vista, filtros])

    async function cargarDatos() {
        setCargando(true)

        // Siempre cargar estadísticas para el dashboard
        const resEstadisticas = await obtenerEstadisticasPersonal()
        if (resEstadisticas.success) {
            setEstadisticas(resEstadisticas.data)
        }

        if (vista === 'en_campo') {
            const res = await obtenerPersonalEnCampo()
            if (res.success) {
                setPersonalEnCampo(res.personal)
            }
        } else if (vista === 'todos') {
            const res = await obtenerTrabajadores(filtros)
            if (res.success) {
                setTrabajadores(res.trabajadores)
            }
        }

        setCargando(false)
    }

    const handleFiltroChange = (name, value) => {
        setFiltros(prev => ({...prev, [name]: value}))
    }

    const personalActivo = personalEnCampo.filter(p => p.estado === 'activo')
    const enObras = personalActivo.filter(p => p.tipo_destino === 'obra')
    const enServicios = personalActivo.filter(p => p.tipo_destino === 'servicio')
    const disponibles = trabajadores.filter(t =>
        t.estado === 'activo' &&
        (!t.asignaciones_activas || t.asignaciones_activas === 0)
    )

    const totalTrabajadores = estadisticas?.total_trabajadores || 0
    const totalActivos = estadisticas?.activos || personalActivo.length
    const totalEnObras = estadisticas?.en_obras || enObras.length
    const totalEnServicios = estadisticas?.en_servicios || enServicios.length
    const totalDisponibles = estadisticas?.disponibles || disponibles.length

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header Principal */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Personal en Campo</h1>
                    <p className={estilos.subtitulo}>
                        Gestión integral de trabajadores, asignaciones y control de asistencia
                    </p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button
                        className={estilos.btnNuevo}
                        onClick={() => router.push('/admin/personal/nuevo')}
                    >
                        <ion-icon name="person-add-outline"></ion-icon>
                        <span>Nuevo Trabajador</span>
                    </button>
                    <button
                        className={estilos.btnAsignar}
                        onClick={() => router.push('/admin/personal/asignar')}
                    >
                        <ion-icon name="briefcase-outline"></ion-icon>
                        <span>Asignar Personal</span>
                    </button>
                </div>
            </div>

            {/* Navegación por pestañas */}
            <div className={estilos.navegacion}>
                <button
                    className={`${estilos.navBtn} ${vista === 'dashboard' ? estilos.navBtnActivo : ''}`}
                    onClick={() => setVista('dashboard')}
                >
                    <ion-icon name="grid-outline"></ion-icon>
                    <span>Dashboard</span>
                </button>
                <button
                    className={`${estilos.navBtn} ${vista === 'en_campo' ? estilos.navBtnActivo : ''}`}
                    onClick={() => setVista('en_campo')}
                >
                    <ion-icon name="people-circle-outline"></ion-icon>
                    <span>Personal en Campo</span>
                    {totalActivos > 0 && <span className={estilos.badge}>{totalActivos}</span>}
                </button>
                <button
                    className={`${estilos.navBtn} ${vista === 'todos' ? estilos.navBtnActivo : ''}`}
                    onClick={() => setVista('todos')}
                >
                    <ion-icon name="people-outline"></ion-icon>
                    <span>Todos los Trabajadores</span>
                </button>
            </div>

            {/* Vista Dashboard */}
            {vista === 'dashboard' && (
                <>
                    {/* KPIs Principales */}
                    <div className={estilos.estadisticas}>
                        <div className={`${estilos.estadCard} ${estilos.primary}`}>
                            <div className={estilos.estadIconoWrapper}>
                                <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                                    <ion-icon name="people-outline"></ion-icon>
                                </div>
                            </div>
                            <div className={estilos.estadInfo}>
                                <p className={estilos.estadLabel}>Total Trabajadores</p>
                                <p className={estilos.estadValor}>{totalTrabajadores}</p>
                                <p className={estilos.estadTendencia}>
                                    <ion-icon name="trending-up-outline"></ion-icon>
                                    +5% vs mes anterior
                                </p>
                            </div>
                        </div>

                        <div className={`${estilos.estadCard} ${estilos.success}`}>
                            <div className={estilos.estadIconoWrapper}>
                                <div className={`${estilos.estadIcono} ${estilos.success}`}>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                </div>
                            </div>
                            <div className={estilos.estadInfo}>
                                <p className={estilos.estadLabel}>Personal Activo Hoy</p>
                                <p className={estilos.estadValor}>{totalActivos}</p>
                                <p className={estilos.estadTendencia}>
                                    <ion-icon name="time-outline"></ion-icon>
                                    En campo ahora
                                </p>
                            </div>
                        </div>

                        <div className={`${estilos.estadCard} ${estilos.info}`}>
                            <div className={estilos.estadIconoWrapper}>
                                <div className={`${estilos.estadIcono} ${estilos.info}`}>
                                    <span style={{fontSize: '28px'}}>🏗️</span>
                                </div>
                            </div>
                            <div className={estilos.estadInfo}>
                                <p className={estilos.estadLabel}>En Obras</p>
                                <p className={estilos.estadValor}>{totalEnObras}</p>
                                <p className={estilos.estadTendencia}>
                                    {totalEnServicios} en servicios
                                </p>
                            </div>
                        </div>

                        <div className={`${estilos.estadCard} ${estilos.warning}`}>
                            <div className={estilos.estadIconoWrapper}>
                                <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                                    <ion-icon name="person-circle-outline"></ion-icon>
                                </div>
                            </div>
                            <div className={estilos.estadInfo}>
                                <p className={estilos.estadLabel}>Disponibles</p>
                                <p className={estilos.estadValor}>{totalDisponibles}</p>
                                <p className={estilos.estadTendencia}>
                                    Listos para asignar
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Grid Principal: Distribución + Resumen */}
                    <div className={estilos.gridPrincipal}>
                        {/* Card de Distribución */}
                        <div className={estilos.cardGrafica}>
                            <div className={estilos.cardGraficaHeader}>
                                <div>
                                    <h2 className={estilos.cardGraficaTitulo}>Distribución del Personal</h2>
                                    <p className={estilos.cardGraficaSubtitulo}>Estado actual del equipo</p>
                                </div>
                                <div className={estilos.totalUnidades}>
                                    <p className={estilos.totalUnidadesLabel}>Total</p>
                                    <p className={estilos.totalUnidadesValor}>{totalTrabajadores}</p>
                                </div>
                            </div>

                            {/* Gráfica circular */}
                            <div className={estilos.graficaCircular}>
                                <svg className={estilos.donaChart} viewBox="0 0 160 160">
                                    <circle
                                        className={estilos.donaFondo}
                                        cx="80"
                                        cy="80"
                                        r="60"
                                    />
                                    {/* Segmento En Obras */}
                                    <circle
                                        className={estilos.donaSegmento}
                                        cx="80"
                                        cy="80"
                                        r="60"
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="24"
                                        strokeDasharray={`${totalTrabajadores > 0 ? (totalEnObras / totalTrabajadores) * 377 : 0} 377`}
                                        strokeDashoffset="0"
                                    />
                                    {/* Segmento En Servicios */}
                                    <circle
                                        className={estilos.donaSegmento}
                                        cx="80"
                                        cy="80"
                                        r="60"
                                        fill="none"
                                        stroke="#9333ea"
                                        strokeWidth="24"
                                        strokeDasharray={`${totalTrabajadores > 0 ? (totalEnServicios / totalTrabajadores) * 377 : 0} 377`}
                                        strokeDashoffset={`-${totalTrabajadores > 0 ? (totalEnObras / totalTrabajadores) * 377 : 0}`}
                                    />
                                    {/* Segmento Disponibles */}
                                    <circle
                                        className={estilos.donaSegmento}
                                        cx="80"
                                        cy="80"
                                        r="60"
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="24"
                                        strokeDasharray={`${totalTrabajadores > 0 ? (totalDisponibles / totalTrabajadores) * 377 : 0} 377`}
                                        strokeDashoffset={`-${totalTrabajadores > 0 ? ((totalEnObras + totalEnServicios) / totalTrabajadores) * 377 : 0}`}
                                    />
                                    <text x="80" y="75" className={estilos.donaTextoValor}>{totalActivos}</text>
                                    <text x="80" y="90" className={estilos.donaTextoLabel}>Activos</text>
                                </svg>

                                <div className={estilos.leyendaCircular}>
                                    <div className={estilos.leyendaItem}>
                                        <div className={`${estilos.leyendaDot} ${estilos.vendidos}`}></div>
                                        <div className={estilos.leyendaInfo}>
                                            <p className={estilos.leyendaLabel}>En Obras</p>
                                            <p className={estilos.leyendaValor}>{totalEnObras}</p>
                                        </div>
                                        <p className={estilos.leyendaPorcentaje}>
                                            {totalTrabajadores > 0 ? Math.round((totalEnObras / totalTrabajadores) * 100) : 0}%
                                        </p>
                                    </div>
                                    <div className={estilos.leyendaItem}>
                                        <div className={`${estilos.leyendaDot} ${estilos.financiados}`}></div>
                                        <div className={estilos.leyendaInfo}>
                                            <p className={estilos.leyendaLabel}>En Servicios</p>
                                            <p className={estilos.leyendaValor}>{totalEnServicios}</p>
                                        </div>
                                        <p className={estilos.leyendaPorcentaje}>
                                            {totalTrabajadores > 0 ? Math.round((totalEnServicios / totalTrabajadores) * 100) : 0}%
                                        </p>
                                    </div>
                                    <div className={estilos.leyendaItem}>
                                        <div className={`${estilos.leyendaDot} ${estilos.disponibles}`}></div>
                                        <div className={estilos.leyendaInfo}>
                                            <p className={estilos.leyendaLabel}>Disponibles</p>
                                            <p className={estilos.leyendaValor}>{totalDisponibles}</p>
                                        </div>
                                        <p className={estilos.leyendaPorcentaje}>
                                            {totalTrabajadores > 0 ? Math.round((totalDisponibles / totalTrabajadores) * 100) : 0}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card de Personal Destacado */}
                        <div className={estilos.cardTablaRecientes}>
                            <div className={estilos.cardTablaRecientesHeader}>
                                <h3 className={estilos.cardTablaTitulo}>
                                    <ion-icon name="star-outline"></ion-icon>
                                    Personal Activo Hoy
                                </h3>
                                <p className={estilos.cardTablaSubtitulo}>
                                    {personalActivo.length} trabajadores en campo
                                </p>
                            </div>

                            {personalActivo.length === 0 ? (
                                <div className={estilos.tablaVacia}>
                                    <div className={estilos.ilustracionVacia}>
                                        <Image
                                            src="/illustrations3D/_0015.svg"
                                            alt="Sin personal activo"
                                            width={200}
                                            height={200}
                                            className={estilos.ilustracion}
                                        />
                                    </div>
                                    <ion-icon name="people-outline"></ion-icon>
                                    <p>No hay personal activo en campo hoy</p>
                                </div>
                            ) : (
                                <>
                                    <div className={estilos.tablaSimple}>
                                        {personalActivo.slice(0, 5).map(persona => (
                                            <div key={persona.id} className={estilos.filaEquipo}>
                                                <div className={estilos.equipoImagenContainer}>
                                                    <div className={estilos.equipoImagenPlaceholder}>
                                                        <ion-icon name="person-circle-outline"></ion-icon>
                                                    </div>
                                                </div>
                                                <div className={estilos.equipoInfo}>
                                                    <p className={estilos.equipoNombre}>
                                                        {persona.nombre} {persona.apellidos}
                                                    </p>
                                                    <p className={estilos.equipoCategoria}>{persona.rol}</p>
                                                </div>
                                                <div className={estilos.equipoPrecio}>
                                                    {persona.horas_trabajadas || 0}h
                                                </div>
                                                <div className={estilos.equipoStock}>
                                                    <span className={`${estilos.stockBadgeSimple} ${estilos[persona.tipo_destino === 'obra' ? 'disponible' : 'agotado']}`}>
                                                        {persona.tipo_destino === 'obra' ? '🏗️ Obra' : '⚡ Servicio'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        className={estilos.btnVerTodosEquipos}
                                        onClick={() => setVista('en_campo')}
                                    >
                                        Ver Todo el Personal en Campo
                                        <ion-icon name="arrow-forward-outline"></ion-icon>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Ilustración decorativa */}
                    <div className={estilos.seccionIlustrativa}>
                        <div className={estilos.ilustracionGrande}>
                            <Image
                                src="/illustrations3D/_0008.svg"
                                alt="Equipo de trabajo"
                                width={400}
                                height={400}
                                className={estilos.ilustracion}
                            />
                        </div>
                        <div className={estilos.contenidoIlustrativo}>
                            <h3>Gestiona tu equipo de manera eficiente</h3>
                            <p>Control total de asignaciones, asistencias y productividad en tiempo real</p>
                            <button
                                className={estilos.btnAccionIlustrativa}
                                onClick={() => router.push('/admin/personal/reportes')}
                            >
                                <ion-icon name="analytics-outline"></ion-icon>
                                Ver Reportes Detallados
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Vista Personal en Campo */}
            {vista === 'en_campo' && (
                <>
                    <div className={estilos.filtrosBar}>
                        <div className={estilos.busquedaAvanzada}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input
                                type="text"
                                placeholder="Buscar trabajador o ubicación..."
                                value={filtros.busqueda}
                                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                            />
                        </div>
                        <select
                            className={estilos.filtroSelect}
                            value={filtros.rol}
                            onChange={(e) => handleFiltroChange('rol', e.target.value)}
                        >
                            <option value="">Todos los roles</option>
                            <option value="Electricista">Electricista</option>
                            <option value="Albañil">Albañil</option>
                            <option value="Plomero">Plomero</option>
                            <option value="Ayudante">Ayudante</option>
                            <option value="Carpintero">Carpintero</option>
                            <option value="Pintor">Pintor</option>
                        </select>
                    </div>
                    {cargando ? (
                        <div className={estilos.cargando}>
                            <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                            <p>Cargando personal en campo...</p>
                        </div>
                    ) : personalActivo.length === 0 ? (
                        <div className={estilos.vacio}>
                            <div className={estilos.vacioIcono}>
                                <Image
                                    src="/illustrations3D/_0015.svg"
                                    alt="Sin personal"
                                    width={300}
                                    height={300}
                                    className={estilos.ilustracion}
                                />
                            </div>
                            <h3 className={estilos.vacioTitulo}>No hay personal activo en campo</h3>
                            <p className={estilos.vacioTexto}>
                                Asigna trabajadores a obras o servicios para comenzar
                            </p>
                            <button
                                className={estilos.btnNuevoVacio}
                                onClick={() => router.push('/admin/personal/asignar')}
                            >
                                <ion-icon name="add-circle-outline"></ion-icon>
                                Asignar Personal Ahora
                            </button>
                        </div>
                    ) : (
                        <div className={estilos.listaPersonal}>
                            {personalActivo.map(persona => (
                                <div key={persona.id} className={estilos.tarjetaPersonal}>
                                    <div className={estilos.tarjetaPersonalHeader}>
                                        <div className={estilos.avatarGrande}>
                                            {persona.nombre.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className={estilos.infoPersonal}>
                                            <h3 className={estilos.nombrePersonal}>
                                                {persona.nombre} {persona.apellidos}
                                            </h3>
                                            <span className={estilos.rolBadge}>{persona.rol}</span>
                                        </div>
                                        <div className={estilos.estadoActivoIndicador}>
                                            <span className={estilos.puntoParpadeante}></span>
                                            En campo
                                        </div>
                                    </div>

                                    <div className={estilos.tarjetaPersonalBody}>
                                        <div className={estilos.infoGrid}>
                                            <div className={estilos.infoItem}>
                                                <ion-icon name="business-outline"></ion-icon>
                                                <div>
                                                    <span className={estilos.infoLabel}>Destino</span>
                                                    <p className={estilos.infoValor}>
                                                        {persona.obra_nombre || persona.servicio_nombre}
                                                    </p>
                                                </div>
                                            </div>
                                            {persona.zona_trabajo && (
                                                <div className={estilos.infoItem}>
                                                    <ion-icon name="location-outline"></ion-icon>
                                                    <div>
                                                        <span className={estilos.infoLabel}>Zona</span>
                                                        <p className={estilos.infoValor}>{persona.zona_trabajo}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {persona.actividad && (
                                                <div className={estilos.infoItem}>
                                                    <ion-icon name="construct-outline"></ion-icon>
                                                    <div>
                                                        <span className={estilos.infoLabel}>Actividad</span>
                                                        <p className={estilos.infoValor}>{persona.actividad}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className={estilos.infoItem}>
                                                <ion-icon name="time-outline"></ion-icon>
                                                <div>
                                                    <span className={estilos.infoLabel}>Horas trabajadas</span>
                                                    <p className={estilos.infoValor}>
                                                        {persona.horas_trabajadas || 0}h
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={estilos.tipoBadgeContainer}>
                                            <span className={persona.tipo_destino === 'obra' ? estilos.badgeObra : estilos.badgeServicio}>
                                                {persona.tipo_destino === 'obra' ? '🏗️ Obra' : '⚡ Servicio'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={estilos.tarjetaPersonalFooter}>
                                        <button
                                            className={estilos.btnAccion}
                                            onClick={() => router.push(`/admin/personal/ver/${persona.trabajador_id}`)}
                                        >
                                            <ion-icon name="eye-outline"></ion-icon>
                                            Ver Perfil
                                        </button>
                                        <button
                                            className={estilos.btnAccionPrimary}
                                            onClick={() => router.push(`/admin/personal/asignar?trabajador=${persona.trabajador_id}`)}
                                        >
                                            <ion-icon name="swap-horizontal-outline"></ion-icon>
                                            Reasignar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Vista Todos los Trabajadores */}
            {vista === 'todos' && (
                <>
                    <div className={estilos.filtrosBar}>
                        <div className={estilos.busquedaAvanzada}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o documento..."
                                value={filtros.busqueda}
                                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                            />
                        </div>
                        <select
                            className={estilos.filtroSelect}
                            value={filtros.rol}
                            onChange={(e) => handleFiltroChange('rol', e.target.value)}
                        >
                            <option value="">Todos los roles</option>
                            <option value="Electricista">Electricista</option>
                            <option value="Albañil">Albañil</option>
                            <option value="Plomero">Plomero</option>
                            <option value="Ayudante">Ayudante</option>
                            <option value="Carpintero">Carpintero</option>
                            <option value="Pintor">Pintor</option>
                        </select>
                        <select
                            className={estilos.filtroSelect}
                            value={filtros.estado}
                            onChange={(e) => handleFiltroChange('estado', e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                        </select>
                    </div>

                    {cargando ? (
                        <div className={estilos.cargando}>
                            <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                            <p>Cargando trabajadores...</p>
                        </div>
                    ) : trabajadores.length === 0 ? (
                        <div className={estilos.vacio}>
                            <div className={estilos.vacioIcono}>
                                <ion-icon name="people-outline"></ion-icon>
                            </div>
                            <h3 className={estilos.vacioTitulo}>No se encontraron trabajadores</h3>
                            <p className={estilos.vacioTexto}>
                                Intenta ajustar los filtros o agrega nuevos trabajadores
                            </p>
                            <button
                                className={estilos.btnNuevoVacio}
                                onClick={() => router.push('/admin/personal/nuevo')}
                            >
                                <ion-icon name="person-add-outline"></ion-icon>
                                Agregar Primer Trabajador
                            </button>
                        </div>
                    ) : (
                        <div className={estilos.tablaTrabajadores}>
                            {trabajadores.map(trabajador => (
                                <div key={trabajador.id} className={estilos.filaTrabajador}>
                                    <div className={estilos.trabajadorAvatar}>
                                        {trabajador.nombre.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className={estilos.trabajadorInfo}>
                                        <h4>{trabajador.nombre} {trabajador.apellidos}</h4>
                                        <p className={estilos.trabajadorRol}>{trabajador.rol_especialidad}</p>
                                        <div className={estilos.trabajadorDatos}>
                                            <span><ion-icon name="card-outline"></ion-icon> {trabajador.numero_documento}</span>
                                            {trabajador.telefono && (
                                                <span><ion-icon name="call-outline"></ion-icon> {trabajador.telefono}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={estilos.trabajadorEstado}>
                                        <span className={trabajador.estado === 'activo' ? estilos.estadoActivo : estilos.estadoInactivo}>
                                            {trabajador.estado}
                                        </span>
                                        {trabajador.asignaciones_activas > 0 && (
                                            <span className={estilos.asignacionBadge}>
                                                {trabajador.asignaciones_activas} asignación{trabajador.asignaciones_activas > 1 ? 'es' : ''}
                                            </span>
                                        )}
                                    </div>
                                    {trabajador.tarifa_por_hora && (
                                        <div className={estilos.trabajadorTarifa}>
                                            <span className={estilos.tarifaValor}>RD${trabajador.tarifa_por_hora}</span>
                                            <span className={estilos.tarifaLabel}>/ hora</span>
                                        </div>
                                    )}
                                    <div className={estilos.trabajadorAcciones}>
                                        <button
                                            className={`${estilos.btnAccionTabla} ${estilos.ver}`}
                                            onClick={() => router.push(`/admin/personal/ver/${trabajador.id}`)}
                                        >
                                            <ion-icon name="eye-outline"></ion-icon>
                                        </button>
                                        <button
                                            className={`${estilos.btnAccionTabla} ${estilos.editar}`}
                                            onClick={() => router.push(`/admin/personal/asignar?trabajador=${trabajador.id}`)}
                                        >
                                            <ion-icon name="briefcase-outline"></ion-icon>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

