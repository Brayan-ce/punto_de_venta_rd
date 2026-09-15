"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerCajaActivaParaGastos, obtenerGastos, obtenerGasto, crearGasto, actualizarGasto, eliminarGasto, obtenerDatosEmpresa } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './gastos.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const CATEGORIAS = ['Servicios Publicos','Alquiler','Nomina','Mantenimiento','Publicidad','Transporte','Suministros','Impuestos','Operativa','Otros']

const FORM_VACIO = { concepto: '', monto: '', categoria: '', comprobante_numero: '', notas: '' }

export default function GastosAdmin() {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
        const { language } = useLanguage()
        const tr = (es, en) => (language === 'en' ? en : es)
    const [gastos, setGastos] = useState([])
    const [cajaActiva, setCajaActiva] = useState(null)
    const [busqueda, setBusqueda] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('todos')
    const [filtroFecha, setFiltroFecha] = useState('todos')
    const [vista, setVista] = useState('listado')
    const [gastoSel, setGastoSel] = useState(null)
    const [modoEdicion, setModoEdicion] = useState(false)
    const [form, setForm] = useState(FORM_VACIO)
    const [error, setError] = useState('')
    const [empresa, setEmpresa] = useState(null)

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const onChange = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', onChange)
        window.addEventListener('storage', onChange)
        cargarEmpresa()
        return () => { window.removeEventListener('temaChange', onChange); window.removeEventListener('storage', onChange) }
    }, [])

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        setCargando(true)
        const [resCaja, resGastos] = await Promise.all([obtenerCajaActivaParaGastos(), obtenerGastos()])
        if (resCaja.success) setCajaActiva(resCaja.caja)
        if (resGastos.success) setGastos(resGastos.gastos)
        setCargando(false)
    }

    const limpiar = () => { setForm(FORM_VACIO); setModoEdicion(false); setGastoSel(null); setError('') }

    const abrirNuevo = () => {
        if (!cajaActiva) return
        limpiar()
        setVista('formulario')
    }

    const abrirEditar = (g) => {
        setForm({ concepto: g.concepto, monto: String(g.monto), categoria: g.categoria || '', comprobante_numero: g.comprobante_numero || '', notas: g.notas || '' })
        setGastoSel(g)
        setModoEdicion(true)
        setError('')
        setVista('formulario')
    }

    const abrirDetalles = async (id) => {
        setProcesando(true)
        const r = await obtenerGasto(id)
        if (r.success) { setGastoSel(r.gasto); setVista('detalles') }
        setProcesando(false)
    }

    const volver = () => { setVista('listado'); limpiar() }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
    if (!form.concepto.trim()) { setError(tr('El concepto es obligatorio', 'Concept is required')); return }
    if (!form.monto || parseFloat(form.monto) <= 0) { setError(tr('El monto debe ser mayor a 0', 'Amount must be greater than 0')); return }

        setProcesando(true)
        const r = modoEdicion ? await actualizarGasto(gastoSel.id, form) : await crearGasto(form)
        if (r.success) { await cargar(); volver() }
        else setError(r.mensaje)
        setProcesando(false)
    }

    const handleEliminar = async (id, concepto) => {
        const msg = language === 'en' ? `Delete expense "${concepto}"?` : `¿Eliminar el gasto "${concepto}"?`
        if (!confirm(msg)) return
        setProcesando(true)
        const r = await eliminarGasto(id)
        if (r.success) { await cargar(); if (vista !== 'listado') volver() }
        else alert(r.mensaje || tr('Error al eliminar', 'Error deleting'))
        setProcesando(false)
    }

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const localeEmpresa = empresa?.locale || 'es-DO'
    const monedaEmpresa = empresa?.moneda || 'DOP'

    const fmtMoneda = (v) => new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa }).format(v || 0)
    const fmtFecha = (f) => new Date(f).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const fmtFechaCorta = (f) => new Date(f).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { month: 'short', day: 'numeric' })

    const gastosFiltrados = gastos.filter(g => {
        const ok1 = !busqueda || g.concepto.toLowerCase().includes(busqueda.toLowerCase()) || (g.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
        const ok2 = filtroCategoria === 'todos' || (filtroCategoria === 'sin_categoria' && !g.categoria) || g.categoria === filtroCategoria
        let ok3 = true
        if (filtroFecha !== 'todos') {
            const fecha = new Date(g.fecha_gasto), hoy = new Date()
            if (filtroFecha === 'hoy') ok3 = fecha.toDateString() === hoy.toDateString()
            else if (filtroFecha === 'semana') { const d = new Date(hoy); d.setDate(hoy.getDate()-7); ok3 = fecha >= d }
            else if (filtroFecha === 'mes') ok3 = fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
        }
        return ok1 && ok2 && ok3
    })

    const stats = {
        total: gastos.length,
        totalMonto: gastos.reduce((s, g) => s + parseFloat(g.monto || 0), 0),
        montoMes: gastos.filter(g => { const f = new Date(g.fecha_gasto), h = new Date(); return f.getMonth() === h.getMonth() && f.getFullYear() === h.getFullYear() }).reduce((s, g) => s + parseFloat(g.monto || 0), 0),
        categoriaPrincipal: (() => { const m = {}; gastos.forEach(g => { const c = g.categoria || 'Sin Categoría'; m[c] = (m[c]||0)+1 }); return Object.keys(m).length ? Object.keys(m).reduce((a,b) => m[a]>m[b]?a:b) : 'N/A' })()
    }

    // ── FORMULARIO ──
    if (vista === 'formulario') {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>{modoEdicion ? tr('Editar Gasto', 'Edit Expense') : tr('Nuevo Gasto', 'New Expense')}</h1>
                        <p className={estilos.subtitulo}>
                            {cajaActiva && !modoEdicion
                                ? <span className={estilos.cajaBadge}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                                    Caja {cajaActiva.numero_caja} activa
                                  </span>
                                : modoEdicion ? 'Modifica los datos' : ''
                            }
                        </p>
                    </div>
                    <button onClick={volver} className={estilos.btnVolver} disabled={procesando}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        {tr('Volver', 'Back')}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={estilos.formulario}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>{tr('Información del Gasto', 'Expense Information')}</h2>

                        <div className={estilos.grupoInput}>
                            <label>{tr('Concepto *', 'Concept *')}</label>
                            <input type="text" className={estilos.input} value={form.concepto}
                                onChange={e => setForm(p => ({...p, concepto: e.target.value}))}
                                placeholder={tr('Ej: Pago de luz, compra de papelería...', 'Ex: Electric bill, office supplies...')} required disabled={procesando} autoFocus />
                        </div>

                        <div className={estilos.grupoDoble}>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Monto *', 'Amount *')}</label>
                                <div className={estilos.inputMoneda}>
                                    <span>{simboloMoneda}</span>
                                    <input type="number" className={estilos.input} value={form.monto}
                                        onChange={e => setForm(p => ({...p, monto: e.target.value}))}
                                        placeholder="0.00" step="0.01" min="0.01" required disabled={procesando} />
                                </div>
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Categoría', 'Category')}</label>
                                <select className={estilos.input} value={form.categoria}
                                    onChange={e => setForm(p => ({...p, categoria: e.target.value}))} disabled={procesando}>
                                    <option value="">{tr('Sin categoría', 'No category')}</option>
                                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>{tr('Número de Comprobante', 'Receipt Number')}</label>
                            <input type="text" className={estilos.input} value={form.comprobante_numero}
                                onChange={e => setForm(p => ({...p, comprobante_numero: e.target.value}))}
                                placeholder={tr('Ej: FAC-001', 'Ex: INV-001')} disabled={procesando} />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>{tr('Notas', 'Notes')}</label>
                            <textarea className={estilos.textarea} value={form.notas}
                                onChange={e => setForm(p => ({...p, notas: e.target.value}))}
                                placeholder={tr('Detalles adicionales...', 'Additional details...')} rows={3} disabled={procesando} />
                        </div>

                        {error && <div className={estilos.errorMsg}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {error}</div>}
                    </div>

                    <div className={estilos.botonesFormulario}>
                        <button type="button" onClick={volver} className={estilos.btnCancelar} disabled={procesando}>{tr('Cancelar', 'Cancel')}</button>
                        <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                            {procesando ? tr('Guardando...', 'Saving...') : modoEdicion ? tr('Actualizar Gasto', 'Update Expense') : tr('Registrar Gasto', 'Register Expense')}
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    // ── DETALLES ──
    if (vista === 'detalles' && gastoSel) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Detalle del Gasto', 'Expense Detail')}</h1>
                        <p className={estilos.subtitulo}>{fmtFecha(gastoSel.fecha_gasto)}</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button onClick={() => abrirEditar(gastoSel)} className={estilos.btnEditar} disabled={procesando}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            {tr('Editar', 'Edit')}
                        </button>
                        <button onClick={() => handleEliminar(gastoSel.id, gastoSel.concepto)} className={estilos.btnEliminar} disabled={procesando}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                        <button onClick={volver} className={estilos.btnVolver} disabled={procesando}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                            {tr('Volver', 'Back')}
                        </button>
                    </div>
                </div>

                <div className={`${estilos.panel} ${estilos[tema]}`} style={{maxWidth: 700}}>
                    <div className={estilos.detalleMontoHero}>
                        <span className={estilos.detalleMontoLabel}>{tr('Monto del gasto', 'Expense amount')}</span>
                        <span className={estilos.detalleMonto}>{fmtMoneda(gastoSel.monto)}</span>
                    </div>
                    <div className={estilos.infoGrid}>
                        <div className={estilos.infoItem}><span className={estilos.infoLabel}>{tr('Concepto', 'Concept')}</span><span className={estilos.infoValor}>{gastoSel.concepto}</span></div>
                        <div className={estilos.infoItem}><span className={estilos.infoLabel}>{tr('Categoría', 'Category')}</span><span className={estilos.infoValor}>{gastoSel.categoria || '—'}</span></div>
                        <div className={estilos.infoItem}><span className={estilos.infoLabel}>{tr('Fecha', 'Date')}</span><span className={estilos.infoValor}>{fmtFecha(gastoSel.fecha_gasto)}</span></div>
                        <div className={estilos.infoItem}><span className={estilos.infoLabel}>{tr('Registrado por', 'Registered by')}</span><span className={estilos.infoValor}>{gastoSel.usuario_nombre}</span></div>
                        {gastoSel.caja_numero && <div className={estilos.infoItem}><span className={estilos.infoLabel}>{tr('Caja', 'Register')}</span><span className={estilos.infoValor}>{tr('Caja', 'Register')} #{gastoSel.caja_numero}</span></div>}
                        {gastoSel.comprobante_numero && <div className={estilos.infoItem}><span className={estilos.infoLabel}>{tr('Comprobante', 'Receipt')}</span><span className={estilos.infoValor}>{gastoSel.comprobante_numero}</span></div>}
                        {gastoSel.notas && <div className={`${estilos.infoItem} ${estilos.full}`}><span className={estilos.infoLabel}>{tr('Notas', 'Notes')}</span><span className={estilos.infoValor}>{gastoSel.notas}</span></div>}
                    </div>
                </div>
            </div>
        )
    }

    // ── LISTADO ──
    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            {/* Alerta sin caja */}
            {!cajaActiva && !cargando && (
                <div className={estilos.alertaSinCaja}>
                    <div className={estilos.alertaSinCajaIcono}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="12" y1="10" x2="12.01" y2="10"/></svg>
                    </div>
                    <div>
                        <p className={estilos.alertaSinCajaTitulo}>{tr('No hay caja abierta', 'No register open')}</p>
                        <p className={estilos.alertaSinCajaTexto}>{tr('Debes tener una caja activa para registrar gastos.', 'You need an active register to record expenses.')}</p>
                    </div>
                    <Link href="/admin/cajas" className={estilos.alertaSinCajaBtn}>{tr('Ir a Cajas', 'Go to Registers')}</Link>
                </div>
            )}

            {/* Header */}
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Gastos', 'Expenses')}</h1>
                    <p className={estilos.subtitulo}>
                        {cajaActiva
                            ? <span className={estilos.cajaBadge}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                                {tr('Caja', 'Register')} {cajaActiva.numero_caja} {tr('abierta', 'open')}
                              </span>
                            : tr('Sin caja activa', 'No active register')
                        }
                    </p>
                </div>
                <button onClick={abrirNuevo} className={estilos.btnNuevo} disabled={!cajaActiva || procesando} title={!cajaActiva ? tr('Abre una caja primero', 'Open a register first') : ''}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    {tr('Nuevo Gasto', 'New Expense')}
                </button>
            </div>

            {/* Stats */}
            <div className={estilos.estadisticas}>
                {[
                    { label: tr('Total Gastos', 'Total Expenses'), valor: stats.total, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, cls: '' },
                    { label: tr('Monto Total', 'Total Amount'), valor: fmtMoneda(stats.totalMonto), icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, cls: 'danger' },
                    { label: tr('Gastos del Mes', 'Monthly Expenses'), valor: fmtMoneda(stats.montoMes), icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, cls: 'warning' },
                    { label: tr('Categoría Top', 'Top Category'), valor: stats.categoriaPrincipal, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>, cls: 'primary' },
                ].map((s, i) => (
                    <div key={i} className={`${estilos.estadCard} ${estilos[tema]}`}>
                        <div className={`${estilos.estadIcono} ${estilos[s.cls]}`}>{s.icon}</div>
                        <div className={estilos.estadInfo}>
                            <span className={estilos.estadLabel}>{s.label}</span>
                            <span className={estilos.estadValor}>{s.valor}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder={tr('Buscar gasto...', 'Search expense...')} value={busqueda}
                        onChange={e => setBusqueda(e.target.value)} className={estilos.inputBusqueda} />
                    {busqueda && <button className={estilos.limpiarBusqueda} onClick={() => setBusqueda('')}>✕</button>}
                </div>
                <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className={estilos.selectFiltro}>
                    <option value="todos">{tr('Todas las categorías', 'All categories')}</option>
                    <option value="sin_categoria">{tr('Sin categoría', 'No category')}</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className={estilos.selectFiltro}>
                    <option value="todos">{tr('Todas las fechas', 'All dates')}</option>
                    <option value="hoy">{tr('Hoy', 'Today')}</option>
                    <option value="semana">{tr('Últimos 7 días', 'Last 7 days')}</option>
                    <option value="mes">{tr('Este mes', 'This month')}</option>
                </select>
            </div>

            {cargando ? <LoadingScreen /> : gastosFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <span>{tr('No hay gastos que mostrar', 'No expenses to show')}</span>
                    {cajaActiva && <button onClick={abrirNuevo} className={estilos.btnNuevo}>{tr('Registrar primer gasto', 'Record first expense')}</button>}
                </div>
            ) : (
                <div className={estilos.tabla}>
                    <div className={estilos.tablaHeader}>
                        <span>{tr('Concepto', 'Concept')}</span>
                        <span>{tr('Categoría', 'Category')}</span>
                        <span>{tr('Caja', 'Register')}</span>
                        <span>{tr('Fecha', 'Date')}</span>
                        <span>{tr('Monto', 'Amount')}</span>
                        <span></span>
                    </div>
                    {gastosFiltrados.map(g => (
                        <div key={g.id} className={`${estilos.tablaFila} ${estilos[tema]}`}>
                            <div className={estilos.filaConcepto}>
                                <div className={estilos.filaIcono}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                </div>
                                <div>
                                    <span className={estilos.filaNombre}>{g.concepto}</span>
                                    {g.comprobante_numero && <span className={estilos.filaComprobante}>{g.comprobante_numero}</span>}
                                </div>
                            </div>
                            <span className={estilos.filaCat}>
                                {g.categoria
                                    ? <span className={estilos.catChip}>{g.categoria}</span>
                                    : <span className={estilos.catVacia}>—</span>
                                }
                            </span>
                            <span className={estilos.filaCaja}>
                                {g.caja_numero
                                    ? <span className={estilos.cajaChip}>#{g.caja_numero}</span>
                                    : <span className={estilos.catVacia}>—</span>
                                }
                            </span>
                            <span className={estilos.filaFecha}>{fmtFechaCorta(g.fecha_gasto)}</span>
                            <span className={estilos.filaMonto}>{fmtMoneda(g.monto)}</span>
                            <div className={estilos.filaAcciones}>
                                <button onClick={() => abrirDetalles(g.id)} className={estilos.btnAcc} title="Ver" disabled={procesando}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                </button>
                                <button onClick={() => abrirEditar(g)} className={estilos.btnAcc} title="Editar" disabled={procesando}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button onClick={() => handleEliminar(g.id, g.concepto)} className={`${estilos.btnAcc} ${estilos.btnAccDanger}`} title="Eliminar" disabled={procesando}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}