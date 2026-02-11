"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerUsuarios, obtenerUsuario, crearUsuario, actualizarUsuario, eliminarUsuario, obtenerRoles } from './servidor'
import estilos from './usuarios.module.css'

export default function UsuariosAdmin() {
    const router = useRouter()
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

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resultadoUsuarios, resultadoRoles] = await Promise.all([
                obtenerUsuarios(),
                obtenerRoles()
            ])

            if (resultadoUsuarios.success) {
                setUsuarios(resultadoUsuarios.usuarios)
            } else {
                alert(resultadoUsuarios.mensaje || 'Error al cargar usuarios')
            }

            if (resultadoRoles.success) {
                setRoles(resultadoRoles.roles)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const limpiarFormulario = () => {
        setFormData({
            nombre: '',
            cedula: '',
            email: '',
            password: '',
            tipo: 'vendedor',
            rol_id: '',
            activo: true
        })
        setModoEdicion(false)
        setUsuarioSeleccionado(null)
        setMostrarPassword(false)
    }

    const abrirFormularioNuevo = () => {
        limpiarFormulario()
        setVistaActual('formulario')
    }

    const abrirFormularioEditar = (usuario) => {
        setFormData({
            nombre: usuario.nombre,
            cedula: usuario.cedula,
            email: usuario.email,
            password: '',
            tipo: usuario.tipo,
            rol_id: usuario.rol_id || '',
            activo: usuario.activo
        })
        setUsuarioSeleccionado(usuario)
        setModoEdicion(true)
        setVistaActual('formulario')
    }

    const esAdminPrincipal = (usuario) => {
        return usuario && usuario.tipo === 'admin'
    }

    const abrirDetalles = async (id) => {
        setProcesando(true)
        try {
            const resultado = await obtenerUsuario(id)
            if (resultado.success) {
                setUsuarioSeleccionado(resultado.usuario)
                setVistaActual('detalles')
            } else {
                alert(resultado.mensaje || 'Error al cargar usuario')
            }
        } catch (error) {
            console.error('Error al cargar usuario:', error)
            alert('Error al cargar datos')
        } finally {
            setProcesando(false)
        }
    }

    const volverListado = () => {
        setVistaActual('listado')
        limpiarFormulario()
        setUsuarioSeleccionado(null)
    }

    const manejarCambio = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const validarFormulario = () => {
        if (!formData.nombre.trim()) {
            alert('El nombre es obligatorio')
            return false
        }

        if (!formData.cedula.trim()) {
            alert('La cedula es obligatoria')
            return false
        }

        if (formData.cedula.trim().length < 11) {
            alert('La cedula debe tener al menos 11 caracteres')
            return false
        }

        if (!formData.email.trim()) {
            alert('El email es obligatorio')
            return false
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            alert('El email no es valido')
            return false
        }

        if (!modoEdicion && !formData.password) {
            alert('La contraseña es obligatoria')
            return false
        }

        if (formData.password && formData.password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres')
            return false
        }

        return true
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) return

        setProcesando(true)
        try {
            let resultado

            if (modoEdicion) {
                resultado = await actualizarUsuario(usuarioSeleccionado.id, formData)
            } else {
                resultado = await crearUsuario(formData)
            }

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
                volverListado()
            } else {
                alert(resultado.mensaje || 'Error al guardar usuario')
            }
        } catch (error) {
            console.error('Error al guardar usuario:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarEliminar = async (id, nombre) => {
        if (!confirm(`¿Estas seguro de eliminar el usuario "${nombre}"?`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarUsuario(id)
            if (resultado.success) {
                await cargarDatos()
                alert(resultado.mensaje)
                if (vistaActual === 'detalles') {
                    volverListado()
                }
            } else {
                alert(resultado.mensaje || 'Error al eliminar usuario')
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const usuariosFiltrados = usuarios.filter(usuario => {
        const cumpleBusqueda = busqueda === '' ||
            usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            usuario.cedula.includes(busqueda) ||
            usuario.email.toLowerCase().includes(busqueda.toLowerCase())

        const cumpleTipo = filtroTipo === 'todos' || usuario.tipo === filtroTipo

        const cumpleEstado = filtroEstado === 'todos' || 
            (filtroEstado === 'activos' && usuario.activo) ||
            (filtroEstado === 'inactivos' && !usuario.activo)

        return cumpleBusqueda && cumpleTipo && cumpleEstado
    })

    const calcularEstadisticas = () => {
        const total = usuarios.length
        const activos = usuarios.filter(u => u.activo).length
        const inactivos = usuarios.filter(u => !u.activo).length
        const admins = usuarios.filter(u => u.tipo === 'admin').length
        const vendedores = usuarios.filter(u => u.tipo === 'vendedor').length

        return { total, activos, inactivos, admins, vendedores }
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const obtenerColorTipo = (tipo) => {
        switch(tipo) {
            case 'admin': return estilos.admin
            case 'vendedor': return estilos.vendedor
            default: return ''
        }
    }

    const estadisticas = calcularEstadisticas()

    if (vistaActual === 'formulario') {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>{modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}</h1>
                        <p className={estilos.subtitulo}>{modoEdicion ? 'Modifica los datos del usuario' : 'Registra un nuevo usuario'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={volverListado}
                        className={estilos.btnVolver}
                        disabled={procesando}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
                    </button>
                </div>

                <div className={estilos.formulario}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Informacion Personal</h2>
                        
                        <div className={estilos.grupoInput}>
                            <label>Nombre Completo *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder="Ej: Juan Perez"
                                required
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grupoDoble}>
                            <div className={estilos.grupoInput}>
                                <label>Cedula *</label>
                                <input
                                    type="text"
                                    name="cedula"
                                    value={formData.cedula}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="000-0000000-0"
                                    required
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="ejemplo@correo.com"
                                    required
                                    disabled={procesando || (modoEdicion && esAdminPrincipal(usuarioSeleccionado))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Credenciales y Permisos</h2>

                        <div className={estilos.grupoInput}>
                            <label>Contraseña {modoEdicion && '(Dejar vacio para no cambiar)'}</label>
                            <div className={estilos.passwordWrapper}>
                                <input
                                    type={mostrarPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="Min 6 caracteres"
                                    disabled={procesando}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarPassword(!mostrarPassword)}
                                    className={estilos.btnPassword}
                                >
                                    <ion-icon name={mostrarPassword ? "eye-off-outline" : "eye-outline"}></ion-icon>
                                </button>
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Rol</label>
                            <select
                                name="rol_id"
                                value={formData.rol_id}
                                onChange={manejarCambio}
                                className={estilos.input}
                                disabled={procesando || (modoEdicion && esAdminPrincipal(usuarioSeleccionado))}
                            >
                                <option value="">Sin rol especifico</option>
                                {roles.map(rol => (
                                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                                ))}
                            </select>
                            {modoEdicion && esAdminPrincipal(usuarioSeleccionado) && (
                                <span className={estilos.ayudaTexto}>El administrador principal no puede cambiar de rol</span>
                            )}
                        </div>

                        <div className={estilos.grupoCheckbox}>
                            <input
                                type="checkbox"
                                name="activo"
                                id="activo"
                                checked={formData.activo}
                                onChange={manejarCambio}
                                disabled={procesando}
                            />
                            <label htmlFor="activo">Usuario activo</label>
                        </div>
                    </div>

                    <div className={estilos.botonesFormulario}>
                        <button
                            type="button"
                            onClick={volverListado}
                            className={estilos.btnCancelar}
                            disabled={procesando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={manejarSubmit}
                            className={estilos.btnGuardar}
                            disabled={procesando}
                        >
                            {procesando ? 'Guardando...' : modoEdicion ? 'Actualizar Usuario' : 'Crear Usuario'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (vistaActual === 'detalles' && usuarioSeleccionado) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>Detalles del Usuario</h1>
                        <p className={estilos.subtitulo}>Informacion completa</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button
                            type="button"
                            onClick={() => abrirFormularioEditar(usuarioSeleccionado)}
                            className={estilos.btnEditar}
                            disabled={procesando || usuarioSeleccionado.tipo === 'admin'}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            <span>Editar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => manejarEliminar(usuarioSeleccionado.id, usuarioSeleccionado.nombre)}
                            className={estilos.btnEliminar}
                            disabled={procesando || usuarioSeleccionado.tipo === 'admin'}
                        >
                            <ion-icon name="trash-outline"></ion-icon>
                            <span>Eliminar</span>
                        </button>
                        <button
                            type="button"
                            onClick={volverListado}
                            className={estilos.btnVolver}
                            disabled={procesando}
                        >
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            <span>Volver</span>
                        </button>
                    </div>
                </div>

                <div className={estilos.detallesGrid}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <div className={estilos.panelHeader}>
                            <h2 className={estilos.panelTitulo}>Informacion Personal</h2>
                            <span className={`${estilos.badge} ${usuarioSeleccionado.activo ? estilos.activo : estilos.inactivo}`}>
                                {usuarioSeleccionado.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>

                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Nombre</span>
                                <span className={estilos.infoValor}>{usuarioSeleccionado.nombre}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Cedula</span>
                                <span className={estilos.infoValor}>{usuarioSeleccionado.cedula}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Email</span>
                                <span className={estilos.infoValor}>{usuarioSeleccionado.email}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Fecha de Creacion</span>
                                <span className={estilos.infoValor}>{formatearFecha(usuarioSeleccionado.fecha_creacion)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Permisos y Acceso</h2>

                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Tipo de Usuario</span>
                                <span className={`${estilos.badgeTipo} ${obtenerColorTipo(usuarioSeleccionado.tipo)}`}>
                                    {usuarioSeleccionado.tipo === 'admin' ? 'Administrador' : 'Vendedor'}
                                </span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Rol Asignado</span>
                                <span className={estilos.infoValor}>{usuarioSeleccionado.rol_nombre || 'Sin rol especifico'}</span>
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
                    <h1 className={estilos.titulo}>Usuarios</h1>
                    <p className={estilos.subtitulo}>Gestiona los usuarios del sistema</p>
                </div>
                <button
                    onClick={abrirFormularioNuevo}
                    className={estilos.btnNuevo}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="people-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Usuarios</span>
                        <span className={estilos.estadValor}>{estadisticas.total}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Activos</span>
                        <span className={estilos.estadValor}>{estadisticas.activos}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                        <ion-icon name="shield-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Administradores</span>
                        <span className={estilos.estadValor}>{estadisticas.admins}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="person-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Vendedores</span>
                        <span className={estilos.estadValor}>{estadisticas.vendedores}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

                <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className={estilos.selectFiltro}
                >
                    <option value="todos">Todos los tipos</option>
                    <option value="admin">Administradores</option>
                    <option value="vendedor">Vendedores</option>
                </select>

                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className={estilos.selectFiltro}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                </select>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando usuarios...</span>
                </div>
            ) : usuariosFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="people-outline"></ion-icon>
                    <span>No hay usuarios que coincidan con tu busqueda</span>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {usuariosFiltrados.map((usuario) => (
                        <div key={usuario.id} className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                <div className={estilos.cardIcono}>
                                    <ion-icon name="person-outline"></ion-icon>
                                </div>
                                <div className={estilos.cardTitulo}>
                                    <h3>{usuario.nombre}</h3>
                                    <div className={estilos.badgeContainer}>
                                        <span className={`${estilos.badgeTipo} ${obtenerColorTipo(usuario.tipo)}`}>
                                            {usuario.tipo === 'admin' ? 'Admin' : 'Vendedor'}
                                        </span>
                                        <span className={`${estilos.badge} ${usuario.activo ? estilos.activo : estilos.inactivo}`}>
                                            {usuario.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.cardBody}>
                                <div className={estilos.cardInfo}>
                                    <div className={estilos.cardItem}>
                                        <ion-icon name="card-outline"></ion-icon>
                                        <span>{usuario.cedula}</span>
                                    </div>
                                    <div className={estilos.cardItem}>
                                        <ion-icon name="mail-outline"></ion-icon>
                                        <span>{usuario.email}</span>
                                    </div>
                                    {usuario.rol_nombre && (
                                        <div className={estilos.cardItem}>
                                            <ion-icon name="shield-checkmark-outline"></ion-icon>
                                            <span>{usuario.rol_nombre}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={estilos.cardFooter}>
                                <button
                                    onClick={() => abrirDetalles(usuario.id)}
                                    className={estilos.btnIcono}
                                    title="Ver detalles"
                                >
                                    <ion-icon name="eye-outline"></ion-icon>
                                </button>
                                <button
                                    onClick={() => abrirFormularioEditar(usuario)}
                                    className={estilos.btnIcono}
                                    title="Editar"
                                    disabled={usuario.tipo === 'admin'}
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                </button>
                                <button
                                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                    onClick={() => manejarEliminar(usuario.id, usuario.nombre)}
                                    disabled={procesando || usuario.tipo === 'admin'}
                                    title="Eliminar"
                                >
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}