"use client"

import { useState } from 'react'

/**
 * Obtiene una URL de imagen válida o null
 * Esta función SOLO decide qué mostrar, NO maneja archivos
 * @param {string} imagenUrl - La URL de la imagen
 * @returns {string|null} - URL válida o null si no es válida
 */
export function obtenerUrlImagenValida(imagenUrl) {
    if (!imagenUrl || typeof imagenUrl !== 'string') return null

    const valor = imagenUrl.trim()
    if (!valor) return null

    // Bloquear esquemas inseguros o no esperados
    if (/^(javascript|data|vbscript):/i.test(valor)) {
        return null
    }

    // URL externa absoluta (http/https)
    try {
        const url = new URL(valor)
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return valor
        }
    } catch {
        // Continuar con validaciones de rutas relativas/locales
    }

    // URL protocol-relative: //cdn.ejemplo.com/imagen.jpg
    if (valor.startsWith('//')) {
        return `https:${valor}`
    }

    // Rutas locales absolutas: /images/..., /uploads/..., etc.
    if (valor.startsWith('/')) {
        return valor
    }

    // Rutas locales relativas: images/..., uploads/...
    if (/^[A-Za-z0-9_\-./]+$/.test(valor)) {
        return `/${valor}`
    }

    return null
}

/**
 * Componente de imagen con fallback automático
 * @param {Object} props - Propiedades del componente
 * @param {string} props.src - URL de la imagen
 * @param {string} props.alt - Texto alternativo
 * @param {string} props.className - Clases CSS
 * @param {boolean} props.placeholder - Si mostrar placeholder cuando falla (default: true)
 * @param {string} props.placeholderClassName - Clase CSS para el placeholder
 * @param {string} props.placeholderText - Texto del placeholder cuando no hay imagen
 * @returns {JSX.Element}
 */
export function ImagenProducto({ src, alt, className = '', placeholder = true, placeholderClassName = '', placeholderText = 'Sin imagen' }) {
    const [error, setError] = useState(false)
    const urlValida = obtenerUrlImagenValida(src)

    if (!urlValida || error) {
        if (!placeholder) return null
        
        return (
            <div className={`${className} imagen-placeholder ${placeholderClassName}`}>
                <ion-icon name="image-outline"></ion-icon>
                <span>{placeholderText}</span>
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
