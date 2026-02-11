"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerDetalleConduce } from './ver/servidor'
import estilos from './conduces.module.css'

export default function DetalleConduce({ id }) {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [conduce, setConduce] = useState(null)
    const [detalle, setDetalle] = useState([])

    useEffect(() => {
        setTema(localStorage.getItem('tema') || 'light')
        cargarDetalle()
    }, [id])

    const cargarDetalle = async () => {
        setCargando(true)
        try {
            const res = await obtenerDetalleConduce(id)
            if (res.success) {
                setConduce(res.conduce)
                setDetalle(res.detalle)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setCargando(false)
        }
    }

    if (cargando) return <div className={estilos.cargando}>Cargando detalle del despacho...</div>
    if (!conduce) return <div className={estilos.vacio}>Conduce no encontrado</div>

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.infoGralHeader}>
                    <Link href="/admin/conduces" className={estilos.btnIcono} style={{ marginBottom: '1rem', display: 'inline-flex' }}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                    </Link>
                    <h1 className={estilos.titulo}>Conduce {conduce.numero_conduce}</h1>
                    <p className={estilos.subtitulo}>Referencia: {conduce.tipo_origen} #{conduce.numero_origen}</p>
                </div>
                <div className={estilos.accionesDetalle}>
                    <Link href={`/admin/conduces/${id}/imprimir`} className={estilos.btnNuevo} style={{ background: '#10b981' }}>
                        <ion-icon name="print-outline"></ion-icon>
                        <span>Imprimir</span>
                    </Link>
                </div>
            </div>

            <div className={estilos.gridCuerpo}>
                <div className={estilos.infoPanel}>
                    <div className={estilos.datosSeccion}>
                        <h3 className={estilos.logisticaSeccion} style={{ border: 'none', padding: 0, color: '#191726' }}>Información General</h3>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.dato}>
                                <label>Cliente</label>
                                <p>{conduce.cliente_nombre || 'N/A'}</p>
                            </div>
                            <div className={estilos.dato}>
                                <label>Fecha Despacho</label>
                                <p>{new Date(conduce.fecha_conduce).toLocaleDateString()}</p>
                            </div>
                            <div className={estilos.dato}>
                                <label>Estado Actual</label>
                                <p><span className={`${estilos.badge} ${estilos[conduce.estado]}`}>{conduce.estado}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.logisticaSeccion}>
                        <h4>Datos del Transporte</h4>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.dato}>
                                <label>Chofer</label>
                                <p>{conduce.chofer || 'No especificado'}</p>
                            </div>
                            <div className={estilos.dato}>
                                <label>Vehículo</label>
                                <p>{conduce.vehiculo || '-'}</p>
                            </div>
                            <div className={estilos.dato}>
                                <label>Placa</label>
                                <p>{conduce.placa || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {conduce.observaciones && (
                        <div className={estilos.logisticaSeccion}>
                            <h4>Observaciones</h4>
                            <p className={estilos.subtitulo} style={{ color: '#191726', fontSize: '1rem' }}>{conduce.observaciones}</p>
                        </div>
                    )}
                </div>

                <div className={estilos.tablaContenedor}>
                    <table className={estilos.tabla} style={{ border: 'none' }}>
                        <thead>
                            <tr>
                                <th>Cód. Barras</th>
                                <th>Producto Entregado</th>
                                <th style={{ textAlign: 'right' }}>Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detalle.map((item, idx) => (
                                <tr key={idx}>
                                    <td><code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{item.codigo_barras || 'N/A'}</code></td>
                                    <td style={{ fontWeight: '600' }}>{item.nombre_producto}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '1.125rem' }}>{item.cantidad_despachada}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

