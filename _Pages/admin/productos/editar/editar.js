"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerProducto, actualizarProducto } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './editar.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function EditarProductoAdmin({ returnPath = '/admin/productos' }) {
    const router = useRouter()
    const params = useParams()
    const productoId = params.id
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    
    const [categorias, setCategorias] = useState([])
    const [marcas, setMarcas] = useState([])
    const [unidadesMedida, setUnidadesMedida] = useState([])
    const [configuracion, setConfiguracion] = useState({ simbolo_moneda: 'RD$' })
    
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
    const [imagenUrlOriginal, setImagenUrlOriginal] = useState(null)
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

    useEffect(() => {
        if (unidadMedidaId && unidadesMedida.length > 0) {
            const unidad = unidadesMedida.find(um => um.id === parseInt(unidadMedidaId))
            if (unidad) {
                setUnidadSeleccionada(unidad)
                setTipoMedidaSeleccionado(unidad.tipo_medida)
                
                if (unidad.tipo_medida === 'peso') {
                    setPermiteDecimales(true)
                } else if (['volumen', 'longitud', 'area'].includes(unidad.tipo_medida)) {
                    if (permiteDecimales === false && unidad.permite_decimales) {
                        setPermiteDecimales(true)
                    }
                }
                
                if (!unidadVentaDefaultId) {
                    setUnidadVentaDefaultId(unidadMedidaId)
                }
            }
        } else {
            setUnidadSeleccionada(null)
            setTipoMedidaSeleccionado(null)
        }
    }, [unidadMedidaId, unidadesMedida])

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
                if (resultado.configuracion) setConfiguracion(resultado.configuracion)
                
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
                        setImagenArchivo(null)
                        setImagenUrlOriginal(null)
                    } else {
                        setTipoImagen('url')
                        setImagenUrl(producto.imagen_url)
                        setImagenUrlOriginal(producto.imagen_url)
                        setVistaPrevia(producto.imagen_url)
                        setImagenArchivo(null)
                    }
                } else {
                    setTipoImagen('url')
                    setImagenUrl('')
                    setImagenArchivo(null)
                    setVistaPrevia(null)
                    setImagenUrlOriginal(null)
                }
            } else {
                alert(resultado.mensaje || tr('Error al cargar producto', 'Error loading product'))
                router.push(returnPath)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
            router.push(returnPath)
        } finally {
            setCargando(false)
        }
    }

    const manejarCambioTipoImagen = (tipo) => {
        const tipoAnterior = tipoImagen
        setTipoImagen(tipo)
        
        if (tipo === 'url') {
            if (tipoAnterior === 'local' && imagenUrlOriginal) {
                setImagenUrl(imagenUrlOriginal)
                setVistaPrevia(imagenUrlOriginal)
            } else if (!imagenUrl && imagenUrlOriginal) {
                setImagenUrl(imagenUrlOriginal)
                setVistaPrevia(imagenUrlOriginal)
            } else if (imagenUrl) {
                setVistaPrevia(imagenUrl)
            } else {
                setVistaPrevia(null)
            }
            setImagenArchivo(null)
        } else {
            setImagenArchivo(null)
        }
    }

    const manejarCambioImagen = (e) => {
        const archivo = e.target.files?.[0]
        if (!archivo) return

        const maxSize = 5 * 1024 * 1024

        if (archivo.size > maxSize) {
            alert(tr('La imagen no debe superar los 5MB. Tu archivo pesa: ', 'Image must not exceed 5MB. Your file size is: ') + (archivo.size / 1024 / 1024).toFixed(2) + 'MB')
            e.target.value = ''
            setImagenArchivo(null)
            setVistaPrevia(null)
            return
        }

        if (!archivo.type.startsWith('image/')) {
            alert(tr('Por favor selecciona un archivo de imagen válido', 'Please select a valid image file'))
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
        if (url.trim()) {
            setVistaPrevia(url)
        } else if (imagenUrlOriginal) {
            setVistaPrevia(imagenUrlOriginal)
        } else {
            setVistaPrevia(null)
        }
    }

    const validarFormulario = () => {
        if (!nombre.trim()) {
            alert(tr('El nombre del producto es obligatorio', 'Product name is required'))
            return false
        }

        if (!precioCompra || parseFloat(precioCompra) < 0) {
            alert(tr('El precio de compra debe ser mayor o igual a 0', 'Purchase price must be greater than or equal to 0'))
            return false
        }

        const precioPorUnidadFinal = parseFloat(precioPorUnidad || precioVenta)
        if (!precioPorUnidadFinal || precioPorUnidadFinal <= 0) {
            alert(tr('El precio por unidad debe ser mayor a 0', 'Unit price must be greater than 0'))
            return false
        }

        if (parseFloat(precioVenta) < parseFloat(precioCompra)) {
            if (!confirm(tr('El precio de venta es menor que el precio de compra. ¿Deseas continuar?', 'Sale price is lower than purchase price. Do you want to continue?'))) {
                return false
            }
        }

        if (!unidadMedidaId) {
            alert(tr('Selecciona una unidad de medida base', 'Select a base unit of measure'))
            return false
        }

        const unidadSeleccionadaValidacion = unidadesMedida.find(um => um.id === parseInt(unidadMedidaId))
        if (!unidadSeleccionadaValidacion) {
            alert(tr('La unidad de medida seleccionada no existe', 'Selected unit of measure does not exist'))
            return false
        }

        if (tipoMedidaSeleccionado === 'peso') {
            if (!permiteDecimales) {
                alert(tr('Los productos por peso deben permitir cantidades decimales obligatoriamente', 'Products sold by weight must allow decimal quantities'))
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
                router.push(returnPath)
            } else {
                alert(resultado.mensaje || tr('Error al actualizar producto', 'Error updating product'))
            }
        } catch (error) {
            console.error('Error al actualizar producto:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) {
        return <LoadingScreen />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Editar Producto', 'Edit Product')}</h1>
                    <p className={estilos.subtitulo}>{tr('Actualiza la información del producto', 'Update product information')}</p>
                </div>
                <button 
                    className={estilos.btnCancelar}
                    onClick={() => router.push(returnPath)}
                >
                    <ion-icon name="close-outline"></ion-icon>
                    <span>{tr('Cancelar', 'Cancel')}</span>
                </button>
            </div>

            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                <div className={estilos.layoutPrincipal}>
                    <div className={estilos.columnaIzquierda}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="information-circle-outline"></ion-icon>
                                <span>{tr('Información General', 'General Information')}</span>
                            </h3>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Nombre del Producto *', 'Product Name *')}</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className={estilos.input}
                                    required
                                    placeholder={tr('Ingresa el nombre del producto', 'Enter product name')}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Descripción', 'Description')}</label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className={estilos.textarea}
                                    rows="5"
                                    placeholder={tr('Descripción detallada del producto...', 'Detailed product description...')}
                                />
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Código de Barras', 'Barcode')}</label>
                                    <input
                                        type="text"
                                        value={codigoBarras}
                                        onChange={(e) => setCodigoBarras(e.target.value)}
                                        className={estilos.input}
                                        placeholder={tr('Código de barras', 'Barcode')}
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
                                    <label>{tr('Categoría', 'Category')}</label>
                                    <select
                                        value={categoriaId}
                                        onChange={(e) => setCategoriaId(e.target.value)}
                                        className={estilos.select}
                                    >
                                        <option value="">{tr('Sin categoría', 'No category')}</option>
                                        {categorias.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>{tr('Marca', 'Brand')}</label>
                                    <select
                                        value={marcaId}
                                        onChange={(e) => setMarcaId(e.target.value)}
                                        className={estilos.select}
                                    >
                                        <option value="">{tr('Sin marca', 'No brand')}</option>
                                        {marcas.map(marca => (
                                            <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>{tr('Unidad Base *', 'Base Unit *')}</label>
                                    <select
                                        value={unidadMedidaId}
                                        onChange={(e) => setUnidadMedidaId(e.target.value)}
                                        className={estilos.select}
                                        required
                                    >
                                        <option value="">{tr('Seleccionar', 'Select')}</option>
                                        {unidadesMedida.map(um => (
                                            <option key={um.id} value={um.id}>{um.nombre} ({um.abreviatura})</option>
                                        ))}
                                    </select>
                                    {unidadSeleccionada && (
                                        <div style={{marginTop: '8px', fontSize: '12px', color: '#666', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                            <div>
                                                <span>{tr('Tipo de medida:', 'Measure type:')} <strong>{unidadSeleccionada.tipo_medida}</strong></span>
                                                <span style={{marginLeft: '12px'}}>
                                                    {tr('Tipo de venta:', 'Sale type:')} <strong>
                                                        {unidadSeleccionada.tipo_medida === 'peso' ? tr('Por peso', 'By weight') : 
                                                         unidadSeleccionada.tipo_medida === 'unidad' ? tr('Por unidad', 'By unit') :
                                                         unidadSeleccionada.tipo_medida === 'volumen' ? tr('Por volumen', 'By volume') :
                                                         unidadSeleccionada.tipo_medida === 'longitud' ? tr('Por longitud', 'By length') :
                                                         tr('Otro', 'Other')}
                                                    </strong>
                                                </span>
                                            </div>
                                            {permiteDecimales && (
                                                <span style={{padding: '2px 8px', background: '#e3f2fd', borderRadius: '4px', color: '#1976d2', display: 'inline-block', width: 'fit-content'}}>
                                                    {tr('Permite cantidades decimales', 'Allows decimal quantities')}
                                                    {unidadSeleccionada.tipo_medida === 'peso' && tr(' (obligatorio para peso)', ' (required for weight)')}
                                                </span>
                                            )}
                                            {unidadSeleccionada.tipo_medida === 'peso' && !permiteDecimales && (
                                                <span style={{padding: '2px 8px', background: '#ffebee', borderRadius: '4px', color: '#c62828', display: 'inline-block', width: 'fit-content'}}>
                                                    {tr('Los productos por peso deben permitir decimales', 'Products sold by weight must allow decimals')}
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
                                <span>{tr('Precios y Costos', 'Pricing and Costs')}</span>
                            </h3>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Precio de Compra *', 'Purchase Price *')}</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>{configuracion?.simbolo_moneda || 'RD$'}</span>
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
                                    <label>{tr('Precio por Unidad (Base) *', 'Price per Unit (Base) *')}</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>{configuracion?.simbolo_moneda || 'RD$'}</span>
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
                                        {tr('Precio en la unidad base del producto', 'Price in the base unit of the product')}
                                        {unidadSeleccionada && ` (${unidadSeleccionada.abreviatura})`}
                                    </small>
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Precio de Venta (Legacy) *', 'Sale Price (Legacy) *')}</label>
                                <div className={estilos.inputMoneda}>
                                    <span className={estilos.simbolo}>{configuracion?.simbolo_moneda || 'RD$'}</span>
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
                                    {tr('Se sincroniza automáticamente con precio por unidad', 'It syncs automatically with unit price')}
                                </small>
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Precio de Oferta', 'Offer Price')}</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>{configuracion?.simbolo_moneda || 'RD$'}</span>
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
                                    <label>{tr('Precio Mayorista', 'Wholesale Price')}</label>
                                    <div className={estilos.inputMoneda}>
                                        <span className={estilos.simbolo}>{configuracion?.simbolo_moneda || 'RD$'}</span>
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
                                <label>{tr('Cantidad Mínima para Precio Mayorista', 'Minimum Quantity for Wholesale Price')}</label>
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
                                <span>{tr('Control de Inventario', 'Inventory Control')}</span>
                            </h3>

                            <div className={estilos.gridTresColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Stock Actual', 'Current Stock')}</label>
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
                                    <small className={estilos.ayuda}>{tr('El stock se modifica desde inventario', 'Stock is modified from inventory')}</small>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>{tr('Stock Mínimo', 'Minimum Stock')}</label>
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
                                    <label>{tr('Stock Máximo', 'Maximum Stock')}</label>
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
                                    <label>{tr('Unidad de Venta por Defecto', 'Default Sale Unit')}</label>
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
                                        {tr('Unidad que se mostrará por defecto al vender este producto', 'Unit shown by default when selling this product')}
                                    </small>
                                </div>
                            )}

                            <div className={estilos.grupoConfig}>
                                <label className={estilos.switchLabel}>
                                    <input
                                        type="checkbox"
                                        checked={permiteDecimales}
                                        onChange={(e) => {
                                            if (tipoMedidaSeleccionado === 'peso' && !e.target.checked) {
                                                alert(tr('Los productos por peso deben permitir cantidades decimales obligatoriamente', 'Products sold by weight must allow decimal quantities'))
                                                return
                                            }
                                            setPermiteDecimales(e.target.checked)
                                        }}
                                        className={estilos.switchInput}
                                        disabled={tipoMedidaSeleccionado === 'peso'}
                                    />
                                    <span className={estilos.switchSlider}></span>
                                    <span className={estilos.switchTexto}>
                                        {tr('Permite cantidades decimales', 'Allows decimal quantities')}
                                        {tipoMedidaSeleccionado === 'peso' && (
                                            <span style={{fontSize: '11px', color: '#c62828', marginLeft: '8px', fontWeight: 'bold'}}>
                                                {tr('(Obligatorio para productos por peso)', '(Required for products sold by weight)')}
                                            </span>
                                        )}
                                        {tipoMedidaSeleccionado && ['volumen', 'longitud', 'area'].includes(tipoMedidaSeleccionado) && tipoMedidaSeleccionado !== 'peso' && (
                                            <span style={{fontSize: '11px', color: '#666', marginLeft: '8px'}}>
                                                {tr(`(Recomendado para ${tipoMedidaSeleccionado})`, `(Recommended for ${tipoMedidaSeleccionado})`)}
                                            </span>
                                        )}
                                        {tipoMedidaSeleccionado === 'unidad' && (
                                            <span style={{fontSize: '11px', color: '#666', marginLeft: '8px'}}>
                                                {tr('(Opcional para productos por unidad)', '(Optional for products sold by unit)')}
                                            </span>
                                        )}
                                    </span>
                                </label>
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Fecha de Vencimiento', 'Expiration Date')}</label>
                                    <input
                                        type="date"
                                        value={fechaVencimiento}
                                        onChange={(e) => setFechaVencimiento(e.target.value)}
                                        className={estilos.input}
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>{tr('Número de Lote', 'Batch Number')}</label>
                                    <input
                                        type="text"
                                        value={lote}
                                        onChange={(e) => setLote(e.target.value)}
                                        className={estilos.input}
                                        placeholder={tr('LOTE-2024-001', 'BATCH-2024-001')}
                                    />
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>{tr('Ubicación en Bodega', 'Warehouse Location')}</label>
                                <input
                                    type="text"
                                    value={ubicacionBodega}
                                    onChange={(e) => setUbicacionBodega(e.target.value)}
                                    className={estilos.input}
                                    placeholder={tr('Ej: Pasillo 3, Estante A, Nivel 2', 'Ex: Aisle 3, Shelf A, Level 2')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={estilos.columnaDerecha}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="image-outline"></ion-icon>
                                <span>{tr('Imagen del Producto', 'Product Image')}</span>
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
                                    <span>{tr('Subir', 'Upload')}</span>
                                </button>
                            </div>

                            {tipoImagen === 'url' ? (
                                <div className={estilos.grupoInput}>
                                    <label>{tr('URL de la Imagen', 'Image URL')}</label>
                                    <input
                                        type="url"
                                        value={imagenUrl}
                                        onChange={manejarCambioImagenUrl}
                                        className={estilos.input}
                                        placeholder={imagenUrlOriginal || tr('https://ejemplo.com/imagen.jpg', 'https://example.com/image.jpg')}
                                    />
                                    {imagenUrlOriginal && !imagenUrl.trim() && (
                                        <small style={{fontSize: '11px', color: '#0ea5e9', marginTop: '4px', display: 'block'}}>
                                            {tr('La imagen actual se mantendrá si no ingresas una nueva URL', 'Current image will be kept if you do not enter a new URL')}
                                        </small>
                                    )}
                                </div>
                            ) : (
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Seleccionar Archivo (máx. 5MB)', 'Select File (max. 5MB)')}</label>
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
                                            <span>{tr('Seleccionar imagen', 'Select image')}</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {vistaPrevia && (
                                <div className={estilos.vistaPrevia}>
                                    <label>{tr('Vista Previa', 'Preview')}</label>
                                    <div className={estilos.contenedorImagen}>
                                        <img src={vistaPrevia} alt={tr('Vista previa', 'Preview')} />
                                        <button
                                            type="button"
                                            className={estilos.btnEliminarImagen}
                                            onClick={() => {
                                                if (confirm(tr('¿Estás seguro de que deseas eliminar la imagen del producto?', 'Are you sure you want to remove the product image?'))) {
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
                                <span>{tr('Configuración', 'Settings')}</span>
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
                                    <span className={estilos.switchTexto}>{tr('Aplica ITBIS (18%)', 'Apply ITBIS (18%)')}</span>
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
                                    <span className={estilos.switchTexto}>{tr('Producto Activo', 'Active Product')}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={estilos.footerFormulario}>
                    <button
                        type="button"
                        onClick={() => router.push(returnPath)}
                        className={estilos.btnCancelarForm}
                        disabled={procesando}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>{tr('Cancelar', 'Cancel')}</span>
                    </button>
                    <button
                        type="submit"
                        className={estilos.btnGuardar}
                        disabled={procesando}
                    >
                        {procesando ? (
                            <>
                                <ion-icon name="hourglass-outline"></ion-icon>
                                <span>{tr('Actualizando...', 'Updating...')}</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>{tr('Actualizar Producto', 'Update Product')}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}