"use client"
import estilos from '../servicios.module.css'

export default function EstadisticasKPI({ tema, estadisticas, serviciosAlerta, serviciosHoy }) {
    return (
        <div className={`${estilos.kpisGrid} ${estilos[tema]}`}>
            <div className={`${estilos.kpiCard} ${estilos.kpiPrimary} ${estilos[tema]}`}>
                <div className={estilos.kpiIcono}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                </div>
                <div className={estilos.kpiInfo}>
                    <span className={estilos.kpiLabel}>Requieren Atención</span>
                    <span className={estilos.kpiValor}>{serviciosAlerta.length}</span>
                    <span className={estilos.kpiDescripcion}>
                        <ion-icon name="warning-outline"></ion-icon>
                        Servicios urgentes o retrasados
                    </span>
                </div>
            </div>

            <div className={`${estilos.kpiCard} ${estilos.kpiSecondary} ${estilos[tema]}`}>
                <div className={estilos.kpiIcono}>
                    <ion-icon name="calendar-outline"></ion-icon>
                </div>
                <div className={estilos.kpiInfo}>
                    <span className={estilos.kpiLabel}>Programados Hoy</span>
                    <span className={estilos.kpiValor}>{serviciosHoy.length}</span>
                    <span className={estilos.kpiDescripcion}>
                        <ion-icon name="time-outline"></ion-icon>
                        Servicios para ejecutar hoy
                    </span>
                </div>
            </div>

            <div className={`${estilos.kpiCard} ${estilos.kpiSuccess} ${estilos[tema]}`}>
                <div className={estilos.kpiIcono}>
                    <ion-icon name="play-circle-outline"></ion-icon>
                </div>
                <div className={estilos.kpiInfo}>
                    <span className={estilos.kpiLabel}>En Ejecución</span>
                    <span className={estilos.kpiValor}>{estadisticas.en_ejecucion}</span>
                    <span className={estilos.kpiDescripcion}>
                        <ion-icon name="pulse-outline"></ion-icon>
                        Servicios activos
                    </span>
                </div>
            </div>

            <div className={`${estilos.kpiCard} ${estilos.kpiInfo} ${estilos[tema]}`}>
                <div className={estilos.kpiIcono}>
                    <ion-icon name="cash-outline"></ion-icon>
                </div>
                <div className={estilos.kpiInfo}>
                    <span className={estilos.kpiLabel}>Presupuesto Comprometido</span>
                    <span className={estilos.kpiValor}>
                        {new Intl.NumberFormat('es-DO', {
                            style: 'currency',
                            currency: 'DOP',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(estadisticas.presupuesto_comprometido)}
                    </span>
                    <span className={estilos.kpiDescripcion}>
                        <ion-icon name="wallet-outline"></ion-icon>
                        En servicios activos
                    </span>
                </div>
            </div>
        </div>
    )
}

