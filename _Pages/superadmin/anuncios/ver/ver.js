"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { obtenerAnuncioPorId, obtenerLectoresAnuncio } from "../servidor"
import estilos from "./ver.module.css"

const TIPOS_LABEL = { info: "Info", warning: "Advertencia", pago: "Pago", alerta: "Alerta" }
const ICONOS_TIPO = {
    info: "information-circle-outline",
    warning: "warning-outline",
    pago: "cash-outline",
    alerta: "alert-circle-outline"
}

export default function VerAnuncio() {
    const router = useRouter()
    const params = useParams()
    const id = params?.id

    const [tema, setTema] = useState("light")
    const [anuncio, setAnuncio] = useState(null)
    const [targets, setTargets] = useState([])
    const [lectores, setLectores] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const aplicar = (t) => {
            setTema(t)
            document.body.style.backgroundColor = t === "dark" ? "#0f172a" : "#f1f5f9"
        }
        aplicar(localStorage.getItem("tema") || "light")
        const h = () => aplicar(localStorage.getItem("tema") || "light")
        window.addEventListener("temaChange", h)
        window.addEventListener("storage", h)
        return () => {
            window.removeEventListener("temaChange", h)
            window.removeEventListener("storage", h)
            document.body.style.backgroundColor = ""
        }
    }, [])

    useEffect(() => {
        const cargar = async () => {
            const [resA, resL] = await Promise.all([
                obtenerAnuncioPorId(id),
                obtenerLectoresAnuncio(id)
            ])
            if (resA.success) { setAnuncio(resA.anuncio); setTargets(resA.targets || []) }
            else router.push("/superadmin/anuncios")
            if (resL.success) setLectores(resL.lectores)
            setCargando(false)
        }
        if (id) cargar()
    }, [id, router])

    if (cargando || !anuncio) {
        return (
            <div className={`${estilos.pagina} ${estilos[tema]}`}>
                <div className={estilos.contenedor}>
                    <div className={estilos.cargando}>
                        <ion-icon name="hourglass-outline"></ion-icon>
                        <span>Cargando...</span>
                    </div>
                </div>
            </div>
        )
    }

    const tipo = anuncio.type || "info"

    return (
        <div className={`${estilos.pagina} ${estilos[tema]}`}>
            <div className={estilos.contenedor}>

                <div className={estilos.header}>
                    <div className={estilos.headerFila}>
                        <div className={estilos.headerTexto}>
                            <div className={`${estilos.headerIcono} ${estilos["headerIcono_" + tipo]}`}>
                                <ion-icon name={ICONOS_TIPO[tipo]}></ion-icon>
                            </div>
                            <div>
                                <h1 className={estilos.titulo}>{anuncio.title}</h1>
                                <p className={estilos.subtitulo}>
                                    Creado el {new Date(anuncio.created_at).toLocaleDateString("es-DO")}
                                </p>
                            </div>
                        </div>
                        <div className={estilos.headerAcciones}>
                            <button className={estilos.btnVolver} onClick={() => router.push("/superadmin/anuncios")}>
                                <ion-icon name="arrow-back-outline"></ion-icon>
                                <span>Volver</span>
                            </button>
                            <button className={estilos.btnEditar} onClick={() => router.push(`/superadmin/anuncios/editar/${id}`)}>
                                <ion-icon name="pencil-outline"></ion-icon>
                                Editar
                            </button>
                        </div>
                    </div>
                </div>

                <div className={estilos.layoutPrincipal}>

                    <div className={estilos.columnaIzq}>
                        <div className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                <div className={estilos.cardHeaderTexto}>
                                    <div className={`${estilos.cardIcono} ${estilos.cardIconoInfo}`}>
                                        <ion-icon name="document-text-outline"></ion-icon>
                                    </div>
                                    <h2 className={estilos.cardTitulo}>Detalle del anuncio</h2>
                                </div>
                            </div>
                            <div className={estilos.cardContenido}>
                                <div className={estilos.mensajeBox}>
                                    <p className={estilos.mensajeTexto}>{anuncio.message}</p>
                                </div>

                                <div className={estilos.metaGrid}>
                                    <div className={estilos.metaItem}>
                                        <span className={estilos.metaLabel}>Tipo</span>
                                        <span className={`${estilos.badge} ${estilos["badge_" + tipo]}`}>
                                            <ion-icon name={ICONOS_TIPO[tipo]}></ion-icon>
                                            {TIPOS_LABEL[tipo]}
                                        </span>
                                    </div>
                                    <div className={estilos.metaItem}>
                                        <span className={estilos.metaLabel}>Obligatorio</span>
                                        <span className={anuncio.is_mandatory ? estilos.siTag : estilos.noTag}>
                                            <ion-icon name={anuncio.is_mandatory ? "lock-closed-outline" : "lock-open-outline"}></ion-icon>
                                            {anuncio.is_mandatory ? "Si" : "No"}
                                        </span>
                                    </div>
                                    <div className={estilos.metaItem}>
                                        <span className={estilos.metaLabel}>Destino</span>
                                        <span className={estilos.metaValor}>
                                            <ion-icon name={anuncio.target_type === "all" ? "people-outline" : "person-outline"}></ion-icon>
                                            {anuncio.target_type === "all" ? "Todos los usuarios" : "Especifico"}
                                        </span>
                                    </div>
                                    <div className={estilos.metaItem}>
                                        <span className={estilos.metaLabel}>Programado para</span>
                                        <span className={estilos.metaValor}>
                                            <ion-icon name="calendar-outline"></ion-icon>
                                            {anuncio.scheduled_at ? new Date(anuncio.scheduled_at).toLocaleString("es-DO") : "Inmediato"}
                                        </span>
                                    </div>
                                    <div className={estilos.metaItem}>
                                        <span className={estilos.metaLabel}>Expira</span>
                                        <span className={estilos.metaValor}>
                                            <ion-icon name="time-outline"></ion-icon>
                                            {anuncio.expires_at ? new Date(anuncio.expires_at).toLocaleString("es-DO") : "Sin vencimiento"}
                                        </span>
                                    </div>
                                    <div className={estilos.metaItem}>
                                        <span className={estilos.metaLabel}>Recurrencia</span>
                                        <span className={estilos.metaValor}>
                                            <ion-icon name="repeat-outline"></ion-icon>
                                            {anuncio.recurrence === "monthly" ? `Mensual (dia ${anuncio.day_of_month})` : "Sin recurrencia"}
                                        </span>
                                    </div>
                                </div>

                                {anuncio.target_type === "specific" && targets.length > 0 && (
                                    <div className={estilos.targets}>
                                        <p className={estilos.targetsLabel}>Enviado a</p>
                                        <div className={estilos.tagsList}>
                                            {targets.map((t, i) => (
                                                <span key={i} className={estilos.tag}>
                                                    <ion-icon name={t.empresa_id ? "business-outline" : "person-outline"}></ion-icon>
                                                    {t.nombre_empresa || t.nombre_usuario}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={estilos.columnaDer}>
                        <div className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                <div className={estilos.cardHeaderTexto}>
                                    <div className={`${estilos.cardIcono} ${estilos.cardIconoLecturas}`}>
                                        <ion-icon name="checkmark-done-outline"></ion-icon>
                                    </div>
                                    <h2 className={estilos.cardTitulo}>Lecturas ({lectores.length})</h2>
                                </div>
                            </div>
                            <div className={estilos.cardContenido}>
                                {lectores.length === 0 ? (
                                    <div className={estilos.vacio}>
                                        <div className={estilos.vacioIcono}>
                                            <ion-icon name="eye-off-outline"></ion-icon>
                                        </div>
                                        <span>Nadie ha aceptado este anuncio aun</span>
                                    </div>
                                ) : (
                                    <div className={estilos.lista}>
                                        {lectores.map((l, i) => (
                                            <div key={i} className={`${estilos.listaItem} ${estilos[tema]}`}>
                                                <div className={estilos.listaItemIcono}>
                                                    <ion-icon name="person-outline"></ion-icon>
                                                </div>
                                                <div className={estilos.listaItemInfo}>
                                                    <span className={estilos.listaItemNombre}>{l.nombre}</span>
                                                    <span className={estilos.listaItemDetalle}>{l.email} · {l.nombre_empresa || "Sin empresa"}</span>
                                                </div>
                                                <span className={estilos.fechaLeido}>
                                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                                    {new Date(l.read_at).toLocaleDateString("es-DO")}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}