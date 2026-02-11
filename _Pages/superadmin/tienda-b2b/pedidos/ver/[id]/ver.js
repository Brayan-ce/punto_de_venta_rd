"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerDetallePedidoB2B, actualizarEstadoPedidoB2B } from '../../servidor'
import estilos from './ver.module.css'

export default function VerPedidoB2B() {
    const router = useRouter()
    const params = useParams()
    const pedidoId = params.id

    const [pedido, setPedido] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
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
            const resultado = await obtenerDetallePedidoB2B(pedidoId)

            if (resultado.success) {
                setPedido(resultado.pedido)
            } else {
                alert(resultado.mensaje || 'Error al cargar el pedido')
                router.push('/superadmin/tienda-b2b/pedidos')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al cargar el pedido')
            router.push('/superadmin/tienda-b2b/pedidos')
        } finally {
            setCargando(false)
        }
    }

    const cambiarEstado = async (nuevoEstado) => {
        if (!confirm(`¿Estás seguro de cambiar el estado a "${obtenerTextoEstado(nuevoEstado)}"?`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await actualizarEstadoPedidoB2B(pedidoId, nuevoEstado)

            if (resultado.success) {
                alert('Estado actualizado correctamente')
                await cargarPedido()
            } else {
                alert(resultado.mensaje || 'Error al actualizar el estado')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al actualizar el estado')
        } finally {
            setProcesando(false)
        }
    }

    const compartirWhatsApp = () => {
        if (!pedido) return

        const productosTexto = pedido.items.map((item, idx) =>
            `${idx + 1}. ${item.producto_nombre} - ${item.cantidad} x RD$ ${formatearMoneda(item.precio_aplicado)}`
        ).join('\n')

        const mensaje = `
¡Hola! 🎉

Tu pedido *${pedido.numero_pedido}* ha sido *CONFIRMADO* y está en proceso de preparación.

📦 *Detalles del pedido:*

${productosTexto}

💰 *Total: RD$ ${formatearMoneda(pedido.total)}*
📅 Fecha: ${formatearFecha(pedido.fecha_pedido)}
💳 Método de pago: ${obtenerTextoMetodoPago(pedido.metodo_pago)}

¡Pronto recibirás tu pedido! 🚚

Gracias por confiar en nosotros.
        `.trim()

        const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
        window.open(url, '_blank')
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            pendiente: '#f59e0b',
            entregado: '#10b981',
            cancelado: '#ef4444'
        }
        return colores[estado] || '#6b7280'
    }

    const obtenerIconoEstado = (estado) => {
        const iconos = {
            pendiente: 'time-outline',
            entregado: 'checkmark-circle-outline',
            cancelado: 'close-circle-outline'
        }
        return iconos[estado] || 'help-circle-outline'
    }

    const obtenerTextoEstado = (estado) => {
        const textos = {
            pendiente: 'Pendiente',
            entregado: 'Entregado',
            cancelado: 'Cancelado'
        }
        return textos[estado] || estado
    }

    const obtenerTextoMetodoPago = (metodo) => {
        const metodos = {
            contra_entrega: 'Contra Entrega',
            transferencia: 'Transferencia',
            credito: 'Crédito'
        }
        return metodos[metodo] || metodo
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
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(monto || 0)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.spinner}></div>
                    <p>Cargando pedido...</p>
                </div>
            </div>
        )
    }

    if (!pedido) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.vacio}>
                    <div className={estilos.vacioIcono}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                    </div>
                    <h3>Pedido no encontrado</h3>
                    <button
                        className={estilos.btnVolver}
                        onClick={() => router.push('/superadmin/tienda-b2b/pedidos')}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        Volver a pedidos
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Navegación */}
            <div className={estilos.headerNav}>
                <button
                    className={estilos.btnVolver}
                    onClick={() => router.push('/superadmin/tienda-b2b/pedidos')}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Volver a pedidos</span>
                </button>

                <div className={estilos.headerAcciones}>
                    {pedido.estado === 'pendiente' && (
                        <button
                            className={estilos.btnAccionWhatsApp}
                            onClick={compartirWhatsApp}
                        >
                            <ion-icon name="logo-whatsapp"></ion-icon>
                            <span>Compartir por WhatsApp</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Header del pedido */}
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.numeroPedidoContainer}>
                        <ion-icon name="receipt"></ion-icon>
                        <div>
                            <span className={estilos.labelPedido}>Pedido</span>
                            <h1 className={estilos.numeroPedido}>{pedido.numero_pedido}</h1>
                        </div>
                    </div>
                    <p className={estilos.fechaPedido}>
                        <ion-icon name="calendar-outline"></ion-icon>
                        {formatearFecha(pedido.fecha_pedido)}
                    </p>
                </div>

                <div className={estilos.estadoContainer}>
                    <span
                        className={estilos.badgeEstado}
                        style={{ backgroundColor: obtenerColorEstado(pedido.estado) }}
                    >
                        <ion-icon name={obtenerIconoEstado(pedido.estado)}></ion-icon>
                        {obtenerTextoEstado(pedido.estado)}
                    </span>
                </div>
            </div>

            {/* Layout principal */}
            <div className={estilos.layout}>
                {/* Columna izquierda */}
                <div className={estilos.columnaIzquierda}>
                    {/* Información de la empresa */}
                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="business-outline"></ion-icon>
                            Empresa
                        </h2>
                        <div className={estilos.empresaInfo}>
                            <div className={estilos.empresaHeader}>
                                <div className={estilos.empresaIcono}>
                                    <ion-icon name="business"></ion-icon>
                                </div>
                                <div>
                                    <h3 className={estilos.empresaNombre}>
                                        {pedido.nombre_comercial || pedido.nombre_empresa}
                                    </h3>
                                    {pedido.nombre_comercial && (
                                        <p className={estilos.empresaRazonSocial}>{pedido.nombre_empresa}</p>
                                    )}
                                </div>
                            </div>
                            <div className={estilos.infoGrid}>
                                <div className={estilos.infoItem}>
                                    <ion-icon name="mail-outline"></ion-icon>
                                    <div>
                                        <span className={estilos.infoLabel}>Email</span>
                                        <span className={estilos.infoValor}>{pedido.empresa_email || 'No disponible'}</span>
                                    </div>
                                </div>
                                <div className={estilos.infoItem}>
                                    <ion-icon name="call-outline"></ion-icon>
                                    <div>
                                        <span className={estilos.infoLabel}>Teléfono</span>
                                        <span className={estilos.infoValor}>{pedido.empresa_telefono || 'No disponible'}</span>
                                    </div>
                                </div>
                                {pedido.empresa_direccion && (
                                    <div className={estilos.infoItem}>
                                        <ion-icon name="location-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.infoLabel}>Dirección</span>
                                            <span className={estilos.infoValor}>{pedido.empresa_direccion}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Información del usuario */}
                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="person-outline"></ion-icon>
                            Usuario que realizó el pedido
                        </h2>
                        <div className={estilos.usuarioInfo}>
                            <div className={estilos.usuarioAvatar}>
                                <ion-icon name="person"></ion-icon>
                            </div>
                            <div>
                                <h3 className={estilos.usuarioNombre}>{pedido.usuario_nombre}</h3>
                                <p className={estilos.usuarioRol}>{pedido.usuario_email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detalles del pedido */}
                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="information-circle-outline"></ion-icon>
                            Detalles
                        </h2>
                        <div className={estilos.detallesGrid}>
                            <div className={estilos.detalleItem}>
                                <ion-icon name="card-outline"></ion-icon>
                                <div>
                                    <span className={estilos.detalleLabel}>Método de pago</span>
                                    <span className={estilos.detalleValor}>
                                        {obtenerTextoMetodoPago(pedido.metodo_pago)}
                                    </span>
                                </div>
                            </div>
                            {pedido.notas && (
                                <div className={estilos.detalleItem}>
                                    <ion-icon name="document-text-outline"></ion-icon>
                                    <div>
                                        <span className={estilos.detalleLabel}>Notas</span>
                                        <span className={estilos.detalleValor}>{pedido.notas}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gestión de estado */}
                    {pedido.estado === 'pendiente' && (
                        <div className={estilos.card}>
                            <h2 className={estilos.cardTitulo}>
                                <ion-icon name="settings-outline"></ion-icon>
                                Gestionar pedido
                            </h2>
                            <div className={estilos.estadoGestion}>
                                <button
                                    className={estilos.btnEntregar}
                                    onClick={() => cambiarEstado('entregado')}
                                    disabled={procesando}
                                >
                                    {procesando ? (
                                        <div className={estilos.spinnerSmall}></div>
                                    ) : (
                                        <>
                                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                                            Marcar como entregado
                                        </>
                                    )}
                                </button>

                                <button
                                    className={estilos.btnCancelar}
                                    onClick={() => cambiarEstado('cancelado')}
                                    disabled={procesando}
                                >
                                    {procesando ? (
                                        <div className={estilos.spinnerSmall}></div>
                                    ) : (
                                        <>
                                            <ion-icon name="close-circle-outline"></ion-icon>
                                            Cancelar pedido
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Columna derecha - Productos */}
                <div className={estilos.columnaDerecha}>
                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="cube-outline"></ion-icon>
                            Productos ({pedido.items?.length || 0})
                        </h2>

                        <div className={estilos.listaProductos}>
                            {pedido.items?.map((item) => (
                                <div key={item.id} className={estilos.productoItem}>
                                    <div className={estilos.productoImagen}>
                                        {item.imagen_url ? (
                                            <img src={item.imagen_url} alt={item.producto_nombre} />
                                        ) : (
                                            <div className={estilos.imagenPlaceholder}>
                                                <ion-icon name="image-outline"></ion-icon>
                                            </div>
                                        )}
                                    </div>

                                    <div className={estilos.productoInfo}>
                                        <h3 className={estilos.productoNombre}>{item.producto_nombre}</h3>
                                        <p className={estilos.productoSku}>SKU: {item.sku || 'N/A'}</p>
                                        <div className={estilos.productoPrecioDetalle}>
                                            <p className={estilos.cantidad}>
                                                Cantidad: <strong>{item.cantidad}</strong>
                                            </p>
                                            <div className={estilos.precioUnitario}>
                                                {item.precio_unitario !== item.precio_aplicado && (
                                                    <span className={estilos.precioTachado}>
                                                        RD$ {formatearMoneda(item.precio_unitario)}
                                                    </span>
                                                )}
                                                <span className={estilos.precioDescuento}>
                                                    RD$ {formatearMoneda(item.precio_aplicado)}
                                                </span>
                                                <span className={estilos.unidad}>c/u</span>
                                            </div>
                                            {item.descuento > 0 && (
                                                <div className={estilos.badgeDescuento}>
                                                    <ion-icon name="pricetag"></ion-icon>
                                                    Ahorro: RD$ {formatearMoneda(item.descuento)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={estilos.productoSubtotal}>
                                        RD$ {formatearMoneda(item.subtotal)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totales */}
                        <div className={estilos.totalesCard}>
                            <div className={estilos.totalLinea}>
                                <span>
                                    <ion-icon name="calculator-outline"></ion-icon>
                                    Subtotal
                                </span>
                                <span>RD$ {formatearMoneda(pedido.subtotal)}</span>
                            </div>

                            {pedido.descuento > 0 && (
                                <div className={estilos.totalLinea}>
                                    <span className={estilos.descuento}>
                                        <ion-icon name="pricetag-outline"></ion-icon>
                                        Descuento
                                    </span>
                                    <span className={estilos.descuento}>
                                        -RD$ {formatearMoneda(pedido.descuento)}
                                    </span>
                                </div>
                            )}

                            <div className={estilos.totalFinal}>
                                <span>Total</span>
                                <span>RD$ {formatearMoneda(pedido.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}