"use client"
import { useState, useEffect } from 'react'
import { obtenerTrabajadoresAsignados, registrarBitacora } from './servidor'
import estilos from './bitacora.module.css'

export default function NuevaBitacora({ obraId }) {
    const [trabajadores, setTrabajadores] = useState([])
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [asistencias, setAsistencias] = useState({}) // { id: boolean }
    const [tema, setTema] = useState('light')

    const [datos, setDatos] = useState({
        fecha: new Date().toISOString().split('T')[0],
        zona: '',
        trabajo_realizado: '',
        observaciones: ''
    })

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        if (obraId) cargarTrabajadores()
    }, [obraId])

    async function cargarTrabajadores() {
        const res = await obtenerTrabajadoresAsignados(obraId)
        if (res.success) {
            setTrabajadores(res.trabajadores)
            // Por defecto, todos presentes
            const assist = {}
            res.trabajadores.forEach(t => assist[t.id] = true)
            setAsistencias(assist)
        }
        setCargando(false)
    }

    const toggleAsistencia = (id) => {
        setAsistencias(prev => ({ ...prev, [id]: !prev[id] }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setProcesando(true)

        // Filtrar solo los trabajadores presentes
        const presentes = trabajadores
            .filter(t => asistencias[t.id])
            .map(t => ({ id: t.id, horas_trabajadas: 8 })) // Default 8h for now

        const payload = {
            ...datos,
            obra_id: obraId,
            trabajadores: presentes
        }

        const res = await registrarBitacora(payload)
        if (res.success) {
            alert('Bitácora guardada')
            // Podríamos redirigir o limpiar
        } else {
            alert(res.mensaje)
        }
        setProcesando(false)
    }

    if (!obraId) return <div>Seleccione una obra para ver la bitácora</div>

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <h1 className={estilos.titulo}>Nueva Bitácora Diaria</h1>
            <p className={estilos.subtitulo}>Registro de actividades y personal</p>

            <form onSubmit={handleSubmit} className={estilos.form}>
                <section className={estilos.seccion}>
                    <h3>Datos Generales</h3>
                    <div className={estilos.fila}>
                        <div className={estilos.grupo}>
                            <label>Fecha</label>
                            <input
                                type="date"
                                value={datos.fecha}
                                onChange={e => setDatos({ ...datos, fecha: e.target.value })}
                            />
                        </div>
                        <div className={estilos.grupo}>
                            <label>Zona / Área</label>
                            <input
                                type="text"
                                placeholder="Ej: Torre A, Piso 5"
                                value={datos.zona}
                                onChange={e => setDatos({ ...datos, zona: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                <section className={estilos.seccion}>
                    <h3>Asistencia de Personal</h3>
                    {cargando ? (
                        <p>Buscando trabajadores asignados...</p>
                    ) : (
                        <div className={estilos.listaTrabajadores}>
                            {trabajadores.map(t => (
                                <div
                                    key={t.id}
                                    className={`${estilos.trabajadorRow} ${asistencias[t.id] ? estilos.presente : estilos.ausente}`}
                                    onClick={() => toggleAsistencia(t.id)}
                                >
                                    <div className={estilos.trabajadorInfo}>
                                        <strong>{t.nombre}</strong>
                                        <span>{t.rol}</span>
                                    </div>
                                    <div className={estilos.checkAsistencia}>
                                        <ion-icon name={asistencias[t.id] ? "checkmark-circle" : "close-circle"}></ion-icon>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className={estilos.seccion}>
                    <h3>Detalle del Trabajo</h3>
                    <div className={estilos.grupo}>
                        <label>Trabajo Realizado</label>
                        <textarea
                            rows="4"
                            placeholder="Describa el progreso del día..."
                            value={datos.trabajo_realizado}
                            onChange={e => setDatos({ ...datos, trabajo_realizado: e.target.value })}
                        ></textarea>
                    </div>
                    <div className={estilos.grupo}>
                        <label>Observaciones / Pendientes</label>
                        <textarea
                            rows="2"
                            placeholder="Cualquier eventualidad o material faltante..."
                            value={datos.observaciones}
                            onChange={e => setDatos({ ...datos, observaciones: e.target.value })}
                        ></textarea>
                    </div>
                </section>

                <button type="submit" className={estilos.btnEnviar} disabled={procesando}>
                    {procesando ? 'Guardando...' : 'Finalizar y Guardar'}
                </button>
            </form>
        </div>
    )
}
