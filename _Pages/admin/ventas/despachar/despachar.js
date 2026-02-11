"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { obtenerVentaDespacho, procesarDespacho, obtenerHistorialDespachos } from './servidor'
import estilos from './despachar.module.css'

export default function DespacharVenta() {
    const params = useParams()
    const router = useRouter()
    const ventaId = params.id
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [venta, setVenta] = useState(null)
    const [productos, setProductos] = useState([])
    const [observaciones, setObservaciones] = useState('')
    const [historialDespachos, setHistorialDespachos] = useState([])
    const [mostrarHistorial, setMostrarHistorial] = useState(false)
    const [cargandoHistorial, setCargandoHistorial] = useState(false)

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
    }, [ventaId])

    const cargarDatos = async () => {
        try {
            const resultado = await obtenerVentaDespacho(ventaId)
            if (resultado.success) {
                setVenta(resultado.venta)
                setProductos(resultado.productos.map(p => ({
                    ...p,
                    cantidad_a_despachar: p.cantidad_pendiente
                })))
            } else {
                alert(resultado.mensaje || 'Error al cargar datos')
                router.push('/admin/ventas')
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
            router.push('/admin/ventas')
        } finally {
            setCargando(false)
        }
    }

    const cargarHistorial = async () => {
        if (historialDespachos.length > 0) {
            setMostrarHistorial(!mostrarHistorial)
            return
        }

        setCargandoHistorial(true)
        try {
            const resultado = await obtenerHistorialDespachos(ventaId)
            if (resultado.success) {
                setHistorialDespachos(resultado.despachos)
                setMostrarHistorial(true)
            } else {
                alert(resultado.mensaje || 'Error al cargar historial')
            }
        } catch (error) {
            console.error('Error al cargar historial:', error)
            alert('Error al cargar historial')
        } finally {
            setCargandoHistorial(false)
        }
    }

    const actualizarCantidad = (productoId, nuevaCantidad) => {
        setProductos(productos.map(p => {
            if (p.id === productoId) {
                const cantidad = Math.min(Math.max(0, nuevaCantidad), p.cantidad_pendiente)
                return { ...p, cantidad_a_despachar: cantidad }
            }
            return p
        }))
    }

    const despacharTodo = (productoId) => {
        setProductos(productos.map(p => {
            if (p.id === productoId) {
                return { ...p, cantidad_a_despachar: p.cantidad_pendiente }
            }
            return p
        }))
    }

    const despacharTodoGeneral = () => {
        setProductos(productos.map(p => ({
            ...p,
            cantidad_a_despachar: p.cantidad_pendiente
        })))
    }

    const validarDespacho = () => {
        const productosADespachar = productos.filter(p => p.cantidad_a_despachar > 0)
        
        if (productosADespachar.length === 0) {
            alert('Debes despachar al menos un producto')
            return false
        }

        for (const producto of productosADespachar) {
            if (producto.cantidad_a_despachar > producto.cantidad_pendiente) {
                alert(`No puedes despachar mas de ${producto.cantidad_pendiente} unidades de ${producto.nombre_producto}`)
                return false
            }
        }

        return true
    }

    const manejarDespacho = async () => {
        if (!validarDespacho()) return

        const productosDespacho = productos
            .filter(p => p.cantidad_a_despachar > 0)
            .map(p => ({
                detalle_venta_id: p.id,
                cantidad: p.cantidad_a_despachar
            }))

        if (!confirm(`Vas a despachar ${productosDespacho.length} producto(s). ¿Continuar?`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await procesarDespacho(ventaId, productosDespacho, observaciones.trim() || null)
            if (resultado.success) {
                alert(resultado.mensaje)
                router.push('/admin/ventas')
            } else {
                alert(resultado.mensaje || 'Error al procesar despacho')
            }
        } catch (error) {
            console.error('Error al procesar despacho:', error)
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

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-DO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const calcularTotalPendiente = () => {
        return productos.reduce((total, p) => total + p.cantidad_pendiente, 0)
    }

    const calcularTotalADespachar = () => {
        return productos.reduce((total, p) => total + p.cantidad_a_despachar, 0)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando datos del despacho...</span>
                </div>
            </div>
        )
    }

    if (!venta) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h2>Venta no encontrada</h2>
                    <button onClick={() => router.push('/admin/ventas')} className={estilos.btnVolver}>
                        Volver a Ventas
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Despachar Pedido</h1>
                    <p className={estilos.subtitulo}>Completa la entrega de productos pendientes</p>
                </div>
                <div className={estilos.headerBotones}>
                    <button 
                        className={estilos.btnHistorial}
                        onClick={cargarHistorial}
                        disabled={procesando || cargandoHistorial}
                    >
                        <ion-icon name={cargandoHistorial ? "hourglass-outline" : "time-outline"}></ion-icon>
                        <span>{cargandoHistorial ? 'Cargando...' : 'Ver Historial'}</span>
                    </button>
                    <button 
                        className={estilos.btnCancelar}
                        onClick={() => router.push('/admin/ventas')}
                        disabled={procesando}
                    >
                        <ion-icon name="close-outline"></ion-icon>
                        <span>Cancelar</span>
                    </button>
                </div>
            </div>

            {mostrarHistorial && (
                <div className={`${estilos.historialContainer} ${estilos[tema]}`}>
                    <div className={estilos.historialHeader}>
                        <h3 className={estilos.historialTitulo}>
                            <ion-icon name="document-text-outline"></ion-icon>
                            <span>Historial de Despachos</span>
                        </h3>
                        <button 
                            className={estilos.btnCerrarHistorial}
                            onClick={() => setMostrarHistorial(false)}
                        >
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                    <div className={estilos.historialLista}>
                        {historialDespachos.length === 0 ? (
                            <div className={estilos.historialVacio}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <p>No hay despachos registrados para esta venta</p>
                            </div>
                        ) : (
                            historialDespachos.map((despacho) => (
                                <div key={despacho.id} className={`${estilos.despachoCard} ${estilos[tema]}`}>
                                    <div className={estilos.despachoHeader}>
                                        <div className={estilos.despachoNumero}>
                                            <ion-icon name="cube-outline"></ion-icon>
                                            <span>Despacho #{despacho.numero_despacho}</span>
                                        </div>
                                        <div className={`${estilos.despachoEstado} ${estilos[despacho.estado]}`}>
                                            {despacho.estado}
                                        </div>
                                    </div>
                                    <div className={estilos.despachoInfo}>
                                        <div className={estilos.infoRow}>
                                            <span className={estilos.infoLabel}>Fecha:</span>
                                            <span className={estilos.infoValor}>{formatearFecha(despacho.fecha_despacho)}</span>
                                        </div>
                                        <div className={estilos.infoRow}>
                                            <span className={estilos.infoLabel}>Usuario:</span>
                                            <span className={estilos.infoValor}>{despacho.usuario_nombre}</span>
                                        </div>
                                        {despacho.observaciones && (
                                            <div className={estilos.infoRow}>
                                                <span className={estilos.infoLabel}>Observaciones:</span>
                                                <span className={estilos.infoValor}>{despacho.observaciones}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={estilos.despachoProductos}>
                                        <h4>Productos Despachados:</h4>
                                        {despacho.productos.map(prod => (
                                            <div key={prod.id} className={estilos.productoDespacho}>
                                                <span className={estilos.productoNombreHistorial}>{prod.nombre_producto}</span>
                                                <span className={estilos.productoCantidadHistorial}>{prod.cantidad_despachada} unidades</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className={estilos.contenido}>
                <div className={estilos.columnaIzquierda}>
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <div className={estilos.headerSeccion}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="document-text-outline"></ion-icon>
                                <span>Información de la Venta</span>
                            </h3>
                        </div>

                        <div className={estilos.infoVenta}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>NCF:</span>
                                <span className={estilos.infoValor}>{venta.ncf}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Número Interno:</span>
                                <span className={estilos.infoValor}>{venta.numero_interno}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Cliente:</span>
                                <span className={estilos.infoValor}>{venta.cliente_nombre || 'Consumidor Final'}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Total Venta:</span>
                                <span className={estilos.infoValor}>{formatearMoneda(venta.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <div className={estilos.headerSeccion}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="cube-outline"></ion-icon>
                                <span>Productos Pendientes</span>
                            </h3>
                            <button
                                className={estilos.btnDespacharTodo}
                                onClick={despacharTodoGeneral}
                                disabled={procesando}
                            >
                                <ion-icon name="checkmark-done-outline"></ion-icon>
                                <span>Despachar Todo</span>
                            </button>
                        </div>

                        <div className={estilos.listaProductos}>
                            {productos.map(producto => (
                                <div key={producto.id} className={`${estilos.productoItem} ${estilos[tema]}`}>
                                    <div className={estilos.productoInfo}>
                                        <h4 className={estilos.productoNombre}>{producto.nombre_producto}</h4>
                                        <div className={estilos.productoDetalles}>
                                            <span className={estilos.detalle}>
                                                Total: <strong>{producto.cantidad}</strong>
                                            </span>
                                            <span className={estilos.detalle}>
                                                Despachado: <strong>{producto.cantidad_despachada}</strong>
                                            </span>
                                            <span className={`${estilos.detalle} ${estilos.pendiente}`}>
                                                Pendiente: <strong>{producto.cantidad_pendiente}</strong>
                                            </span>
                                        </div>
                                    </div>

                                    <div className={estilos.productoControles}>
                                        <div className={estilos.controlCantidad}>
                                            <button
                                                onClick={() => actualizarCantidad(producto.id, producto.cantidad_a_despachar - 1)}
                                                className={estilos.btnCantidad}
                                                disabled={procesando || producto.cantidad_a_despachar <= 0}
                                            >
                                                <ion-icon name="remove-outline"></ion-icon>
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                max={producto.cantidad_pendiente}
                                                value={producto.cantidad_a_despachar}
                                                onChange={(e) => actualizarCantidad(producto.id, parseInt(e.target.value) || 0)}
                                                className={estilos.inputCantidad}
                                                disabled={procesando}
                                            />
                                            <button
                                                onClick={() => actualizarCantidad(producto.id, producto.cantidad_a_despachar + 1)}
                                                className={estilos.btnCantidad}
                                                disabled={procesando || producto.cantidad_a_despachar >= producto.cantidad_pendiente}
                                            >
                                                <ion-icon name="add-outline"></ion-icon>
                                            </button>
                                        </div>

                                        <button
                                            className={estilos.btnDespacharProducto}
                                            onClick={() => despacharTodo(producto.id)}
                                            disabled={procesando || producto.cantidad_a_despachar === producto.cantidad_pendiente}
                                        >
                                            <ion-icon name="checkmark-outline"></ion-icon>
                                            <span>Despachar Todo</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloSeccion}>
                            <ion-icon name="create-outline"></ion-icon>
                            <span>Observaciones</span>
                        </h3>

                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Agrega cualquier observación sobre este despacho..."
                            className={estilos.textarea}
                            rows="4"
                            disabled={procesando}
                        />
                    </div>
                </div>

                <div className={estilos.columnaDerecha}>
                    <div className={`${estilos.resumen} ${estilos[tema]}`}>
                        <h3 className={estilos.tituloResumen}>Resumen de Despacho</h3>

                        <div className={estilos.resumenItem}>
                            <span>Total Productos:</span>
                            <strong>{productos.length}</strong>
                        </div>

                        <div className={estilos.resumenItem}>
                            <span>Unidades Pendientes:</span>
                            <strong>{calcularTotalPendiente()}</strong>
                        </div>

                        <div className={estilos.separador}></div>

                        <div className={`${estilos.resumenItem} ${estilos.destacado}`}>
                            <span>A Despachar Ahora:</span>
                            <strong>{calcularTotalADespachar()}</strong>
                        </div>

                        <div className={estilos.resumenItem}>
                            <span>Quedará Pendiente:</span>
                            <strong>{calcularTotalPendiente() - calcularTotalADespachar()}</strong>
                        </div>

                        <button
                            onClick={manejarDespacho}
                            disabled={procesando || calcularTotalADespachar() === 0}
                            className={estilos.btnProcesar}
                        >
                            {procesando ? (
                                <>
                                    <ion-icon name="hourglass-outline"></ion-icon>
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <span>Confirmar Despacho</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className={`${estilos.infoBox} ${estilos[tema]}`}>
                        <ion-icon name="information-circle-outline"></ion-icon>
                        <p>
                            Puedes despachar la cantidad que desees de cada producto. 
                            El sistema actualizará automáticamente las cantidades pendientes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}