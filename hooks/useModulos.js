'use client'

import { useEffect, useState, useCallback } from 'react'

export function useModulos() {
    const [modulos, setModulos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    const [systemMode, setSystemMode] = useState('POS')

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
            setSystemMode(data.systemMode || 'POS')

        } catch (err) {
            console.error('Error al cargar módulos:', err)
            setError(err.message)
            setModulos([])
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarModulos()
    }, [cargarModulos])

    const tieneModulo = useCallback((codigo) => {
        if (!codigo) return false
        
        const modulo = modulos.find(m => m.codigo === codigo)
        return modulo ? Boolean(modulo.habilitado) : false
    }, [modulos])

    const obtenerModulo = useCallback((codigo) => {
        if (!codigo) return null
        return modulos.find(m => m.codigo === codigo) || null
    }, [modulos])

    const obtenerModulosPorCategoria = useCallback((categoria) => {
        if (!categoria) return []
        return modulos.filter(m => m.categoria === categoria && m.habilitado)
    }, [modulos])

    const obtenerModulosHabilitados = useCallback(() => {
        return modulos.filter(m => m.habilitado)
    }, [modulos])

    const rutaPermitida = useCallback((ruta, codigoModulo) => {
        if (!ruta || !codigoModulo) return false
        
        const modulo = obtenerModulo(codigoModulo)
        if (!modulo || !modulo.habilitado) {
            return false
        }

        return import('@/lib/modulos/catalogo').then(({ obtenerModuloPorRuta }) => {
            const moduloRuta = obtenerModuloPorRuta(ruta)
            return moduloRuta && moduloRuta.codigo === codigoModulo
        }).catch(() => false)
    }, [obtenerModulo])

    const filtrarPorModulos = useCallback((items) => {
        if (!Array.isArray(items)) return []
        
        return items.filter(item => {
            if (!item.modulo) return true
            return tieneModulo(item.modulo)
        })
    }, [tieneModulo])

    return {
        modulos,
        cargando,
        error,
        systemMode,
        tieneModulo,
        obtenerModulo,
        obtenerModulosPorCategoria,
        obtenerModulosHabilitados,
        rutaPermitida,
        filtrarPorModulos,
        recargar: cargarModulos
    }
}