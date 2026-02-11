/**
 * Componente Input Inteligente de Cantidad
 * FASE 4: Validaciones y UX
 */

"use client"

import { useState, useEffect } from 'react'
import { limpiarInputCantidad, validarCantidad } from '@/utils/unidadesUtilsClient'
import estilos from './InputCantidad.module.css'

export default function InputCantidad({ 
    value, 
    onChange, 
    permiteDecimales = true, 
    unidadAbreviatura = '',
    disabled = false,
    placeholder,
    className = '',
    onBlur,
    min = 0.001
}) {
    const [displayValue, setDisplayValue] = useState(value || '')
    const [error, setError] = useState('')
    
    useEffect(() => {
        setDisplayValue(value || '')
    }, [value])
    
    const handleChange = (e) => {
        let valor = e.target.value
        
        // Limpiar input
        valor = limpiarInputCantidad(valor, permiteDecimales)
        
        setDisplayValue(valor)
        setError('')
        
        // Validar y notificar cambio
        if (valor === '' || valor === '0' || valor === '0.') {
            onChange('')
            return
        }
        
        if (validarCantidad(valor, permiteDecimales)) {
            const num = parseFloat(valor)
            if (num >= min) {
                onChange(valor)
            } else {
                setError(`Mínimo: ${min}`)
            }
        } else {
            if (!permiteDecimales && valor.includes('.')) {
                setError('Este producto solo acepta cantidades enteras')
            } else {
                setError('Cantidad inválida')
            }
        }
    }
    
    const handleBlur = (e) => {
        const valor = e.target.value
        if (valor && parseFloat(valor) < min) {
            setDisplayValue('')
            onChange('')
        }
        if (onBlur) {
            onBlur(e)
        }
    }
    
    return (
        <div className={`${estilos.inputCantidadWrapper} ${className}`}>
            <input
                type="text"
                inputMode="decimal"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={disabled}
                placeholder={placeholder || (permiteDecimales ? "0.000" : "1")}
                className={`${estilos.inputCantidad} ${error ? estilos.error : ''}`}
            />
            {unidadAbreviatura && (
                <span className={estilos.unidadLabel}>{unidadAbreviatura}</span>
            )}
            {error && (
                <span className={estilos.errorMessage}>{error}</span>
            )}
        </div>
    )
}

