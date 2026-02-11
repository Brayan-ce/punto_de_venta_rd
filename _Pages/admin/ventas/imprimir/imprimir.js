"use client"
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Barcode from 'react-barcode'
import html2canvas from 'html2canvas'
import { obtenerVentaImprimir } from './servidor'
import estilos from './imprimir.module.css'
import { generarTicketESCPOS } from '@/utils/escpos'
import { formatCurrency } from '@/utils/monedaUtils'
import {
    conectarQZTray,
    obtenerImpresoras,
    imprimirTextoRaw,
    buscarImpresoraTermica
} from '@/utils/qzTrayService'
import PrinterButton from './PrinterButton'
import { FaPrint } from 'react-icons/fa'

export default function ImprimirVenta() {
    const params = useParams()
    const router = useRouter()
    const ventaId = params.id
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [venta, setVenta] = useState(null)
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
        mostrarVendedor: true,
        mostrarMetodoPago: true,
        mostrarNotas: true,
        mostrarMensajeFinal: true,
        mostrarCodigoBarras: true,
        mostrarExtras: true
    })

    const monedaEmpresa = empresa?.moneda || 'DOP'
    const localeEmpresa = empresa?.locale || 'es-DO'
    const simboloEmpresa = empresa?.simbolo_moneda || ''

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const tamañoGuardado = localStorage.getItem('tamañoPapelImpresion')
        if (tamañoGuardado) {
            setTamañoPapel(tamañoGuardado)
        }

        const opcionesGuardadas = localStorage.getItem('opcionesImpresion')
        if (opcionesGuardadas) {
            setOpciones(JSON.parse(opcionesGuardadas))
        }

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        cargarDatosVenta()
        inicializarQZTray()
    }, [ventaId])

    useEffect(() => {
        if (tamañoPapel) {
            document.body.setAttribute('data-print-size', tamañoPapel)
        }
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
        } catch (error) {
            console.error('Error inicializando QZ Tray:', error)
            setQzDisponible(false)
        }
    }

    const cargarDatosVenta = async () => {
        try {
            const resultado = await obtenerVentaImprimir(ventaId)
            if (resultado.success) {
                setVenta(resultado.venta)
                setEmpresa(resultado.empresa)
            } else {
                setError(resultado.mensaje || 'Error al cargar venta')
            }
        } catch (error) {
            console.error('Error al cargar venta:', error)
            setError('Error al cargar datos de la venta')
        } finally {
            setCargando(false)
        }
    }

    const toggleOpcion = (opcion) => {
        const nuevasOpciones = {
            ...opciones,
            [opcion]: !opciones[opcion]
        }
        setOpciones(nuevasOpciones)
        localStorage.setItem('opcionesImpresion', JSON.stringify(nuevasOpciones))
    }

    const cambiarTamañoPapel = (tamaño) => {
        setTamañoPapel(tamaño)
        localStorage.setItem('tamañoPapelImpresion', tamaño)
    }

    const cambiarImpresora = (impresora) => {
        setImpresoraSeleccionada(impresora)
        localStorage.setItem('impresoraTermica', impresora)
    }

    const manejarImprimirNavegador = () => {
        window.print()
    }

    const manejarImprimirTermica = async () => {
        if (!impresoraSeleccionada) {
            alert('Por favor selecciona una impresora')
            return
        }

        if (!venta || !empresa) {
            alert('No hay datos para imprimir')
            return
        }

        setImprimiendo(true)

        try {
            const anchoLinea = tamañoPapel === '58mm' ? 32 : 42
            const ticketESCPOS = generarTicketESCPOS(venta, empresa, anchoLinea)

            await imprimirTextoRaw(impresoraSeleccionada, ticketESCPOS)

            alert('Impresión enviada correctamente')
        } catch (error) {
            console.error('Error al imprimir:', error)
            alert('Error al imprimir: ' + error.message)
        } finally {
            setImprimiendo(false)
        }
    }

    const compartirTexto = async () => {
        if (!venta || !empresa) return

        const anchoLinea = tamañoPapel === '58mm' ? 32 : 42
        const ticketTexto = generarTicketESCPOS(venta, empresa, anchoLinea)

        const esAndroid = /Android/i.test(navigator.userAgent)

        if (esAndroid) {
            try {
                const blob = new Blob([ticketTexto], { type: 'text/plain' })
                const file = new File([blob], 'ticket.txt', { type: 'text/plain' })

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Imprimir con RawBT'
                    })
                } else if (navigator.share) {
                    await navigator.share({
                        text: ticketTexto,
                        title: 'Imprimir con RawBT'
                    })
                } else {
                    copiarAlPortapapeles(ticketTexto)
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error al compartir:', error)
                    copiarAlPortapapeles(ticketTexto)
                }
            }
        } else {
            if (navigator.share) {
                try {
                    await navigator.share({
                        text: ticketTexto,
                        title: 'Imprimir con RawBT'
                    })
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        copiarAlPortapapeles(ticketTexto)
                    }
                }
            } else {
                copiarAlPortapapeles(ticketTexto)
            }
        }
    }

    const copiarAlPortapapeles = (texto) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(() => {
                alert('Ticket copiado. Abre RawBT y pega el texto.')
            }).catch(() => {
                mostrarTextoParaCopiar(texto)
            })
        } else {
            mostrarTextoParaCopiar(texto)
        }
    }

    const mostrarTextoParaCopiar = (texto) => {
        const textarea = document.createElement('textarea')
        textarea.value = texto
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        try {
            document.execCommand('copy')
            alert('Ticket copiado. Abre RawBT y pega el texto.')
        } catch (err) {
            alert('No se pudo copiar. Intenta manualmente.')
            console.error('Error al copiar:', err)
        }
        document.body.removeChild(textarea)
    }

    const formatearFecha = (fecha) => {
        const date = new Date(fecha)
        const dia = String(date.getDate()).padStart(2, '0')
        const mes = String(date.getMonth() + 1).padStart(2, '0')
        const año = date.getFullYear()
        const hora = String(date.getHours()).padStart(2, '0')
        const min = String(date.getMinutes()).padStart(2, '0')
        return `${dia}/${mes}/${año} ${hora}:${min}`
    }

    const formatearMoneda = (monto) => {
        return formatCurrency(monto, {
            currency: monedaEmpresa,
            locale: localeEmpresa,
            symbol: simboloEmpresa
        })
    }

    const esMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
    }

    const capturarComprobanteComoImagen = async () => {
        if (!boucherRef.current) {
            throw new Error('No se pudo encontrar el comprobante')
        }

        try {
            const canvas = await html2canvas(boucherRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true,
                width: boucherRef.current.scrollWidth,
                height: boucherRef.current.scrollHeight
            })

            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob)
                }, 'image/png', 0.95)
            })
        } catch (error) {
            console.error('Error al capturar comprobante:', error)
            throw error
        }
    }

    const generarTextoComprobante = () => {
        if (!venta || !empresa) return ''

        let texto = `*${empresa.nombre_empresa || empresa.razon_social}*\n\n`
        texto += `${venta.tipo_comprobante_nombre}\n`
        texto += `NCF: ${venta.ncf}\n`
        texto += `No. ${venta.numero_interno}\n\n`
        texto += `Fecha: ${formatearFecha(venta.fecha_venta)}\n`
        if (venta.cliente_nombre) {
            texto += `Cliente: ${venta.cliente_nombre}\n`
        }
        texto += `\n*Productos:*\n`
        venta.productos.forEach(p => {
            const unidadVenta = p.unidad_venta_abreviatura || p.unidad_base_abreviatura || ''
            const unidadBase = p.unidad_base_abreviatura || ''
            const hayConversion = p.cantidad_base && 
                                 p.cantidad_base !== p.cantidad &&
                                 unidadVenta !== unidadBase &&
                                 p.unidad_medida_id !== p.producto_unidad_base_id
            
            const cantidadFormateada = parseFloat(p.cantidad).toFixed(3).replace(/\.?0+$/, '')
            
            let cantidadTexto = `${cantidadFormateada} ${unidadVenta}`
            if (hayConversion && p.cantidad_base) {
                const cantidadBaseFormateada = parseFloat(p.cantidad_base).toFixed(2).replace(/\.?0+$/, '')
                cantidadTexto = `${cantidadFormateada} ${unidadVenta} (${cantidadBaseFormateada} ${unidadBase})`
            }
            
            texto += `${cantidadTexto} × ${formatearMoneda(p.precio_unitario)} = ${formatearMoneda(p.total)}\n`
        })
        texto += `\n*Total: ${formatearMoneda(venta.total)}*\n`
        texto += `Método de Pago: ${venta.metodo_pago_texto}\n`
        texto += `\n¡GRACIAS POR SU COMPRA!`

        return texto
    }

    const compartirPorWhatsApp = async () => {
        try {
            const esMobileDevice = esMobile()

            if (esMobileDevice) {
                // En mobile, intentar usar Web Share API con imagen
                await compartirWhatsAppMobileConImagen()
            } else {
                // En desktop, mostrar modal para ingresar número
                setNumeroWhatsApp(venta?.cliente_telefono || '')
                setMostrarModalWhatsApp(true)
            }
        } catch (error) {
            console.error('Error al compartir por WhatsApp:', error)
            // Si falla, mostrar modal como fallback
            setNumeroWhatsApp(venta?.cliente_telefono || '')
            setMostrarModalWhatsApp(true)
        }
    }

    const compartirWhatsAppDesktop = async (numeroTelefono) => {
        try {
            // Limpiar número (solo números)
            const numeroLimpio = numeroTelefono.replace(/\D/g, '')

            // 1. Abrir WhatsApp Web con el número y texto del comprobante
            const textoComprobante = generarTextoComprobante()
            const textoCodificado = encodeURIComponent(textoComprobante)
            const urlWhatsApp = `https://web.whatsapp.com/send?phone=${numeroLimpio}&text=${textoCodificado}`
            window.open(urlWhatsApp, '_blank')

            // 2. Capturar y descargar imagen del comprobante
            try {
                const imageBlob = await capturarComprobanteComoImagen()

                // Crear URL de la imagen
                const imageUrl = URL.createObjectURL(imageBlob)

                // Crear enlace de descarga
                const link = document.createElement('a')
                link.href = imageUrl
                link.download = `comprobante_${venta.numero_interno}_${Date.now()}.png`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                // Liberar URL después de un tiempo
                setTimeout(() => URL.revokeObjectURL(imageUrl), 100)

                // 3. Mostrar mensaje con instrucciones
                setTimeout(() => {
                    alert('✅ WhatsApp Web abierto con el texto del comprobante.\n✅ Imagen del comprobante descargada.\n\n📸 Para enviar la imagen:\n1. En WhatsApp Web, el contacto ya está seleccionado\n2. Arrastra el archivo descargado a la conversación\n3. O haz clic en el botón de adjuntar y selecciona el archivo\n\n💡 El texto ya está en el mensaje, puedes enviarlo ahora o agregar la imagen.')
                }, 500)
            } catch (error) {
                console.error('Error al capturar imagen:', error)
                // Si falla la imagen, el texto ya se envió
                alert('✅ WhatsApp Web abierto con el texto del comprobante.\n\n⚠️ No se pudo descargar la imagen, pero puedes compartir el texto del comprobante.')
            }
        } catch (error) {
            console.error('Error al compartir por WhatsApp Desktop:', error)
            alert('Error al compartir el comprobante. Intenta nuevamente.')
        }
    }

    const compartirWhatsAppMobileConImagen = async () => {
        try {
            // Verificar si Web Share API está disponible
            if (!navigator.share) {
                // Fallback: mostrar modal para compartir por número
                setNumeroWhatsApp(venta?.cliente_telefono || '')
                setMostrarModalWhatsApp(true)
                return
            }

            // Capturar imagen del comprobante
            const imageBlob = await capturarComprobanteComoImagen()

            // Crear archivo para compartir
            const file = new File([imageBlob], `comprobante_${venta.numero_interno}.png`, { type: 'image/png' })

            // Verificar si se puede compartir el archivo
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                // Compartir con Web Share API (incluye imagen)
                await navigator.share({
                    files: [file],
                    title: 'Comprobante de Venta',
                    text: `Comprobante ${venta.numero_interno} - ${empresa.nombre_empresa || empresa.razon_social}`
                })
            } else {
                // Si no se puede compartir archivo, compartir texto con número
                setNumeroWhatsApp(venta?.cliente_telefono || '')
                setMostrarModalWhatsApp(true)
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                // Usuario canceló, no hacer nada
                return
            }
            console.error('Error al compartir con Web Share API:', error)
            // Fallback: mostrar modal para compartir por número
            setNumeroWhatsApp(venta?.cliente_telefono || '')
            setMostrarModalWhatsApp(true)
        }
    }

    const compartirWhatsAppMobile = async () => {
        if (!numeroWhatsApp.trim()) {
            alert('Por favor ingresa un número de teléfono')
            return
        }

        // Limpiar número (solo números)
        const numeroLimpio = numeroWhatsApp.replace(/\D/g, '')
        if (numeroLimpio.length < 8) {
            alert('Por favor ingresa un número de teléfono válido')
            return
        }

        try {
            const textoComprobante = generarTextoComprobante()
            const textoCodificado = encodeURIComponent(textoComprobante)

            // URL de WhatsApp con número y texto
            const urlWhatsApp = `https://wa.me/${numeroLimpio}?text=${textoCodificado}`

            // Abrir WhatsApp App
            window.location.href = urlWhatsApp

            setMostrarModalWhatsApp(false)
            setNumeroWhatsApp('')
        } catch (error) {
            console.error('Error al compartir por WhatsApp Mobile:', error)
            alert('Error al compartir el comprobante. Intenta nuevamente.')
        }
    }

    const manejarEnviarWhatsApp = async () => {
        if (!numeroWhatsApp.trim()) {
            alert('Por favor ingresa un número de teléfono')
            return
        }

        // Limpiar número (solo números)
        const numeroLimpio = numeroWhatsApp.replace(/\D/g, '')
        if (numeroLimpio.length < 8) {
            alert('Por favor ingresa un número de teléfono válido')
            return
        }

        const esMobileDevice = esMobile()
        const numeroParaEnviar = numeroWhatsApp

        // Cerrar modal antes de redirigir
        setMostrarModalWhatsApp(false)
        setNumeroWhatsApp('')

        if (esMobileDevice) {
            // En mobile, usar WhatsApp App
            // Nota: compartirWhatsAppMobile usa el estado numeroWhatsApp que ya resetamos
            // Necesitamos pasar el número directamente
            const textoComprobante = generarTextoComprobante()
            const textoCodificado = encodeURIComponent(textoComprobante)
            const urlWhatsApp = `https://wa.me/${numeroLimpio}?text=${textoCodificado}`
            window.location.href = urlWhatsApp
        } else {
            // En desktop, usar WhatsApp Web
            await compartirWhatsAppDesktop(numeroParaEnviar)
        }
    }

    const cerrarModalWhatsApp = () => {
        setMostrarModalWhatsApp(false)
        setNumeroWhatsApp('')
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <div className={estilos.spinner}></div>
                    <p>Preparando boucher...</p>
                </div>
            </div>
        )
    }

    if (error || !venta || !empresa) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <h2>Error al cargar el boucher</h2>
                    <p>{error || 'No se pudo cargar la información'}</p>
                    <button onClick={() => router.push('/admin/ventas')} className={estilos.btnCerrar}>
                        Cerrar
                    </button>
                </div>
            </div>
        )
    }

    const esAndroid = /Android/i.test(navigator.userAgent)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.controles} ${estilos[tema]}`}>
                <div className={estilos.selectores}>
                    <h3>Tamaño de Papel</h3>
                    <div className={estilos.botonesTabaño}>
                        <button
                            className={`${estilos.btnTamaño} ${estilos[tema]} ${tamañoPapel === '58mm' ? estilos.activo : ''}`}
                            onClick={() => cambiarTamañoPapel('58mm')}
                        >
                            58mm
                        </button>
                        <button
                            className={`${estilos.btnTamaño} ${estilos[tema]} ${tamañoPapel === '80mm' ? estilos.activo : ''}`}
                            onClick={() => cambiarTamañoPapel('80mm')}
                        >
                            80mm
                        </button>
                        <button
                            className={`${estilos.btnTamaño} ${estilos[tema]} ${tamañoPapel === 'A4' ? estilos.activo : ''}`}
                            onClick={() => cambiarTamañoPapel('A4')}
                        >
                            A4
                        </button>
                    </div>
                </div>

                {qzDisponible && impresoras.length > 0 && (
                    <div className={estilos.selectores}>
                        <h3>Impresora</h3>
                        <select
                            value={impresoraSeleccionada}
                            onChange={(e) => cambiarImpresora(e.target.value)}
                            className={`${estilos.selectImpresora} ${estilos[tema]}`}
                        >
                            {impresoras.map((impresora, index) => (
                                <option key={index} value={impresora}>
                                    {impresora}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

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
                        <span>Compartir por WhatsApp</span>
                    </button>

                    <button onClick={() => router.push('/admin/ventas')} className={estilos.btnCerrar}>
                        Cerrar
                    </button>
                </div>
            </div>

            <div className={estilos.vistaPrevia}>
                <div className={`${estilos.panelOpciones} ${estilos[tema]}`}>
                    <h3>Mostrar en Boucher</h3>
                    <div className={estilos.listaOpciones}>
                        <label className={estilos.opcionLabel}>
                            <span>Datos Empresa</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarDatosEmpresa ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarDatosEmpresa')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Datos Cliente</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarDatosCliente ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarDatosCliente')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Vendedor</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarVendedor ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarVendedor')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Método Pago</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarMetodoPago ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarMetodoPago')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Notas</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarNotas ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarNotas')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Extras</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarExtras ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarExtras')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Mensaje Final</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarMensajeFinal ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarMensajeFinal')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>Código Barras</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarCodigoBarras ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarCodigoBarras')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>
                    </div>
                </div>

                <div ref={boucherRef} className={`${estilos.boucher} ${estilos[tamañoPapel]}`} data-size={tamañoPapel}>
                    {opciones.mostrarDatosEmpresa && (
                        <>
                            <div className={estilos.encabezado}>
                                <h1>{empresa.nombre_empresa}</h1>
                                <p>{empresa.razon_social}</p>
                                <p>RNC: {empresa.rnc}</p>
                                <p>{empresa.direccion}</p>
                                {empresa.telefono && <p>Tel: {empresa.telefono}</p>}
                            </div>
                            <div className={estilos.linea}></div>
                        </>
                    )}

                    <div className={estilos.comprobante}>
                        <p className={estilos.tipoDoc}>{venta.tipo_comprobante_nombre}</p>
                        <p className={estilos.ncf}>NCF: {venta.ncf}</p>
                        <p>No. {venta.numero_interno}</p>
                    </div>

                    <div className={estilos.linea}></div>

                    <div className={estilos.info}>
                        <p><strong>Fecha:</strong> {formatearFecha(venta.fecha_venta)}</p>
                        {opciones.mostrarVendedor && (
                            <p><strong>Vendedor:</strong> {venta.usuario_nombre}</p>
                        )}
                        {opciones.mostrarDatosCliente && (
                            venta.cliente_id ? (
                                <>
                                    <p><strong>Cliente:</strong> {venta.cliente_nombre}</p>
                                    <p><strong>{venta.cliente_tipo_documento}:</strong> {venta.cliente_numero_documento}</p>
                                </>
                            ) : (
                                <p><strong>Cliente:</strong> Consumidor Final</p>
                            )
                        )}
                    </div>

                    <div className={estilos.linea}></div>

                    <table className={estilos.productos}>
                        <thead>
                            <tr>
                                <th>Cant</th>
                                <th>Descripción</th>
                                <th>Precio</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {venta.productos.map((producto, index) => {
                                const cantidadPendiente = producto.cantidad - producto.cantidad_despachada
                                const esDespachoParcial = cantidadPendiente > 0
                                
                                // Determinar si hay conversión de unidad
                                const unidadVenta = producto.unidad_venta_abreviatura || producto.unidad_base_abreviatura || ''
                                const unidadBase = producto.unidad_base_abreviatura || ''
                                const hayConversion = producto.cantidad_base && 
                                                     producto.cantidad_base !== producto.cantidad &&
                                                     unidadVenta !== unidadBase &&
                                                     producto.unidad_medida_id !== producto.producto_unidad_base_id
                                
                                // Formatear cantidad con unidad
                                const formatearCantidadConUnidad = () => {
                                    const cantidadFormateada = parseFloat(producto.cantidad).toFixed(3).replace(/\.?0+$/, '')
                                    
                                    if (esDespachoParcial) {
                                        const cantidadDespachadaFormateada = parseFloat(producto.cantidad_despachada).toFixed(3).replace(/\.?0+$/, '')
                                        if (hayConversion && producto.cantidad_base) {
                                            const cantidadBaseFormateada = parseFloat(producto.cantidad_base).toFixed(2).replace(/\.?0+$/, '')
                                            return (
                                                <span>
                                                    {cantidadDespachadaFormateada}/{cantidadFormateada} {unidadVenta}
                                                    {hayConversion && ` (${cantidadBaseFormateada} ${unidadBase})`}
                                                </span>
                                            )
                                        }
                                        return <span>{cantidadDespachadaFormateada}/{cantidadFormateada} {unidadVenta}</span>
                                    }
                                    
                                    if (hayConversion && producto.cantidad_base) {
                                        const cantidadBaseFormateada = parseFloat(producto.cantidad_base).toFixed(2).replace(/\.?0+$/, '')
                                        return (
                                            <span>
                                                {cantidadFormateada} {unidadVenta} ({cantidadBaseFormateada} {unidadBase})
                                            </span>
                                        )
                                    }
                                    
                                    return <span>{cantidadFormateada} {unidadVenta}</span>
                                }

                                return (
                                    <tr key={index}>
                                        <td className={estilos.centrado}>
                                            {formatearCantidadConUnidad()}
                                        </td>
                                        <td>
                                            {producto.nombre_producto}
                                            {esDespachoParcial && (
                                                <div style={{ fontSize: '0.85em', color: '#ef4444', marginTop: '2px' }}>
                                                    Pendiente: {parseFloat(cantidadPendiente).toFixed(3).replace(/\.?0+$/, '')} {unidadVenta}
                                                </div>
                                            )}
                                        </td>
                                        <td className={estilos.derecha}>
                                            {formatearMoneda(producto.precio_unitario)} / {unidadBase || unidadVenta}
                                        </td>
                                        <td className={estilos.derecha}>{formatearMoneda(producto.total)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {opciones.mostrarExtras && venta.extras && venta.extras.length > 0 && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.seccionExtras}>
                                <p className={estilos.tituloExtras}><strong>EXTRAS</strong></p>
                                <table className={estilos.productos}>
                                    <thead>
                                        <tr>
                                            <th>Cant</th>
                                            <th>Descripción</th>
                                            <th>Precio</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {venta.extras.map((extra, index) => (
                                            <tr key={index}>
                                                <td className={estilos.centrado}>{extra.cantidad}</td>
                                                <td>
                                                    {extra.nombre}
                                                    {extra.tipo && (
                                                        <div style={{ fontSize: '0.85em', color: '#64748b', marginTop: '2px' }}>
                                                            {extra.tipo}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className={estilos.derecha}>{formatearMoneda(extra.precio_unitario)}</td>
                                                <td className={estilos.derecha}>{formatearMoneda(extra.monto_total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    <div className={estilos.linea}></div>

                    <div className={estilos.totales}>
                        <div className={estilos.fila}>
                            <span>Subtotal:</span>
                            <span>{formatearMoneda(venta.subtotal)}</span>
                        </div>
                        {parseFloat(venta.descuento) > 0 && (
                            <div className={estilos.fila}>
                                <span>Descuento:</span>
                                <span>-{formatearMoneda(venta.descuento)}</span>
                            </div>
                        )}
                        <div className={estilos.fila}>
                            <span>{empresa.impuesto_nombre} ({empresa.impuesto_porcentaje}%):</span>
                            <span>{formatearMoneda(venta.itbis)}</span>
                        </div>
                        <div className={estilos.lineaDoble}></div>
                        <div className={`${estilos.fila} ${estilos.total}`}>
                            <span>TOTAL:</span>
                            <span>{formatearMoneda(venta.total)}</span>
                        </div>

                        {venta.metodo_pago === 'efectivo' && venta.efectivo_recibido && (
                            <>
                                <div className={estilos.lineaSencilla}></div>
                                <div className={estilos.fila}>
                                    <span>Recibido:</span>
                                    <span>{formatearMoneda(venta.efectivo_recibido)}</span>
                                </div>
                                <div className={estilos.fila}>
                                    <span>Cambio:</span>
                                    <span>{formatearMoneda(venta.cambio)}</span>
                                </div>
                            </>
                        )}

                        {opciones.mostrarMetodoPago && (
                            <>
                                <div className={estilos.lineaSencilla}></div>
                                <div className={estilos.fila}>
                                    <span>Método de Pago:</span>
                                    <span>{venta.metodo_pago_texto}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {opciones.mostrarNotas && venta.notas && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.notas}>
                                <p><strong>NOTA:</strong> {venta.notas}</p>
                            </div>
                        </>
                    )}

                    {opciones.mostrarCodigoBarras && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.codigoQR}>
                                <Barcode
                                    value={venta.numero_interno}
                                    format="CODE128"
                                    width={2}
                                    height={60}
                                    displayValue={true}
                                    fontSize={14}
                                    margin={10}
                                />
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
                                <p className={estilos.legal}>Comprobante fiscal autorizado DGII</p>
                                <p className={estilos.fecha}>{new Date().toLocaleDateString('es-DO')}</p>
                                <p className={estilos.gracias}>¡GRACIAS POR SU COMPRA!</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal WhatsApp para Mobile */}
            {mostrarModalWhatsApp && (
                <div className={estilos.modalOverlay} onClick={cerrarModalWhatsApp}>
                    <div className={`${estilos.modalWhatsApp} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>Compartir por WhatsApp</h3>
                            <button onClick={cerrarModalWhatsApp} className={estilos.btnCerrarModal}>
                                <ion-icon name="close"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <p className={estilos.modalTexto}>
                                Ingresa el número de teléfono del cliente (con código de país, sin +):
                            </p>
                            <input
                                type="tel"
                                value={numeroWhatsApp}
                                onChange={(e) => setNumeroWhatsApp(e.target.value)}
                                placeholder="Ej: 18091234567 o 8091234567"
                                className={`${estilos.inputWhatsApp} ${estilos[tema]}`}
                                autoFocus
                            />
                            <p className={estilos.modalAyuda}>
                                {esMobile()
                                    ? 'El comprobante se abrirá en WhatsApp con el número ingresado'
                                    : 'WhatsApp Web se abrirá con el texto y se descargará la imagen del comprobante'}
                            </p>
                            <div className={estilos.contenedorBotones}>
                                {/* NUEVA SECCIÓN: Impresión Bluetooth */}
                                <div className={estilos.seccionImpresion}>
                                    <div className={estilos.seccionHeader}>
                                        <h3 className={estilos.seccionTitulo}>
                                            🔵 Impresión Bluetooth (Recomendado)
                                        </h3>
                                        <span className={estilos.badgeNuevo}>Nuevo</span>
                                    </div>
                                    <p className={estilos.seccionDescripcion}>
                                        Conexión directa con tu impresora térmica Bluetooth.
                                        Sin necesidad de aplicaciones externas.
                                    </p>
                                    <PrinterButton ventaId={ventaId} />
                                </div>

                                {/* Separador */}
                                <div className={estilos.separador}></div>

                                {/* Sección QZ Tray (existente) */}
                                <div className={estilos.seccionImpresion}>
                                    <div className={estilos.seccionHeader}>
                                        <h3 className={estilos.seccionTitulo}>
                                            <FaPrint className={estilos.iconoImpresion} />
                                            Impresión Térmica (QZ Tray)
                                        </h3>
                                    </div>
                                    <p className={estilos.seccionDescripcion}>
                                        Impresión directa usando QZ Tray (Windows/Mac/Linux)
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button onClick={cerrarModalWhatsApp} className={estilos.btnCancelar}>
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