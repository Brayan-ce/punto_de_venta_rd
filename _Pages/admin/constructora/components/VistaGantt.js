"use client"
import estilos from '../constructora.module.css'

export default function VistaGantt({ ganttData, tema }) {
    return (
        <div className={`${estilos.seccionGantt} ${estilos[tema]}`}>
            <div className={estilos.ganttHeader}>
                <div>
                    <h2>
                        <ion-icon name="calendar-outline"></ion-icon>
                        Timeline de Proyectos (Diagrama de Gantt)
                    </h2>
                    <p>Visualización temporal de obras en ejecución</p>
                </div>
                <div className={estilos.ilustracionGantt}>
                    <img
                        src="/lustracion_reparaciones/Meter_3D.svg"
                        alt="Timeline"
                        width={80}
                        height={80}
                        className={estilos.ilustracion3D}
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>

            {ganttData.length === 0 ? (
                <div className={estilos.ganttVacio}>
                    <img
                        src="/illustrations3D/_0015.svg"
                        alt="Sin proyectos"
                        width={250}
                        height={250}
                        className={estilos.ilustracionVacio}
                        loading="lazy"
                        decoding="async"
                    />
                    <h3>No hay proyectos programados</h3>
                    <p>Crea una obra para visualizar su timeline</p>
                </div>
            ) : (
                <div className={estilos.ganttContainer}>
                    <div className={estilos.ganttTimeline}>
                        {ganttData.map(proyecto => (
                            <div key={proyecto.id} className={estilos.ganttRow}>
                                <div className={estilos.ganttInfo}>
                                    <span className={estilos.ganttCodigo}>{proyecto.codigo}</span>
                                    <h4 className={estilos.ganttNombre}>{proyecto.nombre}</h4>
                                    <div className={estilos.ganttFechas}>
                                        <span>
                                            <ion-icon name="play-outline"></ion-icon>
                                            {proyecto.inicio}
                                        </span>
                                        <span>
                                            <ion-icon name="flag-outline"></ion-icon>
                                            {proyecto.fin}
                                        </span>
                                    </div>
                                </div>
                                <div className={estilos.ganttBarra}>
                                    <div className={estilos.ganttBarraContainer}>
                                        <div 
                                            className={`${estilos.ganttBarraFill} ${estilos[proyecto.estado]}`}
                                            style={{ width: `${proyecto.progreso}%` }}
                                        >
                                            <span className={estilos.ganttProgreso}>{proyecto.progreso}%</span>
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

