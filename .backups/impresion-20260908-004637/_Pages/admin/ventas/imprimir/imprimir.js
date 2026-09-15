"use client"
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Barcode from 'react-barcode'
import html2canvas from 'html2canvas'
import { obtenerVentaImprimir, firmarVentaECF } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './imprimir.module.css'
import { generarTicketESCPOS, esCampoEmpresaValido, esMismoTextoEmpresa } from '@/utils/escpos'
import { formatCurrency } from '@/utils/monedaUtils'
import {
    conectarQZTray,
    obtenerImpresoras,
    imprimirTextoRaw,
    buscarImpresoraTermica
} from '@/utils/qzTrayService'
import PrinterButton from './PrinterButton'
import PrinterButtonConPermiso from './PrinterButtonConPermiso'
import { FaPrint } from 'react-icons/fa'
import { usePermisoImpresion } from '@/hooks/usePermisoImpresion'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ImprimirVenta({ returnPath = '/admin/ventas' }) {
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
    const [firmandoECF, setFirmandoECF] = useState(false)
    const [firmaExitosa, setFirmaExitosa] = useState(false)
    const [errorFirma, setErrorFirma] = useState(null)
    const [errorFirmaTitulo, setErrorFirmaTitulo] = useState(null)
    const [errorFirmaTipo, setErrorFirmaTipo] = useState(null)
    const refFirmaAuto = useRef(false)
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const { tienePermiso: puedeFirmar } = usePermisoImpresion()

    const traducirMetodoPago = (metodo, texto) => {
        const key = (metodo || '').toLowerCase()
        const txt = (texto || '').toLowerCase()
        const map = {
            efectivo: tr('Efectivo', 'Cash'),
            tarjeta_debito: tr('Débito', 'Debit Card'),
            tarjeta_credito: tr('Tarjeta de Crédito', 'Credit Card'),
            transferencia: tr('Transferencia', 'Transfer'),
            cheque: tr('Cheque', 'Check'),
            credito: tr('Crédito', 'Credit'),
            financiamiento: tr('Financiamiento', 'Financing'),
            mixto: tr('Pago Mixto', 'Mixed Payment')
        }

        if (map[key]) return map[key]
        if (txt.includes('efectivo') || txt.includes('cash')) return map.efectivo
        if (txt.includes('debito') || txt.includes('débito')) return map.tarjeta_debito
        if (txt.includes('credito') || txt.includes('crédito') || txt.includes('credit card')) return map.tarjeta_credito
        if (txt.includes('transfer')) return map.transferencia
        if (txt.includes('cheque') || txt.includes('check')) return map.cheque
        if (txt.includes('financiamiento') || txt.includes('financing')) return map.financiamiento
        if (txt.includes('mixto') || txt.includes('mixed')) return map.mixto
        if (txt === 'credit') return map.credito

        return texto || tr('No especificado', 'Not specified')
    }

    const traducirTipoComprobante = (tipo) => {
        const t = (tipo || '').toLowerCase()
        if (t.includes('consumo')) return tr('Factura de Consumo', 'Consumer Invoice')
        if (t.includes('crédito fiscal') || t.includes('credito fiscal')) return tr('Comprobante de Crédito Fiscal', 'Tax Credit Receipt')
        if (t.includes('gubernamental')) return tr('Comprobante Gubernamental', 'Government Receipt')
        if (t.includes('especial')) return tr('Comprobante Especial', 'Special Receipt')
        if (t.includes('nota de crédito') || t.includes('nota de credito')) return tr('Nota de Crédito', 'Credit Note')
        if (t.includes('nota de débito') || t.includes('nota de debito')) return tr('Nota de Débito', 'Debit Note')
        return tipo || tr('Comprobante', 'Receipt')
    }

    const [opciones, setOpciones] = useState({
        mostrarDatosEmpresa: true,
        mostrarLogoEmpresa: true,
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
            const msg = String(error?.message || error || '').toLowerCase()
            if (!msg.includes('unable to establish connection with qz')) {
                console.warn('QZ Tray no disponible:', error?.message || error)
            }
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
                setError(resultado.mensaje || tr('Error al cargar venta', 'Error loading sale'))
            }
        } catch (error) {
            console.error('Error al cargar venta:', error)
            setError(tr('Error al cargar datos de la venta', 'Error loading sale data'))
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

    const estaFirmada = (v) => !!(v?.ecf_firmado)

    const limpiarErrorFirma = () => {
        setErrorFirma(null)
        setErrorFirmaTitulo(null)
        setErrorFirmaTipo(null)
    }

    const mostrarErrorFirma = (resultado) => {
        setErrorFirmaTitulo(resultado.titulo || null)
        setErrorFirmaTipo(resultado.tipo || resultado.codigo || null)
        setErrorFirma(resultado.mensaje || tr('No se pudo firmar el comprobante.', 'Could not sign the receipt.'))
    }

    const aplicarResultadoFirma = (resultado) => {
        if (resultado.success) {
            setFirmaExitosa(true)
            limpiarErrorFirma()
            if (resultado.firma) {
                setVenta(prev => ({
                    ...prev,
                    ecf_firmado: 1,
                    ecf_comprobante: resultado.firma.comprobante,
                    ecf_codigo_seguridad: resultado.firma.codigoSeguridad,
                    ecf_fecha_firma: resultado.firma.fechaFirma,
                    ecf_qr: resultado.firma.qr,
                    ecf_ambiente: prev?.ecf_ambiente,
                    ecf_ultimo_error: null
                }))
            }
            if (!resultado.yaFirmado) {
                alert(tr('Documento firmado electrónicamente exitosamente', 'Document signed electronically successfully'))
            }
            return true
        }

        mostrarErrorFirma(resultado)
        setVenta(prev => prev ? {
            ...prev,
            ecf_ultimo_error: resultado.titulo ? `${resultado.titulo}. ${resultado.mensaje}` : resultado.mensaje
        } : prev)
        return false
    }

    const manejarFirmaECF = async () => {
        if (!venta || firmandoECF) return

        setFirmandoECF(true)
        limpiarErrorFirma()
        try {
            const resultado = await firmarVentaECF(ventaId)
            aplicarResultadoFirma(resultado)
        } catch (error) {
            console.error('Error al firmar:', error)
            mostrarErrorFirma({
                tipo: 'conexion',
                codigo: 'ECF_SIN_CONEXION',
                titulo: tr('Pendiente integración con EFRENIS', 'EFRENIS integration pending'),
                mensaje: tr(
                    'No se pudo contactar el servicio de firma. Solicite al equipo técnico de EFRENIS SOFT el puerto y la configuración de conexión (API-EECF).',
                    'Could not reach the signing service. Ask EFRENIS SOFT technical team for the port and connection settings (API-EECF).'
                )
            })
        } finally {
            setFirmandoECF(false)
        }
    }

    useEffect(() => {
        if (cargando || !venta || !puedeFirmar || refFirmaAuto.current) return
        if (typeof window === 'undefined') return

        const params = new URLSearchParams(window.location.search)
        if (params.get('firmar') !== '1' || estaFirmada(venta)) return

        refFirmaAuto.current = true
        manejarFirmaECF()
    }, [cargando, venta, puedeFirmar])

    const manejarImprimirTermica = async () => {
        if (!impresoraSeleccionada) {
            alert(tr('Por favor selecciona una impresora', 'Please select a printer'))
            return
        }

        if (!venta || !empresa) {
            alert(tr('No hay datos para imprimir', 'No data to print'))
            return
        }

        setImprimiendo(true)

        try {
            const anchoLinea = tamañoPapel === '58mm' ? 32 : 42
            const ticketESCPOS = generarTicketESCPOS(venta, empresa, anchoLinea, language)

            await imprimirTextoRaw(impresoraSeleccionada, ticketESCPOS)

            alert(tr('Impresión enviada correctamente', 'Print sent successfully'))
        } catch (error) {
            console.error('Error al imprimir:', error)
            alert(tr('Error al imprimir: ', 'Print error: ') + error.message)
        } finally {
            setImprimiendo(false)
        }
    }

    const compartirTexto = async () => {
        if (!venta || !empresa) return

        const anchoLinea = tamañoPapel === '58mm' ? 32 : 42
        const ticketTexto = generarTicketESCPOS(venta, empresa, anchoLinea, language)

        const esAndroid = /Android/i.test(navigator.userAgent)

        if (esAndroid) {
            try {
                const blob = new Blob([ticketTexto], { type: 'text/plain' })
                const file = new File([blob], 'ticket.txt', { type: 'text/plain' })

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: tr('Imprimir con RawBT', 'Print with RawBT')
                    })
                } else if (navigator.share) {
                    await navigator.share({
                        text: ticketTexto,
                        title: tr('Imprimir con RawBT', 'Print with RawBT')
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
                        title: tr('Imprimir con RawBT', 'Print with RawBT')
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
                alert(tr('Ticket copiado. Abre RawBT y pega el texto.', 'Ticket copied. Open RawBT and paste the text.'))
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
            alert(tr('Ticket copiado. Abre RawBT y pega el texto.', 'Ticket copied. Open RawBT and paste the text.'))
        } catch (err) {
            alert(tr('No se pudo copiar. Intenta manualmente.', 'Could not copy. Try manually.'))
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

    const metodoPagoTicket = () => {
        if (venta?.financiamiento) return tr('Financiamiento', 'Financing')
        return traducirMetodoPago(venta?.metodo_pago, venta?.metodo_pago_texto)
    }

    const lineasFinanciamientoTexto = (fin) => {
        if (!fin) return ''
        let t = `\n--- ${tr('FINANCIAMIENTO', 'FINANCING')} ---\n`
        t += `${tr('Contrato', 'Contract')}: ${fin.numero_contrato}\n`
        t += `${tr('Plan', 'Plan')}: ${fin.plan_nombre}\n`
        t += `${tr('Total a pagar', 'Total to pay')}: ${formatearMoneda(fin.total_pagar)}\n`
        if (fin.pago_adelantado > 0) {
            t += `${tr('Pago adelantado', 'Advance payment')}: ${formatearMoneda(fin.pago_adelantado)}\n`
        }
        t += `${tr('Saldo pendiente', 'Balance due')}: ${formatearMoneda(fin.saldo_pendiente)}\n`
        if (fin.monto_atraso > 0) {
            t += `${tr('Monto en atraso', 'Overdue amount')}: ${formatearMoneda(fin.monto_atraso)}\n`
        }
        t += `${tr('Cuotas', 'Installments')}: ${fin.cuotas} · ${formatearMoneda(fin.cuota_mensual)}/${fin.frecuencia}\n`
        if (fin.proxima_cuota_monto != null && fin.proxima_cuota_numero != null) {
            t += `${tr('Proxima cuota', 'Next installment')}: ${formatearMoneda(fin.proxima_cuota_monto)} (#${fin.proxima_cuota_numero})\n`
        }
        return t
    }

    const esMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
    }

    const capturarComprobanteComoImagen = async () => {
        if (!boucherRef.current) {
            throw new Error(tr('No se pudo encontrar el comprobante', 'Could not find receipt'))
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
        texto += `${traducirTipoComprobante(venta.tipo_comprobante_nombre)}\n`
        texto += `NCF: ${venta.ncf}\n`
        texto += `No. ${venta.numero_interno}\n\n`
        texto += `${tr('Fecha', 'Date')}: ${formatearFecha(venta.fecha_venta)}\n`
        if (venta.cliente_nombre) {
            texto += `${tr('Cliente', 'Customer')}: ${venta.cliente_nombre}\n`
        }
        texto += `\n*${tr('Productos', 'Products')}:*\n`
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
        texto += `\n*${tr('Total', 'Total')}: ${formatearMoneda(venta.total)}*\n`
        texto += `${tr('Método de Pago', 'Payment Method')}: ${metodoPagoTicket()}\n`
        if (venta.financiamiento) texto += lineasFinanciamientoTexto(venta.financiamiento)
        texto += `\n${tr('¡GRACIAS POR SU COMPRA!', 'THANK YOU FOR YOUR PURCHASE!')}`

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
                    alert(tr('✅ WhatsApp Web abierto con el texto del comprobante.\n✅ Imagen del comprobante descargada.\n\n📸 Para enviar la imagen:\n1. En WhatsApp Web, el contacto ya está seleccionado\n2. Arrastra el archivo descargado a la conversación\n3. O haz clic en el botón de adjuntar y selecciona el archivo\n\n💡 El texto ya está en el mensaje, puedes enviarlo ahora o agregar la imagen.', '✅ WhatsApp Web opened with receipt text.\n✅ Receipt image downloaded.\n\n📸 To send the image:\n1. In WhatsApp Web, the contact is already selected\n2. Drag the downloaded file into the conversation\n3. Or click attach and select the file\n\n💡 The text is already in the message; you can send now or add the image.'))
                }, 500)
            } catch (error) {
                console.error('Error al capturar imagen:', error)
                // Si falla la imagen, el texto ya se envió
                alert(tr('✅ WhatsApp Web abierto con el texto del comprobante.\n\n⚠️ No se pudo descargar la imagen, pero puedes compartir el texto del comprobante.', '✅ WhatsApp Web opened with receipt text.\n\n⚠️ Could not download image, but you can share the receipt text.'))
            }
        } catch (error) {
            console.error('Error al compartir por WhatsApp Desktop:', error)
            alert(tr('Error al compartir el comprobante. Intenta nuevamente.', 'Error sharing receipt. Please try again.'))
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
                    title: tr('Comprobante de Venta', 'Sale Receipt'),
                    text: `${tr('Comprobante', 'Receipt')} ${venta.numero_interno} - ${empresa.nombre_empresa || empresa.razon_social}`
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
            alert(tr('Por favor ingresa un número de teléfono', 'Please enter a phone number'))
            return
        }

        // Limpiar número (solo números)
        const numeroLimpio = numeroWhatsApp.replace(/\D/g, '')
        if (numeroLimpio.length < 8) {
            alert(tr('Por favor ingresa un número de teléfono válido', 'Please enter a valid phone number'))
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
            alert(tr('Error al compartir el comprobante. Intenta nuevamente.', 'Error sharing receipt. Please try again.'))
        }
    }

    const manejarEnviarWhatsApp = async () => {
        if (!numeroWhatsApp.trim()) {
            alert(tr('Por favor ingresa un número de teléfono', 'Please enter a phone number'))
            return
        }

        // Limpiar número (solo números)
        const numeroLimpio = numeroWhatsApp.replace(/\D/g, '')
        if (numeroLimpio.length < 8) {
            alert(tr('Por favor ingresa un número de teléfono válido', 'Please enter a valid phone number'))
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
        return <LoadingScreen />
    }

    if (error || !venta || !empresa) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.error}>
                    <h2>{tr('Error al cargar el boucher', 'Error loading voucher')}</h2>
                    <p>{error || tr('No se pudo cargar la información', 'Could not load information')}</p>
                    <button onClick={() => router.push(returnPath)} className={estilos.btnCerrar}>
                        {tr('Cerrar', 'Close')}
                    </button>
                </div>
            </div>
        )
    }

    const esAndroid = /Android/i.test(navigator.userAgent)
    const ventaFirmada = estaFirmada(venta)
    const requiereFirmaECF = venta.ncf && String(venta.ncf).toUpperCase().startsWith('E')

    const imagenQrFirma = (url) => {
        if (!url) return null
        const texto = String(url).trim()
        if (/^https?:\/\//i.test(texto)) {
            return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=${encodeURIComponent(texto)}`
        }
        return texto
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.controles} ${estilos[tema]}`}>
                <div className={estilos.selectores}>
                    <h3>{tr('Tamaño de Papel', 'Paper Size')}</h3>
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
                        <h3>{tr('Impresora', 'Printer')}</h3>
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
                    {errorFirma && !ventaFirmada && (
                        <div className={`${estilos.errorFirmaECF} ${errorFirmaTipo ? estilos[`errorFirma_${errorFirmaTipo}`] || '' : ''}`}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                            <div className={estilos.errorFirmaTexto}>
                                {errorFirmaTitulo && <strong>{errorFirmaTitulo}</strong>}
                                <span>{errorFirma}</span>
                            </div>
                        </div>
                    )}

                    {ventaFirmada && firmaExitosa && (
                        <div className={estilos.exitoFirmaECF}>
                            <ion-icon name="shield-checkmark-outline"></ion-icon>
                            <span>{tr('e-NCF firmado correctamente', 'e-NCF signed successfully')}</span>
                        </div>
                    )}

                    {qzDisponible && (
                        <button
                            onClick={manejarImprimirTermica}
                            className={estilos.btnImprimir}
                            disabled={imprimiendo}
                        >
                            {imprimiendo ? tr('Imprimiendo...', 'Printing...') : tr('Imprimir Térmica', 'Thermal Print')}
                        </button>
                    )}

                    {esAndroid && (
                        <button onClick={compartirTexto} className={estilos.btnCompartir}>
                            {tr('Compartir (RawBT)', 'Share (RawBT)')}
                        </button>
                    )}

                    <button
                        onClick={manejarImprimirNavegador}
                        className={estilos.btnImprimirNav}
                        disabled={requiereFirmaECF && !ventaFirmada}
                        title={requiereFirmaECF && !ventaFirmada ? tr('Firme el e-NCF primero', 'Sign e-NCF first') : ''}
                    >
                        {tr('Imprimir Normal', 'Normal Print')}
                    </button>

                    <button onClick={compartirPorWhatsApp} className={estilos.btnWhatsApp}>
                        <ion-icon name="logo-whatsapp"></ion-icon>
                        <span>{tr('Compartir por WhatsApp', 'Share via WhatsApp')}</span>
                    </button>

                    {/* Botón de Firma Electrónica ECF - Solo usuarios con permiso */}
                    {puedeFirmar && venta && !ventaFirmada && (
                        <button
                            onClick={manejarFirmaECF}
                            className={estilos.btnFirmarECF}
                            disabled={firmandoECF}
                        >
                            {firmandoECF ? (
                                <><ion-icon name="hourglass-outline" className={estilos.iconRotate}></ion-icon>
                                <span>{tr('Firmando...', 'Signing...')}</span></>
                            ) : (
                                <><ion-icon name="create-outline"></ion-icon>
                                <span>{tr('Firmar e-NCF', 'Sign e-NCF')}</span></>
                            )}
                        </button>
                    )}

                    <button onClick={() => router.push(returnPath)} className={estilos.btnCerrar}>
                        {tr('Cerrar', 'Close')}
                    </button>
                </div>
            </div>

            <div className={estilos.vistaPrevia}>
                <div className={`${estilos.panelOpciones} ${estilos[tema]}`}>
                    <h3>{tr('Mostrar en Boucher', 'Show on Voucher')}</h3>
                    <div className={estilos.listaOpciones}>
                        <label className={estilos.opcionLabel}>
                            <span>{tr('Datos Empresa', 'Company Data')}</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarDatosEmpresa ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarDatosEmpresa')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>
                        {empresa?.logo_url && (
                            <label className={estilos.opcionLabel}>
                                <span>{tr('Logo Empresa', 'Company Logo')}</span>
                                <button
                                    className={`${estilos.switch} ${opciones.mostrarLogoEmpresa ? estilos.activo : ''}`}
                                    onClick={() => toggleOpcion('mostrarLogoEmpresa')}
                                >
                                    <span className={estilos.switchSlider}></span>
                                </button>
                            </label>
                        )}

                        <label className={estilos.opcionLabel}>
                            <span>{tr('Datos Cliente', 'Customer Data')}</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarDatosCliente ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarDatosCliente')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>{tr('Vendedor', 'Seller')}</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarVendedor ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarVendedor')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>{tr('Método Pago', 'Payment Method')}</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarMetodoPago ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarMetodoPago')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>{tr('Notas', 'Notes')}</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarNotas ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarNotas')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>{tr('Extras', 'Extras')}</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarExtras ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarExtras')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>{tr('Mensaje Final', 'Final Message')}</span>
                            <button
                                className={`${estilos.switch} ${opciones.mostrarMensajeFinal ? estilos.activo : ''}`}
                                onClick={() => toggleOpcion('mostrarMensajeFinal')}
                            >
                                <span className={estilos.switchSlider}></span>
                            </button>
                        </label>

                        <label className={estilos.opcionLabel}>
                            <span>{tr('Código Barras', 'Barcode')}</span>
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
                                {opciones.mostrarLogoEmpresa && empresa.logo_url && (
                                    <img
                                        src={empresa.logo_url}
                                        alt={empresa.nombre_empresa}
                                        style={{ maxHeight: '60px', maxWidth: '140px', objectFit: 'contain', marginBottom: '6px', display: 'block', margin: '0 auto 6px auto' }}
                                    />
                                )}
                                <h1>{empresa.nombre_empresa}</h1>
                                {esCampoEmpresaValido(empresa.razon_social) && !esMismoTextoEmpresa(empresa.razon_social, empresa.nombre_empresa) && (
                                    <p>{empresa.razon_social}</p>
                                )}
                                <p>RNC: {empresa.rnc}</p>
                                {esCampoEmpresaValido(empresa.direccion) && <p>{empresa.direccion}</p>}
                                {empresa.telefono && <p>Tel: {empresa.telefono}</p>}
                            </div>
                            <div className={estilos.linea}></div>
                        </>
                    )}

                    <div className={estilos.comprobante}>
                        <p className={estilos.tipoDoc}>{traducirTipoComprobante(venta.tipo_comprobante_nombre)}</p>
                        <p className={estilos.ncf}>NCF: {venta.ncf}</p>
                        <p>No. {venta.numero_interno}</p>
                    </div>

                    <div className={estilos.linea}></div>

                    <div className={estilos.info}>
                        <p><strong>{tr('Fecha', 'Date')}:</strong> {formatearFecha(venta.fecha_venta)}</p>
                        {opciones.mostrarVendedor && (
                            <p><strong>{tr('Vendedor', 'Seller')}:</strong> {venta.usuario_nombre}</p>
                        )}
                        {opciones.mostrarDatosCliente && (
                            venta.cliente_id ? (
                                <>
                                    <p><strong>{tr('Cliente', 'Customer')}:</strong> {venta.cliente_nombre}</p>
                                    <p><strong>{venta.cliente_tipo_documento}:</strong> {venta.cliente_numero_documento}</p>
                                </>
                            ) : (
                                <p><strong>{tr('Cliente', 'Customer')}:</strong> {tr('Consumidor Final', 'Final Consumer')}</p>
                            )
                        )}
                    </div>

                    <div className={estilos.linea}></div>

                    <table className={estilos.productos}>
                        <thead>
                            <tr>
                                <th>{tr('Cant', 'Qty')}</th>
                                <th>{tr('Descripción', 'Description')}</th>
                                <th>{tr('Precio', 'Price')}</th>
                                <th>{tr('Total', 'Total')}</th>
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
                                                    {tr('Pendiente', 'Pending')}: {parseFloat(cantidadPendiente).toFixed(3).replace(/\.?0+$/, '')} {unidadVenta}
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
                                            <th>{tr('Cant', 'Qty')}</th>
                                            <th>{tr('Descripción', 'Description')}</th>
                                            <th>{tr('Precio', 'Price')}</th>
                                            <th>{tr('Total', 'Total')}</th>
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
                            <span>{tr('Subtotal:', 'Subtotal:')}</span>
                            <span>{formatearMoneda(venta.subtotal)}</span>
                        </div>
                        {parseFloat(venta.descuento) > 0 && (
                            <div className={estilos.fila}>
                                <span>{tr('Descuento:', 'Discount:')}</span>
                                <span>-{formatearMoneda(venta.descuento)}</span>
                            </div>
                        )}
                        <div className={estilos.fila}>
                            <span>{empresa.impuesto_nombre} ({empresa.impuesto_porcentaje}%):</span>
                            <span>{formatearMoneda(venta.itbis)}</span>
                        </div>
                        <div className={estilos.lineaDoble}></div>
                        <div className={estilos.totalDestacado}>
                            <div className={estilos.totalLabel}>TOTAL</div>
                            <div className={`${estilos.totalMonto} ${String(formatearMoneda(venta.total)).length > 12 ? estilos.totalMontoLargo : ''}`}>
                                {formatearMoneda(venta.total)}
                            </div>
                        </div>

                        {venta.metodo_pago === 'efectivo' && venta.efectivo_recibido && (
                            <>
                                <div className={estilos.lineaSencilla}></div>
                                <div className={estilos.fila}>
                                    <span>{tr('Recibido:', 'Received:')}</span>
                                    <span>{formatearMoneda(venta.efectivo_recibido)}</span>
                                </div>
                                <div className={estilos.fila}>
                                    <span>{tr('Cambio:', 'Change:')}</span>
                                    <span>{formatearMoneda(venta.cambio)}</span>
                                </div>
                            </>
                        )}

{opciones.mostrarMetodoPago && (
    <>
        <div className={estilos.lineaSencilla}></div>

        {venta.metodo_pago === 'mixto' && venta.pagos_mixtos?.length > 0 ? (
            <>
                <div className={estilos.fila}>
                    <span>{tr('Método de Pago:', 'Payment Method:')}</span>
                        <span>{traducirMetodoPago('mixto', venta.metodo_pago_texto)}</span>
                </div>
                {venta.pagos_mixtos.map((pago, i) => (
                    <div key={i} className={estilos.fila} style={{ paddingLeft: 12, fontSize: '0.9em', opacity: 0.85 }}>
                        <span>• {traducirMetodoPago(pago.metodo_pago, pago.metodo_pago_texto)}:</span>
                        <span>{formatearMoneda(pago.monto)}</span>
                    </div>
                ))}
                {venta.pagos_mixtos.reduce((a, p) => a + p.monto, 0) > parseFloat(venta.total) && (
                    <div className={estilos.fila} style={{ paddingLeft: 12, fontSize: '0.9em' }}>
                        <span>• {tr('Vuelto', 'Change')}:</span>
                        <span>{formatearMoneda(venta.pagos_mixtos.reduce((a, p) => a + p.monto, 0) - parseFloat(venta.total))}</span>
                    </div>
                )}
            </>
        ) : (
            <div className={estilos.fila}>
                <span>{tr('Método de Pago:', 'Payment Method:')}</span>
                <span>{metodoPagoTicket()}</span>
            </div>
        )}

        {venta.financiamiento?.numero_contrato && (
            <>
                <div className={estilos.lineaSencilla}></div>
                <div className={`${estilos.fila} ${estilos.finTipoVenta}`}>
                    <span>{tr('Tipo de venta:', 'Sale type:')}</span>
                    <span>{tr('Financiamiento', 'Financing')}</span>
                </div>
                <div className={estilos.fila}>
                    <span>{tr('Contrato:', 'Contract:')}</span>
                    <span>{venta.financiamiento.numero_contrato}</span>
                </div>
                <div className={estilos.fila}>
                    <span>{tr('Plan:', 'Plan:')}</span>
                    <span>{venta.financiamiento.plan_nombre}</span>
                </div>
                <div className={estilos.fila}>
                    <span>{tr('Total a pagar:', 'Total to pay:')}</span>
                    <span>{formatearMoneda(venta.financiamiento.total_pagar)}</span>
                </div>
                {venta.financiamiento.pago_adelantado > 0 && (
                    <div className={estilos.fila}>
                        <span>{tr('Pago adelantado:', 'Advance payment:')}</span>
                        <span>{formatearMoneda(venta.financiamiento.pago_adelantado)}</span>
                    </div>
                )}
                <div className={estilos.fila}>
                    <span>{tr('Saldo pendiente:', 'Balance due:')}</span>
                    <span>{formatearMoneda(venta.financiamiento.saldo_pendiente)}</span>
                </div>
                {venta.financiamiento.monto_atraso > 0 && (
                    <div className={estilos.fila}>
                        <span>{tr('Monto en atraso:', 'Overdue amount:')}</span>
                        <span>{formatearMoneda(venta.financiamiento.monto_atraso)}</span>
                    </div>
                )}
                <div className={estilos.fila}>
                    <span>{tr('Cuotas:', 'Installments:')}</span>
                    <span>{venta.financiamiento.cuotas} × {formatearMoneda(venta.financiamiento.cuota_mensual)}</span>
                </div>
                {venta.financiamiento.proxima_cuota_monto != null && (
                    <div className={estilos.fila}>
                        <span>{tr('Proxima cuota:', 'Next installment:')}</span>
                        <span>{formatearMoneda(venta.financiamiento.proxima_cuota_monto)} (#{venta.financiamiento.proxima_cuota_numero})</span>
                    </div>
                )}
            </>
        )}
    </>
)}
                    </div>

                    {opciones.mostrarNotas && venta.notas && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.notas}>
                                <p><strong>{tr('NOTA:', 'NOTE:')}</strong> {venta.notas}</p>
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
                                    height={50}
                                    displayValue={false}
                                    margin={6}
                                />
                            </div>
                        </>
                    )}

                    {opciones.mostrarMensajeFinal && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.footer}>
                                {esCampoEmpresaValido(empresa.mensaje_factura) && (
                                    <p className={estilos.mensaje}>{empresa.mensaje_factura}</p>
                                )}
                                <p className={estilos.gracias}>{tr('¡GRACIAS POR SU COMPRA!', 'THANK YOU FOR YOUR PURCHASE!')}</p>
                            </div>
                        </>
                    )}

                    {/* Sección de Firma Electrónica ECF */}
                    {ventaFirmada && (
                        <>
                            <div className={estilos.linea}></div>
                            <div className={estilos.seccionFirmaECF}>
                                <div className={estilos.encabezadoFirma}>
                                    <ion-icon name="shield-checkmark-outline"></ion-icon>
                                    <span className={estilos.tituloFirma}>
                                        {tr('Comprobante Firmado Electrónicamente', 'Electronically Signed Receipt')}
                                    </span>
                                </div>
                                <div className={estilos.datosFirma}>
                                    <div className={estilos.datoFirma}>
                                        <span className={estilos.label}>{tr('NCF', 'NCF')}:</span>
                                        <span className={estilos.valor}>{venta.ecf_comprobante || venta.ncf}</span>
                                    </div>
                                    <div className={estilos.datoFirma}>
                                        <span className={estilos.label}>{tr('Código de Seguridad', 'Security Code')}:</span>
                                        <span className={`${estilos.valor} ${estilos.codigoSeguridad}`}>
                                            {venta.ecf_codigo_seguridad}
                                        </span>
                                    </div>
                                    <div className={estilos.datoFirma}>
                                        <span className={estilos.label}>{tr('Fecha de Firma', 'Signature Date')}:</span>
                                        <span className={estilos.valor}>
                                            {venta.ecf_fecha_firma ? new Date(venta.ecf_fecha_firma).toLocaleString(language === 'en' ? 'en-US' : 'es-DO') : '-'}
                                        </span>
                                    </div>
                                    <div className={estilos.datoFirma}>
                                        <span className={estilos.label}>{tr('Ambiente', 'Environment')}:</span>
                                        <span className={estilos.valor}>
                                            {venta.ecf_ambiente || 'testecf'}
                                        </span>
                                    </div>
                                </div>
                                {venta.ecf_qr && (
                                    <div className={estilos.qrFirma}>
                                        <img
                                            src={imagenQrFirma(venta.ecf_qr)}
                                            alt={tr('QR de Verificación DGII', 'DGII verification QR')}
                                        />
                                        <a
                                            href={venta.ecf_qr}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={estilos.enlaceQr}
                                        >
                                            {tr('Verificar en DGII', 'Verify at DGII')}
                                        </a>
                                        <span className={estilos.leyenda}>
                                            {tr('Escanee para verificar en DGII', 'Scan to verify at DGII')}
                                        </span>
                                    </div>
                                )}
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
                            <h3>{tr('Compartir por WhatsApp', 'Share via WhatsApp')}</h3>
                            <button onClick={cerrarModalWhatsApp} className={estilos.btnCerrarModal}>
                                <ion-icon name="close"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <p className={estilos.modalTexto}>
                                {tr('Ingresa el número de teléfono del cliente (con código de país, sin +):', 'Enter customer phone number (country code, without +):')}
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
                                    ? tr('El comprobante se abrirá en WhatsApp con el número ingresado', 'The receipt will open in WhatsApp with the entered number')
                                    : tr('WhatsApp Web se abrirá con el texto y se descargará la imagen del comprobante', 'WhatsApp Web will open with text and the receipt image will be downloaded')}
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
                                    <PrinterButtonConPermiso ventaId={ventaId} />
                                </div>

                                {/* Separador */}
                                <div className={estilos.separador}></div>

                                {/* Sección QZ Tray (existente) */}
                                <div className={estilos.seccionImpresion}>
                                    <div className={estilos.seccionHeader}>
                                        <h3 className={estilos.seccionTitulo}>
                                            <FaPrint className={estilos.iconoImpresion} />
                                            {tr('Impresión Térmica (QZ Tray)', 'Thermal Printing (QZ Tray)')}
                                        </h3>
                                    </div>
                                    <p className={estilos.seccionDescripcion}>
                                        {tr('Impresión directa usando QZ Tray (Windows/Mac/Linux)', 'Direct print using QZ Tray (Windows/Mac/Linux)')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button onClick={cerrarModalWhatsApp} className={estilos.btnCancelar}>
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