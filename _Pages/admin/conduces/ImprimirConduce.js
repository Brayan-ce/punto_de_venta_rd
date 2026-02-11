"use client"
import { useEffect, useState } from 'react'
import { obtenerDatosImpresion } from './imprimir/servidor'
import estilos from './conduces.module.css'

export default function ImprimirConduce({ id }) {
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

    if (!conduce) return <div>Cargando...</div>

    return (
        <div className={estilos.printContainer}>
            <div className={estilos.printHeader}>
                <h1>CONDUCE DE DESPACHO</h1>
                <div className={estilos.printNumero}>No. {conduce.numero_conduce}</div>
            </div>

            <div className={estilos.printInfo}>
                <div className={estilos.printCol}>
                    <strong>CLIENTE:</strong>
                    <p>{conduce.cliente_nombre}</p>
                    <p>Origen: {conduce.tipo_origen} #{conduce.numero_origen}</p>
                </div>
                <div className={estilos.printCol}>
                    <p><strong>FECHA DESPACHO:</strong> {new Date(conduce.fecha_conduce).toLocaleDateString()}</p>
                    <p><strong>CHOFER:</strong> {conduce.chofer || 'N/A'}</p>
                    <p><strong>VEHÍCULO:</strong> {conduce.vehiculo || 'N/A'} ({conduce.placa || '-'})</p>
                </div>
            </div>

            <table className={estilos.printTabla}>
                <thead>
                    <tr>
                        <th>CANT.</th>
                        <th>DESCRIPCIÓN</th>
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
                    <span>RECIBIDO POR (FIRMA)</span>
                </div>
                <div className={estilos.firmaCaja}>
                    <div className={estilos.lineaFirma}></div>
                    <span>ENTREGADO POR</span>
                </div>
            </div>

            <div className={estilos.printObservaciones}>
                <strong>Observaciones:</strong>
                <p>{conduce.observaciones || 'Favor revisar mercancía antes de firmar.'}</p>
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

