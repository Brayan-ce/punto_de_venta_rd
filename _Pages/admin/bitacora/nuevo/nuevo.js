"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { crearBitacora, obtenerTrabajadoresAsignados, obtenerObrasActivas, obtenerServiciosActivos } from '../servidor'
import { 
    TIPOS_DESTINO, 
    CONDICIONES_CLIMA,
    ACTIVIDADES_COMUNES,
    CONFIG_FOTOS,
    formatearClima 
} from '../../core/construction/bitacora'
import estilos from './nuevo.module.css'

export default function NuevaBitacora() {
    const router = useRouter()
    
    // Listas de destinos
    const [obras, setObras] = useState([])
    const [servicios, setServicios] = useState([])
    const [trabajadores, setTrabajadores] = useState([])
    
    // Datos del formulario
    const [formData, setFormData] = useState({
        tipo_destino: '', // 'obra' o 'servicio'
        destino_id: '',
        fecha_bitacora: new Date().toISOString().split('T')[0],
        zona_sitio: '',
        trabajo_realizado: '',
        observaciones: '',
        condiciones_clima: ''
    })
    
    // Estados de selección
    const [trabajadoresPresentes, setTrabajadoresPresentes] = useState([])
    const [fotos, setFotos] = useState([])
    
    // Estados de UI
    const [errors, setErrors] = useState({})
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [paso, setPaso] = useState(1) // 1: Tipo y Destino, 2: Detalles, 3: Trabajadores, 4: Revisión

    useEffect(() => {
        cargarObrasYServicios()
    }, [])

    useEffect(() => {
        if (formData.tipo_destino && formData.destino_id && formData.fecha_bitacora) {
            cargarTrabajadores()
        } else {
            setTrabajadores([])
            setTrabajadoresPresentes([])
        }
    }, [formData.tipo_destino, formData.destino_id, formData.fecha_bitacora])

    async function cargarObrasYServicios() {
        setCargando(true)
        const [resObras, resServicios] = await Promise.all([
            obtenerObrasActivas(),
            obtenerServiciosActivos()
        ])
        
        if (resObras.success) setObras(resObras.obras)
        if (resServicios.success) setServicios(resServicios.servicios)
        setCargando(false)
    }

    async function cargarTrabajadores() {
        const res = await obtenerTrabajadoresAsignados({
            tipo_destino: formData.tipo_destino,
            destino_id: formData.destino_id,
            fecha: formData.fecha_bitacora
        })
        
        if (res.success) {
            setTrabajadores(res.trabajadores)
            // Preseleccionar todos los trabajadores
            setTrabajadoresPresentes(res.trabajadores.map(t => t.id))
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleTipoDestino = (tipo) => {
        setFormData(prev => ({ 
            ...prev, 
            tipo_destino: tipo,
            destino_id: '' // Reset destino al cambiar tipo
        }))
        setErrors({})
    }

    const toggleTrabajador = (id) => {
        setTrabajadoresPresentes(prev => 
            prev.includes(id) 
                ? prev.filter(tId => tId !== id)
                : [...prev, id]
        )
    }

    const toggleTodosTrabajadores = () => {
        if (trabajadoresPresentes.length === trabajadores.length) {
            setTrabajadoresPresentes([])
        } else {
            setTrabajadoresPresentes(trabajadores.map(t => t.id))
        }
    }

    const handleTrabajoComun = (trabajo) => {
        const newValue = formData.trabajo_realizado 
            ? `${formData.trabajo_realizado}\n• ${trabajo}`
            : `• ${trabajo}`
        setFormData(prev => ({ ...prev, trabajo_realizado: newValue }))
    }

    const handleFotosChange = (e) => {
        const archivos = Array.from(e.target.files)
        
        // Validar cantidad
        if (fotos.length + archivos.length > CONFIG_FOTOS.MAX_FOTOS) {
            alert(`Solo puedes subir un máximo de ${CONFIG_FOTOS.MAX_FOTOS} fotos`)
            return
        }
        
        // Validar cada archivo
        const fotosValidas = archivos.filter(archivo => {
            // Validar tamaño
            if (archivo.size > CONFIG_FOTOS.MAX_SIZE_MB * 1024 * 1024) {
                alert(`La foto "${archivo.name}" excede el tamaño máximo de ${CONFIG_FOTOS.MAX_SIZE_MB}MB`)
                return false
            }
            
            // Validar formato
            if (!CONFIG_FOTOS.FORMATOS_PERMITIDOS.includes(archivo.type)) {
                alert(`La foto "${archivo.name}" no tiene un formato permitido`)
                return false
            }
            
            return true
        })
        
        // Agregar fotos con preview
        const nuevasFotos = fotosValidas.map(archivo => ({
            id: Math.random().toString(36).substr(2, 9),
            archivo,
            preview: URL.createObjectURL(archivo)
        }))
        
        setFotos(prev => [...prev, ...nuevasFotos])
    }

    const eliminarFoto = (id) => {
        setFotos(prev => {
            const foto = prev.find(f => f.id === id)
            if (foto && foto.preview) {
                URL.revokeObjectURL(foto.preview)
            }
            return prev.filter(f => f.id !== id)
        })
    }

    const validarPaso = (pasoActual) => {
        const nuevosErrores = {}
        
        if (pasoActual === 1) {
            if (!formData.tipo_destino) {
                nuevosErrores.tipo_destino = 'Seleccione el tipo de destino'
            }
            if (!formData.destino_id) {
                nuevosErrores.destino_id = `Seleccione ${formData.tipo_destino === TIPOS_DESTINO.OBRA ? 'una obra' : 'un servicio'}`
            }
            if (!formData.fecha_bitacora) {
                nuevosErrores.fecha_bitacora = 'Seleccione la fecha'
            }
        }
        
        if (pasoActual === 2) {
            if (!formData.trabajo_realizado || formData.trabajo_realizado.trim().length < 10) {
                nuevosErrores.trabajo_realizado = 'Describa el trabajo realizado (mínimo 10 caracteres)'
            }
        }
        
        if (pasoActual === 3) {
            if (trabajadoresPresentes.length === 0) {
                nuevosErrores.trabajadores = 'Seleccione al menos un trabajador presente'
            }
        }
        
        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const siguientePaso = () => {
        if (validarPaso(paso)) {
            setPaso(paso + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const pasoAnterior = () => {
        setPaso(paso - 1)
        setErrors({})
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Validar todos los pasos
        if (!validarPaso(1) || !validarPaso(2) || !validarPaso(3)) {
            setPaso(1) // Volver al primer paso con error
            return
        }

        setProcesando(true)

        // Preparar datos
        const datos = {
            tipo_destino: formData.tipo_destino,
            destino_id: formData.destino_id,
            fecha_bitacora: formData.fecha_bitacora,
            zona_sitio: formData.zona_sitio,
            trabajo_realizado: formData.trabajo_realizado,
            observaciones: formData.observaciones,
            condiciones_clima: formData.condiciones_clima,
            trabajadores_presentes: trabajadoresPresentes,
            fotos: [] // TODO: Implementar upload de fotos al servidor
        }

        const res = await crearBitacora(datos)
        setProcesando(false)

        if (res.success) {
            router.push('/admin/bitacora')
        } else {
            if (res.errores) {
                setErrors(res.errores)
            } else {
                alert(res.mensaje || 'Error al crear la bitácora')
            }
            setPaso(1) // Volver al primer paso para corregir
        }
    }

    // Obtener lista de destinos según tipo seleccionado
    const destinosDisponibles = formData.tipo_destino === TIPOS_DESTINO.OBRA 
        ? obras 
        : formData.tipo_destino === TIPOS_DESTINO.SERVICIO
        ? servicios 
        : []

    return (
        <div className={estilos.contenedor}>
            {/* Header */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Nueva Bitácora Diaria</h1>
                    <p className={estilos.subtitulo}>
                        Registro de actividades y personal en campo
                    </p>
                </div>
                <button 
                    className={estilos.btnVolver} 
                    onClick={() => router.back()}
                    disabled={procesando}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Volver</span>
                </button>
            </div>

            {/* Indicador de pasos */}
            <div className={estilos.pasos}>
                {[1, 2, 3, 4].map(numeroPaso => (
                    <div 
                        key={numeroPaso}
                        className={`${estilos.paso} ${paso >= numeroPaso ? estilos.pasoActivo : ''}`}
                    >
                        <div className={estilos.pasoNumero}>
                            {paso > numeroPaso ? (
                                <ion-icon name="checkmark"></ion-icon>
                            ) : (
                                numeroPaso
                            )}
                        </div>
                        <span className={estilos.pasoTexto}>
                            {numeroPaso === 1 && 'Destino'}
                            {numeroPaso === 2 && 'Trabajo'}
                            {numeroPaso === 3 && 'Personal'}
                            {numeroPaso === 4 && 'Revisión'}
                        </span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className={estilos.form}>
                {/* PASO 1: Tipo y Destino */}
                {paso === 1 && (
                    <div className={estilos.contenidoPaso}>
                        <section className={estilos.seccion}>
                            <h3 className={estilos.seccionTitulo}>
                                <ion-icon name="location-outline"></ion-icon>
                                <span>Seleccionar Destino</span>
                            </h3>

                            {/* Selector de tipo de destino */}
                            <div className={estilos.grupoTipos}>
                                <button
                                    type="button"
                                    className={`${estilos.btnTipo} ${formData.tipo_destino === TIPOS_DESTINO.OBRA ? estilos.btnTipoActivo : ''}`}
                                    onClick={() => handleTipoDestino(TIPOS_DESTINO.OBRA)}
                                >
                                    <span className={estilos.emojiGrande}>🏗️</span>
                                    <span className={estilos.tipoTexto}>Obra</span>
                                    <span className={estilos.tipoDesc}>Construcción continua</span>
                                </button>
                                <button
                                    type="button"
                                    className={`${estilos.btnTipo} ${formData.tipo_destino === TIPOS_DESTINO.SERVICIO ? estilos.btnTipoActivo : ''}`}
                                    onClick={() => handleTipoDestino(TIPOS_DESTINO.SERVICIO)}
                                >
                                    <span className={estilos.emojiGrande}>⚡</span>
                                    <span className={estilos.tipoTexto}>Servicio</span>
                                    <span className={estilos.tipoDesc}>Intervención puntual</span>
                                </button>
                            </div>
                            {errors.tipo_destino && (
                                <span className={estilos.errorMsg}>{errors.tipo_destino}</span>
                            )}

                            {/* Selector de destino específico */}
                            {formData.tipo_destino && (
                                <div className={estilos.grupo}>
                                    <label>
                                        {formData.tipo_destino === TIPOS_DESTINO.OBRA ? 'Obra *' : 'Servicio *'}
                                    </label>
                                    <select
                                        name="destino_id"
                                        value={formData.destino_id}
                                        onChange={handleChange}
                                        className={errors.destino_id ? estilos.inputError : ''}
                                    >
                                        <option value="">Seleccione...</option>
                                        {destinosDisponibles.map(destino => (
                                            <option key={destino.id} value={destino.id}>
                                                {formData.tipo_destino === TIPOS_DESTINO.OBRA 
                                                    ? `${destino.codigo_obra} - ${destino.nombre}`
                                                    : `${destino.codigo_servicio} - ${destino.nombre}`
                                                }
                                            </option>
                                        ))}
                                    </select>
                                    {errors.destino_id && (
                                        <span className={estilos.errorMsg}>{errors.destino_id}</span>
                                    )}
                                </div>
                            )}

                            {/* Fecha */}
                            <div className={estilos.fila}>
                                <div className={estilos.grupo}>
                                    <label>Fecha *</label>
                                    <input
                                        type="date"
                                        name="fecha_bitacora"
                                        value={formData.fecha_bitacora}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={errors.fecha_bitacora ? estilos.inputError : ''}
                                    />
                                    {errors.fecha_bitacora && (
                                        <span className={estilos.errorMsg}>{errors.fecha_bitacora}</span>
                                    )}
                                </div>
                                <div className={estilos.grupo}>
                                    <label>Zona / Sitio</label>
                                    <input
                                        type="text"
                                        name="zona_sitio"
                                        value={formData.zona_sitio}
                                        onChange={handleChange}
                                        placeholder="Ej. Segundo piso, Área frontal..."
                                        maxLength={100}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* PASO 2: Trabajo Realizado */}
                {paso === 2 && (
                    <div className={estilos.contenidoPaso}>
                        <section className={estilos.seccion}>
                            <h3 className={estilos.seccionTitulo}>
                                <ion-icon name="document-text-outline"></ion-icon>
                                <span>Trabajo Realizado</span>
                            </h3>

                            {/* Botones de actividades comunes */}
                            <div className={estilos.grupo}>
                                <label>Agregar actividades comunes:</label>
                                <div className={estilos.trabajosComunes}>
                                    {ACTIVIDADES_COMUNES.map(trabajo => (
                                        <button
                                            key={trabajo}
                                            type="button"
                                            onClick={() => handleTrabajoComun(trabajo)}
                                            className={estilos.btnTrabajoComun}
                                        >
                                            <ion-icon name="add-circle-outline"></ion-icon>
                                            <span>{trabajo}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Descripción del trabajo */}
                            <div className={estilos.grupo}>
                                <label>Descripción del Trabajo *</label>
                                <textarea
                                    name="trabajo_realizado"
                                    value={formData.trabajo_realizado}
                                    onChange={handleChange}
                                    rows="10"
                                    placeholder="Describa detalladamente el trabajo realizado...&#10;&#10;Puede usar los botones superiores para agregar actividades comunes."
                                    className={errors.trabajo_realizado ? estilos.inputError : ''}
                                    maxLength={2000}
                                />
                                <div className={estilos.contador}>
                                    {formData.trabajo_realizado.length} / 2000
                                </div>
                                {errors.trabajo_realizado && (
                                    <span className={estilos.errorMsg}>{errors.trabajo_realizado}</span>
                                )}
                            </div>

                            {/* Observaciones */}
                            <div className={estilos.grupo}>
                                <label>Observaciones</label>
                                <textarea
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Algo fuera de lo normal, problemas encontrados, etc..."
                                    maxLength={1000}
                                />
                                <div className={estilos.contador}>
                                    {formData.observaciones.length} / 1000
                                </div>
                            </div>

                            {/* Condiciones climáticas */}
                            <div className={estilos.grupo}>
                                <label>Condiciones Climáticas</label>
                                <div className={estilos.gridClima}>
                                    {Object.values(CONDICIONES_CLIMA).map(clima => {
                                        const formatted = formatearClima(clima)
                                        return (
                                            <button
                                                key={clima}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, condiciones_clima: clima }))}
                                                className={`${estilos.btnClima} ${formData.condiciones_clima === clima ? estilos.btnClimaActivo : ''}`}
                                            >
                                                <span className={estilos.emojiClima}>{formatted.emoji}</span>
                                                <span>{formatted.texto}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* PASO 3: Trabajadores */}
                {paso === 3 && (
                    <div className={estilos.contenidoPaso}>
                        <section className={estilos.seccion}>
                            <div className={estilos.seccionHeader}>
                                <h3 className={estilos.seccionTitulo}>
                                    <ion-icon name="people-outline"></ion-icon>
                                    <span>Trabajadores Presentes</span>
                                </h3>
                                {trabajadores.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={toggleTodosTrabajadores}
                                        className={estilos.btnToggleTodos}
                                    >
                                        {trabajadoresPresentes.length === trabajadores.length 
                                            ? 'Deseleccionar todos'
                                            : 'Seleccionar todos'
                                        }
                                    </button>
                                )}
                            </div>

                            {trabajadores.length === 0 ? (
                                <div className={estilos.vacio}>
                                    <ion-icon name="people-outline"></ion-icon>
                                    <p>No hay trabajadores asignados para esta fecha</p>
                                    <p className={estilos.textoSecundario}>
                                        Se mostrarán todos los trabajadores activos disponibles
                                    </p>
                                </div>
                            ) : (
                                <div className={estilos.listaTrabajadores}>
                                    {trabajadores.map(trabajador => (
                                        <div
                                            key={trabajador.id}
                                            onClick={() => toggleTrabajador(trabajador.id)}
                                            className={`${estilos.trabajadorCard} ${
                                                trabajadoresPresentes.includes(trabajador.id) 
                                                    ? estilos.trabajadorPresente 
                                                    : estilos.trabajadorAusente
                                            }`}
                                        >
                                            <div className={estilos.trabajadorAvatar}>
                                                {trabajador.nombre.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className={estilos.trabajadorInfo}>
                                                <strong>{trabajador.nombre} {trabajador.apellidos || ''}</strong>
                                                <span>{trabajador.rol_especialidad}</span>
                                            </div>
                                            <div className={estilos.trabajadorCheck}>
                                                <ion-icon 
                                                    name={trabajadoresPresentes.includes(trabajador.id) 
                                                        ? "checkmark-circle" 
                                                        : "close-circle"
                                                    }
                                                ></ion-icon>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {errors.trabajadores && (
                                <span className={estilos.errorMsg}>{errors.trabajadores}</span>
                            )}
                        </section>

                        {/* Fotos (opcional) */}
                        <section className={estilos.seccion}>
                            <h3 className={estilos.seccionTitulo}>
                                <ion-icon name="camera-outline"></ion-icon>
                                <span>Fotos (Opcional)</span>
                                <span className={estilos.badge}>{fotos.length}/{CONFIG_FOTOS.MAX_FOTOS}</span>
                            </h3>

                            {fotos.length < CONFIG_FOTOS.MAX_FOTOS && (
                                <div className={estilos.uploadArea}>
                                    <input
                                        type="file"
                                        accept={CONFIG_FOTOS.FORMATOS_PERMITIDOS.join(',')}
                                        multiple
                                        onChange={handleFotosChange}
                                        className={estilos.inputFile}
                                        id="fotos-input"
                                    />
                                    <label htmlFor="fotos-input" className={estilos.uploadLabel}>
                                        <ion-icon name="cloud-upload-outline"></ion-icon>
                                        <span>Subir fotos</span>
                                        <span className={estilos.uploadInfo}>
                                            Máx. {CONFIG_FOTOS.MAX_FOTOS} fotos | {CONFIG_FOTOS.MAX_SIZE_MB}MB cada una
                                        </span>
                                    </label>
                                </div>
                            )}

                            {fotos.length > 0 && (
                                <div className={estilos.fotosGrid}>
                                    {fotos.map(foto => (
                                        <div key={foto.id} className={estilos.fotoPreview}>
                                            <img src={foto.preview} alt="Preview" />
                                            <button
                                                type="button"
                                                onClick={() => eliminarFoto(foto.id)}
                                                className={estilos.btnEliminarFoto}
                                            >
                                                <ion-icon name="close-circle"></ion-icon>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* PASO 4: Revisión */}
                {paso === 4 && (
                    <div className={estilos.contenidoPaso}>
                        <section className={estilos.seccion}>
                            <h3 className={estilos.seccionTitulo}>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>Revisar Información</span>
                            </h3>

                            <div className={estilos.revision}>
                                <div className={estilos.revisionItem}>
                                    <label>Tipo:</label>
                                    <span className={estilos.badge}>
                                        {formData.tipo_destino === TIPOS_DESTINO.OBRA ? '🏗️ Obra' : '⚡ Servicio'}
                                    </span>
                                </div>

                                <div className={estilos.revisionItem}>
                                    <label>Destino:</label>
                                    <span>
                                        {destinosDisponibles.find(d => d.id === parseInt(formData.destino_id))?.nombre || '-'}
                                    </span>
                                </div>

                                <div className={estilos.revisionItem}>
                                    <label>Fecha:</label>
                                    <span>{new Date(formData.fecha_bitacora).toLocaleDateString('es-DO')}</span>
                                </div>

                                {formData.zona_sitio && (
                                    <div className={estilos.revisionItem}>
                                        <label>Zona:</label>
                                        <span>{formData.zona_sitio}</span>
                                    </div>
                                )}

                                <div className={estilos.revisionItem}>
                                    <label>Trabajadores:</label>
                                    <span>{trabajadoresPresentes.length} presentes</span>
                                </div>

                                {formData.condiciones_clima && (
                                    <div className={estilos.revisionItem}>
                                        <label>Clima:</label>
                                        <span>{formatearClima(formData.condiciones_clima).emoji} {formatearClima(formData.condiciones_clima).texto}</span>
                                    </div>
                                )}

                                {fotos.length > 0 && (
                                    <div className={estilos.revisionItem}>
                                        <label>Fotos:</label>
                                        <span>{fotos.length} foto{fotos.length > 1 ? 's' : ''}</span>
                                    </div>
                                )}

                                <div className={estilos.revisionTrabajo}>
                                    <label>Trabajo Realizado:</label>
                                    <p>{formData.trabajo_realizado}</p>
                                </div>

                                {formData.observaciones && (
                                    <div className={estilos.revisionObservaciones}>
                                        <label>Observaciones:</label>
                                        <p>{formData.observaciones}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {/* Footer con botones de navegación */}
                <div className={estilos.formFooter}>
                    <div className={estilos.footerBotones}>
                        {paso > 1 && (
                            <button 
                                type="button" 
                                onClick={pasoAnterior}
                                disabled={procesando}
                                className={estilos.btnSecundario}
                            >
                                <ion-icon name="arrow-back-outline"></ion-icon>
                                <span>Anterior</span>
                            </button>
                        )}
                        
                        {paso < 4 ? (
                            <button 
                                type="button"
                                onClick={siguientePaso}
                                className={estilos.btnPrimario}
                            >
                                <span>Siguiente</span>
                                <ion-icon name="arrow-forward-outline"></ion-icon>
                            </button>
                        ) : (
                            <button 
                                type="submit"
                                disabled={procesando}
                                className={estilos.btnGuardar}
                            >
                                {procesando ? (
                                    <>
                                        <ion-icon name="hourglass-outline" className={estilos.spinning}></ion-icon>
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <ion-icon name="save-outline"></ion-icon>
                                        <span>Guardar Bitácora</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}
