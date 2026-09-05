"use client"
import { useEffect, useLayoutEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerDatosPlataforma } from './servidor'
import { useLanguage } from '../i18n'
import estilos from './header.module.css'

export default function Header() {
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [tema, setTema] = useState('light')
    const [datosPlataforma, setDatosPlataforma] = useState(null)
    const [cargando, setCargando] = useState(true)
    const { language, toggleLanguage, t } = useLanguage()

    useLayoutEffect(() => {
        const temaGuardado = document.documentElement.getAttribute('data-theme') || localStorage.getItem('tema') || 'light'
        setTema(temaGuardado)
        document.documentElement.setAttribute('data-theme', temaGuardado)
        const h = () => {
            const t = localStorage.getItem('tema') || 'light'
            setTema(t)
            document.documentElement.setAttribute('data-theme', t)
        }
        window.addEventListener('temaChange', h)
        window.addEventListener('storage', h)
        return () => {
            window.removeEventListener('temaChange', h)
            window.removeEventListener('storage', h)
        }
    }, [])

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const resultado = await obtenerDatosPlataforma()
                if (resultado.success) {
                    setDatosPlataforma(resultado.plataforma)
                }
            } catch (error) {
                console.error('Error al cargar datos del header:', error)
            } finally {
                setCargando(false)
            }
        }
        cargarDatos()
    }, [])

    const toggleMenu = () => {
        setMenuAbierto(!menuAbierto)
    }

    const cerrarMenu = () => {
        setMenuAbierto(false)
    }

    const toggleTema = () => {
        const nuevoTema = tema === 'light' ? 'dark' : 'light'
        setTema(nuevoTema)
        localStorage.setItem('tema', nuevoTema)
        document.documentElement.setAttribute('data-theme', nuevoTema)
        window.dispatchEvent(new Event('temaChange'))
    }

    if (cargando) {
        return (
            <header className={`${estilos.header} ${estilos[tema]} ${tema === 'dark' ? 'dark' : ''}`}>
                <div className={estilos.contenedor}>
                    <div className={estilos.cargando}>Cargando...</div>
                </div>
            </header>
        )
    }

    return (
        <>
            <header className={`${estilos.header} ${estilos[tema]} ${tema === 'dark' ? 'dark' : ''}`}>
                <div className={estilos.contenedor}>
                    <button 
                        className={estilos.botonMenu}
                        onClick={toggleMenu}
                        aria-label={t('header.openMenu')}
                    >
                        <ion-icon name="menu-outline"></ion-icon>
                    </button>

                    <Link href="/" className={estilos.logo}>
                        {datosPlataforma?.logo_url ? (
                            <img 
                                src={datosPlataforma.logo_url} 
                                alt="IziWeek"
                                className={estilos.logoImagen}
                            />
                        ) : (
                            <span className={estilos.logoTexto}>IziWeek</span>
                        )}
                    </Link>

                    <div className={estilos.acciones}>
                        <button 
                            className={estilos.botonTema}
                            onClick={toggleTema}
                            aria-label="Cambiar tema"
                        >
                            <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                        </button>

                        <button
                            className={`${estilos.botonTema} ${estilos.botonIdioma}`}
                            onClick={toggleLanguage}
                            aria-label={language === 'es' ? t('common.switchToEnglish') : t('common.switchToSpanish')}
                            title={language === 'es' ? t('common.switchToEnglish') : t('common.switchToSpanish')}
                        >
                            <span>{language.toUpperCase()}</span>
                        </button>

                        <Link href="/ayuda" className={estilos.botonAyuda} aria-label={t('header.help')}>
                            <ion-icon name="help-circle-outline"></ion-icon>
                        </Link>

                        <Link href="/login" className={estilos.botonLogin}>
                            {t('header.login')}
                        </Link>

                        <Link href="/registro" className={estilos.botonRegistro}>
                            {t('header.register')}
                        </Link>
                    </div>
                </div>
            </header>

            {menuAbierto && (
                <>
                    <div 
                        className={estilos.overlay}
                        onClick={cerrarMenu}
                    ></div>
                    
                    <div className={`${estilos.menuLateral} ${estilos[tema]}`}>
                        <button 
                            className={estilos.botonCerrar}
                            onClick={cerrarMenu}
                            aria-label={t('header.closeMenu')}
                        >
                            <ion-icon name="close-outline"></ion-icon>
                        </button>

                        <div className={estilos.menuContenido}>
                            <div className={estilos.menuHeader}>
                                {datosPlataforma?.logo_url ? (
                                    <img 
                                        src={datosPlataforma.logo_url} 
                                        alt="IziWeek"
                                        className={estilos.menuLogo}
                                    />
                                ) : (
                                    <span className={estilos.menuLogoTexto}>IziWeek</span>
                                )}
                            </div>

                            <nav className={estilos.menuNav}>
                                <Link href="/login" className={estilos.menuItem} onClick={cerrarMenu}>
                                    <ion-icon name="log-in-outline"></ion-icon>
                                    <span>{t('header.login')}</span>
                                </Link>
                                <Link href="/registro" className={estilos.menuItem} onClick={cerrarMenu}>
                                    <ion-icon name="person-add-outline"></ion-icon>
                                    <span>{t('header.register')}</span>
                                </Link>
                                <Link href="/ayuda" className={estilos.menuItem} onClick={cerrarMenu}>
                                    <ion-icon name="help-circle-outline"></ion-icon>
                                    <span>{t('header.help')}</span>
                                </Link>
                                <button className={estilos.menuItemTema} onClick={toggleLanguage}>
                                    <ion-icon name="language-outline"></ion-icon>
                                    <span>{language === 'es' ? 'English' : 'Espanol'}</span>
                                </button>
                            </nav>

                            <div className={estilos.menuFooter}>
                                <button className={estilos.menuItemTema} onClick={toggleTema}>
                                    <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                                    <span>{tema === 'light' ? t('header.darkMode') : t('header.lightMode')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}