"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteFinanciamiento, obtenerTiposDocumento } from '../servidor'
import estilos from '../editar/editar.module.css'

const FORM_VACIO = {
    nombre: '', apellidos: '', numero_documento: '', tipo_documento_id: 1,
    telefono: '', email: '', direccion: '', sector: '',
    municipio: '', provincia: '', fecha_nacimiento: ''
}

export default function CrearClienteFinanciamiento() {
    const router = useRouter()

    const [tema, setTema]           = useState('light')
    const [guardando, setGuardando] = useState(false)
    const [error, setError]         = useState('')
    const [tipos, setTipos]         = useState([])
    const [form, setForm]           = useState(FORM_VACIO)

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const h = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', h)
        window.addEventListener('storage', h)
        cargarTipos()
        return () => { window.removeEventListener('temaChange', h); window.removeEventListener('storage', h) }
    }, [])

    async function cargarTipos() {
        const res = await obtenerTiposDocumento()
        if (res.success) setTipos(res.tipos)
    }

    const cambiar = (e) => {
        const val = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value
        setForm(prev => ({ ...prev, [e.target.name]: val }))
    }

    async function guardar(e) {
        e.preventDefault()
        setError('')
        if (!form.nombre.trim())          { setError('El nombre es requerido'); return }
        if (!form.numero_documento.trim()) { setError('El número de documento es requerido'); return }
        setGuardando(true)
        try {
            const res = await crearClienteFinanciamiento(form)
            if (res.success) router.push(`/financiamiento/clientes/ver/${res.clienteId}`)
            else setError(res.mensaje || 'Error al crear cliente')
        } finally { setGuardando(false) }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* TOPBAR */}
            <div className={estilos.topbar}>
                <button className={estilos.btnVolver}
                    onClick={() => router.push('/financiamiento/clientes')}>
                    <ion-icon name="arrow-back-outline"></ion-icon> Volver
                </button>
            </div>

            {/* CARD */}
            <div className={estilos.card}>
                <div className={estilos.cardHeader}>
                    <div className={estilos.cardIcono}><ion-icon name="person-add-outline"></ion-icon></div>
                    <div>
                        <h1 className={estilos.cardTitulo}>Nuevo Cliente</h1>
                        <p className={estilos.cardSubtitulo}>Registra un nuevo cliente para financiamiento</p>
                    </div>
                </div>

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
                            <label className={estilos.label}>Tipo de documento</label>
                            <select name="tipo_documento_id" value={form.tipo_documento_id} onChange={cambiar}
                                className={estilos.select}>
                                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div className={estilos.campo}>
                            <label className={estilos.label}>Número de documento *</label>
                            <input name="numero_documento" value={form.numero_documento} onChange={cambiar}
                                className={estilos.input} placeholder="000-0000000-0" required />
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
                            onClick={() => router.push('/financiamiento/clientes')}>
                            Cancelar
                        </button>
                        <button type="submit" className={estilos.btnGuardar} disabled={guardando}>
                            {guardando
                                ? <><div className={estilos.spinnerSmall}></div> Guardando...</>
                                : <><ion-icon name="person-add-outline"></ion-icon> Crear cliente</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
