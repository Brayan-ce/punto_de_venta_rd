"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { obtenerDatosUsuario, cerrarSesion } from '@/_Pages/vendedor/header/servidor'
import estilos from '@/_Pages/vendedor/header/header.module.css'

export default function HeaderFinanciamiento() {
    const router = useRouter()
    const pathname = usePathname()
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
    const [tema, setTema] = useState('light')
    const [datosUsuario, setDatosUsuario] = useState(null)
    const [datosEmpresa, setDatosEmpresa] = useState(null)
    const [logoPlataforma, setLogoPlataforma] = useState(null)
    const [cargando, setCargando] = useState(true)

    const navegacionPrincipal = [
        { href: '/financiamiento/dashboard', icon: 'speedometer-outline', label: 'Dashboard' },
        { href: '/financiamiento/contratos', icon: 'receipt-outline', label: 'Préstamos' },
        { href: '/financiamiento/alertas', icon: 'alert-circle-outline', label: 'Alertas' },
        { href: '/financiamiento/planes', icon: 'documents-outline', label: 'Planes' },
        { href: '/financiamiento/clientes', icon: 'people-outline', label: 'Clientes' },
    ]

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        const manejarCambioTema = () => setTema(localStorage.getItem('tema') || 'light')
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
                const resultado = await obtenerDatosUsuario()
                if (resultado.success) {
                    localStorage.setItem('cachedFinanciamientoSession', JSON.stringify({
                        usuario: resultado.usuario,
                        empresa: resultado.empresa,
                        logoPlataforma: resultado.logoPlataforma,
                        timestamp: Date.now()
                    }))
                    setDatosUsuario(resultado.usuario)
                    setDatosEmpresa(resultado.empresa)
                    setLogoPlataforma(resultado.logoPlataforma)
                } else {
                    usarCacheLocal()
                }
            } catch {
                usarCacheLocal()
            } finally {
                setCargando(false)
            }
        }
        const usarCacheLocal = () => {
            const cached = localStorage.getItem('cachedFinanciamientoSession')
            if (cached) {
                const parsed = JSON.parse(cached)
                if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                    setDatosUsuario(parsed.usuario)
                    setDatosEmpresa(parsed.empresa)
                    setLogoPlataforma(parsed.logoPlataforma)
                    return
                }
                localStorage.removeItem('cachedFinanciamientoSession')
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
                    <button className={estilos.botonMenu} onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Abrir menu">
                        <ion-icon name="menu-outline"></ion-icon>
                    </button>

                    <Link href="/financiamiento/dashboard" className={estilos.logo}>
                        {logoPlataforma ? (
                            <img src={logoPlataforma} alt="Logo" className={estilos.logoImagen} />
                        ) : (
                            <span className={estilos.logoTexto}>Financiamiento</span>
                        )}
                    </Link>

                    <nav className={estilos.navDesktop}>
                        {navegacionPrincipal.map((item) => {
                            const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')
                            return (
                                <Link key={item.href} href={item.href} className={`${estilos.navItem} ${esActivo ? estilos.activo : ''}`}>
                                    <ion-icon name={item.icon}></ion-icon>
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className={estilos.acciones}>
                        <button className={estilos.botonTema} onClick={toggleTema} aria-label="Cambiar tema">
                            <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                        </button>

                        <div className={estilos.usuario} onClick={(e) => { e.stopPropagation(); setMenuUsuarioAbierto(!menuUsuarioAbierto) }}>
                            <div className={estilos.avatarDefault}><ion-icon name="person-outline"></ion-icon></div>
                            <div className={estilos.usuarioInfo}>
                                <span className={estilos.nombreUsuario}>{datosUsuario?.nombre}</span>
                                <span className={estilos.tipoUsuario}>financiamiento</span>
                            </div>
                            <ion-icon name="chevron-down-outline" className={estilos.chevronIcon}></ion-icon>

                            {menuUsuarioAbierto && (
                                <div className={`${estilos.menuDesplegable} ${estilos[tema]}`}>
                                    <div className={estilos.separadorMenu}></div>
                                    <button className={`${estilos.menuDesplegableItem} ${estilos.itemSalir}`} onClick={manejarCerrarSesion}>
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
                    <div className={estilos.overlay} onClick={() => setMenuAbierto(false)}></div>
                    <div className={`${estilos.menuLateral} ${estilos[tema]}`}>
                        <button className={estilos.botonCerrar} onClick={() => setMenuAbierto(false)}>
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                        <div className={estilos.menuContenido}>
                            <div className={estilos.menuHeader}>
                                <div className={estilos.menuUsuario}>
                                    <div className={estilos.menuAvatarDefault}><ion-icon name="person-outline"></ion-icon></div>
                                    <div className={estilos.menuUsuarioInfo}>
                                        <span className={estilos.menuUsuarioNombre}>{datosUsuario?.nombre}</span>
                                        <span className={estilos.menuUsuarioTipo}>{datosEmpresa?.nombre_empresa}</span>
                                    </div>
                                </div>
                            </div>
                            <nav className={estilos.menuNav}>
                                <div className={estilos.menuSeccion}>
                                    <span className={estilos.menuSeccionTitulo}>Financiamiento</span>
                                    {navegacionPrincipal.map((item) => {
                                        const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')
                                        return (
                                            <Link key={item.href} href={item.href} className={`${estilos.menuItem} ${esActivo ? estilos.activo : ''}`} onClick={() => setMenuAbierto(false)}>
                                                <ion-icon name={item.icon}></ion-icon>
                                                <span>{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </div>
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
