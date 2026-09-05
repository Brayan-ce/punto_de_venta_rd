"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { listarAnuncios, eliminarAnuncio } from "./servidor"
import estilos from "./anuncios.module.css"

const TIPOS_LABEL = { info: "Info", warning: "Advertencia", pago: "Pago", alerta: "Alerta" }
const TIPOS_ICONO = {
    info: "information-circle-outline",
    warning: "warning-outline",
    pago: "cash-outline",
    alerta: "alert-circle-outline"
}

export default function Anuncios() {
    const router = useRouter()
    const [tema, setTema] = useState("light")
    const [anuncios, setAnuncios] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const aplicarTema = (t) => {
            setTema(t)
            document.body.style.backgroundColor = t === "dark" ? "#0f172a" : "#f1f5f9"
        }
        const t = localStorage.getItem("tema") || "light"
        aplicarTema(t)
        const onChange = () => aplicarTema(localStorage.getItem("tema") || "light")
        window.addEventListener("temaChange", onChange)
        window.addEventListener("storage", onChange)
        return () => {
            window.removeEventListener("temaChange", onChange)
            window.removeEventListener("storage", onChange)
            document.body.style.backgroundColor = ""
        }
    }, [])

    const cargar = useCallback(async () => {
        setCargando(true)
        const res = await listarAnuncios()
        if (res.success) setAnuncios(res.anuncios)
        setCargando(false)
    }, [])

    useEffect(() => { cargar() }, [cargar])

    const eliminar = async (id) => {
        if (!confirm("¿Eliminar este anuncio?")) return
        await eliminarAnuncio(id)
        await cargar()
    }

    const badgeClass = (tipo) => {
        const map = { info: estilos.badge_info, warning: estilos.badge_warning, pago: estilos.badge_pago, alerta: estilos.badge_alerta }
        return `${estilos.badge} ${map[tipo] || estilos.badge_info}`
    }

    if (cargando) return (
        <div className={`${estilos.pagina} ${estilos[tema]}`}>
            <div className={estilos.contenedor}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline"></ion-icon>
                    <span>Cargando anuncios...</span>
                </div>
            </div>
        </div>
    )

    return (
        <div className={`${estilos.pagina} ${estilos[tema]}`}>
            <div className={estilos.contenedor}>

                <div className={estilos.header}>
                    <div className={estilos.headerTexto}>
                        <div className={estilos.headerIcono}>
                            <ion-icon name="megaphone-outline"></ion-icon>
                        </div>
                        <div>
                            <h1 className={estilos.titulo}>Anuncios</h1>
                            <p className={estilos.subtitulo}>Mensajes y notificaciones para los usuarios del sistema</p>
                        </div>
                    </div>
                    <button className={estilos.btnNuevo} onClick={() => router.push("/superadmin/anuncios/nuevo")}>
                        <ion-icon name="add-outline"></ion-icon>
                        Nuevo anuncio
                    </button>
                </div>

                {anuncios.length > 0 && (
                    <div className={estilos.stats}>
                        <div className={`${estilos.statCard} ${estilos[tema]}`}>
                            <div className={`${estilos.statIcono} ${estilos.statIconoTotal}`}>
                                <ion-icon name="megaphone-outline"></ion-icon>
                            </div>
                            <div>
                                <span className={estilos.statNum}>{anuncios.length}</span>
                                <span className={estilos.statLabel}>Total anuncios</span>
                            </div>
                        </div>
                        <div className={`${estilos.statCard} ${estilos[tema]}`}>
                            <div className={`${estilos.statIcono} ${estilos.statIconoRecurrente}`}>
                                <ion-icon name="repeat-outline"></ion-icon>
                            </div>
                            <div>
                                <span className={estilos.statNum}>{anuncios.filter(a => a.is_template).length}</span>
                                <span className={estilos.statLabel}>Recurrentes</span>
                            </div>
                        </div>
                        <div className={`${estilos.statCard} ${estilos[tema]}`}>
                            <div className={`${estilos.statIcono} ${estilos.statIconoLecturas}`}>
                                <ion-icon name="eye-outline"></ion-icon>
                            </div>
                            <div>
                                <span className={estilos.statNum}>{anuncios.reduce((s, a) => s + (a.total_leidos || 0), 0)}</span>
                                <span className={estilos.statLabel}>Lecturas totales</span>
                            </div>
                        </div>
                    </div>
                )}

                {anuncios.length === 0 ? (
                    <div className={`${estilos.vacio} ${estilos[tema]}`}>
                        <div className={estilos.vacioIcono}>
                            <ion-icon name="megaphone-outline"></ion-icon>
                        </div>
                        <p className={estilos.vacioTitulo}>Sin anuncios aún</p>
                        <p className={estilos.vacioSub}>Crea el primer anuncio para notificar a tus usuarios</p>
                        <button className={estilos.btnNuevo} onClick={() => router.push("/superadmin/anuncios/nuevo")}>
                            <ion-icon name="add-outline"></ion-icon>
                            Crear primer anuncio
                        </button>
                    </div>
                ) : (
                    <div className={estilos.lista}>
                        {anuncios.map(a => (
                            <div key={a.id} className={`${estilos.item} ${estilos[tema]}`}>
                                <div className={`${estilos.itemIcono} ${estilos[`icono_${a.type}`]}`}>
                                    <ion-icon name={TIPOS_ICONO[a.type] || "notifications-outline"}></ion-icon>
                                </div>

                                <div className={estilos.itemInfo}>
                                    <div className={estilos.itemFila1}>
                                        <span className={estilos.itemTitulo}>{a.title}</span>
                                        <div className={estilos.itemTags}>
                                            <span className={badgeClass(a.type)}>{TIPOS_LABEL[a.type] || a.type}</span>
                                            {a.is_mandatory && (
                                                <span className={estilos.tagObligatorio}>
                                                    <ion-icon name="lock-closed-outline"></ion-icon>
                                                    Obligatorio
                                                </span>
                                            )}
                                            {a.recurrence && (
                                                <span className={estilos.tagRecurrente}>
                                                    <ion-icon name="repeat-outline"></ion-icon>
                                                    Mensual
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <p className={estilos.itemMensaje}>
                                        {a.message?.slice(0, 120)}{a.message?.length > 120 ? "..." : ""}
                                    </p>

                                    <div className={estilos.itemMeta}>
                                        {a.scheduled_at && (
                                            <span>
                                                <ion-icon name="calendar-outline"></ion-icon>
                                                {new Date(a.scheduled_at).toLocaleDateString("es-DO")}
                                            </span>
                                        )}
                                        {a.expires_at && (
                                            <span>
                                                <ion-icon name="time-outline"></ion-icon>
                                                Vence {new Date(a.expires_at).toLocaleDateString("es-DO")}
                                            </span>
                                        )}
                                        {a.parent_recurrence === 'monthly' && (
                                            <span className={estilos.tagRecurrente}>
                                                <ion-icon name="repeat-outline"></ion-icon>
                                                Mensual (día {a.parent_day_of_month})
                                            </span>
                                        )}
                                        <span>
                                            <ion-icon name="eye-outline"></ion-icon>
                                            {a.total_leidos || 0} {a.total_leidos === 1 ? "lectura" : "lecturas"}
                                        </span>
                                        <span>
                                            <ion-icon name={a.target_type === "all" ? "globe-outline" : "people-outline"}></ion-icon>
                                            {a.target_type === "all" ? "Todos" : "Específico"}
                                        </span>
                                    </div>
                                </div>

                                <div className={estilos.itemAcciones}>
                                    <button className={estilos.btnVer} onClick={() => router.push(`/superadmin/anuncios/ver/${a.id}`)} title="Ver detalles">
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </button>
                                    <button className={estilos.btnEditar} onClick={() => router.push(`/superadmin/anuncios/editar/${a.id}`)} title="Editar">
                                        <ion-icon name="pencil-outline"></ion-icon>
                                    </button>
                                    <button className={estilos.btnEliminar} onClick={() => eliminar(a.id)} title="Eliminar">
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}