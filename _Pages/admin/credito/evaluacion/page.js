"use client"

import { useState, useEffect } from 'react'
import estilos from '../credito.module.css'
import { buscarClienteParaEvaluacion, evaluarOtorgamientoCredito } from './servidor'

export default function EvaluacionRapida() {
    const [tema, setTema] = useState('light')
    const [busqueda, setBusqueda] = useState('')
    const [clientes, setClientes] = useState([])
    const [buscando, setBuscando] = useState(false)
    const [evaluando, setEvaluando] = useState(false)
    const [resultado, setResultado] = useState(null)
    const [montoSolicitado, setMontoSolicitado] = useState('')

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

    const manejarBusqueda = async (e) => {
        const valor = e.target.value
        setBusqueda(valor)

        if (valor.trim().length < 2) {
            setClientes([])
            return
        }

        setBuscando(true)
        try {
            const res = await buscarClienteParaEvaluacion(valor)
            if (res.success) {
                setClientes(res.clientes)
            }
        } catch (error) {
            console.error('Error al buscar:', error)
        } finally {
            setBuscando(false)
        }
    }

    const manejarSeleccionCliente = async (cliente) => {
        setBusqueda(`${cliente.nombre_completo} (${cliente.numero_documento})`)
        setClientes([])
        setEvaluando(true)

        try {
            const monto = montoSolicitado ? parseFloat(montoSolicitado) : 0
            const res = await evaluarOtorgamientoCredito(cliente.id, monto)

            if (res.success) {
                setResultado(res)
            } else {
                alert(res.mensaje)
            }
        } catch (error) {
            console.error('Error al evaluar:', error)
            alert('Error al evaluar cliente')
        } finally {
            setEvaluando(false)
        }
    }

    const limpiarEvaluacion = () => {
        setBusqueda('')
        setResultado(null)
        setMontoSolicitado('')
        setClientes([])
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(monto || 0)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* HEADER */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>⚡ Evaluación Rápida de Crédito</h1>
                    <p className={estilos.subtitulo}>Depuración instantánea para punto de venta</p>
                </div>
                {resultado && (
                    <button className={estilos.btnSecondary} onClick={limpiarEvaluacion}>
                        <ion-icon name="refresh-outline" style={{ marginRight: '8px' }}></ion-icon>
                        Nueva Evaluación
                    </button>
                )}
            </div>

            {/* FORMULARIO DE BÚSQUEDA */}
            {!resultado && (
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{
                        background: 'var(--bg-primary)',
                        padding: '32px',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: 'var(--text-primary)'
                            }}>
                                Buscar Cliente (Cédula, Nombre, Teléfono)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={manejarBusqueda}
                                    placeholder="Ej: 001234567890, Juan Pérez, 809-555-1234"
                                    style={{
                                        width: '100%',
                                        padding: '14px 14px 14px 44px',
                                        fontSize: '1rem',
                                        border: '2px solid var(--border-color)',
                                        borderRadius: '8px',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        transition: 'border-color 0.2s'
                                    }}
                                    autoFocus
                                />
                                <ion-icon
                                    name="search-outline"
                                    style={{
                                        position: 'absolute',
                                        left: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: '1.5rem',
                                        color: 'var(--text-tertiary)'
                                    }}
                                ></ion-icon>
                            </div>

                            {/* DROPDOWN DE CLIENTES */}
                            {clientes.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'var(--bg-primary)',
                                    border: '2px solid var(--border-color)',
                                    borderRadius: '8px',
                                    marginTop: '4px',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    boxShadow: 'var(--shadow-lg)',
                                    zIndex: 10
                                }}>
                                    {clientes.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => manejarSeleccionCliente(c)}
                                            style={{
                                                padding: '12px 16px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid var(--border-color)',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {c.nombre_completo}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {c.numero_documento} {c.telefono && `• ${c.telefono}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: 'var(--text-primary)'
                            }}>
                                Monto Solicitado (Opcional)
                            </label>
                            <input
                                type="number"
                                value={montoSolicitado}
                                onChange={(e) => setMontoSolicitado(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    fontSize: '1rem',
                                    border: '2px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        {buscando && (
                            <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)' }}>
                                <ion-icon name="sync-outline" style={{ animation: 'spin 2s linear infinite' }}></ion-icon>
                                {' '}Buscando...
                            </p>
                        )}

                        {evaluando && (
                            <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)' }}>
                                <ion-icon name="analytics-outline" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}></ion-icon>
                                {' '}Evaluando cliente...
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* RESULTADO DE LA EVALUACIÓN */}
            {resultado && resultado.datos && (
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {/* DECISIÓN PRINCIPAL */}
                    <div style={{
                        background: resultado.aprobado
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        padding: '40px',
                        borderRadius: '16px',
                        textAlign: 'center',
                        marginBottom: '32px',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <ion-icon
                            name={resultado.aprobado ? "checkmark-circle-outline" : "close-circle-outline"}
                            style={{ fontSize: '4rem', marginBottom: '16px' }}
                        ></ion-icon>
                        <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 12px 0' }}>
                            {resultado.aprobado ? '✅ PUEDE OTORGAR CRÉDITO' : '❌ NO PUEDE OTORGAR CRÉDITO'}
                        </h2>
                        <p style={{ fontSize: '1.125rem', margin: 0, opacity: 0.95 }}>
                            {resultado.motivo}
                        </p>
                    </div>

                    {/* INFORMACIÓN DEL CLIENTE */}
                    <div className={estilos.statsGrid}>
                        <div className={estilos.statCard}>
                            <div className={estilos.statLabel}>Cliente</div>
                            <div className={estilos.statValor} style={{ fontSize: '1.25rem' }}>
                                {resultado.datos.nombre_completo}
                            </div>
                            <p className={estilos.statSubtexto}>{resultado.datos.cliente_documento}</p>
                        </div>

                        <div className={estilos.statCard}>
                            <div className={estilos.statLabel}>Clasificación</div>
                            <div style={{ marginTop: '8px' }}>
                                <span className={estilos[`clasificacion${resultado.datos.clasificacion}`]}>
                                    {resultado.datos.clasificacion}
                                </span>
                            </div>
                            <p className={estilos.statSubtexto}>
                                Score: {resultado.datos.score_crediticio}/100
                            </p>
                        </div>

                        <div className={estilos.statCard}>
                            <div className={estilos.statLabel}>Crédito Disponible</div>
                            <div className={estilos.statValor} style={{
                                fontSize: '1.5rem',
                                color: resultado.datos.saldo_disponible > 0 ? 'var(--success-color)' : 'var(--danger-color)'
                            }}>
                                {formatearMoneda(resultado.datos.saldo_disponible)}
                            </div>
                            <p className={estilos.statSubtexto}>
                                Límite: {formatearMoneda(resultado.datos.limite_credito)}
                            </p>
                        </div>

                        <div className={estilos.statCard}>
                            <div className={estilos.statLabel}>Estado</div>
                            <div style={{ marginTop: '8px' }}>
                                <span className={`${estilos.badge} ${estilos[resultado.datos.estado_credito]}`}>
                                    {resultado.datos.estado_credito}
                                </span>
                            </div>
                            <p className={estilos.statSubtexto}>
                                {resultado.datos.total_creditos_vencidos > 0
                                    ? `${resultado.datos.total_creditos_vencidos} vencidos`
                                    : 'Sin vencimientos'}
                            </p>
                        </div>
                    </div>

                    {/* ALERTAS ACTIVAS */}
                    {resultado.datos.alertas && resultado.datos.alertas.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>
                                ⚠️ Alertas Activas
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {resultado.datos.alertas.map((alerta, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            background: 'var(--bg-primary)',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            borderLeft: `4px solid ${alerta.severidad === 'critica' ? '#ef4444' :
                                                    alerta.severidad === 'alta' ? '#f59e0b' :
                                                        alerta.severidad === 'media' ? '#3b82f6' : '#6b7280'
                                                }`
                                        }}
                                    >
                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                            {alerta.titulo}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {alerta.mensaje}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    )
}
