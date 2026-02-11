'use client'

import { useState } from 'react'
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
    FileText
} from 'lucide-react'
import {
    suspenderSuscripcion as suspenderSuscripcionAction,
    activarSuscripcion as activarSuscripcionAction
} from '@/_Pages/superadmin/depuracion/suscripciones/servidor'

export default function GestionSuscripcionesClient({ suscripcionesIniciales = [] }) {
    const [suscripciones, setSuscripciones] = useState(suscripcionesIniciales)
    const [filtroEstado, setFiltroEstado] = useState('todas')
    const [busqueda, setBusqueda] = useState('')
    const [modalAccion, setModalAccion] = useState(null)
    const [accionTipo, setAccionTipo] = useState(null) // 'suspender', 'activar', 'pago'
    const [motivo, setMotivo] = useState('')
    const [diasExtension, setDiasExtension] = useState(30)
    const [montoPago, setMontoPago] = useState('')
    const [cargando, setCargando] = useState(false)

    // Filtrar suscripciones
    const suscripcionesFiltradas = suscripciones.filter(sub => {
        const coincideEstado = filtroEstado === 'todas' || sub.estado === filtroEstado
        const coincideBusqueda =
            (sub.nombre_empresa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (sub.rnc || '').includes(busqueda)

        return coincideEstado && coincideBusqueda
    })

    // Helper functions for styles
    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'activa': return 'bg-green-100 text-green-700 border-green-300'
            case 'vencida': return 'bg-red-100 text-red-700 border-red-300'
            case 'suspendida': return 'bg-gray-100 text-gray-700 border-gray-300'
            case 'prueba': return 'bg-blue-100 text-blue-700 border-blue-300'
            default: return 'bg-gray-100 text-gray-700 border-gray-300'
        }
    }

    const getPlanColor = (planTipo) => {
        switch (planTipo) {
            case 'basico': return 'bg-blue-50 text-blue-700'
            case 'profesional': return 'bg-purple-50 text-purple-700'
            case 'empresarial': return 'bg-orange-50 text-orange-700'
            default: return 'bg-gray-50 text-gray-700'
        }
    }

    const abrirModal = (suscripcion, tipo) => {
        setModalAccion(suscripcion)
        setAccionTipo(tipo)
        setMotivo('')
        setMontoPago(suscripcion.monto_mensual ? suscripcion.monto_mensual.toString() : '0')
    }

    const cerrarModal = () => {
        setModalAccion(null)
        setAccionTipo(null)
        setMotivo('')
        setDiasExtension(30)
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
                            ? { ...s, estado: 'activa', bloqueada: 0, dias_restantes: diasExtension } // aproximado dias_restantes
                            : s
                    ))
                }
            } else if (accionTipo === 'pago') {
                // Placeholder logic if needed in future
                alert("Acción de pago simulada (no implementada en servidor aún)")
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

    // Comprobar límites
    const doesExceedLimits = (sub) => {
        return (sub.usuarios_actuales > sub.limite_usuarios) || (sub.productos_actuales > sub.limite_productos)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-purple-600" />
                    Gestión de Suscripciones
                </h1>
                <p className="text-gray-600 mt-2">
                    Control de planes, pagos y límites por empresa
                </p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total</div>
                    <div className="text-2xl font-bold text-gray-900">{suscripciones.length}</div>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <div className="text-sm text-green-600 mb-1">Activas</div>
                    <div className="text-2xl font-bold text-green-700">
                        {suscripciones.filter(s => s.estado === 'activa').length}
                    </div>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                    <div className="text-sm text-red-600 mb-1">Vencidas</div>
                    <div className="text-2xl font-bold text-red-700">
                        {suscripciones.filter(s => s.estado === 'vencida').length}
                    </div>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Suspendidas</div>
                    <div className="text-2xl font-bold text-gray-700">
                        {suscripciones.filter(s => s.estado === 'suspendida').length}
                    </div>
                </div>
                <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                    <div className="text-sm text-orange-600 mb-1">Exceden Límites</div>
                    <div className="text-2xl font-bold text-orange-700">
                        {suscripciones.filter(s => doesExceedLimits(s)).length}
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por empresa o RNC..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="todas">Todos los estados</option>
                        <option value="activa">Activas</option>
                        <option value="vencida">Vencidas</option>
                        <option value="suspendida">Suspendidas</option>
                        <option value="prueba">En prueba</option>
                    </select>
                </div>
            </div>

            {/* Lista de suscripciones */}
            <div className="space-y-4">
                {suscripcionesFiltradas.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-gray-200 text-gray-500">
                        No hay suscripciones que coincidan con los filtros.
                    </div>
                ) : (
                    suscripcionesFiltradas.map((sub) => (
                        <div
                            key={sub.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Building2 className="w-6 h-6 text-gray-400" />
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {sub.nombre_empresa}
                                            </h3>
                                            <p className="text-sm text-gray-600">RNC: {sub.rnc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getPlanColor(sub.plan_tipo)}`}>
                                            {sub.plan_nombre}
                                        </span>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getEstadoColor(sub.estado)}`}>
                                            {sub.estado.toUpperCase()}
                                        </span>
                                        {sub.bloqueada === 1 && (
                                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                                                BLOQUEADA
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                    {/* Fechas */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Fechas</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-gray-600">Vencimiento</p>
                                                    <p className="font-medium text-gray-900">
                                                        {new Date(sub.fecha_vencimiento).toLocaleDateString('es-DO')}
                                                    </p>
                                                    {sub.dias_restantes < 0 ? (
                                                        <p className="text-red-600 text-xs font-medium">
                                                            Vencida hace {Math.abs(sub.dias_restantes)} días
                                                        </p>
                                                    ) : sub.dias_restantes <= 7 ? (
                                                        <p className="text-orange-600 text-xs font-medium">
                                                            Vence en {sub.dias_restantes} días
                                                        </p>
                                                    ) : (
                                                        <p className="text-green-600 text-xs font-medium">
                                                            {sub.dias_restantes} días restantes
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Límites */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Límites</h4>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-gray-600">Usuarios</span>
                                                    <span className={`font-medium ${sub.usuarios_actuales > sub.limite_usuarios ? 'text-red-600' : 'text-gray-900'
                                                        }`}>
                                                        {sub.usuarios_actuales}/{sub.limite_usuarios}
                                                    </span>
                                                </div>
                                                {/* Progress bar logic - simplified */}
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className={`h-2 rounded-full ${sub.usuarios_actuales > sub.limite_usuarios ? 'bg-red-600' : 'bg-green-500'}`} style={{ width: `${Math.min((sub.usuarios_actuales / sub.limite_usuarios) * 100, 100)}%` }}></div>
                                                </div>
                                            </div>

                                            <div>
                                                {/* Similar logic for products if needed */}
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-gray-600">Productos (Info no disponible)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Facturación */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Facturación</h4>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <p className="text-gray-600">Monto Mensual</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    RD${(sub.monto_mensual || 0).toLocaleString('es-DO')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Acciones</h4>
                                        <div className="space-y-2">
                                            {sub.estado === 'suspendida' || sub.estado === 'vencida' ? (
                                                <button
                                                    onClick={() => abrirModal(sub, 'activar')}
                                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <PlayCircle className="w-4 h-4" />
                                                    Activar
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => abrirModal(sub, 'suspender')}
                                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                    Suspender
                                                </button>
                                            )}

                                            <button
                                                onClick={() => abrirModal(sub, 'pago')}
                                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                                Registrar Pago
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Acciones */}
            {modalAccion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                        <div className={`${accionTipo === 'suspender' ? 'bg-gradient-to-r from-red-600 to-red-700' :
                                accionTipo === 'activar' ? 'bg-gradient-to-r from-green-600 to-green-700' :
                                    'bg-gradient-to-r from-blue-600 to-blue-700'
                            } text-white p-6 rounded-t-2xl`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-3">
                                        {accionTipo === 'suspender' && <><Ban className="w-7 h-7" /> Suspender Suscripción</>}
                                        {accionTipo === 'activar' && <><PlayCircle className="w-7 h-7" /> Activar Suscripción</>}
                                        {accionTipo === 'pago' && <><DollarSign className="w-7 h-7" /> Registrar Pago</>}
                                    </h2>
                                    <p className="text-blue-100 mt-1">{modalAccion.nombre_empresa}</p>
                                </div>
                                <button onClick={cerrarModal} className="p-2 hover:bg-opacity-20 hover:bg-white rounded-lg transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {accionTipo === 'suspender' && (
                                <>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-yellow-800">
                                                <p className="font-medium mb-1">Esta acción:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Marcará la suscripción como "suspendida"</li>
                                                    <li>Bloqueará el acceso de todos los usuarios de la empresa</li>
                                                    <li>Preservará todos los datos de la empresa</li>
                                                    <li>Generará una alerta en el sistema</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Motivo de la suspensión (mínimo 10 caracteres) *
                                        </label>
                                        <textarea
                                            value={motivo}
                                            onChange={(e) => setMotivo(e.target.value)}
                                            rows={3}
                                            placeholder="Ej: Falta de pago desde hace 15 días. Múltiples intentos de contacto sin respuesta."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{motivo.length}/10 caracteres</p>
                                    </div>
                                </>
                            )}

                            {accionTipo === 'activar' && (
                                <>
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-green-800">
                                                <p className="font-medium mb-1">Esta acción:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Activará la suscripción</li>
                                                    <li>Desbloqueará el acceso para los usuarios</li>
                                                    <li>Extenderá el vencimiento según los días especificados</li>
                                                    <li>Resolverá las alertas relacionadas</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Días de extensión
                                        </label>
                                        <input
                                            type="number"
                                            value={diasExtension}
                                            onChange={(e) => setDiasExtension(Number(e.target.value))}
                                            min={1}
                                            max={365}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Nuevo vencimiento: {new Date(Date.now() + diasExtension * 24 * 60 * 60 * 1000).toLocaleDateString('es-DO')}
                                        </p>
                                    </div>
                                </>
                            )}

                            {accionTipo === 'pago' && (
                                <div className="text-center py-4 text-gray-500 italic">
                                    Funcionalidad de pago simplificada para demostración.
                                </div>
                            )}


                            <div className="flex gap-3">
                                <button
                                    onClick={cerrarModal}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={ejecutarAccion}
                                    disabled={
                                        cargando ||
                                        (accionTipo === 'suspender' && motivo.length < 10)
                                    }
                                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${accionTipo === 'suspender' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                            accionTipo === 'activar' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                                'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    {cargando ? (
                                        'Procesando...'
                                    ) : (
                                        <>
                                            {accionTipo === 'suspender' && 'Confirmar Suspensión'}
                                            {accionTipo === 'activar' && 'Confirmar Activación'}
                                            {accionTipo === 'pago' && 'Registrar Pago'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
