"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerCotizacionPorId, actualizarEstadoCotizacion, convertirCotizacionAVenta, obtenerDatosEmpresa } from './servidor'
import HistorialCotizacion from '../historial/historial'
import { crearFormateadorMoneda, obtenerTextoEstado, puedeEditar, puedeConvertir, esVencida } from '../lib'
import { getEstadoBadge } from '../constants'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './ver.module.css'

export default function VerCotizacionAdmin({ id: propId }) {
    const router = useRouter()
    const params = useParams()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [cotizacion, setCotizacion] = useState(null)
    const [detalle, setDetalle] = useState([])
    const [tabActivo, setTabActivo] = useState('detalle')
    const [procesando, setProcesando] = useState(false)
    const [empresa, setEmpresa] = useState(null)
    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'
    const formateadorMoneda = crearFormateadorMoneda(language, monedaEmpresa, localeEmpresa)
    const fmtMoneda = (v) => formateadorMoneda.format(v || 0)

    // Obtener ID desde props o params
    const cotizacionId = propId || params?.id

    // Detectar tema
    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            setTema(localStorage.getItem('tema') || 'light')
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)
        cargarEmpresa()

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    // Cargar datos del cotización
    useEffect(() => {
        if (cotizacionId) {
            cargarDetalle(cotizacionId)
        }
    }, [cotizacionId])

    const cargarDetalle = async (id) => {
        setCargando(true)
        try {
            const res = await obtenerCotizacionPorId(id)
            if (res.success) {
                setCotizacion(res.cotizacion)
                setDetalle(res.detalle)
            } else {
                alert(res.mensaje || tr('No se pudo cargar la cotizacion', 'Quote could not be loaded'))
                router.push('/admin/cotizaciones')
            }
        } catch (error) {
            console.error('Error:', error)
            alert(tr('Error al cargar cotizacion', 'Error loading quote'))
            router.push('/admin/cotizaciones')
        } finally {
            setCargando(false)
        }
    }

    const manejarCambioEstado = async (nuevoEstado) => {
        if (!confirm(tr(`¿Desea cambiar el estado a "${obtenerTextoEstado(nuevoEstado, language)}"?`, `Do you want to change the status to "${obtenerTextoEstado(nuevoEstado, language)}"?`))) return
        
        setProcesando(true)
        try {
            const res = await actualizarEstadoCotizacion(cotizacion.id, nuevoEstado)
            if (res.success) {
                await cargarDetalle(cotizacion.id)
            } else {
                alert(res.mensaje)
            }
        } catch (error) {
            alert(tr('Error al cambiar estado', 'Error changing status'))
        } finally {
            setProcesando(false)
        }
    }

    const manejarConvertirVenta = async () => {
        if (!confirm(tr('¿Desea convertir esta cotizacion en una venta? El formulario de venta se pre-cargara con estos productos.', 'Do you want to convert this quote into a sale? The sale form will be preloaded with these products.'))) return

        setProcesando(true)
        try {
            const res = await convertirCotizacionAVenta(cotizacion.id)
            if (res.success) {
                if (res.productosSinStock && res.productosSinStock.length > 0) {
                    alert(tr(`Atencion: Algunos productos no tienen stock suficiente:\n${res.productosSinStock.map(p => `- ${p.nombre}: Disponible ${p.stock_disponible}, Requerido ${p.cantidad_requerida}`).join('\n')}`, `Warning: Some products do not have enough stock:\n${res.productosSinStock.map(p => `- ${p.nombre}: Available ${p.stock_disponible}, Required ${p.cantidad_requerida}`).join('\n')}`))
                }
                localStorage.setItem('cotizacion_venta_precarga', JSON.stringify(res.data))
                router.push('/admin/ventas/nueva')
            } else {
                alert(res.mensaje || tr('Error al convertir la cotizacion', 'Error converting quote'))
            }
        } catch (error) {
            alert(tr('Error al procesar la conversion', 'Error processing conversion'))
        } finally {
            setProcesando(false)
        }
    }


    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.loaderSpinner}></div>
                    <span>{tr('Cargando cotizacion...', 'Loading quote...')}</span>
                </div>
            </div>
        )
    }

    if (!cotizacion) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* HEADER MEJORADO */}
            <div className={estilos.header}>
                <button
                    className={estilos.btnVolver}
                    onClick={() => router.push('/admin/cotizaciones')}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                </button>
                <div className={estilos.headerInfo}>
                    <h1>{tr('Cotizacion', 'Quote')} {cotizacion.numero_cotizacion}</h1>
                    <p>{cotizacion.cliente_nombre || tr('Consumidor Final', 'Final Consumer')}</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button
                        onClick={() => router.push(`/admin/cotizaciones/${cotizacion.id}/imprimir`)}
                        className={estilos.btnHeaderAccion}
                        title={tr('Imprimir', 'Print')}
                    >
                        <ion-icon name="print-outline"></ion-icon>
                    </button>
                </div>
            </div>

            {/* BADGE DE ESTADO Y ALERTAS */}
            <div className={estilos.estadoBar}>
                <span className={`${estilos.badge} ${getEstadoBadge(cotizacion.estado, estilos)}`}>
                    {obtenerTextoEstado(cotizacion.estado, language)}
                </span>
                {esVencida(cotizacion.fecha_vencimiento) && cotizacion.estado !== 'vencida' && (
                    <span className={estilos.vencidaAlerta}>
                        <ion-icon name="warning-outline"></ion-icon>
                        {tr('Vencida', 'Expired')}
                    </span>
                )}
            </div>

            {/* ACCIONES PRINCIPALES */}
            <div className={estilos.accionesPrincipales}>
                {cotizacion.estado === 'aprobada' && puedeConvertir(cotizacion.estado) && (
                    <button 
                        onClick={manejarConvertirVenta} 
                        className={`${estilos.btnAccion} ${estilos.btnConvertir}`}
                        disabled={procesando}
                    >
                        <div className={estilos.btnIcono}>
                            <ion-icon name="cart-outline"></ion-icon>
                        </div>
                        <div className={estilos.btnTexto}>
                            <span className={estilos.btnLabel}>{tr('Facturar / Vender', 'Invoice / Sell')}</span>
                            <span className={estilos.btnSubLabel}>{tr('Convertir a venta', 'Convert to sale')}</span>
                        </div>
                    </button>
                )}
                {['aprobada', 'convertida'].includes(cotizacion.estado) && (
                    <button
                        onClick={() => router.push(`/admin/conduces/crear?origen=cotizacion&numero=${cotizacion.numero_cotizacion}`)}
                        className={`${estilos.btnAccion} ${estilos.btnConduce}`}
                    >
                        <div className={estilos.btnIcono}>
                            <ion-icon name="cube-outline"></ion-icon>
                        </div>
                        <div className={estilos.btnTexto}>
                            <span className={estilos.btnLabel}>{tr('Generar Conduce', 'Generate Delivery Note')}</span>
                            <span className={estilos.btnSubLabel}>{tr('Crear guia de envio', 'Create shipping guide')}</span>
                        </div>
                    </button>
                )}
                {cotizacion.estado === 'borrador' && (
                    <button 
                        onClick={() => manejarCambioEstado('enviada')} 
                        className={`${estilos.btnAccion} ${estilos.btnEnviar}`}
                        disabled={procesando}
                    >
                        <div className={estilos.btnIcono}>
                            <ion-icon name="send-outline"></ion-icon>
                        </div>
                        <div className={estilos.btnTexto}>
                            <span className={estilos.btnLabel}>{tr('Marcar como Enviada', 'Mark as Sent')}</span>
                            <span className={estilos.btnSubLabel}>{tr('Enviar al cliente', 'Send to customer')}</span>
                        </div>
                    </button>
                )}
                {['borrador', 'enviada'].includes(cotizacion.estado) && (
                    <button 
                        onClick={() => manejarCambioEstado('aprobada')} 
                        className={`${estilos.btnAccion} ${estilos.btnAprobar}`}
                        disabled={procesando}
                    >
                        <div className={estilos.btnIcono}>
                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                        </div>
                        <div className={estilos.btnTexto}>
                            <span className={estilos.btnLabel}>{tr('Aprobar', 'Approve')}</span>
                            <span className={estilos.btnSubLabel}>{tr('Aprobar cotizacion', 'Approve quote')}</span>
                        </div>
                    </button>
                )}
                {puedeEditar(cotizacion.estado) && (
                    <button
                        onClick={() => router.push(`/admin/cotizaciones/${cotizacion.id}/editar`)}
                        className={`${estilos.btnAccion} ${estilos.btnEditar}`}
                    >
                        <div className={estilos.btnIcono}>
                            <ion-icon name="create-outline"></ion-icon>
                        </div>
                        <div className={estilos.btnTexto}>
                            <span className={estilos.btnLabel}>{tr('Editar', 'Edit')}</span>
                            <span className={estilos.btnSubLabel}>{tr('Modificar cotizacion', 'Modify quote')}</span>
                        </div>
                    </button>
                )}
            </div>

            {/* TABS */}
            <div className={estilos.tabs}>
                <button
                    className={`${estilos.tab} ${tabActivo === 'detalle' ? estilos.tabActiva : ''}`}
                    onClick={() => setTabActivo('detalle')}
                >
                    <ion-icon name="document-text-outline"></ion-icon>
                    <span>{tr('Detalle', 'Details')}</span>
                </button>
                <button
                    className={`${estilos.tab} ${tabActivo === 'historial' ? estilos.tabActiva : ''}`}
                    onClick={() => setTabActivo('historial')}
                >
                    <ion-icon name="time-outline"></ion-icon>
                    <span>{tr('Historial', 'History')}</span>
                </button>
            </div>

            {/* CONTENIDO DE TABS */}
            {tabActivo === 'detalle' && (
                <div className={estilos.layoutPrincipal}>
                    {/* COLUMNA IZQUIERDA - INFORMACIÓN */}
                    <div className={estilos.columnaIzquierda}>
                        {/* INFORMACIÓN GENERAL DEL CLIENTE */}
                        <div className={estilos.cardInfo}>
                            <h3 className={estilos.cardTitulo}>
                                <ion-icon name="person-circle-outline"></ion-icon>
                                {tr('Informacion del Cliente', 'Customer Information')}
                            </h3>
                            
                            {/* Header con Avatar */}
                            <div className={estilos.clienteHeader}>
                                <div className={estilos.avatarContenedor}>
                                    {cotizacion.cliente_foto ? (
                                        <img
                                            src={cotizacion.cliente_foto}
                                            alt={cotizacion.cliente_nombre || tr('Cliente', 'Customer')}
                                            className={estilos.avatar}
                                        />
                                    ) : (
                                        <div className={estilos.avatarPlaceholder}>
                                            <ion-icon name="person-outline"></ion-icon>
                                        </div>
                                    )}
                                </div>
                                <div className={estilos.clienteInfoBasica}>
                                    <h4 className={estilos.clienteNombre}>
                                        {cotizacion.cliente_nombre || tr('Consumidor Final', 'Final Consumer')}
                                    </h4>
                                    <p className={estilos.clienteDocumento}>
                                        {cotizacion.cliente_tipo_documento_codigo || cotizacion.cliente_tipo_documento_nombre || 'N/A'}: {cotizacion.cliente_documento || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Grid de Información */}
                            <div className={estilos.infoGrid}>
                                <div className={estilos.infoItem}>
                                    <div className={estilos.infoItemIcon}>
                                        <ion-icon name="call-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.infoItemContent}>
                                        <span className={estilos.infoLabel}>{tr('Telefono', 'Phone')}</span>
                                        <span className={estilos.infoValor}>
                                            {cotizacion.cliente_telefono || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                {cotizacion.cliente_email && (
                                    <div className={estilos.infoItem}>
                                        <div className={estilos.infoItemIcon}>
                                            <ion-icon name="mail-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.infoItemContent}>
                                            <span className={estilos.infoLabel}>{tr('Email', 'Email')}</span>
                                            <span className={estilos.infoValor}>
                                                {cotizacion.cliente_email}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {cotizacion.cliente_direccion && (
                                    <div className={estilos.infoItem}>
                                        <div className={estilos.infoItemIcon}>
                                            <ion-icon name="location-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.infoItemContent}>
                                            <span className={estilos.infoLabel}>{tr('Direccion', 'Address')}</span>
                                            <span className={estilos.infoValor}>
                                                {cotizacion.cliente_direccion}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className={estilos.infoItem}>
                                    <div className={estilos.infoItemIcon}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.infoItemContent}>
                                        <span className={estilos.infoLabel}>{tr('Fecha Emision', 'Issue Date')}</span>
                                        <span className={estilos.infoValor}>
                                            {new Date(cotizacion.fecha_emision).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <div className={estilos.infoItem}>
                                    <div className={estilos.infoItemIcon}>
                                        <ion-icon name="time-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.infoItemContent}>
                                        <span className={estilos.infoLabel}>{tr('Fecha Vencimiento', 'Due Date')}</span>
                                        <span className={`${estilos.infoValor} ${esVencida(cotizacion.fecha_vencimiento) ? estilos.vencida : ''}`}>
                                            {new Date(cotizacion.fecha_vencimiento).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRODUCTOS */}
                        <div className={estilos.cardInfo}>
                            <h3 className={estilos.cardTitulo}>
                                <ion-icon name="cube-outline"></ion-icon>
                                {tr('Productos', 'Products')} ({detalle.length})
                            </h3>
                            
                            {/* Tabla para desktop */}
                            <div className={estilos.tablaContenedor}>
                                <table className={estilos.tabla}>
                                    <thead>
                                        <tr>
                                            <th>{tr('Producto', 'Product')}</th>
                                            <th style={{ textAlign: 'center' }}>{tr('Cantidad', 'Quantity')}</th>
                                            <th style={{ textAlign: 'right' }}>{tr('Precio Unit.', 'Unit Price')}</th>
                                            <th style={{ textAlign: 'right' }}>{tr('Total', 'Total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalle.map((item, idx) => (
                                            <tr key={idx} className={estilos.filaProducto}>
                                                <td>
                                                    <div className={estilos.productoInfo}>
                                                        <div className={estilos.productoImagen}>
                                                            {item.producto_imagen ? (
                                                                <img 
                                                                    src={item.producto_imagen} 
                                                                    alt={item.nombre_producto}
                                                                    className={estilos.productoImagenImg}
                                                                />
                                                            ) : (
                                                                <div className={estilos.productoIcono}>
                                                                    <ion-icon name="cube-outline"></ion-icon>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={estilos.productoDetalles}>
                                                            <div className={estilos.productoNombre}>{item.nombre_producto}</div>
                                                            {item.descripcion_producto && (
                                                                <div className={estilos.productoDescripcion}>
                                                                    {item.descripcion_producto}
                                                                </div>
                                                            )}
                                                            {item.codigo_barras && (
                                                                <div className={estilos.productoCodigo}>
                                                                    <ion-icon name="barcode-outline"></ion-icon>
                                                                    {item.codigo_barras}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={estilos.cantidadCell}>
                                                    <span className={estilos.cantidadBadge}>{item.cantidad}</span>
                                                </td>
                                                <td className={estilos.precioCell}>
                                                    <span className={estilos.precioUnitario}>{fmtMoneda(item.precio_unitario)}</span>
                                                </td>
                                                <td className={estilos.totalCell}>
                                                    <span className={estilos.totalProducto}>{fmtMoneda(item.total)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Cards para móviles */}
                            <div className={estilos.productosCards}>
                                {detalle.map((item, idx) => (
                                    <div key={idx} className={estilos.productoCard}>
                                        <div className={estilos.productoCardHeader}>
                                            <div className={estilos.productoCardImagen}>
                                                {item.producto_imagen ? (
                                                    <img 
                                                        src={item.producto_imagen} 
                                                        alt={item.nombre_producto}
                                                        className={estilos.productoCardImagenImg}
                                                    />
                                                ) : (
                                                    <div className={estilos.productoCardIcono}>
                                                        <ion-icon name="cube-outline"></ion-icon>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={estilos.productoCardInfo}>
                                                <div className={estilos.productoCardNombre}>{item.nombre_producto}</div>
                                                {item.descripcion_producto && (
                                                    <div className={estilos.productoCardDescripcion}>
                                                        {item.descripcion_producto}
                                                    </div>
                                                )}
                                                {item.codigo_barras && (
                                                    <div className={estilos.productoCodigo}>
                                                        <ion-icon name="barcode-outline"></ion-icon>
                                                        {item.codigo_barras}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={estilos.productoCardBody}>
                                            <div className={estilos.productoCardField}>
                                                <div className={estilos.productoCardFieldHeader}>
                                                    <ion-icon name="layers-outline"></ion-icon>
                                                    <span className={estilos.productoCardLabel}>Cantidad</span>
                                                </div>
                                                <span className={estilos.productoCardValor}>{item.cantidad}</span>
                                            </div>
                                            <div className={estilos.productoCardField}>
                                                <div className={estilos.productoCardFieldHeader}>
                                                    <ion-icon name="pricetag-outline"></ion-icon>
                                                    <span className={estilos.productoCardLabel}>Precio Unit.</span>
                                                </div>
                                                <span className={estilos.productoCardValor}>{fmtMoneda(item.precio_unitario)}</span>
                                            </div>
                                        </div>
                                        <div className={estilos.productoCardSubtotal}>
                                            <div className={estilos.productoCardSubtotalLabel}>
                                                <ion-icon name="cash-outline"></ion-icon>
                                                <span>Total</span>
                                            </div>
                                            <span className={estilos.productoCardTotal}>{fmtMoneda(item.total)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* OBSERVACIONES */}
                        {cotizacion.observaciones && (
                            <div className={estilos.cardInfo}>
                                <h3 className={estilos.cardTitulo}>
                                    <ion-icon name="document-text-outline"></ion-icon>
                                    {tr('Observaciones', 'Notes')}
                                </h3>
                                <p className={estilos.observaciones}>{cotizacion.observaciones}</p>
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA - RESUMEN */}
                    <div className={estilos.columnaDerecha}>
                        <div className={estilos.cardResumen}>
                            <h3 className={estilos.cardTitulo}>
                                <ion-icon name="cash-outline"></ion-icon>
                                {tr('Resumen Economico', 'Financial Summary')}
                            </h3>
                            <div className={estilos.resumenList}>
                                <div className={estilos.resumenItem}>
                                    <span className={estilos.resumenLabel}>{tr('Subtotal', 'Subtotal')}</span>
                                    <span className={estilos.resumenValor}>{fmtMoneda(cotizacion.subtotal)}</span>
                                </div>
                                {cotizacion.descuento > 0 && (
                                    <div className={estilos.resumenItem}>
                                        <span className={estilos.resumenLabel}>{tr('Descuento', 'Discount')}</span>
                                        <span className={`${estilos.resumenValor} ${estilos.descuento}`}>
                                            -{fmtMoneda(cotizacion.descuento)}
                                        </span>
                                    </div>
                                )}
                                <div className={estilos.resumenItem}>
                                    <span className={estilos.resumenLabel}>{tr('ITBIS (18%)', 'Tax (18%)')}</span>
                                    <span className={estilos.resumenValor}>{fmtMoneda(cotizacion.itbis)}</span>
                                </div>
                                <div className={`${estilos.resumenItem} ${estilos.resumenTotal}`}>
                                    <span className={estilos.resumenLabelTotal}>{tr('Total', 'Total')}</span>
                                    <span className={estilos.resumenValorTotal}>{fmtMoneda(cotizacion.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB HISTORIAL */}
            {tabActivo === 'historial' && (
                <div className={estilos.cardInfo}>
                    <HistorialCotizacion cotizacionId={cotizacion.id} />
                </div>
            )}
        </div>
    )
}

