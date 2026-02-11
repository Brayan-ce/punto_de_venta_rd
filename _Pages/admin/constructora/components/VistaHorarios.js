"use client"
import Link from 'next/link'
import estilos from '../constructora.module.css'

export default function VistaHorarios({ dashboard, tema }) {
    return (
        <div className={`${estilos.seccionHorarios} ${estilos[tema]}`}>
            <div className={estilos.horariosHeader}>
                <div>
                    <h2>
                        <ion-icon name="time-outline"></ion-icon>
                        Horarios y Asignaciones
                    </h2>
                    <p>Programación semanal del personal</p>
                </div>
                <div className={estilos.ilustracionHorarios}>
                    <img
                        src="/lustracion_reparaciones/Spirit Level_3D.svg"
                        alt="Horarios"
                        width={80}
                        height={80}
                        className={estilos.ilustracion3D}
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>

            {!dashboard.personal_campo || dashboard.personal_campo.length === 0 ? (
                <div className={estilos.horariosVacio}>
                    <img
                        src="/illustrations3D/_0011.svg"
                        alt="Sin horarios"
                        width={250}
                        height={250}
                        className={estilos.ilustracionVacio}
                        loading="lazy"
                        decoding="async"
                    />
                    <h3>No hay personal asignado</h3>
                    <p>Asigna personal a obras o servicios para visualizar horarios</p>
                    <Link href="/admin/personal/asignar" className={estilos.btnNuevoVacio}>
                        <ion-icon name="add-outline"></ion-icon>
                        <span>Asignar Personal</span>
                    </Link>
                </div>
            ) : (
                <div className={estilos.gridHorarios}>
                    {dashboard.personal_campo.map(persona => (
                        <div key={persona.id} className={estilos.cardHorario}>
                            <div className={estilos.horarioHeader}>
                                <div className={estilos.avatarHorario}>
                                    {persona.nombre?.charAt(0)}{persona.apellidos?.charAt(0)}
                                </div>
                                <div className={estilos.horarioInfo}>
                                    <h4>{persona.nombre} {persona.apellidos}</h4>
                                    <p>{persona.rol}</p>
                                </div>
                            </div>
                            <div className={estilos.horarioBody}>
                                <div className={estilos.horarioItem}>
                                    <ion-icon name="business-outline"></ion-icon>
                                    <div>
                                        <span>Asignado a:</span>
                                        <strong>{persona.obra_nombre || persona.servicio_nombre}</strong>
                                    </div>
                                </div>
                                <div className={estilos.horarioItem}>
                                    <ion-icon name="time-outline"></ion-icon>
                                    <div>
                                        <span>Horario:</span>
                                        <strong>8:00 AM - 5:00 PM</strong>
                                    </div>
                                </div>
                                <div className={estilos.horarioItem}>
                                    <ion-icon name="calendar-outline"></ion-icon>
                                    <div>
                                        <span>Fecha:</span>
                                        <strong>Hoy</strong>
                                    </div>
                                </div>
                            </div>
                            <div className={estilos.horarioEstado}>
                                <div className={estilos.estadoActivo}>
                                    <div className={estilos.pulsoActivo}></div>
                                    <span>Activo</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

