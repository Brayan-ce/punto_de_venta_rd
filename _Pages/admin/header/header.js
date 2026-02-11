"use client"
import {useEffect, useState, useMemo} from 'react'
import {useRouter, usePathname} from 'next/navigation'
import Link from 'next/link'
import {obtenerDatosAdmin, cerrarSesion} from './servidor'
import {useModulos} from '@/hooks/useModulos'
import {
    obtenerItemsTop,
    obtenerCategoriasNavegacion,
    obtenerAccionesDiarias
} from '@/lib/navigation/catalogo'
import estilos from './header.module.css'
import PrinterButton from '../ventas/imprimir/PrinterButton'

export default function HeaderAdmin() {
    const router = useRouter()
    const pathname = usePathname()
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
    const [tema, setTema] = useState('light')
    const [datosUsuario, setDatosUsuario] = useState(null)
    const [datosEmpresa, setDatosEmpresa] = useState(null)
    const [logoPlataforma, setLogoPlataforma] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [seccionesAbiertas, setSeccionesAbiertas] = useState({})
    const [sidebarColapsado, setSidebarColapsado] = useState(false)
    const [hoverSubmenu, setHoverSubmenu] = useState(null) // Para popovers en modo colapsado

    // Hook para módulos habilitados
    const {tieneModulo} = useModulos()

    // Cargar estado de secciones y sidebar desde localStorage (solo una vez al montar)
    useEffect(() => {
        const estadoGuardado = localStorage.getItem('sidebarSeccionesAbiertas')
        if (estadoGuardado) {
            try {
                setSeccionesAbiertas(JSON.parse(estadoGuardado))
            } catch (e) {
                console.error('Error al cargar estado del sidebar:', e)
            }
        }
        
        // Cargar estado colapsado del sidebar
        const sidebarColapsadoGuardado = localStorage.getItem('sidebarColapsado')
        if (sidebarColapsadoGuardado !== null) {
            setSidebarColapsado(sidebarColapsadoGuardado === 'true')
        }
    }, [])

    // Guardar estado de secciones en localStorage
    useEffect(() => {
        if (Object.keys(seccionesAbiertas).length > 0) {
            localStorage.setItem('sidebarSeccionesAbiertas', JSON.stringify(seccionesAbiertas))
        }
    }, [seccionesAbiertas])

    // Guardar estado colapsado del sidebar
    useEffect(() => {
        localStorage.setItem('sidebarColapsado', sidebarColapsado.toString())
    }, [sidebarColapsado])

    // Actualizar clase del body y variable CSS cuando el sidebar cambia
    useEffect(() => {
        if (sidebarColapsado) {
            document.body.classList.add('sidebar-colapsado')
            document.documentElement.style.setProperty('--sidebar-width', '72px')
        } else {
            document.body.classList.remove('sidebar-colapsado')
            document.documentElement.style.setProperty('--sidebar-width', '260px')
        }
        
        return () => {
            document.body.classList.remove('sidebar-colapsado')
            document.documentElement.style.setProperty('--sidebar-width', '260px')
        }
    }, [sidebarColapsado])

    // Toggle sidebar colapsado
    const toggleSidebar = () => {
        setSidebarColapsado(!sidebarColapsado)
    }

    // Obtener items TOP para header (máximo 5)
    const navegacionPrincipal = useMemo(() => {
        return obtenerItemsTop(tieneModulo, 5)
    }, [tieneModulo])

    // Obtener categorías de navegación para sidebar
    const categoriasNavegacion = useMemo(() => {
        return obtenerCategoriasNavegacion(tieneModulo)
    }, [tieneModulo])

    // Obtener acciones diarias para sidebar
    const accionesDiarias = useMemo(() => {
        return obtenerAccionesDiarias(tieneModulo)
    }, [tieneModulo])

    // Toggle sección colapsable
    const toggleSeccion = (modulo) => {
        setSeccionesAbiertas(prev => ({
            ...prev,
            [modulo]: !prev[modulo]
        }))
    }

    // Verificar si una ruta está activa
    const esRutaActiva = (href) => {
        return pathname === href || pathname.startsWith(href + '/')
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
                const resultado = await obtenerDatosAdmin()
                if (resultado.success) {
                    setDatosUsuario(resultado.usuario)
                    setDatosEmpresa(resultado.empresa)
                    setLogoPlataforma(resultado.logoPlataforma)
                } else {
                    router.push('/login')
                }
            } catch (error) {
                console.error('Error al cargar datos del header:', error)
                router.push('/login')
            } finally {
                setCargando(false)
            }
        }
        cargarDatos()
    }, [router])

    useEffect(() => {
        const manejarClickFuera = (e) => {
            if (menuUsuarioAbierto && !e.target.closest(`.${estilos.usuario}`)) {
                setMenuUsuarioAbierto(false)
            }
            
            // Cerrar popover si se hace click fuera de él
            if (sidebarColapsado && hoverSubmenu && !e.target.closest(`.${estilos.sidebarPopover}`) && !e.target.closest(`.${estilos.sidebarItemCompacto}`)) {
                setHoverSubmenu(null)
            }
        }

        document.addEventListener('click', manejarClickFuera)
        return () => document.removeEventListener('click', manejarClickFuera)
    }, [menuUsuarioAbierto, sidebarColapsado, hoverSubmenu])

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

    const obtenerTipoUsuario = () => {
        if (!datosUsuario) return ''
        if (datosUsuario.tipo === 'admin') return 'Administrador'
        if (datosUsuario.tipo === 'vendedor') return 'Vendedor'
        return datosUsuario.tipo
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

                    <Link href="/admin" className={estilos.logo}>
                        {logoPlataforma ? (
                            <img
                                src={logoPlataforma}
                                alt="Logo"
                                className={estilos.logoImagen}
                            />
                        ) : (
                            <span className={estilos.logoTexto}>Sistema POS</span>
                        )}
                    </Link>

                    <nav className={estilos.navDesktop}>
                        {navegacionPrincipal.map((item) => {
                            const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${estilos.navItem} ${esActivo ? estilos.activo : ''}`}
                                >
                                    <ion-icon name={item.icon}></ion-icon>
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className={estilos.acciones}>
                        {/* Botón Bluetooth Printer */}
                        <PrinterButton
                            className={estilos.botonTema}
                            compact={true}/>

                        <button
                            className={estilos.botonTema}
                            onClick={toggleTema}
                            aria-label="Cambiar tema"
                        >
                            <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
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
                                <span className={estilos.tipoUsuario}>{obtenerTipoUsuario()}</span>
                            </div>
                            <ion-icon name="chevron-down-outline" className={estilos.chevronIcon}></ion-icon>

                            {menuUsuarioAbierto && (
                                <div className={`${estilos.menuDesplegable} ${estilos[tema]}`}>
                                    <Link
                                        href="/admin/perfil"
                                        className={estilos.menuDesplegableItem}
                                        onClick={() => setMenuUsuarioAbierto(false)}
                                    >
                                        <ion-icon name="person-circle-outline"></ion-icon>
                                        <span>Mi Perfil</span>
                                    </Link>

                                    <div className={estilos.separadorMenu}></div>

                                    {/* Mostrar solo items principales del menú usuario */}
                                    {navegacionPrincipal.slice(0, 6).map((item) => {
                                        const esActivo = esRutaActiva(item.href)

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`${estilos.menuDesplegableItem} ${esActivo ? estilos.activo : ''}`}
                                                onClick={() => setMenuUsuarioAbierto(false)}
                                            >
                                                <ion-icon name={item.icon}></ion-icon>
                                                <span>{item.label}</span>
                                            </Link>
                                        )
                                    })}

                                    <div className={estilos.separadorMenu}></div>

                                    <button
                                        className={`${estilos.menuDesplegableItem} ${estilos.itemSalir}`}
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

            {/* Sidebar Desktop - Solo visible en pantallas grandes - SIEMPRE RENDERIZADO */}
            <aside className={`${estilos.sidebarDesktop} ${estilos[tema]} ${sidebarColapsado ? estilos.sidebarColapsado : ''} ${cargando ? estilos.sidebarCargando : ''}`}>
                    {/* Header del Sidebar */}
                    <div className={estilos.sidebarHeader}>
                        <Link href="/admin/dashboard" className={estilos.sidebarLogo}>
                            {logoPlataforma ? (
                                <img 
                                    src={logoPlataforma} 
                                    alt="Logo" 
                                    className={estilos.sidebarLogoImagen}
                                />
                            ) : (
                                <div className={estilos.sidebarLogoDefault}>
                                    <ion-icon name="business-outline"></ion-icon>
                                </div>
                            )}
                            {!sidebarColapsado && (
                                <div className={estilos.sidebarLogoTexto}>
                                    <span className={estilos.sidebarNombreSistema}>
                                        {datosEmpresa?.nombre_empresa || 'Sistema POS'}
                                    </span>
                                    <span className={estilos.sidebarSubtitulo}>Gestión Empresarial</span>
                                </div>
                            )}
                        </Link>
                        <button 
                            className={estilos.sidebarToggle}
                            onClick={toggleSidebar}
                            aria-label={sidebarColapsado ? 'Expandir sidebar' : 'Colapsar sidebar'}
                            data-tooltip={sidebarColapsado ? 'Expandir' : 'Colapsar'}
                        >
                            <ion-icon name={sidebarColapsado ? 'chevron-forward-outline' : 'chevron-back-outline'}></ion-icon>
                        </button>
                    </div>

                {/* Navegación del Sidebar */}
                <nav className={estilos.sidebarNav}>
                    {/* Acciones Diarias */}
                    {accionesDiarias.length > 0 && !sidebarColapsado && (
                        <div className={estilos.sidebarSeccion}>
                            <span className={estilos.sidebarSeccionTitulo}>
                                <ion-icon name="flash-outline"></ion-icon>
                                Acciones Diarias
                            </span>
                            {accionesDiarias.map((item) => {
                                const esActivo = esRutaActiva(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`${estilos.sidebarItem} ${esActivo ? estilos.sidebarItemActivo : ''}`}
                                        title={item.label}
                                    >
                                        <ion-icon name={item.icon}></ion-icon>
                                        <span>{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    {/* Módulos */}
                    {categoriasNavegacion.map((categoria) => {
                        const estaAbierto = categoria.modulo === 'core' || seccionesAbiertas[categoria.modulo] !== false
                        const tieneSubmenu = categoria.items.length > 0
                        const esActivo = categoria.items.some(item => esRutaActiva(item.href))

                        return (
                            <div 
                                key={categoria.modulo} 
                                className={estilos.sidebarSeccion}
                                onMouseEnter={() => sidebarColapsado && tieneSubmenu && setHoverSubmenu(categoria.modulo)}
                                onMouseLeave={() => {
                                    // Delay para permitir mover el mouse al popover
                                    setTimeout(() => {
                                        if (sidebarColapsado && hoverSubmenu === categoria.modulo) {
                                            const popover = document.querySelector(`[data-popover-modulo="${categoria.modulo}"]`);
                                            if (!popover?.matches(':hover')) {
                                                setHoverSubmenu(null);
                                            }
                                        }
                                    }, 200);
                                }}
                            >
                                {sidebarColapsado ? (
                                    <>
                                        {/* Item compacto - SIEMPRE VISIBLE */}
                                        <button
                                            className={`${estilos.sidebarItemCompacto} ${esActivo ? estilos.sidebarItemActivo : ''}`}
                                            title={categoria.label}
                                            data-tooltip={categoria.label}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (tieneSubmenu) {
                                                    setHoverSubmenu(hoverSubmenu === categoria.modulo ? null : categoria.modulo);
                                                } else {
                                                    window.location.href = categoria.items[0]?.href || '/admin/dashboard';
                                                }
                                            }}
                                        >
                                            <ion-icon name={categoria.icon}></ion-icon>
                                        </button>
                                        
                                        {/* Popover para submenú en modo colapsado */}
                                        {hoverSubmenu === categoria.modulo && tieneSubmenu && (
                                            <div 
                                                className={estilos.sidebarPopover}
                                                data-popover-modulo={categoria.modulo}
                                                onMouseEnter={() => setHoverSubmenu(categoria.modulo)}
                                                onMouseLeave={() => setHoverSubmenu(null)}
                                            >
                                                <div className={estilos.sidebarPopoverTitulo}>
                                                    <ion-icon name={categoria.icon}></ion-icon>
                                                    <span>{categoria.label}</span>
                                                </div>
                                                <div className={estilos.sidebarPopoverItems}>
                                                    {categoria.items.map((item) => {
                                                        const esItemActivo = esRutaActiva(item.href)
                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                className={`${estilos.sidebarPopoverItem} ${esItemActivo ? estilos.sidebarPopoverItemActivo : ''}`}
                                                            >
                                                                <ion-icon name={item.icon}></ion-icon>
                                                                <span>{item.label}</span>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className={`${estilos.sidebarItemPrincipal} ${esActivo ? estilos.sidebarItemActivo : ''}`}
                                            onClick={() => categoria.modulo !== 'core' && toggleSeccion(categoria.modulo)}
                                            disabled={categoria.modulo === 'core'}
                                            title={categoria.label}
                                        >
                                            <ion-icon name={categoria.icon}></ion-icon>
                                            <span>{categoria.label}</span>
                                            {categoria.modulo !== 'core' && tieneSubmenu && (
                                                <ion-icon
                                                    name={estaAbierto ? 'chevron-up-outline' : 'chevron-down-outline'}
                                                    className={estilos.sidebarChevron}
                                                ></ion-icon>
                                            )}
                                        </button>

                                        {estaAbierto && tieneSubmenu && (
                                            <div className={estilos.sidebarSubmenu}>
                                                {categoria.items.map((item) => {
                                                    const esItemActivo = esRutaActiva(item.href)
                                                    return (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            className={`${estilos.sidebarSubmenuItem} ${esItemActivo ? estilos.sidebarSubmenuItemActivo : ''}`}
                                                        >
                                                            <span>{item.label}</span>
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )
                    })}
                </nav>

                    {/* Footer del Sidebar */}
                    <div className={estilos.sidebarFooter}>
                        {/* Botón de cambio de tema - SIEMPRE VISIBLE */}
                        <button 
                            className={estilos.sidebarTemaBtn}
                            onClick={toggleTema}
                            title={sidebarColapsado ? (tema === 'light' ? 'Modo Oscuro' : 'Modo Claro') : (tema === 'light' ? 'Modo Oscuro' : 'Modo Claro')}
                            aria-label={tema === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                            disabled={cargando}
                            data-tooltip={sidebarColapsado ? (tema === 'light' ? 'Modo Oscuro' : 'Modo Claro') : ''}
                        >
                            <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                            {!sidebarColapsado && (
                                <span>{tema === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                            )}
                        </button>

                        {/* Usuario - Solo mostrar si hay datos */}
                        {datosUsuario && (
                            <Link 
                                href="/admin/perfil" 
                                className={estilos.sidebarUsuario}
                                title={sidebarColapsado ? `${datosUsuario?.nombre} - ${obtenerTipoUsuario()}` : ''}
                                data-tooltip={sidebarColapsado ? `${datosUsuario?.nombre} - ${obtenerTipoUsuario()}` : ''}
                            >
                                {datosUsuario?.avatar_url ? (
                                    <img
                                        src={datosUsuario.avatar_url}
                                        alt={datosUsuario.nombre}
                                        className={estilos.sidebarUsuarioAvatar}
                                    />
                                ) : (
                                    <div className={estilos.sidebarUsuarioAvatarDefault}>
                                        <ion-icon name="person-outline"></ion-icon>
                                    </div>
                                )}
                                {!sidebarColapsado && (
                                    <div className={estilos.sidebarUsuarioInfo}>
                                        <span className={estilos.sidebarUsuarioNombre}>{datosUsuario?.nombre || 'Usuario'}</span>
                                        <span className={estilos.sidebarUsuarioRol}>{obtenerTipoUsuario() || 'Admin'}</span>
                                    </div>
                                )}
                            </Link>
                        )}
                    </div>
                </aside>

            {/* Menú móvil - Solo visible en pantallas pequeñas */}
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
                                <div className={estilos.menuEmpresa}>
                                    {datosEmpresa?.logo_url ? (
                                        <img
                                            src={datosEmpresa.logo_url}
                                            alt={datosEmpresa.nombre_empresa}
                                            className={estilos.menuLogoEmpresa}
                                        />
                                    ) : (
                                        <div className={estilos.menuLogoDefault}>
                                            <ion-icon name="business-outline"></ion-icon>
                                        </div>
                                    )}
                                    <div className={estilos.menuEmpresaInfo}>
                                        <span
                                            className={estilos.menuEmpresaNombre}>{datosEmpresa?.nombre_empresa}</span>
                                        <span className={estilos.menuEmpresaRnc}>RNC: {datosEmpresa?.rnc}</span>
                                    </div>
                                </div>

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
                                        <span className={estilos.menuUsuarioTipo}>{obtenerTipoUsuario()}</span>
                                    </div>
                                </div>
                            </div>

                            <nav className={estilos.menuNav}>
                                {/* Acciones Diarias - Solo si hay items */}
                                {accionesDiarias.length > 0 && (
                                    <div className={estilos.menuSeccion}>
                                        <span className={estilos.menuSeccionTitulo}>
                                            <ion-icon name="flash-outline"></ion-icon>
                                            Acciones Diarias
                                        </span>
                                        {accionesDiarias.map((item) => {
                                            const esActivo = esRutaActiva(item.href)
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`${estilos.menuItem} ${esActivo ? estilos.activo : ''}`}
                                                    onClick={cerrarMenu}
                                                >
                                                    <ion-icon name={item.icon}></ion-icon>
                                                    <span>{item.label}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Módulos con secciones colapsables */}
                                {categoriasNavegacion.map((categoria) => {
                                    // Core siempre abierto, otros módulos colapsables (por defecto abiertos)
                                    const estaAbierto = categoria.modulo === 'core' || seccionesAbiertas[categoria.modulo] !== false

                                    return (
                                        <div key={categoria.modulo} className={estilos.menuSeccion}>
                                            <button
                                                className={estilos.menuSeccionTituloBtn}
                                                onClick={() => categoria.modulo !== 'core' && toggleSeccion(categoria.modulo)}
                                                disabled={categoria.modulo === 'core'}
                                            >
                                                <ion-icon name={categoria.icon}></ion-icon>
                                                <span>{categoria.label}</span>
                                                {categoria.modulo !== 'core' && (
                                                    <ion-icon
                                                        name={estaAbierto ? 'chevron-up-outline' : 'chevron-down-outline'}
                                                        className={estilos.chevronSeccion}
                                                    ></ion-icon>
                                                )}
                                            </button>

                                            {estaAbierto && (
                                                <div className={estilos.menuSeccionItems}>
                                                    {categoria.items.map((item) => {
                                                        const esActivo = esRutaActiva(item.href)
                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                className={`${estilos.menuItem} ${esActivo ? estilos.activo : ''}`}
                                                                onClick={cerrarMenu}
                                                            >
                                                                <ion-icon name={item.icon}></ion-icon>
                                                                <span>{item.label}</span>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </nav>

                            <div className={estilos.menuFooter}>
                                <button className={estilos.menuItemTema} onClick={toggleTema}>
                                    <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                                    <span>{tema === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                                </button>
                                <Link href="/admin/perfil" className={estilos.menuItemPerfil} onClick={cerrarMenu}>
                                    <ion-icon name="person-circle-outline"></ion-icon>
                                    <span>Mi Perfil</span>
                                </Link>
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