"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import estilos from '../credito.module.css'
import { obtenerListaNegra } from './servidor'
import { obtenerDatosEmpresa } from '../servidor'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const PAGE_SIZE = 30

export default function ListaNegra() {
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
            const res = await obtenerListaNegra({ busqueda: b, pagina: p, limite: PAGE_SIZE })
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
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.3)', borderRadius:'14px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'24px' }}>
                <ion-icon name="warning-outline" style={{ fontSize:'2rem', color:'#ef4444', flexShrink:0 }}></ion-icon>
                <div>
                    <strong style={{ display:'block', fontSize:'15px', color:'#b91c1c' }}>Lista Negra — Clientes con Mal Historial</strong>
                    <span style={{ fontSize:'13px', color:'#ef4444' }}>Clientes con cuotas vencidas, clasificacion C/D o credito bloqueado/atrasado en cualquier empresa</span>
                </div>
            </div>

            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Lista Negra</h1>
                    <p className={estilos.subtitulo}>{total} cliente{total !== 1 ? 's' : ''} con mal historial crediticio</p>
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
                <button type="submit" className={estilos.btnDanger} style={{ padding:'10px 20px', borderRadius:'10px', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px' }}>
                    <ion-icon name="search-outline"></ion-icon> Buscar
                </button>
            </form>

            {cargando ? <LoadingScreen /> : clientes.length === 0 ? (
                <div className={estilos.cargando}>
                    <ion-icon name="checkmark-circle-outline" style={{ fontSize:'3.5rem', color:'var(--success-color)' }}></ion-icon>
                    <p>{busqueda ? 'Sin resultados' : 'No hay clientes en lista negra'}</p>
                </div>
            ) : (
                <>
                    <div className={estilos.tabla} style={{ padding:0 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 0.8fr 0.8fr auto', gap:'12px', padding:'12px 20px', borderBottom:'2px solid var(--border-color)', fontWeight:700, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-secondary)' }}>
                            <div>Cliente</div><div>Empresa</div><div>Contratos</div><div>Cuotas vencidas</div><div>Clasificacion</div><div>Saldo en riesgo</div><div></div>
                        </div>

                        {clientes.map(c => (
                            <div key={c.id} className={estilos.fila} style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr 0.8fr 0.8fr auto', gap:'12px', alignItems:'center', background: parseInt(c.cuotas_vencidas) > 3 ? 'rgba(239,68,68,0.04)' : undefined }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
                                    <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:700, flexShrink:0 }}>{c.nombre_completo?.charAt(0)}</div>
                                    <div style={{ minWidth:0 }}>
                                        <div style={{ fontWeight:700, fontSize:'14px', color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.nombre_completo}</div>
                                        <div style={{ fontSize:'11px', color:'var(--text-tertiary)' }}>{c.numero_documento || '—'}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize:'13px', color:'var(--text-secondary)' }}>{c.nombre_empresa || '—'}</div>
                                <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>{c.total_contratos || 0}</div>
                                <div>
                                    {parseInt(c.cuotas_vencidas) > 0
                                        ? <span style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:700 }}>
                                            {c.cuotas_vencidas} · {c.dias_mora > 0 ? `${c.dias_mora}d` : ''}
                                          </span>
                                        : <span style={{ color:'var(--text-tertiary)' }}>—</span>
                                    }
                                </div>
                                <div>{c.clasificacion ? <span className={estilos[`clasificacion${c.clasificacion}`]}>{c.clasificacion}</span> : <span style={{ color:'var(--text-tertiary)' }}>—</span>}</div>
                                <div style={{ fontSize:'13px', fontWeight:700, color:'#ef4444' }}>{fmt(c.saldo_en_riesgo)}</div>
                                <button onClick={() => router.push(`/admin/depuracion/ver?id=${c.id}`)} title="Ver detalle"
                                    style={{ width:'34px', height:'34px', borderRadius:'8px', border:'1.5px solid rgba(239,68,68,0.3)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444', fontSize:'17px', transition:'all 0.2s', flexShrink:0 }}
                                    onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)' }}
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
