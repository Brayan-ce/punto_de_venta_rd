"use client"
import estilos from '../constructora.module.css'

export default function EstadisticasCards({ dashboard, tema, formatearMoneda }) {
    return (
        <div className={estilos.estadisticas}>
            <div className={`${estilos.estadCard} ${estilos.primary}`}>
                <div className={estilos.estadIconoWrapper}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="business-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadInfo}>
                    <span className={estilos.estadLabel}>Obras Activas</span>
                    <span className={estilos.estadValor}>{dashboard.estadisticas.obras_activas || 0}</span>
                    <span className={estilos.estadTendencia}>
                        <ion-icon name="trending-up-outline"></ion-icon>
                        En construcción
                    </span>
                </div>
            </div>

            <div className={`${estilos.estadCard} ${estilos.success}`}>
                <div className={estilos.estadIconoWrapper}>
                    <div className={`${estilos.estadIcono} ${estilos.success}`}>
                        <ion-icon name="people-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadInfo}>
                    <span className={estilos.estadLabel}>Personal en Campo</span>
                    <span className={estilos.estadValor}>{dashboard.estadisticas.personal_campo || 0}</span>
                    <span className={estilos.estadTendencia}>
                        <ion-icon name="pulse-outline"></ion-icon>
                        Trabajando hoy
                    </span>
                </div>
            </div>

            <div className={`${estilos.estadCard} ${estilos.info}`}>
                <div className={estilos.estadIconoWrapper}>
                    <div className={`${estilos.estadIcono} ${estilos.info}`}>
                        <ion-icon name="flash-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadInfo}>
                    <span className={estilos.estadLabel}>Servicios Pendientes</span>
                    <span className={estilos.estadValor}>{dashboard.estadisticas.servicios_pendientes || 0}</span>
                    <span className={estilos.estadTendencia}>
                        <ion-icon name="time-outline"></ion-icon>
                        Programados
                    </span>
                </div>
            </div>

            <div className={`${estilos.estadCard} ${estilos.warning}`}>
                <div className={estilos.estadIconoWrapper}>
                    <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadInfo}>
                    <span className={estilos.estadLabel}>Presupuesto Total</span>
                    <span className={estilos.estadValor}>
                        {formatearMoneda(
                            dashboard.obras_activas?.reduce((sum, obra) => 
                                sum + parseFloat(obra.presupuesto_aprobado || 0), 0
                            ) || 0
                        )}
                    </span>
                    <span className={estilos.estadTendencia}>
                        <ion-icon name="wallet-outline"></ion-icon>
                        Obras activas
                    </span>
                </div>
            </div>

            <div className={`${estilos.estadCard} ${dashboard.estadisticas.alertas_activas > 0 ? estilos.danger : estilos.secondary}`}>
                <div className={estilos.estadIconoWrapper}>
                    <div className={`${estilos.estadIcono} ${dashboard.estadisticas.alertas_activas > 0 ? estilos.danger : estilos.secondary}`}>
                        <ion-icon name="warning-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadInfo}>
                    <span className={estilos.estadLabel}>Alertas Activas</span>
                    <span className={estilos.estadValor}>{dashboard.estadisticas.alertas_activas || 0}</span>
                    <span className={estilos.estadTendencia}>
                        <ion-icon name={dashboard.estadisticas.alertas_activas > 0 ? "alert-circle-outline" : "checkmark-circle-outline"}></ion-icon>
                        {dashboard.estadisticas.alertas_activas > 0 ? 'Requieren atención' : 'Todo OK'}
                    </span>
                </div>
            </div>
        </div>
    )
}

