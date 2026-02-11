"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { obtenerDetalleVenta } from './servidor'
import estilos from './ver.module.css'
import { formatCurrency } from '@/utils/monedaUtils'

export default function VerVentaAdmin() {
    const router = useRouter()
    const params = useParams()
    const ventaId = params.id
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [venta, setVenta] = useState(null)
    const [empresa, setEmpresa] = useState(null)
    const monedaEmpresa = empresa?.moneda || 'DOP'
    const localeEmpresa = empresa?.locale || 'es-DO'
    const simboloEmpresa = empresa?.simbolo_moneda || ''

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
        cargarDetalleVenta()
    }, [ventaId])

    const cargarDetalleVenta = async () => {
        try {
            const resultado = await obtenerDetalleVenta(ventaId)
            if (resultado.success) {
                setVenta(resultado.venta)
                setEmpresa(resultado.empresa)
            } else {
                alert(resultado.mensaje || 'Error al cargar venta')
                router.push('/admin/ventas')
            }
        } catch (error) {
            console.error('Error al cargar detalle de venta:', error)
            alert('Error al cargar datos de la venta')
            router.push('/admin/ventas')
        } finally {
            setCargando(false)
        }
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const formatearMoneda = (monto) => {
        return formatCurrency(monto, {
            currency: monedaEmpresa,
            locale: localeEmpresa,
            symbol: simboloEmpresa
        })
    }

    const getEstadoBadge = (estado) => {
        const estados = {
            emitida: { texto: 'Emitida', color: 'success' },
            anulada: { texto: 'Anulada', color: 'danger' },
            pendiente: { texto: 'Pendiente', color: 'warning' }
        }
        return estados[estado] || estados.emitida
    }

    const getMetodoPagoBadge = (metodo) => {
        const metodos = {
            efectivo: { texto: 'Efectivo', icono: 'cash-outline' },
            tarjeta_debito: { texto: 'Tarjeta Débito', icono: 'card-outline' },
            tarjeta_credito: { texto: 'Tarjeta Crédito', icono: 'card-outline' },
            transferencia: { texto: 'Transferencia', icono: 'swap-horizontal-outline' },
            cheque: { texto: 'Cheque', icono: 'document-text-outline' },
            mixto: { texto: 'Mixto', icono: 'wallet-outline' }
        }
        return metodos[metodo] || metodos.efectivo
    }

    const getTipoEntregaBadge = (tipo) => {
        const tipos = {
            completa: { texto: 'Entrega Completa', color: 'success', icono: 'checkmark-circle-outline' },
            parcial: { texto: 'Entrega Parcial', color: 'warning', icono: 'time-outline' }
        }
        return tipos[tipo] || tipos.completa
    }

    const getEstadoDespacho = (estado) => {
        const estados = {
            activo: { texto: 'Activo', color: 'success' },
            cerrado: { texto: 'Cerrado', color: 'info' },
            anulado: { texto: 'Anulado', color: 'danger' }
        }
        return estados[estado] || estados.activo
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando detalle de venta...</span>
                </div>
            </div>
        )
    }

    if (!venta) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>No se pudo cargar la venta</span>
                </div>
            </div>
        )
    }

    const estadoBadge = getEstadoBadge(venta.estado)
    const metodoPago = getMetodoPagoBadge(venta.metodo_pago)
    const tipoEntrega = getTipoEntregaBadge(venta.tipo_entrega)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Detalle de Venta</h1>
                    <p className={estilos.subtitulo}>Información completa del comprobante fiscal</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link
                        href={`/admin/ventas/imprimir/${venta.id}`}
                        className={estilos.btnImprimir}
                        target="_blank"
                    >
                        <ion-icon name="print-outline"></ion-icon>
                        <span>Imprimir</span>
                    </Link>
                    {venta.estado === 'emitida' && (
                        <Link
                            href={`/admin/ventas/editar/${venta.id}`}
                            className={estilos.btnEditar}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            <span>Editar</span>
                        </Link>
                    )}
                    {venta.tipo_entrega === 'parcial' && !venta.despacho_completo && venta.estado === 'emitida' && (
                        <Link
                            href={`/admin/ventas/despachar/${venta.id}`}
                            className={estilos.btnDespachar}
                        >
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>Despachar</span>
                        </Link>
                    )}
                    <button
                        className={estilos.btnVolver}
                        onClick={() => router.push('/admin/ventas')}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
                    </button>
                </div>
            </div>

            <div className={estilos.contenido}>
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader}>
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="document-text-outline"></ion-icon>
                            <span>Información del Comprobante</span>
                        </h2>
                        <span className={`${estilos.estadoBadge} ${estilos[estadoBadge.color]}`}>
                            {estadoBadge.texto}
                        </span>
                    </div>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <span className={estilos.label}>NCF</span>
                            <span className={estilos.valor}>{venta.ncf}</span>
                        </div>

                        <div className={estilos.campo}>
                            <span className={estilos.label}>Número Interno</span>
                            <span className={estilos.valor}>{venta.numero_interno}</span>
                        </div>

                        <div className={estilos.campo}>
                            <span className={estilos.label}>Tipo de Comprobante</span>
                            <span className={estilos.valor}>
                                {venta.tipo_comprobante_codigo} - {venta.tipo_comprobante_nombre}
                            </span>
                        </div>

                        <div className={estilos.campo}>
                            <span className={estilos.label}>Fecha de Emisión</span>
                            <span className={estilos.valor}>{formatearFecha(venta.fecha_venta)}</span>
                        </div>

                        <div className={estilos.campo}>
                            <span className={estilos.label}>Usuario que Emitió</span>
                            <span className={estilos.valor}>{venta.usuario_nombre}</span>
                        </div>

                        <div className={estilos.campo}>
                            <span className={estilos.label}>Método de Pago</span>
                            <div className={estilos.metodoPago}>
                                <ion-icon name={metodoPago.icono}></ion-icon>
                                <span>{metodoPago.texto}</span>
                            </div>
                        </div>

                        <div className={estilos.campo}>
                            <span className={estilos.label}>Tipo de Entrega</span>
                            <div className={`${estilos.tipoEntregaBadge} ${estilos[tipoEntrega.color]}`}>
                                <ion-icon name={tipoEntrega.icono}></ion-icon>
                                <span>{tipoEntrega.texto}</span>
                            </div>
                        </div>

                        {venta.tipo_entrega === 'parcial' && (
                            <div className={estilos.campo}>
                                <span className={estilos.label}>Estado de Despacho</span>
                                <div className={`${estilos.estadoDespachoGeneral} ${estilos[venta.despacho_completo ? 'completado' : 'pendiente']}`}>
                                    <ion-icon name={venta.despacho_completo ? "checkmark-done-outline" : "time-outline"}></ion-icon>
                                    <span>{venta.despacho_completo ? 'Completado' : 'Pendiente'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {venta.estado === 'anulada' && venta.razon_anulacion && (
                        <div className={`${estilos.alertaAnulada} ${estilos[tema]}`}>
                            <ion-icon name="warning-outline"></ion-icon>
                            <div>
                                <strong>Venta Anulada</strong>
                                <span>Razón: {venta.razon_anulacion}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={estilos.gridDosColumnas}>
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="business-outline"></ion-icon>
                            <span>Datos de la Empresa</span>
                        </h2>

                        <div className={estilos.datosEmpresa}>
                            <div className={estilos.campo}>
                                <span className={estilos.label}>Nombre Comercial</span>
                                <span className={estilos.valor}>{empresa.nombre_empresa}</span>
                            </div>

                            <div className={estilos.campo}>
                                <span className={estilos.label}>RNC</span>
                                <span className={estilos.valor}>{empresa.rnc}</span>
                            </div>

                            <div className={estilos.campo}>
                                <span className={estilos.label}>Dirección</span>
                                <span className={estilos.valor}>{empresa.direccion}</span>
                            </div>

                            {empresa.telefono && (
                                <div className={estilos.campo}>
                                    <span className={estilos.label}>Teléfono</span>
                                    <span className={estilos.valor}>{empresa.telefono}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="person-outline"></ion-icon>
                            <span>Datos del Cliente</span>
                        </h2>

                        {venta.cliente_id ? (
                            <div className={estilos.datosCliente}>
                                <div className={estilos.campo}>
                                    <span className={estilos.label}>Nombre</span>
                                    <span className={estilos.valor}>{venta.cliente_nombre}</span>
                                </div>

                                <div className={estilos.campo}>
                                    <span className={estilos.label}>Documento</span>
                                    <span className={estilos.valor}>
                                        {venta.cliente_tipo_documento}: {venta.cliente_numero_documento}
                                    </span>
                                </div>

                                {venta.cliente_telefono && (
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Teléfono</span>
                                        <span className={estilos.valor}>{venta.cliente_telefono}</span>
                                    </div>
                                )}

                                {venta.cliente_email && (
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Email</span>
                                        <span className={estilos.valor}>{venta.cliente_email}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={estilos.sinCliente}>
                                <ion-icon name="person-outline"></ion-icon>
                                <span>Consumidor Final</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <h2 className={estilos.seccionTitulo}>
                        <ion-icon name="list-outline"></ion-icon>
                        <span>Productos de la Venta</span>
                    </h2>

                    <div className={estilos.tabla}>
                        <div className={estilos.tablaHeader}>
                            <div className={estilos.columna}>Producto</div>
                            <div className={estilos.columna}>Cantidad</div>
                            {venta.tipo_entrega === 'parcial' && (
                                <>
                                    <div className={estilos.columna}>Despachado</div>
                                    <div className={estilos.columna}>Pendiente</div>
                                </>
                            )}
                            <div className={estilos.columna}>Precio Unit.</div>
                            <div className={estilos.columna}>Subtotal</div>
                            <div className={estilos.columna}>ITBIS</div>
                            <div className={estilos.columna}>Total</div>
                        </div>

                        <div className={estilos.tablaBody}>
                            {venta.productos.map((producto, index) => (
                                <div key={index} className={estilos.fila}>
                                    <div className={estilos.columna}>
                                        <div className={estilos.productoInfo}>
                                            <span className={estilos.productoNombre}>
                                                {producto.nombre_producto}
                                            </span>
                                            <span className={estilos.productoCodigo}>
                                                Código: {producto.codigo_barras || producto.sku || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={estilos.columna}>
                                        <span className={estilos.cantidad}>{producto.cantidad}</span>
                                    </div>
                                    {venta.tipo_entrega === 'parcial' && (
                                        <>
                                            <div className={estilos.columna}>
                                                <span className={estilos.cantidadDespachada}>{producto.cantidad_despachada}</span>
                                            </div>
                                            <div className={estilos.columna}>
                                                <span className={estilos.cantidadPendiente}>{producto.cantidad_pendiente}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className={estilos.columna}>
                                        <span className={estilos.precio}>
                                            {formatearMoneda(producto.precio_unitario)}
                                        </span>
                                    </div>
                                    <div className={estilos.columna}>
                                        <span className={estilos.monto}>
                                            {formatearMoneda(producto.subtotal)}
                                        </span>
                                    </div>
                                    <div className={estilos.columna}>
                                        <span className={estilos.monto}>
                                            {formatearMoneda(producto.itbis)}
                                        </span>
                                    </div>
                                    <div className={estilos.columna}>
                                        <span className={estilos.montoTotal}>
                                            {formatearMoneda(producto.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {venta.tipo_entrega === 'parcial' && venta.despachos && venta.despachos.length > 0 && (
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>Historial de Despachos</span>
                        </h2>

                        <div className={estilos.despachosLista}>
                            {venta.despachos.map((despacho) => {
                                const estadoDespacho = getEstadoDespacho(despacho.estado)
                                return (
                                    <div key={despacho.id} className={`${estilos.despachoCard} ${estilos[tema]}`}>
                                        <div className={estilos.despachoHeader}>
                                            <div className={estilos.despachoTitulo}>
                                                <ion-icon name="cube-outline"></ion-icon>
                                                <span>Despacho #{despacho.numero_despacho}</span>
                                            </div>
                                            <span className={`${estilos.despachoEstadoBadge} ${estilos[estadoDespacho.color]}`}>
                                                {estadoDespacho.texto}
                                            </span>
                                        </div>

                                        <div className={estilos.despachoInfo}>
                                            <div className={estilos.despachoInfoItem}>
                                                <ion-icon name="calendar-outline"></ion-icon>
                                                <div>
                                                    <span className={estilos.despachoLabel}>Fecha</span>
                                                    <span className={estilos.despachoValor}>{formatearFecha(despacho.fecha_despacho)}</span>
                                                </div>
                                            </div>

                                            <div className={estilos.despachoInfoItem}>
                                                <ion-icon name="person-outline"></ion-icon>
                                                <div>
                                                    <span className={estilos.despachoLabel}>Usuario</span>
                                                    <span className={estilos.despachoValor}>{despacho.usuario_nombre}</span>
                                                </div>
                                            </div>

                                            {despacho.observaciones && (
                                                <div className={estilos.despachoInfoItem}>
                                                    <ion-icon name="chatbox-outline"></ion-icon>
                                                    <div>
                                                        <span className={estilos.despachoLabel}>Observaciones</span>
                                                        <span className={estilos.despachoValor}>{despacho.observaciones}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className={estilos.despachoProductos}>
                                            <h4>Productos Despachados:</h4>
                                            <div className={estilos.productosDespachadosLista}>
                                                {despacho.productos.map((prod) => (
                                                    <div key={prod.id} className={estilos.productoDespachadoItem}>
                                                        <span className={estilos.nombreProductoDesp}>{prod.nombre_producto}</span>
                                                        <span className={estilos.cantidadProductoDesp}>{prod.cantidad_despachada} unidades</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className={estilos.gridResumen}>
                    {venta.metodo_pago === 'efectivo' && venta.efectivo_recibido && (
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h2 className={estilos.seccionTitulo}>
                                <ion-icon name="cash-outline"></ion-icon>
                                <span>Información de Pago</span>
                            </h2>

                            <div className={estilos.infoPago}>
                                <div className={estilos.lineaPago}>
                                    <span>Efectivo Recibido:</span>
                                    <strong>{formatearMoneda(venta.efectivo_recibido)}</strong>
                                </div>
                                <div className={estilos.lineaPago}>
                                    <span>Total a Pagar:</span>
                                    <strong>{formatearMoneda(venta.total)}</strong>
                                </div>
                                <div className={estilos.separadorPago}></div>
                                <div className={`${estilos.lineaPago} ${estilos.cambio}`}>
                                    <span>Cambio:</span>
                                    <strong>{formatearMoneda(venta.cambio)}</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="calculator-outline"></ion-icon>
                            <span>Resumen de Totales</span>
                        </h2>

                        <div className={estilos.resumenTotales}>
                            <div className={estilos.lineaTotal}>
                                <span>Subtotal:</span>
                                <span>{formatearMoneda(venta.subtotal)}</span>
                            </div>

                            {parseFloat(venta.descuento) > 0 && (
                                <div className={estilos.lineaTotal}>
                                    <span>Descuento:</span>
                                    <span className={estilos.descuento}>
                                        - {formatearMoneda(venta.descuento)}
                                    </span>
                                </div>
                            )}

                            <div className={estilos.lineaTotal}>
                                <span>Monto Gravado:</span>
                                <span>{formatearMoneda(venta.monto_gravado)}</span>
                            </div>

                            <div className={estilos.lineaTotal}>
                                <span>{empresa.impuesto_nombre} ({empresa.impuesto_porcentaje}%):</span>
                                <span>{formatearMoneda(venta.itbis)}</span>
                            </div>

                            <div className={estilos.separadorTotal}></div>

                            <div className={`${estilos.lineaTotal} ${estilos.totalFinal}`}>
                                <span>Total:</span>
                                <span>{formatearMoneda(venta.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {venta.notas && (
                    <div className={`${estilos.seccion} ${estilos[tema]}`}>
                        <h2 className={estilos.seccionTitulo}>
                            <ion-icon name="chatbox-outline"></ion-icon>
                            <span>Notas</span>
                        </h2>
                        <div className={estilos.notasContenido}>
                            <p>{venta.notas}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}