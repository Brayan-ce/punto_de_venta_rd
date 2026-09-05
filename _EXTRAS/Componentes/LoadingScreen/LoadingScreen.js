"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { obtenerDatosPlataforma } from './servidor'
import estilos from './LoadingScreen.module.css'

export default function LoadingScreen({ text, minimal }) {
    const [tema, setTema] = useState('light')
    const [progreso, setProgreso] = useState(5)
    const [nombrePlataforma, setNombrePlataforma] = useState('')

    useEffect(() => {
        setTema(localStorage.getItem('tema') || 'light')
        const fn = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', fn)
        window.addEventListener('storage', fn)
        return () => {
            window.removeEventListener('temaChange', fn)
            window.removeEventListener('storage', fn)
        }
    }, [])

    useEffect(() => {
        obtenerDatosPlataforma().then(r => {
            if (r?.success) setNombrePlataforma(r.nombre_plataforma)
        })
    }, [])

    useEffect(() => {
        const t = setInterval(() => {
            setProgreso(prev => {
                if (prev >= 90) return prev
                const restante = 90 - prev
                return prev + Math.max(0.3, restante * 0.04)
            })
        }, 200)
        return () => clearInterval(t)
    }, [])

    return (
        <div className={`${estilos.splash} ${estilos[tema]}${minimal ? ' ' + estilos.minimal : ''}`}>
            {!minimal && <>
                <div className={estilos.esquinaSuperior} />
                <div className={estilos.esquinaInferior} />
                <div className={estilos.esquinaInferiorReflejo} />
            </>}

            {!minimal && <div className={estilos.contenido}>
                <Image
                    src="/logo.png"
                    alt={nombrePlataforma || 'IZIWEEK'}
                    width={180}
                    height={60}
                    className={estilos.logo}
                    priority
                />
                <h1 className={estilos.marca}>{nombrePlataforma || 'IZIWEEK'}</h1>
                <p className={estilos.eslogan}>SISTEMA DE GESTIÓN TOTAL</p>
            </div>}

            <div className={`${estilos.loadingSection}${minimal ? ' ' + estilos.loadingMinimal : ''}`}>
                <div className={estilos.barraTrack}>
                    <div className={estilos.barraProgreso} style={{ width: progreso + '%' }} />
                </div>
                <span className={estilos.textoCarga}>{text || 'CARGANDO'} <span className={estilos.porcentaje}>{Math.round(progreso)}%</span></span>
            </div>
        </div>
    )
}
