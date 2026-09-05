"use client"
import { useState, useEffect } from 'react'
import { obtenerObrasSimples, eliminarObraSimple, cambiarEstadoObra } from './servidor'
import Nuevo from './nuevo/Nuevo'
import Editar from './editar/Editar'
import Ver from './ver/Ver'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './obras.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const ESTADOS_OBRA = {
    activa: { label: 'Activa', labelEn: 'Active', color: 'success', icon: 'checkmark-circle' },
    pausada: { label: 'Pausada', labelEn: 'Paused', color: 'warning', icon: 'pause-circle' },
    finalizada: { label: 'Finalizada', labelEn: 'Finished', color: 'info', icon: 'checkmark-done-circle' },
    cancelada: { label: 'Cancelada', labelEn: 'Cancelled', color: 'danger', icon: 'close-circle' }
}

export default function Obras() {
    const [tema, setTema] = useState('light')
    const [vista, setVista] = useState('lista')
    const [obraSeleccionada, setObraSeleccionada] = useState(null)
    const [obras, setObras] = useState([])
    const [moneda, setMoneda] = useState('DOP RD$')
    const [cargando, setCargando] = useState(true)
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [filtros, setFiltros] = useState({
        busqueda: '',
        estado: ''
    })

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
        if (vista === 'lista') {
            cargarObras()
        }
    }, [vista, filtros])

    async function cargarObras() {
        setCargando(true)
        const res = await obtenerObrasSimples(filtros)
        if (res.success) {
            setObras(res.obras)
            if (res.moneda) {
                setMoneda(`${res.moneda.codigo} ${res.moneda.simbolo}`)
            }
        }
        setCargando(false)
    }

    async function handleEliminar(id, nombre) {
        if (!confirm(tr(`¿Estás seguro de eliminar la obra "${nombre}"?\n\nEsto eliminará todos los registros asociados.`, `Are you sure you want to delete the project "${nombre}"?\n\nThis will delete all associated records.`))) {
            return
        }

        const res = await eliminarObraSimple(id)
        if (res.success) {
            cargarObras()
        } else {
            alert(res.mensaje || tr('Error al eliminar la obra', 'Error deleting project'))
        }
    }

    async function handleCambiarEstado(id, estadoActual) {
        const nuevoEstado = estadoActual === 'activa' ? 'pausada' : 'activa'
        
        const res = await cambiarEstadoObra(id, nuevoEstado)
        if (res.success) {
            setObras(prevObras => 
                prevObras.map(obra => 
                    obra.id === id ? { ...obra, estado: nuevoEstado } : obra
                )
            )
        } else {
            alert(res.mensaje || tr('Error al cambiar estado', 'Error changing status'))
        }
    }

    function calcularProgreso(obra) {
        if (!obra.fecha_inicio || !obra.fecha_fin_estimada) return 0
        
        const inicio = new Date(obra.fecha_inicio)
        const fin = new Date(obra.fecha_fin_estimada)
        const hoy = new Date()
        
        const totalDias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24))
        const diasTranscurridos = Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))
        
        return Math.min(Math.max((diasTranscurridos / totalDias) * 100, 0), 100)
    }

    function volverALista() {
        setVista('lista')
        setObraSeleccionada(null)
        cargarObras()
    }

    if (vista === 'nuevo') {
        return <Nuevo onVolver={volverALista} />
    }

    if (vista === 'editar' && obraSeleccionada) {
        return <Editar obraId={obraSeleccionada} onVolver={volverALista} />
    }

    if (vista === 'ver' && obraSeleccionada) {
        return <Ver obraId={obraSeleccionada} onVolver={volverALista} />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="business-outline"></ion-icon>
                        {tr('Mis Obras', 'My Projects')}
                    </h1>
                    <p className={estilos.subtitulo}>
                        {tr('Gestión y seguimiento de obras activas', 'Management and tracking of active projects')}
                    </p>
                </div>
                <button 
                    className={estilos.btnNuevo}
                    onClick={() => setVista('nuevo')}
                >
                    <ion-icon name="add-outline"></ion-icon>
                    <span>{tr('Nueva Obra', 'New Project')}</span>
                </button>
            </div>

            <div className={estilos.filtros}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar por nombre, código o cliente...', 'Search by name, code or client...')}
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                    />
                </div>
                <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                    className={estilos.select}
                >
                    <option value="">{tr('Todos los estados', 'All statuses')}</option>
                    <option value="activa">{tr('Activa', 'Active')}</option>
                    <option value="pausada">{tr('Pausada', 'Paused')}</option>
                    <option value="finalizada">{tr('Finalizada', 'Finished')}</option>
                    <option value="cancelada">{tr('Cancelada', 'Cancelled')}</option>
                </select>
            </div>

            {cargando ? <LoadingScreen /> : obras.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="business-outline"></ion-icon>
                    <h3>{tr('No hay obras registradas', 'No projects registered')}</h3>
                    <p>{tr('Crea tu primera obra para comenzar', 'Create your first project to get started')}</p>
                    <button 
                        className={estilos.btnCrear}
                        onClick={() => setVista('nuevo')}
                    >
                        <ion-icon name="add-outline"></ion-icon>
                        {tr('Crear Primera Obra', 'Create First Project')}
                    </button>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {obras.map(obra => {
                        const estado = ESTADOS_OBRA[obra.estado] || ESTADOS_OBRA.activa
                        const progreso = calcularProgreso(obra)
                        const presupuestoEjecutado = obra.total_gastos || 0
                        const porcentajePresupuesto = obra.presupuesto_total > 0 
                            ? (presupuestoEjecutado / obra.presupuesto_total) * 100 
                            : 0

                        return (
                            <div key={obra.id} className={estilos.obraCard}>
                                <div 
                                    className={estilos.obraHeader}
                                    style={{ borderTopColor: obra.color_identificacion || '#0284c7' }}
                                >
                                    <div className={estilos.obraTitulo}>
                                        <h3>{obra.nombre}</h3>
                                        <span className={estilos.codigo}>{obra.codigo_obra}</span>
                                    </div>
                                    <div className={estilos.headerControls}>
                                        <label className={estilos.switchContainer}>
                                            <input
                                                type="checkbox"
                                                checked={obra.estado === 'activa'}
                                                onChange={() => handleCambiarEstado(obra.id, obra.estado)}
                                                disabled={obra.estado === 'finalizada' || obra.estado === 'cancelada'}
                                            />
                                            <span className={estilos.switchSlider}></span>
                                        </label>
                                        <span className={`${estilos.badge} ${estilos[estado.color]}`}>
                                            <ion-icon name={estado.icon}></ion-icon>
                                            {language === 'en' ? (ESTADOS_OBRA[obra.estado]?.labelEn || estado.label) : estado.label}
                                        </span>
                                    </div>
                                </div>

                                <div className={estilos.obraBody}>
                                    {obra.cliente_nombre && (
                                        <div className={estilos.infoItem}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.infoLabel}>{tr('Cliente', 'Client')}</span>
                                                <span className={estilos.infoValor}>{obra.cliente_nombre}</span>
                                            </div>
                                        </div>
                                    )}

                                    {obra.direccion && (
                                        <div className={estilos.infoItem}>
                                            <ion-icon name="location-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.infoLabel}>{tr('Ubicación', 'Location')}</span>
                                                <span className={estilos.infoValor}>{obra.direccion}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={estilos.estadisticas}>
                                        <div className={estilos.stat}>
                                            <ion-icon name="people-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.statValor}>{obra.total_trabajadores || 0}</span>
                                                <span className={estilos.statLabel}>{tr('Trabajadores', 'Workers')}</span>
                                            </div>
                                        </div>
                                        <div className={estilos.stat}>
                                            <ion-icon name="wallet-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.statValor}>{moneda} {presupuestoEjecutado.toLocaleString()}</span>
                                                <span className={estilos.statLabel}>{tr('Gastado', 'Spent')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {obra.presupuesto_total > 0 && (
                                        <div className={estilos.presupuesto}>
                                            <div className={estilos.presupuestoHeader}>
                                                <span>{tr('Presupuesto', 'Budget')}</span>
                                                <span className={porcentajePresupuesto > 90 ? estilos.alerta : ''}>
                                                    {porcentajePresupuesto.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className={estilos.barra}>
                                                <div 
                                                    className={`${estilos.barraProgreso} ${porcentajePresupuesto > 90 ? estilos.barraDanger : ''}`}
                                                    style={{ width: `${Math.min(porcentajePresupuesto, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className={estilos.presupuestoFooter}>
                                                <span>{moneda} {presupuestoEjecutado.toLocaleString()}</span>
                                                <span>{moneda} {obra.presupuesto_total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    {obra.fecha_inicio && obra.fecha_fin_estimada && (
                                        <>
                                            <div className={estilos.fechas}>
                                                <div className={estilos.fecha}>
                                                    <ion-icon name="calendar-outline"></ion-icon>
                                                    <span>{tr('Inicio:', 'Start:')} {new Date(obra.fecha_inicio).toLocaleDateString()}</span>
                                                </div>
                                                <div className={estilos.fecha}>
                                                    <ion-icon name="calendar-outline"></ion-icon>
                                                    <span>{tr('Fin:', 'End:')} {new Date(obra.fecha_fin_estimada).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {progreso > 0 && (
                                                <div className={estilos.progresoTiempo}>
                                                    <div className={estilos.progresoHeader}>
                                                        <span>{tr('Progreso en tiempo', 'Time progress')}</span>
                                                        <span>{progreso.toFixed(1)}%</span>
                                                    </div>
                                                    <div className={estilos.barra}>
                                                        <div 
                                                            className={estilos.barraProgreso}
                                                            style={{ width: `${Math.min(progreso, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className={estilos.obraFooter}>
                                    <button 
                                        className={estilos.btnVer}
                                        onClick={() => {
                                            setObraSeleccionada(obra.id)
                                            setVista('ver')
                                        }}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                        {tr('Ver Detalle', 'View Detail')}
                                    </button>
                                    <button 
                                        className={estilos.btnEditar}
                                        onClick={() => {
                                            setObraSeleccionada(obra.id)
                                            setVista('editar')
                                        }}
                                    >
                                        <ion-icon name="create-outline"></ion-icon>
                                    </button>
                                    <button 
                                        className={estilos.btnEliminar}
                                        onClick={() => handleEliminar(obra.id, obra.nombre)}
                                    >
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}