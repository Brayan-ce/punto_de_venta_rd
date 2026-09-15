"use client"
import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { obtenerDatosPagoParaImprimir } from '../servidor'
import estilos from './ModalImprimirPago.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ModalImprimirPago({ pagoId, tema, onClose }) {
    const [datos, setDatos]       = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError]       = useState(null)
    const ticketRef               = useRef(null)

    const [numWhatsapp, setNumWhatsapp]       = useState('')
    const [panelWhatsapp, setPanelWhatsapp]   = useState(false)

    useEffect(() => {
        let activo = true
        setCargando(true)
        obtenerDatosPagoParaImprimir(pagoId).then(r => {
            if (!activo) return
            if (r.success) setDatos(r)
            else setError(r.mensaje || 'Error al cargar datos')
            setCargando(false)
        })
        return () => { activo = false }
    }, [pagoId])

    const fmtMoneda = (v) => {
        const mon = datos?.empresa?.moneda || 'DOP'
        const loc = datos?.empresa?.locale || 'es-DO'
        return new Intl.NumberFormat(loc, { style: 'currency', currency: mon, minimumFractionDigits: 2 }).format(v || 0)
    }
    const fmtFecha = (f) => {
        if (!f) return '—'
        const s = typeof f === 'string' ? f : String(f)
        const [y,m,d] = s.slice(0,10).split('-').map(Number)
        if (!y||!m||!d) return '—'
        return new Date(y,m-1,d).toLocaleDateString('es-DO',{day:'2-digit',month:'short',year:'numeric'})
    }
    const fmtFechaHora = (f) => {
        if (!f) return '—'
        try {
            const dt = new Date(f)
            return dt.toLocaleString('es-DO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
        } catch { return String(f) }
    }

    const handleImprimir = async () => {
        try {
            const blob = await capturarTicketComoImagen()
            const url = URL.createObjectURL(blob)
            const win = window.open('', '_blank')
            win.document.write(`<!DOCTYPE html><html><head><title>Recibo de Pago</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{display:flex;justify-content:center;background:#fff;}img{max-width:100%;}@media print{body{margin:0;}}</style></head><body><img src="${url}" onload="setTimeout(()=>{window.print();},300)"/></body></html>`)
            win.document.close()
        } catch (err) {
            console.error('Error al imprimir:', err)
            alert('No se pudo preparar el ticket para imprimir')
        }
    }

    const generarTexto = () => {
        if (!datos) return ''
        const { pago, cuotasAplicadas, empresa, contrato } = datos
        const sep = '='.repeat(32)
        const lin = '-'.repeat(32)
        let t = ''
        t += `${empresa.nombre_empresa}\n`
        t += `RNC: ${empresa.rnc}\n`
        t += `${empresa.direccion || ''}\n`
        t += `${empresa.telefono ? 'Tel: '+empresa.telefono : ''}\n`
        t += `${sep}\n`
        t += `RECIBO DE PAGO\n`
        t += `${sep}\n`
        t += `Contrato: ${pago.contrato_numero}\n`
        t += `Cliente:  ${pago.cliente_nombre}\n`
        if (pago.cliente_documento) t += `Cedula:   ${pago.cliente_documento}\n`
        t += `Fecha:    ${fmtFechaHora(pago.fecha)}\n`
        t += `Cobrado:  ${pago.usuario_nombre || '—'}\n`
        t += `${lin}\n`
        if (cuotasAplicadas?.length) {
            t += `CUOTAS APLICADAS:\n`
            cuotasAplicadas.forEach(c => {
                t += `  #${c.numero} ${fmtFecha(c.fecha_vencimiento)} ${c.estado.toUpperCase()} ${fmtMoneda(c.aplicado)}\n`
            })
            t += `${lin}\n`
        }
        t += `Capital:  ${fmtMoneda(pago.monto_capital)}\n`
        t += `Interes:  ${fmtMoneda(pago.monto_interes)}\n`
        if (parseFloat(pago.monto_mora) > 0) t += `Mora:     ${fmtMoneda(pago.monto_mora)}\n`
        t += `${sep}\n`
        t += `TOTAL PAGADO: ${fmtMoneda(pago.monto)}\n`
        t += `${sep}\n`
        t += `Metodo: ${pago.metodo_pago_nombre || '—'}\n`
        if (pago.referencia) t += `Ref: ${pago.referencia}\n`
        if (contrato) t += `Cuotas restantes: ${contrato.cuotas_restantes}\nSaldo: ${fmtMoneda(contrato.saldo_pendiente)}\n`
        t += `${sep}\n`
        t += `GRACIAS POR SU PAGO\n`
        if (empresa.mensaje_factura) t += `${empresa.mensaje_factura}\n`
        return t
    }

    const capturarTicketComoImagen = async () => {
        if (!ticketRef.current) throw new Error('No se encontró el ticket')
        const canvas = await html2canvas(ticketRef.current, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
            width: ticketRef.current.scrollWidth,
            height: ticketRef.current.scrollHeight
        })
        return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png', 0.95))
    }

    const esMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768

    const compartirWhatsapp = async () => {
        const num = numWhatsapp.replace(/\D/g, '')
        if (num.length < 8) { alert('Ingresa un numero valido'); return }

        try {
            const blob = await capturarTicketComoImagen()

            if (esMobile()) {
                const file = new File([blob], 'recibo_pago.png', { type: 'image/png' })
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Recibo de Pago' })
                    setPanelWhatsapp(false)
                    return
                }
            }

            const texto = generarTexto()
            const urlWa = `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
            window.open(urlWa, '_blank')

            const imgUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = imgUrl
            link.download = `recibo_${datos?.pago?.contrato_numero || 'pago'}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setTimeout(() => URL.revokeObjectURL(imgUrl), 100)

            setTimeout(() => alert('WhatsApp abierto con el texto.\nImagen descargada — adjuntala en la conversacion.'), 500)
            setPanelWhatsapp(false)
        } catch (err) {
            if (err.name === 'AbortError') return
            const texto = generarTexto()
            const urlWa = `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
            window.open(urlWa, '_blank')
            setPanelWhatsapp(false)
        }
    }

    const compartirRawBT = async () => {
        const texto = generarTexto()
        const esAndroid = /Android/i.test(navigator.userAgent)
        if (esAndroid) {
            try {
                const blob = new Blob([texto], { type: 'text/plain' })
                const file = new File([blob], 'recibo.txt', { type: 'text/plain' })
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Imprimir con RawBT' })
                    return
                }
                if (navigator.share) {
                    await navigator.share({ text: texto, title: 'Imprimir con RawBT' })
                    return
                }
            } catch (err) {
                if (err.name === 'AbortError') return
            }
        }
        if (navigator.clipboard) {
            navigator.clipboard.writeText(texto).then(() => alert('Texto copiado. Abre RawBT y pega el texto.'))
        }
    }

    const copiarTexto = () => {
        const txt = generarTexto()
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => alert('Texto copiado'))
        else {
            const ta = document.createElement('textarea')
            ta.value = txt
            document.body.appendChild(ta); ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
            alert('Texto copiado')
        }
    }

    if (!pagoId) return null

    return (
        <>
            <div>
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3 className={estilos.titulo}>
                                <ion-icon name="print-outline"></ion-icon>
                                Ticket de pago
                            </h3>
                            <button className={estilos.btnCerrar} onClick={onClose}><ion-icon name="close-outline"></ion-icon></button>
                        </div>

                        {cargando ? <LoadingScreen /> : error ? (
                            <div className={estilos.errorBox}><ion-icon name="alert-circle-outline"></ion-icon><span>{error}</span></div>
                        ) : datos ? (
                            <>
                                <div className={estilos.ticketWrap}>
                                    <div ref={ticketRef} className={estilos.ticket}>
                                        <div className={estilos.ticketHeader}>
                                            <strong>{datos.empresa.nombre_empresa}</strong>
                                            <span>RNC: {datos.empresa.rnc}</span>
                                            {datos.empresa.direccion && <span>{datos.empresa.direccion}</span>}
                                            {datos.empresa.telefono && <span>Tel: {datos.empresa.telefono}</span>}
                                        </div>

                                        <div className={estilos.sep}></div>
                                        <div className={estilos.ticketTitulo}>RECIBO DE PAGO</div>
                                        <div className={estilos.sep}></div>

                                        <div className={estilos.ticketInfo}>
                                            <div className={estilos.infoFila}><span>Contrato</span><span>{datos.pago.contrato_numero}</span></div>
                                            <div className={estilos.infoFila}><span>Cliente</span><span>{datos.pago.cliente_nombre}</span></div>
                                            {datos.pago.cliente_documento && <div className={estilos.infoFila}><span>Cedula</span><span>{datos.pago.cliente_documento}</span></div>}
                                            <div className={estilos.infoFila}><span>Fecha</span><span>{fmtFechaHora(datos.pago.fecha)}</span></div>
                                            <div className={estilos.infoFila}><span>Cobrado por</span><span>{datos.pago.usuario_nombre || '—'}</span></div>
                                            <div className={estilos.infoFila}><span>Metodo</span><span>{datos.pago.metodo_pago_nombre || '—'}</span></div>
                                            {datos.pago.referencia && <div className={estilos.infoFila}><span>Referencia</span><span>{datos.pago.referencia}</span></div>}
                                        </div>

                                        {datos.cuotasAplicadas?.length > 0 && (
                                            <>
                                                <div className={estilos.sepPunteado}></div>
                                                <div className={estilos.seccionTitulo}>CUOTAS APLICADAS</div>
                                                {datos.cuotasAplicadas.map((c, i) => (
                                                    <div key={i} className={estilos.cuotaFila}>
                                                        <span>Cuota #{c.numero}</span>
                                                        <span className={estilos.cuotaFecha}>{fmtFecha(c.fecha_vencimiento)}</span>
                                                        <span className={`${estilos.cuotaEstado} ${estilos[c.estado]}`}>{c.estado}</span>
                                                        <span className={estilos.cuotaMonto}>{fmtMoneda(c.aplicado)}</span>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        <div className={estilos.sepPunteado}></div>
                                        <div className={estilos.desglose}>
                                            <div className={estilos.infoFila}><span>Capital</span><span>{fmtMoneda(datos.pago.monto_capital)}</span></div>
                                            <div className={estilos.infoFila}><span>Interes</span><span>{fmtMoneda(datos.pago.monto_interes)}</span></div>
                                            {parseFloat(datos.pago.monto_mora) > 0 && (
                                                <div className={`${estilos.infoFila} ${estilos.filaRojo}`}><span>Mora</span><span>{fmtMoneda(datos.pago.monto_mora)}</span></div>
                                            )}
                                        </div>

                                        <div className={estilos.sep}></div>
                                        <div className={estilos.totalFila}>
                                            <span>TOTAL PAGADO</span>
                                            <span>{fmtMoneda(datos.pago.monto)}</span>
                                        </div>
                                        <div className={estilos.sep}></div>

                                        {datos.contrato && (
                                            <div className={estilos.restoInfo}>
                                                <div className={estilos.infoFila}><span>Cuotas restantes</span><span>{datos.contrato.cuotas_restantes}</span></div>
                                                <div className={estilos.infoFila}><span>Saldo pendiente</span><span>{fmtMoneda(datos.contrato.saldo_pendiente)}</span></div>
                                            </div>
                                        )}

                                        {datos.pago.notas && (
                                            <div className={estilos.notas}>
                                                <span>Notas: {datos.pago.notas}</span>
                                            </div>
                                        )}

                                        <div className={estilos.sepPunteado}></div>
                                        <div className={estilos.ticketFooter}>
                                            <strong>GRACIAS POR SU PAGO</strong>
                                            {datos.empresa.mensaje_factura && <span>{datos.empresa.mensaje_factura}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className={estilos.acciones}>
                                    <button className={estilos.btnImprimir} onClick={handleImprimir}>
                                        <ion-icon name="print-outline"></ion-icon>
                                        Imprimir
                                    </button>
                                    <button className={estilos.btnWhatsapp} onClick={() => setPanelWhatsapp(v => !v)}>
                                        <ion-icon name="logo-whatsapp"></ion-icon>
                                        WhatsApp
                                    </button>
                                    <button className={estilos.btnRawbt} onClick={compartirRawBT}>
                                        <ion-icon name="print-outline"></ion-icon>
                                        RawBT
                                    </button>
                                    <button className={estilos.btnCopiar} onClick={copiarTexto}>
                                        <ion-icon name="copy-outline"></ion-icon>
                                        Copiar texto
                                    </button>
                                    <button className={estilos.btnSecundario} onClick={onClose}>Cerrar</button>
                                </div>

                                {panelWhatsapp && (
                                    <div className={estilos.panelWhatsapp}>
                                        <input
                                            type="tel"
                                            className={estilos.inputTel}
                                            placeholder="Numero WhatsApp (ej: 18091234567)"
                                            value={numWhatsapp}
                                            onChange={e => setNumWhatsapp(e.target.value)}
                                            autoFocus
                                        />
                                        <button className={estilos.btnEnviarWa} onClick={compartirWhatsapp}>
                                            <ion-icon name="send-outline"></ion-icon>
                                            Enviar
                                        </button>
                                        {datos.pago.cliente_telefono && (
                                            <button className={estilos.btnAutoTel} onClick={() => setNumWhatsapp(datos.pago.cliente_telefono)}>
                                                Usar tel. del cliente: {datos.pago.cliente_telefono}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    )
}