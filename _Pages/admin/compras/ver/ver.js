"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerDetalleCompra, anularCompra } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './ver.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function VerCompraAdmin() {
    const router = useRouter()
    const params = useParams()
    const compraId = params.id
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [compra, setCompra] = useState(null)

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
        cargarCompra()
    }, [])

    const cargarCompra = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerDetalleCompra(compraId)
            if (resultado.success) {
                setCompra(resultado.compra)
            } else {
                alert(resultado.mensaje || tr('Error al cargar compra', 'Error loading purchase'))
                router.push('/admin/compras')
            }
        } catch (error) {
            console.error('Error al cargar compra:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
            router.push('/admin/compras')
        } finally {
            setCargando(false)
        }
    }

    const manejarAnular = async () => {
        const razon = prompt(tr(`Ingresa la razon de anulacion para la compra ${compra.ncf}:`, `Enter cancellation reason for purchase ${compra.ncf}:`))
        
        if (!razon || razon.trim() === '') {
            alert(tr('Debes proporcionar una razon para anular la compra', 'You must provide a reason to cancel this purchase'))
            return
        }

        if (!confirm(tr(`Estas seguro de anular la compra ${compra.ncf}? Esta accion no se puede deshacer.`, `Are you sure you want to cancel purchase ${compra.ncf}? This action cannot be undone.`))) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await anularCompra(compraId)
            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarCompra()
            } else {
                alert(resultado.mensaje || tr('Error al anular compra', 'Error canceling purchase'))
            }
        } catch (error) {
            console.error('Error al anular compra:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const getMetodoPagoBadge = (metodo) => {
        const metodos = {
            efectivo: { texto: tr('Efectivo', 'Cash'), color: 'efectivo' },
            tarjeta_debito: { texto: tr('Tarjeta Debito', 'Debit Card'), color: 'tarjeta' },
            tarjeta_credito: { texto: tr('Tarjeta Credito', 'Credit Card'), color: 'tarjeta' },
            transferencia: { texto: tr('Transferencia', 'Transfer'), color: 'transferencia' },
            cheque: { texto: tr('Cheque', 'Check'), color: 'cheque' },
            mixto: { texto: tr('Mixto', 'Mixed'), color: 'mixto' }
        }
        return metodos[metodo] || metodos.efectivo
    }

    if (cargando) {
        return <LoadingScreen />
    }

    if (!compra) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>{tr('Compra no encontrada', 'Purchase not found')}</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.header} ${estilos.noPrint}`}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Detalles de Compra', 'Purchase Details')}</h1>
                    <p className={estilos.subtitulo}>{tr('Informacion completa de la compra', 'Complete purchase information')}</p>
                </div>
                <div className={estilos.headerAcciones}>
                    {compra.estado === 'recibida' && (
                        <button
                            type="button"
                            onClick={manejarAnular}
                            className={estilos.btnAnular}
                            disabled={procesando}
                        >
                            <ion-icon name="close-circle-outline"></ion-icon>
                            <span>{tr('Anular', 'Cancel')}</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => router.push('/admin/compras')}
                        className={estilos.btnVolver}
                        disabled={procesando}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>{tr('Volver', 'Back')}</span>
                    </button>
                </div>
            </div>

            <div className={estilos.contenido}>
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>{tr('Informacion General', 'General Information')}</h2>
                        <span className={`${estilos.estadoBadge} ${estilos[compra.estado]}`}>
                            {compra.estado === 'recibida' ? tr('Recibida', 'Received') : compra.estado === 'anulada' ? tr('Anulada', 'Canceled') : tr('Pendiente', 'Pending')}
                        </span>
                    </div>

                    <div className={estilos.infoGrid}>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>NCF:</span>
                            <span className={estilos.infoValor}>{compra.ncf}</span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>{tr('Tipo Comprobante:', 'Voucher Type:')}</span>
                            <span className={estilos.infoValor}>{compra.tipo_comprobante_nombre}</span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>{tr('Proveedor:', 'Supplier:')}</span>
                            <span className={estilos.infoValor}>{compra.proveedor_nombre}</span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>{tr('RNC Proveedor:', 'Supplier RNC:')}</span>
                            <span className={estilos.infoValor}>{compra.proveedor_rnc}</span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>{tr('Fecha:', 'Date:')}</span>
                            <span className={estilos.infoValor}>{formatearFecha(compra.fecha_compra)}</span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>{tr('Metodo de Pago:', 'Payment Method:')}</span>
                            <span className={`${estilos.metodoBadge} ${estilos[getMetodoPagoBadge(compra.metodo_pago).color]}`}>
                                {getMetodoPagoBadge(compra.metodo_pago).texto}
                            </span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>{tr('Usuario:', 'User:')}</span>
                            <span className={estilos.infoValor}>{compra.usuario_nombre}</span>
                        </div>
                        {compra.notas && (
                            <div className={`${estilos.infoItem} ${estilos.full}`}>
                                <span className={estilos.infoLabel}>{tr('Notas:', 'Notes:')}</span>
                                <span className={estilos.infoValor}>{compra.notas}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <h2 className={estilos.panelTitulo}>{tr('Productos', 'Products')}</h2>

                    <div className={estilos.tablaProductos}>
                        <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                            <div className={estilos.columna}>{tr('Producto', 'Product')}</div>
                            <div className={estilos.columna}>{tr('Cantidad', 'Quantity')}</div>
                            <div className={estilos.columna}>{tr('Precio Unitario', 'Unit Price')}</div>
                            <div className={estilos.columna}>{tr('Subtotal', 'Subtotal')}</div>
                        </div>
                        <div className={estilos.tablaBody}>
                            {compra.detalles.map((detalle, index) => (
                                <div key={index} className={`${estilos.fila} ${estilos[tema]}`}>
                                    <div className={estilos.columna}>
                                        <span className={estilos.productoNombre}>{detalle.producto_nombre}</span>
                                        {detalle.producto_codigo && (
                                            <span className={estilos.productoCodigo}>{detalle.producto_codigo}</span>
                                        )}
                                    </div>
                                    <div className={estilos.columna}>
                                        <span className={estilos.cantidad}>{detalle.cantidad}</span>
                                    </div>
                                    <div className={estilos.columna}>
                                        <span className={estilos.precio}>{formatearMoneda(detalle.precio_unitario)}</span>
                                    </div>
                                    <div className={estilos.columna}>
                                        <span className={estilos.subtotal}>{formatearMoneda(detalle.subtotal)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={estilos.filaResumen}>
                    <div className={`${estilos.panel} ${estilos[tema]} ${estilos.panelMovimientos}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Movimientos de Inventario', 'Inventory Movements')}</h2>
                        
                        {compra.movimientos && compra.movimientos.length > 0 ? (
                            <div className={estilos.listaMovimientos}>
                                {compra.movimientos.map((mov, index) => (
                                    <div key={index} className={`${estilos.movimientoItem} ${estilos[tema]}`}>
                                        <div className={estilos.movimientoInfo}>
                                            <span className={`${estilos.tipoMovimiento} ${estilos[mov.tipo]}`}>
                                                {mov.tipo === 'entrada' ? tr('Entrada', 'Input') : tr('Salida', 'Output')}
                                            </span>
                                            <span className={estilos.productoMovimiento}>{mov.producto_nombre}</span>
                                        </div>
                                        <div className={estilos.movimientoDetalle}>
                                            <span>{tr('Cantidad:', 'Quantity:')} {mov.cantidad}</span>
                                            <span>{tr('Stock:', 'Stock:')} {mov.stock_anterior} → {mov.stock_nuevo}</span>
                                            <span className={estilos.fechaMovimiento}>
                                                {formatearFecha(mov.fecha_movimiento)}
                                            </span>
                                        </div>
                                        {mov.notas && (
                                            <span className={estilos.notasMovimiento}>{mov.notas}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={estilos.sinMovimientos}>
                                <ion-icon name="file-tray-outline"></ion-icon>
                                <span>{tr('No hay movimientos registrados', 'No movements recorded')}</span>
                            </div>
                        )}
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]} ${estilos.panelTotales}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Resumen', 'Summary')}</h2>
                        
                        <div className={estilos.totales}>
                            <div className={estilos.totalItem}>
                                <span>Subtotal:</span>
                                <span>{formatearMoneda(compra.subtotal)}</span>
                            </div>
                            <div className={estilos.totalItem}>
                                <span>ITBIS (18%):</span>
                                <span>{formatearMoneda(compra.itbis)}</span>
                            </div>
                            <div className={`${estilos.totalItem} ${estilos.totalFinal}`}>
                                <span>Total:</span>
                                <span>{formatearMoneda(compra.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}