'use client'

import { useState } from 'react'
import {
    AlertTriangle,
    CheckCircle,
    Filter,
    Search,
    UserPlus
} from 'lucide-react'
import { resolverAlerta as resolverAlertaAction } from '@/_Pages/superadmin/depuracion/alertas/servidor'

export default function AlertasClient({ alertasIniciales = [] }) {
    const [alertas, setAlertas] = useState(alertasIniciales)
    const [filtroSeveridad, setFiltroSeveridad] = useState('todas')
    const [modalResolver, setModalResolver] = useState(null)
    const [accionesTomadas, setAccionesTomadas] = useState('')
    const [cargando, setCargando] = useState(false)

    const alertasFiltradas = alertas.filter(alerta =>
        filtroSeveridad === 'todas' || alerta.severidad === filtroSeveridad
    )

    const getSeveridadStyles = (severidad) => {
        switch (severidad) {
            case 'critica': return 'bg-red-100 text-red-800 border-red-200'
            case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            default: return 'bg-blue-100 text-blue-800 border-blue-200'
        }
    }

    const handleResolverClick = (alerta) => {
        setModalResolver(alerta)
        setAccionesTomadas('')
    }

    const resolverAlerta = async () => {
        if (!accionesTomadas) return;
        setCargando(true)
        try {
            const res = await resolverAlertaAction(modalResolver.id, accionesTomadas)
            if (res.success) {
                setAlertas(prev => prev.map(a =>
                    a.id === modalResolver.id ? { ...a, estado: 'resuelta', fecha_resolucion: new Date().toISOString() } : a
                ))
                setModalResolver(null)
                alert('Alerta resuelta')
            }
        } catch (e) {
            console.error(e)
            alert('Error al resolver alerta')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    Centro de Alertas
                </h1>
                <p className="text-gray-600 mt-2">
                    Gestión de incidencias y problemas del sistema
                </p>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex gap-4">
                <select
                    value={filtroSeveridad}
                    onChange={(e) => setFiltroSeveridad(e.target.value)}
                    className="border-gray-300 rounded-lg"
                >
                    <option value="todas">Todas las severidades</option>
                    <option value="critica">Crítica</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                </select>
            </div>

            <div className="space-y-4">
                {alertasFiltradas.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-xl border border-gray-200 text-gray-500">
                        No hay alertas activas con estos filtros.
                    </div>
                ) : (
                    alertasFiltradas.map(alerta => (
                        <div key={alerta.id} className={`bg-white p-6 rounded-xl shadow-sm border border-l-4 ${alerta.severidad === 'critica' ? 'border-l-red-500' :
                                alerta.severidad === 'alta' ? 'border-l-orange-500' : 'border-l-blue-500'
                            }`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getSeveridadStyles(alerta.severidad)}`}>
                                            {alerta.severidad}
                                        </span>
                                        <span className="text-sm text-gray-500">{new Date(alerta.fecha_generacion).toLocaleString()}</span>
                                        <span className="text-sm font-medium text-gray-700">{alerta.nombre_empresa}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{alerta.titulo}</h3>
                                    <p className="text-gray-600">{alerta.descripcion}</p>
                                </div>
                                <div>
                                    {alerta.estado === 'activa' ? (
                                        <button
                                            onClick={() => handleResolverClick(alerta)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Resolver
                                        </button>
                                    ) : (
                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" /> Resuelta
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {modalResolver && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Resolver Alerta</h2>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                            rows={4}
                            placeholder="Describa las acciones tomadas..."
                            value={accionesTomadas}
                            onChange={(e) => setAccionesTomadas(e.target.value)}
                        />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setModalResolver(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={resolverAlerta} disabled={!accionesTomadas || cargando} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                {cargando ? 'Guardando...' : 'Confirmar Resolución'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
