"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    obtenerContratosConPago, obtenerCuotasContrato,
    registrarPagoCuota, obtenerPagos, obtenerDetallePago, anularPago,
    obtenerListaNegra, obtenerClientesConContratos, obtenerDatosEmpresa
} from './servidor'
import { useLanguage } from '../i18n/LanguageProvider'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'
import estilos from './pagos.module.css'

const CUOTA_STYLE = {
    pendiente: { bg: '#fef3c7', color: '#92400e' },
    pagada:    { bg: '#d1fae5', color: '#065f46' },
    vencida:   { bg: '#fee2e2', color: '#991b1b' },
    parcial:   { bg: '#e0f2fe', color: '#075985' },
}
const ESTADO_COLOR = { pendiente: 'orange', vencida: 'red', parcial: 'blue', pagada: 'green' }
const PAGE_SIZE_CONTRATOS = 20
const PAGE_SIZE_PAGOS     = 50

const PAGO_VACIO = { monto: '', metodo_pago_id: '', referencia: '', notas: '', fecha: new Date().toISOString().split('T')[0] }

export default function Pagos() {
    const router = useRouter()
    const { language } = useLanguage()
    const [tema, setTema]         = useState('light')
    const [tab, setTab]           = useState('contratos')
    const [cargando, setCargando] = useState(true)

    const [contratos, setContratos]   = useState([])
    const [cuotaMap, setCuotaMap]     = useState({})
    const [categorias, setCategorias] = useState([])
    const [metodos, setMetodos]       = useState([])
    const [stats, setStats]           = useState({})
    const [totalContratos, setTotalContratos] = useState(0)
    const [paginaContratos, setPaginaContratos] = useState(0)
    const [busqueda, setBusqueda]     = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('')
    const [gruposColapsados, setGruposColapsados] = useState({})

    const [contratoAbierto, setContratoAbierto] = useState(null)
    const [cuotasContrato, setCuotasContrato]   = useState([])
    const [pagosContrato, setPagosContrato]     = useState([])
    const [cargandoCuotas, setCargandoCuotas]   = useState(false)
    const [moraPct, setMoraPct]       = useState(5)
    const [diasGracia, setDiasGracia] = useState(5)
    const [paginaCuotas, setPaginaCuotas] = useState(0)
    const CUOTAS_POR_PAGINA = 20

    const [modalPago, setModalPago]     = useState(null)
    const [formPago, setFormPago]       = useState({ ...PAGO_VACIO })
    const [guardando, setGuardando]     = useState(false)
    const [errorPago, setErrorPago]     = useState('')
    const [simulacion, setSimulacion]   = useState(null)

    const abrirImprimir = (pagoId) => router.push(`/admin/pagos/imprimir/${pagoId}`)


    const [pagos, setPagos]             = useState([])
    const [statsPagos, setStatsPagos]   = useState({})
    const [totalPagos, setTotalPagos]   = useState(0)
    const [paginaPagos, setPaginaPagos] = useState(0)
    const [busquedaPago, setBusquedaPago] = useState('')
    const [fechaDesde, setFechaDesde]     = useState('')
    const [fechaHasta, setFechaHasta]     = useState('')
    const [modalDetalle, setModalDetalle] = useState(null)
    const [modalAnular, setModalAnular]   = useState(null)
    const [detalle, setDetalle]           = useState(null)
    const [cargandoDetalle, setCargandoDetalle] = useState(false)
    const [anulando, setAnulando]         = useState(false)

    const [listaNegra, setListaNegra]         = useState([])
    const [busquedaNegra, setBusquedaNegra]   = useState('')
    const [cargandoNegra, setCargandoNegra]   = useState(false)

    // Vista por cliente
    const [vistaCliente, setVistaCliente]           = useState(false)
    const [clientesLista, setClientesLista]         = useState([])
    const [totalClientes, setTotalClientes]         = useState(0)
    const [paginaClientes, setPaginaClientes]       = useState(0)
    const [cargandoClientes, setCargandoClientes]   = useState(false)
    const [clienteExpandido, setClienteExpandido]   = useState(null)
    const [contratosCliente, setContratosCliente]   = useState([])
    const [cuotaMapCliente, setCuotaMapCliente]     = useState({})
    const [cargandoContratosCliente, setCargandoContratosCliente] = useState(false)
    const PAGE_SIZE_CLIENTES = 30
    const [empresa, setEmpresa] = useState(null)

    const tr = (es, en) => language === 'en' ? en : es

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const localeEmpresa = empresa?.locale || 'es-DO'

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const fn = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', fn); window.addEventListener('storage', fn)
        cargarEmpresa()
        return () => { window.removeEventListener('temaChange', fn); window.removeEventListener('storage', fn) }
    }, [])

    useEffect(() => {
        if (tab === 'contratos') cargarContratos(0)
        else if (tab === 'historial') cargarPagos(0)
        else if (tab === 'lista_negra') cargarListaNegra()
    }, [tab])

    useEffect(() => {
        if (tab !== 'contratos') return
        const t = setTimeout(() => {
            if (vistaCliente) cargarClientes(0)
            else cargarContratos(0)
        }, 300)
        return () => clearTimeout(t)
    }, [busqueda, filtroCategoria, vistaCliente])

    useEffect(() => {
        if (tab !== 'historial') return
        const t = setTimeout(() => cargarPagos(0), 300)
        return () => clearTimeout(t)
    }, [busquedaPago, fechaDesde, fechaHasta])

    useEffect(() => {
        if (tab !== 'lista_negra') return
        const t = setTimeout(() => cargarListaNegra(), 300)
        return () => clearTimeout(t)
    }, [busquedaNegra])

    useEffect(() => {
        if (!formPago.monto || !modalPago) { setSimulacion(null); return }
        const monto = parseFloat(formPago.monto)
        if (isNaN(monto) || monto <= 0) { setSimulacion(null); return }
        const totalCuotaActual = parseFloat(modalPago.monto) + parseFloat(modalPago.mora || 0)
        if (monto <= totalCuotaActual) { setSimulacion(null); return }
        const sim = simularDistribucion(monto, cuotasContrato, modalPago, moraPct, diasGracia)
        if (sim.length > 1) setSimulacion(sim)
        else setSimulacion(null)
    }, [formPago.monto])

    const cargarClientes = async (pagina = 0) => {
        setCargandoClientes(true)
        const r = await obtenerClientesConContratos({ busqueda, limit: PAGE_SIZE_CLIENTES, offset: pagina * PAGE_SIZE_CLIENTES })
        if (r.success) { setClientesLista(r.clientes); setTotalClientes(r.total); setPaginaClientes(pagina) }
        setCargandoClientes(false)
    }

    const toggleVistaCliente = (activar) => {
        setVistaCliente(activar)
        setClienteExpandido(null)
        setContratosCliente([])
        setCuotaMapCliente({})
        if (activar) cargarClientes(0)
        else cargarContratos(0)
    }

    const toggleClienteExpandido = async (cliente) => {
        if (clienteExpandido === cliente.cliente_id) { setClienteExpandido(null); return }
        setClienteExpandido(cliente.cliente_id)
        setContratoAbierto(null)
        setCargandoContratosCliente(true)
        const r = await obtenerContratosConPago({ cliente_id: cliente.cliente_id, limit: 50, offset: 0 })
        if (r.success) {
            setContratosCliente(r.contratos)
            setCuotaMapCliente(r.cuotaMap)
            if (r.metodos?.length) setMetodos(r.metodos)
        }
        setCargandoContratosCliente(false)
    }

    const cargarContratos = async (pagina = 0) => {        setCargando(true)
        const r = await obtenerContratosConPago({ busqueda, categoria_id: filtroCategoria, limit: PAGE_SIZE_CONTRATOS, offset: pagina * PAGE_SIZE_CONTRATOS })
        if (r.success) {
            setContratos(r.contratos); setCuotaMap(r.cuotaMap)
            setCategorias(r.categorias); setStats(r.stats)
            setTotalContratos(r.total); setPaginaContratos(pagina)
            if (r.metodos?.length) setMetodos(r.metodos)
        }
        setCargando(false)
    }

    const cargarPagos = async (pagina = 0) => {
        setCargando(true)
        const r = await obtenerPagos({ busqueda: busquedaPago, fecha_desde: fechaDesde, fecha_hasta: fechaHasta, limit: PAGE_SIZE_PAGOS, offset: pagina * PAGE_SIZE_PAGOS })
        if (r.success) { setPagos(r.pagos); setStatsPagos(r.stats); setTotalPagos(r.total); setPaginaPagos(pagina) }
        setCargando(false)
    }

    const cargarListaNegra = async () => {
        setCargandoNegra(true)
        const r = await obtenerListaNegra({ busqueda: busquedaNegra })
        if (r.success) setListaNegra(r.contratos)
        setCargandoNegra(false)
    }

    const toggleContrato = async (contrato) => {
        if (contratoAbierto === contrato.id) { setContratoAbierto(null); setPagosContrato([]); return }
        setContratoAbierto(contrato.id)
        setPaginaCuotas(0)
        setCargandoCuotas(true)
        const r = await obtenerCuotasContrato(contrato.id)
        if (r.success) {
            setCuotasContrato(r.cuotas)
            setPagosContrato(r.pagos || [])
            setMoraPct(r.mora_pct || 5)
            setDiasGracia(r.dias_gracia || 5)
        }
        setCargandoCuotas(false)
    }

    const esPagoAdelantado = (notas) => /adelantado/i.test(notas || '')

    const tipoPagoLabel = (p) => {
        if (esPagoAdelantado(p.notas)) return tr('Pago adelantado', 'Advance payment')
        return metodoPagoTexto(p.metodo_pago)
    }

    const abrirModalPago = (cuota) => {
        setModalPago(cuota)
        setErrorPago('')
        setSimulacion(null)
        const montoRestante = parseFloat(cuota.monto_restante || cuota.monto)
        const mora = parseFloat(cuota.mora || 0)
        setFormPago({
            ...PAGO_VACIO,
            monto: (montoRestante + mora).toFixed(2),
        })
    }

    const simularDistribucion = (monto, cuotas, cuotaInicio, mPct, dGracia) => {
        const pendientes = cuotas.filter(c => ['pendiente','vencida','parcial'].includes(c.estado))
        let restante = monto
        const distribucion = []
        for (const c of pendientes) {
            if (restante <= 0) break
            const mora = parseFloat(c.mora || 0)
            const montoBase = parseFloat(c.monto_restante || c.monto)
            const total = montoBase + mora
            if (restante >= total) {
                distribucion.push({ numero: c.numero, monto: total, estado: 'pagada', mora })
                restante -= total
            } else {
                distribucion.push({ numero: c.numero, monto: restante, estado: 'parcial', mora: Math.min(mora, restante) })
                restante = 0
            }
        }
        return distribucion
    }

    const handleRegistrarPago = async () => {
        if (!formPago.monto || parseFloat(formPago.monto) <= 0) { setErrorPago(tr('El monto debe ser mayor a 0', 'Amount must be greater than 0')); return }
        setGuardando(true); setErrorPago('')
        const r = await registrarPagoCuota(modalPago.id, { ...formPago, pago_adelantado: true })
        if (r.success) {
            const pagoIdGenerado = r.pago_id
            setModalPago(null)
            if (contratoAbierto) {
                const rc = await obtenerCuotasContrato(contratoAbierto)
                if (rc.success) {
                    setCuotasContrato(rc.cuotas)
                    setPagosContrato(rc.pagos || [])
                }
            }
            await cargarContratos(paginaContratos)
            abrirImprimir(pagoIdGenerado)
        } else setErrorPago(r.mensaje)
        setGuardando(false)
    }

    const handleVerDetalle = async (pago) => {
        setModalDetalle(pago); setCargandoDetalle(true)
        const r = await obtenerDetallePago(pago.id)
        if (r.success) setDetalle(r)
        setCargandoDetalle(false)
    }

    const handleAnular = async () => {
        setAnulando(true)
        const r = await anularPago(modalAnular.id)
        if (r.success) { setModalAnular(null); setModalDetalle(null); setDetalle(null); cargarPagos(0) }
        setAnulando(false)
    }

    const toggleGrupo = (key) => setGruposColapsados(p => ({ ...p, [key]: !p[key] }))
    const totalPaginasContratos = Math.ceil(totalContratos / PAGE_SIZE_CONTRATOS)
    const totalPaginasPagos     = Math.ceil(totalPagos / PAGE_SIZE_PAGOS)

    const fmtMoneda = (v) => {
        const mon = empresa?.moneda || 'DOP'
        const loc = localeEmpresa
        return new Intl.NumberFormat(loc, { style: 'currency', currency: mon, minimumFractionDigits: 2 }).format(v || 0)
    }
    const fmtFecha  = (f) => {
        if (!f) return '—'
        const s = typeof f === 'string' ? f : f instanceof Date ? f.toISOString() : String(f)
        const [y, m, d] = s.slice(0,10).split('-').map(Number)
        if (!y||!m||!d) return '—'
        return new Date(y, m-1, d).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { day:'2-digit', month:'short', year:'numeric' })
    }

    const metodoPagoTexto = (texto) => {
        if (!texto) return '—'
        const normalizado = String(texto).toLowerCase().replaceAll('_', ' ')
        const map = {
            efectivo: tr('Efectivo', 'Cash'),
            debito: tr('Debito', 'Debit'),
            'tarjeta debito': tr('Tarjeta debito', 'Debit card'),
            credito: tr('Credito', 'Credit'),
            'tarjeta credito': tr('Tarjeta credito', 'Credit card'),
            transferencia: tr('Transferencia', 'Transfer'),
            cheque: tr('Cheque', 'Check'),
            'sin especificar': tr('Sin especificar', 'Unspecified'),
        }
        return map[normalizado] || texto
    }
    const diasVenc = (f) => {
        if (!f) return 0
        const hoy = new Date(); hoy.setHours(0,0,0,0)
        const [y,m,d] = String(f).slice(0,10).split('-').map(Number)
        const diff = Math.floor((hoy - new Date(y,m-1,d)) / 86400000)
        return diff > 0 ? diff : 0
    }
    const extraerReferenciaProducto = (notas) => {
        if (!notas) return ''
        const m = String(notas).match(/Productos:\s*([^|]+)/i)
        return m?.[1]?.trim() || ''
    }
    const obtenerInfoPrestamoProducto = (contrato) => {
        const producto = extraerReferenciaProducto(contrato?.contrato_notas)
        const precio = parseFloat(contrato?.monto_producto || 0)
        const esPrestamoProducto = !!producto
        return { esPrestamoProducto, producto, precio }
    }

    const grupos = (() => {
        const lista = []
        for (const cat of categorias) {
            const items = contratos.filter(c => c.categoria_id === cat.id)
            if (items.length > 0) lista.push({ categoria: cat, contratos: items })
        }
        const sin = contratos.filter(c => !c.categoria_id)
        if (sin.length > 0) lista.push({ categoria: null, contratos: sin })
        return lista
    })()

    const montoTotalModal = modalPago
        ? (parseFloat(modalPago.monto_restante || modalPago.monto) + parseFloat(modalPago.mora || 0))
        : 0

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}><ion-icon name="cash-outline"></ion-icon></div>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Pagos', 'Payments')}</h1>
                        <p className={estilos.subtitulo}>{tr('Gestiona y registra pagos de contratos activos', 'Manage and record payments for active contracts')}</p>
                    </div>
                </div>
                <Link href="/admin/pagos/metodo" className={estilos.btnMetodo}>
                    <ion-icon name="card-outline"></ion-icon>
                    <span>{tr('Metodos de pago', 'Payment methods')}</span>
                </Link>
            </div>

            <div className={estilos.tabs}>
                {[
                    { key: 'contratos',   label: tr('Contratos activos', 'Active contracts'),  icon: 'documents-outline' },
                    { key: 'historial',   label: tr('Historial de pagos', 'Payment history'), icon: 'receipt-outline' },
                    { key: 'lista_negra', label: tr('Lista negra', 'Watchlist'),        icon: 'warning-outline' },
                ].map(t => (
                    <button key={t.key}
                        className={`${estilos.tab} ${tab === t.key ? estilos.tabActivo : ''} ${t.key === 'lista_negra' ? estilos.tabNegra : ''}`}
                        onClick={() => setTab(t.key)}>
                        <ion-icon name={t.icon}></ion-icon>
                        {t.label}
                        {t.key === 'contratos' && (stats.cuotas_vencidas > 0) && (
                            <span className={estilos.tabBadge}>{stats.cuotas_vencidas}</span>
                        )}
                        {t.key === 'lista_negra' && listaNegra.length > 0 && (
                            <span className={`${estilos.tabBadge} ${estilos.tabBadgeRojo}`}>{listaNegra.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {tab === 'contratos' && (
                <>
                    <div className={estilos.statsGrid}>
                        {[
                            { label: tr('Contratos activos', 'Active contracts'), valor: stats.total_activos   || 0, color: 'blue',  icon: 'documents-outline',    tipo: 'num' },
                            { label: tr('Saldo pendiente', 'Outstanding balance'),   valor: stats.saldo_total     || 0, color: 'green', icon: 'cash-outline',         tipo: 'mon' },
                            { label: tr('Cuotas vencidas', 'Overdue installments'),   valor: stats.cuotas_vencidas || 0, color: 'red',   icon: 'alert-circle-outline', tipo: 'num' },
                        ].map((s, i) => (
                            <div key={i} className={`${estilos.statCard} ${estilos[s.color]}`}>
                                <div className={`${estilos.statIcono} ${estilos[s.color]}`}><ion-icon name={s.icon}></ion-icon></div>
                                <div>
                                    <span className={estilos.statValor}>{s.tipo === 'mon' ? fmtMoneda(s.valor) : s.valor}</span>
                                    <span className={estilos.statLabel}>{s.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={estilos.toolbar}>
                        <div className={estilos.buscadorWrapper}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input type="text" className={estilos.inputBuscador}
                                placeholder={tr('Buscar por nombre, cedula o numero de contrato...', 'Search by name, ID, or contract number...')}
                                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                            {busqueda && <button className={estilos.btnLimpiar} onClick={() => setBusqueda('')}><ion-icon name="close-outline"></ion-icon></button>}
                        </div>
                        {!vistaCliente && categorias.length > 0 && (
                            <select className={estilos.select} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                                <option value="">{tr('Todas las categorias', 'All categories')}</option>
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                <option value="sin">{tr('Sin categoria', 'No category')}</option>
                            </select>
                        )}
                        <div className={estilos.vistaToggle}>
                            <button
                                className={`${estilos.btnVista} ${!vistaCliente ? estilos.btnVistaActivo : ''}`}
                                onClick={() => toggleVistaCliente(false)}
                                title={tr('Vista por contrato', 'Contract view')}
                            >
                                <ion-icon name="documents-outline"></ion-icon>
                                <span>{tr('Contratos', 'Contracts')}</span>
                            </button>
                            <button
                                className={`${estilos.btnVista} ${vistaCliente ? estilos.btnVistaActivo : ''}`}
                                onClick={() => toggleVistaCliente(true)}
                                title={tr('Vista consolidada por cliente', 'Client consolidated view')}
                            >
                                <ion-icon name="people-outline"></ion-icon>
                                <span>{tr('Por Cliente', 'By Client')}</span>
                            </button>
                        </div>
                    </div>

                    {!vistaCliente && categorias.length > 0 && (
                        <div className={estilos.chipsCategorias}>
                            <button className={`${estilos.chipCat} ${filtroCategoria === '' ? estilos.chipActivo : ''}`} onClick={() => setFiltroCategoria('')}>{tr('Todas', 'All')}</button>
                            {categorias.map(c => (
                                <button key={c.id}
                                    className={`${estilos.chipCat} ${filtroCategoria === String(c.id) ? estilos.chipActivo : ''}`}
                                    style={filtroCategoria === String(c.id) ? { background: c.color, borderColor: c.color, color: '#fff' } : { borderColor: c.color, color: c.color }}
                                    onClick={() => setFiltroCategoria(filtroCategoria === String(c.id) ? '' : String(c.id))}>
                                    <span className={estilos.chipDot} style={{ background: c.color }}></span>
                                    {c.nombre}
                                    <span className={estilos.chipCount}>{c.total_contratos}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ===== VISTA POR CLIENTE ===== */}
                    {vistaCliente ? (
                        <>
                        {cargandoClientes ? <LoadingScreen /> : clientesLista.length === 0 ? (
                            <div className={estilos.vacio}>
                                <ion-icon name="people-outline"></ion-icon>
                                <h3>{tr('No hay clientes con contratos activos', 'No clients with active contracts')}</h3>
                            </div>
                        ) : (
                            <>
                            <div className={estilos.listaGrupos}>
                                {clientesLista.map(cli => {
                                    const abierto = clienteExpandido === cli.cliente_id
                                    const tieneVenc = cli.total_cuotas_vencidas > 0
                                    return (
                                        <div key={cli.cliente_id} className={`${estilos.grupo} ${tieneVenc ? estilos.grupoVencido : ''}`}>
                                            <div className={estilos.grupoHeader}
                                                onClick={() => toggleClienteExpandido(cli)}
                                                role="button" tabIndex={0}
                                                onKeyDown={e => e.key === 'Enter' && toggleClienteExpandido(cli)}>
                                                <div className={estilos.grupoHeaderLeft}>
                                                    <div className={`${estilos.avatar} ${tieneVenc ? estilos.avatarRojo : ''}`}>{cli.cliente_nombre?.charAt(0)}</div>
                                                    <div>
                                                        <span className={estilos.grupoNombre}>{cli.cliente_nombre}</span>
                                                        <span className={estilos.subCliente}>{cli.cliente_documento || ''}</span>
                                                    </div>
                                                    <span className={estilos.grupoBadge}>{cli.total_contratos} {tr('contratos', 'contracts')}</span>
                                                    {tieneVenc && <span className={`${estilos.grupoBadge} ${estilos.badgeRojo}`}>{cli.total_cuotas_vencidas} {tr('venc.', 'ovd.')}</span>}
                                                </div>
                                                <div className={estilos.clienteTotalWrap}>
                                                    <span className={estilos.clienteTotalLabel}>{tr('Total pendiente', 'Total pending')}</span>
                                                    <span className={`${estilos.clienteTotalValor} ${tieneVenc ? estilos.clienteTotalRojo : ''}`}>{fmtMoneda(cli.total_pendiente)}</span>
                                                </div>
                                                <svg className={`${estilos.chevron} ${abierto ? estilos.chevronUp : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                            </div>

                                            {abierto && (
                                                <div className={estilos.grupoBody}>
                                                    {cargandoContratosCliente ? (
                                                        <div className={estilos.cargandoInline}><div className={estilos.spinnerSm}></div><span>{tr('Cargando contratos...', 'Loading contracts...')}</span></div>
                                                    ) : contratosCliente.map(c => {
                                                        const proxCuota = cuotaMapCliente[c.id]
                                                        const abiertoC  = contratoAbierto === c.id
                                                        const tieneVencC = c.cuotas_vencidas > 0
                                                        const infoProducto = obtenerInfoPrestamoProducto(c)
                                                        return (
                                                            <div key={c.id} className={`${estilos.contratoRow} ${tieneVencC ? estilos.contratoVencido : ''} ${infoProducto.esPrestamoProducto ? estilos.contratoProducto : ''}`}>
                                                                <div className={estilos.contratoResumen}
                                                                    onClick={() => toggleContrato(c)}
                                                                    role="button" tabIndex={0}
                                                                    onKeyDown={e => e.key === 'Enter' && toggleContrato(c)}>
                                                                    <div className={estilos.contratoCliente}>
                                                                        <div className={estilos.contratoMeta}>
                                                                            <span className={estilos.contratoNumero}>{c.numero}</span>
                                                                            <span className={estilos.contratoPlan}>{c.plan_nombre}</span>
                                                                            {infoProducto.esPrestamoProducto && (
                                                                                <div className={estilos.productoRefBadge}>
                                                                                    <span className={estilos.productoRefTitulo}>{tr('Préstamo por producto', 'Product-based loan')}</span>
                                                                                    <span className={estilos.productoRefNombre}>{infoProducto.producto}</span>
                                                                                    <span className={estilos.productoRefPrecio}>{tr('Precio', 'Price')}: {fmtMoneda(infoProducto.precio)}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {proxCuota ? (
                                                                        <div className={estilos.proximaCuota}>
                                                                            <span className={estilos.proximaLabel}>{tr('Proximo pago', 'Next payment')}</span>
                                                                            <span className={estilos.proximaMonto}>{fmtMoneda(parseFloat(proxCuota.monto_restante || proxCuota.monto) + parseFloat(proxCuota.mora || 0))}</span>
                                                                            <span className={`${estilos.proximaFecha} ${proxCuota.estado === 'vencida' ? estilos.fechaRoja : ''}`}>
                                                                                {fmtFecha(proxCuota.fecha_vencimiento)}
                                                                                {proxCuota.estado === 'vencida' && ` · ${diasVenc(proxCuota.fecha_vencimiento)}${tr('d vencida', 'd overdue')}`}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className={estilos.proximaCuota}>
                                                                            <span className={estilos.proximaLabel}>{tr('Sin cuotas pendientes', 'No pending installments')}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className={estilos.contratoStats}>
                                                                        <span className={estilos.saldoLabel}>{tr('Saldo', 'Balance')}</span>
                                                                        <span className={estilos.saldoValor}>{fmtMoneda(c.saldo_pendiente)}</span>
                                                                        {tieneVencC && <span className={estilos.vencBadge}>{c.cuotas_vencidas} {tr('venc.', 'ovd.')}</span>}
                                                                    </div>
                                                                    <div className={estilos.contratoAcciones}>
                                                                        <Link href={`/admin/contratos/ver/${c.id}`} className={estilos.btnVerContrato} onClick={e => e.stopPropagation()}>
                                                                            <ion-icon name="eye-outline"></ion-icon>
                                                                        </Link>
                                                                        <div className={`${estilos.chevron} ${abiertoC ? estilos.chevronUp : ''}`}>
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {abiertoC && (
                                                                    <div className={estilos.cuotasPanel}>
                                                                        {cargandoCuotas ? (
                                                                            <div className={estilos.cargandoInline}><div className={estilos.spinnerSm}></div><span>{tr('Cargando cuotas...', 'Loading installments...')}</span></div>
                                                                        ) : (
                                                                            <>
                                                                            <div className={estilos.tablaWrapCuotas}>
                                                                                <table className={estilos.tablaCuotas}>
                                                                                    <thead><tr><th>#</th><th>{tr('Vencimiento','Due date')}</th><th>{tr('Cuota','Installment')}</th><th>Mora</th><th>Total</th><th>{tr('Estado','Status')}</th><th></th></tr></thead>
                                                                                    <tbody>
                                                                                        {cuotasContrato.slice(paginaCuotas * CUOTAS_POR_PAGINA, (paginaCuotas + 1) * CUOTAS_POR_PAGINA).map(cu => {
                                                                                            const mora  = parseFloat(cu.mora || 0)
                                                                                            const montoBase = parseFloat(cu.monto_restante || cu.monto)
                                                                                            const total = montoBase + mora
                                                                                            const cs    = CUOTA_STYLE[cu.estado] || {}
                                                                                            const puede = ['pendiente','vencida','parcial'].includes(cu.estado)
                                                                                            return (
                                                                                                <tr key={cu.id} className={`${estilos.filaCuota} ${cu.estado === 'vencida' ? estilos.filaVencida : ''}`}>
                                                                                                    <td className={estilos.tdNum}>{cu.numero}</td>
                                                                                                    <td className={estilos.tdGris}>{fmtFecha(cu.fecha_vencimiento)}{diasVenc(cu.fecha_vencimiento) > 0 && <span className={estilos.diasRetraso}>{diasVenc(cu.fecha_vencimiento)}d</span>}</td>
                                                                                                    <td className={estilos.tdMonto}>{fmtMoneda(parseFloat(cu.monto))}</td>
                                                                                                    <td className={mora > 0 ? estilos.tdDanger : estilos.tdGris}>{mora > 0 ? fmtMoneda(mora) : '—'}</td>
                                                                                                    <td className={estilos.tdMonto}>{fmtMoneda(total)}</td>
                                                                                                    <td><span className={estilos.estadoBadgeSm} style={{ background: cs.bg, color: cs.color }}>{tr({ pendiente:'Pendiente',pagada:'Pagada',parcial:'Parcial',vencida:'Vencida' }[cu.estado]||cu.estado, { pendiente:'Pending',pagada:'Paid',parcial:'Partial',vencida:'Overdue' }[cu.estado]||cu.estado)}</span></td>
                                                                                                    <td>{puede && <button className={estilos.btnPagarCuota} onClick={() => abrirModalPago(cu)}><ion-icon name="cash-outline"></ion-icon><span>{tr('Pagar','Pay')}</span></button>}</td>
                                                                                                </tr>
                                                                                            )
                                                                                        })}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            {Math.ceil(totalClientes / PAGE_SIZE_CLIENTES) > 1 && (
                                <div className={estilos.paginacion}>
                                    <button className={estilos.btnPag} disabled={paginaClientes === 0} onClick={() => cargarClientes(paginaClientes - 1)}><ion-icon name="chevron-back-outline"></ion-icon></button>
                                    <span className={estilos.paginaInfo}>{paginaClientes + 1} / {Math.ceil(totalClientes / PAGE_SIZE_CLIENTES)}</span>
                                    <button className={estilos.btnPag} disabled={(paginaClientes + 1) * PAGE_SIZE_CLIENTES >= totalClientes} onClick={() => cargarClientes(paginaClientes + 1)}><ion-icon name="chevron-forward-outline"></ion-icon></button>
                                </div>
                            )}
                            </>
                        )}
                        </>
                    ) : (
                    /* ===== VISTA POR CONTRATO (original) ===== */
                    cargando ? <LoadingScreen /> : grupos.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="documents-outline"></ion-icon>
                            <h3>{tr('No hay contratos activos', 'There are no active contracts')}</h3>
                            <p>{busqueda ? tr('Intenta con otro termino', 'Try another term') : tr('Sin contratos por el momento', 'No contracts at the moment')}</p>
                        </div>
                    ) : (
                        <>
                            <div className={estilos.listaGrupos}>
                                {grupos.map(grupo => {
                                    const cat   = grupo.categoria
                                    const key   = cat ? `cat-${cat.id}` : 'sin-cat'
                                    const color = cat?.color || '#94a3b8'
                                    const col   = gruposColapsados[key]

                                    return (
                                        <div key={key} className={estilos.grupo}>
                                            <div className={estilos.grupoHeader}
                                                onClick={() => toggleGrupo(key)}
                                                role="button" tabIndex={0}
                                                onKeyDown={e => e.key === 'Enter' && toggleGrupo(key)}>
                                                <div className={estilos.grupoHeaderLeft}>
                                                    <span className={estilos.grupoDot} style={{ background: color }}></span>
                                                    <span className={estilos.grupoNombre} style={{ color }}>{cat ? cat.nombre : tr('Sin categoria', 'No category')}</span>
                                                    <span className={estilos.grupoBadge} style={{ background: color + '22', color }}>{grupo.contratos.length}</span>
                                                </div>
                                                <svg className={`${estilos.chevron} ${col ? estilos.chevronUp : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                            </div>

                                            {!col && (
                                                <div className={estilos.grupoBody}>
                                                    {grupo.contratos.map(c => {
                                                        const proxCuota = cuotaMap[c.id]
                                                        const abierto   = contratoAbierto === c.id
                                                        const tieneVenc = c.cuotas_vencidas > 0
                                                        const infoProducto = obtenerInfoPrestamoProducto(c)

                                                        return (
                                                            <div key={c.id} className={`${estilos.contratoRow} ${tieneVenc ? estilos.contratoVencido : ''} ${infoProducto.esPrestamoProducto ? estilos.contratoProducto : ''}`}>
                                                                <div className={estilos.contratoResumen}
                                                                    onClick={() => toggleContrato(c)}
                                                                    role="button" tabIndex={0}
                                                                    onKeyDown={e => e.key === 'Enter' && toggleContrato(c)}>

                                                                    <div className={estilos.contratoCliente}>
                                                                        <div className={`${estilos.avatar} ${tieneVenc ? estilos.avatarRojo : ''}`}>{c.cliente_nombre?.charAt(0)}</div>
                                                                        <div>
                                                                            <span className={estilos.nombreCliente}>{c.cliente_nombre}</span>
                                                                            <span className={estilos.subCliente}>{c.cliente_documento || c.numero}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className={estilos.contratoMeta}>
                                                                        <span className={estilos.contratoNumero}>{c.numero}</span>
                                                                        <span className={estilos.contratoPlan}>{c.plan_nombre}</span>
                                                                        {infoProducto.esPrestamoProducto && (
                                                                            <div className={estilos.productoRefBadge}>
                                                                                <span className={estilos.productoRefTitulo}>{tr('Préstamo por producto', 'Product-based loan')}</span>
                                                                                <span className={estilos.productoRefNombre}>{infoProducto.producto}</span>
                                                                                <span className={estilos.productoRefPrecio}>{tr('Precio', 'Price')}: {fmtMoneda(infoProducto.precio)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {proxCuota ? (
                                                                        <div className={estilos.proximaCuota}>
                                                                            <span className={estilos.proximaLabel}>{tr('Proximo pago', 'Next payment')}</span>
                                                                            <span className={estilos.proximaMonto}>{fmtMoneda(parseFloat(proxCuota.monto_restante || proxCuota.monto) + parseFloat(proxCuota.mora || 0))}</span>
                                                                            <span className={`${estilos.proximaFecha} ${proxCuota.estado === 'vencida' ? estilos.fechaRoja : ''}`}>
                                                                                {fmtFecha(proxCuota.fecha_vencimiento)}
                                                                                {proxCuota.estado === 'vencida' && ` · ${diasVenc(proxCuota.fecha_vencimiento)}${tr('d vencida', 'd overdue')}`}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className={estilos.proximaCuota}>
                                                                            <span className={estilos.proximaLabel}>{tr('Sin cuotas pendientes', 'No pending installments')}</span>
                                                                        </div>
                                                                    )}

                                                                    <div className={estilos.contratoStats}>
                                                                        <span className={estilos.saldoLabel}>{tr('Saldo', 'Balance')}</span>
                                                                        <span className={estilos.saldoValor}>{fmtMoneda(c.saldo_pendiente)}</span>
                                                                        {tieneVenc && <span className={estilos.vencBadge}>{c.cuotas_vencidas} {tr('venc.', 'ovd.')}</span>}
                                                                    </div>

                                                                    <div className={estilos.contratoAcciones}>
                                                                        <Link href={`/admin/contratos/ver/${c.id}`} className={estilos.btnVerContrato}
                                                                            onClick={e => e.stopPropagation()}>
                                                                            <ion-icon name="eye-outline"></ion-icon>
                                                                        </Link>
                                                                        <div className={`${estilos.chevron} ${abierto ? estilos.chevronUp : ''}`}>
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {abierto && (
                                                                    <div className={estilos.cuotasPanel}>
                                                                        {cargandoCuotas ? (
                                                                            <div className={estilos.cargandoInline}><div className={estilos.spinnerSm}></div><span>{tr('Cargando cuotas...', 'Loading installments...')}</span></div>
                                                                        ) : (
                                                                            <>
                                                                            {pagosContrato.length > 0 && (
                                                                                <div className={estilos.pagosContratoBox}>
                                                                                    <h4>{tr('Pagos registrados', 'Recorded payments')}</h4>
                                                                                    {pagosContrato.map(p => (
                                                                                        <div key={p.id} className={estilos.pagoContratoItem}>
                                                                                            <div className={estilos.pagoContratoInfo}>
                                                                                                <div className={estilos.pagoContratoLinea}>
                                                                                                    <strong>{fmtMoneda(p.monto)}</strong>
                                                                                                    <span className={estilos.pagoContratoFecha}>{fmtFecha(p.fecha)}</span>
                                                                                                </div>
                                                                                                {esPagoAdelantado(p.notas) && (
                                                                                                    <span className={estilos.badgeAdelanto}>{tr('Pago adelantado', 'Advance payment')}</span>
                                                                                                )}
                                                                                            </div>
                                                                                            <button type="button" className={estilos.btnImprimirPago} onClick={() => abrirImprimir(p.id)} title={tr('Imprimir recibo', 'Print receipt')}>
                                                                                                <ion-icon name="print-outline"></ion-icon>
                                                                                                <span>{tr('Imprimir', 'Print')}</span>
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                            <div className={estilos.tablaWrapCuotas}>
                                                                                <table className={estilos.tablaCuotas}>
                                                                                    <thead>
                                                                                        <tr>
                                                                                            <th>#</th>
                                                                                            <th>{tr('Vencimiento', 'Due date')}</th>
                                                                                            <th>{tr('Cuota', 'Installment')}</th>
                                                                                            <th>{tr('Capital', 'Principal')}</th>
                                                                                            <th>{tr('Interes', 'Interest')}</th>
                                                                                            <th>Mora</th>
                                                                                            <th>Total</th>
                                                                                            <th>{tr('Estado', 'Status')}</th>
                                                                                            <th>{tr('Fecha pago', 'Payment date')}</th>
                                                                                            <th></th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {cuotasContrato.slice(paginaCuotas * CUOTAS_POR_PAGINA, (paginaCuotas + 1) * CUOTAS_POR_PAGINA).map(cu => {
                                                                                            const mora  = parseFloat(cu.mora || 0)
                                                                                            const montoBase = parseFloat(cu.monto_restante || cu.monto)
                                                                                            const total = montoBase + mora
                                                                                            const cs    = CUOTA_STYLE[cu.estado] || {}
                                                                                            const puede = ['pendiente','vencida','parcial'].includes(cu.estado)
                                                                                            const diasR = cu.estado === 'vencida' ? diasVenc(cu.fecha_vencimiento) : 0
                                                                                            const esParcial = cu.estado === 'parcial'
                                                                                            const montoPagado = esParcial && cu.monto_pagado ? parseFloat(cu.monto_pagado) : null
                                                                                            return (
                                                                                                <tr key={cu.id} className={`${estilos.filaCuota} ${cu.estado === 'vencida' ? estilos.filaVencida : ''}`}>
                                                                                                    <td className={estilos.tdNum}>{cu.numero}</td>
                                                                                                    <td className={estilos.tdGris}>
                                                                                                        {fmtFecha(cu.fecha_vencimiento)}
                                                                                                        {diasR > 0 && <span className={estilos.diasRetraso}>{diasR}d</span>}
                                                                                                    </td>
                                                                                                    <td className={estilos.tdMonto}>
                                                                                                        {esParcial && montoPagado !== null ? (
                                                                                                            <span className={estilos.montoParcialWrap}>
                                                                                                                <span className={estilos.montoRestante}>{fmtMoneda(montoBase)}</span>
                                                                                                                <span className={estilos.montoPagadoHint}>{tr('pagado', 'paid')} {fmtMoneda(montoPagado)}</span>
                                                                                                            </span>
                                                                                                        ) : fmtMoneda(parseFloat(cu.monto))}
                                                                                                    </td>
                                                                                                    <td className={estilos.tdGris}>{fmtMoneda(cu.capital)}</td>
                                                                                                    <td className={estilos.tdGris}>{fmtMoneda(cu.interes)}</td>
                                                                                                    <td className={mora > 0 ? estilos.tdDanger : estilos.tdGris}>
                                                                                                        {mora > 0 ? fmtMoneda(mora) : '—'}
                                                                                                    </td>
                                                                                                    <td className={estilos.tdMonto}>{fmtMoneda(total)}</td>
                                                                                                    <td><span className={estilos.estadoBadgeSm} style={{ background: cs.bg, color: cs.color }}>{tr({ pendiente: 'Pendiente', pagada: 'Pagada', parcial: 'Parcial', vencida: 'Vencida' }[cu.estado] || cu.estado, { pendiente: 'Pending', pagada: 'Paid', parcial: 'Partial', vencida: 'Overdue' }[cu.estado] || cu.estado)}</span></td>
                                                                                                    <td className={estilos.tdGris}>{cu.fecha_pago ? fmtFecha(cu.fecha_pago) : '—'}</td>
                                                                                                    <td>
                                                                                                        <div className={estilos.accionesCuota}>
                                                                                                            {(cu.estado === 'pagada' || cu.estado === 'parcial') && cu.ultimo_pago_id && (
                                                                                                                <button className={estilos.btnImprimirCuota} onClick={() => abrirImprimir(cu.ultimo_pago_id)} title={tr('Imprimir recibo', 'Print receipt')}>
                                                                                                                    <ion-icon name="print-outline"></ion-icon>
                                                                                                                </button>
                                                                                                            )}
                                                                                                            {puede && (
                                                                                                                <button className={estilos.btnPagarCuota} onClick={() => abrirModalPago(cu)}>
                                                                                                                    <ion-icon name="cash-outline"></ion-icon>
                                                                                                                    <span>{tr('Pagar', 'Pay')}</span>
                                                                                                                </button>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            )
                                                                                        })}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                            {cuotasContrato.length > CUOTAS_POR_PAGINA && (
                                                                                <div className={estilos.paginacionCuotas}>
                                                                                    <button className={estilos.btnPag} disabled={paginaCuotas === 0} onClick={() => setPaginaCuotas(p => p - 1)}>
                                                                                        <ion-icon name="chevron-back-outline"></ion-icon>
                                                                                    </button>
                                                                                    <span className={estilos.paginaInfo}>
                                                                                        {tr('Cuotas', 'Installments')} {paginaCuotas * CUOTAS_POR_PAGINA + 1}–{Math.min((paginaCuotas + 1) * CUOTAS_POR_PAGINA, cuotasContrato.length)} {tr('de', 'of')} {cuotasContrato.length}
                                                                                    </span>
                                                                                    <button className={estilos.btnPag} disabled={(paginaCuotas + 1) * CUOTAS_POR_PAGINA >= cuotasContrato.length} onClick={() => setPaginaCuotas(p => p + 1)}>
                                                                                        <ion-icon name="chevron-forward-outline"></ion-icon>
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                            {cuotasContrato.length > 0 && (() => {
                                                                                const pend = cuotasContrato.filter(cu => ['pendiente','vencida','parcial'].includes(cu.estado))
                                                                                const sumaCuotas   = cuotasContrato.reduce((acc, cu) => acc + parseFloat(cu.monto    || 0), 0)
                                                                                const sumaCapital  = cuotasContrato.reduce((acc, cu) => acc + parseFloat(cu.capital  || 0), 0)
                                                                                const sumaInteres  = cuotasContrato.reduce((acc, cu) => acc + parseFloat(cu.interes  || 0), 0)
                                                                                const sumaMora     = pend.reduce((acc, cu) => acc + parseFloat(cu.mora || 0), 0)
                                                                                const balanceRestante = pend.reduce((acc, cu) => acc + parseFloat(cu.monto_restante || cu.monto) + parseFloat(cu.mora || 0), 0)
                                                                                const pagadas = cuotasContrato.filter(cu => cu.estado === 'pagada').length
                                                                                return (
                                                                                    <div className={estilos.resumenCuotas}>
                                                                                        <div className={estilos.resumenItem}>
                                                                                            <span>{tr('Cuotas pagadas', 'Paid installments')}</span>
                                                                                            <strong>{pagadas} / {cuotasContrato.length}</strong>
                                                                                        </div>
                                                                                        <div className={estilos.resumenItem}>
                                                                                            <span>{tr('Total contrato', 'Contract total')}</span>
                                                                                            <strong>{fmtMoneda(sumaCuotas)}</strong>
                                                                                        </div>
                                                                                        <div className={estilos.resumenItem}>
                                                                                            <span>{tr('Capital', 'Principal')}</span>
                                                                                            <strong>{fmtMoneda(sumaCapital)}</strong>
                                                                                        </div>
                                                                                        <div className={estilos.resumenItem}>
                                                                                            <span>{tr('Interés', 'Interest')}</span>
                                                                                            <strong>{fmtMoneda(sumaInteres)}</strong>
                                                                                        </div>
                                                                                        {sumaMora > 0 && (
                                                                                            <div className={estilos.resumenItem}>
                                                                                                <span>{tr('Mora acumulada', 'Accumulated late fee')}</span>
                                                                                                <strong style={{ color: '#ef4444' }}>{fmtMoneda(sumaMora)}</strong>
                                                                                            </div>
                                                                                        )}
                                                                                        <div className={`${estilos.resumenItem} ${estilos.resumenBalance}`}>
                                                                                            <span>{tr('Balance restante', 'Remaining balance')}</span>
                                                                                            <strong>{fmtMoneda(balanceRestante)}</strong>
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            })()}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {totalPaginasContratos > 1 && (
                                <div className={estilos.paginacion}>
                                    <button className={estilos.btnPag} disabled={paginaContratos === 0} onClick={() => cargarContratos(paginaContratos - 1)}>
                                        <ion-icon name="chevron-back-outline"></ion-icon>
                                    </button>
                                    <span className={estilos.paginaInfo}>{paginaContratos + 1} / {totalPaginasContratos}</span>
                                    <button className={estilos.btnPag} disabled={paginaContratos >= totalPaginasContratos - 1} onClick={() => cargarContratos(paginaContratos + 1)}>
                                        <ion-icon name="chevron-forward-outline"></ion-icon>
                                    </button>
                                </div>
                            )}
                        </>
                    )
                    )}
                </>
            )}

            {tab === 'historial' && (
                <>
                    <div className={estilos.statsGrid}>
                        {[
                            { label: tr('Total pagos', 'Total payments'),   valor: statsPagos.total_pagos        || 0, color: 'blue',  icon: 'receipt-outline',   tipo: 'num' },
                            { label: tr('Monto cobrado', 'Collected amount'), valor: statsPagos.total_monto        || 0, color: 'green', icon: 'cash-outline',      tipo: 'mon' },
                            { label: tr('Mora cobrada', 'Collected late fee'),  valor: statsPagos.total_mora         || 0, color: 'red',   icon: 'warning-outline',   tipo: 'mon' },
                            { label: tr('Contratos', 'Contracts'),     valor: statsPagos.contratos_con_pago || 0, color: 'orange',icon: 'documents-outline', tipo: 'num' },
                        ].map((s, i) => (
                            <div key={i} className={`${estilos.statCard} ${estilos[s.color]}`}>
                                <div className={`${estilos.statIcono} ${estilos[s.color]}`}><ion-icon name={s.icon}></ion-icon></div>
                                <div>
                                    <span className={estilos.statValor}>{s.tipo === 'mon' ? fmtMoneda(s.valor) : s.valor}</span>
                                    <span className={estilos.statLabel}>{s.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={estilos.toolbar}>
                        <div className={estilos.buscadorWrapper}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input type="text" className={estilos.inputBuscador}
                                placeholder={tr('Buscar por nombre, cedula, contrato o referencia...', 'Search by name, ID, contract, or reference...')}
                                value={busquedaPago} onChange={e => setBusquedaPago(e.target.value)} />
                            {busquedaPago && <button className={estilos.btnLimpiar} onClick={() => setBusquedaPago('')}><ion-icon name="close-outline"></ion-icon></button>}
                        </div>
                        <input type="date" className={estilos.inputFecha} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} title={tr('Desde', 'From')} />
                        <input type="date" className={estilos.inputFecha} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} title={tr('Hasta', 'To')} />
                        {(fechaDesde || fechaHasta) && (
                            <button className={estilos.btnLimpiarFechas} onClick={() => { setFechaDesde(''); setFechaHasta('') }}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        )}
                    </div>

                    {cargando ? <LoadingScreen /> : pagos.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="receipt-outline"></ion-icon>
                            <h3>{tr('No hay pagos registrados', 'There are no recorded payments')}</h3>
                            <p>{busquedaPago ? tr('Intenta con otro termino', 'Try another term') : tr('Sin pagos por el momento', 'No payments at the moment')}</p>
                        </div>
                    ) : (
                        <>
                            <div className={estilos.tablaWrapper}>
                                <table className={estilos.tabla}>
                                    <thead><tr>
                                        <th>{tr('Fecha', 'Date')}</th><th>{tr('Contrato', 'Contract')}</th><th>{tr('Cliente', 'Customer')}</th><th>{tr('Cedula', 'ID')}</th>
                                        <th>{tr('Producto', 'Product')}</th>
                                        <th>{tr('Monto', 'Amount')}</th><th>{tr('Capital', 'Principal')}</th><th>{tr('Interes', 'Interest')}</th><th>{tr('Mora', 'Late fee')}</th>
                                        <th>{tr('Metodo', 'Method')}</th><th>{tr('Referencia', 'Reference')}</th><th>{tr('Registrado por', 'Recorded by')}</th><th></th>
                                    </tr></thead>
                                    <tbody>
                                        {pagos.map(p => {
                                            const infoProducto = obtenerInfoPrestamoProducto(p)
                                            return (
                                            <tr key={p.id} className={`${estilos.fila} ${infoProducto.esPrestamoProducto ? estilos.filaProducto : ''}`}>
                                                <td className={estilos.tdFecha}>{fmtFecha(p.fecha)}</td>
                                                <td><Link href={`/admin/contratos/ver/${p.contrato_id}`} className={estilos.linkContrato}>{p.contrato_numero}</Link></td>
                                                <td>
                                                    <div className={estilos.clienteCell}>
                                                        <span className={estilos.avatarMini}>{p.cliente_nombre?.charAt(0)}</span>
                                                        <span>{p.cliente_nombre}</span>
                                                    </div>
                                                </td>
                                                <td className={estilos.tdGris}>{p.cliente_documento || '—'}</td>
                                                <td>
                                                    {infoProducto.esPrestamoProducto ? (
                                                        <div className={estilos.productoHistCell}>
                                                            <span className={estilos.productoHistNombre}>{infoProducto.producto}</span>
                                                            <span className={estilos.productoHistPrecio}>{fmtMoneda(infoProducto.precio)}</span>
                                                        </div>
                                                    ) : <span className={estilos.tdGris}>—</span>}
                                                </td>
                                                <td><span className={estilos.montoTotal}>{fmtMoneda(p.monto)}</span></td>
                                                <td className={estilos.tdGris}>{fmtMoneda(p.monto_capital)}</td>
                                                <td className={estilos.tdGris}>{fmtMoneda(p.monto_interes)}</td>
                                                <td>{parseFloat(p.monto_mora) > 0 ? <span className={estilos.moraBadge}>{fmtMoneda(p.monto_mora)}</span> : <span className={estilos.tdGris}>—</span>}</td>
                                                <td className={estilos.tdGris}>{tipoPagoLabel(p)}</td>
                                                <td className={estilos.tdGris}>{p.referencia  || '—'}</td>
                                                <td className={estilos.tdGris}>{p.usuario_nombre || '—'}</td>
                                                <td>
                                                    <div className={estilos.acciones}>
                                                        <button className={estilos.btnVer} onClick={() => handleVerDetalle(p)} title={tr('Ver detalle', 'View details')}><ion-icon name="eye-outline"></ion-icon></button>
                                                        <button className={estilos.btnImprimir} onClick={() => abrirImprimir(p.id)} title={tr('Reimprimir ticket', 'Reprint receipt')}>
                                                            <ion-icon name="print-outline"></ion-icon>
                                                        </button>
                                                        <button className={estilos.btnEliminar} onClick={() => setModalAnular(p)} title={tr('Anular pago', 'Void payment')}><ion-icon name="trash-outline"></ion-icon></button>
                                                    </div>
                                                </td>
                                            </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {totalPaginasPagos > 1 && (
                                <div className={estilos.paginacion}>
                                    <button className={estilos.btnPag} disabled={paginaPagos === 0} onClick={() => cargarPagos(paginaPagos - 1)}><ion-icon name="chevron-back-outline"></ion-icon></button>
                                    <span className={estilos.paginaInfo}>{paginaPagos + 1} / {totalPaginasPagos}</span>
                                    <button className={estilos.btnPag} disabled={paginaPagos >= totalPaginasPagos - 1} onClick={() => cargarPagos(paginaPagos + 1)}><ion-icon name="chevron-forward-outline"></ion-icon></button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {tab === 'lista_negra' && (
                <>
                    <div className={estilos.bannerNegra}>
                        <ion-icon name="warning-outline"></ion-icon>
                        <div>
                            <strong>{tr('Lista Negra', 'Watchlist')}</strong>
                            <span>{tr('Contratos con cuotas vencidas. Requieren atencion inmediata.', 'Contracts with overdue installments. They require immediate attention.')}</span>
                        </div>
                    </div>

                    <div className={estilos.toolbar}>
                        <div className={estilos.buscadorWrapper}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input type="text" className={estilos.inputBuscador}
                                placeholder={tr('Buscar por nombre, cedula o contrato...', 'Search by name, ID, or contract...')}
                                value={busquedaNegra} onChange={e => setBusquedaNegra(e.target.value)} />
                            {busquedaNegra && <button className={estilos.btnLimpiar} onClick={() => setBusquedaNegra('')}><ion-icon name="close-outline"></ion-icon></button>}
                        </div>
                    </div>

                    {cargandoNegra ? <LoadingScreen /> : listaNegra.length === 0 ? (
                        <div className={estilos.vacio}>
                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                            <h3>{tr('Sin deudas vencidas', 'No overdue debts')}</h3>
                            <p>{tr('Todos los contratos estan al dia', 'All contracts are up to date')}</p>
                        </div>
                    ) : (
                        <div className={estilos.tablaWrapper}>
                            <table className={estilos.tabla}>
                                <thead><tr>
                                    <th>{tr('Cliente', 'Customer')}</th><th>{tr('Cedula', 'ID')}</th><th>{tr('Telefono', 'Phone')}</th><th>{tr('Contrato', 'Contract')}</th>
                                    <th>{tr('Plan', 'Plan')}</th><th>{tr('Cuotas vencidas', 'Overdue installments')}</th><th>{tr('Dias en mora', 'Days overdue')}</th>
                                    <th>{tr('Monto vencido', 'Overdue amount')}</th><th>{tr('Saldo total', 'Total balance')}</th><th></th>
                                </tr></thead>
                                <tbody>
                                    {listaNegra.map(c => (
                                        <tr key={c.id} className={`${estilos.fila} ${estilos.filaRoja}`}>
                                            <td>
                                                <div className={estilos.clienteCell}>
                                                    <span className={`${estilos.avatarMini} ${estilos.avatarNegroRojo}`}>{c.cliente_nombre?.charAt(0)}</span>
                                                    <span>{c.cliente_nombre}</span>
                                                </div>
                                            </td>
                                            <td className={estilos.tdGris}>{c.cliente_documento || '—'}</td>
                                            <td className={estilos.tdGris}>{c.cliente_telefono || '—'}</td>
                                            <td><Link href={`/admin/contratos/ver/${c.id}`} className={estilos.linkContrato}>{c.numero}</Link></td>
                                            <td className={estilos.tdGris}>{c.plan_nombre}</td>
                                            <td>
                                                <span className={estilos.badgeVencidas}>{c.cuotas_vencidas} {tr(c.cuotas_vencidas > 1 ? 'cuotas' : 'cuota', c.cuotas_vencidas > 1 ? 'installments' : 'installment')}</span>
                                            </td>
                                            <td>
                                                <span className={`${estilos.badgeDias} ${c.dias_mora > 30 ? estilos.badgeDiasGrave : c.dias_mora > 15 ? estilos.badgeDiasMedio : estilos.badgeDiasLeve}`}>
                                                    {c.dias_mora} {tr('dias', 'days')}
                                                </span>
                                            </td>
                                            <td><span className={estilos.montoRojo}>{fmtMoneda(c.monto_vencido)}</span></td>
                                            <td>{fmtMoneda(c.saldo_pendiente)}</td>
                                            <td>
                                                <Link href={`/admin/contratos/ver/${c.id}`} className={estilos.btnVerContrato}>
                                                    <ion-icon name="eye-outline"></ion-icon>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {modalPago && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && setModalPago(null)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3 className={estilos.modalTitulo}>
                                <ion-icon name="cash-outline"></ion-icon>
                                {tr('Registrar Pago', 'Record Payment')} — {tr('Cuota', 'Installment')} #{modalPago.numero}
                            </h3>
                            <button className={estilos.btnCerrarModal} onClick={() => setModalPago(null)}><ion-icon name="close-outline"></ion-icon></button>
                        </div>

                        <div className={estilos.modalResumen}>
                            <div className={estilos.modalResumenItem}>
                                <span>{tr('Cuota', 'Installment')}</span>
                                <strong>{fmtMoneda(modalPago.monto_restante || modalPago.monto)}</strong>
                            </div>
                            <div className={estilos.modalResumenItem}>
                                <span>{tr('Mora acumulada', 'Accumulated late fee')}</span>
                                <strong style={{ color: parseFloat(modalPago.mora||0) > 0 ? '#ef4444' : 'inherit' }}>
                                    {parseFloat(modalPago.mora||0) > 0 ? fmtMoneda(modalPago.mora) : '—'}
                                </strong>
                            </div>
                            <div className={`${estilos.modalResumenItem} ${estilos.modalResumenTotal}`}>
                                <span>{tr('Total a pagar', 'Total to pay')}</span>
                                <strong>{fmtMoneda(montoTotalModal)}</strong>
                            </div>
                        </div>

                        {modalPago.estado === 'vencida' && (
                            <div className={estilos.alertaMora}>
                                <ion-icon name="warning-outline"></ion-icon>
                                <span>{tr('Esta cuota tiene', 'This installment is')} <strong>{diasVenc(modalPago.fecha_vencimiento)} {tr('dias', 'days')}</strong> {tr('de retraso. La mora se calcula al', 'late. Late fees are calculated at')} <strong>{moraPct}%</strong> {tr('mensual.', 'monthly.')}</span>
                            </div>
                        )}

                        <div className={estilos.modalBody}>
                            <div className={estilos.gridDos}>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Monto recibido *', 'Amount received *')}</label>
                                    <div className={estilos.inputMoneda}>
                                        <span>{simboloMoneda}</span>
                                        <input type="number" min="0" step="0.01" className={estilos.input}
                                            value={formPago.monto} onChange={e => setFormPago(v => ({ ...v, monto: e.target.value }))} />
                                    </div>
                                </div>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Fecha de pago', 'Payment date')}</label>
                                    <input type="date" className={estilos.input}
                                        value={formPago.fecha} onChange={e => setFormPago(v => ({ ...v, fecha: e.target.value }))} />
                                </div>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Metodo de pago', 'Payment method')}</label>
                                    <select className={estilos.select}
                                        value={formPago.metodo_pago_id} onChange={e => setFormPago(v => ({ ...v, metodo_pago_id: e.target.value }))}>
                                        <option value="">{tr('Sin especificar', 'Unspecified')}</option>
                                        {metodos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Referencia', 'Reference')}</label>
                                    <input type="text" className={estilos.input}
                                        placeholder={tr('No. cheque, transferencia...', 'Check no., transfer...')}
                                        value={formPago.referencia} onChange={e => setFormPago(v => ({ ...v, referencia: e.target.value }))} />
                                </div>
                            </div>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Notas', 'Notes')}</label>
                                <input type="text" className={estilos.input}
                                    placeholder={tr('Observaciones...', 'Notes...')}
                                    value={formPago.notas} onChange={e => setFormPago(v => ({ ...v, notas: e.target.value }))} />
                            </div>

                            {simulacion && simulacion.length > 0 && (
                                <div className={estilos.simulacion}>
                                    <div className={estilos.simulacionTitulo}>
                                        <ion-icon name="flash-outline"></ion-icon>
                                            {tr('Distribucion automatica del pago', 'Automatic payment distribution')}
                                    </div>
                                    {simulacion.map((s, i) => (
                                        <div key={i} className={estilos.simulacionFila}>
                                                <span>{tr('Cuota', 'Installment')} #{s.numero}</span>
                                            <span className={`${estilos.simEstado} ${s.estado === 'pagada' ? estilos.simPagada : estilos.simParcial}`}>{s.estado}</span>
                                            <span>{fmtMoneda(s.monto)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {errorPago && (
                                <div className={estilos.errorMsg}>
                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                    {errorPago}
                                </div>
                            )}
                        </div>

                        <div className={estilos.modalAcciones}>
                            <button className={estilos.btnCancelar} onClick={() => setModalPago(null)}>{tr('Cancelar', 'Cancel')}</button>
                            <button className={estilos.btnConfirmar} onClick={handleRegistrarPago} disabled={guardando}>
                                {guardando ? <><div className={estilos.spinnerSm}></div>{tr('Guardando...', 'Saving...')}</> : <><ion-icon name="checkmark-circle-outline"></ion-icon>{tr('Confirmar Pago', 'Confirm Payment')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalDetalle && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && setModalDetalle(null)}>
                    <div className={`${estilos.modal} ${estilos.modalGrande} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3 className={estilos.modalTitulo}><ion-icon name="receipt-outline"></ion-icon> {tr('Detalle del pago', 'Payment details')}</h3>
                            <button className={estilos.btnCerrarModal} onClick={() => { setModalDetalle(null); setDetalle(null) }}><ion-icon name="close-outline"></ion-icon></button>
                        </div>
                        {cargandoDetalle ? (
                            <div className={estilos.cargandoModal}><div className={estilos.spinner}></div></div>
                        ) : detalle ? (
                            <div className={estilos.modalBody}>
                                <div className={estilos.detalleGrid}>
                                    {[
                                        { l: tr('Contrato', 'Contract'), v: detalle.pago.contrato_numero },
                                        { l: tr('Cliente', 'Customer'),  v: detalle.pago.cliente_nombre },
                                        { l: tr('Cedula', 'ID'),   v: detalle.pago.cliente_documento || '—' },
                                        { l: tr('Fecha', 'Date'),    v: fmtFecha(detalle.pago.fecha) },
                                        { l: tr('Metodo', 'Method'),   v: metodoPagoTexto(detalle.pago.metodo_pago) },
                                        { l: tr('Referencia', 'Reference'), v: detalle.pago.referencia || '—' },
                                        { l: tr('Registrado por', 'Recorded by'), v: detalle.pago.usuario_nombre || '—' },
                                        { l: tr('Monto total', 'Total amount'), v: fmtMoneda(detalle.pago.monto), destacado: true },
                                        { l: tr('Capital', 'Principal'),  v: fmtMoneda(detalle.pago.monto_capital) },
                                        { l: tr('Interes', 'Interest'),  v: fmtMoneda(detalle.pago.monto_interes) },
                                        { l: tr('Mora', 'Late fee'),     v: fmtMoneda(detalle.pago.monto_mora) },
                                    ].map((x, i) => (
                                        <div key={i} className={estilos.detalleItem}>
                                            <span className={estilos.detalleLabel}>{x.l}</span>
                                            <span className={`${estilos.detalleValor} ${x.destacado ? estilos.montoDestacado : ''}`}>{x.v}</span>
                                        </div>
                                    ))}
                                </div>
                                {detalle.cuotasAplicadas?.length > 0 && (
                                    <div className={estilos.cuotasAplicadas}>
                                        <h4 className={estilos.cuotasAplicadasTitulo}>{tr('Cuotas aplicadas', 'Applied installments')}</h4>
                                        {detalle.cuotasAplicadas.map((c, i) => (
                                            <div key={i} className={estilos.cuotaAplicadaRow}>
                                                <span>{tr('Cuota', 'Installment')} #{c.numero}</span>
                                                <span className={estilos.tdFecha}>{fmtFecha(c.fecha_vencimiento)}</span>
                                                <span className={`${estilos.estadoBadgeSm} ${estilos[ESTADO_COLOR[c.estado]]}`} style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{c.estado}</span>
                                                <span className={estilos.montoTotal}>{fmtMoneda(c.aplicado)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {detalle.pago.notas && <div className={estilos.notasPago}><span className={estilos.detalleLabel}>{tr('Notas', 'Notes')}</span><p>{detalle.pago.notas}</p></div>}
                            </div>
                        ) : null}
                        <div className={estilos.modalAcciones}>
                            <button className={estilos.btnCancelar} onClick={() => { setModalDetalle(null); setDetalle(null) }}>{tr('Cerrar', 'Close')}</button>
                            <button className={estilos.btnImprimir2} onClick={() => abrirImprimir(modalDetalle.id)}>
                                <ion-icon name="print-outline"></ion-icon> {tr('Imprimir', 'Print')}
                            </button>
                            <button className={estilos.btnAnular} onClick={() => setModalAnular(modalDetalle)}>
                                <ion-icon name="trash-outline"></ion-icon> {tr('Anular pago', 'Void payment')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalAnular && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && setModalAnular(null)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalIconoEliminar}><ion-icon name="trash-outline"></ion-icon></div>
                        <h3 className={estilos.modalTituloCenter}>{tr('Anular pago', 'Void payment')}</h3>
                        <p className={estilos.modalTexto}>{tr('Se revertiran las cuotas aplicadas y se restaurara el saldo. Esta accion no se puede deshacer.', 'Applied installments will be reversed and the balance will be restored. This action cannot be undone.')}</p>
                        <div className={estilos.modalAcciones}>
                            <button className={estilos.btnCancelar} onClick={() => setModalAnular(null)}>{tr('Cancelar', 'Cancel')}</button>
                            <button className={estilos.btnConfirmarEliminar} onClick={handleAnular} disabled={anulando}>
                                {anulando ? <><div className={estilos.spinnerSm}></div>{tr('Anulando...', 'Voiding...')}</> : <><ion-icon name="trash-outline"></ion-icon>{tr('Anular', 'Void')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}