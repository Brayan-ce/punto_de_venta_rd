"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerDatosFormulario, crearCompra, proximoNcf } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './nuevo.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function NuevaCompra() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [proveedores, setProveedores] = useState([])
    const [productos, setProductos] = useState([])
    const [tiposComprobante, setTiposComprobante] = useState([])
    const [busquedaProducto, setBusquedaProducto] = useState('')
    const [mostrarListaProductos, setMostrarListaProductos] = useState(false)

    const [tipoComprobanteId, setTipoComprobanteId] = useState('')
    const [ncf, setNcf] = useState('')
    const [proveedorId, setProveedorId] = useState('')
    const [metodoPago, setMetodoPago] = useState('efectivo')
    const [notas, setNotas] = useState('')
    const [productosSeleccionados, setProductosSeleccionados] = useState([])

    const [nombreProductoNuevo, setNombreProductoNuevo] = useState('')
    const [cantidadProductoNuevo, setCantidadProductoNuevo] = useState('')
    const [precioProductoNuevo, setPrecioProductoNuevo] = useState('')

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
            const resultado = await obtenerDatosFormulario()
            if (resultado.success) {
                setProveedores(resultado.proveedores)
                setProductos(resultado.productos)
                setTiposComprobante(resultado.tiposComprobante)
            } else {
                alert(resultado.mensaje || tr('Error al cargar datos', 'Error loading data'))
                router.push('/admin/compras')
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
            router.push('/admin/compras')
        } finally {
            setCargando(false)
        }
    }

    const agregarProductoExistente = (producto) => {
        const yaExiste = productosSeleccionados.find(p => p.id === producto.id)
        if (yaExiste) {
            alert(tr('Este producto ya esta agregado', 'This product is already added'))
            return
        }

        setProductosSeleccionados([...productosSeleccionados, {
            id: producto.id,
            nombre: producto.nombre,
            precio_compra: Number(producto.precio_compra),
            cantidad: 1,
            subtotal: Number(producto.precio_compra),
            esNuevo: false
        }])
        setBusquedaProducto('')
        setMostrarListaProductos(false)
    }

    const agregarProductoNuevo = () => {
        if (!nombreProductoNuevo.trim()) {
            alert(tr('Ingresa el nombre del producto', 'Enter product name'))
            return
        }

        if (!cantidadProductoNuevo || parseInt(cantidadProductoNuevo) <= 0) {
            alert(tr('Ingresa una cantidad valida', 'Enter a valid quantity'))
            return
        }

        if (!precioProductoNuevo || parseFloat(precioProductoNuevo) <= 0) {
            alert(tr('Ingresa un precio valido', 'Enter a valid price'))
            return
        }

        const yaExiste = productosSeleccionados.find(p => 
            p.nombre.toLowerCase() === nombreProductoNuevo.trim().toLowerCase()
        )

        if (yaExiste) {
            alert(tr('Ya existe un producto con ese nombre en la lista', 'A product with that name already exists in the list'))
            return
        }

        const productoEnCatalogo = productos.find(p => 
            p.nombre.toLowerCase() === nombreProductoNuevo.trim().toLowerCase()
        )

        if (productoEnCatalogo) {
            if (confirm(tr(`El producto "${nombreProductoNuevo}" ya existe en el catalogo. Deseas actualizar su informacion?`, `The product "${nombreProductoNuevo}" already exists in the catalog. Do you want to update its information?`))) {
                setProductosSeleccionados([...productosSeleccionados, {
                    id: productoEnCatalogo.id,
                    nombre: nombreProductoNuevo.trim(),
                    precio_compra: parseFloat(precioProductoNuevo),
                    cantidad: parseInt(cantidadProductoNuevo),
                    subtotal: parseFloat(precioProductoNuevo) * parseInt(cantidadProductoNuevo),
                    esNuevo: false,
                    actualizar: true
                }])
            } else {
                return
            }
        } else {
            setProductosSeleccionados([...productosSeleccionados, {
                id: null,
                nombre: nombreProductoNuevo.trim(),
                precio_compra: parseFloat(precioProductoNuevo),
                cantidad: parseInt(cantidadProductoNuevo),
                subtotal: parseFloat(precioProductoNuevo) * parseInt(cantidadProductoNuevo),
                esNuevo: true
            }])
        }

        setNombreProductoNuevo('')
        setCantidadProductoNuevo('')
        setPrecioProductoNuevo('')
    }

    const actualizarCantidad = (index, cantidad) => {
        if (cantidad < 1) return

        setProductosSeleccionados(productosSeleccionados.map((p, i) => {
            if (i === index) {
                return {
                    ...p,
                    cantidad: cantidad,
                    subtotal: p.precio_compra * cantidad
                }
            }
            return p
        }))
    }

    const actualizarPrecio = (index, precio) => {
        if (precio < 0) return

        setProductosSeleccionados(productosSeleccionados.map((p, i) => {
            if (i === index) {
                return {
                    ...p,
                    precio_compra: precio,
                    subtotal: precio * p.cantidad
                }
            }
            return p
        }))
    }

    const eliminarProducto = (index) => {
        setProductosSeleccionados(productosSeleccionados.filter((p, i) => i !== index))
    }

    const generarNcf = async (tipoId) => {
        if (!tipoId) {
            setNcf('')
            return
        }
        try {
            const resultado = await proximoNcf(tipoId)
            if (resultado.success) setNcf(resultado.ncf)
        } catch (error) {
            console.error('Error al generar NCF:', error)
        }
    }

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.codigo_barras?.toLowerCase().includes(busquedaProducto.toLowerCase())
    )

    const calcularTotales = () => {
        const subtotal = productosSeleccionados.reduce((sum, p) => sum + Number(p.subtotal), 0)
        const itbis = subtotal * 0.18
        const total = subtotal + itbis
        return { subtotal, itbis, total }
    }

    const validarFormulario = () => {
        if (!tipoComprobanteId) {
            alert(tr('Selecciona un tipo de comprobante', 'Select a voucher type'))
            return false
        }

        if (!ncf.trim()) {
            alert(tr('Ingresa el NCF', 'Enter NCF'))
            return false
        }

        if (!proveedorId) {
            alert(tr('Selecciona un proveedor', 'Select a supplier'))
            return false
        }

        if (productosSeleccionados.length === 0) {
            alert(tr('Agrega al menos un producto', 'Add at least one product'))
            return false
        }

        return true
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) return

        setProcesando(true)
        try {
            const totales = calcularTotales()
            
            const datosCompra = {
                tipo_comprobante_id: parseInt(tipoComprobanteId),
                ncf: ncf.trim(),
                proveedor_id: parseInt(proveedorId),
                subtotal: totales.subtotal,
                itbis: totales.itbis,
                total: totales.total,
                metodo_pago: metodoPago,
                notas: notas.trim() || null,
                productos: productosSeleccionados.map(p => ({
                    producto_id: p.id,
                    nombre: p.nombre,
                    cantidad: p.cantidad,
                    precio_unitario: p.precio_compra,
                    subtotal: p.subtotal,
                    esNuevo: p.esNuevo
                }))
            }

            const resultado = await crearCompra(datosCompra)
            if (resultado.success) {
                alert(resultado.mensaje)
                router.push('/admin/compras')
            } else {
                alert(resultado.mensaje || tr('Error al crear compra', 'Error creating purchase'))
            }
        } catch (error) {
            console.error('Error al crear compra:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const totales = calcularTotales()

    if (cargando) {
        return <LoadingScreen />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Nueva Compra', 'New Purchase')}</h1>
                    <p className={estilos.subtitulo}>{tr('Registra una nueva compra a proveedor', 'Register a new supplier purchase')}</p>
                </div>
                <button
                    type="button"
                    onClick={() => router.push('/admin/compras')}
                    className={estilos.btnCancelar}
                    disabled={procesando}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>{tr('Volver', 'Back')}</span>
                </button>
            </div>

            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                <div className={estilos.fila}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Informacion de la Compra', 'Purchase Information')}</h2>

                        <div className={estilos.grid}>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Tipo de Comprobante *', 'Voucher Type *')}</label>
                                <select
                                    value={tipoComprobanteId}
                                    onChange={(e) => {
                                        setTipoComprobanteId(e.target.value)
                                        generarNcf(e.target.value)
                                    }}
                                    className={estilos.select}
                                    required
                                    disabled={procesando}
                                >
                                    <option value="">{tr('Seleccionar...', 'Select...')}</option>
                                    {tiposComprobante.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>NCF *</label>
                                <div className={estilos.inputWrapper}>
                                <input
                                    type="text"
                                    value={ncf}
                                    onChange={(e) => setNcf(e.target.value)}
                                    className={estilos.input}
                                    required
                                    disabled={procesando}
                                    placeholder="B0100000001"
                                />
                                {ncf && (
                                    <button
                                        type="button"
                                        className={estilos.btnX}
                                        onClick={() => setNcf('')}
                                        disabled={procesando}
                                        title={tr('Limpiar NCF', 'Clear NCF')}
                                    >
                                        <ion-icon name="close-outline"></ion-icon>
                                    </button>
                                )}
                            </div>
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>{tr('Proveedor *', 'Supplier *')}</label>
                            <select
                                value={proveedorId}
                                onChange={(e) => setProveedorId(e.target.value)}
                                className={estilos.select}
                                required
                                disabled={procesando}
                            >
                                <option value="">{tr('Seleccionar...', 'Select...')}</option>
                                {proveedores.map(prov => (
                                    <option key={prov.id} value={prov.id}>{prov.nombre_comercial}</option>
                                ))}
                            </select>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>{tr('Metodo de Pago *', 'Payment Method *')}</label>
                            <select
                                value={metodoPago}
                                onChange={(e) => setMetodoPago(e.target.value)}
                                className={estilos.select}
                                required
                                disabled={procesando}
                            >
                                <option value="efectivo">{tr('Efectivo', 'Cash')}</option>
                                <option value="tarjeta_debito">{tr('Tarjeta Debito', 'Debit Card')}</option>
                                <option value="tarjeta_credito">{tr('Tarjeta Credito', 'Credit Card')}</option>
                                <option value="transferencia">{tr('Transferencia', 'Transfer')}</option>
                                <option value="cheque">{tr('Cheque', 'Check')}</option>
                                <option value="mixto">{tr('Mixto', 'Mixed')}</option>
                            </select>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>{tr('Notas', 'Notes')}</label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                className={estilos.textarea}
                                disabled={procesando}
                                placeholder={tr('Observaciones adicionales...', 'Additional notes...')}
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Totales', 'Totals')}</h2>
                        
                        <div className={estilos.totales}>
                            <div className={estilos.totalItem}>
                                <span>Subtotal:</span>
                                <span>{formatearMoneda(totales.subtotal)}</span>
                            </div>
                            <div className={estilos.totalItem}>
                                <span>ITBIS (18%):</span>
                                <span>{formatearMoneda(totales.itbis)}</span>
                            </div>
                            <div className={`${estilos.totalItem} ${estilos.totalFinal}`}>
                                <span>Total:</span>
                                <span>{formatearMoneda(totales.total)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={estilos.btnGuardar}
                            disabled={procesando || productosSeleccionados.length === 0}
                        >
                            {procesando ? tr('Procesando...', 'Processing...') : tr('Registrar Compra', 'Register Purchase')}
                        </button>
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <h2 className={estilos.panelTitulo}>{tr('Agregar Productos', 'Add Products')}</h2>

                    <div className={estilos.seccionesProductos}>
                        <div className={estilos.seccion}>
                            <h3 className={estilos.seccionTitulo}>{tr('Buscar del Catalogo', 'Search Catalog')}</h3>
                            <div className={estilos.busquedaProducto}>
                                <ion-icon name="search-outline"></ion-icon>
                                <input
                                    type="text"
                                    placeholder={tr('Buscar producto existente...', 'Search existing product...')}
                                    value={busquedaProducto}
                                    onChange={(e) => {
                                        setBusquedaProducto(e.target.value)
                                        setMostrarListaProductos(e.target.value.length > 0)
                                    }}
                                    onFocus={() => busquedaProducto && setMostrarListaProductos(true)}
                                    className={estilos.inputBusqueda}
                                    disabled={procesando}
                                />

                                {mostrarListaProductos && productosFiltrados.length > 0 && (
                                    <div className={`${estilos.listaProductos} ${estilos[tema]}`}>
                                        {productosFiltrados.slice(0, 10).map(producto => (
                                            <button
                                                key={producto.id}
                                                type="button"
                                                className={estilos.productoItem}
                                                onClick={() => agregarProductoExistente(producto)}
                                            >
                                                <span className={estilos.productoNombre}>{producto.nombre}</span>
                                                <span className={estilos.productoPrecio}>{formatearMoneda(producto.precio_compra)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={estilos.divisor}>
                            <span>{tr('O', 'OR')}</span>
                        </div>

                        <div className={estilos.seccion}>
                            <h3 className={estilos.seccionTitulo}>{tr('Agregar Producto Nuevo', 'Add New Product')}</h3>
                            <div className={estilos.formProductoNuevo}>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Nombre del Producto', 'Product Name')}</label>
                                    <input
                                        type="text"
                                        value={nombreProductoNuevo}
                                        onChange={(e) => setNombreProductoNuevo(e.target.value)}
                                        className={estilos.input}
                                        disabled={procesando}
                                        placeholder={tr('Ej: Aceite de Oliva', 'Ex: Olive Oil')}
                                    />
                                </div>
                                <div className={estilos.gridNuevo}>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Cantidad', 'Quantity')}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={cantidadProductoNuevo}
                                            onChange={(e) => setCantidadProductoNuevo(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Precio (RD$)', 'Price (DOP)')}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={precioProductoNuevo}
                                            onChange={(e) => setPrecioProductoNuevo(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={agregarProductoNuevo}
                                    className={estilos.btnAgregar}
                                    disabled={procesando}
                                >
                                    <ion-icon name="add-circle-outline"></ion-icon>
                                    <span>{tr('Agregar a la Compra', 'Add to Purchase')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {productosSeleccionados.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>{tr('No hay productos agregados', 'No products added')}</span>
                        </div>
                    ) : (
                        <div className={estilos.tablaProductos}>
                            <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                                <div>{tr('Producto', 'Product')}</div>
                                <div>{tr('Precio', 'Price')}</div>
                                <div>{tr('Cantidad', 'Quantity')}</div>
                                <div>{tr('Subtotal', 'Subtotal')}</div>
                                <div></div>
                            </div>
                            <div className={estilos.tablaBody}>
                                {productosSeleccionados.map((producto, index) => (
                                    <div key={index} className={`${estilos.fila} ${estilos[tema]}`}>
                                        <div className={estilos.nombre}>
                                            {producto.nombre}
                                            {producto.esNuevo && (
                                                <span className={estilos.badgeNuevo}>{tr('Nuevo', 'New')}</span>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={producto.precio_compra}
                                                onChange={(e) => actualizarPrecio(index, parseFloat(e.target.value) || 0)}
                                                className={estilos.inputPrecio}
                                                disabled={procesando}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                min="1"
                                                value={producto.cantidad}
                                                onChange={(e) => actualizarCantidad(index, parseInt(e.target.value) || 1)}
                                                className={estilos.inputCantidad}
                                                disabled={procesando}
                                            />
                                        </div>
                                        <div className={estilos.subtotal}>{formatearMoneda(producto.subtotal)}</div>
                                        <div>
                                            <button
                                                type="button"
                                                className={estilos.btnEliminar}
                                                onClick={() => eliminarProducto(index)}
                                                disabled={procesando}
                                            >
                                                <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    )
}