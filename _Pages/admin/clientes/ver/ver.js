"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { obtenerClientePorId } from "./servidor"
import { obtenerDatosEmpresa } from "../servidor"
import { obtenerCxCPendientes, registrarAbono, obtenerHistorialAbonos, registrarAbonoConsolidado } from "../Cobrar/servidor"
import { obtenerCuotasPendientesCliente, registrarPagoCuota, obtenerHistorialPagosCliente } from "@/_Pages/admin/contratos/servidor"
import { useLanguage } from "../../i18n/LanguageProvider"
import estilos from "./ver.module.css"
import modales from "./modales.module.css"
import contrato from "@/_Pages/admin/financiamiento/contratos/ver/[id]/ver.module.css"

const METODOS_PAGO = [
    { value: 'efectivo',        label: 'Efectivo',       icono: 'cash-outline' },
    { value: 'tarjeta_debito',  label: 'Débito',         icono: 'card-outline' },
    { value: 'tarjeta_credito', label: 'T. Crédito',     icono: 'card-outline' },
    { value: 'transferencia',   label: 'Transferencia',  icono: 'swap-horizontal-outline' },
    { value: 'cheque',          label: 'Cheque',         icono: 'receipt-outline' },
]

export default function VerClienteAdmin({ returnPath = '/admin/clientes', basePath = '/admin' }) {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const { language } = useLanguage()

    const [tema, setTema] = useState("light")
    const [cargando, setCargando] = useState(true)
    const [cliente, setCliente] = useState(null)
    const [tabActiva, setTabActiva] = useState("perfil")

    // Tab Cobros
    const [cxcPendientes, setCxCPendientes] = useState([])
    const [cuotasPendientes, setCuotasPendientes] = useState([])
    const [totalPendienteFin, setTotalPendienteFin] = useState(0)
    const [cuotaSeleccionadaFin, setCuotaSeleccionadaFin] = useState(null)
    const [mostrarModalCuota, setMostrarModalCuota] = useState(false)
    const [montoCuotaPago, setMontoCuotaPago] = useState('')
    const [fechaCuotaPago, setFechaCuotaPago] = useState(new Date().toISOString().split('T')[0])
    const [metodoCuotaPago, setMetodoCuotaPago] = useState('efectivo')
    const [referenciaCuotaPago, setReferenciaCuotaPago] = useState('')
    const [notasCuotaPago, setNotasCuotaPago] = useState('')
    const [procesandoCuota, setProcesandoCuota] = useState(false)
    const [errorCuota, setErrorCuota] = useState('')
    const [cargandoCxC, setCargandoCxC] = useState(false)
    const [cxcSeleccionada, setCxCSeleccionada] = useState(null)
    const [verDetalleCxC, setVerDetalleCxC] = useState(false)
    const [montoConsolidado, setMontoConsolidado] = useState("")
    const [metodoPagoConsolidado, setMetodoPagoConsolidado] = useState("efectivo")
    const [referenciaConsolidado, setReferenciaConsolidado] = useState("")
    const [notasConsolidado, setNotasConsolidado] = useState("")
    const [procesandoConsolidado, setProcesandoConsolidado] = useState(false)
    const [errorConsolidado, setErrorConsolidado] = useState("")
    const [monto, setMonto] = useState("")
    const [metodoPago, setMetodoPago] = useState("efectivo")
    const [referencia, setReferencia] = useState("")
    const [notasPago, setNotasPago] = useState("")
    const [procesando, setProcesando] = useState(false)
    const [errorPago, setErrorPago] = useState("")

    // Tab Historial
    const [historial, setHistorial] = useState([])
    const [historialFin, setHistorialFin] = useState([])
    const [cargandoHistorial, setCargandoHistorial] = useState(false)
    const [empresa, setEmpresa] = useState(null)

    const tr = (es, en) => language === "en" ? en : es

    useEffect(() => {
        const t = localStorage.getItem("tema") || "light"
        setTema(t)
        const cambioTema = () => setTema(localStorage.getItem("tema") || "light")
        window.addEventListener("temaChange", cambioTema)
        window.addEventListener("storage", cambioTema)
        return () => {
            window.removeEventListener("temaChange", cambioTema)
            window.removeEventListener("storage", cambioTema)
        }
    }, [])

    useEffect(() => {
        cargarCliente()
        cargarEmpresa()
    }, [params.id])

    async function cargarCliente() {
        setCargando(true)
        try {
            const r = await obtenerClientePorId(params.id)
            if (r.success) setCliente(r.cliente)
            else { alert(r.mensaje || tr("No se pudo cargar el cliente", "Could not load the customer")); router.push(returnPath) }
        } catch {
            router.push(returnPath)
        } finally {
            setCargando(false)
        }
    }

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const r = await obtenerClientePorId(params.id)
            if (r.success) setCliente(r.cliente)
            else { alert(r.mensaje || tr("No se pudo cargar el cliente", "Could not load the customer")); router.push(returnPath) }
        } catch {
            router.push(returnPath)
        } finally {
            setCargando(false)
        }
    }

    const cambiarTab = (tab) => {
        setTabActiva(tab)
        if (tab === "cobros") cargarCxC()
        else if (tab === "historial") cargarHistorial()
    }

    const cargarCxC = async () => {
        setCargandoCxC(true)
        try {
            if (basePath === '/financiamiento') {
                const r = await obtenerCuotasPendientesCliente(params.id)
                if (r.success) {
                    setCuotasPendientes(r.cuotas || [])
                    setTotalPendienteFin(r.totalPendiente || 0)
                }
            } else {
                const r = await obtenerCxCPendientes(params.id)
                if (r.success) setCxCPendientes(r.cuentas)
            }
        } finally {
            setCargandoCxC(false)
        }
    }

    const cargarHistorial = async () => {
        setCargandoHistorial(true)
        try {
            if (basePath === '/financiamiento') {
                const r = await obtenerHistorialPagosCliente(params.id)
                if (r.success) setHistorialFin(r.pagos || [])
            } else {
                const r = await obtenerHistorialAbonos(params.id)
                if (r.success) setHistorial(r.abonos)
            }
        } finally {
            setCargandoHistorial(false)
        }
    }

    const seleccionarCxC = (cxc) => {
        if (cxcSeleccionada?.id === cxc.id) {
            setCxCSeleccionada(null)
        } else {
            setCxCSeleccionada(cxc)
            setMonto(cxc.saldoPendiente.toFixed(2))
            setMetodoPago("efectivo")
            setReferencia("")
            setNotasPago("")
            setErrorPago("")
        }
    }

    const manejarPago = async (e) => {
        e.preventDefault()
        if (!cxcSeleccionada) return
        setErrorPago("")
        const montoNum = parseFloat(monto)
        if (isNaN(montoNum) || montoNum <= 0) {
            setErrorPago(tr("Ingresa un monto válido", "Enter a valid amount")); return
        }
        if (montoNum > cxcSeleccionada.saldoPendiente + 0.01) {
            setErrorPago(tr("No puede exceder el saldo: ", "It cannot exceed the balance: ") + fmtMoneda(cxcSeleccionada.saldoPendiente)); return
        }
        if (["transferencia", "cheque"].includes(metodoPago) && !referencia.trim()) {
            setErrorPago(tr("La referencia es obligatoria para transferencia y cheque", "Reference is required for transfer and check")); return
        }
        setProcesando(true)
        try {
            const r = await registrarAbono({
                cxc_id: cxcSeleccionada.id,
                cliente_id: parseInt(params.id),
                monto_abonado: montoNum,
                metodo_pago: metodoPago,
                referencia_pago: referencia || null,
                notas: notasPago || null,
            })
            if (r.success) {
                setCxCSeleccionada(null)
                await Promise.all([cargarCxC(), cargarDatos()])
                router.push(`${basePath === '/financiamiento' ? '/financiamiento' : '/admin'}/cobros/imprimir/` + r.abonoId)
            } else {
                setErrorPago(r.mensaje)
            }
        } catch {
            setErrorPago(tr("Error al procesar el pago", "Error processing payment"))
        } finally {
            setProcesando(false)
        }
    }

    const manejarPagoConsolidado = async (e) => {
        e.preventDefault()
        setErrorConsolidado("")
        const montoNum = parseFloat(montoConsolidado)
        if (isNaN(montoNum) || montoNum <= 0) { setErrorConsolidado(tr("Ingresa un monto válido", "Enter a valid amount")); return }
        const deudaTotal = cliente.deuda?.total || 0
        if (montoNum > deudaTotal + 0.01) { setErrorConsolidado(tr("El monto excede la deuda total", "Amount exceeds total debt")); return }
        if (["transferencia", "cheque"].includes(metodoPagoConsolidado) && !referenciaConsolidado.trim()) {
            setErrorConsolidado(tr("La referencia es obligatoria para transferencia y cheque", "Reference is required for transfer and check")); return
        }
        setProcesandoConsolidado(true)
        try {
            const r = await registrarAbonoConsolidado({
                cliente_id: parseInt(params.id),
                monto_total: montoNum,
                metodo_pago: metodoPagoConsolidado,
                referencia_pago: referenciaConsolidado || null,
                notas: notasConsolidado || null,
            })
            if (r.success) {
                setMontoConsolidado("")
                setReferenciaConsolidado("")
                setNotasConsolidado("")
                await Promise.all([cargarCxC(), cargarDatos()])
                router.push(`/admin/cobros/imprimir/` + r.abonoId)
            } else {
                setErrorConsolidado(r.mensaje)
            }
        } catch {
            setErrorConsolidado(tr("Error al procesar el pago", "Error processing payment"))
        } finally {
            setProcesandoConsolidado(false)
        }
    }

    const localeEmpresa = empresa?.locale || 'es-DO'
    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'

    const fmtMoneda = (v) => {
        const numero = new Intl.NumberFormat(language === "en" ? "en-US" : localeEmpresa, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)
        return `${simboloMoneda} ${numero}`
    }

    const fmtFecha = (f) => {
        if (!f) return "---"
        return new Date(f).toLocaleDateString(language === "en" ? "en-US" : localeEmpresa, { year: "numeric", month: "short", day: "numeric" })
    }

    const metodoPagoLabel = (metodo) => {
        const labels = {
            efectivo: tr("Efectivo", "Cash"),
            tarjeta_debito: tr("Débito", "Debit"),
            tarjeta_credito: tr("T. Crédito", "Credit Card"),
            transferencia: tr("Transferencia", "Transfer"),
            cheque: tr("Cheque", "Check"),
        }
        return labels[metodo] || metodo
    }

    const colorEstado = (est) => {
        const m = { activa: "#10b981", vencida: "#ef4444", parcial: "#f59e0b" }
        return m[est] || "#6b7280"
    }

    const colorCredito = () => {
        const p = cliente?.credito?.porcentajeUso || 0
        if (p >= 90) return "#ef4444"
        if (p >= 70) return "#f59e0b"
        return "#10b981"
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.spinner}></div>
                    <span>{tr("Cargando perfil...", "Loading profile...")}</span>
                </div>
            </div>
        )
    }

    if (!cliente) return null

    const tieneDeuda = (cliente.deuda?.total || 0) > 0
    const deudaMostrada = basePath === '/financiamiento' ? (cliente.deuda?.totalGeneral || 0) : (cliente.deuda?.total || 0)
    const tieneDeudaMostrada = deudaMostrada > 0
    const puedeVender = cliente.clienteActivo

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* HEADER */}
            <div className={`${estilos.header} ${estilos[tema]}`}>
                <button className={estilos.btnVolver} onClick={() => router.push(returnPath)}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                </button>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerNombre}>
                        <h1>{cliente.nombreCompleto}</h1>
                        <span className={`${estilos.badge} ${cliente.clienteActivo ? estilos.badgeActivo : estilos.badgeInactivo}`}>
                            {cliente.clienteActivo ? tr("Activo", "Active") : tr("Inactivo", "Inactive")}
                        </span>
                    </div>
                    <p className={estilos.headerDoc}>
                        {cliente.documento.tipoCodigo}: {cliente.documento.numero}
                        {cliente.contacto?.telefono && <span> · {cliente.contacto.telefono}</span>}
                    </p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button
                        className={estilos.btnHeaderEdit}
                        onClick={() => router.push(`${basePath}/clientes/editar/${cliente.id}`)}
                        title={tr("Editar cliente", "Edit customer")}
                    >
                        <ion-icon name="create-outline"></ion-icon>
                    </button>
                    {puedeVender && (
                        <button
                            className={estilos.btnHeaderVender}
                            onClick={() => router.push(basePath === '/financiamiento' ? `${basePath}/contratos/nuevo?cliente=${cliente.id}` : `${basePath}/ventas/nueva?cliente=${cliente.id}`)}
                        >
                            <ion-icon name="cart-outline"></ion-icon>
                            <span>{tr(basePath === '/financiamiento' ? 'Nuevo Contrato' : 'Vender', basePath === '/financiamiento' ? 'New Contract' : 'Sell')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* TABS */}
            <div className={`${estilos.tabBar} ${estilos[tema]}`}>
                <button
                    className={`${estilos.tabBtn} ${tabActiva === "perfil" ? estilos.tabActivo : ""}`}
                    onClick={() => cambiarTab("perfil")}
                >
                    <ion-icon name="person-outline"></ion-icon>
                    <span>{tr("Perfil", "Profile")}</span>
                </button>
                <button
                    className={`${estilos.tabBtn} ${tabActiva === "cobros" ? estilos.tabActivo : ""}`}
                    onClick={() => cambiarTab("cobros")}
                >
                    <ion-icon name="wallet-outline"></ion-icon>
                    <span>{tr("Cobros", "Payments")}</span>
                    {tieneDeuda && <span className={estilos.tabBadgePunto}></span>}
                </button>
                <button
                    className={`${estilos.tabBtn} ${tabActiva === "historial" ? estilos.tabActivo : ""}`}
                    onClick={() => cambiarTab("historial")}
                >
                    <ion-icon name="receipt-outline"></ion-icon>
                    <span>{tr("Historial", "History")}</span>
                </button>
            </div>

            {/* ===== TAB PERFIL ===== */}
            {tabActiva === "perfil" && (
                <div className={estilos.tabContenido}>
                    <div className={estilos.perfilGrid}>

                        <div className={estilos.perfilIzq}>
                            <div className={`${estilos.card} ${estilos[tema]}`}>
                                <div className={estilos.avatarWrap}>
                                    {cliente.fotoUrl
                                        ? <img src={cliente.fotoUrl} alt={cliente.nombreCompleto} className={estilos.avatar} />
                                        : <div className={estilos.avatarPlaceholder}><ion-icon name="person-outline"></ion-icon></div>
                                    }
                                    <div className={`${estilos.estadoPunto} ${cliente.clienteActivo ? estilos.pActivo : estilos.pInactivo}`}></div>
                                </div>
                                <div className={estilos.perfilStats}>
                                    <div className={estilos.perfilStat}>
                                        <span className={estilos.pStatLabel}>{tr("Compras Totales", "Total Purchases")}</span>
                                        <span className={estilos.pStatVal}>{fmtMoneda(cliente.totalCompras)}</span>
                                    </div>
                                    <div className={estilos.perfilStat}>
                                        <span className={estilos.pStatLabel}>{tr("Puntos", "Points")}</span>
                                        <span className={estilos.pStatVal}>{cliente.puntosFidelidad || 0}</span>
                                    </div>
                                    <div className={estilos.perfilStat}>
                                        <span className={estilos.pStatLabel}>{tr("Deuda Total", "Total Debt")}</span>
                                        <span className={estilos.pStatVal} style={{ color: tieneDeudaMostrada ? "#ef4444" : "#10b981" }}>
                                            {fmtMoneda(deudaMostrada)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={`${estilos.card} ${estilos[tema]}`}>
                                <h3 className={estilos.cardTitulo}>
                                    <ion-icon name="call-outline"></ion-icon>
                                    {tr("Contacto", "Contact")}
                                </h3>
                                <div className={estilos.contactoLista}>
                                    {cliente.contacto?.telefono && (
                                        <a href={`tel:${cliente.contacto.telefono}`} className={estilos.contactoItem}>
                                            <ion-icon name="call"></ion-icon>
                                            <span>{cliente.contacto.telefono}</span>
                                        </a>
                                    )}
                                    {cliente.contacto?.email && (
                                        <a href={`mailto:${cliente.contacto.email}`} className={estilos.contactoItem}>
                                            <ion-icon name="mail"></ion-icon>
                                            <span>{cliente.contacto.email}</span>
                                        </a>
                                    )}
                                    {cliente.contacto?.direccion && (
                                        <div className={estilos.contactoItem}>
                                            <ion-icon name="location"></ion-icon>
                                            <span>{cliente.contacto.direccion}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={estilos.perfilDer}>
                            {cliente.credito?.tienePerfil ? (
                                <>
                                    <div className={estilos.tarjetaCredito} style={{
                                        background: `linear-gradient(135deg, ${colorCredito()}, ${colorCredito()}cc)`
                                    }}>
                                        <div className={estilos.tcHeader}>
                                            <div>
                                                <p className={estilos.tcLabel}>{tr("Crédito Disponible", "Available Credit")}</p>
                                                <p className={estilos.tcDisponible}>{fmtMoneda(cliente.credito.disponible)}</p>
                                            </div>
                                            <ion-icon name="card-outline" style={{ fontSize: "36px", opacity: 0.6 }}></ion-icon>
                                        </div>
                                        <div className={estilos.tcBarra}>
                                            <div className={estilos.tcBarraFill}
                                                style={{ width: `${Math.min(cliente.credito.porcentajeUso || 0, 100)}%` }}></div>
                                        </div>
                                        <div className={estilos.tcFooter}>
                                            <div>
                                                <span className={estilos.tcLabel}>{tr("Utilizado", "Used")}</span>
                                                <strong>{fmtMoneda(cliente.credito.utilizado)}</strong>
                                            </div>
                                            <div>
                                                <span className={estilos.tcLabel}>{tr("Límite", "Limit")}</span>
                                                <strong>{fmtMoneda(cliente.credito.limite)}</strong>
                                            </div>
                                            <div>
                                                <span className={estilos.tcLabel}>Score</span>
                                                <strong>{cliente.credito.score}</strong>
                                            </div>
                                            <div>
                                                <span className={estilos.tcLabel}>{tr("Nivel", "Level")}</span>
                                                <strong>{cliente.credito.clasificacion}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={estilos.accionesGrid}>
                                        <button
                                            className={`${estilos.btnAccion} ${estilos.btnVender}`}
                                            disabled={!puedeVender}
                                            onClick={() => router.push(basePath === '/financiamiento' ? `${basePath}/contratos/nuevo?cliente=${cliente.id}` : `${basePath}/ventas/nueva?cliente=${cliente.id}`)}
                                        >
                                            <ion-icon name="cart-outline"></ion-icon>
                                            <div>
                                                <span>{tr(basePath === '/financiamiento' ? 'Nuevo Contrato' : 'Vender', basePath === '/financiamiento' ? 'New Contract' : 'Sell')}</span>
                                                <small>{puedeVender ? tr(basePath === '/financiamiento' ? 'Nuevo contrato de financiamiento' : 'Nueva venta a crédito', basePath === '/financiamiento' ? 'New financing contract' : 'New credit sale') : tr('Sin crédito disponible', 'No credit available')}</small>
                                            </div>
                                        </button>
                                        <button
                                            className={`${estilos.btnAccion} ${estilos.btnCobrar}`}
                                            disabled={!tieneDeudaMostrada}
                                            onClick={() => cambiarTab("cobros")}
                                        >
                                            <ion-icon name="wallet-outline"></ion-icon>
                                            <div>
                                                <span>{tr("Cobrar", "Charge")}</span>
                                                <small>{tieneDeudaMostrada ? fmtMoneda(deudaMostrada) : tr("Sin deuda", "No debt")}</small>
                                            </div>
                                        </button>
                                        <button
                                            className={`${estilos.btnAccion} ${estilos.btnHistorial}`}
                                            onClick={() => cambiarTab("historial")}
                                        >
                                            <ion-icon name="receipt-outline"></ion-icon>
                                            <div>
                                                <span>{tr("Historial", "History")}</span>
                                                <small>{tr("Ver pagos", "View payments")}</small>
                                            </div>
                                        </button>
                                    </div>

                                    {tieneDeudaMostrada && (
                                        <div className={estilos.alertaDeuda}>
                                            <ion-icon name="alert-circle"></ion-icon>
                                            <span>
                                                {tr("Deuda pendiente:", "Outstanding debt:")} <strong>{fmtMoneda(deudaMostrada)}</strong>
                                                {(cliente.deuda?.vencida || 0) > 0 && (
                                                    <span className={estilos.alertaVencida}> · {tr("Vencida:", "Overdue:")} {fmtMoneda(cliente.deuda.vencida)}</span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className={`${estilos.sinCredito} ${estilos[tema]}`}>
                                    <ion-icon name="card-outline"></ion-icon>
                                    <h3>{tr("Sin Perfil Crediticio", "No Credit Profile")}</h3>
                                    <p>{tr("Este cliente no tiene crédito configurado.", "This customer does not have credit configured.")}</p>
                                    <button
                                        className={estilos.btnCrearCredito}
                                        onClick={() => router.push(`${basePath}/clientes/editar/${cliente.id}?tab=credito`)}
                                    >
                                        <ion-icon name="add-circle-outline"></ion-icon>
                                        {tr("Configurar Crédito", "Configure Credit")}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TAB COBROS ===== */}
            {tabActiva === "cobros" && (
                <div className={estilos.tabContenido}>

                    {/* PANEL CONSOLIDADO */}
                    {basePath !== '/financiamiento' && (
                        <div className={`${estilos.panelConsolidado} ${estilos[tema]}`}>
                            <div className={estilos.consolidadoHeader}>
                                <div className={estilos.consolidadoDeuda}>
                                    <span className={estilos.consolidadoLabel}>{tr("Deuda Total", "Total Debt")}</span>
                                    <span className={estilos.consolidadoMonto} style={{ color: tieneDeuda ? "#ef4444" : "#10b981" }}>
                                        {fmtMoneda(cliente.deuda?.total || 0)}
                                    </span>
                                    {(cliente.deuda?.vencida || 0) > 0 && (
                                        <span className={estilos.consolidadoVencida}>
                                            <ion-icon name="warning-outline"></ion-icon>
                                            {tr("Vencida:", "Overdue:")} {fmtMoneda(cliente.deuda.vencida)}
                                        </span>
                                    )}
                                </div>
                                <button className={estilos.btnVerDetalle} onClick={() => setVerDetalleCxC(v => !v)}>
                                    <ion-icon name={verDetalleCxC ? "chevron-up-outline" : "list-outline"}></ion-icon>
                                    {verDetalleCxC ? tr("Ocultar", "Hide") : tr("Ver detalle", "View detail")}
                                    <span className={estilos.btnVerDetalleBadge}>{cxcPendientes.length}</span>
                                </button>
                            </div>

                            {tieneDeuda && (
                                <form onSubmit={manejarPagoConsolidado} className={estilos.formConsolidado}>
                                    <div className={estilos.formConsolidadoGrid}>
                                        {/* Monto */}
                                        <div className={estilos.formGrupo}>
                                            <label>{tr("Monto a Pagar", "Amount to Pay")}</label>
                                            <div className={estilos.inputMontoWrap}>
                                                <span className={estilos.inputMontoSymbol}>{empresa?.simbolo_moneda || 'RD$'}</span>
                                                <input type="number" step="0.01" min="0.01"
                                                    value={montoConsolidado}
                                                    onChange={e => setMontoConsolidado(e.target.value)}
                                                    className={estilos.inputMonto}
                                                    placeholder="0.00" required />
                                            </div>
                                        </div>

                                        {/* Método de pago */}
                                        <div className={estilos.formGrupo}>
                                            <label>{tr("Método de Pago", "Payment Method")}</label>
                                            <div className={estilos.metodosWrap}>
                                                {METODOS_PAGO.map(m => (
                                                    <button key={m.value} type="button"
                                                        className={`${estilos.metodoChip} ${metodoPagoConsolidado === m.value ? estilos.metodoChipActivo : ""}`}
                                                        onClick={() => setMetodoPagoConsolidado(m.value)}>
                                                        <ion-icon name={m.icono}></ion-icon>
                                                        {m.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Referencia condicional */}
                                        {["transferencia","cheque"].includes(metodoPagoConsolidado) && (
                                            <div className={estilos.formGrupo}>
                                                <label>{tr("Referencia", "Reference")} <span className={estilos.requerido}>*</span></label>
                                                <input type="text" value={referenciaConsolidado}
                                                    onChange={e => setReferenciaConsolidado(e.target.value)}
                                                    placeholder={tr("Número de transferencia / cheque", "Transfer / check number")}
                                                    className={estilos.input} />
                                            </div>
                                        )}

                                        {/* Notas */}
                                        <div className={estilos.formGrupo}>
                                            <label>{tr("Notas (opcional)", "Notes (optional)")}</label>
                                            <input type="text" value={notasConsolidado}
                                                onChange={e => setNotasConsolidado(e.target.value)}
                                                placeholder={tr("Observaciones del pago", "Payment notes")}
                                                className={estilos.input} />
                                        </div>
                                    </div>

                                    {errorConsolidado && (
                                        <div className={estilos.errorPago}>
                                            <ion-icon name="alert-circle-outline"></ion-icon> {errorConsolidado}
                                        </div>
                                    )}

                                    <div className={estilos.formAcciones}>
                                        <button type="button" className={estilos.btnPagarTodo}
                                            onClick={() => setMontoConsolidado((cliente.deuda?.total || 0).toFixed(2))}>
                                            {tr("Pagar Todo", "Pay All")}
                                        </button>
                                        <button type="submit" className={estilos.btnConfirmar} disabled={procesandoConsolidado}>
                                            {procesandoConsolidado
                                                ? <><div className={estilos.spinnerBtn}></div> {tr("Procesando...", "Processing...")}</>
                                                : <><ion-icon name="checkmark-circle-outline"></ion-icon> {tr("Registrar Pago", "Record Payment")}</>
                                            }
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {cargandoCxC ? (
                        <div className={estilos.cargandoTab}>
                            <div className={estilos.spinner}></div>
                            <span>{tr("Cargando...", "Loading...")}</span>
                        </div>
                    ) : basePath === '/financiamiento' ? (
                        cuotasPendientes.length === 0 ? (
                            <div className={`${estilos.sinDeuda} ${estilos[tema]}`}>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <h3>{tr("Sin cuotas pendientes", "No pending installments")}</h3>
                                <p>{tr("Este cliente está al día con sus préstamos.", "This customer is up to date with loans.")}</p>
                            </div>
                        ) : (
                            <div className={`${contrato.listaCuotas} ${contrato[tema]}`}>
                                {cuotasPendientes.map(cuota => {
                                    const montoTotal = parseFloat(cuota.monto) + parseFloat(cuota.mora || 0)
                                    return (
                                    <div key={cuota.id} className={`${contrato.cuotaCard} ${cuota.estado === 'vencida' ? contrato.vencida : contrato.pendiente}`}>
                                        <div className={contrato.cuotaHeader}>
                                            <div className={contrato.cuotaNumero}>
                                                <span className={contrato.numeroBadge}>{cuota.numero}</span>
                                                <div>
                                                    <strong>{cuota.contrato_numero} — Cuota #{cuota.numero}</strong>
                                                    <p>{tr('Vence:', 'Due:')} {fmtFecha(cuota.fecha_vencimiento)}</p>
                                                </div>
                                            </div>
                                            <div className={contrato.cuotaEstado}>
                                                <span className={`${contrato.badge} ${cuota.estado === 'vencida' ? contrato.danger : contrato.warning}`}>
                                                    {cuota.estado}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={contrato.cuotaDetalles}>
                                            <div className={contrato.detalleFinanciero}>
                                                <div>
                                                    <span className={contrato.detalleLabel}>{tr('Capital', 'Capital')}</span>
                                                    <span className={contrato.detalleValor}>{fmtMoneda(cuota.capital)}</span>
                                                </div>
                                                <div>
                                                    <span className={contrato.detalleLabel}>{tr('Interés', 'Interest')}</span>
                                                    <span className={contrato.detalleValor}>{fmtMoneda(cuota.interes)}</span>
                                                </div>
                                                {parseFloat(cuota.mora || 0) > 0 && (
                                                    <div>
                                                        <span className={contrato.detalleLabel}>{tr('Mora', 'Late Fee')}</span>
                                                        <span className={`${contrato.detalleValor} ${contrato.danger}`}>{fmtMoneda(cuota.mora)}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className={contrato.detalleLabel}>{tr('Total', 'Total')}</span>
                                                    <span className={`${contrato.detalleValor} ${contrato.total}`}>{fmtMoneda(montoTotal)}</span>
                                                </div>
                                            </div>
                                            <div className={contrato.cuotaAcciones}>
                                                <div className={contrato.montoPendiente}>
                                                    <span>{tr('Pendiente:', 'Pending:')} {fmtMoneda(montoTotal)}</span>
                                                </div>
                                                <button className={contrato.btnPagar} onClick={() => {
                                                    setCuotaSeleccionadaFin(cuota)
                                                    setMontoCuotaPago(montoTotal.toFixed(2))
                                                    setFechaCuotaPago(new Date().toISOString().split('T')[0])
                                                    setMetodoCuotaPago('efectivo')
                                                    setReferenciaCuotaPago('')
                                                    setNotasCuotaPago('')
                                                    setErrorCuota('')
                                                    setMostrarModalCuota(true)
                                                }}>
                                                    <ion-icon name="cash-outline"></ion-icon>
                                                    {tr('Registrar Pago', 'Register Payment')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    )
                                })}
                            </div>
                        )
                    ) : !verDetalleCxC ? null : cxcPendientes.length === 0 ? (
                        <div className={`${estilos.sinDeuda} ${estilos[tema]}`}>
                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                            <h3>{tr("Sin deudas pendientes", "No pending debts")}</h3>
                            <p>{tr("Este cliente está al día con sus pagos.", "This customer is up to date with payments.")}</p>
                        </div>
                    ) : (
                        <div className={estilos.listaCxC}>
                            {cxcPendientes.map(cxc => (
                                <div key={cxc.id} className={`${estilos.cxcItem} ${estilos[tema]} ${cxcSeleccionada?.id === cxc.id ? estilos.cxcSeleccionada : ""}`}>

                                    <div className={estilos.cxcCabecera} onClick={() => seleccionarCxC(cxc)}>
                                        <div className={estilos.cxcIcono} style={{ background: colorEstado(cxc.estadoCxc) }}>
                                            <ion-icon name="document-text-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.cxcInfo}>
                                            <div className={estilos.cxcTop}>
                                                <span className={estilos.cxcNumero}>
                                                    {cxc.ncf || cxc.numeroDocumento}
                                                </span>
                                                <span className={estilos.cxcEstadoBadge} style={{
                                                    background: colorEstado(cxc.estadoCxc) + "22",
                                                    color: colorEstado(cxc.estadoCxc)
                                                }}>
                                                    {cxc.estadoCxc}
                                                </span>
                                            </div>
                                            <div className={estilos.cxcDatos}>
                                                <span>{tr("Emitida:", "Issued:")} {fmtFecha(cxc.fechaEmision)}</span>
                                                <span>{tr("Vence:", "Due:")} {fmtFecha(cxc.fechaVencimiento)}</span>
                                                {cxc.diasAtraso > 0 && (
                                                    <span className={estilos.diasAtraso}>{cxc.diasAtraso}{tr("d atraso", "d late")}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={estilos.cxcMontos}>
                                            <span className={estilos.cxcSaldo}>{fmtMoneda(cxc.saldoPendiente)}</span>
                                            <small>{tr("de", "of")} {fmtMoneda(cxc.montoTotal)}</small>
                                        </div>
                                        <button className={`${estilos.btnPagar} ${cxcSeleccionada?.id === cxc.id ? estilos.btnPagarActivo : ""}`}>
                                            <ion-icon name={cxcSeleccionada?.id === cxc.id ? "chevron-up-outline" : "wallet-outline"}></ion-icon>
                                            <span>{cxcSeleccionada?.id === cxc.id ? tr("Cerrar", "Close") : tr("Pagar", "Pay")}</span>
                                        </button>
                                    </div>

                                    {cxcSeleccionada?.id === cxc.id && (
                                        <form className={`${estilos.formPago} ${estilos[tema]}`} onSubmit={manejarPago}>
                                            <div className={estilos.formPagoHeader}>
                                                <ion-icon name="card-outline"></ion-icon>
                                                <span>{tr("Registrar Pago · Saldo:", "Record Payment · Balance:")} <strong>{fmtMoneda(cxc.saldoPendiente)}</strong></span>
                                            </div>

                                            <div className={estilos.formGrid}>
                                                <div className={estilos.formGrupo}>
                                                    <label>{tr("Monto a Pagar", "Amount to Pay")}</label>
                                                    <div className={estilos.inputMoneda}>
                                                        <span>{simboloMoneda}</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            max={cxc.saldoPendiente}
                                                            value={monto}
                                                            onChange={e => setMonto(e.target.value)}
                                                            className={estilos.input}
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className={estilos.formGrupo}>
                                                    <label>{tr("Método de Pago", "Payment Method")}</label>
                                                    <div className={estilos.metodosGrid}>
                                                        {METODOS_PAGO.map(m => (
                                                            <button
                                                                key={m.value}
                                                                type="button"
                                                                className={`${estilos.btnMetodo} ${metodoPago === m.value ? estilos.btnMetodoActivo : ""}`}
                                                                onClick={() => setMetodoPago(m.value)}
                                                            >
                                                                <ion-icon name={m.icono}></ion-icon>
                                                                <span>{metodoPagoLabel(m.value)}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {["transferencia", "cheque"].includes(metodoPago) && (
                                                    <div className={estilos.formGrupo}>
                                                        <label>{tr("Referencia", "Reference")} <span className={estilos.requerido}>*</span></label>
                                                        <input
                                                            type="text"
                                                            value={referencia}
                                                            onChange={e => setReferencia(e.target.value)}
                                                            placeholder={tr("Número de transferencia / cheque", "Transfer / check number")}
                                                            className={estilos.input}
                                                        />
                                                    </div>
                                                )}

                                                <div className={estilos.formGrupo}>
                                                    <label>{tr("Notas (opcional)", "Notes (optional)")}</label>
                                                    <input
                                                        type="text"
                                                        value={notasPago}
                                                        onChange={e => setNotasPago(e.target.value)}
                                                        placeholder={tr("Observaciones del pago", "Payment notes")}
                                                        className={estilos.input}
                                                    />
                                                </div>
                                            </div>

                                            {errorPago && (
                                                <div className={estilos.errorPago}>
                                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                                    {errorPago}
                                                </div>
                                            )}

                                            <div className={estilos.formAcciones}>
                                                <button
                                                    type="button"
                                                    className={estilos.btnCancelarPago}
                                                    onClick={() => setCxCSeleccionada(null)}
                                                    disabled={procesando}
                                                >
                                                    {tr("Cancelar", "Cancel")}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={estilos.btnPagarTodo}
                                                    onClick={() => setMonto(cxc.saldoPendiente.toFixed(2))}
                                                    disabled={procesando}
                                                >
                                                    {tr("Pagar Todo", "Pay All")}
                                                </button>
                                                <button
                                                    type="submit"
                                                    className={estilos.btnConfirmar}
                                                    disabled={procesando}
                                                >
                                                    {procesando
                                                        ? <><div className={estilos.spinnerBtn}></div> {tr("Procesando...", "Processing...")}</>
                                                        : <><ion-icon name="checkmark-circle-outline"></ion-icon> {tr("Registrar Pago", "Record Payment")}</>
                                                    }
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== TAB HISTORIAL ===== */}
            {tabActiva === "historial" && (
                <div className={estilos.tabContenido}>
                    {cargandoHistorial ? (
                        <div className={estilos.cargandoTab}>
                            <div className={estilos.spinner}></div>
                            <span>{tr("Cargando historial...", "Loading history...")}</span>
                        </div>
                    ) : basePath === '/financiamiento' ? (
                        historialFin.length === 0 ? (
                            <div className={`${estilos.sinDeuda} ${estilos[tema]}`}>
                                <ion-icon name="receipt-outline"></ion-icon>
                                <h3>{tr("Sin pagos registrados", "No payments recorded")}</h3>
                                <p>{tr("No hay pagos de préstamos en el historial.", "No loan payments in history.")}</p>
                            </div>
                        ) : (
                            <div className={`${contrato.pagosLista} ${contrato[tema]}`}>
                                {historialFin.map(p => (
                                    <div key={p.id} className={contrato.pagoCard}>
                                        <div className={contrato.pagoHeader}>
                                            <div className={contrato.pagoIcono}>
                                                <ion-icon name="checkmark-circle"></ion-icon>
                                            </div>
                                            <div className={contrato.pagoInfo}>
                                                <strong>{p.contrato_numero}</strong>
                                                <p>{fmtFecha(p.fecha)}{p.registrado_por ? ` · ${p.registrado_por}` : ''}</p>
                                            </div>
                                            <div className={contrato.pagoMonto}>{fmtMoneda(p.monto)}</div>
                                        </div>
                                        <div className={contrato.pagoDetalle}>
                                            <div className={contrato.pagoDesglose}>
                                                {p.monto_capital > 0 && <span>{tr('Capital:', 'Capital:')} {fmtMoneda(p.monto_capital)}</span>}
                                                {p.monto_interes > 0 && <span>{tr('Interés:', 'Interest:')} {fmtMoneda(p.monto_interes)}</span>}
                                                {p.monto_mora > 0 && <span style={{color:'#ef4444'}}>{tr('Mora:', 'Late Fee:')} {fmtMoneda(p.monto_mora)}</span>}
                                                {p.referencia && <span>{tr('Ref:', 'Ref:')} {p.referencia}</span>}
                                            </div>
                                            <button className={estilos.btnVerRecibo}
                                                onClick={() => router.push(`/financiamiento/contratos/ver/${p.contrato_id}`)}
                                                title={tr('Ver préstamo', 'View loan')}>
                                                <ion-icon name="eye-outline"></ion-icon>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : historial.length === 0 ? (
                        <div className={`${estilos.sinDeuda} ${estilos[tema]}`}>
                            <ion-icon name="receipt-outline"></ion-icon>
                            <h3>{tr("Sin pagos registrados", "No payments recorded")}</h3>
                            <p>{tr("No hay abonos en el historial de este cliente.", "There are no payments in this customer's history.")}</p>
                        </div>
                    ) : (
                        <div className={estilos.listaHistorial}>
                            {historial.map(a => (
                                <div key={a.id} className={`${estilos.historialItem} ${estilos[tema]}`}>
                                    <div className={estilos.histIcono}>
                                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.histInfo}>
                                        <div className={estilos.histTop}>
                                            <span className={estilos.histDoc}>{a.ncf || a.numeroDocumento}</span>
                                            <span className={estilos.histMonto}>{fmtMoneda(a.montoAbonado)}</span>
                                        </div>
                                        <div className={estilos.histDatos}>
                                            <span>{fmtFecha(a.fechaAbono)}</span>
                                            <span style={{ textTransform: "capitalize" }}>{metodoPagoLabel(a.metodoPago)}</span>
                                            {a.referenciaPago && <span>{tr("Ref:", "Ref:")} {a.referenciaPago}</span>}
                                            {a.esPagoTardio && <span className={estilos.pagoTardio}>{tr("Pago tardío", "Late payment")}</span>}
                                        </div>
                                        <div className={estilos.histPor}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            {a.registradoPor}
                                        </div>
                                    </div>
                                    <button
                                        className={estilos.btnVerRecibo}
                                        onClick={() => router.push(`/admin/cobros/imprimir/` + a.id)}
                                        title={tr("Ver recibo", "View receipt")}
                                    >
                                        <ion-icon name="print-outline"></ion-icon>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== MODAL PAGO CUOTA FINANCIAMIENTO ===== */}
            {mostrarModalCuota && cuotaSeleccionadaFin && (() => {
                const isDark = tema === 'dark'
                const bg = isDark ? '#0f172a' : '#ffffff'
                const bgCard = isDark ? '#1e293b' : '#f8fafc'
                const border = isDark ? '#334155' : '#e2e8f0'
                const text = isDark ? '#f1f5f9' : '#0f172a'
                const textMuted = isDark ? '#94a3b8' : '#64748b'
                const inputBg = isDark ? '#1e293b' : '#ffffff'
                const inputStyle = { width:'100%', padding:'10px 12px', border:`1px solid ${border}`, borderRadius:'8px', fontSize:'14px', background:inputBg, color:text, outline:'none', boxSizing:'border-box' }
                const labelStyle = { display:'block', fontSize:'12px', fontWeight:600, color:textMuted, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }
                const groupStyle = { marginBottom:'14px' }
                return (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}
                    onClick={() => { setMostrarModalCuota(false); setErrorCuota('') }}>
                    <div style={{ background:bg, borderRadius:'16px', width:'100%', maxWidth:'460px', maxHeight:'90vh', overflow:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.4)', animation:'slideUp .25s ease' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid ${border}` }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                <div style={{ width:'36px', height:'36px', background:'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'18px' }}>
                                    <ion-icon name="cash-outline"></ion-icon>
                                </div>
                                <div>
                                    <div style={{ fontWeight:700, fontSize:'16px', color:text }}>{tr('Registrar Pago', 'Register Payment')}</div>
                                    <div style={{ fontSize:'12px', color:textMuted }}>{cuotaSeleccionadaFin.contrato_numero} · Cuota #{cuotaSeleccionadaFin.numero}</div>
                                </div>
                            </div>
                            <button onClick={() => { setMostrarModalCuota(false); setErrorCuota('') }}
                                style={{ background:'none', border:'none', cursor:'pointer', color:textMuted, fontSize:'22px', lineHeight:1, padding:'4px', borderRadius:'6px' }}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        {/* Resumen */}
                        <div style={{ display:'grid', gridTemplateColumns: parseFloat(cuotaSeleccionadaFin.mora||0)>0 ? '1fr 1fr 1fr' : '1fr 1fr', gap:'1px', background:border, margin:'0', borderBottom:`1px solid ${border}` }}>
                            {[
                                { label: tr('Cuota','Installment'), value: fmtMoneda(cuotaSeleccionadaFin.monto), color: text },
                                ...(parseFloat(cuotaSeleccionadaFin.mora||0)>0 ? [{ label: tr('Mora','Late Fee'), value: fmtMoneda(cuotaSeleccionadaFin.mora), color:'#ef4444' }] : []),
                                { label: tr('Total a Pagar','Total Due'), value: fmtMoneda(parseFloat(cuotaSeleccionadaFin.monto)+parseFloat(cuotaSeleccionadaFin.mora||0)), color:'#3b82f6', bold:true }
                            ].map((item,i) => (
                                <div key={i} style={{ background:bgCard, padding:'14px 16px', textAlign:'center' }}>
                                    <div style={{ fontSize:'11px', color:textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>{item.label}</div>
                                    <div style={{ fontSize: item.bold ? '20px' : '17px', fontWeight:700, color:item.color }}>{item.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Form */}
                        <div style={{ padding:'20px 24px' }}>
                            <div style={groupStyle}>
                                <label style={labelStyle}>{tr('Monto a Pagar','Amount to Pay')} <span style={{color:'#ef4444'}}>*</span></label>
                                <div style={{ position:'relative' }}>
                                    <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:textMuted, fontWeight:600, fontSize:'13px' }}>{simboloMoneda}</span>
                                    <input type="number" step="0.01" min="0.01" value={montoCuotaPago}
                                        onChange={e => setMontoCuotaPago(e.target.value)}
                                        style={{ ...inputStyle, paddingLeft:'46px', fontSize:'16px', fontWeight:600 }} required />
                                </div>
                            </div>

                            <div style={groupStyle}>
                                <label style={labelStyle}>{tr('Método de Pago','Payment Method')} <span style={{color:'#ef4444'}}>*</span></label>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                                    {[
                                        {v:'efectivo', label:tr('Efectivo','Cash'), icon:'cash-outline'},
                                        {v:'tarjeta_debito', label:tr('Débito','Debit'), icon:'card-outline'},
                                        {v:'tarjeta_credito', label:tr('Crédito','Credit'), icon:'card-outline'},
                                        {v:'transferencia', label:tr('Transfer.','Transfer'), icon:'swap-horizontal-outline'},
                                        {v:'cheque', label:tr('Cheque','Check'), icon:'receipt-outline'},
                                    ].map(m => (
                                        <button key={m.v} type="button" onClick={() => setMetodoCuotaPago(m.v)}
                                            style={{ padding:'8px 4px', border:`2px solid ${metodoCuotaPago===m.v?'#3b82f6':border}`, borderRadius:'8px', background: metodoCuotaPago===m.v ? (isDark?'#1d3461':'#eff6ff') : bgCard, color: metodoCuotaPago===m.v ? '#3b82f6' : textMuted, cursor:'pointer', fontSize:'11px', fontWeight:600, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', transition:'all .15s' }}>
                                            <ion-icon name={m.icon} style={{fontSize:'16px'}}></ion-icon>
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={groupStyle}>
                                <label style={labelStyle}>{tr('Fecha de Pago','Payment Date')} <span style={{color:'#ef4444'}}>*</span></label>
                                <input type="date" value={fechaCuotaPago} onChange={e => setFechaCuotaPago(e.target.value)} style={inputStyle} required />
                            </div>

                            {(metodoCuotaPago==='transferencia'||metodoCuotaPago==='cheque') && (
                                <div style={groupStyle}>
                                    <label style={labelStyle}>{tr('Referencia','Reference')}</label>
                                    <input type="text" value={referenciaCuotaPago} onChange={e => setReferenciaCuotaPago(e.target.value)}
                                        placeholder={tr('Número de transferencia / cheque','Transfer / check number')} style={inputStyle} />
                                </div>
                            )}

                            <div style={groupStyle}>
                                <label style={labelStyle}>{tr('Notas','Notes')}</label>
                                <input type="text" value={notasCuotaPago} onChange={e => setNotasCuotaPago(e.target.value)}
                                    placeholder={tr('Observaciones del pago','Payment notes')} style={inputStyle} />
                            </div>

                            {errorCuota && (
                                <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid #ef444455', borderRadius:'8px', padding:'10px 14px', color:'#ef4444', fontSize:'13px', display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                                    <ion-icon name="alert-circle-outline"></ion-icon> {errorCuota}
                                </div>
                            )}

                            <div style={{ display:'flex', gap:'10px', marginTop:'4px' }}>
                                <button onClick={() => { setMostrarModalCuota(false); setErrorCuota('') }} disabled={procesandoCuota}
                                    style={{ flex:1, padding:'12px', border:`1px solid ${border}`, borderRadius:'10px', background:'transparent', color:textMuted, cursor:'pointer', fontWeight:600, fontSize:'14px' }}>
                                    {tr('Cancelar','Cancel')}
                                </button>
                                <button disabled={procesandoCuota} onClick={async () => {
                                    if (!montoCuotaPago || parseFloat(montoCuotaPago) <= 0) { setErrorCuota(tr('Ingresa un monto válido','Enter a valid amount')); return }
                                    setProcesandoCuota(true); setErrorCuota('')
                                    try {
                                        const r = await registrarPagoCuota(cuotaSeleccionadaFin.id, { monto:parseFloat(montoCuotaPago), fecha:fechaCuotaPago, referencia:referenciaCuotaPago||null, notas:notasCuotaPago||null })
                                        if (r.success) { setMostrarModalCuota(false); setCuotaSeleccionadaFin(null); await cargarCxC(); await cargarDatos() }
                                        else setErrorCuota(r.mensaje || tr('Error al registrar pago','Error registering payment'))
                                    } catch { setErrorCuota(tr('Error inesperado','Unexpected error')) }
                                    finally { setProcesandoCuota(false) }
                                }}
                                    style={{ flex:2, padding:'12px', border:'none', borderRadius:'10px', background: procesandoCuota ? '#94a3b8' : 'linear-gradient(135deg,#3b82f6,#6366f1)', color:'#fff', cursor: procesandoCuota ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 14px rgba(59,130,246,0.4)' }}>
                                    {procesandoCuota
                                        ? <><div style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.6s linear infinite' }}></div> {tr('Procesando...','Processing...')}</>
                                        : <><ion-icon name="checkmark-circle-outline"></ion-icon> {tr('Confirmar Pago','Confirm Payment')}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                )
            })()}
        </div>
    )
}
