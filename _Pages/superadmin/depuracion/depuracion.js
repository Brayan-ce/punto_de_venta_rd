'use client'

import { useState, useEffect } from 'react'
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
    Activity,
    DollarSign
} from 'lucide-react'
import s from './depuracion.module.css'

export default function Depuracion({
    estadisticas = {},
    empresasProblemas = []
}) {
    const [tema, setTema] = useState('light')

    useEffect(() => {
        // Detectar tema del body (el layout principal suele poner 'dark-mode' o algo similar)
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
        <div className={`${s.contenedor} ${s[tema]}`}>
            {/* Header */}
            <div className={s.header}>
                <h1 className={s.titulo}>
                    <Activity className="w-8 h-8 text-blue-600" />
                    Centro de Depuración y Auditoría
                </h1>
                <p className={s.subtitulo}>
                    Control y supervisión del sistema completo
                </p>
            </div>

            {/* Tarjetas de estadísticas principales */}
            <div className={s.statsGrid}>
                {/* Alertas Totales */}
                <div className={`${s.statCard} ${s[tema]}`}>
                    <div className={s.statHeader}>
                        <div className={`${s.iconWrapper} ${s.red}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <span className={s.statLabel}>Alertas</span>
                    </div>
                    <div>
                        <div className={s.statValue}>{totalAlertas}</div>
                        <div className={s.statSubtext}>Activas</div>
                    </div>
                    <div className={s.badges}>
                        <span className={`${s.badge} bg-red-100 text-red-700`}>
                            {stats.alertas.critica} críticas
                        </span>
                        <span className={`${s.badge} bg-orange-100 text-orange-700`}>
                            {stats.alertas.alta} altas
                        </span>
                    </div>
                </div>

                {/* Suscripciones Vencidas */}
                <div className={`${s.statCard} ${s[tema]}`}>
                    <div className={s.statHeader}>
                        <div className={`${s.iconWrapper} ${s.orange}`}>
                            <CreditCard size={24} />
                        </div>
                        <span className={s.statLabel}>Suscripciones</span>
                    </div>
                    <div>
                        <div className={s.statValue}>{stats.suscripcionesVencidas}</div>
                        <div className={s.statSubtext}>Vencidas</div>
                    </div>
                    <div className="text-xs text-orange-600 font-medium">
                        Requieren atención
                    </div>
                </div>

                {/* Cajas Abiertas */}
                <div className={`${s.statCard} ${s[tema]}`}>
                    <div className={s.statHeader}>
                        <div className={`${s.iconWrapper} ${s.yellow}`}>
                            <Clock size={24} />
                        </div>
                        <span className={s.statLabel}>Cajas</span>
                    </div>
                    <div>
                        <div className={s.statValue}>{stats.cajasAbiertas}</div>
                        <div className={s.statSubtext}>Abiertas &gt;24h</div>
                    </div>
                    <div className="text-xs text-yellow-600 font-medium">
                        Cierre pendiente
                    </div>
                </div>

                {/* Duplicados Pendientes */}
                <div className={`${s.statCard} ${s[tema]}`}>
                    <div className={s.statHeader}>
                        <div className={`${s.iconWrapper} ${s.blue}`}>
                            <Users size={24} />
                        </div>
                        <span className={s.statLabel}>Duplicados</span>
                    </div>
                    <div>
                        <div className={s.statValue}>{stats.duplicadosPendientes}</div>
                        <div className={s.statSubtext}>Clientes</div>
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                        Por revisar
                    </div>
                </div>

                {/* Límites Excedidos */}
                <div className={`${s.statCard} ${s[tema]}`}>
                    <div className={s.statHeader}>
                        <div className={`${s.iconWrapper} ${s.purple}`}>
                            <TrendingUp size={24} />
                        </div>
                        <span className={s.statLabel}>Límites</span>
                    </div>
                    <div>
                        <div className={s.statValue}>{stats.limitesExcedidos}</div>
                        <div className={s.statSubtext}>Empresas</div>
                    </div>
                    <div className="text-xs text-purple-600 font-medium">
                        Exceden plan
                    </div>
                </div>
            </div>

            {/* Grid de 2 columnas */}
            <div className={s.mainGrid}>
                {/* Empresas con Problemas */}
                <div className={`${s.panel} ${s[tema]}`}>
                    <div className={s.panelHeader}>
                        <h2 className={s.panelTitle}>
                            <XCircle className="w-5 h-5 text-red-600" />
                            Empresas con Problemas
                        </h2>
                        <p className={s.panelSub}>Requieren atención inmediata</p>
                    </div>
                    <div className={s.panelBody}>
                        {empresasProblemas.length === 0 ? (
                            <div className={s.emptyState}>
                                No hay empresas con problemas críticos detectados.
                            </div>
                        ) : (
                            empresasProblemas.map((empresa) => (
                                <div key={empresa.id} className={s.listItem}>
                                    <div className={s.itemHeader}>
                                        <div>
                                            <h3 className={s.itemTitle}>{empresa.nombre_empresa}</h3>
                                            <p className={s.itemDesc}>{empresa.problema_principal}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${empresa.estado_suscripcion === 'vencida' ? 'bg-red-100 text-red-700' :
                                            empresa.estado_suscripcion === 'suspendida' ? 'bg-gray-100 text-gray-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {empresa.estado_suscripcion || 'Desconocido'}
                                        </span>
                                    </div>
                                    <div className={s.itemMeta}>
                                        <span><AlertCircle size={14} /> {empresa.alertas_activas || 0} alertas</span>
                                        <span className={(empresa.usuarios_actuales > empresa.limite_usuarios) ? 'text-red-600 font-medium' : ''}>
                                            <Users size={14} /> {empresa.usuarios_actuales || 0}/{empresa.limite_usuarios || 0} usuarios
                                        </span>
                                        {empresa.dias_hasta_vencimiento < 0 && (
                                            <span className="text-red-600 font-medium">Vencida hace {Math.abs(empresa.dias_hasta_vencimiento)} días</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {empresasProblemas.length > 0 && (
                        <div className={s.panelFooter}>
                            <Link href="/superadmin/depuracion/suscripciones" className={s.footerLink}>
                                Ver todas las empresas →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Últimas Acciones de Auditoría */}
                <div className={`${s.panel} ${s[tema]}`}>
                    <div className={s.panelHeader}>
                        <h2 className={s.panelTitle}>
                            <Database className="w-5 h-5 text-blue-600" />
                            Últimas Acciones
                        </h2>
                        <p className={s.panelSub}>Registro de actividad reciente</p>
                    </div>
                    <div className={s.panelBody}>
                        {stats.ultimasAcciones.length === 0 ? (
                            <div className={s.emptyState}>
                                No hay acciones registradas recientemente.
                            </div>
                        ) : (
                            stats.ultimasAcciones.map((accion) => (
                                <div key={accion.id} className={s.listItem}>
                                    <div className="flex gap-3">
                                        <div className={`${s.iconWrapper} ${accion.modulo === 'clientes' ? s.blue :
                                            accion.modulo === 'cajas' ? s.yellow :
                                                accion.modulo === 'suscripciones' ? s.purple : s.gray
                                            } p-2`}>
                                            {accion.modulo === 'clientes' && <Users size={16} />}
                                            {accion.modulo === 'cajas' && <ShoppingCart size={16} />}
                                            {accion.modulo === 'suscripciones' && <CreditCard size={16} />}
                                            {!['clientes', 'cajas', 'suscripciones'].includes(accion.modulo) && <Activity size={16} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium m-0">{accion.descripcion}</p>
                                            <p className="text-xs text-gray-500 m-0 mt-1">{accion.nombre_empresa || 'Sistema'}</p>
                                            <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
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
                    <div className={s.panelFooter}>
                        <Link href="/superadmin/depuracion/auditoria" className={s.footerLink}>
                            Ver auditoría completa →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Accesos rápidos */}
            <div className={s.quickAccess}>
                <Link href="/superadmin/depuracion/clientes" className={`${s.accessCard} ${s.blue}`}>
                    <Users className={s.accessIcon} />
                    <div>
                        <div className={s.accessTitle}>Depurar Clientes</div>
                        <div className={s.accessDesc}>Fusionar y limpiar duplicados</div>
                    </div>
                </Link>
                <Link href="/superadmin/depuracion/cajas" className={`${s.accessCard} ${s.yellow}`}>
                    <Clock className={s.accessIcon} />
                    <div>
                        <div className={s.accessTitle}>Control de Cajas</div>
                        <div className={s.accessDesc}>Cerrar cajas abiertas</div>
                    </div>
                </Link>
                <Link href="/superadmin/depuracion/suscripciones" className={`${s.accessCard} ${s.purple}`}>
                    <CreditCard className={s.accessIcon} />
                    <div>
                        <div className={s.accessTitle}>Suscripciones</div>
                        <div className={s.accessDesc}>Gestionar pagos y planes</div>
                    </div>
                </Link>
                <Link href="/superadmin/depuracion/alertas" className={`${s.accessCard} ${s.red}`}>
                    <AlertTriangle className={s.accessIcon} />
                    <div>
                        <div className={s.accessTitle}>Centro de Alertas</div>
                        <div className={s.accessDesc}>Resolver problemas críticos</div>
                    </div>
                </Link>
                <Link href="/superadmin/depuracion/ventas" className={`${s.accessCard} ${s.green}`}>
                    <DollarSign className={s.accessIcon} />
                    <div>
                        <div className={s.accessTitle}>Depurar Ventas</div>
                        <div className={s.accessDesc}>Control de facturación anómala</div>
                    </div>
                </Link>
            </div>
        </div>
    )
}
