"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/_Pages/admin/i18n'
import { actualizarCredencialesPos, obtenerCredencialesEditable } from './servidor'
import estilos from './editar.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function EditarAccesoSucursalPage() {
    const { id } = useParams()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [estado, setEstado] = useState({ tipo: '', texto: '' })
    const [sucursal, setSucursal] = useState(null)
    const [usuarioPos, setUsuarioPos] = useState(null)
    const [passwordMostrada, setPasswordMostrada] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const cargar = async () => {
        setCargando(true)
        const res = await obtenerCredencialesEditable(id)
        if (!res.success) {
            setEstado({ tipo: 'error', texto: res.mensaje || tr('No encontrado', 'Not found') })
            setCargando(false)
            return
        }

        setSucursal(res.sucursal || null)
        setUsuarioPos(res.usuarioPos || null)
        setEmail(res.usuarioPos?.email || '')
        setPassword('')
        setCargando(false)
    }

    useEffect(() => {
        setTema(localStorage.getItem('tema') || 'light')
        if (id) cargar()
    }, [id])

    const guardar = async (e) => {
        e.preventDefault()
        if (!sucursal?.id) return

        setGuardando(true)
        setEstado({ tipo: '', texto: '' })

        const res = await actualizarCredencialesPos({
            sucursalId: sucursal.id,
            email,
            password
        })

        if (!res.success) {
            setEstado({ tipo: 'error', texto: res.mensaje || tr('No se pudo actualizar', 'Could not update') })
            setGuardando(false)
            return
        }

        setEstado({ tipo: 'ok', texto: res.mensaje || tr('Credenciales actualizadas', 'Credentials updated') })
        setPasswordMostrada(res.passwordTemporal || '')
        setPassword('')
        await cargar()
        setGuardando(false)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <header className={estilos.encabezadoPrincipal}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Editar Credenciales', 'Edit Credentials')}</h1>
                    <p className={estilos.subtitulo}>{tr('Edita solo usuario y contrasena del admin POS de la sucursal.', 'Edit only username and password for the branch POS admin.')}</p>
                </div>
                <div className={estilos.accionesTop}>
                    <Link href="/sucursales/accesos" className={`${estilos.btn} ${estilos.btnGhost}`}>{tr('Volver', 'Back')}</Link>
                    {sucursal && <Link href={`/sucursales/accesos/ver/${sucursal.id}`} className={estilos.btn}>{tr('Ver', 'View')}</Link>}
                </div>
            </header>

            {estado.texto && <div className={`${estilos.estado} ${estilos[estado.tipo]}`}>{estado.texto}</div>}

            <section className={estilos.panelFormulario}>
                {cargando ? <LoadingScreen /> : !sucursal ? (
                    <div className={estilos.cargando}>{tr('No se encontro la sucursal', 'Branch not found')}</div>
                ) : !usuarioPos ? (
                    <div className={estilos.cargando}>{tr('Esta sucursal no tiene usuario POS admin', 'This branch has no POS admin user')}</div>
                ) : (
                    <>
                        <div className={estilos.panelCabecera}>
                            <h3>{sucursal.nombre} ({sucursal.codigo})</h3>
                            <p>{tr('Usuario actual', 'Current user')}: {usuarioPos.email}</p>
                        </div>

                        <form className={estilos.form} onSubmit={guardar}>
                            <div className={estilos.campo}>
                                <label>{tr('Usuario (email)', 'Username (email)')}</label>
                                <input
                                    className={estilos.input}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={estilos.campo}>
                                <label>{tr('Nueva contrasena', 'New password')}</label>
                                <input
                                    className={estilos.input}
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={tr('Dejar vacio para no cambiar', 'Leave blank to keep current')}
                                />
                            </div>

                            <div className={estilos.accionesForm}>
                                <button className={estilos.btn} type="submit" disabled={guardando}>
                                    {guardando ? tr('Guardando...', 'Saving...') : tr('Guardar credenciales', 'Save credentials')}
                                </button>
                            </div>
                        </form>

                        {passwordMostrada && (
                            <div className={estilos.resultadoPassword}>
                                <span>{tr('Contrasena actualizada', 'Updated password')}</span>
                                <strong>{passwordMostrada}</strong>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    )
}