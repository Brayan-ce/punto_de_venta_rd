"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerCopyright } from './servidor'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { login } from '@/lib/auth/authFacade'
import estilos from './login.module.css'

export default function Login() {
    const router = useRouter()
    const { isOnline } = useOnlineStatus()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mostrarPassword, setMostrarPassword] = useState(false)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const [tema, setTema] = useState('light')
    const [copyright, setCopyright] = useState('© 2025 IziWeek. Todos los derechos reservados.')
    const [rememberMe, setRememberMe] = useState(false)

    const estaOffline = !isOnline

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        // Cargar usuario recordado
        const savedUser = localStorage.getItem('rememberedUser')
        if (savedUser) {
            setEmail(savedUser)
            setRememberMe(true)
        }

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

    // ============================================
    // 🔥 CRÍTICO: Solo cargar copyright si hay conexión
    // ============================================
    useEffect(() => {
        if (!isOnline) return

        const cargarCopyright = async () => {
            try {
                const resultado = await obtenerCopyright()
                if (resultado && resultado.success && resultado.copyright) {
                    setCopyright(resultado.copyright)
                }
            } catch (error) {
                console.log('No se pudo cargar copyright, usando predeterminado')
            }
        }
        cargarCopyright()
    }, [isOnline])

    // ============================================
    // 🔥 SUBMIT CON SOPORTE OFFLINE DESACOPLADO
    // ============================================
    const manejarSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)

        try {
            // El componente no sabe si el login será online u offline
            // La lógica está centralizada en el authFacade
            const resultado = await login(email, password, isOnline)

            if (resultado.success) {
                // Guardar o eliminar usuario recordado
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', email)
                } else {
                    localStorage.removeItem('rememberedUser')
                }

                // Redirigir según tipo de usuario (vuelve del servidor o de cache offline)
                const tipo = resultado.tipo

                if (tipo === 'superadmin') {
                    router.push('/superadmin')
                } else if (tipo === 'admin') {
                    router.push('/admin')
                } else if (tipo === 'vendedor') {
                    router.push('/vendedor')
                }
            } else {
                setError(resultado.mensaje || resultado.message || 'Error al iniciar sesión')
            }
        } catch (error) {
            console.error('Error en manejador de submit:', error)
            setError('Error inesperado al intentar iniciar sesión.')
        } finally {
            setCargando(false)
        }
    }


    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* ============================================ */}
            {/* BANNER DE ESTADO OFFLINE */}
            {/* ============================================ */}
            {estaOffline && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: '#ff9800',
                    color: 'white',
                    padding: '10px',
                    textAlign: 'center',
                    zIndex: 9999,
                    fontWeight: 'bold'
                }}>
                    ⚠️ Sin conexión - Modo Offline
                </div>
            )}

            <div className={`${estilos.caja} ${estilos[tema]}`} style={estaOffline ? { marginTop: '50px' } : {}}>
                <div className={estilos.header}>
                    <h1 className={estilos.titulo}>Iniciar Sesión</h1>
                    <p className={estilos.subtitulo}>Ingresa tus credenciales para continuar</p>
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
                            Correo Electrónico
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

                    <div className={estilos.campo}>
                        <label htmlFor="password" className={estilos.label}>
                            Contraseña
                        </label>
                        <div className={estilos.inputWrapper}>
                            <ion-icon name="lock-closed-outline"></ion-icon>
                            <input
                                type={mostrarPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Tu contraseña"
                                className={estilos.input}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                                className={estilos.togglePassword}
                                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                <ion-icon name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}></ion-icon>
                            </button>
                        </div>
                    </div>

                    <div className={estilos.opciones}>
                        <label className={estilos.rememberMe}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Recordar usuario
                        </label>
                        <Link href="/recuperar" className={estilos.enlaceRecuperar}>
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className={estilos.botonSubmit}
                    >
                        {cargando ? (
                            <>
                                <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                                <span>Iniciando sesión...</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="log-in-outline"></ion-icon>
                                <span>Iniciar Sesión</span>
                            </>
                        )}
                    </button>
                </form>

                <div className={estilos.footer}>
                    <p className={estilos.textoRegistro}>
                        ¿No tienes una cuenta?{' '}
                        <Link href="/registro" className={estilos.enlaceRegistro}>
                            Regístrate aquí
                        </Link>
                    </p>
                    <p className={estilos.copyright}>{copyright}</p>
                </div>
            </div>
        </div>
    )
}