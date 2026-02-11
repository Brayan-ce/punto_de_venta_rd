"use client"
import { useState, useRef, useEffect } from 'react'
import estilos from './TagInput.module.css'

/**
 * Componente de entrada de etiquetas (tags) con autocompletado
 * Permite agregar múltiples etiquetas y sugerir etiquetas existentes
 */
export default function TagInput({ 
    value = [], 
    onChange,
    sugerencias = [],
    placeholder = 'Escribe y presiona Enter...',
    maxTags = 10
}) {
    const [tags, setTags] = useState(value || [])
    const [inputValue, setInputValue] = useState('')
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
    const inputRef = useRef(null)
    const wrapperRef = useRef(null)

    useEffect(() => {
        setTags(value || [])
    }, [value])

    useEffect(() => {
        // Cerrar sugerencias al hacer click fuera
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setMostrarSugerencias(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filtrarSugerencias = (texto) => {
        if (!texto || texto.trim().length === 0) {
            return []
        }
        const textoLower = texto.toLowerCase()
        return sugerencias
            .filter(sug => sug.toLowerCase().includes(textoLower))
            .filter(sug => !tags.includes(sug))
            .slice(0, 5)
    }

    const agregarTag = (tag) => {
        const tagNormalizado = tag.trim()
        if (!tagNormalizado) return

        // Validar que no esté duplicado
        if (tags.includes(tagNormalizado)) {
            return
        }

        // Validar límite
        if (tags.length >= maxTags) {
            return
        }

        // Validar longitud máxima (20 caracteres)
        if (tagNormalizado.length > 20) {
            return
        }

        const nuevosTags = [...tags, tagNormalizado]
        setTags(nuevosTags)
        onChange?.(nuevosTags)
        setInputValue('')
        setMostrarSugerencias(false)
    }

    const eliminarTag = (tagAEliminar) => {
        const nuevosTags = tags.filter(tag => tag !== tagAEliminar)
        setTags(nuevosTags)
        onChange?.(nuevosTags)
    }

    const handleInputChange = (e) => {
        const valor = e.target.value
        setInputValue(valor)
        
        if (valor.trim().length > 0) {
            setMostrarSugerencias(true)
        } else {
            setMostrarSugerencias(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault()
            agregarTag(inputValue)
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            // Eliminar último tag si no hay texto y se presiona backspace
            eliminarTag(tags[tags.length - 1])
        }
    }

    const sugerenciasFiltradas = filtrarSugerencias(inputValue)

    return (
        <div ref={wrapperRef} className={estilos.wrapper}>
            <div className={estilos.container}>
                {tags.map((tag, index) => (
                    <span key={index} className={estilos.tag}>
                        {tag}
                        <button
                            type="button"
                            onClick={() => eliminarTag(tag)}
                            className={estilos.tagRemove}
                            aria-label={`Eliminar ${tag}`}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue && setMostrarSugerencias(true)}
                    placeholder={tags.length === 0 ? placeholder : ''}
                    className={estilos.input}
                    disabled={tags.length >= maxTags}
                />
            </div>

            {mostrarSugerencias && sugerenciasFiltradas.length > 0 && (
                <div className={estilos.dropdown}>
                    {sugerenciasFiltradas.map((sugerencia, index) => (
                        <div
                            key={index}
                            onClick={() => agregarTag(sugerencia)}
                            className={estilos.sugerencia}
                        >
                            {sugerencia}
                        </div>
                    ))}
                </div>
            )}

            {tags.length > 0 && (
                <div className={estilos.counter}>
                    {tags.length} / {maxTags} etiquetas
                </div>
            )}
        </div>
    )
}

