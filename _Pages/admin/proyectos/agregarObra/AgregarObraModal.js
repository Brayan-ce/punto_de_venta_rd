"use client"

import { useState, useEffect } from 'react'
import { crearObraDesdePlantilla, obtenerObrasPlantilla } from '../../obras/servidor'
import estilos from './AgregarObraModal.module.css'

export default function AgregarObraModal({ proyecto, onClose, onSuccess }) {
    const [tipoCreacion, setTipoCreacion] = useState('plantilla')
    const [obrasPlantilla, setObrasPlantilla] = useState([])
    const [obraPlantillaSeleccionada, setObraPlantillaSeleccionada] = useState(null)
    const [busquedaPlantilla, setBusquedaPlantilla] = useState('')
    const [cargando, setCargando] = useState(false)
    const [cargandoPlantillas, setCargandoPlantillas] = useState(true)
    const [errores, setErrores] = useState({})
    
    // Datos de la obra
    const [datosObra, setDatosObra] = useState({
        nombre: '',
        descripcion: '',
        ubicacion: proyecto?.ubicacion || '',
        zona: '',
        municipio: '',
        provincia: '',
        fecha_inicio: proyecto?.fecha_inicio || '',
        fecha_fin_estimada: proyecto?.fecha_fin_estimada || ''
    })

    useEffect(() => {
        cargarObrasPlantilla()
    }, [])

    useEffect(() => {
        // Si se selecciona una obra plantilla, autocompletar datos
        if (obraPlantillaSeleccionada && tipoCreacion === 'plantilla') {
            setDatosObra(prev => ({
                ...prev,
                nombre: prev.nombre || obraPlantillaSeleccionada.nombre,
                descripcion: prev.descripcion || obraPlantillaSeleccionada.descripcion || '',
                ubicacion: prev.ubicacion || proyecto?.ubicacion || '',
            }))
        }
    }, [obraPlantillaSeleccionada, tipoCreacion, proyecto])

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

    function validarFormulario() {
        const nuevosErrores = {}

        if (!datosObra.nombre || datosObra.nombre.trim() === '') {
            nuevosErrores.nombre = 'El nombre de la obra es obligatorio'
        }

        if (tipoCreacion === 'plantilla' && !obraPlantillaSeleccionada) {
            nuevosErrores.obra_plantilla = 'Debe seleccionar una obra plantilla'
        }

        if (!datosObra.fecha_inicio) {
            nuevosErrores.fecha_inicio = 'La fecha de inicio es obligatoria'
        }

        if (!datosObra.fecha_fin_estimada) {
            nuevosErrores.fecha_fin_estimada = 'La fecha de fin estimada es obligatoria'
        }

        if (datosObra.fecha_inicio && datosObra.fecha_fin_estimada) {
            const inicio = new Date(datosObra.fecha_inicio)
            const fin = new Date(datosObra.fecha_fin_estimada)
            if (fin < inicio) {
                nuevosErrores.fecha_fin_estimada = 'La fecha de fin debe ser posterior a la fecha de inicio'
            }
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    async function handleSubmit(e) {
        e.preventDefault()
        
        if (!validarFormulario()) {
            return
        }

        setCargando(true)
        try {
            if (tipoCreacion === 'plantilla') {
                // Crear desde plantilla
                const res = await crearObraDesdePlantilla({
                    obra_plantilla_id: obraPlantillaSeleccionada.id,
                    proyecto_id: proyecto.id,
                    nombre: datosObra.nombre,
                    descripcion: datosObra.descripcion,
                    ubicacion: datosObra.ubicacion,
                    zona: datosObra.zona,
                    municipio: datosObra.municipio,
                    provincia: datosObra.provincia,
                    fecha_inicio: datosObra.fecha_inicio,
                    fecha_fin_estimada: datosObra.fecha_fin_estimada
                })

                if (res.success) {
                    if (onSuccess) onSuccess(res.obra_id)
                    onClose()
                } else {
                    alert(res.mensaje || 'Error al crear la obra')
                }
            } else {
                // Crear desde cero - redirigir al formulario de crear obra
                const params = new URLSearchParams({
                    proyecto_id: proyecto.id,
                    nombre: datosObra.nombre,
                    ubicacion: datosObra.ubicacion,
                    fecha_inicio: datosObra.fecha_inicio,
                    fecha_fin_estimada: datosObra.fecha_fin_estimada
                })
                window.location.href = `/admin/obras/nuevo?${params.toString()}`
            }
        } catch (error) {
            console.error('Error al crear obra:', error)
            alert('Error al crear la obra. Por favor, intente nuevamente.')
        } finally {
            setCargando(false)
        }
    }

    // Filtrar obras plantilla según búsqueda
    const obrasFiltradas = obrasPlantilla.filter(obra =>
        obra.nombre.toLowerCase().includes(busquedaPlantilla.toLowerCase()) ||
        (obra.descripcion && obra.descripcion.toLowerCase().includes(busquedaPlantilla.toLowerCase()))
    )

    return (
        <div className={estilos.overlay} onClick={onClose}>
            <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                <div className={estilos.header}>
                    <h2>
                        <ion-icon name="add-outline"></ion-icon>
                        Agregar obra al proyecto
                    </h2>
                    <button className={estilos.btnCerrar} onClick={onClose}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={estilos.form}>
                    {/* Información del proyecto */}
                    <div className={estilos.proyectoInfo}>
                        <strong>Proyecto:</strong> {proyecto?.nombre || 'N/A'}
                    </div>

                    {/* Tipo de creación */}
                    <div className={estilos.grupo}>
                        <label className={estilos.label}>
                            ¿Cómo deseas crear la obra?
                        </label>
                        <div className={estilos.radioGroup}>
                            <label className={estilos.radioLabel}>
                                <input
                                    type="radio"
                                    name="tipoCreacion"
                                    value="plantilla"
                                    checked={tipoCreacion === 'plantilla'}
                                    onChange={(e) => {
                                        setTipoCreacion(e.target.value)
                                        setObraPlantillaSeleccionada(null)
                                        setErrores({})
                                    }}
                                    className={estilos.radioInput}
                                />
                                <span className={estilos.radioText}>
                                    <ion-icon name="copy-outline"></ion-icon>
                                    Desde plantilla
                                </span>
                                <span className={estilos.radioHelp}>
                                    Usa una obra plantilla reutilizable
                                </span>
                            </label>
                            <label className={estilos.radioLabel}>
                                <input
                                    type="radio"
                                    name="tipoCreacion"
                                    value="vacio"
                                    checked={tipoCreacion === 'vacio'}
                                    onChange={(e) => {
                                        setTipoCreacion(e.target.value)
                                        setObraPlantillaSeleccionada(null)
                                        setErrores({})
                                    }}
                                    className={estilos.radioInput}
                                />
                                <span className={estilos.radioText}>
                                    <ion-icon name="document-outline"></ion-icon>
                                    Desde cero
                                </span>
                                <span className={estilos.radioHelp}>
                                    Crea una obra completamente nueva
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Selector de obra plantilla */}
                    {tipoCreacion === 'plantilla' && (
                        <div className={estilos.grupo}>
                            <label className={estilos.label}>
                                Buscar plantilla de obra <span className={estilos.requerido}>*</span>
                            </label>
                            {cargandoPlantillas ? (
                                <div className={estilos.cargando}>Cargando plantillas...</div>
                            ) : obrasPlantilla.length === 0 ? (
                                <div className={estilos.helpBox}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <div>
                                        <p>No hay obras plantilla disponibles.</p>
                                        <p>Puedes crear una obra plantilla desde el módulo de obras.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={estilos.busqueda}>
                                        <ion-icon name="search-outline"></ion-icon>
                                        <input
                                            type="text"
                                            className={estilos.input}
                                            placeholder="Buscar obra plantilla..."
                                            value={busquedaPlantilla}
                                            onChange={(e) => setBusquedaPlantilla(e.target.value)}
                                        />
                                    </div>
                                    {errores.obra_plantilla && (
                                        <span className={estilos.error}>{errores.obra_plantilla}</span>
                                    )}
                                    <div className={estilos.listaPlantillas}>
                                        {obrasFiltradas.length === 0 ? (
                                            <div className={estilos.vacio}>
                                                No se encontraron obras plantilla
                                            </div>
                                        ) : (
                                            obrasFiltradas.map(obra => (
                                                <div
                                                    key={obra.id}
                                                    className={`${estilos.plantillaCard} ${
                                                        obraPlantillaSeleccionada?.id === obra.id ? estilos.seleccionada : ''
                                                    }`}
                                                    onClick={() => {
                                                        setObraPlantillaSeleccionada(obra)
                                                        setErrores(prev => ({ ...prev, obra_plantilla: undefined }))
                                                    }}
                                                >
                                                    <div className={estilos.plantillaHeader}>
                                                        <h4>{obra.nombre}</h4>
                                                        {obraPlantillaSeleccionada?.id === obra.id && (
                                                            <ion-icon name="checkmark-circle" className={estilos.checkIcon}></ion-icon>
                                                        )}
                                                    </div>
                                                    {obra.descripcion && (
                                                        <p className={estilos.plantillaDescripcion}>{obra.descripcion}</p>
                                                    )}
                                                    <div className={estilos.plantillaInfo}>
                                                        <span>
                                                            <ion-icon name="code-outline"></ion-icon>
                                                            {obra.codigo_obra}
                                                        </span>
                                                        {obra.presupuesto_aprobado > 0 && (
                                                            <span>
                                                                <ion-icon name="cash-outline"></ion-icon>
                                                                RD$ {parseFloat(obra.presupuesto_aprobado).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Campos de la obra */}
                    <div className={estilos.grupo}>
                        <label className={estilos.label}>
                            Nombre de la obra <span className={estilos.requerido}>*</span>
                        </label>
                        <input
                            type="text"
                            className={`${estilos.input} ${errores.nombre ? estilos.inputError : ''}`}
                            value={datosObra.nombre}
                            onChange={(e) => {
                                setDatosObra(prev => ({ ...prev, nombre: e.target.value }))
                                setErrores(prev => ({ ...prev, nombre: undefined }))
                            }}
                            placeholder="Ej: Obra Principal, Etapa 1, etc."
                        />
                        {errores.nombre && (
                            <span className={estilos.error}>{errores.nombre}</span>
                        )}
                    </div>

                    <div className={estilos.grupo}>
                        <label className={estilos.label}>Descripción</label>
                        <textarea
                            className={estilos.textarea}
                            value={datosObra.descripcion}
                            onChange={(e) => setDatosObra(prev => ({ ...prev, descripcion: e.target.value }))}
                            rows="3"
                            placeholder="Descripción opcional de la obra"
                        />
                    </div>

                    <div className={estilos.grid}>
                        <div className={estilos.grupo}>
                            <label className={estilos.label}>
                                Fecha de inicio <span className={estilos.requerido}>*</span>
                            </label>
                            <input
                                type="date"
                                className={`${estilos.inputDate} ${errores.fecha_inicio ? estilos.inputError : ''}`}
                                value={datosObra.fecha_inicio}
                                onChange={(e) => {
                                    setDatosObra(prev => ({ ...prev, fecha_inicio: e.target.value }))
                                    setErrores(prev => ({ ...prev, fecha_inicio: undefined, fecha_fin_estimada: undefined }))
                                }}
                            />
                            {errores.fecha_inicio && (
                                <span className={estilos.error}>{errores.fecha_inicio}</span>
                            )}
                        </div>

                        <div className={estilos.grupo}>
                            <label className={estilos.label}>
                                Fecha de fin estimada <span className={estilos.requerido}>*</span>
                            </label>
                            <input
                                type="date"
                                className={`${estilos.inputDate} ${errores.fecha_fin_estimada ? estilos.inputError : ''}`}
                                value={datosObra.fecha_fin_estimada}
                                onChange={(e) => {
                                    setDatosObra(prev => ({ ...prev, fecha_fin_estimada: e.target.value }))
                                    setErrores(prev => ({ ...prev, fecha_fin_estimada: undefined }))
                                }}
                                min={datosObra.fecha_inicio}
                            />
                            {errores.fecha_fin_estimada && (
                                <span className={estilos.error}>{errores.fecha_fin_estimada}</span>
                            )}
                        </div>
                    </div>

                    {/* Botones */}
                    <div className={estilos.footer}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={estilos.btnCancelar}
                            disabled={cargando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={estilos.btnCrear}
                            disabled={cargando || (tipoCreacion === 'plantilla' && !obraPlantillaSeleccionada)}
                        >
                            {cargando ? 'Creando...' : 'Crear obra'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
