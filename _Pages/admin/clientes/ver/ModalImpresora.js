"use client"

import { useEffect, useState, useRef } from "react"
import PerfilPreview from "./PerfilPreview"
import estilos from "./modales.module.css"

export default function ModalImpresora({ cliente, alCerrar, tema }) {
    const [printerService, setPrinterService] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [impresoras, setImpresoras] = useState([])
    const [impresoraSeleccionada, setImpresoraSeleccionada] = useState('')
    const [qzDisponible, setQzDisponible] = useState(false)
    const [status, setStatus] = useState('Inicializando...')
    const [error, setError] = useState(null)
    const previewRef = useRef(null)

    const formatearMoneda = (valor) =>
        new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(valor || 0)

    useEffect(() => {
        inicializarImpresora()
    }, [])

    const inicializarImpresora = async () => {
        try {
            // Detectar si QZ Tray está disponible
            if (typeof qz !== 'undefined') {
                setQzDisponible(true)
                setStatus('QZ Tray detectado')
            } else {
                setStatus('QZ Tray no disponible')
            }
        } catch (err) {
            console.error('Error al inicializar:', err)
            setStatus('Error al inicializar')
        }
    }

    const conectarImpresora = async () => {
        if (!qzDisponible) {
            setError('QZ Tray no está disponible. Asegúrate de tenerlo instalado.')
            return
        }

        setIsLoading(true)
        setError(null)
        setStatus('Buscando impresoras...')

        try {
            if (!qz.websocket.isActive()) {
                await qz.websocket.connect()
            }

            const printers = await qz.printers.getDefault()
            setImpresoras([printers])
            setImpresoraSeleccionada(printers)
            setIsConnected(true)
            setStatus(`Conectado a: ${printers}`)
        } catch (err) {
            console.error('Error al conectar:', err)
            setError('No se pudo conectar a la impresora')
            setStatus('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    const imprimirPerfilCliente = async () => {
        if (!isConnected || !impresoraSeleccionada) {
            setError('No hay impresora seleccionada')
            return
        }

        setIsLoading(true)
        try {
            const config = qz.configs.create(impresoraSeleccionada)
            const commands = [
                '\x1d\x21\x22',  // Aumentar fuente
                'PERFIL DE CLIENTE\n',
                '\x1d\x21\x00',  // Fuente normal
                '================================\n',
                `${cliente.nombreCompleto}\n`,
                `${cliente.documento.tipoCodigo}: ${cliente.documento.numero}\n`,
                '================================\n',
                '\n',
                'CONTACTO:\n',
                `Tel: ${cliente.contacto?.telefono || 'N/A'}\n`,
                `Email: ${cliente.contacto?.email || 'N/A'}\n`,
                '\n',
                'INFORMACIÓN COMERCIAL:\n',
                `Total Compras: ${formatearMoneda(cliente.totalCompras)}\n`,
                `Puntos: ${cliente.puntosFidelidad || 0}\n`,
                '\n',
                cliente.credito?.tienePerfil ? (
                    `CRÉDITO:\n` +
                    `Límite: ${formatearMoneda(cliente.credito.limite)}\n` +
                    `Utilizado: ${formatearMoneda(cliente.credito.utilizado)}\n` +
                    `Disponible: ${formatearMoneda(cliente.credito.disponible)}\n`
                ) : 'Sin perfil de crédito\n',
                '\n',
                '\x1d\x21\x00', // Reset
                'Fecha: ' + new Date().toLocaleString('es-DO') + '\n',
                '\n\n\n'
            ]

            await qz.print(config, commands)
            setStatus('Impresión completada')
            setTimeout(() => alCerrar(), 1500)
        } catch (err) {
            console.error('Error al imprimir:', err)
            setError('Error al enviar a la impresora')
        } finally {
            setIsLoading(false)
        }
    }

    const desconectar = async () => {
        try {
            if (qz?.websocket?.isActive()) {
                qz.websocket.disconnect()
            }
            setIsConnected(false)
            setStatus('Desconectado')
        } catch (err) {
            console.error('Error al desconectar:', err)
        }
    }

    return (
        <div className={`${estilos.modalOverlay} ${estilos[tema]}`} onClick={alCerrar}>
            <div className={`${estilos.modalContent} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                <div className={estilos.modalHeader}>
                    <h2>Imprimir Perfil de Cliente</h2>
                    <button className={estilos.btnCerrarModal} onClick={alCerrar}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <div className={estilos.modalBody}>
                    <div className={`${estilos.statusBar} ${estilos[tema]}`}>
                        <div className={estilos.statusIcon}>
                            <ion-icon name={isConnected ? "checkmark-circle" : "alert-circle"}></ion-icon>
                        </div>
                        <div>
                            <div className={estilos.statusText}>{status}</div>
                            <div className={estilos.statusInfo}>
                                {!qzDisponible && 'QZ Tray debe estar instalado y ejecutándose'}
                                {isConnected && `Impresora: ${impresoraSeleccionada}`}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className={estilos.error}>
                            <ion-icon name="alert-circle"></ion-icon>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={estilos.previewImpresion}>
                        <h3>Vista previa:</h3>
                        <PerfilPreview 
                            cliente={cliente}
                            tema={tema}
                            forwardedRef={previewRef}
                        />
                    </div>
                </div>

                <div className={estilos.modalFooter}>
                    {!isConnected ? (
                        <button
                            className={estilos.btnPrimario}
                            disabled={!qzDisponible || isLoading}
                            onClick={conectarImpresora}
                        >
                            {isLoading ? (
                                <>
                                    <ion-icon name="hourglass"></ion-icon>
                                    Conectando...
                                </>
                            ) : (
                                <>
                                    <ion-icon name="link-outline"></ion-icon>
                                    Conectar Impresora
                                </>
                            )}
                        </button>
                    ) : (
                        <>
                            <button
                                className={estilos.btnPrimario}
                                disabled={isLoading}
                                onClick={imprimirPerfilCliente}
                            >
                                {isLoading ? (
                                    <>
                                        <ion-icon name="hourglass"></ion-icon>
                                        Imprimiendo...
                                    </>
                                ) : (
                                    <>
                                        <ion-icon name="print-outline"></ion-icon>
                                        Imprimir Perfil
                                    </>
                                )}
                            </button>
                            <button
                                className={estilos.btnSecundario}
                                onClick={desconectar}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                                Desconectar
                            </button>
                        </>
                    )}
                    <button className={estilos.btnCancelar} onClick={alCerrar}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}
