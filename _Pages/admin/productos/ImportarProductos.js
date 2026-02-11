"use client"

import { useState, useRef, useEffect } from 'react'
import estilos from './productos.module.css'

/**
 * Componente para importar productos desde Excel
 */
export default function ImportarProductos({ onImportarCompleto }) {
    const [mostrarModal, setMostrarModal] = useState(false)
    const [archivo, setArchivo] = useState(null)
    const [subiendo, setSubiendo] = useState(false)
    const [procesando, setProcesando] = useState(false)
    const [fileId, setFileId] = useState(null)
    const [jobId, setJobId] = useState(null)
    const [resultado, setResultado] = useState(null)
    const [mostrarErrores, setMostrarErrores] = useState(false)
    const [estadoJob, setEstadoJob] = useState(null)
    
    // Estados de progreso
    const [uploadProgress, setUploadProgress] = useState(0) // 0-100
    const [processingProgress, setProcessingProgress] = useState(0) // 0-100
    const [currentStep, setCurrentStep] = useState('idle') // idle | uploading | processing | saving | completed | error
    
    const fileInputRef = useRef(null)
    const pollingIntervalRef = useRef(null)
    const xhrRef = useRef(null) // Referencia al XMLHttpRequest para poder cancelarlo

    const manejarSeleccionArchivo = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validar tipo
            const fileName = file.name.toLowerCase()
            if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
                alert('Por favor selecciona un archivo Excel (.xlsx o .xls)')
                return
            }
            
            // Validar tamaño (50MB para storage temporal)
            if (file.size > 50 * 1024 * 1024) {
                alert('El archivo es demasiado grande (máximo 50MB). Por favor, divide el archivo en partes más pequeñas o comprime el Excel.')
                return
            }
            
            setArchivo(file)
            setResultado(null)
            setMostrarErrores(false)
        }
    }

    // Paso 1: Subir archivo (sin procesar) con progreso real y chunked upload
    const manejarSubirArchivo = async () => {
        if (!archivo) {
            alert('Por favor selecciona un archivo Excel')
            return
        }

        setSubiendo(true)
        setCurrentStep('uploading')
        setUploadProgress(0)
        setResultado(null)
        setMostrarErrores(false)
        setFileId(null)

        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB por chunk (seguro para nginx/Apache)
        const fileSize = archivo.size
        const totalChunks = Math.ceil(fileSize / CHUNK_SIZE)
        const fileId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`

        // Si el archivo es pequeño (< 10MB), subir directamente
        if (fileSize < 10 * 1024 * 1024) {
            await subirArchivoCompleto(archivo)
            return
        }

        // Archivo grande: usar chunked upload
        try {
            let uploadedBytes = 0
            let finalFileId = null // Declarar fuera del loop

            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * CHUNK_SIZE
                const end = Math.min(start + CHUNK_SIZE, fileSize)
                const chunk = archivo.slice(start, end)

                const formData = new FormData()
                formData.append('chunk', chunk)
                formData.append('chunkIndex', chunkIndex.toString())
                formData.append('totalChunks', totalChunks.toString())
                formData.append('fileId', fileId)
                formData.append('fileName', archivo.name)
                formData.append('fileSize', fileSize.toString())

                // Subir chunk con XMLHttpRequest para progreso
                const xhr = new XMLHttpRequest()
                xhrRef.current = xhr

                // Progreso del chunk actual
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const chunkProgress = (event.loaded / event.total) * 100
                        const overallProgress = ((uploadedBytes + event.loaded) / fileSize) * 100
                        setUploadProgress(Math.min(Math.round(overallProgress), 99)) // Máximo 99% hasta que termine
                    }
                }

                // Esperar a que termine el chunk
                await new Promise((resolve, reject) => {
                    xhr.onload = () => {
                        try {
                            const contentType = xhr.getResponseHeader('content-type')
                            if (!contentType || !contentType.includes('application/json')) {
                                if (xhr.status === 413) {
                                    reject(new Error('El servidor rechazó el chunk. El archivo puede ser demasiado grande.'))
                                    return
                                }
                                reject(new Error(`Error del servidor (${xhr.status})`))
                                return
                            }

                            const data = JSON.parse(xhr.responseText)

                            if (data.success) {
                                uploadedBytes += chunk.size

                                // Si es el último chunk y está completo
                                if (data.isComplete) {
                                    finalFileId = data.fileId // Guardar el fileId final
                                    setFileId(data.fileId)
                                    setUploadProgress(100)
                                    xhrRef.current = null
                                    resolve(data)
                                } else {
                                    resolve(data)
                                }
                            } else {
                                reject(new Error(data.mensaje || 'Error al subir chunk'))
                            }
                        } catch (error) {
                            reject(error)
                        }
                    }

                    xhr.onerror = () => {
                        reject(new Error('Error de red al subir chunk'))
                    }

                    xhr.ontimeout = () => {
                        reject(new Error('Timeout al subir chunk'))
                    }

                    xhr.onabort = () => {
                        reject(new Error('Upload cancelado'))
                    }

                    xhr.timeout = 2 * 60 * 1000 // 2 minutos por chunk
                    xhr.open('POST', '/api/productos/upload/chunk')
                    xhr.send(formData)
                })
            }

            // Todos los chunks subidos, iniciar procesamiento
            if (finalFileId) {
                setTimeout(() => {
                    setSubiendo(false)
                    manejarProcesar(finalFileId)
                }, 300)
            } else {
                throw new Error('No se recibió el fileId final del servidor')
            }

        } catch (error) {
            console.error('Error en chunked upload:', error)
            setCurrentStep('error')
            setResultado({
                success: false,
                mensaje: `Error al subir el archivo: ${error.message}. Intenta comprimir el Excel o dividirlo manualmente.`,
                estadisticas: {
                    total: 0,
                    procesados: 0,
                    creados: 0,
                    actualizados: 0,
                    errores: 0
                },
                errores: []
            })
            setSubiendo(false)
            xhrRef.current = null
        }
    }

    // Función auxiliar para subir archivo completo (archivos pequeños)
    const subirArchivoCompleto = async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100)
                setUploadProgress(percent)
            }
        }

        xhr.onload = async () => {
            try {
                const contentType = xhr.getResponseHeader('content-type')
                if (!contentType || !contentType.includes('application/json')) {
                    if (xhr.status === 413) {
                        // Si falla con 413, intentar chunked upload
                        if (file.size > 10 * 1024 * 1024) {
                            setResultado({
                                success: false,
                                mensaje: 'El archivo es demasiado grande. El sistema intentará dividirlo automáticamente. Por favor, intenta de nuevo.',
                                estadisticas: {
                                    total: 0,
                                    procesados: 0,
                                    creados: 0,
                                    actualizados: 0,
                                    errores: 0
                                },
                                errores: []
                            })
                            setSubiendo(false)
                            return
                        }
                        setCurrentStep('error')
                        setResultado({
                            success: false,
                            mensaje: 'El archivo es demasiado grande. Por favor, comprime el Excel o divídelo manualmente.',
                            estadisticas: {
                                total: 0,
                                procesados: 0,
                                creados: 0,
                                actualizados: 0,
                                errores: 0
                            },
                            errores: []
                        })
                        setSubiendo(false)
                        return
                    }
                    const text = xhr.responseText
                    throw new Error(`Error del servidor (${xhr.status}): ${text.substring(0, 100)}`)
                }

                const data = JSON.parse(xhr.responseText)

                if (data.success) {
                    setFileId(data.fileId)
                    setUploadProgress(100)
                    xhrRef.current = null
                    setTimeout(() => {
                        setSubiendo(false)
                        manejarProcesar(data.fileId)
                    }, 300)
                } else {
                    setCurrentStep('error')
                    setResultado(data)
                    setSubiendo(false)
                    xhrRef.current = null
                }

            } catch (error) {
                console.error('Error al procesar respuesta de upload:', error)
                setCurrentStep('error')
                setResultado({
                    success: false,
                    mensaje: `Error al subir el archivo: ${error.message}`
                })
                setSubiendo(false)
            }
        }

        xhr.onerror = () => {
            setCurrentStep('error')
            setResultado({
                success: false,
                mensaje: 'Error de red al subir el archivo. Verifica tu conexión.'
            })
            setSubiendo(false)
            xhrRef.current = null
        }

        xhr.ontimeout = () => {
            setCurrentStep('error')
            setResultado({
                success: false,
                mensaje: 'Timeout al subir el archivo. El archivo puede ser muy grande.'
            })
            setSubiendo(false)
            xhrRef.current = null
        }
        
        xhr.onabort = () => {
            setCurrentStep('idle')
            setSubiendo(false)
            setUploadProgress(0)
            xhrRef.current = null
        }

        xhr.timeout = 5 * 60 * 1000
        xhr.open('POST', '/api/productos/upload')
        xhr.send(formData)
    }

    // Paso 2: Procesar archivo subido
    const manejarProcesar = async (fileIdToProcess) => {
        const targetFileId = fileIdToProcess || fileId
        
        if (!targetFileId) {
            alert('No hay archivo para procesar')
            return
        }

        setProcesando(true)
        setCurrentStep('processing')
        setProcessingProgress(0)
        setResultado(null)
        setMostrarErrores(false)

        try {
            const response = await fetch('/api/productos/procesar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileId: targetFileId })
            })

            const data = await response.json()

            if (data.success && data.jobId) {
                setJobId(data.jobId)
                // Iniciar polling para verificar estado con progreso real
                iniciarPolling(data.jobId)
            } else {
                setCurrentStep('error')
                setResultado(data)
                setProcesando(false)
            }

        } catch (error) {
            console.error('Error al procesar:', error)
            setCurrentStep('error')
            setResultado({
                success: false,
                mensaje: `Error al iniciar el procesamiento: ${error.message}`
            })
            setProcesando(false)
        }
    }

    // Polling para verificar estado del job con progreso real
    const iniciarPolling = (jobIdToPoll) => {
        // Limpiar polling anterior si existe
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
        }

        const poll = async () => {
            try {
                const response = await fetch(`/api/productos/importar/estado/${jobIdToPoll}`)
                const data = await response.json()

                if (data.success) {
                    setEstadoJob(data)

                    // Calcular progreso real basado en estadísticas
                    if (data.estadisticas && data.estadisticas.total > 0) {
                        const percent = Math.round((data.estadisticas.procesados / data.estadisticas.total) * 100)
                        setProcessingProgress(percent)
                        
                        // Si está guardando en BD, actualizar step
                        if (data.mensaje && data.mensaje.includes('Guardando')) {
                            setCurrentStep('saving')
                        }
                    }

                    // Actualizar step según estado
                    if (data.estado === 'pending') {
                        setCurrentStep('processing')
                    } else if (data.estado === 'processing') {
                        setCurrentStep('processing')
                    } else if (data.estado === 'completed') {
                        setCurrentStep('completed')
                        setProcessingProgress(100)
                    } else if (data.estado === 'failed') {
                        setCurrentStep('error')
                    }

                    // Si el job terminó (completed o failed)
                    if (data.estado === 'completed' || data.estado === 'failed') {
                        clearInterval(pollingIntervalRef.current)
                        setProcesando(false)
                        
                        // Formatear resultado
                        setResultado({
                            success: data.estado === 'completed',
                            mensaje: data.mensaje || (data.estado === 'completed' ? 'Importación completada exitosamente' : 'Error en la importación'),
                            estadisticas: data.estadisticas,
                            errores: data.errores
                        })

                        // No cerrar automáticamente, mostrar botón "Aceptar"
                        if (data.errores && data.errores.length > 0) {
                            setMostrarErrores(true)
                        }
                    }
                }
            } catch (error) {
                console.error('Error al verificar estado:', error)
                // Continuar polling aunque haya error
            }
        }

        // Poll cada 1 segundo para mejor UX
        pollingIntervalRef.current = setInterval(poll, 1000)
        // Primera verificación inmediata
        poll()
    }

    // Limpiar polling al cerrar modal
    const limpiarPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
        }
    }
    
    // Cancelar importación (detener upload y procesamiento)
    const cancelarImportacion = () => {
        // Detener upload si está en progreso
        if (xhrRef.current && (subiendo || procesando)) {
            xhrRef.current.abort()
            xhrRef.current = null
        }
        
        // Detener polling
        limpiarPolling()
        
        // Resetear estados
        setSubiendo(false)
        setProcesando(false)
        setUploadProgress(0)
        setProcessingProgress(0)
        setCurrentStep('idle')
        setFileId(null)
        setJobId(null)
        setEstadoJob(null)
        setResultado(null)
        
        // Limpiar archivo seleccionado
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        setArchivo(null)
    }

    const cerrarModal = () => {
        // Si está procesando o subiendo, cancelar primero
        if (subiendo || procesando) {
            if (confirm('La importación está en progreso. ¿Deseas cancelar y cerrar el modal?')) {
                cancelarImportacion()
            } else {
                return // No cerrar si el usuario no confirma
            }
        }
        
        limpiarPolling()
        
        // Si hay resultado exitoso, ejecutar callback
        if (resultado?.success && onImportarCompleto) {
            onImportarCompleto()
        }
        
        setMostrarModal(false)
        setArchivo(null)
        setResultado(null)
        setMostrarErrores(false)
        setFileId(null)
        setJobId(null)
        setEstadoJob(null)
        setSubiendo(false)
        setProcesando(false)
        setUploadProgress(0)
        setProcessingProgress(0)
        setCurrentStep('idle')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }
    
    const manejarAceptar = () => {
        // Ejecutar callback si la importación fue exitosa
        if (resultado?.success && onImportarCompleto) {
            onImportarCompleto()
        }
        cerrarModal()
    }

    // Limpiar polling al desmontar componente
    useEffect(() => {
        return () => {
            limpiarPolling()
        }
    }, [])

    const formatearNumero = (num) => {
        return new Intl.NumberFormat('es-DO').format(num)
    }

    const abrirSelectorArchivo = () => {
        if (fileInputRef.current && !procesando) {
            fileInputRef.current.click()
        }
    }

    return (
        <>
            {/* Botón para abrir modal */}
            <button
                onClick={() => setMostrarModal(true)}
                className={estilos.btnImportar}
                title="Importar productos desde Excel"
            >
                <ion-icon name="cloud-upload-outline"></ion-icon>
                <span>Importar Excel</span>
            </button>

            {/* Modal */}
            {mostrarModal && (
                <div className={estilos.modalOverlay} onClick={cerrarModal}>
                    <div className={estilos.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2 className={estilos.modalTitulo}>Importar Productos desde Excel</h2>
                            <button
                                onClick={cerrarModal}
                                className={estilos.modalCerrar}
                                disabled={procesando}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.modalBody}>
                            {!resultado && currentStep === 'idle' ? (
                                <>
                                    <div className={estilos.modalInfo}>
                                        <ion-icon name="information-circle-outline"></ion-icon>
                                        <div>
                                            <p><strong>Campos requeridos en el Excel:</strong></p>
                                            <ul>
                                                <li><strong>REFERENCIA</strong> - Código del producto (requerido)</li>
                                                <li><strong>PRODUCTO</strong> - Nombre del producto (requerido)</li>
                                                <li><strong>EXISTENCIAS</strong> - Stock inicial (requerido)</li>
                                                <li><strong>COSTO</strong> - Precio de compra (requerido)</li>
                                                <li><strong>PRECIO I</strong> - Precio de venta principal (requerido)</li>
                                                <li><strong>PRECIO II</strong> - Precio mayorista (opcional)</li>
                                                <li><strong>PRECIO III</strong> - Precio oferta (opcional)</li>
                                                <li><strong>PRECIO IV</strong> - Precio adicional (opcional)</li>
                                            </ul>
                                            <p><strong>Nota:</strong> El sistema detecta automáticamente las columnas buscando la fila con "REFERENCIA" como encabezado. Solo asegúrate de que tu Excel contenga estas columnas con esos nombres exactos.</p>
                                        </div>
                                    </div>

                                    <div 
                                        className={estilos.uploadArea}
                                        onClick={abrirSelectorArchivo}
                                        style={{ cursor: (subiendo || procesando) ? 'not-allowed' : 'pointer' }}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={manejarSeleccionArchivo}
                                            className={estilos.fileInput}
                                            disabled={subiendo || procesando}
                                        />
                                        <div className={estilos.uploadContent}>
                                            <ion-icon name="document-outline"></ion-icon>
                                            {archivo ? (
                                                <div>
                                                    <p><strong>{archivo.name}</strong></p>
                                                    <p className={estilos.archivoSize}>
                                                        {(archivo.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                    {fileId && (
                                                        <p className={estilos.archivoHint} style={{ color: '#10b981', marginTop: '8px' }}>
                                                            ✓ Archivo subido correctamente
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <p>Haz clic para seleccionar un archivo Excel</p>
                                                    <p className={estilos.archivoHint}>
                                                        Formatos soportados: .xlsx, .xls (máximo 50MB)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (currentStep === 'uploading' || currentStep === 'processing' || currentStep === 'saving') ? (
                                <div className={estilos.timelineContainer}>
                                    {/* Timeline Visual */}
                                    <div className={estilos.timeline}>
                                        {/* Paso 1: Archivo seleccionado */}
                                        <div className={`${estilos.timelineStep} ${estilos.completed}`}>
                                            <div className={estilos.timelineIcon}>
                                                <ion-icon name="checkmark-circle"></ion-icon>
                                            </div>
                                            <div className={estilos.timelineContent}>
                                                <p className={estilos.timelineTitle}>Archivo seleccionado</p>
                                                <p className={estilos.timelineSubtitle}>{archivo?.name}</p>
                                            </div>
                                        </div>

                                        {/* Paso 2: Subiendo archivo */}
                                        <div className={`${estilos.timelineStep} ${subiendo ? estilos.active : fileId ? estilos.completed : estilos.pending}`}>
                                            <div className={estilos.timelineIcon}>
                                                {subiendo ? (
                                                    <ion-icon name="cloud-upload" className={estilos.iconoCargando}></ion-icon>
                                                ) : fileId ? (
                                                    <ion-icon name="checkmark-circle"></ion-icon>
                                                ) : (
                                                    <ion-icon name="ellipse-outline"></ion-icon>
                                                )}
                                            </div>
                                            <div className={estilos.timelineContent}>
                                                <p className={estilos.timelineTitle}>
                                                    {subiendo ? 'Subiendo archivo...' : fileId ? 'Archivo subido' : 'Subiendo archivo'}
                                                </p>
                                                {subiendo && (
                                                    <>
                                                        <div className={estilos.progresoBar}>
                                                            <div 
                                                                className={estilos.progresoFill}
                                                                style={{ width: `${uploadProgress}%` }}
                                                            ></div>
                                                        </div>
                                                        <p className={estilos.progresoTexto}>{uploadProgress}%</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Paso 3: Procesando productos / Guardando en BD */}
                                        <div className={`${estilos.timelineStep} ${procesando ? estilos.active : estadoJob?.estado === 'completed' ? estilos.completed : estilos.pending}`}>
                                            <div className={estilos.timelineIcon}>
                                                {procesando ? (
                                                    <ion-icon 
                                                        name={estadoJob?.mensaje?.includes('Guardando') ? "save-outline" : "hourglass-outline"} 
                                                        className={estilos.iconoCargando}
                                                    ></ion-icon>
                                                ) : estadoJob?.estado === 'completed' ? (
                                                    <ion-icon name="checkmark-circle"></ion-icon>
                                                ) : (
                                                    <ion-icon name="ellipse-outline"></ion-icon>
                                                )}
                                            </div>
                                            <div className={estilos.timelineContent}>
                                                <p className={estilos.timelineTitle}>
                                                    {procesando 
                                                        ? (estadoJob?.mensaje?.includes('Guardando') 
                                                            ? 'Guardando en base de datos...' 
                                                            : 'Procesando productos...')
                                                        : estadoJob?.estado === 'completed' 
                                                        ? 'Importación completada' 
                                                        : 'Procesando productos'}
                                                </p>
                                                {procesando && estadoJob?.estadisticas && (
                                                    <>
                                                        <div className={estilos.progresoBar}>
                                                            <div 
                                                                className={estilos.progresoFill}
                                                                style={{ width: `${processingProgress}%` }}
                                                            ></div>
                                                        </div>
                                                        <p className={estilos.progresoTexto}>
                                                            {processingProgress}% - {formatearNumero(estadoJob.estadisticas.procesados || 0)} de {formatearNumero(estadoJob.estadisticas.total || 0)} productos
                                                        </p>
                                                        {estadoJob.estadisticas.procesados > 0 && (
                                                            <p className={estilos.progresoDetalle}>
                                                                ✓ {formatearNumero(estadoJob.estadisticas.creados || 0)} creados
                                                                {estadoJob.estadisticas.actualizados > 0 && (
                                                                    <> • ✓ {formatearNumero(estadoJob.estadisticas.actualizados)} actualizados</>
                                                                )}
                                                                {estadoJob.estadisticas.total > estadoJob.estadisticas.procesados && (
                                                                    <> • ⏳ {formatearNumero(estadoJob.estadisticas.total - estadoJob.estadisticas.procesados)} restantes</>
                                                                )}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={estilos.resultadoImportacion}>
                                    <div className={`${estilos.resultadoIcono} ${resultado.success ? estilos.success : estilos.error}`}>
                                        <ion-icon name={resultado.success ? "checkmark-circle" : "close-circle"}></ion-icon>
                                    </div>
                                    
                                    <h3 className={estilos.resultadoTitulo}>
                                        {resultado.success ? "Importación Exitosa" : "Error en la Importación"}
                                    </h3>
                                    
                                    <p className={estilos.resultadoMensaje}>{resultado.mensaje}</p>


                                    {resultado?.estadisticas && (
                                        <div className={estilos.estadisticasImportacion}>
                                            <div className={estilos.estadItem}>
                                                <span className={estilos.estadLabel}>Total de filas:</span>
                                                <span className={estilos.estadValor}>{formatearNumero(resultado.estadisticas.total)}</span>
                                            </div>
                                            <div className={estilos.estadItem}>
                                                <span className={estilos.estadLabel}>Procesados:</span>
                                                <span className={`${estilos.estadValor} ${estilos.success}`}>
                                                    {formatearNumero(resultado.estadisticas.procesados)}
                                                </span>
                                            </div>
                                            <div className={estilos.estadItem}>
                                                <span className={estilos.estadLabel}>Creados:</span>
                                                <span className={`${estilos.estadValor} ${estilos.success}`}>
                                                    {formatearNumero(resultado.estadisticas.creados)}
                                                </span>
                                            </div>
                                            <div className={estilos.estadItem}>
                                                <span className={estilos.estadLabel}>Actualizados:</span>
                                                <span className={estilos.estadValor}>
                                                    {formatearNumero(resultado.estadisticas.actualizados)}
                                                </span>
                                            </div>
                                            {resultado.estadisticas.errores > 0 && (
                                                <div className={estilos.estadItem}>
                                                    <span className={estilos.estadLabel}>Errores:</span>
                                                    <span className={`${estilos.estadValor} ${estilos.error}`}>
                                                        {formatearNumero(resultado.estadisticas.errores)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {resultado.errores && resultado.errores.length > 0 && (
                                        <div className={estilos.erroresContainer}>
                                            <button
                                                onClick={() => setMostrarErrores(!mostrarErrores)}
                                                className={estilos.btnVerErrores}
                                            >
                                                <ion-icon name={mostrarErrores ? "chevron-up" : "chevron-down"}></ion-icon>
                                                Ver {resultado.errores.length} error(es)
                                            </button>
                                            
                                            {mostrarErrores && (
                                                <div className={estilos.erroresLista}>
                                                    {resultado.errores.slice(0, 20).map((error, index) => (
                                                        <div key={index} className={estilos.errorItem}>
                                                            <span className={estilos.errorFila}>Fila {error.fila}:</span>
                                                            <span className={estilos.errorCodigo}>{error.codigo || 'N/A'}</span>
                                                            <span className={estilos.errorNombre}>{error.nombre || 'N/A'}</span>
                                                            <span className={estilos.errorMensaje}>{error.error}</span>
                                                        </div>
                                                    ))}
                                                    {resultado.errores.length > 20 && (
                                                        <p className={estilos.errorLimitado}>
                                                            Mostrando solo los primeros 20 errores de {resultado.errores.length} totales
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={estilos.modalFooter}>
                            {!resultado && (
                                <>
                                    <button
                                        onClick={() => {
                                            if (subiendo || procesando) {
                                                if (confirm('¿Deseas cancelar la importación?')) {
                                                    cancelarImportacion()
                                                }
                                            } else {
                                                cerrarModal()
                                            }
                                        }}
                                        className={estilos.btnCancelar}
                                        disabled={false}
                                    >
                                        {subiendo || procesando ? 'Cancelar' : 'Cerrar'}
                                    </button>
                                    <button
                                        onClick={manejarSubirArchivo}
                                        className={estilos.btnImportarModal}
                                        disabled={!archivo || subiendo || procesando}
                                    >
                                        {subiendo ? (
                                            <>
                                                <ion-icon name="cloud-upload-outline" className={estilos.iconoCargando}></ion-icon>
                                                Subiendo...
                                            </>
                                        ) : procesando ? (
                                            <>
                                                <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <ion-icon name="cloud-upload-outline"></ion-icon>
                                                Subir y Procesar
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                            {resultado && (
                                <button
                                    onClick={manejarAceptar}
                                    className={estilos.btnCerrarModal}
                                >
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    Aceptar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

