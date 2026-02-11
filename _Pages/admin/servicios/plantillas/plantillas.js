"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerPlantillasServicio, eliminarPlantillaServicio } from './servidor'
import { crearPlantillaServicio } from './nuevo/servidor'
import { TIPOS_SERVICIO, formatearTipoServicio } from '../../core/construction/estados'
import estilos from './plantillas.module.css'

export default function PlantillasServicios() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [plantillas, setPlantillas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [procesando, setProcesando] = useState(false)
    
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        tipo_servicio: '',
        duracion_estimada_dias: '',
        costo_base_estimado: '',
        recursos: []
    })

    const [nuevoRecurso, setNuevoRecurso] = useState({
        tipo_recurso: 'material',
        nombre: '',
        descripcion: '',
        cantidad_estimada: '',
        unidad: '',
        costo_unitario_estimado: ''
    })

    const tiposServicio = Object.keys(TIPOS_SERVICIO).map(key => ({
        value: TIPOS_SERVICIO[key],
        label: formatearTipoServicio(TIPOS_SERVICIO[key])
    }))

    const tiposRecurso = [
        { value: 'material', label: 'Material' },
        { value: 'herramienta', label: 'Herramienta' },
        { value: 'equipo', label: 'Equipo' },
        { value: 'personal', label: 'Personal' }
    ]

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        cargarPlantillas()
    }, [])

    async function cargarPlantillas() {
        setCargando(true)
        const res = await obtenerPlantillasServicio()
        if (res.success) {
            setPlantillas(res.plantillas || [])
        }
        setCargando(false)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleRecursoChange = (e) => {
        const { name, value } = e.target
        setNuevoRecurso(prev => ({ ...prev, [name]: value }))
    }

    const agregarRecurso = () => {
        if (!nuevoRecurso.nombre) {
            alert('El nombre del recurso es obligatorio')
            return
        }
        setFormData(prev => ({
            ...prev,
            recursos: [...prev.recursos, { ...nuevoRecurso }]
        }))
        setNuevoRecurso({
            tipo_recurso: 'material',
            nombre: '',
            descripcion: '',
            cantidad_estimada: '',
            unidad: '',
            costo_unitario_estimado: ''
        })
    }

    const eliminarRecurso = (index) => {
        setFormData(prev => ({
            ...prev,
            recursos: prev.recursos.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.nombre || !formData.tipo_servicio) {
            alert('El nombre y el tipo de servicio son obligatorios')
            return
        }
        
        setProcesando(true)
        try {
            const datos = {
                ...formData,
                duracion_estimada_dias: parseInt(formData.duracion_estimada_dias) || 1,
                costo_base_estimado: parseFloat(formData.costo_base_estimado) || 0,
                recursos: formData.recursos.map(r => ({
                    ...r,
                    cantidad_estimada: parseFloat(r.cantidad_estimada) || 1,
                    costo_unitario_estimado: parseFloat(r.costo_unitario_estimado) || 0
                }))
            }
            
            const res = await crearPlantillaServicio(datos)
            if (res.success) {
                alert(`✅ Plantilla creada exitosamente\n\nCódigo: ${res.codigo}`)
                setMostrarFormulario(false)
                setFormData({
                    nombre: '',
                    descripcion: '',
                    tipo_servicio: '',
                    duracion_estimada_dias: '',
                    costo_base_estimado: '',
                    recursos: []
                })
                cargarPlantillas()
            } else {
                alert(res.mensaje || 'Error al crear plantilla')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de desactivar esta plantilla?')) return
        
        const res = await eliminarPlantillaServicio(id)
        if (res.success) {
            alert('✅ Plantilla desactivada')
            cargarPlantillas()
        } else {
            alert(res.mensaje || 'Error al eliminar plantilla')
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <p>Cargando plantillas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="document-text-outline"></ion-icon>
                        Plantillas de Servicios
                    </h1>
                    <p className={estilos.subtitulo}>Gestiona las plantillas predefinidas para crear servicios rápidamente</p>
                </div>
                <div className={estilos.headerButtons}>
                    <button className={estilos.btnVolver} onClick={() => router.back()}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
                    </button>
                    <button className={estilos.btnNuevo} onClick={() => setMostrarFormulario(!mostrarFormulario)}>
                        <ion-icon name={mostrarFormulario ? "close-outline" : "add-outline"}></ion-icon>
                        <span>{mostrarFormulario ? 'Cancelar' : 'Nueva Plantilla'}</span>
                    </button>
                </div>
            </div>

            {/* Formulario de Nueva Plantilla */}
            {mostrarFormulario && (
                <div className={`${estilos.formularioContainer} ${estilos[tema]}`}>
                    <form onSubmit={handleSubmit} className={estilos.formulario}>
                        <h2>Nueva Plantilla de Servicio</h2>
                        
                        <div className={estilos.grid2}>
                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Nombre de la Plantilla *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]}`}
                                    placeholder="Ej: Instalación eléctrica completa"
                                    required
                                />
                            </div>

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Tipo de Servicio *</label>
                                <select
                                    name="tipo_servicio"
                                    value={formData.tipo_servicio}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]}`}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {tiposServicio.map(tipo => (
                                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={estilos.grupo}>
                            <label className={estilos.label}>Descripción</label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                className={`${estilos.textarea} ${estilos[tema]}`}
                                rows="3"
                                placeholder="Describe la plantilla de servicio..."
                            />
                        </div>

                        <div className={estilos.grid2}>
                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Duración Estimada (días)</label>
                                <input
                                    type="number"
                                    name="duracion_estimada_dias"
                                    value={formData.duracion_estimada_dias}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]}`}
                                    placeholder="0"
                                    min="1"
                                />
                            </div>

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Costo Base Estimado (RD$)</label>
                                <input
                                    type="number"
                                    name="costo_base_estimado"
                                    value={formData.costo_base_estimado}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]}`}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Recursos Sugeridos */}
                        <div className={estilos.seccionRecursos}>
                            <h3>Recursos Sugeridos</h3>
                            
                            {formData.recursos.length > 0 && (
                                <div className={estilos.listaRecursos}>
                                    {formData.recursos.map((recurso, index) => (
                                        <div key={index} className={`${estilos.recursoItem} ${estilos[tema]}`}>
                                            <div className={estilos.recursoInfo}>
                                                <span className={estilos.recursoTipo}>{recurso.tipo_recurso}</span>
                                                <strong>{recurso.nombre}</strong>
                                                <span>{recurso.cantidad_estimada} {recurso.unidad || 'unidades'}</span>
                                                {recurso.costo_unitario_estimado > 0 && (
                                                    <span>RD$ {parseFloat(recurso.costo_unitario_estimado).toLocaleString()}</span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => eliminarRecurso(index)}
                                                className={estilos.btnEliminarRecurso}
                                            >
                                                <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={`${estilos.nuevoRecurso} ${estilos[tema]}`}>
                                <div className={estilos.grid3}>
                                    <div className={estilos.grupo}>
                                        <label className={estilos.labelSmall}>Tipo</label>
                                        <select
                                            name="tipo_recurso"
                                            value={nuevoRecurso.tipo_recurso}
                                            onChange={handleRecursoChange}
                                            className={`${estilos.inputSmall} ${estilos[tema]}`}
                                        >
                                            {tiposRecurso.map(tipo => (
                                                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.labelSmall}>Nombre</label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={nuevoRecurso.nombre}
                                            onChange={handleRecursoChange}
                                            className={`${estilos.inputSmall} ${estilos[tema]}`}
                                            placeholder="Nombre del recurso"
                                        />
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.labelSmall}>Cantidad</label>
                                        <input
                                            type="number"
                                            name="cantidad_estimada"
                                            value={nuevoRecurso.cantidad_estimada}
                                            onChange={handleRecursoChange}
                                            className={`${estilos.inputSmall} ${estilos[tema]}`}
                                            placeholder="0"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.labelSmall}>Unidad</label>
                                        <input
                                            type="text"
                                            name="unidad"
                                            value={nuevoRecurso.unidad}
                                            onChange={handleRecursoChange}
                                            className={`${estilos.inputSmall} ${estilos[tema]}`}
                                            placeholder="unidades, m, kg..."
                                        />
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.labelSmall}>Costo Unit.</label>
                                        <input
                                            type="number"
                                            name="costo_unitario_estimado"
                                            value={nuevoRecurso.costo_unitario_estimado}
                                            onChange={handleRecursoChange}
                                            className={`${estilos.inputSmall} ${estilos[tema]}`}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.labelSmall}>&nbsp;</label>
                                        <button
                                            type="button"
                                            onClick={agregarRecurso}
                                            className={estilos.btnAgregarRecurso}
                                        >
                                            <ion-icon name="add-circle-outline"></ion-icon>
                                            Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={estilos.formActions}>
                            <button
                                type="button"
                                onClick={() => setMostrarFormulario(false)}
                                className={estilos.btnCancelar}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={estilos.btnGuardar}
                                disabled={procesando}
                            >
                                {procesando ? (
                                    <>
                                        <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <ion-icon name="save-outline"></ion-icon>
                                        Guardar Plantilla
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Listado de Plantillas */}
            <div className={estilos.plantillas}>
                {plantillas.length === 0 ? (
                    <div className={estilos.vacio}>
                        <ion-icon name="document-outline"></ion-icon>
                        <p>No hay plantillas creadas</p>
                        <button className={estilos.btnCrearPrimera} onClick={() => setMostrarFormulario(true)}>
                            <ion-icon name="add-outline"></ion-icon>
                            Crear Primera Plantilla
                        </button>
                    </div>
                ) : (
                    <div className={estilos.grid}>
                        {plantillas.map(plantilla => (
                            <div key={plantilla.id} className={`${estilos.plantillaCard} ${estilos[tema]}`}>
                                <div className={estilos.plantillaHeader}>
                                    <div>
                                        <span className={estilos.codigo}>{plantilla.codigo_plantilla}</span>
                                        <h3>{plantilla.nombre}</h3>
                                    </div>
                                    <span className={estilos.tipoTag}>{formatearTipoServicio(plantilla.tipo_servicio)}</span>
                                </div>
                                
                                {plantilla.descripcion && (
                                    <p className={estilos.descripcion}>{plantilla.descripcion}</p>
                                )}
                                
                                <div className={estilos.plantillaInfo}>
                                    <div className={estilos.infoItem}>
                                        <ion-icon name="time-outline"></ion-icon>
                                        <span>{plantilla.duracion_estimada_dias} días</span>
                                    </div>
                                    <div className={estilos.infoItem}>
                                        <ion-icon name="cash-outline"></ion-icon>
                                        <span>RD$ {parseFloat(plantilla.costo_base_estimado || 0).toLocaleString()}</span>
                                    </div>
                                    <div className={estilos.infoItem}>
                                        <ion-icon name="cube-outline"></ion-icon>
                                        <span>{plantilla.cantidad_recursos || 0} recursos</span>
                                    </div>
                                </div>

                                <div className={estilos.plantillaActions}>
                                    <button
                                        className={estilos.btnEliminar}
                                        onClick={() => handleEliminar(plantilla.id)}
                                    >
                                        <ion-icon name="trash-outline"></ion-icon>
                                        Desactivar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

