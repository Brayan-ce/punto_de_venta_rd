"use client"
import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {
    obtenerProductosB2B,
    obtenerCategoriasB2B,
    crearProductoB2B,
    actualizarProductoB2B,
    eliminarProductoB2B,
    obtenerProductoB2B
} from './servidor'
import estilos from './productos.module.css'

export default function ProductosTiendaB2B() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [filtroCategoria, setFiltroCategoria] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [productoEditando, setProductoEditando] = useState(null)
    const [imagenModal, setImagenModal] = useState(null) // 🆕 Para modal de imagen

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
            const [resultadoProductos, resultadoCategorias] = await Promise.all([
                obtenerProductosB2B(filtroCategoria === 'todos' ? null : parseInt(filtroCategoria), null),
                obtenerCategoriasB2B()
            ])

            if (resultadoProductos.success) {
                setProductos(resultadoProductos.productos || [])
            }

            if (resultadoCategorias.success) {
                setCategorias(resultadoCategorias.categorias || [])
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        if (!mostrarFormulario) {
            cargarDatos()
        }
    }, [filtroCategoria, busqueda, mostrarFormulario])

    const manejarBuscar = () => {
        cargarDatos()
    }

    const manejarNuevo = () => {
        setProductoEditando(null)
        setMostrarFormulario(true)
    }

    const manejarEditar = async (productoId) => {
        try {
            const resultado = await obtenerProductoB2B(productoId)
            if (resultado.success) {
                setProductoEditando(resultado.producto)
                setMostrarFormulario(true)
            } else {
                alert('Error al cargar producto: ' + resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al cargar producto:', error)
            alert('Error al cargar producto')
        }
    }

    const manejarEliminar = async (productoId, nombre) => {
        if (!confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) {
            return
        }

        try {
            const resultado = await eliminarProductoB2B(productoId)
            if (resultado.success) {
                alert('Producto eliminado correctamente')
                await cargarDatos()
            } else {
                alert('Error al eliminar: ' + resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al eliminar:', error)
            alert('Error al eliminar producto')
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    // 🆕 Función para abrir modal de imagen
    const abrirImagenModal = (imagen, nombre) => {
        setImagenModal({ url: imagen, nombre })
    }

    if (mostrarFormulario) {
        return (
            <FormularioProducto
                producto={productoEditando}
                categorias={categorias}
                onCancelar={() => {
                    setMostrarFormulario(false)
                    setProductoEditando(null)
                }}
                onGuardar={async () => {
                    setMostrarFormulario(false)
                    setProductoEditando(null)
                    await cargarDatos()
                }}
                tema={tema}
            />
        )
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.spinner}></div>
                    <span>Cargando productos...</span>
                </div>
            </div>
        )
    }

    const productosFiltrados = productos.filter(p => {
        if (busqueda) {
            const busquedaLower = busqueda.toLowerCase()
            return p.nombre.toLowerCase().includes(busquedaLower) ||
                (p.sku && p.sku.toLowerCase().includes(busquedaLower)) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(busquedaLower))
        }
        return true
    })

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* 🆕 Modal de imagen */}
            {imagenModal && (
                <div className={estilos.modalImagen} onClick={() => setImagenModal(null)}>
                    <div className={estilos.modalContenido} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={estilos.modalCerrar}
                            onClick={() => setImagenModal(null)}
                            aria-label="Cerrar"
                        >
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                        <img src={imagenModal.url} alt={imagenModal.nombre} />
                        <p className={estilos.modalTitulo}>{imagenModal.nombre}</p>
                    </div>
                </div>
            )}

            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Productos Tienda B2B</h1>
                    <p className={estilos.subtitulo}>Gestiona los productos que IsiWeek vende a las empresas</p>
                </div>
                <button className={estilos.btnNuevo} onClick={manejarNuevo}>
                    <ion-icon name="add-outline"></ion-icon>
                    <span>Nuevo Producto</span>
                </button>
            </div>

            <div className={estilos.filtros}>
                <div className={estilos.filtroGrupo}>
                    <label className={estilos.label}>
                        <ion-icon name="filter-outline"></ion-icon>
                        Categoría
                    </label>
                    <select
                        className={estilos.select}
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                    >
                        <option value="todos">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className={estilos.filtroGrupo}>
                    <label className={estilos.label}>
                        <ion-icon name="search-outline"></ion-icon>
                        Buscar
                    </label>
                    <div className={estilos.busqueda}>
                        <input
                            type="text"
                            className={estilos.input}
                            placeholder="Buscar por nombre, SKU o descripción..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && manejarBuscar()}
                        />
                        <button className={estilos.btnBuscar} onClick={manejarBuscar}>
                            <ion-icon name="search-outline"></ion-icon>
                        </button>
                    </div>
                </div>
            </div>

            {/* 🆕 Contador de resultados */}
            <div className={estilos.contador}>
                <ion-icon name="cube-outline"></ion-icon>
                <span>{productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'}</span>
            </div>

            {productosFiltrados.length === 0 ? (
                <div className={estilos.vacio}>
                    <div className={estilos.vacioIcono}>
                        <ion-icon name="cube-outline"></ion-icon>
                    </div>
                    <h3>No hay productos disponibles</h3>
                    <p>
                        {filtroCategoria !== 'todos' || busqueda
                            ? 'No se encontraron productos que coincidan con tu búsqueda'
                            : 'Comienza agregando tu primer producto'}
                    </p>
                    <button className={estilos.btnNuevo} onClick={manejarNuevo}>
                        <ion-icon name="add-outline"></ion-icon>
                        <span>Crear Primer Producto</span>
                    </button>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {productosFiltrados.map((producto) => (
                        <div key={producto.id} className={estilos.productoCard}>
                            {/* 🆕 Imagen mejorada con overlay y zoom */}
                            <div className={estilos.imagenContainer}>
                                {producto.imagen_url ? (
                                    <>
                                        <img
                                            src={producto.imagen_url}
                                            alt={producto.nombre}
                                            className={estilos.imagen}
                                            loading="lazy"
                                        />
                                        <button
                                            className={estilos.btnZoom}
                                            onClick={() => abrirImagenModal(producto.imagen_url, producto.nombre)}
                                            aria-label="Ver imagen completa"
                                        >
                                            <ion-icon name="expand-outline"></ion-icon>
                                        </button>
                                    </>
                                ) : (
                                    <div className={estilos.imagenPlaceholder}>
                                        <ion-icon name="image-outline"></ion-icon>
                                        <span>Sin imagen</span>
                                    </div>
                                )}
                            </div>

                            <div className={estilos.productoInfo}>
                                <div className={estilos.productoHeader}>
                                    <h3 className={estilos.productoNombre}>{producto.nombre}</h3>
                                    {producto.destacado && (
                                        <span className={estilos.badgeDestacado}>
                                            <ion-icon name="star"></ion-icon>
                                            Destacado
                                        </span>
                                    )}
                                </div>

                                {producto.descripcion && (
                                    <p className={estilos.descripcion}>
                                        {producto.descripcion.length > 100
                                            ? `${producto.descripcion.substring(0, 100)}...`
                                            : producto.descripcion}
                                    </p>
                                )}

                                <div className={estilos.detalles}>
                                    {producto.sku && (
                                        <div className={estilos.detalleItem}>
                                            <ion-icon name="barcode-outline"></ion-icon>
                                            <span className={estilos.detalleLabel}>SKU:</span>
                                            <span className={estilos.detalleValor}>{producto.sku}</span>
                                        </div>
                                    )}
                                    <div className={estilos.detalleItem}>
                                        <ion-icon name="layers-outline"></ion-icon>
                                        <span className={estilos.detalleLabel}>Stock:</span>
                                        <span className={`${estilos.detalleValor} ${
                                            producto.stock > 10 ? estilos.stockBueno :
                                                producto.stock > 0 ? estilos.stockBajo :
                                                    estilos.stockAgotado
                                        }`}>
                                            {producto.stock} unidades
                                        </span>
                                    </div>
                                    {producto.categoria_nombre && (
                                        <div className={estilos.detalleItem}>
                                            <ion-icon name="pricetag-outline"></ion-icon>
                                            <span className={estilos.detalleLabel}>Categoría:</span>
                                            <span className={estilos.detalleValor}>{producto.categoria_nombre}</span>
                                        </div>
                                    )}
                                    {producto.tiempo_entrega && (
                                        <div className={estilos.detalleItem}>
                                            <ion-icon name="time-outline"></ion-icon>
                                            <span className={estilos.detalleLabel}>Entrega:</span>
                                            <span className={estilos.detalleValor}>{producto.tiempo_entrega}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={estilos.precios}>
                                    <div className={estilos.precioPrincipal}>
                                        <span className={estilos.precioLabel}>Precio:</span>
                                        <span className={estilos.precioValor}>{formatearMoneda(producto.precio)}</span>
                                    </div>
                                    {producto.precio_volumen && producto.cantidad_volumen && (
                                        <div className={estilos.precioVolumen}>
                                            <ion-icon name="people-outline"></ion-icon>
                                            <span>
                                                Compra {producto.cantidad_volumen}+ unidades a {formatearMoneda(producto.precio_volumen)} c/u
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className={estilos.acciones}>
                                    <button
                                        className={estilos.btnEditar}
                                        onClick={() => manejarEditar(producto.id)}
                                        title="Editar producto"
                                    >
                                        <ion-icon name="create-outline"></ion-icon>
                                        <span>Editar</span>
                                    </button>
                                    <button
                                        className={estilos.btnEliminar}
                                        onClick={() => manejarEliminar(producto.id, producto.nombre)}
                                        title="Eliminar producto"
                                    >
                                        <ion-icon name="trash-outline"></ion-icon>
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// 🆕 Componente de formulario mejorado
function FormularioProducto({ producto, categorias, onCancelar, onGuardar, tema }) {
    const [datos, setDatos] = useState({
        nombre: '',
        descripcion: '',
        categoria_id: null,
        precio: '',
        precio_volumen: '',
        cantidad_volumen: '',
        stock: '0',
        sku: '',
        tiempo_entrega: '',
        activo: true,
        destacado: false,
        imagen_url: '',
        imagen_base64: null
    })

    const [tipoImagen, setTipoImagen] = useState('url') // 'url' o 'local'
    const [previewImagen, setPreviewImagen] = useState(null)
    const [archivoImagen, setArchivoImagen] = useState(null)
    const [procesando, setProcesando] = useState(false)
    const [errores, setErrores] = useState({})

    // Cargar datos del producto al editar
    useEffect(() => {
        if (producto) {
            setDatos({
                nombre: producto.nombre || '',
                descripcion: producto.descripcion || '',
                categoria_id: producto.categoria_id || null,
                precio: producto.precio || '',
                precio_volumen: producto.precio_volumen || '',
                cantidad_volumen: producto.cantidad_volumen || '',
                stock: producto.stock || '0',
                sku: producto.sku || '',
                tiempo_entrega: producto.tiempo_entrega || '',
                activo: producto.activo ?? true,
                destacado: producto.destacado ?? false,
                imagen_url: producto.imagen_url || '',
                imagen_base64: null
            })
            setPreviewImagen(producto.imagen_url || null)
            if (producto.imagen_url) {
                setTipoImagen('url')
            }
        }
    }, [producto])

    // 🆕 Validación mejorada
    const validarFormulario = () => {
        const nuevosErrores = {}

        if (!datos.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio'
        }

        if (!datos.precio || parseFloat(datos.precio) <= 0) {
            nuevosErrores.precio = 'El precio debe ser mayor a 0'
        }

        if (datos.precio_volumen && !datos.cantidad_volumen) {
            nuevosErrores.cantidad_volumen = 'Indica la cantidad mínima para precio por volumen'
        }

        if (datos.cantidad_volumen && !datos.precio_volumen) {
            nuevosErrores.precio_volumen = 'Indica el precio por volumen'
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    // 🆕 Manejo de imagen local mejorado
    const manejarImagenArchivo = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        const maxSize = 5 * 1024 * 1024 // 5MB

        if (!tiposPermitidos.includes(file.type)) {
            alert('Solo se permiten imágenes JPG, PNG o WebP')
            e.target.value = ''
            return
        }

        if (file.size > maxSize) {
            alert(`La imagen debe pesar menos de 5MB. Tu archivo pesa ${(file.size / 1024 / 1024).toFixed(2)}MB`)
            e.target.value = ''
            return
        }

        setArchivoImagen(file)

        const reader = new FileReader()
        reader.onloadend = () => {
            setDatos(prev => ({
                ...prev,
                imagen_base64: reader.result,
                imagen_url: '' // Limpiar URL si existe
            }))
            setPreviewImagen(reader.result)
        }
        reader.onerror = () => {
            alert('Error al leer el archivo de imagen')
        }
        reader.readAsDataURL(file)
    }

    // 🆕 Cambiar tipo de imagen
    const cambiarTipoImagen = (tipo) => {
        setTipoImagen(tipo)
        setDatos(prev => ({
            ...prev,
            imagen_url: '',
            imagen_base64: null
        }))
        setPreviewImagen(null)
        setArchivoImagen(null)
    }

    // 🆕 Manejo de URL de imagen
    const manejarCambioImagenUrl = (e) => {
        const url = e.target.value
        setDatos(prev => ({
            ...prev,
            imagen_url: url,
            imagen_base64: null
        }))
        setPreviewImagen(url || null)
    }

    // Guardar producto
    const manejarGuardar = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) {
            alert('Por favor corrige los errores en el formulario')
            return
        }

        setProcesando(true)

        try {
            const datosEnviar = {
                ...datos,
                categoria_id: datos.categoria_id || null,
                precio: parseFloat(datos.precio),
                precio_volumen: datos.precio_volumen ? parseFloat(datos.precio_volumen) : null,
                cantidad_volumen: datos.cantidad_volumen ? parseInt(datos.cantidad_volumen) : null,
                stock: parseInt(datos.stock),
            }

            let resultado
            if (producto) {
                resultado = await actualizarProductoB2B(producto.id, datosEnviar)
            } else {
                resultado = await crearProductoB2B(datosEnviar)
            }

            if (resultado.success) {
                alert(producto ? 'Producto actualizado correctamente' : 'Producto creado correctamente')
                onGuardar()
            } else {
                alert(resultado.mensaje || 'Error al guardar producto')
            }

        } catch (error) {
            console.error('Error al guardar:', error)
            alert('Error al guardar producto')
        } finally {
            setProcesando(false)
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.formularioContainer}>
                <div className={estilos.formularioHeader}>
                    <div>
                        <h2 className={estilos.formularioTitulo}>
                            {producto ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        <p className={estilos.formularioSubtitulo}>
                            {producto
                                ? 'Actualiza la información del producto'
                                : 'Completa los datos del nuevo producto'}
                        </p>
                    </div>
                    <button
                        className={estilos.btnCerrar}
                        onClick={onCancelar}
                        type="button"
                        aria-label="Cerrar"
                    >
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <form onSubmit={manejarGuardar} className={estilos.formulario}>
                    <div className={estilos.formLayout}>
                        {/* Columna izquierda - Información general */}
                        <div className={estilos.formColumna}>
                            <div className={estilos.seccionForm}>
                                <h3 className={estilos.seccionTitulo}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    Información General
                                </h3>

                                <div className={estilos.campo}>
                                    <label className={estilos.labelRequerido}>
                                        Nombre del Producto
                                    </label>
                                    <input
                                        type="text"
                                        className={`${estilos.input} ${errores.nombre ? estilos.inputError : ''}`}
                                        value={datos.nombre}
                                        onChange={(e) => {
                                            setDatos({ ...datos, nombre: e.target.value })
                                            if (errores.nombre) setErrores({ ...errores, nombre: null })
                                        }}
                                        placeholder="Ingresa el nombre del producto"
                                    />
                                    {errores.nombre && (
                                        <span className={estilos.mensajeError}>
                                            <ion-icon name="alert-circle-outline"></ion-icon>
                                            {errores.nombre}
                                        </span>
                                    )}
                                </div>

                                <div className={estilos.campo}>
                                    <label>Descripción</label>
                                    <textarea
                                        className={estilos.textarea}
                                        rows="4"
                                        value={datos.descripcion}
                                        onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
                                        placeholder="Describe el producto, sus características y beneficios..."
                                    />
                                </div>

                                <div className={estilos.formGrid}>
                                    <div className={estilos.campo}>
                                        <label>SKU</label>
                                        <input
                                            type="text"
                                            className={estilos.input}
                                            value={datos.sku}
                                            onChange={(e) => setDatos({ ...datos, sku: e.target.value })}
                                            placeholder="Código único del producto"
                                        />
                                    </div>

                                    <div className={estilos.campo}>
                                        <label>Categoría</label>
                                        <select
                                            className={estilos.select}
                                            value={datos.categoria_id || ''}
                                            onChange={(e) => setDatos({
                                                ...datos,
                                                categoria_id: e.target.value ? parseInt(e.target.value) : null
                                            })}
                                        >
                                            <option value="">Sin categoría</option>
                                            {categorias.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={estilos.campo}>
                                    <label>Tiempo de Entrega</label>
                                    <input
                                        type="text"
                                        className={estilos.input}
                                        value={datos.tiempo_entrega}
                                        onChange={(e) => setDatos({ ...datos, tiempo_entrega: e.target.value })}
                                        placeholder="Ej: 2-3 días hábiles"
                                    />
                                </div>
                            </div>

                            {/* Sección de precios */}
                            <div className={estilos.seccionForm}>
                                <h3 className={estilos.seccionTitulo}>
                                    <ion-icon name="cash-outline"></ion-icon>
                                    Precios y Stock
                                </h3>

                                <div className={estilos.formGrid}>
                                    <div className={estilos.campo}>
                                        <label className={estilos.labelRequerido}>Precio Unitario</label>
                                        <div className={estilos.inputMoneda}>
                                            <span className={estilos.simboloMoneda}>RD$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className={`${estilos.inputConIcono} ${errores.precio ? estilos.inputError : ''}`}
                                                value={datos.precio}
                                                onChange={(e) => {
                                                    setDatos({ ...datos, precio: e.target.value })
                                                    if (errores.precio) setErrores({ ...errores, precio: null })
                                                }}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errores.precio && (
                                            <span className={estilos.mensajeError}>
                                                <ion-icon name="alert-circle-outline"></ion-icon>
                                                {errores.precio}
                                            </span>
                                        )}
                                    </div>

                                    <div className={estilos.campo}>
                                        <label>Stock Disponible</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className={estilos.input}
                                            value={datos.stock}
                                            onChange={(e) => setDatos({ ...datos, stock: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Precios por volumen */}
                                <div className={estilos.preciosVolumen}>
                                    <p className={estilos.labelSeccion}>
                                        <ion-icon name="people-outline"></ion-icon>
                                        Precio por Volumen (Opcional)
                                    </p>
                                    <div className={estilos.formGrid}>
                                        <div className={estilos.campo}>
                                            <label>Precio por Unidad</label>
                                            <div className={estilos.inputMoneda}>
                                                <span className={estilos.simboloMoneda}>RD$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className={`${estilos.inputConIcono} ${errores.precio_volumen ? estilos.inputError : ''}`}
                                                    value={datos.precio_volumen}
                                                    onChange={(e) => {
                                                        setDatos({ ...datos, precio_volumen: e.target.value })
                                                        if (errores.precio_volumen) setErrores({ ...errores, precio_volumen: null })
                                                    }}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {errores.precio_volumen && (
                                                <span className={estilos.mensajeError}>
                                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                                    {errores.precio_volumen}
                                                </span>
                                            )}
                                        </div>

                                        <div className={estilos.campo}>
                                            <label>Cantidad Mínima</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className={`${estilos.input} ${errores.cantidad_volumen ? estilos.inputError : ''}`}
                                                value={datos.cantidad_volumen}
                                                onChange={(e) => {
                                                    setDatos({ ...datos, cantidad_volumen: e.target.value })
                                                    if (errores.cantidad_volumen) setErrores({ ...errores, cantidad_volumen: null })
                                                }}
                                                placeholder="Ej: 10"
                                            />
                                            {errores.cantidad_volumen && (
                                                <span className={estilos.mensajeError}>
                                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                                    {errores.cantidad_volumen}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha - Imagen y configuración */}
                        <div className={estilos.formColumna}>
                            {/* 🆕 Sección de imagen mejorada */}
                            <div className={estilos.seccionForm}>
                                <h3 className={estilos.seccionTitulo}>
                                    <ion-icon name="image-outline"></ion-icon>
                                    Imagen del Producto
                                </h3>

                                {/* Selector de tipo de imagen */}
                                <div className={estilos.selectorTipo}>
                                    <button
                                        type="button"
                                        className={`${estilos.btnTipo} ${tipoImagen === 'url' ? estilos.activo : ''}`}
                                        onClick={() => cambiarTipoImagen('url')}
                                    >
                                        <ion-icon name="link-outline"></ion-icon>
                                        <span>URL Externa</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`${estilos.btnTipo} ${tipoImagen === 'local' ? estilos.activo : ''}`}
                                        onClick={() => cambiarTipoImagen('local')}
                                    >
                                        <ion-icon name="cloud-upload-outline"></ion-icon>
                                        <span>Subir Archivo</span>
                                    </button>
                                </div>

                                {/* Input según tipo */}
                                {tipoImagen === 'url' ? (
                                    <div className={estilos.campo}>
                                        <label>URL de la Imagen</label>
                                        <input
                                            type="url"
                                            className={estilos.input}
                                            value={datos.imagen_url}
                                            onChange={manejarCambioImagenUrl}
                                            placeholder="https://ejemplo.com/imagen.jpg"
                                        />
                                        <p className={estilos.ayuda}>
                                            <ion-icon name="information-circle-outline"></ion-icon>
                                            Ingresa la URL completa de la imagen
                                        </p>
                                    </div>
                                ) : (
                                    <div className={estilos.campo}>
                                        <label>Seleccionar Archivo</label>
                                        <div className={estilos.uploadArea}>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={manejarImagenArchivo}
                                                className={estilos.inputFile}
                                                id="archivo-imagen"
                                            />
                                            <label htmlFor="archivo-imagen" className={estilos.labelUpload}>
                                                <ion-icon name="cloud-upload-outline"></ion-icon>
                                                <span className={estilos.uploadTexto}>
                                                    {archivoImagen ? archivoImagen.name : 'Haz clic o arrastra una imagen'}
                                                </span>
                                                <span className={estilos.uploadAyuda}>
                                                    JPG, PNG o WebP - Máximo 5MB
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Vista previa de la imagen */}
                                {previewImagen && (
                                    <div className={estilos.previewContainer}>
                                        <label>Vista Previa</label>
                                        <div className={estilos.previewImagen}>
                                            <img src={previewImagen} alt="Preview" />
                                            <button
                                                type="button"
                                                className={estilos.btnEliminarPreview}
                                                onClick={() => {
                                                    setPreviewImagen(null)
                                                    setDatos({ ...datos, imagen_url: '', imagen_base64: null })
                                                    setArchivoImagen(null)
                                                }}
                                                aria-label="Eliminar imagen"
                                            >
                                                <ion-icon name="close-circle"></ion-icon>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Configuración del producto */}
                            <div className={estilos.seccionForm}>
                                <h3 className={estilos.seccionTitulo}>
                                    <ion-icon name="settings-outline"></ion-icon>
                                    Configuración
                                </h3>

                                <div className={estilos.switchGroup}>
                                    <label className={estilos.switchContainer}>
                                        <input
                                            type="checkbox"
                                            checked={datos.activo}
                                            onChange={(e) => setDatos({ ...datos, activo: e.target.checked })}
                                        />
                                        <span className={estilos.switch}></span>
                                        <span className={estilos.switchLabel}>
                                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                                            Producto Activo
                                        </span>
                                    </label>

                                    <label className={estilos.switchContainer}>
                                        <input
                                            type="checkbox"
                                            checked={datos.destacado}
                                            onChange={(e) => setDatos({ ...datos, destacado: e.target.checked })}
                                        />
                                        <span className={estilos.switch}></span>
                                        <span className={estilos.switchLabel}>
                                            <ion-icon name="star-outline"></ion-icon>
                                            Producto Destacado
                                        </span>
                                    </label>
                                </div>

                                <div className={estilos.infoBox}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <div>
                                        <p><strong>Producto Activo:</strong> Visible para las empresas</p>
                                        <p><strong>Producto Destacado:</strong> Se mostrará en la sección principal</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className={estilos.formularioAcciones}>
                        <button
                            type="button"
                            onClick={onCancelar}
                            className={estilos.btnCancelarForm}
                            disabled={procesando}
                        >
                            <ion-icon name="close-outline"></ion-icon>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={estilos.btnGuardarForm}
                            disabled={procesando}
                        >
                            {procesando ? (
                                <>
                                    <div className={estilos.spinner}></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-outline"></ion-icon>
                                    {producto ? 'Actualizar Producto' : 'Crear Producto'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}