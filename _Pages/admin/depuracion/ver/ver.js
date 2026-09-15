"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { obtenerDetalleCredito, obtenerHistorialCredito, obtenerDatosEmpresa } from "../servidor"
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from "./ver.module.css"
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function VerDepuracionCliente() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const clienteId = searchParams.get("id")
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const trEstado = (estado) => {
        const map = {
            activo: tr('activo', 'active'),
            vencida: tr('vencida', 'overdue'),
            activa: tr('activa', 'active'),
        }
        return map[estado] || estado
    }

    const [tema, setTema] = useState("light")
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")
    const [detalle, setDetalle] = useState(null)
    const [empresa, setEmpresa] = useState(null)

    useEffect(() => {
        const t = localStorage.getItem("tema") || "light"
        setTema(t)
        const h = () => setTema(localStorage.getItem("tema") || "light")
        window.addEventListener("temaChange", h)
        window.addEventListener("storage", h)
        cargarEmpresa()
        return () => {
            window.removeEventListener("temaChange", h)
            window.removeEventListener("storage", h)
        }
    }, [])

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    useEffect(() => {
        if (!clienteId) {
            setError(tr('No se recibió id del cliente', 'Customer id was not received'))
            setCargando(false)
            return
        }

        cargarDetalle(clienteId)
    }, [clienteId])

    const cargarDetalle = async (id) => {
        setCargando(true)
        setError("")
        try {
            const [resDetalle, resHistorial] = await Promise.all([
                obtenerDetalleCredito(id),
                obtenerHistorialCredito(id),
            ])

            if (!resDetalle.success) {
                setError(resDetalle.mensaje || tr('No se pudo cargar el detalle', 'Could not load detail'))
                return
            }

            setDetalle({
                cliente: resDetalle.cliente,
                contratos: resDetalle.contratos || [],
                deudas: resDetalle.deudas || [],
                historial: resHistorial.success ? (resHistorial.historial || []) : (resDetalle.historial || []),
            })
        } catch (e) {
            console.error("[ver-depuracion]", e)
            setError(tr('Error inesperado al cargar el detalle', 'Unexpected error while loading detail'))
        } finally {
            setCargando(false)
        }
    }

    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : "es-DO")
    const monedaEmpresa = empresa?.moneda || 'DOP'

    const fmtMoneda = (v) => new Intl.NumberFormat(localeEmpresa, { style: "currency", currency: monedaEmpresa }).format(Number(v || 0))
    const fmtFecha = (v) => (v ? new Date(v).toLocaleDateString(language === 'en' ? 'en-US' : "es-DO") : "-")

    const resumen = useMemo(() => {
        if (!detalle) return null
        const c = detalle.cliente || {}
        const uso = Number(c.limiteCredito || 0) > 0
            ? Math.round((Number(c.saldoUtilizado || 0) / Number(c.limiteCredito || 0)) * 100)
            : 0

        return {
            limite: Number(c.limiteCredito || 0),
            utilizado: Number(c.saldoUtilizado || 0),
            disponible: Number(c.saldoDisponible || 0),
            uso,
        }
    }, [detalle])

    return (
        <div className={`${estilos.contenedor} ${estilos[tema] || ""}`}>
            <div className={`${estilos.card} ${estilos.header}`}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Detalle de Depuración de Crédito', 'Credit Debug Detail')}</h1>
                    <p className={estilos.subtitulo}>
                        {detalle?.cliente?.nombreCompleto || tr('Cliente', 'Customer')} · {detalle?.cliente?.numeroDocumento || tr('Sin documento', 'No document')}
                    </p>
                </div>
                <button className={estilos.btnVolver} onClick={() => router.push("/admin/depuracion")}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    {tr('Volver', 'Back')}
                </button>
            </div>

            {cargando && <LoadingScreen />}

            {!cargando && error && (
                <div className={`${estilos.card} ${estilos.vacio}`}>
                    {error}
                </div>
            )}

            {!cargando && !error && detalle && (
                <>
                    <div className={estilos.gridStats}>
                        <div className={`${estilos.card} ${estilos.stat}`}>
                            <div className={estilos.statLabel}>{tr('Límite de Crédito', 'Credit limit')}</div>
                            <div className={estilos.statValor}>{fmtMoneda(resumen.limite)}</div>
                        </div>
                        <div className={`${estilos.card} ${estilos.stat}`}>
                            <div className={estilos.statLabel}>{tr('Crédito Utilizado', 'Used credit')}</div>
                            <div className={estilos.statValor}>{fmtMoneda(resumen.utilizado)}</div>
                        </div>
                        <div className={`${estilos.card} ${estilos.stat}`}>
                            <div className={estilos.statLabel}>{tr('Disponible', 'Available')}</div>
                            <div className={estilos.statValor}>{fmtMoneda(resumen.disponible)}</div>
                        </div>
                        <div className={`${estilos.card} ${estilos.stat}`}>
                            <div className={estilos.statLabel}>{tr('Clasificación · Score', 'Classification · Score')}</div>
                            <div className={estilos.statValor}>
                                {detalle.cliente.clasificacion || "—"}&nbsp;·&nbsp;{detalle.cliente.scoreCrediticio ?? "—"}
                            </div>
                        </div>
                    </div>

                    <div className={estilos.layout}>
                        {/* Contratos */}
                        <section className={`${estilos.card} ${estilos.panel}`}>
                            <h3 className={estilos.panelTitulo}>
                                <ion-icon name="document-text-outline"></ion-icon>
                                {tr('Contratos del Cliente', 'Customer Contracts')}
                            </h3>
                            {detalle.contratos.length === 0 ? (
                                <div className={estilos.vacio}>
                                    <ion-icon name="document-outline"></ion-icon>
                                    {tr('Sin contratos registrados', 'No registered contracts')}
                                </div>
                            ) : (
                                <div className={estilos.lista}>
                                    {detalle.contratos.map((c) => (
                                        <article key={c.id} className={estilos.item}>
                                            <div className={estilos.itemHeader}>
                                                <span className={estilos.itemTitulo}>
                                                    {tr('Contrato', 'Contract')} {c.numero || `#${c.id}`}
                                                </span>
                                                <span className={`${estilos.badge} ${Number(c.cuotasVencidas || 0) > 0 ? estilos.warn : estilos.ok}`}>
                                                    {trEstado(c.estado || 'activo')}
                                                </span>
                                            </div>
                                            <div className={estilos.itemGrid}>
                                                <div className={estilos.itemDato}>
                                                    <span className={estilos.itemDatoLabel}>{tr('Saldo pendiente', 'Pending balance')}</span>
                                                    <span className={estilos.itemDatoValor}>{fmtMoneda(c.saldoPendiente)}</span>
                                                </div>
                                                <div className={estilos.itemDato}>
                                                    <span className={estilos.itemDatoLabel}>{tr('Cuota mensual', 'Monthly installment')}</span>
                                                    <span className={estilos.itemDatoValor}>{fmtMoneda(c.cuotaMensual)}</span>
                                                </div>
                                                <div className={estilos.itemDato}>
                                                    <span className={estilos.itemDatoLabel}>{tr('Cuotas pagadas', 'Paid installments')}</span>
                                                    <span className={estilos.itemDatoValor}>{c.cuotasPagadas || 0} / {c.totalCuotas || 0}</span>
                                                </div>
                                                <div className={estilos.itemDato}>
                                                    <span className={estilos.itemDatoLabel}>{tr('Cuotas vencidas', 'Overdue installments')}</span>
                                                    <span className={estilos.itemDatoValor}>{c.cuotasVencidas || 0}</span>
                                                </div>
                                            </div>
                                            <div className={estilos.row}>
                                                <small>{fmtFecha(c.fechaInicio)} — {fmtFecha(c.fechaFin)}</small>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Cuentas por Cobrar */}
                        <section className={`${estilos.card} ${estilos.panel}`}>
                            <h3 className={estilos.panelTitulo}>
                                <ion-icon name="wallet-outline"></ion-icon>
                                {tr('Cuentas por Cobrar', 'Accounts Receivable')}
                            </h3>
                            {detalle.deudas.length === 0 ? (
                                <div className={estilos.vacio}>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    {tr('Sin deudas pendientes', 'No pending debts')}
                                </div>
                            ) : (
                                <div className={estilos.lista}>
                                    {detalle.deudas.map((d) => (
                                        <article key={d.id} className={estilos.item}>
                                            <div className={estilos.itemHeader}>
                                                <span className={estilos.itemTitulo}>
                                                    {d.numeroDocumento || `${tr('CxC', 'A/R')} #${d.id}`}
                                                </span>
                                                <span className={`${estilos.badge} ${d.estadoCxc === "vencida" ? estilos.warn : estilos.ok}`}>
                                                    {trEstado(d.estadoCxc || 'activa')}
                                                </span>
                                            </div>
                                            <div className={estilos.itemGrid}>
                                                <div className={estilos.itemDato}>
                                                    <span className={estilos.itemDatoLabel}>{tr('Monto total', 'Total amount')}</span>
                                                    <span className={estilos.itemDatoValor}>{fmtMoneda(d.montoTotal)}</span>
                                                </div>
                                                <div className={estilos.itemDato}>
                                                    <span className={estilos.itemDatoLabel}>{tr('Pendiente', 'Pending')}</span>
                                                    <span className={estilos.itemDatoValor}>{fmtMoneda(d.saldoPendiente)}</span>
                                                </div>
                                                <div className={estilos.itemDato}>
                                                    <span className={estilos.itemDatoLabel}>{tr('Vencimiento', 'Due date')}</span>
                                                    <span className={estilos.itemDatoValor}>{fmtFecha(d.fechaVencimiento)}</span>
                                                </div>
                                                <div className={estilos.itemDato}>
                                                    <span className={estilos.itemDatoLabel}>{tr('Días de atraso', 'Days overdue')}</span>
                                                    <span className={estilos.itemDatoValor}>{d.diasAtraso || 0} {tr('días', 'days')}</span>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Historial */}
                    <section className={`${estilos.card} ${estilos.panel}`} style={{ marginTop: "1rem" }}>
                        <h3 className={estilos.panelTitulo}>
                            <ion-icon name="time-outline"></ion-icon>
                            {tr('Historial Crediticio', 'Credit History')}
                        </h3>
                        {detalle.historial.length === 0 ? (
                            <div className={estilos.vacio}>
                                <ion-icon name="time-outline"></ion-icon>
                                {tr('Sin historial disponible', 'No history available')}
                            </div>
                        ) : (
                            <div className={estilos.lista}>
                                {detalle.historial.map((h) => (
                                    <article key={h.id} className={estilos.historialItem}>
                                        <div className={estilos.historialIcono}>
                                            <ion-icon name="flash-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.historialCuerpo}>
                                            <div className={estilos.historialTitulo}>
                                                <strong>{h.tipoEvento || tr('Evento', 'Event')}</strong>
                                                <small>{fmtFecha(h.fechaEvento)}</small>
                                            </div>
                                            <p className={estilos.historialDesc}>{h.descripcion || tr('Sin descripción', 'No description')}</p>
                                            <div className={estilos.historialMeta}>
                                                <small>{tr('Clasificación', 'Classification')}: {h.clasificacionMomento || "—"}</small>
                                                <small>Score: {h.scoreMomento ?? "—"}</small>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}
