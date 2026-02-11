"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerProducto, actualizarProducto } from './servidor'
import estilos from './editar.module.css'

export default function EditarProductoAdmin() {
    const router = useRouter()
    const params = useParams()
    const productoId = params.id
    
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    
    const [categorias, setCategorias] = useState([])
    const [marcas, setMarcas] = useState([])
    const [unidadesMedida, setUnidadesMedida] = useState([])
    
    const [codigoBarras, setCodigoBarras] = useState('')
    const [sku, setSku] = useState('')
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [categoriaId, setCategoriaId] = useState('')
    const [marcaId, setMarcaId] = useState('')
    const [unidadMedidaId, setUnidadMedidaId] = useState('')
    const [precioCompra, setPrecioCompra] = useState('')
    const [precioVenta, setPrecioVenta] = useState('')
    const [precioPorUnidad, setPrecioPorUnidad] = useState('')
    const [permiteDecimales, setPermiteDecimales] = useState(false)
    const [unidadVentaDefaultId, setUnidadVentaDefaultId] = useState('')
    const [tipoMedidaSeleccionado, setTipoMedidaSeleccionado] = useState(null)
    const [unidadSeleccionada, setUnidadSeleccionada] = useState(null)
    const [precioOferta, setPrecioOferta] = useState('')
    const [precioMayorista, setPrecioMayorista] = useState('')
    const [cantidadMayorista, setCantidadMayorista] = useState('6')
    const [stock, setStock] = useState('0')
    const [stockMinimo, setStockMinimo] = useState('5')
    const [stockMaximo, setStockMaximo] = useState('100')
    const [tipoImagen, setTipoImagen] = useState('url')
    const [imagenUrl, setImagenUrl] = useState('')
    const [imagenArchivo, setImagenArchivo] = useState(null)
    const [vistaPrevia, setVistaPrevia] = useState(null)
    const [imagenUrlOriginal, setImagenUrlOriginal] = useState(null) // Guardar URL original para comparar
    const [aplicaItbis, setAplicaItbis] = useState(true)
    const [activo, setActivo] = useState(true)
    const [fechaVencimiento, setFechaVencimiento] = useState('')
    const [lote, setLote] = useState('')
    const [ubicacionBodega, setUbicacionBodega] = useState('')

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

    // Auto-configurar según tipo de medida seleccionada (RF-002.3, RF-002.4)
    useEffect(() => {
        if (unidadMedidaId && unidadesMedida.length > 0) {
            const unidad = unidadesMedida.find(um => um.id === parseInt(unidadMedidaId))
            if (unidad) {
                setUnidadSeleccionada(unidad)
                setTipoMedidaSeleccionado(unidad.tipo_medida)
                
                // RF-002.3: Productos por peso deben permitir decimales obligatoriamente
                if (unidad.tipo_medida === 'peso') {
                    setPermiteDecimales(true) // Obligatorio, no se puede cambiar
                } else if (['volumen', 'longitud', 'area'].includes(unidad.tipo_medida)) {
                    // Recomendado pero no obligatorio al editar
                    if (permiteDecimales === false && unidad.permite_decimales) {
                        // Solo cambiar si estaba en false y la unidad lo permite
                        setPermiteDecimales(true)
                    }
                }
                
                // Auto-configurar unidad_venta_default_id si no está seleccionada
                if (!unidadVentaDefaultId) {
                    setUnidadVentaDefaultId(unidadMedidaId)
                }
            }
        } else {
            setUnidadSeleccionada(null)
            setTipoMedidaSeleccionado(null)
        }
    }, [unidadMedidaId, unidadesMedida])

    // Sincronizar precio_por_unidad con precio_venta
    useEffect(() => {
        if (precioVenta && !precioPorUnidad) {
            setPrecioPorUnidad(precioVenta)
        }
    }, [precioVenta])

    const cargarDatos = async () => {
        try {
            const resultado = await obtenerProducto(productoId)
            if (resultado.success) {
                const producto = resultado.producto
                
                setCategorias(resultado.categorias)
                setMarcas(resultado.marcas)
                setUnidadesMedida(resultado.unidadesMedida)
                
                setCodigoBarras(producto.codigo_barras || '')
                setSku(producto.sku || '')
                setNombre(producto.nombre || '')
                setDescripcion(producto.descripcion || '')
                setCategoriaId(producto.categoria_id ? producto.categoria_id.toString() : '')
                setMarcaId(producto.marca_id ? producto.marca_id.toString() : '')
                setUnidadMedidaId(producto.unidad_medida_id ? producto.unidad_medida_id.toString() : '')
                setPrecioCompra(producto.precio_compra || '')
                setPrecioVenta(producto.precio_venta || '')
                setPrecioPorUnidad(producto.precio_por_unidad || producto.precio_venta || '')
                setPermiteDecimales(producto.permite_decimales || false)
                setUnidadVentaDefaultId(producto.unidad_venta_default_id ? producto.unidad_venta_default_id.toString() : (producto.unidad_medida_id ? producto.unidad_medida_id.toString() : ''))
                setPrecioOferta(producto.precio_oferta || '')
                setPrecioMayorista(producto.precio_mayorista || '')
                setCantidadMayorista(producto.cantidad_mayorista || '6')
                setStock(producto.stock || '0')
                setStockMinimo(producto.stock_minimo || '5')
                setStockMaximo(producto.stock_maximo || '100')
                setAplicaItbis(producto.aplica_itbis !== false)
                setActivo(producto.activo !== false)
                setFechaVencimiento(producto.fecha_vencimiento || '')
                setLote(producto.lote || '')
                setUbicacionBodega(producto.ubicacion_bodega || '')
                
                // Cargar información de la unidad seleccionada después de establecer unidadesMedida
                setTimeout(() => {
                    if (producto.unidad_medida_id && resultado.unidadesMedida) {
                        const unidad = resultado.unidadesMedida.find(um => um.id === producto.unidad_medida_id)
                        if (unidad) {
                            setUnidadSeleccionada(unidad)
                            setTipoMedidaSeleccionado(unidad.tipo_medida)
                        }
                    }
                }, 0)
                
                if (producto.imagen_url) {
                    if (producto.imagen_url.startsWith('data:image')) {
                        setTipoImagen('local')
                        setVistaPrevia(producto.imagen_url)
                        setImagenArchivo(null) // No hay archivo, solo base64
                        setImagenUrlOriginal(null)
                    } else {
                        // Es una URL (local o externa)
                        setTipoImagen('url')
                        setImagenUrl(producto.imagen_url) // Cargar la URL existente
                        setImagenUrlOriginal(producto.imagen_url) // Guardar URL original
                        setVistaPrevia(producto.imagen_url)
                        setImagenArchivo(null) // No hay archivo nuevo
                    }
                } else {
                    // No hay imagen, resetear todo
                    setTipoImagen('url')
                    setImagenUrl('')
                    setImagenArchivo(null)
                    setVistaPrevia(null)
                    setImagenUrlOriginal(null)
                }
            } else {
                alert(resultado.mensaje || 'Error al cargar producto')
                router.push('/admin/productos')
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
            router.push('/admin/productos')
        } finally {
            setCargando(false)
        }
    }

    const manejarCambioTipoImagen = (tipo) => {
        const tipoAnterior = tipoImagen
        setTipoImagen(tipo)
        
        if (tipo === 'url') {
            // Si cambia a URL y había una URL original, restaurarla
            if (tipoAnterior === 'local' && imagenUrlOriginal) {
                setImagenUrl(imagenUrlOriginal)
                setVistaPrevia(imagenUrlOriginal)
            } else if (!imagenUrl && imagenUrlOriginal) {
                // Si no hay imagenUrl pero hay original, restaurarla
                setImagenUrl(imagenUrlOriginal)
                setVistaPrevia(imagenUrlOriginal)
            } else if (imagenUrl) {
                // Ya hay una URL, mantenerla
                setVistaPrevia(imagenUrl)
            } else {
                setVistaPrevia(null)
            }
            setImagenArchivo(null)
        } else {
            // Cambiando a 'local', mantener imagenUrl para poder restaurar si vuelve a 'url'
            setImagenArchivo(null)
        }
    }

    const manejarCambioImagen = (e) => {
        const archivo = e.target.files?.[0]
        if (!archivo) return

        const maxSize = 5 * 1024 * 1024

        if (archivo.size > maxSize) {
            alert('La imagen no debe superar los 5MB. Tu archivo pesa: ' + (archivo.size / 1024 / 1024).toFixed(2) + 'MB')
            e.target.value = ''
            setImagenArchivo(null)
            setVistaPrevia(null)
            return
        }

        if (!archivo.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido')
            e.target.value = ''
            setImagenArchivo(null)
            setVistaPrevia(null)
            return
        }

        setImagenArchivo(archivo)
        const reader = new FileReader()
        reader.onloadend = () => {
            setVistaPrevia(reader.result)
        }
        reader.readAsDataURL(archivo)
    }

    const manejarCambioImagenUrl = (e) => {
        const url = e.target.value
        setImagenUrl(url)
        // Si hay URL, mostrar vista previa. Si está vacío pero hay URL original, mantener vista previa
        if (url.trim()) {
            setVistaPrevia(url)
        } else if (imagenUrlOriginal) {
            // Si se borra el campo pero hay URL original, mantener la vista previa de la original
            setVistaPrevia(imagenUrlOriginal)
        } else {
            setVistaPrevia(null)
        }
    }

    const validarFormulario = () => {
        // RF-002.2: Validaciones según especificación
        if (!nombre.trim()) {
            alert('El nombre del producto es obligatorio')
            return false
        }

        if (!precioCompra || parseFloat(precioCompra) < 0) {
            alert('El precio de compra debe ser mayor o igual a 0')
            return false
        }

        const precioPorUnidadFinal = parseFloat(precioPorUnidad || precioVenta)
        if (!precioPorUnidadFinal || precioPorUnidadFinal <= 0) {
            alert('El precio por unidad debe ser mayor a 0')
            return false
        }

        if (parseFloat(precioVenta) < parseFloat(precioCompra)) {
            if (!confirm('El precio de venta es menor que el precio de compra. ¿Deseas continuar?')) {
                return false
            }
        }

        // RF-002.2: Validar unidad de medida existente y activa
        if (!unidadMedidaId) {
            alert('Selecciona una unidad de medida base')
            return false
        }

        const unidadSeleccionadaValidacion = unidadesMedida.find(um => um.id === parseInt(unidadMedidaId))
        if (!unidadSeleccionadaValidacion) {
            alert('La unidad de medida seleccionada no existe')
            return false
        }

        // RF-002.2: Validar coherencia entre tipo de venta y configuración de decimales
        if (tipoMedidaSeleccionado === 'peso') {
            // RF-002.3: Productos por peso deben permitir decimales obligatoriamente
            if (!permiteDecimales) {
                alert('Los productos por peso deben permitir cantidades decimales obligatoriamente')
                return false
            }
        }

        return true
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) return

        setProcesando(true)
        try {
            const datosProducto = {
                codigo_barras: codigoBarras.trim() || null,
                sku: sku.trim() || null,
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
                categoria_id: categoriaId ? parseInt(categoriaId) : null,
                marca_id: marcaId ? parseInt(marcaId) : null,
                unidad_medida_id: parseInt(unidadMedidaId),
                precio_compra: parseFloat(precioCompra),
                precio_venta: parseFloat(precioVenta),
                precio_por_unidad: parseFloat(precioPorUnidad || precioVenta),
                permite_decimales: permiteDecimales,
                unidad_venta_default_id: unidadVentaDefaultId || unidadMedidaId,
                precio_oferta: precioOferta ? parseFloat(precioOferta) : null,
                precio_mayorista: precioMayorista ? parseFloat(precioMayorista) : null,
                cantidad_mayorista: parseInt(cantidadMayorista),
                stock_minimo: parseFloat(stockMinimo) || 5.000,
                stock_maximo: parseFloat(stockMaximo) || 100.000,
                // Manejo inteligente de imagen:
                // - Si tipoImagen es 'url' y hay imagenUrl con contenido, usar esa URL (nueva o modificada)
                // - Si tipoImagen es 'url' pero imagenUrl está vacío Y hay imagenUrlOriginal, mantener la original
                // - Si imagenUrlOriginal es null (fue eliminada intencionalmente), enviar null
                imagen_url: tipoImagen === 'url' 
                    ? (imagenUrl.trim() || (imagenUrlOriginal !== null ? imagenUrlOriginal : null))
                    : null,
                imagen_base64: tipoImagen === 'local' && imagenArchivo 
                    ? vistaPrevia 
                    : (tipoImagen === 'local' && vistaPrevia && vistaPrevia.startsWith('data:image') 
                        ? vistaPrevia 
                        : null),
                aplica_itbis: aplicaItbis,
                activo: activo,
                fecha_vencimiento: fechaVencimiento || null,
                lote: lote.trim() || null,
                ubicacion_bodega: ubicacionBodega.trim() || null
            }

            const resultado = await actualizarProducto(productoId, datosProducto)

            if (resultado.success) {
                alert(resultado.mensaje)
                router.push('/admin/productos')
            } else {
                alert(resultado.mensaje || 'Error al actualizar producto')
            }
        } catch (error) {
            console.error('Error al actualizar producto:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando producto...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Editar Producto</h1>
                    <p className={estilos.subtitulo}>Actualiza la información del producto</p>
                </div>
                <button 
                    className={estilos.btnCancelar}
                    onClick={() => router.push('/admin/productos')}
                >
                    <ion-icon name="close-outline"></ion-icon>
                    <span>Cancelar</span>
                </button>
            </div>

            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                <div className={estilos.layoutPrincipal}>
                    <div className={estilos.columnaIzquierda}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="information-circle-outline"></ion-icon>
                                <span>Información General</span>
                            </h3>

                            <div className={estilos.grupoInput}>
                                <label>Nombre del Producto *</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className={estilos.input}
                                    required
                                    placeholder="Ingresa el nombre del producto"
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Descripción</label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className={estilos.textarea}
                                    rows="5"
                                    placeholder="Descripción detallada del producto..."
                                />
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Código de Barras</label>
                                    <input
                                        type="text"
                                        value={codigoBarras}
                                        onChange={(e) => setCodigoBarras(e.target.value)}
                                        className={estilos.input}
                                        placeholder="Código de barras"
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>SKU</label>
                                    <input
                                        type="text"
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value)}
                                        className={estilos.input}
                                        placeholder="SKU"
                                    />
                                </div>
                            </div>

                            <div className={estilos.gridTresColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Categoría</label>
                                    <select
                                        value={categoriaId}
                                        onChange={(e) => setCategoriaId(e.target.value)}
                                        className={estilos.select}
                                    >
                                        <option value="">Sin categoría</option>
                                        {categorias.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Marca</label>
                                    <select
                                        value={marcaId}
                                        onChange={(e) => setMarcaId(e.target.value)}
                                        className={estilos.select}
                                    >
                                        <option value="">Sin marca</option>
                                        {marcas.map(marca => (
                                            <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Unidad Base *</label>
                                    <select
                                        value={unidadMedidaId}
                                        onChange={(e) => setUnidadMedidaId(e.target.value)}
                                        className={estilos.select}
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {unidadesMedida.map(um => (
                                            <option key={um.id} value={um.id}>{um.nombre} ({um.abreviatura})</option>
                                        ))}
                                    </select>
                                    {unidadSeleccionada && (
                                        <div style={{marginTop: '8px', fontSize: '12px', color: '#666', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                            <div>
                                                <span>Tipo de medida: <strong>{unidadSeleccionada.tipo_medida}</strong></span>
                                                <span style={{marginLeft: '12px'}}>
                                                    Tipo de venta: <strong>
                                                        {unidadSeleccionada.tipo_medida === 'peso' ? 'Por peso' : 
                                                         unidadSeleccionada.tipo_medida === 'unidad' ? 'Por unidad' :
                                                         unidadSeleccionada.tipo_medida === 'volumen' ? 'Por volumen' :
                                                         unidadSeleccionada.tipo_medida === 'longitud' ? 'Por longitud' :
                                                         'Otro'}
                                                    </strong>
                                                </span>
                                            </div>
                                            {permiteDecimales && (
                                                <span style={{padding: '2px 8px', background: '#e3f2fd', borderRadius: '4px', color: '#1976d2', display: 'inline-block', width: 'fit-content'}}>
                                                    ✓ Permite cantidades decimales
                                                    {unidadSeleccionada.tipo_medida === 'peso' && ' (obligatorio para peso)'}
                                                </span>
                                            )}
                                            {unidadSeleccionada.tipo_medida === 'peso' && !permiteDecimales && (
                                                <span style={{padding: '2px 8px', background: '#ffebee', borderRadius: '4px', color: '#c62828', display: 'inline-block', width: 'fit-content'}}>
                                                    ⚠ Los productos por peso deben permitir decimales
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="cash-outline"></ion-icon>
                                <span>Precios y Costos</span>
                            </h3>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Precio de Compra *</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>RD$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={precioCompra}
                                            onChange={(e) => setPrecioCompra(e.target.value)}
                                            className={estilos.inputConIcono}
                                            required
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Precio por Unidad (Base) *</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>RD$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={precioPorUnidad || precioVenta}
                                            onChange={(e) => {
                                                const nuevoPrecio = e.target.value
                                                setPrecioPorUnidad(nuevoPrecio)
                                                setPrecioVenta(nuevoPrecio) // Sincronizar
                                            }}
                                            className={estilos.inputConIcono}
                                            required
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <small style={{fontSize: '11px', color: '#666', marginTop: '4px', display: 'block'}}>
                                        Precio en la unidad base del producto
                                        {unidadSeleccionada && ` (${unidadSeleccionada.abreviatura})`}
                                    </small>
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Precio de Venta (Legacy) *</label>
                                <div className={estilos.inputMoneda}>
                                    <span className={estilos.simbolo}>RD$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={precioVenta}
                                        onChange={(e) => {
                                            const nuevoPrecio = e.target.value
                                            setPrecioVenta(nuevoPrecio)
                                            setPrecioPorUnidad(nuevoPrecio) // Sincronizar
                                        }}
                                        className={estilos.inputConIcono}
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                                <small style={{fontSize: '11px', color: '#999', marginTop: '4px', display: 'block'}}>
                                    Se sincroniza automáticamente con precio por unidad
                                </small>
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Precio de Oferta</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>RD$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={precioOferta}
                                            onChange={(e) => setPrecioOferta(e.target.value)}
                                            className={estilos.inputConIcono}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Precio Mayorista</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>RD$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={precioMayorista}
                                            onChange={(e) => setPrecioMayorista(e.target.value)}
                                            className={estilos.inputConIcono}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Cantidad Mínima para Precio Mayorista</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={cantidadMayorista}
                                    onChange={(e) => setCantidadMayorista(e.target.value)}
                                    className={estilos.input}
                                    placeholder="6"
                                />
                            </div>
                        </div>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <span>Control de Inventario</span>
                            </h3>

                            <div className={estilos.gridTresColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Stock Actual</label>
                                    <div className={estilos.inputUnidad}>
                                        <input
                                            type="number"
                                            step={permiteDecimales ? "0.001" : "1"}
                                            min="0"
                                            value={stock}
                                            onChange={(e) => setStock(e.target.value)}
                                            className={estilos.inputConUnidad}
                                            placeholder={permiteDecimales ? "0.000" : "0"}
                                            disabled
                                        />
                                        {unidadSeleccionada && (
                                            <span className={estilos.unidadStock}>
                                                {unidadSeleccionada.abreviatura}
                                            </span>
                                        )}
                                    </div>
                                    <small className={estilos.ayuda}>El stock se modifica desde inventario</small>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Stock Mínimo</label>
                                    <div className={estilos.inputUnidad}>
                                        <input
                                            type="number"
                                            step={permiteDecimales ? "0.001" : "1"}
                                            min="0"
                                            value={stockMinimo}
                                            onChange={(e) => setStockMinimo(e.target.value)}
                                            className={estilos.inputConUnidad}
                                            placeholder={permiteDecimales ? "5.000" : "5"}
                                        />
                                        {unidadSeleccionada && (
                                            <span className={estilos.unidadStock}>
                                                {unidadSeleccionada.abreviatura}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Stock Máximo</label>
                                    <div className={estilos.inputUnidad}>
                                        <input
                                            type="number"
                                            step={permiteDecimales ? "0.001" : "1"}
                                            min="0"
                                            value={stockMaximo}
                                            onChange={(e) => setStockMaximo(e.target.value)}
                                            className={estilos.inputConUnidad}
                                            placeholder={permiteDecimales ? "100.000" : "100"}
                                        />
                                        {unidadSeleccionada && (
                                            <span className={estilos.unidadStock}>
                                                {unidadSeleccionada.abreviatura}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {unidadMedidaId && unidadesMedida.length > 0 && (
                                <div className={estilos.grupoInput}>
                                    <label>Unidad de Venta por Defecto</label>
                                    <select
                                        value={unidadVentaDefaultId || unidadMedidaId}
                                        onChange={(e) => setUnidadVentaDefaultId(e.target.value)}
                                        className={estilos.select}
                                    >
                                        {unidadesMedida
                                            .filter(um => 
                                                um.tipo_medida === tipoMedidaSeleccionado || 
                                                um.id === parseInt(unidadMedidaId)
                                            )
                                            .map(um => (
                                                <option key={um.id} value={um.id}>
                                                    {um.nombre} ({um.abreviatura})
                                                </option>
                                            ))}
                                    </select>
                                    <small style={{fontSize: '11px', color: '#666', marginTop: '4px', display: 'block'}}>
                                        Unidad que se mostrará por defecto al vender este producto
                                    </small>
                                </div>
                            )}

                            <div className={estilos.grupoConfig}>
                                <label className={estilos.switchLabel}>
                                    <input
                                        type="checkbox"
                                        checked={permiteDecimales}
                                        onChange={(e) => {
                                            // RF-002.3: No permitir desactivar decimales si es producto por peso
                                            if (tipoMedidaSeleccionado === 'peso' && !e.target.checked) {
                                                alert('Los productos por peso deben permitir cantidades decimales obligatoriamente')
                                                return
                                            }
                                            setPermiteDecimales(e.target.checked)
                                        }}
                                        className={estilos.switchInput}
                                        disabled={tipoMedidaSeleccionado === 'peso'} // RF-002.3: Obligatorio para peso
                                    />
                                    <span className={estilos.switchSlider}></span>
                                    <span className={estilos.switchTexto}>
                                        Permite cantidades decimales
                                        {tipoMedidaSeleccionado === 'peso' && (
                                            <span style={{fontSize: '11px', color: '#c62828', marginLeft: '8px', fontWeight: 'bold'}}>
                                                (Obligatorio para productos por peso)
                                            </span>
                                        )}
                                        {tipoMedidaSeleccionado && ['volumen', 'longitud', 'area'].includes(tipoMedidaSeleccionado) && tipoMedidaSeleccionado !== 'peso' && (
                                            <span style={{fontSize: '11px', color: '#666', marginLeft: '8px'}}>
                                                (Recomendado para {tipoMedidaSeleccionado})
                                            </span>
                                        )}
                                        {tipoMedidaSeleccionado === 'unidad' && (
                                            <span style={{fontSize: '11px', color: '#666', marginLeft: '8px'}}>
                                                (Opcional para productos por unidad)
                                            </span>
                                        )}
                                    </span>
                                </label>
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Fecha de Vencimiento</label>
                                    <input
                                        type="date"
                                        value={fechaVencimiento}
                                        onChange={(e) => setFechaVencimiento(e.target.value)}
                                        className={estilos.input}
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Número de Lote</label>
                                    <input
                                        type="text"
                                        value={lote}
                                        onChange={(e) => setLote(e.target.value)}
                                        className={estilos.input}
                                        placeholder="LOTE-2024-001"
                                    />
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Ubicación en Bodega</label>
                                <input
                                    type="text"
                                    value={ubicacionBodega}
                                    onChange={(e) => setUbicacionBodega(e.target.value)}
                                    className={estilos.input}
                                    placeholder="Ej: Pasillo 3, Estante A, Nivel 2"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={estilos.columnaDerecha}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="image-outline"></ion-icon>
                                <span>Imagen del Producto</span>
                            </h3>

                            <div className={estilos.selectorTipo}>
                                <button
                                    type="button"
                                    className={`${estilos.btnTipo} ${tipoImagen === 'url' ? estilos.activo : ''}`}
                                    onClick={() => manejarCambioTipoImagen('url')}
                                >
                                    <ion-icon name="link-outline"></ion-icon>
                                    <span>URL</span>
                                </button>
                                <button
                                    type="button"
                                    className={`${estilos.btnTipo} ${tipoImagen === 'local' ? estilos.activo : ''}`}
                                    onClick={() => manejarCambioTipoImagen('local')}
                                >
                                    <ion-icon name="cloud-upload-outline"></ion-icon>
                                    <span>Subir</span>
                                </button>
                            </div>

                            {tipoImagen === 'url' ? (
                                <div className={estilos.grupoInput}>
                                    <label>URL de la Imagen</label>
                                    <input
                                        type="url"
                                        value={imagenUrl}
                                        onChange={manejarCambioImagenUrl}
                                        className={estilos.input}
                                        placeholder={imagenUrlOriginal || "https://ejemplo.com/imagen.jpg"}
                                    />
                                    {imagenUrlOriginal && !imagenUrl.trim() && (
                                        <small style={{fontSize: '11px', color: '#0ea5e9', marginTop: '4px', display: 'block'}}>
                                            ℹ️ La imagen actual se mantendrá si no ingresas una nueva URL
                                        </small>
                                    )}
                                </div>
                            ) : (
                                <div className={estilos.grupoInput}>
                                    <label>Seleccionar Archivo (máx. 5MB)</label>
                                    <div className={estilos.contenedorArchivo}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={manejarCambioImagen}
                                            className={estilos.inputFile}
                                            id="archivo-imagen"
                                        />
                                        <label htmlFor="archivo-imagen" className={estilos.labelArchivo}>
                                            <ion-icon name="cloud-upload-outline"></ion-icon>
                                            <span>Seleccionar imagen</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {vistaPrevia && (
                                <div className={estilos.vistaPrevia}>
                                    <label>Vista Previa</label>
                                    <div className={estilos.contenedorImagen}>
                                        <img src={vistaPrevia} alt="Vista previa" />
                                        <button
                                            type="button"
                                            className={estilos.btnEliminarImagen}
                                            onClick={() => {
                                                if (confirm('¿Estás seguro de que deseas eliminar la imagen del producto?')) {
                                                    setVistaPrevia(null)
                                                    setImagenUrl('')
                                                    setImagenArchivo(null)
                                                    setImagenUrlOriginal(null) // Marcar que se eliminó intencionalmente
                                                }
                                            }}
                                        >
                                            <ion-icon name="close-circle"></ion-icon>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="settings-outline"></ion-icon>
                                <span>Configuración</span>
                            </h3>

                            <div className={estilos.grupoConfig}>
                                <label className={estilos.switchLabel}>
                                    <input
                                        type="checkbox"
                                        checked={aplicaItbis}
                                        onChange={(e) => setAplicaItbis(e.target.checked)}
                                        className={estilos.switchInput}
                                    />
                                    <span className={estilos.switchSlider}></span>
                                    <span className={estilos.switchTexto}>Aplica ITBIS (18%)</span>
                                </label>
                            </div>

                            <div className={estilos.grupoConfig}>
                                <label className={estilos.switchLabel}>
                                    <input
                                        type="checkbox"
                                        checked={activo}
                                        onChange={(e) => setActivo(e.target.checked)}
                                        className={estilos.switchInput}
                                    />
                                    <span className={estilos.switchSlider}></span>
                                    <span className={estilos.switchTexto}>Producto Activo</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={estilos.footerFormulario}>
                    <button
                        type="button"
                        onClick={() => router.push('/admin/productos')}
                        className={estilos.btnCancelarForm}
                        disabled={procesando}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>Cancelar</span>
                    </button>
                    <button
                        type="submit"
                        className={estilos.btnGuardar}
                        disabled={procesando}
                    >
                        {procesando ? (
                            <>
                                <ion-icon name="hourglass-outline"></ion-icon>
                                <span>Actualizando...</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>Actualizar Producto</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}