'use client'

import { useState, useEffect } from 'react'
import { verificarPermisoFirma } from '@/_Pages/admin/ventas/servidor/permisos'

/**
 * Hook para verificar si el usuario actual tiene permiso de impresión
 * @returns {Object} { tienePermiso: boolean, cargando: boolean, error: string|null }
 */
export function usePermisoImpresion() {
    const [tienePermiso, setTienePermiso] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const verificarPermiso = async () => {
            try {
                setCargando(true)
                const resultado = await verificarPermisoFirma()
                setTienePermiso(resultado)
                setError(null)
            } catch (err) {
                console.error('Error al verificar permiso de impresión:', err)
                setError('Error al verificar permisos')
                setTienePermiso(false)
            } finally {
                setCargando(false)
            }
        }

        verificarPermiso()
    }, [])

    return { tienePermiso, cargando, error }
}
