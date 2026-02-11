"use client"

import { useState, useEffect } from 'react'
import estilos from '../credito.module.css'
import { obtenerAlertas, actualizarEstadoAlerta } from './servidor'

export default function GestionAlertas() {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [alertas, setAlertas] = useState([])
    const [filtroEstado, setFiltroEstado] = useState('activa')
    const [filtroSeveridad, setFiltroSeveridad] = useState('')

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
        cargarAlertas()
    }, [filtroEstado, filtroSeveridad])

    const cargarAlertas = async () => {
        setCargando(true)
        try {
            const res = await obtenerAlertas({
                estado: filtroEstado,
                severidad: filtroSeveridad
            })

            if (res.success) {
                setAlertas(res.alertas)
            }
        } catch (error) {
            console.error('Error al cargar alertas:', error)
        } finally {
            setCargando(false)
        }
    }

    const manejarAccion = async (alertaId, nuevoEstado) => {
        try {
            const res = await actualizarEstadoAlerta(alertaId, nuevoEstado)

            if (res.success) {
                cargarAlertas()
            } else {
                alert(res.mensaje)
            }
        } catch (error) {
            console.error('Error al actualizar alerta:', error)
        }
    }

    const getSeveridadColor = (severidad) => {
        switch (severidad) {
            case 'critica': return '#ef4444'
            case 'alta': return '#f59e0b'
            case 'media': return '#3b82f6'
            case 'baja': return '#6b7280'
            default: return '#6b7280'
        }
    }

    const getSeveridadIcon = (severidad) => {
        switch (severidad) {
            case 'critica': return 'alert-circle'
            case 'alta': return 'warning'
            case 'media': return 'information-circle'
            case 'baja': return 'help-circle'
            default: return 'information-circle'
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* HEADER */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>🔔 Alertas de Crédito</h1>
                    <p className={estilos.subtitulo}>Gestión de alertas y notificaciones del sistema</p>
                </div>
            </div>

            {/* FILTROS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '2px solid var(--border-color)',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                >
                    <option value="activa">Activas</option>
                    <option value="vista">Vistas</option>
                    <option value="resuelta">Resueltas</option>
                    <option value="">Todas</option>
                </select>

                <select
                    value={filtroSeveridad}
                    onChange={(e) => setFiltroSeveridad(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '2px solid var(--border-color)',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                >
                    <option value="">Todas las severidades</option>
                    <option value="critica">Crítica</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                </select>

                <button
                    onClick={cargarAlertas}
                    className={estilos.btnPrimary}
                >
                    <ion-icon name="refresh-outline" style={{ marginRight: '8px' }}></ion-icon>
                    Actualizar
                </button>
            </div>

            {/* LISTA DE ALERTAS */}
            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="sync-outline" style={{ animation: 'spin 2s linear infinite' }}></ion-icon>
                    <p>Cargando alertas...</p>
                </div>
            ) : alertas.length === 0 ? (
                <div className={estilos.cargando}>
                    <ion-icon name="checkmark-circle-outline" style={{ fontSize: '4rem', color: 'var(--success-color)' }}></ion-icon>
                    <p style={{ color: 'var(--text-secondary)' }}>No hay alertas que mostrar</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alertas.map(alerta => (
                        <div
                            key={alerta.id}
                            style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '12px',
                                padding: '20px',
                                borderLeft: `4px solid ${getSeveridadColor(alerta.severidad)}`,
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <ion-icon
                                        name={`${getSeveridadIcon(alerta.severidad)}-outline`}
                                        style={{
                                            fontSize: '2rem',
                                            color: getSeveridadColor(alerta.severidad)
                                        }}
                                    ></ion-icon>
                                    <div>
                                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                                            {alerta.titulo}
                                        </h4>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                            {new Date(alerta.fecha_generacion).toLocaleString()} •{' '}
                                            <span style={{ color: getSeveridadColor(alerta.severidad), fontWeight: '600', textTransform: 'uppercase' }}>
                                                {alerta.severidad}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {alerta.estado === 'activa' && (
                                        <>
                                            <button
                                                onClick={() => manejarAccion(alerta.id, 'vista')}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '0.75rem',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--bg-tertiary)',
                                                    color: 'var(--text-primary)',
                                                    cursor: 'pointer',
                                                    transition: 'opacity 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                                            >
                                                Marcar Vista
                                            </button>
                                            <button
                                                onClick={() => manejarAccion(alerta.id, 'resuelta')}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '0.75rem',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--success-color)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    transition: 'opacity 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                                            >
                                                Resolver
                                            </button>
                                        </>
                                    )}
                                    {alerta.estado === 'vista' && (
                                        <button
                                            onClick={() => manejarAccion(alerta.id, 'resuelta')}
                                            className={estilos.btnSuccess}
                                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                        >
                                            Resolver
                                        </button>
                                    )}
                                    {alerta.estado === 'resuelta' && (
                                        <span style={{
                                            padding: '6px 12px',
                                            fontSize: '0.75rem',
                                            borderRadius: '6px',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            color: 'var(--success-color)',
                                            fontWeight: '600'
                                        }}>
                                            ✓ Resuelta
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                                {alerta.mensaje}
                            </p>

                            {alerta.cliente_nombre && (
                                <div style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--text-tertiary)',
                                    padding: '8px 12px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '6px'
                                }}>
                                    <ion-icon name="person-outline" style={{ marginRight: '6px' }}></ion-icon>
                                    Cliente: <strong>{alerta.cliente_nombre}</strong> ({alerta.cliente_documento})
                                </div>
                            )}
                        </div>
                    ))}
                </div>
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
