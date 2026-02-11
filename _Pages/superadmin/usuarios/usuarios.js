"use client"
import { useEffect, useState } from 'react'
import { obtenerEmpresas, obtenerUsuarios, crearUsuario, actualizarUsuario, toggleEstadoUsuario, eliminarUsuario, obtenerConteoRegistrosUsuario, actualizarModoSistema } from './servidor'
import estilos from './usuarios.module.css'

export default function UsuariosSuperAdmin() {
    const [tema, setTema] = useState('light')
    const [empresas, setEmpresas] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [filtroTipo, setFiltroTipo] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [busquedaEmpresa, setBusquedaEmpresa] = useState('')
    const [mostrarDropdownEmpresas, setMostrarDropdownEmpresas] = useState(false)
    const [empresaBuscada, setEmpresaBuscada] = useState('')
    const [mostrarModal, setMostrarModal] = useState(false)
    const [modoEdicion, setModoEdicion] = useState(false)
    const [usuarioEditar, setUsuarioEditar] = useState(null)
    const [erroresForm, setErroresForm] = useState({})
    const [mostrarTerminos, setMostrarTerminos] = useState(false)
    const [aceptaTerminos, setAceptaTerminos] = useState(false)

    const [formData, setFormData] = useState({
        empresa_id: '',
        nombre: '',
        cedula: '',
        email: '',
        password: '',
        tipo: 'vendedor',
        system_mode: 'POS'
    })

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
        cargarEmpresas()
    }, [])

    useEffect(() => {
        if (empresaSeleccionada) {
            cargarUsuarios()
        }
    }, [empresaSeleccionada])

    useEffect(() => {
        const manejarClickFuera = (e) => {
            if (!e.target.closest(`.${estilos.busquedaEmpresaContainer}`)) {
                setMostrarDropdownEmpresas(false)
            }
        }

        document.addEventListener('click', manejarClickFuera)
        return () => document.removeEventListener('click', manejarClickFuera)
    }, [])

    const cargarEmpresas = async () => {
        try {
            const resultado = await obtenerEmpresas()
            if (resultado.success) {
                setEmpresas(resultado.empresas)
            }
        } catch (error) {
            console.error('Error al cargar empresas:', error)
        } finally {
            setCargando(false)
        }
    }

    const cargarUsuarios = async () => {
        if (!empresaSeleccionada) return

        setCargando(true)
        try {
            const resultado = await obtenerUsuarios(empresaSeleccionada)
            if (resultado.success) {
                setUsuarios(resultado.usuarios)
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error)
        } finally {
            setCargando(false)
        }
    }

    const validarFormulario = () => {
        const errores = {}

        if (!formData.empresa_id) {
            errores.empresa_id = 'Debes seleccionar una empresa'
        }

        if (!formData.nombre.trim()) {
            errores.nombre = 'El nombre es requerido'
        }

        if (!formData.cedula.trim()) {
            errores.cedula = 'La cedula es requerida'
        } else if (formData.cedula.length < 11) {
            errores.cedula = 'La cedula debe tener al menos 11 caracteres'
        }

        if (!formData.email.trim()) {
            errores.email = 'El email es requerido'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errores.email = 'Email invalido'
        }

        if (!modoEdicion && !formData.password.trim()) {
            errores.password = 'La contrasena es requerida'
        } else if (!modoEdicion && formData.password.length < 6) {
            errores.password = 'La contrasena debe tener al menos 6 caracteres'
        }

        if (!modoEdicion && !aceptaTerminos) {
            errores.terminos = 'Debes aceptar los términos y condiciones'
        }

        setErroresForm(errores)
        return Object.keys(errores).length === 0
    }

    const abrirModalCrear = () => {
        setModoEdicion(false)
        setUsuarioEditar(null)
        setFormData({
            empresa_id: empresaSeleccionada || '',
            nombre: '',
            cedula: '',
            email: '',
            password: '',
            tipo: 'vendedor',
            system_mode: 'POS'
        })
        setErroresForm({})
        setAceptaTerminos(false)
        setMostrarModal(true)
    }

    const abrirModalEditar = (usuario) => {
        setModoEdicion(true)
        setUsuarioEditar(usuario)
        setFormData({
            empresa_id: usuario.empresa_id,
            nombre: usuario.nombre,
            cedula: usuario.cedula,
            email: usuario.email,
            password: '',
            tipo: usuario.tipo,
            system_mode: usuario.system_mode || 'POS'
        })
        setErroresForm({})
        setMostrarModal(true)
    }

    const cerrarModal = () => {
        setMostrarModal(false)
        setModoEdicion(false)
        setUsuarioEditar(null)
        setErroresForm({})
        setAceptaTerminos(false)
        setMostrarTerminos(false)
    }

    const manejarCambioInput = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        if (erroresForm[name]) {
            setErroresForm(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) {
            return
        }

        setProcesando(true)
        try {
            let resultado
            if (modoEdicion) {
                resultado = await actualizarUsuario(usuarioEditar.id, formData)
            } else {
                resultado = await crearUsuario(formData)
            }

            if (resultado.success) {
                await cargarUsuarios()
                cerrarModal()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al procesar la solicitud')
            }
        } catch (error) {
            console.error('Error al guardar usuario:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarToggleEstado = async (usuarioId, estadoActual) => {
        if (!confirm(`Estas seguro de ${estadoActual ? 'desactivar' : 'activar'} este usuario?`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await toggleEstadoUsuario(usuarioId, !estadoActual)
            if (resultado.success) {
                await cargarUsuarios()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al cambiar estado')
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarEliminar = async (usuarioId, nombreUsuario) => {
        // Paso 1: Obtener conteo de registros asociados
        setProcesando(true)
        try {
            const resultadoConteo = await obtenerConteoRegistrosUsuario(usuarioId)
            if (!resultadoConteo.success) {
                alert(resultadoConteo.mensaje || 'Error al obtener información del usuario')
                setProcesando(false)
                return
            }

            const { ventas, cajas, gastos, compras, movimientos, despachos } = resultadoConteo.conteo
            const totalRegistros = ventas + cajas + gastos + compras + movimientos + despachos

            // Construir mensaje de advertencia
            let mensajeAdvertencia = `⚠️ ELIMINACIÓN DEFINITIVA\n\n`
            mensajeAdvertencia += `Esta acción eliminará PERMANENTEMENTE:\n\n`
            mensajeAdvertencia += `• El usuario: ${nombreUsuario}\n`

            if (totalRegistros > 0) {
                if (ventas > 0) mensajeAdvertencia += `• ${ventas} venta(s)\n`
                if (cajas > 0) mensajeAdvertencia += `• ${cajas} caja(s)\n`
                if (gastos > 0) mensajeAdvertencia += `• ${gastos} gasto(s)\n`
                if (compras > 0) mensajeAdvertencia += `• ${compras} compra(s)\n`
                if (movimientos > 0) mensajeAdvertencia += `• ${movimientos} movimiento(s) de inventario\n`
                if (despachos > 0) mensajeAdvertencia += `• ${despachos} despacho(s)\n`
                mensajeAdvertencia += `\n`
            } else {
                mensajeAdvertencia += `• No tiene registros asociados\n\n`
            }

            mensajeAdvertencia += `❗ NO existe recuperación\n\n`
            mensajeAdvertencia += `Escribe "ELIMINAR DEFINITIVAMENTE" para continuar:`

            // Paso 2: Confirmación explícita con texto requerido
            const confirmacion = prompt(mensajeAdvertencia)

            if (confirmacion !== 'ELIMINAR DEFINITIVAMENTE') {
                if (confirmacion !== null) {
                    alert('Eliminación cancelada. Debes escribir exactamente "ELIMINAR DEFINITIVAMENTE" para continuar.')
                }
                setProcesando(false)
                return
            }

            // Paso 3: Ejecutar eliminación total
            const resultado = await eliminarUsuario(usuarioId)
            if (resultado.success) {
                await cargarUsuarios()
                alert(resultado.mensaje)
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

        const cumpleEstado = filtroEstado === 'todos' ||
            (filtroEstado === 'activos' && usuario.activo) ||
            (filtroEstado === 'inactivos' && !usuario.activo)

        const cumpleTipo = filtroTipo === 'todos' || usuario.tipo === filtroTipo

        return cumpleBusqueda && cumpleEstado && cumpleTipo
    })

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getTipoBadge = (tipo) => {
        const tipos = {
            superadmin: { texto: 'Super Admin', color: 'superadmin' },
            admin: { texto: 'Administrador', color: 'admin' },
            vendedor: { texto: 'Vendedor', color: 'vendedor' }
        }
        return tipos[tipo] || tipos.vendedor
    }

    const empresasFiltradas = empresas.filter(empresa => {
        if (!busquedaEmpresa) return true
        return empresa.nombre_empresa.toLowerCase().includes(busquedaEmpresa.toLowerCase())
    })

    const seleccionarEmpresa = (empresaId, empresaNombre) => {
        setEmpresaSeleccionada(empresaId)
        setEmpresaBuscada(empresaNombre)
        setBusquedaEmpresa(empresaNombre)
        setMostrarDropdownEmpresas(false)
    }

    const manejarCambioBusquedaEmpresa = (e) => {
        const valor = e.target.value
        setBusquedaEmpresa(valor)
        if (valor.length > 0) {
            setMostrarDropdownEmpresas(true)
        } else {
            setMostrarDropdownEmpresas(false)
            setEmpresaSeleccionada('')
            setEmpresaBuscada('')
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Usuarios</h1>
                    <p className={estilos.subtitulo}>Gestiona los usuarios de cada empresa</p>
                </div>
                {empresaSeleccionada && (
                    <button
                        className={estilos.btnNuevo}
                        onClick={abrirModalCrear}
                    >
                        <ion-icon name="person-add-outline"></ion-icon>
                        <span>Nuevo Usuario</span>
                    </button>
                )}
            </div>

            <div className={estilos.selectorEmpresa}>
                <div className={estilos.selectorGrupo}>
                    <div className={estilos.busquedaEmpresaContainer}>
                        <div className={estilos.busquedaEmpresa}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input
                                type="text"
                                placeholder="Buscar empresa..."
                                value={busquedaEmpresa}
                                onChange={manejarCambioBusquedaEmpresa}
                                className={estilos.inputBusquedaEmpresa}
                            />
                            {empresaSeleccionada && (
                                <button
                                    className={estilos.btnLimpiar}
                                    onClick={() => {
                                        setEmpresaSeleccionada('')
                                        setEmpresaBuscada('')
                                        setBusquedaEmpresa('')
                                    }}
                                    type="button"
                                >
                                    <ion-icon name="close-circle"></ion-icon>
                                </button>
                            )}
                        </div>

                        {mostrarDropdownEmpresas && (
                            <div className={`${estilos.dropdownEmpresas} ${estilos[tema]}`}>
                                {empresasFiltradas.filter(e => e.activo).length > 0 ? (
                                    empresasFiltradas.filter(e => e.activo).map(empresa => (
                                        <div
                                            key={empresa.id}
                                            className={`${estilos.dropdownItem} ${empresaSeleccionada === empresa.id ? estilos.seleccionado : ''}`}
                                            onClick={() => seleccionarEmpresa(empresa.id, empresa.nombre_empresa)}
                                        >
                                            <ion-icon name="business-outline"></ion-icon>
                                            <span>{empresa.nombre_empresa}</span>
                                            {empresaSeleccionada === empresa.id && (
                                                <ion-icon name="checkmark-circle" className={estilos.iconoCheck}></ion-icon>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className={estilos.dropdownVacio}>
                                        <ion-icon name="alert-circle-outline"></ion-icon>
                                        <span>No se encontraron empresas</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={estilos.separadorO}>
                        <span>O</span>
                    </div>

                    <div className={estilos.selectWrapper}>
                        <ion-icon name="business-outline"></ion-icon>
                        <select
                            value={empresaSeleccionada}
                            onChange={(e) => {
                                setEmpresaSeleccionada(e.target.value)
                                const empresaSelec = empresas.find(emp => emp.id === parseInt(e.target.value))
                                if (empresaSelec) {
                                    setEmpresaBuscada(empresaSelec.nombre_empresa)
                                    setBusquedaEmpresa(empresaSelec.nombre_empresa)
                                }
                            }}
                            className={estilos.selectEmpresa}
                        >
                            <option value="">Selecciona una empresa</option>
                            {empresas.filter(e => e.activo).map(empresa => (
                                <option key={empresa.id} value={empresa.id}>
                                    {empresa.nombre_empresa}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {!empresaSeleccionada ? (
                <div className={`${estilos.sinSeleccion} ${estilos[tema]}`}>
                    <ion-icon name="business-outline"></ion-icon>
                    <h3>Selecciona una empresa</h3>
                    <p>Para ver y gestionar usuarios, primero selecciona una empresa del menu superior</p>
                </div>
            ) : (
                <>
                    <div className={estilos.controles}>
                        <div className={estilos.busqueda}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input
                                type="text"
                                placeholder="Buscar por nombre, cedula o email..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className={estilos.inputBusqueda}
                            />
                        </div>

                        <div className={estilos.filtros}>
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className={estilos.selectFiltro}
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="activos">Activos</option>
                                <option value="inactivos">Inactivos</option>
                            </select>

                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className={estilos.selectFiltro}
                            >
                                <option value="todos">Todos los tipos</option>
                                <option value="admin">Administradores</option>
                                <option value="vendedor">Vendedores</option>
                            </select>
                        </div>
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
                        <div className={estilos.tabla}>
                            <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                                <div className={estilos.columna}>Usuario</div>
                                <div className={estilos.columna}>Cedula</div>
                                <div className={estilos.columna}>Email</div>
                                <div className={estilos.columna}>Tipo</div>
                                <div className={estilos.columna}>Modo</div>
                                <div className={estilos.columna}>Estado</div>
                                <div className={estilos.columna}>Registro</div>
                                <div className={estilos.columnaAcciones}>Acciones</div>
                            </div>

                            <div className={estilos.tablaBody}>
                                {usuariosFiltrados.map((usuario) => (
                                    <div key={usuario.id} className={`${estilos.fila} ${estilos[tema]}`}>
                                        <div className={estilos.columna}>
                                            <div className={estilos.usuarioInfo}>
                                                {usuario.avatar_url ? (
                                                    <img
                                                        src={usuario.avatar_url}
                                                        alt={usuario.nombre}
                                                        className={estilos.avatar}
                                                    />
                                                ) : (
                                                    <div className={estilos.avatarDefault}>
                                                        <ion-icon name="person-outline"></ion-icon>
                                                    </div>
                                                )}
                                                <span className={estilos.nombreUsuario}>{usuario.nombre}</span>
                                            </div>
                                        </div>
                                        <div className={estilos.columna}>
                                            <span className={estilos.cedula}>{usuario.cedula}</span>
                                        </div>
                                        <div className={estilos.columna}>
                                            <span className={estilos.email}>{usuario.email}</span>
                                        </div>
                                        <div className={estilos.columna}>
                                            <span className={`${estilos.badgeTipo} ${estilos[getTipoBadge(usuario.tipo).color]}`}>
                                                {getTipoBadge(usuario.tipo).texto}
                                            </span>
                                        </div>
                                        <div className={estilos.columna}>
                                            <span className={`${estilos.badgeModo} ${usuario.system_mode === 'OBRAS' ? estilos.modoObras : estilos.modoPos}`}>
                                                {usuario.system_mode || 'POS'}
                                            </span>
                                        </div>
                                        <div className={estilos.columna}>
                                            <span className={`${estilos.badgeEstado} ${usuario.activo ? estilos.activo : estilos.inactivo}`}>
                                                {usuario.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <div className={estilos.columna}>
                                            <span className={estilos.fecha}>{formatearFecha(usuario.fecha_creacion)}</span>
                                        </div>
                                        <div className={estilos.columnaAcciones}>
                                            <button
                                                className={estilos.btnIcono}
                                                onClick={() => abrirModalEditar(usuario)}
                                                disabled={procesando}
                                                title="Editar"
                                            >
                                                <ion-icon name="create-outline"></ion-icon>
                                            </button>
                                            <button
                                                className={`${estilos.btnIcono} ${usuario.activo ? estilos.desactivar : estilos.activar}`}
                                                onClick={() => manejarToggleEstado(usuario.id, usuario.activo)}
                                                disabled={procesando}
                                                title={usuario.activo ? 'Desactivar' : 'Activar'}
                                            >
                                                <ion-icon name={usuario.activo ? 'close-circle-outline' : 'checkmark-circle-outline'}></ion-icon>
                                            </button>
                                            <button
                                                className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                                onClick={() => manejarEliminar(usuario.id, usuario.nombre)}
                                                disabled={procesando}
                                                title="Eliminar"
                                            >
                                                <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {mostrarModal && (
                <div className={estilos.modalOverlay} onClick={cerrarModal}>
                    <div className={`${estilos.modal} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>{modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <button className={estilos.btnCerrar} onClick={cerrarModal}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <form onSubmit={manejarSubmit} className={estilos.modalBody}>
                            <div className={estilos.grupoInput}>
                                <label>Empresa *</label>
                                <select
                                    name="empresa_id"
                                    value={formData.empresa_id}
                                    onChange={manejarCambioInput}
                                    className={erroresForm.empresa_id ? estilos.inputError : ''}
                                    disabled={modoEdicion}
                                >
                                    <option value="">Selecciona una empresa</option>
                                    {empresas.filter(e => e.activo).map(empresa => (
                                        <option key={empresa.id} value={empresa.id}>
                                            {empresa.nombre_empresa}
                                        </option>
                                    ))}
                                </select>
                                {erroresForm.empresa_id && (
                                    <span className={estilos.mensajeError}>{erroresForm.empresa_id}</span>
                                )}
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Nombre Completo *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={manejarCambioInput}
                                    className={erroresForm.nombre ? estilos.inputError : ''}
                                    placeholder="Ej: Juan Perez"
                                />
                                {erroresForm.nombre && (
                                    <span className={estilos.mensajeError}>{erroresForm.nombre}</span>
                                )}
                            </div>

                            <div className={estilos.filaForm}>
                                <div className={estilos.grupoInput}>
                                    <label>Cedula *</label>
                                    <input
                                        type="text"
                                        name="cedula"
                                        value={formData.cedula}
                                        onChange={manejarCambioInput}
                                        maxLength="20"
                                        className={erroresForm.cedula ? estilos.inputError : ''}
                                        placeholder="00000000000"
                                    />
                                    {erroresForm.cedula && (
                                        <span className={estilos.mensajeError}>{erroresForm.cedula}</span>
                                    )}
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Tipo de Usuario *</label>
                                    <select
                                        name="tipo"
                                        value={formData.tipo}
                                        onChange={manejarCambioInput}
                                    >
                                        <option value="vendedor">Vendedor</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Modo de Sistema (Vista Principal) *</label>
                                <div className={estilos.selectorModo}>
                                    <label className={`${estilos.opcionModo} ${formData.system_mode === 'POS' ? estilos.activo : ''}`}>
                                        <input
                                            type="radio"
                                            name="system_mode"
                                            value="POS"
                                            checked={formData.system_mode === 'POS'}
                                            onChange={manejarCambioInput}
                                        />
                                        <ion-icon name="cart-outline"></ion-icon>
                                        <span>POS (Ventas)</span>
                                    </label>
                                    <label className={`${estilos.opcionModo} ${formData.system_mode === 'OBRAS' ? estilos.activo : ''}`}>
                                        <input
                                            type="radio"
                                            name="system_mode"
                                            value="OBRAS"
                                            checked={formData.system_mode === 'OBRAS'}
                                            onChange={manejarCambioInput}
                                        />
                                        <ion-icon name="construct-outline"></ion-icon>
                                        <span>OBRAS (Construcción)</span>
                                    </label>
                                </div>
                                <p className={estilos.ayudaInput}>El usuario verá este módulo al iniciar sesión.</p>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={manejarCambioInput}
                                    className={erroresForm.email ? estilos.inputError : ''}
                                    placeholder="correo@ejemplo.com"
                                />
                                {erroresForm.email && (
                                    <span className={estilos.mensajeError}>{erroresForm.email}</span>
                                )}
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{modoEdicion ? 'Nueva Contrasena (dejar vacio para mantener)' : 'Contrasena *'}</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={manejarCambioInput}
                                    className={erroresForm.password ? estilos.inputError : ''}
                                    placeholder={modoEdicion ? 'Opcional' : 'Minimo 6 caracteres'}
                                />
                                {erroresForm.password && (
                                    <span className={estilos.mensajeError}>{erroresForm.password}</span>
                                )}
                            </div>

                            <div className={estilos.modalFooter}>
                                <button
                                    type="button"
                                    className={estilos.btnCancelar}
                                    onClick={cerrarModal}
                                    disabled={procesando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={estilos.btnGuardar}
                                    disabled={procesando}
                                >
                                    {procesando ? 'Procesando...' : modoEdicion ? 'Actualizar' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}