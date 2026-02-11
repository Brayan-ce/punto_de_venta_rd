"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { crearPlantillaServicio } from './servidor'
import { TIPOS_SERVICIO, formatearTipoServicio } from '../../../core/construction/estados'
import estilos from './nuevo.module.css'

export default function NuevaPlantilla() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
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
    }, [])

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
                router.push('/admin/servicios/plantillas')
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

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="document-text-outline"></ion-icon>
                        Nueva Plantilla de Servicio
                    </h1>
                    <p className={estilos.subtitulo}>Crea una nueva plantilla reutilizable para servicios</p>
                </div>
                <button className={estilos.btnVolver} onClick={() => router.back()}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Volver</span>
                </button>
            </div>

            <div className={`${estilos.formularioContainer} ${estilos[tema]}`}>
                <form onSubmit={handleSubmit} className={estilos.formulario}>
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
                            onClick={() => router.back()}
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
        </div>
    )
}

