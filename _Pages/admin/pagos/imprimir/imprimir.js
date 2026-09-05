"use client"
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/_Pages/admin/i18n'
import html2canvas from 'html2canvas'
import { obtenerDatosPagoParaImprimir } from '../servidor'
import estilos from './imprimir.module.css'
import {
    conectarQZTray,
    obtenerImpresoras,
    imprimirTextoRaw,
    buscarImpresoraTermica
} from '@/utils/qzTrayService'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ImprimirPago() {
    const params = useParams()
    const router = useRouter()
    const pagoId = params.id
    const { language } = useLanguage()
    const tr = (es, en) => language === 'en' ? en : es

    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [pago, setPago] = useState(null)
    const [cuotasAplicadas, setCuotasAplicadas] = useState([])
    const [contrato, setContrato] = useState(null)
    const [empresa, setEmpresa] = useState(null)
    const [error, setError] = useState(null)
    const [tamañoPapel, setTamañoPapel] = useState('80mm')
    const [impresoras, setImpresoras] = useState([])
    const [impresoraSeleccionada, setImpresoraSeleccionada] = useState('')
    const [qzDisponible, setQzDisponible] = useState(false)
    const [imprimiendo, setImprimiendo] = useState(false)
    const [mostrarModalWhatsApp, setMostrarModalWhatsApp] = useState(false)
    const [numeroWhatsApp, setNumeroWhatsApp] = useState('')
    const boucherRef = useRef(null)

    const [opciones, setOpciones] = useState({
        mostrarDatosEmpresa: true,
        mostrarDatosCliente: true,
        mostrarCasillasAplicadas: true,
        mostrarMetodoPago: true,
        mostrarNotas: true,
        mostrarSaldoRestante: true,
        mostrarMensajeFinal: true
    })

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const tamañoGuardado = localStorage.getItem('tamañoPapelImpresion')
        if (tamañoGuardado) setTamañoPapel(tamañoGuardado)

        const opcionesGuardadas = localStorage.getItem('opcionesImpresionPago')
        if (opcionesGuardadas) setOpciones(JSON.parse(opcionesGuardadas))

        const manejarCambioTema = () => {
            setTema(localStorage.getItem('tema') || 'light')
        }
        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)
        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        cargarDatosPago()
        inicializarQZTray()
    }, [pagoId])

    useEffect(() => {
        if (tamañoPapel) document.body.setAttribute('data-print-size', tamañoPapel)
    }, [tamañoPapel])

    const inicializarQZTray = async () => {
        try {
            await conectarQZTray()
            const listaImpresoras = await obtenerImpresoras()
            setImpresoras(listaImpresoras)
            const impresoraGuardada = localStorage.getItem('impresoraTermica')
            if (impresoraGuardada && listaImpresoras.includes(impresoraGuardada)) {
                setImpresoraSeleccionada(impresoraGuardada)
            } else {
                const termica = await buscarImpresoraTermica()
                if (termica) {
                    setImpresoraSeleccionada(termica)
                    localStorage.setItem('impresoraTermica', termica)
                } else if (listaImpresoras.length > 0) {
                    setImpresoraSeleccionada(listaImpresoras[0])
                }
            }
            setQzDisponible(true)
        } catch {
            setQzDisponible(false)
        }
    }

    const cargarDatosPago = async () => {
        try {
            const resultado = await obtenerDatosPagoParaImprimir(pagoId)
            if (resultado.success) {
                setPago(resultado.pago)
                setCuotasAplicadas(resultado.cuotasAplicadas || [])
                setContrato(resultado.contrato)
                setEmpresa(resultado.empresa)
            } else {
                setError(resultado.mensaje || 'Error al cargar el pago')
            }
        } catch (e) {
            setError('Error al cargar datos del pago')
        } finally {
            setCargando(false)
        }
    }

    const toggleOpcion = (opcion) => {
        const nuevas = { ...opciones, [opcion]: !opciones[opcion] }
        setOpciones(nuevas)
        localStorage.setItem('opcionesImpresionPago', JSON.stringify(nuevas))
    }

    const cambiarTamañoPapel = (tamaño) => {
        setTamañoPapel(tamaño)
        localStorage.setItem('tamañoPapelImpresion', tamaño)
    }

    const cambiarImpresora = (impresora) => {
        setImpresoraSeleccionada(impresora)
        localStorage.setItem('impresoraTermica', impresora)
    }

    const fmtFecha = (f) => {
        if (!f) return '—'
        const s = typeof f === 'string' ? f : f instanceof Date ? f.toISOString() : String(f)
        const [y, m, d] = s.slice(0, 10).split('-').map(Number)
        if (!y || !m || !d) return '—'
        const fecha = new Date(y, m - 1, d)
        return fecha.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const fmtMoneda = (v) => {
        const moneda = empresa?.moneda || 'DOP'
        const locale = empresa?.locale || 'es-DO'
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 2
        }).format(v || 0)
    }

    const esMobile = () =>
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768

    const capturarComprobanteComoImagen = async () => {
        if (!boucherRef.current) throw new Error('No se encontró el comprobante')
        const canvas = await html2canvas(boucherRef.current, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
            width: boucherRef.current.scrollWidth,
            height: boucherRef.current.scrollHeight
        })
        return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95))
    }

    const manejarImprimirNavegador = async () => {
        try {
            const blob = await capturarComprobanteComoImagen()
            const url = URL.createObjectURL(blob)
            const ventana = window.open(url, '_blank')
            if (ventana) {
                ventana.onload = () => {
                    ventana.print()
                    setTimeout(() => URL.revokeObjectURL(url), 60000)
                }
            }
        } catch (e) {
            window.print()
        }
    }

    const generarTextoRecibo = () => {
        if (!pago || !empresa) return ''
        let t = `*${empresa.nombre_empresa || empresa.razon_social}*\n\n`
        t += /adelantado/i.test(pago.notas || '') ? `RECIBO DE PAGO ADELANTADO\n` : `RECIBO DE PAGO\n`
        t += `No. ${pagoId}\n\n`
        t += `Fecha: ${fmtFecha(pago.fecha)}\n`
        t += `Contrato: ${pago.contrato_numero}\n`
        t += `Cliente: ${pago.cliente_nombre}\n`
        if (pago.cliente_documento) t += `Cedula: ${pago.cliente_documento}\n`
        t += `\n*CUOTAS APLICADAS:*\n`
        cuotasAplicadas.forEach(c => {
            t += `Cuota #${c.numero} (${fmtFecha(c.fecha_vencimiento)}): ${fmtMoneda(c.aplicado)}\n`
        })
        t += `\n*Total pagado: ${fmtMoneda(pago.monto)}*\n`
        if (pago.metodo_pago_nombre) t += `Metodo: ${pago.metodo_pago_nombre}\n`
        if (contrato) t += `Saldo restante: ${fmtMoneda(contrato.saldo_pendiente)}\n`
        t += `\n¡GRACIAS POR SU PAGO!`
        return t
    }

    const manejarImprimirTermica = async () => {
        if (!impresoraSeleccionada) { alert('Por favor selecciona una impresora'); return }
        if (!pago || !empresa) { alert('No hay datos para imprimir'); return }
        setImprimiendo(true)
        try {
            const anchoLinea = tamañoPapel === '58mm' ? 32 : 42
            const ticket = generarTextoRecibo()
            await imprimirTextoRaw(impresoraSeleccionada, ticket)
            alert('Impresión enviada correctamente')
        } catch (e) {
            alert('Error al imprimir: ' + e.message)
        } finally {
            setImprimiendo(false)
        }
    }

    const copiarAlPortapapeles = (texto) => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(texto).then(() => {
                alert('Recibo copiado. Abre RawBT y pega el texto.')
            }).catch(() => {
                const ta = document.createElement('textarea')
                ta.value = texto
                ta.style.position = 'fixed'
                ta.style.opacity = '0'
                document.body.appendChild(ta)
                ta.select()
                try { document.execCommand('copy'); alert('Recibo copiado. Abre RawBT y pega el texto.') }
                catch { alert('No se pudo copiar. Intenta manualmente.') }
                document.body.removeChild(ta)
            })
        }
    }

    const compartirTexto = async () => {
        const texto = generarTextoRecibo()
        const esAndroid = /Android/i.test(navigator.userAgent)
        if (esAndroid) {
            try {
                const blob = new Blob([texto], { type: 'text/plain' })
                const file = new File([blob], 'recibo.txt', { type: 'text/plain' })
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Imprimir con RawBT' })
                } else if (navigator.share) {
                    await navigator.share({ text: texto, title: 'Imprimir con RawBT' })
                } else {
                    copiarAlPortapapeles(texto)
                }
            } catch (e) {
                if (e.name !== 'AbortError') copiarAlPortapapeles(texto)
            }
        } else {
            if (navigator.share) {
                try { await navigator.share({ text: texto, title: 'Imprimir con RawBT' }) }
                catch (e) { if (e.name !== 'AbortError') copiarAlPortapapeles(texto) }
            } else {
                copiarAlPortapapeles(texto)
            }
        }
    }

    const compartirPorWhatsApp = async () => {
        try {
            if (esMobile()) {
                await compartirWhatsAppMobileConImagen()
            } else {
                setNumeroWhatsApp(pago?.cliente_telefono || '')
                setMostrarModalWhatsApp(true)
            }
        } catch {
            setNumeroWhatsApp(pago?.cliente_telefono || '')
            setMostrarModalWhatsApp(true)
        }
    }

    const compartirWhatsAppMobileConImagen = async () => {
        if (!navigator.share) {
            setNumeroWhatsApp(pago?.cliente_telefono || '')
            setMostrarModalWhatsApp(true)
            return
        }
        try {
            const blob = await capturarComprobanteComoImagen()
            const file = new File([blob], `recibo_pago_${pagoId}.png`, { type: 'image/png' })
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Recibo de Pago',
                    text: `Recibo de pago - ${empresa?.nombre_empresa || ''}`
                })
            } else {
                setNumeroWhatsApp(pago?.cliente_telefono || '')
                setMostrarModalWhatsApp(true)
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                setNumeroWhatsApp(pago?.cliente_telefono || '')
                setMostrarModalWhatsApp(true)
            }
        }
    }

    const compartirWhatsAppDesktop = async (numero) => {
        try {
            const numeroLimpio = numero.replace(/\D/g, '')
            const texto = generarTextoRecibo()
            const textoCodificado = encodeURIComponent(texto)
            window.open(`https://web.whatsapp.com/send?phone=${numeroLimpio}&text=${textoCodificado}`, '_blank')
            try {
                const blob = await capturarComprobanteComoImagen()
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `recibo_pago_${pagoId}_${Date.now()}.png`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                setTimeout(() => URL.revokeObjectURL(url), 100)
                setTimeout(() => {
                    alert('✅ WhatsApp Web abierto con el texto del recibo.\n✅ Imagen del recibo descargada.\n\n📸 Para enviar la imagen:\n1. En WhatsApp Web, el contacto ya está seleccionado\n2. Arrastra el archivo descargado a la conversación\n3. O haz clic en el botón de adjuntar y selecciona el archivo')
                }, 500)
            } catch {
                alert('✅ WhatsApp Web abierto con el texto del recibo.\n\n⚠️ No se pudo descargar la imagen, pero puedes compartir el texto del recibo.')
            }
        } catch {
            alert('Error al compartir el recibo. Intenta nuevamente.')
        }
    }

    const manejarEnviarWhatsApp = async () => {
        if (!numeroWhatsApp.trim()) { alert('Por favor ingresa un número de teléfono'); return }
        const numeroLimpio = numeroWhatsApp.replace(/\D/g, '')
        if (numeroLimpio.length < 8) { alert('Por favor ingresa un número de teléfono válido'); return }
        const numero = numeroWhatsApp
        setMostrarModalWhatsApp(false)
        setNumeroWhatsApp('')
        if (esMobile()) {
            const texto = generarTextoRecibo()
            window.location.href = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(texto)}`
        } else {
            await compartirWhatsAppDesktop(numero)
        }
    }

    if (cargando) { return <LoadingScreen /> }

    if (error || !pago || !empresa) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <h2>{tr('Error al cargar el recibo', 'Error loading receipt')}</h2>
                    <p>{error || tr('No se pudo cargar la información', 'Could not load information')}</p>
                    <button onClick={() => router.push('/admin/pagos')} className={estilos.btnCerrar}>
                        {tr('Volver a Pagos', 'Back to Payments')}
                    </button>
                </div>
            </div>
        )
    }

    const esAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
    const totalCapital = cuotasAplicadas.reduce((a, c) => a + parseFloat(c.capital || 0), 0)
    const totalInteres = cuotasAplicadas.reduce((a, c) => a + parseFloat(c.interes || 0), 0)
    const totalMora = cuotasAplicadas.reduce((a, c) => a + parseFloat(c.mora || 0), 0)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* PANEL DE CONTROLES */}
            <div className={`${estilos.controles} ${estilos[tema]}`}>
                <div className={estilos.selectores}>
                    <h3>{tr('Tamaño de Papel', 'Paper Size')}</h3>
                    <div className={estilos.botonesTabaño}>
                        {['58mm', '80mm', 'A4'].map(t => (
                            <button
                                key={t}
                                className={`${estilos.btnTamaño} ${estilos[tema]} ${tamañoPapel === t ? estilos.activo : ''}`}
                                onClick={() => cambiarTamañoPapel(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {qzDisponible && impresoras.length > 0 && (
                    <div className={estilos.selectores}>
                        <h3>{tr('Impresora', 'Printer')}</h3>
                        <select
                            value={impresoraSeleccionada}
                            onChange={(e) => cambiarImpresora(e.target.value)}
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
                            <span>{imprimiendo ? tr('Imprimiendo...', 'Printing...') : tr('Imprimir Térmica', 'Print Thermal')}</span>
                        </button>
                    )}

                    {esAndroid && (
                        <button onClick={compartirTexto} className={estilos.btnCompartir}>
                            <ion-icon name="bluetooth-outline"></ion-icon>
                            <span>{tr('Compartir (RawBT)', 'Share (RawBT)')}</span>
                        </button>
                    )}

                    <button onClick={manejarImprimirNavegador} className={estilos.btnImprimirNav}>
                        <ion-icon name="print-outline"></ion-icon>
                        <span>Imprimir Normal</span>
                    </button>

                    <button onClick={compartirPorWhatsApp} className={estilos.btnWhatsApp}>
                        <ion-icon name="logo-whatsapp"></ion-icon>
                        <span>Compartir por WhatsApp</span>
                    </button>

                    <button onClick={() => router.push('/admin/pagos')} className={estilos.btnCerrar}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>{tr('Volver', 'Back')}</span>
                    </button>
                </div>
            </div>

            {/* VISTA PREVIA */}
            <div className={estilos.vistaPrevia}>

                {/* PANEL DE OPCIONES */}
                <div className={`${estilos.panelOpciones} ${estilos[tema]}`}>
                    <h3>{tr('Mostrar en Recibo', 'Show on Receipt')}</h3>
                    <div className={estilos.listaOpciones}>
                        {[
                            { key: 'mostrarDatosEmpresa', label: tr('Datos Empresa', 'Company Info') },
                            { key: 'mostrarDatosCliente', label: tr('Datos Cliente', 'Customer Info') },
                            { key: 'mostrarCasillasAplicadas', label: tr('Cuotas Aplicadas', 'Applied Installments') },
                            { key: 'mostrarMetodoPago', label: tr('Método de Pago', 'Payment Method') },
                            { key: 'mostrarSaldoRestante', label: tr('Saldo Restante', 'Remaining Balance') },
                            { key: 'mostrarNotas', label: tr('Notas', 'Notes') },
                            { key: 'mostrarMensajeFinal', label: tr('Mensaje Final', 'Final Message') },
                        ].map(({ key, label }) => (
                            <label key={key} className={estilos.opcionLabel}>
                                <span>{label}</span>
                                <button
                                    className={`${estilos.switch} ${opciones[key] ? estilos.activo : ''}`}
                                    onClick={() => toggleOpcion(key)}
                                >
                                    <span className={estilos.switchSlider}></span>
                                </button>
                            </label>
                        ))}
                    </div>
                </div>

                {/* BOUCHER / TICKET */}
                <div ref={boucherRef} className={`${estilos.boucher} ${estilos[tamañoPapel]}`} data-size={tamañoPapel}>

                    {opciones.mostrarDatosEmpresa && (
                        <>
                            <div className={estilos.encabezado}>
                                <h1>{empresa.nombre_empresa}</h1>
                                {empresa.razon_social && empresa.razon_social !== empresa.nombre_empresa && (
                                    <p>{empresa.razon_social}</p>
                                )}
                                {empresa.rnc && <p>RNC: {empresa.rnc}</p>}
                                {empresa.direccion && <p>{empresa.direccion}</p>}
                                {empresa.telefono && <p>Tel: {empresa.telefono}</p>}
                            </div>
                            <div className={estilos.linea}></div>
                        </>
                    )}

                    <div className={estilos.comprobante}>
                        <p className={estilos.tipoDoc}>
                            {/adelantado/i.test(pago.notas || '')
                                ? tr('RECIBO DE PAGO ADELANTADO', 'ADVANCE PAYMENT RECEIPT')
                                : tr('RECIBO DE PAGO', 'PAYMENT RECEIPT')}
                        </p>
                        <p className={estilos.recibNo}>{tr('Recibo No.', 'Receipt No.')} {pagoId}</p>
                        <p>{tr('Contrato:', 'Contract:')} <strong>{pago.contrato_numero}</strong></p>
                    </div>

                    <div className={estilos.linea}></div>

                    <div className={estilos.info}>
                        <p><strong>{tr('Fecha:', 'Date:')}</strong> {fmtFecha(pago.fecha)}</p>
                        {opciones.mostrarDatosCliente && (
                            <>
                                <p><strong>{tr('Cliente:', 'Customer:')}</strong> {pago.cliente_nombre}</p>
                                {pago.cliente_documento && (
                                    <p><strong>{tr('Cédula:', 'ID:')}</strong> {pago.cliente_documento}</p>
                                )}
                                {pago.cliente_telefono && (
                                    <p><strong>{tr('Teléfono:', 'Phone:')}</strong> {pago.cliente_telefono}</p>
                                )}
                                {pago.cliente_direccion && (
                                    <p><strong>{tr('Dirección:', 'Address:')}</strong> {pago.cliente_direccion}</p>
                                )}
                            </>
                        )}
                        {pago.usuario_nombre && (
                            <p><strong>{tr('Recibido por:', 'Received by:')}</strong> {pago.usuario_nombre}</p>
                        )}
                    </div>

                    {opciones.mostrarCasillasAplicadas && cuotasAplicadas.length > 0 && (
                        <>
                            <div className={estilos.linea}></div>
                            <table className={estilos.productos}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{tr('Vencimiento', 'Due Date')}</th>
                                        <th>{tr('Mora', 'Late Fee')}</th>
                                        <th className={estilos.derecha}>{tr('Aplicado', 'Applied')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cuotasAplicadas.map((c, i) => (
                                        <tr key={i}>
                                            <td className={estilos.centrado}>{c.numero}</td>
                                            <td>{fmtFecha(c.fecha_vencimiento)}</td>
                                            <td className={estilos.derecha}>
                                                {parseFloat(c.mora || 0) > 0 ? fmtMoneda(c.mora) : '—'}
                                            </td>
                                            <td className={estilos.derecha}>{fmtMoneda(c.aplicado)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    <div className={estilos.linea}></div>

                    <div className={estilos.totales}>
                        {cuotasAplicadas.length > 0 && (
                            <>
                                <div className={estilos.fila}>
                                    <span>{tr('Capital:', 'Principal:')}</span>
                                    <span>{fmtMoneda(totalCapital || pago.monto_capital)}</span>
                                </div>
                                <div className={estilos.fila}>
                                    <span>{tr('Interés:', 'Interest:')}</span>
                                    <span>{fmtMoneda(totalInteres || pago.monto_interes)}</span>
                                </div>
                                {parseFloat(pago.monto_mora || 0) > 0 && (
                                    <div className={estilos.fila}>
                                        <span>{tr('Mora:', 'Late Fee:')}</span>
                                        <span>{fmtMoneda(totalMora || pago.monto_mora)}</span>
                                    </div>
                                )}
                                <div className={estilos.lineaDoble}></div>
                            </>
                        )}
                        <div className={`${estilos.fila} ${estilos.total}`}>
                            <span>{tr('TOTAL PAGADO:', 'TOTAL PAID:')}</span>
                            <span>{fmtMoneda(pago.monto)}</span>
                        </div>

                        {opciones.mostrarMetodoPago && pago.metodo_pago_nombre && (
                            <>
                                <div className={estilos.lineaSencilla}></div>
                                <div className={estilos.fila}>
                                    <span>{tr('Método de Pago:', 'Payment Method:')}</span>
                                    <span>{pago.metodo_pago_nombre}</span>
                                </div>
                            </>
                        )}

                        {pago.referencia && (
                            <div className={estilos.fila}>
                                <span>{tr('Referencia:', 'Reference:')}</span>
                                <span>{pago.referencia}</span>
                            </div>
                        )}

                        {opciones.mostrarSaldoRestante && contrato && (
                            <>
                                <div className={estilos.lineaSencilla}></div>
                                <div className={estilos.fila}>
                                    <span>{tr('Saldo restante:', 'Remaining balance:')}</span>
                                    <span>{fmtMoneda(contrato.saldo_pendiente)}</span>
                                </div>
                                {contrato.cuotas_restantes > 0 && (
                                    <div className={estilos.fila}>
                                        <span>{tr('Cuotas pendientes:', 'Pending installments:')}</span>
                                        <span>{contrato.cuotas_restantes}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {opciones.mostrarNotas && pago.notas && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.notas}>
                                <p><strong>{tr('NOTA:', 'NOTE:')}</strong> {pago.notas}</p>
                            </div>
                        </>
                    )}

                    {opciones.mostrarMensajeFinal && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.footer}>
                                {empresa.mensaje_factura && (
                                    <p className={estilos.mensaje}>{empresa.mensaje_factura}</p>
                                )}
                                <p className={estilos.gracias}>{tr('¡GRACIAS POR SU PAGO!', 'THANK YOU FOR YOUR PAYMENT!')}</p>
                                <p className={estilos.fecha}>{new Date().toLocaleDateString('es-DO')}</p>
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* MODAL WHATSAPP */}
            {mostrarModalWhatsApp && (
                <div className={estilos.modalOverlay} onClick={() => setMostrarModalWhatsApp(false)}>
                    <div className={`${estilos.modalWhatsApp} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>{tr('Compartir por WhatsApp', 'Share via WhatsApp')}</h3>
                            <button onClick={() => setMostrarModalWhatsApp(false)} className={estilos.btnCerrarModal}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <p className={estilos.modalTexto}>
                                {tr('Ingresa el número de teléfono del cliente (con código de país, sin +):', 'Enter the customer phone number (with country code, without +):')}
                            </p>
                            <input
                                type="tel"
                                value={numeroWhatsApp}
                                onChange={(e) => setNumeroWhatsApp(e.target.value)}
                                placeholder="Ej: 18091234567"
                                className={`${estilos.inputWhatsApp} ${estilos[tema]}`}
                                autoFocus
                            />
                            <p className={estilos.modalAyuda}>
                                {esMobile()
                                    ? tr('El recibo se abrirá en WhatsApp con el número ingresado', 'The receipt will open in WhatsApp with the entered number')
                                    : tr('WhatsApp Web se abrirá con el texto y se descargará la imagen del recibo', 'WhatsApp Web will open with the receipt text and the image will be downloaded')}
                            </p>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button onClick={() => setMostrarModalWhatsApp(false)} className={estilos.btnCancelar}>
                                {tr('Cancelar', 'Cancel')}
                            </button>
                            <button onClick={manejarEnviarWhatsApp} className={estilos.btnEnviarWhatsApp}>
                                <ion-icon name="logo-whatsapp"></ion-icon>
                                <span>{tr('Enviar', 'Send')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
