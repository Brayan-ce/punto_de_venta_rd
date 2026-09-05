"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { crearAnuncio, obtenerEmpresasYUsuarios } from "../servidor"
import estilos from "../formAnuncio.module.css"

const TIPOS = ["info", "warning", "pago", "alerta"]
const TIPOS_LABEL = { info: "Info", warning: "Advertencia", pago: "Pago", alerta: "Alerta" }
const ICONOS_TIPO = {
    info: "information-circle-outline",
    warning: "warning-outline",
    pago: "cash-outline",
    alerta: "alert-circle-outline"
}
const localDatetime = (d = new Date()) => {
    const p = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const FORM_VACIO = {
    title: "", message: "", type: "info",
    target_type: "all", is_mandatory: true,
    scheduled_at: "", expires_at: "",
    recurrence: "", day_of_month: "",
    targets: []
}

export default function NuevoAnuncio() {
    const router = useRouter()
    const [tema, setTema] = useState("light")
    const [form, setForm] = useState(() => ({ ...FORM_VACIO, scheduled_at: localDatetime() }))
    const [empresas, setEmpresas] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [empresaFiltro, setEmpresaFiltro] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState("")

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
        obtenerEmpresasYUsuarios().then(r => {
            if (r.success) { setEmpresas(r.empresas); setUsuarios(r.usuarios) }
        })
    }, [])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }))
    }

    const seleccionarEmpresa = (id) => {
        setEmpresaFiltro(id)
        setForm(f => ({ ...f, targets: [] }))
    }

    const toggleUsuario = (id) => {
        setForm(f => {
            const existe = f.targets.some(t => t.user_id === id)
            if (existe) return { ...f, targets: f.targets.filter(t => t.user_id !== id) }
            const usuario = usuarios.find(u => u.id === id)
            return { ...f, targets: [...f.targets, { user_id: id, empresa_id: usuario?.empresa_id }] }
        })
    }

    const guardar = async (e) => {
        e.preventDefault(); setGuardando(true); setError("")
        try {
            const payload = {
                ...form,
                scheduled_at: form.scheduled_at || null,
                expires_at: form.expires_at || null
            }
            const res = await crearAnuncio(payload)
            if (res.success) router.push("/superadmin/anuncios")
            else setError(res.mensaje || "Error al guardar")
        } catch (err) {
            setError(err?.message || "Error inesperado al guardar")
        } finally {
            setGuardando(false)
        }
    }

    return (
        <div className={`${estilos.pagina} ${estilos[tema]}`}>
            <div className={estilos.contenedor}>

                <div className={estilos.header}>
                    <div className={estilos.headerFila}>
                        <div className={estilos.headerTexto}>
                            <div className={estilos.headerIcono}>
                                <ion-icon name="create-outline"></ion-icon>
                            </div>
                            <div>
                                <h1 className={estilos.titulo}>Nuevo anuncio</h1>
                                <p className={estilos.subtitulo}>Crea un mensaje para los usuarios del sistema</p>
                            </div>
                        </div>
                        <button className={estilos.btnVolver} onClick={() => router.push("/superadmin/anuncios")}>
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            <span>Volver</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={guardar}>
                    <div className={estilos.layoutPrincipal}>

                        <div className={estilos.columnaIzq}>
                            <div className={`${estilos.card} ${estilos[tema]}`}>
                                <div className={estilos.cardHeader}>
                                    <div className={estilos.cardHeaderTexto}>
                                        <div className={`${estilos.cardIcono} ${estilos.cardIconoInfo}`}>
                                            <ion-icon name="document-text-outline"></ion-icon>
                                        </div>
                                        <h2 className={estilos.cardTitulo}>Informacion del anuncio</h2>
                                    </div>
                                </div>
                                <div className={estilos.cardContenido}>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>Titulo *</label>
                                        <input className={estilos.input} name="title" value={form.title} onChange={handleChange} required placeholder="ej: Recordatorio de pago" />
                                    </div>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>Mensaje *</label>
                                        <textarea className={estilos.textarea} name="message" value={form.message} onChange={handleChange} required rows={4} placeholder="Texto que vera el usuario en el pop-up" />
                                    </div>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>Tipo</label>
                                        <div className={estilos.selectorTipo}>
                                            {TIPOS.map(t => (
                                                <button type="button" key={t}
                                                    className={`${estilos.btnTipo} ${form.type === t ? estilos.btnTipoActivo : ""} ${estilos["tipo_" + t]}`}
                                                    onClick={() => setForm(f => ({ ...f, type: t }))}>
                                                    <ion-icon name={ICONOS_TIPO[t]}></ion-icon>
                                                    {TIPOS_LABEL[t]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={estilos.campo}>
                                        <label className={estilos.label}>Destino</label>
                                        <div className={estilos.selectorDestino}>
                                            <button type="button"
                                                className={`${estilos.btnDestino} ${form.target_type === "all" ? estilos.btnDestinoActivo : ""}`}
                                                onClick={() => setForm(f => ({ ...f, target_type: "all" }))}>
                                                <ion-icon name="people-outline"></ion-icon>
                                                Todos
                                            </button>
                                            <button type="button"
                                                className={`${estilos.btnDestino} ${form.target_type === "specific" ? estilos.btnDestinoActivo : ""}`}
                                                onClick={() => setForm(f => ({ ...f, target_type: "specific" }))}>
                                                <ion-icon name="person-outline"></ion-icon>
                                                Especifico
                                            </button>
                                        </div>
                                    </div>
                                    <label className={estilos.checkLabel}>
                                        <div className={`${estilos.checkBox} ${form.is_mandatory ? estilos.checkBoxActivo : ""}`}>
                                            {form.is_mandatory && <ion-icon name="checkmark-outline"></ion-icon>}
                                        </div>
                                        <input type="checkbox" name="is_mandatory" checked={form.is_mandatory} onChange={handleChange} className={estilos.checkHidden} />
                                        <span>Obligatorio — el usuario debe aceptar para continuar</span>
                                    </label>
                                </div>
                            </div>

                            <div className={`${estilos.card} ${estilos[tema]}`}>
                                <div className={estilos.cardHeader}>
                                    <div className={estilos.cardHeaderTexto}>
                                        <div className={`${estilos.cardIcono} ${estilos.cardIconoCalendario}`}>
                                            <ion-icon name="calendar-outline"></ion-icon>
                                        </div>
                                        <h2 className={estilos.cardTitulo}>Programacion</h2>
                                    </div>
                                </div>
                                <div className={estilos.cardContenido}>
                                    <div className={estilos.grilla2}>
                                        <div className={estilos.campo}>
                                            <label className={estilos.label}>Programado para</label>
                                            <input type="datetime-local" name="scheduled_at" value={form.scheduled_at} onChange={handleChange} className={estilos.input} />
                                        </div>
                                        <div className={estilos.campo}>
                                            <label className={estilos.label}>Expira en</label>
                                            <input type="datetime-local" name="expires_at" value={form.expires_at} onChange={handleChange} className={estilos.input} />
                                        </div>
                                    </div>

                                    <label className={estilos.checkLabel}>
                                        <div className={`${estilos.checkBox} ${form.recurrence === 'monthly' ? estilos.checkBoxActivo : ""}`}>
                                            {form.recurrence === 'monthly' && <ion-icon name="checkmark-outline"></ion-icon>}
                                        </div>
                                        <input type="checkbox" checked={form.recurrence === 'monthly'} onChange={(e) => setForm(f => ({ ...f, recurrence: e.target.checked ? 'monthly' : '', day_of_month: e.target.checked ? String(new Date().getDate()) : '' }))} className={estilos.checkHidden} />
                                        <span>Recurrente — Se repite mensualmente</span>
                                    </label>

                                    {form.recurrence === 'monthly' && (
                                        <div className={estilos.campo}>
                                            <label className={estilos.label}>Día del mes (1-31)</label>
                                            <input type="number" name="day_of_month" value={form.day_of_month} onChange={handleChange} min="1" max="31" className={estilos.input} />
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>

                        <div className={estilos.columnaDer}>
                            <div className={`${estilos.card} ${estilos[tema]}`}>
                                <div className={estilos.cardHeader}>
                                    <div className={estilos.cardHeaderTexto}>
                                        <div className={`${estilos.cardIcono} ${estilos.cardIconoDestino}`}>
                                            <ion-icon name="people-circle-outline"></ion-icon>
                                        </div>
                                        <h2 className={estilos.cardTitulo}>Destinatarios</h2>
                                    </div>
                                </div>
                                <div className={estilos.cardContenido}>
                                    {form.target_type === "all" ? (
                                        <div className={estilos.destinoTodos}>
                                            <ion-icon name="globe-outline"></ion-icon>
                                            <p>El anuncio se enviara a todos los usuarios del sistema</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <p className={estilos.grupoTitulo}>Empresa</p>
                                                <div className={estilos.listaCheck}>
                                                    {empresas.map(emp => (
                                                        <label key={`e-${emp.id}`} className={estilos.checkItem}
                                                            onClick={() => seleccionarEmpresa(emp.id)}>
                                                            <div className={`${estilos.checkBox} ${empresaFiltro === emp.id ? estilos.checkBoxActivo : ""}`}>
                                                                {empresaFiltro === emp.id && <ion-icon name="checkmark-outline"></ion-icon>}
                                                            </div>
                                                            <span>{emp.nombre_empresa}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {empresaFiltro && (
                                                <div style={{ marginTop: "1rem" }}>
                                                    <p className={estilos.grupoTitulo}>Usuarios de la empresa</p>
                                                    <div className={estilos.listaCheck}>
                                                        {usuarios
                                                            .filter(u => u.empresa_id === empresaFiltro)
                                                            .map(u => (
                                                            <label key={`u-${u.id}`} className={estilos.checkItem}
                                                                onClick={() => toggleUsuario(u.id)}>
                                                                <div className={`${estilos.checkBox} ${form.targets.some(t => t.user_id === u.id) ? estilos.checkBoxActivo : ""}`}>
                                                                    {form.targets.some(t => t.user_id === u.id) && <ion-icon name="checkmark-outline"></ion-icon>}
                                                                </div>
                                                                <span>{u.nombre}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className={estilos.errorMsg}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                            {error}
                        </div>
                    )}

                    <div className={estilos.footerAcciones}>
                        <button type="button" className={estilos.btnCancelar} onClick={() => router.push("/superadmin/anuncios")}>
                            <ion-icon name="close-outline"></ion-icon>
                            Cancelar
                        </button>
                        <button type="submit" className={estilos.btnGuardar} disabled={guardando}>
                            <ion-icon name="checkmark-outline"></ion-icon>
                            {guardando ? "Guardando..." : "Guardar anuncio"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}