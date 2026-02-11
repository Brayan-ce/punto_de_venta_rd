'use client'

import { useState, useEffect } from 'react'
import {
    CreditCard,
    Building2,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    X,
    Ban,
    PlayCircle,
    FileText,
    Users
} from 'lucide-react'
import {
    suspenderSuscripcion as suspenderSuscripcionAction,
    activarSuscripcion as activarSuscripcionAction
} from '@/_Pages/superadmin/depuracion/suscripciones/servidor'
import s from './suscripciones.module.css'

export default function GestionSuscripciones({ suscripcionesIniciales = [] }) {
    const [suscripciones, setSuscripciones] = useState(suscripcionesIniciales)
    const [filtroEstado, setFiltroEstado] = useState('todas')
    const [busqueda, setBusqueda] = useState('')
    const [modalAccion, setModalAccion] = useState(null)
    const [accionTipo, setAccionTipo] = useState(null) // 'suspender', 'activar', 'pago'
    const [motivo, setMotivo] = useState('')
    const [diasExtension, setDiasExtension] = useState(30)
    const [cargando, setCargando] = useState(false)
    const [tema, setTema] = useState('light')

    useEffect(() => {
        const checkTheme = () => {
            const isDark = document.body.classList.contains('dark-mode') ||
                document.documentElement.classList.contains('dark')
            setTema(isDark ? 'dark' : 'light')
        }
        checkTheme()
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    const suscripcionesFiltradas = suscripciones.filter(sub => {
        const coincideEstado = filtroEstado === 'todas' || sub.estado === filtroEstado
        const coincideBusqueda =
            (sub.nombre_empresa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (sub.rnc || '').includes(busqueda)
        return coincideEstado && coincideBusqueda
    })

    const doesExceedLimits = (sub) => {
        return (sub.usuarios_actuales > sub.limite_usuarios) || (sub.productos_actuales > sub.limite_productos)
    }

    const abrirModal = (suscripcion, tipo) => {
        setModalAccion(suscripcion)
        setAccionTipo(tipo)
        setMotivo('')
    }

    const cerrarModal = () => {
        setModalAccion(null)
        setAccionTipo(null)
        setMotivo('')
    }

    const ejecutarAccion = async () => {
        if (accionTipo === 'suspender' && (!motivo || motivo.length < 10)) {
            alert('El motivo debe tener al menos 10 caracteres')
            return
        }

        setCargando(true)

        try {
            let resultado
            if (accionTipo === 'suspender') {
                resultado = await suspenderSuscripcionAction(modalAccion.empresa_id, motivo)
                if (resultado.success) {
                    setSuscripciones(prev => prev.map(s =>
                        s.empresa_id === modalAccion.empresa_id
                            ? { ...s, estado: 'suspendida', bloqueada: 1 }
                            : s
                    ))
                }
            } else if (accionTipo === 'activar') {
                resultado = await activarSuscripcionAction(modalAccion.empresa_id, diasExtension)
                if (resultado.success) {
                    setSuscripciones(prev => prev.map(s =>
                        s.empresa_id === modalAccion.empresa_id
                            ? { ...s, estado: 'activa', bloqueada: 0, dias_restantes: diasExtension }
                            : s
                    ))
                }
            } else if (accionTipo === 'pago') {
                alert("Acción de pago simulada")
                resultado = { success: true }
            }

            if (resultado.success) {
                cerrarModal()
                alert('¡Acción completada exitosamente!')
            } else {
                alert('Error: ' + resultado.mensaje)
            }
        } catch (error) {
            console.error(error)
            alert('Error al ejecutar la acción')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className={`${s.contenedor} ${s[tema]}`}>
            <div className={s.header}>
                <h1 className={s.titulo}><CreditCard size={32} className="text-purple-600" /> Gestión de Suscripciones</h1>
                <p className={s.subtitulo}>Control de planes, pagos y límites por empresa</p>
            </div>

            <div className={s.statsBar}>
                <div className={`${s.statCard} ${s.total} ${s[tema]}`}>
                    <div className={s.statLabel}>Total</div>
                    <div className={s.statValue}>{suscripciones.length}</div>
                </div>
                <div className={`${s.statCard} ${s.activas}`}>
                    <div className={s.statLabel}>Activas</div>
                    <div className={s.statValue}>{suscripciones.filter(s => s.estado === 'activa').length}</div>
                </div>
                <div className={`${s.statCard} ${s.vencidas}`}>
                    <div className={s.statLabel}>Vencidas</div>
                    <div className={s.statValue}>{suscripciones.filter(s => s.estado === 'vencida').length}</div>
                </div>
                <div className={`${s.statCard} ${s.suspendidas}`}>
                    <div className={s.statLabel}>Suspendidas</div>
                    <div className={s.statValue}>{suscripciones.filter(s => s.estado === 'suspendida').length}</div>
                </div>
                <div className={`${s.statCard} ${s.limites}`}>
                    <div className={s.statLabel}>Exceden Límites</div>
                    <div className={s.statValue}>{suscripciones.filter(s => doesExceedLimits(s)).length}</div>
                </div>
            </div>

            <div className={`${s.filtrosBar} ${s[tema]}`}>
                <input
                    type="text"
                    placeholder="Buscar por empresa o RNC..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className={s.input}
                />
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={s.select}>
                    <option value="todas">Todos los estados</option>
                    <option value="activa">Activas</option>
                    <option value="vencida">Vencidas</option>
                    <option value="suspendida">Suspendidas</option>
                    <option value="prueba">En prueba</option>
                </select>
            </div>

            <div className={s.lista}>
                {suscripcionesFiltradas.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-gray-200 text-gray-500">No hay suscripciones.</div>
                ) : (
                    suscripcionesFiltradas.map((sub) => (
                        <div key={sub.id} className={`${s.cardSub} ${s[tema]}`}>
                            <div className={s.cardHeader}>
                                <div className={s.empresaInfo}>
                                    <Building2 size={24} className="text-gray-400" />
                                    <div>
                                        <h3 className={s.empresaNombre}>{sub.nombre_empresa}</h3>
                                        <p className={s.empresaRnc}>RNC: {sub.rnc}</p>
                                    </div>
                                </div>
                                <div className={s.badges}>
                                    <span className={`${s.badge} ${s['plan_' + sub.plan_tipo]}`}>{sub.plan_nombre}</span>
                                    <span className={`${s.badge} ${s['estado_' + sub.estado]}`}>{sub.estado.toUpperCase()}</span>
                                    {sub.bloqueada === 1 && <span className={`${s.badge} ${s.estado_bloqueada}`}>BLOQUEADA</span>}
                                </div>
                            </div>
                            <div className={s.cardBody}>
                                <div className={s.seccion}>
                                    <span className={s.seccionTitulo}>Fechas</span>
                                    <div className={s.datoItem}>
                                        <Calendar size={18} className={s.iconDato} />
                                        <div>
                                            <span className={s.labelSub}>Vencimiento</span>
                                            <div className={s.valorSub}>{new Date(sub.fecha_vencimiento).toLocaleDateString('es-DO')}</div>
                                            <div className={`text-[10px] font-bold ${sub.dias_restantes < 0 ? 'text-red-600' : sub.dias_restantes <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                                                {sub.dias_restantes < 0 ? `Vencida ${Math.abs(sub.dias_restantes)}d` : `Vence en ${sub.dias_restantes}d`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={s.seccion}>
                                    <span className={s.seccionTitulo}>Límites</span>
                                    <div className={s.progressContainer}>
                                        <div className={s.progressLabel}>
                                            <span>Usuarios</span>
                                            <span className={sub.usuarios_actuales > sub.limite_usuarios ? 'text-red-600 font-bold' : ''}>{sub.usuarios_actuales}/{sub.limite_usuarios}</span>
                                        </div>
                                        <div className={s.progressBar}>
                                            <div className={`${s.progressFill} ${sub.usuarios_actuales > sub.limite_usuarios ? s.danger : s.normal}`} style={{ width: `${Math.min((sub.usuarios_actuales / (sub.limite_usuarios || 1)) * 100, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className={s.seccion}>
                                    <span className={s.seccionTitulo}>Facturación</span>
                                    <div className={s.datoItem}>
                                        <DollarSign size={20} className="text-green-600" />
                                        <div>
                                            <span className={s.labelSub}>Monto Mensual</span>
                                            <div className="text-xl font-bold text-green-600">RD${(sub.monto_mensual || 0).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className={s.seccion}>
                                    <span className={s.seccionTitulo}>Operaciones</span>
                                    <div className="flex flex-col gap-2">
                                        {sub.estado === 'suspendida' || sub.estado === 'vencida' ? (
                                            <button onClick={() => abrirModal(sub, 'activar')} className={`${s.btnAccion} ${s.activar}`}><PlayCircle size={16} /> Activar</button>
                                        ) : (
                                            <button onClick={() => abrirModal(sub, 'suspender')} className={`${s.btnAccion} ${s.suspender}`}><Ban size={16} /> Suspender</button>
                                        )}
                                        <button onClick={() => abrirModal(sub, 'pago')} className={`${s.btnAccion} ${s.pagar}`}><DollarSign size={16} /> Registrar Pago</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {modalAccion && (
                <div className={s.modalOverlay}>
                    <div className={`${s.modal} ${s[tema]}`}>
                        <div className={`${s.modalHeader} ${s[accionTipo]}`}>
                            <h2 className={s.modalTitle}>
                                {accionTipo === 'suspender' && <><Ban size={24} /> Suspender</>}
                                {accionTipo === 'activar' && <><PlayCircle size={24} /> Activar</>}
                                {accionTipo === 'pago' && <><DollarSign size={24} /> Pago</>}
                            </h2>
                            <button onClick={cerrarModal} className="text-white hover:opacity-70"><X size={24} /></button>
                        </div>
                        <div className={s.modalBody}>
                            <p className="font-bold mb-4">{modalAccion.nombre_empresa}</p>
                            {accionTipo === 'suspender' && (
                                <>
                                    <div className={`${s.alertaModal} ${s.suspender}`}>
                                        <AlertTriangle size={20} />
                                        <span>Bloqueará el acceso a todos los usuarios. Los datos se preservan.</span>
                                    </div>
                                    <label className="text-sm font-bold block mb-2">Motivo (min 10 car.)</label>
                                    <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} className={s.textarea} placeholder="Ej: Falta de pago recurrente..." />
                                </>
                            )}
                            {accionTipo === 'activar' && (
                                <>
                                    <div className={`${s.alertaModal} ${s.activar}`}><CheckCircle size={20} /><span>Restablecerá el acceso y extenderá el tiempo.</span></div>
                                    <label className="text-sm font-bold block mb-2">Días de extensión</label>
                                    <input type="number" value={diasExtension} onChange={(e) => setDiasExtension(Number(e.target.value))} className={s.modalInput} />
                                </>
                            )}
                            <div className={s.modalFooter}>
                                <button onClick={cerrarModal} className={s.btnSecundario}>Cancelar</button>
                                <button
                                    onClick={ejecutarAccion}
                                    disabled={cargando || (accionTipo === 'suspender' && motivo.length < 10)}
                                    className={`${s.btnPrimario} ${s[accionTipo]}`}
                                >
                                    {cargando ? 'Procesando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
