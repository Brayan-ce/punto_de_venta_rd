"use client"
import { useEffect, useState } from 'react'
import { crearSuperAdminInicial } from './servidor'
import estilos from "./crear.module.css"

export default function CrearSuperAdminInicial() {
    const [mostrarMensaje, setMostrarMensaje] = useState(false)
    const [mensajeCreado, setMensajeCreado] = useState('')

    useEffect(() => {
        const inicializarSuperAdmin = async () => {
            try {
                const resultado = await crearSuperAdminInicial()
                
                if (resultado.creado) {
                    setMensajeCreado('Super Admin creado exitosamente')
                    setMostrarMensaje(true)
                    
                    setTimeout(() => {
                        setMostrarMensaje(false)
                    }, 5000)
                }

                console.log('Resultado:', resultado)
            } catch (error) {
                console.error('Error al inicializar super administrador:', error)
            }
        }

        inicializarSuperAdmin()
    }, [])

    if (mostrarMensaje) {
        return (
            <div className={estilos.mensajeAdminCreado}>
                {mensajeCreado}
            </div>
        )
    }

    return null
}