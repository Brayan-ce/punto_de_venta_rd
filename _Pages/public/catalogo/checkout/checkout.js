"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import estilos from './checkout.module.css'

export default function CheckoutPublico() {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug

    const [cargando, setCargando] = useState(true)
    const [config, setConfig] = useState(null)
    const [carrito, setCarrito] = useState([])
    const [pedidoCreado, setPedidoCreado] = useState(false)
    const [numeroPedido, setNumeroPedido] = useState('')
    const [procesando, setProcesando] = useState(false)
    
    const [paso, setPaso] = useState(1)
    const [metodoPago, setMetodoPago] = useState('contra_entrega')
    const [metodoEntrega, setMetodoEntrega] = useState('pickup')
    
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        notas: ''
    })
    const [costoDelivery, setCostoDelivery] = useState(0)


    useEffect(() => {
        if (!slug) return
        cargarConfig()
        cargarCarritoDesdeStorage()
    }, [slug])

    const cargarConfig = async () => {
        try {
            const respuesta = await fetch(`/api/catalogo/${slug}/config`)
            const resultado = await respuesta.json()
            if (resultado.success) {
                setConfig(resultado.config)
                setCostoDelivery(resultado.config.delivery_precio || 0)
            } else {
                console.error('Error al cargar config:', resultado.mensaje)
                router.push(`/catalogo/${slug}`)
            }
        } catch (error) {
            console.error('Error al cargar configuración:', error)
            router.push(`/catalogo/${slug}`)
        } finally {
            setCargando(false)
        }
    }

    const cargarCarritoDesdeStorage = () => {
        const carritoGuardado = localStorage.getItem(`carrito_catalogo_${slug}`)
        if (carritoGuardado) {
            try {
                const carritoData = JSON.parse(carritoGuardado)
                setCarrito(carritoData)
                if (carritoData.length === 0) {
                    router.push(`/catalogo/${slug}`)
                }
            } catch (e) {
                console.error('Error al cargar carrito:', e)
                router.push(`/catalogo/${slug}`)
            }
        } else {
            router.push(`/catalogo/${slug}`)
        }
    }

    const calcularSubtotal = () => {
        return carrito.reduce((total, item) => {
            const precio = item.precio_oferta > 0 ? item.precio_oferta : item.precio
            return total + (precio * item.cantidad)
        }, 0)
    }

    const calcularEnvio = () => {
        return metodoEntrega === 'delivery' ? 200 : 0
    }

    const calcularTotal = () => {
        return calcularSubtotal() + calcularEnvio()
    }

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (paso < 3) {
            setPaso(paso + 1)
            return
        }

        if (!formData.nombre || !formData.telefono) {
            alert('Nombre y teléfono son requeridos')
            return
        }

        setProcesando(true)
        try {
            const respuesta = await fetch(`/api/catalogo/${slug}/pedido`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cliente: {
                        nombre: formData.nombre,
                        telefono: formData.telefono,
                        email: formData.email || null,
                        direccion: formData.direccion || null
                    },
                    items: carrito.map(item => ({
                        producto_id: item.id,
                        cantidad: item.cantidad
                    })),
                    metodo_pago: metodoPago,
                    metodo_entrega: metodoEntrega,
                    notas: formData.notas || null
                })
            })

            const resultado = await respuesta.json()

            if (resultado.success) {
                setNumeroPedido(resultado.pedido.numero_pedido)
                setPedidoCreado(true)
                localStorage.removeItem(`carrito_catalogo_${slug}`)
            } else {
                alert('Error al crear pedido: ' + resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al crear pedido:', error)
            alert('Error al procesar el pedido. Por favor intenta nuevamente.')
        } finally {
            setProcesando(false)
        }
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
            <div className={estilos.cargando}>
                <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                <span>Cargando...</span>
            </div>
        )
    }

    if (pedidoCreado) {
        return (
            <div className={estilos.contenedor}>
                <div className={estilos.pedidoConfirmado}>
                    <div className={estilos.iconoExito}>
                        <ion-icon name="checkmark-circle"></ion-icon>
                    </div>
                    <h1>¡Pedido Confirmado!</h1>
                    <p>Gracias por tu compra 🎉</p>
                    
                    <div className={estilos.numeroPedidoBox}>
                        <p className={estilos.numeroPedidoLabel}>Tu número de pedido</p>
                        <p className={estilos.numeroPedido}>{numeroPedido}</p>
                    </div>

                    <div className={estilos.accionesConfirmacion}>
                        {config?.whatsapp && (
                            <a
                                href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=Hola, mi número de pedido es ${numeroPedido}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={estilos.btnWhatsapp}
                            >
                                <ion-icon name="logo-whatsapp"></ion-icon>
                                Contactar por WhatsApp
                            </a>
                        )}
                        <Link href={`/catalogo/${slug}`} className={estilos.btnVolver}>
                            Volver al Catálogo
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={estilos.contenedor}>
            <header className={estilos.header}>
                <div className={estilos.headerContenedor}>
                    <Link href={`/catalogo/${slug}`} className={estilos.btnVolverHeader}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver al Catálogo</span>
                    </Link>
                    <div>
                        <h1 className={estilos.titulo}>Finalizar Pedido</h1>
                        <p className={estilos.subtitulo}>
                            {carrito.length} productos - {formatearMoneda(calcularTotal())}
                        </p>
                    </div>
                </div>
            </header>

            {/* Indicador de Pasos */}
            <div className={estilos.pasosContainer}>
            <div className={estilos.pasos}>
                {[1, 2, 3].map((num) => (
                    <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={`${estilos.paso} ${paso >= num ? estilos.pasoActivo : ''}`}>
                            {num}
                        </div>
                        {num < 3 && (
                            <div className={`${estilos.pasoLinea} ${paso > num ? estilos.pasoLineaActiva : ''}`}></div>
                        )}
                    </div>
                ))}
                </div>
            </div>

            <main className={estilos.main}>
                <form onSubmit={handleSubmit} className={estilos.formulario}>
                    {/* Paso 1: Información Personal */}
                    {paso === 1 && (
                        <div className={estilos.pasoContenido}>
                            <h2>Información Personal</h2>
                            <p className={estilos.descripcionPaso}>¿Cómo te contactamos?</p>
                            
                            <div className={estilos.campo}>
                                <label>
                                    <ion-icon name="person-outline"></ion-icon>
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Juan Pérez"
                                    required
                                />
                            </div>

                            <div className={estilos.campo}>
                                <label>
                                    <ion-icon name="call-outline"></ion-icon>
                                    Teléfono *
                                </label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleInputChange}
                                    placeholder="809-555-1234"
                                    required
                                />
                            </div>

                            <div className={estilos.campo}>
                                <label>
                                    <ion-icon name="mail-outline"></ion-icon>
                                    Email (opcional)
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="juan@example.com"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setPaso(2)}
                                disabled={!formData.nombre || !formData.telefono}
                                className={estilos.btnContinuar}
                                style={{ backgroundColor: config?.color_primario || '#f97316' }}
                            >
                                Continuar
                            </button>
                        </div>
                    )}

                    {/* Paso 2: Método de Entrega y Pago */}
                    {paso === 2 && (
                        <div className={estilos.pasoContenido}>
                            <h2>Método de Entrega</h2>
 <div className={estilos.opciones}>
    {/* Recoger en Tienda */}
    <button
        type="button"
        onClick={() => setMetodoEntrega('pickup')}
        className={`${estilos.opcion} ${
            metodoEntrega === 'pickup' ? estilos.opcionActiva : ''
        }`}
        style={
            metodoEntrega === 'pickup'
                ? { borderColor: config?.color_primario || '#f97316' }
                : {}
        }
    >
        <ion-icon name="storefront-outline"></ion-icon>
        <div>
            <h3>Recoger en Tienda</h3>
            <p>Gratis</p>
        </div>
    </button>

    {/* Delivery */}
    <button
        type="button"
        onClick={() => setMetodoEntrega('delivery')}
        className={`${estilos.opcion} ${
            metodoEntrega === 'delivery' ? estilos.opcionActiva : ''
        }`}
        style={
            metodoEntrega === 'delivery'
                ? { borderColor: config?.color_primario || '#f97316' }
                : {}
        }
    >
        <ion-icon name="car-outline"></ion-icon>
        <div>
            <h3>Delivery</h3>
            <p>
                {costoDelivery === 0
                    ? 'Gratis'
                    : formatearMoneda(costoDelivery)}
            </p>
        </div>
    </button>
</div>

{/* Dirección solo si es delivery */}
{metodoEntrega === 'delivery' && (
    <div className={estilos.direccionConCosto}>
        {/* Input Dirección */}
        <div className={estilos.campo}>
            <label>
                <ion-icon name="location-outline"></ion-icon>
                Dirección de Entrega *
            </label>
            <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Dirección, Avenida, Lugar..."
                required
            />
        </div>

        {/* Input Delivery Editable */}
        <div className={estilos.costoDeliveryInput}>
            <label>
                <ion-icon name="cash-outline"></ion-icon>
                Costo Delivery
            </label>
            <input
                type="number"
                min={0}
                value={costoDelivery}
                onChange={(e) => setCostoDelivery(Number(e.target.value))}
            />
        </div>
    </div>
)}

                            <h2 style={{ marginTop: '32px' }}>Método de Pago</h2>
                            <div className={estilos.opciones}>
                                <button
                                    type="button"
                                    onClick={() => setMetodoPago('contra_entrega')}
                                    className={`${estilos.opcion} ${metodoPago === 'contra_entrega' ? estilos.opcionActiva : ''}`}
                                    style={metodoPago === 'contra_entrega' ? { borderColor: config?.color_primario || '#f97316' } : {}}
                                >
                                    <ion-icon name="cash-outline"></ion-icon>
                                    <div>
                                        <h3>Pago Contra Entrega</h3>
                                        <p>Efectivo al recibir</p>
                                    </div>
                                </button>
                            </div>

                            <div className={estilos.botonesNavegacion}>
                                <button
                                    type="button"
                                    onClick={() => setPaso(1)}
                                    className={estilos.btnAtras}
                                >
                                    Atrás
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaso(3)}
                                    className={estilos.btnContinuar}
                                    style={{ backgroundColor: config?.color_primario || '#f97316' }}
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Resumen */}
                    {paso === 3 && (
                        <div className={estilos.pasoContenido}>
                            <h2>Resumen del Pedido</h2>
                            <div className={estilos.resumen}>
                                <div className={estilos.listaResumen}>
                                    {carrito.map(item => (
                                        <div key={item.id} className={estilos.itemResumen}>
                                            <div className={estilos.itemInfo}>
                                                <h4>{item.nombre}</h4>
                                                <p>{formatearMoneda(item.precio_oferta > 0 ? item.precio_oferta : item.precio)} x {item.cantidad}</p>
                                            </div>
                                            <span className={estilos.itemTotal}>
                                                {formatearMoneda((item.precio_oferta > 0 ? item.precio_oferta : item.precio) * item.cantidad)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className={estilos.totalesResumen}>
                                    <div className={estilos.totalLine}>
                                        <span>Subtotal:</span>
                                        <span>{formatearMoneda(calcularSubtotal())}</span>
                                    </div>
                                    <div className={estilos.totalLine}>
                                        <span>Envío:</span>
                                        <span>{formatearMoneda(calcularEnvio())}</span>
                                    </div>
                                    <div className={`${estilos.totalLine} ${estilos.totalFinal}`}>
                                        <span>Total:</span>
                                        <span>{formatearMoneda(calcularTotal())}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.campo}>
                                <label>
                                    <ion-icon name="document-text-outline"></ion-icon>
                                    Notas Adicionales (opcional)
                                </label>
                                <textarea
                                    name="notas"
                                    value={formData.notas}
                                    onChange={handleInputChange}
                                    placeholder="Instrucciones especiales, horario preferido, etc."
                                    rows={4}
                                />
                            </div>

                            <div className={estilos.botonesNavegacion}>
                                <button
                                    type="button"
                                    onClick={() => setPaso(2)}
                                    className={estilos.btnAtras}
                                >
                                    Atrás
                                </button>
                                <button
                                    type="submit"
                                    disabled={procesando}
                                    className={estilos.btnConfirmar}
                                    style={{ backgroundColor: config?.color_primario || '#f97316' }}
                                >
                                    {procesando ? 'Procesando...' : 'Confirmar Pedido'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </main>
        </div>
    )
}

