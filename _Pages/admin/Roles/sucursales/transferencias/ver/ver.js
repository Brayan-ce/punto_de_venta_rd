"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/_Pages/admin/i18n'
import { obtenerTransferencia } from './servidor'
import estilos from './ver.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function VerTransferenciaSucursal() {
    const { id } = useParams()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [mounted, setMounted] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [transferencia, setTransferencia] = useState(null)
    const [detalle, setDetalle] = useState([])

    useEffect(() => {
        setMounted(true)
        setTema(localStorage.getItem('tema') || 'light')

        const handleTemaChange = () => setTema(localStorage.getItem('tema') || 'light')

        const cargar = async () => {
            const res = await obtenerTransferencia(id)
            if (!res?.success) {
                setError(res?.mensaje || tr('No se pudo cargar', 'Could not load'))
                setCargando(false)
                return
            }

            setTransferencia(res.transferencia)
            setDetalle(res.detalle || [])
            setCargando(false)
        }

        if (id) cargar()
        window.addEventListener('temaChange', handleTemaChange)
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [id])

    const estadoTexto = (estado) => {
        const mapa = {
            pendiente: tr('Pendiente', 'Pending'),
            aprobada: tr('Aprobada', 'Approved'),
            en_transito: tr('En Transito', 'In Transit'),
            recibida: tr('Recibida', 'Received'),
            rechazada: tr('Rechazada', 'Rejected'),
            cancelada: tr('Cancelada', 'Canceled')
        }
        return mapa[estado] || estado
    }

    if (!mounted) return null

    if (cargando) {
        return <LoadingScreen />
    }

    if (!transferencia) {
        return <div className={`${estilos.contenedor} ${estilos[tema]}`}><div className={estilos.estado}>{error || tr('No encontrado', 'Not found')}</div></div>
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.topbar}>
                <h1>{transferencia.numero_transferencia}</h1>
                <div className={estilos.accionesTop}>
                    <Link href="/sucursales/transferencias" className={estilos.btnSecundario}>{tr('Volver', 'Back')}</Link>
                    {transferencia.estado === 'pendiente' && (
                        <Link href={`/sucursales/transferencias/editar/${id}`} className={estilos.btnPrimario}>{tr('Editar', 'Edit')}</Link>
                    )}
                </div>
            </div>

            <div className={estilos.card}>
                <div className={estilos.fila}><span>{tr('Origen', 'Origin')}</span><strong>{transferencia.sucursal_origen || '-'}</strong></div>
                <div className={estilos.fila}><span>{tr('Destino', 'Destination')}</span><strong>{transferencia.sucursal_destino || '-'}</strong></div>
                <div className={estilos.fila}><span>{tr('Estado', 'Status')}</span><strong>{estadoTexto(transferencia.estado)}</strong></div>
                <div className={estilos.fila}><span>{tr('Prioridad', 'Priority')}</span><strong>{transferencia.prioridad || '-'}</strong></div>
                <div className={estilos.fila}><span>{tr('Fecha', 'Date')}</span><strong>{transferencia.fecha_solicitud ? new Date(transferencia.fecha_solicitud).toLocaleString(language === 'en' ? 'en-US' : 'es-DO') : '-'}</strong></div>
                <div className={estilos.fila}><span>{tr('Nota', 'Note')}</span><strong>{transferencia.observacion_origen || '-'}</strong></div>
            </div>

            <div className={estilos.tablaWrap}>
                <h3>{tr('Productos', 'Products')}</h3>
                {detalle.length === 0 ? (
                    <p className={estilos.vacio}>{tr('Sin productos en la transferencia', 'No products in this transfer')}</p>
                ) : (
                    <div className={estilos.tabla}>
                        <table>
                            <thead>
                                <tr>
                                    <th>{tr('Producto', 'Product')}</th>
                                    <th>{tr('Codigo', 'Code')}</th>
                                    <th>{tr('Solicitada', 'Requested')}</th>
                                    <th>{tr('Enviada', 'Sent')}</th>
                                    <th>{tr('Recibida', 'Received')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detalle.map((d) => (
                                    <tr key={d.id}>
                                        <td>{d.producto_nombre}</td>
                                        <td>{d.producto_codigo}</td>
                                        <td>{Number(d.cantidad_solicitada || 0).toFixed(2)}</td>
                                        <td>{Number(d.cantidad_enviada || 0).toFixed(2)}</td>
                                        <td>{Number(d.cantidad_recibida || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
