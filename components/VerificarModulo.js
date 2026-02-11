/**
 * ============================================
 * COMPONENTE: VerificarModulo
 * ============================================
 * 
 * Componente wrapper para verificar si un módulo está habilitado
 * antes de renderizar el contenido. Se usa en las páginas que requieren módulos específicos.
 * 
 * Uso:
 * <VerificarModulo codigoModulo="financiamiento">
 *   <ContenidoDelModulo />
 * </VerificarModulo>
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useModulos } from '@/hooks/useModulos'

export default function VerificarModulo({ codigoModulo, children, redirectTo = '/admin/dashboard' }) {
    const { tieneModulo, cargando } = useModulos()
    const router = useRouter()
    const [verificado, setVerificado] = useState(false)

    useEffect(() => {
        if (!cargando) {
            if (!codigoModulo || tieneModulo(codigoModulo)) {
                setVerificado(true)
            } else {
                // Redirigir al dashboard con mensaje de error
                router.push(`${redirectTo}?error=modulo_no_disponible&modulo=${codigoModulo}`)
            }
        }
    }, [codigoModulo, tieneModulo, cargando, router, redirectTo])

    if (cargando) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '50vh' 
            }}>
                <div>Cargando...</div>
            </div>
        )
    }

    if (!verificado) {
        return null
    }

    return <>{children}</>
}

