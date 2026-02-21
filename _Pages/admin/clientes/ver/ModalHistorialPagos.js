"use client"

import { useEffect, useState } from "react"
import estilos from "./modales.module.css"

export default function ModalHistorialPagos({ clienteId, cliente, alCerrar, tema }) {
    const [pagos, setPagos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtro, setFiltro] = useState('todos') // todos, pagados, pendientes
    const [sorteo, setSorteo] = useState('reciente') // reciente, antiguos, mayor, menor

    useEffect(() => {
        cargarHistorialPagos()
    }, [clienteId])

    const cargarHistorialPagos = async () => {
        setCargando(true)
        try {
            const respuesta = await fetch(`/api/clientes/${clienteId}/pagos`)
            const datos = await respuesta.json()
            if (datos.success) {
                setPagos(datos.pagos || [])
            }
        } catch (error) {
            console.error("Error al cargar pagos:", error)
        } finally {
            setCargando(false)
        }
    }

    const pagosFiltrados = pagos.filter(p => {
        if (filtro === 'pagados') return p.estado === 'completado'
        if (filtro === 'pendientes') return ['pendiente', 'vencido'].includes(p.estado)
        return true
    }).sort((a, b) => {
        if (sorteo === 'reciente') return new Date(b.fecha) - new Date(a.fecha)
        if (sorteo === 'antiguos') return new Date(a.fecha) - new Date(b.fecha)
        if (sorteo === 'mayor') return b.monto - a.monto
        if (sorteo === 'menor') return a.monto - b.monto
        return 0
    })

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatearMoneda = (valor) =>
        new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(valor || 0)

    const getColorEstado = (estado) => {
        if (estado === 'completado') return '#10b981'
        if (estado === 'vencido') return '#ef4444'
        if (estado === 'pendiente') return '#f59e0b'
        return '#6b7280'
    }

    const getTextEstado = (estado) => {
        if (estado === 'completado') return 'Pagado'
        if (estado === 'vencido') return 'Vencido'
        if (estado === 'pendiente') return 'Pendiente'
        return 'Desconocido'
    }

    const calcularTotales = () => {
        return {
            total: pagosFiltrados.reduce((sum, p) => sum + p.monto, 0),
            pagados: pagosFiltrados.filter(p => p.estado === 'completado').reduce((sum, p) => sum + p.monto, 0),
            pendientes: pagosFiltrados.filter(p => ['pendiente', 'vencido'].includes(p.estado)).reduce((sum, p) => sum + p.monto, 0)
        }
    }

    const totales = calcularTotales()

    return (
        <div className={`${estilos.modalOverlay} ${estilos[tema]}`} onClick={alCerrar}>
            <div className={`${estilos.modalContent} ${estilos.modalAncho} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                <div className={estilos.modalHeader}>
                    <h2>Historial de Pagos</h2>
                    <button className={estilos.btnCerrarModal} onClick={alCerrar}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <div className={estilos.modalBody}>
                    <div className={estilos.resumenPagos}>
                        <div className={estilos.tarjetaResumen}>
                            <span>Total Deuda:</span>
                            <strong style={{ color: '#ef4444' }}>{formatearMoneda(cliente.deuda?.total || 0)}</strong>
                        </div>
                        <div className={estilos.tarjetaResumen}>
                            <span>Pagado:</span>
                            <strong style={{ color: '#10b981' }}>{formatearMoneda(totales.pagados)}</strong>
                        </div>
                        <div className={estilos.tarjetaResumen}>
                            <span>Pendiente:</span>
                            <strong style={{ color: '#f59e0b' }}>{formatearMoneda(totales.pendientes)}</strong>
                        </div>
                    </div>

                    <div className={estilos.filtrosYOrdenes}>
                        <div className={estilos.grupo}>
                            <label>Filtrar:</label>
                            <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                                <option value="todos">Todos ({pagos.length})</option>
                                <option value="pagados">
                                    Pagados ({pagos.filter(p => p.estado === 'completado').length})
                                </option>
                                <option value="pendientes">
                                    Pendientes ({pagos.filter(p => ['pendiente', 'vencido'].includes(p.estado)).length})
                                </option>
                            </select>
                        </div>
                        <div className={estilos.grupo}>
                            <label>Ordenar por:</label>
                            <select value={sorteo} onChange={(e) => setSorteo(e.target.value)}>
                                <option value="reciente">Más Recientes</option>
                                <option value="antiguos">Más Antiguos</option>
                                <option value="mayor">Monto Mayor</option>
                                <option value="menor">Monto Menor</option>
                            </select>
                        </div>
                    </div>

                    <div className={estilos.listaPagos}>
                        {cargando ? (
                            <div className={estilos.cargandoHistorial}>
                                <div className={estilos.spinner}></div>
                                <p>Cargando pagos...</p>
                            </div>
                        ) : pagosFiltrados.length === 0 ? (
                            <div className={estilos.sinHistorial}>
                                <ion-icon name="document-outline"></ion-icon>
                                <p>No hay pagos para mostrar</p>
                            </div>
                        ) : (
                            <div className={estilos.tablaPagos}>
                                <div className={estilos.encabezadoTabla}>
                                    <div className={estilos.colFecha}>Fecha</div>
                                    <div className={estilos.colReferencia}>Referencia</div>
                                    <div className={estilos.colMonto}>Monto</div>
                                    <div className={estilos.colEstado}>Estado</div>
                                    <div className={estilos.colMetodo}>Método</div>
                                </div>
                                {pagosFiltrados.map((pago, idx) => (
                                    <div key={idx} className={estilos.filaPago}>
                                        <div className={estilos.colFecha}>
                                            {formatearFecha(pago.fecha)}
                                        </div>
                                        <div className={estilos.colReferencia}>
                                            {pago.referencia || pago.numero_comprobante || 'N/A'}
                                        </div>
                                        <div className={estilos.colMonto}>
                                            <strong>{formatearMoneda(pago.monto)}</strong>
                                        </div>
                                        <div className={estilos.colEstado}>
                                            <span
                                                className={estilos.badgeEstado}
                                                style={{
                                                    '--bg-color': getColorEstado(pago.estado),
                                                }}
                                            >
                                                {getTextEstado(pago.estado)}
                                            </span>
                                        </div>
                                        <div className={estilos.colMetodo}>
                                            {pago.metodo_pago || 'N/A'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className={estilos.modalFooter}>
                    <button className={estilos.btnSecundario} onClick={() => {}}>
                        <ion-icon name="download-outline"></ion-icon>
                        Descargar Reporte
                    </button>
                    <button className={estilos.btnCancelar} onClick={alCerrar}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}
