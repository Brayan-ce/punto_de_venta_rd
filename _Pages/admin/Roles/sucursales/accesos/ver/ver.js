"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/_Pages/admin/i18n'
import { obtenerDetalleSucursal, regenerarPasswordDesdeAccesos } from './servidor'
import estilos from './ver.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function VerAccesoSucursalPage() {
    const { id } = useParams()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [sucursal, setSucursal] = useState(null)
    const [accesos, setAccesos] = useState([])
    const [usuarioPos, setUsuarioPos] = useState(null)
    const [passwordTemporal, setPasswordTemporal] = useState('')
    const [mostrarPassword, setMostrarPassword] = useState(false)
    const [regenerando, setRegenerando] = useState(false)
    const [mensaje, setMensaje] = useState('')

    useEffect(() => {
        setTema(localStorage.getItem('tema') || 'light')

        const cargar = async () => {
            setCargando(true)
            const res = await obtenerDetalleSucursal(id)
            if (!res.success) {
                setMensaje(res.mensaje || tr('No encontrado', 'Not found'))
                setCargando(false)
                return
            }
            setSucursal(res.sucursal)
            setAccesos(res.accesos || [])
            setUsuarioPos(res.usuarioPos || null)
            setCargando(false)
        }

        if (id) cargar()
    }, [id])

    const estadoTexto = sucursal?.activa ? tr('Activa', 'Active') : tr('Inactiva', 'Inactive')

    const regenerarPassword = async () => {
        if (!sucursal?.id) return
        setRegenerando(true)

        const res = await regenerarPasswordDesdeAccesos(sucursal.id)
        if (!res.success) {
            setMensaje(res.mensaje || tr('No se pudo regenerar clave', 'Could not regenerate password'))
            setRegenerando(false)
            return
        }

        const nueva = res.credenciales?.password || ''
        setPasswordTemporal(nueva)
        setMostrarPassword(true)
        setMensaje(res.mensaje || tr('Contrasena regenerada', 'Password regenerated'))
        setRegenerando(false)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <header className={estilos.encabezadoPrincipal}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Detalle de Sucursal', 'Branch Detail')}</h1>
                    <p className={estilos.subtitulo}>{tr('Consulta informacion de la tienda y sus administradores.', 'Review store information and its administrators.')}</p>
                </div>
                <div className={estilos.accionesTop}>
                    <Link href="/sucursales/accesos" className={`${estilos.btn} ${estilos.btnGhost}`}>{tr('Volver', 'Back')}</Link>
                    {sucursal && (
                        <>
                            <Link href={`/sucursales/accesos/editar/${sucursal.id}`} className={estilos.btn}>{tr('Editar', 'Edit')}</Link>
                            <Link href={`/sucursales/accesos/eliminar/${sucursal.id}`} className={`${estilos.btn} ${estilos.btnDanger}`}>{tr('Eliminar', 'Delete')}</Link>
                        </>
                    )}
                </div>
            </header>

            <section className={estilos.panelDetalle}>
                {cargando ? <LoadingScreen /> : !sucursal ? (
                    <div className={estilos.cargando}>{mensaje}</div>
                ) : (
                    <>
                        <div className={estilos.panelCabecera}>
                            <h3>{tr('Informacion de la Sucursal', 'Branch Information')}</h3>
                            <span className={`${estilos.badge} ${sucursal.activa ? estilos.activo : estilos.inactivo}`}>{estadoTexto}</span>
                        </div>

                        <div className={estilos.gridDetalle}>
                            <div className={estilos.campo}>
                                <label>{tr('Codigo', 'Code')}</label>
                                <p>{sucursal.codigo || '-'}</p>
                            </div>
                            <div className={estilos.campo}>
                                <label>{tr('Nombre', 'Name')}</label>
                                <p>{sucursal.nombre || '-'}</p>
                            </div>
                            <div className={estilos.campo}>
                                <label>Email</label>
                                <p>{sucursal.email || '-'}</p>
                            </div>
                            <div className={estilos.campo}>
                                <label>{tr('Telefono', 'Phone')}</label>
                                <p>{sucursal.telefono || '-'}</p>
                            </div>
                            <div className={estilos.campo}>
                                <label>{tr('Ciudad', 'City')}</label>
                                <p>{sucursal.ciudad || '-'}</p>
                            </div>
                            <div className={estilos.campo}>
                                <label>{tr('Direccion', 'Address')}</label>
                                <p>{sucursal.direccion || '-'}</p>
                            </div>
                        </div>

                        <div className={estilos.subPanel}>
                            <h4>{tr('Credenciales de Acceso POS', 'POS Access Credentials')}</h4>
                            <div className={estilos.credencialesBox}>
                                <div>
                                    <span>{tr('Usuario', 'Username')}</span>
                                    <strong>{usuarioPos?.email || sucursal.usuario_pos_email || '-'}</strong>
                                </div>
                                <div>
                                    <span>{tr('Contrasena', 'Password')}</span>
                                    <strong>
                                        {passwordTemporal
                                            ? (mostrarPassword ? passwordTemporal : '••••••••')
                                            : tr('No visible, regenera para ver', 'Not visible, regenerate to view')}
                                    </strong>
                                </div>
                                <div className={estilos.credBtns}>
                                    {passwordTemporal && (
                                        <button type="button" className={estilos.btnCred} onClick={() => setMostrarPassword((prev) => !prev)}>
                                            {mostrarPassword ? tr('Ocultar', 'Hide') : tr('Mostrar', 'Show')}
                                        </button>
                                    )}
                                    <button type="button" className={estilos.btnCred} disabled={regenerando} onClick={regenerarPassword}>
                                        {regenerando ? tr('Regenerando...', 'Regenerating...') : tr('Regenerar clave', 'Regenerate password')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={estilos.subPanel}>
                            <h4>{tr('Usuarios y admins asignados', 'Assigned users and admins')}</h4>
                            {accesos.length === 0 ? (
                                <p className={estilos.vacio}>{tr('No hay usuarios asignados', 'No users assigned')}</p>
                            ) : (
                                <div className={estilos.listaAccesos}>
                                    {accesos.map((a) => (
                                        <article key={a.id} className={estilos.itemAcceso}>
                                            <div>
                                                <strong>{a.usuario_nombre}</strong>
                                                <p>{a.usuario_email}</p>
                                            </div>
                                            <span className={estilos.rolBadge}>{a.rol_sucursal}</span>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>
        </div>
    )
}