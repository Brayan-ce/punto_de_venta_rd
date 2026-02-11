"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerCotizacionPorId, actualizarEstadoCotizacion, convertirCotizacionAVenta } from './servidor'
import HistorialCotizacion from '../historial/historial'
import { formatearMoneda, obtenerTextoEstado, puedeEditar, puedeConvertir, esVencida } from '../lib'
import { getEstadoBadge } from '../constants'
import estilos from './ver.module.css'

export default function VerCotizacionAdmin({ id: propId }) {
    const router = useRouter()
    const params = useParams()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [cotizacion, setCotizacion] = useState(null)
    const [detalle, setDetalle] = useState([])
    const [tabActivo, setTabActivo] = useState('detalle')
    const [procesando, setProcesando] = useState(false)

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

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

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
                alert(res.mensaje || 'No se pudo cargar la cotización')
                router.push('/admin/cotizaciones')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al cargar cotización')
            router.push('/admin/cotizaciones')
        } finally {
            setCargando(false)
        }
    }

    const manejarCambioEstado = async (nuevoEstado) => {
        if (!confirm(`¿Desea cambiar el estado a "${obtenerTextoEstado(nuevoEstado)}"?`)) return
        
        setProcesando(true)
        try {
            const res = await actualizarEstadoCotizacion(cotizacion.id, nuevoEstado)
            if (res.success) {
                await cargarDetalle(cotizacion.id)
            } else {
                alert(res.mensaje)
            }
        } catch (error) {
            alert('Error al cambiar estado')
        } finally {
            setProcesando(false)
        }
    }

    const manejarConvertirVenta = async () => {
        if (!confirm('¿Desea convertir esta cotización en una venta? El formulario de venta se pre-cargará con estos productos.')) return

        setProcesando(true)
        try {
            const res = await convertirCotizacionAVenta(cotizacion.id)
            if (res.success) {
                if (res.productosSinStock && res.productosSinStock.length > 0) {
                    alert(`Atención: Algunos productos no tienen stock suficiente:\n${res.productosSinStock.map(p => `- ${p.nombre}: Disponible ${p.stock_disponible}, Requerido ${p.cantidad_requerida}`).join('\n')}`)
                }
                localStorage.setItem('cotizacion_venta_precarga', JSON.stringify(res.data))
                router.push('/admin/ventas/nueva')
            } else {
                alert(res.mensaje || 'Error al convertir la cotización')
            }
        } catch (error) {
            alert('Error al procesar la conversión')
        } finally {
            setProcesando(false)
        }
    }


    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.loaderSpinner}></div>
                    <span>Cargando cotización...</span>
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
                    <h1>Cotización {cotizacion.numero_cotizacion}</h1>
                    <p>{cotizacion.cliente_nombre || 'Consumidor Final'}</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button
                        onClick={() => router.push(`/admin/cotizaciones/${cotizacion.id}/imprimir`)}
                        className={estilos.btnHeaderAccion}
                        title="Imprimir"
                    >
                        <ion-icon name="print-outline"></ion-icon>
                    </button>
                </div>
            </div>

            {/* BADGE DE ESTADO Y ALERTAS */}
            <div className={estilos.estadoBar}>
                <span className={`${estilos.badge} ${getEstadoBadge(cotizacion.estado, estilos)}`}>
                    {obtenerTextoEstado(cotizacion.estado)}
                </span>
                {esVencida(cotizacion.fecha_vencimiento) && cotizacion.estado !== 'vencida' && (
                    <span className={estilos.vencidaAlerta}>
                        <ion-icon name="warning-outline"></ion-icon>
                        Vencida
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
                            <span className={estilos.btnLabel}>Facturar / Vender</span>
                            <span className={estilos.btnSubLabel}>Convertir a venta</span>
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
                            <span className={estilos.btnLabel}>Generar Conduce</span>
                            <span className={estilos.btnSubLabel}>Crear guía de envío</span>
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
                            <span className={estilos.btnLabel}>Marcar como Enviada</span>
                            <span className={estilos.btnSubLabel}>Enviar al cliente</span>
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
                            <span className={estilos.btnLabel}>Aprobar</span>
                            <span className={estilos.btnSubLabel}>Aprobar cotización</span>
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
                            <span className={estilos.btnLabel}>Editar</span>
                            <span className={estilos.btnSubLabel}>Modificar cotización</span>
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
                    <span>Detalle</span>
                </button>
                <button
                    className={`${estilos.tab} ${tabActivo === 'historial' ? estilos.tabActiva : ''}`}
                    onClick={() => setTabActivo('historial')}
                >
                    <ion-icon name="time-outline"></ion-icon>
                    <span>Historial</span>
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
                                Información del Cliente
                            </h3>
                            
                            {/* Header con Avatar */}
                            <div className={estilos.clienteHeader}>
                                <div className={estilos.avatarContenedor}>
                                    {cotizacion.cliente_foto ? (
                                        <img
                                            src={cotizacion.cliente_foto}
                                            alt={cotizacion.cliente_nombre || 'Cliente'}
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
                                        {cotizacion.cliente_nombre || 'Consumidor Final'}
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
                                        <span className={estilos.infoLabel}>Teléfono</span>
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
                                            <span className={estilos.infoLabel}>Email</span>
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
                                            <span className={estilos.infoLabel}>Dirección</span>
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
                                        <span className={estilos.infoLabel}>Fecha Emisión</span>
                                        <span className={estilos.infoValor}>
                                            {new Date(cotizacion.fecha_emision).toLocaleDateString('es-DO', { 
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
                                        <span className={estilos.infoLabel}>Fecha Vencimiento</span>
                                        <span className={`${estilos.infoValor} ${esVencida(cotizacion.fecha_vencimiento) ? estilos.vencida : ''}`}>
                                            {new Date(cotizacion.fecha_vencimiento).toLocaleDateString('es-DO', { 
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
                                Productos ({detalle.length})
                            </h3>
                            
                            {/* Tabla para desktop */}
                            <div className={estilos.tablaContenedor}>
                                <table className={estilos.tabla}>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th style={{ textAlign: 'center' }}>Cantidad</th>
                                            <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                                            <th style={{ textAlign: 'right' }}>Total</th>
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
                                                    <span className={estilos.precioUnitario}>{formatearMoneda(item.precio_unitario)}</span>
                                                </td>
                                                <td className={estilos.totalCell}>
                                                    <span className={estilos.totalProducto}>{formatearMoneda(item.total)}</span>
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
                                                <span className={estilos.productoCardValor}>{formatearMoneda(item.precio_unitario)}</span>
                                            </div>
                                        </div>
                                        <div className={estilos.productoCardSubtotal}>
                                            <div className={estilos.productoCardSubtotalLabel}>
                                                <ion-icon name="cash-outline"></ion-icon>
                                                <span>Total</span>
                                            </div>
                                            <span className={estilos.productoCardTotal}>{formatearMoneda(item.total)}</span>
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
                                    Observaciones
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
                                Resumen Económico
                            </h3>
                            <div className={estilos.resumenList}>
                                <div className={estilos.resumenItem}>
                                    <span className={estilos.resumenLabel}>Subtotal</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(cotizacion.subtotal)}</span>
                                </div>
                                {cotizacion.descuento > 0 && (
                                    <div className={estilos.resumenItem}>
                                        <span className={estilos.resumenLabel}>Descuento</span>
                                        <span className={`${estilos.resumenValor} ${estilos.descuento}`}>
                                            -{formatearMoneda(cotizacion.descuento)}
                                        </span>
                                    </div>
                                )}
                                <div className={estilos.resumenItem}>
                                    <span className={estilos.resumenLabel}>ITBIS (18%)</span>
                                    <span className={estilos.resumenValor}>{formatearMoneda(cotizacion.itbis)}</span>
                                </div>
                                <div className={`${estilos.resumenItem} ${estilos.resumenTotal}`}>
                                    <span className={estilos.resumenLabelTotal}>Total</span>
                                    <span className={estilos.resumenValorTotal}>{formatearMoneda(cotizacion.total)}</span>
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

