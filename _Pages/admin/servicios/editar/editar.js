"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerServicioPorId } from '../ver/servidor'
import { actualizarServicio } from './servidor'
import { obtenerPlantillasServicio } from '../plantillas/servidor'
import { obtenerPlantillaServicio } from '../plantillas/editar/servidor'
import { obtenerClientes } from '../../clientes/servidor'
import { obtenerObras } from '../../obras/servidor'
import { PRIORIDADES, formatearPrioridad, ESTADOS_SERVICIO } from '../../core/construction/estados'
import estilos from './editar.module.css'

export default function EditarServicio() {
    const router = useRouter()
    const params = useParams()
    const [tema, setTema] = useState('light')
    const [procesando, setProcesando] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [errors, setErrors] = useState({})
    
    const [servicioOriginal, setServicioOriginal] = useState(null)
    const [clientes, setClientes] = useState([])
    const [obras, setObras] = useState([])
    const [plantillas, setPlantillas] = useState([])
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null)
    const [contextoObra, setContextoObra] = useState(null)
    
    const [formData, setFormData] = useState({
        servicio_plantilla_id: '',
        obra_id: '',
        proyecto_id: '',
        nombre: '',
        descripcion: '',
        ubicacion: '',
        zona: '',
        fecha_inicio: '',
        fecha_fin_estimada: '',
        fecha_programada: '',
        fecha_solicitud: '',
        presupuesto_asignado: '',
        costo_estimado: '',
        responsable_id: '',
        cliente_id: '',
        estado: '',
        prioridad: PRIORIDADES.MEDIA,
        notas_tecnicas: ''
    })

    const prioridades = [
        { value: 'baja', label: 'Baja', color: '#10b981', descripcion: 'Puede esperar' },
        { value: 'media', label: 'Media', color: '#3b82f6', descripcion: 'Prioridad normal' },
        { value: 'alta', label: 'Alta', color: '#f59e0b', descripcion: 'Requiere atención pronto' },
        { value: 'urgente', label: 'Urgente', color: '#ef4444', descripcion: 'Atención inmediata' }
    ]

    const estados = [
        { value: ESTADOS_SERVICIO.PENDIENTE, label: 'Pendiente' },
        { value: ESTADOS_SERVICIO.PROGRAMADO, label: 'Programado' },
        { value: ESTADOS_SERVICIO.EN_EJECUCION, label: 'En Ejecución' },
        { value: ESTADOS_SERVICIO.FINALIZADO, label: 'Finalizado' },
        { value: ESTADOS_SERVICIO.CANCELADO, label: 'Cancelado' }
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
    }, [params.id])

    useEffect(() => {
        if (formData.obra_id) {
            cargarContextoObra(formData.obra_id)
        } else {
            setContextoObra(null)
        }
    }, [formData.obra_id])

    useEffect(() => {
        if (formData.servicio_plantilla_id) {
            cargarPlantillaDetalle(formData.servicio_plantilla_id)
        } else {
            setPlantillaSeleccionada(null)
        }
    }, [formData.servicio_plantilla_id])

    async function cargarDatos() {
        setCargando(true)
        try {
            // Cargar servicio existente
            const resServicio = await obtenerServicioPorId(params.id)
            if (!resServicio.success) {
                alert(resServicio.mensaje || 'Error al cargar servicio')
                router.push('/admin/servicios')
                return
            }

            const servicio = resServicio.servicio
            setServicioOriginal(servicio)

            // Pre-llenar formulario con datos del servicio
            setFormData({
                servicio_plantilla_id: servicio.servicio_plantilla_id || '',
                obra_id: servicio.obra_id || '',
                proyecto_id: servicio.proyecto_id || '',
                nombre: servicio.nombre || '',
                descripcion: servicio.descripcion || '',
                ubicacion: servicio.ubicacion || '',
                zona: servicio.zona || '',
                fecha_inicio: servicio.fecha_inicio ? servicio.fecha_inicio.split('T')[0] : '',
                fecha_fin_estimada: servicio.fecha_fin_estimada ? servicio.fecha_fin_estimada.split('T')[0] : '',
                fecha_programada: servicio.fecha_programada ? servicio.fecha_programada.split('T')[0] : '',
                fecha_solicitud: servicio.fecha_solicitud ? servicio.fecha_solicitud.split('T')[0] : '',
                presupuesto_asignado: servicio.presupuesto_asignado || '',
                costo_estimado: servicio.costo_estimado || '',
                responsable_id: servicio.usuario_responsable_id || '',
                cliente_id: servicio.cliente_id || '',
                estado: servicio.estado || ESTADOS_SERVICIO.PENDIENTE,
                prioridad: servicio.prioridad || PRIORIDADES.MEDIA,
                notas_tecnicas: servicio.notas_tecnicas || ''
            })

            // Cargar datos maestros
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

            // Cargar plantilla si existe
            if (servicio.servicio_plantilla_id) {
                await cargarPlantillaDetalle(servicio.servicio_plantilla_id)
            }

            // Cargar contexto de obra si existe
            if (servicio.obra_id) {
                await cargarContextoObra(servicio.obra_id)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar los datos del servicio')
        } finally {
            setCargando(false)
        }
    }

    async function cargarContextoObra(obraId) {
        const obra = obras.find(o => o.id === parseInt(obraId))
        if (obra) {
            setContextoObra(obra)
        }
    }

    async function cargarPlantillaDetalle(plantillaId) {
        const res = await obtenerPlantillaServicio(plantillaId)
        if (res.success) {
            setPlantillaSeleccionada(res.plantilla)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Limpiar error del campo si existe
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const seleccionarPrioridad = (prioridad) => {
        setFormData(prev => ({ ...prev, prioridad }))
    }

    const validarFormulario = () => {
        const nuevosErrores = {}
        
        if (!formData.servicio_plantilla_id) {
            nuevosErrores.servicio_plantilla_id = 'Debe seleccionar una plantilla'
        }
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validarFormulario()) {
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
                costo_estimado: formData.costo_estimado ? parseFloat(formData.costo_estimado) : null,
                responsable_id: formData.responsable_id ? parseInt(formData.responsable_id) : null,
                cliente_id: formData.cliente_id ? parseInt(formData.cliente_id) : null
            }
            
            const res = await actualizarServicio(params.id, datos)
            if (res.success) {
                alert('✅ Servicio actualizado exitosamente')
                router.push(`/admin/servicios/ver/${params.id}`)
            } else {
                alert(res.mensaje || 'Error al actualizar servicio')
                if (res.errores) {
                    setErrors(res.errores)
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
                    <p>Cargando información del servicio...</p>
                </div>
            </div>
        )
    }

    if (!servicioOriginal) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.vacio}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <p>Servicio no encontrado</p>
                    <button onClick={() => router.push('/admin/servicios')} className={estilos.btnVolver}>
                        Volver a Servicios
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Editar Servicio</h1>
                    <p className={estilos.subtitulo}>
                        {servicioOriginal.codigo_servicio} - {servicioOriginal.nombre}
                    </p>
                </div>
                <button className={estilos.btnCancelar} onClick={() => router.back()}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Cancelar</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className={estilos.formulario}>
                <div className={estilos.layoutPrincipal}>
                    <div className={estilos.columnaIzquierda}>
                        {/* Información General */}
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="information-circle-outline"></ion-icon>
                                Información General
                            </h3>

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>
                                    Nombre del Servicio *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]}`}
                                    placeholder="Nombre del servicio"
                                    required
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

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>
                                    Plantilla de Servicio *
                                </label>
                                <select
                                    name="servicio_plantilla_id"
                                    value={formData.servicio_plantilla_id}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]} ${errors.servicio_plantilla_id ? estilos.inputError : ''}`}
                                    required
                                >
                                    <option value="">Selecciona una plantilla</option>
                                    {plantillas.map(plantilla => (
                                        <option key={plantilla.id} value={plantilla.id}>
                                            {plantilla.codigo_plantilla} - {plantilla.nombre}
                                        </option>
                                    ))}
                                </select>
                                {errors.servicio_plantilla_id && (
                                    <span className={estilos.errorMsg}>
                                        <ion-icon name="alert-circle-outline"></ion-icon>
                                        {errors.servicio_plantilla_id}
                                    </span>
                                )}
                            </div>

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Estado</label>
                                <select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]}`}
                                >
                                    {estados.map(estado => (
                                        <option key={estado.value} value={estado.value}>
                                            {estado.label}
                                        </option>
                                    ))}
                                </select>
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
                        </div>

                        {/* Contexto */}
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="business-outline"></ion-icon>
                                Contexto
                            </h3>

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Cliente</label>
                                <select
                                    name="cliente_id"
                                    value={formData.cliente_id}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]}`}
                                >
                                    <option value="">Sin cliente</option>
                                    {clientes.map(cliente => (
                                        <option key={cliente.id} value={cliente.id}>
                                            {cliente.nombre} {cliente.apellidos || ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Obra Asociada</label>
                                <select
                                    name="obra_id"
                                    value={formData.obra_id}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]}`}
                                >
                                    <option value="">Sin obra</option>
                                    {obras.map(obra => (
                                        <option key={obra.id} value={obra.id}>
                                            {obra.codigo_obra ? `${obra.codigo_obra} - ` : ''}{obra.nombre}
                                        </option>
                                    ))}
                                </select>
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

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Ubicación</label>
                                <input
                                    type="text"
                                    name="ubicacion"
                                    value={formData.ubicacion}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]}`}
                                    placeholder="Ubicación del servicio"
                                    required
                                />
                            </div>

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Zona</label>
                                <input
                                    type="text"
                                    name="zona"
                                    value={formData.zona}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${estilos[tema]}`}
                                    placeholder="Zona del servicio"
                                />
                            </div>
                        </div>

                        {/* Fechas y Presupuesto */}
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="calendar-outline"></ion-icon>
                                Fechas y Presupuesto
                            </h3>

                            <div className={estilos.grid2}>
                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>
                                        Fecha de Solicitud
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha_solicitud"
                                        value={formData.fecha_solicitud}
                                        onChange={handleChange}
                                        className={`${estilos.input} ${estilos[tema]}`}
                                    />
                                </div>

                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>
                                        Fecha Programada
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha_programada"
                                        value={formData.fecha_programada}
                                        onChange={handleChange}
                                        className={`${estilos.input} ${estilos[tema]}`}
                                    />
                                </div>
                            </div>

                            <div className={estilos.grid2}>
                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>
                                        Fecha de Inicio *
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha_inicio"
                                        value={formData.fecha_inicio}
                                        onChange={handleChange}
                                        className={`${estilos.input} ${estilos[tema]} ${errors.fecha_inicio ? estilos.inputError : ''}`}
                                        required
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
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha_fin_estimada"
                                        value={formData.fecha_fin_estimada}
                                        onChange={handleChange}
                                        className={`${estilos.input} ${estilos[tema]} ${errors.fecha_fin_estimada ? estilos.inputError : ''}`}
                                        required
                                    />
                                    {errors.fecha_fin_estimada && (
                                        <span className={estilos.errorMsg}>
                                            <ion-icon name="alert-circle-outline"></ion-icon>
                                            {errors.fecha_fin_estimada}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={estilos.grid2}>
                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>
                                        Costo Estimado (RD$)
                                    </label>
                                    <div className={estilos.inputConIcono}>
                                        <ion-icon name="cash-outline"></ion-icon>
                                        <input
                                            type="number"
                                            name="costo_estimado"
                                            value={formData.costo_estimado}
                                            onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]}`}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                        />
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
                                    {errors.presupuesto_asignado && (
                                        <span className={estilos.errorMsg}>
                                            <ion-icon name="alert-circle-outline"></ion-icon>
                                            {errors.presupuesto_asignado}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notas Técnicas */}
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="document-text-outline"></ion-icon>
                                Notas Técnicas
                            </h3>

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Notas Técnicas</label>
                                <textarea
                                    name="notas_tecnicas"
                                    value={formData.notas_tecnicas}
                                    onChange={handleChange}
                                    className={`${estilos.textarea} ${estilos[tema]}`}
                                    rows="5"
                                    placeholder="Especificaciones técnicas, requerimientos especiales..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className={estilos.columnaDerecha}>
                        {plantillaSeleccionada && (
                            <div className={`${estilos.seccionDestacada} ${estilos[tema]}`}>
                                <h3>Plantilla Seleccionada</h3>
                                <div className={estilos.plantillaPreview}>
                                    <div className={estilos.plantillaPreviewHeader}>
                                        <div className={estilos.plantillaPreviewCodigo}>
                                            {plantillaSeleccionada.codigo_plantilla}
                                        </div>
                                        <h2>{plantillaSeleccionada.nombre}</h2>
                                    </div>
                                    {plantillaSeleccionada.descripcion && (
                                        <p className={estilos.plantillaPreviewDesc}>
                                            {plantillaSeleccionada.descripcion}
                                        </p>
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
                                </div>
                            </div>
                        )}

                        <div className={`${estilos.seccionInfo} ${estilos[tema]}`}>
                            <h4>Información del Servicio</h4>
                            <div className={estilos.infoGrid}>
                                <div>
                                    <strong>Código:</strong> {servicioOriginal.codigo_servicio}
                                </div>
                                <div>
                                    <strong>Creado:</strong> {new Date(servicioOriginal.fecha_creacion).toLocaleDateString()}
                                </div>
                                {servicioOriginal.ultima_actualizacion && (
                                    <div>
                                        <strong>Última actualización:</strong> {new Date(servicioOriginal.fecha_actualizacion).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer con botones */}
                <div className={`${estilos.footerFijo} ${estilos[tema]}`}>
                    <div className={estilos.footerContenido}>
                        <div className={estilos.footerIzquierda}>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className={`${estilos.btnSecundario} ${estilos[tema]}`}
                                disabled={procesando}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                                Cancelar
                            </button>
                        </div>

                        <div className={estilos.footerDerecha}>
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
                                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}

