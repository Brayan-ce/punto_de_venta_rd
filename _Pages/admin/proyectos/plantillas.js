"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerPlantillasProyectos, eliminarPlantilla } from './servidor'
import estilos from './plantillas.module.css'

const TIPOS_PLANTILLA = {
    vivienda: { label: 'Vivienda', icon: 'home-outline', color: '#3b82f6' },
    comercial: { label: 'Comercial', icon: 'business-outline', color: '#10b981' },
    servicios: { label: 'Servicios', icon: 'construct-outline', color: '#f59e0b' },
    vacio: { label: 'Vacío', icon: 'document-outline', color: '#64748b' },
    otro: { label: 'Otro', icon: 'folder-outline', color: '#8b5cf6' }
}

export default function PlantillasAdmin() {
    const router = useRouter()
    const [plantillas, setPlantillas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtros, setFiltros] = useState({
        busqueda: '',
        tipo: ''
    })

    useEffect(() => {
        cargarPlantillas()
    }, [filtros])

    async function cargarPlantillas() {
        setCargando(true)
        const res = await obtenerPlantillasProyectos()
        if (res.success) {
            let plantillasFiltradas = res.plantillas || []
            
            // Aplicar filtros
            if (filtros.busqueda) {
                const busqueda = filtros.busqueda.toLowerCase()
                plantillasFiltradas = plantillasFiltradas.filter(p => 
                    p.nombre.toLowerCase().includes(busqueda) ||
                    (p.descripcion && p.descripcion.toLowerCase().includes(busqueda))
                )
            }
            
            if (filtros.tipo) {
                plantillasFiltradas = plantillasFiltradas.filter(p => p.tipo_plantilla === filtros.tipo)
            }
            
            setPlantillas(plantillasFiltradas)
        }
        setCargando(false)
    }

    async function handleEliminar(id, nombre) {
        if (!confirm(`¿Estás seguro de eliminar la plantilla "${nombre}"?`)) {
            return
        }

        const res = await eliminarPlantilla(id)
        if (res.success) {
            cargarPlantillas()
        } else {
            alert(res.mensaje || 'Error al eliminar plantilla')
        }
    }

    function contarElementos(estructura) {
        if (!estructura || !estructura.obras) return { obras: 0, presupuestos: 0, capitulos: 0, tareas: 0 }
        
        let obras = estructura.obras.length || 0
        let presupuestos = 0
        let capitulos = 0
        let tareas = 0

        estructura.obras.forEach(obra => {
            if (obra.presupuestos) {
                presupuestos += obra.presupuestos.length
                obra.presupuestos.forEach(presupuesto => {
                    if (presupuesto.capitulos) {
                        capitulos += presupuesto.capitulos.length
                        presupuesto.capitulos.forEach(capitulo => {
                            if (capitulo.tareas) {
                                tareas += capitulo.tareas.length
                            }
                        })
                    }
                })
            }
        })

        return { obras, presupuestos, capitulos, tareas }
    }

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="layers-outline"></ion-icon>
                        Plantillas de Proyectos
                    </h1>
                    <p className={estilos.subtitulo}>
                        Diseña y gestiona plantillas para crear proyectos con estructura predefinida
                    </p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button 
                        className={estilos.btnProyectos} 
                        onClick={() => router.push('/admin/proyectos')}
                        title="Volver a proyectos"
                    >
                        <ion-icon name="folder-outline"></ion-icon>
                        <span>Proyectos</span>
                    </button>
                    <button 
                        className={estilos.btnNuevo} 
                        onClick={() => router.push('/admin/proyectos/plantillas/nuevo')}
                    >
                        <ion-icon name="add-outline"></ion-icon>
                        <span>Nueva Plantilla</span>
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className={estilos.filtros}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar plantillas..."
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                    />
                </div>
                <select
                    value={filtros.tipo}
                    onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                    className={estilos.select}
                >
                    <option value="">Todos los tipos</option>
                    <option value="vivienda">Vivienda</option>
                    <option value="comercial">Comercial</option>
                    <option value="servicios">Servicios</option>
                    <option value="vacio">Vacío</option>
                    <option value="otro">Otro</option>
                </select>
            </div>

            {/* Lista */}
            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando plantillas...</span>
                </div>
            ) : plantillas.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="layers-outline"></ion-icon>
                    <h3>No hay plantillas disponibles</h3>
                    <p>Crea tu primera plantilla para acelerar la creación de proyectos</p>
                    <button 
                        className={estilos.btnNuevoVacio}
                        onClick={() => router.push('/admin/proyectos/plantillas/nuevo')}
                    >
                        <ion-icon name="add-outline"></ion-icon>
                        Crear Primera Plantilla
                    </button>
                </div>
            ) : (
                <div className={estilos.lista}>
                    {plantillas.map(plantilla => {
                        const tipo = TIPOS_PLANTILLA[plantilla.tipo_plantilla] || TIPOS_PLANTILLA.otro
                        const elementos = contarElementos(plantilla.estructura_json)
                        
                        return (
                            <div key={plantilla.id} className={estilos.tarjeta}>
                                <div className={estilos.tarjetaHeader}>
                                    <div className={estilos.tarjetaTitulo}>
                                        <div 
                                            className={estilos.tipoIcono}
                                            style={{ backgroundColor: `${tipo.color}20`, color: tipo.color }}
                                        >
                                            <ion-icon name={tipo.icon}></ion-icon>
                                        </div>
                                        <div>
                                            <h3>{plantilla.nombre}</h3>
                                            <span className={estilos.tipoBadge} style={{ color: tipo.color }}>
                                                {tipo.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={estilos.acciones}>
                                        <button 
                                            className={estilos.btnEditar}
                                            onClick={() => router.push(`/admin/proyectos/plantillas/nuevo?editar=true&id=${plantilla.id}`)}
                                            title="Editar plantilla"
                                        >
                                            <ion-icon name="create-outline"></ion-icon>
                                        </button>
                                        <button 
                                            className={estilos.btnEliminar}
                                            onClick={() => handleEliminar(plantilla.id, plantilla.nombre)}
                                            title="Eliminar plantilla"
                                        >
                                            <ion-icon name="trash-outline"></ion-icon>
                                        </button>
                                    </div>
                                </div>
                                
                                {plantilla.descripcion && (
                                    <div className={estilos.tarjetaBody}>
                                        <p className={estilos.descripcion}>{plantilla.descripcion}</p>
                                    </div>
                                )}

                                <div className={estilos.estadisticas}>
                                    <div className={estilos.statItem}>
                                        <ion-icon name="business-outline"></ion-icon>
                                        <span>{elementos.obras} {elementos.obras === 1 ? 'obra' : 'obras'}</span>
                                    </div>
                                    <div className={estilos.statItem}>
                                        <ion-icon name="document-text-outline"></ion-icon>
                                        <span>{elementos.presupuestos} {elementos.presupuestos === 1 ? 'presupuesto' : 'presupuestos'}</span>
                                    </div>
                                    <div className={estilos.statItem}>
                                        <ion-icon name="folder-outline"></ion-icon>
                                        <span>{elementos.capitulos} {elementos.capitulos === 1 ? 'capítulo' : 'capítulos'}</span>
                                    </div>
                                    <div className={estilos.statItem}>
                                        <ion-icon name="list-outline"></ion-icon>
                                        <span>{elementos.tareas} {elementos.tareas === 1 ? 'tarea' : 'tareas'}</span>
                                    </div>
                                </div>

                                <div className={estilos.tarjetaFooter}>
                                    <div className={estilos.fecha}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        <span>Creada: {new Date(plantilla.fecha_creacion).toLocaleDateString()}</span>
                                    </div>
                                    <button 
                                        className={estilos.btnUsar}
                                        onClick={() => router.push(`/admin/proyectos/nuevo?plantilla=${plantilla.id}`)}
                                    >
                                        <ion-icon name="play-outline"></ion-icon>
                                        Usar Plantilla
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

