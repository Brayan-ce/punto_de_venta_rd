"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import estilos from '../credito.module.css'
import { obtenerListaRecomendada } from './servidor'
import { obtenerDatosEmpresa } from '../servidor'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const PAGE_SIZE = 30

export default function ListaRecomendada() {
    const router = useRouter()
    const [tema, setTema]         = useState('light')
    const [cargando, setCargando] = useState(true)
    const [clientes, setClientes] = useState([])
    const [total, setTotal]       = useState(0)
    const [pagina, setPagina]     = useState(0)
    const [busqueda, setBusqueda]         = useState('')
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
            const res = await obtenerListaRecomendada({ busqueda: b, pagina: p, limite: PAGE_SIZE })
            if (res.success) { setClientes(res.clientes); setTotal(res.total) }
        } finally { setCargando(false) }
    }, [busqueda])

    useEffect(() => { cargar(0, busqueda) }, [busqueda])

    const buscar = (e) => { e.preventDefault(); setBusqueda(busquedaTemp); setPagina(0) }
    const totalPaginas = Math.ceil(total / PAGE_SIZE)

    const localeEmpresa = empresa?.locale || 'es-DO'
    const monedaEmpresa = empresa?.moneda || 'DOP'

    const fmt = (v) => new Intl.NumberFormat(localeEmpresa, { style:'currency', currency: monedaEmpresa }).format(v || 0)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* BANNER */}
            <div style={{ background:'rgba(16,185,129,0.08)', border:'1.5px solid rgba(16,185,129,0.3)', borderRadius:'14px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'24px' }}>
                <ion-icon name="shield-checkmark-outline" style={{ fontSize:'2rem', color:'#10b981', flexShrink:0 }}></ion-icon>
                <div>
                    <strong style={{ display:'block', fontSize:'15px', color:'#065f46' }}>Lista Recomendada — Buen Historial Crediticio</strong>
                    <span style={{ fontSize:'13px', color:'#10b981' }}>Clientes sin cuotas vencidas, clasificacion A/B y buen comportamiento de pago en todo el sistema</span>
                </div>
            </div>

            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Lista Recomendada</h1>
                    <p className={estilos.subtitulo}>{total} cliente{total !== 1 ? 's' : ''} con excelente historial</p>
                </div>
            </div>

            {/* BUSCADOR */}
            <form onSubmit={buscar} style={{ display:'flex', gap:'10px', marginBottom:'24px' }}>
                <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center', border:'1.5px solid var(--border-color)', borderRadius:'10px', background:'var(--bg-primary)', overflow:'hidden' }}>
                    <ion-icon name="search-outline" style={{ position:'absolute', left:'12px', color:'#94a3b8', fontSize:'17px', pointerEvents:'none' }}></ion-icon>
                    <input type="text" placeholder="Buscar por nombre, cedula..." value={busquedaTemp} onChange={e => setBusquedaTemp(e.target.value)}
                        style={{ width:'100%', padding:'11px 12px 11px 38px', background:'transparent', border:'none', outline:'none', fontSize:'14px', color:'var(--text-primary)' }} />
                    {busquedaTemp && <button type="button" onClick={() => { setBusquedaTemp(''); setBusqueda('') }} style={{ background:'transparent', border:'none', cursor:'pointer', padding:'4px 10px', color:'#94a3b8', fontSize:'18px' }}><ion-icon name="close-outline"></ion-icon></button>}
                </div>
                <button type="submit" className={estilos.btnSuccess} style={{ padding:'10px 20px', borderRadius:'10px', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px' }}>
                    <ion-icon name="search-outline"></ion-icon> Buscar
                </button>
            </form>

            {cargando ? <LoadingScreen /> : clientes.length === 0 ? (
                <div className={estilos.cargando}>
                    <ion-icon name="people-outline" style={{ fontSize:'3.5rem', color:'var(--text-tertiary)' }}></ion-icon>
                    <p>{busqueda ? 'Sin resultados' : 'No hay clientes recomendados aun'}</p>
                </div>
            ) : (
                <>
                    <div className={estilos.tabla} style={{ padding:0 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 0.8fr 0.8fr auto', gap:'12px', padding:'12px 20px', borderBottom:'2px solid var(--border-color)', fontWeight:700, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-secondary)' }}>
                            <div>Cliente</div><div>Empresa</div><div>Contratos</div><div>Pagados</div><div>Clasificacion</div><div>Score</div><div></div>
                        </div>

                        {clientes.map(c => (
                            <div key={c.id} className={estilos.fila} style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 0.8fr 0.8fr auto', gap:'12px', alignItems:'center' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
                                    <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:700, flexShrink:0 }}>{c.nombre_completo?.charAt(0)}</div>
                                    <div style={{ minWidth:0 }}>
                                        <div style={{ fontWeight:700, fontSize:'14px', color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.nombre_completo}</div>
                                        <div style={{ fontSize:'11px', color:'var(--text-tertiary)' }}>{c.numero_documento || '—'}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize:'13px', color:'var(--text-secondary)' }}>{c.nombre_empresa || '—'}</div>
                                <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>{c.total_contratos || 0}</div>
                                <div><span style={{ background:'rgba(16,185,129,0.1)', color:'#10b981', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:700 }}>{c.contratos_pagados || 0} pagado{c.contratos_pagados !== 1 ? 's' : ''}</span></div>
                                <div>{c.clasificacion ? <span className={estilos[`clasificacion${c.clasificacion}`]}>{c.clasificacion}</span> : <span style={{ background:'rgba(16,185,129,0.1)', color:'#10b981', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:700 }}>Al dia</span>}</div>
                                <div style={{ fontSize:'14px', fontWeight:700, color: c.score_crediticio >= 700 ? '#10b981' : c.score_crediticio >= 500 ? '#3b82f6' : 'var(--text-secondary)' }}>{c.score_crediticio || '—'}</div>
                                <button onClick={() => router.push(`/admin/depuracion/ver?id=${c.id}`)} title="Ver detalle"
                                    style={{ width:'34px', height:'34px', borderRadius:'8px', border:'1.5px solid rgba(16,185,129,0.3)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#10b981', fontSize:'17px', transition:'all 0.2s', flexShrink:0 }}
                                    onMouseEnter={e => { e.currentTarget.style.background='rgba(16,185,129,0.1)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background='transparent' }}>
                                    <ion-icon name="eye-outline"></ion-icon>
                                </button>
                            </div>
                        ))}
                    </div>

                    {totalPaginas > 1 && (
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', marginTop:'20px' }}>
                            <button disabled={pagina===0} onClick={() => { setPagina(pagina-1); cargar(pagina-1) }}
                                style={{ width:'36px', height:'36px', borderRadius:'9px', border:'1.5px solid var(--border-color)', background:'transparent', cursor:'pointer', fontSize:'18px', color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', opacity:pagina===0?0.35:1 }}>
                                <ion-icon name="chevron-back-outline"></ion-icon></button>
                            <span style={{ fontSize:'13px', fontWeight:600, color:'var(--text-secondary)' }}>{pagina+1} / {totalPaginas}</span>
                            <button disabled={pagina>=totalPaginas-1} onClick={() => { setPagina(pagina+1); cargar(pagina+1) }}
                                style={{ width:'36px', height:'36px', borderRadius:'9px', border:'1.5px solid var(--border-color)', background:'transparent', cursor:'pointer', fontSize:'18px', color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', opacity:pagina>=totalPaginas-1?0.35:1 }}>
                                <ion-icon name="chevron-forward-outline"></ion-icon></button>
                        </div>
                    )}
                </>
            )}
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
