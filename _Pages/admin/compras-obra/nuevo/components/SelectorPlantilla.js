"use client"
import { useState, useEffect } from 'react'
import { obtenerPlantillasCompra, obtenerPlantillaPorId } from '../../servidor'
import estilos from './SelectorPlantilla.module.css'

export default function SelectorPlantilla({ 
    tipoDestino, 
    onSelect, 
    tema = 'light',
    isOpen,
    onClose
}) {
    const [plantillas, setPlantillas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null)
    const [detallePlantilla, setDetallePlantilla] = useState(null)
    const [cargandoDetalle, setCargandoDetalle] = useState(false)

    useEffect(() => {
        if (isOpen && tipoDestino) {
            cargarPlantillas()
        }
    }, [isOpen, tipoDestino])

    const cargarPlantillas = async () => {
        setCargando(true)
        try {
            const res = await obtenerPlantillasCompra(tipoDestino)
            if (res.success) {
                setPlantillas(res.plantillas || [])
            }
        } catch (error) {
            console.error('Error al cargar plantillas:', error)
        } finally {
            setCargando(false)
        }
    }

    const handleSelectPlantilla = async (plantilla) => {
        setPlantillaSeleccionada(plantilla.id)
        setCargandoDetalle(true)
        try {
            const res = await obtenerPlantillaPorId(plantilla.id)
            if (res.success) {
                setDetallePlantilla(res.plantilla)
            }
        } catch (error) {
            console.error('Error al cargar detalle:', error)
        } finally {
            setCargandoDetalle(false)
        }
    }

    const handleAplicar = () => {
        if (detallePlantilla && detallePlantilla.detalle) {
            // Convertir detalle de plantilla a formato de materiales
            const materiales = detallePlantilla.detalle.map(item => ({
                material_nombre: item.material_nombre,
                material_descripcion: item.material_descripcion || '',
                unidad_medida: item.unidad_medida || item.unidad_medida_base || '',
                cantidad: item.cantidad_referencial || 0,
                precio_unitario: 0, // El usuario debe ingresar el precio
                categoria_material_id: item.categoria_id || null,
                material_id: item.material_id || null
            }))
            
            onSelect?.(materiales)
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className={estilos.overlay} onClick={onClose}>
            <div className={`${estilos.modal} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                <div className={estilos.header}>
                    <h2>
                        <ion-icon name="document-text-outline"></ion-icon>
                        Seleccionar Plantilla
                    </h2>
                    <button type="button" className={estilos.btnCerrar} onClick={onClose}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <div className={estilos.body}>
                    {cargando ? (
                        <div className={estilos.cargando}>
                            <ion-icon name="hourglass-outline"></ion-icon>
                            <p>Cargando plantillas...</p>
                        </div>
                    ) : plantillas.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="document-outline"></ion-icon>
                            <p>No hay plantillas disponibles</p>
                            <small>Las plantillas aparecerán aquí cuando se creen</small>
                        </div>
                    ) : (
                        <div className={estilos.grid}>
                            {plantillas.map((plantilla) => (
                                <div
                                    key={plantilla.id}
                                    className={`${estilos.card} ${plantillaSeleccionada === plantilla.id ? estilos.seleccionada : ''} ${estilos[tema]}`}
                                    onClick={() => handleSelectPlantilla(plantilla)}
                                >
                                    <div className={estilos.cardHeader}>
                                        <h3>{plantilla.nombre}</h3>
                                        {plantillaSeleccionada === plantilla.id && (
                                            <ion-icon name="checkmark-circle" className={estilos.check}></ion-icon>
                                        )}
                                    </div>
                                    {plantilla.descripcion && (
                                        <p className={estilos.descripcion}>{plantilla.descripcion}</p>
                                    )}
                                    <div className={estilos.badge}>
                                        {plantilla.tipo_destino === 'obra' ? '🏗️ Obra' : '⚡ Servicio'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {cargandoDetalle && (
                        <div className={estilos.cargandoDetalle}>
                            <ion-icon name="hourglass-outline"></ion-icon>
                            <span>Cargando detalle...</span>
                        </div>
                    )}

                    {detallePlantilla && detallePlantilla.detalle && (
                        <div className={estilos.preview}>
                            <h4>Materiales en la plantilla:</h4>
                            <ul>
                                {detallePlantilla.detalle.map((item, index) => (
                                    <li key={index}>
                                        <strong>{item.material_nombre}</strong>
                                        {item.cantidad_referencial > 0 && (
                                            <span> - {item.cantidad_referencial} {item.unidad_medida || item.unidad_medida_base || ''}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className={estilos.footer}>
                    <button type="button" className={estilos.btnCancelar} onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={estilos.btnAplicar}
                        onClick={handleAplicar}
                        disabled={!detallePlantilla}
                    >
                        <ion-icon name="checkmark-outline"></ion-icon>
                        Aplicar Plantilla
                    </button>
                </div>
            </div>
        </div>
    )
}

