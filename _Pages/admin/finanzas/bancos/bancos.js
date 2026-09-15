"use client"
import { useEffect, useState } from 'react'
import { obtenerLibroBanco, crearBanco, crearCuentaBancaria, registrarMovimientoBancario } from './servidor'
import estilos from './bancos.module.css'

const TIPOS = [['deposito','Depósito'],['transferencia_recibida','Transferencia recibida'],['cobro_tarjeta_credito','Cobro tarjeta crédito'],['cobro_tarjeta_debito','Cobro tarjeta débito'],['nota_credito','Nota de crédito'],['prestamo_banco','Préstamo bancario'],['cheque_emitido','Cheque emitido'],['transferencia_realizada','Transferencia realizada'],['retiro','Retiro'],['cargo_bancario','Cargo bancario'],['interes_pagado','Interés pagado'],['pago_prestamo','Pago préstamo'],['ajuste_interno','Ajuste interno']]
const inicial = { cuenta_bancaria_id:'', tipo:'deposito', concepto:'', referencia:'', monto:'', fecha_movimiento:new Date().toISOString().slice(0,10), notas:'' }

export default function BancosAdmin() {
    const [datos, setDatos] = useState({ bancos:[], cuentas:[], movimientos:[] })
    const [form, setForm] = useState(inicial)
    const [cuenta, setCuenta] = useState({ banco_id:'', nombre:'', numero:'', tipo:'corriente', moneda:'DOP', saldo_inicial:'' })
    const [banco, setBanco] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [tema, setTema] = useState('light')
    const cargar = async () => { const r = await obtenerLibroBanco(); if (r.success) setDatos(r); else setMensaje(r.mensaje) }
    useEffect(() => { setTema(localStorage.getItem('tema') || 'light'); cargar() }, [])
    const submitBanco = async e => { e.preventDefault(); const r=await crearBanco(banco); setMensaje(r.mensaje); if(r.success){setBanco(''); cargar()} }
    const submitCuenta = async e => { e.preventDefault(); const r=await crearCuentaBancaria(cuenta); setMensaje(r.mensaje); if(r.success){setCuenta({ banco_id:'', nombre:'', numero:'', tipo:'corriente', moneda:'DOP', saldo_inicial:'' }); cargar()} }
    const submitMovimiento = async e => { e.preventDefault(); const r=await registrarMovimientoBancario(form); setMensaje(r.mensaje); if(r.success){setForm(inicial); cargar()} }
    const moneda = (v, m='DOP') => new Intl.NumberFormat('es-DO',{style:'currency',currency:m}).format(Number(v||0))
    return <main className={`${estilos.contenedor} ${estilos[tema]}`}>
        <header><div><span className={estilos.eyebrow}>Finanzas</span><h1>Libro de Banco</h1><p>Controla entradas, salidas y disponibilidad por cuenta.</p></div></header>
        {mensaje && <div className={estilos.mensaje}>{mensaje}<button onClick={()=>setMensaje('')}>×</button></div>}
        <section className={estilos.resumen}>{datos.cuentas.map(c=><article key={c.id}><span>{c.banco_nombre} · {c.nombre}</span><strong>{moneda(c.saldo_actual,c.moneda)}</strong><small>Saldo disponible</small></article>)}</section>
        <section className={estilos.grid}>
            <form className={estilos.panel} onSubmit={submitBanco}><h2>Nuevo banco</h2><input value={banco} onChange={e=>setBanco(e.target.value)} placeholder="Nombre del banco" required/><button>Crear banco</button></form>
            <form className={estilos.panel} onSubmit={submitCuenta}><h2>Nueva cuenta</h2><select value={cuenta.banco_id} onChange={e=>setCuenta({...cuenta,banco_id:e.target.value})} required><option value="">Banco</option>{datos.bancos.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}</select><input value={cuenta.nombre} onChange={e=>setCuenta({...cuenta,nombre:e.target.value})} placeholder="Nombre de cuenta" required/><input value={cuenta.numero} onChange={e=>setCuenta({...cuenta,numero:e.target.value})} placeholder="Número de cuenta"/><input type="number" step="0.01" value={cuenta.saldo_inicial} onChange={e=>setCuenta({...cuenta,saldo_inicial:e.target.value})} placeholder="Saldo inicial"/><button>Crear cuenta</button></form>
            <form className={estilos.panel} onSubmit={submitMovimiento}><h2>Registrar movimiento</h2><select value={form.cuenta_bancaria_id} onChange={e=>setForm({...form,cuenta_bancaria_id:e.target.value})} required><option value="">Cuenta bancaria</option>{datos.cuentas.map(c=><option key={c.id} value={c.id}>{c.banco_nombre} · {c.nombre}</option>)}</select><select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>{TIPOS.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}</select><input value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})} placeholder="Concepto" required/><input type="number" step="0.01" min="0.01" value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} placeholder="Monto" required/><input type="date" value={form.fecha_movimiento} onChange={e=>setForm({...form,fecha_movimiento:e.target.value})}/><button>Guardar movimiento</button></form>
        </section>
        <section className={estilos.panel}><h2>Movimientos recientes</h2><div className={estilos.tabla}><table><thead><tr><th>Fecha</th><th>Cuenta</th><th>Tipo</th><th>Concepto</th><th>Monto</th></tr></thead><tbody>{datos.movimientos.map(m=><tr key={m.id}><td>{m.fecha_movimiento}</td><td>{m.cuenta_nombre}</td><td>{m.tipo}</td><td>{m.concepto}</td><td>{moneda(m.monto)}</td></tr>)}</tbody></table></div></section>
    </main>
}
