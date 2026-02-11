'use client'

import { useState, useEffect } from 'react'
import {
    ShoppingCart,
    Clock,
    AlertTriangle,
    X,
    Lock,
    DollarSign
} from 'lucide-react'
import {
    forzarCierreCaja as forzarCierreCajaAction
} from '@/_Pages/superadmin/depuracion/cajas/servidor'
import s from './cajas.module.css'

export default function ControlCajas({
    cajasAbiertasIniciales = [],
    cajasInconsistentesIniciales = []
}) {
    const [cajasAbiertas, setCajasAbiertas] = useState(cajasAbiertasIniciales)
    const [cajasInconsistentes, setCajasInconsistentes] = useState(cajasInconsistentesIniciales)
    const [tabActiva, setTabActiva] = useState('abiertas') // abiertas, inconsistencias
    const [modalCierre, setModalCierre] = useState(null)
    const [motivoCierre, setMotivoCierre] = useState('')
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

    const abrirModalCierre = (caja) => {
        setModalCierre(caja)
        setMotivoCierre('')
    }

    const cerrarModal = () => {
        setModalCierre(null)
        setMotivoCierre('')
    }

    const ejecutarCierreForzado = async () => {
        if (!motivoCierre || motivoCierre.length < 10) {
            alert('El motivo debe tener al menos 10 caracteres')
            return
        }

        setCargando(true)
        try {
            const resultado = await forzarCierreCajaAction(modalCierre.id, motivoCierre)
            if (resultado.success) {
                setCajasAbiertas(prev => prev.filter(c => c.id !== modalCierre.id))
                cerrarModal()
                alert('Caja cerrada exitosamente. Monto Final Calculado: ' + resultado.datos.montoFinal)
            } else {
                alert('Error: ' + resultado.mensaje)
            }
        } catch (error) {
            console.error(error)
            alert('Error al cerrar caja')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className={`${s.contenedor} ${s[tema]}`}>
            <div className={s.header}>
                <h1 className={s.titulo}>
                    <ShoppingCart className="w-8 h-8 text-yellow-600" />
                    Control de Cajas
                </h1>
                <p className={s.subtitulo}>
                    Gestión de cierres forzados y análisis de inconsistencias
                </p>
            </div>

            {/* Tabs */}
            <div className={s.tabs}>
                <button
                    onClick={() => setTabActiva('abiertas')}
                    className={`${s.tabBtn} ${tabActiva === 'abiertas' ? s.activo : ''}`}
                >
                    Cajas Abiertas ({cajasAbiertas.length})
                </button>
                <button
                    onClick={() => setTabActiva('inconsistencias')}
                    className={`${s.tabBtn} ${s.inconsistencias} ${tabActiva === 'inconsistencias' ? s.activo : ''}`}
                >
                    Inconsistencias ({cajasInconsistentes.length})
                </button>
            </div>

            {tabActiva === 'abiertas' && (
                <div className={s.lista}>
                    {cajasAbiertas.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-xl border border-gray-200 text-gray-500">
                            No hay cajas abiertas pendientes de revisión (más de 24h).
                        </div>
                    ) : (
                        cajasAbiertas.map(caja => (
                            <div key={caja.id} className={`${s.cardCaja} ${s[tema]}`}>
                                <div className={s.cajaPrincipal}>
                                    <div className={s.infoCaja}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="m-0">Caja #{caja.numero_caja}</h3>
                                            <span className={s.badgeEmpresa}>{caja.nombre_empresa}</span>
                                            {caja.horas_abierta > 48 && (
                                                <span className={s.badgeAlerta}><AlertTriangle size={12} /> {caja.horas_abierta}h+</span>
                                            )}
                                        </div>
                                        <div className={s.metaInfo}>
                                            <div className={s.metaItem}>Usuario: <span className="font-bold">{caja.usuario_nombre}</span></div>
                                            <div className={s.metaItem}><Clock size={16} className={s.iconMeta} /> Abierta hace {caja.horas_abierta}h ({new Date(caja.fecha_apertura).toLocaleString('es-DO')})</div>
                                            <div className={s.metaItem}><DollarSign size={16} className={s.iconMeta} /> Inicial: RD${parseFloat(caja.monto_inicial).toFixed(2)} | Ventas: RD${parseFloat(caja.total_ventas || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => abrirModalCierre(caja)} className={s.btnForzar}>
                                        <Lock size={18} /> Forzar Cierre
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tabActiva === 'inconsistencias' && (
                <div className={s.lista}>
                    {cajasInconsistentes.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-xl border border-gray-200 text-gray-500">
                            No hay cajas con inconsistencias graves registradas.
                        </div>
                    ) : (
                        cajasInconsistentes.map(caja => (
                            <div key={caja.id} className={`${s.cardCaja} ${s[tema]}`}>
                                <div className={s.cajaPrincipal}>
                                    <div className={s.infoCaja}>
                                        <h3 className="m-0">Caja #{caja.numero_caja} - {caja.nombre_empresa}</h3>
                                        <p className="text-sm text-gray-500 m-0 mt-1">Cerrada por: {caja.usuario_nombre}</p>
                                        <p className="text-xs text-gray-400 m-0">{new Date(caja.fecha_cierre).toLocaleString('es-DO')}</p>
                                    </div>
                                    <div className={s.diferenciaPanel}>
                                        <div className={s.difLabel}>Diferencia</div>
                                        <div className={`${s.difValor} ${caja.diferencia < 0 ? s.negativo : s.positivo}`}>
                                            {caja.diferencia > 0 ? '+' : ''}RD${parseFloat(caja.diferencia).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                <div className={s.gridDetalles}>
                                    <div className={s.detalleItem}>
                                        <span className={s.detLabel}>Inicial</span>
                                        <span className={s.detVal}>RD${parseFloat(caja.monto_inicial).toFixed(2)}</span>
                                    </div>
                                    <div className={s.detalleItem}>
                                        <span className={s.detLabel}>Ventas</span>
                                        <span className={s.detVal}>RD${parseFloat(caja.total_ventas).toFixed(2)}</span>
                                    </div>
                                    <div className={s.detalleItem}>
                                        <span className={s.detLabel}>Reportado</span>
                                        <span className={s.detVal}>RD${parseFloat(caja.monto_final).toFixed(2)}</span>
                                    </div>
                                    <div className={s.detalleItem}>
                                        <span className={s.detLabel}>Estado</span>
                                        <span className={s.detVal} style={{ textTransform: 'capitalize' }}>{caja.estado}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal de Cierre Forzado */}
            {modalCierre && (
                <div className={s.modalOverlay}>
                    <div className={`${s.modal} ${s[tema]}`}>
                        <div className={s.modalHeader}>
                            <h2 className={s.modalTitle}><Lock size={24} /> Forzar Cierre de Caja</h2>
                            <button onClick={cerrarModal} className={s.btnCerrar}><X size={24} /></button>
                        </div>

                        <p className="text-sm opacity-80 m-0">
                            Está a punto de cerrar administrativamente la caja <strong>#{modalCierre.numero_caja}</strong> de <strong>{modalCierre.nombre_empresa}</strong>.
                        </p>

                        <div>
                            <label className="text-sm font-bold block mb-2">Motivo del cierre (mín 10 car.)</label>
                            <textarea
                                value={motivoCierre}
                                onChange={(e) => setMotivoCierre(e.target.value)}
                                rows={3}
                                className={s.textarea}
                                placeholder="Ej: Cajero abandonó el puesto sin cerrar..."
                            />
                        </div>

                        <div className={s.modalFooter}>
                            <button onClick={cerrarModal} className={s.btnCancelar}>Cancelar</button>
                            <button
                                onClick={ejecutarCierreForzado}
                                disabled={cargando || motivoCierre.length < 10}
                                className={s.btnConfirmar}
                            >
                                {cargando ? 'Cerrando...' : 'Confirmar Cierre'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
