"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/_Pages/admin/i18n'
import { crearSucursalDesdeAccesos, obtenerOpcionesCreacionSucursal } from './servidor'
import estilos from './crear.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function CrearAccesoSucursalPage() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [cargandoDatos, setCargandoDatos] = useState(true)
    const [usuarios, setUsuarios] = useState([])
    const [monedas, setMonedas] = useState([])
    const [guardando, setGuardando] = useState(false)
    const [estado, setEstado] = useState({ tipo: '', texto: '' })

    const [formulario, setFormulario] = useState({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        monedaId: '',
        encargadoUsuarioId: '',
        esPrincipal: false,
        activa: true,
        notas: ''
    })

    useEffect(() => {
        setTema(localStorage.getItem('tema') || 'light')

        const cargar = async () => {
            setCargandoDatos(true)
            const res = await obtenerOpcionesCreacionSucursal()
            if (res.success) {
                setUsuarios(res.usuarios || [])
                setMonedas(res.monedas || [])
                setFormulario((prev) => ({
                    ...prev,
                    monedaId: prev.monedaId || String(res.monedaPorDefectoId || '')
                }))
            } else {
                setEstado({ tipo: 'error', texto: res.mensaje || tr('No se pudieron cargar opciones', 'Could not load options') })
            }
            setCargandoDatos(false)
        }

        cargar()
    }, [])

    const onChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormulario((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const guardar = async (e) => {
        e.preventDefault()
        setGuardando(true)
        setEstado({ tipo: '', texto: '' })

        const res = await crearSucursalDesdeAccesos(formulario)
        if (!res.success) {
            setEstado({ tipo: 'error', texto: res.mensaje || tr('No se pudo crear la sucursal', 'Could not create branch') })
            setGuardando(false)
            return
        }

        router.push('/sucursales/accesos')
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <header className={estilos.encabezadoPrincipal}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Crear Sucursal', 'Create Branch')}</h1>
                    <p className={estilos.subtitulo}>{tr('Registra una nueva tienda y define su responsable inicial.', 'Register a new store and set its initial manager.')}</p>
                </div>
                <div className={estilos.accionesTop}>
                    <Link href="/sucursales/accesos" className={`${estilos.btn} ${estilos.btnGhost}`}>{tr('Volver', 'Back')}</Link>
                </div>
            </header>

            {estado.texto && <div className={`${estilos.estado} ${estilos[estado.tipo]}`}>{estado.texto}</div>}

            <section className={estilos.panelFormulario}>
                <div className={estilos.panelCabecera}>
                    <h3>{tr('Datos de la Sucursal', 'Branch Data')}</h3>
                    <p>{tr('Completa los datos base de la tienda.', 'Complete the store basic information.')}</p>
                </div>

                {cargandoDatos ? <LoadingScreen /> : (
                    <form className={estilos.form} onSubmit={guardar}>
                        <div className={estilos.campo}>
                            <label>{tr('Nombre de sucursal', 'Branch name')}</label>
                            <input className={estilos.input} name="nombre" value={formulario.nombre} onChange={onChange} required />
                        </div>

                        <div className={estilos.row2}>
                            <div className={estilos.campo}>
                                <label>{tr('Telefono', 'Phone')}</label>
                                <input className={estilos.input} name="telefono" value={formulario.telefono} onChange={onChange} />
                            </div>
                            <div className={estilos.campo}>
                                <label>Email</label>
                                <input className={estilos.input} name="email" type="email" value={formulario.email} onChange={onChange} />
                            </div>
                        </div>

                        <div className={estilos.row2}>
                            <div className={estilos.campo}>
                                <label>{tr('Ciudad', 'City')}</label>
                                <input className={estilos.input} name="ciudad" value={formulario.ciudad} onChange={onChange} />
                            </div>
                            <div className={estilos.campo}>
                                <label>{tr('Moneda', 'Currency')}</label>
                                <select className={estilos.select} name="monedaId" value={formulario.monedaId} onChange={onChange} required>
                                    <option value="">{tr('Selecciona moneda', 'Select currency')}</option>
                                    {monedas.map((m) => (
                                        <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={estilos.campo}>
                            <label>{tr('Direccion', 'Address')}</label>
                            <input className={estilos.input} name="direccion" value={formulario.direccion} onChange={onChange} />
                        </div>

                        <div className={estilos.campo}>
                            <label>{tr('Encargado inicial', 'Initial manager')}</label>
                            <select className={estilos.select} name="encargadoUsuarioId" value={formulario.encargadoUsuarioId} onChange={onChange}>
                                <option value="">{tr('Auto asignar usuario de sucursal', 'Auto assign branch user')}</option>
                                {usuarios.map((u) => (
                                    <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
                                ))}
                            </select>
                        </div>

                        <div className={estilos.campo}>
                            <label>{tr('Notas', 'Notes')}</label>
                            <textarea className={estilos.textarea} name="notas" value={formulario.notas} onChange={onChange} rows={3} />
                        </div>

                        <div className={estilos.row}>
                            <div className={estilos.toggleWrap}>
                                <label className={estilos.toggleLabel}>
                                    <input type="checkbox" name="activa" checked={formulario.activa} onChange={onChange} />
                                    <span>{tr('Sucursal activa', 'Active branch')}</span>
                                </label>
                            </div>

                            <div className={estilos.toggleWrap}>
                                <label className={estilos.toggleLabel}>
                                    <input type="checkbox" name="esPrincipal" checked={formulario.esPrincipal} onChange={onChange} />
                                    <span>{tr('Marcar como principal', 'Set as primary')}</span>
                                </label>
                            </div>
                        </div>

                        <div className={estilos.accionesForm}>
                            <button className={estilos.btn} type="submit" disabled={guardando}>
                                {guardando ? tr('Guardando...', 'Saving...') : tr('Crear Sucursal', 'Create Branch')}
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </div>
    )
}