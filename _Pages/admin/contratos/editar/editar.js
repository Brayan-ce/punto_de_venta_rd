"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerContratoParaEditar, actualizarContrato, obtenerDatosEmpresa } from './servidor'
import { useLanguage } from '../../i18n/LanguageProvider'
import estilos from './editar.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const ESTADOS = ['activo', 'pagado', 'incumplido', 'reestructurado', 'cancelado']

export default function EditarContrato() {
    const { language } = useLanguage()
    const { id } = useParams()
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')
    const [contrato, setContrato] = useState(null)
    const [activos, setActivos] = useState([])
    const [activosEliminados, setActivosEliminados] = useState([])
    const [empresa, setEmpresa] = useState(null)
    const [form, setForm] = useState({
        estado: '',
        notas: '',
        fiador_id: null,
        fiador_nombre: '',
        fiador_cedula: '',
        fiador_telefono: '',
        fiador_email: '',
        fiador_direccion: '',
    })

    const tr = (es, en) => language === 'en' ? en : es
    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'
    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const trEstado = (estado) => {
        const map = {
            activo: tr('activo', 'active'),
            pagado: tr('pagado', 'paid'),
            incumplido: tr('incumplido', 'defaulted'),
            reestructurado: tr('reestructurado', 'restructured'),
            cancelado: tr('cancelado', 'cancelled'),
        }
        return map[estado] || estado
    }

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

    useEffect(() => { if (id) cargar(); cargarEmpresa() }, [id])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargar = async () => {
        setCargando(true)
        const r = await obtenerContratoParaEditar(id)
        if (r.success) {
            setContrato(r.contrato)
            setActivos(r.activos || [])
            const f = r.fiador
            setForm({
                estado: r.contrato.estado,
                notas: r.contrato.notas || '',
                fiador_id:        f?.id        || null,
                fiador_nombre:    f?.nombre    || '',
                fiador_cedula:    f?.cedula    || '',
                fiador_telefono:  f?.telefono  || '',
                fiador_email:     f?.email     || '',
                fiador_direccion: f?.direccion || '',
            })
        }
        setCargando(false)
    }

    const set = (campo, val) => setForm(p => ({ ...p, [campo]: val }))

    const agregarActivo = () =>
        setActivos(p => [...p, { id: null, nombre: '', descripcion: '', serial: '', valor: '' }])

    const cambiarActivo = (i, campo, val) =>
        setActivos(p => p.map((a, idx) => idx === i ? { ...a, [campo]: val } : a))

    const quitarActivo = (i) => {
        const a = activos[i]
        if (a.id) setActivosEliminados(p => [...p, a.id])
        setActivos(p => p.filter((_, idx) => idx !== i))
    }

    const handleGuardar = async () => {
        setGuardando(true)
        setError('')
        setExito('')
        const r = await actualizarContrato(id, {
            estado:           form.estado,
            notas:            form.notas,
            fiador_id:        form.fiador_id,
            fiador_nombre:    form.fiador_nombre,
            fiador_cedula:    form.fiador_cedula,
            fiador_telefono:  form.fiador_telefono,
            fiador_email:     form.fiador_email,
            fiador_direccion: form.fiador_direccion,
            activos,
            activos_eliminados: activosEliminados,
        })
        if (r.success) {
            setExito(tr('Préstamo actualizado correctamente', 'Loan updated successfully'))
            setTimeout(() => router.push(`/admin/contratos/ver/${id}`), 1200)
        } else {
            setError(r.mensaje)
        }
        setGuardando(false)
    }

    const fmtMoneda = (v) =>
        new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 2 }).format(v || 0)
    const fmtFecha = (f) =>
        f ? new Date(f + 'T00:00:00').toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

    if (cargando) { return <LoadingScreen /> }

    if (!contrato) return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.noEncontrado}>
                <ion-icon name="document-outline"></ion-icon>
                <h3>{tr('Préstamo no encontrado', 'Loan not found')}</h3>
                <Link href="/admin/contratos" className={estilos.btnVolver}>{tr('Volver', 'Back')}</Link>
            </div>
        </div>
    )

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <Link href={`/admin/contratos/ver/${id}`} className={estilos.btnVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>{tr('Ver préstamo', 'View loan')}</span>
                </Link>
                <div>
                    <h1 className={estilos.titulo}>{tr('Editar Préstamo', 'Edit Loan')} — {contrato.numero}</h1>
                    <p className={estilos.subtitulo}>{contrato.cliente_nombre} {contrato.cliente_apellidos || ''}</p>
                </div>
            </div>

            <div className={estilos.infoContrato}>
                {[
                    { l: tr('Plan', 'Plan'),       v: contrato.plan_nombre },
                    { l: tr('Financiado', 'Financed'), v: fmtMoneda(contrato.monto_financiado) },
                    { l: tr('Cuota', 'Installment'),      v: fmtMoneda(contrato.cuota_mensual) },
                    { l: tr('Inicio', 'Start'),     v: fmtFecha(contrato.fecha_inicio) },
                    { l: tr('Fin', 'End'),        v: fmtFecha(contrato.fecha_fin) },
                    { l: tr('Saldo', 'Balance'),      v: fmtMoneda(contrato.saldo_pendiente) },
                ].map((x, i) => (
                    <div key={i} className={estilos.infoItem}>
                        <span className={estilos.infoLabel}>{x.l}</span>
                        <span className={estilos.infoValor}>{x.v}</span>
                    </div>
                ))}
            </div>

            <div className={estilos.grid}>

                <div className={estilos.card}>
                    <h2 className={estilos.cardTitulo}>
                        <ion-icon name="settings-outline"></ion-icon>
                        {tr('Estado y Notas', 'Status and Notes')}
                    </h2>
                    <div className={estilos.campo}>
                        <label className={estilos.label}>{tr('Estado del préstamo', 'Loan status')}</label>
                        <div className={estilos.estadosGrid}>
                            {ESTADOS.map(e => (
                                <button
                                    key={e}
                                    className={`${estilos.estadoBtn} ${estilos[e]} ${form.estado === e ? estilos.estadoBtnActivo : ''}`}
                                    onClick={() => set('estado', e)}
                                >
                                    {form.estado === e && <ion-icon name="checkmark-outline"></ion-icon>}
                                    <span>{trEstado(e)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={estilos.campo}>
                        <label className={estilos.label}>{tr('Notas', 'Notes')}</label>
                        <textarea
                            className={`${estilos.input} ${estilos.textarea}`}
                            rows={4}
                            placeholder={tr('Observaciones sobre el préstamo...', 'Notes about the loan...')}
                            value={form.notas}
                            onChange={e => set('notas', e.target.value)}
                        />
                    </div>
                </div>

                <div className={estilos.card}>
                    <h2 className={estilos.cardTitulo}>
                        <ion-icon name="shield-checkmark-outline"></ion-icon>
                        {tr('Fiador', 'Guarantor')}
                    </h2>
                    <div className={estilos.gridDos}>
                        {[
                            { campo: 'fiador_nombre',    label: tr('Nombre completo', 'Full name'), tipo: 'text',  placeholder: tr('Nombre del fiador', 'Guarantor name') },
                            { campo: 'fiador_cedula',    label: tr('Cedula', 'ID'),          tipo: 'text',  placeholder: '000-0000000-0' },
                            { campo: 'fiador_telefono',  label: tr('Telefono', 'Phone'),        tipo: 'tel',   placeholder: '809-000-0000' },
                            { campo: 'fiador_email',     label: 'Email',           tipo: 'email', placeholder: 'correo@ejemplo.com' },
                        ].map(f => (
                            <div key={f.campo} className={estilos.campo}>
                                <label className={estilos.label}>{f.label}</label>
                                <input
                                    type={f.tipo}
                                    className={estilos.input}
                                    value={form[f.campo]}
                                    onChange={e => set(f.campo, e.target.value)}
                                    placeholder={f.placeholder}
                                />
                            </div>
                        ))}
                        <div className={`${estilos.campo} ${estilos.colSpan2}`}>
                            <label className={estilos.label}>{tr('Direccion', 'Address')}</label>
                            <input
                                type="text"
                                className={estilos.input}
                                value={form.fiador_direccion}
                                onChange={e => set('fiador_direccion', e.target.value)}
                                placeholder={tr('Direccion del fiador', 'Guarantor address')}
                            />
                        </div>
                    </div>
                </div>

                <div className={`${estilos.card} ${estilos.cardFull}`}>
                    <div className={estilos.cardTituloRow}>
                        <h2 className={estilos.cardTitulo}>
                            <ion-icon name="cube-outline"></ion-icon>
                            {tr('Activos / Garantias', 'Assets / Collateral')}
                        </h2>
                        <button className={estilos.btnAgregar} onClick={agregarActivo}>
                            <ion-icon name="add-circle-outline"></ion-icon>
                            {tr('Agregar activo', 'Add asset')}
                        </button>
                    </div>

                    {activos.length === 0 ? (
                        <div className={estilos.activosVacio}>
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>{tr('Sin activos registrados', 'No assets registered')}</span>
                            <button className={estilos.btnAgregarVacio} onClick={agregarActivo}>{tr('Agregar', 'Add')}</button>
                        </div>
                    ) : (
                        <div className={estilos.activosList}>
                            {activos.map((a, i) => (
                                <div key={i} className={estilos.activoCard}>
                                    <div className={estilos.activoHeader}>
                                        <span className={estilos.activoNum}>
                                            {tr('Activo', 'Asset')} #{i + 1}{!a.id ? ` ${tr('(nuevo)', '(new)')}` : ''}
                                        </span>
                                        <button className={estilos.btnQuitar} onClick={() => quitarActivo(i)}>
                                            <ion-icon name="trash-outline"></ion-icon>
                                        </button>
                                    </div>
                                    <div className={estilos.gridDos}>
                                        {[
                                            { campo: 'nombre',      label: tr('Nombre *', 'Name *'),      placeholder: 'Ej: TV 55"',          tipo: 'text' },
                                            { campo: 'serial',      label: 'Serial',        placeholder: tr('Numero de serie', 'Serial number'),     tipo: 'text' },
                                            { campo: 'valor',       label: tr(`Valor (${simboloMoneda})`, `Value (${simboloMoneda})`),   placeholder: '0.00',                tipo: 'number' },
                                            { campo: 'descripcion', label: tr('Descripcion', 'Description'),   placeholder: tr('Descripcion del bien', 'Asset description'), tipo: 'text' },
                                        ].map(f => (
                                            <div key={f.campo} className={estilos.campo}>
                                                <label className={estilos.label}>{f.label}</label>
                                                <input
                                                    type={f.tipo}
                                                    className={estilos.input}
                                                    value={a[f.campo]}
                                                    onChange={e => cambiarActivo(i, f.campo, e.target.value)}
                                                    placeholder={f.placeholder}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className={estilos.errorMsg}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    {error}
                </div>
            )}
            {exito && (
                <div className={estilos.exitoMsg}>
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                    {exito}
                </div>
            )}

            <div className={estilos.acciones}>
                <Link href={`/admin/contratos/ver/${id}`} className={estilos.btnCancelar}>
                    {tr('Cancelar', 'Cancel')}
                </Link>
                <button className={estilos.btnGuardar} onClick={handleGuardar} disabled={guardando}>
                    {guardando
                        ? <><div className={estilos.spinnerSm}></div>{tr('Guardando...', 'Saving...')}</>
                        : <><ion-icon name="save-outline"></ion-icon>{tr('Guardar cambios', 'Save changes')}</>
                    }
                </button>
            </div>
        </div>
    )
}