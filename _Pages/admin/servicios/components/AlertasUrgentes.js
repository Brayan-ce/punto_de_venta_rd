"use client"
import { useRouter } from 'next/navigation'
import { formatearEstadoServicio } from '../../core/construction/estados'
import estilos from '../servicios.module.css'

export default function AlertasUrgentes({ tema, serviciosAlerta, getTipoAlerta }) {
    const router = useRouter()

    if (!serviciosAlerta || serviciosAlerta.length === 0) {
        return null
    }

    return (
        <div className={`${estilos.alertasSeccion} ${estilos[tema]}`}>
            <div className={`${estilos.seccionHeader} ${estilos[tema]}`}>
                <div className={estilos.seccionTitulo}>
                    <ion-icon name="warning-outline"></ion-icon>
                    <h2>Atención Inmediata</h2>
                </div>
                <span className={estilos.badge}>{serviciosAlerta.length}</span>
            </div>
            <div className={`${estilos.alertasLista} ${estilos[tema]}`}>
                {serviciosAlerta.map(servicio => {
                    const alerta = getTipoAlerta(servicio)
                    const estadoFormateado = formatearEstadoServicio(servicio.estado)
                    return (
                        <div
                            key={servicio.id}
                            className={`${estilos.alertaCard} ${estilos[`alerta_${alerta.color}`]} ${estilos[tema]}`}
                            onClick={() => router.push(`/admin/servicios/ver/${servicio.id}`)}
                        >
                            <div className={estilos.alertaIcono}>
                                <ion-icon name={alerta.icono}></ion-icon>
                            </div>
                            <div className={estilos.alertaInfo}>
                                <div className={estilos.alertaTipo}>{alerta.tipo}</div>
                                <div className={estilos.alertaNombre}>
                                    {servicio.codigo_servicio && (
                                        <span className={estilos.alertaCodigo}>{servicio.codigo_servicio}</span>
                                    )}
                                    {servicio.nombre}
                                </div>
                                <div className={estilos.alertaMeta}>
                                    {servicio.ubicacion && (
                                        <span>
                                            <ion-icon name="location-outline"></ion-icon>
                                            {servicio.ubicacion}
                                        </span>
                                    )}
                                    {servicio.obra_nombre && (
                                        <span>
                                            <ion-icon name="business-outline"></ion-icon>
                                            {servicio.obra_nombre}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`${estilos.alertaEstado} ${estilos[estadoFormateado.color]}`}>
                                {estadoFormateado.texto}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

