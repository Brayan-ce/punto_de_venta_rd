"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerClienteDetalle, obtenerDatosEmpresa } from '../servidor'
import estilos from './ver.module.css'

const ESTADO_COLOR = {
    activo:    { cls: 'badgeBlue',   label: 'Activo' },
    pagado:    { cls: 'badgeGreen',  label: 'Pagado' },
    vencido:   { cls: 'badgeRed',    label: 'Vencido' },
    cancelado: { cls: 'badgeGray',   label: 'Cancelado' },
}

export default function VerClienteFinanciamiento() {
    const router  = useRouter()
    const params  = useParams()
    const id      = params?.id

    const [tema, setTema]           = useState('light')
    const [cargando, setCargando]   = useState(true)
    const [cliente, setCliente]     = useState(null)
    const [contratos, setContratos] = useState([])
    const [empresa, setEmpresa]     = useState(null)

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const h = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', h)
        window.addEventListener('storage', h)
        return () => { window.removeEventListener('temaChange', h); window.removeEventListener('storage', h) }
    }, [])

    useEffect(() => {
        if (id) { cargar(); cargarEmpresa() }
    }, [id])

    async function cargar() {
        setCargando(true)
        try {
            const res = await obtenerClienteDetalle(id)
            if (res.success) { setCliente(res.cliente); setContratos(res.contratos || []) }
            else router.push('/financiamiento/clientes')
        } finally { setCargando(false) }
    }

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const locale = empresa?.locale || 'es-DO'
    const simbolo = empresa?.simbolo_moneda || 'RD$'
    const fmt = (v) => {
        const num = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)
        return `${simbolo} ${num}`
    }
    const fmtFecha = (f) => f ? new Date(f).toLocaleDateString(locale) : '—'

    if (cargando) return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.cargando}><div className={estilos.spinner}></div><span>Cargando cliente...</span></div>
        </div>
    )

    if (!cliente) return null

    const nombreCompleto = `${cliente.nombre}${cliente.apellidos ? ' ' + cliente.apellidos : ''}`
    const inicial = nombreCompleto.charAt(0).toUpperCase()

    const totalActivos    = contratos.filter(c => c.estado === 'activo').length
    const totalVencidas   = contratos.reduce((s, c) => s + parseInt(c.cuotas_vencidas || 0), 0)
    const saldoTotal      = contratos.reduce((s, c) => s + parseFloat(c.saldo_pendiente || 0), 0)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* TOPBAR */}
            <div className={estilos.topbar}>
                <button className={estilos.btnVolver} onClick={() => router.push('/financiamiento/clientes')}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver
                </button>
                <div className={estilos.topbarAcciones}>
                    <button className={estilos.btnEditar}
                        onClick={() => router.push(`/financiamiento/clientes/editar/${id}`)}>
                        <ion-icon name="create-outline"></ion-icon>
                        Editar
                    </button>
                    <button className={estilos.btnContrato}
                        onClick={() => router.push(`/financiamiento/contratos/nuevo?clienteId=${id}`)}>
                        <ion-icon name="add-outline"></ion-icon>
                        Nuevo Contrato
                    </button>
                </div>
            </div>

            {/* PERFIL */}
            <div className={estilos.perfilCard}>
                <div className={estilos.avatarGrande}>{inicial}</div>
                <div className={estilos.perfilInfo}>
                    <h1 className={estilos.perfilNombre}>{nombreCompleto}</h1>
                    <p className={estilos.perfilDoc}>{cliente.numero_documento || '—'}</p>
                    <div className={estilos.perfilMeta}>
                        {cliente.telefono && <span><ion-icon name="call-outline"></ion-icon> {cliente.telefono}</span>}
                        {cliente.email    && <span><ion-icon name="mail-outline"></ion-icon> {cliente.email}</span>}
                        {cliente.municipio && <span><ion-icon name="location-outline"></ion-icon> {cliente.municipio}{cliente.provincia ? ', ' + cliente.provincia : ''}</span>}
                    </div>
                </div>
                {cliente.clasificacion && (
                    <div className={estilos.clasificacionBadge}>
                        <span className={estilos[`clase${cliente.clasificacion}`]}>{cliente.clasificacion}</span>
                        <span className={estilos.clasificacionLabel}>Clasificación</span>
                    </div>
                )}
            </div>

            {/* STATS */}
            <div className={estilos.statsGrid}>
                <div className={estilos.statCard}>
                    <div className={`${estilos.statIcono} ${estilos.blue}`}><ion-icon name="document-text-outline"></ion-icon></div>
                    <div><span className={estilos.statValor}>{contratos.length}</span><span className={estilos.statLabel}>Contratos</span></div>
                </div>
                <div className={estilos.statCard}>
                    <div className={`${estilos.statIcono} ${estilos.green}`}><ion-icon name="checkmark-circle-outline"></ion-icon></div>
                    <div><span className={estilos.statValor}>{totalActivos}</span><span className={estilos.statLabel}>Activos</span></div>
                </div>
                <div className={estilos.statCard}>
                    <div className={`${estilos.statIcono} ${estilos.red}`}><ion-icon name="warning-outline"></ion-icon></div>
                    <div><span className={estilos.statValor}>{totalVencidas}</span><span className={estilos.statLabel}>Cuotas vencidas</span></div>
                </div>
                <div className={estilos.statCard}>
                    <div className={`${estilos.statIcono} ${estilos.orange}`}><ion-icon name="cash-outline"></ion-icon></div>
                    <div><span className={estilos.statValor}>{fmt(saldoTotal)}</span><span className={estilos.statLabel}>Saldo pendiente</span></div>
                </div>
            </div>

            {/* CONTRATOS */}
            <div className={estilos.seccion}>
                <h2 className={estilos.seccionTitulo}>
                    <ion-icon name="document-text-outline"></ion-icon> Contratos
                </h2>

                {contratos.length === 0 ? (
                    <div className={estilos.vacio}>
                        <ion-icon name="document-outline" style={{ fontSize: '2.5rem' }}></ion-icon>
                        <p>Sin contratos registrados</p>
                        <button className={estilos.btnContrato}
                            onClick={() => router.push(`/financiamiento/contratos/nuevo?clienteId=${id}`)}>
                            <ion-icon name="add-outline"></ion-icon> Crear primer contrato
                        </button>
                    </div>
                ) : (
                    <div className={estilos.contratosGrid}>
                        {contratos.map(c => {
                            const est = ESTADO_COLOR[c.estado] || ESTADO_COLOR.cancelado
                            const progreso = c.total_cuotas > 0
                                ? Math.round((parseInt(c.cuotas_pagadas) / parseInt(c.total_cuotas)) * 100)
                                : 0
                            return (
                                <div key={c.id} className={estilos.contratoCard}
                                    onClick={() => router.push(`/financiamiento/contratos/ver/${c.id}`)}>
                                    <div className={estilos.contratoHeader}>
                                        <div>
                                            <div className={estilos.contratoNumero}>{c.numero_contrato || `#${c.id}`}</div>
                                            <div className={estilos.contratoPlan}>{c.plan_nombre || '—'}</div>
                                        </div>
                                        <span className={`${estilos.badge} ${estilos[est.cls]}`}>{est.label}</span>
                                    </div>

                                    <div className={estilos.contratoMontos}>
                                        <div>
                                            <span className={estilos.montoLabel}>Financiado</span>
                                            <span className={estilos.montoValor}>{fmt(c.monto_financiado)}</span>
                                        </div>
                                        <div>
                                            <span className={estilos.montoLabel}>Cuota</span>
                                            <span className={estilos.montoValor}>{fmt(c.cuota_mensual)}</span>
                                        </div>
                                        <div>
                                            <span className={estilos.montoLabel}>Pendiente</span>
                                            <span className={`${estilos.montoValor} ${parseFloat(c.saldo_pendiente) > 0 ? estilos.montoRed : ''}`}>{fmt(c.saldo_pendiente)}</span>
                                        </div>
                                    </div>

                                    <div className={estilos.progresoWrapper}>
                                        <div className={estilos.progresoLabel}>
                                            <span>{c.cuotas_pagadas}/{c.total_cuotas} cuotas</span>
                                            <span>{progreso}%</span>
                                        </div>
                                        <div className={estilos.progresoBar}>
                                            <div className={estilos.progresoFill} style={{ width: `${progreso}%` }}></div>
                                        </div>
                                    </div>

                                    {parseInt(c.cuotas_vencidas) > 0 && (
                                        <div className={estilos.alertaVencidas}>
                                            <ion-icon name="warning-outline"></ion-icon>
                                            {c.cuotas_vencidas} cuota{c.cuotas_vencidas !== 1 ? 's' : ''} vencida{c.cuotas_vencidas !== 1 ? 's' : ''}
                                        </div>
                                    )}

                                    <div className={estilos.contratoFechas}>
                                        <span>Inicio: {fmtFecha(c.fecha_inicio)}</span>
                                        <span>Fin: {fmtFecha(c.fecha_fin)}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
