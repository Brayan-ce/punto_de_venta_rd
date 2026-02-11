'use client'

import { useEffect, useState } from 'react'
import { redirect, usePathname } from 'next/navigation'
import Link from 'next/link'
import s from './layout.module.css'

export default function DepuracionLayout({ children }) {
    const pathname = usePathname()
    const [tema, setTema] = useState('light')

    useEffect(() => {
        const checkTheme = () => {
            const isDark = document.body.classList.contains('dark-mode') ||
                document.documentElement.classList.contains('dark') ||
                localStorage.getItem('tema') === 'dark'
            setTema(isDark ? 'dark' : 'light')
        }
        checkTheme()
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
        window.addEventListener('temaChange', checkTheme)
        return () => {
            observer.disconnect()
            window.removeEventListener('temaChange', checkTheme)
        }
    }, [])

    const navItems = [
        { label: 'Clientes', href: '/superadmin/depuracion/clientes' },
        { label: 'Cajas', href: '/superadmin/depuracion/cajas' },
        { label: 'Suscripciones', href: '/superadmin/depuracion/suscripciones' },
        { label: 'Alertas', href: '/superadmin/depuracion/alertas' },
        { label: 'Ventas', href: '/superadmin/depuracion/ventas' },
        { label: 'Auditoría', href: '/superadmin/depuracion/auditoria' },
    ]

    return (
        <div className={`${s.contenedor} ${s[tema]}`}>
            <header className={s.header}>
                <div className={s.headerContenedor}>
                    <div className={s.brand}>
                        <Link href="/superadmin/depuracion" className={s.logoLink}>
                            🛡️ <span className="hidden sm:inline">Centro de Depuración</span>
                        </Link>
                        <nav className={s.nav}>
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${s.navLink} ${pathname === item.href ? s.activo : ''}`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div>
                        <Link href="/superadmin" className={s.volverLink}>
                            ← <span className="hidden sm:inline">Volver al Dashboard</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className={s.main}>
                {children}
            </main>
        </div>
    )
}
