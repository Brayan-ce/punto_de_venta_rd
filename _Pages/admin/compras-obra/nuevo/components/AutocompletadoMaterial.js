"use client"
import { useState, useEffect, useRef } from 'react'
import { obtenerMaterialesCatalogo, obtenerPrecioMaterial } from '../../servidor'
import estilos from './AutocompletadoMaterial.module.css'

export default function AutocompletadoMaterial({ 
    value = '', 
    onChange, 
    onSelect, 
    proveedorId = null,
    tema = 'light',
    placeholder = 'Buscar material...'
}) {
    const [termino, setTermino] = useState(value)
    const [sugerencias, setSugerencias] = useState([])
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
    const [cargando, setCargando] = useState(false)
    const [materialSeleccionado, setMaterialSeleccionado] = useState(null)
    const inputRef = useRef(null)
    const dropdownRef = useRef(null)

    useEffect(() => {
        setTermino(value)
    }, [value])

    useEffect(() => {
        // Cerrar dropdown al hacer click fuera
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target) &&
                inputRef.current &&
                !inputRef.current.contains(event.target)
            ) {
                setMostrarSugerencias(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const buscarMateriales = async (texto) => {
        if (texto.length < 2) {
            setSugerencias([])
            setMostrarSugerencias(false)
            return
        }

        setCargando(true)
        try {
            const res = await obtenerMaterialesCatalogo(texto)
            if (res.success) {
                setSugerencias(res.materiales || [])
                setMostrarSugerencias(true)
            }
        } catch (error) {
            console.error('Error al buscar materiales:', error)
            setSugerencias([])
        } finally {
            setCargando(false)
        }
    }

    const handleInputChange = (e) => {
        const nuevoValor = e.target.value
        setTermino(nuevoValor)
        onChange?.(nuevoValor)
        setMaterialSeleccionado(null)
        
        if (nuevoValor.length >= 2) {
            buscarMateriales(nuevoValor)
        } else {
            setSugerencias([])
            setMostrarSugerencias(false)
        }
    }

    const handleSelectMaterial = async (material) => {
        setTermino(material.nombre)
        setMaterialSeleccionado(material)
        setMostrarSugerencias(false)
        onChange?.(material.nombre)
        
        // Obtener precio sugerido si hay proveedor
        let precioSugerido = null
        if (proveedorId && material.id) {
            try {
                const precioRes = await obtenerPrecioMaterial(material.id, proveedorId)
                if (precioRes.success && precioRes.precio) {
                    precioSugerido = precioRes.precio
                }
            } catch (error) {
                console.error('Error al obtener precio:', error)
            }
        }

        // Llamar callback con datos completos
        onSelect?.({
            material_nombre: material.nombre,
            material_id: material.id,
            unidad_medida: material.unidad_medida_base,
            categoria_id: material.categoria_id,
            precio_sugerido: precioSugerido
        })
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setMostrarSugerencias(false)
        } else if (e.key === 'ArrowDown' && sugerencias.length > 0) {
            e.preventDefault()
            // Navegación por teclado (implementación básica)
        }
    }

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.inputWrapper}>
                <input
                    ref={inputRef}
                    type="text"
                    value={termino}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (sugerencias.length > 0) {
                            setMostrarSugerencias(true)
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`${estilos.input} ${estilos[tema]}`}
                />
                {cargando && (
                    <div className={estilos.loader}>
                        <ion-icon name="hourglass-outline"></ion-icon>
                    </div>
                )}
                {materialSeleccionado && (
                    <div className={estilos.check}>
                        <ion-icon name="checkmark-circle"></ion-icon>
                    </div>
                )}
            </div>

            {mostrarSugerencias && sugerencias.length > 0 && (
                <div ref={dropdownRef} className={`${estilos.dropdown} ${estilos[tema]}`}>
                    {sugerencias.map((material) => (
                        <div
                            key={material.id}
                            className={estilos.sugerencia}
                            onClick={() => handleSelectMaterial(material)}
                            onMouseEnter={(e) => e.currentTarget.classList.add(estilos.hover)}
                            onMouseLeave={(e) => e.currentTarget.classList.remove(estilos.hover)}
                        >
                            <div className={estilos.sugerenciaInfo}>
                                <strong>{material.nombre}</strong>
                                {material.categoria_nombre && (
                                    <span className={estilos.categoria}>
                                        {material.categoria_nombre}
                                    </span>
                                )}
                            </div>
                            {material.unidad_medida_base && (
                                <div className={estilos.unidad}>
                                    {material.unidad_medida_base}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {mostrarSugerencias && sugerencias.length === 0 && termino.length >= 2 && !cargando && (
                <div className={`${estilos.dropdown} ${estilos[tema]}`}>
                    <div className={estilos.sinResultados}>
                        <ion-icon name="search-outline"></ion-icon>
                        <p>No se encontraron materiales</p>
                        <small>Puedes escribir el nombre libremente</small>
                    </div>
                </div>
            )}
        </div>
    )
}

