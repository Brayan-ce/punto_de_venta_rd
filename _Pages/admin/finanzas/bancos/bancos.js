"use client"
import { useEffect, useState } from 'react'
import {
    obtenerLibroBanco,
    crearBanco,
    crearCuentaBancaria,
    registrarMovimientoBancario,
    obtenerPendientesProveedores,
    registrarPagoProveedor
} from './servidor'
import estilos from './bancos.module.css'

const TIPOS = [['deposito', 'Depósito'], ['transferencia_recibida', 'Transferencia recibida'], ['cobro_tarjeta_credito', 'Cobro tarjeta crédito'], ['cobro_tarjeta_debito', 'Cobro tarjeta débito'], ['nota_credito', 'Nota de crédito'], ['prestamo_banco', 'Préstamo bancario'], ['cheque_emitido', 'Cheque emitido'], ['transferencia_realizada', 'Transferencia realizada'], ['retiro', 'Retiro'], ['cargo_bancario', 'Cargo bancario'], ['interes_pagado', 'Interés pagado'], ['pago_prestamo', 'Pago préstamo'], ['ajuste_interno', 'Ajuste interno']]
const inicial = { cuenta_bancaria_id: '', tipo: 'deposito', concepto: '', referencia: '', monto: '', fecha_movimiento: new Date().toISOString().slice(0, 10), notas: '' }
const pagoInicial = { cuenta_bancaria_id: '', proveedor_id: '', metodo_pago: 'transferencia', referencia: '', nota: '', fecha_pago: new Date().toISOString().slice(0, 10) }

export default function BancosAdmin() {
    const [datos, setDatos] = useState({ bancos: [], cuentas: [], movimientos: [] })
    const [form, setForm] = useState(inicial)
    const [cuenta, setCuenta] = useState({ banco_id: '', nombre: '', numero: '', tipo: 'corriente', moneda: 'DOP', saldo_inicial: '' })
    const [banco, setBanco] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [tema, setTema] = useState('light')

    const [pendientes, setPendientes] = useState({ proveedores: [], facturas: [] })
    const [pagoForm, setPagoForm] = useState(pagoInicial)
    const [montosPago, setMontosPago] = useState({})
    const [guardandoPago, setGuardandoPago] = useState(false)

    const cargar = async () => {
        const r = await obtenerLibroBanco()
        if (r.success) setDatos(r)
        else setMensaje(r.mensaje)
    }
    const cargarPendientes = async () => {
        const r = await obtenerPendientesProveedores()
        if (r.success) setPendientes({ proveedores: r.proveedores, facturas: r.facturas })
    }

    useEffect(() => {
        setTema(localStorage.getItem('tema') || 'light')
        cargar()
        cargarPendientes()
    }, [])

    const submitBanco = async e => { e.preventDefault(); const r = await crearBanco(banco); setMensaje(r.mensaje); if (r.success) { setBanco(''); cargar() } }
    const submitCuenta = async e => { e.preventDefault(); const r = await crearCuentaBancaria(cuenta); setMensaje(r.mensaje); if (r.success) { setCuenta({ banco_id: '', nombre: '', numero: '', tipo: 'corriente', moneda: 'DOP', saldo_inicial: '' }); cargar() } }
    const submitMovimiento = async e => { e.preventDefault(); const r = await registrarMovimientoBancario(form); setMensaje(r.mensaje); if (r.success) { setForm(inicial); cargar() } }

    const facturasProveedor = pendientes.facturas.filter(f => String(f.proveedor_id) === String(pagoForm.proveedor_id))
    const proveedorSeleccionado = pendientes.proveedores.find(p => String(p.id) === String(pagoForm.proveedor_id))
    const totalPago = facturasProveedor.reduce((acc, f) => acc + (Number(montosPago[f.id]) || 0), 0)

    const seleccionarProveedor = (id) => {
        const facturas = pendientes.facturas.filter(f => String(f.proveedor_id) === String(id))
        const iniciales = {}
        facturas.forEach(f => { iniciales[f.id] = f.saldo_pendiente })
        setMontosPago(iniciales)
        setPagoForm({ ...pagoForm, proveedor_id: id })
    }

    const submitPagoProveedor = async e => {
        e.preventDefault()
        if (!pagoForm.cuenta_bancaria_id) { setMensaje('Selecciona la cuenta bancaria'); return }
        if (!pagoForm.proveedor_id) { setMensaje('Selecciona el proveedor'); return }
        const pagos = facturasProveedor
            .map(f => ({ cxp_id: f.id, monto: Number(montosPago[f.id]) || 0 }))
            .filter(p => p.monto > 0)
        if (pagos.length === 0) { setMensaje('Ingresa al menos un monto a pagar'); return }

        setGuardandoPago(true)
        try {
            const r = await registrarPagoProveedor({
                ...pagoForm,
                proveedor_nombre: proveedorSeleccionado?.nombre || '',
                pagos
            })
            setMensaje(r.mensaje)
            if (r.success) {
                setPagoForm(pagoInicial)
                setMontosPago({})
                await cargar()
                await cargarPendientes()
            }
        } finally {
            setGuardandoPago(false)
        }
    }

    const moneda = (v, m = 'DOP') => new Intl.NumberFormat('es-DO', { style: 'currency', currency: m }).format(Number(v || 0))

    return <main className={`${estilos.contenedor} ${estilos[tema]}`}>
        <header><div><span className={estilos.eyebrow}>Finanzas</span><h1>Libro de Banco</h1><p>Controla entradas, salidas y disponibilidad por cuenta.</p></div></header>
        {mensaje && <div className={estilos.mensaje}>{mensaje}<button onClick={() => setMensaje('')}>×</button></div>}
        <section className={estilos.resumen}>{datos.cuentas.map(c => <article key={c.id}><span>{c.banco_nombre} · {c.nombre}</span><strong>{moneda(c.saldo_actual, c.moneda)}</strong><small>Saldo disponible</small></article>)}</section>
        <section className={estilos.grid}>
            <form className={estilos.panel} onSubmit={submitBanco}><h2>Nuevo banco</h2><input value={banco} onChange={e => setBanco(e.target.value)} placeholder="Nombre del banco" required /><button>Crear banco</button></form>
            <form className={estilos.panel} onSubmit={submitCuenta}><h2>Nueva cuenta</h2><select value={cuenta.banco_id} onChange={e => setCuenta({ ...cuenta, banco_id: e.target.value })} required><option value="">Banco</option>{datos.bancos.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}</select><input value={cuenta.nombre} onChange={e => setCuenta({ ...cuenta, nombre: e.target.value })} placeholder="Nombre de cuenta" required /><input value={cuenta.numero} onChange={e => setCuenta({ ...cuenta, numero: e.target.value })} placeholder="Número de cuenta" /><input type="number" step="0.01" value={cuenta.saldo_inicial} onChange={e => setCuenta({ ...cuenta, saldo_inicial: e.target.value })} placeholder="Saldo inicial" /><button>Crear cuenta</button></form>
            <form className={estilos.panel} onSubmit={submitMovimiento}><h2>Registrar movimiento</h2><select value={form.cuenta_bancaria_id} onChange={e => setForm({ ...form, cuenta_bancaria_id: e.target.value })} required><option value="">Cuenta bancaria</option>{datos.cuentas.map(c => <option key={c.id} value={c.id}>{c.banco_nombre} · {c.nombre}</option>)}</select><select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>{TIPOS.map(t => <option key={t[0]} value={t[0]}>{t[1]}</option>)}</select><input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Concepto" required /><input type="number" step="0.01" min="0.01" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="Monto" required /><input type="date" value={form.fecha_movimiento} onChange={e => setForm({ ...form, fecha_movimiento: e.target.value })} /><button>Guardar movimiento</button></form>
        </section>

        <section className={estilos.panel}>
            <h2>Pago a proveedor</h2>
            <p className={estilos.ayudaPanel}>Selecciona el proveedor y las facturas a pagar. El pago se descuenta del saldo de la cuenta bancaria y de las cuentas por pagar.</p>
            <form className={estilos.pagoForm} onSubmit={submitPagoProveedor}>
                <div className={estilos.pagoCampos}>
                    <label>Cuenta bancaria
                        <select value={pagoForm.cuenta_bancaria_id} onChange={e => setPagoForm({ ...pagoForm, cuenta_bancaria_id: e.target.value })} required>
                            <option value="">Selecciona cuenta</option>
                            {datos.cuentas.map(c => <option key={c.id} value={c.id}>{c.banco_nombre} · {c.nombre} ({moneda(c.saldo_actual, c.moneda)})</option>)}
                        </select>
                    </label>
                    <label>Proveedor
                        <select value={pagoForm.proveedor_id} onChange={e => seleccionarProveedor(e.target.value)} required>
                            <option value="">Selecciona proveedor</option>
                            {pendientes.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre} · {moneda(p.total_pendiente)} ({p.facturas})</option>)}
                        </select>
                    </label>
                    <label>Fecha de pago
                        <input type="date" value={pagoForm.fecha_pago} onChange={e => setPagoForm({ ...pagoForm, fecha_pago: e.target.value })} />
                    </label>
                    <label>Método
                        <select value={pagoForm.metodo_pago} onChange={e => setPagoForm({ ...pagoForm, metodo_pago: e.target.value })}>
                            <option value="transferencia">Transferencia</option>
                            <option value="cheque">Cheque</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta_debito">Tarjeta débito</option>
                            <option value="tarjeta_credito">Tarjeta crédito</option>
                            <option value="otro">Otro</option>
                        </select>
                    </label>
                    <label>Referencia
                        <input value={pagoForm.referencia} onChange={e => setPagoForm({ ...pagoForm, referencia: e.target.value })} placeholder="No. cheque / transferencia" />
                    </label>
                </div>

                {pagoForm.proveedor_id && (
                    <div className={estilos.tabla}>
                        <table>
                            <thead><tr><th>NCF</th><th>Fecha</th><th>Vence</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Pagar</th></tr></thead>
                            <tbody>
                                {facturasProveedor.length === 0 && <tr><td colSpan="7">Este proveedor no tiene facturas pendientes.</td></tr>}
                                {facturasProveedor.map(f => (
                                    <tr key={f.id}>
                                        <td>{f.ncf}</td>
                                        <td>{f.fecha_emision}</td>
                                        <td>{f.fecha_vencimiento || '—'}</td>
                                        <td>{moneda(f.monto_total)}</td>
                                        <td>{moneda(f.monto_pagado)}</td>
                                        <td>{moneda(f.saldo_pendiente)}</td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max={f.saldo_pendiente}
                                                value={montosPago[f.id] ?? ''}
                                                onChange={e => setMontosPago({ ...montosPago, [f.id]: e.target.value })}
                                                className={estilos.inputPago}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className={estilos.pagoFooter}>
                    <span>Total a pagar: <strong>{moneda(totalPago)}</strong></span>
                    <button disabled={guardandoPago || totalPago <= 0}>{guardandoPago ? 'Procesando...' : 'Registrar pago'}</button>
                </div>
            </form>
        </section>

        <section className={estilos.panel}><h2>Movimientos recientes</h2><div className={estilos.tabla}><table><thead><tr><th>Fecha</th><th>Cuenta</th><th>Tipo</th><th>Concepto</th><th>Monto</th></tr></thead><tbody>{datos.movimientos.map(m => <tr key={m.id}><td>{m.fecha_movimiento}</td><td>{m.cuenta_nombre}</td><td>{m.tipo}</td><td>{m.concepto}</td><td>{moneda(m.monto)}</td></tr>)}</tbody></table></div></section>
    </main>
}
