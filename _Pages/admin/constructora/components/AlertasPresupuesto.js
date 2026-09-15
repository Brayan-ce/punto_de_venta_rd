"use client"
import Link from 'next/link'
import { obtenerSeveridadAlerta } from '../../core/construction/reglas'
import estilos from '../constructora.module.css'

export default function AlertasPresupuesto({ dashboard, tema }) {
    if (!dashboard.alertas_presupuesto || dashboard.alertas_presupuesto.length === 0) {
        return null
    }

    return (
        <div className={`${estilos.seccionAlertas} ${estilos[tema]}`}>
            <div className={estilos.alertasHeader}>
                <ion-icon name="alert-circle-outline"></ion-icon>
                <h2>Alertas de Presupuesto</h2>
                <span className={estilos.badgeCount}>{dashboard.alertas_presupuesto.length}</span>
            </div>
            <div className={estilos.listaAlertas}>
                {dashboard.alertas_presupuesto.slice(0, 3).map(alerta => {
                    const severidad = obtenerSeveridadAlerta(alerta.porcentaje_ejecutado)
                    return (
                        <div key={alerta.id} className={`${estilos.alertaCard} ${estilos[`severidad_${severidad}`]}`}>
                            <div className={estilos.alertaIcono}>
                                <ion-icon name={severidad === 'critico' ? 'alert-circle' : 'warning'}></ion-icon>
                            </div>
                            <div className={estilos.alertaInfo}>
                                <h4>{alerta.obra_nombre || 'Obra'}</h4>
                                <p>
                                    {alerta.tipo_alerta === 'umbral_70' ? 'Ha alcanzado el 70% del presupuesto' :
                                     alerta.tipo_alerta === 'umbral_90' ? 'Ha alcanzado el 90% del presupuesto' :
                                     alerta.tipo_alerta === 'excedido' ? 'Ha excedido el presupuesto' :
                                     'Proyección de sobrecosto'}
                                </p>
                                <span className={estilos.porcentajeAlerta}>{alerta.porcentaje_ejecutado?.toFixed(1)}% ejecutado</span>
                            </div>
                            <Link 
                                href={`/admin/presupuesto?obra=${alerta.destino_id}`}
                                className={estilos.btnAlerta}
                            >
                                <ion-icon name="eye-outline"></ion-icon>
                            </Link>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

