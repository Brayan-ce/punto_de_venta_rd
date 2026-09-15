"use client"
import { useEffect, useState } from 'react'
import { obtenerResumenSucursales } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './dashboard.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function Dashboard() {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [resumen, setResumen] = useState(null)
    const [fuentes, setFuentes] = useState({})
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        cargar()

        const handleTemaChange = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }
        window.addEventListener('temaChange', handleTemaChange)
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [])

    const cargar = async () => {
        setCargando(true)
        try {
            const res = await obtenerResumenSucursales()
            if (res.success) {
                setResumen(res.resumen)
                setFuentes(res.fuentes || {})
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setCargando(false)
        }
    }

    if (!mounted || cargando) {
        return <LoadingScreen />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Dashboard de Sucursales', 'Branch Dashboard')}</h1>
                    <p className={estilos.subtitulo}>{tr('Resumen operativo de tus sucursales', 'Operational summary of your branches')}</p>
                </div>
            </div>

            {/* Indicadores */}
            <div className={estilos.indicadores}>
                <div className={estilos.card}>
                    <div className={estilos.cardContent}>
                        <p className={estilos.cardLabel}>{tr('Sucursales Activas', 'Active Branches')}</p>
                        <h2 className={estilos.cardValue}>{resumen?.sucursales || 0}</h2>
                    </div>
                    <div className={`${estilos.cardIcon} ${estilos.blue}`}>
                        <ion-icon name="storefront-outline"></ion-icon>
                    </div>
                </div>

                <div className={estilos.card}>
                    <div className={estilos.cardContent}>
                        <p className={estilos.cardLabel}>{tr('Transferencias Pendientes', 'Pending Transfers')}</p>
                        <h2 className={estilos.cardValue}>{resumen?.transferencias_pendientes || 0}</h2>
                    </div>
                    <div className={`${estilos.cardIcon} ${estilos.orange}`}>
                        <ion-icon name="swap-horizontal-outline"></ion-icon>
                    </div>
                </div>

                <div className={estilos.card}>
                    <div className={estilos.cardContent}>
                        <p className={estilos.cardLabel}>{tr('Stock Bajo', 'Low Stock')}</p>
                        <h2 className={estilos.cardValue}>{resumen?.stock_bajo || 0}</h2>
                    </div>
                    <div className={`${estilos.cardIcon} ${estilos.red}`}>
                        <ion-icon name="warning-outline"></ion-icon>
                    </div>
                </div>

                <div className={estilos.card}>
                    <div className={estilos.cardContent}>
                        <p className={estilos.cardLabel}>{tr('Movimientos Hoy', 'Today\'s Movements')}</p>
                        <h2 className={estilos.cardValue}>{resumen?.movimientos_hoy || 0}</h2>
                    </div>
                    <div className={`${estilos.cardIcon} ${estilos.green}`}>
                        <ion-icon name="trending-up-outline"></ion-icon>
                    </div>
                </div>
            </div>

            {/* Mensaje de datos complementados */}
            {(fuentes.stockBajo === 'fallback' || fuentes.movimientosHoy === 'fallback') && (
                <div className={estilos.avisoFallback}>
                    <ion-icon name="information-circle-outline"></ion-icon>
                    <span>{tr('Indicadores complementados con datos del inventario actual mientras se llena la operación de sucursales', 'Indicators complemented with current inventory data while branch operations are filled')}</span>
                </div>
            )}

            {/* Acciones Rápidas */}
            <div className={estilos.acciones}>
                <h3>{tr('Acciones Rápidas', 'Quick Actions')}</h3>
                <div className={estilos.gridAcciones}>
                    <a href="/sucursales/stock" className={estilos.accion}>
                        <ion-icon name="cube-outline"></ion-icon>
                        <span>{tr('Ver Inventario', 'View Inventory')}</span>
                    </a>
                    <a href="/sucursales/transferencias" className={estilos.accion}>
                        <ion-icon name="swap-horizontal-outline"></ion-icon>
                        <span>{tr('Transferencias', 'Transfers')}</span>
                    </a>
                    <a href="/sucursales/sedes" className={estilos.accion}>
                        <ion-icon name="business-outline"></ion-icon>
                        <span>{tr('Sucursales', 'Branches')}</span>
                    </a>
                    <a href="/sucursales/productos" className={estilos.accion}>
                        <ion-icon name="cube-outline"></ion-icon>
                        <span>{tr('Productos', 'Products')}</span>
                    </a>
                </div>
            </div>
        </div>
    )
}
