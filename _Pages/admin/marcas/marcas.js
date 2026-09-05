"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerMarcas, obtenerMarca, crearMarca, actualizarMarca, eliminarMarca } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './marcas.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function MarcasAdmin() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [marcas, setMarcas] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    
    const [vistaActual, setVistaActual] = useState('listado')
    const [marcaSeleccionada, setMarcaSeleccionada] = useState(null)
    const [modoEdicion, setModoEdicion] = useState(false)

    const [formData, setFormData] = useState({
        nombre: '',
        pais_origen: '',
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
        cargarMarcas()
    }, [])

    const cargarMarcas = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerMarcas()
            if (resultado.success) {
                setMarcas(resultado.marcas)
            } else {
                alert(resultado.mensaje || tr('Error al cargar marcas', 'Error loading brands'))
            }
        } catch (error) {
            console.error('Error al cargar marcas:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const limpiarFormulario = () => {
        setFormData({
            nombre: '',
            pais_origen: '',
            descripcion: '',
            activo: true
        })
        setModoEdicion(false)
        setMarcaSeleccionada(null)
    }

    const abrirFormularioNuevo = () => {
        limpiarFormulario()
        setVistaActual('formulario')
    }

    const abrirFormularioEditar = (marca) => {
        setFormData({
            nombre: marca.nombre,
            pais_origen: marca.pais_origen || '',
            descripcion: marca.descripcion || '',
            activo: marca.activo
        })
        setMarcaSeleccionada(marca)
        setModoEdicion(true)
        setVistaActual('formulario')
    }

    const abrirDetalles = async (id) => {
        setProcesando(true)
        try {
            const resultado = await obtenerMarca(id)
            if (resultado.success) {
                setMarcaSeleccionada(resultado.marca)
                setVistaActual('detalles')
            } else {
                alert(resultado.mensaje || 'Error al cargar marca')
            }
        } catch (error) {
            console.error('Error al cargar marca:', error)
            alert('Error al cargar datos')
        } finally {
            setProcesando(false)
        }
    }

    const volverListado = () => {
        setVistaActual('listado')
        limpiarFormulario()
        setMarcaSeleccionada(null)
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

        if (formData.nombre.trim().length < 2) {
            alert('El nombre debe tener al menos 2 caracteres')
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
                resultado = await actualizarMarca(marcaSeleccionada.id, formData)
            } else {
                resultado = await crearMarca(formData)
            }

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarMarcas()
                volverListado()
            } else {
                alert(resultado.mensaje || 'Error al guardar marca')
            }
        } catch (error) {
            console.error('Error al guardar marca:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarEliminar = async (id, nombre) => {
        if (!confirm(`¿Estas seguro de eliminar la marca "${nombre}"?`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarMarca(id)
            if (resultado.success) {
                await cargarMarcas()
                alert(resultado.mensaje)
                if (vistaActual === 'detalles') {
                    volverListado()
                }
            } else {
                alert(resultado.mensaje || 'Error al eliminar marca')
            }
        } catch (error) {
            console.error('Error al eliminar marca:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const marcasFiltradas = marcas.filter(marca => {
        const cumpleBusqueda = busqueda === '' ||
            marca.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            (marca.pais_origen && marca.pais_origen.toLowerCase().includes(busqueda.toLowerCase()))

        const cumpleEstado = filtroEstado === 'todos' || 
            (filtroEstado === 'activos' && marca.activo) ||
            (filtroEstado === 'inactivos' && !marca.activo)

        return cumpleBusqueda && cumpleEstado
    })

    const calcularEstadisticas = () => {
        const total = marcas.length
        const activos = marcas.filter(m => m.activo).length
        const inactivos = marcas.filter(m => !m.activo).length
        const totalProductos = marcas.reduce((sum, m) => sum + (m.total_productos || 0), 0)

        return { total, activos, inactivos, totalProductos }
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', {
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
                        <h1 className={estilos.titulo}>{modoEdicion ? tr('Editar Marca', 'Edit Brand') : tr('Nueva Marca', 'New Brand')}</h1>
                        <p className={estilos.subtitulo}>{modoEdicion ? tr('Modifica los datos de la marca', 'Modify brand data') : tr('Registra una nueva marca', 'Register a new brand')}</p>
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
                        <h2 className={estilos.panelTitulo}>{tr('Información de la Marca', 'Brand Information')}</h2>
                        
                        <div className={estilos.grupoInput}>
                            <label>{tr('Nombre *', 'Name *')}</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder={tr('Ej: Coca Cola, Samsung, Nike...', 'Ex: Coca Cola, Samsung, Nike...')}
                                required
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>{tr('País de Origen', 'Country of Origin')}</label>
                            <input
                                type="text"
                                name="pais_origen"
                                value={formData.pais_origen}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder={tr('Ej: Estados Unidos, China, Alemania...', 'Ex: United States, China, Germany...')}
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
                                placeholder={tr('Describe brevemente esta marca...', 'Briefly describe this brand...')}
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
                            <label htmlFor="activo">{tr('Marca activa', 'Active brand')}</label>
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
                            {procesando ? tr('Guardando...', 'Saving...') : modoEdicion ? tr('Actualizar Marca', 'Update Brand') : tr('Crear Marca', 'Create Brand')}
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    if (vistaActual === 'detalles' && marcaSeleccionada) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Detalles de la Marca', 'Brand Details')}</h1>
                        <p className={estilos.subtitulo}>{tr('Información completa', 'Complete information')}</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button
                            type="button"
                            onClick={() => abrirFormularioEditar(marcaSeleccionada)}
                            className={estilos.btnEditar}
                            disabled={procesando}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            <span>{tr('Editar', 'Edit')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => manejarEliminar(marcaSeleccionada.id, marcaSeleccionada.nombre)}
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
                            <span className={`${estilos.badge} ${marcaSeleccionada.activo ? estilos.activo : estilos.inactivo}`}>
                                {marcaSeleccionada.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                            </span>
                        </div>

                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Nombre', 'Name')}</span>
                                <span className={estilos.infoValor}>{marcaSeleccionada.nombre}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('País de Origen', 'Country of Origin')}</span>
                                <span className={estilos.infoValor}>{marcaSeleccionada.pais_origen || tr('No especificado', 'Not specified')}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Fecha de Creación', 'Creation Date')}</span>
                                <span className={estilos.infoValor}>{formatearFecha(marcaSeleccionada.fecha_creacion)}</span>
                            </div>
                            {marcaSeleccionada.descripcion && (
                                <div className={`${estilos.infoItem} ${estilos.full}`}>
                                    <span className={estilos.infoLabel}>{tr('Descripción', 'Description')}</span>
                                    <span className={estilos.infoValor}>{marcaSeleccionada.descripcion}</span>
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
                                    <span className={estilos.estadCatValor}>{marcaSeleccionada.total_productos || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {marcaSeleccionada.productos && marcaSeleccionada.productos.length > 0 && (
                        <div className={`${estilos.panel} ${estilos[tema]} ${estilos.panelFull}`}>
                            <h2 className={estilos.panelTitulo}>{tr('Productos de esta Marca', 'Products of this Brand')}</h2>
                            <div className={estilos.listaProductos}>
                                {marcaSeleccionada.productos.map((producto) => (
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
                    <h1 className={estilos.titulo}>{tr('Marcas', 'Brands')}</h1>
                    <p className={estilos.subtitulo}>{tr('Gestiona las marcas de productos', 'Manage product brands')}</p>
                </div>
                <button
                    onClick={abrirFormularioNuevo}
                    className={estilos.btnNuevo}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>{tr('Nueva Marca', 'New Brand')}</span>
                </button>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="pricetag-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>{tr('Total Marcas', 'Total Brands')}</span>
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
                        placeholder={tr('Buscar marca...', 'Search brand...')}
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
            ) : marcasFiltradas.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="pricetag-outline"></ion-icon>
                    <span>{tr('No hay marcas que coincidan con tu búsqueda', 'No brands match your search')}</span>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {marcasFiltradas.map((marca) => (
                        <div key={marca.id} className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                <div className={estilos.cardIcono}>
                                    <ion-icon name="pricetag-outline"></ion-icon>
                                </div>
                                <div className={estilos.cardTitulo}>
                                    <h3>{marca.nombre}</h3>
                                    <span className={`${estilos.badge} ${marca.activo ? estilos.activo : estilos.inactivo}`}>
                                        {marca.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.cardBody}>
                                {marca.pais_origen && (
                                    <div className={estilos.cardPais}>
                                        <ion-icon name="globe-outline"></ion-icon>
                                        <span>{marca.pais_origen}</span>
                                    </div>
                                )}
                                {marca.descripcion && (
                                    <p className={estilos.descripcion}>{marca.descripcion}</p>
                                )}
                                <div className={estilos.cardEstadisticas}>
                                    <div className={estilos.cardEstad}>
                                        <ion-icon name="cube-outline"></ion-icon>
                                        <span>{marca.total_productos || 0} {tr('productos', 'products')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.cardFooter}>
                                <button
                                    onClick={() => abrirDetalles(marca.id)}
                                    className={estilos.btnIcono}
                                    title={tr('Ver detalles', 'View details')}
                                >
                                    <ion-icon name="eye-outline"></ion-icon>
                                </button>
                                <button
                                    onClick={() => abrirFormularioEditar(marca)}
                                    className={estilos.btnIcono}
                                    title={tr('Editar', 'Edit')}
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                </button>
                                <button
                                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                    onClick={() => manejarEliminar(marca.id, marca.nombre)}
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