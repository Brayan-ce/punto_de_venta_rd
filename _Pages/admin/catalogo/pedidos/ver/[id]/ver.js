"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerDetallePedido, actualizarEstadoPedido } from '../../servidor'
import { obtenerDatosEmpresa } from '../../../servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './ver.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function VerPedido() {
    const router = useRouter()
    const params = useParams()
    const { t, language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const pedidoId = params?.id
    const [pedido, setPedido] = useState(null)
    const [items, setItems] = useState([])
    const [cargando, setCargando] = useState(true)
    const [actualizando, setActualizando] = useState(false)
    const [nuevoEstado, setNuevoEstado] = useState('')
    const [tema, setTema] = useState('light')
    const [empresa, setEmpresa] = useState(null)

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
        if (pedidoId) {
            cargarPedido()
        }
        cargarEmpresa()
    }, [pedidoId])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargarPedido = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerDetallePedido(parseInt(pedidoId))
            if (resultado.success) {
                setPedido(resultado.pedido)
                setItems(resultado.items || [])
                setNuevoEstado(resultado.pedido?.estado || '')
            } else {
                console.error('Error al cargar pedido:', resultado.mensaje)
                alert((language === 'en' ? 'Error loading order: ' : 'Error al cargar el pedido: ') + resultado.mensaje)
                router.push('/admin/catalogo/pedidos')
            }
        } catch (error) {
            console.error('Error al cargar pedido:', error)
            alert(language === 'en' ? 'Error loading order' : 'Error al cargar el pedido')
            router.push('/admin/catalogo/pedidos')
        } finally {
            setCargando(false)
        }
    }

    const manejarActualizarEstado = async () => {
        if (!nuevoEstado || nuevoEstado === pedido?.estado) return

        setActualizando(true)
        try {
            const resultado = await actualizarEstadoPedido(parseInt(pedidoId), nuevoEstado)
            if (resultado.success) {
                alert(tr('Estado actualizado correctamente', 'Status updated successfully'))
                await cargarPedido()
            } else {
                alert((language === 'en' ? 'Error updating status: ' : 'Error al actualizar estado: ') + resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error)
            alert(tr('Error al actualizar el estado', 'Error updating status'))
        } finally {
            setActualizando(false)
        }
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            pendiente: '#f59e0b',
            confirmado: '#3b82f6',
            en_proceso: '#8b5cf6',
            listo: '#10b981',
            entregado: '#059669',
            cancelado: '#ef4444'
        }
        return colores[estado] || '#6b7280'
    }

    const obtenerTextoEstado = (estado) => {
        const textos = {
            pendiente: t('status.pendiente'),
            confirmado: t('status.confirmado'),
            en_proceso: t('status.enProceso'),
            listo: t('status.listo'),
            entregado: t('status.entregado'),
            cancelado: t('status.cancelado')
        }
        return textos[estado] || estado
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return '-'
        const date = new Date(fecha)
        return date.toLocaleString(language === 'en' ? 'en-US' : 'es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatearMoneda = (monto) => {
        const locale = language === 'en' ? 'en-US' : (empresa?.locale || 'es-DO')
        const moneda = empresa?.moneda || 'DOP'
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    if (cargando) { return <LoadingScreen /> }

    if (!pedido) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.vacio}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <p>{tr('Pedido no encontrado', 'Order not found')}</p>
                    <button className={estilos.botonVolver} onClick={() => router.push('/admin/catalogo/pedidos')}>
                        {tr('Volver a Pedidos', 'Back to Orders')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <button className={estilos.botonVolver} onClick={() => router.push('/admin/catalogo/pedidos')}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    {tr('Volver', 'Back')}
                </button>
                <div className={estilos.tituloSection}>
                    <h1 className={estilos.titulo}>{tr('Pedido', 'Order')} #{pedido.numero_pedido}</h1>
                    <span
                        className={estilos.badgeEstado}
                        style={{ backgroundColor: obtenerColorEstado(pedido.estado) }}
                    >
                        {obtenerTextoEstado(pedido.estado)}
                    </span>
                </div>
            </div>

            <div className={estilos.grid}>
                <div className={estilos.columna}>
                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="person-outline"></ion-icon>
                            {tr('Información del Cliente', 'Customer Information')}
                        </h2>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Nombre', 'Name')}:</span>
                                <span className={estilos.infoValor}>{pedido.cliente_nombre}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Teléfono', 'Phone')}:</span>
                                <span className={estilos.infoValor}>{pedido.cliente_telefono}</span>
                            </div>
                            {pedido.cliente_email && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>{tr('Email', 'Email')}:</span>
                                    <span className={estilos.infoValor}>{pedido.cliente_email}</span>
                                </div>
                            )}
                            {pedido.cliente_direccion && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>{tr('Dirección', 'Address')}:</span>
                                    <span className={estilos.infoValor}>{pedido.cliente_direccion}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="information-circle-outline"></ion-icon>
                            {tr('Detalles del Pedido', 'Order Details')}
                        </h2>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Fecha', 'Date')}:</span>
                                <span className={estilos.infoValor}>{formatearFecha(pedido.fecha_pedido)}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Método de Pago', 'Payment Method')}:</span>
                                <span className={estilos.infoValor}>
                                    {pedido.metodo_pago === 'efectivo' ? tr('Efectivo', 'Cash') :
                                     pedido.metodo_pago === 'transferencia' ? tr('Transferencia', 'Transfer') :
                                     pedido.metodo_pago === 'tarjeta' ? tr('Tarjeta', 'Card') :
                                     tr('Contra Entrega', 'Cash on Delivery')}
                                </span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>{tr('Método de Entrega', 'Delivery Method')}:</span>
                                <span className={estilos.infoValor}>
                                    {pedido.metodo_entrega === 'delivery' ? tr('Delivery', 'Delivery') : tr('Recoger en Tienda', 'Store Pickup')}
                                </span>
                            </div>
                            {pedido.notas && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>{tr('Notas', 'Notes')}:</span>
                                    <span className={estilos.infoValor}>{pedido.notas}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={estilos.columna}>
                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="cube-outline"></ion-icon>
                            {tr('Productos', 'Products')} ({items.length})
                        </h2>
                        <div className={estilos.listaItems}>
                            {items.map((item) => (
                                <div key={item.id} className={estilos.item}>
                                    <div className={estilos.itemInfo}>
                                        <h4 className={estilos.itemNombre}>{item.producto_nombre}</h4>
                                        <p className={estilos.itemDetalles}>
                                            {item.cantidad} x {formatearMoneda(item.precio_unitario)}
                                        </p>
                                    </div>
                                    <div className={estilos.itemTotal}>
                                        {formatearMoneda(item.subtotal)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={estilos.totales}>
                            <div className={estilos.totalItem}>
                                <span>{tr('Subtotal', 'Subtotal')}:</span>
                                <span>{formatearMoneda(pedido.subtotal)}</span>
                            </div>
                            {pedido.descuento > 0 && (
                                <div className={estilos.totalItem}>
                                    <span>{tr('Descuento', 'Discount')}:</span>
                                    <span>-{formatearMoneda(pedido.descuento)}</span>
                                </div>
                            )}
                            {pedido.impuesto > 0 && (
                                <div className={estilos.totalItem}>
                                    <span>{tr('Impuesto', 'Tax')}:</span>
                                    <span>{formatearMoneda(pedido.impuesto)}</span>
                                </div>
                            )}
                            {pedido.envio > 0 && (
                                <div className={estilos.totalItem}>
                                    <span>{tr('Envío', 'Shipping')}:</span>
                                    <span>{formatearMoneda(pedido.envio)}</span>
                                </div>
                            )}
                            <div className={`${estilos.totalItem} ${estilos.totalFinal}`}>
                                <span>{tr('Total', 'Total')}:</span>
                                <span>{formatearMoneda(pedido.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="sync-outline"></ion-icon>
                            {t('pages.actualizarEstado') || tr('Actualizar Estado', 'Update Status')}
                        </h2>
                        <div className={estilos.formEstado}>
                            <select
                                className={estilos.select}
                                value={nuevoEstado}
                                onChange={(e) => setNuevoEstado(e.target.value)}
                            >
                                <option value="pendiente">{t('status.pendiente')}</option>
                                <option value="confirmado">{t('status.confirmado')}</option>
                                <option value="en_proceso">{t('status.enProceso')}</option>
                                <option value="listo">{t('status.listo')}</option>
                                <option value="entregado">{t('status.entregado')}</option>
                                <option value="cancelado">{t('status.cancelado')}</option>
                            </select>
                            <button
                                className={estilos.botonActualizar}
                                onClick={manejarActualizarEstado}
                                disabled={actualizando || nuevoEstado === pedido.estado}
                            >
                                {actualizando ? t('common.loading') : t('buttons.confirmar')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

