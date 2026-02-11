"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerCategorias, obtenerCategoria, crearCategoria, actualizarCategoria, eliminarCategoria } from './servidor'
import estilos from './categorias.module.css'

export default function CategoriasAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [categorias, setCategorias] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    
    const [vistaActual, setVistaActual] = useState('listado')
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
    const [modoEdicion, setModoEdicion] = useState(false)

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        activo: true
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
        cargarCategorias()
    }, [])

    const cargarCategorias = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerCategorias()
            if (resultado.success) {
                setCategorias(resultado.categorias)
            } else {
                alert(resultado.mensaje || 'Error al cargar categorias')
            }
        } catch (error) {
            console.error('Error al cargar categorias:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const limpiarFormulario = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            activo: true
        })
        setModoEdicion(false)
        setCategoriaSeleccionada(null)
    }

    const abrirFormularioNuevo = () => {
        limpiarFormulario()
        setVistaActual('formulario')
    }

    const abrirFormularioEditar = (categoria) => {
        setFormData({
            nombre: categoria.nombre,
            descripcion: categoria.descripcion || '',
            activo: categoria.activo
        })
        setCategoriaSeleccionada(categoria)
        setModoEdicion(true)
        setVistaActual('formulario')
    }

    const abrirDetalles = async (id) => {
        setProcesando(true)
        try {
            const resultado = await obtenerCategoria(id)
            if (resultado.success) {
                setCategoriaSeleccionada(resultado.categoria)
                setVistaActual('detalles')
            } else {
                alert(resultado.mensaje || 'Error al cargar categoria')
            }
        } catch (error) {
            console.error('Error al cargar categoria:', error)
            alert('Error al cargar datos')
        } finally {
            setProcesando(false)
        }
    }

    const volverListado = () => {
        setVistaActual('listado')
        limpiarFormulario()
        setCategoriaSeleccionada(null)
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

        if (formData.nombre.trim().length < 3) {
            alert('El nombre debe tener al menos 3 caracteres')
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
                resultado = await actualizarCategoria(categoriaSeleccionada.id, formData)
            } else {
                resultado = await crearCategoria(formData)
            }

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarCategorias()
                volverListado()
            } else {
                alert(resultado.mensaje || 'Error al guardar categoria')
            }
        } catch (error) {
            console.error('Error al guardar categoria:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarEliminar = async (id, nombre) => {
        if (!confirm(`¿Estas seguro de eliminar la categoria "${nombre}"?`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarCategoria(id)
            if (resultado.success) {
                await cargarCategorias()
                alert(resultado.mensaje)
                if (vistaActual === 'detalles') {
                    volverListado()
                }
            } else {
                alert(resultado.mensaje || 'Error al eliminar categoria')
            }
        } catch (error) {
            console.error('Error al eliminar categoria:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const categoriasFiltradas = categorias.filter(categoria => {
        const cumpleBusqueda = busqueda === '' ||
            categoria.nombre.toLowerCase().includes(busqueda.toLowerCase())

        const cumpleEstado = filtroEstado === 'todos' || 
            (filtroEstado === 'activos' && categoria.activo) ||
            (filtroEstado === 'inactivos' && !categoria.activo)

        return cumpleBusqueda && cumpleEstado
    })

    const calcularEstadisticas = () => {
        const total = categorias.length
        const activos = categorias.filter(c => c.activo).length
        const inactivos = categorias.filter(c => !c.activo).length
        const totalProductos = categorias.reduce((sum, c) => sum + (c.total_productos || 0), 0)

        return { total, activos, inactivos, totalProductos }
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const estadisticas = calcularEstadisticas()

    if (vistaActual === 'formulario') {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>{modoEdicion ? 'Editar Categoria' : 'Nueva Categoria'}</h1>
                        <p className={estilos.subtitulo}>{modoEdicion ? 'Modifica los datos de la categoria' : 'Registra una nueva categoria'}</p>
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

                <form onSubmit={manejarSubmit} className={estilos.formulario}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Informacion de la Categoria</h2>
                        
                        <div className={estilos.grupoInput}>
                            <label>Nombre *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder="Ej: Lacteos, Bebidas, Limpieza..."
                                required
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Descripcion</label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={manejarCambio}
                                className={estilos.textarea}
                                placeholder="Describe brevemente esta categoria..."
                                rows="4"
                                disabled={procesando}
                            />
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
                            <label htmlFor="activo">Categoria activa</label>
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
                            type="submit"
                            className={estilos.btnGuardar}
                            disabled={procesando}
                        >
                            {procesando ? 'Guardando...' : modoEdicion ? 'Actualizar Categoria' : 'Crear Categoria'}
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    if (vistaActual === 'detalles' && categoriaSeleccionada) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>Detalles de la Categoria</h1>
                        <p className={estilos.subtitulo}>Informacion completa</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button
                            type="button"
                            onClick={() => abrirFormularioEditar(categoriaSeleccionada)}
                            className={estilos.btnEditar}
                            disabled={procesando}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            <span>Editar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => manejarEliminar(categoriaSeleccionada.id, categoriaSeleccionada.nombre)}
                            className={estilos.btnEliminar}
                            disabled={procesando}
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
                            <h2 className={estilos.panelTitulo}>Informacion General</h2>
                            <span className={`${estilos.badge} ${categoriaSeleccionada.activo ? estilos.activo : estilos.inactivo}`}>
                                {categoriaSeleccionada.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>

                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Nombre</span>
                                <span className={estilos.infoValor}>{categoriaSeleccionada.nombre}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Fecha de Creacion</span>
                                <span className={estilos.infoValor}>{formatearFecha(categoriaSeleccionada.fecha_creacion)}</span>
                            </div>
                            {categoriaSeleccionada.descripcion && (
                                <div className={`${estilos.infoItem} ${estilos.full}`}>
                                    <span className={estilos.infoLabel}>Descripcion</span>
                                    <span className={estilos.infoValor}>{categoriaSeleccionada.descripcion}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Estadisticas</h2>
                        <div className={estilos.estadisticasCategoria}>
                            <div className={estilos.estadCatCard}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <div>
                                    <span className={estilos.estadCatLabel}>Total Productos</span>
                                    <span className={estilos.estadCatValor}>{categoriaSeleccionada.total_productos || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {categoriaSeleccionada.productos && categoriaSeleccionada.productos.length > 0 && (
                        <div className={`${estilos.panel} ${estilos[tema]} ${estilos.panelFull}`}>
                            <h2 className={estilos.panelTitulo}>Productos en esta Categoria</h2>
                            <div className={estilos.listaProductos}>
                                {categoriaSeleccionada.productos.map((producto) => (
                                    <div key={producto.id} className={`${estilos.productoItem} ${estilos[tema]}`}>
                                        <div className={estilos.productoInfo}>
                                            <span className={estilos.productoNombre}>{producto.nombre}</span>
                                            {producto.codigo_barras && (
                                                <span className={estilos.productoCodigo}>{producto.codigo_barras}</span>
                                            )}
                                        </div>
                                        <div className={estilos.productoDetalle}>
                                            <span className={estilos.productoStock}>Stock: {producto.stock}</span>
                                            <span className={`${estilos.productoEstado} ${producto.activo ? estilos.activo : estilos.inactivo}`}>
                                                {producto.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Categorias</h1>
                    <p className={estilos.subtitulo}>Gestiona las categorias de productos</p>
                </div>
                <button
                    onClick={abrirFormularioNuevo}
                    className={estilos.btnNuevo}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nueva Categoria</span>
                </button>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="apps-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Categorias</span>
                        <span className={estilos.estadValor}>{estadisticas.total}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Activas</span>
                        <span className={estilos.estadValor}>{estadisticas.activos}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Inactivas</span>
                        <span className={estilos.estadValor}>{estadisticas.inactivos}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Productos</span>
                        <span className={estilos.estadValor}>{estadisticas.totalProductos}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar categoria..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

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
                    <span>Cargando categorias...</span>
                </div>
            ) : categoriasFiltradas.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="apps-outline"></ion-icon>
                    <span>No hay categorias que coincidan con tu busqueda</span>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {categoriasFiltradas.map((categoria) => (
                        <div key={categoria.id} className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                <div className={estilos.cardIcono}>
                                    <ion-icon name="apps-outline"></ion-icon>
                                </div>
                                <div className={estilos.cardTitulo}>
                                    <h3>{categoria.nombre}</h3>
                                    <span className={`${estilos.badge} ${categoria.activo ? estilos.activo : estilos.inactivo}`}>
                                        {categoria.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.cardBody}>
                                {categoria.descripcion && (
                                    <p className={estilos.descripcion}>{categoria.descripcion}</p>
                                )}
                                <div className={estilos.cardEstadisticas}>
                                    <div className={estilos.cardEstad}>
                                        <ion-icon name="cube-outline"></ion-icon>
                                        <span>{categoria.total_productos || 0} productos</span>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.cardFooter}>
                                <button
                                    onClick={() => abrirDetalles(categoria.id)}
                                    className={estilos.btnIcono}
                                    title="Ver detalles"
                                >
                                    <ion-icon name="eye-outline"></ion-icon>
                                </button>
                                <button
                                    onClick={() => abrirFormularioEditar(categoria)}
                                    className={estilos.btnIcono}
                                    title="Editar"
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                </button>
                                <button
                                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                    onClick={() => manejarEliminar(categoria.id, categoria.nombre)}
                                    disabled={procesando}
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