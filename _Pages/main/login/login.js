"use client"
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerCopyright, obtenerGuia, obtenerPlataforma, completarSesionSuperAdmin } from './servidor'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { login } from '@/lib/auth/authFacade'
import { useLanguage } from '../i18n'
import estilos from './login.module.css'

export default function Login() {
    const router = useRouter()
    const { isOnline } = useOnlineStatus()
    const { t, language, toggleLanguage } = useLanguage()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mostrarPassword, setMostrarPassword] = useState(false)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const [dark, setDark] = useState(false)
    const [copyright, setCopyright] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [nombrePlataforma, setNombrePlataforma] = useState('')
    const [logoUrl, setLogoUrl] = useState('')
    const [cargandoPlataforma, setCargandoPlataforma] = useState(true)

    const [step, setStep] = useState(1)
    const [otpValue, setOtpValue] = useState('')
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
    const otpRefs = useRef([])
    const [usuarioId, setUsuarioId] = useState(null)
    const [segundosRestantes, setSegundosRestantes] = useState(0)
    const [reenviando, setReenviando] = useState(false)
    const [otpError, setOtpError] = useState('')

    const [modalGuia, setModalGuia] = useState(false)
    const [guia, setGuia] = useState([])
    const [cargandoGuia, setCargandoGuia] = useState(false)

    const estaOffline = !isOnline

    useLayoutEffect(() => {
        const saved = localStorage.getItem('tema')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const isDark = saved === 'dark' || (!saved && prefersDark)
        setDark(isDark)
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }, [])

    useEffect(() => {
        const savedUser = localStorage.getItem('rememberedUser')
        if (savedUser) { setEmail(savedUser); setRememberMe(true) }

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setDark(nuevoTema === 'dark')
            document.documentElement.setAttribute('data-theme', nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)
        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        const cargarDatos = async () => {
            if (isOnline) {
                try {
                    const [plat, copy] = await Promise.all([
                        obtenerPlataforma(),
                        obtenerCopyright()
                    ])
                    if (plat?.success) {
                        if (plat.nombre_plataforma) setNombrePlataforma(plat.nombre_plataforma)
                        if (plat.logo_url) setLogoUrl(plat.logo_url)
                    }
                    if (copy?.success && copy.copyright) setCopyright(copy.copyright)
                } catch { }
            }
            setCargandoPlataforma(false)
        }
        cargarDatos()
    }, [isOnline])

    useEffect(() => {
        if (cargandoPlataforma) return
        if (!nombrePlataforma) setNombrePlataforma('IsiWeek')
        if (!copyright) setCopyright('© 2026 isiweek. Todos los derechos reservados.')
    }, [cargandoPlataforma])

    useEffect(() => {
        if (nombrePlataforma) {
            document.title = nombrePlataforma
        }
    }, [nombrePlataforma])

    useEffect(() => {
        if (segundosRestantes <= 0) return
        const t = setInterval(() => {
            setSegundosRestantes(prev => Math.max(0, prev - 1))
        }, 1000)
        return () => clearInterval(t)
    }, [segundosRestantes])

    const abrirGuia = async () => {
        setModalGuia(true)
        if (guia.length > 0) return
        setCargandoGuia(true)
        try {
            const r = await obtenerGuia()
            if (r.success) setGuia(r.items)
        } catch { }
        finally { setCargandoGuia(false) }
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)

        try {
            const resultado = await login(email, password, isOnline)

            if (resultado.success) {
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', email)
                } else {
                    localStorage.removeItem('rememberedUser')
                }

                if (resultado.otp_required) {
                    setUsuarioId(resultado.usuarioId)
                    setOtpValue('')
                    setOtpDigits(['', '', '', '', '', ''])
                    setOtpError('')
                    setStep(2)
                    setSegundosRestantes(300)
                    setTimeout(() => otpRefs.current[0]?.focus(), 100)
                    setCargando(false)
                    return
                }

                const tipo = resultado.tipo
                const systemMode = resultado.systemMode || resultado.usuario?.system_mode

                if (tipo === 'superadmin') {
                    router.push('/superadmin')
                } else if (tipo === 'financiamiento') {
                    router.push('/financiamiento/dashboard')
                } else if (tipo === 'sucursales') {
                    router.push('/sucursales')
                } else if (tipo === 'admin' || tipo === 'vendedor') {
                    if (systemMode === 'OBRAS') {
                        router.push('/admin/manejo-simple')
                    } else {
                        router.push(tipo === 'vendedor' ? '/vendedor' : '/admin')
                    }
                }
            } else {
                setError(resultado.mensaje || resultado.message || 'Error al iniciar sesión')
            }
        } catch (error) {
            console.error('Error en manejador de submit:', error)
            setError(t('login.unexpectedError'))
        } finally {
            setCargando(false)
        }
    }

    function toggleDark() {
        const next = !dark
        setDark(next)
        localStorage.setItem('tema', next ? 'dark' : 'light')
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
        window.dispatchEvent(new Event('temaChange'))
    }

    const waUrl = `https://wa.me/18494324597?text=${encodeURIComponent(t('login.supportWa'))}`

    const manejarOtpDigit = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(0, 1)
        const nuevos = [...otpDigits]
        nuevos[index] = digit
        setOtpDigits(nuevos)
        setOtpValue(nuevos.join(''))
        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const manejarOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
        if (e.key === 'ArrowRight' && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const manejarOtpPaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (!pasted) return
        e.preventDefault()
        const nuevos = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
        setOtpDigits(nuevos)
        setOtpValue(nuevos.join(''))
        const lastIndex = Math.min(pasted.length, 6) - 1
        otpRefs.current[lastIndex]?.focus()
    }

    const manejarOtpSubmit = async (e) => {
        e.preventDefault()
        setOtpError('')
        if (otpValue.length !== 6) {
            setOtpError('El código debe tener 6 dígitos')
            return
        }
        setCargando(true)
        try {
            const resultado = await completarSesionSuperAdmin(usuarioId, otpValue)
            if (resultado.success) {
                if (resultado.usuario) {
                    localStorage.setItem('offlineSession', JSON.stringify({
                        userId: resultado.usuario.id,
                        tipo: resultado.tipo,
                        nombre: resultado.usuario.nombre,
                        email: resultado.usuario.email,
                        empresaId: resultado.usuario.empresa_id,
                        nombreEmpresa: resultado.usuario.nombre_empresa,
                        timestamp: Date.now()
                    }))
                }
                const tipo = resultado.tipo
                const systemMode = resultado.usuario?.system_mode
                if (tipo === 'superadmin') {
                    router.push('/superadmin')
                } else if (tipo === 'financiamiento') {
                    router.push('/financiamiento/dashboard')
                } else if (tipo === 'sucursales') {
                    router.push('/sucursales')
                } else if (tipo === 'admin' || tipo === 'vendedor') {
                    if (systemMode === 'OBRAS') {
                        router.push('/admin/manejo-simple')
                    } else {
                        router.push(tipo === 'vendedor' ? '/vendedor' : '/admin')
                    }
                }
            } else {
                setOtpError(resultado.mensaje || 'Código inválido')
                setOtpValue('')
            }
        } catch {
            setOtpError('Error al verificar el código')
        } finally {
            setCargando(false)
        }
    }

    const reiniciarLogin = () => {
        setStep(1)
        setOtpValue('')
        setOtpDigits(['', '', '', '', '', ''])
        setUsuarioId(null)
        setOtpError('')
        setSegundosRestantes(0)
    }

    const reenviarOtp = async () => {
        if (segundosRestantes > 0 || reenviando) return
        setReenviando(true)
        setOtpError('')
        try {
            const { iniciarSesion } = await import('./servidor')
            const resultado = await iniciarSesion(email, password)
            if (resultado.success && resultado.otp_required) {
                setSegundosRestantes(300)
            } else {
                setOtpError('Error al reenviar el código')
            }
        } catch {
            setOtpError('Error al reenviar el código')
        } finally {
            setReenviando(false)
        }
    }

    const renderItem = (item) => {
        switch (item.tipo) {
            case 'video': {
                const match = item.contenido?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?\s]+)/)
                const videoId = match?.[1]
                return videoId ? (
                    <div key={item.id} className={estilos.guiaItem}>
                        {item.titulo && <h3 className={estilos.guiaItemTitulo}>{item.titulo}</h3>}
                        {item.descripcion && <p className={estilos.guiaItemDesc}>{item.descripcion}</p>}
                        <div className={estilos.videoWrapper}>
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                allowFullScreen
                                className={estilos.videoFrame}
                                title={item.titulo}
                            />
                        </div>
                    </div>
                ) : null
            }

            case 'video_local':
                return (
                    <div key={item.id} className={estilos.guiaItem}>
                        {item.titulo && <h3 className={estilos.guiaItemTitulo}>{item.titulo}</h3>}
                        {item.descripcion && <p className={estilos.guiaItemDesc}>{item.descripcion}</p>}
                        <div className={estilos.videoWrapper}>
                            <video
                                controls
                                preload="metadata"
                                className={estilos.videoFrame}
                                style={{ background: '#000' }}
                            >
                                <source src={item.contenido} type="video/mp4" />
                                Tu navegador no soporta reproducción de video.
                            </video>
                        </div>
                    </div>
                )

            case 'texto':
                return (
                    <div key={item.id} className={estilos.guiaItem}>
                        {item.titulo && <h3 className={estilos.guiaItemTitulo}>{item.titulo}</h3>}
                        <p className={estilos.guiaItemTexto}>{item.contenido}</p>
                    </div>
                )

            case 'imagen':
                return (
                    <div key={item.id} className={estilos.guiaItem}>
                        {item.titulo && <h3 className={estilos.guiaItemTitulo}>{item.titulo}</h3>}
                        {item.descripcion && <p className={estilos.guiaItemDesc}>{item.descripcion}</p>}
                        <img src={item.contenido} alt={item.titulo} className={estilos.guiaImagen} />
                    </div>
                )

            case 'pdf':
                return (
                    <div key={item.id} className={estilos.guiaItem}>
                        {item.titulo && <h3 className={estilos.guiaItemTitulo}>{item.titulo}</h3>}
                        {item.descripcion && <p className={estilos.guiaItemDesc}>{item.descripcion}</p>}
                        <a
                            href={item.contenido}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={estilos.pdfLink}
                        >
                            <ion-icon name="document-outline" />
                            <span>{t('login.pdfOpen')}</span>
                        </a>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className={estilos.page}>
            <div className={estilos.pageBg} />
            <div className={estilos.shapes}>
                <div className={`${estilos.shape} ${estilos.shapeA}`} />
                <div className={`${estilos.shape} ${estilos.shapeB}`} />
                <div className={`${estilos.shape} ${estilos.shapeC}`} />
            </div>

            <div className={estilos.topControls}>
                <button
                    className={estilos.languageBtn}
                    onClick={toggleLanguage}
                    aria-label={language === 'es' ? t('common.switchToEnglish') : t('common.switchToSpanish')}
                    title={language === 'es' ? t('common.switchToEnglish') : t('common.switchToSpanish')}
                    type="button"
                >
                    <span>{language.toUpperCase()}</span>
                </button>

                <button className={estilos.themeBtn} onClick={toggleDark} aria-label="Cambiar tema" type="button">
                    <ion-icon name={dark ? 'sunny-outline' : 'moon-outline'} />
                </button>
            </div>

            {estaOffline && (
                <div className={estilos.offlineBanner}>
                    {t('login.offlineBanner')}
                </div>
            )}

            <div className={estilos.container}>
                <div className={estilos.card} style={estaOffline ? { marginTop: '50px' } : {}}>
                    <button
                        className={estilos.guiaBtn}
                        onClick={abrirGuia}
                        aria-label={t('login.guiaTitle')}
                        title={t('login.guiaTitle')}
                    >
                        <ion-icon name="book-outline" />
                    </button>

                    <div className={estilos.header}>
                        <div className={estilos.brand}>
                            {cargandoPlataforma ? (
                                <span className={estilos.brandPlaceholder}>&nbsp;</span>
                            ) : (
                                <>
                                    {logoUrl && <img src={logoUrl} alt={nombrePlataforma} className={estilos.brandLogo} />}
                                    <span>{nombrePlataforma}</span>
                                </>
                            )}
                        </div>
                        <div className={estilos.subtitle}>{t('login.subtitle')}</div>
                        <div className={estilos.dividerAccent} />
                    </div>

                    {step === 1 ? (
                        <form onSubmit={manejarSubmit} className={estilos.form} noValidate>
                            {error && (
                                <div className={estilos.alert}>
                                    <ion-icon name="alert-circle-outline" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className={estilos.field}>
                                <label htmlFor="email" className={estilos.label}>{t('login.email')}</label>
                                <div className={estilos.inputWrap}>
                                    <span className={estilos.inputIcon}><ion-icon name="mail-outline" /></span>
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

                            <div className={estilos.field}>
                                <label htmlFor="password" className={estilos.label}>{t('login.password')}</label>
                                <div className={estilos.inputWrap}>
                                    <span className={estilos.inputIcon}><ion-icon name="lock-closed-outline" /></span>
                                    <input
                                        type={mostrarPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Tu contrasena"
                                        className={estilos.input}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarPassword(!mostrarPassword)}
                                        className={estilos.eyeBtn}
                                        aria-label={mostrarPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                                    >
                                        <ion-icon name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'} />
                                    </button>
                                </div>
                            </div>

                            <div className={estilos.rememberRow}>
                                <label className={estilos.checkLabel}>
                                    <input
                                        type="checkbox"
                                        className={estilos.checkbox}
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    {t('login.rememberUser')}
                                </label>
                                <Link href="/recuperar" className={estilos.forgotLink}>
                                    {t('login.forgotPassword')}
                                </Link>
                            </div>

                            <button type="submit" className={estilos.submitBtn} disabled={cargando}>
                                {cargando ? (
                                    <span className={estilos.spinner} />
                                ) : (
                                    <>
                                        <ion-icon name="log-in-outline" />
                                        <span>{t('login.submit')}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={manejarOtpSubmit} className={estilos.form} noValidate>
                            <div className={estilos.otpHeader}>
                                <div className={estilos.otpHeaderIcon}>
                                    <ion-icon name="shield-checkmark-outline" />
                                </div>
                                <span className={estilos.otpHeaderTitle}>Verificación en dos pasos</span>
                            </div>
                            <p className={estilos.otpDesc}>
                                Hemos enviado un código de 6 dígitos a <strong>{/* email would go here */}tu correo electrónico</strong>
                            </p>

                            {otpError && (
                                <div className={estilos.alert}>
                                    <ion-icon name="alert-circle-outline" />
                                    <span>{otpError}</span>
                                </div>
                            )}

                            <div className={estilos.otpBoxes} onPaste={manejarOtpPaste}>
                                {otpDigits.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { otpRefs.current[i] = el }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => manejarOtpDigit(i, e.target.value)}
                                        onKeyDown={(e) => manejarOtpKeyDown(i, e)}
                                        className={`${estilos.otpBox} ${digit ? estilos.otpBoxFilled : ''} ${otpError ? estilos.otpBoxError : ''}`}
                                        disabled={cargando}
                                        autoFocus={i === 0}
                                    />
                                ))}
                            </div>

                            <button type="submit" className={estilos.submitBtn} disabled={cargando || otpValue.length !== 6}>
                                {cargando ? (
                                    <span className={estilos.spinner} />
                                ) : (
                                    <>
                                        <ion-icon name="checkmark-circle-outline" />
                                        <span>Verificar código</span>
                                    </>
                                )}
                            </button>

                            <div className={estilos.otpFooter}>
                                <div className={estilos.otpFooterLeft}>
                                    {segundosRestantes > 0 ? (
                                        <span className={estilos.otpTimer}>
                                            <ion-icon name="time-outline" />
                                            {Math.floor(segundosRestantes / 60)}:{String(segundosRestantes % 60).padStart(2, '0')}
                                        </span>
                                    ) : (
                                        <button type="button" className={estilos.otpResend} onClick={reenviarOtp} disabled={reenviando}>
                                            <ion-icon name="refresh-outline" />
                                            {reenviando ? 'Enviando...' : 'Reenviar código'}
                                        </button>
                                    )}
                                </div>
                                <button type="button" className={estilos.otpBack} onClick={reiniciarLogin}>
                                    <ion-icon name="arrow-back-outline" />
                                    Volver
                                </button>
                            </div>
                        </form>
                    )}

                    <div className={estilos.footerCard}>
                        <p className={estilos.textoRegistro}>
                            {t('login.noAccount')}{' '}
                            <Link href="/registro" className={estilos.signupLink}>{t('login.signupHere')}</Link>
                        </p>
                        <p className={estilos.copyright}>{copyright}</p>
                    </div>
                </div>
            </div>

            <Link href={waUrl} target="_blank" rel="noopener noreferrer" className={estilos.whatsappBtn}>
                <ion-icon name="logo-whatsapp" />
            </Link>

            {modalGuia && (
                <>
                    <div className={estilos.modalOverlay} onClick={() => setModalGuia(false)} />
                    <div className={estilos.modal}>
                        <div className={estilos.modalHeader}>
                            <div className={estilos.modalTituloWrap}>
                                <ion-icon name="book-outline" />
                                <h2 className={estilos.modalTitulo}>{t('login.guiaTitle')}</h2>
                            </div>
                            <button
                                className={estilos.modalCerrar}
                                onClick={() => setModalGuia(false)}
                                aria-label="Cerrar"
                            >
                                <ion-icon name="close-outline" />
                            </button>
                        </div>

                        <div className={estilos.modalCuerpo}>
                            {cargandoGuia ? (
                                <div className={estilos.guiaCargando}>
                                    <span className={estilos.spinner} style={{ borderColor: 'rgba(29,111,206,0.2)', borderTopColor: '#1d6fce' }} />
                                    <span>{t('login.guiaLoading')}</span>
                                </div>
                            ) : guia.length === 0 ? (
                                <div className={estilos.guiaVacio}>
                                    <ion-icon name="book-outline" />
                                    <p>{t('login.guiaEmpty')}</p>
                                </div>
                            ) : (
                                guia.map(item => renderItem(item))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}