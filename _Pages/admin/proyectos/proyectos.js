"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerProyectos } from './servidor'
import { formatearEstadoProyecto } from '../core/construction/estados'
import estilos from './proyectos.module.css'

export default function ProyectosAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [proyectos, setProyectos] = useState([])
    const [cargando, setCargando] = useState(true)
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
        cargarProyectos()
    }, [filtros])

    async function cargarProyectos() {
        setCargando(true)
        const res = await obtenerProyectos(filtros)
        if (res.success) {
            setProyectos(res.proyectos)
        }
        setCargando(false)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Proyectos</h1>
                    <p className={estilos.subtitulo}>Gestión de proyectos de construcción</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button 
                        className={estilos.btnPlantillas} 
                        onClick={() => router.push('/admin/proyectos/plantillas')}
                        title="Gestionar plantillas de proyectos"
                    >
                        <ion-icon name="layers-outline"></ion-icon>
                        <span>Plantillas</span>
                    </button>
                    <button 
                        className={estilos.btnNuevo} 
                        onClick={() => router.push('/admin/proyectos/nuevo')}
                    >
                        <ion-icon name="add-outline"></ion-icon>
                        <span>Nuevo Proyecto</span>
                    </button>
                </div>
            </div>

            <div className={estilos.filtros}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar proyectos..."
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                    />
                </div>
                <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                >
                    <option value="">Todos los estados</option>
                    <option value="planificacion">Planificación</option>
                    <option value="activo">Activo</option>
                    <option value="suspendido">Suspendido</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                </select>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>Cargando proyectos...</div>
            ) : proyectos.length === 0 ? (
                <div className={estilos.vacio}>No se encontraron proyectos</div>
            ) : (
                <div className={estilos.lista}>
                    {proyectos.map(proyecto => {
                        const estadoFormateado = formatearEstadoProyecto(proyecto.estado)
                        return (
                            <div key={proyecto.id} className={estilos.tarjeta}>
                                <div className={estilos.tarjetaHeader}>
                                    <div>
                                        <h3>{proyecto.nombre}</h3>
                                        {proyecto.codigo_proyecto && (
                                            <span className={estilos.codigo}>{proyecto.codigo_proyecto}</span>
                                        )}
                                    </div>
                                    <span className={`${estilos.estado} ${estilos[estadoFormateado.color]}`}>
                                        {estadoFormateado.texto}
                                    </span>
                                </div>
                                <div className={estilos.tarjetaBody}>
                                    {proyecto.descripcion && (
                                        <p className={estilos.descripcion}>{proyecto.descripcion}</p>
                                    )}
                                    <div className={estilos.info}>
                                        {proyecto.fecha_inicio && (
                                            <div className={estilos.itemInfo}>
                                                <ion-icon name="calendar-outline"></ion-icon>
                                                <span>Inicio: {new Date(proyecto.fecha_inicio).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {proyecto.fecha_fin_estimada && (
                                            <div className={estilos.itemInfo}>
                                                <ion-icon name="calendar-outline"></ion-icon>
                                                <span>Fin: {new Date(proyecto.fecha_fin_estimada).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {proyecto.presupuesto_total > 0 && (
                                            <div className={estilos.itemInfo}>
                                                <ion-icon name="cash-outline"></ion-icon>
                                                <span>RD$ {parseFloat(proyecto.presupuesto_total).toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="construct-outline"></ion-icon>
                                            <span>{proyecto.cantidad_obras || 0} obras</span>
                                        </div>
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="flash-outline"></ion-icon>
                                            <span>{proyecto.cantidad_servicios || 0} servicios</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={estilos.tarjetaFooter}>
                                    <button 
                                        className={estilos.btnVer}
                                        onClick={() => router.push(`/admin/proyectos/ver/${proyecto.id}`)}
                                    >
                                        Ver Detalle
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