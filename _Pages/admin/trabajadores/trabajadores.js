"use client"
import { useState, useEffect } from 'react'
import { obtenerTodosTrabajadores, guardarTrabajador } from './servidor'
import estilos from './trabajadores.module.css'

export default function TrabajadoresAdmin() {
    const [trabajadores, setTrabajadores] = useState([])
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [mostrarModal, setMostrarModal] = useState(false)
    const [tema, setTema] = useState('light')

    const [formData, setFormData] = useState({
        nombre: '',
        documento: '',
        rol: 'Peón'
    })

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        cargarTrabajadores()
    }, [])

    async function cargarTrabajadores() {
        setCargando(true)
        const res = await obtenerTodosTrabajadores()
        if (res.success) setTrabajadores(res.trabajadores)
        setCargando(false)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setProcesando(true)
        const res = await guardarTrabajador(formData)
        if (res.success) {
            setMostrarModal(false)
            setFormData({ nombre: '', documento: '', rol: 'Peón' })
            cargarTrabajadores()
        } else {
            alert(res.mensaje)
        }
        setProcesando(false)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Trabajadores</h1>
                    <p className={estilos.subtitulo}>Gestión de personal de campo</p>
                </div>
                <button className={estilos.btnNuevo} onClick={() => setMostrarModal(true)}>
                    <ion-icon name="person-add-outline"></ion-icon>
                    <span>Nuevo Trabajador</span>
                </button>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>Cargando personal...</div>
            ) : (
                <div className={estilos.grid}>
                    {trabajadores.map(t => (
                        <div key={t.id} className={estilos.tarjeta}>
                            <div className={estilos.avatar}>
                                <ion-icon name="person-circle-outline"></ion-icon>
                            </div>
                            <div className={estilos.info}>
                                <h3>{t.nombre}</h3>
                                <p>{t.rol}</p>
                                <span className={estilos.documento}>{t.documento}</span>
                            </div>
                            <div className={`${estilos.estado} ${estilos[t.estado.toLowerCase()]}`}>
                                {t.estado}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {mostrarModal && (
                <div className={estilos.modalOverlay}>
                    <div className={estilos.modal}>
                        <div className={estilos.modalHeader}>
                            <h2>Registrar Trabajador</h2>
                            <button onClick={() => setMostrarModal(false)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={estilos.modalBody}>
                            <div className={estilos.grupo}>
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                            <div className={estilos.grupo}>
                                <label>Cédula / Documento</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.documento}
                                    onChange={e => setFormData({ ...formData, documento: e.target.value })}
                                />
                            </div>
                            <div className={estilos.grupo}>
                                <label>Rol / Especialidad</label>
                                <select
                                    value={formData.rol}
                                    onChange={e => setFormData({ ...formData, rol: e.target.value })}
                                >
                                    <option>Peón</option>
                                    <option>Albañil</option>
                                    <option>Maestro Constructor</option>
                                    <option>Electricista</option>
                                    <option>Plomero</option>
                                    <option>Ingeniero</option>
                                </select>
                            </div>
                            <div className={estilos.modalFooter}>
                                <button type="button" onClick={() => setMostrarModal(false)} disabled={procesando}>
                                    Cancelar
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                    {procesando ? 'Guardando...' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
