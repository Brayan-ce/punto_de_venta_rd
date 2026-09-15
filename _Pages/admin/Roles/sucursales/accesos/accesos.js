"use client"
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/_Pages/admin/i18n'
import {
    actualizarRolAcceso,
    cambiarEstadoAcceso,
    obtenerDatosAccesos
} from './servidor'
import estilos from './accesos.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const POR_PAGINA = 8

export default function AccesosSucursales() {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [mounted, setMounted] = useState(false)
    const [cargando, setCargando] = useState(true)

    const [sucursales, setSucursales] = useState([])
    const [accesos, setAccesos] = useState([])

    const [buscar, setBuscar] = useState('')
    const [sucursalFiltro, setSucursalFiltro] = useState('')
    const [estadoFiltro, setEstadoFiltro] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)

    const [estadoOperacion, setEstadoOperacion] = useState({ tipo: '', texto: '' })

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const filtroActivo = estadoFiltro === '' ? undefined : estadoFiltro === 'activos'
            const res = await obtenerDatosAccesos({
                buscar,
                sucursalId: sucursalFiltro,
                activo: filtroActivo
            })
            if (res.success) {
                setSucursales(res.sucursales || [])
                setAccesos(res.accesos || [])
            }
        } catch (error) {
            console.error('Error en accesos:', error)
            setEstadoOperacion({ tipo: 'error', texto: tr('Error cargando accesos', 'Error loading accesses') })
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        setMounted(true)
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        const handleTemaChange = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', handleTemaChange)
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [])

    useEffect(() => {
        if (!mounted) return
        const timer = setTimeout(() => cargarDatos(), 300)
        return () => clearTimeout(timer)
    }, [mounted, buscar, sucursalFiltro, estadoFiltro])

    useEffect(() => {
        setPaginaActual(1)
    }, [buscar, sucursalFiltro, estadoFiltro])

    const resumen = useMemo(() => {
        const total = accesos.length
        const activos = accesos.filter((a) => Boolean(a.activo)).length
        const inactivos = total - activos
        const admins = accesos.filter((a) => a.rol_sucursal === 'admin').length
        const encargados = accesos.filter((a) => a.rol_sucursal === 'encargado').length
        return { total, activos, inactivos, admins, encargados }
    }, [accesos])

    const totalPaginas = Math.max(1, Math.ceil(accesos.length / POR_PAGINA))
    const paginaSegura = Math.min(paginaActual, totalPaginas)
    const inicio = (paginaSegura - 1) * POR_PAGINA
    const accesosPaginados = accesos.slice(inicio, inicio + POR_PAGINA)

    useEffect(() => {
        if (paginaActual > totalPaginas) setPaginaActual(totalPaginas)
    }, [paginaActual, totalPaginas])

    const manejarCambioRol = async (accesoId, nuevoRol) => {
        const res = await actualizarRolAcceso({ accesoId, rolSucursal: nuevoRol })
        if (!res.success) {
            setEstadoOperacion({ tipo: 'error', texto: res.mensaje || tr('No se pudo actualizar rol', 'Role could not be updated') })
            return
        }
        await cargarDatos()
    }

    const manejarEstado = async (accesoId, activo) => {
        const res = await cambiarEstadoAcceso({ accesoId, activo })
        if (!res.success) {
            setEstadoOperacion({ tipo: 'error', texto: res.mensaje || tr('No se pudo cambiar estado', 'State could not be changed') })
            return
        }
        await cargarDatos()
    }

    const formatFecha = (value) => {
        if (!value) return '-'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return '-'
        return date.toLocaleString(language === 'en' ? 'en-US' : 'es-DO')
    }

    if (!mounted) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <header className={estilos.encabezadoPrincipal}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Accesos por sucursal', 'Branch accesses')}</h1>
                    <p className={estilos.subtitulo}>{tr('Gestiona permisos de usuarios por sucursal.', 'Manage user permissions per branch.')}</p>
                </div>
                <div className={estilos.accionesTop}>
                    <button type="button" className={`${estilos.btn} ${estilos.btnGhost}`} onClick={cargarDatos}>
                        {tr('Actualizar', 'Refresh')}
                    </button>
                    <Link href="/sucursales/accesos/crear" className={estilos.btn}>
                        {tr('+ Crear sucursal', '+ Create branch')}
                    </Link>
                </div>
            </header>

            <section className={estilos.barraResumen}>
                <span>{tr('Total', 'Total')}: <strong>{resumen.total}</strong></span>
                <span>{tr('Activos', 'Active')}: <strong>{resumen.activos}</strong></span>
                <span>{tr('Inactivos', 'Inactive')}: <strong>{resumen.inactivos}</strong></span>
                <span>{tr('Admin', 'Admin')}: <strong>{resumen.admins}</strong></span>
                <span>{tr('Encargados', 'Managers')}: <strong>{resumen.encargados}</strong></span>
            </section>

            <section className={estilos.panelFiltros}>
                <input
                    className={estilos.input}
                    type="text"
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    placeholder={tr('Buscar usuario o sucursal...', 'Search user or branch...')}
                />
                <select className={estilos.select} value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)}>
                    <option value="">{tr('Todas las sucursales', 'All branches')}</option>
                    {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                </select>
                <select className={estilos.select} value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                    <option value="">{tr('Todos los estados', 'All statuses')}</option>
                    <option value="activos">{tr('Activos', 'Active')}</option>
                    <option value="inactivos">{tr('Inactivos', 'Inactive')}</option>
                </select>
            </section>

            {estadoOperacion.texto && (
                <div className={`${estilos.estadoOperacion} ${estilos[estadoOperacion.tipo]}`}>
                    {estadoOperacion.texto}
                </div>
            )}

            <section className={estilos.panelListado}>
                <div className={estilos.panelCabecera}>
                    <h3>{tr('Registros de acceso', 'Access records')}</h3>
                    <p>
                        {!cargando && accesos.length > 0
                            ? tr(`${accesos.length} registros encontrados`, `${accesos.length} records found`)
                            : ''}
                    </p>
                </div>

                {cargando ? <LoadingScreen /> : accesos.length === 0 ? (
                    <div className={estilos.vacio}>
                        <p>{tr('No hay accesos registrados', 'No accesses found')}</p>
                    </div>
                ) : (
                    <>
                        <div className={estilos.listaRegistros}>
                            {accesosPaginados.map((a) => (
                                <article key={a.id} className={estilos.registroItem}>
                                    <div className={estilos.registroLineaSuperior}>
                                        <div>
                                            <h4>{a.usuario_nombre}</h4>
                                            <p>{a.usuario_email}</p>
                                        </div>
                                        <span className={`${estilos.badge} ${a.activo ? estilos.activo : estilos.inactivo}`}>
                                            {a.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                                        </span>
                                    </div>

                                    <div className={estilos.registroMeta}>
                                        <div>
                                            <label>{tr('Sucursal', 'Branch')}</label>
                                            <p>{a.sucursal_nombre}</p>
                                        </div>
                                        <div>
                                            <label>{tr('Rol', 'Role')}</label>
                                            <select
                                                className={estilos.select}
                                                value={a.rol_sucursal}
                                                onChange={(e) => manejarCambioRol(a.id, e.target.value)}
                                            >
                                                <option value="admin">{tr('Admin', 'Admin')}</option>
                                                <option value="encargado">{tr('Encargado', 'Manager')}</option>
                                                <option value="cajero">{tr('Cajero', 'Cashier')}</option>
                                                <option value="consulta">{tr('Consulta', 'Read only')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label>{tr('Actualizado', 'Updated')}</label>
                                            <p>{formatFecha(a.fecha_actualizacion)}</p>
                                        </div>
                                    </div>

                                    <div className={estilos.acciones}>
                                        <Link className={estilos.btnAccion} href={`/sucursales/accesos/ver/${a.sucursal_id}`}>
                                            {tr('Ver', 'View')}
                                        </Link>
                                        <Link className={estilos.btnAccion} href={`/sucursales/accesos/editar/${a.sucursal_id}`}>
                                            {tr('Editar', 'Edit')}
                                        </Link>
                                        <button
                                            type="button"
                                            className={estilos.btnAccion}
                                            onClick={() => manejarEstado(a.id, !Boolean(a.activo))}
                                        >
                                            {a.activo ? tr('Desactivar', 'Disable') : tr('Activar', 'Enable')}
                                        </button>
                                        <Link className={estilos.btnAccion} href={`/sucursales/accesos/eliminar/${a.id}`}>
                                            {tr('Eliminar', 'Delete')}
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className={estilos.paginacionWrap}>
                            <span className={estilos.paginacionInfo}>
                                {tr(
                                    `${inicio + 1}–${Math.min(inicio + POR_PAGINA, accesos.length)} de ${accesos.length}`,
                                    `${inicio + 1}–${Math.min(inicio + POR_PAGINA, accesos.length)} of ${accesos.length}`
                                )}
                            </span>
                            <div className={estilos.paginacion}>
                                <button
                                    type="button"
                                    className={estilos.btnPagina}
                                    disabled={paginaSegura === 1}
                                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                                >
                                    {tr('Anterior', 'Prev')}
                                </button>
                                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                                    <button
                                        type="button"
                                        key={num}
                                        className={`${estilos.btnPagina} ${paginaSegura === num ? estilos.btnPaginaActiva : ''}`}
                                        onClick={() => setPaginaActual(num)}
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className={estilos.btnPagina}
                                    disabled={paginaSegura === totalPaginas}
                                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                                >
                                    {tr('Siguiente', 'Next')}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    )
}