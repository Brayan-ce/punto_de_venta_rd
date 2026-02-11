"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerMarcas, obtenerMarca, crearMarca, actualizarMarca, eliminarMarca } from './servidor'
import estilos from './marcas.module.css'

export default function MarcasAdmin() {
    const router = useRouter()
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
                alert(resultado.mensaje || 'Error al cargar marcas')
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
                        <h1 className={estilos.titulo}>{modoEdicion ? 'Editar Marca' : 'Nueva Marca'}</h1>
                        <p className={estilos.subtitulo}>{modoEdicion ? 'Modifica los datos de la marca' : 'Registra una nueva marca'}</p>
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
                        <h2 className={estilos.panelTitulo}>Informacion de la Marca</h2>
                        
                        <div className={estilos.grupoInput}>
                            <label>Nombre *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder="Ej: Coca Cola, Samsung, Nike..."
                                required
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Pais de Origen</label>
                            <input
                                type="text"
                                name="pais_origen"
                                value={formData.pais_origen}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder="Ej: Estados Unidos, China, Alemania..."
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
                                placeholder="Describe brevemente esta marca..."
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
                            <label htmlFor="activo">Marca activa</label>
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
                            {procesando ? 'Guardando...' : modoEdicion ? 'Actualizar Marca' : 'Crear Marca'}
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
                        <h1 className={estilos.titulo}>Detalles de la Marca</h1>
                        <p className={estilos.subtitulo}>Informacion completa</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button
                            type="button"
                            onClick={() => abrirFormularioEditar(marcaSeleccionada)}
                            className={estilos.btnEditar}
                            disabled={procesando}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            <span>Editar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => manejarEliminar(marcaSeleccionada.id, marcaSeleccionada.nombre)}
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
                            <span className={`${estilos.badge} ${marcaSeleccionada.activo ? estilos.activo : estilos.inactivo}`}>
                                {marcaSeleccionada.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>

                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Nombre</span>
                                <span className={estilos.infoValor}>{marcaSeleccionada.nombre}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Pais de Origen</span>
                                <span className={estilos.infoValor}>{marcaSeleccionada.pais_origen || 'No especificado'}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Fecha de Creacion</span>
                                <span className={estilos.infoValor}>{formatearFecha(marcaSeleccionada.fecha_creacion)}</span>
                            </div>
                            {marcaSeleccionada.descripcion && (
                                <div className={`${estilos.infoItem} ${estilos.full}`}>
                                    <span className={estilos.infoLabel}>Descripcion</span>
                                    <span className={estilos.infoValor}>{marcaSeleccionada.descripcion}</span>
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
                                    <span className={estilos.estadCatValor}>{marcaSeleccionada.total_productos || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {marcaSeleccionada.productos && marcaSeleccionada.productos.length > 0 && (
                        <div className={`${estilos.panel} ${estilos[tema]} ${estilos.panelFull}`}>
                            <h2 className={estilos.panelTitulo}>Productos de esta Marca</h2>
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
                    <h1 className={estilos.titulo}>Marcas</h1>
                    <p className={estilos.subtitulo}>Gestiona las marcas de productos</p>
                </div>
                <button
                    onClick={abrirFormularioNuevo}
                    className={estilos.btnNuevo}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nueva Marca</span>
                </button>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="pricetag-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Marcas</span>
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
                        placeholder="Buscar marca..."
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
                    <span>Cargando marcas...</span>
                </div>
            ) : marcasFiltradas.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="pricetag-outline"></ion-icon>
                    <span>No hay marcas que coincidan con tu busqueda</span>
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
                                        {marca.activo ? 'Activo' : 'Inactivo'}
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
                                        <span>{marca.total_productos || 0} productos</span>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.cardFooter}>
                                <button
                                    onClick={() => abrirDetalles(marca.id)}
                                    className={estilos.btnIcono}
                                    title="Ver detalles"
                                >
                                    <ion-icon name="eye-outline"></ion-icon>
                                </button>
                                <button
                                    onClick={() => abrirFormularioEditar(marca)}
                                    className={estilos.btnIcono}
                                    title="Editar"
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                </button>
                                <button
                                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                    onClick={() => manejarEliminar(marca.id, marca.nombre)}
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