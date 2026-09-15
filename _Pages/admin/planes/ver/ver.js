"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerPlanPorId, toggleActivoPlan } from './servidor'
import { obtenerDatosEmpresa } from '../servidor'
import { useLanguage } from '../../i18n/LanguageProvider'
import estilos from './ver.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const MONTOS_EJEMPLO   = [5000, 10000, 25000, 50000, 100000]

export default function VerPlan({ planId }) {
    const { language } = useLanguage()
    const [tema, setTema]         = useState('light')
    const [cargando, setCargando] = useState(true)
    const [plan, setPlan]         = useState(null)
    const [stats, setStats]       = useState(null)
    const [toggling, setToggling] = useState(false)
    const [empresa, setEmpresa] = useState(null)

    // preview interactiva
    const [montoPreview, setMontoPreview] = useState('10000')
    const [mesesPreview, setMesesPreview] = useState(12)

    const tr = (es, en) => language === 'en' ? en : es
    const FRECUENCIA_LABEL = { mensual: tr('Mensual', 'Monthly'), quincenal: tr('Quincenal', 'Biweekly'), semanal: tr('Semanal', 'Weekly') }
    const FREQ_CORTO       = { mensual: tr('mes', 'mo'), quincenal: tr('quin', 'biw'), semanal: tr('sem', 'wk') }

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const fn = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', fn)
        window.addEventListener('storage', fn)
        return () => { window.removeEventListener('temaChange', fn); window.removeEventListener('storage', fn) }
    }, [])

    useEffect(() => { cargar(); cargarEmpresa() }, [planId])

    const cargar = async () => {
        setCargando(true)
        const r = await obtenerPlanPorId(planId)
        if (r.success) { setPlan(r.plan); setStats(r.stats) }
        setCargando(false)
    }

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const localeEmpresa = empresa?.locale || 'es-DO'
    const formatearMoneda = (v) => {
        try {
            return new Intl.NumberFormat(localeEmpresa, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)
        } catch {
            return Number(v || 0).toFixed(2)
        }
    }

    const handleToggle = async () => {
        setToggling(true)
        await toggleActivoPlan(planId, !plan.activo)
        await cargar()
        setToggling(false)
    }

    // formatearMoneda definido arriba

    // Calculo de preview
    const calcPreview = (monto, meses) => {
        if (!plan || !monto || monto <= 0 || !meses || meses <= 0) return null
        const tasa        = parseFloat(plan.tasa_interes || 0) / 100
        const totalPagar  = parseFloat(monto) * (1 + tasa)
        const cuota       = totalPagar / meses
        const intereses   = totalPagar - parseFloat(monto)
        return { totalPagar, cuota, intereses }
    }

    const montoNum = parseFloat(montoPreview) || 0
    const preview  = calcPreview(montoNum, mesesPreview)
    const freqC    = plan ? (FREQ_CORTO[plan.frecuencia] || 'mes') : 'mes'

    if (cargando) { return <LoadingScreen /> }
    if (!plan) return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.noEncontrado}>
                <ion-icon name="alert-circle-outline"></ion-icon>
                <h3>{tr('Plan no encontrado', 'Plan not found')}</h3>
                <Link href="/admin/planes" className={estilos.btnVolver}>{tr('Volver a Planes', 'Back to Plans')}</Link>
            </div>
        </div>
    )

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <Link href="/admin/planes" className={estilos.btnVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>{tr('Volver', 'Back')}</span>
                </Link>
                <div className={estilos.headerMain}>
                    <div className={estilos.headerInfo}>
                        <div className={estilos.headerIcono}><ion-icon name="card-outline"></ion-icon></div>
                        <div>
                            <div className={estilos.tituloRow}>
                                <h1 className={estilos.titulo}>{plan.nombre}</h1>
                                <span className={`${estilos.estadoBadge} ${plan.activo ? estilos.estadoActivo : estilos.estadoInactivo}`}>
                                    {plan.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                                </span>
                                {plan.codigo && <span className={estilos.codigoBadge}>{plan.codigo}</span>}
                                <span className={estilos.frecBadge}>{FRECUENCIA_LABEL[plan.frecuencia]}</span>
                            </div>
                            <p className={estilos.subtitulo}>{plan.descripcion || tr('Sin descripción', 'No description')}</p>
                        </div>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button className={`${estilos.btnToggle} ${plan.activo ? estilos.btnDesactivar : estilos.btnActivar}`}
                            onClick={handleToggle} disabled={toggling}>
                            <ion-icon name={plan.activo ? 'pause-outline' : 'play-outline'}></ion-icon>
                            <span>{toggling ? tr('Aplicando...', 'Applying...') : plan.activo ? tr('Desactivar', 'Deactivate') : tr('Activar', 'Activate')}</span>
                        </button>
                        <Link href={`/admin/planes/editar/${planId}`} className={estilos.btnEditar}>
                            <ion-icon name="pencil-outline"></ion-icon>
                            <span>{tr('Editar Plan', 'Edit Plan')}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {stats && (
                <div className={estilos.statsGrid}>
                    {[
                        { label: tr('Total Contratos', 'Total Contracts'), valor: stats.total_contratos,   icon: 'document-text-outline',   color: 'blue',   tipo: 'num' },
                        { label: tr('Activos', 'Active'),          valor: stats.contratos_activos, icon: 'checkmark-circle-outline',color: 'green',  tipo: 'num' },
                        { label: tr('Pagados', 'Paid'),          valor: stats.contratos_pagados, icon: 'ribbon-outline',          color: 'orange', tipo: 'num' },
                        { label: tr('Total Financiado', 'Total Financed'), valor: stats.total_financiado,  icon: 'cash-outline',            color: 'purple', tipo: 'mon' },
                    ].map((s, i) => (
                        <div key={i} className={`${estilos.statCard} ${estilos[s.color]}`}>
                            <div className={`${estilos.statIcono} ${estilos[s.color]}`}><ion-icon name={s.icon}></ion-icon></div>
                            <div>
                                <span className={estilos.statValor}>{s.tipo === 'mon' ? `${simboloMoneda} ${formatearMoneda(s.valor)}` : s.valor}</span>
                                <span className={estilos.statLabel}>{s.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={estilos.grid}>

                {/* CONDICIONES */}
                <div className={estilos.columna}>
                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="information-circle-outline"></ion-icon> {tr('Condiciones', 'Conditions')}
                        </h2>
                        <div className={estilos.infoGrid}>
                            {[
                                { label: tr('Frecuencia', 'Frequency'),      valor: FRECUENCIA_LABEL[plan.frecuencia], icon: 'time-outline' },
                                { label: tr('Tasa de Interés', 'Interest Rate'), valor: `${plan.tasa_interes}%`,           icon: 'trending-up-outline' },
                                { label: tr('Mora', 'Late Fee'),            valor: `${plan.mora_pct}% ${tr('mensual', 'monthly')}`,       icon: 'warning-outline' },
                                { label: tr('Días de Gracia', 'Grace Days'),  valor: `${plan.dias_gracia} ${tr('días', 'days')}`,        icon: 'calendar-outline' },
                            ].map((item, i) => (
                                <div key={i} className={estilos.infoItem}>
                                    <div className={estilos.infoIcono}><ion-icon name={item.icon}></ion-icon></div>
                                    <div>
                                        <span className={estilos.infoLabel}>{item.label}</span>
                                        <span className={estilos.infoValor}>{item.valor}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={estilos.flagsGrid}>
                            <div className={`${estilos.flagCard} ${plan.requiere_fiador ? estilos.flagOn : estilos.flagOff}`}>
                                <ion-icon name={plan.requiere_fiador ? 'shield-checkmark-outline' : 'shield-outline'}></ion-icon>
                                <div>
                                    <strong>{tr('Fiador', 'Guarantor')}</strong>
                                    <span>{plan.requiere_fiador ? tr('Requerido', 'Required') : tr('No requerido', 'Not required')}</span>
                                </div>
                            </div>
                            <div className={`${estilos.flagCard} ${plan.permite_anticipado ? estilos.flagOn : estilos.flagOff}`}>
                                <ion-icon name={plan.permite_anticipado ? 'flash-outline' : 'flash-off-outline'}></ion-icon>
                                <div>
                                    <strong>{tr('Pago Anticipado', 'Early Payment')}</strong>
                                    <span>{plan.permite_anticipado ? tr('Permitido', 'Allowed') : tr('No permitido', 'Not allowed')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CALCULADORA PREVIEW */}
                <div className={estilos.columna}>
                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="calculator-outline"></ion-icon> {tr('Simulador de Cuotas', 'Installment Simulator')}
                        </h2>

                        <div className={estilos.campo}>
                            <label className={estilos.label}>{tr('Monto a financiar', 'Amount to finance')}</label>
                            <div className={estilos.inputMoneda}>
                                <span>{simboloMoneda}</span>
                                <input type="number" min="0" step="100"
                                    className={estilos.inputCalc}
                                    value={montoPreview}
                                    onChange={e => setMontoPreview(e.target.value)}
                                    placeholder="10000" />
                            </div>
                            <div className={estilos.montosRapidos}>
                                {MONTOS_EJEMPLO.map(m => (
                                    <button key={m}
                                        className={`${estilos.montoBtn} ${montoNum === m ? estilos.montoBtnActivo : ''}`}
                                        onClick={() => setMontoPreview(String(m))}>
                                        {m >= 1000 ? `${m/1000}k` : m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={estilos.campo}>
                            <label className={estilos.label}>{tr('Número de', 'Number of')} {freqC === tr('mes', 'mo') ? tr('meses', 'months') : freqC === tr('quin', 'biw') ? tr('quincenas', 'fortnights') : tr('semanas', 'weeks')}</label>
                            <div className={estilos.mesesSliderWrap}>
                                <input type="range" min="1" max="60"
                                    className={estilos.slider}
                                    value={mesesPreview}
                                    onChange={e => setMesesPreview(parseInt(e.target.value))} />
                                <span className={estilos.mesesValor}>{mesesPreview} {freqC}</span>
                            </div>
                            <div className={estilos.mesesRapidos}>
                                {[3, 6, 12, 24, 36].map(m => (
                                    <button key={m}
                                        className={`${estilos.montoBtn} ${mesesPreview === m ? estilos.montoBtnActivo : ''}`}
                                        onClick={() => setMesesPreview(m)}>
                                        {m} {freqC}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {preview && montoNum > 0 ? (
                            <div className={estilos.previewResult}>
                                <div className={estilos.previewCuotaGrande}>
                                    <span className={estilos.previewCuotaLabel}>{tr('Cuota', 'Installment')} {freqC === tr('mes', 'mo') ? tr('mensual', 'monthly') : freqC === tr('quin', 'biw') ? tr('quincenal', 'biweekly') : tr('semanal', 'weekly')}</span>
                                    <span className={estilos.previewCuotaMonto}>{simboloMoneda} {formatearMoneda(preview.cuota)}</span>
                                </div>
                                <div className={estilos.previewDesglose}>
                                    <div className={estilos.previewFila}>
                                        <span>{tr('Monto financiado', 'Financed amount')}</span>
                                        <span>{simboloMoneda} {formatearMoneda(montoNum)}</span>
                                    </div>
                                    <div className={estilos.previewFila}>
                                        <span>{tr('Intereses', 'Interest')} ({plan.tasa_interes}%)</span>
                                        <span className={estilos.previewIntereses}>{simboloMoneda} {formatearMoneda(preview.intereses)}</span>
                                    </div>
                                    <div className={`${estilos.previewFila} ${estilos.previewTotal}`}>
                                        <span>{tr('Total a pagar', 'Total to pay')}</span>
                                        <span>{simboloMoneda} {formatearMoneda(preview.totalPagar)}</span>
                                    </div>
                                </div>
                                <div className={estilos.previewBarra}>
                                    <div className={estilos.previewBarraCapital} style={{ width: `${(montoNum / preview.totalPagar) * 100}%` }}>
                                        <span>{tr('Capital', 'Principal')}</span>
                                    </div>
                                    <div className={estilos.previewBarraInteres}>
                                        <span>{tr('Interés', 'Interest')}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={estilos.previewVacio}>
                                <ion-icon name="calculator-outline"></ion-icon>
                                <span>{tr('Ingresa un monto para simular', 'Enter an amount to simulate')}</span>
                            </div>
                        )}
                    </div>

                    {/* EJEMPLOS CON MONTOS FIJOS */}
                    <div className={estilos.card}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="list-outline"></ion-icon> {tr('Ejemplos rápidos', 'Quick examples')}
                        </h2>
                        <div className={estilos.ejemplosTabla}>
                            <div className={estilos.ejemplosHeader}>
                                <span>{tr('Monto', 'Amount')}</span>
                                <span>12 {freqC}</span>
                                <span>24 {freqC}</span>
                                <span>36 {freqC}</span>
                            </div>
                            {MONTOS_EJEMPLO.map(m => {
                                const c12 = calcPreview(m, 12)
                                const c24 = calcPreview(m, 24)
                                const c36 = calcPreview(m, 36)
                                return (
                                    <div key={m} className={estilos.ejemploFila}>
                                        <span className={estilos.ejemploMonto}>{simboloMoneda} {formatearMoneda(m)}</span>
                                        <span>{c12 ? `${simboloMoneda} ${formatearMoneda(c12.cuota)}` : '—'}</span>
                                        <span>{c24 ? `${simboloMoneda} ${formatearMoneda(c24.cuota)}` : '—'}</span>
                                        <span>{c36 ? `${simboloMoneda} ${formatearMoneda(c36.cuota)}` : '—'}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}