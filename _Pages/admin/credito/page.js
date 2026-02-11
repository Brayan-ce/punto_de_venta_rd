"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import estilos from './credito.module.css'
import {
    obtenerEstadisticasCredito,
    obtenerDistribucionClasificacion,
    obtenerProximosVencimientos
} from './servidor'

export default function DashboardCredito() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [estadisticas, setEstadisticas] = useState(null)
    const [distribucion, setDistribucion] = useState([])
    const [vencimientos, setVencimientos] = useState([])

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
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resEstad, resDistrib, resVenc] = await Promise.all([
                obtenerEstadisticasCredito(),
                obtenerDistribucionClasificacion(),
                obtenerProximosVencimientos()
            ])

            if (resEstad.success) setEstadisticas(resEstad.estadisticas)
            if (resDistrib.success) setDistribucion(resDistrib.distribucion)
            if (resVenc.success) setVencimientos(resVenc.vencimientos)

        } catch (error) {
            console.error('Error al cargar dashboard:', error)
        } finally {
            setCargando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(monto || 0)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="sync-outline" style={{ animation: 'spin 2s linear infinite' }}></ion-icon>
                    <p>Cargando información...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* HEADER */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>📊 Control de Crédito</h1>
                    <p className={estilos.subtitulo}>Gestión y evaluación de créditos comerciales</p>
                </div>
                <button
                    className={estilos.btnPrimary}
                    onClick={() => router.push('/admin/credito/evaluacion')}
                >
                    <ion-icon name="search-outline" style={{ marginRight: '8px' }}></ion-icon>
                    Evaluación Rápida
                </button>
            </div>

            {/* ESTADÍSTICAS PRINCIPALES */}
            {estadisticas && (
                <div className={estilos.statsGrid}>
                    <div className={estilos.statCard}>
                        <div className={estilos.statHeader}>
                            <span className={estilos.statLabel}>Total Clientes con Crédito</span>
                            <div className={`${estilos.statIcono} ${estilos.total}`}>
                                <ion-icon name="people-outline"></ion-icon>
                            </div>
                        </div>
                        <div className={estilos.statValor}>{estadisticas.totalClientes}</div>
                        <p className={estilos.statSubtexto}>Clientes activos</p>
                    </div>

                    <div className={estilos.statCard}>
                        <div className={estilos.statHeader}>
                            <span className={estilos.statLabel}>Total Crédito Otorgado</span>
                            <div className={`${estilos.statIcono} ${estilos.corriente}`}>
                                <ion-icon name="wallet-outline"></ion-icon>
                            </div>
                        </div>
                        <div className={estilos.statValor}>{formatearMoneda(estadisticas.totalLimite)}</div>
                        <p className={estilos.statSubtexto}>
                            Disponible: {formatearMoneda(estadisticas.totalDisponible)}
                        </p>
                    </div>

                    <div className={estilos.statCard}>
                        <div className={estilos.statHeader}>
                            <span className={estilos.statLabel}>Por Cobrar</span>
                            <div className={`${estilos.statIcono} ${estilos.alerta}`}>
                                <ion-icon name="cash-outline"></ion-icon>
                            </div>
                        </div>
                        <div className={estilos.statValor}>{formatearMoneda(estadisticas.totalPendiente)}</div>
                        <p className={estilos.statSubtexto}>{estadisticas.totalCuentas} facturas activas</p>
                    </div>

                    <div className={estilos.statCard}>
                        <div className={estilos.statHeader}>
                            <span className={estilos.statLabel}>Saldo Vencido</span>
                            <div className={`${estilos.statIcono} ${estilos.vencido}`}>
                                <ion-icon name="alert-circle-outline"></ion-icon>
                            </div>
                        </div>
                        <div className={estilos.statValor} style={{ color: '#ef4444' }}>
                            {formatearMoneda(estadisticas.totalVencido)}
                        </div>
                        <p className={estilos.statSubtexto}>Requiere atención inmediata</p>
                    </div>
                </div>
            )}

            {/* DISTRIBUCIÓN POR CLASIFICACIÓN */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Distribución por Clasificación
                </h3>
                <div className={estilos.statsGrid}>
                    {distribucion.map(d => (
                        <div key={d.clasificacion} className={estilos.statCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={estilos[`clasificacion${d.clasificacion}`]}>
                                    Clase {d.clasificacion}
                                </span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    {d.cantidad}
                                </span>
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <div>Límite: {formatearMoneda(d.limiteTotal)}</div>
                                <div>Utilizado: {formatearMoneda(d.utilizadoTotal)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PRÓXIMOS VENCIMIENTOS */}
            <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Próximos Vencimientos (7 días)
                </h3>
                <div className={estilos.tabla}>
                    {vencimientos.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            No hay vencimientos próximos
                        </p>
                    ) : (
                        <>
                            <div className={estilos.tablaHeader}>
                                <div>Cliente</div>
                                <div>Factura</div>
                                <div>Vencimiento</div>
                                <div>Días Rest.</div>
                                <div style={{ textAlign: 'right' }}>Saldo</div>
                            </div>
                            <div className={estilos.tablaBody}>
                                {vencimientos.map(v => (
                                    <div key={v.id} className={estilos.fila}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{v.clienteNombre}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                {v.clienteDoc}
                                            </div>
                                        </div>
                                        <div>{v.numeroDocumento}</div>
                                        <div>{new Date(v.fechaVencimiento).toLocaleDateString()}</div>
                                        <div>
                                            <span className={estilos.badge} style={{
                                                background: v.diasRestantes <= 2 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: v.diasRestantes <= 2 ? '#ef4444' : '#f59e0b'
                                            }}>
                                                {v.diasRestantes} días
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right', fontWeight: '600' }}>
                                            {formatearMoneda(v.saldoPendiente)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
