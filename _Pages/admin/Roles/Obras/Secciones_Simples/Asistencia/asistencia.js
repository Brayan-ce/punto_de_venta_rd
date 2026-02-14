"use client"
import { useState, useEffect } from 'react'
import { obtenerObrasActivas, obtenerTrabajadoresObra, guardarAsistencia, obtenerAsistenciasDia } from './servidor'
import estilos from './asistencia.module.css'

export default function Asistencia() {
    const [tema, setTema] = useState('light')
    const [obras, setObras] = useState([])
    const [obraSeleccionada, setObraSeleccionada] = useState('')
    const [trabajadores, setTrabajadores] = useState([])
    const [asistencias, setAsistencias] = useState({})
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
    const [cargando, setCargando] = useState(false)
    const [guardando, setGuardando] = useState(false)

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
        cargarObras()
    }, [])

    useEffect(() => {
        if (obraSeleccionada && fecha) {
            cargarDatos()
        }
    }, [obraSeleccionada, fecha])

    async function cargarObras() {
        const res = await obtenerObrasActivas()
        if (res.success) {
            setObras(res.obras)
            if (res.obras.length > 0) {
                setObraSeleccionada(res.obras[0].id.toString())
            }
        }
    }

    async function cargarDatos() {
        setCargando(true)
        
        const [resTrabajadores, resAsistencias] = await Promise.all([
            obtenerTrabajadoresObra(obraSeleccionada),
            obtenerAsistenciasDia(obraSeleccionada, fecha)
        ])

        if (resTrabajadores.success) {
            setTrabajadores(resTrabajadores.trabajadores)
        }

        if (resAsistencias.success) {
            const asistenciasMap = {}
            resAsistencias.asistencias.forEach(a => {
                asistenciasMap[a.trabajador_id] = {
                    presente: a.presente,
                    horas: parseFloat(a.horas_trabajadas) || 8,
                    observaciones: a.observaciones || ''
                }
            })
            setAsistencias(asistenciasMap)
        } else {
            const asistenciasDefault = {}
            if (resTrabajadores.success) {
                resTrabajadores.trabajadores.forEach(t => {
                    asistenciasDefault[t.id] = {
                        presente: true,
                        horas: 8,
                        observaciones: ''
                    }
                })
            }
            setAsistencias(asistenciasDefault)
        }

        setCargando(false)
    }

    function togglePresente(trabajadorId) {
        setAsistencias(prev => ({
            ...prev,
            [trabajadorId]: {
                ...prev[trabajadorId],
                presente: !prev[trabajadorId]?.presente
            }
        }))
    }

    function cambiarHoras(trabajadorId, horas) {
        setAsistencias(prev => ({
            ...prev,
            [trabajadorId]: {
                ...prev[trabajadorId],
                horas: parseFloat(horas) || 0
            }
        }))
    }

    function cambiarObservaciones(trabajadorId, observaciones) {
        setAsistencias(prev => ({
            ...prev,
            [trabajadorId]: {
                ...prev[trabajadorId],
                observaciones
            }
        }))
    }

    function marcarTodos(presente) {
        const nuevasAsistencias = {}
        trabajadores.forEach(t => {
            nuevasAsistencias[t.id] = {
                ...asistencias[t.id],
                presente
            }
        })
        setAsistencias(nuevasAsistencias)
    }

    async function handleGuardar() {
        if (!obraSeleccionada) {
            alert('Selecciona una obra')
            return
        }

        const listaAsistencias = trabajadores.map(t => ({
            trabajador_id: t.id,
            presente: asistencias[t.id]?.presente !== false,
            horas: parseFloat(asistencias[t.id]?.horas) || 8,
            observaciones: asistencias[t.id]?.observaciones || ''
        }))

        setGuardando(true)
        const res = await guardarAsistencia(obraSeleccionada, fecha, listaAsistencias)
        setGuardando(false)

        if (res.success) {
            alert('Asistencia guardada exitosamente')
        } else {
            alert(res.mensaje || 'Error al guardar asistencia')
        }
    }

    const trabajadoresPresentes = trabajadores.filter(t => asistencias[t.id]?.presente !== false).length
    const trabajadoresAusentes = trabajadores.length - trabajadoresPresentes
    const totalHoras = trabajadores.reduce((sum, t) => {
        const horas = asistencias[t.id]?.presente !== false ? (parseFloat(asistencias[t.id]?.horas) || 8) : 0
        return sum + horas
    }, 0)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="checkmark-done-outline"></ion-icon>
                        Asistencia Diaria
                    </h1>
                    <p className={estilos.subtitulo}>
                        Control de asistencia de trabajadores
                    </p>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.campo}>
                    <label>Obra</label>
                    <select
                        value={obraSeleccionada}
                        onChange={(e) => setObraSeleccionada(e.target.value)}
                        className={estilos.select}
                    >
                        <option value="">Seleccionar obra</option>
                        {obras.map(obra => (
                            <option key={obra.id} value={obra.id}>
                                {obra.codigo_obra} - {obra.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={estilos.campo}>
                    <label>Fecha</label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className={estilos.input}
                    />
                </div>

                <div className={estilos.botonesRapidos}>
                    <button 
                        className={estilos.btnTodos}
                        onClick={() => marcarTodos(true)}
                        type="button"
                    >
                        <ion-icon name="checkmark-outline"></ion-icon>
                        Marcar Todos
                    </button>
                    <button 
                        className={estilos.btnNinguno}
                        onClick={() => marcarTodos(false)}
                        type="button"
                    >
                        <ion-icon name="close-outline"></ion-icon>
                        Desmarcar Todos
                    </button>
                </div>
            </div>

            {obraSeleccionada && (
                <div className={estilos.resumen}>
                    <div className={estilos.stat}>
                        <ion-icon name="people-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>{trabajadores.length}</span>
                            <span className={estilos.statLabel}>Total</span>
                        </div>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>{trabajadoresPresentes}</span>
                            <span className={estilos.statLabel}>Presentes</span>
                        </div>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>{trabajadoresAusentes}</span>
                            <span className={estilos.statLabel}>Ausentes</span>
                        </div>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="time-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>{totalHoras.toFixed(1)}</span>
                            <span className={estilos.statLabel}>Horas Total</span>
                        </div>
                    </div>
                </div>
            )}

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando datos...</span>
                </div>
            ) : !obraSeleccionada ? (
                <div className={estilos.vacio}>
                    <ion-icon name="business-outline"></ion-icon>
                    <h3>Selecciona una obra</h3>
                    <p>Elige una obra para registrar la asistencia</p>
                </div>
            ) : trabajadores.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="people-outline"></ion-icon>
                    <h3>No hay trabajadores asignados</h3>
                    <p>Asigna trabajadores a esta obra para registrar asistencia</p>
                </div>
            ) : (
                <div className={estilos.listaTrabajadores}>
                    {trabajadores.map(trabajador => {
                        const presente = asistencias[trabajador.id]?.presente !== false
                        const horas = parseFloat(asistencias[trabajador.id]?.horas) || 8
                        const observaciones = asistencias[trabajador.id]?.observaciones || ''

                        return (
                            <div 
                                key={trabajador.id} 
                                className={`${estilos.trabajadorCard} ${presente ? estilos.presente : estilos.ausente}`}
                            >
                                <div className={estilos.trabajadorHeader}>
                                    <div 
                                        className={estilos.checkContainer}
                                        onClick={() => togglePresente(trabajador.id)}
                                    >
                                        <div className={estilos.checkbox}>
                                            {presente && <ion-icon name="checkmark-outline"></ion-icon>}
                                        </div>
                                        <div className={estilos.trabajadorInfo}>
                                            <h3>{trabajador.nombre} {trabajador.apellido}</h3>
                                            {trabajador.especialidad && (
                                                <span className={estilos.especialidad}>{trabajador.especialidad}</span>
                                            )}
                                        </div>
                                    </div>

                                    <span className={estilos.badge}>
                                        {presente ? (
                                            <>
                                                <ion-icon name="checkmark-circle"></ion-icon>
                                                Presente
                                            </>
                                        ) : (
                                            <>
                                                <ion-icon name="close-circle"></ion-icon>
                                                Ausente
                                            </>
                                        )}
                                    </span>
                                </div>

                                {presente && (
                                    <div className={estilos.trabajadorBody}>
                                        <div className={estilos.campo}>
                                            <label>Horas Trabajadas</label>
                                            <input
                                                type="number"
                                                value={horas}
                                                onChange={(e) => cambiarHoras(trabajador.id, e.target.value)}
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                className={estilos.inputHoras}
                                            />
                                        </div>

                                        <div className={estilos.campo}>
                                            <label>Observaciones (Opcional)</label>
                                            <input
                                                type="text"
                                                value={observaciones}
                                                onChange={(e) => cambiarObservaciones(trabajador.id, e.target.value)}
                                                placeholder="Ej: Llego tarde, trabajo extra, etc."
                                                className={estilos.inputObs}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {obraSeleccionada && trabajadores.length > 0 && (
                <div className={estilos.acciones}>
                    <button 
                        className={estilos.btnGuardar}
                        onClick={handleGuardar}
                        disabled={guardando}
                    >
                        {guardando ? (
                            <>
                                <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <ion-icon name="save-outline"></ion-icon>
                                Guardar Asistencia
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}