"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { buscarClientes, obtenerPlanesConOpciones, crearContratoFinanciamiento, obtenerDatosEmpresa, obtenerClientePorId } from './servidor'
import { useLanguage } from '../../i18n/LanguageProvider'
import estilos from './nuevo.module.css'

const ACTIVO_VACIO = { nombre: '', descripcion: '', serial: '', valor: '' }
const POR_PAGINA   = 8

function distribuirAdelantoPreview(numeroCuotas, cuotaMensual, adelanto) {
    const cuotas = []
    let restante = Math.max(0, parseFloat(adelanto || 0))
    let pagadas = 0

    for (let i = 1; i <= numeroCuotas; i++) {
        if (restante <= 0) {
            cuotas.push({ numero: i, estado: 'pendiente', pendiente: cuotaMensual })
            continue
        }
        if (restante >= cuotaMensual) {
            cuotas.push({ numero: i, estado: 'pagada', pendiente: 0 })
            pagadas++
            restante -= cuotaMensual
        } else {
            cuotas.push({ numero: i, estado: 'parcial', pendiente: cuotaMensual - restante, pagado: restante })
            restante = 0
        }
    }

    const parcial = cuotas.find(c => c.estado === 'parcial')
    const primeraPendiente = cuotas.find(c => c.estado === 'pendiente' || c.estado === 'parcial')
    return { cuotas, pagadas, parcial, primeraPendiente }
}

export default function NuevoContrato({ returnPath = '/admin/contratos', basePath = '/admin' }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { language } = useLanguage()
    const [tema, setTema]           = useState('light')
    const [paso, setPaso]           = useState(1)
    const [guardando, setGuardando] = useState(false)
    const [error, setError]         = useState('')

    const [clientes, setClientes]                       = useState([])
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
    const [busquedaCliente, setBusquedaCliente]         = useState('')
    const [buscandoCliente, setBuscandoCliente]         = useState(false)
    const [paginaCliente, setPaginaCliente]             = useState(1)
    const debounceRef = useRef(null)

    const [planes, setPlanes]                     = useState([])
    const [planSeleccionado, setPlanSeleccionado] = useState(null)
    const [opcionSeleccionada, setOpcionSeleccionada] = useState(null)
    const [mesesManual, setMesesManual]           = useState('')

    const [montoTotal, setMontoTotal]         = useState('')
    const [montoAdelantado, setMontoAdelantado] = useState('')
    const [fechaInicio, setFechaInicio]   = useState(new Date().toISOString().split('T')[0])
    const [notas, setNotas]               = useState('')

    const [tieneFiador, setTieneFiador] = useState(false)
    const [fiador, setFiador]           = useState({ nombre: '', cedula: '', telefono: '', email: '', direccion: '' })
    const [tieneActivos, setTieneActivos] = useState(false)
    const [activos, setActivos]           = useState([{ ...ACTIVO_VACIO }])
    const [empresa, setEmpresa]           = useState(null)

    const tr = (es, en) => language === 'en' ? en : es
    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'
    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const fn = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', fn)
        window.addEventListener('storage', fn)
        return () => { window.removeEventListener('temaChange', fn); window.removeEventListener('storage', fn) }
    }, [])

    useEffect(() => { cargarPlanes(); cargarEmpresa() }, [])
    useEffect(() => {
        const cid = searchParams?.get('clienteId')
        if (cid) {
            preseleccionarCliente(cid)
        } else {
            cargarClientes('')
        }
    }, [])

    const preseleccionarCliente = async (cid) => {
        const res = await obtenerClientePorId(cid)
        if (res.success && res.cliente) {
            setClienteSeleccionado(res.cliente)
            setPaso(2)
        }
        cargarClientes('')
    }

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargarPlanes = async () => {
        const r = await obtenerPlanesConOpciones()
        if (r.success) setPlanes(r.planes)
    }

    const cargarClientes = async (q) => {
        setBuscandoCliente(true)
        const r = await buscarClientes(q)
        setClientes(r.clientes || [])
        setPaginaCliente(1)
        setBuscandoCliente(false)
    }

    const handleBuscarCliente = (val) => {
        setBusquedaCliente(val)
        setClienteSeleccionado(null)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => cargarClientes(val), 300)
    }

    const seleccionarCliente = (c) => {
        setClienteSeleccionado(c)
        setBusquedaCliente('')
    }

    const cuotas = parseInt(mesesManual) || (opcionSeleccionada?.meses || 0)

    const totalPaginas   = Math.ceil(clientes.length / POR_PAGINA)
    const clientesPagina = clientes.slice((paginaCliente - 1) * POR_PAGINA, paginaCliente * POR_PAGINA)

    const mf             = parseFloat(montoTotal || 0)
    const tasa           = planSeleccionado ? parseFloat(planSeleccionado.tasa_interes || 0) : 0
    const totalPagar     = mf > 0 ? mf * (1 + tasa / 100) : 0
    const totalIntereses = totalPagar - mf
    const cuotaMonto     = cuotas > 0 ? totalPagar / cuotas : 0
    const adelantoNum    = parseFloat(montoAdelantado || 0)
    const saldoRestante  = totalPagar - adelantoNum
    const adelantoInfo   = adelantoNum > 0 && cuotas > 0
        ? distribuirAdelantoPreview(cuotas, cuotaMonto, adelantoNum)
        : null

    const fmtMoneda = (v) => new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 2 }).format(v || 0)

    function sumarPeriodos(fechaStr, cant, freq) {
        const d = new Date(fechaStr)
        if (freq === 'mensual')   d.setMonth(d.getMonth() + cant)
        if (freq === 'quincenal') d.setDate(d.getDate() + cant * 15)
        if (freq === 'semanal')   d.setDate(d.getDate() + cant * 7)
        return d.toISOString().split('T')[0]
    }

    const fechaFin = planSeleccionado && cuotas && fechaInicio
        ? sumarPeriodos(fechaInicio, cuotas, planSeleccionado.frecuencia) : '—'

    const freqLabel = planSeleccionado
        ? (planSeleccionado.frecuencia === 'semanal' ? 'semanas' : planSeleccionado.frecuencia === 'quincenal' ? 'quincenas' : 'meses')
        : 'cuotas'

    const puedeAvanzar = () => {
        if (paso === 1) return !!clienteSeleccionado
        if (paso === 2) return !!planSeleccionado
        if (paso === 3) {
            if (parseFloat(montoTotal) <= 0) return false
            if (mf <= 0) return false
            if (cuotas <= 0) return false
            if (adelantoNum > 0 && adelantoNum >= totalPagar) return false
            return true
        }
        if (paso === 4) {
            if (tieneFiador && !fiador.nombre.trim()) return false
            if (tieneActivos && activos.some(a => !a.nombre.trim())) return false
            return true
        }
        return true
    }

    const agregarActivo = () => setActivos(p => [...p, { ...ACTIVO_VACIO }])
    const quitarActivo  = (i) => setActivos(p => p.filter((_, idx) => idx !== i))
    const cambiarActivo = (i, campo, val) => setActivos(p => p.map((a, idx) => idx === i ? { ...a, [campo]: val } : a))

    const handleGuardar = async () => {
        setGuardando(true); setError('')
        try {
            const r = await crearContratoFinanciamiento({
                cliente_id:    clienteSeleccionado.id,
                plan_id:       planSeleccionado.id,
                opcion_id:     opcionSeleccionada?.id || null,
                meses_manual:  mesesManual ? parseInt(mesesManual) : null,
                monto_total:      parseFloat(montoTotal),
                monto_adelantado: parseFloat(montoAdelantado || 0),
                fecha_inicio:  fechaInicio,
                notas,
                fiador_nombre:    tieneFiador ? fiador.nombre    : null,
                fiador_cedula:    tieneFiador ? fiador.cedula    : null,
                fiador_telefono:  tieneFiador ? fiador.telefono  : null,
                fiador_email:     tieneFiador ? fiador.email     : null,
                fiador_direccion: tieneFiador ? fiador.direccion : null,
                activos: tieneActivos ? activos.filter(a => a.nombre.trim()) : []
            })
            if (r.success) router.push(`${basePath}/contratos/ver/${r.contrato_id}`)
            else setError(r.mensaje)
        } catch { setError(tr('Error inesperado. Intenta de nuevo.', 'Unexpected error. Try again.')) }
        finally { setGuardando(false) }
    }

    const PASOS = [tr('Cliente', 'Customer'), tr('Plan', 'Plan'), tr('Montos', 'Amounts'), tr('Extras', 'Extras'), tr('Resumen', 'Summary')]

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <Link href={returnPath} className={estilos.btnVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>{tr('Volver', 'Back')}</span>
                </Link>
                <div>
                    <h1 className={estilos.titulo}>{tr('Nuevo Préstamo', 'New Loan')}</h1>
                    <p className={estilos.subtitulo}>{tr('Completa los pasos para crear un préstamo de financiamiento', 'Complete the steps to create a financing loan')}</p>
                </div>
            </div>

            <div className={estilos.stepper}>
                {PASOS.map((nombre, i) => {
                    const num = i + 1
                    const activo     = paso === num
                    const completado = paso > num
                    return (
                        <div key={num} className={`${estilos.stepItem} ${activo ? estilos.stepActivo : ''} ${completado ? estilos.stepCompletado : ''}`}>
                            <div className={estilos.stepCirculo}>
                                {completado ? <ion-icon name="checkmark-outline"></ion-icon> : num}
                            </div>
                            <span className={estilos.stepLabel}>{nombre}</span>
                            {i < PASOS.length - 1 && <div className={`${estilos.stepLinea} ${completado ? estilos.stepLineaCompletada : ''}`}></div>}
                        </div>
                    )
                })}
            </div>

            <div className={estilos.card}>

                {paso === 1 && (
                    <div className={estilos.seccion}>
                        <h2 className={estilos.seccionTitulo}><ion-icon name="person-outline"></ion-icon> {tr('Seleccionar Cliente', 'Select Customer')}</h2>

                        {clienteSeleccionado && (
                            <div className={estilos.clienteSeleccionadoCard}>
                                <div className={estilos.clienteAvatarGrande}>{clienteSeleccionado.nombre.charAt(0)}</div>
                                <div className={estilos.clienteSeleccionadoInfo}>
                                    <h3>{clienteSeleccionado.nombre} {clienteSeleccionado.apellidos || ''}</h3>
                                    <div className={estilos.clienteDatos}>
                                        {clienteSeleccionado.numero_documento && <span><ion-icon name="card-outline"></ion-icon> {clienteSeleccionado.numero_documento}</span>}
                                        {clienteSeleccionado.telefono && <span><ion-icon name="call-outline"></ion-icon> {clienteSeleccionado.telefono}</span>}
                                        {clienteSeleccionado.email && <span><ion-icon name="mail-outline"></ion-icon> {clienteSeleccionado.email}</span>}
                                    </div>
                                </div>
                                <button className={estilos.btnCambiarCliente} onClick={() => setClienteSeleccionado(null)}>
                                    <ion-icon name="close-outline"></ion-icon>
                                </button>
                            </div>
                        )}

                        <div className={estilos.buscadorWrapper}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input type="text" placeholder={tr('Filtrar por nombre, cedula o telefono...', 'Filter by name, ID, or phone...')}
                                className={estilos.inputBuscador}
                                value={busquedaCliente}
                                onChange={e => handleBuscarCliente(e.target.value)}
                                autoFocus={!clienteSeleccionado} />
                            {buscandoCliente && <div className={estilos.spinnerSmall}></div>}
                            {busquedaCliente && !buscandoCliente && (
                                <button className={estilos.btnLimpiarBuscar} onClick={() => { setBusquedaCliente(''); cargarClientes('') }}>
                                    <ion-icon name="close-outline"></ion-icon>
                                </button>
                            )}
                        </div>

                        <div className={estilos.tablaWrapper}>
                            <table className={estilos.tablaClientes}>
                                <thead><tr>
                                    <th>{tr('Cliente', 'Customer')}</th><th>{tr('Documento', 'Document')}</th><th>{tr('Telefono', 'Phone')}</th><th>Email</th><th>{tr('Direccion', 'Address')}</th><th></th>
                                </tr></thead>
                                <tbody>
                                    {buscandoCliente ? (
                                        <tr><td colSpan="6" className={estilos.tdCentro}><div className={estilos.spinnerMedio}></div></td></tr>
                                    ) : clientesPagina.length === 0 ? (
                                        <tr><td colSpan="6" className={estilos.tdCentro}><ion-icon name="search-outline"></ion-icon><span>{tr('No se encontraron clientes', 'No customers found')}</span></td></tr>
                                    ) : clientesPagina.map(c => (
                                        <tr key={c.id}
                                            className={`${estilos.filaCliente} ${clienteSeleccionado?.id === c.id ? estilos.filaSeleccionada : ''}`}
                                            onClick={() => seleccionarCliente(c)}>
                                            <td>
                                                <div className={estilos.cellCliente}>
                                                    <div className={estilos.avatarMini}>{c.nombre.charAt(0)}</div>
                                                    <span className={estilos.nombreCliente}>{c.nombre} {c.apellidos || ''}</span>
                                                </div>
                                            </td>
                                            <td className={estilos.tdGris}>{c.numero_documento || '—'}</td>
                                            <td className={estilos.tdGris}>{c.telefono || '—'}</td>
                                            <td className={estilos.tdGris}>{c.email || '—'}</td>
                                            <td className={estilos.tdGris}>{c.direccion || '—'}</td>
                                            <td>
                                                {clienteSeleccionado?.id === c.id
                                                    ? <span className={estilos.badgeSeleccionado}><ion-icon name="checkmark-outline"></ion-icon> {tr('Seleccionado', 'Selected')}</span>
                                                    : <span className={estilos.badgeSeleccionar}>{tr('Seleccionar', 'Select')}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPaginas > 1 && (
                            <div className={estilos.paginacion}>
                                <button className={estilos.btnPag} onClick={() => setPaginaCliente(1)} disabled={paginaCliente === 1}><ion-icon name="play-back-outline"></ion-icon></button>
                                <button className={estilos.btnPag} onClick={() => setPaginaCliente(p => p - 1)} disabled={paginaCliente === 1}><ion-icon name="chevron-back-outline"></ion-icon></button>
                                <span className={estilos.paginacionInfo}>{tr('Pagina', 'Page')} {paginaCliente} {tr('de', 'of')} {totalPaginas} · {clientes.length} {tr('clientes', 'customers')}</span>
                                <button className={estilos.btnPag} onClick={() => setPaginaCliente(p => p + 1)} disabled={paginaCliente === totalPaginas}><ion-icon name="chevron-forward-outline"></ion-icon></button>
                                <button className={estilos.btnPag} onClick={() => setPaginaCliente(totalPaginas)} disabled={paginaCliente === totalPaginas}><ion-icon name="play-forward-outline"></ion-icon></button>
                            </div>
                        )}
                    </div>
                )}

                {paso === 2 && (
                    <div className={estilos.seccion}>
                        <h2 className={estilos.seccionTitulo}><ion-icon name="documents-outline"></ion-icon> {tr('Seleccionar Plan', 'Select Plan')}</h2>

                        {planes.length === 0
                            ? <div className={estilos.vacio}><ion-icon name="alert-circle-outline"></ion-icon><span>{tr('No hay planes activos.', 'There are no active plans.')} <Link href="/admin/planes/nuevo">{tr('Crear plan', 'Create plan')}</Link></span></div>
                            : (
                                <div className={estilos.planesGrid}>
                                    {planes.map(plan => (
                                        <button key={plan.id}
                                            className={`${estilos.planCard} ${planSeleccionado?.id === plan.id ? estilos.planSeleccionado : ''}`}
                                            onClick={() => { setPlanSeleccionado(plan); setOpcionSeleccionada(null); setMesesManual('') }}>
                                            <div className={estilos.planIcono}><ion-icon name="card-outline"></ion-icon></div>
                                            <div className={estilos.planInfo}>
                                                <span className={estilos.planNombre}>{plan.nombre}</span>
                                                {plan.codigo && <span className={estilos.planCodigo}>{plan.codigo}</span>}
                                                <div className={estilos.planMeta}>
                                                    <span><ion-icon name="trending-up-outline"></ion-icon> {plan.tasa_interes}% {tr('interes', 'interest')}</span>
                                                    <span><ion-icon name="time-outline"></ion-icon> {plan.frecuencia}</span>
                                                    {plan.mora_pct > 0 && <span><ion-icon name="warning-outline"></ion-icon> {plan.mora_pct}% {tr('mora', 'late fee')}</span>}
                                                </div>
                                                {plan.descripcion && <p className={estilos.planDesc}>{plan.descripcion}</p>}
                                            </div>
                                            {planSeleccionado?.id === plan.id && <ion-icon name="checkmark-circle" className={estilos.planCheck}></ion-icon>}
                                        </button>
                                    ))}
                                </div>
                            )
                        }

                        {planSeleccionado?.opciones?.length > 0 && (
                            <div className={estilos.opcionesWrapper}>
                                <h3 className={estilos.opcionesTitulo}>{tr('Plazo sugerido por el plan', 'Plan suggested term')} <span className={estilos.opcionesOpcional}>{tr('(opcional)', '(optional)')}</span></h3>
                                <div className={estilos.opcionesGrid}>
                                    {planSeleccionado.opciones.map(op => (
                                        <button key={op.id}
                                            className={`${estilos.opcionCard} ${opcionSeleccionada?.id === op.id ? estilos.opcionSeleccionada : ''}`}
                                            onClick={() => {
                                                if (opcionSeleccionada?.id === op.id) {
                                                    setOpcionSeleccionada(null)
                                                    setMesesManual('')
                                                } else {
                                                    setOpcionSeleccionada(op)
                                                    setMesesManual(String(op.meses))
                                                }
                                            }}>
                                            <span className={estilos.opcionMeses}>{op.meses}</span>
                                            <span className={estilos.opcionLabel}>{freqLabel}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className={estilos.opcionesHint}>{tr('Selecciona el plazo del plan. Se cargara automaticamente en el siguiente paso.', 'Select the plan term. It will load automatically in the next step.')}</p>
                            </div>
                        )}
                    </div>
                )}

                {paso === 3 && (
                    <div className={estilos.seccion}>
                        <h2 className={estilos.seccionTitulo}><ion-icon name="cash-outline"></ion-icon> {tr('Montos y Fecha', 'Amounts and Date')}</h2>

                        {planSeleccionado && (
                            <div className={estilos.planInfoBanner}>
                                <ion-icon name="information-circle-outline"></ion-icon>
                                <span>
                                    <strong>{planSeleccionado.nombre}</strong>
                                    {' · '}{planSeleccionado.tasa_interes}% {tr('interes', 'interest')}
                                    {' · '}{tr('Frecuencia', 'Frequency')}: {planSeleccionado.frecuencia}
                                    {opcionSeleccionada && <> {' · '}<strong>{opcionSeleccionada.meses} {freqLabel}</strong> {tr('del plan', 'from plan')}</>}
                                </span>
                            </div>
                        )}

                        <div className={estilos.gridDos}>

                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Monto Total *', 'Total Amount *')}</label>
                                <div className={estilos.inputMoneda}>
                                    <span>{simboloMoneda}</span>
                                    <input type="number" min="0" step="0.01" className={estilos.input}
                                        value={montoTotal} onChange={e => setMontoTotal(e.target.value)} placeholder="0.00" autoFocus />
                                </div>
                            </div>

                            <div className={estilos.campo}>
                                <label className={estilos.label}>
                                    {tr('Pago por adelantado', 'Advance payment')}
                                    <span className={estilos.opcional}>{tr('(opcional)', '(optional)')}</span>
                                </label>
                                <div className={estilos.inputMoneda}>
                                    <span>{simboloMoneda}</span>
                                    <input type="number" min="0" step="0.01" className={estilos.input}
                                        value={montoAdelantado}
                                        onChange={e => setMontoAdelantado(e.target.value)}
                                        placeholder="0.00" />
                                </div>
                                <span className={estilos.hint}>
                                    {tr('Lo que el cliente paga hoy. Se descuenta de las cuotas desde la #1 y aparece en Pagos.', 'What the customer pays today. Deducted from installments starting at #1 and shown in Payments.')}
                                </span>
                                {totalPagar > 0 && adelantoNum >= totalPagar && (
                                    <span className={estilos.hintError}>
                                        {tr('Debe ser menor al total a pagar', 'Must be less than total to pay')} ({fmtMoneda(totalPagar)})
                                    </span>
                                )}
                            </div>

                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Numero de', 'Number of')} {freqLabel} *</label>
                                <input type="number" min="1" step="1" className={estilos.input}
                                    value={mesesManual}
                                    onChange={e => setMesesManual(e.target.value)}
                                    placeholder={opcionSeleccionada?.meses ? String(opcionSeleccionada.meses) : 'Ej: 12'} />
                                {opcionSeleccionada?.meses && mesesManual === String(opcionSeleccionada.meses) && (
                                    <span className={estilos.hint}>{tr('Plazo del plan seleccionado', 'Selected plan term')}: {opcionSeleccionada.meses} {freqLabel}</span>
                                )}
                            </div>

                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Fecha de Inicio *', 'Start Date *')}</label>
                                <input type="date" className={estilos.input} value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                            </div>

                            {adelantoInfo?.primeraPendiente && adelantoNum > 0 && (
                                <div className={`${estilos.campo} ${estilos.colSpan2}`}>
                                    <label className={estilos.label}>{tr('Proxima cuota a cobrar', 'Next installment to collect')}</label>
                                    <div className={estilos.adelantoProxima}>
                                        <span>{tr('Cuota', 'Installment')} #{adelantoInfo.primeraPendiente.numero}</span>
                                        <strong>{fmtMoneda(adelantoInfo.primeraPendiente.pendiente)}</strong>
                                    </div>
                                    {adelantoInfo.pagadas > 0 && (
                                        <span className={estilos.hint}>
                                            {adelantoInfo.pagadas} {tr('cuota(s) ya cubierta(s) por el adelanto', 'installment(s) already covered by advance')}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className={`${estilos.campo} ${estilos.colSpan2}`}>
                                <label className={estilos.label}>{tr('Notas', 'Notes')}</label>
                                <textarea className={`${estilos.input} ${estilos.textarea}`}
                                    value={notas} onChange={e => setNotas(e.target.value)}
                                    placeholder={tr('Observaciones...', 'Notes...')} rows={3} />
                            </div>
                        </div>

                        {mf > 0 && cuotas > 0 && (
                            <div className={estilos.previewCalculo}>
                                <h3 className={estilos.previewTitulo}><ion-icon name="calculator-outline"></ion-icon> {tr('Resumen del prestamo', 'Loan summary')}</h3>
                                <div className={estilos.previewGrid}>
                                    {[
                                        { label: tr('Monto a financiar', 'Amount to finance'),               valor: fmtMoneda(mf) },
                                        { label: `${tr('Interes', 'Interest')} (${tasa}%)`,              valor: fmtMoneda(totalIntereses), cls: estilos.interest },
                                        { label: tr('Total a pagar', 'Total to pay'),                   valor: fmtMoneda(totalPagar),     cls: estilos.total },
                                        ...(adelantoNum > 0 ? [
                                            { label: tr('Adelanto', 'Advance'),                      valor: `- ${fmtMoneda(adelantoNum)}`, cls: estilos.adelanto },
                                            { label: tr('Saldo restante', 'Remaining balance'),       valor: fmtMoneda(saldoRestante),    cls: estilos.total },
                                        ] : []),
                                        { label: `${tr('Cuota', 'Installment')} (${planSeleccionado?.frecuencia})`, valor: fmtMoneda(cuotaMonto), cls: estilos.cuota },
                                        { label: tr('Numero de cuotas', 'Number of installments'),                valor: cuotas },
                                        { label: tr('Fecha fin', 'End date'),                       valor: fechaFin },
                                    ].map((p, i) => (
                                        <div key={i} className={estilos.previewItem}>
                                            <span className={estilos.previewLabel}>{p.label}</span>
                                            <span className={`${estilos.previewValor} ${p.cls || ''}`}>{p.valor}</span>
                                        </div>
                                    ))}
                                </div>

                                {adelantoInfo && adelantoNum > 0 && (
                                    <div className={estilos.adelantoCuotas}>
                                        <h4>{tr('Distribucion del adelanto', 'Advance distribution')}</h4>
                                        <div className={estilos.adelantoCuotasLista}>
                                            {adelantoInfo.cuotas.filter(c => c.estado !== 'pendiente' || c.numero <= (adelantoInfo.primeraPendiente?.numero || 0) + 2).slice(0, 6).map(c => (
                                                <div key={c.numero} className={`${estilos.adelantoCuotaItem} ${estilos[`cuota${c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}`] || ''}`}>
                                                    <span>#{c.numero}</span>
                                                    {c.estado === 'pagada' && <span>{tr('Pagada', 'Paid')}</span>}
                                                    {c.estado === 'parcial' && <span>{fmtMoneda(c.pendiente)} {tr('pendiente', 'remaining')}</span>}
                                                    {c.estado === 'pendiente' && c.numero === adelantoInfo.primeraPendiente?.numero && <span>{fmtMoneda(c.pendiente)}</span>}
                                                    {c.estado === 'pendiente' && c.numero !== adelantoInfo.primeraPendiente?.numero && <span>{fmtMoneda(cuotaMonto)}</span>}
                                                </div>
                                            ))}
                                            {adelantoInfo.cuotas.filter(c => c.estado === 'pendiente').length > 3 && (
                                                <div className={estilos.adelantoCuotaItem}>
                                                    <span>…</span>
                                                    <span>{adelantoInfo.cuotas.filter(c => c.estado === 'pendiente').length} {tr('cuotas normales', 'regular installments')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {paso === 4 && (
                    <div className={estilos.seccion}>
                        <h2 className={estilos.seccionTitulo}><ion-icon name="shield-checkmark-outline"></ion-icon> {tr('Fiador y Activos', 'Guarantor and Assets')}</h2>

                        <div className={estilos.toggleCard}>
                            <div>
                                <strong>{tr('Tiene fiador?', 'Has guarantor?')}</strong>
                                {planSeleccionado?.requiere_fiador
                                    ? <span className={estilos.badgeRequerido}>{tr('Requerido', 'Required')}</span>
                                    : <span className={estilos.badgeOpcional}>{tr('Opcional', 'Optional')}</span>}
                            </div>
                            <button className={`${estilos.toggle} ${tieneFiador ? estilos.toggleOn : ''}`} onClick={() => setTieneFiador(v => !v)}>
                                <span className={estilos.toggleCirculo}></span>
                            </button>
                        </div>

                        {tieneFiador && (
                            <div className={estilos.gridDos}>
                                {[
                                    { campo: 'nombre',   label: 'Nombre completo *', tipo: 'text',  placeholder: 'Nombre del fiador' },
                                    { campo: 'cedula',   label: tr('Cedula', 'ID'),            tipo: 'text',  placeholder: '000-0000000-0' },
                                    { campo: 'telefono', label: tr('Telefono', 'Phone'),          tipo: 'tel',   placeholder: '809-000-0000' },
                                    { campo: 'email',    label: 'Email',             tipo: 'email', placeholder: 'correo@ejemplo.com' },
                                ].map(f => (
                                    <div key={f.campo} className={estilos.campo}>
                                        <label className={estilos.label}>{f.label}</label>
                                        <input type={f.tipo} className={estilos.input}
                                            value={fiador[f.campo]}
                                            onChange={e => setFiador(v => ({ ...v, [f.campo]: e.target.value }))}
                                            placeholder={f.placeholder} />
                                    </div>
                                ))}
                                <div className={`${estilos.campo} ${estilos.colSpan2}`}>
                                    <label className={estilos.label}>{tr('Direccion', 'Address')}</label>
                                    <input type="text" className={estilos.input} value={fiador.direccion}
                                        onChange={e => setFiador(v => ({ ...v, direccion: e.target.value }))}
                                        placeholder={tr('Direccion del fiador', 'Guarantor address')} />
                                </div>
                            </div>
                        )}

                        <div className={estilos.toggleCard} style={{ marginTop: 24 }}>
                            <div><strong>{tr('Tiene activos/garantias?', 'Has assets/collateral?')}</strong><span className={estilos.badgeOpcional}>{tr('Opcional', 'Optional')}</span></div>
                            <button className={`${estilos.toggle} ${tieneActivos ? estilos.toggleOn : ''}`} onClick={() => setTieneActivos(v => !v)}>
                                <span className={estilos.toggleCirculo}></span>
                            </button>
                        </div>

                        {tieneActivos && (
                            <div className={estilos.activosWrapper}>
                                {activos.map((a, i) => (
                                    <div key={i} className={estilos.activoCard}>
                                        <div className={estilos.activoHeader}>
                                            <span className={estilos.activoNum}>{tr('Activo', 'Asset')} #{i + 1}</span>
                                            {activos.length > 1 && (
                                                <button className={estilos.btnQuitarActivo} onClick={() => quitarActivo(i)}>
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                </button>
                                            )}
                                        </div>
                                        <div className={estilos.gridDos}>
                                            {[
                                                { campo: 'nombre',      label: 'Nombre *',    placeholder: 'Ej: TV 55 pulgadas' },
                                                { campo: 'serial',      label: 'Serial',      placeholder: tr('Numero de serie', 'Serial number') },
                                                { campo: 'valor',       label: tr(`Valor (${simboloMoneda})`, `Value (${simboloMoneda})`), placeholder: '0.00', tipo: 'number' },
                                                { campo: 'descripcion', label: tr('Descripcion', 'Description'), placeholder: tr('Descripcion del bien', 'Asset description') },
                                            ].map(f => (
                                                <div key={f.campo} className={estilos.campo}>
                                                    <label className={estilos.label}>{f.label}</label>
                                                    <input type={f.tipo || 'text'} className={estilos.input}
                                                        value={a[f.campo]}
                                                        onChange={e => cambiarActivo(i, f.campo, e.target.value)}
                                                        placeholder={f.placeholder} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button className={estilos.btnAgregarActivo} onClick={agregarActivo}>
                                    <ion-icon name="add-circle-outline"></ion-icon> {tr('Agregar otro activo', 'Add another asset')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {paso === 5 && (
                    <div className={estilos.seccion}>
                        <h2 className={estilos.seccionTitulo}><ion-icon name="checkmark-done-outline"></ion-icon> {tr('Resumen Final', 'Final Summary')}</h2>
                        <div className={estilos.resumenGrid}>
                            <div className={estilos.resumenBloque}>
                                <h4><ion-icon name="person-outline"></ion-icon> {tr('Cliente', 'Customer')}</h4>
                                <p><strong>{clienteSeleccionado?.nombre} {clienteSeleccionado?.apellidos || ''}</strong></p>
                                <p>{clienteSeleccionado?.numero_documento}</p>
                                <p>{clienteSeleccionado?.telefono}</p>
                            </div>
                            <div className={estilos.resumenBloque}>
                                <h4><ion-icon name="documents-outline"></ion-icon> {tr('Plan', 'Plan')}</h4>
                                <p><strong>{planSeleccionado?.nombre}</strong></p>
                                <p>{cuotas} {freqLabel}</p>
                                <p>{tr('Frecuencia:', 'Frequency:')} {planSeleccionado?.frecuencia}</p>
                            </div>
                            <div className={estilos.resumenBloque}>
                                <h4><ion-icon name="cash-outline"></ion-icon> {tr('Montos', 'Amounts')}</h4>
                                <p>{tr('Total:', 'Total:')} <strong>{fmtMoneda(parseFloat(montoTotal || 0))}</strong></p>
                                <p>{tr('Interes', 'Interest')} ({tasa}%): <strong>{fmtMoneda(totalIntereses)}</strong></p>
                                <p>{tr('Total a pagar:', 'Total to pay:')} <strong>{fmtMoneda(totalPagar)}</strong></p>
                                {adelantoNum > 0 && (
                                    <>
                                        <p>{tr('Pago adelantado:', 'Advance payment:')} <strong>{fmtMoneda(adelantoNum)}</strong></p>
                                        <p>{tr('Saldo restante:', 'Remaining balance:')} <strong>{fmtMoneda(saldoRestante)}</strong></p>
                                    </>
                                )}
                            </div>
                            <div className={estilos.resumenBloque}>
                                <h4><ion-icon name="calendar-outline"></ion-icon> {tr('Cuotas', 'Installments')}</h4>
                                <p>{tr('Total a pagar:', 'Total to pay:')} <strong>{fmtMoneda(totalPagar)}</strong></p>
                                <p>{tr('Cuota base:', 'Base installment:')} <strong>{fmtMoneda(cuotaMonto)}</strong></p>
                                {adelantoInfo?.primeraPendiente && (
                                    <p>{tr('Proxima cuota:', 'Next installment:')} <strong>{fmtMoneda(adelantoInfo.primeraPendiente.pendiente)}</strong> (#{adelantoInfo.primeraPendiente.numero})</p>
                                )}
                                {adelantoInfo?.pagadas > 0 && (
                                    <p>{adelantoInfo.pagadas} {tr('cuota(s) cubierta(s) por adelanto', 'installment(s) covered by advance')}</p>
                                )}
                                <p>{cuotas} {tr('cuotas', 'installments')} · {tr('Desde', 'From')} {fechaInicio}</p>
                                <p>{tr('Hasta', 'To')} {fechaFin}</p>
                            </div>
                            {tieneFiador && (
                                <div className={estilos.resumenBloque}>
                                    <h4><ion-icon name="shield-checkmark-outline"></ion-icon> {tr('Fiador', 'Guarantor')}</h4>
                                    <p><strong>{fiador.nombre}</strong></p>
                                    <p>{fiador.cedula}</p>
                                    <p>{fiador.telefono}</p>
                                </div>
                            )}
                            {tieneActivos && activos.filter(a => a.nombre).length > 0 && (
                                <div className={estilos.resumenBloque}>
                                    <h4><ion-icon name="cube-outline"></ion-icon> {tr('Activos', 'Assets')} ({activos.filter(a => a.nombre).length})</h4>
                                    {activos.filter(a => a.nombre).map((a, i) => (
                                        <p key={i}>{a.nombre}{a.serial ? ` · ${a.serial}` : ''}</p>
                                    ))}
                                </div>
                            )}
                            {notas && (
                                <div className={`${estilos.resumenBloque} ${estilos.colSpan2}`}>
                                    <h4><ion-icon name="document-text-outline"></ion-icon> {tr('Notas', 'Notes')}</h4>
                                    <p>{notas}</p>
                                </div>
                            )}
                        </div>
                        {error && <div className={estilos.errorMsg}><ion-icon name="alert-circle-outline"></ion-icon> {error}</div>}
                    </div>
                )}
            </div>

            <div className={estilos.navegacion}>
                {paso > 1 && (
                    <button className={estilos.btnAnterior} onClick={() => setPaso(p => p - 1)} disabled={guardando}>
                        <ion-icon name="arrow-back-outline"></ion-icon> {tr('Anterior', 'Previous')}
                    </button>
                )}
                <div className={estilos.navSpacer}></div>
                {paso < 5 && (
                    <button className={estilos.btnSiguiente} onClick={() => setPaso(p => p + 1)} disabled={!puedeAvanzar()}>
                        {tr('Siguiente', 'Next')} <ion-icon name="arrow-forward-outline"></ion-icon>
                    </button>
                )}
                {paso === 5 && (
                    <button className={estilos.btnGuardar} onClick={handleGuardar} disabled={guardando}>
                        {guardando
                            ? <><div className={estilos.spinnerSmall}></div> {tr('Guardando...', 'Saving...')}</>
                            : <><ion-icon name="checkmark-circle-outline"></ion-icon> {tr('Crear Préstamo', 'Create Loan')}</>}
                    </button>
                )}
            </div>
        </div>
    )
}