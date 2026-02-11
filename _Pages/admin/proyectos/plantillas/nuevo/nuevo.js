"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { crearPlantilla, actualizarPlantilla, obtenerPlantillaPorId } from '../../servidor'
import { obtenerObrasPlantilla } from '../../../obras/servidor'
import estilos from './nuevo.module.css'

const TIPOS_PLANTILLA = [
    { value: 'vivienda', label: 'Vivienda', icon: 'home-outline' },
    { value: 'comercial', label: 'Comercial', icon: 'business-outline' },
    { value: 'servicios', label: 'Servicios', icon: 'construct-outline' },
    { value: 'vacio', label: 'Vacío', icon: 'document-outline' },
    { value: 'otro', label: 'Otro', icon: 'folder-outline' }
]

const TIPOS_OBRA = [
    { value: 'construccion', label: 'Construcción' },
    { value: 'remodelacion', label: 'Remodelación' },
    { value: 'reparacion', label: 'Reparación' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'servicio', label: 'Servicio' },
    { value: 'otro', label: 'Otro' }
]

function EditorPlantilla() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const esEdicion = searchParams.get('editar') === 'true'
    const plantillaId = searchParams.get('id')

    // Estado principal
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        tipo_plantilla: 'otro',
        estructura_json: {
            configuracion: {
                crear_presupuesto_proyecto: true,
                crear_obras: true,
                crear_servicios: true,
                moneda: 'DOP',
                impuesto_defecto: 18
            },
            obras: [],
            servicios_proyecto: [],
            presupuesto_proyecto: null
        }
    })

    const [errors, setErrors] = useState({})
    const [procesando, setProcesando] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [tema, setTema] = useState('light')
    
    // Estados para obras plantilla
    const [obrasPlantilla, setObrasPlantilla] = useState([])
    const [cargandoPlantillas, setCargandoPlantillas] = useState(false)
    const [mostrarModalObraPlantilla, setMostrarModalObraPlantilla] = useState(false)

    // Estados para el editor
    const [obraSeleccionada, setObraSeleccionada] = useState(null)
    const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null)
    const [capituloSeleccionado, setCapituloSeleccionado] = useState(null)

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

    useEffect(() => {
        cargarObrasPlantilla()
        if (esEdicion && plantillaId) {
            cargarPlantilla()
        } else {
            setCargando(false)
        }
    }, [esEdicion, plantillaId])
    
    async function cargarObrasPlantilla() {
        setCargandoPlantillas(true)
        try {
            const res = await obtenerObrasPlantilla()
            if (res.success) {
                setObrasPlantilla(res.obras || [])
            }
        } catch (error) {
            console.error('Error al cargar obras plantilla:', error)
        } finally {
            setCargandoPlantillas(false)
        }
    }

    async function cargarPlantilla() {
        try {
            const res = await obtenerPlantillaPorId(plantillaId)
            if (res.success && res.plantilla) {
                setFormData({
                    nombre: res.plantilla.nombre || '',
                    descripcion: res.plantilla.descripcion || '',
                    tipo_plantilla: res.plantilla.tipo_plantilla || 'otro',
                    estructura_json: res.plantilla.estructura_json || { obras: [] }
                })
            }
        } catch (error) {
            console.error('Error al cargar plantilla:', error)
        } finally {
            setCargando(false)
        }
    }

    // ============================================
    // GESTIÓN DE OBRAS
    // ============================================

    function agregarObra(obraPlantillaId = null) {
        let nuevaObra
        
        if (obraPlantillaId) {
            // Agregar desde obra plantilla
            const obraPlantilla = obrasPlantilla.find(o => o.id === obraPlantillaId)
            if (obraPlantilla) {
                nuevaObra = {
                    obra_plantilla_id: obraPlantillaId,
                    nombre: obraPlantilla.nombre,
                    descripcion: obraPlantilla.descripcion || '',
                    tipo_obra: obraPlantilla.tipo_obra || 'construccion',
                    servicios: [],
                    presupuesto: null
                }
            } else {
                nuevaObra = {
                    nombre: 'Nueva Obra',
                    tipo_obra: 'construccion',
                    descripcion: '',
                    servicios: [],
                    presupuesto: null
                }
            }
        } else {
            // Agregar obra nueva
            nuevaObra = {
                nombre: 'Nueva Obra',
                tipo_obra: 'construccion',
                descripcion: '',
                servicios: [],
                presupuesto: null
            }
        }

        setFormData(prev => ({
            ...prev,
            estructura_json: {
                ...prev.estructura_json,
                obras: [...(prev.estructura_json.obras || []), nuevaObra]
            }
        }))

        setObraSeleccionada(formData.estructura_json.obras.length)
        setMostrarModalObraPlantilla(false)
    }

    function eliminarObra(index) {
        if (!confirm('¿Estás seguro de eliminar esta obra y todos sus presupuestos?')) {
            return
        }

        const nuevasObras = formData.estructura_json.obras.filter((_, i) => i !== index)
        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))

        if (obraSeleccionada === index) {
            setObraSeleccionada(null)
            setPresupuestoSeleccionado(null)
            setCapituloSeleccionado(null)
        } else if (obraSeleccionada > index) {
            setObraSeleccionada(obraSeleccionada - 1)
        }
    }

    function actualizarObra(index, campo, valor) {
        const nuevasObras = [...formData.estructura_json.obras]
        nuevasObras[index] = { ...nuevasObras[index], [campo]: valor }
        
        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))
    }

    // ============================================
    // GESTIÓN DE PRESUPUESTOS
    // ============================================

    function agregarPresupuesto(obraIndex) {
        const nuevoPresupuesto = {
            nombre: 'Presupuesto Inicial',
            descripcion: '',
            capitulos: []
        }

        const nuevasObras = [...formData.estructura_json.obras]
        // Usar presupuesto (singular) según nueva estructura
        if (!nuevasObras[obraIndex].presupuesto) {
            nuevasObras[obraIndex].presupuesto = nuevoPresupuesto
        } else {
            // Si ya existe, convertir a array para compatibilidad
            if (!Array.isArray(nuevasObras[obraIndex].presupuestos)) {
                nuevasObras[obraIndex].presupuestos = [nuevasObras[obraIndex].presupuesto]
            }
            nuevasObras[obraIndex].presupuestos = [
                ...(nuevasObras[obraIndex].presupuestos || []),
                nuevoPresupuesto
            ]
        }

        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))

        const presupuestos = Array.isArray(nuevasObras[obraIndex].presupuestos) 
            ? nuevasObras[obraIndex].presupuestos 
            : [nuevasObras[obraIndex].presupuesto]
        setPresupuestoSeleccionado({ obraIndex, presupuestoIndex: presupuestos.length - 1 })
    }

    function eliminarPresupuesto(obraIndex, presupuestoIndex) {
        if (!confirm('¿Estás seguro de eliminar este presupuesto y todos sus capítulos?')) {
            return
        }

        const nuevasObras = [...formData.estructura_json.obras]
        nuevasObras[obraIndex].presupuestos = nuevasObras[obraIndex].presupuestos.filter((_, i) => i !== presupuestoIndex)

        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))

        if (presupuestoSeleccionado?.obraIndex === obraIndex && presupuestoSeleccionado?.presupuestoIndex === presupuestoIndex) {
            setPresupuestoSeleccionado(null)
            setCapituloSeleccionado(null)
        }
    }

    function actualizarPresupuesto(obraIndex, presupuestoIndex, campo, valor) {
        const nuevasObras = [...formData.estructura_json.obras]
        nuevasObras[obraIndex].presupuestos[presupuestoIndex] = {
            ...nuevasObras[obraIndex].presupuestos[presupuestoIndex],
            [campo]: valor
        }

        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))
    }

    // ============================================
    // GESTIÓN DE CAPÍTULOS
    // ============================================

    function agregarCapitulo(obraIndex, presupuestoIndex) {
        const nuevoCapitulo = {
            codigo: '',
            nombre: 'Nuevo Capítulo',
            descripcion: '',
            orden: (formData.estructura_json.obras[obraIndex].presupuestos[presupuestoIndex].capitulos?.length || 0) + 1,
            tareas: []
        }

        const nuevasObras = [...formData.estructura_json.obras]
        nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos = [
            ...(nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos || []),
            nuevoCapitulo
        ]

        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))

        setCapituloSeleccionado({ obraIndex, presupuestoIndex, capituloIndex: nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos.length - 1 })
    }

    function eliminarCapitulo(obraIndex, presupuestoIndex, capituloIndex) {
        if (!confirm('¿Estás seguro de eliminar este capítulo y todas sus tareas?')) {
            return
        }

        const nuevasObras = [...formData.estructura_json.obras]
        nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos = 
            nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos.filter((_, i) => i !== capituloIndex)

        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))

        if (capituloSeleccionado?.obraIndex === obraIndex && 
            capituloSeleccionado?.presupuestoIndex === presupuestoIndex && 
            capituloSeleccionado?.capituloIndex === capituloIndex) {
            setCapituloSeleccionado(null)
        }
    }

    function actualizarCapitulo(obraIndex, presupuestoIndex, capituloIndex, campo, valor) {
        const nuevasObras = [...formData.estructura_json.obras]
        nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex] = {
            ...nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex],
            [campo]: valor
        }

        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))
    }

    // ============================================
    // GESTIÓN DE TAREAS
    // ============================================

    function agregarTarea(obraIndex, presupuestoIndex, capituloIndex) {
        const nuevaTarea = {
            codigo: '',
            nombre: 'Nueva Tarea',
            descripcion: '',
            unidad_medida: 'unidad',
            cantidad: 1.000,
            precio_unitario_coste: 0.00,
            precio_unitario_venta: 0.00,
            margen_porcentaje: 0.00,
            descuento: 0.00,
            impuestos: 0.00,
            orden: (formData.estructura_json.obras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex].tareas?.length || 0) + 1
        }

        const nuevasObras = [...formData.estructura_json.obras]
        nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex].tareas = [
            ...(nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex].tareas || []),
            nuevaTarea
        ]

        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))
    }

    function eliminarTarea(obraIndex, presupuestoIndex, capituloIndex, tareaIndex) {
        const nuevasObras = [...formData.estructura_json.obras]
        nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex].tareas = 
            nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex].tareas.filter((_, i) => i !== tareaIndex)

        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))
    }

    function actualizarTarea(obraIndex, presupuestoIndex, capituloIndex, tareaIndex, campo, valor) {
        const nuevasObras = [...formData.estructura_json.obras]
        const tarea = nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex].tareas[tareaIndex]
        
        nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex].tareas[tareaIndex] = {
            ...tarea,
            [campo]: valor
        }

        // Calcular totales si cambian cantidad o precios
        if (['cantidad', 'precio_unitario_coste', 'precio_unitario_venta'].includes(campo)) {
            const cantidad = parseFloat(nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex].tareas[tareaIndex].cantidad || 1)
            const precioCoste = parseFloat(nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex].tareas[tareaIndex].precio_unitario_coste || 0)
            const precioVenta = parseFloat(nuevasObras[obraIndex].presupuestos[presupuestoIndex].capitulos[capituloIndex].tareas[tareaIndex].precio_unitario_venta || 0)
            
            // Los totales se calcularán en el backend, aquí solo actualizamos los valores base
        }

        setFormData(prev => ({
            ...prev,
            estructura_json: { obras: nuevasObras }
        }))
    }

    // ============================================
    // VALIDACIÓN Y ENVÍO
    // ============================================

    function validarFormulario() {
        const nuevosErrores = {}

        if (!formData.nombre || formData.nombre.trim() === '') {
            nuevosErrores.nombre = 'El nombre de la plantilla es obligatorio'
        }

        // Validar que tenga al menos una obra o servicio
        const tieneObras = formData.estructura_json.obras && formData.estructura_json.obras.length > 0
        const tieneServicios = formData.estructura_json.servicios_proyecto && formData.estructura_json.servicios_proyecto.length > 0
        
        if (!tieneObras && !tieneServicios) {
            nuevosErrores.estructura = 'Debe tener al menos una obra o servicio'
        }

        // Validar obras
        if (formData.estructura_json.obras) {
            formData.estructura_json.obras.forEach((obra, obraIndex) => {
                if (!obra.nombre || obra.nombre.trim() === '') {
                    nuevosErrores[`obra_${obraIndex}_nombre`] = 'El nombre de la obra es obligatorio'
                }
                // Presupuesto es opcional en nueva estructura
            })
        }

        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (!validarFormulario()) {
            alert('Por favor, corrige los errores en el formulario')
            return
        }

        setProcesando(true)
        try {
            let res
            if (esEdicion && plantillaId) {
                res = await actualizarPlantilla(plantillaId, formData)
            } else {
                res = await crearPlantilla(formData)
            }

            if (res.success) {
                router.push('/admin/proyectos/plantillas')
            } else {
                alert(res.mensaje || 'Error al guardar plantilla')
                if (res.errores) {
                    setErrors(res.errores)
                }
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al procesar la solicitud. Por favor, intente nuevamente.')
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <p>Cargando plantilla...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="layers-outline"></ion-icon>
                        {esEdicion ? 'Editar Plantilla' : 'Nueva Plantilla'}
                    </h1>
                    <p className={estilos.subtitulo}>
                        Diseña la estructura de obras, presupuestos, capítulos y tareas
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

            <form onSubmit={handleSubmit} className={estilos.formulario}>
                {/* Información Básica */}
                <section className={estilos.seccion}>
                    <h2 className={estilos.seccionTitulo}>
                        <ion-icon name="information-circle-outline"></ion-icon>
                        Información Básica
                    </h2>
                    <div className={estilos.seccionBody}>
                        <div className={estilos.grupo}>
                            <label className={estilos.label}>
                                Nombre de la Plantilla <span className={estilos.requerido}>*</span>
                            </label>
                            <span className={estilos.helpText}>Nombre descriptivo de la plantilla</span>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                                className={`${estilos.input} ${errors.nombre ? estilos.inputError : ''}`}
                                placeholder="Ej: Vivienda Unifamiliar"
                                maxLength={255}
                            />
                            {errors.nombre && <span className={estilos.error}>{errors.nombre}</span>}
                        </div>

                        <div className={estilos.grupo}>
                            <label className={estilos.label}>Descripción</label>
                            <span className={estilos.helpText}>Descripción de la plantilla y su uso</span>
                            <textarea
                                value={formData.descripcion}
                                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                                className={estilos.textarea}
                                rows="3"
                                placeholder="Describe para qué tipo de proyectos se usa esta plantilla..."
                            />
                        </div>

                        <div className={estilos.grupo}>
                            <label className={estilos.label}>Tipo de Plantilla</label>
                            <span className={estilos.helpText}>Categoría de la plantilla</span>
                            <select
                                value={formData.tipo_plantilla}
                                onChange={(e) => setFormData(prev => ({ ...prev, tipo_plantilla: e.target.value }))}
                                className={estilos.select}
                            >
                                {TIPOS_PLANTILLA.map(tipo => (
                                    <option key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Editor de Estructura */}
                <section className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="construct-outline"></ion-icon>
                            Estructura de la Plantilla
                        </h2>
                        <div className={estilos.btnGroup}>
                            <button
                                type="button"
                                onClick={() => setMostrarModalObraPlantilla(true)}
                                className={estilos.btnAgregarSecundario}
                                title="Agregar desde obra plantilla"
                            >
                                <ion-icon name="copy-outline"></ion-icon>
                                Desde Plantilla
                            </button>
                            <button
                                type="button"
                                onClick={() => agregarObra()}
                                className={estilos.btnAgregar}
                            >
                                <ion-icon name="add-outline"></ion-icon>
                                Nueva Obra
                            </button>
                        </div>
                    </div>
                    
                    {/* Modal para seleccionar obra plantilla */}
                    {mostrarModalObraPlantilla && (
                        <div className={estilos.modalOverlay} onClick={() => setMostrarModalObraPlantilla(false)}>
                            <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                                <div className={estilos.modalHeader}>
                                    <h3>Seleccionar Obra Plantilla</h3>
                                    <button
                                        type="button"
                                        onClick={() => setMostrarModalObraPlantilla(false)}
                                        className={estilos.btnCerrar}
                                    >
                                        <ion-icon name="close-outline"></ion-icon>
                                    </button>
                                </div>
                                <div className={estilos.modalBody}>
                                    {cargandoPlantillas ? (
                                        <div className={estilos.cargando}>Cargando plantillas...</div>
                                    ) : obrasPlantilla.length === 0 ? (
                                        <div className={estilos.sinPlantillas}>
                                            <ion-icon name="information-circle-outline"></ion-icon>
                                            <p>No hay obras plantilla disponibles. Crea una obra nueva o guarda una obra existente como plantilla.</p>
                                        </div>
                                    ) : (
                                        <div className={estilos.listaPlantillas}>
                                            {obrasPlantilla.map(obra => (
                                                <div
                                                    key={obra.id}
                                                    className={estilos.itemPlantilla}
                                                    onClick={() => {
                                                        agregarObra(obra.id)
                                                    }}
                                                >
                                                    <div className={estilos.itemHeader}>
                                                        <h4>{obra.nombre}</h4>
                                                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                                                    </div>
                                                    {obra.descripcion && (
                                                        <p className={estilos.itemDescripcion}>{obra.descripcion}</p>
                                                    )}
                                                    <div className={estilos.itemInfo}>
                                                        <span className={estilos.badge}>{obra.tipo_obra}</span>
                                                        {obra.presupuesto_aprobado > 0 && (
                                                            <span className={estilos.presupuesto}>
                                                                RD$ {parseFloat(obra.presupuesto_aprobado).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={estilos.seccionBody}>
                        {errors.estructura && (
                            <div className={estilos.errorGlobal}>
                                <ion-icon name="alert-circle-outline"></ion-icon>
                                {errors.estructura}
                            </div>
                        )}

                        {formData.estructura_json.obras.length === 0 ? (
                            <div className={estilos.vacio}>
                                <ion-icon name="construct-outline"></ion-icon>
                                <p>No hay obras en la plantilla</p>
                                <p className={estilos.helpText}>Agrega al menos una obra para comenzar</p>
                            </div>
                        ) : (
                            <div className={estilos.estructura}>
                                {formData.estructura_json.obras.map((obra, obraIndex) => (
                                    <div key={obraIndex} className={estilos.obraCard}>
                                        <div className={estilos.obraHeader}>
                                            <div className={estilos.obraTitulo}>
                                                <input
                                                    type="text"
                                                    value={obra.nombre}
                                                    onChange={(e) => actualizarObra(obraIndex, 'nombre', e.target.value)}
                                                    className={`${estilos.inputInline} ${errors[`obra_${obraIndex}_nombre`] ? estilos.inputError : ''}`}
                                                    placeholder="Nombre de la obra"
                                                />
                                                {errors[`obra_${obraIndex}_nombre`] && (
                                                    <span className={estilos.error}>{errors[`obra_${obraIndex}_nombre`]}</span>
                                                )}
                                            </div>
                                            <div className={estilos.obraAcciones}>
                                                <select
                                                    value={obra.tipo_obra || 'construccion'}
                                                    onChange={(e) => actualizarObra(obraIndex, 'tipo_obra', e.target.value)}
                                                    className={estilos.selectInline}
                                                >
                                                    {TIPOS_OBRA.map(tipo => (
                                                        <option key={tipo.value} value={tipo.value}>
                                                            {tipo.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarObra(obraIndex)}
                                                    className={estilos.btnEliminar}
                                                    title="Eliminar obra"
                                                >
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                </button>
                                            </div>
                                        </div>

                                        {obra.descripcion !== undefined && (
                                            <textarea
                                                value={obra.descripcion || ''}
                                                onChange={(e) => actualizarObra(obraIndex, 'descripcion', e.target.value)}
                                                className={estilos.textareaInline}
                                                placeholder="Descripción de la obra (opcional)"
                                                rows="2"
                                            />
                                        )}

                                        {/* Presupuestos */}
                                        <div className={estilos.presupuestos}>
                                            <div className={estilos.presupuestosHeader}>
                                                <h3 className={estilos.subtitulo}>
                                                    <ion-icon name="document-text-outline"></ion-icon>
                                                    Presupuestos
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => agregarPresupuesto(obraIndex)}
                                                    className={estilos.btnAgregarSmall}
                                                >
                                                    <ion-icon name="add-outline"></ion-icon>
                                                    Agregar Presupuesto
                                                </button>
                                            </div>

                                            {errors[`obra_${obraIndex}_presupuestos`] && (
                                                <span className={estilos.error}>{errors[`obra_${obraIndex}_presupuestos`]}</span>
                                            )}

                                            {(!obra.presupuestos || obra.presupuestos.length === 0) ? (
                                                <div className={estilos.vacioSmall}>
                                                    <p>No hay presupuestos. Agrega uno para comenzar.</p>
                                                </div>
                                            ) : (
                                                obra.presupuestos.map((presupuesto, presupuestoIndex) => (
                                                    <div key={presupuestoIndex} className={estilos.presupuestoCard}>
                                                        <div className={estilos.presupuestoHeader}>
                                                            <input
                                                                type="text"
                                                                value={presupuesto.nombre}
                                                                onChange={(e) => actualizarPresupuesto(obraIndex, presupuestoIndex, 'nombre', e.target.value)}
                                                                className={estilos.inputInline}
                                                                placeholder="Nombre del presupuesto"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => eliminarPresupuesto(obraIndex, presupuestoIndex)}
                                                                className={estilos.btnEliminar}
                                                                title="Eliminar presupuesto"
                                                            >
                                                                <ion-icon name="trash-outline"></ion-icon>
                                                            </button>
                                                        </div>

                                                        {/* Capítulos */}
                                                        <div className={estilos.capitulos}>
                                                            <div className={estilos.capitulosHeader}>
                                                                <h4 className={estilos.subtituloSmall}>
                                                                    <ion-icon name="folder-outline"></ion-icon>
                                                                    Capítulos
                                                                </h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => agregarCapitulo(obraIndex, presupuestoIndex)}
                                                                    className={estilos.btnAgregarSmall}
                                                                >
                                                                    <ion-icon name="add-outline"></ion-icon>
                                                                    Agregar Capítulo
                                                                </button>
                                                            </div>

                                                            {(!presupuesto.capitulos || presupuesto.capitulos.length === 0) ? (
                                                                <div className={estilos.vacioSmall}>
                                                                    <p>No hay capítulos. Agrega uno para comenzar.</p>
                                                                </div>
                                                            ) : (
                                                                presupuesto.capitulos.map((capitulo, capituloIndex) => (
                                                                    <div key={capituloIndex} className={estilos.capituloCard}>
                                                                        <div className={estilos.capituloHeader}>
                                                                            <div className={estilos.capituloInputs}>
                                                                                <input
                                                                                    type="text"
                                                                                    value={capitulo.codigo || ''}
                                                                                    onChange={(e) => actualizarCapitulo(obraIndex, presupuestoIndex, capituloIndex, 'codigo', e.target.value)}
                                                                                    className={`${estilos.inputCodigo} ${estilos.inputInline}`}
                                                                                    placeholder="Código (ej: 01)"
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    value={capitulo.nombre}
                                                                                    onChange={(e) => actualizarCapitulo(obraIndex, presupuestoIndex, capituloIndex, 'nombre', e.target.value)}
                                                                                    className={`${estilos.inputNombre} ${estilos.inputInline}`}
                                                                                    placeholder="Nombre del capítulo"
                                                                                />
                                                                                <input
                                                                                    type="number"
                                                                                    value={capitulo.orden || 0}
                                                                                    onChange={(e) => actualizarCapitulo(obraIndex, presupuestoIndex, capituloIndex, 'orden', parseInt(e.target.value) || 0)}
                                                                                    className={`${estilos.inputOrden} ${estilos.inputInline}`}
                                                                                    placeholder="Orden"
                                                                                    min="0"
                                                                                />
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => eliminarCapitulo(obraIndex, presupuestoIndex, capituloIndex)}
                                                                                className={estilos.btnEliminar}
                                                                                title="Eliminar capítulo"
                                                                            >
                                                                                <ion-icon name="trash-outline"></ion-icon>
                                                                            </button>
                                                                        </div>

                                                                        {/* Tareas */}
                                                                        <div className={estilos.tareas}>
                                                                            <div className={estilos.tareasHeader}>
                                                                                <h5 className={estilos.subtituloSmall}>
                                                                                    <ion-icon name="list-outline"></ion-icon>
                                                                                    Tareas
                                                                                </h5>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => agregarTarea(obraIndex, presupuestoIndex, capituloIndex)}
                                                                                    className={estilos.btnAgregarSmall}
                                                                                >
                                                                                    <ion-icon name="add-outline"></ion-icon>
                                                                                    Agregar Tarea
                                                                                </button>
                                                                            </div>

                                                                            {(!capitulo.tareas || capitulo.tareas.length === 0) ? (
                                                                                <div className={estilos.vacioSmall}>
                                                                                    <p>No hay tareas. Agrega una para comenzar.</p>
                                                                                </div>
                                                                            ) : (
                                                                                <div className={estilos.tablaTareas}>
                                                                                    <table className={estilos.tabla}>
                                                                                        <thead>
                                                                                            <tr>
                                                                                                <th>Código</th>
                                                                                                <th>Nombre</th>
                                                                                                <th>Unidad</th>
                                                                                                <th>Cantidad</th>
                                                                                                <th>Precio Venta</th>
                                                                                                <th>Acciones</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            {capitulo.tareas.map((tarea, tareaIndex) => (
                                                                                                <tr key={tareaIndex}>
                                                                                                    <td>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={tarea.codigo || ''}
                                                                                                            onChange={(e) => actualizarTarea(obraIndex, presupuestoIndex, capituloIndex, tareaIndex, 'codigo', e.target.value)}
                                                                                                            className={estilos.inputTabla}
                                                                                                            placeholder="01.01"
                                                                                                        />
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={tarea.nombre}
                                                                                                            onChange={(e) => actualizarTarea(obraIndex, presupuestoIndex, capituloIndex, tareaIndex, 'nombre', e.target.value)}
                                                                                                            className={estilos.inputTabla}
                                                                                                            placeholder="Nombre de la tarea"
                                                                                                            required
                                                                                                        />
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={tarea.unidad_medida}
                                                                                                            onChange={(e) => actualizarTarea(obraIndex, presupuestoIndex, capituloIndex, tareaIndex, 'unidad_medida', e.target.value)}
                                                                                                            className={estilos.inputTabla}
                                                                                                            placeholder="m², m³, unidad"
                                                                                                            required
                                                                                                        />
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            step="0.001"
                                                                                                            value={tarea.cantidad || 1}
                                                                                                            onChange={(e) => actualizarTarea(obraIndex, presupuestoIndex, capituloIndex, tareaIndex, 'cantidad', parseFloat(e.target.value) || 1)}
                                                                                                            className={estilos.inputTabla}
                                                                                                            min="0"
                                                                                                        />
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            step="0.01"
                                                                                                            value={tarea.precio_unitario_venta || 0}
                                                                                                            onChange={(e) => actualizarTarea(obraIndex, presupuestoIndex, capituloIndex, tareaIndex, 'precio_unitario_venta', parseFloat(e.target.value) || 0)}
                                                                                                            className={estilos.inputTabla}
                                                                                                            min="0"
                                                                                                        />
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() => eliminarTarea(obraIndex, presupuestoIndex, capituloIndex, tareaIndex)}
                                                                                                            className={estilos.btnEliminarTabla}
                                                                                                            title="Eliminar tarea"
                                                                                                        >
                                                                                                            <ion-icon name="trash-outline"></ion-icon>
                                                                                                        </button>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={procesando} 
                        className={estilos.btnGuardar}
                    >
                        {procesando ? (
                            <>
                                <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <ion-icon name="save-outline"></ion-icon>
                                {esEdicion ? 'Actualizar Plantilla' : 'Crear Plantilla'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default function NuevaPlantilla() {
    return (
        <Suspense fallback={
            <div className={`${estilos.contenedor} ${estilos.light}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <p>Cargando...</p>
                </div>
            </div>
        }>
            <EditorPlantilla />
        </Suspense>
    )
}

