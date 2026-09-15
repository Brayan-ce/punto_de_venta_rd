"use client"
import { useRouter } from 'next/navigation'
import { formatearEstadoServicio, formatearPrioridad } from '../../core/construction/estados'
import estilos from '../servicios.module.css'

export default function ListadoServicios({ tema, serviciosFiltrados, vista, cargando, filtros, getIconoTipoServicio }) {
    const router = useRouter()

    if (cargando) {
        return (
            <div className={`${estilos.cargando} ${estilos[tema]}`}>
                <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                <h3>Cargando servicios...</h3>
            </div>
        )
    }

    if (serviciosFiltrados.length === 0) {
        return (
            <div className={`${estilos.vacio} ${estilos[tema]}`}>
                <div className={estilos.vacioIcono}>
                    <ion-icon name="construct-outline"></ion-icon>
                </div>
                <h3>No se encontraron servicios</h3>
                <p>
                    {filtros.busqueda || filtros.estado !== 'todos' || filtros.tipo_servicio || filtros.prioridad
                        ? 'No hay servicios que coincidan con los filtros seleccionados'
                        : 'No hay servicios registrados. Crea tu primer servicio para comenzar.'}
                </p>
                {!filtros.busqueda && filtros.estado === 'todos' && !filtros.tipo_servicio && (
                    <button className={estilos.btnPrimario} onClick={() => router.push('/admin/servicios/nuevo')}>
                        <ion-icon name="add-outline"></ion-icon>
                        <span>Crear Primer Servicio</span>
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className={`${vista === 'grid' ? estilos.serviciosGrid : estilos.serviciosLista} ${estilos[tema]}`}>
            {serviciosFiltrados.map(servicio => {
                const estadoFormateado = formatearEstadoServicio(servicio.estado)
                const prioridadFormateada = formatearPrioridad(servicio.prioridad)

                return (
                    <div key={servicio.id} className={`${estilos.servicioCard} ${estilos[tema]}`}>
                        {/* Header */}
                        <div className={`${estilos.cardHeader} ${estilos[tema]}`}>
                            <div className={estilos.cardIcono}>
                                {getIconoTipoServicio(servicio.tipo_servicio)}
                            </div>
                            <div className={estilos.cardTituloArea}>
                                {servicio.codigo_servicio && (
                                    <span className={estilos.cardCodigo}>{servicio.codigo_servicio}</span>
                                )}
                                <h3 className={estilos.cardTitulo}>{servicio.nombre}</h3>
                            </div>
                            <div className={`${estilos.cardEstado} ${estilos[estadoFormateado.color]}`}>
                                {estadoFormateado.texto}
                            </div>
                        </div>

                        {/* Body */}
                        <div className={`${estilos.cardBody} ${estilos[tema]}`}>
                            <div className={estilos.cardContexto}>
                                {servicio.ubicacion && (
                                    <div className={estilos.cardDato}>
                                        <ion-icon name="location-outline"></ion-icon>
                                        <span>{servicio.ubicacion}</span>
                                    </div>
                                )}
                                {servicio.obra_nombre && (
                                    <div className={estilos.cardDato}>
                                        <ion-icon name="business-outline"></ion-icon>
                                        <span>{servicio.obra_nombre}</span>
                                    </div>
                                )}
                                {servicio.cliente_nombre && (
                                    <div className={estilos.cardDato}>
                                        <ion-icon name="person-outline"></ion-icon>
                                        <span>{servicio.cliente_nombre}</span>
                                    </div>
                                )}
                            </div>

                            <div className={estilos.cardMeta}>
                                <div className={`${estilos.cardPrioridad} ${estilos[`prioridad_${prioridadFormateada.color || 'baja'}`] || estilos.prioridad_baja}`}>
                                    <ion-icon name="flag"></ion-icon>
                                    {prioridadFormateada.texto}
                                </div>
                                {servicio.fecha_programada && (
                                    <div className={estilos.cardFecha}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        {new Date(servicio.fecha_programada).toLocaleDateString('es-DO', {
                                            day: 'numeric',
                                            month: 'short'
                                        })}
                                    </div>
                                )}
                            </div>

                            {(servicio.presupuesto_asignado > 0 || servicio.costo_estimado > 0) && (
                                <div className={`${estilos.cardPresupuesto} ${estilos[tema]}`}>
                                    <ion-icon name="cash-outline"></ion-icon>
                                    <span>
                                        {new Intl.NumberFormat('es-DO', {
                                            style: 'currency',
                                            currency: 'DOP',
                                            minimumFractionDigits: 0
                                        }).format(servicio.presupuesto_asignado || servicio.costo_estimado)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className={`${estilos.cardFooter} ${estilos[tema]}`}>
                            <button
                                className={estilos.btnVerCard}
                                onClick={() => router.push(`/admin/servicios/ver/${servicio.id}`)}
                            >
                                Ver Detalle
                                <ion-icon name="arrow-forward"></ion-icon>
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

