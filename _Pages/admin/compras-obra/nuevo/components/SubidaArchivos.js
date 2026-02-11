"use client"
import { useState } from 'react'
import estilos from './SubidaArchivos.module.css'

export default function SubidaArchivos({ 
    archivos = [], 
    onChange, 
    tema = 'light' 
}) {
    const [archivosLocales, setArchivosLocales] = useState(archivos)

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files)
        
        files.forEach(file => {
            // Validar tamaño (máximo 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(`El archivo ${file.name} es demasiado grande. Máximo 10MB`)
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                const nuevoArchivo = {
                    id: Date.now() + Math.random(),
                    nombre_archivo: file.name,
                    tipo_documento: 'factura', // Por defecto
                    base64: reader.result,
                    preview: file.type.startsWith('image/') ? reader.result : null,
                    tamaño: file.size,
                    tipo: file.type
                }

                const nuevosArchivos = [...archivosLocales, nuevoArchivo]
                setArchivosLocales(nuevosArchivos)
                onChange?.(nuevosArchivos)
            }
            reader.readAsDataURL(file)
        })

        e.target.value = ''
    }

    const handleRemove = (id) => {
        const nuevosArchivos = archivosLocales.filter(a => a.id !== id)
        setArchivosLocales(nuevosArchivos)
        onChange?.(nuevosArchivos)
    }

    const handleTipoChange = (id, nuevoTipo) => {
        const nuevosArchivos = archivosLocales.map(a => 
            a.id === id ? { ...a, tipo_documento: nuevoTipo } : a
        )
        setArchivosLocales(nuevosArchivos)
        onChange?.(nuevosArchivos)
    }

    const formatearTamaño = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.header}>
                <h3>
                    <ion-icon name="document-attach-outline"></ion-icon>
                    Documentos Adjuntos
                </h3>
                <label className={estilos.btnSubir}>
                    <ion-icon name="cloud-upload-outline"></ion-icon>
                    <span>Subir Archivo</span>
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </label>
            </div>

            {archivosLocales.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="document-outline"></ion-icon>
                    <p>No hay archivos adjuntos</p>
                    <small>Sube facturas, conduce, recibos u otros documentos</small>
                </div>
            ) : (
                <div className={estilos.lista}>
                    {archivosLocales.map((archivo) => (
                        <div key={archivo.id} className={`${estilos.item} ${estilos[tema]}`}>
                            {archivo.preview ? (
                                <div className={estilos.preview}>
                                    <img src={archivo.preview} alt={archivo.nombre_archivo} />
                                </div>
                            ) : (
                                <div className={estilos.icono}>
                                    <ion-icon name="document-outline"></ion-icon>
                                </div>
                            )}
                            
                            <div className={estilos.info}>
                                <div className={estilos.nombre}>{archivo.nombre_archivo}</div>
                                <div className={estilos.meta}>
                                    <span>{formatearTamaño(archivo.tamaño)}</span>
                                    <select
                                        value={archivo.tipo_documento}
                                        onChange={(e) => handleTipoChange(archivo.id, e.target.value)}
                                        className={estilos.selectTipo}
                                    >
                                        <option value="factura">Factura</option>
                                        <option value="recibo">Recibo</option>
                                        <option value="conduce">Conduce</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="button"
                                className={estilos.btnEliminar}
                                onClick={() => handleRemove(archivo.id)}
                            >
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

