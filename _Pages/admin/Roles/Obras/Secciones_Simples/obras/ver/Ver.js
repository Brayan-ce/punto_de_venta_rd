"use client"
import { useState, useEffect } from 'react'
import { obtenerObraSimple, cambiarEstadoObra } from '../servidor'
import estilos from './ver.module.css'

const ESTADOS_OBRA = {
    activa: { label: 'Activa', color: '#10b981', icon: 'checkmark-circle' },
    pausada: { label: 'Pausada', color: '#f59e0b', icon: 'pause-circle' },
    finalizada: { label: 'Finalizada', color: '#0284c7', icon: 'checkmark-done-circle' },
    cancelada: { label: 'Cancelada', color: '#ef4444', icon: 'close-circle' }
}

export default function Ver({ obraId, onVolver }) {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [obra, setObra] = useState(null)

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        
        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }
        
        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)
        
        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        cargarObra()
    }, [obraId])

    async function cargarObra() {
        setCargando(true)
        const res = await obtenerObraSimple(obraId)
        if (res.success) {
            setObra(res.obra)
        } else {
            alert('Error al cargar la obra')
            onVolver()
        }
        setCargando(false)
    }

    async function handleCambiarEstado(nuevoEstado) {
        if (!confirm(`¿Cambiar estado de la obra a "${ESTADOS_OBRA[nuevoEstado].label}"?`)) {
            return
        }

        const res = await cambiarEstadoObra(obraId, nuevoEstado)
        if (res.success) {
            cargarObra()
        } else {
            alert(res.mensaje || 'Error al cambiar estado')
        }
    }

    function calcularProgreso() {
        if (!obra.fecha_inicio || !obra.fecha_fin_estimada) return 0
        
        const inicio = new Date(obra.fecha_inicio)
        const fin = new Date(obra.fecha_fin_estimada)
        const hoy = new Date()
        
        const totalDias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24))
        const diasTranscurridos = Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))
        
        return Math.min(Math.max((diasTranscurridos / totalDias) * 100, 0), 100)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando obra...</span>
                </div>
            </div>
        )
    }

    if (!obra) {
        return null
    }

    const estado = ESTADOS_OBRA[obra.estado] || ESTADOS_OBRA.activa
    const progreso = calcularProgreso()
    const presupuestoEjecutado = obra.total_gastos || 0
    const porcentajePresupuesto = obra.presupuesto_total > 0 
        ? (presupuestoEjecutado / obra.presupuesto_total) * 100 
        : 0

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <button className={estilos.btnVolver} onClick={onVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver
                </button>
            </div>

            <div className={estilos.obraHeader} style={{ borderTopColor: obra.color_identificacion }}>
                <div className={estilos.obraTitulo}>
                    <h1 className={estilos.titulo}>{obra.nombre}</h1>
                    <span className={estilos.codigo}>{obra.codigo_obra}</span>
                </div>
                <div className={estilos.estadoBadge} style={{ background: estado.color }}>
                    <ion-icon name={estado.icon}></ion-icon>
                    {estado.label}
                </div>
            </div>

            <div className={estilos.grid}>
                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="information-circle-outline"></ion-icon>
                        Información General
                    </h3>

                    <div className={estilos.infoGrid}>
                        {obra.descripcion && (
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>Descripción</span>
                                <span className={estilos.valor}>{obra.descripcion}</span>
                            </div>
                        )}

                        {obra.direccion && (
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>Dirección</span>
                                <span className={estilos.valor}>{obra.direccion}</span>
                            </div>
                        )}

                        {obra.cliente_nombre && (
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>Cliente</span>
                                <span className={estilos.valor}>{obra.cliente_nombre}</span>
                            </div>
                        )}

                        {obra.cliente_telefono && (
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>Teléfono Cliente</span>
                                <span className={estilos.valor}>{obra.cliente_telefono}</span>
                            </div>
                        )}

                        {obra.cliente_email && (
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>Email Cliente</span>
                                <span className={estilos.valor}>{obra.cliente_email}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={estilos.sidebar}>
                    <div className={estilos.seccion}>
                        <h3 className={estilos.seccionTitulo}>
                            <ion-icon name="stats-chart-outline"></ion-icon>
                            Estadísticas
                        </h3>

                        <div className={estilos.statsGrid}>
                            <div className={estilos.statCard}>
                                <ion-icon name="people-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statValor}>{obra.total_trabajadores || 0}</span>
                                    <span className={estilos.statLabel}>Trabajadores</span>
                                </div>
                            </div>

                            <div className={estilos.statCard}>
                                <ion-icon name="wallet-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statValor}>RD$ {presupuestoEjecutado.toLocaleString()}</span>
                                    <span className={estilos.statLabel}>Gastado</span>
                                </div>
                            </div>

                            <div className={estilos.statCard}>
                                <ion-icon name="checkmark-done-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statValor}>{obra.total_asistencias || 0}</span>
                                    <span className={estilos.statLabel}>Asistencias</span>
                                </div>
                            </div>

                            <div className={estilos.statCard}>
                                <ion-icon name="images-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statValor}>{obra.total_fotos || 0}</span>
                                    <span className={estilos.statLabel}>Fotos</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.seccion}>
                        <h3 className={estilos.seccionTitulo}>
                            <ion-icon name="settings-outline"></ion-icon>
                            Cambiar Estado
                        </h3>

                        <div className={estilos.estadosGrid}>
                            {Object.entries(ESTADOS_OBRA).map(([key, est]) => (
                                <button
                                    key={key}
                                    className={`${estilos.estadoBtn} ${obra.estado === key ? estilos.estadoActivo : ''}`}
                                    onClick={() => handleCambiarEstado(key)}
                                    disabled={obra.estado === key}
                                >
                                    <ion-icon name={est.icon}></ion-icon>
                                    {est.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={estilos.seccion}>
                <h3 className={estilos.seccionTitulo}>
                    <ion-icon name="calendar-outline"></ion-icon>
                    Fechas y Presupuesto
                </h3>

                <div className={estilos.infoGrid}>
                    {obra.fecha_inicio && (
                        <div className={estilos.infoItem}>
                            <span className={estilos.label}>Fecha de Inicio</span>
                            <span className={estilos.valor}>{new Date(obra.fecha_inicio).toLocaleDateString()}</span>
                        </div>
                    )}

                    {obra.fecha_fin_estimada && (
                        <div className={estilos.infoItem}>
                            <span className={estilos.label}>Fecha Fin Estimada</span>
                            <span className={estilos.valor}>{new Date(obra.fecha_fin_estimada).toLocaleDateString()}</span>
                        </div>
                    )}

                    {obra.presupuesto_total > 0 && (
                        <>
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>Presupuesto Total</span>
                                <span className={estilos.valor}>RD$ {obra.presupuesto_total.toLocaleString()}</span>
                            </div>

                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>Gastado</span>
                                <span className={estilos.valor}>RD$ {presupuestoEjecutado.toLocaleString()}</span>
                            </div>

                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>Saldo Disponible</span>
                                <span className={estilos.valor}>RD$ {(obra.presupuesto_total - presupuestoEjecutado).toLocaleString()}</span>
                            </div>
                        </>
                    )}
                </div>

                {obra.presupuesto_total > 0 && (
                    <div className={estilos.presupuesto}>
                        <div className={estilos.presupuestoHeader}>
                            <span>Ejecución Presupuestaria</span>
                            <span className={porcentajePresupuesto > 90 ? estilos.alerta : ''}>
                                {porcentajePresupuesto.toFixed(1)}%
                            </span>
                        </div>
                        <div className={estilos.barra}>
                            <div 
                                className={`${estilos.barraProgreso} ${porcentajePresupuesto > 90 ? estilos.barraDanger : ''}`}
                                style={{ width: `${Math.min(porcentajePresupuesto, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {progreso > 0 && (
                    <div className={estilos.presupuesto}>
                        <div className={estilos.presupuestoHeader}>
                            <span>Progreso en Tiempo</span>
                            <span>{progreso.toFixed(1)}%</span>
                        </div>
                        <div className={estilos.barra}>
                            <div 
                                className={estilos.barraProgreso}
                                style={{ width: `${Math.min(progreso, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {obra.notas && (
                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="document-text-outline"></ion-icon>
                        Notas
                    </h3>
                    <p className={estilos.notas}>{obra.notas}</p>
                </div>
            )}
        </div>
    )
}