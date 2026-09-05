"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerCuotaPorId, actualizarMoraCuota } from './servidor'
import { obtenerDatosEmpresa } from '../../servidor'
import { useLanguage } from '../../../i18n/LanguageProvider'
import estilos from './ver.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const ESTADO_COLOR = { pendiente: 'orange', pagada: 'green', vencida: 'red', parcial: 'blue' }

export default function VerCuota({ cuotaId }) {
    const { language } = useLanguage()
    const [tema, setTema]         = useState('light')
    const [cargando, setCargando] = useState(true)
    const [data, setData]         = useState(null)
    const [error, setError]       = useState('')
    const [editMora, setEditMora] = useState(false)
    const [mora, setMora]         = useState('')
    const [guardandoMora, setGuardandoMora] = useState(false)
    const [empresa, setEmpresa] = useState(null)

    const tr = (es, en) => language === 'en' ? en : es
    const ESTADO_LABEL = { pendiente: tr('Pendiente', 'Pending'), pagada: tr('Pagada', 'Paid'), vencida: tr('Vencida', 'Overdue'), parcial: tr('Parcial', 'Partial') }
    const FRECUENCIA   = { mensual: tr('Mensual', 'Monthly'), quincenal: tr('Quincenal', 'Biweekly'), semanal: tr('Semanal', 'Weekly') }

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const fn = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', fn)
        window.addEventListener('storage', fn)
        cargarEmpresa()
        return () => { window.removeEventListener('temaChange', fn); window.removeEventListener('storage', fn) }
    }, [])

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    useEffect(() => { cargar() }, [cuotaId])

    const cargar = async () => {
        setCargando(true)
        const r = await obtenerCuotaPorId(cuotaId)
        if (r.success) {
            setData(r)
            setMora(String(r.cuota.mora || 0))
        } else setError(r.mensaje || tr('No se pudo cargar la cuota', 'Could not load installment'))
        setCargando(false)
    }

    const handleGuardarMora = async () => {
        setGuardandoMora(true)
        const r = await actualizarMoraCuota(cuotaId, mora)
        if (r.success) { setEditMora(false); cargar() }
        setGuardandoMora(false)
    }

    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'

    const fmtMoneda = (v) => new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 2 }).format(v || 0)
    const fmtFecha  = (f) => { if (!f) return '—'; return new Date(f).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { day: '2-digit', month: 'short', year: 'numeric' }) }

    const diasVencida = (fecha) => {
        if (!fecha) return 0
        const hoy  = new Date(); hoy.setHours(0,0,0,0)
        const venc = new Date(fecha)
        const diff = Math.floor((hoy - venc) / 86400000)
        return diff > 0 ? diff : 0
    }

    if (cargando) { return <LoadingScreen /> }

    if (error || !data) return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.errorPage}>
                <ion-icon name="alert-circle-outline"></ion-icon>
                <h3>{error || tr('Cuota no encontrada', 'Installment not found')}</h3>
                <Link href="/admin/cuotas" className={estilos.btnVolver}>{tr('Volver a cuotas', 'Back to installments')}</Link>
            </div>
        </div>
    )

    const { cuota, pagosAplicados, todasCuotas } = data
    const dias = diasVencida(cuota.fecha_vencimiento)
    const totalPagado = pagosAplicados.reduce((acc, p) => acc + parseFloat(p.aplicado || 0), 0)
    const posActual   = todasCuotas.findIndex(c => c.id === cuota.id)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <Link href="/admin/cuotas" className={estilos.btnVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>{tr('Cuotas', 'Installments')}</span>
                </Link>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}>
                        <ion-icon name="calendar-outline"></ion-icon>
                    </div>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Cuota', 'Installment')} #{cuota.numero}</h1>
                        <p className={estilos.subtitulo}>
                            {tr('Contrato', 'Contract')}&nbsp;
                            <Link href={`/admin/contratos/ver/${cuota.contrato_id}`} className={estilos.linkContrato}>
                                {cuota.contrato_numero}
                            </Link>
                            &nbsp;·&nbsp;{cuota.cliente_nombre}
                        </p>
                    </div>
                </div>
                <span className={`${estilos.estadoBadgeGrande} ${estilos[ESTADO_COLOR[cuota.estado]]}`}>
                    {ESTADO_LABEL[cuota.estado]}
                </span>
            </div>

            <div className={estilos.gridPrincipal}>

                <div className={estilos.columnaIzq}>

                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}><ion-icon name="cash-outline"></ion-icon> {tr('Detalle de la cuota', 'Installment details')}</h2>
                        <div className={estilos.detalleGrid}>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Monto cuota', 'Installment amount')}</span>
                                <span className={`${estilos.detalleValor} ${estilos.montoGrande}`}>{fmtMoneda(cuota.monto)}</span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Capital', 'Principal')}</span>
                                <span className={estilos.detalleValor}>{fmtMoneda(cuota.capital)}</span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Interes', 'Interest')}</span>
                                <span className={estilos.detalleValor}>{fmtMoneda(cuota.interes)}</span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Mora', 'Late fee')}</span>
                                {editMora ? (
                                    <div className={estilos.editMoraRow}>
                                        <input
                                            type="number" min="0" step="0.01"
                                            className={estilos.inputMora}
                                            value={mora}
                                            onChange={e => setMora(e.target.value)}
                                        />
                                        <button className={estilos.btnGuardarMora} onClick={handleGuardarMora} disabled={guardandoMora}>
                                            {guardandoMora ? <div className={estilos.spinnerSmInline}></div> : <ion-icon name="checkmark-outline"></ion-icon>}
                                        </button>
                                        <button className={estilos.btnCancelarMora} onClick={() => { setEditMora(false); setMora(String(cuota.mora || 0)) }}>
                                            <ion-icon name="close-outline"></ion-icon>
                                        </button>
                                    </div>
                                ) : (
                                    <div className={estilos.moraRow}>
                                        <span className={`${estilos.detalleValor} ${parseFloat(cuota.mora) > 0 ? estilos.moraRoja : ''}`}>
                                            {fmtMoneda(cuota.mora)}
                                        </span>
                                        {cuota.estado !== 'pagada' && (
                                            <button className={estilos.btnEditMora} onClick={() => setEditMora(true)} title={tr('Editar mora', 'Edit late fee')}>
                                                <ion-icon name="pencil-outline"></ion-icon>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Total con mora', 'Total with late fee')}</span>
                                <span className={`${estilos.detalleValor} ${estilos.totalConMora}`}>
                                    {fmtMoneda(parseFloat(cuota.monto) + parseFloat(cuota.mora || 0))}
                                </span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Total pagado', 'Total paid')}</span>
                                <span className={`${estilos.detalleValor} ${estilos.verde}`}>{fmtMoneda(totalPagado)}</span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Vencimiento', 'Due date')}</span>
                                <span className={`${estilos.detalleValor} ${cuota.estado === 'vencida' ? estilos.rojo : ''}`}>
                                    {fmtFecha(cuota.fecha_vencimiento)}
                                </span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Fecha de pago', 'Payment date')}</span>
                                <span className={estilos.detalleValor}>{fmtFecha(cuota.fecha_pago)}</span>
                            </div>
                            {dias > 0 && cuota.estado !== 'pagada' && (
                                <div className={`${estilos.detalleItem} ${estilos.colSpan2}`}>
                                    <span className={estilos.detalleLabel}>{tr('Dias vencida', 'Days overdue')}</span>
                                    <span className={`${estilos.detalleValor} ${estilos.rojo}`}>{dias} {tr('dias', 'days')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}><ion-icon name="person-outline"></ion-icon> {tr('Cliente', 'Customer')}</h2>
                        <div className={estilos.clienteCard}>
                            <div className={estilos.clienteAvatar}>{cuota.cliente_nombre?.charAt(0)}</div>
                            <div>
                                <Link href={`/admin/clientes/ver/${cuota.cliente_id}`} className={estilos.clienteNombreLink}>
                                    {cuota.cliente_nombre}
                                </Link>
                                <div className={estilos.clienteDatos}>
                                    {cuota.cliente_documento && <span><ion-icon name="card-outline"></ion-icon>{cuota.cliente_documento}</span>}
                                    {cuota.cliente_telefono  && <span><ion-icon name="call-outline"></ion-icon>{cuota.cliente_telefono}</span>}
                                    {cuota.cliente_email     && <span><ion-icon name="mail-outline"></ion-icon>{cuota.cliente_email}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}><ion-icon name="documents-outline"></ion-icon> {tr('Contrato', 'Contract')}</h2>
                        <div className={estilos.detalleGrid}>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Numero', 'Number')}</span>
                                <Link href={`/admin/contratos/ver/${cuota.contrato_id}`} className={estilos.linkContrato}>
                                    {cuota.contrato_numero}
                                </Link>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Plan', 'Plan')}</span>
                                <span className={estilos.detalleValor}>{cuota.plan_nombre}</span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Frecuencia', 'Frequency')}</span>
                                <span className={estilos.detalleValor}>{FRECUENCIA[cuota.frecuencia] || cuota.frecuencia}</span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Plazo', 'Term')}</span>
                                <span className={estilos.detalleValor}>{cuota.contrato_meses} {tr('cuotas', 'installments')}</span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Tasa interes', 'Interest rate')}</span>
                                <span className={estilos.detalleValor}>{cuota.tasa_interes}%</span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Mora plan', 'Plan late fee')}</span>
                                <span className={estilos.detalleValor}>{cuota.mora_pct}% · {cuota.dias_gracia}{tr('d gracia', 'd grace')}</span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Saldo pendiente', 'Outstanding balance')}</span>
                                <span className={`${estilos.detalleValor} ${estilos.rojo}`}>{fmtMoneda(cuota.saldo_pendiente)}</span>
                            </div>
                            <div className={estilos.detalleItem}>
                                <span className={estilos.detalleLabel}>{tr('Vigencia', 'Term period')}</span>
                                <span className={estilos.detalleValor}>{fmtFecha(cuota.fecha_inicio)} — {fmtFecha(cuota.fecha_fin)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={estilos.columnaDer}>

                    {pagosAplicados.length > 0 && (
                        <div className={estilos.card}>
                            <h2 className={estilos.cardTitulo}><ion-icon name="receipt-outline"></ion-icon> {tr('Pagos aplicados', 'Applied payments')}</h2>
                            <div className={estilos.pagosLista}>
                                {pagosAplicados.map(p => (
                                    <div key={p.id} className={estilos.pagoRow}>
                                        <div className={estilos.pagoIcono}>
                                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                                        </div>
                                        <div className={estilos.pagoInfo}>
                                            <span className={estilos.pagoFecha}>{fmtFecha(p.fecha)}</span>
                                            <span className={estilos.pagoMeta}>
                                                {p.metodo_pago || tr('Sin metodo', 'No method')}{p.referencia ? ` · ${p.referencia}` : ''}
                                            </span>
                                            {p.usuario_nombre && <span className={estilos.pagoUsuario}>{tr('Por:', 'By:')} {p.usuario_nombre}</span>}
                                            {p.notas && <span className={estilos.pagoNotas}>{p.notas}</span>}
                                        </div>
                                        <div className={estilos.pagoMontos}>
                                            <span className={estilos.pagoAplicado}>{fmtMoneda(p.aplicado)}</span>
                                            <span className={estilos.pagoTotal}>{tr('Pago total:', 'Total payment:')} {fmtMoneda(p.pago_total)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}><ion-icon name="list-outline"></ion-icon> {tr('Todas las cuotas del contrato', 'All contract installments')}</h2>
                        <div className={estilos.cuotasLista}>
                            {todasCuotas.map(c => (
                                <Link
                                    key={c.id}
                                    href={`/admin/cuotas/ver/${c.id}`}
                                    className={`${estilos.cuotaRow} ${c.id === cuota.id ? estilos.cuotaActual : ''}`}
                                >
                                    <span className={estilos.cuotaNum}>#{c.numero}</span>
                                    <span className={estilos.cuotaFecha}>{fmtFecha(c.fecha_vencimiento)}</span>
                                    <span className={estilos.cuotaMonto}>{fmtMoneda(parseFloat(c.monto) + parseFloat(c.mora || 0))}</span>
                                    <span className={`${estilos.cuotaEstado} ${estilos[ESTADO_COLOR[c.estado]]}`}>
                                        {ESTADO_LABEL[c.estado]}
                                    </span>
                                </Link>
                            ))}
                        </div>
                        <div className={estilos.cuotasResumen}>
                            <span>{todasCuotas.filter(c => c.estado === 'pagada').length} {tr('pagadas', 'paid')}</span>
                            <span>{todasCuotas.filter(c => c.estado === 'pendiente').length} {tr('pendientes', 'pending')}</span>
                            <span className={estilos.rojo}>{todasCuotas.filter(c => c.estado === 'vencida').length} {tr('vencidas', 'overdue')}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}