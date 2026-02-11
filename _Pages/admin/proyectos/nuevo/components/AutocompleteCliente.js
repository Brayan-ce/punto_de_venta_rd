"use client"
import { useState, useEffect, useRef } from 'react'
import { obtenerClientes } from '../../../clientes/servidor'
import estilos from './AutocompleteCliente.module.css'

/**
 * Componente de autocompletado para selección de clientes
 * Con búsqueda en tiempo real y sugerencias
 */
export default function AutocompleteCliente({ 
    value = '', 
    onChange, 
    onSelect,
    placeholder = 'Buscar cliente...',
    error = null
}) {
    const [termino, setTermino] = useState(value)
    const [sugerencias, setSugerencias] = useState([])
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
    const [cargando, setCargando] = useState(false)
    const [clientes, setClientes] = useState([])
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
    const inputRef = useRef(null)
    const dropdownRef = useRef(null)

    // Cargar clientes al montar
    useEffect(() => {
        cargarClientes()
    }, [])

    useEffect(() => {
        // Cerrar dropdown al hacer click fuera
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target) &&
                inputRef.current &&
                !inputRef.current.contains(event.target)
            ) {
                setMostrarSugerencias(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    async function cargarClientes() {
        try {
            const res = await obtenerClientes()
            if (res.success) {
                setClientes(res.clientes || [])
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error)
        }
    }

    const filtrarClientes = (texto) => {
        if (!texto || texto.length < 1) {
            setSugerencias([])
            setMostrarSugerencias(false)
            return
        }

        const textoLower = texto.toLowerCase()
        const filtrados = clientes.filter(cliente => {
            const nombreCompleto = cliente.nombreCompleto || `${cliente.nombre} ${cliente.apellidos || ''}`
            return nombreCompleto.toLowerCase().includes(textoLower) ||
                   (cliente.telefono && cliente.telefono.includes(texto)) ||
                   (cliente.email && cliente.email.toLowerCase().includes(textoLower))
        }).slice(0, 10) // Limitar a 10 resultados

        setSugerencias(filtrados)
        setMostrarSugerencias(filtrados.length > 0)
    }

    const handleInputChange = (e) => {
        const nuevoValor = e.target.value
        setTermino(nuevoValor)
        onChange?.(nuevoValor)
        setClienteSeleccionado(null)
        
        filtrarClientes(nuevoValor)
    }

    const handleSelectCliente = (cliente) => {
        const nombreCompleto = cliente.nombreCompleto || `${cliente.nombre} ${cliente.apellidos || ''}`
        setTermino(nombreCompleto)
        setClienteSeleccionado(cliente)
        setMostrarSugerencias(false)
        onChange?.(nombreCompleto)
        onSelect?.(cliente)
    }

    const handleClear = () => {
        setTermino('')
        setClienteSeleccionado(null)
        setMostrarSugerencias(false)
        onChange?.('')
        onSelect?.(null)
        inputRef.current?.focus()
    }

    return (
        <div className={estilos.wrapper}>
            <div className={`${estilos.inputWrapper} ${error ? estilos.error : ''}`}>
                <input
                    ref={inputRef}
                    type="text"
                    value={termino}
                    onChange={handleInputChange}
                    onFocus={() => termino && filtrarClientes(termino)}
                    placeholder={placeholder}
                    className={estilos.input}
                />
                {termino && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className={estilos.clearButton}
                        aria-label="Limpiar"
                    >
                        ×
                    </button>
                )}
            </div>

            {mostrarSugerencias && sugerencias.length > 0 && (
                <div ref={dropdownRef} className={estilos.dropdown}>
                    {sugerencias.map(cliente => {
                        const nombreCompleto = cliente.nombreCompleto || `${cliente.nombre} ${cliente.apellidos || ''}`
                        return (
                            <div
                                key={cliente.id}
                                onClick={() => handleSelectCliente(cliente)}
                                className={estilos.sugerencia}
                            >
                                <div className={estilos.nombre}>{nombreCompleto}</div>
                                {(cliente.telefono || cliente.email) && (
                                    <div className={estilos.detalles}>
                                        {cliente.telefono && <span>📞 {cliente.telefono}</span>}
                                        {cliente.email && <span>✉️ {cliente.email}</span>}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {error && <span className={estilos.errorText}>{error}</span>}
        </div>
    )
}

