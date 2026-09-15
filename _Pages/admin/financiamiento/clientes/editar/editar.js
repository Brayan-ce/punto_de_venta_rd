"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerClienteDetalle, actualizarCliente, obtenerDatosEmpresa } from '../servidor'
import estilos from './editar.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function EditarClienteFinanciamiento() {
    const router = useRouter()
    const params = useParams()
    const id     = params?.id

    const [tema, setTema]           = useState('light')
    const [cargando, setCargando]   = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [error, setError]         = useState('')
    const [exito, setExito]         = useState(false)

    const [form, setForm] = useState({
        nombre: '', apellidos: '', telefono: '', email: '',
        direccion: '', sector: '', municipio: '', provincia: '', fecha_nacimiento: ''
    })

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const h = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', h)
        window.addEventListener('storage', h)
        return () => { window.removeEventListener('temaChange', h); window.removeEventListener('storage', h) }
    }, [])

    useEffect(() => { if (id) cargar() }, [id])

    async function cargar() {
        setCargando(true)
        try {
            const res = await obtenerClienteDetalle(id)
            if (res.success) {
                const c = res.cliente
                setForm({
                    nombre:          c.nombre || '',
                    apellidos:       c.apellidos || '',
                    telefono:        c.telefono || '',
                    email:           c.email || '',
                    direccion:       c.direccion || '',
                    sector:          c.sector || '',
                    municipio:       c.municipio || '',
                    provincia:       c.provincia || '',
                    fecha_nacimiento: c.fecha_nacimiento ? c.fecha_nacimiento.split('T')[0] : ''
                })
            } else router.push('/admin/financiamiento/clientes')
        } finally { setCargando(false) }
    }

    const cambiar = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

    async function guardar(e) {
        e.preventDefault()
        setError('')
        if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
        setGuardando(true)
        try {
            const res = await actualizarCliente(id, form)
            if (res.success) { setExito(true); setTimeout(() => router.push(`/admin/financiamiento/clientes/ver/${id}`), 1200) }
            else setError(res.mensaje || 'Error al guardar')
        } finally { setGuardando(false) }
    }

    if (cargando) { return <LoadingScreen /> }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* TOPBAR */}
            <div className={estilos.topbar}>
                <button className={estilos.btnVolver}
                    onClick={() => router.push(`/admin/financiamiento/clientes/ver/${id}`)}>
                    <ion-icon name="arrow-back-outline"></ion-icon> Volver
                </button>
            </div>

            {/* CARD */}
            <div className={estilos.card}>
                <div className={estilos.cardHeader}>
                    <div className={estilos.cardIcono}><ion-icon name="create-outline"></ion-icon></div>
                    <div>
                        <h1 className={estilos.cardTitulo}>Editar Cliente</h1>
                        <p className={estilos.cardSubtitulo}>Modifica los datos básicos del cliente</p>
                    </div>
                </div>

                {exito && (
                    <div className={estilos.alertaExito}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon> Cambios guardados correctamente
                    </div>
                )}
                {error && (
                    <div className={estilos.alertaError}>
                        <ion-icon name="alert-circle-outline"></ion-icon> {error}
                    </div>
                )}

                <form onSubmit={guardar} className={estilos.form}>
                    <div className={estilos.fila2}>
                        <div className={estilos.campo}>
                            <label className={estilos.label}>Nombre *</label>
                            <input name="nombre" value={form.nombre} onChange={cambiar}
                                className={estilos.input} placeholder="Nombre" required />
                        </div>
                        <div className={estilos.campo}>
                            <label className={estilos.label}>Apellidos</label>
                            <input name="apellidos" value={form.apellidos} onChange={cambiar}
                                className={estilos.input} placeholder="Apellidos" />
                        </div>
                    </div>

                    <div className={estilos.fila2}>
                        <div className={estilos.campo}>
                            <label className={estilos.label}>Teléfono</label>
                            <input name="telefono" value={form.telefono} onChange={cambiar}
                                className={estilos.input} placeholder="809-000-0000" />
                        </div>
                        <div className={estilos.campo}>
                            <label className={estilos.label}>Email</label>
                            <input name="email" type="email" value={form.email} onChange={cambiar}
                                className={estilos.input} placeholder="correo@ejemplo.com" />
                        </div>
                    </div>

                    <div className={estilos.campo}>
                        <label className={estilos.label}>Dirección</label>
                        <input name="direccion" value={form.direccion} onChange={cambiar}
                            className={estilos.input} placeholder="Calle, número, sector..." />
                    </div>

                    <div className={estilos.fila3}>
                        <div className={estilos.campo}>
                            <label className={estilos.label}>Sector</label>
                            <input name="sector" value={form.sector} onChange={cambiar}
                                className={estilos.input} placeholder="Sector" />
                        </div>
                        <div className={estilos.campo}>
                            <label className={estilos.label}>Municipio</label>
                            <input name="municipio" value={form.municipio} onChange={cambiar}
                                className={estilos.input} placeholder="Municipio" />
                        </div>
                        <div className={estilos.campo}>
                            <label className={estilos.label}>Provincia</label>
                            <input name="provincia" value={form.provincia} onChange={cambiar}
                                className={estilos.input} placeholder="Provincia" />
                        </div>
                    </div>

                    <div className={estilos.campo}>
                        <label className={estilos.label}>Fecha de nacimiento</label>
                        <input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={cambiar}
                            className={estilos.input} />
                    </div>

                    <div className={estilos.formAcciones}>
                        <button type="button" className={estilos.btnCancelar}
                            onClick={() => router.push(`/admin/financiamiento/clientes/ver/${id}`)}>
                            Cancelar
                        </button>
                        <button type="submit" className={estilos.btnGuardar} disabled={guardando}>
                            {guardando
                                ? <><div className={estilos.spinnerSmall}></div> Guardando...</>
                                : <><ion-icon name="save-outline"></ion-icon> Guardar cambios</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
