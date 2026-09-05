"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    obtenerClientesConCredito,
    obtenerEstadisticasCredito,
    obtenerDatosEmpresa
} from "./servidor"
import { obtenerListaNegra } from "../credito/lista-negra/servidor"
import { obtenerListaRecomendada } from "../credito/lista-recomendada/servidor"
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from "./depuracion.module.css"
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const PAGE_SIZE = 30

export default function DepuracionAdmin() {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    // Estados
    const [tema, setTema] = useState("light")
    const [cargando, setCargando] = useState(true)
    const [cargandoClientes, setCargandoClientes] = useState(false)
    const [clientes, setClientes] = useState([])
    const [totalClientes, setTotalClientes] = useState(0)
    const [paginaClientes, setPaginaClientes] = useState(0)
    const [estadisticas, setEstadisticas] = useState(null)
    const [tabActiva, setTabActiva] = useState("dashboard")
    const [listaNegra, setListaNegra] = useState([])
    const [totalListaNegra, setTotalListaNegra] = useState(0)
    const [paginaListaNegra, setPaginaListaNegra] = useState(0)
    const [listaRecomendada, setListaRecomendada] = useState([])
    const [totalListaRecomendada, setTotalListaRecomendada] = useState(0)
    const [paginaListaRecomendada, setPaginaListaRecomendada] = useState(0)
    const [cargandoLista, setCargandoLista] = useState(false)
    const [empresa, setEmpresa] = useState(null)

    // Búsqueda clientes
    const [busqueda, setBusqueda] = useState("")
    const [busquedaTemp, setBusquedaTemp] = useState("")
    const debounceRef = useRef(null)

    const handleBusquedaHeader = useCallback((valor) => {
        setBusquedaTemp(valor)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!valor.trim()) {
            setBusqueda("")
            buscarClientes("", 0)
            return
        }
        debounceRef.current = setTimeout(() => {
            setBusqueda(valor)
            buscarClientes(valor, 0)
            setTabActiva("clientes")
        }, 400)
    }, [])
    const [busquedaListaNegra, setBusquedaListaNegra] = useState("")
    const [busquedaTempListaNegra, setBusquedaTempListaNegra] = useState("")
    const [busquedaListaRecomendada, setBusquedaListaRecomendada] = useState("")
    const [busquedaTempListaRecomendada, setBusquedaTempListaRecomendada] = useState("")

    // Tema
    useEffect(() => {
        const temaLocal = localStorage.getItem("tema") || "light"
        setTema(temaLocal)

        const manejarCambioTema = () => {
            setTema(localStorage.getItem("tema") || "light")
        }

        window.addEventListener("temaChange", manejarCambioTema)
        window.addEventListener("storage", manejarCambioTema)
        cargarEmpresa()

        return () => {
            window.removeEventListener("temaChange", manejarCambioTema)
            window.removeEventListener("storage", manejarCambioTema)
        }
    }, [])

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    // Cargar datos
    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [clientesRes, statsRes, negraRes, recomendadaRes] = await Promise.all([
                obtenerClientesConCredito({ pagina: 0, limite: PAGE_SIZE }),
                obtenerEstadisticasCredito(),
                // Solo pedimos 1 registro para obtener el total sin cargar toda la lista.
                obtenerListaNegra({ limite: 1 }),
                obtenerListaRecomendada({ limite: 1 })
            ])

            if (clientesRes.success) {
                setClientes(clientesRes.clientes)
                setTotalClientes(clientesRes.total || 0)
                setPaginaClientes(0)
            }
            if (statsRes.success) setEstadisticas(statsRes.estadisticas)
            if (negraRes?.success) setTotalListaNegra(negraRes.total || 0)
            if (recomendadaRes?.success) setTotalListaRecomendada(recomendadaRes.total || 0)

        } catch (error) {
            console.error("Error al cargar datos:", error)
        } finally {
            setCargando(false)
        }
    }

    const buscarClientes = async (b, pagina = 0) => {
        setCargandoClientes(true)
        try {
            const res = await obtenerClientesConCredito({ busqueda: b, pagina, limite: PAGE_SIZE })
            if (res.success) {
                setClientes(res.clientes)
                setTotalClientes(res.total || 0)
                setPaginaClientes(pagina)
            }
        } finally { setCargandoClientes(false) }
    }

    const cargarListaNegra = async (pagina = 0, b = busquedaListaNegra) => {
        setCargandoLista(true)
        try {
            const res = await obtenerListaNegra({ busqueda: b, pagina, limite: PAGE_SIZE })
            if (res.success) {
                setListaNegra(res.clientes)
                setTotalListaNegra(res.total)
                setPaginaListaNegra(pagina)
                setBusquedaListaNegra(b)
            }
        } finally { setCargandoLista(false) }
    }

    const cargarListaRecomendada = async (pagina = 0, b = busquedaListaRecomendada) => {
        setCargandoLista(true)
        try {
            const res = await obtenerListaRecomendada({ busqueda: b, pagina, limite: PAGE_SIZE })
            if (res.success) {
                setListaRecomendada(res.clientes)
                setTotalListaRecomendada(res.total)
                setPaginaListaRecomendada(pagina)
                setBusquedaListaRecomendada(b)
            }
        } finally { setCargandoLista(false) }
    }

    // Utilidades
    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : "es-DO")
    const monedaEmpresa = empresa?.moneda || 'DOP'

    const formatearMoneda = (valor) =>
        new Intl.NumberFormat(localeEmpresa, { style: "currency", currency: monedaEmpresa }).format(valor || 0)

    if (cargando) {
        return <LoadingScreen />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* HEADER */}
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <div className={estilos.tituloIcono}>
                        <ion-icon name="analytics-outline"></ion-icon>
                        <h1 className={estilos.titulo}>Isicrub</h1>
                    </div>
                    <p className={estilos.subtitulo}>
                        {tr('Gestión integral del crédito comercial de clientes', 'Comprehensive customer commercial credit management')}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <form onSubmit={(e) => { e.preventDefault(); setBusqueda(busquedaTemp); buscarClientes(busquedaTemp, 0); setTabActiva('clientes') }}
                          style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
                        <div className={estilos.busqueda} style={{ flex: 1 }}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input
                                type="text"
                                placeholder={tr('Buscar cliente...', 'Search customer...')}
                                value={busquedaTemp}
                                onChange={e => handleBusquedaHeader(e.target.value)}
                                className={estilos.inputBusqueda}
                            />
                            {busquedaTemp && (
                                <button type="button"
                                    onClick={() => { setBusquedaTemp(''); setBusqueda(''); buscarClientes('', 0) }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                                    <ion-icon name="close-outline"></ion-icon>
                                </button>
                            )}
                        </div>
                    </form>
                    <button
                        className={estilos.btnRefrescar}
                        onClick={cargarDatos}
                        title={tr('Refrescar datos', 'Refresh data')}
                    >
                        <ion-icon name="refresh-outline"></ion-icon>
                        <span>{tr('Refrescar', 'Refresh')}</span>
                    </button>
                </div>
            </div>

            {/* ESTADÍSTICAS */}
            {estadisticas && !busquedaTemp && (
                <div className={estilos.stats}>
                    <div className={estilos.statCard}>
                        <div className={`${estilos.statIcono} ${estilos.primary}`}>
                            <ion-icon name="people-outline"></ion-icon>
                        </div>
                        <div className={estilos.statInfo}>
                            <span className={estilos.statLabel}>{tr('Total Clientes', 'Total Customers')}</span>
                            <span className={estilos.statValor}>{estadisticas.totalClientes}</span>
                            <span className={estilos.statDetalle}>{estadisticas.clientesNormales} {tr('al día', 'current')}</span>
                        </div>
                    </div>

                    <div className={estilos.statCard}>
                        <div className={`${estilos.statIcono} ${estilos.success}`}>
                            <ion-icon name="card-outline"></ion-icon>
                        </div>
                        <div className={estilos.statInfo}>
                            <span className={estilos.statLabel}>{tr('Crédito Otorgado', 'Granted Credit')}</span>
                            <span className={estilos.statValor}>
                                {formatearMoneda(estadisticas.creditoOtorgado).replace('.00', '')}
                            </span>
                            <span className={estilos.statDetalle}>
                                {formatearMoneda(estadisticas.creditoDisponible).replace('.00', '')} {tr('disponible', 'available')}
                            </span>
                        </div>
                    </div>

                    <div className={estilos.statCard}>
                        <div className={`${estilos.statIcono} ${estilos.danger}`}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                        </div>
                        <div className={estilos.statInfo}>
                            <span className={estilos.statLabel}>{tr('Deuda Vencida', 'Overdue Debt')}</span>
                            <span className={estilos.statValor}>
                                {formatearMoneda(estadisticas.deudaVencida).replace('.00', '')}
                            </span>
                            <span className={estilos.statDetalle}>{tr('Requiere atención', 'Needs attention')}</span>
                        </div>
                    </div>

                    <div className={estilos.statCard}>
                        <div className={`${estilos.statIcono} ${estilos.warning}`}>
                            <ion-icon name="lock-closed-outline"></ion-icon>
                        </div>
                        <div className={estilos.statInfo}>
                            <span className={estilos.statLabel}>{tr('Clientes Bloqueados', 'Blocked Customers')}</span>
                            <span className={estilos.statValor}>{estadisticas.clientesBloqueados}</span>
                            <span className={estilos.statDetalle}>{tr('Por morosidad', 'Due to delinquency')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* NAVEGACIÓN TABS */}
            {!busquedaTemp && (
            <div className={estilos.tabsContenedor}>
                <nav className={estilos.tabs}>
                    <button
                        className={`${estilos.tab} ${tabActiva === "dashboard" ? estilos.tabActiva : ""}`}
                        onClick={() => setTabActiva("dashboard")}
                    >
                        <ion-icon name="bar-chart-outline"></ion-icon>
                        <span>Dashboard</span>
                    </button>
                    <button
                        className={`${estilos.tab} ${tabActiva === "clientes" ? estilos.tabActiva : ""}`}
                        onClick={() => setTabActiva("clientes")}
                    >
                        <ion-icon name="people-outline"></ion-icon>
                        <span>{tr('Clientes', 'Customers')}</span>
                        <span className={estilos.badge}>{totalClientes}</span>
                    </button>
                    <button
                        className={`${estilos.tab} ${tabActiva === "lista-negra" ? estilos.tabActiva : ""}`}
                        onClick={() => { setTabActiva("lista-negra"); cargarListaNegra(0, busquedaListaNegra) }}
                    >
                        <ion-icon name="warning-outline"></ion-icon>
                        <span>{tr('Lista Negra', 'Blacklist')}</span>
                        {totalListaNegra > 0 && (
                            <span className={`${estilos.badge} ${estilos.badgeDanger}`}>{totalListaNegra}</span>
                        )}
                    </button>
                    <button
                        className={`${estilos.tab} ${tabActiva === "lista-recomendada" ? estilos.tabActiva : ""}`}
                        onClick={() => { setTabActiva("lista-recomendada"); cargarListaRecomendada(0, busquedaListaRecomendada) }}
                    >
                        <ion-icon name="shield-checkmark-outline"></ion-icon>
                        <span>{tr('Recomendados', 'Recommended')}</span>
                        {totalListaRecomendada > 0 && (
                            <span className={`${estilos.badge} ${estilos.badgeSuccess}`}>{totalListaRecomendada}</span>
                        )}
                    </button>
                </nav>
            </div>
            )}

            {/* RESULTADO BÚSQUEDA DIRECTA (header) */}
            {busquedaTemp && (
                <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                        <ion-icon name="search-outline" style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}></ion-icon>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                            {cargandoClientes
                                ? tr('Buscando...', 'Searching...')
                                : language === 'en'
                                    ? `${totalClientes} result${totalClientes !== 1 ? 's' : ''} for "${busquedaTemp}"`
                                    : `${totalClientes} resultado${totalClientes !== 1 ? 's' : ''} para "${busquedaTemp}"`}
                        </span>
                        <button onClick={() => { setBusquedaTemp(''); setBusqueda(''); buscarClientes('', 0) }}
                            style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', padding: '4px 12px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ion-icon name="close-outline"></ion-icon> {tr('Limpiar', 'Clear')}
                        </button>
                    </div>
                    <div className={estilos.tabContent}>
                        <TabClientes
                            clientes={clientes}
                            busqueda={busqueda}
                            buscarClientes={buscarClientes}
                            pagina={paginaClientes}
                            total={totalClientes}
                            router={router}
                            formatearMoneda={formatearMoneda}
                            estilos={estilos}
                            tema={tema}
                            cargando={cargandoClientes}
                            sinForm={true}
                            tr={tr}
                            language={language}
                        />
                    </div>
                </div>
            )}

            {/* CONTENIDO DE TABS */}
            {!busquedaTemp && (
            <div className={estilos.tabContent}>
                {tabActiva === "dashboard" && (
                    estadisticas
                        ? <TabDashboard
                            estadisticas={estadisticas}
                            clientes={clientes}
                            formatearMoneda={formatearMoneda}
                            estilos={estilos}
                                                        tr={tr}
                                                        language={language}
                          />
                        : <div className={estilos.vacio}>
                            <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
                                                        <p>{tr('Cargando estadísticas...', 'Loading statistics...')}</p>
                          </div>
                )}

                {tabActiva === "clientes" && (
                    <TabClientes
                        clientes={clientes}
                        busqueda={busqueda}
                        buscarClientes={buscarClientes}
                        pagina={paginaClientes}
                        total={totalClientes}
                        router={router}
                        formatearMoneda={formatearMoneda}
                        estilos={estilos}
                        tema={tema}
                        cargando={cargandoClientes}
                        tr={tr}
                        language={language}
                    />
                )}

                {tabActiva === "alertas" && null}

                {tabActiva === "lista-negra" && (
                    <TabListaNegra
                        clientes={listaNegra}
                        cargando={cargandoLista}
                        pagina={paginaListaNegra}
                        total={totalListaNegra}
                        onPaginaChange={cargarListaNegra}
                        busqueda={busquedaListaNegra}
                        busquedaTemp={busquedaTempListaNegra}
                        setBusquedaTemp={setBusquedaTempListaNegra}
                        router={router}
                        formatearMoneda={formatearMoneda}
                        estilos={estilos}
                        tr={tr}
                        language={language}
                    />
                )}

                {tabActiva === "lista-recomendada" && (
                    <TabListaRecomendada
                        clientes={listaRecomendada}
                        cargando={cargandoLista}
                        pagina={paginaListaRecomendada}
                        total={totalListaRecomendada}
                        onPaginaChange={cargarListaRecomendada}
                        busqueda={busquedaListaRecomendada}
                        busquedaTemp={busquedaTempListaRecomendada}
                        setBusquedaTemp={setBusquedaTempListaRecomendada}
                        router={router}
                        formatearMoneda={formatearMoneda}
                        estilos={estilos}
                        tr={tr}
                        language={language}
                    />
                )}
            </div>
            )}
        </div>
    )
}

// ============================================
// TAB: DASHBOARD
// ============================================
function TabDashboard({ estadisticas, clientes, formatearMoneda, estilos, tr, language }) {
    const totalClientes = estadisticas.totalClientes || 1

    // Top clientes con deuda vencida
    const topDeudores = useMemo(() => {
        return [...clientes]
            .filter(c => c.montoVencido > 0)
            .sort((a, b) => b.montoVencido - a.montoVencido)
            .slice(0, 5)
    }, [clientes])

    return (
        <div className={estilos.dashboardGrid}>
            {/* Distribución por Clasificación */}
            <div className={estilos.card}>
                <h3 className={estilos.cardTitulo}>
                    <ion-icon name="ribbon-outline"></ion-icon>
                    {tr('Distribución por Clasificación', 'Distribution by Classification')}
                </h3>
                <div className={estilos.clasificacionBars}>
                    <ClasificacionBar
                        letra="A"
                        label={tr('Excelente', 'Excellent')}
                        cantidad={estadisticas.clasificacionA}
                        total={totalClientes}
                        color="success"
                        estilos={estilos}
                    />
                    <ClasificacionBar
                        letra="B"
                        label={tr('Bueno', 'Good')}
                        cantidad={estadisticas.clasificacionB}
                        total={totalClientes}
                        color="primary"
                        estilos={estilos}
                    />
                    <ClasificacionBar
                        letra="C"
                        label={tr('Regular', 'Fair')}
                        cantidad={estadisticas.clasificacionC}
                        total={totalClientes}
                        color="warning"
                        estilos={estilos}
                    />
                    <ClasificacionBar
                        letra="D"
                        label={tr('Moroso', 'Delinquent')}
                        cantidad={estadisticas.clasificacionD}
                        total={totalClientes}
                        color="danger"
                        estilos={estilos}
                    />
                </div>
            </div>

            {/* Top deudores */}
            <div className={estilos.card}>
                <h3 className={estilos.cardTitulo}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    {tr('Top Deudores Vencidos', 'Top Overdue Debtors')}
                </h3>
                <div className={estilos.vencimientosList}>
                    {topDeudores.length > 0 ? (
                        topDeudores.map(cliente => (
                            <div key={cliente.id} className={estilos.vencimientoItem}>
                                <div className={estilos.vencimientoInfo}>
                                    <strong>{cliente.nombreCompleto}</strong>
                                    <small>{cliente.nombreEmpresa || cliente.numeroDocumento}</small>
                                </div>
                                <div className={estilos.vencimientoDetalle}>
                                    <span className={estilos.monto} style={{ color: '#ef4444' }}>
                                        {formatearMoneda(cliente.montoVencido)}
                                    </span>
                                    <small>
                                        {language === 'en'
                                            ? `${cliente.cuotasVencidas} installment${cliente.cuotasVencidas !== 1 ? 's' : ''}`
                                            : `${cliente.cuotasVencidas} cuota${cliente.cuotasVencidas !== 1 ? 's' : ''}`}
                                    </small>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={estilos.vacio}>
                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                            <p>{tr('No hay deudas vencidas', 'There are no overdue debts')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================
// TAB: CLIENTES
// ============================================
function TabClientes({ clientes, busqueda, buscarClientes, pagina, total, router, formatearMoneda, estilos, tema, cargando, sinForm = false, tr, language }) {
    const totalPaginas = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))
    const [busquedaTempLocal, setBusquedaTempLocal] = useState(busqueda || '')

    const handleSubmit = (e) => {
        e.preventDefault()
        buscarClientes(busquedaTempLocal, 0)
    }
    const handleLimpiar = () => {
        setBusquedaTempLocal('')
        buscarClientes('', 0)
    }

    return (
        <div>
            {!sinForm && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <div className={estilos.busqueda} style={{ flex: 1 }}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar por nombre, cédula o teléfono...', 'Search by name, ID or phone...')}
                        value={busquedaTempLocal}
                        onChange={e => setBusquedaTempLocal(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                    {busquedaTempLocal && (
                        <button type="button" onClick={handleLimpiar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    )}
                </div>
                <button type="submit" className={estilos.btnRefrescar} style={{ whiteSpace: 'nowrap', minWidth: '120px' }}>
                    <ion-icon name="search-outline"></ion-icon>
                    <span>{tr('Buscar', 'Search')}</span>
                </button>
            </form>
            )}

            {cargando ? (
                <div className={estilos.vacio}>
                    <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
                    <p>{tr('Cargando...', 'Loading...')}</p>
                </div>
            ) : (
                <div className={estilos.tablaWrapper}>
                    <table className={estilos.tabla}>
                        <thead>
                            <tr className={estilos[tema]}>
                                <th>{tr('Cliente', 'Customer')}</th>
                                <th>{tr('Empresa', 'Company')}</th>
                                <th>{tr('Clasificación', 'Classification')}</th>
                                <th>{tr('Estado', 'Status')}</th>
                                <th>Score</th>
                                <th>{tr('Cuotas vencidas', 'Overdue installments')}</th>
                                <th>{tr('Deuda vencida', 'Overdue debt')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map(cliente => (
                                <tr key={cliente.id} className={estilos[tema]}>
                                    <td>
                                        <div className={estilos.clienteCell}>
                                            <div className={estilos.avatarSmall}>
                                                <ion-icon name="person-outline"></ion-icon>
                                            </div>
                                            <div>
                                                <strong>{cliente.nombreCompleto}</strong>
                                                <small>{cliente.numeroDocumento}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{cliente.nombreEmpresa || '—'}</td>
                                    <td>
                                        <span className={`${estilos.badgeClasificacion} ${estilos[`clasificacion${cliente.clasificacion}`]}`}>
                                            {cliente.clasificacion}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${estilos.badgeEstado} ${estilos[cliente.estadoCredito]}`}>
                                            {cliente.estadoCredito === 'normal'
                                                ? tr('normal', 'normal')
                                                : cliente.estadoCredito === 'atrasado'
                                                    ? tr('atrasado', 'overdue')
                                                    : cliente.estadoCredito === 'bloqueado'
                                                        ? tr('bloqueado', 'blocked')
                                                        : cliente.estadoCredito}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{cliente.scoreCrediticio}</td>
                                    <td>
                                        {cliente.cuotasVencidas > 0
                                            ? <span style={{ color: '#ef4444', fontWeight: 700 }}>{cliente.cuotasVencidas}</span>
                                            : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                                        }
                                    </td>
                                    <td className={cliente.montoVencido > 0 ? estilos.textDanger : ''}>
                                        {cliente.montoVencido > 0 ? formatearMoneda(cliente.montoVencido) : '—'}
                                    </td>
                                    <td>
                                        <button
                                            className={estilos.btnVer}
                                            onClick={() => router.push(`/admin/depuracion/ver?id=${cliente.id}`)}
                                            title={tr('Ver detalle', 'View details')}
                                        >
                                            <ion-icon name="eye-outline"></ion-icon>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {clientes.length === 0 && (
                        <div className={estilos.vacio}>
                            <ion-icon name="search-outline"></ion-icon>
                            <p>{busqueda ? tr('Sin resultados', 'No results') : tr('No hay clientes registrados', 'No customers registered')}</p>
                        </div>
                    )}
                </div>
            )}

            {total > 0 && (
                <Paginador
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    onPrev={() => buscarClientes(busqueda, pagina - 1)}
                    onNext={() => buscarClientes(busqueda, pagina + 1)}
                    cargando={cargando}
                    tr={tr}
                />
            )}
        </div>
    )
}

// ============================================
// COMPONENTE: Barra de Clasificación
// ============================================
function ClasificacionBar({ letra, label, cantidad, total, color, estilos }) {
    const porcentaje = total > 0 ? Math.round((cantidad / total) * 100) : 0

    return (
        <div className={estilos.clasificacionBar}>
            <div className={estilos.clasificacionHeader}>
                <div>
                    <span className={estilos.clasificacionLetra}>{letra}</span>
                    <span className={estilos.clasificacionLabel}>{label}</span>
                </div>
                <span className={estilos.clasificacionValor}>
                    {cantidad} ({porcentaje}%)
                </span>
            </div>
            <div className={estilos.barraProgreso}>
                <div
                    className={`${estilos.barraFill} ${estilos[color]}`}
                    style={{ width: `${porcentaje}%` }}
                ></div>
            </div>
        </div>
    )
}

// ============================================
// TAB: LISTA NEGRA
// ============================================
function TabListaNegra({ clientes, cargando, pagina, total, onPaginaChange, busqueda, busquedaTemp, setBusquedaTemp, router, formatearMoneda, estilos, tr, language }) {
    const totalPaginas = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))

    const handleSubmit = (e) => {
        e.preventDefault()
        onPaginaChange(0, busquedaTemp)
    }

    const handleLimpiar = () => {
        setBusquedaTemp('')
        onPaginaChange(0, '')
    }

    if (cargando) return (
        <div className={estilos.vacio}>
            <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
            <p>{tr('Cargando lista negra...', 'Loading blacklist...')}</p>
        </div>
    )
    return (
        <div>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <ion-icon name="warning-outline" style={{ fontSize: '1.6rem', color: '#ef4444', flexShrink: 0 }}></ion-icon>
                <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#991b1b' }}>{tr('Lista Negra — Riesgo Crediticio', 'Blacklist — Credit Risk')}</strong>
                    <span style={{ fontSize: '12px', color: '#ef4444' }}>{tr('Clientes con cuotas vencidas, clasificación C/D o estado atrasado/bloqueado en todo el sistema', 'Customers with overdue installments, classification C/D, or overdue/blocked status system-wide')}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <div className={estilos.busqueda} style={{ flex: 1 }}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar en lista negra...', 'Search in blacklist...')}
                        value={busquedaTemp}
                        onChange={(e) => setBusquedaTemp(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                    {busquedaTemp && (
                        <button type="button" onClick={handleLimpiar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    )}
                </div>
                <button type="submit" className={estilos.btnRefrescar} style={{ whiteSpace: 'nowrap', minWidth: '120px' }}>
                    <ion-icon name="search-outline"></ion-icon>
                    <span>{tr('Buscar', 'Search')}</span>
                </button>
            </form>

            <div className={estilos.tablaWrapper}>
                <table className={estilos.tabla}>
                    <thead>
                        <tr>
                            <th>{tr('Cliente', 'Customer')}</th>
                            <th>{tr('Empresa', 'Company')}</th>
                            <th>{tr('Cuotas vencidas', 'Overdue installments')}</th>
                            <th>{tr('Días mora', 'Days overdue')}</th>
                            <th>{tr('Saldo en riesgo', 'Balance at risk')}</th>
                            <th>{tr('Clasificación', 'Classification')}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.map(c => (
                            <tr key={c.id}>
                                <td>
                                    <div className={estilos.clienteCell}>
                                        <div className={estilos.avatarSmall}><ion-icon name="person-outline"></ion-icon></div>
                                        <div>
                                            <strong>{c.nombre_completo}</strong>
                                            <small>{c.numero_documento}</small>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.nombre_empresa || '—'}</td>
                                <td>
                                    <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '12px' }}>
                                        {c.cuotas_vencidas}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 700, color: c.dias_mora > 30 ? '#ef4444' : '#f97316' }}>{c.dias_mora || 0}{tr('d', 'd')}</td>
                                <td style={{ fontWeight: 700, color: '#ef4444' }}>{formatearMoneda(c.saldo_en_riesgo)}</td>
                                <td>
                                    {c.clasificacion
                                        ? <span className={`${estilos.badgeClasificacion} ${estilos[`clasificacion${c.clasificacion}`]}`}>{c.clasificacion}</span>
                                        : <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>—</span>
                                    }
                                </td>
                                <td>
                                    <button className={estilos.btnVer} onClick={() => router.push(`/admin/depuracion/ver?id=${c.id}`)} title={tr('Ver detalle', 'View details')}>
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {clientes.length === 0 && (
                    <div className={estilos.vacio}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                        <p>{tr('No hay clientes en lista negra', 'There are no customers in blacklist')}</p>
                    </div>
                )}
            </div>

            {total > 0 && (
                <Paginador
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    onPrev={() => onPaginaChange(pagina - 1, busqueda)}
                    onNext={() => onPaginaChange(pagina + 1, busqueda)}
                    cargando={cargando}
                    tr={tr}
                />
            )}
        </div>
    )
}

// ============================================
// TAB: LISTA RECOMENDADA
// ============================================
function TabListaRecomendada({ clientes, cargando, pagina, total, onPaginaChange, busqueda, busquedaTemp, setBusquedaTemp, router, formatearMoneda, estilos, tr, language }) {
    const totalPaginas = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))

    const handleSubmit = (e) => {
        e.preventDefault()
        onPaginaChange(0, busquedaTemp)
    }

    const handleLimpiar = () => {
        setBusquedaTemp('')
        onPaginaChange(0, '')
    }

    if (cargando) return (
        <div className={estilos.vacio}>
            <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
            <p>{tr('Cargando lista recomendada...', 'Loading recommended list...')}</p>
        </div>
    )
    return (
        <div>
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <ion-icon name="shield-checkmark-outline" style={{ fontSize: '1.6rem', color: '#10b981', flexShrink: 0 }}></ion-icon>
                <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#065f46' }}>{tr('Lista Recomendada — Buen Historial', 'Recommended List — Good History')}</strong>
                    <span style={{ fontSize: '12px', color: '#10b981' }}>{tr('Clientes sin cuotas vencidas con excelente comportamiento de pago', 'Customers without overdue installments and excellent payment behavior')}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <div className={estilos.busqueda} style={{ flex: 1 }}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar en recomendados...', 'Search in recommended...')}
                        value={busquedaTemp}
                        onChange={(e) => setBusquedaTemp(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                    {busquedaTemp && (
                        <button type="button" onClick={handleLimpiar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    )}
                </div>
                <button type="submit" className={estilos.btnRefrescar} style={{ whiteSpace: 'nowrap', minWidth: '120px' }}>
                    <ion-icon name="search-outline"></ion-icon>
                    <span>{tr('Buscar', 'Search')}</span>
                </button>
            </form>

            <div className={estilos.tablaWrapper}>
                <table className={estilos.tabla}>
                    <thead>
                        <tr>
                            <th>{tr('Cliente', 'Customer')}</th>
                            <th>{tr('Empresa', 'Company')}</th>
                            <th>{tr('Contratos pagados', 'Paid contracts')}</th>
                            <th>Score</th>
                            <th>{tr('Clasificación', 'Classification')}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.map(c => (
                            <tr key={c.id}>
                                <td>
                                    <div className={estilos.clienteCell}>
                                        <div className={estilos.avatarSmall}><ion-icon name="person-outline"></ion-icon></div>
                                        <div>
                                            <strong>{c.nombre_completo}</strong>
                                            <small>{c.numero_documento}</small>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.nombre_empresa || '—'}</td>
                                <td>
                                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '12px' }}>
                                        {language === 'en'
                                            ? `${c.contratos_pagados} paid`
                                            : `${c.contratos_pagados} pagado${c.contratos_pagados !== 1 ? 's' : ''}`}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 700, color: c.score_crediticio >= 700 ? '#10b981' : c.score_crediticio >= 500 ? '#3b82f6' : 'var(--text-secondary)' }}>
                                    {c.score_crediticio || '—'}
                                </td>
                                <td>
                                    {c.clasificacion
                                        ? <span className={`${estilos.badgeClasificacion} ${estilos[`clasificacion${c.clasificacion}`]}`}>{c.clasificacion}</span>
                                        : <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{tr('Al día', 'Current')}</span>
                                    }
                                </td>
                                <td>
                                    <button className={estilos.btnVer} onClick={() => router.push(`/admin/depuracion/ver?id=${c.id}`)} title={tr('Ver detalle', 'View details')}>
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {clientes.length === 0 && (
                    <div className={estilos.vacio}>
                        <ion-icon name="people-outline"></ion-icon>
                        <p>{tr('No hay clientes recomendados aún', 'There are no recommended customers yet')}</p>
                    </div>
                )}
            </div>

            {total > 0 && (
                <Paginador
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    onPrev={() => onPaginaChange(pagina - 1, busqueda)}
                    onNext={() => onPaginaChange(pagina + 1, busqueda)}
                    cargando={cargando}
                    tr={tr}
                />
            )}
        </div>
    )
}

function Paginador({ pagina, totalPaginas, onPrev, onNext, cargando, tr }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
            <button
                disabled={cargando || pagina <= 0}
                onClick={onPrev}
                aria-label={tr('Página anterior', 'Previous page')}
                style={{ width: '36px', height: '36px', borderRadius: '9px', border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (cargando || pagina <= 0) ? 0.35 : 1 }}
            >
                <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {pagina + 1} / {totalPaginas}
            </span>
            <button
                disabled={cargando || pagina >= totalPaginas - 1}
                onClick={onNext}
                aria-label={tr('Página siguiente', 'Next page')}
                style={{ width: '36px', height: '36px', borderRadius: '9px', border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (cargando || pagina >= totalPaginas - 1) ? 0.35 : 1 }}
            >
                <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
        </div>
    )
}
