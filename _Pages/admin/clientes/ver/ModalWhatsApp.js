"use client"

import { useEffect, useState, useRef } from "react"
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import PerfilPreview from "./PerfilPreview"
import estilos from "./modales.module.css"

export default function ModalWhatsApp({ cliente, alCerrar, tema }) {
    const [numeroTelefono, setNumeroTelefono] = useState(cliente.contacto?.telefono || '')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [metodoEnvio, setMetodoEnvio] = useState('imagen') // imagen, pdf, texto
    const [estadoDescarga, setEstadoDescarga] = useState('') // Para mostrar progreso
    const previewRef = useRef(null)

    const formatearMoneda = (valor) =>
        new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(valor || 0)

    const limpiarNumeroTelefono = (numero) => {
        let limpio = numero.replace(/\D/g, '')
        // Si no empieza con código de país, asumir +1 (EEUU/RD)
        if (limpio.length === 10) limpio = '1' + limpio
        else if (limpio.length === 10 && limpio.startsWith('809')) limpio = '1' + limpio
        return limpio
    }

    const generarPDF = async () => {
        try {
            setEstadoDescarga('Generando PDF...')
            const elemento = previewRef.current
            if (!elemento) throw new Error('No se pudo acceder al contenido')

            const canvas = await html2canvas(elemento, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const imgWidth = 210
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
            
            setEstadoDescarga('Descargando PDF...')
            pdf.save(`perfil-cliente-${cliente.id}.pdf`)
            
            return imgData
        } catch (err) {
            console.error('Error generando PDF:', err)
            throw new Error('No se pudo generar el PDF')
        }
    }

    const generarImagen = async () => {
        try {
            setEstadoDescarga('Capturando imagen...')
            const elemento = previewRef.current
            if (!elemento) throw new Error('No se pudo acceder al contenido')

            const canvas = await html2canvas(elemento, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true
            })

            return canvas.toDataURL('image/png')
        } catch (err) {
            console.error('Error capturando imagen:', err)
            throw new Error('No se pudo capturar la imagen')
        }
    }

    const descargarImagen = async (imagenBase64) => {
        try {
            setEstadoDescarga('Descargando imagen...')
            const link = document.createElement('a')
            link.href = imagenBase64
            link.download = `perfil-cliente-${cliente.id}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (err) {
            console.error('Error descargando imagen:', err)
            throw new Error('No se pudo descargar la imagen')
        }
    }

    const abrirWhatsAppWeb = async () => {
        if (!numeroTelefono.trim()) {
            setError('Ingresa un número de teléfono')
            return
        }

        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const numeroLimpio = limpiarNumeroTelefono(numeroTelefono)
            
            if (metodoEnvio === 'imagen') {
                const imagen = await generarImagen()
                await descargarImagen(imagen)
                setSuccess('Imagen descargada. Ahora abriendo WhatsApp...')
                setTimeout(() => {
                    window.open(`https://wa.me/${numeroLimpio}?text=Perfil%20de%20cliente:%20${encodeURIComponent(cliente.nombreCompleto)}`, '_blank')
                }, 1000)
            } else if (metodoEnvio === 'pdf') {
                await generarPDF()
                setSuccess('PDF descargado. Ahora abriendo WhatsApp...')
                setTimeout(() => {
                    window.open(`https://wa.me/${numeroLimpio}?text=Te%20envío%20el%20perfil%20en%20PDF`, '_blank')
                }, 1000)
            } else {
                // Texto
                const texto = `Perfil del Cliente: ${cliente.nombreCompleto}
Documento: ${cliente.documento.numero}
Total Compras: ${formatearMoneda(cliente.totalCompras)}
Teléfono: ${cliente.contacto?.telefono || 'N/A'}`
                
                window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(texto)}`, '_blank')
                setSuccess('WhatsApp abierto')
            }
        } catch (err) {
            console.error('Error:', err)
            setError(err.message || 'Error al procesar')
        } finally {
            setIsLoading(false)
            setEstadoDescarga('')
        }
    }

    return (
        <div className={`${estilos.modalOverlay} ${estilos[tema]}`} onClick={alCerrar}>
            <div className={`${estilos.modalContent} ${estilos.modalAncho} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                <div className={estilos.modalHeader}>
                    <h2>Compartir por WhatsApp</h2>
                    <button className={estilos.btnCerrarModal} onClick={alCerrar}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <div className={estilos.modalBody}>
                    <div className={estilos.seccionWhatsApp}>
                        <h3>Ingresa el número de teléfono del cliente (con código de país, sin +):</h3>
                        <p className={estilos.ayuda}>Ej: 18091234567 o 8091234567</p>
                        <input
                            type="tel"
                            value={numeroTelefono}
                            onChange={(e) => setNumeroTelefono(e.target.value)}
                            placeholder="8091234567"
                            disabled={isLoading}
                            className={estilos.inputTelefono}
                        />
                    </div>

                    <div className={estilos.seccionMetodos}>
                        <h3>Método de envío:</h3>
                        <div className={estilos.grupoOpciones}>
                            <label className={estilos.opcionRadio}>
                                <input
                                    type="radio"
                                    value="imagen"
                                    checked={metodoEnvio === 'imagen'}
                                    onChange={(e) => setMetodoEnvio(e.target.value)}
                                    disabled={isLoading}
                                />
                                <div className={estilos.iconoOpcion}>
                                    <ion-icon name="image-outline"></ion-icon>
                                </div>
                                <div className={estilos.textoOpcion}>
                                    <strong>Descargar Imagen</strong>
                                    <small>PNG descargable + WhatsApp</small>
                                </div>
                            </label>

                            <label className={estilos.opcionRadio}>
                                <input
                                    type="radio"
                                    value="pdf"
                                    checked={metodoEnvio === 'pdf'}
                                    onChange={(e) => setMetodoEnvio(e.target.value)}
                                    disabled={isLoading}
                                />
                                <div className={estilos.iconoOpcion}>
                                    <ion-icon name="document-outline"></ion-icon>
                                </div>
                                <div className={estilos.textoOpcion}>
                                    <strong>Descargar PDF</strong>
                                    <small>PDF descargable + WhatsApp</small>
                                </div>
                            </label>

                            <label className={estilos.opcionRadio}>
                                <input
                                    type="radio"
                                    value="texto"
                                    checked={metodoEnvio === 'texto'}
                                    onChange={(e) => setMetodoEnvio(e.target.value)}
                                    disabled={isLoading}
                                />
                                <div className={estilos.iconoOpcion}>
                                    <ion-icon name="chatbubble-outline"></ion-icon>
                                </div>
                                <div className={estilos.textoOpcion}>
                                    <strong>Solo Texto</strong>
                                    <small>Enviar texto plano a WhatsApp</small>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className={estilos.previewSeccion}>
                        <h3>Vista previa del perfil:</h3>
                        <PerfilPreview 
                            cliente={cliente}
                            tema={tema}
                            forwardedRef={previewRef}
                        />
                    </div>

                    {error && (
                        <div className={estilos.error}>
                            <ion-icon name="alert-circle"></ion-icon>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className={estilos.success}>
                            <ion-icon name="checkmark-circle"></ion-icon>
                            <span>{success}</span>
                        </div>
                    )}

                    {estadoDescarga && (
                        <div className={estilos.estadoDescarga}>
                            <div className={estilos.spinner}></div>
                            <span>{estadoDescarga}</span>
                        </div>
                    )}
                </div>

                <div className={estilos.modalFooter}>
                    <button
                        className={estilos.btnPrimario}
                        onClick={abrirWhatsAppWeb}
                        disabled={isLoading || !numeroTelefono.trim()}
                    >
                        {isLoading ? (
                            <>
                                <ion-icon name="hourglass"></ion-icon>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <ion-icon name="logo-whatsapp"></ion-icon>
                                Enviar a WhatsApp
                            </>
                        )}
                    </button>
                    <button className={estilos.btnCancelar} onClick={alCerrar}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}
