"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import estilos from './modal-terminos.module.css'
import { verificarAceptacionUsuario, aceptarTerminos } from '@/_Pages/superadmin/terminos/servidor'

export default function ModalTerminos() {
    const router = useRouter()
    const contenidoRef = useRef(null)

    const [tema, setTema] = useState('light')
    const [mostrar, setMostrar] = useState(false)
    const [terminos, setTerminos] = useState(null)
    const [aceptando, setAceptando] = useState(false)
    const [leido, setLeido] = useState(false)
    const [porcentajeLeido, setPorcentajeLeido] = useState(0)
    const [cargando, setCargando] = useState(true)

    // Manejo del tema
    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            setTema(localStorage.getItem('tema') || 'light')
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    // Verificar términos al montar
    useEffect(() => {
        verificarTerminos()
    }, [])

    // Prevenir scroll del body cuando el modal está abierto
    useEffect(() => {
        if (mostrar) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [mostrar])

    const verificarTerminos = async () => {
        setCargando(true)
        try {
            const resultado = await verificarAceptacionUsuario()

            if (resultado.success && resultado.requiereAceptacion) {
                setTerminos(resultado.terminos)
                setMostrar(true)
            }
        } catch (error) {
            console.error('Error al verificar términos:', error)
        } finally {
            setCargando(false)
        }
    }

    const formatearContenido = (contenido = '') => {
        if (!contenido) return ''

        // Configurar marked para mejor renderizado
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false,
            pedantic: false,
            sanitize: false
        })

        const html = marked.parse(contenido)

        // Sanitizar HTML para seguridad
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'p', 'br', 'hr', 'div', 'span',
                'ul', 'ol', 'li',
                'strong', 'em', 'u', 's', 'del', 'ins',
                'a', 'code', 'pre',
                'blockquote',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'img'
            ],
            ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id']
        })
    }

    const manejarScroll = (e) => {
        const elemento = e.target
        const scrollTop = elemento.scrollTop
        const scrollHeight = elemento.scrollHeight
        const clientHeight = elemento.clientHeight
        const scrollRestante = scrollHeight - scrollTop - clientHeight

        // Calcular porcentaje de lectura
        const porcentaje = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
        setPorcentajeLeido(porcentaje)

        // Marcar como leído si está cerca del final (menos de 100px del fondo)
        if (scrollRestante < 100) {
            setLeido(true)
        }
    }

    const manejarAceptar = async () => {
        if (!leido) {
            mostrarNotificacion('Por favor, lee los términos completos desplazándote hasta el final antes de aceptar', 'warning')
            return
        }

        setAceptando(true)
        try {
            const resultado = await aceptarTerminos(terminos.id)

            if (resultado.success) {
                mostrarNotificacion('Términos aceptados correctamente', 'success')
                setMostrar(false)

                // Pequeño delay para mostrar la notificación antes de refrescar
                setTimeout(() => {
                    router.refresh()
                }, 500)
            } else {
                mostrarNotificacion(resultado.mensaje || 'Error al aceptar términos', 'error')
            }
        } catch (error) {
            console.error('Error al procesar aceptación:', error)
            mostrarNotificacion('Error al procesar la aceptación. Por favor, intenta nuevamente.', 'error')
        } finally {
            setAceptando(false)
        }
    }

    const manejarCerrarSesion = () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión? Deberás aceptar los términos la próxima vez que inicies sesión.')) {
            cerrarSesion()
        }
    }

    const cerrarSesion = () => {
        // Limpiar todas las cookies
        document.cookie.split(";").forEach((cookie) => {
            const nombre = cookie.split("=")[0].trim()
            document.cookie = `${nombre}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        })

        // Limpiar localStorage relacionado con sesión (opcional)
        const keysToKeep = ['tema'] // Mantener preferencias del usuario
        const allKeys = Object.keys(localStorage)
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key)
            }
        })

        // Redirigir al login
        router.push('/login')
    }

    const mostrarNotificacion = (mensaje, tipo = 'info') => {
        // Puedes reemplazar esto con tu sistema de notificaciones
        if (tipo === 'warning' || tipo === 'error') {
            alert(mensaje)
        }
    }

    const scrollAlInicio = () => {
        if (contenidoRef.current) {
            contenidoRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }
    }

    const scrollAlFinal = () => {
        if (contenidoRef.current) {
            contenidoRef.current.scrollTo({
                top: contenidoRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }

    // No mostrar nada si está cargando o no hay términos
    if (cargando || !mostrar || !terminos) {
        return null
    }

    return (
        <div className={`${estilos.overlay} ${estilos[tema]}`}>
            <div className={`${estilos.modal} ${estilos[tema]}`}>
                {/* HEADER */}
                <div className={estilos.header}>
                    <div className={estilos.iconoHeader}>
                        <ion-icon name="document-text-outline"></ion-icon>
                    </div>
                    <h2 className={estilos.titulo}>Términos y Condiciones Actualizados</h2>
                    <p className={estilos.subtitulo}>
                        Se han actualizado los Términos y Condiciones. Para continuar usando el sistema, es necesario aceptarlos.
                    </p>
                </div>

                {/* CONTENIDO */}
                <div
                    ref={contenidoRef}
                    className={estilos.contenido}
                    onScroll={manejarScroll}
                >
                    <div className={estilos.versionInfo}>
                        <span className={estilos.badge}>Versión {terminos.version}</span>
                        <h3>{terminos.titulo}</h3>
                    </div>

                    <div
                        className={estilos.textoTerminos}
                        dangerouslySetInnerHTML={{
                            __html: formatearContenido(terminos.contenido)
                        }}
                    />

                    {!leido && porcentajeLeido < 90 && (
                        <div className={estilos.avisoScroll}>
                            <ion-icon name="arrow-down-circle-outline"></ion-icon>
                            <p>Continúa leyendo hasta el final para habilitar el botón de aceptación</p>
                            <button
                                onClick={scrollAlFinal}
                                style={{
                                    marginTop: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: 'transparent',
                                    border: '1px solid currentColor',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Ir al final
                            </button>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className={estilos.footer}>
                    {/* Indicador de progreso */}
                    {!leido && (
                        <div style={{
                            marginBottom: '1rem',
                            fontSize: '0.85rem',
                            color: '#64748b',
                            textAlign: 'center'
                        }}>
                            Progreso de lectura: {porcentajeLeido}%
                        </div>
                    )}

                    <div className={estilos.avisoLegal}>
                        <ion-icon name="shield-checkmark-outline"></ion-icon>
                        <p>
                            La aceptación quedará registrada conforme a los Términos y Condiciones.
                        </p>
                    </div>

                    <div className={estilos.acciones}>
                        <button
                            onClick={manejarCerrarSesion}
                            className={estilos.btnRechazar}
                            disabled={aceptando}
                            aria-label="Rechazar términos y cerrar sesión"
                        >
                            <ion-icon name="log-out-outline"></ion-icon>
                            <span>Rechazar y Cerrar Sesión</span>
                        </button>

                        <button
                            onClick={manejarAceptar}
                            className={estilos.btnAceptar}
                            disabled={!leido || aceptando}
                            aria-label="Aceptar términos y condiciones"
                            title={!leido ? 'Debes leer todos los términos primero' : 'Aceptar términos'}
                        >
                            {aceptando ? (
                                <>
                                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <span>Acepto los Términos y Condiciones</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Botón para volver arriba (útil en móviles) */}
                    {leido && (
                        <button
                            onClick={scrollAlInicio}
                            style={{
                                marginTop: '1rem',
                                padding: '0.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                margin: '0 auto',
                                marginTop: '1rem'
                            }}
                        >
                            <ion-icon name="arrow-up-circle-outline"></ion-icon>
                            <span>Volver al inicio del documento</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}