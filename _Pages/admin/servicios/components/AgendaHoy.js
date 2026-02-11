"use client"
import { useRouter } from 'next/navigation'
import { formatearEstadoServicio } from '../../core/construction/estados'
import estilos from '../servicios.module.css'

export default function AgendaHoy({ tema, serviciosHoy, getIconoTipoServicio }) {
    const router = useRouter()

    if (!serviciosHoy || serviciosHoy.length === 0) {
        return null
    }

    return (
        <div className={`${estilos.agendaSeccion} ${estilos[tema]}`}>
            <div className={`${estilos.seccionHeader} ${estilos[tema]}`}>
                <div className={estilos.seccionTitulo}>
                    <ion-icon name="today-outline"></ion-icon>
                    <h2>Agenda de Hoy</h2>
                </div>
                <span className={estilos.badge}>{serviciosHoy.length}</span>
            </div>
            <div className={`${estilos.agendaLista} ${estilos[tema]}`}>
                {serviciosHoy.map(servicio => {
                    const estadoFormateado = formatearEstadoServicio(servicio.estado)
                    return (
                        <div
                            key={servicio.id}
                            className={`${estilos.agendaCard} ${estilos[tema]}`}
                            onClick={() => router.push(`/admin/servicios/ver/${servicio.id}`)}
                        >
                            <div className={estilos.agendaEmoji}>{getIconoTipoServicio(servicio.tipo_servicio)}</div>
                            <div className={estilos.agendaInfo}>
                                <div className={estilos.agendaNombre}>{servicio.nombre}</div>
                                <div className={estilos.agendaMeta}>
                                    {servicio.ubicacion}
                                    {servicio.cliente_nombre && ` • ${servicio.cliente_nombre}`}
                                </div>
                            </div>
                            <div className={`${estilos.agendaEstado} ${estilos[estadoFormateado.color]}`}>
                                {estadoFormateado.texto}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

