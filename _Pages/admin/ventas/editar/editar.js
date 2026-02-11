"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerVentaEditar, buscarProductos, buscarClientes, actualizarVenta } from './servidor'
import estilos from './editar.module.css'
import { formatCurrency } from '@/utils/monedaUtils'

export default function EditarVentaAdmin() {
    const router = useRouter()
    const params = useParams()
    const ventaId = params.id
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [datosEmpresa, setDatosEmpresa] = useState(null)
    const [tiposComprobante, setTiposComprobante] = useState([])
    const [ventaOriginal, setVentaOriginal] = useState(null)
    
    const [busquedaProducto, setBusquedaProducto] = useState('')
    const [productos, setProductos] = useState([])
    const [mostrarDropdownProductos, setMostrarDropdownProductos] = useState(false)
    const [productosVenta, setProductosVenta] = useState([])
    
    const [busquedaCliente, setBusquedaCliente] = useState('')
    const [clientes, setClientes] = useState([])
    const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false)
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
    
    const [tipoComprobanteId, setTipoComprobanteId] = useState('')
    const [metodoPago, setMetodoPago] = useState('efectivo')
    const [efectivoRecibido, setEfectivoRecibido] = useState('')
    const [descuentoGlobal, setDescuentoGlobal] = useState('')
    const [notasVenta, setNotasVenta] = useState('')

    const monedaEmpresa = datosEmpresa?.moneda || 'DOP'
    const localeEmpresa = datosEmpresa?.locale || 'es-DO'
    const simboloEmpresa = datosEmpresa?.simbolo_moneda || ''
    const formatearMonto = (valor) => formatCurrency(valor, {
        currency: monedaEmpresa,
        locale: localeEmpresa,
        symbol: simboloEmpresa
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
        cargarDatosVenta()
    }, [ventaId])

    useEffect(() => {
        const manejarClickFuera = (e) => {
            if (!e.target.closest(`.${estilos.busquedaProductoContainer}`)) {
                setMostrarDropdownProductos(false)
            }
            if (!e.target.closest(`.${estilos.busquedaClienteContainer}`)) {
                setMostrarDropdownClientes(false)
            }
        }

        document.addEventListener('click', manejarClickFuera)
        return () => document.removeEventListener('click', manejarClickFuera)
    }, [])

    const cargarDatosVenta = async () => {
        try {
            const resultado = await obtenerVentaEditar(ventaId)
            if (resultado.success) {
                setDatosEmpresa(resultado.empresa)
                setTiposComprobante(resultado.tiposComprobante)
                setVentaOriginal(resultado.venta)
                
                setTipoComprobanteId(resultado.venta.tipo_comprobante_id)
                setMetodoPago(resultado.venta.metodo_pago)
                setDescuentoGlobal(resultado.venta.descuento.toString())
                setNotasVenta(resultado.venta.notas || '')
                
                if (resultado.venta.efectivo_recibido) {
                    setEfectivoRecibido(resultado.venta.efectivo_recibido.toString())
                }
                
                if (resultado.venta.cliente) {
                    setClienteSeleccionado(resultado.venta.cliente)
                    setBusquedaCliente(resultado.venta.cliente.nombre)
                }
                
                const productosConDatos = resultado.venta.productos.map(p => ({
                    id: p.producto_id,
                    nombre: p.nombre_producto,
                    codigo_barras: p.codigo_barras,
                    sku: p.sku,
                    stock: p.stock_actual,
                    precio_venta: p.precio_venta,
                    cantidad: p.cantidad,
                    precio_venta_usado: p.precio_unitario,
                    aplica_itbis: p.aplica_itbis
                }))
                
                setProductosVenta(productosConDatos)
            } else {
                alert(resultado.mensaje || 'Error al cargar venta')
                router.push('/admin/ventas')
            }
        } catch (error) {
            console.error('Error al cargar venta:', error)
            alert('Error al cargar datos de la venta')
            router.push('/admin/ventas')
        } finally {
            setCargando(false)
        }
    }

    const manejarBusquedaProducto = async (e) => {
        const valor = e.target.value
        setBusquedaProducto(valor)

        if (valor.length >= 2) {
            try {
                const resultado = await buscarProductos(valor)
                if (resultado.success) {
                    setProductos(resultado.productos)
                    setMostrarDropdownProductos(true)
                }
            } catch (error) {
                console.error('Error al buscar productos:', error)
            }
        } else {
            setProductos([])
            setMostrarDropdownProductos(false)
        }
    }

    const agregarProducto = (producto) => {
        const existe = productosVenta.find(p => p.id === producto.id)
        
        if (existe) {
            setProductosVenta(productosVenta.map(p => 
                p.id === producto.id 
                    ? { ...p, cantidad: p.cantidad + 1 }
                    : p
            ))
        } else {
            setProductosVenta([...productosVenta, {
                ...producto,
                cantidad: 1,
                precio_venta_usado: parseFloat(producto.precio_venta)
            }])
        }

        setBusquedaProducto('')
        setMostrarDropdownProductos(false)
    }

    const actualizarCantidad = (productoId, nuevaCantidad) => {
        if (nuevaCantidad <= 0) {
            eliminarProducto(productoId)
            return
        }

        const producto = productosVenta.find(p => p.id === productoId)
        if (producto && nuevaCantidad > producto.stock) {
            alert(`Stock disponible: ${producto.stock}`)
            return
        }

        setProductosVenta(productosVenta.map(p =>
            p.id === productoId ? { ...p, cantidad: nuevaCantidad } : p
        ))
    }

    const actualizarPrecio = (productoId, nuevoPrecio) => {
        setProductosVenta(productosVenta.map(p =>
            p.id === productoId ? { ...p, precio_venta_usado: parseFloat(nuevoPrecio) || 0 } : p
        ))
    }

    const eliminarProducto = (productoId) => {
        setProductosVenta(productosVenta.filter(p => p.id !== productoId))
    }

    const manejarBusquedaCliente = async (e) => {
        const valor = e.target.value
        setBusquedaCliente(valor)

        if (valor.length >= 2) {
            try {
                const resultado = await buscarClientes(valor)
                if (resultado.success) {
                    setClientes(resultado.clientes)
                    setMostrarDropdownClientes(true)
                }
            } catch (error) {
                console.error('Error al buscar clientes:', error)
            }
        } else {
            setClientes([])
            setMostrarDropdownClientes(false)
        }
    }

    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente)
        setBusquedaCliente(cliente.nombre)
        setMostrarDropdownClientes(false)
    }

    const limpiarCliente = () => {
        setClienteSeleccionado(null)
        setBusquedaCliente('')
    }

    const calcularTotales = () => {
        let subtotal = 0
        let descuento = parseFloat(descuentoGlobal) || 0

        productosVenta.forEach(producto => {
            const precio = producto.precio_venta_usado || 0
            const cantidad = producto.cantidad || 0
            subtotal += precio * cantidad
        })

        const subtotalConDescuento = subtotal - descuento
        const montoGravado = subtotalConDescuento
        const itbis = datosEmpresa?.impuesto_porcentaje 
            ? (montoGravado * parseFloat(datosEmpresa.impuesto_porcentaje)) / 100
            : 0
        const total = subtotalConDescuento + itbis

        return {
            subtotal: subtotal.toFixed(2),
            descuento: descuento.toFixed(2),
            montoGravado: montoGravado.toFixed(2),
            itbis: itbis.toFixed(2),
            total: total.toFixed(2)
        }
    }

    const validarVenta = () => {
        if (productosVenta.length === 0) {
            alert('Debes tener al menos un producto en la venta')
            return false
        }

        if (!tipoComprobanteId) {
            alert('Selecciona un tipo de comprobante')
            return false
        }

        const tipoComprobante = tiposComprobante.find(t => t.id === parseInt(tipoComprobanteId))
        if (tipoComprobante?.requiere_rnc && !clienteSeleccionado) {
            alert('Este tipo de comprobante requiere seleccionar un cliente')
            return false
        }

        if (metodoPago === 'efectivo') {
            const recibido = parseFloat(efectivoRecibido) || 0
            const total = parseFloat(calcularTotales().total)
            if (recibido < total) {
                alert('El efectivo recibido debe ser mayor o igual al total')
                return false
            }
        }

        return true
    }

    const procesarActualizacion = async () => {
        if (!validarVenta()) return

        if (!confirm('¿Estas seguro de actualizar esta venta? Esta accion modificara los datos originales.')) {
            return
        }

        setProcesando(true)
        try {
            const totales = calcularTotales()
            
            let efectivoRecibidoFinal = null
            let cambioFinal = null

            if (metodoPago === 'efectivo') {
                const recibido = parseFloat(efectivoRecibido)
                const total = parseFloat(totales.total)
                efectivoRecibidoFinal = recibido
                cambioFinal = recibido - total
            }

            const datosActualizacion = {
                venta_id: parseInt(ventaId),
                tipo_comprobante_id: parseInt(tipoComprobanteId),
                cliente_id: clienteSeleccionado?.id || null,
                productos: productosVenta.map(p => ({
                    producto_id: p.id,
                    cantidad: p.cantidad,
                    precio_unitario: p.precio_venta_usado
                })),
                subtotal: parseFloat(totales.subtotal),
                descuento: parseFloat(totales.descuento),
                monto_gravado: parseFloat(totales.montoGravado),
                itbis: parseFloat(totales.itbis),
                total: parseFloat(totales.total),
                metodo_pago: metodoPago,
                efectivo_recibido: efectivoRecibidoFinal,
                cambio: cambioFinal,
                notas: notasVenta.trim() || null
            }

            const resultado = await actualizarVenta(datosActualizacion)
            
            if (resultado.success) {
                alert(resultado.mensaje)
                router.push('/admin/ventas')
            } else {
                alert(resultado.mensaje || 'Error al actualizar la venta')
            }
        } catch (error) {
            console.error('Error al actualizar venta:', error)
            alert('Error al procesar la actualizacion')
        } finally {
            setProcesando(false)
        }
    }

    const totales = calcularTotales()
    const cambio = metodoPago === 'efectivo' && efectivoRecibido
        ? (parseFloat(efectivoRecibido) - parseFloat(totales.total)).toFixed(2)
        : '0.00'

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando datos de la venta...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Editar Venta</h1>
                    <p className={estilos.subtitulo}>
                        Modificar venta {ventaOriginal?.ncf} - {ventaOriginal?.numero_interno}
                    </p>
                </div>
                <button 
                    className={estilos.btnCancelar}
                    onClick={() => router.push('/admin/ventas')}
                >
                    <ion-icon name="close-outline"></ion-icon>
                    <span>Cancelar</span>
                </button>
            </div>

            <div className={`${estilos.alertaEdicion} ${estilos[tema]}`}>
                <ion-icon name="warning-outline"></ion-icon>
                <div>
                    <strong>Importante:</strong>
                    <span>Esta venta ya fue emitida. Los cambios afectaran el inventario y los registros contables.</span>
                </div>
            </div>

            <div className={estilos.contenido}>
                <div className={estilos.columnaIzquierda}>
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>Productos</span>
                        </h3>

                        <div className={estilos.busquedaProductoContainer}>
                            <div className={estilos.busquedaProducto}>
                                <ion-icon name="search-outline"></ion-icon>
                                <input
                                    type="text"
                                    placeholder="Buscar producto por nombre, codigo o SKU..."
                                    value={busquedaProducto}
                                    onChange={manejarBusquedaProducto}
                                    className={estilos.inputBusqueda}
                                />
                            </div>

                            {mostrarDropdownProductos && productos.length > 0 && (
                                <div className={`${estilos.dropdownProductos} ${estilos[tema]}`}>
                                    {productos.map(producto => (
                                        <div
                                            key={producto.id}
                                            className={estilos.dropdownItem}
                                            onClick={() => agregarProducto(producto)}
                                        >
                                            <div className={estilos.productoInfo}>
                                                <span className={estilos.productoNombre}>{producto.nombre}</span>
                                                <span className={estilos.productoCodigo}>
                                                    {producto.codigo_barras || producto.sku}
                                                </span>
                                            </div>
                                            <div className={estilos.productoDatos}>
                                                <span className={estilos.productoStock}>Stock: {producto.stock}</span>
                                                <span className={estilos.productoPrecio}>
                                                    {formatearMonto(producto.precio_venta)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={estilos.listaProductos}>
                            {productosVenta.length === 0 ? (
                                <div className={estilos.sinProductos}>
                                    <ion-icon name="cart-outline"></ion-icon>
                                    <span>No hay productos en la venta</span>
                                </div>
                            ) : (
                                productosVenta.map(producto => (
                                    <div key={producto.id} className={`${estilos.productoItem} ${estilos[tema]}`}>
                                        <div className={estilos.productoDetalles}>
                                            <span className={estilos.productoNombreItem}>{producto.nombre}</span>
                                            <span className={estilos.productoStockItem}>
                                                Stock: {producto.stock} | Cod: {producto.codigo_barras || producto.sku}
                                            </span>
                                        </div>

                                        <div className={estilos.productoControles}>
                                            <div className={estilos.controlCantidad}>
                                                <button
                                                    onClick={() => actualizarCantidad(producto.id, producto.cantidad - 1)}
                                                    className={estilos.btnCantidad}
                                                >
                                                    <ion-icon name="remove-outline"></ion-icon>
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={producto.stock}
                                                    value={producto.cantidad}
                                                    onChange={(e) => actualizarCantidad(producto.id, parseInt(e.target.value) || 1)}
                                                    className={estilos.inputCantidad}
                                                />
                                                <button
                                                    onClick={() => actualizarCantidad(producto.id, producto.cantidad + 1)}
                                                    className={estilos.btnCantidad}
                                                    disabled={producto.cantidad >= producto.stock}
                                                >
                                                    <ion-icon name="add-outline"></ion-icon>
                                                </button>
                                            </div>

                                            <div className={estilos.controlPrecio}>
                                                <span className={estilos.labelPrecio}>{simboloEmpresa || monedaEmpresa}</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={producto.precio_venta_usado}
                                                    onChange={(e) => actualizarPrecio(producto.id, e.target.value)}
                                                    className={estilos.inputPrecio}
                                                />
                                            </div>

                                            <div className={estilos.productoSubtotal}>
                                                <span>{formatearMonto(producto.cantidad * producto.precio_venta_usado)}</span>
                                            </div>

                                            <button
                                                onClick={() => eliminarProducto(producto.id)}
                                                className={estilos.btnEliminar}
                                            >
                                                <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className={estilos.columnaDerecha}>
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="person-outline"></ion-icon>
                            <span>Cliente</span>
                        </h3>

                        <div className={estilos.busquedaClienteContainer}>
                            <div className={estilos.busquedaCliente}>
                                <ion-icon name="search-outline"></ion-icon>
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    value={busquedaCliente}
                                    onChange={manejarBusquedaCliente}
                                    className={estilos.inputBusqueda}
                                    disabled={clienteSeleccionado !== null}
                                />
                                {clienteSeleccionado && (
                                    <button
                                        onClick={limpiarCliente}
                                        className={estilos.btnLimpiarCliente}
                                    >
                                        <ion-icon name="close-circle"></ion-icon>
                                    </button>
                                )}
                            </div>

                            {mostrarDropdownClientes && clientes.length > 0 && (
                                <div className={`${estilos.dropdownClientes} ${estilos[tema]}`}>
                                    {clientes.map(cliente => (
                                        <div
                                            key={cliente.id}
                                            className={estilos.dropdownItemCliente}
                                            onClick={() => seleccionarCliente(cliente)}
                                        >
                                            <div className={estilos.clienteInfo}>
                                                <span className={estilos.clienteNombre}>{cliente.nombre}</span>
                                                <span className={estilos.clienteDoc}>{cliente.numero_documento}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {clienteSeleccionado && (
                            <div className={`${estilos.clienteSeleccionado} ${estilos[tema]}`}>
                                <div className={estilos.clienteData}>
                                    <span className={estilos.clienteNombreSelec}>{clienteSeleccionado.nombre}</span>
                                    <span className={estilos.clienteDocSelec}>
                                        {clienteSeleccionado.tipo_documento}: {clienteSeleccionado.numero_documento}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="document-text-outline"></ion-icon>
                            <span>Comprobante</span>
                        </h3>

                        <div className={estilos.grupoInput}>
                            <label>Tipo de Comprobante</label>
                            <select
                                value={tipoComprobanteId}
                                onChange={(e) => setTipoComprobanteId(e.target.value)}
                                className={estilos.select}
                            >
                                {tiposComprobante.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.codigo} - {tipo.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Descuento Global ({simboloEmpresa || monedaEmpresa})</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={descuentoGlobal}
                                onChange={(e) => setDescuentoGlobal(e.target.value)}
                                placeholder="0.00"
                                className={estilos.input}
                            />
                        </div>
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="card-outline"></ion-icon>
                            <span>Metodo de Pago</span>
                        </h3>

                        <div className={estilos.gridMetodosPago}>
                            <button
                                type="button"
                                className={`${estilos.btnMetodoPago} ${metodoPago === 'efectivo' ? estilos.seleccionado : ''} ${estilos[tema]}`}
                                onClick={() => setMetodoPago('efectivo')}
                            >
                                <ion-icon name="cash-outline"></ion-icon>
                                <span>Efectivo</span>
                            </button>
                            <button
                                type="button"
                                className={`${estilos.btnMetodoPago} ${metodoPago === 'tarjeta_debito' ? estilos.seleccionado : ''} ${estilos[tema]}`}
                                onClick={() => setMetodoPago('tarjeta_debito')}
                            >
                                <ion-icon name="card-outline"></ion-icon>
                                <span>T. Debito</span>
                            </button>
                            <button
                                type="button"
                                className={`${estilos.btnMetodoPago} ${metodoPago === 'tarjeta_credito' ? estilos.seleccionado : ''} ${estilos[tema]}`}
                                onClick={() => setMetodoPago('tarjeta_credito')}
                            >
                                <ion-icon name="card-outline"></ion-icon>
                                <span>T. Credito</span>
                            </button>
                            <button
                                type="button"
                                className={`${estilos.btnMetodoPago} ${metodoPago === 'transferencia' ? estilos.seleccionado : ''} ${estilos[tema]}`}
                                onClick={() => setMetodoPago('transferencia')}
                            >
                                <ion-icon name="swap-horizontal-outline"></ion-icon>
                                <span>Transferencia</span>
                            </button>
                            <button
                                type="button"
                                className={`${estilos.btnMetodoPago} ${metodoPago === 'cheque' ? estilos.seleccionado : ''} ${estilos[tema]}`}
                                onClick={() => setMetodoPago('cheque')}
                            >
                                <ion-icon name="document-text-outline"></ion-icon>
                                <span>Cheque</span>
                            </button>
                        </div>

                        {metodoPago === 'efectivo' && (
                            <div className={estilos.grupoInput}>
                                <label>Efectivo Recibido ({simboloEmpresa || monedaEmpresa})</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={efectivoRecibido}
                                    onChange={(e) => setEfectivoRecibido(e.target.value)}
                                    placeholder="0.00"
                                    className={estilos.input}
                                />
                                {efectivoRecibido && parseFloat(cambio) >= 0 && (
                                    <div className={`${estilos.cambioBox} ${estilos[tema]}`}>
                                        <span>Cambio:</span>
                                        <strong>{formatearMonto(cambio)}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={estilos.grupoInput}>
                            <label>Notas (Opcional)</label>
                            <textarea
                                value={notasVenta}
                                onChange={(e) => setNotasVenta(e.target.value)}
                                placeholder="Observaciones sobre la venta..."
                                className={estilos.textarea}
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className={`${estilos.resumenVenta} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloResumen}>Resumen de Venta</h3>
                        
                        <div className={estilos.lineaResumen}>
                            <span>Subtotal:</span>
                            <span>{formatearMonto(totales.subtotal)}</span>
                        </div>

                        {parseFloat(totales.descuento) > 0 && (
                            <div className={estilos.lineaResumen}>
                                <span>Descuento:</span>
                                <span className={estilos.descuento}>- {formatearMonto(totales.descuento)}</span>
                            </div>
                        )}

                        <div className={estilos.lineaResumen}>
                            <span>Monto Gravado:</span>
                            <span>{formatearMonto(totales.montoGravado)}</span>
                        </div>

                        <div className={estilos.lineaResumen}>
                            <span>{datosEmpresa?.impuesto_nombre || 'ITBIS'} ({datosEmpresa?.impuesto_porcentaje || 18}%):</span>
                            <span>{formatearMonto(totales.itbis)}</span>
                        </div>

                        <div className={estilos.separador}></div>

                        <div className={estilos.lineaTotal}>
                            <span>Total a Pagar:</span>
                            <span>{formatearMonto(totales.total)}</span>
                        </div>

                        <button
                            onClick={procesarActualizacion}
                            disabled={procesando || productosVenta.length === 0}
                            className={estilos.btnProcesar}
                        >
                            {procesando ? (
                                <>
                                    <ion-icon name="hourglass-outline"></ion-icon>
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <ion-icon name="save-outline"></ion-icon>
                                    <span>Guardar Cambios</span>
                                </>
                            )}
                        </button>
                        </div>
                </div>
            </div>
        </div>
    )
}