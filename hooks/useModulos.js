/**
 * ============================================
 * HOOK: useModulos
 * ============================================
 * 
 * Hook para gestionar módulos habilitados en el cliente
 * Proporciona funciones para verificar módulos y obtener rutas permitidas
 */

'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Hook para gestionar módulos habilitados
 * @returns {Object} - Objeto con módulos, funciones de verificación y estado de carga
 */
export function useModulos() {
    const [modulos, setModulos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    /**
     * Cargar módulos habilitados desde la API
     */
    const cargarModulos = useCallback(async () => {
        try {
            setCargando(true)
            setError(null)

            const response = await fetch('/api/modulos')
            const data = await response.json()

            if (!data.success) {
                throw new Error(data.mensaje || 'Error al cargar módulos')
            }

            setModulos(data.modulos || [])

        } catch (err) {
            console.error('Error al cargar módulos:', err)
            setError(err.message)
            setModulos([])
        } finally {
            setCargando(false)
        }
    }, [])

    // Cargar módulos al montar el componente
    useEffect(() => {
        cargarModulos()
    }, [cargarModulos])

    /**
     * Verificar si un módulo está habilitado
     * @param {string} codigo - Código del módulo (ej: 'pos', 'financiamiento')
     * @returns {boolean} - true si está habilitado
     */
    const tieneModulo = useCallback((codigo) => {
        if (!codigo) return false
        
        const modulo = modulos.find(m => m.codigo === codigo)
        return modulo ? Boolean(modulo.habilitado) : false
    }, [modulos])

    /**
     * Obtener información completa de un módulo
     * @param {string} codigo - Código del módulo
     * @returns {Object|null} - Objeto del módulo o null
     */
    const obtenerModulo = useCallback((codigo) => {
        if (!codigo) return null
        return modulos.find(m => m.codigo === codigo) || null
    }, [modulos])

    /**
     * Obtener módulos por categoría
     * @param {string} categoria - Categoría a filtrar
     * @returns {Array} - Array de módulos de la categoría
     */
    const obtenerModulosPorCategoria = useCallback((categoria) => {
        if (!categoria) return []
        return modulos.filter(m => m.categoria === categoria && m.habilitado)
    }, [modulos])

    /**
     * Obtener todos los módulos habilitados
     * @returns {Array} - Array de módulos habilitados
     */
    const obtenerModulosHabilitados = useCallback(() => {
        return modulos.filter(m => m.habilitado)
    }, [modulos])

    /**
     * Verificar si una ruta pertenece a un módulo habilitado
     * @param {string} ruta - Ruta a verificar
     * @param {string} codigoModulo - Código del módulo
     * @returns {boolean} - true si la ruta pertenece al módulo y está habilitado
     */
    const rutaPermitida = useCallback((ruta, codigoModulo) => {
        if (!ruta || !codigoModulo) return false
        
        const modulo = obtenerModulo(codigoModulo)
        if (!modulo || !modulo.habilitado) {
            return false
        }

        // Importar dinámicamente el catálogo para verificar rutas
        return import('@/lib/modulos/catalogo').then(({ obtenerModuloPorRuta }) => {
            const moduloRuta = obtenerModuloPorRuta(ruta)
            return moduloRuta && moduloRuta.codigo === codigoModulo
        }).catch(() => false)
    }, [obtenerModulo])

    /**
     * Filtrar array de items de navegación según módulos habilitados
     * @param {Array} items - Array de items con propiedad 'modulo'
     * @returns {Array} - Array filtrado
     */
    const filtrarPorModulos = useCallback((items) => {
        if (!Array.isArray(items)) return []
        
        return items.filter(item => {
            // Si no tiene propiedad modulo, siempre mostrar
            if (!item.modulo) return true
            
            // Si tiene modulo, verificar si está habilitado
            return tieneModulo(item.modulo)
        })
    }, [tieneModulo])

    return {
        modulos,
        cargando,
        error,
        tieneModulo,
        obtenerModulo,
        obtenerModulosPorCategoria,
        obtenerModulosHabilitados,
        rutaPermitida,
        filtrarPorModulos,
        recargar: cargarModulos
    }
}

