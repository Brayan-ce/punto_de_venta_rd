"use client"

import { useState, useEffect } from 'react'
import estilos from './pagos.module.css'
import { obtenerCuentasPorCobrar, registrarPago, obtenerHistorialPagos } from './servidor'

export default function ModalPagos({ cliente, alCerrar, tema = 'light' }) {
    const [tabActiva, setTabActiva] = useState('cuentas')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    
    // Datos
    const [cuentas, setCuentas] = useState([])
    const [historial, setHistorial] = useState([])
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)
    
    // Formulario de pago
    const [monto, setMonto] = useState('')
    const [metodoPago, setMetodoPago] = useState('efectivo')
    const [referencia, setReferencia] = useState('')
    const [notas, setNotas] = useState('')

    useEffect(() => {
        cargarDatos()
    }, [cliente.id])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resCuentas, resHistorial] = await Promise.all([
                obtenerCuentasPorCobrar({ cliente_id: cliente.id }),
                obtenerHistorialPagos({ cliente_id: cliente.id })
            ])

            if (resCuentas.success) {
                setCuentas(resCuentas.cuentas)
            }

            if (resHistorial.success) {
                setHistorial(resHistorial.pagos)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
        } finally {
            setCargando(false)
        }
    }

    const seleccionarCuenta = (cuenta) => {
        setCuentaSeleccionada(cuenta)
        setMonto(cuenta.saldoPendiente.toFixed(2))
        setMetodoPago('efectivo')
        setReferencia('')
        setNotas('')
    }

    const cancelarSeleccion = () => {
        setCuentaSeleccionada(null)
        setMonto('')
        setReferencia('')
        setNotas('')
    }

    const manejarRegistroPago = async (e) => {
        e.preventDefault()
        
        if (!cuentaSeleccionada) {
            alert('Debes seleccionar una cuenta por cobrar')
            return
        }

        setProcesando(true)
        try {
            const resultado = await registrarPago({
                cxc_id: cuentaSeleccionada.id,
                monto_pagado: parseFloat(monto),
                metodo_pago: metodoPago,
                referencia_pago: referencia,
                notas: notas
            })

            if (resultado.success) {
                alert(`✅ ${resultado.mensaje}\n\nMonto pagado: $${resultado.montoPagado.toFixed(2)}\nNuevo saldo: $${resultado.nuevoSaldo.toFixed(2)}`)
                cancelarSeleccion()
                await cargarDatos()
                alCerrar(true) // Indica que hubo cambios
            } else {
                alert(`❌ ${resultado.mensaje}`)
            }
        } catch (error) {
            console.error('Error al registrar pago:', error)
            alert('Error al procesar el pago')
        } finally {
            setProcesando(false)
        }
    }

    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(valor || 0)
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            activa: '#10b981',
            vencida: '#ef4444',
            parcial: '#f59e0b',
            pagada: '#6b7280'
        }
        return colores[estado] || '#6b7280'
    }

    const calcularTotalDeuda = () => {
        return cuentas.reduce((sum, c) => sum + c.saldoPendiente, 0)
    }

    return (
        <div className={estilos.modalOverlay} onClick={alCerrar}>
            <div className={`${estilos.modal} ${estilos[tema]}`} onClick={e => e.stopPropagation()}>
                
                {/* HEADER */}
                <div className={`${estilos.modalHeader} ${estilos[tema]}`}>
                    <div>
                        <h2>💰 Gestión de Pagos</h2>
                        <p className={estilos.subtitulo}>
                            Cliente: {cliente.nombre} {cliente.apellidos}
                        </p>
                    </div>
                    <button className={estilos.btnCerrar} onClick={alCerrar}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                {/* TABS */}
                <div className={estilos.modalBody}>
                    <div className={`${estilos.tabs} ${estilos[tema]}`}>
                        <button
                            className={`${estilos.tab} ${tabActiva === 'cuentas' ? estilos.active : ''}`}
                            onClick={() => setTabActiva('cuentas')}
                        >
                            <ion-icon name="document-text-outline"></ion-icon>
                            Cuentas Pendientes ({cuentas.length})
                        </button>
                        <button
                            className={`${estilos.tab} ${tabActiva === 'historial' ? estilos.active : ''}`}
                            onClick={() => setTabActiva('historial')}
                        >
                            <ion-icon name="time-outline"></ion-icon>
                            Historial ({historial.length})
                        </button>
                    </div>

                    {cargando ? (
                        <div className={estilos.cargando}>
                            <ion-icon name="sync-outline" className={estilos.iconoCargando}></ion-icon>
                            <p>Cargando información...</p>
                        </div>
                    ) : (
                        <>
                            {/* TAB CUENTAS PENDIENTES */}
                            {tabActiva === 'cuentas' && (
                                <div className={estilos.tabContent}>
                                    {cuentas.length === 0 ? (
                                        <div className={estilos.vacio}>
                                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                                            <h3>Sin Deudas Pendientes</h3>
                                            <p>Este cliente no tiene cuentas por cobrar activas</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Resumen */}
                                            <div className={`${estilos.resumenDeuda} ${estilos[tema]}`}>
                                                <div className={estilos.resumenItem}>
                                                    <span className={estilos.resumenLabel}>Total a Cobrar</span>
                                                    <span className={estilos.resumenValor}>
                                                        {formatearMoneda(calcularTotalDeuda())}
                                                    </span>
                                                </div>
                                                <div className={estilos.resumenItem}>
                                                    <span className={estilos.resumenLabel}>Cuentas Activas</span>
                                                    <span className={estilos.resumenValor}>{cuentas.length}</span>
                                                </div>
                                            </div>

                                            {/* Lista de cuentas */}
                                            <div className={estilos.listaCuentas}>
                                                {cuentas.map(cuenta => (
                                                    <div 
                                                        key={cuenta.id} 
                                                        className={`${estilos.cuentaCard} ${estilos[tema]} ${cuentaSeleccionada?.id === cuenta.id ? estilos.seleccionada : ''}`}
                                                        onClick={() => seleccionarCuenta(cuenta)}
                                                    >
                                                        <div className={estilos.cuentaHeader}>
                                                            <div>
                                                                <span className={estilos.cuentaNumero}>
                                                                    {cuenta.numeroFactura}
                                                                </span>
                                                                <span 
                                                                    className={estilos.estadoBadge}
                                                                    style={{ backgroundColor: obtenerColorEstado(cuenta.estadoCxc) }}
                                                                >
                                                                    {cuenta.estadoCxc}
                                                                </span>
                                                            </div>
                                                            <span className={estilos.cuentaMonto}>
                                                                {formatearMoneda(cuenta.saldoPendiente)}
                                                            </span>
                                                        </div>

                                                        <div className={estilos.cuentaInfo}>
                                                            <div className={estilos.infoItem}>
                                                                <ion-icon name="calendar-outline"></ion-icon>
                                                                <span>Vence: {formatearFecha(cuenta.fechaVencimiento)}</span>
                                                            </div>
                                                            {cuenta.diasAtraso > 0 && (
                                                                <div className={estilos.infoItem} style={{ color: '#ef4444' }}>
                                                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                                                    <span>{cuenta.diasAtraso} días de atraso</span>
                                                                </div>
                                                            )}
                                                            <div className={estilos.infoItem}>
                                                                <ion-icon name="cash-outline"></ion-icon>
                                                                <span>Total: {formatearMoneda(cuenta.montoTotal)}</span>
                                                            </div>
                                                        </div>

                                                        {cuenta.numeroAbonos > 0 && (
                                                            <div className={estilos.cuentaAbonos}>
                                                                <ion-icon name="checkmark-circle"></ion-icon>
                                                                <span>{cuenta.numeroAbonos} abono(s) realizados</span>
                                                                <span>Pagado: {formatearMoneda(cuenta.montoPagado)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Formulario de pago */}
                                            {cuentaSeleccionada && (
                                                <div className={`${estilos.formularioPago} ${estilos[tema]}`}>
                                                    <div className={estilos.formHeader}>
                                                        <h3>Registrar Pago</h3>
                                                        <button 
                                                            onClick={cancelarSeleccion}
                                                            className={estilos.btnCancelarSeleccion}
                                                        >
                                                            <ion-icon name="close-circle-outline"></ion-icon>
                                                            Cancelar
                                                        </button>
                                                    </div>

                                                    <form onSubmit={manejarRegistroPago}>
                                                        <div className={estilos.gridForm}>
                                                            <div className={estilos.grupoInput}>
                                                                <label>Monto a Pagar *</label>
                                                                <input
                                                                    type="number"
                                                                    className={`${estilos.input} ${estilos[tema]}`}
                                                                    value={monto}
                                                                    onChange={e => setMonto(e.target.value)}
                                                                    min="0.01"
                                                                    max={cuentaSeleccionada.saldoPendiente}
                                                                    step="0.01"
                                                                    required
                                                                    disabled={procesando}
                                                                />
                                                                <small>Máximo: {formatearMoneda(cuentaSeleccionada.saldoPendiente)}</small>
                                                            </div>

                                                            <div className={estilos.grupoInput}>
                                                                <label>Método de Pago *</label>
                                                                <select
                                                                    className={`${estilos.select} ${estilos[tema]}`}
                                                                    value={metodoPago}
                                                                    onChange={e => setMetodoPago(e.target.value)}
                                                                    disabled={procesando}
                                                                >
                                                                    <option value="efectivo">💵 Efectivo</option>
                                                                    <option value="transferencia">🏦 Transferencia</option>
                                                                    <option value="cheque">📝 Cheque</option>
                                                                    <option value="tarjeta">💳 Tarjeta</option>
                                                                    <option value="otro">🔄 Otro</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {['transferencia', 'cheque'].includes(metodoPago) && (
                                                            <div className={estilos.grupoInput}>
                                                                <label>Referencia / No. Cheque *</label>
                                                                <input
                                                                    type="text"
                                                                    className={`${estilos.input} ${estilos[tema]}`}
                                                                    value={referencia}
                                                                    onChange={e => setReferencia(e.target.value)}
                                                                    placeholder="Ej: TRANS-123456 o Cheque #789"
                                                                    required
                                                                    disabled={procesando}
                                                                />
                                                            </div>
                                                        )}

                                                        <div className={estilos.grupoInput}>
                                                            <label>Notas (Opcional)</label>
                                                            <textarea
                                                                className={`${estilos.textarea} ${estilos[tema]}`}
                                                                value={notas}
                                                                onChange={e => setNotas(e.target.value)}
                                                                rows="3"
                                                                placeholder="Información adicional sobre el pago..."
                                                                disabled={procesando}
                                                            ></textarea>
                                                        </div>

                                                        <div className={estilos.formFooter}>
                                                            <button
                                                                type="submit"
                                                                className={estilos.btnRegistrar}
                                                                disabled={procesando}
                                                            >
                                                                {procesando ? (
                                                                    <>
                                                                        <ion-icon name="sync-outline" className={estilos.iconoCargando}></ion-icon>
                                                                        Procesando...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                                                                        Registrar Pago
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB HISTORIAL */}
                            {tabActiva === 'historial' && (
                                <div className={estilos.tabContent}>
                                    {historial.length === 0 ? (
                                        <div className={estilos.vacio}>
                                            <ion-icon name="receipt-outline"></ion-icon>
                                            <h3>Sin Historial</h3>
                                            <p>No hay pagos registrados para este cliente</p>
                                        </div>
                                    ) : (
                                        <div className={estilos.listaHistorial}>
                                            {historial.map(pago => (
                                                <div key={pago.id} className={`${estilos.historialItem} ${estilos[tema]}`}>
                                                    <div className={estilos.historialHeader}>
                                                        <div className={estilos.historialIcono}>
                                                            <ion-icon name="checkmark-circle"></ion-icon>
                                                        </div>
                                                        <div className={estilos.historialInfo}>
                                                            <span className={estilos.historialMonto}>
                                                                {formatearMoneda(pago.montoPagado)}
                                                            </span>
                                                            <span className={estilos.historialFecha}>
                                                                {new Date(pago.fechaPago).toLocaleString('es-DO')}
                                                            </span>
                                                        </div>
                                                        <div className={estilos.historialMetodo}>
                                                            {pago.metodoPago}
                                                        </div>
                                                    </div>

                                                    <div className={estilos.historialDetalles}>
                                                        <span>Documento: {pago.numeroDocumento}</span>
                                                        {pago.referenciaPago && (
                                                            <span>Ref: {pago.referenciaPago}</span>
                                                        )}
                                                        <span>Por: {pago.registradoPor || 'Sistema'}</span>
                                                    </div>

                                                    {pago.notas && (
                                                        <div className={estilos.historialNotas}>
                                                            <ion-icon name="document-text-outline"></ion-icon>
                                                            {pago.notas}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* FOOTER */}
                <div className={`${estilos.modalFooter} ${estilos[tema]}`}>
                    <button 
                        className={`${estilos.btnCerrarModal} ${estilos[tema]}`} 
                        onClick={alCerrar}
                        disabled={procesando}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}