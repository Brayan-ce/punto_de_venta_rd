"use client"
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { listarConduces } from './servidor'
import estilos from './conduces.module.css'

export default function ListaConduces() {
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
                        <h1 className={estilos.titulo}>Conduces de Despacho</h1>
                        <p className={estilos.subtitulo}>Control de entregas y saldos de materiales</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Conduces de Despacho</h1>
                    <p className={estilos.subtitulo}>Control de entregas y saldos de materiales</p>
                </div>
                <Link href="/admin/conduces/nuevo" className={estilos.btnNuevo}>
                    <ion-icon name="basket-outline"></ion-icon>
                    <span>Nuevo Conduce</span>
                </Link>
            </div>

            {/* Stats Bar */}
            <div className={estilos.estadisticas}>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadInfo}>
                        <p>Total Conduces</p>
                        <h3>{stats.total}</h3>
                    </div>
                    <div className={`${estilos.estadIcono} ${estilos.iconBlue}`}>
                        <ion-icon name="file-tray-full-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadInfo}>
                        <p>Generados Hoy</p>
                        <h3>{stats.hoy}</h3>
                    </div>
                    <div className={`${estilos.estadIcono} ${estilos.iconOrange}`}>
                        <ion-icon name="today-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadInfo}>
                        <p>Emitidos (Pend.)</p>
                        <h3>{stats.emitidos}</h3>
                    </div>
                    <div className={`${estilos.estadIcono} ${estilos.iconYellow}`}>
                        <ion-icon name="time-outline"></ion-icon>
                    </div>
                </div>
                <div className={estilos.estadCard}>
                    <div className={estilos.estadInfo}>
                        <p>Entregados</p>
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
                        placeholder="Buscar por número, origen o cliente..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>Cargando despachos...</div>
            ) : conduces.length === 0 ? (
                <div className={estilos.vacio}>No se encontraron conduces</div>
            ) : vistaMovil ? (
                <div className={estilos.listaMovil}>
                    {conduces.map(c => (
                        <div key={c.id} className={estilos.cardMovil}>
                            <div className={estilos.cardTop}>
                                <div className={estilos.cardInfo}>
                                    <h4 style={{ color: '#3b82f6', fontWeight: 800 }}>{c.numero_conduce}</h4>
                                    <p>{new Date(c.fecha_conduce).toLocaleDateString()}</p>
                                </div>
                                <span className={`${estilos.badge} ${estilos[c.estado]}`}>
                                    {c.estado}
                                </span>
                            </div>
                            <div className={estilos.cardGrid}>
                                <div className={estilos.cardItem}>
                                    <label>Cliente</label>
                                    <p>{c.cliente_nombre || 'N/A'}</p>
                                </div>
                                <div className={estilos.cardItem}>
                                    <label>Origen</label>
                                    <p>{c.tipo_origen} #{c.numero_origen}</p>
                                </div>
                                <div className={estilos.cardItem}>
                                    <label>Chofer</label>
                                    <p>{c.chofer || '-'}</p>
                                </div>
                                <div className={estilos.cardItem}>
                                    <label>Placa</label>
                                    <p>{c.placa || '-'}</p>
                                </div>
                            </div>
                            <div className={estilos.cardAcciones}>
                                <Link href={`/admin/conduces/${c.id}`} className={estilos.btnIcono} title="Ver detalle">
                                    <ion-icon name="eye-outline"></ion-icon>
                                </Link>
                                <Link href={`/admin/conduces/${c.id}/imprimir`} className={`${estilos.btnIcono} ${estilos.imprimir}`} title="Imprimir">
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
                                <th>Número</th>
                                <th>Origen</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Logística</th>
                                <th>Estado</th>
                                <th width="120">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conduces.map((c) => (
                                <tr key={c.id}>
                                    <td><span className={estilos.numero}>{c.numero_conduce}</span></td>
                                    <td>
                                        <div className={estilos.origenNum}>{c.numero_origen}</div>
                                        <div className={estilos.origenTipo}>{c.tipo_origen}</div>
                                    </td>
                                    <td>{c.cliente_nombre || 'N/A'}</td>
                                    <td>{new Date(c.fecha_conduce).toLocaleDateString()}</td>
                                    <td>
                                        <div className={estilos.chofer}>{c.chofer || '-'}</div>
                                        <div className={estilos.placa}>{c.placa || '-'}</div>
                                    </td>
                                    <td>
                                        <span className={`${estilos.badge} ${estilos[c.estado]}`}>{c.estado}</span>
                                    </td>
                                    <td>
                                        <div className={estilos.acciones}>
                                            <Link href={`/admin/conduces/${c.id}`} title="Ver Detalle">
                                                <ion-icon name="eye-outline"></ion-icon>
                                            </Link>
                                            <Link href={`/admin/conduces/${c.id}/imprimir`} title="Imprimir" style={{ color: '#22c55e' }}>
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

