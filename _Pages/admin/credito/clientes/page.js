"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import estilos from '../credito.module.css'
import { obtenerClientesCredito } from './servidor'
import { obtenerDatosEmpresa } from '../servidor'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const PAGE_SIZE = 30

function badgeEstado(c) {
    const vencidas  = parseInt(c.cuotas_vencidas  || 0)
    const clase     = c.clasificacion
    const estado    = c.estado_credito
    const activos   = parseInt(c.contratos_activos || 0)

    if (vencidas > 0 || clase === 'D' || clase === 'C' || estado === 'bloqueado' || estado === 'atrasado') {
        return { texto: 'Lista Negra', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: 'warning-outline' }
    }
    if (clase === 'A' || clase === 'B') {
        return { texto: 'Recomendado', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: 'shield-checkmark-outline' }
    }
    if (activos > 0) {
        return { texto: 'Activo', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: 'person-outline' }
    }
    return { texto: 'Sin historial', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: 'help-circle-outline' }
}

export default function ClientesCredito() {
    const router  = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [clientes, setClientes] = useState([])
    const [total, setTotal] = useState(0)
    const [pagina, setPagina] = useState(0)
    const [busqueda, setBusqueda] = useState('')
    const [busquedaTemp, setBusquedaTemp] = useState('')
    const [empresa, setEmpresa] = useState(null)

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const h = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', h)
        cargarEmpresa()
        return () => window.removeEventListener('temaChange', h)
    }, [])

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargar = useCallback(async (p = 0, b = busqueda) => {
        setCargando(true)
        try {
            const res = await obtenerClientesCredito({ busqueda: b, pagina: p, limite: PAGE_SIZE })
            if (res.success) { setClientes(res.clientes); setTotal(res.total) }
        } finally { setCargando(false) }
    }, [busqueda])

    useEffect(() => { cargar(0, busqueda) }, [busqueda])

    const buscar = (e) => {
        e.preventDefault()
        setBusqueda(busquedaTemp)
        setPagina(0)
    }

    const totalPaginas = Math.ceil(total / PAGE_SIZE)

    const localeEmpresa = empresa?.locale || 'es-DO'
    const monedaEmpresa = empresa?.moneda || 'DOP'

    const fmt = (v) => new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa }).format(v || 0)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Clientes · Historial Crediticio</h1>
                    <p className={estilos.subtitulo}>Todos los clientes del sistema con sus contratos y comportamiento de pago</p>
                </div>
            </div>

            {/* BUSCADOR */}
            <form onSubmit={buscar} style={{ display:'flex', gap:'10px', marginBottom:'24px' }}>
                <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center', border:'1.5px solid var(--border-color)', borderRadius:'10px', background:'var(--bg-primary)', overflow:'hidden' }}>
                    <ion-icon name="search-outline" style={{ position:'absolute', left:'12px', color:'#94a3b8', fontSize:'17px', pointerEvents:'none' }}></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, cedula o telefono..."
                        value={busquedaTemp}
                        onChange={e => setBusquedaTemp(e.target.value)}
                        style={{ width:'100%', padding:'11px 12px 11px 38px', background:'transparent', border:'none', outline:'none', fontSize:'14px', color:'var(--text-primary)' }}
                    />
                    {busquedaTemp && (
                        <button type="button" onClick={() => { setBusquedaTemp(''); setBusqueda('') }}
                            style={{ background:'transparent', border:'none', cursor:'pointer', padding:'4px 10px', color:'#94a3b8', fontSize:'18px' }}>
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    )}
                </div>
                <button type="submit" className={estilos.btnPrimary} style={{ padding:'10px 20px', borderRadius:'10px', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px' }}>
                    <ion-icon name="search-outline"></ion-icon> Buscar
                </button>
            </form>

            {/* TABLA */}
            {cargando ? <LoadingScreen /> : clientes.length === 0 ? (
                <div className={estilos.cargando}>
                    <ion-icon name="people-outline" style={{ fontSize:'3.5rem', color:'var(--text-tertiary)' }}></ion-icon>
                    <p>{busqueda ? 'Sin resultados para esa búsqueda' : 'No hay clientes registrados'}</p>
                </div>
            ) : (
                <>
                    <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginBottom:'12px' }}>
                        {total} cliente{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                    </p>
                    <div className={estilos.tabla} style={{ padding:0 }}>
                        {/* CABECERA */}
                        <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 0.8fr 0.8fr 0.8fr auto', gap:'12px', padding:'12px 20px', borderBottom:'2px solid var(--border-color)', fontWeight:700, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-secondary)' }}>
                            <div>Cliente</div>
                            <div>Empresa</div>
                            <div>Contratos</div>
                            <div>Cuotas vencidas</div>
                            <div>Clasificación</div>
                            <div>Saldo usado</div>
                            <div>Estado</div>
                            <div></div>
                        </div>

                        {/* FILAS */}
                        {clientes.map(c => {
                            const badge    = badgeEstado(c)
                            const iniciales = c.nombre_completo?.charAt(0)?.toUpperCase()
                            const vencidas  = parseInt(c.cuotas_vencidas || 0)

                            return (
                                <div key={c.id} className={estilos.fila} style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 0.8fr 0.8fr 0.8fr auto', gap:'12px', alignItems:'center' }}>
                                    {/* CLIENTE */}
                                    <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
                                        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:700, flexShrink:0 }}>{iniciales}</div>
                                        <div style={{ minWidth:0 }}>
                                            <div style={{ fontWeight:700, fontSize:'14px', color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.nombre_completo}</div>
                                            <div style={{ fontSize:'11px', color:'var(--text-tertiary)' }}>{c.numero_documento || '—'}</div>
                                        </div>
                                    </div>

                                    {/* EMPRESA */}
                                    <div style={{ fontSize:'13px', color:'var(--text-secondary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.nombre_empresa || '—'}</div>

                                    {/* CONTRATOS */}
                                    <div style={{ fontSize:'13px' }}>
                                        <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{c.total_contratos || 0}</span>
                                        <span style={{ color:'var(--text-tertiary)', fontSize:'11px' }}>
                                            {' '}({c.contratos_activos || 0} activo{c.contratos_activos !== 1 ? 's' : ''})
                                        </span>
                                    </div>

                                    {/* CUOTAS VENCIDAS */}
                                    <div>
                                        {vencidas > 0
                                            ? <span style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:700 }}>{vencidas} vencida{vencidas !== 1 ? 's' : ''}</span>
                                            : <span style={{ color:'var(--text-tertiary)', fontSize:'13px' }}>—</span>
                                        }
                                    </div>

                                    {/* CLASIFICACION */}
                                    <div>
                                        {c.clasificacion
                                            ? <span className={estilos[`clasificacion${c.clasificacion}`]}>{c.clasificacion}</span>
                                            : <span style={{ color:'var(--text-tertiary)', fontSize:'13px' }}>—</span>
                                        }
                                    </div>

                                    {/* SALDO */}
                                    <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>{fmt(c.saldo_utilizado)}</div>

                                    {/* ESTADO BADGE */}
                                    <div>
                                        <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:badge.bg, color:badge.color, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, whiteSpace:'nowrap' }}>
                                            <ion-icon name={badge.icon} style={{ fontSize:'13px' }}></ion-icon>
                                            {badge.texto}
                                        </span>
                                    </div>

                                    {/* VER */}
                                    <button
                                        onClick={() => router.push(`/admin/depuracion/ver?id=${c.id}`)}
                                        title="Ver detalle"
                                        style={{ width:'34px', height:'34px', borderRadius:'8px', border:'1.5px solid var(--border-color)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#0ea5e9', fontSize:'17px', transition:'all 0.2s', flexShrink:0 }}
                                        onMouseEnter={e => { e.currentTarget.style.background='#e0f2fe'; e.currentTarget.style.borderColor='#0ea5e9' }}
                                        onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='var(--border-color)' }}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    {/* PAGINACION */}
                    {totalPaginas > 1 && (
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', marginTop:'20px' }}>
                            <button disabled={pagina === 0} onClick={() => { setPagina(pagina-1); cargar(pagina-1) }}
                                style={{ width:'36px', height:'36px', borderRadius:'9px', border:'1.5px solid var(--border-color)', background:'transparent', cursor:'pointer', fontSize:'18px', color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', opacity: pagina === 0 ? 0.35 : 1 }}>
                                <ion-icon name="chevron-back-outline"></ion-icon>
                            </button>
                            <span style={{ fontSize:'13px', fontWeight:600, color:'var(--text-secondary)' }}>{pagina+1} / {totalPaginas}</span>
                            <button disabled={pagina >= totalPaginas-1} onClick={() => { setPagina(pagina+1); cargar(pagina+1) }}
                                style={{ width:'36px', height:'36px', borderRadius:'9px', border:'1.5px solid var(--border-color)', background:'transparent', cursor:'pointer', fontSize:'18px', color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', opacity: pagina >= totalPaginas-1 ? 0.35 : 1 }}>
                                <ion-icon name="chevron-forward-outline"></ion-icon>
                            </button>
                        </div>
                    )}
                </>
            )}

            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
