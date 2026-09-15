"use client"
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import html2canvas from 'html2canvas'
import { obtenerContratoImprimir, obtenerDatosEmpresa } from './servidor'
import estilos from './imprimir.module.css'
import {
    conectarQZTray,
    obtenerImpresoras,
    imprimirTextoRaw,
    buscarImpresoraTermica,
} from '@/utils/qzTrayService'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ImprimirContrato() {
    const params   = useParams()
    const router   = useRouter()
    const id       = params.id

    const [tema, setTema]                           = useState('light')
    const [cargando, setCargando]                   = useState(true)
    const [contrato, setContrato]                   = useState(null)
    const [cuotas, setCuotas]                       = useState([])
    const [pagos, setPagos]                         = useState([])
    const [error, setError]                         = useState(null)
    const [tamañoPapel, setTamañoPapel]             = useState('80mm')
    const [impresoras, setImpresoras]               = useState([])
    const [impresoraSeleccionada, setImpresoraSeleccionada] = useState('')
    const [qzDisponible, setQzDisponible]           = useState(false)
    const [imprimiendo, setImprimiendo]             = useState(false)
    const [mostrarModalWhatsApp, setMostrarModalWhatsApp] = useState(false)
    const [numeroWhatsApp, setNumeroWhatsApp]       = useState('')
    const boucherRef = useRef(null)

    const [empresa, setEmpresa] = useState(null)
    const [opciones, setOpciones] = useState({
        mostrarDatosEmpresa:  true,
        mostrarDatosCliente:  true,
        mostrarCobrador:      true,
        mostrarCuotas:        true,
        mostrarBalance:       true,
        mostrarFechas:        true,
        mostrarMensajeFinal:  true,
    })

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const tam = localStorage.getItem('tamañoPapelImpresionContrato')
        if (tam) setTamañoPapel(tam)
        const ops = localStorage.getItem('opcionesImpresionContrato')
        if (ops) setOpciones(JSON.parse(ops))

        const onChange = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', onChange)
        window.addEventListener('storage', onChange)
        return () => {
            window.removeEventListener('temaChange', onChange)
            window.removeEventListener('storage', onChange)
        }
    }, [])

    useEffect(() => {
        cargarDatos()
        cargarEmpresa()
        inicializarQZ()
    }, [id])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    useEffect(() => {
        if (tamañoPapel) document.body.setAttribute('data-print-size', tamañoPapel)
    }, [tamañoPapel])

    const cargarDatos = async () => {
        try {
            const r = await obtenerContratoImprimir(id)
            if (r.success) {
                setContrato(r.contrato)
                setCuotas(r.cuotas || [])
                setPagos(r.pagos || [])
            } else {
                setError(r.mensaje || 'Error al cargar contrato')
            }
        } catch (e) {
            setError('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const inicializarQZ = async () => {
        try {
            await conectarQZTray()
            const lista = await obtenerImpresoras()
            setImpresoras(lista)
            const guardada = localStorage.getItem('impresoraTermica')
            if (guardada && lista.includes(guardada)) {
                setImpresoraSeleccionada(guardada)
            } else {
                const termica = await buscarImpresoraTermica()
                if (termica) {
                    setImpresoraSeleccionada(termica)
                    localStorage.setItem('impresoraTermica', termica)
                } else if (lista.length > 0) {
                    setImpresoraSeleccionada(lista[0])
                }
            }
            setQzDisponible(true)
        } catch {
            setQzDisponible(false)
        }
    }

    const toggleOpcion = (op) => {
        const nueva = { ...opciones, [op]: !opciones[op] }
        setOpciones(nueva)
        localStorage.setItem('opcionesImpresionContrato', JSON.stringify(nueva))
    }

    const cambiarTamaño = (t) => {
        setTamañoPapel(t)
        localStorage.setItem('tamañoPapelImpresionContrato', t)
    }

    const cambiarImpresora = (imp) => {
        setImpresoraSeleccionada(imp)
        localStorage.setItem('impresoraTermica', imp)
    }

    const fmtFecha = (f) => {
        if (!f) return '—'
        const d = new Date(f + 'T00:00:00')
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
    }

    const fmtFechaHora = (f) => {
        if (!f) return '—'
        const d = new Date(f)
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    }

    const localeEmpresa = empresa?.locale || 'es-DO'
    const monedaEmpresa = empresa?.moneda || 'DOP'
    const fmtMoneda = (v) =>
        new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(v) || 0)

    const generarESCPOS = () => {
        if (!contrato) return ''
        const ancho = tamañoPapel === '58mm' ? 32 : 42
        const linea  = '-'.repeat(ancho)
        const centro = (txt) => {
            const t = String(txt)
            const pad = Math.max(0, Math.floor((ancho - t.length) / 2))
            return ' '.repeat(pad) + t
        }
        const fila2 = (izq, der) => {
            const i = String(izq)
            const d = String(der)
            const espacios = Math.max(1, ancho - i.length - d.length)
            return i + ' '.repeat(espacios) + d
        }

        const ESC = '\x1B'
        const GS  = '\x1D'
        const CMD_INIT        = ESC + '@'
        const CMD_BOLD_ON     = ESC + 'E' + '\x01'
        const CMD_BOLD_OFF    = ESC + 'E' + '\x00'
        const CMD_CENTER      = ESC + 'a' + '\x01'
        const CMD_LEFT        = ESC + 'a' + '\x00'
        const CMD_BIG_ON      = GS  + '!' + '\x11'
        const CMD_BIG_OFF     = GS  + '!' + '\x00'
        const CMD_CUT         = GS  + 'V' + '\x41' + '\x03'
        const NL = '\n'

        let t = CMD_INIT

        if (opciones.mostrarDatosEmpresa) {
            t += CMD_CENTER + CMD_BOLD_ON
            t += (contrato.nombre_empresa || 'EMPRESA') + NL
            t += CMD_BOLD_OFF
            if (contrato.empresa_direccion) t += contrato.empresa_direccion + NL
            if (contrato.empresa_telefono)  t += 'Tel: ' + contrato.empresa_telefono + NL
            if (contrato.empresa_rnc)       t += 'RNC: ' + contrato.empresa_rnc + NL
            t += linea + NL
        }

        t += CMD_CENTER + CMD_BOLD_ON + 'COMPROBANTE DE PAGO' + NL + CMD_BOLD_OFF
        t += linea + NL
        t += CMD_LEFT

        if (opciones.mostrarCobrador) {
            t += 'Cobrador: ' + (contrato.vendedor_nombre || '—') + NL
            t += 'Telefono: ' + (contrato.empresa_telefono || '—') + NL
            t += 'Fecha: ' + fmtFechaHora(new Date().toISOString()) + NL
            t += linea + NL
        }

        t += 'Contrato Id: ' + (contrato.numero || contrato.id) + NL
        t += linea + NL

        t += CMD_CENTER + CMD_BIG_ON + CMD_BOLD_ON
        t += ((contrato.cliente_nombre || '') + ' ' + (contrato.cliente_apellidos || '')).trim().toUpperCase() + NL
        t += CMD_BIG_OFF + CMD_BOLD_OFF
        t += linea + NL

        if (opciones.mostrarDatosCliente && contrato.cliente_documento) {
            t += CMD_LEFT
            t += 'Documento: ' + contrato.cliente_documento + NL
            if (contrato.cliente_telefono) t += 'Telefono:  ' + contrato.cliente_telefono + NL
        }

        if (opciones.mostrarCuotas && contrato.proxima_cuota) {
            t += CMD_LEFT + linea + NL
            t += CMD_BOLD_ON
            t += fila2('No.', fila2('Estado', 'Monto')) + NL
            t += CMD_BOLD_OFF

            const c = contrato.proxima_cuota
            const label = `${c.numero}/${contrato.total_cuotas}`
            t += fila2(label, fila2(c.estado, fmtMoneda(c.monto))) + NL
            if (parseFloat(c.mora || 0) > 0) {
                t += fila2('Mora:', fmtMoneda(c.mora)) + NL
            }
            t += linea + NL

            t += CMD_CENTER + CMD_BOLD_ON
            t += (contrato.metodo_pago || 'Efectivo') + NL
            t += CMD_BIG_ON
            t += 'TOTAL: ' + fmtMoneda(parseFloat(c.monto) + parseFloat(c.mora || 0)) + NL
            t += CMD_BIG_OFF + CMD_BOLD_OFF
        }

        if (opciones.mostrarBalance) {
            t += CMD_LEFT + linea + NL
            t += CMD_BOLD_ON
            t += 'PENDIENTE: $' + fmtMoneda(contrato.saldo_pendiente) + NL
            t += CMD_BOLD_OFF
            t += 'ATRASOS PENDIENTE: $' + fmtMoneda(contrato.total_atrasos || 0) + NL
            t += 'MORA PENDIENTE: $'    + fmtMoneda(contrato.total_mora    || 0) + NL
            t += linea + NL
            t += CMD_BOLD_ON
            t += 'BALANCE: ' + fmtMoneda(contrato.saldo_pendiente) + NL
            t += CMD_BOLD_OFF
        }

        if (opciones.mostrarFechas) {
            t += linea + NL
            t += CMD_CENTER
            t += 'E:' + fmtFecha(contrato.fecha_inicio) + ' ==> Ven:' + fmtFecha(contrato.fecha_fin) + NL
        }

        if (opciones.mostrarMensajeFinal) {
            t += linea + NL
            t += CMD_CENTER + CMD_BOLD_ON
            t += 'GUARDE Y REVISE SU TICKET' + NL
            t += CMD_BOLD_OFF
            if (contrato.mensaje_factura) {
                t += contrato.mensaje_factura + NL
            } else {
                t += 'Para reclamaciones contactenos!!' + NL
                t += '!!Gracias!!Por preferirnos!!' + NL
            }
        }

        t += NL + NL + NL + CMD_CUT
        return t
    }

    const generarTextoPlano = () => {
        if (!contrato) return ''
        const ancho = tamañoPapel === '58mm' ? 32 : 42
        const linea  = '-'.repeat(ancho)
        const centro = (txt) => {
            const t = String(txt)
            const pad = Math.max(0, Math.floor((ancho - t.length) / 2))
            return ' '.repeat(pad) + t
        }
        const fila2 = (izq, der) => {
            const i = String(izq)
            const d = String(der)
            const esp = Math.max(1, ancho - i.length - d.length)
            return i + ' '.repeat(esp) + d
        }

        let t = ''
        if (opciones.mostrarDatosEmpresa) {
            t += centro(contrato.nombre_empresa || 'EMPRESA') + '\n'
            if (contrato.empresa_direccion) t += centro(contrato.empresa_direccion) + '\n'
            if (contrato.empresa_telefono)  t += centro(contrato.empresa_telefono) + '\n'
            t += linea + '\n'
        }
        t += centro('COMPROBANTE DE PAGO') + '\n'
        t += linea + '\n'
        if (opciones.mostrarCobrador) {
            t += 'Cobrador: ' + (contrato.vendedor_nombre || '—') + '\n'
            t += 'Telefono: ' + (contrato.empresa_telefono || '—') + '\n'
            t += 'Fecha: '    + fmtFechaHora(new Date().toISOString()) + '\n'
            t += linea + '\n'
        }
        t += 'Contrato Id: ' + (contrato.numero || contrato.id) + '\n'
        t += linea + '\n'
        t += centro(((contrato.cliente_nombre || '') + ' ' + (contrato.cliente_apellidos || '')).trim().toUpperCase()) + '\n'
        t += linea + '\n'
        if (opciones.mostrarDatosCliente && contrato.cliente_documento) {
            t += 'Documento: ' + contrato.cliente_documento + '\n'
            if (contrato.cliente_telefono) t += 'Telefono: ' + contrato.cliente_telefono + '\n'
        }
        if (opciones.mostrarCuotas && contrato.proxima_cuota) {
            t += linea + '\n'
            const c = contrato.proxima_cuota
            t += fila2('No.', fila2('Estado', 'Monto')) + '\n'
            t += fila2(`${c.numero}/${contrato.total_cuotas}`, fila2(c.estado, fmtMoneda(c.monto))) + '\n'
            if (parseFloat(c.mora || 0) > 0) t += fila2('Mora:', fmtMoneda(c.mora)) + '\n'
            t += linea + '\n'
            t += centro('Efectivo') + '\n'
            t += centro('TOTAL: ' + fmtMoneda(parseFloat(c.monto) + parseFloat(c.mora || 0))) + '\n'
        }
        if (opciones.mostrarBalance) {
            t += linea + '\n'
            t += 'PENDIENTE: $'         + fmtMoneda(contrato.saldo_pendiente) + '\n'
            t += 'ATRASOS PENDIENTE: $' + fmtMoneda(contrato.total_atrasos || 0) + '\n'
            t += 'MORA PENDIENTE: $'    + fmtMoneda(contrato.total_mora    || 0) + '\n'
            t += linea + '\n'
            t += 'BALANCE: '            + fmtMoneda(contrato.saldo_pendiente) + '\n'
        }
        if (opciones.mostrarFechas) {
            t += linea + '\n'
            t += centro('E:' + fmtFecha(contrato.fecha_inicio) + ' ==> Ven:' + fmtFecha(contrato.fecha_fin)) + '\n'
        }
        if (opciones.mostrarMensajeFinal) {
            t += linea + '\n'
            t += centro('GUARDE Y REVISE SU TICKET') + '\n'
            if (contrato.mensaje_factura) {
                t += centro(contrato.mensaje_factura) + '\n'
            } else {
                t += centro('Para reclamaciones contactenos!!') + '\n'
                t += centro('!!Gracias!!Por preferirnos!!') + '\n'
            }
        }
        return t
    }

    const manejarImprimirNavegador = () => window.print()

    const manejarImprimirTermica = async () => {
        if (!impresoraSeleccionada) { alert('Selecciona una impresora'); return }
        setImprimiendo(true)
        try {
            await imprimirTextoRaw(impresoraSeleccionada, generarESCPOS())
            alert('Impresion enviada correctamente')
        } catch (e) {
            alert('Error al imprimir: ' + e.message)
        } finally {
            setImprimiendo(false)
        }
    }

    const compartirTexto = async () => {
        const texto = generarTextoPlano()
        const esAndroid = /Android/i.test(navigator.userAgent)
        if (esAndroid) {
            try {
                const blob = new Blob([texto], { type: 'text/plain' })
                const file = new File([blob], 'comprobante.txt', { type: 'text/plain' })
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

    const copiarAlPortapapeles = (texto) => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(texto)
                .then(() => alert('Ticket copiado. Abre RawBT y pega el texto.'))
                .catch(() => copiarFallback(texto))
        } else {
            copiarFallback(texto)
        }
    }

    const copiarFallback = (texto) => {
        const ta = document.createElement('textarea')
        ta.value = texto
        ta.style.position = 'fixed'
        ta.style.opacity  = '0'
        document.body.appendChild(ta)
        ta.select()
        try {
            document.execCommand('copy')
            alert('Ticket copiado. Abre RawBT y pega el texto.')
        } catch {
            alert('No se pudo copiar. Intenta manualmente.')
        }
        document.body.removeChild(ta)
    }

    const capturarImagen = async () => {
        if (!boucherRef.current) throw new Error('No se encontro el comprobante')
        const canvas = await html2canvas(boucherRef.current, {
            backgroundColor: '#ffffff', scale: 2, logging: false, useCORS: true,
            width: boucherRef.current.scrollWidth, height: boucherRef.current.scrollHeight,
        })
        return new Promise(res => canvas.toBlob(blob => res(blob), 'image/png', 0.95))
    }

    const generarTextoWhatsApp = () => {
        if (!contrato) return ''
        const c = contrato.proxima_cuota
        let t = `*${contrato.nombre_empresa || 'EMPRESA'}*\n\n`
        t += `COMPROBANTE DE PAGO\n`
        t += `Contrato: ${contrato.numero || contrato.id}\n`
        t += `Fecha: ${fmtFechaHora(new Date().toISOString())}\n\n`
        t += `*Cliente:* ${((contrato.cliente_nombre || '') + ' ' + (contrato.cliente_apellidos || '')).trim()}\n`
        if (contrato.cliente_documento) t += `Documento: ${contrato.cliente_documento}\n`
        if (c) {
            t += `\n*Cuota ${c.numero}/${contrato.total_cuotas}* (${c.estado})\n`
            t += `Monto: ${fmtMoneda(c.monto)}\n`
            if (parseFloat(c.mora || 0) > 0) t += `Mora: ${fmtMoneda(c.mora)}\n`
            t += `*TOTAL: ${fmtMoneda(parseFloat(c.monto) + parseFloat(c.mora || 0))}*\n`
        }
        t += `\nPendiente: $${fmtMoneda(contrato.saldo_pendiente)}\n`
        t += `Balance:   $${fmtMoneda(contrato.saldo_pendiente)}\n`
        t += `\nE:${fmtFecha(contrato.fecha_inicio)} ==> Ven:${fmtFecha(contrato.fecha_fin)}\n`
        t += `\n¡¡Gracias!!Por preferirnos!!`
        return t
    }

    const esMobile = () =>
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768

    const compartirPorWhatsApp = async () => {
        try {
            if (esMobile()) {
                if (!navigator.share) {
                    setNumeroWhatsApp(contrato?.cliente_telefono || '')
                    setMostrarModalWhatsApp(true)
                    return
                }
                const blob = await capturarImagen()
                const file = new File([blob], `comprobante_${contrato.numero || id}.png`, { type: 'image/png' })
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Comprobante Contrato' })
                } else {
                    setNumeroWhatsApp(contrato?.cliente_telefono || '')
                    setMostrarModalWhatsApp(true)
                }
            } else {
                setNumeroWhatsApp(contrato?.cliente_telefono || '')
                setMostrarModalWhatsApp(true)
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                setNumeroWhatsApp(contrato?.cliente_telefono || '')
                setMostrarModalWhatsApp(true)
            }
        }
    }

    const manejarEnviarWhatsApp = async () => {
        if (!numeroWhatsApp.trim()) { alert('Ingresa un numero de telefono'); return }
        const num = numeroWhatsApp.replace(/\D/g, '')
        if (num.length < 8) { alert('Numero invalido'); return }

        const numParaEnviar = numeroWhatsApp
        setMostrarModalWhatsApp(false)
        setNumeroWhatsApp('')

        const texto = encodeURIComponent(generarTextoWhatsApp())

        if (esMobile()) {
            window.location.href = `https://wa.me/${num}?text=${texto}`
        } else {
            window.open(`https://web.whatsapp.com/send?phone=${num}&text=${texto}`, '_blank')
            try {
                const blob = await capturarImagen()
                const url  = URL.createObjectURL(blob)
                const a    = document.createElement('a')
                a.href     = url
                a.download = `comprobante_${contrato.numero || id}_${Date.now()}.png`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                setTimeout(() => URL.revokeObjectURL(url), 100)
                setTimeout(() => alert('WhatsApp Web abierto.\nImagen descargada.\nArrastrala a la conversacion.'), 500)
            } catch {
                // si falla imagen, el texto ya se envio
            }
        }
    }

    const esAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

    if (cargando) { return <LoadingScreen /> }

    if (error || !contrato) return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.errorBloque}>
                <h2>Error al cargar el comprobante</h2>
                <p>{error || 'No se pudo cargar la informacion'}</p>
                <button onClick={() => router.push('/admin/contratos')} className={estilos.btnCerrar}>
                    Cerrar
                </button>
            </div>
        </div>
    )

    const proximaCuota = contrato.proxima_cuota

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* ===== TOP BAR COMPACTO ===== */}
            <div className={`${estilos.controles} ${estilos[tema]}`}>

                {/* Tamaño de papel */}
                <div className={estilos.selectores}>
                    <h3>Papel:</h3>
                    <div className={estilos.botonesTamaño}>
                        {['58mm','80mm'].map(t => (
                            <button
                                key={t}
                                className={`${estilos.btnTamaño} ${estilos[tema]} ${tamañoPapel === t ? estilos.activo : ''}`}
                                onClick={() => cambiarTamaño(t)}
                            >{t}</button>
                        ))}
                    </div>
                </div>

                {/* Impresora (solo si QZ disponible) */}
                {qzDisponible && impresoras.length > 0 && (
                    <>
                        <div className={estilos.separador} />
                        <div className={estilos.selectores}>
                            <h3>Impresora:</h3>
                            <select
                                value={impresoraSeleccionada}
                                onChange={e => cambiarImpresora(e.target.value)}
                                className={`${estilos.selectImpresora} ${estilos[tema]}`}
                            >
                                {impresoras.map((imp, i) => (
                                    <option key={i} value={imp}>{imp}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                {/* Botones de acción — empujados al lado derecho con margin-left: auto */}
                <div className={estilos.botonesAccion}>
                    {qzDisponible && (
                        <button
                            onClick={manejarImprimirTermica}
                            className={estilos.btnImprimir}
                            disabled={imprimiendo}
                        >
                            {imprimiendo ? 'Imprimiendo...' : 'Imprimir Termica'}
                        </button>
                    )}

                    {esAndroid && (
                        <button onClick={compartirTexto} className={estilos.btnCompartir}>
                            Compartir (RawBT)
                        </button>
                    )}

                    <button onClick={manejarImprimirNavegador} className={estilos.btnImprimirNav}>
                        Imprimir Normal
                    </button>

                    <button onClick={compartirPorWhatsApp} className={estilos.btnWhatsApp}>
                        <ion-icon name="logo-whatsapp"></ion-icon>
                        <span>WhatsApp</span>
                    </button>

                    <button onClick={() => router.push(`/admin/contratos/ver/${id}`)} className={estilos.btnCerrar}>
                        Cerrar
                    </button>
                </div>
            </div>

            {/* ===== CUERPO ===== */}
            <div className={estilos.vistaPrevia}>

                {/* Panel de opciones */}
                <div className={`${estilos.panelOpciones} ${estilos[tema]}`}>
                    <h3>Mostrar en Boucher</h3>
                    <div className={estilos.listaOpciones}>
                        {[
                            ['mostrarDatosEmpresa', 'Datos Empresa'],
                            ['mostrarDatosCliente', 'Datos Cliente'],
                            ['mostrarCobrador',     'Cobrador'],
                            ['mostrarCuotas',       'Cuota / Pago'],
                            ['mostrarBalance',      'Balance'],
                            ['mostrarFechas',       'Fechas'],
                            ['mostrarMensajeFinal', 'Mensaje Final'],
                        ].map(([key, label]) => (
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

                {/* Ticket */}
                <div className={estilos.boucherWrapper}>
                    <div
                        ref={boucherRef}
                        className={estilos.boucher}
                        data-size={tamañoPapel}
                    >
                        {opciones.mostrarDatosEmpresa && (
                            <>
                                <div className={estilos.encabezado}>
                                    <h1>{contrato.nombre_empresa}</h1>
                                    {contrato.empresa_direccion && <p>{contrato.empresa_direccion}</p>}
                                    {contrato.empresa_telefono  && <p>{contrato.empresa_telefono}</p>}
                                    {contrato.empresa_rnc       && <p>RNC: {contrato.empresa_rnc}</p>}
                                </div>
                                <div className={estilos.linea}></div>
                            </>
                        )}

                        <div className={estilos.comprobante}>
                            <p className={estilos.tipoDoc}>COMPROBANTE DE PAGO</p>
                        </div>
                        <div className={estilos.linea}></div>

                        {opciones.mostrarCobrador && (
                            <div className={estilos.info}>
                                <p><strong>Cobrador:</strong> {contrato.vendedor_nombre || '—'}</p>
                                {contrato.empresa_telefono && <p><strong>Telefono:</strong> {contrato.empresa_telefono}</p>}
                                <p><strong>Fecha:</strong> {fmtFechaHora(new Date().toISOString())}</p>
                            </div>
                        )}

                        <div className={estilos.linea}></div>
                        <div className={estilos.info}>
                            <p><strong>Contrato Id:</strong> {contrato.numero || contrato.id}</p>
                        </div>
                        <div className={estilos.linea}></div>

                        <div className={estilos.nombreCliente}>
                            {((contrato.cliente_nombre || '') + ' ' + (contrato.cliente_apellidos || '')).trim().toUpperCase()}
                        </div>

                        {opciones.mostrarDatosCliente && (
                            <div className={estilos.info}>
                                {contrato.cliente_documento && <p><strong>Documento:</strong> {contrato.cliente_documento}</p>}
                                {contrato.cliente_telefono  && <p><strong>Telefono:</strong>  {contrato.cliente_telefono}</p>}
                            </div>
                        )}

                        {opciones.mostrarCuotas && proximaCuota && (
                            <>
                                <div className={estilos.linea}></div>
                                <table className={estilos.tablaCuota}>
                                    <thead>
                                        <tr>
                                            <th>No.</th>
                                            <th>Estado</th>
                                            <th>Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>{proximaCuota.numero}/{contrato.total_cuotas}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{proximaCuota.estado}</td>
                                            <td className={estilos.derecha}>{fmtMoneda(proximaCuota.monto)}</td>
                                        </tr>
                                        {parseFloat(proximaCuota.mora || 0) > 0 && (
                                            <tr>
                                                <td colSpan={2} style={{ color: '#ef4444', fontWeight: 700 }}>Mora</td>
                                                <td className={estilos.derecha} style={{ color: '#ef4444', fontWeight: 700 }}>
                                                    {fmtMoneda(proximaCuota.mora)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <div className={estilos.linea}></div>
                                <div className={estilos.totalBloque}>
                                    <p className={estilos.metodoPago}>Efectivo</p>
                                    <p className={estilos.totalGrande}>
                                        TOTAL: {fmtMoneda(parseFloat(proximaCuota.monto) + parseFloat(proximaCuota.mora || 0))}
                                    </p>
                                </div>
                            </>
                        )}

                        {opciones.mostrarBalance && (
                            <>
                                <div className={estilos.linea}></div>
                                <div className={estilos.balance}>
                                    <p><strong>PENDIENTE: ${fmtMoneda(contrato.saldo_pendiente)}</strong></p>
                                    <p>ATRASOS PENDIENTE: ${fmtMoneda(contrato.total_atrasos || 0)}</p>
                                    <p>MORA PENDIENTE: ${fmtMoneda(contrato.total_mora || 0)}</p>
                                </div>
                                <div className={estilos.linea}></div>
                                <div className={estilos.balance}>
                                    <p><strong>BALANCE: {fmtMoneda(contrato.saldo_pendiente)}</strong></p>
                                </div>
                            </>
                        )}

                        {opciones.mostrarFechas && (
                            <>
                                <div className={estilos.linea}></div>
                                <div className={estilos.fechas}>
                                    <p>E:{fmtFecha(contrato.fecha_inicio)} ==&gt; Ven:{fmtFecha(contrato.fecha_fin)}</p>
                                </div>
                            </>
                        )}

                        {opciones.mostrarMensajeFinal && (
                            <>
                                <div className={estilos.linea}></div>
                                <div className={estilos.footer}>
                                    <p className={estilos.msgGuarde}>GUARDE Y REVISE SU TICKET</p>
                                    {contrato.mensaje_factura
                                        ? <p>{contrato.mensaje_factura}</p>
                                        : <>
                                            <p>Para reclamaciones contactenos!!</p>
                                            <p>!!Gracias!!Por preferirnos!!</p>
                                          </>
                                    }
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== MODAL WHATSAPP ===== */}
            {mostrarModalWhatsApp && (
                <div className={estilos.modalOverlay} onClick={() => setMostrarModalWhatsApp(false)}>
                    <div className={`${estilos.modalWhatsApp} ${estilos[tema]}`} onClick={e => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>Compartir por WhatsApp</h3>
                            <button onClick={() => setMostrarModalWhatsApp(false)} className={estilos.btnCerrarModal}>
                                <ion-icon name="close"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <p>Numero del cliente (con codigo de pais, sin +):</p>
                            <input
                                type="tel"
                                value={numeroWhatsApp}
                                onChange={e => setNumeroWhatsApp(e.target.value)}
                                placeholder="Ej: 18091234567"
                                className={`${estilos.inputWhatsApp} ${estilos[tema]}`}
                                autoFocus
                            />
                            <p className={estilos.modalAyuda}>
                                {esMobile()
                                    ? 'Se abrira WhatsApp con el numero ingresado'
                                    : 'WhatsApp Web se abrira y se descargara la imagen'}
                            </p>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button onClick={() => setMostrarModalWhatsApp(false)} className={estilos.btnCancelar}>
                                Cancelar
                            </button>
                            <button onClick={manejarEnviarWhatsApp} className={estilos.btnEnviarWhatsApp}>
                                <ion-icon name="logo-whatsapp"></ion-icon>
                                <span>Enviar</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}