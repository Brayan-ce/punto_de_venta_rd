"use client"
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { obtenerTransferencias } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './transferencias.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function Transferencias() {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [transferencias, setTransferencias] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [estadoFiltro, setEstadoFiltro] = useState('')
    const [mounted, setMounted] = useState(false)

    const estadoTexto = (estado) => {
        const mapa = {
            pendiente: tr('Pendiente', 'Pending'),
            aprobada: tr('Aprobada', 'Approved'),
            en_transito: tr('En Transito', 'In Transit'),
            recibida: tr('Recibida', 'Received'),
            rechazada: tr('Rechazada', 'Rejected'),
            cancelada: tr('Cancelada', 'Canceled')
        }

        return mapa[estado] || estado
    }

    const prioridadTexto = (prioridad) => {
        const mapa = {
            baja: tr('Baja', 'Low'),
            normal: tr('Normal', 'Normal'),
            alta: tr('Alta', 'High'),
            urgente: tr('Urgente', 'Urgent')
        }

        return mapa[prioridad] || prioridad
    }

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
            const res = await obtenerTransferencias({ buscar: busqueda, estado: estadoFiltro })
            if (res.success) {
                setTransferencias(res.transferencias || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(cargar, 500)
        return () => clearTimeout(timer)
    }, [busqueda, estadoFiltro])

    const stats = useMemo(() => {
        return {
            total: transferencias.length,
            pendientes: transferencias.filter(t => t.estado === 'pendiente').length,
            en_transito: transferencias.filter(t => t.estado === 'en_transito').length,
            recibidas: transferencias.filter(t => t.estado === 'recibida').length
        }
    }, [transferencias])

    if (!mounted) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="swap-horizontal-outline"></ion-icon>
                        {tr('Transferencias de Stock', 'Stock Transfers')}
                    </h1>
                    <p className={estilos.subtitulo}>{tr('Gestiona movimientos entre sucursales', 'Manage movements between branches')}</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/sucursales/transferencias/nueva" className={estilos.btnNuevo}>
                        <ion-icon name="add-outline"></ion-icon>
                        <span>{tr('Nueva Transferencia', 'New Transfer')}</span>
                    </Link>
                </div>
            </div>

            <div className={estilos.stats}>
                <div className={estilos.card}>
                    <div className={estilos.cardValue}>{stats.total}</div>
                    <div className={estilos.cardLabel}>{tr('Total', 'Total')}</div>
                </div>
                <div className={estilos.card}>
                    <div className={estilos.cardValue}>{stats.pendientes}</div>
                    <div className={estilos.cardLabel}>{tr('Pendientes', 'Pending')}</div>
                </div>
                <div className={estilos.card}>
                    <div className={estilos.cardValue}>{stats.en_transito}</div>
                    <div className={estilos.cardLabel}>{tr('En Tránsito', 'In Transit')}</div>
                </div>
                <div className={estilos.card}>
                    <div className={estilos.cardValue}>{stats.recibidas}</div>
                    <div className={estilos.cardLabel}>{tr('Recibidas', 'Received')}</div>
                </div>
            </div>

            <div className={estilos.filtros}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar transferencia...', 'Search transfer...')}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className={estilos.select}>
                    <option value="">{tr('Todos los estados', 'All statuses')}</option>
                    <option value="pendiente">{tr('Pendiente', 'Pending')}</option>
                    <option value="en_transito">{tr('En Tránsito', 'In Transit')}</option>
                    <option value="recibida">{tr('Recibida', 'Received')}</option>
                </select>
            </div>

            {cargando ? <LoadingScreen /> : transferencias.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="swap-horizontal-outline"></ion-icon>
                    <p>{tr('No hay transferencias', 'No transfers found')}</p>
                </div>
            ) : (
                <div className={estilos.tabla}>
                    <table>
                        <thead>
                            <tr>
                                <th>{tr('Número', 'Number')}</th>
                                <th>{tr('Origen', 'Origin')}</th>
                                <th>{tr('Destino', 'Destination')}</th>
                                <th>{tr('Estado', 'Status')}</th>
                                <th>{tr('Prioridad', 'Priority')}</th>
                                <th>{tr('Acciones', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transferencias.map(t => (
                                <tr key={t.id}>
                                    <td data-label={tr('Numero', 'Number')}><strong>{t.numero_transferencia}</strong></td>
                                    <td data-label={tr('Origen', 'Origin')}>{t.sucursal_origen}</td>
                                    <td data-label={tr('Destino', 'Destination')}>{t.sucursal_destino}</td>
                                    <td data-label={tr('Estado', 'Status')}>
                                        <span className={`${estilos.badge} ${estilos[t.estado]}`}>
                                            {estadoTexto(t.estado)}
                                        </span>
                                    </td>
                                    <td data-label={tr('Prioridad', 'Priority')}>
                                        <span className={`${estilos.badge} ${estilos.prioridad}`}>{prioridadTexto(t.prioridad)}</span>
                                    </td>
                                    <td data-label={tr('Acciones', 'Actions')}>
                                        <div className={estilos.acciones}>
                                            <Link href={`/sucursales/transferencias/${t.id}`} className={estilos.btnAccion}>{tr('Ver', 'View')}</Link>
                                            {t.estado === 'pendiente' && (
                                                <Link href={`/sucursales/transferencias/editar/${t.id}`} className={estilos.btnAccion}>{tr('Editar', 'Edit')}</Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
