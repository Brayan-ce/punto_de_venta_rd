"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { obtenerDatosAbonoParaImprimir } from "@/_Pages/admin/clientes/Cobrar/servidor"
import { obtenerDatosEmpresa } from "../servidor"
import estilos from "./imprimir.module.css"
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

import {
    conectarQZTray,
    obtenerImpresoras,
    imprimirTextoRaw,
    buscarImpresoraTermica
} from "@/utils/qzTrayService"

export default function ImprimirCobro({ abonoId }) {
    const router = useRouter()

    const [tema, setTema] = useState("light")
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    const [datos, setDatos] = useState(null)

    const [tamañoPapel, setTamañoPapel] = useState("80mm")
    const [impresoras, setImpresoras] = useState([])
    const [impresoraSeleccionada, setImpresoraSeleccionada] = useState("")
    const [qzDisponible, setQzDisponible] = useState(false)
    const [imprimiendo, setImprimiendo] = useState(false)

    const [empresaConfig, setEmpresaConfig] = useState(null)
    const [opciones, setOpciones] = useState({
        mostrarDatosEmpresa:  true,
        mostrarDatosCliente:  true,
        mostrarMetodoPago:    true,
        mostrarReferencia:    true,
        mostrarSaldo:         true,
        mostrarMensajeFinal:  true,
    })

    const boucherRef = useRef(null)

    useEffect(() => {
        const t = localStorage.getItem("tema") || "light"
        setTema(t)
        const tam = localStorage.getItem("tamañoPapelImpresion")
        if (tam) setTamañoPapel(tam)
        const cambioTema = () => setTema(localStorage.getItem("tema") || "light")
        window.addEventListener("temaChange", cambioTema)
        return () => window.removeEventListener("temaChange", cambioTema)
    }, [])

    useEffect(() => {
        cargarDatos()
        cargarEmpresa()
        inicializarQZ()
    }, [abonoId])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresaConfig(res.empresa)
    }

    useEffect(() => {
        localStorage.setItem("tamañoPapelImpresion", tamañoPapel)
    }, [tamañoPapel])

    const inicializarQZ = async () => {
        try {
            const ok = await conectarQZTray()
            if (ok) {
                setQzDisponible(true)
                const lista = await obtenerImpresoras()
                setImpresoras(lista || [])
                const term = buscarImpresoraTermica(lista || [])
                if (term) setImpresoraSeleccionada(term)
            }
        } catch { /* QZ no disponible */ }
    }

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const r = await obtenerDatosAbonoParaImprimir(abonoId)
            if (r.success) setDatos(r)
            else setError(r.mensaje)
        } catch {
            setError("Error al cargar el recibo")
        } finally {
            setCargando(false)
        }
    }

    const toggleOpcion = (k) =>
        setOpciones(p => ({ ...p, [k]: !p[k] }))

    const localeEmpresa = empresaConfig?.locale || "es-DO"
    const monedaEmpresa = empresaConfig?.moneda || "DOP"
    const fmtMoneda = (v) =>
        new Intl.NumberFormat(localeEmpresa, { style: "currency", currency: monedaEmpresa }).format(v || 0)

    const fmtFecha = (f) => {
        if (!f) return "—"
        return new Date(f).toLocaleDateString(localeEmpresa, {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        })
    }

    const fmtMetodo = (m) => {
        const map = {
            efectivo: "Efectivo",
            tarjeta_debito: "Tarjeta Débito",
            tarjeta_credito: "Tarjeta Crédito",
            transferencia: "Transferencia",
            cheque: "Cheque",
            mixto: "Pago Mixto"
        }
        return map[m] || m
    }

    const esMobile = () =>
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768

    const capturarImagen = async () => {
        if (!boucherRef.current) return null
        const html2canvas = (await import("html2canvas")).default
        const canvas = await html2canvas(boucherRef.current, {
            scale: 3, backgroundColor: "#ffffff", useCORS: true
        })
        return canvas
    }

    const manejarImprimirNavegador = async () => {
        try {
            const canvas = await capturarImagen()
            if (!canvas) return
            const dataUrl = canvas.toDataURL("image/png")
            const win = window.open("", "_blank")
            if (!win) return
            win.document.write(`<!DOCTYPE html><html><head><title>Recibo</title>
            <style>*{margin:0;padding:0} body{background:#fff}
            img{display:block;width:100%;max-width:${tamañoPapel === 'A4' ? '210mm' : tamañoPapel};margin:auto}
            @media print{@page{margin:0}}</style></head>
            <body><img src="${dataUrl}" onload="window.print();window.close()"/></body></html>`)
            win.document.close()
        } catch (e) {
            console.error("Error al imprimir:", e)
        }
    }

    const generarTextoEsc = () => {
        if (!datos) return ""
        const { abono, cxc, cliente, empresa, usuarioNombre } = datos
        const L = (txt) => txt + "\n"
        const sep = "—".repeat(32) + "\n"
        let txt = ""
        if (opciones.mostrarDatosEmpresa) {
            txt += L(`\x1B\x61\x01\x1B\x45\x01${empresa.nombreEmpresa}\x1B\x45\x00`)
            if (empresa.rnc) txt += L(`RNC: ${empresa.rnc}`)
            if (empresa.direccion) txt += L(empresa.direccion)
            if (empresa.telefono) txt += L(`Tel: ${empresa.telefono}`)
            txt += sep
        }
        txt += L("\x1B\x61\x01\x1B\x45\x01RECIBO DE COBRO\x1B\x45\x00")
        txt += L(`\x1B\x61\x00Abono No. ${abono.id}`)
        txt += L(`Factura: ${cxc.ncf || cxc.numeroDocumento}`)
        txt += sep
        txt += L(`Fecha: ${fmtFecha(abono.fechaAbono)}`)
        if (opciones.mostrarDatosCliente) {
            txt += L(`Cliente: ${cliente.nombreCompleto}`)
            if (cliente.documento) txt += L(`Cedula: ${cliente.documento}`)
            if (cliente.telefono) txt += L(`Tel: ${cliente.telefono}`)
        }
        if (usuarioNombre) txt += L(`Recibido por: ${usuarioNombre}`)
        txt += sep
        txt += L("\x1B\x45\x01MONTO RECIBIDO:\x1B\x45\x00")
        txt += L(fmtMoneda(abono.montoAbonado))
        txt += sep
        if (opciones.mostrarMetodoPago) {
            txt += L(`Metodo: ${fmtMetodo(abono.metodoPago)}`)
        }
        if (opciones.mostrarReferencia && abono.referenciaPago) {
            txt += L(`Referencia: ${abono.referenciaPago}`)
        }
        if (opciones.mostrarSaldo) {
            txt += sep
            txt += L(`Total factura: ${fmtMoneda(cxc.montoTotal)}`)
            txt += L(`Total pagado:  ${fmtMoneda(cxc.montoPagado)}`)
            txt += L(`Saldo pendiente: ${fmtMoneda(cxc.saldoPendiente)}`)
        }
        if (opciones.mostrarMensajeFinal) {
            txt += sep
            if (empresa.mensajeFactura) txt += L(empresa.mensajeFactura)
            txt += L("\x1B\x61\x01¡GRACIAS POR SU PAGO!\x1B\x61\x00")
        }
        txt += "\n\n\n\x1D\x56\x00"
        return txt
    }

    const manejarImprimirTermica = async () => {
        if (!qzDisponible || !impresoraSeleccionada) return
        setImprimiendo(true)
        try {
            await imprimirTextoRaw(impresoraSeleccionada, generarTextoEsc())
        } catch (e) {
            alert("Error al imprimir: " + e.message)
        } finally {
            setImprimiendo(false)
        }
    }

    const compartirRawBT = async () => {
        const texto = generarTextoEsc()
        const blob = new Blob([texto], { type: "text/plain" })
        const file = new File([blob], "recibo.txt", { type: "text/plain" })
        if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "Recibo de Cobro" })
        } else {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url; a.download = "recibo.txt"; a.click()
            URL.revokeObjectURL(url)
        }
    }

    const compartirWhatsApp = async () => {
        if (!datos) return
        const { abono, cxc, cliente, empresa } = datos
        const tel = (cliente.telefono || "").replace(/\D/g, "")
        const num = tel.length >= 10 ? (tel.startsWith("1") && tel.length >= 11 ? tel : "1" + tel) : ""
        const txt = `*${empresa.nombreEmpresa}*\nRecibo de Cobro #${abono.id}\n\nCliente: ${cliente.nombreCompleto}\nFactura: ${cxc.ncf || cxc.numeroDocumento}\nMonto: ${fmtMoneda(abono.montoAbonado)}\nMétodo: ${fmtMetodo(abono.metodoPago)}\nSaldo restante: ${fmtMoneda(cxc.saldoPendiente)}\n\n¡Gracias por su pago!`

        if (num && esMobile()) {
            window.open(`https://wa.me/${num}?text=${encodeURIComponent(txt)}`, "_blank")
        } else {
            try {
                const canvas = await capturarImagen()
                if (canvas) {
                    canvas.toBlob(async (blob) => {
                        const file = new File([blob], "recibo.png", { type: "image/png" })
                        if (navigator.canShare?.({ files: [file] })) {
                            await navigator.share({ files: [file], text: txt })
                        } else {
                            const a = document.createElement("a")
                            a.href = URL.createObjectURL(blob)
                            a.download = `recibo-cobro-${abono.id}.png`
                            a.click()
                            if (num) window.open(`https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(txt)}`, "_blank")
                            else window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(txt)}`, "_blank")
                        }
                    })
                }
            } catch { window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank") }
        }
    }

    if (cargando) {
        return <LoadingScreen />
    }

    if (error || !datos) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.errorBox}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h3>{error || "No se encontró el recibo"}</h3>
                    <button onClick={() => router.back()} className={estilos.btnVolver}>
                        <ion-icon name="arrow-back-outline"></ion-icon> Volver
                    </button>
                </div>
            </div>
        )
    }

    const { abono, cxc, cliente, empresa, usuarioNombre } = datos
    const esAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* CONTROLES */}
            <div className={`${estilos.controles} ${estilos[tema]}`}>
                <div className={estilos.selectores}>
                    <h3>Tamaño de Papel</h3>
                    <div className={estilos.botonesTabaño}>
                        {["58mm", "80mm", "A4"].map(t => (
                            <button
                                key={t}
                                className={`${estilos.btnTamaño} ${tamañoPapel === t ? estilos.activo : ""}`}
                                onClick={() => setTamañoPapel(t)}
                            >{t}</button>
                        ))}
                    </div>
                </div>

                {qzDisponible && impresoras.length > 0 && (
                    <div className={estilos.selectores}>
                        <h3>Impresora</h3>
                        <select
                            value={impresoraSeleccionada}
                            onChange={e => setImpresoraSeleccionada(e.target.value)}
                            className={`${estilos.selectImpresora} ${estilos[tema]}`}
                        >
                            {impresoras.map((imp, i) => (
                                <option key={i} value={imp}>{imp}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className={estilos.botonesAccion}>
                    {qzDisponible && (
                        <button onClick={manejarImprimirTermica} className={estilos.btnImprimir} disabled={imprimiendo}>
                            <ion-icon name="print-outline"></ion-icon>
                            <span>{imprimiendo ? "Imprimiendo..." : "Impresora Térmica"}</span>
                        </button>
                    )}
                    {esAndroid && (
                        <button onClick={compartirRawBT} className={estilos.btnRawBT}>
                            <ion-icon name="bluetooth-outline"></ion-icon>
                            <span>RawBT</span>
                        </button>
                    )}
                    <button onClick={manejarImprimirNavegador} className={estilos.btnImprimirNav}>
                        <ion-icon name="print-outline"></ion-icon>
                        <span>Imprimir</span>
                    </button>
                    <button onClick={compartirWhatsApp} className={estilos.btnWhatsApp}>
                        <ion-icon name="logo-whatsapp"></ion-icon>
                        <span>WhatsApp</span>
                    </button>
                    <button
                        onClick={() => router.push(`/admin/clientes/ver/${cliente.id}?tab=historial`)}
                        className={estilos.btnCerrar}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
                    </button>
                </div>
            </div>

            <div className={estilos.vistaPrevia}>

                {/* OPCIONES */}
                <div className={`${estilos.panelOpciones} ${estilos[tema]}`}>
                    <h3>Mostrar en Recibo</h3>
                    <div className={estilos.listaOpciones}>
                        {[
                            { key: "mostrarDatosEmpresa", label: "Datos Empresa" },
                            { key: "mostrarDatosCliente", label: "Datos Cliente" },
                            { key: "mostrarMetodoPago",   label: "Método de Pago" },
                            { key: "mostrarReferencia",   label: "Referencia" },
                            { key: "mostrarSaldo",        label: "Saldo Factura" },
                            { key: "mostrarMensajeFinal", label: "Mensaje Final" },
                        ].map(({ key, label }) => (
                            <label key={key} className={estilos.opcionLabel}>
                                <span>{label}</span>
                                <button
                                    className={`${estilos.switch} ${opciones[key] ? estilos.activo : ""}`}
                                    onClick={() => toggleOpcion(key)}
                                >
                                    <span className={estilos.switchSlider}></span>
                                </button>
                            </label>
                        ))}
                    </div>
                </div>

                {/* BOUCHER */}
                <div ref={boucherRef} className={`${estilos.boucher} ${estilos[tamañoPapel]}`} data-size={tamañoPapel}>

                    {opciones.mostrarDatosEmpresa && (
                        <>
                            <div className={estilos.encabezado}>
                                <h1>{empresa.nombreEmpresa}</h1>
                                {empresa.razonSocial && empresa.razonSocial !== empresa.nombreEmpresa &&
                                    <p>{empresa.razonSocial}</p>}
                                {empresa.rnc && <p>RNC: {empresa.rnc}</p>}
                                {empresa.direccion && <p>{empresa.direccion}</p>}
                                {empresa.telefono && <p>Tel: {empresa.telefono}</p>}
                            </div>
                            <div className={estilos.linea}></div>
                        </>
                    )}

                    <div className={estilos.comprobante}>
                        <p className={estilos.tipoDoc}>RECIBO DE COBRO</p>
                        <p className={estilos.reciboNo}>Abono No. {abono.id}</p>
                        <p>Factura: <strong>{cxc.ncf || cxc.numeroDocumento}</strong></p>
                        {cxc.numeroInterno && <p>Venta: <strong>{cxc.numeroInterno}</strong></p>}
                    </div>

                    <div className={estilos.linea}></div>

                    <div className={estilos.info}>
                        <p><strong>Fecha:</strong> {fmtFecha(abono.fechaAbono)}</p>
                        {opciones.mostrarDatosCliente && (
                            <>
                                <p><strong>Cliente:</strong> {cliente.nombreCompleto}</p>
                                {cliente.documento && <p><strong>Cédula:</strong> {cliente.documento}</p>}
                                {cliente.telefono && <p><strong>Teléfono:</strong> {cliente.telefono}</p>}
                                {cliente.direccion && <p><strong>Dirección:</strong> {cliente.direccion}</p>}
                            </>
                        )}
                        {usuarioNombre && <p><strong>Recibido por:</strong> {usuarioNombre}</p>}
                    </div>

                    <div className={estilos.linea}></div>

                    <div className={estilos.totales}>
                        <div className={`${estilos.fila} ${estilos.total}`}>
                            <span>MONTO RECIBIDO:</span>
                            <span>{fmtMoneda(abono.montoAbonado)}</span>
                        </div>

                        {opciones.mostrarMetodoPago && (
                            <>
                                <div className={estilos.lineaSencilla}></div>
                                <div className={estilos.fila}>
                                    <span>Método de Pago:</span>
                                    <span>{fmtMetodo(abono.metodoPago)}</span>
                                </div>
                            </>
                        )}

                        {opciones.mostrarReferencia && abono.referenciaPago && (
                            <div className={estilos.fila}>
                                <span>Referencia:</span>
                                <span>{abono.referenciaPago}</span>
                            </div>
                        )}

                        {abono.esPagoTardio && abono.diasAtrasoAlPagar > 0 && (
                            <div className={estilos.fila} style={{ color: "#ef4444" }}>
                                <span>Días de atraso:</span>
                                <span>{abono.diasAtrasoAlPagar} días</span>
                            </div>
                        )}

                        {opciones.mostrarSaldo && (
                            <>
                                <div className={estilos.linea}></div>
                                <div className={estilos.fila}>
                                    <span>Total factura:</span>
                                    <span>{fmtMoneda(cxc.montoTotal)}</span>
                                </div>
                                <div className={estilos.fila}>
                                    <span>Total pagado:</span>
                                    <span>{fmtMoneda(cxc.montoPagado)}</span>
                                </div>
                                <div className={`${estilos.fila} ${cxc.saldoPendiente <= 0 ? estilos.saldoCero : ""}`}>
                                    <span>Saldo restante:</span>
                                    <span>{fmtMoneda(cxc.saldoPendiente)}</span>
                                </div>
                                {cxc.saldoPendiente <= 0 && (
                                    <div className={estilos.pagadaTotal}>
                                        ✓ FACTURA SALDADA
                                    </div>
                                )}
                            </>
                        )}

                        {abono.notas && (
                            <>
                                <div className={estilos.lineaSencilla}></div>
                                <div className={estilos.notas}>
                                    <p><strong>Nota:</strong> {abono.notas}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {opciones.mostrarMensajeFinal && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.footer}>
                                {empresa.mensajeFactura && (
                                    <p className={estilos.mensaje}>{empresa.mensajeFactura}</p>
                                )}
                                <p className={estilos.gracias}>¡GRACIAS POR SU PAGO!</p>
                                <p className={estilos.fecha}>{new Date().toLocaleDateString("es-DO")}</p>
                            </div>
                        </>
                    )}

                </div>
            </div>

        </div>
    )
}
