"use client"
import estilos from '../obras.module.css'

export default function VistaGantt({ ganttData, tema }) {
    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className={`${estilos.seccionGantt} ${estilos[tema]}`}>
            <div className={estilos.ganttHeader}>
                <div>
                    <h2>
                        <ion-icon name="calendar-outline"></ion-icon>
                        Timeline de Obras (Diagrama de Gantt)
                    </h2>
                    <p>Visualización temporal de obras en ejecución</p>
                </div>
            </div>

            {ganttData.length === 0 ? (
                <div className={estilos.ganttVacio}>
                    <ion-icon name="calendar-outline"></ion-icon>
                    <h3>No hay obras programadas</h3>
                    <p>Crea una obra para visualizar su timeline</p>
                </div>
            ) : (
                <div className={estilos.ganttContainer}>
                    <div className={estilos.ganttTimeline}>
                        {ganttData.map(obra => (
                            <div key={obra.id} className={estilos.ganttRow}>
                                <div className={estilos.ganttInfo}>
                                    <span className={estilos.ganttCodigo}>{obra.codigo}</span>
                                    <h4 className={estilos.ganttNombre}>{obra.nombre}</h4>
                                    <div className={estilos.ganttFechas}>
                                        <span>
                                            <ion-icon name="play-outline"></ion-icon>
                                            {formatearFecha(obra.inicio)}
                                        </span>
                                        <span>
                                            <ion-icon name="flag-outline"></ion-icon>
                                            {formatearFecha(obra.fin)}
                                        </span>
                                    </div>
                                </div>
                                <div className={estilos.ganttBarra}>
                                    <div className={estilos.ganttBarraContainer}>
                                        <div 
                                            className={`${estilos.ganttBarraFill} ${estilos[obra.estado] || estilos.activa}`}
                                            style={{ width: `${obra.progreso}%` }}
                                        >
                                            <span className={estilos.ganttProgreso}>{obra.progreso}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

