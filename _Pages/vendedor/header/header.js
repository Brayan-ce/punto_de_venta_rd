"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { obtenerDatosUsuario, cerrarSesion } from './servidor'
import estilos from './header.module.css'

export default function HeaderVendedor() {
    const router = useRouter()
    const pathname = usePathname()
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
    const [tema, setTema] = useState('light')
    const [datosUsuario, setDatosUsuario] = useState(null)
    const [datosEmpresa, setDatosEmpresa] = useState(null)
    const [logoPlataforma, setLogoPlataforma] = useState(null)
    const [permisos, setPermisos] = useState([])
    const [cargando, setCargando] = useState(true)

    const navegacionPrincipal = [
        { href: '/vendedor/ventas', icon: 'cart-outline', label: 'Ventas', permiso: 'ventas.view' },
        { href: '/vendedor/productos', icon: 'cube-outline', label: 'Productos', permiso: 'productos.view' },
        { href: '/vendedor/clientes', icon: 'people-outline', label: 'Clientes', permiso: 'clientes.view' },
        { href: '/vendedor/dashboard', icon: 'speedometer-outline', label: 'Dashboard', permiso: 'dashboard.view' }
    ]

    const navegacionMenu = [
        { href: '/vendedor/inventario', icon: 'file-tray-stacked-outline', label: 'Inventario', permiso: 'inventario.view' },
        { href: '/vendedor/compras', icon: 'bag-handle-outline', label: 'Compras', permiso: 'compras.view' },
        { href: '/vendedor/proveedores', icon: 'business-outline', label: 'Proveedores', permiso: 'proveedores.view' },
        { href: '/vendedor/categorias', icon: 'apps-outline', label: 'Categorias', permiso: 'productos.view' },
        { href: '/vendedor/marcas', icon: 'pricetag-outline', label: 'Marcas', permiso: 'productos.view' },
        { href: '/vendedor/cajas', icon: 'cash-outline', label: 'Cajas', permiso: 'caja.view' },
        { href: '/vendedor/gastos', icon: 'wallet-outline', label: 'Gastos', permiso: 'caja.view' },
        { href: '/vendedor/reportes', icon: 'stats-chart-outline', label: 'Reportes', permiso: 'reportes.view' }
    ]

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
                const resultado = await obtenerDatosUsuario()
                if (resultado.success) {
                    setDatosUsuario(resultado.usuario)
                    setDatosEmpresa(resultado.empresa)
                    setLogoPlataforma(resultado.logoPlataforma)
                    setPermisos(resultado.permisos || [])
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
        }

        document.addEventListener('click', manejarClickFuera)
        return () => document.removeEventListener('click', manejarClickFuera)
    }, [menuUsuarioAbierto])

    const tienePermiso = (permisoClave) => {
        if (!permisoClave) return true
        return permisos.includes(permisoClave)
    }

    const navegacionPrincipalFiltrada = navegacionPrincipal.filter(item => tienePermiso(item.permiso))
    const navegacionMenuFiltrada = navegacionMenu.filter(item => tienePermiso(item.permiso))

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
        if (datosUsuario.tipo === 'vendedor') return datosUsuario.rol_nombre || 'Vendedor'
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

                    <Link href="/vendedor" className={estilos.logo}>
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
                        {navegacionPrincipalFiltrada.map((item) => {
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
                                        href="/vendedor/perfil"
                                        className={estilos.menuDesplegableItem}
                                        onClick={() => setMenuUsuarioAbierto(false)}
                                    >
                                        <ion-icon name="person-circle-outline"></ion-icon>
                                        <span>Mi Perfil</span>
                                    </Link>

                                    {navegacionMenuFiltrada.length > 0 && (
                                        <>
                                            <div className={estilos.separadorMenu}></div>

                                            {navegacionMenuFiltrada.map((item) => {
                                                const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')
                                                
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
                                        </>
                                    )}

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
                                        <span className={estilos.menuEmpresaNombre}>{datosEmpresa?.nombre_empresa}</span>
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
                                {navegacionPrincipalFiltrada.length > 0 && (
                                    <div className={estilos.menuSeccion}>
                                        <span className={estilos.menuSeccionTitulo}>Principal</span>
                                        {navegacionPrincipalFiltrada.map((item) => {
                                            const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')
                                            
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

                                {navegacionMenuFiltrada.length > 0 && (
                                    <div className={estilos.menuSeccion}>
                                        <span className={estilos.menuSeccionTitulo}>Gestion</span>
                                        {navegacionMenuFiltrada.map((item) => {
                                            const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')
                                            
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
                            </nav>

                            <div className={estilos.menuFooter}>
                                <button className={estilos.menuItemTema} onClick={toggleTema}>
                                    <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                                    <span>{tema === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                                </button>
                                <Link href="/vendedor/perfil" className={estilos.menuItemPerfil} onClick={cerrarMenu}>
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