"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { obtenerDetalleCompra, anularCompra } from './servidor'
import estilos from './ver.module.css'

export default function VerCompraAdmin() {
    const router = useRouter()
    const params = useParams()
    const compraId = params.id
    
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
                alert(resultado.mensaje || 'Error al cargar compra')
                router.push('/admin/compras')
            }
        } catch (error) {
            console.error('Error al cargar compra:', error)
            alert('Error al cargar datos')
            router.push('/admin/compras')
        } finally {
            setCargando(false)
        }
    }

    const manejarAnular = async () => {
        const razon = prompt(`Ingresa la razon de anulacion para la compra ${compra.ncf}:`)
        
        if (!razon || razon.trim() === '') {
            alert('Debes proporcionar una razon para anular la compra')
            return
        }

        if (!confirm(`Estas seguro de anular la compra ${compra.ncf}? Esta accion no se puede deshacer.`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await anularCompra(compraId)
            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarCompra()
            } else {
                alert(resultado.mensaje || 'Error al anular compra')
            }
        } catch (error) {
            console.error('Error al anular compra:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarImprimir = () => {
        window.print()
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto)
    }

    const getMetodoPagoBadge = (metodo) => {
        const metodos = {
            efectivo: { texto: 'Efectivo', color: 'efectivo' },
            tarjeta_debito: { texto: 'Tarjeta Debito', color: 'tarjeta' },
            tarjeta_credito: { texto: 'Tarjeta Credito', color: 'tarjeta' },
            transferencia: { texto: 'Transferencia', color: 'transferencia' },
            cheque: { texto: 'Cheque', color: 'cheque' },
            mixto: { texto: 'Mixto', color: 'mixto' }
        }
        return metodos[metodo] || metodos.efectivo
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando compra...</span>
                </div>
            </div>
        )
    }

    if (!compra) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>Compra no encontrada</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.header} ${estilos.noPrint}`}>
                <div>
                    <h1 className={estilos.titulo}>Detalles de Compra</h1>
                    <p className={estilos.subtitulo}>Informacion completa de la compra</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button
                        type="button"
                        onClick={manejarImprimir}
                        className={estilos.btnImprimir}
                        disabled={procesando}
                    >
                        <ion-icon name="print-outline"></ion-icon>
                        <span>Imprimir</span>
                    </button>
                    {compra.estado === 'recibida' && (
                        <>
                            <Link
                                href={`/admin/compras/editar/${compra.id}`}
                                className={estilos.btnEditar}
                            >
                                <ion-icon name="create-outline"></ion-icon>
                                <span>Editar</span>
                            </Link>
                            <button
                                type="button"
                                onClick={manejarAnular}
                                className={estilos.btnAnular}
                                disabled={procesando}
                            >
                                <ion-icon name="close-circle-outline"></ion-icon>
                                <span>Anular</span>
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() => router.push('/admin/compras')}
                        className={estilos.btnVolver}
                        disabled={procesando}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
                    </button>
                </div>
            </div>

            <div className={estilos.contenido}>
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}>Informacion General</h2>
                        <span className={`${estilos.estadoBadge} ${estilos[compra.estado]}`}>
                            {compra.estado === 'recibida' ? 'Recibida' : compra.estado === 'anulada' ? 'Anulada' : 'Pendiente'}
                        </span>
                    </div>

                    <div className={estilos.infoGrid}>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>NCF:</span>
                            <span className={estilos.infoValor}>{compra.ncf}</span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>Tipo Comprobante:</span>
                            <span className={estilos.infoValor}>{compra.tipo_comprobante_nombre}</span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>Proveedor:</span>
                            <span className={estilos.infoValor}>{compra.proveedor_nombre}</span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>RNC Proveedor:</span>
                            <span className={estilos.infoValor}>{compra.proveedor_rnc}</span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>Fecha:</span>
                            <span className={estilos.infoValor}>{formatearFecha(compra.fecha_compra)}</span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>Metodo de Pago:</span>
                            <span className={`${estilos.metodoBadge} ${estilos[getMetodoPagoBadge(compra.metodo_pago).color]}`}>
                                {getMetodoPagoBadge(compra.metodo_pago).texto}
                            </span>
                        </div>
                        <div className={estilos.infoItem}>
                            <span className={estilos.infoLabel}>Usuario:</span>
                            <span className={estilos.infoValor}>{compra.usuario_nombre}</span>
                        </div>
                        {compra.notas && (
                            <div className={`${estilos.infoItem} ${estilos.full}`}>
                                <span className={estilos.infoLabel}>Notas:</span>
                                <span className={estilos.infoValor}>{compra.notas}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <h2 className={estilos.panelTitulo}>Productos</h2>

                    <div className={estilos.tablaProductos}>
                        <div className={`${estilos.tablaHeader} ${estilos[tema]}`}>
                            <div className={estilos.columna}>Producto</div>
                            <div className={estilos.columna}>Cantidad</div>
                            <div className={estilos.columna}>Precio Unitario</div>
                            <div className={estilos.columna}>Subtotal</div>
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
                        <h2 className={estilos.panelTitulo}>Movimientos de Inventario</h2>
                        
                        {compra.movimientos && compra.movimientos.length > 0 ? (
                            <div className={estilos.listaMovimientos}>
                                {compra.movimientos.map((mov, index) => (
                                    <div key={index} className={`${estilos.movimientoItem} ${estilos[tema]}`}>
                                        <div className={estilos.movimientoInfo}>
                                            <span className={`${estilos.tipoMovimiento} ${estilos[mov.tipo]}`}>
                                                {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                                            </span>
                                            <span className={estilos.productoMovimiento}>{mov.producto_nombre}</span>
                                        </div>
                                        <div className={estilos.movimientoDetalle}>
                                            <span>Cantidad: {mov.cantidad}</span>
                                            <span>Stock: {mov.stock_anterior} → {mov.stock_nuevo}</span>
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
                                <span>No hay movimientos registrados</span>
                            </div>
                        )}
                    </div>

                    <div className={`${estilos.panel} ${estilos[tema]} ${estilos.panelTotales}`}>
                        <h2 className={estilos.panelTitulo}>Resumen</h2>
                        
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