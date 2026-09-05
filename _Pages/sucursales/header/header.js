"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cerrarSesionSucursal, obtenerDatosSucursal } from './servidor'
import estilos from './header.module.css'

const NAV_ITEMS = [
    { href: '/sucursales', label: 'Dashboard', icon: 'grid-outline' },
    { href: '/sucursales/stock', label: 'Stock', icon: 'cube-outline' },
    { href: '/sucursales/transferencias', label: 'Transferencias', icon: 'swap-horizontal-outline' },
    { href: '/sucursales/movimientos', label: 'Movimientos', icon: 'trail-sign-outline' }
]

export default function HeaderSucursales() {
    const router = useRouter()
    const pathname = usePathname()
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [usuario, setUsuario] = useState(null)
    const [empresa, setEmpresa] = useState(null)

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const r = await obtenerDatosSucursal()
                if (r.success) {
                    localStorage.setItem('cachedSucursalSession', JSON.stringify({
                        usuario: r.usuario,
                        empresa: r.empresa,
                        timestamp: Date.now()
                    }))
                    setUsuario(r.usuario)
                    setEmpresa(r.empresa)
                } else {
                    usarCacheLocal()
                }
            } catch {
                usarCacheLocal()
            }
        }
        const usarCacheLocal = () => {
            const cached = localStorage.getItem('cachedSucursalSession')
            if (cached) {
                const parsed = JSON.parse(cached)
                if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                    setUsuario(parsed.usuario)
                    setEmpresa(parsed.empresa)
                    return
                }
                localStorage.removeItem('cachedSucursalSession')
            }
            router.push('/login')
        }
        cargarDatos()
    }, [router])

    const cerrarSesion = async () => {
        await cerrarSesionSucursal()
        router.push('/login')
    }

    return (
        <header className={estilos.header}>
            <div className={estilos.topbar}>
                <div className={estilos.brandWrap}>
                    <button className={estilos.menuBtn} onClick={() => setMenuAbierto(v => !v)}>
                        <ion-icon name="menu-outline"></ion-icon>
                    </button>
                    <Link href="/sucursales" className={estilos.brand}>Sucursales</Link>
                    <span className={estilos.empresa}>{empresa?.nombre_empresa || ''}</span>
                </div>
                <div className={estilos.usuarioWrap}>
                    <span className={estilos.usuarioNombre}>{usuario?.nombre || 'Usuario'}</span>
                    <button className={estilos.logoutBtn} onClick={cerrarSesion}>
                        <ion-icon name="log-out-outline"></ion-icon>
                        <span>Salir</span>
                    </button>
                </div>
            </div>

            <nav className={`${estilos.nav} ${menuAbierto ? estilos.navAbierto : ''}`}>
                {NAV_ITEMS.map(item => {
                    const activa = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link key={item.href} href={item.href} className={`${estilos.navItem} ${activa ? estilos.activo : ''}`} onClick={() => setMenuAbierto(false)}>
                            <ion-icon name={item.icon}></ion-icon>
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </header>
    )
}
