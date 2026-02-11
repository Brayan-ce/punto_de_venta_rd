"use client"

import { useState, useEffect } from 'react'
import estilos from './cxc.module.css'
import { obtenerCuentasPorCobrar } from '../../clientes/credito/servidor'
import ModalAbono from './ModalAbono'

export default function CuentasPorCobrar() {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [cuentas, setCuentas] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')

    const [mostrarModalAbono, setMostrarModalAbono] = useState(false)
    const [cxcSeleccionada, setCxcSeleccionada] = useState(null)

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        return () => window.removeEventListener('temaChange', manejarCambioTema)
    }, [])

    useEffect(() => {
        cargarCuentas()
    }, [filtroEstado])

    const cargarCuentas = async () => {
        setCargando(true)
        try {
            const res = await obtenerCuentasPorCobrar({ estado: filtroEstado })
            if (res.success) {
                setCuentas(res.cuentas)
            }
        } catch (error) {
            console.error('Error al cargar CxC:', error)
        } finally {
            setCargando(false)
        }
    }

    const abrirModalAbono = (cxc) => {
        setCxcSeleccionada(cxc)
        setMostrarModalAbono(true)
    }

    const manejarAbonoCompletado = () => {
        setMostrarModalAbono(false)
        setCxcSeleccionada(null)
        cargarCuentas()
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(monto)
    }

    const calcularTotales = () => {
        const totalPendiente = cuentas.reduce((sum, c) => sum + parseFloat(c.saldo_pendiente), 0)
        const totalVencido = cuentas.filter(c => c.estado_cxc === 'vencida').reduce((sum, c) => sum + parseFloat(c.saldo_pendiente), 0)
        const proximosVencimientos = cuentas.filter(c => {
            const hoy = new Date()
            const vencimiento = new Date(c.fecha_vencimiento)
            const diffTime = vencimiento - hoy
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays >= 0 && diffDays <= 7 && c.estado_cxc !== 'vencida'
        }).length

        return { totalPendiente, totalVencido, proximosVencimientos }
    }

    const stats = calcularTotales()

    const cuentasFiltradas = cuentas.filter(c =>
        c.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.numero_documento.toLowerCase().includes(busqueda.toLowerCase())
    )

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Cuentas por Cobrar</h1>
                    <p className={estilos.subtitulo}>Gestión de deudas y recuperación de cartera</p>
                </div>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.total}`}>
                        <ion-icon name="calculator-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Pendiente</span>
                        <span className={estilos.estadValor}>{formatearMoneda(stats.totalPendiente)}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.vencido}`}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Saldo Vencido</span>
                        <span className={estilos.estadValor} style={{ color: '#ef4444' }}>{formatearMoneda(stats.totalVencido)}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.proximo}`}>
                        <ion-icon name="calendar-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Próximos 7 días</span>
                        <span className={estilos.estadValor}>{stats.proximosVencimientos} facturas</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por cliente o factura..."
                        className={estilos.inputBusqueda}
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>
                <select
                    className={estilos.selectFiltro}
                    value={filtroEstado}
                    onChange={e => setFiltroEstado(e.target.value)}
                >
                    <option value="">Todas las pendientes</option>
                    <option value="vencida">Vencidas</option>
                    <option value="activa">Corrientes (Activas)</option>
                    <option value="parcial">Con abonos parciales</option>
                </select>
            </div>

            <div className={`${estilos.tabla} ${estilos[tema]}`}>
                <div className={estilos.tablaHeader}>
                    <div>Cliente</div>
                    <div>Factura/NCF</div>
                    <div className={estilos.colHide}>Emisión</div>
                    <div>Vencimiento</div>
                    <div>Saldo Pendiente</div>
                    <div className={estilos.colHide}>Estado</div>
                    <div style={{ textAlign: 'right' }}>Acciones</div>
                </div>

                {cargando ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <ion-icon name="sync-outline" style={{ fontSize: '2rem', animation: 'spin 2s linear infinite' }}></ion-icon>
                        <p>Cargando información...</p>
                    </div>
                ) : cuentasFiltradas.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        No se encontraron cuentas que coincidan con los filtros.
                    </div>
                ) : (
                    <div className={estilos.tablaBody}>
                        {cuentasFiltradas.map(c => (
                            <div key={c.id} className={estilos.fila}>
                                <div>
                                    <span className={estilos.clienteNombre}>{c.cliente_nombre}</span>
                                    <span className={estilos.documento}>{c.numero_documento}</span>
                                </div>
                                <div style={{ fontSize: '14px' }}>{c.numero_documento}</div>
                                <div className={`${estilos.colHide} ${estilos.documento}`}>{new Date(c.fecha_emision).toLocaleDateString()}</div>
                                <div style={{ fontSize: '14px', color: c.estado_cxc === 'vencida' ? '#ef4444' : 'inherit' }}>
                                    {new Date(c.fecha_vencimiento).toLocaleDateString()}
                                </div>
                                <div className={estilos.saldo}>{formatearMoneda(c.saldo_pendiente)}</div>
                                <div className={estilos.colHide}>
                                    <span className={`${estilos.badge} ${estilos[c.estado_cxc]}`}>
                                        {c.estado_cxc}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <button
                                        className={estilos.btnAbonar}
                                        onClick={() => abrirModalAbono(c)}
                                    >
                                        Registrar Abono
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {mostrarModalAbono && (
                <ModalAbono
                    cxc={cxcSeleccionada}
                    alCerrar={() => setMostrarModalAbono(false)}
                    alCompletar={manejarAbonoCompletado}
                    tema={tema}
                />
            )}

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
