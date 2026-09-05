"use client"
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
    obtenerContratosAgrupados, obtenerCategorias, obtenerDatosEmpresa,
    crearCategoria, editarCategoria, eliminarCategoria, asignarCategoria
} from './servidor'
import { useLanguage } from '../../i18n/LanguageProvider'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'
import estilos from './listar.module.css'

const COLORES_PRESET = [
    '#ef4444','#f97316','#f59e0b','#84cc16','#10b981',
    '#06b6d4','#3b82f6','#8b5cf6','#ec4899','#6b7280'
]

export default function ListarContratos() {
    const { language } = useLanguage()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [grupos, setGrupos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [total, setTotal] = useState(0)

    const [buscar, setBuscar] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('')
    const [gruposColapsados, setGruposColapsados] = useState({})
    const debounceRef = useRef(null)

    const [modalCat, setModalCat] = useState(false)
    const [editandoCat, setEditandoCat] = useState(null)
    const [formCat, setFormCat] = useState({ nombre: '', color: '#3b82f6', descripcion: '' })
    const [guardandoCat, setGuardandoCat] = useState(false)
    const [errorCat, setErrorCat] = useState('')

    const [modalAsignar, setModalAsignar] = useState(false)
    const [contratoAsignar, setContratoAsignar] = useState(null)
    const [categoriaElegida, setCategoriaElegida] = useState(null)
    const [guardandoAsignar, setGuardandoAsignar] = useState(false)
    const [empresa, setEmpresa] = useState(null)

    const localeEmpresa = empresa?.locale || (language === 'en' ? 'en-US' : 'es-DO')
    const monedaEmpresa = empresa?.moneda || 'DOP'
    const fmtMoneda = (v) => new Intl.NumberFormat(localeEmpresa, { style: 'currency', currency: monedaEmpresa, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0)

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const onChange = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', onChange)
        window.addEventListener('storage', onChange)
        return () => { window.removeEventListener('temaChange', onChange); window.removeEventListener('storage', onChange) }
    }, [])

    useEffect(() => { cargar(); cargarEmpresa() }, [filtroEstado, filtroCategoria])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    useEffect(() => {
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => cargar(), 300)
    }, [buscar])

    const cargar = async () => {
        setCargando(true)
        const r = await obtenerContratosAgrupados({ buscar, estado: filtroEstado, categoria_id: filtroCategoria })
        if (r.success) {
            setGrupos(r.grupos)
            setCategorias(r.categorias)
            setTotal(r.total)
        }
        setCargando(false)
    }

    const toggleGrupo = (key) => setGruposColapsados(p => ({ ...p, [key]: !p[key] }))

    const tr = (es, en) => language === 'en' ? en : es

    const abrirModalCat = (cat = null) => {
        setEditandoCat(cat)
        setFormCat(cat ? { nombre: cat.nombre, color: cat.color, descripcion: cat.descripcion || '' } : { nombre: '', color: '#3b82f6', descripcion: '' })
        setErrorCat('')
        setModalCat(true)
    }

    const guardarCategoria = async () => {
        setGuardandoCat(true); setErrorCat('')
        const r = editandoCat ? await editarCategoria(editandoCat.id, formCat) : await crearCategoria(formCat)
        if (r.success) { setModalCat(false); cargar() }
        else setErrorCat(r.mensaje)
        setGuardandoCat(false)
    }

    const borrarCategoria = async (cat) => {
        if (!confirm(tr(`Eliminar categoría "${cat.nombre}"? Los contratos quedarán sin categoría.`, `Delete category "${cat.nombre}"? Contracts will remain without category.`))) return
        await eliminarCategoria(cat.id)
        cargar()
    }

    const abrirModalAsignar = (contrato) => {
        setContratoAsignar(contrato)
        setCategoriaElegida(contrato.categoria_id || null)
        setModalAsignar(true)
    }

    const confirmarAsignar = async () => {
        if (!contratoAsignar) return
        setGuardandoAsignar(true)
        await asignarCategoria(contratoAsignar.id, categoriaElegida)
        setModalAsignar(false)
        setGuardandoAsignar(false)
        cargar()
    }

    const ESTADOS = ['activo','pagado','incumplido','reestructurado','cancelado']

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Préstamos', 'Loans')}</h1>
                    <p className={estilos.subtitulo}>{total} {tr(total !== 1 ? 'préstamos encontrados' : 'préstamo encontrado', total !== 1 ? 'loans found' : 'loan found')}</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <button className={estilos.btnCategorias} onClick={() => abrirModalCat()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                        {tr('Categorías', 'Categories')}
                    </button>
                    <Link href="/admin/contratos/nuevo" className={estilos.btnNuevo}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        {tr('Nuevo Préstamo', 'New Loan')}
                    </Link>
                </div>
            </div>

            <div className={estilos.filtros}>
                <div className={estilos.buscadorWrap}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                        type="text"
                        placeholder={tr('Buscar por número, cliente...', 'Search by number, customer...')}
                        className={estilos.buscador}
                        value={buscar}
                        onChange={e => setBuscar(e.target.value)}
                    />
                    {buscar && <button className={estilos.limpiarBuscar} onClick={() => setBuscar('')}>✕</button>}
                </div>

                <select className={estilos.selectFiltro} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                    <option value="">{tr('Todos los estados', 'All statuses')}</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                </select>

                <select className={estilos.selectFiltro} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                    <option value="">{tr('Todas las categorías', 'All categories')}</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    <option value="sin">{tr('Sin categoría', 'No category')}</option>
                </select>

                {(buscar || filtroEstado || filtroCategoria) && (
                    <button className={estilos.btnLimpiar} onClick={() => { setBuscar(''); setFiltroEstado(''); setFiltroCategoria('') }}>
                        {tr('Limpiar filtros', 'Clear filters')}
                    </button>
                )}
            </div>

            {categorias.length > 0 && (
                <div className={estilos.chipsCategorias}>
                    <button className={`${estilos.chipCat} ${filtroCategoria === '' ? estilos.chipActivo : ''}`} onClick={() => setFiltroCategoria('')}>
                        {tr('Todas', 'All')}
                    </button>
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

            {cargando ? <LoadingScreen /> : grupos.length === 0 ? (
                <div className={estilos.vacio}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p>{tr('No hay préstamos que mostrar', 'There are no loans to show')}</p>
                    <Link href="/admin/contratos/nuevo" className={estilos.btnNuevo}>{tr('Crear primer préstamo', 'Create first loan')}</Link>
                </div>
            ) : (
                <div className={estilos.listaGrupos}>
                    {grupos.map((grupo, gi) => {
                        const cat = grupo.categoria
                        const key = cat ? `cat-${cat.id}` : 'sin-cat'
                        const colapsado = gruposColapsados[key]
                        const color = cat?.color || '#94a3b8'

                        return (
                            <div key={key} className={estilos.grupo}>
                                {/* ✅ CORREGIDO: div en vez de button para evitar button anidado */}
                                <div
                                    className={estilos.grupoHeader}
                                    onClick={() => toggleGrupo(key)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => e.key === 'Enter' && toggleGrupo(key)}
                                >
                                    <div className={estilos.grupoHeaderLeft}>
                                        <span className={estilos.grupoDot} style={{ background: color }}></span>
                                        <span className={estilos.grupoNombre} style={{ color }}>
                                            {cat ? cat.nombre : tr('Sin categoría', 'No category')}
                                        </span>
                                        <span className={estilos.grupoBadge} style={{ background: color + '22', color }}>
                                            {grupo.contratos.length}
                                        </span>
                                        {cat?.descripcion && <span className={estilos.grupoDesc}>{cat.descripcion}</span>}
                                    </div>
                                    <div className={estilos.grupoHeaderRight}>
                                        {cat && (
                                            <>
                                                <button className={estilos.btnIcono} title="Editar categoría"
                                                    onClick={e => { e.stopPropagation(); abrirModalCat(cat) }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button className={`${estilos.btnIcono} ${estilos.btnIconoDanger}`} title="Eliminar categoría"
                                                    onClick={e => { e.stopPropagation(); borrarCategoria(cat) }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                                                </button>
                                            </>
                                        )}
                                        <svg className={`${estilos.chevron} ${colapsado ? estilos.chevronUp : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                                    </div>
                                </div>

                                {!colapsado && (
                                    <div className={estilos.grupoBody}>
                                        <div className={estilos.tablaWrap}>
                                            <table className={estilos.tabla}>
                                                <thead>
                                                    <tr>
                                                        <th>{tr('Contrato', 'Contract')}</th>
                                                        <th>{tr('Cliente', 'Customer')}</th>
                                                        <th>{tr('Plan', 'Plan')}</th>
                                                        <th>{tr('Financiado', 'Financed')}</th>
                                                        <th>{tr('Cuota', 'Installment')}</th>
                                                        <th>{tr('Saldo', 'Balance')}</th>
                                                        <th>{tr('Estado', 'Status')}</th>
                                                        <th>{tr('Cuotas', 'Installments')}</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {grupo.contratos.map(c => {
                                                        const nombre = `${c.cliente_nombre || ''} ${c.cliente_apellidos || ''}`.trim()
                                                        return (
                                                            <tr key={c.id} className={estilos.fila}>
                                                                <td>
                                                                    <span className={estilos.numContrato}>{c.numero}</span>
                                                                    <span className={estilos.fechaContrato}>{new Date(c.fecha_inicio).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</span>
                                                                </td>
                                                                <td>
                                                                    <div className={estilos.cellCliente}>
                                                                        <div className={estilos.avatar}>{nombre.charAt(0)}</div>
                                                                        <div>
                                                                            <span className={estilos.nombreCliente}>{nombre}</span>
                                                                            <span className={estilos.docCliente}>{c.cliente_documento || ''}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className={estilos.tdGris}>{c.plan_nombre}</td>
                                                                <td className={estilos.tdNum}>{fmtMoneda(c.monto_financiado)}</td>
                                                                <td className={estilos.tdNum}>{fmtMoneda(c.cuota_mensual)}</td>
                                                                <td className={estilos.tdNum}>{fmtMoneda(c.saldo_pendiente)}</td>
                                                                <td>
                                                                    <span className={`${estilos.badge} ${estilos[c.estado]}`}>{c.estado}</span>
                                                                </td>
                                                                <td>
                                                                    <div className={estilos.cuotasInfo}>
                                                                        {c.cuotas_vencidas > 0 && (
                                                                            <span className={estilos.cuotasVencidas} title="Vencidas">
                                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                                                                {c.cuotas_vencidas}
                                                                            </span>
                                                                        )}
                                                                        <span className={estilos.cuotasPend}>{c.cuotas_pendientes} {tr('pend.', 'pend.')}</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className={estilos.acciones}>
                                                                        <button className={estilos.btnAsignar} title={tr('Editar categoría', 'Edit category')}
                                                                            onClick={() => abrirModalAsignar(c)}
                                                                            style={{ borderColor: c.categoria_color || '#e2e8f0', color: c.categoria_color || '#94a3b8' }}>
                                                                            <ion-icon name="create-outline" style={{ fontSize: '14px' }}></ion-icon>
                                                                        </button>
                                                                        <Link href={`/admin/contratos/ver/${c.id}`} className={estilos.btnVer}>
                                                                            {tr('Ver', 'View')}
                                                                        </Link>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {modalCat && (
                <div className={estilos.overlay} onClick={() => setModalCat(false)}>
                    <div className={estilos.modal} onClick={e => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>{editandoCat ? tr('Editar categoría', 'Edit category') : tr('Nueva categoría', 'New category')}</h3>
                            <button className={estilos.modalCerrar} onClick={() => setModalCat(false)}>✕</button>
                        </div>

                        <div className={estilos.modalBody}>
                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Nombre *', 'Name *')}</label>
                                <input type="text" className={estilos.input} value={formCat.nombre}
                                    onChange={e => setFormCat(p => ({ ...p, nombre: e.target.value }))}
                                    placeholder={tr('Ej: Clientes VIP', 'Ex: VIP Customers')} autoFocus />
                            </div>

                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Descripción', 'Description')}</label>
                                <input type="text" className={estilos.input} value={formCat.descripcion}
                                    onChange={e => setFormCat(p => ({ ...p, descripcion: e.target.value }))}
                                    placeholder={tr('Opcional...', 'Optional...')} />
                            </div>

                            <div className={estilos.campo}>
                                <label className={estilos.label}>{tr('Color', 'Color')}</label>
                                <div className={estilos.coloresGrid}>
                                    {COLORES_PRESET.map(col => (
                                        <button key={col} className={`${estilos.colorBtn} ${formCat.color === col ? estilos.colorSeleccionado : ''}`}
                                            style={{ background: col }}
                                            onClick={() => setFormCat(p => ({ ...p, color: col }))}
                                        />
                                    ))}
                                    <input type="color" className={estilos.colorCustom} value={formCat.color}
                                        onChange={e => setFormCat(p => ({ ...p, color: e.target.value }))}
                                        title={tr('Color personalizado', 'Custom color')} />
                                </div>
                                <div className={estilos.previewCat} style={{ borderColor: formCat.color, color: formCat.color, background: formCat.color + '18' }}>
                                    <span className={estilos.grupoDot} style={{ background: formCat.color }}></span>
                                    {formCat.nombre || tr('Vista previa', 'Preview')}
                                </div>
                            </div>

                            {!editandoCat && categorias.length > 0 && (
                                <div className={estilos.catExistentes}>
                                    <label className={estilos.label}>{tr('Categorías existentes', 'Existing categories')}</label>
                                    {categorias.map(c => (
                                        <div key={c.id} className={estilos.catItem}>
                                            <span className={estilos.grupoDot} style={{ background: c.color }}></span>
                                            <span style={{ color: c.color, fontWeight: 600 }}>{c.nombre}</span>
                                            <span className={estilos.catItemCount}>{c.total_contratos} contratos</span>
                                            <div className={estilos.catItemAcciones}>
                                                <button onClick={() => { setModalCat(false); abrirModalCat(c) }} className={estilos.btnIcono}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button onClick={() => { setModalCat(false); borrarCategoria(c) }} className={`${estilos.btnIcono} ${estilos.btnIconoDanger}`}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {errorCat && <p className={estilos.error}>{errorCat}</p>}
                        </div>

                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnCancelar} onClick={() => setModalCat(false)}>{tr('Cancelar', 'Cancel')}</button>
                            <button className={estilos.btnGuardar} onClick={guardarCategoria} disabled={guardandoCat || !formCat.nombre.trim()}>
                                {guardandoCat ? tr('Guardando...', 'Saving...') : editandoCat ? tr('Guardar cambios', 'Save changes') : tr('Crear categoría', 'Create category')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalAsignar && contratoAsignar && (
                <div className={estilos.overlay} onClick={() => setModalAsignar(false)}>
                    <div className={`${estilos.modal} ${estilos.modalChico}`} onClick={e => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>{tr('Asignar categoría', 'Assign category')}</h3>
                            <button className={estilos.modalCerrar} onClick={() => setModalAsignar(false)}>✕</button>
                        </div>

                        <div className={estilos.modalBody}>
                            <p className={estilos.contratoRef}>
                                {tr('Contrato', 'Contract')} <strong>{contratoAsignar.numero}</strong> — {`${contratoAsignar.cliente_nombre || ''} ${contratoAsignar.cliente_apellidos || ''}`.trim()}
                            </p>

                            <div className={estilos.opcionesCat}>
                                <button
                                    className={`${estilos.opcionCat} ${categoriaElegida === null ? estilos.opcionCatActiva : ''}`}
                                    onClick={() => setCategoriaElegida(null)}>
                                    <span className={estilos.grupoDot} style={{ background: '#94a3b8' }}></span>
                                    {tr('Sin categoría', 'No category')}
                                    {categoriaElegida === null && <svg className={estilos.checkIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                </button>
                                {categorias.map(c => (
                                    <button key={c.id}
                                        className={`${estilos.opcionCat} ${categoriaElegida === c.id ? estilos.opcionCatActiva : ''}`}
                                        style={categoriaElegida === c.id ? { borderColor: c.color, background: c.color + '18' } : {}}
                                        onClick={() => setCategoriaElegida(c.id)}>
                                        <span className={estilos.grupoDot} style={{ background: c.color }}></span>
                                        <span style={{ color: c.color, fontWeight: 600 }}>{c.nombre}</span>
                                        {categoriaElegida === c.id && <svg className={estilos.checkIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                    </button>
                                ))}
                                {categorias.length === 0 && (
                                    <p className={estilos.sinCats}>{tr('No tienes categorías.', 'You have no categories.')} <button className={estilos.linkBtn} onClick={() => { setModalAsignar(false); abrirModalCat() }}>{tr('Crear una', 'Create one')}</button></p>
                                )}
                            </div>
                        </div>

                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnCancelar} onClick={() => setModalAsignar(false)}>{tr('Cancelar', 'Cancel')}</button>
                            <button className={estilos.btnGuardar} onClick={confirmarAsignar} disabled={guardandoAsignar}>
                                {guardandoAsignar ? tr('Guardando...', 'Saving...') : tr('Confirmar', 'Confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}