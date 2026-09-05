"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { obtenerDashboardContratos, obtenerDatosEmpresa, eliminarContrato, eliminarContratosCancelados } from './servidor'
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { useLanguage } from '../i18n/LanguageProvider'
import estilos from './contratos.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ContratosFinanciamiento() {
    const { language } = useLanguage()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const [estadisticas, setEstadisticas] = useState({
        total_contratos: 0, contratos_activos: 0, contratos_pagados: 0,
        contratos_incumplidos: 0, total_financiado: 0, total_por_cobrar: 0,
        total_cobrado: 0, total_intereses: 0, promedio_financiado: 0,
        cuotas_pendientes: 0, cuotas_vencidas: 0, total_mora: 0, cuotas_proximas: 0,
        contratos_cancelados: 0
    })
    const [contratosRecientes, setContratosRecientes] = useState([])
    const [distribucionEstados, setDistribucionEstados] = useState([])
    const [evolucionMensual, setEvolucionMensual] = useState([])
    const [alertas, setAlertas] = useState([])
    const [topClientes, setTopClientes] = useState([])
    const [empresa, setEmpresa] = useState(null)

    const tr = (es, en) => language === 'en' ? en : es
    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        const onChange = () => setTema(localStorage.getItem('tema') || 'light')
        const checkMobile = () => setIsMobile(window.innerWidth <= 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        window.addEventListener('temaChange', onChange)
        window.addEventListener('storage', onChange)
        return () => {
            window.removeEventListener('resize', checkMobile)
            window.removeEventListener('temaChange', onChange)
            window.removeEventListener('storage', onChange)
        }
    }, [])

    useEffect(() => { cargarDashboard(); cargarEmpresa() }, [])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargarDashboard = async () => {
        setCargando(true)
        try {
            const r = await obtenerDashboardContratos()
            if (r.success) {
                setEstadisticas(r.estadisticas || {})
                setContratosRecientes(r.contratosRecientes || [])
                setDistribucionEstados(r.distribucionEstados || [])
                setEvolucionMensual(r.evolucionMensual || [])
                setAlertas(r.alertas || [])
                setTopClientes(r.topClientes || [])
            }
        } catch (e) { console.error(e) }
        finally { setCargando(false) }
    }

    const handleEliminarContrato = async (contrato) => {
        const nombre = `${contrato.cliente_nombre || ''} ${contrato.cliente_apellidos || ''}`.trim()
        const msg = tr(
            `¿Eliminar el préstamo ${contrato.numero}${nombre ? ' de ' + nombre : ''}? Se eliminarán permanentemente sus cuotas, pagos y registros asociados. Esta acción no se puede deshacer.`,
            `Delete loan ${contrato.numero}${nombre ? ' of ' + nombre : ''}? This will permanently delete its installments, payments and related records. This action cannot be undone.`
        )
        if (!confirm(msg)) return
        const r = await eliminarContrato(contrato.id)
        if (!r.success) { alert(r.mensaje); return }
        cargarDashboard()
    }

    const handleEliminarCancelados = async () => {
        const n = estadisticas.contratos_cancelados || 0
        if (n === 0) return
        const msg = tr(
            `¿Eliminar ${n} préstamo(s) cancelado(s)? Se borrarán permanentemente junto con sus registros. Esta acción no se puede deshacer.`,
            `Delete ${n} canceled loan(s)? This will permanently delete them and all their records. This action cannot be undone.`
        )
        if (!confirm(msg)) return
        const r = await eliminarContratosCancelados()
        if (!r.success) { alert(r.mensaje); return }
        cargarDashboard()
    }

    const fmtMoneda = (v) => new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0)
    const fmtNum = (v) => new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-DO').format(v || 0)
    const pct = (v, t) => (!t ? 0 : ((v / t) * 100).toFixed(1))

    const COLORES = {
        light: { texto: '#0f172a', textoSec: '#64748b', fondo: '#ffffff', borde: '#e2e8f0', grid: '#f1f5f9' },
        dark:  { texto: '#f1f5f9', textoSec: '#94a3b8', fondo: '#1e293b', borde: '#334155', grid: '#0f172a' }
    }
    const c = COLORES[tema]

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null
        return (
            <div style={{ background: c.fondo, border: `1px solid ${c.borde}`, borderRadius: 8, padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, color: c.texto }}>{label}</p>
                {payload.map((entry, i) => {
                    const name = String(entry.name || entry.dataKey || '')
                    const esMoneda = name.includes('Monto') || name.includes('Pago') || name.includes('Amount') || name.includes('Payment')
                    return <p key={i} style={{ margin: '4px 0', color: entry.color, fontSize: 13 }}>{name}: {esMoneda ? fmtMoneda(entry.value) : fmtNum(entry.value)}</p>
                })}
            </div>
        )
    }

    if (cargando) { return <LoadingScreen /> }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}>
                        <Image src="/financias/credit-card.svg" alt="Préstamos" width={40} height={40} />
                    </div>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Dashboard de Préstamos', 'Loans Dashboard')}</h1>
                        <p className={estilos.subtitulo}>{tr('Gestión integral de préstamos y cobranzas', 'Integrated loans and collections management')}</p>
                    </div>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/admin/contratos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>{tr('Nuevo Préstamo', 'New Loan')}</span>
                    </Link>
                    <Link href="/admin/contratos/listar" className={estilos.btnSecundario}>
                        <ion-icon name="list-outline"></ion-icon>
                        <span>{tr('Ver todos', 'View all')}</span>
                    </Link>
                    {estadisticas.contratos_cancelados > 0 && (
                        <button onClick={handleEliminarCancelados} className={estilos.btnPeligro}>
                            <ion-icon name="trash-outline"></ion-icon>
                            <span>{tr('Borrar cancelados', 'Delete canceled')}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className={estilos.estadisticas}>
                {[
                    { label: tr('Total Financiado', 'Total Financed'), valor: fmtMoneda(estadisticas.total_financiado), sub: `${estadisticas.total_contratos} ${tr('préstamos', 'loans')}`, img: '/financias/bank-statement.svg', tipo: 'primary', icono: 'primary' },
                    { label: tr('Total Cobrado', 'Total Collected'), valor: fmtMoneda(estadisticas.total_cobrado), sub: `${pct(estadisticas.total_cobrado, estadisticas.total_financiado)}% ${tr('recuperado', 'recovered')}`, img: '/financias/money-bag.svg', tipo: 'success', icono: 'success' },
                    { label: tr('Por Cobrar', 'Outstanding'), valor: fmtMoneda(estadisticas.total_por_cobrar), sub: `${estadisticas.cuotas_pendientes} ${tr('cuotas pendientes', 'pending installments')}`, img: '/financias/bill-receipt.svg', tipo: 'warning', icono: 'warning' },
                    { label: tr('Préstamos Incumplidos', 'Defaulted Loans'), valor: fmtMoneda(estadisticas.total_mora), sub: `${estadisticas.cuotas_vencidas} ${tr('cuotas vencidas', 'overdue installments')}`, img: null, tipo: 'danger', icono: 'danger' },
                ].map((s, i) => (
                    <div key={i} className={`${estilos.estadCard} ${estilos[s.tipo]}`}>
                        <div className={`${estilos.estadIcono} ${estilos[s.icono]}`}>
                            {s.img
                                ? <Image src={s.img} alt={s.label} width={36} height={36} />
                                : <ion-icon name="alert-circle-outline"></ion-icon>
                            }
                        </div>
                        <div className={estilos.estadInfo}>
                            <span className={estilos.estadLabel}>{s.label}</span>
                            <span className={estilos.estadValor}>{s.valor}</span>
                            <span className={`${estilos.estadTendencia} ${estilos.neutro}`}>{s.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={estilos.metricasSecundarias}>
                {[
                    { label: tr('Préstamos Activos', 'Active Loans'), valor: estadisticas.contratos_activos, clase: 'green', img: '/financias/transaction 1.svg' },
                    { label: tr('Préstamos Pagados', 'Paid Loans'), valor: estadisticas.contratos_pagados, clase: 'blue', img: '/financias/credit-card-visa.svg' },
                    { label: tr('Total Intereses', 'Total Interest'), valor: fmtMoneda(estadisticas.total_intereses), clase: 'orange', img: '/financias/coins.svg' },
                    { label: tr('Promedio Financiado', 'Average Financed'), valor: fmtMoneda(estadisticas.promedio_financiado), clase: 'blue', img: '/financias/wallet 2.svg' },
                ].map((m, i) => (
                    <div key={i} className={estilos.metricaCard}>
                        <div className={`${estilos.metricaIcono} ${estilos[m.clase]}`}>
                            <Image src={m.img} alt={m.label} width={28} height={28} />
                        </div>
                        <div className={estilos.metricaDetalle}>
                            <span className={estilos.metricaLabel}>{m.label}</span>
                            <span className={estilos.metricaValor}>{m.valor}</span>
                        </div>
                    </div>
                ))}
            </div>

            {alertas.length > 0 && (
                <div className={estilos.seccionAlertas}>
                    <h2 className={estilos.seccionTitulo}>
                        <ion-icon name="notifications-outline"></ion-icon>
                        <span>{tr('Alertas', 'Alerts')}</span>
                    </h2>
                    <div className={estilos.gridAlertas}>
                        {alertas.map((a, i) => (
                            <Link key={i} href={a.enlace} className={`${estilos.alertaCard} ${estilos[a.tipo]}`}>
                                <div className={estilos.alertaIcono}><ion-icon name={a.icono}></ion-icon></div>
                                <div className={estilos.alertaInfo}>
                                    <span className={estilos.alertaTitulo}>{a.titulo}</span>
                                    <span className={estilos.alertaMensaje}>{a.mensaje}</span>
                                </div>
                                <ion-icon name="chevron-forward-outline"></ion-icon>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <hr className={estilos.separador} />

            <div className={estilos.gridPrincipal}>
                <div className={`${estilos.cardGrafica} ${estilos[tema]}`}>
                    <div className={estilos.cardGraficaHeader}>
                        <h3 className={estilos.cardGraficaTitulo}>
                            <ion-icon name="pie-chart-outline"></ion-icon>
                            {tr('Distribucion por Estado', 'Distribution by Status')}
                        </h3>
                        <p className={estilos.cardGraficaSubtitulo}>{tr('Estado actual de todos los préstamos', 'Current status of all contracts')}</p>
                    </div>
                    <div className={estilos.graficaCircular}>
                        <div className={estilos.donaContainer}>
                            <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
                                <PieChart>
                                    <Pie data={distribucionEstados.filter(d => d.valor > 0)} cx="50%" cy="50%"
                                        innerRadius={isMobile ? 50 : 55} outerRadius={isMobile ? 75 : 85}
                                        paddingAngle={3} dataKey="valor" animationDuration={800}>
                                        {distribucionEstados.filter(d => d.valor > 0).map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className={estilos.donaCenter}>
                                <span className={estilos.donaCenterValor}>{estadisticas.total_contratos}</span>
                                <span className={estilos.donaCenterLabel}>{tr('Total', 'Total')}</span>
                            </div>
                        </div>
                        <div className={estilos.leyendaCircular}>
                            {distribucionEstados.map((e, i) => (
                                <div key={i} className={estilos.leyendaItem}>
                                    <div className={estilos.leyendaDot} style={{ backgroundColor: e.color }}></div>
                                    <div className={estilos.leyendaInfo}>
                                        <span className={estilos.leyendaLabel}>{e.nombre}</span>
                                        <span className={estilos.leyendaValor}>{e.valor}</span>
                                    </div>
                                    <span className={estilos.leyendaPorcentaje}>{pct(e.valor, estadisticas.total_contratos)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`${estilos.cardContratos} ${estilos[tema]}`}>
                    <div className={estilos.cardContratosHeader}>
                        <h3 className={estilos.cardContratosTitulo}>
                            <ion-icon name="time-outline"></ion-icon>
                            {tr('Préstamos Recientes', 'Recent Loans')}
                        </h3>
                        <Link href="/admin/contratos/listar" className={estilos.verTodosLink}>
                            {tr('Ver todos', 'View all')} <ion-icon name="arrow-forward-outline"></ion-icon>
                        </Link>
                    </div>
                    {contratosRecientes.length === 0
                        ? <div className={estilos.contratosVacio}><ion-icon name="document-outline"></ion-icon><span>{tr('No hay préstamos', 'No loans')}</span></div>
                        : (
                            <div className={estilos.listaContratos}>
                                {contratosRecientes.slice(0, 5).map((contrato) => {
                                    const nombre = `${contrato.cliente_nombre || ''} ${contrato.cliente_apellidos || ''}`.trim()
                                    const inicial = nombre.charAt(0) || 'C'
                                    return (
                                        <div key={contrato.id} className={estilos.itemContratoWrap}>
                                            <Link href={`/admin/contratos/ver/${contrato.id}`} className={estilos.itemContrato}>
                                                <div className={estilos.contratoAvatar}><span>{inicial}</span></div>
                                                <div className={estilos.contratoInfo}>
                                                    <span className={estilos.contratoNombre}>{nombre}</span>
                                                    <span className={estilos.contratoMeta}>{contrato.numero} · {contrato.plan_nombre}</span>
                                                </div>
                                                <div className={estilos.contratoMonto}>
                                                    <span className={estilos.contratoMontoValor}>{fmtMoneda(contrato.saldo_pendiente)}</span>
                                                    <span className={estilos.contratoMontoLabel}>{tr('pendiente', 'pending')}</span>
                                                </div>
                                                <span className={`${estilos.contratoEstado} ${estilos[contrato.estado]}`}>{contrato.estado}</span>
                                            </Link>
                                            <button
                                                className={estilos.btnEliminarItem}
                                                onClick={() => handleEliminarContrato(contrato)}
                                                title={tr('Eliminar préstamo', 'Delete loan')}
                                            >
                                                <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    }
                </div>
            </div>

            {evolucionMensual.length > 0 && (
                <div className={estilos.seccionEvolucion}>
                    <div className={`${estilos.cardEvolucion} ${estilos[tema]}`}>
                        <div className={estilos.cardGraficaHeader}>
                            <h3 className={estilos.cardGraficaTitulo}>
                                <ion-icon name="bar-chart-outline"></ion-icon>
                                {tr('Evolucion Mensual', 'Monthly Trend')}
                            </h3>
                            <p className={estilos.cardGraficaSubtitulo}>{tr('Préstamos y pagos de los ultimos 6 meses', 'Loans and payments from the last 6 months')}</p>
                        </div>
                        <div className={estilos.graficaBarras}>
                            <ResponsiveContainer width="100%" height={isMobile ? 280 : 300}>
                                <BarChart data={evolucionMensual} margin={isMobile ? { top: 10, right: 5, left: -15, bottom: 5 } : { top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                                    <XAxis dataKey="mes_nombre" tick={{ fill: c.textoSec, fontSize: isMobile ? 10 : 12 }} axisLine={{ stroke: c.borde }} />
                                    <YAxis tick={{ fill: c.textoSec, fontSize: isMobile ? 9 : 11 }} axisLine={{ stroke: c.borde }} width={isMobile ? 30 : 40} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: 16, fontSize: isMobile ? 11 : 13, color: c.texto }} />
                                    <Bar dataKey="contratos" name={tr('Contratos', 'Contracts')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="monto_financiado" name={tr('Monto Financiado', 'Financed Amount')} fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="pagos_recibidos" name={tr('Pagos Recibidos', 'Payments Received')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {topClientes.length > 0 && (
                <div className={estilos.seccionClientes}>
                    <h2 className={estilos.seccionTitulo}>
                        <ion-icon name="people-outline"></ion-icon>
                        <span>{tr('Top Clientes por Financiamiento', 'Top Customers by Financing')}</span>
                    </h2>
                    <div className={estilos.gridClientes}>
                        {topClientes.map((cliente, i) => (
                            <div key={cliente.id} className={estilos.clienteCard}>
                                <div className={`${estilos.clienteRango} ${i === 0 ? estilos.oro : i === 1 ? estilos.plata : i === 2 ? estilos.bronce : ''}`}>{i + 1}</div>
                                <div className={estilos.clienteInfo}>
                                    <span className={estilos.clienteNombre}>{cliente.nombre}</span>
                                    <span className={estilos.clienteContratos}>{cliente.total_contratos} {tr(cliente.total_contratos !== 1 ? 'préstamos activos' : 'préstamo activo', cliente.total_contratos !== 1 ? 'active loans' : 'active loan')}</span>
                                </div>
                                <div className={estilos.clienteMonto}>
                                    <span className={estilos.clienteMontoValor}>{fmtMoneda(cliente.total_financiado)}</span>
                                    <span className={estilos.clienteMontoLabel}>{tr('financiado', 'financed')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {estadisticas.total_contratos === 0 && (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <div className={estilos.vacioIcono}>
                        <Image src="/financias/credit-card.svg" alt="Sin contratos" width={100} height={100} />
                    </div>
                    <h3 className={estilos.vacioTitulo}>{tr('No hay contratos registrados', 'There are no registered contracts')}</h3>
                    <p className={estilos.vacioTexto}>{tr('Comienza creando tu primer contrato de financiamiento.', 'Start by creating your first financing contract.')}</p>
                    <Link href="/admin/contratos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>{tr('Crear Primer Contrato', 'Create First Contract')}</span>
                    </Link>
                </div>
            )}
        </div>
    )
}