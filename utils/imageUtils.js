"use client"

import { useState } from 'react'

/**
 * Obtiene una URL de imagen válida o null
 * Esta función SOLO decide qué mostrar, NO maneja archivos
 * @param {string} imagenUrl - La URL de la imagen
 * @returns {string|null} - URL válida o null si no es válida
 */
export function obtenerUrlImagenValida(imagenUrl) {
    if (!imagenUrl) return null
    
    // Rutas locales
    if (imagenUrl.startsWith('/images/')) {
        return imagenUrl
    }
    
    // URLs externas
    try {
        new URL(imagenUrl)
        return imagenUrl
    } catch {
        return null
    }
}

/**
 * Componente de imagen con fallback automático
 * @param {Object} props - Propiedades del componente
 * @param {string} props.src - URL de la imagen
 * @param {string} props.alt - Texto alternativo
 * @param {string} props.className - Clases CSS
 * @param {boolean} props.placeholder - Si mostrar placeholder cuando falla (default: true)
 * @param {string} props.placeholderClassName - Clase CSS para el placeholder
 * @returns {JSX.Element}
 */
export function ImagenProducto({ src, alt, className = '', placeholder = true, placeholderClassName = '' }) {
    const [error, setError] = useState(false)
    const urlValida = obtenerUrlImagenValida(src)

    if (!urlValida || error) {
        if (!placeholder) return null
        
        return (
            <div className={`${className} imagen-placeholder ${placeholderClassName}`}>
                <ion-icon name="image-outline"></ion-icon>
                <span>Sin imagen</span>
            </div>
        )
    }

    return (
        <img 
            src={urlValida} 
            alt={alt}
            className={className}
            onError={() => setError(true)}
        />
    )
}
