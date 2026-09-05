"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerNotificaciones } from './servidor'
import { useLanguage } from '../i18n/LanguageProvider'
import estilos from './notificaciones.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function Notificaciones() {
    const { language } = useLanguage()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [data, setData] = useState({ cuotasProximas: [], cuotasVencidas: [], alertas: [], stats: {} })
    const [tab, setTab] = useState('proximas')

    const tr = (es, en) => language === 'en' ? en : es

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const onChange = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', onChange)
        window.addEventListener('storage', onChange)
        return () => {
            window.removeEventListener('temaChange', onChange)
            window.removeEventListener('storage', onChange)
        }
    }, [])

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        setCargando(true)
        const r = await obtenerNotificaciones()
        if (r.success) setData(r)
        setCargando(false)
    }

    const fmtMoneda = (v) => new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0)
    const fmtFecha = (f) => {
        if (!f) return '—'
        return new Date(f).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
    }
    const diasPara = (f) => {
        if (!f) return null
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
        const [y, m, d] = String(f).slice(0, 10).split('-').map(Number)
        return Math.ceil((new Date(y, m - 1, d) - hoy) / 86400000)
    }

    const TABS = [
        { key: 'proximas', dataKey: 'cuotasProximas', label: tr('Cuotas próximas', 'Upcoming installments'), icon: 'time-outline', count: data.stats.proximas },
        { key: 'vencidas', dataKey: 'cuotasVencidas', label: tr('Cuotas vencidas', 'Overdue installments'), icon: 'alert-circle-outline', count: data.stats.vencidas },
        { key: 'alertas',  dataKey: 'alertas',        label: tr('Alertas', 'Alerts'),                        icon: 'notifications-outline', count: data.stats.alertas },
    ]

    if (cargando) { return <LoadingScreen /> }

    const tabActiva = TABS.find(t => t.key === tab) || TABS[0]
    const lista = data[tabActiva.dataKey] || []

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}>
                        <ion-icon name="notifications-outline"></ion-icon>
                    </div>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Notificaciones', 'Notifications')}</h1>
                        <p className={estilos.subtitulo}>{tr('Cuotas por vencer, vencidas y alertas de financiamiento', 'Upcoming, overdue installments and financing alerts')}</p>
                    </div>
                </div>
                <button className={estilos.btnActualizar} onClick={cargar}>
                    <ion-icon name="refresh-outline"></ion-icon>
                    <span>{tr('Actualizar', 'Refresh')}</span>
                </button>
            </div>

            <div className={estilos.statsGrid}>
                {TABS.map(s => (
                    <div key={s.key} className={`${estilos.statCard} ${estilos[s.key]}`}>
                        <div className={`${estilos.statIcono} ${estilos[s.key]}`}>
                            <ion-icon name={s.icon}></ion-icon>
                        </div>
                        <div>
                            <span className={estilos.statValor}>{s.count || 0}</span>
                            <span className={estilos.statLabel}>{s.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={estilos.tabs}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        className={`${estilos.tabBtn} ${tab === t.key ? estilos.tabActivo : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        <ion-icon name={t.icon}></ion-icon>
                        {t.label}
                        {t.count > 0 && <span className={estilos.tabCount}>{t.count}</span>}
                    </button>
                ))}
            </div>

            {lista.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="checkmark-done-circle-outline"></ion-icon>
                    <h3>{tr('Sin pendientes', 'Nothing pending')}</h3>
                    <p>{tr('Todo está al día en esta sección', 'Everything is up to date in this section')}</p>
                </div>
            ) : (
                <div className={estilos.lista}>
                    {lista.map(item => {
                        const esAlerta = tab === 'alertas'
                        const esVencida = tab === 'vencidas'
                        const dias = diasPara(item.fecha_vencimiento)
                        const monto = esAlerta ? 0 : (parseFloat(item.monto) + parseFloat(item.mora || 0))
                        return (
                            <div key={item.id} className={`${estilos.item} ${esVencida ? estilos.itemVencida : ''}`}>
                                <div className={`${estilos.avatar} ${esAlerta ? estilos.avatarAlerta : esVencida ? estilos.avatarVencida : ''}`}>
                                    {esAlerta ? <ion-icon name="warning-outline"></ion-icon> : (item.cliente_nombre?.charAt(0) || '?')}
                                </div>
                                <div className={estilos.itemInfo}>
                                    <span className={estilos.itemNombre}>{esAlerta ? item.mensaje : item.cliente_nombre}</span>
                                    <span className={estilos.itemMeta}>
                                        {esAlerta
                                            ? `${item.numero_contrato ? item.numero_contrato + ' · ' : ''}${item.cliente_nombre || ''}`
                                            : `${item.numero_contrato || ''} · ${item.plan_nombre || ''} · ${tr('Cuota', 'Installment')} #${item.numero}`}
                                    </span>
                                    {!esAlerta && (
                                        <span className={estilos.itemSub}>
                                            {tr('Vence', 'Due')} {fmtFecha(item.fecha_vencimiento)}
                                            {dias !== null && dias > 0 && <span className={estilos.diasBadge}>{dias} {tr('días', 'days')}</span>}
                                        </span>
                                    )}
                                </div>
                                <div className={estilos.itemDerecha}>
                                    {!esAlerta && <span className={estilos.itemMonto}>{fmtMoneda(monto)}</span>}
                                    <div className={estilos.itemAcciones}>
                                        {item.contrato_id && (
                                            <Link href={`/admin/contratos/ver/${item.contrato_id}`} className={estilos.btnAccion} title={tr('Ver contrato', 'View contract')}>
                                                <ion-icon name="eye-outline"></ion-icon>
                                            </Link>
                                        )}
                                        {item.cliente_telefono && (
                                            <>
                                                <a href={`tel:${item.cliente_telefono}`} className={estilos.btnAccion} title={tr('Llamar', 'Call')}>
                                                    <ion-icon name="call-outline"></ion-icon>
                                                </a>
                                                <a href={`https://wa.me/${item.cliente_telefono}`} target="_blank" rel="noreferrer" className={estilos.btnAccion} title="WhatsApp">
                                                    <ion-icon name="logo-whatsapp"></ion-icon>
                                                </a>
                                            </>
                                        )}
                                        {!esAlerta && (
                                            <Link href={`/admin/cuotas`} className={estilos.btnAccion} title={tr('Ir a cuotas', 'Go to installments')}>
                                                <ion-icon name="cash-outline"></ion-icon>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
