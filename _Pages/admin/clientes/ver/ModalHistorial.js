"use client"

import { useEffect, useState } from "react"
import estilos from "./modales.module.css"

export default function ModalHistorial({ clienteId, alCerrar, tema }) {
    const [historial, setHistorial] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtro, setFiltro] = useState('todo') // todo, ventas, pagos

    useEffect(() => {
        cargarHistorial()
    }, [clienteId])

    const cargarHistorial = async () => {
        setCargando(true)
        try {
            const respuesta = await fetch(`/api/clientes/${clienteId}/historial`)
            const datos = await respuesta.json()
            if (datos.success) {
                setHistorial(datos.historial || [])
            }
        } catch (error) {
            console.error("Error al cargar historial:", error)
        } finally {
            setCargando(false)
        }
    }

    const historialFiltrado = historial.filter(h => {
        if (filtro === 'ventas') return h.tipo === 'venta'
        if (filtro === 'pagos') return h.tipo === 'pago'
        return true
    })

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatearMoneda = (valor) =>
        new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(valor || 0)

    const getIconoTipo = (tipo) => {
        if (tipo === 'venta') return 'cart-outline'
        if (tipo === 'pago') return 'cash-outline'
        return 'document-outline'
    }

    const getColorTipo = (tipo) => {
        if (tipo === 'venta') return '#3b82f6'
        if (tipo === 'pago') return '#10b981'
        return '#6366f1'
    }

    return (
        <div className={`${estilos.modalOverlay} ${estilos[tema]}`} onClick={alCerrar}>
            <div className={`${estilos.modalContent} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                <div className={estilos.modalHeader}>
                    <h2>Historial del Cliente</h2>
                    <button className={estilos.btnCerrarModal} onClick={alCerrar}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <div className={estilos.filtrosHistorial}>
                    <button
                        className={`${estilos.btnFiltro} ${filtro === 'todo' ? estilos.activo : ''}`}
                        onClick={() => setFiltro('todo')}
                    >
                        Todo ({historial.length})
                    </button>
                    <button
                        className={`${estilos.btnFiltro} ${filtro === 'ventas' ? estilos.activo : ''}`}
                        onClick={() => setFiltro('ventas')}
                    >
                        Ventas ({historial.filter(h => h.tipo === 'venta').length})
                    </button>
                    <button
                        className={`${estilos.btnFiltro} ${filtro === 'pagos' ? estilos.activo : ''}`}
                        onClick={() => setFiltro('pagos')}
                    >
                        Pagos ({historial.filter(h => h.tipo === 'pago').length})
                    </button>
                </div>

                <div className={estilos.modalBody}>
                    {cargando ? (
                        <div className={estilos.cargandoHistorial}>
                            <div className={estilos.spinner}></div>
                            <p>Cargando historial...</p>
                        </div>
                    ) : historialFiltrado.length === 0 ? (
                        <div className={estilos.sinHistorial}>
                            <ion-icon name="document-outline"></ion-icon>
                            <p>No hay historial para mostrar</p>
                        </div>
                    ) : (
                        <div className={estilos.listaHistorial}>
                            {historialFiltrado.map((item, idx) => (
                                <div key={idx} className={estilos.itemHistorial}>
                                    <div className={estilos.itemIcono} style={{ '--color-tipo': getColorTipo(item.tipo) }}>
                                        <ion-icon name={getIconoTipo(item.tipo)}></ion-icon>
                                    </div>
                                    <div className={estilos.itemDetalles}>
                                        <div className={estilos.itemTitulo}>
                                            <span>{item.tipo === 'venta' ? 'Venta' : item.tipo === 'pago' ? 'Pago' : 'Movimiento'}</span>
                                            <span className={estilos.itemFecha}>{formatearFecha(item.fecha)}</span>
                                        </div>
                                        <div className={estilos.itemInfo}>
                                            {item.numero_comprobante && (
                                                <span>Comprobante: {item.numero_comprobante}</span>
                                            )}
                                            {item.referencia && (
                                                <span>Ref: {item.referencia}</span>
                                            )}
                                        </div>
                                        <div className={estilos.itemMonto}>
                                            {formatearMoneda(item.monto)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
