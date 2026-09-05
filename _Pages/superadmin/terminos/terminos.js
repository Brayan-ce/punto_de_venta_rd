"use client"
import { useState, useEffect } from 'react'
import estilos from './terminos.module.css'
import {
    obtenerHistorialTerminos,
    obtenerTerminoPorId,
    crearTerminos,
    editarTerminos,
    activarTerminos,
    obtenerAceptacionesTermino
} from './servidor'

export default function TerminosAdmin() {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [terminos, setTerminos] = useState([])
    const [vistaActiva, setVistaActiva] = useState('lista') // 'lista', 'crear', 'editar', 'aceptaciones'
    const [terminoSeleccionado, setTerminoSeleccionado] = useState(null)
    const [aceptaciones, setAceptaciones] = useState([])

    const [formData, setFormData] = useState({
        version: '',
        titulo: '',
        contenido: ''
    })

    const [errores, setErrores] = useState({})
    const [procesando, setProcesando] = useState(false)

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
        cargarTerminos()
    }, [])

    const cargarTerminos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerHistorialTerminos()
            if (resultado.success) {
                setTerminos(resultado.data)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setCargando(false)
        }
    }

    const manejarCambio = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        if (errores[name]) {
            setErrores(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const validarFormulario = () => {
        const nuevosErrores = {}

        if (!formData.version.trim()) {
            nuevosErrores.version = 'La versión es requerida'
        }

        if (!formData.titulo.trim()) {
            nuevosErrores.titulo = 'El título es requerido'
        }

        if (!formData.contenido.trim()) {
            nuevosErrores.contenido = 'El contenido es requerido'
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const manejarCrear = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) return

        setProcesando(true)
        try {
            const resultado = await crearTerminos(formData)

            if (resultado.success) {
                alert(resultado.mensaje)
                setFormData({ version: '', titulo: '', contenido: '' })
                setVistaActiva('lista')
                await cargarTerminos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al crear términos')
        } finally {
            setProcesando(false)
        }
    }

    const manejarEditar = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) return

        setProcesando(true)
        try {
            const resultado = await editarTerminos(terminoSeleccionado.id, {
                titulo: formData.titulo,
                contenido: formData.contenido
            })

            if (resultado.success) {
                alert(resultado.mensaje)
                setVistaActiva('lista')
                await cargarTerminos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al editar términos')
        } finally {
            setProcesando(false)
        }
    }

    const iniciarEdicion = async (termino) => {
        if (termino.activo) {
            alert('No se puede editar un término activo')
            return
        }

        setCargando(true)
        try {
            const resultado = await obtenerTerminoPorId(termino.id)
            if (resultado.success) {
                setTerminoSeleccionado(resultado.data)
                setFormData({
                    version: resultado.data.version,
                    titulo: resultado.data.titulo,
                    contenido: resultado.data.contenido
                })
                setVistaActiva('editar')
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setCargando(false)
        }
    }

    const manejarActivar = async (termino) => {
        const confirmar = window.confirm(
            `¿Activar la versión ${termino.version}?\n\nEsto desactivará todas las demás versiones y requerirá que todos los usuarios acepten los nuevos términos.`
        )

        if (!confirmar) return

        setProcesando(true)
        try {
            const resultado = await activarTerminos(termino.id)

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarTerminos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al activar términos')
        } finally {
            setProcesando(false)
        }
    }

    const verAceptaciones = async (termino) => {
        setCargando(true)
        try {
            const resultado = await obtenerAceptacionesTermino(termino.id)
            if (resultado.success) {
                setAceptaciones(resultado.data)
                setTerminoSeleccionado(termino)
                setVistaActiva('aceptaciones')
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setCargando(false)
        }
    }

    if (cargando && terminos.length === 0) {
        return (
            <div className={`${estilos.cargando} ${estilos[tema]}`}>
                <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                <span>Cargando términos...</span>
            </div>
        )
    }

    // VISTA: Lista de términos
    if (vistaActiva === 'lista') {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.seccionHeader}>
                    <div>
                        <h2 className={estilos.seccionTitulo}>Gestión de Términos y Condiciones</h2>
                        <p className={estilos.seccionSubtitulo}>
                            Administra las versiones de términos y condiciones del sistema
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ version: '', titulo: '', contenido: '' })
                            setVistaActiva('crear')
                        }}
                        className={estilos.btnPrimario}
                    >
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nueva Versión</span>
                    </button>
                </div>

                <div className={estilos.tablaContenedor}>
                    <table className={estilos.tabla}>
                        <thead>
                            <tr>
                                <th>Versión</th>
                                <th>Título</th>
                                <th>Estado</th>
                                <th>Aceptaciones</th>
                                <th>Creado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {terminos.map(termino => (
                                <tr key={termino.id}>
                                    <td>
                                        <span className={estilos.version}>v{termino.version}</span>
                                    </td>
                                    <td>{termino.titulo}</td>
                                    <td>
                                        {termino.activo ? (
                                            <span className={estilos.badgeActivo}>
                                                <ion-icon name="checkmark-circle"></ion-icon>
                                                Activo
                                            </span>
                                        ) : (
                                            <span className={estilos.badgeInactivo}>
                                                Inactivo
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => verAceptaciones(termino)}
                                            className={estilos.linkAceptaciones}
                                        >
                                            {termino.total_aceptaciones} usuario(s)
                                        </button>
                                    </td>
                                    <td>
                                        {new Date(termino.creado_en).toLocaleDateString('es-DO', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td>
                                        <div className={estilos.acciones}>
                                            {!termino.activo && (
                                                <>
                                                    <button
                                                        onClick={() => iniciarEdicion(termino)}
                                                        className={estilos.btnIcono}
                                                        title="Editar"
                                                    >
                                                        <ion-icon name="create-outline"></ion-icon>
                                                    </button>
                                                    <button
                                                        onClick={() => manejarActivar(termino)}
                                                        className={estilos.btnActivar}
                                                        title="Activar versión"
                                                    >
                                                        <ion-icon name="power-outline"></ion-icon>
                                                    </button>
                                                </>
                                            )}
                                            {termino.activo && (
                                                <span className={estilos.textoActivo}>
                                                    <ion-icon name="shield-checkmark"></ion-icon>
                                                    Versión vigente
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {terminos.length === 0 && (
                        <div className={estilos.vacio}>
                            <ion-icon name="document-outline"></ion-icon>
                            <p>No hay términos creados</p>
                            <button
                                onClick={() => setVistaActiva('crear')}
                                className={estilos.btnSecundario}
                            >
                                Crear primera versión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // VISTA: Crear/Editar términos
    if (vistaActiva === 'crear' || vistaActiva === 'editar') {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.seccionHeader}>
                    <div>
                        <h2 className={estilos.seccionTitulo}>
                            {vistaActiva === 'crear' ? 'Crear Nueva Versión' : 'Editar Términos'}
                        </h2>
                        <p className={estilos.seccionSubtitulo}>
                            {vistaActiva === 'crear'
                                ? 'Los términos se crearán como inactivos. Debes activarlos manualmente.'
                                : `Editando versión ${formData.version}`
                            }
                        </p>
                    </div>
                    <button
                        onClick={() => setVistaActiva('lista')}
                        className={estilos.btnSecundario}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
                    </button>
                </div>

                <form onSubmit={vistaActiva === 'crear' ? manejarCrear : manejarEditar} className={estilos.formulario}>
                    <div className={estilos.filaForm}>
                        <div className={estilos.grupoInput}>
                            <label>Versión *</label>
                            <input
                                type="text"
                                name="version"
                                value={formData.version}
                                onChange={manejarCambio}
                                placeholder="1.0, 1.1, 2.0, etc."
                                disabled={vistaActiva === 'editar'}
                                className={errores.version ? estilos.inputError : ''}
                            />
                            {errores.version && (
                                <span className={estilos.mensajeError}>{errores.version}</span>
                            )}
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Título *</label>
                            <input
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={manejarCambio}
                                placeholder="Términos y Condiciones de Uso"
                                className={errores.titulo ? estilos.inputError : ''}
                            />
                            {errores.titulo && (
                                <span className={estilos.mensajeError}>{errores.titulo}</span>
                            )}
                        </div>
                    </div>

                    <div className={estilos.grupoInput}>
                        <label>
                            Contenido (Markdown) *
                            <span className={estilos.textoAyuda}>
                                Puedes usar Markdown para formato: **negrita**, *cursiva*, # Títulos, - Listas
                            </span>
                        </label>
                        <textarea
                            name="contenido"
                            value={formData.contenido}
                            onChange={manejarCambio}
                            rows="20"
                            placeholder="# Título Principal&#10;&#10;## Sección 1&#10;&#10;Contenido de la sección..."
                            className={errores.contenido ? estilos.inputError : ''}
                        />
                        {errores.contenido && (
                            <span className={estilos.mensajeError}>{errores.contenido}</span>
                        )}
                    </div>

                    <div className={estilos.formularioFooter}>
                        <button
                            type="button"
                            onClick={() => setVistaActiva('lista')}
                            className={estilos.btnCancelar}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={estilos.btnGuardar}
                            disabled={procesando}
                        >
                            {procesando ? (
                                <>
                                    <ion-icon name="hourglass-outline"></ion-icon>
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <span>{vistaActiva === 'crear' ? 'Crear Versión' : 'Guardar Cambios'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    // VISTA: Aceptaciones
    if (vistaActiva === 'aceptaciones') {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.seccionHeader}>
                    <div>
                        <h2 className={estilos.seccionTitulo}>
                            Aceptaciones - Versión {terminoSeleccionado?.version}
                        </h2>
                        <p className={estilos.seccionSubtitulo}>
                            Registro de usuarios que aceptaron esta versión
                        </p>
                    </div>
                    <button
                        onClick={() => setVistaActiva('lista')}
                        className={estilos.btnSecundario}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
                    </button>
                </div>

                <div className={estilos.tablaContenedor}>
                    <table className={estilos.tabla}>
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Empresa</th>
                                <th>Fecha de Aceptación</th>
                                <th>IP</th>
                                <th>User-Agent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aceptaciones.map(aceptacion => (
                                <tr key={aceptacion.id}>
                                    <td>
                                        <div>
                                            <strong>{aceptacion.usuario_nombre}</strong>
                                            <br />
                                            <small>{aceptacion.usuario_email}</small>
                                        </div>
                                    </td>
                                    <td>{aceptacion.nombre_empresa || 'N/A'}</td>
                                    <td>
                                        {new Date(aceptacion.aceptado_en).toLocaleString('es-DO', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td><code>{aceptacion.ip_address}</code></td>
                                    <td className={estilos.userAgent}>{aceptacion.user_agent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {aceptaciones.length === 0 && (
                        <div className={estilos.vacio}>
                            <ion-icon name="people-outline"></ion-icon>
                            <p>Nadie ha aceptado esta versión aún</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return null
}
