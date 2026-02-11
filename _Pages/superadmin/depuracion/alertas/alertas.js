'use client'

import {useState, useEffect} from 'react'
import {
    AlertTriangle,
    CheckCircle,
    X
} from 'lucide-react'
import {resolverAlerta as resolverAlertaAction} from '@/_Pages/superadmin/depuracion/alertas/servidor'
import s from './alertas.module.css'

export default function Alertas({alertasIniciales = []}) {
    const [alertas, setAlertas] = useState(alertasIniciales)
    const [filtroSeveridad, setFiltroSeveridad] = useState('todas')
    const [modalResolver, setModalResolver] = useState(null)
    const [accionesTomadas, setAccionesTomadas] = useState('')
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
        observer.observe(document.body, {attributes: true, attributeFilter: ['class']})
        return () => observer.disconnect()
    }, [])

    const alertasFiltradas = alertas.filter(alerta =>
        filtroSeveridad === 'todas' || alerta.severidad === filtroSeveridad
    )

    const handleResolverClick = (alerta) => {
        setModalResolver(alerta)
        setAccionesTomadas('')
    }

    const resolverAlerta = async () => {
        if (!accionesTomadas || accionesTomadas.trim().length < 5) {
            alert('Por favor, describa las acciones tomadas (mín 5 car.)')
            return
        }
        ;
        setCargando(true)
        try {
            const res = await resolverAlertaAction(modalResolver.id, accionesTomadas)
            if (res.success) {
                setAlertas(prev => prev.map(a =>
                    a.id === modalResolver.id ? {
                        ...a,
                        estado: 'resuelta',
                        fecha_resolucion: new Date().toISOString()
                    } : a
                ))
                setModalResolver(null)
                alert('Alerta resuelta correctamente')
            } else {
                alert('Error: ' + res.mensaje)
            }
        } catch (e) {
            console.error(e)
            alert('Error al comunicar con el servidor')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className={`${s.contenedor} ${s[tema]}`}>
            <div className={s.header}>
                <h1 className={s.titulo}>
                    <AlertTriangle className="w-8 h-8 text-red-600"/>
                    Centro de Alertas
                </h1>
                <p className={s.subtitulo}>
                    Gestión de incidencias y problemas del sistema
                </p>
            </div>

            {/* Filtros */}
            <div className={`${s.filtrosBar} ${s[tema]}`}>
                <select
                    value={filtroSeveridad}
                    onChange={(e) => setFiltroSeveridad(e.target.value)}
                    className={s.select}
                >
                    <option value="todas">Todas las severidades</option>
                    <option value="critica">Crítica</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                </select>
            </div>

            <div className={s.lista}>
                {alertasFiltradas.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                        No hay alertas activas que coincidan con los filtros.
                    </div>
                ) : (
                    alertasFiltradas.map(alerta => (
                        <div key={alerta.id} className={`${s.cardAlerta} ${s[tema]} ${s[alerta.severidad]}`}>
                            <div className="flex-1">
                                <div className={s.alertaMeta}>
                                    <span className={`${s.badgeSeveridad} ${s[alerta.severidad]}`}>
                                        {alerta.severidad}
                                    </span>
                                    <span
                                        className={s.fecha}>{new Date(alerta.fecha_generacion).toLocaleString('es-DO')}</span>
                                    <span className={s.empresa}>{alerta.nombre_empresa || 'SISTEMA'}</span>
                                </div>
                                <h3 className={s.alertaTitulo}>{alerta.titulo}</h3>
                                <p className={s.alertaDesc}>{alerta.descripcion}</p>
                            </div>
                            <div>
                                {alerta.estado === 'activa' ? (
                                    <button
                                        onClick={() => handleResolverClick(alerta)}
                                        className={s.btnResolver}
                                    >
                                        <CheckCircle className="w-4 h-4"/>
                                        Resolver
                                    </button>
                                ) : (
                                    <div className={s.estadoResuelta}>
                                        <CheckCircle className="w-4 h-4"/> Resuelta
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {modalResolver && (
                <div className={s.modalOverlay}>
                    <div className={`${s.modal} ${s[tema]}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className={s.modalTitle}>Resolver Alerta</h2>
                            <button onClick={() => setModalResolver(null)}
                                    className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{modalResolver.titulo}</p>
                        <textarea
                            className={s.textarea}
                            rows={4}
                            placeholder="Describa las acciones tomadas para resolver este problema..."
                            value={accionesTomadas}
                            onChange={(e) => setAccionesTomadas(e.target.value)}
                        />
                        <div className={s.modalFooter}>
                            <button onClick={() => setModalResolver(null)} className={s.btnSecundario}>Cancelar</button>
                            <button
                                onClick={resolverAlerta}
                                disabled={!accionesTomadas || cargando}
                                className={s.btnPrimario}
                            >
                                {cargando ? 'Guardando...' : 'Confirmar Resolución'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
