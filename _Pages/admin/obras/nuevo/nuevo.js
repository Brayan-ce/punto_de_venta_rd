"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { crearObra, obtenerRegionesEmpresa } from './servidor'
import { obtenerObrasPlantilla, crearObraDesdePlantilla } from '../servidor'
import { TIPOS_OBRA, formatearTipoObra } from '../../core/construction/estados'
import { 
    HardHat, Hammer, Wrench, Settings, FileText, 
    Building, MapPin, Calendar, Users, DollarSign,
    Camera, Upload, X, Check, ChevronLeft, ChevronRight,
    AlertCircle, FileCheck, Image as ImageIcon
} from 'lucide-react'
import estilos from './nuevo.module.css'

export default function NuevaObra() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [step, setStep] = useState(1)
    const [procesando, setProcesando] = useState(false)
    const [errors, setErrors] = useState({})
    
    // Referencias para inputs de archivos
    const imagenInputRef = useRef(null)
    const documentoInputRef = useRef(null)

    // Estados del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        ubicacion: '',
        zona: '',
        municipio: '',
        provincia: '',
        tipo_obra: TIPOS_OBRA.CONSTRUCCION,
        presupuesto_aprobado: '',
        fecha_inicio: '',
        fecha_fin_estimada: '',
        cliente_id: '',
        responsable_id: '',
        descripcion: '',
        max_trabajadores: 50
    })

    const [imagenes, setImagenes] = useState([])
    const [documentos, setDocumentos] = useState([])
    const [regiones, setRegiones] = useState([])
    
    // Estados para plantillas
    const [tipoCreacion, setTipoCreacion] = useState('vacio') // 'vacio' o 'plantilla'
    const [obrasPlantilla, setObrasPlantilla] = useState([])
    const [obraPlantillaSeleccionada, setObraPlantillaSeleccionada] = useState(null)
    const [cargandoPlantillas, setCargandoPlantillas] = useState(false)

    const zonas = [
        'Zona Norte', 'Zona Sur', 'Zona Este', 'Zona Oeste', 'Zona Centro',
        'Zona Colonial', 'Zona Metropolitana', 'Zona Rural'
    ]

    const tiposObra = [
        { 
            value: TIPOS_OBRA.CONSTRUCCION, 
            label: 'Construcción', 
            Icon: HardHat,
            descripcion: 'Proyectos de construcción nueva',
            tipo: 'construccion'
        },
        { 
            value: TIPOS_OBRA.REMODELACION, 
            label: 'Remodelación', 
            Icon: Hammer,
            descripcion: 'Remodelación y renovación',
            tipo: 'remodelacion'
        },
        { 
            value: TIPOS_OBRA.REPARACION, 
            label: 'Reparación', 
            Icon: Wrench,
            descripcion: 'Reparaciones y mantenimiento correctivo',
            tipo: 'reparacion'
        },
        { 
            value: TIPOS_OBRA.MANTENIMIENTO, 
            label: 'Mantenimiento', 
            Icon: Settings,
            descripcion: 'Mantenimiento preventivo',
            tipo: 'mantenimiento'
        },
        { 
            value: TIPOS_OBRA.OTRO, 
            label: 'Otro', 
            Icon: FileText,
            descripcion: 'Otros tipos de proyecto',
            tipo: 'otro'
        }
    ]

    useEffect(() => {
        cargarRegiones()
        if (tipoCreacion === 'plantilla') {
            cargarObrasPlantilla()
        }
    }, [tipoCreacion])
    
    useEffect(() => {
        // Autocompletar desde plantilla seleccionada
        if (obraPlantillaSeleccionada && tipoCreacion === 'plantilla') {
            setFormData(prev => ({
                ...prev,
                nombre: prev.nombre || obraPlantillaSeleccionada.nombre,
                descripcion: prev.descripcion || obraPlantillaSeleccionada.descripcion || '',
                tipo_obra: obraPlantillaSeleccionada.tipo_obra || TIPOS_OBRA.CONSTRUCCION,
                ubicacion: prev.ubicacion || obraPlantillaSeleccionada.ubicacion || '',
                zona: prev.zona || obraPlantillaSeleccionada.zona || '',
                municipio: prev.municipio || obraPlantillaSeleccionada.municipio || '',
                provincia: prev.provincia || obraPlantillaSeleccionada.provincia || ''
            }))
        }
    }, [obraPlantillaSeleccionada])
    
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

    const cargarRegiones = async () => {
        try {
            const resultado = await obtenerRegionesEmpresa()
            if (resultado.success) {
                setRegiones(resultado.regiones || [])
            }
        } catch (error) {
            console.error('Error al cargar regiones:', error)
        }
    }

    const pasos = [
        { 
            numero: 1, 
            label: 'Información Básica', 
            descripcion: 'Datos generales de la obra',
            icon: Building
        },
        { 
            numero: 2, 
            label: 'Ubicación', 
            descripcion: 'Dirección y localización',
            icon: MapPin
        },
        { 
            numero: 3, 
            label: 'Presupuesto y Fechas', 
            descripcion: 'Planificación temporal y financiera',
            icon: Calendar
        },
        { 
            numero: 4, 
            label: 'Recursos', 
            descripcion: 'Imágenes y documentos',
            icon: ImageIcon
        },
        { 
            numero: 5, 
            label: 'Confirmación', 
            descripcion: 'Revisar y confirmar',
            icon: FileCheck
        }
    ]

    // Cargar tema
    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => setTema(localStorage.getItem('tema') || 'light')

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validateStep = (currentStep) => {
        const newErrors = {}

        if (currentStep === 1) {
            if (!formData.nombre?.trim()) {
                newErrors.nombre = 'El nombre de la obra es obligatorio'
            }
            if (!formData.tipo_obra) {
                newErrors.tipo_obra = 'Seleccione un tipo de obra'
            }
        }

        if (currentStep === 2) {
            if (!formData.ubicacion?.trim()) {
                newErrors.ubicacion = 'La ubicación es obligatoria'
            }
            if (!formData.provincia) {
                newErrors.provincia = 'Seleccione una provincia'
            }
        }

        if (currentStep === 3) {
            if (!formData.presupuesto_aprobado || parseFloat(formData.presupuesto_aprobado) <= 0) {
                newErrors.presupuesto_aprobado = 'El presupuesto debe ser mayor a 0'
            }
            if (!formData.fecha_inicio) {
                newErrors.fecha_inicio = 'La fecha de inicio es obligatoria'
            }
            if (!formData.fecha_fin_estimada) {
                newErrors.fecha_fin_estimada = 'La fecha de fin es obligatoria'
            }
            if (formData.fecha_inicio && formData.fecha_fin_estimada) {
                if (new Date(formData.fecha_fin_estimada) <= new Date(formData.fecha_inicio)) {
                    newErrors.fecha_fin_estimada = 'La fecha de fin debe ser posterior a la de inicio'
                }
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleBack = () => {
        setStep(step - 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Manejo de imágenes
    const manejarImagen = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no debe superar 5MB')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const nuevaImagen = {
                id: Date.now(),
                base64: reader.result,
                categoria: 'inicio',
                descripcion: '',
                fecha_toma: new Date().toISOString().split('T')[0],
                preview: reader.result
            }
            setImagenes(prev => [...prev, nuevaImagen])
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const eliminarImagen = (id) => {
        setImagenes(prev => prev.filter(img => img.id !== id))
    }

    // Manejo de documentos
    const manejarDocumento = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            alert('El documento no debe superar 10MB')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const nuevoDocumento = {
                id: Date.now(),
                base64: reader.result,
                tipo: 'otro',
                nombre: file.name,
                descripcion: '',
                visible_cliente: false
            }
            setDocumentos(prev => [...prev, nuevoDocumento])
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const eliminarDocumento = (id) => {
        setDocumentos(prev => prev.filter(doc => doc.id !== id))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        // Prevenir cualquier submit automático - solo se crea con el botón explícito
        return false
    }

    const crearObraFinal = async () => {
        // Esta función solo se llama explícitamente desde el botón "Crear Obra"
        if (step !== 5) {
            console.warn('Intento de crear obra fuera del paso 5')
            return
        }

        // Validar todos los pasos críticos antes de crear
        if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
            alert('Por favor complete todos los campos obligatorios antes de crear la obra')
            return
        }
        
        // Validar plantilla si se seleccionó
        if (tipoCreacion === 'plantilla' && !obraPlantillaSeleccionada) {
            alert('Debe seleccionar una obra plantilla')
            return
        }

        setProcesando(true)
        
        try {
            let res
            
            if (tipoCreacion === 'plantilla') {
                // Crear desde plantilla
                res = await crearObraDesdePlantilla({
                    obra_plantilla_id: obraPlantillaSeleccionada.id,
                    proyecto_id: formData.proyecto_id || null,
                    nombre: formData.nombre,
                    descripcion: formData.descripcion,
                    ubicacion: formData.ubicacion,
                    zona: formData.zona,
                    municipio: formData.municipio,
                    provincia: formData.provincia,
                    fecha_inicio: formData.fecha_inicio,
                    fecha_fin_estimada: formData.fecha_fin_estimada
                })
            } else {
                // Crear obra normal
                const datos = {
                    ...formData,
                    presupuesto_aprobado: parseFloat(formData.presupuesto_aprobado),
                    cliente_id: formData.cliente_id || null,
                    responsable_id: formData.responsable_id || null,
                    imagenes: imagenes.map(img => ({
                        base64: img.base64,
                        categoria: img.categoria,
                        descripcion: img.descripcion,
                        fecha_toma: img.fecha_toma || null
                    })),
                    documentos: documentos.map(doc => ({
                        base64: doc.base64,
                        tipo: doc.tipo,
                        nombre: doc.nombre,
                        descripcion: doc.descripcion || null,
                        visible_cliente: doc.visible_cliente || false
                    }))
                }
                res = await crearObra(datos)
            }
            
            setProcesando(false)

            if (res.success) {
                alert(`✅ ${res.mensaje || 'Obra creada exitosamente'}\n\nObra: ${res.codigo || res.obra_id || 'N/A'}`)
                router.push('/admin/obras')
            } else {
                if (res.errores) {
                    setErrors(res.errores)
                    setStep(1) // Volver al primer paso con errores
                } else {
                    alert(`❌ ${res.mensaje || 'Error al crear la obra'}`)
                }
            }
        } catch (error) {
            console.error('Error al crear obra:', error)
            alert('Error al procesar la solicitud')
            setProcesando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const renderPaso = () => {
        switch (step) {
            case 1:
                return (
                    <div key="paso-1">
                        <div className={estilos.headerContenido}>
                            <h2 className={estilos.tituloSeccion}>
                                <Building />
                                Información Básica
                            </h2>
                            <p className={estilos.descripcionSeccion}>
                                Ingrese los datos generales de la obra
                            </p>
                        </div>

                        {/* Selección de tipo de creación */}
                        {step === 1 && (
                            <div className={estilos.tarjeta}>
                                <h3 className={estilos.tituloTarjeta}>
                                    <FileText />
                                    ¿Cómo deseas crear la obra?
                                </h3>
                                
                                <div className={estilos.radioGroup}>
                                    <label className={`${estilos.radioLabel} ${tipoCreacion === 'vacio' ? estilos.radioActivo : ''}`}>
                                        <input
                                            type="radio"
                                            name="tipoCreacion"
                                            value="vacio"
                                            checked={tipoCreacion === 'vacio'}
                                            onChange={(e) => setTipoCreacion(e.target.value)}
                                            disabled={procesando}
                                        />
                                        <div className={estilos.radioContent}>
                                            <span className={estilos.radioTitle}>
                                                <FileText />
                                                Desde cero
                                            </span>
                                            <span className={estilos.radioHelp}>
                                                Crea una obra nueva sin plantilla
                                            </span>
                                        </div>
                                    </label>
                                    
                                    <label className={`${estilos.radioLabel} ${tipoCreacion === 'plantilla' ? estilos.radioActivo : ''}`}>
                                        <input
                                            type="radio"
                                            name="tipoCreacion"
                                            value="plantilla"
                                            checked={tipoCreacion === 'plantilla'}
                                            onChange={(e) => setTipoCreacion(e.target.value)}
                                            disabled={procesando}
                                        />
                                        <div className={estilos.radioContent}>
                                            <span className={estilos.radioTitle}>
                                                <Settings />
                                                Desde plantilla
                                            </span>
                                            <span className={estilos.radioHelp}>
                                                Usa una obra plantilla reutilizable
                                            </span>
                                        </div>
                                    </label>
                                </div>
                                
                                {/* Selector de obra plantilla */}
                                {tipoCreacion === 'plantilla' && (
                                    <div className={estilos.selectorPlantilla}>
                                        <label className={estilos.label}>
                                            Seleccionar obra plantilla <span className={estilos.requerido}>*</span>
                                        </label>
                                        
                                        {cargandoPlantillas ? (
                                            <div className={estilos.cargando}>Cargando plantillas...</div>
                                        ) : obrasPlantilla.length === 0 ? (
                                            <div className={estilos.sinPlantillas}>
                                                <AlertCircle />
                                                <p>No hay obras plantilla disponibles. Crea una obra desde cero o guarda una obra existente como plantilla.</p>
                                            </div>
                                        ) : (
                                            <select
                                                value={obraPlantillaSeleccionada?.id || ''}
                                                onChange={(e) => {
                                                    const obra = obrasPlantilla.find(o => o.id === parseInt(e.target.value))
                                                    setObraPlantillaSeleccionada(obra || null)
                                                }}
                                                className={estilos.select}
                                                disabled={procesando}
                                            >
                                                <option value="">Seleccionar obra plantilla...</option>
                                                {obrasPlantilla.map(obra => (
                                                    <option key={obra.id} value={obra.id}>
                                                        {obra.nombre} {obra.presupuesto_aprobado > 0 && `(RD$ ${parseFloat(obra.presupuesto_aprobado).toLocaleString()})`}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        
                                        {obraPlantillaSeleccionada && (
                                            <div className={estilos.previewPlantilla}>
                                                <strong>Vista previa:</strong> {obraPlantillaSeleccionada.nombre}
                                                {obraPlantillaSeleccionada.descripcion && (
                                                    <p>{obraPlantillaSeleccionada.descripcion}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={estilos.tarjeta}>
                            <h3 className={estilos.tituloTarjeta}>
                                <Building />
                                Datos Generales
                            </h3>

                            <div className={estilos.grid2Columnas}>
                                <div className={estilos.grupoInput}>
                                    <label>
                                        <FileText />
                                        Nombre de la Obra *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        placeholder="Ej: Construcción Edificio Central"
                                        className={errors.nombre ? estilos.inputError : ''}
                                        disabled={procesando}
                                    />
                                    {errors.nombre && (
                                        <p className={estilos.mensajeError}>
                                            <AlertCircle />
                                            {errors.nombre}
                                        </p>
                                    )}
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>
                                        <Users />
                                        Máximo de Trabajadores
                                    </label>
                                    <input
                                        type="number"
                                        name="max_trabajadores"
                                        value={formData.max_trabajadores}
                                        onChange={handleChange}
                                        placeholder="50"
                                        min="1"
                                        disabled={procesando}
                                    />
                                </div>
                            </div>

                            <hr className={estilos.separador} />

                            <div className={estilos.grupoInput}>
                                <label>
                                    <HardHat />
                                    Tipo de Obra *
                                </label>
                                <div className={estilos.gridTipos}>
                                    {tiposObra.map(tipo => {
                                        const IconComponent = tipo.Icon
                                        return (
                                            <button
                                                key={tipo.value}
                                                type="button"
                                                data-tipo={tipo.tipo}
                                                onClick={() => setFormData(prev => ({ ...prev, tipo_obra: tipo.value }))}
                                                className={`${estilos.tipoObra} ${formData.tipo_obra === tipo.value ? estilos.tipoObraActivo : ''}`}
                                                disabled={procesando}
                                            >
                                                <div className={estilos.tipoIcon}>
                                                    <IconComponent />
                                                </div>
                                                <span className={estilos.tipoLabel}>{tipo.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                                {errors.tipo_obra && (
                                    <p className={estilos.mensajeError}>
                                        <AlertCircle />
                                        {errors.tipo_obra}
                                    </p>
                                )}
                            </div>

                            <hr className={estilos.separador} />

                            <div className={estilos.grupoInput}>
                                <label>
                                    <FileText />
                                    Descripción
                                </label>
                                <textarea
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Describe los detalles de la obra, alcance, características especiales..."
                                    disabled={procesando}
                                />
                            </div>
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div key="paso-2">
                        <div className={estilos.headerContenido}>
                            <h2 className={estilos.tituloSeccion}>
                                <MapPin />
                                Ubicación
                            </h2>
                            <p className={estilos.descripcionSeccion}>
                                Especifique la ubicación exacta de la obra
                            </p>
                        </div>

                        <div className={estilos.tarjeta}>
                            <h3 className={estilos.tituloTarjeta}>
                                <MapPin />
                                Dirección
                            </h3>

                            <div className={estilos.grupoInput}>
                                <label>
                                    <MapPin />
                                    Dirección Completa *
                                </label>
                                <input
                                    type="text"
                                    name="ubicacion"
                                    value={formData.ubicacion}
                                    onChange={handleChange}
                                    placeholder="Calle, número, sector"
                                    className={errors.ubicacion ? estilos.inputError : ''}
                                    disabled={procesando}
                                />
                                {errors.ubicacion && (
                                    <p className={estilos.mensajeError}>
                                        <AlertCircle />
                                        {errors.ubicacion}
                                    </p>
                                )}
                            </div>

                            <hr className={estilos.separador} />

                            <div className={estilos.grid3Columnas}>
                                <div className={estilos.grupoInput}>
                                    <label>
                                        <MapPin />
                                        Region / Provincia *
                                    </label>
                                    {regiones.length > 0 ? (
                                        <select
                                            name="provincia"
                                            value={formData.provincia}
                                            onChange={handleChange}
                                            className={errors.provincia ? estilos.inputError : ''}
                                            disabled={procesando}
                                        >
                                            <option value="">Seleccione...</option>
                                            {regiones.map(region => (
                                                <option key={region.id} value={region.nombre}>{region.nombre}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            name="provincia"
                                            value={formData.provincia}
                                            onChange={handleChange}
                                            className={errors.provincia ? estilos.inputError : ''}
                                            placeholder="Provincia o region"
                                            disabled={procesando}
                                        />
                                    )}
                                    {errors.provincia && (
                                        <p className={estilos.mensajeError}>
                                            <AlertCircle />
                                            {errors.provincia}
                                        </p>
                                    )}
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>
                                        <MapPin />
                                        Municipio
                                    </label>
                                    <input
                                        type="text"
                                        name="municipio"
                                        value={formData.municipio}
                                        onChange={handleChange}
                                        placeholder="Municipio"
                                        disabled={procesando}
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>
                                        <MapPin />
                                        Zona
                                    </label>
                                    <select
                                        name="zona"
                                        value={formData.zona}
                                        onChange={handleChange}
                                        disabled={procesando}
                                    >
                                        <option value="">Seleccione...</option>
                                        {zonas.map(zona => (
                                            <option key={zona} value={zona}>{zona}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div key="paso-3">
                        <div className={estilos.headerContenido}>
                            <h2 className={estilos.tituloSeccion}>
                                <Calendar />
                                Presupuesto y Fechas
                            </h2>
                            <p className={estilos.descripcionSeccion}>
                                Configure el presupuesto y la planificación temporal
                            </p>
                        </div>

                        <div className={estilos.tarjeta}>
                            <h3 className={estilos.tituloTarjeta}>
                                <DollarSign />
                                Presupuesto
                            </h3>

                            <div className={estilos.grupoInput}>
                                <label>
                                    <DollarSign />
                                    Presupuesto Aprobado *
                                </label>
                                <input
                                    type="number"
                                    name="presupuesto_aprobado"
                                    value={formData.presupuesto_aprobado}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className={errors.presupuesto_aprobado ? estilos.inputError : ''}
                                    disabled={procesando}
                                />
                                {errors.presupuesto_aprobado && (
                                    <p className={estilos.mensajeError}>
                                        <AlertCircle />
                                        {errors.presupuesto_aprobado}
                                    </p>
                                )}
                                {formData.presupuesto_aprobado && (
                                    <p className={estilos.descripcionSeccion}>
                                        {formatearMoneda(formData.presupuesto_aprobado)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className={estilos.tarjeta}>
                            <h3 className={estilos.tituloTarjeta}>
                                <Calendar />
                                Planificación
                            </h3>

                            <div className={estilos.grid2Columnas}>
                                <div className={estilos.grupoInput}>
                                    <label>
                                        <Calendar />
                                        Fecha de Inicio *
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha_inicio"
                                        value={formData.fecha_inicio}
                                        onChange={handleChange}
                                        className={errors.fecha_inicio ? estilos.inputError : ''}
                                        disabled={procesando}
                                    />
                                    {errors.fecha_inicio && (
                                        <p className={estilos.mensajeError}>
                                            <AlertCircle />
                                            {errors.fecha_inicio}
                                        </p>
                                    )}
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>
                                        <Calendar />
                                        Fecha de Fin Estimada *
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha_fin_estimada"
                                        value={formData.fecha_fin_estimada}
                                        onChange={handleChange}
                                        className={errors.fecha_fin_estimada ? estilos.inputError : ''}
                                        disabled={procesando}
                                    />
                                    {errors.fecha_fin_estimada && (
                                        <p className={estilos.mensajeError}>
                                            <AlertCircle />
                                            {errors.fecha_fin_estimada}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div key="paso-4">
                        <div className={estilos.headerContenido}>
                            <h2 className={estilos.tituloSeccion}>
                                <ImageIcon />
                                Recursos
                            </h2>
                            <p className={estilos.descripcionSeccion}>
                                Agregue imágenes y documentos relacionados con la obra
                            </p>
                        </div>

                        <div className={estilos.tarjeta}>
                            <h3 className={estilos.tituloTarjeta}>
                                <Camera />
                                Imágenes
                            </h3>

                            <div className={estilos.galeriaImagenes}>
                                <div className={estilos.gridImagenes}>
                                    {imagenes.map(imagen => (
                                        <div key={imagen.id} className={estilos.imagenItem}>
                                            <img src={imagen.preview} alt="Preview" className={estilos.imagenPreview} />
                                            <button
                                                type="button"
                                                className={estilos.btnEliminarImagen}
                                                onClick={() => eliminarImagen(imagen.id)}
                                                disabled={procesando}
                                            >
                                                <X />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className={estilos.btnAgregarImagen}
                                        onClick={() => imagenInputRef.current?.click()}
                                        disabled={procesando}
                                    >
                                        <Camera />
                                        <span>Agregar Imagen</span>
                                    </button>
                                </div>
                                <input
                                    ref={imagenInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={manejarImagen}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        <div className={estilos.tarjeta}>
                            <h3 className={estilos.tituloTarjeta}>
                                <Upload />
                                Documentos
                            </h3>

                            <div className={estilos.listaDocumentos}>
                                {documentos.map(doc => (
                                    <div key={doc.id} className={estilos.documentoItem}>
                                        <div className={estilos.documentoIcono}>
                                            <FileText />
                                        </div>
                                        <div className={estilos.documentoInfo}>
                                            <p className={estilos.documentoNombre}>{doc.nombre}</p>
                                            <p className={estilos.documentoDetalle}>Tipo: {doc.tipo}</p>
                                        </div>
                                        <button
                                            type="button"
                                            className={estilos.btnEliminarDocumento}
                                            onClick={() => eliminarDocumento(doc.id)}
                                            disabled={procesando}
                                        >
                                            <X />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className={estilos.btnAgregarDocumento}
                                    onClick={() => documentoInputRef.current?.click()}
                                    disabled={procesando}
                                >
                                    <Upload />
                                    <span>Agregar Documento</span>
                                </button>
                                <input
                                    ref={documentoInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg,.dwt"
                                    onChange={manejarDocumento}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                )

            case 5:
                const tipoSeleccionado = tiposObra.find(t => t.value === formData.tipo_obra)
                return (
                    <div key="paso-5">
                        <div className={estilos.headerContenido}>
                            <h2 className={estilos.tituloSeccion}>
                                <FileCheck />
                                Confirmación
                            </h2>
                            <p className={estilos.descripcionSeccion}>
                                Revise la información antes de crear la obra
                            </p>
                        </div>

                        <div className={estilos.resumen}>
                            <h3 className={estilos.resumenTitulo}>
                                <FileCheck />
                                Resumen de la Obra
                            </h3>
                            
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Nombre:</span>
                                <span className={estilos.resumenValor}>{formData.nombre || 'N/A'}</span>
                            </div>
                            
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Tipo:</span>
                                <span className={estilos.resumenValor}>{tipoSeleccionado?.label || 'N/A'}</span>
                            </div>
                            
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Ubicación:</span>
                                <span className={estilos.resumenValor}>
                                    {formData.ubicacion}, {formData.municipio || ''} {formData.provincia}
                                </span>
                            </div>
                            
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Presupuesto:</span>
                                <span className={estilos.resumenValor}>
                                    {formatearMoneda(formData.presupuesto_aprobado)}
                                </span>
                            </div>
                            
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Inicio:</span>
                                <span className={estilos.resumenValor}>
                                    {formData.fecha_inicio ? new Date(formData.fecha_inicio + 'T00:00:00').toLocaleDateString('es-DO', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    }) : 'N/A'}
                                </span>
                            </div>
                            
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Fin Estimado:</span>
                                <span className={estilos.resumenValor}>
                                    {formData.fecha_fin_estimada ? new Date(formData.fecha_fin_estimada + 'T00:00:00').toLocaleDateString('es-DO', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    }) : 'N/A'}
                                </span>
                            </div>
                            
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Imágenes:</span>
                                <span className={estilos.resumenValor}>{imagenes.length}</span>
                            </div>
                            
                            <div className={estilos.resumenItem}>
                                <span className={estilos.resumenLabel}>Documentos:</span>
                                <span className={estilos.resumenValor}>{documentos.length}</span>
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.layoutConSidebar}>
                {/* SIDEBAR CON PASOS */}
                <aside className={estilos.sidebar}>
                    <div className={estilos.sidebarHeader}>
                        <h1 className={estilos.sidebarTitulo}>
                            <HardHat size={24} />
                            Nueva Obra
                        </h1>
                        <p className={estilos.sidebarSubtitulo}>
                            Complete la información en {pasos.length} pasos
                        </p>
                    </div>

                    <div className={estilos.pasosVerticales}>
                        {pasos.map((paso) => {
                            const IconComponent = paso.icon
                            return (
                                <div
                                    key={paso.numero}
                                    className={`${estilos.pasoItem} ${
                                        step === paso.numero 
                                            ? estilos.activo 
                                            : step > paso.numero 
                                            ? estilos.completado 
                                            : ''
                                    }`}
                                    onClick={() => step > paso.numero && setStep(paso.numero)}
                                    style={{ cursor: step > paso.numero ? 'pointer' : 'default' }}
                                >
                                    <div className={estilos.pasoIcono}>
                                        {step > paso.numero ? (
                                            <Check />
                                        ) : (
                                            <IconComponent />
                                        )}
                                    </div>
                                    <div className={estilos.pasoInfo}>
                                        <p className={estilos.pasoLabel}>{paso.label}</p>
                                        <p className={estilos.pasoDescripcion}>{paso.descripcion}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </aside>

                {/* CONTENIDO PRINCIPAL */}
                <main className={estilos.contenidoPrincipal}>
                    <div onKeyDown={(e) => {
                        // Prevenir submit al presionar Enter
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            if (step < 5) {
                                handleNext()
                            }
                        }
                    }}>
                        {renderPaso()}

                        {/* BOTONES DE NAVEGACIÓN */}
                        <div className={estilos.botonesNavegacion}>
                            <button
                                type="button"
                                className={estilos.btnAnterior}
                                onClick={handleBack}
                                disabled={step === 1 || procesando}
                            >
                                <ChevronLeft />
                                Anterior
                            </button>

                            {step < 5 ? (
                                <button
                                    type="button"
                                    className={estilos.btnSiguiente}
                                    onClick={handleNext}
                                    disabled={procesando}
                                >
                                    Siguiente
                                    <ChevronRight />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={estilos.btnGuardar}
                                    onClick={crearObraFinal}
                                    disabled={procesando}
                                >
                                    {procesando ? (
                                        <>
                                            <div className={estilos.iconoCargando}>
                                                <Settings />
                                            </div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Check />
                                            Crear Obra
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
