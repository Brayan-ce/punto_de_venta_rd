"use client"

import { useState, useEffect } from 'react'
import estilos from '../credito.module.css'

export default function ConfiguracionCredito() {
    const [tema, setTema] = useState('light')

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        return () => window.removeEventListener('temaChange', manejarCambioTema)
    }, [])

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* HEADER */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>⚙️ Configuración de Políticas</h1>
                    <p className={estilos.subtitulo}>Configuración de reglas y políticas de crédito</p>
                </div>
            </div>

            {/* PLACEHOLDER */}
            <div style={{
                background: 'var(--bg-primary)',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)'
            }}>
                <ion-icon
                    name="construct-outline"
                    style={{ fontSize: '4rem', color: 'var(--accent-color)', marginBottom: '20px' }}
                ></ion-icon>
                <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Módulo en Desarrollo
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    La configuración de políticas de crédito estará disponible próximamente.
                    Por ahora, las políticas se gestionan a través de la base de datos en la tabla <code>reglas_credito</code>.
                </p>
            </div>
        </div>
    )
}
