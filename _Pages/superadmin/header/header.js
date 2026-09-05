"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { obtenerDatosSuperAdmin, cerrarSesion } from './servidor'
import { useLanguage } from '@/_Pages/superadmin/i18n'
import estilos from './header.module.css'

export default function HeaderSuperAdmin() {
    const router = useRouter()
    const pathname = usePathname()
    const { language, toggleLanguage, t } = useLanguage()
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
    const [tema, setTema] = useState('light')
    const [datosUsuario, setDatosUsuario] = useState(null)
    const [logoPlataforma, setLogoPlataforma] = useState(null)
    const [cargando, setCargando] = useState(true)

    const labelMapping = {
        'Dashboard': 'header.dashboard',
        'Solicitudes': 'header.solicitudes',
        'Empresas': 'header.empresas',
        'Usuarios': 'header.usuarios',
        'Anuncios': 'header.anuncios',
        'Guía': 'header.guia',
        'Configuracion': 'header.configuracion'
    }

    const translateLabel = (label) => {
        const key = labelMapping[label]
        return key ? t(key) : label
    }


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

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const resultado = await obtenerDatosSuperAdmin()
                if (resultado.success) {
                    localStorage.setItem('cachedSuperadminSession', JSON.stringify({
                        usuario: resultado.usuario,
                        logoPlataforma: resultado.logoPlataforma,
                        timestamp: Date.now()
                    }))
                    setDatosUsuario(resultado.usuario)
                    setLogoPlataforma(resultado.logoPlataforma)
                } else {
                    usarCacheLocal()
                }
            } catch (error) {
                console.error('Error al cargar datos del header:', error)
                usarCacheLocal()
            } finally {
                setCargando(false)
            }
        }
        const usarCacheLocal = () => {
            const cached = localStorage.getItem('cachedSuperadminSession')
            if (cached) {
                const parsed = JSON.parse(cached)
                if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                    setDatosUsuario(parsed.usuario)
                    setLogoPlataforma(parsed.logoPlataforma)
                    return
                }
                localStorage.removeItem('cachedSuperadminSession')
            }
            router.push('/login')
        }
        cargarDatos()
    }, [router])

    useEffect(() => {
        const manejarClickFuera = (e) => {
            if (menuUsuarioAbierto && !e.target.closest(`.${estilos.usuario}`)) {
                setMenuUsuarioAbierto(false)
            }
        }

        document.addEventListener('click', manejarClickFuera)
        return () => document.removeEventListener('click', manejarClickFuera)
    }, [menuUsuarioAbierto])

    const toggleMenu = () => {
        setMenuAbierto(!menuAbierto)
    }

    const cerrarMenu = () => {
        setMenuAbierto(false)
    }

    const toggleMenuUsuario = (e) => {
        e.stopPropagation()
        setMenuUsuarioAbierto(!menuUsuarioAbierto)
    }

    const toggleTema = () => {
        const nuevoTema = tema === 'light' ? 'dark' : 'light'
        setTema(nuevoTema)
        localStorage.setItem('tema', nuevoTema)
        window.dispatchEvent(new Event('temaChange'))
    }

    const manejarCerrarSesion = async () => {
        await cerrarSesion()
        router.push('/login')
    }

    if (cargando) {
        return (
            <header className={`${estilos.header} ${estilos[tema]}`}>
                <div className={estilos.contenedor}>
                    <div className={estilos.cargando}>Cargando...</div>
                </div>
            </header>
        )
    }

    return (
        <>
            <header className={`${estilos.header} ${estilos[tema]}`}>
                <div className={estilos.contenedor}>
                    <button
                        className={estilos.botonMenu}
                        onClick={toggleMenu}
                        aria-label="Abrir menu"
                    >
                        <ion-icon name="menu-outline"></ion-icon>
                    </button>

                    <Link href="/superadmin" className={estilos.logo}>
                        {logoPlataforma ? (
                            <img
                                src={logoPlataforma}
                                alt="IziWeek"
                                className={estilos.logoImagen}
                            />
                        ) : (
                            <span className={estilos.logoTexto}>IziWeek</span>
                        )}
                    </Link>

                    <nav className={estilos.navDesktop}>
                        <Link href="/superadmin" className={`${estilos.navItem} ${pathname === '/superadmin' ? estilos.activo : ''}`}>
                            <ion-icon name="speedometer-outline"></ion-icon>
                            <span>{translateLabel('Dashboard')}</span>
                        </Link>
                        <Link href="/superadmin/solicitudes" className={`${estilos.navItem} ${pathname === '/superadmin/solicitudes' ? estilos.activo : ''}`}>
                            <ion-icon name="document-text-outline"></ion-icon>
                            <span>{translateLabel('Solicitudes')}</span>
                        </Link>
                        <Link href="/superadmin/empresas" className={`${estilos.navItem} ${pathname === '/superadmin/empresas' ? estilos.activo : ''}`}>
                            <ion-icon name="business-outline"></ion-icon>
                            <span>{translateLabel('Empresas')}</span>
                        </Link>
                        <Link href="/superadmin/usuarios" className={`${estilos.navItem} ${pathname === '/superadmin/usuarios' ? estilos.activo : ''}`}>
                            <ion-icon name="people-outline"></ion-icon>
                            <span>{translateLabel('Usuarios')}</span>
                        </Link>
                        <Link href="/superadmin/anuncios" className={`${estilos.navItem} ${pathname === '/superadmin/anuncios' ? estilos.activo : ''}`}>
                            <ion-icon name="megaphone-outline"></ion-icon>
                            <span>{translateLabel('Anuncios')}</span>
                        </Link>
                        <Link href="/superadmin/guia" className={`${estilos.navItem} ${pathname === '/superadmin/guia' || pathname.startsWith('/superadmin/guia/') ? estilos.activo : ''}`}>
                            <ion-icon name="book-outline"></ion-icon>
                            <span>{translateLabel('Guía')}</span>
                        </Link>
                        <Link href="/superadmin/configuracion" className={`${estilos.navItem} ${pathname === '/superadmin/configuracion' ? estilos.activo : ''}`}>
                            <ion-icon name="settings-outline"></ion-icon>
                            <span>{translateLabel('Configuracion')}</span>
                        </Link>
                    </nav>

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
                            aria-label={language === 'es' ? 'Cambiar a inglés' : 'Cambiar a español'}
                            title={language === 'es' ? 'Cambiar a inglés' : 'Cambiar a español'}
                        >
                            <span>{language.toUpperCase()}</span>
                        </button>

                        <div className={estilos.usuario} onClick={toggleMenuUsuario}>
                            {datosUsuario?.avatar_url ? (
                                <img
                                    src={datosUsuario.avatar_url}
                                    alt={datosUsuario.nombre}
                                    className={estilos.avatar}
                                />
                            ) : (
                                <div className={estilos.avatarDefault}>
                                    <ion-icon name="person-outline"></ion-icon>
                                </div>
                            )}
                            <div className={estilos.usuarioInfo}>
                                <span className={estilos.nombreUsuario}>{datosUsuario?.nombre}</span>
                                <span className={estilos.tipoUsuario}>Super Admin</span>
                            </div>
                            <ion-icon name="chevron-down-outline" className={estilos.chevronIcon}></ion-icon>

                            {menuUsuarioAbierto && (
                                <div className={`${estilos.menuDesplegable} ${estilos[tema]}`}>
                                    <button
                                        className={estilos.menuDesplegableItem}
                                        onClick={manejarCerrarSesion}
                                    >
                                        <ion-icon name="log-out-outline"></ion-icon>
                                        <span>Cerrar Sesion</span>
                                    </button>
                                </div>
                            )}
                        </div>
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
                            aria-label="Cerrar menu"
                        >
                            <ion-icon name="close-outline"></ion-icon>
                        </button>

                        <div className={estilos.menuContenido}>
                            <div className={estilos.menuHeader}>
                                <div className={estilos.menuUsuario}>
                                    {datosUsuario?.avatar_url ? (
                                        <img
                                            src={datosUsuario.avatar_url}
                                            alt={datosUsuario.nombre}
                                            className={estilos.menuAvatar}
                                        />
                                    ) : (
                                        <div className={estilos.menuAvatarDefault}>
                                            <ion-icon name="person-outline"></ion-icon>
                                        </div>
                                    )}
                                    <div className={estilos.menuUsuarioInfo}>
                                        <span className={estilos.menuUsuarioNombre}>{datosUsuario?.nombre}</span>
                                        <span className={estilos.menuUsuarioTipo}>Super Administrador</span>
                                    </div>
                                </div>
                            </div>

                            <nav className={estilos.menuNav}>
                                <Link href="/superadmin" className={`${estilos.menuItem} ${pathname === '/superadmin' ? estilos.activo : ''}`} onClick={cerrarMenu}>
                                    <ion-icon name="speedometer-outline"></ion-icon>
                                    <span>Dashboard</span>
                                </Link>
                                <Link href="/superadmin/solicitudes" className={`${estilos.menuItem} ${pathname === '/superadmin/solicitudes' ? estilos.activo : ''}`} onClick={cerrarMenu}>
                                    <ion-icon name="document-text-outline"></ion-icon>
                                    <span>Solicitudes</span>
                                </Link>
                                <Link href="/superadmin/empresas" className={`${estilos.menuItem} ${pathname === '/superadmin/empresas' ? estilos.activo : ''}`} onClick={cerrarMenu}>
                                    <ion-icon name="business-outline"></ion-icon>
                                    <span>Empresas</span>
                                </Link>
                                <Link href="/superadmin/usuarios" className={`${estilos.menuItem} ${pathname === '/superadmin/usuarios' ? estilos.activo : ''}`} onClick={cerrarMenu}>
                                    <ion-icon name="people-outline"></ion-icon>
                                    <span>Usuarios</span>
                                </Link>
                                <Link href="/superadmin/anuncios" className={`${estilos.menuItem} ${pathname === '/superadmin/anuncios' ? estilos.activo : ''}`} onClick={cerrarMenu}>
                                    <ion-icon name="megaphone-outline"></ion-icon>
                                    <span>Anuncios</span>
                                </Link>
                                <Link href="/superadmin/guia" className={`${estilos.menuItem} ${pathname === '/superadmin/guia' || pathname.startsWith('/superadmin/guia/') ? estilos.activo : ''}`} onClick={cerrarMenu}>
                                    <ion-icon name="book-outline"></ion-icon>
                                    <span>Guía</span>
                                </Link>
                                <Link href="/superadmin/configuracion" className={`${estilos.menuItem} ${pathname === '/superadmin/configuracion' ? estilos.activo : ''}`} onClick={cerrarMenu}>
                                    <ion-icon name="settings-outline"></ion-icon>
                                    <span>Configuracion</span>
                                </Link>
                            </nav>

                            <div className={estilos.menuFooter}>
                                <button className={estilos.menuItemTema} onClick={toggleTema}>
                                    <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                                    <span>{tema === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                                </button>
                                <button className={estilos.menuItemSalir} onClick={manejarCerrarSesion}>
                                    <ion-icon name="log-out-outline"></ion-icon>
                                    <span>Cerrar Sesion</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}