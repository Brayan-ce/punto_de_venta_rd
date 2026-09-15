"use client"
import { useState, useEffect } from 'react'
import { obtenerObraSimple, cambiarEstadoObra, obtenerMaterialesObra, eliminarGastoObraSimple } from '../servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './ver.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const ESTADOS_OBRA = {
    activa: { label: 'Activa', labelEn: 'Active', color: '#10b981', icon: 'checkmark-circle' },
    pausada: { label: 'Pausada', labelEn: 'Paused', color: '#f59e0b', icon: 'pause-circle' },
    finalizada: { label: 'Finalizada', labelEn: 'Finished', color: '#0284c7', icon: 'checkmark-done-circle' },
    cancelada: { label: 'Cancelada', labelEn: 'Cancelled', color: '#ef4444', icon: 'close-circle' }
}

export default function Ver({ obraId, onVolver }) {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [obra, setObra] = useState(null)
    const [moneda, setMoneda] = useState('DOP RD$')
    const [materiales, setMateriales] = useState([])
    const [eliminandoId, setEliminandoId] = useState(null)
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

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
            if (res.moneda) {
                setMoneda(`${res.moneda.codigo} ${res.moneda.simbolo}`)
            }
            const resMat = await obtenerMaterialesObra(obraId)
            if (resMat.success) setMateriales(resMat.materiales || [])
        } else {
            alert(tr('Error al cargar la obra', 'Error loading project'))
            onVolver()
        }
        setCargando(false)
    }

    async function handleEliminarMaterial(gastoId) {
        if (!confirm(tr('¿Eliminar este registro de material?', 'Delete this material record?'))) return
        setEliminandoId(gastoId)
        const res = await eliminarGastoObraSimple(gastoId, obraId)
        setEliminandoId(null)
        if (res.success) {
            setMateriales(prev => prev.filter(m => m.id !== gastoId))
            cargarObra()
        } else {
            alert(res.mensaje || tr('Error al eliminar', 'Error deleting'))
        }
    }

    async function handleCambiarEstado(nuevoEstado) {
        if (!confirm(tr(`¿Cambiar estado de la obra a "${language === 'en' ? ESTADOS_OBRA[nuevoEstado].labelEn : ESTADOS_OBRA[nuevoEstado].label}"?`, `Change project status to "${ESTADOS_OBRA[nuevoEstado].labelEn}"?`))) {
            return
        }

        const res = await cambiarEstadoObra(obraId, nuevoEstado)
        if (res.success) {
            cargarObra()
        } else {
            alert(res.mensaje || tr('Error al cambiar estado', 'Error changing status'))
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
        return <LoadingScreen />
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
                    {tr('Volver', 'Back')}
                </button>
            </div>

            <div className={estilos.obraHeader} style={{ borderTopColor: obra.color_identificacion }}>
                <div className={estilos.obraTitulo}>
                    <h1 className={estilos.titulo}>{obra.nombre}</h1>
                    <span className={estilos.codigo}>{obra.codigo_obra}</span>
                </div>
                <div className={estilos.estadoBadge} style={{ background: estado.color }}>
                    <ion-icon name={estado.icon}></ion-icon>
                    {language === 'en' ? estado.labelEn : estado.label}
                </div>
            </div>

            <div className={estilos.grid}>
                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="information-circle-outline"></ion-icon>
                        {tr('Información General', 'General Information')}
                    </h3>

                    <div className={estilos.infoGrid}>
                        {obra.descripcion && (
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>{tr('Descripción', 'Description')}</span>
                                <span className={estilos.valor}>{obra.descripcion}</span>
                            </div>
                        )}

                        {obra.direccion && (
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>{tr('Dirección', 'Address')}</span>
                                <span className={estilos.valor}>{obra.direccion}</span>
                            </div>
                        )}

                        {obra.cliente_nombre && (
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>{tr('Cliente', 'Client')}</span>
                                <span className={estilos.valor}>{obra.cliente_nombre}</span>
                            </div>
                        )}

                        {obra.cliente_telefono && (
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>{tr('Teléfono Cliente', 'Client Phone')}</span>
                                <span className={estilos.valor}>{obra.cliente_telefono}</span>
                            </div>
                        )}

                        {obra.cliente_email && (
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>{tr('Email Cliente', 'Client Email')}</span>
                                <span className={estilos.valor}>{obra.cliente_email}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={estilos.sidebar}>
                    <div className={estilos.seccion}>
                        <h3 className={estilos.seccionTitulo}>
                            <ion-icon name="stats-chart-outline"></ion-icon>
                            {tr('Estadísticas', 'Statistics')}
                        </h3>

                        <div className={estilos.statsGrid}>
                            <div className={estilos.statCard}>
                                <ion-icon name="people-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statValor}>{obra.total_trabajadores || 0}</span>
                                    <span className={estilos.statLabel}>{tr('Trabajadores', 'Workers')}</span>
                                </div>
                            </div>

                            <div className={estilos.statCard}>
                                <ion-icon name="wallet-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statValor}>{moneda} {presupuestoEjecutado.toLocaleString()}</span>
                                    <span className={estilos.statLabel}>{tr('Gastado', 'Spent')}</span>
                                </div>
                            </div>

                            <div className={estilos.statCard}>
                                <ion-icon name="checkmark-done-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statValor}>{obra.total_asistencias || 0}</span>
                                    <span className={estilos.statLabel}>{tr('Asistencias', 'Attendance')}</span>
                                </div>
                            </div>

                            <div className={estilos.statCard}>
                                <ion-icon name="images-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statValor}>{obra.total_fotos || 0}</span>
                                    <span className={estilos.statLabel}>{tr('Fotos', 'Photos')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.seccion}>
                        <h3 className={estilos.seccionTitulo}>
                            <ion-icon name="settings-outline"></ion-icon>
                            {tr('Cambiar Estado', 'Change Status')}
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
                                    {language === 'en' ? est.labelEn : est.label}
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
                            <span className={estilos.label}>{tr('Fecha de Inicio', 'Start Date')}</span>
                            <span className={estilos.valor}>{new Date(obra.fecha_inicio).toLocaleDateString()}</span>
                        </div>
                    )}

                    {obra.fecha_fin_estimada && (
                        <div className={estilos.infoItem}>
                            <span className={estilos.label}>{tr('Fecha Fin Estimada', 'Estimated End Date')}</span>
                            <span className={estilos.valor}>{new Date(obra.fecha_fin_estimada).toLocaleDateString()}</span>
                        </div>
                    )}

                    {obra.presupuesto_total > 0 && (
                        <>
                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>{tr('Presupuesto Total', 'Total Budget')}</span>
                                <span className={estilos.valor}>{moneda} {obra.presupuesto_total.toLocaleString()}</span>
                            </div>

                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>{tr('Gastado', 'Spent')}</span>
                                <span className={estilos.valor}>{moneda} {presupuestoEjecutado.toLocaleString()}</span>
                            </div>

                            <div className={estilos.infoItem}>
                                <span className={estilos.label}>{tr('Saldo Disponible', 'Available Balance')}</span>
                                <span className={estilos.valor}>{moneda} {(obra.presupuesto_total - presupuestoEjecutado).toLocaleString()}</span>
                            </div>
                        </>
                    )}
                </div>

                {obra.presupuesto_total > 0 && (
                    <div className={estilos.presupuesto}>
                        <div className={estilos.presupuestoHeader}>
                            <span>{tr('Ejecución Presupuestaria', 'Budget Execution')}</span>
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
                            <span>{tr('Progreso en Tiempo', 'Time Progress')}</span>
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

            <div className={estilos.seccion}>
                <h3 className={estilos.seccionTitulo}>
                    <ion-icon name="cube-outline"></ion-icon>
                    Costo de materiales
                </h3>
                <div className={estilos.tablaMaterialesWrap}>
                    {materiales.length === 0 ? (
                        <p className={estilos.materialesVacio}>{tr('No hay registros de materiales para esta obra.', 'No material records for this project.')}</p>
                    ) : (
                        <>
                            <table className={estilos.tablaMateriales}>
                                <thead>
                                    <tr>
                                        <th>{tr('Concepto', 'Concept')}</th>
                                        <th>{tr('Monto', 'Amount')}</th>
                                        <th>{tr('Fecha', 'Date')}</th>
                                        <th>{tr('Registrado por', 'Registered by')}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materiales.map(m => (
                                        <tr key={m.id}>
                                            <td>
                                                <span className={estilos.conceptoCell}>{m.concepto}</span>
                                                {m.descripcion && <span className={estilos.descripcionCell}>{m.descripcion}</span>}
                                            </td>
                                            <td className={estilos.montoCell}>{moneda} {Number(m.monto).toLocaleString()}</td>
                                            <td>{m.fecha ? new Date(m.fecha).toLocaleDateString() : '-'}</td>
                                            <td>{m.registrado_por_nombre || '-'}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={estilos.btnEliminarGasto}
                                                    onClick={() => handleEliminarMaterial(m.id)}
                                                    disabled={eliminandoId === m.id}
                                                    title="Eliminar"
                                                >
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className={estilos.totalMateriales}>
                                {tr('Total materiales:', 'Total materials:')} {moneda} {materiales.reduce((s, m) => s + Number(m.monto), 0).toLocaleString()}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {obra.notas && (
                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="document-text-outline"></ion-icon>
                        {tr('Notas', 'Notes')}
                    </h3>
                    <p className={estilos.notas}>{obra.notas}</p>
                </div>
            )}
        </div>
    )
}