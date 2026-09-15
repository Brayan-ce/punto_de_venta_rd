"use client"
import { useRouter } from 'next/navigation'
import { formatearEstadoObra } from '../../core/construction/estados'
import { calcularPorcentajeEjecutado, calcularDiasRestantes } from '../../core/construction/calculos'
import estilos from '../obras.module.css'

export default function VistaTimeline({ obras, tema, router }) {
    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'
        return new Date(fecha).toLocaleDateString('es-DO', {
            month: 'short',
            day: 'numeric'
        })
    }

    // Agrupar obras por mes
    const obrasPorMes = obras.reduce((acc, obra) => {
        if (!obra.fecha_inicio) return acc
        const mes = new Date(obra.fecha_inicio).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long'
        })
        if (!acc[mes]) acc[mes] = []
        acc[mes].push(obra)
        return acc
    }, {})

    return (
        <div className={`${estilos.timelineContainer} ${estilos[tema]}`}>
            <div className={estilos.timelineHeader}>
                <h2>
                    <ion-icon name="time-outline"></ion-icon>
                    Línea de Tiempo de Obras
                </h2>
                <p>Visualización cronológica de todas las obras</p>
            </div>

            {Object.keys(obrasPorMes).length === 0 ? (
                <div className={estilos.timelineVacio}>
                    <ion-icon name="time-outline"></ion-icon>
                    <h3>No hay obras con fechas programadas</h3>
                    <p>Las obras aparecerán aquí cuando tengan fecha de inicio</p>
                </div>
            ) : (
                <div className={estilos.timelineContent}>
                    {Object.entries(obrasPorMes).map(([mes, obrasMes]) => (
                        <div key={mes} className={estilos.timelineMes}>
                            <div className={estilos.timelineMesHeader}>
                                <h3>{mes}</h3>
                                <span className={estilos.timelineMesCount}>{obrasMes.length} obra(s)</span>
                            </div>
                            <div className={estilos.timelineObras}>
                                {obrasMes.map(obra => {
                                    const porcentajeEjecutado = calcularPorcentajeEjecutado(
                                        obra.costo_real || obra.costo_ejecutado || 0,
                                        obra.presupuesto_aprobado || 0
                                    )
                                    const estadoFormateado = formatearEstadoObra(obra.estado)

                                    return (
                                        <div 
                                            key={obra.id} 
                                            className={estilos.timelineObra}
                                            onClick={() => router.push(`/admin/obras/ver/${obra.id}`)}
                                        >
                                            <div className={estilos.timelineObraFecha}>
                                                <span>{formatearFecha(obra.fecha_inicio)}</span>
                                            </div>
                                            <div className={estilos.timelineObraContent}>
                                                <div className={estilos.timelineObraHeader}>
                                                    <h4>{obra.nombre}</h4>
                                                    <div className={`${estilos.estado} ${estilos[estadoFormateado.color]}`}>
                                                        <span>{estadoFormateado.texto}</span>
                                                    </div>
                                                </div>
                                                {obra.ubicacion && (
                                                    <p className={estilos.timelineObraUbicacion}>
                                                        <ion-icon name="location-outline"></ion-icon>
                                                        {obra.ubicacion}
                                                    </p>
                                                )}
                                                {porcentajeEjecutado > 0 && (
                                                    <div className={estilos.timelineObraProgreso}>
                                                        <span>Progreso: {porcentajeEjecutado.toFixed(0)}%</span>
                                                        <div className={estilos.barraProgreso}>
                                                            <div 
                                                                className={estilos.progresoFill}
                                                                style={{ 
                                                                    width: `${Math.min(porcentajeEjecutado, 100)}%`,
                                                                    background: porcentajeEjecutado >= 90 
                                                                        ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                                                                        : porcentajeEjecutado >= 70
                                                                        ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                                                                        : 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

