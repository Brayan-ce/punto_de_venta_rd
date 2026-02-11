'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    AlertTriangle,
    Users,
    ShoppingCart,
    CreditCard,
    Database,
    TrendingUp,
    Clock,
    XCircle,
    AlertCircle,
    Activity
} from 'lucide-react'

export default function DashboardDepuracionClient({
    estadisticas = {},
    empresasProblemas = []
}) {
    const [filtroTiempo, setFiltroTiempo] = useState('hoy')

    // Valores por defecto para evitar errores si estadisticas viene vacío
    const stats = {
        alertas: estadisticas.alertas || { critica: 0, alta: 0, media: 0, baja: 0 },
        suscripcionesVencidas: estadisticas.suscripcionesVencidas || 0,
        cajasAbiertas: estadisticas.cajasAbiertas || 0,
        duplicadosPendientes: estadisticas.duplicadosPendientes || 0,
        limitesExcedidos: estadisticas.limitesExcedidos || 0,
        ultimasAcciones: estadisticas.ultimasAcciones || []
    }

    const totalAlertas = stats.alertas.critica + stats.alertas.alta +
        stats.alertas.media + stats.alertas.baja

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Activity className="w-8 h-8 text-blue-600" />
                    Centro de Depuración y Auditoría
                </h1>
                <p className="text-gray-600 mt-2">
                    Control y supervisión del sistema completo
                </p>
            </div>

            {/* Tarjetas de estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {/* Alertas Totales */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Alertas</span>
                    </div>
                    <div className="mb-2">
                        <div className="text-3xl font-bold text-gray-900">{totalAlertas}</div>
                        <div className="text-sm text-gray-500">Activas</div>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                            {stats.alertas.critica} críticas
                        </span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                            {stats.alertas.alta} altas
                        </span>
                    </div>
                </div>

                {/* Suscripciones Vencidas */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <CreditCard className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Suscripciones</span>
                    </div>
                    <div className="mb-2">
                        <div className="text-3xl font-bold text-gray-900">
                            {stats.suscripcionesVencidas}
                        </div>
                        <div className="text-sm text-gray-500">Vencidas</div>
                    </div>
                    <div className="text-xs text-orange-600 font-medium">
                        Requieren atención
                    </div>
                </div>

                {/* Cajas Abiertas */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Cajas</span>
                    </div>
                    <div className="mb-2">
                        <div className="text-3xl font-bold text-gray-900">
                            {stats.cajasAbiertas}
                        </div>
                        <div className="text-sm text-gray-500">Abiertas &gt;24h</div>
                    </div>
                    <div className="text-xs text-yellow-600 font-medium">
                        Cierre pendiente
                    </div>
                </div>

                {/* Duplicados Pendientes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Duplicados</span>
                    </div>
                    <div className="mb-2">
                        <div className="text-3xl font-bold text-gray-900">
                            {stats.duplicadosPendientes}
                        </div>
                        <div className="text-sm text-gray-500">Clientes</div>
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                        Por revisar
                    </div>
                </div>

                {/* Límites Excedidos */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Límites</span>
                    </div>
                    <div className="mb-2">
                        <div className="text-3xl font-bold text-gray-900">
                            {stats.limitesExcedidos}
                        </div>
                        <div className="text-sm text-gray-500">Empresas</div>
                    </div>
                    <div className="text-xs text-purple-600 font-medium">
                        Exceden plan
                    </div>
                </div>
            </div>

            {/* Grid de 2 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Empresas con Problemas */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            Empresas con Problemas
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Requieren atención inmediata
                        </p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {empresasProblemas.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No hay empresas con problemas críticos detectados.
                            </div>
                        ) : (
                            empresasProblemas.map((empresa) => (
                                <div
                                    key={empresa.id}
                                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {empresa.nombre_empresa}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {empresa.problema_principal}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${empresa.estado_suscripcion === 'vencida'
                                                    ? 'bg-red-100 text-red-700'
                                                    : empresa.estado_suscripcion === 'suspendida'
                                                        ? 'bg-gray-100 text-gray-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}
                                        >
                                            {empresa.estado_suscripcion || 'Desconocido'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1 text-gray-600">
                                            <AlertCircle className="w-4 h-4" />
                                            {empresa.alertas_activas || 0} alertas
                                        </span>
                                        <span
                                            className={`flex items-center gap-1 ${(empresa.usuarios_actuales > empresa.limite_usuarios)
                                                    ? 'text-red-600 font-medium'
                                                    : 'text-gray-600'
                                                }`}
                                        >
                                            <Users className="w-4 h-4" />
                                            {empresa.usuarios_actuales || 0}/{empresa.limite_usuarios || 0} usuarios
                                        </span>
                                        {empresa.dias_hasta_vencimiento < 0 && (
                                            <span className="text-red-600 font-medium text-xs">
                                                Vencida hace {Math.abs(empresa.dias_hasta_vencimiento)} días
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {empresasProblemas.length > 0 && (
                        <div className="p-4 border-t border-gray-200">
                            <Link href="/superadmin/depuracion/suscripciones" className="block w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm">
                                Ver todas las empresas →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Últimas Acciones de Auditoría */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-600" />
                            Últimas Acciones
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Registro de actividad reciente
                        </p>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                        {stats.ultimasAcciones.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No hay acciones registradas recientemente.
                            </div>
                        ) : (
                            stats.ultimasAcciones.map((accion) => (
                                <div
                                    key={accion.id}
                                    className="p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`p-2 rounded-lg ${accion.modulo === 'clientes'
                                                    ? 'bg-blue-100'
                                                    : accion.modulo === 'cajas'
                                                        ? 'bg-yellow-100'
                                                        : accion.modulo === 'suscripciones'
                                                            ? 'bg-purple-100'
                                                            : 'bg-gray-100'
                                                }`}
                                        >
                                            {accion.modulo === 'clientes' && (
                                                <Users className="w-4 h-4 text-blue-600" />
                                            )}
                                            {accion.modulo === 'cajas' && (
                                                <ShoppingCart className="w-4 h-4 text-yellow-600" />
                                            )}
                                            {accion.modulo === 'suscripciones' && (
                                                <CreditCard className="w-4 h-4 text-purple-600" />
                                            )}
                                            {!['clientes', 'cajas', 'suscripciones'].includes(accion.modulo) && (
                                                <Activity className="w-4 h-4 text-gray-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {accion.descripcion}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {accion.nombre_empresa || 'Sistema'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                <span>{accion.usuario_nombre}</span>
                                                <span>•</span>
                                                <span>{new Date(accion.fecha_accion).toLocaleString('es-DO')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 border-t border-gray-200">
                        <Link href="/superadmin/depuracion/auditoria" className="block w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm">
                            Ver auditoría completa →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Accesos rápidos */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/superadmin/depuracion/clientes" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow block">
                    <Users className="w-8 h-8 mb-3" />
                    <div className="text-lg font-bold">Depurar Clientes</div>
                    <div className="text-sm opacity-90 mt-1">
                        Fusionar y limpiar duplicados
                    </div>
                </Link>
                <Link href="/superadmin/depuracion/cajas" className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow block">
                    <Clock className="w-8 h-8 mb-3" />
                    <div className="text-lg font-bold">Control de Cajas</div>
                    <div className="text-sm opacity-90 mt-1">
                        Cerrar cajas abiertas
                    </div>
                </Link>
                <Link href="/superadmin/depuracion/suscripciones" className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow block">
                    <CreditCard className="w-8 h-8 mb-3" />
                    <div className="text-lg font-bold">Suscripciones</div>
                    <div className="text-sm opacity-90 mt-1">
                        Gestionar pagos y planes
                    </div>
                </Link>
                <Link href="/superadmin/depuracion/alertas" className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow block">
                    <AlertTriangle className="w-8 h-8 mb-3" />
                    <div className="text-lg font-bold">Centro de Alertas</div>
                    <div className="text-sm opacity-90 mt-1">
                        Resolver problemas críticos
                    </div>
                </Link>
            </div>
        </div>
    )
}
