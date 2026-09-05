'use client'

import { usePermisoImpresion } from '@/hooks/usePermisoImpresion'
import PrinterButton from './PrinterButton'

/**
 * Componente PrinterButton con verificación de permisos
 * Solo muestra el botón de impresión si el usuario tiene el permiso habilitado
 * 
 * @param {string} ventaId - ID de la venta a imprimir
 * @param {boolean} compact - Modo compacto (solo íconos)
 * @param {function} onServiceReady - Callback cuando el servicio esté listo
 */
export default function PrinterButtonConPermiso({ ventaId, compact = false, onServiceReady }) {
    const { tienePermiso, cargando } = usePermisoImpresion()

    // Mientras verifica permisos, no mostrar nada (o un placeholder opcional)
    if (cargando) {
        return null // O un spinner pequeño si prefieres
    }

    // Si no tiene permiso, no mostrar el botón
    if (!tienePermiso) {
        return null
    }

    // Si tiene permiso, mostrar el botón normal
    return (
        <PrinterButton 
            ventaId={ventaId} 
            compact={compact} 
            onServiceReady={onServiceReady} 
        />
    )
}
