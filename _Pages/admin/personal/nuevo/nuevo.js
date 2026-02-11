"use client"
import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {crearTrabajador} from '../servidor'
import estilos from './nuevo.module.css'
import Image from 'next/image'

export default function NuevoTrabajador() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [procesando, setProcesando] = useState(false)
    const [paso, setPaso] = useState(1) // 1: Datos Personales, 2: Datos Laborales, 3: Revisión
    
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        tipo_documento_id: 1,
        numero_documento: '',
        telefono: '',
        email: '',
        rol_especialidad: '',
        tarifa_por_hora: '',
        tarifa_por_dia: '',
        direccion: '',
        fecha_nacimiento: '',
        genero: '',
        contacto_emergencia: '',
        telefono_emergencia: ''
    })
    
    const [errors, setErrors] = useState({})
    const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)

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

    const roles = [
        { valor: 'Electricista', icono: '⚡', color: '#f59e0b' },
        { valor: 'Albañil', icono: '🧱', color: '#ef4444' },
        { valor: 'Plomero', icono: '🔧', color: '#3b82f6' },
        { valor: 'Ayudante', icono: '👷', color: '#8b5cf6' },
        { valor: 'Carpintero', icono: '🪚', color: '#84cc16' },
        { valor: 'Pintor', icono: '🎨', color: '#ec4899' },
        { valor: 'Soldador', icono: '🔥', color: '#f97316' },
        { valor: 'Herrero', icono: '⚒️', color: '#64748b' },
        { valor: 'Maestro de Obra', icono: '👨‍💼', color: '#14b8a6' },
        { valor: 'Otro', icono: '🔨', color: '#6b7280' }
    ]

    const handleChange = (e) => {
        const {name, value} = e.target
        setFormData(prev => ({...prev, [name]: value}))
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: ''}))
        }
    }

    const validarPaso1 = () => {
        const nuevosErrores = {}
        
        if (!formData.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es requerido'
        }
        
        if (!formData.numero_documento.trim()) {
            nuevosErrores.numero_documento = 'El número de documento es requerido'
        }
        
        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const validarPaso2 = () => {
        const nuevosErrores = {}
        
        if (!formData.rol_especialidad) {
            nuevosErrores.rol_especialidad = 'Debe seleccionar un rol'
        }
        
        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const siguientePaso = () => {
        if (paso === 1 && validarPaso1()) {
            setPaso(2)
        } else if (paso === 2 && validarPaso2()) {
            setPaso(3)
            setMostrarVistaPrevia(true)
        }
    }

    const pasoAnterior = () => {
        if (paso > 1) {
            setPaso(paso - 1)
            setMostrarVistaPrevia(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setProcesando(true)

        const datos = {
            ...formData,
            tarifa_por_hora: formData.tarifa_por_hora ? parseFloat(formData.tarifa_por_hora) : null,
            tarifa_por_dia: formData.tarifa_por_dia ? parseFloat(formData.tarifa_por_dia) : null
        }

        const res = await crearTrabajador(datos)
        setProcesando(false)

        if (res.success) {
            // Mostrar mensaje de éxito
            alert('✅ Trabajador creado exitosamente')
            router.push('/admin/personal')
        } else {
            if (res.errores) {
                setErrors(res.errores)
                setPaso(1) // Volver al primer paso si hay errores
            } else {
                alert(res.mensaje || 'Error al crear el trabajador')
            }
        }
    }

    const seleccionarRol = (rol) => {
        setFormData(prev => ({...prev, rol_especialidad: rol}))
        if (errors.rol_especialidad) {
            setErrors(prev => ({...prev, rol_especialidad: ''}))
        }
    }

    const rolSeleccionado = roles.find(r => r.valor === formData.rol_especialidad)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Nuevo Trabajador</h1>
                    <p className={estilos.subtitulo}>
                        Registra un nuevo miembro del equipo en {paso === 1 ? '3' : paso === 2 ? '2' : '1'} simples pasos
                    </p>
                </div>
                <button className={estilos.btnCancelar} onClick={() => router.back()}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Volver</span>
                </button>
            </div>

            {/* Indicador de progreso */}
            <div className={estilos.progresoContainer}>
                <div className={estilos.pasos}>
                    <div className={`${estilos.paso} ${paso >= 1 ? estilos.pasoActivo : ''}`}>
                        <div className={estilos.pasoNumero}>
                            {paso > 1 ? <ion-icon name="checkmark-outline"></ion-icon> : '1'}
                        </div>
                        <div className={estilos.pasoInfo}>
                            <p className={estilos.pasoTitulo}>Datos Personales</p>
                            <p className={estilos.pasoDesc}>Información básica</p>
                        </div>
                    </div>
                    <div className={`${estilos.lineaProgreso} ${paso >= 2 ? estilos.lineaActiva : ''}`}></div>
                    <div className={`${estilos.paso} ${paso >= 2 ? estilos.pasoActivo : ''}`}>
                        <div className={estilos.pasoNumero}>
                            {paso > 2 ? <ion-icon name="checkmark-outline"></ion-icon> : '2'}
                        </div>
                        <div className={estilos.pasoInfo}>
                            <p className={estilos.pasoTitulo}>Datos Laborales</p>
                            <p className={estilos.pasoDesc}>Rol y tarifas</p>
                        </div>
                    </div>
                    <div className={`${estilos.lineaProgreso} ${paso >= 3 ? estilos.lineaActiva : ''}`}></div>
                    <div className={`${estilos.paso} ${paso >= 3 ? estilos.pasoActivo : ''}`}>
                        <div className={estilos.pasoNumero}>3</div>
                        <div className={estilos.pasoInfo}>
                            <p className={estilos.pasoTitulo}>Revisión</p>
                            <p className={estilos.pasoDesc}>Confirmar datos</p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className={estilos.formulario}>
                {/* PASO 1: Datos Personales */}
                {paso === 1 && (
                    <div className={estilos.layoutPrincipal}>
                        <div className={estilos.columnaIzquierda}>
                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <h3 className={estilos.tituloSeccion}>
                                    <ion-icon name="person-outline"></ion-icon>
                                    Información Personal
                                </h3>
                                
                                <div className={estilos.grid2}>
                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>
                                            Nombre *
                                            <span className={estilos.required}>Requerido</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]} ${errors.nombre ? estilos.inputError : ''}`}
                                            placeholder="Juan"
                                        />
                                        {errors.nombre && (
                                            <span className={estilos.errorMsg}>
                                                <ion-icon name="alert-circle-outline"></ion-icon>
                                                {errors.nombre}
                                            </span>
                                        )}
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>Apellidos</label>
                                        <input
                                            type="text"
                                            name="apellidos"
                                            value={formData.apellidos}
                                            onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]}`}
                                            placeholder="Pérez García"
                                        />
                                    </div>
                                </div>

                                <div className={estilos.grid2}>
                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>
                                            Número de Documento *
                                            <span className={estilos.required}>Requerido</span>
                                        </label>
                                        <div className={estilos.inputConIcono}>
                                            <ion-icon name="card-outline"></ion-icon>
                                            <input
                                                type="text"
                                                name="numero_documento"
                                                value={formData.numero_documento}
                                                onChange={handleChange}
                                                className={`${estilos.input} ${estilos[tema]} ${errors.numero_documento ? estilos.inputError : ''}`}
                                                placeholder="000-0000000-0"
                                            />
                                        </div>
                                        {errors.numero_documento && (
                                            <span className={estilos.errorMsg}>
                                                <ion-icon name="alert-circle-outline"></ion-icon>
                                                {errors.numero_documento}
                                            </span>
                                        )}
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            name="fecha_nacimiento"
                                            value={formData.fecha_nacimiento}
                                            onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]}`}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>Género</label>
                                    <div className={estilos.radioGroup}>
                                        <label className={`${estilos.radioOpcion} ${estilos[tema]} ${formData.genero === 'masculino' ? estilos.radioSeleccionado : ''}`}>
                                            <input
                                                type="radio"
                                                name="genero"
                                                value="masculino"
                                                checked={formData.genero === 'masculino'}
                                                onChange={handleChange}
                                            />
                                            <span>Masculino</span>
                                        </label>
                                        <label className={`${estilos.radioOpcion} ${estilos[tema]} ${formData.genero === 'femenino' ? estilos.radioSeleccionado : ''}`}>
                                            <input
                                                type="radio"
                                                name="genero"
                                                value="femenino"
                                                checked={formData.genero === 'femenino'}
                                                onChange={handleChange}
                                            />
                                            <span>Femenino</span>
                                        </label>
                                        <label className={`${estilos.radioOpcion} ${estilos[tema]} ${formData.genero === 'otro' ? estilos.radioSeleccionado : ''}`}>
                                            <input
                                                type="radio"
                                                name="genero"
                                                value="otro"
                                                checked={formData.genero === 'otro'}
                                                onChange={handleChange}
                                            />
                                            <span>Otro</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <h3 className={estilos.tituloSeccion}>
                                    <ion-icon name="call-outline"></ion-icon>
                                    Información de Contacto
                                </h3>
                                
                                <div className={estilos.grid2}>
                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>Teléfono</label>
                                        <div className={estilos.inputConIcono}>
                                            <ion-icon name="call-outline"></ion-icon>
                                            <input
                                                type="tel"
                                                name="telefono"
                                                value={formData.telefono}
                                                onChange={handleChange}
                                                className={`${estilos.input} ${estilos[tema]}`}
                                                placeholder="(809) 555-5555"
                                            />
                                        </div>
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>Email</label>
                                        <div className={estilos.inputConIcono}>
                                            <ion-icon name="mail-outline"></ion-icon>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`${estilos.input} ${estilos[tema]}`}
                                                placeholder="correo@ejemplo.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>Dirección</label>
                                    <textarea
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleChange}
                                        className={`${estilos.textarea} ${estilos[tema]}`}
                                        rows="3"
                                        placeholder="Dirección completa..."
                                    />
                                </div>

                                <div className={estilos.grid2}>
                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>Contacto de Emergencia</label>
                                        <input
                                            type="text"
                                            name="contacto_emergencia"
                                            value={formData.contacto_emergencia}
                                            onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]}`}
                                            placeholder="Nombre del contacto"
                                        />
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>Teléfono de Emergencia</label>
                                        <div className={estilos.inputConIcono}>
                                            <ion-icon name="call-outline"></ion-icon>
                                            <input
                                                type="tel"
                                                name="telefono_emergencia"
                                                value={formData.telefono_emergencia}
                                                onChange={handleChange}
                                                className={`${estilos.input} ${estilos[tema]}`}
                                                placeholder="(809) 555-5555"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={estilos.columnaDerecha}>
                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <div className={estilos.ilustracionCard}>
                                    <Image
                                        src="/illustrations3D/_0008.svg"
                                        alt="Nuevo trabajador"
                                        width={300}
                                        height={300}
                                        className={estilos.ilustracion}
                                    />
                                    <h4>Datos Personales</h4>
                                    <p>Completa la información básica del trabajador para continuar al siguiente paso.</p>
                                </div>
                            </div>

                            <div className={`${estilos.seccionInfo} ${estilos[tema]}`}>
                                <div className={estilos.infoHeader}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <h4>Información Importante</h4>
                                </div>
                                <ul className={estilos.listaInfo}>
                                    <li>Los campos marcados con * son obligatorios</li>
                                    <li>El número de documento debe ser único</li>
                                    <li>El teléfono facilitará la comunicación</li>
                                    <li>El contacto de emergencia es opcional pero recomendado</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* PASO 2: Datos Laborales */}
                {paso === 2 && (
                    <div className={estilos.layoutPrincipal}>
                        <div className={estilos.columnaIzquierda}>
                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <h3 className={estilos.tituloSeccion}>
                                    <ion-icon name="construct-outline"></ion-icon>
                                    Rol y Especialidad
                                </h3>
                                
                                <div className={estilos.grupo}>
                                    <label className={estilos.label}>
                                        Selecciona el rol del trabajador *
                                        <span className={estilos.required}>Requerido</span>
                                    </label>
                                    <div className={estilos.rolesGrid}>
                                        {roles.map(rol => (
                                            <button
                                                key={rol.valor}
                                                type="button"
                                                onClick={() => seleccionarRol(rol.valor)}
                                                className={`${estilos.rolCard} ${estilos[tema]} ${formData.rol_especialidad === rol.valor ? estilos.rolSeleccionado : ''}`}
                                                style={{'--rol-color': rol.color}}
                                            >
                                                <span className={estilos.rolIcono}>{rol.icono}</span>
                                                <span className={estilos.rolNombre}>{rol.valor}</span>
                                                {formData.rol_especialidad === rol.valor && (
                                                    <div className={estilos.checkMarca}>
                                                        <ion-icon name="checkmark-circle"></ion-icon>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.rol_especialidad && (
                                        <span className={estilos.errorMsg}>
                                            <ion-icon name="alert-circle-outline"></ion-icon>
                                            {errors.rol_especialidad}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <h3 className={estilos.tituloSeccion}>
                                    <ion-icon name="cash-outline"></ion-icon>
                                    Tarifas y Compensación
                                </h3>
                                
                                <div className={estilos.grid2}>
                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>Tarifa por Hora (RD$)</label>
                                        <div className={estilos.inputConPrefijo}>
                                            <span className={estilos.prefijo}>RD$</span>
                                            <input
                                                type="number"
                                                name="tarifa_por_hora"
                                                value={formData.tarifa_por_hora}
                                                onChange={handleChange}
                                                className={`${estilos.input} ${estilos[tema]}`}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        <span className={estilos.ayuda}>Tarifa estándar por hora de trabajo</span>
                                    </div>

                                    <div className={estilos.grupo}>
                                        <label className={estilos.label}>Tarifa por Día (RD$)</label>
                                        <div className={estilos.inputConPrefijo}>
                                            <span className={estilos.prefijo}>RD$</span>
                                            <input
                                                type="number"
                                                name="tarifa_por_dia"
                                                value={formData.tarifa_por_dia}
                                                onChange={handleChange}
                                                className={`${estilos.input} ${estilos[tema]}`}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        <span className={estilos.ayuda}>Tarifa por jornada completa</span>
                                    </div>
                                </div>

                                {(formData.tarifa_por_hora || formData.tarifa_por_dia) && (
                                    <div className={`${estilos.resumenTarifas} ${estilos[tema]}`}>
                                        <h4>Estimación de Costos</h4>
                                        <div className={estilos.tarifasInfo}>
                                            {formData.tarifa_por_hora && (
                                                <div className={estilos.tarifaItem}>
                                                    <span>Por hora:</span>
                                                    <strong>RD$ {parseFloat(formData.tarifa_por_hora).toFixed(2)}</strong>
                                                </div>
                                            )}
                                            {formData.tarifa_por_dia && (
                                                <div className={estilos.tarifaItem}>
                                                    <span>Por día:</span>
                                                    <strong>RD$ {parseFloat(formData.tarifa_por_dia).toFixed(2)}</strong>
                                                </div>
                                            )}
                                            {formData.tarifa_por_dia && (
                                                <div className={estilos.tarifaItem}>
                                                    <span>Semanal (5 días):</span>
                                                    <strong>RD$ {(parseFloat(formData.tarifa_por_dia) * 5).toFixed(2)}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={estilos.columnaDerecha}>
                            {rolSeleccionado && (
                                <div className={`${estilos.seccionDestacada} ${estilos[tema]}`}>
                                    <div className={estilos.rolPreview}>
                                        <div className={estilos.rolPreviewIcono} style={{background: rolSeleccionado.color}}>
                                            <span>{rolSeleccionado.icono}</span>
                                        </div>
                                        <h3>Rol Seleccionado</h3>
                                        <p className={estilos.rolPreviewNombre}>{rolSeleccionado.valor}</p>
                                        <div className={estilos.rolPreviewBadge}>
                                            <ion-icon name="checkmark-circle"></ion-icon>
                                            <span>Confirmado</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <div className={estilos.ilustracionCard}>
                                    <Image
                                        src="/illustrations3D/_0015.svg"
                                        alt="Configuración laboral"
                                        width={250}
                                        height={250}
                                        className={estilos.ilustracion}
                                    />
                                    <h4>Configuración Laboral</h4>
                                    <p>Define el rol y las tarifas del trabajador según su especialidad.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PASO 3: Revisión y Confirmación */}
                {paso === 3 && (
                    <div className={estilos.vistaPrevia}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                Revisión Final
                            </h3>

                            <div className={estilos.resumenCompleto}>
                                <div className={estilos.resumenHeader}>
                                    <div className={estilos.avatarGrande}>
                                        {formData.nombre.charAt(0)}{formData.apellidos ? formData.apellidos.charAt(0) : ''}
                                    </div>
                                    <div>
                                        <h2>{formData.nombre} {formData.apellidos}</h2>
                                        {rolSeleccionado && (
                                            <div className={estilos.rolBadgeLarge} style={{background: `${rolSeleccionado.color}20`, color: rolSeleccionado.color}}>
                                                <span>{rolSeleccionado.icono}</span>
                                                {rolSeleccionado.valor}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={estilos.resumenSecciones}>
                                    <div className={estilos.resumenSeccion}>
                                        <h4>
                                            <ion-icon name="person-outline"></ion-icon>
                                            Datos Personales
                                        </h4>
                                        <div className={estilos.resumenDatos}>
                                            <div className={estilos.resumenItem}>
                                                <span className={estilos.resumenLabel}>Documento:</span>
                                                <span className={estilos.resumenValor}>{formData.numero_documento}</span>
                                            </div>
                                            {formData.fecha_nacimiento && (
                                                <div className={estilos.resumenItem}>
                                                    <span className={estilos.resumenLabel}>Fecha de Nacimiento:</span>
                                                    <span className={estilos.resumenValor}>{formData.fecha_nacimiento}</span>
                                                </div>
                                            )}
                                            {formData.genero && (
                                                <div className={estilos.resumenItem}>
                                                    <span className={estilos.resumenLabel}>Género:</span>
                                                    <span className={estilos.resumenValor}>{formData.genero}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={estilos.resumenSeccion}>
                                        <h4>
                                            <ion-icon name="call-outline"></ion-icon>
                                            Contacto
                                        </h4>
                                        <div className={estilos.resumenDatos}>
                                            {formData.telefono && (
                                                <div className={estilos.resumenItem}>
                                                    <span className={estilos.resumenLabel}>Teléfono:</span>
                                                    <span className={estilos.resumenValor}>{formData.telefono}</span>
                                                </div>
                                            )}
                                            {formData.email && (
                                                <div className={estilos.resumenItem}>
                                                    <span className={estilos.resumenLabel}>Email:</span>
                                                    <span className={estilos.resumenValor}>{formData.email}</span>
                                                </div>
                                            )}
                                            {formData.direccion && (
                                                <div className={estilos.resumenItem}>
                                                    <span className={estilos.resumenLabel}>Dirección:</span>
                                                    <span className={estilos.resumenValor}>{formData.direccion}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={estilos.resumenSeccion}>
                                        <h4>
                                            <ion-icon name="cash-outline"></ion-icon>
                                            Tarifas
                                        </h4>
                                        <div className={estilos.resumenDatos}>
                                            {formData.tarifa_por_hora && (
                                                <div className={estilos.resumenItem}>
                                                    <span className={estilos.resumenLabel}>Por Hora:</span>
                                                    <span className={estilos.resumenValorDestacado}>
                                                        RD$ {parseFloat(formData.tarifa_por_hora).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            {formData.tarifa_por_dia && (
                                                <div className={estilos.resumenItem}>
                                                    <span className={estilos.resumenLabel}>Por Día:</span>
                                                    <span className={estilos.resumenValorDestacado}>
                                                        RD$ {parseFloat(formData.tarifa_por_dia).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botones de navegación */}
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
                            {paso < 3 ? (
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
                                            Creando...
                                        </>
                                    ) : (
                                        <>
                                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                                            Crear Trabajador
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
