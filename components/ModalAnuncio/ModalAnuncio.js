"use client"

import { useEffect, useState } from "react"
import { obtenerAnuncioPendiente, marcarAnuncioLeido } from "@/_Pages/superadmin/anuncios/servidor"
import estilos from "./ModalAnuncio.module.css"

const ICONOS = {
    info:    "information-circle-outline",
    warning: "warning-outline",
    pago:    "cash-outline",
    alerta:  "alert-circle-outline"
}

const COLORES = {
    info:    estilos.tipoInfo,
    warning: estilos.tipoWarning,
    pago:    estilos.tipoPago,
    alerta:  estilos.tipoAlerta
}

export default function ModalAnuncio() {
    const [anuncio, setAnuncio] = useState(null)
    const [aceptando, setAceptando] = useState(false)
    const [tema, setTema] = useState("light")

    useEffect(() => {
        setTema(localStorage.getItem("tema") || "light")
        const h = () => setTema(localStorage.getItem("tema") || "light")
        window.addEventListener("temaChange", h)
        window.addEventListener("storage", h)
        return () => {
            window.removeEventListener("temaChange", h)
            window.removeEventListener("storage", h)
        }
    }, [])

    useEffect(() => {
        const consultar = async () => {
            try {
                const res = await obtenerAnuncioPendiente()
                if (res?.anuncio) setAnuncio(res.anuncio)
            } catch (e) {
                console.error("ModalAnuncio:", e)
            }
        }
        consultar()
    }, [])

    const aceptar = async () => {
        if (!anuncio) return
        setAceptando(true)
        await marcarAnuncioLeido(anuncio.id)
        setAnuncio(null)
        setAceptando(false)
    }

    if (!anuncio) return null

    const tipo = anuncio.type || "info"

    return (
        <div className={`${estilos.overlay} ${estilos[tema]}`}>
            <div className={estilos.modal}>
                <div className={`${estilos.icono} ${COLORES[tipo] || estilos.tipoInfo}`}>
                    <ion-icon name={ICONOS[tipo] || ICONOS.info}></ion-icon>
                </div>

                <h2 className={estilos.titulo}>{anuncio.title}</h2>
                <p className={estilos.mensaje}>{anuncio.message}</p>

                <button
                    className={estilos.btnAceptar}
                    onClick={aceptar}
                    disabled={aceptando}
                >
                    {aceptando ? "..." : "Aceptar"}
                </button>
            </div>
        </div>
    )
}
