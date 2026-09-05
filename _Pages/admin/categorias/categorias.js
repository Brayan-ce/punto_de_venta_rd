"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerCategorias, obtenerCategoria, crearCategoria, actualizarCategoria, eliminarCategoria } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './categorias.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function CategoriasAdmin() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
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
                        <h1 className={estilos.titulo}>{modoEdicion ? tr('Editar Categoría', 'Edit Category') : tr('Nueva Categoría', 'New Category')}</h1>
                        <p className={estilos.subtitulo}>{modoEdicion ? tr('Modifica los datos de la categoría', 'Modify category data') : tr('Registra una nueva categoría', 'Register a new category')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={volverListado}
                        className={estilos.btnVolver}
                        disabled={procesando}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>{tr('Volver', 'Back')}</span>
                    </button>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.formulario}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Información de la Categoría', 'Category Information')}</h2>
                        
                        <div className={estilos.grupoInput}>
                            <label>{tr('Nombre *', 'Name *')}</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder={tr('Ej: Lácteos, Bebidas, Limpieza...', 'Ex: Dairy, Beverages, Cleaning...')}
                                required
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>{tr('Descripción', 'Description')}</label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={manejarCambio}
                                className={estilos.textarea}
                                placeholder={tr('Describe brevemente esta categoría...', 'Briefly describe this category...')}
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
                            <label htmlFor="activo">{tr('Categoría activa', 'Active category')}</label>
                        </div>
                    </div>

                    <div className={estilos.botonesFormulario}>
                        <button
                            type="button"
                            onClick={volverListado}
                            className={estilos.btnCancelar}
                            disabled={procesando}
                        >
                            {tr('Cancelar', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            className={estilos.btnGuardar}
                            disabled={procesando}
                        >
                            {procesando ? tr('Guardando...', 'Saving...') : modoEdicion ? tr('Actualizar Categoría', 'Update Category') : tr('Crear Categoría', 'Create Category')}
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
                        <h1 className={estilos.titulo}>{tr('Detalles de la Categoría', 'Category Details')}</h1>
                        <p className={estilos.subtitulo}>{tr('Información completa', 'Complete information')}</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button
                            type="button"
                            onClick={() => abrirFormularioEditar(categoriaSeleccionada)}
                            className={estilos.btnEditar}
                            disabled={procesando}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            <span>{tr('Editar', 'Edit')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => manejarEliminar(categoriaSeleccionada.id, categoriaSeleccionada.nombre)}
                            className={estilos.btnEliminar}
                            disabled={procesando}
                        >
                            <ion-icon name="trash-outline"></ion-icon>
                            <span>{tr('Eliminar', 'Delete')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={volverListado}
                            className={estilos.btnVolver}
                            disabled={procesando}
                        >
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            <span>{tr('Volver', 'Back')}</span>
                        </button>
                    </div>
                </div>

                <div className={estilos.detallesGrid}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <div className={estilos.panelHeader}>
                            <h2 className={estilos.panelTitulo}>{tr('Información General', 'General Information')}</h2>
                            <span className={`${estilos.badge} ${categoriaSeleccionada.activo ? estilos.activo : estilos.inactivo}`}>
                                {categoriaSeleccionada.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                            </span>
                        </div>

                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Nombre', 'Name')}</span>
                                <span className={estilos.infoValor}>{categoriaSeleccionada.nombre}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Fecha de Creación', 'Creation Date')}</span>
                                <span className={estilos.infoValor}>{formatearFecha(categoriaSeleccionada.fecha_creacion)}</span>
                            </div>
                            {categoriaSeleccionada.descripcion && (
                                <div className={`${estilos.infoItem} ${estilos.full}`}>
                                    <span className={estilos.infoLabel}>{tr('Descripción', 'Description')}</span>
                                    <span className={estilos.infoValor}>{categoriaSeleccionada.descripcion}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Estadísticas', 'Statistics')}</h2>
                        <div className={estilos.estadisticasCategoria}>
                            <div className={estilos.estadCatCard}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <div>
                                    <span className={estilos.estadCatLabel}>{tr('Total Productos', 'Total Products')}</span>
                                    <span className={estilos.estadCatValor}>{categoriaSeleccionada.total_productos || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {categoriaSeleccionada.productos && categoriaSeleccionada.productos.length > 0 && (
                        <div className={`${estilos.panel} ${estilos[tema]} ${estilos.panelFull}`}>
                            <h2 className={estilos.panelTitulo}>{tr('Productos en esta Categoría', 'Products in this Category')}</h2>
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
                                            <span className={estilos.productoStock}>{tr('Stock', 'Stock')}: {producto.stock}</span>
                                            <span className={`${estilos.productoEstado} ${producto.activo ? estilos.activo : estilos.inactivo}`}>
                                                {producto.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
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
                    <h1 className={estilos.titulo}>{tr('Categorías', 'Categories')}</h1>
                    <p className={estilos.subtitulo}>{tr('Gestiona las categorías de productos', 'Manage product categories')}</p>
                </div>
                <button
                    onClick={abrirFormularioNuevo}
                    className={estilos.btnNuevo}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>{tr('Nueva Categoría', 'New Category')}</span>
                </button>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="apps-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Total Categorías', 'Total Categories')}</span>
                        <span className={estilos.estadValor}>{estadisticas.total}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Activas', 'Active')}</span>
                        <span className={estilos.estadValor}>{estadisticas.activos}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Inactivas', 'Inactive')}</span>
                        <span className={estilos.estadValor}>{estadisticas.inactivos}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Total Productos', 'Total Products')}</span>
                        <span className={estilos.estadValor}>{estadisticas.totalProductos}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar categoría...', 'Search category...')}
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
                    <option value="todos">{tr('Todos los estados', 'All statuses')}</option>
                    <option value="activos">{tr('Activos', 'Active')}</option>
                    <option value="inactivos">{tr('Inactivos', 'Inactive')}</option>
                </select>
            </div>

            {cargando ? (
                <LoadingScreen />
            ) : categoriasFiltradas.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="apps-outline"></ion-icon>
                    <span>{tr('No hay categorías que coincidan con tu búsqueda', 'No categories match your search')}</span>
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
                                        {categoria.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
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
                                        <span>{categoria.total_productos || 0} {tr('productos', 'products')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.cardFooter}>
                                <button
                                    onClick={() => abrirDetalles(categoria.id)}
                                    className={estilos.btnIcono}
                                    title={tr('Ver detalles', 'View details')}
                                >
                                    <ion-icon name="eye-outline"></ion-icon>
                                </button>
                                <button
                                    onClick={() => abrirFormularioEditar(categoria)}
                                    className={estilos.btnIcono}
                                    title={tr('Editar', 'Edit')}
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                </button>
                                <button
                                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                    onClick={() => manejarEliminar(categoria.id, categoria.nombre)}
                                    disabled={procesando}
                                    title={tr('Eliminar', 'Delete')}
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