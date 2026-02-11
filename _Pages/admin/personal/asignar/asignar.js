"use client"
import {useState, useEffect} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {asignarTrabajador, obtenerTrabajadores, obtenerObrasYServicios} from '../servidor'
import estilos from './asignar.module.css'
import Image from 'next/image'

export default function AsignarPersonal() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const trabajadorIdParam = searchParams.get('trabajador')

    const [tema, setTema] = useState('light')
    const [paso, setPaso] = useState(1) // 1: Trabajador, 2: Destino, 3: Detalles, 4: Confirmar
    const [trabajadores, setTrabajadores] = useState([])
    const [obras, setObras] = useState([])
    const [servicios, setServicios] = useState([])
    const [formData, setFormData] = useState({
        trabajador_id: trabajadorIdParam || '',
        tipo_destino: 'obra',
        destino_id: '',
        fecha_asignacion: new Date().toISOString().split('T')[0],
        hora_inicio: '08:00',
        hora_fin: '',
        actividad: '',
        zona_trabajo: ''
    })
    const [errors, setErrors] = useState({})
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null)
    const [destinoSeleccionado, setDestinoSeleccionado] = useState(null)

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
        if (formData.trabajador_id) {
            const trabajador = trabajadores.find(t => t.id === parseInt(formData.trabajador_id))
            setTrabajadorSeleccionado(trabajador)
        }
    }, [formData.trabajador_id, trabajadores])

    useEffect(() => {
        if (formData.destino_id) {
            const destinos = formData.tipo_destino === 'obra' ? obras : servicios
            const destino = destinos.find(d => d.id === parseInt(formData.destino_id))
            setDestinoSeleccionado(destino)
        }
    }, [formData.destino_id, formData.tipo_destino, obras, servicios])

    async function cargarDatos() {
        setCargando(true)

        const [resTrabajadores, resDestinos] = await Promise.all([
            obtenerTrabajadores({estado: 'activo'}),
            obtenerObrasYServicios()
        ])

        if (resTrabajadores.success) {
            setTrabajadores(resTrabajadores.trabajadores)
        }

        if (resDestinos.success) {
            setObras(resDestinos.obras || [])
            setServicios(resDestinos.servicios || [])
        }

        setCargando(false)
    }

    const handleChange = (e) => {
        const {name, value} = e.target
        setFormData(prev => ({...prev, [name]: value}))
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: ''}))
        }
    }

    const seleccionarTrabajador = (trabajadorId) => {
        setFormData(prev => ({...prev, trabajador_id: trabajadorId.toString()}))
        if (errors.trabajador_id) {
            setErrors(prev => ({...prev, trabajador_id: ''}))
        }
    }

    const seleccionarDestino = (destinoId) => {
        setFormData(prev => ({...prev, destino_id: destinoId.toString()}))
        if (errors.destino_id) {
            setErrors(prev => ({...prev, destino_id: ''}))
        }
    }

    const validarPaso1 = () => {
        const nuevosErrores = {}
        if (!formData.trabajador_id) {
            nuevosErrores.trabajador_id = 'Debe seleccionar un trabajador'
        }
        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const validarPaso2 = () => {
        const nuevosErrores = {}
        if (!formData.destino_id) {
            nuevosErrores.destino_id = 'Debe seleccionar un destino'
        }
        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const validarPaso3 = () => {
        const nuevosErrores = {}
        if (!formData.fecha_asignacion) {
            nuevosErrores.fecha_asignacion = 'La fecha es requerida'
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
        setProcesando(true)

        const res = await asignarTrabajador(formData)
        setProcesando(false)

        if (res.success) {
            alert('✅ Personal asignado exitosamente')
            router.push('/admin/personal')
        } else {
            if (res.errores) {
                setErrors(res.errores)
                setPaso(1)
            } else {
                alert(res.mensaje || 'Error al asignar trabajador')
            }
        }
    }

    const destinosDisponibles = formData.tipo_destino === 'obra' ? obras : servicios

    const calcularHorasEstimadas = () => {
        if (formData.hora_inicio && formData.hora_fin) {
            const [horaIni, minIni] = formData.hora_inicio.split(':').map(Number)
            const [horaFin, minFin] = formData.hora_fin.split(':').map(Number)
            const totalMinutos = (horaFin * 60 + minFin) - (horaIni * 60 + minIni)
            return (totalMinutos / 60).toFixed(1)
        }
        return 0
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Asignar Personal</h1>
                    <p className={estilos.subtitulo}>
                        Asigna trabajadores a obras o servicios en {4 - paso + 1} pasos
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
                            <p className={estilos.pasoTitulo}>Trabajador</p>
                            <p className={estilos.pasoDesc}>Seleccionar persona</p>
                        </div>
                    </div>
                    <div className={`${estilos.lineaProgreso} ${paso >= 2 ? estilos.lineaActiva : ''}`}></div>
                    <div className={`${estilos.paso} ${paso >= 2 ? estilos.pasoActivo : ''}`}>
                        <div className={estilos.pasoNumero}>
                            {paso > 2 ? <ion-icon name="checkmark-outline"></ion-icon> : '2'}
                        </div>
                        <div className={estilos.pasoInfo}>
                            <p className={estilos.pasoTitulo}>Destino</p>
                            <p className={estilos.pasoDesc}>Obra o servicio</p>
                        </div>
                    </div>
                    <div className={`${estilos.lineaProgreso} ${paso >= 3 ? estilos.lineaActiva : ''}`}></div>
                    <div className={`${estilos.paso} ${paso >= 3 ? estilos.pasoActivo : ''}`}>
                        <div className={estilos.pasoNumero}>
                            {paso > 3 ? <ion-icon name="checkmark-outline"></ion-icon> : '3'}
                        </div>
                        <div className={estilos.pasoInfo}>
                            <p className={estilos.pasoTitulo}>Detalles</p>
                            <p className={estilos.pasoDesc}>Fecha y horario</p>
                        </div>
                    </div>
                    <div className={`${estilos.lineaProgreso} ${paso >= 4 ? estilos.lineaActiva : ''}`}></div>
                    <div className={`${estilos.paso} ${paso >= 4 ? estilos.pasoActivo : ''}`}>
                        <div className={estilos.pasoNumero}>4</div>
                        <div className={estilos.pasoInfo}>
                            <p className={estilos.pasoTitulo}>Confirmar</p>
                            <p className={estilos.pasoDesc}>Revisar y guardar</p>
                        </div>
                    </div>
                </div>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <p>Cargando información...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={estilos.formulario}>
                    {/* PASO 1: Seleccionar Trabajador */}
                    {paso === 1 && (
                        <div className={estilos.layoutPrincipal}>
                            <div className={estilos.columnaIzquierda}>
                                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                    <h3 className={estilos.tituloSeccion}>
                                        <ion-icon name="people-outline"></ion-icon>
                                        Seleccionar Trabajador
                                    </h3>

                                    <div className={estilos.busquedaRapida}>
                                        <ion-icon name="search-outline"></ion-icon>
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre o rol..."
                                            className={`${estilos.inputBusqueda} ${estilos[tema]}`}
                                        />
                                    </div>

                                    {trabajadores.length === 0 ? (
                                        <div className={estilos.mensajeVacio}>
                                            <ion-icon name="person-add-outline"></ion-icon>
                                            <p>No hay trabajadores disponibles</p>
                                        </div>
                                    ) : (
                                        <div className={estilos.listaTrabajadores}>
                                            {trabajadores.map(trabajador => (
                                                <div
                                                    key={trabajador.id}
                                                    onClick={() => seleccionarTrabajador(trabajador.id)}
                                                    className={`${estilos.cardTrabajador} ${estilos[tema]} ${
                                                        formData.trabajador_id === trabajador.id.toString() ? estilos.cardSeleccionado : ''
                                                    }`}
                                                >
                                                    <div className={estilos.trabajadorAvatar}>
                                                        {trabajador.nombre.charAt(0)}
                                                        {trabajador.apellidos ? trabajador.apellidos.charAt(0) : ''}
                                                    </div>
                                                    <div className={estilos.trabajadorInfo}>
                                                        <h4>{trabajador.nombre} {trabajador.apellidos}</h4>
                                                        <p className={estilos.trabajadorRol}>{trabajador.rol_especialidad}</p>
                                                        {trabajador.asignaciones_activas > 0 && (
                                                            <span className={estilos.badgeOcupado}>
                                                                {trabajador.asignaciones_activas} asignación activa
                                                            </span>
                                                        )}
                                                    </div>
                                                    {formData.trabajador_id === trabajador.id.toString() && (
                                                        <div className={estilos.checkSeleccionado}>
                                                            <ion-icon name="checkmark-circle"></ion-icon>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.trabajador_id && (
                                        <span className={estilos.errorMsg}>
                                            <ion-icon name="alert-circle-outline"></ion-icon>
                                            {errors.trabajador_id}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={estilos.columnaDerecha}>
                                {trabajadorSeleccionado ? (
                                    <div className={`${estilos.seccionDestacada} ${estilos[tema]}`}>
                                        <h3>Trabajador Seleccionado</h3>
                                        <div className={estilos.trabajadorPreview}>
                                            <div className={estilos.avatarGrande}>
                                                {trabajadorSeleccionado.nombre.charAt(0)}
                                                {trabajadorSeleccionado.apellidos ? trabajadorSeleccionado.apellidos.charAt(0) : ''}
                                            </div>
                                            <h2>{trabajadorSeleccionado.nombre} {trabajadorSeleccionado.apellidos}</h2>
                                            <div className={estilos.rolBadge}>{trabajadorSeleccionado.rol_especialidad}</div>
                                            <div className={estilos.infoLista}>
                                                {trabajadorSeleccionado.telefono && (
                                                    <div className={estilos.infoItem}>
                                                        <ion-icon name="call-outline"></ion-icon>
                                                        <span>{trabajadorSeleccionado.telefono}</span>
                                                    </div>
                                                )}
                                                {trabajadorSeleccionado.tarifa_por_hora && (
                                                    <div className={estilos.infoItem}>
                                                        <ion-icon name="cash-outline"></ion-icon>
                                                        <span>RD${trabajadorSeleccionado.tarifa_por_hora}/h</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                        <div className={estilos.ilustracionCard}>
                                            <Image
                                                src="/illustrations3D/_0008.svg"
                                                alt="Seleccionar trabajador"
                                                width={250}
                                                height={250}
                                                className={estilos.ilustracion}
                                            />
                                            <h4>Selecciona un Trabajador</h4>
                                            <p>Elige al trabajador que deseas asignar a una obra o servicio</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PASO 2: Seleccionar Destino */}
                    {paso === 2 && (
                        <div className={estilos.layoutPrincipal}>
                            <div className={estilos.columnaIzquierda}>
                                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                    <h3 className={estilos.tituloSeccion}>
                                        <ion-icon name="briefcase-outline"></ion-icon>
                                        Tipo de Destino
                                    </h3>

                                    <div className={estilos.tipoDestinoGrid}>
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({...prev, tipo_destino: 'obra', destino_id: ''}))
                                                setDestinoSeleccionado(null)
                                            }}
                                            className={`${estilos.tipoDestinoCard} ${estilos[tema]} ${
                                                formData.tipo_destino === 'obra' ? estilos.tipoDestinoActivo : ''
                                            }`}
                                        >
                                            <div className={estilos.tipoDestinoIcono}>🏗️</div>
                                            <h4>Obra</h4>
                                            <p>Proyectos de construcción</p>
                                            {formData.tipo_destino === 'obra' && (
                                                <div className={estilos.checkTipo}>
                                                    <ion-icon name="checkmark-circle"></ion-icon>
                                                </div>
                                            )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({...prev, tipo_destino: 'servicio', destino_id: ''}))
                                                setDestinoSeleccionado(null)
                                            }}
                                            className={`${estilos.tipoDestinoCard} ${estilos[tema]} ${
                                                formData.tipo_destino === 'servicio' ? estilos.tipoDestinoActivo : ''
                                            }`}
                                        >
                                            <div className={estilos.tipoDestinoIcono}>⚡</div>
                                            <h4>Servicio</h4>
                                            <p>Trabajos puntuales</p>
                                            {formData.tipo_destino === 'servicio' && (
                                                <div className={estilos.checkTipo}>
                                                    <ion-icon name="checkmark-circle"></ion-icon>
                                                </div>
                                            )}
                            </button>
                        </div>
                                </div>

                                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                    <h3 className={estilos.tituloSeccion}>
                                        <ion-icon name="location-outline"></ion-icon>
                                        Seleccionar {formData.tipo_destino === 'obra' ? 'Obra' : 'Servicio'}
                                    </h3>

                                    {destinosDisponibles.length === 0 ? (
                                        <div className={estilos.mensajeVacio}>
                                            <ion-icon name="add-circle-outline"></ion-icon>
                                            <p>No hay {formData.tipo_destino === 'obra' ? 'obras' : 'servicios'} disponibles</p>
                                        </div>
                                    ) : (
                                        <div className={estilos.listaDestinos}>
                                            {destinosDisponibles.map(destino => (
                                                <div
                                                    key={destino.id}
                                                    onClick={() => seleccionarDestino(destino.id)}
                                                    className={`${estilos.cardDestino} ${estilos[tema]} ${
                                                        formData.destino_id === destino.id.toString() ? estilos.cardSeleccionado : ''
                                                    }`}
                                                >
                                                    <div className={estilos.destinoIcono}>
                                                        {formData.tipo_destino === 'obra' ? '🏗️' : '⚡'}
                                                    </div>
                                                    <div className={estilos.destinoInfo}>
                                                        {destino.codigo_obra && (
                                                            <span className={estilos.codigoDestino}>{destino.codigo_obra}</span>
                                                        )}
                                                        <h4>{destino.nombre}</h4>
                                                        {destino.ubicacion && (
                                                            <p className={estilos.ubicacion}>
                                                                <ion-icon name="location-outline"></ion-icon>
                                                                {destino.ubicacion}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {formData.destino_id === destino.id.toString() && (
                                                        <div className={estilos.checkSeleccionado}>
                                                            <ion-icon name="checkmark-circle"></ion-icon>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.destino_id && (
                                        <span className={estilos.errorMsg}>
                                            <ion-icon name="alert-circle-outline"></ion-icon>
                                            {errors.destino_id}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={estilos.columnaDerecha}>
                                {destinoSeleccionado ? (
                                    <div className={`${estilos.seccionDestacada} ${estilos[tema]}`}>
                                        <h3>Destino Seleccionado</h3>
                                        <div className={estilos.destinoPreview}>
                                            <div className={estilos.destinoPreviewIcono}>
                                                {formData.tipo_destino === 'obra' ? '🏗️' : '⚡'}
                                            </div>
                                            <div className={estilos.tipoBadge}>
                                                {formData.tipo_destino === 'obra' ? 'Obra' : 'Servicio'}
                                            </div>
                                            <h2>{destinoSeleccionado.nombre}</h2>
                                            {destinoSeleccionado.codigo_obra && (
                                                <p className={estilos.codigo}>Código: {destinoSeleccionado.codigo_obra}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                        <div className={estilos.ilustracionCard}>
                                            <Image
                                                src="/illustrations3D/_0015.svg"
                                                alt="Seleccionar destino"
                                                width={250}
                                                height={250}
                                                className={estilos.ilustracion}
                                            />
                                            <h4>Selecciona el Destino</h4>
                                            <p>Elige la obra o servicio donde trabajará</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PASO 3: Detalles de Asignación */}
                    {paso === 3 && (
                        <div className={estilos.layoutPrincipal}>
                            <div className={estilos.columnaIzquierda}>
                                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                    <h3 className={estilos.tituloSeccion}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        Fecha y Horario
                                    </h3>

                            <div className={estilos.grupo}>
                                        <label className={estilos.label}>
                                            Fecha de Asignación *
                                            <span className={estilos.required}>Requerido</span>
                                        </label>
                                <input
                                    type="date"
                                    name="fecha_asignacion"
                                    value={formData.fecha_asignacion}
                                    onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]} ${errors.fecha_asignacion ? estilos.inputError : ''}`}
                                        />
                                        {errors.fecha_asignacion && (
                                            <span className={estilos.errorMsg}>
                                                <ion-icon name="alert-circle-outline"></ion-icon>
                                                {errors.fecha_asignacion}
                                            </span>
                                        )}
                            </div>

                                    <div className={estilos.grid2}>
                            <div className={estilos.grupo}>
                                            <label className={estilos.label}>Hora de Inicio</label>
                                            <div className={estilos.inputConIcono}>
                                                <ion-icon name="time-outline"></ion-icon>
                                <input
                                    type="time"
                                    name="hora_inicio"
                                    value={formData.hora_inicio}
                                    onChange={handleChange}
                                                    className={`${estilos.input} ${estilos[tema]}`}
                                />
                            </div>
                                        </div>

                            <div className={estilos.grupo}>
                                            <label className={estilos.label}>Hora de Fin (Opcional)</label>
                                            <div className={estilos.inputConIcono}>
                                                <ion-icon name="time-outline"></ion-icon>
                                <input
                                    type="time"
                                    name="hora_fin"
                                    value={formData.hora_fin}
                                    onChange={handleChange}
                                                    className={`${estilos.input} ${estilos[tema]}`}
                                />
                            </div>
                        </div>
                                    </div>

                                    {formData.hora_inicio && formData.hora_fin && calcularHorasEstimadas() > 0 && (
                                        <div className={`${estilos.infoHoras} ${estilos[tema]}`}>
                                            <ion-icon name="timer-outline"></ion-icon>
                                            <span>Horas estimadas: <strong>{calcularHorasEstimadas()}h</strong></span>
                                        </div>
                                    )}
                                </div>

                                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                    <h3 className={estilos.tituloSeccion}>
                                        <ion-icon name="document-text-outline"></ion-icon>
                                        Detalles Adicionales
                                    </h3>

                        <div className={estilos.grupo}>
                                        <label className={estilos.label}>Actividad</label>
                            <input
                                type="text"
                                name="actividad"
                                value={formData.actividad}
                                onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]}`}
                                            placeholder="Ej. Instalación eléctrica, Reparación de tubería..."
                            />
                                        <span className={estilos.ayuda}>Describe la tarea principal a realizar</span>
                        </div>

                        <div className={estilos.grupo}>
                                        <label className={estilos.label}>Zona de Trabajo</label>
                            <input
                                type="text"
                                name="zona_trabajo"
                                value={formData.zona_trabajo}
                                onChange={handleChange}
                                            className={`${estilos.input} ${estilos[tema]}`}
                                            placeholder="Ej. Segundo piso, Área frontal, Zona A..."
                                        />
                                        <span className={estilos.ayuda}>Ubicación específica dentro del destino</span>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.columnaDerecha}>
                                <div className={`${estilos.seccionInfo} ${estilos[tema]}`}>
                                    <div className={estilos.infoHeader}>
                                        <ion-icon name="information-circle-outline"></ion-icon>
                                        <h4>Información de Asignación</h4>
                                    </div>
                                    <div className={estilos.resumenDetalles}>
                                        <div className={estilos.detalleItem}>
                                            <span className={estilos.detalleLabel}>Fecha:</span>
                                            <span className={estilos.detalleValor}>
                                                {new Date(formData.fecha_asignacion).toLocaleDateString('es-DO', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        {formData.hora_inicio && (
                                            <div className={estilos.detalleItem}>
                                                <span className={estilos.detalleLabel}>Horario:</span>
                                                <span className={estilos.detalleValor}>
                                                    {formData.hora_inicio} {formData.hora_fin && `- ${formData.hora_fin}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                    <div className={estilos.ilustracionCard}>
                                        <Image
                                            src="/illustrations3D/_0008.svg"
                                            alt="Detalles"
                                            width={200}
                                            height={200}
                                            className={estilos.ilustracion}
                                        />
                                        <h4>Últimos Detalles</h4>
                                        <p>Define cuándo y dónde trabajará el personal</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 4: Confirmación */}
                    {paso === 4 && (
                        <div className={estilos.vistaPrevia}>
                            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                                <h3 className={estilos.tituloSeccion}>
                                    <ion-icon name="checkmark-done-outline"></ion-icon>
                                    Confirmar Asignación
                                </h3>

                                <div className={estilos.resumenCompleto}>
                                    <div className={estilos.resumenCard}>
                                        <div className={estilos.resumenHeader}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            <h4>Trabajador</h4>
                                        </div>
                                        {trabajadorSeleccionado && (
                                            <div className={estilos.resumenContenido}>
                                                <div className={estilos.avatarResumen}>
                                                    {trabajadorSeleccionado.nombre.charAt(0)}
                                                    {trabajadorSeleccionado.apellidos ? trabajadorSeleccionado.apellidos.charAt(0) : ''}
                                                </div>
                                                <div>
                                                    <p className={estilos.nombreResumen}>
                                                        {trabajadorSeleccionado.nombre} {trabajadorSeleccionado.apellidos}
                                                    </p>
                                                    <p className={estilos.rolResumen}>{trabajadorSeleccionado.rol_especialidad}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className={estilos.flechaResumen}>
                                        <ion-icon name="arrow-forward-outline"></ion-icon>
                                    </div>

                                    <div className={estilos.resumenCard}>
                                        <div className={estilos.resumenHeader}>
                                            <ion-icon name="location-outline"></ion-icon>
                                            <h4>Destino</h4>
                                        </div>
                                        {destinoSeleccionado && (
                                            <div className={estilos.resumenContenido}>
                                                <div className={estilos.destinoIconoResumen}>
                                                    {formData.tipo_destino === 'obra' ? '🏗️' : '⚡'}
                                                </div>
                                                <div>
                                                    <div className={estilos.tipoBadgeSmall}>
                                                        {formData.tipo_destino === 'obra' ? 'Obra' : 'Servicio'}
                                                    </div>
                                                    <p className={estilos.nombreResumen}>{destinoSeleccionado.nombre}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className={estilos.detallesFinales}>
                                        <div className={estilos.detalleCardFinal}>
                                            <ion-icon name="calendar-outline"></ion-icon>
                                            <div>
                                                <p className={estilos.detalleLabel}>Fecha</p>
                                                <p className={estilos.detalleValor}>
                                                    {new Date(formData.fecha_asignacion).toLocaleDateString('es-DO')}
                                                </p>
                                            </div>
                                        </div>

                                        {formData.hora_inicio && (
                                            <div className={estilos.detalleCardFinal}>
                                                <ion-icon name="time-outline"></ion-icon>
                                                <div>
                                                    <p className={estilos.detalleLabel}>Horario</p>
                                                    <p className={estilos.detalleValor}>
                                                        {formData.hora_inicio} {formData.hora_fin && `- ${formData.hora_fin}`}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {formData.actividad && (
                                            <div className={estilos.detalleCardFinal}>
                                                <ion-icon name="construct-outline"></ion-icon>
                                                <div>
                                                    <p className={estilos.detalleLabel}>Actividad</p>
                                                    <p className={estilos.detalleValor}>{formData.actividad}</p>
                                                </div>
                                            </div>
                                        )}

                                        {formData.zona_trabajo && (
                                            <div className={estilos.detalleCardFinal}>
                                                <ion-icon name="location-outline"></ion-icon>
                                                <div>
                                                    <p className={estilos.detalleLabel}>Zona</p>
                                                    <p className={estilos.detalleValor}>{formData.zona_trabajo}</p>
                                                </div>
                                            </div>
                                        )}
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
                                                Asignando...
                                            </>
                                        ) : (
                                            <>
                                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                                Confirmar Asignación
                                            </>
                                        )}
                        </button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
    )
}
