"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerContratoPorId, actualizarEstadoContrato, obtenerDatosEmpresa } from './servidor'
import { registrarPagoCuota } from '@/_Pages/admin/pagos/servidor'
import { useLanguage } from '../../../i18n/LanguageProvider'
import estilos from './ver.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const ESTADOS = ['activo', 'pagado', 'incumplido', 'reestructurado', 'cancelado']

const ESTADO_STYLE = {
    activo:         { bg: '#d1fae5', color: '#065f46' },
    pagado:         { bg: '#dbeafe', color: '#1e40af' },
    incumplido:     { bg: '#fee2e2', color: '#991b1b' },
    reestructurado: { bg: '#fef3c7', color: '#92400e' },
    cancelado:      { bg: '#f1f5f9', color: '#475569' },
}

const CUOTA_STYLE = {
    pendiente: { bg: '#fef3c7', color: '#92400e' },
    pagada:    { bg: '#d1fae5', color: '#065f46' },
    vencida:   { bg: '#fee2e2', color: '#991b1b' },
    parcial:   { bg: '#e0f2fe', color: '#075985' },
}

export default function VerContratoFinanciamiento() {
    const { language } = useLanguage()
    const { id } = useParams()
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [contrato, setContrato] = useState(null)
    const [cuotas, setCuotas] = useState([])
    const [pagos, setPagos] = useState([])
    const [activos, setActivos] = useState([])
    const [fiadores, setFiadores] = useState([])
    const [tabActiva, setTabActiva] = useState('cuotas')

    const [modalPago, setModalPago] = useState(null)
    const [guardandoPago, setGuardandoPago] = useState(false)
    const [errorPago, setErrorPago] = useState('')
    const [formPago, setFormPago] = useState({ monto: '', referencia: '', notas: '', fecha: new Date().toISOString().split('T')[0] })
    const [simulacion, setSimulacion] = useState(null)
    const [moraPct, setMoraPct] = useState(5)

    const [modalEstado, setModalEstado] = useState(false)
    const [nuevoEstado, setNuevoEstado] = useState('')
    const [notasEstado, setNotasEstado] = useState('')
    const [guardandoEstado, setGuardandoEstado] = useState(false)
    const [empresa, setEmpresa] = useState(null)

    const tr = (es, en) => language === 'en' ? en : es
    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'
    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const trEstado = (estado) => {
        const map = {
            activo: tr('activo', 'active'),
            pagado: tr('pagado', 'paid'),
            incumplido: tr('incumplido', 'defaulted'),
            reestructurado: tr('reestructurado', 'restructured'),
            cancelado: tr('cancelado', 'cancelled'),
            pendiente: tr('pendiente', 'pending'),
            vencida: tr('vencida', 'overdue'),
            parcial: tr('parcial', 'partial'),
        }
        return map[estado] || estado
    }

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const onChange = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', onChange)
        window.addEventListener('storage', onChange)
        return () => {
            window.removeEventListener('temaChange', onChange)
            window.removeEventListener('storage', onChange)
        }
    }, [])

    useEffect(() => { if (id) cargar(); cargarEmpresa() }, [id])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    useEffect(() => {
        if (!formPago.monto || !modalPago) { setSimulacion(null); return }
        const monto = parseFloat(formPago.monto)
        if (isNaN(monto) || monto <= 0) { setSimulacion(null); return }
        const totalCuotaActual = parseFloat(modalPago.monto_restante || modalPago.monto) + parseFloat(modalPago.mora || 0)
        if (monto <= totalCuotaActual) { setSimulacion(null); return }
        const sim = simularDistribucion(monto, cuotas)
        if (sim.length > 1) setSimulacion(sim)
        else setSimulacion(null)
    }, [formPago.monto])

    const cargar = async () => {
        setCargando(true)
        const r = await obtenerContratoPorId(id)
        if (r.success) {
            setContrato(r.contrato)
            setCuotas(r.cuotas || [])
            setPagos(r.pagos || [])
            setActivos(r.activos || [])
            setFiadores(r.fiadores || [])
            setMoraPct(parseFloat(r.contrato?.mora_pct || 5))
        }
        setCargando(false)
    }

    const fmtMoneda = (v) =>
        new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 2 }).format(v || 0)

    const fmtFecha = (f) => {
        if (!f) return '—'
        const s = typeof f === 'string' ? f : f instanceof Date ? f.toISOString() : String(f)
        const [y, m, d] = s.slice(0, 10).split('-').map(Number)
        if (!y || !m || !d) return '—'
        return new Date(y, m - 1, d).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const diasVenc = (f) => {
        if (!f) return 0
        const hoy = new Date(); hoy.setHours(0,0,0,0)
        const [y,m,d] = String(f).slice(0,10).split('-').map(Number)
        const diff = Math.floor((hoy - new Date(y,m-1,d)) / 86400000)
        return diff > 0 ? diff : 0
    }

    const pct = (v, t) => (!t ? 0 : Math.min(100, (v / t) * 100).toFixed(1))

    const simularDistribucion = (monto, todasCuotas) => {
        const pendientes = todasCuotas.filter(c => ['pendiente','vencida','parcial'].includes(c.estado))
        let restante = monto
        const distribucion = []
        for (const c of pendientes) {
            if (restante <= 0) break
            const mora = parseFloat(c.mora || 0)
            const montoBase = parseFloat(c.monto_restante || c.monto)
            const total = montoBase + mora
            if (restante >= total) {
                distribucion.push({ numero: c.numero, monto: total, estado: 'pagada' })
                restante -= total
            } else {
                distribucion.push({ numero: c.numero, monto: restante, estado: 'parcial' })
                restante = 0
            }
        }
        return distribucion
    }

    const abrirModalPago = (cuota) => {
        setModalPago(cuota)
        setErrorPago('')
        setSimulacion(null)
        const montoRestante = parseFloat(cuota.monto_restante || cuota.monto)
        const mora = parseFloat(cuota.mora || 0)
        setFormPago({
            monto: (montoRestante + mora).toFixed(2),
            referencia: '',
            notas: '',
            fecha: new Date().toISOString().split('T')[0],
        })
    }

    const handleRegistrarPago = async () => {
        if (!formPago.monto || parseFloat(formPago.monto) <= 0) {
            setErrorPago(tr('El monto debe ser mayor a 0', 'Amount must be greater than 0'))
            return
        }
        setGuardandoPago(true)
        setErrorPago('')
        const r = await registrarPagoCuota(modalPago.id, { ...formPago, pago_adelantado: true })
        if (r.success) {
            setModalPago(null)
            await cargar()
            router.push(`/admin/pagos/imprimir/${r.pago_id}`)
        } else setErrorPago(r.mensaje)
        setGuardandoPago(false)
    }

    const handleCambiarEstado = async () => {
        if (!nuevoEstado) return
        setGuardandoEstado(true)
        const r = await actualizarEstadoContrato(id, nuevoEstado, notasEstado)
        if (r.success) { setModalEstado(false); cargar() }
        setGuardandoEstado(false)
    }

    if (cargando) { return <LoadingScreen /> }

    if (!contrato) return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.noEncontrado}>
                <ion-icon name="document-outline"></ion-icon>
                <h3>{tr('Contrato no encontrado', 'Contract not found')}</h3>
                <Link href="/admin/contratos" className={estilos.btnVolver}>{tr('Volver al dashboard', 'Back to dashboard')}</Link>
            </div>
        </div>
    )

    const estilo = ESTADO_STYLE[contrato.estado] || {}
    const totalCuotas = cuotas.length
    const cuotasPagadas = cuotas.filter(c => c.estado === 'pagada').length
    const totalPagar = parseFloat(contrato.total_pagar || contrato.monto_financiado || 0)
    const totalCobrado = pagos.reduce((s, p) => s + parseFloat(p.monto || 0), 0)
    const saldo = parseFloat(contrato.saldo_pendiente || 0)
    const cobrado = totalCobrado > 0 ? totalCobrado : Math.max(0, totalPagar - saldo)
    const progresoMonto = pct(cobrado, totalPagar)
    const montoTotalModal = modalPago
        ? (parseFloat(modalPago.monto_restante || modalPago.monto) + parseFloat(modalPago.mora || 0))
        : 0

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <Link href="/admin/contratos" className={estilos.btnVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>{tr('Préstamos', 'Loans')}</span>
                </Link>
                <div className={estilos.headerInfo}>
                    <div>
                        <h1 className={estilos.titulo}>{contrato.numero}</h1>
                        <p className={estilos.subtitulo}>{contrato.cliente_nombre} {contrato.cliente_apellidos || ''}</p>
                    </div>
                    <span className={estilos.estadoBadge} style={{ background: estilo.bg, color: estilo.color }}>
                        {trEstado(contrato.estado)}
                    </span>
                </div>
                <div className={estilos.headerAcciones}>
                    <button className={estilos.btnEstado} onClick={() => { setNuevoEstado(contrato.estado); setNotasEstado(''); setModalEstado(true) }}>
                        <ion-icon name="swap-horizontal-outline"></ion-icon>
                        <span>{tr('Cambiar estado', 'Change status')}</span>
                    </button>
                    <Link href={`/admin/contratos/imprimir/${id}`} className={estilos.btnImprimir}>
                        <ion-icon name="print-outline"></ion-icon>
                        <span>{tr('Imprimir', 'Print')}</span>
                    </Link>
                    <Link href={`/admin/contratos/editar/${id}`} className={estilos.btnEditar}>
                        <ion-icon name="pencil-outline"></ion-icon>
                        <span>{tr('Editar', 'Edit')}</span>
                    </Link>
                </div>
            </div>

            <div className={estilos.resumenGrid}>
                <div className={estilos.resumenCard}>
                    <span className={estilos.resumenLabel}>{tr('Total Financiado', 'Total financed')}</span>
                    <span className={estilos.resumenValor}>{fmtMoneda(contrato.monto_financiado)}</span>
                    <span className={estilos.resumenSub}>
                        {parseFloat(contrato.monto_inicial || 0) > 0
                            ? <>{tr('Pago adelantado', 'Advance payment')}: {fmtMoneda(contrato.monto_inicial)}</>
                            : <>{tr('Monto total', 'Total amount')}: {fmtMoneda(contrato.monto_total)}</>}
                    </span>
                </div>
                <div className={estilos.resumenCard}>
                    <span className={estilos.resumenLabel}>{tr('Total a Pagar', 'Total to pay')}</span>
                    <span className={estilos.resumenValor}>{fmtMoneda(contrato.total_pagar)}</span>
                    <span className={estilos.resumenSub}>{tr('Intereses', 'Interest')}: {fmtMoneda(contrato.total_intereses)}</span>
                </div>
                <div className={estilos.resumenCard}>
                    <span className={`${estilos.resumenValor} ${estilos.valorDanger}`}>{fmtMoneda(contrato.saldo_pendiente)}</span>
                    <span className={estilos.resumenLabel}>{tr('Saldo Pendiente', 'Pending balance')}</span>
                    <span className={estilos.resumenSub}>{cuotasPagadas} {tr('de', 'of')} {totalCuotas} {tr('cuotas', 'installments')}</span>
                </div>
                <div className={estilos.resumenCard}>
                    <span className={`${estilos.resumenValor} ${estilos.valorPrimary}`}>{fmtMoneda(contrato.cuota_mensual)}</span>
                    <span className={estilos.resumenLabel}>{tr('Cuota', 'Installment')} {contrato.frecuencia}</span>
                    <span className={estilos.resumenSub}>{contrato.meses} {tr('cuotas', 'installments')} · {contrato.tasa_interes}% {tr('interes', 'interest')}</span>
                </div>
            </div>

            <div className={estilos.progresoWrapper}>
                <div className={estilos.progresoInfo}>
                    <span className={estilos.progresoLabel}>{tr('Progreso de pago', 'Payment progress')}</span>
                    <span className={estilos.progresoPct}>{progresoMonto}%</span>
                </div>
                <div className={estilos.progresoBarra}>
                    <div className={estilos.progresoRelleno} style={{ width: `${progresoMonto}%` }}></div>
                </div>
                <div className={estilos.progresoDetalle}>
                    <span>{cuotasPagadas} {tr('de', 'of')} {totalCuotas} {tr('cuotas pagadas', 'paid installments')}</span>
                    <span>{fmtMoneda(cobrado)} {tr('cobrado', 'collected')}</span>
                </div>
            </div>

            <div className={estilos.infoGrid}>
                <div className={estilos.infoCard}>
                    <h3 className={estilos.infoTitulo}><ion-icon name="person-outline"></ion-icon> {tr('Cliente', 'Customer')}</h3>
                    {[
                        { l: tr('Nombre', 'Name'),    v: `${contrato.cliente_nombre} ${contrato.cliente_apellidos || ''}` },
                        { l: tr('Documento', 'Document'), v: contrato.cliente_documento },
                        { l: tr('Telefono', 'Phone'),  v: contrato.cliente_telefono },
                        { l: 'Email',     v: contrato.cliente_email },
                        { l: tr('Direccion', 'Address'), v: contrato.cliente_direccion },
                    ].filter(x => x.v).map((x, i) => (
                        <div key={i} className={estilos.infoFila}>
                            <span className={estilos.infoLabel}>{x.l}</span>
                            <span className={estilos.infoValor}>{x.v}</span>
                        </div>
                    ))}
                </div>
                <div className={estilos.infoCard}>
                    <h3 className={estilos.infoTitulo}><ion-icon name="documents-outline"></ion-icon> {tr('Préstamo', 'Loan')}</h3>
                    {[
                        { l: tr('Plan', 'Plan'),       v: contrato.plan_nombre },
                        { l: tr('Frecuencia', 'Frequency'), v: contrato.frecuencia },
                        { l: tr('Inicio', 'Start'),     v: fmtFecha(contrato.fecha_inicio) },
                        { l: tr('Fin', 'End'),        v: fmtFecha(contrato.fecha_fin) },
                        { l: tr('Vendedor', 'Seller'),   v: contrato.vendedor_nombre },
                        { l: tr('Notas', 'Notes'),      v: contrato.notas },
                    ].filter(x => x.v).map((x, i) => (
                        <div key={i} className={estilos.infoFila}>
                            <span className={estilos.infoLabel}>{x.l}</span>
                            <span className={estilos.infoValor}>{x.v}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={estilos.tabs}>
                {[
                    { key: 'cuotas', label: tr('Cuotas', 'Installments'),           icon: 'calendar-outline',         count: cuotas.length },
                    { key: 'pagos',  label: tr('Pagos', 'Payments'),            icon: 'cash-outline',             count: pagos.length },
                    { key: 'extras', label: tr('Fiador y Activos', 'Guarantor and Assets'), icon: 'shield-checkmark-outline', count: fiadores.length + activos.length },
                ].map(t => (
                    <button key={t.key} className={`${estilos.tab} ${tabActiva === t.key ? estilos.tabActiva : ''}`} onClick={() => setTabActiva(t.key)}>
                        <ion-icon name={t.icon}></ion-icon>
                        <span>{t.label}</span>
                        {t.count > 0 && <span className={estilos.tabBadge}>{t.count}</span>}
                    </button>
                ))}
            </div>

            {tabActiva === 'cuotas' && (
                <div className={estilos.tabContenido}>
                    <div className={estilos.tablaWrapper}>
                        <table className={estilos.tabla}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{tr('Vencimiento', 'Due date')}</th>
                                    <th>{tr('Cuota', 'Installment')}</th>
                                    <th>{tr('Capital', 'Principal')}</th>
                                    <th>{tr('Interes', 'Interest')}</th>
                                    <th>{tr('Mora', 'Late fee')}</th>
                                    <th>{tr('Total', 'Total')}</th>
                                    <th>{tr('Estado', 'Status')}</th>
                                    <th>{tr('Pago', 'Payment')}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cuotas.map(c => {
                                    const mora = parseFloat(c.mora || 0)
                                    const montoBase = parseFloat(c.monto_restante || c.monto)
                                    const total = montoBase + mora
                                    const cs = CUOTA_STYLE[c.estado] || {}
                                    const puedeRegistrar = ['pendiente', 'vencida', 'parcial'].includes(c.estado)
                                    const diasR = c.estado === 'vencida' ? diasVenc(c.fecha_vencimiento) : 0
                                    const esParcial = c.estado === 'parcial'
                                    return (
                                        <tr key={c.id} className={`${estilos.fila} ${c.estado === 'vencida' ? estilos.filaVencida : ''}`}>
                                            <td className={estilos.tdNum}>{c.numero}</td>
                                            <td className={estilos.tdGris}>
                                                {fmtFecha(c.fecha_vencimiento)}
                                                {diasR > 0 && <span className={estilos.diasRetraso}>{diasR}{tr('d', 'd')}</span>}
                                            </td>
                                            <td className={estilos.tdMonto}>
                                                {esParcial && c.monto_pagado ? (
                                                    <span className={estilos.montoParcialWrap}>
                                                        <span className={estilos.montoRestante}>{fmtMoneda(montoBase)}</span>
                                                        <span className={estilos.montoPagadoHint}>{tr('pagado', 'paid')} {fmtMoneda(c.monto_pagado)}</span>
                                                    </span>
                                                ) : fmtMoneda(parseFloat(c.monto))}
                                            </td>
                                            <td className={estilos.tdGris}>{fmtMoneda(c.capital)}</td>
                                            <td className={estilos.tdGris}>{fmtMoneda(c.interes)}</td>
                                            <td className={mora > 0 ? estilos.tdDanger : estilos.tdGris}>
                                                {mora > 0 ? fmtMoneda(mora) : '—'}
                                            </td>
                                            <td className={estilos.tdMonto}>{fmtMoneda(total)}</td>
                                            <td>
                                                <span className={estilos.estadoBadgeSm} style={{ background: cs.bg, color: cs.color }}>
                                                    {trEstado(c.estado)}
                                                </span>
                                            </td>
                                            <td className={estilos.tdGris}>{c.fecha_pago ? fmtFecha(c.fecha_pago) : '—'}</td>
                                            <td>
                                                <div className={estilos.accionesCuota}>
                                                    {['pagada', 'parcial'].includes(c.estado) && c.ultimo_pago_id && (
                                                        <button className={estilos.btnImprimirCuota} onClick={() => router.push(`/admin/pagos/imprimir/${c.ultimo_pago_id}`)} title={tr('Imprimir recibo', 'Print receipt')}>
                                                            <ion-icon name="print-outline"></ion-icon>
                                                        </button>
                                                    )}
                                                    {puedeRegistrar && contrato.estado === 'activo' && (
                                                        <button className={estilos.btnPagar} onClick={() => abrirModalPago(c)}>
                                                            <ion-icon name="cash-outline"></ion-icon>
                                                            <span>{tr('Pagar', 'Pay')}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tabActiva === 'pagos' && (
                <div className={estilos.tabContenido}>
                    {pagos.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="cash-outline"></ion-icon>
                            <span>{tr('No hay pagos registrados', 'No payments registered')}</span>
                        </div>
                    ) : (
                        <div className={estilos.tablaWrapper}>
                            <table className={estilos.tabla}>
                                <thead>
                                    <tr>
                                        <th>{tr('Fecha', 'Date')}</th>
                                        <th>{tr('Monto', 'Amount')}</th>
                                        <th>{tr('Capital', 'Principal')}</th>
                                        <th>{tr('Interes', 'Interest')}</th>
                                        <th>{tr('Mora', 'Late fee')}</th>
                                        <th>{tr('Metodo', 'Method')}</th>
                                        <th>{tr('Referencia', 'Reference')}</th>
                                        <th>{tr('Registrado por', 'Registered by')}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagos.map(p => (
                                        <tr key={p.id} className={estilos.fila}>
                                            <td className={estilos.tdGris}>{fmtFecha(p.fecha)}</td>
                                            <td className={estilos.tdMonto}>{fmtMoneda(p.monto)}</td>
                                            <td className={estilos.tdGris}>{fmtMoneda(p.monto_capital)}</td>
                                            <td className={estilos.tdGris}>{fmtMoneda(p.monto_interes)}</td>
                                            <td className={parseFloat(p.monto_mora) > 0 ? estilos.tdDanger : estilos.tdGris}>
                                                {parseFloat(p.monto_mora) > 0 ? fmtMoneda(p.monto_mora) : '—'}
                                            </td>
                                            <td className={estilos.tdGris}>{p.metodo_nombre || '—'}</td>
                                            <td className={estilos.tdGris}>{p.referencia || '—'}</td>
                                            <td className={estilos.tdGris}>{p.registrado_por_nombre || '—'}</td>
                                            <td>
                                                <button className={estilos.btnImprimirCuota} onClick={() => router.push(`/admin/pagos/imprimir/${p.id}`)} title={tr('Imprimir recibo', 'Print receipt')}>
                                                    <ion-icon name="print-outline"></ion-icon>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tabActiva === 'extras' && (
                <div className={estilos.tabContenido}>
                    {fiadores.length > 0 && (
                        <div className={estilos.extrasSeccion}>
                            <h3 className={estilos.extrasTitulo}>
                                <ion-icon name="shield-checkmark-outline"></ion-icon> {tr('Fiador', 'Guarantor')}
                            </h3>
                            {fiadores.map(f => (
                                <div key={f.id} className={estilos.extrasCard}>
                                    <div className={estilos.extrasGrid}>
                                        {[
                                            { l: tr('Nombre', 'Name'),    v: f.nombre },
                                            { l: tr('Cedula', 'ID'),    v: f.cedula },
                                            { l: tr('Telefono', 'Phone'),  v: f.telefono },
                                            { l: 'Email',     v: f.email },
                                            { l: tr('Direccion', 'Address'), v: f.direccion },
                                        ].filter(x => x.v).map((x, i) => (
                                            <div key={i} className={estilos.infoFila}>
                                                <span className={estilos.infoLabel}>{x.l}</span>
                                                <span className={estilos.infoValor}>{x.v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activos.length > 0 && (
                        <div className={estilos.extrasSeccion}>
                            <h3 className={estilos.extrasTitulo}>
                                <ion-icon name="cube-outline"></ion-icon> {tr('Activos / Garantias', 'Assets / Collateral')}
                            </h3>
                            <div className={estilos.activosGrid}>
                                {activos.map(a => (
                                    <div key={a.id} className={estilos.activoCard}>
                                        <div className={estilos.activoIcono}>
                                            <ion-icon name="cube-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.activoInfo}>
                                            <span className={estilos.activoNombre}>{a.nombre}</span>
                                            {a.serial && <span className={estilos.activoSub}>{tr('Serial', 'Serial')}: {a.serial}</span>}
                                            {a.descripcion && <span className={estilos.activoSub}>{a.descripcion}</span>}
                                            {parseFloat(a.valor) > 0 && <span className={estilos.activoValor}>{fmtMoneda(a.valor)}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {fiadores.length === 0 && activos.length === 0 && (
                        <div className={estilos.vacio}>
                            <ion-icon name="shield-outline"></ion-icon>
                            <span>{tr('Sin fiador ni activos registrados', 'No guarantor or assets registered')}</span>
                        </div>
                    )}
                </div>
            )}

            {modalPago && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && setModalPago(null)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3 className={estilos.modalTitulo}>
                                <ion-icon name="cash-outline"></ion-icon>
                                {tr('Registrar Pago', 'Register Payment')} — {tr('Cuota', 'Installment')} #{modalPago.numero}
                            </h3>
                            <button className={estilos.modalCerrar} onClick={() => setModalPago(null)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.modalResumen}>
                            <div className={estilos.modalResumenItem}>
                                <span>{tr('Cuota', 'Installment')}</span>
                                <strong>{fmtMoneda(modalPago.monto_restante || modalPago.monto)}</strong>
                            </div>
                            {parseFloat(modalPago.mora || 0) > 0 && (
                                <div className={estilos.modalResumenItem}>
                                    <span>{tr('Mora', 'Late fee')}</span>
                                    <strong style={{ color: '#ef4444' }}>{fmtMoneda(modalPago.mora)}</strong>
                                </div>
                            )}
                            <div className={`${estilos.modalResumenItem} ${estilos.modalResumenTotal}`}>
                                <span>{tr('Total', 'Total')}</span>
                                <strong>{fmtMoneda(montoTotalModal)}</strong>
                            </div>
                        </div>

                        {modalPago.estado === 'vencida' && (
                            <div className={estilos.alertaMora}>
                                <ion-icon name="warning-outline"></ion-icon>
                                <span>{tr('Esta cuota tiene', 'This installment has')} <strong>{diasVenc(modalPago.fecha_vencimiento)} {tr('dias', 'days')}</strong> {tr('de retraso. La mora se calcula al', 'overdue. Late fee is calculated at')} <strong>{moraPct}%</strong> {tr('mensual.', 'monthly.')}</span>
                            </div>
                        )}

                        <div className={estilos.modalCuerpo}>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Monto recibido *', 'Amount received *')}</label>
                                <div className={estilos.inputMoneda}>
                                    <span>{simboloMoneda}</span>
                                    <input
                                        type="number" min="0" step="0.01"
                                        className={estilos.input}
                                        value={formPago.monto}
                                        onChange={e => setFormPago(v => ({ ...v, monto: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Fecha de pago', 'Payment date')}</label>
                                <input
                                    type="date" className={estilos.input}
                                    value={formPago.fecha}
                                    onChange={e => setFormPago(v => ({ ...v, fecha: e.target.value }))}
                                />
                            </div>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Referencia', 'Reference')}</label>
                                <input
                                    type="text" className={estilos.input}
                                    placeholder={tr('Numero de referencia', 'Reference number')}
                                    value={formPago.referencia}
                                    onChange={e => setFormPago(v => ({ ...v, referencia: e.target.value }))}
                                />
                            </div>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Notas', 'Notes')}</label>
                                <textarea
                                    className={`${estilos.input} ${estilos.textarea}`}
                                    rows={2} placeholder={tr('Observaciones...', 'Notes...')}
                                    value={formPago.notas}
                                    onChange={e => setFormPago(v => ({ ...v, notas: e.target.value }))}
                                />
                            </div>

                            {simulacion && simulacion.length > 0 && (
                                <div className={estilos.simulacion}>
                                    <div className={estilos.simulacionTitulo}>
                                        <ion-icon name="flash-outline"></ion-icon>
                                        {tr('Distribucion automatica del pago', 'Automatic payment distribution')}
                                    </div>
                                    {simulacion.map((s, i) => (
                                        <div key={i} className={estilos.simulacionFila}>
                                            <span>{tr('Cuota', 'Installment')} #{s.numero}</span>
                                            <span className={`${estilos.simEstado} ${s.estado === 'pagada' ? estilos.simPagada : estilos.simParcial}`}>{trEstado(s.estado)}</span>
                                            <span>{fmtMoneda(s.monto)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {errorPago && (
                                <div className={estilos.errorMsg}>
                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                    {errorPago}
                                </div>
                            )}
                        </div>

                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnCancelar} onClick={() => setModalPago(null)}>{tr('Cancelar', 'Cancel')}</button>
                            <button className={estilos.btnConfirmar} onClick={handleRegistrarPago} disabled={guardandoPago}>
                                {guardandoPago
                                    ? <><div className={estilos.spinnerSm}></div>{tr('Guardando...', 'Saving...')}</>
                                    : <><ion-icon name="checkmark-circle-outline"></ion-icon>{tr('Confirmar Pago', 'Confirm Payment')}</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalEstado && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && setModalEstado(false)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3 className={estilos.modalTitulo}>
                                <ion-icon name="swap-horizontal-outline"></ion-icon>
                                {tr('Cambiar Estado', 'Change Status')}
                            </h3>
                            <button className={estilos.modalCerrar} onClick={() => setModalEstado(false)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalCuerpo}>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Nuevo estado', 'New status')}</label>
                                <select className={estilos.input} value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
                                    {ESTADOS.map(e => <option key={e} value={e}>{trEstado(e)}</option>)}
                                </select>
                            </div>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Notas (opcional)', 'Notes (optional)')}</label>
                                <textarea
                                    className={`${estilos.input} ${estilos.textarea}`}
                                    rows={3} placeholder={tr('Motivo del cambio...', 'Reason for change...')}
                                    value={notasEstado}
                                    onChange={e => setNotasEstado(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnCancelar} onClick={() => setModalEstado(false)}>{tr('Cancelar', 'Cancel')}</button>
                            <button className={estilos.btnConfirmar} onClick={handleCambiarEstado} disabled={guardandoEstado}>
                                {guardandoEstado
                                    ? <><div className={estilos.spinnerSm}></div>{tr('Guardando...', 'Saving...')}</>
                                    : <><ion-icon name="checkmark-circle-outline"></ion-icon>{tr('Confirmar', 'Confirm')}</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}