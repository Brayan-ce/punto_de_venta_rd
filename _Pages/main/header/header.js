"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerDatosPlataforma } from './servidor'
import estilos from './header.module.css'

export default function Header() {
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [tema, setTema] = useState('light')
    const [datosPlataforma, setDatosPlataforma] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const temaGuardado = localStorage.getItem('tema') || 'light'
        setTema(temaGuardado)

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
        window.dispatchEvent(new Event('temaChange'))
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

                        <Link href="/ayuda" className={estilos.botonAyuda} aria-label="Ayuda">
                            <ion-icon name="help-circle-outline"></ion-icon>
                        </Link>

                        <Link href="/login" className={estilos.botonLogin}>
                            Iniciar Sesion
                        </Link>

                        <Link href="/registro" className={estilos.botonRegistro}>
                            Registrarme
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
                            aria-label="Cerrar menu"
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
                                    <span>Iniciar Sesion</span>
                                </Link>
                                <Link href="/registro" className={estilos.menuItem} onClick={cerrarMenu}>
                                    <ion-icon name="person-add-outline"></ion-icon>
                                    <span>Registrarme</span>
                                </Link>
                                <Link href="/ayuda" className={estilos.menuItem} onClick={cerrarMenu}>
                                    <ion-icon name="help-circle-outline"></ion-icon>
                                    <span>Ayuda</span>
                                </Link>
                            </nav>

                            <div className={estilos.menuFooter}>
                                <button className={estilos.menuItemTema} onClick={toggleTema}>
                                    <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                                    <span>{tema === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}