'use client'

import { useState } from 'react'
import {
    ShoppingCart,
    Clock,
    AlertTriangle,
    X,
    Lock,
    Search,
    FileText,
    DollarSign
} from 'lucide-react'
import {
    forzarCierreCaja as forzarCierreCajaAction
} from '@/_Pages/superadmin/depuracion/cajas/servidor'

export default function ControlCajasClient({ cajasAbiertasIniciales = [], cajasInconsistentesIniciales = [] }) {
    const [cajasAbiertas, setCajasAbiertas] = useState(cajasAbiertasIniciales)
    const [cajasInconsistentes, setCajasInconsistentes] = useState(cajasInconsistentesIniciales)
    const [tabActiva, setTabActiva] = useState('abiertas') // abiertas, inconsistencias
    const [modalCierre, setModalCierre] = useState(null)
    const [motivoCierre, setMotivoCierre] = useState('')
    const [cargando, setCargando] = useState(false)

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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-yellow-600" />
                    Control de Cajas
                </h1>
                <p className="text-gray-600 mt-2">
                    Gestión de cierres forzados y análisis de inconsistencias
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setTabActiva('abiertas')}
                    className={`pb-3 px-4 font-medium transition-colors border-b-2 ${tabActiva === 'abiertas'
                            ? 'border-yellow-600 text-yellow-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Cajas Abiertas ({cajasAbiertas.length})
                </button>
                <button
                    onClick={() => setTabActiva('inconsistencias')}
                    className={`pb-3 px-4 font-medium transition-colors border-b-2 ${tabActiva === 'inconsistencias'
                            ? 'border-red-600 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Inconsistencias ({cajasInconsistentes.length})
                </button>
            </div>

            {tabActiva === 'abiertas' && (
                <div className="space-y-4">
                    {cajasAbiertas.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-gray-200 text-gray-500">
                            No hay cajas abiertas pendientes de revisión (más de 24h).
                        </div>
                    ) : (
                        cajasAbiertas.map(caja => (
                            <div key={caja.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-bold text-lg text-gray-900">Caja #{caja.numero_caja}</span>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{caja.nombre_empresa}</span>
                                        {caja.horas_abierta > 48 && (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                         > 48h
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>Usuario: <span className="font-medium">{caja.usuario_nombre}</span></p>
                                        <p className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            Abierta hace {caja.horas_abierta} horas ({new Date(caja.fecha_apertura).toLocaleString('es-DO')})
                                        </p>
                                        <p>Monto Inicial: RD$ {parseFloat(caja.monto_inicial).toFixed(2)}</p>
                                        <p>Ventas actuales: RD$ {parseFloat(caja.total_ventas || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => abrirModalCierre(caja)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <Lock className="w-4 h-4" />
                                    Forzar Cierre
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tabActiva === 'inconsistencias' && (
                <div className="space-y-4">
                    {cajasInconsistentes.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-gray-200 text-gray-500">
                            No hay cajas con inconsistencias graves registradas.
                        </div>
                    ) : (
                        cajasInconsistentes.map(caja => (
                            <div key={caja.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">Caja #{caja.numero_caja} - {caja.nombre_empresa}</h3>
                                        <p className="text-sm text-gray-500">Cerrada por: {caja.usuario_nombre}</p>
                                        <p className="text-xs text-gray-400">{new Date(caja.fecha_cierre).toLocaleString('es-DO')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Diferencia</p>
                                        <p className={`text-xl font-bold ${caja.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {caja.diferencia > 0 ? '+' : ''}RD$ {parseFloat(caja.diferencia).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <span className="block text-gray-500 text-xs">Monto Inicial</span>
                                        <span className="font-medium">RD$ {parseFloat(caja.monto_inicial).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs">Ventas Totales</span>
                                        <span className="font-medium">RD$ {parseFloat(caja.total_ventas).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs">Monto Final (Reportado)</span>
                                        <span className="font-medium">RD$ {parseFloat(caja.monto_final).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs">Estado</span>
                                        <span className="font-medium capitalize">{caja.estado}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal de Cierre Forzado */}
            {modalCierre && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
                                <Lock className="w-6 h-6" />
                                Forzar Cierre de Caja
                            </h2>
                            <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-4 text-sm">
                            Está a punto de cerrar administrativamente la caja <strong>#{modalCierre.numero_caja}</strong> de <strong>{modalCierre.nombre_empresa}</strong>.
                            El sistema calculará los totales basándose en las ventas registradas.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Motivo del cierre *
                            </label>
                            <textarea
                                value={motivoCierre}
                                onChange={(e) => setMotivoCierre(e.target.value)}
                                rows={3}
                                placeholder="Ej: Cajero abandonó el puesto sin cerrar..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={cerrarModal}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={ejecutarCierreForzado}
                                disabled={cargando || motivoCierre.length < 10}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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
