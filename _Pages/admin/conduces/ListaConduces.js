"use client"
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { listarConduces } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import { obtenerTextoEstado, obtenerTextoTipoOrigen } from './lib'
import estilos from './conduces.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ListaConduces() {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [conduces, setConduces] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [vistaMovil, setVistaMovil] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        cargarConduces()

        const checkMobile = () => setVistaMovil(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const cargarConduces = async () => {
        setCargando(true)
        try {
            const res = await listarConduces({ buscar: busqueda })
            if (res.success) {
                setConduces(res.conduces)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(cargarConduces, 500)
        return () => clearTimeout(timer)
    }, [busqueda])

    // Estadísticas calculadas
    const stats = useMemo(() => {
        const hoy = new Date().toDateString()
        return {
            total: conduces.length,
            hoy: conduces.filter(c => new Date(c.created_at).toDateString() === hoy).length,
            entregados: conduces.filter(c => c.estado === 'entregado').length,
            emitidos: conduces.filter(c => c.estado === 'emitido').length
        }
    }, [conduces])

    // Evitar error de hidratación
    if (!mounted) {
        return (
            <div className={`${estilos.contenedor} ${estilos.light}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Conduces de Despacho', 'Delivery Notes')}</h1>
                        <p className={estilos.subtitulo}>{tr('Control de entregas y saldos de materiales', 'Track deliveries and pending material balances')}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Conduces de Despacho', 'Delivery Notes')}</h1>
                    <p className={estilos.subtitulo}>{tr('Control de entregas y saldos de materiales', 'Track deliveries and pending material balances')}</p>
                </div>
                <Link href="/admin/conduces/nuevo" className={estilos.btnNuevo}>
                    <ion-icon name="basket-outline"></ion-icon>
                    <span>{tr('Nuevo Conduce', 'New Delivery Note')}</span>
                </Link>
            </div>

            {/* Stats Bar */}
            <div className={estilos.estadisticas}>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadInfo}>
                        <p>{tr('Total Conduces', 'Total Delivery Notes')}</p>
                        <h3>{stats.total}</h3>
                    </div>
                    <div className={`${estilos.estadIcono} ${estilos.iconBlue}`}>
                        <ion-icon name="file-tray-full-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadInfo}>
                        <p>{tr('Generados Hoy', 'Generated Today')}</p>
                        <h3>{stats.hoy}</h3>
                    </div>
                    <div className={`${estilos.estadIcono} ${estilos.iconOrange}`}>
                        <ion-icon name="today-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadInfo}>
                        <p>{tr('Emitidos (Pend.)', 'Issued (Pending)')}</p>
                        <h3>{stats.emitidos}</h3>
                    </div>
                    <div className={`${estilos.estadIcono} ${estilos.iconYellow}`}>
                        <ion-icon name="time-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadInfo}>
                        <p>{tr('Entregados', 'Delivered')}</p>
                        <h3>{stats.entregados}</h3>
                    </div>
                    <div className={`${estilos.estadIcono} ${estilos.iconGreen}`}>
                        <ion-icon name="checkmark-done-circle-outline"></ion-icon>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar por numero, origen o cliente...', 'Search by number, source or customer...')}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>
            </div>

            {cargando ? (
                <LoadingScreen />
            ) : conduces.length === 0 ? (
                <div className={estilos.vacio}>{tr('No se encontraron conduces', 'No delivery notes found')}</div>
            ) : vistaMovil ? (
                <div className={estilos.listaMovil}>
                    {conduces.map(c => (
                        <div key={c.id} className={estilos.cardMovil}>
                            <div className={estilos.cardTop}>
                                <div className={estilos.cardInfo}>
                                    <h4 style={{ color: '#3b82f6', fontWeight: 800 }}>{c.numero_conduce}</h4>
                                    <p>{new Date(c.fecha_conduce).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</p>
                                </div>
                                <span className={`${estilos.badge} ${estilos[c.estado]}`}>
                                    {obtenerTextoEstado(c.estado, language)}
                                </span>
                            </div>
                            <div className={estilos.cardGrid}>
                                <div className={estilos.cardItem}>
                                    <label>{tr('Cliente', 'Customer')}</label>
                                    <p>{c.cliente_nombre || 'N/A'}</p>
                                </div>
                                <div className={estilos.cardItem}>
                                    <label>{tr('Origen', 'Source')}</label>
                                    <p>{obtenerTextoTipoOrigen(c.tipo_origen, language)} #{c.numero_origen}</p>
                                </div>
                                <div className={estilos.cardItem}>
                                    <label>{tr('Chofer', 'Driver')}</label>
                                    <p>{c.chofer || '-'}</p>
                                </div>
                                <div className={estilos.cardItem}>
                                    <label>{tr('Placa', 'Plate')}</label>
                                    <p>{c.placa || '-'}</p>
                                </div>
                            </div>
                            <div className={estilos.cardAcciones}>
                                <Link href={`/admin/conduces/${c.id}`} className={estilos.btnIcono} title={tr('Ver detalle', 'View details')}>
                                    <ion-icon name="eye-outline"></ion-icon>
                                </Link>
                                <Link href={`/admin/conduces/${c.id}/imprimir`} className={`${estilos.btnIcono} ${estilos.imprimir}`} title={tr('Imprimir', 'Print')}>
                                    <ion-icon name="print-outline"></ion-icon>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={estilos.tablaContenedor}>
                    <table className={estilos.tabla}>
                        <thead>
                            <tr>
                                <th>{tr('Numero', 'Number')}</th>
                                <th>{tr('Origen', 'Source')}</th>
                                <th>{tr('Cliente', 'Customer')}</th>
                                <th>{tr('Fecha', 'Date')}</th>
                                <th>{tr('Logistica', 'Logistics')}</th>
                                <th>{tr('Estado', 'Status')}</th>
                                <th width="120">{tr('Acciones', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conduces.map((c) => (
                                <tr key={c.id}>
                                    <td><span className={estilos.numero}>{c.numero_conduce}</span></td>
                                    <td>
                                        <div className={estilos.origenNum}>{c.numero_origen}</div>
                                        <div className={estilos.origenTipo}>{obtenerTextoTipoOrigen(c.tipo_origen, language)}</div>
                                    </td>
                                    <td>{c.cliente_nombre || 'N/A'}</td>
                                    <td>{new Date(c.fecha_conduce).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</td>
                                    <td>
                                        <div className={estilos.chofer}>{c.chofer || '-'}</div>
                                        <div className={estilos.placa}>{c.placa || '-'}</div>
                                    </td>
                                    <td>
                                        <span className={`${estilos.badge} ${estilos[c.estado]}`}>{obtenerTextoEstado(c.estado, language)}</span>
                                    </td>
                                    <td>
                                        <div className={estilos.acciones}>
                                            <Link href={`/admin/conduces/${c.id}`} title={tr('Ver detalle', 'View details')}>
                                                <ion-icon name="eye-outline"></ion-icon>
                                            </Link>
                                            <Link href={`/admin/conduces/${c.id}/imprimir`} title={tr('Imprimir', 'Print')} style={{ color: '#22c55e' }}>
                                                <ion-icon name="print-outline"></ion-icon>
                                            </Link>
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

