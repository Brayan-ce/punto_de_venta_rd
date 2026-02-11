"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { crearServicio } from './servidor'
import { obtenerPlantillasServicio } from '../plantillas/servidor'
import { obtenerPlantillaServicio } from '../plantillas/editar/servidor'
import { obtenerClientes } from '../../clientes/servidor'
import { obtenerObras } from '../../obras/servidor'
import { PRIORIDADES, formatearPrioridad } from '../../core/construction/estados'
import estilos from './nuevo.module.css'

export default function NuevoServicio() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [tema, setTema] = useState('light')
    const [paso, setPaso] = useState(1)
    const [procesando, setProcesando] = useState(false)
    const [errors, setErrors] = useState({})
    const [cargando, setCargando] = useState(true)
    
    const [clientes, setClientes] = useState([])
    const [obras, setObras] = useState([])
    const [plantillas, setPlantillas] = useState([])
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null)
    
    // Contexto heredado desde URL (si viene desde obra)
    const obraIdParam = searchParams?.get('obra_id')
    const proyectoIdParam = searchParams?.get('proyecto_id')
    
    const [formData, setFormData] = useState({
        servicio_plantilla_id: '',
        obra_id: obraIdParam || '',
        proyecto_id: proyectoIdParam || '',
        nombre: '',
        descripcion: '',
        ubicacion: '',
        zona: '',
        fecha_inicio: '',
        fecha_fin_estimada: '',
        presupuesto_asignado: '',
        responsable_id: '',
        cliente_id: '',
        prioridad: PRIORIDADES.MEDIA,
        notas_tecnicas: ''
    })

    const [contextoObra, setContextoObra] = useState(null)

    const pasos = [
        { numero: 1, label: 'Contexto', descripcion: 'Obra y proyecto', icono: 'business-outline' },
        { numero: 2, label: 'Plantilla', descripcion: 'Selecciona plantilla', icono: 'document-text-outline' },
        { numero: 3, label: 'Ajustes', descripcion: 'Fechas y presupuesto', icono: 'calendar-outline' },
        { numero: 4, label: 'Confirmación', descripcion: 'Revisar y crear', icono: 'checkmark-done-outline' }
    ]

    const prioridades = [
        { value: 'baja', label: 'Baja', color: '#10b981', descripcion: 'Puede esperar' },
        { value: 'media', label: 'Media', color: '#3b82f6', descripcion: 'Prioridad normal' },
        { value: 'alta', label: 'Alta', color: '#f59e0b', descripcion: 'Requiere atención pronto' },
        { value: 'urgente', label: 'Urgente', color: '#ef4444', descripcion: 'Atención inmediata' }
    ]

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
    }, [])

    useEffect(() => {
        // Si hay obra_id, cargar contexto de la obra
        if (formData.obra_id) {
            cargarContextoObra(formData.obra_id)
        } else {
            setContextoObra(null)
        }
    }, [formData.obra_id])

    useEffect(() => {
        // Si se selecciona una plantilla, cargar sus detalles
        if (formData.servicio_plantilla_id) {
            cargarPlantillaDetalle(formData.servicio_plantilla_id)
        } else {
            setPlantillaSeleccionada(null)
        }
    }, [formData.servicio_plantilla_id])

    async function cargarDatos() {
        setCargando(true)
        try {
            const [resClientes, resObras, resPlantillas] = await Promise.all([
                obtenerClientes(),
                obtenerObras({ estado: 'activa' }),
                obtenerPlantillasServicio()
            ])
            
            if (resClientes.success) {
                setClientes(resClientes.clientes || [])
            }
            if (resObras.success) {
                setObras(resObras.obras || [])
            }
            if (resPlantillas.success) {
                setPlantillas(resPlantillas.plantillas || [])
            }
            
            // Si hay obra_id en URL, cargar contexto
            if (obraIdParam) {
                await cargarContextoObra(obraIdParam)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
        } finally {
            setCargando(false)
        }
    }

    async function cargarContextoObra(obraId) {
        const obra = obras.find(o => o.id === parseInt(obraId))
        if (obra) {
            setContextoObra(obra)
            // Heredar datos de la obra
            setFormData(prev => ({
                ...prev,
                proyecto_id: prev.proyecto_id || obra.proyecto_id || null,
                ubicacion: prev.ubicacion || obra.ubicacion || '',
                zona: prev.zona || obra.zona || ''
            }))
        }
    }

    async function cargarPlantillaDetalle(plantillaId) {
        const res = await obtenerPlantillaServicio(plantillaId)
        if (res.success) {
            setPlantillaSeleccionada(res.plantilla)
            // Auto-completar nombre y descripción si están vacíos
            setFormData(prev => ({
                ...prev,
                nombre: prev.nombre || res.plantilla.nombre || '',
                descripcion: prev.descripcion || res.plantilla.descripcion || '',
                presupuesto_asignado: prev.presupuesto_asignado || res.plantilla.costo_base_estimado || ''
            }))
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const seleccionarPrioridad = (prioridad) => {
        setFormData(prev => ({ ...prev, prioridad }))
    }

    const validarPaso1 = () => {
        const nuevosErrores = {}
        // La obra es opcional, pero si se selecciona debe ser válida
        if (formData.obra_id && !obras.find(o => o.id === parseInt(formData.obra_id))) {
            nuevosErrores.obra_id = 'Obra seleccionada no válida'
        }
        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const validarPaso2 = () => {
        const nuevosErrores = {}
        if (!formData.servicio_plantilla_id) {
            nuevosErrores.servicio_plantilla_id = 'Debe seleccionar una plantilla de servicio'
        }
        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const validarPaso3 = () => {
        const nuevosErrores = {}
        if (!formData.fecha_inicio) {
            nuevosErrores.fecha_inicio = 'La fecha de inicio es obligatoria'
        }
        if (!formData.fecha_fin_estimada) {
            nuevosErrores.fecha_fin_estimada = 'La fecha de fin estimada es obligatoria'
        }
        if (formData.fecha_inicio && formData.fecha_fin_estimada) {
            if (new Date(formData.fecha_fin_estimada) <= new Date(formData.fecha_inicio)) {
                nuevosErrores.fecha_fin_estimada = 'La fecha de fin debe ser posterior a la fecha de inicio'
            }
        }
        if (formData.presupuesto_asignado && parseFloat(formData.presupuesto_asignado) < 0) {
            nuevosErrores.presupuesto_asignado = 'El presupuesto no puede ser negativo'
        }
        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const siguientePaso = () => {
        if (paso === 1 && validarPaso1()) {
            setPaso(2)
        } else if (paso === 2 && validarPaso2()) {
            setPaso(3)
        } else if (paso === 3 && validarPaso3()) {
            setPaso(4)
        }
    }

    const pasoAnterior = () => {
        if (paso > 1) {
            setPaso(paso - 1)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validarPaso3()) {
            setPaso(3)
            return
        }
        
        setProcesando(true)
        try {
            const datos = {
                ...formData,
                servicio_plantilla_id: parseInt(formData.servicio_plantilla_id),
                obra_id: formData.obra_id ? parseInt(formData.obra_id) : null,
                proyecto_id: formData.proyecto_id ? parseInt(formData.proyecto_id) : null,
                presupuesto_asignado: formData.presupuesto_asignado ? parseFloat(formData.presupuesto_asignado) : null,
                responsable_id: formData.responsable_id ? parseInt(formData.responsable_id) : null,
                cliente_id: formData.cliente_id ? parseInt(formData.cliente_id) : null
            }
            
            const res = await crearServicio(datos)
            if (res.success) {
                alert(`✅ Servicio creado exitosamente\n\nCódigo: ${res.codigo || 'N/A'}`)
                router.push('/admin/servicios')
            } else {
                alert(res.mensaje || 'Error al crear servicio')
                if (res.errores) {
                    setErrors(res.errores)
                    setPaso(1)
                }
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const prioridadSeleccionada = prioridades.find(p => p.value === formData.prioridad)

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <p>Cargando información...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Nuevo Servicio</h1>
                    <p className={estilos.subtitulo}>Crea un nuevo servicio desde plantilla</p>
                </div>
                <button className={estilos.btnCancelar} onClick={() => router.back()}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Cancelar</span>
                </button>
            </div>

            {/* Indicador de Progreso */}
            <div className={estilos.progresoContainer}>
                <div className={estilos.pasos}>
                    {pasos.map((p, index) => (
                        <div key={p.numero}>
                            <div className={`${estilos.paso} ${paso >= p.numero ? estilos.pasoActivo : ''}`}>
                                <div className={estilos.pasoNumero}>
                                    {paso > p.numero ? (
                                        <ion-icon name="checkmark-outline"></ion-icon>
                                    ) : (
                                        <ion-icon name={p.icono}></ion-icon>
                                    )}
                                </div>
                                <div className={estilos.pasoInfo}>
                                    <p className={estilos.pasoTitulo}>{p.label}</p>
                                    <p className={estilos.pasoDesc}>{p.descripcion}</p>
                                </div>
                            </div>
                            {index < pasos.length - 1 && (
                                <div className={`${estilos.lineaProgreso} ${paso > p.numero ? estilos.lineaActiva : ''}`}></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className={estilos.formulario}>
                {/* PASO 1: Contexto (Obra/Proyecto) */}
                {paso === 1 && (
                    <div className={estilos.layoutPrincipal}>
                        <div className={estilos.columnaIzquierda}>
                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <h3 className={estilos.tituloSeccion}>
                                    <ion-icon name="business-outline"></ion-icon>
                                    Contexto del Servicio
                                </h3>
                                
                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>
                                        Obra Asociada
                                        <span className={estilos.ayuda}>Opcional - Si no seleccionas, se creará una obra contenedora automáticamente</span>
                                    </label>
                                    <select
                                        name="obra_id"
                                        value={formData.obra_id}
                                        onChange={handleChange}
                                        className={`${estilos.input} ${estilos[tema]} ${errors.obra_id ? estilos.inputError : ''}`}
                                    >
                                        <option value="">Ninguna (crear obra contenedora automática)</option>
                                        {obras.map(obra => (
                                            <option key={obra.id} value={obra.id}>
                                                {obra.codigo_obra ? `${obra.codigo_obra} - ` : ''}{obra.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.obra_id && (
                                        <span className={estilos.errorMsg}>
                                            <ion-icon name="alert-circle-outline"></ion-icon>
                                            {errors.obra_id}
                                        </span>
                                    )}
                                </div>

                                {contextoObra && (
                                    <div className={`${estilos.seccionInfo} ${estilos[tema]}`}>
                                        <h4>Datos heredados de la obra:</h4>
                                        <div className={estilos.infoGrid}>
                                            <div>
                                                <strong>Proyecto:</strong> {contextoObra.proyecto_nombre || 'N/A'}
                                            </div>
                                            <div>
                                                <strong>Ubicación:</strong> {contextoObra.ubicacion || 'N/A'}
                                            </div>
                                            <div>
                                                <strong>Zona:</strong> {contextoObra.zona || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!formData.obra_id && (
                                    <div className={`${estilos.seccionAdvertencia} ${estilos[tema]}`}>
                                        <ion-icon name="information-circle-outline"></ion-icon>
                                        <div>
                                            <strong>Obra contenedora automática</strong>
                                            <p>Si no seleccionas una obra, el sistema creará automáticamente una obra tipo SERVICIO para contener este servicio.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={estilos.columnaDerecha}>
                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <div className={estilos.ilustracionCard}>
                                    <Image
                                        src="/illustrations3D/_0008.svg"
                                        alt="Contexto"
                                        width={200}
                                        height={200}
                                        className={estilos.ilustracion}
                                    />
                                    <h4>Contexto del Servicio</h4>
                                    <p>Asocia el servicio a una obra existente o déjalo vacío para crear una obra contenedora automática</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PASO 2: Selección de Plantilla */}
                {paso === 2 && (
                    <div className={estilos.layoutPrincipal}>
                        <div className={estilos.columnaIzquierda}>
                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <h3 className={estilos.tituloSeccion}>
                                    <ion-icon name="document-text-outline"></ion-icon>
                                    Selecciona una Plantilla de Servicio
                                </h3>
                                
                                {plantillas.length === 0 ? (
                                    <div className={estilos.sinPlantillas}>
                                        <ion-icon name="document-outline"></ion-icon>
                                        <p>No hay plantillas disponibles. Contacta al administrador.</p>
                                    </div>
                                ) : (
                                    <div className={estilos.gridPlantillas}>
                                        {plantillas.map(plantilla => (
                                            <div
                                                key={plantilla.id}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, servicio_plantilla_id: plantilla.id }))
                                                    setErrors(prev => ({ ...prev, servicio_plantilla_id: '' }))
                                                }}
                                                className={`${estilos.cardPlantilla} ${estilos[tema]} ${
                                                    formData.servicio_plantilla_id == plantilla.id ? estilos.cardPlantillaActiva : ''
                                                }`}
                                            >
                                                <div className={estilos.plantillaHeader}>
                                                    <div className={estilos.plantillaCodigo}>{plantilla.codigo_plantilla}</div>
                                                    {formData.servicio_plantilla_id == plantilla.id && (
                                                        <div className={estilos.checkPlantilla}>
                                                            <ion-icon name="checkmark-circle"></ion-icon>
                                                        </div>
                                                    )}
                                                </div>
                                                <h4>{plantilla.nombre}</h4>
                                                {plantilla.descripcion && <p>{plantilla.descripcion}</p>}
                                                <div className={estilos.plantillaInfo}>
                                                    <div className={estilos.infoItem}>
                                                        <ion-icon name="time-outline"></ion-icon>
                                                        <span>{plantilla.duracion_estimada_dias} días</span>
                                                    </div>
                                                    <div className={estilos.infoItem}>
                                                        <ion-icon name="cash-outline"></ion-icon>
                                                        <span>RD$ {parseFloat(plantilla.costo_base_estimado || 0).toLocaleString()}</span>
                                                    </div>
                                                    {plantilla.cantidad_recursos > 0 && (
                                                        <div className={estilos.infoItem}>
                                                            <ion-icon name="cube-outline"></ion-icon>
                                                            <span>{plantilla.cantidad_recursos} recursos</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {errors.servicio_plantilla_id && (
                                    <span className={estilos.errorMsg}>
                                        <ion-icon name="alert-circle-outline"></ion-icon>
                                        {errors.servicio_plantilla_id}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={estilos.columnaDerecha}>
                            {plantillaSeleccionada ? (
                                <div className={`${estilos.seccionDestacada} ${estilos[tema]}`}>
                                    <h3>Plantilla Seleccionada</h3>
                                    <div className={estilos.plantillaPreview}>
                                        <div className={estilos.plantillaPreviewHeader}>
                                            <div className={estilos.plantillaPreviewCodigo}>{plantillaSeleccionada.codigo_plantilla}</div>
                                            <h2>{plantillaSeleccionada.nombre}</h2>
                                        </div>
                                        {plantillaSeleccionada.descripcion && (
                                            <p className={estilos.plantillaPreviewDesc}>{plantillaSeleccionada.descripcion}</p>
                                        )}
                                        <div className={estilos.plantillaPreviewInfo}>
                                            <div className={estilos.previewItem}>
                                                <strong>Duración estimada:</strong>
                                                <span>{plantillaSeleccionada.duracion_estimada_dias} días</span>
                                            </div>
                                            <div className={estilos.previewItem}>
                                                <strong>Costo base:</strong>
                                                <span>RD$ {parseFloat(plantillaSeleccionada.costo_base_estimado || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {plantillaSeleccionada.recursos && plantillaSeleccionada.recursos.length > 0 && (
                                            <div className={estilos.recursosPreview}>
                                                <strong>Recursos sugeridos:</strong>
                                                <ul>
                                                    {plantillaSeleccionada.recursos.slice(0, 5).map((recurso, idx) => (
                                                        <li key={idx}>
                                                            {recurso.nombre} ({recurso.cantidad_estimada} {recurso.unidad || 'unidades'})
                                                        </li>
                                                    ))}
                                                    {plantillaSeleccionada.recursos.length > 5 && (
                                                        <li>... y {plantillaSeleccionada.recursos.length - 5} más</li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                    <div className={estilos.ilustracionCard}>
                                        <Image
                                            src="/ilustracion_servicios/документы.svg"
                                            alt="Plantilla"
                                            width={200}
                                            height={200}
                                            className={estilos.ilustracion}
                                        />
                                        <h4>Selecciona una Plantilla</h4>
                                        <p>Elige la plantilla que mejor se ajuste al servicio que deseas crear</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* PASO 3: Ajustes Operativos */}
                {paso === 3 && (
                    <div className={estilos.layoutPrincipal}>
                        <div className={estilos.columnaIzquierda}>
                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <h3 className={estilos.tituloSeccion}>
                                    <ion-icon name="calendar-outline"></ion-icon>
                                    Ajustes Operativos
                                </h3>

                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>
                                        Nombre del Servicio
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        className={`${estilos.input} ${estilos[tema]}`}
                                        placeholder="Nombre del servicio (se hereda de la plantilla)"
                                    />
                                </div>

                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>Descripción</label>
                                    <textarea
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        className={`${estilos.textarea} ${estilos[tema]}`}
                                        rows="3"
                                        placeholder="Descripción del servicio"
                                    />
                                </div>

                                <div className={estilos.grid2}>
                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>
                                            Fecha de Inicio *
                                            <span className={estilos.required}>Requerido</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="fecha_inicio"
                                            value={formData.fecha_inicio}
                                            onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]} ${errors.fecha_inicio ? estilos.inputError : ''}`}
                                        />
                                        {errors.fecha_inicio && (
                                            <span className={estilos.errorMsg}>
                                                <ion-icon name="alert-circle-outline"></ion-icon>
                                                {errors.fecha_inicio}
                                            </span>
                                        )}
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>
                                            Fecha de Fin Estimada *
                                            <span className={estilos.required}>Requerido</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="fecha_fin_estimada"
                                            value={formData.fecha_fin_estimada}
                                            onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]} ${errors.fecha_fin_estimada ? estilos.inputError : ''}`}
                                        />
                                        {errors.fecha_fin_estimada && (
                                            <span className={estilos.errorMsg}>
                                                <ion-icon name="alert-circle-outline"></ion-icon>
                                                {errors.fecha_fin_estimada}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>
                                        Presupuesto Asignado (RD$)
                                    </label>
                                    <div className={estilos.inputConIcono}>
                                        <ion-icon name="cash-outline"></ion-icon>
                                        <input
                                            type="number"
                                            name="presupuesto_asignado"
                                            value={formData.presupuesto_asignado}
                                            onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]} ${errors.presupuesto_asignado ? estilos.inputError : ''}`}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    {plantillaSeleccionada && (
                                        <span className={estilos.ayuda}>
                                            Costo base sugerido: RD$ {parseFloat(plantillaSeleccionada.costo_base_estimado || 0).toLocaleString()}
                                        </span>
                                    )}
                                    {errors.presupuesto_asignado && (
                                        <span className={estilos.errorMsg}>
                                            <ion-icon name="alert-circle-outline"></ion-icon>
                                            {errors.presupuesto_asignado}
                                        </span>
                                    )}
                                </div>

                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>Prioridad</label>
                                    <div className={estilos.gridPrioridad}>
                                        {prioridades.map(prioridad => (
                                            <div
                                                key={prioridad.value}
                                                onClick={() => seleccionarPrioridad(prioridad.value)}
                                                className={`${estilos.cardPrioridad} ${estilos[tema]} ${
                                                    formData.prioridad === prioridad.value ? estilos.cardPrioridadActiva : ''
                                                }`}
                                                style={{ '--prioridad-color': prioridad.color }}
                                            >
                                                <ion-icon name="flag-outline"></ion-icon>
                                                <h4>{prioridad.label}</h4>
                                                <p>{prioridad.descripcion}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>Notas Técnicas</label>
                                    <textarea
                                        name="notas_tecnicas"
                                        value={formData.notas_tecnicas}
                                        onChange={handleChange}
                                        className={`${estilos.textarea} ${estilos[tema]}`}
                                        rows="3"
                                        placeholder="Especificaciones técnicas, requerimientos especiales..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={estilos.columnaDerecha}>
                            {plantillaSeleccionada && (
                                <div className={`${estilos.seccionInfo} ${estilos[tema]}`}>
                                    <h4>Resumen de la Plantilla</h4>
                                    <div className={estilos.infoGrid}>
                                        <div>
                                            <strong>Plantilla:</strong> {plantillaSeleccionada.nombre}
                                        </div>
                                        <div>
                                            <strong>Duración:</strong> {plantillaSeleccionada.duracion_estimada_dias} días
                                        </div>
                                        <div>
                                            <strong>Costo base:</strong> RD$ {parseFloat(plantillaSeleccionada.costo_base_estimado || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* PASO 4: Confirmación */}
                {paso === 4 && (
                    <div className={estilos.vistaPrevia}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="checkmark-done-outline"></ion-icon>
                                Confirmar Nuevo Servicio
                            </h3>

                            <div className={estilos.resumenCompleto}>
                                {/* Plantilla y Nombre */}
                                <div className={estilos.resumenCard}>
                                    <div className={estilos.resumenHeader}>
                                        <div className={estilos.emojiResumen}>📋</div>
                                        <div>
                                            <h4>Plantilla</h4>
                                            <h2>{plantillaSeleccionada?.nombre || 'N/A'}</h2>
                                        </div>
                                    </div>
                                    <div className={estilos.resumenBody}>
                                        <h3>{formData.nombre || plantillaSeleccionada?.nombre}</h3>
                                        {formData.descripcion && <p>{formData.descripcion}</p>}
                                    </div>
                                </div>

                                {/* Detalles */}
                                <div className={estilos.detallesFinales}>
                                    {formData.obra_id ? (
                                        <div className={estilos.detalleCardFinal}>
                                            <ion-icon name="business-outline"></ion-icon>
                                            <div>
                                                <p className={estilos.detalleLabel}>Obra</p>
                                                <p className={estilos.detalleValor}>
                                                    {obras.find(o => o.id === parseInt(formData.obra_id))?.nombre || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={estilos.detalleCardFinal}>
                                            <ion-icon name="information-circle-outline"></ion-icon>
                                            <div>
                                                <p className={estilos.detalleLabel}>Obra</p>
                                                <p className={estilos.detalleValor}>Se creará automáticamente</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className={estilos.detalleCardFinal}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        <div>
                                            <p className={estilos.detalleLabel}>Fecha Inicio</p>
                                            <p className={estilos.detalleValor}>
                                                {new Date(formData.fecha_inicio).toLocaleDateString('es-DO')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={estilos.detalleCardFinal}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        <div>
                                            <p className={estilos.detalleLabel}>Fecha Fin Estimada</p>
                                            <p className={estilos.detalleValor}>
                                                {new Date(formData.fecha_fin_estimada).toLocaleDateString('es-DO')}
                                            </p>
                                        </div>
                                    </div>

                                    {formData.presupuesto_asignado && (
                                        <div className={estilos.detalleCardFinal}>
                                            <ion-icon name="cash-outline"></ion-icon>
                                            <div>
                                                <p className={estilos.detalleLabel}>Presupuesto</p>
                                                <p className={estilos.detalleValor}>
                                                    RD$ {parseFloat(formData.presupuesto_asignado).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className={estilos.detalleCardFinal}>
                                        <ion-icon name="flag-outline"></ion-icon>
                                        <div>
                                            <p className={estilos.detalleLabel}>Prioridad</p>
                                            <p className={estilos.detalleValor}>{prioridadSeleccionada?.label}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer con botones de navegación */}
                <div className={`${estilos.footerFijo} ${estilos[tema]}`}>
                    <div className={estilos.footerContenido}>
                        <div className={estilos.footerIzquierda}>
                            {paso > 1 && (
                                <button
                                    type="button"
                                    onClick={pasoAnterior}
                                    className={`${estilos.btnSecundario} ${estilos[tema]}`}
                                    disabled={procesando}
                                >
                                    <ion-icon name="arrow-back-outline"></ion-icon>
                                    Anterior
                                </button>
                            )}
                        </div>

                        <div className={estilos.footerDerecha}>
                            {paso < 4 ? (
                                <button
                                    type="button"
                                    onClick={siguientePaso}
                                    className={estilos.btnPrimario}
                                >
                                    Siguiente
                                    <ion-icon name="arrow-forward-outline"></ion-icon>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className={estilos.btnGuardar}
                                    disabled={procesando}
                                >
                                    {procesando ? (
                                        <>
                                            <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                                            Creando Servicio...
                                        </>
                                    ) : (
                                        <>
                                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                                            Crear Servicio
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
