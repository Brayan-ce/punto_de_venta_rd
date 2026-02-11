"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerDetallePedido, actualizarEstadoPedido } from '../../servidor'
import estilos from './ver.module.css'

export default function VerPedido() {
    const router = useRouter()
    const params = useParams()
    const pedidoId = params?.id
    const [pedido, setPedido] = useState(null)
    const [items, setItems] = useState([])
    const [cargando, setCargando] = useState(true)
    const [actualizando, setActualizando] = useState(false)
    const [nuevoEstado, setNuevoEstado] = useState('')
    const [tema, setTema] = useState('light')

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
    }, [pedidoId])

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
                alert('Error al cargar el pedido: ' + resultado.mensaje)
                router.push('/admin/catalogo/pedidos')
            }
        } catch (error) {
            console.error('Error al cargar pedido:', error)
            alert('Error al cargar el pedido')
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
                alert('Estado actualizado correctamente')
                await cargarPedido()
            } else {
                alert('Error al actualizar estado: ' + resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error)
            alert('Error al actualizar el estado')
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
            pendiente: 'Pendiente',
            confirmado: 'Confirmado',
            en_proceso: 'En Proceso',
            listo: 'Listo',
            entregado: 'Entregado',
            cancelado: 'Cancelado'
        }
        return textos[estado] || estado
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return '-'
        const date = new Date(fecha)
        return date.toLocaleString('es-DO', {
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
        }).format(monto || 0)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <p>Cargando pedido...</p>
                </div>
            </div>
        )
    }

    if (!pedido) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.vacio}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <p>Pedido no encontrado</p>
                    <button className={estilos.botonVolver} onClick={() => router.push('/admin/catalogo/pedidos')}>
                        Volver a Pedidos
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
                    Volver
                </button>
                <div className={estilos.tituloSection}>
                    <h1 className={estilos.titulo}>Pedido #{pedido.numero_pedido}</h1>
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
                            Información del Cliente
                        </h2>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Nombre:</span>
                                <span className={estilos.infoValor}>{pedido.cliente_nombre}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Teléfono:</span>
                                <span className={estilos.infoValor}>{pedido.cliente_telefono}</span>
                            </div>
                            {pedido.cliente_email && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Email:</span>
                                    <span className={estilos.infoValor}>{pedido.cliente_email}</span>
                                </div>
                            )}
                            {pedido.cliente_direccion && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Dirección:</span>
                                    <span className={estilos.infoValor}>{pedido.cliente_direccion}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="information-circle-outline"></ion-icon>
                            Detalles del Pedido
                        </h2>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Fecha:</span>
                                <span className={estilos.infoValor}>{formatearFecha(pedido.fecha_pedido)}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Método de Pago:</span>
                                <span className={estilos.infoValor}>
                                    {pedido.metodo_pago === 'efectivo' ? 'Efectivo' :
                                     pedido.metodo_pago === 'transferencia' ? 'Transferencia' :
                                     pedido.metodo_pago === 'tarjeta' ? 'Tarjeta' :
                                     'Contra Entrega'}
                                </span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Método de Entrega:</span>
                                <span className={estilos.infoValor}>
                                    {pedido.metodo_entrega === 'delivery' ? 'Delivery' : 'Recoger en Tienda'}
                                </span>
                            </div>
                            {pedido.notas && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Notas:</span>
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
                            Productos ({items.length})
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
                                <span>Subtotal:</span>
                                <span>{formatearMoneda(pedido.subtotal)}</span>
                            </div>
                            {pedido.descuento > 0 && (
                                <div className={estilos.totalItem}>
                                    <span>Descuento:</span>
                                    <span>-{formatearMoneda(pedido.descuento)}</span>
                                </div>
                            )}
                            {pedido.impuesto > 0 && (
                                <div className={estilos.totalItem}>
                                    <span>Impuesto:</span>
                                    <span>{formatearMoneda(pedido.impuesto)}</span>
                                </div>
                            )}
                            {pedido.envio > 0 && (
                                <div className={estilos.totalItem}>
                                    <span>Envío:</span>
                                    <span>{formatearMoneda(pedido.envio)}</span>
                                </div>
                            )}
                            <div className={`${estilos.totalItem} ${estilos.totalFinal}`}>
                                <span>Total:</span>
                                <span>{formatearMoneda(pedido.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="sync-outline"></ion-icon>
                            Actualizar Estado
                        </h2>
                        <div className={estilos.formEstado}>
                            <select
                                className={estilos.select}
                                value={nuevoEstado}
                                onChange={(e) => setNuevoEstado(e.target.value)}
                            >
                                <option value="pendiente">Pendiente</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="en_proceso">En Proceso</option>
                                <option value="listo">Listo</option>
                                <option value="entregado">Entregado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                            <button
                                className={estilos.botonActualizar}
                                onClick={manejarActualizarEstado}
                                disabled={actualizando || nuevoEstado === pedido.estado}
                            >
                                {actualizando ? 'Actualizando...' : 'Actualizar Estado'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

