"use client"
import estilos from '../constructora.module.css'

export default function NavVistas({ vistaActiva, setVistaActiva }) {
    return (
        <div className={estilos.navVistas}>
            <button 
                className={`${estilos.btnVista} ${vistaActiva === 'resumen' ? estilos.vistaActiva : ''}`}
                onClick={() => setVistaActiva('resumen')}
            >
                <ion-icon name="analytics-outline"></ion-icon>
                <span>Resumen</span>
            </button>
            <button 
                className={`${estilos.btnVista} ${vistaActiva === 'gantt' ? estilos.vistaActiva : ''}`}
                onClick={() => setVistaActiva('gantt')}
            >
                <ion-icon name="calendar-outline"></ion-icon>
                <span>Timeline (Gantt)</span>
            </button>
            <button 
                className={`${estilos.btnVista} ${vistaActiva === 'horarios' ? estilos.vistaActiva : ''}`}
                onClick={() => setVistaActiva('horarios')}
            >
                <ion-icon name="time-outline"></ion-icon>
                <span>Horarios</span>
            </button>
        </div>
    )
}

