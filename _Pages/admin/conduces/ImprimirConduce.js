"use client"
import { useEffect, useState } from 'react'
import { obtenerDatosImpresion } from './imprimir/servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import { obtenerTextoTipoOrigen } from './lib'
import estilos from './conduces.module.css'

export default function ImprimirConduce({ id }) {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [conduce, setConduce] = useState(null)
    const [detalle, setDetalle] = useState([])

    useEffect(() => {
        if (!id) return

        const cargarData = async () => {
            const res = await obtenerDatosImpresion(id)
            if (res.success) {
                setConduce(res.conduce)
                setDetalle(res.detalle)
                setTimeout(() => window.print(), 1000)
            }
        }
        cargarData()
    }, [id])

    if (!conduce) return <div>{tr('Cargando...', 'Loading...')}</div>

    return (
        <div className={estilos.printContainer}>
            <div className={estilos.printHeader}>
                <h1>{tr('CONDUCE DE DESPACHO', 'DELIVERY NOTE')}</h1>
                <div className={estilos.printNumero}>No. {conduce.numero_conduce}</div>
            </div>

            <div className={estilos.printInfo}>
                <div className={estilos.printCol}>
                    <strong>{tr('CLIENTE:', 'CUSTOMER:')}</strong>
                    <p>{conduce.cliente_nombre}</p>
                    <p>{tr('Origen', 'Source')}: {obtenerTextoTipoOrigen(conduce.tipo_origen, language)} #{conduce.numero_origen}</p>
                </div>
                <div className={estilos.printCol}>
                    <p><strong>{tr('FECHA DESPACHO:', 'DISPATCH DATE:')}</strong> {new Date(conduce.fecha_conduce).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</p>
                    <p><strong>{tr('CHOFER:', 'DRIVER:')}</strong> {conduce.chofer || 'N/A'}</p>
                    <p><strong>{tr('VEHICULO:', 'VEHICLE:')}</strong> {conduce.vehiculo || 'N/A'} ({conduce.placa || '-'})</p>
                </div>
            </div>

            <table className={estilos.printTabla}>
                <thead>
                    <tr>
                        <th>CANT.</th>
                        <th>{tr('DESCRIPCION', 'DESCRIPTION')}</th>
                    </tr>
                </thead>
                <tbody>
                    {detalle.map((item, idx) => (
                        <tr key={idx}>
                            <td width="100">{item.cantidad_despachada}</td>
                            <td>{item.nombre_producto}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className={estilos.firmaSeccion}>
                <div className={estilos.firmaCaja}>
                    <div className={estilos.lineaFirma}></div>
                    <span>{tr('RECIBIDO POR (FIRMA)', 'RECEIVED BY (SIGNATURE)')}</span>
                </div>
                <div className={estilos.firmaCaja}>
                    <div className={estilos.lineaFirma}></div>
                    <span>{tr('ENTREGADO POR', 'DELIVERED BY')}</span>
                </div>
            </div>

            <div className={estilos.printObservaciones}>
                <strong>{tr('Observaciones:', 'Notes:')}</strong>
                <p>{conduce.observaciones || tr('Favor revisar mercancia antes de firmar.', 'Please inspect merchandise before signing.')}</p>
            </div>

            <style jsx global>{`
                @media print {
                    nav, button, .no-print { display: none !important; }
                    body { background: white !important; }
                    .contenedor { padding: 0 !important; }
                }
            `}</style>
        </div>
    )
}

