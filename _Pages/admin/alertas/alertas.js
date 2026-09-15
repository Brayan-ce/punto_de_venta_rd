"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    obtenerAlertas,
    cambiarEstadoAlerta,
    eliminarAlerta,
    crearAlertaManual,
    generarAlertasAutomaticas,
    obtenerContratosParaAlerta,
    obtenerDatosEmpresa
} from './servidor'
import { useLanguage } from '../i18n/LanguageProvider'
import estilos from './alertas.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const TIPO_COLOR   = { vencimiento: 'orange', mora: 'red', incumplimiento: 'purple', otro: 'blue' }
const TIPO_ICON    = { vencimiento: 'time-outline', mora: 'warning-outline', incumplimiento: 'close-circle-outline', otro: 'information-circle-outline' }

const FORM_VACIO = { tipo: 'vencimiento', mensaje: '', contrato_id: '' }

export default function AlertasFinanciamiento() {
    const { language } = useLanguage()
    const [tema, setTema]               = useState('light')
    const [cargando, setCargando]       = useState(true)
    const [alertas, setAlertas]         = useState([])
    const [stats, setStats]             = useState({})
    const [busqueda, setBusqueda]       = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [filtroTipo, setFiltroTipo]   = useState('todos')
    const [modalEliminar, setModalEliminar] = useState(null)
    const [eliminando, setEliminando]   = useState(false)
    const [modalNueva, setModalNueva]   = useState(false)
    const [contratos, setContratos]     = useState([])
    const [form, setForm]               = useState({ ...FORM_VACIO })
    const [guardando, setGuardando]     = useState(false)
    const [errorForm, setErrorForm]     = useState('')
    const [generando, setGenerando]     = useState(false)
    const [msgGenerando, setMsgGenerando] = useState('')
    const [empresa, setEmpresa] = useState(null)

    const tr = (es, en) => language === 'en' ? en : es
    const TIPO_LABEL   = { vencimiento: tr('Vencimiento', 'Due Date'), mora: tr('Mora', 'Late Fee'), incumplimiento: tr('Incumplimiento', 'Default'), otro: tr('Otro', 'Other') }
    const ESTADO_LABEL = { activa: tr('Activa', 'Active'), resuelta: tr('Resuelta', 'Resolved'), descartada: tr('Descartada', 'Dismissed') }

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const onChange = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', onChange)
        window.addEventListener('storage', onChange)
        return () => {
            window.removeEventListener('temaChange', onChange)
            window.removeEventListener('storage', onChange)
        }
    }, [])

    useEffect(() => { cargar(); cargarEmpresa() }, [])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargar = async () => {
        setCargando(true)
        const r = await obtenerAlertas({ estado: filtroEstado, tipo: filtroTipo, busqueda })
        if (r.success) { setAlertas(r.alertas); setStats(r.stats) }
        setCargando(false)
    }

    const handleEstado = async (id, estado) => {
        await cambiarEstadoAlerta(id, estado)
        cargar()
    }

    const handleEliminar = async () => {
        setEliminando(true)
        const r = await eliminarAlerta(modalEliminar.id)
        if (r.success) { setModalEliminar(null); cargar() }
        setEliminando(false)
    }

    const abrirModalNueva = async () => {
        const r = await obtenerContratosParaAlerta()
        if (r.success) setContratos(r.contratos)
        setForm({ ...FORM_VACIO })
        setErrorForm('')
        setModalNueva(true)
    }

    const handleGuardar = async () => {
        setGuardando(true); setErrorForm('')
        const r = await crearAlertaManual({
            tipo:        form.tipo,
            mensaje:     form.mensaje,
            contrato_id: form.contrato_id || null,
        })
        if (r.success) { setModalNueva(false); cargar() }
        else setErrorForm(r.mensaje)
        setGuardando(false)
    }

    const handleGenerar = async () => {
        setGenerando(true); setMsgGenerando('')
        const r = await generarAlertasAutomaticas()
        setMsgGenerando(r.mensaje)
        setGenerando(false)
        cargar()
    }

    const localeEmpresa = empresa?.locale || 'es-DO'
    const monedaEmpresa = empresa?.moneda || 'DOP'

    const fmtMoneda = (v) =>
        new Intl.NumberFormat(language === 'en' ? 'en-US' : localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 0 }).format(v || 0)

    const fmtFecha = (f) => {
        if (!f) return '—'
        return new Date(f).toLocaleDateString(language === 'en' ? 'en-US' : localeEmpresa, { day: '2-digit', month: 'short', year: 'numeric' })
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}>
                        <ion-icon name="notifications-outline"></ion-icon>
                    </div>
                    <div>
                        <h1 className={estilos.titulo}>{tr('Alertas de Financiamiento', 'Financing Alerts')}</h1>
                        <p className={estilos.subtitulo}>{tr('Seguimiento de vencimientos, moras e incumplimientos', 'Track due dates, late fees, and defaults')}</p>
                    </div>
                </div>
                <div className={estilos.headerAcciones}>
                    <button className={estilos.btnGenerar} onClick={handleGenerar} disabled={generando}>
                        {generando
                            ? <><div className={estilos.spinnerSm}></div>{tr('Procesando...', 'Processing...')}</>
                            : <><ion-icon name="refresh-outline"></ion-icon>{tr('Generar alertas', 'Generate alerts')}</>}
                    </button>
                    <button className={estilos.btnNuevo} onClick={abrirModalNueva}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>{tr('Nueva alerta', 'New alert')}</span>
                    </button>
                </div>
            </div>

            {msgGenerando && (
                <div className={estilos.msgGenerando}>
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                    <span>{msgGenerando}</span>
                    <button onClick={() => setMsgGenerando('')}><ion-icon name="close-outline"></ion-icon></button>
                </div>
            )}

            <div className={estilos.statsGrid}>
                {[
                    { label: tr('Total', 'Total'),          valor: stats.total    || 0, color: 'blue',   icon: 'notifications-outline' },
                    { label: tr('Activas', 'Active'),         valor: stats.activas  || 0, color: 'red',    icon: 'alert-circle-outline' },
                    { label: tr('Resueltas', 'Resolved'),       valor: stats.resueltas|| 0, color: 'green',  icon: 'checkmark-circle-outline' },
                    { label: tr('Incumplimientos', 'Defaults'), valor: stats.incumplimiento || 0, color: 'purple', icon: 'close-circle-outline' },
                ].map((s, i) => (
                    <div key={i} className={`${estilos.statCard} ${estilos[s.color]}`}>
                        <div className={`${estilos.statIcono} ${estilos[s.color]}`}>
                            <ion-icon name={s.icon}></ion-icon>
                        </div>
                        <div>
                            <span className={estilos.statValor}>{s.valor}</span>
                            <span className={estilos.statLabel}>{s.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={estilos.toolbar}>
                <div className={estilos.buscadorWrapper}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        className={estilos.inputBuscador}
                        placeholder={tr('Buscar por contrato, cliente o mensaje...', 'Search by contract, customer, or message...')}
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <button className={estilos.btnLimpiar} onClick={() => setBusqueda('')}>
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    )}
                </div>
                <div className={estilos.filtros}>
                    {['todos', 'activa', 'resuelta', 'descartada'].map(f => (
                        <button
                            key={f}
                            className={`${estilos.filtroBtn} ${filtroEstado === f ? estilos.filtroActivo : ''}`}
                            onClick={() => setFiltroEstado(f)}
                        >
                            {f === 'todos' ? tr('Todos', 'All') : ESTADO_LABEL[f]}
                        </button>
                    ))}
                </div>
                <div className={estilos.filtros}>
                    {['todos', 'vencimiento', 'mora', 'incumplimiento', 'otro'].map(f => (
                        <button
                            key={f}
                            className={`${estilos.filtroBtn} ${filtroTipo === f ? estilos.filtroActivo : ''}`}
                            onClick={() => setFiltroTipo(f)}
                        >
                            {f === 'todos' ? tr('Todos los tipos', 'All types') : TIPO_LABEL[f]}
                        </button>
                    ))}
                </div>
            </div>

            {cargando ? <LoadingScreen /> : alertas.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="notifications-off-outline"></ion-icon>
                    <h3>{tr('No hay alertas', 'There are no alerts')}</h3>
                    <p>{busqueda ? tr('Intenta con otro termino', 'Try another term') : tr('Todo esta bajo control', 'Everything is under control')}</p>
                </div>
            ) : (
                <div className={estilos.tablaWrapper}>
                    <table className={estilos.tabla}>
                        <thead>
                            <tr>
                                <th>{tr('Tipo', 'Type')}</th>
                                <th>{tr('Mensaje', 'Message')}</th>
                                <th>{tr('Contrato', 'Contract')}</th>
                                <th>{tr('Cliente', 'Customer')}</th>
                                <th>{tr('Cuota', 'Installment')}</th>
                                <th>{tr('Vencimiento', 'Due Date')}</th>
                                <th>{tr('Estado', 'Status')}</th>
                                <th>{tr('Fecha', 'Date')}</th>
                                <th>{tr('Acciones', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alertas.map(a => (
                                <tr key={a.id} className={`${estilos.fila} ${a.estado !== 'activa' ? estilos.filaInactiva : ''}`}>
                                    <td>
                                        <span className={`${estilos.tipoBadge} ${estilos[TIPO_COLOR[a.tipo]]}`}>
                                            <ion-icon name={TIPO_ICON[a.tipo]}></ion-icon>
                                            {TIPO_LABEL[a.tipo]}
                                        </span>
                                    </td>
                                    <td className={estilos.tdMensaje}>{a.mensaje}</td>
                                    <td>
                                        {a.contrato_numero
                                            ? <Link href={`/admin/contratos/ver/${a.contrato_id}`} className={estilos.linkContrato}>
                                                {a.contrato_numero}
                                              </Link>
                                            : <span className={estilos.tdGris}>—</span>}
                                    </td>
                                    <td>
                                        {a.cliente_nombre
                                            ? <span className={estilos.clienteCell}>
                                                <span className={estilos.avatarMini}>{a.cliente_nombre.charAt(0)}</span>
                                                {a.cliente_nombre}
                                              </span>
                                            : <span className={estilos.tdGris}>—</span>}
                                    </td>
                                    <td>
                                        {a.cuota_numero
                                            ? <span className={estilos.cuotaCell}>
                                                <span>#{a.cuota_numero}</span>
                                                {a.cuota_monto && <span className={estilos.tdGris}>{fmtMoneda(a.cuota_monto)}</span>}
                                              </span>
                                            : <span className={estilos.tdGris}>—</span>}
                                    </td>
                                    <td>
                                        {a.fecha_vencimiento
                                            ? <span className={`${estilos.fechaVenc} ${a.cuota_estado === 'vencida' ? estilos.fechaVencida : ''}`}>
                                                {fmtFecha(a.fecha_vencimiento)}
                                              </span>
                                            : <span className={estilos.tdGris}>—</span>}
                                    </td>
                                    <td>
                                        <span className={`${estilos.estadoBadge} ${estilos['estado_' + a.estado]}`}>
                                            {ESTADO_LABEL[a.estado]}
                                        </span>
                                    </td>
                                    <td className={estilos.tdGris}>{fmtFecha(a.fecha)}</td>
                                    <td>
                                        <div className={estilos.acciones}>
                                            {a.estado === 'activa' && (
                                                <>
                                                    <button
                                                        className={estilos.btnResolver}
                                                        onClick={() => handleEstado(a.id, 'resuelta')}
                                                        title={tr('Marcar como resuelta', 'Mark as resolved')}
                                                    >
                                                        <ion-icon name="checkmark-outline"></ion-icon>
                                                    </button>
                                                    <button
                                                        className={estilos.btnDescartar}
                                                        onClick={() => handleEstado(a.id, 'descartada')}
                                                        title={tr('Descartar', 'Dismiss')}
                                                    >
                                                        <ion-icon name="ban-outline"></ion-icon>
                                                    </button>
                                                </>
                                            )}
                                            {a.estado !== 'activa' && (
                                                <button
                                                    className={estilos.btnReactivar}
                                                    onClick={() => handleEstado(a.id, 'activa')}
                                                    title={tr('Reactivar', 'Reactivate')}
                                                >
                                                    <ion-icon name="refresh-outline"></ion-icon>
                                                </button>
                                            )}
                                            {a.contrato_id && (
                                                <Link href={`/admin/contratos/ver/${a.contrato_id}`} className={estilos.btnVer} title={tr('Ver contrato', 'View contract')}>
                                                    <ion-icon name="eye-outline"></ion-icon>
                                                </Link>
                                            )}
                                            {a.cuota_id && (
                                                <Link href={`/admin/cuotas?contrato=${a.contrato_id}`} className={estilos.btnCuota} title={tr('Ver cuota', 'View installment')}>
                                                    <ion-icon name="calendar-outline"></ion-icon>
                                                </Link>
                                            )}
                                            <button
                                                className={estilos.btnEliminar}
                                                onClick={() => setModalEliminar(a)}
                                                title={tr('Eliminar', 'Delete')}
                                            >
                                                <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modalNueva && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && setModalNueva(false)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3 className={estilos.modalTitulo}>{tr('Nueva alerta manual', 'New manual alert')}</h3>
                            <button className={estilos.btnCerrarModal} onClick={() => setModalNueva(false)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.camposModal}>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Tipo *', 'Type *')}</label>
                                <select
                                    className={estilos.select}
                                    value={form.tipo}
                                    onChange={e => setForm(v => ({ ...v, tipo: e.target.value }))}
                                >
                                    {Object.entries(TIPO_LABEL).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Contrato asociado', 'Associated contract')}</label>
                                <select
                                    className={estilos.select}
                                    value={form.contrato_id}
                                    onChange={e => setForm(v => ({ ...v, contrato_id: e.target.value }))}
                                >
                                    <option value="">{tr('Sin contrato', 'No contract')}</option>
                                    {contratos.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.numero} — {c.cliente_nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Mensaje *', 'Message *')}</label>
                                <textarea
                                    className={`${estilos.input} ${estilos.textarea}`}
                                    rows={3}
                                    placeholder={tr('Describe la alerta...', 'Describe the alert...')}
                                    value={form.mensaje}
                                    onChange={e => setForm(v => ({ ...v, mensaje: e.target.value }))}
                                />
                            </div>

                            {errorForm && (
                                <div className={estilos.errorMsg}>
                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                    {errorForm}
                                </div>
                            )}
                        </div>

                        <div className={estilos.modalAcciones}>
                            <button className={estilos.btnCancelar} onClick={() => setModalNueva(false)}>
                                {tr('Cancelar', 'Cancel')}
                            </button>
                            <button
                                className={estilos.btnConfirmar}
                                onClick={handleGuardar}
                                disabled={guardando || !form.mensaje.trim()}
                            >
                                {guardando
                                    ? <><div className={estilos.spinnerSm}></div>{tr('Guardando...', 'Saving...')}</>
                                    : <><ion-icon name="add-circle-outline"></ion-icon>{tr('Crear alerta', 'Create alert')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalEliminar && (
                <div className={estilos.overlay} onClick={e => e.target === e.currentTarget && setModalEliminar(null)}>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalIconoEliminar}>
                            <ion-icon name="trash-outline"></ion-icon>
                        </div>
                        <h3 className={estilos.modalTitulo}>{tr('Eliminar alerta', 'Delete alert')}</h3>
                        <p className={estilos.modalTexto}>
                            {tr('Esta accion no se puede deshacer.', 'This action cannot be undone.')}
                        </p>
                        <div className={estilos.modalAcciones}>
                            <button className={estilos.btnCancelar} onClick={() => setModalEliminar(null)}>
                                {tr('Cancelar', 'Cancel')}
                            </button>
                            <button className={estilos.btnConfirmarEliminar} onClick={handleEliminar} disabled={eliminando}>
                                {eliminando
                                    ? <><div className={estilos.spinnerSm}></div>{tr('Eliminando...', 'Deleting...')}</>
                                    : <><ion-icon name="trash-outline"></ion-icon>{tr('Eliminar', 'Delete')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}