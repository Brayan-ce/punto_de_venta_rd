"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerDatosFormulario, crearCompra } from './servidor'
import estilos from './nuevo.module.css'

export default function NuevaCompra() {
    const router = useRouter()
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
                alert(resultado.mensaje || 'Error al cargar datos')
                router.push('/admin/compras')
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
            router.push('/admin/compras')
        } finally {
            setCargando(false)
        }
    }

    const agregarProductoExistente = (producto) => {
        const yaExiste = productosSeleccionados.find(p => p.id === producto.id)
        if (yaExiste) {
            alert('Este producto ya esta agregado')
            return
        }

        setProductosSeleccionados([...productosSeleccionados, {
            id: producto.id,
            nombre: producto.nombre,
            precio_compra: producto.precio_compra,
            cantidad: 1,
            subtotal: producto.precio_compra,
            esNuevo: false
        }])
        setBusquedaProducto('')
        setMostrarListaProductos(false)
    }

    const agregarProductoNuevo = () => {
        if (!nombreProductoNuevo.trim()) {
            alert('Ingresa el nombre del producto')
            return
        }

        if (!cantidadProductoNuevo || parseInt(cantidadProductoNuevo) <= 0) {
            alert('Ingresa una cantidad valida')
            return
        }

        if (!precioProductoNuevo || parseFloat(precioProductoNuevo) <= 0) {
            alert('Ingresa un precio valido')
            return
        }

        const yaExiste = productosSeleccionados.find(p => 
            p.nombre.toLowerCase() === nombreProductoNuevo.trim().toLowerCase()
        )

        if (yaExiste) {
            alert('Ya existe un producto con ese nombre en la lista')
            return
        }

        const productoEnCatalogo = productos.find(p => 
            p.nombre.toLowerCase() === nombreProductoNuevo.trim().toLowerCase()
        )

        if (productoEnCatalogo) {
            if (confirm(`El producto "${nombreProductoNuevo}" ya existe en el catalogo. Deseas actualizar su informacion?`)) {
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

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.codigo_barras?.toLowerCase().includes(busquedaProducto.toLowerCase())
    )

    const calcularTotales = () => {
        const subtotal = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0)
        const itbis = subtotal * 0.18
        const total = subtotal + itbis
        return { subtotal, itbis, total }
    }

    const validarFormulario = () => {
        if (!tipoComprobanteId) {
            alert('Selecciona un tipo de comprobante')
            return false
        }

        if (!ncf.trim()) {
            alert('Ingresa el NCF')
            return false
        }

        if (!proveedorId) {
            alert('Selecciona un proveedor')
            return false
        }

        if (productosSeleccionados.length === 0) {
            alert('Agrega al menos un producto')
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
                alert(resultado.mensaje || 'Error al crear compra')
            }
        } catch (error) {
            console.error('Error al crear compra:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const totales = calcularTotales()

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando formulario...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Nueva Compra</h1>
                    <p className={estilos.subtitulo}>Registra una nueva compra a proveedor</p>
                </div>
                <button
                    type="button"
                    onClick={() => router.push('/admin/compras')}
                    className={estilos.btnCancelar}
                    disabled={procesando}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Volver</span>
                </button>
            </div>

            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                <div className={estilos.fila}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Informacion de la Compra</h2>

                        <div className={estilos.grid}>
                            <div className={estilos.grupoInput}>
                                <label>Tipo de Comprobante *</label>
                                <select
                                    value={tipoComprobanteId}
                                    onChange={(e) => setTipoComprobanteId(e.target.value)}
                                    className={estilos.select}
                                    required
                                    disabled={procesando}
                                >
                                    <option value="">Seleccionar...</option>
                                    {tiposComprobante.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>NCF *</label>
                                <input
                                    type="text"
                                    value={ncf}
                                    onChange={(e) => setNcf(e.target.value)}
                                    className={estilos.input}
                                    required
                                    disabled={procesando}
                                    placeholder="B0100000001"
                                />
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Proveedor *</label>
                            <select
                                value={proveedorId}
                                onChange={(e) => setProveedorId(e.target.value)}
                                className={estilos.select}
                                required
                                disabled={procesando}
                            >
                                <option value="">Seleccionar...</option>
                                {proveedores.map(prov => (
                                    <option key={prov.id} value={prov.id}>{prov.nombre_comercial}</option>
                                ))}
                            </select>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Metodo de Pago *</label>
                            <select
                                value={metodoPago}
                                onChange={(e) => setMetodoPago(e.target.value)}
                                className={estilos.select}
                                required
                                disabled={procesando}
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="tarjeta_debito">Tarjeta Debito</option>
                                <option value="tarjeta_credito">Tarjeta Credito</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="cheque">Cheque</option>
                                <option value="mixto">Mixto</option>
                            </select>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Notas</label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                className={estilos.textarea}
                                disabled={procesando}
                                placeholder="Observaciones adicionales..."
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Totales</h2>
                        
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
                            {procesando ? 'Procesando...' : 'Registrar Compra'}
                        </button>
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <h2 className={estilos.panelTitulo}>Agregar Productos</h2>

                    <div className={estilos.seccionesProductos}>
                        <div className={estilos.seccion}>
                            <h3 className={estilos.seccionTitulo}>Buscar del Catalogo</h3>
                            <div className={estilos.busquedaProducto}>
                                <ion-icon name="search-outline"></ion-icon>
                                <input
                                    type="text"
                                    placeholder="Buscar producto existente..."
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
                            <span>O</span>
                        </div>

                        <div className={estilos.seccion}>
                            <h3 className={estilos.seccionTitulo}>Agregar Producto Nuevo</h3>
                            <div className={estilos.formProductoNuevo}>
                                <div className={estilos.grupoInput}>
                                    <label>Nombre del Producto</label>
                                    <input
                                        type="text"
                                        value={nombreProductoNuevo}
                                        onChange={(e) => setNombreProductoNuevo(e.target.value)}
                                        className={estilos.input}
                                        disabled={procesando}
                                        placeholder="Ej: Aceite de Oliva"
                                    />
                                </div>
                                <div className={estilos.gridNuevo}>
                                    <div className={estilos.grupoInput}>
                                        <label>Cantidad</label>
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
                                        <label>Precio (RD$)</label>
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
                                    <span>Agregar a la Compra</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {productosSeleccionados.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>No hay productos agregados</span>
                        </div>
                    ) : (
                        <div className={estilos.tablaProductos}>
                            <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                                <div>Producto</div>
                                <div>Precio</div>
                                <div>Cantidad</div>
                                <div>Subtotal</div>
                                <div></div>
                            </div>
                            <div className={estilos.tablaBody}>
                                {productosSeleccionados.map((producto, index) => (
                                    <div key={index} className={`${estilos.fila} ${estilos[tema]}`}>
                                        <div className={estilos.nombre}>
                                            {producto.nombre}
                                            {producto.esNuevo && (
                                                <span className={estilos.badgeNuevo}>Nuevo</span>
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