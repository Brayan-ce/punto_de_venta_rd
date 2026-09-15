"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerDashboard, marcarAlertaResuelta, obtenerDatosEmpresa } from './servidor'
import { eliminarContrato, eliminarContratosCancelados } from '../contratos/servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './financiamiento.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const ESTADO_COLOR   = { activo: 'green', pagado: 'blue', incumplido: 'red', reestructurado: 'orange', cancelado: 'gray' }
const ESTADO_ICON    = { activo: 'checkmark-circle-outline', pagado: 'ribbon-outline', incumplido: 'close-circle-outline', reestructurado: 'refresh-outline', cancelado: 'ban-outline' }
const FREQ_LABEL     = { mensual: 'mes', quincenal: 'quin', semanal: 'sem' }

export default function DashboardFinanciamiento({ basePath = '/admin' }) {
    const { language, t } = useLanguage()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [data, setData] = useState(null)
    const [empresa, setEmpresa] = useState(null)

    const MODULOS = [
        { nombre: t('header.planes'),     desc: language === 'en' ? 'Manage plans' : 'Gestionar planes',      href: '/admin/planes',    icon: 'documents-outline',    color: 'blue'   },
        { nombre: t('header.contratos'),  desc: language === 'en' ? 'View and create contracts' : 'Ver y crear contratos', href: '/admin/contratos', icon: 'receipt-outline', color: 'purple' },
        { nombre: t('header.cuotas'),     desc: language === 'en' ? 'Payment control' : 'Control de pagos',   href: '/admin/cuotas',    icon: 'calendar-outline',     color: 'green'  },
        { nombre: t('header.pagos'),      desc: language === 'en' ? 'Payment history' : 'Historial de pagos', href: '/admin/pagos',     icon: 'cash-outline',         color: 'orange' },
        { nombre: t('header.alertas'),    desc: language === 'en' ? 'Collections and alerts' : 'Cobranza y alertas', href: '/admin/alertas', icon: 'notifications-outline', color: 'red' },
    ]

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const onChange = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', onChange)
        window.addEventListener('storage', onChange)
        cargarEmpresa()
        return () => {
            window.removeEventListener('temaChange', onChange)
            window.removeEventListener('storage', onChange)
        }
    }, [])

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        setCargando(true)
        const r = await obtenerDashboard()
        if (r.success) setData(r)
        setCargando(false)
    }

    const handleResolverAlerta = async (id) => {
        await marcarAlertaResuelta(id)
        cargar()
    }

    const handleEliminarContrato = async (c) => {
        const nombre = c.cliente_nombre ? ` de ${c.cliente_nombre}` : ''
        const msg = language === 'en'
            ? `Delete contract ${c.numero}${nombre}? This will permanently delete the contract, its installments, payments and related records. This action cannot be undone.`
            : `¿Eliminar el contrato ${c.numero}${nombre}? Se eliminarán permanentemente sus cuotas, pagos y registros asociados. Esta acción no se puede deshacer.`
        if (!confirm(msg)) return
        const r = await eliminarContrato(c.id)
        if (!r.success) { alert(r.mensaje); return }
        cargar()
    }

    const handleEliminarCancelados = async () => {
        const n = s?.contratos_cancelados || 0
        if (n === 0) return
        const msg = language === 'en'
            ? `Delete ${n} canceled contract(s)? This will permanently delete them and all their records. This action cannot be undone.`
            : `¿Eliminar ${n} contrato(s) cancelado(s)? Se borrarán permanentemente junto con sus registros. Esta acción no se puede deshacer.`
        if (!confirm(msg)) return
        const r = await eliminarContratosCancelados()
        if (!r.success) { alert(r.mensaje); return }
        cargar()
    }

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'

    const fmt = (v) => new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 0 }).format(v || 0)
    const fmtFecha = (f) => new Date(f).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { day: '2-digit', month: 'short', year: 'numeric' })

    if (cargando) { return <LoadingScreen /> }

    const s = data?.stats || {}
    const totalContratos = (s.contratos_activos || 0) + (s.contratos_pagados || 0) + (s.contratos_incumplidos || 0) || 1
    const pctActivos     = ((s.contratos_activos    || 0) / totalContratos * 502.4).toFixed(2)
    const pctPagados     = ((s.contratos_pagados    || 0) / totalContratos * 502.4).toFixed(2)
    const pctIncumplidos = ((s.contratos_incumplidos|| 0) / totalContratos * 502.4).toFixed(2)
    const offsetPagados  = parseFloat(pctActivos)
    const offsetIncump   = parseFloat(pctActivos) + parseFloat(pctPagados)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* ── HERO ── */}
            <div className={estilos.hero}>
                <div className={estilos.heroLeft}>
                    <div className={estilos.heroBadge}>
                        <ion-icon name="sparkles-outline"></ion-icon>
                        <span>{language === 'en' ? 'Financing Center' : 'Centro de Financiamiento'}</span>
                    </div>
                    <h1 className={estilos.heroTitulo}>{t('pages.dashboardFinancieroTitulo')}</h1>
                    <p className={estilos.heroSub}>{t('pages.dashboardFinancieroSub')}</p>
                    <div className={estilos.heroAcciones}>
                        <Link href={`${basePath}/contratos/nuevo`} className={estilos.btnHeroPrimario}>
                            <ion-icon name="add-circle-outline"></ion-icon>
                            <span>{t('pages.nuevoContrato')}</span>
                        </Link>
                        <Link href={`${basePath}/planes/nuevo`} className={estilos.btnHeroSecundario}>
                            <ion-icon name="documents-outline"></ion-icon>
                            <span>{t('pages.nuevoPlan')}</span>
                        </Link>
                        {s.contratos_cancelados > 0 && (
                            <button onClick={handleEliminarCancelados} className={estilos.btnHeroPeligro}>
                                <ion-icon name="trash-outline"></ion-icon>
                                <span>{language === 'en' ? 'Delete canceled' : 'Borrar cancelados'}</span>
                            </button>
                        )}
                    </div>
                </div>
                <div className={estilos.heroRight}>
                    <div className={estilos.heroCircles}>
                        <div className={estilos.heroCircle1}></div>
                        <div className={estilos.heroCircle2}></div>
                        <div className={estilos.heroIconBig}>
                            <ion-icon name="card-outline"></ion-icon>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── STATS ── */}
            <div className={estilos.statsGrid}>
                {[
                    { label: t('pages.contratosActivos'),  valor: s.contratos_activos,  icon: 'document-text-outline',    color: 'blue',   sub: t('pages.enProcesoSub') },
                    { label: t('pages.cuotasVencidas'),    valor: s.cuotas_vencidas,    icon: 'alert-circle-outline',     color: 'red',    sub: t('pages.requierenAtencionSub'), alerta: true },
                    { label: t('pages.saldoPendiente'),    valor: fmt(s.saldo_pendiente),icon: 'wallet-outline',           color: 'purple', sub: t('pages.porCobrar') },
                    { label: t('pages.cobradoEsteMes'),    valor: fmt(s.cobrado_mes),   icon: 'trending-up-outline',      color: 'green',  sub: t('pages.totalRecaudado') },
                    { label: t('pages.totalFinanciado'),   valor: fmt(s.total_financiado),icon: 'cash-outline',           color: 'orange', sub: t('pages.historialCompleto') },
                    { label: t('pages.interesesCobrados'), valor: fmt(s.total_intereses_cobrados), icon: 'bar-chart-outline', color: 'cyan', sub: t('pages.rendimiento') },
                ].map((st, i) => (
                    <div key={i} className={`${estilos.statCard} ${estilos[st.color]} ${st.alerta && st.valor > 0 ? estilos.statAlerta : ''}`}>
                        <div className={`${estilos.statIcono} ${estilos[st.color]}`}>
                            <ion-icon name={st.icon}></ion-icon>
                        </div>
                        <div className={estilos.statInfo}>
                            <span className={estilos.statValor}>{st.valor}</span>
                            <span className={estilos.statLabel}>{st.label}</span>
                            <span className={estilos.statSub}>{st.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── MÓDULOS ── */}
            <div className={estilos.modulosSection}>
                <div className={estilos.sectionHeader}>
                    <h2 className={estilos.sectionTitulo}>
                        <ion-icon name="grid-outline"></ion-icon> {t('pages.accesoRapido')}
                    </h2>
                    <p className={estilos.sectionSub}>{t('pages.navegaModulos')}</p>
                </div>
                <div className={estilos.modulosGrid}>
                    {MODULOS.map((m, i) => (
                        <Link key={i} href={m.href} className={`${estilos.moduloCard} ${estilos[m.color]}`}>
                            <div className={`${estilos.moduloIcono} ${estilos[m.color]}`}>
                                <ion-icon name={m.icon}></ion-icon>
                            </div>
                            <div className={estilos.moduloInfo}>
                                <span className={estilos.moduloNombre}>{m.nombre}</span>
                                <span className={estilos.moduloDesc}>{m.desc}</span>
                            </div>
                            <ion-icon name="chevron-forward-outline" className={estilos.moduloFlecha}></ion-icon>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── GRID CENTRAL ── */}
            <div className={estilos.gridCentral}>

                {/* Dona de distribución */}
                <div className={estilos.card}>
                    <div className={estilos.cardHeader}>
                        <h3 className={estilos.cardTitulo}>
                            <ion-icon name="pie-chart-outline"></ion-icon> {t('pages.distribucionContratos')}
                        </h3>
                        <span className={estilos.cardSub}>{t('pages.estadoActual')}</span>
                    </div>

                    <div className={estilos.donaWrapper}>
                        <svg viewBox="0 0 200 200" className={estilos.dona}>
                            <circle cx="100" cy="100" r="80" fill="none"
                                stroke={tema === 'dark' ? '#1e293b' : '#f1f5f9'} strokeWidth="36" />
                            <circle cx="100" cy="100" r="80" fill="none"
                                stroke="#10b981" strokeWidth="36"
                                strokeDasharray={`${pctActivos} 502.4`}
                                strokeDashoffset="0" />
                            <circle cx="100" cy="100" r="80" fill="none"
                                stroke="#3b82f6" strokeWidth="36"
                                strokeDasharray={`${pctPagados} 502.4`}
                                strokeDashoffset={`-${offsetPagados}`} />
                            <circle cx="100" cy="100" r="80" fill="none"
                                stroke="#ef4444" strokeWidth="36"
                                strokeDasharray={`${pctIncumplidos} 502.4`}
                                strokeDashoffset={`-${offsetIncump}`} />
                            <text x="100" y="92" textAnchor="middle" className={estilos.donaNumero}>
                                {(s.contratos_activos || 0) + (s.contratos_pagados || 0) + (s.contratos_incumplidos || 0)}
                            </text>
                            <text x="100" y="112" textAnchor="middle" className={estilos.donaLabel}>
                                {t('header.contratos').toLowerCase()}
                            </text>
                        </svg>

                        <div className={estilos.donaLeyenda}>
                            {[
                                { label: language === 'en' ? 'Active' : 'Activos',     valor: s.contratos_activos,     color: 'green' },
                                { label: language === 'en' ? 'Paid' : 'Pagados',       valor: s.contratos_pagados,     color: 'blue'  },
                                { label: language === 'en' ? 'Defaulted' : 'Incumplidos', value: s.contratos_incumplidos, color: 'red'   },
                            ].map((item, i) => (
                                <div key={i} className={estilos.leyendaFila}>
                                    <span className={`${estilos.leyendaDot} ${estilos[item.color]}`}></span>
                                    <div className={estilos.leyendaInfo}>
                                        <span className={estilos.leyendaLabel}>{item.label}</span>
                                        <span className={estilos.leyendaValor}>{item.valor || 0}</span>
                                    </div>
                                    <span className={estilos.leyendaPct}>
                                        {(((item.valor || 0) / totalContratos) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            ))}

                            <div className={estilos.promedioCont}>
                                <span className={estilos.promedioLabel}>{t('pages.promedioFinanciado')}</span>
                                <span className={estilos.promedioValor}>
                                    {fmt(s.contratos_activos > 0 ? s.saldo_pendiente / s.contratos_activos : 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Planes activos */}
                <div className={estilos.card}>
                    <div className={estilos.cardHeader}>
                        <h3 className={estilos.cardTitulo}>
                            <ion-icon name="documents-outline"></ion-icon> {t('pages.planesActivos')}
                        </h3>
                        <Link href={`${basePath}/planes`} className={estilos.verTodos}>
                            {t('pages.verTodos')} <ion-icon name="arrow-forward-outline"></ion-icon>
                        </Link>
                    </div>

                    {!data?.planes?.length ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="documents-outline"></ion-icon>
                            <p>{t('pages.noHayPlanesActivos')}</p>
                            <Link href={`${basePath}/planes/nuevo`} className={estilos.btnVacio}>
                                <ion-icon name="add-circle-outline"></ion-icon> {t('pages.crearPlan')}
                            </Link>
                        </div>
                    ) : (
                        <div className={estilos.planesList}>
                            {data.planes.map(p => (
                                <Link key={p.id} href={`${basePath}/planes/ver/${p.id}`} className={estilos.planFila}>
                                    <div className={estilos.planIcono}>
                                        <ion-icon name="card-outline"></ion-icon>
                                    </div>
                                    <div className={estilos.planInfo}>
                                        <span className={estilos.planNombre}>{p.nombre}</span>
                                        <span className={estilos.planMeta}>
                                            {p.tasa_interes}% · {FREQ_LABEL[p.frecuencia] || p.frecuencia} · {p.total_opciones} plazos
                                        </span>
                                    </div>
                                    <span className={estilos.planContratos}>{p.total_contratos || 0}</span>
                                </Link>
                            ))}
                        </div>
                    )}

                    <Link href={`${basePath}/planes/nuevo`} className={estilos.btnNuevoPlan}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>{t('pages.crearNuevoPlan')}</span>
                    </Link>
                </div>

                {/* Cuotas próximas a vencer */}
                <div className={estilos.card}>
                    <div className={estilos.cardHeader}>
                        <h3 className={estilos.cardTitulo}>
                            <ion-icon name="time-outline"></ion-icon> {t('pages.vencen7Dias')}
                        </h3>
                        <Link href={`${basePath}/notificaciones`} className={estilos.verTodos}>
                            {t('pages.verTodas')} <ion-icon name="arrow-forward-outline"></ion-icon>
                        </Link>
                    </div>

                    {!data?.cuotas_proximas?.length ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                            <p>{t('pages.sinCuotasProximas')}</p>
                        </div>
                    ) : (
                        <div className={estilos.cuotasList}>
                            {data.cuotas_proximas.map(q => {
                                const dias = Math.ceil((new Date(q.fecha_vencimiento) - new Date()) / 86400000)
                                return (
                                    <div key={q.id} className={`${estilos.cuotaFila} ${dias <= 1 ? estilos.cuotaUrgente : dias <= 3 ? estilos.cuotaProxima : ''}`}>
                                        <div className={estilos.cuotaAvatar}>
                                            {(q.cliente_nombre || 'C').charAt(0)}
                                        </div>
                                        <div className={estilos.cuotaInfo}>
                                            <span className={estilos.cuotaCliente}>{q.cliente_nombre}</span>
                                            <span className={estilos.cuotaMeta}>
                                                {q.numero_contrato} · Cuota #{q.numero}
                                            </span>
                                        </div>
                                        <div className={estilos.cuotaDerecha}>
                                            <span className={estilos.cuotaMonto}>{fmt(q.monto)}</span>
                                            <span className={`${estilos.cuotaDias} ${dias <= 1 ? estilos.diasRojo : dias <= 3 ? estilos.diasNaranja : estilos.diasVerde}`}>
                                                {dias <= 0 ? t('pages.hoy') : `${dias}d`}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── ALERTAS ── */}
            {data?.alertas?.length > 0 && (
                <div className={estilos.card} style={{ marginBottom: 24 }}>
                    <div className={estilos.cardHeader}>
                        <h3 className={`${estilos.cardTitulo} ${estilos.cardTituloRed}`}>
                            <ion-icon name="alert-circle-outline"></ion-icon> {t('pages.alertasActivas')}
                        </h3>
                        <Link href={`${basePath}/alertas`} className={estilos.verTodos}>
                            {t('pages.verTodas')} <ion-icon name="arrow-forward-outline"></ion-icon>
                        </Link>
                    </div>
                    <div className={estilos.alertasList}>
                        {data.alertas.map(a => (
                            <div key={a.id} className={estilos.alertaFila}>
                                <div className={estilos.alertaIcono}>
                                    <ion-icon name="warning-outline"></ion-icon>
                                </div>
                                <div className={estilos.alertaInfo}>
                                    <span className={estilos.alertaMensaje}>{a.mensaje}</span>
                                    <span className={estilos.alertaMeta}>
                                        {a.cliente_nombre} · {a.numero_contrato}
                                    </span>
                                </div>
                                <div className={estilos.alertaAcciones}>
                                    {a.cliente_telefono && (
                                        <a href={`tel:${a.cliente_telefono}`} className={estilos.btnAccion}>
                                            <ion-icon name="call-outline"></ion-icon>
                                        </a>
                                    )}
                                    {a.cliente_telefono && (
                                        <a href={`https://wa.me/${a.cliente_telefono}`} target="_blank" rel="noreferrer" className={estilos.btnAccion}>
                                            <ion-icon name="logo-whatsapp"></ion-icon>
                                        </a>
                                    )}
                                    {a.contrato_id && (
                                        <Link href={`${basePath}/contratos/ver/${a.contrato_id}`} className={estilos.btnAccion}>
                                            <ion-icon name="eye-outline"></ion-icon>
                                        </Link>
                                    )}
                                    <button className={`${estilos.btnAccion} ${estilos.btnResolver}`} onClick={() => handleResolverAlerta(a.id)}>
                                        <ion-icon name="checkmark-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── CONTRATOS RECIENTES ── */}
            <div className={estilos.card}>
                <div className={estilos.cardHeader}>
                    <h3 className={estilos.cardTitulo}>
                        <ion-icon name="receipt-outline"></ion-icon> {t('pages.contratosRecientes')}
                    </h3>
                    <Link href={`${basePath}/contratos`} className={estilos.verTodos}>
                        {t('pages.verTodos')} <ion-icon name="arrow-forward-outline"></ion-icon>
                    </Link>
                </div>

                <div className={estilos.tablaWrapper}>
                    <table className={estilos.tabla}>
                        <thead>
                            <tr>
                                <th>{t('pages.contrato')}</th>
                                <th>{t('pages.clienteCol')}</th>
                                <th>{t('pages.plan')}</th>
                                <th>{t('pages.financiado')}</th>
                                <th>{t('pages.saldo')}</th>
                                <th>{t('pages.estado')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data?.contratos_recientes?.length ? (
                                <tr>
                                    <td colSpan="7" className={estilos.tdVacio}>
                                        <ion-icon name="receipt-outline"></ion-icon>
                                        <span>{t('pages.noHayContratosRegistrados')}</span>
                                    </td>
                                </tr>
                            ) : data.contratos_recientes.map(c => (
                                <tr key={c.id} className={estilos.fila}>
                                    <td>
                                        <div className={estilos.contratoNum}>{c.numero}</div>
                                        <div className={estilos.contratoFecha}>{fmtFecha(c.fecha_inicio)}</div>
                                    </td>
                                    <td>
                                        <div className={estilos.clienteNombre}>{c.cliente_nombre}</div>
                                        <div className={estilos.clienteDoc}>{c.numero_documento || '—'}</div>
                                    </td>
                                    <td className={estilos.tdPlan}>{c.plan_nombre}</td>
                                    <td className={estilos.tdMonto}>{fmt(c.monto_financiado)}</td>
                                    <td className={estilos.tdMonto}>{fmt(c.saldo_pendiente)}</td>
                                    <td>
                                        <span className={`${estilos.estadoBadge} ${estilos[ESTADO_COLOR[c.estado] || 'gray']}`}>
                                            <ion-icon name={ESTADO_ICON[c.estado] || 'ellipse-outline'}></ion-icon>
                                            {c.estado === 'activo' ? (language === 'en' ? 'active' : 'activo') : c.estado === 'pagado' ? (language === 'en' ? 'paid' : 'pagado') : c.estado === 'incumplido' ? (language === 'en' ? 'defaulted' : 'incumplido') : c.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={estilos.accionesFila}>
                                            <Link href={`${basePath}/contratos/ver/${c.id}`} className={estilos.btnVer}>
                                                <ion-icon name="eye-outline"></ion-icon>
                                                {t('pages.ver')}
                                            </Link>
                                            <button
                                                className={`${estilos.btnVer} ${estilos.btnEliminar}`}
                                                onClick={() => handleEliminarContrato(c)}
                                                title={language === 'en' ? 'Delete contract' : 'Eliminar contrato'}
                                            >
                                                <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}