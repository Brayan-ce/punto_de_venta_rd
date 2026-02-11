"use client"

import { useState } from 'react'
import estilos from './cxc.module.css'
import { registrarAbono } from '../../clientes/credito/servidor'

export default function ModalAbono({ cxc, alCerrar, alCompletar, tema = 'light' }) {
    const [monto, setMonto] = useState(cxc.saldo_pendiente)
    const [metodoPago, setMetodoPago] = useState('efectivo')
    const [referencia, setReferencia] = useState('')
    const [notas, setNotas] = useState('')
    const [procesando, setProcesando] = useState(false)

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (parseFloat(monto) <= 0) {
            alert('El monto debe ser mayor a 0')
            return
        }

        if (parseFloat(monto) > parseFloat(cxc.saldo_pendiente)) {
            alert('El monto no puede superar el saldo pendiente')
            return
        }

        setProcesando(true)
        try {
            const res = await registrarAbono({
                cxc_id: cxc.id,
                monto: parseFloat(monto),
                metodo_pago: metodoPago,
                referencia,
                notas
            })

            if (res.success) {
                alert(res.mensaje)
                alCompletar()
            } else {
                alert(res.mensaje)
            }
        } catch (error) {
            console.error('Error al registrar abono:', error)
            alert('Error al procesar el pago')
        } finally {
            setProcesando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(monto)
    }

    return (
        <div className={estilos.modalOverlay} onClick={alCerrar}>
            <div
                className={`${estilos.modalAbono} ${estilos[tema]}`}
                onClick={e => e.stopPropagation()}
                style={{
                    background: tema === 'light' ? 'white' : '#1e293b',
                    padding: '30px',
                    borderRadius: '20px',
                    width: '100%',
                    maxWwidth: '500px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Registrar Abono</h2>
                    <button onClick={alCerrar} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <div style={{ marginBottom: '20px', padding: '15px', background: tema === 'light' ? '#f8fafc' : '#0f172a', borderRadius: '12px' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#64748b' }}>Cliente</p>
                    <p style={{ margin: 0, fontWeight: '700' }}>{cxc.cliente_nombre}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <span>Deuda Total: <b>{formatearMoneda(cxc.monto_total)}</b></span>
                        <span>Saldo: <b style={{ color: '#ef4444' }}>{formatearMoneda(cxc.saldo_pendiente)}</b></span>
                    </div>
                </div>

                <form onSubmit={manejarSubmit}>
                    <div className={estilos.grupoInput} style={{ marginBottom: '15px' }}>
                        <label>Monto a Pagar (DOP)</label>
                        <input
                            type="number"
                            className={estilos.inputBusqueda}
                            style={{ paddingLeft: '16px' }}
                            value={monto}
                            onChange={e => setMonto(e.target.value)}
                            max={cxc.saldo_pendiente}
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className={estilos.grupoInput} style={{ marginBottom: '15px' }}>
                        <label>Método de Pago</label>
                        <select
                            className={estilos.selectFiltro}
                            style={{ width: '100%' }}
                            value={metodoPago}
                            onChange={e => setMetodoPago(e.target.value)}
                        >
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta_debito">Tarjeta Débito</option>
                            <option value="tarjeta_credito">Tarjeta Crédito</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>

                    <div className={estilos.grupoInput} style={{ marginBottom: '15px' }}>
                        <label>Referencia (opcional)</label>
                        <input
                            type="text"
                            className={estilos.inputBusqueda}
                            style={{ paddingLeft: '16px' }}
                            placeholder="No. de cheque o transferencia"
                            value={referencia}
                            onChange={e => setReferencia(e.target.value)}
                        />
                    </div>

                    <div className={estilos.grupoInput} style={{ marginBottom: '20px' }}>
                        <label>Notas</label>
                        <textarea
                            className={estilos.inputBusqueda}
                            style={{ paddingLeft: '16px', height: '80px', resize: 'none', paddingTop: '10px' }}
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className={estilos.btnAbonar}
                        style={{ width: '100%', padding: '15px', fontSize: '16px' }}
                        disabled={procesando}
                    >
                        {procesando ? 'Procesando...' : 'Confirmar Pago'}
                    </button>
                </form>
            </div>
        </div>
    )
}
