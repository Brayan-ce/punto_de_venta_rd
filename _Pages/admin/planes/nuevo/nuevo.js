"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { crearPlan } from './servidor'
import { useLanguage } from '../../i18n/LanguageProvider'
import estilos from './nuevo.module.css'

export default function NuevoPlan({ returnPath = '/admin/planes' }) {
    const router = useRouter()
    const { language } = useLanguage()
    const [tema, setTema]         = useState('light')
    const [guardando, setGuardando] = useState(false)
    const [error, setError]       = useState('')

    const [form, setForm] = useState({
        nombre: '', descripcion: '', frecuencia: 'mensual',
        tasa_interes: '', mora_pct: '5', dias_gracia: '5',
        requiere_fiador: false, permite_anticipado: true,
    })

    const tr = (es, en) => language === 'en' ? en : es

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const fn = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', fn)
        window.addEventListener('storage', fn)
        return () => { window.removeEventListener('temaChange', fn); window.removeEventListener('storage', fn) }
    }, [])

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleGuardar = async () => {
        if (!form.nombre.trim()) { setError(tr('El nombre es requerido', 'Name is required')); return }
        if (parseFloat(form.tasa_interes || 0) > 999.99) { setError(tr('La tasa de interés no puede superar 999.99%', 'Interest rate cannot exceed 999.99%')); return }
        if (parseFloat(form.mora_pct || 0) > 999.99) { setError(tr('La mora no puede superar 999.99%', 'Late fee cannot exceed 999.99%')); return }
        setGuardando(true); setError('')
        const r = await crearPlan(form)
        if (r.success) router.push(returnPath)
        else { setError(r.mensaje); setGuardando(false) }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <Link href={returnPath} className={estilos.btnVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>{tr('Volver', 'Back')}</span>
                </Link>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                    </div>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Nuevo Plan', 'New Plan')}</h1>
                        <p className={estilos.subtitulo}>{tr('Plantilla base para contratos de financiamiento', 'Base template for financing contracts')}</p>
                    </div>
                </div>
            </div>

            <div className={estilos.grid}>

                {/* INFO GENERAL */}
                <div className={estilos.card}>
                    <h2 className={estilos.cardTitulo}>
                        <ion-icon name="information-circle-outline"></ion-icon> {tr('Información General', 'General Information')}
                    </h2>

                    <div className={estilos.campo}>
                        <label className={estilos.label}>{tr('Nombre del Plan *', 'Plan Name *')}</label>
                        <input type="text" className={estilos.input}
                            value={form.nombre}
                            onChange={e => set('nombre', e.target.value)}
                            placeholder={tr('Ej: Plan Semanal, Plan Premium...', 'Ex: Weekly Plan, Premium Plan...')} autoFocus />
                    </div>

                    <div className={estilos.campo}>
                        <label className={estilos.label}>{tr('Frecuencia de cobro *', 'Payment Frequency *')}</label>
                        <div className={estilos.frecuenciaGroup}>
                            {[
                                { v: 'semanal',   l: tr('Semanal', 'Weekly'),   icon: 'calendar-number-outline' },
                                { v: 'quincenal', l: tr('Quincenal', 'Biweekly'), icon: 'calendar-outline' },
                                { v: 'mensual',   l: tr('Mensual', 'Monthly'),   icon: 'calendar-clear-outline' },
                            ].map(f => (
                                <button key={f.v}
                                    className={`${estilos.frecBtn} ${form.frecuencia === f.v ? estilos.frecActivo : ''}`}
                                    onClick={() => set('frecuencia', f.v)}>
                                    <ion-icon name={f.icon}></ion-icon>
                                    {f.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={estilos.campo}>
                        <label className={estilos.label}>{tr('Descripción', 'Description')} <span className={estilos.opcional}>{tr('(opcional)', '(optional)')}</span></label>
                        <textarea className={`${estilos.input} ${estilos.textarea}`}
                            value={form.descripcion}
                            onChange={e => set('descripcion', e.target.value)}
                            placeholder={tr('Descripción breve del plan...', 'Brief plan description...')} rows={3} />
                    </div>
                </div>

                {/* TASAS */}
                <div className={estilos.card}>
                    <h2 className={estilos.cardTitulo}>
                        <ion-icon name="trending-up-outline"></ion-icon> {tr('Tasas y Mora', 'Rates and Late Fee')}
                    </h2>

                    <div className={estilos.gridDos}>
                        <div className={estilos.campo}>
                            <label className={estilos.label}>{tr('Tasa de Interés', 'Interest Rate')}</label>
                            <div className={estilos.inputSufijo}>
                                <input type="number" min="0" max="999.99" step="0.01" className={estilos.input}
                                    value={form.tasa_interes}
                                    onChange={e => set('tasa_interes', e.target.value)}
                                    placeholder="0.00" />
                                <span>%</span>
                            </div>
                            <span className={estilos.hint}>{tr('Porcentaje sobre el monto financiado', 'Percentage over financed amount')}</span>
                        </div>
                        <div className={estilos.campo}>
                            <label className={estilos.label}>{tr('Mora por atraso', 'Late Fee')}</label>
                            <div className={estilos.inputSufijo}>
                                <input type="number" min="0" max="999.99" step="0.01" className={estilos.input}
                                    value={form.mora_pct}
                                    onChange={e => set('mora_pct', e.target.value)}
                                    placeholder="5.00" />
                                <span>%</span>
                            </div>
                            <span className={estilos.hint}>{tr('% mensual sobre la cuota vencida', '% monthly over overdue installment')}</span>
                        </div>
                    </div>

                    <div className={estilos.campo}>
                        <label className={estilos.label}>{tr('Días de Gracia', 'Grace Days')}</label>
                        <input type="number" min="0" className={estilos.inputMedium}
                            value={form.dias_gracia}
                            onChange={e => set('dias_gracia', e.target.value)}
                            placeholder="5" />
                        <span className={estilos.hint}>{tr('Días antes de aplicar mora tras vencimiento', 'Days before applying late fee after due date')}</span>
                    </div>
                </div>

                {/* CONDICIONES */}
                <div className={`${estilos.card} ${estilos.cardFullRow}`}>
                    <h2 className={estilos.cardTitulo}>
                        <ion-icon name="shield-checkmark-outline"></ion-icon> {tr('Condiciones del Plan', 'Plan Conditions')}
                    </h2>
                    <div className={estilos.togglesGrid}>
                        <div className={estilos.toggleCard} onClick={() => set('requiere_fiador', !form.requiere_fiador)}>
                            <div className={estilos.toggleIcono} style={{ background: form.requiere_fiador ? '#d1fae5' : '#f1f5f9', color: form.requiere_fiador ? '#059669' : '#94a3b8' }}>
                                <ion-icon name="shield-checkmark-outline"></ion-icon>
                            </div>
                            <div className={estilos.toggleTexto}>
                                <strong>{tr('Requiere Fiador', 'Requires Guarantor')}</strong>
                                <span>{tr('El contrato debe incluir un fiador como garantía', 'Contract must include a guarantor as collateral')}</span>
                            </div>
                            <div className={`${estilos.toggle} ${form.requiere_fiador ? estilos.toggleOn : ''}`}>
                                <span className={estilos.toggleCirculo}></span>
                            </div>
                        </div>
                        <div className={estilos.toggleCard} onClick={() => set('permite_anticipado', !form.permite_anticipado)}>
                            <div className={estilos.toggleIcono} style={{ background: form.permite_anticipado ? '#dbeafe' : '#f1f5f9', color: form.permite_anticipado ? '#1d4ed8' : '#94a3b8' }}>
                                <ion-icon name="flash-outline"></ion-icon>
                            </div>
                            <div className={estilos.toggleTexto}>
                                <strong>{tr('Permite Pago Anticipado', 'Allows Early Payment')}</strong>
                                <span>{tr('El cliente puede adelantar cuotas sin penalización', 'Customer can prepay installments without penalty')}</span>
                            </div>
                            <div className={`${estilos.toggle} ${form.permite_anticipado ? estilos.toggleOn : ''}`}>
                                <span className={estilos.toggleCirculo}></span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {error && (
                <div className={estilos.errorMsg}>
                    <ion-icon name="alert-circle-outline"></ion-icon> {error}
                </div>
            )}

            <div className={estilos.acciones}>
                <Link href={returnPath} className={estilos.btnCancelar}>{tr('Cancelar', 'Cancel')}</Link>
                <button className={estilos.btnGuardar} onClick={handleGuardar} disabled={guardando}>
                    {guardando
                        ? <><div className={estilos.spinner}></div>{tr('Guardando...', 'Saving...')}</>
                        : <><ion-icon name="checkmark-circle-outline"></ion-icon>{tr('Crear Plan', 'Create Plan')}</>}
                </button>
            </div>
        </div>
    )
}