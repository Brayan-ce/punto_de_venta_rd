"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { obtenerCotizacionPorId, obtenerDatosEmpresa } from '../ver/servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './imprimir.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ImprimirCotizacion({ id: propId }) {
    const params = useParams()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [cotizacion, setCotizacion] = useState(null)
    const [detalle, setDetalle] = useState([])
    const [cargando, setCargando] = useState(true)
    const [empresa, setEmpresa] = useState(null)

    // Obtener ID desde props o params
    const cotizacionId = propId || params?.id

    useEffect(() => {
        if (cotizacionId) {
            cargarData(cotizacionId)
        }
        cargarEmpresa()
    }, [cotizacionId])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargarData = async (id) => {
        setCargando(true)
        try {
            const res = await obtenerCotizacionPorId(id)
            if (res.success) {
                setCotizacion(res.cotizacion)
                setDetalle(res.detalle)
                // Disparar impresión después de cargar datos
                setTimeout(() => {
                    window.print()
                }, 1000)
            }
        } catch (error) {
            console.error('Error al cargar cotización:', error)
        } finally {
            setCargando(false)
        }
    }

    if (cargando || !cotizacion) {
        return <LoadingScreen />
    }

    return (
        <>
            <div className={estilos.printContainer}>
                <div className={estilos.printHeader}>
                    <h1>{tr('COTIZACION', 'QUOTE')}</h1>
                    <div className={estilos.printNumero}>No. {cotizacion.numero_cotizacion}</div>
                </div>

                <div className={estilos.printInfo}>
                    <div className={estilos.printCol}>
                        <strong>{tr('CLIENTE:', 'CUSTOMER:')}</strong>
                        <p>{cotizacion.cliente_nombre}</p>
                        <p>{tr('Doc', 'ID')}: {cotizacion.cliente_documento || 'N/A'}</p>
                        <p>{tr('Tel', 'Phone')}: {cotizacion.cliente_telefono || 'N/A'}</p>
                    </div>
                    <div className={estilos.printCol}>
                        <p><strong>{tr('FECHA EMISION:', 'ISSUE DATE:')}</strong> {new Date(cotizacion.fecha_emision).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</p>
                        <p><strong>{tr('VENCE:', 'DUE DATE:')}</strong> {new Date(cotizacion.fecha_vencimiento).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</p>
                    </div>
                </div>

                <table className={estilos.printTabla}>
                    <thead>
                        <tr>
                            <th>CANT.</th>
                            <th>{tr('DESCRIPCION', 'DESCRIPTION')}</th>
                            <th>{tr('PRECIO', 'PRICE')}</th>
                            <th>ITBIS</th>
                            <th>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detalle.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.cantidad}</td>
                                <td>{item.nombre_producto}</td>
                                <td>{parseFloat(item.precio_unitario).toFixed(2)}</td>
                                <td>{parseFloat(item.itbis || 0).toFixed(2)}</td>
                                <td>{parseFloat(item.total).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className={estilos.printFooter}>
                    <div className={estilos.printObservaciones}>
                        <strong>{tr('Observaciones:', 'Notes:')}</strong>
                        <p>{cotizacion.observaciones || tr('Gracias por su preferencia.', 'Thank you for your preference.')}</p>
                    </div>
                    <div className={estilos.printTotales}>
                        <div className={estilos.printLinTotal}>
                            <span>{tr('SUBTOTAL:', 'SUBTOTAL:')}</span>
                            <span>{new Intl.NumberFormat(empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO'), { style: 'currency', currency: empresa?.moneda || 'DOP' }).format(parseFloat(cotizacion.subtotal))}</span>
                        </div>
                        <div className={estilos.printLinTotal}>
                            <span>ITBIS:</span>
                            <span>{new Intl.NumberFormat(empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO'), { style: 'currency', currency: empresa?.moneda || 'DOP' }).format(parseFloat(cotizacion.itbis))}</span>
                        </div>
                        {cotizacion.descuento > 0 && (
                            <div className={estilos.printLinTotal}>
                                <span>{tr('DESCUENTO:', 'DISCOUNT:')}</span>
                                <span>-{new Intl.NumberFormat(empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO'), { style: 'currency', currency: empresa?.moneda || 'DOP' }).format(parseFloat(cotizacion.descuento))}</span>
                            </div>
                        )}
                        <div className={`${estilos.printLinTotal} ${estilos.printFinal}`}>
                            <span>TOTAL:</span>
                            <span>{new Intl.NumberFormat(empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO'), { style: 'currency', currency: empresa?.moneda || 'DOP' }).format(parseFloat(cotizacion.total))}</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    nav, button, .no-print { display: none !important; }
                    body { background: white !important; }
                    .contenedor { padding: 0 !important; }
                }
            `}</style>
        </>
    )
}

