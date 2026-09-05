"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerClientesFinanciamiento, obtenerDatosEmpresa, crearClienteFinanciamiento } from './servidor'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'
import estilos from './clientes.module.css'

const PAGE_SIZE = 30

function badgeEstado(c) {
    const vencidas = parseInt(c.cuotas_vencidas || 0)
    const clase    = c.clasificacion
    const estado   = c.estado_credito
    const activos  = parseInt(c.contratos_activos || 0)

    if (vencidas > 0 || clase === 'D' || estado === 'bloqueado' || estado === 'atrasado') {
        return { texto: 'En mora', cls: 'badgeRed', icon: 'warning-outline' }
    }
    if (clase === 'A' || clase === 'B') {
        return { texto: 'Buen pagador', cls: 'badgeGreen', icon: 'shield-checkmark-outline' }
    }
    if (activos > 0) {
        return { texto: 'Activo', cls: 'badgeBlue', icon: 'person-outline' }
    }
    return { texto: 'Sin contrato', cls: 'badgeGray', icon: 'help-circle-outline' }
}

function claseCSS(c) {
    if (!c) return null
    const map = { A: 'claseA', B: 'claseB', C: 'claseC', D: 'claseD' }
    return map[c] || null
}

export default function ClientesFinanciamiento() {
    const router = useRouter()
    const [tema, setTema]               = useState('light')
    const [cargando, setCargando]       = useState(true)
    const [clientes, setClientes]       = useState([])
    const [total, setTotal]             = useState(0)
    const [pagina, setPagina]           = useState(0)
    const [busqueda, setBusqueda]       = useState('')
    const [busquedaTemp, setBusquedaTemp] = useState('')
    const [empresa, setEmpresa]         = useState(null)
    const [modalRapido, setModalRapido]   = useState(false)
    const [formRapido, setFormRapido]     = useState({ nombre: '', apellidos: '', numero_documento: '' })
    const [guardandoRapido, setGuardandoRapido] = useState(false)
    const [errorRapido, setErrorRapido]   = useState('')

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const h = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', h)
        window.addEventListener('storage', h)
        cargarEmpresa()
        return () => {
            window.removeEventListener('temaChange', h)
            window.removeEventListener('storage', h)
        }
    }, [])

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargar = useCallback(async (p = 0, b = busqueda) => {
        setCargando(true)
        try {
            const res = await obtenerClientesFinanciamiento({ busqueda: b, pagina: p, limite: PAGE_SIZE })
            if (res.success) { setClientes(res.clientes); setTotal(res.total) }
        } finally { setCargando(false) }
    }, [busqueda])

    useEffect(() => { cargar(0, busqueda) }, [busqueda])

    useEffect(() => {
        const t = setTimeout(() => {
            setBusqueda(busquedaTemp)
            setPagina(0)
        }, 400)
        return () => clearTimeout(t)
    }, [busquedaTemp])

    const buscar = (e) => {
        e.preventDefault()
        setBusqueda(busquedaTemp)
        setPagina(0)
    }

    function abrirModalRapido() {
        setFormRapido({ nombre: '', apellidos: '', numero_documento: '' })
        setErrorRapido('')
        setModalRapido(true)
    }

    async function guardarRapido(e) {
        e.preventDefault()
        setErrorRapido('')
        if (!formRapido.nombre.trim())           { setErrorRapido('El nombre es requerido'); return }
        if (!formRapido.numero_documento.trim()) { setErrorRapido('El documento es requerido'); return }
        setGuardandoRapido(true)
        try {
            const res = await crearClienteFinanciamiento({
                nombre:            formRapido.nombre.trim(),
                apellidos:         formRapido.apellidos.trim(),
                numero_documento:  formRapido.numero_documento.trim(),
                tipo_documento_id: 1
            })
            if (res.success) {
                setModalRapido(false)
                cargar(0, busqueda)
            } else {
                setErrorRapido(res.mensaje || 'Error al crear cliente')
            }
        } finally { setGuardandoRapido(false) }
    }

    const totalPaginas = Math.ceil(total / PAGE_SIZE)

    const locale   = empresa?.locale || 'es-DO'
    const simbolo  = empresa?.simbolo_moneda || 'RD$'
    const fmt = (v) => {
        const num = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)
        return `${simbolo} ${num}`
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* HEADER */}
            <div className={estilos.header} style={{ alignItems: 'center' }}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}>
                        <ion-icon name="people-outline"></ion-icon>
                    </div>
                    <div>
                        <h1 className={estilos.titulo}>Clientes · Financiamiento</h1>
                        <p className={estilos.subtitulo}>Clientes con contratos, historial de pagos y comportamiento crediticio</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={estilos.btnRapido} onClick={abrirModalRapido}>
                        <ion-icon name="flash-outline"></ion-icon> Cliente Rápido
                    </button>
                    <button className={estilos.btnBuscar}
                        onClick={() => router.push('/admin/financiamiento/clientes/crear')}>
                        <ion-icon name="person-add-outline"></ion-icon> Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* BUSCADOR */}
            <form onSubmit={buscar} className={estilos.buscadorForm}>
                <div className={estilos.buscadorWrapper}>
                    <ion-icon name="search-outline" className={estilos.iconoBuscador}></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, cédula o teléfono..."
                        value={busquedaTemp}
                        onChange={e => setBusquedaTemp(e.target.value)}
                        className={estilos.inputBuscador}
                    />
                    {busquedaTemp && (
                        <button type="button" className={estilos.btnLimpiar}
                            onClick={() => { setBusquedaTemp(''); setBusqueda('') }}>
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    )}
                </div>
                <button type="submit" className={estilos.btnBuscar}>
                    <ion-icon name="search-outline"></ion-icon> Buscar
                </button>
            </form>

            {/* CONTENIDO */}
            {cargando ? <LoadingScreen /> : clientes.length === 0 ? (
                <div className={estilos.cargando}>
                    <ion-icon name="people-outline" style={{ fontSize: '3.5rem' }}></ion-icon>
                    <p>{busqueda ? 'Sin resultados para esa búsqueda' : 'No hay clientes registrados'}</p>
                </div>
            ) : (
                <>
                    <p className={estilos.totalLabel}>
                        {total} cliente{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                    </p>

                    {/* TABLA */}
                    <div className={estilos.tablaWrapper}>
                        {/* CABECERA */}
                        <div className={estilos.tablaCabecera}>
                            <div>Cliente</div>
                            <div>Contacto</div>
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
                            const csClase   = claseCSS(c.clasificacion)

                            return (
                                <div key={c.id} className={estilos.tablaFila}>

                                    {/* CLIENTE */}
                                    <div className={estilos.clienteCell}>
                                        <div className={estilos.avatar}>{iniciales}</div>
                                        <div style={{ minWidth: 0 }}>
                                            <div className={estilos.clienteNombre}>{c.nombre_completo}</div>
                                            <div className={estilos.clienteDoc}>{c.numero_documento || '—'}</div>
                                        </div>
                                    </div>

                                    {/* CONTACTO */}
                                    <div className={estilos.contacto}>{c.telefono || c.email || '—'}</div>

                                    {/* CONTRATOS */}
                                    <div>
                                        <span className={estilos.contratoNum}><strong>{c.total_contratos || 0}</strong></span>
                                        <span className={estilos.contratoSub}> ({c.contratos_activos || 0} activo{c.contratos_activos !== 1 ? 's' : ''})</span>
                                    </div>

                                    {/* CUOTAS VENCIDAS */}
                                    <div>
                                        {vencidas > 0
                                            ? <span className={estilos.vencidaBadge}>{vencidas} vencida{vencidas !== 1 ? 's' : ''}</span>
                                            : <span className={estilos.sinDato}>—</span>
                                        }
                                    </div>

                                    {/* CLASIFICACION */}
                                    <div>
                                        {csClase
                                            ? <span className={estilos[csClase]}>{c.clasificacion}</span>
                                            : <span className={estilos.sinDato}>—</span>
                                        }
                                    </div>

                                    {/* SALDO */}
                                    <div className={estilos.saldo}>{fmt(c.saldo_utilizado)}</div>

                                    {/* ESTADO */}
                                    <div>
                                        <span className={`${estilos.badge} ${estilos[badge.cls]}`}>
                                            <ion-icon name={badge.icon}></ion-icon>
                                            {badge.texto}
                                        </span>
                                    </div>

                                    {/* VER */}
                                    <button
                                        className={estilos.btnVer}
                                        onClick={() => router.push(`/admin/financiamiento/clientes/ver/${c.id}`)}
                                        title="Ver cliente"
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    {/* PAGINACION */}
                    {totalPaginas > 1 && (
                        <div className={estilos.paginacion}>
                            <button className={estilos.btnPagina} disabled={pagina === 0}
                                onClick={() => { setPagina(pagina - 1); cargar(pagina - 1) }}>
                                <ion-icon name="chevron-back-outline"></ion-icon>
                            </button>
                            <span className={estilos.paginaInfo}>{pagina + 1} / {totalPaginas}</span>
                            <button className={estilos.btnPagina} disabled={pagina >= totalPaginas - 1}
                                onClick={() => { setPagina(pagina + 1); cargar(pagina + 1) }}>
                                <ion-icon name="chevron-forward-outline"></ion-icon>
                            </button>
                        </div>
                    )}
                </>
            )}
            {/* MODAL CLIENTE RÁPIDO */}
            {modalRapido && (
                <div className={estilos.modalOverlay} onClick={() => setModalRapido(false)}>
                    <div className={estilos.modalCard} onClick={e => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <div className={estilos.modalIcono}><ion-icon name="flash-outline"></ion-icon></div>
                            <div>
                                <h2 className={estilos.modalTitulo}>Cliente Rápido</h2>
                                <p className={estilos.modalSubtitulo}>Solo nombre y documento</p>
                            </div>
                            <button className={estilos.modalCerrar} onClick={() => setModalRapido(false)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        {errorRapido && (
                            <div className={estilos.alertaError}>
                                <ion-icon name="alert-circle-outline"></ion-icon> {errorRapido}
                            </div>
                        )}

                        <form onSubmit={guardarRapido} className={estilos.modalForm}>
                            <div className={estilos.modalFila}>
                                <div className={estilos.modalCampo}>
                                    <label className={estilos.modalLabel}>Nombre *</label>
                                    <input autoFocus className={estilos.modalInput}
                                        placeholder="Nombre"
                                        value={formRapido.nombre}
                                        onChange={e => setFormRapido(p => ({ ...p, nombre: e.target.value }))} />
                                </div>
                                <div className={estilos.modalCampo}>
                                    <label className={estilos.modalLabel}>Apellidos</label>
                                    <input className={estilos.modalInput}
                                        placeholder="Apellidos"
                                        value={formRapido.apellidos}
                                        onChange={e => setFormRapido(p => ({ ...p, apellidos: e.target.value }))} />
                                </div>
                            </div>
                            <div className={estilos.modalCampo}>
                                <label className={estilos.modalLabel}>Número de documento *</label>
                                <input className={estilos.modalInput}
                                    placeholder="000-0000000-0"
                                    value={formRapido.numero_documento}
                                    onChange={e => setFormRapido(p => ({ ...p, numero_documento: e.target.value }))} />
                            </div>
                            <div className={estilos.modalAcciones}>
                                <button type="button" className={estilos.modalBtnCancelar}
                                    onClick={() => setModalRapido(false)}>Cancelar</button>
                                <button type="submit" className={estilos.modalBtnGuardar} disabled={guardandoRapido}>
                                    {guardandoRapido
                                        ? <><div className={estilos.spinnerSmall}></div> Guardando...</>
                                        : <><ion-icon name="flash-outline"></ion-icon> Crear rápido</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
