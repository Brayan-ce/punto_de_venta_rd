"use client"

import { useState, useEffect } from 'react'
import estilos from './credito.module.css'
import { obtenerEstadoCredito, configurarCredito, obtenerHistorialCredito } from './servidor'

export default function ModalCredito({ cliente, alCerrar, tema = 'light' }) {
    const [tabActiva, setTabActiva] = useState('resumen')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [datosCredito, setDatosCredito] = useState(null)
    const [historial, setHistorial] = useState([])

    // Estados del formulario
    const [limite, setLimite] = useState(0)
    const [frecuencia, setFrecuencia] = useState('mensual')
    const [diasPlazo, setDiasPlazo] = useState(30)

    useEffect(() => {
        cargarDatos()
    }, [cliente.id])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resEstado, resHistorial] = await Promise.all([
                obtenerEstadoCredito(cliente.id),
                obtenerHistorialCredito(cliente.id)
            ])

            if (resEstado.success && resEstado.existe) {
                setDatosCredito(resEstado.datos)
                setLimite(resEstado.datos.limite_credito)
                setFrecuencia(resEstado.datos.frecuencia_pago)
                setDiasPlazo(resEstado.datos.dias_plazo)
            }

            if (resHistorial.success) {
                setHistorial(resHistorial.historial)
            }
        } catch (error) {
            console.error('Error al cargar datos de crédito:', error)
        } finally {
            setCargando(false)
        }
    }

    const manejarGuardarConfig = async (e) => {
        e.preventDefault()
        setProcesando(true)
        try {
            const res = await configurarCredito({
                cliente_id: cliente.id,
                limite_credito: parseFloat(limite),
                frecuencia_pago: frecuencia,
                dias_plazo: parseInt(diasPlazo)
            })

            if (res.success) {
                alert(res.mensaje)
                cargarDatos()
            } else {
                alert(res.mensaje)
            }
        } catch (error) {
            console.error('Error al guardar configuración:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(monto || 0)
    }

    return (
        <div className={estilos.modalOverlay} onClick={alCerrar}>
            <div className={`${estilos.modal} ${estilos[tema]}`} onClick={e => e.stopPropagation()}>
                <div className={`${estilos.modalHeader} ${estilos[tema]}`}>
                    <div>
                        <h2>Gestión de Crédito</h2>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                            Cliente: {cliente.nombre} {cliente.apellidos}
                        </p>
                    </div>
                    <button className={estilos.btnCerrar} onClick={alCerrar}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <div className={estilos.modalBody}>
                    <div className={`${estilos.tabs} ${estilos[tema]}`}>
                        <button
                            className={`${estilos.tab} ${tabActiva === 'resumen' ? estilos.active : ''} ${estilos[tema]}`}
                            onClick={() => setTabActiva('resumen')}
                        >
                            Resumen
                        </button>
                        <button
                            className={`${estilos.tab} ${tabActiva === 'config' ? estilos.active : ''} ${estilos[tema]}`}
                            onClick={() => setTabActiva('config')}
                        >
                            Configuración
                        </button>
                        <button
                            className={`${estilos.tab} ${tabActiva === 'historial' ? estilos.active : ''} ${estilos[tema]}`}
                            onClick={() => setTabActiva('historial')}
                        >
                            Historial
                        </button>
                    </div>

                    {cargando ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <ion-icon name="sync-outline" style={{ fontSize: '2rem', animation: 'spin 2s linear infinite' }}></ion-icon>
                            <p>Cargando información...</p>
                        </div>
                    ) : (
                        <>
                            {tabActiva === 'resumen' && (
                                <div className={estilos.tabContent}>
                                    {!datosCredito ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <ion-icon name="alert-circle-outline" style={{ fontSize: '3rem', color: '#ccc' }}></ion-icon>
                                            <p>Este cliente no tiene configurado un límite de crédito.</p>
                                            <button
                                                className={estilos.btnGuardar}
                                                onClick={() => setTabActiva('config')}
                                            >
                                                Configurar Ahora
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={estilos.statusGrid}>
                                                <div className={`${estilos.statusCard} ${estilos[tema]}`}>
                                                    <span className={estilos.statusLabel}>Clasificación</span>
                                                    <span className={estilos[`clasificacion${datosCredito.clasificacion}`]}>
                                                        {datosCredito.clasificacion}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem' }}>Score: {datosCredito.score_crediticio}/100</span>
                                                </div>
                                                <div className={`${estilos.statusCard} ${estilos[tema]}`}>
                                                    <span className={estilos.statusLabel}>Estado</span>
                                                    <span className={`${estilos.badge} ${estilos[datosCredito.estado_credito]}`}>
                                                        {datosCredito.estado_credito.toUpperCase()}
                                                    </span>
                                                    {datosCredito.razon_estado && (
                                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>{datosCredito.razon_estado}</span>
                                                    )}
                                                </div>
                                                <div className={`${estilos.statusCard} ${estilos[tema]}`}>
                                                    <span className={estilos.statusLabel}>Saldo Disponible</span>
                                                    <span className={`${estilos.statusValor} ${estilos[tema]}`}>
                                                        {formatearMoneda(datosCredito.saldo_disponible)}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem' }}>
                                                        Límite: {formatearMoneda(datosCredito.limite_credito)}
                                                    </span>
                                                </div>
                                                <div className={`${estilos.statusCard} ${estilos[tema]}`}>
                                                    <span className={estilos.statusLabel}>Saldo Utilizado</span>
                                                    <span className={`${estilos.statusValor} ${estilos[tema]}`} style={{ color: '#ef4444' }}>
                                                        {formatearMoneda(datosCredito.saldo_utilizado)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '20px' }}>
                                                <h4>Información de Control</h4>
                                                <div className={estilos.statusGrid}>
                                                    <div className={`${estilos.statusCard} ${estilos[tema]}`}>
                                                        <span className={estilos.statusLabel}>Próximo Vencimiento</span>
                                                        <span className={`${estilos.statusValor} ${estilos[tema]}`} style={{ fontSize: '1rem' }}>
                                                            {datosCredito.fecha_proximo_vencimiento ? new Date(datosCredito.fecha_proximo_vencimiento).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className={`${estilos.statusCard} ${estilos[tema]}`}>
                                                        <span className={estilos.statusLabel}>Promedio Días Pago</span>
                                                        <span className={`${estilos.statusValor} ${estilos[tema]}`} style={{ fontSize: '1rem' }}>
                                                            {datosCredito.promedio_dias_pago} días
                                                        </span>
                                                    </div>
                                                    <div className={`${estilos.statusCard} ${estilos[tema]}`}>
                                                        <span className={estilos.statusLabel}>Créditos Vencidos</span>
                                                        <span className={`${estilos.statusValor} ${estilos[tema]}`} style={{ fontSize: '1rem', color: datosCredito.total_creditos_vencidos > 0 ? '#ef4444' : 'inherit' }}>
                                                            {datosCredito.total_creditos_vencidos}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {tabActiva === 'config' && (
                                <form onSubmit={manejarGuardarConfig}>
                                    <div className={estilos.gridForm}>
                                        <div className={estilos.grupoInput}>
                                            <label>Límite de Crédito (DOP)</label>
                                            <input
                                                type="number"
                                                className={`${estilos.input} ${estilos[tema]}`}
                                                value={limite}
                                                onChange={e => setLimite(e.target.value)}
                                                min="0"
                                                step="0.01"
                                                required
                                                disabled={procesando}
                                            />
                                        </div>
                                        <div className={estilos.grupoInput}>
                                            <label>Frecuencia de Pago</label>
                                            <select
                                                className={`${estilos.select} ${estilos[tema]}`}
                                                value={frecuencia}
                                                onChange={e => setFrecuencia(e.target.value)}
                                                disabled={procesando}
                                            >
                                                <option value="semanal">Semanal</option>
                                                <option value="quincenal">Quincenal</option>
                                                <option value="mensual">Mensual</option>
                                                <option value="personalizada">Personalizada</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={estilos.gridForm}>
                                        <div className={estilos.grupoInput}>
                                            <label>Días de Plazo (Configuración Personalizada)</label>
                                            <input
                                                type="number"
                                                className={`${estilos.input} ${estilos[tema]}`}
                                                value={diasPlazo}
                                                onChange={e => setDiasPlazo(e.target.value)}
                                                min="1"
                                                required
                                                disabled={procesando}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                        <button
                                            type="submit"
                                            className={estilos.btnGuardar}
                                            disabled={procesando}
                                        >
                                            {procesando ? 'Guardando...' : 'Guardar Configuración'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {tabActiva === 'historial' && (
                                <div className={estilos.historialList}>
                                    {historial.length === 0 ? (
                                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No hay eventos registrados en el historial.</p>
                                    ) : (
                                        historial.map(item => (
                                            <div key={item.id} className={`${estilos.historialItem} ${estilos[tema]}`}>
                                                <div className={estilos.histHeader}>
                                                    <span className={estilos.histTipo}>{item.tipo_evento.replace(/_/g, ' ')}</span>
                                                    <span className={estilos.histFecha}>
                                                        {new Date(item.fecha_evento).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className={`${estilos.histDesc} ${estilos[tema]}`}>{item.descripcion}</p>
                                                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                                                    Realizado por: {item.usuario_nombre || 'Sistema'}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className={`${estilos.modalFooter} ${estilos[tema]}`}>
                    <button className={`${estilos.btnCancelar} ${estilos[tema]}`} onClick={alCerrar}>
                        Cerrar
                    </button>
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
