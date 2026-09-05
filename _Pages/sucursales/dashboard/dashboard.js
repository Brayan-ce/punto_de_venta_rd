"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerResumenSucursales } from './servidor'
import estilos from './dashboard.module.css'

export default function DashboardSucursales() {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [resumen, setResumen] = useState({
        sucursales: 0,
        transferenciasPendientes: 0,
        stockBajo: 0,
        movimientosHoy: 0
    })
    const [fuentes, setFuentes] = useState({
        stockBajo: 'stock_sucursal',
        movimientosHoy: 'movimientos_stock_sucursal'
    })

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            setTema(localStorage.getItem('tema') || 'light')
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        const cargar = async () => {
            setCargando(true)
            const r = await obtenerResumenSucursales()
            if (r.success) {
                setResumen(r.resumen)
                setFuentes(r.fuentes || {
                    stockBajo: 'stock_sucursal',
                    movimientosHoy: 'movimientos_stock_sucursal'
                })
            }
            setCargando(false)
        }
        cargar()
    }, [])

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <h1 className={estilos.titulo}>Dashboard de Sucursales</h1>
                <p className={estilos.subtitulo}>Resumen operativo de transferencias y stock entre sucursales.</p>
                {(fuentes.stockBajo === 'productos' || fuentes.movimientosHoy === 'movimientos_inventario') ? (
                    <p className={estilos.subtitulo}>
                        Indicadores complementados con datos del inventario actual mientras se llena la operacion de sucursales.
                    </p>
                ) : null}
            </div>

            <div className={estilos.estadisticasPrincipales}>
                <article className={`${estilos.estadCard} ${estilos.sucursales}`}>
                    <div className={estilos.estadIcono}><ion-icon name="business-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Sucursales activas</span>
                        <strong className={estilos.estadValor}>{cargando ? '...' : resumen.sucursales}</strong>
                    </div>
                </article>
                <article className={`${estilos.estadCard} ${estilos.transferencias}`}>
                    <div className={estilos.estadIcono}><ion-icon name="swap-horizontal-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Transferencias pendientes</span>
                        <strong className={estilos.estadValor}>{cargando ? '...' : resumen.transferenciasPendientes}</strong>
                    </div>
                </article>
                <article className={`${estilos.estadCard} ${estilos.stock}`}>
                    <div className={estilos.estadIcono}><ion-icon name="alert-circle-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Productos en stock bajo</span>
                        <strong className={estilos.estadValor}>{cargando ? '...' : resumen.stockBajo}</strong>
                    </div>
                </article>
                <article className={`${estilos.estadCard} ${estilos.movimientos}`}>
                    <div className={estilos.estadIcono}><ion-icon name="trail-sign-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Movimientos hoy</span>
                        <strong className={estilos.estadValor}>{cargando ? '...' : resumen.movimientosHoy}</strong>
                    </div>
                </article>
            </div>

            <div className={estilos.fila}>
                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}><ion-icon name="flash-outline"></ion-icon> Acciones rápidas</h2>
                    </div>
                    <div className={estilos.panelBodyAcciones}>
                        <Link href="/sucursales/stock" className={estilos.action}>Ver stock por sucursal</Link>
                        <Link href="/sucursales/transferencias" className={estilos.action}>Gestionar transferencias</Link>
                        <Link href="/sucursales/movimientos" className={estilos.action}>Revisar movimientos</Link>
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos[tema]}`}>
                    <div className={estilos.panelHeader}>
                        <h2 className={estilos.panelTitulo}><ion-icon name="information-circle-outline"></ion-icon> Estado operativo</h2>
                    </div>
                    <div className={estilos.panelBodyEstado}>
                        <div className={estilos.estadoItem}>
                            <span>Transferencias por atender</span>
                            <strong>{cargando ? '...' : resumen.transferenciasPendientes}</strong>
                        </div>
                        <div className={estilos.estadoItem}>
                            <span>Alertas de inventario</span>
                            <strong>{cargando ? '...' : resumen.stockBajo}</strong>
                        </div>
                        <div className={estilos.estadoItem}>
                            <span>Movimientos registrados hoy</span>
                            <strong>{cargando ? '...' : resumen.movimientosHoy}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
