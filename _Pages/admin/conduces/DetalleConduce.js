"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerDetalleConduce } from './ver/servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import { obtenerTextoEstado, obtenerTextoTipoOrigen } from './lib'
import estilos from './conduces.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function DetalleConduce({ id }) {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
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

    if (cargando) return <LoadingScreen />
    if (!conduce) return <div className={estilos.vacio}>{tr('Conduce no encontrado', 'Delivery note not found')}</div>

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.infoGralHeader}>
                    <Link href="/admin/conduces" className={estilos.btnIcono} style={{ marginBottom: '1rem', display: 'inline-flex' }}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                    </Link>
                    <h1 className={estilos.titulo}>{tr('Conduce', 'Delivery Note')} {conduce.numero_conduce}</h1>
                    <p className={estilos.subtitulo}>{tr('Referencia', 'Reference')}: {obtenerTextoTipoOrigen(conduce.tipo_origen, language)} #{conduce.numero_origen}</p>
                </div>
                <div className={estilos.accionesDetalle}>
                    <Link href={`/admin/conduces/${id}/imprimir`} className={estilos.btnNuevo} style={{ background: '#10b981' }}>
                        <ion-icon name="print-outline"></ion-icon>
                        <span>{tr('Imprimir', 'Print')}</span>
                    </Link>
                </div>
            </div>

            <div className={estilos.gridCuerpo}>
                <div className={estilos.infoPanel}>
                    <div className={estilos.datosSeccion}>
                        <h3 className={estilos.logisticaSeccion} style={{ border: 'none', padding: 0, color: '#191726' }}>{tr('Informacion General', 'General Information')}</h3>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.dato}>
                                <label>{tr('Cliente', 'Customer')}</label>
                                <p>{conduce.cliente_nombre || 'N/A'}</p>
                            </div>
                            <div className={estilos.dato}>
                                <label>{tr('Fecha Despacho', 'Dispatch Date')}</label>
                                <p>{new Date(conduce.fecha_conduce).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</p>
                            </div>
                            <div className={estilos.dato}>
                                <label>{tr('Estado Actual', 'Current Status')}</label>
                                <p><span className={`${estilos.badge} ${estilos[conduce.estado]}`}>{obtenerTextoEstado(conduce.estado, language)}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.logisticaSeccion}>
                        <h4>{tr('Datos del Transporte', 'Transport Information')}</h4>
                        <div className={estilos.infoGrid}>
                            <div className={estilos.dato}>
                                <label>{tr('Chofer', 'Driver')}</label>
                                <p>{conduce.chofer || tr('No especificado', 'Not specified')}</p>
                            </div>
                            <div className={estilos.dato}>
                                <label>{tr('Vehiculo', 'Vehicle')}</label>
                                <p>{conduce.vehiculo || '-'}</p>
                            </div>
                            <div className={estilos.dato}>
                                <label>{tr('Placa', 'Plate')}</label>
                                <p>{conduce.placa || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {conduce.observaciones && (
                        <div className={estilos.logisticaSeccion}>
                            <h4>{tr('Observaciones', 'Notes')}</h4>
                            <p className={estilos.subtitulo} style={{ color: '#191726', fontSize: '1rem' }}>{conduce.observaciones}</p>
                        </div>
                    )}
                </div>

                <div className={estilos.tablaContenedor}>
                    <table className={estilos.tabla} style={{ border: 'none' }}>
                        <thead>
                            <tr>
                                <th>{tr('Cod. Barras', 'Barcode')}</th>
                                <th>{tr('Producto Entregado', 'Delivered Product')}</th>
                                <th style={{ textAlign: 'right' }}>{tr('Cantidad', 'Quantity')}</th>
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

