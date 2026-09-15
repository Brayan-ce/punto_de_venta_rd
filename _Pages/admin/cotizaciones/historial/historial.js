"use client"
import { useEffect, useState } from 'react'
import { obtenerHistorial } from './servidor'
import { Clock } from 'lucide-react'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './historial.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function HistorialCotizacion({ cotizacionId }) {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [historial, setHistorial] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarHistorial()
    }, [cotizacionId])

    const cargarHistorial = async () => {
        setCargando(true)
        try {
            const res = await obtenerHistorial(cotizacionId)
            if (res.success) {
                setHistorial(res.historial)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setCargando(false)
        }
    }

    const obtenerIconoAccion = (accion) => {
        const iconos = {
            'creada': '✨',
            'editada': '✏️',
            'estado_cambiado': '🔄',
            'producto_agregado': '➕',
            'producto_eliminado': '➖',
            'producto_modificado': '📝',
            'enviada_cliente': '📧',
            'convertida_venta': '💰',
            'cancelada': '❌',
            'version_creada': '📋',
            'nota_agregada': '📌',
            'adjunto_agregado': '📎'
        }
        return iconos[accion] || '📄'
    }

    const formatearFecha = (fecha) => {
        const date = new Date(fecha)
        return date.toLocaleString(language === 'en' ? 'en-US' : 'es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (cargando) {
        return <LoadingScreen />
    }

    if (historial.length === 0) {
        return (
            <div className={estilos.card}>
                <p className={estilos.vacio}>{tr('No hay historial disponible', 'No history available')}</p>
            </div>
        )
    }

    return (
        <div className={estilos.card}>
            <h3 className={estilos.titulo}>{tr('Historial de Cambios', 'Change History')}</h3>
            <div className={estilos.listaHistorial}>
                {historial.map((item, index) => (
                    <div 
                        key={item.id}
                        className={`${estilos.itemHistorial} ${index % 2 === 0 ? estilos.itemPar : estilos.itemImpar}`}
                    >
                        <div className={estilos.iconoAccion}>
                            {obtenerIconoAccion(item.accion)}
                        </div>
                        <div className={estilos.contenidoItem}>
                            <div className={estilos.headerItem}>
                                <strong className={estilos.usuarioNombre}>
                                    {item.usuario_nombre || tr('Sistema', 'System')}
                                </strong>
                                <span className={estilos.accionTexto}>
                                    {item.accion.replace(/_/g, ' ')}
                                </span>
                            </div>
                            {item.comentario && (
                                <p className={estilos.comentario}>
                                    {item.comentario}
                                </p>
                            )}
                            {item.campo_modificado && (
                                <div className={estilos.cambioCampo}>
                                    <span className={estilos.campoNombre}>{item.campo_modificado}:</span>
                                    {item.valor_anterior && (
                                        <span className={estilos.valorAnterior}>
                                            {item.valor_anterior}
                                        </span>
                                    )}
                                    {item.valor_nuevo && (
                                        <span className={estilos.valorNuevo}>
                                            → {item.valor_nuevo}
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className={estilos.fechaItem}>
                                <Clock className={estilos.iconoFecha} />
                                {formatearFecha(item.fecha_accion)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

