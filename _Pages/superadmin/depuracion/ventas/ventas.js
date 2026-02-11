'use client'

import { useState, useEffect } from 'react'
import {
    ShoppingCart,
    AlertOctagon,
    Eye
} from 'lucide-react'
import s from './ventas.module.css'

export default function VentasDepuracion({ ventasAnomalas = [] }) {
    const [tema, setTema] = useState('light')

    useEffect(() => {
        const checkTheme = () => {
            const isDark = document.body.classList.contains('dark-mode') ||
                document.documentElement.classList.contains('dark')
            setTema(isDark ? 'dark' : 'light')
        }
        checkTheme()
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    return (
        <div className={`${s.contenedor} ${s[tema]}`}>
            <div className={s.header}>
                <h1 className={s.titulo}>
                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                    Depuración de Ventas
                </h1>
                <p className={s.subtitulo}>
                    Detección de ventas anómalas (monto cero, sin items, etc.)
                </p>
            </div>

            <div className={`${s.tablaContenedor} ${s[tema]}`}>
                <div className={s.tablaScroll}>
                    <table className={s.tabla}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Empresa</th>
                                <th>NCF / No. Interno</th>
                                <th>Total</th>
                                <th>Anomalía Detectada</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventasAnomalas.length === 0 ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className={s.emptyState}>
                                            <AlertOctagon size={48} className={s.emptyIcon} />
                                            <p className={s.emptyTitle}>Todo en orden</p>
                                            <p className={s.emptyDesc}>No se detectaron ventas anómalas en el sistema.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                ventasAnomalas.map(venta => (
                                    <tr key={venta.id}>
                                        <td>{new Date(venta.fecha_venta).toLocaleString('es-DO')}</td>
                                        <td><strong>{venta.nombre_empresa}</strong></td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className={s.ncfCol}>{venta.ncf || 'Sin NCF'}</span>
                                                <span className="text-[10px] opacity-50">Int: {venta.numero_interno}</span>
                                            </div>
                                        </td>
                                        <td className={s.totalCol}>RD$ {parseFloat(venta.total || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={s.badgeAnomalia}>
                                                {venta.tipo_anomalia}
                                            </span>
                                        </td>
                                        <td style={{ textTransform: 'capitalize' }}>{venta.estado}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className={s.btnVer}>
                                                <Eye size={14} /> Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
