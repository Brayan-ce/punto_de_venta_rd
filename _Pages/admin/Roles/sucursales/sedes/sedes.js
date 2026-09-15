"use client"
import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/_Pages/admin/i18n'
import { cambiarEstadoSucursal, eliminarSucursal, guardarSucursal, obtenerDatosSucursales, regenerarPasswordUsuarioSucursal } from './servidor'
import estilos from './sedes.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const ESTADO_INICIAL = {
    id: null,
    codigo: '',
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
}

export default function Sedes() {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [mounted, setMounted] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [eliminandoId, setEliminandoId] = useState(null)
    const [regenerandoId, setRegenerandoId] = useState(null)

    const [usuarios, setUsuarios] = useState([])
    const [monedas, setMonedas] = useState([])
    const [sucursales, setSucursales] = useState([])
    const [buscar, setBuscar] = useState('')
    const [estadoFiltro, setEstadoFiltro] = useState('')
    const [formulario, setFormulario] = useState(ESTADO_INICIAL)
    const [estadoOperacion, setEstadoOperacion] = useState({ tipo: '', texto: '' })
    const [credencialesGeneradas, setCredencialesGeneradas] = useState(null)
    const [credencialesPorSucursal, setCredencialesPorSucursal] = useState({})
    const [passwordVisibleBySucursal, setPasswordVisibleBySucursal] = useState({})
    const [paginaActual, setPaginaActual] = useState(1)
    const FILAS_POR_PAGINA = 8

    useEffect(() => {
        setMounted(true)
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        cargarDatos()

        const handleTemaChange = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', handleTemaChange)
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [])

    const actualizarCredenciales = (sucursalId, datos) => {
        setCredencialesPorSucursal((prev) => ({ ...prev, [sucursalId]: datos }))
    }

    const eliminarCredenciales = (sucursalId) => {
        setCredencialesPorSucursal((prev) => {
            const copia = { ...prev }
            delete copia[sucursalId]
            return copia
        })
    }

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const activa = estadoFiltro === '' ? undefined : estadoFiltro === 'activas'
            const res = await obtenerDatosSucursales({ buscar, activa })
            if (res.success) {
                setUsuarios(res.usuarios || [])
                setMonedas(res.monedas || [])
                setSucursales(res.sucursales || [])
            }
        } catch (error) {
            console.error('Error al cargar sucursales:', error)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(cargarDatos, 350)
        return () => clearTimeout(timer)
    }, [buscar, estadoFiltro])

    useEffect(() => {
        setPaginaActual(1)
    }, [buscar, estadoFiltro])

    const resumen = useMemo(() => {
        const total = sucursales.length
        const activas = sucursales.filter((item) => Boolean(item.activa)).length
        const inactivas = total - activas
        const principales = sucursales.filter((item) => Boolean(item.es_principal)).length
        const conEncargado = sucursales.filter((item) => Boolean(item.encargado_usuario_id)).length
        return { total, activas, inactivas, principales, conEncargado }
    }, [sucursales])

    const totalPaginas = Math.max(1, Math.ceil(sucursales.length / FILAS_POR_PAGINA))

    const sucursalesPaginadas = useMemo(() => {
        const inicio = (paginaActual - 1) * FILAS_POR_PAGINA
        return sucursales.slice(inicio, inicio + FILAS_POR_PAGINA)
    }, [sucursales, paginaActual])

    useEffect(() => {
        if (paginaActual > totalPaginas) setPaginaActual(totalPaginas)
    }, [paginaActual, totalPaginas])

    useEffect(() => {
        if (!formulario.id && !formulario.monedaId && monedas.length > 0) {
            actualizarCampo('monedaId', String(monedas[0].id))
        }
    }, [formulario.id, formulario.monedaId, monedas])

    const actualizarCampo = (campo, valor) => setFormulario((prev) => ({ ...prev, [campo]: valor }))
    const limpiarFormulario = () => setFormulario(ESTADO_INICIAL)

    const editarSucursal = (sucursal) => {
        setFormulario({
            id: sucursal.id,
            codigo: sucursal.codigo || '',
            nombre: sucursal.nombre || '',
            telefono: sucursal.telefono || '',
            email: sucursal.email || '',
            direccion: sucursal.direccion || '',
            ciudad: sucursal.ciudad || '',
            monedaId: sucursal.moneda_id ? String(sucursal.moneda_id) : '',
            encargadoUsuarioId: sucursal.encargado_usuario_id || '',
            esPrincipal: Boolean(sucursal.es_principal),
            activa: Boolean(sucursal.activa),
            notas: sucursal.notas || ''
        })
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        setEstadoOperacion({ tipo: '', texto: '' })
        setCredencialesGeneradas(null)

        if (!formulario.nombre.trim()) {
            setEstadoOperacion({ tipo: 'error', texto: tr('El nombre es requerido', 'Name is required') })
            return
        }

        setGuardando(true)
        try {
            const res = await guardarSucursal(formulario)
            if (!res.success) {
                setEstadoOperacion({ tipo: 'error', texto: res.mensaje || tr('No se pudo guardar la sucursal', 'Could not save branch') })
                return
            }

            setEstadoOperacion({ tipo: 'ok', texto: res.mensaje || tr('Sucursal guardada', 'Branch saved') })

            if (res.credenciales) {
                setCredencialesGeneradas(res.credenciales)
                if (res.credenciales.sucursalId) {
                    actualizarCredenciales(res.credenciales.sucursalId, res.credenciales)
                }
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (error) {
            console.error('Error guardando sucursal:', error)
            setEstadoOperacion({ tipo: 'error', texto: tr('Error inesperado al guardar', 'Unexpected error while saving') })
        } finally {
            setGuardando(false)
        }
    }

    const manejarEstado = async (sucursalId, activa) => {
        const res = await cambiarEstadoSucursal({ sucursalId, activa })
        if (!res.success) {
            setEstadoOperacion({ tipo: 'error', texto: res.mensaje || tr('No se pudo cambiar el estado', 'Could not change state') })
            return
        }
        setEstadoOperacion({ tipo: 'ok', texto: res.mensaje })
        await cargarDatos()
    }

    const manejarEliminar = async (sucursal) => {
        const confirmado = window.confirm(
            tr(
                `Vas a eliminar la sucursal ${sucursal.nombre}. Esta accion no se puede deshacer. ¿Deseas continuar?`,
                `You are about to delete branch ${sucursal.nombre}. This action cannot be undone. Continue?`
            )
        )
        if (!confirmado) return

        setEliminandoId(sucursal.id)
        setEstadoOperacion({ tipo: '', texto: '' })

        try {
            const res = await eliminarSucursal({ sucursalId: sucursal.id })
            if (!res.success) {
                setEstadoOperacion({ tipo: 'error', texto: res.mensaje || tr('No se pudo eliminar la sucursal', 'Could not delete branch') })
                return
            }

            setEstadoOperacion({ tipo: 'ok', texto: res.mensaje || tr('Sucursal eliminada correctamente', 'Branch deleted successfully') })
            eliminarCredenciales(sucursal.id)

            if (Number(formulario.id) === Number(sucursal.id)) limpiarFormulario()
            await cargarDatos()
        } catch (error) {
            console.error('Error eliminando sucursal:', error)
            setEstadoOperacion({ tipo: 'error', texto: tr('No se pudo eliminar la sucursal', 'Could not delete branch') })
        } finally {
            setEliminandoId(null)
        }
    }

    const manejarRegenerarClave = async (sucursal) => {
        const confirmado = window.confirm(
            tr(
                `Se generara una nueva contrasena para el usuario de la sucursal ${sucursal.nombre}. ¿Continuar?`,
                `A new password will be generated for branch user ${sucursal.nombre}. Continue?`
            )
        )
        if (!confirmado) return

        setRegenerandoId(sucursal.id)
        try {
            const res = await regenerarPasswordUsuarioSucursal({ sucursalId: sucursal.id })
            if (!res.success) {
                setEstadoOperacion({ tipo: 'error', texto: res.mensaje || tr('No se pudo regenerar la contrasena', 'Could not regenerate password') })
                return
            }

            setEstadoOperacion({ tipo: 'ok', texto: res.mensaje || tr('Contrasena regenerada', 'Password regenerated') })

            if (res.credenciales) {
                setCredencialesGeneradas(res.credenciales)
                if (res.credenciales.sucursalId) {
                    actualizarCredenciales(res.credenciales.sucursalId, res.credenciales)
                }
            }
        } catch (error) {
            console.error('Error regenerando contrasena:', error)
            setEstadoOperacion({ tipo: 'error', texto: tr('No se pudo regenerar la contrasena', 'Could not regenerate password') })
        } finally {
            setRegenerandoId(null)
        }
    }

    const togglePasswordVisible = (sucursalId) => {
        setPasswordVisibleBySucursal((prev) => ({ ...prev, [sucursalId]: !prev[sucursalId] }))
    }

    if (!mounted) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <h1 className={estilos.titulo}>{tr('Sucursales', 'Branches')}</h1>
                <p className={estilos.subtitulo}>{tr('Gestiona sedes, encargados y estado operativo de cada sucursal', 'Manage branches, managers and operational status for each location')}</p>
            </div>

            {estadoOperacion.texto && (
                <div className={`${estilos.estadoOperacion} ${estilos[estadoOperacion.tipo]}`}>
                    {estadoOperacion.texto}
                </div>
            )}

            {credencialesGeneradas && (
                <div className={estilos.credencialesBox}>
                    <h4>{tr('Acceso generado para la sucursal', 'Generated branch access')}</h4>
                    <div className={estilos.credencialesGrid}>
                        <div>
                            <span>{tr('Usuario (email)', 'User (email)')}</span>
                            <strong>{credencialesGeneradas.email}</strong>
                        </div>
                        <div>
                            <span>{tr('Contrasena temporal', 'Temporary password')}</span>
                            <strong>{credencialesGeneradas.password}</strong>
                        </div>
                        <div>
                            <span>{tr('Nombre', 'Name')}</span>
                            <strong>{credencialesGeneradas.nombre}</strong>
                        </div>
                        <div>
                            <span>{tr('Cedula', 'ID')}</span>
                            <strong>{credencialesGeneradas.cedula}</strong>
                        </div>
                    </div>
                    <p>{tr('Este acceso se crea con tipo sucursales y modo POS.', 'This access is created with branch role and POS mode.')}</p>
                </div>
            )}

            <div className={estilos.stats}>
                <div className={estilos.statCard}>
                    <h4>{tr('Sucursales Totales', 'Total Branches')}</h4>
                    <p>{resumen.total}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Activas', 'Active')}</h4>
                    <p>{resumen.activas}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Inactivas', 'Inactive')}</h4>
                    <p>{resumen.inactivas}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Principal', 'Primary')}</h4>
                    <p>{resumen.principales}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Con Encargado', 'With Manager')}</h4>
                    <p>{resumen.conEncargado}</p>
                </div>
            </div>

            <div className={estilos.grid}>
                <div className={`${estilos.panel} ${estilos.panelFormulario}`}>
                    <h3>{formulario.id ? tr('Editar Sucursal', 'Edit Branch') : tr('Nueva Sucursal', 'New Branch')}</h3>
                    <form className={estilos.form} onSubmit={onSubmit}>
                        <input className={estilos.input} type="text" value={formulario.nombre} onChange={(e) => actualizarCampo('nombre', e.target.value)} placeholder={tr('Nombre de sucursal', 'Branch name')} />

                        <div className={estilos.row}>
                            <input className={estilos.input} type="text" value={formulario.telefono} onChange={(e) => actualizarCampo('telefono', e.target.value)} placeholder={tr('Telefono', 'Phone')} />
                            <input className={estilos.input} type="email" value={formulario.email} onChange={(e) => actualizarCampo('email', e.target.value)} placeholder={tr('Correo', 'Email')} />
                        </div>

                        <div className={estilos.row}>
                            <input className={estilos.input} type="text" value={formulario.ciudad} onChange={(e) => actualizarCampo('ciudad', e.target.value)} placeholder={tr('Ciudad', 'City')} />
                            <select className={estilos.select} value={formulario.monedaId} onChange={(e) => actualizarCampo('monedaId', e.target.value)}>
                                <option value="">{tr('Seleccionar moneda', 'Select currency')}</option>
                                {monedas.map((moneda) => (
                                    <option key={moneda.id} value={moneda.id}>{moneda.codigo} - {moneda.nombre} ({moneda.simbolo})</option>
                                ))}
                            </select>
                        </div>

                        <div className={estilos.row}>
                            <select className={estilos.select} value={formulario.encargadoUsuarioId} onChange={(e) => actualizarCampo('encargadoUsuarioId', e.target.value)}>
                                <option value="">{tr('Sin encargado asignado', 'No manager assigned')}</option>
                                {usuarios.map((usuario) => (
                                    <option key={usuario.id} value={usuario.id}>{usuario.nombre}</option>
                                ))}
                            </select>
                            <input className={estilos.input} type="text" value={formulario.codigo || ''} readOnly disabled placeholder={tr('Codigo autogenerado al guardar', 'Code auto-generated when saved')} />
                        </div>

                        <input className={estilos.input} type="text" value={formulario.direccion} onChange={(e) => actualizarCampo('direccion', e.target.value)} placeholder={tr('Direccion', 'Address')} />

                        <textarea className={estilos.textarea} value={formulario.notas} onChange={(e) => actualizarCampo('notas', e.target.value)} placeholder={tr('Notas internas', 'Internal notes')} />

                        <label className={estilos.checkLabel}>
                            <input type="checkbox" checked={formulario.esPrincipal} onChange={(e) => actualizarCampo('esPrincipal', e.target.checked)} />
                            {tr('Marcar como sucursal principal', 'Set as primary branch')}
                        </label>

                        <label className={estilos.checkLabel}>
                            <input type="checkbox" checked={formulario.activa} onChange={(e) => actualizarCampo('activa', e.target.checked)} />
                            {tr('Sucursal activa', 'Active branch')}
                        </label>

                        <div className={estilos.botones}>
                            <button className={estilos.btn} type="submit" disabled={guardando}>
                                {guardando ? tr('Guardando...', 'Saving...') : formulario.id ? tr('Actualizar Sucursal', 'Update Branch') : tr('Crear Sucursal', 'Create Branch')}
                            </button>
                            {formulario.id && (
                                <button className={estilos.btnSecundario} type="button" onClick={limpiarFormulario}>
                                    {tr('Cancelar edicion', 'Cancel editing')}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className={`${estilos.panel} ${estilos.panelTabla}`}>
                    <h3>{tr('Listado de Sucursales', 'Branch List')}</h3>

                    <div className={estilos.filtros}>
                        <input className={estilos.input} type="text" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder={tr('Buscar por codigo, nombre o ciudad...', 'Search by code, name or city...')} />
                        <select className={estilos.select} value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                            <option value="">{tr('Todas', 'All')}</option>
                            <option value="activas">{tr('Activas', 'Active')}</option>
                            <option value="inactivas">{tr('Inactivas', 'Inactive')}</option>
                        </select>
                    </div>

                    {cargando ? <LoadingScreen /> : sucursales.length === 0 ? (
                        <div className={estilos.vacio}><p>{tr('No hay sucursales registradas', 'No branches found')}</p></div>
                    ) : (
                        <div className={estilos.tabla}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>{tr('Sucursal', 'Branch')}</th>
                                        <th>{tr('Admin', 'Admin')}</th>
                                        <th>{tr('Encargado', 'Manager')}</th>
                                        <th>{tr('Usuarios', 'Users')}</th>
                                        <th>{tr('Acciones', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sucursalesPaginadas.map((sucursal) => {
                                        const credAdmin = credencialesPorSucursal[sucursal.id]
                                        const passwordActual = credAdmin?.password || ''
                                        const visible = Boolean(passwordVisibleBySucursal[sucursal.id])
                                        const passwordMostrada = visible ? (passwordActual || '--------') : '••••••••'

                                        return (
                                            <tr key={sucursal.id}>
                                                <td data-label={tr('Sucursal', 'Branch')}>
                                                    <strong>{sucursal.nombre}</strong>
                                                    <br />
                                                    <span className={estilos.codigoSucursal}>{sucursal.codigo}</span>
                                                    <div className={estilos.badges}>
                                                        {Boolean(sucursal.es_principal) && <span className={`${estilos.badge} ${estilos.principal}`}>{tr('Principal', 'Primary')}</span>}
                                                        <span className={`${estilos.badge} ${Boolean(sucursal.activa) ? estilos.activa : estilos.inactiva}`}>
                                                            {Boolean(sucursal.activa) ? tr('Activa', 'Active') : tr('Inactiva', 'Inactive')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td data-label={tr('Admin', 'Admin')}>
                                                    <div className={estilos.adminCreds}>
                                                        <div>
                                                            <span>{tr('Usuario', 'User')}</span>
                                                            <strong>{sucursal.usuario_pos_email || sucursal.email || '-'}</strong>
                                                        </div>
                                                        <div>
                                                            <span>{tr('Contrasena', 'Password')}</span>
                                                            <strong>
                                                                {credAdmin
                                                                    ? passwordMostrada
                                                                    : <em style={{ opacity: 0.5, fontStyle: 'normal', fontSize: '0.8em' }}>{tr('Regenerar para ver', 'Regenerate to view')}</em>
                                                                }
                                                            </strong>
                                                        </div>
                                                        <div className={estilos.adminTools}>
                                                            {credAdmin && (
                                                                <button
                                                                    type="button"
                                                                    className={`${estilos.btnIcono} ${estilos.btnOjo}`}
                                                                    onClick={() => togglePasswordVisible(sucursal.id)}
                                                                    title={visible ? tr('Ocultar clave', 'Hide password') : tr('Mostrar clave', 'Show password')}
                                                                    aria-label={visible ? tr('Ocultar clave', 'Hide password') : tr('Mostrar clave', 'Show password')}
                                                                >
                                                                    <ion-icon name={visible ? 'eye-off-outline' : 'eye-outline'} />
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                disabled={regenerandoId === sucursal.id}
                                                                className={`${estilos.btnIcono} ${estilos.btnClaveInline}`}
                                                                onClick={() => manejarRegenerarClave(sucursal)}
                                                                title={tr('Regenerar clave', 'Reset password')}
                                                                aria-label={tr('Regenerar clave', 'Reset password')}
                                                            >
                                                                <ion-icon name={regenerandoId === sucursal.id ? 'hourglass-outline' : 'refresh-outline'} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label={tr('Encargado', 'Manager')}>{sucursal.encargado_nombre || '-'}</td>
                                                <td data-label={tr('Usuarios', 'Users')}>{sucursal.total_usuarios || 0}</td>
                                                <td data-label={tr('Acciones', 'Actions')}>
                                                    <div className={`${estilos.acciones} ${estilos.accionesCelda}`}>
                                                        <button type="button" className={`${estilos.btnIcono} ${estilos.btnEditar}`} onClick={() => editarSucursal(sucursal)} title={tr('Editar', 'Edit')} aria-label={tr('Editar', 'Edit')}>
                                                            <ion-icon name="create-outline" />
                                                        </button>
                                                        <button type="button" className={`${estilos.btnIcono} ${estilos.btnEstado}`} onClick={() => manejarEstado(sucursal.id, !Boolean(sucursal.activa))} title={Boolean(sucursal.activa) ? tr('Desactivar', 'Disable') : tr('Activar', 'Enable')} aria-label={Boolean(sucursal.activa) ? tr('Desactivar', 'Disable') : tr('Activar', 'Enable')}>
                                                            <ion-icon name={Boolean(sucursal.activa) ? 'pause-outline' : 'play-outline'} />
                                                        </button>
                                                        <button type="button" disabled={eliminandoId === sucursal.id} className={`${estilos.btnIcono} ${estilos.btnEliminar}`} onClick={() => manejarEliminar(sucursal)} title={tr('Eliminar', 'Delete')} aria-label={tr('Eliminar', 'Delete')}>
                                                            <ion-icon name={eliminandoId === sucursal.id ? 'hourglass-outline' : 'trash-outline'} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            {sucursales.length > FILAS_POR_PAGINA && (
                                <div className={estilos.paginacion}>
                                    <button type="button" className={estilos.btnPagina} disabled={paginaActual === 1} onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}>
                                        {tr('Anterior', 'Previous')}
                                    </button>
                                    <span className={estilos.paginaInfo}>
                                        {tr('Pagina', 'Page')} {paginaActual} {tr('de', 'of')} {totalPaginas}
                                    </span>
                                    <button type="button" className={estilos.btnPagina} disabled={paginaActual >= totalPaginas} onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}>
                                        {tr('Siguiente', 'Next')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}