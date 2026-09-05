"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerUsuarios, obtenerUsuario, crearUsuario, actualizarUsuario, eliminarUsuario, obtenerRoles } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'
import estilos from './usuarios.module.css'

export default function UsuariosAdmin() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [usuarios, setUsuarios] = useState([])
    const [roles, setRoles] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroTipo, setFiltroTipo] = useState('todos')
    const [filtroEstado, setFiltroEstado] = useState('todos')

    const [vistaActual, setVistaActual] = useState('listado')
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
    const [modoEdicion, setModoEdicion] = useState(false)

    const [formData, setFormData] = useState({
        nombre: '',
        cedula: '',
        email: '',
        password: '',
        tipo: 'vendedor',
        rol_id: '',
        activo: true
    })

    const [mostrarPassword, setMostrarPassword] = useState(false)
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errores, setErrores] = useState({ nombre: '', cedula: '', email: '', password: '', confirmPassword: '' })

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        const manejarCambioTema = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)
        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => { cargarDatos() }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resultadoUsuarios, resultadoRoles] = await Promise.all([obtenerUsuarios(), obtenerRoles()])
            if (resultadoUsuarios.success) setUsuarios(resultadoUsuarios.usuarios)
            else alert(resultadoUsuarios.mensaje || tr('Error al cargar usuarios', 'Error loading users'))
            if (resultadoRoles.success) setRoles(resultadoRoles.roles)
        } catch (error) {
            alert(tr('Error al cargar datos', 'Error loading data'))
        } finally {
            setCargando(false)
        }
    }

    const limpiarFormulario = () => {
        setFormData({ nombre: '', cedula: '', email: '', password: '', tipo: 'vendedor', rol_id: '', activo: true })
        setModoEdicion(false)
        setUsuarioSeleccionado(null)
        setMostrarPassword(false)
        setConfirmPassword('')
        setErrores({ nombre: '', cedula: '', email: '', password: '', confirmPassword: '' })
    }

    const abrirFormularioNuevo = () => { limpiarFormulario(); setVistaActual('formulario') }

    const abrirFormularioEditar = (usuario) => {
        setFormData({ nombre: usuario.nombre, cedula: usuario.cedula, email: usuario.email, password: '', tipo: usuario.tipo, rol_id: usuario.rol_id || '', activo: usuario.activo })
        setUsuarioSeleccionado(usuario)
        setModoEdicion(true)
        setVistaActual('formulario')
    }

    const esAdminPrincipal = (usuario) => usuario && usuario.tipo === 'superadmin'

    const abrirDetalles = async (id) => {
        setProcesando(true)
        try {
            const resultado = await obtenerUsuario(id)
            if (resultado.success) { setUsuarioSeleccionado(resultado.usuario); setVistaActual('detalles') }
            else alert(resultado.mensaje || tr('Error al cargar usuario', 'Error loading user'))
        } catch { alert(tr('Error al cargar datos', 'Error loading data')) }
        finally { setProcesando(false) }
    }

    const volverListado = () => { setVistaActual('listado'); limpiarFormulario(); setUsuarioSeleccionado(null) }

    const manejarCambio = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const validarFormulario = () => {
        const e = { nombre: '', cedula: '', email: '', password: '', confirmPassword: '' }
        let ok = true
        if (!formData.nombre.trim()) { e.nombre = tr('El nombre es obligatorio', 'Name is required'); ok = false }
        if (!formData.cedula.trim()) { e.cedula = tr('La cédula es obligatoria', 'ID is required'); ok = false }
        else if (formData.cedula.trim().length < 11) { e.cedula = tr('Debe tener al menos 11 caracteres', 'Must have at least 11 characters'); ok = false }
        if (!formData.email.trim()) { e.email = tr('El email es obligatorio', 'Email is required'); ok = false }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { e.email = tr('Email no válido', 'Invalid email'); ok = false }
        if (!modoEdicion && !formData.password) { e.password = tr('La contraseña es obligatoria', 'Password is required'); ok = false }
        else if (formData.password && formData.password.length < 6) { e.password = tr('Mínimo 6 caracteres', 'Min 6 characters'); ok = false }
        if (formData.password && formData.password !== confirmPassword) { e.confirmPassword = tr('Las contraseñas no coinciden', 'Passwords do not match'); ok = false }
        setErrores(e)
        return ok
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()
        if (!validarFormulario()) return
        setProcesando(true)
        try {
            const resultado = modoEdicion
                ? await actualizarUsuario(usuarioSeleccionado.id, formData)
                : await crearUsuario(formData)
            if (resultado.success) { alert(resultado.mensaje); await cargarDatos(); volverListado() }
            else alert(resultado.mensaje || tr('Error al guardar usuario', 'Error saving user'))
        } catch { alert(tr('Error al procesar la solicitud', 'Error processing request')) }
        finally { setProcesando(false) }
    }

    const manejarEliminar = async (id, nombre) => {
        if (!confirm(language === 'en' ? `Are you sure you want to delete user "${nombre}"?` : `Estas seguro de eliminar el usuario "${nombre}"?`)) return
        setProcesando(true)
        try {
            const resultado = await eliminarUsuario(id)
            if (resultado.success) {
                await cargarDatos()
                alert(resultado.mensaje)
                if (vistaActual === 'detalles') volverListado()
            } else alert(resultado.mensaje || tr('Error al eliminar usuario', 'Error deleting user'))
        } catch { alert(tr('Error al procesar la solicitud', 'Error processing request')) }
        finally { setProcesando(false) }
    }

    const usuariosFiltrados = usuarios.filter(u => {
        const cumpleBusqueda = busqueda === '' ||
            u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.cedula.includes(busqueda) ||
            u.email.toLowerCase().includes(busqueda.toLowerCase())
        const cumpleTipo = filtroTipo === 'todos' || u.tipo === filtroTipo
        const cumpleEstado = filtroEstado === 'todos' ||
            (filtroEstado === 'activos' && u.activo) ||
            (filtroEstado === 'inactivos' && !u.activo)
        return cumpleBusqueda && cumpleTipo && cumpleEstado
    })

    const calcularEstadisticas = () => ({
        total: usuarios.length,
        activos: usuarios.filter(u => u.activo).length,
        inactivos: usuarios.filter(u => !u.activo).length,
        admins: usuarios.filter(u => u.tipo === 'admin').length,
        vendedores: usuarios.filter(u => u.tipo === 'vendedor').length,
        financiamiento: usuarios.filter(u => u.tipo === 'financiamiento').length,
        sucursales: usuarios.filter(u => u.tipo === 'sucursales').length
    })

    const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { year: 'numeric', month: 'long', day: 'numeric' })

    const obtenerColorTipo = (tipo) => {
        switch(tipo) {
            case 'superadmin':    return estilos.superadmin
            case 'admin':         return estilos.admin
            case 'vendedor':      return estilos.vendedor
            case 'financiamiento':return estilos.financiamiento
            case 'sucursales':    return estilos.sucursales
            default: return ''
        }
    }

    const obtenerLabelTipo = (tipo) => {
        switch(tipo) {
            case 'superadmin':    return tr('Super Admin', 'Super Admin')
            case 'admin':         return tr('Admin', 'Admin')
            case 'vendedor':      return tr('Vendedor', 'Seller')
            case 'financiamiento':return tr('Financiamiento', 'Financing')
            case 'sucursales':    return tr('Sucursales', 'Branches')
            default: return tipo
        }
    }

    const estadisticas = calcularEstadisticas()

    const ROLES_POR_TIPO = {
        vendedor:       r => ['cajero', 'inventario', 'vendedor'].includes(r.nombre),
        financiamiento: r => ['financiamiento'].includes(r.nombre),
    }

    const getPrimerRolPorTipo = (tipo) => {
        if (tipo === 'admin') return ''
        const filtro = ROLES_POR_TIPO[tipo] || (() => false)
        const primer = roles.find(filtro)
        return primer ? String(primer.id) : ''
    }

    useEffect(() => {
        if (vistaActual === 'formulario' && !modoEdicion && roles.length > 0) {
            setFormData(p => ({ ...p, rol_id: getPrimerRolPorTipo(p.tipo) }))
        }
    }, [vistaActual, roles])

    if (vistaActual === 'formulario') {
        const iniciales = formData.nombre
            ? formData.nombre.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
            : null
        const esAdminBloqueado = modoEdicion && esAdminPrincipal(usuarioSeleccionado)

        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>{modoEdicion ? tr('Editar Usuario', 'Edit User') : tr('Nuevo Usuario', 'New User')}</h1>
                        <p className={estilos.subtitulo}>{modoEdicion ? tr('Modifica los datos del usuario', 'Update user data') : tr('Registra un nuevo usuario en el sistema', 'Register a new user in the system')}</p>
                    </div>
                    <button type="button" onClick={volverListado} className={estilos.btnVolver} disabled={procesando}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>{tr('Volver', 'Back')}</span>
                    </button>
                </div>

                <div className={estilos.formulario}>
                    {/* ── Vista previa del usuario ── */}
                    <div className={`${estilos.panel} ${estilos[tema]} ${estilos.panelPreview}`}>
                        <div className={`${estilos.avatarPreview} ${estilos['avatar_' + formData.tipo]}`} style={usuarioSeleccionado?.avatar_url ? { backgroundImage: `url(${usuarioSeleccionado.avatar_url})`, backgroundSize: 'cover', fontSize: 0 } : {}}>
                            {!usuarioSeleccionado?.avatar_url && (iniciales || <ion-icon name="person-outline"></ion-icon>)}
                        </div>
                        <div className={estilos.previewInfo}>
                            <strong>{formData.nombre || tr('Nombre del usuario', 'User name')}</strong>
                            <span>{formData.email || 'correo@ejemplo.com'}</span>
                            <span className={`${estilos.badgeTipo} ${obtenerColorTipo(formData.tipo)}`}>{obtenerLabelTipo(formData.tipo)}</span>
                        </div>
                    </div>

                    {/* ── Información personal ── */}
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="person-circle-outline"></ion-icon>
                            {tr('Información Personal', 'Personal Information')}
                        </h2>
                        <div className={estilos.grupoInput}>
                            <label>{tr('Nombre Completo *', 'Full Name *')}</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={manejarCambio}
                                className={`${estilos.input} ${errores.nombre ? estilos.inputError : ''}`}
                                placeholder={tr('Ej: Juan Pérez García', 'Ex: John Doe Smith')} disabled={procesando} />
                            {errores.nombre && <span className={estilos.errorMsg}><ion-icon name="alert-circle-outline"></ion-icon>{errores.nombre}</span>}
                        </div>
                        <div className={estilos.grupoDoble}>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Cédula *', 'ID *')}</label>
                                <input type="text" name="cedula" value={formData.cedula} onChange={manejarCambio}
                                    className={`${estilos.input} ${errores.cedula ? estilos.inputError : ''}`}
                                    placeholder="001-0000000-0" disabled={procesando} />
                                {errores.cedula && <span className={estilos.errorMsg}><ion-icon name="alert-circle-outline"></ion-icon>{errores.cedula}</span>}
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>Email *</label>
                                <input type="email" name="email" value={formData.email} onChange={manejarCambio}
                                    className={`${estilos.input} ${errores.email ? estilos.inputError : ''}`}
                                    placeholder="ejemplo@correo.com" disabled={procesando || esAdminBloqueado} />
                                {errores.email && <span className={estilos.errorMsg}><ion-icon name="alert-circle-outline"></ion-icon>{errores.email}</span>}
                            </div>
                        </div>
                    </div>

                    {/* ── Contraseña ── */}
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="lock-closed-outline"></ion-icon>
                            {tr('Contraseña', 'Password')}
                        </h2>
                        {modoEdicion && (
                            <p className={estilos.ayudaTexto}>
                                <ion-icon name="information-circle-outline"></ion-icon>
                                {tr('Deja los campos vacíos si no deseas cambiar la contraseña actual', 'Leave empty to keep the current password')}
                            </p>
                        )}
                        <div className={estilos.grupoDoble}>
                            <div className={estilos.grupoInput}>
                                <label>{modoEdicion ? tr('Nueva Contraseña', 'New Password') : tr('Contraseña *', 'Password *')}</label>
                                <div className={estilos.passwordWrapper}>
                                    <input type={mostrarPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={manejarCambio}
                                        className={`${estilos.input} ${errores.password ? estilos.inputError : ''}`}
                                        placeholder={tr('Mínimo 6 caracteres', 'Min 6 characters')} disabled={procesando} />
                                    <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} className={estilos.btnPassword}>
                                        <ion-icon name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}></ion-icon>
                                    </button>
                                </div>
                                {errores.password && <span className={estilos.errorMsg}><ion-icon name="alert-circle-outline"></ion-icon>{errores.password}</span>}
                            </div>
                            {(!modoEdicion || formData.password) && (
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Confirmar Contraseña', 'Confirm Password')}{!modoEdicion && ' *'}</label>
                                    <input type={mostrarPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                        className={`${estilos.input} ${errores.confirmPassword ? estilos.inputError : (confirmPassword && confirmPassword === formData.password ? estilos.inputOk : '')}`}
                                        placeholder={tr('Repite la contraseña', 'Repeat password')} disabled={procesando} />
                                    {errores.confirmPassword
                                        ? <span className={estilos.errorMsg}><ion-icon name="alert-circle-outline"></ion-icon>{errores.confirmPassword}</span>
                                        : confirmPassword && confirmPassword === formData.password
                                            ? <span className={estilos.okMsg}><ion-icon name="checkmark-circle-outline"></ion-icon>{tr('Las contraseñas coinciden', 'Passwords match')}</span>
                                            : null
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Tipo y permisos ── */}
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>
                            <ion-icon name="shield-outline"></ion-icon>
                            {tr('Tipo y Permisos', 'Type & Permissions')}
                        </h2>
                        {esAdminBloqueado && (
                            <p className={estilos.ayudaTexto}>
                                <ion-icon name="lock-closed-outline"></ion-icon>
                                {tr('El administrador principal no puede cambiar de tipo ni rol', 'The main administrator cannot change type or role')}
                            </p>
                        )}
                        <div className={estilos.grupoInput}>
                            <label>{tr('Tipo de Usuario', 'User Type')}</label>
                            {['superadmin', 'sucursales'].includes(formData.tipo) ? (
                                <div className={estilos.tipoSoloLectura}>
                                    <span className={`${estilos.badgeTipo} ${obtenerColorTipo(formData.tipo)}`}>{obtenerLabelTipo(formData.tipo)}</span>
                                    <span className={estilos.ayudaTexto}>
                                        <ion-icon name="lock-closed-outline"></ion-icon>
                                        {tr('Este tipo es administrado por el superadmin', 'This type is managed by superadmin')}
                                    </span>
                                </div>
                            ) : (
                                <div className={estilos.tipoSelector}>
                                    {[
                                        { value: 'vendedor',       icon: 'storefront-outline',      label: tr('Vendedor', 'Seller'),            desc: tr('Crea ventas y consulta productos', 'Creates sales and queries products') },
                                        { value: 'financiamiento', icon: 'cash-outline',             label: tr('Financiamiento', 'Financing'),   desc: tr('Gestiona créditos y finanzas', 'Manages credits and finances') },
                                        { value: 'admin',          icon: 'shield-checkmark-outline', label: tr('Administrador', 'Administrator'),desc: tr('Acceso completo a la empresa', 'Full company access') },
                                    ].map(t => (
                                        <button type="button" key={t.value}
                                            onClick={() => { if (!esAdminBloqueado && !procesando) setFormData(p => ({ ...p, tipo: t.value, rol_id: getPrimerRolPorTipo(t.value) })) }}
                                            className={`${estilos.tipoCard} ${formData.tipo === t.value ? estilos.tipoCardActivo : ''}`}
                                            disabled={procesando || esAdminBloqueado}
                                        >
                                            <ion-icon name={t.icon}></ion-icon>
                                            <div className={estilos.tipoCardTexto}>
                                                <strong>{t.label}</strong>
                                                <span>{t.desc}</span>
                                            </div>
                                            {formData.tipo === t.value && <ion-icon name="checkmark-circle" className={estilos.tipoCardCheck}></ion-icon>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className={estilos.grupoInput}>
                            {(() => {
                                const esAdmin = formData.tipo === 'admin'
                                const rolesFiltrados = esAdmin ? [] : roles.filter(ROLES_POR_TIPO[formData.tipo] || (() => false))
                                return (
                                    <>
                                        <label>
                                            {tr('Rol para', 'Role for')} <strong>{obtenerLabelTipo(formData.tipo)}</strong>
                                        </label>
                                        <div className={estilos.rolSelector}>
                                            {esAdmin ? (
                                                <button
                                                    type="button"
                                                    className={`${estilos.rolPill} ${estilos.rolPillActivo}`}
                                                    disabled
                                                >
                                                    <ion-icon name="shield-checkmark-outline"></ion-icon>
                                                    {tr('Todos los roles', 'All roles')}
                                                </button>
                                            ) : (
                                                rolesFiltrados.map(rol => (
                                                    <button
                                                        type="button"
                                                        key={rol.id}
                                                        onClick={() => !procesando && !esAdminBloqueado && setFormData(p => ({ ...p, rol_id: String(rol.id) }))}
                                                        className={`${estilos.rolPill} ${String(formData.rol_id) === String(rol.id) ? estilos.rolPillActivo : ''}`}
                                                        disabled={procesando || esAdminBloqueado}
                                                        title={rol.descripcion || rol.nombre}
                                                    >
                                                        <ion-icon name="shield-half-outline"></ion-icon>
                                                        {rol.nombre}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                        {!esAdmin && rolesFiltrados.length === 0 && (
                                            <span className={estilos.ayudaTexto}>
                                                <ion-icon name="information-circle-outline"></ion-icon>
                                                {tr('No hay roles para este tipo', 'No roles for this type')}
                                            </span>
                                        )}
                                    </>
                                )
                            })()}
                        </div>
                        <div className={estilos.grupoCheckbox}>
                            <input type="checkbox" name="activo" id="activo" checked={formData.activo} onChange={manejarCambio} disabled={procesando} />
                            <label htmlFor="activo">{tr('Usuario activo', 'Active user')}</label>
                        </div>
                    </div>

                    <div className={estilos.botonesFormulario}>
                        <button type="button" onClick={volverListado} className={estilos.btnCancelar} disabled={procesando}>{tr('Cancelar', 'Cancel')}</button>
                        <button type="button" onClick={manejarSubmit} className={estilos.btnGuardar} disabled={procesando}>
                            {procesando
                                ? <><ion-icon name="hourglass-outline"></ion-icon> {tr('Guardando...', 'Saving...')}</>
                                : modoEdicion
                                    ? <><ion-icon name="save-outline"></ion-icon> {tr('Actualizar Usuario', 'Update User')}</>
                                    : <><ion-icon name="person-add-outline"></ion-icon> {tr('Crear Usuario', 'Create User')}</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (vistaActual === 'detalles' && usuarioSeleccionado) {
        const iniciales = usuarioSeleccionado.nombre.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Detalles del Usuario', 'User Details')}</h1>
                        <p className={estilos.subtitulo}>{tr('Información completa del usuario', 'Complete user information')}</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button type="button" onClick={() => abrirFormularioEditar(usuarioSeleccionado)} className={estilos.btnEditar} disabled={procesando || esAdminPrincipal(usuarioSeleccionado)}>
                            <ion-icon name="create-outline"></ion-icon><span>{tr('Editar', 'Edit')}</span>
                        </button>
                        <button type="button" onClick={() => manejarEliminar(usuarioSeleccionado.id, usuarioSeleccionado.nombre)} className={estilos.btnEliminar} disabled={procesando || esAdminPrincipal(usuarioSeleccionado)}>
                            <ion-icon name="trash-outline"></ion-icon><span>{tr('Eliminar', 'Delete')}</span>
                        </button>
                        <button type="button" onClick={volverListado} className={estilos.btnVolver} disabled={procesando}>
                            <ion-icon name="arrow-back-outline"></ion-icon><span>{tr('Volver', 'Back')}</span>
                        </button>
                    </div>
                </div>

                {/* Tarjeta de perfil */}
                <div className={`${estilos.perfilCard} ${estilos[tema]}`}>
                    <div className={`${estilos.avatarGrande} ${estilos['avatar_' + usuarioSeleccionado.tipo]}`} style={usuarioSeleccionado.avatar_url ? { backgroundImage: `url(${usuarioSeleccionado.avatar_url})`, backgroundSize: 'cover', fontSize: 0 } : {}}>{!usuarioSeleccionado.avatar_url && iniciales}</div>
                    <div className={estilos.perfilInfo}>
                        <h2 className={estilos.perfilNombre}>{usuarioSeleccionado.nombre}</h2>
                        <span className={estilos.perfilEmail}>{usuarioSeleccionado.email}</span>
                        <div className={estilos.perfilBadges}>
                            <span className={`${estilos.badgeTipo} ${obtenerColorTipo(usuarioSeleccionado.tipo)}`}>{obtenerLabelTipo(usuarioSeleccionado.tipo)}</span>
                            <span className={`${estilos.badge} ${usuarioSeleccionado.activo ? estilos.activo : estilos.inactivo}`}>{usuarioSeleccionado.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}</span>
                        </div>
                    </div>
                </div>

                <div className={estilos.detallesGrid}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}><ion-icon name="person-circle-outline"></ion-icon>{tr('Información Personal', 'Personal Information')}</h2>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}><span className={estilos.infoLabel}>{tr('Nombre', 'Name')}</span><span className={estilos.infoValor}>{usuarioSeleccionado.nombre}</span></div>
                            <div className={estilos.infoItem}><span className={estilos.infoLabel}>{tr('Cédula', 'ID')}</span><span className={estilos.infoValor}>{usuarioSeleccionado.cedula}</span></div>
                            <div className={estilos.infoItem}><span className={estilos.infoLabel}>Email</span><span className={estilos.infoValor}>{usuarioSeleccionado.email}</span></div>
                            <div className={estilos.infoItem}><span className={estilos.infoLabel}>{tr('Miembro desde', 'Member since')}</span><span className={estilos.infoValor}>{formatearFecha(usuarioSeleccionado.fecha_creacion)}</span></div>
                        </div>
                    </div>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}><ion-icon name="shield-outline"></ion-icon>{tr('Permisos y Acceso', 'Permissions and Access')}</h2>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Tipo de Usuario', 'User Type')}</span>
                                <span className={`${estilos.badgeTipo} ${obtenerColorTipo(usuarioSeleccionado.tipo)}`}>{obtenerLabelTipo(usuarioSeleccionado.tipo)}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Rol Asignado', 'Assigned Role')}</span>
                                <span className={estilos.infoValor}>{usuarioSeleccionado.rol_nombre || <span className={estilos.sinRol}>{tr('Sin rol específico', 'No specific role')}</span>}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Usuarios', 'Users')}</h1>
                    <p className={estilos.subtitulo}>{tr('Gestiona los usuarios del sistema', 'Manage system users')}</p>
                </div>
                <button onClick={abrirFormularioNuevo} className={estilos.btnNuevo}>
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>{tr('Nuevo Usuario', 'New User')}</span>
                </button>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}><ion-icon name="people-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}><span className={estilos.estadLabel}>{tr('Total Usuarios', 'Total Users')}</span><span className={estilos.estadValor}>{estadisticas.total}</span></div>
                </div>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}><ion-icon name="checkmark-circle-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}><span className={estilos.estadLabel}>{tr('Activos', 'Active')}</span><span className={estilos.estadValor}>{estadisticas.activos}</span></div>
                </div>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.warning}`}><ion-icon name="shield-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}><span className={estilos.estadLabel}>{tr('Administradores', 'Administrators')}</span><span className={estilos.estadValor}>{estadisticas.admins}</span></div>
                </div>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}><ion-icon name="person-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}><span className={estilos.estadLabel}>{tr('Vendedores', 'Sellers')}</span><span className={estilos.estadValor}>{estadisticas.vendedores}</span></div>
                </div>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.purple}`}><ion-icon name="cash-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}><span className={estilos.estadLabel}>{tr('Financiamiento', 'Financing')}</span><span className={estilos.estadValor}>{estadisticas.financiamiento}</span></div>
                </div>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.teal}`}><ion-icon name="git-branch-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}><span className={estilos.estadLabel}>{tr('Sucursales', 'Branches')}</span><span className={estilos.estadValor}>{estadisticas.sucursales}</span></div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input type="text" placeholder={tr('Buscar usuario...', 'Search user...')} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={estilos.inputBusqueda} />
                </div>
                <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={estilos.selectFiltro}>
                    <option value="todos">{tr('Todos los tipos', 'All types')}</option>
                    <option value="admin">{tr('Administradores', 'Administrators')}</option>
                    <option value="vendedor">{tr('Vendedores', 'Sellers')}</option>
                    <option value="financiamiento">{tr('Financiamiento', 'Financing')}</option>
                    <option value="sucursales">{tr('Sucursales', 'Branches')}</option>
                </select>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={estilos.selectFiltro}>
                    <option value="todos">{tr('Todos los estados', 'All statuses')}</option>
                    <option value="activos">{tr('Activos', 'Active')}</option>
                    <option value="inactivos">{tr('Inactivos', 'Inactive')}</option>
                </select>
            </div>

            {cargando ? <LoadingScreen /> : usuariosFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="people-outline"></ion-icon>
                    <span>{tr('No hay usuarios que coincidan con tu busqueda', 'No users match your search')}</span>
                </div>
            ) : (
                <div className={`${estilos.tabla} ${estilos[tema]}`}>
                    <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                        <div className={estilos.colNombre}>{tr('Usuario', 'User')}</div>
                        <div className={estilos.colCedula}>{tr('Cedula', 'ID')}</div>
                        <div className={estilos.colEmail}>Email</div>
                        <div className={estilos.colTipo}>{tr('Tipo', 'Type')}</div>
                        <div className={estilos.colRol}>{tr('Rol', 'Role')}</div>
                        <div className={estilos.colEstado}>{tr('Estado', 'Status')}</div>
                        <div className={estilos.colAcciones}>{tr('Acciones', 'Actions')}</div>
                    </div>
                    <div className={estilos.tablaBody}>
                        {usuariosFiltrados.map((usuario) => (
                            <div key={usuario.id} className={`${estilos.tablaFila} ${estilos[tema]}`}>
                                <div className={estilos.colNombre} data-label={tr('Usuario', 'User')}>
                                    <div className={`${estilos.avatarIniciales} ${estilos['avatar_' + usuario.tipo]}`} style={usuario.avatar_url ? { backgroundImage: `url(${usuario.avatar_url})`, backgroundSize: 'cover', fontSize: 0 } : {}}>
                                        {!usuario.avatar_url && usuario.nombre.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <span className={estilos.nombreTexto}>{usuario.nombre}</span>
                                </div>
                                <div className={estilos.colCedula} data-label={tr('Cedula', 'ID')}>{usuario.cedula}</div>
                                <div className={estilos.colEmail} data-label="Email">{usuario.email}</div>
                                <div className={estilos.colTipo} data-label={tr('Tipo', 'Type')}>
                                    <span className={`${estilos.badgeTipo} ${obtenerColorTipo(usuario.tipo)}`}>
                                        {obtenerLabelTipo(usuario.tipo)}
                                    </span>
                                </div>
                                <div className={estilos.colRol} data-label={tr('Rol', 'Role')}>{usuario.rol_nombre || <span className={estilos.sinRol}>{tr('Sin rol', 'No role')}</span>}</div>
                                <div className={estilos.colEstado} data-label={tr('Estado', 'Status')}>
                                    <span className={`${estilos.badge} ${usuario.activo ? estilos.activo : estilos.inactivo}`}>
                                        {usuario.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                                    </span>
                                </div>
                                <div className={estilos.colAcciones} data-label={tr('Acciones', 'Actions')}>
                                    <button onClick={() => abrirDetalles(usuario.id)} className={estilos.btnIcono} title={tr('Ver detalles', 'View details')}>
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </button>
                                    <button onClick={() => abrirFormularioEditar(usuario)} className={estilos.btnIcono} title={tr('Editar', 'Edit')} disabled={esAdminPrincipal(usuario)}>
                                        <ion-icon name="create-outline"></ion-icon>
                                    </button>
                                    <button className={`${estilos.btnIcono} ${estilos.eliminar}`} onClick={() => manejarEliminar(usuario.id, usuario.nombre)} disabled={procesando || esAdminPrincipal(usuario)} title={tr('Eliminar', 'Delete')}>
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}