"use client"
import { useState, useEffect } from 'react'
import { obtenerMaterialesRecientes } from '../../servidor'
import estilos from './MaterialesRecientes.module.css'

export default function MaterialesRecientes({ 
    onSelect, 
    tema = 'light',
    limite = 10 
}) {
    const [materiales, setMateriales] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarMateriales()
    }, [])

    const cargarMateriales = async () => {
        setCargando(true)
        try {
            const res = await obtenerMaterialesRecientes(null, limite)
            if (res.success) {
                setMateriales(res.materiales || [])
            }
        } catch (error) {
            console.error('Error al cargar materiales recientes:', error)
        } finally {
            setCargando(false)
        }
    }

    const handleSelect = (material) => {
        onSelect?.({
            material_nombre: material.material_nombre,
            unidad_medida: material.unidad_medida || '',
            categoria_id: material.categoria_material_id || null
        })
    }

    if (cargando) {
        return (
            <div className={estilos.contenedor}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline"></ion-icon>
                    <span>Cargando materiales recientes...</span>
                </div>
            </div>
        )
    }

    if (materiales.length === 0) {
        return null
    }

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.header}>
                <ion-icon name="time-outline"></ion-icon>
                <h3>Materiales Recientes</h3>
            </div>
            <div className={estilos.chips}>
                {materiales.map((material, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`${estilos.chip} ${estilos[tema]}`}
                        onClick={() => handleSelect(material)}
                        title={`Usado ${material.veces_usado} vez${material.veces_usado > 1 ? 'es' : ''}`}
                    >
                        <span className={estilos.nombre}>{material.material_nombre}</span>
                        {material.unidad_medida && (
                            <span className={estilos.unidad}>{material.unidad_medida}</span>
                        )}
                        {material.categoria_nombre && (
                            <span className={estilos.categoria}>{material.categoria_nombre}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

