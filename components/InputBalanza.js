/**
 * Input especializado para productos por peso
 * FASE 7.5: UX Premium - Diseño tipo balanza de supermercado
 */

"use client"

import { useState, useEffect } from 'react'
import { limpiarInputCantidad, validarCantidad } from '@/utils/unidadesUtilsClient'
import { formatCurrency } from '@/utils/monedaUtils'
import estilos from './InputBalanza.module.css'

export default function InputBalanza({ 
    valor, 
    onChange, 
    unidadAbreviatura,
    precioUnitario = 0,
    onUnidadChange,
    unidadesDisponibles = [],
    disabled = false,
    permiteDecimales = true,
    moneda = 'DOP',
    locale = 'es-DO',
    simbolo = 'RD$'
}) {
    const [displayValor, setDisplayValor] = useState(valor || '')
    const [precioCalculado, setPrecioCalculado] = useState(0)
    
    useEffect(() => {
        setDisplayValor(valor || '')
    }, [valor])
    
    useEffect(() => {
        if (displayValor && precioUnitario) {
            const cantidad = parseFloat(displayValor)
            if (!isNaN(cantidad) && cantidad > 0) {
                const total = cantidad * precioUnitario
                setPrecioCalculado(total)
            } else {
                setPrecioCalculado(0)
            }
        } else {
            setPrecioCalculado(0)
        }
    }, [displayValor, precioUnitario])
    
    const handleChange = (e) => {
        let valor = e.target.value
        
        // Limpiar input
        valor = limpiarInputCantidad(valor, permiteDecimales)
        
        setDisplayValor(valor)
        
        // Validar y notificar cambio
        if (valor === '' || valor === '0' || valor === '0.') {
            onChange('')
            return
        }
        
        if (validarCantidad(valor, permiteDecimales)) {
            onChange(valor)
        }
    }
    
    const formatearMoneda = (monto) => {
        return formatCurrency(monto, {
            currency: moneda,
            locale: locale,
            symbol: simbolo
        })
    }
    
    return (
        <div className={estilos.inputBalanza}>
            <div className={estilos.inputBalanzaHeader}>
                <span className={estilos.labelBalanza}>Cantidad</span>
                {unidadesDisponibles.length > 0 && (
                    <select
                        value={unidadAbreviatura}
                        onChange={onUnidadChange}
                        className={estilos.selectUnidadBalanza}
                        disabled={disabled}
                    >
                        {unidadesDisponibles.map(um => (
                            <option key={um.id} value={um.abreviatura}>
                                {um.abreviatura}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            
            <input
                type="text"
                inputMode="decimal"
                value={displayValor}
                onChange={handleChange}
                className={estilos.inputBalanzaInput}
                placeholder="0.000"
                disabled={disabled}
                autoFocus
            />
            
            <div className={estilos.precioBalanza}>
                <span className={estilos.precioBalanzaLabel}>Total</span>
                <span className={estilos.precioBalanzaValor}>
                    {formatearMoneda(precioCalculado)}
                </span>
            </div>
        </div>
    )
}

