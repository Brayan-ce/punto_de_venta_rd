"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { solicitarRecuperacion } from './servidor'
import estilos from './recuperar.module.css'

export default function RecuperarPassword() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [email, setEmail] = useState('')
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const [exito, setExito] = useState(false)

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    const manejarSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)

        try {
            const resultado = await solicitarRecuperacion(email)

            if (resultado.success) {
                setExito(true)
                
                setTimeout(() => {
                    if (resultado.whatsappUrl) {
                        window.open(resultado.whatsappUrl, '_blank')
                    }
                    router.push('/login')
                }, 2000)
            } else {
                setError(resultado.mensaje || 'Error al procesar la solicitud')
            }
        } catch (error) {
            setError('Error al procesar la solicitud')
            console.error('Error en recuperacion:', error)
        } finally {
            setCargando(false)
        }
    }

    if (exito) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={`${estilos.caja} ${estilos[tema]}`}>
                    <div className={estilos.exitoIcono}>
                        <ion-icon name="checkmark-circle"></ion-icon>
                    </div>
                    <h2 className={estilos.exitoTitulo}>Solicitud Enviada</h2>
                    <p className={estilos.exitoTexto}>
                        Tu solicitud de recuperacion ha sido enviada. Seras redirigido a WhatsApp para contactar al administrador.
                    </p>
                    <p className={estilos.exitoRedireccion}>
                        Abriendo WhatsApp...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.caja} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div className={estilos.icono}>
                        <ion-icon name="lock-closed-outline"></ion-icon>
                    </div>
                    <h1 className={estilos.titulo}>Recuperar Contrasena</h1>
                    <p className={estilos.subtitulo}>
                        Ingresa tu correo electronico y te ayudaremos a recuperar tu cuenta
                    </p>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.formulario}>
                    {error && (
                        <div className={estilos.error}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={estilos.campo}>
                        <label htmlFor="email" className={estilos.label}>
                            Correo Electronico
                        </label>
                        <div className={estilos.inputWrapper}>
                            <ion-icon name="mail-outline"></ion-icon>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className={estilos.input}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className={estilos.botonSubmit}
                    >
                        {cargando ? (
                            <>
                                <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                                <span>Enviando solicitud...</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="paper-plane-outline"></ion-icon>
                                <span>Enviar Solicitud</span>
                            </>
                        )}
                    </button>
                </form>

                <div className={estilos.footer}>
                    <Link href="/login" className={estilos.enlaceVolver}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver al inicio de sesion</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}