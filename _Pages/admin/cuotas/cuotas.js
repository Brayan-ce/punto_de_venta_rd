"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerClientesConCuotas, obtenerCuotasContrato, registrarPagoCuota, recalcularMorasVencidas, obtenerDatosEmpresa, eliminarFinanciamientoProducto } from './servidor'
import { useLanguage } from '../i18n/LanguageProvider'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'
import estilos from './cuotas.module.css'

const CUOTA_STYLE  = {
    pendiente: { bg: '#fef3c7', color: '#92400e' },
    pagada:    { bg: '#d1fae5', color: '#065f46' },
    vencida:   { bg: '#fee2e2', color: '#991b1b' },
    parcial:   { bg: '#e0f2fe', color: '#075985' },
}
const PAGE_SIZE    = 20
const PAGO_VACIO   = { monto: '', metodo_pago_id: '', referencia: '', notas: '', fecha: new Date().toISOString().split('T')[0] }

export default function CuotasFinanciamiento() {
    const router = useRouter()
    const { language } = useLanguage()
    const [tema, setTema]         = useState('light')
    const [cargando, setCargando] = useState(true)
    const [clientes, setClientes] = useState([])
    const [stats, setStats]       = useState({})
    const [metodos, setMetodos]   = useState([])
    const [total, setTotal]       = useState(0)
    const [pagina, setPagina]     = useState(0)

    const [busqueda, setBusqueda]         = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [proximas, setProximas]         = useState(false)

    const [abiertos, setAbiertos]           = useState({})
    const [cuotasMap, setCuotasMap]         = useState({})
    const [cargandoCuotas, setCargandoCuotas] = useState({})

    const [modalPago, setModalPago]   = useState(null)
    const [formPago, setFormPago]     = useState({ ...PAGO_VACIO })
    const [guardando, setGuardando]   = useState(false)
    const [errorPago, setErrorPago]   = useState('')

    const [recalculando, setRecalculando] = useState(false)
    const [msgRecalc, setMsgRecalc]       = useState('')
    const [empresa, setEmpresa]           = useState(null)

    const [modalEliminar, setModalEliminar] = useState(null)
    const [eliminando, setEliminando]       = useState(false)
    const [errorEliminar, setErrorEliminar] = useState('')

    const tr = (es, en) => language === 'en' ? en : es
    const ESTADO_LABEL = { pendiente: tr('Pendiente', 'Pending'), pagada: tr('Pagada', 'Paid'), vencida: tr('Vencida', 'Overdue'), parcial: tr('Parcial', 'Partial') }
    const abrirImprimir = (pagoId) => router.push(`/admin/pagos/imprimir/${pagoId}`)

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const fn = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', fn)
        window.addEventListener('storage', fn)
        cargarEmpresa()

        const params = new URLSearchParams(window.location.search)
        if (params.get('proximas')) {
            setProximas(true)
            setFiltroEstado('todos')
        } else if (params.get('estado')) {
            setFiltroEstado(params.get('estado'))
        }

        return () => { window.removeEventListener('temaChange', fn); window.removeEventListener('storage', fn) }
    }, [])

    useEffect(() => {
        const t = setTimeout(() => cargar(0), 300)
        return () => clearTimeout(t)
    }, [busqueda, filtroEstado, proximas])

    const cargar = async (p = 0) => {
        setCargando(true)
        const r = await obtenerClientesConCuotas({ busqueda, estado: filtroEstado, proximas, limit: PAGE_SIZE, offset: p * PAGE_SIZE })
        if (r.success) {
            setClientes(r.clientes)
            setStats(r.stats)
            setTotal(r.total)
            setPagina(p)
            if (r.metodos?.length) setMetodos(r.metodos)
        }
        setCargando(false)
    }

    const toggleContrato = async (contratoId) => {
        const yaAbierto = abiertos[contratoId]
        setAbiertos(p => ({ ...p, [contratoId]: !yaAbierto }))
        if (!yaAbierto && !cuotasMap[contratoId]) {
            setCargandoCuotas(p => ({ ...p, [contratoId]: true }))
            const r = await obtenerCuotasContrato(contratoId)
            if (r.success) setCuotasMap(p => ({ ...p, [contratoId]: r.cuotas }))
            setCargandoCuotas(p => ({ ...p, [contratoId]: false }))
        }
    }

    const abrirModalPago = (cuota, e) => {
        e?.stopPropagation()
        setModalPago(cuota)
        setErrorPago('')
        setFormPago({
            ...PAGO_VACIO,
            monto: (parseFloat(cuota.monto) + parseFloat(cuota.mora || 0)).toFixed(2)
        })
    }

    const handleRegistrarPago = async () => {
        if (!formPago.monto || parseFloat(formPago.monto) <= 0) { setErrorPago(tr('El monto debe ser mayor a 0', 'Amount must be greater than 0')); return }
        setGuardando(true); setErrorPago('')
        const r = await registrarPagoCuota(modalPago.id || modalPago.cuota_id, formPago)
        if (r.success) {
            setModalPago(null)
            // refrescar cuotas del contrato abierto si las tenemos
            const cid = modalPago.contrato_id
            if (cid && cuotasMap[cid]) {
                const rc = await obtenerCuotasContrato(cid)
                if (rc.success) setCuotasMap(p => ({ ...p, [cid]: rc.cuotas }))
            }
            cargar(pagina)
        } else setErrorPago(r.mensaje)
        setGuardando(false)
    }

    const handleRecalcular = async () => {
        setRecalculando(true); setMsgRecalc('')
        const r = await recalcularMorasVencidas()
        setMsgRecalc(r.mensaje)
        setRecalculando(false)
        cargar(0)
    }

    const totalPaginas = Math.ceil(total / PAGE_SIZE)

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'
    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'

    const fmtMoneda = (v) => new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 2 }).format(v || 0)
    const fmtFecha  = (f) => {
        if (!f) return '—'
        const s = typeof f === 'string' ? f : f instanceof Date ? f.toISOString() : String(f)
        const [y, m, d] = s.slice(0,10).split('-').map(Number)
        if (!y||!m||!d) return '—'
        return new Date(y, m-1, d).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
    }
    const diasVenc = (f) => {
        if (!f) return 0
        const hoy = new Date(); hoy.setHours(0,0,0,0)
        const [y,m,d] = String(f).slice(0,10).split('-').map(Number)
        return Math.max(0, Math.floor((hoy - new Date(y,m-1,d)) / 86400000))
    }
    const extraerReferenciaProducto = (notas) => {
        if (!notas) return ''
        const m = String(notas).match(/Productos:\s*([^|]+)/i)
        return m?.[1]?.trim() || ''
    }
    const obtenerInfoPrestamoProducto = (contrato) => {
        const notas = contrato?.contrato_notas || ''
        const producto = extraerReferenciaProducto(notas)
        const precio = parseFloat(contrato?.monto_producto || 0)
        const esPrestamoProducto = !!producto || /Generado desde venta/i.test(notas)
        return { esPrestamoProducto, producto, precio }
    }

    const abrirModalEliminar = (contrato, e) => {
        e?.stopPropagation()
        setModalEliminar(contrato)
        setErrorEliminar('')
    }

    const handleEliminarFinanciamiento = async () => {
        if (!modalEliminar) return
        setEliminando(true)
        setErrorEliminar('')
        const r = await eliminarFinanciamientoProducto(modalEliminar.id)
        if (r.success) {
            setModalEliminar(null)
            setAbiertos(p => {
                const next = { ...p }
                delete next[modalEliminar.id]
                return next
            })
            setCuotasMap(p => {
                const next = { ...p }
                delete next[modalEliminar.id]
                return next
            })
            setMsgRecalc(r.mensaje)
            cargar(pagina)
        } else {
            setErrorEliminar(r.mensaje)
        }
        setEliminando(false)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}><ion-icon name="calendar-outline"></ion-icon></div>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Cuotas', 'Installments')}</h1>
                        <p className={estilos.subtitulo}>{tr('Panel de cobros —', 'Collections panel —')} {total} {tr(total !== 1 ? 'contratos' : 'contrato', total !== 1 ? 'contracts' : 'contract')} {tr('con cuotas pendientes', 'with pending installments')}</p>
                    </div>
                </div>
                <button className={estilos.btnRecalc} onClick={handleRecalcular} disabled={recalculando}>
                    {recalculando
                        ? <><div className={estilos.spinnerSm}></div>{tr('Calculando...', 'Calculating...')}</>
                        : <><ion-icon name="refresh-outline"></ion-icon><span>{tr('Recalcular moras', 'Recalculate late fees')}</span></>}
                </button>
            </div>

            {msgRecalc && (
                <div className={estilos.msgBanner}>
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                    <span>{msgRecalc}</span>
                    <button onClick={() => setMsgRecalc('')}><ion-icon name="close-outline"></ion-icon></button>
                </div>
            )}

            <div className={estilos.statsGrid}>
                {[
                    { label: tr('Contratos activos', 'Active contracts'), valor: stats.contratos_activos  || 0, color: 'blue',   icon: 'documents-outline',    tipo: 'num' },
                    { label: tr('Cuotas vencidas', 'Overdue installments'),   valor: stats.cuotas_vencidas   || 0, color: 'red',    icon: 'alert-circle-outline', tipo: 'num' },
                    { label: tr('Monto pendiente', 'Outstanding amount'),   valor: stats.monto_pendiente   || 0, color: 'orange', icon: 'cash-outline',         tipo: 'mon' },
                    { label: tr('Mora acumulada', 'Accumulated late fee'),    valor: stats.mora_total        || 0, color: 'purple', icon: 'warning-outline',      tipo: 'mon' },
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
                        placeholder={tr('Nombre, cédula, teléfono o contrato...', 'Name, ID, phone, or contract...')}
                        value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                    {busqueda && <button className={estilos.btnLimpiar} onClick={() => setBusqueda('')}><ion-icon name="close-outline"></ion-icon></button>}
                </div>
                <div className={estilos.filtros}>
                    {[
                        { key: 'todos',     label: tr('Todos', 'All') },
                        { key: 'proximas',  label: tr('Próximas 7d', 'Next 7d'), color: 'blue' },
                        { key: 'vencida',   label: tr('Vencidas', 'Overdue'),   color: 'red' },
                        { key: 'pendiente', label: tr('Pendientes', 'Pending'), color: 'orange' },
                        { key: 'parcial',   label: tr('Parciales', 'Partial'),  color: 'blue' },
                    ].map(f => {
                        const activo = f.key === 'proximas' ? proximas : filtroEstado === f.key
                        return (
                            <button key={f.key}
                                className={`${estilos.filtroBtn} ${activo ? estilos.filtroActivo : ''} ${f.color ? estilos['fBtn_' + f.color] : ''}`}
                                onClick={() => {
                                    if (f.key === 'proximas') {
                                        setProximas(p => !p)
                                        setFiltroEstado('todos')
                                    } else {
                                        setProximas(false)
                                        setFiltroEstado(f.key)
                                    }
                                }}>
                                {f.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {cargando ? <LoadingScreen /> : clientes.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="checkmark-done-circle-outline"></ion-icon>
                    <h3>{tr('Sin cuotas pendientes', 'No pending installments')}</h3>
                    <p>{busqueda ? tr('Intenta con otro término', 'Try another term') : tr('Todos los contratos están al día', 'All contracts are up to date')}</p>
                </div>
            ) : (
                <>
                    <div className={estilos.lista}>
                        {clientes.map(c => {
                            const abierto   = !!abiertos[c.id]
                            const cargandoC = !!cargandoCuotas[c.id]
                            const cuotas    = cuotasMap[c.id] || []
                            const dias      = diasVenc(c.fecha_vencimiento)
                            const mora      = parseFloat(c.mora || 0)
                            const montoCuota = c.cuota_estado === 'parcial' && c.cuota_monto_pendiente != null
                                ? parseFloat(c.cuota_monto_pendiente)
                                : parseFloat(c.monto || 0)
                            const total_cu  = montoCuota + mora
                            const cs        = CUOTA_STYLE[c.cuota_estado] || {}
                            const infoProducto = obtenerInfoPrestamoProducto(c)

                            return (
                                <div key={c.id} className={`${estilos.card} ${c.cuota_estado === 'vencida' ? estilos.cardVencida : ''} ${infoProducto.esPrestamoProducto ? estilos.cardProducto : ''}`}>

                                    {/* FILA PRINCIPAL */}
                                    <div className={estilos.cardMain} onClick={() => toggleContrato(c.id)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && toggleContrato(c.id)}>

                                        {/* cliente */}
                                        <div className={estilos.clienteInfo}>
                                            <div className={estilos.avatar}>{c.cliente_nombre?.charAt(0)}</div>
                                            <div>
                                                <span className={estilos.clienteNombre}>{c.cliente_nombre}</span>
                                                <span className={estilos.clienteSub}>{c.cliente_documento || c.cliente_telefono || ''}</span>
                                            </div>
                                        </div>

                                        {/* contrato */}
                                        <div className={estilos.contratoInfo}>
                                            <Link href={`/admin/contratos/ver/${c.id}`} className={estilos.linkContrato} onClick={e => e.stopPropagation()}>
                                                {c.numero}
                                            </Link>
                                            <span className={estilos.planLabel}>{c.plan_nombre}</span>
                                            {infoProducto.esPrestamoProducto && (
                                                <div className={estilos.productoRefBadge}>
                                                    <span className={estilos.productoRefTitulo}>{tr('Préstamo por producto', 'Product-based loan')}</span>
                                                    <span className={estilos.productoRefNombre}>{infoProducto.producto}</span>
                                                    <span className={estilos.productoRefPrecio}>{tr('Precio', 'Price')}: {fmtMoneda(infoProducto.precio)}</span>
                                                </div>
                                            )}
                                            {c.categoria_nombre && (
                                                <span className={estilos.catChip} style={{ background: (c.categoria_color || '#94a3b8') + '22', color: c.categoria_color || '#94a3b8', borderColor: (c.categoria_color || '#94a3b8') + '55' }}>
                                                    {c.categoria_nombre}
                                                </span>
                                            )}
                                        </div>

                                        {/* proxima cuota */}
                                        <div className={estilos.proxCuota}>
                                            <span className={estilos.proxLabel}>{tr('Cuota', 'Installment')} #{c.cuota_numero}</span>
                                            <span className={estilos.proxMonto}>{fmtMoneda(total_cu)}</span>
                                            <span className={`${estilos.proxFecha} ${c.cuota_estado === 'vencida' ? estilos.fechaRoja : ''}`}>
                                                {fmtFecha(c.fecha_vencimiento)}
                                                {dias > 0 && c.cuota_estado === 'vencida' && <span className={estilos.diasBadge}>{dias}d</span>}
                                            </span>
                                        </div>

                                        {/* estado + saldo */}
                                        <div className={estilos.estadoInfo}>
                                            <span className={estilos.estadoBadge} style={{ background: cs.bg, color: cs.color }}>
                                                {ESTADO_LABEL[c.cuota_estado]}
                                            </span>
                                            {mora > 0 && <span className={estilos.moraBadge}>+{fmtMoneda(mora)} {tr('mora', 'late fee')}</span>}
                                            <span className={estilos.saldoLabel}>{tr('Saldo:', 'Balance:')} {fmtMoneda(c.saldo_pendiente)}</span>
                                        </div>

                                        {/* acciones */}
                                        <div className={estilos.cardAcciones} onClick={e => e.stopPropagation()}>
                                            {c.cuotas_vencidas > 0 && (
                                                <span className={estilos.vencBadge}>{c.cuotas_vencidas} {tr('venc.', 'ovd.')}</span>
                                            )}
                                            <button className={estilos.btnPagar}
                                                onClick={e => abrirModalPago({ id: c.cuota_id, cuota_id: c.cuota_id, contrato_id: c.id, numero: c.cuota_numero, monto: montoCuota, mora: c.mora }, e)}>
                                                <ion-icon name="cash-outline"></ion-icon>
                                                <span>{tr('Pagar', 'Pay')}</span>
                                            </button>
                                            {infoProducto.esPrestamoProducto && (
                                                <button
                                                    className={estilos.btnEliminar}
                                                    onClick={e => abrirModalEliminar(c, e)}
                                                    title={tr('Eliminar financiamiento', 'Delete financing')}
                                                >
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                    <span>{tr('Eliminar', 'Delete')}</span>
                                                </button>
                                            )}
                                            <div className={`${estilos.chevron} ${abierto ? estilos.chevronUp : ''}`}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PANEL EXPANDIDO */}
                                    {abierto && (
                                        <div className={estilos.cuotasPanel}>
                                            {cargandoC ? (
                                                <div className={estilos.cargandoInline}><div className={estilos.spinnerSm}></div><span>{tr('Cargando cuotas...', 'Loading installments...')}</span></div>
                                            ) : (
                                                <div className={estilos.cuotasScroll}>
                                                    {cuotas.map(cu => {
                                                        const csMini = CUOTA_STYLE[cu.estado] || {}
                                                        const moraCu = parseFloat(cu.mora || 0)
                                                        const montoCu = (cu.estado === 'parcial' && cu.monto_pendiente != null)
                                                            ? parseFloat(cu.monto_pendiente)
                                                            : parseFloat(cu.monto || 0)
                                                        const puede  = ['pendiente','vencida','parcial'].includes(cu.estado)
                                                        return (
                                                            <div key={cu.id} className={`${estilos.cuotaFila} ${cu.estado === 'vencida' ? estilos.cuotaFilaVenc : cu.estado === 'pagada' ? estilos.cuotaFilaPagada : ''}`}>
                                                                <span className={estilos.cuotaNum}>#{cu.numero}</span>
                                                                <span className={estilos.cuotaVenc}>{fmtFecha(cu.fecha_vencimiento)}</span>
                                                                <span className={estilos.cuotaMonto}>{fmtMoneda(montoCu + moraCu)}</span>
                                                                {moraCu > 0
                                                                    ? <span className={estilos.cuotaMora}>+{fmtMoneda(moraCu)}</span>
                                                                    : <span className={estilos.cuotaMoraVacia}>—</span>}
                                                                <span className={estilos.cuotaFechaPago}>{cu.fecha_pago ? fmtFecha(cu.fecha_pago) : '—'}</span>
                                                                <span className={estilos.cuotaEstado} style={{ background: csMini.bg, color: csMini.color }}>
                                                                    {ESTADO_LABEL[cu.estado]}
                                                                </span>
                                                                <div className={estilos.accionesCuota}>
                                                                    {cu.estado === 'pagada' && cu.ultimo_pago_id && (
                                                                        <button
                                                                            className={estilos.btnImprimirCuota}
                                                                            onClick={() => abrirImprimir(cu.ultimo_pago_id)}
                                                                            title={tr('Imprimir recibo', 'Print receipt')}
                                                                        >
                                                                            <ion-icon name="print-outline"></ion-icon>
                                                                        </button>
                                                                    )}
                                                                    {puede
                                                                        ? <button className={estilos.btnPagarMini} onClick={e => abrirModalPago({ ...cu, monto: montoCu, contrato_id: c.id }, e)}>
                                                                            <ion-icon name="cash-outline"></ion-icon> {tr('Pagar', 'Pay')}
                                                                        </button>
                                                                        : <span></span>}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {totalPaginas > 1 && (
                        <div className={estilos.paginacion}>
                            <button className={estilos.btnPag} disabled={pagina === 0} onClick={() => cargar(pagina - 1)}>
                                <ion-icon name="chevron-back-outline"></ion-icon>
                            </button>
                            <span className={estilos.paginaInfo}>{pagina + 1} / {totalPaginas}</span>
                            <button className={estilos.btnPag} disabled={pagina >= totalPaginas - 1} onClick={() => cargar(pagina + 1)}>
                                <ion-icon name="chevron-forward-outline"></ion-icon>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* MODAL ELIMINAR FINANCIAMIENTO POR PRODUCTO */}
            {modalEliminar && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && !eliminando && setModalEliminar(null)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3 className={`${estilos.modalTitulo} ${estilos.modalTituloPeligro}`}>
                                <ion-icon name="trash-outline"></ion-icon>
                                {tr('Eliminar financiamiento', 'Delete financing')}
                            </h3>
                            <button className={estilos.btnCerrar} onClick={() => !eliminando && setModalEliminar(null)} disabled={eliminando}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <p className={estilos.textoEliminar}>
                                {tr(
                                    'Se eliminará el contrato, todas sus cuotas y pagos asociados. Esta acción no se puede deshacer.',
                                    'The contract, all installments, and related payments will be deleted. This cannot be undone.'
                                )}
                            </p>
                            <div className={estilos.resumenEliminar}>
                                <div><span>{tr('Contrato', 'Contract')}</span><strong>{modalEliminar.numero}</strong></div>
                                <div><span>{tr('Cliente', 'Customer')}</span><strong>{modalEliminar.cliente_nombre}</strong></div>
                                {obtenerInfoPrestamoProducto(modalEliminar).producto && (
                                    <div><span>{tr('Producto', 'Product')}</span><strong>{obtenerInfoPrestamoProducto(modalEliminar).producto}</strong></div>
                                )}
                                <div><span>{tr('Saldo pendiente', 'Outstanding balance')}</span><strong>{fmtMoneda(modalEliminar.saldo_pendiente)}</strong></div>
                            </div>
                            {errorEliminar && (
                                <div className={estilos.errorMsg}>
                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                    {errorEliminar}
                                </div>
                            )}
                        </div>
                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnCancelar} onClick={() => setModalEliminar(null)} disabled={eliminando}>
                                {tr('Cancelar', 'Cancel')}
                            </button>
                            <button className={estilos.btnConfirmarPeligro} onClick={handleEliminarFinanciamiento} disabled={eliminando}>
                                {eliminando
                                    ? <><div className={estilos.spinnerSm}></div>{tr('Eliminando...', 'Deleting...')}</>
                                    : <><ion-icon name="trash-outline"></ion-icon>{tr('Eliminar definitivamente', 'Delete permanently')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PAGO */}
            {modalPago && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && setModalPago(null)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3 className={estilos.modalTitulo}>
                                <ion-icon name="cash-outline"></ion-icon>
                                {tr('Cuota', 'Installment')} #{modalPago.numero}
                            </h3>
                            <button className={estilos.btnCerrar} onClick={() => setModalPago(null)}><ion-icon name="close-outline"></ion-icon></button>
                        </div>

                        <div className={estilos.modalResumen}>
                            <div className={estilos.resumenItem}><span>{tr('Cuota', 'Installment')}</span><strong>{fmtMoneda(modalPago.monto)}</strong></div>
                            {parseFloat(modalPago.mora || 0) > 0 && (
                                <div className={estilos.resumenItem}><span>{tr('Mora', 'Late fee')}</span><strong style={{ color: '#ef4444' }}>{fmtMoneda(modalPago.mora)}</strong></div>
                            )}
                            <div className={`${estilos.resumenItem} ${estilos.resumenTotal}`}>
                                <span>{tr('Total', 'Total')}</span>
                                <strong>{fmtMoneda(parseFloat(modalPago.monto) + parseFloat(modalPago.mora || 0))}</strong>
                            </div>
                        </div>

                        <div className={estilos.modalBody}>
                            <div className={estilos.gridDos}>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Monto recibido *', 'Amount received *')}</label>
                                    <div className={estilos.inputMoneda}>
                                        <span>{language === 'en' ? monedaEmpresa : simboloMoneda}</span>
                                        <input type="number" min="0" step="0.01" className={estilos.input}
                                            value={formPago.monto} onChange={e => setFormPago(v => ({ ...v, monto: e.target.value }))} />
                                    </div>
                                </div>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Fecha', 'Date')}</label>
                                    <input type="date" className={estilos.input}
                                        value={formPago.fecha} onChange={e => setFormPago(v => ({ ...v, fecha: e.target.value }))} />
                                </div>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Método de pago', 'Payment method')}</label>
                                    <select className={estilos.selectInput}
                                        value={formPago.metodo_pago_id} onChange={e => setFormPago(v => ({ ...v, metodo_pago_id: e.target.value }))}>
                                        <option value="">{tr('Sin especificar', 'Unspecified')}</option>
                                        {metodos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div className={estilos.campo}>
                                    <label className={estilos.label}>{tr('Referencia', 'Reference')}</label>
                                    <input type="text" className={estilos.input} placeholder={tr('No. cheque, transferencia...', 'Check no., transfer...')}
                                        value={formPago.referencia} onChange={e => setFormPago(v => ({ ...v, referencia: e.target.value }))} />
                                </div>
                            </div>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Notas', 'Notes')}</label>
                                <input type="text" className={estilos.input} placeholder={tr('Observaciones...', 'Notes...')}
                                    value={formPago.notas} onChange={e => setFormPago(v => ({ ...v, notas: e.target.value }))} />
                            </div>
                            {errorPago && (
                                <div className={estilos.errorMsg}>
                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                    {errorPago}
                                </div>
                            )}
                        </div>

                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnCancelar} onClick={() => setModalPago(null)}>{tr('Cancelar', 'Cancel')}</button>
                            <button className={estilos.btnConfirmar} onClick={handleRegistrarPago} disabled={guardando}>
                                {guardando
                                    ? <><div className={estilos.spinnerSm}></div>{tr('Guardando...', 'Saving...')}</>
                                    : <><ion-icon name="checkmark-circle-outline"></ion-icon>{tr('Confirmar Pago', 'Confirm Payment')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}