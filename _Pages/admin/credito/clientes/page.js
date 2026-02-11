"use client"

import { useState, useEffect } from 'react'
import estilos from '../credito.module.css'
import { obtenerClientesConCredito } from './servidor'
import ModalCredito from '../../clientes/credito/ModalCredito'

export default function ListaClientesCredito() {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [clientes, setClientes] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroClasificacion, setFiltroClasificacion] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
    const [mostrarModal, setMostrarModal] = useState(false)

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
        cargarClientes()
    }, [filtroClasificacion, filtroEstado])

    const cargarClientes = async () => {
        setCargando(true)
        try {
            const res = await obtenerClientesConCredito({
                busqueda,
                clasificacion: filtroClasificacion,
                estado: filtroEstado
            })

            if (res.success) {
                setClientes(res.clientes)
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error)
        } finally {
            setCargando(false)
        }
    }

    const abrirModal = (cliente) => {
        setClienteSeleccionado(cliente)
        setMostrarModal(true)
    }

    const cerrarModal = () => {
        setMostrarModal(false)
        setClienteSeleccionado(null)
        cargarClientes()
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
                    <h1 className={estilos.titulo}>👥 Clientes con Crédito</h1>
                    <p className={estilos.subtitulo}>Gestión completa de créditos de clientes</p>
                </div>
            </div>

            {/* CONTROLES */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && cargarClientes()}
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 40px',
                            border: '2px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                    <ion-icon
                        name="search-outline"
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '1.25rem',
                            color: 'var(--text-tertiary)'
                        }}
                    ></ion-icon>
                </div>

                <select
                    value={filtroClasificacion}
                    onChange={(e) => setFiltroClasificacion(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '2px solid var(--border-color)',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                >
                    <option value="">Todas las clasificaciones</option>
                    <option value="A">A - Excelente</option>
                    <option value="B">B - Bueno</option>
                    <option value="C">C - Regular</option>
                    <option value="D">D - Moroso</option>
                </select>

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
                    <option value="">Todos los estados</option>
                    <option value="normal">Normal</option>
                    <option value="atrasado">Atrasado</option>
                    <option value="bloqueado">Bloqueado</option>
                    <option value="suspendido">Suspendido</option>
                </select>

                <button
                    onClick={cargarClientes}
                    className={estilos.btnPrimary}
                >
                    <ion-icon name="refresh-outline" style={{ marginRight: '8px' }}></ion-icon>
                    Actualizar
                </button>
            </div>

            {/* TABLA */}
            <div className={estilos.tabla}>
                {cargando ? (
                    <div className={estilos.cargando}>
                        <ion-icon name="sync-outline" style={{ animation: 'spin 2s linear infinite' }}></ion-icon>
                        <p>Cargando clientes...</p>
                    </div>
                ) : clientes.length === 0 ? (
                    <div className={estilos.cargando}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                        <p>No se encontraron clientes con crédito</p>
                    </div>
                ) : (
                    <>
                        <div className={estilos.tablaHeader}>
                            <div>Cliente</div>
                            <div>Clasificación</div>
                            <div>Estado</div>
                            <div>Límite</div>
                            <div>Disponible</div>
                            <div>Uso %</div>
                            <div style={{ textAlign: 'right' }}>Acción</div>
                        </div>
                        <div className={estilos.tablaBody}>
                            {clientes.map(cliente => {
                                const porcentajeUso = (cliente.saldo_utilizado / cliente.limite_credito * 100).toFixed(1)

                                return (
                                    <div key={cliente.credito_id} className={estilos.fila}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {cliente.nombre_completo}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                {cliente.numero_documento} • {cliente.telefono || 'Sin teléfono'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className={estilos[`clasificacion${cliente.clasificacion}`]}>
                                                {cliente.clasificacion}
                                            </span>
                                            <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-tertiary)' }}>
                                                Score: {cliente.score_crediticio}
                                            </div>
                                        </div>
                                        <div>
                                            <span className={`${estilos.badge} ${estilos[cliente.estado_credito]}`}>
                                                {cliente.estado_credito}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: '600' }}>
                                            {formatearMoneda(cliente.limite_credito)}
                                        </div>
                                        <div style={{
                                            fontWeight: '600',
                                            color: cliente.saldo_disponible > 0 ? 'var(--success-color)' : 'var(--danger-color)'
                                        }}>
                                            {formatearMoneda(cliente.saldo_disponible)}
                                        </div>
                                        <div>
                                            <div style={{
                                                width: '100%',
                                                height: '8px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(porcentajeUso, 100)}%`,
                                                    height: '100%',
                                                    background: porcentajeUso >= 90 ? '#ef4444' :
                                                        porcentajeUso >= 70 ? '#f59e0b' : '#10b981',
                                                    transition: 'width 0.3s'
                                                }}></div>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                                                {porcentajeUso}%
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => abrirModal({
                                                    id: cliente.cliente_id,
                                                    nombre: cliente.nombre_completo.split(' ')[0],
                                                    apellidos: cliente.nombre_completo.split(' ').slice(1).join(' ')
                                                })}
                                                className={estilos.btnPrimary}
                                                style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                            >
                                                <ion-icon name="settings-outline" style={{ marginRight: '4px' }}></ion-icon>
                                                Gestionar
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* MODAL DE CRÉDITO */}
            {mostrarModal && clienteSeleccionado && (
                <ModalCredito
                    cliente={clienteSeleccionado}
                    alCerrar={cerrarModal}
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
