"use client"

/**
 * Componente de Creación de Proyecto Mejorado
 * 
 * Características UX:
 * - Autocompletado inteligente para clientes y usuarios
 * - Predicciones automáticas de fechas y presupuestos
 * - Autoguardado en localStorage
 * - Validaciones en tiempo real
 * - Diseño mobile-first y responsive
 * - Componente de etiquetas con autocompletado
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { crearProyecto, obtenerEstadisticasProyectos, obtenerUsuariosResponsables, obtenerEtiquetasExistentes, obtenerPlantillasProyectos } from '../servidor'
import AutocompleteCliente from './components/AutocompleteCliente'
import TagInput from './components/TagInput'
import estilos from './nuevo.module.css'

// Formas de pago comunes
const FORMAS_PAGO = [
  { value: '', label: 'Seleccionar forma de pago...' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'otro', label: 'Otro' }
]

// Estados de proyecto
const ESTADOS_PROYECTO = [
  { value: 'planificacion', label: 'Planificación' },
  { value: 'activo', label: 'Activo' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' }
]

// Prioridades
const PRIORIDADES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' }
]

const STORAGE_KEY = 'proyecto_draft'

export default function NuevoProyecto() {
    const router = useRouter()
    
    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin_estimada: '',
        presupuesto_total: '',
        cliente_id: '',
        cliente_nombre: '',
        usuario_responsable_id: '',
        forma_pago: '',
        ubicacion: '',
        estado: 'planificacion',
        prioridad: 'media',
        etiquetas: []
    })
    
    // Estado de la UI
    const [errors, setErrors] = useState({})
    const [procesando, setProcesando] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [touched, setTouched] = useState({})
    const [mostrarAvanzadas, setMostrarAvanzadas] = useState(false)
    const [seccionesAbiertas, setSeccionesAbiertas] = useState({
        tipoInicio: true,
        general: true,
        cliente: true,
        fechas: true,
        presupuesto: true,
        avanzadas: false
    })
    const [tema, setTema] = useState('light')
    
    // Datos para autocompletado y predicciones
    const [usuarios, setUsuarios] = useState([])
    const [etiquetasExistentes, setEtiquetasExistentes] = useState([])
    const [estadisticas, setEstadisticas] = useState({
        duracionPromedioDias: 30,
        presupuestoPromedio: 0,
        etiquetasFrecuentes: []
    })
    
    // Estado para plantillas
    const [tipoInicio, setTipoInicio] = useState('vacio') // 'vacio' o 'plantilla'
    const [plantillaId, setPlantillaId] = useState('')
    const [plantillas, setPlantillas] = useState([])
    
    const formRef = useRef(null)
    const autosaveTimeoutRef = useRef(null)

    // Detectar tema (igual que en obras.js)
    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)

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

    // Cargar datos iniciales y draft guardado
    useEffect(() => {
        cargarDatosIniciales()
        cargarDraft()
    }, [])

    // Autoguardado cuando cambian los datos
    useEffect(() => {
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current)
        }

        autosaveTimeoutRef.current = setTimeout(() => {
            guardarDraft()
        }, 1000) // Guardar después de 1 segundo de inactividad

        return () => {
            if (autosaveTimeoutRef.current) {
                clearTimeout(autosaveTimeoutRef.current)
            }
        }
    }, [formData])

    async function cargarDatosIniciales() {
        try {
            const [statsRes, usuariosRes, etiquetasRes, plantillasRes] = await Promise.all([
                obtenerEstadisticasProyectos(),
                obtenerUsuariosResponsables(),
                obtenerEtiquetasExistentes(),
                obtenerPlantillasProyectos()
            ])

            if (statsRes.success && statsRes.estadisticas) {
                setEstadisticas(statsRes.estadisticas)
            }

            if (usuariosRes.success) {
                setUsuarios(usuariosRes.usuarios || [])
            }

            if (etiquetasRes.success) {
                setEtiquetasExistentes(etiquetasRes.etiquetas || [])
            }

            if (plantillasRes.success) {
                setPlantillas(plantillasRes.plantillas || [])
            }
        } catch (error) {
            console.error('Error al cargar datos iniciales:', error)
        } finally {
            setCargando(false)
        }
    }

    function cargarDraft() {
        try {
            const draft = localStorage.getItem(STORAGE_KEY)
            if (draft) {
                const datosGuardados = JSON.parse(draft)
                setFormData(prev => ({ ...prev, ...datosGuardados }))
            }
        } catch (error) {
            console.error('Error al cargar draft:', error)
        }
    }

    function guardarDraft() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
        } catch (error) {
            console.error('Error al guardar draft:', error)
        }
    }

    function limpiarDraft() {
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch (error) {
            console.error('Error al limpiar draft:', error)
        }
    }

    /**
     * Predice fecha de fin basada en fecha de inicio y estadísticas
     */
    const predecirFechaFin = useCallback((fechaInicio) => {
        if (!fechaInicio) return ''

        const fecha = new Date(fechaInicio)
        const diasPromedio = estadisticas.duracionPromedioDias || 30
        fecha.setDate(fecha.getDate() + diasPromedio)

        return fecha.toISOString().split('T')[0]
    }, [estadisticas.duracionPromedioDias])

    /**
     * Maneja cambios en los campos del formulario
     */
    const handleChange = (e) => {
        const { name, value } = e.target
        
        setFormData(prev => {
            const nuevo = { ...prev, [name]: value }
            
            // Si cambia la fecha de inicio, predecir fecha de fin si está vacía
            if (name === 'fecha_inicio' && !prev.fecha_fin_estimada) {
                nuevo.fecha_fin_estimada = predecirFechaFin(value)
            }
            
            return nuevo
        })
        
        // Limpiar error del campo cuando el usuario empieza a escribir o selecciona un valor
        if (errors[name]) {
            setErrors(prev => {
                const nuevosErrores = { ...prev }
                delete nuevosErrores[name]
                return nuevosErrores
            })
        }
        
        // Si es fecha_inicio y tiene valor, limpiar el error inmediatamente
        if (name === 'fecha_inicio' && value) {
            setErrors(prev => {
                const nuevosErrores = { ...prev }
                delete nuevosErrores.fecha_inicio
                return nuevosErrores
            })
        }
        
        // Marcar campo como tocado
        setTouched(prev => ({ ...prev, [name]: true }))
    }

    /**
     * Maneja selección de cliente desde autocompletado
     */
    const handleClienteSelect = (cliente) => {
        if (cliente) {
            setFormData(prev => ({
                ...prev,
                cliente_id: cliente.id,
                cliente_nombre: cliente.nombreCompleto || `${cliente.nombre} ${cliente.apellidos || ''}`
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                cliente_id: '',
                cliente_nombre: ''
            }))
        }
    }

    /**
     * Maneja cambio de etiquetas
     */
    const handleEtiquetasChange = (nuevasEtiquetas) => {
        setFormData(prev => ({ ...prev, etiquetas: nuevasEtiquetas }))
    }

    /**
     * Valida un campo individual
     */
    const validarCampo = (name, value) => {
        const errores = {}
        
        switch (name) {
            case 'nombre':
                if (!value || value.trim() === '') {
                    errores.nombre = 'El nombre del proyecto es obligatorio'
                } else if (value.length > 255) {
                    errores.nombre = 'El nombre no puede exceder 255 caracteres'
                }
                break
                
            case 'fecha_inicio':
                if (!value) {
                    errores.fecha_inicio = 'La fecha de inicio es obligatoria'
                }
                break
                
            case 'fecha_fin_estimada':
                if (!value) {
                    errores.fecha_fin_estimada = 'La fecha de fin estimada es obligatoria'
                } else if (formData.fecha_inicio && value <= formData.fecha_inicio) {
                    errores.fecha_fin_estimada = 'La fecha de fin debe ser posterior a la fecha de inicio'
                }
                break
                
            case 'presupuesto_total':
                if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
                    errores.presupuesto_total = 'El presupuesto debe ser un número positivo'
                }
                break
                
            case 'descripcion':
                if (value && value.length > 5000) {
                    errores.descripcion = 'La descripción no puede exceder 5000 caracteres'
                }
                break
        }
        
        return errores
    }

    /**
     * Valida todo el formulario
     */
    const validarFormulario = () => {
        const nuevosErrores = {}
        
        // Validar cada campo
        Object.keys(formData).forEach(key => {
            if (key !== 'etiquetas' && key !== 'cliente_nombre') {
                const erroresCampo = validarCampo(key, formData[key])
                Object.assign(nuevosErrores, erroresCampo)
            }
        })
        
        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    /**
     * Maneja el envío del formulario
     */
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Marcar todos los campos como tocados
        const todosTocados = {}
        Object.keys(formData).forEach(key => {
            todosTocados[key] = true
        })
        setTouched(todosTocados)
        
        // Validar formulario
        if (!validarFormulario()) {
            // Scroll al primer error
            const primerError = Object.keys(errors)[0]
            if (primerError) {
                const elemento = document.querySelector(`[name="${primerError}"]`)
                if (elemento) {
                    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    elemento.focus()
                }
            }
            return
        }

        setProcesando(true)
        try {
            // Preparar datos para envío
            const datos = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim() || null,
                fecha_inicio: formData.fecha_inicio,
                fecha_fin_estimada: formData.fecha_fin_estimada,
                presupuesto_total: formData.presupuesto_total 
                    ? parseFloat(formData.presupuesto_total) 
                    : null,
                cliente_id: formData.cliente_id || null,
                usuario_responsable_id: formData.usuario_responsable_id || null,
                forma_pago: formData.forma_pago || null,
                ubicacion: formData.ubicacion.trim() || null,
                estado: formData.estado,
                prioridad: formData.prioridad,
                etiquetas: formData.etiquetas || [],
                plantilla_id: tipoInicio === 'plantilla' && plantillaId ? parseInt(plantillaId) : null
            }
            
            const res = await crearProyecto(datos)
            
            if (res.success) {
                // Limpiar draft al guardar exitosamente
                limpiarDraft()
                
                // Éxito - redirigir
                if (res.proyecto?.id) {
                    router.push(`/admin/proyectos/ver/${res.proyecto.id}`)
                } else {
                    router.push('/admin/proyectos')
                }
            } else {
                // Mostrar errores del servidor
                if (res.errores) {
                    setErrors(res.errores)
                } else {
                    alert(res.mensaje || 'Error al crear proyecto')
                }
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al procesar la solicitud. Por favor, intente nuevamente.')
        } finally {
            setProcesando(false)
        }
    }

    /**
     * Maneja el blur de un campo (validación en tiempo real)
     */
    const handleBlur = (e) => {
        const { name, value } = e.target
        setTouched(prev => ({ ...prev, [name]: true }))
        
        // Solo validar si el campo está vacío o tiene un error
        // Si tiene valor y no hay error previo, no validar
        if (value || errors[name]) {
            const erroresCampo = validarCampo(name, value)
            if (Object.keys(erroresCampo).length > 0) {
                setErrors(prev => ({ ...prev, ...erroresCampo }))
            } else {
                // Limpiar error si el campo es válido
                setErrors(prev => {
                    const nuevosErrores = { ...prev }
                    delete nuevosErrores[name]
                    return nuevosErrores
                })
            }
        }
    }

    /**
     * Obtiene la clase CSS para un campo con error
     */
    const getFieldClassName = (fieldName) => {
        const hasError = errors[fieldName] && touched[fieldName]
        return `${estilos.input} ${hasError ? estilos.inputError : ''}`
    }

    /**
     * Sugerir presupuesto basado en estadísticas
     */
    const sugerirPresupuesto = () => {
        if (estadisticas.presupuestoPromedio > 0) {
            setFormData(prev => ({
                ...prev,
                presupuesto_total: estadisticas.presupuestoPromedio.toFixed(2)
            }))
        }
    }

    /**
     * Aplicar fecha de inicio como hoy
     */
    const aplicarFechaHoy = () => {
        const hoy = new Date().toISOString().split('T')[0]
        setFormData(prev => ({
            ...prev,
            fecha_inicio: hoy,
            fecha_fin_estimada: predecirFechaFin(hoy)
        }))
    }

    /**
     * Toggle sección colapsable
     */
    const toggleSeccion = (seccion) => {
        setSeccionesAbiertas(prev => ({
            ...prev,
            [seccion]: !prev[seccion]
        }))
    }

    /**
     * Calcular progreso del formulario
     */
    const calcularProgreso = () => {
        const camposObligatorios = ['nombre', 'fecha_inicio', 'fecha_fin_estimada']
        const camposCompletados = camposObligatorios.filter(campo => {
            const valor = formData[campo]
            return valor && valor.toString().trim() !== ''
        })
        
        const porcentaje = (camposCompletados.length / camposObligatorios.length) * 100
        return Math.round(porcentaje)
    }

    /**
     * Obtener secciones completadas
     */
    const obtenerSeccionesCompletadas = () => {
        const secciones = {
            tipoInicio: tipoInicio === 'vacio' || (tipoInicio === 'plantilla' && plantillaId !== ''),
            general: formData.nombre && formData.nombre.trim() !== '',
            cliente: formData.cliente_id !== '',
            fechas: formData.fecha_inicio && formData.fecha_fin_estimada,
            presupuesto: true, // Opcional
            avanzadas: formData.etiquetas && formData.etiquetas.length > 0
        }
        return secciones
    }

    const progreso = calcularProgreso()
    const seccionesCompletadas = obtenerSeccionesCompletadas()
    const totalSecciones = 6
    const seccionesCompletas = Object.values(seccionesCompletadas).filter(Boolean).length

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <p>Cargando formulario...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="business-outline"></ion-icon>
                        Nuevo Proyecto
                    </h1>
                    <p className={estilos.subtitulo}>
                        Crea un nuevo proyecto para organizar obras y servicios
                    </p>
                </div>
                <button 
                    onClick={() => router.back()} 
                    className={estilos.btnVolver}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver
                </button>
            </div>

            {/* Barra de Progreso */}
            <div className={estilos.progressBar}>
                <div className={estilos.progressHeader}>
                    <h3 className={estilos.progressTitle}>Progreso del formulario</h3>
                    <span className={estilos.progressPercentage}>{progreso}%</span>
                </div>
                <div className={estilos.progressSteps}>
                    {Array.from({ length: totalSecciones }).map((_, index) => {
                        const seccionKeys = ['tipoInicio', 'general', 'cliente', 'fechas', 'presupuesto', 'avanzadas']
                        const seccionKey = seccionKeys[index]
                        const completada = seccionesCompletadas[seccionKey]
                        const activa = index === 0 || seccionesCompletadas[seccionKeys[index - 1]]
                        
                        return (
                            <div
                                key={index}
                                className={`${estilos.progressStep} ${
                                    completada ? estilos.completed : activa ? estilos.active : ''
                                }`}
                            />
                        )
                    })}
                </div>
                <div className={estilos.progressLabels}>
                    <span>Tipo de Inicio</span>
                    <span>Información General</span>
                    <span>Cliente y Responsable</span>
                    <span>Fechas y Estado</span>
                    <span>Presupuesto</span>
                    <span>Opciones Avanzadas</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className={estilos.formulario} ref={formRef}>
                {/* Tipo de Inicio */}
                <section className={estilos.seccion}>
                    <div 
                        className={estilos.seccionHeader}
                        onClick={() => toggleSeccion('tipoInicio')}
                    >
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="layers-outline"></ion-icon>
                            Tipo de Inicio
                        </h2>
                        <ion-icon 
                            name={seccionesAbiertas.tipoInicio ? "chevron-up-outline" : "chevron-down-outline"}
                            className={`${estilos.seccionIcono} ${seccionesAbiertas.tipoInicio ? estilos.abierto : ''}`}
                        ></ion-icon>
                    </div>
                    <div className={`${estilos.seccionBody} ${!seccionesAbiertas.tipoInicio ? estilos.oculto : ''}`}>
                        <div className={estilos.grupo}>
                            <label className={estilos.label}>
                                ¿Cómo deseas iniciar este proyecto?
                            </label>
                            <span className={estilos.helpText}>
                                Elige si quieres crear un proyecto vacío o usar una plantilla predefinida
                            </span>
                            
                            <div className={estilos.radioGroup}>
                                <label className={estilos.radioLabel}>
                                    <input
                                        type="radio"
                                        name="tipoInicio"
                                        value="vacio"
                                        checked={tipoInicio === 'vacio'}
                                        onChange={(e) => {
                                            setTipoInicio(e.target.value)
                                            setPlantillaId('')
                                        }}
                                        className={estilos.radio}
                                    />
                                    <span className={estilos.radioText}>
                                        <ion-icon name="document-outline"></ion-icon>
                                        Proyecto vacío
                                    </span>
                                    <span className={estilos.radioHelp}>
                                        Empieza desde cero y configura tu proyecto paso a paso
                                    </span>
                                </label>
                                
                                <label className={estilos.radioLabel}>
                                    <input
                                        type="radio"
                                        name="tipoInicio"
                                        value="plantilla"
                                        checked={tipoInicio === 'plantilla'}
                                        onChange={(e) => setTipoInicio(e.target.value)}
                                        className={estilos.radio}
                                    />
                                    <span className={estilos.radioText}>
                                        <ion-icon name="copy-outline"></ion-icon>
                                        Usar plantilla
                                    </span>
                                    <span className={estilos.radioHelp}>
                                        Ahorra tiempo usando una estructura preconfigurada
                                    </span>
                                </label>
                            </div>
                        </div>

                        {tipoInicio === 'plantilla' && (
                            <div className={estilos.grupo}>
                                <div className={estilos.labelRow}>
                                    <label className={estilos.label}>
                                        Seleccionar Plantilla <span className={estilos.requerido}>*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/admin/proyectos/plantillas')}
                                        className={estilos.btnLink}
                                        title="Gestionar plantillas"
                                    >
                                        <ion-icon name="layers-outline"></ion-icon>
                                        <span>Gestionar Plantillas</span>
                                    </button>
                                </div>
                                <span className={estilos.helpText}>
                                    Selecciona una plantilla para crear la estructura base del proyecto
                                </span>
                                <select
                                    name="plantilla_id"
                                    value={plantillaId}
                                    onChange={(e) => setPlantillaId(e.target.value)}
                                    className={estilos.select}
                                    required={tipoInicio === 'plantilla'}
                                >
                                    <option value="">Seleccionar plantilla...</option>
                                    {plantillas.map(plantilla => (
                                        <option key={plantilla.id} value={plantilla.id}>
                                            {plantilla.nombre} {plantilla.descripcion ? `- ${plantilla.descripcion}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {plantillas.length === 0 && (
                                    <div className={estilos.helpBox}>
                                        <ion-icon name="information-circle-outline"></ion-icon>
                                        <div>
                                            <p>No hay plantillas disponibles. Se creará un proyecto vacío.</p>
                                            <button
                                                type="button"
                                                onClick={() => router.push('/admin/proyectos/plantillas/nuevo')}
                                                className={estilos.btnLinkInline}
                                            >
                                                Crear tu primera plantilla
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Información General */}
                <section className={estilos.seccion}>
                    <div 
                        className={estilos.seccionHeader}
                        onClick={() => toggleSeccion('general')}
                    >
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="document-text-outline"></ion-icon>
                            Información General
                        </h2>
                        <ion-icon 
                            name={seccionesAbiertas.general ? "chevron-up-outline" : "chevron-down-outline"}
                            className={`${estilos.seccionIcono} ${seccionesAbiertas.general ? estilos.abierto : ''}`}
                        ></ion-icon>
                    </div>
                    <div className={`${estilos.seccionBody} ${!seccionesAbiertas.general ? estilos.oculto : ''}`}>
                    
                    <div className={estilos.grupo}>
                        <label className={estilos.label}>
                            Nombre del Proyecto <span className={estilos.requerido}>*</span>
                        </label>
                        <span className={estilos.helpText}>Nombre descriptivo del proyecto</span>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={getFieldClassName('nombre')}
                            placeholder="Ej: Reforma Integral Casa Pérez"
                            maxLength={255}
                        />
                        {errors.nombre && touched.nombre && (
                            <span className={estilos.error}>{errors.nombre}</span>
                        )}
                        {formData.nombre && (
                            <span className={estilos.contador}>{formData.nombre.length}/255</span>
                        )}
                    </div>

                    <div className={estilos.grupo}>
                        <label className={estilos.label}>Descripción</label>
                        <span className={estilos.helpText}>Descripción detallada del proyecto</span>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={estilos.textarea}
                            rows="4"
                            placeholder="Descripción detallada del proyecto..."
                            maxLength={5000}
                        />
                        <div className={estilos.contador}>
                            {formData.descripcion.length} / 5000 caracteres
                        </div>
                        {errors.descripcion && touched.descripcion && (
                            <span className={estilos.error}>{errors.descripcion}</span>
                        )}
                    </div>
                    </div>
                </section>

                {/* Cliente y Responsable */}
                <section className={estilos.seccion}>
                    <div 
                        className={estilos.seccionHeader}
                        onClick={() => toggleSeccion('cliente')}
                    >
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="people-outline"></ion-icon>
                            Cliente y Responsable
                        </h2>
                        <ion-icon 
                            name={seccionesAbiertas.cliente ? "chevron-up-outline" : "chevron-down-outline"}
                            className={`${estilos.seccionIcono} ${seccionesAbiertas.cliente ? estilos.abierto : ''}`}
                        ></ion-icon>
                    </div>
                    <div className={`${estilos.seccionBody} ${!seccionesAbiertas.cliente ? estilos.oculto : ''}`}>
                    
                    <div className={estilos.grid}>
                        <div className={estilos.grupo}>
                            <label className={estilos.label}>Cliente</label>
                            <span className={estilos.helpText}>Cliente asociado al proyecto</span>
                            <AutocompleteCliente
                                value={formData.cliente_nombre}
                                onChange={(valor) => setFormData(prev => ({ ...prev, cliente_nombre: valor }))}
                                onSelect={handleClienteSelect}
                                placeholder="Buscar cliente..."
                                error={errors.cliente_id && touched.cliente_id ? errors.cliente_id : null}
                            />
                        </div>

                        <div className={estilos.grupo}>
                            <label className={estilos.label}>Responsable</label>
                            <span className={estilos.helpText}>Usuario responsable del proyecto</span>
                            <select
                                name="usuario_responsable_id"
                                value={formData.usuario_responsable_id}
                                onChange={handleChange}
                                className={estilos.select}
                            >
                                <option value="">Seleccionar responsable...</option>
                                {usuarios.map(usuario => (
                                    <option key={usuario.id} value={usuario.id}>
                                        {usuario.nombre} {usuario.email ? `(${usuario.email})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    </div>
                </section>

                {/* Fechas y Estado */}
                <section className={estilos.seccion}>
                    <div 
                        className={estilos.seccionHeader}
                        onClick={() => toggleSeccion('fechas')}
                    >
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="calendar-outline"></ion-icon>
                            Fechas y Estado
                        </h2>
                        <ion-icon 
                            name={seccionesAbiertas.fechas ? "chevron-up-outline" : "chevron-down-outline"}
                            className={`${estilos.seccionIcono} ${seccionesAbiertas.fechas ? estilos.abierto : ''}`}
                        ></ion-icon>
                    </div>
                    <div className={`${estilos.seccionBody} ${!seccionesAbiertas.fechas ? estilos.oculto : ''}`}>
                    
                    <div className={estilos.grid}>
                        <div className={estilos.grupo}>
                            <label className={estilos.label}>
                                Fecha de Inicio <span className={estilos.requerido}>*</span>
                            </label>
                            <span className={estilos.helpText}>Fecha de inicio del proyecto</span>
                            <div className={estilos.inputGroup}>
                                <input
                                    type="date"
                                    name="fecha_inicio"
                                    value={formData.fecha_inicio}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={getFieldClassName('fecha_inicio')}
                                />
                                <button
                                    type="button"
                                    onClick={aplicarFechaHoy}
                                    className={estilos.btnAccion}
                                    title="Usar fecha de hoy"
                                >
                                    Hoy
                                </button>
                            </div>
                            {errors.fecha_inicio && touched.fecha_inicio && (
                                <span className={estilos.error}>{errors.fecha_inicio}</span>
                            )}
                        </div>

                        <div className={estilos.grupo}>
                            <label className={estilos.label}>
                                Fecha de Fin Estimada <span className={estilos.requerido}>*</span>
                            </label>
                            <span className={estilos.helpText}>Fecha estimada de finalización</span>
                            <input
                                type="date"
                                name="fecha_fin_estimada"
                                value={formData.fecha_fin_estimada}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={getFieldClassName('fecha_fin_estimada')}
                                min={formData.fecha_inicio || undefined}
                            />
                            {errors.fecha_fin_estimada && touched.fecha_fin_estimada && (
                                <span className={estilos.error}>{errors.fecha_fin_estimada}</span>
                            )}
                            {formData.fecha_inicio && !formData.fecha_fin_estimada && (
                                <span className={estilos.ayuda}>
                                    Se sugerirá automáticamente basado en proyectos similares ({estadisticas.duracionPromedioDias} días)
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={estilos.grid}>
                        <div className={estilos.grupo}>
                            <label className={estilos.label}>Estado</label>
                            <span className={estilos.helpText}>Estado actual del proyecto</span>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                className={estilos.select}
                            >
                                {ESTADOS_PROYECTO.map(estado => (
                                    <option key={estado.value} value={estado.value}>
                                        {estado.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={estilos.grupo}>
                            <label className={estilos.label}>Prioridad</label>
                            <span className={estilos.helpText}>Nivel de prioridad del proyecto</span>
                            <select
                                name="prioridad"
                                value={formData.prioridad}
                                onChange={handleChange}
                                className={estilos.select}
                            >
                                {PRIORIDADES.map(prioridad => (
                                    <option key={prioridad.value} value={prioridad.value}>
                                        {prioridad.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    </div>
                </section>

                {/* Presupuesto y Ubicación */}
                <section className={estilos.seccion}>
                    <div 
                        className={estilos.seccionHeader}
                        onClick={() => toggleSeccion('presupuesto')}
                    >
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="cash-outline"></ion-icon>
                            Presupuesto y Ubicación
                        </h2>
                        <ion-icon 
                            name={seccionesAbiertas.presupuesto ? "chevron-up-outline" : "chevron-down-outline"}
                            className={`${estilos.seccionIcono} ${seccionesAbiertas.presupuesto ? estilos.abierto : ''}`}
                        ></ion-icon>
                    </div>
                    <div className={`${estilos.seccionBody} ${!seccionesAbiertas.presupuesto ? estilos.oculto : ''}`}>
                    
                    <div className={estilos.grid}>
                        <div className={estilos.grupo}>
                            <label className={estilos.label}>Presupuesto Total</label>
                            <span className={estilos.helpText}>Presupuesto total del proyecto</span>
                            <div className={estilos.inputGroup}>
                                <input
                                    type="number"
                                    name="presupuesto_total"
                                    value={formData.presupuesto_total}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={getFieldClassName('presupuesto_total')}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                                {estadisticas.presupuestoPromedio > 0 && (
                                    <button
                                        type="button"
                                        onClick={sugerirPresupuesto}
                                        className={estilos.btnAccion}
                                        title={`Usar promedio: ${estadisticas.presupuestoPromedio.toFixed(2)}`}
                                    >
                                        Sugerir
                                    </button>
                                )}
                            </div>
                            {errors.presupuesto_total && touched.presupuesto_total && (
                                <span className={estilos.error}>{errors.presupuesto_total}</span>
                            )}
                            {estadisticas.presupuestoPromedio > 0 && (
                                <span className={estilos.ayuda}>
                                    Presupuesto promedio: {estadisticas.presupuestoPromedio.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                </span>
                            )}
                        </div>

                        <div className={estilos.grupo}>
                            <label className={estilos.label}>Ubicación</label>
                            <span className={estilos.helpText}>Ubicación general del proyecto</span>
                            <input
                                type="text"
                                name="ubicacion"
                                value={formData.ubicacion}
                                onChange={handleChange}
                                className={estilos.input}
                                placeholder="Ubicación general del proyecto"
                                maxLength={500}
                            />
                        </div>
                    </div>

                    <div className={estilos.grupo}>
                        <label className={estilos.label}>Forma de Pago</label>
                        <span className={estilos.helpText}>Método de pago del proyecto</span>
                        <select
                            name="forma_pago"
                            value={formData.forma_pago}
                            onChange={handleChange}
                            className={estilos.select}
                        >
                            {FORMAS_PAGO.map(forma => (
                                <option key={forma.value} value={forma.value}>
                                    {forma.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    </div>
                </section>

                {/* Opciones Avanzadas */}
                <section className={estilos.seccion}>
                    <div 
                        className={estilos.seccionHeader}
                        onClick={() => toggleSeccion('avanzadas')}
                    >
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="settings-outline"></ion-icon>
                            Opciones Avanzadas
                        </h2>
                        <ion-icon 
                            name={seccionesAbiertas.avanzadas ? "chevron-up-outline" : "chevron-down-outline"}
                            className={`${estilos.seccionIcono} ${seccionesAbiertas.avanzadas ? estilos.abierto : ''}`}
                        ></ion-icon>
                    </div>
                    <div className={`${estilos.seccionBody} ${!seccionesAbiertas.avanzadas ? estilos.oculto : ''}`}>
                        <div className={estilos.grupo}>
                            <label className={estilos.label}>Etiquetas</label>
                            <span className={estilos.helpText}>Etiquetas para organizar y buscar proyectos</span>
                            <TagInput
                                value={formData.etiquetas}
                                onChange={handleEtiquetasChange}
                                sugerencias={[...etiquetasExistentes, ...estadisticas.etiquetasFrecuentes]}
                                placeholder="Escribe y presiona Enter para agregar..."
                                maxTags={10}
                            />
                            <span className={estilos.ayuda}>
                                Las etiquetas ayudan a organizar y buscar proyectos fácilmente
                            </span>
                        </div>
                    </div>
                </section>

                {/* Botones de Acción */}
                <div className={estilos.acciones}>
                    <button 
                        type="button" 
                        onClick={() => router.back()} 
                        className={estilos.btnCancelar}
                        disabled={procesando}
                    >
                        <ion-icon name="close-outline"></ion-icon>
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={procesando} 
                        className={estilos.btnGuardar}
                    >
                        {procesando ? (
                            <>
                                <ion-icon name="hourglass-outline"></ion-icon>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                Crear Proyecto
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
